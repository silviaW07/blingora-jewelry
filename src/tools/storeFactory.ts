// Zustand Store 工厂函数
// 使用该文件需要import导入，导入别名：@/tools/storeFactory
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 获取租户隔离的存储 key
 * 根据 URL 中的 PROJ_xxx 前缀生成唯一 key，防止多项目冲突
 */
const getTenantKey = (name: string): string => {
  return "clash Ver_" + name;
};

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
      if (!raw) return initialState;
      const parsed = JSON.parse(raw) as { state?: T };
      if (!parsed?.state) return initialState;
      return { ...initialState, ...parsed.state };
    } catch {
      return initialState;
    }
  };
  const initialHydratedState = getInitialState();
  // 如果已经从 localStorage 同步读取到了数据，说明已经 hydrated
  const hasInitialData = isBrowser && localStorage.getItem(storageKey);
  return create<T & { set: (partial: Partial<T>) => void; reset: () => void; _hasHydrated: boolean }>()(
    persist(
      (set) => ({
        ...initialHydratedState,
        _hasHydrated: !!hasInitialData,
        set: (partial) => set((state) => ({ ...state, ...partial })),
        reset: () => set(() => ({ ...initialState, _hasHydrated: true })),
      }),
      {
        name: getTenantKey(name),
        storage: createJSONStorage(() => isBrowser ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.set({ _hasHydrated: true } as unknown as Partial<T>);
          }
        },
      }
    )
  );
}
