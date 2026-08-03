/** 商品/分类 translationsJson 的语言解析（服务端与客户端可共用） */

import {
  collapseRepeatedTitleWords,
  containsChinese,
  stripChineseFromTitle,
  translateTitleKeywords,
} from '@/shared/productKeywordDictionary'

export function normalizeProductLang(raw?: string | null): 'en' | 'zh' | 'es' {
  const value = String(raw || '').trim().toLowerCase()
  if (value.startsWith('zh')) return 'zh'
  if (value.startsWith('es')) return 'es'
  if (value.startsWith('en')) return 'en'
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
  // Keep soft fallback for shortDescription / detail consumers;
  // product titles should use resolveProductDisplayName instead.
  return map[code] || map[lang || ''] || map.en || map.zh || null
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
 * Storefront product title by locale:
 * - zh → Chinese `name` (DB)
 * - en/es → clean Latin title only (never 中英 / 中西 mixed)
 *
 * Prefer exact locale → keyword heal → (ES) English → strip leftover CJK.
 */
export function resolveProductDisplayName(
  name: string,
  translationsJson: unknown,
  lang?: string | null,
): string {
  const fallback = String(name || '').trim()
  const code = normalizeProductLang(lang)
  if (code === 'zh') return fallback

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
    if (code === 'en') {
      const sideEn = String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
      const cleanEn = healLatinTitle(sideEn, 'en')
      if (cleanEn) return cleanEn
    }
  }

  const fromFallback = healLatinTitle(fallback, code)
  if (fromFallback) return fromFallback

  // ES without a clean Spanish title → show English rather than Chinese mix
  if (code === 'es') {
    const en = pickEnglishTitle(translationsJson, fallback)
    if (en) return en
  }

  const stripped = stripChineseFromTitle(fromLang || fallback)
  return stripped || 'Product'
}

function pickCategoryLocaleName(block: unknown): string {
  if (typeof block === 'string') return block.trim()
  if (!block || typeof block !== 'object') return ''
  const obj = block as Record<string, unknown>
  return String(obj.name ?? obj.title ?? '').trim()
}

function pickCategorySideField(
  root: Record<string, unknown>,
  code: 'en' | 'zh' | 'es',
): string {
  if (code === 'zh') {
    return String(root.title_zh ?? root.titleZh ?? root.nameZh ?? '').trim()
  }
  if (code === 'es') {
    return String(root.title_es ?? root.titleEs ?? root.nameEs ?? '').trim()
  }
  return String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
}

/**
 * 分类展示名：优先当前语言 translationsJson.name/title → title_en 等旁路字段 → 中文 → 数据库 name。
 * 避免缺译时空白。
 */
export function resolveCategoryDisplayName(
  translationsJson: unknown,
  fallbackName: string,
  lang?: string | null,
): string {
  const fallback = String(fallbackName || '').trim()
  if (!translationsJson || typeof translationsJson !== 'object') {
    return fallback
  }

  const root = translationsJson as Record<string, unknown>
  const code = normalizeProductLang(lang)
  const fromLang = pickCategoryLocaleName(root[code]) || pickCategorySideField(root, code)
  if (fromLang) return fromLang

  if (code !== 'zh') {
    const fromZh = pickCategoryLocaleName(root.zh) || pickCategorySideField(root, 'zh')
    if (fromZh) return fromZh
  }

  return fallback
}
