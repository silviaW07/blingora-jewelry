'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, Sparkles, ShoppingCart, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { customerLoginHref, hardNavProps } from '@/frontend/utils/hardNavigate'
import { useUserSession } from '@/tools/FrontendSession'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', key: 'home', icon: Home, match: (p: string) => p === '/' || p === '' },
  {
    href: '/categories/',
    key: 'categories',
    icon: LayoutGrid,
    match: (p: string) => p.startsWith('/categories'),
  },
  {
    href: '/coming/',
    key: 'coming',
    icon: Sparkles,
    match: (p: string) => p.startsWith('/coming') || p.startsWith('/brand'),
  },
  {
    href: '/cart/',
    key: 'cart',
    icon: ShoppingCart,
    match: (p: string) => p.startsWith('/cart'),
  },
  {
    href: '/account/profile/',
    key: 'account',
    icon: User,
    match: (p: string) => p.startsWith('/account') || p.startsWith('/accountcenter'),
  },
] as const

/**
 * Mobile-only fixed bottom tab bar (hidden ≥768px).
 */
export function MobileBottomNav() {
  const pathname = usePathname() || '/'
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  const { t } = useTranslation()
  const token = useUserSession((s) => s.token)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isGuest = mounted && !String(token || '').trim()

  const labels: Record<(typeof TABS)[number]['key'], string> = {
    home: t('nav.home', { defaultValue: 'Home' }),
    categories: t('nav.categories', { defaultValue: 'Categories' }),
    coming: t('nav.coming', { defaultValue: 'Coming' }),
    cart: t('common.cart', { defaultValue: 'Cart' }),
    account: t('nav.account', { defaultValue: 'Account' }),
  }

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label={t('nav.siteNav', { defaultValue: 'Site navigation' })}
    >
      <ul className="mobile-bottom-nav__list">
        {TABS.map((tab) => {
          const active = tab.match(normalized)
          const Icon = tab.icon
          const href =
            isGuest && (tab.key === 'cart' || tab.key === 'account')
              ? customerLoginHref(tab.href)
              : tab.href
          return (
            <li key={tab.key} className="min-w-0 flex-1">
              <a
                {...hardNavProps(href)}
                className={cn('mobile-bottom-nav__item', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 1.9} />
                <span className="truncate">{labels[tab.key]}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
