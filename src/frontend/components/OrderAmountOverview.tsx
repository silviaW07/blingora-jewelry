'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  computeCheckoutTotals,
  formatCartWeight,
  formatUsd,
  type CheckoutSummaryInput,
} from '@/shared/checkoutSummary'

type Props = CheckoutSummaryInput & {
  totalWeightGram: number
  className?: string
}

/**
 * 购物车 / 结账右侧金额摘要：原价 → 折扣 → 重量 → 预估运费 → 合计
 */
export function OrderAmountOverview({
  originalPriceUsd,
  discountUsd,
  shippingFeeUsd,
  totalWeightGram,
  className = '',
}: Props) {
  const { t } = useTranslation()
  const totals = computeCheckoutTotals({
    originalPriceUsd,
    discountUsd,
    shippingFeeUsd,
  })

  const shippingLabel =
    totals.shippingFeeUsd != null
      ? formatUsd(totals.shippingFeeUsd)
      : t('checkout.calculatedAtCheckout')

  return (
    <div
      className={`space-y-2 rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 ${className}`}
      data-controller-name="Order amount overview"
    >
      <p className="pb-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
        {t('checkout.orderAmountOverview')}
      </p>

      <div className="flex items-center justify-between gap-3 font-body text-sm text-[#64748B]">
        <span className="shrink-0">{t('checkout.originalPrice')}</span>
        <span className="font-medium text-[#0F172A]">{formatUsd(totals.originalPriceUsd)}</span>
      </div>

      {totals.discountUsd > 0 ? (
        <div className="flex items-center justify-between gap-3 font-body text-sm text-[#16A34A]">
          <span className="shrink-0">{t('checkout.discount')}</span>
          <span className="font-medium">-{formatUsd(totals.discountUsd)}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 font-body text-sm text-[#64748B]">
        <span className="shrink-0">{t('checkout.weight')}</span>
        <span className="font-medium text-[#0F172A]">{formatCartWeight(totalWeightGram)}</span>
      </div>

      <div className="flex items-center justify-between gap-3 font-body text-sm text-[#64748B]">
        <span className="shrink-0">{t('checkout.estimatedShipping')}</span>
        <span className="max-w-[58%] text-right font-medium text-[#0F172A]">{shippingLabel}</span>
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-[#e8e8e8] pt-2">
        <span className="font-body text-sm font-semibold text-[#0F172A]">{t('checkout.total')}</span>
        <span className="font-display text-xl font-extrabold tracking-tight text-[#0F172A]">
          {formatUsd(totals.totalUsd)}
        </span>
      </div>
    </div>
  )
}
