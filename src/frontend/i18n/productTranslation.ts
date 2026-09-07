/** 商品/分类 translationsJson 的语言解析（服务端与客户端可共用） */

import {
  collapseRepeatedTitleWords,
  containsChinese,
  fixStorefrontLabelTypos,
  stripChineseFromTitle,
  translateTitleKeywords,
} from '@/shared/productKeywordDictionary'

/**
 * Storefront only serves en/es. Historical `zh` preference maps to English
 * so product APIs never return Chinese titles.
 */
export function normalizeProductLang(raw?: string | null): 'en' | 'es' {
  const value = String(raw || '').trim().toLowerCase()
  if (value.startsWith('es')) return 'es'
  return 'en'
}

export type ProductTranslationBlock = {
  name?: string
  shortDescription?: string
  detail?: string
  detailText?: string
}

/**
 * Exact locale block only (no cross-language fallback).
 * Prefer this for product titles so EN never silently shows ZH.
 */
export function pickExactProductTranslation(
  raw: unknown,
  lang?: string | null,
): ProductTranslationBlock | null {
  if (!raw || typeof raw !== 'object') return null
  const map = raw as Record<string, ProductTranslationBlock>
  const code = normalizeProductLang(lang)
  return map[code] || map[lang || ''] || null
}

export function pickProductTranslation(
  raw: unknown,
  lang?: string | null,
): ProductTranslationBlock | null {
  if (!raw || typeof raw !== 'object') return null
  const map = raw as Record<string, ProductTranslationBlock>
  const code = normalizeProductLang(lang)
  // Soft fallback for shortDescription / detail: prefer locale → en only (never zh).
  return map[code] || map[lang || ''] || map.en || null
}

const QUALITY_SHELF_SUFFIX_RE =
  /(?:high|normal|low|premium)[\s-]*quality(?:[\s-]+(?:bag|bags|jewelry|jewellery|jewelery))?\s*$/i

/** Strip glued 1688 quality tags: `mommy baghigh quality bag` → `mommy bag`. */
export function stripQualityShelfSuffix(raw: string | null | undefined): string {
  let value = String(raw || '').trim()
  if (!value) return ''
  for (let i = 0; i < 3; i += 1) {
    const next = value.replace(QUALITY_SHELF_SUFFIX_RE, '').replace(/\s+/g, ' ').trim()
    if (next === value) break
    value = next
  }
  return value
}

/** `LV 1822` / `COACH 5 6363-1` leftover model codes. */
const SKU_RESIDUE_TAIL_RE =
  /(?:\s+(?:[A-Z]{1,8}\s+)?)?(?:\d{1,4}\s+)+\d{2,}(?:[-\s]\d{1,4})+$/
const SKU_RESIDUE_CODE_RE = /\s+\d{3,6}(?:[-\s]\d{1,4}){1,3}$/
const SKU_RESIDUE_SHORT_CODE_RE = /\s+\d{3,6}$/

const BRAND_ONLY_TITLES = new Set(
  [
    'louis vuitton',
    'lv',
    'chanel',
    'gucci',
    'dior',
    'prada',
    'hermes',
    'hermès',
    'coach',
    'celine',
    'ysl',
    'saint laurent',
    'fendi',
    'balenciaga',
    'burberry',
    'goyard',
    'loewe',
    'miumiu',
    'miu miu',
    'versace',
    'valentino',
    'givenchy',
    'bottega',
    'tiffany',
    'cartier',
    'van cleef',
    'vancleef',
  ].map((item) => item.replace(/\s+/g, ' ')),
)

function titleLooksBrandPrefixed(raw: string): boolean {
  const lower = raw.trim().toLowerCase()
  if (!lower) return false
  for (const brand of BRAND_ONLY_TITLES) {
    if (lower === brand || lower.startsWith(`${brand} `) || lower.startsWith(`${brand.replace(/\s+/g, '')} `)) {
      return true
    }
  }
  return false
}

