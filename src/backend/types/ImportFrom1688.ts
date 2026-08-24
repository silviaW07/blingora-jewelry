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
  categoryId?: string
  matchedCategoryIds?: string[]
  matchedCategoryNames?: string[]
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
  productName: string
  weight: string
  costPrice: number | null
  imageUrl: string
  detail: string
  categoryId: string
  brand: string
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
}

export interface CreateProductsFromTableOutput {
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
  item_costPrice: number | null
  item_weightGrams: number | null
  item_sourceCategoryName: string | null
  item_targetCategoryId: string | null
  item_matchedCategoryIds: string[]
  item_matchedCategoryNames: string[]
  item_coefficient: number | null
  item_goodsStatus: string | null
  item_productDetail: string | null
  /** 1688 参数属性（材质/Material 等） */
  item_featureAttributes?: Array<{ key: string; value: string }>
  item_skuSummaryText: string | null
  item_galleryUrls?: string[]
  item_cnyPriceMin: number | null
  item_cnyPriceMax: number | null
  item_usdPriceMin: number | null
  item_usdPriceMax: number | null
  item_minimumOrderQuantity: number | null
  item_availableStock: number | null
  item_parsedName: string | null
  item_parsedMainImageUrl: string | null
  item_createdAt: Date
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
  createdCount?: number
  skippedDuplicateCount?: number
  categoryUrlCount?: number
}

export interface StartParseTaskInput {
  taskId: string
}

