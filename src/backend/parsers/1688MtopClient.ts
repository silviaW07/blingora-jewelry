/**
 * 1688 H5 MTop client — signed JSON fallback when HTML pages hit anti-bot punish.
 * Sign: md5(token + "&" + t + "&" + appKey + "&" + data) where token is from `_m_h5_tk`.
 */
import { createHash } from 'crypto'

const MTOP_APP_KEY = '12574478'

export type MtopOfferFetchResult =
  | { ok: true; data: unknown; api: string }
  | { ok: false; reason: string; detail?: string }

/** Strip Cookie: prefix / quotes / newlines so pasted DevTools values work. */
export function normalize1688Cookie(raw: string): string {
  let text = String(raw || '').trim()
  if (!text) return ''
  text = text.replace(/^Cookie:\s*/i, '')
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim()
  }
  text = text
    .replace(/\r?\n+/g, '; ')
    .replace(/;\s*;+/g, '; ')
    .replace(/^;\s*|\s*;$/g, '')
    .trim()
  return text
}

export function parseCookieMap(cookieHeader: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const part of normalize1688Cookie(cookieHeader).split(';')) {
    const idx = part.indexOf('=')
    if (idx <= 0) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) map[key] = value
  }
  return map
}

export function cookieMapToHeader(map: Record<string, string>): string {
  return Object.entries(map)
    .filter(([key, value]) => Boolean(key && value))
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')
}

/** `_m_h5_tk` value is `{token}_{expireMs}` — token is everything before the last `_`. */
export function extractMtopToken(cookieHeader: string): string | null {
  const raw = parseCookieMap(cookieHeader)['_m_h5_tk'] || ''
  if (!raw) return null
  const last = raw.lastIndexOf('_')
  if (last <= 0) return raw
  return raw.slice(0, last)
}

const md5Hex = (value: string) => createHash('md5').update(value, 'utf8').digest('hex')

export function signMtopRequest(token: string, timestamp: string, dataJson: string): string {
  return md5Hex(`${token}&${timestamp}&${MTOP_APP_KEY}&${dataJson}`)
}

const mergeSetCookieHeaders = (cookieHeader: string, setCookies: string[]): string => {
  const map = parseCookieMap(cookieHeader)
  for (const line of setCookies) {
    const pair = String(line || '').split(';')[0] || ''
    const idx = pair.indexOf('=')
    if (idx <= 0) continue
    map[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
  }
  return cookieMapToHeader(map)
}

const readSetCookies = (response: Response): string[] => {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof headers.getSetCookie === 'function') {
    try {
      return headers.getSetCookie() || []
    } catch {
      // fall through
    }
  }
  const single = response.headers.get('set-cookie')
  return single ? [single] : []
}

const mtopBrowserHeaders = (cookieHeader: string): Record<string, string> => ({
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7',
  Referer: 'https://detail.1688.com/',
  Origin: 'https://detail.1688.com',
  ...(cookieHeader ? { Cookie: cookieHeader } : {}),
})

/**
 * Bootstrap `_m_h5_tk` / `_m_h5_tk_enc` via a cheap mtop call (body may be FAIL_SYS_TOKEN_EMPTY).
 */
export async function bootstrap1688MtopCookies(existingCookie: string): Promise<string> {
  const base = normalize1688Cookie(existingCookie)
  const t = String(Date.now())
  const url =
    `https://h5api.m.1688.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/` +
    `?jsv=2.5.1&appKey=${MTOP_APP_KEY}&t=${t}&sign=x` +
    `&api=mtop.relationrecommend.WirelessRecommend.recommend&v=2.0&type=json&dataType=json&data=%7B%7D`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: mtopBrowserHeaders(base),
    })
    return mergeSetCookieHeaders(base, readSetCookies(response))
  } catch {
    return base
  } finally {
    clearTimeout(timer)
  }
}

type MtopApiCandidate = {
  api: string
  version: string
  data: Record<string, unknown>
}

/**
 * Only `mtop.alibaba.detail.subpage.getdetail` is still served by the gateway — as of
 * 2026-08 the `mtop.1688.wireless.widget.offer.detail.get`, `mtop.china.detail.data.get`
 * and `mtop.1688.trade.service.offerDetailService` names all answer
 * FAIL_SYS_API_NOT_FOUNDED, and calling them only spends risk-control budget.
 */
const buildOfferDetailCandidates = (offerId: string): MtopApiCandidate[] => [
  {
    api: 'mtop.alibaba.detail.subpage.getdetail',
    version: '2.0',
    data: { offerId, detail_v: '3.3.5' },
  },
]

/** RGV587_ERROR is Alibaba throttling, not a hard reject — spaced retries sometimes land. */
const RGV587_BACKOFF_MS = [4_000, 12_000, 30_000]

const isMtopSuccess = (payload: unknown): boolean => {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
  if (!record) return false
  const ret = record.ret
  if (Array.isArray(ret)) {
    return ret.some((item) => typeof item === 'string' && /^SUCCESS/i.test(item))
  }
  if (typeof ret === 'string') return /^SUCCESS/i.test(ret)
  return Boolean(record.data)
}

const mtopHasOfferSignal = (payload: unknown): boolean => {
  const text = JSON.stringify(payload || {})
  if (text.length < 80) return false
  return /"subject"|"offerTitle"|"skuProps"|"skuMap"|"imageList"|"offerId"|"mainImage"/i.test(text)
}

