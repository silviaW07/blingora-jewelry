'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeDollarSign, CheckCircle2, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { CheckoutTopBar } from '@/frontend/components/CheckoutTopBar'
import { CheckoutSmartPanel, type CheckoutAddressForm } from '@/frontend/components/CheckoutSmartPanel'
import { OrderAmountOverview } from '@/frontend/components/OrderAmountOverview'
import type { CartState, CartHandlers } from '@/frontend/hooks/useCart'
import { placeCheckoutOrder } from '@/frontend/actions/CheckoutOrder'
import { AccountOrders, Cart } from '@/frontend/route-params'
import { computeCheckoutTotals, sumCartWeightGram } from '@/shared/checkoutSummary'
import { getCustomerServiceConfig } from '@/frontend/actions/CustomerService'
import {
  buildWhatsAppUrl,
  readCustomerServiceLocal,
  writeCustomerServiceLocal,
  type CustomerServiceConfig,
  DEFAULT_CUSTOMER_SERVICE_CONFIG,
} from '@/frontend/decorate/customerService'
import { buildPaypalPayUrl } from '@/shared/paypalPayUrl'

interface Props {
  state: CartState
  handlers: CartHandlers
}

/**
 * Address + shipping checkout step (reached from mobile cart Checkout CTA).
 */
