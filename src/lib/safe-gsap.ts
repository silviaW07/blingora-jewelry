/**
 * Safe GSAP Wrapper
 * 
 * 用 Proxy 包裹 gsap，所有方法调用自动 try-catch。
 * 当目标元素为 null 时不会抛错，页面正常渲染，只是没动画。
 * 
 * 通过 tsconfig paths + rsbuild alias 重定向：
 *   import gsap from 'gsap'  →  实际引入本文件
 */

// 直接从 gsap 包的实际路径引入，避免循环引用
import originalGsap from 'gsap/dist/gsap';

type AnyFn = (...args: any[]) => any;

const createSafeProxy = <T extends object>(target: T): T => {
  const handler: ProxyHandler<T> = {
    get(obj, prop, receiver) {
      const val = Reflect.get(obj, prop, receiver);
      if (typeof val === 'function') {
        return (...args: any[]) => {
          try {
            const result = (val as AnyFn).apply(obj, args);
            // timeline 等返回的对象也包一层 proxy，保证链式调用安全
            if (result && typeof result === 'object' && result !== obj) {
              return createSafeProxy(result);
            }
            return result;
          } catch (e) {
            console.warn(`[safe-gsap] ${String(prop)}() silenced:`, (e as Error).message);
            // 返回 obj 本身以支持链式调用 tl.fromTo().to() 不断链
            return createSafeProxy(obj);
          }
        };
      }
      return val;
    },
  };

  return new Proxy(target, handler);
};

const safeGsap = createSafeProxy(originalGsap);

export default safeGsap;
// 兼容 import { gsap } from 'gsap' 的写法
export { safeGsap as gsap };
export * from 'gsap/dist/gsap';
