'use server'

import prisma from '@/tools/prisma'
import { withResult } from '@/frontend/action_utils'
import {
  CHECKOUT_COUNTRIES,
  DEFAULT_SHIPPING_CHANNELS,
} from '@/shared/shippingCountries'
import {
  calculateShippingFee,
  normalizeBillingMode,
  normalizeChannelCoefficient,
  normalizeCountryRuleMap,
} from '@/shared/shippingFeeCalc'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'
import { formatUsd } from '@/shared/money'

export interface CheckoutShippingOption {
  channelId: string
  name: string
  estimatedTime: string
  billingMode: string
  shippingFee: number
  shippingFeeLabel: string
}

export interface GetCheckoutCountriesOutput {
  countries: string[]
}

export interface GetCheckoutShippingOptionsInput {
  country: string
  /** 购物车总重量（kg），用于阶梯/海运计费 */
  weightKg?: number
}

export interface GetCheckoutShippingOptionsOutput {
  list: CheckoutShippingOption[]
}

async function ensureDefaultChannels() {
  const count = await prisma.shippingchannel.count()
  if (count > 0) return
  await prisma.shippingchannel.createMany({
    data: DEFAULT_SHIPPING_CHANNELS.map((item) => ({
      name: item.name,
      estimatedTime: item.estimatedTime,
      billingMode: item.billingMode,
      channelCoefficient: item.channelCoefficient,
      countryFeesJson: item.countryFees,
      isEnabled: item.isEnabled,
      sortWeight: item.sortWeight,
    })),
  })
}

export const getCheckoutCountries = withResult(
  async (): Promise<GetCheckoutCountriesOutput> => ({
    countries: [...CHECKOUT_COUNTRIES],
  }),
)

export const getCheckoutShippingOptions = withResult(
  async (input: GetCheckoutShippingOptionsInput): Promise<GetCheckoutShippingOptionsOutput> => {
    await ensureDefaultChannels()
    const country = (input.country || '').trim()
    if (!country) {
      return { list: [] }
    }

    const weightKg = Math.max(0, Number(input.weightKg) || 0)
    const exchangeRate = await getUsdExchangeRate(prisma)

    const rows = await prisma.shippingchannel.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortWeight: 'asc' }, { updatedAt: 'desc' }],
    })

    const list: CheckoutShippingOption[] = []
    for (const row of rows) {
      const billingMode = normalizeBillingMode(row.billingMode)
      const coefficientRaw =
        row.channelCoefficient != null &&
        typeof (row.channelCoefficient as { toNumber?: () => number }).toNumber === 'function'
          ? (row.channelCoefficient as { toNumber: () => number }).toNumber()
          : Number(row.channelCoefficient)
      const coefficient = normalizeChannelCoefficient(coefficientRaw)
      const fees = normalizeCountryRuleMap(row.countryFeesJson, billingMode)
      const rule = fees[country]
      const fee = calculateShippingFee({
        billingMode,
        channelCoefficient: coefficient,
        countryRule: rule,
        weightKg,
      })
      if (fee == null) continue
      const shippingFeeUsd = Math.round(toUsdFromCny(fee, exchangeRate) * 100) / 100
      list.push({
        channelId: row.id,
        name: row.name,
        estimatedTime: row.estimatedTime,
        billingMode,
        shippingFee: shippingFeeUsd,
        shippingFeeLabel: formatUsd(shippingFeeUsd),
      })
    }

    return { list }
  },
)
