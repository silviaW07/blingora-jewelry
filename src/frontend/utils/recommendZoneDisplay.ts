import { isDateKeyProductName } from '@/frontend/utils/dailyNewArrival'

/**
 * 推荐专区前台展示限额工具（与后台「PC列数 × 行数」文案一致）。
 */

export type RecommendZoneLayout = {
  title?: string | null
  zoneType?: string
  pcCols: number
  pcRows: number
  mobileCols?: number
  items?: unknown[]
}

/**
 * 前台展示限额：PC列数 × 行数。
 * 例：4 列 × 12 行 = 最多 48 个。
 */
export function resolveRecommendZoneDisplayLimit(zone: Pick<RecommendZoneLayout, 'pcCols' | 'pcRows'>): number {
  const cols = Math.max(1, Number(zone.pcCols) || 4)
  const rows = Math.max(1, Math.min(12, Number(zone.pcRows) || 2))
  return cols * rows
}

/** 按专区布局配置截断明细（保留已有排序）。 */
export function limitRecommendZoneItems<T>(
  zone: Pick<RecommendZoneLayout, 'pcCols' | 'pcRows'>,
  items: T[],
): T[] {
  if (!Array.isArray(items) || items.length === 0) return []
  const limit = resolveRecommendZoneDisplayLimit(zone)
  return items.length > limit ? items.slice(0, limit) : items
}

/** 首页不展示 coming soon / 日期商品条（那些只放 Coming 页）。 */
export function zoneLooksLikeComingSoon(zone: RecommendZoneLayout): boolean {
  if (isComingSoonRecommendZoneTitle(zone.title)) return true
  const items = Array.isArray(zone.items) ? zone.items : []
  const names = items
    .map((item) => {
      const row = item as { productName?: string; rawProductName?: string }
      return String(row.rawProductName || row.productName || '').trim()
    })
    .filter(Boolean)
  if (names.length < 3) return false
  const dated = names.filter(
    (name) => isDateKeyProductName(name) || /^20\d{2}[-/.]/.test(name),
  ).length
  return dated * 2 >= names.length
}

/** 首页可展示的内容专区：类目/商品目录，含 Coming 目录；买家秀与无名日期条仍排除。 */
export function isStorefrontHomeContentZone(zone: RecommendZoneLayout): boolean {
  const type = String(zone.zoneType || '')
  if (type !== 'PRODUCT' && type !== 'CATEGORY') return false
  const title = String(zone.title || '')
  if (/买家秀/.test(title)) return false
  // Official Coming directory stays on the home page.
  if (isComingSoonRecommendZoneTitle(zone.title)) return true
  // Untitled dated product dumps belong on the Coming page only.
  if (type === 'PRODUCT' && zoneLooksLikeComingSoon(zone)) return false
  return true
}
export function isComingSoonRecommendZoneTitle(title: string | null | undefined): boolean {
  const key = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/_-]+/g, '')
  if (!key) return false
  return (
    key === 'coming' ||
    key === 'comingsoon' ||
    key.includes('comingsoon') ||
    key === '即将上新'
  )
}

export function pickComingSoonRecommendZone<T extends RecommendZoneLayout>(
  zones: T[],
): T | null {
  const productZones = (zones || []).filter((zone) => {
    const items = Array.isArray(zone.items) ? zone.items : []
    if (items.length === 0) return false
    if (zone.zoneType && zone.zoneType !== 'PRODUCT') return false
    return items.some((item) => {
      const row = item as { entityType?: string; productId?: string }
      return row.entityType === 'PRODUCT' || Boolean(row.productId)
    })
  })
  const exact = productZones.find((zone) => {
    const key = String(zone.title || '')
      .trim()
      .toLowerCase()
      .replace(/[\s/_-]+/g, '')
    return key === 'comingsoon'
  })
  if (exact) return exact
  const titled = productZones.find((zone) => isComingSoonRecommendZoneTitle(zone.title))
  if (titled) return titled

  const looksDated = productZones.find((zone) => {
    const names = (zone.items || [])
      .map((item) => {
        const row = item as { productName?: string; rawProductName?: string }
        return String(row.rawProductName || row.productName || '').trim()
      })
      .filter(Boolean)
    if (names.length < 3) return false
    const dated = names.filter((name) => isDateKeyProductName(name)).length
    return dated * 2 >= names.length
  })
  return looksDated || null
}
