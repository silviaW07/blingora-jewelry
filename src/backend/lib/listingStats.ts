import prisma from '@/tools/prisma'
import type { ListingSourceRow_Output, PeriodCount_Output } from '@/backend/types/Dashboard'

export const listedProductWhere = {
  status: 'ACTIVE' as const,
  AND: [
    {
      OR: [{ goodsStatus: null }, { goodsStatus: { not: 'DELETED' } }],
    },
  ],
}

export const SOURCE_META: Array<{ source: string; label: string; accent: '1688' | 'table' | 'manual' }> = [
  { source: 'IMPORT_1688', label: '1688 采集', accent: '1688' },
  { source: 'TABLE_IMPORT', label: '表格导入', accent: 'table' },
  { source: 'MANUAL', label: '手工录入', accent: 'manual' },
]

export function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function startOfWeekMonday(now = new Date()) {
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const start = startOfDay(now)
  start.setDate(start.getDate() - diff)
  return start
}

export function startOfMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function listingDateRangeWhere(start: Date, end: Date) {
  return {
    OR: [
      { publishedAt: { gte: start, lt: end } },
      {
        AND: [{ publishedAt: null }, { createdAt: { gte: start, lt: end } }],
      },
    ],
  }
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export async function countListed(extraWhere?: object) {
  return prisma.product.count({
    where: extraWhere ? { AND: [listedProductWhere, extraWhere] } : listedProductWhere,
  })
}

async function countBySource(extraWhere?: object) {
  const rows = await prisma.product.groupBy({
    by: ['source'],
    where: extraWhere ? { AND: [listedProductWhere, extraWhere] } : listedProductWhere,
    _count: { _all: true },
  })
  const map = new Map<string, number>()
  for (const row of rows) map.set(String(row.source), row._count._all)
  return map
}

export async function buildSourceRows(weekStart: Date, monthStart: Date): Promise<ListingSourceRow_Output[]> {
  const [totalMap, weekMap, monthMap] = await Promise.all([
    countBySource(),
    countBySource(listingDateRangeWhere(weekStart, addDays(weekStart, 7))),
    countBySource(listingDateRangeWhere(monthStart, new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))),
  ])
  const listedTotal = Array.from(totalMap.values()).reduce((sum, n) => sum + n, 0) || 1
  return SOURCE_META.map((meta) => {
    const listedCount = totalMap.get(meta.source) || 0
    return {
      source: meta.source,
      label: meta.label,
      listedCount,
      weekCount: weekMap.get(meta.source) || 0,
      monthCount: monthMap.get(meta.source) || 0,
      sharePercent: Math.round((listedCount / listedTotal) * 1000) / 10,
    }
  }).sort((a, b) => b.listedCount - a.listedCount)
}

export async function buildWeekSeries(count = 12): Promise<PeriodCount_Output[]> {
  const thisWeek = startOfWeekMonday()
  const periods = Array.from({ length: count }, (_, index) => {
    const start = addDays(thisWeek, -7 * (count - 1 - index))
    const end = addDays(start, 7)
    const label = `${start.getMonth() + 1}/${start.getDate()}`
    return { start, end, key: start.toISOString().slice(0, 10), label }
  })
  const counts = await Promise.all(
    periods.map((item) => countListed(listingDateRangeWhere(item.start, item.end))),
  )
  return periods.map((item, index) => ({
    key: item.key,
    label: item.label,
    count: counts[index] || 0,
  }))
}

export async function buildMonthSeries(count = 12): Promise<PeriodCount_Output[]> {
  const now = new Date()
  const periods = Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    return {
      start,
      end,
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      label: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    }
  })
  const counts = await Promise.all(
    periods.map((item) => countListed(listingDateRangeWhere(item.start, item.end))),
  )
  return periods.map((item, index) => ({
    key: item.key,
    label: item.label,
    count: counts[index] || 0,
  }))
}

export { percentChange }
