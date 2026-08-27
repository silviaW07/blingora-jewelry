import {
  DEFAULT_CHANNEL_COEFFICIENT,
  emptyParcelBandRule,
  formatShippingFeeCny,
  normalizeCountryRuleMap,
  type CountryRuleMap,
  type ShippingBillingMode,
} from '@/shared/shippingFeeCalc'

/** 结账 / 物流渠道配置共用的主流国家列表 */
export const CHECKOUT_COUNTRIES = [
  'United States',
  'Puerto Rico',
  'Mexico',
  'Canada',
  'United Kingdom',
  'Australia',
  'Japan',
  'South Korea',
  'Singapore',
  'Germany',
  'France',
] as const

export type CheckoutCountry = (typeof CHECKOUT_COUNTRIES)[number]

/** @deprecated 使用 CountryRuleMap；保留别名兼容旧 import */
export type CountryFeeMap = CountryRuleMap

export const DEFAULT_SHIPPING_CHANNELS: Array<{
  name: string
  estimatedTime: string
  billingMode: ShippingBillingMode
  channelCoefficient: number
  countryFees: CountryRuleMap
  isEnabled: boolean
  sortWeight: number
}> = [
  {
    name: 'USPS',
    estimatedTime: '8-12 business days',
    billingMode: 'PARCEL_BAND',
    channelCoefficient: DEFAULT_CHANNEL_COEFFICIENT,
    countryFees: {
      'United States': emptyParcelBandRule(),
    },
    isEnabled: true,
    sortWeight: 10,
  },
  {
    name: 'UPS',
    estimatedTime: '2-5 business days',
    billingMode: 'EXPRESS_TIER',
    channelCoefficient: DEFAULT_CHANNEL_COEFFICIENT,
    countryFees: {
      'United States': {
        tiers: [
          { maxKg: 0.5, fee: 15 },
          { maxKg: 1, fee: 22 },
          { maxKg: 2, fee: 32 },
        ],
      },
      'Puerto Rico': {
        tiers: [
          { maxKg: 0.5, fee: 18 },
          { maxKg: 1, fee: 26 },
          { maxKg: 2, fee: 36 },
        ],
      },
      Mexico: {
        tiers: [
          { maxKg: 0.5, fee: 22 },
          { maxKg: 1, fee: 32 },
          { maxKg: 2, fee: 45 },
        ],
      },
      Canada: {
        tiers: [
          { maxKg: 0.5, fee: 18 },
          { maxKg: 1, fee: 28 },
          { maxKg: 2, fee: 40 },
        ],
      },
      'United Kingdom': {
        tiers: [
          { maxKg: 0.5, fee: 28 },
          { maxKg: 1, fee: 40 },
          { maxKg: 2, fee: 55 },
        ],
      },
      Australia: {
        tiers: [
          { maxKg: 0.5, fee: 32 },
          { maxKg: 1, fee: 45 },
          { maxKg: 2, fee: 62 },
        ],
      },
      Japan: {
        tiers: [
          { maxKg: 0.5, fee: 26 },
          { maxKg: 1, fee: 38 },
          { maxKg: 2, fee: 52 },
        ],
      },
      'South Korea': {
        tiers: [
          { maxKg: 0.5, fee: 24 },
          { maxKg: 1, fee: 36 },
          { maxKg: 2, fee: 50 },
        ],
      },
      Singapore: {
        tiers: [
          { maxKg: 0.5, fee: 22 },
          { maxKg: 1, fee: 34 },
          { maxKg: 2, fee: 48 },
        ],
      },
      Germany: {
        tiers: [
          { maxKg: 0.5, fee: 28 },
          { maxKg: 1, fee: 42 },
          { maxKg: 2, fee: 58 },
        ],
      },
      France: {
        tiers: [
          { maxKg: 0.5, fee: 28 },
          { maxKg: 1, fee: 42 },
          { maxKg: 2, fee: 58 },
        ],
      },
    },
    isEnabled: true,
    sortWeight: 20,
  },
  {
    name: '海运专线',
    estimatedTime: '15-30 business days',
    billingMode: 'SEA_PER_KG',
    channelCoefficient: DEFAULT_CHANNEL_COEFFICIENT,
    countryFees: {
      'United States': { baseKg: 12, baseFee: 180, perKgFee: 12 },
      'Puerto Rico': { baseKg: 12, baseFee: 190, perKgFee: 13 },
      Mexico: { baseKg: 12, baseFee: 200, perKgFee: 14 },
      Canada: { baseKg: 12, baseFee: 185, perKgFee: 12 },
      'United Kingdom': { baseKg: 12, baseFee: 210, perKgFee: 15 },
      Australia: { baseKg: 12, baseFee: 220, perKgFee: 16 },
      Japan: { baseKg: 12, baseFee: 160, perKgFee: 10 },
      'South Korea': { baseKg: 12, baseFee: 155, perKgFee: 10 },
      Singapore: { baseKg: 12, baseFee: 150, perKgFee: 9 },
      Germany: { baseKg: 12, baseFee: 210, perKgFee: 15 },
      France: { baseKg: 12, baseFee: 210, perKgFee: 15 },
    },
    isEnabled: true,
    sortWeight: 30,
  },
]

/** @deprecated 使用 normalizeCountryRuleMap */
export function normalizeCountryFees(raw: unknown, mode: ShippingBillingMode = 'EXPRESS_TIER'): CountryRuleMap {
  return normalizeCountryRuleMap(raw, mode)
}

/** 运费展示统一人民币 */
export function formatShippingFee(amount: number) {
  return formatShippingFeeCny(amount)
}
