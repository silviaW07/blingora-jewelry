'use server'

import prisma from '@/tools/prisma'
import { Prisma, keywordgrouptype } from '../../../prisma-generated/client'
import {
  requireRole,
  withResult,
  UserRole,
} from '@/backend/action_utils'
import { canEditCategoryPriceCoefficient, isAggregatePricingCategoryName } from '@/shared/categoryPricing'
import { DEFAULT_PRICE_COEFFICIENT } from '@/shared/priceCoefficient'
import {
  normalizeOptionalSlug,
  resolveCategorySlug as resolveCategorySlugShared,
} from '@/shared/categorySlug'
import { invalidateHomeRecommendZoneCache } from '@/backend/actions/homeRecommendZoneCache'

export type CategoryStatus = 'ACTIVE' | 'INACTIVE'
export type CategoryLevel = 1 | 2
export type CategoryKind = 'MAIN' | 'BRAND'
export type KeywordGroupType = 'BRAND' | 'NEW_ARRIVAL' | 'PROMOTION' | 'GENERAL'
export type KeywordSceneArea = 'LEFT_NAV' | 'RECOMMENDATION' | 'BOTH'

export interface CategoryOption {
  category_id: string
  category_name: string
  level: CategoryLevel
  parent_id: string | null
  category_kind: CategoryKind
}

export type PosterAspectPreset = 'CROSS_BORDER_HERO' | 'WIDE_BANNER' | 'SQUARE'

export interface HomepagePosterItem {
  id: string
  title: string
  image_url: string
  link: string | null
  sort_weight: number
  is_active: boolean
  aspect_preset: PosterAspectPreset
}

export interface HomepagePosterConfig {
  category_id: string
  items: HomepagePosterItem[]
}

export interface CategoryRecommendedKeywordItem {
  keyword_group_id: string
  keyword_group_name: string
  keyword_group_slug: string | null
  group_type: KeywordGroupType
  scene_area: KeywordSceneArea
  scene_key: string | null
  sort_weight: number
  is_active: boolean
  linked_category_count: number
  keyword_count: number
}

export interface CategoryNavConfigItem {
  nav_config_id: string
  category_id: string
  category_name: string
  category_slug: string | null
  display_title: string
  sort_weight: number
  is_visible: boolean
  badge_text: string | null
}

export interface CategoryDisplayConfig {
  showChildrenByDefault: boolean
  allowChildrenCollapse: boolean
  showBrandFilter: boolean
  brandFilterCollapsedRows: number
}
const DEFAULT_BRAND_DISPLAY_CONFIG: CategoryDisplayConfig = {
  showChildrenByDefault: true,
  allowChildrenCollapse: false,
  showBrandFilter: true,
  brandFilterCollapsedRows: 2,
}

const DEFAULT_CATEGORY_TOP_PROMOTION_CONFIG: CategoryTopPromotionConfig = {
  enabled: false,
  message: "",
  end_time: null,
  background_color: "#000000",
  text_color: "#ffffff"
}

const KEYWORD_GROUP_TYPE_LABELS: Record<KeywordGroupType, string> = {
  BRAND: '品牌',
  NEW_ARRIVAL: '新品',
  PROMOTION: '促销',
  GENERAL: '通用'
}


export interface CategoryPreviewProduct {
  product_id: string
  product_name: string
}

export interface CategoryKeywordLinkItem {
  link_id: string
  keyword_group_id: string
  keyword_group_name: string
  keyword_group_type: KeywordGroupType
  keyword_scene_area: KeywordSceneArea
  keyword_item_id: string | null
  keyword_text: string | null
  parent_keyword_id: string | null
  parent_keyword_text: string | null
  apply_to_homepage: boolean
  sort_weight: number
}

export interface CategoryItem {
  category_id: string
  category_name: string
  category_slug: string | null
  parent_id: string | null
  parent_name: string | null
  /** L1 parent stored coefficient; used as inherit hint when L2 price_coefficient is null */
  parent_price_coefficient: number | null
  level: CategoryLevel
  image_url: string | null
  banner_image_url: string | null
  description: string | null
  sort_weight: number
  status: CategoryStatus
  category_kind: CategoryKind
  is_brand_category: boolean
  brand_keywords: string[]
  price_coefficient: number | null
  category_display_config: CategoryDisplayConfig
  can_configure_poster: boolean
  product_count: number
  child_count: number
  descendant_product_count: number
  descendant_product_preview: CategoryPreviewProduct[]
  keyword_link_count: number
  homepage_keyword_link_count: number
  keyword_links: CategoryKeywordLinkItem[]
  nav_config: CategoryNavConfigItem | null
  created_at: string
  updated_at: string
}

export interface KeywordItemNode {
  keyword_item_id: string
  keyword: string
  normalized_keyword: string | null
  parent_keyword_id: string | null
  sort_weight: number
  is_active: boolean
  child_count: number
  children: KeywordItemNode[]
}

export interface KeywordGroupBoundProductSummary {
  product_id: string
  product_name: string
  product_slug: string | null
  sku_code: string | null
  image_url: string | null
  price: number | null
  created_at: string
  sort_weight: number
}

export interface KeywordGroupSummary {
  keyword_group_id: string
  name: string
  slug: string | null
  group_type: KeywordGroupType
  scene_area: KeywordSceneArea
  scene_key: string | null
  scene_type: string | null
  scene_slot_key: string | null
  scene_slot_name: string | null
  parent_group_id: string | null
  sort_weight: number
  is_active: boolean
  description: string | null
  floor_title: string | null
  floor_icon: string | null
  floor_link: string | null
  homepage_sort_weight: number
  show_on_homepage: boolean
  keyword_count: number
  linked_category_count: number
  homepage_link_count: number
  linked_product_count: number
  linked_products: KeywordGroupBoundProductSummary[]
  keywords: KeywordItemNode[]
}

export interface FrontendSceneSlotOption {
  scene_slot_key: string
  scene_slot_name: string
  scene_key: string | null
  scene_type: string | null
  sort_weight: number
}

export interface SearchKeywordGroupProductsInput {
  keyword_group_id?: string
  keyword?: string
  spu?: string
  relation_scope?: 'LINKED' | 'UNLINKED'
  min_price?: number
  max_price?: number
  page?: number
  page_size?: number
}

export interface SearchKeywordGroupProductsResult {
  list: KeywordGroupBoundProductSummary[]
  total: number
  page: number
  page_size: number
}

export interface KeywordOperationData {
  group_summaries: KeywordGroupSummary[]
  category_options: CategoryOption[]
  scene_slot_options: FrontendSceneSlotOption[]
}

export interface GetKeywordGroupsInput {
  scene_key?: string | null
  scene_type?: string | null
  scene_slot_key?: string | null
  scene_area?: KeywordSceneArea | null
  include_inactive?: boolean
}

export interface GetCategoryListInput {
  keyword?: string
  status?: CategoryStatus
  level?: CategoryLevel
  page?: number
  page_size?: number
}
export interface CategoryTopPromotionConfig {
  enabled: boolean
  message: string
  end_time: string | null
  background_color: string
  text_color: string
}

export interface GetCategoryListOutput {
  list: CategoryItem[]
  total: number
  parent_options: CategoryOption[]
  poster_configs: HomepagePosterConfig[]
  recommended_keyword_items: CategoryRecommendedKeywordItem[]
  nav_config_items: CategoryNavConfigItem[]
  keyword_operation_data: KeywordOperationData
  top_promotion_config: CategoryTopPromotionConfig
}

export interface KeywordGroupProductBindingInput {
  product_id: string
  sort_weight?: number
}

export interface CreateCategoryInput {
  category_name: string
  category_slug?: string | null
  parent_id?: string | null
  level: CategoryLevel
  image_url?: string | null
  banner_image_url?: string | null
  description?: string | null
  sort_weight?: number
  status?: CategoryStatus
  category_kind?: CategoryKind
  brand_keywords?: string[]
  price_coefficient?: number | null
  category_display_config?: Partial<CategoryDisplayConfig>
}

export interface BatchCreateSubcategoriesInput {
  parent_id: string
  category_names: string[]
  status?: CategoryStatus
}

export interface UpdateCategoryInput extends CreateCategoryInput {
  category_id: string
}

export interface UpdateCategoryStatusInput {
  category_id: string
  status: CategoryStatus
}

export interface UpdateCategorySortWeightInput {
  category_id: string
  sort_weight: number
}

export interface UpdateCategoryPriceCoefficientInput {
  category_id: string
  /** null clears coefficient so child categories fall back to parent / 1 */
  price_coefficient: number | null
}

export interface BatchUpdateCategorySortWeightInput {
  updates: Array<{
    category_id: string
    sort_weight: number
  }>
}

export interface SaveHomepagePosterConfigInput {
  category_id: string
  items: HomepagePosterItem[]
}
export interface SaveCategoryRecommendedKeywordsInput {
  items: Array<{
    category_id: string
    sort_weight: number
    is_active: boolean
  }>
}

export interface SaveCategoryNavConfigsInput {
  items: Array<{
    category_id: string
    display_title: string
    sort_weight: number
    is_visible: boolean
    badge_text?: string | null
  }>
}

export interface SaveCategoryTopPromotionConfigInput {
  enabled: boolean
  message: string
  end_time?: string | null
  background_color?: string
  text_color?: string
}

export interface DeleteCategoryInput {
  category_id: string
}

export interface CreateKeywordGroupInput {
  name: string
  slug?: string | null
  group_type: KeywordGroupType
  scene_area?: KeywordSceneArea
  scene_key?: string | null
  scene_type?: string | null
  scene_slot_key?: string | null
  scene_slot_name?: string | null
  description?: string | null
  floor_title?: string | null
  floor_icon?: string | null
  floor_link?: string | null
  homepage_sort_weight?: number
  show_on_homepage?: boolean
  sort_weight?: number
  is_active?: boolean
  linked_products?: KeywordGroupProductBindingInput[]
}

export interface UpdateKeywordGroupInput {
  keyword_group_id: string
  name: string
  slug?: string | null
  group_type: KeywordGroupType
  scene_area?: KeywordSceneArea
  scene_key?: string | null
  scene_type?: string | null
  scene_slot_key?: string | null
  scene_slot_name?: string | null
  description?: string | null
  floor_title?: string | null
  floor_icon?: string | null
  floor_link?: string | null
  homepage_sort_weight?: number
  show_on_homepage?: boolean
  sort_weight?: number
  is_active?: boolean
  linked_products?: KeywordGroupProductBindingInput[]
}

