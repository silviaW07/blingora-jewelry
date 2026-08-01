#!/usr/bin/env node
/**
 * 快速生成 server/registry.ts
 * 纯 Node.js 实现，无 ts-node 开销（~10ms vs ~1.4s）
 */

import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const ROOT_DIR = process.cwd();
const OUT_FILE = path.resolve(ROOT_DIR, 'server/registry.ts');

async function main() {
  const patterns = [
    'src/actions/**/*.ts',
    'src/**/actions/*.ts',
    'app/**/actions.ts'
  ];
  
  const files = await glob(patterns, { nodir: true, cwd: ROOT_DIR });

  const imports = [];
  const registrations = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const importPath = path.relative(path.dirname(OUT_FILE), path.join(ROOT_DIR, file))
      .replace(/\.ts$/, '')
      .replace(/\\/g, '/');
    const safeImportPath = importPath.startsWith('.') ? importPath : `./${importPath}`;
    
    const alias = `mod_${i}`;
    imports.push(`import * as ${alias} from '${safeImportPath}';`);
    
    const moduleName = file.replace(/\.ts$/, '').replace(/\\/g, '/').replace(/\//g, '.');
    registrations.push(`  '${moduleName}': ${alias},`);
  }

  const content = `/* Auto-generated */
${imports.join('\n')}

export const registry: Record<string, any> = {
${registrations.join('\n')}
};
`;

  await fs.writeFile(OUT_FILE, content);
  console.log(`Generated server registry with ${files.length} modules.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
