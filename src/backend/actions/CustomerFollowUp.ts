
'use server'

import { randomUUID } from 'crypto'
import prisma from '@/tools/prisma'
import { requireRole, withResult, UserRole } from '@/backend/action_utils'
import { CUSTOMER_TAG_OPTIONS, type CustomerTagCode } from '@/backend/lib/customerTags'

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

export interface FollowTagInterval {
  code: string
  name: string
  intervalDays: number
}

export interface RegisteredFollowCustomer {
  id: string
  name: string
  phone: string | null
  email: string
  tagCode: string
  tagName: string | null
  intervalDays: number
  registeredAt: string
  lastLoginAt: string | null
  cartUsdTotal: number
  lastFollowedAt: string | null
  nextFollowAt: string
  due: boolean
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

export const getFollowUpBoard = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<{ tags: FollowTagInterval[]; due: RegisteredFollowCustomer[]; all: RegisteredFollowCustomer[] }> => {
    await ensureTagIntervals()
    const [users, tags, cartRows] = await Promise.all([
      prisma.sysuser.findMany({
        where: { role: 'CUSTOMER' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          phone: true,
          email: true,
          createdAt: true,
          lastLoginAt: true,
          customerTags: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { tag: { select: { code: true, name: true, followIntervalDays: true } } },
          },
          userFollow: { select: { lastFollowedAt: true, nextFollowAt: true } },
        },
      }),
      prisma.customertag.findMany({
        where: { code: { in: CUSTOMER_TAG_OPTIONS.map((item) => item.code) } },
        select: { code: true, name: true, followIntervalDays: true },
      }),
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
    for (const row of cartRows) {
      cartByUser.set(row.accountId, toUsdFromCny(Number(row.rmb || 0)))
    }
    const tagByCode = new Map(tags.map((tag) => [tag.code, tag]))
    const end = endOfToday().getTime()
    const all = users.map((user) => {
      const link = user.customerTags[0]?.tag
      const known = link && CUSTOMER_TAG_OPTIONS.some((item) => item.code === link.code)
      const intervalDays = known ? clampDays(link?.followIntervalDays || DEFAULT_INTERVAL_DAYS) : DEFAULT_INTERVAL_DAYS
      const last = user.userFollow?.lastFollowedAt || null
      const next = user.userFollow?.nextFollowAt || user.createdAt
      const due = next.getTime() <= end
      return {
        id: user.id,
        name: user.username,
        phone: user.phone,
        email: user.email,
        tagCode: known ? String(link?.code || '') : '',
        tagName: known ? (link?.name || null) : null,
        intervalDays,
        registeredAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        cartUsdTotal: cartByUser.get(user.id) || 0,
        lastFollowedAt: last ? last.toISOString() : null,
        nextFollowAt: next.toISOString(),
        due,
      }
    })
    const tagList = CUSTOMER_TAG_OPTIONS.map((option) => {
      const row = tagByCode.get(option.code)
      return {
        code: option.code,
        name: option.name,
        intervalDays: clampDays(row?.followIntervalDays || DEFAULT_TAG_INTERVALS[option.code]),
      }
    })
    return {
      tags: tagList,
      due: all.filter((row) => row.due).sort((a, b) => a.nextFollowAt.localeCompare(b.nextFollowAt)),
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
      select: { code: true, name: true, followIntervalDays: true },
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
  const link = await prisma.customertaglink.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { tag: { select: { code: true, followIntervalDays: true } } },
  })
  const code = link?.tag?.code as CustomerTagCode | undefined
  if (!code || !CUSTOMER_TAG_OPTIONS.some((item) => item.code === code)) return DEFAULT_INTERVAL_DAYS
  return clampDays(link?.tag?.followIntervalDays || DEFAULT_INTERVAL_DAYS)
}

export const markCustomerFollowed = requireRole([UserRole.ADMIN])(
  withResult(async (input: { id: string }): Promise<{ followedAt: string; nextFollowAt: string; logs: FollowLog[] }> => {
    const user = await prisma.sysuser.findFirst({ where: { id: input.id, role: 'CUSTOMER' }, select: { id: true } })
    if (!user) throw new Error('客户不存在')
    const followedAt = new Date()
    const nextFollowAt = addDays(followedAt, await intervalForUser(user.id))
    await prisma.$transaction([
      prisma.customeruserfollow.upsert({
        where: { userId: user.id },
        create: { userId: user.id, lastFollowedAt: followedAt, nextFollowAt },
        update: { lastFollowedAt: followedAt, nextFollowAt },
      }),
      prisma.customeruserfollowlog.create({
        data: { id: randomUUID(), userId: user.id, followedAt },
      }),
    ])
    const logs = await prisma.customeruserfollowlog.findMany({
      where: { userId: user.id },
      orderBy: { followedAt: 'desc' },
      take: 8,
    })
    return {
      followedAt: followedAt.toISOString(),
      nextFollowAt: nextFollowAt.toISOString(),
      logs: logs.map((log) => ({ id: log.id, followedAt: log.followedAt.toISOString() })),
    }
  }),
)

export const getCustomerFollowLogs = requireRole([UserRole.ADMIN])(
  withResult(async (id: string): Promise<FollowLog[]> => {
    const logs = await prisma.customeruserfollowlog.findMany({
      where: { userId: id },
      orderBy: { followedAt: 'desc' },
      take: 8,
    })
    return logs.map((log) => ({ id: log.id, followedAt: log.followedAt.toISOString() }))
  }),
)