export interface CreateKeywordItemInput {
  keyword_group_id: string
  keyword: string
  parent_keyword_id?: string | null
  sort_weight?: number
  is_active?: boolean
}

export interface UpdateKeywordItemInput {
  keyword_item_id: string
  keyword: string
  parent_keyword_id?: string | null
  sort_weight?: number
  is_active?: boolean
}

export interface BatchUpsertKeywordItemsInput {
  keyword_group_id: string
  parent_keyword_id?: string | null
  items: Array<{
    keyword_item_id?: string | null
    keyword: string
    parent_keyword_id?: string | null
    sort_weight?: number
    is_active?: boolean
  }>
}

export interface DeleteKeywordGroupInput {
  keyword_group_id: string
}

export interface BatchApplyKeywordsInput {
  category_ids: string[]
  keyword_group_id: string
  keyword_item_ids?: string[]
  apply_to_homepage: boolean
}

export interface BatchDeleteCategoriesInput {
  category_ids: string[]
}

export interface BatchUpdateCategoryStatusInput {
  category_ids: string[]
  status: CategoryStatus
}

export interface BatchMoveCategoryParentInput {
  category_ids: string[]
  target_parent_id: string | null
}

export interface BatchOperationResult {
  success_count: number
  failed_count: number
  message?: string
}

type PosterContentItemPayload = {
  id?: string
  title?: string
  image_url?: string
  imageUrl?: string
  link?: string | null
  sort_weight?: number
  sortWeight?: number
  is_active?: boolean
  isActive?: boolean
  aspect_preset?: string
  aspectPreset?: string
}

type PosterContentPayload = {
  categoryId?: string | null
  items?: PosterContentItemPayload[]
}

type RecommendedKeywordContentPayload = {
  items?: Array<{
    category_id?: string
    categoryId?: string
    keyword_group_id?: string
    keywordGroupId?: string
    sort_weight?: number
    sortWeight?: number
    is_active?: boolean
    isActive?: boolean
  }>
}

type CategoryNavConfigContentPayload = {
  items?: Array<{
    category_id?: string
    categoryId?: string
    display_title?: string
    displayTitle?: string
    sort_weight?: number
    sortWeight?: number
    is_visible?: boolean
    isVisible?: boolean
    badge_text?: string | null
    badgeText?: string | null
  }>
}

type CategoryTopPromotionContentPayload = {
  enabled?: boolean
  message?: string
  end_time?: string | null
  endTime?: string | null
  background_color?: string
  backgroundColor?: string
  text_color?: string
  textColor?: string
}

type PosterConfigRecord = {
  category_id: string
  items: HomepagePosterItem[]
} | null

type CategoryMetadataPayload = {
  categoryKind?: string | null
  kind?: string | null
  brandKeywords?: unknown
}

type CategoryRecordLike = {
  level: number
  isBrandCategory?: boolean | null
  brandKeywordsJson?: unknown
}

type CategoryDisplayConfigPayload = Partial<CategoryDisplayConfig> | null | undefined

type KeywordGroupRecordLike = {
  sceneArea?: string | null
}


const DEFAULT_MAIN_DISPLAY_CONFIG: CategoryDisplayConfig = {
  showChildrenByDefault: false,
  allowChildrenCollapse: true,
  showBrandFilter: false,
  brandFilterCollapsedRows: 2,
}

function normalizePosterAspectPreset(value?: string | null): PosterAspectPreset {
  if (value === 'WIDE_BANNER' || value === 'SQUARE') return value
  return 'CROSS_BORDER_HERO'
}

function enumToKeywordGroupType(value: keywordgrouptype): KeywordGroupType {
  if (value === 'NEW_ARRIVAL') return 'NEW_ARRIVAL'
  if (value === 'PROMOTION') return 'PROMOTION'
  if (value === 'BRAND') return 'BRAND'
  return 'GENERAL'
}

function normalizeKeywordSceneArea(value?: string | null): KeywordSceneArea {
  if (value === 'LEFT_NAV' || value === 'RECOMMENDATION' || value === 'BOTH') {
    return value
  }
  return 'BOTH'
}

function getKeywordSceneAreaFromGroup(group: KeywordGroupRecordLike): KeywordSceneArea {
  return normalizeKeywordSceneArea(group.sceneArea)
}

function sceneAreaSupportsRecommendation(sceneArea: KeywordSceneArea) {
  return sceneArea === 'RECOMMENDATION' || sceneArea === 'BOTH'
}

function sceneAreaSupportsLeftNav(sceneArea: KeywordSceneArea) {
  return sceneArea === 'LEFT_NAV' || sceneArea === 'BOTH'
}

function normalizeCategoryNavDisplayTitle(displayTitle: string | null | undefined, categoryName: string) {
  const normalized = displayTitle?.trim() ?? ''
  return normalized.length > 0 ? normalized : categoryName
}

function normalizeCategoryNavBadgeText(badgeText?: string | null) {
  const normalized = badgeText?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

function normalizeCategoryNavVisibility(value?: boolean | null) {
  return value !== false
}

function normalizePosterItems(items: HomepagePosterItem[]): HomepagePosterItem[] {
  return items
    .filter(item => item.image_url?.trim())
    .map((item, index) => ({
      id: item.id?.trim() || `poster-${Date.now()}-${index}`,
      title: item.title?.trim() || `海报 ${index + 1}`,
      image_url: item.image_url.trim(),
      link: item.link?.trim() || null,
      sort_weight: Number.isFinite(item.sort_weight) ? item.sort_weight : index,
      is_active: item.is_active !== false,
      aspect_preset: normalizePosterAspectPreset(item.aspect_preset),
    }))
    .sort((a, b) => b.sort_weight - a.sort_weight)
}

async function resolveCategorySlug(params: {
  providedSlug?: string | null
  categoryName: string
  excludeId?: string
  reserved?: Set<string>
}): Promise<string> {
  return resolveCategorySlugShared(prisma, params)
}

function normalizeBrandKeywords(keywords?: string[]) {
  return Array.from(new Set((keywords ?? []).map(keyword => keyword.trim()).filter(Boolean)))
}

function normalizeKeyword(keyword: string) {
  return keyword.trim()
}

function normalizeKeywordToken(keyword: string) {
  return keyword.trim().toLowerCase()
}

function normalizeSceneValue(value?: string | null) {
  const normalized = value?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

function buildCategoryLink(slug: string | null, categoryId: string) {
  const normalizedSlug = slug?.trim()
  if (normalizedSlug) {
    return `/category/${normalizedSlug}`
  }
  return `/category/${categoryId}`
}

function getCategoryKindFromRecord(category: CategoryRecordLike): CategoryKind {
  if (category.level !== 1) return 'MAIN'

  if (category.isBrandCategory) return 'BRAND'
  return 'MAIN'
}

function normalizeCategoryDisplayConfig(
  config: CategoryDisplayConfigPayload,
  categoryKind: CategoryKind,
): CategoryDisplayConfig {
  const base = categoryKind === 'BRAND' ? DEFAULT_BRAND_DISPLAY_CONFIG : DEFAULT_MAIN_DISPLAY_CONFIG
  const source = config ?? {}

  return {
    showChildrenByDefault: typeof source.showChildrenByDefault === 'boolean' ? source.showChildrenByDefault : base.showChildrenByDefault,
    allowChildrenCollapse: typeof source.allowChildrenCollapse === 'boolean' ? source.allowChildrenCollapse : base.allowChildrenCollapse,
    showBrandFilter: typeof source.showBrandFilter === 'boolean' ? source.showBrandFilter : base.showBrandFilter,
    brandFilterCollapsedRows:
      typeof source.brandFilterCollapsedRows === 'number' && Number.isFinite(source.brandFilterCollapsedRows) && source.brandFilterCollapsedRows > 0
        ? Math.max(1, Math.round(source.brandFilterCollapsedRows))
        : base.brandFilterCollapsedRows,
  }
}

function getBrandKeywordsFromRecord(category: CategoryRecordLike) {
  const rawKeywords = category.brandKeywordsJson
  if (!Array.isArray(rawKeywords)) return []

  return rawKeywords
    .map(item => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object' && 'keyword' in item) {
        return String((item as { keyword?: unknown }).keyword ?? '').trim()
      }
      return ''
    })
    .filter(Boolean)
}

