/**
 * Resolve EN / ES product titles for import / publish / backfill.
 * Prefer existing cache → API translate → dictionary keyword partial translate.
 */
import { translateTextTo } from '@/backend/lib/translateText'
import {
  collapseRepeatedTitleWords,
  containsChinese,
  translateTitleKeywords,
} from '@/shared/productKeywordDictionary'

/** Read cached Spanish title from side fields or translationsJson.es / title_es */
export function getCachedSpanishTitle(
  existingEs?: string | null,
  translationsJson?: unknown,
): string {
  const direct = collapseRepeatedTitleWords(existingEs)
  if (direct && !containsChinese(direct)) return direct.slice(0, 200)

  if (translationsJson && typeof translationsJson === 'object') {
    const root = translationsJson as Record<string, any>
    const fromBlock = String(
      root?.es?.name || root?.title_es || root?.titleEs || root?.nameEs || '',
    ).trim()
    const cleaned = collapseRepeatedTitleWords(fromBlock)
    if (cleaned && !containsChinese(cleaned)) return cleaned.slice(0, 200)
  }
  return ''
}

export function getCachedEnglishTitle(
  existingEn?: string | null,
  translationsJson?: unknown,
): string {
  const direct = collapseRepeatedTitleWords(existingEn)
  if (direct && !containsChinese(direct)) return direct.slice(0, 200)

  if (translationsJson && typeof translationsJson === 'object') {
    const root = translationsJson as Record<string, any>
    const fromBlock = String(
      root?.en?.name || root?.title_en || root?.titleEn || root?.nameEn || '',
    ).trim()
    const cleaned = collapseRepeatedTitleWords(fromBlock)
    if (cleaned && !containsChinese(cleaned)) return cleaned.slice(0, 200)
  }
  return ''
}

export async function resolveEnglishProductTitle(
  chineseName: string | null | undefined,
  existingEn?: string | null,
): Promise<string> {
  const existing = collapseRepeatedTitleWords(existingEn)
  if (existing && !containsChinese(existing)) return existing.slice(0, 200)

  const zh = String(chineseName || '').trim()
  if (!zh) return existing.slice(0, 200)

  if (!containsChinese(zh)) return collapseRepeatedTitleWords(zh).slice(0, 200)

  const fromApi = await translateTextTo(zh, 'en', 'zh')
  if (fromApi && fromApi.trim()) {
    let en = collapseRepeatedTitleWords(fromApi)
    // API sometimes leaves CN tokens — fill those once, never re-loop on Latin.
    if (containsChinese(en)) {
      en = collapseRepeatedTitleWords(translateTitleKeywords(en, 'en') || en)
    }
    return en.slice(0, 200)
  }

  const fromDict = translateTitleKeywords(zh, 'en')
  return collapseRepeatedTitleWords(fromDict || zh).slice(0, 200)
}

/**
 * Resolve Spanish title.
 * Cache hit (title_es / translationsJson.es) skips API.
 */
export async function resolveSpanishProductTitle(
  chineseName: string | null | undefined,
  existingEs?: string | null,
  englishFallback?: string | null,
  translationsJson?: unknown,
): Promise<string> {
  const cached = getCachedSpanishTitle(existingEs, translationsJson)
  if (cached) return cached

  const zh = String(chineseName || '').trim()
  const en = getCachedEnglishTitle(englishFallback, translationsJson)

  if (zh && containsChinese(zh)) {
    const fromZh = await translateTextTo(zh, 'es', 'zh')
    if (fromZh && fromZh.trim()) {
      let es = collapseRepeatedTitleWords(fromZh)
      if (containsChinese(es)) {
        es = collapseRepeatedTitleWords(translateTitleKeywords(es, 'es') || es)
      }
      if (es && !containsChinese(es)) return es.slice(0, 200)
    }
  }

  if (en) {
    const fromEn = await translateTextTo(en, 'es', 'en')
    if (fromEn && fromEn.trim()) {
      return collapseRepeatedTitleWords(fromEn).slice(0, 200)
    }
  }

  if (zh && containsChinese(zh)) {
    const fromDict = translateTitleKeywords(zh, 'es')
    if (fromDict) return collapseRepeatedTitleWords(fromDict).slice(0, 200)
  }

  // Last resort: keep English so ES locale is not Chinese
  if (en) return en.slice(0, 200)
  return collapseRepeatedTitleWords(zh).slice(0, 200)
}

export function buildProductTranslationsJson(params: {
  nameZh: string
  nameEn?: string | null
  nameEs?: string | null
  shortDescriptionZh?: string | null
}) {
  const nameZh = String(params.nameZh || '').trim()
  const nameEn = String(params.nameEn || '').trim()
  const nameEs = String(params.nameEs || '').trim()
  const shortZh = String(params.shortDescriptionZh || '').trim()

  return {
    zh: {
      name: nameZh,
      ...(shortZh ? { shortDescription: shortZh } : {}),
    },
    ...(nameEn
      ? {
          en: { name: nameEn },
          title_en: nameEn,
          nameEn,
        }
      : {}),
    ...(nameEs
      ? {
          es: { name: nameEs },
          title_es: nameEs,
          nameEs,
        }
      : {}),
  }
}

/** Merge Spanish (and optional English) into an existing translationsJson object */
export function mergeProductTitleTranslations(
  existing: unknown,
  patch: { nameZh?: string; nameEn?: string | null; nameEs?: string | null },
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' ? { ...(existing as Record<string, any>) } : {}
  const nameZh = String(patch.nameZh || base?.zh?.name || '').trim()
  const nameEn = String(patch.nameEn || getCachedEnglishTitle(null, base) || '').trim()
  const nameEs = String(patch.nameEs || getCachedSpanishTitle(null, base) || '').trim()
  return buildProductTranslationsJson({
    nameZh,
    nameEn: nameEn || null,
    nameEs: nameEs || null,
    shortDescriptionZh: base?.zh?.shortDescription || null,
  })
}
