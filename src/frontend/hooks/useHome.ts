'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ProductCategory, ProductDetail, RecommendZone } from '@/frontend/route-params';
import { openStorefrontLogin } from '@/frontend/utils/hardNavigate';
import { useCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext';
import { useUserSession } from '@/tools/FrontendSession';
import {
  addCartItem,
  getDailyNewArrivalCalendar,
  getDailyNewArrivalProducts,
  type DailyNewArrivalMonthCard,
  type HomeRecommendZoneSection,
} from '@/frontend/actions/Home'
import type { ProductItem } from '@/frontend/actions/ProductCategory'
import { buildLast6Months, formatMonthLabel } from '@/frontend/utils/dailyNewArrival'
import {
  loadHomeRecommendZonesCached,
  peekCachedHomeRecommendZones,
  seedHomeRecommendZonesCache,
} from '@/frontend/utils/homeRecommendZonesCache';
import type { StorefrontBootstrap } from '@/frontend/types/storefrontBootstrap';

export type {
  ProductCategoryBannerItem as HomeBannerItem,
  ProductCategoryKeywordGroup as HomeKeywordGroup,
  ProductCategoryKeywordItem as HomeKeywordItem,
  ProductCategoryPromotionBanner as HomePromotionBanner,
  ProductCategoryRecommendationFloor as HomeRecommendationFloor,
} from '@/frontend/hooks/useProductCategory';

import { useProductCategory } from '@/frontend/hooks/useProductCategory';
import { getClientPreferredLang } from '@/frontend/i18n';

export interface HomeLinkedCategoryProduct {
  productId: string
  productName: string
  productCode: string
  mainImageUrl: string
  ratingAverage: number
  ratingCount: number
  defaultSkuId: string
  price: number
  originalPrice: number | null
  brandName: string | null
  shortDescription: string | null
}

export interface HomeState extends BaseHomeState {
  recommendZones: HomeRecommendZoneSection[]
  isLoadingRecommendZones: boolean
  selectedRecommendCategoryId: string | null
  linkedCategoryProducts: HomeLinkedCategoryProduct[]
  isLoadingLinkedCategoryProducts: boolean
  dailyNewArrivalMonths: DailyNewArrivalMonthCard[]
  selectedDailyNewArrivalMonthKey: string | null
  dailyNewArrivalProducts: ProductItem[]
  dailyNewArrivalTotalActiveProducts: number
  isLoadingDailyNewArrivalCalendar: boolean
  isLoadingDailyNewArrivalProducts: boolean
}

export interface HomeHandlers extends BaseHomeHandlers {
  handleNavigateRecommendProduct: (productId: string) => void
  handleNavigateRecommendCategory: (categoryId: string, categorySlug?: string | null) => void
  handleNavigateRecommendZone: (zoneId: string) => void
  handleAddRecommendProductToCart: (item: HomeRecommendProductCard) => Promise<void>
  /** 当首页需要“可选项逐个显示/可切换”时，用于直接加购指定 SKU */
  handleAddRecommendProductSkuToCart: (item: HomeRecommendProductCard, productSkuId: string) => Promise<void>
  handleAddRecommendProductToWishlist: (item: HomeRecommendProductCard, favorited?: boolean) => void
  handleAddLinkedCategoryProductToCart: (item: HomeLinkedCategoryProduct) => Promise<void>
  handleSelectDailyNewArrivalMonth: (monthKey: string) => void
}

type BaseHomeState = import('@/frontend/hooks/useProductCategory').ProductCategoryState
type BaseHomeHandlers = import('@/frontend/hooks/useProductCategory').ProductCategoryHandlers
type HomeRecommendProductCard = Extract<HomeRecommendZoneSection['items'][number], { entityType: 'PRODUCT' }>

const isHotSideNavZone = (zone: { title: string; zoneType?: string }) =>
  zone.title.trim().toLowerCase() === 'hot'

export const useHome = (bootstrap?: StorefrontBootstrap | null): { state: HomeState; handlers: HomeHandlers } => {
  const { state, handlers } = useProductCategory(bootstrap)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userSession = useUserSession()
  const { openAuthModal } = useCustomerAuthModal()
  const [recommendZones, setRecommendZones] = useState<HomeRecommendZoneSection[]>(() => {
    if (bootstrap?.recommendZones?.length) {
      seedHomeRecommendZonesCache(bootstrap.recommendZones, getClientPreferredLang())
      return bootstrap.recommendZones
    }
    if (typeof window === 'undefined') return []
    return peekCachedHomeRecommendZones(getClientPreferredLang()) || []
  })
  const [isLoadingRecommendZones, setIsLoadingRecommendZones] = useState(() => {
    if (bootstrap?.recommendZones?.length) return false
    if (typeof window === 'undefined') return true
    return !(peekCachedHomeRecommendZones(getClientPreferredLang())?.length)
  })
  const [linkedCategoryProducts] = useState<HomeLinkedCategoryProduct[]>([])
  const [isLoadingLinkedCategoryProducts] = useState(false)
  const [dailyNewArrivalMonths, setDailyNewArrivalMonths] = useState<DailyNewArrivalMonthCard[]>([])
  const [selectedDailyNewArrivalMonthKey, setSelectedDailyNewArrivalMonthKey] = useState<string | null>(
    () => searchParams.get('dailyMonth') || null,
  )
  const [dailyNewArrivalProducts, setDailyNewArrivalProducts] = useState<ProductItem[]>([])
  const [dailyNewArrivalTotalActiveProducts, setDailyNewArrivalTotalActiveProducts] = useState(0)
  const [isLoadingDailyNewArrivalCalendar, setIsLoadingDailyNewArrivalCalendar] = useState(false)
  const [isLoadingDailyNewArrivalProducts, setIsLoadingDailyNewArrivalProducts] = useState(false)
  const [homeLocaleTick, setHomeLocaleTick] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const bump = () => setHomeLocaleTick((n) => n + 1)
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

  const primarySideNavZone = useMemo(() => {
    const sideNavZones = recommendZones.filter((zone) => zone.zoneType === 'SIDE_NAV')
    return sideNavZones.find((zone) => isHotSideNavZone(zone)) ?? sideNavZones[0] ?? null
  }, [recommendZones])

  const defaultRecommendCategoryId = useMemo(() => {
    const firstItem = primarySideNavZone?.items.find((item) => item.entityType === 'SIDE_NAV')
    return firstItem?.categoryId ?? null
  }, [primarySideNavZone])

  const [selectedRecommendCategoryId, setSelectedRecommendCategoryId] = useState<string | null>(null)

  useEffect(() => {
    if (!defaultRecommendCategoryId) {
      setSelectedRecommendCategoryId(null)
      return
    }

    setSelectedRecommendCategoryId((current) => {
      if (current && primarySideNavZone?.items.some((item) => item.entityType === 'SIDE_NAV' && item.categoryId === current)) {
        return current
      }
      return defaultRecommendCategoryId
    })
  }, [defaultRecommendCategoryId, primarySideNavZone])

  const filteredRecommendZones = useMemo(() => recommendZones, [recommendZones])

  useEffect(() => {
    const lang = typeof window !== 'undefined' ? getClientPreferredLang() : 'en'
    const cached = peekCachedHomeRecommendZones(lang)
    // Keep showing cached zones while refreshing — never flash empty on locale tick
    if (!cached?.length) setIsLoadingRecommendZones(true)

    loadHomeRecommendZonesCached(lang)
      .then((zones) => {
        setRecommendZones(zones)
      })
      .catch((err: any) => {
        // Keep previous zones on transient 502 — avoid empty homepage flash
        console.warn('[getHomeRecommendZones]', err?.message || err)
      })
      .finally(() => setIsLoadingRecommendZones(false))
  }, [homeLocaleTick])

  // getHomeFeaturedProducts / linkedCategoryProducts: intentionally not fetched —
  // no current storefront view consumes them (was a pure waterfall after zones).

  const fallbackDailyNewArrivalMonths = useMemo(
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

  // 月历：桌面顶部下拉需要；延后到首屏专区之后，避免挡住推荐区 RPC
  useEffect(() => {
    let cancelled = false
    let idleId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const load = () => {
      if (cancelled) return
      setIsLoadingDailyNewArrivalCalendar(true)
      getDailyNewArrivalCalendar()
        .then((res) => {
          if (cancelled) return
          const months =
            Array.isArray(res.months) && res.months.length > 0
              ? res.months
              : fallbackDailyNewArrivalMonths
          setDailyNewArrivalMonths(months)
          setDailyNewArrivalTotalActiveProducts(res.totalActiveProducts ?? 0)
        })
        .catch((err: any) => {
          if (cancelled) return
          setDailyNewArrivalMonths(fallbackDailyNewArrivalMonths)
          setDailyNewArrivalTotalActiveProducts(0)
          console.warn('[dailyNewArrivalCalendar]', err?.message || err)
        })
        .finally(() => {
          if (!cancelled) setIsLoadingDailyNewArrivalCalendar(false)
        })
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(load, { timeout: 1800 })
    } else {
      timeoutId = setTimeout(load, 400)
    }

    return () => {
      cancelled = true
      if (idleId != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [fallbackDailyNewArrivalMonths])

  // 仅在用户选中具体月份时拉商品 — 默认首页不再拉「近 6 个月全量上新」
  useEffect(() => {
    if (!selectedDailyNewArrivalMonthKey) {
      setDailyNewArrivalProducts([])
      setIsLoadingDailyNewArrivalProducts(false)
      return
    }

    let cancelled = false
    setIsLoadingDailyNewArrivalProducts(true)

    const lang =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('app_preferred_locale') ||
          document.documentElement.getAttribute('lang') ||
          'en'
        : 'en'

    const [yearText, monthText] = selectedDailyNewArrivalMonthKey.split('-')
    const year = Number(yearText)
    const month = Number(monthText)
    const request =
      Number.isInteger(year) && Number.isInteger(month)
        ? getDailyNewArrivalProducts({ year, month, lang, page: 1, page_size: 60 })
        : Promise.resolve({ list: [] as ProductItem[], total: 0 })

    request
      .then((res) => {
        if (cancelled) return
        setDailyNewArrivalProducts(Array.isArray(res.list) ? res.list : [])
      })
      .catch((err: any) => {
        if (cancelled) return
        setDailyNewArrivalProducts([])
        toast.error(err.message || 'Failed to load new arrivals')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDailyNewArrivalProducts(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedDailyNewArrivalMonthKey, homeLocaleTick])

  const clearDailyNewArrivalMonthSelection = () => {
    setSelectedDailyNewArrivalMonthKey(null)
    setDailyNewArrivalProducts([])
    setIsLoadingDailyNewArrivalProducts(false)
  }

  const handleSelectCategory: typeof handlers.handleSelectCategory = (categoryId, options) => {
    if (!categoryId || categoryId !== state.dailyNewArrivalCategoryId) {
      clearDailyNewArrivalMonthSelection()
    }
    handlers.handleSelectCategory(categoryId, options)
  }

  const handleToggleDesktopTopNavCategory: typeof handlers.handleToggleDesktopTopNavCategory = (
    categoryId,
    options,
  ) => {
    // 「每日上新 / New」：进入专属时间窗列表页（不按分类 ID 筛商品）
    if (categoryId && categoryId === state.dailyNewArrivalCategoryId) {
      clearDailyNewArrivalMonthSelection()
      handlers.handleSelectCategory(categoryId, options)
      return
    }
    clearDailyNewArrivalMonthSelection()
    handlers.handleToggleDesktopTopNavCategory(categoryId, options)
  }

  const handleSelectDailyNewArrivalMonth = (monthKey: string) => {
    setSelectedDailyNewArrivalMonthKey(monthKey)
    handlers.handleTopCategoryHoverChange(null)

    const categoryId = state.dailyNewArrivalCategoryId
    if (categoryId) {
      // 带上 dailyMonth，分类页/首页共用同一套按月筛选
      const slug =
        state.categories.find((c) => c.category_id === categoryId)?.category_slug ||
        null
      const params = new URLSearchParams()
      params.set('dailyMonth', monthKey)
      if (slug) {
        router.push(`/category/${encodeURIComponent(String(slug).trim())}?${params.toString()}`)
      } else {
        params.set('categoryId', categoryId)
        router.push(`${ProductCategory.path}?${params.toString()}`)
      }
      handlers.handleSelectCategory(categoryId)
    }
  }

  const handleNavigateRecommendProduct = (productId: string) => {
    if (!productId?.trim()) {
      toast.error('Missing product info')
      return
    }
    ProductDetail.navigateToById(router, { productId })
  }

  const handleNavigateRecommendCategory = (categoryId: string, categorySlug?: string | null) => {
    if (!categoryId) return
    // Brand / SIDE_NAV / 类目专区卡片点击 → 打开该分类商品列表
    setSelectedRecommendCategoryId(categoryId)
    ProductCategory.navigateToCategory(router, {
      categoryId,
      categorySlug: categorySlug || undefined,
    })
  }

  const handleNavigateRecommendZone = (zoneId: string) => {
    if (!zoneId?.trim()) return
    const zone = recommendZones.find((item) => item.zoneId === zoneId)
    // 类目专区且仅挂 1 个类目时：View All 直接进该类目商品列表
    if (zone?.zoneType === 'CATEGORY') {
      const categoryItems = (zone.items || []).filter(
        (item): item is Extract<(typeof zone.items)[number], { entityType: 'CATEGORY' }> =>
          item.entityType === 'CATEGORY',
      )
      if (categoryItems.length === 1) {
        const only = categoryItems[0]
        ProductCategory.navigateToCategory(router, {
          categoryId: only.categoryId,
          categorySlug: only.categorySlug || undefined,
        })
        return
      }
    }
    // 商品专区 / 多类目专区：进 /zone 全量展示（不按首页列×行截断）
    RecommendZone.navigateTo(router, { zoneId })
  }

  const handleAddRecommendProductToCart = async (item: HomeRecommendProductCard) => {
    if (item.status === 'DRAFT' || !item.defaultSkuId) {
      toast.error('This product cannot be added to cart')
      return
    }

    if (!userSession.token?.trim()) {
      openStorefrontLogin(openAuthModal)
      return
    }

    if (item.skuCount > 1) {
      ProductDetail.navigateToById(router, { productId: item.productId })
      return
    }

    await addCartItem({
      productId: item.productId,
      productSkuId: item.defaultSkuId,
    })
    toast.success('Added to cart')
  }

  const handleAddRecommendProductSkuToCart = async (item: HomeRecommendProductCard, productSkuId: string) => {
    if (item.status === 'DRAFT') {
      toast.error('This product cannot be added to cart')
      return
    }

    if (!productSkuId?.trim()) {
      toast.error('Please select an option')
      return
    }

    if (!userSession.token?.trim()) {
      openStorefrontLogin(openAuthModal)
      return
    }

    await addCartItem({
      productId: item.productId,
      productSkuId: productSkuId.trim(),
    })
    toast.success('Added to cart')
  }

  const handleAddRecommendProductToWishlist = (_item: HomeRecommendProductCard, favorited?: boolean) => {
    // 收藏状态由 WishlistHeartButton + localStorage 管理；此处仅做反馈
    if (typeof favorited === 'boolean') {
      toast.success(favorited ? `Saved: ${_item.productName}` : `Removed: ${_item.productName}`)
    }
  }

  const handleAddLinkedCategoryProductToCart = async (item: HomeLinkedCategoryProduct) => {
    if (!userSession.token?.trim()) {
      openStorefrontLogin(openAuthModal)
      return
    }

    if (!item.defaultSkuId) {
      ProductDetail.navigateToById(router, { productId: item.productId })
      return
    }

    await addCartItem({
      productId: item.productId,
      productSkuId: item.defaultSkuId,
    })
    toast.success('Added to cart')
  }

  return {
    state: {
      ...state,
      recommendZones: filteredRecommendZones,
      isLoadingRecommendZones,
      selectedRecommendCategoryId,
      linkedCategoryProducts,
      isLoadingLinkedCategoryProducts,
      dailyNewArrivalMonths,
      selectedDailyNewArrivalMonthKey,
      dailyNewArrivalProducts,
      dailyNewArrivalTotalActiveProducts,
      isLoadingDailyNewArrivalCalendar,
      isLoadingDailyNewArrivalProducts,
    },
    handlers: {
      ...handlers,
      handleSelectCategory,
      handleToggleDesktopTopNavCategory,
      handleNavigateRecommendProduct,
      handleNavigateRecommendCategory,
      handleNavigateRecommendZone,
      handleAddRecommendProductToCart,
      handleAddRecommendProductSkuToCart,
      handleAddRecommendProductToWishlist,
      handleAddLinkedCategoryProductToCart,
      handleSelectDailyNewArrivalMonth,
    },
  }
}
