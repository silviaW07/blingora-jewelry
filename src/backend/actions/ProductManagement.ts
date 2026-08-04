'use server'

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'
export type ProductSource = 'MANUAL' | 'IMPORT_1688' | 'TABLE_IMPORT'
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
export type GoodsStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'DELETED'
export type ProductListStatusFilter = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'DELETED'
export type ProductInlineField =
  | 'product_name'
  | 'supplier_name'
  | 'category_id'
  | 'goods_status'
  | 'weight_gram'
  | 'cost_price'
  | 'price_coefficient'
export type BatchAdjustTargetField = 'price_coefficient' | 'weight_gram'
export type CartItemStatus = 'VALID' | 'INVALID'

export interface GalleryItem {
  url: string
  sort: number
}
export interface SellingPointItem {
  title: string
  content: string
}
export interface DetailContentItem {
  type: 'text' | 'image'
  content: string
  title?: string
}
export interface ParameterGroup {
  group: string
  items: { key: string; value: string }[]
}
export interface TradeInfo {
  shipFrom?: string
  deliveryDays?: number
  minOrderQty?: number
  supportedRegions?: string[]
  shippingNote?: string
  tradeNotice?: string
  /** 运营内部备注（如 1688 状态同步批注），不对外展示 */
  adminRemark?: string
}
export interface FaqItem {
  question: string
  answer: string
}
export interface SkuAttribute {
  name: string
  value: string
}

export interface SkuItem {
  sku_id?: string
  sku_code: string
  image_url?: string | null
  min_order_qty?: number | null
  price: number
  original_price?: number | null
  stock: number
  attribute_json: SkuAttribute[]
  delivery_days?: number | null
  weight_kg?: number | null
  volume_m3?: number | null
  usd_display_price?: number | null
  usd_display_original_price?: number | null
}

export interface ProductListSkuItem {
  sku_id: string
  sku_code: string
  min_order_qty: number | null
  price: number
  original_price: number | null
  stock: number
  weight_kg: number | null
  weight_gram: number | null
  cost_price: number | null
  attribute_json: SkuAttribute[]
  spec_text: string
  usd_display_price: number | null
}

export interface ProductBoundCategoryTag {
  category_id: string
  category_name: string
  is_primary: boolean
  /** Brand shelf / Brand L2 — filter-only; never shows a pricing coeff badge */
  is_brand: boolean
  /** The single real category tag that owns effective_price_coefficient display */
  is_pricing: boolean
}

export interface ProductListItem {
  product_id: string
  product_name: string
  sku_code_base: string
  source: ProductSource
  supplier_name: string | null
  brand_keyword: string | null
  category_id: string
  category_name: string
  category_level: number | null
  parent_category_id: string | null
  parent_category_name: string | null
  main_category_id: string
  main_category_name: string
  main_category_price_coefficient: number | null
  /** 主类目 + brandCategory + product_category_relations 去重后的绑定类目 */
  bound_categories: ProductBoundCategoryTag[]
  goods_status: GoodsStatus | null
  weight_gram: number | null
  cost_price: number | null
  price_coefficient: number | null
  effective_price_coefficient: number | null
  min_order_qty: number | null
  price_min: number
  price_max: number
  usd_display_price_min: number
  usd_display_price_max: number
  total_stock: number
  status: ProductStatus
  created_at: string
  updated_at: string
  skus: ProductListSkuItem[]
}
export interface CategoryOption {
  category_id: string
  category_name: string
  parent_id?: string | null
  level?: number | null
  price_coefficient?: number | null
}

export interface SelectOption {
  value: string
  label: string
  parent_id?: string | null
  level?: number | null
  depth?: number
}

export interface ProductDetail {
  product_id: string
  category_id: string
  category_name: string
  main_category_id: string
  main_category_name: string
  main_category_price_coefficient: number | null
  effective_price_coefficient: number | null
  linked_category_ids: string[]
  linked_keyword_ids: string[]
  name: string
  product_code: string
  source: ProductSource
  supplier_name: string | null
  brand_keyword: string | null
  status: ProductStatus
  goods_status: GoodsStatus | null
  weight_gram: number | null
  cost_price: number | null
  price_coefficient: number | null
  detail_text: string | null
  main_image_url: string
  gallery_json: GalleryItem[]
  short_description: string | null
  selling_points_json: SellingPointItem[] | null
  detail_content_json: DetailContentItem[] | null
  parameter_json: ParameterGroup[] | null
  trade_info_json: TradeInfo | null
  faq_json: FaqItem[] | null
  skus: SkuItem[]
}

export interface GetProductListInput {
  keyword?: string
  category_id?: string
  status?: ProductStatus | ProductStatus[]
  goods_status?: GoodsStatus
  status_filter?: ProductListStatusFilter | 'ALL'
  supplier_name?: string
  brand_keyword?: string
  page?: number
  page_size?: number
}
export interface GetProductListOutput {
  list: ProductListItem[]
  total: number
  published_import_match: ProductListItem | null
}

export interface CreateProductInput {
  name: string
  category_id: string
  linked_category_ids?: string[]
  linked_keyword_ids?: string[]
  supplier_name?: string | null
  brand_keyword?: string | null
  goods_status?: GoodsStatus
  weight_gram?: number | null
  cost_price?: number | null
  price_coefficient?: number | null
  detail_text?: string
  main_image_url: string
  short_description?: string
  gallery_json?: GalleryItem[]
  selling_points_json?: SellingPointItem[]
  detail_content_json?: DetailContentItem[]
  parameter_json?: ParameterGroup[]
  trade_info_json?: TradeInfo
  faq_json?: FaqItem[]
  skus: SkuItem[]
  submit_action: 'DRAFT' | 'ACTIVE'
  product_code?: string | null
  source?: ProductSource
}

export interface BatchImportDraftRow {
  name: string
  weight_gram?: number | null
  main_image_url?: string
  detail_text?: string
  category_name?: string
  supplier_name?: string
  brand_keyword?: string
  cost_price?: number | null
  price_coefficient?: number | null
  gallery_urls?: string[]
  product_code?: string | null
  sku_code?: string | null
  product_price?: number | null
  color?: string | null
  spec?: string | null
  colors?: string[]
  specs?: string[]
}


export interface BatchImportProductsInput {
  category_id: string
  rows: BatchImportDraftRow[]
}

export interface BatchImportProductsOutput {
  success_count: number
  fail_count: number
  error_messages?: string[]
}

export type PendingImportTaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED' | 'RATE_LIMITED' | 'RETRY_PENDING'
export type PendingImportItemFetchStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RATE_LIMITED' | 'RETRY_PENDING'
export type PendingImportItemPublishStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
export type PendingImportEditableField = PendingImportInlineField

export interface PendingImportQueueTaskSummary {
  task_id: string
  task_taskName: string
  task_status: PendingImportTaskStatus
  task_sourceLinkCount: number
  task_successCount: number
  task_failureCount: number
  task_progressPercent: number
  task_defaultStatus: ProductStatus
  task_defaultCategoryId: string | null
  task_lastRateLimitedAt: Date | null
  task_startedAt: Date | null
  task_finishedAt: Date | null
}

export interface PendingImportQueueItem {
  item_id: string
  item_importTaskId: string
  item_sourceUrl: string
  item_fetchStatus: PendingImportItemFetchStatus
  item_publishStatus: PendingImportItemPublishStatus
  item_isPublished: boolean
  item_importedProductId: string | null
  item_failureReason: string | null
  item_productName: string | null
  item_supplierName: string | null
  item_mainImageUrl: string | null
  item_galleryUrls?: string[]
  item_costPrice: number | null
  item_weightGrams: number | null
  item_sourceCategoryName: string | null
  item_targetCategoryId: string | null
  item_coefficient: number | null
  item_goodsStatus: ProductStatus | null
  item_productDetail: string | null
  item_skuSummaryText: string | null
  item_cnyPriceMin: number | null
  item_cnyPriceMax: number | null
  item_usdPriceMin: number | null
  item_usdPriceMax: number | null
  item_minimumOrderQuantity: number | null
  item_availableStock: number | null
  item_parsedName: string | null
  item_parsedMainImageUrl: string | null
  item_createdAt: Date
  item_updatedAt: Date
  item_skus: PendingImportSkuDraftItem[]
}

export interface PendingImportSkuDraftItem {
  sku_key: string
  spec_text: string
  cost_price: number | null
  price: number | null
  weight_grams: number | null
  stock: number | null
  image_url: string | null
  attributes: SkuAttribute[]
}

export interface ProductManagementPendingImportQueueOutput {
  activeTask: PendingImportQueueTaskSummary | null
  list: PendingImportQueueItem[]
  total: number
  page?: number
  page_size?: number
}

type PublishedImportMatchDbRecord = {
  id: string
  name: string
  productCode: string
  source: string
  supplierName: string | null
  brandName: string | null
  categoryId: string
  brandCategoryId?: string | null
  weightGram: any
  costPrice: any
  priceCoefficient: any
  status: string
  createdAt: Date
  updatedAt: Date
  tradeInfoJson: any
  goodsStatus: string | null
  category: { id: string; name: string; parentId: string | null; level: number | null; priceCoefficient: any } | null
  brandCategory?: { id: string; name: string } | null
  relationCategories?: Array<{
    categoryId: string
    category?: { id: string; name: string } | null
  }>
  skus: Array<{
    id: string
    skuCode: string
    price: any
    originalPrice: any
    stock: number
    weightKg?: any
    attributeJson?: any
  }>
}

export interface InlineUpdatePendingImportItemFieldOutput {
  success: boolean
}

export type PriceAdjustMode = 'PRODUCT_COEFFICIENT' | 'CATEGORY_COEFFICIENT'

export interface BatchUpdatePriceCoefficientInput {
  product_ids: string[]
  price_coefficient?: number
  adjust_mode: PriceAdjustMode
}

export interface InlineUpdateProductFieldInput {
  product_id: string
  field: ProductInlineField
  value: string | number
}

export type ProductSkuInlineField = 'cost_price' | 'price' | 'weight_gram' | 'stock' | 'spec_text'

export interface InlineUpdateProductSkuFieldInput {
  product_id: string
  sku_id: string
  field: ProductSkuInlineField
  value: string | number
}

export interface BatchUpdateProductCategoryInput {
  product_ids: string[]
  category_id: string
}

export interface BatchUpdateMinOrderQtyInput {
  product_ids?: string[]
  sku_ids?: string[]
  min_order_qty: number
}

export interface BatchBindProductCategoriesInput {
  product_ids: string[]
  linked_category_ids: string[]
}

export interface BatchUnbindProductCategoriesInput {
  product_ids: string[]
  linked_category_ids: string[]
}

export interface UnbindProductCategoryInput {
  product_id: string
  category_id: string
}

export interface CategoryProductPreviewItem {
  product_id: string
  product_name: string
  sku_code_base: string
  category_id: string
  is_primary: boolean
}

export interface GetCategoryProductPreviewInput {
  category_id: string
  limit?: number
}

export interface GetCategoryProductPreviewOutput {
  category_id: string
  products: CategoryProductPreviewItem[]
  total: number
}

export interface BatchBindProductKeywordsInput {
  product_ids: string[]
  linked_keyword_ids: string[]
}

export interface BatchUpdateProductStatusInput {
  product_ids: string[]
  target_status: ProductListStatusFilter
}

export interface BatchUpdateProductWeightPriceInput {
  product_ids: string[]
  field: BatchAdjustTargetField
  value: number
}

export type Sync1688OfferBucket = 'DELISTED' | 'OUT_OF_STOCK' | 'NORMAL' | 'UNKNOWN'

export interface Sync1688StatusItem {
  product_id: string
  product_name: string
  product_code: string
  source_url: string | null
  supplier_name: string | null
  current_status: ProductStatus
  offer_status: Sync1688OfferBucket
  offer_name: string | null
  reason: string | null
}

export interface Sync1688ProductStatusInput {
  product_ids: string[]
}

export interface Sync1688ProductStatusOutput {
  delisted: Sync1688StatusItem[]
  out_of_stock: Sync1688StatusItem[]
  normal: Sync1688StatusItem[]
  unknown: Sync1688StatusItem[]
  skipped_count: number
}

export interface BatchAppendProductAdminNotesInput {
  product_ids: string[]
  note: string
}

export type CreatePendingImportTaskInput = CreateImportTaskInput
export type CreatePendingImportTaskOutput = CreateImportTaskOutput
export type StartPendingImportTaskInput = StartParseTaskInput
export type RetryPendingImportTaskInput = RetryImportTaskInput

export interface InlineUpdatePendingImportItemFieldInput {
  item_id: string
  field: PendingImportEditableField
  value: string | number
}

export interface PublishPendingImportItemsInput {
  item_ids: string[]
}

export interface ReparsePendingImportItemsInput {
  item_ids: string[]
}

export type { ReparsePendingImportItemsOutput, ReparsePendingImportItemResult }