function toCategoryWriteData(input: {
  category_name: string
  category_slug?: string | null
  parent_id?: string | null
  level: CategoryLevel
  image_url?: string | null
  banner_image_url?: string | null
  description?: string | null
  sort_weight: number
  status: CategoryStatus
  category_kind: CategoryKind
  brand_keywords?: string[]
  price_coefficient?: number | null
  category_display_config?: Partial<CategoryDisplayConfig>
}) {
  const normalizedBrandKeywords = normalizeBrandKeywords(input.brand_keywords)
  const normalizedKind: CategoryKind = input.level === 1 && input.category_kind === 'BRAND' ? 'BRAND' : 'MAIN'
  const normalizedDisplayConfig = normalizeCategoryDisplayConfig(input.category_display_config, normalizedKind)
  const sanitizedBannerImage = normalizedKind === 'BRAND' ? null : input.banner_image_url?.trim() || null
  // L1 MAIN defaults to 2.00; L2 MAIN leaves null when unset so storefront can inherit L1 → 2.00.
  let normalizedPriceCoefficient: number | null = DEFAULT_PRICE_COEFFICIENT
  if (normalizedKind === 'MAIN' && !isAggregatePricingCategoryName(input.category_name)) {
    if (input.level === 1) {
      normalizedPriceCoefficient = Number.isFinite(input.price_coefficient ?? undefined)
        ? Number(input.price_coefficient)
        : DEFAULT_PRICE_COEFFICIENT
    } else if (input.price_coefficient === null || input.price_coefficient === undefined) {
      normalizedPriceCoefficient = null
    } else if (Number.isFinite(Number(input.price_coefficient)) && Number(input.price_coefficient) > 0) {
      normalizedPriceCoefficient = Number(input.price_coefficient)
    } else {
      normalizedPriceCoefficient = null
    }
  } else if (normalizedKind === 'MAIN') {
    normalizedPriceCoefficient = null
  }

  return {
    name: input.category_name.trim(),
    slug: normalizeOptionalSlug(input.category_slug),
    parentId: input.parent_id ?? null,
    level: input.level,
    imageUrl: input.image_url?.trim() || null,
    bannerImageUrl: sanitizedBannerImage,
    description: input.description?.trim() || null,
    sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : 0,
    status: ((input.status ?? 'ACTIVE') === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
    isBrandCategory: normalizedKind === 'BRAND',
    priceCoefficient: normalizedPriceCoefficient,
    categoryDisplayConfigJson: normalizedDisplayConfig as unknown as Prisma.InputJsonValue,
    brandKeywordsJson: normalizedBrandKeywords.map((keyword, index) => ({
      keyword,
      weight: Math.max(1, normalizedBrandKeywords.length - index),
    })) as Prisma.InputJsonValue,
  }
}

async function parsePosterConfigs(): Promise<HomepagePosterConfig[]> {
  const posterSettings = await prisma.sitesetting.findMany({
    where: { settingType: 'HOMEPAGE_POSTER' },
    orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
  })


  const parsed = posterSettings.map<PosterConfigRecord>(setting => {
    const payload = (setting.contentJson ?? {}) as PosterContentPayload
    const categoryId = payload.categoryId || null
    if (!categoryId) return null

    const items: HomepagePosterItem[] = (payload.items ?? [])
      .map((item, index) => ({
        id: item.id || `poster-${setting.id}-${index}`,
        title: item.title || `海报 ${index + 1}`,
        image_url: item.image_url || item.imageUrl || '',
        link: item.link || null,
        sort_weight: item.sort_weight ?? item.sortWeight ?? index,
        is_active: item.is_active ?? item.isActive ?? true,
        aspect_preset: normalizePosterAspectPreset(item.aspect_preset || item.aspectPreset),
      }))
      .filter(item => item.image_url)

    return {
      category_id: categoryId,
      items,
    }
  })

  return parsed.filter((config): config is HomepagePosterConfig => config !== null)
}

async function parseRecommendedKeywordItems(): Promise<CategoryRecommendedKeywordItem[]> {
  const setting = await prisma.sitesetting.findFirst({
    where: { title: 'CATEGORY_RECOMMENDED_KEYWORDS' },
    orderBy: [{ updatedAt: 'desc' }],
  })

  const payload = (setting?.contentJson ?? {}) as RecommendedKeywordContentPayload
  const rawItems = payload.items ?? []
  const categoryIds = Array.from(
    new Set(
      rawItems
        .map(item => item.category_id || item.categoryId)
        .filter((value): value is string => Boolean(value)),
    ),
  )

  if (categoryIds.length === 0) return []

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, level: 1 },
    select: { id: true, name: true, slug: true, isBrandCategory: true },
  })
  const categoryMap = new Map(
    categories.filter(item => !item.isBrandCategory).map(item => [item.id, item]),
  )

  type RecommendedCategoryItem = CategoryRecommendedKeywordItem & {
    category_id: string
    category_name: string
    category_slug: string | null
  }

  return rawItems
    .map<RecommendedCategoryItem | null>(item => {
      const categoryId = item.category_id || item.categoryId
      if (!categoryId) return null
      const category = categoryMap.get(categoryId)
      if (!category) return null
      return {
        keyword_group_id: '',
        keyword_group_name: '',
        keyword_group_slug: null,
        group_type: 'GENERAL',
        scene_area: 'BOTH',
        scene_key: null,
        linked_category_count: 0,
        keyword_count: 0,
        category_id: category.id,
        category_name: category.name,
        category_slug: category.slug,
        sort_weight: Number.isFinite(item.sort_weight)
          ? Number(item.sort_weight)
          : Number.isFinite(item.sortWeight)
            ? Number(item.sortWeight)
            : 0,
        is_active: item.is_active ?? item.isActive ?? true,
      }
    })
    .filter((item): item is RecommendedCategoryItem => item !== null)
    .sort((a, b) => b.sort_weight - a.sort_weight || a.category_name.localeCompare(b.category_name, 'zh-CN'))
}

async function parseCategoryTopPromotionConfig(): Promise<CategoryTopPromotionConfig> {
  const { loadTopPromotionBannerConfig } = await import('@/shared/topPromotionBannerConfig')
  const config = await loadTopPromotionBannerConfig(prisma)
  return {
    enabled: config.enabled,
    message: config.message,
    end_time: config.end_time,
    background_color: config.background_color,
    text_color: config.text_color,
  }
}

async function validateCategoryHierarchy(params: {
  category_id?: string
  parent_id?: string | null
  level: CategoryLevel
}) {
  const { category_id, parent_id, level } = params

  if (level === 1) {
    return { parentId: null as string | null }
  }

  if (!parent_id) {
    return { parentId: null as string | null }
  }

  if (parent_id === category_id) {
    throw new Error('分类不能设置自己为上级分类')
  }

  const parent = await prisma.category.findUnique({ where: { id: parent_id } })
  if (!parent) {
    throw new Error('所选上级分类不存在')
  }

  if (parent.level !== 1) {
    throw new Error('二级分类的上级分类必须为一级分类')
  }

  if (getCategoryKindFromRecord(parent) === 'BRAND') {
    throw new Error('品牌分类不能作为二级分类的上级分类')
  }

  return { parentId: parent.id }
}

async function ensureNoCycleForBatchMove(params: { categoryIds: string[]; targetParentId: string | null }) {
  const { categoryIds, targetParentId } = params
  if (!targetParentId) return

  if (categoryIds.includes(targetParentId)) {
    throw new Error('目标父分类不能是待移动分类本身')
  }

  const allCategories = await prisma.category.findMany({
    select: { id: true, parentId: true, level: true, keywordMappingJson: true, isBrandCategory: true },
  })
  const parentMap = new Map(allCategories.map(item => [item.id, item.parentId]))

  let cursor: string | null | undefined = targetParentId
  while (cursor) {
    if (categoryIds.includes(cursor)) {
      throw new Error('批量移动后会形成循环层级，请重新选择目标父分类')
    }
    cursor = parentMap.get(cursor)
  }
}

async function updateCategoryAndCascade(categoryId: string, updateData: Record<string, any>, newStatus: CategoryStatus) {
  const directProducts = await prisma.product.findMany({
    where: { categoryId },
    select: { id: true },
  })
  const productIds = directProducts.map(p => p.id)

  const items = newStatus === 'ACTIVE' && productIds.length > 0
    ? await prisma.cartitem.findMany({
        where: { productId: { in: productIds } },
        include: { product: true, productSku: true },
      })
    : []

  await prisma.$transaction(async tx => {
    await tx.category.update({
      where: { id: categoryId },
      data: updateData,
    })

    if (productIds.length === 0) return

    if (newStatus === 'INACTIVE') {
      await tx.cartitem.updateMany({
        where: { productId: { in: productIds } },
        data: { status: 'INVALID' },
      })
    } else if (newStatus === 'ACTIVE') {
      const toValidIds: string[] = []
      const toInvalidIds: string[] = []

      for (const item of items) {
        const isValid = item.product.status === 'ACTIVE' && item.productSku.stock >= item.quantity
        if (isValid && item.status !== 'VALID') {
          toValidIds.push(item.id)
        } else if (!isValid && item.status !== 'INVALID') {
          toInvalidIds.push(item.id)
        }
      }

      if (toValidIds.length > 0) {
        await tx.cartitem.updateMany({
          where: { id: { in: toValidIds } },
          data: { status: 'VALID' },
        })
      }
      if (toInvalidIds.length > 0) {
        await tx.cartitem.updateMany({
          where: { id: { in: toInvalidIds } },
          data: { status: 'INVALID' },
        })
      }
    }
  })
}

