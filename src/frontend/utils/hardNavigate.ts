'use client'

import { useCallback, useRef } from 'react'

declare global {
  interface Window {
    __storefrontNav?: (href: string) => void
  }
}

export const CUSTOMER_LOGIN_HREF = '/customerlogin/'
export const CUSTOMER_REGISTER_HREF = '/customerregister/'

export function customerLoginHref(returnTo?: string) {
  const next = String(returnTo || '').trim()
  if (!next) return CUSTOMER_LOGIN_HREF
  return `/customerlogin/?returnTo=${encodeURIComponent(next)}`
}

export function customerRegisterHref(returnTo?: string) {
  const next = String(returnTo || '').trim()
  if (!next) return CUSTOMER_REGISTER_HREF
  return `/customerregister/?returnTo=${encodeURIComponent(next)}`
}

/** Put on storefront <a> tags. A capture listener in app/layout.tsx full-page jumps. */
export const HARD_NAV_ATTR = 'data-hard-nav'

export function hardNavProps(href: string) {
  return { href, 'data-hard-nav': '' as const }
}

export function notifyStorefrontUrl() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('storefront:urlchange'))
}

let lastHardNav = { href: '', at: 0 }

function toAbsHref(href: string) {
  const raw = String(href || '').trim() || '/'
  try {
    return new URL(raw, window.location.origin).href
  } catch {
    return raw
  }
}

function sameHref(a: string, b: string) {
  const na = a.replace(/\/+$/, '')
  const nb = b.replace(/\/+$/, '')
  return na === nb
}

/**
 * Storefront navigation: App Router when hydrated (fast, same as other browsers),
 * otherwise a normal same-origin jump. Avoid full reloads — they made Chrome Android slow.
 */
export function hardNavigate(href: string) {
  if (typeof window === 'undefined') return
  const next = toAbsHref(href)
  const now = Date.now()
  if (sameHref(window.location.href, next)) return
  if (lastHardNav.href === next && now - lastHardNav.at < 400) return
  lastHardNav = { href: next, at: now }
  const spa = window.__storefrontNav
  if (typeof spa === 'function') {
    spa(next)
    notifyStorefrontUrl()
    return
  }
  try {
    window.location.assign(next)
  } catch {
    window.location.href = next
  }
}

/** After login/register: go back to returnTo, or home, or reload this page so prices/account update. */
export function redirectAfterStorefrontAuth() {
  if (typeof window === 'undefined') return
  const path = window.location.pathname || '/'
  const search = new URLSearchParams(window.location.search)
  const raw = String(search.get('returnTo') || search.get('redirect') || '').trim()
  const isAuthPage = /customerlogin|customerregister/i.test(path)
  let next = isAuthPage ? '/' : `${path}${window.location.search || ''}`
  if (raw) {
    try {
      const decoded = decodeURIComponent(raw)
      if (decoded.startsWith('/') && !decoded.startsWith('//')) next = decoded
    } catch {
      /* ignore */
    }
  }
  const current = `${path}${window.location.search || ''}`
  if (!isAuthPage && (current === next || `${current}/` === next || current === `${next}/`)) {
    return
  }
  hardNavigate(next)
}

/** For <button> / non-anchor only. Do not combine with data-hard-nav on the same <a>. */
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
    if (typeof event.button === 'number' && event.button > 0) return
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
 * Fire on pointerdown; do not preventDefault — that cancels the tap on Chrome.
 */
export function useChromeActivate(handler: () => void) {
  const fn = useRef(handler)
  fn.current = handler
  const last = useRef(0)
  const run = useCallback((event?: { stopPropagation?: () => void }) => {
    event?.stopPropagation?.()
    const now = Date.now()
    if (now - last.current < 400) return
    last.current = now
    fn.current()
  }, [])
  return { onPointerDown: run, onClick: run }
}

/** Guest login: full-page login/register. Dialogs do not show on Chrome Android. */
export function openStorefrontLogin(_openModal?: (tab?: 'login' | 'register') => void) {
  if (typeof window === 'undefined') return
  const returnTo = `${window.location.pathname}${window.location.search}`
  hardNavigate(customerLoginHref(returnTo))
}

/** Guest register: same full-page flow as login (Chrome never shows the Dialog). */
export function openStorefrontRegister(_openModal?: (tab?: 'login' | 'register') => void) {
  if (typeof window === 'undefined') return
  const returnTo = `${window.location.pathname}${window.location.search}`
  hardNavigate(customerRegisterHref(returnTo))
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