export interface UpdateTaskItemPreviewInput {
  itemId: string
  previewData: PreviewDataJson
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

export interface GetPendingImportQueueOutput {
  activeTask: PendingImportQueueTaskSummary | null
  list: PendingImportItemRecord[]
  total: number
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

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/backend/action_utils'

const makeUniqueProductIdentifiers = () => {
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
  return {
    productCode: `IMP-${uniqueSuffix}`,
    slug: `p-${uniqueSuffix}`,
    skuCode: `SKU-${uniqueSuffix}`
  }
}

const normalizeText = (value: unknown) => String(value ?? '').trim()

const parseDecimal = (value: unknown) => {
  const normalized = normalizeText(value).replace(/[¥,，\s]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

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

const buildPendingItemStructure = (item: any, task?: any): PendingImportItemRecord => ({
  item_id: item.id,
  item_importTaskId: item.importTaskId,
  item_sourceUrl: item.sourceUrl,
  item_fetchStatus: (item.fetchStatus as ImportTaskItemFetchStatusType) || 'PENDING',
  item_publishStatus: (item.publishStatus as ImportTaskItemPublishStatusType) || 'PENDING',
  item_isPublished: Boolean(item.isPublished),
  item_importedProductId: item.importedProductId || null,
  item_failureReason: item.failureReason || null,
  item_productName: item.productName || item.parsedName || null,
  item_supplierName: item.supplierName || null,
  item_mainImageUrl: item.mainImageUrl || item.parsedMainImageUrl || null,
  item_costPrice: toNumberOrNull(item.costPrice),
  item_weightGrams: toNumberOrNull(item.weightGrams),
  item_sourceCategoryName: item.sourceCategoryName || null,
  item_targetCategoryId: item.targetCategoryId || task?.defaultCategoryId || null,
  item_coefficient: toNumberOrNull(item.coefficient),
  item_goodsStatus: (item.goodsStatus as ProductStatusType) || ((task?.defaultStatus as ProductStatusType) || 'DRAFT'),
  item_productDetail: item.productDetail || null,
  item_skuSummaryText: item.skuSummaryText || null,
  item_cnyPriceMin: toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin),
  item_cnyPriceMax: toNumberOrNull(item.cnyPriceMax ?? item.parsedPriceMax),
  item_usdPriceMin: toNumberOrNull(item.usdPriceMin),
  item_usdPriceMax: toNumberOrNull(item.usdPriceMax),
  item_minimumOrderQuantity: item.minimumOrderQuantity ?? null,
  item_availableStock: item.availableStock ?? null,
  item_parsedName: item.parsedName || null,
  item_parsedMainImageUrl: item.parsedMainImageUrl || null,
  item_createdAt: item.createdAt
})

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

const loadPendingImportQueueSnapshot = async (): Promise<PendingImportQueueSnapshot> => {
  const activeTask = await prisma.importtask.findFirst({
    where: {
      status: {
        in: ['PENDING', 'RUNNING', 'RATE_LIMITED', 'RETRY_PENDING', 'PARTIAL_SUCCESS'] as any
      }
    },
    orderBy: [{ createdAt: 'desc' }]
  })

  const fallbackTask = activeTask
    ? activeTask
    : await prisma.importtask.findFirst({
        orderBy: [{ createdAt: 'desc' }]
      })

  const items = await prisma.importtaskitem.findMany({
    where: {
      isPublished: false,
      importedProductId: null,
      OR: [
        { fetchStatus: 'COMPLETED' as any },
        { publishStatus: { in: ['FAILED', 'PENDING', 'RUNNING'] as any } },
        { fetchStatus: { in: ['PENDING', 'RUNNING', 'FAILED', 'RATE_LIMITED', 'RETRY_PENDING'] as any } }
      ]
    },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      importTask: true
    }
  })

  return {
    activeTask: fallbackTask ? buildPendingTaskSummary(fallbackTask) : null,
    items: items.map(item => buildPendingItemStructure(item, item.importTask))
  }
}

const createProductRecord = async (tx: any, params: {
  categoryId: string
  name: string
  mainImageUrl: string
  shortDescription: string
  price: number
  source: ProductCreationSourceType
  status?: ProductStatusType
  stock?: number
  supplierName?: string | null
  costPrice?: number | null
  weightGrams?: number | null
  goodsStatus?: ProductStatusType | null
  detailText?: string | null
  priceCoefficient?: number | null
  minOrderQty?: number | null
  skuSummaryText?: string | null
}) => {
  const identifiers = makeUniqueProductIdentifiers()

  return tx.product.create({
    data: {
      categoryId: params.categoryId,
      name: params.name,
      slug: identifiers.slug,
      productCode: identifiers.productCode,
      source: params.source as any,
      status: (params.status || 'DRAFT') as any,
      supplierName: params.supplierName || null,
      goodsStatus: (params.goodsStatus && params.goodsStatus !== 'DRAFT' ? params.goodsStatus : undefined) as any,
      weightGram: params.weightGrams ?? null,
      costPrice: params.costPrice ?? null,
      priceCoefficient: params.priceCoefficient ?? null,
      detailText: params.detailText || null,
      mainImageUrl: params.mainImageUrl,
      galleryJson: [{ url: params.mainImageUrl, sort: 1 }],
      shortDescription: params.shortDescription,
      tradeInfoJson: params.minOrderQty ? { minOrderQty: params.minOrderQty } : undefined,
      skus: {
        create: [{
          skuCode: identifiers.skuCode,
          imageUrl: params.mainImageUrl,
          price: params.price,
          stock: params.stock ?? 0,
          stockStatus: (params.stock ?? 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          attributeJson: params.skuSummaryText ? [{ name: '来源SKU', value: params.skuSummaryText }] : []
        }]
      }
    }
  })
}

// ===== Actions =====

export const getCategoryOptions = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<GetCategoryOptionsOutput> => {
    const categories = await prisma.category.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, parentId: true, level: true },
      orderBy: [{ level: 'asc' }, { sortWeight: 'desc' }, { name: 'asc' }]
    })

    const nameById = new Map(categories.map(c => [c.id, c.name]))

    return {
      list: categories.map(c => ({
        category_id: c.id,
        category_name: c.name,
        parent_id: c.parentId,
        level: c.level,
        parent_name: c.parentId ? (nameById.get(c.parentId) || null) : null
      }))
    }
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

export const getPendingImportQueue = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<GetPendingImportQueueOutput> => {
    try {
      const inconsistentPublishedItems = await prisma.importtaskitem.findMany({
        where: {
          importedProductId: { not: null },
          OR: [
            { isPublished: false },
            { publishStatus: { not: 'COMPLETED' as any } },
            { fetchStatus: { not: 'COMPLETED' as any } },
            { publishedAt: null }
          ]
        },
        select: {
          id: true,
          importedProductId: true,
          fetchStatus: true,
          publishStatus: true,
          publishedAt: true
        }
      })

      const recoveryOperations = inconsistentPublishedItems.flatMap(item => {
        const recoveryData = buildPublishedImportItemRecoveryData(item)
        if (!recoveryData) {
          return []
        }

        return prisma.importtaskitem.update({
          where: { id: item.id },
          data: recoveryData
        })
      })

      if (recoveryOperations.length > 0) {
        await prisma.$transaction(recoveryOperations)
      }
    } catch (error) {
      console.error('[getPendingImportQueue] failed to repair published import items, fallback to queue snapshot', error)
    }

    const snapshot = await loadPendingImportQueueSnapshot()

    return {
      activeTask: snapshot.activeTask,
      list: snapshot.items,
      total: snapshot.items.length
    }
  })
)

