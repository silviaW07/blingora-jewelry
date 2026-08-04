'use client'

import type { MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, Tag, ShoppingCart, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useUserSession } from '@/tools/FrontendSession'
import { useCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext'
import { AccountProfile } from '@/frontend/route-params'

const TABS = [
  { href: '/', key: 'home', icon: Home, match: (p: string) => p === '/' || p === '' },
  {
    href: '/categories/',
    key: 'categories',
    icon: LayoutGrid,
    match: (p: string) => p.startsWith('/categories'),
  },
  {
    href: '/brand/',
    key: 'brand',
    icon: Tag,
    match: (p: string) => p.startsWith('/brand'),
  },
  {
    href: '/cart/',
    key: 'cart',
    icon: ShoppingCart,
    match: (p: string) => p.startsWith('/cart'),
  },
  {
    href: AccountProfile.path,
    key: 'account',
    icon: User,
    match: (p: string) => p.startsWith('/account') || p.startsWith('/accountcenter'),
  },
] as const

/**
 * Mobile-only fixed bottom tab bar (hidden ≥768px).
 * Account tab: guests open the shared login/register modal; signed-in users go to profile.
 */
export function MobileBottomNav() {
  const pathname = usePathname() || '/'
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  const { t } = useTranslation()
  const session = useUserSession()
  const { openAuthModal } = useCustomerAuthModal()

  const isLoggedIn = Boolean(session.token?.trim())

  const labels: Record<(typeof TABS)[number]['key'], string> = {
    home: t('nav.home', { defaultValue: 'Home' }),
    categories: t('nav.categories', { defaultValue: 'Categories' }),
    brand: t('nav.brand', { defaultValue: 'Brand' }),
    cart: t('common.cart', { defaultValue: 'Cart' }),
    account: t('nav.account', { defaultValue: 'Account' }),
  }

  const handleAccountClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Wait until session hydration so we do not flash the modal for logged-in users
    if (!session._hasHydrated) {
      event.preventDefault()
      return
    }
    if (!isLoggedIn) {
      event.preventDefault()
      openAuthModal('login')
    }
  }

  return (
    <nav
      className="mobile-bottom-nav md:hidden"
      aria-label={t('nav.siteNav', { defaultValue: 'Site navigation' })}
    >
      <ul className="mobile-bottom-nav__list">
        {TABS.map((tab) => {
          const active = tab.match(normalized)
          const Icon = tab.icon
          const isAccountTab = tab.key === 'account'
          return (
            <li key={tab.key} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                className={cn('mobile-bottom-nav__item', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
                onClick={isAccountTab ? handleAccountClick : undefined}
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 1.9} />
                <span className="truncate">{labels[tab.key]}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
