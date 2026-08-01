/**
 * Sort product size labels for display / ingest.
 * - Numeric sizes (35, 41码, EU42…): ascending by number
 * - Letter sizes (XXS…XXXL): standard apparel order
 * - Mixed lists: numerics first (asc), then letters, then other
 */

const LETTER_SIZE_RANK: Record<string, number> = {
  xxxs: 0,
  xxs: 1,
  xs: 2,
  s: 3,
  m: 4,
  l: 5,
  xl: 6,
  xxl: 7,
  '2xl': 7,
  xxxl: 8,
  '3xl': 8,
  xxxxl: 9,
  '4xl': 9,
  xxxxxl: 10,
  '5xl': 10,
}

type SizeKind = 'numeric' | 'letter' | 'other'

type ParsedSize = {
  kind: SizeKind
  num: number
  letterRank: number
  raw: string
}

const KIND_ORDER: Record<SizeKind, number> = {
  numeric: 0,
  letter: 1,
  other: 2,
}

const normalizeSizeToken = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[码號号]/g, '')

const stripSizeAffixes = (token: string) =>
  token
    .replace(/^(eu|us|uk|cn|jp|kr|cm|mm)/i, '')
    .replace(/(eu|us|uk|cn|jp|kr|cm|mm)$/i, '')

const parseSizeLabel = (value: string): ParsedSize => {
  const raw = String(value || '').trim()
  const token = normalizeSizeToken(raw)
  if (!token) {
    return { kind: 'other', num: Number.POSITIVE_INFINITY, letterRank: Number.POSITIVE_INFINITY, raw }
  }

  const letterKey = stripSizeAffixes(token)
  if (letterKey in LETTER_SIZE_RANK) {
    return {
      kind: 'letter',
      num: Number.POSITIVE_INFINITY,
      letterRank: LETTER_SIZE_RANK[letterKey],
      raw,
    }
  }

  // e.g. 35 / 35.5 / 41码 / EU42 / 42EU
  const numericCandidate = stripSizeAffixes(token)
  const numericMatch = numericCandidate.match(/^(\d+(?:\.\d+)?)([a-z]*)$/i)
  if (numericMatch) {
    const num = Number(numericMatch[1])
    const suffix = (numericMatch[2] || '').toLowerCase()
    if (Number.isFinite(num) && (!suffix || !(suffix in LETTER_SIZE_RANK) || suffix.length <= 1)) {
      // Pure numeric, or shoe/bra style like 36A — treat as numeric primary key
      const letterRank =
        suffix && suffix in LETTER_SIZE_RANK
          ? LETTER_SIZE_RANK[suffix]
          : suffix
            ? suffix.charCodeAt(0)
            : 0
      return { kind: 'numeric', num, letterRank, raw }
    }
  }

  // Leading number with trailing text that is not a letter size (e.g. "35童")
  const leadingNum = token.match(/^(\d+(?:\.\d+)?)/)
  if (leadingNum) {
    const num = Number(leadingNum[1])
    if (Number.isFinite(num)) {
      return { kind: 'numeric', num, letterRank: 0, raw }
    }
  }

  return { kind: 'other', num: Number.POSITIVE_INFINITY, letterRank: Number.POSITIVE_INFINITY, raw }
}

export const compareSizeLabels = (a: string, b: string): number => {
  const pa = parseSizeLabel(a)
  const pb = parseSizeLabel(b)

  if (pa.kind !== pb.kind) {
    return KIND_ORDER[pa.kind] - KIND_ORDER[pb.kind]
  }

  if (pa.kind === 'numeric') {
    if (pa.num !== pb.num) return pa.num - pb.num
    if (pa.letterRank !== pb.letterRank) return pa.letterRank - pb.letterRank
    return pa.raw.localeCompare(pb.raw, 'zh-CN', { numeric: true, sensitivity: 'base' })
  }

  if (pa.kind === 'letter') {
    if (pa.letterRank !== pb.letterRank) return pa.letterRank - pb.letterRank
    return pa.raw.localeCompare(pb.raw, 'zh-CN', { sensitivity: 'base' })
  }

  return pa.raw.localeCompare(pb.raw, 'zh-CN', { numeric: true, sensitivity: 'base' })
}

export const sortSizeLabels = <T extends string>(sizes: T[]): T[] =>
  [...sizes].sort(compareSizeLabels)
