
'use server'

import { randomUUID } from 'crypto'
import prisma from '@/tools/prisma'
import { requireRole, withResult, UserRole } from '@/backend/action_utils'

export interface FollowCustomer {
  id: string
  name: string
  whatsapp: string | null
  note: string | null
  intervalDays: number
  lastFollowedAt: string | null
  nextFollowAt: string
  createdAt: string
}

export interface FollowLog {
  id: string
  followedAt: string
  note: string | null
}

function endOfToday() {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return end
}

function mapCustomer(row: {
  id: string
  name: string
  whatsapp: string | null
  note: string | null
  intervalDays: number
  lastFollowedAt: Date | null
  nextFollowAt: Date
  createdAt: Date
}): FollowCustomer {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    note: row.note,
    intervalDays: row.intervalDays,
    lastFollowedAt: row.lastFollowedAt ? row.lastFollowedAt.toISOString() : null,
    nextFollowAt: row.nextFollowAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

export const getFollowUpBoard = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<{ due: FollowCustomer[]; all: FollowCustomer[] }> => {
    const rows = await prisma.customerfollowup.findMany({ orderBy: [{ nextFollowAt: 'asc' }, { name: 'asc' }] })
    const all = rows.map(mapCustomer)
    const end = endOfToday().getTime()
    return { due: all.filter((row) => new Date(row.nextFollowAt).getTime() <= end), all }
  }),
)

export const createFollowCustomer = requireRole([UserRole.ADMIN])(
  withResult(async (input: { name: string; whatsapp?: string | null; note?: string | null; intervalDays?: number }): Promise<FollowCustomer> => {
    const name = String(input.name || '').trim()
    if (!name) throw new Error('请填写客户名称')
    const intervalDays = Math.max(1, Math.min(365, Math.floor(Number(input.intervalDays) || 7)))
    const row = await prisma.customerfollowup.create({
      data: {
        id: randomUUID(),
        name: name.slice(0, 100),
        whatsapp: String(input.whatsapp || '').trim().slice(0, 40) || null,
        note: String(input.note || '').trim().slice(0, 500) || null,
        intervalDays,
        nextFollowAt: new Date(),
      },
    })
    return mapCustomer(row)
  }),
)

export const updateFollowCustomer = requireRole([UserRole.ADMIN])(
  withResult(async (input: { id: string; name?: string; whatsapp?: string | null; note?: string | null; intervalDays?: number }): Promise<FollowCustomer> => {
    const current = await prisma.customerfollowup.findUnique({ where: { id: input.id } })
    if (!current) throw new Error('客户不存在')
    const intervalDays = input.intervalDays == null
      ? current.intervalDays
      : Math.max(1, Math.min(365, Math.floor(Number(input.intervalDays) || current.intervalDays)))
    const name = input.name == null ? current.name : String(input.name || '').trim().slice(0, 100)
    if (!name) throw new Error('请填写客户名称')
    const row = await prisma.customerfollowup.update({
      where: { id: input.id },
      data: {
        name,
        whatsapp: input.whatsapp === undefined ? current.whatsapp : (String(input.whatsapp || '').trim().slice(0, 40) || null),
        note: input.note === undefined ? current.note : (String(input.note || '').trim().slice(0, 500) || null),
        intervalDays,
      },
    })
    return mapCustomer(row)
  }),
)

export const markCustomerFollowed = requireRole([UserRole.ADMIN])(
  withResult(async (input: { id: string }): Promise<{ customer: FollowCustomer; followedAt: string; logs: FollowLog[] }> => {
    const current = await prisma.customerfollowup.findUnique({ where: { id: input.id } })
    if (!current) throw new Error('客户不存在')
    const followedAt = new Date()
    const next = new Date(followedAt)
    next.setDate(next.getDate() + Math.max(1, current.intervalDays))
    const logId = randomUUID()
    const [row] = await prisma.$transaction([
      prisma.customerfollowup.update({
        where: { id: input.id },
        data: { lastFollowedAt: followedAt, nextFollowAt: next },
      }),
      prisma.customerfollowlog.create({
        data: { id: logId, customerId: input.id, followedAt, note: current.note },
      }),
    ])
    const logs = await prisma.customerfollowlog.findMany({
      where: { customerId: input.id },
      orderBy: { followedAt: 'desc' },
      take: 8,
    })
    return {
      customer: mapCustomer(row),
      followedAt: followedAt.toISOString(),
      logs: logs.map((log) => ({ id: log.id, followedAt: log.followedAt.toISOString(), note: log.note })),
    }
  }),
)

export const getCustomerFollowLogs = requireRole([UserRole.ADMIN])(
  withResult(async (id: string): Promise<FollowLog[]> => {
    const logs = await prisma.customerfollowlog.findMany({
      where: { customerId: id },
      orderBy: { followedAt: 'desc' },
      take: 8,
    })
    return logs.map((log) => ({ id: log.id, followedAt: log.followedAt.toISOString(), note: log.note }))
  }),
)
