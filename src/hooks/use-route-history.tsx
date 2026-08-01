'use client';

import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface RouteHistoryState {
  previousPathname: string | null;
  currentPathname: string;
  history: string[];
}

interface RouteHistoryProviderProps {
  children: React.ReactNode;
  /**
   * 可选：判断某个路径是否应被记录到页面栈。
   * - 返回 true  → 记录
   * - 返回 false → 跳过
   * - 不传此参数 → 所有路径都记录（向后兼容）
   */
  shouldRecord?: (pathname: string) => boolean;
}

const RouteHistoryContext = createContext<RouteHistoryState | null>(null);

export function RouteHistoryProvider({ children, shouldRecord }: RouteHistoryProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [historyState, setHistoryState] = useState<{
    history: string[];
    index: number;
  }>({
    history: [],
    index: -1
  });
  const lastPathRef = useRef<string | null>(null);
  // 用 ref 存储 shouldRecord，避免在 useEffect 依赖中因函数引用变化而反复触发
  const shouldRecordRef = useRef(shouldRecord);
  shouldRecordRef.current = shouldRecord;

  const currentPathname = useMemo(() => {
    try {
      const search = searchParams?.toString() ?? '';
      return search ? `${pathname}?${search}` : pathname;
    } catch {
      // 兜底：searchParams 可能在某些 SSR 场景下异常
      return pathname ?? '/';
    }
  }, [pathname, searchParams]);

  // 路由切换时滚动到顶部。GSAP ScrollTrigger 会将 history.scrollRestoration 设为 "manual"，
  // 导致生产构建下 Next 的默认滚顶行为失效，此处显式补偿。
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    } catch {
      // 静默处理：某些环境下 scrollTo 可能不可用
    }
  }, [pathname]);

  useEffect(() => {
    if (lastPathRef.current === currentPathname) return;
    lastPathRef.current = currentPathname;

    // 如果提供了 shouldRecord 且当前路径不满足条件，则不记录到页面栈
    try {
      if (typeof shouldRecordRef.current === 'function' && !shouldRecordRef.current(currentPathname)) {
        return;
      }
    } catch {
      // shouldRecord 出错时，默认放行记录，避免整个组件崩溃
    }

    setHistoryState((prev) => {
      try {
        if (prev.history.length === 0) {
          return { history: [currentPathname], index: 0 };
        }

        if (prev.history[prev.index] === currentPathname) {
          return prev;
        }

        const backIndex = prev.index - 1;
        if (backIndex >= 0 && prev.history[backIndex] === currentPathname) {
          return { ...prev, index: backIndex };
        }

        const forwardIndex = prev.index + 1;
        if (forwardIndex < prev.history.length && prev.history[forwardIndex] === currentPathname) {
          return { ...prev, index: forwardIndex };
        }

        const nextHistory = [...prev.history.slice(0, prev.index + 1), currentPathname];
        return { history: nextHistory, index: nextHistory.length - 1 };
      } catch {
        // 兜底：任何异常都不应该阻止渲染
        return prev;
      }
    });
  }, [currentPathname]);

  const previousPathname =
    historyState.index > 0 ? historyState.history[historyState.index - 1] : null;
  const history = historyState.history;

  const value = useMemo(
    () => ({
      previousPathname,
      currentPathname,
      history
    }),
    [previousPathname, currentPathname, history]
  );

  return <RouteHistoryContext.Provider value={value}>{children}</RouteHistoryContext.Provider>;
}

export function useRouteHistory() {
  const context = useContext(RouteHistoryContext);
  // 始终调用 usePathname() 以满足 Hooks 规则，同时作为 Provider 不存在时的响应式兜底
  const pathname = usePathname();

  if (context) return context;

  // Provider 不存在时（frontend / backend 等分组），返回响应式的安全默认值
  return {
    previousPathname: null,
    currentPathname: pathname ?? '/',
    history: []
  };
}

export function useRouteBack(options?: { fallback?: string }) {
  const context = useContext(RouteHistoryContext);
  const router = useRouter();
  // 始终调用 usePathname()，保证 Hooks 调用顺序稳定
  const pathname = usePathname();
  const fallback = options?.fallback ?? '/';
  
  const previousPathname = context?.previousPathname ?? null;
  const goBackPath = useCallback(() => previousPathname ?? fallback, [previousPathname, fallback]);
  
  const goBack = useCallback(() => {
    try {
      if (!context) {
        // Provider 不存在（frontend / backend），使用浏览器原生后退
        router.back();
      } else if (previousPathname) {
        router.push(goBackPath());
      } else {
        router.push(fallback);
      }
    } catch {
      // 兜底：路由跳转失败时静默处理
      try {
        if (typeof window !== 'undefined') {
          window.history.back();
        }
      } catch {
        // 最终兜底
      }
    }
  }, [context, previousPathname, goBackPath, fallback, router]);

  return {
    previousPathname,
    currentPathname: context?.currentPathname ?? pathname ?? '/',
    goBackPath,
    goBack
  };
}
