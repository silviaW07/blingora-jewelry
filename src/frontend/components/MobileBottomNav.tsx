'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Home, LayoutGrid, Sparkles, ShoppingCart, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { categoryHref, useStorefrontLink } from '@/frontend/utils/hardNavigate'
import {
  findDailyNewArrivalCategory,
  type DailyNewArrivalCategoryHit,
} from '@/frontend/utils/dailyNewArrival'
import { loadCategoryListCached, peekCachedCategoryList } from '@/frontend/utils/categoryListCache'
import { useCartBadge } from '@/frontend/hooks/useCartBadge'

function BottomNavTab({
  href,
  active,
  label,
  icon: Icon,
  badgeCount = 0,
}: {
  href: string
  active: boolean
  label: string
  icon: typeof Home
  badgeCount?: number
}) {
  const go = useStorefrontLink(href)
  return (
    <a
      className={cn('mobile-bottom-nav__item', active && 'is-active')}
      aria-current={active ? 'page' : undefined}
      {...go}
    >
      <span className="relative">
        <Icon className="pointer-events-none size-5 shrink-0" strokeWidth={active ? 2.4 : 1.9} />
        {badgeCount > 0 ? (
          <span className="mobile-bottom-nav__badge">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </span>
      <span className="truncate">{label}</span>
    </a>
  )
}

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
 * Uses in-app navigation so Chinese browsers do not show a full-document “正在努力加载” wait.
 */
export function MobileBottomNav() {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const searchParams = useSearchParams()
  const normalized = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  const { t, i18n } = useTranslation()
  const cartBadgeCount = useCartBadge()
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

  useEffect(() => {
    const hrefs = ['/', '/categories/', '/cart/', '/account/profile/', newHref]
    hrefs.forEach((href) => {
      try {
        router.prefetch(href)
      } catch {
        /* ignore */
      }
    })
  }, [router, newHref])

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
      aria-label={t('nav.siteNav', { defaultValue: 'Site navigation' })}
    >
      <ul className="mobile-bottom-nav__list">
        {tabs.map((tab) => (
            <li key={tab.key} className="min-w-0 flex-1">
              <BottomNavTab
                href={tab.href}
                active={tab.active}
                label={tab.label}
                icon={tab.icon}
                badgeCount={tab.key === 'cart' ? cartBadgeCount : 0}
              />
            </li>
          ))}
      </ul>
    </nav>
  )
}
