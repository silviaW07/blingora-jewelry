'use server'

import prisma from '@/tools/prisma'
import { DEFAULT_USD_EXCHANGE_RATE, getUsdExchangeRate } from '@/shared/exchangeRate'
import { requireRole, withResult, UserRole } from '@/backend/action_utils'
import {
  CHECKOUT_COUNTRIES,
  DEFAULT_SHIPPING_CHANNELS,
} from '@/shared/shippingCountries'
import {
  DEFAULT_CHANNEL_COEFFICIENT,
  normalizeBillingMode,
  normalizeChannelCoefficient,
  normalizeCountryRuleMap,
  isWeightTierBillingMode,
  isSeaTierRule,
  isExpressRule,
  isSeaRule,
  normalizeParcelBandRule,
  type CountryRuleMap,
  type ShippingBillingMode,
} from '@/shared/shippingFeeCalc'

export type ShippingChannelFilterStatus = 'ALL' | 'ENABLED' | 'DISABLED'

export interface ShippingChannelItem {
  channel_id: string
  channel_name: string
  channel_nameEs: string
  channel_estimatedTime: string
  channel_estimatedTimeEs: string
  channel_adminNote: string
  channel_billingMode: ShippingBillingMode
  channel_coefficient: number
  channel_countryFees: CountryRuleMap
  channel_isEnabled: boolean
  channel_sortWeight: number
  channel_updatedAt: string
}

export interface GetShippingChannelListInput {
  search_keyword?: string
  filter_status?: ShippingChannelFilterStatus
}

export interface GetShippingChannelListOutput {
  list: ShippingChannelItem[]
  total: number
  countries: string[]
  usd_exchange_rate: number
}

export interface SaveShippingChannelInput {
  channel_id?: string
  channel_name: string
  channel_nameEs?: string
  channel_estimatedTime: string
  channel_estimatedTimeEs?: string
  channel_adminNote?: string
  channel_billingMode: ShippingBillingMode
  channel_coefficient: number
  channel_countryFees: CountryRuleMap
  channel_isEnabled: boolean
  channel_sortWeight: number
}

export interface SaveShippingChannelOutput {
  success: boolean
  channel_id: string
}

export interface DeleteShippingChannelInput {
  channel_id: string
}

export interface DeleteShippingChannelOutput {
  success: boolean
}

export interface UpdateShippingChannelStatusInput {
  channel_id: string
  channel_isEnabled: boolean
}

export interface UpdateShippingChannelStatusOutput {
  success: boolean
}

export interface UpdateShippingChannelAdminNoteInput {
  channel_id: string
  channel_adminNote: string
}

export interface UpdateShippingChannelAdminNoteOutput {
  success: boolean
}

export interface ReorderShippingChannelsInput {
  channel_ids: string[]
}

export interface ReorderShippingChannelsOutput {
  success: boolean
}

function mapChannel(row: {
  id: string
  name: string
  nameEs?: string | null
  estimatedTime: string
  estimatedTimeEs?: string | null
  adminNote?: string | null
  billingMode?: string | null
  channelCoefficient?: unknown
  countryFeesJson: unknown
  isEnabled: boolean
  sortWeight: number
  updatedAt: Date
}): ShippingChannelItem {
  const billingMode = normalizeBillingMode(row.billingMode)
  const coefficientRaw =
    row.channelCoefficient != null &&
    typeof (row.channelCoefficient as { toNumber?: () => number }).toNumber === 'function'
      ? (row.channelCoefficient as { toNumber: () => number }).toNumber()
      : Number(row.channelCoefficient)
  return {
    channel_id: row.id,
    channel_name: row.name,
    channel_nameEs: String(row.nameEs || '').trim(),
    channel_estimatedTime: row.estimatedTime,
    channel_estimatedTimeEs: String(row.estimatedTimeEs || '').trim(),
    channel_adminNote: String(row.adminNote || '').trim(),
    channel_billingMode: billingMode,
    channel_coefficient: normalizeChannelCoefficient(coefficientRaw),
    channel_countryFees: normalizeCountryRuleMap(row.countryFeesJson, billingMode),
    channel_isEnabled: row.isEnabled,
    channel_sortWeight: row.sortWeight,
    channel_updatedAt: row.updatedAt.toISOString(),
  }
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

export const getShippingChannelList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetShippingChannelListInput = {}): Promise<GetShippingChannelListOutput> => {
    await ensureDefaultChannels()

    const { search_keyword = '', filter_status = 'ALL' } = input
    const keyword = search_keyword.trim()
    const where = {
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { nameEs: { contains: keyword } },
              { adminNote: { contains: keyword } },
            ],
          }
        : {}),
      ...(filter_status === 'ENABLED' ? { isEnabled: true } : {}),
      ...(filter_status === 'DISABLED' ? { isEnabled: false } : {}),
    }

    const [list, usdExchangeRate] = await Promise.all([
      prisma.shippingchannel.findMany({
        where,
        orderBy: [{ sortWeight: 'asc' }, { updatedAt: 'desc' }],
      }),
      getUsdExchangeRate(prisma, { ttlMs: 60_000 }).catch(() => DEFAULT_USD_EXCHANGE_RATE),
    ])

    return {
      list: list.map(mapChannel),
      total: list.length,
      countries: [...CHECKOUT_COUNTRIES],
      usd_exchange_rate: usdExchangeRate > 0 ? usdExchangeRate : DEFAULT_USD_EXCHANGE_RATE,
    }
  }),
)

