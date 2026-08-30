import type prismaClient from '@/tools/prisma'

type PrismaLike = typeof prismaClient

export const PRICE_PROMO_SETTING_TITLE = 'PRICE_PROMO_CONFIG'

export type DiscountMode = 'PERCENT' | 'AMOUNT'

/** 活动档期状态：未开始 / 进行中 / 已结束 */
export type PromoScheduleStatus = 'NOT_STARTED' | 'ACTIVE' | 'ENDED'

export type FullReductionTier = {
  thresholdUsd: number
  offUsd: number
}

export type PromoScheduleFields = {
  /** ISO 开始时间；空 = 立即生效 */
  startAt: string | null
  /** ISO 结束时间；空 = 永久有效 */
  endAt: string | null
}

export type PricingPromotionConfig = {
  wholesale: {
    enabled: boolean
    coefficient: number
  }
  firstOrder: {
    enabled: boolean
    mode: DiscountMode
    /** percent: 0.9 means 10% off; amount: 5 means $5 off */
    value: number
  } & PromoScheduleFields
  loyal: {
    enabled: boolean
    coefficient: number
  } & PromoScheduleFields
  fullReduction: {
    enabled: boolean
    tiers: FullReductionTier[]
  } & PromoScheduleFields
  /** 全场商品折扣：所有客户在活动期内自动应用 */
  siteWide: {
    enabled: boolean
    mode: DiscountMode
    /** percent: 0.9 = 9折；amount: 美元减免 */
    value: number
  } & PromoScheduleFields
  /** 运费折扣：活动期内对运费按系数或减免金额 */
  shipping: {
    enabled: boolean
    mode: DiscountMode
    value: number
    /** 商品折后小计满多少 USD 才享受运费优惠；0 = 不限制 */
    minSubtotalUsd: number
  } & PromoScheduleFields
}

export const DEFAULT_PRICING_PROMO_CONFIG: PricingPromotionConfig = {
  wholesale: { enabled: true, coefficient: 0.9 },
  firstOrder: { enabled: false, mode: 'PERCENT', value: 0.9, startAt: null, endAt: null },
  loyal: { enabled: false, coefficient: 0.95, startAt: null, endAt: null },
  fullReduction: { enabled: false, tiers: [], startAt: null, endAt: null },
  siteWide: { enabled: false, mode: 'PERCENT', value: 0.9, startAt: null, endAt: null },
  shipping: { enabled: false, mode: 'PERCENT', value: 0.9, minSubtotalUsd: 0, startAt: null, endAt: null },
}

