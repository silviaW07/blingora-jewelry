'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Home, ProductCategory, ProductDetail, CustomerLogin, CustomerRegister, Cart } from '@/frontend/route-params'
import { useUserSession, UserSession } from '@/tools/FrontendSession'
import type {
  StockStatusEnum,
  SortByEnum,
  CategoryDetail,
  ProductItem
} from '@/frontend/actions/ProductCategory'
import {
  getCategoryList,
  getCategoryDetail,
  getCategoryPosterList,
  getKeywordGroupList,
  getKeywordList,
  getProductList,
  addToCart,
  getCategoryTopPromotion
} from '@/frontend/actions/ProductCategory'

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
  IN_STOCK: '现货',
  LOW_STOCK: '备货中',
  OUT_OF_STOCK: '暂不可购'
}

const SORT_BY_LABELS: Record<SortByEnum, string> = {
  NEWEST: '上新时间 (Newest)',
  PRICE_ASC: '价格升序 (Price: Low to High)',
  PRICE_DESC: '价格降序 (Price: High to Low)',
  POPULARITY: '热度排序 (Popularity)'
}

const KEYWORD_GROUP_LIMIT = 16

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
  sort_weight: number
}

export type ProductCategoryKeywordItem = {
  keyword_id: string
  keyword_label: string
  category_id: string | null
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

export interface ProductCategoryState {
  userSession: {
    isLoggedIn: boolean
    username: string
    avatarText: string
  }
  cartBadgeCount: number
  isUserMenuOpen: boolean
  queryState: {
    categoryId: string
    brandCategoryId: string
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
  hasMoreBrandOptions: boolean
  isBrandExpanded: boolean
  expandedCategoryIds: string[]
  categoryDetail: CategoryDetail | null
  posters: ProductCategoryBannerItem[]
  leftNavKeywordGroups: ProductCategoryKeywordGroup[]
  recommendationKeywordGroups: ProductCategoryKeywordGroup[]
  activeLeftNavGroupId: string
  activeRecommendationGroupId: string
  leftNavKeywords: ProductCategoryKeywordItem[]
  recommendationKeywords: ProductCategoryKeywordItem[]
  visibleRecommendationKeywords: ProductCategoryKeywordItem[]
  hasMoreRecommendationKeywords: boolean
  isRecommendationExpanded: boolean
  activeBannerIndex: number
  promotionBanner: ProductCategoryPromotionBanner | null
  products: ProductCardItem[]
  totalCount: number
  isLoadingCategories: boolean
  isLoadingProducts: boolean
  totalPages: number
  stockStatusLabels: Record<StockStatusEnum, string>
  sortByLabels: Record<SortByEnum, string>
}

export interface ProductCategoryHandlers {
  handleFilterChange: <K extends keyof ProductCategoryState['queryState']>(field: K, value: ProductCategoryState['queryState'][K]) => void
  handleSelectCategory: (categoryId: string) => void
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
  handleSelectLeftNavGroup: (groupId: string) => void
  handleSelectRecommendationGroup: (groupId: string) => void
  handleToggleRecommendationExpand: () => void
  handleClearAllFilters: () => void
  handlePriceInputChange: (field: 'min' | 'max', value: string) => void
  handleApplyPriceRange: () => void
  handleStockStatusToggle: (status: StockStatusEnum, checked: boolean) => void
  handleRatingChange: (val: string) => void
  handleAddToCart: (item: ProductCardItem) => Promise<void>
  handleNavigateToDetail: (productId: string) => void
  handleToggleCategoryChildren: (categoryId: string) => void
  handleToggleBrandExpand: () => void
}

export const useProductCategory = (): {
  state: ProductCategoryState
  handlers: ProductCategoryHandlers
} => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeParams = useMemo(() => ProductCategory.getParams(searchParams), [searchParams])
  const userSession = useUserSession() as UserSession
  const { role, username } = userSession

  const [queryState, setQueryState] = useState({
    categoryId: routeParams.categoryId || '',
    brandCategoryId: '',
    stockStatus: (routeParams.stockStatus ? routeParams.stockStatus.split(',').filter(Boolean) : []).filter((status): status is StockStatusEnum => status === 'IN_STOCK' || status === 'LOW_STOCK') as StockStatusEnum[],
    sortBy: (routeParams.sortBy as SortByEnum) || 'NEWEST',
    page: routeParams.page ? parseInt(routeParams.page) : 1,
    pageSize: 24,
    minPrice: routeParams.minPrice ? parseFloat(routeParams.minPrice) : undefined,
    maxPrice: routeParams.maxPrice ? parseFloat(routeParams.maxPrice) : undefined,
    hasDiscount: false,
    minRating: undefined as number | undefined
  })
  const [priceInput, setPriceInput] = useState({
    min: routeParams.minPrice || '',
    max: routeParams.maxPrice || ''
  })
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [categoryDetail, setCategoryDetail] = useState<CategoryDetail | null>(null)
  const [posters, setPosters] = useState<CategoryPosterItem[]>([])
  const [leftNavKeywordGroups, setLeftNavKeywordGroups] = useState<ProductCategoryKeywordGroup[]>([])
  const [recommendationKeywordGroups, setRecommendationKeywordGroups] = useState<ProductCategoryKeywordGroup[]>([])
  const [activeLeftNavGroupId, setActiveLeftNavGroupId] = useState('')
  const [activeRecommendationGroupId, setActiveRecommendationGroupId] = useState('')
  const [leftNavKeywords, setLeftNavKeywords] = useState<ProductCategoryKeywordItem[]>([])
  const [recommendationKeywords, setRecommendationKeywords] = useState<ProductCategoryKeywordItem[]>([])
  const [products, setProducts] = useState<ProductCardItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([])
  const [isBrandExpanded, setIsBrandExpanded] = useState(false)
  const [isRecommendationExpanded, setIsRecommendationExpanded] = useState(false)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [promotionConfig, setPromotionConfig] = useState<PromotionConfig | null>(null)
  const [promotionNow, setPromotionNow] = useState(() => Date.now())
  const [cartBadgeCount] = useState(0)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    setIsLoadingCategories(true)
    getCategoryList()
      .then((res) => {
        setCategories(res.list)
        setExpandedCategoryIds(res.list.filter(category => category.display_config.showChildrenByDefault).map(category => category.category_id))
      })
      .catch((err: any) => toast.error(err.message))
      .finally(() => setIsLoadingCategories(false))
  }, [])

  useEffect(() => {
    getCategoryTopPromotion()
      .then((res) => {
        setPromotionConfig(res.promotion)
      })
      .catch(() => {
        setPromotionConfig(null)
      })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPromotionNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

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

  useEffect(() => {
    if (!queryState.categoryId) {
      setCategoryDetail(null)
      setIsBrandExpanded(false)
      return
    }

    getCategoryDetail({ category_id: queryState.categoryId })
      .then((res) => {
        setCategoryDetail(res.detail)
        setIsBrandExpanded(false)
      })
      .catch((err: any) => toast.error(err.message))
  }, [queryState.categoryId])

  useEffect(() => {
    getCategoryPosterList({ category_id: selectedTopLevelCategoryId || undefined })
      .then((res) => {
        setPosters(res.list)
        setActiveBannerIndex(0)
      })
      .catch((err: any) => toast.error(err.message))
  }, [selectedTopLevelCategoryId])

  useEffect(() => {
    getKeywordGroupList({ scene_area: 'LEFT_NAV' })
      .then((res) => {
        const groups = Array.isArray(res.list) ? res.list : []
        setLeftNavKeywordGroups(groups)
        setActiveLeftNavGroupId((prev) => prev && groups.some((group) => group.group_id === prev) ? prev : groups[0]?.group_id || '')
      })
      .catch((err: any) => {
        setLeftNavKeywordGroups([])
        setActiveLeftNavGroupId('')
        toast.error(err.message)
      })
  }, [])

  useEffect(() => {
    getKeywordGroupList({ scene_area: 'RECOMMENDATION' })
      .then((res) => {
        const groups = Array.isArray(res.list) ? res.list : []
        setRecommendationKeywordGroups(groups)
        setActiveRecommendationGroupId((prev) => prev && groups.some((group) => group.group_id === prev) ? prev : groups[0]?.group_id || '')
      })
      .catch((err: any) => {
        setRecommendationKeywordGroups([])
        setActiveRecommendationGroupId('')
        toast.error(err.message)
      })
  }, [])

  useEffect(() => {
    getKeywordList({
      scene_area: 'LEFT_NAV',
      group_id: activeLeftNavGroupId || undefined
    })
      .then((res) => {
        setLeftNavKeywords(Array.isArray(res.list) ? res.list : [])
      })
      .catch((err: any) => {
        setLeftNavKeywords([])
        toast.error(err.message)
      })
  }, [activeLeftNavGroupId])

  useEffect(() => {
    getKeywordList({
      scene_area: 'RECOMMENDATION',
      group_id: activeRecommendationGroupId || undefined
    })
      .then((res) => {
        setRecommendationKeywords(Array.isArray(res.list) ? res.list : [])
        setIsRecommendationExpanded(false)
      })
      .catch((err: any) => {
        setRecommendationKeywords([])
        toast.error(err.message)
      })
  }, [activeRecommendationGroupId])

  useEffect(() => {
    if (posters.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % posters.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [posters])

  const memoizedStockStatus = useMemo(() => queryState.stockStatus.join(','), [queryState.stockStatus])

  useEffect(() => {
    setIsLoadingProducts(true)
    getProductList({
      category_id: queryState.categoryId || undefined,
      brand_category_id: queryState.brandCategoryId || undefined,
      stock_status: queryState.stockStatus.length > 0 ? queryState.stockStatus : undefined,
      sort_by: queryState.sortBy,
      page: queryState.page,
      page_size: queryState.pageSize,
      min_price: queryState.minPrice,
      max_price: queryState.maxPrice,
      has_discount: queryState.hasDiscount,
      min_rating: queryState.minRating
    })
      .then((res) => {
        setProducts(res.list)
        setTotalCount(res.total)
      })
      .catch((err: any) => toast.error(err.message))
      .finally(() => setIsLoadingProducts(false))
  }, [queryState.categoryId, queryState.brandCategoryId, memoizedStockStatus, queryState.sortBy, queryState.page, queryState.pageSize, queryState.minPrice, queryState.maxPrice, queryState.hasDiscount, queryState.minRating])

  const handleFilterChange = useCallback(<K extends keyof ProductCategoryState['queryState']>(field: K, value: ProductCategoryState['queryState'][K]) => {
    setQueryState((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'categoryId' ? { brandCategoryId: '' } : {}),
      page: field === 'page' ? (value as number) : 1
    }))
  }, [])

  const buildCurrentReturnTo = useCallback(() => {
    const query = searchParams.toString()
    return `${ProductCategory.path}${query ? `?${query}` : ''}`
  }, [searchParams])

  const handleSelectCategory = useCallback((categoryId: string) => {
    handleFilterChange('categoryId', categoryId)
  }, [handleFilterChange])

  const handleNavigateToWishlist = useCallback(() => {
    const returnTo = buildCurrentReturnTo()
    if (role !== 'CUSTOMER') {
      CustomerLogin.navigateToWithReturn(router, { returnTo })
      return
    }
    router.push('/wishlist')
  }, [buildCurrentReturnTo, role, router])

  const handleNavigateToCart = useCallback(() => {
    const returnTo = buildCurrentReturnTo()
    if (role !== 'CUSTOMER') {
      CustomerLogin.navigateToWithReturn(router, { returnTo })
      return
    }
    Cart.navigateTo(router)
  }, [buildCurrentReturnTo, role, router])

  const handleNavigateToLogin = useCallback(() => {
    CustomerLogin.navigateToWithReturn(router, { returnTo: buildCurrentReturnTo() })
  }, [buildCurrentReturnTo, router])

  const handleNavigateToRegister = useCallback(() => {
    CustomerRegister.navigateToWithReturn(router, { returnTo: buildCurrentReturnTo() })
  }, [buildCurrentReturnTo, router])

  const handleToggleUserMenu = useCallback(() => {
    if (role !== 'CUSTOMER') {
      handleNavigateToLogin()
      return
    }
    setIsUserMenuOpen(prev => !prev)
  }, [handleNavigateToLogin, role])

  const handleNavigateToAccountCenter = useCallback(() => {
    if (role !== 'CUSTOMER') {
      handleNavigateToLogin()
      return
    }
    router.push('/accountcenter')
    setIsUserMenuOpen(false)
  }, [handleNavigateToLogin, role, router])

  const handleNavigateToOrderCenter = useCallback(() => {
    if (role !== 'CUSTOMER') {
      handleNavigateToLogin()
      return
    }
    router.push('/ordercenter')
    setIsUserMenuOpen(false)
  }, [handleNavigateToLogin, role, router])

  const handleLogout = useCallback(() => {
    useUserSession.setState({ token: '', user_id: '', username: '', role: 'CUSTOMER' })
    setIsUserMenuOpen(false)
    toast.success('已退出登录')
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
    if (!banner.link_url) {
      return
    }

    if (banner.link_url.startsWith('/')) {
      router.push(banner.link_url)
      return
    }

    if (typeof window !== 'undefined') {
      window.open(banner.link_url, '_self', 'noopener,noreferrer')
    }
  }, [router])

  const handleSelectKeyword = useCallback((item: ProductCategoryKeywordItem) => {
    if (!item.category_id) {
      return
    }

    handleSelectCategory(item.category_id)
  }, [handleSelectCategory])

  const handleSelectLeftNavGroup = useCallback((groupId: string) => {
    setActiveLeftNavGroupId(groupId)
  }, [])

  const handleSelectRecommendationGroup = useCallback((groupId: string) => {
    setActiveRecommendationGroupId(groupId)
  }, [])

  const handleToggleRecommendationExpand = useCallback(() => {
    setIsRecommendationExpanded(prev => !prev)
  }, [])

  const handleClearAllFilters = useCallback(() => {
    setQueryState((prev) => ({
      ...prev,
      categoryId: '',
      brandCategoryId: '',
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
  }, [])

  const handlePriceInputChange = (field: 'min' | 'max', value: string) => {
    setPriceInput((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyPriceRange = () => {
    const minVal = parseFloat(priceInput.min)
    const maxVal = parseFloat(priceInput.max)
    setQueryState((prev) => ({
      ...prev,
      page: 1,
      minPrice: isNaN(minVal) ? undefined : minVal,
      maxPrice: isNaN(maxVal) ? undefined : maxVal
    }))
  }

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

  const visibleRecommendationKeywords = useMemo(() => {
    return isRecommendationExpanded ? recommendationKeywords : recommendationKeywords.slice(0, KEYWORD_GROUP_LIMIT)
  }, [recommendationKeywords, isRecommendationExpanded])

  const hasMoreRecommendationKeywords = useMemo(() => {
    return recommendationKeywords.length > KEYWORD_GROUP_LIMIT
  }, [recommendationKeywords])

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
    if (role !== 'CUSTOMER') {
      CustomerLogin.navigateToWithReturn(router, {
        returnTo: `${ProductCategory.path}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      })
      return
    }

    if (item.sku_count > 1) {
      ProductDetail.navigateToById(router, { productId: item.product_id })
      return
    }

    if (item.stock_status === 'OUT_OF_STOCK') {
      toast.error('该商品暂不可购')
      return
    }

    try {
      await addToCart({
        product_id: item.product_id,
        product_sku_id: item.first_sku_id,
        quantity: 1
      })
      toast.success('已成功加入购物车')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleNavigateToDetail = (productId: string) => {
    ProductDetail.navigateToById(router, { productId })
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / queryState.pageSize))

  const userDisplayName = username?.trim() || '我的账户'
  const avatarText = userDisplayName.slice(0, 1).toUpperCase() || 'U'

  return {
    state: {
      userSession: {
        isLoggedIn: role === 'CUSTOMER' && Boolean(userSession.token),
        username: userDisplayName,
        avatarText
      },
      cartBadgeCount,
      isUserMenuOpen,
      queryState,
      priceInput,
      categories,
      selectedParentCategory,
      visibleBrandOptions,
      hasMoreBrandOptions,
      isBrandExpanded,
      expandedCategoryIds,
      categoryDetail,
      posters,
      leftNavKeywordGroups,
      recommendationKeywordGroups,
      activeLeftNavGroupId,
      activeRecommendationGroupId,
      leftNavKeywords,
      recommendationKeywords,
      visibleRecommendationKeywords,
      hasMoreRecommendationKeywords,
      isRecommendationExpanded,
      activeBannerIndex,
      promotionBanner,
      products,
      totalCount,
      isLoadingCategories,
      isLoadingProducts,
      totalPages,
      stockStatusLabels: STOCK_STATUS_LABELS,
      sortByLabels: SORT_BY_LABELS
    },
    handlers: {
      handleFilterChange,
      handleSelectCategory,
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
      handleSelectLeftNavGroup,
      handleSelectRecommendationGroup,
      handleToggleRecommendationExpand,
      handleClearAllFilters,
      handlePriceInputChange,
      handleApplyPriceRange,
      handleStockStatusToggle,
      handleRatingChange,
      handleAddToCart,
      handleNavigateToDetail,
      handleToggleCategoryChildren,
      handleToggleBrandExpand
    }
  }
}
