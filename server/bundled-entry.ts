import express from 'express';
import serializer from '../src/utils/serializer';
import { registry } from './registry';
import { setupThirdPartyAuth } from './thirdparty/auth';
import { authContext } from './thirdparty/context';
import { THIRD_PARTY_SESSION_SECRET } from './thirdparty/common';
// 错误类和 runWithAuth 从 BaseActionFun 统一导入作为 fallback
import { UnauthorizedError, ForbiddenError, runWithAuth as baseRunWithAuth } from '../src/@base/BaseActionFun';

// 同时 import 前后台和 app 的 auth-context
// 不要改这里的路径，代码里有强匹配的替换逻辑！start
import * as frontendAuth from '../src/frontend/action_utils';
import * as backendAuth from '../src/backend/action_utils';
import * as appAuth from '../src/app/action_utils';

const router = express.Router();

console.log("[bundled-entry] Module Loaded! Router initialized.");

// CORS Middleware removed - handled by Global Runtime
// router.use((req, res, next) => { ... });

// 1. Third Party Auth Strategy & Routes (Pluggable Setup)
setupThirdPartyAuth(router);


// Helper to deserialize args
const deserialize = (args: any) => serializer.deserialize(args);
const serialize = (result: any) => serializer.serialize(result);

// Helper to parse cookies
function parseCookies(header: string | undefined): Record<string, string> {
    const list: Record<string, string> = {};
    if (!header) return list;
    header.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts.shift()?.trim();
        if (name) {
             const value = parts.join('=');
             list[name] = decodeURIComponent(value.trim());
        }
    });
    return list;
}

type AnyFn = (...args: any[]) => any;
const actions = new Map<string, AnyFn>();

// Populate actions map
for (const [moduleName, mod] of Object.entries(registry)) {
  for (const [name, fn] of Object.entries(mod)) {
    if (typeof fn === 'function') {
      // e.g. "app.backend.dashboard.actions.getStats"
      actions.set(`${moduleName}.${name}`, fn as AnyFn);
    }
  }
}

// 根据 actionName 判断使用哪个 auth-context
function getAuthModule(actionName: string) {
  // actionName 格式: "src.frontend.actions.xxx" 或 "src.backend.actions.xxx" 或 "src.app.actions.xxx"
  // 注意：app/(backend)/ 目录下的 action 生成的 actionName 格式为 "app.backend.xxx"，
  // 必须优先匹配 .backend.，否则会被 startsWith('app.') 错误路由到 appAuth
  if (actionName.includes('.frontend.') || actionName.startsWith('frontend.')) {
    return frontendAuth;
  }
  if (actionName.includes('.backend.') || actionName.startsWith('backend.')) {
    return backendAuth;
  }
  if (actionName.includes('.app.') || actionName.startsWith('app.')) {
    return appAuth;
  }
}

// RPC Endpoint
router.post('/', async (req, res) => {
  try {
    const { actionName, args } = req.body;
    const fn = actions.get(actionName);
    if (!fn) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    // 根据 actionName 选择对应的 auth 模块
    const authModule = getAuthModule(actionName);

    const { parseToken } = authModule;
    // 使用模块的 runWithAuth，如果没有则 fallback 到 baseRunWithAuth
    const runWithAuth = (authModule as any).runWithAuth || baseRunWithAuth;

    
    // 解析 Token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const authCtx = token ? await parseToken(token) : null;

    // 解析 cookies / headers 用于第三方登录上下文
    const cookies = parseCookies(req.headers.cookie);
    const headers = req.headers as Record<string, string>;

    // 在 auth context + thirdparty request context 中执行 action
    const result = await authContext.run({ cookies, headers }, async () => {
      return runWithAuth(authCtx, async () => {
        return fn(...(deserialize(args) as any[]));
      });
    });

    // 如果有 authCtx，通过响应头返回最新的 role（从数据库读取的）
    // 前端可以用这个来同步 session，解决角色变更后前端 session 不同步的问题
    if (authCtx && authCtx.role) {
      // 支持单角色(string)和多角色(array)
      const roleValue = Array.isArray(authCtx.role) 
        ? JSON.stringify(authCtx.role) 
        : String(authCtx.role);
      res.setHeader('X-Auth-Role', roleValue);
    }

    res.json(serialize(result));
  } catch (e: any) {
    // 统一错误处理 - 使用 BaseActionFun 的错误类
    if (e instanceof UnauthorizedError || e.name === 'UnauthorizedError') {
      res.status(401).json({ error: e.message || '请登录' });
      return;
    }
    if (e instanceof ForbiddenError || e.name === 'ForbiddenError') {
      res.status(403).json({ error: e.message || '权限不足' });
      return;
    }
    // 不要改这里的路径，代码里有强匹配的替换逻辑！end
    const msg = String(e?.message ?? 'Unknown error')
    // Business validation (wrong password, disabled account, etc.) → 400 so storefront
    // shows the real message instead of treating every 5xx as "Server is taking a break"
    // and blindly retrying.
    const looksLikeEngineOrSchema =
      /Invalid `[\s\S]*` invocation/i.test(msg) ||
      /does not exist in the current database/i.test(msg) ||
      /passwordPlain/i.test(msg) ||
      /\bprisma\b/i.test(msg) ||
      /ECONNREFUSED|ENOTFOUND|P20\d{2}/i.test(msg)
    if (!looksLikeEngineOrSchema && e instanceof Error && msg && msg !== 'Unknown error') {
      res.status(400).json({ error: msg })
      return
    }
    console.error('RPC Error:', e);
    res.status(500).json({ error: msg });
  }
});

const PROJECT_ID = 'PROJ_fcb9e6ee_snap_20260726_092922_893';

// Export for the backend proxy loader
export const path = `/rpc/${PROJECT_ID}`;
export { router };
