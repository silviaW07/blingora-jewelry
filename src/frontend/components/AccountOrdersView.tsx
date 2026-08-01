'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AccountShell } from '@/frontend/components/AccountShell'
import {
  listCustomerOrders,
  reorderCustomerOrder,
} from '@/frontend/actions/AccountCenter'
import type {
  CustomerOrderSummary,
  CustomerOrderStatus,
  ReorderSkippedLine,
} from '../actions/AccountCenter'
import { AccountOrderDetail, AccountOrderPay, Cart } from '@/frontend/route-params'

const STATUS_CLASS: Record<CustomerOrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-sky-50 text-sky-700 border-sky-200',
  PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHIPPED: 'bg-violet-50 text-violet-700 border-violet-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  REFUNDED: 'bg-rose-50 text-rose-700 border-rose-200',
}

const CELL = 'px-3 py-4 align-middle text-center sm:px-4'
const HEAD = 'px-3 text-center sm:px-4'

function formatOrderDateTime(iso: string, locale: string) {
  const date = new Date(iso)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const timeLine = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  return {
    dateLine: `${y}-${m}-${d}`,
    timeLine,
  }
}

export default function AccountOrdersView() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCustomerOrders()
      setOrders(res.list || [])
    } catch (error) {
      toast.error((error as Error).message || t('accountOrders.loadFailed'))
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const describeSkip = (line: ReorderSkippedLine) =>
    t(`accountOrders.skipReasons.${line.reason}`, {
      product: line.productName,
      sku: line.skuCode,
      stock: line.availableStock ?? 0,
      minimum: line.minimumQuantity ?? 1,
    })

  const handleReorder = async (order: CustomerOrderSummary) => {
    setReorderingId(order.orderId)
    try {
      const result = await reorderCustomerOrder(order.orderId)
      if (result.addedQuantity > 0) {
        toast.success(t('accountOrders.reorderAdded', { count: result.addedQuantity }))
      }
      if (result.skipped.length > 0) {
        const visible = result.skipped.slice(0, 3).map(describeSkip)
        const remaining = result.skipped.length - visible.length
        toast.warning(t('accountOrders.reorderSkipped', { count: result.skipped.length }), {
          description: [
            ...visible,
            ...(remaining > 0 ? [t('accountOrders.moreSkipped', { count: remaining })] : []),
          ].join(' · '),
          duration: 8000,
        })
      }
      if (result.addedQuantity > 0) Cart.navigateTo(router)
    } catch (error) {
      toast.error((error as Error).message || t('accountOrders.reorderFailed'))
    } finally {
      setReorderingId(null)
    }
  }

  const locale =
    i18n.resolvedLanguage === 'zh'
      ? 'zh-CN'
      : i18n.resolvedLanguage === 'es'
        ? 'es-ES'
        : 'en-US'

  return (
    <AccountShell title={t('accountOrders.title')} description={t('accountOrders.description')}>
      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-[#7a756c]">
          <Loader2 className="size-4 animate-spin" />
          {t('accountOrders.loading')}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
          <Package className="size-10 text-[#d4cdc0]" />
          <p className="text-sm font-medium text-[#4a433a]">{t('accountOrders.empty')}</p>
          <p className="text-xs text-[#8a8073]">{t('accountOrders.emptyHint')}</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[1080px] border-y border-[#ebe6dc]">
            <TableHeader className="bg-[#fbfaf7]">
              <TableRow className="hover:bg-[#fbfaf7]">
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.orderNumber')}</TableHead>
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.date')}</TableHead>
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.items')}</TableHead>
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.status')}</TableHead>
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.total')}</TableHead>
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.shippingMethod')}</TableHead>
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.weight')}</TableHead>
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.orderNote')}</TableHead>
                <TableHead className={`${HEAD} whitespace-nowrap`}>{t('accountOrders.operations')}</TableHead>
                <TableHead className={`${HEAD} min-w-[120px] whitespace-nowrap text-right`}>
                  {t('accountOrders.payNow')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const { dateLine, timeLine } = formatOrderDateTime(order.createdAt, locale)
                const orderNote = String(order.internalNote || '').trim()
                const canPay = order.status === 'PENDING_PAYMENT'
                const weightText =
                  order.totalWeightGrams > 0
                    ? t('accountOrders.weightValue', {
                        weight: order.totalWeightGrams.toLocaleString(locale),
                      })
                    : '—'

                return (
                  <TableRow key={order.orderId} className="hover:bg-[#fffafa]">
                    <TableCell className={`${CELL} whitespace-nowrap font-semibold text-[#1f1a14]`}>
                      {order.orderNo}
                    </TableCell>
                    <TableCell className={`${CELL} whitespace-nowrap text-[#6f6558]`}>
                      <div className="leading-tight">
                        <div>{dateLine}</div>
                        <div className="mt-0.5 text-xs text-[#8a8073]">{timeLine}</div>
                      </div>
                    </TableCell>
                    <TableCell className={`${CELL} whitespace-nowrap text-[#2f2a24]`}>
                      {t('accountOrders.itemCount', { count: order.itemCount })}
                    </TableCell>
                    <TableCell className={CELL}>
                      <Badge variant="outline" className={STATUS_CLASS[order.status]}>
                        {t(`accountOrders.statuses.${order.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`${CELL} whitespace-nowrap font-semibold text-[#1f1a14]`}>
                      {order.currencyCode} {order.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className={`${CELL} max-w-[160px] whitespace-normal break-words text-[#6f6558]`}>
                      <span className="line-clamp-3">
                        {order.trackingCarrier ||
                          t(`accountOrders.shipMethods.${order.shipMethod}`)}
                      </span>
                    </TableCell>
                    <TableCell className={`${CELL} whitespace-nowrap text-[#6f6558]`}>
                      {weightText}
                    </TableCell>
                    <TableCell className={`${CELL} max-w-[180px] whitespace-normal break-words text-[#6f6558]`}>
                      {orderNote || '—'}
                    </TableCell>
                    <TableCell className={CELL}>
                      <div className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-[#2f2a24] underline-offset-4 hover:text-[#f254a6] hover:underline"
                          onClick={() =>
                            AccountOrderDetail.navigateTo(router, { orderId: order.orderId })
                          }
                        >
                          {t('accountOrders.viewOrder')}
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          className="min-w-24 rounded-full bg-[#f254a6] text-white hover:bg-[#df3f91]"
                          disabled={reorderingId !== null}
                          onClick={() => void handleReorder(order)}
                        >
                          {reorderingId === order.orderId && (
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                          )}
                          {t('accountOrders.reorder')}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className={`${CELL} min-w-[120px] text-right`}>
                      <div className="flex justify-end pr-1">
                        {canPay ? (
                          <Button
                            type="button"
                            size="sm"
                            className="shrink-0 rounded-full bg-[#f254a6] px-3 text-white hover:bg-[#df3f91]"
                            onClick={() =>
                              AccountOrderPay.navigateTo(router, { orderId: order.orderId })
                            }
                          >
                            {t('accountOrders.payNow')}
                          </Button>
                        ) : (
                          <span className="inline-block min-w-[72px] text-sm text-[#c4bdb2]">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AccountShell>
  )
}
