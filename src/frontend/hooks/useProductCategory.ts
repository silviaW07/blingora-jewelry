'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePathname, useRouter } from 'next/navigation'
import { useClientSearchParams } from '@/frontend/utils/useClientSearchParams'
import { toast } from 'sonner'
import { Home, ProductCategory, ProductDetail, Cart } from '@/frontend/route-params'
import { openStorefrontLogin, openStorefrontRegister, notifyStorefrontUrl } from '@/frontend/utils/hardNavigate'
import { useUserSession, UserSession } from '@/tools/FrontendSession'
import { useCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext'
import { getClientPreferredLang } from '@/frontend/i18n'
import type {
  StockStatusEnum,
  SortByEnum,
  CategoryDetail,
  ProductItem,
  SideNavZoneSection
} from '@/frontend/actions/ProductCategory'
import {
  getCategoryDetail,
  getCategoryPosterList,
  getKeywordGroupList,
  getKeywordList,
  getAvailableBrandFilters,
  addToCart,
  getCategoryTopPromotion,
  resolveCategoryRouteKey,
} from '@/frontend/actions/ProductCategory'
import { fetchCategoryShelfProducts } from '@/frontend/utils/storefrontProductsClient'
import { loadCategoryListCached, peekCachedCategoryList, seedCategoryListCache } from '@/frontend/utils/categoryListCache'
import type { StorefrontBootstrap } from '@/frontend/types/storefrontBootstrap'
import { loadSideNavZonesCached } from '@/frontend/utils/sideNavZonesCache'
import { getDailyNewArrivalProducts } from '@/frontend/actions/Home'
import { findDailyNewArrivalCategoryId, isDailyNewArrivalCategoryName } from '@/frontend/utils/dailyNewArrival'
import { normalizePosterLinkUrl, isAbsoluteHttpUrl } from '@/shared/posterLink'

type CategoryChildItem = {
  category_id: string
  category_name: string
  category_slug: string | null
}

type BrandCategoryItem = {
  category_id: string
  category_name: string
  category_slug: string | null
  product_count: number
}

type CategoryItem = {
  category_id: string
  category_name: string
  category_slug: string | null
  parent_category_id: string | null
  level: number
  display_config: {
    showChildrenByDefault: boolean
    allowChildrenCollapse: boolean
    showBrandFilter: boolean
    brandFilterCollapsedRows: number
  }
  children: CategoryChildItem[]
  brand_options: BrandCategoryItem[]
}

type CategoryPosterItem = {
  poster_id: string
  title: string
  subtitle: string | null
  image_url: string | null
  link_text: string | null
  link_url: string | null
  category_id: string | null
  sort_weight: number
}

type ProductCardItem = ProductItem & {
  brand_category_name: string | null
}

type KeywordSceneArea = 'LEFT_NAV' | 'RECOMMENDATION' | 'BOTH'

type PromotionCountdownParts = {
  days: string
  hours: string
  minutes: string
  seconds: string
}

type PromotionConfig = {
  enabled: boolean
  message: string | null
  end_time: string | null
  background_color: string | null
  text_color: string | null
}

const EMPTY_COUNTDOWN_PARTS: PromotionCountdownParts = {
  days: '00',
  hours: '00',
  minutes: '00',
  seconds: '00'
}

const DEFAULT_PROMOTION_COLORS = {
  background: '#111111',
  text: '#ffffff'
}

const STOCK_STATUS_LABELS: Record<StockStatusEnum, string> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock'
}

const SORT_BY_LABELS: Record<SortByEnum, string> = {
  NEWEST: 'Newest',
  PRICE_ASC: 'Price: low to high',
  PRICE_DESC: 'Price: high to low',
  POPULARITY: 'Popular'
}

const getCurrentLang = () => (typeof window !== 'undefined' ? getClientPreferredLang() : 'en')

const KEYWORD_GROUP_LIMIT = 16

/** Resolve category id from nav tree by slug or id (sync — for cache warm start). */
function findCategoryIdInTree(
  list: Array<{
    category_id: string
    category_slug: string | null
    children?: Array<{ category_id: string; category_slug: string | null }>
    brand_options?: Array<{ category_id: string; category_slug: string | null }>
  }>,
  slugOrId: string,
  recommendZones?: Array<{
    items?: Array<{
      entityType?: string
      categoryId?: string
      categorySlug?: string | null
    }>
  }> | null,
): string {
  const normalized = String(slugOrId || '').trim()
  if (!normalized) return ''
  const needle = normalized.toLowerCase()
  const matchId = (item?: { category_id?: string; category_slug?: string | null } | null) => {
    if (!item) return ''
    if (String(item.category_id || '') === normalized) return String(item.category_id)
    if (String(item.category_slug || '').trim().toLowerCase() === needle) {
      return String(item.category_id || '')
    }
    return ''
  }
  for (const cat of list) {
    const self = matchId(cat)
    if (self) return self
    for (const child of cat.children || []) {
      const id = matchId(child)
      if (id) return id
    }
    for (const brand of cat.brand_options || []) {
      const id = matchId(brand)
      if (id) return id
    }
  }
  // 推荐区标签类目（Normal quality 等）：多重归类标签，不在货架导航树中
  // CATEGORY + SIDE_NAV 都可能挂类目；跳过纯商品卡
  for (const zone of recommendZones || []) {
    for (const item of zone.items || []) {
      const entity = String(item.entityType || '').toUpperCase()
      if (entity === 'PRODUCT') continue
      if (!item.categoryId && !item.categorySlug) continue
      if (String(item.categoryId || '') === normalized) return String(item.categoryId)
      if (String(item.categorySlug || '').trim().toLowerCase() === needle) {
        return String(item.categoryId || '')
      }
    }
  }
  return ''
}

function parseCategorySlugFromPathname(pathname: string | null): string {
  if (!pathname || !pathname.startsWith('/category/')) return ''
  const rest = pathname.slice('/category/'.length)
  const slug = rest.split('/').filter(Boolean)[0] || ''
  try {
    return decodeURIComponent(slug).trim()
  } catch {
    return slug.trim()
  }
}

export interface ProductCategoryBannerItem {
  poster_id: string
  title: string
  subtitle: string | null
  image_url: string | null
  link_text: string | null
  link_url: string | null
  category_id: string | null
  sort_weight: number
}

export interface ProductCategoryKeywordGroup {
  group_id: string
  group_name: string
  scene_area: KeywordSceneArea
  scene_slot_key: string | null
  homepage_sort_weight: number
  sort_weight: number
}

export type ProductCategoryKeywordItem = {
  keyword_id: string
  keyword_label: string
  category_id: string | null
  linked_category_ids: string[]
  sort_weight: number
  group_id: string
  group_name: string
  scene_area: KeywordSceneArea
}

export interface ProductCategoryPromotionBanner {
  message: string | null
  isActive: boolean
  isEnded: boolean
  countdown: PromotionCountdownParts
  colors: {
    background: string
    text: string
  }
}

export interface ProductCategoryRecommendationFloor {
  group_id: string
  group_name: string
  scene_slot_key: string | null
  keywords: ProductCategoryKeywordItem[]
}

export interface ProductCategorySideNavZone extends SideNavZoneSection {}

