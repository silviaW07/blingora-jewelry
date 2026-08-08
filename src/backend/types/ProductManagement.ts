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
  | 'min_order_qty'
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
  item_skus?: Array<{
    sku_key: string
    spec_text: string
    cost_price: number | null
    price: number | null
    weight_grams: number | null
    stock: number | null
    attributes: Array<{ name: string; value: string }>
  }>
}

export interface ProductManagementPendingImportQueueOutput {
  activeTask: PendingImportQueueTaskSummary | null
  list: PendingImportQueueItem[]
  total: number
}

type PublishedImportMatchDbRecord = {
  id: string
  name: string
  productCode: string
  source: string
  supplierName: string | null
  brandName: string | null
  categoryId: string
  weightGram: any
  costPrice: any
  priceCoefficient: any
  status: string
  createdAt: Date
  updatedAt: Date
  tradeInfoJson: any
  goodsStatus: string | null
  category: { id: string; name: string; parentId: string | null; level: number | null; priceCoefficient: any } | null
  skus: Array<{ price: any; originalPrice: any; stock: number }>
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

export interface BatchUpdateProductCategoryInput {
  product_ids: string[]
  category_id: string
}

export interface BatchBindProductCategoriesInput {
  product_ids: string[]
  linked_category_ids: string[]
}

export interface BatchUnbindProductCategoriesInput {
  product_ids: string[]
  linked_category_ids: string[]
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
import {
  createImportTask as createPendingImportTask,
  startParseTask as startPendingImportParseTask,
  retryImportTask as retryPendingImportTask,
  getPendingImportQueue as getImportFrom1688PendingImportQueue,
  inlineUpdatePendingImportItemField as updateImportFrom1688PendingImportItemField,
  publishPendingImportItems as publishImportFrom1688PendingImportItems,
  type CreateImportTaskInput,
  type CreateImportTaskOutput,
  type StartParseTaskInput,
  type RetryImportTaskInput,
  type PendingImportInlineField,
  type PublishPendingImportItemsOutput
} from '@/backend/actions/ImportFrom1688'

const USD_EXCHANGE_RATE = 6.5

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof value?.toNumber === 'function') return value.toNumber()
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

function resolveEffectiveCoefficient(
  ownCategoryCoefficient: number | null,
  parentCategoryCoefficient: number | null = null,
): number {
  return resolveCategoryPriceCoefficient(ownCategoryCoefficient, parentCategoryCoefficient)
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
    own: current && !isAggregatePricingCategoryName(current.name) ? toNumber(current.priceCoefficient) : null,
    parent: parent && !isAggregatePricingCategoryName(parent.name) ? toNumber(parent.priceCoefficient) : null,
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
      skus: { select: { price: true, originalPrice: true, stock: true } }
    }
  })
}

async function mapProductToListItem(product: PublishedImportMatchDbRecord): Promise<ProductListItem> {
  const { categoryMap } = await getCategoryMetaMap(prisma, [product.categoryId])
  const prices = product.skus.map(s => toNumber(s.price) ?? 0)
  const priceMin = prices.length > 0 ? Math.min(...prices) : 0
  const priceMax = prices.length > 0 ? Math.max(...prices) : 0
  const totalStock = product.skus.reduce((sum, s) => sum + s.stock, 0)
  const { own, parent, main, current } = getCategoryHierarchyCoefficients(categoryMap, product.categoryId, product.category)
  const categoryEffectiveCoefficient =
    (own !== null && own > 0) || (parent !== null && parent > 0)
      ? resolveCategoryPriceCoefficient(own, parent)
      : null
  const mainCategoryCoefficient = categoryEffectiveCoefficient ?? toNumber(main?.priceCoefficient)
  const effectiveCoefficient = resolveEffectiveCoefficient(own, parent)
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
    category_name: current?.name || product.category?.name || '--',
    category_level: current?.level ?? null,
    parent_category_id: current?.parentId || null,
    parent_category_name: current?.parentId ? (categoryMap.get(current.parentId)?.name || null) : null,
    main_category_id: main?.id || product.categoryId,
    main_category_name: main?.name || current?.name || product.category?.name || '--',
    main_category_price_coefficient: mainCategoryCoefficient,
    goods_status: mappedGoodsStatus,
    weight_gram: toNumber(product.weightGram),
    cost_price: toNumber(product.costPrice),
    price_coefficient: toNumber(product.priceCoefficient),
    effective_price_coefficient: effectiveCoefficient,
    min_order_qty: Math.max(1, Number((product.tradeInfoJson as any)?.minOrderQty ?? 1) || 1),
    price_min: priceMin,
    price_max: priceMax,
    usd_display_price_min: toUsdDisplayPrice(priceMin) ?? 0,
    usd_display_price_max: toUsdDisplayPrice(priceMax) ?? 0,
    total_stock: totalStock,
    status: product.status as ProductStatus,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString()
  }
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
    category_options: categories.map(category => ({
      value: category.id,
      label: `${category.level === 2 ? '— ' : ''}${category.name}`
    })),
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
  parentId: string | null
  level: number | null
  priceCoefficient: any
}

