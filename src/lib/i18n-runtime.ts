/**
 * 运行时 i18n — fetch JSON + DOM 文本替换
 *
 * 不硬编码任何语言。运行时根据 localStorage 决定目标语言，
 * fetch 对应的 i18n/{locale}.json 按需加载，不打进 bundle。
 *
 * 语言切换：window.__switchLocale('ar') → 存 localStorage → reload
 * 页面加载时自动检测 localStorage，有目标语言就 fetch + 翻译。
 * 项目原始语言从 <html lang="xx"> 读取，不翻译原始语言。
 */

let currentDict: Record<string, string> | null = null;
let observer: MutationObserver | null = null;

function translateTree(root: Node, dict: Record<string, string>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    const text = node.textContent?.trim();
    if (!text || text.length < 2) continue;
    if (dict[text] && dict[text] !== text) {
      const current = node.textContent ?? '';
      node.textContent = current.replace(text, dict[text]);
    }
  }
  if (root instanceof Element || root === document.body) {
    const target = root instanceof Element ? root : document.body;
    target.querySelectorAll('[placeholder], [aria-label], [title], [alt]').forEach(el => {
      for (const attr of ['placeholder', 'aria-label', 'title', 'alt']) {
        const val = el.getAttribute(attr);
        if (val && dict[val] && dict[val] !== val) {
          el.setAttribute(attr, dict[val]);
        }
      }
    });
  }
}

async function fetchDict(locale: string): Promise<Record<string, string> | null> {
  try {
    // 用 __dynamic_base__ 拼路径，兼容 /PROJ_xxx/ 前缀部署
    const base = (window as any).__dynamic_base__ || '';
    const url = `${base}/i18n/${locale}.json`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    return (typeof data === 'object' && data !== null) ? data : null;
  } catch {
    return null;
  }
}

export async function initI18n(locale: string) {
  if (observer) { observer.disconnect(); observer = null; }
  currentDict = null;

  if (!locale) return;

  const dict = await fetchDict(locale);
  if (!dict || Object.keys(dict).length === 0) {
    console.warn(`[i18n] Failed to load i18n/${locale}.json`);
    return;
  }
  currentDict = dict;

  console.log('[i18n] Translating to', locale, '—', Object.keys(dict).length, 'keys');

  // 更新 html lang 属性（dir 由业务层独立控制，不在此处设置）
  document.documentElement.setAttribute('lang', locale);

  translateTree(document.body, dict);

  observer = new MutationObserver(mutations => {
    if (!currentDict) return;
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(n => {
          if (n.nodeType === Node.ELEMENT_NODE) translateTree(n, currentDict!);
          else if (n.nodeType === Node.TEXT_NODE) {
            const t = (n as Text).textContent?.trim();
            if (t && currentDict![t] && currentDict![t] !== t) {
              const current = (n as Text).textContent ?? '';
              (n as Text).textContent = current.replace(t, currentDict![t]);
            }
          }
        });
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// 暴露到 window
if (typeof window !== 'undefined') {
  (window as any).__i18n = initI18n;

  /**
   * 语言切换入口。
   * 传原始语言（如 index.html 的 lang）= 切回原文，清除 localStorage。
   * 传其他语言 = 存 localStorage + reload，reload 后自动 fetch 翻译。
   */
  (window as any).__switchLocale = (locale: string) => {
    const originalLang = document.documentElement.getAttribute('data-original-lang')
      || document.documentElement.getAttribute('lang')
      || 'en';
    if (!locale || locale === originalLang) {
      localStorage.removeItem('i18n_locale');
    } else {
      localStorage.setItem('i18n_locale', locale);
    }
    location.reload();
  };
}

// 自动触发：读 localStorage，没有则 fallback 到 <html lang>
const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('i18n_locale') : null;
const targetLocale = savedLocale || document.documentElement.getAttribute('lang') || null;

if (targetLocale) {
  // 记录原始语言（reload 后 lang 属性会被 initI18n 改掉，需要保留原始值）
  if (!document.documentElement.getAttribute('data-original-lang')) {
    document.documentElement.setAttribute(
      'data-original-lang',
      document.documentElement.getAttribute('lang') || 'en'
    );
  }

  const waitForReact = setInterval(() => {
    const root = document.getElementById('root');
    if (root && root.children.length > 1) {
      clearInterval(waitForReact);
      setTimeout(() => initI18n(targetLocale), 300);
    }
  }, 100);
  // 5 秒兜底
  setTimeout(() => { clearInterval(waitForReact); initI18n(targetLocale); }, 5000);
}
