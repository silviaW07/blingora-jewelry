'use server'

// ===== Enums =====
/** 用户角色：普通用户(CUSTOMER) | 管理员(ADMIN) */
export type UserRoleType = 'CUSTOMER' | 'ADMIN'

/** 产品状态：草稿(DRAFT) | 上架(ACTIVE) | 下架(INACTIVE) */
export type ProductStatusType = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

/** 导入任务状态：待处理(PENDING) | 解析中(RUNNING) | 已完成(COMPLETED) | 部分成功(PARTIAL_SUCCESS) | 失败(FAILED) | 限流(RATE_LIMITED) | 待重试(RETRY_PENDING) */
export type ImportTaskStatusType = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED' | 'RATE_LIMITED' | 'RETRY_PENDING'
export type ImportTaskItemFetchStatusType = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RATE_LIMITED' | 'RETRY_PENDING'
export type ImportTaskItemPublishStatusType = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

/** 建品来源 */
export type ProductCreationSourceType = 'IMPORT_1688' | 'TABLE_IMPORT' | 'MANUAL'

// ===== Data Structures =====

export interface CategoryOption {
  category_id: string
  category_name: string
  parent_id?: string | null
  level?: number | null
  parent_name?: string | null
}

export interface StockStrategyJson {
  type?: string
  stock?: number
}

export interface SpecSummaryJson {
  name?: string
  values?: string[]
}

export interface PreviewDataJson {
  name?: string
  /** English title for storefront locale=en (API or dictionary) */
  nameEn?: string
  /** Spanish title for storefront locale=es (API or dictionary); also persisted as title_es */
  nameEs?: string
  categoryId?: string
  matchedCategoryIds?: string[]
  matchedCategoryNames?: string[]
  /**
   * 一键校准（或校准结果弹窗保存）已写入类目/重量。
   * 上架时应信任这些结果，不再按标题重新扫类目覆盖。
   */
  categoryCalibrated?: boolean
  price?: number
  mainImageUrl?: string
  detailImages?: string[]
  shortDescription?: string
  featureAttributes?: Array<{ key: string; value: string }>
  skuTable?: PreviewSkuTableRow[]
  /** 1688 颜色选项（含独立缩略图；无图时 imageUrl 为空，待运营补填） */
  colors?: Array<{ label: string; imageUrl?: string | null }>
  /** 颜色 → 可用尺码列表（来自 skuMap 真实组合，不臆造） */
  sizesByColor?: Record<string, string[]>
  /** 表格导入排序；1688 链路不使用产品编号合并 */
  importSortIndex?: number
  /** 入库身份：1688 每条链接独立；表格按产品编号合并后写入 */
  inboundIdentity?: {
    mode: 'LINK_1688_INDEPENDENT' | 'LINK_PDD_INDEPENDENT' | 'TABLE_PRODUCT_CODE_MERGED'
    offerId?: string | null
    goodsId?: string | null
    sourceUrl?: string | null
    excelProductCode?: string | null
  }
}

export interface PreviewSkuTableRow {
  skuKey?: string
  spec?: string
  costPrice?: number | null
  price?: number | null
  stock?: number | null
  weightGrams?: number | null
  imageUrl?: string | null
  attributes?: Array<{ name: string; value: string }>
}

export interface PendingImportSkuItem {
  sku_key: string
  spec_text: string
  cost_price: number | null
  price: number | null
  weight_grams: number | null
  stock: number | null
  image_url: string | null
  attributes: Array<{ name: string; value: string }>
}

export interface ImportTaskItemRecord {
  item_id: string
  item_importTaskId: string
  item_sourceUrl: string
  item_parsedName: string | null
  item_parsedMainImageUrl: string | null
  item_parsedPriceMin: string | null
  item_parsedPriceMax: string | null
  item_specSummaryJson: SpecSummaryJson[] | null
  item_previewDataJson: PreviewDataJson | null
  item_fetchStatus: ImportTaskItemFetchStatusType | null
  item_publishStatus: ImportTaskItemPublishStatusType | null
  item_isPublished: boolean
  item_isSelected: boolean
  item_importedProductId: string | null
  item_failureReason: string | null
  item_createdAt: Date
}

export interface ImportTaskRecord {
  task_id: string
  task_taskName: string
  task_status: ImportTaskStatusType
  task_sourceLinkCount: number
  task_successCount: number
  task_failureCount: number
  task_progressPercent: number
  task_costDeductionUsd: string | null
  task_defaultStatus: ProductStatusType
  task_defaultCategoryId: string | null
  task_stockStrategyJson: StockStrategyJson | null
  task_createdAt: Date
}

export interface TableImportDraftRow {
  rowId: string
  productCode: string
  skuCode: string
  productPrice: number | null
  productPriceText?: string
  productName: string
  brand: string
  supplierName: string
  categoryName: string
  categoryId: string
  color: string
  spec: string
  colors: string[]
  specs: string[]
  weight: string
  /** @deprecated 兼容旧粘贴格式 */
  costPrice?: number | null
  imageUrl?: string
  detail?: string
}

export interface ManualProductInput {
  productName: string
  supplier: string
  categoryId: string
  brand: string
  weight: string
  costPrice: number
  imageUrl: string
  detail: string
}

export interface ProductCreationResult {
  productId: string
  productName: string
  source: ProductCreationSourceType
}

export interface ParseTableImportInput {
  content: string
}

export interface LocalTableImportDraftInput {
  fileName: string
  fileContent: string
}

export interface LocalImageImportDraftInput {
  files: Array<{
    fileName: string
    imageUrl: string
    fileSize?: number
  }>
}

export interface ParseTableImportOutput {
  rows: TableImportDraftRow[]
}

export interface LocalTableImportDraftOutput {
  rows: TableImportDraftRow[]
  fileName: string
  message: string
}

export interface LocalImageImportDraftItem {
  rowId: string
  fileName: string
  imageUrl: string
  productName: string
  detail: string
  categoryId: string
  brand: string
  sourceLabel: string
  fileSizeText: string
  statusLabel: string
}

export interface LocalImageImportDraftOutput {
  items: LocalImageImportDraftItem[]
  message: string
}

export interface CreateProductsFromTableInput {
  rows: TableImportDraftRow[]
  defaultCategoryId?: string
}

export interface CreateProductsFromTableOutput {
  taskId: string
  createdCount: number
  created: ProductCreationResult[]
}

export interface CreateManualProductOutput {
  product: ProductCreationResult
}

export interface PendingImportQueueTaskSummary {
  task_id: string
  task_taskName: string
  task_status: ImportTaskStatusType
  task_sourceLinkCount: number
  task_successCount: number
  task_failureCount: number
  task_progressPercent: number
  task_defaultStatus: ProductStatusType
  task_defaultCategoryId: string | null
  task_lastRateLimitedAt: Date | null
  task_startedAt: Date | null
  task_finishedAt: Date | null
}

export interface PendingImportItemRecord {
  item_id: string
  item_importTaskId: string
  item_sourceUrl: string
  item_fetchStatus: ImportTaskItemFetchStatusType
  item_publishStatus: ImportTaskItemPublishStatusType
  item_isPublished: boolean
  item_importedProductId: string | null
  item_failureReason: string | null
  item_productName: string | null
  item_supplierName: string | null
  item_mainImageUrl: string | null
  item_galleryUrls: string[]
  item_costPrice: number | null
  item_weightGrams: number | null
  item_sourceCategoryName: string | null
  item_targetCategoryId: string | null
  item_matchedCategoryIds: string[]
  item_matchedCategoryNames: string[]
  item_coefficient: number | null
  item_goodsStatus: string | null
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
  item_skus: PendingImportSkuItem[]
}

// ===== Input / Output =====

export interface GetCategoryOptionsOutput {
  list: CategoryOption[]
}

export interface GetImportTaskListInput {
  status?: ImportTaskStatusType | ''
  page?: number
  pageSize?: number
}

export interface GetImportTaskListOutput {
  list: ImportTaskRecord[]
  total: number
}

export interface GetImportTaskDetailInput {
  taskId: string
}

export interface GetImportTaskDetailOutput {
  task: ImportTaskRecord
  items: ImportTaskItemRecord[]
}

export interface CreateImportTaskInput {
  urls: string
  defaultCategoryId?: string
  costDeductionUsd?: number
  defaultStatus: ProductStatusType
  stockStrategyStock?: number
}

export interface CreateImportTaskOutput {
  taskId: string
  /** 实际新建并待解析的链接数 */
  createdCount: number
  /** 因历史已导入（同 offer/goods）而跳过的链接数 */
  skippedDuplicateCount: number
  /** 其中店铺分类页链接数（需本机采集器先展开为商品详情） */
  categoryUrlCount?: number
}

export interface CreatePinduoduoImportTaskInput {
  urls: string
  defaultCategoryId?: string
  /** 售价相对拼多多采集价的加价百分比，例如 20 表示 +20% */
  markupRate?: number
  defaultStatus: ProductStatusType
  stockStrategyStock?: number
}

export interface StartParseTaskInput {
  taskId: string
}

export interface UpdateTaskItemPreviewInput {
  itemId: string
  previewData: PreviewDataJson
}

export interface UpdatePendingImportGalleryInput {
  itemId: string
  galleryUrls: string[]
  mainImageUrl?: string | null
}

export interface ConfirmImportProductsInput {
  taskId: string
  itemIds: string[]
}

export interface RetryImportTaskInput {
  taskId: string
}

export interface DeleteImportTaskInput {
  taskId: string
}

export interface GetPendingImportQueueInput {
  /** 1-based page; default 1 */
  page?: number
  /** default 80, max 200 — prevents opening table-import from downloading entire queue */
  page_size?: number
  /** skip charset/mock repair side-effects on hot path */
  skip_maintenance?: boolean
}

export interface GetPendingImportQueueOutput {
  activeTask: PendingImportQueueTaskSummary | null
  list: PendingImportItemRecord[]
  total: number
  page?: number
  page_size?: number
  /** In-process collect/reparse job — survives page refresh so UI can show progress + 终止解析 */
  parse_job?: PendingImportParseJobStatus
}

interface PendingImportQueueSnapshot {
  activeTask: PendingImportQueueTaskSummary | null
  items: PendingImportItemRecord[]
}

export type PendingImportInlineField =
  | 'product_name'
  | 'product_detail'
  | 'sku_summary_text'
  | 'supplier_name'
  | 'source_category_name'
  | 'target_category_id'
  | 'coefficient'
  | 'goods_status'
  | 'weight_grams'
  | 'cost_price'
  | 'cny_price_min'
  | 'cny_price_max'
  | 'usd_price_min'
  | 'usd_price_max'
  | 'minimum_order_quantity'
  | 'available_stock'
  | 'main_image_url'

type ImportTaskItemDbRecord = {
  id: string
  importTaskId: string
  sourceUrl: string
  parsedName: string | null
  parsedMainImageUrl: string | null
  parsedPriceMin: unknown
  parsedPriceMax: unknown
  productName?: string | null
  specSummaryJson: unknown
  previewDataJson: unknown
  isSelected: boolean
  importedProductId: string | null
  failureReason: string | null
  createdAt: Date
  fetchStatus?: string | null
  publishStatus?: string | null
  isPublished?: boolean
  supplierName?: string | null
  mainImageUrl?: string | null
  costPrice?: unknown
  weightGrams?: unknown
  sourceCategoryName?: string | null
  targetCategoryId?: string | null
  coefficient?: unknown
  goodsStatus?: string | null
  productDetail?: string | null
  skuSummaryText?: string | null
  cnyPriceMin?: unknown
  cnyPriceMax?: unknown
  usdPriceMin?: unknown
  usdPriceMax?: unknown
  minimumOrderQuantity?: number | null
  availableStock?: number | null
}

type ImportTaskDbRecord = {
  id: string
  taskName: string
  status: string
  sourceLinkCount: number
  successCount: number
  failureCount: number
  progressPercent: number
  markupRate?: unknown
  defaultStatus: string
  defaultCategoryId: string | null
  stockStrategyJson?: unknown
  createdAt: Date
  lastRateLimitedAt?: Date | null
  lastScheduledAt?: Date | null
  startedAt?: Date | null
  finishedAt?: Date | null
  queueConcurrency?: number
  rateLimitMinDelaySec?: number
  rateLimitMaxDelaySec?: number
}

export interface InlineUpdatePendingImportItemFieldInput {
  itemId: string
  field: PendingImportInlineField
  value: string | number
}

export type PendingImportSkuEditableField = 'cost_price' | 'price' | 'weight_grams' | 'stock' | 'spec_text' | 'image_url' | 'minimum_order_quantity'

export interface InlineUpdatePendingImportSkuFieldInput {
  itemId: string
  skuKey: string
  field: PendingImportSkuEditableField
  value: string | number
}

export interface DuplicatePendingImportSkuInput {
  itemId: string
  skuKey: string
}

export interface DeletePendingImportSkuInput {
  itemId: string
  skuKey: string
}

export interface DuplicatePendingImportSkuColorGroupInput {
  itemId: string
  color: string
}

export interface DeletePendingImportSkuColorGroupInput {
  itemId: string
  color: string
}

export interface MutatePendingImportSkusOutput {
  success: boolean
  item_skus: PendingImportSkuItem[]
}

export interface PublishPendingImportItemsInput {
  itemIds: string[]
}

export interface PublishPendingImportFailure {
  itemId: string
  name: string
  reason: string
}

export interface PublishPendingImportItemsOutput {
  success_count: number
  fail_count: number
  failures: PublishPendingImportFailure[]
}

export interface ReparsePendingImportItemsInput {
  itemIds: string[]
}

export interface ReparsePendingImportItemResult {
  itemId: string
  success: boolean
  name: string
  reason?: string
}

export interface ReparsePendingImportItemsOutput {
  success_count: number
  fail_count: number
  results: ReparsePendingImportItemResult[]
}

const buildPublishedImportItemRecoveryData = (item: {
  importedProductId?: string | null
  fetchStatus?: string | null
  publishStatus?: string | null
  publishedAt?: Date | null
}) => {
  if (!item.importedProductId) {
    return null
  }

  return {
    fetchStatus: item.fetchStatus === 'COMPLETED' ? undefined : ('COMPLETED' as any),
    publishStatus: item.publishStatus === 'COMPLETED' ? undefined : ('COMPLETED' as any),
    isPublished: true,
    publishedAt: item.publishedAt ?? new Date(),
    failureReason: null
  }
}

/** 检测中文被 MySQL gbk 连接写成问号的脏数据 */
const isCharsetCorruptedText = (value?: string | null) => {
  if (!value) return false
  return /\[1688\?+\]/.test(value) || /(^|[^\w])\?{2,}([^\w]|$)/.test(value) || value.includes('????')
}

/** 任意字段出现连续问号，即视为可修复的字符集脏数据 */
const isRepairableMockCorruption = (item: {
  parsedName?: string | null
  supplierName?: string | null
  skuSummaryText?: string | null
  sourceCategoryName?: string | null
  productDetail?: string | null
}) => {
  return (
    isCharsetCorruptedText(item.parsedName) ||
    isCharsetCorruptedText(item.supplierName) ||
    isCharsetCorruptedText(item.skuSummaryText) ||
    isCharsetCorruptedText(item.sourceCategoryName) ||
    isCharsetCorruptedText(item.productDetail)
  )
}

const buildRepairedMockImportTexts = (itemId: string) => {
  const shortId = itemId.slice(0, 6)
  const name = `[1688抓取] 工业配件 ${shortId}`
  return {
    parsedName: name,
    supplierName: '1688 默认供应商',
    sourceCategoryName: '1688工业配件',
    productDetail: '自动采集的商品详情，请运营补充图文与说明。',
    skuSummaryText: '标准版 / 默认规格',
    previewDataJson: {
      name,
      price: 50,
      mainImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
      shortDescription: '自动抓取的商品简介内容，请根据需要修改。'
    },
    specSummaryJson: [{ name: '规格', values: ['标准版'] }]
  }
}

const repairCharsetCorruptedPendingImportItems = async () => {
  const candidates = await prisma.importtaskitem.findMany({
    where: {
      OR: [
        { parsedName: { contains: '?' } },
        { supplierName: { contains: '?' } },
        { sourceCategoryName: { contains: '?' } },
        { productDetail: { contains: '?' } },
        { skuSummaryText: { contains: '?' } }
      ]
    },
    select: {
      id: true,
      parsedName: true,
      supplierName: true,
      sourceCategoryName: true,
      productDetail: true,
      skuSummaryText: true,
      mainImageUrl: true,
      cnyPriceMin: true,
      targetCategoryId: true
    },
    take: 300
  })

  const corrupted = candidates.filter(item => isRepairableMockCorruption(item))

  if (corrupted.length === 0) return 0

  await prisma.$transaction(
    corrupted.map(item => {
      const repaired = buildRepairedMockImportTexts(item.id)
      return prisma.importtaskitem.update({
        where: { id: item.id },
        data: {
          parsedName: repaired.parsedName,
          supplierName: repaired.supplierName,
          sourceCategoryName: repaired.sourceCategoryName,
          productDetail: repaired.productDetail,
          skuSummaryText: repaired.skuSummaryText,
          previewDataJson: {
            ...repaired.previewDataJson,
            categoryId: item.targetCategoryId || undefined,
            price: typeof item.cnyPriceMin === 'number'
              ? item.cnyPriceMin
              : Number(item.cnyPriceMin) || repaired.previewDataJson.price,
            mainImageUrl: item.mainImageUrl || repaired.previewDataJson.mainImageUrl
          } as any,
          specSummaryJson: repaired.specSummaryJson as any,
          failureReason: null
        }
      })
    })
  )

  return corrupted.length
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/backend/action_utils'
import { isAggregatePricingCategoryName } from '@/shared/categoryPricing'
import {
  canonicalizeQualityMatchText,
  isAttributeOrFilterCategory,
  isGluedFilterSuffixToken,
  isProductTypeCategory,
} from '@/shared/categoryMatchGuards'
import { detectShelfFamily, shelfFamiliesCompatible } from '@/shared/categoryShelfFamily'
import { resolveCategoryPriceCoefficient } from '@/shared/priceCoefficient'
import {
  loadFilterCategoriesFromDb,
  matchFilterCategoriesByTitle,
  type FilterCategoryRow,
} from '@/shared/categoryFilterTitleMatch'
import { resolveProductWeightGrams } from '@/shared/categoryWeight'
import { resolveCategorySynonyms } from '@/shared/categorySynonyms'
import { ensureCategorySlugPersisted } from '@/shared/categorySlug'
import { buildSkuIdentifier, formatIdentifierYearMonth, resolveCategoryShortCode } from '@/shared/productIdentifiers'
import { isPendingImportEffectivelyReady, hasPendingImportCoreFields } from '@/backend/utils/pendingImportReadiness'
import {
  buildProductTranslationsJson,
  resolveEnglishProductTitle,
  resolveSpanishProductTitle,
} from '@/backend/lib/resolveProductTitleEn'
import {
  loadBrandAliasRules,
  normalizeBrandTitleSync,
} from '@/backend/lib/brandAlias'
import { applyBrandAliases } from '@/shared/brandTitleNormalize'
import { is1688ShopCategoryUrl } from '@/shared/1688ShopCategory'
import { syncProductPriceThresholdRelations } from '@/backend/lib/priceThresholdAutoClassify'
import {
  resolveInitialStock,
  resolveInitialMinOrderQty,
  DEFAULT_AVAILABLE_STOCK,
  DEFAULT_MIN_ORDER_QTY,
} from '@/shared/resolveInitialStock'
import {
  collectTableImportSkuPairs,
  resolveTableImportColorSpec,
  TABLE_IMPORT_SPEC_HEADER_ALIASES,
  isTableImportCategoryHeader,
} from '@/shared/tableImportSpec'
import { sortSizeLabels } from '@/utils/sortSizeLabels'
import {
  extractPinduoduoGoodsId,
  fetchPinduoduoProductPreview,
  hasMeaningfulPinduoduoPreview,
  isPinduoduoProductUrl,
  type PinduoduoProductPreview,
} from '@/backend/parsers/PinduoduoParser'
import {
  fetch1688OfferViaMtop,
  normalize1688Cookie,
} from '@/backend/parsers/1688MtopClient'
import {
  fetchOneBound1688Preview,
  hasOneBound1688Configured,
} from '@/backend/onebound1688'

const buildImportSkuSegments = (sku: PendingImportSkuItem, index: number) => {
  const attrs = Array.isArray(sku.attributes) ? sku.attributes : []
  const specValue =
    attrs.find((attr) => attr.name === '规格' || attr.name === '尺码')?.value ||
    sku.spec_text ||
    `SPEC${index + 1}`
  const colorValue = attrs.find((attr) => attr.name === '颜色')?.value || ''
  return { specValue, colorValue }
}

const resolveImportCategoryIdentifierMeta = async (tx: any, categoryId: string) => {
  const category = await tx.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, slug: true }
  })
  if (!category) throw new Error('未找到目标主分类')
  // Existing categories may still have null/empty slug; auto-generate + persist then continue.
  const slug = await ensureCategorySlugPersisted(tx, category)
  const shortCode = resolveCategoryShortCode(slug)
  if (!shortCode) {
    throw new Error(`分类「${category.name}」未配置可用简码，请先完善 slug 后再发布 1688 商品`)
  }
  return { categoryId: category.id, shortCode, categoryName: category.name as string }
}

type ImportCategoryOwnership = {
  primaryCategoryId: string
  linkedCategoryIds: string[]
  isSecondary: boolean
  parentCategoryId: string | null
}

/**
 * 导入分类归属：
 * - 选二级分类：主分类=二级；关联=一级+二级
 * - 选一级分类：主分类=一级；关联仅一级（不做多级保存）
 */
export const resolveImportCategoryOwnership = async (
  tx: any,
  categoryId: string
): Promise<ImportCategoryOwnership> => {
  const category = await tx.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      level: true,
      parentId: true,
      status: true,
      isBrandCategory: true,
      parent: { select: { id: true, status: true, name: true, isBrandCategory: true } },
    },
  })
  if (!category || category.status !== 'ACTIVE') {
    throw new Error('目标分类不存在或已停用')
  }
  const parentName = String(category.parent?.name || '').trim().toLowerCase()
  if (
    category.isBrandCategory ||
    category.parent?.isBrandCategory ||
    parentName === 'brand' ||
    parentName === 'brands' ||
    parentName === '品牌'
  ) {
    throw new Error('品牌货架不能作为商品主类目，请选择手提包等真实一/二级类目')
  }

  const isSecondary = Number(category.level) === 2 && !!category.parentId
  if (isSecondary) {
    const parent = category.parent
    if (parent?.status === 'ACTIVE') {
      return {
        primaryCategoryId: category.id,
        linkedCategoryIds: [parent.id, category.id],
        isSecondary: true,
        parentCategoryId: parent.id,
      }
    }
  }

  return {
    primaryCategoryId: category.id,
    linkedCategoryIds: [category.id],
    isSecondary: false,
    parentCategoryId: null,
  }
}

/** 将二级分类展开为「自身 + 一级父类」；一级分类保持自身 */
export const expandLinkedCategoryIdsWithParents = async (
  tx: any,
  categoryIds: string[]
): Promise<string[]> => {
  const uniqueIds = Array.from(new Set(categoryIds.filter(Boolean)))
  if (!uniqueIds.length) return []

  const categories = await tx.category.findMany({
    where: { id: { in: uniqueIds }, status: 'ACTIVE' },
    select: { id: true, level: true, parentId: true }
  })

  const result = new Set<string>()
  for (const category of categories) {
    result.add(category.id)
    if (Number(category.level) === 2 && category.parentId) {
      result.add(category.parentId)
    }
  }
  return Array.from(result)
}

const generateStructuredSpuCode = async (tx: any, shortCode: string, now = new Date()) => {
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

/**
 * 判断是否为「商品 SPU 编号 / slug」唯一约束冲突。
 * 并发批量发布时，多个独立事务可能读到同一个最大流水号并生成相同的
 * productCode / slug（`product_slug_key` / `product_productCode_key`），
 * 需要在上层用新流水号自动重试，而不是直接判发布失败。
 */
const isSpuCodeCollisionError = (error: any): boolean => {
  if (!error) return false
  const message = String(error?.message ?? '')
  const target = error?.meta?.target
  const targetText = Array.isArray(target) ? target.join(',') : String(target ?? '')
  if (error?.code === 'P2002') {
    if (/slug|product_?code/i.test(targetText)) return true
    if (/product_slug_key|product_productcode_key|slug|productcode/i.test(message)) return true
    return false
  }
  // 兜底：部分 MySQL 适配器不填充 meta.target，只能靠报错文本识别。
  return /Unique constraint failed on the constraint:\s*`?product_(slug|productCode)_key`?/i.test(message)
}

const normalizeText = (value: unknown) => String(value ?? '').trim()
const normalizeCommaText = (value: unknown) => normalizeText(value).replace(/，/g, ',')
const DEFAULT_GLOBAL_EXCHANGE_RATE = 6.5
const roundCurrency = (value: number) => Number(value.toFixed(2))

type ImportPricingCategoryMeta = {
  id: string
  name: string
  parentId: string | null
  priceCoefficient: unknown
  isBrandCategory?: boolean | null
}

const loadImportPricingCategories = async (db: typeof prisma) => {
  const categories = await db.category.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
      priceCoefficient: true,
      isBrandCategory: true,
    },
  })
  return new Map<string, ImportPricingCategoryMeta>(categories.map((category) => [category.id, category]))
}

const isBrandShelfParentName = (name?: string | null) =>
  ['brand', 'brands', '品牌'].includes(String(name || '').trim().toLowerCase())

const resolveImportCategoryCoefficient = (
  categoryMap: Map<string, ImportPricingCategoryMeta>,
  categoryId?: string | null,
) => {
  const current = categoryId ? categoryMap.get(categoryId) || null : null
  const parent = current?.parentId ? categoryMap.get(current.parentId) || null : null
  // Brand shelf L2 must not drive import pricing — fall through to default via nulls.
  const currentIsBrandChild =
    Boolean(current?.isBrandCategory) ||
    Boolean(parent?.isBrandCategory) ||
    isBrandShelfParentName(parent?.name)

  const own =
    current &&
    !currentIsBrandChild &&
    !isAggregatePricingCategoryName(current.name)
      ? toNumberOrNull(current.priceCoefficient)
      : null
  const parentCoefficient =
    parent &&
    !parent.isBrandCategory &&
    !isBrandShelfParentName(parent.name) &&
    !isAggregatePricingCategoryName(parent.name)
      ? toNumberOrNull(parent.priceCoefficient)
      : null
  return resolveCategoryPriceCoefficient(own, parentCoefficient)
}

const getGlobalExchangeRate = async (db: typeof prisma): Promise<number> => {
  const preferred = await db.currencysetting.findFirst({
    where: { isActive: true, isDefault: true },
    orderBy: { updatedAt: 'desc' },
    select: { exchangeRate: true },
  })
  const fallback = preferred
    ? null
    : await db.currencysetting.findFirst({
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        select: { exchangeRate: true },
      })
  const rate = toNumberOrNull(preferred?.exchangeRate ?? fallback?.exchangeRate)
  return rate && rate > 0 ? rate : DEFAULT_GLOBAL_EXCHANGE_RATE
}

/** 保留产品价格原始文本，禁止在此处做数值化或去逗号 */
const preserveProductPriceRaw = (value: unknown) => normalizeCommaText(value)

const parseSingleScalarPrice = (raw?: string) => {
  const normalized = preserveProductPriceRaw(raw)
  if (!normalized || normalized.includes(',')) return null
  return parseDecimal(normalized)
}

const parseDecimal = (value: unknown) => {
  const normalized = normalizeText(value).replace(/[¥,，\s]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const parseDecimalList = (value: unknown) =>
  normalizeCommaText(value)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => parseDecimal(part))
    .filter((part): part is number => part !== null)

const normalizeMultilineDetail = (value: unknown) => normalizeText(value).replace(/\\n/g, '\n')

const sleep = async (ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms))
}

const randomDelayMs = (minSeconds = 2, maxSeconds = 5) => {
  const min = Math.max(0, Math.floor(minSeconds * 1000))
  const max = Math.max(min, Math.floor(maxSeconds * 1000))
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const getTaskDelayWindow = (task: ImportTaskDbRecord) => {
  const minDelaySec = Math.max(0, Number(task.rateLimitMinDelaySec ?? 2) || 2)
  const maxDelaySec = Math.max(minDelaySec, Number(task.rateLimitMaxDelaySec ?? 5) || 5)
  return { minDelaySec, maxDelaySec }
}

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(String(value).replace(/[,$￥，\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

const formatFileSize = (size?: number) => {
  if (!size || size <= 0) return '未提供大小'
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

const parseDelimitedLine = (line: string) => {
  if (line.includes('\t')) {
    return line.split('\t').map(value => value.trim())
  }
  return line.split(',').map(value => value.trim())
}

const buildShortDescription = (detail: string, extras: string[]) => {
  const detailSummary = detail.replace(/\s+/g, ' ').trim()
  const extraSummary = extras.filter(Boolean).join('｜')
  const merged = [detailSummary, extraSummary].filter(Boolean).join('｜')
  return merged.slice(0, 180) || '导入商品待补充详情'
}

const mapTask = (t: any): ImportTaskRecord => ({
  task_id: t.id,
  task_taskName: t.taskName,
  task_status: t.status as ImportTaskStatusType,
  task_sourceLinkCount: t.sourceLinkCount,
  task_successCount: t.successCount,
  task_failureCount: t.failureCount,
  task_progressPercent: t.progressPercent,
  task_costDeductionUsd: t.markupRate?.toString() || null,
  task_defaultStatus: t.defaultStatus as ProductStatusType,
  task_defaultCategoryId: t.defaultCategoryId,
  task_stockStrategyJson: (t.stockStrategyJson as unknown as StockStrategyJson) || null,
  task_createdAt: t.createdAt
})

const mapTaskItem = (item: any): ImportTaskItemRecord => ({
  item_id: item.id,
  item_importTaskId: item.importTaskId,
  item_sourceUrl: item.sourceUrl,
  item_parsedName: item.parsedName,
  item_parsedMainImageUrl: item.parsedMainImageUrl,
  item_parsedPriceMin: item.parsedPriceMin?.toString() || null,
  item_parsedPriceMax: item.parsedPriceMax?.toString() || null,
  item_specSummaryJson: (item.specSummaryJson as unknown as SpecSummaryJson[]) || null,
  item_previewDataJson: (item.previewDataJson as unknown as PreviewDataJson) || null,
  item_fetchStatus: item.fetchStatus || null,
  item_publishStatus: item.publishStatus || null,
  item_isPublished: Boolean(item.isPublished),
  item_isSelected: item.isSelected,
  item_importedProductId: item.importedProductId,
  item_failureReason: item.failureReason,
  item_createdAt: item.createdAt
})

const parseSpecAttributes = (specText: string): Array<{ name: string; value: string }> => {
  const normalized = normalizeText(specText)
  if (!normalized) return [{ name: '规格', value: '默认规格' }]
  if (normalized.includes('/')) {
    const [color, size] = normalized.split('/').map(part => part.trim()).filter(Boolean)
    const attrs: Array<{ name: string; value: string }> = []
    if (color) attrs.push({ name: '颜色', value: color })
    if (size) attrs.push({ name: '尺码', value: size })
    return attrs.length > 0 ? attrs : [{ name: '规格', value: normalized }]
  }
  return [{ name: '规格', value: normalized }]
}

const formatSpecText = (attributes: Array<{ name: string; value: string }>, fallback = '默认规格') => {
  const values = attributes.map(attr => normalizeText(attr.value)).filter(Boolean)
  return values.length > 0 ? values.join(' / ') : fallback
}

const extract1688OfferId = (sourceUrl?: string | null) => {
  const matched = String(sourceUrl || '').match(/offer\/(\d+)/i)
  return matched?.[1] || null
}

/** 归一化导入去重键：1688 按 offerId，拼多多按 goods_id（忽略 query/spm 差异） */
const resolveImportLinkDedupeKey = (sourceUrl?: string | null): string | null => {
  const offerId = extract1688OfferId(sourceUrl)
  if (offerId) return `1688:${offerId}`
  const goodsId = extractPinduoduoGoodsId(String(sourceUrl || ''))
  if (goodsId) return `pdd:${goodsId}`
  return null
}

/**
 * 查库中已出现过的导入链接键（待上传 / 已发布均算重复）。
 * contains 查询后再用精确 offer/goods 校验，避免 offer/123 误伤 offer/1234。
 */
const findExistingImportLinkKeys = async (
  keys: string[],
  options?: { excludeItemIds?: string[] },
): Promise<Set<string>> => {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
  const existing = new Set<string>()
  if (!uniqueKeys.length) return existing

  const offerIds = uniqueKeys.filter((key) => key.startsWith('1688:')).map((key) => key.slice(5))
  const goodsIds = uniqueKeys.filter((key) => key.startsWith('pdd:')).map((key) => key.slice(4))
  const orClauses: Array<{ sourceUrl: { contains: string } }> = [
    ...offerIds.map((id) => ({ sourceUrl: { contains: `offer/${id}` } })),
    ...goodsIds.map((id) => ({ sourceUrl: { contains: `goods_id=${id}` } })),
  ]
  if (!orClauses.length) return existing

  const excludeItemIds = (options?.excludeItemIds || []).filter(Boolean)
  const CHUNK = 40
  for (let i = 0; i < orClauses.length; i += CHUNK) {
    const chunk = orClauses.slice(i, i + CHUNK)
    const rows = await prisma.importtaskitem.findMany({
      where: {
        OR: chunk,
        ...(excludeItemIds.length ? { id: { notIn: excludeItemIds } } : {}),
      },
      select: { sourceUrl: true },
    })
    for (const row of rows) {
      const key = resolveImportLinkDedupeKey(row.sourceUrl)
      if (key && uniqueKeys.includes(key)) existing.add(key)
    }
  }
  return existing
}

/** 本次粘贴内按 offer/goods 去重，并剔除库中已有的重复链接 */
const filterFreshImportUrls = async (validUrls: string[]) => {
  const freshUrls: string[] = []
  const seenKeys = new Set<string>()
  let skippedInBatch = 0
  const candidateKeys: string[] = []

  for (const url of validUrls) {
    const key = resolveImportLinkDedupeKey(url)
    if (!key) {
      freshUrls.push(url)
      continue
    }
    if (seenKeys.has(key)) {
      skippedInBatch += 1
      continue
    }
    seenKeys.add(key)
    candidateKeys.push(key)
    freshUrls.push(url)
  }

  const existingKeys = await findExistingImportLinkKeys(candidateKeys)
  const acceptedUrls: string[] = []
  let skippedExisting = 0
  for (const url of freshUrls) {
    const key = resolveImportLinkDedupeKey(url)
    if (key && existingKeys.has(key)) {
      skippedExisting += 1
      continue
    }
    acceptedUrls.push(url)
  }

  return {
    acceptedUrls,
    skippedDuplicateCount: skippedInBatch + skippedExisting,
  }
}

const decodeJsonLikeString = (value: unknown) =>
  String(value ?? '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()

const pickJsonStringField = (html: string, key: string) => {
  const matched = html.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'i'))
  return matched?.[1] ? decodeJsonLikeString(matched[1]) : null
}

/** 从 1688 HTML 中尽量抓取属性对（Style / Material 等）写入 parameterJson */
const parse1688FeatureAttributes = (html: string): Array<{ key: string; value: string }> => {
  const rows: Array<{ key: string; value: string }> = []
  const seen = new Set<string>()
  const push = (key?: string | null, value?: string | null) => {
    const k = String(key || '').trim()
    const v = String(value || '').trim()
    if (!k || !v || k.length > 40 || v.length > 200) return
    const id = `${k.toLowerCase()}::${v.toLowerCase()}`
    if (seen.has(id)) return
    seen.add(id)
    rows.push({ key: k, value: v })
  }

  // {"name":"Style","value":"Fashion"} / {"attributeName":"...","value":"..."}
  const pairRegex =
    /\{\s*"(?:name|attributeName|attrName|featureName|propName)"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"(?:value|attributeValue|attrValue|featureValue|propValue)"\s*:\s*"((?:\\.|[^"\\])*)"/gi
  let matched: RegExpExecArray | null
  while ((matched = pairRegex.exec(html)) && rows.length < 30) {
    push(decodeJsonLikeString(matched[1]), decodeJsonLikeString(matched[2]))
  }

  // 反序 value 在前
  if (rows.length === 0) {
    const reverseRegex =
      /\{\s*"(?:value|attributeValue)"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"(?:name|attributeName)"\s*:\s*"((?:\\.|[^"\\])*)"/gi
    while ((matched = reverseRegex.exec(html)) && rows.length < 30) {
      push(decodeJsonLikeString(matched[2]), decodeJsonLikeString(matched[1]))
    }
  }

  return rows
}

const buildParameterJsonFromAttrs = (attrs: Array<{ key: string; value: string }>) => {
  if (!attrs.length) return null
  return [
    {
      group: 'Description',
      items: attrs.map((item) => ({ key: item.key, value: item.value })),
    },
  ]
}

/** 统一补全协议：trim、`//`→https:、http→https */
const normalizeRemoteImageUrl = (raw?: string | null) => {
  const value = String(raw || '').trim()
  if (!value || /^data:/i.test(value)) return null
  // Self-hosted uploads are stored as same-origin paths. Treat them as valid
  // gallery images instead of dropping every image except the main-image fallback.
  if (
    /^\/api\/uploads\/[A-Za-z0-9._/-]+$/i.test(value) &&
    !value.split('/').includes('..')
  ) {
    return value
  }
  if (value.startsWith('//')) return `https:${value}`
  if (/^http:\/\//i.test(value)) return `https://${value.slice(7)}`
  if (/^https:\/\//i.test(value)) return value
  return null
}

/** 商品主图/详情图最短边；任一边 < 此值视为 UI 图标 */
const MIN_1688_PRODUCT_IMAGE_PX = 100

const isProductCdnHost = (url: string) =>
  /alicdn\.com|img\.1688\.com|cbu\d*\.alicdn|gw\.alicdn|imgextra|taobaocdn/i.test(url)

/** 1688/阿里商品图常见路径（主图、详情、相册），优先保留 */
const isProductGalleryPath = (url: string) =>
  /\/(?:imgextra|bao\/uploaded|img\/ibank|kf\/|img\/[a-z]{2}\/|photo\/|offer\/|product\/)/i.test(url) ||
  /(?:cbu\d*|img)\.alicdn\.com\/(?:imgextra|kf|bao|img)\//i.test(url)

/**
 * 视频资源 / 视频封面 CDN：主图画廊解析时必须跳过，继续收集后续商品图，
 * 避免有视频的 offer 只拿到封面或截断色图列表。
 */
const isLikely1688VideoAsset = (raw?: string | null): boolean => {
  const value = String(raw || '').trim()
  if (!value) return false
  const lower = value.toLowerCase()
  if (/\.(?:mp4|webm|m3u8|mov|flv|m4v|avi)(?:$|[?#])/i.test(lower)) return true
  if (/alivideo|aliplayer|video\.taobao|cloud\.video|tbvideo|videoplay|video-?cdn|\/video\/|\/videos\//i.test(lower)) {
    return true
  }
  if (/[?&](?:video|vid|mediaType=video)/i.test(lower)) return true
  return false
}

/** HTML 片段是否落在 video / aliVideo 节点附近（画廊遍历时跳过该节点，继续往后） */
const isLikely1688VideoHtmlContext = (snippet: string): boolean =>
  /<video\b|<\/video>\s*|alivideo|aliplayer|data-video(?:-src)?\s*=|video-player|lib-video|tb-video|class=["'][^"']*video-cover/i.test(
    snippet,
  )

/**
 * 从 URL 尺寸后缀解析宽高，例如：
 * `_50x50.jpg` / `_100x100q90.jpg` / `.jpg_80x80.jpg` / `_.webp_90x90`
 */
const parseImageSizeHintFromUrl = (raw?: string | null): { width: number; height: number } | null => {
  const value = String(raw || '')
  if (!value) return null
  const patterns = [
    /_(\d{1,4})x(\d{1,4})[a-z0-9]*\.(?:jpg|jpeg|png|webp|gif|bmp)/i,
    /\.(?:jpg|jpeg|png|webp|gif|bmp)_(\d{1,4})x(\d{1,4})[a-z0-9]*/i,
    /[_.-](\d{1,4})x(\d{1,4})(?:q\d+)?(?:\.(?:jpg|jpeg|png|webp|gif|bmp))?/i,
  ]
  for (const re of patterns) {
    const matched = value.match(re)
    if (!matched) continue
    const width = Number(matched[1])
    const height = Number(matched[2])
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height }
    }
  }
  return null
}

const isKnownTooSmallImage = (
  url: string,
  htmlSize?: { width?: number | null; height?: number | null } | null
) => {
  const fromHtmlW = htmlSize?.width != null ? Number(htmlSize.width) : null
  const fromHtmlH = htmlSize?.height != null ? Number(htmlSize.height) : null
  if (
    (fromHtmlW != null && Number.isFinite(fromHtmlW) && fromHtmlW > 0 && fromHtmlW < MIN_1688_PRODUCT_IMAGE_PX) ||
    (fromHtmlH != null && Number.isFinite(fromHtmlH) && fromHtmlH > 0 && fromHtmlH < MIN_1688_PRODUCT_IMAGE_PX)
  ) {
    return true
  }
  const hint = parseImageSizeHintFromUrl(url)
  if (!hint) return false
  return hint.width < MIN_1688_PRODUCT_IMAGE_PX || hint.height < MIN_1688_PRODUCT_IMAGE_PX
}

/** 客服/收藏星/店铺标/倒计时等 UI 小图标路径与扩展名 */
const isObviousIconOrUiAssetUrl = (url: string) => {
  const lower = url.toLowerCase()
  if (/\.svg(?:$|[?#_])/i.test(lower)) return true
  if (
    /1x1|blank\.(?:gif|png)|pixel|spacer|favicon|sprite|avatar|wangwang|countdown|qrcode|qr[_-]?code/i.test(
      lower
    )
  ) {
    return true
  }
  if (
    /(?:^|[/_-])(?:icon|icons|logo|logos|star|stars|favorite|collect|kefu|customer[_-]?service|shop[_-]?logo)(?:[_./-]|$)/i.test(
      lower
    )
  ) {
    return true
  }
  if (/\/(?:img\/)?(?:icon|icons|logo|logos)\//i.test(lower)) return true
  if (/icon_[a-z0-9_-]+\.(?:png|gif|webp)/i.test(lower)) return true
  // 非商品路径上的小 png/gif，多为页面装饰图
  if (/\.(?:png|gif)(?:$|[?#_])/i.test(lower) && !isProductGalleryPath(url)) return true
  return false
}

/**
 * 是否保留为 1688 商品主图/详情图候选。
 * - 必须是商品 CDN
 * - 排除 UI 图标 / svg / 明显小图
 * - 已知宽或高 < 100px 则丢弃（除非尺寸后缀来自商品相册缩略图且可还原为大图路径）
 */
const isLikelyProductImageUrl = (
  url: string,
  options?: { htmlSize?: { width?: number | null; height?: number | null } | null; allowProductThumbUpgrade?: boolean }
) => {
  if (!url || isLikely1688VideoAsset(url)) return false
  if (!isProductCdnHost(url)) return false
  if (isObviousIconOrUiAssetUrl(url)) return false

  const tooSmall = isKnownTooSmallImage(url, options?.htmlSize)
  if (tooSmall) {
    // 商品相册缩略图 `_50x50` 等可经 HD 还原；仅当路径像商品图时放行给后续 to1688HdImageUrl
    if (options?.allowProductThumbUpgrade && isProductGalleryPath(url)) return true
    return false
  }

  // 尺寸未知：非商品路径的可疑资源丢弃；商品路径保留
  if (!isProductGalleryPath(url)) {
    // 宽松：jpg/jpeg/webp 仍可能是详情图；png 已在图标规则中处理
    if (!/\.(?:jpe?g|webp)(?:$|[?#_])/i.test(url)) return false
  }
  return true
}

/** 去掉 alicdn 缩略图尺寸后缀，尽量还原详情大图/原图 URL */
const to1688HdImageUrl = (raw?: string | null): string | null => {
  const normalized = normalizeRemoteImageUrl(raw)
  if (!normalized) return null
  if (isLikely1688VideoAsset(normalized)) return null
  // 明显图标直接丢弃，避免把小图“升格”成假大图 URL
  if (isObviousIconOrUiAssetUrl(normalized)) return null
  // 已知过小且非商品相册路径 → 不下载
  if (isKnownTooSmallImage(normalized) && !isProductGalleryPath(normalized)) return null

  let url = normalized.split(/[?#]/)[0]
  // xxx.jpg_.webp / xxx.png_Q90.jpg_.webp
  url = url.replace(/_\.webp$/i, '')
  // _sum.jpg
  url = url.replace(/_sum\.(jpg|jpeg|png|webp)$/i, '.$1')
  // _100x100.jpg / _400x400q90.jpg / _50x50q90.jpg
  url = url.replace(/_\d+x\d+[a-z0-9]*\.(jpg|jpeg|png|webp)$/i, '.$1')
  // .jpg_350x350.jpg / .jpg_50x50q90.jpg.jpg
  url = url.replace(/\.(jpg|jpeg|png|webp)_\d+x\d+[a-z0-9]*(?:\.\1)?$/i, '.$1')
  // trailing .webp after real ext
  url = url.replace(/\.(jpg|jpeg|png)\.webp$/i, '.$1')
  const hd = normalizeRemoteImageUrl(url)
  if (!hd || isObviousIconOrUiAssetUrl(hd)) return null
  return hd
}

/**
 * Same asset under different size suffixes / hosts must collapse to one gallery slot.
 * Key is the pathname after HD normalization (ignore query + cbu01/cbu02 host swap).
 */
const imageUrlDedupeKey = (raw: string): string => {
  const hd = to1688HdImageUrl(raw) || normalizeRemoteImageUrl(raw) || raw
  try {
    const parsed = new URL(hd)
    return parsed.pathname.replace(/\/+/g, '/').toLowerCase()
  } catch {
    return hd.split(/[?#]/)[0].toLowerCase()
  }
}

const dedupeImageUrls = (urls: Array<string | null | undefined>) => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of urls) {
    const url = normalizeRemoteImageUrl(raw)
    if (!url) continue
    const key = imageUrlDedupeKey(url)
    if (!key || seen.has(key)) continue
    seen.add(key)
    // Prefer the unsized HD form when we can derive it.
    result.push(to1688HdImageUrl(url) || url)
  }
  return result
}

/**
 * 提取某 key 下全部字符串数组（合并去重）。
 * 遇视频 URL 跳过并继续收集后续图片，避免首条 mp4/aliVideo 截断画廊。
 */
const extractJsonStringArrayField = (html: string, key: string): string[] => {
  const urls: string[] = []
  const keyRe = new RegExp(`"${key}"\\s*:\\s*\\[`, 'gi')
  let matched: RegExpExecArray | null
  while ((matched = keyRe.exec(html))) {
    const startIdx = matched.index + matched[0].length - 1
    let depth = 0
    let inString = false
    let escaped = false
    let endIdx = -1
    for (let i = startIdx; i < html.length; i += 1) {
      const ch = html[i]
      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '[') depth += 1
      else if (ch === ']') {
        depth -= 1
        if (depth === 0) {
          endIdx = i
          keyRe.lastIndex = i + 1
          break
        }
      }
      if (i - startIdx > 200_000) break
    }
    if (endIdx < 0) continue
    const slice = html.slice(startIdx, endIdx + 1)
    const re = /"((?:\\.|[^"\\])*)"/g
    let item: RegExpExecArray | null
    while ((item = re.exec(slice))) {
      const decoded = decodeJsonLikeString(item[1])
      if (!decoded || isLikely1688VideoAsset(decoded)) continue
      urls.push(decoded)
    }
  }
  return urls
}

/** Browser HTML repeats the same JSON blobs many times — gallery only needs the first list. */
const extractFirstJsonStringArrayField = (html: string, key: string): string[] => {
  const keyRe = new RegExp(`"${key}"\\s*:\\s*\\[`, 'i')
  const matched = keyRe.exec(html)
  if (!matched) return []
  const startIdx = matched.index + matched[0].length - 1
  let depth = 0
  let inString = false
  let escaped = false
  let endIdx = -1
  for (let i = startIdx; i < html.length; i += 1) {
    const ch = html[i]
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '[') depth += 1
    else if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        endIdx = i
        break
      }
    }
    if (i - startIdx > 200_000) break
  }
  if (endIdx < 0) return []
  const urls: string[] = []
  const re = /"((?:\\.|[^"\\])*)"/g
  let item: RegExpExecArray | null
  const slice = html.slice(startIdx, endIdx + 1)
  while ((item = re.exec(slice))) {
    const decoded = decodeJsonLikeString(item[1])
    if (!decoded || isLikely1688VideoAsset(decoded)) continue
    urls.push(decoded)
  }
  return urls
}

/** 从 HTML/脚本中收集可能的商品图 URL（含协议相对地址）；附带 img 宽高属性用于过滤小图标 */
const extractRawImageUrlsFromHtml = (html: string): string[] => {
  const urls: string[] = []
  const pushIfProduct = (
    raw: string,
    htmlSize?: { width?: number | null; height?: number | null } | null
  ) => {
    const cleaned = raw.replace(/\\u002F/gi, '/').replace(/\\+/g, '')
    if (isLikely1688VideoAsset(cleaned)) return
    if (
      !isLikelyProductImageUrl(cleaned, {
        htmlSize,
        allowProductThumbUpgrade: true,
      })
    ) {
      return
    }
    urls.push(cleaned)
  }

  const cdnRe =
    /(?:https?:)?\/\/(?:[a-z0-9.-]+\.)?(?:alicdn\.com|img\.1688\.com|taobaocdn\.com)\/[^"'\\\s<>]+/gi
  let matched: RegExpExecArray | null
  while ((matched = cdnRe.exec(html))) {
    // 视频 CDN / mp4 直接跳过，继续扫后续图片 URL
    if (isLikely1688VideoAsset(matched[0])) continue
    const around = html.slice(Math.max(0, matched.index - 220), matched.index + matched[0].length + 40)
    if (isLikely1688VideoHtmlContext(around)) continue
    pushIfProduct(matched[0])
  }

  // 整段 <img ...>，读取 width/height 属性过滤 UI 小图；video 节点内封面图跳过
  const imgTagRe = /<img\b[^>]*>/gi
  while ((matched = imgTagRe.exec(html))) {
    const tag = matched[0]
    const around = html.slice(Math.max(0, matched.index - 280), matched.index + tag.length + 80)
    if (isLikely1688VideoHtmlContext(around)) continue
    const src =
      tag.match(/(?:src|data-src|data-lazyload-src|data-original)=["']((?:https?:)?\/\/[^"']+)["']/i)?.[1] ||
      null
    if (!src || isLikely1688VideoAsset(src)) continue
    const widthRaw = tag.match(/\bwidth=["']?(\d+)/i)?.[1]
    const heightRaw = tag.match(/\bheight=["']?(\d+)/i)?.[1]
    const styleW = tag.match(/width\s*:\s*(\d+)px/i)?.[1]
    const styleH = tag.match(/height\s*:\s*(\d+)px/i)?.[1]
    pushIfProduct(src, {
      width: widthRaw || styleW ? Number(widthRaw || styleW) : null,
      height: heightRaw || styleH ? Number(heightRaw || styleH) : null,
    })
  }

  const attrRe =
    /(?:src|data-src|data-lazyload-src|data-original)=["']((?:https?:)?\/\/[^"']+)["']/gi
  while ((matched = attrRe.exec(html))) {
    if (isLikely1688VideoAsset(matched[1])) continue
    const around = html.slice(Math.max(0, matched.index - 220), matched.index + matched[0].length + 40)
    if (isLikely1688VideoHtmlContext(around)) continue
    pushIfProduct(matched[1])
  }
  return urls
}

const probeRemoteImageUrl = async (url: string): Promise<boolean> => {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    Referer: 'https://detail.1688.com/',
  }
  try {
    const headController = new AbortController()
    const headTimer = setTimeout(() => headController.abort(), 4000)
    const headRes = await fetch(url, {
      method: 'HEAD',
      signal: headController.signal,
      redirect: 'follow',
      headers,
    })
    clearTimeout(headTimer)
    if (headRes.ok) {
      const contentType = headRes.headers.get('content-type') || ''
      if (!contentType || /image|octet-stream|binary/i.test(contentType)) return true
    }
    // 部分 CDN 不支持 HEAD / 返回异常 content-type，再用轻量 GET 探测
    if (headRes.status === 404 || headRes.status === 410) return false
  } catch {
    // fall through to GET
  }

  try {
    const getController = new AbortController()
    const getTimer = setTimeout(() => getController.abort(), 5000)
    const getRes = await fetch(url, {
      method: 'GET',
      signal: getController.signal,
      redirect: 'follow',
      headers: {
        ...headers,
        Range: 'bytes=0-1023',
      },
    })
    clearTimeout(getTimer)
    if (getRes.status === 404 || getRes.status === 410) return false
    if (!(getRes.ok || getRes.status === 206)) return false
    const contentType = getRes.headers.get('content-type') || ''
    return !contentType || /image|octet-stream|binary/i.test(contentType)
  } catch {
    return false
  }
}

/**
 * 优先采用高清/原图列表；若探测失败则回退到带水印主图列表，避免空白图。
 * 探测策略：最多试前 3 张 HD；任一张可用则信任同批其余 URL，全部失败才走 fallback。
 */
const resolve1688ImageUrls = async (params: {
  hdCandidates: string[]
  watermarkedFallback: string[]
  maxProbe?: number
}): Promise<{ mainImageUrl: string | null; detailImages: string[]; usedFallback: boolean }> => {
  const maxProbe = params.maxProbe ?? 3
  // HD 列表已去掉尺寸后缀；再按路径/图标规则过滤一遍
  const hdList = dedupeImageUrls(params.hdCandidates)
    .filter(url => isLikelyProductImageUrl(url))
    .slice(0, 12)
  const fallbackList = dedupeImageUrls(
    dedupeImageUrls(params.watermarkedFallback)
      .filter(url => isLikelyProductImageUrl(url, { allowProductThumbUpgrade: true }))
      .map(url => to1688HdImageUrl(url) || url)
      .filter(url => isLikelyProductImageUrl(url))
  ).slice(0, 12)

  let hdOk = false
  for (const url of hdList.slice(0, maxProbe)) {
    if (await probeRemoteImageUrl(url)) {
      hdOk = true
      break
    }
  }

  if (hdOk) {
    return {
      mainImageUrl: hdList[0] || null,
      detailImages: hdList,
      usedFallback: false,
    }
  }

  if (fallbackList.length > 0) {
    return {
      mainImageUrl: fallbackList[0],
      detailImages: fallbackList,
      usedFallback: true,
    }
  }

  // 探测均失败且无水印主图时，仍返回未验证的 HD 候选，避免空白（下载阶段再兜底）
  if (hdList.length > 0) {
    return {
      mainImageUrl: hdList[0],
      detailImages: hdList,
      usedFallback: false,
    }
  }

  return { mainImageUrl: null, detailImages: [], usedFallback: true }
}

/** 从 1688 详情 HTML 解析主图（水印缩略）与详情大图候选 */
const extract1688ImageCandidates = (html: string) => {
  // First occurrence only: full browser HTML repeats the same JSON many times, and
  // imageList/images often dump every SKU swatch — that flooded the pending gallery.
  const offerImgList = extractFirstJsonStringArrayField(html, 'offerImgList')
  const imageList =
    offerImgList.length > 0
      ? []
      : extractFirstJsonStringArrayField(html, 'imageList').length > 0
        ? extractFirstJsonStringArrayField(html, 'imageList')
        : extractFirstJsonStringArrayField(html, 'images')
  const singleFields =
    offerImgList.length > 0
      ? []
      : ([
          pickJsonStringField(html, 'imgUrl'),
          pickJsonStringField(html, 'imageUrl'),
          pickJsonStringField(html, 'mainImage'),
          pickJsonStringField(html, 'whiteImage'),
          pickJsonStringField(html, 'fullPathImageURI'),
        ].filter(Boolean) as string[])

  const gallerySourceUrls = dedupeImageUrls([
    ...offerImgList,
    ...imageList,
    ...singleFields.filter(url => !isLikely1688VideoAsset(url)),
  ]).filter(url => isLikelyProductImageUrl(url, { allowProductThumbUpgrade: true }))

  const watermarkedFallback = gallerySourceUrls.filter(url =>
    isLikelyProductImageUrl(url, { allowProductThumbUpgrade: true })
  )

  const hdFromLists = gallerySourceUrls
    .map(to1688HdImageUrl)
    .filter((url): url is string => Boolean(url))
    .filter(url => isLikelyProductImageUrl(url))

  // Structured carousel is enough; DOM scrape pulls color swatches + UI chrome.
  const hdCandidates = dedupeImageUrls(hdFromLists)
    .filter(url => isLikelyProductImageUrl(url))
    .slice(0, 12)

  return { hdCandidates, watermarkedFallback: watermarkedFallback.slice(0, 12) }
}

/**
 * 右侧颜色选项列表：逐色提取 name + 独立缩略图。
 * 优先 skuProps.imageUrl；DOM title/alt + 邻近 img 作补全（不回退主图冒充）。
 * 含 display:none / 折叠区内节点（HTML 字符串扫描，不依赖可见性）。
 * 无图或视频封面时仍保留颜色名（imageUrl=null），禁止因图无效而丢色。
 */
const extract1688ColorOptionsFromHtml = (
  html: string,
): Array<{ label: string; imageUrl: string | null }> => {
  const results: Array<{ label: string; imageUrl: string | null }> = []
  const seen = new Set<string>()

  const pushColor = (rawLabel: string, rawImage?: string | null) => {
    const label = normalizeText(rawLabel)
    if (!label || label.length > 40) return
    if (/^[￥¥$]|^\d+(\.\d+)?$|加入进货|立即订购|收藏|客服|视频|播放/i.test(label)) return
    if (/^(颜色|颜色分类|花色|花色分类|尺码|尺寸|规格|鞋码|Size|Colour|Color)$/i.test(label)) return
    // 纯尺码文案（35/M/XL）不当作颜色，避免折叠尺码块污染色表
    if (/^(?:[0-9]{1,3}(?:\.[0-5])?|[Xx]?[SsMlLl]{1,3}|均码|自由尺码)$/i.test(label)) return
    const imageUrlRaw = normalizeRemoteImageUrl(rawImage)
    let imageUrl: string | null = null
    if (imageUrlRaw && !isLikely1688VideoAsset(imageUrlRaw)) {
      imageUrl = to1688HdImageUrl(imageUrlRaw) || imageUrlRaw
      if (imageUrl && isLikely1688VideoAsset(imageUrl)) imageUrl = null
    }
    if (seen.has(label)) {
      // 已有颜色但无图时补缩略图
      if (imageUrl) {
        const existing = results.find(item => item.label === label)
        if (existing && !existing.imageUrl) existing.imageUrl = imageUrl
      }
      return
    }
    seen.add(label)
    results.push({ label, imageUrl })
  }

  // 1) 结构化 JSON：name + imageUrl（字段可不相邻；无图条目由 skuProps 主路径收录）
  const jsonObjectRe =
    /\{\s*[^{}]{0,800}?(?:"(?:name|value|text|label|attributeValue|originalValueName)"\s*:\s*"((?:\\.|[^"\\])*)")[^{}]{0,800}?(?:"(?:imageUrl|imgUrl|image|skuImage|pictureUrl|picUrl)"\s*:\s*"((?:\\.|[^"\\])*)")[^{}]{0,200}?\}/gi
  let matched: RegExpExecArray | null
  while ((matched = jsonObjectRe.exec(html))) {
    pushColor(decodeJsonLikeString(matched[1]), decodeJsonLikeString(matched[2]))
  }
  const jsonObjectReRev =
    /\{\s*[^{}]{0,800}?(?:"(?:imageUrl|imgUrl|image|skuImage|pictureUrl|picUrl)"\s*:\s*"((?:\\.|[^"\\])*)")[^{}]{0,800}?(?:"(?:name|value|text|label|attributeValue|originalValueName)"\s*:\s*"((?:\\.|[^"\\])*)")[^{}]{0,200}?\}/gi
  while ((matched = jsonObjectReRev.exec(html))) {
    pushColor(decodeJsonLikeString(matched[2]), decodeJsonLikeString(matched[1]))
  }

  // 2) 右侧色块 DOM：title/alt + 邻近 img（含 style="display:none" 节点）
  const titleImgRe =
    /(?:title|alt|data-name|data-value|data-sku-value)=["']([^"']{1,40})["'][^>]{0,480}(?:src|data-src|data-lazyload-src|data-original)=["']((?:https?:)?\/\/[^"']+)["']/gi
  while ((matched = titleImgRe.exec(html))) {
    const around = html.slice(Math.max(0, matched.index - 160), matched.index + matched[0].length + 60)
    if (isLikely1688VideoHtmlContext(around)) continue
    pushColor(matched[1], matched[2])
  }
  const imgTitleRe =
    /(?:src|data-src|data-lazyload-src|data-original)=["']((?:https?:)?\/\/[^"']+)["'][^>]{0,480}(?:title|alt|data-name|data-value|data-sku-value)=["']([^"']{1,40})["']/gi
  while ((matched = imgTitleRe.exec(html))) {
    const around = html.slice(Math.max(0, matched.index - 160), matched.index + matched[0].length + 60)
    if (isLikely1688VideoHtmlContext(around)) continue
    pushColor(matched[2], matched[1])
  }

  // 3) prop-item / sku-prop 色块（折叠 display:none 仍在源码中）；要求同块有缩略图，避免把尺码文案当色
  const propItemRe =
    /<(?:div|li|a|span)[^>]*(?:prop-item|sku-prop|sku-property|obj-leading|filter-item|color-item)[^>]*>[\s\S]{0,600}?<\/(?:div|li|a|span)>/gi
  while ((matched = propItemRe.exec(html))) {
    const block = matched[0]
    if (isLikely1688VideoHtmlContext(block)) continue
    // background-image / background:url(...)
    const bg =
      block.match(/background-image\s*:\s*url\(\s*['"]?((?:https?:)?\/\/[^'")\s]+)['"]?\s*\)/i)?.[1] ||
      block.match(/background\s*:\s*url\(\s*['"]?((?:https?:)?\/\/[^'")\s]+)['"]?\s*\)/i)?.[1] ||
      null
    const img =
      block.match(/(?:src|data-src|data-lazyload-src|data-original)=["']((?:https?:)?\/\/[^"']+)["']/i)?.[1] ||
      bg ||
      null
    const label =
      block.match(/(?:title|alt|data-name|data-value|data-sku-value)=["']([^"']{1,40})["']/i)?.[1] ||
      block.match(/<(?:span|em|i|p)[^>]*>\s*([^<]{1,40})\s*<\/(?:span|em|i|p)>/i)?.[1] ||
      null
    if (label && img) pushColor(label, img)
  }

  // 4) data-imgs / data-image JSON：常含 small/big/original 多尺寸图
  const dataImgsRe =
    /(?:data-imgs|data-image|data-images)=["']([^"']{20,2000})["']/gi
  while ((matched = dataImgsRe.exec(html))) {
    const decoded = decodeJsonLikeString(matched[1])
    // Try pull any CDN url inside this attribute
    const urlMatch =
      decoded.match(/(?:https?:)?\/\/(?:[a-z0-9.-]+\.)?(?:alicdn\.com|img\.1688\.com|taobaocdn\.com)\/[^"'\\\s<>]+/i)?.[0] ||
      null
    if (!urlMatch) continue
    // Label usually nearby as title/alt/valueName; use a small window to search
    const around = html.slice(Math.max(0, matched.index - 220), matched.index + matched[0].length + 220)
    const label =
      around.match(/(?:title|alt|data-name|data-value|data-sku-value)=["']([^"']{1,40})["']/i)?.[1] ||
      around.match(/"name"\s*:\s*"((?:\\.|[^"\\]){1,40})"/i)?.[1] ||
      null
    if (label) pushColor(decodeJsonLikeString(label), urlMatch)
  }

  return results
}

const parsePriceRangeText = (raw?: string | null) => {
  const text = String(raw || '')
  const nums = Array.from(text.matchAll(/(\d+(?:\.\d+)?)/g))
    .map(item => Number(item[1]))
    .filter(num => Number.isFinite(num) && num > 0)
  if (!nums.length) return { min: null as number | null, max: null as number | null }
  return { min: Math.min(...nums), max: Math.max(...nums) }
}

const isPlaceholderPendingName = (name?: string | null) =>
  !name ||
  /^\[1688抓取\]/.test(name) ||
  /^\[1688\?+\]/.test(name) ||
  isCharsetCorruptedText(name)

const isPlaceholderPendingImage = (url?: string | null) =>
  !url ||
  /images\.unsplash\.com/i.test(url) ||
  /photo-1581091226825-a6a2a5aee158/i.test(url)

/** 旧版空解析路径硬编码的演示 SKU：红色/M | 蓝色/L | 黑色/XL */
const isClassicMock1688SkuSummary = (text?: string | null) => {
  const normalized = String(text || '').replace(/\s+/g, '')
  return (
    normalized.includes('红色/M') &&
    normalized.includes('蓝色/L') &&
    normalized.includes('黑色/XL')
  )
}

const isClassicMock1688SkuTable = (table?: PreviewSkuTableRow[] | null) => {
  if (!Array.isArray(table) || table.length !== 3) return false
  const joined = table.map(row => normalizeText(row.spec)).join('|')
  if (isClassicMock1688SkuSummary(joined)) return true
  const colors = table
    .map(row => row.attributes?.find(attr => attr.name === '颜色')?.value)
    .filter(Boolean)
  const sizes = table
    .map(row => row.attributes?.find(attr => attr.name === '尺码')?.value)
    .filter(Boolean)
  return (
    colors.length === 3 &&
    sizes.length === 3 &&
    colors[0] === '红色' &&
    colors[1] === '蓝色' &&
    colors[2] === '黑色' &&
    sizes[0] === 'M' &&
    sizes[1] === 'L' &&
    sizes[2] === 'XL'
  )
}

const buildNeutralFallbackSkuRow = (params: {
  costPrice: number
  price: number
  stock: number
}): PreviewSkuTableRow => ({
  skuKey: 'sku-1',
  spec: '默认规格',
  costPrice: params.costPrice,
  price: params.price,
  stock: params.stock,
  // 默认规格行不写死 500，交由上层「提取/分类兜底」决定重量
  weightGrams: null,
  imageUrl: null,
  attributes: [{ name: '规格', value: '默认规格' }],
})

/** 是否仅为「默认规格」占位（无颜色/尺码维） */
const isDefaultOnlySkuTable = (table?: PreviewSkuTableRow[] | null) => {
  if (!Array.isArray(table) || table.length === 0) return true
  if (table.length !== 1) return false
  const row = table[0]
  const attrs = Array.isArray(row.attributes) ? row.attributes : []
  const hasColorOrSize = attrs.some(attr => {
    const name = normalizeText(attr.name)
    return name === '颜色' || name === '尺码' || name === '尺寸'
  })
  if (hasColorOrSize) return false
  const spec = normalizeText(row.spec)
  const value = normalizeText(attrs[0]?.value)
  return (
    !attrs.length ||
    (attrs.length === 1 && (value === '默认规格' || value === '默认')) ||
    spec === '默认规格' ||
    !spec
  )
}

/**
 * 有颜色时禁止只落「默认规格」：按 colors × sizesByColor 展开真实 SKU。
 * 无尺码时每个颜色一行（仅 颜色 属性）。
 */
const expandSkuTableFromColors = (params: {
  colors: Array<{ label: string; imageUrl?: string | null }>
  sizesByColor?: Record<string, string[]> | null
  costPrice: number
  price: number
  stock: number
  weightGrams?: number | null
}): PreviewSkuTableRow[] => {
  const colors = (params.colors || [])
    .map(color => ({
      label: normalizeText(color.label),
      imageUrl: normalizeText(color.imageUrl) || null,
    }))
    .filter(color => color.label)
  if (!colors.length) return []

  const sizesByColor = params.sizesByColor && typeof params.sizesByColor === 'object'
    ? params.sizesByColor
    : {}
  const rows: PreviewSkuTableRow[] = []
  let index = 0
  for (const color of colors) {
    const sizes = Array.from(
      new Set((sizesByColor[color.label] || []).map(size => normalizeText(size)).filter(Boolean)),
    )
    const sizeList = sizes.length > 0 ? sizes : [null]
    for (const size of sizeList) {
      index += 1
      const attributes: Array<{ name: string; value: string }> = [
        { name: '颜色', value: color.label },
      ]
      if (size) attributes.push({ name: '尺码', value: size })
      rows.push({
        skuKey: `sku-${index}`,
        spec: formatSpecText(attributes),
        costPrice: params.costPrice,
        price: params.price,
        stock: params.stock,
        // 颜色展开的行不写死 500，交由上层「提取/分类兜底」决定，避免默认重量失效
        weightGrams: params.weightGrams ?? null,
        imageUrl: color.imageUrl,
        attributes,
      })
    }
  }
  return rows
}

const isSizeDimensionName = (raw?: string | null) => {
  const name = normalizeText(raw).toLowerCase()
  return (
    name === '尺码' ||
    name === '鞋码' ||
    name === '尺寸' ||
    name === '码数' ||
    name === 'size' ||
    name === 'sizing' ||
    name === '规格'
  )
}

const splitRecoverableSizeValues = (raw?: string | null) =>
  Array.from(
    new Set(
      normalizeText(raw)
        .split(/[,，、;；|｜/\s]+/)
        .map(value => normalizeText(value))
        .filter(value => value && !/^(默认|默认规格|default|standard)$/i.test(value)),
    ),
  )

/**
 * skuTable 偶尔只有颜色，但参数/规格摘要仍保留了真实尺码。
 * 仅使用采集结果中明确存在的值补全 colors×sizes，绝不猜测尺码。
 */
const resolveRecoverableSizesByColor = (
  preview: PreviewDataJson,
  specSummary?: SpecSummaryJson[] | null,
) => {
  const resolved: Record<string, string[]> = {}
  for (const [color, values] of Object.entries(preview.sizesByColor || {})) {
    resolved[normalizeText(color)] = Array.from(
      new Set((values || []).map(value => normalizeText(value)).filter(Boolean)),
    )
  }

  const globalSizes = new Set<string>()
  for (const attr of preview.featureAttributes || []) {
    if (!isSizeDimensionName(attr.key)) continue
    for (const value of splitRecoverableSizeValues(attr.value)) globalSizes.add(value)
  }
  for (const group of specSummary || []) {
    if (!isSizeDimensionName(group.name)) continue
    for (const value of group.values || []) {
      const normalized = normalizeText(value)
      if (normalized && !/^(默认|默认规格|default|standard)$/i.test(normalized)) {
        globalSizes.add(normalized)
      }
    }
  }

  if (globalSizes.size > 0) {
    for (const color of preview.colors || []) {
      const label = normalizeText(color.label)
      if (!label || (resolved[label] || []).length > 0) continue
      resolved[label] = Array.from(globalSizes)
    }
  }
  return resolved
}

/** 解析/发布共用：有色则展开；否则才允许默认规格占位 */
const resolveSkuTableOrExpandFromColors = (params: {
  skuTable?: PreviewSkuTableRow[] | null
  colors?: Array<{ label: string; imageUrl?: string | null }> | null
  sizesByColor?: Record<string, string[]> | null
  costPrice: number
  price: number
  stock: number
  weightGrams?: number | null
}): PreviewSkuTableRow[] => {
  const table = Array.isArray(params.skuTable) ? params.skuTable : []
  const hasRecoverableSizes = Object.values(params.sizesByColor || {}).some(
    values => Array.isArray(values) && values.some(value => normalizeText(value)),
  )
  const tableHasSize = table.some(row =>
    (row.attributes || []).some(
      attr =>
        isSizeDimensionName(attr.name) &&
        Boolean(normalizeText(attr.value)) &&
        !/^(默认|默认规格|default|standard)$/i.test(normalizeText(attr.value)),
    ),
  )
  const shouldExpandColorOnlyTable =
    (params.colors || []).length > 0 && hasRecoverableSizes && !tableHasSize
  if (!isDefaultOnlySkuTable(table) && !shouldExpandColorOnlyTable) return table
  const expanded = expandSkuTableFromColors({
    colors: params.colors || [],
    sizesByColor: params.sizesByColor,
    costPrice: params.costPrice,
    price: params.price,
    stock: params.stock,
    weightGrams: params.weightGrams,
  })
  if (expanded.length > 0) return expanded
  return table.length > 0
    ? table
    : [
        buildNeutralFallbackSkuRow({
          costPrice: params.costPrice,
          price: params.price,
          stock: params.stock,
        }),
      ]
}

/** 从 HTML 尽量提取商品标题（多字段 + meta + title） */
const extract1688OfferTitleFromHtml = (html: string): string | null => {
  const titleTag = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '')
    .replace(/\s*[-_|].*$/, '')
    .trim()
  const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1]
    || '')
    .replace(/\s*[-_|].*$/, '')
    .trim()
  const metaTitle = (html.match(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']title["']/i)?.[1]
    || '')
    .replace(/\s*[-_|].*$/, '')
    .trim()

  const candidates = [
    pickJsonStringField(html, 'subject'),
    pickJsonStringField(html, 'offerTitle'),
    pickJsonStringField(html, 'offerSubject'),
    pickJsonStringField(html, 'title'),
    pickJsonStringField(html, 'productTitle'),
    pickJsonStringField(html, 'offerName'),
    ogTitle || null,
    metaTitle || null,
    titleTag || null,
  ]

  for (const candidate of candidates) {
    const name = normalizeText(candidate)
    if (!name || name.length < 2) continue
    if (/1688|阿里巴巴|验证|punish|登录|login|access denied/i.test(name)) continue
    return name.slice(0, 180)
  }
  return null
}

export interface Fetched1688OfferPreview {
  name: string | null
  mainImageUrl: string | null
  detailImages: string[]
  supplierName: string | null
  productDetail: string | null
  sourceCategoryName: string | null
  priceMin: number | null
  priceMax: number | null
  /** 1688 起订量（beginAmount 等）；缺省由调用方回落 DEFAULT_MIN_ORDER_QTY */
  minOrderQty: number | null
  featureAttributes: Array<{ key: string; value: string }>
  /** 解析出的 SKU 行；无可靠规格时为空，由调用方回退默认 SKU */
  skuTable: PreviewSkuTableRow[]
  colors: Array<{ label: string; imageUrl?: string | null }>
  sizesByColor: Record<string, string[]>
  specSummary: SpecSummaryJson[]
}

/** 抓取结果分类：风控 ≠ 链接失效 */
export type Fetch1688Outcome = 'ok' | 'risk_control' | 'expired' | 'failed'

export interface Fetch1688OfferPreviewResult {
  preview: Fetched1688OfferPreview
  outcome: Fetch1688Outcome
  failureReason: string | null
}

const empty1688OfferPreview = (): Fetched1688OfferPreview => ({
  name: null,
  mainImageUrl: null,
  detailImages: [],
  supplierName: null,
  productDetail: null,
  sourceCategoryName: null,
  priceMin: null,
  priceMax: null,
  minOrderQty: null,
  featureAttributes: [],
  skuTable: [],
  colors: [],
  sizesByColor: {},
  specSummary: [],
})

/** 风控/验证码页（禁止当成「链接已失效」） */
const is1688RiskControlHtml = (html: string): boolean => {
  const head = html.slice(0, 8000)
  return /_____tmd_____\/punish|x5secdata|滑块验证|验证码|__nc_captcha|nc_captcha|punish\?|security\.alibaba|被挤爆了|访问受限|人机验证|rgv587_flag|"action"\s*:\s*"captcha"|window\._config_\s*=\s*\{[^}]*captcha/i.test(
    head,
  )
}

/**
 * 强证据才判定链接失效：下架/不存在等文案。
 * 若同时命中风控页，优先按风控处理，绝不标失效。
 */
const is1688ExpiredOfferHtml = (html: string): boolean => {
  if (is1688RiskControlHtml(html)) return false
  return /商品不存在|该商品已失效|已下架|找不到该商品|页面不存在|offer.*(removed|not\s*found)|商品已删除|下架处理|该商品已经失效|商品已下架/i.test(
    html,
  )
}

const FAILURE_REASON_RISK_CONTROL =
  '风控拦截或 Cookie 已失效：请更新 secrets/1688-cookie.txt（从已登录 1688 的浏览器复制完整 Cookie，需含 _m_h5_tk），然后执行 pm2 restart rpc --update-env 后重试'
const FAILURE_REASON_EXPIRED = '链接已失效'
const FAILURE_REASON_NETWORK = '请求 1688 页面失败或超时，请稍后重试'
const FAILURE_REASON_EMPTY = '未能解析到商品数据，请检查链接或稍后重试'
const FAILURE_REASON_NO_COOKIE =
  '风控拦截：请配置 COOKIE_1688（环境变量）或写入 secrets/1688-cookie.txt 后执行 pm2 restart rpc --update-env 再重试'

const read1688CookieFromDisk = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const candidates: string[] = []
    if (process.env.COOKIE_1688_FILE) candidates.push(process.env.COOKIE_1688_FILE)

    // Explicit production path (PM2 cwd sometimes diverges after restarts)
    candidates.push('/home/admin/my-website/blingora-jewelry/secrets/1688-cookie.txt')

    // Walk up from cwd so standalone / nested cwd still finds repo secrets/
    let dir = process.cwd()
    for (let i = 0; i < 6; i += 1) {
      candidates.push(path.join(dir, 'secrets', '1688-cookie.txt'))
      candidates.push(path.join(dir, '.1688-cookie'))
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }

    const seen = new Set<string>()
    for (const file of candidates) {
      if (!file || seen.has(file)) continue
      seen.add(file)
      if (fs.existsSync(file)) {
        const text = normalize1688Cookie(fs.readFileSync(file, 'utf8'))
        if (text) {
          console.warn(`[1688-cookie] loaded from ${file} (len=${text.length}, has_m_h5_tk=${/\_m_h5_tk=/.test(text)})`)
          return text
        }
      }
    }
  } catch (error) {
    console.warn('[1688-cookie] disk read failed', error)
  }
  return ''
}

const resolve1688Cookie = (): string =>
  normalize1688Cookie(
    (typeof process !== 'undefined' &&
      (process.env.COOKIE_1688 || process.env.ALIBABA_COOKIE || process.env.COOKIE1688 || '').trim()) ||
      read1688CookieFromDisk() ||
      '',
  )

const has1688CookieConfigured = (): boolean => Boolean(resolve1688Cookie())

/** Wrap mtop JSON so existing HTML extractors (skuProps / subject / images) can dig it. */
const buildFakeHtmlFromMtopPayload = (payload: unknown): string => {
  try {
    const json = JSON.stringify(payload)
    return `<!doctype html><html><head><meta charset="utf-8"/><title>1688</title></head><body><script>window.__INIT_DATA__=${json};window.context=${json};</script></body></html>`
  } catch {
    return ''
  }
}

const buildPreviewFromParsedHtml = async (html: string): Promise<Fetched1688OfferPreview | null> => {
  if (!html || html.length < 40) return null
  const name = extract1688OfferTitleFromHtml(html)
  const multiSpec = parse1688MultiSpecFromHtml(html)
  const { hdCandidates, watermarkedFallback } = extract1688ImageCandidates(html)
  const resolvedImages = await resolve1688ImageUrls({
    hdCandidates,
    watermarkedFallback,
  })
  const mainImageUrl =
    resolvedImages.mainImageUrl || watermarkedFallback[0] || hdCandidates[0] || null
  // Color / SKU swatches already live on sku rows — dumping them into the gallery
  // duplicates every color shot (often once per size) and floods the pending UI.
  const detailImages = dedupeImageUrls([
    ...(mainImageUrl ? [mainImageUrl] : []),
    ...(resolvedImages.detailImages.length > 0 ? resolvedImages.detailImages : []),
  ]).slice(0, 12)

  const supplierName =
    pickJsonStringField(html, 'companyName') || pickJsonStringField(html, 'loginId') || null
  const productDetail =
    pickJsonStringField(html, 'description') || pickJsonStringField(html, 'offerDescription') || null
  const sourceCategoryName =
    pickJsonStringField(html, 'leafCategoryName') || pickJsonStringField(html, 'categoryName') || null
  const priceText =
    pickJsonStringField(html, 'price') ||
    pickJsonStringField(html, 'priceDisplay') ||
    pickJsonStringField(html, 'offerPrice')
  const { min: priceMinFromText, max: priceMaxFromText } = parsePriceRangeText(priceText)
  const featureAttributes = parse1688FeatureAttributes(html)
  const priceMin = multiSpec.priceMin ?? priceMinFromText
  const priceMax = multiSpec.priceMax ?? priceMaxFromText ?? priceMin

  if (!(name || mainImageUrl || multiSpec.skuTable.length > 0)) return null

  return {
    name: name ? name.slice(0, 180) : null,
    mainImageUrl,
    detailImages: detailImages.length > 0 ? detailImages : dedupeImageUrls([mainImageUrl]),
    supplierName: supplierName ? supplierName.slice(0, 120) : null,
    productDetail: productDetail ? productDetail.slice(0, 2000) : null,
    sourceCategoryName: sourceCategoryName ? sourceCategoryName.slice(0, 120) : null,
    priceMin,
    priceMax,
    minOrderQty: extract1688MinOrderQtyFromHtml(html),
    featureAttributes,
    skuTable: multiSpec.skuTable,
    colors: multiSpec.colors,
    sizesByColor: multiSpec.sizesByColor,
    specSummary: multiSpec.specSummary,
  }
}

/** Prefer signed mtop JSON when Cookie is available (HTML detail pages are often punished). */
const fetch1688OfferPreviewViaMtop = async (
  sourceUrl: string,
): Promise<Fetch1688AttemptResult | null> => {
  const cookie = resolve1688Cookie()
  const offerId = extract1688OfferId(sourceUrl)
  if (!cookie || !offerId) return null

  try {
    const mtop = await fetch1688OfferViaMtop(offerId, cookie)
    if (!mtop.ok) {
      console.warn(`[fetch1688OfferPreview] mtop fallback skipped: ${mtop.reason}`, mtop.detail || '')
      return null
    }
    const html = buildFakeHtmlFromMtopPayload(mtop.data)
    const preview = await buildPreviewFromParsedHtml(html)
    if (!preview) {
      console.warn(`[fetch1688OfferPreview] mtop ${mtop.api} returned JSON but no parseable fields`)
      return null
    }
    console.warn(`[fetch1688OfferPreview] mtop ${mtop.api} parsed offer ${offerId}`)
    return { kind: 'parsed', preview, detail: `mtop:${mtop.api}` }
  } catch (error) {
    console.warn('[fetch1688OfferPreview] mtop fallback error', error)
    return null
  }
}

const UA_MOBILE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const UA_ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
const UA_DESKTOP_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
/** 第 3 次风控重试使用的备用 UA */
const UA_BACKUP_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0'

/**
 * 1688 抓取请求头：贴近真实 Chrome 导航。
 * Cookie 来自 COOKIE_1688 / ALIBABA_COOKIE / secrets/1688-cookie.txt。
 * 无 Cookie 时直连极易命中 _____tmd_____/punish 人机验证页。
 */
const build1688RequestHeaders = (ua: string): Record<string, string> => {
  const isMobile = /Mobile|Android|iPhone/i.test(ua)
  const headers: Record<string, string> = {
    'User-Agent': ua,
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'max-age=0',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    Referer: 'https://www.1688.com/',
  }
  if (!isMobile) {
    headers['Sec-Ch-Ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"'
    headers['Sec-Ch-Ua-Mobile'] = '?0'
    headers['Sec-Ch-Ua-Platform'] = '"Windows"'
  } else if (/Android/i.test(ua)) {
    headers['Sec-Ch-Ua'] = '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"'
    headers['Sec-Ch-Ua-Mobile'] = '?1'
    headers['Sec-Ch-Ua-Platform'] = '"Android"'
  }
  const cookie = resolve1688Cookie()
  if (cookie) {
    headers.Cookie = cookie
  }
  return headers
}

const build1688FetchCandidates = (
  sourceUrl: string,
  offerId: string,
  useBackupUa = false,
): Array<{ url: string; ua: string }> => {
  const mobileUa = useBackupUa ? UA_BACKUP_DESKTOP : UA_MOBILE_SAFARI
  const androidUa = useBackupUa ? UA_BACKUP_DESKTOP : UA_ANDROID_CHROME
  const desktopUa = useBackupUa ? UA_BACKUP_DESKTOP : UA_DESKTOP_CHROME
  return [
    { url: `https://m.1688.com/offer/${offerId}.html`, ua: mobileUa },
    { url: `https://detail.m.1688.com/page/index.html?offerId=${offerId}`, ua: androidUa },
    {
      url: sourceUrl.startsWith('http') ? sourceUrl : `https://detail.1688.com/offer/${offerId}.html`,
      ua: desktopUa,
    },
  ]
}

/** 风控后自动重试：5s → 30s → 60s+备用 UA（共 3 次，最坏约 95s） */
const RISK_CONTROL_RETRY_SCHEDULE: Array<{ waitMs: number; useBackupUa: boolean; label: string }> = [
  { waitMs: 5_000, useBackupUa: false, label: 'retry-1/3 after 5s' },
  { waitMs: 30_000, useBackupUa: false, label: 'retry-2/3 after 30s' },
  { waitMs: 60_000, useBackupUa: true, label: 'retry-3/3 after 60s + backup UA' },
]

type Fetch1688AttemptKind = 'parsed' | 'risk_control' | 'expired' | 'empty' | 'http_error' | 'network_error'

interface Fetch1688AttemptResult {
  kind: Fetch1688AttemptKind
  preview: Fetched1688OfferPreview
  httpStatus?: number
  detail?: string
}

type Parsed1688PropValue = {
  name: string
  imageUrl: string | null
  /** 1688 value id / vid; used to map pid:vid skuMap keys back to labels. */
  valueId?: string | null
}

type Parsed1688Prop = {
  name: string
  kind: 'color' | 'size' | 'other'
  values: Parsed1688PropValue[]
  /** 1688 prop id / pid; used to map pid:vid skuMap keys back to labels. */
  propId?: string | null
}

const is1688ColorPropName = (name?: string | null) => {
  const normalized = String(name || '').trim().toLowerCase()
  if (!normalized) return false
  // 明确尺码维不算颜色（避免「颜色尺码」等复合名误伤时仍优先下方 includes）
  if (
    normalized === '尺码' ||
    normalized === '尺寸' ||
    normalized === '鞋码' ||
    normalized === '码数' ||
    normalized === 'size'
  ) {
    return false
  }
  return (
    normalized === '颜色' ||
    normalized === '颜色分类' ||
    normalized === '色彩' ||
    normalized === '花色' ||
    normalized === '花色分类' ||
    normalized === '色号' ||
    normalized === '色系' ||
    normalized === '款式颜色' ||
    normalized === 'color' ||
    normalized === 'colour' ||
    normalized === 'pattern' ||
    normalized.includes('颜色') ||
    normalized.includes('花色') ||
    normalized.includes('色号') ||
    normalized.includes('color') ||
    normalized.includes('colour')
  )
}

const is1688SizePropName = (name?: string | null) => {
  const normalized = String(name || '').trim().toLowerCase()
  return (
    normalized === '尺码' ||
    normalized === '尺寸' ||
    normalized === '规格' ||
    normalized === '鞋码' ||
    normalized === '码数' ||
    normalized === '号码' ||
    normalized === 'size' ||
    normalized === 'spec' ||
    normalized.includes('尺码') ||
    normalized.includes('尺寸') ||
    normalized.includes('鞋码') ||
    normalized.includes('码数') ||
    normalized.includes('size')
  )
}

const tryParseJsonSlice = (slice: string): unknown | null => {
  try {
    return JSON.parse(slice)
  } catch {
    try {
      return JSON.parse(
        slice
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .replace(/&amp;/g, '&'),
      )
    } catch {
      return null
    }
  }
}

/** 从 HTML 中按括号匹配提取 JSON 值（对象或数组）；默认取首次命中 */
const extractBalancedJsonValue = (html: string, key: string): unknown | null => {
  const all = extractAllBalancedJsonValues(html, key)
  return all.length > 0 ? all[0] : null
}

/**
 * 提取 HTML 中某 key 的全部平衡 JSON 值。
 * 1688 页常出现多次 skuProps/skuMap（片段/埋点/完整 data），只取首次会丢规格。
 */
const extractAllBalancedJsonValues = (html: string, key: string): unknown[] => {
  const results: unknown[] = []
  const keyRe = new RegExp(`"${key}"\\s*:\\s*([\\[\\{])`, 'gi')
  let matched: RegExpExecArray | null
  while ((matched = keyRe.exec(html))) {
    const startIdx = matched.index + matched[0].length - 1
    let depth = 0
    let inString = false
    let escaped = false
    for (let i = startIdx; i < html.length; i += 1) {
      const ch = html[i]
      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{' || ch === '[') depth += 1
      else if (ch === '}' || ch === ']') {
        depth -= 1
        if (depth === 0) {
          const parsed = tryParseJsonSlice(html.slice(startIdx, i + 1))
          if (parsed != null) results.push(parsed)
          keyRe.lastIndex = i + 1
          break
        }
      }
      if (i - startIdx > 2_000_000) break
    }
  }
  return results
}

/** 统计 skuProps 候选完整度：优先颜色维 values 数量，避免「3 色 + 海量残缺尺码」压过「完整色表」 */
const scoreSkuPropsRaw = (raw: unknown): number => {
  if (!Array.isArray(raw)) return 0
  let colorValues = 0
  let imagedValues = 0
  let totalValues = 0
  for (const item of raw) {
    const record = asRecord(item)
    if (!record) continue
    const propName = normalizeText(
      record.prop ?? record.name ?? record.attributeName ?? record.fname ?? record.label ?? record.title,
    )
    const valueList = Array.isArray(record.value)
      ? record.value
      : Array.isArray(record.values)
        ? record.values
        : Array.isArray(record.items)
          ? record.items
          : Array.isArray(record.valueList)
            ? record.valueList
            : []
    const count = Math.max(valueList.length, 1)
    totalValues += count
    const imageHits = valueList.reduce((sum, entry) => {
      const row = asRecord(entry)
      if (!row) return sum
      const hasImage = Boolean(
        row.imageUrl ||
          row.imgUrl ||
          (typeof row.image === 'string' && row.image) ||
          row.skuImage ||
          row.pictureUrl ||
          row.picUrl,
      )
      return hasImage ? sum + 1 : sum
    }, 0)
    imagedValues += imageHits
    if (is1688ColorPropName(propName) || (imageHits >= 2 && imageHits >= Math.ceil(valueList.length * 0.4))) {
      colorValues += valueList.length
    }
  }
  // 颜色维权重最高，其次带图选项数，再次总 values（尺码完整度）
  return colorValues * 10_000 + imagedValues * 100 + totalValues
}

const scoreSkuMapRaw = (raw: unknown): number => {
  const record = asRecord(raw)
  return record ? Object.keys(record).length : 0
}

/** 将 skuList 行拼成与 skuMap 一致的「色>码」键 */
const build1688SkuListMapKey = (row: Record<string, unknown>): string | null => {
  const specAttrsRaw =
    (typeof row.specAttrs === 'string' && row.specAttrs) ||
    (typeof row.skuAttrs === 'string' && row.skuAttrs) ||
    (typeof row.props === 'string' && row.props) ||
    (typeof row.saleProps === 'string' && row.saleProps) ||
    ''
  if (specAttrsRaw) {
    const parts = decodeJsonLikeString(specAttrsRaw)
      .replace(/&gt;/gi, '>')
      .split(/[;｜|]+/)
      .map(part => {
        const trimmed = part.trim()
        if (!trimmed) return ''
        // pid:vid 形式（如 1627207:28320）需保留 pid，供后续映射回 label
        if (/^\d+:\d+$/.test(trimmed)) return trimmed
        // 「颜色>米白」或「颜色:米白」→ 取属性值
        const segs = trimmed.split(/[:>]/)
        if (segs.length >= 2) return segs.slice(1).join(':').trim()
        return trimmed
      })
      .filter(Boolean)
    if (parts.length) return parts.join('>')
  }

  const attrList = Array.isArray(row.attributes)
    ? row.attributes
    : Array.isArray(row.saleProp)
      ? row.saleProp
      : Array.isArray(row.propsList)
        ? row.propsList
        : null
  if (attrList) {
    const values: string[] = []
    for (const entry of attrList) {
      const rec = asRecord(entry)
      if (!rec) continue
      const value = normalizeText(
        rec.attributeValue ?? rec.value ?? rec.valueName ?? rec.name ?? rec.text,
      )
      if (value) values.push(value)
    }
    if (values.length) return values.join('>')
  }

  const color = normalizeText(row.color ?? row.colour ?? row.colorName)
  const size = normalizeText(row.size ?? row.sizeName ?? row.skuSize)
  if (color && size) return `${color}>${size}`
  if (color) return color
  if (size) return size
  return null
}

/** skuList / skuPriceMap 等数组或对象 → skuMap 形态，便于走统一规格组装 */
const convert1688SkuListToMap = (raw: unknown): Record<string, Record<string, unknown>> | null => {
  if (Array.isArray(raw)) {
    const result: Record<string, Record<string, unknown>> = {}
    for (const item of raw) {
      const row = asRecord(item)
      if (!row) continue
      const key = build1688SkuListMapKey(row)
      if (!key) continue
      result[key] = row
    }
    return Object.keys(result).length ? result : null
  }
  const asMap = asRecord(raw)
  if (!asMap) return null
  // 已是 map：校验至少一条可识别
  const keys = Object.keys(asMap)
  if (!keys.length) return null
  const first = asRecord(asMap[keys[0]])
  if (first && (first.price != null || first.canBookCount != null || first.skuId != null || first.specId != null)) {
    return asMap as Record<string, Record<string, unknown>>
  }
  return null
}

/** 从嵌套对象中挖出 skuProps / skuMap / skuList（含 skuModel、offerDetail 等） */
const digSkuBlobsFromUnknown = (
  value: unknown,
  depth = 0,
  acc: { props: unknown[]; maps: unknown[] } = { props: [], maps: [] },
): { props: unknown[]; maps: unknown[] } => {
  if (value == null || depth > 8) return acc
  if (Array.isArray(value)) {
    for (const item of value) digSkuBlobsFromUnknown(item, depth + 1, acc)
    return acc
  }
  const record = asRecord(value)
  if (!record) return acc

  if (record.skuProps != null) acc.props.push(record.skuProps)
  if (record.sku_props != null) acc.props.push(record.sku_props)
  if (record.skuMap != null) acc.maps.push(record.skuMap)
  if (record.skuInfoMap != null) acc.maps.push(record.skuInfoMap)
  if (record.sku_map != null) acc.maps.push(record.sku_map)
  if (record.skuPriceMap != null) acc.maps.push(record.skuPriceMap)

  for (const listKey of ['skuList', 'sku_list', 'skuInfoList']) {
    if (record[listKey] != null) {
      const converted = convert1688SkuListToMap(record[listKey])
      if (converted) acc.maps.push(converted)
    }
  }

  const nestedSkuInfo = asRecord(record.skuInfo) || asRecord(record.skuModel) || asRecord(record.sku)
  if (nestedSkuInfo) digSkuBlobsFromUnknown(nestedSkuInfo, depth + 1, acc)

  for (const key of [
    'offerDetail',
    'globalData',
    'data',
    'result',
    'dataJson',
    'iDetailData',
    'root',
    'fields',
    'model',
    'product',
  ]) {
    const nested = record[key]
    if (typeof nested === 'string' && nested.length > 20 && (nested.trim().startsWith('{') || nested.trim().startsWith('['))) {
      const parsed = tryParseJsonSlice(nested)
      if (parsed != null) digSkuBlobsFromUnknown(parsed, depth + 1, acc)
    } else if (nested && typeof nested === 'object') {
      digSkuBlobsFromUnknown(nested, depth + 1, acc)
    }
  }
  return acc
}

/** 汇总页面内全部候选，选值最多的 skuProps / skuMap，避免只命中残缺片段 */
const collectRichest1688SkuBlobs = (html: string): { propsRaw: unknown | null; mapRaw: unknown | null } => {
  const propsCandidates: unknown[] = [
    ...extractAllBalancedJsonValues(html, 'skuProps'),
    ...extractAllBalancedJsonValues(html, 'sku_props'),
  ]
  const mapCandidates: unknown[] = [
    ...extractAllBalancedJsonValues(html, 'skuMap'),
    ...extractAllBalancedJsonValues(html, 'skuInfoMap'),
    ...extractAllBalancedJsonValues(html, 'sku_map'),
    ...extractAllBalancedJsonValues(html, 'skuPriceMap'),
  ]

  // 隐藏 JSON 里的 skuList：转成 map 参与「最丰富」竞选
  for (const listRaw of [
    ...extractAllBalancedJsonValues(html, 'skuList'),
    ...extractAllBalancedJsonValues(html, 'sku_list'),
    ...extractAllBalancedJsonValues(html, 'skuInfoList'),
  ]) {
    const converted = convert1688SkuListToMap(listRaw)
    if (converted) mapCandidates.push(converted)
  }

  for (const parentKey of [
    'skuModel',
    'skuInfo',
    'offerDetail',
    'iDetailData',
    'globalData',
    '__INIT_DATA__',
    'context',
  ]) {
    for (const parent of extractAllBalancedJsonValues(html, parentKey)) {
      const dug = digSkuBlobsFromUnknown(parent)
      propsCandidates.push(...dug.props)
      mapCandidates.push(...dug.maps)
    }
  }

  // window.__INIT_DATA__ = {...} 无引号 key 的变体
  const initAssign = html.match(/__INIT_DATA__\s*=\s*(\{)/)
  if (initAssign && initAssign.index != null) {
    const startIdx = initAssign.index + initAssign[0].length - 1
    let depth = 0
    let inString = false
    let escaped = false
    for (let i = startIdx; i < html.length; i += 1) {
      const ch = html[i]
      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{') depth += 1
      else if (ch === '}') {
        depth -= 1
        if (depth === 0) {
          const parsed = tryParseJsonSlice(html.slice(startIdx, i + 1))
          if (parsed != null) {
            const dug = digSkuBlobsFromUnknown(parsed)
            propsCandidates.push(...dug.props)
            mapCandidates.push(...dug.maps)
          }
          break
        }
      }
      if (i - startIdx > 2_000_000) break
    }
  }

  let bestProps: unknown | null = null
  let bestPropsScore = 0
  for (const candidate of propsCandidates) {
    const score = scoreSkuPropsRaw(candidate)
    if (score > bestPropsScore) {
      bestPropsScore = score
      bestProps = candidate
    }
  }

  let bestMap: unknown | null = null
  let bestMapScore = 0
  for (const candidate of mapCandidates) {
    const score = scoreSkuMapRaw(candidate)
    if (score > bestMapScore) {
      bestMapScore = score
      bestMap = candidate
    }
  }

  return { propsRaw: bestProps, mapRaw: bestMap }
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const pickPropLabel = (raw: unknown) => {
  const record = asRecord(raw)
  if (!record) return ''
  return normalizeText(
    record.prop ??
      record.name ??
      record.attributeName ??
      record.fname ??
      record.label ??
      record.title,
  )
}

const pickValueLabel = (raw: unknown) => {
  const record = asRecord(raw)
  if (!record) return normalizeText(raw)
  return normalizeText(
    record.name ??
      record.value ??
      record.text ??
      record.label ??
      record.attributeValue ??
      record.originalValueName,
  )
}

const pickValueImage = (raw: unknown): string | null => {
  const record = asRecord(raw)
  if (!record) return null
  const candidates = [
    record.imageUrl,
    record.imgUrl,
    record.image,
    record.img,
    record.skuImage,
    record.pictureUrl,
    record.picUrl,
    record.imageUrl_180,
    record.imageUrl_220,
  ]
  // 偶发嵌套 { image: { url / imageUrl } }
  const nestedImage = asRecord(record.image) || asRecord(record.img) || asRecord(record.picture)
  if (nestedImage) {
    candidates.push(nestedImage.url, nestedImage.imageUrl, nestedImage.imgUrl, nestedImage.src)
  }
  for (const candidate of candidates) {
    const url = normalizeRemoteImageUrl(typeof candidate === 'string' ? candidate : null)
    if (!url || isLikely1688VideoAsset(url)) continue
    // 色图缩略图优先升 HD；升失败仍保留原 URL，避免色图被滤丢
    return to1688HdImageUrl(url) || url
  }
  return null
}

const normalizeSkuMapKeyParts = (rawKey: string) =>
  decodeJsonLikeString(String(rawKey || ''))
    .replace(/&gt;/gi, '>')
    .split(/[>;|&;]+/)
    .map(part => part.trim())
    .filter(Boolean)

const normalizeSkuPropsArray = (raw: unknown): Parsed1688Prop[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): Parsed1688Prop | null => {
      const name = pickPropLabel(item)
      if (!name) return null
      const record = asRecord(item)
      const propIdRaw =
        record?.propId ??
        record?.pid ??
        record?.propID ??
        record?.prop_id ??
        record?.fid ??
        record?.id ??
        null
      const propId = propIdRaw == null ? null : String(propIdRaw).trim() || null
      const valueList = Array.isArray(record?.value)
        ? record!.value
        : Array.isArray(record?.values)
          ? record!.values
          : Array.isArray(record?.items)
            ? record!.items
            : Array.isArray(record?.valueList)
              ? record!.valueList
              : []
      const values = valueList
        .map((entry): Parsed1688PropValue | null => {
          const label = pickValueLabel(entry)
          if (!label) return null
          const valueRec = asRecord(entry)
          const valueIdRaw =
            valueRec?.valueId ??
            valueRec?.valueID ??
            valueRec?.vid ??
            valueRec?.value_id ??
            valueRec?.id ??
            null
          const valueId = valueIdRaw == null ? null : String(valueIdRaw).trim() || null
          return { name: label, imageUrl: pickValueImage(entry), valueId }
        })
        .filter((entry): entry is Parsed1688PropValue => Boolean(entry))
      if (!values.length) return null
      const imageHits = values.filter(value => Boolean(value.imageUrl)).length
      const nameKey = name.trim()
      // 「规格/款式」在 1688 上常充当色维（带独立缩略图）；纯尺码文案且无图仍走 size
      const specActsAsColor =
        /^(规格|款式|款型|花样|图案)$/i.test(nameKey) &&
        imageHits >= 2 &&
        imageHits >= Math.ceil(values.length * 0.4)
      // 其它非尺码维：多数 value 带独立缩略图时视为颜色维
      const looksLikeColorSwatchProp =
        !is1688SizePropName(name) &&
        imageHits >= 2 &&
        imageHits >= Math.ceil(values.length * 0.4)
      const kind: Parsed1688Prop['kind'] = is1688ColorPropName(name) || specActsAsColor || looksLikeColorSwatchProp
        ? 'color'
        : is1688SizePropName(name)
          ? 'size'
          : 'other'
      return {
        name: kind === 'color' ? '颜色' : kind === 'size' ? '尺码' : name,
        kind,
        values,
        propId,
      }
    })
    .filter((item): item is Parsed1688Prop => Boolean(item))
}

/** 在全部 skuProps 候选中选出 values 最多的颜色维；其它候选仅补同名缩略图，不并入残缺色名 */
const collectRichest1688ColorPropValues = (html: string): Parsed1688PropValue[] => {
  const propsCandidates: unknown[] = [
    ...extractAllBalancedJsonValues(html, 'skuProps'),
    ...extractAllBalancedJsonValues(html, 'sku_props'),
  ]
  for (const parentKey of [
    'skuModel',
    'skuInfo',
    'offerDetail',
    'iDetailData',
    'globalData',
    '__INIT_DATA__',
    'context',
  ]) {
    for (const parent of extractAllBalancedJsonValues(html, parentKey)) {
      const dug = digSkuBlobsFromUnknown(parent)
      propsCandidates.push(...dug.props)
    }
  }

  const imageByName = new Map<string, string | null>()
  let bestColorValues: Parsed1688PropValue[] = []

  for (const candidate of propsCandidates) {
    const props = normalizeSkuPropsArray(candidate)
    const colorProps = props.filter(prop => prop.kind === 'color')
    for (const colorProp of colorProps) {
      for (const value of colorProp.values) {
        if (!value.name) continue
        if (!imageByName.has(value.name)) {
          imageByName.set(value.name, value.imageUrl || null)
        } else if (!imageByName.get(value.name) && value.imageUrl) {
          imageByName.set(value.name, value.imageUrl)
        }
      }
      if (colorProp.values.length > bestColorValues.length) {
        bestColorValues = colorProp.values
      }
    }
  }

  // 只保留最完整色表中的色名（禁止把残缺 decoy 的「红/蓝/黑」并进来）
  const seen = new Set<string>()
  const ordered: Parsed1688PropValue[] = []
  for (const value of bestColorValues) {
    if (!value.name || seen.has(value.name)) continue
    seen.add(value.name)
    ordered.push({
      name: value.name,
      imageUrl: imageByName.get(value.name) || value.imageUrl || null,
    })
  }
  return ordered
}

/** 选取颜色维：显式颜色名 > 带图 swatch prop > values 最多者 */
const pick1688ColorProp = (props: Parsed1688Prop[]): Parsed1688Prop | null => {
  const colorProps = props.filter(prop => prop.kind === 'color')
  if (colorProps.length) {
    return [...colorProps].sort((a, b) => b.values.length - a.values.length)[0]
  }
  // 无显式颜色维时：取带图最多的 non-size prop（常见「规格/款式」当色）
  const swatchLike = props
    .filter(prop => prop.kind !== 'size')
    .map(prop => ({
      prop,
      imageHits: prop.values.filter(value => Boolean(value.imageUrl)).length,
    }))
    .filter(item => item.imageHits >= 2)
    .sort((a, b) => b.imageHits - a.imageHits || b.prop.values.length - a.prop.values.length)
  if (swatchLike.length) {
    const chosen = swatchLike[0].prop
    return {
      ...chosen,
      name: '颜色',
      kind: 'color',
    }
  }
  return null
}

const parse1688SkuProps = (html: string): Parsed1688Prop[] => {
  const { propsRaw } = collectRichest1688SkuBlobs(html)
  return normalizeSkuPropsArray(propsRaw)
}

const normalizeSkuMapRecord = (raw: unknown): Record<string, Record<string, unknown>> => {
  const record = asRecord(raw)
  if (!record) return {}
  const result: Record<string, Record<string, unknown>> = {}
  for (const [key, value] of Object.entries(record)) {
    const row = asRecord(value)
    if (!row) continue
    result[key] = row
  }
  return result
}

const parse1688SkuMap = (html: string): Record<string, Record<string, unknown>> => {
  const { mapRaw } = collectRichest1688SkuBlobs(html)
  return normalizeSkuMapRecord(mapRaw)
}

const readSkuMapPrice = (row: Record<string, unknown>): number | null => {
  const candidates = [
    row.discountPrice,
    row.price,
    row.salePrice,
    row.retailPrice,
    row.consignPrice,
    row.finalPrice,
  ]
  for (const candidate of candidates) {
    const num = parseDecimal(candidate)
    if (num !== null && num > 0) return num
  }
  // nested {price:"12.3"}
  for (const key of ['priceInfo', 'priceModel', 'tradePrice']) {
    const nested = asRecord(row[key])
    if (!nested) continue
    const num = readSkuMapPrice(nested)
    if (num !== null) return num
  }
  return null
}

const readSkuMapStock = (row: Record<string, unknown>): number | null => {
  const candidates = [
    row.canBookCount,
    row.amountOnSale,
    row.stock,
    row.skuStock,
    row.quantity,
    row.sellableQuantity,
  ]
  for (const candidate of candidates) {
    const num = toNumberOrNull(candidate)
    if (num !== null && num >= 0) return Math.round(num)
  }
  return null
}

/**
 * 从 1688 HTML 解析多规格：
 * - 颜色独立缩略图（优先 skuProps.value.imageUrl，右侧色块 DOM 补全）
 * - 颜色 → 可用尺码（优先 skuMap/skuList 真实组合；无 map 时用 skuProps 全量尺码）
 * - 尺码维取 values 最多的 size-like prop；无尺码维则仅保留颜色
 * - 无可靠数据时返回空，不臆造红/蓝/黑等假规格
 */
const parse1688MultiSpecFromHtml = (html: string): {
  skuTable: PreviewSkuTableRow[]
  colors: Array<{ label: string; imageUrl?: string | null }>
  sizesByColor: Record<string, string[]>
  specSummary: SpecSummaryJson[]
  priceMin: number | null
  priceMax: number | null
} => {
  const empty = {
    skuTable: [] as PreviewSkuTableRow[],
    colors: [] as Array<{ label: string; imageUrl?: string | null }>,
    sizesByColor: {} as Record<string, string[]>,
    specSummary: [] as SpecSummaryJson[],
    priceMin: null as number | null,
    priceMax: null as number | null,
  }

  const { propsRaw, mapRaw } = collectRichest1688SkuBlobs(html)
  const props = normalizeSkuPropsArray(propsRaw)
  const skuMap = normalizeSkuMapRecord(mapRaw)
  const domColorOptions = extract1688ColorOptionsFromHtml(html)
  const mergedColorValues = collectRichest1688ColorPropValues(html)
  if (!props.length && !Object.keys(skuMap).length && !domColorOptions.length && !mergedColorValues.length) {
    return empty
  }

  // 优先真正的颜色维（含花色/带图规格）；多个 size-like 时取 values 最多的（避免「规格=L」残缺片抢先）
  const colorPropFromProps = pick1688ColorProp(props)
  const colorProp: Parsed1688Prop | null = mergedColorValues.length
    ? {
        name: '颜色',
        kind: 'color',
        // 跨候选合并后的完整色表；若当前 richest props 色维更长则仍以 merged 为准
        values:
          colorPropFromProps && colorPropFromProps.values.length > mergedColorValues.length
            ? colorPropFromProps.values
            : mergedColorValues,
      }
    : colorPropFromProps
  const sizeCandidates = props.filter(prop => prop.kind === 'size')
  const sizeProp =
    (sizeCandidates.length
      ? [...sizeCandidates].sort((a, b) => b.values.length - a.values.length)[0]
      : null) ||
    props.find(prop => prop.kind === 'other' && prop !== colorPropFromProps && prop.values.length > 1) ||
    null

  const colorImageByLabel = new Map<string, string | null>()
  // 1) skuProps 色图优先（完整色表，含无图色名）
  for (const value of colorProp?.values || []) {
    if (!colorImageByLabel.has(value.name)) {
      colorImageByLabel.set(value.name, value.imageUrl || null)
    } else if (!colorImageByLabel.get(value.name) && value.imageUrl) {
      colorImageByLabel.set(value.name, value.imageUrl)
    }
  }
  // 2) 右侧颜色选项 DOM / JSON 成对补全（不覆盖已有 skuProps 缩略图；不因无图丢色）
  for (const option of domColorOptions) {
    if (!colorImageByLabel.has(option.label)) {
      colorImageByLabel.set(option.label, option.imageUrl || null)
    } else if (!colorImageByLabel.get(option.label) && option.imageUrl) {
      colorImageByLabel.set(option.label, option.imageUrl)
    }
  }

  // 尺码全集：props 为主；再从 skuMap/skuList 键里并入遗漏尺码
  const sizeLabelSet = new Set<string>((sizeProp?.values || []).map(value => value.name).filter(Boolean))
  const colorNameSet = new Set<string>([
    ...(colorProp?.values || []).map(v => v.name),
    ...colorImageByLabel.keys(),
  ])
  for (const rawKey of Object.keys(skuMap)) {
    const parts = normalizeSkuMapKeyParts(rawKey)
    if (parts.length < 2) continue
    for (const part of parts) {
      if (!part || colorNameSet.has(part)) continue
      // 索引型 key（0>1）由下方解析，不把下标当成尺码文案
      if (/^\d+$/.test(part)) continue
      sizeLabelSet.add(part)
    }
  }
  const allSizeLabels = sortSizeLabels(Array.from(sizeLabelSet))
  const sizesByColor: Record<string, string[]> = {}
  const skuTable: PreviewSkuTableRow[] = []
  const prices: number[] = []
  let skuIndex = 0

  // skuMap keys sometimes use pid:vid;pid:vid format instead of human-readable labels.
  // Build a lookup from skuProps so per-size prices can be attributed correctly.
  const idPairToLabel = new Map<string, string>()
  for (const prop of props) {
    const pid = prop.propId ? String(prop.propId).trim() : ''
    if (!pid) continue
    for (const value of prop.values || []) {
      const vid = value.valueId ? String(value.valueId).trim() : ''
      if (!vid) continue
      const key = `${pid}:${vid}`
      if (!idPairToLabel.has(key)) idPairToLabel.set(key, value.name)
    }
  }
  const resolveSkuKeyPartLabel = (part: string) => {
    const matched = String(part || '').match(/^(\d+):(\d+)$/)
    if (!matched) return part
    return idPairToLabel.get(`${matched[1]}:${matched[2]}`) || part
  }

  const pushSku = (params: {
    color?: string | null
    size?: string | null
    price?: number | null
    stock?: number | null
    imageUrl?: string | null
    skuKey?: string | null
  }) => {
    const color = normalizeText(params.color)
    const size = normalizeText(params.size)
    const attributes: Array<{ name: string; value: string }> = []
    if (color) attributes.push({ name: '颜色', value: color })
    if (size) attributes.push({ name: '尺码', value: size })
    if (!attributes.length) return

    const imageUrl = params.imageUrl || (color ? colorImageByLabel.get(color) || null : null) || null
    skuIndex += 1
    skuTable.push({
      skuKey: normalizeText(params.skuKey) || `sku-${skuIndex}`,
      spec: formatSpecText(attributes),
      costPrice: params.price ?? null,
      price: params.price ?? null,
      stock: params.stock ?? null,
      weightGrams: null,
      imageUrl: imageUrl || null,
      attributes,
    })

    if (color && size) {
      const list = sizesByColor[color] || []
      if (!list.includes(size)) list.push(size)
      sizesByColor[color] = list
    } else if (color && !(color in sizesByColor)) {
      sizesByColor[color] = []
    }

    if (params.price != null && params.price > 0) prices.push(params.price)
  }

  const mapEntries = Object.entries(skuMap)
  if (mapEntries.length > 0) {
    for (const [rawKey, row] of mapEntries) {
      const parts = normalizeSkuMapKeyParts(rawKey).map(resolveSkuKeyPartLabel)
      let color: string | null = null
      let size: string | null = null

      if (colorProp && sizeProp && parts.length >= 2) {
        // 常见顺序：颜色在前；若第一部分命中尺码列表则对调
        const [first, second] = parts
        const sizeNames = new Set(allSizeLabels)
        const colorNames = new Set((colorProp.values || []).map(v => v.name))
        if (colorNames.has(first) || (!sizeNames.has(first) && !colorNames.has(second))) {
          color = first
          size = second
        } else {
          size = first
          color = second
        }
      } else if (colorProp && parts.length >= 1) {
        color = parts.find(part => colorImageByLabel.has(part)) || parts[0]
        size = parts.find(part => part !== color) || null
      } else if (sizeProp && parts.length >= 1) {
        size = parts[0]
      } else if (parts.length >= 2) {
        color = parts[0]
        size = parts[1]
      } else if (parts.length === 1) {
        if (is1688ColorPropName(colorProp?.name) || colorProp) color = parts[0]
        else size = parts[0]
      }

      // 索引型 key（0>1）：按 prop.values 下标解析
      if ((!color || !size) && parts.length >= 1 && parts.every(part => /^\d+$/.test(part))) {
        const indexes = parts.map(part => Number(part))
        if (colorProp && indexes[0] != null && colorProp.values[indexes[0]]) {
          color = colorProp.values[indexes[0]].name
        }
        if (sizeProp && indexes[1] != null && sizeProp.values[indexes[1]]) {
          size = sizeProp.values[indexes[1]].name
        } else if (!colorProp && sizeProp && indexes[0] != null && sizeProp.values[indexes[0]]) {
          size = sizeProp.values[indexes[0]].name
        }
      }

      const price = readSkuMapPrice(row)
      const stock = readSkuMapStock(row)
      const rowImage =
        pickValueImage(row) ||
        normalizeRemoteImageUrl(
          typeof row.imageUrl === 'string'
            ? row.imageUrl
            : typeof row.imgUrl === 'string'
              ? row.imgUrl
              : null,
        )

      pushSku({
        color,
        size,
        price,
        stock,
        imageUrl: rowImage,
        skuKey:
          typeof row.skuId === 'string' || typeof row.skuId === 'number'
            ? `sku-${row.skuId}`
            : typeof row.specId === 'string'
              ? `sku-${row.specId}`
              : null,
      })
    }

    // skuMap 未覆盖但 skuProps 有的颜色：补进 colors/SKU，尺码用 props 全表（便于待上传区展示全色）
    if (colorProp && allSizeLabels.length) {
      for (const value of colorProp.values) {
        if (value.name in sizesByColor && sizesByColor[value.name].length > 0) continue
        sizesByColor[value.name] = [...allSizeLabels]
        for (const size of allSizeLabels) {
          pushSku({
            color: value.name,
            size,
            imageUrl: value.imageUrl,
          })
        }
      }
    } else if (colorProp) {
      for (const value of colorProp.values) {
        if (value.name in sizesByColor) continue
        pushSku({
          color: value.name,
          size: null,
          imageUrl: value.imageUrl,
        })
      }
    }
  } else {
    // 仅有 skuProps、无 skuMap：用页面真实颜色×尺码生成组合（非红蓝黑臆造）
    if (colorProp && allSizeLabels.length) {
      for (const colorValue of colorProp.values) {
        for (const size of allSizeLabels) {
          pushSku({
            color: colorValue.name,
            size,
            imageUrl: colorValue.imageUrl,
          })
        }
      }
    } else if (colorProp) {
      for (const value of colorProp.values) {
        pushSku({
          color: value.name,
          size: null,
          imageUrl: value.imageUrl,
        })
      }
    } else if (sizeProp) {
      for (const value of sizeProp.values) {
        pushSku({ size: value.name })
      }
    } else if (colorImageByLabel.size && allSizeLabels.length) {
      // 无 skuProps 色维但有 DOM 色块 + 尺码（来自 map 键或其它 prop）
      for (const [color, imageUrl] of colorImageByLabel) {
        for (const size of allSizeLabels) {
          pushSku({ color, size, imageUrl })
        }
      }
    } else if (colorImageByLabel.size) {
      for (const [color, imageUrl] of colorImageByLabel) {
        pushSku({ color, size: null, imageUrl })
      }
    }
  }

  // 颜色列表：优先完整 skuProps 色表顺序；DOM 仅补缩略图，不在色表已完整时追加额外色名
  const colors: Array<{ label: string; imageUrl?: string | null }> = []
  const seenColors = new Set<string>()
  const authoritativeColorTable = (colorProp?.values.length || 0) >= 2
  const pushColorRow = (label: string, imageUrl?: string | null) => {
    const normalized = normalizeText(label)
    if (!normalized || seenColors.has(normalized)) {
      if (normalized && imageUrl) {
        const existing = colors.find(item => item.label === normalized)
        if (existing && !existing.imageUrl) existing.imageUrl = imageUrl
      }
      return
    }
    seenColors.add(normalized)
    colors.push({
      label: normalized,
      imageUrl: imageUrl || colorImageByLabel.get(normalized) || null,
    })
  }
  for (const value of colorProp?.values || []) {
    pushColorRow(value.name, value.imageUrl || colorImageByLabel.get(value.name) || null)
  }
  for (const option of domColorOptions) {
    if (authoritativeColorTable && !seenColors.has(option.label)) continue
    pushColorRow(option.label, colorImageByLabel.get(option.label) || option.imageUrl || null)
  }
  for (const color of Object.keys(sizesByColor)) {
    // skuMap 真实出现的色仍收录（即便残缺 props 未列出）
    pushColorRow(color, colorImageByLabel.get(color) || null)
  }
  if (!authoritativeColorTable) {
    for (const color of colorImageByLabel.keys()) {
      pushColorRow(color, colorImageByLabel.get(color) || null)
    }
  }

  // 每个已收录颜色都保证有 sizesByColor 键（无尺码则为 []），便于待上传区按色展开
  for (const color of colors) {
    if (!(color.label in sizesByColor)) {
      sizesByColor[color.label] = allSizeLabels.length ? [...allSizeLabels] : []
    }
  }

  // skuMap 解析失败但 DOM/skuProps 已有颜色时：必须展开 SKU，禁止返回空表让上层落「默认规格」
  if (isDefaultOnlySkuTable(skuTable) && colors.length > 0) {
    const expanded = expandSkuTableFromColors({
      colors,
      sizesByColor,
      costPrice: prices.length ? Math.min(...prices) : 0,
      price: prices.length ? Math.min(...prices) : 0,
      stock: DEFAULT_AVAILABLE_STOCK,
    })
    for (const row of expanded) {
      skuTable.push(row)
      const color = row.attributes?.find(attr => attr.name === '颜色')?.value
      const size = row.attributes?.find(attr => attr.name === '尺码')?.value
      if (color && size) {
        const list = sizesByColor[color] || []
        if (!list.includes(size)) list.push(size)
        sizesByColor[color] = list
      } else if (color && !(color in sizesByColor)) {
        sizesByColor[color] = allSizeLabels.length ? [...allSizeLabels] : []
      }
    }
  }

  const specSummary: SpecSummaryJson[] = []
  if (colors.length) {
    specSummary.push({ name: '颜色', values: colors.map(item => item.label) })
  }
  if (allSizeLabels.length) {
    specSummary.push({ name: '尺码', values: allSizeLabels })
  } else {
    const sizeSet = new Set<string>()
    for (const list of Object.values(sizesByColor)) {
      for (const size of list) sizeSet.add(size)
    }
    for (const row of skuTable) {
      const size = row.attributes?.find(attr => attr.name === '尺码')?.value
      if (size) sizeSet.add(size)
    }
    if (sizeSet.size) {
      specSummary.push({ name: '尺码', values: sortSizeLabels(Array.from(sizeSet)) })
    }
  }

  for (const color of Object.keys(sizesByColor)) {
    sizesByColor[color] = sortSizeLabels(sizesByColor[color] || [])
  }

  return {
    skuTable,
    colors,
    sizesByColor,
    specSummary,
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
  }
}

/** 单次抓取（多候选 URL）；区分 风控 / 失效 / 可解析 */
const fetch1688OfferPreviewOnce = async (
  sourceUrl: string,
  options?: { useBackupUa?: boolean; attemptLabel?: string },
): Promise<Fetch1688AttemptResult> => {
  const empty = empty1688OfferPreview()
  const offerId = extract1688OfferId(sourceUrl)
  if (!offerId) {
    return { kind: 'empty', preview: empty, detail: '无效的 1688 商品链接' }
  }

  const candidates = build1688FetchCandidates(sourceUrl, offerId, Boolean(options?.useBackupUa))
  const attemptLabel = options?.attemptLabel || 'attempt'
  let sawRiskControl = false
  let sawExpired = false
  let sawHttp403 = false
  let lastHttpStatus: number | undefined
  let lastNetworkError = false

  for (const candidate of candidates) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 12000)
      const response = await fetch(candidate.url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: build1688RequestHeaders(candidate.ua),
      })
      clearTimeout(timer)
      lastHttpStatus = response.status

      if (response.status === 404 || response.status === 410) {
        console.warn(`[fetch1688OfferPreview] ${attemptLabel} expired HTTP ${response.status} for`, candidate.url)
        return { kind: 'expired', preview: empty, httpStatus: response.status, detail: `源站返回 ${response.status}` }
      }

      if (response.status === 403) {
        sawHttp403 = true
        sawRiskControl = true
        console.warn(`[fetch1688OfferPreview] ${attemptLabel} HTTP 403 风控 for`, candidate.url)
        continue
      }

      if (!response.ok) {
        console.warn(`[fetch1688OfferPreview] ${attemptLabel} HTTP ${response.status} for`, candidate.url)
        continue
      }

      const html = await response.text()
      if (!html || html.length < 800) {
        continue
      }

      if (is1688RiskControlHtml(html)) {
        sawRiskControl = true
        console.warn(`[fetch1688OfferPreview] ${attemptLabel} risk-control HTML for`, candidate.url)
        continue
      }

      if (is1688ExpiredOfferHtml(html)) {
        const name = extract1688OfferTitleFromHtml(html)
        if (!name) {
          sawExpired = true
          console.warn(`[fetch1688OfferPreview] ${attemptLabel} expired HTML for`, candidate.url)
          continue
        }
      }

      const name = extract1688OfferTitleFromHtml(html)
      // multiSpec 必须先解析：后面色图候选会读 colors/skuTable，避免 TDZ ReferenceError
      const multiSpec = parse1688MultiSpecFromHtml(html)

      const { hdCandidates, watermarkedFallback } = extract1688ImageCandidates(html)
      const resolvedImages = await resolve1688ImageUrls({
        hdCandidates,
        watermarkedFallback,
      })
      const mainImageUrl =
        resolvedImages.mainImageUrl ||
        watermarkedFallback[0] ||
        hdCandidates[0] ||
        null
      // Gallery = offer carousel / detail shots only; color swatches stay on SKU rows.
      const detailImages = dedupeImageUrls([
        ...(mainImageUrl ? [mainImageUrl] : []),
        ...(resolvedImages.detailImages.length > 0 ? resolvedImages.detailImages : []),
      ]).slice(0, 12)

      const finalDetailImages = detailImages.length > 0 ? detailImages : dedupeImageUrls([mainImageUrl])

      const supplierName =
        pickJsonStringField(html, 'companyName') ||
        pickJsonStringField(html, 'loginId') ||
        null

      const productDetail =
        pickJsonStringField(html, 'description') ||
        pickJsonStringField(html, 'offerDescription') ||
        null

      const sourceCategoryName =
        pickJsonStringField(html, 'leafCategoryName') ||
        pickJsonStringField(html, 'categoryName') ||
        null

      const priceText =
        pickJsonStringField(html, 'price') ||
        pickJsonStringField(html, 'priceDisplay') ||
        pickJsonStringField(html, 'offerPrice')
      const { min: priceMinFromText, max: priceMaxFromText } = parsePriceRangeText(priceText)
      const featureAttributes = parse1688FeatureAttributes(html)
      const priceMin = multiSpec.priceMin ?? priceMinFromText
      const priceMax = multiSpec.priceMax ?? priceMaxFromText ?? priceMin

      if (name || mainImageUrl || multiSpec.skuTable.length > 0) {
        return {
          kind: 'parsed',
          preview: {
            name: name ? name.slice(0, 180) : null,
            mainImageUrl,
            detailImages: finalDetailImages,
            supplierName: supplierName ? supplierName.slice(0, 120) : null,
            productDetail: productDetail ? productDetail.slice(0, 2000) : null,
            sourceCategoryName: sourceCategoryName ? sourceCategoryName.slice(0, 120) : null,
            priceMin,
            priceMax,
            minOrderQty: extract1688MinOrderQtyFromHtml(html),
            featureAttributes,
            skuTable: multiSpec.skuTable,
            colors: multiSpec.colors,
            sizesByColor: multiSpec.sizesByColor,
            specSummary: multiSpec.specSummary,
          },
        }
      }

      if (is1688ExpiredOfferHtml(html)) {
        sawExpired = true
      }
    } catch (error) {
      lastNetworkError = true
      console.warn(`[fetch1688OfferPreview] ${attemptLabel} failed for`, candidate.url, error)
    }
  }

  if (sawRiskControl || sawHttp403) {
    return {
      kind: 'risk_control',
      preview: empty,
      httpStatus: sawHttp403 ? 403 : lastHttpStatus,
      detail: FAILURE_REASON_RISK_CONTROL,
    }
  }
  if (sawExpired) {
    return { kind: 'expired', preview: empty, httpStatus: lastHttpStatus, detail: FAILURE_REASON_EXPIRED }
  }
  if (lastNetworkError) {
    return { kind: 'network_error', preview: empty, detail: '请求 1688 页面失败或超时' }
  }
  return { kind: 'empty', preview: empty, httpStatus: lastHttpStatus, detail: '未能解析到商品数据' }
}

const attemptKindToOutcome = (
  kind: Fetch1688AttemptKind,
): { outcome: Fetch1688Outcome; failureReason: string | null } => {
  if (kind === 'parsed') return { outcome: 'ok', failureReason: null }
  if (kind === 'risk_control') {
    return {
      outcome: 'risk_control',
      failureReason: has1688CookieConfigured()
        ? FAILURE_REASON_RISK_CONTROL
        : FAILURE_REASON_NO_COOKIE,
    }
  }
  if (kind === 'expired') return { outcome: 'expired', failureReason: FAILURE_REASON_EXPIRED }
  if (kind === 'network_error') return { outcome: 'failed', failureReason: FAILURE_REASON_NETWORK }
  if (kind === 'empty') return { outcome: 'failed', failureReason: FAILURE_REASON_EMPTY }
  return { outcome: 'failed', failureReason: FAILURE_REASON_EMPTY }
}

/**
 * 抓取 1688 商品预览：有 Cookie 时优先走签名 MTop JSON；失败再 HTML。
 * HTML 风控时按 5s / 30s / 60s+备用 UA 自动重试（最多 3 次）。
 * 无 Cookie 且首轮即风控时快速失败，避免空耗约 95s。
 */
/**
 * HTML captured by scripts/collect-1688.mjs and posted to POST /ingest/1688-html.
 * 1688 gates offer pages on browser TLS fingerprint, so a server-side fetch always
 * lands on the captcha page; a locally driven Chrome is the only way in.
 */
const takeCapturedOfferHtml = (sourceUrl: string): string | null => {
  const inbox = (globalThis as any).__offerHtmlInbox as
    | Map<string, { html: string; receivedAt: number }>
    | undefined
  if (!inbox) return null
  const offerId = extract1688OfferId(sourceUrl)
  if (!offerId) return null
  const entry = inbox.get(offerId)
  if (!entry) return null
  // Consume it so a stale capture cannot silently satisfy a later re-parse.
  inbox.delete(offerId)
  return entry.html
}

const fetch1688OfferPreviewDetailed = async (sourceUrl: string): Promise<Fetch1688OfferPreviewResult> => {
  const capturedHtml = takeCapturedOfferHtml(sourceUrl)
  if (capturedHtml) {
    const preview = await buildPreviewFromParsedHtml(capturedHtml)
    if (preview) {
      console.warn(
        `[fetch1688OfferPreview] parsed browser-captured HTML (${capturedHtml.length} bytes) for ${sourceUrl}`,
      )
      return { preview, outcome: 'ok', failureReason: null }
    }
    console.warn(`[fetch1688OfferPreview] captured HTML unparseable for ${sourceUrl}; falling back to fetch`)
  }

  // Paid OneBound API is the primary source. Browser-captured HTML stays first
  // (already available / free). When OneBound is configured but fails, do NOT
  // fall back to Cookie/MTop — those retries only hit 1688 risk-control waits.
  if (hasOneBound1688Configured()) {
    const oneBound = await fetchOneBound1688Preview(sourceUrl)
    if (oneBound.kind === 'parsed') {
      return {
        preview: oneBound.preview,
        outcome: 'ok',
        failureReason: null,
      }
    }
    if (oneBound.kind === 'failed') {
      const detail = [oneBound.errorCode, oneBound.reason].filter(Boolean).join(' ')
      console.warn(`[onebound1688] fail-fast (no Cookie fallback): ${detail}`)
      return {
        preview: empty1688OfferPreview(),
        outcome: 'failed',
        failureReason: `OneBound 解析失败：${oneBound.reason || '未知错误'}${
          oneBound.errorCode ? `（${oneBound.errorCode}）` : ''
        }`,
      }
    }
  }

  const cookieReady = has1688CookieConfigured()

  // Cookie 可用时优先 MTop（详情 HTML 在境外/机房 IP 上极易命中 punish 页）
  if (cookieReady) {
    const mtopAttempt = await fetch1688OfferPreviewViaMtop(sourceUrl)
    if (mtopAttempt?.kind === 'parsed') {
      return { preview: mtopAttempt.preview, outcome: 'ok', failureReason: null }
    }
  }

  let attempt = await fetch1688OfferPreviewOnce(sourceUrl, { attemptLabel: 'initial' })

  if (attempt.kind === 'parsed') {
    return { preview: attempt.preview, outcome: 'ok', failureReason: null }
  }

  if (attempt.kind === 'expired') {
    return { preview: attempt.preview, outcome: 'expired', failureReason: FAILURE_REASON_EXPIRED }
  }

  // Pure network timeout: do not burn ~95s on risk-control waits
  if (attempt.kind === 'network_error') {
    if (cookieReady) {
      const mtopNetworkRetry = await fetch1688OfferPreviewViaMtop(sourceUrl)
      if (mtopNetworkRetry?.kind === 'parsed') {
        return { preview: mtopNetworkRetry.preview, outcome: 'ok', failureReason: null }
      }
    }
    console.warn(`[fetch1688OfferPreview] network_error for ${sourceUrl}; skipping long risk retries`)
    return {
      preview: attempt.preview,
      outcome: 'failed',
      failureReason:
        '无法连接 1688（超时）。请在服务器执行: curl -I -m 15 https://detail.1688.com/ 与 curl -I -m 15 https://h5api.m.1688.com/ ，并确认 Cookie 仍有效后重试',
    }
  }

  // No cookie + risk/empty/http on first hit → operator must configure login cookie
  if (
    !cookieReady &&
    (attempt.kind === 'risk_control' || attempt.kind === 'empty' || attempt.kind === 'http_error')
  ) {
    console.warn(
      `[fetch1688OfferPreview] no COOKIE_1688 configured; aborting retries after ${attempt.kind} for ${sourceUrl}`,
    )
    return {
      preview: attempt.preview,
      outcome: 'risk_control',
      failureReason: FAILURE_REASON_NO_COOKIE,
    }
  }

  // HTML 风控后，再给 MTop 一次机会（可能刚 bootstrap 到 token）
  if (cookieReady && (attempt.kind === 'risk_control' || attempt.kind === 'empty')) {
    const mtopRetry = await fetch1688OfferPreviewViaMtop(sourceUrl)
    if (mtopRetry?.kind === 'parsed') {
      return { preview: mtopRetry.preview, outcome: 'ok', failureReason: null }
    }
  }

  if (attempt.kind !== 'risk_control') {
    const mapped = attemptKindToOutcome(attempt.kind)
    // 空结果也可能是隐性风控：有 Cookie 时仍走重试（network_error 已在上方短路）
    if (attempt.kind === 'empty' || attempt.kind === 'http_error') {
      console.warn(
        `[fetch1688OfferPreview] initial=${attempt.kind} for ${sourceUrl}, treating as soft-fail and entering risk retry path`,
      )
    } else {
      return { preview: attempt.preview, ...mapped }
    }
  } else {
    console.warn(`[fetch1688OfferPreview] risk-control detected for ${sourceUrl}, starting smart retry`)
  }

  for (const step of RISK_CONTROL_RETRY_SCHEDULE) {
    console.warn(`[fetch1688OfferPreview] ${step.label} waiting ${step.waitMs}ms for ${sourceUrl}`)
    await sleep(step.waitMs)

    if (cookieReady) {
      const mtopDuringRetry = await fetch1688OfferPreviewViaMtop(sourceUrl)
      if (mtopDuringRetry?.kind === 'parsed') {
        console.warn(`[fetch1688OfferPreview] ${step.label} mtop succeeded for ${sourceUrl}`)
        return { preview: mtopDuringRetry.preview, outcome: 'ok', failureReason: null }
      }
    }

    attempt = await fetch1688OfferPreviewOnce(sourceUrl, {
      useBackupUa: step.useBackupUa,
      attemptLabel: step.label,
    })

    if (attempt.kind === 'parsed') {
      console.warn(`[fetch1688OfferPreview] ${step.label} succeeded for ${sourceUrl}`)
      return { preview: attempt.preview, outcome: 'ok', failureReason: null }
    }
    if (attempt.kind === 'expired') {
      return { preview: attempt.preview, outcome: 'expired', failureReason: FAILURE_REASON_EXPIRED }
    }
    if (attempt.kind === 'network_error') {
      console.warn(`[fetch1688OfferPreview] ${step.label} network_error for ${sourceUrl}; aborting remaining waits`)
      return {
        preview: attempt.preview,
        outcome: 'failed',
        failureReason:
          '无法连接 1688（超时）。服务器访问 detail.1688.com / h5api.m.1688.com 可能被阻断，请检查出网或稍后重试',
      }
    }
    if (attempt.kind !== 'risk_control' && attempt.kind !== 'empty' && attempt.kind !== 'http_error') {
      return { preview: attempt.preview, ...attemptKindToOutcome(attempt.kind) }
    }
    console.warn(`[fetch1688OfferPreview] ${step.label} still ${attempt.kind} for ${sourceUrl}`)
  }

  const finalKind = attempt.kind === 'expired' ? 'expired' : 'risk_control'
  if (finalKind === 'expired') {
    return { preview: attempt.preview, outcome: 'expired', failureReason: FAILURE_REASON_EXPIRED }
  }
  console.warn(`[fetch1688OfferPreview] all retries exhausted (risk-control) for ${sourceUrl}`)
  return {
    preview: attempt.preview,
    outcome: 'risk_control',
    failureReason: cookieReady ? FAILURE_REASON_RISK_CONTROL : FAILURE_REASON_NO_COOKIE,
  }
}

/** 从 1688 商品详情页抓取原标题 / 主图(优先高清原图) / 供应商 / 多规格 SKU（优先移动端页，SSR 更完整） */
const fetch1688OfferPreview = async (sourceUrl: string): Promise<Fetched1688OfferPreview> => {
  const result = await fetch1688OfferPreviewDetailed(sourceUrl)
  return result.preview
}

export type OfferLiveStatus = 'DELISTED' | 'OUT_OF_STOCK' | 'NORMAL' | 'UNKNOWN'

export interface Check1688OfferLiveStatusResult {
  status: OfferLiveStatus
  reason: string | null
  offer_id: string | null
  offer_name: string | null
}

const pickJsonNumberField = (html: string, key: string): number | null => {
  const matched = html.match(new RegExp(`"${key}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, 'i'))
  if (!matched?.[1]) return null
  const num = Number(matched[1])
  return Number.isFinite(num) ? num : null
}

/** 从 1688 详情 HTML/mtop JSON 提取起订量（beginAmount / 混批 / 文案） */
const extract1688MinOrderQtyFromHtml = (html: string): number | null => {
  if (!html) return null
  const candidates = [
    pickJsonNumberField(html, 'beginAmount'),
    pickJsonNumberField(html, 'mixAmount'),
    pickJsonNumberField(html, 'startAmount'),
    pickJsonNumberField(html, 'minOrderQuantity'),
    pickJsonNumberField(html, 'minOrderQty'),
    pickJsonNumberField(html, 'minBuyCount'),
  ]
  for (const n of candidates) {
    if (n != null && n > 0) return Math.max(1, Math.round(n))
  }
  // 价格梯度里常见 "begin": 10
  const begins = Array.from(html.matchAll(/"begin"\s*:\s*(\d+)/gi))
    .map(m => Number(m[1]))
    .filter(n => Number.isFinite(n) && n > 0)
  if (begins.length) return Math.max(1, Math.round(Math.min(...begins)))

  const textMatch =
    html.match(/(?:起订量|起批量|起批|起订)[：:\s]*(\d+)\s*件?/i) ||
    html.match(/(\d+)\s*件起批/i) ||
    html.match(/≥\s*(\d+)\s*件/i)
  if (textMatch?.[1]) {
    const n = Number(textMatch[1])
    if (Number.isFinite(n) && n > 0) return Math.max(1, Math.round(n))
  }
  return null
}

const classify1688OfferHtml = (html: string): Check1688OfferLiveStatusResult => {
  const name = extract1688OfferTitleFromHtml(html)

  // 风控页绝不当成下架/失效
  if (is1688RiskControlHtml(html)) {
    return {
      status: 'UNKNOWN',
      reason: FAILURE_REASON_RISK_CONTROL,
      offer_id: null,
      offer_name: name ? name.slice(0, 180) : null,
    }
  }

  const delistedHit = is1688ExpiredOfferHtml(html)

  if (delistedHit && !name) {
    return { status: 'DELISTED', reason: '1688 页面显示商品已下架或不存在', offer_id: null, offer_name: null }
  }

  const canBookedAmount =
    pickJsonNumberField(html, 'canBookedAmount') ??
    pickJsonNumberField(html, 'amountOnSale') ??
    pickJsonNumberField(html, 'saleCount')
  const stockNum =
    pickJsonNumberField(html, 'stock') ??
    pickJsonNumberField(html, 'skuStock') ??
    pickJsonNumberField(html, 'canBookCount')

  const oosHit =
    /暂时缺货|无货|售罄|缺货|sold\s*out|out\s*of\s*stock|inventory.?empty/i.test(html) ||
    (canBookedAmount !== null && canBookedAmount <= 0) ||
    (stockNum !== null && stockNum <= 0)

  if (oosHit && name) {
    return { status: 'OUT_OF_STOCK', reason: '1688 页面显示缺货/可售库存为 0', offer_id: null, offer_name: name.slice(0, 180) }
  }

  if (delistedHit) {
    return { status: 'DELISTED', reason: '1688 页面含下架/失效标识', offer_id: null, offer_name: name ? name.slice(0, 180) : null }
  }

  if (name || pickJsonStringField(html, 'companyName')) {
    return { status: 'NORMAL', reason: null, offer_id: null, offer_name: name ? name.slice(0, 180) : null }
  }

  return { status: 'UNKNOWN', reason: '未能从 1688 页面识别商品状态', offer_id: null, offer_name: null }
}

/** 探测 1688 源链接当前在售状态：已下架 / 缺货 / 正常（403/验证码归为风控 UNKNOWN，不标 DELISTED） */
export const check1688OfferLiveStatus = async (sourceUrl: string): Promise<Check1688OfferLiveStatusResult> => {
  const offerId = extract1688OfferId(sourceUrl)
  if (!offerId) {
    return { status: 'UNKNOWN', reason: '无效的 1688 商品链接', offer_id: null, offer_name: null }
  }

  const candidates = build1688FetchCandidates(sourceUrl, offerId, false)

  let lastUnknown: Check1688OfferLiveStatusResult = {
    status: 'UNKNOWN',
    reason: '无法访问 1688 商品页',
    offer_id: offerId,
    offer_name: null
  }
  let sawRiskControl = false

  for (const candidate of candidates) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 12000)
      const response = await fetch(candidate.url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: build1688RequestHeaders(candidate.ua),
      })
      clearTimeout(timer)

      if (response.status === 404 || response.status === 410) {
        return { status: 'DELISTED', reason: `源站返回 ${response.status}`, offer_id: offerId, offer_name: null }
      }
      if (response.status === 403) {
        sawRiskControl = true
        lastUnknown = { status: 'UNKNOWN', reason: FAILURE_REASON_RISK_CONTROL, offer_id: offerId, offer_name: null }
        continue
      }
      if (!response.ok) {
        lastUnknown = { status: 'UNKNOWN', reason: `源站 HTTP ${response.status}`, offer_id: offerId, offer_name: null }
        continue
      }

      const html = await response.text()
      if (!html || html.length < 800) {
        lastUnknown = { status: 'UNKNOWN', reason: '源站页面内容过短', offer_id: offerId, offer_name: null }
        continue
      }

      if (is1688RiskControlHtml(html)) {
        sawRiskControl = true
        lastUnknown = { status: 'UNKNOWN', reason: FAILURE_REASON_RISK_CONTROL, offer_id: offerId, offer_name: null }
        continue
      }

      const classified = classify1688OfferHtml(html)
      if (classified.status === 'UNKNOWN') {
        lastUnknown = { ...classified, offer_id: offerId }
        continue
      }
      return { ...classified, offer_id: offerId }
    } catch (error) {
      console.warn('[check1688OfferLiveStatus] failed for', candidate.url, error)
      lastUnknown = { status: 'UNKNOWN', reason: '请求 1688 页面失败或超时', offer_id: offerId, offer_name: null }
    }
  }

  if (sawRiskControl) {
    return { status: 'UNKNOWN', reason: FAILURE_REASON_RISK_CONTROL, offer_id: offerId, offer_name: null }
  }
  return lastUnknown
}

/** 回填仍使用占位标题/主图，或仍残留旧版假红蓝黑 SKU 的待上传条目 */
/** Optional 1688 network backfill — MUST NOT run on read/list RPCs (P0). Kept for future explicit maintenance RPC. */
const backfillPendingImportOriginalMeta = async (limit = 6) => {
  const candidates = await prisma.importtaskitem.findMany({
    where: {
      isPublished: false,
      fetchStatus: 'COMPLETED',
      sourceUrl: { contains: '1688.com' }
    },
    orderBy: { updatedAt: 'desc' },
    take: 40,
    select: {
      id: true,
      sourceUrl: true,
      parsedName: true,
      mainImageUrl: true,
      parsedMainImageUrl: true,
      supplierName: true,
      productDetail: true,
      sourceCategoryName: true,
      skuSummaryText: true,
      availableStock: true,
      cnyPriceMin: true,
      cnyPriceMax: true,
      parsedPriceMin: true,
      parsedPriceMax: true,
      costPrice: true,
      previewDataJson: true,
      specSummaryJson: true,
    }
  })

  const targets = candidates
    .filter(item => {
      const preview = (item.previewDataJson || {}) as PreviewDataJson
      return (
        isPlaceholderPendingName(item.parsedName) ||
        isPlaceholderPendingImage(item.mainImageUrl || item.parsedMainImageUrl) ||
        isClassicMock1688SkuSummary(item.skuSummaryText) ||
        isClassicMock1688SkuTable(preview.skuTable)
      )
    })
    .slice(0, limit)

  let updated = 0
  for (const item of targets) {
    const meta = await fetch1688OfferPreview(item.sourceUrl)
    const currentPreview = ((item.previewDataJson || {}) as PreviewDataJson)
    const hadMockSkus =
      isClassicMock1688SkuSummary(item.skuSummaryText) ||
      isClassicMock1688SkuTable(currentPreview.skuTable)
    const hasRealMeta = Boolean(meta.name || meta.mainImageUrl || meta.skuTable.length > 0)

    if (!hasRealMeta) {
      // 仍抓不到真数据：至少清掉旧版假红蓝黑 SKU，避免运营误当真规格
      if (hadMockSkus) {
        const fallbackCost = toNumberOrNull(item.costPrice ?? item.cnyPriceMin ?? item.parsedPriceMin) ?? 50
        const fallbackSku = buildNeutralFallbackSkuRow({
          costPrice: fallbackCost,
          price: fallbackCost,
          stock: resolveInitialStock(item.availableStock),
        })
        await prisma.importtaskitem.update({
          where: { id: item.id },
          data: {
            skuSummaryText: '默认规格',
            specSummaryJson: [{ name: '规格', values: ['默认规格'] }] as any,
            failureReason: FAILURE_REASON_RISK_CONTROL,
            previewDataJson: {
              ...currentPreview,
              colors: [],
              sizesByColor: {},
              skuTable: [fallbackSku],
            } as any,
          },
        })
        updated += 1
      }
      await new Promise(resolve => setTimeout(resolve, 800))
      continue
    }

    const nextName = meta.name || item.parsedName
    const nextImage = meta.mainImageUrl || item.mainImageUrl || item.parsedMainImageUrl
    const nextDetailImages =
      Array.isArray(meta.detailImages) && meta.detailImages.length > 0
        ? meta.detailImages
        : dedupeImageUrls([
            nextImage,
            ...((Array.isArray(currentPreview.detailImages) ? currentPreview.detailImages : []) as string[]),
          ])
    const nextSupplier = meta.supplierName || (isPlaceholderPendingName(item.parsedName) ? null : item.supplierName)
    const nextDetail = meta.productDetail || item.productDetail
    const nextCategory = meta.sourceCategoryName || item.sourceCategoryName
    const nextPriceMin = meta.priceMin ?? toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin)
    const nextPriceMax = meta.priceMax ?? toNumberOrNull(item.cnyPriceMax ?? item.parsedPriceMax) ?? nextPriceMin

    const shouldReplaceSkus = meta.skuTable.length > 0 || meta.colors.length > 0 || hadMockSkus
    const nextSkuTable = resolveSkuTableOrExpandFromColors({
      skuTable: meta.skuTable.length > 0 ? meta.skuTable : hadMockSkus ? [] : currentPreview.skuTable,
      colors: meta.colors.length ? meta.colors : currentPreview.colors || [],
      sizesByColor: Object.keys(meta.sizesByColor).length ? meta.sizesByColor : currentPreview.sizesByColor,
      costPrice: nextPriceMin ?? 50,
      price: nextPriceMin ?? 50,
      stock: resolveInitialStock(item.availableStock),
    })
    let nextSpecSummary: SpecSummaryJson[] =
      meta.specSummary.length > 0
        ? meta.specSummary
        : shouldReplaceSkus && !isDefaultOnlySkuTable(nextSkuTable)
          ? ([
              ...(meta.colors.length ? [{ name: '颜色', values: meta.colors.map(c => c.label) }] : []),
              ...(() => {
                const sizes = Array.from(
                  new Set(Object.values(meta.sizesByColor || {}).flat().filter(Boolean)),
                )
                return sizes.length ? [{ name: '尺码', values: sizes }] : []
              })(),
            ] as SpecSummaryJson[])
          : hadMockSkus
            ? [{ name: '规格', values: ['默认规格'] }]
            : Array.isArray(item.specSummaryJson)
              ? (item.specSummaryJson as SpecSummaryJson[])
              : []
    if (nextSpecSummary.length === 0 && isDefaultOnlySkuTable(nextSkuTable)) {
      nextSpecSummary = [{ name: '规格', values: ['默认规格'] }]
    }
    const nextSkuSummary =
      Array.isArray(nextSkuTable) && nextSkuTable.length > 0
        ? nextSkuTable.map(sku => sku.spec).filter(Boolean).join(' | ') || '默认规格'
        : hadMockSkus
          ? '默认规格'
          : item.skuSummaryText

    await prisma.importtaskitem.update({
      where: { id: item.id },
      data: {
        parsedName: nextName,
        supplierName: nextSupplier || null,
        mainImageUrl: nextImage,
        parsedMainImageUrl: nextImage,
        productDetail: nextDetail,
        sourceCategoryName: nextCategory,
        cnyPriceMin: nextPriceMin,
        cnyPriceMax: nextPriceMax,
        parsedPriceMin: nextPriceMin,
        parsedPriceMax: nextPriceMax,
        costPrice: toNumberOrNull(item.costPrice) ?? nextPriceMin,
        ...(shouldReplaceSkus
          ? {
              skuSummaryText: nextSkuSummary,
              specSummaryJson: nextSpecSummary as any,
              failureReason: null,
            }
          : {}),
        previewDataJson: {
          ...currentPreview,
          name: nextName || currentPreview.name,
          mainImageUrl: nextImage || currentPreview.mainImageUrl,
          detailImages: nextDetailImages.length > 0 ? nextDetailImages : currentPreview.detailImages,
          shortDescription: nextDetail || currentPreview.shortDescription,
          price: nextPriceMin ?? currentPreview.price,
          ...(shouldReplaceSkus
            ? {
                skuTable: nextSkuTable,
                colors: meta.colors.length
                  ? meta.colors
                  : (Array.isArray(currentPreview.colors) ? currentPreview.colors : []),
                sizesByColor: Object.keys(meta.sizesByColor).length
                  ? meta.sizesByColor
                  : (currentPreview.sizesByColor || {}),
              }
            : {}),
        } as any
      }
    })
    updated += 1
    await new Promise(resolve => setTimeout(resolve, 1200))
  }

  return updated
}

const resolvePendingSkuDrafts = (item: any): PendingImportSkuItem[] => {
  const preview = (item.previewDataJson || {}) as PreviewDataJson
  const table = Array.isArray(preview.skuTable) ? preview.skuTable : []
  const recoverableSizesByColor = resolveRecoverableSizesByColor(
    preview,
    Array.isArray(item.specSummaryJson) ? (item.specSummaryJson as SpecSummaryJson[]) : [],
  )
  const hadMock =
    isClassicMock1688SkuTable(table) || isClassicMock1688SkuSummary(item.skuSummaryText)

  if (hadMock) {
    const fallbackCost =
      toNumberOrNull(item.costPrice ?? item.cnyPriceMin ?? item.parsedPriceMin) ?? 50
    // 假红蓝黑清掉后：若预览仍有真实 colors，展开色/码，禁止只发「默认规格」
    const expanded = expandSkuTableFromColors({
      colors: preview.colors || [],
      sizesByColor: recoverableSizesByColor,
      costPrice: fallbackCost,
      price: toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin) ?? fallbackCost,
      stock: resolveInitialStock(item.availableStock),
      weightGrams: toNumberOrNull(item.weightGrams),
    })
    if (expanded.length > 0) {
      return expanded.map((row, index) => ({
        sku_key: normalizeText(row.skuKey) || `sku-${index + 1}`,
        spec_text: normalizeText(row.spec) || formatSpecText(row.attributes || []),
        cost_price: toNumberOrNull(row.costPrice),
        price: toNumberOrNull(row.price),
        weight_grams: toNumberOrNull(row.weightGrams ?? item.weightGrams),
        stock: resolveInitialStock(row.stock ?? item.availableStock),
        image_url: normalizeText(row.imageUrl) || null,
        attributes: Array.isArray(row.attributes)
          ? row.attributes.map(attr => ({
              name: normalizeText(attr?.name) || '规格',
              value: normalizeText(attr?.value) || '默认',
            }))
          : parseSpecAttributes(row.spec || ''),
      }))
    }
    const fallback = buildNeutralFallbackSkuRow({
      costPrice: fallbackCost,
      price: toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin) ?? fallbackCost,
      stock: resolveInitialStock(item.availableStock),
    })
    return [
      {
        sku_key: fallback.skuKey,
        spec_text: fallback.spec,
        cost_price: fallback.costPrice,
        price: fallback.price,
        weight_grams: fallback.weightGrams,
        stock: resolveInitialStock(fallback.stock),
        image_url: fallback.imageUrl,
        attributes: fallback.attributes || [{ name: '规格', value: '默认规格' }],
      },
    ]
  }

  const resolvedTable = resolveSkuTableOrExpandFromColors({
    skuTable: table,
    colors: preview.colors || [],
    sizesByColor: recoverableSizesByColor,
    costPrice: toNumberOrNull(item.costPrice) ?? 50,
    price: toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin) ?? 50,
    stock: resolveInitialStock(item.availableStock),
    weightGrams: toNumberOrNull(item.weightGrams),
  })

  if (resolvedTable.length > 0 && !isDefaultOnlySkuTable(resolvedTable)) {
    return resolvedTable.map((row, index) => {
      const attributes = Array.isArray(row.attributes) && row.attributes.length > 0
        ? row.attributes.map(attr => ({ name: normalizeText(attr.name) || '规格', value: normalizeText(attr.value) || '默认' }))
        : parseSpecAttributes(row.spec || '')
      return {
        sku_key: normalizeText(row.skuKey) || `sku-${index + 1}`,
        spec_text: normalizeText(row.spec) || formatSpecText(attributes),
        cost_price: toNumberOrNull(row.costPrice ?? item.costPrice),
        price: toNumberOrNull(row.price ?? item.cnyPriceMin ?? item.parsedPriceMin),
        weight_grams: toNumberOrNull(row.weightGrams ?? item.weightGrams),
        stock: resolveInitialStock(row.stock ?? item.availableStock),
        image_url: normalizeText(row.imageUrl) || null,
        attributes
      }
    })
  }

  if (table.length > 0) {
    return table.map((row, index) => {
      const attributes = Array.isArray(row.attributes) && row.attributes.length > 0
        ? row.attributes.map(attr => ({ name: normalizeText(attr.name) || '规格', value: normalizeText(attr.value) || '默认' }))
        : parseSpecAttributes(row.spec || '')
      return {
        sku_key: normalizeText(row.skuKey) || `sku-${index + 1}`,
        spec_text: normalizeText(row.spec) || formatSpecText(attributes),
        cost_price: toNumberOrNull(row.costPrice ?? item.costPrice),
        price: toNumberOrNull(row.price ?? item.cnyPriceMin ?? item.parsedPriceMin),
        weight_grams: toNumberOrNull(row.weightGrams ?? item.weightGrams),
        stock: resolveInitialStock(row.stock ?? item.availableStock),
        image_url: normalizeText(row.imageUrl) || null,
        attributes
      }
    })
  }

  const summary = normalizeText(item.skuSummaryText)
  if (summary.includes('|')) {
    return summary.split('|').map((part, index) => {
      const attributes = parseSpecAttributes(part)
      return {
        sku_key: `sku-${index + 1}`,
        spec_text: formatSpecText(attributes, part.trim() || `规格${index + 1}`),
        cost_price: toNumberOrNull(item.costPrice),
        price: toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin),
        weight_grams: toNumberOrNull(item.weightGrams),
        stock: resolveInitialStock(item.availableStock),
        image_url: null,
        attributes
      }
    })
  }

  const attributes = parseSpecAttributes(summary || '默认规格')
  return [{
    sku_key: 'sku-1',
    spec_text: formatSpecText(attributes),
    cost_price: toNumberOrNull(item.costPrice),
    price: toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin),
    weight_grams: toNumberOrNull(item.weightGrams),
    stock: resolveInitialStock(item.availableStock),
    image_url: null,
    attributes
  }]
}

/** 无需联网：把残留的旧版红/蓝/黑演示 SKU 落库清成默认规格 */
const sanitizeClassicMockPendingImportItems = async (limit = 40) => {
  const candidates = await prisma.importtaskitem.findMany({
    where: {
      isPublished: false,
      importedProductId: null,
    },
    orderBy: { updatedAt: 'desc' },
    take: 120,
    select: {
      id: true,
      skuSummaryText: true,
      availableStock: true,
      cnyPriceMin: true,
      parsedPriceMin: true,
      costPrice: true,
      previewDataJson: true,
    },
  })

  let updated = 0
  for (const item of candidates) {
    if (updated >= limit) break
    const preview = (item.previewDataJson || {}) as PreviewDataJson
    const hadMock =
      isClassicMock1688SkuSummary(item.skuSummaryText) ||
      isClassicMock1688SkuTable(preview.skuTable)
    if (!hadMock) continue

    const fallbackCost =
      toNumberOrNull(item.costPrice ?? item.cnyPriceMin ?? item.parsedPriceMin) ?? 50
    const fallbackSku = buildNeutralFallbackSkuRow({
      costPrice: fallbackCost,
      price: fallbackCost,
      stock: resolveInitialStock(item.availableStock),
    })
    await prisma.importtaskitem.update({
      where: { id: item.id },
      data: {
        skuSummaryText: '默认规格',
        specSummaryJson: [{ name: '规格', values: ['默认规格'] }] as any,
        previewDataJson: {
          ...preview,
          colors: [],
          sizesByColor: {},
          skuTable: [fallbackSku],
        } as any,
      },
    })
    updated += 1
  }
  return updated
}

const getColorAttrValue = (sku: PendingImportSkuItem) =>
  normalizeText(
    sku.attributes?.find(attr => normalizeText(attr.name) === '颜色')?.value ||
    sku.spec_text.split('/')[0],
  )

const recalculatePendingSkuPrices = (
  drafts: PendingImportSkuItem[],
  fallbackCostPrice: number | null,
  coefficient: number,
) =>
  drafts.map((sku) => {
    const nextCost = toNumberOrNull(sku.cost_price) ?? fallbackCostPrice
    return {
      ...sku,
      cost_price: nextCost,
      price: nextCost !== null ? roundCurrency(nextCost * coefficient) : sku.price,
    }
  })

const summarizePendingSkuPrices = (
  drafts: PendingImportSkuItem[],
  exchangeRate: number,
) => {
  const prices = drafts
    .map((sku) => toNumberOrNull(sku.price))
    .filter((value): value is number => value !== null)
  const cnyMin = prices.length > 0 ? Math.min(...prices) : null
  const cnyMax = prices.length > 0 ? Math.max(...prices) : null
  return {
    cnyMin,
    cnyMax,
    usdMin: cnyMin !== null ? roundCurrency(cnyMin / exchangeRate) : null,
    usdMax: cnyMax !== null ? roundCurrency(cnyMax / exchangeRate) : null,
  }
}

/** 售价仍等于成本、但系数>1：表格导入历史 bug，打开队列时补乘系数 */
const isPendingSellPriceStuckAtCost = (
  drafts: PendingImportSkuItem[],
  itemCost: number | null,
  coefficient: number,
) => {
  if (!(coefficient > 1.0001)) return false
  const samples = drafts.length
    ? drafts.map((sku) => ({
        cost: toNumberOrNull(sku.cost_price) ?? itemCost,
        price: toNumberOrNull(sku.price),
      }))
    : [{ cost: itemCost, price: itemCost }]
  const comparable = samples.filter(
    (row) => row.cost !== null && row.cost > 0 && row.price !== null && row.price > 0,
  )
  if (!comparable.length) return false
  return comparable.every((row) => Math.abs((row.price as number) - (row.cost as number)) < 0.02)
}

const repairPendingImportPricesMissingCoefficient = async (opts?: {
  maxScan?: number
  maxUpdate?: number
}) => {
  const maxScan = Math.max(1, opts?.maxScan ?? 300)
  const maxUpdate = Math.max(1, opts?.maxUpdate ?? 40)
  const exchangeRate = await getGlobalExchangeRate(prisma)
  const categoryMap = await loadImportPricingCategories(prisma)
  let updated = 0
  let scanned = 0
  let cursor: string | undefined
  const batchSize = 50

  for (;;) {
    if (scanned >= maxScan || updated >= maxUpdate) break
    const take = Math.min(batchSize, maxScan - scanned)
    const items = await prisma.importtaskitem.findMany({
      where: {
        isPublished: false,
        fetchStatus: 'COMPLETED' as any,
      },
      select: {
        id: true,
        costPrice: true,
        coefficient: true,
        targetCategoryId: true,
        cnyPriceMin: true,
        cnyPriceMax: true,
        previewDataJson: true,
        skuSummaryText: true,
        availableStock: true,
        weightGrams: true,
        parsedPriceMin: true,
      },
      orderBy: { id: 'asc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (!items.length) break
    cursor = items[items.length - 1]?.id
    scanned += items.length

    for (const item of items) {
      if (updated >= maxUpdate) break
      const coefficient = resolvePendingItemCoefficient(item, categoryMap)
      if (!(coefficient > 1.0001)) continue
      const drafts = resolvePendingSkuDrafts(item)
      const itemCost = toNumberOrNull(item.costPrice)
      if (!isPendingSellPriceStuckAtCost(drafts, itemCost, coefficient)) continue

      const nextDrafts = recalculatePendingSkuPrices(drafts, itemCost, coefficient)
      const priceSummary = summarizePendingSkuPrices(nextDrafts, exchangeRate)
      const currentPreview = ((item.previewDataJson || {}) as PreviewDataJson)
      const dbCoefficient = toNumberOrNull(item.coefficient)
      await prisma.importtaskitem.update({
        where: { id: item.id },
        data: {
          ...(dbCoefficient === null || dbCoefficient <= 0 ? { coefficient } : {}),
          cnyPriceMin: priceSummary.cnyMin,
          cnyPriceMax: priceSummary.cnyMax,
          usdPriceMin: priceSummary.usdMin,
          usdPriceMax: priceSummary.usdMax,
          previewDataJson: {
            ...currentPreview,
            price: priceSummary.cnyMin ?? currentPreview.price,
            skuTable: nextDrafts.map((sku) => ({
              skuKey: sku.sku_key,
              spec: sku.spec_text,
              costPrice: sku.cost_price,
              price: sku.price,
              stock: sku.stock,
              weightGrams: sku.weight_grams,
              imageUrl: sku.image_url || undefined,
              attributes: sku.attributes,
            })),
          } as any,
        },
      })
      updated += 1
    }

    if (items.length < take) break
  }
  return updated
}

type PendingListEnrichContext = {
  exchangeRate: number
  categoryMap: Map<string, ImportPricingCategoryMeta>
  secondaryCategories: AutoMatchedSecondaryCategory[]
  filterCategories: FilterCategoryRow[]
}

const resolvePendingItemCoefficient = (
  item: { coefficient?: unknown; targetCategoryId?: string | null; previewDataJson?: unknown },
  categoryMap: Map<string, ImportPricingCategoryMeta>,
) => {
  const fromDb = toNumberOrNull(item.coefficient)
  if (fromDb !== null && fromDb > 0) return fromDb
  const preview = (item.previewDataJson || {}) as PreviewDataJson
  const categoryId = item.targetCategoryId || preview.categoryId || null
  return resolveImportCategoryCoefficient(categoryMap, categoryId)
}

const resolvePendingItemPricedSkus = (
  item: any,
  context: Pick<PendingListEnrichContext, 'exchangeRate' | 'categoryMap'>,
) => {
  const coefficient = resolvePendingItemCoefficient(item, context.categoryMap)
  const itemCost = toNumberOrNull(item.costPrice)
  let drafts = resolvePendingSkuDrafts(item)
  if (isPendingSellPriceStuckAtCost(drafts, itemCost, coefficient)) {
    drafts = recalculatePendingSkuPrices(drafts, itemCost, coefficient)
  }
  const priceSummary = summarizePendingSkuPrices(drafts, context.exchangeRate)
  return {
    skus: drafts,
    coefficient: toNumberOrNull(item.coefficient) ?? coefficient,
    ...priceSummary,
  }
}

const enrichPendingMatchedCategoriesFromTitle = (
  item: any,
  preview: PreviewDataJson,
  context: Pick<PendingListEnrichContext, 'secondaryCategories' | 'filterCategories'>,
) => {
  const title =
    normalizeBrandTitleSync(item.parsedName || preview.name || '') ||
    String(item.parsedName || preview.name || '').trim()
  const existingIds = Array.from(new Set((preview.matchedCategoryIds || []).filter(Boolean)))
  const existingNames = Array.from(new Set((preview.matchedCategoryNames || []).filter(Boolean)))
  if (!title) {
    return { ids: existingIds, names: existingNames }
  }

  const detailText =
    [item.productDetail, preview.shortDescription].filter(Boolean).join('\n') || null
  const fromMatcher = matchSecondaryCategoriesByTitle(
    title,
    context.secondaryCategories,
    detailText,
  ).filter((hit) => isAttributeOrFilterCategory({ name: hit.name, parentName: hit.parentName }))
  const fromFilter = matchFilterCategoriesByTitle(title, context.filterCategories, detailText)

  const productFamily = detectShelfFamily(title, detailText)
  const parentById = new Map<string, string | null>()
  for (const cat of context.secondaryCategories) parentById.set(cat.id, cat.parentName || null)
  for (const cat of context.filterCategories) parentById.set(cat.id, cat.parentName || null)

  const byId = new Map<string, string>()
  for (const hit of fromMatcher) byId.set(hit.id, hit.name)
  for (const hit of fromFilter) byId.set(hit.id, hit.name)

  const nameById = new Map<string, string>()
  for (const cat of context.secondaryCategories) nameById.set(cat.id, cat.name)
  for (const cat of context.filterCategories) nameById.set(cat.id, cat.name)
  for (const [id, name] of byId) nameById.set(id, name)

  const keepId = (id: string) => {
    const name = nameById.get(id)
    if (!name) return true
    return shelfFamiliesCompatible(productFamily, detectShelfFamily(name, parentById.get(id)))
  }

  const mergedIds = Array.from(new Set([...existingIds, ...Array.from(byId.keys())])).filter(keepId)
  const mergedNames = Array.from(
    new Set([
      ...existingNames,
      ...mergedIds.map((id) => nameById.get(id)).filter((name): name is string => Boolean(name)),
    ]),
  )
  return { ids: mergedIds, names: mergedNames }
}

const buildPendingItemStructure = (
  item: any,
  task?: any,
  enrich?: PendingListEnrichContext,
): PendingImportItemRecord => {
  const preview = (item.previewDataJson as unknown as PreviewDataJson) || {}
  const mainImage = item.mainImageUrl || item.parsedMainImageUrl || preview.mainImageUrl || null
  const rawGallery = dedupeImageUrls([
    ...(mainImage ? [mainImage] : []),
    ...((Array.isArray(preview.detailImages) ? preview.detailImages : []).filter(Boolean)),
  ])
  // List payload: cap gallery + truncate detail HTML so queue open stays under RPC timeout.
  const galleryUrls = rawGallery.slice(0, 6)
  const rawDetail = String(item.productDetail || '')
  const listDetail = rawDetail.length > 2000 ? `${rawDetail.slice(0, 2000)}\n…` : rawDetail
  const priced = enrich
    ? resolvePendingItemPricedSkus(item, enrich)
    : null
  const matchedCategories = enrich
    ? enrichPendingMatchedCategoriesFromTitle(item, preview, enrich)
    : {
        ids: Array.from(new Set((preview.matchedCategoryIds || []).filter(Boolean))),
        names: Array.from(new Set((preview.matchedCategoryNames || []).filter(Boolean))),
      }
  return {
  item_id: item.id,
  item_importTaskId: item.importTaskId,
  item_sourceUrl: item.sourceUrl,
  item_fetchStatus: (item.fetchStatus as ImportTaskItemFetchStatusType) || 'PENDING',
  item_publishStatus: (item.publishStatus as ImportTaskItemPublishStatusType) || 'PENDING',
  item_isPublished: Boolean(item.isPublished),
  item_importedProductId: item.importedProductId || null,
  item_failureReason: item.failureReason || null,
  item_productName: normalizeBrandTitleSync(item.productName || item.parsedName || null) || null,
  item_supplierName: item.supplierName || null,
  item_mainImageUrl: mainImage,
  item_galleryUrls: galleryUrls,
  item_costPrice: toNumberOrNull(item.costPrice),
  item_weightGrams: toNumberOrNull(item.weightGrams),
  item_sourceCategoryName: item.sourceCategoryName || null,
  item_targetCategoryId: item.targetCategoryId || task?.defaultCategoryId || null,
  item_matchedCategoryIds: matchedCategories.ids,
  item_matchedCategoryNames: matchedCategories.names,
  item_coefficient: priced ? priced.coefficient : toNumberOrNull(item.coefficient),
  item_goodsStatus: (item.goodsStatus as ProductStatusType) || ((task?.defaultStatus as ProductStatusType) || 'DRAFT'),
  item_productDetail: listDetail || null,
  item_featureAttributes: Array.isArray(preview.featureAttributes)
    ? preview.featureAttributes
        .map(attr => ({
          key: String(attr?.key || '').trim(),
          value: String(attr?.value || '').trim(),
        }))
        .filter(attr => attr.key && attr.value)
        .slice(0, 40)
    : [],
  item_skuSummaryText: item.skuSummaryText || null,
  item_cnyPriceMin: priced?.cnyMin ?? toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin),
  item_cnyPriceMax: priced?.cnyMax ?? toNumberOrNull(item.cnyPriceMax ?? item.parsedPriceMax),
  item_usdPriceMin: priced?.usdMin ?? toNumberOrNull(item.usdPriceMin),
  item_usdPriceMax: priced?.usdMax ?? toNumberOrNull(item.usdPriceMax),
  item_minimumOrderQuantity: resolveInitialMinOrderQty(item.minimumOrderQuantity),
  item_availableStock: resolveInitialStock(item.availableStock),
  item_parsedName: normalizeBrandTitleSync(item.parsedName || null) || null,
  item_parsedMainImageUrl: item.parsedMainImageUrl || null,
  item_createdAt: item.createdAt,
  item_updatedAt: item.updatedAt || item.createdAt,
  item_skus: priced?.skus ?? resolvePendingSkuDrafts(item),
  }
}

const buildPendingTaskSummary = (task: any): PendingImportQueueTaskSummary => ({
  task_id: task.id,
  task_taskName: task.taskName,
  task_status: task.status as ImportTaskStatusType,
  task_sourceLinkCount: task.sourceLinkCount,
  task_successCount: task.successCount,
  task_failureCount: task.failureCount,
  task_progressPercent: task.progressPercent,
  task_defaultStatus: task.defaultStatus as ProductStatusType,
  task_defaultCategoryId: task.defaultCategoryId || null,
  task_lastRateLimitedAt: task.lastRateLimitedAt || null,
  task_startedAt: task.startedAt || null,
  task_finishedAt: task.finishedAt || null
})

const PENDING_IMPORT_QUEUE_WHERE = {
  isPublished: false,
  importedProductId: null,
  OR: [
    { fetchStatus: 'COMPLETED' as any },
    { publishStatus: { in: ['FAILED', 'PENDING', 'RUNNING'] as any } },
    { fetchStatus: { in: ['PENDING', 'RUNNING', 'FAILED', 'RATE_LIMITED', 'RETRY_PENDING'] as any } },
  ],
} as const

/** Soft cap so admin open never pulls unbounded preview JSON (table import / 1688 drafts). */
const DEFAULT_PENDING_QUEUE_PAGE_SIZE = 30
const MAX_PENDING_QUEUE_PAGE_SIZE = 100
const PUBLISH_PENDING_CONCURRENCY = 3

const PENDING_QUEUE_ITEM_SELECT = {
  id: true,
  importTaskId: true,
  sourceUrl: true,
  fetchStatus: true,
  publishStatus: true,
  isPublished: true,
  importedProductId: true,
  failureReason: true,
  parsedName: true,
  supplierName: true,
  mainImageUrl: true,
  parsedMainImageUrl: true,
  costPrice: true,
  weightGrams: true,
  sourceCategoryName: true,
  targetCategoryId: true,
  coefficient: true,
  goodsStatus: true,
  productDetail: true,
  skuSummaryText: true,
  cnyPriceMin: true,
  cnyPriceMax: true,
  parsedPriceMin: true,
  parsedPriceMax: true,
  usdPriceMin: true,
  usdPriceMax: true,
  minimumOrderQuantity: true,
  availableStock: true,
  createdAt: true,
  updatedAt: true,
  previewDataJson: true,
  specSummaryJson: true,
  importTask: {
    select: {
      id: true,
      taskName: true,
      status: true,
      sourceLinkCount: true,
      successCount: true,
      failureCount: true,
      progressPercent: true,
      defaultStatus: true,
      defaultCategoryId: true,
      lastRateLimitedAt: true,
      startedAt: true,
      finishedAt: true,
    },
  },
} as const

const loadPendingImportQueueSnapshot = async (opts?: {
  page?: number
  page_size?: number
}): Promise<PendingImportQueueSnapshot & { total: number }> => {
  const page = Math.max(1, Number(opts?.page) || 1)
  const pageSize = Math.min(
    MAX_PENDING_QUEUE_PAGE_SIZE,
    Math.max(1, Number(opts?.page_size) || DEFAULT_PENDING_QUEUE_PAGE_SIZE),
  )
  const skip = (page - 1) * pageSize

  // 预热品牌别名缓存，使列表展示的 normalizeBrandTitleSync 用到 DB 最新映射
  await loadBrandAliasRules()

  const [activeTask, fallbackTask, total, items, exchangeRate, categoryMap, secondaryCategories, filterCategories] =
    await Promise.all([
    prisma.importtask.findFirst({
      where: {
        status: {
          in: ['PENDING', 'RUNNING', 'RATE_LIMITED', 'RETRY_PENDING', 'PARTIAL_SUCCESS'] as any,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        taskName: true,
        status: true,
        sourceLinkCount: true,
        successCount: true,
        failureCount: true,
        progressPercent: true,
        defaultStatus: true,
        defaultCategoryId: true,
        lastRateLimitedAt: true,
        startedAt: true,
        finishedAt: true,
      },
    }),
    prisma.importtask.findFirst({
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        taskName: true,
        status: true,
        sourceLinkCount: true,
        successCount: true,
        failureCount: true,
        progressPercent: true,
        defaultStatus: true,
        defaultCategoryId: true,
        lastRateLimitedAt: true,
        startedAt: true,
        finishedAt: true,
      },
    }),
    prisma.importtaskitem.count({ where: PENDING_IMPORT_QUEUE_WHERE as any }),
    prisma.importtaskitem.findMany({
      where: PENDING_IMPORT_QUEUE_WHERE as any,
      // 按导入时间正序，保留 Excel 原始行顺序
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip,
      take: pageSize,
      select: PENDING_QUEUE_ITEM_SELECT,
    }),
    getGlobalExchangeRate(prisma),
    loadImportPricingCategories(prisma),
    loadAutoMatchSecondaryCategories(prisma),
    loadFilterCategoriesFromDb(prisma),
  ])

  const enrichContext: PendingListEnrichContext = {
    exchangeRate,
    categoryMap,
    secondaryCategories,
    filterCategories,
  }

  const task = activeTask || fallbackTask

  const sortedItems = [...items].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    if (timeA !== timeB) return timeA - timeB

    const sortA = Number((a.previewDataJson as any)?.importSortIndex)
    const sortB = Number((b.previewDataJson as any)?.importSortIndex)
    if (Number.isFinite(sortA) && Number.isFinite(sortB) && sortA !== sortB) {
      return sortA - sortB
    }
    return String(a.id).localeCompare(String(b.id))
  })

  // 待上传区：每条 importtaskitem = 一行父商品；不做标题/图片/产品编号再合并
  return {
    activeTask: task ? buildPendingTaskSummary(task) : null,
    items: sortedItems.map(item => buildPendingItemStructure(item, item.importTask, enrichContext)),
    total,
  }
}

/** 判断待上传条目是否来自表格导入（绝不与 1688 链接共用合并键） */
const isTableImportSourceUrl = (sourceUrl?: string | null) =>
  String(sourceUrl || '').startsWith('table-import://')

const is1688ImportSourceUrl = (sourceUrl?: string | null) => {
  const url = String(sourceUrl || '')
  return /1688\.com/i.test(url) && /offer\/\d+/i.test(url)
}

/** 店铺分类列表页（offerlist）：提交后由本机采集器展开为多条 offer 详情 */
const is1688ShopCategorySourceUrl = (sourceUrl?: string | null) =>
  is1688ShopCategoryUrl(sourceUrl)

const isPinduoduoImportSourceUrl = (sourceUrl?: string | null) =>
  Boolean(sourceUrl && isPinduoduoProductUrl(String(sourceUrl)))

const resolvePendingCreationSource = (sourceUrl?: string | null): ProductCreationSourceType => {
  if (isTableImportSourceUrl(sourceUrl)) return 'TABLE_IMPORT'
  if (is1688ImportSourceUrl(sourceUrl)) return 'IMPORT_1688'
  if (isPinduoduoImportSourceUrl(sourceUrl)) return 'IMPORT_1688'
  // 兜底：非 table-import 前缀一律按链接导入独立建品，避免误走产品编号合并
  return 'IMPORT_1688'
}

const resolvePinduoduoMarkupMultiplier = (task: { markupRate?: unknown; stockStrategyJson?: unknown }) => {
  const strategy = (task.stockStrategyJson || {}) as { markupPercent?: unknown }
  const fromStrategy = toNumberOrNull(strategy.markupPercent)
  const fromTask = toNumberOrNull(task.markupRate)
  const percent = Math.max(0, fromStrategy ?? fromTask ?? 0)
  return 1 + percent / 100
}

/**
 * 将拼多多抓取结果写入待上传明细（与 1688 任务互不共用解析器）。
 * 售价 = 采集价 × (1 + 加价百分比)；成本保留采集价。
 */
const persistPinduoduoParsedItem = async (params: {
  item: { id: string; sourceUrl: string | null }
  task: {
    id: string
    defaultCategoryId?: string | null
    defaultStatus?: string | null
    markupRate?: unknown
    stockStrategyJson?: unknown
  }
  fetched: PinduoduoProductPreview
  secondaryCategories: Awaited<ReturnType<typeof loadAutoMatchSecondaryCategories>>
  categoryMap: Awaited<ReturnType<typeof loadImportPricingCategories>>
  exchangeRate: number
  importSortIndex?: number
}) => {
  const { item, task, fetched, secondaryCategories, categoryMap, exchangeRate } = params
  const sourceUrl = item.sourceUrl || ''
  const goodsId = fetched.goodsId || extractPinduoduoGoodsId(sourceUrl) || item.id.slice(0, 6)
  const markupMultiplier = resolvePinduoduoMarkupMultiplier(task)
  const strategyStock =
    resolveInitialStock((task.stockStrategyJson as StockStrategyJson | null)?.stock)
  const productName = fetched.name || `[拼多多抓取] 商品 ${goodsId}`
  const productDetail =
    fetched.productDetail || '自动采集的拼多多商品详情，请运营补充图文与说明。'
  const matchedSecondaryCategories = matchSecondaryCategoriesByTitle(
    productName,
    secondaryCategories,
    productDetail,
  )
  const matchedSecondaryCategoryIds = matchedSecondaryCategories.map(category => category.id)
  const matchedSecondaryCategoryNames = matchedSecondaryCategories.map(category => category.name)
  const targetCategoryId = pickImportPricingTargetCategory(
    matchedSecondaryCategories,
    task.defaultCategoryId,
  )
  // 系数仅作分类归属参考展示；拼多多售价按加价百分比计算
  const resolvedCoefficient = resolveImportCategoryCoefficient(categoryMap, targetCategoryId)

  const rawPriceMin = fetched.priceMin ?? 0
  const rawPriceMax = fetched.priceMax ?? rawPriceMin
  const costMin = Math.max(0, roundCurrency(rawPriceMin))
  const costMax = Math.max(costMin, roundCurrency(rawPriceMax))
  const finalPriceMin = roundCurrency(costMin * markupMultiplier)
  const finalPriceMax = roundCurrency(costMax * markupMultiplier)

  const mainImageUrl = fetched.mainImageUrl || null
  const detailImages =
    Array.isArray(fetched.detailImages) && fetched.detailImages.length > 0
      ? fetched.detailImages
      : mainImageUrl
        ? [mainImageUrl]
        : []

  const parsedSkuRows = Array.isArray(fetched.skuTable) ? fetched.skuTable : []
  const colorsEarly =
    Array.isArray(fetched.colors) && fetched.colors.length > 0
      ? fetched.colors
          .map(color => ({
            label: normalizeText(color.label),
            imageUrl: normalizeText(color.imageUrl) || null,
          }))
          .filter(color => color.label)
      : []
  const sizesByColorEarly =
    fetched.sizesByColor && typeof fetched.sizesByColor === 'object'
      ? Object.fromEntries(
          Object.entries(fetched.sizesByColor).map(([color, sizes]) => [
            color,
            Array.from(new Set((sizes || []).map(size => normalizeText(size)).filter(Boolean))),
          ]),
        )
      : {}

  const baseSkuRows = resolveSkuTableOrExpandFromColors({
    skuTable: parsedSkuRows.map(row => ({
      skuKey: row.skuKey,
      spec: row.spec,
      costPrice: row.price,
      price: row.price,
      stock: row.stock,
      imageUrl: row.imageUrl,
      attributes: row.attributes,
    })),
    colors: colorsEarly,
    sizesByColor: sizesByColorEarly,
    costPrice: costMin,
    price: finalPriceMin,
    stock: strategyStock,
  })

  // 重量自动识别：标题/详情正则提取 → 二级分类兜底 → 500g（运营可在待上传区双击覆盖）
  const fallbackWeightGrams = resolveProductWeightGrams({
    text: [productName, productDetail].filter(Boolean).join(' '),
    categoryNames: matchedSecondaryCategoryNames || [],
  })

  const skuTable: PreviewSkuTableRow[] = baseSkuRows.map((row, index) => {
    const sourceCost = toNumberOrNull(row.costPrice) ?? toNumberOrNull(row.price) ?? rawPriceMin
    const nextCost = Math.max(0, roundCurrency(sourceCost))
    const nextPrice = roundCurrency(nextCost * markupMultiplier)
    return {
      skuKey: normalizeText(row.skuKey) || `sku-${index + 1}`,
      spec: normalizeText(row.spec) || formatSpecText(row.attributes || []),
      costPrice: nextCost,
      price: nextPrice,
      stock: resolveInitialStock(toNumberOrNull(row.stock) ?? strategyStock),
      weightGrams: toNumberOrNull(row.weightGrams) ?? fallbackWeightGrams,
      imageUrl: normalizeText(row.imageUrl) || null,
      attributes:
        Array.isArray(row.attributes) && row.attributes.length > 0
          ? row.attributes.map(attr => ({
              name: normalizeText(attr.name) || '规格',
              value: normalizeText(attr.value) || '默认',
            }))
          : parseSpecAttributes(row.spec || '默认规格'),
    }
  })

  const colors =
    colorsEarly.length > 0
      ? colorsEarly
      : parsedSkuRows.length > 0
        ? Array.from(
            new Set(
              skuTable
                .map(sku => sku.attributes?.find(attr => attr.name === '颜色')?.value)
                .filter(Boolean) as string[],
            ),
          ).map(label => ({
            label,
            imageUrl:
              skuTable.find(sku => sku.attributes?.some(attr => attr.name === '颜色' && attr.value === label))
                ?.imageUrl || null,
          }))
        : []

  const sizesByColor: Record<string, string[]> = { ...sizesByColorEarly }
  if (Object.keys(sizesByColor).length === 0) {
    for (const sku of skuTable) {
      const color = sku.attributes?.find(attr => attr.name === '颜色')?.value
      const size = sku.attributes?.find(attr => attr.name === '尺码')?.value
      if (!color || !size) continue
      const list = sizesByColor[color] || []
      if (!list.includes(size)) list.push(size)
      sizesByColor[color] = list
    }
  }

  const specSummary: SpecSummaryJson[] =
    Array.isArray(fetched.specSummary) && fetched.specSummary.length > 0
      ? fetched.specSummary
      : [
          ...(colors.length ? [{ name: '颜色', values: colors.map(item => item.label) }] : []),
          ...(() => {
            const sizeValues = Array.from(
              new Set(
                [
                  ...Object.values(sizesByColor).flat(),
                  ...skuTable
                    .map(sku => sku.attributes?.find(attr => attr.name === '尺码')?.value)
                    .filter(Boolean),
                ].filter(Boolean) as string[],
              ),
            )
            return sizeValues.length ? [{ name: '尺码', values: sizeValues }] : []
          })(),
        ]
  if (specSummary.length === 0) {
    specSummary.push({ name: '规格', values: ['默认规格'] })
  }

  const skuPrices = skuTable
    .map(sku => toNumberOrNull(sku.price))
    .filter((value): value is number => value !== null)
  const resolvedFinalPriceMin = skuPrices.length ? Math.min(...skuPrices) : finalPriceMin
  const resolvedFinalPriceMax = skuPrices.length ? Math.max(...skuPrices) : finalPriceMax
  const resolvedUsdMin = roundCurrency(resolvedFinalPriceMin / exchangeRate)
  const resolvedUsdMax = roundCurrency(resolvedFinalPriceMax / exchangeRate)
  const totalStock = skuTable.reduce((sum, sku) => sum + (toNumberOrNull(sku.stock) ?? 0), 0)

  const previewData: PreviewDataJson = {
    name: productName,
    // 采集阶段不再翻译（改为上架时翻译并缓存），保证「传图」快速、逐条切换不卡
    categoryId: targetCategoryId || undefined,
    matchedCategoryIds: matchedSecondaryCategoryIds,
    matchedCategoryNames: matchedSecondaryCategoryNames,
    price: resolvedFinalPriceMin,
    mainImageUrl: mainImageUrl || undefined,
    detailImages,
    shortDescription: productDetail,
    featureAttributes: fetched.featureAttributes || [],
    colors,
    sizesByColor,
    ...(typeof params.importSortIndex === 'number' ? { importSortIndex: params.importSortIndex } : {}),
    inboundIdentity: {
      mode: 'LINK_PDD_INDEPENDENT',
      goodsId,
      sourceUrl,
    },
    skuTable,
  }

  await prisma.importtaskitem.update({
    where: { id: item.id },
    data: {
      parsedName: productName,
      supplierName: fetched.supplierName || null,
      mainImageUrl,
      parsedMainImageUrl: mainImageUrl,
      costPrice: toNumberOrNull(skuTable[0]?.costPrice) ?? costMin,
      weightGrams: toNumberOrNull(skuTable[0]?.weightGrams) ?? fallbackWeightGrams,
      sourceCategoryName: null,
      coefficient: resolvedCoefficient,
      goodsStatus: (task.defaultStatus || 'DRAFT') as any,
      productDetail,
      skuSummaryText: skuTable.map(sku => sku.spec).filter(Boolean).join(' | ') || '默认规格',
      cnyPriceMin: resolvedFinalPriceMin,
      cnyPriceMax: resolvedFinalPriceMax,
      usdPriceMin: resolvedUsdMin,
      usdPriceMax: resolvedUsdMax,
      minimumOrderQuantity: DEFAULT_MIN_ORDER_QTY,
      // B：OneBound/1688 真实库存优先，全 0 即缺货；缺省时回落 1000
      availableStock: resolveInitialStock(totalStock),
      targetCategoryId,
      parsedPriceMin: rawPriceMin,
      parsedPriceMax: rawPriceMax,
      specSummaryJson: specSummary as any,
      previewDataJson: previewData as any,
      fetchStatus: 'COMPLETED' as any,
      failureReason: null,
      fetchFinishedAt: new Date(),
    },
  })

  return { productName }
}

/**
 * 表格导入专用：严格按「产品编号」合并为 SPU。
 * 1688 链接导入禁止调用此函数。
 */
const groupTableImportRowsByProductCode = (rows: TableImportDraftRow[]) => {
  const groupedRows = new Map<string, TableImportDraftRow[]>()
  for (const row of rows) {
    const productCode = normalizeText(row.productCode)
    const list = groupedRows.get(productCode) || []
    list.push(row)
    groupedRows.set(productCode, list)
  }
  return groupedRows
}

const createProductRecord = async (tx: any, params: {
  categoryId: string
  name: string
  mainImageUrl: string
  galleryUrls?: string[]
  shortDescription: string
  price: number
  source: ProductCreationSourceType
  /** 1688 来源链接；写入 tradeInfoJson，避免依赖未迁移的 product.sourceUrl 列 */
  sourceUrl?: string | null
  status?: ProductStatusType
  stock?: number
  supplierName?: string | null
  costPrice?: number | null
  weightGrams?: number | null
  goodsStatus?: ProductStatusType | null
  detailText?: string | null
  parameterJson?: Array<{ group: string; items: Array<{ key: string; value: string }> }> | null
  priceCoefficient?: number | null
  minOrderQty?: number | null
  skuSummaryText?: string | null
  skus?: PendingImportSkuItem[]
  linkedCategoryIds?: string[]
  brandCategoryId?: string | null
  brandMatchKeyword?: string | null
  autoBrandMatched?: boolean
  /** 多语言标题等；优先存 EN/ES name 供前台切换 */
  translationsJson?: Record<string, unknown> | null
  nameEn?: string | null
  nameEs?: string | null
}) => {
  const categoryMeta = await resolveImportCategoryIdentifierMeta(tx, params.categoryId)
  const brandGuard = await tx.category.findUnique({
    where: { id: params.categoryId },
    select: {
      isBrandCategory: true,
      parent: { select: { name: true, isBrandCategory: true } },
    },
  })
  if (
    brandGuard?.isBrandCategory ||
    brandGuard?.parent?.isBrandCategory ||
    isBrandShelfParentName(brandGuard?.parent?.name)
  ) {
    throw new Error('品牌货架不能作为商品主类目，请选择手提包等真实一/二级类目')
  }
  // 重量自动识别：显式重量优先 → 标题/规格/详情正则提取 → 二级分类兜底 → 500g
  const weightSourceText = [
    params.name,
    params.skuSummaryText,
    params.detailText,
    ...((params.skus || []).map(s => s.spec_text).filter(Boolean) as string[]),
  ].filter(Boolean).join(' ')
  const effectiveWeightGrams = resolveProductWeightGrams({
    explicit: toNumberOrNull(params.weightGrams),
    text: weightSourceText,
    categoryNames: [categoryMeta.categoryName],
  })
  // 每次调用都生成新的独立 SPU 编号，不做标题/图片/产品编号合并
  const productCode = await generateStructuredSpuCode(tx, categoryMeta.shortCode)
  const draftSkus = Array.isArray(params.skus) && params.skus.length > 0
    ? params.skus
    : [{
        sku_key: 'sku-1',
        spec_text: params.skuSummaryText || '默认规格',
        cost_price: params.costPrice ?? null,
        price: params.price,
        weight_grams: effectiveWeightGrams,
        stock: params.stock ?? DEFAULT_AVAILABLE_STOCK,
        image_url: null,
        attributes: params.skuSummaryText
          ? [{ name: '来源SKU', value: params.skuSummaryText }]
          : [{ name: '规格', value: '默认规格' }]
      }]

  const galleryUrls = dedupeImageUrls([
    params.mainImageUrl,
    ...((params.galleryUrls || []).filter(Boolean)),
  ].filter(Boolean))

  const translationsJson =
    params.translationsJson ||
    buildProductTranslationsJson({
      nameZh: params.name,
      nameEn: params.nameEn,
      nameEs: params.nameEs,
      shortDescriptionZh: params.shortDescription,
    })

  const product = await tx.product.create({
    data: {
      categoryId: params.categoryId,
      name: params.name,
      slug: productCode.toLowerCase(),
      productCode,
      source: params.source as any,
      status: (params.status || 'DRAFT') as any,
      // New / 每月上新：上架即写入 publishedAt，供前台按月归类
      publishedAt: (params.status || 'DRAFT') === 'ACTIVE' ? new Date() : null,
      isNewArrival: (params.status || 'DRAFT') === 'ACTIVE',
      supplierName: params.supplierName || null,
      goodsStatus: (params.goodsStatus && params.goodsStatus !== 'DRAFT' ? params.goodsStatus : undefined) as any,
      brandCategoryId: params.brandCategoryId || null,
      brandMatchKeyword: params.brandMatchKeyword || null,
      autoBrandMatched: !!params.autoBrandMatched,
      weightGram: effectiveWeightGrams,
      costPrice: params.costPrice ?? null,
      priceCoefficient: params.priceCoefficient ?? null,
      detailText: params.detailText || null,
      parameterJson: (params.parameterJson as any) || undefined,
      mainImageUrl: params.mainImageUrl,
      galleryJson: galleryUrls.map((url, index) => ({ url, sort: index + 1 })),
      shortDescription: params.shortDescription,
      translationsJson: translationsJson as any,
      tradeInfoJson: {
        minOrderQty: resolveInitialMinOrderQty(params.minOrderQty),
        ...(params.sourceUrl ? { importSourceUrl: params.sourceUrl } : {}),
        ...(params.source === 'IMPORT_1688' && params.sourceUrl
          ? { offerId: extract1688OfferId(params.sourceUrl) }
          : {}),
      },
      skus: {
        create: (() => {
          const usedSkuCodes = new Set<string>()
          return draftSkus.map((sku, index) => {
            const skuPrice = toNumberOrNull(sku.price) ?? params.price
            const skuStock = resolveInitialStock(
              toNumberOrNull(sku.stock) ?? params.stock,
            )
            const skuWeightGrams = toNumberOrNull(sku.weight_grams) ?? effectiveWeightGrams
            const sizeLabel =
              sku.attributes?.find(attr => isSizeDimensionName(attr.name))?.value || null
            const materialLabel =
              sku.attributes?.find(attr => /^(材质|材料|material)$/i.test(normalizeText(attr.name)))?.value || null
            const { specValue, colorValue } = buildImportSkuSegments(sku, index)
            // Always include 1-based sequence so color×size grids (esp. Chinese labels) never collide.
            // Extra random suffix only if the code is somehow already taken in this batch.
            let skuCode = buildSkuIdentifier(productCode, specValue, colorValue, index)
            if (usedSkuCodes.has(skuCode)) {
              skuCode = `${skuCode}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
            }
            usedSkuCodes.add(skuCode)
            return {
              skuCode,
              imageUrl: sku.image_url || null,
              minOrderQty: resolveInitialMinOrderQty(params.minOrderQty),
              price: skuPrice,
              stock: skuStock,
              stockStatus: skuStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
              weightKg: skuWeightGrams != null ? Number((skuWeightGrams / 1000).toFixed(3)) : null,
              sizeLabel: sizeLabel ? normalizeText(sizeLabel) : null,
              materialLabel: materialLabel ? normalizeText(materialLabel) : null,
              attributeJson: sku.attributes?.length
                ? sku.attributes
                : [{ name: '规格', value: sku.spec_text || `规格${index + 1}` }]
            }
          })
        })()
      }
    }
  })

  const linkedCategoryIds = Array.from(new Set((params.linkedCategoryIds || []).filter(Boolean)))
  if (linkedCategoryIds.length > 0) {
    await tx.product_category_relations.createMany({
      data: linkedCategoryIds.map(categoryId => ({ productId: product.id, categoryId })),
      skipDuplicates: true
    })
  }

  // Append price-threshold L2 tags by existing category name; never changes primary categoryId.
  await syncProductPriceThresholdRelations(tx, product.id)

  return product
}

export type AutoMatchedSecondaryCategory = {
  id: string
  name: string
  /** 分类管理「品牌关键词」；可命中关联，但不作为导入定价目标类目 */
  keywords: string[]
  /** 1=一级大类（Bags/Jewelry…），2=二级；匹配时优先二级做主类目 */
  level?: number | null
  /** 一级父类名称；parent 为 Brand 时仅作货架标签，不参与售价系数 */
  parentName?: string | null
  /** DB isBrandCategory — Brand 货架 L2，不得当作主类目/定价类目 */
  isBrandCategory?: boolean
}

export const normalizeCategoryMatchText = (value?: string | null) =>
  canonicalizeQualityMatchText(
    String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ''),
  )

/** 「无品牌」兜底货架：不得与真实品牌（Chanel/LV…）抢标题命中，也不应在已命中品牌时残留为标签 */
export const isNoBrandCatchAllCategoryName = (name?: string | null) => {
  const n = normalizeCategoryMatchText(name)
  if (!n) return false
  return (
    n === 'NOBRAND' ||
    n === 'NOBRANDS' ||
    n === 'UNBRANDED' ||
    n === 'OTHER' ||
    n === 'OTHERS' ||
    n === 'OTHERBRAND' ||
    n === 'OTHERBRANDS' ||
    n === '无品牌' ||
    n === '其他品牌' ||
    n === '其它品牌'
  )
}

/**
 * 大小写不敏感；去空格后做包含匹配。
 * 极短词（≤2）要求左右非字母数字邻居，避免 LV 误伤 SALVATION。
 * 注意：该边界规则仅对「纯 ASCII 短词」(LV/CK 等) 生效；中文短词（如「耳钉/戒指」）
 * 直接按包含匹配——否则「耳钉 high quality jewelry」去空格后变「耳钉HIGH…」，
 * 「耳钉」右邻字母 H 会被误判为不匹配（中文品类词 + 英文后缀的标题全被漏掉）。
 */
export const containsCategoryMatchToken = (text: string, token: string) => {
  const normalizedText = normalizeCategoryMatchText(text)
  const normalizedToken = normalizeCategoryMatchText(token)
  if (!normalizedText || !normalizedToken) return false
  if (!normalizedText.includes(normalizedToken)) return false

  // 品质/材质/below* 后缀：允许粘在货号后（3313normal quality）或后面再跟 jewelry
  if (isGluedFilterSuffixToken(normalizedToken)) return true

  // 纯 ASCII 品牌词（Chanel/Gucci/LV…）：要求左右非字母邻居。
  // 标题常见「Chanel【钛钢】」「Chanel钛钢」「chanel 欧美」——品牌后直接接中文/符号仍算命中；
  // 「2026 Gucci / 2026loewe」去空格后变 2026GUCCI——年份数字紧挨品牌也要算命中；
  // 「Gucci2025 / Miumiu25 / Chanel2026」——品牌后紧跟年份/货号数字也要算命中；
  // 但要避免短词误伤（LV⊂SALVATION）以及长词嵌在英文单词内部。
  const isAsciiToken = /^[A-Z0-9]+$/.test(normalizedToken)
  if (isAsciiToken) {
    let from = 0
    while (from < normalizedText.length) {
      const idx = normalizedText.indexOf(normalizedToken, from)
      if (idx < 0) return false
      const before = idx === 0 ? '' : normalizedText[idx - 1]
      const afterIdx = idx + normalizedToken.length
      const after = afterIdx >= normalizedText.length ? '' : normalizedText[afterIdx]
      const beforeOk =
        !before ||
        !/[A-Z0-9]/.test(before) ||
        // 年份前缀：2026GUCCI / 2026LOEWE
        /[0-9]/.test(before)
      const afterOk =
        !after ||
        !/[A-Z0-9]/.test(after) ||
        // 年份/货号后缀：Gucci2025 / Miumiu25 / Chanel2026
        /[0-9]/.test(after)
      if (beforeOk && afterOk) return true
      from = idx + 1
    }
    return false
  }

  return true
}

const parseCategoryBrandKeywords = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return []
  return Array.from(
    new Set(
      raw
        .map(item => {
          if (typeof item === 'string') return item.trim()
          if (item && typeof item === 'object' && 'keyword' in item) {
            return String((item as { keyword?: unknown }).keyword ?? '').trim()
          }
          return ''
        })
        .filter(Boolean),
    ),
  )
}

/** 拼接标题 + 详情文案，供 L2 类目名 / 品牌关键词自动命中 */
export const buildCategoryMatchCorpus = (...parts: Array<string | null | undefined>) =>
  parts
    .map(part => String(part || '').trim())
    .filter(Boolean)
    .join('\n')

export async function loadAutoMatchSecondaryCategories(tx: any): Promise<AutoMatchedSecondaryCategory[]> {
  // 同时加载 ACTIVE 一级（Bags/Jewelry…）与二级：
  // 标题「手提斜挎包」若只命中一级 Bags，也能勾上一级，不再只剩 Brand。
  const categories = await tx.category.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { level: 2 },
        { level: 1, isBrandCategory: false },
      ],
    },
    select: {
      id: true,
      name: true,
      level: true,
      brandKeywordsJson: true,
      isBrandCategory: true,
      parent: { select: { name: true, isBrandCategory: true } },
    },
    orderBy: [
      { sortWeight: 'desc' },
      { name: 'asc' }
    ]
  })

  return categories
    .map((category: {
      id: string
      name: string
      level?: number | null
      brandKeywordsJson?: unknown
      isBrandCategory?: boolean | null
      parent?: { name?: string | null; isBrandCategory?: boolean | null } | null
    }) => {
      const name = String(category.name || '').trim()
      const parentName = category.parent?.name ? String(category.parent.name).trim() : null
      // 只用本类目同义词，不要继承父级 Bags 词——否则 Handbag/Backpack/wallet 会同时命中「包」
      const keywords = Array.from(
        new Set([
          ...parseCategoryBrandKeywords(category.brandKeywordsJson).filter((token) => {
            const n = normalizeCategoryMatchText(token)
            return n.length >= 2 && !['包', '袋', 'BAG', 'BAGS', '收纳', '收纳包', '卡包', '卡夹'].includes(n)
          }),
          ...resolveCategorySynonyms(name),
        ]),
      )
      return {
        id: category.id,
        name,
        keywords,
        level: category.level ?? null,
        parentName,
        isBrandCategory: Boolean(category.isBrandCategory || category.parent?.isBrandCategory),
      }
    })
    .filter((category: AutoMatchedSecondaryCategory) => category.name)
}

const isBrandParentSecondaryCategory = (category: AutoMatchedSecondaryCategory) => {
  if (isNoBrandCatchAllCategoryName(category.name)) return false
  if (category.isBrandCategory) return true
  return isBrandShelfParentName(category.parentName)
}

/**
 * 从标题/详情里挑最佳 Brand 货架 L2（Chanel/LV…）。
 * 专门扫品牌货架，避免被 Necklace 等品类命中挤掉；并排除 No Brand 兜底。
 */
export function pickBestBrandCategoryFromTitle(
  title: string,
  categories: AutoMatchedSecondaryCategory[],
  detailText?: string | null,
): AutoMatchedSecondaryCategory | null {
  const corpus = buildCategoryMatchCorpus(title, detailText)
  if (!corpus) return null

  const scored = categories
    .filter((category) => isBrandParentSecondaryCategory(category))
    .map((category) => {
      const tokens = [category.name, ...category.keywords]
        .map((token) => String(token || '').trim())
        .filter(Boolean)
      const matchedTokens = tokens.filter((token) => containsCategoryMatchToken(corpus, token))
      if (!matchedTokens.length) return null
      const bestTokenLength = Math.max(
        ...matchedTokens.map((token) => normalizeCategoryMatchText(token).length),
      )
      return { category, bestTokenLength }
    })
    .filter(
      (item): item is { category: AutoMatchedSecondaryCategory; bestTokenLength: number } =>
        Boolean(item),
    )

  scored.sort(
    (a, b) =>
      b.bestTokenLength - a.bestTokenLength ||
      a.category.name.localeCompare(b.category.name, 'zh-CN'),
  )
  return scored[0]?.category || null
}

/** 已命中真实品牌时，从关联类目里剔除 No Brand 兜底，避免列表标签误显示 */
export async function pruneNoBrandCatchAllLinks(
  tx: any,
  linkedCategoryIds: string[],
  options?: { keepWhenNoRealBrand?: boolean; hasRealBrand?: boolean },
): Promise<string[]> {
  const ids = Array.from(new Set((linkedCategoryIds || []).filter(Boolean)))
  if (!ids.length) return []
  const hasRealBrand = options?.hasRealBrand === true
  if (!hasRealBrand && options?.keepWhenNoRealBrand !== false) {
    // 无真实品牌时允许保留 No Brand
    return ids
  }
  if (!hasRealBrand) return ids

  const rows = await tx.category.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  })
  const drop = new Set(
    rows.filter((row: { name?: string | null }) => isNoBrandCatchAllCategoryName(row.name)).map(
      (row: { id: string }) => row.id,
    ),
  )
  return ids.filter((id) => !drop.has(id))
}

/** Brand 货架（自身或父级）永远不能当主类目 / 定价类目 */
const isBrandShelfCategoryId = (
  categoryId: string | null | undefined,
  categoryMap: Map<string, ImportPricingCategoryMeta>,
  secondaryById?: Map<string, AutoMatchedSecondaryCategory>,
): boolean => {
  const id = String(categoryId || '').trim()
  if (!id) return false
  const fromAuto = secondaryById?.get(id)
  if (fromAuto && isBrandParentSecondaryCategory(fromAuto)) return true
  const meta = categoryMap.get(id)
  if (!meta) return false
  if (meta.isBrandCategory) return true
  const parent = meta.parentId ? categoryMap.get(meta.parentId) : null
  if (parent?.isBrandCategory) return true
  return isBrandShelfParentName(parent?.name)
}

/**
 * 从候选里挑主类目：只接受真实一/二级商品类目，跳过全部 Brand 货架。
 * 顺序即优先级（运营手选 > 任务默认 > 自动命中的 Handbag 等）。
 */
const pickFirstNonBrandCategoryId = (
  candidates: Array<string | null | undefined>,
  categoryMap: Map<string, ImportPricingCategoryMeta>,
  secondaryById?: Map<string, AutoMatchedSecondaryCategory>,
): string | null => {
  for (const raw of candidates) {
    const id = String(raw || '').trim()
    if (!id) continue
    if (isBrandShelfCategoryId(id, categoryMap, secondaryById)) continue
    return id
  }
  return null
}

/**
 * 过泛词：不能单独用来判定二级类目（详情里随处可见「包/收纳」）。
 * 一级 Bags 仍可通过更长同义词命中。
 */
const GENERIC_CATEGORY_MATCH_TOKENS = new Set(
  [
    '包',
    '袋',
    '鞋',
    '饰',
    'bag',
    'bags',
    'set',
    '套装',
    '收纳',
    '收纳包',
    '卡包',
    '卡夹',
    '包挂',
    '挂饰',
  ].map((token) => normalizeCategoryMatchText(token)),
)

const isUsableCategoryMatchToken = (token: string, options?: { allowGeneric?: boolean }) => {
  const normalized = normalizeCategoryMatchText(token)
  if (!normalized) return false
  if (normalized.length < 2) return false
  if (!options?.allowGeneric && GENERIC_CATEGORY_MATCH_TOKENS.has(normalized)) return false
  return true
}

/**
 * 按标题/详情是否包含二级类目名或其品牌关键词进行匹配（大小写不敏感）。
 * 多命中时：真实一级/二级商品类目优先于 Brand 货架；同档再按「最长命中词」降序。
 * 主分类（定价用）应取第一项非 Brand / 非材质筛选命中，见 pickImportPricingTargetCategory。
 *
 * 品类收敛规则（避免 wallet/化妆包/Handbag 一堆乱绑）：
 * - 商品二级类目默认只看标题，不用详情（详情常写「可放钱包/化妆包」）
 * - 材质/品质筛选类目（Stainless steel、high quality…）不参与品类打分，避免压过「项链」
 * - 同一一级下多个二级近分 → 只保留该一级
 * - 不同一级下仍残留多个二级 → 只保留全局最长命中的那一个（及其一级由 expand 补上）
 * - Brand 货架仍只保留最佳品牌命中
 */
export function matchSecondaryCategoriesByTitle(
  title: string,
  categories: AutoMatchedSecondaryCategory[],
  detailText?: string | null,
): AutoMatchedSecondaryCategory[] {
  const titleCorpus = buildCategoryMatchCorpus(title)
  const brandCorpus = buildCategoryMatchCorpus(title, detailText)
  if (!titleCorpus && !brandCorpus) return []

  const scoreCategory = (
    category: AutoMatchedSecondaryCategory,
    corpus: string,
    options?: { allowGeneric?: boolean },
  ) => {
    if (!corpus) return null
    const allowGeneric = options?.allowGeneric || (category.level || 0) === 1
    const tokens = [category.name, ...category.keywords]
      .map((token) => String(token || '').trim())
      .filter((token) => isUsableCategoryMatchToken(token, { allowGeneric }))
    const matchedTokens = tokens.filter((token) => containsCategoryMatchToken(corpus, token))
    if (!matchedTokens.length) return null
    const bestTokenLength = Math.max(
      ...matchedTokens.map((token) => normalizeCategoryMatchText(token).length),
    )
    return { category, bestTokenLength }
  }

  const isAttrCategory = (category: AutoMatchedSecondaryCategory) =>
    isAttributeOrFilterCategory({ name: category.name, parentName: category.parentName })

  const productScored = categories
    .filter((category) => !isBrandParentSecondaryCategory(category) && !isAttrCategory(category))
    .map((category) => scoreCategory(category, titleCorpus, { allowGeneric: (category.level || 0) === 1 }))
    .filter(
      (item): item is { category: AutoMatchedSecondaryCategory; bestTokenLength: number } =>
        Boolean(item),
    )

  // 材质/品质类目仍可挂关联标签，但不参与「最长命中」抢主类目
  const attrScored = categories
    .filter((category) => !isBrandParentSecondaryCategory(category) && isAttrCategory(category))
    .map((category) => scoreCategory(category, titleCorpus, { allowGeneric: false }))
    .filter(
      (item): item is { category: AutoMatchedSecondaryCategory; bestTokenLength: number } =>
        Boolean(item),
    )

  const brandScored = categories
    .filter((category) => isBrandParentSecondaryCategory(category))
    .map((category) => scoreCategory(category, brandCorpus, { allowGeneric: false }))
    .filter(
      (item): item is { category: AutoMatchedSecondaryCategory; bestTokenLength: number } =>
        Boolean(item),
    )

  productScored.sort(
    (a, b) =>
      (b.category.level || 0) - (a.category.level || 0) ||
      b.bestTokenLength - a.bestTokenLength ||
      a.category.name.localeCompare(b.category.name, 'zh-CN'),
  )
  brandScored.sort(
    (a, b) =>
      b.bestTokenLength - a.bestTokenLength ||
      a.category.name.localeCompare(b.category.name, 'zh-CN'),
  )

  const l1ByName = new Map<string, AutoMatchedSecondaryCategory>()
  for (const item of productScored) {
    if ((item.category.level || 0) === 1) {
      l1ByName.set(normalizeCategoryMatchText(item.category.name), item.category)
    }
  }
  for (const category of categories) {
    if ((category.level || 0) === 1 && !isBrandParentSecondaryCategory(category) && !isAttrCategory(category)) {
      const key = normalizeCategoryMatchText(category.name)
      if (!l1ByName.has(key)) l1ByName.set(key, category)
    }
  }

  const l2Scored = productScored.filter((item) => (item.category.level || 2) >= 2)
  const refinedProduct: AutoMatchedSecondaryCategory[] = []
  const refinedL2WithScore: Array<{ category: AutoMatchedSecondaryCategory; bestTokenLength: number }> = []
  const groups = new Map<string, typeof l2Scored>()
  for (const item of l2Scored) {
    const parentKey = normalizeCategoryMatchText(item.category.parentName) || `self:${item.category.id}`
    const bucket = groups.get(parentKey) || []
    bucket.push(item)
    groups.set(parentKey, bucket)
  }

  if (groups.size > 0) {
    for (const [parentKey, group] of groups) {
      group.sort(
        (a, b) =>
          b.bestTokenLength - a.bestTokenLength ||
          a.category.name.localeCompare(b.category.name, 'zh-CN'),
      )
      const best = group[0]
      const ambiguous = group.filter(
        (item) =>
          item.category.id !== best.category.id &&
          item.bestTokenLength >= Math.max(1, best.bestTokenLength - 1),
      )
      if (ambiguous.length > 0 || (group.length > 1 && group[1].bestTokenLength === best.bestTokenLength)) {
        const l1 = l1ByName.get(parentKey)
        if (l1) refinedProduct.push(l1)
        continue
      }
      refinedL2WithScore.push(best)
    }

    // 跨一级仍可能同时留下 wallet + Handbag：只留全局最长命中的一个二级
    if (refinedL2WithScore.length > 1) {
      refinedL2WithScore.sort(
        (a, b) =>
          b.bestTokenLength - a.bestTokenLength ||
          a.category.name.localeCompare(b.category.name, 'zh-CN'),
      )
      const winner = refinedL2WithScore[0]
      const nearTies = refinedL2WithScore.filter(
        (item) =>
          item.category.id !== winner.category.id &&
          item.bestTokenLength >= Math.max(1, winner.bestTokenLength - 1),
      )
      if (nearTies.length > 0) {
        const parentKey = normalizeCategoryMatchText(winner.category.parentName)
        const l1 = parentKey ? l1ByName.get(parentKey) : null
        if (l1) refinedProduct.push(l1)
      } else {
        refinedProduct.push(winner.category)
      }
    } else if (refinedL2WithScore.length === 1) {
      refinedProduct.push(refinedL2WithScore[0].category)
    }
  } else {
    for (const item of productScored) {
      if ((item.category.level || 0) === 1) refinedProduct.push(item.category)
    }
  }

  const bestBrand = brandScored[0]?.category
  if (bestBrand) refinedProduct.push(bestBrand)

  const productFamily =
    detectShelfFamily(title) !== 'unknown'
      ? detectShelfFamily(title)
      : detectShelfFamily(
          ...refinedProduct.map((category) => `${category.name} ${category.parentName || ''}`),
        )

  // 材质/品质：仅作关联标签挂上，不抢主类目；包不得挂饰品品质货架
  for (const item of attrScored) {
    const tagFamily = detectShelfFamily(item.category.name, item.category.parentName)
    if (!shelfFamiliesCompatible(productFamily, tagFamily)) continue
    if (!refinedProduct.some((c) => c.id === item.category.id)) {
      refinedProduct.push(item.category)
    }
  }

  return refinedProduct
}

/** Import pricing / 待上传目标分类：优先真实二级，其次一级；不用 Brand / 材质筛选。 */
export function pickImportPricingTargetCategory(
  matched: AutoMatchedSecondaryCategory[],
  fallbackId?: string | null,
): string | null {
  const productType = matched.filter((category) =>
    isProductTypeCategory({
      name: category.name,
      parentName: category.parentName,
      isBrandCategory: category.isBrandCategory,
      level: category.level,
    }),
  )
  const pricingHit =
    productType.find((category) => (category.level || 2) >= 2) ||
    productType.find((category) => (category.level || 0) === 1) ||
    null
  if (pricingHit?.id) return pricingHit.id
  const fallback = String(fallbackId || '').trim()
  if (!fallback) return null
  // 若 fallback 本身就是 Brand / 材质命中，直接丢弃
  const fallbackAsHit = matched.find((category) => category.id === fallback)
  if (fallbackAsHit && !isProductTypeCategory({
    name: fallbackAsHit.name,
    parentName: fallbackAsHit.parentName,
    isBrandCategory: fallbackAsHit.isBrandCategory,
    level: fallbackAsHit.level,
  })) {
    return null
  }
  return fallback
}

/**
 * 表格「类目」列路径解析：首段=一级、次段=二级（如 Bag, Handbag / Bags, Handbags）。
 * 不参与品牌列；匹配系统分类时跳过 isBrandCategory。
 */
export const splitTableCategoryPathTokens = (raw?: string | null): string[] =>
  normalizeText(raw)
    .split(/[,，/|；;]+/)
    .map(token => token.trim())
    .filter(Boolean)

const categoryNameFuzzyMatch = (dbName: string, token: string) => {
  const a = normalizeCategoryMatchText(dbName)
  const b = normalizeCategoryMatchText(token)
  if (!a || !b) return false
  if (a === b) return true
  // No Brand ↔ Brand：禁止 includes 互相误伤（NOBRAND 包含 BRAND）
  if (isNoBrandCatchAllCategoryName(dbName) || isNoBrandCatchAllCategoryName(token)) {
    return false
  }
  // Bag ↔ Bags, Handbag ↔ Handbags
  if (a.endsWith('S') && a.slice(0, -1) === b) return true
  if (b.endsWith('S') && b.slice(0, -1) === a) return true
  // 长类目名包含短词（handbag ⊂ handbags 已在上面；也可 Bags 含子类时宽松包含）
  if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return true
  return false
}

/** 表格「帽子」必须能对上英文货架 Hats（含同义词，不只比库里的英文名） */
const categoryCellMatchesCategory = (dbName: string, token: string) => {
  if (categoryNameFuzzyMatch(dbName, token)) return true
  const tokenNorm = normalizeCategoryMatchText(token)
  if (!tokenNorm) return false
  if (resolveCategorySynonyms(dbName).some((syn) => normalizeCategoryMatchText(syn) === tokenNorm)) {
    return true
  }
  const dbNorm = normalizeCategoryMatchText(dbName)
  return resolveCategorySynonyms(token).some((syn) => normalizeCategoryMatchText(syn) === dbNorm)
}

type TableImportCategoryRow = {
  id: string
  name: string
  parentId: string | null
  level: number | null
  priceCoefficient: unknown
  isBrandCategory?: boolean | null
}

export function resolveTableImportCategoryPath(
  categoryCell: string | null | undefined,
  categories: TableImportCategoryRow[],
): {
  l1Token: string | null
  l2Token: string | null
  primaryId: string | null
  secondaryId: string | null
  targetCategoryId: string | null
  sourceCategoryLabel: string | null
  matchedCategory: TableImportCategoryRow | null
  parentCategory: TableImportCategoryRow | null
} {
  const tokens = splitTableCategoryPathTokens(categoryCell)
  const empty = {
    l1Token: null as string | null,
    l2Token: null as string | null,
    primaryId: null as string | null,
    secondaryId: null as string | null,
    targetCategoryId: null as string | null,
    sourceCategoryLabel: null as string | null,
    matchedCategory: null as TableImportCategoryRow | null,
    parentCategory: null as TableImportCategoryRow | null,
  }
  if (!tokens.length) return empty

  const l1Token = tokens[0] || null
  const l2Token = tokens[1] || null
  const usable = categories.filter(c => !c.isBrandCategory)

  const levelOf = (c: TableImportCategoryRow) => {
    if (c.level != null && Number.isFinite(Number(c.level))) return Number(c.level)
    return c.parentId ? 2 : 1
  }

  const level1 = usable.filter(c => levelOf(c) === 1)
  const level2 = usable.filter(c => levelOf(c) === 2)

  const matchPrimary =
    (l1Token
      ? level1.find(c => categoryCellMatchesCategory(c.name, l1Token)) ||
        usable.find(c => categoryCellMatchesCategory(c.name, l1Token) && levelOf(c) === 1) ||
        level2.find(c => categoryCellMatchesCategory(c.name, l1Token))
      : null) || null

  let matchSecondary: TableImportCategoryRow | null = null
  if (l2Token) {
    const underPrimary = matchPrimary
      ? level2.filter(c => c.parentId === matchPrimary.id)
      : level2
    matchSecondary =
      underPrimary.find(c => categoryCellMatchesCategory(c.name, l2Token)) ||
      level2.find(c => categoryCellMatchesCategory(c.name, l2Token)) ||
      null
  } else if (matchPrimary && levelOf(matchPrimary) === 2) {
    matchSecondary = matchPrimary
  }

  // 仅写了一级时，也可把 L2 写成与一级同名的误填，回退一级
  const target = matchSecondary || matchPrimary || null
  const parent =
    target?.parentId
      ? usable.find(c => c.id === target.parentId) || null
      : null

  const labelParts = [l1Token, l2Token].filter(Boolean) as string[]
  return {
    l1Token,
    l2Token,
    primaryId: matchPrimary?.id || parent?.id || null,
    secondaryId: matchSecondary?.id || null,
    targetCategoryId: target?.id || null,
    sourceCategoryLabel: labelParts.length ? labelParts.join(', ') : null,
    matchedCategory: target,
    parentCategory: parent || matchPrimary,
  }
}

// ===== Actions =====

export const getCategoryOptions = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<CategoryOption[]> => {
    const categories = await prisma.category.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, parentId: true, level: true },
      orderBy: [{ level: 'asc' }, { sortWeight: 'desc' }, { name: 'asc' }]
    })

    const nameById = new Map(categories.map(c => [c.id, c.name]))

    return categories.map(c => ({
        category_id: c.id,
      category_name: c.name,
      parent_id: c.parentId,
      level: c.level,
      parent_name: c.parentId ? (nameById.get(c.parentId) || null) : null
      }))
  })
)

export const getImportTaskList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetImportTaskListInput): Promise<GetImportTaskListOutput> => {
    const page = input.page && input.page > 0 ? input.page : 1
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20
    const skip = (page - 1) * pageSize

    const where = {
      ...(input.status ? { status: input.status as any } : {})
    }

    const [total, tasks] = await Promise.all([
      prisma.importtask.count({ where }),
      prisma.importtask.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      total,
      list: tasks.map(mapTask)
    }
  })
)

export const getImportTaskDetail = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetImportTaskDetailInput): Promise<GetImportTaskDetailOutput> => {
    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!task) {
      throw new Error('未找到该导入任务')
    }

    return {
      task: mapTask(task),
      items: task.items.map(mapTaskItem)
    }
  })
)

/** Queue list is a hot path — full charset/mock sweeps at most once per 10 minutes. */
let lastPendingQueueMaintenanceAt = 0
const PENDING_QUEUE_MAINTENANCE_INTERVAL_MS = 10 * 60 * 1000
/** Price repair used to run on every pending-tab poll and scanned all rows — OOM flap. */
let lastPendingPriceRepairAt = 0
const PENDING_PRICE_REPAIR_INTERVAL_MS = 10 * 60 * 1000

/** In-process mutex: only one 1688/PDD parse job (startParseTask or reparse) at a time. */
let parseJobBusy = false
let parseJobLabel: string | null = null
/** Cooperative cancel — background loops check between items. */
let parseJobCancelRequested = false
/** Live progress for admin UI (survives page refresh via getPendingImportQueue). */
let parseJobProgress: { total: number; done: number } | null = null

const acquireParseJob = (label: string, total = 0) => {
  if (parseJobBusy) {
    throw new Error(
      parseJobLabel
        ? `已有解析任务进行中（${parseJobLabel}），请等待完成后再试`
        : '已有解析任务进行中，请等待完成后再试',
    )
  }
  parseJobBusy = true
  parseJobLabel = label
  parseJobCancelRequested = false
  parseJobProgress = { total: Math.max(0, total), done: 0 }
}

const releaseParseJob = (label: string) => {
  if (parseJobLabel === label || !parseJobLabel) {
    parseJobBusy = false
    parseJobLabel = null
    parseJobCancelRequested = false
    parseJobProgress = null
  }
}

const isParseJobCancelled = () => parseJobCancelRequested

const bumpParseJobProgress = (done: number, total?: number) => {
  if (!parseJobProgress) return
  parseJobProgress = {
    total: typeof total === 'number' ? total : parseJobProgress.total,
    done: Math.max(0, done),
  }
}

const requestCancelParseJob = () => {
  parseJobCancelRequested = true
  parseJobBusy = false
  parseJobLabel = null
  parseJobProgress = null
}

export interface PendingImportParseJobStatus {
  busy: boolean
  label: string | null
  total: number
  done: number
  cancel_requested: boolean
}

export const getParseJobRuntimeStatus = (): PendingImportParseJobStatus => ({
  busy: parseJobBusy,
  label: parseJobLabel,
  total: parseJobProgress?.total ?? 0,
  done: parseJobProgress?.done ?? 0,
  cancel_requested: parseJobCancelRequested,
})

export interface CancelPendingImportParseJobOutput {
  cancelled: boolean
  task_count: number
  item_count: number
  message: string
}

/** Stop collect/reparse: mark RUNNING rows retryable and signal in-process loops to exit. */
export const cancelPendingImportParseJob = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<CancelPendingImportParseJobOutput> => {
    requestCancelParseJob()

    const tasks = await prisma.importtask.updateMany({
      where: {
        status: { in: ['PENDING', 'RUNNING', 'RATE_LIMITED'] as any },
      },
      data: {
        status: 'RETRY_PENDING' as any,
        finishedAt: new Date(),
      },
    })

    const items = await prisma.importtaskitem.updateMany({
      where: {
        fetchStatus: 'RUNNING' as any,
        isPublished: false,
      },
      data: {
        fetchStatus: 'RETRY_PENDING' as any,
        failureReason: '用户终止解析',
        fetchFinishedAt: new Date(),
      },
    })

    return {
      cancelled: true,
      task_count: tasks.count,
      item_count: items.count,
      message: `已终止解析（任务 ${tasks.count}，条目 ${items.count}）`,
    }
  }),
)

export const getPendingImportQueue = requireRole([UserRole.ADMIN])(
  withResult(async (input?: GetPendingImportQueueInput): Promise<GetPendingImportQueueOutput> => {
    const page = Math.max(1, Number(input?.page) || 1)
    const pageSize = Math.min(
      MAX_PENDING_QUEUE_PAGE_SIZE,
      Math.max(1, Number(input?.page_size) || DEFAULT_PENDING_QUEUE_PAGE_SIZE),
    )
    const skipMaintenance = Boolean(input?.skip_maintenance)

    try {
      await prisma.$executeRawUnsafe('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')
    } catch (error) {
      console.error('[getPendingImportQueue] failed to set utf8mb4 session charset', error)
    }

    // Always reclaim hung RUNNING jobs — even when skip_maintenance is true.
    // The admin UI always passes skip_maintenance, so parking this behind maintenance
    // left "采集中" stuck for hours and blocked reparse via the in-process mutex.
    try {
      const itemStuckBefore = new Date(Date.now() - 10 * 60 * 1000)
      const taskStuckBefore = new Date(Date.now() - 20 * 60 * 1000)

      // Zombie: finishedAt already set but status still RUNNING (crash mid-finalize).
      const zombieTasks = await prisma.importtask.updateMany({
        where: {
          status: 'RUNNING' as any,
          finishedAt: { not: null },
        },
        data: {
          status: 'RETRY_PENDING' as any,
        },
      })

      const stuckItems = await prisma.importtaskitem.updateMany({
        where: {
          fetchStatus: 'RUNNING' as any,
          OR: [
            { fetchStartedAt: { lt: itemStuckBefore } },
            { fetchStartedAt: null, updatedAt: { lt: itemStuckBefore } },
          ],
        },
        data: {
          fetchStatus: 'RETRY_PENDING' as any,
          failureReason: '解析超时中断，请重新解析',
          fetchFinishedAt: new Date(),
        },
      })
      const stuckTasks = await prisma.importtask.updateMany({
        where: {
          status: 'RUNNING' as any,
          startedAt: { lt: taskStuckBefore },
        },
        data: {
          status: 'RETRY_PENDING' as any,
          finishedAt: new Date(),
        },
      })
      if (zombieTasks.count > 0 || stuckItems.count > 0 || stuckTasks.count > 0) {
        console.info(
          `[getPendingImportQueue] reclaimed stuck RUNNING zombieTasks=${zombieTasks.count} items=${stuckItems.count} tasks=${stuckTasks.count}`,
        )
        parseJobBusy = false
        parseJobLabel = null
        parseJobCancelRequested = false
        parseJobProgress = null
      }
    } catch (error) {
      console.error('[getPendingImportQueue] failed to reclaim stuck RUNNING parse jobs', error)
    }

    // 系数已写入但售价仍=成本：限频 + 限量扫描（admin UI 每 3s 轮询时不能全表扫）
    const duePriceRepair = Date.now() - lastPendingPriceRepairAt >= PENDING_PRICE_REPAIR_INTERVAL_MS
    if (duePriceRepair) {
      lastPendingPriceRepairAt = Date.now()
      try {
        const repairedPriceCount = await repairPendingImportPricesMissingCoefficient({
          maxScan: 300,
          maxUpdate: 40,
        })
        if (repairedPriceCount > 0) {
          console.info(
            `[getPendingImportQueue] repaired ${repairedPriceCount} pending items with sell price stuck at cost`,
          )
        }
      } catch (error) {
        console.error('[getPendingImportQueue] failed to repair pending sell prices', error)
      }
    }

    const dueMaintenance =
      !skipMaintenance &&
      Date.now() - lastPendingQueueMaintenanceAt >= PENDING_QUEUE_MAINTENANCE_INTERVAL_MS

    if (dueMaintenance) {
      lastPendingQueueMaintenanceAt = Date.now()
      // P0: read paths may only run lightweight DB-only repairs — never network 1688 fetch.
      try {
        const repairedCount = await repairCharsetCorruptedPendingImportItems()
        if (repairedCount > 0) {
          console.info(`[getPendingImportQueue] repaired ${repairedCount} charset-corrupted pending import items`)
        }
      } catch (error) {
        console.error('[getPendingImportQueue] failed to repair charset-corrupted pending import items', error)
      }

      try {
        const sanitizedMockCount = await sanitizeClassicMockPendingImportItems(40)
        if (sanitizedMockCount > 0) {
          console.info(`[getPendingImportQueue] cleared ${sanitizedMockCount} classic mock 红/蓝/黑 SKU rows`)
        }
      } catch (error) {
        console.error('[getPendingImportQueue] failed to sanitize classic mock SKUs', error)
      }

      try {
        const inconsistentPublishedItems = await prisma.importtaskitem.findMany({
          where: {
            importedProductId: { not: null },
            OR: [
              { isPublished: false },
              { publishStatus: { not: 'COMPLETED' as any } },
              { fetchStatus: { not: 'COMPLETED' as any } },
              { publishedAt: null },
            ],
          },
          select: {
            id: true,
            importedProductId: true,
            fetchStatus: true,
            publishStatus: true,
            publishedAt: true,
          },
          take: 100,
        })

        const recoveryOperations = inconsistentPublishedItems.flatMap(item => {
          const recoveryData = buildPublishedImportItemRecoveryData(item)
          if (!recoveryData) {
            return []
          }

          return prisma.importtaskitem.update({
            where: { id: item.id },
            data: recoveryData,
          })
        })

        if (recoveryOperations.length > 0) {
          await prisma.$transaction(recoveryOperations)
        }
      } catch (error) {
        console.error('[getPendingImportQueue] failed to repair published import items, fallback to queue snapshot', error)
      }
    }

    const snapshot = await loadPendingImportQueueSnapshot({ page, page_size: pageSize })

    // Self-heal stale in-memory mutex when DB has no RUNNING work (e.g. crash / multi-worker drift).
    if (parseJobBusy) {
      try {
        const [runningTasks, runningItems] = await Promise.all([
          prisma.importtask.count({ where: { status: 'RUNNING' as any } }),
          prisma.importtaskitem.count({
            where: { fetchStatus: 'RUNNING' as any, isPublished: false },
          }),
        ])
        if (runningTasks === 0 && runningItems === 0) {
          parseJobBusy = false
          parseJobLabel = null
          parseJobCancelRequested = false
          parseJobProgress = null
        }
      } catch (error) {
        console.error('[getPendingImportQueue] failed to self-heal parse job mutex', error)
      }
    }

    return {
      activeTask: snapshot.activeTask,
      list: snapshot.items,
      total: snapshot.total,
      page,
      page_size: pageSize,
      parse_job: getParseJobRuntimeStatus(),
    }
  })
)

export const parseTableImportContent = requireRole([UserRole.ADMIN])(
  withResult(async (input: ParseTableImportInput): Promise<ParseTableImportOutput> => {
    const content = normalizeText(input.content)
    if (!content) {
      throw new Error('请先粘贴表格内容')
    }

    const lines = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)

    if (lines.length === 0) return { rows: [] }

    const detectDelimiter = (allLines: string[]) => {
      if (allLines.some(line => line.includes('\t'))) return '\t'
      return ','
    }
    const delimiter = detectDelimiter(lines)
    // 无表头约定 9 列（不含 SKU）：产品编号、产品价格、名称、品牌、供应商、类目、颜色、规格、重量
    const expectedColumnCount = 9
    const priceColumnIndex = 1

    const splitLine = (line: string) => {
      const rawParts = line.split(delimiter).map(value => value.trim())
      if (delimiter !== ',' || rawParts.length <= expectedColumnCount) {
        return rawParts
      }

      const extra = rawParts.length - expectedColumnCount
      if (extra <= 0) return rawParts

      const mergeCount = extra + 1
      const mergedPrice = rawParts.slice(priceColumnIndex, priceColumnIndex + mergeCount).join(',')
      return [
        ...rawParts.slice(0, priceColumnIndex),
        mergedPrice,
        ...rawParts.slice(priceColumnIndex + mergeCount),
      ]
    }

    const headerCells = splitLine(lines[0]).map(value => value.toLowerCase())
    // SKU 不在映射字段中：表格不读取、不要求 SKU 列；编码由产品编号在草稿/发布阶段生成
    const headerAliases: Record<string, string[]> = {
      productCode: ['产品编号', '编号', 'product_code', 'product code'],
      productPrice: ['产品价格', '售价', '价格', 'price'],
      productName: ['名称', '产品名称', '商品名称', 'name'],
      brand: ['品牌', '品牌关键词', 'brand'],
      supplierName: ['供应商', 'supplier'],
      categoryName: ['类目', '英文类目', '产品分类', '分类', 'category', 'hat', 'hats'],
      color: ['颜色', 'color'],
      spec: TABLE_IMPORT_SPEC_HEADER_ALIASES,
      weight: ['重量', '重量(g)', 'weight'],
      detail: ['详情', '描述', '商品详情', 'detail', 'description'],
    }
    const indexMap: Record<string, number> = {}
    Object.entries(headerAliases).forEach(([field, aliases]) => {
      const idx = headerCells.findIndex(cell =>
        field === 'categoryName' ? isTableImportCategoryHeader(cell) : aliases.includes(cell),
      )
      if (idx >= 0) indexMap[field] = idx
    })
    const hasNamedHeader = Object.keys(indexMap).length >= 2
    const dataLines = hasNamedHeader ? lines.slice(1) : lines

    // 无表头固定 9 列：产品编号、产品价格、名称、品牌、供应商、类目、颜色、规格、重量（+ 可选详情）
    const fallbackIndex: Record<string, number> = {
      productCode: 0,
      productPrice: 1,
      productName: 2,
      brand: 3,
      supplierName: 4,
      categoryName: 5,
      color: 6,
      spec: 7,
      weight: 8,
      detail: 9,
    }

    const rows = dataLines.map((line, index) => {
      const columns = splitLine(line)
      const pick = (field: string) => {
        // 有命名表头时只读映射列，绝不位置回退（避免无 SKU 表把价格误读到其它字段）
        if (hasNamedHeader) {
          return indexMap[field] !== undefined ? (columns[indexMap[field]] || '') : ''
        }
        const idx = fallbackIndex[field]
        return idx !== undefined ? (columns[idx] || '') : ''
      }
      const productPriceText = preserveProductPriceRaw(pick('productPrice'))
      const resolved = resolveTableImportColorSpec({
        color: pick('color'),
        spec: pick('spec'),
        extraCandidates: [productPriceText, pick('detail'), ...columns],
      })
      return {
        rowId: `row-${index + 1}`,
        productCode: pick('productCode'),
        // 永不从表格取 SKU；预览展示空，草稿/发布按产品编号生成
        skuCode: '',
        productPrice: null,
        productPriceText,
        productName: pick('productName'),
        brand: pick('brand'),
        supplierName: pick('supplierName'),
        categoryName: pick('categoryName'),
        categoryId: '',
        color: resolved.color,
        spec: resolved.spec,
        colors: resolved.colors,
        specs: resolved.specs,
        weight: pick('weight'),
        costPrice: null,
        imageUrl: '',
        detail: pick('detail')
      }
    }).filter(row => row.productName || row.productCode)

    return { rows }
  })
)

/**
 * 表格导入确认：写入待上传队列（Excel「图片」列会写入主图/图集；无图时仍可稍后在待上传区补传）
 */
export const createProductsFromTable = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateProductsFromTableInput): Promise<CreateProductsFromTableOutput> => {
    const { userId } = getAuthContext()
    const rows = (input.rows || []).filter(row => normalizeText(row.productName))
    if (rows.length === 0) {
      throw new Error('请至少保留一行有效商品（名称不能为空）')
    }
    const missingProductCode = rows.find(row => !normalizeText(row.productCode))
    if (missingProductCode) {
      throw new Error('表格导入要求每行都提供产品编号，并以它作为 SPU 合并依据')
    }

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        level: true,
        priceCoefficient: true,
        isBrandCategory: true,
      },
    })

    const groupedRows = groupTableImportRowsByProductCode(rows)

    const dedupe = (values: Array<string | null | undefined>) =>
      Array.from(new Set(values.map(value => normalizeText(value)).filter(Boolean)))

    /** 表格导入专用：同产品编号多行合并为一个 SPU 草稿（1688 禁止复用） */
    const buildTableMergedDraft = (productCode: string, spuRows: TableImportDraftRow[]) => {
      const firstRow = spuRows[0]
      const skuPairs = collectTableImportSkuPairs(spuRows)
      const colors = dedupe(skuPairs.map(pair => pair.color))
      const specs = dedupe(skuPairs.map(pair => pair.spec))
      const scalarPrice =
        spuRows
          .map(row => parseSingleScalarPrice(row.productPriceText ?? ''))
          .find(price => price !== null) ?? null
      const priceBySpec = new Map<string, number>()

      for (const row of spuRows) {
        const rowSpecs = row.specs?.length ? row.specs : splitCommaList(row.spec)
        const priceList = parseDecimalList(row.productPriceText ?? '')
        if (rowSpecs.length > 0 && priceList.length === rowSpecs.length) {
          rowSpecs.forEach((spec, index) => {
            const normalizedSpec = normalizeText(spec)
            const nextPrice = priceList[index]
            if (normalizedSpec && nextPrice != null) {
              priceBySpec.set(normalizedSpec, nextPrice)
            }
          })
          continue
        }
        const fallbackPrice =
          priceList.length > 0 ? priceList[0] : parseSingleScalarPrice(row.productPriceText ?? '')
        if (fallbackPrice != null) {
          rowSpecs.forEach(spec => {
            const normalizedSpec = normalizeText(spec)
            if (normalizedSpec && !priceBySpec.has(normalizedSpec)) {
              priceBySpec.set(normalizedSpec, fallbackPrice)
            }
          })
        }
      }

      const weightGrams =
        spuRows
          .map(row => (Number(row.weight) > 0 ? Math.round(Number(row.weight)) : null))
          .find(value => value != null) ?? null
      const galleryUrls = dedupe(
        spuRows.flatMap(row => {
          const raw = normalizeText(row.imageUrl)
          if (!raw) return []
          return raw.split(/[,，|]/).map(part => part.trim()).filter(Boolean)
        }),
      )
      const imageByColor = new Map<string, string>()
      for (const row of spuRows) {
        const raw = normalizeText(row.imageUrl)
        if (!raw) continue
        const firstUrl = raw.split(/[,，|]/).map(part => part.trim()).filter(Boolean)[0]
        if (!firstUrl) continue
        const rowColors = row.colors?.length ? row.colors : splitCommaList(row.color)
        if (rowColors.length === 0) {
          if (!imageByColor.has('')) imageByColor.set('', firstUrl)
          continue
        }
        for (const color of rowColors) {
          const key = normalizeText(color)
          if (key && !imageByColor.has(key)) imageByColor.set(key, firstUrl)
        }
      }
      // SKU 编码一律由产品编号（SPU 合并键）生成，不使用表格 skuCode（常被误填为价格）
      const pairList =
        skuPairs.length > 0
          ? skuPairs
          : [{ color: null as string | null, spec: null as string | null }]
      const skuTable: PreviewSkuTableRow[] = []
      let index = 0

      for (const pair of pairList) {
        const color = pair.color
        const spec = pair.spec
        const attributes: Array<{ name: string; value: string }> = []
        if (color) attributes.push({ name: '颜色', value: color })
        if (spec) attributes.push({ name: '规格', value: spec })
        const mappedPrice = spec ? (priceBySpec.get(normalizeText(spec)) ?? scalarPrice) : scalarPrice
        const colorKey = color ? normalizeText(color) : ''
        skuTable.push({
          skuKey: buildSkuIdentifier(productCode, spec, color, index),
          spec: attributes.map(attr => attr.value).join('/') || '默认规格',
          costPrice: mappedPrice,
          price: mappedPrice,
          // 表格无库存列：每 SKU 默认 1000（勿写 1，否则可用库存=SKU 个数）
          stock: DEFAULT_AVAILABLE_STOCK,
          weightGrams,
          imageUrl: (colorKey && imageByColor.get(colorKey)) || imageByColor.get('') || galleryUrls[0] || '',
          attributes: attributes.length > 0 ? attributes : [{ name: '规格', value: '默认规格' }],
        })
        index += 1
      }

      const skuPrices = skuTable
        .map(sku => toNumberOrNull(sku.price))
        .filter((value): value is number => value !== null)

      return {
        productCode,
        productName: normalizeText(firstRow.productName),
        // 表格不产生 skuCode；实际编码见 skuTable.skuKey（buildSkuIdentifier）
        skuCode: '',
        brand: normalizeText(firstRow.brand),
        supplierName: normalizeText(firstRow.supplierName),
        categoryName: normalizeText(firstRow.categoryName),
        categoryId: normalizeText(firstRow.categoryId),
        detail: normalizeText(firstRow.detail) || normalizeText(
          spuRows.map(row => normalizeText(row.detail)).find(Boolean) || '',
        ),
        colorText: colors.join(','),
        specText: specs.join(','),
        colors,
        specs,
        weightGrams,
        galleryUrls,
        mainImageUrl: galleryUrls[0] || '',
        skuTable,
        specSummary: [
          ...(colors.length ? [{ name: '颜色', values: colors }] : []),
          ...(specs.length ? [{ name: '规格', values: specs }] : []),
        ],
        priceMin: skuPrices.length ? Math.min(...skuPrices) : scalarPrice,
        priceMax: skuPrices.length ? Math.max(...skuPrices) : scalarPrice,
      }
    }

    // Pre-build drafts OUTSIDE the transaction — never call translation APIs inside a DB txn
    // (55 rows of title EN/ES previously held the transaction open until client Failed to fetch).
    const mergedDrafts = Array.from(groupedRows.entries()).map(([productCode, spuRows]) =>
      buildTableMergedDraft(productCode, spuRows),
    )
    // 品牌关键词匹配仅可作参考标签；有「类目」单元格时主类目严禁被标题里的 LV/COACH 覆盖
    const secondaryCategories = await loadAutoMatchSecondaryCategories(prisma)

    const itemCreates = mergedDrafts.map((row, index) => {
      const categoryCell = normalizeText(row.categoryName)
      const pathResolved = resolveTableImportCategoryPath(categoryCell, categories)
      // 精确整格名兜底（不走品牌类目）
      const exactCell =
        categoryCell && !pathResolved.targetCategoryId
          ? categories.find(
              item =>
                !item.isBrandCategory &&
                (item.name.trim().toLowerCase() === categoryCell.toLowerCase() ||
                  categoryCellMatchesCategory(item.name, categoryCell)),
            ) || null
          : null
      // 标题命中只用来补关联标签（品牌货架 / clothes）；主类目优先表格「类目」列
      const autoMatchedSecondaryCategories = matchSecondaryCategoriesByTitle(
        normalizeText(row.productName),
        secondaryCategories,
        [normalizeText(row.detail)].filter(Boolean).join('\n') || null,
      )
      const tableTargetId = pathResolved.targetCategoryId || exactCell?.id || null
      const categoryId =
        pickFirstNonBrandCategoryId(
          [
            normalizeText(row.categoryId),
            tableTargetId,
            pickImportPricingTargetCategory(autoMatchedSecondaryCategories, tableTargetId),
            input.defaultCategoryId,
          ],
          new Map(
            categories.map(item => [
              item.id,
              {
                id: item.id,
                name: item.name,
                parentId: item.parentId,
                priceCoefficient: item.priceCoefficient,
                isBrandCategory: Boolean(item.isBrandCategory),
              },
            ]),
          ),
          new Map(secondaryCategories.map(item => [item.id, item])),
        ) || null

      // 表格「类目」列解析结果写入 matched*，供待上传/校准弹窗默认勾选（不只写 targetCategoryId）
      const tableResolvedCategoryIds = Array.from(
        new Set(
          [pathResolved.primaryId, pathResolved.secondaryId, tableTargetId, categoryId].filter(
            (id): id is string => Boolean(id),
          ),
        ),
      )
      const matchedSecondaryCategoryIds = Array.from(
        new Set([
          ...tableResolvedCategoryIds,
          ...autoMatchedSecondaryCategories.map(category => category.id),
        ]),
      )
      const matchedSecondaryCategoryNames = matchedSecondaryCategoryIds
        .map(id => categories.find(item => item.id === id)?.name || null)
        .filter((name): name is string => Boolean(name))
      if (!matchedSecondaryCategoryNames.length) {
        matchedSecondaryCategoryNames.push(
          ...autoMatchedSecondaryCategories.map(category => category.name),
        )
      }

      const productDetailText = [
        normalizeText(row.detail),
        normalizeText(row.brand) ? `品牌：${normalizeText(row.brand)}` : '',
        normalizeText(row.productCode) ? `产品编号：${normalizeText(row.productCode)}` : '',
        // 仅记录表格类目原文，供运营对照；不写入品牌到「类目」语义
        pathResolved.sourceCategoryLabel
          ? `类目：${pathResolved.sourceCategoryLabel}`
          : categoryCell
            ? `类目：${categoryCell}`
            : '',
      ].filter(Boolean).join('\n') || null

      const resolvedCategory = categoryId
        ? categories.find(item => item.id === categoryId) || null
        : null
      const resolvedParent = resolvedCategory?.parentId
        ? categories.find(item => item.id === resolvedCategory.parentId) || null
        : pathResolved.parentCategory || null

      // 系数：二级优先，否则一级；不使用品牌类目系数
      const matchedCoefficient = resolveCategoryPriceCoefficient(
        resolvedCategory && !isAggregatePricingCategoryName(resolvedCategory.name)
          ? toNumberOrNull(resolvedCategory.priceCoefficient)
          : null,
        resolvedParent && !isAggregatePricingCategoryName(resolvedParent.name)
          ? toNumberOrNull(resolvedParent.priceCoefficient)
          : null,
      )

      // sourceCategoryName：表格类目原文或真实品类名，禁止用 LV/COACH 冒充主类目
      const firstProductTypeName =
        autoMatchedSecondaryCategories.find(category =>
          isProductTypeCategory({
            name: category.name,
            parentName: category.parentName,
            isBrandCategory: category.isBrandCategory,
            level: category.level,
          }),
        )?.name || null
      const sourceCategoryName =
        pathResolved.sourceCategoryLabel ||
        categoryCell ||
        firstProductTypeName ||
        resolvedCategory?.name ||
        null

      const productCode = normalizeText(row.productCode) || `T${Date.now()}${index}`
      const zhName = normalizeText(row.productName)
      const mainImageUrl = normalizeText(row.mainImageUrl) || row.galleryUrls?.[0] || null
      const detailImages = (row.galleryUrls || []).filter(url => url && url !== mainImageUrl)

      // 表格价=成本；售价必须乘类目系数（此前只写了 coefficient，区间仍停在成本价）
      const pricedSkuTable = row.skuTable.map((sku) => {
        const cost = toNumberOrNull(sku.costPrice) ?? toNumberOrNull(sku.price)
        return {
          ...sku,
          costPrice: cost,
          price: cost !== null ? roundCurrency(cost * matchedCoefficient) : sku.price,
        }
      })
      const sellPrices = pricedSkuTable
        .map((sku) => toNumberOrNull(sku.price))
        .filter((value): value is number => value !== null)
      const sellMin =
        sellPrices.length > 0
          ? Math.min(...sellPrices)
          : row.priceMin != null
            ? roundCurrency(Number(row.priceMin) * matchedCoefficient)
            : null
      const sellMax =
        sellPrices.length > 0
          ? Math.max(...sellPrices)
          : row.priceMax != null
            ? roundCurrency(Number(row.priceMax) * matchedCoefficient)
            : sellMin
      const usdMin = sellMin != null ? roundCurrency(sellMin / 6.5) : null
      const usdMax = sellMax != null ? roundCurrency(sellMax / 6.5) : null

      return {
        operatorId: userId,
        sourceUrl: `table-import://${productCode}`,
        parsedName: zhName,
        parsedMainImageUrl: mainImageUrl,
        parsedPriceMin: row.priceMin,
        parsedPriceMax: row.priceMax,
        supplierName: normalizeText(row.supplierName) || null,
        mainImageUrl,
        costPrice: row.priceMin,
        weightGrams: row.weightGrams,
        sourceCategoryName,
        targetCategoryId: categoryId,
        coefficient: matchedCoefficient,
        goodsStatus: 'DRAFT' as any,
        minimumOrderQuantity: DEFAULT_MIN_ORDER_QTY,
        // 表格无库存列：每 SKU 已默认 1000，此处汇总供待上传区展示
        availableStock: resolveInitialStock(pricedSkuTable.reduce((sum, sku) => sum + (sku.stock || 0), 0)),
        cnyPriceMin: sellMin,
        cnyPriceMax: sellMax,
        usdPriceMin: usdMin,
        usdPriceMax: usdMax,
        productDetail: productDetailText,
        skuSummaryText: pricedSkuTable.map(sku => sku.spec).join(' | '),
        fetchStatus: 'COMPLETED' as any,
        publishStatus: 'PENDING' as any,
        isSelected: true,
        isPublished: false,
        fetchStartedAt: new Date(),
        fetchFinishedAt: new Date(),
        specSummaryJson: row.specSummary as any,
        // 发布时再补 EN/ES；导入热路径禁止 await 翻译以防超时
        previewDataJson: {
          name: zhName,
          nameEn: '',
          nameEs: '',
          categoryId: categoryId || undefined,
          /** 表格类目路径解析结果（主类目用；品牌永不进入此列表作为主类目） */
          tableCategoryPath: {
            raw: categoryCell || null,
            l1: pathResolved.l1Token,
            l2: pathResolved.l2Token,
            primaryId: pathResolved.primaryId,
            secondaryId: pathResolved.secondaryId,
          },
          brand: normalizeText(row.brand) || undefined,
          matchedCategoryIds: matchedSecondaryCategoryIds,
          matchedCategoryNames: matchedSecondaryCategoryNames,
          price: sellMin ?? undefined,
          mainImageUrl: mainImageUrl || undefined,
          detailImages,
          shortDescription: normalizeText(row.brand) || undefined,
          importSortIndex: index,
          inboundIdentity: {
            mode: 'TABLE_PRODUCT_CODE_MERGED',
            excelProductCode: productCode,
            sourceUrl: `table-import://${productCode}`,
          },
          featureAttributes: [
            ...(normalizeText(row.brand) ? [{ key: '品牌', value: normalizeText(row.brand) }] : []),
            ...(normalizeText(row.productCode) ? [{ key: '产品编号', value: normalizeText(row.productCode) }] : []),
            ...(sourceCategoryName ? [{ key: '类目', value: sourceCategoryName }] : []),
          ],
          skuTable: pricedSkuTable,
        } as any,
      }
    })

    const task = await prisma.$transaction(
      async tx => {
        const newTask = await tx.importtask.create({
          data: {
            creatorId: userId,
            taskName: `表格导入 ${new Date().toLocaleString('zh-CN')}`,
            status: 'COMPLETED' as any,
            sourceLinkCount: groupedRows.size,
            successCount: groupedRows.size,
            failureCount: 0,
            progressPercent: 100,
            defaultStatus: 'DRAFT' as any,
            defaultCategoryId: input.defaultCategoryId || null,
            queueConcurrency: 1,
            rateLimitMinDelaySec: 0,
            rateLimitMaxDelaySec: 0,
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        })

        for (const item of itemCreates) {
          await tx.importtaskitem.create({
            data: {
              importTaskId: newTask.id,
              ...item,
            },
          })
        }

        return newTask
      },
      { timeout: 120_000, maxWait: 15_000 },
    )

    return {
      taskId: task.id,
      createdCount: groupedRows.size,
      created: Array.from(groupedRows.values()).map(spuRows => ({
        productId: '',
        productName: spuRows[0]?.productName || '',
        source: 'TABLE_IMPORT',
      })),
    }
  })
)

const splitCommaList = (raw?: string | null) =>
  normalizeCommaText(raw)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

export const createImportTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateImportTaskInput): Promise<CreateImportTaskOutput> => {
    const { userId } = getAuthContext()
    const rawUrls = input.urls.split('\n').map(u => u.trim()).filter(Boolean)
    // 仅去掉完全相同的重复粘贴；不同链接一律各自建条目，绝不按标题/货号合并
    const uniqueUrls = Array.from(new Set(rawUrls))

    if (uniqueUrls.length === 0) {
      throw new Error('请输入有效的商品链接')
    }

    const httpUrls = uniqueUrls.filter(u => u.startsWith('http://') || u.startsWith('https://'))
    if (httpUrls.length === 0) {
      throw new Error('链接格式不正确，需以 http 或 https 开头')
    }

    const validUrls = httpUrls.filter(
      u => is1688ImportSourceUrl(u) || is1688ShopCategorySourceUrl(u) || isPinduoduoProductUrl(u),
    )
    if (validUrls.length === 0) {
      throw new Error(
        '请粘贴有效的1688商品详情链接（offer/数字）、店铺分类页链接（page/offerlist…）或拼多多商品链接',
      )
    }

    const categoryUrls = validUrls.filter(u => is1688ShopCategorySourceUrl(u))
    const detailOrPddUrls = validUrls.filter(u => !is1688ShopCategorySourceUrl(u))

    // 历史已导入（同 offer/goods）或本次粘贴内重复：直接跳过；分类页保留待采集器展开
    const { acceptedUrls: acceptedDetailUrls, skippedDuplicateCount } =
      await filterFreshImportUrls(detailOrPddUrls)
    const acceptedUrls = [...acceptedDetailUrls, ...categoryUrls]
    if (acceptedUrls.length === 0) {
      throw new Error(
        skippedDuplicateCount > 0
          ? `全部 ${skippedDuplicateCount} 条链接此前已导入或本次重复，已跳过，无需再次识别/解析`
          : '没有可导入的新链接',
      )
    }

    let stockStrategyJson: any = null
    if (typeof input.stockStrategyStock === 'number') {
      stockStrategyJson = { type: 'fixed', stock: input.stockStrategyStock }
    }

    const taskName = `导入任务 ${new Date().toLocaleString('zh-CN')}`

    const task = await prisma.$transaction(async tx => {
      const newTask = await tx.importtask.create({
        data: {
          creatorId: userId,
          taskName,
          status: 'PENDING',
          sourceLinkCount: acceptedUrls.length,
          successCount: 0,
          failureCount: 0,
          progressPercent: 0,
          markupRate: input.costDeductionUsd !== undefined ? input.costDeductionUsd : null,
          defaultStatus: input.defaultStatus as any,
          defaultCategoryId: input.defaultCategoryId || null,
          stockStrategyJson,
          queueConcurrency: 1,
          rateLimitMinDelaySec: 2,
          rateLimitMaxDelaySec: 5,
          lastScheduledAt: null,
          lastRateLimitedAt: null,
          startedAt: null,
          finishedAt: null
        }
      })

      // 1688：每条独立 URL → 一条独立 pending（分类页由采集器展开为多条 offer）
      await tx.importtaskitem.createMany({
        data: acceptedUrls.map(url => ({
          importTaskId: newTask.id,
          operatorId: userId,
          sourceUrl: url,
          isSelected: true,
          fetchStatus: 'PENDING' as any,
          publishStatus: 'PENDING' as any,
          isPublished: false,
          targetCategoryId: input.defaultCategoryId || null,
          goodsStatus: (input.defaultStatus || 'DRAFT') as any,
          ...(is1688ShopCategorySourceUrl(url)
            ? {
                failureReason: '店铺分类页：请先运行本机采集器展开商品后再解析',
                previewDataJson: { importKind: 'SHOP_CATEGORY' } as any,
              }
            : {}),
        }))
      })

      return newTask
    })

    return {
      taskId: task.id,
      createdCount: acceptedUrls.length,
      skippedDuplicateCount,
      categoryUrlCount: categoryUrls.length,
    }
  })
)

export const createPinduoduoImportTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreatePinduoduoImportTaskInput): Promise<CreateImportTaskOutput> => {
    const { userId } = getAuthContext()
    const rawUrls = input.urls.split('\n').map(u => u.trim()).filter(Boolean)
    const uniqueUrls = Array.from(new Set(rawUrls))

    if (uniqueUrls.length === 0) {
      throw new Error('请输入有效的拼多多商品链接')
    }

    const httpUrls = uniqueUrls.filter(u => u.startsWith('http://') || u.startsWith('https://'))
    if (httpUrls.length === 0) {
      throw new Error('链接格式不正确，需以 http 或 https 开头')
    }

    const validUrls = httpUrls.filter(u => isPinduoduoProductUrl(u))
    if (validUrls.length === 0) {
      throw new Error('请粘贴有效的拼多多商品详情页链接（需包含 goods_id，如 https://mobile.yangkeduo.com/goods.html?goods_id=xxxx）')
    }

    const { acceptedUrls, skippedDuplicateCount } = await filterFreshImportUrls(validUrls)
    if (acceptedUrls.length === 0) {
      throw new Error(
        skippedDuplicateCount > 0
          ? `全部 ${skippedDuplicateCount} 条链接此前已导入或本次重复，已跳过，无需再次识别/解析`
          : '没有可导入的新链接',
      )
    }

    const markupRate =
      typeof input.markupRate === 'number' && Number.isFinite(input.markupRate)
        ? Math.max(0, input.markupRate)
        : 0

    let stockStrategyJson: any = {
      type: 'fixed',
      platform: 'PDD',
      markupPercent: markupRate,
    }
    if (typeof input.stockStrategyStock === 'number') {
      stockStrategyJson.stock = input.stockStrategyStock
    }

    const taskName = `拼多多导入 ${new Date().toLocaleString('zh-CN')}`

    const task = await prisma.$transaction(async tx => {
      const newTask = await tx.importtask.create({
        data: {
          creatorId: userId,
          taskName,
          status: 'PENDING',
          sourceLinkCount: acceptedUrls.length,
          successCount: 0,
          failureCount: 0,
          progressPercent: 0,
          // 拼多多任务：markupRate 存加价百分比（与 1688 的成本减法语义隔离）
          markupRate,
          defaultStatus: input.defaultStatus as any,
          defaultCategoryId: input.defaultCategoryId || null,
          stockStrategyJson,
          queueConcurrency: 1,
          rateLimitMinDelaySec: 2,
          rateLimitMaxDelaySec: 5,
          lastScheduledAt: null,
          lastRateLimitedAt: null,
          startedAt: null,
          finishedAt: null,
        },
      })

      await tx.importtaskitem.createMany({
        data: acceptedUrls.map(url => ({
          importTaskId: newTask.id,
          operatorId: userId,
          sourceUrl: url,
          isSelected: true,
          fetchStatus: 'PENDING' as any,
          publishStatus: 'PENDING' as any,
          isPublished: false,
          targetCategoryId: input.defaultCategoryId || null,
          goodsStatus: (input.defaultStatus || 'DRAFT') as any,
        })),
      })

      return newTask
    })

    return {
      taskId: task.id,
      createdCount: acceptedUrls.length,
      skippedDuplicateCount,
    }
  })
)

export const startParseTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: StartParseTaskInput): Promise<void> => {
    try {
      await prisma.$executeRawUnsafe('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')
    } catch {
      // ignore charset bootstrap failure; URL charset remains the primary guarantee
    }

    const jobLabel = `task:${input.taskId}`
    acquireParseJob(jobLabel)

    let task: any = null
    try {
      task = await prisma.importtask.findUnique({
        where: { id: input.taskId },
        include: { items: { orderBy: { createdAt: 'asc' } } }
      })

      if (!task) throw new Error('未找到该导入任务')
      if (!['PENDING', 'RETRY_PENDING', 'RATE_LIMITED'].includes(task.status)) {
        throw new Error('当前任务状态不允许开始解析')
      }

      bumpParseJobProgress(0, task.items.length)
      const startedAt = new Date()
      await prisma.importtask.update({
        where: { id: task.id },
        data: { status: 'RUNNING', startedAt, finishedAt: null }
      })
    } catch (error) {
      releaseParseJob(jobLabel)
      throw error
    }

    // P0: ACK immediately after marking RUNNING; URL parsing continues in-process.
    // UI must poll importtask / importtaskitem status (do not assume this RPC waits for completion).
    const taskSnapshot = task!
    void (async () => {
    let successCount = 0
    let failureCount = 0
    let rateLimitedCount = 0
    const costDeductionUsd = taskSnapshot.markupRate ? Number(taskSnapshot.markupRate) : 0
    const { minDelaySec, maxDelaySec } = getTaskDelayWindow(taskSnapshot as any)
    const secondaryCategories = await loadAutoMatchSecondaryCategories(prisma)
    const categoryMap = await loadImportPricingCategories(prisma)
    const exchangeRate = await getGlobalExchangeRate(prisma)
    const cookieSnapshot = resolve1688Cookie()
    console.warn(
      `[startParseTask] task=${taskSnapshot.id} items=${taskSnapshot.items.length} cookieConfigured=${Boolean(cookieSnapshot)} cookieLen=${cookieSnapshot.length} hasMtopTk=${/_m_h5_tk=/.test(cookieSnapshot)} cwd=${process.cwd()}`,
    )

    // 解析前再拦一层：任务内重复，或库中其它条目已采集/已发布的同 offer/goods，直接跳过抓取
    const taskItemIds = taskSnapshot.items.map((row: { id: string }) => row.id)
    const taskLinkKeys = taskSnapshot.items
      .map((row: { sourceUrl?: string | null }) => resolveImportLinkDedupeKey(row.sourceUrl))
      .filter((key: string | null): key is string => Boolean(key))
    const existingLinkKeysElsewhere = await findExistingImportLinkKeys(taskLinkKeys, {
      excludeItemIds: taskItemIds,
    })
    const seenDedupeKeysInTask = new Set<string>()

    for (let index = 0; index < taskSnapshot.items.length; index += 1) {
      if (isParseJobCancelled()) {
        console.warn(`[startParseTask] cancelled by user at index=${index} task=${taskSnapshot.id}`)
        await prisma.importtaskitem.updateMany({
          where: {
            importTaskId: taskSnapshot.id,
            fetchStatus: { in: ['PENDING', 'RUNNING'] as any },
          },
          data: {
            fetchStatus: 'RETRY_PENDING' as any,
            failureReason: '用户终止解析',
            fetchFinishedAt: new Date(),
          },
        })
        await prisma.importtask.update({
          where: { id: taskSnapshot.id },
          data: {
            status: 'RETRY_PENDING' as any,
            finishedAt: new Date(),
            progressPercent: Math.min(100, Math.round((index / Math.max(1, taskSnapshot.items.length)) * 100)),
          },
        })
        break
      }

      const item = taskSnapshot.items[index]
      const sourceUrl = String(item.sourceUrl || '')

      // 分类页必须先由本机采集器展开为 offer 详情；直接解析只会失败
      if (is1688ShopCategorySourceUrl(sourceUrl)) {
        await prisma.importtaskitem.update({
          where: { id: item.id },
          data: {
            fetchStatus: 'FAILED' as any,
            failureReason: '店铺分类页尚未展开：请先运行本机采集器（collect-1688），再点开始解析',
            fetchFinishedAt: new Date(),
          },
        })
        failureCount += 1
        bumpParseJobProgress(index + 1, taskSnapshot.items.length)
        continue
      }

      const dedupeKey = resolveImportLinkDedupeKey(sourceUrl)
      if (dedupeKey) {
        if (seenDedupeKeysInTask.has(dedupeKey) || existingLinkKeysElsewhere.has(dedupeKey)) {
          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: 'FAILED' as any,
              failureReason: '重复链接，已跳过识别/解析',
              fetchFinishedAt: new Date(),
            },
          })
          failureCount += 1
          bumpParseJobProgress(index + 1, taskSnapshot.items.length)
          continue
        }
        seenDedupeKeysInTask.add(dedupeKey)
      }

      const fetchStartedAt = new Date()

      await prisma.importtaskitem.update({
        where: { id: item.id },
        data: {
          fetchStatus: 'RUNNING' as any,
          fetchStartedAt,
          fetchFinishedAt: null,
          failureReason: null
        }
      })

      try {
        const isPddUrl = isPinduoduoProductUrl(sourceUrl)
        const is1688OfferUrl = is1688ImportSourceUrl(sourceUrl)

        if (isPddUrl) {
          const fetchResult = await fetchPinduoduoProductPreview(sourceUrl)
          const fetched = fetchResult.preview
          const hasRealParse =
            fetchResult.outcome === 'success' && hasMeaningfulPinduoduoPreview(fetched)

          if (!hasRealParse) {
          failureCount += 1
            const failReason =
              fetchResult.outcome === 'expired'
                ? '解析失败：该拼多多商品已下架或不存在'
                : fetchResult.failureReason || '解析失败：拼多多风控/抓取失败，请稍后重试'
            const goodsId = extractPinduoduoGoodsId(sourceUrl) || item.id.slice(0, 6)
          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
                parsedName: fetched.name || `[拼多多抓取] 商品 ${goodsId}`,
              fetchStatus: 'FAILED' as any,
                failureReason: failReason,
                fetchFinishedAt: new Date(),
              },
            })
          } else {
            successCount += 1
            await persistPinduoduoParsedItem({
              item,
              task: taskSnapshot as any,
              fetched,
              secondaryCategories,
              categoryMap,
              exchangeRate,
              importSortIndex: index,
            })
          }
        } else if (!is1688OfferUrl) {
          failureCount += 1
          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: 'FAILED' as any,
              failureReason: '解析失败：链接错误，请粘贴有效的1688或拼多多商品详情页链接',
              fetchFinishedAt: new Date()
            }
          })
        } else {
          const fetchResult = await fetch1688OfferPreviewDetailed(sourceUrl)
          const fetched = fetchResult.preview
          const hasRealParse = Boolean(
            fetched.name ||
            fetched.mainImageUrl ||
            (Array.isArray(fetched.skuTable) && fetched.skuTable.length > 0),
          )

          if (!hasRealParse) {
            failureCount += 1
            const failReason =
              fetchResult.outcome === 'expired'
                ? FAILURE_REASON_EXPIRED
                : fetchResult.failureReason || FAILURE_REASON_RISK_CONTROL
            const offerId = extract1688OfferId(sourceUrl) || item.id.slice(0, 6)
            await prisma.importtaskitem.update({
              where: { id: item.id },
              data: {
                parsedName: fetched.name || `[1688抓取] 商品 ${offerId}`,
                fetchStatus: 'FAILED' as any,
                failureReason: failReason,
                fetchFinishedAt: new Date(),
              },
            })
          } else {
          successCount += 1
          const rawPriceMin = fetched.priceMin ?? basePrice
          const rawPriceMax = fetched.priceMax ?? (rawPriceMin + 20)
          const offerId = extract1688OfferId(sourceUrl) || item.id.slice(0, 6)
          // 抓不到标题时用明显占位，便于运营识别并重试；绝不假装已解析成功
          const productName = fetched.name || `[1688抓取] 商品 ${offerId}`
          const productDetail =
            fetched.productDetail ||
            '自动采集的商品详情，请运营补充图文与说明。'
          const matchedSecondaryCategories = matchSecondaryCategoriesByTitle(
            productName,
            secondaryCategories,
            productDetail,
          )
          const matchedSecondaryCategoryIds = matchedSecondaryCategories.map(category => category.id)
          const matchedSecondaryCategoryNames = matchedSecondaryCategories.map(category => category.name)
          // Pricing target = real L1/L2 only; Brand hits stay in matched* for shelf linking.
          const secondaryById = new Map(secondaryCategories.map(category => [category.id, category]))
          const targetCategoryId = pickFirstNonBrandCategoryId(
            [
              pickImportPricingTargetCategory(matchedSecondaryCategories, null),
              taskSnapshot.defaultCategoryId,
              ...matchedSecondaryCategoryIds,
            ],
            categoryMap,
            secondaryById,
          )
          const resolvedCoefficient = resolveImportCategoryCoefficient(categoryMap, targetCategoryId)
          const adjustedCostMin = Math.max(0, roundCurrency(rawPriceMin - costDeductionUsd))
          const adjustedCostMax = Math.max(adjustedCostMin, roundCurrency(rawPriceMax - costDeductionUsd))
          const finalPriceMin = roundCurrency(adjustedCostMin * resolvedCoefficient)
          const finalPriceMax = roundCurrency(adjustedCostMax * resolvedCoefficient)
          const mainImageUrl =
            fetched.mainImageUrl ||
            (hasRealParse ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158' : null)
          const detailImages =
            Array.isArray(fetched.detailImages) && fetched.detailImages.length > 0
              ? fetched.detailImages
              : mainImageUrl
                ? [mainImageUrl]
                : []
          // 无真实供应商时留空，避免「假供应商」掩盖解析失败
          const supplierName = fetched.supplierName || null
          const sourceCategoryName = fetched.sourceCategoryName || null

          const parsedSkuRows = Array.isArray(fetched.skuTable) ? fetched.skuTable : []
          const strategyStock =
            resolveInitialStock((taskSnapshot.stockStrategyJson as StockStrategyJson | null)?.stock)
          // 有颜色时展开真实色/码 SKU；仅当真正无 props 时才落 1 条「默认规格」
          const colorsEarly =
            Array.isArray(fetched.colors) && fetched.colors.length > 0
              ? fetched.colors
                  .map(color => ({
                    label: normalizeText(color.label),
                    imageUrl: normalizeText(color.imageUrl) || null,
                  }))
                  .filter(color => color.label)
              : []
          const sizesByColorEarly =
            fetched.sizesByColor && typeof fetched.sizesByColor === 'object'
              ? Object.fromEntries(
                  Object.entries(fetched.sizesByColor).map(([color, sizes]) => [
                    color,
                    Array.from(new Set((sizes || []).map(size => normalizeText(size)).filter(Boolean))),
                  ]),
                )
              : {}
          const baseSkuRows = resolveSkuTableOrExpandFromColors({
            skuTable: parsedSkuRows,
            colors: colorsEarly,
            sizesByColor: sizesByColorEarly,
            costPrice: adjustedCostMin,
            price: finalPriceMin,
            stock: strategyStock,
          })
          // 重量自动识别：标题/详情正则提取 → 二级分类兜底 → 500g（运营可在待上传区双击覆盖）
          const fallbackWeightGrams = resolveProductWeightGrams({
            text: [productName, productDetail, sourceCategoryName].filter(Boolean).join(' '),
            categoryNames: [...(matchedSecondaryCategoryNames || []), sourceCategoryName],
          })
          const skuTable: PreviewSkuTableRow[] = baseSkuRows.map(
            (row, index) => {
              // 源站价扣减后再乘类目系数；无独立价时回退到商品级源价
              const sourceCost = toNumberOrNull(row.costPrice) ?? toNumberOrNull(row.price) ?? rawPriceMin
              const nextCost = Math.max(0, roundCurrency(sourceCost - costDeductionUsd))
              const nextPrice = roundCurrency(nextCost * resolvedCoefficient)
              return {
                skuKey: normalizeText(row.skuKey) || `sku-${index + 1}`,
                spec: normalizeText(row.spec) || formatSpecText(row.attributes || []),
                costPrice: nextCost,
                price: nextPrice,
                stock: resolveInitialStock(toNumberOrNull(row.stock) ?? strategyStock),
                weightGrams: toNumberOrNull(row.weightGrams) ?? fallbackWeightGrams,
                // 无独立色图时保持空，待运营在待上传区补填；禁止回填主图冒充色图
                imageUrl: normalizeText(row.imageUrl) || null,
                attributes:
                  Array.isArray(row.attributes) && row.attributes.length > 0
                    ? row.attributes.map(attr => ({
                        name: normalizeText(attr.name) || '规格',
                        value: normalizeText(attr.value) || '默认',
                      }))
                    : parseSpecAttributes(row.spec || '默认规格'),
              }
            },
          )

          const colors =
            colorsEarly.length > 0
              ? colorsEarly
              : parsedSkuRows.length > 0
                ? Array.from(
                    new Set(
                      skuTable
                        .map(sku => sku.attributes?.find(attr => attr.name === '颜色')?.value)
                        .filter(Boolean) as string[],
                    ),
                  ).map(label => ({
                    label,
                    imageUrl:
                      skuTable.find(sku => sku.attributes?.some(attr => attr.name === '颜色' && attr.value === label))
                        ?.imageUrl || null,
                  }))
                : []

          const sizesByColor: Record<string, string[]> = { ...sizesByColorEarly }

          if (Object.keys(sizesByColor).length === 0) {
            for (const sku of skuTable) {
              const color = sku.attributes?.find(attr => attr.name === '颜色')?.value
              const size = sku.attributes?.find(attr => attr.name === '尺码')?.value
              if (!color || !size) continue
              const list = sizesByColor[color] || []
              if (!list.includes(size)) list.push(size)
              sizesByColor[color] = list
            }
          }

          const specSummary: SpecSummaryJson[] =
            Array.isArray(fetched.specSummary) && fetched.specSummary.length > 0
              ? fetched.specSummary
              : [
                  ...(colors.length ? [{ name: '颜色', values: colors.map(item => item.label) }] : []),
                  ...(() => {
                    const sizeValues = Array.from(
                      new Set(
                        [
                          ...Object.values(sizesByColor).flat(),
                          ...skuTable
                            .map(sku => sku.attributes?.find(attr => attr.name === '尺码')?.value)
                            .filter(Boolean),
                        ].filter(Boolean) as string[],
                      ),
                    )
                    return sizeValues.length ? [{ name: '尺码', values: sizeValues }] : []
                  })(),
                ]
          if (specSummary.length === 0) {
            specSummary.push({ name: '规格', values: ['默认规格'] })
          }

          const skuPrices = skuTable
            .map(sku => toNumberOrNull(sku.price))
            .filter((value): value is number => value !== null)
          const resolvedFinalPriceMin = skuPrices.length ? Math.min(...skuPrices) : finalPriceMin
          const resolvedFinalPriceMax = skuPrices.length ? Math.max(...skuPrices) : finalPriceMax
          const resolvedUsdMin = roundCurrency(resolvedFinalPriceMin / exchangeRate)
          const resolvedUsdMax = roundCurrency(resolvedFinalPriceMax / exchangeRate)
          const totalStock = skuTable.reduce((sum, sku) => sum + (toNumberOrNull(sku.stock) ?? 0), 0)

          const previewData: PreviewDataJson = {
            name: productName,
            // 采集/解析阶段不再翻译（移至上架时翻译+缓存），显著加快「传图」并让逐条切换不卡顿
            categoryId: targetCategoryId || undefined,
            matchedCategoryIds: matchedSecondaryCategoryIds,
            matchedCategoryNames: matchedSecondaryCategoryNames,
            price: resolvedFinalPriceMin,
            mainImageUrl: mainImageUrl || undefined,
            detailImages,
            shortDescription: productDetail,
            featureAttributes: fetched.featureAttributes || [],
            colors,
            sizesByColor,
            inboundIdentity: {
              mode: 'LINK_1688_INDEPENDENT',
              offerId,
              sourceUrl,
            },
            skuTable,
          }

          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              parsedName: productName,
              supplierName,
              mainImageUrl,
              parsedMainImageUrl: mainImageUrl,
              costPrice: toNumberOrNull(skuTable[0]?.costPrice) ?? adjustedCostMin,
              weightGrams: toNumberOrNull(skuTable[0]?.weightGrams) ?? fallbackWeightGrams,
              sourceCategoryName,
              coefficient: resolvedCoefficient,
              goodsStatus: (taskSnapshot.defaultStatus || 'DRAFT') as any,
              productDetail,
              skuSummaryText: skuTable.map(sku => sku.spec).filter(Boolean).join(' | ') || '默认规格',
              cnyPriceMin: resolvedFinalPriceMin,
              cnyPriceMax: resolvedFinalPriceMax,
              usdPriceMin: resolvedUsdMin,
              usdPriceMax: resolvedUsdMax,
              minimumOrderQuantity: resolveInitialMinOrderQty(fetched.minOrderQty),
              // B：真实库存优先（全 0 即缺货），缺省回落 1000
              availableStock: resolveInitialStock(totalStock),
              targetCategoryId,
              parsedPriceMin: rawPriceMin,
              parsedPriceMax: rawPriceMax,
              specSummaryJson: specSummary as any,
              previewDataJson: previewData as any,
              fetchStatus: 'COMPLETED' as any,
              failureReason: null,
              fetchFinishedAt: new Date()
            }
          })
          }
        }
      } catch (error: any) {
        failureCount += 1
        await prisma.importtaskitem.update({
          where: { id: item.id },
          data: {
            fetchStatus: 'FAILED' as any,
            failureReason: `解析失败：${error?.message || '抓取过程中发生未知错误'}`,
            fetchFinishedAt: new Date()
          }
        })
      }

      const processedCount = index + 1
      bumpParseJobProgress(processedCount, taskSnapshot.items.length)
      const progressPercent = Math.min(100, Math.round((processedCount / taskSnapshot.items.length) * 100))
      await prisma.importtask.update({
        where: { id: taskSnapshot.id },
        data: {
          successCount,
          failureCount: failureCount + rateLimitedCount,
          progressPercent,
          lastScheduledAt: new Date()
        }
      })

      if (index < taskSnapshot.items.length - 1) {
        await sleep(randomDelayMs(minDelaySec, maxDelaySec))
      }
    }

    const totalFailures = failureCount + rateLimitedCount
    const finishedAt = new Date()
    if (isParseJobCancelled()) {
      await prisma.importtask.update({
        where: { id: taskSnapshot.id },
        data: {
          status: 'RETRY_PENDING' as any,
          successCount,
          failureCount: totalFailures,
          finishedAt,
        },
      }).catch(() => undefined)
    } else {
    let finalStatus: ImportTaskStatusType = 'COMPLETED'
    if (successCount === 0 && totalFailures > 0) {
      finalStatus = rateLimitedCount > 0 && failureCount === 0 ? 'RATE_LIMITED' : 'FAILED'
    } else if (totalFailures > 0) {
      finalStatus = 'PARTIAL_SUCCESS'
    }

    await prisma.importtask.update({
      where: { id: taskSnapshot.id },
      data: {
        status: finalStatus as any,
        successCount,
        failureCount: totalFailures,
        progressPercent: 100,
        finishedAt
      }
    })
    }
    })().catch(async (error: any) => {
      console.error('[startParseTask] background parse failed', error)
      try {
        await prisma.importtaskitem.updateMany({
          where: {
            importTaskId: taskSnapshot.id,
            fetchStatus: { in: ['PENDING', 'RUNNING'] as any },
          },
          data: {
            fetchStatus: 'FAILED' as any,
            failureReason: `解析失败：${error?.message || '后台解析异常中断'}`,
            fetchFinishedAt: new Date(),
          },
        })
        await prisma.importtask.update({
          where: { id: taskSnapshot.id },
          data: {
            status: 'FAILED' as any,
            finishedAt: new Date(),
          },
        })
      } catch (persistError) {
        console.error('[startParseTask] failed to persist background error status', persistError)
      }
    }).finally(() => {
      releaseParseJob(jobLabel)
    })
  })
)

export const updateTaskItemPreview = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateTaskItemPreviewInput): Promise<void> => {
    const item = await prisma.importtaskitem.findUnique({
      where: { id: input.itemId },
      include: { importTask: true }
    })

    if (!item) throw new Error('未找到该导入明细')
    if (item.importTask.status === 'RUNNING') throw new Error('解析中任务不可修改')

    const currentPreview = (item.previewDataJson as unknown as PreviewDataJson) || {}
    const newPreview: PreviewDataJson = {
      ...currentPreview,
      ...input.previewData
    }

    await prisma.importtaskitem.update({
      where: { id: input.itemId },
      data: {
        previewDataJson: newPreview as any,
        isSelected: true
      }
    })
  })
)

export const updatePendingImportGallery = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdatePendingImportGalleryInput): Promise<void> => {
    const item = await prisma.importtaskitem.findUnique({
      where: { id: input.itemId },
      include: { importTask: true }
    })

    if (!item) throw new Error('未找到待上传明细')
    if (item.isPublished) throw new Error('已发布商品不可在待上传区编辑')

    const galleryUrls = Array.from(new Set((input.galleryUrls || []).map(url => String(url || '').trim()).filter(Boolean)))
    const mainImageUrl = (input.mainImageUrl || galleryUrls[0] || '').trim()
    if (!mainImageUrl) throw new Error('至少保留一张主图')

    const currentPreview = (item.previewDataJson as unknown as PreviewDataJson) || {}
    await prisma.importtaskitem.update({
      where: { id: input.itemId },
      data: {
        mainImageUrl,
        parsedMainImageUrl: mainImageUrl,
        previewDataJson: {
          ...currentPreview,
          mainImageUrl,
          detailImages: galleryUrls
        } as any,
        isSelected: true
      }
    })
  })
)

export const inlineUpdatePendingImportItemField = requireRole([UserRole.ADMIN])(
  withResult(async (input: InlineUpdatePendingImportItemFieldInput): Promise<void> => {
    const item = await prisma.importtaskitem.findUnique({
      where: { id: input.itemId },
      include: { importTask: true }
    })

    if (!item) throw new Error('未找到待上传明细')
    if (item.isPublished) throw new Error('已发布商品不可在待上传区编辑')
    if (item.importTask.status === 'RUNNING' && ['product_name', 'supplier_name', 'main_image_url'].includes(input.field) === false) {
      throw new Error('采集中仅允许少量字段编辑，请等待任务完成后再修改')
    }

    const rawValue = typeof input.value === 'string' ? input.value.trim() : input.value
    const numericValue = typeof input.value === 'number' ? input.value : toNumberOrNull(input.value)
    const data: Record<string, any> = {}

    switch (input.field) {
      case 'product_name': {
        if (!rawValue) throw new Error('商品名称不能为空')
        // importtaskitem 只有 parsedName，没有 productName 字段
        data.parsedName = rawValue
        const namePreview = ((item.previewDataJson || {}) as PreviewDataJson)
        const nameEn = await resolveEnglishProductTitle(String(rawValue))
        const nameEs = await resolveSpanishProductTitle(String(rawValue), null, nameEn)
        data.previewDataJson = {
          ...namePreview,
          name: String(rawValue),
          nameEn,
          nameEs,
        } as any
        break
      }
      case 'product_detail':
        data.productDetail = String(rawValue || '')
        break
      case 'sku_summary_text':
        data.skuSummaryText = String(rawValue || '')
        break
      case 'supplier_name':
        data.supplierName = String(rawValue || '') || null
        break
      case 'source_category_name':
        data.sourceCategoryName = String(rawValue || '') || null
        break
      case 'target_category_id': {
        const nextId = String(rawValue || '') || null
        data.targetCategoryId = nextId
        const catPreview = ((item.previewDataJson || {}) as PreviewDataJson)
        data.previewDataJson = {
          ...catPreview,
          categoryId: nextId || catPreview.categoryId,
          // 人工改主类目也视为已确认，上架时不再重扫覆盖
          ...(nextId ? { categoryCalibrated: true } : {}),
        } as any
        break
      }
      case 'coefficient':
        if (numericValue === null || numericValue <= 0) throw new Error('价格系数必须大于0')
        data.coefficient = numericValue
        break
      case 'goods_status':
        if (!['DRAFT', 'ACTIVE', 'INACTIVE'].includes(String(rawValue))) throw new Error('货物状态无效')
        data.goodsStatus = rawValue as any
        break
      case 'weight_grams':
        if (numericValue === null || numericValue <= 0) throw new Error('重量必须大于0')
        data.weightGrams = numericValue
        {
          // SPU 重量变更：强制覆盖 preview.skuTable 内全部 SKU 重量
          const currentPreview = ((item.previewDataJson || {}) as PreviewDataJson)
          const nextDrafts = resolvePendingSkuDrafts(item).map((sku) => ({
            ...sku,
            weight_grams: numericValue,
          }))
          data.previewDataJson = {
            ...currentPreview,
            skuTable: nextDrafts.map((sku) => ({
              skuKey: sku.sku_key,
              spec: sku.spec_text,
              costPrice: sku.cost_price,
              price: sku.price,
              stock: sku.stock,
              weightGrams: numericValue,
              imageUrl: sku.image_url || undefined,
              attributes: sku.attributes,
            })),
          } as any
        }
        break
      case 'cost_price':
        if (numericValue === null || numericValue < 0) throw new Error('成本价不能小于0')
        data.costPrice = numericValue
        break
      case 'cny_price_min':
        if (numericValue === null || numericValue < 0) throw new Error('人民币最低售价不能小于0')
        data.cnyPriceMin = numericValue
        break
      case 'cny_price_max':
        if (numericValue === null || numericValue < 0) throw new Error('人民币最高售价不能小于0')
        data.cnyPriceMax = numericValue
        break
      case 'usd_price_min':
        if (numericValue === null || numericValue < 0) throw new Error('美元最低预估价不能小于0')
        data.usdPriceMin = numericValue
        break
      case 'usd_price_max':
        if (numericValue === null || numericValue < 0) throw new Error('美元最高预估价不能小于0')
        data.usdPriceMax = numericValue
        break
      case 'minimum_order_quantity':
        data.minimumOrderQuantity = resolveInitialMinOrderQty(numericValue)
        break
      case 'available_stock':
        if (numericValue === null || numericValue === undefined || !Number.isFinite(numericValue)) {
          data.availableStock = DEFAULT_AVAILABLE_STOCK
          break
        }
        if (numericValue < 0) throw new Error('可用库存不能小于0')
        data.availableStock = Math.round(numericValue)
        break
      case 'main_image_url':
        if (!rawValue) throw new Error('主图不能为空')
        data.mainImageUrl = rawValue
        data.parsedMainImageUrl = rawValue
        break
      default:
        throw new Error('暂不支持的待上传字段')
    }

    if (['target_category_id', 'cost_price', 'coefficient'].includes(input.field)) {
      const nextCategoryId =
        input.field === 'target_category_id'
          ? (String(rawValue || '') || null)
          : (item.targetCategoryId || item.importTask.defaultCategoryId || null)
      const nextCostPrice =
        input.field === 'cost_price'
          ? numericValue
          : toNumberOrNull(item.costPrice)
      const categoryMap = await loadImportPricingCategories(prisma)
      const coefficient =
        input.field === 'coefficient'
          ? Number(numericValue)
          : resolveImportCategoryCoefficient(categoryMap, nextCategoryId)
      const exchangeRate = await getGlobalExchangeRate(prisma)
      const nextDrafts = recalculatePendingSkuPrices(resolvePendingSkuDrafts(item), nextCostPrice, coefficient)
      const priceSummary = summarizePendingSkuPrices(nextDrafts, exchangeRate)
      const currentPreview = ((item.previewDataJson || {}) as PreviewDataJson)

      data.coefficient = coefficient
      data.cnyPriceMin = priceSummary.cnyMin
      data.cnyPriceMax = priceSummary.cnyMax
      data.usdPriceMin = priceSummary.usdMin
      data.usdPriceMax = priceSummary.usdMax
      data.previewDataJson = {
        ...currentPreview,
        categoryId: nextCategoryId || undefined,
        price: priceSummary.cnyMin ?? currentPreview.price,
        skuTable: nextDrafts.map((sku) => ({
          skuKey: sku.sku_key,
          spec: sku.spec_text,
          costPrice: sku.cost_price,
          price: sku.price,
          stock: sku.stock,
          weightGrams: sku.weight_grams,
          imageUrl: sku.image_url || undefined,
          attributes: sku.attributes,
        })),
      } as any
    }

    await prisma.importtaskitem.update({
      where: { id: input.itemId },
      data
    })
  })
)

/**
 * Batch update pending fields in one client round-trip.
 * weight/MOQ/stock use updateMany; coefficient recalculates SKU prices per item.
 */
export const batchUpdatePendingImportItemField = requireRole([UserRole.ADMIN])(
  withResult(async (input: {
    itemIds: string[]
    field: Extract<
      PendingImportInlineField,
      'weight_grams' | 'minimum_order_quantity' | 'available_stock' | 'coefficient'
    >
    value: string | number
  }): Promise<{ success_count: number; fail_count: number }> => {
    const itemIds = Array.from(new Set((input.itemIds || []).map((id) => String(id || '').trim()).filter(Boolean)))
    if (!itemIds.length) {
      return { success_count: 0, fail_count: 0 }
    }

    const numericValue =
      typeof input.value === 'number' ? input.value : toNumberOrNull(input.value)
    if (numericValue === null || !Number.isFinite(numericValue)) {
      throw new Error('请输入有效数值')
    }

    if (input.field === 'coefficient') {
      if (numericValue <= 0) throw new Error('价格系数必须大于0')
      const [items, exchangeRate] = await Promise.all([
        prisma.importtaskitem.findMany({
          where: { id: { in: itemIds }, isPublished: false },
          include: { importTask: true },
        }),
        getGlobalExchangeRate(prisma),
      ])
      const fail_count = Math.max(0, itemIds.length - items.length)
      if (!items.length) {
        return { success_count: 0, fail_count }
      }

      let success = 0
      let fail = fail_count
      for (const item of items) {
        try {
          const nextCostPrice = toNumberOrNull(item.costPrice)
          const nextDrafts = recalculatePendingSkuPrices(
            resolvePendingSkuDrafts(item),
            nextCostPrice,
            numericValue,
          )
          const priceSummary = summarizePendingSkuPrices(nextDrafts, exchangeRate)
          const currentPreview = ((item.previewDataJson || {}) as PreviewDataJson)
          const nextCategoryId = item.targetCategoryId || item.importTask.defaultCategoryId || null
          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              coefficient: numericValue,
              cnyPriceMin: priceSummary.cnyMin,
              cnyPriceMax: priceSummary.cnyMax,
              usdPriceMin: priceSummary.usdMin,
              usdPriceMax: priceSummary.usdMax,
              previewDataJson: {
                ...currentPreview,
                categoryId: nextCategoryId || undefined,
                price: priceSummary.cnyMin ?? currentPreview.price,
                skuTable: nextDrafts.map((sku) => ({
                  skuKey: sku.sku_key,
                  spec: sku.spec_text,
                  costPrice: sku.cost_price,
                  price: sku.price,
                  stock: sku.stock,
                  weightGrams: sku.weight_grams,
                  imageUrl: sku.image_url || undefined,
                  attributes: sku.attributes,
                })),
              } as any,
            },
          })
          success += 1
        } catch {
          fail += 1
        }
      }
      return { success_count: success, fail_count: fail }
    }

    const data: Record<string, number> = {}
    if (input.field === 'weight_grams') {
      if (numericValue <= 0) throw new Error('重量必须大于0')
      data.weightGrams = numericValue
    } else if (input.field === 'minimum_order_quantity') {
      data.minimumOrderQuantity = resolveInitialMinOrderQty(numericValue)
    } else if (input.field === 'available_stock') {
      if (numericValue === null || numericValue === undefined || Number.isNaN(numericValue)) {
        data.availableStock = DEFAULT_AVAILABLE_STOCK
      } else if (numericValue < 0) {
        throw new Error('可用库存不能小于0')
      } else {
        data.availableStock = Math.round(numericValue)
      }
    } else {
      throw new Error('暂不支持的批量待上传字段')
    }

    const existing = await prisma.importtaskitem.findMany({
      where: { id: { in: itemIds }, isPublished: false },
      select: { id: true },
    })
    const eligibleIds = existing.map((row) => row.id)
    const fail_count = Math.max(0, itemIds.length - eligibleIds.length)
    if (!eligibleIds.length) {
      return { success_count: 0, fail_count }
    }

    const result = await prisma.importtaskitem.updateMany({
      where: { id: { in: eligibleIds }, isPublished: false },
      data,
    })

    return {
      success_count: result.count,
      fail_count: Math.max(0, itemIds.length - result.count),
    }
  }),
)

export const inlineUpdatePendingImportSkuField = requireRole([UserRole.ADMIN])(
  withResult(async (input: InlineUpdatePendingImportSkuFieldInput): Promise<void> => {
    const item = await prisma.importtaskitem.findUnique({ where: { id: input.itemId } })
    if (!item) throw new Error('未找到待上传明细')
    if (item.isPublished) throw new Error('已发布商品不可在待上传区编辑')

    const drafts = resolvePendingSkuDrafts(item)
    const targetIndex = drafts.findIndex(sku => sku.sku_key === input.skuKey)
    if (targetIndex < 0) throw new Error('未找到对应 SKU')

    const next = { ...drafts[targetIndex] }
    if (input.field === 'spec_text') {
      const specText = String(input.value || '').trim()
      if (!specText) throw new Error('规格属性不能为空')
      next.spec_text = specText
      next.attributes = parseSpecAttributes(specText)
    } else if (input.field === 'cost_price') {
      const numericValue = toNumberOrNull(input.value)
      if (numericValue === null || numericValue < 0) throw new Error('成本价不能小于0')
      next.cost_price = numericValue
    } else if (input.field === 'price') {
      const numericValue = toNumberOrNull(input.value)
      if (numericValue === null || numericValue < 0) throw new Error('售价不能小于0')
      next.price = numericValue
    } else if (input.field === 'weight_grams') {
      const numericValue = toNumberOrNull(input.value)
      if (numericValue === null || numericValue <= 0) throw new Error('重量必须大于0')
      next.weight_grams = numericValue
    } else if (input.field === 'stock') {
      const numericValue = toNumberOrNull(input.value)
      if (numericValue === null || numericValue < 0) throw new Error('库存不能小于0')
      next.stock = Math.round(numericValue)
    } else if (input.field === 'image_url') {
      next.image_url = String(input.value || '').trim() || null
    } else if (input.field === 'minimum_order_quantity') {
      // 1688 起订量通常是整单级；在 SKU 行双击编辑时写回父条目
      const qty = resolveInitialMinOrderQty(input.value)
      await prisma.importtaskitem.update({
        where: { id: item.id },
        data: { minimumOrderQuantity: qty },
      })
      return
    } else {
      throw new Error('暂不支持的 SKU 字段')
    }

    const targetColor = getColorAttrValue(next)
    const nextSkus = drafts.map((sku, index) => {
      if (input.field === 'image_url' && targetColor && getColorAttrValue(sku) === targetColor) {
        return { ...sku, image_url: next.image_url }
      }
      return index === targetIndex ? next : sku
    })
    const stocks = nextSkus.map(sku => toNumberOrNull(sku.stock) ?? 0)
    const currentPreview = ((item.previewDataJson || {}) as PreviewDataJson)
    const categoryMap = await loadImportPricingCategories(prisma)
    const coefficient = resolveImportCategoryCoefficient(
      categoryMap,
      item.targetCategoryId || null,
    )
    const exchangeRate = await getGlobalExchangeRate(prisma)
    const pricedSkus =
      input.field === 'cost_price'
        ? recalculatePendingSkuPrices(nextSkus, toNumberOrNull(item.costPrice), coefficient)
        : nextSkus
    const priceSummary = summarizePendingSkuPrices(pricedSkus, exchangeRate)

    await prisma.importtaskitem.update({
      where: { id: item.id },
      data: {
        skuSummaryText: pricedSkus.map(sku => sku.spec_text).join(' | '),
        costPrice: pricedSkus[0]?.cost_price ?? item.costPrice,
        weightGrams: pricedSkus[0]?.weight_grams ?? item.weightGrams,
        availableStock: stocks.reduce((sum, value) => sum + value, 0),
        coefficient,
        cnyPriceMin: priceSummary.cnyMin,
        cnyPriceMax: priceSummary.cnyMax,
        usdPriceMin: priceSummary.usdMin,
        usdPriceMax: priceSummary.usdMax,
        previewDataJson: {
          ...currentPreview,
          price: priceSummary.cnyMin ?? currentPreview.price,
          skuTable: pricedSkus.map(sku => ({
            skuKey: sku.sku_key,
            spec: sku.spec_text,
            costPrice: sku.cost_price,
            price: sku.price,
            stock: sku.stock,
            weightGrams: sku.weight_grams,
            imageUrl: sku.image_url || undefined,
            attributes: sku.attributes
          }))
        } as any
      }
    })
  })
)

const allocatePendingSkuKey = (existingKeys: Set<string>, seed: string) => {
  const base = normalizeText(seed).replace(/\s+/g, '-') || 'sku'
  let candidate = `${base}-copy`
  let index = 2
  while (existingKeys.has(candidate)) {
    candidate = `${base}-copy-${index}`
    index += 1
  }
  existingKeys.add(candidate)
  return candidate
}

const clonePendingSkuWithColor = (
  sku: PendingImportSkuItem,
  nextColor: string,
  existingKeys: Set<string>,
): PendingImportSkuItem => {
  const attributes = (Array.isArray(sku.attributes) ? sku.attributes : []).map((attr) =>
    attr.name === '颜色' ? { ...attr, value: nextColor } : { ...attr },
  )
  if (!attributes.some((attr) => attr.name === '颜色')) {
    attributes.unshift({ name: '颜色', value: nextColor })
  }
  return {
    ...sku,
    sku_key: allocatePendingSkuKey(existingKeys, sku.sku_key || nextColor),
    attributes,
    spec_text: formatSpecText(attributes, sku.spec_text || '默认规格'),
  }
}

const clonePendingSkuWithSpecSuffix = (
  sku: PendingImportSkuItem,
  existingKeys: Set<string>,
): PendingImportSkuItem => {
  const attributes = (Array.isArray(sku.attributes) ? sku.attributes : []).map((attr) => ({ ...attr }))
  const specAttr = attributes.find(
    (attr) => attr.name === '规格' || attr.name === '尺码' || attr.name === '尺寸',
  )
  if (specAttr) {
    const base = String(specAttr.value || '默认规格').replace(/\s*副本\d*$/, '').trim() || '默认规格'
    let next = `${base} 副本`
    let index = 2
    while (attributes.some((attr) => attr !== specAttr && attr.value === next)) {
      next = `${base} 副本${index}`
      index += 1
    }
    specAttr.value = next
  } else {
    attributes.push({ name: '规格', value: '默认规格 副本' })
  }
  return {
    ...sku,
    sku_key: allocatePendingSkuKey(existingKeys, sku.sku_key || 'sku'),
    attributes,
    spec_text: formatSpecText(attributes, sku.spec_text || '默认规格'),
  }
}

const allocateUniqueColorName = (existingColors: Set<string>, sourceColor: string) => {
  const base = String(sourceColor || '默认颜色').replace(/\s*副本\d*$/, '').trim() || '默认颜色'
  let next = `${base} 副本`
  let index = 2
  while (existingColors.has(next)) {
    next = `${base} 副本${index}`
    index += 1
  }
  existingColors.add(next)
  return next
}

const persistPendingImportSkuDrafts = async (item: any, nextSkus: PendingImportSkuItem[]) => {
  if (!nextSkus.length) throw new Error('至少保留一个规格行')
  const stocks = nextSkus.map((sku) => toNumberOrNull(sku.stock) ?? 0)
  const currentPreview = (item.previewDataJson || {}) as PreviewDataJson
  const categoryMap = await loadImportPricingCategories(prisma)
  const coefficient = resolveImportCategoryCoefficient(
    categoryMap,
    item.targetCategoryId || null,
  )
  const exchangeRate = await getGlobalExchangeRate(prisma)
  const priceSummary = summarizePendingSkuPrices(nextSkus, exchangeRate)

  await prisma.importtaskitem.update({
    where: { id: item.id },
    data: {
      skuSummaryText: nextSkus.map((sku) => sku.spec_text).join(' | '),
      costPrice: nextSkus[0]?.cost_price ?? item.costPrice,
      weightGrams: nextSkus[0]?.weight_grams ?? item.weightGrams,
      availableStock: stocks.reduce((sum, value) => sum + value, 0),
      coefficient,
      cnyPriceMin: priceSummary.cnyMin,
      cnyPriceMax: priceSummary.cnyMax,
      usdPriceMin: priceSummary.usdMin,
      usdPriceMax: priceSummary.usdMax,
      previewDataJson: {
        ...currentPreview,
        price: priceSummary.cnyMin ?? currentPreview.price,
        skuTable: nextSkus.map((sku) => ({
          skuKey: sku.sku_key,
          spec: sku.spec_text,
          costPrice: sku.cost_price,
          price: sku.price,
          stock: sku.stock,
          weightGrams: sku.weight_grams,
          imageUrl: sku.image_url || undefined,
          attributes: sku.attributes,
        })),
      } as any,
    },
  })

  return nextSkus
}

export const duplicatePendingImportSku = requireRole([UserRole.ADMIN])(
  withResult(async (input: DuplicatePendingImportSkuInput): Promise<MutatePendingImportSkusOutput> => {
    const item = await prisma.importtaskitem.findUnique({ where: { id: input.itemId } })
    if (!item) throw new Error('未找到待上传明细')
    if (item.isPublished) throw new Error('已发布商品不可在待上传区编辑')

    const drafts = resolvePendingSkuDrafts(item)
    const source = drafts.find((sku) => sku.sku_key === input.skuKey)
    if (!source) throw new Error('未找到对应规格行')

    const existingKeys = new Set(drafts.map((sku) => sku.sku_key))
    const cloned = clonePendingSkuWithSpecSuffix(source, existingKeys)
    const nextSkus = [...drafts]
    const sourceIndex = drafts.findIndex((sku) => sku.sku_key === input.skuKey)
    nextSkus.splice(sourceIndex + 1, 0, cloned)
    const item_skus = await persistPendingImportSkuDrafts(item, nextSkus)
    return { success: true, item_skus }
  }),
)

export const deletePendingImportSku = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeletePendingImportSkuInput): Promise<MutatePendingImportSkusOutput> => {
    const item = await prisma.importtaskitem.findUnique({ where: { id: input.itemId } })
    if (!item) throw new Error('未找到待上传明细')
    if (item.isPublished) throw new Error('已发布商品不可在待上传区编辑')

    const drafts = resolvePendingSkuDrafts(item)
    if (drafts.length <= 1) throw new Error('至少保留一个规格行')
    if (!drafts.some((sku) => sku.sku_key === input.skuKey)) throw new Error('未找到对应规格行')

    const nextSkus = drafts.filter((sku) => sku.sku_key !== input.skuKey)
    const item_skus = await persistPendingImportSkuDrafts(item, nextSkus)
    return { success: true, item_skus }
  }),
)

export const duplicatePendingImportSkuColorGroup = requireRole([UserRole.ADMIN])(
  withResult(async (input: DuplicatePendingImportSkuColorGroupInput): Promise<MutatePendingImportSkusOutput> => {
    const item = await prisma.importtaskitem.findUnique({ where: { id: input.itemId } })
    if (!item) throw new Error('未找到待上传明细')
    if (item.isPublished) throw new Error('已发布商品不可在待上传区编辑')

    const drafts = resolvePendingSkuDrafts(item)
    const color = String(input.color || '').trim() || '默认颜色'
    const sourceSkus = drafts.filter((sku) => getColorAttrValue(sku) === color)
    if (!sourceSkus.length) throw new Error('未找到对应颜色行')

    const existingColors = new Set(drafts.map((sku) => getColorAttrValue(sku)))
    const nextColor = allocateUniqueColorName(existingColors, color)
    const existingKeys = new Set(drafts.map((sku) => sku.sku_key))
    const cloned = sourceSkus.map((sku) => clonePendingSkuWithColor(sku, nextColor, existingKeys))

    const lastIndex = drafts.reduce((max, sku, index) => (
      getColorAttrValue(sku) === color ? index : max
    ), -1)
    const nextSkus = [...drafts]
    nextSkus.splice(lastIndex + 1, 0, ...cloned)
    const item_skus = await persistPendingImportSkuDrafts(item, nextSkus)
    return { success: true, item_skus }
  }),
)

export const deletePendingImportSkuColorGroup = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeletePendingImportSkuColorGroupInput): Promise<MutatePendingImportSkusOutput> => {
    const item = await prisma.importtaskitem.findUnique({ where: { id: input.itemId } })
    if (!item) throw new Error('未找到待上传明细')
    if (item.isPublished) throw new Error('已发布商品不可在待上传区编辑')

    const drafts = resolvePendingSkuDrafts(item)
    const color = String(input.color || '').trim() || '默认颜色'
    const remaining = drafts.filter((sku) => getColorAttrValue(sku) !== color)
    if (remaining.length === drafts.length) throw new Error('未找到对应颜色行')
    if (!remaining.length) throw new Error('至少保留一个颜色行')

    const item_skus = await persistPendingImportSkuDrafts(item, remaining)
    return { success: true, item_skus }
  }),
)

export const publishPendingImportItems = requireRole([UserRole.ADMIN])(
  withResult(async (input: PublishPendingImportItemsInput): Promise<PublishPendingImportItemsOutput> => {
    if (!input.itemIds.length) {
      throw new Error('请至少选择一条待上传商品')
    }

    // Hoist shared lookups once — previously reloaded inside every item transaction.
    const [secondaryCategories, exchangeRate, categoryMap, brandRules] = await Promise.all([
      loadAutoMatchSecondaryCategories(prisma),
      getGlobalExchangeRate(prisma),
      loadImportPricingCategories(prisma),
      loadBrandAliasRules(),
    ])

    let success = 0
    let fail = 0
    const failures: PublishPendingImportFailure[] = []

    const publishOne = async (itemId: string) => {
      let failureName = ''
      const MAX_PUBLISH_ATTEMPTS = 5
      let lastError: any = null

      // 翻译移出事务：上架时先按 parsedName 预翻译（带缓存+超时），事务内只读结果。
      // 这样缩短事务时长、降低 SPU 撞号与连接占用；采集阶段则完全不翻译。
      let preNameEn = ''
      let preNameEs = ''
      try {
        const pre = await prisma.importtaskitem.findUnique({
          where: { id: itemId },
          select: { parsedName: true, previewDataJson: true },
        })
        const preName = applyBrandAliases(normalizeText(pre?.parsedName) || '', brandRules)
        const prePreview = (pre?.previewDataJson as PreviewDataJson | null) || {}
        preNameEn =
          String(prePreview.nameEn || '').trim() ||
          (await resolveEnglishProductTitle(preName))
        preNameEs =
          String(prePreview.nameEs || '').trim() ||
          (await resolveSpanishProductTitle(preName, null, preNameEn))
      } catch {
        // 预翻译失败不阻断上架：事务内仍有兜底翻译/字典回落
      }

      for (let attempt = 1; attempt <= MAX_PUBLISH_ATTEMPTS; attempt++) {
      try {
        await prisma.$transaction(async tx => {
          const item = await tx.importtaskitem.findUnique({
            where: { id: itemId },
            include: { importTask: true }
          })

          if (!item) throw new Error('待上传明细不存在')
          failureName =
            normalizeText(item.parsedName) ||
            normalizeText(item.sourceUrl) ||
            itemId
          const recoveredPublishedData = buildPublishedImportItemRecoveryData(item)
          if (recoveredPublishedData) {
            await tx.importtaskitem.update({
              where: { id: item.id },
              data: recoveredPublishedData
            })
            throw new Error('该商品已发布')
          }
          if (item.isPublished) throw new Error('该商品已发布')
          const pendingSkusForReadiness = resolvePendingSkuDrafts(item)
          const readinessSnapshot = {
            fetchStatus: item.fetchStatus,
            isPublished: item.isPublished,
            title: item.parsedName,
            mainImageUrl: item.mainImageUrl || item.parsedMainImageUrl,
            galleryUrls: [
              item.mainImageUrl,
              item.parsedMainImageUrl,
              ...((Array.isArray((item.previewDataJson as PreviewDataJson | null)?.detailImages)
                ? (item.previewDataJson as PreviewDataJson).detailImages
                : []) || []),
            ],
            prices: [
              ...pendingSkusForReadiness.map(sku => sku.price),
              toNumberOrNull(item.cnyPriceMin),
              toNumberOrNull(item.cnyPriceMax),
              toNumberOrNull(item.costPrice),
              toNumberOrNull(item.parsedPriceMin),
              toNumberOrNull(item.usdPriceMin),
              toNumberOrNull((item.previewDataJson as any)?.price),
            ],
            updatedAt: item.updatedAt,
            createdAt: item.createdAt,
          }
          // 用户主动点「发布」是明确操作：只要核心字段齐全（真实标题+主图+价格>0）即放行，
          // 不再要求「卡住≥5 分钟」——否则刚采集完成的完整商品会因未满 5 分钟被误拦。
          // 兜底同时保留 isPendingImportEffectivelyReady（针对卡死抓取的自愈判断）。
          const readyByCoreFields = hasPendingImportCoreFields(readinessSnapshot)
          const effectivelyReady = readyByCoreFields || isPendingImportEffectivelyReady(readinessSnapshot)
          if (item.fetchStatus !== 'COMPLETED' && !effectivelyReady) {
            throw new Error('仅可发布采集完成的商品：缺少标题/主图/有效价格，请先「解析」')
          }

          // 品牌归一：把卖家暗语（蔻C/蔻家/古驰/LV…）替换成标准品牌名，
          // 写入商品名与后续 EN/ES 翻译都基于归一化后的标题。
          const productName = applyBrandAliases(item.parsedName || '', brandRules)
          const mainImageUrl = item.mainImageUrl || item.parsedMainImageUrl || ''
          const previewData = (item.previewDataJson as PreviewDataJson | null) || {}
          const previewMatchedIds = Array.from(
            new Set((previewData.matchedCategoryIds || []).filter(Boolean)),
          )
          const secondaryById = new Map(secondaryCategories.map(category => [category.id, category]))
          // 已一键校准（或弹窗保存过类目）：上架信任 target + matched，不再按标题重扫覆盖
          const trustCalibratedCategories =
            previewData.categoryCalibrated === true ||
            (Boolean(String(item.targetCategoryId || '').trim()) && previewMatchedIds.length > 0)

          let rematchedSecondaryCategories = [] as typeof secondaryCategories
          let pricingFromRematch: string | null = null
          let autoMatchedCategoryIds: string[] = []
          let brandCategoryId: string | null = null
          let brandMatchKeyword: string | null = null
          let selectedCategoryId = ''

          if (trustCalibratedCategories) {
            autoMatchedCategoryIds = previewMatchedIds
            const calibratedBrand =
              autoMatchedCategoryIds
                .map(id => secondaryById.get(id))
                .find(cat => cat && isBrandParentSecondaryCategory(cat)) || null
            // 校准结果若只有 No Brand / 未带品牌，再按标题补一次真实品牌
            const titleBrand =
              calibratedBrand ||
              pickBestBrandCategoryFromTitle(
                productName,
                secondaryCategories,
                buildCategoryMatchCorpus(item.productDetail, previewData.shortDescription),
              )
            brandCategoryId = titleBrand?.id || null
            brandMatchKeyword = titleBrand?.name || null
            selectedCategoryId =
              pickFirstNonBrandCategoryId(
                [
                  item.targetCategoryId,
                  previewData.categoryId,
                  item.importTask.defaultCategoryId,
                  ...autoMatchedCategoryIds,
                ],
                categoryMap,
                secondaryById,
              ) || ''
          } else {
            const detailForMatch = buildCategoryMatchCorpus(
              item.productDetail,
              previewData.shortDescription,
            )
            rematchedSecondaryCategories = matchSecondaryCategoriesByTitle(
              productName,
              secondaryCategories,
              detailForMatch,
            )
            const brandHit = pickBestBrandCategoryFromTitle(
              productName,
              secondaryCategories,
              detailForMatch,
            )
            pricingFromRematch = pickImportPricingTargetCategory(
              rematchedSecondaryCategories,
              null,
            )
            autoMatchedCategoryIds = Array.from(
              new Set([
                ...rematchedSecondaryCategories.map(category => category.id),
                ...previewMatchedIds,
              ]),
            )
            brandCategoryId = brandHit?.id || null
            brandMatchKeyword = brandHit?.name || null
            selectedCategoryId =
              pickFirstNonBrandCategoryId(
                [
                  item.targetCategoryId,
                  item.importTask.defaultCategoryId,
                  pricingFromRematch,
                  ...rematchedSecondaryCategories.map(category => category.id),
                ],
                categoryMap,
                secondaryById,
              ) || ''
          }
          if (!selectedCategoryId) {
            throw new Error('请选择手提包等真实一/二级类目（品牌货架不能作为主类目）')
          }

          const ownership = await resolveImportCategoryOwnership(tx, selectedCategoryId)
          // 双保险：ownership 之后若仍落到 Brand，拒绝写入
          if (isBrandShelfCategoryId(ownership.primaryCategoryId, categoryMap, secondaryById)) {
            throw new Error('品牌货架不能作为商品主类目，请选择手提包等真实一/二级类目')
          }
          const categoryId = ownership.primaryCategoryId
          // 主分类 + 校准/自动命中 L2 + 原目标分类（若有）全部写入关联，并展开一级父类
          let linkedCategoryIds = await expandLinkedCategoryIdsWithParents(tx, [
            ...ownership.linkedCategoryIds,
            ...autoMatchedCategoryIds,
            item.targetCategoryId || '',
            item.importTask.defaultCategoryId || '',
            pricingFromRematch || '',
            brandCategoryId || '',
          ])
          // 标题已命中真实品牌时，去掉 No Brand 兜底关联，避免列表显示「No Brand」
          linkedCategoryIds = await pruneNoBrandCatchAllLinks(tx, linkedCategoryIds, {
            hasRealBrand: Boolean(brandCategoryId),
          })
          const resolvedCoefficient = resolveImportCategoryCoefficient(categoryMap, categoryId)
          const baseCostPrice = toNumberOrNull(item.costPrice)
          const pendingSkus = recalculatePendingSkuPrices(
            pendingSkusForReadiness,
            baseCostPrice,
            resolvedCoefficient,
          )
          const priceSummary = summarizePendingSkuPrices(pendingSkus, exchangeRate)
          const price = priceSummary.cnyMin ?? priceSummary.cnyMax ?? toNumberOrNull((item.previewDataJson as any)?.price)

          if (!productName.trim()) throw new Error('商品名称不能为空')
          if (!mainImageUrl.trim()) throw new Error('主图不能为空')
          if (!categoryId) throw new Error('请选择目标分类')
          if (price === null || price < 0) throw new Error('请补充有效售价区间')

          await tx.importtaskitem.update({
            where: { id: itemId },
            data: {
              ...(item.fetchStatus !== 'COMPLETED'
                ? {
                    fetchStatus: 'COMPLETED' as any,
                    fetchFinishedAt: item.fetchFinishedAt || new Date(),
                  }
                : {}),
              publishStatus: 'RUNNING' as any,
              failureReason: null
            }
          })

          const featureAttrs = Array.isArray((previewData as any)?.featureAttributes)
            ? ((previewData as any).featureAttributes as Array<{ key: string; value: string }>)
            : []
          const parameterJson = buildParameterJsonFromAttrs(featureAttrs)
          const galleryUrls = Array.from(new Set([
            mainImageUrl,
            ...((Array.isArray(previewData.detailImages) ? previewData.detailImages : []).filter(Boolean))
          ].filter(Boolean)))
          // 1688 / 表格发布共用 createProductRecord，但各自独立建 SPU：
          // - 1688：每条 pending item（= 每条链接）→ 一个新父商品，绝不按标题/图/货号合并
          // - 表格：合并已在 createProductsFromTable 完成，此处一对一发布
          const creationSource = resolvePendingCreationSource(item.sourceUrl)
          // 优先用事务外预翻译结果；仅当预翻译为空时才在事务内兜底翻译（极少发生）
          const nameEn =
            String(previewData.nameEn || '').trim() ||
            preNameEn ||
            (await resolveEnglishProductTitle(productName))
          const nameEs =
            String(previewData.nameEs || '').trim() ||
            preNameEs ||
            (await resolveSpanishProductTitle(productName, null, nameEn))
          const newProduct = await createProductRecord(tx, {
            categoryId,
            name: productName,
            nameEn,
            nameEs,
            mainImageUrl,
            galleryUrls,
            shortDescription: buildShortDescription(item.productDetail || '', [item.supplierName || '', item.sourceCategoryName || '']),
            price,
            source: creationSource,
            sourceUrl: creationSource === 'IMPORT_1688' ? item.sourceUrl : null,
            status: 'ACTIVE',
            stock: resolveInitialStock(item.availableStock),
            supplierName: item.supplierName || null,
            costPrice: baseCostPrice,
            weightGrams: toNumberOrNull(item.weightGrams),
            goodsStatus: 'ACTIVE',
            detailText: item.productDetail || null,
            parameterJson,
            priceCoefficient: null,
            minOrderQty: resolveInitialMinOrderQty(item.minimumOrderQuantity),
            skuSummaryText: item.skuSummaryText || null,
            skus: pendingSkus,
            linkedCategoryIds,
            brandCategoryId,
            brandMatchKeyword,
            autoBrandMatched: Boolean(brandCategoryId),
          })

          await tx.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: 'COMPLETED' as any,
              publishStatus: 'COMPLETED' as any,
              isPublished: true,
              importedProductId: newProduct.id,
              targetCategoryId: categoryId,
              coefficient: resolvedCoefficient,
              cnyPriceMin: priceSummary.cnyMin,
              cnyPriceMax: priceSummary.cnyMax,
              usdPriceMin: priceSummary.usdMin,
              usdPriceMax: priceSummary.usdMax,
              previewDataJson: {
                ...(previewData || {}),
                categoryId,
                matchedCategoryIds: autoMatchedCategoryIds,
                matchedCategoryNames: rematchedSecondaryCategories.map(category => category.name),
                price: priceSummary.cnyMin ?? (previewData.price || undefined),
                skuTable: pendingSkus.map((sku) => ({
                  skuKey: sku.sku_key,
                  spec: sku.spec_text,
                  costPrice: sku.cost_price,
                  price: sku.price,
                  stock: sku.stock,
                  weightGrams: sku.weight_grams,
                  imageUrl: sku.image_url || undefined,
                  attributes: sku.attributes,
                })),
              } as any,
              publishedAt: new Date(),
              failureReason: null
            }
          })
        })
        return { ok: true as const }
      } catch (error: any) {
        lastError = error
        // 仅对「SPU 编号 / slug」唯一冲突自动重试：并发发布抢占了同一个流水号，
        // 等待其它事务提交后用新号重试，避免把可发布商品误判为「发布失败」。
        if (isSpuCodeCollisionError(error) && attempt < MAX_PUBLISH_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 40 * attempt + Math.floor(Math.random() * 60)))
          continue
        }
        break
      }
      }
      const reason = String(lastError?.message || '发布失败').trim() || '发布失败'
      const name = failureName || itemId
      await prisma.importtaskitem.update({
        where: { id: itemId },
        data: {
          publishStatus: 'FAILED' as any,
          failureReason: reason
        }
      }).catch(() => undefined)
      return { ok: false as const, itemId, name, reason }
    }

    const itemIds = input.itemIds
    let cursor = 0
    const workers = Array.from(
      { length: Math.min(PUBLISH_PENDING_CONCURRENCY, itemIds.length) },
      async () => {
        while (cursor < itemIds.length) {
          const index = cursor++
          const result = await publishOne(itemIds[index])
          if (result.ok) {
            success += 1
          } else {
            fail += 1
            failures.push({ itemId: result.itemId, name: result.name, reason: result.reason })
          }
        }
      },
    )
    await Promise.all(workers)

    return { success_count: success, fail_count: fail, failures }
  })
)

/** 将重新抓取到的 1688 预览写回待上传条目（标题/主图/SKU/价格等） */
const applyReparsed1688PreviewToItem = async (params: {
  item: {
    id: string
    sourceUrl: string
    parsedName: string | null
    mainImageUrl: string | null
    parsedMainImageUrl: string | null
    supplierName: string | null
    productDetail: string | null
    sourceCategoryName: string | null
    targetCategoryId: string | null
    costPrice: any
    availableStock: any
    weightGrams: any
    coefficient: any
    goodsStatus: any
    previewDataJson: any
    skuSummaryText: string | null
    importTask: {
      defaultCategoryId: string | null
      defaultStatus: string | null
      markupRate: any
      stockStrategyJson: any
    }
  }
  fetched: Fetched1688OfferPreview
  categoryMap: Map<string, ImportPricingCategoryMeta>
  secondaryCategories: AutoMatchedSecondaryCategory[]
  exchangeRate: number
}) => {
  const { item, fetched, categoryMap, secondaryCategories, exchangeRate } = params
  const sourceUrl = item.sourceUrl
  const costDeductionUsd = item.importTask.markupRate ? Number(item.importTask.markupRate) : 0
  const strategyStock =
    toNumberOrNull((item.importTask.stockStrategyJson as StockStrategyJson | null)?.stock) ??
    toNumberOrNull(item.availableStock) ??
    100
  const currentPreview = ((item.previewDataJson || {}) as PreviewDataJson)
  const hadMockSkus =
    isClassicMock1688SkuSummary(item.skuSummaryText) ||
    isClassicMock1688SkuTable(currentPreview.skuTable)

  const offerId = extract1688OfferId(sourceUrl) || item.id.slice(0, 6)
  const productName = fetched.name || `[1688抓取] 商品 ${offerId}`
  const hasRealParse = Boolean(
    fetched.name ||
    fetched.mainImageUrl ||
    (Array.isArray(fetched.skuTable) && fetched.skuTable.length > 0),
  )
  const productDetail =
    fetched.productDetail ||
    item.productDetail ||
    (hasRealParse
      ? '自动采集的商品详情，请运营补充图文与说明。'
      : '未能从 1688 页面解析详情（可能被风控/验证码拦截），请确认链接可访问后重试解析。')

  const matchedSecondaryCategories = matchSecondaryCategoriesByTitle(
    productName,
    secondaryCategories,
    productDetail,
  )
  const matchedSecondaryCategoryIds = matchedSecondaryCategories.map(category => category.id)
  const matchedSecondaryCategoryNames = matchedSecondaryCategories.map(category => category.name)
  const secondaryById = new Map(secondaryCategories.map(category => [category.id, category]))
  // 重新解析：主类目只用真实一/二级；Brand 命中不覆盖售价系数 / 主类目
  const targetCategoryId = pickFirstNonBrandCategoryId(
    [
      pickImportPricingTargetCategory(matchedSecondaryCategories, null),
      item.targetCategoryId,
      item.importTask.defaultCategoryId,
      ...matchedSecondaryCategoryIds,
    ],
    categoryMap,
    secondaryById,
  )
  const resolvedCoefficient = resolveImportCategoryCoefficient(categoryMap, targetCategoryId)

  const rawPriceMin = fetched.priceMin ?? toNumberOrNull(item.costPrice) ?? 50
  const rawPriceMax = fetched.priceMax ?? rawPriceMin
  const adjustedCostMin = Math.max(0, roundCurrency(rawPriceMin - costDeductionUsd))
  const adjustedCostMax = Math.max(adjustedCostMin, roundCurrency(rawPriceMax - costDeductionUsd))
  const finalPriceMin = roundCurrency(adjustedCostMin * resolvedCoefficient)
  const finalPriceMax = roundCurrency(adjustedCostMax * resolvedCoefficient)

  const mainImageUrl =
    fetched.mainImageUrl ||
    (!isPlaceholderPendingImage(item.mainImageUrl || item.parsedMainImageUrl)
      ? (item.mainImageUrl || item.parsedMainImageUrl)
      : null)
  // Successful reparse must replace the gallery — merging kept the old flood of duplicates.
  const detailImages = hasRealParse
    ? dedupeImageUrls([
        ...(mainImageUrl ? [mainImageUrl] : []),
        ...(Array.isArray(fetched.detailImages) ? fetched.detailImages : []),
      ]).slice(0, 12)
    : dedupeImageUrls([
        mainImageUrl,
        ...((Array.isArray(currentPreview.detailImages) ? currentPreview.detailImages : []) as string[]),
      ]).slice(0, 12)

  const supplierName =
    fetched.supplierName ||
    (isPlaceholderPendingName(item.parsedName) ? null : item.supplierName)
  const sourceCategoryName = fetched.sourceCategoryName || item.sourceCategoryName || null

  const parsedSkuRows = Array.isArray(fetched.skuTable) ? fetched.skuTable : []
  const colorsEarly =
    Array.isArray(fetched.colors) && fetched.colors.length > 0
      ? fetched.colors
          .map(color => ({
            label: normalizeText(color.label),
            imageUrl: normalizeText(color.imageUrl) || null,
          }))
          .filter(color => color.label)
      : Array.isArray(currentPreview.colors)
        ? currentPreview.colors
        : []
  const sizesByColorEarly =
    fetched.sizesByColor && typeof fetched.sizesByColor === 'object' && Object.keys(fetched.sizesByColor).length > 0
      ? Object.fromEntries(
          Object.entries(fetched.sizesByColor).map(([color, sizes]) => [
            color,
            Array.from(new Set((sizes || []).map(size => normalizeText(size)).filter(Boolean))),
          ]),
        )
      : { ...(currentPreview.sizesByColor || {}) }
  const shouldReplaceSkus =
    parsedSkuRows.length > 0 ||
    hadMockSkus ||
    !Array.isArray(currentPreview.skuTable) ||
    currentPreview.skuTable.length === 0 ||
    (isDefaultOnlySkuTable(currentPreview.skuTable) && colorsEarly.length > 0)
  const sourceSkuRows = shouldReplaceSkus
    ? resolveSkuTableOrExpandFromColors({
        skuTable: parsedSkuRows,
        colors: colorsEarly,
        sizesByColor: sizesByColorEarly,
        costPrice: adjustedCostMin,
        price: finalPriceMin,
        stock: strategyStock,
        weightGrams: toNumberOrNull(item.weightGrams),
      })
    : (currentPreview.skuTable as PreviewSkuTableRow[])
  // 重量自动识别：沿用已存重量优先，缺省时标题/详情提取 → 二级分类兜底 → 500g
  const fallbackWeightGrams = resolveProductWeightGrams({
    text: [productName, productDetail, sourceCategoryName].filter(Boolean).join(' '),
    categoryNames: [...(matchedSecondaryCategoryNames || []), sourceCategoryName],
  })
  const skuTable: PreviewSkuTableRow[] = sourceSkuRows.map((row, index) => {
    const sourceCost = toNumberOrNull(row.costPrice) ?? toNumberOrNull(row.price) ?? rawPriceMin
    const nextCost = Math.max(0, roundCurrency(sourceCost - costDeductionUsd))
    const nextPrice = roundCurrency(nextCost * resolvedCoefficient)
    return {
      skuKey: normalizeText(row.skuKey) || `sku-${index + 1}`,
      spec: normalizeText(row.spec) || formatSpecText(row.attributes || []),
      costPrice: nextCost,
      price: nextPrice,
      stock: resolveInitialStock(toNumberOrNull(row.stock) ?? strategyStock),
      weightGrams: toNumberOrNull(row.weightGrams) ?? toNumberOrNull(item.weightGrams) ?? fallbackWeightGrams,
      imageUrl: normalizeText(row.imageUrl) || null,
      attributes:
        Array.isArray(row.attributes) && row.attributes.length > 0
          ? row.attributes.map(attr => ({
              name: normalizeText(attr.name) || '规格',
              value: normalizeText(attr.value) || '默认',
            }))
          : parseSpecAttributes(row.spec || '默认规格'),
    }
  })

  const colors =
    Array.isArray(fetched.colors) && fetched.colors.length > 0
      ? fetched.colors
          .map(color => ({
            label: normalizeText(color.label),
            imageUrl: normalizeText(color.imageUrl) || null,
          }))
          .filter(color => color.label)
      : parsedSkuRows.length > 0
        ? Array.from(
            new Set(
              skuTable
                .map(sku => sku.attributes?.find(attr => attr.name === '颜色')?.value)
                .filter(Boolean) as string[],
            ),
          ).map(label => ({
            label,
            imageUrl:
              skuTable.find(sku => sku.attributes?.some(attr => attr.name === '颜色' && attr.value === label))
                ?.imageUrl || null,
          }))
        : colorsEarly.length > 0
          ? colorsEarly
          : Array.isArray(currentPreview.colors)
            ? currentPreview.colors
            : []

  const sizesByColor: Record<string, string[]> = { ...sizesByColorEarly }

  if (Object.keys(sizesByColor).length === 0) {
    for (const sku of skuTable) {
      const color = sku.attributes?.find(attr => attr.name === '颜色')?.value
      const size = sku.attributes?.find(attr => attr.name === '尺码')?.value
      if (!color || !size) continue
      const list = sizesByColor[color] || []
      if (!list.includes(size)) list.push(size)
      sizesByColor[color] = list
    }
  }

  const specSummary: SpecSummaryJson[] =
    Array.isArray(fetched.specSummary) && fetched.specSummary.length > 0
      ? fetched.specSummary
      : [
          ...(colors.length ? [{ name: '颜色', values: colors.map(item => item.label) }] : []),
          ...(() => {
            const sizeValues = Array.from(
              new Set(
                [
                  ...Object.values(sizesByColor).flat(),
                  ...skuTable
                    .map(sku => sku.attributes?.find(attr => attr.name === '尺码')?.value)
                    .filter(Boolean),
                ].filter(Boolean) as string[],
              ),
            )
            return sizeValues.length ? [{ name: '尺码', values: sizeValues }] : []
          })(),
        ]
  if (specSummary.length === 0) {
    specSummary.push({ name: '规格', values: ['默认规格'] })
  }

  const skuPrices = skuTable
    .map(sku => toNumberOrNull(sku.price))
    .filter((value): value is number => value !== null)
  const resolvedFinalPriceMin = skuPrices.length ? Math.min(...skuPrices) : finalPriceMin
  const resolvedFinalPriceMax = skuPrices.length ? Math.max(...skuPrices) : finalPriceMax
  const resolvedUsdMin = roundCurrency(resolvedFinalPriceMin / exchangeRate)
  const resolvedUsdMax = roundCurrency(resolvedFinalPriceMax / exchangeRate)
  const totalStock = skuTable.reduce((sum, sku) => sum + (toNumberOrNull(sku.stock) ?? 0), 0)

  const previewData: PreviewDataJson = {
    ...currentPreview,
    name: productName,
    // 重解析同样不在采集阶段翻译（移至上架），保留已有的历史翻译（若有）由 spread 带出
    categoryId: targetCategoryId || undefined,
    matchedCategoryIds: matchedSecondaryCategoryIds,
    matchedCategoryNames: matchedSecondaryCategoryNames,
    price: resolvedFinalPriceMin,
    mainImageUrl: mainImageUrl || undefined,
    detailImages,
    shortDescription: productDetail,
    featureAttributes: fetched.featureAttributes?.length
      ? fetched.featureAttributes
      : currentPreview.featureAttributes || [],
    colors,
    sizesByColor,
    inboundIdentity: {
      mode: 'LINK_1688_INDEPENDENT',
      offerId,
      sourceUrl,
    },
    skuTable,
  }

  await prisma.importtaskitem.update({
    where: { id: item.id },
    data: {
      parsedName: productName,
      supplierName,
      mainImageUrl,
      parsedMainImageUrl: mainImageUrl,
      costPrice: toNumberOrNull(skuTable[0]?.costPrice) ?? adjustedCostMin,
      weightGrams: toNumberOrNull(skuTable[0]?.weightGrams) ?? toNumberOrNull(item.weightGrams) ?? fallbackWeightGrams,
      sourceCategoryName,
      coefficient: resolvedCoefficient,
      goodsStatus: (item.goodsStatus || item.importTask.defaultStatus || 'DRAFT') as any,
      productDetail,
      skuSummaryText: skuTable.map(sku => sku.spec).filter(Boolean).join(' | ') || '默认规格',
      cnyPriceMin: resolvedFinalPriceMin,
      cnyPriceMax: resolvedFinalPriceMax,
      usdPriceMin: resolvedUsdMin,
      usdPriceMax: resolvedUsdMax,
      minimumOrderQuantity: resolveInitialMinOrderQty(
        fetched.minOrderQty ?? (item as any).minimumOrderQuantity,
      ),
      // B：真实库存优先（全 0 即缺货），缺省回落 1000
      availableStock: resolveInitialStock(totalStock),
      targetCategoryId,
      parsedPriceMin: rawPriceMin,
      parsedPriceMax: rawPriceMax,
      specSummaryJson: specSummary as any,
      previewDataJson: previewData as any,
      fetchStatus: 'COMPLETED' as any,
      failureReason: hasRealParse
        ? null
        : FAILURE_REASON_RISK_CONTROL,
      fetchFinishedAt: new Date(),
    },
  })

  return { productName, hasRealParse }
}

const resolveFetchFailureReason = (fetchResult: Fetch1688OfferPreviewResult): string => {
  if (fetchResult.outcome === 'expired') return FAILURE_REASON_EXPIRED
  if (fetchResult.outcome === 'risk_control') return FAILURE_REASON_RISK_CONTROL
  return fetchResult.failureReason || FAILURE_REASON_RISK_CONTROL
}

export const reparsePendingImportItems = requireRole([UserRole.ADMIN])(
  withResult(async (input: ReparsePendingImportItemsInput): Promise<ReparsePendingImportItemsOutput> => {
    if (!input.itemIds.length) {
      throw new Error('请至少选择一条待重新解析的商品')
    }

    const itemIds = Array.from(new Set(input.itemIds.filter(Boolean)))
    const jobLabel = `reparse:${itemIds.length}`
    acquireParseJob(jobLabel, itemIds.length)

    try {
      try {
        await prisma.$executeRawUnsafe('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')
      } catch {
        // ignore charset bootstrap failure
      }

      // Mark claimed rows RUNNING before ACK so the UI can poll without a second mutex trip.
      await prisma.importtaskitem.updateMany({
        where: {
          id: { in: itemIds },
          importedProductId: null,
          isPublished: false,
        },
        data: {
          fetchStatus: 'RUNNING' as any,
          fetchStartedAt: new Date(),
          fetchFinishedAt: null,
          failureReason: null,
        },
      })
    } catch (error) {
      releaseParseJob(jobLabel)
      throw error
    }

    // ACK immediately — full reparse (esp. with browser-captured HTML) exceeds the 25s RPC timeout.
    // Holding the mutex across a sync loop caused "已有解析任务进行中" when the client retried.
    void (async () => {
      let success = 0
      let fail = 0
      try {
        const secondaryCategories = await loadAutoMatchSecondaryCategories(prisma)
        const categoryMap = await loadImportPricingCategories(prisma)
        const exchangeRate = await getGlobalExchangeRate(prisma)

        for (let index = 0; index < itemIds.length; index += 1) {
          if (isParseJobCancelled()) {
            console.warn(`[reparsePendingImportItems] cancelled by user at index=${index}`)
            const remainingIds = itemIds.slice(index)
            if (remainingIds.length) {
              await prisma.importtaskitem.updateMany({
                where: {
                  id: { in: remainingIds },
                  fetchStatus: { in: ['PENDING', 'RUNNING'] as any },
                  isPublished: false,
                },
                data: {
                  fetchStatus: 'RETRY_PENDING' as any,
                  failureReason: '用户终止解析',
                  fetchFinishedAt: new Date(),
                },
              })
            }
            break
          }

          bumpParseJobProgress(index, itemIds.length)
          const itemId = itemIds[index]
          let displayName = itemId

          try {
            const item = await prisma.importtaskitem.findUnique({
              where: { id: itemId },
              include: { importTask: true },
            })

            if (!item) {
              fail += 1
              continue
            }

            displayName =
              normalizeText(item.parsedName) ||
              normalizeText(item.sourceUrl) ||
              itemId

            if (item.isPublished || item.importedProductId) {
              fail += 1
              await prisma.importtaskitem.update({
                where: { id: item.id },
                data: {
                  fetchStatus: 'FAILED' as any,
                  failureReason: '该商品已发布，无法重新解析',
                  fetchFinishedAt: new Date(),
                },
              })
              continue
            }

            if (isTableImportSourceUrl(item.sourceUrl)) {
              fail += 1
              await prisma.importtaskitem.update({
                where: { id: item.id },
                data: {
                  fetchStatus: 'FAILED' as any,
                  failureReason: '表格导入条目不支持重新解析，请直接编辑字段或删除后重新导入',
                  fetchFinishedAt: new Date(),
                },
              })
              continue
            }

            const sourceUrl = normalizeText(item.sourceUrl)
            const is1688OfferUrl = is1688ImportSourceUrl(sourceUrl)
            const isPddUrl = isPinduoduoImportSourceUrl(sourceUrl)
            if (!sourceUrl || (!is1688OfferUrl && !isPddUrl)) {
              fail += 1
              await prisma.importtaskitem.update({
                where: { id: item.id },
                data: {
                  fetchStatus: 'FAILED' as any,
                  failureReason: '无效的商品链接，仅支持 1688 offer 或拼多多 goods_id 链接重新解析',
                  fetchFinishedAt: new Date(),
                },
              })
              continue
            }

            await prisma.importtaskitem.update({
              where: { id: item.id },
              data: {
                fetchStatus: 'RUNNING' as any,
                fetchStartedAt: new Date(),
                fetchFinishedAt: null,
                failureReason: null,
              },
            })

            if (isPddUrl) {
              const fetchResult = await fetchPinduoduoProductPreview(sourceUrl)
              const fetched = fetchResult.preview
              const hasRealParse =
                fetchResult.outcome === 'success' && hasMeaningfulPinduoduoPreview(fetched)
              if (!hasRealParse) {
                const reason =
                  fetchResult.outcome === 'expired'
                    ? '该拼多多商品已下架或不存在'
                    : fetchResult.failureReason || '拼多多风控/抓取失败，请稍后重试'
                await prisma.importtaskitem.update({
                  where: { id: item.id },
                  data: {
                    fetchStatus: 'FAILED' as any,
                    failureReason: reason,
                    fetchFinishedAt: new Date(),
                  },
                })
                fail += 1
              } else {
                await persistPinduoduoParsedItem({
                  item,
                  task: item.importTask as any,
                  fetched,
                  secondaryCategories,
                  categoryMap,
                  exchangeRate,
                })
                success += 1
              }
              continue
            }

            const fetchResult = await fetch1688OfferPreviewDetailed(sourceUrl)
            const fetched = fetchResult.preview
            const hasRealParse = Boolean(
              fetched.name ||
              fetched.mainImageUrl ||
              (Array.isArray(fetched.skuTable) && fetched.skuTable.length > 0),
            )

            if (!hasRealParse) {
              const reason = resolveFetchFailureReason(fetchResult)
              await prisma.importtaskitem.update({
                where: { id: item.id },
                data: {
                  fetchStatus: 'FAILED' as any,
                  failureReason: reason,
                  fetchFinishedAt: new Date(),
                  ...(isClassicMock1688SkuSummary(item.skuSummaryText) ||
                  isClassicMock1688SkuTable(((item.previewDataJson || {}) as PreviewDataJson).skuTable)
                    ? {
                        skuSummaryText: '默认规格',
                        specSummaryJson: [{ name: '规格', values: ['默认规格'] }] as any,
                        previewDataJson: {
                          ...((item.previewDataJson || {}) as PreviewDataJson),
                          colors: [],
                          sizesByColor: {},
                          skuTable: [
                            buildNeutralFallbackSkuRow({
                              costPrice: toNumberOrNull(item.costPrice) ?? 50,
                              price: toNumberOrNull(item.costPrice) ?? 50,
                              stock: resolveInitialStock(item.availableStock),
                            }),
                          ],
                        } as any,
                      }
                    : {}),
                },
              })
              fail += 1
            } else {
              await applyReparsed1688PreviewToItem({
                item: item as any,
                fetched,
                categoryMap,
                secondaryCategories,
                exchangeRate,
              })
              success += 1
            }
          } catch (error: any) {
            fail += 1
            const reason = `重新解析失败：${error?.message || '抓取过程中发生未知错误'}`
            await prisma.importtaskitem.update({
              where: { id: itemId },
              data: {
                fetchStatus: 'FAILED' as any,
                failureReason: reason,
                fetchFinishedAt: new Date(),
              },
            }).catch(() => undefined)
          }

          bumpParseJobProgress(index + 1, itemIds.length)

          if (index < itemIds.length - 1) {
            await sleep(900)
          }
        }

        console.warn(`[reparsePendingImportItems] done success=${success} fail=${fail} total=${itemIds.length}`)
      } catch (error) {
        console.error('[reparsePendingImportItems] background job failed', error)
      } finally {
        releaseParseJob(jobLabel)
      }
    })()

    return { success_count: 0, fail_count: 0, results: [] }
  })
)

export const confirmImportProducts = requireRole([UserRole.ADMIN])(
  withResult(async (input: ConfirmImportProductsInput): Promise<void> => {
    const result = await publishPendingImportItems({ itemIds: input.itemIds })
    if (result.fail_count > 0) {
      const detailLines = (result.failures || [])
        .slice(0, 5)
        .map(item => `${item.name}：${item.reason}`)
      const detailSuffix = detailLines.length > 0 ? `。${detailLines.join('；')}` : ''
      throw new Error(
        `部分待上传商品发布失败，成功 ${result.success_count} 条，失败 ${result.fail_count} 条${detailSuffix}`,
      )
    }
  })
)

export const retryImportTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: RetryImportTaskInput): Promise<void> => {
    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId },
      include: { items: true }
    })

    if (!task) throw new Error('未找到任务记录')
    if (!['FAILED', 'COMPLETED', 'PARTIAL_SUCCESS', 'RATE_LIMITED'].includes(task.status)) {
      throw new Error('只有已完成、失败或限流的任务可重试')
    }

    await prisma.$transaction(async tx => {
      await tx.importtask.update({
        where: { id: input.taskId },
        data: {
          status: 'RETRY_PENDING' as any,
          successCount: 0,
          failureCount: 0,
          progressPercent: 0,
          lastRateLimitedAt: null,
          startedAt: null,
          finishedAt: null
        }
      })

      await tx.importtaskitem.updateMany({
        where: { importTaskId: input.taskId },
        data: {
          parsedName: null,
          parsedMainImageUrl: null,
          parsedPriceMin: null,
          parsedPriceMax: null,
          supplierName: null,
          mainImageUrl: null,
          costPrice: null,
          weightGrams: null,
          sourceCategoryName: null,
          coefficient: null,
          productDetail: null,
          skuSummaryText: null,
          cnyPriceMin: null,
          cnyPriceMax: null,
          usdPriceMin: null,
          usdPriceMax: null,
          minimumOrderQuantity: DEFAULT_MIN_ORDER_QTY,
          // 重置为待解析：库存留空，真解析回填或使用时回落 1000
          availableStock: null,
          specSummaryJson: undefined,
          previewDataJson: undefined,
          fetchStatus: 'PENDING' as any,
          publishStatus: 'PENDING' as any,
          failureReason: null,
          importedProductId: null,
          isPublished: false,
          publishedAt: null,
          fetchStartedAt: null,
          fetchFinishedAt: null,
          isSelected: true
        }
      })
    })
  })
)

export const deleteImportTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteImportTaskInput): Promise<void> => {
    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId }
    })

    if (!task) throw new Error('未找到任务记录')
    if (!['FAILED', 'COMPLETED', 'PARTIAL_SUCCESS', 'RATE_LIMITED'].includes(task.status)) {
      throw new Error('仅允许删除已完成、部分成功、失败或限流的任务记录')
    }

    await prisma.$transaction(async tx => {
      await tx.importtaskitem.deleteMany({ where: { importTaskId: input.taskId } })
      await tx.importtask.delete({ where: { id: input.taskId } })
    })
  })
)