export interface ProductCategoryState {
  userSession: {
    isLoggedIn: boolean
    username: string
    avatarText: string
  }
  topNavPanelRef: React.RefObject<HTMLDivElement | null>
  cartBadgeCount: number
  isUserMenuOpen: boolean
  hoveredTopCategoryId: string | null
  expandedTopNavCategoryIds: string[]
  queryState: {
    categoryId: string
    brandCategoryId: string
    keywordId: string
    keywordGroupId: string
    searchKeyword: string
    stockStatus: StockStatusEnum[]
    sortBy: SortByEnum
    page: number
    pageSize: number
    minPrice: number | undefined
    maxPrice: number | undefined
    hasDiscount: boolean
    minRating: number | undefined
  }
  priceInput: {
    min: string
    max: string
  }
  categories: CategoryItem[]
  selectedParentCategory: CategoryItem | null
  visibleBrandOptions: BrandCategoryItem[]
  availableBrandFilters: BrandCategoryItem[]
  hasMoreBrandOptions: boolean
  isBrandExpanded: boolean
  isLoadingBrandFilters: boolean
  expandedCategoryIds: string[]
  categoryDetail: CategoryDetail | null
  currentCategoryLevel: number | null
  posters: ProductCategoryBannerItem[]
  sideNavZones: ProductCategorySideNavZone[]
  leftNavKeywordGroups: ProductCategoryKeywordGroup[]
  recommendationKeywordGroups: ProductCategoryKeywordGroup[]
  activeLeftNavGroupId: string
  activeRecommendationGroupId: string
  leftNavKeywords: ProductCategoryKeywordItem[]
  recommendationKeywords: ProductCategoryKeywordItem[]
  recommendationFloors: ProductCategoryRecommendationFloor[]
  activeBannerIndex: number
  promotionBanner: ProductCategoryPromotionBanner | null
  products: ProductCardItem[]
  isSecondaryCategoryResults: boolean
  totalCount: number
  isLoadingCategories: boolean
  isLoadingProducts: boolean
  /** True while /category/[slug] has a slug but categoryId is not resolved yet */
  isResolvingCategoryRoute: boolean
  routeCategorySlug: string
  totalPages: number
  stockStatusLabels: Record<StockStatusEnum, string>
  sortByLabels: Record<SortByEnum, string>
  dailyNewArrivalCategoryId: string | null
  isDailyNewArrivalMode: boolean
}

export interface ProductCategoryHandlers {
  handleFilterChange: <K extends keyof ProductCategoryState['queryState']>(field: K, value: ProductCategoryState['queryState'][K]) => void
  handleSelectCategory: (categoryId: string, options?: { parentCategoryId?: string; categorySlug?: string | null }) => void
  handleTopCategoryHoverChange: (categoryId: string | null) => void
  handleToggleDesktopTopNavCategory: (categoryId: string, options?: { categorySlug?: string | null }) => void
  handleToggleTopNavCategory: (categoryId: string) => void
  handleNavigateToWishlist: () => void
  handleNavigateToCart: () => void
  handleNavigateToLogin: () => void
  handleNavigateToRegister: () => void
  handleToggleUserMenu: () => void
  handleNavigateToAccountCenter: () => void
  handleNavigateToOrderCenter: () => void
  handleLogout: () => void
  handleNavigateBackHome: () => void
  handleBannerChange: (nextIndex: number) => void
  handleBannerClick: (banner: ProductCategoryBannerItem) => void
  handleSelectKeyword: (item: ProductCategoryKeywordItem) => void
  handleSearchProducts: (keyword: string) => void
  handleSelectLeftNavGroup: (groupId: string) => void
  handleSelectRecommendationGroup: (groupId: string) => void
  handleClearAllFilters: () => void
  handlePriceInputChange: (field: 'min' | 'max', value: string) => void
  handleApplyPriceRange: () => void
  handlePriceRangeChange: (min: number | undefined, max: number | undefined) => void
  handleSortChange: (sortBy: SortByEnum) => void
  handleStockStatusToggle: (status: StockStatusEnum, checked: boolean) => void
  handleRatingChange: (val: string) => void
  handleAddToCart: (item: ProductCardItem) => Promise<void>
  handleAddToWishlist: (item: ProductCardItem, favorited?: boolean) => void
  handleNavigateToDetail: (productId: string) => void
  handleToggleCategoryChildren: (categoryId: string) => void
  handleToggleBrandExpand: () => void
  handleBrandQuickFilterToggle: (brandId: string) => void
}

export type ProductCategoryListingSeed = {
  categoryId?: string
  products?: ProductItem[]
  totalCount?: number
}

