import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { build, parseCliArgs } from '../index';
import type { BuildOptions, BuildResult } from '../index';

// ─── Test Helpers ────────────────────────────────────────────────────

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'build-orch-test-'));
}

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Set up a minimal project structure for build tests.
 * Creates src dirs, a simple action file, and required base modules.
 */
function setupTestProject(projectRoot: string) {
  // Create output dir
  const outDir = path.join(projectRoot, 'server-action-generated');
  fs.mkdirSync(outDir, { recursive: true });

  // Create src structure
  const dirs = [
    'src/backend/actions',
    'src/frontend/actions',
    'src/tools',
    'src/@base',
    'src/utils',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(projectRoot, d), { recursive: true });
  }

  // Create minimal source modules that _common.js needs
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

// ─── Tests ───────────────────────────────────────────────────────────

describe('parseCliArgs', () => {
  it('should parse --file argument', () => {
    const result = parseCliArgs(['--file', 'src/backend/actions/Register.ts']);
    expect(result.file).toBe('src/backend/actions/Register.ts');
  });

  it('should parse --all argument', () => {
    const result = parseCliArgs(['--all']);
    expect(result.all).toBe(true);
  });

  it('should parse --rebuild-common argument', () => {
    const result = parseCliArgs(['--rebuild-common']);
    expect(result.rebuildCommon).toBe(true);
  });

  it('should parse --project-id argument', () => {
    const result = parseCliArgs(['--project-id', 'abc123']);
    expect(result.projectId).toBe('abc123');
  });

  it('should parse multiple arguments together', () => {
    const result = parseCliArgs([
      '--file', 'src/backend/actions/Test.ts',
      '--project-id', 'myproj',
    ]);
    expect(result.file).toBe('src/backend/actions/Test.ts');
    expect(result.projectId).toBe('myproj');
  });

  it('should return empty projectId when not provided', () => {
    const result = parseCliArgs([]);
    expect(result.projectId).toBe('');
  });
});

describe('build function', () => {
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

  it('should return a BuildResult with correct shape', async () => {
    // Create a simple action file
    fs.writeFileSync(
      path.join(tmpDir, 'src/backend/actions/TestAction.ts'),
      'export function hello() { return "world"; }\n'
    );

    const result = await build({
      projectId: 'test123',
      all: true,
    });

    // Verify result shape
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('compiled');
    expect(result).toHaveProperty('failed');
    expect(result).toHaveProperty('duration');
    expect(result).toHaveProperty('commonRebuilt');

    expect(typeof result.success).toBe('boolean');
    expect(Array.isArray(result.compiled)).toBe(true);
    expect(Array.isArray(result.failed)).toBe(true);
    expect(typeof result.duration).toBe('number');
    expect(typeof result.commonRebuilt).toBe('boolean');
  }, 30000);

  it('should compile action files in full build mode', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'src/backend/actions/Register.ts'),
      'export function register() { return "ok"; }\n'
    );

    const result = await build({
      projectId: 'fullbuild',
      all: true,
    });

    expect(result.success).toBe(true);
    expect(result.compiled).toContain('src.backend.actions.Register.js');
    expect(result.commonRebuilt).toBe(true);
    expect(result.duration).toBeGreaterThanOrEqual(0);

    // Verify output files exist
    const outDir = path.join(tmpDir, 'server-action-generated');
    expect(fs.existsSync(path.join(outDir, '_common.js'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'src.backend.actions.Register.js'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'PROJ_fullbuild.js'))).toBe(true);
  }, 30000);

  it('should handle single file mode', async () => {
    const actionFile = 'src/backend/actions/SingleFile.ts';
    fs.writeFileSync(
      path.join(tmpDir, actionFile),
      'export function single() { return 1; }\n'
    );

    const result = await build({
      projectId: 'single',
      file: actionFile,
    });

    expect(result.success).toBe(true);
    expect(result.compiled).toContain('src.backend.actions.SingleFile.js');
    // _common.js should have been built since it didn't exist
    expect(result.commonRebuilt).toBe(true);

    // Verify entry file was generated
    const outDir = path.join(tmpDir, 'server-action-generated');
    expect(fs.existsSync(path.join(outDir, 'PROJ_single.js'))).toBe(true);
  }, 30000);

  it('should handle partial failures without blocking other files', async () => {
    // One valid file
    fs.writeFileSync(
      path.join(tmpDir, 'src/backend/actions/Good.ts'),
      'export function good() { return true; }\n'
    );
    // One broken file
    fs.writeFileSync(
      path.join(tmpDir, 'src/backend/actions/Bad.ts'),
      'export const x = {;\n' // syntax error
    );

    const result = await build({
      projectId: 'partial',
      all: true,
    });

    // Overall should be false because of the failure
    expect(result.success).toBe(false);
    // Good file should still compile
    expect(result.compiled).toContain('src.backend.actions.Good.js');
    // Bad file should be in failed list
    expect(result.failed.length).toBeGreaterThan(0);
    expect(result.failed.some((f) => f.file.includes('Bad.ts'))).toBe(true);
    expect(result.failed[0].errors.length).toBeGreaterThan(0);
  }, 30000);

  it('should exclude __test_ files from discovery', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'src/backend/actions/Real.ts'),
      'export function real() { return true; }\n'
    );
    fs.writeFileSync(
      path.join(tmpDir, 'src/backend/actions/__test_temp.ts'),
      'export function temp() { return false; }\n'
    );

    const result = await build({
      projectId: 'exclude',
      all: true,
    });

    expect(result.compiled).toContain('src.backend.actions.Real.js');
    expect(result.compiled.some((f) => f.includes('__test_'))).toBe(false);
  }, 30000);

  it('should handle rebuild-common mode', async () => {
    // First do a full build to create PROJ file
    fs.writeFileSync(
      path.join(tmpDir, 'src/backend/actions/Action.ts'),
      'export function action() { return 1; }\n'
    );
    await build({ projectId: 'rebuild', all: true });

    // Now rebuild common only
    const result = await build({
      projectId: 'rebuild',
      rebuildCommon: true,
    });

    expect(result.success).toBe(true);
    expect(result.commonRebuilt).toBe(true);
    expect(result.compiled).toEqual([]); // No action files compiled
    expect(result.failed).toEqual([]);
  }, 30000);
});
