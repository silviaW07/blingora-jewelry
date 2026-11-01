
'use server'

import { randomUUID } from 'crypto'
import prisma from '@/tools/prisma'
import { requireRole, withResult, UserRole } from '@/backend/action_utils'
import { CUSTOMER_TAG_OPTIONS, type CustomerTagCode } from '@/backend/lib/customerTags'
import { getCustomerTypeLabel, normalizeCustomerType } from '@/shared/customerType'

const USD_EXCHANGE_RATE = 6.5
const DEFAULT_INTERVAL_DAYS = 7

const DEFAULT_TAG_INTERVALS: Record<Exclude<CustomerTagCode, ''>, number> = {
  NEW_REGISTERED: 1,
  NOT_CONVERTED: 3,
  FIRST_ORDER: 7,
  MULTI_ORDER: 14,
  HIGH_RISK: 2,
  CHURNED: 30,
}

const TYPE_TO_TAG: Record<string, Exclude<CustomerTagCode, ''>> = {
  NEW: 'NEW_REGISTERED',
  UNCONVERTED: 'NOT_CONVERTED',
  FIRST_ORDER: 'FIRST_ORDER',
  MULTI_ORDER: 'MULTI_ORDER',
  HIGH_RISK: 'HIGH_RISK',
  CHURNED: 'CHURNED',
}

export type FollowStatus = 'FOLLOWED' | 'DUE' | 'SKIP'
export type FollowKind = 'user' | 'manual'

export interface FollowTagInterval {
  code: string
  name: string
  intervalDays: number
}

export interface RegisteredFollowCustomer {
  id: string
  kind: FollowKind
  name: string
  phone: string | null
  email: string
  customerType: string
  customerTypeLabel: string
  intervalDays: number
  registeredAt: string | null
  lastLoginAt: string | null
  cartUsdTotal: number
  lastFollowedAt: string | null
  nextFollowAt: string | null
  followStatus: FollowStatus
}

export interface FollowLog {
  id: string
  followedAt: string
}

function endOfToday() {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return end
}

function addDays(from: Date, days: number) {
  const next = new Date(from)
  next.setDate(next.getDate() + days)
  return next
}

function clampDays(value: number) {
  return Math.max(1, Math.min(365, Math.floor(Number(value) || DEFAULT_INTERVAL_DAYS)))
}

function toUsdFromCny(amount: number) {
  if (!Number.isFinite(amount)) return 0
  return Number((amount / USD_EXCHANGE_RATE).toFixed(2))
}

export function phoneDigits(value?: string | null) {
  return String(value || '').replace(/\D/g, '')
}

function resolveStatus(input: { followStatus?: string | null; lastFollowedAt?: Date | null; nextFollowAt?: Date | null }, end: number): FollowStatus {
  if (String(input.followStatus || '').toUpperCase() === 'SKIP') return 'SKIP'
  const next = input.nextFollowAt ? input.nextFollowAt.getTime() : 0
  if (!input.lastFollowedAt || next <= end) return 'DUE'
  return 'FOLLOWED'
}

async function ensureTagIntervals() {
  for (const option of CUSTOMER_TAG_OPTIONS) {
    const days = DEFAULT_TAG_INTERVALS[option.code]
    await prisma.customertag.upsert({
      where: { code: option.code },
      create: {
        name: option.name,
        code: option.code,
        description: option.name,
        followIntervalDays: days,
      },
      update: { name: option.name },
    })
  }
}

function intervalFromType(customerType: string, tagByCode: Map<string, { followIntervalDays: number }>) {
  const code = TYPE_TO_TAG[normalizeCustomerType(customerType)]
  return clampDays(tagByCode.get(code)?.followIntervalDays || DEFAULT_TAG_INTERVALS[code] || DEFAULT_INTERVAL_DAYS)
}