/** 解析后台 datetime-local / ISO 字符串为 ISO；空值返回 null */
export function normalizePromoDateTime(raw: unknown): string | null {
  if (raw == null) return null
  const text = String(raw).trim()
  if (!text) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/** ISO → datetime-local 输入值（本地时区） */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function getPromoScheduleStatus(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  now: Date = new Date(),
): PromoScheduleStatus {
  const nowMs = now.getTime()
  if (startAt) {
    const startMs = new Date(startAt).getTime()
    if (Number.isFinite(startMs) && nowMs < startMs) return 'NOT_STARTED'
  }
  if (endAt) {
    const endMs = new Date(endAt).getTime()
    if (Number.isFinite(endMs) && nowMs >= endMs) return 'ENDED'
  }
  return 'ACTIVE'
}

/** 时间窗是否允许生效（空开始=立即，空结束=永久） */
export function isPromoScheduleActive(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return getPromoScheduleStatus(startAt, endAt, now) === 'ACTIVE'
}

/** 开关开启 + 活动时间窗内才真正生效 */
export function isPromoRuleActive(
  rule: { enabled: boolean; startAt?: string | null; endAt?: string | null },
  now: Date = new Date(),
): boolean {
  return Boolean(rule.enabled) && isPromoScheduleActive(rule.startAt, rule.endAt, now)
}

export const PROMO_SCHEDULE_STATUS_LABEL: Record<PromoScheduleStatus, string> = {
  NOT_STARTED: '未开始',
  ACTIVE: '进行中',
  ENDED: '已结束',
}

function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function normalizeDiscountMode(raw: unknown): DiscountMode {
  return raw === 'AMOUNT' ? 'AMOUNT' : 'PERCENT'
}

export function normalizePricingPromotionConfig(raw: unknown): PricingPromotionConfig {
  const input = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, any>
  const wholesale = input.wholesale && typeof input.wholesale === 'object' ? input.wholesale : {}
  const firstOrder = input.firstOrder && typeof input.firstOrder === 'object' ? input.firstOrder : {}
  const loyal = input.loyal && typeof input.loyal === 'object' ? input.loyal : {}
  const fullReduction = input.fullReduction && typeof input.fullReduction === 'object' ? input.fullReduction : {}
  const siteWide = input.siteWide && typeof input.siteWide === 'object' ? input.siteWide : {}
  const shipping = input.shipping && typeof input.shipping === 'object' ? input.shipping : {}

  const tiers: FullReductionTier[] = Array.isArray(fullReduction.tiers)
    ? fullReduction.tiers
        .map((tier: any) => ({
          thresholdUsd: roundMoney(clamp(Number(tier?.thresholdUsd), 0, 1_000_000)),
          offUsd: roundMoney(clamp(Number(tier?.offUsd), 0, 1_000_000)),
        }))
        .filter((tier) => tier.thresholdUsd > 0 && tier.offUsd > 0)
        .sort((a, b) => a.thresholdUsd - b.thresholdUsd)
    : []

  const normalizeSchedule = (section: Record<string, any>): PromoScheduleFields => {
    let startAt = normalizePromoDateTime(section.startAt)
    let endAt = normalizePromoDateTime(section.endAt)
    if (startAt && endAt) {
      const startMs = new Date(startAt).getTime()
      const endMs = new Date(endAt).getTime()
      if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs < startMs) {
        // Keep start, drop invalid end so config stays usable
        endAt = null
      }
    }
    return { startAt, endAt }
  }

  return {
    wholesale: {
      enabled: wholesale.enabled !== false,
      coefficient: roundMoney(clamp(Number(wholesale.coefficient ?? DEFAULT_PRICING_PROMO_CONFIG.wholesale.coefficient), 0, 1)),
    },
    firstOrder: {
      enabled: firstOrder.enabled === true,
      mode: normalizeDiscountMode(firstOrder.mode),
      value:
        normalizeDiscountMode(firstOrder.mode) === 'AMOUNT'
          ? roundMoney(clamp(Number(firstOrder.value ?? DEFAULT_PRICING_PROMO_CONFIG.firstOrder.value), 0, 1_000_000))
          : roundMoney(clamp(Number(firstOrder.value ?? DEFAULT_PRICING_PROMO_CONFIG.firstOrder.value), 0, 1)),
      ...normalizeSchedule(firstOrder),
    },
    loyal: {
      enabled: loyal.enabled === true,
      coefficient: roundMoney(clamp(Number(loyal.coefficient ?? DEFAULT_PRICING_PROMO_CONFIG.loyal.coefficient), 0, 1)),
      ...normalizeSchedule(loyal),
    },
    fullReduction: {
      enabled: fullReduction.enabled === true,
      tiers,
      ...normalizeSchedule(fullReduction),
    },
    siteWide: {
      enabled: siteWide.enabled === true,
      mode: normalizeDiscountMode(siteWide.mode),
      value:
        normalizeDiscountMode(siteWide.mode) === 'AMOUNT'
          ? roundMoney(clamp(Number(siteWide.value ?? DEFAULT_PRICING_PROMO_CONFIG.siteWide.value), 0, 1_000_000))
          : roundMoney(clamp(Number(siteWide.value ?? DEFAULT_PRICING_PROMO_CONFIG.siteWide.value), 0, 1)),
      ...normalizeSchedule(siteWide),
    },
    shipping: {
      enabled: shipping.enabled === true,
      mode: normalizeDiscountMode(shipping.mode),
      value:
        normalizeDiscountMode(shipping.mode) === 'AMOUNT'
          ? roundMoney(clamp(Number(shipping.value ?? DEFAULT_PRICING_PROMO_CONFIG.shipping.value), 0, 1_000_000))
          : roundMoney(clamp(Number(shipping.value ?? DEFAULT_PRICING_PROMO_CONFIG.shipping.value), 0, 1)),
      minSubtotalUsd: roundMoney(clamp(Number(shipping.minSubtotalUsd ?? 0), 0, 1_000_000)),
      ...normalizeSchedule(shipping),
    },
  }
}

export async function loadPricingPromotionConfig(db: PrismaLike): Promise<PricingPromotionConfig> {
  try {
    const setting = await db.sitesetting.findFirst({
      where: {
        settingType: 'STATIC_COPY',
        title: PRICE_PROMO_SETTING_TITLE,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      select: { contentJson: true },
    })
    if (!setting) return DEFAULT_PRICING_PROMO_CONFIG
    return normalizePricingPromotionConfig(setting.contentJson)
  } catch {
    return DEFAULT_PRICING_PROMO_CONFIG
  }
}

export async function savePricingPromotionConfig(
  db: PrismaLike,
  config: PricingPromotionConfig,
): Promise<PricingPromotionConfig> {
  const normalized = normalizePricingPromotionConfig(config)
  const existing = await db.sitesetting.findFirst({
    where: { settingType: 'STATIC_COPY', title: PRICE_PROMO_SETTING_TITLE },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  if (existing?.id) {
    await db.sitesetting.update({
      where: { id: existing.id },
      data: {
        settingType: 'STATIC_COPY',
        title: PRICE_PROMO_SETTING_TITLE,
        contentJson: normalized as any,
        isActive: true,
      },
    })
  } else {
    await db.sitesetting.create({
      data: {
        settingType: 'STATIC_COPY',
        title: PRICE_PROMO_SETTING_TITLE,
        subtitle: null,
        contentJson: normalized as any,
        imageUrl: null,
        localeCode: null,
        currencyCode: null,
        sortWeight: 0,
        isActive: true,
      },
    })
  }
  return normalized
}

