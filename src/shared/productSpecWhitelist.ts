/**
 * Customer-facing Description / 规格参数 field whitelist.
 *
 * Each inner array is one logical field; any synonym (CN/EN) matches via
 * case-insensitive substring (contains) on the attribute label.
 * To extend: add a new group, or add aliases inside an existing group.
 * To remove: delete the group or alias.
 */
export const PRODUCT_SPEC_WHITELIST_GROUPS: readonly (readonly string[])[] = [
  ['品牌', 'Brand'],
  ['材质', 'Material', '材料', '面料', 'Fabric'],
  ['颜色', 'Color', 'Colour'],
  ['尺码', '尺寸', 'Size', 'Sizing'],
  ['重量', 'Weight'],
  ['风格', '款式', 'Style'],
  ['适用季节', '季节', 'Season'],
  ['功能', 'Function'],
  ['鞋底工艺'],
] as const

/**
 * Exact-match blacklist for Description / 规格参数 field names.
 * After trim (+ case-insensitive normalize), the field name must equal an
 * entry exactly — substring/contains is NOT used (e.g. 品牌 is blocked,
 * 品牌色 is not).
 */
export const PRODUCT_SPEC_BLACKLIST: readonly string[] = [
  '品牌',
  '有可授权的自有品牌',
  '上市年份季节',
  '上市时间',
] as const

/** Normalize attribute keys for case-insensitive / trim matching. */
export function normalizeSpecFieldKey(key: string | null | undefined): string {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

let cachedBlacklistSet: Set<string> | null = null

function getBlacklistSet(): Set<string> {
  if (cachedBlacklistSet) return cachedBlacklistSet
  cachedBlacklistSet = new Set(
    PRODUCT_SPEC_BLACKLIST.map((name) => normalizeSpecFieldKey(name)).filter(Boolean),
  )
  return cachedBlacklistSet
}

/** True when the field name exactly matches a blacklist entry (after normalize). */
export function isBlacklistedSpecFieldKey(key: string | null | undefined): boolean {
  const normalized = normalizeSpecFieldKey(key)
  if (!normalized) return false
  return getBlacklistSet().has(normalized)
}

type WhitelistToken = {
  /** normalized synonym / token */
  token: string
  /** whitelist group order (0-based) */
  order: number
}

let cachedTokens: WhitelistToken[] | null = null

/**
 * Flat token list sorted longest-first so e.g. `适用季节` wins over `季节`,
 * then by earlier group order for equal length.
 */
function getWhitelistTokens(): WhitelistToken[] {
  if (cachedTokens) return cachedTokens
  const tokens: WhitelistToken[] = []
  PRODUCT_SPEC_WHITELIST_GROUPS.forEach((group, order) => {
    for (const alias of group) {
      const normalized = normalizeSpecFieldKey(alias)
      if (normalized) tokens.push({ token: normalized, order })
    }
  })
  tokens.sort((a, b) => b.token.length - a.token.length || a.order - b.order)
  cachedTokens = tokens
  return cachedTokens
}

/**
 * Returns whitelist group order index when the normalized field name
 * **contains** any whitelist token; otherwise -1.
 * Longer tokens are preferred over shorter ones when assigning a group.
 */
export function getSpecFieldWhitelistOrder(key: string | null | undefined): number {
  const normalized = normalizeSpecFieldKey(key)
  if (!normalized) return -1
  for (const { token, order } of getWhitelistTokens()) {
    if (normalized.includes(token)) return order
  }
  return -1
}

export function isWhitelistedSpecFieldKey(key: string | null | undefined): boolean {
  return getSpecFieldWhitelistOrder(key) >= 0
}

export type SpecParamRow = {
  key: string
  value: string
}

/**
 * Keep only whitelisted Description / 规格参数 rows.
 * Filter order:
 * 1. Whitelist — case-insensitive contains match on field name (CN/EN tokens)
 * 2. Blacklist — exact match (after normalize) drops banned names (wins over whitelist)
 * - Each matching original row is kept (e.g. 鞋面材质 + 内里材质 both show)
 * - Stable order: first by whitelist group priority, then original row order
 */
export function filterDescriptionParamsByWhitelist<T extends SpecParamRow>(rows: T[] | null | undefined): T[] {
  if (!rows?.length) return []

  const matched: { order: number; index: number; row: T }[] = []
  rows.forEach((row, index) => {
    const order = getSpecFieldWhitelistOrder(row.key)
    if (order < 0) return
    if (isBlacklistedSpecFieldKey(row.key)) return
    const value = String(row.value || '').trim()
    if (!value) return
    matched.push({ order, index, row })
  })

  return matched
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ row }) => row)
}
