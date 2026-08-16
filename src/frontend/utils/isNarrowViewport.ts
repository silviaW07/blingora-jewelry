/** Chrome on phones often uses a ~980px CSS viewport; screen.width stays ~360. */
export function isNarrowViewport(win: Window = window): boolean {
  const screenW = win.screen?.width || 9999
  const inner = win.innerWidth || 9999
  const visual = win.visualViewport?.width || 9999
  const mq = win.matchMedia('(max-width: 767px)').matches
  return mq || Math.min(screenW, inner, visual) < 768
}

export function syncNarrowHtmlClass(win: Window = window): boolean {
  const narrow = isNarrowViewport(win)
  win.document.documentElement.classList.toggle('is-narrow', narrow)
  return narrow
}
