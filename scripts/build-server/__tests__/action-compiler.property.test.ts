/**
 * Property-based tests for CommonRedirectPlugin (Property 3)
 *
 * Feature: incremental-server-action-build, Property 3: TypeScript 路径别名解析
 *
 * **Validates: Requirements 1.4**
 *
 * For any action source file using @/ path aliases, Action_Compiler should
 * successfully compile. Common dependency paths should be rewritten by
 * CommonRedirectPlugin to require('./_common').xxx. Non-common @/ paths
 * should be resolved via alias.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import * as path from 'path';
import * as fs from 'fs';
import { compileAction } from '../action-compiler';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const TEST_OUT_DIR = 'server-action-generated-prop-test';
const TEST_OUT_ABS = path.resolve(PROJECT_ROOT, TEST_OUT_DIR);

// Common dependency patterns and their expected _common export keys
const COMMON_DEPS: Array<{
  importPath: string;
  expectedKey: string;
  importName: string;
}> = [
  { importPath: '@/tools/prisma', expectedKey: 'prisma', importName: 'prisma' },
  { importPath: '@/tools/prisma-proxy', expectedKey: 'prisma', importName: 'prismaProxy' },
  { importPath: '@/@base/BaseActionFun', expectedKey: 'BaseActionFun', importName: 'BaseActionFun' },
  { importPath: '@/frontend/action_utils', expectedKey: 'frontendAuth', importName: 'frontendAuth' },
  { importPath: '@/backend/action_utils', expectedKey: 'backendAuth', importName: 'backendAuth' },
  { importPath: '@/app/action_utils', expectedKey: 'appAuth', importName: 'appAuth' },
  { importPath: '@/utils/serializer', expectedKey: 'serializer', importName: 'serializer' },
  { importPath: '../../prisma-generated/client', expectedKey: 'PrismaClient', importName: 'PrismaClient' },
];

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function writeTempAction(relPath: string, content: string): string {
  const absPath = path.resolve(PROJECT_ROOT, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, 'utf-8');
  return relPath;
}

function removeTempAction(relPath: string): void {
  const absPath = path.resolve(PROJECT_ROOT, relPath);
  try { fs.unlinkSync(absPath); } catch { /* ignore */ }
}

beforeAll(() => {
  // Ensure the output directory exists for compiled artifacts
  fs.mkdirSync(TEST_OUT_ABS, { recursive: true });
});

afterAll(() => {
  cleanDir(TEST_OUT_ABS);
});

