'use client'

import { useCallback, useRef } from 'react'

let lastHardNav = { href: '', at: 0 }

/** Full-page jump — bypass Next client router (Chrome mobile often swallows Link clicks). */
export function hardNavigate(href: string) {
  if (typeof window === 'undefined') return
  let next = String(href || '').trim() || '/'
  try {
    next = new URL(next, window.location.origin).href
  } catch {
    next = next || '/'
  }
  const now = Date.now()
  if (lastHardNav.href === next && now - lastHardNav.at < 500) return
  lastHardNav = { href: next, at: now }
  try {
    window.location.assign(next)
  } catch {
    window.location.href = next
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

/**
 * Chrome Android often drops `click` on nested buttons (parent card steals it).
 * Fire the same action on pointerup + click, once per tap.
 */
export function useChromeActivate(handler: () => void) {
  const fn = useRef(handler)
  fn.current = handler
  const last = useRef(0)
  const run = useCallback((event?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    const now = Date.now()
    if (now - last.current < 400) return
    last.current = now
    fn.current()
  }, [])
  return { onPointerUp: run, onClick: run }
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