export interface CreateProductOutput {
  product_id: string
}

export interface UpdateProductInput extends CreateProductInput {
  product_id: string
}
export interface UpdateProductOutput {
  success: boolean
}

export interface UpdateProductStatusInput {
  product_id: string
  target_status: ProductStatus
}
export interface UpdateProductStatusOutput {
  success: boolean
}

export interface BatchOperateOutput {
  success_count: number
  fail_count: number
}

export interface HomeFeaturedKeywordsSetting {
  keywords: string[]
}

export interface ProductBindingMetaOutput {
  category_options: SelectOption[]
  keyword_options: SelectOption[]
}

import prisma from '@/tools/prisma'
import { withResult, UserRole, requireRole } from '@/backend/action_utils'
import { isAggregatePricingCategoryName } from '@/shared/categoryPricing'
import { DEFAULT_PRICE_COEFFICIENT, resolveCategoryPriceCoefficient } from '@/shared/priceCoefficient'
import { ensureCategorySlugPersisted } from '@/shared/categorySlug'
import { buildSkuIdentifier, formatIdentifierYearMonth, resolveCategoryShortCode } from '@/shared/productIdentifiers'
import {
  createImportTask as createPendingImportTask,
  startParseTask as startPendingImportParseTask,
  retryImportTask as retryPendingImportTask,
  getPendingImportQueue as getImportFrom1688PendingImportQueue,
  inlineUpdatePendingImportItemField as updateImportFrom1688PendingImportItemField,
  inlineUpdatePendingImportSkuField as updateImportFrom1688PendingImportSkuField,
  publishPendingImportItems as publishImportFrom1688PendingImportItems,
  reparsePendingImportItems as reparseImportFrom1688PendingImportItems,
  updatePendingImportGallery as updateImportFrom1688PendingImportGallery,
  check1688OfferLiveStatus,
  loadAutoMatchSecondaryCategories,
  matchSecondaryCategoriesByTitle,
  buildCategoryMatchCorpus,
  resolveImportCategoryOwnership,
  expandLinkedCategoryIdsWithParents,
  type CreateImportTaskInput,
  type CreateImportTaskOutput,
  type StartParseTaskInput,
  type RetryImportTaskInput,
  type PendingImportInlineField,
  type PendingImportSkuEditableField,
  type PublishPendingImportItemsOutput,
  type ReparsePendingImportItemsOutput,
  type ReparsePendingImportItemResult,
  type UpdatePendingImportGalleryInput
} from '@/backend/actions/ImportFrom1688'
import {
  buildProductTranslationsJson,
  getCachedEnglishTitle,
  getCachedSpanishTitle,
  mergeProductTitleTranslations,
  resolveEnglishProductTitle,
  resolveSpanishProductTitle,
} from '@/backend/lib/resolveProductTitleEn'

export interface ReclassifyPublishedProductsOutput {
  matched: number
  skipped: number
  failed: number
  total: number
}

const USD_EXCHANGE_RATE = 6.5

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof value?.toNumber === 'function') {
    const n = value.toNumber()
    return Number.isFinite(n) ? n : null
  }
  // Prisma Decimal / similar may serialize without toNumber in some paths
  if (typeof value === 'object' && value !== null && 'd' in value && typeof (value as any).s === 'number') {
    const parsed = Number(String(value))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2))
}

function toUsdDisplayPrice(rmbPrice: number | null | undefined): number | null {
  if (rmbPrice === null || rmbPrice === undefined || !Number.isFinite(rmbPrice)) return null
  return roundCurrency(rmbPrice / USD_EXCHANGE_RATE)
}

function normalizeGoodsStatus(goodsStatus?: string | null): GoodsStatus | null {
  if (!goodsStatus) return null
  if (goodsStatus === 'DELETED') return 'DELETED'
  if (goodsStatus === 'DRAFT') return 'DRAFT'
  if (goodsStatus === 'INACTIVE' || goodsStatus === 'LOW_STOCK' || goodsStatus === 'OUT_OF_STOCK') return 'INACTIVE'
  return 'ACTIVE'
}

function mapStatusFilterToProductStatus(statusFilter?: ProductListStatusFilter | 'ALL'): ProductStatus[] | undefined {
  if (!statusFilter || statusFilter === 'ALL') return ['ACTIVE', 'INACTIVE']
  if (statusFilter === 'DRAFT' || statusFilter === 'DELETED') return ['DRAFT']
  return [statusFilter]
}

function mapProductStatusToGoodsStatus(status: ProductStatus): GoodsStatus {
  if (status === 'ACTIVE') return 'ACTIVE'
  if (status === 'INACTIVE') return 'INACTIVE'
  return 'DRAFT'
}

function buildDetailContent(detailText?: string, detailContent?: DetailContentItem[] | null): DetailContentItem[] {
  const content = (detailContent || []).filter(item => item && item.content && item.content.trim() !== '')
  if (content.length > 0) return content
  if (detailText && detailText.trim() !== '') {
    return [{ type: 'text', content: detailText.trim(), title: '商品详情' }]
  }
  return []
}

function normalizeTradeInfo(tradeInfo?: TradeInfo | null): TradeInfo {
  return {
    shipFrom: tradeInfo?.shipFrom || '',
    deliveryDays: tradeInfo?.deliveryDays || 0,
    minOrderQty: Math.max(1, Number(tradeInfo?.minOrderQty ?? 1) || 1),
    supportedRegions: tradeInfo?.supportedRegions || [],
    shippingNote: tradeInfo?.shippingNote || '',
    tradeNotice: tradeInfo?.tradeNotice || '',
    adminRemark: tradeInfo?.adminRemark || '',
  }
}

function buildGallery(mainImageUrl: string, gallery?: GalleryItem[] | null): GalleryItem[] {
  const sanitized = (gallery || [])
    .filter(item => item?.url?.trim())
    .map((item, index) => ({ url: item.url.trim(), sort: item.sort || index + 1 }))
  if (mainImageUrl?.trim() && !sanitized.some(item => item.url === mainImageUrl.trim())) {
    sanitized.unshift({ url: mainImageUrl.trim(), sort: 1 })
  }
  return sanitized.map((item, index) => ({ ...item, sort: index + 1 }))
}

function generateUniqueCode(prefix: string): string {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
}

function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'OUT_OF_STOCK'
  return 'IN_STOCK'
}

/**
 * Effective selling coefficient from primary categoryId hierarchy only:
 * 1) L2 (own) when valid (non-null and > 0)
 * 2) Else L1 (parent) when valid
 * 3) Else DEFAULT_PRICE_COEFFICIENT (2.00)
 *
 * Ignores product.priceCoefficient, brand relation categories, and recommend-zone tags.
 */
function resolveEffectiveCoefficient(
  ownCategoryCoefficient: number | null,
  parentCategoryCoefficient: number | null = null,
): number {
  return resolveCategoryPriceCoefficient(
    toNumber(ownCategoryCoefficient),
    toNumber(parentCategoryCoefficient),
  )
}

/**
 * 列表/详情「当前系数」：商品级 priceCoefficient 优先（批量改价系数写在这儿），
 * 未设置或无效时再回退主类目继承系数。否则批量改完商品系数列表仍只显示类目系数看起来像「没更新」。
 */
function resolveListDisplayCoefficient(
  productPriceCoefficient: number | null | undefined,
  ownCategoryCoefficient: number | null,
  parentCategoryCoefficient: number | null = null,
): number {
  const productCoeff = toNumber(productPriceCoefficient)
  if (productCoeff != null && Number.isFinite(productCoeff) && productCoeff > 0) {
    return productCoeff
  }
  return resolveEffectiveCoefficient(ownCategoryCoefficient, parentCategoryCoefficient)
}

function getCategoryHierarchyCoefficients(
  categoryMap: Map<string, CategoryMeta>,
  categoryId: string | null | undefined,
  fallback?: CategoryMeta | null,
): { own: number | null; parent: number | null; main: CategoryMeta | null; current: CategoryMeta | null } {
  const current = (categoryId ? categoryMap.get(categoryId) : null) || fallback || null
  const parent = current?.parentId ? categoryMap.get(current.parentId) || null : null
  let main = current
  let guard = 0
  while (main?.parentId && guard < 10) {
    const next = categoryMap.get(main.parentId)
    if (!next) break
    main = next
    guard += 1
  }
  return {
    own: current && !isAggregatePricingCategoryName(current.name) && !isBrandCategoryMeta(current, categoryMap)
      ? toNumber(current.priceCoefficient)
      : null,
    parent: parent && !isAggregatePricingCategoryName(parent.name) && !isBrandCategoryMeta(parent, categoryMap)
      ? toNumber(parent.priceCoefficient)
      : null,
    main: main || null,
    current,
  }
}

function getEffectivePriceCoefficient(product: {
  category?: { priceCoefficient?: any; parentId?: string | null } | null
}): number {
  return resolveEffectiveCoefficient(toNumber(product.category?.priceCoefficient), null)
}

async function findPublishedImportProductByName(name?: string | null): Promise<PublishedImportMatchDbRecord | null> {
  const normalizedName = String(name || '').trim()
  if (!normalizedName) return null

  const matchedItem = await prisma.importtaskitem.findFirst({
    where: {
      isPublished: true,
      publishStatus: 'COMPLETED',
      importedProductId: { not: null },
      OR: [
        { parsedName: normalizedName },
        { parsedName: normalizedName }
      ]
    },
    orderBy: { updatedAt: 'desc' },
    select: { importedProductId: true }
  })

  if (!matchedItem?.importedProductId) {
    return null
  }

  return prisma.product.findFirst({
    where: {
      id: matchedItem.importedProductId,
      source: 'IMPORT_1688'
    },
    include: {
      category: { select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true } },
      brandCategory: { select: { id: true, name: true } },
      relationCategories: {
        select: {
          categoryId: true,
          category: { select: { id: true, name: true } },
        },
      },
      skus: {
        select: {
          id: true,
          skuCode: true,
          price: true,
          originalPrice: true,
          stock: true,
          weightKg: true,
          attributeJson: true
        },
        orderBy: { skuCode: 'asc' }
      }
    }
  })
}

async function mapProductToListItem(product: PublishedImportMatchDbRecord): Promise<ProductListItem> {
  const boundIds = [
    product.categoryId,
    product.brandCategoryId,
    ...(product.relationCategories || []).map(rel => rel.categoryId),
  ].filter(Boolean) as string[]
  const { categoryMap } = await getCategoryMetaMap(prisma, boundIds)
  const boundCategories = buildBoundCategories(product, categoryMap)
  const pricingCategoryId =
    boundCategories.find(tag => tag.is_pricing)?.category_id ||
    (isBrandCategoryMeta(categoryMap.get(product.categoryId) || null, categoryMap)
      ? null
      : product.categoryId)
  const primaryMeta = categoryMap.get(product.categoryId) || null
  const prices = product.skus.map(s => toNumber(s.price) ?? 0)
  const priceMin = prices.length > 0 ? Math.min(...prices) : 0
  const priceMax = prices.length > 0 ? Math.max(...prices) : 0
  const totalStock = product.skus.reduce((sum, s) => sum + s.stock, 0)
  const { own, parent, main, current } = getCategoryHierarchyCoefficients(
    categoryMap,
    pricingCategoryId || product.categoryId,
    pricingCategoryId ? categoryMap.get(pricingCategoryId) || null : product.category,
  )
  const categoryEffectiveCoefficient =
    (own !== null && own > 0) || (parent !== null && parent > 0)
      ? resolveCategoryPriceCoefficient(own, parent)
      : null
  const mainCategoryCoefficient = categoryEffectiveCoefficient ?? toNumber(main?.priceCoefficient)
  const effectiveCoefficient = resolveListDisplayCoefficient(
    toNumber(product.priceCoefficient),
    own,
    parent,
  )
  const mappedGoodsStatus = product.status === 'DRAFT'
    ? 'DELETED'
    : normalizeGoodsStatus(product.goodsStatus) || mapProductStatusToGoodsStatus(product.status as ProductStatus)

  return {
    product_id: product.id,
    product_name: product.name,
    sku_code_base: product.productCode,
    source: product.source as ProductSource,
    supplier_name: product.supplierName || null,
    brand_keyword: product.brandName || null,
    category_id: product.categoryId,
    category_name: primaryMeta?.name || product.category?.name || '--',
    category_level: primaryMeta?.level ?? null,
    parent_category_id: primaryMeta?.parentId || null,
    parent_category_name: primaryMeta?.parentId ? (categoryMap.get(primaryMeta.parentId)?.name || null) : null,
    main_category_id: main?.id || pricingCategoryId || product.categoryId,
    main_category_name: main?.name || current?.name || primaryMeta?.name || product.category?.name || '--',
    main_category_price_coefficient: mainCategoryCoefficient,
    bound_categories: boundCategories,
    goods_status: mappedGoodsStatus,
    weight_gram: toNumber(product.weightGram),
    cost_price: toNumber(product.costPrice),
    price_coefficient: toNumber(product.priceCoefficient),
    effective_price_coefficient: effectiveCoefficient,
    min_order_qty: Math.max(1, Number((product.tradeInfoJson as any)?.minOrderQty ?? 0) || 1),
    price_min: priceMin,
    price_max: priceMax,
    usd_display_price_min: toUsdDisplayPrice(priceMin) ?? 0,
    usd_display_price_max: toUsdDisplayPrice(priceMax) ?? 0,
    total_stock: totalStock,
    status: product.status as ProductStatus,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
    skus: mapProductSkusToListItems(product)
  }
}

