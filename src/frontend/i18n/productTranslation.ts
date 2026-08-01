/** 商品/分类 translationsJson 的语言解析（服务端与客户端可共用） */

import {
  collapseRepeatedTitleWords,
  containsChinese,
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

/**
 * Storefront product title by locale:
 * - zh → Chinese `name` (DB)
 * - en/es → translationsJson[lang].name → keyword-map partial translate of CN name
 *
 * Always collapse repeated tokens so stored bad titles like
 * "… Flat Flat Flat …" render as a single "Flat" without re-scrape.
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
  if (fromLang) {
    // Heal already-persisted Flat Flat Flat… titles; if still Chinese, dict once.
    if (code !== 'zh' && containsChinese(fromLang)) {
      return collapseRepeatedTitleWords(translateTitleKeywords(fromLang, code) || fromLang)
    }
    return collapseRepeatedTitleWords(fromLang)
  }

  if (code === 'zh') return fallback

  // Also accept preview-style side fields
  if (translationsJson && typeof translationsJson === 'object') {
    const root = translationsJson as Record<string, unknown>
    if (code === 'es') {
      const sideEs = String(root.title_es ?? root.titleEs ?? root.nameEs ?? '').trim()
      if (sideEs && !containsChinese(sideEs)) return collapseRepeatedTitleWords(sideEs)
    }
    if (code === 'en') {
      const sideEn = String(root.title_en ?? root.titleEn ?? root.nameEn ?? '').trim()
      if (sideEn && !containsChinese(sideEn)) return collapseRepeatedTitleWords(sideEn)
    }
  }

  if (fallback && containsChinese(fallback)) {
    return collapseRepeatedTitleWords(translateTitleKeywords(fallback, code) || fallback)
  }
  return collapseRepeatedTitleWords(fallback)
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
