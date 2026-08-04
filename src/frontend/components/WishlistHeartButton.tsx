'use client'

import React from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocalWishlist } from '@/frontend/hooks/useLocalWishlist'
import { useUserSession } from '@/tools/FrontendSession'
import { useOptionalCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext'

type WishlistHeartButtonProps = {
  productId: string
  productName?: string
  className?: string
  iconClassName?: string
  /** 切换后回调；favorited=true 表示当前已收藏 */
  onToggle?: (favorited: boolean, productId: string) => void
  /** 点击前拦截；返回 false 则不切换 */
  beforeToggle?: () => boolean
  /** 未登录时是否弹出登录（默认 true） */
  requireAuth?: boolean
  size?: number
  strokeWidth?: number
  'aria-label'?: string
}

export const WishlistHeartButton = ({
  productId,
  productName,
  className,
  iconClassName,
  onToggle,
  beforeToggle,
  requireAuth = true,
  size = 18,
  strokeWidth = 1.6,
  'aria-label': ariaLabel,
}: WishlistHeartButtonProps) => {
  const { favorited, toggle } = useLocalWishlist(productId)
  const userSession = useUserSession()
  const authModal = useOptionalCustomerAuthModal()

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (requireAuth && !userSession.token?.trim()) {
      authModal?.openAuthModal('login')
      return
    }

    if (beforeToggle && beforeToggle() === false) {
      return
    }

    const next = toggle()
    onToggle?.(next, productId)
  }

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20',
        favorited
          ? 'text-[#e11d48] hover:bg-[#fff1f2]'
          : 'text-[#8b8477] hover:bg-[#f7f4ee] hover:text-[#111111]',
        className,
      )}
      aria-label={
        ariaLabel ||
        (favorited
          ? `取消收藏${productName ? `：${productName}` : ''}`
          : `加入心愿单${productName ? `：${productName}` : ''}`)
      }
      aria-pressed={favorited}
      onClick={handleClick}
    >
      <Heart
        className={cn(favorited ? 'fill-current' : 'fill-none', iconClassName)}
        style={{ width: size, height: size }}
        strokeWidth={strokeWidth}
      />
    </button>
  )
}

export default WishlistHeartButton
