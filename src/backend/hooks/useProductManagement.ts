'use client'
import { useState, useEffect, useCallback, useMemo, ChangeEvent, createElement } from 'react'
import * as XLSX from 'xlsx'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductManagement, ImportFrom1688 } from '@/backend/route-params'
import {
  getProductList,
  getCategoryOptions,
  getProductDetail,
  createProduct,
  updateProduct,
  batchUpdateProductStatus,
  batchDeleteProduct,
  batchImportProducts,
  batchUpdatePriceCoefficient,
  getHomeFeaturedKeywords,
  saveHomeFeaturedKeywords,
  inlineUpdateProductField,
  inlineUpdateProductSkuField,
  batchUpdateProductCategory,
  batchUpdateManagementStatus,
  batchUpdateProductWeightPrice,
  getProductBindingMeta,
  batchBindProductCategories,
  batchUnbindProductCategories,
  batchBindProductKeywords,
  getCategoryProductPreview,
  batchDeletePendingImportItems,
  createPendingImportTaskForProductManagement,
  startPendingImportTaskForProductManagement,
  retryPendingImportTaskForProductManagement,
  getPendingImportQueue,
  inlineUpdatePendingImportItemField,
  inlineUpdatePendingImportSkuField,
  updatePendingImportGallery,
  publishPendingImportItems,
  reparsePendingImportItems,
  sync1688ProductStatus,
  batchAppendProductAdminNotes,
  reclassifyPublishedProductsBySecondaryMatch,
  batchTranslateProductTitlesToSpanish,
  unbindProductCategory as unbindProductCategoryAction,
  type PendingImportEditableField,
  type ProductSkuInlineField,
  type PendingImportSkuEditableField,
  type ProductListSkuItem,
  type PendingImportSkuDraftItem,
  type ProductManagementPendingImportQueueOutput,
  type PendingImportQueueItem,
  type PendingImportQueueTaskSummary,
  type PendingImportTaskStatus,
  type PendingImportItemFetchStatus,
  type PendingImportItemPublishStatus,
  type Sync1688StatusItem,
  type CategoryProductPreviewItem
} from '@/backend/actions/ProductManagement'
import * as ProductManagementActionModule from '@/backend/actions/ProductManagement'
import type {
  ProductStatus,
  ProductListItem,
  CategoryOption,
  CreateProductInput as BaseCreateProductInput,
  SkuItem,
  SkuAttribute,
  TradeInfo,
  GoodsStatus as ActionGoodsStatus,
  ProductDetail,
  SelectOption
} from '@/backend/actions/ProductManagement'
import { toast } from 'sonner'
import { upload_project_file } from '@/tools/tools'

export type DrawerMode = 'create' | 'edit'
export type BatchActionType = 'ACTIVE' | 'INACTIVE' | 'DELETE' | 'PENDING_DELETE' | 'PRICE_COEFFICIENT' | 'CATEGORY' | 'MANAGEMENT_STATUS' | 'WEIGHT_PRICE' | 'MIN_ORDER_QTY' | 'BIND_CATEGORIES' | 'UNBIND_CATEGORIES' | 'BIND_KEYWORDS' | null
type PriceAdjustMode = 'PRODUCT_COEFFICIENT' | 'CATEGORY_COEFFICIENT'
type BatchWeightPriceMode = BatchAdjustTargetField

type CategoryTreeOption = CategoryOption & {
  parent_id?: string | null
  parentId?: string | null
  price_coefficient?: number | null
  priceCoefficient?: number | null
}

export interface SpecDimension {
  name: string
  values: string
}

export interface BatchImportRowInput {
  product_code: string
  sku_code: string
  name: string
  weight_gram: string
  cost_price: string
  product_price: string
  main_image_url: string
  gallery_urls: string[]
  detail_text: string
  category_name: string
  supplier_name: string
  brand_keyword: string
  price_coefficient: string
  color: string
  spec: string
}

type ProductSkuFormItem = SkuItem & {
  usd_display_price?: number | null
  usd_display_original_price?: number | null
}

type GoodsStatus = ActionGoodsStatus
type ProductListStatusFilter = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'DELETED'
type ProductInlineField =
  | 'product_name'
  | 'supplier_name'
  | 'category_id'
  | 'goods_status'
  | 'weight_gram'
  | 'cost_price'
  | 'price_coefficient'
type BatchAdjustTargetField = 'price_coefficient' | 'weight_gram'
type ProductListFilterStatus = ProductListStatusFilter | 'ALL'
type ProductFormGoodsStatus = ActionGoodsStatus | 'ACTIVE'

type ProductManagementTab = 'products' | 'pending_imports'
type PendingImportFieldValue = string | number | null
type PendingImportEditableCell = {
  itemId: string
  field: PendingImportEditableField
}

type ProductSkuEditableCell = {
  productId: string
  skuId: string
  field: ProductSkuInlineField
}

type PendingImportSkuEditableCell = {
  itemId: string
  skuKey: string
  field: PendingImportSkuEditableField
}

interface PendingImportTaskForm {
  urls: string
  defaultCategoryId: string
  defaultStatus: ProductStatus
  costDeductionUsd: string
  stockStrategyStock: string
}

const editablePendingImportFields: PendingImportEditableField[] = [
  'product_name',
  'product_detail',
  'sku_summary_text',
  'supplier_name',
  'source_category_name',
  'target_category_id',
  'coefficient',
  'goods_status',
  'weight_grams',
  'cost_price',
  'cny_price_min',
  'cny_price_max',
  'usd_price_min',
  'usd_price_max',
  'minimum_order_quantity',
  'available_stock',
  'main_image_url'
]

const numberPendingImportFields = new Set<PendingImportEditableField>([
  'coefficient',
  'weight_grams',
  'cost_price',
  'cny_price_min',
  'cny_price_max',
  'usd_price_min',
  'usd_price_max',
  'minimum_order_quantity',
  'available_stock'
])

const pendingImportStatusOptions: ProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE']
const editableProductFields: ProductInlineField[] = [
  'product_name',
  'supplier_name',
  'category_id',
  'goods_status',
  'weight_gram',
  'cost_price',
  'price_coefficient'
]
const numberProductFields = new Set<ProductInlineField>([
  'weight_gram',
  'cost_price',
  'price_coefficient'
])
const productGoodsStatusOptions: ActionGoodsStatus[] = ['ACTIVE', 'INACTIVE']

const defaultPendingImportTaskForm = (): PendingImportTaskForm => ({
  urls: '',
  defaultCategoryId: '',
  defaultStatus: 'DRAFT',
  costDeductionUsd: '0',
  stockStrategyStock: '1'
})

const pollingTaskStatuses: PendingImportTaskStatus[] = ['PENDING', 'RUNNING', 'RETRY_PENDING', 'RATE_LIMITED']

const normalizePendingImportTextField = (value: PendingImportFieldValue) => String(value ?? '').trim()

const is1688ImportedProductName = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  return normalized.startsWith('[1688抓取]')
}

