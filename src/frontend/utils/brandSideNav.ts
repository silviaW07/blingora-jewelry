/**
 * Shared Brand SIDE_NAV zone picker for home rail + CATEGORIES flyout.
 * Prefer "Brand", then "Hot", then first available zone.
 */
export function pickBrandSideNavZone<T extends { title: string; zoneType?: string }>(
  zones: T[],
  options?: { requireSideNavType?: boolean },
): T | null {
  const scoped = options?.requireSideNavType
    ? zones.filter((zone) => zone.zoneType === 'SIDE_NAV')
    : zones
  return (
    scoped.find((zone) => zone.title.trim().toLowerCase() === 'brand') ||
    scoped.find((zone) => zone.title.trim().toLowerCase() === 'hot') ||
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
