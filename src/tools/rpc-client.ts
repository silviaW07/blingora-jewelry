import serializer from '../utils/serializer';
import { toast } from 'sonner';
// 同时 import 前后台和 app 的 rpc-auth
import * as frontendRpcAuth from '../frontend/auth/rpc-auth';
import * as backendRpcAuth from '../backend/auth/rpc-auth';
import * as appRpcAuth from '../app/auth/rpc-auth';

// 导入前端和 app 的 session store 用于同步 role
import { useUserSession } from './FrontendSession';
import { useAppUserSession } from './AppSession';
import { useAdminSession } from './BackendSession';

const PROJECT_ID =
  process.env.NEXT_PUBLIC_PROJECT_ID || 'PROJ_fcb9e6ee_snap_20260726_092922_893';

// 本地：直连 RPC 后端；经隧道访问时走同源 /rpc（由 next rewrites 转发到 3100）
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}/rpc/${PROJECT_ID}`;
    }
  }
  return `http://localhost:3100/rpc/${PROJECT_ID}`;
};

// 请求去重：相同 actionName+args 的并发请求共享同一个 Promise
const pendingRequests = new Map<string, Promise<any>>();

// Common error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Please login',
  FORBIDDEN: 'Permission denied',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Server is taking a break, please try again later',
  OPERATION_FAILED: 'Operation failed',
};

/** Optional chrome reads — soft-fail in UI; do not spam red toasts on transient 5xx */
const SILENT_SERVER_ERROR_ACTIONS = new Set([
  'getKeywordGroupList',
  'getKeywordList',
  'getCategoryPosterList',
  'getCategorySideNavZones',
  'getCategoryTopPromotion',
  'getDailyNewArrivalCalendar',
  'getHomeReviewSection',
  'getHomeSceneKeywordGroups',
  'getHomeCategoryGuide',
]);

const actionLeafName = (actionName: string) => {
  const parts = String(actionName || '').split('.');
  return parts[parts.length - 1] || '';
};

const shouldSilentServerError = (actionName: string) =>
  SILENT_SERVER_ERROR_ACTIONS.has(actionLeafName(actionName));

/** Hide misleading engine messages that are not actionable for operators */
const sanitizeRpcErrorMessage = (raw: unknown): string => {
  const message = String(raw || '').trim();
  if (!message) return ERROR_MESSAGES.SERVER_ERROR;
  if (/Must call super constructor/i.test(message)) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }
  return message;
};

// 根据 actionName 判断使用哪个 rpc-auth（和 bundled-entry.ts 逻辑一致）
function getRpcAuthModule(actionName: string) {
  // actionName 格式: "src.frontend.actions.xxx" 或 "src.backend.actions.xxx" 或 "src.app.actions.xxx"
  // 注意：app/(backend)/ 目录下的 action 生成的 actionName 格式为 "app.backend.xxx"，
  // 必须优先匹配 .backend.，否则会被 startsWith('app.') 错误路由到 appRpcAuth
  if (actionName.includes('.frontend.') || actionName.startsWith('frontend.')) {
    return frontendRpcAuth;
  }
  if (actionName.includes('.backend.') || actionName.startsWith('backend.')) {
    return backendRpcAuth;
  }
  if (actionName.includes('.app.') || actionName.startsWith('app.')) {
    return appRpcAuth;
  }
}

// 根据 actionName 从对应 platform 的 session store 获取当前用户角色
function getCurrentRole(actionName: string): string | undefined {
  try {
    if (actionName.includes('.frontend.') || actionName.startsWith('frontend.')) {
      const session = useUserSession.getState();
      return (session as any).role ?? undefined;
    }
    if (actionName.includes('.backend.') || actionName.startsWith('backend.')) {
      const session = useAdminSession.getState();
      return (session as any).role ?? undefined;
    }
    if (actionName.includes('.app.') || actionName.startsWith('app.')) {
      const session = useAppUserSession.getState();
      return (session as any).role ?? undefined;
    }
  } catch { /* session store 可能未初始化 */ }
  return undefined;
}