export const getFollowUpBoard = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<{ tags: FollowTagInterval[]; due: RegisteredFollowCustomer[]; all: RegisteredFollowCustomer[] }> => {
    await ensureTagIntervals()
    const [users, tags, manuals, cartRows] = await Promise.all([
      prisma.sysuser.findMany({
        where: { role: 'CUSTOMER' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          phone: true,
          email: true,
          customerType: true,
          createdAt: true,
          lastLoginAt: true,
          userFollow: { select: { lastFollowedAt: true, nextFollowAt: true, followStatus: true } },
        },
      }),
      prisma.customertag.findMany({
        where: { code: { in: CUSTOMER_TAG_OPTIONS.map((item) => item.code) } },
        select: { code: true, name: true, followIntervalDays: true },
      }),
      prisma.customerfollowup.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.$queryRaw<Array<{ accountId: string; rmb: unknown }>>`
        SELECT c.accountId AS accountId,
          SUM(CASE WHEN ci.status = 'VALID' THEN ci.quantity * ps.price + IFNULL(ci.giftWrapFee, 0) ELSE 0 END) AS rmb
        FROM cart c
        INNER JOIN cartitem ci ON ci.cartId = c.id
        INNER JOIN productsku ps ON ps.id = ci.productSkuId
        GROUP BY c.accountId
      `,
    ])

    const cartByUser = new Map<string, number>()
    for (const row of cartRows) cartByUser.set(row.accountId, toUsdFromCny(Number(row.rmb || 0)))
    const tagByCode = new Map(tags.map((tag) => [tag.code, tag]))
    const end = endOfToday().getTime()
    const registered = users.map((user) => {
      const customerType = normalizeCustomerType(user.customerType)
      const intervalDays = intervalFromType(customerType, tagByCode)
      const status = resolveStatus(user.userFollow || {}, end)
      return {
        id: user.id,
        kind: 'user' as const,
        name: user.username,
        phone: user.phone,
        email: user.email,
        customerType,
        customerTypeLabel: getCustomerTypeLabel(customerType),
        intervalDays,
        registeredAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        cartUsdTotal: cartByUser.get(user.id) || 0,
        lastFollowedAt: user.userFollow?.lastFollowedAt ? user.userFollow.lastFollowedAt.toISOString() : null,
        nextFollowAt: user.userFollow?.nextFollowAt ? user.userFollow.nextFollowAt.toISOString() : null,
        followStatus: status,
      }
    })
    const knownPhones = new Set(registered.map((row) => phoneDigits(row.phone)).filter((value) => value.length >= 6))
    const manualRows = manuals
      .filter((row) => {
        const digits = phoneDigits(row.whatsapp || row.name)
        return digits.length >= 6 && !knownPhones.has(digits)
      })
      .map((row) => {
        const status = resolveStatus(row, end)
        return {
          id: row.id,
          kind: 'manual' as const,
          name: row.name,
          phone: row.whatsapp || row.name,
          email: '',
          customerType: '',
          customerTypeLabel: '手动添加',
          intervalDays: clampDays(row.intervalDays),
          registeredAt: row.createdAt.toISOString(),
          lastLoginAt: null,
          cartUsdTotal: 0,
          lastFollowedAt: row.lastFollowedAt ? row.lastFollowedAt.toISOString() : null,
          nextFollowAt: row.nextFollowAt ? row.nextFollowAt.toISOString() : null,
          followStatus: status,
        }
      })
    const all = [...manualRows, ...registered]
    const tagList = CUSTOMER_TAG_OPTIONS.map((option) => ({
      code: option.code,
      name: option.name,
      intervalDays: clampDays(tagByCode.get(option.code)?.followIntervalDays || DEFAULT_TAG_INTERVALS[option.code]),
    }))
    return {
      tags: tagList,
      due: all.filter((row) => row.followStatus === 'DUE'),
      all,
    }
  }),
)

export const updateTagFollowIntervals = requireRole([UserRole.ADMIN])(
  withResult(async (input: Array<{ code: string; intervalDays: number }>): Promise<FollowTagInterval[]> => {
    await ensureTagIntervals()
    for (const item of input) {
      const option = CUSTOMER_TAG_OPTIONS.find((tag) => tag.code === item.code)
      if (!option) continue
      await prisma.customertag.update({
        where: { code: option.code },
        data: { followIntervalDays: clampDays(item.intervalDays) },
      })
    }
    const tags = await prisma.customertag.findMany({
      where: { code: { in: CUSTOMER_TAG_OPTIONS.map((item) => item.code) } },
      select: { code: true, followIntervalDays: true },
    })
    const byCode = new Map(tags.map((tag) => [tag.code, tag]))
    return CUSTOMER_TAG_OPTIONS.map((option) => ({
      code: option.code,
      name: option.name,
      intervalDays: clampDays(byCode.get(option.code)?.followIntervalDays || DEFAULT_TAG_INTERVALS[option.code]),
    }))
  }),
)

async function intervalForUser(userId: string) {
  const user = await prisma.sysuser.findFirst({ where: { id: userId }, select: { customerType: true } })
  const code = TYPE_TO_TAG[normalizeCustomerType(user?.customerType)]
  const tag = await prisma.customertag.findUnique({ where: { code }, select: { followIntervalDays: true } })
  return clampDays(tag?.followIntervalDays || DEFAULT_TAG_INTERVALS[code])
}

