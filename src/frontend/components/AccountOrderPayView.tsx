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

export default function AccountOrderPayView() {
  const router = useRouter()
  const searchParams = useClientSearchParams()
  const { t } = useTranslation()

  const { orderId } = useMemo(() => AccountOrderPay.getParams(searchParams), [searchParams])
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<CustomerOrderSummary | null>(null)

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

            <div className="rounded-xl bg-[#fbfaf7] p-4 text-sm text-[#6f6558]">
              <p className="font-medium text-[#2f2a24]">{t('accountOrders.payNow')}</p>
              <p className="mt-1">
                This is a placeholder payment page for wiring later. It’s safe to navigate here from “My Orders”.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-full bg-[#f254a6] text-white hover:bg-[#df3f91]"
                onClick={() => toast.message('Payment flow not wired yet.')}
              >
                {t('accountOrders.payNow')}
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

