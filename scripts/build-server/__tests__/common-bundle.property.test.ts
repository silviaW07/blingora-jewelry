/**
 * Property-based tests for Common_Bundle (Property 17)
 *
 * Feature: incremental-server-action-build, Property 17: _common.js 模块缓存单例
 *
 * **Validates: Requirements 2.3**
 *
 * For any number of require('_common.js') calls in the same Node.js process,
 * the returned object reference should be identical (===), ensuring
 * AsyncLocalStorage and Prisma Client are global singletons.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import * as path from 'path';
import * as fs from 'fs';
import { buildCommonBundle } from '../common-bundle';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const TEST_OUT_DIR = 'server-action-generated-common-test';
const TEST_OUT_ABS = path.resolve(PROJECT_ROOT, TEST_OUT_DIR);

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('Property 17: _common.js 模块缓存单例', { timeout: 120_000 }, () => {
  let commonJsPath: string;

  beforeAll(async () => {
    cleanDir(TEST_OUT_ABS);
    fs.mkdirSync(TEST_OUT_ABS, { recursive: true });

    // Build _common.js once for all test iterations
    const result = await buildCommonBundle({
      projectRoot: PROJECT_ROOT,
      outDir: TEST_OUT_DIR,
      actionUtilsPaths: {
        frontend: 'src/frontend/action_utils.ts',
        backend: 'src/backend/action_utils.ts',
        app: 'src/app/action_utils.ts',
      },
    });

    // The build may partially fail (e.g. prisma-generated/client missing),
    // but _common.js should still be produced. We just need the file to exist.
    commonJsPath = result.outputFile;

    if (!fs.existsSync(commonJsPath)) {
      throw new Error(
        `_common.js was not produced. Build errors: ${result.errors?.join(', ')}`
      );
    }
  });

  afterAll(() => {
    // Clean up require cache entries for our test module
    try {
      const resolved = require.resolve(commonJsPath);
      delete require.cache[resolved];
    } catch {
      /* module may not have been loaded */
    }
    cleanDir(TEST_OUT_ABS);
  });

  it('multiple require() calls return the same object reference (===)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a random number of require calls (2–10)
        fc.integer({ min: 2, max: 10 }),
        async (numCalls) => {
          // Clear the module cache before each property iteration
          // so we get a fresh first-load, then verify subsequent loads are cached
          const resolved = require.resolve(commonJsPath);
          delete require.cache[resolved];

          // First require — establishes the cached module
          const first = require(commonJsPath);

          // Subsequent requires should return the exact same reference
          for (let i = 1; i < numCalls; i++) {
            const subsequent = require(commonJsPath);
            expect(subsequent).toBe(first);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
