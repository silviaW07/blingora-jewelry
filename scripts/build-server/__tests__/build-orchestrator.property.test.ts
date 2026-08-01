/**
 * Property-based tests for Build_Orchestrator
 *
 * Feature: incremental-server-action-build
 *
 * Properties tested:
 * - Property 8: 增量编译仅编译指定文件
 * - Property 9: 部分失败不阻塞其他文件编译
 * - Property 10: 构建输出为合法 JSON
 * - Property 15: 重建 _common.js 不影响已编译 action
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { build } from '../index';

// ─── Helpers ─────────────────────────────────────────────────────────

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'build-orch-prop-'));
}

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Set up a minimal project structure so _common.js can build.
 * Creates src dirs and required base modules (prisma.ts, BaseActionFun.ts, serializer.ts).
 */
function setupTestProject(projectRoot: string) {
  const outDir = path.join(projectRoot, 'server-action-generated');
  fs.mkdirSync(outDir, { recursive: true });

  const dirs = [
    'src/backend/actions',
    'src/frontend/actions',
    'src/app/actions',
    'src/tools',
    'src/@base',
    'src/utils',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(projectRoot, d), { recursive: true });
  }

  fs.writeFileSync(
    path.join(projectRoot, 'src/tools/prisma.ts'),
    'export const prisma = {}; export default prisma;\n'
  );
  fs.writeFileSync(
    path.join(projectRoot, 'src/@base/BaseActionFun.ts'),
    'export class UnauthorizedError extends Error { name = "UnauthorizedError"; }\n' +
    'export class ForbiddenError extends Error { name = "ForbiddenError"; }\n' +
    'export async function runWithAuth(ctx: any, fn: any) { return fn(); }\n'
  );
  fs.writeFileSync(
    path.join(projectRoot, 'src/utils/serializer.ts'),
    'export function serialize(v: any) { return v; }\n' +
    'export function deserialize(v: any) { return v; }\n' +
    'export default { serialize, deserialize };\n'
  );
}


// ─── Generators ──────────────────────────────────────────────────────

const platformArb = fc.constantFrom('frontend', 'backend', 'app');
const pageNameArb = fc.stringMatching(/^[A-Z][A-Za-z0-9]{1,12}$/);
const projectIdArb = fc.stringMatching(/^[a-z0-9]{4,8}$/);

// ─── Property 8: 增量编译仅编译指定文件 ──────────────────────────────
/**
 * Feature: incremental-server-action-build, Property 8: 增量编译仅编译指定文件
 *
 * **Validates: Requirements 4.1, 8.2**
 *
 * For any incremental compile request (specifying a single file),
 * Build_Orchestrator should only compile that file. Other existing
 * action .js files' content and mtime should not change.
 */
describe('Property 8: 增量编译仅编译指定文件', { timeout: 30000 }, () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = createTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    setupTestProject(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanDir(tmpDir);
  });

  it('incremental build only recompiles the specified file, other action files unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectIdArb,
        pageNameArb,
        pageNameArb,
        async (projectId, pageA, pageB) => {
          // Ensure distinct page names
          if (pageA === pageB) pageB = pageB + 'X';

          const fileA = `src/backend/actions/${pageA}.ts`;
          const fileB = `src/backend/actions/${pageB}.ts`;

          fs.writeFileSync(
            path.join(tmpDir, fileA),
            `export function fnA() { return "${pageA}"; }\n`
          );
          fs.writeFileSync(
            path.join(tmpDir, fileB),
            `export function fnB() { return "${pageB}"; }\n`
          );

          // Full build first to create all output files
          const fullResult = await build({ projectId, all: true });
          expect(fullResult.success).toBe(true);

          const outDir = path.join(tmpDir, 'server-action-generated');
          const outputA = path.join(outDir, `src.backend.actions.${pageA}.js`);
          const outputB = path.join(outDir, `src.backend.actions.${pageB}.js`);

          expect(fs.existsSync(outputA)).toBe(true);
          expect(fs.existsSync(outputB)).toBe(true);

          // Record mtime and content of file B (the one NOT being recompiled)
          const statBBefore = fs.statSync(outputB);
          const contentBBefore = fs.readFileSync(outputB, 'utf-8');
          const mtimeBBefore = statBBefore.mtimeMs;

          // Wait a small amount to ensure mtime would differ if file is rewritten
          await new Promise((r) => setTimeout(r, 50));

          // Modify file A and do incremental build for file A only
          fs.writeFileSync(
            path.join(tmpDir, fileA),
            `export function fnA() { return "${pageA}_updated"; }\n`
          );

          const incrResult = await build({ projectId, file: fileA });
          expect(incrResult.success).toBe(true);
          expect(incrResult.compiled.length).toBe(1);

          // File B should be unchanged
          const statBAfter = fs.statSync(outputB);
          const contentBAfter = fs.readFileSync(outputB, 'utf-8');

          expect(contentBAfter).toBe(contentBBefore);
          expect(statBAfter.mtimeMs).toBe(mtimeBBefore);
        }
      ),
      { numRuns: 10 }
    );
  });
});