const buildKeywordTree = (items: Array<{
  id: string
  keyword: string
  normalizedKeyword: string | null
  parentKeywordId: string | null
  sortWeight: number
  isActive: boolean
}>) => {
  const nodeMap = new Map<string, KeywordItemNode>()
  items.forEach(item => {
    nodeMap.set(item.id, {
      keyword_item_id: item.id,
      keyword: item.keyword,
      normalized_keyword: item.normalizedKeyword,
      parent_keyword_id: item.parentKeywordId,
      sort_weight: item.sortWeight,
      is_active: item.isActive,
      child_count: 0,
      children: [],
    })
  })

  const roots: KeywordItemNode[] = []
  items.forEach(item => {
    const node = nodeMap.get(item.id)!
    if (item.parentKeywordId && nodeMap.has(item.parentKeywordId)) {
      nodeMap.get(item.parentKeywordId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: KeywordItemNode[]) => {
    nodes.sort((a, b) => b.sort_weight - a.sort_weight || a.keyword.localeCompare(b.keyword, 'zh-CN'))
    nodes.forEach(node => {
      sortNodes(node.children)
      node.child_count = node.children.length
    })
  }

  sortNodes(roots)
  return roots
}

const getKeywordGroupWhereInput = (input?: GetKeywordGroupsInput): Prisma.keywordgroupWhereInput => {
  const where: Prisma.keywordgroupWhereInput = {}

  if (input?.scene_key !== undefined) {
    where.sceneKey = normalizeSceneValue(input.scene_key)
  }
  if (input?.scene_type !== undefined) {
    where.sceneType = normalizeSceneValue(input.scene_type)
  }
  if (input?.include_inactive !== true) {
    where.isActive = true
  }

  return where
}

const getKeywordOperationData = async (input?: GetKeywordGroupsInput): Promise<KeywordOperationData> => {

  const groupWhere = getKeywordGroupWhereInput(input)
  const [groups, keywords, links, groupProductLinks, categoryOptions, sceneSlotSettings] = await Promise.all([
    prisma.keywordgroup.findMany({
      where: groupWhere,
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
      include: {
        productLinks: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                mainImageUrl: true,
                sortWeight: true,
                createdAt: true,
                skus: {
                  select: { skuCode: true, price: true },
                  orderBy: [{ createdAt: 'asc' }],
                  take: 1,
                },
              },
            },
          },
          orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
        },
      },
    }),
    prisma.keyworditem.findMany({
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.categorykeywordlink.findMany({
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.keywordgroupproduct.findMany({
      select: { keywordGroupId: true, productId: true },
    }),
    prisma.category.findMany({
      where: { level: 1, isBrandCategory: false },
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        level: true,
        parentId: true,
        isBrandCategory: true,
      },
    }),
    prisma.sitesetting.findMany({
      where: { settingType: 'FRONTEND_SCENE_SLOT', isActive: true },
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
      select: {
        title: true,
        subtitle: true,
        sortWeight: true,
        contentJson: true,
      },
    }),
  ])

  const sceneSlotOptions: FrontendSceneSlotOption[] = sceneSlotSettings
    .map(setting => {
      const content = (setting.contentJson ?? {}) as Record<string, any>
      const sceneSlotKey = typeof content.scene_slot_key === 'string' ? content.scene_slot_key.trim() : ''
      if (!sceneSlotKey) return null
      return {
        scene_slot_key: sceneSlotKey,
        scene_slot_name: typeof content.scene_slot_name === 'string' && content.scene_slot_name.trim()
          ? content.scene_slot_name.trim()
          : (setting.title?.trim() || sceneSlotKey),
        scene_key: typeof content.scene_key === 'string' ? content.scene_key.trim() || null : null,
        scene_type: typeof content.scene_type === 'string' ? content.scene_type.trim() || null : null,
        sort_weight: Number.isFinite(content.sort_weight) ? Number(content.sort_weight) : setting.sortWeight,
      }
    })
    .filter((item): item is FrontendSceneSlotOption => Boolean(item))

  return {
    group_summaries: groups.map(group => {
      const groupKeywords = keywords.filter(item => item.groupId === group.id)
      const groupLinks = links.filter(item => item.keywordGroupId === group.id)
      const linkedProducts = group.productLinks.map(link => ({
        product_id: link.product.id,
        product_name: link.product.name,
        product_slug: link.product.slug,
        sku_code: link.product.skus[0]?.skuCode ?? null,
        image_url: link.product.mainImageUrl,
        price: link.product.skus[0]?.price ? Number(link.product.skus[0].price) : null,
        created_at: link.product.createdAt.toISOString(),
        sort_weight: link.sortWeight,
      }))
      return {
        keyword_group_id: group.id,
        name: group.name,
        slug: group.slug,
        group_type: enumToKeywordGroupType(group.groupType),
        scene_area: getKeywordSceneAreaFromGroup(group),
        scene_key: group.sceneKey,
        scene_type: group.sceneType,
        scene_slot_key: group.sceneSlotKey,
        scene_slot_name: group.sceneSlotName,
        parent_group_id: group.parentGroupId,
        sort_weight: group.sortWeight,
        is_active: group.isActive,
        description: group.description,
        floor_title: group.floorTitle,
        floor_icon: group.floorIcon,
        floor_link: group.floorLink,
        homepage_sort_weight: group.homepageSortWeight ?? 0,
        show_on_homepage: group.showOnHomepage === true,
        keyword_count: groupKeywords.length,
        linked_category_count: new Set(groupLinks.map(item => item.categoryId)).size,
        homepage_link_count: groupLinks.filter(item => item.applyToHomepage).length,
        linked_product_count: linkedProducts.length,
        linked_products: linkedProducts,
        keywords: buildKeywordTree(groupKeywords),
      }
    }),
    category_options: categoryOptions.map(item => ({
      category_id: item.id,
      category_name: item.name,
      level: (item.level === 2 ? 2 : 1) as CategoryLevel,
      parent_id: item.parentId,
      category_kind: item.isBrandCategory ? 'BRAND' : 'MAIN',
    })),
    scene_slot_options: sceneSlotOptions,
  }
}

const getKeywordItemLineageMap = (items: Array<{ id: string; keyword: string; parentKeywordId: string | null }>) => {
  const itemMap = new Map(items.map(item => [item.id, item]))
  const lineageMap = new Map<string, { parent_keyword_id: string | null; parent_keyword_text: string | null }>()

  items.forEach(item => {
    if (!item.parentKeywordId) {
      lineageMap.set(item.id, { parent_keyword_id: null, parent_keyword_text: null })
      return
    }
    const parent = itemMap.get(item.parentKeywordId) ?? null
    lineageMap.set(item.id, {
      parent_keyword_id: parent?.id ?? null,
      parent_keyword_text: parent?.keyword ?? null,
    })
  })

  return lineageMap
}

const buildCategoryKeywordLinks = (params: {
  links: Array<{
    id: string
    categoryId: string
    keywordGroupId: string
    keywordItemId: string | null
    applyToHomepage: boolean
    sortWeight: number
  }>
  groups: Array<{ id: string; name: string; groupType: keywordgrouptype }>
  items: Array<{ id: string; keyword: string; parentKeywordId: string | null }>
}) => {
  const groupMap = new Map(params.groups.map(group => [group.id, group]))
  const itemMap = new Map(params.items.map(item => [item.id, item]))
  const lineageMap = getKeywordItemLineageMap(params.items)

  const categoryMap = new Map<string, CategoryKeywordLinkItem[]>()
  params.links.forEach(link => {
    const group = groupMap.get(link.keywordGroupId)
    if (!group) return
    const keywordItem = link.keywordItemId ? itemMap.get(link.keywordItemId) ?? null : null
    const lineage = keywordItem ? lineageMap.get(keywordItem.id) : { parent_keyword_id: null, parent_keyword_text: null }

    const item: CategoryKeywordLinkItem = {
      link_id: link.id,
      keyword_group_id: group.id,
      keyword_group_name: group.name,
      keyword_group_type: enumToKeywordGroupType(group.groupType),
      keyword_scene_area: 'BOTH',
      keyword_item_id: keywordItem?.id ?? null,
      keyword_text: keywordItem?.keyword ?? null,
      parent_keyword_id: lineage?.parent_keyword_id ?? null,
      parent_keyword_text: lineage?.parent_keyword_text ?? null,
      apply_to_homepage: link.applyToHomepage,
      sort_weight: link.sortWeight,
    }

    const list = categoryMap.get(link.categoryId) ?? []
    list.push(item)
    categoryMap.set(link.categoryId, list)
  })

  categoryMap.forEach(list => {
    list.sort((a, b) => b.sort_weight - a.sort_weight || a.keyword_group_name.localeCompare(b.keyword_group_name, 'zh-CN'))
  })

  return categoryMap
}

export const getKeywordGroups = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetKeywordGroupsInput = {}): Promise<KeywordGroupSummary[]> => {
    const result = await getKeywordOperationData(input)
    return result.group_summaries
  })
)

export const searchKeywordGroupProducts = requireRole([UserRole.ADMIN])(
  withResult(async (input: SearchKeywordGroupProductsInput = {}): Promise<SearchKeywordGroupProductsResult> => {
    const keywordGroupId = input.keyword_group_id?.trim() ?? ''
    if (!keywordGroupId) {
      throw new Error('缺少关键词分组上下文')
    }

    const page = Number.isFinite(input.page) && Number(input.page) > 0 ? Number(input.page) : 1
    const pageSize = Number.isFinite(input.page_size) && Number(input.page_size) > 0
      ? Math.min(Number(input.page_size), 200)
      : 50
    const keyword = input.keyword?.trim() ?? ''
    const spu = input.spu?.trim() ?? ''
    const relationScope = input.relation_scope === 'UNLINKED' ? 'UNLINKED' : 'LINKED'
    const minPrice = Number.isFinite(input.min_price) ? Number(input.min_price) : null
    const maxPrice = Number.isFinite(input.max_price) ? Number(input.max_price) : null

    const group = await prisma.keywordgroup.findUnique({ where: { id: keywordGroupId } })
    if (!group) {
      throw new Error('关键词分组不存在')
    }

    const linkedRows = await prisma.keywordgroupproduct.findMany({
      where: { keywordGroupId },
      select: {
        productId: true,
        sortWeight: true,
      },
    })
    const linkedIdSet = new Set(linkedRows.map(item => item.productId))
    const linkedSortWeightMap = new Map(linkedRows.map(item => [item.productId, item.sortWeight]))

    const where: Prisma.productWhereInput = {
      goodsStatus: { not: 'DELETED' }
    }

    const andConditions: Prisma.productWhereInput[] = []

    if (relationScope === 'LINKED') {
      if (linkedIdSet.size === 0) {
        return {
          list: [],
          total: 0,
          page,
          page_size: pageSize,
        }
      }
      andConditions.push({ id: { in: Array.from(linkedIdSet) } })
    } else if (linkedIdSet.size > 0) {
      andConditions.push({ id: { notIn: Array.from(linkedIdSet) } })
    }

    if (keyword) {
      andConditions.push({
        OR: [
          { name: { contains: keyword } },
          { productCode: { contains: keyword } },
        ],
      })
    }

    if (spu) {
      andConditions.push({
        skus: {
          some: { skuCode: { contains: spu } },
        },
      })
    }

    if (minPrice !== null || maxPrice !== null) {
      andConditions.push({
        skus: {
          some: {
            ...(minPrice !== null ? { price: { gte: minPrice } } : {}),
            ...(maxPrice !== null ? { price: { lte: maxPrice } } : {}),
          },
        },
      })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: relationScope === 'LINKED'
          ? [{ createdAt: 'desc' }]
          : [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          mainImageUrl: true,
          sortWeight: true,
          createdAt: true,
          skus: {
            select: { skuCode: true, price: true, createdAt: true },
            orderBy: [{ createdAt: 'asc' }],
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    const sortedProducts = relationScope === 'LINKED'
      ? [...products].sort((a, b) => {
          const weightDiff = (linkedSortWeightMap.get(b.id) ?? 0) - (linkedSortWeightMap.get(a.id) ?? 0)
          if (weightDiff !== 0) return weightDiff
          return b.createdAt.getTime() - a.createdAt.getTime()
        })
      : products

    return {
      list: sortedProducts.map(item => {
        const firstSku = item.skus[0] ?? null
        const lowestSalePrice = item.skus.length > 0
          ? item.skus.reduce<number | null>((lowest, sku) => {
              const salePrice = sku.price == null ? null : Number(sku.price)
              if (salePrice == null || Number.isNaN(salePrice)) return lowest
              if (lowest == null) return salePrice
              return salePrice < lowest ? salePrice : lowest
            }, null)
          : null
        return {
        product_id: item.id,
        product_name: item.name,
        product_slug: item.slug,
        sku_code: firstSku?.skuCode ?? null,
        image_url: item.mainImageUrl,
        price: lowestSalePrice,
        created_at: item.createdAt.toISOString(),
        sort_weight: linkedSortWeightMap.get(item.id) ?? item.sortWeight,
      }}),
      total,
      page,
      page_size: pageSize,
    }
  })
)

export interface RemoveKeywordGroupProductLinkInput {
  keyword_group_id: string
  product_id: string
}

export const removeKeywordGroupProductLink = requireRole([UserRole.ADMIN])(
  withResult(async (input: RemoveKeywordGroupProductLinkInput): Promise<void> => {
    const keywordGroupId = input.keyword_group_id?.trim()
    const productId = input.product_id?.trim()
    if (!keywordGroupId || !productId) throw new Error('缺少待解绑商品')

    await prisma.keywordgroupproduct.deleteMany({
      where: {
        keywordGroupId,
        productId,
      },
    })
  })
)

export interface BatchRemoveKeywordGroupProductLinksInput {
  keyword_group_id: string
  product_ids: string[]
}

export const batchRemoveKeywordGroupProductLinks = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchRemoveKeywordGroupProductLinksInput): Promise<{ removed_count: number }> => {
    const keywordGroupId = input.keyword_group_id?.trim()
    const productIds = Array.from(new Set((input.product_ids ?? []).map(item => item.trim()).filter(Boolean)))
    if (!keywordGroupId) throw new Error('缺少关键词分组')
    if (productIds.length === 0) throw new Error('请至少选择一个商品')

    const result = await prisma.keywordgroupproduct.deleteMany({
      where: {
        keywordGroupId,
        productId: { in: productIds },
      },
    })

    return {
      removed_count: result.count,
    }
  })
)