function formatSkuSpecText(attributes: SkuAttribute[]): string {
  const values = attributes.map(attr => String(attr.value || '').trim()).filter(Boolean)
  return values.length > 0 ? values.join(' / ') : '默认规格'
}

function mapProductSkusToListItems(product: {
  costPrice?: any
  skus: Array<{
    id: string
    skuCode: string
    minOrderQty?: any
    price: any
    originalPrice?: any
    stock: number
    weightKg?: any
    attributeJson?: any
  }>
}): ProductListSkuItem[] {
  return product.skus.map(sku => {
    const price = toNumber(sku.price) ?? 0
    const originalPrice = toNumber(sku.originalPrice)
    const weightKg = toNumber(sku.weightKg)
    const attributeJson = Array.isArray(sku.attributeJson)
      ? (sku.attributeJson as SkuAttribute[]).map(attr => ({
          name: String(attr?.name || '规格'),
          value: String(attr?.value || '')
        }))
      : []
    return {
      sku_id: sku.id,
      sku_code: sku.skuCode,
      min_order_qty: null,
      price,
      original_price: originalPrice,
      stock: sku.stock,
      weight_kg: weightKg,
      weight_gram: weightKg != null ? Math.round(weightKg * 1000) : null,
      cost_price: toNumber(product.costPrice),
      attribute_json: attributeJson,
      spec_text: formatSkuSpecText(attributeJson),
      usd_display_price: toUsdDisplayPrice(price)
    }
  })
}

function calculateSkuRmbPrice(costPrice: number, coefficient: number): number {
  return roundCurrency(costPrice * coefficient)
}

function mapSkuPriceFields(sku: { price: any; originalPrice?: any | null }) {
  const price = toNumber(sku.price) ?? 0
  const originalPrice = toNumber(sku.originalPrice)
  return {
    price,
    originalPrice,
    usd_display_price: toUsdDisplayPrice(price),
    usd_display_original_price: toUsdDisplayPrice(originalPrice)
  }
}

const HOME_FEATURED_KEYWORDS_SETTING_TYPE = 'HOME_FEATURED_KEYWORDS'

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return Array.from(new Set(values.map(item => String(item || '').trim()).filter(Boolean)))
}

async function buildProductBindingMeta(): Promise<ProductBindingMetaOutput> {
  const [categories, keywords] = await Promise.all([
    prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ level: 'asc' }, { sortWeight: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, parentId: true, level: true }
    }),
    prisma.keyworditem.findMany({
      where: { isActive: true },
      orderBy: [{ sortWeight: 'desc' }, { keyword: 'asc' }],
      select: { id: true, keyword: true, group: { select: { name: true } } }
    })
  ])

  return {
    category_options: buildHierarchicalCategorySelectOptions(categories),
    keyword_options: keywords.map(keyword => ({
      value: keyword.id,
      label: keyword.group?.name ? `${keyword.group.name} / ${keyword.keyword}` : keyword.keyword
    }))
  }
}

async function replaceProductCategoryRelations(tx: any, productId: string, linkedCategoryIds: string[]) {
  const normalizedCategoryIds = Array.from(new Set(linkedCategoryIds.filter(Boolean)))
  await tx.product_category_relations.deleteMany({ where: { productId } })
  if (normalizedCategoryIds.length > 0) {
    await tx.product_category_relations.createMany({
      data: normalizedCategoryIds.map(categoryId => ({ productId, categoryId })),
      skipDuplicates: true
    })
  }
}

function buildBoundCategories(
  product: {
    categoryId: string
    brandCategoryId?: string | null
    category?: { id: string; name: string } | null
    brandCategory?: { id: string; name: string } | null
    relationCategories?: Array<{
      categoryId: string
      category?: { id: string; name: string } | null
    }>
  },
  categoryMap: Map<string, CategoryMeta> = new Map(),
): ProductBoundCategoryTag[] {
  const map = new Map<string, ProductBoundCategoryTag>()

  const resolveBrandFlag = (id: string | null | undefined, explicitBrand?: boolean) => {
    if (explicitBrand) return true
    if (id && product.brandCategoryId && id === product.brandCategoryId) return true
    return isBrandCategoryMeta(categoryMap.get(id || '') || null, categoryMap)
  }

  const upsert = (
    id: string | null | undefined,
    name: string | null | undefined,
    flags: { is_primary?: boolean; is_brand?: boolean } = {},
  ) => {
    if (!id) return
    const isBrand = resolveBrandFlag(id, flags.is_brand)
    const existing = map.get(id)
    if (existing) {
      if (flags.is_primary) existing.is_primary = true
      if (isBrand) existing.is_brand = true
      if (name && (!existing.category_name || existing.category_name === '--')) {
        existing.category_name = name
      }
      return
    }
    map.set(id, {
      category_id: id,
      category_name: name || categoryMap.get(id)?.name || '--',
      is_primary: !!flags.is_primary,
      is_brand: isBrand,
      is_pricing: false,
    })
  }

  upsert(product.categoryId, product.category?.name, { is_primary: true })
  upsert(product.brandCategoryId, product.brandCategory?.name, {
    is_brand: true,
    is_primary: product.brandCategoryId === product.categoryId,
  })
  for (const rel of product.relationCategories || []) {
    upsert(rel.categoryId, rel.category?.name, {
      is_primary: rel.categoryId === product.categoryId,
      is_brand: !!product.brandCategoryId && rel.categoryId === product.brandCategoryId,
    })
  }

  const tags = Array.from(map.values())
  const pricingCategoryId = pickPricingCategoryId(tags, categoryMap, product.categoryId)
  for (const tag of tags) {
    tag.is_pricing = !!pricingCategoryId && tag.category_id === pricingCategoryId && !tag.is_brand
  }

  return tags.sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    if (a.is_pricing !== b.is_pricing) return a.is_pricing ? -1 : 1
    if (a.is_brand !== b.is_brand) return a.is_brand ? -1 : 1
    return a.category_name.localeCompare(b.category_name)
  })
}

async function ensureUncategorizedCategoryId(tx: any): Promise<string> {
  const existing = await tx.category.findFirst({
    where: {
      OR: [{ slug: 'uncategorized' }, { name: '未分类' }],
    },
    select: { id: true },
  })
  if (existing?.id) return existing.id

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
  return created.id
}

async function replaceProductKeywordRelations(tx: any, productId: string, linkedKeywordIds: string[]) {
  const normalizedKeywordIds = Array.from(new Set(linkedKeywordIds.filter(Boolean)))
  await tx.product_keyword_relations.deleteMany({ where: { productId } })
  if (normalizedKeywordIds.length > 0) {
    await tx.product_keyword_relations.createMany({
      data: normalizedKeywordIds.map(keywordId => ({ productId, keywordId })),
      skipDuplicates: true
    })
  }
}

function buildCreateManyValues(rows: string[][]): string {
  return rows.map(row => `(${row.join(', ')})`).join(', ')
}

function buildRelationRows(productIds: string[], relationIds: string[]) {
  const normalizedProductIds = Array.from(new Set(productIds.filter(Boolean)))
  const normalizedRelationIds = Array.from(new Set(relationIds.filter(Boolean)))
  return normalizedProductIds.flatMap(productId => normalizedRelationIds.map(relationId => ({ productId, relationId })))
}

/** Resolve a category id plus all descendant ids (L1 → L2…). */
async function resolveCategoryFilterIds(categoryId: string): Promise<string[]> {
  const rootId = String(categoryId || '').trim()
  if (!rootId) return []

  const all = await prisma.category.findMany({
    select: { id: true, parentId: true }
  })
  const childrenMap = new Map<string, string[]>()
  for (const item of all) {
    if (!item.parentId) continue
    const list = childrenMap.get(item.parentId) || []
    list.push(item.id)
    childrenMap.set(item.parentId, list)
  }

  const result = new Set<string>([rootId])
  const stack = [rootId]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const childId of childrenMap.get(current) || []) {
      if (result.has(childId)) continue
      result.add(childId)
      stack.push(childId)
    }
  }
  return Array.from(result)
}

function buildHierarchicalCategorySelectOptions(
  categories: Array<{ id: string; name: string; parentId: string | null; level: number | null }>
): SelectOption[] {
  type TreeNode = {
    id: string
    name: string
    parentId: string | null
    level: number | null
    children: TreeNode[]
  }

  const map = new Map<string, TreeNode>()
  categories.forEach(category => {
    map.set(category.id, {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      level: category.level,
      children: []
    })
  })

  const roots: TreeNode[] = []
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const levelDiff = (a.level || 0) - (b.level || 0)
      if (levelDiff !== 0) return levelDiff
      return a.name.localeCompare(b.name, 'zh-CN')
    })
    nodes.forEach(node => sortNodes(node.children))
  }
  sortNodes(roots)

  const options: SelectOption[] = []
  const walk = (node: TreeNode, depth: number) => {
    const prefix = depth > 0 ? `${'　'.repeat(depth)}└ ` : ''
    options.push({
      value: node.id,
      label: `${prefix}${node.name}`,
      parent_id: node.parentId,
      level: node.level,
      depth
    })
    node.children.forEach(child => walk(child, depth + 1))
  }
  roots.forEach(root => walk(root, 0))
  return options
}

function normalizeFeaturedKeywords(contentJson: unknown): string[] {
  const rawKeywords = (contentJson as { keywords?: unknown } | null)?.keywords
  if (!Array.isArray(rawKeywords)) return []

  return Array.from(
    new Set(
      rawKeywords
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    )
  )
}

interface CategoryMeta {
  id: string
  name: string
  slug?: string | null
  parentId: string | null
  level: number | null
  priceCoefficient: any
  isBrandCategory?: boolean | null
}

/** Brand L1 (isBrandCategory / name Brand) or Brand L2 (parent is Brand shelf). */
function isBrandCategoryMeta(
  category: CategoryMeta | null | undefined,
  categoryMap: Map<string, CategoryMeta>,
): boolean {
  if (!category) return false
  if (category.isBrandCategory) return true
  if (String(category.name || '').trim().toLowerCase() === 'brand') return true
  if (!category.parentId) return false
  const parent = categoryMap.get(category.parentId)
  if (!parent) return false
  if (parent.isBrandCategory) return true
  return String(parent.name || '').trim().toLowerCase() === 'brand'
}

/**
 * Pricing source among bound tags: brands never price.
 * Prefer primary when it is a real category; else L2 child over L1 parent.
 */
function pickPricingCategoryId(
  tags: Array<Pick<ProductBoundCategoryTag, 'category_id' | 'is_primary' | 'is_brand'>>,
  categoryMap: Map<string, CategoryMeta>,
  primaryCategoryId: string,
): string | null {
  const real = tags.filter(tag => !tag.is_brand)
  if (real.length === 0) return null

  const primaryReal = real.find(tag => tag.category_id === primaryCategoryId || tag.is_primary)
  if (primaryReal && !primaryReal.is_brand) return primaryReal.category_id

  const ranked = [...real].sort((a, b) => {
    const levelA = categoryMap.get(a.category_id)?.level ?? 0
    const levelB = categoryMap.get(b.category_id)?.level ?? 0
    // Prefer L2 (child) over L1 (parent)
    if (levelA !== levelB) return levelB - levelA
    return a.category_id.localeCompare(b.category_id)
  })
  return ranked[0]?.category_id || null
}

