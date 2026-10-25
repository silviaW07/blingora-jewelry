'use client'

import { useCallback, useEffect, useState } from 'react'
import { useClientSearchParams } from '@/frontend/utils/useClientSearchParams'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import EditableImg from '@/@base/EditableImg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AccountShell } from '@/frontend/components/AccountShell'
import {
  getCustomerOrderDetail,
  reorderCustomerOrder,
} from '@/frontend/actions/AccountCenter'
import type { CustomerOrderItem, CustomerOrderSummary } from '../actions/AccountCenter'
import { AccountOrderDetail } from '@/frontend/route-params'
import { hardNavigate, hardNavProps, orderPayHref, productHref } from '@/frontend/utils/hardNavigate'
import { localizeShippingText } from '@/shared/shippingChannelI18n'
import { normalizeProductLang } from '@/frontend/i18n/productTranslation'

export default function AccountOrderDetailView() {
  const searchParams = useClientSearchParams()
  const { t, i18n } = useTranslation()
  const { orderId } = AccountOrderDetail.getParams(searchParams)
  const [order, setOrder] = useState<CustomerOrderSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(false)
  const [shipZoom, setShipZoom] = useState('')

  const load = useCallback(async () => {
    if (!orderId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setOrder(await getCustomerOrderDetail(orderId))
    } catch (error) {
      toast.error((error as Error).message || t('accountOrders.loadFailed'))
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId, t])

  useEffect(() => {
    void load()
  }, [load])

  const handleReorder = async () => {
    if (!order) return
    setReordering(true)
    try {
      const result = await reorderCustomerOrder(order.orderId)
      if (result.addedQuantity > 0) {
        toast.success(t('accountOrders.reorderAdded', { count: result.addedQuantity }))
      }
      if (result.skipped.length > 0) {
        toast.warning(t('accountOrders.reorderSkipped', { count: result.skipped.length }), {
          description: result.skipped.slice(0, 3).map((line) => t(
            `accountOrders.skipReasons.${line.reason}`,
            {
              product: line.productName,
              sku: line.skuCode,
              stock: line.availableStock ?? 0,
              minimum: line.minimumQuantity ?? 1,
            },
          )).join(' · '),
          duration: 8000,
        })
      }
      if (result.addedQuantity > 0) hardNavigate('/cart/')
    } catch (error) {
      toast.error((error as Error).message || t('accountOrders.reorderFailed'))
    } finally {
      setReordering(false)
    }
  }

  const locale = i18n.resolvedLanguage === 'zh'
    ? 'zh-CN'
    : i18n.resolvedLanguage === 'es'
      ? 'es-ES'
      : 'en-US'

  return (
    <AccountShell title={t('accountOrders.detailTitle')} description={t('accountOrders.detailDescription')}>
      <a
        {...hardNavProps('/account/orders/')}
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-[#2f2a24] hover:text-[#f254a6]"
      >
        <ArrowLeft className="size-4" />
        {t('accountOrders.backToOrders')}
      </a>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-[#7a756c]">
          <Loader2 className="size-4 animate-spin" />
          {t('accountOrders.loading')}
        </div>
      ) : !order ? (
        <div className="min-h-[180px] rounded-2xl bg-[#fbfaf7] p-6 text-sm text-[#6f6558]">
          {t('accountOrders.notFound')}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fbfaf7] px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1f1a14]">{order.orderNo}</p>
              <p className="text-[11px] text-[#7a756c]">
                {new Date(order.createdAt).toLocaleString(locale)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="h-7 px-2 text-[11px]">{t(`accountOrders.statuses.${order.status}`)}</Badge>
              {order.status === 'PENDING_PAYMENT' ? (
                <a
                  {...hardNavProps(orderPayHref(order.orderId))}
                  className="inline-flex h-7 items-center rounded-full bg-[#f254a6] px-3 text-xs font-medium text-white hover:bg-[#df3f91]"
                >
                  {t('accountOrders.payNow')}
                </a>
              ) : null}
              <Button
                type="button"
                className="h-7 rounded-full bg-[#f254a6] px-3 text-xs text-white hover:bg-[#df3f91]"
                disabled={reordering}
                onClick={() => void handleReorder()}
              >
                {reordering && <Loader2 className="mr-1 size-3 animate-spin" />}
                {t('accountOrders.reorder')}
              </Button>
            </div>
          </div>

          <div>
            <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">{t('accountOrders.items')}</h2>
            <div className="overflow-hidden rounded-xl border border-[#ebe6dc] bg-white px-2.5 sm:px-3">
              {order.items.map((item) => (
                <OrderItemRow
                  key={item.itemId}
                  item={item}
                  currencyCode={order.currencyCode}
                  discountRate={order.subtotalAmount > 0 && order.discountAmount > 0.009 ? Math.max(0, (order.subtotalAmount - order.discountAmount) / order.subtotalAmount) : 1}
                  onOpenProduct={() => { if (item.productName && !String(item.skuCode || '').startsWith('ADD-')) hardNavigate(productHref(item.productId)) }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#ebe6dc] bg-white px-3 py-2 text-xs text-[#6f6558]">
            <p className="flex items-center justify-between gap-3 py-1"><span>{t('accountOrders.originalTotal')}</span><span>{order.currencyCode} {order.subtotalAmount.toFixed(2)}</span></p>
            <p className="flex items-center justify-between gap-3 py-1"><span>{t('accountOrders.discount')}</span><span>{order.discountAmount > 0 ? '-' : ''}{order.currencyCode} {order.discountAmount.toFixed(2)}</span></p>
            <p className="flex items-center justify-between gap-3 py-1"><span>{t('accountOrders.shipping')}</span><span>{order.currencyCode} {order.shippingAmount.toFixed(2)}</span></p>
            <p className="flex items-center justify-between gap-3 border-t border-[#f0ebe3] py-1.5 text-sm font-semibold text-[#1f1a14]"><span>{t('accountOrders.total')}</span><span>{order.currencyCode} {order.totalAmount.toFixed(2)}</span></p>
            <p className="flex items-start justify-between gap-3 border-t border-[#f0ebe3] py-1.5"><span className="shrink-0 text-[#8a8073]">{t('accountOrders.shippingMethod')}</span><span className="text-right text-[#2f2a24]">{localizeShippingText(order.trackingCarrier, normalizeProductLang(i18n.resolvedLanguage)) || t(`accountOrders.shipMethods.${order.shipMethod}`)}</span></p>
            <p className="flex items-center justify-between gap-3 py-1"><span className="text-[#8a8073]">{t('accountOrders.weight')}</span><span className="text-[#2f2a24]">{order.totalWeightGrams > 0 ? t('accountOrders.weightValue', { weight: order.totalWeightGrams.toLocaleString(locale) }) : '—'}</span></p>
            <p className="flex items-center justify-between gap-3 py-1"><span className="text-[#8a8073]">{t('accountOrders.paymentMethod')}</span><span className="text-[#2f2a24]">{order.paymentMethod || '—'}</span></p>
          </div>

          {order.shipments?.length ? (
            <div className="space-y-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">{t('accountOrders.shipments')}</h2>
              {order.shipments.map((row) => (
                <div key={row.id} className="rounded-xl border border-[#ebe6dc] bg-white px-3 py-2.5 text-xs text-[#6f6558]">
                  {row.images?.length ? (
                    <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                      {row.images.map((url) => (
                        <button key={url} type="button" className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[#ebe6dc] bg-[#fbfaf7] sm:h-24 sm:w-24" onClick={() => setShipZoom(url)}>
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    <p className="flex justify-between gap-3 sm:block"><span className="text-[#8a8073]">{t('accountOrders.shipmentStatus')}</span> <span className="text-[#2f2a24]">{t('accountOrders.shipped')}</span></p>
                    <p className="flex justify-between gap-3 sm:block"><span className="text-[#8a8073]">{t('accountOrders.shippedAt')}</span> <span className="text-[#2f2a24]">{row.shippedAt ? new Date(row.shippedAt).toLocaleDateString(locale) : '—'}</span></p>
                    <p className="flex justify-between gap-3 sm:block"><span className="text-[#8a8073]">{t('accountOrders.channel')}</span> <span className="text-[#2f2a24]">{row.channel || '—'}</span></p>
                    <p className="flex justify-between gap-3 sm:col-span-2 sm:block">
                      <span className="text-[#8a8073]">{t('accountOrders.trackingNo')}</span>{' '}
                      {row.trackingNumber ? (
                        <a href={`https://www.17track.net/en/track?nums=${encodeURIComponent(row.trackingNumber)}`} target="_blank" rel="noreferrer" className="break-all font-medium text-sky-700 underline-offset-2 hover:underline">{row.trackingNumber}</a>
                      ) : <span>—</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

        </div>
      )}

      {shipZoom ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={() => setShipZoom('')}>
          <button type="button" className="absolute right-4 top-4 rounded-md bg-white px-3 py-1.5 text-sm text-slate-900" onClick={() => setShipZoom('')}>{t('accountOrders.closePhoto')}</button>
          <img src={shipZoom} alt="" className="max-h-[92vh] max-w-[94vw] object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </AccountShell>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ebe6dc] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#8a8073]">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-[#2f2a24]">{value}</p>
    </div>
  )
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex max-w-full items-center bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
      <span className="mr-1 opacity-70">{label}:</span>
      <span className="truncate text-[#0F172A] normal-case max-w-[140px]">{value}</span>
    </div>
  )
}

function OrderItemRow({
  item,
  currencyCode,
  discountRate,
  onOpenProduct,
}: {
  item: CustomerOrderItem
  currencyCode: string
  discountRate: number
  onOpenProduct: () => void
}) {
  const { t } = useTranslation()
  const thumbSrc = item.imageUrl || item.mainImageUrl || undefined
  const rate = Number.isFinite(discountRate) ? discountRate : 1
  const discountUnit = Math.round(item.unitPrice * rate * 100) / 100
  const discountLine = Math.round(item.lineAmount * rate * 100) / 100

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-2 border-b border-[#f0f0f0] py-2 last:border-b-0 sm:grid-cols-[96px_minmax(0,1fr)_8.75rem_5.25rem] sm:items-center sm:gap-3 sm:py-3">
      <button
        type="button"
        onClick={onOpenProduct}
        className="relative h-11 w-11 shrink-0 overflow-hidden bg-[#F1F5F9] sm:h-24 sm:w-24"
        aria-label={item.productName}
      >
        <EditableImg
          propKey={`order-item-img-${item.itemId}`}
          src={thumbSrc}
          keywords={thumbSrc || item.productName}
          fallbackSrc={item.mainImageUrl || undefined}
          disableKeywordSearch
          className="pointer-events-none h-full w-full object-contain"
        />
      </button>
      <div className="min-w-0">
        <button
          type="button"
          onClick={onOpenProduct}
          className="line-clamp-2 text-left text-[11px] font-medium leading-4 text-[#0F172A] sm:text-sm sm:leading-5"
        >
          {item.productName}
        </button>
        <p className="mt-0.5 truncate text-[10px] leading-3 text-[#64748B]">
          {[item.skuCode && !item.skuCode.startsWith('ADD-') ? `SKU ${item.skuCode}` : '', item.materialLabel, item.sizeLabel].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[11px] font-semibold leading-4 text-[#0F172A] sm:text-xs">{currencyCode} {discountUnit.toFixed(2)}</p>
        <div className="mt-1 flex items-start justify-between gap-2 sm:hidden">
          <div className="min-w-0 text-[10px] leading-3 text-[#6b5e52]">
            <p>{t(`accountOrders.inboundStages.${item.inboundStage === 'FACTORY' ? 'TRANSIT' : (item.inboundStage || 'PENDING')}`)}</p>
            <p className="mt-0.5">{t('accountOrders.inStockCount', { arrived: item.inboundQty || 0, ordered: item.quantity })}</p>
          </div>
          <div className="shrink-0 text-right text-[11px] leading-4 text-[#64748B]">
            <p>×{item.quantity}</p>
            <p className="font-medium text-[#0F172A]">{currencyCode} {discountLine.toFixed(2)}</p>
          </div>
        </div>
      </div>
      <div className="hidden flex-col items-center justify-center text-center sm:flex">
        <span className="inline-flex max-w-[8.5rem] items-center justify-center rounded-full border border-[#eadfce] bg-[#fbfaf7] px-2 py-0.5 text-center text-[11px] font-medium leading-4 text-[#6b5e52]">
          {t(`accountOrders.inboundStages.${item.inboundStage === 'FACTORY' ? 'TRANSIT' : (item.inboundStage || 'PENDING')}`)}
        </span>
        <p className="mt-0.5 text-[11px] leading-4 text-[#6b5e52]">{t('accountOrders.inStockCount', { arrived: item.inboundQty || 0, ordered: item.quantity })}</p>
      </div>
      <div className="hidden text-right text-xs leading-4 text-[#64748B] sm:block">
        <p>×{item.quantity}</p>
        <p className="font-medium text-[#0F172A]">{currencyCode} {discountLine.toFixed(2)}</p>
      </div>
    </div>
  )

}