export const useProductCategory = (
  bootstrap?: StorefrontBootstrap | null,
  listingSeed?: ProductCategoryListingSeed | null,
): {
  state: ProductCategoryState
  handlers: ProductCategoryHandlers
} => {
  const topNavPanelRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const searchParams = useClientSearchParams()
  const routeParams = useMemo(() => ProductCategory.getParams(searchParams), [searchParams])
  const userSession = useUserSession() as UserSession
  const { role, username } = userSession
  const { openAuthModal } = useCustomerAuthModal()

  const isCategorySlugRoute = Boolean(pathname && pathname.startsWith('/category/'))
  const isStorefrontHomePath = !pathname || pathname === '/' || pathname === '/home'
  const routeCategorySlug = useMemo(
    () => parseCategorySlugFromPathname(pathname),
    [pathname],
  )

  const [queryState, setQueryState] = useState(() => {
    // Warm-start categoryId from SSR seed / nav cache so listing HTML is not empty.
    const slugOnMount = parseCategorySlugFromPathname(pathname)
    const cachedId = slugOnMount
      ? findCategoryIdInTree(
          bootstrap?.categories?.length ? bootstrap.categories : peekCachedCategoryList() || [],
          slugOnMount,
          bootstrap?.recommendZones,
        )
      : ''
    const categoryId = slugOnMount
      ? (listingSeed?.categoryId || cachedId)
      : (routeParams.categoryId || '')

    return {
      categoryId,
      brandCategoryId: routeParams.brandCategoryId || '',
      keywordId: '',
      keywordGroupId: '',
      searchKeyword: routeParams.search || '',
      stockStatus: (routeParams.stockStatus ? routeParams.stockStatus.split(',').filter(Boolean) : []).filter((status): status is StockStatusEnum => status === 'IN_STOCK' || status === 'LOW_STOCK') as StockStatusEnum[],
      sortBy: (routeParams.sortBy as SortByEnum) || 'NEWEST',
      page: routeParams.page ? parseInt(routeParams.page) : 1,
      pageSize: 60,
      minPrice: routeParams.minPrice ? parseFloat(routeParams.minPrice) : undefined,
      maxPrice: routeParams.maxPrice ? parseFloat(routeParams.maxPrice) : undefined,
      hasDiscount: false,
      minRating: undefined as number | undefined,
    }
  })
  const [priceInput, setPriceInput] = useState({
    min: routeParams.minPrice || '',
    max: routeParams.maxPrice || ''
  })
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    if (bootstrap?.categories?.length) {
      seedCategoryListCache(bootstrap.categories, getClientPreferredLang())
      return bootstrap.categories
    }
    return peekCachedCategoryList() || []
  })
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetail | null>(null)
  const [currentCategoryLevel, setCurrentCategoryLevel] = useState<number | null>(routeParams.categoryId ? null : 1)
  const [posters, setPosters] = useState<CategoryPosterItem[]>(() => bootstrap?.posters || [])
  const [sideNavZones, setSideNavZones] = useState<ProductCategorySideNavZone[]>([])
  const [leftNavKeywordGroups, setLeftNavKeywordGroups] = useState<ProductCategoryKeywordGroup[]>([])
  const [recommendationKeywordGroups, setRecommendationKeywordGroups] = useState<ProductCategoryKeywordGroup[]>([])
  const [activeLeftNavGroupId, setActiveLeftNavGroupId] = useState('')
  const [activeRecommendationGroupId, setActiveRecommendationGroupId] = useState('')
  const [leftNavKeywords, setLeftNavKeywords] = useState<ProductCategoryKeywordItem[]>([])
  const [recommendationKeywords, setRecommendationKeywords] = useState<ProductCategoryKeywordItem[]>([])
  const [products, setProducts] = useState<ProductCardItem[]>(() =>
    Array.isArray(listingSeed?.products) ? listingSeed.products : [],
  )
  const productsRef = useRef<ProductCardItem[]>(
    Array.isArray(listingSeed?.products) ? listingSeed.products : [],
  )
  productsRef.current = products
  const [availableBrandFilters, setAvailableBrandFilters] = useState<BrandCategoryItem[]>([])
  const [isLoadingBrandFilters, setIsLoadingBrandFilters] = useState(false)
  const [totalCount, setTotalCount] = useState(
    () => listingSeed?.totalCount ?? listingSeed?.products?.length ?? 0,
  )
  const [isLoadingCategories, setIsLoadingCategories] = useState(
    () => !(bootstrap?.categories?.length || peekCachedCategoryList()?.length),
  )
  const [isLoadingProducts, setIsLoadingProducts] = useState(
    () => !(listingSeed?.products && listingSeed.products.length > 0),
  )
  const [localeTick, setLocaleTick] = useState(0)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([])
  const [isBrandExpanded, setIsBrandExpanded] = useState(false)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [promotionConfig, setPromotionConfig] = useState<PromotionConfig | null>(null)
  const [promotionNow, setPromotionNow] = useState(() => Date.now())
  const [cartBadgeCount] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [hoveredTopCategoryId, setHoveredTopCategoryId] = useState<string | null>(null)
  const [expandedTopNavCategoryIds, setExpandedTopNavCategoryIds] = useState<string[]>([])
  const topNavHoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const productFetchGenRef = useRef(0)

  const clearTopNavHoverCloseTimer = useCallback(() => {
    if (topNavHoverCloseTimerRef.current) {
      clearTimeout(topNavHoverCloseTimerRef.current)
      topNavHoverCloseTimerRef.current = null
    }
  }, [])

  const closeTopNavHoverPanel = useCallback(() => {
    clearTopNavHoverCloseTimer()
    setHoveredTopCategoryId(null)
  }, [clearTopNavHoverCloseTimer])

  useEffect(() => {
    return () => {
      clearTopNavHoverCloseTimer()
    }
  }, [clearTopNavHoverCloseTimer])

  // Soft nav：同步 URL query → queryState。
  // /category/[slug] 路由的 categoryId 由 slug 解析 effect 写入，这里绝不能强制清空，
  // 否则会把已解析的分类冲掉，导致 getProductList 不带 category_id、返回全站商品。
  useEffect(() => {
    const nextCategoryIdFromQuery = routeParams.categoryId || ''
    const nextSearchKeyword = routeParams.search || ''
    const nextPage = routeParams.page ? parseInt(routeParams.page, 10) : 1
    const nextSortBy = (routeParams.sortBy as SortByEnum) || 'NEWEST'
    const nextMinPrice = routeParams.minPrice ? parseFloat(routeParams.minPrice) : undefined
    const nextMaxPrice = routeParams.maxPrice ? parseFloat(routeParams.maxPrice) : undefined
    const nextBrandCategoryId = routeParams.brandCategoryId || ''
    const nextStockStatus = (routeParams.stockStatus ? routeParams.stockStatus.split(',').filter(Boolean) : []).filter(
      (status): status is StockStatusEnum => status === 'IN_STOCK' || status === 'LOW_STOCK',
    ) as StockStatusEnum[]

    setQueryState((prev) => {
      const nextCategoryId = isCategorySlugRoute ? prev.categoryId : nextCategoryIdFromQuery

      if (
        prev.categoryId === nextCategoryId &&
        prev.searchKeyword === nextSearchKeyword &&
        prev.page === nextPage &&
        prev.sortBy === nextSortBy &&
        prev.minPrice === nextMinPrice &&
        prev.maxPrice === nextMaxPrice &&
        prev.brandCategoryId === nextBrandCategoryId &&
        prev.stockStatus.join(',') === nextStockStatus.join(',')
      ) {
        return prev
      }

      const categoryChanged = prev.categoryId !== nextCategoryId
      const searchChanged = prev.searchKeyword !== nextSearchKeyword

      return {
        ...prev,
        categoryId: nextCategoryId,
        searchKeyword: nextSearchKeyword,
        page: Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1,
        sortBy: nextSortBy,
        minPrice: nextMinPrice,
        maxPrice: nextMaxPrice,
        brandCategoryId: categoryChanged || searchChanged ? '' : nextBrandCategoryId,
        stockStatus: nextStockStatus,
        ...(categoryChanged || searchChanged
          ? { brandCategoryId: '', keywordId: '', keywordGroupId: '' }
          : {}),
      }
    })

    setPriceInput({
      min: routeParams.minPrice || '',
      max: routeParams.maxPrice || '',
    })
  }, [
    isCategorySlugRoute,
    routeParams.categoryId,
    routeParams.search,
    routeParams.page,
    routeParams.sortBy,
    routeParams.minPrice,
    routeParams.maxPrice,
    routeParams.brandCategoryId,
    routeParams.stockStatus,
  ])

  useEffect(() => {
    const lang = getCurrentLang()
    const cached = peekCachedCategoryList(lang)
    // Keep showing cached nav while refreshing — never flash empty on route change
    if (!cached?.length) setIsLoadingCategories(true)
    loadCategoryListCached(lang)
      .then((list) => {
        setCategories(list)
        setExpandedCategoryIds(
          list
            .filter((category) => category.display_config.showChildrenByDefault)
            .map((category) => category.category_id),
        )
      })
      .catch((err: any) => {
        // Only toast when we have nothing to show
        if (!(peekCachedCategoryList()?.length)) {
          toast.error(err?.message || 'Failed to load categories', { id: 'category-list' })
        }
      })
      .finally(() => setIsLoadingCategories(false))
  }, [localeTick])

  // Switch /category/[slug]: reset listing filters when the slug segment changes.
  useEffect(() => {
    if (!isCategorySlugRoute) return
    setQueryState((prev) => {
      if (prev.page === 1 && !prev.brandCategoryId && !prev.keywordId && !prev.keywordGroupId) {
        return prev
      }
      return {
        ...prev,
        page: 1,
        brandCategoryId: '',
        keywordId: '',
        keywordGroupId: '',
      }
    })
  }, [isCategorySlugRoute, routeCategorySlug])

  // Apply categoryId from nav tree as soon as slug (or cached tree) is known —
  // do not wait for the async resolveCategoryRouteKey round-trip.
  useEffect(() => {
    if (!isCategorySlugRoute || !routeCategorySlug) return
    const fromTree = findCategoryIdInTree(categories, routeCategorySlug, bootstrap?.recommendZones)
    if (!fromTree) return
    setQueryState((prev) => (prev.categoryId === fromTree ? prev : { ...prev, categoryId: fromTree }))
  }, [isCategorySlugRoute, routeCategorySlug, categories, bootstrap?.recommendZones])

  const resolveCategoryIdBySlug = useCallback((slug: string): string => {
    return findCategoryIdInTree(categories, slug, bootstrap?.recommendZones)
  }, [categories, bootstrap?.recommendZones])

  const resolveCategorySlugById = useCallback((categoryId: string): string => {
    const id = String(categoryId || '').trim()
    if (!id) return ''
    for (const cat of categories) {
      if (cat.category_id === id) return String(cat.category_slug || '').trim()
      for (const child of cat.children || []) {
        if (child.category_id === id) return String(child.category_slug || '').trim()
      }
      for (const brand of cat.brand_options || []) {
        if (brand.category_id === id) return String(brand.category_slug || '').trim()
      }
    }
    return ''
  }, [categories])

  useEffect(() => {
    if (!isCategorySlugRoute) return
    if (!routeCategorySlug) return
    if (isLoadingCategories && categories.length === 0) return

    let cancelled = false

    const applyResolved = (resolvedId: string) => {
      if (cancelled || !resolvedId) return
      setQueryState((prev) => (prev.categoryId === resolvedId ? prev : { ...prev, categoryId: resolvedId }))
      const params = new URLSearchParams(searchParams.toString())
      if (params.has('categoryId')) {
        params.delete('categoryId')
        params.delete('page')
        const qs = params.toString()
        router.replace(qs ? `${pathname}?${qs}` : (pathname || '/'), { scroll: false })
      }
    }

    const fromTree = resolveCategoryIdBySlug(routeCategorySlug)
    if (fromTree) {
      applyResolved(fromTree)
      return () => {
        cancelled = true
      }
    }

    // 导航树未收录（如品牌类/不可见类）时，回源数据库按 slug/id 解析
    resolveCategoryRouteKey({ routeKey: routeCategorySlug })
      .then((res) => {
        if (cancelled) return
        if (!res.categoryId) {
          toast.error('Category not found')
          return
        }
        applyResolved(res.categoryId)
        // 若库中有正式 slug 且当前 URL 段是 id，纠正为 /category/[slug]
        const canonicalSlug = String(res.categorySlug || '').trim()
        if (canonicalSlug && canonicalSlug !== routeCategorySlug) {
          const params = new URLSearchParams(searchParams.toString())
          params.delete('categoryId')
          params.delete('page')
          const qs = params.toString()
          const target = `/category/${encodeURIComponent(canonicalSlug)}`
          router.replace(qs ? `${target}?${qs}` : target, { scroll: false })
        }
      })
      .catch((err: any) => {
        if (!cancelled) toast.error(err?.message || 'Category not found')
      })

    return () => {
      cancelled = true
    }
  }, [
    isCategorySlugRoute,
    isLoadingCategories,
    pathname,
    router,
    routeCategorySlug,
    resolveCategoryIdBySlug,
    searchParams,
  ])

  useEffect(() => {
    if (isStorefrontHomePath) {
      setPromotionConfig(null)
      return
    }
    getCategoryTopPromotion()
      .then((res) => {
        setPromotionConfig(res.promotion)
      })
      .catch(() => {
        setPromotionConfig(null)
      })
  }, [isStorefrontHomePath])

  useEffect(() => {
    if (isStorefrontHomePath || !promotionConfig?.enabled) {
      return
    }
    const timer = window.setInterval(() => {
      setPromotionNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isStorefrontHomePath, promotionConfig?.enabled])

  const selectedParentCategory = useMemo(() => {
    if (!queryState.categoryId) {
      return null
    }

    const directTopLevel = categories.find(cat => cat.category_id === queryState.categoryId)
    if (directTopLevel) {
      return directTopLevel
    }

    return categories.find(cat => cat.children.some(child => child.category_id === queryState.categoryId)) || null
  }, [categories, queryState.categoryId])

  const selectedTopLevelCategoryId = selectedParentCategory?.category_id || ''
  const isSecondaryCategoryResults = currentCategoryLevel === 2

  useEffect(() => {
    if (!queryState.categoryId) {
      setCategoryDetail(null)
      setCurrentCategoryLevel(1)
      setIsBrandExpanded(false)
      return
    }

    const lang = getCurrentLang()
    getCategoryDetail({ category_id: queryState.categoryId, lang })
      .then((res) => {
        setCategoryDetail(res.detail)
        setCurrentCategoryLevel(res.detail?.current_category_level ?? null)
        setIsBrandExpanded(false)
      })
      .catch(() => {
        // Keep previous detail; avoid red toast storm on transient RPC errors
      })
  }, [queryState.categoryId, localeTick])

  const posterTrackKey = useMemo(
    () => posters.map((poster) => poster.poster_id).join('\u0001'),
    [posters],
  )

  useEffect(() => {
    getCategoryPosterList({ category_id: selectedTopLevelCategoryId || undefined })
      .then((res) => {
        const next = Array.isArray(res.list) ? res.list : []
        setPosters((prev) => {
          const sameIds =
            prev.length === next.length &&
            prev.every((poster, index) => poster.poster_id === next[index]?.poster_id)
          if (sameIds) return prev
          queueMicrotask(() => setActiveBannerIndex(0))
          return next
        })
      })
      .catch(() => {
        // Keep SSR/bootstrap posters when the refresh fails (Chrome RPC timeouts).
        setPosters((prev) => (prev.length ? prev : []))
      })
  }, [selectedTopLevelCategoryId])

  useEffect(() => {
    // Home stream does not render keyword floors — skip 4 RPCs on `/`
    if (isStorefrontHomePath) {
      setLeftNavKeywordGroups([])
      setRecommendationKeywordGroups([])
      setLeftNavKeywords([])
      setRecommendationKeywords([])
      setActiveLeftNavGroupId('')
      return
    }

    let cancelled = false
    let idleId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const load = () => {
      if (cancelled) return
      getKeywordGroupList({ scene_area: 'LEFT_NAV' })
        .then((res) => {
          if (cancelled) return
          const groups = Array.isArray(res.list) ? res.list : []
          setLeftNavKeywordGroups(groups)
          setActiveLeftNavGroupId((prev) =>
            prev && groups.some((group) => group.group_id === prev) ? prev : groups[0]?.group_id || '',
          )
        })
        .catch(() => undefined)

      getKeywordGroupList({ scene_area: 'RECOMMENDATION' })
        .then((res) => {
          if (cancelled) return
          const groups = Array.isArray(res.list) ? res.list : []
          setRecommendationKeywordGroups(groups)
          setActiveRecommendationGroupId((prev) =>
            prev && groups.some((group) => group.group_id === prev) ? prev : '',
          )
        })
        .catch(() => undefined)

      getKeywordList({
        scene_area: 'RECOMMENDATION',
        scene_slot_key: 'PRODUCT_CATEGORY_RECOMMENDATION',
      })
        .then((res) => {
          if (cancelled) return
          setRecommendationKeywords(Array.isArray(res.list) ? res.list : [])
        })
        .catch(() => undefined)
    }

    // Defer keyword chrome so category list + products paint first
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(load, { timeout: 2200 })
    } else {
      timeoutId = setTimeout(load, 500)
    }

    return () => {
      cancelled = true
      if (idleId != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isStorefrontHomePath])

  useEffect(() => {
    if (isStorefrontHomePath) return
    getKeywordList({
      scene_area: 'LEFT_NAV',
      group_id: activeLeftNavGroupId || undefined
    })
      .then((res) => {
        setLeftNavKeywords(Array.isArray(res.list) ? res.list : [])
      })
      .catch(() => {
        // optional
      })
  }, [activeLeftNavGroupId, isStorefrontHomePath])

  useEffect(() => {
    // Home brand rail prefers recommend SIDE_NAV; defer category side-nav to idle
    if (!isStorefrontHomePath) {
      const lang = getCurrentLang()
      loadSideNavZonesCached(lang)
        .then((zones) => {
          setSideNavZones(Array.isArray(zones) ? zones : [])
        })
        .catch(() => undefined)
      return
    }

    let cancelled = false
    let idleId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const load = () => {
      if (cancelled) return
      const lang = getCurrentLang()
      loadSideNavZonesCached(lang)
        .then((zones) => {
          if (cancelled) return
          setSideNavZones(Array.isArray(zones) ? zones : [])
        })
        .catch(() => undefined)
    }
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(load, { timeout: 2500 })
    } else {
      timeoutId = setTimeout(load, 600)
    }
    return () => {
      cancelled = true
      if (idleId != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [localeTick, isStorefrontHomePath])

  useEffect(() => {
    const count = posters.length
    if (count <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % count)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [posterTrackKey, posters.length])

  useEffect(() => {
    if (!isMobile) {
      setExpandedTopNavCategoryIds([])
    }
  }, [isMobile])

  useEffect(() => {
    if (isMobile || !hoveredTopCategoryId) {
      return
    }

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (topNavPanelRef.current?.contains(target)) {
        return
      }

      clearTopNavHoverCloseTimer()
      setHoveredTopCategoryId(null)
    }

    document.addEventListener('mousedown', handlePointerDownOutside)
    document.addEventListener('touchstart', handlePointerDownOutside)

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside)
      document.removeEventListener('touchstart', handlePointerDownOutside)
    }
  }, [clearTopNavHoverCloseTimer, hoveredTopCategoryId, isMobile])

  const memoizedStockStatus = useMemo(() => queryState.stockStatus.join(','), [queryState.stockStatus])

  const dailyNewArrivalCategoryId = useMemo(
    () => findDailyNewArrivalCategoryId(categories),
    [categories],
  )

  const isDailyNewArrivalMode = Boolean(
    dailyNewArrivalCategoryId && queryState.categoryId === dailyNewArrivalCategoryId,
  )

  /** Default home has no listing filters — product grid is unused (recommend zones render instead). */
  const hasActiveListingQuery = Boolean(
    queryState.categoryId ||
      queryState.brandCategoryId ||
      queryState.keywordId ||
      queryState.keywordGroupId ||
      queryState.searchKeyword ||
      queryState.minPrice !== undefined ||
      queryState.maxPrice !== undefined ||
      queryState.hasDiscount ||
      queryState.minRating !== undefined ||
      queryState.stockStatus.length > 0,
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
    if (typeof window === 'undefined') return

    const shouldFetchListing =
      isDailyNewArrivalMode ||
      (isCategorySlugRoute && routeCategorySlug) ||
      hasActiveListingQuery

    if (!shouldFetchListing) {
      setProducts([])
      setTotalCount(0)
      setIsLoadingProducts(false)
      return
    }

    const gen = ++productFetchGenRef.current
    if (productsRef.current.length === 0) setIsLoadingProducts(true)

    const lang = getCurrentLang()
    const safety = window.setTimeout(() => {
      if (productFetchGenRef.current !== gen) return
      setIsLoadingProducts(false)
    }, 20000)

    const finish = () => {
      if (productFetchGenRef.current !== gen) return
      window.clearTimeout(safety)
      setIsLoadingProducts(false)
    }

    if (isDailyNewArrivalMode) {
      const dailyMonth = searchParams.get('dailyMonth') || ''
      const [yearText, monthText] = dailyMonth.split('-')
      const parsedYear = Number(yearText)
      const parsedMonth = Number(monthText)
      const hasMonth =
        Boolean(dailyMonth) &&
        Number.isInteger(parsedYear) &&
        Number.isInteger(parsedMonth) &&
        parsedMonth >= 1 &&
        parsedMonth <= 12
      const now = new Date()
      const year = hasMonth ? parsedYear : now.getFullYear()
      const month = hasMonth ? parsedMonth : now.getMonth() + 1

      getDailyNewArrivalProducts({
        year,
        month,
        page: queryState.page,
        page_size: Math.min(60, queryState.pageSize || 60),
        lang,
      })
        .then((res) => {
          if (productFetchGenRef.current !== gen) return
          setProducts(Array.isArray(res.list) ? res.list : [])
          setTotalCount(res.total || 0)
        })
        .catch((err: any) => {
          if (productFetchGenRef.current !== gen) return
          setProducts([])
          setTotalCount(0)
          toast.error(err.message || 'Failed to load new arrivals')
        })
        .finally(finish)

      return () => {
        window.clearTimeout(safety)
      }
    }

    fetchCategoryShelfProducts({
      categoryId: queryState.searchKeyword ? undefined : queryState.categoryId || undefined,
      slug:
        !queryState.searchKeyword && isCategorySlugRoute
          ? routeCategorySlug || undefined
          : undefined,
      search: queryState.searchKeyword || undefined,
      lang,
      page: queryState.page,
      pageSize: Math.min(60, queryState.pageSize || 60),
      minPrice: queryState.minPrice,
      maxPrice: queryState.maxPrice,
      sortBy: queryState.sortBy,
      brandCategoryId: queryState.brandCategoryId || undefined,
    })
      .then(({ list, total }) => {
        if (productFetchGenRef.current !== gen) return
        setProducts(list as ProductItem[])
        setTotalCount(total)
      })
      .catch((err: any) => {
        if (productFetchGenRef.current !== gen) return
        setProducts([])
        setTotalCount(0)
        toast.error(err.message)
      })
      .finally(finish)

    return () => {
      window.clearTimeout(safety)
    }
  }, [isDailyNewArrivalMode, isCategorySlugRoute, routeCategorySlug, hasActiveListingQuery, queryState.categoryId, queryState.brandCategoryId, queryState.keywordId, queryState.keywordGroupId, queryState.searchKeyword, memoizedStockStatus, queryState.sortBy, queryState.page, queryState.pageSize, queryState.minPrice, queryState.maxPrice, queryState.hasDiscount, queryState.minRating, localeTick, searchParams])

  useEffect(() => {
    if (isDailyNewArrivalMode) {
      setAvailableBrandFilters([])
      setIsLoadingBrandFilters(false)
      return
    }

    if (isCategorySlugRoute && routeCategorySlug && !queryState.categoryId) {
      setIsLoadingBrandFilters(true)
      return
    }

    if (!hasActiveListingQuery) {
      setAvailableBrandFilters([])
      setIsLoadingBrandFilters(false)
      return
    }

    setIsLoadingBrandFilters(true)
    const lang = getCurrentLang()
    getAvailableBrandFilters({
      category_id: queryState.categoryId || undefined,
      keyword_id: queryState.keywordId || undefined,
      keyword_group_id: queryState.keywordGroupId || undefined,
      search_keyword: queryState.searchKeyword || undefined,
      stock_status: queryState.stockStatus.length > 0 ? queryState.stockStatus : undefined,
      min_price: queryState.minPrice,
      max_price: queryState.maxPrice,
      has_discount: queryState.hasDiscount,
      min_rating: queryState.minRating,
      lang,
    })
      .then((res) => {
        setAvailableBrandFilters(res.list)
      })
      .catch(() => {
        setAvailableBrandFilters([])
      })
      .finally(() => setIsLoadingBrandFilters(false))
  }, [
    isDailyNewArrivalMode,
    isCategorySlugRoute,
    routeCategorySlug,
    hasActiveListingQuery,
    queryState.categoryId,
    queryState.keywordId,
    queryState.keywordGroupId,
    queryState.searchKeyword,
    memoizedStockStatus,
    queryState.minPrice,
    queryState.maxPrice,
    queryState.hasDiscount,
    queryState.minRating,
    localeTick,
  ])

  const syncListingQueryToUrl = useCallback((patch: {
    sortBy?: SortByEnum
    minPrice?: number | undefined
    maxPrice?: number | undefined
    brandCategoryId?: string
    page?: number
    clearPage?: boolean
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (patch.sortBy !== undefined) {
      if (!patch.sortBy || patch.sortBy === 'NEWEST') {
        params.delete('sortBy')
      } else {
        params.set('sortBy', patch.sortBy)
      }
    }

    if ('minPrice' in patch) {
      if (patch.minPrice === undefined || Number.isNaN(patch.minPrice)) {
        params.delete('minPrice')
      } else {
        params.set('minPrice', String(patch.minPrice))
      }
    }

    if ('maxPrice' in patch) {
      if (patch.maxPrice === undefined || Number.isNaN(patch.maxPrice)) {
        params.delete('maxPrice')
      } else {
        params.set('maxPrice', String(patch.maxPrice))
      }
    }

    if ('brandCategoryId' in patch) {
      if (!patch.brandCategoryId) {
        params.delete('brandCategoryId')
      } else {
        params.set('brandCategoryId', patch.brandCategoryId)
      }
    }

    if (patch.clearPage || (patch.page !== undefined && patch.page <= 1)) {
      params.delete('page')
    } else if (patch.page !== undefined) {
      params.set('page', String(patch.page))
    }

    const qs = params.toString()
    const nextUrl = qs ? `${pathname || '/'}?${qs}` : pathname || '/'
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, searchParams])

  const handleFilterChange = useCallback(<K extends keyof ProductCategoryState['queryState']>(field: K, value: ProductCategoryState['queryState'][K]) => {
    setQueryState((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'categoryId' ? { brandCategoryId: '' } : {}),
      ...(field === 'categoryId' && !value ? { keywordId: '', keywordGroupId: '' } : {}),
      ...(field === 'keywordId' ? { keywordGroupId: '' } : {}),
      page: field === 'page' ? (value as number) : 1
    }))
  }, [])

  const buildCurrentReturnTo = useCallback(() => {
    const query = searchParams.toString()
    const base = pathname || ProductCategory.path
    return `${base}${query ? `?${query}` : ''}`
  }, [pathname, searchParams])

  const handleSelectCategory = useCallback((categoryId: string, options?: { parentCategoryId?: string; categorySlug?: string | null }) => {
    // 点击后立即收起悬浮菜单，避免与商品区刷新抢焦点
    closeTopNavHoverPanel()
    if (isMobile && options?.parentCategoryId) {
      setExpandedTopNavCategoryIds((prev) => prev.includes(options.parentCategoryId!) ? prev : [...prev, options.parentCategoryId!])
    }
    handleFilterChange('categoryId', categoryId)

    if (!categoryId) {
      ProductCategory.navigateToDefault(router)
      return
    }

    const slugFromOption = String(options?.categorySlug || '').trim()
    const slug = slugFromOption || resolveCategorySlugById(categoryId)
    ProductCategory.navigateToCategory(router, { categoryId, categorySlug: slug || null })
  }, [closeTopNavHoverPanel, handleFilterChange, isMobile, resolveCategorySlugById, router])

  const handleSearchProducts = useCallback((keyword: string) => {
    closeTopNavHoverPanel()
    const normalizedKeyword = keyword.trim()

    setQueryState((prev) => ({
      ...prev,
      categoryId: '',
      brandCategoryId: '',
      keywordId: '',
      keywordGroupId: '',
      searchKeyword: normalizedKeyword,
      page: 1,
    }))

    const params = new URLSearchParams(searchParams.toString())
    params.delete('categoryId')
    params.delete('page')
    if (normalizedKeyword) {
      params.set('search', normalizedKeyword)
    } else {
      params.delete('search')
    }

    const qs = params.toString()
    const base = pathname || ProductCategory.path
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false })
    notifyStorefrontUrl()
    if (typeof window !== 'undefined') window.setTimeout(notifyStorefrontUrl, 0)
  }, [closeTopNavHoverPanel, pathname, router, searchParams])

  const handleTopCategoryHoverChange = useCallback((categoryId: string | null) => {
    if (isMobile) {
      return
    }

    clearTopNavHoverCloseTimer()

    // 移出时短暂延迟收起，便于鼠标从一级标签滑入下方下拉菜单
    if (categoryId === null) {
      topNavHoverCloseTimerRef.current = setTimeout(() => {
        setHoveredTopCategoryId(null)
        topNavHoverCloseTimerRef.current = null
      }, 140)
      return
    }

    setHoveredTopCategoryId(categoryId)
  }, [clearTopNavHoverCloseTimer, isMobile])

  const handleToggleDesktopTopNavCategory = useCallback((categoryId: string, options?: { categorySlug?: string | null }) => {
    // 桌面端点击一级：加载该一级旗下全部商品；悬浮下拉仅用于选二级，两者互不冲突
    handleSelectCategory(categoryId, options)
  }, [handleSelectCategory])

  const handleToggleTopNavCategory = useCallback((categoryId: string) => {
    if (!isMobile) {
      return
    }

    const targetCategory = categories.find((item) => item.category_id === categoryId)
    if (!targetCategory) {
      return
    }

    // 「每日上新」无二级时也展开折叠面板（展示月份卡片）
    const canExpandPanel =
      targetCategory.children.length > 0 || isDailyNewArrivalCategoryName(targetCategory.category_name)

    if (!canExpandPanel) {
      handleSelectCategory(categoryId)
      return
    }

    setExpandedTopNavCategoryIds((prev) => prev.includes(categoryId)
      ? prev.filter((id) => id !== categoryId)
      : [...prev, categoryId]
    )
  }, [categories, handleSelectCategory, isMobile])

  const handleNavigateToWishlist = useCallback(() => {
    if (!userSession.token?.trim()) {
      openStorefrontLogin(openAuthModal)
      return
    }
    router.push('/wishlist')
  }, [openAuthModal, router, userSession.token])

  const handleNavigateToCart = useCallback(() => {
    if (!userSession.token?.trim()) {
      openStorefrontLogin(openAuthModal)
      return
    }
    Cart.navigateTo(router)
  }, [openAuthModal, router, userSession.token])

  const handleNavigateToLogin = useCallback(() => {
    openStorefrontLogin(openAuthModal)
  }, [openAuthModal])

  const handleNavigateToRegister = useCallback(() => {
    openStorefrontRegister()
  }, [])

  const handleToggleUserMenu = useCallback(() => {
    if (!userSession.token?.trim()) {
      handleNavigateToLogin()
      return
    }
    setIsUserMenuOpen(prev => !prev)
  }, [handleNavigateToLogin, userSession.token])

  const handleNavigateToAccountCenter = useCallback(() => {
    if (!userSession.token?.trim()) {
      handleNavigateToLogin()
      return
    }
    router.push('/account/profile')
    setIsUserMenuOpen(false)
  }, [handleNavigateToLogin, router, userSession.token])

  const handleNavigateToOrderCenter = useCallback(() => {
    if (!userSession.token?.trim()) {
      handleNavigateToLogin()
      return
    }
    router.push('/account/orders')
    setIsUserMenuOpen(false)
  }, [handleNavigateToLogin, router, userSession.token])

  const handleLogout = useCallback(() => {
    useUserSession.getState().reset()
    setIsUserMenuOpen(false)
    toast.success('Signed out')
  }, [])

  const handleNavigateBackHome = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    Home.navigateTo(router)
  }, [router])

  const handleBannerChange = useCallback((nextIndex: number) => {
    if (!posters.length) {
      return
    }

    const normalizedIndex = (nextIndex + posters.length) % posters.length
    setActiveBannerIndex(normalizedIndex)
  }, [posters.length])

  const handleBannerClick = useCallback((banner: ProductCategoryBannerItem) => {
    const target = normalizePosterLinkUrl(banner.link_url)
    if (!target) {
      return
    }

    if (target.startsWith('/')) {
      // Chrome Android may intercept SPA navigation on full-tap overlays.
      // Use native navigation for consistency with other browsers.
      if (typeof window !== 'undefined') {
        window.location.assign(target)
      } else {
        router.push(target)
      }
      return
    }

    if (typeof window !== 'undefined') {
      if (isAbsoluteHttpUrl(target)) {
        window.location.href = target
        return
      }
      router.push(target)
    }
  }, [router])

  const handleSelectKeyword = useCallback((item: ProductCategoryKeywordItem) => {
    const nextCategoryId = item.category_id || item.linked_category_ids[0] || ''

    setHoveredTopCategoryId(null)
    setQueryState((prev) => ({
      ...prev,
      categoryId: nextCategoryId,
      brandCategoryId: '',
      keywordId: item.keyword_id,
      keywordGroupId: '',
      page: 1
    }))

    if (!nextCategoryId) {
      ProductCategory.navigateToDefault(router)
      return
    }
    const slug = resolveCategorySlugById(nextCategoryId)
    ProductCategory.navigateToCategory(router, { categoryId: nextCategoryId, categorySlug: slug || null })
  }, [resolveCategorySlugById, router])

  const handleSelectLeftNavGroup = useCallback((groupId: string) => {
    setActiveLeftNavGroupId(groupId)
  }, [])

  const handleSelectRecommendationGroup = useCallback((groupId: string) => {
    setActiveRecommendationGroupId(groupId)
    setQueryState((prev) => ({
      ...prev,
      keywordGroupId: prev.keywordGroupId === groupId ? '' : groupId,
      keywordId: '',
      page: 1
    }))
  }, [])

  const handleClearAllFilters = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      categoryId: '',
      brandCategoryId: '',
      keywordId: '',
      keywordGroupId: '',
      stockStatus: [],
      sortBy: 'NEWEST',
      page: 1,
      minPrice: undefined,
      maxPrice: undefined,
      hasDiscount: false,
      minRating: undefined
    }))
    setPriceInput({ min: '', max: '' })
    setIsBrandExpanded(false)
    syncListingQueryToUrl({
      sortBy: 'NEWEST',
      minPrice: undefined,
      maxPrice: undefined,
      brandCategoryId: '',
      clearPage: true,
    })
  }, [syncListingQueryToUrl])

  const handlePriceInputChange = (field: 'min' | 'max', value: string) => {
    setPriceInput((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyPriceRange = () => {
    const minVal = parseFloat(priceInput.min)
    const maxVal = parseFloat(priceInput.max)
    const nextMin = isNaN(minVal) ? undefined : minVal
    const nextMax = isNaN(maxVal) ? undefined : maxVal
    setQueryState((prev) => ({
      ...prev,
      page: 1,
      minPrice: nextMin,
      maxPrice: nextMax
    }))
    syncListingQueryToUrl({ minPrice: nextMin, maxPrice: nextMax, clearPage: true })
  }

  const handlePriceRangeChange = useCallback((min: number | undefined, max: number | undefined) => {
    setQueryState((prev) => {
      if (prev.minPrice === min && prev.maxPrice === max) {
        return prev
      }
      return {
        ...prev,
        page: 1,
        minPrice: min,
        maxPrice: max,
      }
    })
    setPriceInput({
      min: min === undefined ? '' : String(min),
      max: max === undefined ? '' : String(max),
    })
    syncListingQueryToUrl({ minPrice: min, maxPrice: max, clearPage: true })
  }, [syncListingQueryToUrl])

  const handleSortChange = useCallback((sortBy: SortByEnum) => {
    setQueryState((prev) => {
      if (prev.sortBy === sortBy) {
        return prev
      }
      return {
        ...prev,
        sortBy,
        page: 1,
      }
    })
    syncListingQueryToUrl({ sortBy, clearPage: true })
  }, [syncListingQueryToUrl])

  const handleStockStatusToggle = (status: StockStatusEnum, checked: boolean) => {
    if (status === 'OUT_OF_STOCK') {
      return
    }

    const current = queryState.stockStatus.filter(item => item !== 'OUT_OF_STOCK')
    if (checked) {
      handleFilterChange('stockStatus', [...current, status])
    } else {
      handleFilterChange('stockStatus', current.filter((s) => s !== status))
    }
  }

  const handleRatingChange = (val: string) => {
    handleFilterChange('minRating', val === 'ALL' ? undefined : parseInt(val, 10))
  }

  const handleToggleCategoryChildren = useCallback((categoryId: string) => {
    const category = categories.find(item => item.category_id === categoryId)
    if (!category || !category.display_config.allowChildrenCollapse || category.children.length === 0) {
      return
    }

    setExpandedCategoryIds((prev) => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId])
  }, [categories])

  const handleToggleBrandExpand = useCallback(() => {
    setIsBrandExpanded(prev => !prev)
  }, [])

  const handleBrandQuickFilterToggle = useCallback((brandId: string) => {
    let nextBrandCategoryId = ''
    setQueryState((prev) => {
      nextBrandCategoryId = prev.brandCategoryId === brandId ? '' : brandId
      return {
        ...prev,
        brandCategoryId: nextBrandCategoryId,
        page: 1,
      }
    })
    syncListingQueryToUrl({ brandCategoryId: nextBrandCategoryId, clearPage: true })
  }, [syncListingQueryToUrl])

  const visibleBrandOptions = useMemo(() => {
    const options = selectedParentCategory?.brand_options || []
    const collapsedRows = selectedParentCategory?.display_config.brandFilterCollapsedRows || 3
    const maxVisibleCount = collapsedRows * 4
    return isBrandExpanded ? options : options.slice(0, maxVisibleCount)
  }, [isBrandExpanded, selectedParentCategory])

  const hasMoreBrandOptions = useMemo(() => {
    const options = selectedParentCategory?.brand_options || []
    const collapsedRows = selectedParentCategory?.display_config.brandFilterCollapsedRows || 3
    return options.length > collapsedRows * 4
  }, [selectedParentCategory])

  const recommendationFloors = useMemo<ProductCategoryRecommendationFloor[]>(() => {
    return recommendationKeywordGroups
      .map((group) => ({
        group_id: group.group_id,
        group_name: group.group_name,
        scene_slot_key: group.scene_slot_key,
        keywords: recommendationKeywords
          .filter((item) => item.group_id === group.group_id)
          .sort((a, b) => b.sort_weight - a.sort_weight || a.keyword_label.localeCompare(b.keyword_label, 'zh-CN'))
      }))
      .filter((group) => group.keywords.length > 0)
      .sort((a, b) => {
        const groupA = recommendationKeywordGroups.find((item) => item.group_id === a.group_id)
        const groupB = recommendationKeywordGroups.find((item) => item.group_id === b.group_id)
        const homepageWeightDiff = (groupB?.homepage_sort_weight || 0) - (groupA?.homepage_sort_weight || 0)
        if (homepageWeightDiff !== 0) {
          return homepageWeightDiff
        }
        return (groupB?.sort_weight || 0) - (groupA?.sort_weight || 0)
      })
  }, [recommendationKeywordGroups, recommendationKeywords])

  const promotionBanner = useMemo<ProductCategoryPromotionBanner | null>(() => {
    if (!promotionConfig?.enabled) {
      return null
    }

    const colors = {
      background: promotionConfig.background_color || DEFAULT_PROMOTION_COLORS.background,
      text: promotionConfig.text_color || DEFAULT_PROMOTION_COLORS.text
    }

    const endTimeMs = promotionConfig.end_time ? new Date(promotionConfig.end_time).getTime() : null
    const hasValidEndTime = typeof endTimeMs === 'number' && !Number.isNaN(endTimeMs)

    if (!hasValidEndTime) {
      return {
        message: promotionConfig.message,
        isActive: true,
        isEnded: false,
        countdown: EMPTY_COUNTDOWN_PARTS,
        colors
      }
    }

    const remainingMs = Math.max(0, endTimeMs - promotionNow)
    const totalSeconds = Math.floor(remainingMs / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const isEnded = totalSeconds <= 0

    return {
      message: isEnded ? '活动已结束' : promotionConfig.message,
      isActive: !isEnded,
      isEnded,
      countdown: {
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      },
      colors
    }
  }, [promotionConfig, promotionNow])

  const handleAddToCart = async (item: ProductCardItem) => {
    if (!userSession.token?.trim()) {
      openStorefrontLogin(openAuthModal)
      return
    }

    const skuId = String(item.first_sku_id || '').trim()
    if (!skuId || item.sku_count > 1) {
      ProductDetail.navigateToById(router, { productId: item.product_id })
      return
    }

    if (item.stock_status === 'OUT_OF_STOCK') {
      toast.error('This product is unavailable')
      return
    }

    try {
      await addToCart({
        product_id: item.product_id,
        product_sku_id: item.first_sku_id,
        quantity: 1
      })
      toast.success('Added to cart')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAddToWishlist = useCallback((item: ProductCardItem, favorited?: boolean) => {
    // 收藏状态由 WishlistHeartButton + localStorage 管理；此处仅做反馈
    if (typeof favorited === 'boolean') {
      toast.success(favorited ? `Saved: ${item.product_name}` : `Removed: ${item.product_name}`)
      return
    }
    toast.success(`Saved: ${item.product_name}`)
  }, [])

  const handleNavigateToDetail = (productId: string) => {
    ProductDetail.navigateToById(router, { productId })
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / queryState.pageSize))

  const userDisplayName = username?.trim() || 'My account'
  const avatarText = userDisplayName.slice(0, 1).toUpperCase() || 'U'
  const isCustomerLoggedIn = Boolean(userSession.token?.trim())

  return {
    state: {
      userSession: {
        isLoggedIn: isCustomerLoggedIn,
        username: userDisplayName,
        avatarText
      },
      topNavPanelRef,
      cartBadgeCount,
      isUserMenuOpen,
      hoveredTopCategoryId,
      expandedTopNavCategoryIds,
      queryState,
      priceInput,
      categories,
      selectedParentCategory,
      visibleBrandOptions,
      availableBrandFilters,
      hasMoreBrandOptions,
      isBrandExpanded,
      isLoadingBrandFilters,
      expandedCategoryIds,
      categoryDetail,
    currentCategoryLevel,
    posters,
    sideNavZones,
    leftNavKeywordGroups,
    recommendationKeywordGroups,
      activeLeftNavGroupId,
      activeRecommendationGroupId,
      leftNavKeywords,
      recommendationKeywords,
      recommendationFloors,
      activeBannerIndex,
      promotionBanner,
      products,
      isSecondaryCategoryResults,
      totalCount,
      isLoadingCategories,
      isLoadingProducts,
      isResolvingCategoryRoute: Boolean(isCategorySlugRoute && routeCategorySlug && !queryState.categoryId),
      routeCategorySlug,
      totalPages,
      stockStatusLabels: STOCK_STATUS_LABELS,
      sortByLabels: SORT_BY_LABELS,
      dailyNewArrivalCategoryId,
      isDailyNewArrivalMode,
    },
    handlers: {
      handleFilterChange,
      handleSelectCategory,
      handleTopCategoryHoverChange,
      handleToggleDesktopTopNavCategory,
      handleToggleTopNavCategory,
      handleNavigateToWishlist,
      handleNavigateToCart,
      handleNavigateToLogin,
      handleNavigateToRegister,
      handleToggleUserMenu,
      handleNavigateToAccountCenter,
      handleNavigateToOrderCenter,
      handleLogout,
      handleNavigateBackHome,
      handleBannerChange,
      handleBannerClick,
      handleSelectKeyword,
      handleSearchProducts,
      handleSelectLeftNavGroup,
      handleSelectRecommendationGroup,
      handleClearAllFilters,
      handlePriceInputChange,
      handleApplyPriceRange,
      handlePriceRangeChange,
      handleSortChange,
      handleStockStatusToggle,
      handleRatingChange,
      handleAddToCart,
      handleAddToWishlist,
      handleNavigateToDetail,
      handleToggleCategoryChildren,
      handleToggleBrandExpand,
      handleBrandQuickFilterToggle,
    }
  }
}
