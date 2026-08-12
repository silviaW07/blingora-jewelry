/** 商品/分类 translationsJson 的语言解析（服务端与客户端可共用） */

import {
  collapseRepeatedTitleWords,
  containsChinese,
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

function asCleanLatinTitle(raw: string | null | undefined): string {
  const text = collapseRepeatedTitleWords(String(raw || '').trim())
  if (!text || containsChinese(text)) return ''
  return text
}

function healLatinTitle(raw: string, code: 'en' | 'es'): string {
  const direct = asCleanLatinTitle(raw)
  if (direct) return direct
  if (!raw) return ''
  const healed = collapseRepeatedTitleWords(translateTitleKeywords(raw, code) || '')
  const clean = asCleanLatinTitle(healed) || asCleanLatinTitle(stripChineseFromTitle(healed))
  return clean
}

function pickEnglishTitle(translationsJson: unknown, fallback: string): string {
  const enExact = pickExactProductTranslation(translationsJson, 'en')
  const fromEn = healLatinTitle(String(enExact?.name || '').trim(), 'en')
  if (fromEn) return fromEn

  if (translationsJson && typeof translationsJson === 'object') {
    const root = translationsJson as Record<string, unknown>
    const sideEn = String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
    const cleanSide = healLatinTitle(sideEn, 'en')
    if (cleanSide) return cleanSide
  }

  if (fallback && !containsChinese(fallback)) {
    return collapseRepeatedTitleWords(fallback)
  }
  return healLatinTitle(fallback, 'en')
}

/**
 * Storefront product title by locale (en/es only):
 * clean Latin title — never returns Chinese / mixed CJK titles.
 */
export function resolveProductDisplayName(
  name: string,
  translationsJson: unknown,
  lang?: string | null,
): string {
  const fallback = String(name || '').trim()
  const code = normalizeProductLang(lang)

  const exact = pickExactProductTranslation(translationsJson, code)
  const fromLang = String(exact?.name || '').trim()
  const fromExact = healLatinTitle(fromLang, code)
  if (fromExact) return fromExact

  if (translationsJson && typeof translationsJson === 'object') {
    const root = translationsJson as Record<string, unknown>
    if (code === 'es') {
      const sideEs = String(root.title_es ?? root.titleEs ?? root.nameEs ?? '').trim()
      const cleanEs = healLatinTitle(sideEs, 'es')
      if (cleanEs) return cleanEs
    }
    const sideEn = String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
    const cleanEn = healLatinTitle(sideEn, 'en')
    if (cleanEn) return cleanEn
  }

  const fromFallback = healLatinTitle(fallback, code)
  if (fromFallback) return fromFallback

  if (code === 'es') {
    const en = pickEnglishTitle(translationsJson, fallback)
    if (en) return en
  }

  const stripped = stripChineseFromTitle(fromLang || fallback)
  const cleanStripped = asCleanLatinTitle(stripped)
  return cleanStripped || 'Product'
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
