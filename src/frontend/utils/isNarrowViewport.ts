const NARROW_MQ = '(max-width: 1023px)'

/**
 * Shared layout breakpoint for every browser.
 * 1023px covers phones that still report ~980 CSS pixels after viewport lock.
 * Do not sniff UA.
 */
export function isNarrowViewport(win: Window = window): boolean {
  if (win.matchMedia?.(NARROW_MQ).matches) return true
  return (win.innerWidth || 9999) < 1024
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
  } else {
    root.style.removeProperty('overflow-x')
    root.style.removeProperty('max-width')
    if (win.document.body) {
      win.document.body.style.removeProperty('overflow-x')
      win.document.body.style.removeProperty('max-width')
    }
  }
  return narrow
}
