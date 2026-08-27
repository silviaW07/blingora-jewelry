/**
 * 物流运费计算：快递阶梯价 / 海运按公斤 / 海运阶梯价，统一人民币（¥）
 * 后台配置与前台结账共用。
 */

export type ShippingBillingMode = 'EXPRESS_TIER' | 'SEA_PER_KG' | 'SEA_TIER'

export const SHIPPING_BILLING_MODE_LABELS: Record<ShippingBillingMode, string> = {
  EXPRESS_TIER: '快递阶梯价',
  SEA_PER_KG: '海运按公斤',
  SEA_TIER: '海运阶梯价（首重续重）',
}

export const DEFAULT_CHANNEL_COEFFICIENT = 1
export const DEFAULT_SEA_BASE_KG = 12
/** 旧版固定运费迁移时的兜底最大重量（kg） */
export const LEGACY_FLAT_MAX_KG = 9999

export type ExpressWeightTier = {
  /** 重量上限（kg），含：weightKg ≤ maxKg 时命中 */
  maxKg: number
  /** 固定运费（¥） */
  fee: number
}

export type ExpressCountryRule = {
  tiers: ExpressWeightTier[]
}

export type SeaCountryRule = {
  /** 起重重量（kg），默认 12 */
  baseKg: number
  /** 起重运费（¥） */
  baseFee: number
  /** 续重单价（¥/kg） */
  perKgFee: number
}

export type SeaBulkPerKgTier = {
  /** 重量上限（kg），含：weightKg ≤ maxKg 时命中 */
  maxKg: number
  /** 整票按公斤单价（¥/kg） */
  perKgFee: number
}

/**
 * 海运阶梯（与快递固定档价不同）：
 * - 未到体积档：首重运费 + ceil((重量-首重)/续重单位)×续重单价
 * - 达到体积档：整票重量 × 该档 ¥/kg
 */
export type SeaTierCountryRule = {
  baseKg: number
  baseFee: number
  extraUnitKg: number
  extraFee: number
  /** 从此重量起改为整票按公斤（对应表上 11-20kg 起） */
  bulkFromKg: number
  tiers: SeaBulkPerKgTier[]
}

export type CountryShippingRule = ExpressCountryRule | SeaCountryRule | SeaTierCountryRule

export type CountryRuleMap = Record<string, CountryShippingRule | null>

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}

export function formatShippingFeeCny(amount: number): string {
  return `¥${roundMoney(amount).toFixed(2)}`
}

export function isWeightTierBillingMode(mode: ShippingBillingMode): boolean {
  return mode === 'EXPRESS_TIER'
}

export function isExpressRule(rule: CountryShippingRule | null | undefined): rule is ExpressCountryRule {
  return (
    !!rule &&
    Array.isArray((rule as ExpressCountryRule).tiers) &&
    typeof (rule as SeaTierCountryRule).baseFee !== 'number'
  )
}

export function isSeaTierRule(rule: CountryShippingRule | null | undefined): rule is SeaTierCountryRule {
  return (
    !!rule &&
    typeof (rule as SeaTierCountryRule).baseFee === 'number' &&
    Array.isArray((rule as SeaTierCountryRule).tiers)
  )
}

export function isSeaRule(rule: CountryShippingRule | null | undefined): rule is SeaCountryRule {
  return (
    !!rule &&
    typeof (rule as SeaCountryRule).baseFee === 'number' &&
    !Array.isArray((rule as SeaTierCountryRule).tiers)
  )
}

