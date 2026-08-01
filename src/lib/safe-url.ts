/**
 * Safe URL Utilities
 *
 * 安全获取当前页面 URL，自动处理 iframe 嵌套场景。
 * 当项目被 iframe 嵌入其他系统时，window.location.href 拿到的是
 * 子应用自身的 URL，而非用户浏览器地址栏的真实地址。
 *
 * 用法：
 *   import { getSafeLocationHref } from '@/lib/safe-url';
 *   const url = getSafeLocationHref();
 */

/**
 * 获取当前页面的"对外可用" URL。
 *
 * 判断逻辑：
 * 1. 非 iframe 环境 → 直接返回 window.location.href（已包含 basePath）
 * 2. iframe 环境 → 优先使用 document.referrer（父页面地址），
 *    若 referrer 为空（跨域限制等）则 fallback 到自身 location.href
 */
export function getSafeLocationHref(): string {
  const isInIframe = typeof window !== 'undefined'
    && window.top !== window.self;

  if (isInIframe && document.referrer) {
    return document.referrer;
  }

  return typeof window !== 'undefined'
    ? window.location.href
    : '';
}
