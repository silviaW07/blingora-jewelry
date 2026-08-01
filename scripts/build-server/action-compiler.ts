import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

// ─── Types ───────────────────────────────────────────────────────────

export interface CompileOptions {
  /** action 源文件路径，如 src/backend/actions/Register.ts */
  sourceFile: string;
  /** 输出目录，默认 server-action-generated/ */
  outDir: string;
  /** 项目根目录 */
  projectRoot: string;
}

export interface CompileResult {
  success: boolean;
  /** 输出文件路径 */
  outputFile?: string;
  /** 错误信息（含文件路径和行号） */
  errors?: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
  }>;
  /** 编译耗时（ms） */
  duration: number;
}

// ─── CommonRedirectPlugin ────────────────────────────────────────────

interface CommonPattern {
  filter: RegExp;
  exportKey: string;
}

const COMMON_PATTERNS: CommonPattern[] = [
  { filter: /^@\/tools\/prisma(-proxy)?$/, exportKey: 'prisma' },
  { filter: /^@\/@base\/BaseActionFun$/, exportKey: 'BaseActionFun' },
  { filter: /^@\/(frontend|backend|app)\/action_utils$/, exportKey: '$1Auth' },
  { filter: /^@\/utils\/serializer$/, exportKey: 'serializer' },
  { filter: /prisma-generated\/client/, exportKey: 'PrismaClient' },
];

/**
 * esbuild 插件：将公共依赖的 import 重写为 require('./_common').xxx
 *
 * 拦截的 import 路径：
 * - @/tools/prisma, @/tools/prisma-proxy → require('./_common').prisma
 * - @/@base/BaseActionFun → require('./_common').BaseActionFun
 * - @/{platform}/action_utils → require('./_common').{platform}Auth
 * - @/utils/serializer → require('./_common').serializer
 * - prisma-generated/client → require('./_common').PrismaClient
 *
 * NOTE: This plugin also handles `@/` alias resolution for non-common paths,
 * because esbuild's built-in `alias` runs before plugins and would prevent
 * the plugin from intercepting common dependency paths.
 */