export default function CheckoutView({ state, handlers }: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [checkoutAddress, setCheckoutAddress] = useState<CheckoutAddressForm | null>(null)
  const [selectedShippingFee, setSelectedShippingFee] = useState<number | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [selectedChannelName, setSelectedChannelName] = useState<string | null>(null)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [placedOrderNo, setPlacedOrderNo] = useState('')
  const [placedAmount, setPlacedAmount] = useState(0)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
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
    if (!state.loading && state.isEmpty && !isSuccessOpen) {
      router.replace(Cart.path)
    }
  }, [isSuccessOpen, router, state.isEmpty, state.loading])

  const checkoutTotals = useMemo(() => {
    if (!state.summary) {
      return computeCheckoutTotals({
        originalPriceUsd: 0,
        discountUsd: 0,
        shippingFeeUsd: null,
      })
    }
    return computeCheckoutTotals({
      originalPriceUsd: Number(state.summary.totalPrice) || 0,
      discountUsd: Number(state.summary.discount) || 0,
      shippingFeeUsd: selectedShippingFee,
    })
  }, [selectedShippingFee, state.summary])

  const payableAmountValue = checkoutTotals.totalUsd

  const totalWeightGram = useMemo(
    () => sumCartWeightGram(state.items, state.summary?.totalWeightGram),
    [state.items, state.summary?.totalWeightGram],
  )

  const cartTotalWeightKg = useMemo(() => {
    if (!Number.isFinite(totalWeightGram) || totalWeightGram <= 0) return 0
    return totalWeightGram / 1000
  }, [totalWeightGram])

  const whatsappOrderUrl = useMemo(
    () =>
      buildWhatsAppUrl(
        customerService.whatsappNumber || DEFAULT_CUSTOMER_SERVICE_CONFIG.whatsappNumber,
        placedOrderNo ? `Order #: ${placedOrderNo}` : undefined,
      ) || `https://wa.me/${DEFAULT_CUSTOMER_SERVICE_CONFIG.whatsappNumber}`,
    [customerService.whatsappNumber, placedOrderNo],
  )

  const paypalPayUrl = useMemo(
    () =>
      buildPaypalPayUrl({
        baseLink: customerService.paypalLink,
        amount: placedAmount,
        currency: 'USD',
        itemName: placedOrderNo ? `Order ${placedOrderNo}` : 'Order',
      }),
    [customerService.paypalLink, placedAmount, placedOrderNo],
  )

  const handlePlaceOrder = async () => {
    if (!checkoutAddress) {
      toast.error(t('checkout.saveAddressFirst', { defaultValue: 'Please fill in your shipping address' }))
      return
    }
    if (!selectedChannelId || selectedShippingFee == null) {
      toast.error(t('checkout.noChannels', { defaultValue: '请选择物流渠道' }))
      return
    }
    const validItems = state.items.filter((item) => item.status !== 'INVALID')
    if (validItems.length === 0) {
      toast.error(t('common.placeOrder', { defaultValue: '没有可下单的商品' }))
      return
    }

    setIsPlacingOrder(true)
    try {
      const result = await placeCheckoutOrder({
        address: checkoutAddress,
        shipping: {
          channelId: selectedChannelId,
          channelName: selectedChannelName || 'Shipping',
          shippingFee: selectedShippingFee,
        },
        items: validItems.map((item) => ({
          productId: item.productId,
          productSkuId: item.productSkuId,
          quantity: item.quantity,
          productName: item.productName,
          unitPrice: item.price,
        })),
        finalAmount: payableAmountValue,
        currencyCode: 'USD',
      })

      setPlacedOrderNo(result.orderNo)
      setPlacedAmount(Number(result.totalAmount) || payableAmountValue)
      setIsSuccessOpen(true)
      await handlers.handleClearCartAfterOrder().catch(() => undefined)
      setAddressConfirmed(false)
      setCheckoutAddress(null)
      setSelectedShippingFee(null)
      setSelectedChannelId(null)
      setSelectedChannelName(null)
    } catch (error) {
      toast.error((error as Error).message || '下单失败，请稍后重试')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  return (
    <>
      <CheckoutTopBar />
      <main
        className="mobile-checkout-page relative w-full min-h-screen bg-[#FFF5F5]"
        data-controller-name="结算页地址物流"
      >
        <div className="storefront-container py-4 md:py-6">
          <button
            type="button"
            onClick={() => router.push(Cart.path)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f254a6] hover:underline"
          >
            <ArrowLeft className="size-4" />
            {t('common.cart', { defaultValue: 'Cart' })}
          </button>

          {state.loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="size-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#f254a6]" />
              <p className="mt-4 text-sm text-[#64748B]">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="mx-auto max-w-lg rounded-[12px] border border-[#f0dede] bg-white">
              <div className="flex items-start justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748B]">
                    {t('checkout.smartCheckout')}
                  </p>
                  <h1 className="mt-1 font-header text-lg font-bold text-[#0F172A]">
                    {t('checkout.fillAddress', { defaultValue: 'Address & shipping' })}
                  </h1>
                </div>
                <div className="flex size-9 items-center justify-center rounded-full bg-[#fff0f5] text-[#f254a6]">
                  <BadgeDollarSign className="size-4" />
                </div>
              </div>

              <div className="space-y-3 px-4 pb-4">
                <OrderAmountOverview
                  originalPriceUsd={checkoutTotals.originalPriceUsd}
                  discountUsd={checkoutTotals.discountUsd}
                  shippingFeeUsd={selectedShippingFee}
                  totalWeightGram={totalWeightGram}
                />

                <CheckoutSmartPanel
                  disabled={state.actionLoading || state.isEmpty || isPlacingOrder}
                  totalWeightKg={cartTotalWeightKg}
                  onConfirmedChange={setAddressConfirmed}
                  onConfirmAddress={({ address }) => {
                    setCheckoutAddress(address)
                  }}
                  onShippingChange={({ channelId, channelName, shippingFee }) => {
                    setSelectedChannelId(channelId)
                    setSelectedChannelName(channelName)
                    setSelectedShippingFee(shippingFee)
                  }}
                />

                <Button
                  type="button"
                  disabled={
                    state.actionLoading ||
                    isPlacingOrder ||
                    state.isEmpty ||
                    state.hasInvalidItems ||
                    !addressConfirmed ||
                    !checkoutAddress ||
                    !selectedChannelId ||
                    selectedShippingFee == null
                  }
                  onClick={() => void handlePlaceOrder()}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#f254a6] py-5 text-base font-bold text-white hover:bg-[#e44798] disabled:opacity-50"
                >
                  <DecorateText propKey="cart_place_order_btn" as="span">
                    {isPlacingOrder ? t('common.submitting') : t('common.placeOrder')}
                  </DecorateText>
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="w-[min(500px,calc(100%-2rem))] max-w-[500px] rounded-[20px] border border-[#f0dede] bg-white p-10 shadow-xl sm:max-w-[500px]">
          <DialogHeader className="space-y-4 text-center sm:text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#ecfdf5] text-[#16a34a]">
              <CheckCircle2 className="size-9" strokeWidth={2.25} />
            </div>
            <DialogTitle className="font-header text-3xl font-bold text-[#0F172A]">
              <DecorateText propKey="checkout_success_title" as="span">
                Checkout Success!
              </DecorateText>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Order placed successfully.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            <div className="flex flex-col items-center gap-3">
              <p className="font-body text-base font-semibold text-[#0F172A]">
                Order #: {placedOrderNo || '—'}
              </p>
              {placedAmount > 0 ? (
                <p className="font-body text-lg font-bold text-[#111111]">
                  US$ {placedAmount.toFixed(2)}
                </p>
              ) : null}
              <div className="w-full rounded-[14px] border border-[#e8e8e8] bg-[#fafafa] px-5 py-4 text-center">
                <p className="font-body text-sm leading-7 text-[#475569]">
                  <DecorateText propKey="checkout_success_whatsapp_guide" as="span">
                    {customerService.successGuideText ||
                      DEFAULT_CUSTOMER_SERVICE_CONFIG.successGuideText}
                  </DecorateText>
                </p>
                <a
                  href={whatsappOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="size-7" strokeWidth={2.25} />
                </a>
              </div>
              <Button
                type="button"
                className="h-11 w-full rounded-[10px] bg-[#0070ba] px-5 text-sm font-bold text-white hover:bg-[#005ea6]"
                onClick={() => {
                  if (paypalPayUrl) {
                    window.open(paypalPayUrl, '_blank', 'noopener,noreferrer')
                    return
                  }
                  toast.error('Please set a PayPal link in customer-service settings.')
                }}
              >
                {t('accountOrders.payNow')} · PayPal
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full rounded-[10px] font-bold text-[#f254a6] hover:bg-[#fff0f5]"
              onClick={() => {
                setIsSuccessOpen(false)
                AccountOrders.navigateTo(router)
              }}
            >
              {t('common.viewOrders')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
