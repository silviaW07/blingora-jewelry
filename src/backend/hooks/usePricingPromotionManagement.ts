'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { PricingPromotionConfig } from '@/shared/pricingPromotionConfig'
import {
  DEFAULT_PRICING_PROMO_CONFIG,
  normalizePricingPromotionConfig,
  normalizePromoDateTime,
} from '@/shared/pricingPromotionConfig'
import type { TopPromotionBannerConfig, TopPromotionFontSizePreset } from '@/shared/topPromotionBannerConfig'
import {
  DEFAULT_TOP_PROMOTION_BANNER_CONFIG,
  normalizeTopPromotionBannerConfig,
  normalizeTopPromotionDateTime,
  normalizeTopPromotionFontSize,
} from '@/shared/topPromotionBannerConfig'
import {
  getPricingPromotionConfig,
  savePricingPromotionConfigAdmin,
} from '@/backend/actions/PricingPromotionManagement'

export interface PricingPromotionManagementState {
  loading: boolean
  submitting: boolean
  exchangeRate: number
  config: PricingPromotionConfig
  topBanner: TopPromotionBannerConfig
}

export interface PricingPromotionManagementHandlers {
  setExchangeRate: (value: number) => void
  setConfig: (next: PricingPromotionConfig) => void
  setWholesaleEnabled: (enabled: boolean) => void
  setWholesaleCoefficient: (value: number) => void
  setFirstOrderEnabled: (enabled: boolean) => void
  setFirstOrderMode: (mode: 'PERCENT' | 'AMOUNT') => void
  setFirstOrderValue: (value: number) => void
  setFirstOrderStartAt: (value: string) => void
  setFirstOrderEndAt: (value: string) => void
  setLoyalEnabled: (enabled: boolean) => void
  setLoyalCoefficient: (value: number) => void
  setLoyalStartAt: (value: string) => void
  setLoyalEndAt: (value: string) => void
  setFullReductionEnabled: (enabled: boolean) => void
  setFullReductionStartAt: (value: string) => void
  setFullReductionEndAt: (value: string) => void
  addFullReductionTier: () => void
  updateFullReductionTier: (index: number, patch: { thresholdUsd?: number; offUsd?: number }) => void
  removeFullReductionTier: (index: number) => void
  setSiteWideEnabled: (enabled: boolean) => void
  setSiteWideMode: (mode: 'PERCENT' | 'AMOUNT') => void
  setSiteWideValue: (value: number) => void
  setSiteWideStartAt: (value: string) => void
  setSiteWideEndAt: (value: string) => void
  setShippingPromoEnabled: (enabled: boolean) => void
  setShippingPromoMode: (mode: 'PERCENT' | 'AMOUNT') => void
  setShippingPromoValue: (value: number) => void
  setShippingPromoMinSubtotal: (value: number) => void
  setShippingPromoStartAt: (value: string) => void
  setShippingPromoEndAt: (value: string) => void
  setTopBannerEnabled: (enabled: boolean) => void
  setTopBannerMessage: (value: string) => void
  setTopBannerEndTime: (value: string) => void
  setTopBannerBackgroundColor: (value: string) => void
  setTopBannerTextColor: (value: string) => void
  setTopBannerFontSizePreset: (value: TopPromotionFontSizePreset | 'custom') => void
  setTopBannerFontSizePx: (value: number) => void
  reload: () => void
  save: () => Promise<void>
}

