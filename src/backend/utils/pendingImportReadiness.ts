/** Client/server shared: treat stuck scrapes with filled core fields as publishable. */

export const PENDING_IMPORT_STUCK_MS = 5 * 60 * 1000

export type PendingImportReadinessSnapshot = {
  fetchStatus?: string | null
  isPublished?: boolean
  title?: string | null
  mainImageUrl?: string | null
  galleryUrls?: Array<string | null | undefined> | null
  prices?: Array<number | null | undefined> | null
  updatedAt?: Date | string | null
  createdAt?: Date | string | null
}

export function isPlaceholderPendingImportTitle(name?: string | null): boolean {
  const normalized = String(name ?? '').trim()
  if (!normalized) return true
  return /^\[1688抓取\]/.test(normalized) || /^\[1688\?+\]/.test(normalized)
}

export function isPlaceholderPendingImportImage(url?: string | null): boolean {
  const normalized = String(url ?? '').trim()
  if (!normalized) return true
  return /images\.unsplash\.com/i.test(normalized) || /photo-1581091226825-a6a2a5aee158/i.test(normalized)
}

function firstRealImageUrl(snapshot: PendingImportReadinessSnapshot): string | null {
  if (snapshot.mainImageUrl && !isPlaceholderPendingImportImage(snapshot.mainImageUrl)) {
    return String(snapshot.mainImageUrl).trim()
  }
  for (const url of snapshot.galleryUrls || []) {
    if (url && !isPlaceholderPendingImportImage(url)) return String(url).trim()
  }
  return null
}

function hasPositivePrice(snapshot: PendingImportReadinessSnapshot): boolean {
  return (snapshot.prices || []).some(
    value => typeof value === 'number' && Number.isFinite(value) && value > 0,
  )
}

/** Real title (non-placeholder) + main image + price > 0. */
export function hasPendingImportCoreFields(snapshot: PendingImportReadinessSnapshot): boolean {
  if (isPlaceholderPendingImportTitle(snapshot.title)) return false
  if (!firstRealImageUrl(snapshot)) return false
  return hasPositivePrice(snapshot)
}

export function isPendingImportFetchIncomplete(status?: string | null): boolean {
  const normalized = String(status || '').trim()
  return !!normalized && normalized !== 'COMPLETED'
}

export function isPendingImportStale(
  snapshot: PendingImportReadinessSnapshot,
  now = Date.now(),
): boolean {
  const anchor = snapshot.updatedAt ?? snapshot.createdAt
  if (!anchor) return false
  const ts = new Date(anchor).getTime()
  if (!Number.isFinite(ts)) return false
  return now - ts >= PENDING_IMPORT_STUCK_MS
}

/**
 * Incomplete fetch (pending / running / 0%-like) stuck ≥5 minutes,
 * but title + main image + price already filled successfully.
 */
export function isPendingImportEffectivelyReady(
  snapshot: PendingImportReadinessSnapshot,
  now = Date.now(),
): boolean {
  if (snapshot.isPublished) return false
  if (!isPendingImportFetchIncomplete(snapshot.fetchStatus)) return false
  return hasPendingImportCoreFields(snapshot) && isPendingImportStale(snapshot, now)
}

/** Official COMPLETED, or stuck incomplete scrape that already has core fields. */
export function canPublishPendingImportItem(
  snapshot: PendingImportReadinessSnapshot,
  now = Date.now(),
): boolean {
  if (snapshot.isPublished) return false
  if (snapshot.fetchStatus === 'COMPLETED') return true
  return isPendingImportEffectivelyReady(snapshot, now)
}

/** UI: treat effectively-ready rows as COMPLETED for badges / gates. */
export function getEffectivePendingImportFetchStatus(
  snapshot: PendingImportReadinessSnapshot,
  now = Date.now(),
): string {
  if (snapshot.fetchStatus === 'COMPLETED' || isPendingImportEffectivelyReady(snapshot, now)) {
    return 'COMPLETED'
  }
  return snapshot.fetchStatus || 'PENDING'
}

export function snapshotFromPendingImportQueueItem(item: {
  item_fetchStatus?: string | null
  item_isPublished?: boolean
  item_productName?: string | null
  item_parsedName?: string | null
  item_mainImageUrl?: string | null
  item_parsedMainImageUrl?: string | null
  item_galleryUrls?: string[] | null
  item_cnyPriceMin?: number | null
  item_cnyPriceMax?: number | null
  item_costPrice?: number | null
  item_usdPriceMin?: number | null
  item_updatedAt?: Date | string | null
  item_createdAt?: Date | string | null
  item_skus?: Array<{ price?: number | null }> | null
}): PendingImportReadinessSnapshot {
  return {
    fetchStatus: item.item_fetchStatus,
    isPublished: item.item_isPublished,
    title: item.item_productName || item.item_parsedName,
    mainImageUrl: item.item_mainImageUrl || item.item_parsedMainImageUrl,
    galleryUrls: item.item_galleryUrls,
    prices: [
      ...(item.item_skus || []).map(sku => sku.price),
      item.item_cnyPriceMin,
      item.item_cnyPriceMax,
      item.item_costPrice,
      item.item_usdPriceMin,
    ],
    updatedAt: item.item_updatedAt,
    createdAt: item.item_createdAt,
  }
}