async function getCategoryMetaMap(tx: any, categoryIds: string[]): Promise<{ categoryMap: Map<string, CategoryMeta>; resolveMainCategory: (categoryId: string | null) => CategoryMeta | null }> {
  const uniqueIds = Array.from(new Set(categoryIds.filter(Boolean)))
  const categoryMap = new Map<string, CategoryMeta>()

  let pendingIds = uniqueIds.filter(id => !categoryMap.has(id))
  let guard = 0
  while (pendingIds.length > 0 && guard < 10) {
    const batch: CategoryMeta[] = await tx.category.findMany({
      where: { id: { in: pendingIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        level: true,
        priceCoefficient: true,
        isBrandCategory: true,
      },
    })
    batch.forEach((item: CategoryMeta) => categoryMap.set(item.id, item))
    pendingIds = Array.from(
      new Set(
        batch
          .map((item: CategoryMeta) => item.parentId)
          .filter((id: string | null | undefined): id is string => !!id && !categoryMap.has(id))
      )
    )
    guard += 1
  }

  const resolveMainCategory = (categoryId: string | null) => {
    let current: CategoryMeta | null = categoryId ? (categoryMap.get(categoryId) || null) : null
    let walkGuard = 0
    while (current?.parentId && walkGuard < 10) {
      const parent = categoryMap.get(current.parentId)
      if (!parent) break
      current = parent
      walkGuard += 1
    }
    return current || null
  }

  return { categoryMap, resolveMainCategory }
}

async function syncCartItemsValidState(tx: any, productId: string) {
  const items = await tx.cartitem.findMany({
    where: { productId },
    include: {
      product: { select: { status: true, category: { select: { status: true } } } },
      productSku: { select: { stock: true } }
    }
  })

  for (const item of items) {
    const isValid = item.product.status === 'ACTIVE' && item.product.category.status === 'ACTIVE' && item.productSku.stock >= item.quantity
    const targetStatus: CartItemStatus = isValid ? 'VALID' : 'INVALID'
    if (item.status !== targetStatus) {
      await tx.cartitem.update({ where: { id: item.id }, data: { status: targetStatus } })
    }
  }
}

async function recalculateProductSkuPrices(tx: any, productId: string, coefficient: number) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    include: { skus: true }
  })
  if (!product) throw new Error('商品不存在')
  const costPrice = toNumber(product.costPrice)
  if (costPrice === null || costPrice < 0) {
    throw new Error('商品缺少有效成本价，无法重算售价')
  }

  const nextPrice = calculateSkuRmbPrice(costPrice, coefficient)
  const nextOriginalPrice = roundCurrency(nextPrice * 1.1)

  for (const sku of product.skus) {
    await tx.productsku.update({
      where: { id: sku.id },
      data: {
        price: nextPrice,
        originalPrice: nextOriginalPrice
      }
    })
  }

  return { nextPrice, nextOriginalPrice }
}

async function applyProductCoefficient(tx: any, productId: string, coefficient: number) {
  await tx.product.update({
    where: { id: productId },
    data: { priceCoefficient: coefficient }
  })
  await recalculateProductSkuPrices(tx, productId, coefficient)
}

async function applyCategoryCoefficient(tx: any, productId: string) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true } }
    }
  })
  if (!product) throw new Error('商品不存在')
  const { categoryMap } = await getCategoryMetaMap(tx, [product.categoryId])
  const { own, parent } = getCategoryHierarchyCoefficients(categoryMap, product.categoryId, product.category)
  const categoryCoefficient = resolveCategoryPriceCoefficient(own, parent)
  await recalculateProductSkuPrices(tx, productId, categoryCoefficient)
}

function validateActivePreconditions(product: Omit<CreateProductInput, 'submit_action'>) {
  if (!product.name || product.name.trim() === '') throw new Error('商品名称不能为空')
  if (!product.category_id) throw new Error('商品分类不能为空')
  if (!product.goods_status) throw new Error('货物状态不能为空')
  if (product.weight_gram === null || product.weight_gram === undefined || product.weight_gram <= 0) throw new Error('商品重量必须大于0')
  if (product.cost_price === null || product.cost_price === undefined || product.cost_price < 0) throw new Error('成本价不能为空')
  if (product.price_coefficient === null || product.price_coefficient === undefined || product.price_coefficient <= 0) throw new Error('价格系数必须大于0')
  if (!product.main_image_url && (!product.gallery_json || product.gallery_json.length === 0)) throw new Error('至少存在1个有效图片URL方可上架')
  if (!product.skus || product.skus.length === 0) throw new Error('商品至少存在1个SKU才能上架')
  const hasInvalidSku = product.skus.some(sku => sku.price <= 0 || sku.stock < 0)
  if (hasInvalidSku) throw new Error('每个可售SKU必须有有效价格且库存不能为负数')
  if (!product.short_description && !product.detail_text && (!product.detail_content_json || product.detail_content_json.length === 0)) {
    throw new Error('商品必须包含基础描述内容')
  }
}

function splitCommaOptionValues(raw?: string | null): string[] {
  return String(raw || '')
    .split(/[,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function resolvePrimaryCategoryToken(raw?: string | null) {
  return splitCommaOptionValues(raw)[0] || ''
}

async function resolveCategoryIdentifierMeta(tx: any, categoryId: string) {
  const category = await tx.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, slug: true }
  })
  if (!category) throw new Error('未找到目标主分类')
  // Existing categories may still have null/empty slug; auto-generate + persist then continue.
  const slug = await ensureCategorySlugPersisted(tx, category)
  const shortCode = resolveCategoryShortCode(slug)
  if (!shortCode) {
    throw new Error(`分类「${category.name}」未配置可用简码，请先完善 slug 后再导入`)
  }
  return { categoryId: category.id, categoryName: category.name, shortCode }
}

async function resolveCategoryByNameOrId(tx: any, rawCategoryName: string | null | undefined, fallbackCategoryId?: string) {
  const primaryName = resolvePrimaryCategoryToken(rawCategoryName)
  if (primaryName) {
    const matched = await tx.category.findFirst({
      where: {
        name: primaryName,
        isBrandCategory: false,
      },
      orderBy: [{ level: 'asc' }, { sortWeight: 'desc' }, { name: 'asc' }],
      select: { id: true }
    })
    if (!matched) {
      throw new Error(`未找到主分类「${primaryName}」对应的系统分类`)
    }
    return resolveCategoryIdentifierMeta(tx, matched.id)
  }
  if (!fallbackCategoryId) {
    throw new Error('未提供可用主分类，无法生成商品编号')
  }
  return resolveCategoryIdentifierMeta(tx, fallbackCategoryId)
}

async function generateStructuredSpuCode(tx: any, shortCode: string, now = new Date()) {
  const yearMonth = formatIdentifierYearMonth(now)
  const prefix = `${shortCode}${yearMonth}`
  const existing = await tx.product.findMany({
    where: { productCode: { startsWith: prefix } },
    select: { productCode: true }
  })
  const maxSerial = existing.reduce((max: number, item: { productCode: string }) => {
    const suffix = Number(item.productCode.slice(prefix.length))
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max
  }, 0)
  return `${prefix}${String(maxSerial + 1).padStart(4, '0')}`
}

function buildDraftSkus(row: BatchImportDraftRow, spuCode?: string): SkuItem[] {
  const colors = (row.colors && row.colors.length > 0)
    ? row.colors.map(item => item.trim()).filter(Boolean)
    : splitCommaOptionValues(row.color)
  const specs = (row.specs && row.specs.length > 0)
    ? row.specs.map(item => item.trim()).filter(Boolean)
    : splitCommaOptionValues(row.spec)

  const hasProductPrice = row.product_price !== null && row.product_price !== undefined && !Number.isNaN(Number(row.product_price))
  const costPrice = hasProductPrice ? Number(row.product_price) : (row.cost_price ?? 0)
  const coefficient = hasProductPrice
    ? 1
    : (row.price_coefficient && row.price_coefficient > 0 ? row.price_coefficient : DEFAULT_PRICE_COEFFICIENT)
  const price = calculateSkuRmbPrice(costPrice, coefficient)
  const originalPrice = roundCurrency(price * 1.1)
  const weightKg = row.weight_gram ? Number((row.weight_gram / 1000).toFixed(3)) : null
  const imageUrl = row.main_image_url || row.gallery_urls?.[0] || ''
  const attrGroups: SkuAttribute[][] = []
  if (colors.length > 0) attrGroups.push(colors.map(value => ({ name: '颜色', value })))
  if (specs.length > 0) attrGroups.push(specs.map(value => ({ name: '规格', value })))

  const combinations = attrGroups.length === 0
    ? [[]] as SkuAttribute[][]
    : attrGroups.reduce<SkuAttribute[][]>((acc, group) => {
        if (acc.length === 0) return group.map(item => [item])
        const next: SkuAttribute[][] = []
        acc.forEach(existing => group.forEach(item => next.push([...existing, item])))
        return next
      }, [])

  return combinations.map((attrs, index) => {
    const specValue = attrs.find(attr => attr.name === '规格' || attr.name === '尺码')?.value || row.spec || `SPEC${index + 1}`
    const colorValue = attrs.find(attr => attr.name === '颜色')?.value || row.color || ''
    // 有 SPU 时始终按 SPU 生成 SKU，忽略表格 sku_code（常被误填为价格）
    const skuCode = spuCode
      ? buildSkuIdentifier(spuCode, specValue, colorValue, index)
      : generateUniqueCode('SKU')
    return {
      sku_code: skuCode,
      image_url: imageUrl,
      price,
      original_price: originalPrice,
      stock: 1,
      attribute_json: attrs,
      weight_kg: weightKg,
      usd_display_price: toUsdDisplayPrice(price),
      usd_display_original_price: toUsdDisplayPrice(originalPrice)
    }
  })
}

export const getProductBindingMeta = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<ProductBindingMetaOutput> => {
    return buildProductBindingMeta()
  })
)

export const getCategoryOptions = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<CategoryOption[]> => {
    const categories = await prisma.category.findMany({
      orderBy: [{ level: 'asc' }, { sortWeight: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true }
    })
    return categories.map(c => ({
      category_id: c.id,
      category_name: c.name,
      parent_id: c.parentId,
      level: c.level,
      price_coefficient: toNumber(c.priceCoefficient)
    }))
  })
)

/** 检测中文被 MySQL gbk 连接写成问号的脏数据 */
const isCharsetCorruptedText = (value?: string | null) => {
  if (!value) return false
  return /\[1688\?+\]/.test(value) || /(^|[^\w])\?{2,}([^\w]|$)/.test(value) || value.includes('????')
}

/** 打开商品列表时，自动修复已被写成 ? 的商品名称 / 供应商 */
const repairCharsetCorruptedProducts = async () => {
  const candidates = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: '?' } },
        { supplierName: { contains: '?' } }
      ]
    },
    select: {
      id: true,
      name: true,
      supplierName: true,
      source: true,
      productCode: true
    },
    take: 300
  })

  const corrupted = candidates.filter(
    item => isCharsetCorruptedText(item.name) || isCharsetCorruptedText(item.supplierName)
  )
  if (corrupted.length === 0) return 0

  await prisma.$transaction(
    corrupted.map(item => {
      const shortId = item.id.slice(0, 6)
      const nextName = isCharsetCorruptedText(item.name)
        ? (item.source === 'IMPORT_1688'
          ? `[1688抓取] 工业配件 ${shortId}`
          : `商品 ${item.productCode || shortId}`)
        : item.name
      const nextSupplier = isCharsetCorruptedText(item.supplierName)
        ? (item.source === 'IMPORT_1688' ? '1688 默认供应商' : '本地供应商')
        : item.supplierName
      return prisma.product.update({
        where: { id: item.id },
        data: {
          name: nextName,
          supplierName: nextSupplier
        }
      })
    })
  )

  return corrupted.length
}

/** Hot-path throttle: full charset scan must not run on every list open. */
let lastProductCharsetRepairAt = 0
const PRODUCT_CHARSET_REPAIR_INTERVAL_MS = 10 * 60 * 1000

