/**
 * Storefront product search tokenization + fuzzy match.
 *
 * Historical rule (Jul 2026): title / SKU **contains** match, case-insensitive
 * (LIKE '%bags%'), not exact equality.
 *
 * Multi-word queries (e.g. "chanel bag") must not require the contiguous phrase —
 * every token must appear somewhere in the searchable corpus (AND of contains).
 */

export function tokenizeProductSearch(raw?: string | null): string[] {
  const seen = new Set<string>()
  const tokens: string[] = []
  for (const part of String(raw || '')
    .trim()
    .toLowerCase()
    .split(/[\s+/|,_，、.-]+/)) {
    const token = part.trim()
    if (!token || seen.has(token)) continue
    seen.add(token)
    tokens.push(token)
  }
  return tokens
}

/** Collect plain-text fields from translationsJson for search. */
export function collectTranslationSearchTexts(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return []
  const out: string[] = []
  const root = raw as Record<string, unknown>
  for (const key of ['title_en', 'titleEn', 'nameEn', 'title_es', 'titleEs']) {
    const value = root[key]
    if (typeof value === 'string' && value.trim()) out.push(value)
  }
  for (const value of Object.values(root)) {
    if (!value || typeof value !== 'object') continue
    const block = value as Record<string, unknown>
    for (const field of ['name', 'shortDescription', 'detail', 'detailText']) {
      const text = block[field]
      if (typeof text === 'string' && text.trim()) out.push(text)
    }
  }
  return out
}

/** Flatten brandKeywordsJson (string[] or { keyword }[]) into searchable strings. */
export function collectBrandKeywordTexts(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      out.push(item)
      continue
    }
    if (item && typeof item === 'object' && 'keyword' in item) {
      const keyword = String((item as { keyword?: unknown }).keyword ?? '').trim()
      if (keyword) out.push(keyword)
    }
  }
  return out
}

/** Prisma AND of `contains` for each token — 供应商「黛尔 / 广州 珠宝」都能命中全称. */
export function buildTokenContainsAnd(
  field: string,
  raw?: string | null,
): Record<string, unknown> | null {
  const tokens = tokenizeProductSearch(raw)
  if (!tokens.length) return null
  if (tokens.length === 1) {
    return { [field]: { contains: tokens[0] } }
  }
  return {
    AND: tokens.map((token) => ({ [field]: { contains: token } })),
  }
}

export function productMatchesSearchTokens(
  tokens: string[],
  fields: Array<string | null | undefined>,
): boolean {
  if (!tokens.length) return true
  const corpus = fields
    .map((field) => String(field || '').toLowerCase())
    .filter(Boolean)
    .join('\n')
  if (!corpus) return false
  return tokens.every((token) => corpus.includes(token))
}
