'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ImportFrom1688, ProductManagement } from '@/backend/route-params'
import type {
  ProductStatusType,
  ImportTaskStatusType,
  CategoryOption,
  ImportTaskRecord,
  PendingImportItemRecord,
  PendingImportQueueTaskSummary
} from '@/backend/actions/ImportFrom1688'
import {
  getCategoryOptions,
  getImportTaskList,
  getPendingImportQueue,
  createImportTask,
  startParseTask,
  inlineUpdatePendingImportItemField,
  publishPendingImportItems,
  retryImportTask,
  deleteImportTask,
  createProductsFromTable,
  updatePendingImportGallery
} from '@/backend/actions/ImportFrom1688'
import type { TableImportDraftRow as ActionTableImportDraftRow } from '@/backend/actions/ImportFrom1688'
import { upload_project_files } from '@/tools/tools'
import type { ChangeEvent } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import {
  resolveTableImportColorSpec,
  TABLE_IMPORT_SPEC_HEADER_ALIASES,
  isTableImportCategoryHeader,
} from '@/shared/tableImportSpec'

interface CreateFormFields {
  urls: string
  defaultCategoryId: string
  costDeductionUsd: number | ''
  defaultStatus: ProductStatusType
  stockStrategyStock: number | ''
}

type ImportFailureKind = 'FETCH' | 'PUBLISH'

interface ImportFailureSummary {
  kind: ImportFailureKind
  title: string
  description: string
  actionText: string
}

interface EditItemFormFields {
  name: string
  categoryId: string
  priceMin: number | ''
  priceMax: number | ''
  mainImageUrl: string
  supplierName: string
  sourceCategoryName: string
  coefficient: number | ''
  productDetail: string
  skuSummaryText: string
}

interface TableImportFormFields {
  content: string
  selectedFileName: string
  importSource: 'paste' | 'file'
}

interface ImageUploadFormFields {
  items: LocalImageImportDraftItem[]
}

interface LocalImageImportDraftItem {
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

interface ManualFormFields {
  productName: string
  supplier: string
  categoryId: string
  brand: string
  weight: string
  costPrice: number | ''
  imageUrl: string
  detail: string
}

interface TableImportDraftRow {
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
  costPrice?: number | null
  imageUrl?: string
  detail?: string
}

interface ManualProductInput {
  productName: string
  supplier: string
  categoryId: string
  brand: string
  weight: string
  costPrice: number
  imageUrl: string
  detail: string
}

export interface FeedbackDialogState {
  open: boolean
  variant: 'error' | 'success' | 'info'
  title: string
  description: string
  details: string[]
}

export interface ImportFrom1688State {
  activeTab: string
  categoryOptions: CategoryOption[]
  isRefreshing: boolean
  createForm: CreateFormFields
  isSubmitting: boolean
  isParsingTask: boolean
  /** Task waiting for local HTML capture +「开始解析」; null when none. */
  pendingParseTaskId: string | null
  currentTask: PendingImportQueueTaskSummary | null
  currentItems: PendingImportItemRecord[]
  createFormCategoryWarning: string | null
  isLoadingDetail: boolean
  activeItemId: string | null
  selectedItemIds: string[]
  isConfirmingImport: boolean
  editForm: EditItemFormFields
  isSavingCorrection: boolean
  historyStatusFilter: ImportTaskStatusType | 'ALL'
  historyPage: number
  historyList: ImportTaskRecord[]
  historyTotal: number
  isLoadingHistory: boolean
  totalPages: number
  selectableItems: PendingImportItemRecord[]
  isAllSelected: boolean
  activeItemDetails: PendingImportItemRecord | undefined
  activeItemFailureSummary: ImportFailureSummary | null
  taskId: string | undefined
  creationMode: '1688' | 'table' | 'manual'
  tableImportForm: TableImportFormFields
  tableImportRows: TableImportDraftRow[]
  isParsingTableImport: boolean
  isSubmittingTableImport: boolean
  imageUploadForm: ImageUploadFormFields
  isCreatingImageDraft: boolean
  manualForm: ManualFormFields
  isSubmittingManual: boolean
  pendingImageUploadingId: string | null
  /** 正在对主图做水印马赛克的待上传项 id */
  pendingWatermarkProcessingId: string | null
  feedbackDialog: FeedbackDialogState
}

export interface ImportFrom1688Handlers {
  setActiveTab: (tab: string) => void
  handleGlobalRefresh: () => Promise<void>
  handleCreateFormChange: <K extends keyof CreateFormFields>(field: K, value: CreateFormFields[K]) => void
  handleEditFormChange: <K extends keyof EditItemFormFields>(field: K, value: EditItemFormFields[K]) => void
  handleCreateTask: () => Promise<void>
  handleStartParseTask: (taskId?: string) => Promise<void>
  handleToggleSelectAll: (checked: boolean) => void
  handleToggleSelectItem: (id: string, checked: boolean) => void
  setActiveItemId: (id: string | null) => void
  handleSaveCorrection: () => Promise<void>
  handleConfirmImport: () => Promise<void>
  handleRetryTask: (id: string) => Promise<void>
  handleDeleteTask: (id: string) => Promise<void>
  setHistoryStatusFilter: (status: ImportTaskStatusType | 'ALL') => void
  setHistoryPage: (page: number | ((prev: number) => number)) => void
  setCreationMode: (mode: '1688' | 'table' | 'manual') => void
  handleTableImportFormChange: <K extends keyof TableImportFormFields>(field: K, value: TableImportFormFields[K]) => void
  handleSelectTableFile: (file: File | null) => Promise<void>
  handleParseTableImport: () => Promise<void>
  handleTableRowChange: <K extends keyof TableImportDraftRow>(rowId: string, field: K, value: TableImportDraftRow[K]) => void
  handleDeleteTableRow: (rowId: string) => void
  handleCreateProductsFromTable: () => Promise<void>
  handleSelectImageFiles: (files: FileList | null) => Promise<void>
  handleImageDraftFieldChange: <K extends keyof LocalImageImportDraftItem>(rowId: string, field: K, value: LocalImageImportDraftItem[K]) => void
  handleDeleteImageDraftItem: (rowId: string) => void
  handleAppendImageDraftsToManual: () => void
  handleManualFormChange: <K extends keyof ManualFormFields>(field: K, value: ManualFormFields[K]) => void
  handleCreateManualProduct: () => Promise<void>
  handleUploadPendingImages: (itemId: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  handleRemovePendingImage: (itemId: string, imageIndex: number) => Promise<void>
  /** 对当前主图角区马赛克（覆盖 1688 水印），写回自建图床并更新图库 */
  handleProcessCurrentImageWatermark: (itemId: string) => Promise<void>
  /** 将图库缩略图设为当前主图（便于「处理当前图」） */
  handleSetCurrentPendingImage: (itemId: string, imageIndex: number) => void
  dismissFeedbackDialog: () => void
}

const emptyManualForm: ManualFormFields = {
  productName: '',
  supplier: '',
  categoryId: '',
  brand: '',
  weight: '',
  costPrice: '',
  imageUrl: '',
  detail: ''
}

const supportedTableExtensions = ['csv', 'txt', 'tsv', 'xlsx', 'xls']
const supportedImageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp']

const formatParseFailureReason = (reason: string | null | undefined) => {
  const normalized = (reason || '').trim()
  if (!normalized) return '解析失败：未知原因，请检查链接后重试'
  if (normalized.startsWith('解析失败')) return normalized
  // 风控/验证码必须先于「链接」宽匹配，避免「链接已失效」或含「链接」的文案被误标为链接错误
  if (/风控|验证码|captcha|punish|_____tmd_____|人机|访问受限|被挤爆/i.test(normalized)) {
    return '解析失败：风控拦截，请稍后重试（可能需要 Cookie 或代理）'
  }
  if (/链接已失效|已失效|商品不存在|找不到该商品|商品已删除/i.test(normalized)) {
    return '解析失败：链接已失效'
  }
  if (/下架|sold.?out|removed|offline/i.test(normalized)) return '解析失败：该1688商品已下架'
  if (/超时|timeout|network|网络/i.test(normalized)) return '解析失败：网络超时，请稍后重试'
  if (/限流|rate.?limit/i.test(normalized)) return '解析失败：触发1688限流，请稍后重试'
  if (/链接错误|无效的.?1688|url.*格式|格式.*url/i.test(normalized)) {
    return '解析失败：链接错误，请粘贴有效的1688商品详情页链接'
  }
  return `解析失败：${normalized}`
}

const formatPublishFailureReason = (reason: string | null | undefined) => {
  const normalized = (reason || '').trim()
  if (!normalized) return '发布失败：未知原因，请检查商品信息后重试'
  if (normalized.startsWith('发布失败')) return normalized
  return `发布失败：${normalized}`
}

const classifyImportFailure = (item: PendingImportItemRecord | undefined): ImportFailureSummary | null => {
  if (!item) return null

  if (item.item_publishStatus === 'FAILED') {
    const reason = formatPublishFailureReason(item.item_failureReason)
    return {
      kind: 'PUBLISH',
      title: reason,
      description: '当前商品已经解析完成，但发布到商品库时失败。请在右侧修正区补齐缺失字段后重新发布。',
      actionText: '补齐字段后重新发布'
    }
  }

  if (item.item_fetchStatus === 'FAILED' || item.item_fetchStatus === 'RATE_LIMITED') {
    const reason = formatParseFailureReason(item.item_failureReason)
    return {
      kind: 'FETCH',
      title: reason,
      description: '该条链接在抓取或解析阶段失败，商品不会进入可发布状态。请检查链接后重试任务。',
      actionText: '重试抓取此项'
    }
  }

  const normalizedReason = (item.item_failureReason || '').trim()
  if (!normalizedReason) return null

  if (normalizedReason.includes('请选择目标分类')) {
    return {
      kind: 'PUBLISH',
      title: formatPublishFailureReason(normalizedReason),
      description: '当前商品已经解析完成，但在发布到商品库时缺少必要字段或触发校验失败。请在右侧修正区补齐后重新发布。',
      actionText: '补齐字段后重新发布'
    }
  }

  return {
    kind: 'FETCH',
    title: formatParseFailureReason(normalizedReason),
    description: '该条链接在抓取或解析阶段失败，请检查链接是否可访问，或稍后重试。',
    actionText: '重试抓取此项'
  }
}

const isTaskStillParsing = (status?: ImportTaskStatusType | null) =>
  !!status && ['PENDING', 'RUNNING', 'RETRY_PENDING'].includes(status)

const validate1688Urls = (raw: string): { ok: true; urls: string[] } | { ok: false; message: string } => {
  const lines = raw.split(/\r?\n/).map(v => v.trim()).filter(Boolean)
  if (lines.length === 0) {
    return { ok: false, message: '解析失败：请先粘贴1688商品链接' }
  }

  const invalid = lines.find(line => {
    try {
      const url = new URL(line)
      return !(url.protocol === 'http:' || url.protocol === 'https:')
    } catch {
      return true
    }
  })

  if (invalid) {
    return { ok: false, message: '解析失败：链接错误，需以 http 或 https 开头' }
  }

  return { ok: true, urls: lines }
}

const readFileAsText = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
  reader.onerror = () => reject(new Error(`文件读取失败：${file.name}`))
  reader.readAsText(file)
})

