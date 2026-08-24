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

/** Default AbortController timeout for RPC fetch (ms). Override via rpcCallTimed / __rpcTimeoutMs. */
export const RPC_DEFAULT_TIMEOUT_MS = 60_000;

const TIMEOUT_ERROR_MESSAGE = (timeoutMs: number) =>
  `请求超时（${Math.round(timeoutMs / 1000)}秒），请稍后重试`;

// 本地：直连 RPC 后端；线上走 /api/query（避免部分 Chrome 广告拦截把 /rpc/ 当追踪接口拦掉）
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}/api/query/${PROJECT_ID}/`;
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
  SERVER_ERROR: '后台服务异常，请稍后重试。若反复出现请在服务器执行 bash deploy/ensure-online.sh',
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
  'getDailyNewArrivalProducts',
  'getComingSoonDateCards',
  'getComingSoonProductsByDate',
  'getHomeRecommendZones',
  'getHomeFeaturedProducts',
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
  if (/该邮箱已被注册|数据库结构未同步/i.test(message)) {
    return message;
  }
  if (/P2002|Unique constraint/i.test(message)) {
    return '该邮箱已被注册，请更换邮箱或直接登录';
  }
  // Prisma column/table schema drift → friendly message for storefront
  if (
    /Invalid `.*` invocation/i.test(message) ||
    /does not exist in the current database/i.test(message) ||
    /passwordPlain/i.test(message)
  ) {
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

/** Strip optional trailing `{ __rpcTimeoutMs }` override bag from business args. */
function takeTimeoutMs(args: any[]): { businessArgs: any[]; timeoutMs: number } {
  if (args.length === 0) {
    return { businessArgs: args, timeoutMs: RPC_DEFAULT_TIMEOUT_MS };
  }
  const last = args[args.length - 1];
  if (
    last &&
    typeof last === 'object' &&
    !Array.isArray(last) &&
    Object.prototype.hasOwnProperty.call(last, '__rpcTimeoutMs')
  ) {
    const raw = Number((last as { __rpcTimeoutMs?: unknown }).__rpcTimeoutMs);
    return {
      businessArgs: args.slice(0, -1),
      timeoutMs: Number.isFinite(raw) && raw > 0 ? raw : RPC_DEFAULT_TIMEOUT_MS,
    };
  }
  return { businessArgs: args, timeoutMs: RPC_DEFAULT_TIMEOUT_MS };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error: any) {
    if (
      error?.name === 'AbortError' ||
      /aborted|AbortError/i.test(String(error?.message || ''))
    ) {
      throw new Error(TIMEOUT_ERROR_MESSAGE(timeoutMs));
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function rpcCallInternal<T>(
  actionName: string,
  businessArgs: any[],
  timeoutMs: number,
): Promise<T> {
  const rpcAuth = getRpcAuthModule(actionName);
  const token = rpcAuth.getToken();

  // 请求去重：相同请求并发时复用同一个 Promise
  const dedupeKey = `${actionName}:${JSON.stringify(businessArgs)}:t${timeoutMs}`;
  if (pendingRequests.has(dedupeKey)) {
    return pendingRequests.get(dedupeKey)!;
  }

  const request = (async (): Promise<T> => {
    try {
      const apiUrl = getApiUrl();
      const fetchOptions: RequestInit = {
        method: 'POST',
        credentials: 'same-origin',
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
          args: serializer.serialize(businessArgs)
        }),
      };

      let resp: Response;
      try {
        resp = await fetchWithTimeout(apiUrl, fetchOptions, timeoutMs);
      } catch (networkError: any) {
        const msg = String(networkError?.message || '');
        if (/请求超时/.test(msg)) {
          if (!shouldSilentServerError(actionName)) {
            toast.error(msg, { id: 'rpc-timeout-error' });
          }
          throw networkError instanceof Error ? networkError : new Error(msg);
        }
        const connectMsg =
          '无法连接后台 RPC（Failed to fetch）。请确认进程在线：pnpm run build:server && pm2 restart rpc（本地默认 :3100）';
        if (!shouldSilentServerError(actionName)) {
          toast.error(connectMsg, { id: 'rpc-connect-error' });
        }
        throw new Error(connectMsg);
      }

      // 503 服务过载：延迟 0.5 秒重试 1 次，失败就放弃
      if (resp.status === 503) {
        await new Promise(r => setTimeout(r, 500));
        resp = await fetchWithTimeout(apiUrl, fetchOptions, timeoutMs);
        if (resp.status === 503) {
          if (!shouldSilentServerError(actionName)) {
            toast.error(ERROR_MESSAGES.SERVER_ERROR, { id: 'rpc-server-error' });
          }
          throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        }
      }

      // 502/500：瞬时过载再试一次（点击目录并发请求高峰）
      // Skip retry for auth actions — business "密码错误" also used to return as 500.
      if (
        (resp.status === 502 || resp.status === 500) &&
        !/(loginCustomer|registerCustomer|checkEmailUnique)/i.test(actionLeafName(actionName))
      ) {
        await new Promise(r => setTimeout(r, 400));
        resp = await fetchWithTimeout(apiUrl, fetchOptions, timeoutMs);
      }

      // 401：公开店面接口去掉坏 token 再试一次（Chrome 里过期 JWT 会让类目列表整页空白）
      if (resp.status === 401) {
        const isStorefront = actionName.includes('.frontend.')
        if (isStorefront && token) {
          const retryHeaders = { ...(fetchOptions.headers as Record<string, string>) }
          delete retryHeaders.Authorization
          delete retryHeaders['X-User-Id']
          delete retryHeaders['X-User-Role']
          resp = await fetchWithTimeout(
            apiUrl,
            { ...fetchOptions, headers: retryHeaders },
            timeoutMs,
          )
        }
      }

      // 401：清坏 token 后抛错，由调用方处理。
      // 店面浏览不自动跳登录/注册（避免游客看商品时被打断）；后台仍提示登录。
      if (resp.status === 401) {
        rpcAuth.handleUnauthorized();
        const isStorefront = actionName.includes('.frontend.')
        if (!isStorefront) {
          toast.error('Please login first', { id: 'auth-401' });
        }
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
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
        // Auth forms surface their own field error; skip global toast spam for 4xx
        const isAuthLeaf = /^(loginCustomer|registerCustomer|checkEmailUnique)$/.test(
          actionLeafName(actionName),
        );
        if (!shouldSilentServerError(actionName) && !(isAuthLeaf && resp.status < 500)) {
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

export async function rpcCall<T>(actionName: string, ...args: any[]): Promise<T> {
  const { businessArgs, timeoutMs } = takeTimeoutMs(args);
  return rpcCallInternal<T>(actionName, businessArgs, timeoutMs);
}

/** Same as rpcCall but with an explicit AbortController timeout (ms). */
export async function rpcCallTimed<T>(
  timeoutMs: number,
  actionName: string,
  ...args: any[]
): Promise<T> {
  const ms = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : RPC_DEFAULT_TIMEOUT_MS;
  return rpcCallInternal<T>(actionName, args, ms);
}
