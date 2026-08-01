'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { getCategoryTopPromotion, type CategoryTopPromotionConfig } from '@/frontend/actions/ProductCategory'
import {
  computeTopPromotionCountdown,
  resolveTopPromotionFontSizePx,
  type TopPromotionCountdownParts,
} from '@/shared/topPromotionBannerConfig'

function CountdownBlock({ value, unit }: { value: string; unit: string }) {
  return (
    <span className="inline-flex min-w-[2.75rem] flex-col items-center justify-center rounded-sm bg-black px-2 py-1 text-white shadow-sm">
      <span className="font-mono text-[13px] font-bold leading-none tracking-wide sm:text-sm">{value}</span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-white/80">{unit}</span>
    </span>
  )
}

function CountdownRow({ parts }: { parts: TopPromotionCountdownParts }) {
  const items: Array<{ value: string; unit: string }> = [
    { value: parts.days, unit: 'D' },
    { value: parts.hours, unit: 'H' },
    { value: parts.minutes, unit: 'M' },
    { value: parts.seconds, unit: 'S' },
  ]
  return (
    <div className="flex shrink-0 items-center gap-1.5" aria-label="促销倒计时" data-controller-name="顶部促销倒计时块">
      {items.map((item, index) => (
        <React.Fragment key={item.unit}>
          {index > 0 ? <span className="px-0.5 text-sm font-bold opacity-80">:</span> : null}
          <CountdownBlock value={item.value} unit={item.unit} />
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * 站点最顶部促销通栏：与主内容同宽（storefront-container），
 * 支持字号自适应高度；配置结束时间时右侧展示黑底白字倒计时块。
 */
export default function TopPromotionBanner() {
  const [promotion, setPromotion] = useState<CategoryTopPromotionConfig | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    getCategoryTopPromotion()
      .then((res) => {
        if (!cancelled) setPromotion(res.promotion)
      })
      .catch(() => {
        if (!cancelled) setPromotion(null)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!promotion?.enabled || !promotion.end_time) return
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [promotion?.enabled, promotion?.end_time])

  const countdown = useMemo(
    () => computeTopPromotionCountdown(promotion?.end_time, nowMs),
    [promotion?.end_time, nowMs],
  )

  if (!loaded || !promotion?.enabled) return null
  if (countdown.hasEndTime && countdown.isEnded) return null

  const backgroundColor = promotion.background_color?.trim() || '#111827'
  const textColor = promotion.text_color?.trim() || '#FFFFFF'
  const message = promotion.message?.trim() || ''
  const fontSizePx = resolveTopPromotionFontSizePx(promotion.font_size ?? 'md')
  const showCountdown = countdown.hasEndTime && !countdown.isEnded

  return (
    <div
      className="sticky top-0 z-50 w-full"
      data-controller-name="站点顶部促销横幅"
      style={{ backgroundColor, color: textColor }}
    >
      <div
        className="storefront-container flex w-full items-center gap-3 py-2.5 sm:gap-4 sm:py-3"
        style={{ fontSize: `${fontSizePx}px` }}
      >
        <div className="min-w-0 flex-1 text-center font-bold leading-snug" style={{ fontWeight: 700 }}>
          {message || 'Exclusive offer is now live.'}
        </div>
        {showCountdown ? <CountdownRow parts={countdown.parts} /> : null}
      </div>
    </div>
  )
}
