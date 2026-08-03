'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ProductCategory, ProductDetail, RecommendZone } from '@/frontend/route-params';
import { useCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext';
import { useUserSession } from '@/tools/FrontendSession';
import {
  addCartItem,
  getHomeFeaturedProducts,
  getHomeRecommendZones,
  getDailyNewArrivalCalendar,
  getDailyNewArrivalProducts,
  type DailyNewArrivalMonthCard,
  type HomeRecommendZoneSection,
} from '@/frontend/actions/Home'
import type { ProductItem } from '@/frontend/actions/ProductCategory'
import { buildLast6Months, formatMonthLabel } from '@/frontend/utils/dailyNewArrival';

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
  handleAddRecommendProductToWishlist: (item: HomeRecommendProductCard, favorited?: boolean) => void
  handleAddLinkedCategoryProductToCart: (item: HomeLinkedCategoryProduct) => Promise<void>
  handleSelectDailyNewArrivalMonth: (monthKey: string) => void
}

type BaseHomeState = import('@/frontend/hooks/useProductCategory').ProductCategoryState
type BaseHomeHandlers = import('@/frontend/hooks/useProductCategory').ProductCategoryHandlers
type HomeRecommendProductCard = Extract<HomeRecommendZoneSection['items'][number], { entityType: 'PRODUCT' }>

const isHotSideNavZone = (zone: { title: string; zoneType?: string }) =>
  zone.title.trim().toLowerCase() === 'hot'

export const useHome = (): { state: HomeState; handlers: HomeHandlers } => {
  const { state, handlers } = useProductCategory()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userSession = useUserSession()
  const { openAuthModal } = useCustomerAuthModal()
  const [recommendZones, setRecommendZones] = useState<HomeRecommendZoneSection[]>([])
  const [isLoadingRecommendZones, setIsLoadingRecommendZones] = useState(true)
  const [linkedCategoryProducts, setLinkedCategoryProducts] = useState<HomeLinkedCategoryProduct[]>([])
  const [isLoadingLinkedCategoryProducts, setIsLoadingLinkedCategoryProducts] = useState(false)
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
    setIsLoadingRecommendZones(true)
    const lang = typeof window !== 'undefined' ? getClientPreferredLang() : 'en'
    getHomeRecommendZones({ lang })
      .then((res) => {
        setRecommendZones(Array.isArray(res.zones) ? res.zones : [])
      })
      .catch((err: any) => {
        setRecommendZones([])
        toast.error(err.message || '推荐专区加载失败')
      })
      .finally(() => setIsLoadingRecommendZones(false))
  }, [homeLocaleTick])

  useEffect(() => {
    const categoryId = selectedRecommendCategoryId?.trim() || ''
    if (!categoryId) {
      setLinkedCategoryProducts([])
      setIsLoadingLinkedCategoryProducts(false)
      return
    }

    let cancelled = false
    setIsLoadingLinkedCategoryProducts(true)

    getHomeFeaturedProducts({
      categoryId,
      lang: typeof window !== 'undefined' ? getClientPreferredLang() : 'en',
    })
      .then((res) => {
        if (cancelled) return
        setLinkedCategoryProducts(
          (res.products || []).map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode,
            mainImageUrl: item.mainImageUrl,
            ratingAverage: item.ratingAverage,
            ratingCount: item.ratingCount,
            defaultSkuId: item.defaultSkuId,
            price: item.price,
            originalPrice: item.originalPrice,
            brandName: item.brandName,
            shortDescription: item.sellingPoints?.[0]?.content || null,
          })),
        )
      })
      .catch((err: any) => {
        if (cancelled) return
        setLinkedCategoryProducts([])
        toast.error(err.message || '分类商品加载失败')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLinkedCategoryProducts(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedRecommendCategoryId, homeLocaleTick])

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

  // 预加载发布月历，供顶部「每日上新」悬浮下拉使用（不依赖点击进入分类）
  useEffect(() => {
    let cancelled = false
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
        // Soft-fail: month dropdown still works with empty counts; avoid red toast on home
        console.warn('[dailyNewArrivalCalendar]', err?.message || err)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDailyNewArrivalCalendar(false)
      })

    return () => {
      cancelled = true
    }
  }, [fallbackDailyNewArrivalMonths])

  useEffect(() => {
    let cancelled = false
    setIsLoadingDailyNewArrivalProducts(true)

    const lang =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('app_preferred_locale') ||
          document.documentElement.getAttribute('lang') ||
          'en'
        : 'en'

    const request = selectedDailyNewArrivalMonthKey
      ? (() => {
          const [yearText, monthText] = selectedDailyNewArrivalMonthKey.split('-')
          const year = Number(yearText)
          const month = Number(monthText)
          if (!Number.isInteger(year) || !Number.isInteger(month)) {
            return Promise.resolve({ list: [], total: 0 })
          }
          return getDailyNewArrivalProducts({ year, month, lang })
        })()
      : getDailyNewArrivalProducts({ lang }) // 最近 6 个月全部上新

    request
      .then((res) => {
        if (cancelled) return
        setDailyNewArrivalProducts(Array.isArray(res.list) ? res.list : [])
      })
      .catch((err: any) => {
        if (cancelled) return
        setDailyNewArrivalProducts([])
        toast.error(err.message || '上新商品加载失败')
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
      toast.error('商品信息缺失，无法打开详情')
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
    RecommendZone.navigateTo(router, { zoneId })
  }

  const handleAddRecommendProductToCart = async (item: HomeRecommendProductCard) => {
    if (item.status === 'DRAFT' || !item.defaultSkuId) {
      toast.error('该商品暂不可加购')
      return
    }

    if (!userSession.token?.trim()) {
      openAuthModal('login')
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
    toast.success('已成功加入购物车')
  }

  const handleAddRecommendProductToWishlist = (_item: HomeRecommendProductCard, favorited?: boolean) => {
    // 收藏状态由 WishlistHeartButton + localStorage 管理；此处仅做反馈
    if (typeof favorited === 'boolean') {
      toast.success(favorited ? `已收藏：${_item.productName}` : `已取消收藏：${_item.productName}`)
    }
  }

  const handleAddLinkedCategoryProductToCart = async (item: HomeLinkedCategoryProduct) => {
    if (!userSession.token?.trim()) {
      openAuthModal('login')
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
    toast.success('已成功加入购物车')
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
      handleAddRecommendProductToWishlist,
      handleAddLinkedCategoryProductToCart,
      handleSelectDailyNewArrivalMonth,
    },
  }
}