/** 将任意历史/表单数据规范为快递阶梯 */
export function normalizeExpressRule(raw: unknown): ExpressCountryRule | null {
  if (raw === null || raw === undefined || raw === '') return null

  // 旧版：纯数字固定运费 → 单档大重量阶梯
  const asNumber = toFiniteNumber(raw)
  if (asNumber != null && (typeof raw === 'number' || typeof raw === 'string')) {
    return { tiers: [{ maxKg: LEGACY_FLAT_MAX_KG, fee: roundMoney(Math.max(0, asNumber)) }] }
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>

  // 若误存了海运结构，当作不可用（需切模式后重配）
  if ('baseFee' in obj && !('tiers' in obj)) return null

  const tiersRaw = Array.isArray(obj.tiers) ? obj.tiers : []
  const tiers: ExpressWeightTier[] = []
  for (const item of tiersRaw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const maxKg = toFiniteNumber(row.maxKg)
    const fee = toFiniteNumber(row.fee)
    if (maxKg == null || maxKg <= 0 || fee == null || fee < 0) continue
    tiers.push({ maxKg: Number(maxKg.toFixed(3)), fee: roundMoney(fee) })
  }
  if (tiers.length === 0) return null
  tiers.sort((a, b) => a.maxKg - b.maxKg)
  return { tiers }
}

const DEFAULT_SEA_TIER_BULK_FROM_KG = 11

/** 将任意历史/表单数据规范为海运阶梯（首重续重 + 体积档整票单价） */
export function normalizeSeaTierRule(raw: unknown): SeaTierCountryRule | null {
  if (raw === null || raw === undefined || raw === '') return null

  const asNumber = toFiniteNumber(raw)
  if (asNumber != null && (typeof raw === 'number' || typeof raw === 'string')) {
    return {
      baseKg: 2,
      baseFee: roundMoney(Math.max(0, asNumber)),
      extraUnitKg: 1,
      extraFee: 0,
      bulkFromKg: DEFAULT_SEA_TIER_BULK_FROM_KG,
      tiers: [],
    }
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  const baseFee = toFiniteNumber(obj.baseFee)
  const hasSeaHead = baseFee != null && baseFee >= 0

  const tiersRaw = Array.isArray(obj.tiers) ? obj.tiers : []
  const tiers: SeaBulkPerKgTier[] = []
  for (const item of tiersRaw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const maxKg = toFiniteNumber(row.maxKg)
    const perKgFee = toFiniteNumber(row.perKgFee) ?? toFiniteNumber(row.fee)
    if (maxKg == null || maxKg <= 0 || perKgFee == null || perKgFee < 0) continue
    // 旧版快递式固定档：fee 通常远大于单价，不当成 ¥/kg
    const looksLikeFlatFee = !('perKgFee' in row) && perKgFee > 80
    if (looksLikeFlatFee) continue
    tiers.push({ maxKg: Number(maxKg.toFixed(3)), perKgFee: roundMoney(perKgFee) })
  }
  tiers.sort((a, b) => a.maxKg - b.maxKg)

  if (!hasSeaHead && tiers.length === 0) return null

  const baseKgRaw = toFiniteNumber(obj.baseKg)
  const extraUnitRaw = toFiniteNumber(obj.extraUnitKg)
  const extraFeeRaw = toFiniteNumber(obj.extraFee) ?? toFiniteNumber(obj.perKgFee)
  const bulkFromRaw = toFiniteNumber(obj.bulkFromKg)

  return {
    baseKg: baseKgRaw != null && baseKgRaw > 0 ? Number(baseKgRaw.toFixed(3)) : 2,
    baseFee: roundMoney(Math.max(0, baseFee ?? 0)),
    extraUnitKg: extraUnitRaw != null && extraUnitRaw > 0 ? Number(extraUnitRaw.toFixed(3)) : 1,
    extraFee: extraFeeRaw != null && extraFeeRaw >= 0 ? roundMoney(extraFeeRaw) : 0,
    bulkFromKg:
      bulkFromRaw != null && bulkFromRaw > 0
        ? Number(bulkFromRaw.toFixed(3))
        : DEFAULT_SEA_TIER_BULK_FROM_KG,
    tiers,
  }
}

/** 将任意历史/表单数据规范为海运按公斤 */
export function normalizeSeaRule(raw: unknown): SeaCountryRule | null {
  if (raw === null || raw === undefined || raw === '') return null

  // 旧版固定价：作为起重运费，起重重量默认 12，续重 0
  const asNumber = toFiniteNumber(raw)
  if (asNumber != null && (typeof raw === 'number' || typeof raw === 'string')) {
    return {
      baseKg: DEFAULT_SEA_BASE_KG,
      baseFee: roundMoney(Math.max(0, asNumber)),
      perKgFee: 0,
    }
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>

  // 若误存了快递结构，尝试用第一档费用作起重运费
  if (Array.isArray(obj.tiers) && !('baseFee' in obj)) {
    const first = normalizeExpressRule(obj)
    if (!first?.tiers.length) return null
    return {
      baseKg: DEFAULT_SEA_BASE_KG,
      baseFee: first.tiers[0].fee,
      perKgFee: 0,
    }
  }

  const baseFee = toFiniteNumber(obj.baseFee)
  if (baseFee == null || baseFee < 0) return null
  const baseKgRaw = toFiniteNumber(obj.baseKg)
  const perKgFeeRaw = toFiniteNumber(obj.perKgFee)
  return {
    baseKg: baseKgRaw != null && baseKgRaw > 0 ? Number(baseKgRaw.toFixed(3)) : DEFAULT_SEA_BASE_KG,
    baseFee: roundMoney(baseFee),
    perKgFee: perKgFeeRaw != null && perKgFeeRaw >= 0 ? roundMoney(perKgFeeRaw) : 0,
  }
}

export function normalizeBillingMode(raw: unknown): ShippingBillingMode {
  if (raw === 'SEA_PER_KG') return 'SEA_PER_KG'
  if (raw === 'SEA_TIER') return 'SEA_TIER'
  return 'EXPRESS_TIER'
}

export function normalizeChannelCoefficient(raw: unknown): number {
  const num = toFiniteNumber(raw)
  if (num == null || num <= 0) return DEFAULT_CHANNEL_COEFFICIENT
  return Number(num.toFixed(4))
}

/**
 * 按计费模式规范化国家运费 JSON（兼容旧版 `{ "US": 15.53 }`）
 */
export function normalizeCountryRuleMap(
  raw: unknown,
  mode: ShippingBillingMode = 'EXPRESS_TIER',
): CountryRuleMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const result: CountryRuleMap = {}
  for (const [country, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || value === undefined || value === '') {
      result[country] = null
      continue
    }
    result[country] =
      mode === 'SEA_PER_KG'
        ? normalizeSeaRule(value)
        : mode === 'SEA_TIER'
          ? normalizeSeaTierRule(value)
          : normalizeExpressRule(value)
  }
  return result
}

/** 快递：匹配「下一个」适用阶梯（最小 maxKg ≥ weightKg） */
export function calcExpressTierFee(tiers: ExpressWeightTier[], weightKg: number): number | null {
  const weight = Math.max(0, Number(weightKg) || 0)
  const sorted = [...tiers]
    .filter((t) => Number.isFinite(t.maxKg) && t.maxKg > 0 && Number.isFinite(t.fee) && t.fee >= 0)
    .sort((a, b) => a.maxKg - b.maxKg)
  if (sorted.length === 0) return null
  const hit = sorted.find((t) => weight <= t.maxKg)
  if (!hit) return null
  return roundMoney(hit.fee)
}

/** 海运：≤起重取起重运费；超出按续重单价加收 */
export function calcSeaPerKgFee(rule: SeaCountryRule, weightKg: number): number | null {
  const weight = Math.max(0, Number(weightKg) || 0)
  const baseKg = rule.baseKg > 0 ? rule.baseKg : DEFAULT_SEA_BASE_KG
  const baseFee = Math.max(0, rule.baseFee)
  const perKgFee = Math.max(0, rule.perKgFee)
  if (weight <= baseKg) return roundMoney(baseFee)
  return roundMoney(baseFee + (weight - baseKg) * perKgFee)
}

function calcSeaFirstPlusExtra(rule: SeaTierCountryRule, weightKg: number): number {
  const baseKg = rule.baseKg > 0 ? rule.baseKg : 2
  const baseFee = Math.max(0, rule.baseFee)
  const extraUnitKg = rule.extraUnitKg > 0 ? rule.extraUnitKg : 1
  const extraFee = Math.max(0, rule.extraFee)
  if (weightKg <= baseKg) return roundMoney(baseFee)
  const extraUnits = Math.ceil((weightKg - baseKg) / extraUnitKg - 1e-9)
  return roundMoney(baseFee + Math.max(0, extraUnits) * extraFee)
}

/** 海运阶梯：轻抛走首重续重；达到体积档后整票 × 该档单价 */
export function calcSeaTierFee(rule: SeaTierCountryRule, weightKg: number): number | null {
  const weight = Math.max(0, Number(weightKg) || 0)
  const bulkFromKg = rule.bulkFromKg > 0 ? rule.bulkFromKg : DEFAULT_SEA_TIER_BULK_FROM_KG
  const sorted = [...(rule.tiers || [])]
    .filter((t) => Number.isFinite(t.maxKg) && t.maxKg > 0 && Number.isFinite(t.perKgFee) && t.perKgFee >= 0)
    .sort((a, b) => a.maxKg - b.maxKg)

  if (sorted.length > 0 && weight >= bulkFromKg) {
    const hit = sorted.find((t) => weight <= t.maxKg)
    if (!hit) return null
    return roundMoney(weight * hit.perKgFee)
  }

  return calcSeaFirstPlusExtra(rule, weight)
}

export type CalcShippingFeeInput = {
  billingMode: ShippingBillingMode
  channelCoefficient?: number
  countryRule: CountryShippingRule | null | undefined
  weightKg: number
}

/**
 * 计算最终运费（¥）= 基础运费 × 渠道系数；不可用返回 null
 */
export function calculateShippingFee(input: CalcShippingFeeInput): number | null {
  const { billingMode, countryRule, weightKg } = input
  const coefficient = normalizeChannelCoefficient(input.channelCoefficient)

  if (!countryRule) return null

  let baseFee: number | null = null
  if (billingMode === 'SEA_PER_KG') {
    const sea = normalizeSeaRule(countryRule)
    if (!sea) return null
    baseFee = calcSeaPerKgFee(sea, weightKg)
  } else if (billingMode === 'SEA_TIER') {
    const seaTier = normalizeSeaTierRule(countryRule)
    if (!seaTier) return null
    baseFee = calcSeaTierFee(seaTier, weightKg)
  } else {
    const express = normalizeExpressRule(countryRule)
    if (!express) return null
    baseFee = calcExpressTierFee(express.tiers, weightKg)
  }

  if (baseFee == null) return null
  return roundMoney(baseFee * coefficient)
}

export function emptyExpressRule(): ExpressCountryRule {
  return { tiers: [{ maxKg: 0.5, fee: 0 }] }
}

export function emptySeaTierRule(): SeaTierCountryRule {
  return {
    baseKg: 2,
    baseFee: 0,
    extraUnitKg: 1,
    extraFee: 0,
    bulkFromKg: 11,
    tiers: [
      { maxKg: 20, perKgFee: 0 },
      { maxKg: 70, perKgFee: 0 },
      { maxKg: 100, perKgFee: 0 },
      { maxKg: 9999, perKgFee: 0 },
    ],
  }
}

export function emptySeaRule(): SeaCountryRule {
  return {
    baseKg: DEFAULT_SEA_BASE_KG,
    baseFee: 0,
    perKgFee: 0,
  }
}

/** 列表摘要：展示该国家配置要点 */
export function summarizeCountryRule(
  mode: ShippingBillingMode,
  rule: CountryShippingRule | null,
): string | null {
  if (!rule) return null
  if (mode === 'SEA_PER_KG') {
    const sea = normalizeSeaRule(rule)
    if (!sea) return null
    return `起重${sea.baseKg}kg ${formatShippingFeeCny(sea.baseFee)} + ${formatShippingFeeCny(sea.perKgFee)}/kg`
  }
  if (mode === 'SEA_TIER') {
    const sea = normalizeSeaTierRule(rule)
    if (!sea) return null
    const head = `首重${sea.baseKg}kg ${formatShippingFeeCny(sea.baseFee)} + ${formatShippingFeeCny(sea.extraFee)}/${sea.extraUnitKg}kg`
    if (!sea.tiers.length) return head
    const bulk = sea.tiers
      .slice(0, 2)
      .map((t) => `≤${t.maxKg}kg ${formatShippingFeeCny(t.perKgFee)}/kg`)
      .join(' · ')
    const more = sea.tiers.length > 2 ? ` +${sea.tiers.length - 2}` : ''
    return `${head}；≥${sea.bulkFromKg}kg ${bulk}${more}`
  }
  const express = normalizeExpressRule(rule)
  if (!express) return null
  const parts = express.tiers.slice(0, 3).map((t) => `≤${t.maxKg}kg ${formatShippingFeeCny(t.fee)}`)
  const more = express.tiers.length > 3 ? ` +${express.tiers.length - 3}` : ''
  return parts.join(' · ') + more
}
