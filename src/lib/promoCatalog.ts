import sharp from 'sharp'

import prisma from '@/tools/prisma'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'
import { loadImageBytes } from '@/lib/mosaicRemoteImage'
import { buildZipStore } from '@/lib/zipStore'
import { buildJpegGridPdf } from '@/lib/jpegGridPdf'
import { resolveProductDisplayName } from '@/frontend/i18n/productTranslation'

export const PROMO_CATALOG_MAX_PRODUCTS = 80

export type PromoCatalogItem = {
  id: string
  name: string
  productCode: string
  imageUrl: string
  extraImageUrls: string[]
  usdPrice: number | null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value && typeof value === 'object' && typeof (value as { toNumber?: () => number }).toNumber === 'function') {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function galleryUrls(galleryJson: unknown, mainImageUrl?: string | null): string[] {
  const fromGallery = Array.isArray(galleryJson)
    ? galleryJson.map((item: { url?: string }) => String(item?.url || '').trim()).filter(Boolean)
    : []
  const main = String(mainImageUrl || '').trim()
  return Array.from(new Set([main, ...fromGallery].filter(Boolean)))
}

function parseIds(raw: string[] | string | null | undefined): string[] {
  const text = Array.isArray(raw) ? raw.join(',') : String(raw || '')
  const ids = text
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter((id) => /^[a-zA-Z0-9-]{8,80}$/.test(id))
  return Array.from(new Set(ids)).slice(0, PROMO_CATALOG_MAX_PRODUCTS)
}

export function parsePromoCatalogIds(raw: string[] | string | null | undefined): string[] {
  return parseIds(raw)
}

const listSelect = {
  id: true,
  name: true,
  productCode: true,
  mainImageUrl: true,
  translationsJson: true,
  skus: { select: { price: true } },
} as const

const productSelect = {
  id: true,
  name: true,
  productCode: true,
  mainImageUrl: true,
  galleryJson: true,
  translationsJson: true,
  skus: { select: { imageUrl: true, price: true } },
} as const

type ProductRow = {
  id: string
  name: string
  productCode: string
  mainImageUrl: string
  galleryJson?: unknown
  translationsJson: unknown
  skus: Array<{ imageUrl?: string | null; price: unknown }>
}

function mapProductRows(
  rows: ProductRow[],
  usdRate: number,
  ids?: string[],
  lang?: string | null,
  withExtras = true,
): PromoCatalogItem[] {
  const order = ids?.length ? new Map(ids.map((id, index) => [id, index])) : null
  return rows
    .slice()
    .sort((a, b) => (order ? (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0) : 0))
    .map((row) => {
      const skuPrices = (row.skus || [])
        .map((sku) => toNumber(sku.price))
        .filter((n): n is number => n != null && n > 0)
      const cny = skuPrices.length ? Math.min(...skuPrices) : null
      const usd = cny != null ? toUsdFromCny(cny, usdRate) : null
      const images = galleryUrls(row.galleryJson, row.mainImageUrl)
      const skuImages = withExtras
        ? (row.skus || [])
            .map((sku) => String(sku.imageUrl || '').trim())
            .filter((url) => url && url !== images[0])
        : []
      return {
        id: row.id,
        name: resolveProductDisplayName(row.name, row.translationsJson, lang) || row.productCode,
        productCode: String(row.productCode || row.id),
        imageUrl: images[0] || '',
        extraImageUrls: withExtras
          ? Array.from(new Set([...images.slice(1), ...skuImages])).slice(0, 8)
          : [],
        usdPrice: usd && usd > 0 ? usd : null,
      }
    })
    .filter((item) => item.imageUrl)
}

export async function loadPromoCatalogItems(
  productIds: string[],
  lang?: string | null,
): Promise<PromoCatalogItem[]> {
  const ids = parseIds(productIds)
  if (!ids.length) return []

  const [rows, usdRate] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: productSelect,
    }),
    getUsdExchangeRate(prisma, { ttlMs: 60_000 }),
  ])

  return mapProductRows(rows, usdRate, ids, lang)
}