const readFileAsArrayBuffer = (file: File) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => {
    if (reader.result instanceof ArrayBuffer) resolve(reader.result)
    else reject(new Error(`文件读取失败：${file.name}`))
  }
  reader.onerror = () => reject(new Error(`文件读取失败：${file.name}`))
  reader.readAsArrayBuffer(file)
})

const isExcelExtension = (extension: string) => ['xlsx', 'xls'].includes(extension)

const productPriceHeaderAliases = new Set(['产品价格', '售价', '价格', 'price'])

const normalizeCommaText = (raw: unknown) => String(raw ?? '').replace(/，/g, ',')

const preserveProductPriceRaw = (value: unknown) => normalizeCommaText(value).trim()

/** 预览阶段：价格列只保留原始字符串，不做任何数值解析 */
const toPreviewImportRows = (rows: Array<Omit<TableImportDraftRow, 'productPrice'> & { productPrice?: number | null }>): TableImportDraftRow[] =>
  rows.map(row => ({
    ...row,
    productPriceText: preserveProductPriceRaw(row.productPriceText ?? ''),
    productPrice: null,
    costPrice: null,
  }))

const getGenericCellText = (cell: XLSX.CellObject | undefined): string => {
  if (!cell) return ''
  if (cell.t === 's' || cell.t === 'str') return String(cell.v ?? '')
  if (cell.t === 'inlineStr') {
    const inline = cell.v as { t?: string } | string | undefined
    if (inline && typeof inline === 'object' && inline.t) return inline.t
    return String(inline ?? '')
  }
  if (typeof cell.w === 'string' && cell.w.length > 0) return cell.w
  if (cell.v === null || cell.v === undefined) return ''
  return String(cell.v)
}

/** 价格列专用：优先读取 Excel 中的字符串/格式化文本，禁止数值化 */
const getPriceCellRawText = (cell: XLSX.CellObject | undefined): string => {
  if (!cell) return ''
  if (cell.t === 's' || cell.t === 'str') return preserveProductPriceRaw(cell.v)
  if (cell.t === 'inlineStr') {
    const inline = cell.v as { t?: string } | string | undefined
    if (inline && typeof inline === 'object' && inline.t) return preserveProductPriceRaw(inline.t)
    return preserveProductPriceRaw(inline)
  }
  if (typeof cell.w === 'string' && cell.w.trim()) return preserveProductPriceRaw(cell.w)
  if (cell.v === null || cell.v === undefined) return ''
  return preserveProductPriceRaw(String(cell.v))
}