const syncKeywordGroupProducts = async (keywordGroupId: string, linkedProducts: KeywordGroupProductBindingInput[] | undefined) => {
  const normalized = Array.from(new Map((linkedProducts ?? [])
    .filter(item => item?.product_id)
    .map((item, index) => [item.product_id, {
      product_id: item.product_id,
      sort_weight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : linkedProducts!.length - index,
    }]))
    .values())

  await prisma.keywordgroupproduct.deleteMany({ where: { keywordGroupId } })

  if (normalized.length === 0) return

  const existingProducts = await prisma.product.findMany({
    where: { id: { in: normalized.map(item => item.product_id) } },
    select: { id: true },
  })
  const existingIds = new Set(existingProducts.map(item => item.id))

  const createData = normalized
    .filter(item => existingIds.has(item.product_id))
    .map((item, index) => ({
      keywordGroupId,
      productId: item.product_id,
      sortWeight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : normalized.length - index,
    }))

  if (createData.length > 0) {
    await prisma.keywordgroupproduct.createMany({ data: createData })
  }
}

export const getCategoryList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetCategoryListInput): Promise<GetCategoryListOutput> => {
    const { keyword, status, level, page = 1, page_size = 20 } = input
    const skip = (page - 1) * page_size
    const take = page_size

    const where: Record<string, any> = {}
    if (keyword) {
      where.OR = [{ name: { contains: keyword } }, { slug: { contains: keyword } }]
    }
    if (status) {
      where.status = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    }
    if (level) {
      where.level = level
    }

    const [categories, total, parentOptions, posterConfigs, recommendedKeywordItems, topPromotionConfig, childCategories, keywordOperationData, allKeywordGroups, allKeywordItems, allCategoryKeywordLinks] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: [{ level: 'asc' }, { isBrandCategory: 'asc' }, { sortWeight: 'desc' }, { createdAt: 'desc' }],
        include: {
          parent: {
            select: { id: true, name: true, priceCoefficient: true },
          },
          _count: {
            select: { products: true, children: true },
          },
        },
      }),
      prisma.category.count({ where }),
      prisma.category.findMany({
        where: { level: 1, isBrandCategory: false },
        orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          level: true,
          parentId: true,
          isBrandCategory: true,
        },
      }),
      parsePosterConfigs(),
      parseRecommendedKeywordItems(),
      parseCategoryTopPromotionConfig(),
      prisma.category.findMany({
        where: { parentId: { not: null } },
        select: {
          id: true,
          parentId: true,
        },
      }),
      getKeywordOperationData(),
      prisma.keywordgroup.findMany({
        select: { id: true, name: true, groupType: true },
      }),
      prisma.keyworditem.findMany({
        select: { id: true, keyword: true, parentKeywordId: true },
      }),
      prisma.categorykeywordlink.findMany({
        select: {
          id: true,
          categoryId: true,
          keywordGroupId: true,
          keywordItemId: true,
          applyToHomepage: true,
          sortWeight: true,
        },
      }),
    ])

    const childToParentMap = new Map<string, string>()
    childCategories.forEach(item => {
      if (item.parentId) {
        childToParentMap.set(item.id, item.parentId)
      }
    })

    const mainTopLevelCategoryIds = categories
      .filter(category => category.level === 1 && getCategoryKindFromRecord(category) === 'MAIN')
      .map(category => category.id)

    const descendantProducts = mainTopLevelCategoryIds.length > 0
      ? await prisma.productcategory.findMany({
          where: {
            categoryId: {
              in: Array.from(childToParentMap.keys()),
            },
          },
          select: {
            categoryId: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ product: { sortWeight: 'desc' } }, { product: { createdAt: 'desc' } }],
        })
      : []

    const descendantProductMap = new Map<string, Map<string, CategoryPreviewProduct>>()
    for (const item of descendantProducts) {
      const parentId = childToParentMap.get(item.categoryId)
      if (!parentId || !mainTopLevelCategoryIds.includes(parentId)) continue
      if (!descendantProductMap.has(parentId)) {
        descendantProductMap.set(parentId, new Map())
      }
      descendantProductMap.get(parentId)!.set(item.product.id, {
        product_id: item.product.id,
        product_name: item.product.name,
      })
    }

    const posterConfigMap = new Map(posterConfigs.map(config => [config.category_id, config]))
    const categoryKeywordLinksMap = buildCategoryKeywordLinks({
      links: allCategoryKeywordLinks,
      groups: allKeywordGroups,
      items: allKeywordItems,
    })

    return {
      list: categories.map(c => {
        const categoryKind = getCategoryKindFromRecord(c)
        const descendantProductsForParent = c.level === 1 && categoryKind === 'MAIN'
          ? Array.from(descendantProductMap.get(c.id)?.values() ?? [])
          : []
        const categoryDisplayConfig = normalizeCategoryDisplayConfig(c.categoryDisplayConfigJson as CategoryDisplayConfigPayload, categoryKind)
        const keywordLinks = categoryKeywordLinksMap.get(c.id) ?? []

        return {
          category_id: c.id,
          category_name: c.name,
          category_slug: c.slug,
          parent_id: c.parentId,
          parent_name: c.parent?.name || null,
          parent_price_coefficient: c.parent?.priceCoefficient != null ? Number(c.parent.priceCoefficient) : null,
          level: (c.level === 2 ? 2 : 1) as CategoryLevel,
          image_url: c.imageUrl,
          banner_image_url: categoryKind === 'BRAND' ? null : c.bannerImageUrl,
          description: c.description,
          sort_weight: c.sortWeight,
          status: c.status as CategoryStatus,
          category_kind: categoryKind,
          is_brand_category: categoryKind === 'BRAND',
          brand_keywords: getBrandKeywordsFromRecord(c),
          price_coefficient: c.priceCoefficient != null ? Number(c.priceCoefficient) : null,
          category_display_config: categoryDisplayConfig,
          can_configure_poster: c.level === 1 && categoryKind === 'MAIN',
          product_count: c._count.products,
          child_count: categoryKind === 'MAIN' ? c._count.children : 0,
          descendant_product_count: descendantProductsForParent.length,
          descendant_product_preview: descendantProductsForParent,
          keyword_link_count: keywordLinks.length,
          homepage_keyword_link_count: keywordLinks.filter(link => link.apply_to_homepage).length,
          keyword_links: keywordLinks,
          nav_config: null,
          created_at: c.createdAt.toISOString(),
          updated_at: c.updatedAt.toISOString(),
        }
      }),
      total,
      parent_options: parentOptions.map(item => ({
        category_id: item.id,
        category_name: item.name,
        level: (item.level === 2 ? 2 : 1) as CategoryLevel,
        parent_id: item.parentId,
        category_kind: item.isBrandCategory ? 'BRAND' : 'MAIN',
      })),
      poster_configs: posterConfigs.filter(config => {
        const category = categories.find(item => item.id === config.category_id)
        if (category) {
          return getCategoryKindFromRecord(category) === 'MAIN' && category.level === 1
        }
        return true
      }),
      recommended_keyword_items: recommendedKeywordItems,
      keyword_operation_data: keywordOperationData,
      top_promotion_config: topPromotionConfig,
      nav_config_items: [],
    }
  })
)

export const createCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateCategoryInput): Promise<void> => {
    const { category_name, category_slug, parent_id, level, image_url, banner_image_url, description, sort_weight, status, category_kind, brand_keywords, price_coefficient, category_display_config } = input

    const trimmedName = category_name.trim()
    if (!trimmedName) throw new Error('分类名称不能为空')

    const existName = await prisma.category.findFirst({ where: { name: trimmedName } })
    if (existName) throw new Error('分类名称已存在')

    const normalizedCategoryKind: CategoryKind = level === 1 && category_kind === 'BRAND' ? 'BRAND' : 'MAIN'
    const { parentId } = await validateCategoryHierarchy({ parent_id, level })
    const resolvedSlug = await resolveCategorySlug({
      providedSlug: category_slug,
      categoryName: trimmedName,
    })

    await prisma.category.create({
      data: toCategoryWriteData({
        category_name: trimmedName,
        category_slug: resolvedSlug,
        parent_id: parentId,
        level,
        image_url,
        banner_image_url,
        description,
        sort_weight: sort_weight ?? 0,
        status: status ?? 'ACTIVE',
        category_kind: normalizedCategoryKind,
        brand_keywords,
        price_coefficient: price_coefficient ?? undefined,
        category_display_config,
      }) as any,
    })
    invalidateHomeRecommendZoneCache()
  })
)

