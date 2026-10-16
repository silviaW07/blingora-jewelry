import { translateTextTo } from '@/backend/lib/translateText'
import { containsChinese, translateTitleKeywords } from '@/shared/productKeywordDictionary'

const CONCURRENCY = 6

export async function translateChineseStorefrontValues(
  values: string[],
  lang: 'en' | 'es',
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(
      values
        .map((value) => String(value || '').trim())
        .filter((value) => value && containsChinese(value)),
    ),
  ]
  const out = new Map<string, string>()
  if (unique.length === 0) return out

  const target = lang === 'es' ? 'ES' : 'EN'
  const locale = lang === 'es' ? 'es' : 'en'
  let cursor = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, unique.length) }, async () => {
    while (cursor < unique.length) {
      const value = unique[cursor]
      cursor += 1
      const fromDictionary = translateTitleKeywords(value, locale).trim()
      if (fromDictionary && !containsChinese(fromDictionary)) {
        out.set(value, fromDictionary)
        continue
      }
      const translated = await translateTextTo(value, target, 'zh')
      const next = String(translated || '').trim()
      out.set(value, next || fromDictionary || value)
    }
  })
  await Promise.all(workers)
  return out
}

export function applyTranslatedValue(map: Map<string, string>, value: string | null | undefined): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return map.get(raw) || raw
}
