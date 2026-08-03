'use client'

/**
 * 前台顶部导航：Logo / 搜索 / CATEGORIES / 分类标签
 * 可在首页以外页面复用；分类操作统一跳回首页 `/`
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Camera,
  ChevronDown,
  ChevronRight,
  Globe,
  Loader2,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { StorefrontBrandMark } from '@/frontend/components/StorefrontBrandMark'
import { CustomerAccountMenu } from '@/frontend/components/CustomerAccountMenu'
import { StorefrontFloatingSideNav } from '@/frontend/components/StorefrontFloatingSideNav'
import { useUserSession } from '@/tools/FrontendSession'
import { ProductCategory, Cart } from '@/frontend/route-params'
import {
  getCategorySideNavZones,
  type CategoryItem,
  type SideNavZoneItem,
} from '@/frontend/actions/ProductCategory'
import { loadCategoryListCached, peekCachedCategoryList } from '@/frontend/utils/categoryListCache'
import { pickBrandSideNavZone } from '@/frontend/utils/brandSideNav'
import {
  getDailyNewArrivalCalendar,
  type DailyNewArrivalMonthCard,
} from '@/frontend/actions/Home'
import { buildLast6Months, formatMonthLabel, isDailyNewArrivalCategoryName } from '@/frontend/utils/dailyNewArrival'
import { useTranslation } from 'react-i18next'
import { APP_LOCALES, getLocaleLabel, normalizeLocale } from '@/frontend/i18n'
import { useSwitchAppLocale } from '@/frontend/i18n/I18nProvider'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'

/** Pure storefront home only — listing queries / other paths enable CATEGORIES flyout. */
export function isStorefrontHomePath(pathname: string | null, searchParams?: URLSearchParams | null) {
  const path = pathname || '/'
  if (path !== '/' && path !== '/home') return false
  if (!searchParams) return true
  const listingKeys = [
    'categoryId',
    'search',
    'stockStatus',
    'keywordId',
    'keywordGroupId',
    'brandCategoryId',
    'minPrice',
    'maxPrice',
    'hasDiscount',
    'minRating',
    'dailyMonth',
    'sortBy',
    'page',
  ] as const
  return !listingKeys.some((key) => {
    const value = searchParams.get(key)
    return Boolean(value && value.trim())
  })
}

type StorefrontStickyHeaderProps = {
  /** Override home detection. Default: pathname is `/` (or `/home`) with no listing query. */
  isHome?: boolean
}

