'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { getCategoryTopPromotion, type CategoryTopPromotionConfig } from '@/frontend/actions/ProductCategory'
import {
  computeTopPromotionCountdown,
  resolveTopPromotionFontSizePx,
  type TopPromotionCountdownParts,
} from '@/shared/topPromotionBannerConfig'
import { cn } from '@/lib/utils'

function CountdownBlock({
  value,
  unit,
  compact,
}: {
  value: string
  unit: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <span className="inline-flex items-baseline gap-0.5 font-mono text-[11px] font-bold tabular-nums leading-none">
        <span>{value}</span>
        <span className="text-[9px] font-semibold uppercase opacity-70">{unit}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex min-w-[2.75rem] flex-col items-center justify-center rounded-sm bg-black px-2 py-1 text-white shadow-sm">
      <span className="font-mono text-[13px] font-bold leading-none tracking-wide sm:text-sm">{value}</span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-white/80">
        {unit}
      </span>
    </span>
  )
}

function CountdownRow({ parts, compact }: { parts: TopPromotionCountdownParts; compact?: boolean }) {
  const items: Array<{ value: string; unit: string }> = [
    { value: parts.days, unit: 'D' },
    { value: parts.hours, unit: 'H' },
    { value: parts.minutes, unit: 'M' },
    { value: parts.seconds, unit: 'S' },
  ]
  return (
    <div
      className={cn(
        'flex shrink-0 items-center',
        compact ? 'gap-1' : 'gap-1.5',
      )}
      aria-label="促销倒计时"
      data-controller-name="顶部促销倒计时块"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.unit}>
          {index > 0 ? (
            <span className={cn('font-bold opacity-70', compact ? 'text-[10px] px-0' : 'px-0.5 text-sm')}>
              :
            </span>
          ) : null}
          <CountdownBlock value={item.value} unit={item.unit} compact={compact} />
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * 站点最顶部促销通栏：桌面保持原高度；
 * 手机端压成约 32px 窄条，淡底 + 内联倒计时，不占首屏大面积。
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

  // Strict backend gate: no pink strip when disabled, expired, missing, or empty message
  if (!loaded) return null
  if (!promotion?.enabled) return null
  if (countdown.hasEndTime && countdown.isEnded) return null

  const message = promotion.message?.trim() || ''
  if (!message) return null

  const backgroundColor = promotion.background_color?.trim() || '#111827'
  const textColor = promotion.text_color?.trim() || '#FFFFFF'
  const fontSizePx = resolveTopPromotionFontSizePx(promotion.font_size ?? 'md')
  const showCountdown = countdown.hasEndTime && !countdown.isEnded

  return (
    <>
      {/* Mobile: slim strip (~32px); text truly centered, countdown absolute so it doesn't shift copy */}
      <div
        className="top-promo-mobile sticky top-0 z-50 w-full md:hidden"
        data-controller-name="站点顶部促销横幅"
        style={{
          backgroundColor: softMobileBg(backgroundColor),
          color: softMobileFg(textColor, backgroundColor),
        }}
      >
        <div className="relative mx-auto flex h-8 max-w-[1440px] items-center justify-center overflow-hidden px-3 text-[11px] font-semibold leading-none">
          <div
            className={cn(
              'min-w-0 max-w-full truncate text-center',
              showCountdown ? 'px-14' : null,
            )}
            style={{ fontWeight: 600 }}
          >
            {message}
          </div>
          {showCountdown ? (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <CountdownRow parts={countdown.parts} compact />
            </div>
          ) : null}
        </div>
      </div>

      {/* Desktop: original presentation */}
      <div
        className="sticky top-0 z-50 hidden w-full md:block"
        data-controller-name="站点顶部促销横幅"
        style={{ backgroundColor, color: textColor }}
      >
        <div
          className="storefront-container flex w-full items-center gap-3 py-2.5 sm:gap-4 sm:py-3"
          style={{ fontSize: `${fontSizePx}px` }}
        >
          <div className="min-w-0 flex-1 text-center font-bold leading-snug" style={{ fontWeight: 700 }}>
            {message}
          </div>
          {showCountdown ? <CountdownRow parts={countdown.parts} /> : null}
        </div>
      </div>
    </>
  )
}

/** Light / translucent strip on phones so it doesn't block the home hero */
function softMobileBg(hex: string): string {
  const h = hex.trim()
  // If already translucent, keep
  if (h.startsWith('rgba') || h.startsWith('hsla')) return h
  // Soft pink / light default if dark brand bar
  if (isDarkHex(h)) return 'rgba(242, 84, 166, 0.12)'
  return h
}

function softMobileFg(textColor: string, bg: string): string {
  if (isDarkHex(bg)) return '#b83278'
  return textColor?.trim() || '#333333'
}

function isDarkHex(hex: string): boolean {
  const m = hex.trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i)
  if (!m) return true
  let raw = m[1]
  if (raw.length === 3) {
    raw = raw
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  // relative luminance threshold
  return (0.299 * r + 0.587 * g + 0.114 * b) < 140
}
