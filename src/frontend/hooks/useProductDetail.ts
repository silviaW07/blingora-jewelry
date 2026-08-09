'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductDetail, Cart, CustomerLogin } from '@/frontend/route-params'
import { useUserSession } from '@/tools/FrontendSession'
import { toast } from "sonner"
import type {
  ProductDetailData,
  RelatedProductItem,
  ProductSkuData,
  GalleryItem
} from '@/frontend/actions/ProductDetail'
import {
  getProductDetail,
  getDecoratePreviewProduct,
  getRelatedProducts,
  addToCart,
} from '@/frontend/actions/ProductDetail'
import { sortSizeLabels } from '@/utils/sortSizeLabels'

/**
 * 数字感知的自然排序：让「颜色1、颜色2 … 颜色10」按数值升序而非字符串序，
 * 同时对普通名称给出稳定的确定性顺序（替代 uuid 主键返回的随机序）。
 */
const naturalCompareLabels = (a: string, b: string): number =>
  String(a ?? '').localeCompare(String(b ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })

const isColorAttributeName = (name?: string | null) => {
  const normalized = String(name || '').trim().toLowerCase()
  return normalized === '颜色' || normalized === 'color' || normalized === 'colour'
}

const isSizeAttributeName = (name?: string | null) => {
  const normalized = String(name || '').trim().toLowerCase()
  return (
    normalized === '尺码' ||
    normalized === '鞋码' ||
    normalized === '尺寸' ||
    normalized === '码数' ||
    normalized === '规格' ||
    normalized === 'size' ||
    normalized === 'spec' ||
    normalized === 'sizing'
  )
}

export interface SelectionHighlight {
  color: boolean
  size: boolean
}

export interface ProductDetailState {
  loading: boolean;
  error: string | null;
  product: ProductDetailData | null;
  relatedProducts: RelatedProductItem[];
  selectedAttributes: Record<string, string>;
  selectedSku: ProductSkuData | null;
  quantity: number;
  /** 每个 SKU 的加购数量（B2B 列表模式） */
  skuQuantities: Record<string, number>;
  activeImage: string;
  submitting: boolean;
  availableAttributes: { name: string; values: string[] }[];
  sortedGallery: GalleryItem[];
  isPurchasable: boolean;
  isSkuValid: boolean;
  isStockAvailable: boolean;
  totalSelectedQty: number;
  session: ReturnType<typeof useUserSession>;
  colorAttribute: { name: string; values: string[] } | null;
  sizeAttribute: { name: string; values: string[] } | null;
  requiresColorAndSize: boolean;
  manualColorValue: string | null;
  manualSizeSkuId: string | null;
  canAddToCart: boolean;
  isColorSelected: boolean;
  isSizeSelected: boolean;
  selectionHighlight: SelectionHighlight;
}

export interface ProductDetailHandlers {
  handleColorSelect: (value: string, imageUrl?: string | null) => void;
  handleSizeSelect: (sku: ProductSkuData) => void;
  handleQuantityChange: (type: 'inc' | 'dec') => void;
  handleSkuQuantityChange: (skuId: string, type: 'inc' | 'dec' | 'set', value?: number) => void | Promise<void>;
  handleAddToCart: () => Promise<void>;
  handleRelatedClick: (id: string) => void;
  setActiveImage: (url: string) => void;
}

