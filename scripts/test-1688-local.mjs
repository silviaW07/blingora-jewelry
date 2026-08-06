/**
 * Answers one question: does 1688 serve real data to a residential IP with our cookie?
 *
 * The production RPC runs on a US datacenter host that 1688 risk-controls, so we
 * cannot tell a bad IP apart from a bad cookie by looking at server logs alone.
 * Run this from a home connection to separate the two.
 *
 *   node scripts/test-1688-local.mjs [offerId]
 *
 * Expects the same cookie the server uses, at secrets/1688-cookie.txt (gitignored).
 */
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COOKIE_PATH = resolve(ROOT, 'secrets/1688-cookie.txt')
const OFFER_ID = process.argv[2] || '1035271782015'
const APP_KEY = '12574478'
// Captured from a logged-in browser on detail.1688.com. The older
// mtop.alibaba.detail.* / mtop.1688.wireless.* names are no longer wired up.
const API = 'mtop.1688.mmga.offerdetail.service'
const API_VERSION = '1.0'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const RISK_MARKERS = ['_______tmd_______', 'baxia', 'punish', '滑块', 'X5Sec', 'captcha']
const OFFER_MARKERS = ['offerTitle', 'skuProps', 'skuMap', 'subject', 'imageList', 'mainImage']

function log(label, value) {
  console.log(`${label.padEnd(16)} ${value}`)
}

function normalizeCookie(raw) {
  return String(raw || '')
    .trim()
    .replace(/^Cookie:\s*/i, '')
    .replace(/\r?\n+/g, '; ')
    .replace(/;\s*;+/g, '; ')
    .replace(/^;\s*|\s*;$/g, '')
    .trim()
}

function cookieMap(header) {
  const map = {}
  for (const part of normalizeCookie(header).split(';')) {
    const idx = part.indexOf('=')
    if (idx > 0) map[part.slice(0, idx).trim()] = part.slice(idx + 1).trim()
  }
  return map
}

function mergeSetCookies(header, response) {
  const map = cookieMap(header)
  const lines = response.headers.getSetCookie?.() || []
  for (const line of lines) {
    const pair = String(line).split(';')[0] || ''
    const idx = pair.indexOf('=')
    if (idx > 0) map[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
  }
  return Object.entries(map)
    .filter(([k, v]) => k && v)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

function mtopToken(header) {
  const raw = cookieMap(header)['_m_h5_tk'] || ''
  if (!raw) return null
  const last = raw.lastIndexOf('_')
  return last > 0 ? raw.slice(0, last) : raw
}

const headers = (cookie) => ({
  'User-Agent': UA,
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  Referer: 'https://detail.1688.com/',
  Origin: 'https://detail.1688.com',
  ...(cookie ? { Cookie: cookie } : {}),
})

function verdict(body) {
  const risk = RISK_MARKERS.filter((m) => body.includes(m))
  const offer = OFFER_MARKERS.filter((m) => body.includes(m))
  if (offer.length) return { ok: true, note: `真实数据 (命中 ${offer.join(', ')})` }
  if (risk.length) return { ok: false, note: `风控页 (命中 ${risk.join(', ')})` }
  return { ok: false, note: '无法判定，既没有商品字段也没有风控特征' }
}

async function bootstrapToken(cookie) {
  const url =
    'https://h5api.m.1688.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/' +
    `?jsv=2.5.1&appKey=${APP_KEY}&t=${Date.now()}&sign=x` +
    '&api=mtop.relationrecommend.WirelessRecommend.recommend&v=2.0&type=json&dataType=json&data=%7B%7D'
  const response = await fetch(url, { headers: headers(cookie) })
  return mergeSetCookies(cookie, response)
}

// The gateway names the offer `itemId`, not `offerId`, and rejects the request
// before returning data if it is missing. Shapes are tried in order.
// Every mmga call shares one envelope and only differs by serviceName; the two
// confirmed from the browser are offerDetailPCABService (A/B config) and
// offerSimilarSameService (related offers). The main detail service is one of these.
const REQUESTS = [
  // Captured verbatim from the browser; its response should name the modules
  // (and therefore the services) the detail page is told to load.
  { serviceName: 'offerDetailPCABService', abTestKey: 'Zeus_20260720162034_26202' },
  { serviceName: 'offerDetailPCService', offerId: Number(OFFER_ID), querySource: 'PC' },
  { serviceName: 'offerDetailService', offerId: Number(OFFER_ID), querySource: 'PC' },
]

async function callMtop(cookie, payload) {
  const data = JSON.stringify(payload)
  const t = String(Date.now())
  const token = mtopToken(cookie)
  const sign = createHash('md5').update(`${token}&${t}&${APP_KEY}&${data}`, 'utf8').digest('hex')
  // The browser posts `data` as a urlencoded form body; sending it as a query
  // string instead comes back as FAIL_SYS_SERVICE_FAULT.
  const url =
    `https://h5api.m.1688.com/h5/${API.toLowerCase()}/${API_VERSION}/` +
    `?jsv=2.7.4&appKey=${APP_KEY}&t=${t}&sign=${sign}&_bx-login=new` +
    `&api=${API}&v=${API_VERSION}&dataType=json&type=originaljson&timeout=20000`
  const started = Date.now()
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers(cookie),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ data }).toString(),
  })
  const body = await response.text()
  // A TOKEN_EXPIRED response carries a fresh _m_h5_tk, so hand the merged cookie
  // back for the caller to re-sign with.
  return {
    body,
    ms: Date.now() - started,
    status: response.status,
    cookie: mergeSetCookies(cookie, response),
  }
}

