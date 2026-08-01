import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { compileAction, commonRedirectPlugin } from '../action-compiler';
import * as esbuild from 'esbuild';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const OUT_DIR = path.resolve(PROJECT_ROOT, 'server-action-generated-test');

// Helper: create a temp action file for testing
function writeTempAction(relPath: string, content: string): string {
  const absPath = path.resolve(PROJECT_ROOT, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, 'utf-8');
  return relPath;
}

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('commonRedirectPlugin', () => {
  const testOutDir = path.resolve(PROJECT_ROOT, 'server-action-generated-plugin-test');

  afterAll(() => {
    cleanDir(testOutDir);
  });

  it('should redirect @/tools/prisma to require("./_common").prisma', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_prisma_redirect.ts',
      `import { prisma } from '@/tools/prisma';\nexport const result = prisma;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, testOutDir),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    expect(result.outputFile).toBeDefined();

    const output = fs.readFileSync(result.outputFile!, 'utf-8');
    expect(output).toContain('require("./_common").prisma');

    // Cleanup temp action file
    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should redirect @/tools/prisma-proxy to require("./_common").prisma', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_prisma_proxy_redirect.ts',
      `import { prisma } from '@/tools/prisma-proxy';\nexport const result = prisma;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, testOutDir),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    const output = fs.readFileSync(result.outputFile!, 'utf-8');
    expect(output).toContain('require("./_common").prisma');

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should redirect @/@base/BaseActionFun to require("./_common").BaseActionFun', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_base_redirect.ts',
      `import { runWithAuth } from '@/@base/BaseActionFun';\nexport const result = runWithAuth;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, testOutDir),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    const output = fs.readFileSync(result.outputFile!, 'utf-8');
    expect(output).toContain('require("./_common").BaseActionFun');

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should redirect @/{platform}/action_utils with dynamic export key', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_auth_redirect.ts',
      `import { parseToken } from '@/backend/action_utils';\nexport const result = parseToken;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, testOutDir),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    const output = fs.readFileSync(result.outputFile!, 'utf-8');
    expect(output).toContain('require("./_common").backendAuth');

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should redirect @/utils/serializer to require("./_common").serializer', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_serializer_redirect.ts',
      `import serializer from '@/utils/serializer';\nexport const result = serializer;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, testOutDir),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    const output = fs.readFileSync(result.outputFile!, 'utf-8');
    expect(output).toContain('require("./_common").serializer');

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should redirect prisma-generated/client to require("./_common").PrismaClient', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_prisma_client_redirect.ts',
      `import { PrismaClient } from '../../prisma-generated/client';\nexport const result = PrismaClient;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, testOutDir),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    const output = fs.readFileSync(result.outputFile!, 'utf-8');
    expect(output).toContain('require("./_common").PrismaClient');

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should redirect frontend action_utils with frontendAuth key', async () => {
    const tempFile = writeTempAction(
      'src/frontend/actions/__test_frontend_auth.ts',
      `import { parseToken } from '@/frontend/action_utils';\nexport const result = parseToken;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, testOutDir),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    const output = fs.readFileSync(result.outputFile!, 'utf-8');
    expect(output).toContain('require("./_common").frontendAuth');

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });
});

describe('compileAction', () => {
  afterAll(() => {
    cleanDir(OUT_DIR);
  });

  it('should encode source path as output filename with dots', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_encode.ts',
      `export const hello = 'world';\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, OUT_DIR),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    expect(result.outputFile).toBeDefined();
    expect(path.basename(result.outputFile!)).toBe('src.backend.actions.__test_encode.js');

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should return structured errors for syntax errors', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_syntax_error.ts',
      `export const x = {;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, OUT_DIR),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0].file).toBeTruthy();
    expect(result.errors![0].message).toBeTruthy();

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should return errors for missing module imports', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_missing_module.ts',
      `import { foo } from './nonexistent-module';\nexport const result = foo;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, OUT_DIR),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0].message).toContain('nonexistent-module');

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should output CJS format', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_cjs.ts',
      `export function greet(name: string) { return 'Hello ' + name; }\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, OUT_DIR),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.success).toBe(true);
    const output = fs.readFileSync(result.outputFile!, 'utf-8');
    // CJS format should have module.exports or exports
    expect(output).toMatch(/module\.exports|exports\./);

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });

  it('should include duration in result', async () => {
    const tempFile = writeTempAction(
      'src/backend/actions/__test_duration.ts',
      `export const x = 1;\n`
    );

    const result = await compileAction({
      sourceFile: tempFile,
      outDir: path.relative(PROJECT_ROOT, OUT_DIR),
      projectRoot: PROJECT_ROOT,
    });

    expect(result.duration).toBeTypeOf('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);

    fs.unlinkSync(path.resolve(PROJECT_ROOT, tempFile));
  });
});
