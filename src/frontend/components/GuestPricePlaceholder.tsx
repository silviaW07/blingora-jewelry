'use client'

import type { ReactNode } from 'react'
import { useUserSession } from '@/tools/FrontendSession'
import { useOptionalCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext'
import { useTranslation } from 'react-i18next'
import { openStorefrontLogin, useChromeActivate } from '@/frontend/utils/hardNavigate'
import { cn } from '@/lib/utils'

/**
 * Guest cannot see storefront prices until they have a real customer session.
 * Default to hidden before persist rehydration to avoid flashing USD prices.
 */
export function useCanViewStorePrice(): boolean {
  const session = useUserSession()
  const token = String(session?.token || '').trim()
  const userId = String(session?.user_id || '').trim()
  const hydrated = Boolean((session as { _hasHydrated?: boolean })?._hasHydrated)

  // Until localStorage session is ready, never reveal prices.
  if (!hydrated) return false
  if (!token || !userId) return false
  return true
}

type GuestPricePlaceholderProps = {
  className?: string
  /** denser text for cards / SKU rows */
  compact?: boolean
}

/**
 * Clickable “Login to view price” — opens the customer auth modal when available.
 */
export function GuestPricePlaceholder({ className, compact = false }: GuestPricePlaceholderProps) {
  const { t } = useTranslation()
  const authModal = useOptionalCustomerAuthModal()
  const openLogin = useChromeActivate(() => {
    openStorefrontLogin(authModal?.openAuthModal)
  })

  return (
    <button
      type="button"
      className={cn(
        'guest-price-placeholder relative z-[2] text-left font-semibold text-[#f254a6] transition hover:text-[#e44798] hover:underline',
        compact ? 'text-xs leading-4 sm:text-sm' : 'text-sm leading-5 sm:text-base',
        className,
      )}
      {...openLogin}
    >
      {t('product.loginToViewPrice', { defaultValue: 'Login to view price' })}
    </button>
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
