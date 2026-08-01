import * as path from 'path';
import * as fs from 'fs';
import * as lockfile from 'proper-lockfile';

// ─── Types ───────────────────────────────────────────────────────────

export interface EntryGeneratorOptions {
  projectId: string;
  outDir: string;
  /** 项目根目录（用于计算 moduleName） */
  projectRoot: string;
  /** 文件锁路径 */
  lockFile?: string;
}

export interface EntryGeneratorResult {
  success: boolean;
  outputFile: string;
  /** 包含的 action 文件列表 */
  actionFiles: string[];
  errors?: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Scan the outDir for action .js files, excluding special files:
 * - _common.js
 * - PROJ_*.js (entry files)
 * - .lock files
 * - _common_entry.ts (temp file)
 */
export function scanActionFiles(absOutDir: string): string[] {
  if (!fs.existsSync(absOutDir)) {
    return [];
  }

  return fs.readdirSync(absOutDir).filter((file) => {
    // Must be a .js file
    if (!file.endsWith('.js')) return false;
    // Exclude _common.js
    if (file === '_common.js') return false;
    // Exclude PROJ_*.js entry files
    if (file.startsWith('PROJ_')) return false;
    // Exclude .lock files (shouldn't match .js but be safe)
    if (file.endsWith('.lock')) return false;
    return true;
  }).sort();
}

/**
 * Extract moduleName from an action filename.
 * e.g. "src.backend.actions.Register.js" → "src.backend.actions.Register"
 */
export function extractModuleName(filename: string): string {
  return filename.replace(/\.js$/, '');
}

/**
 * Generate the content of PROJ_{projectId}.js entry file.
 */
function generateEntryContent(
  projectId: string,
  actionFiles: string[]
): string {
  const moduleNames = actionFiles.map(extractModuleName);

  // Build the registry object entries
  const registryEntries = moduleNames
    .map((mod) => `  '${mod}': require('./${mod}'),`)
    .join('\n');

  return `// PROJ_${projectId}.js (generated)
const express = require('express');
const common = require('./_common');
const { UnauthorizedError, ForbiddenError, runWithAuth: baseRunWithAuth } = common.BaseActionFun;
const { authContext: thirdpartyAuthContext } = common;
const serializer = common.serializer;

const router = express.Router();
const actions = new Map();

// Dynamic require for each action
const registry = {
${registryEntries}
};

// Register actions
for (const [moduleName, mod] of Object.entries(registry)) {
  for (const [fnName, fn] of Object.entries(mod)) {
    if (typeof fn === 'function') {
      actions.set(\`\${moduleName}.\${fnName}\`, fn);
    }
  }
}

function parseCookies(header) {
  const list = {};
  if (!header) return list;
  header.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      const value = parts.join('=');
      list[name] = decodeURIComponent(value.trim());
    }
  });
  return list;
}

// Auth module selection
// 注意：app/(backend)/ 目录下的 action 生成的 actionName 格式为 "app.backend.xxx"，
// 必须优先匹配 .backend.，否则会被 startsWith('app.') 错误路由到 appAuth
function getAuthModule(actionName) {
  if (actionName.includes('.frontend.') || actionName.startsWith('frontend.')) return common.frontendAuth;
  if (actionName.includes('.backend.') || actionName.startsWith('backend.')) return common.backendAuth;
  if (actionName.includes('.app.') || actionName.startsWith('app.')) return common.appAuth;
  return common.backendAuth;
}

// RPC route (preserving existing bundled-entry.ts logic)
router.post('/', async (req, res) => {
  try {
    const { actionName, args } = req.body;
    const fn = actions.get(actionName);
    if (!fn) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const authModule = getAuthModule(actionName);
    const { parseToken } = authModule;
    const runWithAuth = authModule.runWithAuth || baseRunWithAuth;

    const token = req.headers.authorization?.replace('Bearer ', '');
    const authCtx = token ? await parseToken(token) : null;

    const cookies = parseCookies(req.headers.cookie);
    const headers = req.headers;

    const result = await thirdpartyAuthContext.run({ cookies, headers }, async () => {
      return runWithAuth(authCtx, async () => {
        return fn(...(serializer.deserialize(args)));
      });
    });

    if (authCtx && authCtx.role) {
      const roleValue = Array.isArray(authCtx.role)
        ? JSON.stringify(authCtx.role)
        : String(authCtx.role);
      res.setHeader('X-Auth-Role', roleValue);
    }

    res.json(serializer.serialize(result));
  } catch (e) {
    if (e instanceof UnauthorizedError || e.name === 'UnauthorizedError') {
      res.status(401).json({ error: e.message || '请登录' });
      return;
    }
    if (e instanceof ForbiddenError || e.name === 'ForbiddenError') {
      res.status(403).json({ error: e.message || '权限不足' });
      return;
    }
    console.error('RPC Error:', e);
    res.status(500).json({ error: e?.message ?? 'Unknown error' });
  }
});

const PROJECT_ID = 'PROJ_${projectId}';
module.exports = { path: \`/rpc/\${PROJECT_ID}\`, router };
`;
}

// ─── generateEntry ───────────────────────────────────────────────────

/**
 * 生成入口文件 PROJ_xxx.js（带文件锁）
 *
 * 1. Acquire file lock on .entry-gen.lock
 * 2. Scan outDir for action .js files
 * 3. Generate PROJ_{projectId}.js content
 * 4. Write to outDir/PROJ_{projectId}.js
 * 5. Release lock
 */
export async function generateEntry(
  options: EntryGeneratorOptions
): Promise<EntryGeneratorResult> {
  const { projectId, outDir, projectRoot } = options;
  const absOutDir = path.resolve(projectRoot, outDir);
  const outputFile = path.join(absOutDir, `PROJ_${projectId}.js`);

  // Ensure output directory exists
  fs.mkdirSync(absOutDir, { recursive: true });

  // Lock file path
  const lockPath = options.lockFile || path.join(absOutDir, '.entry-gen.lock');
  // Ensure lock file exists (proper-lockfile requires the file to exist)
  fs.writeFileSync(lockPath, '', { flag: 'a' });

  let release: (() => Promise<void>) | null = null;

  try {
    release = await lockfile.lock(lockPath, {
      stale: 10000,
      retries: { retries: 5, minTimeout: 200 },
    });

    // Scan for action files
    const actionFiles = scanActionFiles(absOutDir);

    // Generate entry content
    const content = generateEntryContent(projectId, actionFiles);

    // Write the entry file
    fs.writeFileSync(outputFile, content, 'utf-8');

    return {
      success: true,
      outputFile,
      actionFiles,
    };
  } catch (err: any) {
    const message = err.message ?? String(err);

    // Check if it's a lock timeout error
    if (message.includes('lock') || message.includes('ELOCKED')) {
      return {
        success: false,
        outputFile,
        actionFiles: [],
        errors: [`Lock timeout: ${message}. Please retry.`],
      };
    }

    return {
      success: false,
      outputFile,
      actionFiles: [],
      errors: [message],
    };
  } finally {
    if (release) {
      await release();
    }
  }
}
