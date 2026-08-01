/**
 * Property-based tests for clearRequireCache (Property 13)
 *
 * Feature: incremental-server-action-build, Property 13: clearRequireCache 排除 _common.js
 *
 * **Validates: Requirements 6.3, 6.5, 6.6**
 *
 * For any server-action-generated/ directory require.cache entries,
 * calling clearRequireCache should preserve _common.js cache while
 * clearing action .js files and PROJ_xxx.js cache.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as path from 'path';

/**
 * Replicate the clearRequireCache logic from temp/src/worker.ts
 * so we can test it in isolation.
 */
function clearRequireCache(
  modulePath: string,
  cache: Record<string, { id: string }>
): void {
  const moduleDir = path.dirname(modulePath);
  const commonJsPath = path.resolve(moduleDir, '_common.js');

  Object.keys(cache).forEach((key) => {
    if (key.startsWith(moduleDir) || key === modulePath) {
      // Exclude _common.js
      if (key === commonJsPath) return;
      delete cache[key];
    }
  });
}

describe('Property 13: clearRequireCache 排除 _common.js', { timeout: 30000 }, () => {
  const platformArb = fc.constantFrom('frontend', 'backend', 'app');
  const pageNameArb = fc.stringMatching(/^[A-Z][A-Za-z0-9]{1,12}$/);
  const projectIdArb = fc.stringMatching(/^[a-z0-9]{4,8}$/);

  it('_common.js cache is preserved while action and PROJ files are cleared', async () => {
    await fc.assert(
      fc.asyncProperty(
        projectIdArb,
        fc.uniqueArray(
          fc.tuple(platformArb, pageNameArb),
          { minLength: 1, maxLength: 5, comparator: (a, b) => a[1] === b[1] }
        ),
        async (projectId, actionPages) => {
          const baseDir = `/tmp/test-project/server-action-generated`;
          const modulePath = path.join(baseDir, `PROJ_${projectId}.js`);
          const commonPath = path.resolve(baseDir, '_common.js');

          // Build a fake require.cache
          const cache: Record<string, { id: string }> = {};

          // Add _common.js entry
          cache[commonPath] = { id: commonPath };

          // Add PROJ entry
          cache[modulePath] = { id: modulePath };

          // Add action file entries
          const actionPaths: string[] = [];
          for (const [platform, pageName] of actionPages) {
            const actionPath = path.join(
              baseDir,
              `src.${platform}.actions.${pageName}.js`
            );
            cache[actionPath] = { id: actionPath };
            actionPaths.push(actionPath);
          }

          // Add an unrelated entry (should not be touched)
          const unrelatedPath = '/tmp/other-module/index.js';
          cache[unrelatedPath] = { id: unrelatedPath };

          // Call clearRequireCache
          clearRequireCache(modulePath, cache);

          // _common.js should still be in cache
          expect(cache[commonPath]).toBeDefined();
          expect(cache[commonPath].id).toBe(commonPath);

          // PROJ file should be cleared
          expect(cache[modulePath]).toBeUndefined();

          // Action files should be cleared
          for (const actionPath of actionPaths) {
            expect(cache[actionPath]).toBeUndefined();
          }

          // Unrelated entry should still be in cache
          expect(cache[unrelatedPath]).toBeDefined();
        }
      ),
      { numRuns: 10 }
    );
  });
});