export const parseTableImportContent = requireRole([UserRole.ADMIN])(
  withResult(async (input: ParseTableImportInput): Promise<ParseTableImportOutput> => {
    const content = normalizeText(input.content)
    if (!content) {
      throw new Error('请先粘贴表格内容')
    }

    const rows = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const columns = line.split('\t').map(value => value.trim())
        const [productName = '', weight = '', costPriceText = '', imageUrl = '', detail = '', categoryId = '', brand = ''] = columns
        return {
          rowId: `row-${index + 1}`,
          productName,
          weight,
          costPrice: parseDecimal(costPriceText),
          imageUrl,
          detail,
          categoryId,
          brand
        }
      })

    return { rows }
  })
)

export const createImportTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateImportTaskInput): Promise<CreateImportTaskOutput> => {
    const { userId } = getAuthContext()
    const rawUrls = input.urls.split('\n').map(u => u.trim()).filter(Boolean)
    const uniqueUrls = Array.from(new Set(rawUrls))

    if (uniqueUrls.length === 0) {
      throw new Error('请输入有效的商品链接')
    }

    const validUrls = uniqueUrls.filter(u => u.startsWith('http://') || u.startsWith('https://'))
    if (validUrls.length === 0) {
      throw new Error('链接格式不正确，需以 http 或 https 开头')
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
          sourceLinkCount: validUrls.length,
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

      await tx.importtaskitem.createMany({
        data: validUrls.map(url => ({
          importTaskId: newTask.id,
          operatorId: userId,
          sourceUrl: url,
          isSelected: true,
          fetchStatus: 'PENDING' as any,
          publishStatus: 'PENDING' as any,
          isPublished: false,
          targetCategoryId: input.defaultCategoryId || null,
          goodsStatus: (input.defaultStatus || 'DRAFT') as any
        }))
      })

      return newTask
    })

    return { taskId: task.id }
  })
)