async function getCategoryMetaMap(tx: any, categoryIds: string[]): Promise<{ categoryMap: Map<string, CategoryMeta>; resolveMainCategory: (categoryId: string | null) => CategoryMeta | null }> {
  const uniqueIds = Array.from(new Set(categoryIds.filter(Boolean)))
  const categories: CategoryMeta[] = await tx.category.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true }
  })
  const categoryMap = new Map<string, CategoryMeta>(categories.map((item: CategoryMeta) => [item.id, item]))

  const missingParentIds = Array.from(new Set(categories.map((item: any) => item.parentId).filter((id: string | null) => !!id && !categoryMap.has(id))))
  if (missingParentIds.length > 0) {
    const parents: CategoryMeta[] = await tx.category.findMany({
      where: { id: { in: missingParentIds } },
      select: { id: true, name: true, parentId: true, level: true, priceCoefficient: true }
    })
    parents.forEach((item: CategoryMeta) => categoryMap.set(item.id, item))
  }

  const resolveMainCategory = (categoryId: string | null) => {
    let current: CategoryMeta | null = categoryId ? (categoryMap.get(categoryId) || null) : null
    let guard = 0
    while (current?.parentId && guard < 10) {
      const parent = categoryMap.get(current.parentId)
      if (!parent) break
      current = parent
      guard += 1
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

function buildDraftSku(row: BatchImportDraftRow): SkuItem {
  const costPrice = row.cost_price ?? 0
  const coefficient = row.price_coefficient && row.price_coefficient > 0 ? row.price_coefficient : DEFAULT_PRICE_COEFFICIENT
  const price = calculateSkuRmbPrice(costPrice, coefficient)
  const originalPrice = roundCurrency(price * 1.1)
  return {
    sku_code: generateUniqueCode('SKU'),
    image_url: row.main_image_url || '',
    price,
    original_price: originalPrice,
    stock: 1,
    attribute_json: [],
    weight_kg: row.weight_gram ? Number((row.weight_gram / 1000).toFixed(3)) : null,
    usd_display_price: toUsdDisplayPrice(price),
    usd_display_original_price: toUsdDisplayPrice(originalPrice)
  }
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

export const getProductList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetProductListInput): Promise<GetProductListOutput> => {
    const { keyword, category_id, status, goods_status, status_filter, supplier_name, brand_keyword, page = 1, page_size = 20 } = input

    const whereClause: any = {}
    if (keyword) {
      const normalizedKeyword = keyword.trim()
      whereClause.OR = [
        { name: { contains: normalizedKeyword } },
        { productCode: { contains: normalizedKeyword } }
      ]
    }
    if (category_id) {
      whereClause.categoryId = category_id
    }
    const normalizedStatusList = status
      ? (Array.isArray(status) ? status : [status])
      : mapStatusFilterToProductStatus(status_filter)
    if (normalizedStatusList && normalizedStatusList.length > 0) {
      whereClause.status = { in: normalizedStatusList.map(s => s.toUpperCase()) }
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

    const shouldIncludeDraftResultsForNameSearch = Boolean(keyword?.trim())
    if (!shouldIncludeDraftResultsForNameSearch && normalizedStatusList && normalizedStatusList.length > 0) {
      whereClause.status = { in: normalizedStatusList.map(s => s.toUpperCase()) }
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
          skus: { select: { price: true, originalPrice: true, stock: true } }
        }
      }),
      findPublishedImportProductByName(keyword)
    ])

    const { categoryMap } = await getCategoryMetaMap(prisma, products.map(p => p.categoryId))

    const list = products.map(p => {
      const prices = p.skus.map(s => toNumber(s.price) ?? 0)
      const priceMin = prices.length > 0 ? Math.min(...prices) : 0
      const priceMax = prices.length > 0 ? Math.max(...prices) : 0
      const totalStock = p.skus.reduce((sum, s) => sum + s.stock, 0)
      const { own, parent, main, current } = getCategoryHierarchyCoefficients(categoryMap, p.categoryId, p.category)
      const categoryEffectiveCoefficient =
        (own !== null && own > 0) || (parent !== null && parent > 0)
          ? resolveCategoryPriceCoefficient(own, parent)
          : null
      const mainCategoryCoefficient = categoryEffectiveCoefficient ?? toNumber(main?.priceCoefficient)
      const effectiveCoefficient = resolveEffectiveCoefficient(own, parent)
      const mappedGoodsStatus = normalizeGoodsStatus(p.goodsStatus) || mapProductStatusToGoodsStatus(p.status as ProductStatus)

      return {
        product_id: p.id,
        product_name: p.name,
        sku_code_base: p.productCode,
        source: p.source as ProductSource,
        supplier_name: p.supplierName || null,
        brand_keyword: p.brandName || null,
        category_id: p.categoryId,
        category_name: current?.name || p.category?.name || '--',
        category_level: current?.level ?? null,
        parent_category_id: current?.parentId || null,
        parent_category_name: current?.parentId ? (categoryMap.get(current.parentId)?.name || null) : null,
        main_category_id: main?.id || p.categoryId,
        main_category_name: main?.name || current?.name || p.category?.name || '--',
        main_category_price_coefficient: mainCategoryCoefficient,
        goods_status: mappedGoodsStatus,
        weight_gram: toNumber(p.weightGram),
        cost_price: toNumber(p.costPrice),
        price_coefficient: toNumber(p.priceCoefficient),
        effective_price_coefficient: effectiveCoefficient,
        min_order_qty: Math.max(1, Number((p.tradeInfoJson as any)?.minOrderQty ?? 1) || 1),
        price_min: priceMin,
        price_max: priceMax,
        usd_display_price_min: toUsdDisplayPrice(priceMin) ?? 0,
        usd_display_price_max: toUsdDisplayPrice(priceMax) ?? 0,
        total_stock: totalStock,
        status: p.status as ProductStatus,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString()
      }
    }).filter(item => {
      if (!normalizedStatusList || normalizedStatusList.length === 0) {
        return true
      }
      return normalizedStatusList.includes(item.status)
    })

    const published_import_match = publishedImportMatchRecord
      ? await mapProductToListItem(publishedImportMatchRecord)
      : null

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
      effective_price_coefficient: resolveEffectiveCoefficient(own, parent),
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
    const baseCode = generateUniqueCode('P')

    const result = await prisma.$transaction(async tx => {
      const { categoryMap } = await getCategoryMetaMap(tx, [input.category_id])
      const { own, parent } = getCategoryHierarchyCoefficients(categoryMap, input.category_id)
      const effectiveCoefficient = resolveEffectiveCoefficient(own, parent) ?? DEFAULT_PRICE_COEFFICIENT
      const normalizedCostPrice = input.cost_price ?? 0

      const product = await tx.product.create({
        data: {
          name: input.name,
          slug: baseCode,
          productCode: baseCode,
          source: 'MANUAL',
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
          category: { connect: { id: input.category_id } },
          skus: {
            create: input.skus.map(s => {
              const nextPrice = normalizedCostPrice > 0 ? calculateSkuRmbPrice(normalizedCostPrice, effectiveCoefficient) : s.price
              const nextOriginalPrice = normalizedCostPrice > 0 ? roundCurrency(nextPrice * 1.1) : (s.original_price || null)
              return {
                skuCode: s.sku_code || generateUniqueCode('SKU'),
                imageUrl: s.image_url || null,
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

    for (const row of input.rows) {
      try {
        const detailContent = buildDetailContent(row.detail_text, row.gallery_urls?.slice(1).map(url => ({ type: 'image' as const, content: url })) || [])
        const gallery = buildGallery(row.main_image_url || row.gallery_urls?.[0] || '', [
          ...(row.main_image_url ? [{ url: row.main_image_url, sort: 1 }] : []),
          ...((row.gallery_urls || []).map((url, index) => ({ url, sort: index + 1 })))
        ])
        await createProduct({
          category_id: input.category_id,
          name: row.name,
          supplier_name: row.supplier_name?.trim() || null,
          brand_keyword: row.brand_keyword?.trim() || null,
          goods_status: 'ACTIVE',
          weight_gram: row.weight_gram ?? null,
          cost_price: row.cost_price ?? null,
          price_coefficient: row.price_coefficient ?? DEFAULT_PRICE_COEFFICIENT,
          detail_text: row.detail_text || '',
          main_image_url: row.main_image_url || gallery[0]?.url || '',
          short_description: row.detail_text || '',
          gallery_json: gallery,
          detail_content_json: detailContent,
          skus: [buildDraftSku(row)],
          submit_action: 'DRAFT'
        })
        success++
      } catch (error) {
        fail++
      }
    }

    return { success_count: success, fail_count: fail }
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
      const effectiveCoefficient = resolveEffectiveCoefficient(own, parent) ?? DEFAULT_PRICE_COEFFICIENT
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
          tradeInfoJson: (input.trade_info_json as any) || null,
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
          goodsStatus: target_status === 'DRAFT' ? 'DRAFT' : mapProductStatusToGoodsStatus(target_status)
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

    throw new Error('暂不支持的行内编辑字段')
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
    if (!input.product_ids.length) throw new Error('请先选择商品')
    const nextValue = Number(input.value)
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      throw new Error(input.field === 'weight_gram' ? '重量必须大于0' : '价格系数必须大于0')
    }

    let success = 0
    let fail = 0

    for (const productId of input.product_ids) {
      try {
        await prisma.$transaction(async tx => {
          if (input.field === 'weight_gram') {
            await tx.product.update({ where: { id: productId }, data: { weightGram: nextValue } })
            await tx.productsku.updateMany({ where: { productId }, data: { weightKg: Number((nextValue / 1000).toFixed(3)) } })
          } else {
            await applyProductCoefficient(tx, productId, nextValue)
          }
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
  withResult(async (): Promise<ProductManagementPendingImportQueueOutput> => {
    const queue = await getImportFrom1688PendingImportQueue()
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

export const publishPendingImportItems = requireRole([UserRole.ADMIN])(
  withResult(async (input: PublishPendingImportItemsInput): Promise<PublishPendingImportItemsOutput> => {
    return publishImportFrom1688PendingImportItems({ itemIds: input.item_ids })
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
