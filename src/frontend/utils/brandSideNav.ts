/**
 * Shared Brand SIDE_NAV zone picker for home rail + CATEGORIES flyout.
 * Prefer "Brand", then "Hot", then first available zone.
 *
 * Note: `getCategorySideNavZones` returns zones already filtered to SIDE_NAV and
 * does not include `zoneType` on each zone. When `requireSideNavType` is true,
 * treat missing `zoneType` as already scoped (do not drop every zone).
 */
export function pickBrandSideNavZone<T extends { title: string; zoneType?: string }>(
  zones: T[],
  options?: { requireSideNavType?: boolean },
): T | null {
  const list = Array.isArray(zones) ? zones : []
  const scoped = options?.requireSideNavType
    ? list.filter((zone) => {
        const zt = zone.zoneType
        // Missing zoneType ≈ payload already SIDE_NAV-only (getCategorySideNavZones)
        return zt == null || zt === '' || zt === 'SIDE_NAV'
      })
    : list

  const titleKey = (title: string) => title.trim().toLowerCase()
  return (
    scoped.find((zone) => {
      const t = titleKey(zone.title)
      return t === 'brand' || t === '品牌'
    }) ||
    scoped.find((zone) => {
      const t = titleKey(zone.title)
      return t === 'hot' || t === '热门'
    }) ||
    scoped[0] ||
    null
  )
}

export type BrandNavListItem = {
  id: string
  label: string
  key?: string
  slug?: string | null
}
