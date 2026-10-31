'use client'
import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent, createElement } from 'react'
import { DEFAULT_USD_EXCHANGE_RATE, toUsdFromCny } from '@/shared/exchangeRate'
import { calculateCostLinkedSellPrices, resolveDisplayedPriceCoefficient } from '@/shared/priceCoefficient'
import { isPlaceholderSpecValue, sanitizePendingSkuCopyLabels } from '@/shared/skuDisplayGuards'
import { applyPendingSkuSummaryText, describePendingSkuSummarySave } from '@/shared/pendingSkuSummary'
import { appendTitleSuffixIfMissing, removeTitleSuffixesIfPresent } from '@/shared/titleSuffix'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductManagement, ImportFrom1688 } from '@/backend/route-params'
import {
  getProductList,
  getProductListSkus,
  getCategoryOptions,
  getProductDetail,
  createProduct,
  updateProduct,
  batchUpdateProductStatus,
  batchDeleteProduct,
  returnProductsToPendingUpload,
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
  retryPendingImportTaskForProductManagement,
  getPendingImportQueue,
  setPendingImportReviewMark,
  inlineUpdatePendingImportItemField,
  batchUpdatePendingImportItemField,
  inlineUpdatePendingImportSkuField,
  duplicatePendingImportSku,
  deletePendingImportSku,
  duplicatePendingImportSkuColorGroup,
  deletePendingImportSkuColorGroup,
  updatePendingImportGallery,
  batchMosaicGalleryWatermarks,
  publishPendingImportItems,
  reparsePendingImportItems,
  cancelPendingImportParseJob,
  sync1688ProductStatus,
  batchAppendProductAdminNotes,
  reclassifyPublishedProductsBySecondaryMatch,
  calibratePendingImportItems,
  applyCalibrateCategoryEdits,
  autoClassifyPriceThresholdProducts,
  backfillAllTitleFilterCategories,
  batchTranslateProductTitlesToSpanish,
  batchAppendProductTitleSuffix,
  batchAppendPendingImportTitleSuffix,
  batchRemoveProductTitleSuffix,
  batchRemovePendingImportTitleSuffix,
  updateProductStock,
  batchUpdateMinOrderQty,
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
  type CategoryProductPreviewItem,
  type CalibrateResultItem,
} from '@/backend/actions/ProductManagement'
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
import { upload_project_file, upload_project_files_detailed } from '@/tools/tools'

export type DrawerMode = 'create' | 'edit'
export type BatchActionType = 'ACTIVE' | 'INACTIVE' | 'DELETE' | 'PENDING_DELETE' | 'RETURN_TO_PENDING' | 'PRICE_COEFFICIENT' | 'CATEGORY' | 'MANAGEMENT_STATUS' | 'WEIGHT_PRICE' | 'MIN_ORDER_QTY' | 'BIND_CATEGORIES' | 'UNBIND_CATEGORIES' | 'BIND_KEYWORDS' | null
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

/** 勾选一级类目时带上树里紧随其后的全部子级（与后台 resolveCategoryFilterIds 一致） */
function expandSelectedCategoryIdsWithDescendants(
  selectedIds: string[],
  options: Array<{ value: string; label: string }>,
): string[] {
  const selected = new Set(selectedIds.filter(Boolean))
  if (!selected.size || !options.length) return Array.from(selected)
  const depthOf = (label: string) => {
    const match = String(label || '').match(/^　*/)
    return match ? match[0].length : 0
  }
  const depths = options.map((opt) => depthOf(opt.label))
  const out = new Set<string>(selected)
  for (let i = 0; i < options.length; i += 1) {
    if (!selected.has(options[i].value)) continue
    const depth = depths[i]
    for (let j = i + 1; j < options.length; j += 1) {
      if (depths[j] <= depth) break
      out.add(options[j].value)
    }
  }
  return Array.from(out)
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
  | 'min_order_qty'
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
  supplierName: string
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
  'price_coefficient',
  'min_order_qty'
]
const numberProductFields = new Set<ProductInlineField>([
  'weight_gram',
  'cost_price',
  'price_coefficient',
  'min_order_qty'
])
const productGoodsStatusOptions: ActionGoodsStatus[] = ['ACTIVE', 'INACTIVE']

const defaultPendingImportTaskForm = (): PendingImportTaskForm => ({
  urls: '',
  defaultCategoryId: '',
  defaultStatus: 'DRAFT',
  supplierName: '',
  stockStrategyStock: '1'
})

const pollingTaskStatuses: PendingImportTaskStatus[] = ['PENDING', 'RUNNING', 'RATE_LIMITED']

const normalizePendingImportTextField = (value: PendingImportFieldValue) => String(value ?? '').trim()

const is1688ImportedProductName = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  return normalized.startsWith('[1688抓取]')
}

