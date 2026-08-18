'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClientSearchParams } from '@/frontend/utils/useClientSearchParams'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountShell } from '@/frontend/components/AccountShell'
import { getCustomerOrderDetail } from '@/frontend/actions/AccountCenter'
import type { CustomerOrderSummary } from '@/frontend/actions/AccountCenter'
import { AccountOrderPay, AccountOrders } from '@/frontend/route-params'
import { getCustomerServiceConfig } from '@/frontend/actions/CustomerService'
import {
  DEFAULT_CUSTOMER_SERVICE_CONFIG,
  readCustomerServiceLocal,
  writeCustomerServiceLocal,
  type CustomerServiceConfig,
} from '@/frontend/decorate/customerService'
import { buildPaypalPayUrl } from '@/shared/paypalPayUrl'
import { formatUsd } from '@/shared/money'

export default function AccountOrderPayView() {
  const router = useRouter()
  const searchParams = useClientSearchParams()
  const { t } = useTranslation()

  const { orderId } = useMemo(() => AccountOrderPay.getParams(searchParams), [searchParams])
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<CustomerOrderSummary | null>(null)
  const [customerService, setCustomerService] = useState<CustomerServiceConfig>(() =>
    readCustomerServiceLocal(),
  )

  useEffect(() => {
    let cancelled = false
    getCustomerServiceConfig()
      .then((res) => {
        if (cancelled) return
        if (res.persisted) {
          setCustomerService(res.config)
          writeCustomerServiceLocal(res.config)
        } else {
          setCustomerService(readCustomerServiceLocal())
        }
      })
      .catch(() => {
        if (!cancelled) setCustomerService(readCustomerServiceLocal())
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const detail = await getCustomerOrderDetail(orderId)
        if (!cancelled) setOrder(detail)
      } catch (error) {
        if (!cancelled) {
          toast.error((error as Error).message || t('accountOrders.loadFailed'))
          setOrder(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orderId, t])

  const paypalPayUrl = useMemo(
    () =>
      order
        ? buildPaypalPayUrl({
            baseLink: customerService.paypalLink || DEFAULT_CUSTOMER_SERVICE_CONFIG.paypalLink,
            amount: Number(order.totalAmount) || 0,
            currency: order.currencyCode || 'USD',
            itemName: `Order ${order.orderNo}`,
          })
        : null,
    [customerService.paypalLink, order],
  )

  const handlePay = () => {
    if (!paypalPayUrl) {
      toast.error('Please set a PayPal link in customer-service settings.')
      return
    }
    window.open(paypalPayUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <AccountShell
      title={t('accountOrders.paymentMethod')}
      description={t('accountOrders.description')}
    >
      <button
        type="button"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-[#2f2a24] hover:text-[#f254a6]"
        onClick={() => AccountOrders.navigateTo(router)}
      >
        <ArrowLeft className="size-4" />
        {t('accountOrders.backToOrders')}
      </button>

      <div className="rounded-2xl border border-[#ebe6dc] bg-white p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#7a756c]">
            <Loader2 className="size-4 animate-spin" />
            {t('accountOrders.loading')}
          </div>
        ) : !orderId ? (
          <p className="text-sm text-[#6f6558]">Missing orderId.</p>
        ) : !order ? (
          <p className="text-sm text-[#6f6558]">{t('accountOrders.notFound')}</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[#8a8073]">{t('accountOrders.orderNumber')}</p>
              <p className="mt-1 text-lg font-semibold text-[#1f1a14]">{order.orderNo}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[#8a8073]">{t('accountOrders.payNow')}</p>
              <p className="mt-1 text-2xl font-bold text-[#111111]">
                {formatUsd(Number(order.totalAmount) || 0)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-full bg-[#0070ba] text-white hover:bg-[#005ea6]"
                onClick={handlePay}
              >
                {t('accountOrders.payNow')} · PayPal
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => AccountOrders.navigateTo(router)}
              >
                {t('accountOrders.backToOrders')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AccountShell>
  )
}
