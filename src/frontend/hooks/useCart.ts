'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCategory } from '@/frontend/route-params'
import type { 
  CartItemData, 
  CartSummary, 
  RecommendedProductData, 
  CartItemStatus 
} from '@/frontend/actions/Cart'
import {
  getCartData,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  removeInvalidCartItems,
  getRecommendedProducts
} from '@/frontend/actions/Cart'
import { toast } from 'sonner'

// Export States
export interface CartState {
  /** 是否正在加载初始数据 */
  loading: boolean
  /** 购物车商品列表 */
  items: CartItemData[]
  /** 价格汇总数据 */
  summary: CartSummary | null
  /** 推荐商品列表 */
  recommended: RecommendedProductData[]
  /** 是否正在执行操作（更新/删除等） */
  actionLoading: boolean
  /** 清空确认弹窗是否打开 */
  isClearConfirmOpen: boolean
  /** 是否包含失效商品 */
  hasInvalidItems: boolean
  /** 购物车是否为空 */
  isEmpty: boolean
  /** 商品状态枚举标签映射 */
  CART_ITEM_STATUS_LABELS: Record<CartItemStatus, string>
}

// Export Handlers
export interface CartHandlers {
  /** 更新商品数量 */
  handleUpdateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>
  /** 移除单个商品 */
  handleRemoveItem: (cartItemId: string) => Promise<void>
  /** 移除所有失效商品 */
  handleRemoveInvalid: () => Promise<void>
  /** 清空购物车 */
  handleClearCart: () => Promise<void>
  /** 下单成功后静默清空购物车（不弹确认、不额外 toast） */
  handleClearCartAfterOrder: () => Promise<void>
  /** 设置清空确认弹窗状态 */
  setIsClearConfirmOpen: (open: boolean) => void
  /** 跳转至默认商品类目页 */
  handleNavigateToDefault: () => void
}

/**
 * 购物车主逻辑 Hook
 */
export const useCart = (): { state: CartState, handlers: CartHandlers } => {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<CartItemData[]>([])
  const [summary, setSummary] = useState<CartSummary | null>(null)
  const [recommended, setRecommended] = useState<RecommendedProductData[]>([])
  
  const [actionLoading, setActionLoading] = useState(false)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)

  const CART_ITEM_STATUS_LABELS: Record<CartItemStatus, string> = {
    VALID: 'Valid',
    INVALID: 'Unavailable',
  }

  const loadCartData = useCallback(async () => {
    try {
      const { getClientPreferredLang } = await import('@/frontend/i18n')
      const data = await getCartData({ lang: getClientPreferredLang() })
      setItems(data.items)
      setSummary(data.summary)
    } catch (e) {}
  }, [])

  const loadRecommended = useCallback(async () => {
    try {
      const { getClientPreferredLang } = await import('@/frontend/i18n')
      const { list } = await getRecommendedProducts({ lang: getClientPreferredLang() })
      setRecommended(list)
    } catch (e) {}
  }, [])

  useEffect(() => {
    Promise.all([loadCartData(), loadRecommended()]).finally(() => {
      setLoading(false)
    })
  }, [loadCartData, loadRecommended])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reload = () => {
      void loadCartData()
      void loadRecommended()
    }
    const onLocaleChanged = () => {
      reload()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'app_preferred_locale') reload()
    }
    window.addEventListener('app-locale-changed', onLocaleChanged as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('app-locale-changed', onLocaleChanged as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [loadCartData, loadRecommended])

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await updateCartItemQuantity({ cartItemId, quantity: newQuantity })
      await loadCartData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await removeCartItem({ cartItemId })
      await loadCartData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveInvalid = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await removeInvalidCartItems()
      toast.success('Unavailable items removed')
      await loadCartData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearCart = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await clearCart()
      toast.success('Cart cleared')
      await loadCartData()
      setIsClearConfirmOpen(false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearCartAfterOrder = async () => {
    setActionLoading(true)
    try {
      // 下单接口可能已清空；这里再同步一次前端列表状态
      setItems([])
      setSummary({
        totalPrice: 0,
        shippingFee: 0,
        discount: 0,
        totalWeightGram: 0,
        finalAmount: 0,
      })
      await loadCartData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleNavigateToDefault = () => {
    ProductCategory.navigateToDefault(router)
  }

  const hasInvalidItems = items.some(item => item.status === 'INVALID')
  const isEmpty = items.length === 0

  return {
    state: {
      loading,
      items,
      summary,
      recommended,
      actionLoading,
      isClearConfirmOpen,
      hasInvalidItems,
      isEmpty,
      CART_ITEM_STATUS_LABELS,
    },
    handlers: {
      handleUpdateQuantity,
      handleRemoveItem,
      handleRemoveInvalid,
      handleClearCart,
      handleClearCartAfterOrder,
      setIsClearConfirmOpen,
      handleNavigateToDefault,
    }
  }
}

/**
 * 数量控制组件逻辑 Hook（用于受控输入 UX）
 */
export function useQuantityControl(
  initialValue: number, 
  max: number, 
  onUpdate: (val: number) => void
) {
  const [val, setVal] = useState<string>(initialValue.toString())
  const isComposingRef = useRef(false)

  useEffect(() => {
    setVal(initialValue.toString())
  }, [initialValue])

  const commitValue = useCallback((targetValue: string) => {
    const num = parseInt(targetValue, 10)
    if (isNaN(num) || num < 0) {
      setVal(initialValue.toString())
      return
    }
    if (num > max) {
      toast.error(`Exceeds stock limit (max ${max})`)
      setVal(max.toString())
      onUpdate(max)
      return
    }
    if (num !== initialValue) {
      onUpdate(num)
    }
  }, [initialValue, max, onUpdate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value)
  }

  const handleBlur = () => {
    commitValue(val)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isComposingRef.current) return
      commitValue(val)
    }
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = () => {
    isComposingRef.current = false
  }

  const handleMinus = () => {
    const currentNum = parseInt(val, 10) || 1
    if (currentNum > 1) {
      const newVal = currentNum - 1
      setVal(newVal.toString())
      onUpdate(newVal)
    } else if (currentNum === 1) {
      onUpdate(0)
    }
  }

  const handlePlus = () => {
    const currentNum = parseInt(val, 10) || 0
    if (currentNum < max) {
      const newVal = currentNum + 1
      setVal(newVal.toString())
      onUpdate(newVal)
    } else {
      toast.error(`Not enough stock (max ${max})`)
    }
  }

  return {
    val,
    handleMinus,
    handlePlus,
    handleChange,
    handleBlur,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd
  }
}