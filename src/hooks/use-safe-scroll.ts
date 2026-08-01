import { useEffect, useLayoutEffect, useState, RefObject } from 'react';
import { useScroll, UseScrollOptions } from 'framer-motion';

// 使用 useLayoutEffect 在服务端渲染时不会报错
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface UseSafeScrollOptions extends Omit<UseScrollOptions, 'target'> {
  target?: RefObject<HTMLElement | null>;
}

/**
 * 安全的 useScroll hook，确保 ref 在使用前已经挂载
 * 解决了 Motion 的水合错误问题
 */
export function useSafeScroll(options: UseSafeScrollOptions = {}) {
  const [isMounted, setIsMounted] = useState(false);
  const { target, ...restOptions } = options;

  useIsomorphicLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  // 只有在挂载后且 ref 存在时才传入 target
  const scrollOptions: UseScrollOptions = {
    ...restOptions,
    ...(isMounted && target?.current ? { target } : {}),
  };

  return useScroll(scrollOptions);
}