export function stripSkuResidueFromTitle(raw: string | null | undefined): string {
  let value = String(raw || '').trim()
  if (!value) return ''
  value = value.replace(SKU_RESIDUE_TAIL_RE, '').trim()
  value = value.replace(SKU_RESIDUE_CODE_RE, '').trim()
  if (titleLooksBrandPrefixed(value)) {
    value = value.replace(SKU_RESIDUE_SHORT_CODE_RE, '').trim()
  }
  return value.replace(/\s+/g, ' ').trim()
}

function isBrandOnlyTitle(raw: string | null | undefined): boolean {
  const key = String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!key) return false
  return BRAND_ONLY_TITLES.has(key) || BRAND_ONLY_TITLES.has(key.replace(/\s/g, ''))
}

const BRAND_DISPLAY_NAME: Record<string, string> = {
  lv: 'Louis Vuitton',
  ysl: 'Saint Laurent',
  miumiu: 'Miu Miu',
  'miu miu': 'Miu Miu',
  vancleef: 'Van Cleef',
  'van cleef': 'Van Cleef',
}

function expandBrandOnlyTitle(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  return BRAND_DISPLAY_NAME[key] || BRAND_DISPLAY_NAME[key.replace(/\s/g, '')] || raw
}

function pickTitleTypeHint(
  categoryName?: string | null,
  parentCategoryName?: string | null,
  shortDescription?: string | null,
): string {
  const candidates = [categoryName, parentCategoryName, shortDescription]
  for (const candidate of candidates) {
    const text = stripQualityShelfSuffix(healLatinTitle(String(candidate || '').trim(), 'en'))
    if (!text) continue
    if (isBrandOnlyTitle(text)) continue
    if (/^(daily\s*new|new arrival|coming|brand|brands|all)$/i.test(text)) continue
    const first = text.split(/[,.|;/]/)[0]?.trim() || ''
    if (first && first.length <= 40) return first
  }
  return ''
}

export type ProductTitleContext = {
  categoryName?: string | null
  parentCategoryName?: string | null
  shortDescription?: string | null
}

export function polishStorefrontProductTitle(
  raw: string | null | undefined,
  extra?: ProductTitleContext,
): string {
  let value = stripSkuResidueFromTitle(stripQualityShelfSuffix(raw))
  if (!value) value = String(raw || '').trim()
  if (isBrandOnlyTitle(value)) {
    value = expandBrandOnlyTitle(value)
    const hint = pickTitleTypeHint(
      extra?.categoryName,
      extra?.parentCategoryName,
      extra?.shortDescription,
    )
    if (hint && !value.toLowerCase().includes(hint.toLowerCase())) {
      value = `${value} ${hint}`
    }
  }
  return value.replace(/\s+/g, ' ').trim()
}

function asCleanLatinTitle(raw: string | null | undefined): string {
  const text = collapseRepeatedTitleWords(String(raw || '').trim())
  if (!text || containsChinese(text)) return ''
  return text
}

function healLatinTitle(raw: string, code: 'en' | 'es'): string {
  const fixed = fixStorefrontLabelTypos(raw)
  const direct = asCleanLatinTitle(fixed)
  if (direct) return direct
  if (!fixed) return ''
  const healed = collapseRepeatedTitleWords(translateTitleKeywords(fixed, code) || '')
  const clean = asCleanLatinTitle(healed) || asCleanLatinTitle(stripChineseFromTitle(healed))
  return clean
}

function pickEnglishTitle(translationsJson: unknown, fallback: string): string {
  const enExact = pickExactProductTranslation(translationsJson, 'en')
  const fromEn = healLatinTitle(String(enExact?.name || '').trim(), 'en')
  if (fromEn) return stripQualityShelfSuffix(fromEn) || fromEn

  if (translationsJson && typeof translationsJson === 'object') {
    const root = translationsJson as Record<string, unknown>
    const sideEn = String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
    const cleanSide = healLatinTitle(sideEn, 'en')
    if (cleanSide) return stripQualityShelfSuffix(cleanSide) || cleanSide
  }

  if (fallback && !containsChinese(fallback)) {
    return stripQualityShelfSuffix(collapseRepeatedTitleWords(fallback)) || collapseRepeatedTitleWords(fallback)
  }
  return stripQualityShelfSuffix(healLatinTitle(fallback, 'en')) || healLatinTitle(fallback, 'en')
}

