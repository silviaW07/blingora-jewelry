import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const ROOT_DIR = path.resolve('.');
const OUT_DIR = path.resolve('lib/rpc-generated');

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  await ensureDir(OUT_DIR);
  
  // Scan for actions in:
  // - 'src/actions' dir (legacy)
  // - 'src/*/actions' dir (new structure)
  // - 'app' dir
  const patterns = [
    'src/actions/**/*.ts',           // Legacy: src/actions/**/*.ts
    'src/**/actions/*.ts',         // New: src/xxx/actions/**/*.ts
    'app/**/actions.ts'               // App directory actions
  ];
  const files = await glob(patterns, { nodir: true });

  for (const file of files) {
    // Get relative path from project root
    const relPath = path.relative(ROOT_DIR, file);
    const modulePathWithoutExt = relPath.replace(/\.ts$/, '');
    
    // Output path mirrors the source structure inside lib/rpc-generated
    const outPath = path.join(OUT_DIR, `${modulePathWithoutExt}.ts`);

    // Calculate relative import path for the type definition
    // We need to import the original file for types.
    let relImport = path.relative(path.dirname(outPath), file).replace(/\\/g, '/').replace(/\.ts$/, '');
    if (!relImport.startsWith('.')) relImport = './' + relImport;

    const src = await fs.readFile(file, 'utf8');
    
    // 匹配两种导出形式：
    // 1. export async function xxx(...) - 普通函数导出
    // 2. export const xxx = ... - 各种包装函数导出
    const functionExports = Array.from(src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g), m => m[1]);
    // 匹配 export const xxx = 后面跟着:
    // - require* (如 requireAuth, requireRole)
    // - withResult
    // - async (或 async :
    // - 直接的箭头函数 (
    const constFunctionExports = Array.from(
      src.matchAll(/export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:require\w*|withResult|async\s*[\(:]|\()/g),
      m => m[1]
    );
    // Alias exports only: `export const getHomeCategoryGuide = getCategoryList`
    // (RHS must be a bare identifier — not require*/withResult/async/( which are covered above)
    const constAliasExports = Array.from(
      src.matchAll(/export\s+const\s+([A-Za-z0-9_]+)\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:;|$)/gm),
      (m) => {
        const rhs = m[2];
        // Skip keywords accidentally captured as aliases
        if (rhs === 'async' || rhs === 'await' || rhs === 'require' || rhs === 'withResult') return '';
        return m[1];
      },
    ).filter(Boolean);
    const exportedNames = [...new Set([
      ...functionExports,
      ...constFunctionExports,
      ...constAliasExports,
    ])];
    
    if (!exportedNames.length) continue;

    // The RPC method name MUST match what the server registry expects
    // e.g. "app.backend.foo.actions.myFunc"
    const rpcModuleName = modulePathWithoutExt.replace(/\\/g, '/').replace(/\//g, '.');

    const content = `/* Auto-generated */
import { rpcCall } from '@/tools/rpc-client';
type Actions = typeof import('${relImport}');

${exportedNames.map(name => 
`export const ${name} = (...args: Parameters<Actions["${name}"]>) => 
  rpcCall<Awaited<ReturnType<Actions["${name}"]>>>("${rpcModuleName}.${name}", ...args);`
).join('\n')}
`;
    await ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, content);
  }

  // 生成 action_utils 代理文件（前端用，避免引入 prisma 等后端依赖）
  const platforms = ['frontend', 'backend', 'app'];
  for (const platform of platforms) {
    const proxyPath = path.join(OUT_DIR, `src/${platform}/action_utils.ts`);
    const proxyContent = `/* Auto-generated - 前端类型代理，避免引入后端依赖 */
export * from '../../../../src/${platform}/action_utils.type';
`;
    await ensureDir(path.dirname(proxyPath));
    await fs.writeFile(proxyPath, proxyContent);
  }
}

main().catch(console.error);
