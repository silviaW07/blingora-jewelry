export const formatIdentifierYearMonth = (date = new Date()) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}${month}`
}

export const resolveCategoryShortCode = (slug?: string | null) => {
  const normalized = String(slug || '').trim().toUpperCase()
  if (!normalized) return null
  const parts = normalized.split(/[^A-Z0-9]+/).filter(Boolean)
  if (!parts.length) return null
  if (parts.length === 1) {
    const token = parts[0]
    return token.slice(0, Math.min(4, token.length))
  }
  const compact = parts.map((part) => part[0]).join('')
  return compact.slice(0, Math.min(4, compact.length))
}

/** Stable short token for non-ASCII labels (e.g. Chinese 颜色/尺码) that strip to empty under A-Z0-9. */
export const shortIdentifierToken = (value: string, length = 4) => {
  let hash = 2166136261
  const input = String(value || '')
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const token = (hash >>> 0).toString(36).toUpperCase()
  return token.slice(0, length).padStart(length, '0')
}

export const normalizeSpecSegment = (value?: string | null) => {
  const raw = String(value || '').trim()
  if (!raw) return 'STD'
  const normalized = raw
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // Chinese / other non-ASCII sizes previously collapsed to STD and collided across SKUs
  if (!normalized) return `S${shortIdentifierToken(raw)}`
  return normalized
}

const COMMON_COLOR_CODES: Record<string, string> = {
  BLACK: 'BK',
  WHITE: 'WH',
  BLUE: 'BL',
  RED: 'RD',
  GREEN: 'GN',
  YELLOW: 'YL',
  PINK: 'PK',
  PURPLE: 'PP',
  BROWN: 'BN',
  GREY: 'GY',
  GRAY: 'GY',
  ORANGE: 'OG',
  GOLD: 'GD',
  SILVER: 'SV',
}

export const normalizeColorShortCode = (value?: string | null) => {
  const raw = String(value || '').trim()
  if (!raw) return 'DF'
  const normalizedWord = raw.toUpperCase().replace(/[^A-Z0-9]+/g, '')
  if (COMMON_COLOR_CODES[normalizedWord]) return COMMON_COLOR_CODES[normalizedWord]
  if (normalizedWord.length >= 2) return normalizedWord.slice(0, 2)
  if (normalizedWord.length === 1) return `${normalizedWord}X`
  // Chinese color names (黑色/金色/…) previously all became DF → unique-constraint failures
  return `C${shortIdentifierToken(raw)}`
}

/**
 * Build a SKU code: `{spu}-{spec}-{color}` plus optional `-{NN}` sequence.
 * Always pass `sequence` (0-based index) when expanding color×size grids so rows stay unique
 * even when two variants normalize to the same segments.
 */
export const buildSkuIdentifier = (
  spuCode: string,
  spec?: string | null,
  color?: string | null,
  sequence?: number | null,
) => {
  const base = `${spuCode}-${normalizeSpecSegment(spec)}-${normalizeColorShortCode(color)}`
  if (sequence == null || !Number.isFinite(sequence) || sequence < 0) return base
  return `${base}-${String(Math.floor(sequence) + 1).padStart(2, '0')}`
}
