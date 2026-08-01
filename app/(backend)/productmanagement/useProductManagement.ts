'use client'
import { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductManagement } from '@/backend/route-params'
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
  batchUpdateProductCategory,
  batchUpdateManagementStatus,
  batchUpdateProductWeightPrice
} from '@/backend/actions/ProductManagement'
import type {
  ProductStatus,
  ProductListItem,
  CategoryOption,
  CreateProductInput as BaseCreateProductInput,
  SkuItem,
  TradeInfo,
  GoodsStatus as ActionGoodsStatus,
  ProductDetail
} from '@/backend/actions/ProductManagement'
import { toast } from 'sonner'
import { upload_project_file } from '@/tools/tools'

export type DrawerMode = 'create' | 'edit'
export type BatchActionType = 'ACTIVE' | 'INACTIVE' | 'DELETE' | 'PRICE_COEFFICIENT' | 'CATEGORY' | 'MANAGEMENT_STATUS' | 'WEIGHT_PRICE' | null
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
  name: string
  weight_gram: string
  cost_price: string
  main_image_url: string
  detail_text: string
  category_name: string
  supplier_name: string
  brand_keyword: string
  price_coefficient: string
}

type ProductSkuFormItem = SkuItem & {
  usd_display_price?: number | null
  usd_display_original_price?: number | null
}

type GoodsStatus = ActionGoodsStatus
type ProductListStatusFilter = 'ACTIVE' | 'INACTIVE' | 'DELETED'
type ProductInlineField = 'product_name' | 'weight_gram'
type BatchAdjustTargetField = 'price_coefficient' | 'weight_gram'
type ProductListFilterStatus = ProductListStatusFilter | 'ALL'

type ProductFormData = Omit<BaseCreateProductInput, 'skus'> & {
  skus: ProductSkuFormItem[]
  supplier_name?: string | null
  brand_keyword?: string | null
  cost_price?: number | null
  effective_price_coefficient?: number | null
  main_category_id?: string
  main_category_name?: string
  main_category_price_coefficient?: number | null
}

type BatchImportDraftPayload = NonNullable<Parameters<typeof batchImportProducts>[0]>['rows'][number]

const USD_EXCHANGE_RATE = 6.5

const toCurrency = (value?: number | null) => (value === null || value === undefined || Number.isNaN(value) ? '--' : Number(value).toFixed(2))
const toUsdPreview = (value?: number | null) => (value === null || value === undefined || Number.isNaN(value) ? null : Number((value / USD_EXCHANGE_RATE).toFixed(2)))

const defaultImportRow = (): BatchImportRowInput => ({
  name: '',
  weight_gram: '',
  cost_price: '',
  main_image_url: '',
  detail_text: '',
  category_name: '',
  supplier_name: '',
  brand_keyword: '',
  price_coefficient: '1'
})

const defaultFormData: ProductFormData = {
  name: '',
  category_id: '',
  supplier_name: '',
  brand_keyword: '',
  goods_status: 'IN_STOCK',
  weight_gram: null,
  cost_price: null,
  price_coefficient: 1,
  effective_price_coefficient: 1,
  main_category_id: '',
  main_category_name: '',
  main_category_price_coefficient: null,
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
  inlineEditingCell: { productId: string; field: ProductInlineField } | null
  inlineEditingValue: string
  inlineSaving: boolean
  batchImportOpen: boolean
  batchImportText: string
  batchImportRows: BatchImportRowInput[]
  batchImportSubmitting: boolean
  batchImportFileName: string
  batchImportParsing: boolean
  mainImageUploading: boolean
  galleryUploadingIndex: number | null
  featuredKeywords: string[]
  featuredKeywordInput: string
  featuredKeywordsSaving: boolean
}

