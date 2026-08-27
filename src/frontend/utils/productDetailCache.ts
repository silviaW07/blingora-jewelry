'use client'

import { getProductDetail } from '@/frontend/actions/ProductDetail'
import type { ProductDetailData } from '@/frontend/actions/ProductDetail'
import { getClientPreferredLang } from '@/frontend/i18n'
import { isStorefrontVisibleProduct } from '@/shared/storefrontProductVisibility'

type CacheEntry = {
  product: ProductDetailData
  fetchedAt: number
}

type PreviewEntry = {
  id: string
  name: string
  image: string
}

const TTL_MS = 3 * 60 * 1000
const MAX_ENTRIES = 24
const PREVIEW_KEY = 'sj.pdp-preview.v1'

const memory = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<ProductDetailData>>()

function makeKey(productId?: string | null, slug?: string | null, lang?: string | null) {
  return `${String(lang || 'en')}::${String(productId || '').trim()}::${String(slug || '').trim()}`
}

function prune() {
  if (memory.size <= MAX_ENTRIES) return
  const extra = memory.size - MAX_ENTRIES
  const keys = [...memory.keys()].slice(0, extra)
  for (const key of keys) memory.delete(key)
}

export function readCachedProductDetail(
  productId?: string | null,
  slug?: string | null,
  lang?: string | null,
): ProductDetailData | null {
  const key = makeKey(productId, slug, lang)
  const entry = memory.get(key)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    memory.delete(key)
    return null
  }
  if (!isStorefrontVisibleProduct(entry.product)) {
    memory.delete(key)
    return null
  }
  return entry.product
}

export function writeCachedProductDetail(
  product: ProductDetailData,
  lang?: string | null,
  slug?: string | null,
) {
  if (!isStorefrontVisibleProduct(product)) return
  const key = makeKey(product.id, slug, lang)
  memory.delete(key)
  memory.set(key, { product, fetchedAt: Date.now() })
  prune()
}

export function writeProductDetailPreview(preview: PreviewEntry) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(preview))
  } catch {
    // ignore quota
  }
}

export function readProductDetailPreview(productId?: string | null): PreviewEntry | null {
  if (typeof window === 'undefined' || !productId) return null
  try {
    const raw = window.sessionStorage.getItem(PREVIEW_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PreviewEntry
    if (!parsed?.id || parsed.id !== productId) return null
    return parsed
  } catch {
    return null
  }
}

/** Hover / tap: start the detail RPC before navigation so the click often paints from cache. */
export function prefetchProductDetail(productId: string) {
  const id = String(productId || '').trim()
  if (!id || typeof window === 'undefined') return

  // Mobile scroll/touch fires pointerenter — skip to keep bandwidth for images + add-to-cart
  try {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  } catch {
    // continue
  }

  const lang = getClientPreferredLang()
  if (readCachedProductDetail(id, null, lang)) return

  const key = makeKey(id, null, lang)
  if (inflight.has(key)) return
  if (inflight.size >= 2) return

  const request = getProductDetail({ productId: id, lang })
    .then((data) => {
      writeCachedProductDetail(data.product, lang)
      return data.product
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, request)
  void request.catch(() => {
    // prefetch is best-effort
  })
}
