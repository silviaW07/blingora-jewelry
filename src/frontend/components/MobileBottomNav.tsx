'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, LayoutGrid, Sparkles, ShoppingCart, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { categoryHref } from '@/frontend/utils/hardNavigate'
import {
  findDailyNewArrivalCategory,
  type DailyNewArrivalCategoryHit,
} from '@/frontend/utils/dailyNewArrival'
import { loadCategoryListCached, peekCachedCategoryList } from '@/frontend/utils/categoryListCache'

function isDailyNewHrefActive(
  pathname: string,
  categoryIdParam: string | null,
  daily: DailyNewArrivalCategoryHit | null,
) {
  if (!daily) return false
  if (categoryIdParam && categoryIdParam === daily.category_id) return true
  const href = categoryHref(daily.category_slug, daily.category_id)
  const pathOnly = href.split('?')[0].replace(/\/+$/, '') || '/'
  const current = pathname.replace(/\/+$/, '') || '/'
  return current === pathOnly || current.startsWith(`${pathOnly}/`)
}

/**
 * Mobile-only fixed bottom tab bar.
 */
export function MobileBottomNav() {
  const pathname = usePathname() || '/'
  const searchParams = useSearchParams()
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
  const [dailyCat, setDailyCat] = useState<DailyNewArrivalCategoryHit | null>(
    () => findDailyNewArrivalCategory(peekCachedCategoryList() || []),
  )

  useEffect(() => {
    let cancelled = false
    loadCategoryListCached(lang).then((list) => {
      if (cancelled) return
      setDailyCat(findDailyNewArrivalCategory(list))
    })
    return () => {
      cancelled = true
    }
  }, [lang])

  const newHref = useMemo(
    () => (dailyCat ? categoryHref(dailyCat.category_slug, dailyCat.category_id) : '/'),
    [dailyCat],
  )
  const newActive = isDailyNewHrefActive(
    pathname,
    searchParams.get('categoryId'),
    dailyCat,
  )

  const tabs = [
    {
      href: '/',
      key: 'home' as const,
      icon: Home,
      active: normalized === '/' || normalized === '',
      label: t('nav.home', { defaultValue: 'Home' }),
    },
    {
      href: '/categories/',
      key: 'categories' as const,
      icon: LayoutGrid,
      active: normalized.startsWith('/categories'),
      label: t('nav.categories', { defaultValue: 'Categories' }),
    },
    {
      href: newHref,
      key: 'new' as const,
      icon: Sparkles,
      active: newActive,
      label: t('nav.new', { defaultValue: 'new' }),
    },
    {
      href: '/cart/',
      key: 'cart' as const,
      icon: ShoppingCart,
      active: normalized.startsWith('/cart'),
      label: t('common.cart', { defaultValue: 'Cart' }),
    },
    {
      href: '/account/profile/',
      key: 'account' as const,
      icon: User,
      active: normalized.startsWith('/account') || normalized.startsWith('/accountcenter'),
      label: t('nav.account', { defaultValue: 'Account' }),
    },
  ]

  return (
    <nav
      className="mobile-bottom-nav"
      data-no-hard-nav=""
      aria-label={t('nav.siteNav', { defaultValue: 'Site navigation' })}
    >
      <ul className="mobile-bottom-nav__list">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <li key={tab.key} className="min-w-0 flex-1">
              <a
                href={tab.href}
                data-no-hard-nav=""
                className={cn('mobile-bottom-nav__item', tab.active && 'is-active')}
                aria-current={tab.active ? 'page' : undefined}
              >
                <Icon className="pointer-events-none size-5 shrink-0" strokeWidth={tab.active ? 2.4 : 1.9} />
                <span className="truncate">{tab.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