export const getProductList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetProductListInput): Promise<GetProductListOutput> => {
    try {
      await prisma.$executeRawUnsafe('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')
    } catch (error) {
      console.error('[getProductList] failed to set utf8mb4 session charset', error)
    }

    // Side-effect repair was on every list call (findMany take 300 + updates) and added multi-hundred-ms latency.
    if (Date.now() - lastProductCharsetRepairAt >= PRODUCT_CHARSET_REPAIR_INTERVAL_MS) {
      lastProductCharsetRepairAt = Date.now()
      try {
        const repairedCount = await repairCharsetCorruptedProducts()
        if (repairedCount > 0) {
          console.info(`[getProductList] repaired ${repairedCount} charset-corrupted products`)
        }
      } catch (error) {
        console.error('[getProductList] failed to repair charset-corrupted products', error)
      }
    }

    const { keyword, category_id, status, goods_status, status_filter, supplier_name, brand_keyword, page = 1, page_size = 20 } = input

    const whereClause: any = {}
    const andConditions: any[] = []

    if (keyword) {
      const normalizedKeyword = keyword.trim()
      andConditions.push({
        OR: [
          { name: { contains: normalizedKeyword } },
          { productCode: { contains: normalizedKeyword } }
        ]
      })
    }
    if (category_id) {
      const categoryIds = await resolveCategoryFilterIds(category_id)
      andConditions.push({
        OR: [
          { categoryId: { in: categoryIds } },
          { relationCategories: { some: { categoryId: { in: categoryIds } } } }
        ]
      })
    }
    if (andConditions.length > 0) {
      whereClause.AND = andConditions
    }
    const normalizedStatusList = status
      ? (Array.isArray(status) ? status : [status])
      : mapStatusFilterToProductStatus(status_filter)
    const shouldIncludeDraftResultsForNameSearch = Boolean(keyword?.trim())
    const effectiveStatusList =
      shouldIncludeDraftResultsForNameSearch && normalizedStatusList
        ? Array.from(new Set([...normalizedStatusList, 'DRAFT']))
        : normalizedStatusList
    if (effectiveStatusList && effectiveStatusList.length > 0) {
      whereClause.status = { in: effectiveStatusList.map(s => s.toUpperCase()) }
    }
    if (goods_status) {
      whereClause.goodsStatus = goods_status
    }
    if (status_filter === 'DRAFT') {
      whereClause.goodsStatus = 'DRAFT'
    }
    if (status_filter === 'DELETED') {
      whereClause.goodsStatus = 'DELETED'
    }
    if (supplier_name?.trim()) {
      whereClause.supplierName = { contains: supplier_name.trim() }
    }
    if (brand_keyword?.trim()) {
      whereClause.brandName = { contains: brand_keyword.trim() }
    }

    const skip = (page - 1) * page_size

    const [products, publishedImportMatchRecord] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: page_size,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true } },
          brandCategory: { select: { id: true, name: true } },
          relationCategories: {
            select: {
              categoryId: true,
              category: { select: { id: true, name: true } },
            },
          },
          skus: {
            select: {
              id: true,
              skuCode: true,
              price: true,
              originalPrice: true,
              stock: true,
              weightKg: true,
              attributeJson: true
            },
            orderBy: { skuCode: 'asc' }
          }
        }
      }),
      findPublishedImportProductByName(keyword)
    ])

    const allCategoryIds = products.flatMap(p => [
      p.categoryId,
      p.brandCategoryId,
      ...(p.relationCategories || []).map((rel: { categoryId: string }) => rel.categoryId),
    ]).filter(Boolean) as string[]
    const { categoryMap } = await getCategoryMetaMap(prisma, allCategoryIds)

    const list = products.map(p => {
      const prices = p.skus.map(s => toNumber(s.price) ?? 0)
      const priceMin = prices.length > 0 ? Math.min(...prices) : 0
      const priceMax = prices.length > 0 ? Math.max(...prices) : 0
      const totalStock = p.skus.reduce((sum, s) => sum + s.stock, 0)
      const boundCategories = buildBoundCategories(p, categoryMap)
      const pricingCategoryId =
        boundCategories.find(tag => tag.is_pricing)?.category_id ||
        (isBrandCategoryMeta(categoryMap.get(p.categoryId) || null, categoryMap) ? null : p.categoryId)
      const primaryMeta = categoryMap.get(p.categoryId) || null
      const { own, parent, main, current } = getCategoryHierarchyCoefficients(
        categoryMap,
        pricingCategoryId || p.categoryId,
        pricingCategoryId ? categoryMap.get(pricingCategoryId) || null : p.category,
      )
      const categoryEffectiveCoefficient =
        (own !== null && own > 0) || (parent !== null && parent > 0)
          ? resolveCategoryPriceCoefficient(own, parent)
          : null
      const mainCategoryCoefficient = categoryEffectiveCoefficient ?? toNumber(main?.priceCoefficient)
      const effectiveCoefficient = resolveListDisplayCoefficient(
        toNumber(p.priceCoefficient),
        own,
        parent,
      )
      const mappedGoodsStatus = normalizeGoodsStatus(p.goodsStatus) || mapProductStatusToGoodsStatus(p.status as ProductStatus)

      return {
        product_id: p.id,
        product_name: p.name,
        sku_code_base: p.productCode,
        source: p.source as ProductSource,
        supplier_name: p.supplierName || null,
        brand_keyword: p.brandName || null,
        category_id: p.categoryId,
        category_name: primaryMeta?.name || p.category?.name || '--',
        category_level: primaryMeta?.level ?? null,
        parent_category_id: primaryMeta?.parentId || null,
        parent_category_name: primaryMeta?.parentId ? (categoryMap.get(primaryMeta.parentId)?.name || null) : null,
        main_category_id: main?.id || pricingCategoryId || p.categoryId,
        main_category_name: main?.name || current?.name || primaryMeta?.name || p.category?.name || '--',
        main_category_price_coefficient: mainCategoryCoefficient,
        bound_categories: boundCategories,
        goods_status: mappedGoodsStatus,
        weight_gram: toNumber(p.weightGram),
        cost_price: toNumber(p.costPrice),
        price_coefficient: toNumber(p.priceCoefficient),
        effective_price_coefficient: effectiveCoefficient,
        min_order_qty: Number((p.tradeInfoJson as any)?.minOrderQty ?? 0) || null,
        price_min: priceMin,
        price_max: priceMax,
        usd_display_price_min: toUsdDisplayPrice(priceMin) ?? 0,
        usd_display_price_max: toUsdDisplayPrice(priceMax) ?? 0,
        total_stock: totalStock,
        status: p.status as ProductStatus,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
        skus: mapProductSkusToListItems(p)
      }
    }).filter(item => {
      if (!effectiveStatusList || effectiveStatusList.length === 0) {
        return true
      }
      return effectiveStatusList.includes(item.status)
    })

    const published_import_match = publishedImportMatchRecord
      ? await mapProductToListItem(publishedImportMatchRecord)
      : null

    if (
      published_import_match &&
      !list.some(item => item.product_id === published_import_match.product_id)
    ) {
      list.unshift(published_import_match)
    }

    return { list, total: list.length, published_import_match }
  })
)

export const getProductDetail = requireRole([UserRole.ADMIN])(
  withResult(async (product_id: string): Promise<ProductDetail> => {
    const p = await prisma.product.findUnique({
      where: { id: product_id },
      include: {
        category: { select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true } },
        skus: true,
        relationCategories: { select: { categoryId: true } },
        relationKeywords: { select: { keywordId: true } }
      }
    })

    if (!p) throw new Error('商品不存在')

    const { categoryMap } = await getCategoryMetaMap(prisma, [p.categoryId])
    const { own, parent, main, current } = getCategoryHierarchyCoefficients(categoryMap, p.categoryId, p.category)
    const categoryEffectiveCoefficient =
      (own !== null && own > 0) || (parent !== null && parent > 0)
        ? resolveCategoryPriceCoefficient(own, parent)
        : null
    const mainCategoryCoefficient = categoryEffectiveCoefficient ?? toNumber(main?.priceCoefficient)

    return {
      product_id: p.id,
      category_id: p.categoryId,
      category_name: current?.name || p.category?.name || '--',
      main_category_id: main?.id || p.categoryId,
      main_category_name: main?.name || current?.name || p.category?.name || '--',
      main_category_price_coefficient: mainCategoryCoefficient,
      effective_price_coefficient: resolveListDisplayCoefficient(
        toNumber(p.priceCoefficient),
        own,
        parent,
      ),
      linked_category_ids: Array.from(p.relationCategories ?? [], (item: { categoryId: string }) => item.categoryId),
      linked_keyword_ids: Array.from(p.relationKeywords ?? [], (item: { keywordId: string }) => item.keywordId),
      name: p.name,
      product_code: p.productCode,
      source: p.source as ProductSource,
      supplier_name: p.supplierName || null,
      brand_keyword: p.brandName || null,
      status: p.status as ProductStatus,
      goods_status: normalizeGoodsStatus(p.goodsStatus),
      weight_gram: toNumber(p.weightGram),
      cost_price: toNumber(p.costPrice),
      price_coefficient: toNumber(p.priceCoefficient),
      detail_text: p.detailText,
      main_image_url: p.mainImageUrl,
      gallery_json: (p.galleryJson as any) || [],
      short_description: p.shortDescription,
      selling_points_json: p.sellingPointsJson as any,
      detail_content_json: (p.detailContentJson as any) || buildDetailContent(p.detailText || undefined, null),
      parameter_json: p.parameterJson as any,
      trade_info_json: p.tradeInfoJson as any,
      faq_json: p.faqJson as any,
      skus: p.skus.map(s => ({
        sku_id: s.id,
        sku_code: s.skuCode,
        image_url: s.imageUrl,
        min_order_qty: null,
        price: toNumber(s.price) ?? 0,
        original_price: toNumber(s.originalPrice),
        stock: s.stock,
        attribute_json: (s.attributeJson as any) || [],
        delivery_days: s.deliveryDays,
        weight_kg: toNumber(s.weightKg),
        volume_m3: toNumber(s.volumeM3),
        usd_display_price: toUsdDisplayPrice(toNumber(s.price)),
        usd_display_original_price: toUsdDisplayPrice(toNumber(s.originalPrice))
      }))
    }
  })
)

export const createProduct = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateProductInput): Promise<CreateProductOutput> => {
    if (input.submit_action === 'ACTIVE') {
      validateActivePreconditions(input)
    }

    const targetStatus: ProductStatus = input.submit_action
    const baseCode = input.product_code?.trim() || generateUniqueCode('P')
    const source = input.source || 'MANUAL'
    const nameEn = await resolveEnglishProductTitle(input.name)
    const nameEs = await resolveSpanishProductTitle(input.name, null, nameEn)
    const translationsJson = buildProductTranslationsJson({
      nameZh: input.name,
      nameEn,
      nameEs,
      shortDescriptionZh: input.short_description,
    })

    const result = await prisma.$transaction(async tx => {
      const { categoryMap } = await getCategoryMetaMap(tx, [input.category_id])
      const { own, parent } = getCategoryHierarchyCoefficients(categoryMap, input.category_id)
      const effectiveCoefficient = resolveEffectiveCoefficient(own, parent)
      const normalizedCostPrice = input.cost_price ?? 0

      const product = await tx.product.create({
        data: {
          name: input.name,
          slug: baseCode,
          productCode: baseCode,
          source,
          supplierName: input.supplier_name?.trim() || null,
          brandName: input.brand_keyword?.trim() || null,
          status: targetStatus,
          goodsStatus: normalizeGoodsStatus(input.goods_status),
          weightGram: input.weight_gram ?? null,
          costPrice: input.cost_price ?? null,
          priceCoefficient: input.price_coefficient ?? null,
          detailText: input.detail_text || null,
          mainImageUrl: input.main_image_url || '',
          galleryJson: buildGallery(input.main_image_url || '', input.gallery_json) as any,
          shortDescription: input.short_description || null,
          detailContentJson: buildDetailContent(input.detail_text, input.detail_content_json) as any,
          parameterJson: (input.parameter_json as any) || null,
          tradeInfoJson: normalizeTradeInfo(input.trade_info_json) as any,
          translationsJson: translationsJson as any,
          category: { connect: { id: input.category_id } },
          skus: {
            create: input.skus.map(s => {
              const nextPrice = normalizedCostPrice > 0 ? calculateSkuRmbPrice(normalizedCostPrice, effectiveCoefficient) : s.price
              const nextOriginalPrice = normalizedCostPrice > 0 ? roundCurrency(nextPrice * 1.1) : (s.original_price || null)
              return {
                skuCode: s.sku_code || generateUniqueCode('SKU'),
                imageUrl: s.image_url || null,
                minOrderQty: s.min_order_qty ?? null,
                price: nextPrice,
                originalPrice: nextOriginalPrice,
                stock: s.stock,
                stockStatus: getStockStatus(s.stock),
                attributeJson: (s.attribute_json as any) || [],
                deliveryDays: s.delivery_days || null,
                weightKg: s.weight_kg || null,
                volumeM3: s.volume_m3 || null
              }
            })
          }
        }
      })
      await replaceProductCategoryRelations(tx, product.id, input.linked_category_ids || [])
      await replaceProductKeywordRelations(tx, product.id, input.linked_keyword_ids || [])
      return product
    })

    return { product_id: result.id }
  })
)

