// Zustand Store 工厂函数
// 使用该文件需要import导入，导入别名：@/tools/storeFactory
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  clearCustomerSession,
  readCustomerSession,
  writeCustomerSession,
} from '@/frontend/utils/customerSessionPersist';

/**
 * 获取租户隔离的存储 key
 * 根据 URL 中的 PROJ_xxx 前缀生成唯一 key，防止多项目冲突
 */
const getTenantKey = (name: string): string => {
  return "clash Ver_" + name;
};

const isCustomerSessionStore = (name: string) => name === 'UserSession';

function syncCustomerSession(next: { token?: string; user_id?: string; username?: string; email?: string; preferredLocale?: string }) {
  const token = String(next.token || '').trim()
  const userId = String(next.user_id || '').trim()
  if (!token || !userId) return
  writeCustomerSession({
    token,
    user_id: userId,
    username: String(next.username || ''),
    email: String(next.email || ''),
    preferredLocale: String(next.preferredLocale || 'en') || 'en',
    role: 'CUSTOMER',
  })
}

/**
 * 创建带持久化的 Zustand Store
 * @param name Store 名称（用于 localStorage key）
 * @param initialState 初始状态
 * @returns Zustand store hook
 * 
 * 使用示例：
 * const useUserSession = createPersistStore<UserSession>('UserSession', { token: '', user_id: '', username: '' });
 * 
 * // 在组件中使用
 * const { token, set, reset } = useUserSession();
 * set({ token: 'new_token' }); // 更新
 * reset(); // 重置为初始值
 */
export function createPersistStore<T extends object>(
  name: string,
  initialState: T
) {
  const storageKey = getTenantKey(name);
  const isBrowser = typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function';
  const getInitialState = (): T => {
    if (!isBrowser) return initialState;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: T };
        if (parsed?.state && (!isCustomerSessionStore(name) || String((parsed.state as { token?: string }).token || '').trim())) {
          return { ...initialState, ...parsed.state };
        }
      }
    } catch {
      /* fall through to cookie backup */
    }
    if (isCustomerSessionStore(name)) {
      const backup = readCustomerSession();
      if (backup) return { ...initialState, ...backup };
    }
    return initialState;
  };
  const initialHydratedState = getInitialState();
  // 如果已经从 localStorage 同步读取到了数据，说明已经 hydrated
  const hasInitialData =
    isBrowser &&
    Boolean(localStorage.getItem(storageKey) || (isCustomerSessionStore(name) && readCustomerSession()));
  return create<T & { set: (partial: Partial<T>) => void; reset: () => void; _hasHydrated: boolean }>()(
    persist(
      (set) => ({
        ...initialHydratedState,
        _hasHydrated: !!hasInitialData,
        set: (partial) => set((state) => {
          const next = { ...state, ...partial };
          if (isCustomerSessionStore(name)) {
            const token = String((next as { token?: string }).token || '').trim();
            if (token) {
              syncCustomerSession(next as { token?: string; user_id?: string; username?: string; email?: string; preferredLocale?: string });
            } else if (Object.prototype.hasOwnProperty.call(partial, 'token')) {
              clearCustomerSession();
            }
          }
          return next;
        }),
        reset: () => {
          if (isCustomerSessionStore(name)) clearCustomerSession();
          set(() => ({ ...initialState, _hasHydrated: true }));
        },
      }),
      {
        name: getTenantKey(name),
        storage: createJSONStorage(() => isBrowser ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          if (isCustomerSessionStore(name) && !String((state as { token?: string }).token || '').trim()) {
            const backup = readCustomerSession();
            if (backup) {
              state.set({ ...backup, _hasHydrated: true } as unknown as Partial<T>);
              return;
            }
          }
          state.set({ _hasHydrated: true } as unknown as Partial<T>);
        },
      }
    )
  );
}