export const batchCreateSubcategories = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchCreateSubcategoriesInput): Promise<{ created_count: number }> => {
    const { parent_id, category_names, status = 'ACTIVE' } = input

    const { parentId } = await validateCategoryHierarchy({ parent_id, level: 2 })

    const normalizedNames = Array.from(new Set(category_names.map(name => name.trim()).filter(Boolean)))

    if (normalizedNames.length === 0) {
      throw new Error('请至少输入一个子类名称')
    }

    const existing = await prisma.category.findMany({
      where: { name: { in: normalizedNames } },
      select: { name: true },
    })
    const existingNameSet = new Set(existing.map(item => item.name))
    const creatableNames = normalizedNames.filter(name => !existingNameSet.has(name))

    if (creatableNames.length === 0) {
      throw new Error('输入的子类名称均已存在，未创建新分类')
    }

    const reservedSlugs = new Set<string>()
    const createRows: Array<{
      name: string
      slug: string
      parentId: string | null
      level: number
      sortWeight: number
      status: 'ACTIVE' | 'INACTIVE'
      isBrandCategory: boolean
      priceCoefficient: null
      categoryDisplayConfigJson: Prisma.InputJsonValue
      brandKeywordsJson: Prisma.InputJsonValue
    }> = []

    for (let index = 0; index < creatableNames.length; index += 1) {
      const name = creatableNames[index]
      const slug = await resolveCategorySlug({
        categoryName: name,
        reserved: reservedSlugs,
      })
      createRows.push({
        name,
        slug,
        parentId,
        level: parentId ? 2 : 1,
        sortWeight: creatableNames.length - index,
        status: (status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
        isBrandCategory: false,
        // 二级子类默认不设系数，前台按「子级优先」回退到一级分类系数
        priceCoefficient: null,
        categoryDisplayConfigJson: DEFAULT_MAIN_DISPLAY_CONFIG as unknown as Prisma.InputJsonValue,
        brandKeywordsJson: [] as Prisma.InputJsonValue,
      })
    }

    await prisma.category.createMany({
      data: createRows,
    })

    return { created_count: creatableNames.length }
  })
)

export const updateCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateCategoryInput): Promise<void> => {
    const { category_id, category_name, category_slug, parent_id, level, image_url, banner_image_url, description, sort_weight, status, category_kind, brand_keywords, price_coefficient, category_display_config } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')

    const trimmedName = category_name.trim()
    if (!trimmedName) throw new Error('分类名称不能为空')

    const existName = await prisma.category.findFirst({ where: { name: trimmedName, id: { not: category_id } } })
    if (existName) throw new Error('分类名称已存在')

    const normalizedCategoryKind: CategoryKind = level === 1 && category_kind === 'BRAND' ? 'BRAND' : 'MAIN'
    const { parentId } = await validateCategoryHierarchy({ category_id, parent_id, level })

    const resolvedSlug = await resolveCategorySlug({
      providedSlug: category_slug,
      categoryName: trimmedName,
      excludeId: category_id,
    })

    const newStatus = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    const updateData = toCategoryWriteData({
      category_name: trimmedName,
      category_slug: resolvedSlug,
      parent_id: parentId,
      level,
      image_url,
      banner_image_url,
      description,
      sort_weight: sort_weight ?? 0,
      status: status ?? 'ACTIVE',
      category_kind: normalizedCategoryKind,
      brand_keywords,
      price_coefficient: price_coefficient ?? undefined,
      category_display_config,
    }) as any

    if (trimmedName !== category.name) {
      const root =
        category.translationsJson && typeof category.translationsJson === 'object' && !Array.isArray(category.translationsJson)
          ? { ...(category.translationsJson as Record<string, unknown>) }
          : {}
      const en =
        root.en && typeof root.en === 'object' && !Array.isArray(root.en)
          ? { ...(root.en as Record<string, unknown>) }
          : {}
      en.name = trimmedName
      root.en = en
      updateData.translationsJson = root as Prisma.InputJsonValue
    }

    if (category.status !== newStatus) {
      await updateCategoryAndCascade(category_id, updateData, newStatus)
    } else {
      await prisma.category.update({
        where: { id: category_id },
        data: updateData,
      })
    }
    invalidateHomeRecommendZoneCache()
  })
)

export const updateCategoryStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateCategoryStatusInput): Promise<void> => {
    const { category_id, status } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')

    const newStatus = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    if (category.status !== newStatus) {
      await updateCategoryAndCascade(category_id, { status: newStatus }, newStatus)
      invalidateHomeRecommendZoneCache()
    }
  })
)

export const updateCategorySortWeight = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateCategorySortWeightInput): Promise<void> => {
    const { category_id, sort_weight } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')

    await prisma.category.update({
      where: { id: category_id },
      data: { sortWeight: sort_weight },
    })
  })
)

export const updateCategoryPriceCoefficient = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateCategoryPriceCoefficientInput): Promise<void> => {
    const { category_id, price_coefficient } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')

    const canEdit = canEditCategoryPriceCoefficient({
      level: category.level,
      parentId: category.parentId,
      name: category.name,
    })
    if (!canEdit) {
      throw new Error('该分类不支持设置售价系数')
    }

    let nextCoefficient: number | null = null
    if (price_coefficient !== null && price_coefficient !== undefined) {
      const value = Number(price_coefficient)
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('售价系数必须大于 0')
      }
      nextCoefficient = value
    } else if (category.level === 1) {
      // 一级分类清空时回退为全局默认 2.00
      nextCoefficient = DEFAULT_PRICE_COEFFICIENT
    }

    await prisma.category.update({
      where: { id: category_id },
      data: { priceCoefficient: nextCoefficient },
    })

    invalidateHomeRecommendZoneCache()
  })
)

/** 批量更新一级分类排序权重（拖拽排序专用，仅写入 category.sortWeight） */
export const batchUpdateCategorySortWeight = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateCategorySortWeightInput): Promise<void> => {
    const updates = Array.from(
      new Map(
        (input.updates ?? [])
          .filter(item => item?.category_id && Number.isFinite(item.sort_weight))
          .map(item => [item.category_id, Number(item.sort_weight)]),
      ).entries(),
    )
    if (updates.length === 0) return

    const categories = await prisma.category.findMany({
      where: { id: { in: updates.map(([id]) => id) } },
      select: { id: true, level: true },
    })
    const levelMap = new Map(categories.map(item => [item.id, item.level]))

    for (const [categoryId] of updates) {
      if (!levelMap.has(categoryId)) throw new Error('分类不存在')
      if (levelMap.get(categoryId) !== 1) {
        throw new Error('仅一级分类支持拖拽排序')
      }
    }

    await prisma.$transaction(
      updates.map(([categoryId, sortWeight]) =>
        prisma.category.update({
          where: { id: categoryId },
          data: { sortWeight },
        }),
      ),
    )
  })
)

export const saveHomepagePosterConfig = requireRole([UserRole.ADMIN])(
  withResult(async (input: SaveHomepagePosterConfigInput): Promise<void> => {

    const { category_id, items } = input

    const category = await prisma.category.findUnique({ where: { id: category_id } })
    if (!category) throw new Error('分类不存在')
    if (category.level !== 1 || getCategoryKindFromRecord(category) !== 'MAIN') {
      throw new Error('仅一级主类目可维护目录海报')
    }

    const normalizedItems = normalizePosterItems(items)

    const existing = await prisma.sitesetting.findFirst({
      where: {
        settingType: 'HOMEPAGE_POSTER',
      },
    })
    const matchedExisting = existing && ((existing.contentJson ?? {}) as PosterContentPayload).categoryId === category_id
      ? existing
      : null

    const contentJson = {
      categoryId: category_id,
      items: normalizedItems.map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        link: item.link,
        sort_weight: item.sort_weight,
        is_active: item.is_active,
        aspect_preset: item.aspect_preset,
      })),
    } as const

    if (matchedExisting) {
      await prisma.sitesetting.update({
        where: { id: matchedExisting.id },
        data: {
          title: `${category.name} 首页海报`,
          contentJson,
          imageUrl: normalizedItems[0]?.image_url || null,
          isActive: true,
        },
      })
      return
    }

    await prisma.sitesetting.create({
      data: {
        settingType: 'HOMEPAGE_POSTER',
        title: `${category.name} 首页海报`,
        subtitle: '分类目录海报配置',
        contentJson,
        imageUrl: normalizedItems[0]?.image_url || null,
        sortWeight: category.sortWeight,
        isActive: true,
      },
    })
  })
)
export const saveCategoryRecommendedKeywords = requireRole([UserRole.ADMIN])(
  withResult(async (input: SaveCategoryRecommendedKeywordsInput): Promise<void> => {
    const items = Array.from(
      new Map(
        (input.items ?? [])
          .filter(item => item?.category_id)
          .map(item => [
            item.category_id,
            {
              category_id: item.category_id,
              sort_weight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : 0,
              is_active: item.is_active !== false,
            },
          ]),
      ).values(),
    )

    if (items.length === 0) {
      throw new Error('请至少选择一个一级分类')
    }

    const categories = await prisma.category.findMany({
      where: { id: { in: items.map(item => item.category_id) }, level: 1, isBrandCategory: false },
      select: { id: true, name: true, slug: true },
    })

    if (categories.length !== items.length) {
      throw new Error('推荐关键词仅支持已存在的一级主类目')
    }

    const contentJson = {
      items: items.map(item => ({
        category_id: item.category_id,
        sort_weight: item.sort_weight,
        is_active: item.is_active,
      })),
    } as const

    const existing = await prisma.sitesetting.findFirst({
      where: { title: 'CATEGORY_RECOMMENDED_KEYWORDS' },
      orderBy: [{ updatedAt: 'desc' }],
    })

    const subtitle = '分类页热门搜索维护'
    const activeCount = items.filter(item => item.is_active).length
    const maxSortWeight = items.reduce((max, item) => Math.max(max, item.sort_weight), 0)

    if (existing) {
      await prisma.sitesetting.update({
        where: { id: existing.id },
        data: {
          title: 'CATEGORY_RECOMMENDED_KEYWORDS',
          subtitle,
          contentJson,
          imageUrl: null,
          sortWeight: maxSortWeight,
          isActive: activeCount > 0,
        },
      })
      return
    }

    await prisma.sitesetting.create({
      data: {
        settingType: 'STATIC_COPY',
        title: 'CATEGORY_RECOMMENDED_KEYWORDS',
        subtitle,
        contentJson,
        imageUrl: null,
        sortWeight: maxSortWeight,
        isActive: activeCount > 0,
      },
    })
  })
)

export const saveCategoryTopPromotionConfig = requireRole([UserRole.ADMIN])(
  withResult(async (input: SaveCategoryTopPromotionConfigInput): Promise<void> => {
    const { saveTopPromotionBannerConfig, normalizeTopPromotionBannerConfig } = await import(
      '@/shared/topPromotionBannerConfig'
    )
    await saveTopPromotionBannerConfig(
      prisma,
      normalizeTopPromotionBannerConfig(
        {
          enabled: input.enabled === true,
          message: input.message,
          end_time: input.end_time,
          background_color: input.background_color,
          text_color: input.text_color,
          font_size: (input as any).font_size,
        },
        input.enabled === true,
      ),
    )
  }),
)

