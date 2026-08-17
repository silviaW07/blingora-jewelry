'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useUserSession } from '@/tools/FrontendSession'
import { useTranslation } from 'react-i18next'
import { customerLoginHref, hardNavigate, hardNavProps } from '@/frontend/utils/hardNavigate'
import { cn } from '@/lib/utils'

export function isStorefrontGuestSession(session: {
  token?: string | null
  user_id?: string | null
} | null | undefined): boolean {
  return !String(session?.token || '').trim() || !String(session?.user_id || '').trim()
}

export function useIsStorefrontGuest(): boolean {
  const token = useUserSession((s) => s.token)
  const userId = useUserSession((s) => s.user_id)
  return isStorefrontGuestSession({ token, user_id: userId })
}

/**
 * Guest cannot see storefront prices until they have a real customer session.
 * Default to hidden before persist rehydration to avoid flashing USD prices.
 */
export function useCanViewStorePrice(): boolean {
  const session = useUserSession()
  const hydrated = Boolean((session as { _hasHydrated?: boolean })?._hasHydrated)

  // Until localStorage session is ready, never reveal prices.
  if (!hydrated) return false
  return !isStorefrontGuestSession(session)
}

type GuestPricePlaceholderProps = {
  className?: string
  /** denser text for cards / SKU rows */
  compact?: boolean
}

/**
 * Real link — Chrome Android often never fires button/modal handlers on this page.
 */
export function GuestPricePlaceholder({ className, compact = false }: GuestPricePlaceholderProps) {
  const { t } = useTranslation()
  const pathname = usePathname() || '/'
  const href = customerLoginHref(pathname)

  return (
    <a
      className={cn(
        'guest-price-placeholder relative z-[2] inline-block py-1 text-left font-semibold text-[#f254a6] underline-offset-2 hover:text-[#e44798] hover:underline',
        compact ? 'text-xs leading-4 sm:text-sm' : 'text-sm leading-5 sm:text-base',
        className,
      )}
      {...hardNavProps(href)}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const returnTo =
          typeof window === 'undefined'
            ? pathname
            : `${window.location.pathname}${window.location.search}`
        hardNavigate(customerLoginHref(returnTo))
      }}
    >
      {t('product.loginToViewPrice', { defaultValue: 'Login to view price' })}
    </a>
  )
}

/** Alias for list wiring / product docs */
export const GuestPlaceholder = GuestPricePlaceholder

type StorePriceProps = {
  children: ReactNode
  className?: string
  compact?: boolean
}

/** Renders real price for logged-in users; guests see Login to view price. */
export function StorePrice({ children, className, compact = false }: StorePriceProps) {
  const canView = useCanViewStorePrice()
  if (!canView) {
    return <GuestPricePlaceholder className={className} compact={compact} />
  }
  return <>{children}</>
}