export interface ProductManagementHandlers {
  setFilterKeyword: (val: string) => void
  setFilterCategoryId: (val: string) => void
  setFilterStatus: (val: string) => void
  setFilterGoodsStatus: (val: 'ALL' | GoodsStatus) => void
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
  startInlineEdit: (productId: string, field: ProductInlineField, value: string | number | null) => void
  changeInlineEditingValue: (value: string) => void
  cancelInlineEdit: () => void
  submitInlineEdit: () => Promise<void>
  handleApplyCategoryCoefficientToForm: () => void
  handleConfirmAction: () => Promise<void>
  setConfirmDialogOpen: (open: boolean) => void
  setBatchImportOpen: (open: boolean) => void
  setBatchImportText: (val: string) => void
  handleParseBatchImport: () => void
  handleUploadBatchImportFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  updateBatchImportRow: (index: number, field: keyof BatchImportRowInput, value: string) => void
  addBatchImportRow: () => void
  removeBatchImportRow: (index: number) => void
  handleSubmitBatchImport: () => Promise<void>
  setFeaturedKeywordInput: (value: string) => void
  addFeaturedKeyword: () => void
  removeFeaturedKeyword: (keyword: string) => void
  saveFeaturedKeywords: () => Promise<void>
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
  return lines.map(line => {
    const cols = line.split(/\t|,|\|/).map(item => item.trim())
    return {
      name: cols[0] || '',
      weight_gram: cols[1] || '',
      cost_price: cols[2] || '',
      main_image_url: cols[3] || '',
      detail_text: cols[4] || '',
      category_name: cols[5] || '',
      supplier_name: cols[6] || '',
      brand_keyword: cols[7] || '',
      price_coefficient: cols[8] || '1'
    }
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

  const firstRow = normalizedRows[0].map(cell => cell.toLowerCase())
  const hasHeader = firstRow.some(cell => ['名称', '产品名称', '商品名称', '重量', '成本价', '供应商', '品牌', 'price_coefficient'].includes(cell))
  const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows

  if (dataRows.length === 0) return [defaultImportRow()]

  return dataRows.map(cols => ({
    name: cols[0] || '',
    weight_gram: cols[1] || '',
    cost_price: cols[2] || '',
    main_image_url: cols[3] || '',
    detail_text: cols[4] || '',
    category_name: cols[5] || '',
    supplier_name: cols[6] || '',
    brand_keyword: cols[7] || '',
    price_coefficient: cols[8] || '1'
  }))
}

export const useProductManagement = (): { state: ProductManagementState, handlers: ProductManagementHandlers } => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useMemo(() => ProductManagement.getParams(searchParams), [searchParams])

  const [filterKeyword, setFilterKeyword] = useState(params.name || '')
  const [filterCategoryId, setFilterCategoryId] = useState(params.categoryId || 'ALL')
  const [filterStatus, setFilterStatus] = useState(params.status || 'ALL')
  const [filterGoodsStatus, setFilterGoodsStatus] = useState<'ALL' | GoodsStatus>('ALL')
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
  const [inlineEditingCell, setInlineEditingCell] = useState<{ productId: string; field: ProductInlineField } | null>(null)
  const [inlineEditingValue, setInlineEditingValue] = useState('')
  const [inlineSaving, setInlineSaving] = useState(false)
  const [batchImportOpen, setBatchImportOpen] = useState(false)
  const [batchImportText, setBatchImportText] = useState('')
  const [batchImportRows, setBatchImportRows] = useState<BatchImportRowInput[]>([defaultImportRow()])
  const [batchImportSubmitting, setBatchImportSubmitting] = useState(false)
  const [batchImportFileName, setBatchImportFileName] = useState('')
  const [batchImportParsing, setBatchImportParsing] = useState(false)
  const [mainImageUploading, setMainImageUploading] = useState(false)
  const [galleryUploadingIndex, setGalleryUploadingIndex] = useState<number | null>(null)
  const [featuredKeywords, setFeaturedKeywords] = useState<string[]>([])
  const [featuredKeywordInput, setFeaturedKeywordInput] = useState('')
  const [featuredKeywordsSaving, setFeaturedKeywordsSaving] = useState(false)

  const categoryMap = useMemo(() => new Map<string, CategoryTreeOption>(categoryOptions.map(item => [item.category_id, item])), [categoryOptions])

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

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getProductList({
        keyword: params.name || undefined,
        category_id: params.categoryId || undefined,
        status_filter: filterManagementStatus,
        goods_status: filterGoodsStatus === 'ALL' ? undefined : (filterGoodsStatus as GoodsStatus),
        supplier_name: filterSupplierName.trim() || undefined,
        brand_keyword: filterBrandKeyword.trim() || undefined,
        page: currentPage,
        page_size: pageSize
      })
      setList(result.list)
      setTotal(result.total)
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || '获取商品列表失败')
    } finally {
      setLoading(false)
    }
  }, [params.name, params.categoryId, filterManagementStatus, filterGoodsStatus, filterSupplierName, filterBrandKeyword, currentPage])
  useEffect(() => {
    fetchCategoryOptions()
    fetchHomeFeaturedKeywords()
  }, [fetchHomeFeaturedKeywords])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleSearch = () => {
    setCurrentPage(1)
    ProductManagement.navigateToWithFilters(router, {
      name: filterKeyword,
      categoryId: filterCategoryId === 'ALL' ? '' : filterCategoryId,
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
        goods_status: detail.goods_status || 'ACTIVE',
        weight_gram: detail.weight_gram,
        cost_price: detail.cost_price,
        price_coefficient: detail.price_coefficient ?? detail.effective_price_coefficient ?? 1,
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

  const uploadImageToProject = async (file: File) => {
    const uploadResult = await upload_project_file(file)
    return uploadResult.file_url
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
          stock: prev.goods_status !== 'IN_STOCK' ? 0 : (prev.skus[0]?.stock || 1),
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
        stock: formData.goods_status !== 'IN_STOCK' ? 0 : 1,
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

  const validateSubmit = (action: 'DRAFT' | 'IN_STOCK' | 'INACTIVE') => {
    if (action !== 'IN_STOCK') return true
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
        goods_status: formData.goods_status ?? 'IN_STOCK',
        gallery_json: gallery,
        detail_content_json: detailContent,
        skus: (formData.skus.length > 0 ? formData.skus : [{
          sku_code: '',
          price: 0,
          stock: formData.goods_status !== 'IN_STOCK' ? 0 : 1,
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
      setBatchCategoryId(firstSelected?.categoryId || 'ALL')
    }
    if (action === 'MANAGEMENT_STATUS') {
      setBatchManagementStatus((firstSelected?.goods_status as ProductListStatusFilter) || 'ACTIVE')
    }
    if (action === 'WEIGHT_PRICE') {
      setBatchWeightPriceMode('price_coefficient')
      setBatchWeightPriceValue(firstSelected?.price_coefficient ? String(firstSelected.price_coefficient) : '')
    }
    setConfirmDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    setConfirmLoading(true)
    try {
      if (confirmAction === 'ACTIVE' || confirmAction === 'INACTIVE') {
        const res = await batchUpdateProductStatus(confirmTargetIds, confirmAction)
        toast.success(`批量操作完成，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'DELETE') {
        const res = await batchDeleteProduct(confirmTargetIds)
        toast.success(`批量删除完成，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'PRICE_COEFFICIENT') {
        const payload = batchPriceAdjustMode === 'PRODUCT_COEFFICIENT'
          ? {
              product_ids: confirmTargetIds,
              price_coefficient: Number(batchPriceCoefficientValue),
              adjust_mode: batchPriceAdjustMode
            }
          : {
              product_ids: confirmTargetIds,
              adjust_mode: batchPriceAdjustMode
            }
        const res = await batchUpdatePriceCoefficient(payload as any)
        toast.success(batchPriceAdjustMode === 'PRODUCT_COEFFICIENT'
          ? `商品系数已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`
          : `已按主类目系数重算售价，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'CATEGORY') {
        if (!batchCategoryId || batchCategoryId === 'ALL') throw new Error('请选择目标分类')
        const res = await batchUpdateProductCategory({ product_ids: confirmTargetIds, category_id: batchCategoryId })
        toast.success(`分类已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'MANAGEMENT_STATUS') {
        const res = await batchUpdateManagementStatus({ product_ids: confirmTargetIds, target_status: batchManagementStatus })
        toast.success(`状态已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
      } else if (confirmAction === 'WEIGHT_PRICE') {
        const res = await batchUpdateProductWeightPrice({
          product_ids: confirmTargetIds,
          field: batchWeightPriceMode,
          value: Number(batchWeightPriceValue)
        })
        toast.success(batchWeightPriceMode === 'weight_gram'
          ? `重量已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`
          : `价格系数已批量更新，成功: ${res.success_count}，失败: ${res.fail_count}`)
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

  const submitInlineEdit = async () => {
    if (!inlineEditingCell || inlineSaving) return
    const currentItem = list.find(item => item.product_id === inlineEditingCell.productId)
    const nextRawValue = inlineEditingValue.trim()
    const originalValue = inlineEditingCell.field === 'product_name'
      ? (currentItem?.product_name || '')
      : String(currentItem?.weight_gram ?? '')

    if (nextRawValue === String(originalValue).trim()) {
      cancelInlineEdit()
      return
    }

    setInlineSaving(true)
    try {
      await inlineUpdateProductField({
        product_id: inlineEditingCell.productId,
        field: inlineEditingCell.field,
        value: inlineEditingCell.field === 'weight_gram' ? Number(nextRawValue) : nextRawValue
      })
      toast.success(inlineEditingCell.field === 'product_name' ? '商品名称已更新' : '商品重量已更新')
      cancelInlineEdit()
      await fetchList()
    } catch (err: any) {
      toast.error(err.message || '保存失败')
    } finally {
      setInlineSaving(false)
    }
  }

  const handleParseBatchImport = () => {
    const rows = normalizeRows(batchImportText)
    setBatchImportRows(rows)
    toast.success(`已解析 ${rows.length} 行商品草稿`)
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
      toast.success(`已从文件解析 ${normalized.length} 行商品草稿`)
    } catch (err: any) {
      toast.error(err.message || '文件解析失败，请检查文件内容')
    } finally {
      setBatchImportParsing(false)
    }
  }

  const updateBatchImportRow = (index: number, field: keyof BatchImportRowInput, value: string) => {
    setBatchImportRows(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value } as BatchImportRowInput
      return next
    })
  }

  const addBatchImportRow = () => setBatchImportRows(prev => [...prev, defaultImportRow()])
  const removeBatchImportRow = (index: number) => setBatchImportRows(prev => prev.filter((_, i) => i !== index))

  const handleSubmitBatchImport = async () => {
    if (!formData.category_id) {
      toast.error('请先在右侧表单中选择默认分类，或先新增商品填写分类后再导入')
      return
    }
    const validRows = batchImportRows.filter(row => row.name.trim() && Number(row.weight_gram) > 0 && Number(row.cost_price) >= 0)
    if (validRows.length === 0) {
      toast.error('请至少填写一行有效商品数据')
      return
    }
    setBatchImportSubmitting(true)
    try {
      const rows: BatchImportDraftPayload[] = validRows.map(row => ({
        name: row.name.trim(),
        weight_gram: row.weight_gram ? Number(row.weight_gram) : null,
        cost_price: row.cost_price ? Number(row.cost_price) : null,
        main_image_url: row.main_image_url.trim(),
        detail_text: row.detail_text.trim(),
        category_name: row.category_name.trim(),
        supplier_name: row.supplier_name.trim(),
        brand_keyword: row.brand_keyword.trim(),
        price_coefficient: row.price_coefficient ? Number(row.price_coefficient) : 1,
        gallery_urls: row.main_image_url.trim() ? [row.main_image_url.trim()] : []
      }))
      const res = await batchImportProducts({ category_id: formData.category_id, rows })
      toast.success(`批量导入完成，成功: ${res.success_count}，失败: ${res.fail_count}`)
      setBatchImportOpen(false)
      setBatchImportRows([defaultImportRow()])
      setBatchImportText('')
      setBatchImportFileName('')
      fetchList()
    } catch (err: any) {
      toast.error(err.message || '批量导入失败')
    } finally {
      setBatchImportSubmitting(false)
    }
  }

  return {
    state: {
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
      inlineEditingCell,
      inlineEditingValue,
      inlineSaving,
      batchImportOpen,
      batchImportText,
      batchImportRows,
      batchImportSubmitting,
      batchImportFileName,
      batchImportParsing,
      mainImageUploading,
      galleryUploadingIndex,
      featuredKeywords,
      featuredKeywordInput,
      featuredKeywordsSaving
    },
    handlers: {
      setFilterKeyword,
      setFilterCategoryId,
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
      startInlineEdit,
      changeInlineEditingValue,
      cancelInlineEdit,
      submitInlineEdit,
      handleApplyCategoryCoefficientToForm,
      handleConfirmAction,
      setConfirmDialogOpen,
      setBatchImportOpen,
      setBatchImportText,
      handleParseBatchImport,
      handleUploadBatchImportFile,
      updateBatchImportRow,
      addBatchImportRow,
      removeBatchImportRow,
      handleSubmitBatchImport,
      setFeaturedKeywordInput,
      addFeaturedKeyword,
      removeFeaturedKeyword,
      saveFeaturedKeywords
    }
  }
}