export async function rpcCall<T>(actionName: string, ...args: any[]): Promise<T> {
  const rpcAuth = getRpcAuthModule(actionName);
  const token = rpcAuth.getToken();

  // 请求去重：相同请求并发时复用同一个 Promise
  const dedupeKey = `${actionName}:${JSON.stringify(args)}`;
  if (pendingRequests.has(dedupeKey)) {
    return pendingRequests.get(dedupeKey)!;
  }

  const request = (async (): Promise<T> => {
    try {
      const apiUrl = getApiUrl();
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Timezone-Offset': String(new Date().getTimezoneOffset()),
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          // 把当前用户 ID 明文传给后端，供 Agent 诊断时使用（从 JWT payload 解析）
          ...(token ? (() => {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              return payload.userId ? { 'X-User-Id': String(payload.userId) } : {};
            } catch { return {}; }
          })() : {}),
          // 把当前用户角色传给后端，供 Agent 诊断时使用（从 session store 读取）
          ...(() => {
            const role = getCurrentRole(actionName);
            return role ? { 'X-User-Role': String(role) } : {};
          })(),
          // Pipeline test 数据库隔离：vitest 运行时注入 VITEST_PIPELINE_PAGE 环境变量
          ...(typeof process !== 'undefined' && process.env.VITEST_PIPELINE_PAGE ? {
            'X-Pipeline-Test': '1',
            'X-Pipeline-Page': process.env.VITEST_PIPELINE_PAGE,
          } : {}),
        },
        body: JSON.stringify({
          actionName,
          args: serializer.serialize(args)
        }),
      };

      let resp = await fetch(apiUrl, fetchOptions);

      // 503 服务过载：延迟 0.5 秒重试 1 次，失败就放弃
      if (resp.status === 503) {
        await new Promise(r => setTimeout(r, 500));
        resp = await fetch(apiUrl, fetchOptions);
        if (resp.status === 503) {
          if (!shouldSilentServerError(actionName)) {
            toast.error(ERROR_MESSAGES.SERVER_ERROR, { id: 'rpc-server-error' });
          }
          throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        }
      }

      // 502/500：瞬时过载再试一次（点击目录并发请求高峰）
      if (resp.status === 502 || resp.status === 500) {
        await new Promise(r => setTimeout(r, 400));
        resp = await fetch(apiUrl, fetchOptions);
      }

      // 401 统一拦截
      if (resp.status === 401) {
        rpcAuth.handleUnauthorized();
        toast.error('Please login first', { id: 'auth-401' });
        // 不 throw，返回一个永远不 resolve 的 Promise
        // 这样上层 catch 不会触发，避免重复 toast
        return new Promise<T>(() => {});
      }

      // 403 权限不足
      if (resp.status === 403) {
        const data = await resp.json();
        const errorMsg = sanitizeRpcErrorMessage(data.error ?? ERROR_MESSAGES.FORBIDDEN);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      // 404 资源不存在（常见于后端包未包含新 action）
      if (resp.status === 404) {
        const errorMsg = ERROR_MESSAGES.NOT_FOUND;
        // 不弹全局 toast，交给调用方静默降级或自行提示，避免顶栏红条刷屏
        throw new Error(errorMsg);
      }

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMsg = sanitizeRpcErrorMessage(errorData.error || ERROR_MESSAGES.SERVER_ERROR);
        if (!shouldSilentServerError(actionName)) {
          toast.error(errorMsg, { id: 'rpc-server-error' });
        }
        throw new Error(errorMsg);
      }

      // 检查后端返回的最新 role，如果与前端 session 不同则自动同步
      // 这解决了角色变更（如审核通过）后前端 session 不同步的问题
      const serverRole = resp.headers.get('X-Auth-Role');
      if (serverRole) {
        const isFrontend = actionName.includes('.frontend.');
        const isApp = actionName.includes('.app.');
        
        if (isFrontend) {
          const session = useUserSession.getState();
          if (session.role !== undefined && String(session.role) !== serverRole) {
            try {
              const parsed = JSON.parse(serverRole);
              useUserSession.setState({ role: parsed });
            } catch {
              useUserSession.setState({ role: serverRole as any });
            }
          }
        } else if (isApp) {
          const session = useAppUserSession.getState();
          if (session.role !== undefined && String(session.role) !== serverRole) {
            try {
              const parsed = JSON.parse(serverRole);
              useAppUserSession.setState({ role: parsed });
            } catch {
              useAppUserSession.setState({ role: serverRole as any });
            }
          }
        }
      }

      const rawData = await resp.json();
      
      // 先 serializer 反序列化
      const data = serializer.deserialize(rawData) as any;

      // 直接返回反序列化后的数据
      // 注意：withResult 没有包装成 { success, data } 格式，直接返回业务数据
      return data as T;
    } finally {
      pendingRequests.delete(dedupeKey);
    }
  })();

  pendingRequests.set(dedupeKey, request);
  return request;
}
