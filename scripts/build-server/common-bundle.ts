import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

// ─── Types ───────────────────────────────────────────────────────────

export interface CommonBundleOptions {
  projectRoot: string;
  outDir: string;
  /** 各平台 action_utils 路径（可能部分不存在） */
  actionUtilsPaths: Record<string, string>;
}

export interface CommonBundleResult {
  success: boolean;
  outputFile: string;
  /** 实际包含的模块列表 */
  includedModules: string[];
  errors?: string[];
  duration: number;
}

// ─── buildCommonBundle ───────────────────────────────────────────────

/**
 * 构建 _common.js 公共依赖包
 *
 * 1. 动态生成临时入口文件 _common_entry.ts
 * 2. 使用 esbuild bundle 为 _common.js
 * 3. 删除临时入口文件
 * 4. 返回 CommonBundleResult
 */
export async function buildCommonBundle(
  options: CommonBundleOptions
): Promise<CommonBundleResult> {
  const { projectRoot, outDir, actionUtilsPaths } = options;
  const startTime = performance.now();

  const absOutDir = path.resolve(projectRoot, outDir);
  const entryFile = path.join(absOutDir, '_common_entry.ts');
  const outfile = path.join(absOutDir, '_common.js');

  // Track which modules are included
  const includedModules: string[] = [];

  try {
    // Ensure output directory exists
    fs.mkdirSync(absOutDir, { recursive: true });

    // ── Generate temporary entry file ──────────────────────────────────
    // Compute relative paths from outDir to source files
    const relToSrc = path.relative(absOutDir, path.resolve(projectRoot, 'src'));
    const relToPrismaGen = path.relative(
      absOutDir,
      path.resolve(projectRoot, 'prisma-generated/client')
    );

    const lines: string[] = [];

    // Static exports — these modules should exist at build time
    // Re-export prisma default export directly (the Proxy instance)
    // 注意：不能用 export * as prisma，会创建 namespace 对象导致 __toESM 二次包装
    lines.push(
      `export { default as prisma } from '${relToSrc}/tools/prisma';`
    );
    includedModules.push('prisma');

    lines.push(
      `export * as BaseActionFun from '${relToSrc}/@base/BaseActionFun';`
    );
    includedModules.push('BaseActionFun');

    lines.push(
      `export { default as serializer, serialize, deserialize } from '${relToSrc}/utils/serializer';`
    );
    includedModules.push('serializer');

    const relToThirdpartyContext = path.relative(
      absOutDir,
      path.resolve(projectRoot, 'server/thirdparty/context.ts')
    );
    lines.push(
      `export { authContext } from '${relToThirdpartyContext}';`
    );
    includedModules.push('authContext');

    // PrismaClient — may not exist, use try-catch require
    lines.push(
      `export const PrismaClient = (() => { try { return require('${relToPrismaGen}'); } catch { return {}; } })();`
    );
    includedModules.push('PrismaClient');

    // Dynamic exports for each platform's action_utils (try-catch require fallback)
    for (const [platform, utilsPath] of Object.entries(actionUtilsPaths)) {
      const relPath = path.relative(
        absOutDir,
        path.resolve(projectRoot, utilsPath)
      );
      // Export key follows the convention: {platform}Auth
      const exportKey = `${platform}Auth`;
      lines.push(
        `export const ${exportKey} = (() => { try { return require('${relPath}'); } catch { return {}; } })();`
      );
      includedModules.push(exportKey);
    }

    const entryContent = lines.join('\n') + '\n';
    fs.writeFileSync(entryFile, entryContent, 'utf-8');

    // ── esbuild plugin: stub missing prisma-generated/client ──────────
    const prismaClientStubPlugin: esbuild.Plugin = {
      name: 'prisma-client-stub',
      setup(build) {
        // Intercept prisma-generated/client imports; provide a stub if missing
        build.onResolve({ filter: /prisma-generated\/client/ }, (args) => {
          const absPath = path.resolve(
            args.resolveDir,
            args.path
          );
          // Check common locations
          const candidates = [
            absPath,
            absPath + '.ts',
            absPath + '.js',
            path.join(absPath, 'index.ts'),
            path.join(absPath, 'index.js'),
            path.join(absPath, 'index.d.ts'),
          ];
          const exists = candidates.some((c) => fs.existsSync(c));
          if (!exists) {
            return {
              path: 'prisma-generated/client',
              namespace: 'prisma-client-stub',
            };
          }
          return undefined; // let esbuild resolve normally
        });

        build.onLoad(
          { filter: /.*/, namespace: 'prisma-client-stub' },
          () => ({
            contents: `module.exports = {};`,
            loader: 'js',
          })
        );
      },
    };

    // ── esbuild bundle ─────────────────────────────────────────────────
    const result = await esbuild.build({
      entryPoints: [entryFile],
      outfile,
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      bundle: true,
      sourcemap: false,
      external: ['express', 'jose', 'superjson', 'stripe', 'alipay-sdk'],
      plugins: [prismaClientStubPlugin],
      logLevel: 'silent',
      absWorkingDir: projectRoot,
    });

    const duration = Math.round(performance.now() - startTime);

    if (result.errors.length > 0) {
      return {
        success: false,
        outputFile: outfile,
        includedModules,
        errors: result.errors.map((e) => e.text),
        duration,
      };
    }

    return {
      success: true,
      outputFile: outfile,
      includedModules,
      duration,
    };
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);

    // esbuild throws BuildFailure with .errors array
    const errors: string[] = [];
    if (err.errors && Array.isArray(err.errors)) {
      for (const e of err.errors) {
        errors.push(e.text ?? String(e));
      }
    } else {
      errors.push(err.message ?? String(err));
    }

    return {
      success: false,
      outputFile: outfile,
      includedModules,
      errors,
      duration,
    };
  } finally {
    // Always clean up the temporary entry file
    try {
      fs.unlinkSync(entryFile);
    } catch {
      /* ignore — file may not have been created */
    }
  }
}