const readExcelSheetToRawRows = (sheet: XLSX.WorkSheet): string[][] => {
  const ref = sheet['!ref']
  if (!ref) return []

  const range = XLSX.utils.decode_range(ref)
  const rows: string[][] = []

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row: string[] = []
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
      row.push(getGenericCellText(sheet[address]))
    }
    rows.push(row)
  }

  const headerRow = (rows[0] || []).map(cell => cell.trim().toLowerCase())
  const productPriceColIndex = headerRow.findIndex(cell => productPriceHeaderAliases.has(cell))
  if (productPriceColIndex < 0) return rows

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const address = XLSX.utils.encode_cell({
      r: range.s.r + rowIndex,
      c: range.s.c + productPriceColIndex,
    })
    rows[rowIndex][productPriceColIndex] = getPriceCellRawText(sheet[address])
  }

  return rows
}

/** 把工作表二维数组转成 TSV，供本地 parseTableContentLocally 使用 */
const sheetRowsToTsv = (rows: unknown[][]): string => {
  return rows
    .map(row => {
      const cells = Array.isArray(row) ? row : []
      return cells
        .map(cell => {
          if (cell === null || cell === undefined) return ''
          return String(cell).replace(/\t/g, ' ').replace(/\r?\n/g, ' ').trim()
        })
        .join('\t')
    })
    .filter(line => line.trim() !== '')
    .join('\n')
}

const parseExcelFileToTsv = async (file: File): Promise<string> => {
  const buffer = await readFileAsArrayBuffer(file)
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellText: true,
    cellDates: false,
    raw: false,
  })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('未读取到有效工作表，请确认 Excel 文件内容')
  const sheet = workbook.Sheets[sheetName]
  const rows = readExcelSheetToRawRows(sheet)
  const tsv = sheetRowsToTsv(rows)
  if (!tsv.trim()) throw new Error('Excel 内容为空，请检查后重新上传')
  return tsv
}

/** 本地解析表格文本：预览阶段价格列只保留原始字符串 */
const parseTableContentLocally = (content: string): TableImportDraftRow[] => {
  const normalizedContent = content.trim()
  if (!normalizedContent) return []

  const lines = normalizedContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const detectDelimiter = (allLines: string[]) => {
    if (allLines.some(line => line.includes('\t'))) return '\t'
    return ','
  }
  const delimiter = detectDelimiter(lines)
  // 无表头约定列（不含 SKU）：产品编号、产品价格、名称、品牌、供应商、类目、颜色、规格、重量、图片、详情
  // 有命名表头时不做「价格列逗号合并」，避免把「图片」等额外列拼进价格。
  const expectedColumnCount = 9
  const priceColumnIndex = 1

  const peekHeaderAliases = {
    productCode: ['产品编号', '编号', 'product_code', 'product code'],
    productPrice: ['产品价格', '售价', '价格', 'price'],
    productName: ['名称', '产品名称', '商品名称', 'name'],
  }
  const rawHeaderCells = lines[0].split(delimiter).map(value => value.trim().toLowerCase())
  const namedHeaderHits = Object.values(peekHeaderAliases).filter(aliases =>
    rawHeaderCells.some(cell => aliases.includes(cell)),
  ).length
  const looksNamedHeader = namedHeaderHits >= 2

  const splitLine = (line: string) => {
    const rawParts = line.split(delimiter).map(value => value.trim())
    if (looksNamedHeader || delimiter !== ',' || rawParts.length <= expectedColumnCount) {
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
  // SKU 不在映射字段中；命名表头可含图片/详情等扩展列
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
    imageUrl: ['图片', '主图', 'image', 'image_url', 'image url'],
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
    imageUrl: 9,
    detail: 10,
  }

  const rows = dataLines.map((line, index) => {
    const columns = splitLine(line)
    const pick = (field: string) => {
      if (hasNamedHeader) {
        return indexMap[field] !== undefined ? (columns[indexMap[field]] || '') : ''
      }
      const idx = fallbackIndex[field]
      return idx !== undefined ? (columns[idx] || '') : ''
    }
    const productPriceText = preserveProductPriceRaw(pick('productPrice'))
    const imageUrl = pick('imageUrl').trim()
    const resolved = resolveTableImportColorSpec({
      color: pick('color'),
      spec: pick('spec'),
      extraCandidates: [productPriceText, pick('detail'), ...columns],
    })

    return {
      rowId: `row-${index + 1}`,
      productCode: pick('productCode'),
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
      imageUrl,
      detail: pick('detail'),
    }
  }).filter(row => row.productName || row.productCode)

  return toPreviewImportRows(rows)
}

/** 粗检：xlsx 被当文本读时会出现 PK / docProps 等 ZIP 结构痕迹 */
const looksLikeBinaryExcelText = (text: string) => {
  const sample = text.slice(0, 200)
  return sample.includes('PK') && (/docProps|xl\/|_rels|\[Content_Types\]/.test(sample) || /[\u0000-\u0008]/.test(sample))
}

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
  reader.onerror = () => reject(new Error(`图片读取失败：${file.name}`))
  reader.readAsDataURL(file)
})

const buildFallbackTaskSummary = (taskId: string, items: PendingImportItemRecord[]): PendingImportQueueTaskSummary => ({
  task_id: taskId,
  task_taskName: '当前待上传任务',
  task_status: 'COMPLETED',
  task_sourceLinkCount: items.length,
  task_successCount: items.filter(item => item.item_fetchStatus === 'COMPLETED').length,
  task_failureCount: items.filter(item => item.item_fetchStatus === 'FAILED' || item.item_publishStatus === 'FAILED').length,
  task_progressPercent: items.length === 0 ? 0 : Math.round(items.filter(item => item.item_fetchStatus === 'COMPLETED').length / items.length * 100),
  task_defaultStatus: 'DRAFT',
  task_defaultCategoryId: items.find(item => item.item_targetCategoryId)?.item_targetCategoryId || null,
  task_lastRateLimitedAt: null,
  task_startedAt: null,
  task_finishedAt: null
})

export type UseImportFrom1688Options = {
  /** 嵌入商品管理弹窗时：不跳转到独立导入页，创建成功后回调 */
  embedded?: boolean
  onTaskCreated?: (taskId: string) => void
}

