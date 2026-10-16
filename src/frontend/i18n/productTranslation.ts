/** 商品/分类 translationsJson 的语言解析（服务端与客户端可共用） */

import {
  collapseRepeatedTitleWords,
  containsChinese,
  fixStorefrontLabelTypos,
  isIncompleteTranslatedTitle,
  stripChineseFromTitle,
  translateTitleKeywords,
} from '@/shared/productKeywordDictionary'
import { leftoverIsVolumeOnly } from '@/shared/storefrontLabel'

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
  let value = stripQualityShelfSuffix(raw)
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
  const clean = asCleanLatinTitle(healed)
  if (clean && !leftoverIsVolumeOnly(clean)) return clean
  // 有中文时不要剥成 100ml / 空标题；留给详情接口做整句翻译。
  if (containsChinese(fixed)) return ''
  const stripped = asCleanLatinTitle(stripChineseFromTitle(healed))
  return stripped && !leftoverIsVolumeOnly(stripped) ? stripped : ''
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

function preferCompleteTitle(
  cached: string,
  source: string,
  fromSource: string,
  code: 'en' | 'es',
): string {
  if (cached && !isIncompleteTranslatedTitle(cached, source, code, fromSource)) return cached
  return fromSource || cached
}

/**
 * Storefront product title by locale (en/es only):
 * translate the admin/backend name — never strip 货号, never return Chinese leftovers.
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
  const fromSource = healLatinTitle(stripQualityShelfSuffix(fallback), code)

  const exact = pickExactProductTranslation(translationsJson, code)
  const fromLang = String(exact?.name || '').trim()
  const fromExact = healLatinTitle(fromLang, code)
  const chosenExact = preferCompleteTitle(fromExact, fallback, fromSource, code)
  if (chosenExact) return finish(chosenExact)

  if (translationsJson && typeof translationsJson === 'object') {
    const root = translationsJson as Record<string, unknown>
    if (code === 'es') {
      const sideEs = String(root.title_es ?? root.titleEs ?? root.nameEs ?? '').trim()
      const cleanEs = healLatinTitle(sideEs, 'es')
      const chosenEs = preferCompleteTitle(cleanEs, fallback, fromSource, 'es')
      if (chosenEs) return finish(chosenEs)
    }
    const sideEn = String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
    const cleanEn = healLatinTitle(sideEn, 'en')
    const chosenEn = preferCompleteTitle(cleanEn, fallback, fromSource, 'en')
    if (chosenEn) return finish(chosenEn)
  }

  if (fromSource) return finish(fromSource)

  if (code === 'es') {
    const en = pickEnglishTitle(translationsJson, fallback)
    if (en) return finish(preferCompleteTitle(en, fallback, fromSource, 'en') || en)
  }

  const stripped = stripChineseFromTitle(fromLang || fallback)
  const cleanStripped = asCleanLatinTitle(stripped)
  if (cleanStripped && !leftoverIsVolumeOnly(cleanStripped)) {
    const finalized = stripQualityShelfSuffix(cleanStripped) || cleanStripped
    return finish(preferCompleteTitle(finalized, fallback, fromSource, code) || finalized)
  }
  return finish(fromSource || 'Product')
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
  if (stripped && !leftoverIsVolumeOnly(stripped)) return stripped
  return healedFallback || fallback || 'Category'
}