export const startParseTask = requireRole([UserRole.ADMIN])(
  withResult(async (input: StartParseTaskInput): Promise<void> => {
    const task = await prisma.importtask.findUnique({
      where: { id: input.taskId },
      include: { items: { orderBy: { createdAt: 'asc' } } }
    })

    if (!task) throw new Error('未找到该导入任务')
    if (!['PENDING', 'RETRY_PENDING', 'RATE_LIMITED'].includes(task.status)) throw new Error('当前任务状态不允许开始解析')

    const startedAt = new Date()
    await prisma.importtask.update({
      where: { id: task.id },
      data: { status: 'RUNNING', startedAt, finishedAt: null }
    })

    let successCount = 0
    let failureCount = 0
    let rateLimitedCount = 0
    const markupRateNum = task.markupRate ? Number(task.markupRate) : 0
    const { minDelaySec, maxDelaySec } = getTaskDelayWindow(task)

    for (let index = 0; index < task.items.length; index += 1) {
      const item = task.items[index]
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
        const sourceUrl = item.sourceUrl || ''
        const is1688OfferUrl = /1688\.com\/.*offer\/\d+/i.test(sourceUrl) || /detail\.1688\.com\/offer\/\d+/i.test(sourceUrl)
        const looksOffline = /offline|下架|sold.?out|removed/i.test(sourceUrl)
        const looksTimeout = /timeout|error|超时/i.test(sourceUrl)
        const looksRateLimited = /rate-limit|限流/i.test(sourceUrl)

        if (looksRateLimited) {
          rateLimitedCount += 1
          const now = new Date()
          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: 'RATE_LIMITED' as any,
              failureReason: '解析失败：触发1688限流，请稍后重试',
              fetchFinishedAt: now
            }
          })
          await prisma.importtask.update({
            where: { id: task.id },
            data: { lastRateLimitedAt: now }
          })
        } else if (!is1688OfferUrl) {
          failureCount += 1
          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: 'FAILED' as any,
              failureReason: '解析失败：链接错误，请粘贴有效的1688商品详情页链接（如 https://detail.1688.com/offer/xxxx.html）',
              fetchFinishedAt: new Date()
            }
          })
        } else if (looksOffline) {
          failureCount += 1
          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: 'FAILED' as any,
              failureReason: '解析失败：该1688商品已下架',
              fetchFinishedAt: new Date()
            }
          })
        } else if (looksTimeout) {
          failureCount += 1
          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: 'FAILED' as any,
              failureReason: '解析失败：网络超时，请稍后重试',
              fetchFinishedAt: new Date()
            }
          })
        } else {
          successCount += 1
          const basePrice = 50 + Math.floor(Math.random() * 50)
          const finalPrice = Number((basePrice * (1 + markupRateNum / 100)).toFixed(2))
          const usdMin = Number((basePrice / 7.2).toFixed(2))
          const usdMax = Number(((basePrice + 20) / 7.2).toFixed(2))
          const previewData: PreviewDataJson = {
            name: `[1688抓取] 工业配件 ${item.id.slice(0, 6)}`,
            categoryId: task.defaultCategoryId || undefined,
            price: finalPrice,
            mainImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
            shortDescription: '自动抓取的商品简介内容，请根据需要修改。'
          }

          await prisma.importtaskitem.update({
            where: { id: item.id },
            data: {
              parsedName: previewData.name,
              supplierName: '1688 默认供应商',
              mainImageUrl: previewData.mainImageUrl,
              parsedMainImageUrl: previewData.mainImageUrl,
              costPrice: basePrice,
              weightGrams: 500,
              sourceCategoryName: '1688工业配件',
              coefficient: 1,
              goodsStatus: (task.defaultStatus || 'DRAFT') as any,
              productDetail: '自动采集的商品详情，请运营补充图文与说明。',
              skuSummaryText: '标准版 / 默认规格',
              cnyPriceMin: basePrice,
              cnyPriceMax: basePrice + 20,
              usdPriceMin: usdMin,
              usdPriceMax: usdMax,
              minimumOrderQuantity: 1,
              availableStock: 100,
              targetCategoryId: task.defaultCategoryId || null,
              parsedPriceMin: basePrice,
              parsedPriceMax: basePrice + 20,
              specSummaryJson: [{ name: '规格', values: ['标准版'] }] as any,
              previewDataJson: previewData as any,
              fetchStatus: 'COMPLETED' as any,
              failureReason: null,
              fetchFinishedAt: new Date()
            }
          })
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
      const progressPercent = Math.min(100, Math.round((processedCount / task.items.length) * 100))
      await prisma.importtask.update({
        where: { id: task.id },
        data: {
          successCount,
          failureCount: failureCount + rateLimitedCount,
          progressPercent,
          lastScheduledAt: new Date()
        }
      })

      if (index < task.items.length - 1) {
        await sleep(randomDelayMs(minDelaySec, maxDelaySec))
      }
    }

    const totalFailures = failureCount + rateLimitedCount
    const finishedAt = new Date()
    let finalStatus: ImportTaskStatusType = 'COMPLETED'
    if (successCount === 0 && totalFailures > 0) {
      finalStatus = rateLimitedCount > 0 && failureCount === 0 ? 'RATE_LIMITED' : 'FAILED'
    } else if (totalFailures > 0) {
      finalStatus = 'PARTIAL_SUCCESS'
    }

    await prisma.importtask.update({
      where: { id: task.id },
      data: {
        status: finalStatus as any,
        successCount,
        failureCount: totalFailures,
        progressPercent: 100,
        finishedAt
      }
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
      case 'product_name':
        if (!rawValue) throw new Error('商品名称不能为空')
        data.productName = rawValue
        data.parsedName = rawValue
        break
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
      case 'target_category_id':
        data.targetCategoryId = String(rawValue || '') || null
        break
      case 'coefficient':
        if (numericValue === null || numericValue <= 0) throw new Error('系数必须大于0')
        data.coefficient = numericValue
        break
      case 'goods_status':
        if (!['DRAFT', 'ACTIVE', 'INACTIVE'].includes(String(rawValue))) throw new Error('货物状态无效')
        data.goodsStatus = rawValue as any
        break
      case 'weight_grams':
        if (numericValue === null || numericValue <= 0) throw new Error('重量必须大于0')
        data.weightGrams = numericValue
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
        if (numericValue === null || numericValue <= 0) throw new Error('起订量必须大于0')
        data.minimumOrderQuantity = Math.round(numericValue)
        break
      case 'available_stock':
        if (numericValue === null || numericValue < 0) throw new Error('可用库存不能小于0')
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

    await prisma.importtaskitem.update({
      where: { id: input.itemId },
      data
    })
  })
)