const normalizePendingImportNumberField = (value: PendingImportFieldValue) => {
  const parsed = Number(String(value ?? '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

const getPendingImportFieldValue = (item: PendingImportQueueItem, field: PendingImportEditableField): PendingImportFieldValue => {
  switch (field) {
    case 'product_name':
      return item.item_productName ?? item.item_parsedName ?? ''
    case 'product_detail':
      return item.item_productDetail ?? ''
    case 'sku_summary_text':
      return item.item_skuSummaryText ?? ''
    case 'supplier_name':
      return item.item_supplierName ?? ''
    case 'source_category_name':
      return item.item_sourceCategoryName ?? ''
    case 'target_category_id':
      return item.item_targetCategoryId ?? ''
    case 'coefficient':
      return item.item_coefficient
    case 'goods_status':
      return item.item_goodsStatus ?? 'DRAFT'
    case 'weight_grams':
      return item.item_weightGrams
    case 'cost_price':
      return item.item_costPrice
    case 'cny_price_min':
      return item.item_cnyPriceMin
    case 'cny_price_max':
      return item.item_cnyPriceMax
    case 'usd_price_min':
      return item.item_usdPriceMin
    case 'usd_price_max':
      return item.item_usdPriceMax
    case 'minimum_order_quantity':
      return item.item_minimumOrderQuantity
    case 'available_stock':
      return item.item_availableStock
    case 'main_image_url':
      return item.item_mainImageUrl ?? item.item_parsedMainImageUrl ?? ''
    default:
      return ''
  }
}

const formatPendingImportComparableValue = (value: PendingImportFieldValue, field: PendingImportEditableField) => {
  if (numberPendingImportFields.has(field)) {
    const parsed = normalizePendingImportNumberField(value)
    return parsed === null ? '' : String(parsed)
  }
  return normalizePendingImportTextField(value)
}

const buildPendingImportFieldPayload = (field: PendingImportEditableField, rawValue: string) => {
  if (numberPendingImportFields.has(field)) {
    const parsed = normalizePendingImportNumberField(rawValue)
    if (parsed === null) {
      throw new Error('请输入有效数字')
    }
    if (['weight_grams', 'minimum_order_quantity', 'available_stock'].includes(field) && parsed < 0) {
      throw new Error('数值不能小于 0')
    }
    if (['cost_price', 'cny_price_min', 'cny_price_max', 'usd_price_min', 'usd_price_max', 'coefficient'].includes(field) && parsed < 0) {
      throw new Error('金额或系数不能小于 0')
    }
    return parsed
  }

  const nextValue = normalizePendingImportTextField(rawValue)
  if (field === 'goods_status') {
    if (!pendingImportStatusOptions.includes(nextValue as ProductStatus)) {
      throw new Error('请选择有效的商品状态')
    }
    return nextValue
  }

  if ((field === 'product_name' || field === 'target_category_id') && !nextValue) {
    throw new Error(field === 'product_name' ? '商品名称不能为空' : '请选择目标分类')
  }

  return nextValue
}

const getProductFieldValue = (item: ProductListItem, field: ProductInlineField): string | number | null => {
  switch (field) {
    case 'product_name':
      return item.product_name
    case 'supplier_name':
      return item.supplier_name ?? ''
    case 'category_id':
      return item.category_id
    case 'goods_status':
      return item.goods_status ?? 'ACTIVE'
    case 'weight_gram':
      return item.weight_gram
    case 'cost_price':
      return item.cost_price
    case 'price_coefficient':
      return item.price_coefficient
    default:
      return ''
  }
}

const formatProductComparableValue = (value: string | number | null, field: ProductInlineField) => {
  if (numberProductFields.has(field)) {
    const parsed = Number(String(value ?? '').trim())
    return Number.isFinite(parsed) ? String(parsed) : ''
  }
  return String(value ?? '').trim()
}

const buildProductFieldPayload = (field: ProductInlineField, rawValue: string) => {
  const trimmed = rawValue.trim()
  if (numberProductFields.has(field)) {
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) throw new Error('请输入有效数字')
    if ((field === 'weight_gram' || field === 'price_coefficient') && parsed <= 0) {
      throw new Error(field === 'weight_gram' ? '重量必须大于0' : '价格系数必须大于0')
    }
    if (field === 'cost_price' && parsed < 0) throw new Error('成本价不能小于0')
    return parsed
  }

  if (field === 'product_name' && !trimmed) throw new Error('商品名称不能为空')
  if (field === 'category_id' && !trimmed) throw new Error('请选择目标分类')
  if (field === 'goods_status' && !productGoodsStatusOptions.includes(trimmed as ActionGoodsStatus)) {
    throw new Error('请选择有效的货物状态')
  }
  return trimmed
}

type ProductFormData = Omit<BaseCreateProductInput, 'skus' | 'goods_status'> & {
  goods_status?: ProductFormGoodsStatus
  skus: ProductSkuFormItem[]
  supplier_name?: string | null
  brand_keyword?: string | null
  cost_price?: number | null
  effective_price_coefficient?: number | null
  main_category_id?: string
  main_category_name?: string
  main_category_price_coefficient?: number | null
  linked_category_ids: string[]
  linked_keyword_ids: string[]
}

type BatchImportDraftPayload = NonNullable<Parameters<typeof batchImportProducts>[0]>['rows'][number]

const USD_EXCHANGE_RATE = 6.5
const SKU_SELECTION_PREFIX = 'sku:'

const toCurrency = (value?: number | null) => (value === null || value === undefined || Number.isNaN(value) ? '--' : Number(value).toFixed(2))
const toUsdPreview = (value?: number | null) => (value === null || value === undefined || Number.isNaN(value) ? null : Number((value / USD_EXCHANGE_RATE).toFixed(2)))
const isSkuSelectionId = (value: string) => value.startsWith(SKU_SELECTION_PREFIX)
const toSkuSelectionId = (skuId: string) => `${SKU_SELECTION_PREFIX}${skuId}`
const fromSkuSelectionId = (value: string) => value.slice(SKU_SELECTION_PREFIX.length)

const defaultImportRow = (): BatchImportRowInput => ({
  product_code: '',
  sku_code: '',
  name: '',
  weight_gram: '',
  cost_price: '',
  product_price: '',
  main_image_url: '',
  gallery_urls: [],
  detail_text: '',
  category_name: '',
  supplier_name: '',
  brand_keyword: '',
  price_coefficient: '1',
  color: '',
  spec: ''
})

const BATCH_IMPORT_HEADER_ALIASES: Record<keyof BatchImportRowInput, string[]> = {
  product_code: ['产品编号', '编号', 'product_code', 'product code'],
  sku_code: ['sku', '货号', 'sku编码'],
  product_price: ['产品价格', '售价', '价格', 'price'],
  name: ['名称', '产品名称', '商品名称', 'name'],
  brand_keyword: ['品牌', '品牌关键词', 'brand'],
  supplier_name: ['供应商', 'supplier'],
  category_name: ['类目', '产品分类', '分类', 'category'],
  color: ['颜色', 'color'],
  spec: ['规格', '尺码', '尺寸', 'size', 'spec'],
  weight_gram: ['重量', '重量(g)', 'weight'],
  cost_price: ['成本价', 'cost', 'cost_price'],
  main_image_url: ['图片', '主图', 'image', 'image_url'],
  detail_text: ['详情', 'detail'],
  price_coefficient: ['价格系数', '系数', 'price_coefficient', 'coefficient'],
  gallery_urls: ['图集', '多图', 'gallery']
}

const mapColsToImportRow = (cols: string[], indexMap?: Partial<Record<keyof BatchImportRowInput, number>>): BatchImportRowInput => {
  const pick = (field: keyof BatchImportRowInput, fallbackIndex?: number) => {
    if (indexMap && indexMap[field] !== undefined) return cols[indexMap[field]!] || ''
    if (fallbackIndex !== undefined) return cols[fallbackIndex] || ''
    return ''
  }
  const mainImage = pick('main_image_url', 3)
  const galleryRaw = pick('gallery_urls')
  const gallery_urls = Array.from(new Set([
    ...(mainImage ? [mainImage] : []),
    ...galleryRaw.split(/[,，|]/).map(item => item.trim()).filter(Boolean)
  ]))
  return {
    product_code: pick('product_code'),
    sku_code: pick('sku_code'),
    name: pick('name', 0),
    weight_gram: pick('weight_gram', 1),
    cost_price: pick('cost_price', 2),
    product_price: pick('product_price'),
    main_image_url: mainImage || gallery_urls[0] || '',
    gallery_urls,
    detail_text: pick('detail_text', 4),
    category_name: pick('category_name', 5),
    supplier_name: pick('supplier_name', 6),
    brand_keyword: pick('brand_keyword', 7),
    price_coefficient: pick('price_coefficient', 8) || '1',
    color: pick('color'),
    spec: pick('spec')
  }
}

const buildHeaderIndexMap = (headerRow: string[]): Partial<Record<keyof BatchImportRowInput, number>> | null => {
  const normalized = headerRow.map(cell => cell.trim().toLowerCase())
  const indexMap: Partial<Record<keyof BatchImportRowInput, number>> = {}
  ;(Object.keys(BATCH_IMPORT_HEADER_ALIASES) as Array<keyof BatchImportRowInput>).forEach(field => {
    const aliases = BATCH_IMPORT_HEADER_ALIASES[field].map(item => item.toLowerCase())
    const idx = normalized.findIndex(cell => aliases.includes(cell))
    if (idx >= 0) indexMap[field] = idx
  })
  return Object.keys(indexMap).length >= 2 ? indexMap : null
}

const defaultFormData: ProductFormData = {
  name: '',
  category_id: '',
  supplier_name: '',
  brand_keyword: '',
  goods_status: 'ACTIVE',
  weight_gram: null,
  cost_price: null,
  price_coefficient: 1,
  effective_price_coefficient: 1,
  main_category_id: '',
  main_category_name: '',
  main_category_price_coefficient: null,
  linked_category_ids: [],
  linked_keyword_ids: [],
  detail_text: '',
  main_image_url: '',
  short_description: '',
  gallery_json: [],
  detail_content_json: [],
  parameter_json: [{ group: '基本参数', items: [] }],
  trade_info_json: { shipFrom: '', deliveryDays: 0, minOrderQty: 1, supportedRegions: [], shippingNote: '', tradeNotice: '' },
  faq_json: [],
  skus: [],
  submit_action: 'DRAFT'
}

export interface ProductManagementState {
  activeTab: ProductManagementTab
  filterKeyword: string
  filterCategoryId: string
  filterStatus: string
  filterGoodsStatus: string
  filterManagementStatus: ProductListFilterStatus
  filterSupplierName: string
  filterBrandKeyword: string
  loading: boolean
  list: ProductListItem[]
  total: number
  categoryOptions: CategoryOption[]
  selectedIds: string[]
  currentPage: number
  pageSize: number
  drawerOpen: boolean
  drawerMode: DrawerMode
  drawerLoading: boolean
  saving: boolean
  currentEditId: string | null
  formData: ProductFormData
  specDimensions: SpecDimension[]
  confirmDialogOpen: boolean
  confirmAction: BatchActionType
  confirmTargetIds: string[]
  confirmLoading: boolean
  batchPriceCoefficientValue: string
  batchPriceAdjustMode: PriceAdjustMode
  batchCategoryId: string
  batchManagementStatus: ProductListStatusFilter
  batchWeightPriceMode: BatchWeightPriceMode
  batchWeightPriceValue: string
  batchMinOrderQty: string
  bindingCategoryOptions: SelectOption[]
  bindingKeywordOptions: SelectOption[]
  hierarchicalCategoryOptions: CategoryOption[]
  batchBindCategoryIds: string[]
  batchUnbindCategoryIds: string[]
  batchBindKeywordIds: string[]
  batchCategoryPreviewId: string | null
  batchCategoryPreviewLoading: boolean
  batchCategoryPreviewProducts: CategoryProductPreviewItem[]
  batchCategoryPreviewTotal: number
  inlineEditingCell: { productId: string; field: ProductInlineField } | null
  inlineEditingValue: string
  inlineSaving: boolean
  batchImportOpen: boolean
  batchImportText: string
  batchImportRows: BatchImportRowInput[]
  batchImportSubmitting: boolean
  batchImportFileName: string
  batchImportParsing: boolean
  batchImportImageUploadingKey: string | null
  pendingImportImageUploadingId: string | null
  pendingImportSkuImageUploadingKey: string | null
  mainImageUploading: boolean
  galleryUploadingIndex: number | null
  featuredKeywords: string[]
  featuredKeywordInput: string
  featuredKeywordsSaving: boolean
  pendingImportDialogOpen: boolean
  pendingImportTaskForm: PendingImportTaskForm
  pendingImportCreating: boolean
  pendingImportRefreshing: boolean
  pendingImportPublishing: boolean
  /** True when any pending-import row is currently re-parsing (derived). */
  pendingImportReparsing: boolean
  /** Per-row reparse lock — only these rows show「解析中...」; other UI stays interactive. */
  reparsingItemIds: Record<string, true>
  pendingImportQueueLoading: boolean
  pendingImportActiveTask: PendingImportQueueTaskSummary | null
  pendingImportQueue: PendingImportQueueItem[]
  pendingImportPagedQueue: PendingImportQueueItem[]
  pendingImportQueueTotal: number
  pendingImportQueueError: string | null
  pendingImportPage: number
  pendingImportPageSize: number
  pendingImportTotalPages: number
  is1688NameSearch: boolean
  landingSearchName: string
  matchedPublishedImportProduct: ProductListItem | null
  shouldShowPendingImportLanding: boolean
  shouldShowPublishedDraftLanding: boolean
  pendingImportSelectedIds: string[]
  pendingImportInlineEditingCell: PendingImportEditableCell | null
  pendingImportInlineEditingValue: string
  pendingImportInlineSaving: boolean
  productCategoryPicker: { productId: string; selectedId: string } | null
  pendingCategoryPicker: { itemId: string; selectedId: string } | null
  expandedProductIds: string[]
  expandedPendingImportIds: string[]
  productSkuEditingCell: ProductSkuEditableCell | null
  productSkuEditingValue: string
  productSkuSaving: boolean
  pendingImportSkuEditingCell: PendingImportSkuEditableCell | null
  pendingImportSkuEditingValue: string
  pendingImportSkuSaving: boolean
  sync1688PanelOpen: boolean
  sync1688Syncing: boolean
  sync1688Applying: boolean
  sync1688Delisted: Sync1688StatusItem[]
  sync1688OutOfStock: Sync1688StatusItem[]
  sync1688Normal: Sync1688StatusItem[]
  sync1688UnknownCount: number
  sync1688SkippedCount: number
  sync1688SelectedIds: string[]
  sync1688NoteDialogOpen: boolean
  sync1688NoteDraft: string
  reclassifyRunning: boolean
  spanishTitleBackfillRunning: boolean
}

export interface ProductManagementHandlers {
  setActiveTab: (tab: ProductManagementTab) => void
  navigateToTableImport: () => void
  setFilterKeyword: (val: string) => void
  setFilterCategoryId: (val: string) => void
  setFilterStatus: (val: string) => void
  setFilterGoodsStatus: (val: 'ALL' | ActionGoodsStatus) => void
  setFilterManagementStatus: (val: ProductListFilterStatus) => void
  setFilterSupplierName: (val: string) => void
  setFilterBrandKeyword: (val: string) => void
  handleSearch: () => void
  handleReset: () => void
  handleSelectAll: (checked: boolean) => void
  handleSelectRow: (id: string, checked: boolean) => void
  setCurrentPage: (page: number) => void
  handleOpenCreate: () => void
  handleOpenEdit: (id: string) => void
  setDrawerOpen: (open: boolean) => void
  handleFormFieldChange: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void
  handleTradeInfoChange: <K extends keyof TradeInfo>(field: K, value: TradeInfo[K]) => void
  handleUploadMainImage: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  handleUploadGalleryImage: (index: number, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  addGalleryItem: () => void
  updateGalleryItem: (index: number, url: string) => void
  removeGalleryItem: (index: number) => void
  addDetailBlock: (type: 'text' | 'image') => void
  updateDetailBlock: (index: number, content: string) => void
  removeDetailBlock: (index: number) => void
  addParameter: () => void
  updateParameter: (index: number, field: 'key' | 'value', val: string) => void
  removeParameter: (index: number) => void
  addSpecDimension: () => void
  updateSpecDimension: (index: number, field: keyof SpecDimension, val: string) => void
  removeSpecDimension: (index: number) => void
  generateSkus: () => void
  updateSkuRow: (index: number, field: keyof SkuItem, val: any) => void
  handleSubmitForm: (action: 'DRAFT' | 'ACTIVE' | 'INACTIVE') => Promise<void>
  openConfirmDialog: (action: BatchActionType, ids: string[]) => void
  setBatchPriceCoefficientValue: (val: string) => void
  setBatchPriceAdjustMode: (mode: PriceAdjustMode) => void
  setBatchCategoryId: (value: string) => void
  setBatchManagementStatus: (value: ProductListStatusFilter) => void
  setBatchWeightPriceMode: (value: BatchWeightPriceMode) => void
  setBatchWeightPriceValue: (value: string) => void
  setBatchMinOrderQty: (value: string) => void
  toggleFormLinkedCategory: (value: string, checked: boolean) => void
  toggleFormLinkedKeyword: (value: string, checked: boolean) => void
  toggleBatchBindCategory: (value: string, checked: boolean) => void
  toggleBatchUnbindCategory: (value: string, checked: boolean) => void
  setBatchCategoryPreviewId: (categoryId: string | null) => void
  toggleBatchBindKeyword: (value: string, checked: boolean) => void
  startInlineEdit: (productId: string, field: ProductInlineField, value: string | number | null) => void
  changeInlineEditingValue: (value: string) => void
  cancelInlineEdit: () => void
  submitInlineEdit: () => Promise<void>
  openProductCategoryPicker: (productId: string, currentCategoryId?: string | null) => void
  cancelProductCategoryPicker: () => void
  saveProductField: (productId: string, field: ProductInlineField, value: string | number | null) => Promise<void>
  unbindProductCategory: (productId: string, categoryId: string) => Promise<void>
  handleApplyCategoryCoefficientToForm: () => void
  handleConfirmAction: () => Promise<void>
  setConfirmDialogOpen: (open: boolean) => void
  setBatchImportOpen: (open: boolean) => void
  setBatchImportText: (val: string) => void
  handleParseBatchImport: () => void
  handleUploadBatchImportFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  updateBatchImportRow: (index: number, field: keyof BatchImportRowInput, value: string) => void
  uploadBatchImportImages: (index: number, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  replaceBatchImportImage: (rowIndex: number, imageIndex: number, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  removeBatchImportImage: (rowIndex: number, imageIndex: number) => void
  uploadPendingImportImages: (itemId: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  replacePendingImportImage: (itemId: string, imageIndex: number, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  removePendingImportImage: (itemId: string, imageIndex: number) => Promise<void>
  uploadPendingImportSkuImage: (itemId: string, skuKey: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  replacePendingImportSkuImage: (itemId: string, skuKey: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  removePendingImportSkuImage: (itemId: string, skuKey: string) => Promise<void>
  addBatchImportRow: () => void
  removeBatchImportRow: (index: number) => void
  handleSubmitBatchImport: () => Promise<void>
  setFeaturedKeywordInput: (value: string) => void
  addFeaturedKeyword: () => void
  removeFeaturedKeyword: (keyword: string) => void
  saveFeaturedKeywords: () => Promise<void>
  setPendingImportDialogOpen: (open: boolean) => void
  updatePendingImportTaskForm: <K extends keyof PendingImportTaskForm>(field: K, value: PendingImportTaskForm[K]) => void
  submitPendingImportTask: () => Promise<void>
  refreshPendingImportQueue: (options?: { silent?: boolean }) => Promise<void>
  setPendingImportPage: (page: number) => void
  retryPendingImportActiveTask: () => Promise<void>
  handleSelectAllPendingImport: (checked: boolean) => void
  handleSelectPendingImportRow: (id: string, checked: boolean) => void
  startPendingImportInlineEdit: (itemId: string, field: PendingImportEditableField, value: PendingImportFieldValue) => void
  changePendingImportInlineEditingValue: (value: string) => void
  cancelPendingImportInlineEdit: () => void
  submitPendingImportInlineEdit: (overrideValue?: string) => Promise<void>
  savePendingImportField: (itemId: string, field: PendingImportEditableField, value: PendingImportFieldValue) => Promise<void>
  openPendingCategoryPicker: (itemId: string, currentCategoryId?: string | null) => void
  setPendingCategoryPickerSelected: (categoryId: string) => void
  confirmPendingCategoryPicker: () => Promise<void>
  cancelPendingCategoryPicker: () => void
  publishSelectedPendingImportItems: (itemIdsOverride?: string[]) => Promise<void>
  reparseSelectedPendingImportItems: (itemIdsOverride?: string[]) => Promise<void>
  deleteSelectedPendingImportItems: (itemIdsOverride?: string[]) => Promise<void>
  publishPendingImportItem: (itemId: string) => Promise<void>
  toggleProductExpand: (productId: string) => void
  togglePendingImportExpand: (itemId: string) => void
  startProductSkuInlineEdit: (productId: string, skuId: string, field: ProductSkuInlineField, value: string | number | null) => void
  changeProductSkuEditingValue: (value: string) => void
  cancelProductSkuInlineEdit: () => void
  submitProductSkuInlineEdit: () => Promise<void>
  startPendingImportSkuInlineEdit: (itemId: string, skuKey: string, field: PendingImportSkuEditableField, value: string | number | null) => void
  changePendingImportSkuEditingValue: (value: string) => void
  cancelPendingImportSkuInlineEdit: () => void
  submitPendingImportSkuInlineEdit: () => Promise<void>
  submitPendingImportColorGroupEdit: (colorValue: string) => Promise<void>
  handleSync1688Status: () => Promise<void>
  setSync1688PanelOpen: (open: boolean) => void
  toggleSync1688Item: (productId: string, checked: boolean) => void
  toggleSync1688Section: (bucket: 'delisted' | 'out_of_stock' | 'normal', checked: boolean) => void
  handleSync1688BatchDeactivate: () => Promise<void>
  openSync1688NoteDialog: () => void
  setSync1688NoteDialogOpen: (open: boolean) => void
  setSync1688NoteDraft: (value: string) => void
  submitSync1688Notes: () => Promise<void>
  deferSync1688Panel: () => void
  handleReclassifyPublishedProducts: () => Promise<void>
  handleBatchTranslateTitlesToSpanish: () => Promise<void>
}

const buildGalleryFromText = (mainImageUrl: string, detailText: string, galleryInput: Array<{ url: string; sort: number }> = []) => {
  const gallery = galleryInput.filter(item => item.url.trim() !== '').map((item, index) => ({ url: item.url.trim(), sort: index + 1 }))
  if (mainImageUrl.trim() && !gallery.some(item => item.url === mainImageUrl.trim())) {
    gallery.unshift({ url: mainImageUrl.trim(), sort: 1 })
  }
  return gallery.map((item, index) => ({ url: item.url, sort: index + 1 }))
}

const buildDetailContent = (detailText: string, gallery: Array<{ url: string; sort: number }>) => {
  const blocks = [] as Array<{ type: 'text' | 'image'; content: string; title?: string }>
  if (detailText.trim()) {
    blocks.push({ type: 'text', content: detailText.trim(), title: '商品详情' })
  }
  gallery.forEach(item => {
    if (item.url.trim()) {
      blocks.push({ type: 'image', content: item.url.trim() })
    }
  })
  return blocks
}

const normalizeRows = (text: string): BatchImportRowInput[] => {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  if (lines.length === 0) return [defaultImportRow()]
  const firstCols = lines[0].split(/\t|,|\|/).map(item => item.trim())
  const indexMap = buildHeaderIndexMap(firstCols)
  const dataLines = indexMap ? lines.slice(1) : lines
  if (dataLines.length === 0) return [defaultImportRow()]
  return dataLines.map(line => {
    const cols = line.split(/\t|,|\|/).map(item => item.trim())
    return mapColsToImportRow(cols, indexMap || undefined)
  })
}

const normalizeCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const mapSheetRowsToImportRows = (rows: unknown[][]): BatchImportRowInput[] => {
  const normalizedRows = rows
    .map(row => Array.isArray(row) ? row.map(cell => normalizeCellValue(cell)) : [])
    .filter(row => row.some(cell => cell !== ''))

  if (normalizedRows.length === 0) return [defaultImportRow()]

  const indexMap = buildHeaderIndexMap(normalizedRows[0])
  const dataRows = indexMap ? normalizedRows.slice(1) : normalizedRows

  if (dataRows.length === 0) return [defaultImportRow()]

  return dataRows.map(cols => mapColsToImportRow(cols, indexMap || undefined))
}

export const useProductManagement = (): { state: ProductManagementState, handlers: ProductManagementHandlers } => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useMemo(() => ProductManagement.getParams(searchParams), [searchParams])

  const [activeTab, setActiveTab] = useState<ProductManagementTab>(
    params.tab === 'pending_imports' ? 'pending_imports' : 'products',
  )
  const [filterKeyword, setFilterKeyword] = useState(params.name || '')
  const [filterCategoryId, setFilterCategoryId] = useState(params.categoryId || 'ALL')
  const [filterStatus, setFilterStatus] = useState(params.status || 'ALL')
  const [filterGoodsStatus, setFilterGoodsStatus] = useState<'ALL' | ActionGoodsStatus>('ALL')
  const [filterManagementStatus, setFilterManagementStatus] = useState<ProductListFilterStatus>((params.status as ProductListStatusFilter) || 'ALL')
  const [filterSupplierName, setFilterSupplierName] = useState('')
  const [filterBrandKeyword, setFilterBrandKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<ProductListItem[]>([])
  const [total, setTotal] = useState(0)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentEditId, setCurrentEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData)
  const [specDimensions, setSpecDimensions] = useState<SpecDimension[]>([])
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<BatchActionType>(null)
  const [confirmTargetIds, setConfirmTargetIds] = useState<string[]>([])
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [batchPriceCoefficientValue, setBatchPriceCoefficientValue] = useState('1')
  const [batchPriceAdjustMode, setBatchPriceAdjustMode] = useState<PriceAdjustMode>('PRODUCT_COEFFICIENT')
  const [batchCategoryId, setBatchCategoryId] = useState('ALL')
  const [batchManagementStatus, setBatchManagementStatus] = useState<ProductListStatusFilter>('ACTIVE')
  const [batchWeightPriceMode, setBatchWeightPriceMode] = useState<BatchWeightPriceMode>('price_coefficient')
  const [batchWeightPriceValue, setBatchWeightPriceValue] = useState('')
  const [batchMinOrderQty, setBatchMinOrderQty] = useState('1')
  const [bindingCategoryOptions, setBindingCategoryOptions] = useState<SelectOption[]>([])
  const [bindingKeywordOptions, setBindingKeywordOptions] = useState<SelectOption[]>([])
  const [batchBindCategoryIds, setBatchBindCategoryIds] = useState<string[]>([])
  const [batchUnbindCategoryIds, setBatchUnbindCategoryIds] = useState<string[]>([])
  const [batchBindKeywordIds, setBatchBindKeywordIds] = useState<string[]>([])
  const [batchCategoryPreviewId, setBatchCategoryPreviewId] = useState<string | null>(null)
  const [batchCategoryPreviewLoading, setBatchCategoryPreviewLoading] = useState(false)
  const [batchCategoryPreviewProducts, setBatchCategoryPreviewProducts] = useState<CategoryProductPreviewItem[]>([])
  const [batchCategoryPreviewTotal, setBatchCategoryPreviewTotal] = useState(0)
  const [inlineEditingCell, setInlineEditingCell] = useState<{ productId: string; field: ProductInlineField } | null>(null)
  const [inlineEditingValue, setInlineEditingValue] = useState('')
  const [inlineSaving, setInlineSaving] = useState(false)
  const [batchImportOpen, setBatchImportOpen] = useState(false)
  const [batchImportText, setBatchImportText] = useState('')
  const [batchImportRows, setBatchImportRows] = useState<BatchImportRowInput[]>([defaultImportRow()])
  const [batchImportSubmitting, setBatchImportSubmitting] = useState(false)
  const [batchImportFileName, setBatchImportFileName] = useState('')
  const [batchImportParsing, setBatchImportParsing] = useState(false)
  const [batchImportImageUploadingKey, setBatchImportImageUploadingKey] = useState<string | null>(null)

  const selectedProductIds = selectedIds.filter((id) => !isSkuSelectionId(id))
  const selectedSkuIds = selectedIds.filter(isSkuSelectionId).map(fromSkuSelectionId)
  const [pendingImportImageUploadingId, setPendingImportImageUploadingId] = useState<string | null>(null)
  const [pendingImportSkuImageUploadingKey, setPendingImportSkuImageUploadingKey] = useState<string | null>(null)
  const [mainImageUploading, setMainImageUploading] = useState(false)
  const [galleryUploadingIndex, setGalleryUploadingIndex] = useState<number | null>(null)
  const [featuredKeywords, setFeaturedKeywords] = useState<string[]>([])
  const [featuredKeywordInput, setFeaturedKeywordInput] = useState('')
  const [featuredKeywordsSaving, setFeaturedKeywordsSaving] = useState(false)
  const [pendingImportDialogOpen, setPendingImportDialogOpen] = useState(false)
  const [pendingImportTaskForm, setPendingImportTaskForm] = useState<PendingImportTaskForm>(defaultPendingImportTaskForm)
  const [pendingImportCreating, setPendingImportCreating] = useState(false)
  const [pendingImportRefreshing, setPendingImportRefreshing] = useState(false)
  const [pendingImportPublishing, setPendingImportPublishing] = useState(false)
  const [reparsingItemIds, setReparsingItemIds] = useState<Record<string, true>>({})
  const pendingImportReparsing = Object.keys(reparsingItemIds).length > 0
  const [pendingImportQueueLoading, setPendingImportQueueLoading] = useState(false)
  const [pendingImportActiveTask, setPendingImportActiveTask] = useState<PendingImportQueueTaskSummary | null>(null)
  const [pendingImportQueue, setPendingImportQueue] = useState<PendingImportQueueItem[]>([])
  const [pendingImportQueueTotal, setPendingImportQueueTotal] = useState(0)
  const [pendingImportQueueError, setPendingImportQueueError] = useState<string | null>(null)
  const [pendingImportPage, setPendingImportPage] = useState(1)
  const pendingImportPageSize = 50
  const [publishedImportMatch, setPublishedImportMatch] = useState<ProductListItem | null>(null)
  const [pendingImportSelectedIds, setPendingImportSelectedIds] = useState<string[]>([])
  const [pendingImportInlineEditingCell, setPendingImportInlineEditingCell] = useState<PendingImportEditableCell | null>(null)
  const [pendingImportInlineEditingValue, setPendingImportInlineEditingValue] = useState('')
  const [pendingImportInlineSaving, setPendingImportInlineSaving] = useState(false)
  const [productCategoryPicker, setProductCategoryPicker] = useState<{ productId: string; selectedId: string } | null>(null)
  const [pendingCategoryPicker, setPendingCategoryPicker] = useState<{ itemId: string; selectedId: string } | null>(null)
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([])
  const [expandedPendingImportIds, setExpandedPendingImportIds] = useState<string[]>([])
  const [productSkuEditingCell, setProductSkuEditingCell] = useState<ProductSkuEditableCell | null>(null)
  const [productSkuEditingValue, setProductSkuEditingValue] = useState('')
  const [productSkuSaving, setProductSkuSaving] = useState(false)
  const [pendingImportSkuEditingCell, setPendingImportSkuEditingCell] = useState<PendingImportSkuEditableCell | null>(null)
  const [pendingImportSkuEditingValue, setPendingImportSkuEditingValue] = useState('')
  const [pendingImportSkuSaving, setPendingImportSkuSaving] = useState(false)
  const [sync1688PanelOpen, setSync1688PanelOpen] = useState(false)
  const [sync1688Syncing, setSync1688Syncing] = useState(false)
  const [sync1688Applying, setSync1688Applying] = useState(false)
  const [sync1688Delisted, setSync1688Delisted] = useState<Sync1688StatusItem[]>([])
  const [sync1688OutOfStock, setSync1688OutOfStock] = useState<Sync1688StatusItem[]>([])
  const [sync1688Normal, setSync1688Normal] = useState<Sync1688StatusItem[]>([])
  const [sync1688UnknownCount, setSync1688UnknownCount] = useState(0)
  const [sync1688SkippedCount, setSync1688SkippedCount] = useState(0)
  const [sync1688SelectedIds, setSync1688SelectedIds] = useState<string[]>([])
  const [sync1688NoteDialogOpen, setSync1688NoteDialogOpen] = useState(false)
  const [sync1688NoteDraft, setSync1688NoteDraft] = useState('')
  const [reclassifyRunning, setReclassifyRunning] = useState(false)
  const [spanishTitleBackfillRunning, setSpanishTitleBackfillRunning] = useState(false)

  const categoryMap = useMemo(() => new Map<string, CategoryTreeOption>(categoryOptions.map(item => [item.category_id, item])), [categoryOptions])

  const hierarchicalCategoryOptions = useMemo(() => {
    type TreeNode = CategoryOption & { children: TreeNode[] }
    const map = new Map<string, TreeNode>()
    categoryOptions.forEach(option => {
      map.set(option.category_id, { ...option, children: [] })
    })
    const roots: TreeNode[] = []
    map.forEach(node => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    })
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        const levelDiff = (a.level || 0) - (b.level || 0)
        if (levelDiff !== 0) return levelDiff
        return a.category_name.localeCompare(b.category_name, 'zh-CN')
      })
      nodes.forEach(node => sortNodes(node.children))
    }
    sortNodes(roots)

    const flat: CategoryOption[] = []
    const walk = (node: TreeNode, depth: number) => {
      const prefix = depth > 0 ? `${'　'.repeat(depth)}└ ` : ''
      flat.push({
        ...node,
        category_name: `${prefix}${node.category_name}`
      })
      node.children.forEach(child => walk(child, depth + 1))
    }
    roots.forEach(root => walk(root, 0))
    return flat
  }, [categoryOptions])

  const landingSearchName = useMemo(() => String(params.name || '').trim(), [params.name])
  const is1688NameSearch = useMemo(() => is1688ImportedProductName(landingSearchName), [landingSearchName])

  const matchedPublishedImportProduct = is1688NameSearch ? publishedImportMatch : null

  const shouldShowPublishedDraftLanding = is1688NameSearch && !!matchedPublishedImportProduct
  const shouldShowPendingImportLanding = is1688NameSearch && !matchedPublishedImportProduct

  const resolveMainCategory = useCallback((categoryId?: string) => {
    if (!categoryId) return null
    let current = categoryMap.get(categoryId) || null
    let guard = 0
    while (current?.parent_id && guard < 10) {
      const parent = categoryMap.get(current.parent_id)
      if (!parent) break
      current = parent
      guard += 1
    }
    return current
  }, [categoryMap])

  const syncFormCategoryMeta = useCallback((categoryId: string, productCoefficient?: number | null) => {
    const mainCategory = resolveMainCategory(categoryId)
    const categoryCoefficient = mainCategory?.price_coefficient ?? null
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      main_category_id: mainCategory?.category_id || '',
      main_category_name: mainCategory?.category_name || '',
      main_category_price_coefficient: categoryCoefficient,
      effective_price_coefficient: categoryCoefficient ?? productCoefficient ?? prev.price_coefficient ?? null
    }))
  }, [resolveMainCategory])

  const fetchCategoryOptions = async () => {
    try {
      const data = await getCategoryOptions()
      setCategoryOptions(data)
    } catch (err: any) {
      toast.error(err.message || '获取分类选项失败')
    }
  }

  const fetchHomeFeaturedKeywords = useCallback(async () => {
    try {
      const result = await getHomeFeaturedKeywords()
      setFeaturedKeywords(result.keywords || [])
    } catch (err: any) {
      toast.error(err.message || '获取首页推荐关键词失败')
    }
  }, [])

  const fetchBindingMeta = useCallback(async () => {
    try {
      const result = await getProductBindingMeta()
      setBindingCategoryOptions(result.category_options || [])
      setBindingKeywordOptions(result.keyword_options || [])
    } catch (err: any) {
      toast.error(err.message || '获取绑定选项失败')
    }
  }, [])

  const fetchList = useCallback(async (overrides?: Partial<{
    keyword?: string
    category_id?: string
    status_filter: ProductListFilterStatus
    goods_status: 'ALL' | ActionGoodsStatus
    supplier_name: string
    brand_keyword: string
    page: number
  }>) => {
    setLoading(true)
    try {
      const nextKeyword = overrides?.keyword !== undefined
        ? overrides.keyword
        : (filterKeyword.trim() || params.name || undefined)
      const nextStatusFilter = overrides?.status_filter ?? filterManagementStatus
      const nextGoodsStatus = overrides?.goods_status ?? filterGoodsStatus
      const nextPage = overrides?.page ?? currentPage

      const result = await getProductList({
        keyword: nextKeyword || undefined,
        category_id: (overrides?.category_id ?? params.categoryId) || undefined,
        status_filter: nextStatusFilter,
        goods_status: nextGoodsStatus === 'ALL' ? undefined : nextGoodsStatus,
        supplier_name: (overrides?.supplier_name ?? filterSupplierName).trim() || undefined,
        brand_keyword: (overrides?.brand_keyword ?? filterBrandKeyword).trim() || undefined,
        page: nextPage,
        page_size: pageSize
      })
      setList(result.list)
      setTotal(result.total)
      setPublishedImportMatch(result.published_import_match || null)
      setSelectedIds([])
    } catch (err: any) {
      setPublishedImportMatch(null)
      toast.error(err.message || '获取商品列表失败')
    } finally {
      setLoading(false)
    }
  }, [params.name, params.categoryId, filterKeyword, filterManagementStatus, filterGoodsStatus, filterSupplierName, filterBrandKeyword, currentPage])

  const applyPendingImportQueueResult = useCallback((result: ProductManagementPendingImportQueueOutput) => {
    setPendingImportActiveTask(result.activeTask || null)
    const visibleItems = (result.list || []).filter(item => !item.item_isPublished)
    setPendingImportQueue(visibleItems)
    setPendingImportQueueTotal(visibleItems.length)
    setPendingImportSelectedIds(prev => prev.filter(id => visibleItems.some(item => item.item_id === id)))
    setPendingImportPage(prev => {
      const totalPages = Math.max(1, Math.ceil(visibleItems.length / 50))
      return Math.min(prev, totalPages)
    })
  }, [])

  const pendingImportTotalPages = Math.max(1, Math.ceil(pendingImportQueueTotal / pendingImportPageSize))
  const pendingImportPagedQueue = useMemo(() => {
    const start = (pendingImportPage - 1) * pendingImportPageSize
    return pendingImportQueue.slice(start, start + pendingImportPageSize)
  }, [pendingImportQueue, pendingImportPage, pendingImportPageSize])

  const handleSetPendingImportPage = (page: number) => {
    const next = Math.max(1, Math.min(page, pendingImportTotalPages))
    setPendingImportPage(next)
  }

  const refreshPendingImportQueue = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (silent) {
      setPendingImportRefreshing(true)
    } else {
      setPendingImportQueueLoading(true)
    }
    try {
      const result = await getPendingImportQueue()
      applyPendingImportQueueResult(result)
      setPendingImportQueueError(null)
    } catch (err: any) {
      const message = err.message || '获取待上传区数据失败'
      if (!silent) {
        setPendingImportActiveTask(null)
        setPendingImportQueue([])
        setPendingImportQueueTotal(0)
        setPendingImportSelectedIds([])
      }
      if (!silent || pendingImportQueue.length === 0) {
        if (pendingImportQueueError !== message) {
          toast.error(message)
        }
      }
      setPendingImportQueueError(message)
    } finally {
      if (silent) {
        setPendingImportRefreshing(false)
      } else {
        setPendingImportQueueLoading(false)
      }
    }
  }, [applyPendingImportQueueResult, pendingImportQueue.length, pendingImportQueueError])
  useEffect(() => {
    if (params.tab === 'pending_imports') {
      setActiveTab('pending_imports')
      void refreshPendingImportQueue({ silent: true })
    }
  }, [params.tab, refreshPendingImportQueue])

  useEffect(() => {
    fetchCategoryOptions()
    fetchHomeFeaturedKeywords()
    fetchBindingMeta()
  }, [fetchBindingMeta, fetchHomeFeaturedKeywords])

  useEffect(() => {
    setFilterCategoryId(params.categoryId || 'ALL')
  }, [params.categoryId])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    refreshPendingImportQueue()
  }, [refreshPendingImportQueue])

  useEffect(() => {
    if (!pendingImportActiveTask || !pollingTaskStatuses.includes(pendingImportActiveTask.task_status)) {
      return
    }
    const timer = window.setInterval(() => {
      refreshPendingImportQueue({ silent: true })
    }, 5000)
    return () => window.clearInterval(timer)
  }, [pendingImportActiveTask, refreshPendingImportQueue])

  const loadCategoryProductPreview = useCallback(async (categoryId: string | null) => {
    if (!categoryId) {
      setBatchCategoryPreviewId(null)
      setBatchCategoryPreviewProducts([])
      setBatchCategoryPreviewTotal(0)
      setBatchCategoryPreviewLoading(false)
      return
    }
    setBatchCategoryPreviewId(categoryId)
    setBatchCategoryPreviewLoading(true)
    try {
      const result = await getCategoryProductPreview({ category_id: categoryId, limit: 50 })
      setBatchCategoryPreviewProducts(result.products || [])
      setBatchCategoryPreviewTotal(result.total || 0)
    } catch (err: any) {
      setBatchCategoryPreviewProducts([])
      setBatchCategoryPreviewTotal(0)
      toast.error(err.message || '加载类目商品预览失败')
    } finally {
      setBatchCategoryPreviewLoading(false)
    }
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    ProductManagement.navigateToWithFilters(router, {
      name: filterKeyword,
      categoryId: filterCategoryId === 'ALL' ? '' : filterCategoryId,
      status: filterManagementStatus === 'ALL' ? '' : filterManagementStatus
    })
  }

  const handleFilterCategoryChange = (categoryId: string) => {
    setFilterCategoryId(categoryId)
    setCurrentPage(1)
    ProductManagement.navigateToWithFilters(router, {
      name: filterKeyword,
      categoryId: categoryId === 'ALL' ? '' : categoryId,
      status: filterManagementStatus === 'ALL' ? '' : filterManagementStatus
    })
  }

  const handleReset = () => {
    setFilterKeyword('')
    setFilterCategoryId('ALL')
    setFilterStatus('ALL')
    setFilterGoodsStatus('ALL')
    setFilterManagementStatus('ALL')
    setFilterSupplierName('')
    setFilterBrandKeyword('')
    setCurrentPage(1)
    ProductManagement.navigateToAll(router)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? list.map(item => item.product_id) : [])
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
  }

  const handleOpenCreate = () => {
    setDrawerMode('create')
    setCurrentEditId(null)
    setFormData(defaultFormData)
    setSpecDimensions([])
    setDrawerOpen(true)
  }

  const handleOpenEdit = async (id: string) => {
    setDrawerMode('edit')
    setCurrentEditId(id)
    setDrawerLoading(true)
    setDrawerOpen(true)
    setSpecDimensions([])
    try {
      const detail = await getProductDetail(id)
      setFormData({
        name: detail.name,
        category_id: detail.category_id,
        supplier_name: detail.supplier_name || '',
        brand_keyword: detail.brand_keyword || '',
        goods_status: (detail.goods_status || 'ACTIVE') as ProductFormGoodsStatus,
        linked_category_ids: detail.linked_category_ids || [],
        linked_keyword_ids: detail.linked_keyword_ids || [],
        weight_gram: detail.weight_gram,
        cost_price: detail.cost_price,
        price_coefficient: detail.price_coefficient ?? detail.effective_price_coefficient ?? 2,
        effective_price_coefficient: detail.effective_price_coefficient,
        main_category_id: detail.main_category_id,
        main_category_name: detail.main_category_name,
        main_category_price_coefficient: detail.main_category_price_coefficient,
        detail_text: detail.detail_text || '',
        main_image_url: detail.main_image_url,
        short_description: detail.short_description || '',
        gallery_json: detail.gallery_json || [],
        detail_content_json: detail.detail_content_json || [],
        parameter_json: detail.parameter_json || [{ group: '基本参数', items: [] }],
        trade_info_json: detail.trade_info_json || defaultFormData.trade_info_json,
        faq_json: detail.faq_json || [],
        skus: detail.skus.map(sku => ({
          sku_id: sku.sku_id,
          sku_code: sku.sku_code,
          image_url: sku.image_url || '',
          price: sku.price,
          original_price: sku.original_price || null,
          stock: sku.stock,
          attribute_json: sku.attribute_json || [],
          delivery_days: sku.delivery_days || null,
          weight_kg: sku.weight_kg || null,
          volume_m3: sku.volume_m3 || null,
          usd_display_price: sku.usd_display_price || toUsdPreview(sku.price),
          usd_display_original_price: sku.usd_display_original_price || toUsdPreview(sku.original_price || null)
        })),
        submit_action: (detail.status as any) || 'DRAFT'
      })
    } catch (err: any) {
      toast.error(err.message || '获取商品详情失败')
      setDrawerOpen(false)
    } finally {
      setDrawerLoading(false)
    }
  }

  const handleFormFieldChange = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    if (field === 'category_id') {
      syncFormCategoryMeta(String(value || ''), formData.price_coefficient ?? null)
      return
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTradeInfoChange = <K extends keyof TradeInfo>(field: K, value: TradeInfo[K]) => {
    setFormData(prev => ({ ...prev, trade_info_json: { ...(prev.trade_info_json as TradeInfo), [field]: value } }))
  }

  const toggleValue = (currentValues: string[], value: string, checked: boolean) => {
    if (checked) return currentValues.includes(value) ? currentValues : [...currentValues, value]
    return currentValues.filter(item => item !== value)
  }

  const toggleFormLinkedCategory = (value: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, linked_category_ids: toggleValue(prev.linked_category_ids || [], value, checked) }))
  }

  const toggleFormLinkedKeyword = (value: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, linked_keyword_ids: toggleValue(prev.linked_keyword_ids || [], value, checked) }))
  }

  const toggleBatchBindCategory = (value: string, checked: boolean) => {
    setBatchBindCategoryIds(prev => toggleValue(prev, value, checked))
    if (checked) {
      void loadCategoryProductPreview(value)
    } else if (batchCategoryPreviewId === value) {
      void loadCategoryProductPreview(null)
    }
  }

  const toggleBatchUnbindCategory = (value: string, checked: boolean) => {
    setBatchUnbindCategoryIds(prev => toggleValue(prev, value, checked))
    if (checked) {
      void loadCategoryProductPreview(value)
    } else if (batchCategoryPreviewId === value) {
      void loadCategoryProductPreview(null)
    }
  }

  const toggleBatchBindKeyword = (value: string, checked: boolean) => {
    setBatchBindKeywordIds(prev => toggleValue(prev, value, checked))
  }

  const uploadImageToProject = async (file: File) => {
    const uploadResult = await upload_project_file(file)
    // upload_project_file / upload_image_file 直接返回 URL 字符串
    if (typeof uploadResult === 'string') {
      const url = uploadResult.trim()
      if (!url) throw new Error('图片上传失败：未返回有效地址')
      return url
    }
    const url = String((uploadResult as { file_url?: string; image_url?: string })?.file_url
      || (uploadResult as { file_url?: string; image_url?: string })?.image_url
      || '').trim()
    if (!url) throw new Error('图片上传失败：未返回有效地址')
    return url
  }

  const handleUploadMainImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setMainImageUploading(true)
    try {
      const fileUrl = await uploadImageToProject(file)
      setFormData(prev => {
        const currentGallery = prev.gallery_json || []
        const hasMainInGallery = currentGallery.some(item => item.url === fileUrl)
        return {
          ...prev,
          main_image_url: fileUrl,
          gallery_json: hasMainInGallery ? currentGallery : [{ url: fileUrl, sort: 1 }, ...currentGallery.map((item, index) => ({ ...item, sort: index + 2 }))],
          skus: prev.skus.map(sku => ({ ...sku, image_url: sku.image_url || fileUrl }))
        }
      })
      toast.success('主图上传成功，已自动回填')
    } catch (err: any) {
      toast.error(err.message || '主图上传失败')
    } finally {
      setMainImageUploading(false)
    }
  }

  const handleUploadGalleryImage = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setGalleryUploadingIndex(index)
    try {
      const fileUrl = await uploadImageToProject(file)
      setFormData(prev => {
        const next = [...(prev.gallery_json || [])]
        next[index] = { ...next[index], url: fileUrl, sort: index + 1 }
        return { ...prev, gallery_json: next }
      })
      toast.success('详情图上传成功，已自动回填')
    } catch (err: any) {
      toast.error(err.message || '详情图上传失败')
    } finally {
      setGalleryUploadingIndex(null)
    }
  }

  const addGalleryItem = () => {
    setFormData(prev => ({ ...prev, gallery_json: [...(prev.gallery_json || []), { url: '', sort: (prev.gallery_json?.length || 0) + 1 }] }))
  }

  const updateGalleryItem = (index: number, url: string) => {
    setFormData(prev => {
      const next = [...(prev.gallery_json || [])]
      next[index] = { ...next[index], url }
      return { ...prev, gallery_json: next }
    })
  }

  const removeGalleryItem = (index: number) => {
    setFormData(prev => ({ ...prev, gallery_json: (prev.gallery_json || []).filter((_, i) => i !== index) }))
  }

  const addDetailBlock = (type: 'text' | 'image') => {
    setFormData(prev => ({ ...prev, detail_content_json: [...(prev.detail_content_json || []), { type, content: '' }] }))
  }

  const updateDetailBlock = (index: number, content: string) => {
    setFormData(prev => {
      const next = [...(prev.detail_content_json || [])]
      next[index] = { ...next[index], content }
      return { ...prev, detail_content_json: next }
    })
  }

  const removeDetailBlock = (index: number) => {
    setFormData(prev => ({ ...prev, detail_content_json: (prev.detail_content_json || []).filter((_, i) => i !== index) }))
  }

  const addParameter = () => {
    setFormData(prev => {
      const currentParams = prev.parameter_json || [{ group: '基本参数', items: [] }]
      const newParams = JSON.parse(JSON.stringify(currentParams))
      if (newParams.length === 0) newParams.push({ group: '基本参数', items: [] })
      newParams[0].items.push({ key: '', value: '' })
      return { ...prev, parameter_json: newParams }
    })
  }

  const updateParameter = (index: number, field: 'key' | 'value', val: string) => {
    setFormData(prev => {
      const newParams = JSON.parse(JSON.stringify(prev.parameter_json || [{ group: '基本参数', items: [] }]))
      newParams[0].items[index] = { ...newParams[0].items[index], [field]: val }
      return { ...prev, parameter_json: newParams }
    })
  }

  const removeParameter = (index: number) => {
    setFormData(prev => {
      const newParams = JSON.parse(JSON.stringify(prev.parameter_json || [{ group: '基本参数', items: [] }]))
      newParams[0].items = newParams[0].items.filter((_: any, i: number) => i !== index)
      return { ...prev, parameter_json: newParams }
    })
  }

  const addSpecDimension = () => setSpecDimensions(prev => [...prev, { name: '', values: '' }])

  const updateSpecDimension = (index: number, field: keyof SpecDimension, val: string) => {
    setSpecDimensions(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: val }
      return next
    })
  }

  const removeSpecDimension = (index: number) => setSpecDimensions(prev => prev.filter((_, i) => i !== index))

  const generateSkus = () => {
    const validDimensions = specDimensions.filter(d => d.name.trim() !== '' && d.values.trim() !== '')
    if (validDimensions.length === 0) {
      const weightKg = formData.weight_gram ? Number((formData.weight_gram / 1000).toFixed(3)) : null
      setFormData(prev => ({
        ...prev,
        skus: [{
          sku_code: prev.skus[0]?.sku_code || '',
          price: prev.skus[0]?.price || 0,
          stock: prev.goods_status !== 'ACTIVE' ? 0 : (prev.skus[0]?.stock || 1),
          attribute_json: [],
          image_url: prev.main_image_url || '',
          weight_kg: weightKg,
          usd_display_price: toUsdPreview(prev.skus[0]?.price || 0),
          usd_display_original_price: toUsdPreview(prev.skus[0]?.original_price || null)
        }]
      }))
      toast.success('已生成默认 SKU')
      return
    }

    const parsedGroups = validDimensions.map(d => d.values.split(',').map(v => v.trim()).filter(Boolean).map(v => ({ name: d.name.trim(), value: v })))
    const cartesianProduct = parsedGroups.reduce<SkuAttribute[][]>((acc, curr) => {
      if (acc.length === 0) return curr.map(item => [item])
      const next: SkuAttribute[][] = []
      acc.forEach(existing => curr.forEach(item => next.push([...existing, item])))
      return next
    }, [])

    const weightKg = formData.weight_gram ? Number((formData.weight_gram / 1000).toFixed(3)) : null
    const newSkus: SkuItem[] = cartesianProduct.map(attrs => {
      const matchExisting = formData.skus.find(oldSku => JSON.stringify(oldSku.attribute_json || []) === JSON.stringify(attrs))
      if (matchExisting) {
        return {
          ...matchExisting,
          weight_kg: weightKg,
          image_url: matchExisting.image_url || formData.main_image_url || '',
          usd_display_price: toUsdPreview(matchExisting.price),
          usd_display_original_price: toUsdPreview(matchExisting.original_price || null)
        }
      }
      return {
        sku_code: '',
        price: 0,
        stock: formData.goods_status !== 'ACTIVE' ? 0 : 1,
        attribute_json: attrs,
        image_url: formData.main_image_url || '',
        weight_kg: weightKg,
        usd_display_price: null,
        usd_display_original_price: null
      }
    })

    setFormData(prev => ({ ...prev, skus: newSkus }))
    toast.success(`成功生成 ${newSkus.length} 个 SKU`)
  }

  const updateSkuRow = (index: number, field: keyof SkuItem, val: any) => {
    setFormData(prev => {
      const next = [...prev.skus]
      next[index] = { ...next[index], [field]: val }
      if (field === 'price' || field === 'original_price') {
        next[index].usd_display_price = toUsdPreview(field === 'price' ? Number(val) : next[index].price)
        next[index].usd_display_original_price = toUsdPreview(field === 'original_price' ? Number(val) : next[index].original_price || null)
      }
      return { ...prev, skus: next }
    })
  }

  const handleApplyCategoryCoefficientToForm = () => {
    const categoryCoefficient = formData.main_category_price_coefficient
    if (!categoryCoefficient || categoryCoefficient <= 0) {
      toast.error('当前主类目未配置有效售价系数')
      return
    }
    setFormData(prev => ({
      ...prev,
      effective_price_coefficient: categoryCoefficient,
      skus: prev.skus.map(sku => ({
        ...sku,
        usd_display_price: toUsdPreview(sku.price),
        usd_display_original_price: toUsdPreview(sku.original_price || null)
      }))
    }))
    toast.success('保存后将按主类目系数重算 SKU 售价')
  }

  const addFeaturedKeyword = () => {
    const nextKeyword = featuredKeywordInput.trim()
    if (!nextKeyword) {
      toast.error('请输入关键词后再添加')
      return
    }
    if (featuredKeywords.includes(nextKeyword)) {
      toast.error('该关键词已存在')
      return
    }
    setFeaturedKeywords(prev => [...prev, nextKeyword])
    setFeaturedKeywordInput('')
  }

  const removeFeaturedKeyword = (keyword: string) => {
    setFeaturedKeywords(prev => prev.filter(item => item !== keyword))
  }

  const saveFeaturedKeywords = async () => {
    setFeaturedKeywordsSaving(true)
    try {
      const result = await saveHomeFeaturedKeywords({ keywords: featuredKeywords })
      setFeaturedKeywords(result.keywords || [])
      toast.success('首页推荐关键词已保存')
    } catch (err: any) {
      toast.error(err.message || '保存首页推荐关键词失败')
    } finally {
      setFeaturedKeywordsSaving(false)
    }
  }

  const updatePendingImportTaskForm = <K extends keyof PendingImportTaskForm>(field: K, value: PendingImportTaskForm[K]) => {
    setPendingImportTaskForm(prev => ({ ...prev, [field]: value }))
  }

  const submitPendingImportTask = async () => {
    const urls = pendingImportTaskForm.urls
      .split(/\n|,|;|\s+/)
      .map(item => item.trim())
      .filter(Boolean)

    if (!urls.length) {
      toast.error('请先粘贴至少一个 1688 商品链接')
      return
    }
    if (!pendingImportTaskForm.defaultCategoryId) {
      toast.error('请选择默认入库类目')
      return
    }

    setPendingImportCreating(true)
    try {
      const created = await createPendingImportTaskForProductManagement({
        urls: urls.join('\n'),
        defaultCategoryId: pendingImportTaskForm.defaultCategoryId,
        defaultStatus: pendingImportTaskForm.defaultStatus,
        costDeductionUsd: pendingImportTaskForm.costDeductionUsd ? Number(pendingImportTaskForm.costDeductionUsd) : undefined,
        stockStrategyStock: pendingImportTaskForm.stockStrategyStock ? Number(pendingImportTaskForm.stockStrategyStock) : undefined
      })
      await startPendingImportTaskForProductManagement({ taskId: created.taskId })
      toast.success(`已创建 ${urls.length} 条 1688 采集任务，系统将异步抓取并回填待上传区`)
      setPendingImportDialogOpen(false)
      setPendingImportTaskForm(defaultPendingImportTaskForm())
      setActiveTab('pending_imports')
      await refreshPendingImportQueue()
    } catch (err: any) {
      toast.error(err.message || '创建采集任务失败')
    } finally {
      setPendingImportCreating(false)
    }
  }

  const retryPendingImportActiveTask = async () => {
    if (!pendingImportActiveTask) {
      toast.error('当前没有可重试的采集任务')
      return
    }
    setPendingImportRefreshing(true)
    try {
      await retryPendingImportTaskForProductManagement({ taskId: pendingImportActiveTask.task_id })
      toast.success('已触发当前任务重试，系统会继续刷新采集进度')
      await refreshPendingImportQueue({ silent: true })
    } catch (err: any) {
      toast.error(err.message || '重试任务失败')
    } finally {
      setPendingImportRefreshing(false)
    }
  }

  const handleSelectAllPendingImport = (checked: boolean) => {
    setPendingImportSelectedIds(checked ? pendingImportQueue.map(item => item.item_id) : [])
  }

  const handleSelectPendingImportRow = (id: string, checked: boolean) => {
    setPendingImportSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(itemId => itemId !== id))
  }

  const startPendingImportInlineEdit = (itemId: string, field: PendingImportEditableField, value: PendingImportFieldValue) => {
    if (!editablePendingImportFields.includes(field)) return
    setPendingImportInlineEditingCell({ itemId, field })
    setPendingImportInlineEditingValue(value === null || value === undefined ? '' : String(value))
  }

  const changePendingImportInlineEditingValue = (value: string) => {
    setPendingImportInlineEditingValue(value)
  }

  const cancelPendingImportInlineEdit = () => {
    setPendingImportInlineEditingCell(null)
    setPendingImportInlineEditingValue('')
  }

  const savePendingImportField = async (
    itemId: string,
    field: PendingImportEditableField,
    value: PendingImportFieldValue
  ) => {
    if (!editablePendingImportFields.includes(field)) return
    if (pendingImportInlineSaving) return

    const currentItem = pendingImportQueue.find(item => item.item_id === itemId)
    if (!currentItem) return

    const originalValue = formatPendingImportComparableValue(getPendingImportFieldValue(currentItem, field), field)
    const nextComparableValue = formatPendingImportComparableValue(value, field)
    if (originalValue === nextComparableValue) return

    setPendingImportInlineSaving(true)
    try {
      const payloadValue = buildPendingImportFieldPayload(field, value === null || value === undefined ? '' : String(value))
      await inlineUpdatePendingImportItemField({
        item_id: itemId,
        field,
        value: payloadValue
      })
      toast.success('待上传条目已更新')
      await refreshPendingImportQueue({ silent: true })
    } catch (err: any) {
      toast.error(err.message || '保存待上传条目失败')
      throw err
    } finally {
      setPendingImportInlineSaving(false)
    }
  }

  const submitPendingImportInlineEdit = async (overrideValue?: string) => {
    if (!pendingImportInlineEditingCell || pendingImportInlineSaving) return

    const valueToSave = overrideValue !== undefined ? overrideValue : pendingImportInlineEditingValue
    const currentItem = pendingImportQueue.find(item => item.item_id === pendingImportInlineEditingCell.itemId)
    if (!currentItem) {
      cancelPendingImportInlineEdit()
      return
    }

    const originalValue = formatPendingImportComparableValue(
      getPendingImportFieldValue(currentItem, pendingImportInlineEditingCell.field),
      pendingImportInlineEditingCell.field
    )
    const nextComparableValue = formatPendingImportComparableValue(
      valueToSave,
      pendingImportInlineEditingCell.field
    )

    if (originalValue === nextComparableValue) {
      cancelPendingImportInlineEdit()
      return
    }

    setPendingImportInlineSaving(true)
    try {
      const payloadValue = buildPendingImportFieldPayload(pendingImportInlineEditingCell.field, valueToSave)
      await inlineUpdatePendingImportItemField({
        item_id: pendingImportInlineEditingCell.itemId,
        field: pendingImportInlineEditingCell.field,
        value: payloadValue
      })
      toast.success('待上传条目已更新')
      cancelPendingImportInlineEdit()
      await refreshPendingImportQueue({ silent: true })
    } catch (err: any) {
      toast.error(err.message || '保存待上传条目失败')
    } finally {
      setPendingImportInlineSaving(false)
    }
  }

  const openPendingCategoryPicker = (itemId: string, currentCategoryId?: string | null) => {
    setPendingCategoryPicker({ itemId, selectedId: currentCategoryId || '' })
  }

  const setPendingCategoryPickerSelected = (categoryId: string) => {
    setPendingCategoryPicker(prev => (prev ? { ...prev, selectedId: categoryId } : prev))
  }

  const cancelPendingCategoryPicker = () => setPendingCategoryPicker(null)

  const confirmPendingCategoryPicker = async () => {
    if (!pendingCategoryPicker?.selectedId) {
      toast.error('请选择目标分类')
      return
    }
    try {
      await savePendingImportField(pendingCategoryPicker.itemId, 'target_category_id', pendingCategoryPicker.selectedId)
      setPendingCategoryPicker(null)
    } catch {
      // toast already shown
    }
  }

  const publishSelectedPendingImportItems = async (itemIdsOverride?: string[]) => {
    const targetItemIds = itemIdsOverride?.length ? itemIdsOverride : pendingImportSelectedIds
    if (!targetItemIds.length) {
      toast.error('请先选择待发布条目')
      return
    }
    setPendingImportPublishing(true)
    try {
      const result = await publishPendingImportItems({ item_ids: targetItemIds })
      setPendingImportSelectedIds([])
      await refreshPendingImportQueue({ silent: true })

      setActiveTab('products')

      await fetchList({
        keyword: filterKeyword,
        status_filter: filterManagementStatus,
        goods_status: filterGoodsStatus,
        page: currentPage,
      })

      const failures = Array.isArray(result.failures) ? result.failures : []
      const failureLines = failures.map(
        (item) => `${item.name || item.itemId}：${item.reason || '发布失败'}`,
      )
      const summary = `一键发布完成，成功: ${result.success_count}，失败: ${result.fail_count}`

      if (result.fail_count > 0) {
        toast.error(summary, {
          description: failureLines.length > 0
            ? createElement(
                'div',
                { className: 'mt-1 max-h-64 space-y-1 overflow-y-auto text-left' },
                failureLines.map((line, index) =>
                  createElement(
                    'div',
                    { key: `${index}-${line.slice(0, 24)}`, className: 'text-sm leading-5' },
                    line,
                  ),
                ),
              )
            : '失败商品仍保留在待上传区，请打开条目查看失败原因后重试。',
          duration: Math.min(20000, 6000 + failureLines.length * 1500),
        })
      } else {
        toast.success(summary)
      }
    } catch (err: any) {
      toast.error(err.message || '一键发布失败')
    } finally {
      setPendingImportPublishing(false)
    }
  }

  const publishPendingImportItem = async (itemId: string) => publishSelectedPendingImportItems([itemId])

  const reparseSelectedPendingImportItems = async (itemIdsOverride?: string[]) => {
    const targetItemIds = itemIdsOverride?.length ? itemIdsOverride : pendingImportSelectedIds
    if (!targetItemIds.length) {
      toast.error('请先选择待重新解析的条目')
      return
    }

    const idsToParse = targetItemIds.filter(id => !reparsingItemIds[id])
    if (!idsToParse.length) {
      toast.message('所选条目已在解析中')
      return
    }

    // Claim all selected rows up front so a second click cannot double-start the same ids.
    setReparsingItemIds(prev => {
      const next = { ...prev }
      for (const id of idsToParse) next[id] = true
      return next
    })
    setPendingImportQueue(prev => prev.map(item =>
      idsToParse.includes(item.item_id)
        ? { ...item, item_fetchStatus: 'RUNNING' as PendingImportItemFetchStatus, item_failureReason: null }
        : item,
    ))

    toast.message(`开始逐条重新解析 ${idsToParse.length} 条（其他操作不受影响）`)

    let successCount = 0
    let failCount = 0
    const failureLines: string[] = []

    for (const itemId of idsToParse) {
      try {
        // One item per RPC so React can paint between calls and the HTTP wait stays short.
        const result = await reparsePendingImportItems({ item_ids: [itemId] })
        await refreshPendingImportQueue({ silent: true })

        const itemResult = Array.isArray(result.results) ? result.results[0] : undefined
        if (result.fail_count > 0 || itemResult?.success === false) {
          failCount += 1
          const reason = itemResult?.reason || '重新解析失败'
          const label = itemResult?.name || itemId
          failureLines.push(`${label}：${reason}`)
          toast.error(`解析失败：${label}`, {
            description: reason,
            duration: 6000,
          })
        } else {
          successCount += 1
        }
      } catch (err: any) {
        failCount += 1
        const reason = err?.message || '重新解析失败'
        failureLines.push(`${itemId}：${reason}`)
        toast.error(reason)
        try {
          await refreshPendingImportQueue({ silent: true })
        } catch {
          // keep going; row flag cleared in finally
        }
      } finally {
        setReparsingItemIds(prev => {
          const next = { ...prev }
          delete next[itemId]
          return next
        })
      }
    }

    if (idsToParse.length > 1) {
      const summary = `重新解析完成，成功: ${successCount}，失败: ${failCount}`
      if (failCount > 0) {
        toast.error(summary, {
          description: failureLines.length > 0
            ? createElement(
                'div',
                { className: 'mt-1 max-h-64 space-y-1 overflow-y-auto text-left' },
                failureLines.map((line, index) =>
                  createElement(
                    'div',
                    { key: `${index}-${line.slice(0, 24)}`, className: 'text-sm leading-5' },
                    line,
                  ),
                ),
              )
            : '失败条目仍保留在待上传区，可稍后重试。',
          duration: Math.min(20000, 6000 + failureLines.length * 1500),
        })
      } else {
        toast.success(summary)
      }
    } else if (successCount === 1) {
      toast.success('重新解析成功')
    }
  }

  const deleteSelectedPendingImportItems = async (itemIdsOverride?: string[]) => {
    const targetItemIds = itemIdsOverride?.length ? itemIdsOverride : pendingImportSelectedIds
    if (!targetItemIds.length) {
      toast.error('请先选择待删除条目')
      return
    }

    try {
      const result = await batchDeletePendingImportItems(targetItemIds)
      setPendingImportSelectedIds([])
      await refreshPendingImportQueue({ silent: true })
      toast.success(`待上传条目已删除，成功: ${result.success_count}，失败: ${result.fail_count}`)
    } catch (err: any) {
      toast.error(err.message || '删除待上传条目失败')
      throw err
    }
  }

  const toggleProductExpand = (productId: string) => {
    setExpandedProductIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId])
  }

  const togglePendingImportExpand = (itemId: string) => {
    setExpandedPendingImportIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId])
  }

  const startProductSkuInlineEdit = (productId: string, skuId: string, field: ProductSkuInlineField, value: string | number | null) => {
    setProductSkuEditingCell({ productId, skuId, field })
    setProductSkuEditingValue(value === null || value === undefined ? '' : String(value))
  }

  const changeProductSkuEditingValue = (value: string) => setProductSkuEditingValue(value)

  const cancelProductSkuInlineEdit = () => {
    setProductSkuEditingCell(null)
    setProductSkuEditingValue('')
  }

  const submitProductSkuInlineEdit = async () => {
    if (!productSkuEditingCell || productSkuSaving) return
    const product = list.find(item => item.product_id === productSkuEditingCell.productId)
    const sku = product?.skus?.find(item => item.sku_id === productSkuEditingCell.skuId)
    if (!sku) {
      cancelProductSkuInlineEdit()
      return
    }

    const original =
      productSkuEditingCell.field === 'spec_text' ? sku.spec_text :
      productSkuEditingCell.field === 'cost_price' ? String(sku.cost_price ?? '') :
      productSkuEditingCell.field === 'price' ? String(sku.price ?? '') :
      productSkuEditingCell.field === 'weight_gram' ? String(sku.weight_gram ?? '') :
      String(sku.stock ?? '')

    if (productSkuEditingValue.trim() === String(original).trim()) {
      cancelProductSkuInlineEdit()
      return
    }

    setProductSkuSaving(true)
    try {
      const raw = productSkuEditingValue.trim()
      const value = productSkuEditingCell.field === 'spec_text' ? raw : Number(raw)
      await inlineUpdateProductSkuField({
        product_id: productSkuEditingCell.productId,
        sku_id: productSkuEditingCell.skuId,
        field: productSkuEditingCell.field,
        value
      })
      toast.success('SKU 已更新')
      cancelProductSkuInlineEdit()
      await fetchList()
    } catch (err: any) {
      toast.error(err.message || '保存 SKU 失败')
    } finally {
      setProductSkuSaving(false)
    }
  }

  const startPendingImportSkuInlineEdit = (itemId: string, skuKey: string, field: PendingImportSkuEditableField, value: string | number | null) => {
    setPendingImportSkuEditingCell({ itemId, skuKey, field })
    setPendingImportSkuEditingValue(value === null || value === undefined ? '' : String(value))
  }

  const changePendingImportSkuEditingValue = (value: string) => setPendingImportSkuEditingValue(value)

  const cancelPendingImportSkuInlineEdit = () => {
    setPendingImportSkuEditingCell(null)
    setPendingImportSkuEditingValue('')
  }

  const submitPendingImportSkuInlineEdit = async () => {
    if (!pendingImportSkuEditingCell || pendingImportSkuSaving) return
    const item = pendingImportQueue.find(row => row.item_id === pendingImportSkuEditingCell.itemId)
    const sku = (item?.item_skus || []).find(row => row.sku_key === pendingImportSkuEditingCell.skuKey)
    if (!sku) {
      cancelPendingImportSkuInlineEdit()
      return
    }

    const original =
      pendingImportSkuEditingCell.field === 'spec_text' ? sku.spec_text :
      pendingImportSkuEditingCell.field === 'cost_price' ? String(sku.cost_price ?? '') :
      pendingImportSkuEditingCell.field === 'price' ? String(sku.price ?? '') :
      pendingImportSkuEditingCell.field === 'weight_grams' ? String(sku.weight_grams ?? '') :
      String(sku.stock ?? '')

    if (pendingImportSkuEditingValue.trim() === String(original).trim()) {
      cancelPendingImportSkuInlineEdit()
      return
    }

    setPendingImportSkuSaving(true)
    try {
      const raw = pendingImportSkuEditingValue.trim()
      const value = pendingImportSkuEditingCell.field === 'spec_text' ? raw : Number(raw)
      await inlineUpdatePendingImportSkuField({
        item_id: pendingImportSkuEditingCell.itemId,
        sku_key: pendingImportSkuEditingCell.skuKey,
        field: pendingImportSkuEditingCell.field,
        value
      })
      toast.success('待上传 SKU 已更新')
      cancelPendingImportSkuInlineEdit()
      await refreshPendingImportQueue({ silent: true })
    } catch (err: any) {
      toast.error(err.message || '保存待上传 SKU 失败')
    } finally {
      setPendingImportSkuSaving(false)
    }
  }

  const submitPendingImportColorGroupEdit = async (colorValue: string) => {
    if (!pendingImportSkuEditingCell || pendingImportSkuSaving) return
    const item = pendingImportQueue.find(row => row.item_id === pendingImportSkuEditingCell.itemId)
    if (!item) {
      cancelPendingImportSkuInlineEdit()
      return
    }

    const colorSkus = (item.item_skus || []).filter(sku => {
      const color = sku.attributes?.find(attr => attr.name === '颜色')?.value?.trim() || '默认颜色'
      return color === colorValue
    })
    if (colorSkus.length === 0) {
      cancelPendingImportSkuInlineEdit()
      return
    }

    const raw = pendingImportSkuEditingValue.trim()
    const value = pendingImportSkuEditingCell.field === 'spec_text' ? raw : Number(raw)
    if (pendingImportSkuEditingCell.field !== 'spec_text' && !Number.isFinite(value as number)) {
      toast.error('请输入有效数字')
      return
    }

    setPendingImportSkuSaving(true)
    try {
      for (const sku of colorSkus) {
        await inlineUpdatePendingImportSkuField({
          item_id: pendingImportSkuEditingCell.itemId,
          sku_key: sku.sku_key,
          field: pendingImportSkuEditingCell.field,
          value
        })
      }
      toast.success(`已同步更新 ${colorSkus.length} 个规格`)
      cancelPendingImportSkuInlineEdit()
      await refreshPendingImportQueue({ silent: true })
    } catch (err: any) {
      toast.error(err.message || '保存颜色组失败')
    } finally {
      setPendingImportSkuSaving(false)
    }
  }

  const buildDefaultSync1688Note = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}.${m}.${d} 1688 供应商缺货`
  }

  const handleSync1688Status = async () => {
    if (sync1688Syncing) return
    const productIds = selectedIds.filter((id) => !isSkuSelectionId(id))
    if (productIds.length === 0) {
      toast.error('请先勾选需要同步的商品')
      return
    }

    setSync1688Syncing(true)
    try {
      const result = await sync1688ProductStatus({ product_ids: productIds })
      setSync1688Delisted(result.delisted || [])
      setSync1688OutOfStock(result.out_of_stock || [])
      setSync1688Normal(result.normal || [])
      setSync1688UnknownCount((result.unknown || []).length)
      setSync1688SkippedCount(result.skipped_count || 0)
      const preselect = [...(result.delisted || []), ...(result.out_of_stock || [])].map((item) => item.product_id)
      setSync1688SelectedIds(preselect)
      setSync1688NoteDraft(buildDefaultSync1688Note())
      setSync1688PanelOpen(true)

      if (
        (result.delisted || []).length === 0 &&
        (result.out_of_stock || []).length === 0 &&
        (result.normal || []).length === 0
      ) {
        toast.warning(
          result.skipped_count > 0
            ? `同步完成，但所选商品均无有效 1688 源链接（跳过 ${result.skipped_count} 件）`
            : '同步完成，未识别到可用结果'
        )
      }
    } catch (err: any) {
      toast.error(err.message || '1688 状态同步失败')
    } finally {
      setSync1688Syncing(false)
    }
  }

  const toggleSync1688Item = (productId: string, checked: boolean) => {
    setSync1688SelectedIds((prev) => {
      if (checked) return prev.includes(productId) ? prev : [...prev, productId]
      return prev.filter((id) => id !== productId)
    })
  }

  const toggleSync1688Section = (bucket: 'delisted' | 'out_of_stock' | 'normal', checked: boolean) => {
    const sectionIds =
      bucket === 'delisted'
        ? sync1688Delisted.map((item) => item.product_id)
        : bucket === 'out_of_stock'
          ? sync1688OutOfStock.map((item) => item.product_id)
          : sync1688Normal.map((item) => item.product_id)

    setSync1688SelectedIds((prev) => {
      if (checked) {
        const merged = new Set([...prev, ...sectionIds])
        return Array.from(merged)
      }
      return prev.filter((id) => !sectionIds.includes(id))
    })
  }

  const handleSync1688BatchDeactivate = async () => {
    const actionableIds = new Set([...sync1688Delisted, ...sync1688OutOfStock].map((item) => item.product_id))
    const targetIds = sync1688SelectedIds.filter((id) => actionableIds.has(id))
    if (targetIds.length === 0) {
      toast.error('请先勾选已下架或缺货商品')
      return
    }

    setSync1688Applying(true)
    try {
      const res = await batchUpdateProductStatus(targetIds, 'INACTIVE')
      toast.success(`批量下架完成，成功: ${res.success_count}，失败: ${res.fail_count}`)
      const successSet = new Set(targetIds)
      if (res.fail_count === 0) {
        setSync1688Delisted((prev) => prev.filter((item) => !successSet.has(item.product_id)))
        setSync1688OutOfStock((prev) => prev.filter((item) => !successSet.has(item.product_id)))
        setSync1688SelectedIds((prev) => prev.filter((id) => !successSet.has(id)))
      }
      await fetchList()
    } catch (err: any) {
      toast.error(err.message || '批量下架失败')
    } finally {
      setSync1688Applying(false)
    }
  }

  const openSync1688NoteDialog = () => {
    const actionableIds = new Set([...sync1688Delisted, ...sync1688OutOfStock].map((item) => item.product_id))
    const targetIds = sync1688SelectedIds.filter((id) => actionableIds.has(id))
    if (targetIds.length === 0) {
      toast.error('请先勾选已下架或缺货商品')
      return
    }
    if (!sync1688NoteDraft.trim()) setSync1688NoteDraft(buildDefaultSync1688Note())
    setSync1688NoteDialogOpen(true)
  }

  const submitSync1688Notes = async () => {
    const note = sync1688NoteDraft.trim()
    if (!note) {
      toast.error('请输入备注内容')
      return
    }
    const actionableIds = new Set([...sync1688Delisted, ...sync1688OutOfStock].map((item) => item.product_id))
    const targetIds = sync1688SelectedIds.filter((id) => actionableIds.has(id))
    if (targetIds.length === 0) {
      toast.error('请先勾选已下架或缺货商品')
      return
    }

    setSync1688Applying(true)
    try {
      const res = await batchAppendProductAdminNotes({ product_ids: targetIds, note })
      toast.success(`备注已添加，成功: ${res.success_count}，失败: ${res.fail_count}`)
      setSync1688NoteDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || '添加备注失败')
    } finally {
      setSync1688Applying(false)
    }
  }

  const deferSync1688Panel = () => {
    setSync1688PanelOpen(false)
    setSync1688NoteDialogOpen(false)
  }

  const handleReclassifyPublishedProducts = async () => {
    if (reclassifyRunning) return
    const confirmed = window.confirm(
      '将扫描全部已上架商品的标题与详情，按二级分类名称/品牌关键词重新归类。是否继续？',
    )
    if (!confirmed) return

    setReclassifyRunning(true)
    try {
      const result = await reclassifyPublishedProductsBySecondaryMatch()
      toast.success(
        `重新归类完成：命中 ${result.matched}，跳过 ${result.skipped}，失败 ${result.failed}（共 ${result.total}）`,
      )
      await fetchList()
    } catch (err: any) {
      toast.error(err?.message || '重新归类失败')
    } finally {
      setReclassifyRunning(false)
    }
  }

  const handleBatchTranslateTitlesToSpanish = async () => {
    if (spanishTitleBackfillRunning) return
    const scopeIds = selectedProductIds
    const scopeHint = scopeIds.length > 0
      ? `已选 ${scopeIds.length} 个商品`
      : '全部缺少西语标题的商品（每批最多 200）'
    const confirmed = window.confirm(
      `将调用翻译接口补全西班牙语标题（title_es）。范围：${scopeHint}。已有 title_es 的商品会跳过。是否继续？`,
    )
    if (!confirmed) return

    setSpanishTitleBackfillRunning(true)
    try {
      const result = await batchTranslateProductTitlesToSpanish({
        limit: 200,
        product_ids: scopeIds.length > 0 ? scopeIds : undefined,
        force: false,
      })
      toast.success(
        `西语标题补翻完成：翻译 ${result.translated}，跳过 ${result.skipped}，失败 ${result.failed}（扫描 ${result.scanned}）`,
      )
      await fetchList()
    } catch (err: any) {
      toast.error(err?.message || '西语标题批量翻译失败')
    } finally {
      setSpanishTitleBackfillRunning(false)
    }
  }

  const validateSubmit = (action: 'DRAFT' | 'ACTIVE' | 'INACTIVE') => {
    if (action !== 'ACTIVE') return true
    if (!formData.name.trim()) return toast.error('请填写商品名称'), false
    if (!formData.category_id) return toast.error('请选择商品分类'), false
    if (!formData.goods_status) return toast.error('请选择货物状态'), false
    if (!formData.weight_gram || formData.weight_gram <= 0) return toast.error('请填写有效重量'), false
    if (formData.cost_price === null || formData.cost_price === undefined || formData.cost_price < 0) return toast.error('请填写有效成本价'), false
    if (!formData.price_coefficient || formData.price_coefficient <= 0) return toast.error('请填写有效价格系数'), false
    if (!formData.trade_info_json?.minOrderQty || Number(formData.trade_info_json.minOrderQty) <= 0) return toast.error('请填写有效批量起订量'), false
    if (!formData.main_image_url.trim()) return toast.error('请录入主图'), false
    if (!(formData.detail_text || '').trim() && !(formData.detail_content_json || []).length) return toast.error('请补充商品详情'), false
    return true
  }

  const handleSubmitForm = async (action: 'DRAFT' | 'ACTIVE' | 'INACTIVE') => {
    if (!validateSubmit(action)) return
    setSaving(true)
    try {
      const gallery = buildGalleryFromText(formData.main_image_url || '', formData.detail_text || '', formData.gallery_json || [])
      const detailContent = buildDetailContent(formData.detail_text || '', gallery.slice(1))
      const payload: BaseCreateProductInput = {
        ...formData,
        name: formData.name.trim(),
        goods_status: (formData.goods_status ?? 'ACTIVE') as ActionGoodsStatus,
        gallery_json: gallery,
        detail_content_json: detailContent,
        skus: (formData.skus.length > 0 ? formData.skus : [{
          sku_code: '',
          price: 0,
          stock: (formData.goods_status === 'ACTIVE' || !formData.goods_status) ? 1 : 0,
          attribute_json: [],
          image_url: formData.main_image_url || '',
          weight_kg: formData.weight_gram ? Number((formData.weight_gram / 1000).toFixed(3)) : null,
          usd_display_price: null,
          usd_display_original_price: null
        }]).map(sku => ({ ...sku, weight_kg: formData.weight_gram ? Number((formData.weight_gram / 1000).toFixed(3)) : sku.weight_kg || null })),
        submit_action: action as 'DRAFT' | 'ACTIVE'
      }
      if (drawerMode === 'create') {
        await createProduct(payload)
        toast.success('新增商品成功')
      } else {
        if (!currentEditId) throw new Error('缺失编辑ID')
        await updateProduct({ ...payload, product_id: currentEditId })
        toast.success('更新商品成功')
      }
      setDrawerOpen(false)
      fetchList()
    } catch (err: any) {
      toast.error(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const openConfirmDialog = (action: BatchActionType, ids: string[]) => {
    if (ids.length === 0) {
      toast.error('请先选择操作对象')
      return
    }
    setConfirmAction(action)
    setConfirmTargetIds(ids)
    const firstSelected = list.find(item => ids.includes(item.product_id))
    if (action === 'PRICE_COEFFICIENT') {
      setBatchPriceCoefficientValue(firstSelected?.price_coefficient ? firstSelected.price_coefficient.toFixed(2) : '1')
      setBatchPriceAdjustMode('PRODUCT_COEFFICIENT')
    }
    if (action === 'CATEGORY') {
      setBatchCategoryId(firstSelected?.category_id || 'ALL')
    }
    if (action === 'BIND_CATEGORIES') {
      setBatchBindCategoryIds([])
      setBatchUnbindCategoryIds([])
      void loadCategoryProductPreview(null)
    }
    if (action === 'UNBIND_CATEGORIES') {
      setBatchUnbindCategoryIds([])
      setBatchBindCategoryIds([])
      void loadCategoryProductPreview(null)
    }
    if (action === 'BIND_KEYWORDS') {
      setBatchBindKeywordIds([])
    }
    if (action === 'MANAGEMENT_STATUS') {
      setBatchManagementStatus((firstSelected?.goods_status as ProductListStatusFilter) || 'ACTIVE')
    }
    if (action === 'WEIGHT_PRICE') {
      setBatchWeightPriceMode('price_coefficient')
      setBatchWeightPriceValue(firstSelected?.price_coefficient ? String(firstSelected.price_coefficient) : '')
    }
    if (action === 'MIN_ORDER_QTY') {
      const firstSkuSelection = ids.find(isSkuSelectionId)
      const firstSku = firstSkuSelection
        ? list.flatMap((item) => item.skus || []).find((sku) => sku.sku_id === fromSkuSelectionId(firstSkuSelection))
        : null
      setBatchMinOrderQty(
        String(
          firstSku?.min_order_qty ??
          firstSelected?.min_order_qty ??
          1,
        ),
      )
    }
    setConfirmDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    setConfirmLoading(true)
    try {
      const targetProductIds = confirmTargetIds.filter((id) => !isSkuSelectionId(id))
      const targetSkuIds = confirmTargetIds.filter(isSkuSelectionId).map(fromSkuSelectionId)
      if (confirmAction === 'ACTIVE' || confirmAction === 'INACTIVE') {
        const res = await batchUpdateProductStatus(targetProductIds, confirmAction)
        toast.success(`批量操作完成，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'DELETE') {
        const res = await batchDeleteProduct(targetProductIds)
        toast.success(`批量删除完成，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'PENDING_DELETE') {
        const res = await batchDeletePendingImportItems(confirmTargetIds)
        toast.success(`待上传条目已删除，成功: ${res.success_count}，失败: ${res.fail_count}`)
        setPendingImportSelectedIds([])
        await refreshPendingImportQueue({ silent: true })
      } else if (confirmAction === 'PRICE_COEFFICIENT') {
        const payload = batchPriceAdjustMode === 'PRODUCT_COEFFICIENT'
          ? {
              product_ids: targetProductIds,
              price_coefficient: Number(batchPriceCoefficientValue),
              adjust_mode: batchPriceAdjustMode
            }
          : {
              product_ids: targetProductIds,
              adjust_mode: batchPriceAdjustMode
            }
        const res = await batchUpdatePriceCoefficient(payload as any)
        toast.success(batchPriceAdjustMode === 'PRODUCT_COEFFICIENT'
          ? `商品系数已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`
          : `已按主类目系数重算售价，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'CATEGORY') {
        if (!batchCategoryId || batchCategoryId === 'ALL') throw new Error('请选择目标分类')
        const res = await batchUpdateProductCategory({ product_ids: targetProductIds, category_id: batchCategoryId })
        toast.success(`分类已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'MANAGEMENT_STATUS') {
        const res = await batchUpdateManagementStatus({ product_ids: targetProductIds, target_status: batchManagementStatus })
        toast.success(`状态已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'WEIGHT_PRICE') {
        const res = await batchUpdateProductWeightPrice({
          product_ids: targetProductIds,
          field: batchWeightPriceMode,
          value: Number(batchWeightPriceValue)
        })
        toast.success(batchWeightPriceMode === 'weight_gram'
          ? `重量已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`
          : `价格系数已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'MIN_ORDER_QTY') {
        const res = await (ProductManagementActionModule as any).batchUpdateMinOrderQty({
          product_ids: targetProductIds,
          sku_ids: targetSkuIds,
          min_order_qty: Number(batchMinOrderQty),
        })
        toast.success(`起订量已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'BIND_CATEGORIES') {
        if (!batchBindCategoryIds.length) throw new Error('请至少选择一个关联类目')
        const res = await batchBindProductCategories({ product_ids: targetProductIds, linked_category_ids: batchBindCategoryIds })
        toast.success(`关联类目已批量追加绑定，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'UNBIND_CATEGORIES') {
        if (!batchUnbindCategoryIds.length) throw new Error('请至少选择一个要移除的类目')
        const res = await batchUnbindProductCategories({ product_ids: targetProductIds, linked_category_ids: batchUnbindCategoryIds })
        toast.success(`关联类目已批量移除，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'BIND_KEYWORDS') {
        if (!batchBindKeywordIds.length) throw new Error('请至少选择一个关联关键词')
        const res = await batchBindProductKeywords({ product_ids: targetProductIds, linked_keyword_ids: batchBindKeywordIds })
        toast.success(`关联关键词已批量绑定，成功: ${res.success_count}，失败: ${res.fail_count}`)
      }
      setConfirmDialogOpen(false)
      setSelectedIds([])
      fetchList()
    } catch (err: any) {
      toast.error(err.message || '操作失败')
    } finally {
      setConfirmLoading(false)
    }
  }

  const startInlineEdit = (productId: string, field: ProductInlineField, value: string | number | null) => {
    if (!editableProductFields.includes(field)) return
    setInlineEditingCell({ productId, field })
    setInlineEditingValue(value === null || value === undefined ? '' : String(value))
  }

  const changeInlineEditingValue = (value: string) => {
    setInlineEditingValue(value)
  }

  const cancelInlineEdit = () => {
    setInlineEditingCell(null)
    setInlineEditingValue('')
  }

  const saveProductField = async (productId: string, field: ProductInlineField, value: string | number | null) => {
    if (!editableProductFields.includes(field) || inlineSaving) return
    const currentItem = list.find(item => item.product_id === productId)
    if (!currentItem) return

    const originalValue = formatProductComparableValue(getProductFieldValue(currentItem, field), field)
    const nextComparableValue = formatProductComparableValue(value, field)
    if (originalValue === nextComparableValue) return

    setInlineSaving(true)
    try {
      const payloadValue = buildProductFieldPayload(field, value === null || value === undefined ? '' : String(value))
      await inlineUpdateProductField({
        product_id: productId,
        field,
        value: payloadValue
      })
      toast.success('商品信息已更新')
      await fetchList()
    } catch (err: any) {
      toast.error(err.message || '保存商品失败')
      throw err
    } finally {
      setInlineSaving(false)
    }
  }

  const submitInlineEdit = async () => {
    if (!inlineEditingCell || inlineSaving) return
    const currentItem = list.find(item => item.product_id === inlineEditingCell.productId)
    if (!currentItem) {
      cancelInlineEdit()
      return
    }
    const nextRawValue = inlineEditingValue.trim()
    const originalValue = formatProductComparableValue(
      getProductFieldValue(currentItem, inlineEditingCell.field),
      inlineEditingCell.field
    )

    if (nextRawValue === String(originalValue).trim()) {
      cancelInlineEdit()
      return
    }

    setInlineSaving(true)
    try {
      const payloadValue = buildProductFieldPayload(inlineEditingCell.field, nextRawValue)
      await inlineUpdateProductField({
        product_id: inlineEditingCell.productId,
        field: inlineEditingCell.field,
        value: payloadValue
      })
      toast.success('商品信息已更新')
      cancelInlineEdit()
      await fetchList()
    } catch (err: any) {
      toast.error(err.message || '保存失败')
    } finally {
      setInlineSaving(false)
    }
  }

  const openProductCategoryPicker = (productId: string, currentCategoryId?: string | null) => {
    setProductCategoryPicker({ productId, selectedId: currentCategoryId || '' })
  }

  const cancelProductCategoryPicker = () => setProductCategoryPicker(null)

  const handleUnbindProductCategory = async (productId: string, categoryId: string) => {
    if (!productId || !categoryId || inlineSaving) return
    setInlineSaving(true)
    try {
      await unbindProductCategoryAction({
        product_id: productId,
        category_id: categoryId,
      })
      toast.success('已解除类目绑定')
      await fetchList()
    } catch (err: any) {
      toast.error(err.message || '解除类目绑定失败')
    } finally {
      setInlineSaving(false)
    }
  }

  const handleParseBatchImport = () => {
    const rows = normalizeRows(batchImportText)
    setBatchImportRows(rows)
    toast.success(`已解析 ${rows.length} 行商品待上传`)
  }

  const handleUploadBatchImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBatchImportParsing(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) throw new Error('未读取到有效工作表')
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][]
      const normalized = mapSheetRowsToImportRows(rows)
      setBatchImportRows(normalized)
      setBatchImportFileName(file.name)
      toast.success(`已从文件解析 ${normalized.length} 行商品待上传`)
    } catch (err: any) {
      toast.error(err.message || '文件解析失败，请检查文件内容')
    } finally {
      setBatchImportParsing(false)
    }
  }

  const updateBatchImportRow = (index: number, field: keyof BatchImportRowInput, value: string) => {
    setBatchImportRows(prev => {
      const next = [...prev]
      const current = { ...next[index], [field]: value } as BatchImportRowInput
      if (field === 'main_image_url') {
        const urls = Array.from(new Set([
          ...(value.trim() ? [value.trim()] : []),
          ...(current.gallery_urls || []).filter(url => url && url !== current.main_image_url)
        ]))
        current.gallery_urls = urls
        current.main_image_url = value.trim()
      }
      next[index] = current
      return next
    })
  }

  const syncBatchImportGallery = (index: number, urls: string[]) => {
    const unique = Array.from(new Set(urls.map(url => url.trim()).filter(Boolean)))
    setBatchImportRows(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        gallery_urls: unique,
        main_image_url: unique[0] || ''
      }
      return next
    })
  }

  const uploadBatchImportImages = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length === 0) return
    setBatchImportImageUploadingKey(`row-${index}`)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        uploaded.push(await uploadImageToProject(file))
      }
      const current = batchImportRows[index]?.gallery_urls || []
      syncBatchImportGallery(index, [...current, ...uploaded])
      toast.success(`已上传 ${uploaded.length} 张图片`)
    } catch (err: any) {
      toast.error(err.message || '图片上传失败')
    } finally {
      setBatchImportImageUploadingKey(null)
    }
  }

  const replaceBatchImportImage = async (rowIndex: number, imageIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBatchImportImageUploadingKey(`row-${rowIndex}-${imageIndex}`)
    try {
      const fileUrl = await uploadImageToProject(file)
      const current = [...(batchImportRows[rowIndex]?.gallery_urls || [])]
      current[imageIndex] = fileUrl
      syncBatchImportGallery(rowIndex, current)
      toast.success('图片已替换')
    } catch (err: any) {
      toast.error(err.message || '图片替换失败')
    } finally {
      setBatchImportImageUploadingKey(null)
    }
  }

  const removeBatchImportImage = (rowIndex: number, imageIndex: number) => {
    const current = [...(batchImportRows[rowIndex]?.gallery_urls || [])]
    current.splice(imageIndex, 1)
    syncBatchImportGallery(rowIndex, current)
  }

  const persistPendingImportGallery = async (itemId: string, galleryUrls: string[]) => {
    const unique = Array.from(new Set(galleryUrls.map(url => String(url || '').trim()).filter(Boolean)))
    if (unique.length === 0) {
      toast.error('至少保留一张图片')
      return
    }
    await updatePendingImportGallery({
      itemId,
      galleryUrls: unique,
      mainImageUrl: unique[0]
    })
    setPendingImportQueue(prev => prev.map(item => {
      if (item.item_id !== itemId) return item
      return {
        ...item,
        item_mainImageUrl: unique[0],
        item_parsedMainImageUrl: unique[0],
        item_galleryUrls: unique
      }
    }))
  }

  const uploadPendingImportImages = async (itemId: string, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length === 0) return
    setPendingImportImageUploadingId(itemId)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        uploaded.push(await uploadImageToProject(file))
      }
      const item = pendingImportQueue.find(row => row.item_id === itemId)
      const current = item?.item_galleryUrls?.length
        ? item.item_galleryUrls
        : (item?.item_mainImageUrl || item?.item_parsedMainImageUrl ? [item.item_mainImageUrl || item.item_parsedMainImageUrl!] : [])
      await persistPendingImportGallery(itemId, [...current, ...uploaded])
      toast.success(`已上传 ${uploaded.length} 张图片`)
    } catch (err: any) {
      toast.error(err.message || '图片上传失败')
    } finally {
      setPendingImportImageUploadingId(null)
    }
  }

  const replacePendingImportImage = async (itemId: string, imageIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPendingImportImageUploadingId(itemId)
    try {
      const fileUrl = await uploadImageToProject(file)
      const item = pendingImportQueue.find(row => row.item_id === itemId)
      const current = [...(item?.item_galleryUrls?.length
        ? item.item_galleryUrls
        : (item?.item_mainImageUrl || item?.item_parsedMainImageUrl ? [item.item_mainImageUrl || item.item_parsedMainImageUrl!] : []))]
      current[imageIndex] = fileUrl
      await persistPendingImportGallery(itemId, current)
      toast.success('图片已替换')
    } catch (err: any) {
      toast.error(err.message || '图片替换失败')
    } finally {
      setPendingImportImageUploadingId(null)
    }
  }

  const removePendingImportImage = async (itemId: string, imageIndex: number) => {
    const item = pendingImportQueue.find(row => row.item_id === itemId)
    const current = [...(item?.item_galleryUrls?.length
      ? item.item_galleryUrls
      : (item?.item_mainImageUrl || item?.item_parsedMainImageUrl ? [item.item_mainImageUrl || item.item_parsedMainImageUrl!] : []))]
    current.splice(imageIndex, 1)
    try {
      await persistPendingImportGallery(itemId, current)
      toast.success('图片已删除')
    } catch (err: any) {
      toast.error(err.message || '图片删除失败')
    }
  }

  const syncPendingImportSkuImage = (itemId: string, skuKey: string, imageUrl: string | null) => {
    setPendingImportQueue(prev => prev.map(item => {
      if (item.item_id !== itemId) return item
      return {
        ...item,
        item_skus: (item.item_skus || []).map(sku =>
          sku.sku_key === skuKey ? { ...sku, image_url: imageUrl } : sku
        )
      }
    }))
  }

  const persistPendingImportSkuImage = async (itemId: string, skuKey: string, imageUrl: string | null) => {
    await inlineUpdatePendingImportSkuField({
      item_id: itemId,
      sku_key: skuKey,
      field: 'image_url',
      value: imageUrl || ''
    })
    syncPendingImportSkuImage(itemId, skuKey, imageUrl)
  }

  const uploadPendingImportSkuImage = async (itemId: string, skuKey: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const uploadKey = `${itemId}:${skuKey}`
    setPendingImportSkuImageUploadingKey(uploadKey)
    try {
      const fileUrl = await uploadImageToProject(file)
      await persistPendingImportSkuImage(itemId, skuKey, fileUrl)
      toast.success('颜色图已上传')
    } catch (err: any) {
      toast.error(err.message || '颜色图上传失败')
    } finally {
      setPendingImportSkuImageUploadingKey(null)
    }
  }

  const replacePendingImportSkuImage = async (itemId: string, skuKey: string, event: ChangeEvent<HTMLInputElement>) => {
    await uploadPendingImportSkuImage(itemId, skuKey, event)
  }

  const removePendingImportSkuImage = async (itemId: string, skuKey: string) => {
    const uploadKey = `${itemId}:${skuKey}`
    setPendingImportSkuImageUploadingKey(uploadKey)
    try {
      await persistPendingImportSkuImage(itemId, skuKey, null)
      toast.success('颜色图已删除')
    } catch (err: any) {
      toast.error(err.message || '颜色图删除失败')
    } finally {
      setPendingImportSkuImageUploadingKey(null)
    }
  }

  const addBatchImportRow = () => setBatchImportRows(prev => [...prev, defaultImportRow()])
  const removeBatchImportRow = (index: number) => setBatchImportRows(prev => prev.filter((_, i) => i !== index))

  const handleSubmitBatchImport = async () => {
    if (!formData.category_id) {
      toast.error('请先在右侧表单中选择默认分类，或先新增商品填写分类后再导入')
      return
    }
    const validRows = batchImportRows.filter(row => {
      const price = Number(row.product_price || row.cost_price)
      return row.name.trim() && Number(row.weight_gram) > 0 && !Number.isNaN(price) && price >= 0
    })
    if (validRows.length === 0) {
      toast.error('请至少填写一行有效商品数据（名称、重量、价格）')
      return
    }
    setBatchImportSubmitting(true)
    try {
      const rows: BatchImportDraftPayload[] = validRows.map(row => {
        const galleryUrls = Array.from(new Set([
          ...(row.gallery_urls || []).map(url => url.trim()).filter(Boolean),
          ...(row.main_image_url.trim() ? [row.main_image_url.trim()] : [])
        ]))
        return {
          name: row.name.trim(),
          product_code: row.product_code.trim() || null,
          sku_code: row.sku_code.trim() || null,
          weight_gram: row.weight_gram ? Number(row.weight_gram) : null,
          cost_price: row.cost_price ? Number(row.cost_price) : null,
          product_price: row.product_price ? Number(row.product_price) : null,
          main_image_url: galleryUrls[0] || '',
          detail_text: row.detail_text.trim(),
          category_name: row.category_name.trim(),
          supplier_name: row.supplier_name.trim(),
          brand_keyword: row.brand_keyword.trim(),
          price_coefficient: row.price_coefficient ? Number(row.price_coefficient) : 1,
          color: row.color.trim(),
          spec: row.spec.trim(),
          colors: row.color.split(/[,，]/).map(item => item.trim()).filter(Boolean),
          specs: row.spec.split(/[,，]/).map(item => item.trim()).filter(Boolean),
          gallery_urls: galleryUrls
        }
      })
      const res = await batchImportProducts({ category_id: formData.category_id, rows })
      toast.success(`批量导入完成，成功: ${res.success_count}，失败: ${res.fail_count}`)
      if (res.error_messages?.length) {
        toast.error(res.error_messages.join('；'))
      }
      setBatchImportOpen(false)
      setBatchImportRows([defaultImportRow()])
      setBatchImportText('')
      setBatchImportFileName('')
      setActiveTab('pending_imports')
      await Promise.all([fetchList(), refreshPendingImportQueue({ silent: true })])
    } catch (err: any) {
      toast.error(err.message || '批量导入失败')
    } finally {
      setBatchImportSubmitting(false)
    }
  }

  return {
    state: {
      activeTab,
      filterKeyword,
      filterCategoryId,
      filterStatus,
      filterGoodsStatus,
      filterManagementStatus,
      filterSupplierName,
      filterBrandKeyword,
      loading,
      list,
      total,
      categoryOptions,
      selectedIds,
      currentPage,
      pageSize,
      drawerOpen,
      drawerMode,
      drawerLoading,
      saving,
      currentEditId,
      formData,
      specDimensions,
      confirmDialogOpen,
      confirmAction,
      confirmTargetIds,
      confirmLoading,
      batchPriceCoefficientValue,
      batchPriceAdjustMode,
      batchCategoryId,
      batchManagementStatus,
      batchWeightPriceMode,
      batchWeightPriceValue,
      batchMinOrderQty,
      bindingCategoryOptions,
      bindingKeywordOptions,
      hierarchicalCategoryOptions,
      batchBindCategoryIds,
      batchUnbindCategoryIds,
      batchBindKeywordIds,
      batchCategoryPreviewId,
      batchCategoryPreviewLoading,
      batchCategoryPreviewProducts,
      batchCategoryPreviewTotal,
      inlineEditingCell,
      inlineEditingValue,
      inlineSaving,
      batchImportOpen,
      batchImportText,
      batchImportRows,
      batchImportSubmitting,
      batchImportFileName,
      batchImportParsing,
      batchImportImageUploadingKey,
      pendingImportImageUploadingId,
      pendingImportSkuImageUploadingKey,
      mainImageUploading,
      galleryUploadingIndex,
      featuredKeywords,
      featuredKeywordInput,
      featuredKeywordsSaving,
      pendingImportDialogOpen,
      pendingImportTaskForm,
      pendingImportCreating,
      pendingImportRefreshing,
      pendingImportPublishing,
      pendingImportReparsing,
      reparsingItemIds,
      pendingImportQueueLoading,
      pendingImportActiveTask,
      pendingImportQueue,
      pendingImportPagedQueue,
      pendingImportQueueTotal,
      pendingImportQueueError,
      pendingImportPage,
      pendingImportPageSize,
      pendingImportTotalPages,
      is1688NameSearch,
      landingSearchName,
      matchedPublishedImportProduct,
      shouldShowPendingImportLanding,
      shouldShowPublishedDraftLanding,
      pendingImportSelectedIds,
      pendingImportInlineEditingCell,
      pendingImportInlineEditingValue,
      pendingImportInlineSaving,
      productCategoryPicker,
      pendingCategoryPicker,
      expandedProductIds,
      expandedPendingImportIds,
      productSkuEditingCell,
      productSkuEditingValue,
      productSkuSaving,
      pendingImportSkuEditingCell,
      pendingImportSkuEditingValue,
      pendingImportSkuSaving,
      sync1688PanelOpen,
      sync1688Syncing,
      sync1688Applying,
      sync1688Delisted,
      sync1688OutOfStock,
      sync1688Normal,
      sync1688UnknownCount,
      sync1688SkippedCount,
      sync1688SelectedIds,
      sync1688NoteDialogOpen,
      sync1688NoteDraft,
      reclassifyRunning,
      spanishTitleBackfillRunning,
    },
    handlers: {
      setActiveTab,
      navigateToTableImport: () => ImportFrom1688.navigateToTableImport(router),
      setFilterKeyword,
      setFilterCategoryId: handleFilterCategoryChange,
      setFilterStatus,
      setFilterGoodsStatus,
      setFilterManagementStatus,
      setFilterSupplierName,
      setFilterBrandKeyword,
      handleSearch,
      handleReset,
      handleSelectAll,
      handleSelectRow,
      setCurrentPage,
      handleOpenCreate,
      handleOpenEdit,
      setDrawerOpen,
      handleFormFieldChange,
      handleTradeInfoChange,
      handleUploadMainImage,
      handleUploadGalleryImage,
      addGalleryItem,
      updateGalleryItem,
      removeGalleryItem,
      addDetailBlock,
      updateDetailBlock,
      removeDetailBlock,
      addParameter,
      updateParameter,
      removeParameter,
      addSpecDimension,
      updateSpecDimension,
      removeSpecDimension,
      generateSkus,
      updateSkuRow,
      handleSubmitForm,
      openConfirmDialog,
      setBatchPriceCoefficientValue,
      setBatchPriceAdjustMode,
      setBatchCategoryId,
      setBatchManagementStatus,
      setBatchWeightPriceMode,
      setBatchWeightPriceValue,
      setBatchMinOrderQty,
      toggleFormLinkedCategory,
      toggleFormLinkedKeyword,
      toggleBatchBindCategory,
      toggleBatchUnbindCategory,
      setBatchCategoryPreviewId: (categoryId: string | null) => {
        void loadCategoryProductPreview(categoryId)
      },
      toggleBatchBindKeyword,
      startInlineEdit,
      changeInlineEditingValue,
      cancelInlineEdit,
      submitInlineEdit,
      openProductCategoryPicker,
      cancelProductCategoryPicker,
      saveProductField,
      unbindProductCategory: handleUnbindProductCategory,
      handleApplyCategoryCoefficientToForm,
      handleConfirmAction,
      setConfirmDialogOpen,
      setBatchImportOpen,
      setBatchImportText,
      handleParseBatchImport,
      handleUploadBatchImportFile,
      updateBatchImportRow,
      uploadBatchImportImages,
      replaceBatchImportImage,
      removeBatchImportImage,
      uploadPendingImportImages,
      replacePendingImportImage,
      removePendingImportImage,
      uploadPendingImportSkuImage,
      replacePendingImportSkuImage,
      removePendingImportSkuImage,
      addBatchImportRow,
      removeBatchImportRow,
      handleSubmitBatchImport,
      setFeaturedKeywordInput,
      addFeaturedKeyword,
      removeFeaturedKeyword,
      saveFeaturedKeywords,
      setPendingImportDialogOpen,
      updatePendingImportTaskForm,
      submitPendingImportTask,
      refreshPendingImportQueue,
      setPendingImportPage: handleSetPendingImportPage,
      retryPendingImportActiveTask,
      handleSelectAllPendingImport,
      handleSelectPendingImportRow,
      startPendingImportInlineEdit,
      changePendingImportInlineEditingValue,
      cancelPendingImportInlineEdit,
      submitPendingImportInlineEdit,
      savePendingImportField,
      openPendingCategoryPicker,
      setPendingCategoryPickerSelected,
      confirmPendingCategoryPicker,
      cancelPendingCategoryPicker,
      publishSelectedPendingImportItems,
      reparseSelectedPendingImportItems,
      deleteSelectedPendingImportItems,
      publishPendingImportItem,
      toggleProductExpand,
      togglePendingImportExpand,
      startProductSkuInlineEdit,
      changeProductSkuEditingValue,
      cancelProductSkuInlineEdit,
      submitProductSkuInlineEdit,
      startPendingImportSkuInlineEdit,
      changePendingImportSkuEditingValue,
      cancelPendingImportSkuInlineEdit,
      submitPendingImportSkuInlineEdit,
      submitPendingImportColorGroupEdit,
      handleSync1688Status,
      setSync1688PanelOpen,
      toggleSync1688Item,
      toggleSync1688Section,
      handleSync1688BatchDeactivate,
      openSync1688NoteDialog,
      setSync1688NoteDialogOpen,
      setSync1688NoteDraft,
      submitSync1688Notes,
      deferSync1688Panel,
      handleReclassifyPublishedProducts,
      handleBatchTranslateTitlesToSpanish,
    }
  }
}