async function applyStatus(input: { id: string; kind: FollowKind; status: FollowStatus }) {
  const status = input.status
  const now = new Date()
  if (input.kind === 'manual') {
    const current = await prisma.customerfollowup.findUnique({ where: { id: input.id } })
    if (!current) throw new Error('客户不存在')
    if (status === 'SKIP') {
      await prisma.customerfollowup.update({ where: { id: input.id }, data: { followStatus: 'SKIP' } })
      return { followedAt: current.lastFollowedAt?.toISOString() || null, nextFollowAt: current.nextFollowAt.toISOString(), followStatus: 'SKIP' as FollowStatus }
    }
    if (status === 'DUE') {
      await prisma.customerfollowup.update({
        where: { id: input.id },
        data: { followStatus: null, nextFollowAt: now },
      })
      return { followedAt: current.lastFollowedAt?.toISOString() || null, nextFollowAt: now.toISOString(), followStatus: 'DUE' as FollowStatus }
    }
    const nextFollowAt = addDays(now, clampDays(current.intervalDays))
    await prisma.$transaction([
      prisma.customerfollowup.update({
        where: { id: input.id },
        data: { followStatus: null, lastFollowedAt: now, nextFollowAt },
      }),
      prisma.customerfollowlog.create({ data: { id: randomUUID(), customerId: input.id, followedAt: now } }),
    ])
    return { followedAt: now.toISOString(), nextFollowAt: nextFollowAt.toISOString(), followStatus: 'FOLLOWED' as FollowStatus }
  }

  const user = await prisma.sysuser.findFirst({ where: { id: input.id, role: 'CUSTOMER' }, select: { id: true } })
  if (!user) throw new Error('客户不存在')
  if (status === 'SKIP') {
    await prisma.customeruserfollow.upsert({
      where: { userId: user.id },
      create: { userId: user.id, followStatus: 'SKIP', nextFollowAt: null },
      update: { followStatus: 'SKIP' },
    })
    return { followedAt: null, nextFollowAt: null, followStatus: 'SKIP' as FollowStatus }
  }
  if (status === 'DUE') {
    await prisma.customeruserfollow.upsert({
      where: { userId: user.id },
      create: { userId: user.id, followStatus: null, nextFollowAt: now },
      update: { followStatus: null, nextFollowAt: now },
    })
    return { followedAt: null, nextFollowAt: now.toISOString(), followStatus: 'DUE' as FollowStatus }
  }
  const nextFollowAt = addDays(now, await intervalForUser(user.id))
  await prisma.$transaction([
    prisma.customeruserfollow.upsert({
      where: { userId: user.id },
      create: { userId: user.id, followStatus: null, lastFollowedAt: now, nextFollowAt },
      update: { followStatus: null, lastFollowedAt: now, nextFollowAt },
    }),
    prisma.customeruserfollowlog.create({ data: { id: randomUUID(), userId: user.id, followedAt: now } }),
  ])
  return { followedAt: now.toISOString(), nextFollowAt: nextFollowAt.toISOString(), followStatus: 'FOLLOWED' as FollowStatus }
}

export const setFollowStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: { id: string; kind: FollowKind; status: FollowStatus }) => {
    if (!['FOLLOWED', 'DUE', 'SKIP'].includes(input.status)) throw new Error('无效的跟进状态')
    return applyStatus(input)
  }),
)

export const markCustomerFollowed = requireRole([UserRole.ADMIN])(
  withResult(async (input: { id: string; kind?: FollowKind }) => {
    const result = await applyStatus({ id: input.id, kind: input.kind || 'user', status: 'FOLLOWED' })
    const logs = input.kind === 'manual'
      ? await prisma.customerfollowlog.findMany({ where: { customerId: input.id }, orderBy: { followedAt: 'desc' }, take: 8 })
      : await prisma.customeruserfollowlog.findMany({ where: { userId: input.id }, orderBy: { followedAt: 'desc' }, take: 8 })
    return { ...result, logs: logs.map((log) => ({ id: log.id, followedAt: log.followedAt.toISOString() })) }
  }),
)

export const getCustomerFollowLogs = requireRole([UserRole.ADMIN])(
  withResult(async (input: { id: string; kind?: FollowKind }): Promise<FollowLog[]> => {
    const logs = input.kind === 'manual'
      ? await prisma.customerfollowlog.findMany({ where: { customerId: input.id }, orderBy: { followedAt: 'desc' }, take: 8 })
      : await prisma.customeruserfollowlog.findMany({ where: { userId: input.id }, orderBy: { followedAt: 'desc' }, take: 8 })
    return logs.map((log) => ({ id: log.id, followedAt: log.followedAt.toISOString() }))
  }),
)

export const addFollowPhones = requireRole([UserRole.ADMIN])(
  withResult(async (raw: string): Promise<{ added: number; skipped: number }> => {
    const parts = String(raw || '').split(/[\s,，;；]+/).map((item) => item.trim()).filter(Boolean)
    const digitsList = Array.from(new Set(parts.map(phoneDigits).filter((item) => item.length >= 6 && item.length <= 20)))
    if (!digitsList.length) throw new Error('请粘贴手机号，一行一个')
    const [users, manuals] = await Promise.all([
      prisma.sysuser.findMany({ where: { role: 'CUSTOMER' }, select: { phone: true } }),
      prisma.customerfollowup.findMany({ select: { whatsapp: true, name: true } }),
    ])
    const known = new Set<string>()
    for (const row of users) {
      const digits = phoneDigits(row.phone)
      if (digits) known.add(digits)
    }
    for (const row of manuals) {
      const digits = phoneDigits(row.whatsapp || row.name)
      if (digits) known.add(digits)
    }
    let added = 0
    let skipped = 0
    for (const digits of digitsList) {
      if (known.has(digits)) {
        skipped += 1
        continue
      }
      await prisma.customerfollowup.create({
        data: {
          id: randomUUID(),
          name: digits,
          whatsapp: digits,
          intervalDays: DEFAULT_INTERVAL_DAYS,
          nextFollowAt: new Date(),
        },
      })
      known.add(digits)
      added += 1
    }
    return { added, skipped }
  }),
)