export const useImportFrom1688 = (
  options: UseImportFrom1688Options = {},
): { state: ImportFrom1688State; handlers: ImportFrom1688Handlers } => {
  const { embedded = false, onTaskCreated } = options
  const onTaskCreatedRef = useRef(onTaskCreated)
  onTaskCreatedRef.current = onTaskCreated

  const router = useRouter()
  const searchParams = useSearchParams()
  const { taskId, mode } = ImportFrom1688.getParams(searchParams)

  const [activeTab, setActiveTab] = useState<string>('current')
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [creationMode, setCreationMode] = useState<'1688' | 'table' | 'manual'>(
    mode === 'table' || mode === 'manual' ? mode : '1688',
  )

  const [createForm, setCreateForm] = useState<CreateFormFields>({
    urls: '',
    defaultCategoryId: '',
    costDeductionUsd: 0,
    defaultStatus: 'DRAFT',
    stockStrategyStock: 100
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isParsingTask, setIsParsingTask] = useState(false)
  const [pendingParseTaskId, setPendingParseTaskId] = useState<string | null>(null)
  const [feedbackDialog, setFeedbackDialog] = useState<FeedbackDialogState>({
    open: false,
    variant: 'info',
    title: '',
    description: '',
    details: []
  })
  const [parseWatchTaskId, setParseWatchTaskId] = useState<string | null>(null)
  const lastQueueLoadErrorRef = useRef<string | null>(null)
  const parseResultNotifiedRef = useRef<string | null>(null)

  const [tableImportForm, setTableImportForm] = useState<TableImportFormFields>({
    content: '',
    selectedFileName: '',
    importSource: 'paste'
  })
  const [tableImportRows, setTableImportRows] = useState<TableImportDraftRow[]>([])
  const [isParsingTableImport, setIsParsingTableImport] = useState(false)
  const [isSubmittingTableImport, setIsSubmittingTableImport] = useState(false)
  const [imageUploadForm, setImageUploadForm] = useState<ImageUploadFormFields>({
    items: []
  })
  const [isCreatingImageDraft, setIsCreatingImageDraft] = useState(false)

  const [manualForm, setManualForm] = useState<ManualFormFields>(emptyManualForm)
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)
  const [pendingImageUploadingId, setPendingImageUploadingId] = useState<string | null>(null)
  const [pendingWatermarkProcessingId, setPendingWatermarkProcessingId] = useState<string | null>(null)

  const [currentTask, setCurrentTask] = useState<PendingImportQueueTaskSummary | null>(null)
  const [currentItems, setCurrentItems] = useState<PendingImportItemRecord[]>([])
  const [createFormCategoryWarning, setCreateFormCategoryWarning] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [isConfirmingImport, setIsConfirmingImport] = useState(false)
  const [editForm, setEditForm] = useState<EditItemFormFields>({
    name: '',
    categoryId: '',
    priceMin: '',
    priceMax: '',
    mainImageUrl: '',
    supplierName: '',
    sourceCategoryName: '',
    coefficient: '',
    productDetail: '',
    skuSummaryText: ''
  })
  const [isSavingCorrection, setIsSavingCorrection] = useState(false)

  const [historyStatusFilter, setHistoryStatusFilter] = useState<ImportTaskStatusType | 'ALL'>('ALL')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyList, setHistoryList] = useState<ImportTaskRecord[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const historyPageSize = 20

  useEffect(() => {
    if (mode === 'table' || mode === 'manual' || mode === '1688') {
      setCreationMode(mode)
    }
  }, [mode])

  const loadCategories = useCallback(async () => {
    try {
      const res = await getCategoryOptions()
      const list = Array.isArray(res)
        ? res
        : Array.isArray((res as { list?: CategoryOption[] })?.list)
          ? (res as { list: CategoryOption[] }).list
          : []
      setCategoryOptions(list)
    } catch (error) {
      setCategoryOptions([])
      toast.error((error as Error).message)
    }
  }, [])

  const showFeedbackDialog = useCallback((payload: Omit<FeedbackDialogState, 'open'>) => {
    setFeedbackDialog({
      open: true,
      ...payload
    })
  }, [])

  const dismissFeedbackDialog = useCallback(() => {
    setFeedbackDialog(prev => ({ ...prev, open: false }))
  }, [])

  const loadDetail = useCallback(async (id?: string | null, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoadingDetail(true)
    }
    try {
      // Light queue pull for status panels — never full unbounded dump or heavy maintenance on every open
      const res = await getPendingImportQueue({
        page: 1,
        page_size: 80,
        skip_maintenance: true,
      } as any)
      const queueItems = id ? res.list.filter(item => item.item_importTaskId === id) : res.list
      const fallbackTask = id && queueItems.length > 0
        ? (res.activeTask?.task_id === id ? res.activeTask : buildFallbackTaskSummary(id, queueItems))
        : res.activeTask

      setCurrentTask(fallbackTask)
      setCurrentItems(queueItems)
      if (!options?.silent) {
        setSelectedItemIds(queueItems.filter(item => item.item_fetchStatus === 'COMPLETED' && !item.item_isPublished).map(item => item.item_id))
        setActiveItemId(prev => (prev && queueItems.some(item => item.item_id === prev) ? prev : queueItems[0]?.item_id || null))
      } else {
        setSelectedItemIds(prev => prev.filter(id => queueItems.some(item => item.item_id === id && item.item_fetchStatus === 'COMPLETED' && !item.item_isPublished)))
        setActiveItemId(prev => (prev && queueItems.some(item => item.item_id === prev) ? prev : queueItems[0]?.item_id || null))
      }
      lastQueueLoadErrorRef.current = null
      return { task: fallbackTask, items: queueItems }
    } catch (error) {
      const raw = String((error as Error).message || '')
      const message = /Failed to fetch|无法连接|NetworkError|fetch failed/i.test(raw)
        ? '无法连接后台 RPC（Failed to fetch）。请确认 rpc 在线：pnpm run build:server && pm2 restart rpc'
        : raw || '获取待上传区数据失败'
      setCurrentTask(prev => prev)
      setCurrentItems(prev => {
        if (prev.length === 0) {
          setSelectedItemIds([])
          setActiveItemId(null)
          setCurrentTask(null)
        }
        return prev
      })
      // 表格导入页依赖本地解析，队列失败不刷屏盖掉「解析成功」
      if (!options?.silent && lastQueueLoadErrorRef.current !== message) {
        toast.error(message)
        lastQueueLoadErrorRef.current = message
      }
      return null
    } finally {
      if (!options?.silent) {
        setIsLoadingDetail(false)
      }
    }
  }, [])

  const notifyParseResult = useCallback((taskIdValue: string, items: PendingImportItemRecord[], taskStatus?: ImportTaskStatusType | null) => {
    if (parseResultNotifiedRef.current === taskIdValue) return
    parseResultNotifiedRef.current = taskIdValue

    const failedItems = items.filter(item => item.item_fetchStatus === 'FAILED' || item.item_fetchStatus === 'RATE_LIMITED')
    const successItems = items.filter(item => item.item_fetchStatus === 'COMPLETED' && !item.item_isPublished)

    if (failedItems.length > 0 && successItems.length === 0) {
      const details = failedItems.map(item => formatParseFailureReason(item.item_failureReason))
      showFeedbackDialog({
        variant: 'error',
        title: details[0] || '解析失败',
        description: failedItems.length > 1
          ? `共 ${failedItems.length} 条链接解析失败，请检查链接后重试。`
          : '该链接未能完成解析，商品不会进入待上传处理区。',
        details: details.slice(0, 5)
      })
      return
    }

    if (failedItems.length > 0) {
      showFeedbackDialog({
        variant: 'info',
        title: '部分链接解析成功',
        description: `成功 ${successItems.length} 条已进入待上传处理区，失败 ${failedItems.length} 条请查看详情。`,
        details: failedItems.map(item => formatParseFailureReason(item.item_failureReason)).slice(0, 5)
      })
      return
    }

    if (successItems.length > 0 || taskStatus === 'COMPLETED') {
      showFeedbackDialog({
        variant: 'success',
        title: '解析成功',
        description: `已成功解析 ${successItems.length || items.length} 条商品，并写入下方【待上传处理区】，状态为「待上传」。请核对字段后发布。`,
        details: []
      })
    }
  }, [showFeedbackDialog])

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      const res = await getImportTaskList({
        status: historyStatusFilter === 'ALL' ? '' : historyStatusFilter,
        page: historyPage,
        pageSize: historyPageSize
      })
      setHistoryList(res.list)
      setHistoryTotal(res.total)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [historyStatusFilter, historyPage])

  const handleGlobalRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      if (activeTab === 'current') {
        await loadDetail(taskId || null)
      } else if (activeTab === 'history') {
        await loadHistory()
      }
      toast.success('刷新成功')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsRefreshing(false)
    }
  }, [activeTab, taskId, loadDetail, loadHistory])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // 表格导入 / 手动建品：预览纯本地，不强制拉待上传队列（避免 Failed to fetch 掩盖解析成功）
  useEffect(() => {
    setActiveTab('current')
    if (creationMode === 'table' || creationMode === 'manual') {
      return
    }
    void loadDetail(taskId || null)
  }, [taskId, loadDetail, creationMode])

  useEffect(() => {
    const watchId = parseWatchTaskId || taskId || null
    const shouldPoll =
      isParsingTask ||
      isTaskStillParsing(currentTask?.task_status) ||
      currentItems.some(item => item.item_fetchStatus === 'PENDING' || item.item_fetchStatus === 'RUNNING')

    if (!shouldPoll) return

    const timer = window.setInterval(async () => {
      const snapshot = await loadDetail(watchId, { silent: true })
      if (!snapshot) return

      const stillRunning =
        isTaskStillParsing(snapshot.task?.task_status) ||
        snapshot.items.some(item => item.item_fetchStatus === 'PENDING' || item.item_fetchStatus === 'RUNNING')

      if (!stillRunning) {
        setIsParsingTask(false)
        setParseWatchTaskId(null)
        if (watchId) {
          notifyParseResult(watchId, snapshot.items, snapshot.task?.task_status)
        }
      }
    }, 2000)

    return () => window.clearInterval(timer)
  }, [parseWatchTaskId, taskId, isParsingTask, currentTask?.task_status, currentItems, loadDetail, notifyParseResult])

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab, historyStatusFilter, historyPage, loadHistory])

  useEffect(() => {
    const item = currentItems.find(i => i.item_id === activeItemId)
    if (item) {
      setEditForm({
        name: item.item_productName || item.item_parsedName || '',
        categoryId: item.item_targetCategoryId || '',
        priceMin: item.item_cnyPriceMin ?? '',
        priceMax: item.item_cnyPriceMax ?? '',
        mainImageUrl: item.item_mainImageUrl || item.item_parsedMainImageUrl || '',
        supplierName: item.item_supplierName || '',
        sourceCategoryName: item.item_sourceCategoryName || '',
        coefficient: item.item_coefficient ?? '',
        productDetail: item.item_productDetail || '',
        skuSummaryText: item.item_skuSummaryText || ''
      })
    } else {
      setEditForm({
        name: '',
        categoryId: '',
        priceMin: '',
        priceMax: '',
        mainImageUrl: '',
        supplierName: '',
        sourceCategoryName: '',
        coefficient: '',
        productDetail: '',
        skuSummaryText: ''
      })
    }
  }, [activeItemId, currentItems])

  const handleCreateFormChange = <K extends keyof CreateFormFields>(field: K, value: CreateFormFields[K]) => {
    if (field === 'defaultCategoryId') {
      setCreateFormCategoryWarning(null)
    }
    setCreateForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditFormChange = <K extends keyof EditItemFormFields>(field: K, value: EditItemFormFields[K]) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleTableImportFormChange = <K extends keyof TableImportFormFields>(field: K, value: TableImportFormFields[K]) => {
    setTableImportForm(prev => ({ ...prev, [field]: value }))
  }

  const handleManualFormChange = <K extends keyof ManualFormFields>(field: K, value: ManualFormFields[K]) => {
    setManualForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSelectTableFile = async (file: File | null) => {
    if (!file) {
      setTableImportForm(prev => ({ ...prev, selectedFileName: '', content: '', importSource: 'paste' }))
      setTableImportRows([])
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!supportedTableExtensions.includes(extension)) {
      toast.error('请上传 CSV、TXT、TSV、XLSX 或 XLS 文件')
      return
    }

    setIsParsingTableImport(true)
    try {
      const text = isExcelExtension(extension)
        ? await parseExcelFileToTsv(file)
        : await readFileAsText(file)

      if (!isExcelExtension(extension) && looksLikeBinaryExcelText(text)) {
        throw new Error('检测到 Excel 二进制内容被当成文本读取。请直接上传 .xlsx/.xls，或另存为 CSV 后再导入')
      }

      setTableImportForm(prev => ({
        ...prev,
        content: text,
        selectedFileName: file.name,
        importSource: 'file'
      }))

      const rows = parseTableContentLocally(text)
      setTableImportRows(rows)
      toast.success(`已从文件解析 ${rows.length} 条导入草稿`)
    } catch (error) {
      setTableImportRows([])
      toast.error((error as Error).message || '文件解析失败')
    } finally {
      setIsParsingTableImport(false)
    }
  }

  const handleImageDraftFieldChange = <K extends keyof LocalImageImportDraftItem>(rowId: string, field: K, value: LocalImageImportDraftItem[K]) => {
    setImageUploadForm(prev => ({
      items: prev.items.map(item => item.rowId === rowId ? { ...item, [field]: value } : item)
    }))
  }

  const handleDeleteImageDraftItem = (rowId: string) => {
    setImageUploadForm(prev => ({
      items: prev.items.filter(item => item.rowId !== rowId)
    }))
  }

  const handleSelectImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    const list = Array.from(files)
    const unsupported = list.find(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || ''
      return !supportedImageExtensions.includes(extension)
    })

    if (unsupported) {
      toast.error(`存在不支持的图片格式：${unsupported.name}`)
      return
    }

    setIsCreatingImageDraft(true)
    try {
      toast.error('图片导入功能暂时不可用')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsCreatingImageDraft(false)
    }
  }

  const handleAppendImageDraftsToManual = () => {
    if (imageUploadForm.items.length === 0) {
      toast.error('请先上传图片并生成待识别草稿')
      return
    }

    const firstItem = imageUploadForm.items[0]
    setCreationMode('manual')
    setManualForm(prev => ({
      ...prev,
      productName: prev.productName || firstItem.productName,
      categoryId: prev.categoryId || firstItem.categoryId,
      brand: prev.brand || firstItem.brand,
      imageUrl: firstItem.imageUrl,
      detail: prev.detail || firstItem.detail
    }))
    toast.success('首张图片草稿已带入手动建品表单，可继续补充其余字段后创建商品')
  }

  const handleCreateTask = async () => {
    const urlCheck = validate1688Urls(createForm.urls)
    if (!urlCheck.ok) {
      showFeedbackDialog({
        variant: 'error',
        title: urlCheck.message,
        description: '请粘贴 1688 商品详情、店铺分类或分页链接后再试。',
        details: []
      })
      return
    }
    if (!createForm.defaultCategoryId) {
      setCreateFormCategoryWarning('当前未设置默认分类。链接仍可提交，但后续确认导入前需要先补齐目标分类，否则会在发布阶段失败。')
    }
    setIsSubmitting(true)
    try {
      const res = await createImportTask({
        urls: createForm.urls,
        defaultCategoryId: createForm.defaultCategoryId || undefined,
        costDeductionUsd: createForm.costDeductionUsd === '' ? undefined : createForm.costDeductionUsd,
        defaultStatus: createForm.defaultStatus,
        stockStrategyStock: createForm.stockStrategyStock === '' ? undefined : createForm.stockStrategyStock
      })
      setCreateFormCategoryWarning(null)
      setCreateForm(prev => ({ ...prev, urls: '' }))
      setPendingParseTaskId(res.taskId)
      const createdCount = Number(res.createdCount ?? 0)
      const skippedDuplicateCount = Number(res.skippedDuplicateCount ?? 0)
      const categoryUrlCount = Number(res.categoryUrlCount ?? 0)
      toast.success(
        categoryUrlCount > 0
          ? `已提交 ${createdCount} 条（含 ${categoryUrlCount} 个分类/分页），正在自动抽商品并解析`
          : skippedDuplicateCount > 0
            ? `已提交 ${createdCount} 条新链接并开始解析；跳过 ${skippedDuplicateCount} 条重复链接`
            : `已提交 ${createdCount} 条，正在解析`,
      )

      setIsParsingTask(true)
      parseResultNotifiedRef.current = null
      setParseWatchTaskId(res.taskId)
      try {
        await startParseTask({ taskId: res.taskId })
        setPendingParseTaskId(null)
      } catch (parseError) {
        toast.error(`解析进行中或请求超时：${(parseError as Error).message}`)
      }

      if (embedded) {
        onTaskCreatedRef.current?.(res.taskId)
        return
      }

      ImportFrom1688.navigateToTaskDetail(router, { taskId: res.taskId })
      await loadDetail(res.taskId)
    } catch (error) {
      const message = formatParseFailureReason((error as Error).message)
      showFeedbackDialog({
        variant: 'error',
        title: message,
        description: '提交导入任务失败，请检查链接与网络后重试。',
        details: [message]
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartParseTask = async (explicitTaskId?: string) => {
    const id = explicitTaskId || pendingParseTaskId || taskId || currentTask?.task_id
    if (!id) {
      toast.error('请先提交 1688 链接，创建导入任务后再解析')
      return
    }

    setIsParsingTask(true)
    parseResultNotifiedRef.current = null
    setParseWatchTaskId(id)
    try {
      // ACK only — parse continues in background; polling effect watches task/item status
      await startParseTask({ taskId: id })
      toast.success('已开始解析。请稍候，完成后会出现在待上传区')
      setPendingParseTaskId(null)

      if (embedded) {
        onTaskCreatedRef.current?.(id)
        return
      }

      if (!taskId || taskId !== id) {
        ImportFrom1688.navigateToTaskDetail(router, { taskId: id })
      }
      const snapshot = await loadDetail(id)
      if (
        snapshot &&
        !isTaskStillParsing(snapshot.task?.task_status) &&
        !snapshot.items.some(
          item => item.item_fetchStatus === 'PENDING' || item.item_fetchStatus === 'RUNNING',
        )
      ) {
        setIsParsingTask(false)
        setParseWatchTaskId(null)
        notifyParseResult(id, snapshot.items, snapshot.task?.task_status)
      }
    } catch (parseError) {
      // 请求超时不代表服务端已停止；继续轮询待上传区，由最终状态决定提示
      toast.error(`解析进行中或请求超时：${(parseError as Error).message}`)
    }
  }

  const handleParseTableImport = async () => {
    if (!tableImportForm.content.trim()) {
      toast.error('请先粘贴表格数据或上传文件')
      return
    }

    if (looksLikeBinaryExcelText(tableImportForm.content)) {
      toast.error('当前内容是未解析的 Excel 二进制数据。请重新选择 .xlsx/.xls 文件上传，不要用记事本打开后粘贴')
      return
    }

    setIsParsingTableImport(true)
    try {
      const rows = parseTableContentLocally(tableImportForm.content)
      setTableImportRows(rows)
      toast.success(
        tableImportForm.importSource === 'file'
          ? `已从文件生成 ${rows.length} 条导入草稿`
          : `已解析 ${rows.length} 条商品数据`,
      )
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsParsingTableImport(false)
    }
  }

  const handleTableRowChange = <K extends keyof TableImportDraftRow>(rowId: string, field: K, value: TableImportDraftRow[K]) => {
    setTableImportRows(prev => prev.map(row => {
      if (row.rowId !== rowId) return row
      const next = { ...row, [field]: value }
      if (field === 'color' || field === 'spec') {
        const resolved = resolveTableImportColorSpec({
          color: field === 'color' ? String(value ?? '') : next.color,
          spec: field === 'spec' ? String(value ?? '') : next.spec,
        })
        next.color = resolved.color
        next.spec = resolved.spec
        next.colors = resolved.colors
        next.specs = resolved.specs
      }
      if (field === 'productPriceText') {
        next.productPriceText = preserveProductPriceRaw(value)
        next.productPrice = null
        next.costPrice = null
      }
      return next
    }))
  }

  const handleDeleteTableRow = (rowId: string) => {
    setTableImportRows(prev => prev.filter(row => row.rowId !== rowId))
  }

  const handleCreateProductsFromTable = async () => {
    if (tableImportRows.length === 0) {
      toast.error('请先解析并生成预览')
      return
    }
    const invalid = tableImportRows.find(row => !row.productName.trim())
    if (invalid) {
      toast.error('存在名称为空的行，请补全后再提交')
      return
    }
    const missingCode = tableImportRows.find(row => !row.productCode.trim())
    if (missingCode) {
      toast.error('存在产品编号为空的行，请补全后再提交')
      return
    }

    setIsSubmittingTableImport(true)
    try {
      const payload: ActionTableImportDraftRow[] = tableImportRows.map(row => {
        const resolved = resolveTableImportColorSpec({
          color: row.color,
          spec: row.spec,
          extraCandidates: [row.productPriceText, row.detail],
        })
        return {
          ...row,
          color: resolved.color,
          spec: resolved.spec,
          colors: resolved.colors,
          specs: resolved.specs,
          productPriceText: preserveProductPriceRaw(row.productPriceText ?? ''),
          productPrice: null,
          costPrice: null,
        }
      })
      const res = await createProductsFromTable({
        rows: payload,
        defaultCategoryId: createForm.defaultCategoryId || undefined
      })
      toast.success(`已写入待上传区 ${res.createdCount} 条，正在跳转商品管理待上传区`)
      setTableImportRows([])
      setTableImportForm(prev => ({ ...prev, content: '', selectedFileName: '', importSource: 'paste' }))
      ProductManagement.navigateToPendingImports(router)
    } catch (error) {
      const raw = String((error as Error).message || '')
      const message = /Failed to fetch|无法连接|NetworkError|fetch failed/i.test(raw)
        ? '创建失败：无法连接 RPC。请执行 pnpm run build:server && pm2 restart rpc 后重试'
        : raw || '提交失败'
      toast.error(message)
    } finally {
      setIsSubmittingTableImport(false)
    }
  }

  const handleCreateManualProduct = async () => {
    toast.error('手动创建功能暂未就绪')
  }

  const handleUploadPendingImages = async (itemId: string, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    // Do not block further uploads: keep selecting while previous batch is in flight.
    setPendingImageUploadingId(itemId)
    try {
      const uploaded = await upload_project_files(files, {
        concurrency: 4,
        onProgress: (done, total) => {
          if (total > 1) toast.message(`图片上传中 ${done}/${total}`)
        },
      })
      const item = currentItems.find(row => row.item_id === itemId)
      const current = item?.item_galleryUrls?.length
        ? item.item_galleryUrls
        : (item?.item_mainImageUrl || item?.item_parsedMainImageUrl
          ? [item.item_mainImageUrl || item.item_parsedMainImageUrl!]
          : [])
      const galleryUrls = Array.from(new Set([...current, ...uploaded].filter(Boolean)))
      await updatePendingImportGallery({ itemId, galleryUrls, mainImageUrl: galleryUrls[0] })
      setEditForm(prev => ({ ...prev, mainImageUrl: galleryUrls[0] || prev.mainImageUrl }))
      await loadDetail(taskId, { silent: true })
      toast.success(`已上传 ${uploaded.length} 张图片`)
    } catch (error) {
      toast.error((error as Error).message || '图片上传失败')
    } finally {
      setPendingImageUploadingId(prev => (prev === itemId ? null : prev))
    }
  }

  const handleRemovePendingImage = async (itemId: string, imageIndex: number) => {
    const item = currentItems.find(row => row.item_id === itemId)
    const current = [...(item?.item_galleryUrls?.length
      ? item.item_galleryUrls
      : (item?.item_mainImageUrl || item?.item_parsedMainImageUrl
        ? [item.item_mainImageUrl || item.item_parsedMainImageUrl!]
        : []))]
    current.splice(imageIndex, 1)
    if (current.length === 0) {
      toast.error('至少保留一张图片，或先上传新图再删除')
      return
    }
    try {
      await updatePendingImportGallery({ itemId, galleryUrls: current, mainImageUrl: current[0] })
      setEditForm(prev => ({ ...prev, mainImageUrl: current[0] }))
      await loadDetail(taskId, { silent: true })
      toast.success('图片已删除')
    } catch (error) {
      toast.error((error as Error).message || '删除失败')
    }
  }

  const handleSetCurrentPendingImage = (itemId: string, imageIndex: number) => {
    const item = currentItems.find(row => row.item_id === itemId)
    const gallery = item?.item_galleryUrls?.length
      ? item.item_galleryUrls
      : (item?.item_mainImageUrl || item?.item_parsedMainImageUrl
        ? [item.item_mainImageUrl || item.item_parsedMainImageUrl!]
        : [])
    const url = gallery[imageIndex]
    if (!url) return
    setEditForm(prev => ({ ...prev, mainImageUrl: url }))
  }

  const handleProcessCurrentImageWatermark = async (itemId: string) => {
    const sourceUrl = String(editForm.mainImageUrl || '').trim()
    if (!sourceUrl) {
      toast.error('当前没有可处理的主图')
      return
    }
    setPendingWatermarkProcessingId(itemId)
    try {
      const res = await fetch('/api/process-watermark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: sourceUrl }),
      })
      const payload = (await res.json().catch(() => null)) as {
        code?: number
        message?: string
        data?: { url?: string; image_url?: string }
      } | null
      if (!res.ok || !payload || payload.code !== 200) {
        throw new Error(payload?.message || `处理失败（HTTP ${res.status}）`)
      }
      const newUrl = String(payload.data?.url || payload.data?.image_url || '').trim()
      if (!newUrl) throw new Error('处理成功但未返回新图地址')

      const item = currentItems.find(row => row.item_id === itemId)
      const current = [...(item?.item_galleryUrls?.length
        ? item.item_galleryUrls
        : (item?.item_mainImageUrl || item?.item_parsedMainImageUrl
          ? [item.item_mainImageUrl || item.item_parsedMainImageUrl!]
          : []))]
      const replaced = current.map((url) => (url === sourceUrl ? newUrl : url))
      const galleryUrls = replaced.includes(newUrl) ? replaced : [newUrl, ...replaced]
      await updatePendingImportGallery({ itemId, galleryUrls, mainImageUrl: newUrl })
      setEditForm(prev => ({ ...prev, mainImageUrl: newUrl }))
      await loadDetail(taskId, { silent: true })
      toast.success('已对当前图角区做马赛克并写回')
    } catch (error) {
      toast.error((error as Error).message || '处理当前图失败')
    } finally {
      setPendingWatermarkProcessingId(null)
    }
  }

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(currentItems.filter(i => i.item_fetchStatus === 'COMPLETED' && !i.item_isPublished).map(i => i.item_id))
    } else {
      setSelectedItemIds([])
    }
  }

  const handleToggleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds(prev => [...prev, id])
    } else {
      setSelectedItemIds(prev => prev.filter(v => v !== id))
    }
  }

  const handleSaveCorrection = async () => {
    if (!activeItemId) return
    setIsSavingCorrection(true)
    try {
      const updates: Array<Promise<void>> = [
        inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'product_name', value: editForm.name }),
        inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'target_category_id', value: editForm.categoryId }),
        inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'supplier_name', value: editForm.supplierName }),
        inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'source_category_name', value: editForm.sourceCategoryName }),
        inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'product_detail', value: editForm.productDetail }),
        inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'sku_summary_text', value: editForm.skuSummaryText })
      ]
      if (editForm.mainImageUrl.trim()) {
        updates.push(inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'main_image_url', value: editForm.mainImageUrl }))
      }

      if (editForm.priceMin !== '') {
        updates.push(inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'cny_price_min', value: Number(editForm.priceMin) }))
      }
      if (editForm.priceMax !== '') {
        updates.push(inlineUpdatePendingImportItemField({ itemId: activeItemId, field: 'cny_price_max', value: Number(editForm.priceMax) }))
      }
      await Promise.all(updates)
      toast.success('待上传字段已保存')
      await loadDetail(taskId || null)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setIsSavingCorrection(false)
    }
  }

  const handleConfirmImport = async () => {
    if (selectedItemIds.length === 0) return

    const selectedItems = currentItems.filter(item => selectedItemIds.includes(item.item_id))
    const missingCategoryItems = selectedItems.filter(item => !item.item_targetCategoryId && !currentTask?.task_defaultCategoryId)

    if (missingCategoryItems.length > 0) {
      const message = `发布失败：仍有 ${missingCategoryItems.length} 条商品未设置目标分类`
      showFeedbackDialog({
        variant: 'error',
        title: message,
        description: '请先在右侧修正区补齐目标分类后再发布。',
        details: missingCategoryItems.slice(0, 5).map(item => item.item_productName || item.item_parsedName || item.item_sourceUrl)
      })
      setActiveItemId(missingCategoryItems[0].item_id)
      return
    }

    setIsConfirmingImport(true)
    try {
      const result = await publishPendingImportItems({ itemIds: selectedItemIds })
      await loadDetail(taskId || null)

      if (result.fail_count > 0) {
        const apiFailures = Array.isArray(result.failures) ? result.failures : []
        let details = apiFailures.map(
          item => `${item.name || item.itemId}：${formatPublishFailureReason(item.reason)}`,
        )
        if (details.length === 0) {
          const latest = await getPendingImportQueue({
            page: 1,
            page_size: 80,
            skip_maintenance: true,
          } as any)
          const failed = latest.list.filter(
            item => selectedItemIds.includes(item.item_id) && item.item_publishStatus === 'FAILED',
          )
          details = failed.map(item => {
            const name = item.item_productName || item.item_parsedName || item.item_sourceUrl || item.item_id
            return `${name}：${formatPublishFailureReason(item.item_failureReason)}`
          })
        }
        showFeedbackDialog({
          variant: 'error',
          title: `发布失败：成功 ${result.success_count} 条，失败 ${result.fail_count} 条`,
          description: `发布未全部成功（成功 ${result.success_count} / 失败 ${result.fail_count}）。失败商品仍保留在待上传处理区，请修正后重试。`,
          details: details.slice(0, 20)
        })
      } else {
        showFeedbackDialog({
          variant: 'success',
          title: '发布成功',
          description: `已成功发布 ${result.success_count} 条商品，可在【商品管理】列表中查看。`,
          details: []
        })
        toast.success('待上传商品已全部发布成功')
      }
    } catch (error) {
      const message = formatPublishFailureReason((error as Error).message)
      showFeedbackDialog({
        variant: 'error',
        title: message,
        description: '发布请求失败，请检查网络或商品字段后重试。',
        details: [message]
      })
    } finally {
      setIsConfirmingImport(false)
    }
  }

  const handleRetryTask = async (id: string) => {
    try {
      setIsParsingTask(true)
      parseResultNotifiedRef.current = null
      setParseWatchTaskId(id)
      await retryImportTask({ taskId: id })
      toast.success('任务已重置，重新开始解析')
      try {
        await startParseTask({ taskId: id })
      } catch (e) {
        const message = formatParseFailureReason((e as Error).message)
        showFeedbackDialog({
          variant: 'error',
          title: message,
          description: '重试解析失败，请稍后再次尝试。',
          details: [message]
        })
        setIsParsingTask(false)
      }
      if (activeTab === 'current') {
        await loadDetail(taskId || id)
      } else if (activeTab === 'history') {
        loadHistory()
      }
    } catch (error) {
      setIsParsingTask(false)
      setParseWatchTaskId(null)
      const message = formatParseFailureReason((error as Error).message)
      showFeedbackDialog({
        variant: 'error',
        title: message,
        description: '无法重置该导入任务。',
        details: [message]
      })
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteImportTask({ taskId: id })
      toast.success('任务记录已删除')
      if (activeTab === 'current' && taskId === id) {
        ImportFrom1688.navigateToMain(router)
        loadDetail(null)
      } else if (activeTab === 'history') {
        loadHistory()
      }
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(historyTotal / historyPageSize))
  const selectableItems = currentItems.filter(i => i.item_fetchStatus === 'COMPLETED' && !i.item_isPublished)
  const isAllSelected = selectableItems.length > 0 && selectedItemIds.length === selectableItems.length
  const activeItemDetails = useMemo(() => currentItems.find(i => i.item_id === activeItemId), [currentItems, activeItemId])
  const activeItemFailureSummary = useMemo(() => classifyImportFailure(activeItemDetails), [activeItemDetails])

  return {
    state: {
      activeTab,
      categoryOptions,
      isRefreshing,
      createForm,
      isSubmitting,
      isParsingTask,
      pendingParseTaskId,
      currentTask,
      currentItems,
      createFormCategoryWarning,
      isLoadingDetail,
      activeItemId,
      selectedItemIds,
      isConfirmingImport,
      editForm,
      isSavingCorrection,
      historyStatusFilter,
      historyPage,
      historyList,
      historyTotal,
      isLoadingHistory,
      totalPages,
      selectableItems,
      isAllSelected,
      activeItemDetails,
      activeItemFailureSummary,
      taskId,
      creationMode,
      tableImportForm,
      tableImportRows,
      isParsingTableImport,
      isSubmittingTableImport,
      imageUploadForm,
      isCreatingImageDraft,
      manualForm,
      isSubmittingManual,
      pendingImageUploadingId,
      pendingWatermarkProcessingId,
      feedbackDialog
    },
    handlers: {
      setActiveTab,
      handleGlobalRefresh,
      handleCreateFormChange,
      handleEditFormChange,
      handleCreateTask,
      handleStartParseTask,
      handleToggleSelectAll,
      handleToggleSelectItem,
      setActiveItemId,
      handleSaveCorrection,
      handleConfirmImport,
      handleRetryTask,
      handleDeleteTask,
      setHistoryStatusFilter,
      setHistoryPage,
      setCreationMode,
      handleTableImportFormChange,
      handleSelectTableFile,
      handleParseTableImport,
      handleTableRowChange,
      handleDeleteTableRow,
      handleCreateProductsFromTable,
      handleSelectImageFiles,
      handleImageDraftFieldChange,
      handleDeleteImageDraftItem,
      handleAppendImageDraftsToManual,
      handleManualFormChange,
      handleCreateManualProduct,
      handleUploadPendingImages,
      handleRemovePendingImage,
      handleProcessCurrentImageWatermark,
      handleSetCurrentPendingImage,
      dismissFeedbackDialog
    }
  }
}