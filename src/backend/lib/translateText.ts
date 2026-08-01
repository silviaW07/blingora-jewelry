/**
 * Server-side text translation for product titles.
 *
 * Env keys (first match wins):
 * - DEEPL_API_KEY          DeepL Free/Pro
 * - DEEPL_API_URL           optional override (default free endpoint if key ends with :fx)
 * - GOOGLE_TRANSLATE_API_KEY  Google Cloud Translation v2
 *
 * Fallback when no key: MyMemory public endpoint (rate-limited), then caller
 * should fall back to dictionary keyword translation.
 */

export type TranslateTargetLang = 'EN' | 'ES' | 'ZH'
export type TranslateSourceLang = 'ZH' | 'EN' | 'AUTO'

function normalizeTarget(lang: string): TranslateTargetLang {
  const value = String(lang || '').trim().toLowerCase()
  if (value.startsWith('es')) return 'ES'
  if (value.startsWith('zh')) return 'ZH'
  return 'EN'
}

function normalizeSource(lang?: string | null): TranslateSourceLang {
  const value = String(lang || '').trim().toLowerCase()
  if (value.startsWith('en')) return 'EN'
  if (value.startsWith('zh')) return 'ZH'
  return 'AUTO'
}

function deeplEndpoint(apiKey: string): string {
  const override = String(process.env.DEEPL_API_URL || '').trim()
  if (override) return override
  // DeepL free keys end with :fx
  if (apiKey.endsWith(':fx')) {
    return 'https://api-free.deepl.com/v2/translate'
  }
  return 'https://api.deepl.com/v2/translate'
}

async function translateWithDeepL(
  text: string,
  target: TranslateTargetLang,
  apiKey: string,
  source: TranslateSourceLang,
): Promise<string | null> {
  try {
    const body = new URLSearchParams()
    body.set('auth_key', apiKey)
    body.set('text', text)
    body.set('target_lang', target === 'ZH' ? 'ZH' : target)
    if (source === 'ZH') body.set('source_lang', 'ZH')
    if (source === 'EN') body.set('source_lang', 'EN')

    const res = await fetch(deeplEndpoint(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      translations?: Array<{ text?: string }>
    }
    const out = String(data.translations?.[0]?.text || '').trim()
    return out || null
  } catch {
    return null
  }
}

async function translateWithGoogle(
  text: string,
  target: TranslateTargetLang,
  apiKey: string,
  source: TranslateSourceLang,
): Promise<string | null> {
  try {
    const targetLang =
      target === 'EN' ? 'en' : target === 'ES' ? 'es' : 'zh-CN'
    const url = new URL('https://translation.googleapis.com/language/translate/v2')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('q', text)
    if (source === 'ZH') url.searchParams.set('source', 'zh-CN')
    if (source === 'EN') url.searchParams.set('source', 'en')
    url.searchParams.set('target', targetLang)
    url.searchParams.set('format', 'text')

    const res = await fetch(url.toString(), { method: 'POST' })
    if (!res.ok) return null
    const data = (await res.json()) as {
      data?: { translations?: Array<{ translatedText?: string }> }
    }
    const out = String(data.data?.translations?.[0]?.translatedText || '').trim()
    return out || null
  } catch {
    return null
  }
}

/** Free-ish public endpoint; may throttle — treat failures as null. */
async function translateWithMyMemory(
  text: string,
  target: TranslateTargetLang,
  source: TranslateSourceLang,
): Promise<string | null> {
  try {
    const src = source === 'EN' ? 'en' : 'zh'
    const tgt = target === 'EN' ? 'en' : target === 'ES' ? 'es' : 'zh'
    if (src === tgt) return text
    const url = new URL('https://api.mymemory.translated.net/get')
    url.searchParams.set('q', text.slice(0, 480))
    url.searchParams.set('langpair', `${src}|${tgt}`)

    const res = await fetch(url.toString())
    if (!res.ok) return null
    const data = (await res.json()) as {
      responseData?: { translatedText?: string }
      responseStatus?: number
    }
    if (Number(data.responseStatus) !== 200) return null
    const out = String(data.responseData?.translatedText || '').trim()
    // MyMemory sometimes echoes the query or returns INVALID_*
    if (!out || out.toUpperCase().includes('INVALID') || out === text) return null
    return out
  } catch {
    return null
  }
}

/**
 * Translate text to target language via configured API.
 * Returns null when no usable translation is produced.
 */
export async function translateTextTo(
  text: string,
  targetLang: string = 'en',
  sourceLang?: string | null,
): Promise<string | null> {
  const raw = String(text || '').trim()
  if (!raw) return null

  const target = normalizeTarget(targetLang)
  if (target === 'ZH') return raw

  let source = normalizeSource(sourceLang)
  if (source === 'AUTO') {
    source = /[\u4e00-\u9fff]/.test(raw) ? 'ZH' : 'EN'
  }

  // Same-script Latin already matching target (rough): skip only when target EN and Latin source
  if (target === 'EN' && source === 'EN' && !/[\u4e00-\u9fff]/.test(raw)) {
    return raw
  }

  const deeplKey = String(process.env.DEEPL_API_KEY || '').trim()
  if (deeplKey) {
    const out = await translateWithDeepL(raw, target, deeplKey, source)
    if (out) return out
  }

  const googleKey = String(process.env.GOOGLE_TRANSLATE_API_KEY || '').trim()
  if (googleKey) {
    const out = await translateWithGoogle(raw, target, googleKey, source)
    if (out) return out
  }

  const free = await translateWithMyMemory(raw, target, source)
  if (free) return free

  return null
}

/** @deprecated Prefer translateTextTo — kept for existing EN import callers */
export async function translateTextZhTo(
  text: string,
  targetLang: string = 'en',
): Promise<string | null> {
  return translateTextTo(text, targetLang, 'zh')
}
