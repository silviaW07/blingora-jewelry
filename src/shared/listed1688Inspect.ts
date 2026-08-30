import type { PrismaClient } from '@/tools/prisma'
import { check1688OfferLiveStatus } from '@/backend/actions/ImportFrom1688'

export type Listed1688InspectSummary = {
  scanned: number
  skipped: number
  delisted: number
  out_of_stock: number
  price_review: number
  unchanged: number
  unknown: number
  errors: number
}

const DEFAULT_BATCH = 40
const DEFAULT_HIKE_PCT = 15
const STALE_MS = 18 * 60 * 60 * 1000
const CONCURRENCY = 3

function toNum(value: unknown): number | null {
  if (value == null) return null
  const n = typeof (value as { toNumber?: () => number }).toNumber === 'function'
    ? (value as { toNumber: () => number }).toNumber()
    : Number(value)
  return Number.isFinite(n) ? n : null
}

function asTrade(json: unknown): Record<string, unknown> {
  if (json && typeof json === 'object' && !Array.isArray(json)) return { ...(json as Record<string, unknown>) }
  return {}
}

function appendRemark(trade: Record<string, unknown>, line: string): string {
  const prev = String(trade.adminRemark || '').trim()
  const next = prev.includes(line) ? prev : prev ? `${prev}\n${line}` : line
  return next.slice(0, 4000)
}

export async function resolveProduct1688Url(
  prisma: PrismaClient,
  product: { id: string; tradeInfoJson?: unknown },
): Promise<string | null> {
  const fromTrade = String(asTrade(product.tradeInfoJson).importSourceUrl || '').trim()
  if (/1688\.com/i.test(fromTrade) && /offer\/\d+/i.test(fromTrade)) return fromTrade.slice(0, 700)

  const item = await prisma.importtaskitem.findFirst({
    where: {
      importedProductId: product.id,
      sourceUrl: { contains: '1688.com' },
    },
    orderBy: { updatedAt: 'desc' },
    select: { sourceUrl: true },
  })
  const url = String(item?.sourceUrl || '').trim()
  if (/1688\.com/i.test(url) && /offer\/\d+/i.test(url)) return url.slice(0, 700)
  return null
}

async function applyInspectAction(
  prisma: PrismaClient,
  productId: string,
  trade: Record<string, unknown>,
  action: 'DELISTED' | 'OUT_OF_STOCK' | 'PRICE_REVIEW',
  note: string,
) {
  const nextTrade = {
    ...trade,
    adminRemark: appendRemark(trade, note),
    last1688InspectAt: new Date().toISOString(),
    last1688InspectAction: action,
  }
  if (action === 'PRICE_REVIEW') {
    await prisma.product.update({
      where: { id: productId },
      data: {
        goodsStatus: 'REVIEW',
        tradeInfoJson: nextTrade as object,
      },
    })
    return
  }
  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        status: 'INACTIVE',
        goodsStatus: 'INACTIVE',
        tradeInfoJson: nextTrade as object,
      },
    }),
    prisma.productsku.updateMany({
      where: { productId },
      data: action === 'OUT_OF_STOCK' ? { stockStatus: 'OUT_OF_STOCK', stock: 0 } : { stockStatus: 'OUT_OF_STOCK' },
    }),
  ])
}

/**
 * Walk ACTIVE 1688-sourced listings, pause delisted/OOS, and mark price hikes for review.
 */
