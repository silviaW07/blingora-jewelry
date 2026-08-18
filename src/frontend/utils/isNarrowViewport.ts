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

function viewportContent(win: Window): string {
  const cssW = cssScreenWidth(win)
  if (isPhoneScreen(win) && cssW >= 280 && cssW <= 540) {
    return `width=${cssW},initial-scale=1,viewport-fit=cover`
  }
  return 'width=device-width,initial-scale=1,viewport-fit=cover'
}

let viewportObserver: MutationObserver | null = null

export function lockStorefrontViewport(win: Window = window): void {
  const doc = win.document
  const head = doc.head || doc.documentElement
  let meta = doc.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
  if (!meta) {
    meta = doc.createElement('meta')
    meta.setAttribute('name', 'viewport')
    head.insertBefore(meta, head.firstChild)
  }
  const applyContent = () => {
    const content = viewportContent(win)
    if (meta.getAttribute('content') !== content) {
      meta.setAttribute('content', content)
      if (meta.parentNode) meta.parentNode.appendChild(meta)
    }
  }
  applyContent()
  if (isPhoneScreen(win) && (win.innerWidth || 0) > 540) {
    applyContent()
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
 * Same rule in every browser: phone screen → mobile layout.
 * After viewport lock, Chrome’s innerWidth should match Safari (~360–430).
 */
export function isNarrowViewport(win: Window = window): boolean {
  lockStorefrontViewport(win)
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
