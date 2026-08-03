'use client'

import type { ReactNode } from 'react'
import { useUserSession } from '@/tools/FrontendSession'
import { useCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/** True when the storefront customer session has a non-empty token. */
export function useCanViewStorePrice(): boolean {
  const { token } = useUserSession()
  return Boolean(token?.trim())
}

type GuestPricePlaceholderProps = {
  className?: string
  /** denser text for cards / SKU rows */
  compact?: boolean
}

/**
 * Clickable “Login to view price” — opens the customer auth modal.
 */
export function GuestPricePlaceholder({ className, compact = false }: GuestPricePlaceholderProps) {
  const { t } = useTranslation()
  const { openAuthModal } = useCustomerAuthModal()

  return (
    <button
      type="button"
      className={cn(
        'text-left font-semibold text-[#f254a6] transition hover:text-[#e44798] hover:underline',
        compact ? 'text-xs leading-4' : 'text-base leading-5',
        className,
      )}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        openAuthModal('login')
      }}
    >
      {t('product.loginToViewPrice')}
    </button>
  )
}

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