/**
 * 删除分类前解除商品绑定：
 * - 不修改商品 status / goodsStatus
 * - 主分类改挂到父分类或「未分类」兜底分类
 * - 清理多对多关联与专区/关键词绑定
 */
async function unlinkCategoryBindings(
  tx: Prisma.TransactionClient,
  params: {
    categoryId: string
    preferredFallbackCategoryId?: string | null
  },
) {
  const { categoryId, preferredFallbackCategoryId } = params

  await tx.product.updateMany({
    where: { brandCategoryId: categoryId },
    data: { brandCategoryId: null },
  })

  const boundProductCount = await tx.product.count({ where: { categoryId } })
  if (boundProductCount > 0) {
    let fallbackId =
      preferredFallbackCategoryId && preferredFallbackCategoryId !== categoryId
        ? preferredFallbackCategoryId
        : null

    if (fallbackId) {
      const preferred = await tx.category.findUnique({
        where: { id: fallbackId },
        select: { id: true },
      })
      if (!preferred) fallbackId = null
    }

    if (!fallbackId) {
      const existingUncategorized = await tx.category.findFirst({
        where: {
          id: { not: categoryId },
          OR: [{ slug: 'uncategorized' }, { name: '未分类' }],
        },
        select: { id: true },
      })

      if (existingUncategorized) {
        fallbackId = existingUncategorized.id
      } else {
        const anyOther = await tx.category.findFirst({
          where: { id: { not: categoryId } },
          orderBy: [{ level: 'asc' }, { sortWeight: 'desc' }],
          select: { id: true },
        })
        if (anyOther) {
          fallbackId = anyOther.id
        } else {
          const created = await tx.category.create({
            data: {
              name: '未分类',
              slug: 'uncategorized',
              level: 1,
              status: 'ACTIVE',
              sortWeight: -9999,
              isBrandCategory: false,
            },
            select: { id: true },
          })
          fallbackId = created.id
        }
      }
    }

    // 仅改挂 categoryId，不改动商品状态字段
    await tx.product.updateMany({
      where: { categoryId },
      data: { categoryId: fallbackId },
    })
  }

  await tx.productcategory.deleteMany({ where: { categoryId } })
  await tx.product_category_relations.deleteMany({ where: { categoryId } })
  await tx.homeRecommendZoneItem.deleteMany({ where: { categoryId } })
  await tx.categorykeywordlink.deleteMany({ where: { categoryId } })
  await tx.categoryfilterbinding.deleteMany({ where: { categoryId } })
  await tx.categoryspectemplatebinding.deleteMany({ where: { categoryId } })
  await tx.categorynavconfig.deleteMany({ where: { categoryId } })
}

export const deleteCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteCategoryInput): Promise<void> => {
    const { category_id } = input

    const category = await prisma.category.findUnique({
      where: { id: category_id },
      include: {
        _count: {
          select: { children: true },
        },
      },
    })
    if (!category) throw new Error('分类不存在')

    if (category._count.children > 0) {
      throw new Error('该分类下仍存在子分类，请先迁移或删除子分类后再操作')
    }

    await prisma.$transaction(async (tx) => {
      await unlinkCategoryBindings(tx, {
        categoryId: category_id,
        preferredFallbackCategoryId: category.parentId,
      })
      await tx.category.delete({
        where: { id: category_id },
      })
    })
    invalidateHomeRecommendZoneCache()
  })
)

export const createKeywordGroup = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateKeywordGroupInput): Promise<void> => {
    const normalizedName = input.name.trim()
    if (!normalizedName) throw new Error('关键词分组名称不能为空')

    const existing = await prisma.keywordgroup.findFirst({ where: { name: normalizedName } })
    if (existing) throw new Error('关键词分组名称已存在')

    const created = await prisma.keywordgroup.create({
      data: {
        name: normalizedName,
        slug: normalizeOptionalSlug(input.slug),
        groupType: input.group_type,
        sceneKey: normalizeSceneValue(input.scene_key),
        sceneType: normalizeSceneValue(input.scene_type),
        sceneSlotKey: normalizeSceneValue(input.scene_slot_key),
        sceneSlotName: input.scene_slot_name?.trim() || null,
        description: input.description?.trim() || null,
        floorTitle: input.floor_title?.trim() || null,
        floorIcon: input.floor_icon?.trim() || null,
        floorLink: input.floor_link?.trim() || null,
        homepageSortWeight: Number.isFinite(input.homepage_sort_weight) ? Number(input.homepage_sort_weight) : 0,
        showOnHomepage: input.show_on_homepage === true,
        sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : 0,
        isActive: input.is_active !== false,
      },
    })

    await syncKeywordGroupProducts(created.id, input.linked_products)
  })
)

export const updateKeywordGroup = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateKeywordGroupInput): Promise<void> => {
    const normalizedName = input.name.trim()
    if (!normalizedName) throw new Error('关键词分组名称不能为空')

    const group = await prisma.keywordgroup.findUnique({ where: { id: input.keyword_group_id } })
    if (!group) throw new Error('关键词分组不存在')

    const existing = await prisma.keywordgroup.findFirst({
      where: {
        name: normalizedName,
        id: { not: input.keyword_group_id },
      },
    })
    if (existing) throw new Error('关键词分组名称已存在')

    await prisma.keywordgroup.update({
      where: { id: input.keyword_group_id },
      data: {
        name: normalizedName,
        slug: normalizeOptionalSlug(input.slug),
        groupType: input.group_type,
        sceneKey: normalizeSceneValue(input.scene_key),
        sceneType: normalizeSceneValue(input.scene_type),
        sceneSlotKey: normalizeSceneValue(input.scene_slot_key),
        sceneSlotName: input.scene_slot_name?.trim() || null,
        description: input.description?.trim() || null,
        floorTitle: input.floor_title?.trim() || null,
        floorIcon: input.floor_icon?.trim() || null,
        floorLink: input.floor_link?.trim() || null,
        homepageSortWeight: Number.isFinite(input.homepage_sort_weight) ? Number(input.homepage_sort_weight) : 0,
        showOnHomepage: input.show_on_homepage === true,
        sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : 0,
        isActive: input.is_active !== false,
      },
    })

    await syncKeywordGroupProducts(input.keyword_group_id, input.linked_products)
  })
)

export const deleteKeywordGroup = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteKeywordGroupInput): Promise<void> => {
    const group = await prisma.keywordgroup.findUnique({ where: { id: input.keyword_group_id } })
    if (!group) throw new Error('关键词分组不存在')

    await prisma.$transaction(async tx => {
      const keywordIds = await tx.keyworditem.findMany({
        where: { groupId: input.keyword_group_id },
        select: { id: true },
      })
      const ids = keywordIds.map(item => item.id)
      if (ids.length > 0) {
        await tx.categorykeywordlink.deleteMany({ where: { keywordItemId: { in: ids } } })
      }
      await tx.categorykeywordlink.deleteMany({ where: { keywordGroupId: input.keyword_group_id } })
      await tx.keyworditem.deleteMany({ where: { groupId: input.keyword_group_id } })
      await tx.keywordgroup.delete({ where: { id: input.keyword_group_id } })
    })
  })
)

export const createKeywordItem = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateKeywordItemInput): Promise<void> => {
    const keyword = normalizeKeyword(input.keyword)
    if (!keyword) throw new Error('关键词不能为空')

    const group = await prisma.keywordgroup.findUnique({ where: { id: input.keyword_group_id } })
    if (!group) throw new Error('关键词分组不存在')

    if (input.parent_keyword_id) {
      const parentKeyword = await prisma.keyworditem.findUnique({ where: { id: input.parent_keyword_id } })
      if (!parentKeyword) throw new Error('上级关键词不存在')
      if (parentKeyword.groupId !== input.keyword_group_id) throw new Error('二级关键词必须归属同一关键词分组')
      if (parentKeyword.parentKeywordId) throw new Error('当前仅支持一级关键词下新增二级关键词')
    }

    const normalizedToken = normalizeKeywordToken(keyword)
    const existing = await prisma.keyworditem.findFirst({
      where: {
        groupId: input.keyword_group_id,
        parentKeywordId: input.parent_keyword_id ?? null,
        normalizedKeyword: normalizedToken,
      },
    })
    if (existing) throw new Error('同层级下已存在相同关键词')

    await prisma.keyworditem.create({
      data: {
        groupId: input.keyword_group_id,
        parentKeywordId: input.parent_keyword_id ?? null,
        keyword,
        normalizedKeyword: normalizedToken,
        sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : 0,
        isActive: input.is_active !== false,
      },
    })
  })
)

export const updateKeywordItem = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateKeywordItemInput): Promise<void> => {
    const keyword = normalizeKeyword(input.keyword)
    if (!keyword) throw new Error('关键词不能为空')

    const item = await prisma.keyworditem.findUnique({ where: { id: input.keyword_item_id } })
    if (!item) throw new Error('关键词不存在')

    const nextParentKeywordId = input.parent_keyword_id === undefined ? item.parentKeywordId : input.parent_keyword_id ?? null
    if (nextParentKeywordId === item.id) {
      throw new Error('关键词不能设置自己为上级')
    }

    if (nextParentKeywordId) {
      const parentKeyword = await prisma.keyworditem.findUnique({ where: { id: nextParentKeywordId } })
      if (!parentKeyword) throw new Error('上级关键词不存在')
      if (parentKeyword.groupId !== item.groupId) throw new Error('二级关键词必须归属同一关键词分组')
      if (parentKeyword.parentKeywordId) throw new Error('当前仅支持一级关键词下维护二级关键词')
    }

    const normalizedToken = normalizeKeywordToken(keyword)
    const existing = await prisma.keyworditem.findFirst({
      where: {
        groupId: item.groupId,
        parentKeywordId: nextParentKeywordId,
        normalizedKeyword: normalizedToken,
        id: { not: item.id },
      },
    })
    if (existing) throw new Error('同层级下已存在相同关键词')

    await prisma.keyworditem.update({
      where: { id: input.keyword_item_id },
      data: {
        keyword,
        parentKeywordId: nextParentKeywordId,
        normalizedKeyword: normalizedToken,
        sortWeight: Number.isFinite(input.sort_weight) ? Number(input.sort_weight) : item.sortWeight,
        isActive: input.is_active !== false,
      },
    })
  })
)

export interface DeleteKeywordItemInput {
  keyword_item_id: string
}