export const publishPendingImportItems = requireRole([UserRole.ADMIN])(
  withResult(async (input: PublishPendingImportItemsInput): Promise<PublishPendingImportItemsOutput> => {
    if (!input.itemIds.length) {
      throw new Error('请至少选择一条待上传商品')
    }

    let success = 0
    let fail = 0
    const failures: PublishPendingImportFailure[] = []

    for (const itemId of input.itemIds) {
      let failureName = ''
      try {
        await prisma.$transaction(async tx => {
          const item = await tx.importtaskitem.findUnique({
            where: { id: itemId },
            include: { importTask: true }
          })

          if (!item) throw new Error('待上传明细不存在')
          failureName = String(item.parsedName || item.sourceUrl || itemId).trim()
          const recoveredPublishedData = buildPublishedImportItemRecoveryData(item)
          if (recoveredPublishedData) {
            await tx.importtaskitem.update({
              where: { id: item.id },
              data: recoveredPublishedData
            })
            throw new Error('该商品已发布')
          }
          if (item.isPublished) throw new Error('该商品已发布')
          if (item.fetchStatus !== 'COMPLETED') throw new Error('仅可发布采集完成的商品')

          const productName = item.parsedName || ''
          const mainImageUrl = item.mainImageUrl || item.parsedMainImageUrl || ''
          const categoryId = item.targetCategoryId || item.importTask.defaultCategoryId || ''
          const cnyMin = toNumberOrNull(item.cnyPriceMin ?? item.parsedPriceMin)
          const cnyMax = toNumberOrNull(item.cnyPriceMax ?? item.parsedPriceMax)
          const price = cnyMin ?? cnyMax ?? toNumberOrNull((item.previewDataJson as any)?.price)

          if (!productName.trim()) throw new Error('商品名称不能为空')
          if (!mainImageUrl.trim()) throw new Error('主图不能为空')
          if (!categoryId) throw new Error('请选择目标分类')
          if (price === null || price < 0) throw new Error('请补充有效售价区间')

          await tx.importtaskitem.update({
            where: { id: itemId },
            data: {
              publishStatus: 'RUNNING' as any,
              failureReason: null
            }
          })

          const newProduct = await createProductRecord(tx, {
            categoryId,
            name: productName,
            mainImageUrl,
            shortDescription: buildShortDescription(item.productDetail || '', [item.supplierName || '', item.sourceCategoryName || '']),
            price,
            source: 'IMPORT_1688',
            status: (item.goodsStatus as ProductStatusType) || (item.importTask.defaultStatus as ProductStatusType) || 'DRAFT',
            stock: item.availableStock ?? 0,
            supplierName: item.supplierName || null,
            costPrice: toNumberOrNull(item.costPrice),
            weightGrams: toNumberOrNull(item.weightGrams),
            goodsStatus: (item.goodsStatus as ProductStatusType) || null,
            detailText: item.productDetail || null,
            priceCoefficient: toNumberOrNull(item.coefficient),
            minOrderQty: item.minimumOrderQuantity ?? null,
            skuSummaryText: item.skuSummaryText || null
          })

          await tx.importtaskitem.update({
            where: { id: item.id },
            data: {
              fetchStatus: 'COMPLETED' as any,
              publishStatus: 'COMPLETED' as any,
              isPublished: true,
              importedProductId: newProduct.id,
              publishedAt: new Date(),
              failureReason: null
            }
          })
        })
        success += 1
      } catch (error: any) {
        fail += 1
        const reason = String(error?.message || '发布失败').trim() || '发布失败'
        failures.push({ itemId, name: failureName || itemId, reason })
        await prisma.importtaskitem.update({
          where: { id: itemId },
          data: {
            publishStatus: 'FAILED' as any,
            failureReason: reason
          }
        }).catch(() => undefined)
      }
    }

    return { success_count: success, fail_count: fail, failures }
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
          minimumOrderQuantity: null,
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
