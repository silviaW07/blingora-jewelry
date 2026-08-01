import type { TFunction } from 'i18next'
import { normalizeSpecFieldKey } from '@/shared/productSpecWhitelist'
import {
  PRODUCT_KEYWORD_EN,
  PRODUCT_KEYWORD_ES,
  PRODUCT_KEYWORD_ORDER,
  collapseRepeatedTitleWords,
} from '@/shared/productKeywordDictionary'

/**
 * Chinese color / style / material tokens for Description 规格参数 value translation.
 * Source of truth: `src/shared/productKeywordDictionary.ts` (longer-before-shorter).
 * Locale JSON `productSpec.colorKeywords.*` overrides when present; otherwise
 * static EN/ES maps are used.
 */
export const PRODUCT_SPEC_COLOR_STYLE_KEYWORDS: readonly string[] = PRODUCT_KEYWORD_ORDER

const COLOR_STYLE_FIELD_KEYS = new Set(
  [
    '颜色',
    'color',
    'colour',
    '款式',
    '风格',
    'style',
    '材质',
    '材料',
    '面料',
    'material',
    'fabric',
  ].map((k) => normalizeSpecFieldKey(k)),
)

const LATIN_EDGE = /[A-Za-z0-9]/
const CJK_EDGE = /[\u4e00-\u9fff]/

/** True for Description fields whose values should keyword-translate. */
export function isColorOrStyleSpecField(label: string | null | undefined): boolean {
  const normalized = normalizeSpecFieldKey(label)
  return Boolean(normalized) && COLOR_STYLE_FIELD_KEYS.has(normalized)
}

/** Longest non-empty keyword at index — never first-in-list / never empty. */
function longestKeywordAt(raw: string, index: number): string | null {
  let best: string | null = null
  for (const keyword of PRODUCT_SPEC_COLOR_STYLE_KEYWORDS) {
    if (!keyword || keyword.length === 0) continue
    if (!raw.startsWith(keyword, index)) continue
    if (!best || keyword.length > best.length) best = keyword
  }
  return best
}

function startsKeywordAt(raw: string, index: number): boolean {
  return longestKeywordAt(raw, index) != null
}

function joinTranslatedPieces(pieces: string[]): string {
  let out = ''
  for (const piece of pieces) {
    if (!piece) continue
    if (out) {
      const prev = out.split(/\s+/).pop() || ''
      if (prev && prev.toLowerCase() === piece.toLowerCase()) continue
    }
    if (!out) {
      out = piece
      continue
    }
    const leftLatin = LATIN_EDGE.test(out[out.length - 1] || '')
    const rightLatin = LATIN_EDGE.test(piece[0] || '')
    const leftCjk = CJK_EDGE.test(out[out.length - 1] || '')
    const rightCjk = CJK_EDGE.test(piece[0] || '')
    if (leftLatin && rightLatin) {
      out += ` ${piece}`
    } else if ((leftLatin && rightCjk) || (leftCjk && rightLatin)) {
      out += ` ${piece}`
    } else {
      out += piece
    }
  }
  return collapseRepeatedTitleWords(out)
}

function staticKeywordFallback(keyword: string, lng?: string | null): string {
  const code = String(lng || '').toLowerCase()
  if (code.startsWith('es')) return PRODUCT_KEYWORD_ES[keyword] || keyword
  if (code.startsWith('zh')) return keyword
  return PRODUCT_KEYWORD_EN[keyword] || keyword
}

/**
 * Replace known Chinese color/style/material keywords inside a compound string.
 * Single left-to-right longest-match pass — never re-scans replaced segments.
 * Example: 黑色帆布凉鞋 → Black Canvas Sandals (EN).
 */
export function translateColorStyleText(text: string | null | undefined, t: TFunction): string {
  const raw = String(text || '').trim()
  if (!raw) return ''

  const lng =
    typeof (t as { language?: string }).language === 'string'
      ? (t as { language?: string }).language
      : undefined

  const pieces: string[] = []
  let i = 0
  while (i < raw.length) {
    const keyword = longestKeywordAt(raw, i)
    if (keyword) {
      const i18nKey = `productSpec.colorKeywords.${keyword}`
      const translated = t(i18nKey)
      const hit =
        translated && translated !== i18nKey
          ? translated
          : staticKeywordFallback(keyword, lng)
      const hitLen = keyword.length
      if (hitLen <= 0) {
        pieces.push(raw[i] || '')
        i += 1
        continue
      }
      pieces.push(hit)
      i += hitLen
      continue
    }
    let j = i + 1
    while (j < raw.length && !startsKeywordAt(raw, j)) j += 1
    pieces.push(raw.slice(i, j))
    i = j
  }

  return joinTranslatedPieces(pieces)
}

/**
 * Translate a Description / 规格参数 cell value when the field is color/style/material.
 * Size and other whitelist fields pass through unchanged.
 */
export function translateProductSpecValue(
  label: string | null | undefined,
  value: string | null | undefined,
  t: TFunction,
): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (!isColorOrStyleSpecField(label)) return raw
  return translateColorStyleText(raw, t)
}

/** Translate Description field labels (颜色/尺码/材质 …). */
const SPEC_FIELD_LABEL_KEYS: Record<string, string> = {
  颜色: 'common.color',
  color: 'common.color',
  colour: 'common.color',
  尺码: 'common.size',
  尺寸: 'common.size',
  规格: 'productSpec.fields.spec',
  size: 'common.size',
  sizing: 'common.size',
  材质: 'productSpec.fields.material',
  材料: 'productSpec.fields.material',
  面料: 'productSpec.fields.fabric',
  material: 'productSpec.fields.material',
  fabric: 'productSpec.fields.fabric',
  重量: 'productSpec.fields.weight',
  weight: 'productSpec.fields.weight',
  风格: 'productSpec.fields.style',
  款式: 'productSpec.fields.style',
  style: 'productSpec.fields.style',
  适用季节: 'productSpec.fields.season',
  季节: 'productSpec.fields.season',
  season: 'productSpec.fields.season',
  功能: 'productSpec.fields.function',
  function: 'productSpec.fields.function',
  鞋底工艺: 'productSpec.fields.soleProcess',
}

export function translateProductSpecLabel(
  label: string | null | undefined,
  t: TFunction,
): string {
  const raw = String(label || '').trim()
  if (!raw) return ''
  const key = SPEC_FIELD_LABEL_KEYS[raw] || SPEC_FIELD_LABEL_KEYS[raw.toLowerCase()]
  if (!key) return raw
  const translated = t(key)
  return translated && translated !== key ? translated : raw
}