export const deleteKeywordItem = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteKeywordItemInput): Promise<void> => {
    const item = await prisma.keyworditem.findUnique({ where: { id: input.keyword_item_id } })
    if (!item) throw new Error('关键词不存在')

    const childItems = await prisma.keyworditem.findMany({
      where: { parentKeywordId: input.keyword_item_id },
      select: { id: true },
    })
    const idsToDelete = [input.keyword_item_id, ...childItems.map(child => child.id)]

    await prisma.$transaction(async tx => {
      await tx.categorykeywordlink.deleteMany({ where: { keywordItemId: { in: idsToDelete } } })
      await tx.keyworditem.deleteMany({ where: { id: { in: idsToDelete } } })
    })
  })
)

export const batchUpsertKeywordItems = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpsertKeywordItemsInput): Promise<void> => {
    const group = await prisma.keywordgroup.findUnique({ where: { id: input.keyword_group_id } })
    if (!group) throw new Error('关键词分组不存在')

    const normalizedItems = (input.items ?? []).map(item => ({
      keyword_item_id: item.keyword_item_id ?? null,
      keyword: normalizeKeyword(item.keyword),
      parent_keyword_id: item.parent_keyword_id === undefined ? input.parent_keyword_id ?? null : item.parent_keyword_id ?? null,
      sort_weight: Number.isFinite(item.sort_weight) ? Number(item.sort_weight) : 0,
      is_active: item.is_active !== false,
    })).filter(item => item.keyword)

    if (normalizedItems.length === 0) {
      throw new Error('请至少录入一条有效关键词')
    }

    const parentIds = Array.from(new Set(normalizedItems.map(item => item.parent_keyword_id).filter((value): value is string => Boolean(value))))
    const existingItems = await prisma.keyworditem.findMany({
      where: {
        OR: [
          { id: { in: normalizedItems.map(item => item.keyword_item_id).filter((value): value is string => Boolean(value)) } },
          parentIds.length > 0 ? { id: { in: parentIds } } : undefined,
        ].filter(Boolean) as Prisma.keyworditemWhereInput[],
      },
    })
    const itemMap = new Map(existingItems.map(item => [item.id, item]))

    normalizedItems.forEach(item => {
      if (item.parent_keyword_id) {
        const parent = itemMap.get(item.parent_keyword_id)
        if (!parent) throw new Error('存在无效的上级关键词')
        if (parent.groupId !== input.keyword_group_id) throw new Error('二级关键词必须归属同一关键词分组')
        if (parent.parentKeywordId) throw new Error('当前仅支持一级关键词下维护二级关键词')
      }
      if (item.keyword_item_id && item.parent_keyword_id === item.keyword_item_id) {
        throw new Error('关键词不能设置自己为上级')
      }
    })

    const duplicateKeySet = new Set<string>()
    normalizedItems.forEach(item => {
      const duplicateKey = `${item.parent_keyword_id ?? 'root'}::${normalizeKeywordToken(item.keyword)}`
      if (duplicateKeySet.has(duplicateKey)) {
        throw new Error('批量内容中存在同层级重复关键词，请调整后重试')
      }
      duplicateKeySet.add(duplicateKey)
    })

    await prisma.$transaction(async tx => {
      for (const item of normalizedItems) {
        const normalizedToken = normalizeKeywordToken(item.keyword)
        const existing = await tx.keyworditem.findFirst({
          where: {
            groupId: input.keyword_group_id,
            parentKeywordId: item.parent_keyword_id,
            normalizedKeyword: normalizedToken,
            ...(item.keyword_item_id ? { id: { not: item.keyword_item_id } } : {}),
          },
        })
        if (existing) {
          throw new Error(`关键词"${item.keyword}"在同层级已存在`)
        }

        if (item.keyword_item_id) {
          const current = await tx.keyworditem.findUnique({ where: { id: item.keyword_item_id } })
          if (!current || current.groupId !== input.keyword_group_id) {
            throw new Error('存在不可编辑的关键词记录，请刷新后重试')
          }
          await tx.keyworditem.update({
            where: { id: item.keyword_item_id },
            data: {
              keyword: item.keyword,
              parentKeywordId: item.parent_keyword_id,
              normalizedKeyword: normalizedToken,
              sortWeight: item.sort_weight,
              isActive: item.is_active,
            },
          })
          continue
        }

        await tx.keyworditem.create({
          data: {
            groupId: input.keyword_group_id,
            parentKeywordId: item.parent_keyword_id,
            keyword: item.keyword,
            normalizedKeyword: normalizedToken,
            sortWeight: item.sort_weight,
            isActive: item.is_active,
          },
        })
      }
    })
  })
)

export const batchApplyKeywordsToCategories = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchApplyKeywordsInput): Promise<BatchOperationResult> => {
    const categoryIds = Array.from(new Set((input.category_ids ?? []).filter(Boolean)))
    if (categoryIds.length === 0) throw new Error('请至少选择一个分类')

    const group = await prisma.keywordgroup.findUnique({ where: { id: input.keyword_group_id } })
    if (!group) throw new Error('关键词分组不存在')

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    })
    if (categories.length !== categoryIds.length) {
      throw new Error('存在不可用的目标分类，请刷新后重试')
    }

    const keywordItemIds = Array.from(new Set((input.keyword_item_ids ?? []).filter(Boolean)))
    if (keywordItemIds.length > 0) {
      const validItems = await prisma.keyworditem.findMany({
        where: { id: { in: keywordItemIds }, groupId: input.keyword_group_id },
        select: { id: true },
      })
      if (validItems.length !== keywordItemIds.length) {
        throw new Error('存在不属于当前分组的关键词，请刷新后重试')
      }
    }

    const linkTargets = keywordItemIds.length > 0 ? keywordItemIds : [null]
    const existingLinks = await prisma.categorykeywordlink.findMany({
      where: {
        categoryId: { in: categoryIds },
        keywordGroupId: input.keyword_group_id,
        keywordItemId: keywordItemIds.length > 0 ? { in: keywordItemIds } : null,
      },
      select: { id: true, categoryId: true, keywordItemId: true },
    })
    const existingKeySet = new Set(existingLinks.map(item => `${item.categoryId}_${item.keywordItemId ?? 'group'}`))

    const creatableEntries: Array<{ categoryId: string; keywordItemId: string | null }> = []
    categoryIds.forEach((categoryId) => {
      linkTargets.forEach((keywordItemId) => {
        const key = `${categoryId}_${keywordItemId ?? 'group'}`
        if (!existingKeySet.has(key)) {
          creatableEntries.push({ categoryId, keywordItemId })
        }
      })
    })

    if (creatableEntries.length > 0) {
      await prisma.categorykeywordlink.createMany({
        data: creatableEntries.map((entry, index) => ({
          categoryId: entry.categoryId,
          keywordGroupId: input.keyword_group_id,
          keywordItemId: entry.keywordItemId,
          applyToHomepage: input.apply_to_homepage,
          sortWeight: creatableEntries.length - index,
        })),
        skipDuplicates: true,
      })
    }

    if (input.apply_to_homepage) {
      await prisma.categorykeywordlink.updateMany({
        where: {
          categoryId: { in: categoryIds },
          keywordGroupId: input.keyword_group_id,
          keywordItemId: keywordItemIds.length > 0 ? { in: keywordItemIds } : null,
        },
        data: { applyToHomepage: true },
      })
    }

    return {
      success_count: categoryIds.length,
      failed_count: 0,
      message: '',
    }
  })
)

export const batchDeleteCategories = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchDeleteCategoriesInput): Promise<BatchOperationResult> => {
    const categoryIds = Array.from(new Set((input.category_ids ?? []).filter(Boolean)))
    if (categoryIds.length === 0) throw new Error('请至少选择一个分类')

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      include: {
        _count: {
          select: { children: true },
        },
      },
    })

    let successCount = 0
    const failedMessages: string[] = []

    for (const category of categories) {
      if (category._count.children > 0) {
        failedMessages.push(`${category.name}：仍存在子分类`)
        continue
      }

      try {
        await prisma.$transaction(async tx => {
          await unlinkCategoryBindings(tx, {
            categoryId: category.id,
            preferredFallbackCategoryId: category.parentId,
          })
          await tx.category.delete({ where: { id: category.id } })
        })
        successCount += 1
      } catch (error) {
        failedMessages.push(
          `${category.name}：${error instanceof Error ? error.message : '删除失败'}`,
        )
      }
    }

    return {
      success_count: successCount,
      failed_count: categoryIds.length - successCount,
      message: failedMessages.join('; '),
    }
  })
)

export const batchUpdateCategoryStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateCategoryStatusInput): Promise<BatchOperationResult> => {
    const categoryIds = Array.from(new Set((input.category_ids ?? []).filter(Boolean)))
    if (categoryIds.length === 0) throw new Error('请至少选择一个分类')

    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    for (const category of categories) {
      const newStatus = input.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
      if (category.status === newStatus) continue
      await updateCategoryAndCascade(category.id, { status: newStatus }, newStatus)
    }

    return {
      success_count: categories.length,
      failed_count: 0,
      message: '',
    }
  })
)

export const batchMoveCategoryParent = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchMoveCategoryParentInput): Promise<BatchOperationResult> => {
    const categoryIds = Array.from(new Set((input.category_ids ?? []).filter(Boolean)))
    if (categoryIds.length === 0) throw new Error('请至少选择一个分类')

    await ensureNoCycleForBatchMove({ categoryIds, targetParentId: input.target_parent_id })

    let parentId: string | null = null
    if (input.target_parent_id) {
      const parent = await prisma.category.findUnique({ where: { id: input.target_parent_id } })
      if (!parent) throw new Error('目标父分类不存在')
      if (parent.level !== 1) throw new Error('目标父分类必须为一级分类')
      if (getCategoryKindFromRecord(parent) === 'BRAND') throw new Error('品牌分类不能作为目标父分类')
      parentId = parent.id
    }

    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    let successCount = 0
    const failedMessages: string[] = []

    for (const category of categories) {
      if (category.level !== 2) {
        failedMessages.push(`${category.name}：仅支持移动二级分类`)
        continue
      }
      await prisma.category.update({
        where: { id: category.id },
        data: { parentId },
      })
      successCount += 1
    }

    return {
      success_count: successCount,
      failed_count: categories.length - successCount,
      message: failedMessages.join('; '),
    }
  })
)

export const getKeywordGroupTypeLabels = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<Record<KeywordGroupType, string>> => KEYWORD_GROUP_TYPE_LABELS)
)
