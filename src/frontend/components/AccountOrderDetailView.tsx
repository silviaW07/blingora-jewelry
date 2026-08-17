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

export default function AccountOrderDetailView() {
  const searchParams = useClientSearchParams()
  const { t, i18n } = useTranslation()
  const { orderId } = AccountOrderDetail.getParams(searchParams)
  const [order, setOrder] = useState<CustomerOrderSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(false)

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
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-[#fbfaf7] p-5">
            <div>
              <p className="text-lg font-semibold text-[#1f1a14]">{order.orderNo}</p>
              <p className="mt-1 text-sm text-[#7a756c]">
                {new Date(order.createdAt).toLocaleString(locale)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{t(`accountOrders.statuses.${order.status}`)}</Badge>
              {order.status === 'PENDING_PAYMENT' ? (
                <a
                  {...hardNavProps(orderPayHref(order.orderId))}
                  className="inline-flex h-10 items-center rounded-full bg-[#f254a6] px-4 text-sm font-medium text-white hover:bg-[#df3f91]"
                >
                  {t('accountOrders.payNow')}
                </a>
              ) : null}
              <Button
                type="button"
                className="rounded-full bg-[#f254a6] text-white hover:bg-[#df3f91]"
                disabled={reordering}
                onClick={() => void handleReorder()}
              >
                {reordering && <Loader2 className="mr-1 size-4 animate-spin" />}
                {t('accountOrders.reorder')}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField label={t('accountOrders.total')} value={`${order.currencyCode} ${order.totalAmount.toFixed(2)}`} />
            <DetailField
              label={t('accountOrders.shippingMethod')}
              value={order.trackingCarrier || t(`accountOrders.shipMethods.${order.shipMethod}`)}
            />
            <DetailField
              label={t('accountOrders.weight')}
              value={order.totalWeightGrams > 0
                ? t('accountOrders.weightValue', { weight: order.totalWeightGrams.toLocaleString(locale) })
                : '—'}
            />
            <DetailField label={t('accountOrders.paymentMethod')} value={order.paymentMethod || '—'} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-[#1f1a14]">{t('accountOrders.items')}</h2>
            <div className="overflow-hidden rounded-2xl border border-[#ebe6dc] bg-white px-3 sm:px-4">
              {order.items.map((item) => (
                <OrderItemRow
                  key={item.itemId}
                  item={item}
                  currencyCode={order.currencyCode}
                  onOpenProduct={() => hardNavigate(productHref(item.productId))}
                />
              ))}
            </div>
          </div>

          <DetailField label={t('accountOrders.comment')} value={order.internalNote || '—'} />
        </div>
      )}
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
  onOpenProduct,
}: {
  item: CustomerOrderItem
  currencyCode: string
  onOpenProduct: () => void
}) {
  const { t } = useTranslation()
  const thumbSrc = item.imageUrl || item.mainImageUrl || undefined

  return (
    <div className="border-b border-[#f0f0f0] py-4 last:border-b-0">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
        <div className="flex items-start justify-center sm:justify-start">
          <button
            type="button"
            onClick={onOpenProduct}
            className="relative aspect-square w-full max-w-[96px] shrink-0 cursor-pointer overflow-hidden bg-[#F1F5F9] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f254a6]/40"
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
        </div>

        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-1.5">
              <h3 className="text-base font-semibold leading-snug text-[#0F172A]">
                <button
                  type="button"
                  onClick={onOpenProduct}
                  className="text-left transition-colors hover:text-[#f254a6] hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f254a6]/40"
                >
                  {item.productName}
                </button>
              </h3>

              <div className="flex flex-wrap gap-1.5">
                {item.skuCode ? <SpecChip label="SKU" value={item.skuCode} /> : null}
                {item.materialLabel ? (
                  <SpecChip label={t('common.color')} value={item.materialLabel} />
                ) : null}
                {item.sizeLabel ? (
                  <SpecChip label={t('common.size')} value={item.sizeLabel} />
                ) : null}
              </div>

              <p className="text-sm font-bold text-[#0F172A]">
                {currencyCode} {item.unitPrice.toFixed(2)}
              </p>
            </div>

            <div className="shrink-0 text-sm text-[#64748B] xl:text-right">
              <p>×{item.quantity}</p>
              <p className="mt-1 font-medium text-[#0F172A]">
                {currencyCode} {item.lineAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
