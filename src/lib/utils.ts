import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// 扩展 tailwind-merge，让自定义 fontSize 类不和颜色类冲突
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // 把自定义字号类归到 'font-size' 组，和颜色类 'text-color' 分开
      'font-size': [
        'text-display',
        'text-h1',
        'text-h2',
        'text-h3',
        'text-h4',
        'text-base',
        'text-sm-body',
        'text-caption',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── External Link Helpers (Popup Mode) ──────────────────────────────
//
// Opens external URLs (OAuth, payment) in a centered popup window.
// The popup keeps window.opener, so the callback page can use
// postMessage to notify the original page and window.close() to
// close itself.
//
// Fallback: if popup is blocked (e.g., sandboxed iframe without
// allow-popups), navigates the top-level window or current page.
// ─────────────────────────────────────────────────────────────────────

const POPUP_MESSAGE_SOURCE = 'external-link-popup';

/** Calculate centered popup position. */
function getPopupFeatures(): string {
  const w = Math.round(screen.width / 3);
  const h = Math.round(screen.height * 0.75);
  const left = Math.round((screen.width - w) / 2);
  const top = Math.round((screen.height - h) / 2);
  return `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`;
}

/** Navigate away as a last resort (tries top-level first, then current page). */
function navigateAway(url: string): void {
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return;
    }
  } catch { /* cross-origin top, fall through */ }
  window.location.href = url;
}

/**
 * Open an external link in a popup window.
 *
 * Use this for flows where the URL is available synchronously.
 * Falls back to navigating the current/top-level page if popup is blocked.
 *
 * @param url - The external URL to open.
 * @returns The popup Window reference, or null if fallback was used.
 */
export function openExternalLink(url: string): Window | null {
  if (!url) return null;
  const w = window.open(url, 'external-link', getPopupFeatures());
  if (!w) {
    navigateAway(url);
    return null;
  }
  return w;
}

/**
 * Open an external link in a popup when the URL is obtained asynchronously
 * (e.g., after an API call to create a payment session or get an OAuth URL).
 *
 * Opens a blank popup immediately (in the user-gesture synchronous stack)
 * to avoid popup blockers, then navigates it once the URL resolves.
 *
 * @param getUrl - Async function that returns the URL to navigate to.
 * @returns The popup Window reference, or null if fallback was used.
 */
export function openExternalLinkAsync(
  getUrl: () => Promise<string>,
  options: {
    onNavigate?: (url: string) => void;
    onError?: (error: unknown) => void;
  } = {},
): Window | null {
  // Open popup immediately in the user-gesture call stack
  const w = window.open('about:blank', 'external-link', getPopupFeatures());

  if (!w) {
    // Popup blocked — fallback: navigate away after async resolves
    getUrl()
      .then((url) => {
        options.onNavigate?.(url);
        navigateAway(url);
      })
      .catch((error) => {
        options.onError?.(error);
      });
    return null;
  }

  // Show a loading state in the popup
  try {
    w.document.title = 'Redirecting...';
    w.document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#666;">' +
      '<p>Redirecting...</p></div>';
  } catch { /* ignore */ }

  getUrl()
    .then((url) => {
      options.onNavigate?.(url);
      w.location.href = url;
    })
    .catch((error) => {
      try { w.close(); } catch { /* ignore */ }
      options.onError?.(error);
    });

  return w;
}

// ─── Callback Page Helpers (Popup → Opener communication) ────────────

/**
 * Check if the current page was opened as a popup (has an opener window).
 */
export function isExternalLinkPopup(): boolean {
  try {
    return !!window.opener;
  } catch {
    return false;
  }
}

/**
 * Notify the opener page and close this popup.
 *
 * Call this from callback pages (OAuth redirect, payment success) after
 * processing the result. Uses postMessage to send data to the opener,
 * then closes the popup.
 *
 * If window.opener is not available (e.g., navigateAway fallback was used),
 * does nothing — the callback page should handle this case by completing
 * the login/payment flow directly.
 *
 * @param data - Data to send to the opener (e.g., { type: 'oauth-success', payload: result }).
 */
export function closeExternalLinkPopup(data?: Record<string, unknown>): void {
  try {
    if (window.opener && data) {
      window.opener.postMessage(
        { source: POPUP_MESSAGE_SOURCE, ...data },
        '*',
      );
    }
  } catch { /* cross-origin opener, ignore */ }
  // Small delay to ensure postMessage is delivered before closing
  setTimeout(() => {
    try { window.close(); } catch { /* ignore */ }
  }, 300);
}

/**
 * Listen for messages from popup windows opened by openExternalLink/openExternalLinkAsync.
 *
 * @param callback - Called when a message from a popup is received.
 * @returns Cleanup function to remove the listener.
 *
 * Usage:
 * ```ts
 * useEffect(() => {
 *   return onExternalLinkMessage((data) => {
 *     if (data.type === 'oauth-success') {
 *       // handle login success
 *     }
 *   });
 * }, []);
 * ```
 */
export function onExternalLinkMessage(
  callback: (data: Record<string, unknown>) => void,
): () => void {
  const handler = (event: MessageEvent) => {
    if (!event.data || event.data.source !== POPUP_MESSAGE_SOURCE) return;
    callback(event.data);
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}