export const batchImportProducts = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchImportProductsInput): Promise<BatchImportProductsOutput> => {
    let success = 0
    let fail = 0
    const errorMessages: string[] = []
    const groupedRows = new Map<string, BatchImportDraftRow[]>()

    for (const row of input.rows) {
      const groupKey = String(row.product_code || '').trim()
      if (!groupKey) {
        fail += 1
        errorMessages.push(`存在未填写产品编号的 Excel 行，无法识别同一 SPU`)
        continue
      }
      if (!groupedRows.has(groupKey)) groupedRows.set(groupKey, [])
      groupedRows.get(groupKey)!.push(row)
    }

    for (const [excelProductCode, rows] of groupedRows.entries()) {
      try {
        const firstRow = rows[0]
        const resolvedCategory = await resolveCategoryByNameOrId(prisma, firstRow.category_name, input.category_id)
        const generatedSpuCode = await generateStructuredSpuCode(prisma, resolvedCategory.shortCode)
        const galleryUrls = Array.from(new Set(rows.flatMap((row) => [
          ...(row.main_image_url ? [row.main_image_url] : []),
          ...((row.gallery_urls || []).filter(Boolean))
        ])))
        const productName = firstRow.name
        const hasProductPrice = rows.some((row) => row.product_price !== null && row.product_price !== undefined && !Number.isNaN(Number(row.product_price)))
        const firstProductPriceRow = rows.find((row) => row.product_price !== null && row.product_price !== undefined && !Number.isNaN(Number(row.product_price)))
        const firstCostPriceRow = rows.find((row) => row.cost_price !== null && row.cost_price !== undefined)
        const costPrice = hasProductPrice
          ? Number(firstProductPriceRow?.product_price)
          : (firstCostPriceRow?.cost_price ?? null)
        const priceCoefficient = hasProductPrice ? 1 : ((rows.find((row) => row.price_coefficient && row.price_coefficient > 0)?.price_coefficient) ?? DEFAULT_PRICE_COEFFICIENT)
        const mergedSkus = rows.flatMap((row) => {
          const colors = (row.colors && row.colors.length > 0) ? row.colors : splitCommaOptionValues(row.color)
          const specs = (row.specs && row.specs.length > 0) ? row.specs : splitCommaOptionValues(row.spec)
          return buildDraftSkus({ ...row, colors, specs, cost_price: costPrice, price_coefficient: priceCoefficient }, generatedSpuCode)
        })
        const dedupedSkus = Array.from(new Map(mergedSkus.map((sku) => [sku.sku_code, sku])).values())
        const detailContent = buildDetailContent(firstRow.detail_text, galleryUrls.slice(1).map(url => ({ type: 'image' as const, content: url })))
        const gallery = buildGallery(galleryUrls[0] || '', galleryUrls.map((url, index) => ({ url, sort: index + 1 })))
        await createProduct({
          category_id: resolvedCategory.categoryId,
          name: productName,
          product_code: generatedSpuCode,
          source: 'TABLE_IMPORT',
          supplier_name: firstRow.supplier_name?.trim() || null,
          brand_keyword: firstRow.brand_keyword?.trim() || null,
          goods_status: 'ACTIVE',
          weight_gram: firstRow.weight_gram ?? null,
          cost_price: costPrice,
          price_coefficient: priceCoefficient,
          detail_text: firstRow.detail_text || '',
          main_image_url: galleryUrls[0] || '',
          short_description: firstRow.detail_text || '',
          gallery_json: gallery,
          detail_content_json: detailContent,
          skus: dedupedSkus,
          submit_action: 'DRAFT'
        })
        success++
      } catch (error: any) {
        fail++
        errorMessages.push(`产品编号 ${excelProductCode}: ${error?.message || '导入失败'}`)
      }
    }

    return { success_count: success, fail_count: fail, error_messages: errorMessages.slice(0, 10) }
  })
)

export const updateProduct = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateProductInput): Promise<UpdateProductOutput> => {
    if (input.submit_action === 'ACTIVE') {
      validateActivePreconditions(input)
    }

    await prisma.$transaction(async tx => {
      const { categoryMap } = await getCategoryMetaMap(tx, [input.category_id])
      const { own, parent } = getCategoryHierarchyCoefficients(categoryMap, input.category_id)
      const effectiveCoefficient = resolveEffectiveCoefficient(own, parent)
      const normalizedCostPrice = input.cost_price ?? 0

      await tx.product.update({
        where: { id: input.product_id },
        data: {
          name: input.name,
          supplierName: input.supplier_name?.trim() || null,
          brandName: input.brand_keyword?.trim() || null,
          status: input.submit_action,
          goodsStatus: input.submit_action === 'DRAFT' ? 'DRAFT' : normalizeGoodsStatus(input.goods_status),
          weightGram: input.weight_gram ?? null,
          costPrice: input.cost_price ?? null,
          priceCoefficient: input.price_coefficient ?? null,
          detailText: input.detail_text || null,
          detailContentJson: buildDetailContent(input.detail_text, input.detail_content_json) as any,
          parameterJson: (input.parameter_json as any) || null,
          tradeInfoJson: normalizeTradeInfo(input.trade_info_json) as any,
          faqJson: (input.faq_json as any) || null,
          category: { connect: { id: input.category_id } }
        }
      })

      await replaceProductCategoryRelations(tx, input.product_id, input.linked_category_ids || [])
      await replaceProductKeywordRelations(tx, input.product_id, input.linked_keyword_ids || [])

      const existingSkus = await tx.productsku.findMany({ where: { productId: input.product_id }, select: { id: true } })
      const existingSkuIds = existingSkus.map((s: any) => s.id)
      const incomingSkuIds = input.skus.filter(s => s.sku_id).map(s => s.sku_id!)

      const skusToDelete = existingSkuIds.filter((id: string) => !incomingSkuIds.includes(id))
      if (skusToDelete.length > 0) {
        await tx.cartitem.deleteMany({ where: { productSkuId: { in: skusToDelete } } })
        await tx.productsku.deleteMany({ where: { id: { in: skusToDelete } } })
      }

      for (const sku of input.skus) {
        const nextPrice = normalizedCostPrice > 0 ? calculateSkuRmbPrice(normalizedCostPrice, effectiveCoefficient) : sku.price
        const nextOriginalPrice = normalizedCostPrice > 0 ? roundCurrency(nextPrice * 1.1) : (sku.original_price || null)
        const skuData = {
          skuCode: sku.sku_code || generateUniqueCode('SKU'),
          imageUrl: sku.image_url || null,
          minOrderQty: sku.min_order_qty ?? null,
          price: nextPrice,
          originalPrice: nextOriginalPrice,
          stock: sku.stock,
          stockStatus: getStockStatus(sku.stock),
          attributeJson: (sku.attribute_json as any) || [],
          deliveryDays: sku.delivery_days || null,
          weightKg: sku.weight_kg || null,
          volumeM3: sku.volume_m3 || null
        }

        if (sku.sku_id && existingSkuIds.includes(sku.sku_id)) {
          await tx.productsku.update({ where: { id: sku.sku_id }, data: skuData })
        } else {
          await tx.productsku.create({
            data: {
              ...skuData,
              product: { connect: { id: input.product_id } }
            }
          })
        }
      }

      await syncCartItemsValidState(tx, input.product_id)
    })

    return { success: true }
  })
)

export const updateProductStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateProductStatusInput): Promise<UpdateProductStatusOutput> => {
    const { product_id, target_status } = input

    await prisma.$transaction(async tx => {
      const product = await tx.product.findUnique({
        where: { id: product_id },
        include: { skus: true }
      })

      if (!product) throw new Error('商品不存在')

      if (target_status === 'ACTIVE') {
        validateActivePreconditions({
          category_id: product.categoryId,
          name: product.name,
          goods_status: normalizeGoodsStatus(product.goodsStatus) || undefined,
          weight_gram: toNumber(product.weightGram) ?? null,
          cost_price: toNumber(product.costPrice) ?? null,
          price_coefficient: toNumber(product.priceCoefficient) ?? null,
          detail_text: product.detailText || undefined,
          main_image_url: product.mainImageUrl,
          gallery_json: product.galleryJson as any,
          short_description: product.shortDescription || undefined,
          detail_content_json: product.detailContentJson as any,
          skus: product.skus.map((s: any) => ({
            sku_code: s.skuCode,
            price: toNumber(s.price) ?? 0,
            stock: s.stock,
            attribute_json: []
          }))
        })
      } else if (target_status === 'DRAFT') {
        if (product.status === 'ACTIVE' || product.status === 'INACTIVE') {
          throw new Error('不能将已上架或已下架的商品转为待上传')
        }
      }

      await tx.product.update({
        where: { id: product_id },
        data: {
          status: target_status,
          goodsStatus: target_status === 'DRAFT' ? 'DRAFT' : mapProductStatusToGoodsStatus(target_status),
          // 首次上架写入 publishedAt；再次上架若为空也补上（供 New 按月归类）
          ...(target_status === 'ACTIVE'
            ? {
                publishedAt: product.publishedAt || new Date(),
                isNewArrival: true,
              }
            : {}),
        }
      })
      await syncCartItemsValidState(tx, product_id)
    })

    return { success: true }
  })
)

export const batchUpdateProductStatus = requireRole([UserRole.ADMIN])(
  withResult(async (product_ids: string[], target_status: ProductStatus): Promise<BatchOperateOutput> => {
    let success = 0
    let fail = 0

    for (const pid of product_ids) {
      try {
        await updateProductStatus({ product_id: pid, target_status })
        success++
      } catch (err) {
        fail++
      }
    }
    return { success_count: success, fail_count: fail }
  })
)

export const batchUpdatePriceCoefficient = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdatePriceCoefficientInput): Promise<BatchOperateOutput> => {
    if (!Array.isArray(input.product_ids) || input.product_ids.length === 0) {
      throw new Error('请先选择商品')
    }

    if (input.adjust_mode === 'PRODUCT_COEFFICIENT') {
      const nextCoefficient = Number(input.price_coefficient)
      if (!Number.isFinite(nextCoefficient) || nextCoefficient <= 0) {
        throw new Error('价格系数必须大于0')
      }
    }

    let success = 0
    let fail = 0

    for (const pid of input.product_ids) {
      try {
        await prisma.$transaction(async tx => {
          if (input.adjust_mode === 'PRODUCT_COEFFICIENT') {
            await applyProductCoefficient(tx, pid, Number(input.price_coefficient))
          } else {
            await applyCategoryCoefficient(tx, pid)
          }
          await syncCartItemsValidState(tx, pid)
        })
        success++
      } catch (err) {
        fail++
      }
    }

    return { success_count: success, fail_count: fail }
  })
)

export const inlineUpdateProductField = requireRole([UserRole.ADMIN])(
  withResult(async (input: InlineUpdateProductFieldInput): Promise<UpdateProductOutput> => {
    const product = await prisma.product.findUnique({ where: { id: input.product_id } })
    if (!product) throw new Error('商品不存在')

    if (input.field === 'product_name') {
      const nextName = String(input.value || '').trim()
      if (!nextName) throw new Error('商品名称不能为空')
      await prisma.product.update({ where: { id: input.product_id }, data: { name: nextName } })
      return { success: true }
    }

    if (input.field === 'supplier_name') {
      await prisma.product.update({
        where: { id: input.product_id },
        data: { supplierName: String(input.value || '').trim() || null }
      })
      return { success: true }
    }

    if (input.field === 'category_id') {
      const nextCategoryId = String(input.value || '').trim()
      if (!nextCategoryId) throw new Error('请选择目标分类')
      await prisma.product.update({
        where: { id: input.product_id },
        data: { categoryId: nextCategoryId }
      })
      return { success: true }
    }

    if (input.field === 'goods_status') {
      const nextGoodsStatus = normalizeGoodsStatus(String(input.value || '').trim())
      if (!nextGoodsStatus || nextGoodsStatus === 'DELETED') {
        throw new Error('货物状态无效')
      }
      await prisma.$transaction(async tx => {
        await tx.product.update({
          where: { id: input.product_id },
          data: {
            status: nextGoodsStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            goodsStatus: nextGoodsStatus
          }
        })
        await syncCartItemsValidState(tx, input.product_id)
      })
      return { success: true }
    }

    if (input.field === 'weight_gram') {
      const nextWeight = Number(input.value)
      if (!Number.isFinite(nextWeight) || nextWeight <= 0) {
        throw new Error('重量必须大于0')
      }
      await prisma.$transaction(async tx => {
        await tx.product.update({ where: { id: input.product_id }, data: { weightGram: nextWeight } })
        await tx.productsku.updateMany({ where: { productId: input.product_id }, data: { weightKg: Number((nextWeight / 1000).toFixed(3)) } })
      })
      return { success: true }
    }

    if (input.field === 'cost_price') {
      const nextCostPrice = Number(input.value)
      if (!Number.isFinite(nextCostPrice) || nextCostPrice < 0) {
        throw new Error('成本价不能小于0')
      }
      await prisma.product.update({
        where: { id: input.product_id },
        data: { costPrice: nextCostPrice }
      })
      return { success: true }
    }

    if (input.field === 'price_coefficient') {
      const nextCoefficient = Number(input.value)
      if (!Number.isFinite(nextCoefficient) || nextCoefficient <= 0) {
        throw new Error('价格系数必须大于0')
      }
      await prisma.$transaction(async tx => {
        await applyProductCoefficient(tx, input.product_id, nextCoefficient)
        await syncCartItemsValidState(tx, input.product_id)
      })
      return { success: true }
    }

    throw new Error('暂不支持的行内编辑字段')
  })
)