export function commonRedirectPlugin(outDir?: string): esbuild.Plugin {
  return {
    name: 'common-redirect',
    setup(build) {
      // 1) Intercept common dependency paths and redirect to virtual modules.
      //    Use a broad filter that covers all common aliased paths, prisma-generated,
      //    and Prisma runtime library imports that must stay local to _common.js.
      const combinedFilter = /^(@\/|prisma-generated\/|@prisma\/client\/runtime\/library$)/;

      build.onResolve({ filter: combinedFilter }, (args) => {
        if (args.path === '@prisma/client/runtime/library') {
          return {
            path: args.path,
            namespace: 'prisma-runtime-compat',
          };
        }

        // Check each common pattern
        for (const pattern of COMMON_PATTERNS) {
          const match = args.path.match(pattern.filter);
          if (match) {
            let exportKey = pattern.exportKey;
            if (exportKey.includes('$1') && match[1]) {
              exportKey = exportKey.replace('$1', match[1]);
            }
            return {
              path: args.path,
              namespace: 'common-redirect',
              pluginData: { exportKey },
            };
          }
        }

        // 2) For non-common @/ paths, resolve as alias
        if (args.path.startsWith('@/')) {
          // Special case: @/thirdparty → server/thirdparty
          if (args.path.startsWith('@/thirdparty')) {
            const serverDir = path.resolve(build.initialOptions.absWorkingDir ?? '.', 'server/thirdparty');
            const basePath = args.path.replace(/^@\/thirdparty/, serverDir);
            const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx', '.js', '/index.js'];
            for (const ext of extensions) {
              if (fs.existsSync(basePath + ext)) {
                return { path: basePath + ext };
              }
            }
            return { path: basePath + '.ts' };
          }

          const srcDir = build.initialOptions.alias?.['@']
            ?? path.resolve(build.initialOptions.absWorkingDir ?? '.', 'src');
          const basePath = args.path.replace(/^@\//, srcDir + '/');
          const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx', '.js', '/index.js'];
          for (const ext of extensions) {
            if (fs.existsSync(basePath + ext)) {
              return { path: basePath + ext };
            }
          }
          return { path: basePath + '.ts' };
        }

        return undefined;
      });

      // Also intercept relative prisma-generated/client paths
      build.onResolve({ filter: /prisma-generated\/client/ }, (args) => {
        // Only match if not already in common-redirect namespace
        if (args.namespace === 'common-redirect') return undefined;
        return {
          path: args.path,
          namespace: 'common-redirect',
          pluginData: { exportKey: 'PrismaClient' },
        };
      });

      // Mark ./_common as external so esbuild doesn't try to bundle it.
      // The require('./_common') in virtual modules should remain as-is in output.
      build.onResolve({ filter: /^\.?\/?_common$/ }, () => ({
        path: './_common',
        external: true,
      }));

      build.onLoad({ filter: /.*/, namespace: 'common-redirect' }, (args) => {
        const key = args.pluginData.exportKey;
        return {
          contents: `module.exports = require('./_common').${key};`,
          loader: 'js',
          resolveDir: path.resolve(build.initialOptions.absWorkingDir ?? '.'),
        };
      });

      build.onLoad({ filter: /.*/, namespace: 'prisma-runtime-compat' }, () => ({
        contents: `
          const prismaClientModule = require('./_common').PrismaClient || {};
          const Prisma = prismaClientModule.Prisma || {};

          module.exports = {
            Prisma,
            Decimal: Prisma.Decimal,
            DbNull: Prisma.DbNull,
            JsonNull: Prisma.JsonNull,
            AnyNull: Prisma.AnyNull,
            NullTypes: Prisma.NullTypes,
          };
        `,
        loader: 'js',
        resolveDir: path.resolve(build.initialOptions.absWorkingDir ?? '.'),
      }));
    },
  };
}

// ─── compileAction ───────────────────────────────────────────────────

/**
 * Encode a source file path as a flat output filename.
 * e.g. "src/backend/actions/Register.ts" → "src.backend.actions.Register.js"
 */
function encodeOutputFilename(sourceFile: string): string {
  return sourceFile
    .replace(/\.tsx?$/, '')   // strip .ts / .tsx extension
    .replace(/[\\/]/g, '.')   // replace path separators with dots
    + '.js';
}

/**
 * 编译单个 action 文件
 */
export async function compileAction(options: CompileOptions): Promise<CompileResult> {
  const { sourceFile, outDir, projectRoot } = options;
  const startTime = performance.now();

  const outputFilename = encodeOutputFilename(sourceFile);
  const outfile = path.resolve(projectRoot, outDir, outputFilename);
  const entryPoint = path.resolve(projectRoot, sourceFile);

  try {
    // 使用 stdin 模式避免 esbuild 扫描项目目录（在大文件数项目中 entryPoints 模式会触发
    // esbuild 对 absWorkingDir 做目录遍历，导致严重性能问题）
    const sourceContent = fs.readFileSync(entryPoint, 'utf8');
    const result = await esbuild.build({
      stdin: {
        contents: sourceContent,
        loader: 'ts',
        resolveDir: projectRoot,
        sourcefile: sourceFile,
      },
      outfile,
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      bundle: true,
      sourcemap: false,
      external: ['express', '@prisma/client/runtime/*', 'stripe', 'alipay-sdk'],
      plugins: [commonRedirectPlugin(outDir)],
      // NOTE: @/ alias is handled by commonRedirectPlugin (not esbuild alias)
      // because esbuild alias runs before plugins and would prevent the plugin
      // from intercepting common dependency paths.
      absWorkingDir: projectRoot,
      // 显式传空 tsconfigRaw，阻止 esbuild 沿目录树查找 tsconfig.json
      tsconfigRaw: { compilerOptions: {} },
      logLevel: 'silent',
    });

    const duration = Math.round(performance.now() - startTime);

    if (result.errors.length > 0) {
      return {
        success: false,
        errors: result.errors.map((e) => ({
          file: e.location?.file ?? sourceFile,
          line: e.location?.line ?? 0,
          column: e.location?.column ?? 0,
          message: e.text,
        })),
        duration,
      };
    }

    return {
      success: true,
      outputFile: outfile,
      duration,
    };
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);

    // esbuild throws BuildFailure with .errors array
    if (err.errors && Array.isArray(err.errors)) {
      return {
        success: false,
        errors: err.errors.map((e: esbuild.Message) => ({
          file: e.location?.file ?? sourceFile,
          line: e.location?.line ?? 0,
          column: e.location?.column ?? 0,
          message: e.text,
        })),
        duration,
      };
    }

    return {
      success: false,
      errors: [
        {
          file: sourceFile,
          line: 0,
          column: 0,
          message: err.message ?? String(err),
        },
      ],
      duration,
    };
  }
}
