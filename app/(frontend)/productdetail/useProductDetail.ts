'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
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
  getRelatedProducts,
  addToCart,
} from '@/frontend/actions/ProductDetail'

export interface ProductDetailState {
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 商品详情数据 */
  product: ProductDetailData | null;
  /** 相关商品列表 */
  relatedProducts: RelatedProductItem[];
  /** 当前选中的规格属性 */
  selectedAttributes: Record<string, string>;
  /** 当前匹配的 SKU */
  selectedSku: ProductSkuData | null;
  /** 购买数量 */
  quantity: number;
  /** 当前展示的主图 URL */
  activeImage: string;
  /** 是否正在提交请求 */
  submitting: boolean;
  /** 可选的属性规格列表 */
  availableAttributes: { name: string; values: string[] }[];
  /** 排序后的相册列表 */
  sortedGallery: GalleryItem[];
  /** 是否可购买（上架状态） */
  isPurchasable: boolean;
  /** 是否选中了有效的 SKU */
  isSkuValid: boolean;
  /** 是否有库存 */
  isStockAvailable: boolean;
  /** 用户会话信息 */
  session: ReturnType<typeof useUserSession>;
}

export interface ProductDetailHandlers {
  /** 选中规格属性 */
  handleAttributeSelect: (name: string, value: string) => void;
  /** 修改购买数量 */
  handleQuantityChange: (type: 'inc' | 'dec') => void;
  /** 加入购物车 */
  handleAddToCart: () => Promise<void>;
  /** 点击相关商品 */
  handleRelatedClick: (id: string) => void;
  /** 手动切换主图 */
  setActiveImage: (url: string) => void;
}

export const useProductDetail = (): {
  state: ProductDetailState;
  handlers: ProductDetailHandlers;
} => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { productId, slug } = useMemo(() => ProductDetail.getParams(searchParams), [searchParams])
  const session = useUserSession()

  // ===== State =====
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<ProductDetailData | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductItem[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [selectedSku, setSelectedSku] = useState<ProductSkuData | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [activeImage, setActiveImage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // ===== Effects =====
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProductDetail({ productId, slug })
      setProduct(data.product)
      setActiveImage(data.product.mainImageUrl)
      
      const relatedData = await getRelatedProducts({
        categoryId: data.product.categoryId,
        excludeProductId: data.product.id
      })
      setRelatedProducts(relatedData.list)
    } catch (err: any) {
      setError(err.message || '获取商品详情失败')
    } finally {
      setLoading(false)
    }
  }, [productId, slug])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  useEffect(() => {
    if (product && product.skus && product.skus.length > 0) {
      const defaultSku = product.skus.find(s => s.stock > 0) || product.skus[0]
      setSelectedSku(defaultSku)
      if (defaultSku.imageUrl) {
        setActiveImage(defaultSku.imageUrl)
      }
      
      const initAttrs: Record<string, string> = {}
      defaultSku.attributeJson?.forEach(attr => {
        if (attr.name && attr.value) {
          initAttrs[attr.name] = attr.value
        }
      })
      setSelectedAttributes(initAttrs)
    }
  }, [product])

  // ===== Derived State =====
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
    
    return Array.from(attrMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values)
    }))
  }, [product])

  const sortedGallery = useMemo(() => {
    if (!product) return []
    const mainImg: GalleryItem = { url: product.mainImageUrl, sort: -1 }
    const extraImgs = (product.galleryJson || [])
      .filter(item => item.url)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    return [mainImg, ...extraImgs]
  }, [product])

  const isPurchasable = product?.status === 'ACTIVE'
  const isSkuValid = !!selectedSku
  const isStockAvailable = !!(selectedSku && selectedSku.stock > 0)

  // ===== Handlers =====
  const handleAttributeSelect = (name: string, value: string) => {
    if (product?.status !== 'ACTIVE') return

    const newAttrs = { ...selectedAttributes, [name]: value }
    setSelectedAttributes(newAttrs)

    const matchedSku = product?.skus?.find(sku => {
      return sku.attributeJson?.every(attr => {
        return attr.name && newAttrs[attr.name] === attr.value
      })
    }) || null

    setSelectedSku(matchedSku)
    
    if (matchedSku) {
      if (matchedSku.imageUrl) {
        setActiveImage(matchedSku.imageUrl)
      }
      setQuantity(1)
    }
  }

  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (!selectedSku) return
    if (type === 'inc') {
      if (quantity < selectedSku.stock) setQuantity(prev => prev + 1)
      else toast.warning(`库存上限为 ${selectedSku.stock}`)
    } else {
      if (quantity > 1) setQuantity(prev => prev - 1)
    }
  }

  const handleAddToCart = async () => {
    if (!session.token) {
      toast.info('请先登录即可加入购物车')
      let returnPath = ProductDetail.path
      if (productId) returnPath += `?productId=${productId}`
      else if (slug) returnPath += `?slug=${slug}`
      
      CustomerLogin.navigateToWithReturn(router, { returnTo: returnPath })
      return
    }

    if (!selectedSku) {
      toast.error('请选择有效的规格组合')
      return
    }

    try {
      setSubmitting(true)
      await addToCart({ productSkuId: selectedSku.id, quantity })
      toast.success('加入购物车成功')
    } catch (err: any) {
      toast.error(err.message || '加入购物车失败')
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
      activeImage,
      submitting,
      availableAttributes,
      sortedGallery,
      isPurchasable,
      isSkuValid,
      isStockAvailable,
      session
    },
    handlers: {
      handleAttributeSelect,
      handleQuantityChange,
      handleAddToCart,
      handleRelatedClick,
      setActiveImage
    }
  }
}
