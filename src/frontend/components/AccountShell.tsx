'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Heart, MapPin, Package, Settings, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import { StorefrontBrandLogo } from '@/frontend/components/StorefrontBrandLogo'
import { hardNavigate, hardNavProps } from '@/frontend/utils/hardNavigate'
import { isNarrowViewport } from '@/frontend/utils/isNarrowViewport'
import { useUserSession } from '@/tools/FrontendSession'
import {
  AccountAddresses,
  AccountOrders,
  AccountProfile,
  Wishlist,
} from '@/frontend/route-params'

const withSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`)

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
  const { t } = useTranslation()
  const session = useUserSession()
  const avatarChar = (session.username || session.email || 'A').trim().slice(0, 1).toUpperCase() || 'A'

  const navItems = [
    {
      href: withSlash(AccountOrders.path),
      path: AccountOrders.path,
      label: t('nav.myOrders'),
      icon: Package,
    },
    {
      href: withSlash(Wishlist.path),
      path: Wishlist.path,
      label: t('nav.wishlist'),
      icon: Heart,
    },
    {
      href: withSlash(AccountAddresses.path),
      path: AccountAddresses.path,
      label: t('nav.addresses'),
      icon: MapPin,
    },
    {
      href: withSlash(AccountProfile.path),
      path: AccountProfile.path,
      label: t('nav.profile'),
      icon: UserCircle2,
    },
  ]

  const [showDesktopHeader, setShowDesktopHeader] = useState(false)

  useEffect(() => {
    const apply = () => setShowDesktopHeader(!isNarrowViewport())
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
      return
    }
    hardNavigate('/')
  }

  return (
    <div
      className="mobile-account-page min-h-screen bg-[#FFF5F5]"
      data-controller-name="客户个人中心"
    >
      {showDesktopHeader ? (
        <div className="hidden md:block" data-storefront-chrome="desktop">
          <StorefrontStickyHeader />
        </div>
      ) : null}

      <header
        className="mobile-account-topbar sticky top-0 z-40 border-b border-[#f0dede] bg-[#FFF5F5]/95 backdrop-blur md:hidden"
        data-storefront-chrome="mobile"
        data-controller-name="移动端个人中心顶栏"
      >
        <div className="flex h-11 items-center gap-1.5 px-2.5 sm:h-12 sm:px-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#1f1a14] active:bg-black/5"
            aria-label={t('accountShell.back')}
          >
            <ChevronLeft className="size-5" strokeWidth={2.2} />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            <StorefrontBrandLogo sizeClassName="size-7 rounded-lg" gemClassName="size-3.5" />
            <span className="truncate text-[0.9375rem] font-semibold tracking-tight text-[#1f1a14]">
              {t('nav.accountCenter')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => hardNavigate(withSlash(AccountProfile.path))}
            className="relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e8e2d8] bg-[#f6f2ea] text-[0.7rem] font-bold text-[#1f1a14] active:bg-[#efe9df]"
            aria-label={t('accountShell.profileSettings')}
            title={t('accountShell.settings')}
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

      <div className="account-shell-wrap px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-8">
        <div className="mb-6 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a8073]">
            {t('accountShell.sectionLabel')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1a14]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6558]">{description}</p>
        </div>

        <div className="mb-1.5 md:hidden">
          <h1 className="text-[0.9375rem] font-semibold tracking-tight text-[#1f1a14] sm:text-base">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-4 text-[#8a8073] sm:text-xs sm:leading-5">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mobile-account-card flex w-full max-w-none flex-col items-stretch overflow-visible rounded-[14px] border border-[#f0dede] bg-white shadow-[0_10px_28px_-24px_rgba(0,0,0,0.35)] md:rounded-[28px] lg:flex-row">
          <aside className="w-full shrink-0 border-b border-[#f0dede] bg-white p-1 md:p-2.5 lg:w-auto lg:min-w-[140px] lg:border-b-0 lg:border-r lg:border-[#f0dede]">
            <nav className="flex flex-row gap-0.5 overflow-x-auto sm:gap-1 lg:flex-col lg:space-y-1 lg:overflow-visible">
              {navItems.map((item) => {
                const active = isNavActive(pathname, item.path)
                const Icon = item.icon
                return (
                  <a
                    key={item.path}
                    {...hardNavProps(item.href)}
                    className={cn(
                      'inline-flex min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[0.75rem] font-medium transition sm:gap-2 sm:rounded-[12px] sm:px-3 sm:py-2 sm:text-[0.8125rem] md:rounded-[16px] md:px-3 md:py-2.5 md:text-sm',
                      active
                        ? 'bg-[#111111] text-white'
                        : 'text-[#2f2a24] hover:bg-[#f6f2ea]',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="size-3.5 shrink-0 sm:size-4" />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </nav>
          </aside>
          <section className="mobile-account-body min-w-0 flex-1 overflow-x-auto overflow-y-visible bg-white p-2.5 sm:p-4 md:p-6">
            {children}
          </section>
        </div>

        <div className="sr-only">
          {navItems.map((item) => (
            <Link key={item.path} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