export async function loadRecentPromoCatalogItems(
  limit = PROMO_CATALOG_MAX_PRODUCTS,
  lang?: string | null,
): Promise<PromoCatalogItem[]> {
  const take = Math.min(PROMO_CATALOG_MAX_PRODUCTS, Math.max(1, limit))
  const [rows, usdRate] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        mainImageUrl: { not: '' },
      },
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
      take,
      select: productSelect,
    }),
    getUsdExchangeRate(prisma, { ttlMs: 60_000 }),
  ])

  return mapProductRows(rows, usdRate, undefined, lang)
}

export const PROMO_CATALOG_PAGE_SIZE = 40

export async function loadPagedPromoCatalogItems(input: {
  categoryId?: string
  page?: number
  pageSize?: number
  lang?: string | null
}): Promise<{ items: PromoCatalogItem[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(60, Math.max(1, Number(input.pageSize) || PROMO_CATALOG_PAGE_SIZE))
  const page = Math.max(1, Number(input.page) || 1)
  const root = String(input.categoryId || '').trim()
  let categoryIds: string[] = []
  if (root) {
    const kids = await prisma.category.findMany({
      where: { OR: [{ id: root }, { parentId: root }] },
      select: { id: true },
    })
    categoryIds = Array.from(new Set([root, ...kids.map((row) => row.id)]))
  }

  const where = {
    status: 'ACTIVE' as const,
    mainImageUrl: { not: '' },
    ...(categoryIds.length
      ? {
          OR: [
            { categoryId: { in: categoryIds } },
            { brandCategoryId: { in: categoryIds } },
            { relationCategories: { some: { categoryId: { in: categoryIds } } } },
          ],
        }
      : {}),
  }

  const [total, rows, usdRate] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: listSelect,
    }),
    getUsdExchangeRate(prisma, { ttlMs: 60_000 }),
  ])

  return {
    items: mapProductRows(rows, usdRate, undefined, input.lang, false),
    total,
    page,
    pageSize,
  }
}

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`
}

function safeFilePart(value: string) {
  return String(value || 'item')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 60) || 'item'
}

export async function overlayPriceOnImage(image: Buffer, usdPrice: number | null): Promise<Buffer> {
  if (usdPrice == null || !(usdPrice > 0)) return image
  const meta = await sharp(image).rotate().metadata()
  const width = Math.max(200, Number(meta.width) || 800)
  const height = Math.max(200, Number(meta.height) || 800)
  const barH = Math.max(48, Math.round(height * 0.09))
  const fontSize = Math.max(22, Math.round(barH * 0.48))
  const label = formatUsd(usdPrice)
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${height - barH}" width="${width}" height="${barH}" fill="rgba(17,17,17,0.62)"/>
      <text x="${width - Math.round(width * 0.04)}" y="${height - Math.round(barH * 0.32)}"
        font-size="${fontSize}" font-family="Arial, Helvetica, sans-serif"
        fill="#ffffff" font-weight="700" text-anchor="end">${label}</text>
    </svg>`,
  )
  return sharp(image)
    .rotate()
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer()
}

async function mapLimit<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      out[index] = await mapper(items[index], index)
    }
  }
  const n = Math.min(Math.max(1, limit), Math.max(1, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return out
}

async function encodeImage(
  url: string,
  withPrice: boolean,
  usdPrice: number | null,
  opts?: { max?: number; quality?: number },
): Promise<Buffer | null> {
  const max = opts?.max ?? 900
  const quality = opts?.quality ?? 76
  const toJpeg = async (raw: Buffer) => {
    const resized = await sharp(raw)
      .rotate()
      .resize(max, max, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: false })
      .toBuffer()
    if (!withPrice) return resized
    return overlayPriceOnImage(resized, usdPrice)
  }
  try {
    return await toJpeg(await loadImageBytes(url))
  } catch {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { Accept: 'image/*,*/*;q=0.8' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) return null
      return await toJpeg(Buffer.from(await res.arrayBuffer()))
    } catch {
      return null
    }
  }
}

