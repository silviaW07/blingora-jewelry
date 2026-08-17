/** Chrome on phones often uses a ~980px CSS viewport; screen.width stays ~360. */
export function isNarrowViewport(win: Window = window): boolean {
  const screenW = win.screen?.width || 9999
  const inner = win.innerWidth || 9999
  const visual = win.visualViewport?.width || 9999
  const mq = win.matchMedia('(max-width: 767px)').matches
  const ua = String(win.navigator?.userAgent || '')
  const uaMobile = /Android|iPhone|iPod|Mobile/i.test(ua)
  return mq || Math.min(screenW, inner, visual) < 768 || (uaMobile && screenW < 900)
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
