/** Full-page jump — bypass Next client router (Chrome mobile often swallows Link clicks). */
export function hardNavigate(href: string) {
  if (typeof window === 'undefined') return
  try {
    window.location.assign(new URL(String(href || '').trim() || '/', window.location.origin).href)
  } catch {
    window.location.href = String(href || '').trim() || '/'
  }
}

export function onHardNavClick(href: string) {
  return (event: {
    currentTarget?: { tagName?: string }
    preventDefault?: () => void
    stopPropagation?: () => void
    metaKey?: boolean
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    button?: number
  }) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (typeof event.button === 'number' && event.button !== 0) return
    // Next intercepts same-origin <a> for client routing; Chrome mobile often
    // never finishes that transition (blank Account / dead Categories).
    event.preventDefault?.()
    event.stopPropagation?.()
    hardNavigate(href)
  }
}

export function categoryHref(slug?: string | null, categoryId?: string | null) {
  const normalized = String(slug || '').trim().replace(/^\/+|\/+$/g, '')
  if (normalized) return `/category/${encodeURIComponent(normalized)}/`
  const id = String(categoryId || '').trim()
  if (id) return `/?categoryId=${encodeURIComponent(id)}`
  return '/'
}

export function productHref(productId: string) {
  const id = String(productId || '').trim()
  if (!id) return '/productdetail/'
  return `/productdetail/?productId=${encodeURIComponent(id)}`
}

export function orderDetailHref(orderId: string) {
  const id = String(orderId || '').trim()
  if (!id) return '/account/orders/'
  return `/account/orders/detail/?orderId=${encodeURIComponent(id)}`
}

export function orderPayHref(orderId: string) {
  const id = String(orderId || '').trim()
  if (!id) return '/account/orders/'
  return `/account/orders/pay/?orderId=${encodeURIComponent(id)}`
}
