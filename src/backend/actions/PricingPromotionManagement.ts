'use server'

import prisma from '@/tools/prisma'
import { requireRole, withResult, UserRole } from '@/backend/action_utils'
import { getUsdExchangeRate, DEFAULT_USD_EXCHANGE_RATE, invalidateUsdExchangeRateCache } from '@/shared/exchangeRate'
import {
  DEFAULT_PRICING_PROMO_CONFIG,
  loadPricingPromotionConfig,
  normalizePricingPromotionConfig,
  savePricingPromotionConfig,
  type PricingPromotionConfig,
} from '@/shared/pricingPromotionConfig'
import {
  DEFAULT_TOP_PROMOTION_BANNER_CONFIG,
  loadTopPromotionBannerConfig,
  normalizeTopPromotionBannerConfig,
  saveTopPromotionBannerConfig,
  type TopPromotionBannerConfig,
} from '@/shared/topPromotionBannerConfig'

export interface GetPricingPromotionConfigOutput {
  exchangeRate: number
  config: PricingPromotionConfig
  topBanner: TopPromotionBannerConfig
}

export interface SavePricingPromotionConfigInput {
  exchangeRate: number
  config: PricingPromotionConfig
  topBanner?: TopPromotionBannerConfig
}

export interface SavePricingPromotionConfigOutput {
  exchangeRate: number
  config: PricingPromotionConfig
  topBanner: TopPromotionBannerConfig
}

export const getPricingPromotionConfig = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<GetPricingPromotionConfigOutput> => {
    const [exchangeRate, config, topBanner] = await Promise.all([
      getUsdExchangeRate(prisma, { ttlMs: 0 }),
      loadPricingPromotionConfig(prisma),
      loadTopPromotionBannerConfig(prisma),
    ])
    return { exchangeRate, config, topBanner }
  }),
)

export const savePricingPromotionConfigAdmin = requireRole([UserRole.ADMIN])(
  withResult(async (input: SavePricingPromotionConfigInput): Promise<SavePricingPromotionConfigOutput> => {
    const nextRate = Number(input.exchangeRate)
    const exchangeRate =
      Number.isFinite(nextRate) && nextRate > 0 ? nextRate : DEFAULT_USD_EXCHANGE_RATE

    const config = normalizePricingPromotionConfig(input.config || DEFAULT_PRICING_PROMO_CONFIG)
    const topBanner = normalizeTopPromotionBannerConfig(
      input.topBanner || DEFAULT_TOP_PROMOTION_BANNER_CONFIG,
      input.topBanner?.enabled,
    )

    let savedTopBanner = topBanner
    await prisma.$transaction(async (tx) => {
      // USD row: exchangeRate = CNY per 1 USD
      await tx.currencysetting.upsert({
        where: { currencyCode: 'USD' },
        update: {
          currencyName: 'US Dollar',
          exchangeRate: exchangeRate as any,
          isDefault: true,
          isActive: true,
        },
        create: {
          currencyCode: 'USD',
          currencyName: 'US Dollar',
          exchangeRate: exchangeRate as any,
          isDefault: true,
          isActive: true,
        },
      })

      await savePricingPromotionConfig(tx as any, config)
      savedTopBanner = await saveTopPromotionBannerConfig(tx as any, topBanner)
    })
    invalidateUsdExchangeRateCache()

    return { exchangeRate, config, topBanner: savedTopBanner }
  }),
)