export const StorefrontStickyHeader = ({ isHome }: StorefrontStickyHeaderProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t, i18n } = useTranslation()
  const switchLocale = useSwitchAppLocale()
  const { preferredLocale } = useUserSession()

  const [categories, setCategories] = useState<CategoryItem[]>(() => peekCachedCategoryList() || [])
  const [dailyNewArrivalMonths, setDailyNewArrivalMonths] = useState<DailyNewArrivalMonthCard[]>([])
  const [isLoadingDailyNewArrivalCalendar, setIsLoadingDailyNewArrivalCalendar] = useState(false)
  const [hoveredTopCategoryId, setHoveredTopCategoryId] = useState<string | null>(null)
  const [expandedTopNavCategoryIds, setExpandedTopNavCategoryIds] = useState<string[]>([])
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [cartBadgeCount] = useState(0)
  const [isFloatingSideNavOpen, setIsFloatingSideNavOpen] = useState(false)
  const [floatingBrandItems, setFloatingBrandItems] = useState<SideNavZoneItem[]>([])

  const [localeTick, setLocaleTick] = useState(0)

  const localeMenuRef = useRef<HTMLDivElement | null>(null)
  const topNavPanelRef = useRef<HTMLDivElement | null>(null)
  const floatingSideNavRef = useRef<HTMLDivElement | null>(null)
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const floatingSideNavCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentLocale = normalizeLocale(i18n.language || preferredLocale || 'en')
  const isHomePage = isHome ?? isStorefrontHomePath(pathname, searchParams)
  const currentLocaleLabel = getLocaleLabel(currentLocale)
  const hasFloatingBrandItems = floatingBrandItems.length > 0

  const floatingSideNavItems = useMemo(
    () =>
      floatingBrandItems.map((category) => ({
        id: category.category_id,
        key: category.item_id,
        label: category.category_name,
        slug: category.category_slug,
      })),
    [floatingBrandItems],
  )

  const fallbackMonths = useMemo(
    () =>
      buildLast6Months().map((item) => ({
        year: item.year,
        month: item.month,
        monthKey: item.monthKey,
        label: formatMonthLabel(item.year, item.month),
        productCount: 0,
      })),
    [],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const bump = () => setLocaleTick((n) => n + 1)
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'app_preferred_locale') bump()
    }
    window.addEventListener('app-locale-changed', bump as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('app-locale-changed', bump as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    const lang =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('app_preferred_locale') ||
          document.documentElement.getAttribute('lang') ||
          currentLocale ||
          'en'
        : currentLocale || 'en'
    loadCategoryListCached(lang)
      .then((list) => setCategories(list))
      .catch(() => {
        // keep cached / previous categories — never wipe nav to []
      })

    getCategorySideNavZones({ lang })
      .then((res) => {
        const zones = Array.isArray(res.zones) ? res.zones : []
        // Same Brand → Hot → first zone rule as home left rail
        const brandZone = pickBrandSideNavZone(zones)
        setFloatingBrandItems(Array.isArray(brandZone?.items) ? brandZone.items : [])
      })
      .catch(() => {
        // keep previous brand items
      })
  }, [currentLocale, localeTick])

  useEffect(() => {
    let cancelled = false
    setIsLoadingDailyNewArrivalCalendar(true)
    getDailyNewArrivalCalendar()
      .then((res) => {
        if (cancelled) return
        const months = Array.isArray(res.months) && res.months.length > 0 ? res.months : fallbackMonths
        setDailyNewArrivalMonths(months)
      })
      .catch(() => {
        if (!cancelled) setDailyNewArrivalMonths(fallbackMonths)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDailyNewArrivalCalendar(false)
      })
    return () => {
      cancelled = true
    }
  }, [fallbackMonths])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (localeMenuRef.current && !localeMenuRef.current.contains(target)) {
        setIsLocaleMenuOpen(false)
      }
      if (floatingSideNavRef.current && !floatingSideNavRef.current.contains(target)) {
        setIsFloatingSideNavOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsFloatingSideNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isHomePage || hasFloatingBrandItems) return
    setIsFloatingSideNavOpen(false)
  }, [hasFloatingBrandItems, isHomePage])

  const clearHoverCloseTimer = useCallback(() => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current)
      hoverCloseTimerRef.current = null
    }
  }, [])

  const clearFloatingSideNavCloseTimer = useCallback(() => {
    if (floatingSideNavCloseTimerRef.current) {
      clearTimeout(floatingSideNavCloseTimerRef.current)
      floatingSideNavCloseTimerRef.current = null
    }
  }, [])

  const handleTopCategoryHoverChange = useCallback(
    (categoryId: string | null) => {
      clearHoverCloseTimer()
      if (categoryId) {
        setHoveredTopCategoryId(categoryId)
        return
      }
      hoverCloseTimerRef.current = setTimeout(() => {
        setHoveredTopCategoryId(null)
      }, 120)
    },
    [clearHoverCloseTimer],
  )

  const handleFloatingSideNavHoverChange = useCallback(
    (nextOpen: boolean) => {
      clearFloatingSideNavCloseTimer()
      if (nextOpen) {
        setIsFloatingSideNavOpen(true)
        return
      }
      floatingSideNavCloseTimerRef.current = setTimeout(() => {
        setIsFloatingSideNavOpen(false)
      }, 140)
    },
    [clearFloatingSideNavCloseTimer],
  )

  const goHome = useCallback(() => {
    // Client-side nav — avoid full reload (was the main “back is slow” cause)
    router.push('/')
  }, [router])

  const goHomeWithCategory = useCallback(
    (categoryId: string, categorySlug?: string | null) => {
      if (!categoryId) {
        goHome()
        return
      }
      const id = String(categoryId || '').trim()
      const slugFromArg = String(categorySlug || '').trim()
      const slug =
        slugFromArg ||
        categories.find((c) => c.category_id === id)?.category_slug ||
        categories.flatMap((c) => c.children || []).find((c) => c.category_id === id)?.category_slug ||
        categories.flatMap((c) => c.brand_options || []).find((c) => c.category_id === id)?.category_slug ||
        null
      ProductCategory.navigateToCategory(router, { categoryId: id, categorySlug: slug })
    },
    [categories, goHome, router],
  )

  const goHomeWithDailyMonth = useCallback(
    (monthKey: string, dailyCategoryId?: string, dailyCategorySlug?: string | null) => {
      const params = new URLSearchParams()
      params.set('dailyMonth', monthKey)
      const id = String(dailyCategoryId || '').trim()
      const slugFromArg = String(dailyCategorySlug || '').trim()
      const slug =
        slugFromArg ||
        (id
          ? categories.find((c) => c.category_id === id)?.category_slug ||
            categories.flatMap((c) => c.children || []).find((c) => c.category_id === id)?.category_slug ||
            null
          : null)
      if (slug) {
        router.push(`/category/${encodeURIComponent(String(slug).trim())}?${params.toString()}`)
        return
      }
      if (id) params.set('categoryId', id)
      router.push(`/productcategory/?${params.toString()}`)
    },
    [categories, router],
  )

  const handleHeaderSearchSubmit = useCallback(() => {
    if (isSearchLoading) return
    setIsSearchLoading(true)
    const keyword = searchKeyword.trim()
    const params = new URLSearchParams()
    if (keyword) {
      params.set('search', keyword)
    }
    router.push(params.toString() ? `${ProductCategory.path}?${params.toString()}` : ProductCategory.path)
  }, [isSearchLoading, router, searchKeyword])

  useEffect(() => {
    setIsSearchLoading(false)
  }, [pathname])

  useEffect(() => {
    if (!isSearchLoading) return
    const timer = window.setTimeout(() => setIsSearchLoading(false), 8000)
    return () => window.clearTimeout(timer)
  }, [isSearchLoading])

  const handleLocaleSwitch = (code: string) => {
    void switchLocale(code)
    setIsLocaleMenuOpen(false)
  }

  const monthCards = dailyNewArrivalMonths.length > 0 ? dailyNewArrivalMonths : fallbackMonths

  return (
    <section
      className="border-b border-[#f0dede] bg-white"
      data-controller-name="顶部品牌导航与搜索区"
    >
      <div className="storefront-container relative flex flex-col gap-2.5 py-2.5 sm:py-3">
        <div
          className="flex flex-col gap-2.5 overflow-visible bg-transparent px-0 py-0"
          data-controller-name="品牌展示与快捷入口"
        >
          <div className="flex flex-col gap-2.5 overflow-visible">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="storefront-categories-col flex flex-wrap items-center gap-3">
                <StorefrontBrandMark ariaLabel={t('common.backToHome')} />
              </div>

              <div
                className="flex min-w-0 flex-1 items-center gap-5 sm:gap-6 xl:max-w-[980px]"
                data-controller-name="搜索栏与用户功能区"
              >
                <div className="flex min-w-0 flex-1 justify-center">
                  <div className="flex w-full max-w-[220px] items-center overflow-hidden rounded-full border border-[#1e1e1e] bg-white shadow-[0_10px_28px_-24px_rgba(0,0,0,0.55)] sm:max-w-[240px]">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 text-[#6b6b6b] sm:px-4">
                      <Camera className="size-4 shrink-0" />
                      <Input
                        placeholder={t('common.pleaseInput')}
                        className="h-10 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 sm:h-11"
                        value={searchKeyword}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            handleHeaderSearchSubmit()
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleHeaderSearchSubmit}
                      disabled={isSearchLoading}
                      aria-busy={isSearchLoading}
                      className="h-10 min-w-[78px] rounded-none rounded-r-full bg-[#ffc0cb] px-4 text-sm font-semibold tracking-[0.08em] text-[#111111] hover:bg-[#ffb1c1] disabled:pointer-events-none disabled:opacity-80 sm:h-11 sm:px-5"
                    >
                      {isSearchLoading ? (
                        <Loader2 className="mr-2 size-5 animate-spin" />
                      ) : (
                        <Search className="mr-2 size-5" />
                      )}
                      <DecorateText propKey="home_search_btn" as="span">
                        {t('common.search')}
                      </DecorateText>
                    </Button>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                <div className="relative shrink-0" ref={localeMenuRef}>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d8d4ca] bg-white px-3 text-sm font-semibold text-[#111111] shadow-sm transition hover:border-[#111111] hover:bg-[#f7f4ee] sm:h-11 sm:px-3.5"
                    onClick={() => setIsLocaleMenuOpen((prev) => !prev)}
                    aria-expanded={isLocaleMenuOpen}
                  >
                    <Globe className="size-4" />
                    <span className="max-w-[88px] truncate">{currentLocaleLabel}</span>
                    <ChevronDown
                      className={cn('size-4 transition-transform', isLocaleMenuOpen ? 'rotate-180' : '')}
                    />
                  </button>
                  {isLocaleMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-[200px] rounded-[22px] border border-[#e7e1d5] bg-white p-2 shadow-[0_24px_48px_-24px_rgba(17,17,17,0.35)]">
                      <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8073]">
                        {t('common.language')}
                      </div>
                      {APP_LOCALES.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          className={cn(
                            'flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left text-sm font-medium transition',
                            currentLocale === option.code
                              ? 'bg-[#111111] text-white'
                              : 'text-[#232323] hover:bg-[#f6f2ea]',
                          )}
                          onClick={() => handleLocaleSwitch(option.code)}
                        >
                          <span>{option.label}</span>
                          {currentLocale === option.code ? <ShieldCheck className="size-4" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <CustomerAccountMenu trigger="hover" />

                <Button
                  type="button"
                  variant="outline"
                  className="relative h-10 shrink-0 rounded-full border-[#d8d4ca] bg-white px-3 text-sm font-semibold lowercase tracking-[0.04em] text-[#111111] shadow-sm hover:border-[#111111] hover:bg-[#f7f4ee] sm:h-11 sm:px-3.5"
                  onClick={() => Cart.navigateTo(router)}
                >
                  <span className="relative mr-2 inline-flex">
                    <ShoppingCart className="size-4" />
                    {cartBadgeCount > 0 ? (
                      <span className="absolute -right-2 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-[#d93535] px-1 text-[10px] font-semibold leading-4 text-white">
                        {cartBadgeCount}
                      </span>
                    ) : null}
                  </span>
                  <DecorateText propKey="home_cart_btn" as="span">
                    {t('common.cart')}
                  </DecorateText>
                </Button>
                </div>
              </div>
            </div>

            <div
              className="relative z-20 mt-2 flex flex-col gap-2 overflow-visible xl:flex-row xl:items-start"
              data-controller-name="顶部目录导航"
            >
              <div
                className="storefront-categories-col relative"
                ref={floatingSideNavRef}
                onMouseEnter={() => {
                  if (!isHomePage && hasFloatingBrandItems) handleFloatingSideNavHoverChange(true)
                }}
                onMouseLeave={() => {
                  if (!isHomePage && hasFloatingBrandItems) handleFloatingSideNavHoverChange(false)
                }}
              >
                {/* Flyout anchors under the pink button only (not below back-link) */}
                <div className="relative w-full">
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center gap-2 bg-[#f254a6] px-4 text-sm font-bold uppercase tracking-[0.08em] text-white"
                    data-controller-name="分类导航CATEGORIES标识"
                    aria-expanded={!isHomePage && isFloatingSideNavOpen}
                    aria-controls="storefront-floating-brand-nav"
                    onClick={() => {
                      if (isHomePage || !hasFloatingBrandItems) return
                      clearFloatingSideNavCloseTimer()
                      setIsFloatingSideNavOpen((prev) => !prev)
                    }}
                  >
                    <Menu className="size-4" />
                    <span>{t('common.categories')}</span>
                  </button>

                  {!isHomePage && hasFloatingBrandItems ? (
                    <StorefrontFloatingSideNav
                      open={isFloatingSideNavOpen}
                      items={floatingSideNavItems}
                      activeId={null}
                      onSelect={(categoryId, categorySlug) => {
                        setIsFloatingSideNavOpen(false)
                        goHomeWithCategory(categoryId, categorySlug)
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <div
                className="storefront-category-nav relative z-20 min-h-12 min-w-0 flex-1 overflow-visible"
                ref={topNavPanelRef}
                data-controller-name="一级分类标签导航"
              >
                {categories.map((category) => {
                  const isDailyNewArrival = isDailyNewArrivalCategoryName(category.category_name)
                  const activeChildren = category.children
                  const hasChildren = activeChildren.length > 0
                  const hasHoverPanel = hasChildren || isDailyNewArrival
                  const isDesktopPanelVisible =
                    hoveredTopCategoryId === category.category_id && hasHoverPanel
                  const isMobileExpanded = expandedTopNavCategoryIds.includes(category.category_id)

                  return (
                    <div
                      key={category.category_id}
                      className="relative flex min-w-0 items-center justify-center"
                      onMouseEnter={() => {
                        if (hasHoverPanel) handleTopCategoryHoverChange(category.category_id)
                      }}
                      onMouseLeave={() => handleTopCategoryHoverChange(null)}
                    >
                      <div className="flex h-full w-full flex-col gap-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className="relative flex min-w-0 flex-1 items-center justify-center bg-transparent px-2 py-2 text-center text-sm font-bold text-[#333333] transition-colors duration-200 hover:text-[#f254a6] lg:text-base lg:whitespace-nowrap"
                            onClick={(event) => {
                              event.preventDefault()
                              // New / 每日上新：进入上新列表页（按 6 个月时间窗，不按分类 ID）
                              goHomeWithCategory(category.category_id, category.category_slug)
                            }}
                            aria-expanded={hasHoverPanel ? isDesktopPanelVisible : undefined}
                            aria-haspopup={hasHoverPanel ? 'menu' : undefined}
                          >
                            <span>{translateCatalogLabel(t, category.category_name)}</span>
                          </button>
                          {hasHoverPanel ? (
                            <button
                              type="button"
                              className="flex size-8 shrink-0 items-center justify-center bg-transparent text-[#6b7280] transition hover:text-[#111111] lg:hidden"
                              onClick={(event) => {
                                event.stopPropagation()
                                event.preventDefault()
                                setExpandedTopNavCategoryIds((prev) =>
                                  prev.includes(category.category_id)
                                    ? prev.filter((id) => id !== category.category_id)
                                    : [...prev, category.category_id],
                                )
                              }}
                              aria-label={isMobileExpanded ? '收起下拉菜单' : '展开下拉菜单'}
                            >
                              <ChevronDown
                                className={`size-4 transition-transform ${isMobileExpanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                          ) : null}
                        </div>

                        {hasChildren && isMobileExpanded ? (
                          <div className="grid grid-cols-1 gap-2 rounded-[24px] border border-[#e5dfd2] bg-white p-3 shadow-[0_18px_35px_-28px_rgba(17,17,17,0.28)] lg:hidden">
                            {activeChildren.map((child) => (
                              <button
                                key={child.category_id}
                                type="button"
                                className="flex w-full items-center justify-between rounded-[16px] px-3 py-2.5 text-left text-sm text-[#2b2b2b] transition-colors hover:bg-[#f5f1e8]"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  event.preventDefault()
                                  goHomeWithCategory(child.category_id, child.category_slug)
                                }}
                              >
                                <span>{translateCatalogLabel(t, child.category_name)}</span>
                                <ChevronRight className="size-4 opacity-60" />
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {isDailyNewArrival && isMobileExpanded ? (
                          <div className="grid grid-cols-1 gap-2 rounded-[24px] border border-[#e5dfd2] bg-white p-3 shadow-[0_18px_35px_-28px_rgba(17,17,17,0.28)] lg:hidden">
                            {isLoadingDailyNewArrivalCalendar ? (
                              <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#7a756c]">
                                <Loader2 className="size-4 animate-spin" />
                                月历加载中...
                              </div>
                            ) : (
                              monthCards.map((month) => (
                                <button
                                  key={month.monthKey}
                                  type="button"
                                  className="flex w-full items-center justify-between rounded-[16px] px-3 py-2.5 text-left text-sm text-[#2b2b2b] transition-colors hover:bg-[#f5f1e8]"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    event.preventDefault()
                                    goHomeWithDailyMonth(month.monthKey, category.category_id, category.category_slug)
                                  }}
                                >
                                  <span>{month.label}</span>
                                  <ChevronRight className="size-4 opacity-60" />
                                </button>
                              ))
                            )}
                          </div>
                        ) : null}
                      </div>

                      {isDesktopPanelVisible && hasChildren && !isDailyNewArrival ? (
                        <div
                          className="absolute left-1/2 top-full z-50 hidden w-max min-w-[240px] max-w-[520px] -translate-x-1/2 pt-2 lg:block"
                          role="menu"
                          onMouseEnter={() => handleTopCategoryHoverChange(category.category_id)}
                          onMouseLeave={() => handleTopCategoryHoverChange(null)}
                        >
                          <div className="rounded-[16px] border border-[#ebe7de] bg-white p-3 shadow-[0_16px_40px_-12px_rgba(17,17,17,0.28)]">
                            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                              {activeChildren.map((child) => (
                                <button
                                  key={child.category_id}
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-[#2b2b2b] transition-colors hover:bg-[#f5f1e8]"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    goHomeWithCategory(child.category_id, child.category_slug)
                                  }}
                                >
                                  <span>{translateCatalogLabel(t, child.category_name)}</span>
                                  <ChevronRight className="size-4 opacity-60" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {isDesktopPanelVisible && isDailyNewArrival ? (
                        <div
                          className="absolute left-1/2 top-full z-50 hidden w-max min-w-[240px] max-w-[520px] -translate-x-1/2 pt-2 lg:block"
                          role="menu"
                          onMouseEnter={() => handleTopCategoryHoverChange(category.category_id)}
                          onMouseLeave={() => handleTopCategoryHoverChange(null)}
                        >
                          <div className="rounded-[16px] border border-[#ebe7de] bg-white p-3 shadow-[0_16px_40px_-12px_rgba(17,17,17,0.28)]">
                            {isLoadingDailyNewArrivalCalendar ? (
                              <div className="flex min-h-[88px] items-center justify-center gap-2 text-sm text-[#7a756c]">
                                <Loader2 className="size-4 animate-spin" />
                                月历加载中...
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                                {monthCards.map((month) => (
                                  <button
                                    key={month.monthKey}
                                    type="button"
                                    role="menuitem"
                                    className="flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-[#2b2b2b] transition-colors hover:bg-[#f5f1e8]"
                                    onClick={(event) => {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      goHomeWithDailyMonth(month.monthKey, category.category_id, category.category_slug)
                                    }}
                                  >
                                    <span>{month.label}</span>
                                    <ChevronRight className="size-4 opacity-60" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default StorefrontStickyHeader