describe('Property 3: TypeScript 路径别名解析', { timeout: 120_000 }, () => {
  // Arbitrary for picking 1+ common deps from the list
  const commonDepsArb = fc
    .shuffledSubarray(COMMON_DEPS, { minLength: 1, maxLength: COMMON_DEPS.length })
    .filter((arr) => {
      // Ensure unique importNames to avoid duplicate variable declarations
      const names = arr.map((d) => d.importName);
      return new Set(names).size === names.length;
    });

  it(
    'common dependency imports are rewritten to require("./_common").xxx',
    async () => {
      await fc.assert(
        fc.asyncProperty(commonDepsArb, async (deps) => {
          // Build a temp action file that imports from the selected common deps
          const imports = deps
            .map((d) => `import ${d.importName} from '${d.importPath}';`)
            .join('\n');
          const exports = deps
            .map((d) => `  ${d.importName}`)
            .join(',\n');
          const content = `${imports}\nexport default {\n${exports}\n};\n`;

          const fileName = `__prop3_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const relPath = `src/backend/actions/${fileName}.ts`;

          try {
            writeTempAction(relPath, content);

            const result = await compileAction({
              sourceFile: relPath,
              outDir: TEST_OUT_DIR,
              projectRoot: PROJECT_ROOT,
            });

            // Compilation must succeed
            expect(result.success).toBe(true);
            expect(result.outputFile).toBeDefined();

            const output = fs.readFileSync(result.outputFile!, 'utf-8');

            // Each common dep should be rewritten to require('./_common').{expectedKey}
            for (const dep of deps) {
              expect(output).toContain(
                `require("./_common").${dep.expectedKey}`
              );
            }

            // Output should NOT contain direct source path requires for common deps
            for (const dep of deps) {
              if (dep.importPath.startsWith('@/')) {
                const srcPath = dep.importPath.replace(/^@\//, '');
                // Should not find a require that resolves to the original source path
                expect(output).not.toMatch(
                  new RegExp(
                    `require\\(["'][^"']*${srcPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']\\)`
                  )
                );
              }
            }

            // Clean up output file
            try { fs.unlinkSync(result.outputFile!); } catch { /* ignore */ }
          } finally {
            removeTempAction(relPath);
          }
        }),
        { numRuns: 10 }
      );
    }
  );
});


// ─── Property 1: 编译产生输出文件 ────────────────────────────────────
/**
 * Feature: incremental-server-action-build, Property 1: 编译产生输出文件
 *
 * **Validates: Requirements 1.1**
 *
 * For any valid TypeScript action source file src/{platform}/actions/{PageName}.ts,
 * after calling Action_Compiler, the output directory should contain
 * src.{platform}.actions.{PageName}.js.
 */
describe('Property 1: 编译产生输出文件', { timeout: 120_000 }, () => {
  const platformArb = fc.constantFrom('frontend', 'backend', 'app');
  const pageNameArb = fc.stringMatching(/^[A-Z][A-Za-z0-9]{1,20}$/);

  it('compiled output file exists with correctly encoded name', async () => {
    await fc.assert(
      fc.asyncProperty(platformArb, pageNameArb, async (platform, pageName) => {
        const relPath = `src/${platform}/actions/${pageName}.ts`;
        const content = `export const x = 1;\n`;
        const expectedOutputName = `src.${platform}.actions.${pageName}.js`;

        try {
          writeTempAction(relPath, content);

          const result = await compileAction({
            sourceFile: relPath,
            outDir: TEST_OUT_DIR,
            projectRoot: PROJECT_ROOT,
          });

          expect(result.success).toBe(true);
          expect(result.outputFile).toBeDefined();

          // Verify the output file exists on disk
          expect(fs.existsSync(result.outputFile!)).toBe(true);

          // Verify the output filename matches the expected encoded name
          const actualFilename = path.basename(result.outputFile!);
          expect(actualFilename).toBe(expectedOutputName);

          // Clean up output file
          try { fs.unlinkSync(result.outputFile!); } catch { /* ignore */ }
        } finally {
          removeTempAction(relPath);
        }
      }),
      { numRuns: 10 }
    );
  });
});

// ─── Property 2: 输出格式与外部依赖隔离 ─────────────────────────────
/**
 * Feature: incremental-server-action-build, Property 2: 输出格式与外部依赖隔离
 *
 * **Validates: Requirements 1.2, 1.3**
 *
 * For any successfully compiled action output file, it should be CommonJS format
 * (contains module.exports or exports), and common dependencies should be
 * referenced via require('./_common'), not inlined.
 */
describe('Property 2: 输出格式与外部依赖隔离', { timeout: 120_000 }, () => {
  const platformArb = fc.constantFrom('frontend', 'backend', 'app');
  const pageNameArb = fc.stringMatching(/^[A-Z][A-Za-z0-9]{1,20}$/);

  // Generate action files that import from common deps
  const commonImportArb = fc.constantFrom(
    { imp: `import prisma from '@/tools/prisma';`, usage: 'prisma' },
    { imp: `import * as BaseActionFun from '@/@base/BaseActionFun';`, usage: 'BaseActionFun' },
    { imp: `import serializer from '@/utils/serializer';`, usage: 'serializer' },
  );

  it('output is CommonJS and common deps are not inlined', async () => {
    await fc.assert(
      fc.asyncProperty(
        platformArb,
        pageNameArb,
        fc.array(commonImportArb, { minLength: 0, maxLength: 3 }),
        async (platform, pageName, imports) => {
          // Deduplicate imports by usage name
          const seen = new Set<string>();
          const uniqueImports = imports.filter((i) => {
            if (seen.has(i.usage)) return false;
            seen.add(i.usage);
            return true;
          });

          const importLines = uniqueImports.map((i) => i.imp).join('\n');
          const usageLines = uniqueImports.map((i) => `  ${i.usage}`).join(',\n');
          const content = `${importLines}\nexport const data = {\n${usageLines || '  value: 1'}\n};\n`;

          const relPath = `src/${platform}/actions/${pageName}.ts`;

          try {
            writeTempAction(relPath, content);

            const result = await compileAction({
              sourceFile: relPath,
              outDir: TEST_OUT_DIR,
              projectRoot: PROJECT_ROOT,
            });

            expect(result.success).toBe(true);
            expect(result.outputFile).toBeDefined();

            const output = fs.readFileSync(result.outputFile!, 'utf-8');

            // Verify CommonJS format: should contain module.exports or exports.
            const isCJS =
              output.includes('module.exports') ||
              output.includes('exports.') ||
              output.includes('exports[');
            expect(isCJS).toBe(true);

            // Verify common deps are NOT inlined (no AsyncLocalStorage, no prisma source code)
            expect(output).not.toContain('AsyncLocalStorage');
            expect(output).not.toContain('new PrismaClient');

            // If we imported common deps, verify they go through _common
            if (uniqueImports.length > 0) {
              expect(output).toContain('require("./_common")');
            }

            // Clean up output file
            try { fs.unlinkSync(result.outputFile!); } catch { /* ignore */ }
          } finally {
            removeTempAction(relPath);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});

// ─── Property 4: 编译错误包含定位信息 ───────────────────────────────
/**
 * Feature: incremental-server-action-build, Property 4: 编译错误包含定位信息
 *
 * **Validates: Requirements 1.6, 1.7**
 *
 * For any action source file with compilation errors (syntax errors or missing
 * modules), Action_Compiler should return errors containing source file path,
 * line number, and error description.
 */
describe('Property 4: 编译错误包含定位信息', { timeout: 120_000 }, () => {
  const platformArb = fc.constantFrom('frontend', 'backend', 'app');
  const pageNameArb = fc.stringMatching(/^[A-Z][A-Za-z0-9]{1,20}$/);

  // Generate various kinds of broken TypeScript content
  const brokenContentArb = fc.constantFrom(
    `export const x = {;\n`,
    `const = ;\n`,
    `export function foo( { return 1; }\n`,
    `import { missing } from 'nonexistent-module-xyz-12345';\nexport const y = missing;\n`,
    `export const z: = 42;\n`,
    `export class { }\n`,
    `let a = @invalid;\n`,
    `export const fn = () => {{\n`,
  );

  it('compilation errors contain file path, line number, and message', async () => {
    await fc.assert(
      fc.asyncProperty(
        platformArb,
        pageNameArb,
        brokenContentArb,
        async (platform, pageName, brokenContent) => {
          const relPath = `src/${platform}/actions/${pageName}.ts`;

          try {
            writeTempAction(relPath, brokenContent);

            const result = await compileAction({
              sourceFile: relPath,
              outDir: TEST_OUT_DIR,
              projectRoot: PROJECT_ROOT,
            });

            // Compilation should fail
            expect(result.success).toBe(false);

            // Errors array should be non-empty
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);

            // Each error should have file, line (>= 0), and non-empty message
            for (const error of result.errors!) {
              expect(typeof error.file).toBe('string');
              expect(error.file.length).toBeGreaterThan(0);
              expect(typeof error.line).toBe('number');
              expect(error.line).toBeGreaterThanOrEqual(0);
              expect(typeof error.message).toBe('string');
              expect(error.message.length).toBeGreaterThan(0);
            }

            // Clean up any output file that might have been created
            const expectedOutput = path.resolve(
              PROJECT_ROOT,
              TEST_OUT_DIR,
              `src.${platform}.actions.${pageName}.js`
            );
            try { fs.unlinkSync(expectedOutput); } catch { /* ignore */ }
          } finally {
            removeTempAction(relPath);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});

// ─── Property 18: action 文件中公共依赖通过 _common.js 引用 ─────────
/**
 * Feature: incremental-server-action-build, Property 18: action 文件中公共依赖通过 _common.js 引用
 *
 * **Validates: Requirements 1.2, 2.3**
 *
 * For any successfully compiled action .js file, all references to common
 * dependencies should go through require('./_common'), with no direct requires
 * to source file paths like ../src/tools/prisma.
 */
describe('Property 18: action 文件中公共依赖通过 _common.js 引用', { timeout: 120_000 }, () => {
  const platformArb = fc.constantFrom('frontend', 'backend', 'app');
  const pageNameArb = fc.stringMatching(/^[A-Z][A-Za-z0-9]{1,20}$/);

  // Generate action files that import from various common dependency paths
  const commonDepSetArb = fc.shuffledSubarray(
    [
      { imp: `import prisma from '@/tools/prisma';`, name: 'prisma' },
      { imp: `import prismaProxy from '@/tools/prisma-proxy';`, name: 'prismaProxy' },
      { imp: `import * as BaseActionFun from '@/@base/BaseActionFun';`, name: 'BaseActionFun' },
      { imp: `import serializer from '@/utils/serializer';`, name: 'serializer' },
      { imp: `import * as PrismaClient from '../../prisma-generated/client';`, name: 'PrismaClient' },
    ],
    { minLength: 1, maxLength: 5 }
  );

  it('all common deps go through require("./_common"), no direct source requires', async () => {
    await fc.assert(
      fc.asyncProperty(platformArb, pageNameArb, commonDepSetArb, async (platform, pageName, deps) => {
        const importLines = deps.map((d) => d.imp).join('\n');
        const usageLines = deps.map((d) => `  ${d.name}`).join(',\n');
        const content = `${importLines}\nexport default {\n${usageLines}\n};\n`;

        const relPath = `src/${platform}/actions/${pageName}.ts`;

        try {
          writeTempAction(relPath, content);

          const result = await compileAction({
            sourceFile: relPath,
            outDir: TEST_OUT_DIR,
            projectRoot: PROJECT_ROOT,
          });

          expect(result.success).toBe(true);
          expect(result.outputFile).toBeDefined();

          const output = fs.readFileSync(result.outputFile!, 'utf-8');

          // All common deps should be referenced via require("./_common")
          expect(output).toContain('require("./_common")');

          // Should NOT contain direct requires to source file paths
          const forbiddenPatterns = [
            /require\(["']\.\.\/src\/tools\/prisma["']\)/,
            /require\(["']\.\.\/src\/tools\/prisma-proxy["']\)/,
            /require\(["']\.\.\/src\/@base\/BaseActionFun["']\)/,
            /require\(["']\.\.\/src\/utils\/serializer["']\)/,
            /require\(["']\.\.\/src\/frontend\/action_utils["']\)/,
            /require\(["']\.\.\/src\/backend\/action_utils["']\)/,
            /require\(["']\.\.\/src\/app\/action_utils["']\)/,
            /require\(["'][^"']*prisma-generated\/client["']\)(?!.*_common)/,
          ];

          for (const pattern of forbiddenPatterns) {
            // Only check patterns that don't go through _common
            const matches = output.match(pattern);
            if (matches) {
              // Ensure any match is actually through _common
              for (const m of matches) {
                expect(m).not.toBeDefined();
              }
            }
          }

          // More direct check: no require("../src/...") patterns
          expect(output).not.toMatch(/require\(["']\.\.\/src\//);
          // No require("./src/...") patterns
          expect(output).not.toMatch(/require\(["']\.\/src\//);

          // Clean up output file
          try { fs.unlinkSync(result.outputFile!); } catch { /* ignore */ }
        } finally {
          removeTempAction(relPath);
        }
      }),
      { numRuns: 10 }
    );
  });
});