export const inlineUpdateProductSkuField = requireRole([UserRole.ADMIN])(
  withResult(async (input: InlineUpdateProductSkuFieldInput): Promise<UpdateProductOutput> => {
    const sku = await prisma.productsku.findFirst({
      where: { id: input.sku_id, productId: input.product_id }
    })
    if (!sku) throw new Error('SKU 不存在')

    if (input.field === 'price') {
      const nextPrice = Number(input.value)
      if (!Number.isFinite(nextPrice) || nextPrice < 0) throw new Error('售价不能小于0')
      await prisma.productsku.update({ where: { id: sku.id }, data: { price: nextPrice } })
      return { success: true }
    }

    if (input.field === 'stock') {
      const nextStock = Math.round(Number(input.value))
      if (!Number.isFinite(nextStock) || nextStock < 0) throw new Error('库存不能小于0')
      await prisma.productsku.update({
        where: { id: sku.id },
        data: {
          stock: nextStock,
          stockStatus: getStockStatus(nextStock) as any
        }
      })
      return { success: true }
    }

    if (input.field === 'weight_gram') {
      const nextWeight = Number(input.value)
      if (!Number.isFinite(nextWeight) || nextWeight <= 0) throw new Error('重量必须大于0')
      await prisma.productsku.update({
        where: { id: sku.id },
        data: { weightKg: Number((nextWeight / 1000).toFixed(3)) }
      })
      return { success: true }
    }

    if (input.field === 'cost_price') {
      const nextCost = Number(input.value)
      if (!Number.isFinite(nextCost) || nextCost < 0) throw new Error('成本价不能小于0')
      // 列表层成本价目前挂在商品主表；更新主商品成本以便汇总展示
      await prisma.product.update({
        where: { id: input.product_id },
        data: { costPrice: nextCost }
      })
      return { success: true }
    }

    if (input.field === 'spec_text') {
      const specText = String(input.value || '').trim()
      if (!specText) throw new Error('规格属性不能为空')
      const parts = specText.split('/').map(part => part.trim()).filter(Boolean)
      const attributeJson =
        parts.length >= 2
          ? [
              { name: '颜色', value: parts[0] },
              { name: '尺码', value: parts.slice(1).join(' / ') }
            ]
          : [{ name: '规格', value: specText }]
      await prisma.productsku.update({
        where: { id: sku.id },
        data: { attributeJson: attributeJson as any }
      })
      return { success: true }
    }

    throw new Error('暂不支持的 SKU 编辑字段')
  })
)

export const batchUpdateProductCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateProductCategoryInput): Promise<BatchOperateOutput> => {
    if (!input.product_ids.length) throw new Error('请先选择商品')
    if (!input.category_id) throw new Error('请选择目标分类')

    let success = 0
    let fail = 0

    for (const productId of input.product_ids) {
      try {
        await prisma.$transaction(async tx => {
          await tx.product.update({
            where: { id: productId },
            data: { categoryId: input.category_id }
          })
          await syncCartItemsValidState(tx, productId)
        })
        success++
      } catch (error) {
        fail++
      }
    }

    return { success_count: success, fail_count: fail }
  })
)

export const batchBindProductCategories = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchBindProductCategoriesInput): Promise<BatchOperateOutput> => {
    if (!input.product_ids.length) throw new Error('请先选择商品')
    if (!input.linked_category_ids.length) throw new Error('请至少选择一个关联类目')

    const productIds = Array.from(new Set(input.product_ids.filter(Boolean)))
    const linkedCategoryIds = Array.from(new Set(input.linked_category_ids.filter(Boolean)))

    // Append-only: keep primary categoryId untouched; only add missing relation rows.
    await prisma.$transaction(async tx => {
      const relationRows = buildRelationRows(productIds, linkedCategoryIds)
      if (relationRows.length > 0) {
        await tx.product_category_relations.createMany({
          data: relationRows.map(item => ({ productId: item.productId, categoryId: item.relationId })),
          skipDuplicates: true
        })
      }
    })

    return { success_count: productIds.length, fail_count: 0 }
  })
)

/**
 * 批量移除关联类目（仅删 product_category_relations）：
 * - 追加绑定的反向操作，不改写主分类 categoryId
 * - 若目标类目是商品主分类，则跳过该商品对该类目的移除
 */
export const batchUnbindProductCategories = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUnbindProductCategoriesInput): Promise<BatchOperateOutput> => {
    if (!input.product_ids.length) throw new Error('请先选择商品')
    if (!input.linked_category_ids.length) throw new Error('请至少选择一个要移除的类目')

    const productIds = Array.from(new Set(input.product_ids.filter(Boolean)))
    const linkedCategoryIds = Array.from(new Set(input.linked_category_ids.filter(Boolean)))

    let success = 0
    let fail = 0

    for (const productId of productIds) {
      try {
        await prisma.$transaction(async tx => {
          const product = await tx.product.findUnique({
            where: { id: productId },
            select: {
              id: true,
              categoryId: true,
              brandCategoryId: true
            }
          })
          if (!product) throw new Error('商品不存在')

          // Primary categoryId is protected — never remove / reassign it here.
          const removableCategoryIds = linkedCategoryIds.filter(id => id !== product.categoryId)
          if (removableCategoryIds.length === 0) return

          await tx.product_category_relations.deleteMany({
            where: {
              productId,
              categoryId: { in: removableCategoryIds }
            }
          })

          if (product.brandCategoryId && removableCategoryIds.includes(product.brandCategoryId)) {
            await tx.product.update({
              where: { id: productId },
              data: {
                brandCategoryId: null,
                brandMatchKeyword: null,
                autoBrandMatched: false
              }
            })
          }
        })
        success++
      } catch {
        fail++
      }
    }

    return { success_count: success, fail_count: fail }
  })
)

export const getCategoryProductPreview = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetCategoryProductPreviewInput): Promise<GetCategoryProductPreviewOutput> => {
    const categoryId = String(input.category_id || '').trim()
    if (!categoryId) throw new Error('请选择类目')

    const limit = Math.min(Math.max(Number(input.limit) || 50, 1), 100)
    const categoryIds = await resolveCategoryFilterIds(categoryId)
    const where = {
      OR: [
        { categoryId: { in: categoryIds } },
        { relationCategories: { some: { categoryId: { in: categoryIds } } } }
      ]
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          productCode: true,
          categoryId: true
        }
      })
    ])

    return {
      category_id: categoryId,
      total,
      products: products.map(product => ({
        product_id: product.id,
        product_name: product.name,
        sku_code_base: product.productCode,
        category_id: product.categoryId,
        is_primary: categoryIds.includes(product.categoryId)
      }))
    }
  })
)

/**
 * 解除商品与单个类目的绑定：
 * - 删除 product_category_relations
 * - 若解绑 brandCategory，清空 brandCategoryId
 * - 若解绑主类目 categoryId，优先改挂到剩余绑定类目；无剩余则落到「未分类」
 */
export const unbindProductCategory = requireRole([UserRole.ADMIN])(
  withResult(async (input: UnbindProductCategoryInput): Promise<UpdateProductOutput> => {
    const productId = String(input.product_id || '').trim()
    const categoryId = String(input.category_id || '').trim()
    if (!productId) throw new Error('商品 ID 不能为空')
    if (!categoryId) throw new Error('类目 ID 不能为空')

    await prisma.$transaction(async tx => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          categoryId: true,
          brandCategoryId: true,
          relationCategories: { select: { categoryId: true } },
        },
      })
      if (!product) throw new Error('商品不存在')

      const boundIds = new Set<string>()
      if (product.categoryId) boundIds.add(product.categoryId)
      if (product.brandCategoryId) boundIds.add(product.brandCategoryId)
      for (const rel of product.relationCategories) {
        if (rel.categoryId) boundIds.add(rel.categoryId)
      }

      await tx.product_category_relations.deleteMany({
        where: { productId, categoryId },
      })

      if (!boundIds.has(categoryId)) {
        return
      }

      boundIds.delete(categoryId)

      const data: {
        categoryId?: string
        brandCategoryId?: string | null
        brandMatchKeyword?: string | null
        autoBrandMatched?: boolean
      } = {}

      if (product.brandCategoryId === categoryId) {
        data.brandCategoryId = null
        data.brandMatchKeyword = null
        data.autoBrandMatched = false
      }

      if (product.categoryId === categoryId) {
        const remaining = Array.from(boundIds)
        if (remaining.length > 0) {
          const preferredBrand =
            product.brandCategoryId &&
            product.brandCategoryId !== categoryId &&
            boundIds.has(product.brandCategoryId)
              ? product.brandCategoryId
              : null
          data.categoryId = preferredBrand || remaining[0]
        } else {
          data.categoryId = await ensureUncategorizedCategoryId(tx)
        }
      }

      if (Object.keys(data).length > 0) {
        await tx.product.update({
          where: { id: productId },
          data,
        })
        if (data.categoryId) {
          await syncCartItemsValidState(tx, productId)
        }
      }
    })

    return { success: true }
  })
)

export const batchBindProductKeywords = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchBindProductKeywordsInput): Promise<BatchOperateOutput> => {
    if (!input.product_ids.length) throw new Error('请先选择商品')
    if (!input.linked_keyword_ids.length) throw new Error('请至少选择一个关联关键词')

    const productIds = Array.from(new Set(input.product_ids.filter(Boolean)))
    const linkedKeywordIds = Array.from(new Set(input.linked_keyword_ids.filter(Boolean)))

    await prisma.$transaction(async tx => {
      await tx.product_keyword_relations.deleteMany({
        where: { productId: { in: productIds } }
      })

      const relationRows = buildRelationRows(productIds, linkedKeywordIds)
      if (relationRows.length > 0) {
        await tx.product_keyword_relations.createMany({
          data: relationRows.map(item => ({ productId: item.productId, keywordId: item.relationId })),
          skipDuplicates: true
        })
      }
    })

    return { success_count: productIds.length, fail_count: 0 }
  })
)

export const batchUpdateManagementStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateProductStatusInput): Promise<BatchOperateOutput> => {
    if (!input.product_ids.length) throw new Error('请先选择商品')

    if (input.target_status === 'DELETED') {
      return batchDeleteProduct(input.product_ids)
    }

    return batchUpdateProductStatus(input.product_ids, input.target_status)
  })
)

export const batchUpdateProductWeightPrice = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateProductWeightPriceInput): Promise<BatchOperateOutput> => {
    if (!input.product_ids?.length) throw new Error('请先选择商品')
    const nextValue = Number(input.value)
    // Accept aliases so前端/历史 payload (coefficient) 也能命中商品系数字段
    const rawField = String(input.field || '').trim()
    const field: BatchAdjustTargetField =
      rawField === 'weight_gram' || rawField === 'weight'
        ? 'weight_gram'
        : 'price_coefficient'
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      throw new Error(field === 'weight_gram' ? '重量必须大于0' : '价格系数必须大于0')
    }

    let success = 0
    let fail = 0
    const errors: string[] = []

    for (const productId of input.product_ids) {
      try {
        await prisma.$transaction(async tx => {
          if (field === 'weight_gram') {
            await tx.product.update({ where: { id: productId }, data: { weightGram: nextValue } })
            await tx.productsku.updateMany({
              where: { productId },
              data: { weightKg: Number((nextValue / 1000).toFixed(3)) },
            })
          } else {
            // 写入 product.priceCoefficient 并按新系数重算 SKU 售价
            await applyProductCoefficient(tx, productId, nextValue)
          }
          await syncCartItemsValidState(tx, productId)
        })
        success++
      } catch (error: any) {
        fail++
        errors.push(`${productId}: ${error?.message || '更新失败'}`)
      }
    }

    if (success === 0 && fail > 0) {
      throw new Error(errors[0] || '批量更新价格系数/重量失败')
    }

    return { success_count: success, fail_count: fail }
  })
)

export const batchUpdateMinOrderQty = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateMinOrderQtyInput): Promise<BatchOperateOutput> => {
    const productIds = Array.from(new Set((input.product_ids || []).filter(Boolean)))
    const skuIds = Array.from(new Set((input.sku_ids || []).filter(Boolean)))
    if (!productIds.length && !skuIds.length) throw new Error('请先选择商品或 SKU')
    const nextValue = Math.max(1, Math.round(Number(input.min_order_qty)))
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      throw new Error('起订量必须大于 0')
    }

    let success = 0
    let fail = 0

    for (const productId of productIds) {
      try {
        await prisma.$transaction(async (tx) => {
          const product = await tx.product.findUnique({ where: { id: productId }, select: { tradeInfoJson: true } })
          if (!product) throw new Error('商品不存在')
          const nextTradeInfo = normalizeTradeInfo((product.tradeInfoJson as TradeInfo | null) || null)
          nextTradeInfo.minOrderQty = nextValue
          await tx.product.update({
            where: { id: productId },
            data: { tradeInfoJson: nextTradeInfo as any },
          })
          await syncCartItemsValidState(tx, productId)
        })
        success += 1
      } catch {
        fail += 1
      }
    }

    for (const skuId of skuIds) {
      try {
        await prisma.$transaction(async (tx) => {
          const sku = await tx.productsku.findUnique({ where: { id: skuId }, select: { productId: true } })
          if (!sku) throw new Error('SKU 不存在')
          await tx.productsku.update({
            where: { id: skuId },
            data: { minOrderQty: nextValue },
          })
          await syncCartItemsValidState(tx, sku.productId)
        })
        success += 1
      } catch {
        fail += 1
      }
    }

    return { success_count: success, fail_count: fail }
  })
)

