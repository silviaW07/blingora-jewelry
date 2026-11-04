'use client'

import React from 'react'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatUsd } from '@/shared/checkoutSummary'
import { nextFirstOrderGap } from '@/shared/pricingPromotionCalc'

type Tier = { thresholdUsd: number; value: number }

export function FirstOrderLadder({
  tiers,
  mode,
  subtotalUsd,
}: {
  tiers: Tier[]
  mode: 'PERCENT' | 'AMOUNT' | null
  subtotalUsd: number
}) {
  const { t } = useTranslation()
  const goals = [...tiers]
    .filter((tier) => tier.thresholdUsd > 0 && tier.value > 0)
    .sort((a, b) => a.thresholdUsd - b.thresholdUsd)
  if (!goals.length) return null
  const base = [...tiers]
    .filter((tier) => tier.value > 0 && tier.thresholdUsd <= 0)
    .sort((a, b) => a.value - b.value)[0]
  const points = base ? [base, ...goals] : goals
  const max = goals[goals.length - 1].thresholdUsd
  const progress = Math.max(0, Math.min(1, subtotalUsd / max))
  const next = nextFirstOrderGap(goals, subtotalUsd)
  const reached = [...points].reverse().find((tier) => subtotalUsd + 0.001 >= tier.thresholdUsd)

  const rateLabel = (value: number) => {
    if (mode === 'AMOUNT') return formatUsd(value)
    const percent = Math.round((1 - value) * 1000) / 10
    return t('checkout.tierOff', { percent })
  }

  return (
    <div className="rounded-[12px] border border-[#f0dede] bg-white px-3 py-3">
      <p className="text-center text-sm font-semibold text-[#0F172A]">
        {next
          ? t('checkout.nextFirstOrder', { amount: formatUsd(next.gapUsd), value: rateLabel(next.value) })
          : t('checkout.firstOrderBest', { value: rateLabel(reached?.value ?? goals[goals.length - 1].value) })}
      </p>
      <div className="relative mt-8 mb-9 px-1">
        <div className="relative h-1.5 rounded-full bg-[#e7e5e4]">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[#111111]" style={{ width: `${progress * 100}%` }} />
          {reached ? (
            <div
              className="absolute -top-7 max-w-[120px] -translate-x-1/2 text-center text-[11px] font-semibold leading-tight text-[#0F172A]"
              style={{ left: `${progress * 100}%` }}
            >
              {rateLabel(reached.value)}
            </div>
          ) : null}
          {points.map((tier) => {
            const ratio = max > 0 ? tier.thresholdUsd / max : 0
            const open = subtotalUsd + 0.001 >= tier.thresholdUsd
            const align = ratio <= 0 ? 'translateX(0)' : ratio >= 1 ? 'translateX(-100%)' : 'translateX(-50%)'
            return (
              <div
                key={`${tier.thresholdUsd}-${tier.value}`}
                className="absolute top-1/2"
                style={{ left: `${ratio * 100}%`, transform: `translateY(-50%) ${align}` }}
              >
                <div className="flex flex-col items-center">
                  <div className={`flex size-5 items-center justify-center rounded-full border ${open ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#d6d3d1] bg-white text-[#a8a29e]'}`}>
                    {open ? <span className="size-1.5 rounded-full bg-white" /> : <Lock className="size-3" />}
                  </div>
                </div>
                <div className="absolute left-1/2 top-6 w-max -translate-x-1/2 text-center">
                  <p className="text-[11px] font-semibold text-[#0F172A]">{rateLabel(tier.value)}</p>
                  <p className="text-[11px] text-[#78716c]">{formatUsd(tier.thresholdUsd)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