export const saveShippingChannel = requireRole([UserRole.ADMIN])(
  withResult(async (input: SaveShippingChannelInput): Promise<SaveShippingChannelOutput> => {
    const name = (input.channel_name || '').trim()
    const estimatedTime = (input.channel_estimatedTime || '').trim()
    const nameEs = (input.channel_nameEs || '').trim().slice(0, 200)
    const estimatedTimeEs = (input.channel_estimatedTimeEs || '').trim().slice(0, 120)
    const adminNote = (input.channel_adminNote || '').trim().slice(0, 500)
    if (!name) throw new Error('请填写渠道名称')
    if (!estimatedTime) throw new Error('请填写预计配送时间')

    const billingMode = normalizeBillingMode(input.channel_billingMode)
    const channelCoefficient = normalizeChannelCoefficient(input.channel_coefficient)
    const fees = normalizeCountryRuleMap(input.channel_countryFees, billingMode)

    // 至少配置一个国家才有意义（允许全空，但提示）
    const hasAnyCountry = Object.values(fees).some((rule) => rule != null)
    if (!hasAnyCountry) {
      throw new Error('请至少为一个国家配置运费规则')
    }

    if (billingMode === 'SEA_TIER') {
      for (const [country, rule] of Object.entries(fees)) {
        if (!rule || !isSeaTierRule(rule)) continue
        if (!(rule.baseKg > 0)) throw new Error(`${country} 首重重量必须大于 0`)
        if (!(rule.extraUnitKg > 0)) throw new Error(`${country} 续重单位必须大于 0`)
        if (!(rule.bulkFromKg > 0)) throw new Error(`${country} 体积档起始重量必须大于 0`)
        if (rule.baseFee < 0 || rule.extraFee < 0) throw new Error(`${country} 运费不能为负数`)
        for (const tier of rule.tiers) {
          if (!(tier.maxKg > 0)) throw new Error(`${country} 体积档重量必须大于 0`)
          if (tier.perKgFee < 0) throw new Error(`${country} 公斤单价不能为负数`)
        }
      }
    } else if (billingMode === 'PARCEL_BAND') {
      for (const [country, rule] of Object.entries(fees)) {
        if (!rule) continue
        const band = normalizeParcelBandRule(rule)
        if (!band) throw new Error(`${country} 请填写小包区间价`)
        if (!(band.minKg > 0) || !(band.capKg > 0)) throw new Error(`${country} 最小/最大重量必须大于 0`)
        for (const tier of band.tiers) {
          if (!(tier.maxKg > 0)) throw new Error(`${country} 区间重量必须大于 0`)
          if (tier.perKgFee < 0 || tier.handlingFee < 0) throw new Error(`${country} 单价/处理费不能为负数`)
        }
      }
    } else if (isWeightTierBillingMode(billingMode)) {
      for (const [country, rule] of Object.entries(fees)) {
        if (!rule || !isExpressRule(rule)) continue
        if (!rule.tiers.length) throw new Error(`${country} 请至少添加一个重量阶梯`)
        for (const tier of rule.tiers) {
          if (!(tier.maxKg > 0)) throw new Error(`${country} 阶梯重量必须大于 0`)
          if (tier.fee < 0) throw new Error(`${country} 运费不能为负数`)
        }
      }
    } else {
      for (const [country, rule] of Object.entries(fees)) {
        if (!rule || !isSeaRule(rule)) continue
        if (!(rule.baseKg > 0)) throw new Error(`${country} 起重重量必须大于 0`)
        if (rule.baseFee < 0 || rule.perKgFee < 0) throw new Error(`${country} 运费不能为负数`)
      }
    }

    const payload = {
      name,
      nameEs: nameEs || null,
      estimatedTime,
      estimatedTimeEs: estimatedTimeEs || null,
      adminNote: adminNote || null,
      billingMode,
      channelCoefficient,
      countryFeesJson: fees,
      isEnabled: !!input.channel_isEnabled,
      sortWeight: Number(input.channel_sortWeight) || 0,
    }

    if (input.channel_id) {
      await prisma.shippingchannel.update({
        where: { id: input.channel_id },
        data: payload,
      })
      return { success: true, channel_id: input.channel_id }
    }

    const created = await prisma.shippingchannel.create({ data: payload })
    return { success: true, channel_id: created.id }
  }),
)

export const deleteShippingChannel = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteShippingChannelInput): Promise<DeleteShippingChannelOutput> => {
    await prisma.shippingchannel.delete({ where: { id: input.channel_id } })
    return { success: true }
  }),
)

export const updateShippingChannelStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateShippingChannelStatusInput): Promise<UpdateShippingChannelStatusOutput> => {
    await prisma.shippingchannel.update({
      where: { id: input.channel_id },
      data: { isEnabled: !!input.channel_isEnabled },
    })
    return { success: true }
  }),
)

export const updateShippingChannelAdminNote = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateShippingChannelAdminNoteInput): Promise<UpdateShippingChannelAdminNoteOutput> => {
    const channelId = String(input.channel_id || '').trim()
    if (!channelId) throw new Error('渠道不存在')
    const adminNote = String(input.channel_adminNote || '').trim().slice(0, 500)
    await prisma.shippingchannel.update({
      where: { id: channelId },
      data: { adminNote: adminNote || null },
    })
    return { success: true }
  }),
)

export const reorderShippingChannels = requireRole([UserRole.ADMIN])(
  withResult(async (input: ReorderShippingChannelsInput): Promise<ReorderShippingChannelsOutput> => {
    const ids = (input.channel_ids || []).map((id) => String(id || '').trim()).filter(Boolean)
    if (ids.length === 0) throw new Error('请选择要排序的渠道')
    const unique = Array.from(new Set(ids))
    if (unique.length !== ids.length) throw new Error('排序列表重复')

    await prisma.$transaction(
      unique.map((id, index) =>
        prisma.shippingchannel.update({
          where: { id },
          data: { sortWeight: index * 10 },
        }),
      ),
    )
    return { success: true }
  }),
)
