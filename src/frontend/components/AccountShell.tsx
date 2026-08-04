'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, Package, Settings, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import { StorefrontBrandLogo } from '@/frontend/components/StorefrontBrandLogo'
import { useUserSession } from '@/tools/FrontendSession'
import {
  AccountAddresses,
  AccountOrders,
  AccountProfile,
} from '@/frontend/route-params'

const withSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`)

const NAV_ITEMS = [
  {
    href: withSlash(AccountOrders.path),
    path: AccountOrders.path,
    label: '我的订单',
    icon: Package,
  },
  {
    href: withSlash(AccountAddresses.path),
    path: AccountAddresses.path,
    label: '地址管理',
    icon: MapPin,
  },
  {
    href: withSlash(AccountProfile.path),
    path: AccountProfile.path,
    label: '个人资料',
    icon: UserCircle2,
  },
] as const

function isNavActive(pathname: string | null, itemPath: string) {
  if (!pathname) return false
  const norm = pathname.replace(/\/+$/, '') || '/'
  const target = itemPath.replace(/\/+$/, '') || '/'
  return norm === target || norm.startsWith(`${target}/`)
}

/**
 * Account area shell: compact mobile bar + unified card; desktop keeps site header + side nav.
 */
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
  const session = useUserSession()
  const avatarChar = (session.username || session.email || 'A').trim().slice(0, 1).toUpperCase() || 'A'

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/')
  }

  return (
    <div
      className="mobile-account-page min-h-screen bg-[#FFF5F5]"
      data-controller-name="客户个人中心"
    >
      <div className="hidden md:block">
        <StorefrontStickyHeader />
      </div>

      <header
        className="mobile-account-topbar sticky top-0 z-40 border-b border-[#f0dede] bg-[#FFF5F5]/95 backdrop-blur md:hidden"
        data-controller-name="移动端个人中心顶栏"
      >
        <div className="flex h-12 items-center gap-2 px-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#1f1a14] active:bg-black/5"
            aria-label="返回"
          >
            <ChevronLeft className="size-5" strokeWidth={2.2} />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            <StorefrontBrandLogo sizeClassName="size-7 rounded-lg" gemClassName="size-3.5" />
            <span className="truncate text-[0.9375rem] font-semibold tracking-tight text-[#1f1a14]">
              个人中心
            </span>
          </div>

          <button
            type="button"
            onClick={() => router.push(withSlash(AccountProfile.path))}
            className="relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e8e2d8] bg-[#f6f2ea] text-[0.7rem] font-bold text-[#1f1a14] active:bg-[#efe9df]"
            aria-label="个人资料设置"
            title="设置"
          >
            <span aria-hidden>{avatarChar}</span>
            <Settings
              className="absolute bottom-0 right-0 size-3.5 rounded-full bg-white p-px text-[#5f5a52] shadow-sm"
              strokeWidth={2.2}
              aria-hidden
            />
          </button>
        </div>
      </header>

      <div className="storefront-container px-3 py-3 md:px-4 md:py-8">
        <div className="mb-6 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8073]">Account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1a14]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6558]">{description}</p>
        </div>

        <div className="mb-2 md:hidden">
          <h1 className="text-base font-semibold tracking-tight text-[#1f1a14]">{title}</h1>
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#8a8073]">{description}</p>
          ) : null}
        </div>

        <div className="mobile-account-card flex flex-col items-stretch overflow-hidden rounded-[16px] border border-[#f0dede] bg-white shadow-[0_10px_28px_-24px_rgba(0,0,0,0.35)] md:rounded-[28px] lg:flex-row">
          <aside className="w-full shrink-0 border-b border-[#f0dede] bg-white p-1.5 md:p-2.5 lg:w-auto lg:min-w-[140px] lg:border-b-0 lg:border-r lg:border-[#f0dede]">
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:space-y-1 lg:overflow-visible">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(pathname, item.path)
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      router.push(item.href)
                    }}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[12px] px-3 py-2 text-[0.8125rem] font-medium transition md:rounded-[16px] md:px-3 md:py-2.5 md:text-sm',
                      active
                        ? 'bg-[#111111] text-white'
                        : 'text-[#2f2a24] hover:bg-[#f6f2ea]',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
          <section className="mobile-account-body min-w-0 flex-1 overflow-x-auto bg-white p-3 sm:p-5 md:p-6">
            {children}
          </section>
        </div>

        <div className="sr-only">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
