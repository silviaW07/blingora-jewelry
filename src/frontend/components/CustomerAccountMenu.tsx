'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChevronDown,
  Heart,
  LogOut,
  MapPin,
  Package,
  UserCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserSession } from '@/tools/FrontendSession'
import { useCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext'
import {
  AccountAddresses,
  AccountOrders,
  AccountProfile,
  Wishlist,
} from '@/frontend/route-params'
import { customerLoginHref, hardNavigate } from '@/frontend/utils/hardNavigate'
import { useTranslation } from 'react-i18next'

type Props = {
  className?: string
  /** 未登录时按钮文案 */
  guestLabel?: string
  /** 触发方式：点击或悬停打开 */
  trigger?: 'click' | 'hover'
  /** icon：仅用户图标，适合移动端顶栏 */
  variant?: 'default' | 'icon'
}

/** 从全名中取 First Name（按空格拆分取第一段） */
function getFirstName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return ''
  return trimmed.split(/\s+/)[0] || trimmed
}

/**
 * 前台右上角：登录后展示 Hi 用户名 + 个人中心下拉菜单
 */
export function CustomerAccountMenu({
  className,
  guestLabel,
  trigger = 'click',
  variant = 'default',
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useUserSession()
  const { openAuthModal } = useCustomerAuthModal()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolvedGuestLabel = guestLabel || t('common.login')
  const isLoggedIn = mounted && Boolean(session.token?.trim())
  const fullName = (session.username || '').trim() || t('nav.myAccount')
  const firstName = getFirstName(fullName) || fullName
  const label = isLoggedIn ? t('nav.hiUser', { name: firstName }) : resolvedGuestLabel
  const avatarText = firstName.slice(0, 1).toUpperCase() || 'U'
  const isIcon = variant === 'icon'

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), 160)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      clearCloseTimer()
    }
  }, [])

  const go = (path: string) => {
    setOpen(false)
    if (!isLoggedIn) {
      openAuthModal('login')
      return
    }
    hardNavigate(path.endsWith('/') ? path : `${path}/`)
  }

  /** 心愿单存在浏览器本地，未登录也可查看点过爱心的商品 */
  const goWishlist = () => {
    setOpen(false)
    hardNavigate(Wishlist.path.endsWith('/') ? Wishlist.path : `${Wishlist.path}/`)
  }

  const handleLogout = () => {
    session.reset()
    setOpen(false)
    toast.success(t('common.loggedOut'))
    router.refresh()
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        className={cn(
          isIcon
            ? 'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#d8d4ca] bg-white text-[#111111] shadow-sm transition active:bg-[#f7f4ee]'
            : 'inline-flex h-14 shrink-0 items-center gap-2 rounded-full border border-[#d8d4ca] bg-white px-4 text-sm font-semibold text-[#111111] shadow-sm transition hover:border-[#111111] hover:bg-[#f7f4ee]',
          className,
        )}
        onClick={() => {
          const returnTo =
            typeof window === 'undefined'
              ? '/'
              : `${window.location.pathname}${window.location.search}`
          hardNavigate(customerLoginHref(returnTo))
        }}
        aria-label={resolvedGuestLabel}
      >
        <UserCircle2 className={isIcon ? 'size-5' : 'size-4'} />
        {isIcon ? null : <span className="max-w-[140px] truncate">{resolvedGuestLabel}</span>}
      </button>
    )
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative shrink-0', className)}
      data-controller-name="客户个人中心入口"
      onMouseEnter={() => {
        if (trigger === 'hover') {
          clearCloseTimer()
          setOpen(true)
        }
      }}
      onMouseLeave={() => {
        if (trigger === 'hover') scheduleClose()
      }}
    >
      <button
        type="button"
        className={cn(
          isIcon
            ? 'inline-flex size-10 items-center justify-center rounded-full border border-[#d8d4ca] bg-white text-[#111111] shadow-sm transition active:bg-[#f7f4ee]'
            : 'inline-flex h-14 items-center gap-2 rounded-full border border-[#d8d4ca] bg-white px-3 text-sm font-semibold text-[#111111] shadow-sm transition hover:border-[#111111] hover:bg-[#f7f4ee] sm:px-4',
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
      >
        {isIcon ? (
          <span className="flex size-7 items-center justify-center rounded-full bg-[#111111] text-[11px] font-bold text-white">
            {avatarText}
          </span>
        ) : (
          <>
            <span className="flex size-8 items-center justify-center rounded-full bg-[#111111] text-xs font-bold text-white">
              {avatarText}
            </span>
            <span className="max-w-[140px] truncate">{label}</span>
            <ChevronDown className={cn('size-4 transition-transform', open ? 'rotate-180' : '')} />
          </>
        )}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+10px)] z-40 w-[240px] rounded-[22px] border border-[#e7e1d5] bg-[#fbfaf7] p-2 shadow-[0_24px_48px_-24px_rgba(17,17,17,0.35)]"
          role="menu"
          onMouseEnter={clearCloseTimer}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left text-sm font-medium text-[#232323] transition hover:bg-white"
            onClick={() => go(AccountOrders.path)}
          >
            <Package className="size-4 text-[#6f6558]" />
            {t('nav.myOrders')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left text-sm font-medium text-[#232323] transition hover:bg-white"
            onClick={goWishlist}
          >
            <Heart className="size-4 text-[#6f6558]" />
            {t('nav.wishlist')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left text-sm font-medium text-[#232323] transition hover:bg-white"
            onClick={() => go(AccountAddresses.path)}
          >
            <MapPin className="size-4 text-[#6f6558]" />
            {t('nav.addresses')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left text-sm font-medium text-[#232323] transition hover:bg-white"
            onClick={() => go(AccountProfile.path)}
          >
            <UserCircle2 className="size-4 text-[#6f6558]" />
            {t('nav.profile')}
          </button>
          <div className="my-1 h-px bg-[#ebe6dc]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left text-sm font-medium text-[#c43d3d] transition hover:bg-[#fff1f1]"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            {t('common.logout')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default CustomerAccountMenu