export function usePricingPromotionManagement(): {
  state: PricingPromotionManagementState
  handlers: PricingPromotionManagementHandlers
} {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exchangeRate, setExchangeRate] = useState(6.5)
  const [config, setConfig] = useState<PricingPromotionConfig>(DEFAULT_PRICING_PROMO_CONFIG)
  const [topBanner, setTopBanner] = useState<TopPromotionBannerConfig>(DEFAULT_TOP_PROMOTION_BANNER_CONFIG)

  const reload = useCallback(() => {
    setLoading(true)
    getPricingPromotionConfig()
      .then((res) => {
        setExchangeRate(Number(res.exchangeRate) || 6.5)
        setConfig(normalizePricingPromotionConfig(res.config))
        setTopBanner(normalizeTopPromotionBannerConfig(res.topBanner, res.topBanner?.enabled))
      })
      .catch((err: any) => toast.error(err?.message || '加载配置失败'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const save = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const normalized = normalizePricingPromotionConfig(config)
      const normalizedBanner = normalizeTopPromotionBannerConfig(topBanner, topBanner.enabled)
      const rate = Number(exchangeRate)
      const res = await savePricingPromotionConfigAdmin({
        exchangeRate: Number.isFinite(rate) ? rate : 6.5,
        config: normalized,
        topBanner: normalizedBanner,
      })
      setExchangeRate(Number(res.exchangeRate) || 6.5)
      setConfig(normalizePricingPromotionConfig(res.config))
      setTopBanner(normalizeTopPromotionBannerConfig(res.topBanner, res.topBanner?.enabled))
      toast.success('保存成功')
    } catch (err: any) {
      toast.error(err?.message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }, [config, exchangeRate, submitting, topBanner])

  const handlers: PricingPromotionManagementHandlers = useMemo(
    () => ({
      setExchangeRate,
      setConfig,
      setWholesaleEnabled: (enabled) =>
        setConfig((prev) => ({ ...prev, wholesale: { ...prev.wholesale, enabled } })),
      setWholesaleCoefficient: (value) =>
        setConfig((prev) => ({ ...prev, wholesale: { ...prev.wholesale, coefficient: value } })),
      setFirstOrderEnabled: (enabled) =>
        setConfig((prev) => ({ ...prev, firstOrder: { ...prev.firstOrder, enabled } })),
      setFirstOrderMode: (mode) =>
        setConfig((prev) => ({ ...prev, firstOrder: { ...prev.firstOrder, mode } })),
      setFirstOrderValue: (value) =>
        setConfig((prev) => ({ ...prev, firstOrder: { ...prev.firstOrder, value } })),
      setFirstOrderStartAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          firstOrder: { ...prev.firstOrder, startAt: normalizePromoDateTime(value) },
        })),
      setFirstOrderEndAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          firstOrder: { ...prev.firstOrder, endAt: normalizePromoDateTime(value) },
        })),
      setLoyalEnabled: (enabled) =>
        setConfig((prev) => ({ ...prev, loyal: { ...prev.loyal, enabled } })),
      setLoyalCoefficient: (value) =>
        setConfig((prev) => ({ ...prev, loyal: { ...prev.loyal, coefficient: value } })),
      setLoyalStartAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          loyal: { ...prev.loyal, startAt: normalizePromoDateTime(value) },
        })),
      setLoyalEndAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          loyal: { ...prev.loyal, endAt: normalizePromoDateTime(value) },
        })),
      setFullReductionEnabled: (enabled) =>
        setConfig((prev) => ({ ...prev, fullReduction: { ...prev.fullReduction, enabled } })),
      setFullReductionStartAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          fullReduction: { ...prev.fullReduction, startAt: normalizePromoDateTime(value) },
        })),
      setFullReductionEndAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          fullReduction: { ...prev.fullReduction, endAt: normalizePromoDateTime(value) },
        })),
      addFullReductionTier: () =>
        setConfig((prev) => ({
          ...prev,
          fullReduction: {
            ...prev.fullReduction,
            tiers: [...(prev.fullReduction.tiers || []), { thresholdUsd: 100, offUsd: 10 }],
          },
        })),
      updateFullReductionTier: (index, patch) =>
        setConfig((prev) => ({
          ...prev,
          fullReduction: {
            ...prev.fullReduction,
            tiers: (prev.fullReduction.tiers || []).map((tier, i) =>
              i === index ? { ...tier, ...patch } : tier,
            ),
          },
        })),
      removeFullReductionTier: (index) =>
        setConfig((prev) => ({
          ...prev,
          fullReduction: {
            ...prev.fullReduction,
            tiers: (prev.fullReduction.tiers || []).filter((_, i) => i !== index),
          },
        })),
      setSiteWideEnabled: (enabled) =>
        setConfig((prev) => ({ ...prev, siteWide: { ...prev.siteWide, enabled } })),
      setSiteWideMode: (mode) =>
        setConfig((prev) => ({ ...prev, siteWide: { ...prev.siteWide, mode } })),
      setSiteWideValue: (value) =>
        setConfig((prev) => ({ ...prev, siteWide: { ...prev.siteWide, value } })),
      setSiteWideStartAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          siteWide: { ...prev.siteWide, startAt: normalizePromoDateTime(value) },
        })),
      setSiteWideEndAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          siteWide: { ...prev.siteWide, endAt: normalizePromoDateTime(value) },
        })),
      setShippingPromoEnabled: (enabled) =>
        setConfig((prev) => ({ ...prev, shipping: { ...prev.shipping, enabled } })),
      setShippingPromoMode: (mode) =>
        setConfig((prev) => ({ ...prev, shipping: { ...prev.shipping, mode } })),
      setShippingPromoValue: (value) =>
        setConfig((prev) => ({ ...prev, shipping: { ...prev.shipping, value } })),
      setShippingPromoMinSubtotal: (value) =>
        setConfig((prev) => ({ ...prev, shipping: { ...prev.shipping, minSubtotalUsd: value } })),
      setShippingPromoStartAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          shipping: { ...prev.shipping, startAt: normalizePromoDateTime(value) },
        })),
      setShippingPromoEndAt: (value) =>
        setConfig((prev) => ({
          ...prev,
          shipping: { ...prev.shipping, endAt: normalizePromoDateTime(value) },
        })),
      setTopBannerEnabled: (enabled) => setTopBanner((prev) => ({ ...prev, enabled })),
      setTopBannerMessage: (value) => setTopBanner((prev) => ({ ...prev, message: value })),
      setTopBannerEndTime: (value) =>
        setTopBanner((prev) => ({ ...prev, end_time: normalizeTopPromotionDateTime(value) })),
      setTopBannerBackgroundColor: (value) =>
        setTopBanner((prev) => ({ ...prev, background_color: value || '#000000' })),
      setTopBannerTextColor: (value) =>
        setTopBanner((prev) => ({ ...prev, text_color: value || '#ffffff' })),
      setTopBannerFontSizePreset: (value) =>
        setTopBanner((prev) => ({
          ...prev,
          font_size: value === 'custom' ? 16 : normalizeTopPromotionFontSize(value),
        })),
      setTopBannerFontSizePx: (value) =>
        setTopBanner((prev) => ({ ...prev, font_size: normalizeTopPromotionFontSize(value) })),
      reload,
      save,
    }),
    [reload, save],
  )

  return {
    state: { loading, submitting, exchangeRate, config, topBanner },
    handlers,
  }
}