async function callSignedMtop(
  cookieHeader: string,
  candidate: MtopApiCandidate,
): Promise<{ payload: unknown; cookieHeader: string } | null> {
  let cookie = cookieHeader
  let token = extractMtopToken(cookie)
  if (!token) {
    cookie = await bootstrap1688MtopCookies(cookie)
    token = extractMtopToken(cookie)
  }
  if (!token) return null

  const dataJson = JSON.stringify(candidate.data)
  const t = String(Date.now())
  const sign = signMtopRequest(token, t, dataJson)
  const apiPath = candidate.api.toLowerCase()
  const url =
    `https://h5api.m.1688.com/h5/${apiPath}/${candidate.version}/` +
    `?jsv=2.5.1&appKey=${MTOP_APP_KEY}&t=${t}&sign=${sign}` +
    `&api=${encodeURIComponent(candidate.api)}&v=${encodeURIComponent(candidate.version)}` +
    `&type=json&dataType=json&data=${encodeURIComponent(dataJson)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: mtopBrowserHeaders(cookie),
    })
    cookie = mergeSetCookieHeaders(cookie, readSetCookies(response))
    const text = await response.text()
    if (!text || text.length < 20) return null
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      // Some mtop endpoints wrap as `mtopjsonpN(...)`
      const matched = text.match(/^[^(]+\((\{[\s\S]*\})\);?\s*$/)
      if (!matched?.[1]) return null
      payload = JSON.parse(matched[1])
    }
    return { payload, cookieHeader: cookie }
  } catch (error) {
    console.warn('[1688-mtop] call failed', candidate.api, error)
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch offer detail JSON via signed mtop. Requires usable Cookie (login + preferably `_m_h5_tk`).
 */
export async function fetch1688OfferViaMtop(
  offerId: string,
  cookieRaw: string,
): Promise<MtopOfferFetchResult> {
  const offer = String(offerId || '').trim()
  if (!/^\d{6,}$/.test(offer)) {
    return { ok: false, reason: 'invalid_offer_id' }
  }

  let cookie = normalize1688Cookie(cookieRaw)
  if (!cookie) {
    return { ok: false, reason: 'no_cookie' }
  }

  // Ensure we have a signing token even if operator only pasted login cookies.
  if (!extractMtopToken(cookie)) {
    cookie = await bootstrap1688MtopCookies(cookie)
  }
  if (!extractMtopToken(cookie)) {
    return {
      ok: false,
      reason: 'no_mtop_token',
      detail: 'Cookie 中缺少 _m_h5_tk，且自动签发失败',
    }
  }

  let lastDetail = ''
  for (const candidate of buildOfferDetailCandidates(offer)) {
    const result = await callSignedMtop(cookie, candidate)
    if (!result) {
      lastDetail = `${candidate.api}: network/parse error`
      continue
    }
    cookie = result.cookieHeader
    const payload = result.payload
    const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
    const retText = Array.isArray(record?.ret) ? record!.ret.join(',') : String(record?.ret || '')

    // Gateway rejects unknown names before signing, so a NOT_FOUNDED here means the
    // API is retired — no point burning a token refresh on it.
    if (/API_NOT_FOUNDED|API_LOCKED|FAIL_SYS_ILLEGAL_ACCESS/i.test(retText)) {
      console.warn(`[1688-mtop] ${candidate.api} -> ${retText}`)
      lastDetail = `${candidate.api}: ${retText}`
      continue
    }

    if (/TOKEN_EMPTY|TOKEN_EXOIRED|TOKEN_EXPIRED|ILLEGAL_ACCESS|SESSION_EXPIRED/i.test(retText)) {
      cookie = await bootstrap1688MtopCookies(cookie)
      const retry = await callSignedMtop(cookie, candidate)
      if (retry && isMtopSuccess(retry.payload) && mtopHasOfferSignal(retry.payload)) {
        return { ok: true, data: retry.payload, api: candidate.api }
      }
      lastDetail = `${candidate.api}: ${retText || 'token error'}`
      continue
    }

    if (/RGV587_ERROR|SM::/i.test(retText)) {
      let throttled = retText
      for (const waitMs of RGV587_BACKOFF_MS) {
        console.warn(
          `[1688-mtop] ${candidate.api} throttled (${throttled}) — retrying in ${waitMs}ms`,
        )
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        cookie = await bootstrap1688MtopCookies(cookie)
        const retry = await callSignedMtop(cookie, candidate)
        if (!retry) {
          throttled = 'network/parse error'
          continue
        }
        cookie = retry.cookieHeader
        if (mtopHasOfferSignal(retry.payload)) {
          return { ok: true, data: retry.payload, api: candidate.api }
        }
        const retryRecord =
          retry.payload && typeof retry.payload === 'object'
            ? (retry.payload as Record<string, unknown>)
            : null
        throttled = Array.isArray(retryRecord?.ret)
          ? retryRecord!.ret.join(',')
          : String(retryRecord?.ret || 'empty')
        if (!/RGV587_ERROR|SM::/i.test(throttled)) break
      }
      lastDetail = `${candidate.api}: ${throttled}`
      continue
    }

    if (isMtopSuccess(payload) && mtopHasOfferSignal(payload)) {
      return { ok: true, data: payload, api: candidate.api }
    }
    if (mtopHasOfferSignal(payload)) {
      return { ok: true, data: payload, api: candidate.api }
    }
    console.warn(`[1688-mtop] ${candidate.api} -> ret=${retText || 'empty'}`)
    lastDetail = `${candidate.api}: ${retText || 'empty'}`
  }

  return { ok: false, reason: 'mtop_failed', detail: lastDetail }
}