// ─── Property 9: 部分失败不阻塞其他文件编译 ──────────────────────────
/**
 * Feature: incremental-server-action-build, Property 9: 部分失败不阻塞其他文件编译
 *
 * **Validates: Requirements 4.3**
 *
 * For any set of valid and invalid action source files, after full build,
 * all valid files should compile successfully. The build result should
 * correctly report failed files.
 */
describe('Property 9: 部分失败不阻塞其他文件编译', { timeout: 30000 }, () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = createTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    setupTestProject(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanDir(tmpDir);
  });

  it('valid files compile successfully even when invalid files are present', async () => {
    // Generate 1-3 valid page names and 1-2 invalid page names
    const validPagesArb = fc.uniqueArray(pageNameArb, { minLength: 1, maxLength: 3, comparator: 'IsStrictlyEqual' });
    const invalidPagesArb = fc.uniqueArray(pageNameArb, { minLength: 1, maxLength: 2, comparator: 'IsStrictlyEqual' });

    const brokenContentArb = fc.constantFrom(
      'export const x = {;\n',
      'const = ;\n',
      'export function foo( { return 1; }\n',
    );

    await fc.assert(
      fc.asyncProperty(
        projectIdArb,
        validPagesArb,
        invalidPagesArb,
        brokenContentArb,
        async (projectId, validPages, invalidPages, brokenContent) => {
          // Ensure no overlap between valid and invalid page names
          const invalidFiltered = invalidPages.filter((p) => !validPages.includes(p));
          if (invalidFiltered.length === 0) return; // skip if all overlap

          // Create valid action files
          for (const page of validPages) {
            fs.writeFileSync(
              path.join(tmpDir, `src/backend/actions/${page}.ts`),
              `export function fn${page}() { return "${page}"; }\n`
            );
          }

          // Create invalid action files
          for (const page of invalidFiltered) {
            fs.writeFileSync(
              path.join(tmpDir, `src/backend/actions/${page}.ts`),
              brokenContent
            );
          }

          const result = await build({ projectId, all: true });

          // All valid files should be in compiled list
          for (const page of validPages) {
            expect(result.compiled).toContain(`src.backend.actions.${page}.js`);
          }

          // All invalid files should be in failed list
          for (const page of invalidFiltered) {
            const failedFiles = result.failed.map((f) => f.file);
            expect(failedFiles.some((f) => f.includes(page))).toBe(true);
          }

          // Each failed entry should have non-empty errors
          for (const f of result.failed) {
            expect(f.errors.length).toBeGreaterThan(0);
          }

          // Overall success should be false since there are failures
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });
});


// ─── Property 10: 构建输出为合法 JSON ────────────────────────────────
/**
 * Feature: incremental-server-action-build, Property 10: 构建输出为合法 JSON
 *
 * **Validates: Requirements 4.6**
 *
 * For any build execution (success or failure), Build_Orchestrator's result
 * should be serializable to JSON and parseable back, containing `success`,
 * `compiled`, `failed`, `duration` fields.
 */
describe('Property 10: 构建输出为合法 JSON', { timeout: 30000 }, () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = createTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    setupTestProject(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanDir(tmpDir);
  });

  // Generator for build scenarios: success, failure, or mixed
  const scenarioArb = fc.constantFrom('success', 'failure', 'mixed');

  it('build result is valid JSON with required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectIdArb,
        scenarioArb,
        pageNameArb,
        async (projectId, scenario, pageName) => {
          if (scenario === 'success' || scenario === 'mixed') {
            fs.writeFileSync(
              path.join(tmpDir, `src/backend/actions/${pageName}.ts`),
              `export function fn() { return 1; }\n`
            );
          }

          if (scenario === 'failure' || scenario === 'mixed') {
            const badName = pageName + 'Bad';
            fs.writeFileSync(
              path.join(tmpDir, `src/backend/actions/${badName}.ts`),
              'export const x = {;\n'
            );
          }

          const result = await build({ projectId, all: true });

          // Result should be JSON-serializable and parseable
          const jsonStr = JSON.stringify(result);
          const parsed = JSON.parse(jsonStr);

          // Required fields must exist
          expect(parsed).toHaveProperty('success');
          expect(parsed).toHaveProperty('compiled');
          expect(parsed).toHaveProperty('failed');
          expect(parsed).toHaveProperty('duration');

          // Type checks
          expect(typeof parsed.success).toBe('boolean');
          expect(Array.isArray(parsed.compiled)).toBe(true);
          expect(Array.isArray(parsed.failed)).toBe(true);
          expect(typeof parsed.duration).toBe('number');
          expect(parsed.duration).toBeGreaterThanOrEqual(0);

          // Each failed entry should have file and errors
          for (const f of parsed.failed) {
            expect(typeof f.file).toBe('string');
            expect(Array.isArray(f.errors)).toBe(true);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});


// ─── Property 15: 重建 _common.js 不影响已编译 action ────────────────
/**
 * Feature: incremental-server-action-build, Property 15: 重建 _common.js 不影响已编译 action
 *
 * **Validates: Requirements 9.2**
 *
 * For any set of already-compiled action .js files, rebuilding _common.js
 * should not change their content or mtime.
 */
describe('Property 15: 重建 _common.js 不影响已编译 action', { timeout: 30000 }, () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = createTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    setupTestProject(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanDir(tmpDir);
  });

  it('rebuilding _common.js does not change action file content or mtime', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectIdArb,
        fc.uniqueArray(pageNameArb, { minLength: 1, maxLength: 3, comparator: 'IsStrictlyEqual' }),
        async (projectId, pages) => {
          // Create action files
          for (const page of pages) {
            fs.writeFileSync(
              path.join(tmpDir, `src/backend/actions/${page}.ts`),
              `export function fn${page}() { return "${page}"; }\n`
            );
          }

          // Full build first
          const fullResult = await build({ projectId, all: true });
          expect(fullResult.success).toBe(true);

          const outDir = path.join(tmpDir, 'server-action-generated');

          // Record mtime and content of all action .js files
          const snapshots: Record<string, { content: string; mtimeMs: number }> = {};
          for (const page of pages) {
            const filePath = path.join(outDir, `src.backend.actions.${page}.js`);
            expect(fs.existsSync(filePath)).toBe(true);
            const stat = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            snapshots[page] = { content, mtimeMs: stat.mtimeMs };
          }

          // Wait to ensure mtime would differ if files are rewritten
          await new Promise((r) => setTimeout(r, 50));

          // Rebuild _common.js only
          const rebuildResult = await build({
            projectId,
            rebuildCommon: true,
          });
          expect(rebuildResult.success).toBe(true);
          expect(rebuildResult.commonRebuilt).toBe(true);

          // Verify all action files are unchanged
          for (const page of pages) {
            const filePath = path.join(outDir, `src.backend.actions.${page}.js`);
            const stat = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toBe(snapshots[page].content);
            expect(stat.mtimeMs).toBe(snapshots[page].mtimeMs);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
