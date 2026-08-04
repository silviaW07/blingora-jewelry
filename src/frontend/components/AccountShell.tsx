'use client'

import React, { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MapPin, Package, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import { AccountMobileTopBar } from '@/frontend/components/AccountMobileTopBar'
import {
  AccountAddresses,
  AccountOrders,
  AccountProfile,
} from '@/frontend/route-params'

const NAV_ITEMS = [
  { href: AccountOrders.path, label: '我的订单', icon: Package },
  { href: AccountAddresses.path, label: '地址管理', icon: MapPin },
  { href: AccountProfile.path, label: '个人资料', icon: UserCircle2 },
] as const

function normalizePath(path: string) {
  const trimmed = (path || '/').toLowerCase().replace(/\/+$/, '')
  return trimmed || '/'
}

export function AccountShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const current = normalizePath(pathname || '/')

  const handleNavClick = useCallback(
    (href: string) => {
      const target = normalizePath(href)
      if (current === target) return
      router.push(href)
    },
    [current, router],
  )

  return (
    <div className="min-h-screen bg-[#FFF5F5]" data-controller-name="客户个人中心">
      {/* Desktop: full storefront sticky header */}
      <div className="hidden md:block">
        <StorefrontStickyHeader />
      </div>
      {/* Mobile: compact account top bar only */}
      <AccountMobileTopBar />

      <div className="storefront-container py-2 md:py-8">
        <div className="mb-6 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8073]">Account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1a14]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6558]">{description}</p>
        </div>

        {/* One integrated card: nav + content */}
        <div className="flex flex-col items-stretch overflow-hidden rounded-[20px] border border-[#f0dede] bg-white shadow-[0_12px_28px_-28px_rgba(0,0,0,0.28)] md:rounded-[28px] md:shadow-[0_18px_40px_-36px_rgba(0,0,0,0.35)] lg:flex-row">
          <aside className="relative z-10 w-full shrink-0 border-b border-[#f0dede] bg-white p-1.5 md:p-2.5 lg:w-auto lg:min-w-[140px] lg:border-b-0 lg:border-r lg:border-[#f0dede]">
            <nav className="flex gap-1 overflow-x-auto md:block md:space-y-1 md:overflow-visible" aria-label="个人中心导航">
              {NAV_ITEMS.map((item) => {
                const target = normalizePath(item.href)
                const active = current === target || current.startsWith(`${target}/`)
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[14px] px-3 py-2 text-sm font-medium transition md:w-full md:rounded-[16px] md:px-3 md:py-2.5',
                      active
                        ? 'bg-[#111111] text-white'
                        : 'text-[#2f2a24] hover:bg-[#f6f2ea]',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
          <section className="min-w-0 flex-1 overflow-x-auto bg-white p-3 sm:p-5 md:p-6">
            {children}
          </section>
        </div>
      </div>
    </div>
  )
}