/**
 * Storefront product title by locale (en/es only):
 * clean Latin title — never returns Chinese / mixed CJK titles.
 */
export function resolveProductDisplayName(
  name: string,
  translationsJson: unknown,
  lang?: string | null,
  extra?: ProductTitleContext,
): string {
  const fallback = String(name || '').trim()
  const code = normalizeProductLang(lang)
  const finish = (title: string) => polishStorefrontProductTitle(title, extra) || 'Product'

  const exact = pickExactProductTranslation(translationsJson, code)
  const fromLang = String(exact?.name || '').trim()
  const fromExact = healLatinTitle(fromLang, code)
  if (fromExact) return finish(fromExact)

  if (translationsJson && typeof translationsJson === 'object') {
    const root = translationsJson as Record<string, unknown>
    if (code === 'es') {
      const sideEs = String(root.title_es ?? root.titleEs ?? root.nameEs ?? '').trim()
      const cleanEs = healLatinTitle(sideEs, 'es')
      if (cleanEs) return finish(cleanEs)
    }
    const sideEn = String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
    const cleanEn = healLatinTitle(sideEn, 'en')
    if (cleanEn) return finish(cleanEn)
  }

  const fromFallback = healLatinTitle(fallback, code)
  if (fromFallback) return finish(fromFallback)

  if (code === 'es') {
    const en = pickEnglishTitle(translationsJson, fallback)
    if (en) return finish(en)
  }

  const stripped = stripChineseFromTitle(fromLang || fallback)
  const cleanStripped = asCleanLatinTitle(stripped)
  const finalized = stripQualityShelfSuffix(cleanStripped) || cleanStripped
  return finish(finalized || 'Product')
}

function pickCategoryLocaleName(block: unknown): string {
  if (typeof block === 'string') return block.trim()
  if (!block || typeof block !== 'object') return ''
  const obj = block as Record<string, unknown>
  return String(obj.name ?? obj.title ?? '').trim()
}

function pickCategorySideField(
  root: Record<string, unknown>,
  code: 'en' | 'es',
): string {
  if (code === 'es') {
    return String(root.title_es ?? root.titleEs ?? root.nameEs ?? '').trim()
  }
  return String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
}

/**
 * Category display name for storefront: locale → en side fields → keyword-heal DB name.
 * Never falls back to Chinese translations for en/es.
 */
export function resolveCategoryDisplayName(
  translationsJson: unknown,
  fallbackName: string,
  lang?: string | null,
): string {
  const fallback = String(fallbackName || '').trim()
  const code = normalizeProductLang(lang)
  const root =
    translationsJson && typeof translationsJson === 'object'
      ? (translationsJson as Record<string, unknown>)
      : null

  // Admin `name` is source of truth for English. translationsJson.en often lags
  // behind renames (slug-derived "Beloe 3 usd" after name became "Below 3 usd").
  const healedFallback = healLatinTitle(fallback, code)
  if (code === 'en' && healedFallback && !containsChinese(fallback)) {
    return healedFallback
  }

  if (root) {
    const fromLang = pickCategoryLocaleName(root[code]) || pickCategorySideField(root, code)
    const cleanLang = healLatinTitle(fromLang, code)
    if (cleanLang) return cleanLang

    if (code === 'es') {
      const fromEn =
        pickCategoryLocaleName(root.en) || pickCategorySideField(root, 'en')
      const cleanEn = healLatinTitle(fromEn, 'en')
      if (cleanEn) return cleanEn
    }
  }

  if (healedFallback) return healedFallback

  const stripped = asCleanLatinTitle(stripChineseFromTitle(fallback))
  return stripped || 'Category'
}