const isTokenError = (body) => /TOKEN_EXOIRED|TOKEN_EXPIRED|TOKEN_EMPTY/i.test(body)

async function fetchHtml(cookie) {
  const started = Date.now()
  // Alibaba's x5 gate scores header completeness, so mirror what Chrome sends on
  // a top-level navigation rather than the minimal set fetch() defaults to.
  const response = await fetch(`https://detail.1688.com/offer/${OFFER_ID}.html`, {
    headers: {
      'User-Agent': UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-site',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      Referer: 'https://s.1688.com/',
      Cookie: cookie,
    },
  })
  const body = await response.text()
  return { body, ms: Date.now() - started, status: response.status }
}

async function main() {
  console.log(`\n=== 1688 residential-IP check (offer ${OFFER_ID}) ===\n`)

  if (!existsSync(COOKIE_PATH)) {
    console.error(`找不到 Cookie 文件: ${COOKIE_PATH}`)
    console.error('在服务器上执行 cat secrets/1688-cookie.txt，把内容存到上面这个路径。')
    process.exitCode = 1
    return
  }

  let cookie = normalizeCookie(readFileSync(COOKIE_PATH, 'utf8'))
  log('cookie 长度', cookie.length)
  log('含 _m_h5_tk', mtopToken(cookie) ? 'yes' : 'no')

  const ipResponse = await fetch('https://myip.ipip.net/', { headers: { 'User-Agent': UA } })
  log('出口 IP', (await ipResponse.text()).trim())
  console.log('')

  if (!mtopToken(cookie)) {
    cookie = await bootstrapToken(cookie)
    log('token 签发', mtopToken(cookie) ? 'ok' : 'failed')
  }

  console.log('--- MTop 接口 ---')
  let mtopVerdict = { ok: false, note: '未执行' }

  for (const mmgaRequest of REQUESTS) {
    const payload = { mmgaRequest }
    let mtop = await callMtop(cookie, payload)
    for (let attempt = 1; attempt <= 3 && isTokenError(mtop.body); attempt += 1) {
      cookie = mtop.cookie
      mtop = await callMtop(cookie, payload)
    }
    cookie = mtop.cookie
    const result = verdict(mtop.body)
    console.log(`\n  ${mmgaRequest.serviceName} -> ${mtop.body.length} bytes`)
    console.log(`  ${mtop.body.slice(0, 900).replace(/\s+/g, ' ')}`)
    if (result.ok) {
      mtopVerdict = result
      log('命中', mmgaRequest.serviceName)
      break
    }
  }
  console.log('')

  const html = await fetchHtml(cookie)
  const htmlVerdict = verdict(html.body)
  console.log('--- HTML 页面 ---')
  log('HTTP', `${html.status} (${html.ms}ms, ${html.body.length} bytes)`)
  log('结论', htmlVerdict.note)
  log('响应片段', html.body.slice(0, 260).replace(/\s+/g, ' '))
  console.log('')

  console.log('=== 判定 ===')
  if (mtopVerdict.ok || htmlVerdict.ok) {
    console.log('住宅 IP 能拿到数据 —— 卡点确实是美国机房 IP，换出口就能解决。')
  } else {
    console.log('住宅 IP 同样被拒 —— 问题不在 IP，买代理没用，要查 Cookie 或请求指纹。')
  }
}

main().catch((error) => {
  console.error('\n脚本异常:', error)
  process.exitCode = 1
})