export async function buildPromoCatalogZip(input: {
  productIds: string[]
  withPrice: boolean
  includeColorImages: boolean
  priceOverrides?: Record<string, number>
  markupMultiplier?: number
}): Promise<{ zip: Buffer; fileCount: number }> {
  const items = await loadPromoCatalogItems(input.productIds)
  const multiplier = clampMarkup(input.markupMultiplier)
  const overrides = sanitizePriceOverrides(input.priceOverrides)

  const jobs = items.flatMap((item, index) => {
    const urls = input.includeColorImages ? [item.imageUrl, ...item.extraImageUrls] : [item.imageUrl]
    const unique = Array.from(new Set(urls.filter(Boolean)))
    const stamped = resolveStampPrice(item.id, item.usdPrice, overrides, multiplier)
    return unique.map((url, shot) => ({ index, item, url, shot, stamped }))
  })

  const encoded = await mapLimit(jobs, 8, async (job) => {
    const data = await encodeImage(job.url, input.withPrice, job.stamped)
    if (!data) return null
    const prefix = `${String(job.index + 1).padStart(2, '0')}-${safeFilePart(job.item.productCode)}`
    return {
      name: `${prefix}${job.shot > 0 ? `-${job.shot + 1}` : ''}.jpg`,
      data,
      order: job.index * 10 + job.shot,
    }
  })

  const files = encoded
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => a.order - b.order)
    .map(({ name, data }) => ({ name, data }))

  if (!files.length) {
    throw new Error('没有可下载的图片（请确认商品已上架且主图可打开）')
  }

  return { zip: buildZipStore(files), fileCount: files.length }
}

export async function buildPromoCatalogPdf(input: {
  productIds: string[]
  withPrice: boolean
  lang?: string | null
  priceOverrides?: Record<string, number>
  markupMultiplier?: number
}): Promise<{ pdf: Buffer; fileCount: number }> {
  const items = await loadPromoCatalogItems(input.productIds, input.lang)
  const multiplier = clampMarkup(input.markupMultiplier)
  const overrides = sanitizePriceOverrides(input.priceOverrides)
  const encoded = await mapLimit(items, 12, async (item) => {
    const stamped = resolveStampPrice(item.id, item.usdPrice, overrides, multiplier)
    const data = await encodeImage(item.imageUrl, input.withPrice, stamped, { max: 480, quality: 42 })
    if (!data) return null
    const caption = [item.productCode, input.withPrice && stamped ? formatUsd(stamped) : '']
      .filter(Boolean)
      .join('  ')
    return { jpeg: data, caption }
  })
  const cells = encoded.filter((row): row is NonNullable<typeof row> => Boolean(row))

  if (!cells.length) {
    throw new Error('没有可下载的图片（请确认商品已上架且主图可打开）')
  }

  return { pdf: buildJpegGridPdf(cells, 4), fileCount: cells.length }
}

function clampMarkup(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.min(99, Math.max(0.1, Math.round(n * 1000) / 1000))
}

function sanitizePriceOverrides(raw: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [id, value] of Object.entries(raw)) {
    const key = String(id || '').trim()
    const n = Number(value)
    if (!/^[a-zA-Z0-9-]{8,80}$/.test(key)) continue
    if (!Number.isFinite(n) || n <= 0) continue
    out[key] = Math.min(99999, Math.round(n * 100) / 100)
  }
  return out
}

function resolveStampPrice(
  id: string,
  wholesale: number | null,
  overrides: Record<string, number>,
  multiplier: number,
): number | null {
  if (overrides[id] != null) return overrides[id]
  if (wholesale != null && wholesale > 0) {
    return Math.round(wholesale * multiplier * 100) / 100
  }
  return null
}
