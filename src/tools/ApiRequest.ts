import { useUserSession } from '@/tools/FrontendSession';
import { useAdminSession } from '@/tools/BackendSession';
import { useAppUserSession } from '@/tools/AppSession';
import { toast } from 'sonner';

const frontendPages: string[] = ["Home","","productcategory","productdetail","cart","customerlogin","customerregister"];
const appPages: string[] = ["Home"];

// 获取去除项目ID前缀后的路径
const getPathWithoutProjectId = (pathname: string): string => {
  const parts = pathname.split('/').filter(part => part);
  // 如果第一部分是项目ID，则去掉它
  if (parts.length > 0 && parts[0].startsWith('PROJ_')) {
    parts.shift();
  }
  return '/' + parts.join('/');
};

const getToken = () => {
  // 1. 获取当前浏览器路径 (pathname 本身不包含 search 参数，例如 ?id=1)
  const pathname = window.location.pathname;

  // 2. 去除项目ID前缀，获取实际路由路径
  const cleanPath = getPathWithoutProjectId(pathname);

  // 3. 检查路径类型：frontend、app 或 backend
  // 先检查是否是 app 页面
  const isApp = appPages.some(page => {
    const pageBase = page.split('?')[0];
    const normalizedPage = pageBase.startsWith('/') ? pageBase : `/${pageBase}`;
    const normalizedPathname = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    
    if (normalizedPage === '/' && normalizedPathname !== '/') {
        return false;
    }
    
    return normalizedPathname === normalizedPage || normalizedPathname.startsWith(`${normalizedPage}/`);
  });
  
  if (isApp) {
    const session = useAppUserSession.getState();
    return session?.token || '';
  }

  // 检查 cleanPath 是否以 frontendPages 中的任何路径开头
  const isFrontend = frontendPages.some(page => {
    // 【修改点】: 获取配置项的纯路径部分，去掉配置项中可能存在的 '?' 及后面的参数
    const pageBase = page.split('?')[0];

    // 规范化路径，确保以 / 开头
    const normalizedPage = pageBase.startsWith('/') ? pageBase : `/${pageBase}`;
    const normalizedPathname = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

    // 处理空字符串配置（通常代表首页），避免匹配错误
    if (normalizedPage === '/' && normalizedPathname !== '/') {
        return false;
    }

    // 精确匹配 或 路径前缀匹配
    // 例如：当前路径 /bookdetailpage 匹配配置 /bookdetailpage
    return normalizedPathname === normalizedPage || normalizedPathname.startsWith(`${normalizedPage}/`);
  });

  // 从 Zustand Store 读取 token
  if (isFrontend) {
    const session = useUserSession.getState();
    return session?.token || '';
  } else {
    const session = useAdminSession.getState();
    return session?.token || '';
  }
}

const getProjectId = () => {
  const projectIdFromPath = window.location.pathname.split("/").find(part => part.startsWith("PROJ_"));
  if (projectIdFromPath) return projectIdFromPath;
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "clash Ver";
  }
  return "clash Ver";
}

export interface ApiResponse<T> {
  status: 'success' | 'fail';
  message: string;
  data: T;
  success: boolean;
}

export async function apiRequest<T>(page: string, serviceName: string, params: any = null): Promise<ApiResponse<T | null>> {
  try {
    const token = getToken();

    // 判断是否已经是 { body: ... } 形式
    const normalized = params && typeof params === 'object' && 'body' in params
          ? (params as any).body
          : params;


    const response = await fetch(`/flow-engine/${getProjectId()}/v2/run_flow`, {
      method: 'POST',
      headers: {
        'Token': token,
        'Content-Type': 'application/json',
      },
      // credentials: 'include',
      body: JSON.stringify({
        page,
        service_name: serviceName,
        params: {
          body: normalized
        }
      }),
    });

    const result = await response.json();
    if (result.status === 'fail' && result.message) {
      toast.error(result.message);
    }
    return result;
  } catch (error) {
    console.error('request failed:', error);
    return { status: 'fail', message: 'request failed', data: null, success: false};
  }
};
