'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  clearSalesStatsLedger,
  getSalesStatsDetail,
  importSalesStatsImage,
  importSalesStatsSheet,
  saveSalesStatsLedger,
} from '@/backend/actions/SalesStats'
import {
  DEFAULT_SALES_META,
  computedOrderAmount,
  type SalesLedgerOrder,
  type SalesStatsDetail,
  type SalesStatsMeta,
} from '@/backend/salesStatsShared'
import { Dashboard } from '@/backend/route-params'

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function withRecalc(order: SalesLedgerOrder): SalesLedgerOrder {
  return {
    ...order,
    orderAmount: computedOrderAmount(order.goodsAmount, order.usdShipping),
  }
}

export function useSalesStats() {
  const router = useRouter()
  const [detail, setDetail] = useState<SalesStatsDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detailRef = useRef<SalesStatsDetail | null>(null)

  useEffect(() => {
    detailRef.current = detail
  }, [detail])

  const reload = async () => {
    setLoading(true)
    try {
      const next = await getSalesStatsDetail()
      setDetail(next)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '销售额统计加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const persist = (next: SalesStatsDetail, immediate = false) => {
    setDetail(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    const run = async () => {
      setSaving(true)
      try {
        const saved = await saveSalesStatsLedger({
          orders: next.orders,
          meta: next.meta || DEFAULT_SALES_META,
        })
        setDetail(saved)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '保存失败')
        await reload()
      } finally {
        setSaving(false)
      }
    }
    if (immediate) void run()
    else saveTimer.current = setTimeout(() => void run(), 400)
  }

  const importSheet = async (file: File) => {
    setImporting(true)
    try {
      const fileBase64 = await fileToBase64(file)
      const next = await importSalesStatsSheet({ fileBase64, fileName: file.name, mode: 'replace' })
      setDetail(next)
      toast.success(`已导入 ${next.orders.length} 笔销售记录`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '表格导入失败')
    } finally {
      setImporting(false)
    }
  }

  const importImage = async (file: File) => {
    setImporting(true)
    try {
      const fileBase64 = await fileToBase64(file)
      const next = await importSalesStatsImage({ fileBase64, fileName: file.name, mode: 'replace' })
      setDetail(next)
      toast.success(`已识别 ${next.orders.length} 笔销售记录`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片识别失败')
    } finally {
      setImporting(false)
    }
  }

  const clearLedger = async () => {
    if (!window.confirm('确认清空当前销售额统计数据？')) return
    setImporting(true)
    try {
      const next = await clearSalesStatsLedger()
      setDetail(next)
      toast.success('已清空')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '清空失败')
    } finally {
      setImporting(false)
    }
  }

  const updateMeta = (patch: Partial<SalesStatsMeta>) => {
    const current = detailRef.current
    if (!current) return
    persist({
      ...current,
      meta: {
        ...current.meta,
        ...patch,
        columns: {
          ...current.meta.columns,
          ...(patch.columns || {}),
        },
      },
    })
  }

  const updateOrder = (orderId: string, patch: Partial<SalesLedgerOrder>) => {
    const current = detailRef.current
    if (!current) return
    const orders = current.orders.map((order) => {
      if (order.id !== orderId) return order
      const next = withRecalc({
        ...order,
        ...patch,
        goodsAmount:
          patch.goodsAmount === undefined
            ? order.goodsAmount
            : patch.goodsAmount == null || Number.isNaN(Number(patch.goodsAmount))
              ? null
              : Number(patch.goodsAmount),
        usdShipping:
          patch.usdShipping === undefined
            ? order.usdShipping
            : patch.usdShipping == null || Number.isNaN(Number(patch.usdShipping))
              ? null
              : Number(patch.usdShipping),
        deposit:
          patch.deposit === undefined
            ? order.deposit
            : patch.deposit == null || Number.isNaN(Number(patch.deposit))
              ? null
              : Number(patch.deposit),
      })
      return next
    })
    const freightCostTotal = Math.round(
      orders.reduce((sum, item) => {
        const lineSum = item.lines.reduce((lineTotal, line) => {
          const amount = Number(String(line.freightCost || '').replace(/[$,￥¥USD\s,]/gi, ''))
          return lineTotal + (Number.isFinite(amount) ? amount : 0)
        }, 0)
        return sum + lineSum
      }, 0) * 100,
    ) / 100
    const summary = {
      ...current.summary,
      orderAmountTotal: Math.round(orders.reduce((sum, item) => sum + (item.orderAmount || 0), 0) * 100) / 100,
      goodsAmountTotal: Math.round(orders.reduce((sum, item) => sum + (item.goodsAmount || 0), 0) * 100) / 100,
      usdShippingTotal: Math.round(orders.reduce((sum, item) => sum + (item.usdShipping || 0), 0) * 100) / 100,
      depositTotal: Math.round(orders.reduce((sum, item) => sum + (item.deposit || 0), 0) * 100) / 100,
      freightCostTotal,
      orderCount: orders.length,
      shipmentCount: orders.reduce((sum, item) => sum + Math.max(1, item.lines.length), 0),
    }
    persist({ ...current, orders, summary })
  }

  const updateLine = (
    orderId: string,
    lineIndex: number,
    patch: Partial<SalesLedgerOrder['lines'][number]>,
  ) => {
    const current = detailRef.current
    if (!current) return
    const orders = current.orders.map((order) => {
      if (order.id !== orderId) return order
      const lines = order.lines.map((line, index) => (index === lineIndex ? { ...line, ...patch } : line))
      return { ...order, lines }
    })
    const freightCostTotal = Math.round(
      orders.reduce((sum, item) => {
        const lineSum = item.lines.reduce((lineTotal, line) => {
          const amount = Number(String(line.freightCost || '').replace(/[$,￥¥USD\s,]/gi, ''))
          return lineTotal + (Number.isFinite(amount) ? amount : 0)
        }, 0)
        return sum + lineSum
      }, 0) * 100,
    ) / 100
    persist({
      ...current,
      orders,
      summary: {
        ...current.summary,
        freightCostTotal,
        shipmentCount: orders.reduce((sum, item) => sum + Math.max(1, item.lines.length), 0),
      },
    })
  }

  return {
    state: { detail, loading, importing, saving },
    handlers: {
      handleBack: () => Dashboard.navigateTo(router),
      importSheet,
      importImage,
      clearLedger,
      reload,
      updateMeta,
      updateOrder,
      updateLine,
    },
  }
}