const normalizePendingImportNumberField = (value: PendingImportFieldValue) => {
  const parsed = Number(String(value ?? '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

const PENDING_SKU_TEXT_FIELDS = new Set<PendingImportSkuEditableField>(['spec_text', 'color', 'spec'])
const PENDING_SKU_SPEC_ATTR_NAMES = ['规格', '尺码', '尺寸']

const uniquePendingImageUrls = (urls: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const url of urls) {
    const value = String(url || '').trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

const recoverPendingImportGalleryUrls = (
  item: PendingImportQueueItem,
  local?: PendingImportQueueItem | null,
  persistable: string[] = [],
): string[] => {
  const localGallery = local?.item_galleryUrls || []
  const serverGallery = item.item_galleryUrls || []
  let gallery = persistable
  if (localGallery.length > gallery.length) gallery = localGallery
  if (serverGallery.length > gallery.length) gallery = serverGallery
  gallery = uniquePendingImageUrls(gallery)
  if (gallery.length <= 1) {
    const skuUrls = [
      ...(local?.item_skus || []),
      ...(item.item_skus || []),
    ].map((sku) => sku.image_url)
    const expanded = uniquePendingImageUrls([...gallery, ...skuUrls])
    if (expanded.length > gallery.length) gallery = expanded
  }
  return gallery
}

const readPendingSkuColor = (sku: PendingImportSkuDraftItem) =>
  sku.attributes?.find((attr) => attr.name === '颜色')?.value?.trim() || '默认颜色'

const readPendingSkuSpec = (sku: PendingImportSkuDraftItem) => {
  const spec = sku.attributes?.find((attr) => PENDING_SKU_SPEC_ATTR_NAMES.includes(attr.name))?.value?.trim() || ''
  return isPlaceholderSpecValue(spec) ? '' : spec
}

const readPendingSkuField = (sku: PendingImportSkuDraftItem, field: PendingImportSkuEditableField, item?: PendingImportQueueItem) => {
  if (field === 'color') return readPendingSkuColor(sku)
  if (field === 'spec') return readPendingSkuSpec(sku)
  if (field === 'spec_text') return sku.spec_text
  if (field === 'cost_price') return String(sku.cost_price ?? '')
  if (field === 'price') return String(sku.price ?? '')
  if (field === 'weight_grams') return String(sku.weight_grams ?? '')
  if (field === 'minimum_order_quantity') return String(item?.item_minimumOrderQuantity ?? '')
  if (field === 'image_url') return sku.image_url ?? ''
  return String(sku.stock ?? '')
}

const patchPendingSkuField = (
  sku: PendingImportSkuDraftItem,
  field: PendingImportSkuEditableField,
  value: string | number,
): PendingImportSkuDraftItem => {
  if (field === 'stock') return { ...sku, stock: Number(value) }
  if (field === 'price') return { ...sku, price: Number(value) }
  if (field === 'weight_grams') return { ...sku, weight_grams: Number(value) }
  if (field === 'cost_price') return { ...sku, cost_price: Number(value) }
  if (field === 'spec_text') return { ...sku, spec_text: String(value) }
  if (field === 'color' || field === 'spec') {
    const attributes = (Array.isArray(sku.attributes) ? sku.attributes : []).map((attr) => ({ ...attr }))
    if (field === 'color') {
      const index = attributes.findIndex((attr) => attr.name === '颜色')
      if (index >= 0) attributes[index] = { ...attributes[index], value: String(value) }
      else attributes.unshift({ name: '颜色', value: String(value) })
    } else {
      const nextSpec = String(value || '').trim()
      const index = attributes.findIndex((attr) => PENDING_SKU_SPEC_ATTR_NAMES.includes(attr.name))
      if (!nextSpec) {
        if (index >= 0) attributes.splice(index, 1)
      } else if (index >= 0) attributes[index] = { ...attributes[index], value: nextSpec }
      else attributes.push({ name: '规格', value: nextSpec })
    }
    return {
      ...sku,
      attributes,
      spec_text: attributes.map((attr) => attr.value).filter(Boolean).join(' / ') || String(value),
    }
  }
  return sku
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
    case 'min_order_qty':
      return Math.max(1, Number(item.min_order_qty ?? 1) || 1)
    default:
      return ''
  }
}

/** SPU 重量变更后，强制覆盖列表项内全部子 SKU 重量（表格即时刷新） */
const applySpuWeightToProductListItem = (item: ProductListItem, weightGram: number): ProductListItem => {
  const grams = Math.round(Number(weightGram))
  if (!Number.isFinite(grams) || grams <= 0) return item
  const weightKg = Number((grams / 1000).toFixed(3))
  return {
    ...item,
    weight_gram: grams,
    skus: (item.skus || []).map((sku) => ({
      ...sku,
      weight_gram: grams,
      weight_kg: weightKg,
    })),
  }
}

const toUsdPreview = (value?: number | null, usdRate: number = DEFAULT_USD_EXCHANGE_RATE) => (
  value === null || value === undefined || Number.isNaN(value)
    ? null
    : toUsdFromCny(Number(value), usdRate)
)

const roundListCurrency = (value: number) => Number(value.toFixed(2))

const listDisplayCoefficient = (item: ProductListItem) => (
  resolveDisplayedPriceCoefficient(item.price_coefficient, item.effective_price_coefficient) ?? 1
)

const withListItemPriceRangesFromSkus = (
  item: ProductListItem,
  skus: ProductListSkuItem[],
  usdRate: number = DEFAULT_USD_EXCHANGE_RATE,
): ProductListItem => {
  const prices = skus.map((sku) => Number(sku.price)).filter((n) => Number.isFinite(n))
  if (!prices.length) return { ...item, skus }
  const price_min = Math.min(...prices)
  const price_max = Math.max(...prices)
  return {
    ...item,
    skus,
    price_min,
    price_max,
    usd_display_price_min: toUsdPreview(price_min, usdRate) ?? 0,
    usd_display_price_max: toUsdPreview(price_max, usdRate) ?? 0,
  }
}

const applySkuSellPriceToListItem = (
  item: ProductListItem,
  skuId: string,
  nextPrice: number,
  usdRate: number = DEFAULT_USD_EXCHANGE_RATE,
): ProductListItem => {
  const price = roundListCurrency(nextPrice)
  const skus = (item.skus || []).map((sku) =>
    sku.sku_id === skuId
      ? { ...sku, price, usd_display_price: toUsdPreview(price, usdRate) }
      : sku,
  )
  return withListItemPriceRangesFromSkus(item, skus, usdRate)
}

/** 成本价变更后：人民币=成本×系数，美金=人民币÷后台设定汇率 */
const applyCostRecalcToListItem = (
  item: ProductListItem,
  nextCost: number,
  usdRate: number = DEFAULT_USD_EXCHANGE_RATE,
): ProductListItem => {
  const cost = roundListCurrency(nextCost)
  const { rmb: nextPrice, usd: nextUsd } = calculateCostLinkedSellPrices(
    cost,
    listDisplayCoefficient(item),
    usdRate,
  )
  const skus = (item.skus || []).map((sku) => ({
    ...sku,
    cost_price: cost,
    price: nextPrice,
    usd_display_price: nextUsd,
  }))
  if (!skus.length) {
    return {
      ...item,
      cost_price: cost,
      price_min: nextPrice,
      price_max: nextPrice,
      usd_display_price_min: nextUsd,
      usd_display_price_max: nextUsd,
    }
  }
  return withListItemPriceRangesFromSkus({ ...item, cost_price: cost }, skus, usdRate)
}

const withPendingSkuPriceSummary = (
  item: PendingImportQueueItem,
  skus: NonNullable<PendingImportQueueItem['item_skus']>,
  usdRate: number = DEFAULT_USD_EXCHANGE_RATE,
): PendingImportQueueItem => {
  const prices = skus
    .map((sku) => (sku.price == null ? null : Number(sku.price)))
    .filter((n): n is number => n !== null && Number.isFinite(n))
  if (!prices.length) return { ...item, item_skus: skus }
  const cnyMin = Math.min(...prices)
  const cnyMax = Math.max(...prices)
  return {
    ...item,
    item_skus: skus,
    item_cnyPriceMin: cnyMin,
    item_cnyPriceMax: cnyMax,
    item_usdPriceMin: toUsdPreview(cnyMin, usdRate),
    item_usdPriceMax: toUsdPreview(cnyMax, usdRate),
  }
}

const applyPendingImportLocalField = (
  item: PendingImportQueueItem,
  field: PendingImportEditableField,
  payloadValue: PendingImportFieldValue,
  usdRate: number,
): PendingImportQueueItem => {
  if (field === 'product_name') {
    const name = String(payloadValue || '')
    return { ...item, item_productName: name, item_parsedName: name }
  }
  if (field === 'product_detail') return { ...item, item_productDetail: String(payloadValue || '') }
  if (field === 'sku_summary_text') {
    const text = String(payloadValue || '')
    const skus = item.item_skus || []
    const template = skus[0] || {
      sku_key: 'sku-1',
      spec_text: '',
      cost_price: item.item_costPrice,
      price: item.item_cnyPriceMin,
      weight_grams: item.item_weightGrams,
      stock: item.item_availableStock,
      image_url: item.item_mainImageUrl || item.item_parsedMainImageUrl || null,
      attributes: [],
    }
    const applied = applyPendingSkuSummaryText(skus, text, template)
    const nextItem = {
      ...item,
      item_skuSummaryText: applied.summaryText,
      item_skus: applied.skus,
    }
    if (applied.mode !== 'distribution') return nextItem
    const totalStock = applied.skus.reduce((sum, sku) => sum + Number(sku.stock || 0), 0)
    return withPendingSkuPriceSummary({ ...nextItem, item_availableStock: totalStock }, applied.skus, usdRate)
  }
  if (field === 'supplier_name') return { ...item, item_supplierName: String(payloadValue || '') || null }
  if (field === 'source_category_name') return { ...item, item_sourceCategoryName: String(payloadValue || '') || null }
  if (field === 'target_category_id') return { ...item, item_targetCategoryId: String(payloadValue || '') || null }
  if (field === 'goods_status') return { ...item, item_goodsStatus: payloadValue as any }
  if (field === 'coefficient') {
    const coeff = Number(payloadValue)
    const skus = (item.item_skus || []).map((sku) => {
      const cost = Number(sku.cost_price)
      if (!Number.isFinite(cost)) return sku
      return { ...sku, price: Math.round(cost * coeff * 100) / 100 }
    })
    return withPendingSkuPriceSummary({ ...item, item_coefficient: coeff, item_skus: skus }, skus, usdRate)
  }
  if (field === 'cost_price') {
    const cost = Number(payloadValue)
    const coeff = Number(item.item_coefficient || 1)
    const skus = (item.item_skus || []).map((sku) => ({
      ...sku,
      cost_price: cost,
      price: Math.round(cost * coeff * 100) / 100,
    }))
    return withPendingSkuPriceSummary({ ...item, item_costPrice: cost, item_skus: skus }, skus, usdRate)
  }
  if (field === 'cny_price_min' || field === 'cny_price_max') {
    const price = Number(payloadValue)
    const skus = (item.item_skus || []).map((sku) => ({ ...sku, price }))
    return withPendingSkuPriceSummary(
      {
        ...item,
        item_cnyPriceMin: field === 'cny_price_min' ? price : item.item_cnyPriceMin,
        item_cnyPriceMax: field === 'cny_price_max' ? price : item.item_cnyPriceMax,
        item_skus: skus,
      },
      skus,
      usdRate,
    )
  }
  if (field === 'usd_price_min') return { ...item, item_usdPriceMin: Number(payloadValue) }
  if (field === 'usd_price_max') return { ...item, item_usdPriceMax: Number(payloadValue) }
  if (field === 'weight_grams') {
    const grams = Number(payloadValue)
    return {
      ...item,
      item_weightGrams: grams,
      item_skus: (item.item_skus || []).map((sku) => ({ ...sku, weight_grams: grams })),
    }
  }
  if (field === 'minimum_order_quantity') return { ...item, item_minimumOrderQuantity: Number(payloadValue) }
  if (field === 'available_stock') return { ...item, item_availableStock: Number(payloadValue) }
  if (field === 'main_image_url') return { ...item, item_mainImageUrl: String(payloadValue || '') || null }
  return item
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
    if ((field === 'weight_gram' || field === 'price_coefficient' || field === 'min_order_qty') && parsed <= 0) {
      throw new Error(
        field === 'weight_gram' ? '重量必须大于0' : field === 'min_order_qty' ? '起订量必须大于0' : '价格系数必须大于0'
      )
    }
    if (field === 'cost_price' && parsed < 0) throw new Error('成本价不能小于0')
    if (field === 'min_order_qty') return Math.max(1, Math.round(parsed))
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

const SKU_SELECTION_PREFIX = 'sku:'

const toCurrency = (value?: number | null) => (value === null || value === undefined || Number.isNaN(value) ? '--' : Number(value).toFixed(2))
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
  // sku_code 故意不给表头别名：表格不映射 SKU，一律后端按 SPU 生成
  sku_code: [],
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
    if (field === 'sku_code') return ''
    if (indexMap && indexMap[field] !== undefined) return cols[indexMap[field]!] || ''
    // 有命名表头时不按位置回退未映射列
    if (indexMap) return ''
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
    sku_code: '',
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
    if (field === 'sku_code') return
    const aliases = BATCH_IMPORT_HEADER_ALIASES[field].map(item => item.toLowerCase())
    if (aliases.length === 0) return
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
  usdExchangeRate: number
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
  /** Active batch-import image upload row keys (multiple rows can upload together). */
  batchImportImageUploadingKeys: string[]
  /** Item ids currently uploading gallery images in background (may overlap). */
  pendingImportImageUploadingIds: string[]
  /** `${itemId}:${skuKey}` keys with in-flight color-image uploads. */
  pendingImportSkuImageUploadingKeys: string[]
  mainImageUploading: boolean
  galleryUploadingIndex: number | null
  featuredKeywords: string[]
  featuredKeywordInput: string
  featuredKeywordsSaving: boolean
  pendingImportDialogOpen: boolean
  pinduoduoImportDialogOpen: boolean
  pendingImportTaskForm: PendingImportTaskForm
  pendingImportCreating: boolean
  pendingImportRefreshing: boolean
  pendingImportPublishing: boolean
  /** True when any pending-import row is currently re-parsing (derived). */
  pendingImportReparsing: boolean
  /** True while cancel RPC is in flight. */
  pendingImportParseCancelling: boolean
  /** Collect/reparse job is running — only the parse button becomes「终止解析」; other actions stay enabled. */
  pendingImportParseActive: boolean
  /** Short human label for what is currently being parsed. */
  pendingImportParseStatusLabel: string
  /** Server in-process parse job (reparse/collect) — survives refresh. */
  pendingImportParseJob: {
    busy: boolean
    label: string | null
    total: number
    done: number
    cancel_requested: boolean
  } | null
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
  pendingImportSelectedSkuKeys: string[]
  pendingImportReviewSavingIds: string[]
  /** Shared clock for pending readiness heuristics (avoids per-row intervals). */
  pendingImportNowMs: number
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
  calibrateResultOpen: boolean
  calibrateResultSaving: boolean
  calibrateResultScope: 'product' | 'pending'
  calibrateResultSummary: { matched: number; skipped: number; failed: number; total: number } | null
  calibrateResultDrafts: Array<{
    id: string
    name: string
    primaryCategoryId: string | null
    linkedCategoryIds: string[]
    categoryNames?: Record<string, string>
    brandNormalized: boolean
    weightGrams: number | null
    weightUpdated: boolean
    status: CalibrateResultItem['status']
    message?: string | null
  }>
  priceThresholdClassifyRunning: boolean
  titleFilterBackfillRunning: boolean
  mosaicGalleryRunning: boolean
  spanishTitleBackfillRunning: boolean
  titleSuffixRunning: boolean
  productStockEditingId: string | null
  productStockEditingValue: string
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
  setPageSize: (size: number) => void
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
  pastePendingImportImageUrls: (itemId: string, text: string) => Promise<void>
  replacePendingImportImage: (itemId: string, imageIndex: number, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  removePendingImportImage: (itemId: string, imageIndex: number) => Promise<void>
  reorderPendingImportImages: (itemId: string, fromIndex: number, toIndex: number) => Promise<void>
  movePendingImportImageToItem: (
    fromItemId: string,
    fromIndex: number,
    toItemId: string,
    toIndex?: number | null,
  ) => Promise<void>
  expandPendingImportItem: (itemId: string) => void
  assignPendingImportGalleryImageToSku: (itemId: string, skuKey: string, imageUrl: string) => Promise<void>
  uploadPendingImportSkuImage: (itemId: string, skuKey: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  replacePendingImportSkuImage: (itemId: string, skuKey: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>
  removePendingImportSkuImage: (itemId: string, skuKey: string) => Promise<void>
  duplicatePendingImportSkuRow: (itemId: string, skuKey: string) => Promise<void>
  deletePendingImportSkuRow: (itemId: string, skuKey: string) => Promise<void>
  duplicatePendingImportSkuColorRow: (itemId: string, color: string) => Promise<void>
  deletePendingImportSkuColorRow: (itemId: string, color: string) => Promise<void>
  addBatchImportRow: () => void
  removeBatchImportRow: (index: number) => void
  handleSubmitBatchImport: () => Promise<void>
  setFeaturedKeywordInput: (value: string) => void
  addFeaturedKeyword: () => void
  removeFeaturedKeyword: (keyword: string) => void
  saveFeaturedKeywords: () => Promise<void>
  setPendingImportDialogOpen: (open: boolean) => void
  setPinduoduoImportDialogOpen: (open: boolean) => void
  updatePendingImportTaskForm: <K extends keyof PendingImportTaskForm>(field: K, value: PendingImportTaskForm[K]) => void
  submitPendingImportTask: () => Promise<void>
  refreshPendingImportQueue: (options?: { silent?: boolean }) => Promise<void>
  setPendingImportPage: (page: number) => void
  setPendingImportPageSize: (size: number) => void
  retryPendingImportActiveTask: () => Promise<void>
  handleSelectAllPendingImport: (checked: boolean) => void
  handleSelectPendingImportRow: (id: string, checked: boolean) => void
  handleSelectPendingImportSkuKeys: (itemId: string, skuKeys: string[], checked: boolean) => void
  batchDeletePendingImportSelectedSkus: (itemId: string) => Promise<void>
  togglePendingImportReviewMark: (itemId: string) => Promise<void>
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
  cancelPendingImportParse: () => Promise<void>
  handlePendingImportParseButton: () => Promise<void>
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
  handleCalibratePendingImportItems: () => Promise<void>
  setCalibrateResultOpen: (open: boolean) => void
  toggleCalibrateResultCategory: (itemId: string, categoryId: string, checked: boolean) => void
  setCalibrateResultPrimary: (itemId: string, categoryId: string) => void
  saveCalibrateResultEdits: () => Promise<void>
  handleAutoClassifyPriceThresholdProducts: () => Promise<void>
  handleBackfillAllTitleFilterCategories: () => Promise<void>
  handleBatchMosaicGalleries: () => Promise<void>
  handleBatchTranslateTitlesToSpanish: () => Promise<void>
  handleBatchAppendTitleSuffix: (suffix: string) => Promise<void>
  handleBatchAppendPendingTitleSuffix: (suffix: string) => Promise<void>
  handleBatchRemoveTitleSuffix: (suffixes: string[]) => Promise<void>
  handleBatchRemovePendingTitleSuffix: (suffixes: string[]) => Promise<void>
  startProductStockEdit: (productId: string, stock: number) => void
  setProductStockEditingValue: (value: string) => void
  cancelProductStockEdit: () => void
  submitProductStockEdit: () => Promise<void>
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
  // Show spinner immediately on route mount so navigation doesn't feel frozen.
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<ProductListItem[]>([])
  const listLengthRef = useRef(0)
  const fetchListGenRef = useRef(0)
  const [usdExchangeRate, setUsdExchangeRate] = useState(DEFAULT_USD_EXCHANGE_RATE)
  const [total, setTotal] = useState(0)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const PRODUCT_PAGE_SIZE_OPTIONS = [30, 50, 100] as const
  const normalizeProductPageSize = (size: number) =>
    (PRODUCT_PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : 30
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
  /** Per-row batch-import image upload locks (multiple rows may upload in parallel). */
  const [batchImportImageUploadingKeys, setBatchImportImageUploadingKeys] = useState<string[]>([])
  /** @deprecated kept for UI that still reads singular key — first active row key or null */
  const batchImportImageUploadingKey = batchImportImageUploadingKeys[0] || null

  const selectedProductIds = selectedIds.filter((id) => !isSkuSelectionId(id))
  const selectedSkuIds = selectedIds.filter(isSkuSelectionId).map(fromSkuSelectionId)
  const [pendingImportImageUploadingIds, setPendingImportImageUploadingIds] = useState<string[]>([])
  const [pendingImportSkuImageUploadingKeys, setPendingImportSkuImageUploadingKeys] = useState<string[]>([])
  const [mainImageUploading, setMainImageUploading] = useState(false)
  const pendingImportImageInflightRef = useRef<Map<string, number>>(new Map())
  const pendingImportSkuImageInflightRef = useRef<Map<string, number>>(new Map())
  const pendingImportQueueRef = useRef<PendingImportQueueItem[]>([])
  /** 运营增删 SKU 后的目标 sku_key；轮询不得把已删行补回来 */
  const pendingImportSkuIntentRef = useRef<Map<string, { keys: string[]; at: number }>>(new Map())
  const pendingImportSkuLocalRef = useRef<Map<string, { skus: PendingImportSkuDraftItem[]; at: number }>>(new Map())
  const pendingImportGalleryPersistableRef = useRef<Map<string, string[]>>(new Map())
  const pendingImportForceServerIdsRef = useRef<Set<string>>(new Set())
  const pendingImportFetchInflightRef = useRef(false)
  const pendingImportFetchQueuedRef = useRef<{ silent?: boolean; page?: number; page_size?: number } | null>(null)
  const pendingImportHydratingIdsRef = useRef<Set<string>>(new Set())
  const pendingImportGalleryPersistChainRef = useRef<Map<string, Promise<void>>>(new Map())
  /** Shared upload pool — raised so multi-select galleries finish quickly without starving other products. */
  const sharedImageUploadPoolRef = useRef<{
    pending: Array<() => Promise<void>>
    active: number
    concurrency: number
  }>({ pending: [], active: 0, concurrency: 5 })
  const [galleryUploadingIndex, setGalleryUploadingIndex] = useState<number | null>(null)
  const [featuredKeywords, setFeaturedKeywords] = useState<string[]>([])
  const [featuredKeywordInput, setFeaturedKeywordInput] = useState('')
  const [featuredKeywordsSaving, setFeaturedKeywordsSaving] = useState(false)
  const [pendingImportDialogOpen, setPendingImportDialogOpen] = useState(false)
  const [pinduoduoImportDialogOpen, setPinduoduoImportDialogOpen] = useState(false)
  const [pendingImportTaskForm, setPendingImportTaskForm] = useState<PendingImportTaskForm>(defaultPendingImportTaskForm)
  const [pendingImportCreating, setPendingImportCreating] = useState(false)
  const [pendingImportRefreshing, setPendingImportRefreshing] = useState(false)
  const [pendingImportPublishing, setPendingImportPublishing] = useState(false)
  const [reparsingItemIds, setReparsingItemIds] = useState<Record<string, true>>({})
  const [pendingImportParseCancelling, setPendingImportParseCancelling] = useState(false)
  const [pendingImportParseJob, setPendingImportParseJob] = useState<{
    busy: boolean
    label: string | null
    total: number
    done: number
    cancel_requested: boolean
  } | null>(null)
  const pendingImportReparsing =
    Object.keys(reparsingItemIds).length > 0 || Boolean(pendingImportParseJob?.busy && /^reparse:/.test(pendingImportParseJob.label || ''))
  const [pendingImportQueueLoading, setPendingImportQueueLoading] = useState(false)
  const [pendingImportActiveTask, setPendingImportActiveTask] = useState<PendingImportQueueTaskSummary | null>(null)
  const pendingImportCollectRunning = Boolean(
    pendingImportActiveTask &&
      // PENDING alone is often a stuck queue entry — don't lock the whole pending tab.
      ['RUNNING', 'RATE_LIMITED'].includes(pendingImportActiveTask.task_status),
  )
  const pendingImportParseActive =
    pendingImportReparsing || pendingImportCollectRunning || Boolean(pendingImportParseJob?.busy)
  const pendingImportParseStatusLabel = (() => {
    const job = pendingImportParseJob
    if (job?.busy) {
      const done = Math.max(0, job.done)
      const total = Math.max(0, job.total)
      if (/^reparse:/.test(job.label || '')) {
        return total > 0
          ? `正在重新解析 ${done}/${total}…`
          : `正在重新解析（${job.label}）…`
      }
      if (/^task:/.test(job.label || '')) {
        return total > 0
          ? `正在抓取链接 ${done}/${total}（1688 串行，约每条十余秒）…`
          : '正在解析采集任务…'
      }
      return job.label ? `正在解析（${job.label}）…` : '正在解析…'
    }
    if (Object.keys(reparsingItemIds).length > 0) {
      return `正在重新解析已选 ${Object.keys(reparsingItemIds).length} 条商品`
    }
    if (pendingImportCollectRunning && pendingImportActiveTask) {
      return `正在采集「${pendingImportActiveTask.task_taskName}」（${pendingImportActiveTask.task_progressPercent}% · ${pendingImportActiveTask.task_sourceLinkCount} 条链接）`
    }
    return ''
  })()
  const [pendingImportQueue, setPendingImportQueue] = useState<PendingImportQueueItem[]>([])
  const [pendingImportQueueTotal, setPendingImportQueueTotal] = useState(0)
  const [pendingImportQueueError, setPendingImportQueueError] = useState<string | null>(null)
  const [pendingImportPage, setPendingImportPage] = useState(1)
  const [pendingImportPageSize, setPendingImportPageSize] = useState(30)
  const PENDING_PAGE_SIZE_OPTIONS = [15, 30] as const
  const normalizePendingPageSize = (size: number) =>
    (PENDING_PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : 30
  const [publishedImportMatch, setPublishedImportMatch] = useState<ProductListItem | null>(null)
  const [pendingImportSelectedIds, setPendingImportSelectedIds] = useState<string[]>([])
  const [pendingImportSelectedSkuKeys, setPendingImportSelectedSkuKeys] = useState<string[]>([])
  const [pendingImportReviewSavingIds, setPendingImportReviewSavingIds] = useState<string[]>([])
  const pendingImportReviewSavingIdsRef = useRef<string[]>([])
  pendingImportReviewSavingIdsRef.current = pendingImportReviewSavingIds
  const pendingImportVisibleIdsRef = useRef<string[]>([])
  const [pendingImportNowMs, setPendingImportNowMs] = useState(() => Date.now())
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
  const pendingImportInlineEditingCellRef = useRef<PendingImportEditableCell | null>(null)
  const pendingImportSkuEditingCellRef = useRef<PendingImportSkuEditableCell | null>(null)
  const pendingImportSkuSubmitLockRef = useRef(false)
  const pendingCategoryPickerRef = useRef<{ itemId: string; selectedId: string } | null>(null)
  pendingImportInlineEditingCellRef.current = pendingImportInlineEditingCell
  pendingImportSkuEditingCellRef.current = pendingImportSkuEditingCell
  pendingCategoryPickerRef.current = pendingCategoryPicker
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
  const [calibrateResultOpen, setCalibrateResultOpen] = useState(false)
  const [calibrateResultSaving, setCalibrateResultSaving] = useState(false)
  const [calibrateResultScope, setCalibrateResultScope] = useState<'product' | 'pending'>('product')
  const [calibrateResultSummary, setCalibrateResultSummary] = useState<{
    matched: number
    skipped: number
    failed: number
    total: number
  } | null>(null)
  const [calibrateResultDrafts, setCalibrateResultDrafts] = useState<Array<{
    id: string
    name: string
    primaryCategoryId: string | null
    linkedCategoryIds: string[]
    categoryNames?: Record<string, string>
    brandNormalized: boolean
    weightGrams: number | null
    weightUpdated: boolean
    status: CalibrateResultItem['status']
    message?: string | null
  }>>([])
  const [priceThresholdClassifyRunning, setPriceThresholdClassifyRunning] = useState(false)
  const [titleFilterBackfillRunning, setTitleFilterBackfillRunning] = useState(false)
  const [mosaicGalleryRunning, setMosaicGalleryRunning] = useState(false)
  const [spanishTitleBackfillRunning, setSpanishTitleBackfillRunning] = useState(false)
  const [titleSuffixRunning, setTitleSuffixRunning] = useState(false)
  const [productStockEditingId, setProductStockEditingId] = useState<string | null>(null)
  const [productStockEditingValue, setProductStockEditingValue] = useState('')

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
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as { list?: CategoryOption[] })?.list)
          ? (data as { list: CategoryOption[] }).list
          : []
      setCategoryOptions(list)
    } catch (err: any) {
      setCategoryOptions([])
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

  // Dedupe binding-meta RPCs (drawer / batch dialogs / idle warm).
  const bindingMetaPromiseRef = useRef<Promise<void> | null>(null)
  const ensureBindingMeta = useCallback(() => {
    if (!bindingMetaPromiseRef.current) {
      bindingMetaPromiseRef.current = fetchBindingMeta().catch((err) => {
        bindingMetaPromiseRef.current = null
        throw err
      })
    }
    return bindingMetaPromiseRef.current
  }, [fetchBindingMeta])

  const featuredKeywordsPromiseRef = useRef<Promise<void> | null>(null)
  const ensureFeaturedKeywords = useCallback(() => {
    if (!featuredKeywordsPromiseRef.current) {
      featuredKeywordsPromiseRef.current = fetchHomeFeaturedKeywords().catch((err) => {
        featuredKeywordsPromiseRef.current = null
        throw err
      })
    }
    return featuredKeywordsPromiseRef.current
  }, [fetchHomeFeaturedKeywords])

  const fetchList = useCallback(async (overrides?: Partial<{
    keyword?: string
    category_id?: string
    status_filter: ProductListFilterStatus
    goods_status: 'ALL' | ActionGoodsStatus
    supplier_name: string
    brand_keyword: string
    page: number
    clear_selection?: boolean
  }>) => {
    const gen = ++fetchListGenRef.current
    const hasRows = listLengthRef.current > 0
    if (!hasRows) setLoading(true)
    const watchdog = typeof window === 'undefined'
      ? null
      : window.setTimeout(() => {
          if (gen !== fetchListGenRef.current) return
          setLoading(false)
        }, 8_000)
    try {
      const nextKeyword = overrides?.keyword !== undefined
        ? overrides.keyword
        : (filterKeyword.trim() || params.name || undefined)
      const nextStatusFilter = overrides?.status_filter ?? filterManagementStatus
      const nextGoodsStatus = overrides?.goods_status ?? filterGoodsStatus
      const nextPage = overrides?.page ?? currentPage

      const result = await getProductList(
        {
          keyword: nextKeyword || undefined,
          category_id: (overrides?.category_id ?? params.categoryId) || undefined,
          status_filter: nextStatusFilter,
          goods_status: nextGoodsStatus === 'ALL' ? undefined : nextGoodsStatus,
          supplier_name: (overrides?.supplier_name ?? filterSupplierName).trim() || undefined,
          brand_keyword: (overrides?.brand_keyword ?? filterBrandKeyword).trim() || undefined,
          page: nextPage,
          page_size: pageSize
        },
        { __rpcTimeoutMs: 12_000 } as any,
      )
      if (gen !== fetchListGenRef.current) return
      setList(result.list)
      listLengthRef.current = result.list?.length || 0
      setTotal(result.total)
      if (Number(result.usd_exchange_rate) > 0) {
        setUsdExchangeRate(Number(result.usd_exchange_rate))
      }
      setPublishedImportMatch(result.published_import_match || null)
      if (overrides?.clear_selection) {
        setSelectedIds([])
      }
    } catch (err: any) {
      if (gen !== fetchListGenRef.current) return
      setPublishedImportMatch(null)
      const raw = String(err?.message || '')
      const isTimeout = /请求超时|timed out|timeout/i.test(raw)
      if (hasRows) {
        toast.message(isTimeout ? '商品列表刷新超时，仍显示上一页' : (raw || '获取商品列表失败'))
      } else if (!isTimeout) {
        toast.error(raw || '获取商品列表失败')
      } else {
        toast.message('后台繁忙，商品列表暂时拉不到，请点刷新')
      }
    } finally {
      if (watchdog) window.clearTimeout(watchdog)
      if (gen === fetchListGenRef.current) {
        setLoading(false)
      }
    }
  }, [params.name, params.categoryId, filterKeyword, filterManagementStatus, filterGoodsStatus, filterSupplierName, filterBrandKeyword, currentPage, pageSize])

  const applyPendingImportQueueResult = useCallback((result: ProductManagementPendingImportQueueOutput) => {
    setPendingImportActiveTask(result.activeTask || null)
    const visibleItems = (result.list || []).filter(item => !item.item_isPublished)
    const localQueueById = new Map(pendingImportQueueRef.current.map((item) => [item.item_id, item]))
    const mergedItems = visibleItems.map((item) => {
      if (pendingImportForceServerIdsRef.current.has(item.item_id)) {
        pendingImportForceServerIdsRef.current.delete(item.item_id)
        pendingImportSkuLocalRef.current.delete(item.item_id)
        pendingImportGalleryPersistableRef.current.delete(item.item_id)
        return item
      }
      const local = localQueueById.get(item.item_id)
      if (!local) return item
      const localSnap = pendingImportSkuLocalRef.current.get(item.item_id)
      const persistable = pendingImportGalleryPersistableRef.current.get(item.item_id) || []
      const localSkus = (localSnap && Date.now() - localSnap.at < 24 * 60 * 60 * 1000 && localSnap.skus.length > 0)
        ? localSnap.skus
        : (local.item_skus || [])
      const serverGallery = item.item_galleryUrls || []
      const localGallery = persistable.length > 0 ? persistable : (local.item_galleryUrls || [])
      const gallery =
        persistable.length > 1 || persistable.length >= serverGallery.length
          ? persistable
          : serverGallery.length >= localGallery.length
            ? serverGallery
            : localGallery
      return {
        ...item,
        item_productName: local.item_productName || item.item_productName,
        item_parsedName: local.item_parsedName || item.item_parsedName,
        item_skuSummaryText: local.item_skuSummaryText || item.item_skuSummaryText,
        item_skus: localSkus.length > 0 ? localSkus : item.item_skus,
        item_galleryUrls: gallery.length > 0 ? gallery : serverGallery,
        item_mainImageUrl: gallery[0] || item.item_mainImageUrl || local.item_mainImageUrl,
        item_parsedMainImageUrl: gallery[0] || item.item_parsedMainImageUrl || local.item_parsedMainImageUrl,
        item_fetchStatus: item.item_fetchStatus,
        item_failureReason: item.item_failureReason,
      }
    })
    setPendingImportQueue(mergedItems)
    setPendingImportQueueTotal(
      typeof result.total === 'number' ? result.total : visibleItems.length,
    )
    const previousPageIds = new Set(pendingImportVisibleIdsRef.current)
    pendingImportVisibleIdsRef.current = visibleItems.map(item => item.item_id)
    setPendingImportSelectedIds(prev => {
      if (visibleItems.length === 0 && (typeof result.total === 'number' ? result.total : 0) > 0) {
        return prev
      }
      return prev.filter(
        id => visibleItems.some(item => item.item_id === id) || !previousPageIds.has(id),
      )
    })
    if (typeof result.page === 'number' && result.page > 0) {
      setPendingImportPage(result.page)
    }

    const job = result.parse_job || null
    setPendingImportParseJob(job)
    // Restore row-level「解析中」from server so refresh still shows progress + 终止解析.
    if (job?.busy) {
      const runningIds = visibleItems
        .filter(item => item.item_fetchStatus === 'RUNNING')
        .map(item => item.item_id)
      if (runningIds.length > 0) {
        setReparsingItemIds(prev => {
          const next = { ...prev }
          for (const id of runningIds) next[id] = true
          return next
        })
      }
    } else {
      setReparsingItemIds(prev => {
        const ids = Object.keys(prev)
        if (!ids.length) return prev
        const stillRunning = visibleItems.some(
          item => prev[item.item_id] && item.item_fetchStatus === 'RUNNING',
        )
        if (stillRunning) return prev
        return {}
      })
    }
  }, [])

  const pendingImportTotalPages = Math.max(1, Math.ceil(pendingImportQueueTotal / pendingImportPageSize))
  // Server returns the current page; no client-side slice.
  const pendingImportPagedQueue = pendingImportQueue

  const pendingImportPageRef = useRef(pendingImportPage)
  pendingImportPageRef.current = pendingImportPage
  const pendingImportFetchGenRef = useRef(0)

  // Prefer refs so refresh callback identity stays stable (avoids remount-driven re-fetch).
  const pendingImportQueueLengthRef = useRef(0)
  const pendingImportQueueErrorRef = useRef<string | null>(null)
  const pendingImportLastFetchedAtRef = useRef(0)
  pendingImportQueueLengthRef.current = pendingImportQueue.length
  pendingImportQueueErrorRef.current = pendingImportQueueError
  pendingImportQueueRef.current = pendingImportQueue

  const pendingImportKeywordRef = useRef('')
  pendingImportKeywordRef.current = filterKeyword

  const refreshPendingImportQueue = useCallback(async (options?: { silent?: boolean; page?: number; page_size?: number }) => {
    const hasRows = pendingImportQueueLengthRef.current > 0
    const silent = (options?.silent ?? false) || hasRows
    const page = Math.max(1, options?.page ?? pendingImportPageRef.current)
    const pageSizeForFetch = Math.min(
      100,
      Math.max(1, Number(options?.page_size) || pendingImportPageSize),
    )
    if (pendingImportFetchInflightRef.current) {
      const currentPage = pendingImportPageRef.current
      if (page === currentPage) {
        pendingImportFetchQueuedRef.current = { silent: true, page, page_size: pageSizeForFetch }
      }
      return
    }
    const fetchGen = ++pendingImportFetchGenRef.current
    pendingImportFetchInflightRef.current = true
    if (!silent) {
      setPendingImportQueueLoading(true)
    }
    const watchdog = window.setTimeout(() => {
      if (fetchGen !== pendingImportFetchGenRef.current) return
      setPendingImportQueueLoading(false)
      setPendingImportRefreshing(false)
    }, 12_000)
    try {
      const result = await getPendingImportQueue(
        {
          page,
          page_size: pageSizeForFetch,
          keyword: pendingImportKeywordRef.current.trim() || undefined,
          skip_maintenance: true,
        } as any,
        { __rpcTimeoutMs: silent ? 20_000 : 25_000 },
      )
      if (fetchGen !== pendingImportFetchGenRef.current) return
      applyPendingImportQueueResult(result)
      pendingImportLastFetchedAtRef.current = Date.now()
      setPendingImportQueueError(null)
    } catch (err: any) {
      if (fetchGen !== pendingImportFetchGenRef.current) return
      const raw = String(err?.message || '')
      const isTimeout = /请求超时|timed out|timeout/i.test(raw)
      const message = /Failed to fetch|无法连接|NetworkError|fetch failed/i.test(raw)
        ? '无法连接后台 RPC。请执行：pnpm run build:server && pm2 restart rpc'
        : raw || '获取待上传区数据失败'
      if (!silent && !hasRows) {
        if (!isTimeout) {
          setPendingImportActiveTask(null)
          setPendingImportQueue([])
          setPendingImportQueueTotal(0)
          setPendingImportSelectedIds([])
        }
        if (pendingImportQueueErrorRef.current !== message) {
          if (isTimeout) {
            toast.message('待上传区加载较慢，请点击刷新')
          } else {
            toast.error(message)
          }
        }
        setPendingImportQueueError(message)
      }
    } finally {
      window.clearTimeout(watchdog)
      if (fetchGen === pendingImportFetchGenRef.current) {
        pendingImportFetchInflightRef.current = false
        setPendingImportRefreshing(false)
        setPendingImportQueueLoading(false)
        const queued = pendingImportFetchQueuedRef.current
        pendingImportFetchQueuedRef.current = null
        if (queued) {
          void refreshPendingImportQueue(queued)
        }
      }
    }
  }, [applyPendingImportQueueResult, pendingImportPageSize])

  const hydratePendingImportItemDrafts = useCallback(async (itemId: string) => {
    if (!itemId || pendingImportHydratingIdsRef.current.has(itemId)) return
    const current = pendingImportQueueRef.current.find((item) => item.item_id === itemId)
    if ((current?.item_skus || []).length > 0) return
    pendingImportHydratingIdsRef.current.add(itemId)
    try {
      const result = await getPendingImportQueue(
        {
          item_ids: [itemId],
          page_size: 1,
          skip_maintenance: true,
          include_drafts: true,
        } as any,
          { __rpcTimeoutMs: 45_000 },
      )
      const row = Array.isArray(result?.list) ? result.list[0] : null
      if (!row || row.item_id !== itemId) return
      const localSnap = pendingImportSkuLocalRef.current.get(itemId)
      setPendingImportQueue((prev) =>
        prev.map((item) => {
          if (item.item_id !== itemId) return item
          if (localSnap && Date.now() - localSnap.at < 30 * 60 * 1000 && localSnap.skus.length > 0) {
            return { ...item, ...row, item_skus: localSnap.skus }
          }
          return { ...item, ...row }
        }),
      )
    } catch (err: any) {
      toast.message(err?.message || '展开规格较慢，请稍后重试')
    } finally {
      pendingImportHydratingIdsRef.current.delete(itemId)
    }
  }, [])

  const handleSetPendingImportPage = (page: number) => {
    const totalPages = Math.max(1, Math.ceil(pendingImportQueueTotal / pendingImportPageSize))
    const next = Math.max(1, Math.min(page, totalPages))
    if (next === pendingImportPageRef.current && pendingImportQueue.length > 0) {
      // Same page already loaded — still allow forced refresh via other controls.
      return
    }
    pendingImportPageRef.current = next
    setPendingImportPage(next)
    void refreshPendingImportQueue({ silent: true, page: next })
  }

  const handleSetPageSize = (size: number) => {
    const next = normalizeProductPageSize(size)
    setPageSize(next)
    setCurrentPage(1)
  }

  const handleSetPendingImportPageSize = (size: number) => {
    const next = normalizePendingPageSize(size)
    setPendingImportPageSize(next)
    pendingImportPageRef.current = 1
    setPendingImportPage(1)
    void refreshPendingImportQueue({ silent: true, page: 1, page_size: next })
  }

  useEffect(() => {
    if (params.tab === 'pending_imports') {
      setActiveTab('pending_imports')
    }
  }, [params.tab])

  useEffect(() => {
    fetchCategoryOptions()
  }, [])

  useEffect(() => {
    setFilterCategoryId(params.categoryId || 'ALL')
  }, [params.categoryId])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Warm non-critical meta once after first list settles — avoids competing with getProductList on mount.
  // (getProductBindingMeta re-fetches the full category tree; featured keywords only power advanced settings.)
  const hasWarmedSecondaryMetaRef = useRef(false)
  useEffect(() => {
    if (loading || hasWarmedSecondaryMetaRef.current) return
    hasWarmedSecondaryMetaRef.current = true
    void ensureBindingMeta()
    void ensureFeaturedKeywords()
  }, [loading, ensureBindingMeta, ensureFeaturedKeywords])

  // Defer heavy getPendingImportQueue until the pending tab is opened (not every products visit).
  // Revisit within 45s: keep existing rows visible and refresh silently (no blank spinner).
  useEffect(() => {
    if (activeTab !== 'pending_imports') return
    if (pendingImportQueueLengthRef.current > 0) return
    void refreshPendingImportQueue({ silent: false })
    // Only load when switching to an empty pending tab. Edits must not retrigger a full reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // One shared clock for pending readiness heuristics (replaces per-row 30s timers).
  useEffect(() => {
    if (activeTab !== 'pending_imports') return
    setPendingImportNowMs(Date.now())
    const timer = window.setInterval(() => setPendingImportNowMs(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [activeTab])

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
    if (activeTab === 'pending_imports') {
      pendingImportPageRef.current = 1
      setPendingImportPage(1)
      void refreshPendingImportQueue({ silent: false, page: 1 })
      return
    }
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
    pendingImportKeywordRef.current = ''
    setFilterCategoryId('ALL')
    setFilterStatus('ALL')
    setFilterGoodsStatus('ALL')
    setFilterManagementStatus('ALL')
    setFilterSupplierName('')
    setFilterBrandKeyword('')
    setCurrentPage(1)
    pendingImportPageRef.current = 1
    setPendingImportPage(1)
    ProductManagement.navigateToAll(router)
    if (activeTab === 'pending_imports') {
      void refreshPendingImportQueue({ silent: false, page: 1 })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? list.map(item => item.product_id) : [])
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id))
  }

  const handleOpenCreate = () => {
    void ensureBindingMeta()
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
      const [, detail] = await Promise.all([ensureBindingMeta(), getProductDetail(id)])
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
    // SPU 重量变更：立即强制覆盖表单内全部 SKU 重量，失焦/保存前表格即可见
    if (field === 'weight_gram') {
      const grams = Number(value)
      const weightKg =
        Number.isFinite(grams) && grams > 0 ? Number((grams / 1000).toFixed(3)) : null
      setFormData((prev) => ({
        ...prev,
        weight_gram: value as ProductFormData['weight_gram'],
        skus: (prev.skus || []).map((sku) => ({ ...sku, weight_kg: weightKg })),
      }))
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
    // upload_project_file returns a non-empty URL string or throws with server detail
    const uploadResult = await upload_project_file(file)
    if (typeof uploadResult === 'string') {
      const url = uploadResult.trim()
      if (!url) throw new Error('图片上传失败：未返回有效地址')
      return url
    }
    const url = String(
      (uploadResult as { file_url?: string; image_url?: string; url?: string })?.file_url
        || (uploadResult as { file_url?: string; image_url?: string; url?: string })?.image_url
        || (uploadResult as { file_url?: string; image_url?: string; url?: string })?.url
        || '',
    ).trim()
    if (!url) throw new Error('图片上传失败：未返回有效地址')
    return url
  }

  const pumpSharedImageUploadPool = () => {
    const pool = sharedImageUploadPoolRef.current
    while (pool.active < pool.concurrency && pool.pending.length) {
      const job = pool.pending.shift()
      if (!job) return
      pool.active += 1
      void job().finally(() => {
        pool.active = Math.max(0, pool.active - 1)
        pumpSharedImageUploadPool()
      })
    }
  }

  /** Enqueue a single-file upload onto the shared slow pool (does not block other products). */
  const enqueueSharedImageUpload = <T,>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      sharedImageUploadPoolRef.current.pending.push(async () => {
        try {
          resolve(await task())
        } catch (error) {
          reject(error)
        }
      })
      pumpSharedImageUploadPool()
    })

  const uploadImagesToProject = async (files: File[]) => {
    let lastToastAt = 0
    const result = await upload_project_files_detailed(files, {
      concurrency: 5,
      // Only force sequential for very large selections to avoid one huge multipart.
      sequential: files.length > 12,
      onProgress: (done, total) => {
        if (total <= 1) return
        const now = Date.now()
        if (done === total || now - lastToastAt > 1200) {
          lastToastAt = now
          toast.message(`图片上传中 ${done}/${total}`)
        }
      },
    })
    const urls = result.urls.map(url => {
      const trimmed = String(url || '').trim()
      if (!trimmed) throw new Error('图片上传失败：未返回有效地址')
      return trimmed
    })
    if (result.failures.length && urls.length === 0) {
      throw new Error(
        `所选 ${files.length} 张图片全部上传失败：${result.failures[0]?.message || '网络异常'}`,
      )
    }
    if (result.failures.length) {
      toast.warning(
        `已保存 ${urls.length}/${files.length} 张；失败 ${result.failures.length} 张，可重新选择失败图片上传`,
      )
    }
    return urls
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
        supplierName: pendingImportTaskForm.supplierName.trim() || undefined,
        stockStrategyStock: pendingImportTaskForm.stockStrategyStock ? Number(pendingImportTaskForm.stockStrategyStock) : undefined
      })
      const createdCount = Number(created.createdCount ?? urls.length)
      const skippedDuplicateCount = Number(created.skippedDuplicateCount ?? 0)
      const categoryUrlCount = Number(created.categoryUrlCount ?? 0)
      if (categoryUrlCount > 0) {
        toast.success(
          `已创建任务（含 ${categoryUrlCount} 个分类/分页），尚未解析，请在采集弹窗点「开始解析」`,
        )
      } else if (skippedDuplicateCount > 0) {
        toast.success(
          `已创建 ${createdCount} 条新链接采集任务（跳过 ${skippedDuplicateCount} 条重复）；请点「开始解析」`,
        )
      } else {
        toast.success(`已创建 ${createdCount} 条 1688 采集任务，请点「开始解析」后再抓取`)
      }
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
      toast.success('已触发当前任务重试，请稍后点刷新查看进度')
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

  const togglePendingImportReviewMark = async (itemId: string) => {
    const current = pendingImportQueue.find(item => item.item_id === itemId)
    if (!current || pendingImportReviewSavingIds.includes(itemId)) return
    const nextReviewed = !Boolean(current.item_reviewed)
    const previousAt = current.item_reviewedAt ?? null
    setPendingImportReviewSavingIds(prev => [...prev, itemId])
    setPendingImportQueue(prev =>
      prev.map(item =>
        item.item_id === itemId
          ? {
              ...item,
              item_reviewed: nextReviewed,
              item_reviewedAt: nextReviewed ? new Date().toISOString() : null,
            }
          : item,
      ),
    )
    try {
      await setPendingImportReviewMark({
        item_ids: [itemId],
        reviewed: nextReviewed,
      })
    } catch (err: any) {
      setPendingImportQueue(prev =>
        prev.map(item =>
          item.item_id === itemId
            ? { ...item, item_reviewed: !nextReviewed, item_reviewedAt: previousAt }
            : item,
        ),
      )
      toast.error(err?.message || '更新审核标记失败')
    } finally {
      setPendingImportReviewSavingIds(prev => prev.filter(id => id !== itemId))
    }
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
      const nextItem = applyPendingImportLocalField(currentItem, field, payloadValue, usdExchangeRate)
      if (field === 'sku_summary_text') {
        pendingImportSkuLocalRef.current.set(itemId, { skus: nextItem.item_skus || [], at: Date.now() })
        const summaryText = String(payloadValue || '')
        const applied = applyPendingSkuSummaryText(currentItem.item_skus || [], summaryText, (nextItem.item_skus || [])[0])
        const shown = applied.mode === 'distribution' ? (nextItem.item_skus || []) : applied.skus
        const comboCount = applied.colors.length * applied.specs.length
        toast.success(describePendingSkuSummarySave(
          {
            ...applied,
            skus: shown,
            truncated: applied.mode === 'distribution' && comboCount > shown.length,
          },
          (currentItem.item_skus || []).length,
          summaryText,
        ))
      } else {
        toast.success('待上传条目已更新')
      }
      setPendingImportQueue((prev) =>
        prev.map((item) => (item.item_id === itemId ? nextItem : item)),
      )
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
    const field = pendingImportInlineEditingCell.field
    const itemId = pendingImportInlineEditingCell.itemId
    try {
      const payloadValue = buildPendingImportFieldPayload(field, valueToSave)
      if (field === 'product_name') {
        const previousName = String(currentItem.item_productName || currentItem.item_parsedName || '')
        const nextName = String(payloadValue || '')
        setPendingImportQueue((prev) =>
          prev.map((item) =>
            item.item_id === itemId
              ? { ...item, item_productName: nextName, item_parsedName: nextName }
              : item,
          ),
        )
        cancelPendingImportInlineEdit()
        try {
          await inlineUpdatePendingImportItemField(
            { item_id: itemId, field, value: payloadValue },
            { __rpcTimeoutMs: 12_000 } as any,
          )
          toast.success('待上传条目已更新')
        } catch (err: any) {
          setPendingImportQueue((prev) =>
            prev.map((item) =>
              item.item_id === itemId
                ? { ...item, item_productName: previousName, item_parsedName: previousName }
                : item,
            ),
          )
          toast.error(err.message || '保存待上传条目失败')
        }
        return
      }
      await inlineUpdatePendingImportItemField(
        {
          item_id: itemId,
          field,
          value: payloadValue,
        },
        { __rpcTimeoutMs: 20_000 } as any,
      )
      const nextItem = applyPendingImportLocalField(currentItem, field, payloadValue, usdExchangeRate)
      if (field === 'sku_summary_text') {
        pendingImportSkuLocalRef.current.set(itemId, { skus: nextItem.item_skus || [], at: Date.now() })
        const summaryText = String(payloadValue || '')
        const applied = applyPendingSkuSummaryText(currentItem.item_skus || [], summaryText, (nextItem.item_skus || [])[0])
        const shown = applied.mode === 'distribution' ? (nextItem.item_skus || []) : applied.skus
        const comboCount = applied.colors.length * applied.specs.length
        toast.success(describePendingSkuSummarySave(
          {
            ...applied,
            skus: shown,
            truncated: applied.mode === 'distribution' && comboCount > shown.length,
          },
          (currentItem.item_skus || []).length,
          summaryText,
        ))
      } else {
        toast.success('待上传条目已更新')
      }
      cancelPendingImportInlineEdit()
      setPendingImportQueue((prev) =>
        prev.map((item) => (item.item_id === itemId ? nextItem : item)),
      )
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
      toast.error('请先勾选要解析的商品')
      return
    }

    if (pendingImportParseJob?.busy) {
      toast.error('后台已有解析任务在跑。其它操作不受影响；若要改解析这批，请先点「终止解析」')
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

    toast.message(`已开始解析 ${idsToParse.length} 条（微购会逐条抓图，请稍等或点刷新）`)

    try {
      await reparsePendingImportItems(
        { item_ids: idsToParse },
        { __rpcTimeoutMs: 20_000 } as any,
      )
    } catch (err: any) {
      const reason = err?.message || '解析失败'
      if (/请求超时/.test(reason)) {
        toast.message('提交较慢，解析可能仍在后台进行，请稍后点刷新')
      } else {
        toast.error(reason)
        setPendingImportQueue(prev => prev.map(item =>
          idsToParse.includes(item.item_id)
            ? { ...item, item_fetchStatus: 'RETRY_PENDING' as PendingImportItemFetchStatus }
            : item,
        ))
        setReparsingItemIds(prev => {
          const next = { ...prev }
          for (const id of idsToParse) delete next[id]
          return next
        })
      }
    }
  }

  const cancelPendingImportParse = async () => {
    if (pendingImportParseCancelling) return
    setPendingImportParseCancelling(true)
    try {
      const result = await cancelPendingImportParseJob()
      setReparsingItemIds({})
      setPendingImportParseJob(null)
      toast.success(result?.message || '已终止解析')
    } catch (err: any) {
      toast.error(err?.message || '终止解析失败')
    } finally {
      setPendingImportParseCancelling(false)
    }
  }

  const handlePendingImportParseButton = async () => {
    if (pendingImportParseActive || pendingImportParseCancelling) {
      await cancelPendingImportParse()
      return
    }
    await reparseSelectedPendingImportItems()
  }

  const deleteSelectedPendingImportItems = async (itemIdsOverride?: string[]) => {
    const targetItemIds = itemIdsOverride?.length ? itemIdsOverride : pendingImportSelectedIds
    if (!targetItemIds.length) {
      toast.error('请先选择待删除条目')
      return
    }

    try {
      const result = await batchDeletePendingImportItems(targetItemIds)
      const removed = new Set(targetItemIds)
      setPendingImportSelectedIds([])
      setPendingImportQueue((prev) => prev.filter((item) => !removed.has(item.item_id)))
      setPendingImportQueueTotal((prev) => Math.max(0, prev - targetItemIds.length))
      toast.success(`待上传条目已删除，成功: ${result.success_count}，失败: ${result.fail_count}`)
    } catch (err: any) {
      toast.error(err.message || '删除待上传条目失败')
      throw err
    }
  }

  const toggleProductExpand = (productId: string) => {
    setExpandedProductIds(prev => {
      const opening = !prev.includes(productId)
      if (opening) {
        const current = list.find(item => item.product_id === productId)
        if (current && !(current.skus || []).length && Number(current.sku_count || 0) > 0) {
          void getProductListSkus(productId).then((skus) => {
            setList(rows => rows.map(row => row.product_id === productId ? { ...row, skus, sku_count: skus.length || row.sku_count } : row))
          }).catch(() => {
            toast.error('SKU 加载失败')
          })
        }
      }
      return opening ? [...prev, productId] : prev.filter(id => id !== productId)
    })
  }

  const togglePendingImportExpand = (itemId: string) => {
    setExpandedPendingImportIds(prev => {
      const opening = !prev.includes(itemId)
      if (opening) void hydratePendingImportItemDrafts(itemId)
      return opening ? [...prev, itemId] : prev.filter(id => id !== itemId)
    })
  }

  const expandPendingImportItem = (itemId: string) => {
    setExpandedPendingImportIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    void hydratePendingImportItemDrafts(itemId)
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
      productSkuEditingCell.field === 'min_order_qty' ? String(sku.min_order_qty ?? '') :
      String(sku.stock ?? '')

    if (
      productSkuEditingCell.field !== 'cost_price' &&
      productSkuEditingValue.trim() === String(original).trim()
    ) {
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
      const { productId, skuId, field } = productSkuEditingCell
      cancelProductSkuInlineEdit()
      // cost_price may recalculate sell price server-side — full refresh.
      if (field === 'cost_price') {
        setList((prev) =>
          prev.map((item) =>
            item.product_id === productId ? applyCostRecalcToListItem(item, Number(value), usdExchangeRate) : item,
          ),
        )
        await fetchList()
      } else {
        setList((prev) =>
          prev.map((item) => {
            if (item.product_id !== productId) return item
            if (field === 'price') return applySkuSellPriceToListItem(item, skuId, Number(value), usdExchangeRate)
            const skus = (item.skus || []).map((sku) => {
              if (sku.sku_id !== skuId) return sku
              if (field === 'stock') return { ...sku, stock: Number(value) }
              if (field === 'weight_gram') {
                const grams = Number(value)
                return { ...sku, weight_gram: grams, weight_kg: Number((grams / 1000).toFixed(3)) }
              }
              if (field === 'spec_text') return { ...sku, spec_text: String(value) }
              if (field === 'min_order_qty') return { ...sku, min_order_qty: Number(value) }
              return sku
            })
            const total_stock = skus.reduce((sum, sku) => sum + (Number(sku.stock) || 0), 0)
            return { ...item, skus, total_stock }
          }),
        )
      }
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

  const persistPendingImportSkuSnapshot = (itemId: string) => {
    const skus = pendingImportQueueRef.current.find((row) => row.item_id === itemId)?.item_skus || []
    if (!skus.length) return
    void inlineUpdatePendingImportSkuField(
      {
        item_id: itemId,
        sku_key: skus[0].sku_key,
        field: 'spec_text',
        value: skus[0].spec_text || '规格',
        skus,
      } as any,
      { __rpcTimeoutMs: 8_000 } as any,
    ).catch((err: any) => {
      const isTimeout = /请求超时|timed out|timeout/i.test(String(err?.message || ''))
      if (!isTimeout) toast.error(err.message || '保存待上传 SKU 失败')
    })
  }

  const submitPendingImportSkuInlineEdit = async () => {
    if (!pendingImportSkuEditingCell) return
    const item = pendingImportQueue.find(row => row.item_id === pendingImportSkuEditingCell.itemId)
    const sku = (item?.item_skus || []).find(row =>
      row.sku_key === pendingImportSkuEditingCell.skuKey ||
      (row as { skuKey?: string }).skuKey === pendingImportSkuEditingCell.skuKey,
    )
    if (!sku) {
      cancelPendingImportSkuInlineEdit()
      return
    }

    const original = readPendingSkuField(sku, pendingImportSkuEditingCell.field, item)

    if (pendingImportSkuEditingValue.trim() === String(original).trim()) {
      cancelPendingImportSkuInlineEdit()
      return
    }

    const cell = pendingImportSkuEditingCell
    const raw = pendingImportSkuEditingValue.trim()
    const value = PENDING_SKU_TEXT_FIELDS.has(cell.field) ? raw : Number(raw)
    const { itemId, skuKey, field } = cell
    cancelPendingImportSkuInlineEdit()
    setPendingImportQueue((prev) => {
      const nextQueue = prev.map((row) => {
        if (row.item_id !== itemId) return row
        if (field === 'minimum_order_quantity') {
          return { ...row, item_minimumOrderQuantity: Number(value) }
        }
        const skus = (row.item_skus || []).map((skuRow) =>
          skuRow.sku_key !== skuKey ? skuRow : patchPendingSkuField(skuRow, field, value),
        )
        pendingImportSkuLocalRef.current.set(itemId, { skus, at: Date.now() })
        const next = {
          ...row,
          item_skus: skus,
          item_skuSummaryText: skus.map((skuRow) => skuRow.spec_text).filter(Boolean).join(' | '),
        }
        return field === 'price' ? withPendingSkuPriceSummary(next, skus, usdExchangeRate) : next
      })
      pendingImportQueueRef.current = nextQueue
      return nextQueue
    })
    persistPendingImportSkuSnapshot(itemId)
  }

  const submitPendingImportColorGroupEdit = async (colorValue: string) => {
    if (!pendingImportSkuEditingCell) return
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
    const value = PENDING_SKU_TEXT_FIELDS.has(pendingImportSkuEditingCell.field) ? raw : Number(raw)
    if (!PENDING_SKU_TEXT_FIELDS.has(pendingImportSkuEditingCell.field) && !Number.isFinite(value as number)) {
      toast.error('请输入有效数字')
      return
    }

    const { itemId, skuKey, field } = pendingImportSkuEditingCell
    const skuKeys = new Set(colorSkus.map((sku) => sku.sku_key))
    cancelPendingImportSkuInlineEdit()
    setPendingImportQueue((prev) => {
      const nextQueue = prev.map((row) => {
        if (row.item_id !== itemId) return row
        if (field === 'minimum_order_quantity') {
          return { ...row, item_minimumOrderQuantity: Number(value) }
        }
        const skus = (row.item_skus || []).map((sku) =>
          skuKeys.has(sku.sku_key) ? patchPendingSkuField(sku, field, value) : sku,
        )
        pendingImportSkuLocalRef.current.set(itemId, { skus, at: Date.now() })
        const next = {
          ...row,
          item_skus: skus,
          item_skuSummaryText: skus.map((skuRow) => skuRow.spec_text).filter(Boolean).join(' | '),
        }
        return field === 'price' ? withPendingSkuPriceSummary(next, skus, usdExchangeRate) : next
      })
      pendingImportQueueRef.current = nextQueue
      return nextQueue
    })
    persistPendingImportSkuSnapshot(itemId)
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
      const result = await sync1688ProductStatus(
        { product_ids: productIds },
        { __rpcTimeoutMs: 180_000 } as any,
      )
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

  const openCalibrateResultDialog = (
    scope: 'product' | 'pending',
    result: {
      matched: number
      skipped: number
      failed: number
      total: number
      items: CalibrateResultItem[]
    },
  ) => {
    setCalibrateResultScope(scope)
    setCalibrateResultSummary({
      matched: result.matched,
      skipped: result.skipped,
      failed: result.failed,
      total: result.total,
    })
    setCalibrateResultDrafts(
      (result.items || []).map(item => {
        const categoryNames: Record<string, string> = {}
        for (const cat of item.categories || []) {
          if (cat.category_id && cat.category_name) {
            categoryNames[cat.category_id] = cat.category_name
          }
        }
        if (item.primary_category_id && item.primary_category_name) {
          categoryNames[item.primary_category_id] = item.primary_category_name
        }
        return {
          id: item.id,
          name: item.name,
          primaryCategoryId: item.primary_category_id,
          linkedCategoryIds: Array.from(
            new Set([
              ...(item.primary_category_id ? [item.primary_category_id] : []),
              ...((item.categories || []).map(c => c.category_id).filter(Boolean)),
            ]),
          ),
          categoryNames,
          brandNormalized: item.brand_normalized,
          weightGrams: item.weight_grams,
          weightUpdated: item.weight_updated,
          status: item.status,
          message: item.message,
        }
      }),
    )
    setCalibrateResultOpen(true)
  }

  const handleReclassifyPublishedProducts = async () => {
    if (reclassifyRunning) return
    const scopeIds = selectedProductIds
    if (scopeIds.length === 0) {
      toast.error('请先勾选要校准的商品')
      return
    }
    const confirmed = window.confirm(
      `将对已勾选的 ${scopeIds.length} 个商品执行一键校准（品牌归一 + 保底重量 + 类目/系数），完成后可在弹窗中修改全部分类。是否继续？`,
    )
    if (!confirmed) return

    setReclassifyRunning(true)
    try {
      const result = await reclassifyPublishedProductsBySecondaryMatch(
        { product_ids: scopeIds },
        { __rpcTimeoutMs: 180_000 } as any,
      )
      toast.success(
        `一键校准完成：命中 ${result.matched}，跳过 ${result.skipped}，失败 ${result.failed}（共 ${result.total}）`,
      )
      await Promise.all([fetchCategoryOptions(), fetchBindingMeta()])
      openCalibrateResultDialog('product', result)
      await fetchList()
    } catch (err: any) {
      toast.error(err?.message || '一键校准失败')
    } finally {
      setReclassifyRunning(false)
    }
  }

  const handleCalibratePendingImportItems = async () => {
    if (reclassifyRunning) return
    const scopeIds = pendingImportSelectedIds
    if (scopeIds.length === 0) {
      toast.error('请先勾选要校准的待上传商品')
      return
    }
    const confirmed = window.confirm(
      `将对已勾选的 ${scopeIds.length} 条待上传商品执行一键校准（品牌归一 + 保底重量 + 类目识别）。校准结果会写回待上传区，保存后可人工核对；上架时只翻译标题，不再改类目。是否继续？`,
    )
    if (!confirmed) return

    setReclassifyRunning(true)
    try {
      const result = await calibratePendingImportItems(
        { item_ids: scopeIds },
        { __rpcTimeoutMs: 180_000 } as any,
      )
      toast.success(
        `一键校准完成：命中 ${result.matched}，跳过 ${result.skipped}，失败 ${result.failed}（共 ${result.total}）`,
      )
      await Promise.all([fetchCategoryOptions(), fetchBindingMeta()])
      openCalibrateResultDialog('pending', result)
    } catch (err: any) {
      toast.error(err?.message || '一键校准失败')
    } finally {
      setReclassifyRunning(false)
    }
  }

  const toggleCalibrateResultCategory = (itemId: string, categoryId: string, checked: boolean) => {
    setCalibrateResultDrafts(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        const linked = checked
          ? Array.from(new Set([...item.linkedCategoryIds, categoryId]))
          : item.linkedCategoryIds.filter(id => id !== categoryId)
        const primaryCategoryId =
          !checked && item.primaryCategoryId === categoryId
            ? linked[0] || null
            : item.primaryCategoryId && linked.includes(item.primaryCategoryId)
              ? item.primaryCategoryId
              : linked[0] || null
        return { ...item, linkedCategoryIds: linked, primaryCategoryId }
      }),
    )
  }

  const setCalibrateResultPrimary = (itemId: string, categoryId: string) => {
    setCalibrateResultDrafts(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        const linked = item.linkedCategoryIds.includes(categoryId)
          ? item.linkedCategoryIds
          : [...item.linkedCategoryIds, categoryId]
        return { ...item, linkedCategoryIds: linked, primaryCategoryId: categoryId }
      }),
    )
  }

  const saveCalibrateResultEdits = async () => {
    if (calibrateResultSaving || calibrateResultDrafts.length === 0) return
    setCalibrateResultSaving(true)
    try {
      const res = await applyCalibrateCategoryEdits({
        scope: calibrateResultScope,
        edits: calibrateResultDrafts.map(item => ({
          id: item.id,
          primary_category_id: item.primaryCategoryId,
          linked_category_ids: item.linkedCategoryIds,
        })),
      })
      toast.success(
        calibrateResultScope === 'pending'
          ? `类目已保存：成功 ${res.success_count}，失败 ${res.fail_count}。可核对后点「上架」（仅翻译标题）。`
          : `类目已保存：成功 ${res.success_count}，失败 ${res.fail_count}`,
      )
      setCalibrateResultOpen(false)
      if (calibrateResultScope === 'pending') {
        const byId = new Map(calibrateResultDrafts.map((item) => [item.id, item]))
        setPendingImportQueue((prev) =>
          prev.map((item) => {
            const draft = byId.get(item.item_id)
            if (!draft) return item
            return {
              ...item,
              item_targetCategoryId: draft.primaryCategoryId,
              item_matchedCategoryIds: draft.linkedCategoryIds,
            }
          }),
        )
        setActiveTab('pending_imports')
      } else {
        await fetchList()
      }
    } catch (err: any) {
      toast.error(err?.message || '保存类目失败')
    } finally {
      setCalibrateResultSaving(false)
    }
  }

  const handleBackfillAllTitleFilterCategories = async () => {
    if (titleFilterBackfillRunning) return
    const confirmed = window.confirm(
      '将扫描全部商品 + 待上传区：按标题后缀自动补挂 high quality / normal quality / stainless steel / below13usd / below3usd 等关联类目（不改主类目）。无需勾选、无需分页。是否继续？',
    )
    if (!confirmed) return

    setTitleFilterBackfillRunning(true)
    try {
      const result = await backfillAllTitleFilterCategories()
      toast.success(
        `全库补关联完成：商品 ${result.products_updated}/${result.products_scanned} 条新增 ${result.relations_added} 个标签；待上传更新 ${result.pending_updated}/${result.pending_scanned} 条`,
      )
      await fetchList()
    } catch (err: any) {
      toast.error(err?.message || '全库补关联失败')
    } finally {
      setTitleFilterBackfillRunning(false)
    }
  }

  const handleBatchMosaicGalleries = async () => {
    if (mosaicGalleryRunning) return
    const pendingScope = activeTab === 'pending_imports'
    const ids = pendingScope
      ? pendingImportSelectedIds
      : selectedIds.filter((id) => !isSkuSelectionId(id))
    if (!ids.length) {
      toast.error('请先勾选要处理的商品')
      return
    }
    const confirmed = window.confirm(
      `将对已勾选的 ${ids.length} 个${pendingScope ? '待上传' : ''}商品的主图轮播和 SKU/色图右下角打马赛克并保存为新图（每件最多 40 张主图、40 张 SKU 图）。是否继续？`,
    )
    if (!confirmed) return
    setMosaicGalleryRunning(true)
    try {
      const result = await batchMosaicGalleryWatermarks(
        {
          scope: pendingScope ? 'pending' : 'product',
          ids,
        },
        { __rpcTimeoutMs: 300_000 } as any,
      )
      const summary =
        `商品成功 ${result.success_count}、失败 ${result.fail_count}；打码 ${result.images_ok} 张，失败 ${result.images_fail} 张`
      if (result.images_ok === 0) {
        toast.error(
          result.images_fail
            ? `马赛克未生效：${summary}。请确认图片能打开后再试`
            : `马赛克未改写任何图片。${summary}`,
        )
      } else {
        toast.success(`马赛克完成：${summary}`)
      }
      if (pendingScope) {
        ids.forEach((id) => {
          pendingImportForceServerIdsRef.current.add(id)
          pendingImportSkuLocalRef.current.delete(id)
          pendingImportGalleryPersistableRef.current.delete(id)
        })
        await refreshPendingImportQueue({ silent: false })
      } else {
        await fetchList()
      }
    } catch (err: any) {
      toast.error(err?.message || '批量马赛克失败')
    } finally {
      setMosaicGalleryRunning(false)
    }
  }

  const handleAutoClassifyPriceThresholdProducts = async () => {
    if (priceThresholdClassifyRunning) return
    const confirmed = window.confirm(
      '将扫描商品：归属一级「包/Bags」且售价≤13USD → 关联「Below 13usd」；归属「饰品/Jewelry」且售价≤3USD → 关联「Below 3 usd」（支持一级或二级同名类目）。不会改动主类目。是否继续？',
    )
    if (!confirmed) return

    setPriceThresholdClassifyRunning(true)
    try {
      const result = await autoClassifyPriceThresholdProducts()
      const created = result.created_categories?.length
        ? `；已自动创建：${result.created_categories.join('、')}`
        : ''
      const missing = result.missing_targets?.length
        ? `；仍无法处理：${result.missing_targets.join('、')}`
        : ''
      toast.success(
        `价格阈值分类完成：绑定 ${result.bound}，解除 ${result.unbound}，跳过 ${result.skipped}，失败 ${result.failed}（共 ${result.scanned}）${created}${missing}`,
      )
      await fetchList()
    } catch (err: any) {
      toast.error(err?.message || '价格阈值分类失败')
    } finally {
      setPriceThresholdClassifyRunning(false)
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

  const handleBatchAppendTitleSuffix = async (suffix: string) => {
    if (titleSuffixRunning) return
    const ids = selectedProductIds
    if (ids.length === 0) {
      toast.error('请先勾选商品')
      return
    }
    setTitleSuffixRunning(true)
    try {
      const result = await batchAppendProductTitleSuffix({ ids, suffix })
      toast.success(
        `批量加后缀完成：更新 ${result.success_count}，跳过 ${result.skip_count}，失败 ${result.fail_count}`,
      )
      await fetchList()
    } catch (err: any) {
      toast.error(err?.message || '批量加后缀失败')
      throw err
    } finally {
      setTitleSuffixRunning(false)
    }
  }

  const handleBatchAppendPendingTitleSuffix = async (suffix: string) => {
    if (titleSuffixRunning) return
    const ids = pendingImportSelectedIds
    if (ids.length === 0) {
      toast.error('请先勾选待上传商品')
      return
    }
    setTitleSuffixRunning(true)
    try {
      const idSet = new Set(ids)
      setPendingImportQueue((prev) =>
        prev.map((item) => {
          if (!idSet.has(item.item_id)) return item
          const current = String(item.item_productName || item.item_parsedName || '').trim()
          const nextName = appendTitleSuffixIfMissing(current, suffix)
          if (!nextName) return item
          return { ...item, item_productName: nextName, item_parsedName: nextName }
        }),
      )
      const result = await batchAppendPendingImportTitleSuffix(
        { ids, suffix },
        { __rpcTimeoutMs: 12_000 } as any,
      )
      toast.success(
        `批量加后缀完成：更新 ${result.success_count}，跳过 ${result.skip_count}，失败 ${result.fail_count}`,
      )
    } catch (err: any) {
      toast.error(err?.message || '批量加后缀失败')
      throw err
    } finally {
      setTitleSuffixRunning(false)
    }
  }

  const handleBatchRemoveTitleSuffix = async (suffixes: string[]) => {
    if (titleSuffixRunning) return
    const ids = selectedProductIds
    if (ids.length === 0) {
      toast.error('请先勾选商品')
      return
    }
    if (!suffixes?.length) {
      toast.error('请至少选择一个要移除的后缀')
      return
    }
    setTitleSuffixRunning(true)
    try {
      const result = await batchRemoveProductTitleSuffix({ ids, suffixes })
      toast.success(
        `批量移除后缀完成：更新 ${result.success_count}，跳过 ${result.skip_count}，失败 ${result.fail_count}`,
      )
      await fetchList()
    } catch (err: any) {
      toast.error(err?.message || '批量移除后缀失败')
      throw err
    } finally {
      setTitleSuffixRunning(false)
    }
  }

  const handleBatchRemovePendingTitleSuffix = async (suffixes: string[]) => {
    if (titleSuffixRunning) return
    const ids = pendingImportSelectedIds
    if (ids.length === 0) {
      toast.error('请先勾选待上传商品')
      return
    }
    if (!suffixes?.length) {
      toast.error('请至少选择一个要移除的后缀')
      return
    }
    setTitleSuffixRunning(true)
    try {
      const idSet = new Set(ids)
      setPendingImportQueue((prev) =>
        prev.map((item) => {
          if (!idSet.has(item.item_id)) return item
          const current = String(item.item_productName || item.item_parsedName || '').trim()
          const nextName = removeTitleSuffixesIfPresent(current, suffixes) || current
          return { ...item, item_productName: nextName, item_parsedName: nextName }
        }),
      )
      const result = await batchRemovePendingImportTitleSuffix({ ids, suffixes })
      toast.success(
        `批量移除后缀完成：更新 ${result.success_count}，跳过 ${result.skip_count}，失败 ${result.fail_count}`,
      )
    } catch (err: any) {
      toast.error(err?.message || '批量移除后缀失败')
      throw err
    } finally {
      setTitleSuffixRunning(false)
    }
  }

  const startProductStockEdit = (productId: string, stock: number) => {
    setProductStockEditingId(productId)
    setProductStockEditingValue(String(stock ?? 0))
  }

  const cancelProductStockEdit = () => {
    setProductStockEditingId(null)
    setProductStockEditingValue('')
  }

  const submitProductStockEdit = async () => {
    if (!productStockEditingId) return
    const nextStock = Math.round(Number(productStockEditingValue))
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      toast.error('库存不能小于0')
      return
    }
    try {
      await updateProductStock({ product_id: productStockEditingId, stock: nextStock })
      toast.success('可用库存已更新')
      const editedId = productStockEditingId
      cancelProductStockEdit()
      setList((prev) =>
        prev.map((item) =>
          item.product_id === editedId
            ? {
                ...item,
                total_stock: nextStock,
                skus: (item.skus || []).map((sku) => ({ ...sku, stock: nextStock })),
              }
            : item,
        ),
      )
    } catch (err: any) {
      toast.error(err?.message || '更新库存失败')
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
        }]).map(sku => ({
          ...sku,
          // 保存时强制全部 SKU 与 SPU 重量一致（不保留 SKU 原重量）
          weight_kg: formData.weight_gram ? Number((formData.weight_gram / 1000).toFixed(3)) : null,
        })),
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
    if (action === 'BIND_CATEGORIES' || action === 'UNBIND_CATEGORIES' || action === 'BIND_KEYWORDS') {
      void ensureBindingMeta()
    }
    if (action === 'BIND_CATEGORIES') {
      setBatchBindCategoryIds([])
      setBatchUnbindCategoryIds([])
      void loadCategoryProductPreview(null)
    }
    if (action === 'UNBIND_CATEGORIES') {
      // 当前筛到某类目时，默认勾选该类目，避免「点了移除但弹窗里什么都没选」看起来没变化
      const filteredId = filterCategoryId && filterCategoryId !== 'ALL' ? filterCategoryId : ''
      setBatchUnbindCategoryIds(filteredId ? [filteredId] : [])
      setBatchBindCategoryIds([])
      void loadCategoryProductPreview(filteredId || null)
    }
    if (action === 'BIND_KEYWORDS') {
      setBatchBindKeywordIds([])
    }
    if (action === 'MANAGEMENT_STATUS') {
      setBatchManagementStatus((firstSelected?.goods_status as ProductListStatusFilter) || 'ACTIVE')
    }
    if (action === 'WEIGHT_PRICE') {
      setBatchWeightPriceMode('price_coefficient')
      const firstPending = pendingImportQueue.find((item) => ids.includes(item.item_id))
      const pendingCoeff = firstPending?.item_coefficient
      setBatchWeightPriceValue(
        firstSelected?.price_coefficient
          ? String(firstSelected.price_coefficient)
          : pendingCoeff != null && Number(pendingCoeff) > 0
            ? String(pendingCoeff)
            : '',
      )
    }
    if (action === 'MIN_ORDER_QTY') {
      const firstSkuSelection = ids.find(isSkuSelectionId)
      const firstSku = firstSkuSelection
        ? list.flatMap((item) => item.skus || []).find((sku) => sku.sku_id === fromSkuSelectionId(firstSkuSelection))
        : null
      const firstPending = pendingImportQueue.find((item) => ids.includes(item.item_id))
      setBatchMinOrderQty(
        String(
          firstSku?.min_order_qty ??
          firstSelected?.min_order_qty ??
          firstPending?.item_minimumOrderQuantity ??
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
      } else if (confirmAction === 'RETURN_TO_PENDING') {
        const res = await returnProductsToPendingUpload({ product_ids: targetProductIds })
        toast.success(`已退回待上传，成功: ${res.success_count}，失败: ${res.fail_count}`)
        setSelectedIds([])
        setConfirmDialogOpen(false)
        const firstCode = (res.product_codes || []).filter(Boolean)[0]
        if (firstCode) {
          setFilterKeyword(firstCode)
          pendingImportKeywordRef.current = firstCode
        }
        pendingImportPageRef.current = 1
        setPendingImportPage(1)
        await Promise.all([fetchList(), refreshPendingImportQueue({ silent: true, page: 1 })])
        if (res.success_count > 0) {
          setActiveTab('pending_imports')
        }
        return
      } else if (confirmAction === 'PENDING_DELETE') {
        const res = await batchDeletePendingImportItems(confirmTargetIds)
        toast.success(`待上传条目已删除，成功: ${res.success_count}，失败: ${res.fail_count}`)
        setPendingImportSelectedIds([])
        const removed = new Set(confirmTargetIds)
        setPendingImportQueue((prev) => prev.filter((item) => !removed.has(item.item_id)))
        setPendingImportQueueTotal((prev) => Math.max(0, prev - confirmTargetIds.length))
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
        if (batchPriceAdjustMode === 'PRODUCT_COEFFICIENT') {
          const coeff = Number(batchPriceCoefficientValue)
          if (!Number.isFinite(coeff) || coeff <= 0) throw new Error('价格系数必须大于0')
        }
        const res = await batchUpdatePriceCoefficient(payload as any)
        toast.success(batchPriceAdjustMode === 'PRODUCT_COEFFICIENT'
          ? `商品系数已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`
          : `已按主类目系数重算售价，成功: ${res.success_count}，失败: ${res.fail_count}`)
        if (batchPriceAdjustMode === 'PRODUCT_COEFFICIENT') {
          const coeff = Number(batchPriceCoefficientValue)
          setList(prev => prev.map(item =>
            targetProductIds.includes(item.product_id)
              ? {
                  ...item,
                  price_coefficient: coeff,
                  effective_price_coefficient: coeff,
                }
              : item,
          ))
        }
      } else if (confirmAction === 'CATEGORY') {
        if (!batchCategoryId || batchCategoryId === 'ALL') throw new Error('请选择目标分类')
        const res = await batchUpdateProductCategory({ product_ids: targetProductIds, category_id: batchCategoryId })
        toast.success(`分类已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'MANAGEMENT_STATUS') {
        const res = await batchUpdateManagementStatus({ product_ids: targetProductIds, target_status: batchManagementStatus })
        toast.success(`状态已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'WEIGHT_PRICE') {
        const mode = batchWeightPriceMode === 'weight_gram' ? 'weight_gram' : 'price_coefficient'
        const raw = String(batchWeightPriceValue ?? '').trim()
        if (!raw) throw new Error(mode === 'weight_gram' ? '请输入重量' : '请输入价格系数')
        const nextValue = Number(raw)
        if (!Number.isFinite(nextValue) || nextValue <= 0) {
          throw new Error(mode === 'weight_gram' ? '重量必须大于0' : '价格系数必须大于0')
        }

        const pendingTargetIds = confirmTargetIds.filter((id) =>
          pendingImportQueue.some((item) => item.item_id === id),
        )
        const usePendingScope =
          activeTab === 'pending_imports' ||
          (pendingTargetIds.length > 0 && targetProductIds.length === 0)

        if (usePendingScope) {
          if (!pendingTargetIds.length) throw new Error('请先勾选待上传商品')
          const field = mode === 'weight_gram' ? 'weight_grams' : 'coefficient'
          const res = await batchUpdatePendingImportItemField({
            item_ids: pendingTargetIds,
            field,
            value: nextValue,
          })
          toast.success(mode === 'weight_gram'
            ? `待上传重量已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`
            : `待上传价格系数已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
          setConfirmDialogOpen(false)
          const idSet = new Set(pendingTargetIds)
          setPendingImportQueue((prev) =>
            prev.map((item) => {
              if (!idSet.has(item.item_id)) return item
              return applyPendingImportLocalField(
                item,
                field === 'weight_grams' ? 'weight_grams' : 'coefficient',
                nextValue,
                usdExchangeRate,
              )
            }),
          )
          return
        } else {
          if (!targetProductIds.length) throw new Error('请先选择商品')
          const res = await batchUpdateProductWeightPrice({
            product_ids: targetProductIds,
            field: mode,
            value: nextValue,
          })
          toast.success(mode === 'weight_gram'
            ? `重量已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`
            : `价格系数已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
          if (mode === 'price_coefficient' && res.success_count > 0) {
            setList(prev => prev.map(item =>
              targetProductIds.includes(item.product_id)
                ? {
                    ...item,
                    price_coefficient: nextValue,
                    effective_price_coefficient: nextValue,
                  }
                : item,
            ))
          } else if (mode === 'weight_gram' && res.success_count > 0) {
            setList(prev => prev.map(item =>
              targetProductIds.includes(item.product_id)
                ? applySpuWeightToProductListItem(item, nextValue)
                : item,
            ))
          }
        }
      } else if (confirmAction === 'MIN_ORDER_QTY') {
        const qty = Math.round(Number(batchMinOrderQty))
        if (!Number.isFinite(qty) || qty <= 0) throw new Error('起订量必须大于0')
        const pendingTargetIds = confirmTargetIds.filter((id) =>
          pendingImportQueue.some((item) => item.item_id === id),
        )
        const usePendingScope =
          activeTab === 'pending_imports' ||
          (pendingTargetIds.length > 0 && targetProductIds.length === 0)

        if (usePendingScope) {
          if (!pendingTargetIds.length) throw new Error('请先勾选待上传商品')
          const res = await batchUpdatePendingImportItemField({
            item_ids: pendingTargetIds,
            field: 'minimum_order_quantity',
            value: qty,
          })
          toast.success(`待上传起订量已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
          setConfirmDialogOpen(false)
          const idSet = new Set(pendingTargetIds)
          setPendingImportQueue((prev) =>
            prev.map((item) =>
              idSet.has(item.item_id) ? { ...item, item_minimumOrderQuantity: qty } : item,
            ),
          )
          return
        } else {
          const res = await batchUpdateMinOrderQty({
            product_ids: targetProductIds,
            sku_ids: targetSkuIds,
            min_order_qty: qty,
          })
          toast.success(`起订量已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
        }
      } else if (confirmAction === 'BIND_CATEGORIES') {
        if (!batchBindCategoryIds.length) throw new Error('请至少选择一个关联类目')
        const pendingTargetIds = confirmTargetIds.filter((id) =>
          pendingImportQueue.some((item) => item.item_id === id),
        )
        const usePendingScope =
          activeTab === 'pending_imports' ||
          (pendingTargetIds.length > 0 && targetProductIds.length === 0)

        if (usePendingScope) {
          if (!pendingTargetIds.length) throw new Error('请先勾选待上传商品')
          const edits = pendingTargetIds.map((itemId) => {
            const item = pendingImportQueue.find((row) => row.item_id === itemId)
            const existing = Array.isArray(item?.item_matchedCategoryIds)
              ? item!.item_matchedCategoryIds.filter(Boolean)
              : []
            const linked = Array.from(new Set([...existing, ...batchBindCategoryIds]))
            return {
              id: itemId,
              primary_category_id: item?.item_targetCategoryId || linked[0] || null,
              linked_category_ids: linked,
            }
          })
          const res = await applyCalibrateCategoryEdits({ scope: 'pending', edits })
          toast.success(`待上传关联类目已批量追加，成功: ${res.success_count}，失败: ${res.fail_count}`)
          setConfirmDialogOpen(false)
          const extra = new Set(batchBindCategoryIds)
          setPendingImportQueue((prev) =>
            prev.map((item) => {
              if (!pendingTargetIds.includes(item.item_id)) return item
              const existing = Array.isArray(item.item_matchedCategoryIds) ? item.item_matchedCategoryIds : []
              return { ...item, item_matchedCategoryIds: Array.from(new Set([...existing, ...extra])) }
            }),
          )
          return
        }

        const res = await batchBindProductCategories({ product_ids: targetProductIds, linked_category_ids: batchBindCategoryIds })
        if (res.success_count > 0) {
          toast.success(`关联类目已批量追加绑定，新增 ${res.success_count} 条`)
        } else {
          toast.success('所选商品已全部关联到目标类目，无需重复绑定')
        }
      } else if (confirmAction === 'UNBIND_CATEGORIES') {
        if (!batchUnbindCategoryIds.length) throw new Error('请至少选择一个要移除的类目')
        const pendingTargetIds = confirmTargetIds.filter((id) =>
          pendingImportQueue.some((item) => item.item_id === id),
        )
        const usePendingScope =
          activeTab === 'pending_imports' ||
          (pendingTargetIds.length > 0 && targetProductIds.length === 0)

        if (usePendingScope) {
          if (!pendingTargetIds.length) throw new Error('请先勾选待上传商品')
          const removeSet = new Set(
            expandSelectedCategoryIdsWithDescendants(batchUnbindCategoryIds, bindingCategoryOptions),
          )
          const edits = pendingTargetIds.map((itemId) => {
            const item = pendingImportQueue.find((row) => row.item_id === itemId)
            const primaryId = item?.item_targetCategoryId || null
            const existing = Array.isArray(item?.item_matchedCategoryIds)
              ? item!.item_matchedCategoryIds.filter(Boolean)
              : []
            // 主类目不删，与商品列表批量移除行为一致
            const linked = existing.filter((id) => id === primaryId || !removeSet.has(id))
            return {
              id: itemId,
              primary_category_id: primaryId || linked[0] || null,
              linked_category_ids: linked,
            }
          })
          const res = await applyCalibrateCategoryEdits({ scope: 'pending', edits })
          toast.success(`待上传关联类目已批量移除，成功: ${res.success_count}，失败: ${res.fail_count}`)
          setConfirmDialogOpen(false)
          setPendingImportQueue((prev) =>
            prev.map((item) => {
              const edit = edits.find((row) => row.id === item.item_id)
              if (!edit) return item
              return {
                ...item,
                item_targetCategoryId: edit.primary_category_id,
                item_matchedCategoryIds: edit.linked_category_ids,
              }
            }),
          )
          return
        }

        const res = await batchUnbindProductCategories({ product_ids: targetProductIds, linked_category_ids: batchUnbindCategoryIds })
        if (res.fail_count > 0) {
          toast.error(`关联类目移除完成：成功 ${res.success_count}，失败 ${res.fail_count}`)
        } else if (res.success_count === 0) {
          toast.message('没有商品绑定了所选类目，无需移除')
        } else {
          toast.success(`关联类目已批量移除，成功: ${res.success_count}，失败: ${res.fail_count}`)
        }
      } else if (confirmAction === 'BIND_KEYWORDS') {
        if (!batchBindKeywordIds.length) throw new Error('请至少选择一个关联关键词')
        const res = await batchBindProductKeywords({ product_ids: targetProductIds, linked_keyword_ids: batchBindKeywordIds })
        toast.success(`关联关键词已批量绑定，成功: ${res.success_count}，失败: ${res.fail_count}`)
      }
      setConfirmDialogOpen(false)
      if (confirmAction === 'DELETE') {
        setSelectedIds([])
      }
      // Scalar batch ops already patched `list`; refresh quietly without blocking the dialog close.
      const softRefreshOnly =
        confirmAction === 'WEIGHT_PRICE' ||
        confirmAction === 'MIN_ORDER_QTY' ||
        (confirmAction === 'PRICE_COEFFICIENT' && batchPriceAdjustMode === 'PRODUCT_COEFFICIENT')
      if (softRefreshOnly) {
        void fetchList()
      } else {
        await fetchList()
      }
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
    if (
      originalValue === nextComparableValue &&
      field !== 'cost_price' &&
      field !== 'price_coefficient'
    ) {
      return
    }

    setInlineSaving(true)
    try {
      const payloadValue = buildProductFieldPayload(field, value === null || value === undefined ? '' : String(value))
      await inlineUpdateProductField({
        product_id: productId,
        field,
        value: payloadValue
      })
      toast.success('商品信息已更新')
      // Scalar fields: patch locally. Price-affecting fields need a full list refresh.
      if (field === 'cost_price') {
        setList((prev) =>
          prev.map((item) =>
            item.product_id === productId ? applyCostRecalcToListItem(item, Number(payloadValue), usdExchangeRate) : item,
          ),
        )
        await fetchList()
      } else if (field === 'price_coefficient' || field === 'category_id') {
        await fetchList()
      } else {
        setList((prev) =>
          prev.map((item) => {
            if (item.product_id !== productId) return item
            if (field === 'product_name') return { ...item, product_name: String(payloadValue || '') }
            if (field === 'supplier_name') return { ...item, supplier_name: String(payloadValue || '') || null }
            if (field === 'goods_status') return { ...item, goods_status: payloadValue as any }
            if (field === 'weight_gram') return applySpuWeightToProductListItem(item, Number(payloadValue))
            if (field === 'min_order_qty') {
              const nextQty = Math.max(1, Math.round(Number(payloadValue) || 1))
              return {
                ...item,
                min_order_qty: nextQty,
                trade_info_json: {
                  ...((item as any).trade_info_json || {}),
                  minOrderQty: nextQty,
                },
              }
            }
            return item
          }),
        )
      }
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
    const field = inlineEditingCell.field
    const forceRecalc = field === 'cost_price' || field === 'price_coefficient'

    if (!forceRecalc && nextRawValue === String(originalValue).trim()) {
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
      const productId = inlineEditingCell.productId
      cancelInlineEdit()
      if (field === 'cost_price') {
        setList((prev) =>
          prev.map((item) =>
            item.product_id === productId ? applyCostRecalcToListItem(item, Number(payloadValue), usdExchangeRate) : item,
          ),
        )
        await fetchList()
      } else if (field === 'price_coefficient' || field === 'category_id') {
        await fetchList()
      } else {
        setList((prev) =>
          prev.map((item) => {
            if (item.product_id !== productId) return item
            if (field === 'product_name') return { ...item, product_name: String(payloadValue || '') }
            if (field === 'supplier_name') return { ...item, supplier_name: String(payloadValue || '') || null }
            if (field === 'goods_status') return { ...item, goods_status: payloadValue as any }
            if (field === 'weight_gram') return applySpuWeightToProductListItem(item, Number(payloadValue))
            if (field === 'min_order_qty') {
              const nextQty = Math.max(1, Math.round(Number(payloadValue) || 1))
              return {
                ...item,
                min_order_qty: nextQty,
                trade_info_json: {
                  ...((item as any).trade_info_json || {}),
                  minOrderQty: nextQty,
                },
              }
            }
            return item
          }),
        )
      }
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
      // Lazy-load xlsx only when importing — keeps product-management first paint lighter.
      const XLSX = await import('xlsx')
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
    const rowKey = `row-${index}`
    setBatchImportImageUploadingKeys(prev => (prev.includes(rowKey) ? prev : [...prev, rowKey]))
    toast.message(`第 ${index + 1} 行已加入 ${files.length} 张，后台慢慢传，可继续给其它行选图`)
    const uploaded: string[] = []
    try {
      for (const file of files) {
        try {
          const url = await enqueueSharedImageUpload(() => uploadImageToProject(file))
          uploaded.push(url)
          setBatchImportRows(prev => {
            const next = [...prev]
            const row = next[index]
            if (!row) return prev
            const gallery = Array.from(new Set([...(row.gallery_urls || []), ...uploaded]))
            next[index] = {
              ...row,
              gallery_urls: gallery,
              main_image_url: gallery[0] || '',
            }
            return next
          })
        } catch (fileErr: any) {
          toast.warning(`${file.name} 上传失败：${fileErr?.message || '网络异常'}`)
        }
      }
      if (!uploaded.length) throw new Error('图片全部上传失败')
      toast.success(`第 ${index + 1} 行已上传 ${uploaded.length}/${files.length} 张`)
    } catch (err: any) {
      toast.error(err.message || '图片上传失败')
    } finally {
      setBatchImportImageUploadingKeys(prev => prev.filter(k => k !== rowKey))
    }
  }

  const replaceBatchImportImage = async (rowIndex: number, imageIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const rowKey = `row-${rowIndex}-${imageIndex}`
    setBatchImportImageUploadingKeys(prev => (prev.includes(rowKey) ? prev : [...prev, rowKey]))
    try {
      const fileUrl = await enqueueSharedImageUpload(() => uploadImageToProject(file))
      setBatchImportRows(prev => {
        const next = [...prev]
        const row = next[rowIndex]
        if (!row) return prev
        const current = [...(row.gallery_urls || [])]
        current[imageIndex] = fileUrl
        const unique = Array.from(new Set(current.map(url => url.trim()).filter(Boolean)))
        next[rowIndex] = {
          ...row,
          gallery_urls: unique,
          main_image_url: unique[0] || '',
        }
        return next
      })
      toast.success('图片已替换')
    } catch (err: any) {
      toast.error(err.message || '图片替换失败')
    } finally {
      setBatchImportImageUploadingKeys(prev => prev.filter(k => k !== rowKey))
    }
  }

  const removeBatchImportImage = (rowIndex: number, imageIndex: number) => {
    const current = [...(batchImportRows[rowIndex]?.gallery_urls || [])]
    current.splice(imageIndex, 1)
    syncBatchImportGallery(rowIndex, current)
  }

  const readPendingGalleryUrls = (item?: PendingImportQueueItem | null): string[] => {
    if (!item) return []
    if (item.item_galleryUrls?.length) return [...item.item_galleryUrls]
    const main = item.item_mainImageUrl || item.item_parsedMainImageUrl
    return main ? [main] : []
  }

  const bumpPendingImportImageInflight = (itemId: string, delta: number) => {
    const map = pendingImportImageInflightRef.current
    const next = Math.max(0, (map.get(itemId) || 0) + delta)
    if (next === 0) map.delete(itemId)
    else map.set(itemId, next)
    setPendingImportImageUploadingIds(Array.from(map.keys()))
  }

  const bumpPendingImportSkuImageInflight = (uploadKey: string, delta: number) => {
    const map = pendingImportSkuImageInflightRef.current
    const next = Math.max(0, (map.get(uploadKey) || 0) + delta)
    if (next === 0) map.delete(uploadKey)
    else map.set(uploadKey, next)
    setPendingImportSkuImageUploadingKeys(Array.from(map.keys()))
  }

  const enqueuePersistPendingImportGallery = (
    itemId: string,
    urls: string[],
    mode: 'merge' | 'replace' = 'replace',
    options?: { allowShrink?: boolean },
  ) => {
    const cleaned = urls
      .map(url => String(url || '').trim())
      .filter(url => url && !url.startsWith('blob:'))
    const unique = Array.from(new Set(cleaned))
    if (!(mode === 'replace' ? cleaned : unique).length) {
      return Promise.reject(new Error('至少保留一张主图：可先点「上传/编辑图片」加新图，再删旧图'))
    }
    const fromQueue = readPendingGalleryUrls(
      pendingImportQueueRef.current.find(item => item.item_id === itemId),
    ).filter(url => !url.startsWith('blob:'))
    const persistable = pendingImportGalleryPersistableRef.current.get(itemId) || []
    const baseline = persistable.length >= fromQueue.length ? persistable : fromQueue
    const next =
      mode === 'merge'
        ? Array.from(new Set([...persistable, ...fromQueue, ...unique]))
        : !options?.allowShrink && unique.length < baseline.length
          ? baseline
          : options?.allowShrink
            ? unique
            : cleaned
    pendingImportGalleryPersistableRef.current.set(itemId, next)

    const previous = pendingImportGalleryPersistChainRef.current.get(itemId) || Promise.resolve()
    const job = previous
      .catch(() => undefined)
      .then(async () => {
        const latest = pendingImportGalleryPersistableRef.current.get(itemId) || next
        if (!latest.length) throw new Error('至少保留一张主图：可先点「上传/编辑图片」加新图，再删旧图')
        await updatePendingImportGallery({
          itemId,
          galleryUrls: latest,
          mainImageUrl: latest[0],
        })
        setPendingImportQueue(prev => prev.map(item => {
          if (item.item_id !== itemId) return item
          const keepBlobs = (item.item_galleryUrls || []).filter(url => url.startsWith('blob:'))
          const nextGallery = [...latest, ...keepBlobs.filter(blob => !latest.includes(blob))]
          return {
            ...item,
            item_mainImageUrl: latest[0],
            item_parsedMainImageUrl: latest[0],
            item_galleryUrls: nextGallery,
          }
        }))
      })
    pendingImportGalleryPersistChainRef.current.set(itemId, job)
    return job
  }

  const persistPendingImportGallery = async (
    itemId: string,
    galleryUrls: string[],
    options?: { allowShrink?: boolean },
  ) => {
    await enqueuePersistPendingImportGallery(itemId, galleryUrls, 'replace', options)
  }

  const pastePendingImportImageUrls = async (itemId: string, text: string) => {
    const raw = String(text || '').trim()
    if (!raw) {
      toast.error('请先粘贴图片地址')
      return
    }
    bumpPendingImportImageInflight(itemId, 1)
    toast.message('正在把图链转到本站…')
    try {
      const res = await fetch('/api/import-remote-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: raw }),
      })
      const payload = (await res.json().catch(() => null)) as {
        code?: number
        message?: string
        data?: { urls?: string[]; failed?: Array<{ url: string; reason: string }> }
      } | null
      if (!res.ok || !payload || payload.code !== 200) {
        throw new Error(payload?.message || `图链导入失败（HTTP ${res.status}）`)
      }
      const uploaded = Array.isArray(payload.data?.urls) ? payload.data.urls.filter(Boolean) : []
      if (!uploaded.length) {
        throw new Error(payload.message || '没有成功转入的图片')
      }
      const itemBefore =
        pendingImportQueueRef.current.find(row => row.item_id === itemId) ||
        pendingImportQueue.find(row => row.item_id === itemId)
      const current = readPendingGalleryUrls(itemBefore).filter(url => !url.startsWith('blob:'))
      const next = Array.from(new Set([...current, ...uploaded]))
      setPendingImportQueue(prev => prev.map(item =>
        item.item_id === itemId
          ? {
              ...item,
              item_galleryUrls: next,
              item_mainImageUrl: next[0] || item.item_mainImageUrl,
              item_parsedMainImageUrl: next[0] || item.item_parsedMainImageUrl,
            }
          : item,
      ))
      await enqueuePersistPendingImportGallery(itemId, next, 'merge')
      const failedCount = payload.data?.failed?.length || 0
      toast.success(
        failedCount > 0
          ? `已转入 ${uploaded.length} 张，${failedCount} 张失败`
          : `已转入 ${uploaded.length} 张图片到网页`,
      )
    } catch (err: any) {
      toast.error(err?.message || '图链导入失败')
    } finally {
      bumpPendingImportImageInflight(itemId, -1)
    }
  }

  const uploadPendingImportImages = async (itemId: string, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length === 0) return

    const itemBeforeUpload =
      pendingImportQueueRef.current.find(row => row.item_id === itemId) ||
      pendingImportQueue.find(row => row.item_id === itemId)
    const current = readPendingGalleryUrls(itemBeforeUpload)
    const previewUrls = files.map(file => URL.createObjectURL(file))

    // Optimistic local thumbnails so operator can keep selecting more images / other products.
    setPendingImportQueue(prev => prev.map(item =>
      item.item_id === itemId
        ? { ...item, item_galleryUrls: [...readPendingGalleryUrls(item), ...previewUrls] }
        : item,
    ))
    bumpPendingImportImageInflight(itemId, 1)
    toast.message(`已加入 ${files.length} 张到上传队列，可继续给其它商品选图`)

    // Fire-and-forget: batch multipart (or pooled individuals) then persist once.
    void (async () => {
      try {
        const uploaded = await uploadImagesToProject(files)
        const successCount = uploaded.length

        setPendingImportQueue(prev => prev.map(item => {
          if (item.item_id !== itemId) return item
          const withoutBlobs = readPendingGalleryUrls(item).filter(url => !previewUrls.includes(url))
          const gallery = [...withoutBlobs, ...uploaded]
          const persistable = gallery.filter(url => !url.startsWith('blob:'))
          const main = persistable[0] || item.item_mainImageUrl
          return {
            ...item,
            item_galleryUrls: gallery,
            item_mainImageUrl: main,
            item_parsedMainImageUrl: main,
          }
        }))

        if (successCount > 0) {
          const persistableNow = Array.from(
            new Set([
              ...current.filter(url => !url.startsWith('blob:')),
              ...uploaded,
            ]),
          )
          await enqueuePersistPendingImportGallery(itemId, persistableNow, 'merge')
          toast.success(`已上传 ${successCount}/${files.length} 张图片`)
        } else {
          toast.error('图片上传失败：没有成功写入的图片')
          setPendingImportQueue(prev => prev.map(item => {
            if (item.item_id !== itemId) return item
            const gallery = readPendingGalleryUrls(item).filter(url => !previewUrls.includes(url))
            const main = gallery.find(url => !url.startsWith('blob:')) || gallery[0] || current[0] || null
            return {
              ...item,
              item_galleryUrls: gallery.length ? gallery : current,
              item_mainImageUrl: main,
              item_parsedMainImageUrl: main,
            }
          }))
        }
      } catch (err: any) {
        setPendingImportQueue(prev => prev.map(item => {
          if (item.item_id !== itemId) return item
          const gallery = readPendingGalleryUrls(item).filter(url => !previewUrls.includes(url))
          const main = gallery.find(url => !url.startsWith('blob:')) || gallery[0] || current[0] || null
          return {
            ...item,
            item_galleryUrls: gallery.length ? gallery : current,
            item_mainImageUrl: main,
            item_parsedMainImageUrl: main,
          }
        }))
        toast.error(err?.message || '图片上传失败')
      } finally {
        bumpPendingImportImageInflight(itemId, -1)
        window.setTimeout(() => {
          previewUrls.forEach(url => URL.revokeObjectURL(url))
        }, 1500)
      }
    })()
  }

  const replacePendingImportImage = async (itemId: string, imageIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    bumpPendingImportImageInflight(itemId, 1)
    try {
      const fileUrl = await enqueueSharedImageUpload(() => uploadImageToProject(file))
      const item =
        pendingImportQueueRef.current.find(row => row.item_id === itemId) ||
        pendingImportQueue.find(row => row.item_id === itemId)
      const current = readPendingGalleryUrls(item)
      current[imageIndex] = fileUrl
      await persistPendingImportGallery(itemId, current)
      toast.success('图片已替换')
    } catch (err: any) {
      toast.error(err.message || '图片替换失败')
    } finally {
      bumpPendingImportImageInflight(itemId, -1)
    }
  }

  const removePendingImportImage = async (itemId: string, imageIndex: number) => {
    const item =
      pendingImportQueueRef.current.find(row => row.item_id === itemId) ||
      pendingImportQueue.find(row => row.item_id === itemId)
    const current = readPendingGalleryUrls(item)
    current.splice(imageIndex, 1)
    try {
      await persistPendingImportGallery(itemId, current, { allowShrink: true })
      toast.success('图片已删除')
    } catch (err: any) {
      toast.error(err.message || '图片删除失败')
    }
  }

  const applyLocalGallery = (itemId: string, next: string[]) => {
    setPendingImportQueue((prev) => {
      const mapped = prev.map((row) =>
        row.item_id === itemId
          ? {
              ...row,
              item_galleryUrls: next,
              item_mainImageUrl: next[0] || row.item_mainImageUrl,
              item_parsedMainImageUrl: next[0] || row.item_parsedMainImageUrl,
            }
          : row,
      )
      pendingImportQueueRef.current = mapped
      return mapped
    })
  }

  const movePendingImportImageToItem = async (
    fromItemId: string,
    fromIndex: number,
    toItemId: string,
    toIndex?: number | null,
  ) => {
    const sourceId = String(fromItemId || '').trim()
    const targetId = String(toItemId || '').trim()
    if (!sourceId || !targetId || sourceId === targetId) return
    const source =
      pendingImportQueueRef.current.find((row) => row.item_id === sourceId) ||
      pendingImportQueue.find((row) => row.item_id === sourceId)
    const target =
      pendingImportQueueRef.current.find((row) => row.item_id === targetId) ||
      pendingImportQueue.find((row) => row.item_id === targetId)
    const sourceGallery = readPendingGalleryUrls(source)
    const targetGallery = readPendingGalleryUrls(target)
    if (fromIndex < 0 || fromIndex >= sourceGallery.length) return
    const url = sourceGallery[fromIndex]
    if (!url) return

    const nextTarget = [...targetGallery]
    if (!nextTarget.includes(url)) {
      const insertAt =
        toIndex != null && Number.isInteger(toIndex)
          ? Math.max(0, Math.min(nextTarget.length, toIndex))
          : nextTarget.length
      nextTarget.splice(insertAt, 0, url)
    }
    const keepSource = sourceGallery.length <= 1
    const nextSource = keepSource ? sourceGallery : sourceGallery.filter((_, index) => index !== fromIndex)
    if (!nextSource.length) {
      toast.error('原商品至少保留一张主图')
      return
    }

    applyLocalGallery(targetId, nextTarget)
    if (!keepSource) applyLocalGallery(sourceId, nextSource)

    try {
      await persistPendingImportGallery(targetId, nextTarget, { allowShrink: true })
      if (!keepSource) {
        await persistPendingImportGallery(sourceId, nextSource, { allowShrink: true })
      }
      toast.success(keepSource ? '已复制到另一件商品（原商品仅剩一张，未移走）' : '已拖到另一件商品')
    } catch (err: any) {
      toast.error(err.message || '跨商品拖图失败')
      applyLocalGallery(targetId, targetGallery)
      applyLocalGallery(sourceId, sourceGallery)
    }
  }

  const reorderPendingImportImages = async (itemId: string, fromIndex: number, toIndex: number) => {
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex === toIndex) return
    const item =
      pendingImportQueueRef.current.find(row => row.item_id === itemId) ||
      pendingImportQueue.find(row => row.item_id === itemId)
    const current = readPendingGalleryUrls(item)
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) return
    const next = [...current]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    const previousMain = current[0]
    setPendingImportQueue(prev => prev.map(row =>
      row.item_id === itemId
        ? {
            ...row,
            item_galleryUrls: next,
            item_mainImageUrl: next[0] || row.item_mainImageUrl,
            item_parsedMainImageUrl: next[0] || row.item_parsedMainImageUrl,
          }
        : row,
    ))
    try {
      await persistPendingImportGallery(itemId, next)
      toast.success(next[0] !== previousMain ? '已设为主图并保存顺序' : '图片顺序已保存')
    } catch (err: any) {
      toast.error(err.message || '图片排序失败')
      setPendingImportQueue((prev) => prev.map((row) =>
        row.item_id === itemId
          ? {
              ...row,
              item_galleryUrls: current,
              item_mainImageUrl: current[0] || row.item_mainImageUrl,
              item_parsedMainImageUrl: current[0] || row.item_parsedMainImageUrl,
            }
          : row,
      ))
    }
  }

  const applyPendingImportSkuMutation = (
    itemId: string,
    item_skus: PendingImportSkuDraftItem[],
  ) => {
    const nextSkus = item_skus.map((sku) => sanitizePendingSkuCopyLabels(sku))
    pendingImportSkuIntentRef.current.set(itemId, {
      keys: nextSkus.map((sku) => sku.sku_key).filter(Boolean),
      at: Date.now(),
    })
    pendingImportSkuLocalRef.current.set(itemId, { skus: nextSkus, at: Date.now() })
    setPendingImportQueue((prev) => {
      const next = prev.map((item) => {
        if (item.item_id !== itemId) return item
        const totalStock = nextSkus.reduce((sum, sku) => sum + Number(sku.stock || 0), 0)
        return {
          ...item,
          item_skus: nextSkus,
          item_availableStock: totalStock,
          item_skuSummaryText: nextSkus.map((sku) => sku.spec_text).filter(Boolean).join(' | '),
        }
      })
      pendingImportQueueRef.current = next
      return next
    })
  }

  const syncPendingImportSkuImage = (itemId: string, skuKey: string, imageUrl: string | null) => {
    setPendingImportQueue(prev => prev.map(item => {
      if (item.item_id !== itemId) return item
      const item_skus = (item.item_skus || []).map(sku =>
        sku.sku_key === skuKey ? { ...sku, image_url: imageUrl } : sku
      )
      pendingImportSkuLocalRef.current.set(itemId, { skus: item_skus, at: Date.now() })
      return { ...item, item_skus }
    }))
  }

  const persistPendingImportSkuImage = async (itemId: string, skuKey: string, imageUrl: string | null) => {
    const item = pendingImportQueueRef.current.find((row) => row.item_id === itemId)
    const gallery = readPendingGalleryUrls(item)
    if (gallery.length > 1) {
      pendingImportGalleryPersistableRef.current.set(itemId, gallery)
    }
    const previous =
      item?.item_skus?.find((sku) => sku.sku_key === skuKey)?.image_url ?? null
    syncPendingImportSkuImage(itemId, skuKey, imageUrl)
    try {
      await inlineUpdatePendingImportSkuField(
        {
          item_id: itemId,
          sku_key: skuKey,
          field: 'image_url',
          value: imageUrl || '',
          skus: pendingImportQueueRef.current.find((row) => row.item_id === itemId)?.item_skus || [],
        } as any,
        { __rpcTimeoutMs: 8_000 } as any,
      )
    } catch (error: any) {
      const isTimeout = /请求超时|timed out|timeout/i.test(String(error?.message || ''))
      if (isTimeout) return
      syncPendingImportSkuImage(itemId, skuKey, previous)
      throw error
    }
  }

  const assignPendingImportGalleryImageToSku = async (itemId: string, skuKey: string, imageUrl: string) => {
    const url = String(imageUrl || '').trim()
    if (!url) return
    try {
      await persistPendingImportSkuImage(itemId, skuKey, url)
      toast.success('已设为该 SKU 代表图')
    } catch (err: any) {
      toast.error(err.message || '设置 SKU 代表图失败')
    }
  }

  const uploadPendingImportSkuImage = async (itemId: string, skuKey: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const uploadKey = `${itemId}:${skuKey}`
    bumpPendingImportSkuImageInflight(uploadKey, 1)
    try {
      const fileUrl = await enqueueSharedImageUpload(() => uploadImageToProject(file))
      await persistPendingImportSkuImage(itemId, skuKey, fileUrl)
      toast.success('SKU 图已上传')
    } catch (err: any) {
      toast.error(err.message || 'SKU 图上传失败')
    } finally {
      bumpPendingImportSkuImageInflight(uploadKey, -1)
    }
  }

  const replacePendingImportSkuImage = async (itemId: string, skuKey: string, event: ChangeEvent<HTMLInputElement>) => {
    await uploadPendingImportSkuImage(itemId, skuKey, event)
  }

  const removePendingImportSkuImage = async (itemId: string, skuKey: string) => {
    const uploadKey = `${itemId}:${skuKey}`
    bumpPendingImportSkuImageInflight(uploadKey, 1)
    try {
      await persistPendingImportSkuImage(itemId, skuKey, null)
      toast.success('SKU 图已删除')
    } catch (err: any) {
      toast.error(err.message || 'SKU 图删除失败')
    } finally {
      bumpPendingImportSkuImageInflight(uploadKey, -1)
    }
  }

  const duplicatePendingImportSkuRow = async (itemId: string, skuKey: string) => {
    const current = pendingImportQueueRef.current.find((item) => item.item_id === itemId)
    const skus = [...(current?.item_skus || [])]
    const source = skus.find((sku) => sku.sku_key === skuKey)
    if (!source) {
      toast.error('找不到该规格行')
      return
    }
    const clonedKey = `${skuKey}-copy-${Date.now()}`
    const cloned = sanitizePendingSkuCopyLabels({
      ...source,
      sku_key: clonedKey,
    })
    const sourceIndex = skus.findIndex((sku) => sku.sku_key === skuKey)
    const optimistic = [...skus]
    optimistic.splice(sourceIndex + 1, 0, cloned)
    applyPendingImportSkuMutation(itemId, optimistic)
    try {
      await inlineUpdatePendingImportSkuField(
        {
          item_id: itemId,
          sku_key: clonedKey,
          field: 'spec_text',
          value: cloned.spec_text,
          skus: optimistic,
        } as any,
        { __rpcTimeoutMs: 8_000 } as any,
      )
      toast.success('已复制规格行')
    } catch (err: any) {
      const isTimeout = /请求超时|timed out|timeout/i.test(String(err?.message || ''))
      if (isTimeout) {
        toast.message('已复制，后台正在保存')
        return
      }
      applyPendingImportSkuMutation(itemId, skus)
      toast.error(err.message || '复制规格行失败')
    }
  }

  const deletePendingImportSkuRow = async (itemId: string, skuKey: string) => {
    if (pendingImportSkuSaving) {
      toast.error('正在保存，请稍后再删除')
      return
    }
    if (!window.confirm('确认删除该规格行？')) return
    const current = pendingImportQueueRef.current.find((item) => item.item_id === itemId)
    const previous = [...(current?.item_skus || [])]
    const remaining = previous.filter((sku) => sku.sku_key !== skuKey)
    if (!remaining.length) {
      toast.error('至少保留一个规格行')
      return
    }
    applyPendingImportSkuMutation(itemId, remaining)
    setPendingImportSkuSaving(true)
    try {
      await inlineUpdatePendingImportSkuField(
        {
          item_id: itemId,
          sku_key: remaining[0].sku_key,
          field: 'spec_text',
          value: remaining[0].spec_text || '规格',
          skus: remaining,
        } as any,
        { __rpcTimeoutMs: 8_000 } as any,
      )
      toast.success('已删除规格行')
      setPendingImportSelectedSkuKeys((prev) =>
        prev.filter((key) => key !== `${itemId}::${skuKey}`),
      )
    } catch (err: any) {
      const isTimeout = /请求超时|timed out|timeout/i.test(String(err?.message || ''))
      if (isTimeout) {
        toast.message('已删除，后台正在保存')
        return
      }
      applyPendingImportSkuMutation(itemId, previous)
      toast.error(err.message || '删除规格行失败')
    } finally {
      setPendingImportSkuSaving(false)
    }
  }

  const duplicatePendingImportSkuColorRow = async (itemId: string, color: string) => {
    const current = pendingImportQueueRef.current.find((item) => item.item_id === itemId)
    const previous = [...(current?.item_skus || [])]
    const sources = previous.filter((sku) => {
      const skuColor = sku.attributes?.find((attr) => attr.name === '颜色')?.value?.trim() || '默认颜色'
      return skuColor === color
    })
    if (!sources.length) {
      toast.error('找不到该颜色行')
      return
    }
    const stamp = Date.now()
    const cloned = sources.map((sku, index) => sanitizePendingSkuCopyLabels({
      ...sku,
      sku_key: `${sku.sku_key}-copy-${stamp}-${index}`,
    }))
    const optimistic = [...previous]
    const lastIndex = previous.findIndex((sku) => sku.sku_key === sources[sources.length - 1].sku_key)
    optimistic.splice(lastIndex + 1, 0, ...cloned)
    applyPendingImportSkuMutation(itemId, optimistic)
    try {
      await inlineUpdatePendingImportSkuField(
        {
          item_id: itemId,
          sku_key: cloned[0].sku_key,
          field: 'spec_text',
          value: cloned[0].spec_text,
          skus: optimistic,
        } as any,
        { __rpcTimeoutMs: 8_000 } as any,
      )
      toast.success('已复制颜色行')
    } catch (err: any) {
      const isTimeout = /请求超时|timed out|timeout/i.test(String(err?.message || ''))
      if (isTimeout) {
        toast.message('已复制，后台正在保存')
        return
      }
      applyPendingImportSkuMutation(itemId, previous)
      toast.error(err.message || '复制颜色行失败')
    }
  }

  const deletePendingImportSkuColorRow = async (itemId: string, color: string) => {
    if (!window.confirm(`确认删除颜色「${color}」及其全部规格？`)) return
    const current = pendingImportQueueRef.current.find((item) => item.item_id === itemId)
    const previous = [...(current?.item_skus || [])]
    const remaining = previous.filter((sku) => {
      const skuColor = sku.attributes?.find((attr) => attr.name === '颜色')?.value?.trim() || '默认颜色'
      return skuColor !== color
    })
    if (!remaining.length) {
      toast.error('至少保留一个规格行')
      return
    }
    applyPendingImportSkuMutation(itemId, remaining)
    try {
      await inlineUpdatePendingImportSkuField(
        {
          item_id: itemId,
          sku_key: remaining[0].sku_key,
          field: 'spec_text',
          value: remaining[0].spec_text || '规格',
          skus: remaining,
        } as any,
        { __rpcTimeoutMs: 8_000 } as any,
      )
      toast.success('已删除颜色行')
    } catch (err: any) {
      const isTimeout = /请求超时|timed out|timeout/i.test(String(err?.message || ''))
      if (isTimeout) {
        toast.message('已删除，后台正在保存')
        return
      }
      applyPendingImportSkuMutation(itemId, previous)
      toast.error(err.message || '删除颜色行失败')
    }
  }

  const handleSelectPendingImportSkuKeys = (itemId: string, skuKeys: string[], checked: boolean) => {
    const nextKeys = Array.from(
      new Set(skuKeys.map((key) => String(key || '').trim()).filter(Boolean)),
    ).map((key) => `${itemId}::${key}`)
    if (!nextKeys.length) return
    setPendingImportSelectedSkuKeys((prev) => {
      if (checked) return Array.from(new Set([...prev, ...nextKeys]))
      const remove = new Set(nextKeys)
      return prev.filter((key) => !remove.has(key))
    })
  }

  const batchDeletePendingImportSelectedSkus = async (itemId: string) => {
    if (pendingImportSkuSaving) {
      toast.error('正在保存，请稍后再删除')
      return
    }
    const prefix = `${itemId}::`
    const selectedKeys = new Set(
      pendingImportSelectedSkuKeys
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.slice(prefix.length))
        .filter(Boolean),
    )
    if (!selectedKeys.size) {
      toast.error('请先勾选要删除的 SKU')
      return
    }
    const current = pendingImportQueueRef.current.find((item) => item.item_id === itemId)
    const previous = [...(current?.item_skus || [])]
    const remaining = previous.filter((sku) => !selectedKeys.has(String(sku.sku_key || '').trim()))
    if (!remaining.length) {
      toast.error('至少保留一个规格行')
      return
    }
    if (!window.confirm(`确认删除选中的 ${selectedKeys.size} 个 SKU？将保留 ${remaining.length} 个。`)) return
    applyPendingImportSkuMutation(itemId, remaining)
    setPendingImportSkuSaving(true)
    try {
      await inlineUpdatePendingImportSkuField(
        {
          item_id: itemId,
          sku_key: remaining[0].sku_key,
          field: 'spec_text',
          value: remaining[0].spec_text || '规格',
          skus: remaining,
        } as any,
        { __rpcTimeoutMs: 8_000 } as any,
      )
      setPendingImportSelectedSkuKeys((prev) => prev.filter((key) => !key.startsWith(prefix)))
      toast.success(`已删除 ${selectedKeys.size} 个 SKU`)
    } catch (err: any) {
      const isTimeout = /请求超时|timed out|timeout/i.test(String(err?.message || ''))
      if (isTimeout) {
        setPendingImportSelectedSkuKeys((prev) => prev.filter((key) => !key.startsWith(prefix)))
        toast.message('已删除，后台正在保存')
        return
      }
      applyPendingImportSkuMutation(itemId, previous)
      toast.error(err.message || '批量删除 SKU 失败')
    } finally {
      setPendingImportSkuSaving(false)
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
      usdExchangeRate,
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
      batchImportImageUploadingKeys,
      pendingImportImageUploadingIds,
      pendingImportSkuImageUploadingKeys,
      mainImageUploading,
      galleryUploadingIndex,
      featuredKeywords,
      featuredKeywordInput,
      featuredKeywordsSaving,
      pendingImportDialogOpen,
      pinduoduoImportDialogOpen,
      pendingImportTaskForm,
      pendingImportCreating,
      pendingImportRefreshing,
      pendingImportPublishing,
      pendingImportReparsing,
      pendingImportParseCancelling,
      pendingImportParseActive,
      pendingImportParseStatusLabel,
      pendingImportParseJob,
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
      pendingImportSelectedSkuKeys,
      pendingImportReviewSavingIds,
      pendingImportNowMs,
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
      calibrateResultOpen,
      calibrateResultSaving,
      calibrateResultScope,
      calibrateResultSummary,
      calibrateResultDrafts,
      priceThresholdClassifyRunning,
      titleFilterBackfillRunning,
      mosaicGalleryRunning,
      spanishTitleBackfillRunning,
      titleSuffixRunning,
      productStockEditingId,
      productStockEditingValue,
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
      setPageSize: handleSetPageSize,
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
      pastePendingImportImageUrls,
      replacePendingImportImage,
      removePendingImportImage,
      reorderPendingImportImages,
      movePendingImportImageToItem,
      expandPendingImportItem,
      assignPendingImportGalleryImageToSku,
      uploadPendingImportSkuImage,
      replacePendingImportSkuImage,
      removePendingImportSkuImage,
      duplicatePendingImportSkuRow,
      deletePendingImportSkuRow,
      duplicatePendingImportSkuColorRow,
      deletePendingImportSkuColorRow,
      handleSelectPendingImportSkuKeys,
      batchDeletePendingImportSelectedSkus,
      addBatchImportRow,
      removeBatchImportRow,
      handleSubmitBatchImport,
      setFeaturedKeywordInput,
      addFeaturedKeyword,
      removeFeaturedKeyword,
      saveFeaturedKeywords,
      setPendingImportDialogOpen,
      setPinduoduoImportDialogOpen,
      updatePendingImportTaskForm,
      submitPendingImportTask,
      refreshPendingImportQueue,
      setPendingImportPage: handleSetPendingImportPage,
      setPendingImportPageSize: handleSetPendingImportPageSize,
      retryPendingImportActiveTask,
      handleSelectAllPendingImport,
      handleSelectPendingImportRow,
      togglePendingImportReviewMark,
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
      cancelPendingImportParse,
      handlePendingImportParseButton,
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
      handleCalibratePendingImportItems,
      setCalibrateResultOpen,
      toggleCalibrateResultCategory,
      setCalibrateResultPrimary,
      saveCalibrateResultEdits,
      handleAutoClassifyPriceThresholdProducts,
      handleBackfillAllTitleFilterCategories,
      handleBatchMosaicGalleries,
      handleBatchTranslateTitlesToSpanish,
      handleBatchAppendTitleSuffix,
      handleBatchAppendPendingTitleSuffix,
      handleBatchRemoveTitleSuffix,
      handleBatchRemovePendingTitleSuffix,
      startProductStockEdit,
      setProductStockEditingValue,
      cancelProductStockEdit,
      submitProductStockEdit,
    }
  }
}
