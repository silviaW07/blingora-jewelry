/** Chrome on phones often uses a ~980px CSS viewport; screen.width may also lie. */

function isMobileUserAgent(win: Window): boolean {
  const ua = String(win.navigator?.userAgent || '')
  if (/Android|webOS|iPhone|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)) return true
  // iPadOS 13+ reports as Macintosh + touch
  if (/iPad/i.test(ua)) return true
  if ((win.navigator.maxTouchPoints || 0) > 1 && /Macintosh/i.test(ua)) return true
  return false
}

export function isNarrowViewport(win: Window = window): boolean {
  if (isMobileUserAgent(win)) return true
  const screenW = win.screen?.width || 9999
  const inner = win.innerWidth || 9999
  const visual = win.visualViewport?.width || 9999
  const mq = win.matchMedia('(max-width: 767px)').matches
  return mq || Math.min(screenW, inner, visual) < 768
}

export function syncNarrowHtmlClass(win: Window = window): boolean {
  const narrow = isNarrowViewport(win)
  const root = win.document.documentElement
  root.classList.toggle('is-narrow', narrow)
  if (narrow) {
    root.style.overflowX = 'hidden'
    root.style.maxWidth = '100%'
    if (win.document.body) {
      win.document.body.style.overflowX = 'hidden'
      win.document.body.style.maxWidth = '100%'
    }
  }
  return narrow
}
