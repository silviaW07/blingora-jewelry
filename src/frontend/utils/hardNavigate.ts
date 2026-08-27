'use client'

import { useCallback, useEffect, useRef } from 'react'

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

type ReliableTapOptions = {
  disabled?: boolean
  debounceMs?: number
}

const TAP_SLOP_PX = 12
const SCROLL_CANCEL_PX = 6

type TapOrigin = { x: number; y: number; scrollY: number }

function readScrollY() {
  if (typeof window === 'undefined') return 0
  return window.scrollY || window.pageYOffset || 0
}

function tapWasScroll(origin: TapOrigin | null, x: number, y: number) {
  if (!origin) return false
  const dx = Math.abs(x - origin.x)
  const dy = Math.abs(y - origin.y)
  const ds = Math.abs(readScrollY() - origin.scrollY)
  return dx > TAP_SLOP_PX || dy > TAP_SLOP_PX || ds > SCROLL_CANCEL_PX
}

/**
 * Chrome Android often drops React `click` on nested controls. Activate on pointerup
 * only when the finger barely moved — never on pointerdown, which fires mid-scroll.
 */
export function useReliableTap<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  { disabled = false, debounceMs = 320 }: ReliableTapOptions = {},
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const lastFire = useRef(0)
  const originRef = useRef<TapOrigin | null>(null)
  const scrolledRef = useRef(false)
  const unbindScrollRef = useRef<(() => void) | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const unbindScroll = () => {
    unbindScrollRef.current?.()
    unbindScrollRef.current = null
  }

  const bindScrollCancel = () => {
    unbindScroll()
    if (typeof window === 'undefined') return
    const onScroll = () => {
      scrolledRef.current = true
    }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    unbindScrollRef.current = () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }

  const suppressUntil = useRef(0)

  const fire = useCallback(() => {
    if (disabledRef.current) return
    const now = Date.now()
    if (now < suppressUntil.current) return
    if (now - lastFire.current < debounceMs) return
    lastFire.current = now
    handlerRef.current()
  }, [debounceMs])

  const ref = useCallback(
    (node: T | null) => {
      cleanupRef.current?.()
      cleanupRef.current = null
      unbindScroll()
      if (!node) return

      const onPointerDown = (event: PointerEvent) => {
        if (disabledRef.current || event.button !== 0) return
        event.stopPropagation()
        originRef.current = { x: event.clientX, y: event.clientY, scrollY: readScrollY() }
        scrolledRef.current = false
        bindScrollCancel()
      }

      const onEnd = (event: PointerEvent | TouchEvent) => {
        if (disabledRef.current) return
        event.stopPropagation()
        const origin = originRef.current
        originRef.current = null
        const scrolled = scrolledRef.current
        scrolledRef.current = false
        unbindScroll()
        let x = origin?.x ?? 0
        let y = origin?.y ?? 0
        if ('clientX' in event) {
          x = event.clientX
          y = event.clientY
        } else if (event.changedTouches?.[0]) {
          x = event.changedTouches[0].clientX
          y = event.changedTouches[0].clientY
        }
        if (scrolled || tapWasScroll(origin, x, y)) {
          suppressUntil.current = Date.now() + 500
          return
        }
        fire()
      }

      const onCancel = () => {
        originRef.current = null
        scrolledRef.current = false
        unbindScroll()
      }

      node.addEventListener('pointerdown', onPointerDown, { capture: true })
      node.addEventListener('pointerup', onEnd, { capture: true })
      node.addEventListener('pointercancel', onCancel, { capture: true })
      node.addEventListener('touchend', onEnd, { passive: true, capture: true })

      cleanupRef.current = () => {
        node.removeEventListener('pointerdown', onPointerDown, { capture: true })
        node.removeEventListener('pointerup', onEnd, { capture: true })
        node.removeEventListener('pointercancel', onCancel, { capture: true })
        node.removeEventListener('touchend', onEnd, { capture: true })
        unbindScroll()
      }
    },
    [fire],
  )

  useEffect(() => () => {
    cleanupRef.current?.()
    unbindScroll()
  }, [])

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      if (scrolledRef.current) return
      fire()
    },
    [fire],
  )

  return { ref, onClick }
}

/**
 * Nested storefront buttons (cart / wishlist). Record the press, then fire only on
 * pointerup/click if the gesture did not scroll — never on pointerdown.
 */
export function useChromeActivate(handler: () => void) {
  const fn = useRef(handler)
  fn.current = handler
  const last = useRef(0)
  const originRef = useRef<TapOrigin | null>(null)
  const scrolledRef = useRef(false)
  const suppressUntil = useRef(0)
  const unbindScrollRef = useRef<(() => void) | null>(null)

  const unbindScroll = () => {
    unbindScrollRef.current?.()
    unbindScrollRef.current = null
  }

  const bindScrollCancel = () => {
    unbindScroll()
    if (typeof window === 'undefined') return
    const onScroll = () => {
      scrolledRef.current = true
    }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    unbindScrollRef.current = () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }

  const commit = useCallback((x: number, y: number, event?: { stopPropagation?: () => void }) => {
    event?.stopPropagation?.()
    const now = Date.now()
    if (now < suppressUntil.current) return
    const origin = originRef.current
    const scrolled = scrolledRef.current
    originRef.current = null
    scrolledRef.current = false
    unbindScroll()
    if (scrolled || tapWasScroll(origin, x, y)) {
      suppressUntil.current = now + 500
      return
    }
    if (now - last.current < 400) return
    last.current = now
    fn.current()
  }, [])

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    event.stopPropagation()
    if (event.button !== 0) return
    originRef.current = { x: event.clientX, y: event.clientY, scrollY: readScrollY() }
    scrolledRef.current = false
    bindScrollCancel()
  }, [])

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    commit(event.clientX, event.clientY, event)
  }, [commit])

  const onPointerCancel = useCallback(() => {
    originRef.current = null
    scrolledRef.current = false
    unbindScroll()
  }, [])

  const onClick = useCallback((event: React.MouseEvent) => {
    commit(event.clientX, event.clientY, event)
  }, [commit])

  useEffect(() => () => unbindScroll(), [])

  return { onPointerDown, onPointerUp, onPointerCancel, onClick }
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
