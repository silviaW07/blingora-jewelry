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
  syncSalesStatsFromOrders,
} from '@/backend/actions/SalesStats'
import {
  DEFAULT_COLUMN_LABELS,
  DEFAULT_SALES_META,
  canonicalPeriodKey,
  comparePeriodStats,
  compareSalesOrders,
  computedOrderAmount,
  createBlankSalesOrder,
  normalizeHeaderLabels,
  parsePeriodInfo,
  type SalesLedgerOrder,
  type SalesPeriodStat,
  type SalesStatsDetail,
  type SalesStatsMeta,
  type SalesStatsSummary,
} from '@/backend/salesStatsShared'
import { Dashboard } from '@/backend/route-params'

function buildSummary(orders: SalesLedgerOrder[]): SalesStatsSummary {
  const periodMap = new Map<string, SalesPeriodStat>()
  let shipmentCount = 0
  let orderAmountTotal = 0
  let goodsAmountTotal = 0
  let usdShippingTotal = 0
  let depositTotal = 0
  let freightCostTotal = 0

  for (const order of orders) {
    shipmentCount += Math.max(1, order.lines.length)
    orderAmountTotal += order.orderAmount || 0
    goodsAmountTotal += order.goodsAmount || 0
    usdShippingTotal += order.usdShipping || 0
    depositTotal += order.deposit || 0
    let orderFreight = 0
    for (const line of order.lines) {
      const amount = Number(String(line.freightCost || '').replace(/[$,￥¥USD\s,]/gi, ''))
      if (Number.isFinite(amount)) {
        freightCostTotal += amount
        orderFreight += amount
      }
    }
    const label = order.periodLabel || '未标注表标题'
    const sortKey = Number(order.periodSortKey || 0)
    const key = canonicalPeriodKey(label, sortKey)
    const bucket =
      periodMap.get(key) ||
      ({
        label,
        sortKey,
        orderCount: 0,
        shipmentCount: 0,
        orderAmountTotal: 0,
        goodsAmountTotal: 0,
        usdShippingTotal: 0,
        freightCostTotal: 0,
      } satisfies SalesPeriodStat)
    bucket.orderCount += 1
    bucket.shipmentCount += Math.max(1, order.lines.length)
    bucket.orderAmountTotal += order.orderAmount || 0
    bucket.goodsAmountTotal += order.goodsAmount || 0
    bucket.usdShippingTotal += order.usdShipping || 0
    bucket.freightCostTotal += orderFreight
    periodMap.set(key, bucket)
  }

  return {
    orderCount: orders.length,
    shipmentCount,
    orderAmountTotal: Math.round(orderAmountTotal * 100) / 100,
    goodsAmountTotal: Math.round(goodsAmountTotal * 100) / 100,
    usdShippingTotal: Math.round(usdShippingTotal * 100) / 100,
    depositTotal: Math.round(depositTotal * 100) / 100,
    freightCostTotal: Math.round(freightCostTotal * 100) / 100,
    periods: Array.from(periodMap.values())
      .map((item) => ({
        ...item,
        orderAmountTotal: Math.round(item.orderAmountTotal * 100) / 100,
        goodsAmountTotal: Math.round(item.goodsAmountTotal * 100) / 100,
        usdShippingTotal: Math.round(item.usdShippingTotal * 100) / 100,
        freightCostTotal: Math.round(item.freightCostTotal * 100) / 100,
      }))
      .sort(comparePeriodStats),
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
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
      const before = detailRef.current?.orders.length || 0
      const fileBase64 = await fileToBase64(file)
      const next = await importSalesStatsSheet({ fileBase64, fileName: file.name, mode: 'append' })
      setDetail(next)
      const added = Math.max(0, next.orders.length - before)
      toast.success(`已追加 ${added} 笔，保留原有表格；同标题月份会合并`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '表格导入失败')
    } finally {
      setImporting(false)
    }
  }

  const importImage = async (file: File) => {
    setImporting(true)
    try {
      const before = detailRef.current?.orders.length || 0
      const fileBase64 = await fileToBase64(file)
      const next = await importSalesStatsImage({ fileBase64, fileName: file.name, mode: 'append' })
      setDetail(next)
      const added = Math.max(0, next.orders.length - before)
      toast.success(`已追加识别 ${added} 笔，保留原有表格`)
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

  const syncFromOrders = async () => {
    setImporting(true)
    try {
      const next = await syncSalesStatsFromOrders()
      setDetail(next)
      toast.success(`已同步 ${next.syncedCount || 0} 笔后台已付款订单到对应月份表`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '同步订单失败')
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
    const target = current.orders.find((order) => order.id === orderId)
    if (!target) return

    const periodPatch =
      patch.periodLabel !== undefined
        ? (() => {
            const nextLabel = String(patch.periodLabel || '').trim() || target.periodLabel || '导入表'
            const parsed = parsePeriodInfo(nextLabel, new Date().getFullYear())
            return {
              periodLabel: nextLabel,
              periodSortKey: parsed?.sortKey || target.periodSortKey || 0,
              headerLabels: normalizeHeaderLabels(
                {
                  ...(target.headerLabels || DEFAULT_COLUMN_LABELS),
                  ...(patch.headerLabels || {}),
                  date: nextLabel,
                },
                nextLabel,
              ),
            }
          })()
        : null

    const orders = current.orders
      .map((order) => {
        const samePeriod =
          canonicalPeriodKey(order.periodLabel, order.periodSortKey) ===
          canonicalPeriodKey(target.periodLabel, target.periodSortKey)
        const shouldSyncPeriod = Boolean(periodPatch && samePeriod)
        if (order.id !== orderId && !shouldSyncPeriod) {
          // 改某月表头时绝不改其它月份
          if (patch.headerLabels && !samePeriod) return order
          if (patch.headerLabels && samePeriod && !periodPatch) {
            return {
              ...order,
              headerLabels: normalizeHeaderLabels(
                { ...(order.headerLabels || DEFAULT_COLUMN_LABELS), ...patch.headerLabels, date: order.periodLabel },
                order.periodLabel,
              ),
            }
          }
          return order
        }
        if (order.id !== orderId && shouldSyncPeriod) {
          return {
            ...order,
            ...periodPatch,
            headerLabels: normalizeHeaderLabels(
              { ...(order.headerLabels || DEFAULT_COLUMN_LABELS), ...(periodPatch?.headerLabels || {}), date: periodPatch?.periodLabel },
              periodPatch?.periodLabel,
            ),
          }
        }
        return withRecalc({
          ...order,
          ...patch,
          ...(periodPatch || {}),
          headerLabels: normalizeHeaderLabels(
            {
              ...(order.headerLabels || DEFAULT_COLUMN_LABELS),
              ...(patch.headerLabels || {}),
              date: periodPatch?.periodLabel || patch.periodLabel || order.periodLabel,
            },
            periodPatch?.periodLabel || patch.periodLabel || order.periodLabel,
          ),
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
      })
      .sort(compareSalesOrders)

    persist({ ...current, orders, summary: buildSummary(orders) })
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
    persist({
      ...current,
      orders,
      summary: buildSummary(orders),
    })
  }

  const deleteOrder = (orderId: string) => {
    const current = detailRef.current
    if (!current) return
    const target = current.orders.find((order) => order.id === orderId)
    if (!target) return
    if (!window.confirm(`确认删除该行订单？\n${target.customerName || target.dateText || target.id}\n不会影响其它已导入的表。`)) {
      return
    }
    const orders = current.orders.filter((order) => order.id !== orderId)
    persist({ ...current, orders, summary: buildSummary(orders) })
    toast.success('已删除该行')
  }

  const deletePeriod = (periodLabel: string, periodSortKey: number) => {
    const current = detailRef.current
    if (!current) return
    const key = canonicalPeriodKey(periodLabel, periodSortKey)
    const count = current.orders.filter(
      (order) => canonicalPeriodKey(order.periodLabel, order.periodSortKey) === key,
    ).length
    if (!count) return
    if (!window.confirm(`确认删除整张表「${periodLabel}」共 ${count} 笔？\n其它已导入的表不会受影响。`)) {
      return
    }
    const orders = current.orders.filter(
      (order) => canonicalPeriodKey(order.periodLabel, order.periodSortKey) !== key,
    )
    persist({ ...current, orders, summary: buildSummary(orders) })
    toast.success(`已删除「${periodLabel}」`)
  }

  const createBlankSheet = (rowCount = 5) => {
    const current = detailRef.current
    if (!current) return
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const suggested = `${year}年${month}月`
    const typed = window.prompt('新建空白工作表标题（如 2026年10月 / 2026年8-9月）', suggested)
    if (typed == null) return
    const label = String(typed).trim() || suggested
    const parsed = parsePeriodInfo(label, year)
    const periodLabel = parsed?.label || label
    const periodSortKey = parsed?.sortKey ?? year * 100 + month
    const key = canonicalPeriodKey(periodLabel, periodSortKey)
    const exists = current.orders.some(
      (order) => canonicalPeriodKey(order.periodLabel, order.periodSortKey) === key,
    )
    if (exists) {
      toast.error(`已有「${periodLabel}」表格，请直接在该表加行，或换一个标题`)
      return
    }
    const count = Math.max(1, Math.min(30, Math.floor(Number(rowCount) || 5)))
    const blanks = Array.from({ length: count }, () =>
      createBlankSalesOrder({ periodLabel, periodSortKey }),
    )
    const orders = [...current.orders, ...blanks].sort(compareSalesOrders)
    persist({ ...current, orders, summary: buildSummary(orders) }, true)
    toast.success(`已新建「${periodLabel}」空白表（${count} 行），双击单元格填写`)
  }

  const addBlankOrder = (periodLabel: string, periodSortKey: number) => {
    const current = detailRef.current
    if (!current) return
    const key = canonicalPeriodKey(periodLabel, periodSortKey)
    const sample = current.orders.find(
      (order) => canonicalPeriodKey(order.periodLabel, order.periodSortKey) === key,
    )
    const blank = createBlankSalesOrder({
      periodLabel: sample?.periodLabel || periodLabel,
      periodSortKey: sample?.periodSortKey ?? periodSortKey,
      headerLabels: sample?.headerLabels,
    })
    // 插到该月第一行，保存后也不会被当成空行清掉
    const others = current.orders.filter(
      (order) => canonicalPeriodKey(order.periodLabel, order.periodSortKey) !== key,
    )
    const samePeriod = current.orders.filter(
      (order) => canonicalPeriodKey(order.periodLabel, order.periodSortKey) === key,
    )
    const orders = [...others, blank, ...samePeriod].sort(compareSalesOrders)
    persist({ ...current, orders, summary: buildSummary(orders) }, true)
    toast.success('已在本表顶部加一行空白订单，双击单元格填写')
  }

  const addShipmentLine = (orderId: string) => {
    const current = detailRef.current
    if (!current) return
    const orders = current.orders.map((order) => {
      if (order.id !== orderId) return order
      return {
        ...order,
        lines: [...order.lines, { freightCost: '', chargeWeight: '', remark: '' }],
      }
    })
    persist({ ...current, orders, summary: buildSummary(orders) })
  }

  return {
    state: { detail, loading, importing, saving },
    handlers: {
      handleBack: () => Dashboard.navigateTo(router),
      importSheet,
      importImage,
      clearLedger,
      syncFromOrders,
      createBlankSheet,
      addBlankOrder,
      addShipmentLine,
      reload,
      updateMeta,
      updateOrder,
      updateLine,
      deleteOrder,
      deletePeriod,
    },
  }
}