export async function inspectListed1688Sources(
  prisma: PrismaClient,
  options?: { limit?: number; hikePct?: number; force?: boolean },
): Promise<Listed1688InspectSummary> {
  const limit = Math.max(1, Math.min(120, Number(options?.limit) || DEFAULT_BATCH))
  const hikePct = Math.max(1, Math.min(200, Number(options?.hikePct) || Number(process.env.SOURCE_INSPECT_PRICE_HIKE_PCT) || DEFAULT_HIKE_PCT))
  const force = Boolean(options?.force)

  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      source: 'IMPORT_1688',
      OR: [{ goodsStatus: null }, { goodsStatus: { notIn: ['DELETED', 'DRAFT'] } }],
    },
    select: {
      id: true,
      name: true,
      productCode: true,
      costPrice: true,
      tradeInfoJson: true,
      skus: { select: { price: true } },
    },
    orderBy: { updatedAt: 'asc' },
    take: Math.max(limit * 4, 80),
  })

  const summary: Listed1688InspectSummary = {
    scanned: 0,
    skipped: 0,
    delisted: 0,
    out_of_stock: 0,
    price_review: 0,
    unchanged: 0,
    unknown: 0,
    errors: 0,
  }

  const due: typeof products = []
  const now = Date.now()
  for (const product of products) {
    const trade = asTrade(product.tradeInfoJson)
    if (String(trade.last1688InspectAction || '') === 'PRICE_REVIEW' && String(product.tradeInfoJson || '').includes('需复核')) {
      // still inspect unless recently checked
    }
    const lastAt = Date.parse(String(trade.last1688InspectAt || ''))
    if (!force && Number.isFinite(lastAt) && now - lastAt < STALE_MS) {
      summary.skipped += 1
      continue
    }
    due.push(product)
    if (due.length >= limit) break
  }

  let cursor = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, due.length || 1) }, async () => {
    while (true) {
      const index = cursor++
      if (index >= due.length) return
      const product = due[index]
      const trade = asTrade(product.tradeInfoJson)
      try {
        const sourceUrl = await resolveProduct1688Url(prisma, product)
        if (!sourceUrl) {
          summary.skipped += 1
          await prisma.product.update({
            where: { id: product.id },
            data: {
              tradeInfoJson: {
                ...trade,
                last1688InspectAt: new Date().toISOString(),
                last1688InspectAction: 'NO_URL',
              } as object,
            },
          })
          continue
        }
        summary.scanned += 1
        const live = await check1688OfferLiveStatus(sourceUrl)
        const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
        if (live.status === 'DELISTED') {
          await applyInspectAction(
            prisma,
            product.id,
            trade,
            'DELISTED',
            `[1688巡检 ${stamp}] 源站下架，已暂停展示。${live.reason || ''}`.trim(),
          )
          summary.delisted += 1
          continue
        }
        if (live.status === 'OUT_OF_STOCK') {
          await applyInspectAction(
            prisma,
            product.id,
            trade,
            'OUT_OF_STOCK',
            `[1688巡检 ${stamp}] 源站缺货，已改缺货并暂停展示。${live.reason || ''}`.trim(),
          )
          summary.out_of_stock += 1
          continue
        }
        if (live.status === 'NORMAL') {
          const livePrice = Number(live.price_min_cny)
          const skuPrices = product.skus.map((s) => toNum(s.price)).filter((n): n is number => n != null && n > 0)
          const baseline = toNum(product.costPrice) || (skuPrices.length ? Math.min(...skuPrices) : null)
          if (Number.isFinite(livePrice) && livePrice > 0 && baseline != null && baseline > 0) {
            const limitPrice = baseline * (1 + hikePct / 100)
            if (livePrice > limitPrice + 0.009) {
              await applyInspectAction(
                prisma,
                product.id,
                trade,
                'PRICE_REVIEW',
                `[需复核 ${stamp}] 1688现价 ¥${livePrice.toFixed(2)} 高于基准 ¥${baseline.toFixed(2)}（阈值 ${hikePct}%），已暂停前台展示。`,
              )
              summary.price_review += 1
              continue
            }
          }
          await prisma.product.update({
            where: { id: product.id },
            data: {
              tradeInfoJson: {
                ...trade,
                last1688InspectAt: new Date().toISOString(),
                last1688InspectAction: 'OK',
              } as object,
            },
          })
          summary.unchanged += 1
          continue
        }
        summary.unknown += 1
        await prisma.product.update({
          where: { id: product.id },
          data: {
            tradeInfoJson: {
              ...trade,
              last1688InspectAt: new Date().toISOString(),
              last1688InspectAction: 'UNKNOWN',
            } as object,
          },
        })
      } catch (error) {
        summary.errors += 1
        console.warn('[inspectListed1688Sources]', product.id, error)
      }
    }
  })
  await Promise.all(workers)
  return summary
}
