const NARROW_MQ = '(max-width: 1023px)'
const PHONE_DEVICE_MQ = '(max-device-width: 512px)'

/** CSS pixel width of the phone short side (not Chrome’s ~980 layout viewport). */
export function cssScreenWidth(win: Window = window): number {
  const sw = win.screen?.width || 0
  const sh = win.screen?.height || 0
  const dpr = win.devicePixelRatio || 1
  let short = Math.min(sw, sh) || sw
  if (short > 540 && dpr > 1) short = Math.round(short / dpr)
  if (short >= 280 && short <= 540) return short
  if (dpr > 1) {
    const alt = Math.round((Math.min(sw, sh) || sw) / dpr)
    if (alt >= 280 && alt <= 540) return alt
  }
  return short
}

export function isPhoneScreen(win: Window = window): boolean {
  const cssW = cssScreenWidth(win)
  if (cssW >= 280 && cssW <= 540) return true
  if (win.matchMedia?.(PHONE_DEVICE_MQ).matches) return true
  return false
}

/**
 * Chrome Android often ignores width=device-width and keeps a 980px layout
 * viewport. Touch then hits the wrong place (dead + buttons / bottom nav).
 * Write an explicit CSS-pixel width so innerWidth matches the phone.
 */
export function lockStorefrontViewport(win: Window = window): void {
  if (!isPhoneScreen(win)) return
  const w = cssScreenWidth(win)
  if (w < 280 || w > 540) return
  const inner = win.innerWidth || 0
  if (inner > 0 && inner <= 540 && Math.abs(inner - w) < 64) return
  const doc = win.document
  let meta = doc.querySelector('meta[name="viewport"]')
  if (!meta) {
    meta = doc.createElement('meta')
    meta.setAttribute('name', 'viewport')
    doc.head?.insertBefore(meta, doc.head.firstChild)
  }
  const next = `width=${w}, initial-scale=1, minimum-scale=1, maximum-scale=1, viewport-fit=cover`
  if (meta.getAttribute('content') !== next) meta.setAttribute('content', next)
}

/**
 * Phone screen or <1024 CSS px → mobile layout in every browser.
 * Chrome Android may report ~980 innerWidth; `html.is-narrow` still applies via screen size.
 */
export function isNarrowViewport(win: Window = window): boolean {
  if (isPhoneScreen(win)) return true
  if (win.matchMedia?.(NARROW_MQ).matches) return true
  if ((win.innerWidth || 9999) < 1024) return true
  return false
}

export function syncNarrowHtmlClass(win: Window = window): boolean {
  lockStorefrontViewport(win)
  const narrow = isNarrowViewport(win)
  const root = win.document.documentElement
  root.classList.toggle('is-narrow', narrow)
  if (narrow) {
    root.style.overflowX = 'hidden'
    root.style.maxWidth = '100%'
    root.style.width = '100%'
    root.style.setProperty('-webkit-text-size-adjust', '100%')
    if (win.document.body) {
      win.document.body.style.overflowX = 'hidden'
      win.document.body.style.maxWidth = '100%'
    }
  } else {
    root.style.removeProperty('overflow-x')
    root.style.removeProperty('max-width')
    root.style.removeProperty('width')
    root.style.removeProperty('-webkit-text-size-adjust')
    if (win.document.body) {
      win.document.body.style.removeProperty('overflow-x')
      win.document.body.style.removeProperty('max-width')
    }
  }
  return narrow
}