export const createPendingImportTaskForProductManagement = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreatePendingImportTaskInput): Promise<CreatePendingImportTaskOutput> => {
    return createPendingImportTask(input)
  })
)

export const startPendingImportTaskForProductManagement = requireRole([UserRole.ADMIN])(
  withResult(async (input: StartPendingImportTaskInput): Promise<void> => {
    await startPendingImportParseTask(input)
  })
)

export const retryPendingImportTaskForProductManagement = requireRole([UserRole.ADMIN])(
  withResult(async (input: RetryPendingImportTaskInput): Promise<void> => {
    await retryPendingImportTask(input)
  })
)

export const getPendingImportQueue = requireRole([UserRole.ADMIN])(
  withResult(async (input?: {
    page?: number
    page_size?: number
    skip_maintenance?: boolean
  }): Promise<ProductManagementPendingImportQueueOutput> => {
    const queue = await getImportFrom1688PendingImportQueue(input)
    return queue as ProductManagementPendingImportQueueOutput
  })
)

export const inlineUpdatePendingImportItemField = requireRole([UserRole.ADMIN])(
  withResult(async (input: InlineUpdatePendingImportItemFieldInput): Promise<InlineUpdatePendingImportItemFieldOutput> => {
    await updateImportFrom1688PendingImportItemField({
      itemId: input.item_id,
      field: input.field,
      value: input.value
    })
    return { success: true }
  })
)

export const inlineUpdatePendingImportSkuField = requireRole([UserRole.ADMIN])(
  withResult(async (input: {
    item_id: string
    sku_key: string
    field: PendingImportSkuEditableField
    value: string | number
  }): Promise<InlineUpdatePendingImportItemFieldOutput> => {
    await updateImportFrom1688PendingImportSkuField({
      itemId: input.item_id,
      skuKey: input.sku_key,
      field: input.field,
      value: input.value
    })
    return { success: true }
  })
)

export const updatePendingImportGallery = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdatePendingImportGalleryInput): Promise<{ success: boolean }> => {
    await updateImportFrom1688PendingImportGallery(input)
    return { success: true }
  })
)

export const publishPendingImportItems = requireRole([UserRole.ADMIN])(
  withResult(async (input: PublishPendingImportItemsInput): Promise<PublishPendingImportItemsOutput> => {
    return publishImportFrom1688PendingImportItems({ itemIds: input.item_ids })
  })
)

export const reparsePendingImportItems = requireRole([UserRole.ADMIN])(
  withResult(async (input: ReparsePendingImportItemsInput): Promise<ReparsePendingImportItemsOutput> => {
    return reparseImportFrom1688PendingImportItems({ itemIds: input.item_ids })
  })
)

export const batchDeletePendingImportItems = requireRole([UserRole.ADMIN])(
  withResult(async (item_ids: string[]): Promise<BatchOperateOutput> => {
    if (!item_ids.length) {
      return { success_count: 0, fail_count: 0 }
    }

    const existingItems = await prisma.importtaskitem.findMany({
      where: {
        id: { in: item_ids },
        isPublished: false
      },
      select: { id: true }
    })

    const existingIds = existingItems.map(item => item.id)

    if (!existingIds.length) {
      return { success_count: 0, fail_count: item_ids.length }
    }

    await prisma.importtaskitem.deleteMany({
      where: {
        id: { in: existingIds },
        isPublished: false
      }
    })

    return {
      success_count: existingIds.length,
      fail_count: Math.max(0, item_ids.length - existingIds.length)
    }
  })
)

export const deleteProduct = requireRole([UserRole.ADMIN])(
  withResult(async (product_id: string): Promise<UpdateProductStatusOutput> => {
    await prisma.$transaction(async tx => {
      await tx.product.update({
        where: { id: product_id },
        data: {
          status: 'DRAFT',
          goodsStatus: 'DELETED'
        }
      })
      await tx.cartitem.updateMany({ where: { productId: product_id }, data: { status: 'INVALID' } })
    })

    return { success: true }
  })
)

export const batchDeleteProduct = requireRole([UserRole.ADMIN])(
  withResult(async (product_ids: string[]): Promise<BatchOperateOutput> => {
    let success = 0
    let fail = 0

    for (const pid of product_ids) {
      try {
        await deleteProduct(pid)
        success++
      } catch (err) {
        fail++
      }
    }
    return { success_count: success, fail_count: fail }
  })
)
export const sync1688ProductStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: Sync1688ProductStatusInput): Promise<Sync1688ProductStatusOutput> => {
    const productIds = Array.from(new Set((input.product_ids || []).filter(Boolean)))
    if (productIds.length === 0) {
      throw new Error('请先选择需要同步的商品')
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        productCode: true,
        sourceUrl: true,
        supplierName: true,
        status: true,
        source: true
      }
    })

    const byId = new Map(products.map(item => [item.id, item]))
    const delisted: Sync1688StatusItem[] = []
    const out_of_stock: Sync1688StatusItem[] = []
    const normal: Sync1688StatusItem[] = []
    const unknown: Sync1688StatusItem[] = []
    let skipped_count = 0

    for (const productId of productIds) {
      const product = byId.get(productId)
      if (!product) {
        skipped_count += 1
        continue
      }

      const sourceUrl = String(product.sourceUrl || '').trim()
      const is1688Url = /1688\.com/i.test(sourceUrl) && /offer\/\d+/i.test(sourceUrl)
      if (!is1688Url) {
        skipped_count += 1
        continue
      }

      const live = await check1688OfferLiveStatus(sourceUrl)
      const item: Sync1688StatusItem = {
        product_id: product.id,
        product_name: product.name,
        product_code: product.productCode,
        source_url: sourceUrl,
        supplier_name: product.supplierName,
        current_status: product.status as ProductStatus,
        offer_status: live.status,
        offer_name: live.offer_name,
        reason: live.reason
      }

      if (live.status === 'DELISTED') delisted.push(item)
      else if (live.status === 'OUT_OF_STOCK') out_of_stock.push(item)
      else if (live.status === 'NORMAL') normal.push(item)
      else unknown.push(item)
    }

    return { delisted, out_of_stock, normal, unknown, skipped_count }
  })
)

export const batchAppendProductAdminNotes = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchAppendProductAdminNotesInput): Promise<BatchOperateOutput> => {
    const productIds = Array.from(new Set((input.product_ids || []).filter(Boolean)))
    const note = String(input.note || '').trim()
    if (productIds.length === 0) throw new Error('请先选择需要添加备注的商品')
    if (!note) throw new Error('备注内容不能为空')

    let success = 0
    let fail = 0

    for (const productId of productIds) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { tradeInfoJson: true }
        })
        if (!product) {
          fail += 1
          continue
        }

        const current = normalizeTradeInfo((product.tradeInfoJson as TradeInfo | null) || null)
        const previous = String(current.adminRemark || '').trim()
        const nextRemark = previous ? `${previous}\n${note}` : note
        await prisma.product.update({
          where: { id: productId },
          data: {
            tradeInfoJson: {
              ...current,
              adminRemark: nextRemark.slice(0, 4000)
            } as any
          }
        })
        success += 1
      } catch {
        fail += 1
      }
    }

    return { success_count: success, fail_count: fail }
  })
)

/**
 * 一键重新归类：扫描 ACTIVE + DRAFT 商品的标题+详情，按 ACTIVE 二级类目名/品牌关键词匹配。
 * 多命中时 Brand 下二级优先；主分类 categoryId 取命中第一项（Brand L2），并同步关联与 brandCategoryId。
 */
export const reclassifyPublishedProductsBySecondaryMatch = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<ReclassifyPublishedProductsOutput> => {
    const secondaryCategories = await loadAutoMatchSecondaryCategories(prisma)
    const products = await prisma.product.findMany({
      where: { status: { in: ['ACTIVE', 'DRAFT'] } },
      select: {
        id: true,
        name: true,
        detailText: true,
        shortDescription: true,
        categoryId: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    let matched = 0
    let skipped = 0
    let failed = 0

    for (const product of products) {
      try {
        const corpusDetail = buildCategoryMatchCorpus(product.detailText, product.shortDescription)
        const hits = matchSecondaryCategoriesByTitle(product.name, secondaryCategories, corpusDetail)
        if (!hits.length) {
          skipped += 1
          continue
        }

        // hits 已按 Brand 父级优先排序；主分类必须落在命中的 Brand L2（若有）上
        const brandHit = hits.find(
          item => String(item.parentName || '').trim().toLowerCase() === 'brand',
        )
        const primaryHit = brandHit || hits[0]
        const ownership = await resolveImportCategoryOwnership(prisma, primaryHit.id)
        const linkedCategoryIds = await expandLinkedCategoryIdsWithParents(prisma, [
          ...ownership.linkedCategoryIds,
          ...hits.map(item => item.id),
          product.categoryId || '',
        ])

        await prisma.$transaction(async tx => {
          await tx.product.update({
            where: { id: product.id },
            data: {
              categoryId: ownership.primaryCategoryId,
              brandCategoryId: primaryHit.id,
              brandMatchKeyword: primaryHit.name,
              autoBrandMatched: true,
            },
          })
          await replaceProductCategoryRelations(tx, product.id, linkedCategoryIds)
        })
        matched += 1
      } catch {
        failed += 1
      }
    }

    return {
      matched,
      skipped,
      failed,
      total: products.length,
    }
  })
)

export interface BatchTranslateProductTitlesToSpanishInput {
  /** Max products to process this run (default 200, max 1000) */
  limit?: number
  /** Only these product ids; empty = scan catalog */
  product_ids?: string[]
  /** Force re-translate even when title_es exists */
  force?: boolean
}

export interface BatchTranslateProductTitlesToSpanishOutput {
  scanned: number
  translated: number
  skipped: number
  failed: number
}

export const batchTranslateProductTitlesToSpanish = requireRole([UserRole.ADMIN])(
  withResult(async (
    input: BatchTranslateProductTitlesToSpanishInput = {},
  ): Promise<BatchTranslateProductTitlesToSpanishOutput> => {
    const limit = Math.min(Math.max(Number(input.limit) || 200, 1), 1000)
    const force = input.force === true
    const idFilter = Array.isArray(input.product_ids)
      ? input.product_ids.map((id) => String(id || '').trim()).filter(Boolean)
      : []

    const products = await prisma.product.findMany({
      where: idFilter.length > 0 ? { id: { in: idFilter } } : undefined,
      select: { id: true, name: true, translationsJson: true },
      orderBy: { updatedAt: 'desc' },
      take: idFilter.length > 0 ? Math.min(idFilter.length, limit) : Math.min(limit * 5, 5000),
    })

    let scanned = 0
    let translated = 0
    let skipped = 0
    let failed = 0

    for (const product of products) {
      if (translated + skipped + failed >= limit && idFilter.length === 0) break
      scanned += 1
      try {
        const cached = getCachedSpanishTitle(null, product.translationsJson)
        if (cached && !force) {
          skipped += 1
          continue
        }

        const existingEn = getCachedEnglishTitle(null, product.translationsJson)
        const nameEn = existingEn || (await resolveEnglishProductTitle(product.name))
        const nameEs = await resolveSpanishProductTitle(
          product.name,
          force ? null : cached,
          nameEn,
          force ? null : product.translationsJson,
        )

        if (!nameEs) {
          failed += 1
          continue
        }
        if (!force && cached && cached === nameEs) {
          skipped += 1
          continue
        }

        const nextJson = mergeProductTitleTranslations(product.translationsJson, {
          nameZh: product.name,
          nameEn,
          nameEs,
        })

        await prisma.product.update({
          where: { id: product.id },
          data: { translationsJson: nextJson as any },
        })
        translated += 1
      } catch {
        failed += 1
      }
    }

    return { scanned, translated, skipped, failed }
  }),
)

export const getHomeFeaturedKeywords = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<HomeFeaturedKeywordsSetting> => {
    const setting = await prisma.sitesetting.findFirst({
      where: { settingType: HOME_FEATURED_KEYWORDS_SETTING_TYPE as any },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
      select: { contentJson: true }
    })

    return {
      keywords: normalizeFeaturedKeywords(setting?.contentJson)
    }
  })
)

export const saveHomeFeaturedKeywords = requireRole([UserRole.ADMIN])(
  withResult(async (input: HomeFeaturedKeywordsSetting): Promise<HomeFeaturedKeywordsSetting> => {
    const keywords = normalizeFeaturedKeywords(input)

    await prisma.sitesetting.upsert({
      where: { id: HOME_FEATURED_KEYWORDS_SETTING_TYPE },
      update: {
        title: '首页推荐关键词',
        contentJson: { keywords },
        isActive: true
      },
      create: {
        id: HOME_FEATURED_KEYWORDS_SETTING_TYPE,
        settingType: HOME_FEATURED_KEYWORDS_SETTING_TYPE as any,
        title: '首页推荐关键词',
        contentJson: { keywords },
        isActive: true
      }
    })

    return { keywords }
  })
)
