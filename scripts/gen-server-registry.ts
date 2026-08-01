import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const ROOT_DIR = path.resolve('.');
const OUT_FILE = path.resolve('server/registry.ts');

async function main() {
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

  const imports: string[] = [];
  const registrations: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Import path relative to server/registry.ts
    // server/registry.ts is in 'server/', so we need to go up one level if file is in root
    const importPath = path.relative(path.dirname(OUT_FILE), file).replace(/\.ts$/, '').replace(/\\/g, '/');
    const safeImportPath = importPath.startsWith('.') ? importPath : `./${importPath}`;
    
    const alias = `mod_${i}`;
    imports.push(`import * as ${alias} from '${safeImportPath}';`);
    const relPath = path.relative(ROOT_DIR, file);
    const moduleName = relPath.replace(/\.ts$/, '').replace(/\\/g, '/').replace(/\//g, '.');
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

main().catch(console.error);