export const useProductDetail = (): {
  state: ProductDetailState;
  handlers: ProductDetailHandlers;
} => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { productId, slug } = useMemo(() => ProductDetail.getParams(searchParams), [searchParams])
  const isDecorateMode = searchParams.get('decorate') === '1'
  const session = useUserSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<ProductDetailData | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductItem[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [selectedSku, setSelectedSku] = useState<ProductSkuData | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [skuQuantities, setSkuQuantities] = useState<Record<string, number>>({})
  const [activeImage, setActiveImage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [manualColorValue, setManualColorValue] = useState<string | null>(null)
  const [manualSizeSkuId, setManualSizeSkuId] = useState<string | null>(null)
  const [selectionHighlight, setSelectionHighlight] = useState<SelectionHighlight>({
    color: false,
    size: false,
  })
  const highlightTimerRef = useRef<number | null>(null)
  const skuQuantitiesRef = useRef<Record<string, number>>({})

  const triggerSelectionHighlight = useCallback((next: SelectionHighlight) => {
    setSelectionHighlight(next)
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setSelectionHighlight({ color: false, size: false })
      highlightTimerRef.current = null
    }, 600)
  }, [])

  const fetchProduct = useCallback(async () => {
    if (!productId?.trim() && !slug?.trim()) {
      if (isDecorateMode) {
        try {
          setLoading(true)
          setError(null)
          const preview = await getDecoratePreviewProduct()

          if (preview?.productId) {
            const nextParams = new URLSearchParams(searchParams.toString())
            nextParams.set('decorate', '1')
            nextParams.set('productId', preview.productId)
            nextParams.delete('slug')
            router.replace(`${ProductDetail.path}?${nextParams.toString()}`)
            return
          }

          setProduct(null)
          setError('No product available for visual editing. Publish or save a draft product first.')
        } catch (err: any) {
          setProduct(null)
          setError(err?.message || 'Failed to initialize product editor')
        } finally {
          setLoading(false)
        }
        return
      }

      setLoading(false)
      setProduct(null)
      setError('Missing product id. Open this page from home or the product list.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const lang =
        typeof window !== 'undefined'
          ? (await import('@/frontend/i18n')).getClientPreferredLang()
          : 'en'
      const data = await getProductDetail({ productId, slug, lang })
      setProduct(data.product)
      setActiveImage(data.product.mainImageUrl)
      // Unblock first paint — related products must not hold the full-page spinner
      setLoading(false)

      void getRelatedProducts({
        categoryId: data.product.categoryId,
        excludeProductId: data.product.id,
        lang,
      })
        .then((relatedData) => setRelatedProducts(relatedData.list))
        .catch((relatedErr) => {
          console.warn('[useProductDetail] related products failed', relatedErr)
          setRelatedProducts([])
        })
    } catch (err: any) {
      setError(err.message || 'Failed to load product')
      setLoading(false)
    }
  }, [isDecorateMode, productId, router, searchParams, slug])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'app_preferred_locale') {
        void fetchProduct()
      }
    }
    const onLocaleChanged = () => {
      void fetchProduct()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('app-locale-changed', onLocaleChanged as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('app-locale-changed', onLocaleChanged as EventListener)
    }
  }, [fetchProduct])
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.location.hash) {
      const cleanUrl = `${window.location.pathname}${window.location.search}`
      window.history.replaceState(null, '', cleanUrl)
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [productId, slug])

  useEffect(() => {
    if (loading || typeof window === 'undefined') return

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [loading, productId, slug])

  useEffect(() => {
    if (!product) return

    setSelectedSku(null)
    setSelectedAttributes({})
    setManualColorValue(null)
    setManualSizeSkuId(null)
    setQuantity(1)
    setSelectionHighlight({ color: false, size: false })

    const qtyMap: Record<string, number> = {}
    product.skus.forEach((sku) => {
      qtyMap[sku.id] = 0
    })
    skuQuantitiesRef.current = qtyMap
    setSkuQuantities(qtyMap)
    setActiveImage(product.mainImageUrl)
  }, [product])

  const availableAttributes = useMemo(() => {
    if (!product) return []
    const attrMap = new Map<string, Set<string>>()
    product.skus?.forEach(sku => {
      sku.attributeJson?.forEach(attr => {
        if (attr.name && attr.value) {
          if (!attrMap.has(attr.name)) {
            attrMap.set(attr.name, new Set())
          }
          attrMap.get(attr.name)!.add(attr.value)
        }
      })
    })

    return Array.from(attrMap.entries()).map(([name, values]) => {
      const list = Array.from(values)
      return {
        name,
        // 尺码维用尺码专用排序；颜色及其它维用数字感知自然排序，保证「颜色1…颜色10」有序展示
        values: isSizeAttributeName(name) && !isColorAttributeName(name)
          ? sortSizeLabels(list)
          : [...list].sort(naturalCompareLabels),
      }
    })
  }, [product])

  const colorAttribute = useMemo(
    () => availableAttributes.find((group) => isColorAttributeName(group.name)) || null,
    [availableAttributes],
  )

  const sizeAttribute = useMemo(() => {
    const named = availableAttributes.find(
      (group) => isSizeAttributeName(group.name) && !isColorAttributeName(group.name),
    )
    if (named) return named
    // 回退：第一个非颜色规格维，避免尺码行无法建立 selectedSize
    return availableAttributes.find((group) => !isColorAttributeName(group.name)) || null
  }, [availableAttributes])

  const requiresColorAndSize = Boolean(colorAttribute && sizeAttribute)

  const sortedGallery = useMemo(() => {
    if (!product) return []
    const mainImg: GalleryItem = { url: product.mainImageUrl, sort: -1 }
    const seen = new Set<string>([product.mainImageUrl])
    const extraImgs = (product.galleryJson || [])
      .filter(item => item.url && !seen.has(item.url))
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    for (const sku of product.skus || []) {
      if (sku.imageUrl && !seen.has(sku.imageUrl)) {
        seen.add(sku.imageUrl)
        extraImgs.push({ url: sku.imageUrl, sort: 999 })
      }
    }
    return [mainImg, ...extraImgs]
  }, [product])

  const isPurchasable = product?.status === 'ACTIVE'
  const isSkuValid = !!selectedSku
  const isStockAvailable = !!(
    selectedSku &&
    selectedSku.stockStatus !== 'OUT_OF_STOCK'
  )
  /** Soft qty cap for storefront — never expose admin numeric stock. */
  const STOREFRONT_QTY_CAP = 9999
  const skuQtyCap = (sku: { stockStatus: string } | null | undefined) =>
    sku && sku.stockStatus !== 'OUT_OF_STOCK' ? STOREFRONT_QTY_CAP : 0
  const totalSelectedQty = useMemo(
    () => Object.values(skuQuantities).reduce((sum, qty) => sum + (qty || 0), 0),
    [skuQuantities],
  )

  const isColorSelected =
    !colorAttribute || Boolean(String(manualColorValue || '').trim())
  /** 尺码通过加减号选中：有数量即视为已选规格 */
  const isSizeSelected = !sizeAttribute || totalSelectedQty > 0 || Boolean(manualSizeSkuId)

  /** 颜色已选，且至少有一个规格数量 > 0 */
  const canAddToCart = useMemo(
    () => isPurchasable && isColorSelected && totalSelectedQty > 0,
    [isPurchasable, isColorSelected, totalSelectedQty],
  )

  const redirectToLogin = useCallback(() => {
    toast.info('Please sign in to add to cart')
    let returnPath = ProductDetail.path
    if (productId) returnPath += `?productId=${productId}`
    else if (slug) returnPath += `?slug=${slug}`
    CustomerLogin.navigateToWithReturn(router, { returnTo: returnPath })
  }, [productId, slug, router])

  const resolveSkuForColorAndSize = useCallback(
    (sourceSku: ProductSkuData, colorValue: string) => {
      if (!product || !colorAttribute) return sourceSku

      const sizeName = sizeAttribute?.name
      const sizeValue = sizeName
        ? sourceSku.attributeJson?.find((attr) => attr.name === sizeName)?.value
        : null

      const sourceColor = sourceSku.attributeJson?.find(
        (attr) => attr.name === colorAttribute.name,
      )?.value

      // 点击行已是当前颜色：直接用该行 SKU，禁止回落到同色第一个
      if (sourceColor === colorValue) {
        return sourceSku
      }

      const matched = product.skus.find((candidate) => {
        const candidateColor = candidate.attributeJson?.find(
          (attr) => attr.name === colorAttribute.name,
        )?.value
        if (candidateColor !== colorValue) return false
        if (!sizeName || !sizeValue) return false
        const candidateSize = candidate.attributeJson?.find((attr) => attr.name === sizeName)?.value
        return candidateSize === sizeValue
      })

      return matched || sourceSku
    },
    [product, colorAttribute, sizeAttribute],
  )

  const applySizeSelection = useCallback(
    (sku: ProductSkuData, colorValue?: string | null) => {
      setManualSizeSkuId(sku.id)
      setSelectedSku(sku)

      const attrs: Record<string, string> = {}
      sku.attributeJson?.forEach((attr) => {
        if (attr.name && attr.value) attrs[attr.name] = attr.value
      })
      if (colorValue && colorAttribute) {
        attrs[colorAttribute.name] = colorValue
      }
      setSelectedAttributes(attrs)
      setQuantity(1)
      // 选中尺码后默认数量为 1（仅本地，不直接加购）
      const nextQty = Math.max(1, skuQuantitiesRef.current[sku.id] || 0)
      const capped = Math.min(skuQtyCap(sku), nextQty) || 1
      skuQuantitiesRef.current = { [sku.id]: capped }
      setSkuQuantities({ [sku.id]: capped })
      setSelectionHighlight({ color: false, size: false })
    },
    [colorAttribute],
  )

  const handleColorSelect = (value: string, imageUrl?: string | null) => {
    if (product?.status !== 'ACTIVE' || !colorAttribute) return

    setManualColorValue(value)
    setManualSizeSkuId(null)
    setSelectedSku(null)
    setSelectedAttributes({ [colorAttribute.name]: value })
    setQuantity(1)
    setSkuQuantities({})
    skuQuantitiesRef.current = {}
    setSelectionHighlight({ color: false, size: false })

    const matchedSkus = product.skus.filter((sku) =>
      sku.attributeJson?.some((attr) => attr.name === colorAttribute.name && attr.value === value),
    )
    const primary =
      matchedSkus.find((sku) => Boolean(sku.imageUrl)) || matchedSkus[0] || null
    const colorImage = imageUrl || primary?.imageUrl || null
    if (colorImage) {
      setActiveImage(colorImage)
    }

    // 无尺码规格时：选中颜色即锁定对应 SKU
    if (!sizeAttribute && primary) {
      applySizeSelection(primary, value)
    }
  }

  const handleSizeSelect = (sku: ProductSkuData) => {
    if (product?.status !== 'ACTIVE') return

    if (colorAttribute && !String(manualColorValue || '').trim()) {
      toast.error('Please select a color')
      triggerSelectionHighlight({ color: true, size: false })
      return
    }

    // 颜色已选：优先使用点击行本身的 SKU（列表已按颜色过滤）
    if (manualColorValue && colorAttribute) {
      const skuColor = sku.attributeJson?.find((attr) => attr.name === colorAttribute.name)?.value
      const targetSku =
        skuColor === manualColorValue ? sku : resolveSkuForColorAndSize(sku, manualColorValue)
      applySizeSelection(targetSku, manualColorValue)
      if (targetSku.imageUrl) setActiveImage(targetSku.imageUrl)
      return
    }

    applySizeSelection(sku, manualColorValue)
  }

  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (!selectedSku) return
    const cap = skuQtyCap(selectedSku)
    if (type === 'inc') {
      if (quantity < cap) setQuantity(prev => prev + 1)
      else toast.warning('Maximum quantity reached')
    } else {
      if (quantity > 1) setQuantity(prev => prev - 1)
    }
  }

  const resolveRowSku = useCallback(
    (sku: ProductSkuData) => {
      if (manualColorValue && colorAttribute) {
        const matched = resolveSkuForColorAndSize(sku, manualColorValue)
        return { sku: matched, colorValue: manualColorValue }
      }
      return { sku, colorValue: manualColorValue }
    },
    [colorAttribute, manualColorValue, resolveSkuForColorAndSize],
  )

  const handleSkuQuantityChange = async (skuId: string, type: 'inc' | 'dec' | 'set', value?: number) => {
    if (!product || product.status !== 'ACTIVE') return
    const sourceSku = product.skus.find((item) => item.id === skuId)
    if (!sourceSku) return

    // 有颜色规格时必须先选颜色
    if (colorAttribute && !String(manualColorValue || '').trim()) {
      toast.error('Please select a color')
      triggerSelectionHighlight({ color: true, size: false })
      return
    }

    const resolved = resolveRowSku(sourceSku)
    const sku = resolved.sku
    const current = skuQuantitiesRef.current[sku.id] ?? skuQuantities[sku.id] ?? 0

    let next = current
    const cap = skuQtyCap(sku)
    if (type === 'inc') next = Math.min(cap, current + 1)
    else if (type === 'dec') next = Math.max(0, current - 1)
    else next = Math.max(0, Math.min(cap, Number(value) || 0))

    // 数量为 0 时点 - 保持 0；点 + 从 0→1 即选中该尺码
    if (next === current) {
      if (type === 'inc' && current >= cap) toast.warning('Maximum quantity reached')
      return
    }

    // 加减号即选中：点 + 选中该尺码；点 - 减到 0 时取消该行
    if (next > 0) {
      const prevQtys = { ...skuQuantitiesRef.current }
      applySizeSelection(sku, resolved.colorValue)
      // applySizeSelection 会重置数量表，合并回其他规格的数量
      const merged = { ...prevQtys, [sku.id]: next }
      skuQuantitiesRef.current = merged
      setSkuQuantities(merged)
      setQuantity(next)
    } else {
      skuQuantitiesRef.current = { ...skuQuantitiesRef.current, [sku.id]: 0 }
      setSkuQuantities((prev) => ({ ...prev, [sku.id]: 0 }))
      if (manualSizeSkuId === sku.id || selectedSku?.id === sku.id) {
        const remaining = Object.entries(skuQuantitiesRef.current).find(
          ([id, qty]) => id !== sku.id && qty > 0,
        )
        if (remaining) {
          const remainSku = product.skus.find((item) => item.id === remaining[0])
          if (remainSku) {
            const prevQtys = { ...skuQuantitiesRef.current }
            applySizeSelection(remainSku, resolved.colorValue)
            skuQuantitiesRef.current = prevQtys
            setSkuQuantities(prevQtys)
          }
        } else {
          setManualSizeSkuId(null)
          setSelectedSku(null)
          setQuantity(1)
        }
      }
    }
  }

  const handleAddToCart = async () => {
    if (!isPurchasable || submitting) return

    if (!session.token) {
      redirectToLogin()
      return
    }

    if (colorAttribute && !String(manualColorValue || '').trim()) {
      toast.error('Please select a color')
      triggerSelectionHighlight({ color: true, size: false })
      return
    }

    if (sizeAttribute && totalSelectedQty <= 0 && !manualSizeSkuId) {
      toast.error('Please set size quantities first')
      triggerSelectionHighlight({ color: false, size: true })
      return
    }

    if (!canAddToCart) {
      return
    }

    let lines = Object.entries(skuQuantitiesRef.current).filter(([, qty]) => qty > 0)

    // 已选中颜色+尺码但数量为 0 时，默认加购 1 件
    if (lines.length === 0 && selectedSku) {
      const qty = skuQtyCap(selectedSku) > 0 ? 1 : 0
      if (qty <= 0) {
        toast.error('This option is out of stock')
        return
      }
      lines = [[selectedSku.id, qty]]
      skuQuantitiesRef.current = { [selectedSku.id]: qty }
      setSkuQuantities({ [selectedSku.id]: qty })
    }

    if (lines.length === 0) {
      toast.error('Please select a size')
      if (sizeAttribute) {
        triggerSelectionHighlight({ color: false, size: true })
      }
      return
    }

    try {
      setSubmitting(true)
      for (const [skuId, qty] of lines) {
        await addToCart({ productSkuId: skuId, quantity: qty })
      }
      toast.success('Added to cart')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add to cart')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRelatedClick = (id: string) => {
    ProductDetail.navigateToById(router, { productId: id })
  }

  return {
    state: {
      loading,
      error,
      product,
      relatedProducts,
      selectedAttributes,
      selectedSku,
      quantity,
      skuQuantities,
      activeImage,
      submitting,
      availableAttributes,
      sortedGallery,
      isPurchasable,
      isSkuValid,
      isStockAvailable,
      totalSelectedQty,
      session,
      colorAttribute,
      sizeAttribute,
      requiresColorAndSize,
      manualColorValue,
      manualSizeSkuId,
      canAddToCart,
      isColorSelected,
      isSizeSelected,
      selectionHighlight,
    },
    handlers: {
      handleColorSelect,
      handleSizeSelect,
      handleQuantityChange,
      handleSkuQuantityChange,
      handleAddToCart,
      handleRelatedClick,
      setActiveImage,
    }
  }
}
