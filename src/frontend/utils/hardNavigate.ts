/** Full-page jump — bypass Next client router (Chrome mobile often swallows Link clicks). */
export function hardNavigate(href: string) {
  if (typeof window === 'undefined') return
  const next = String(href || '').trim() || '/'
  window.location.assign(next)
}

export function onHardNavClick(href: string) {
  return (event: { preventDefault: () => void; stopPropagation: () => void }) => {
    event.preventDefault()
    event.stopPropagation()
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
