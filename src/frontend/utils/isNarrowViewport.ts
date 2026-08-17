const NARROW_MQ = '(max-width: 1023px)'
const PHONE_DEVICE_MQ = '(max-device-width: 512px)'

/**
 * CSS pixel width of the device screen (not the layout viewport).
 * Some Chrome Android builds report screen.width in physical pixels.
 */
function cssScreenWidth(win: Window): number {
  const sw = win.screen?.width || 0
  const dpr = win.devicePixelRatio || 1
  if (sw > 540 && dpr > 1) return Math.round(sw / dpr)
  return sw
}

export function isPhoneScreen(win: Window = window): boolean {
  if (win.matchMedia?.(PHONE_DEVICE_MQ).matches) return true
  const cssW = cssScreenWidth(win)
  return cssW >= 280 && cssW <= 540
}

function viewportContent(win: Window): string {
  const cssW = cssScreenWidth(win)
  if (isPhoneScreen(win) && cssW >= 280 && cssW <= 540) {
    return `width=${cssW},initial-scale=1,viewport-fit=cover`
  }
  return 'width=device-width,initial-scale=1,viewport-fit=cover'
}

let viewportObserver: MutationObserver | null = null

/**
 * Chrome on phones often ignores width=device-width and lays out at ~980 or
 * "desktop site" 1024–1280. Pin the layout viewport to the screen CSS width
 * so Tailwind lg: and the mobile tree actually match other mobile browsers.
 */
export function lockStorefrontViewport(win: Window = window): void {
  const doc = win.document
  const head = doc.head || doc.documentElement
  let meta = doc.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
  if (!meta) {
    meta = doc.createElement('meta')
    meta.setAttribute('name', 'viewport')
    head.insertBefore(meta, head.firstChild)
  }
  const content = viewportContent(win)
  if (meta.getAttribute('content') !== content) {
    meta.setAttribute('content', content)
    if (meta.parentNode) meta.parentNode.appendChild(meta)
  }
  if (!viewportObserver) {
    viewportObserver = new MutationObserver(() => {
      const current = doc.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
      if (!current) return
      const next = viewportContent(win)
      if (current.getAttribute('content') !== next) current.setAttribute('content', next)
    })
    viewportObserver.observe(meta, { attributes: true, attributeFilter: ['content'] })
  }
}

/**
 * Shared layout breakpoint for every browser. No UA sniffing.
 * Phone screens stay mobile even when the layout viewport is inflated.
 */
export function isNarrowViewport(win: Window = window): boolean {
  if (win.matchMedia?.(NARROW_MQ).matches) return true
  if ((win.innerWidth || 9999) < 1024) return true
  const visual = win.visualViewport?.width
  if (visual && visual < 1024) return true
  return isPhoneScreen(win)
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
    if (win.document.body) {
      win.document.body.style.overflowX = 'hidden'
      win.document.body.style.maxWidth = '100%'
    }
  } else {
    root.style.removeProperty('overflow-x')
    root.style.removeProperty('max-width')
    root.style.removeProperty('width')
    if (win.document.body) {
      win.document.body.style.removeProperty('overflow-x')
      win.document.body.style.removeProperty('max-width')
    }
  }
  return narrow
}
