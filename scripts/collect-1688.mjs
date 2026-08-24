#!/usr/bin/env node
/**
 * 1688 采集器（本机运行）
 *
 * - 详情页：抓 HTML → POST /ingest/1688-html
 * - 店铺分类页（offerlist）：翻页抽 offer → POST /ingest/1688-expand-category → 再采详情
 *
 *   node scripts/collect-1688.mjs
 *   node scripts/collect-1688.mjs <url> ...
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (!m) continue
    const v = m[2].replace(/^['"]|['"]$/g, '')
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}
loadEnv(path.join(ROOT, '.env'))
loadEnv(path.join(ROOT, 'secrets', 'collector.env'))

const SERVER = (process.env.COLLECTOR_SERVER || 'https://sourcingjewelry.com').replace(/\/+$/, '')
const TOKEN = (process.env.INGEST_TOKEN || '').trim()
const PROFILE = path.join(ROOT, 'secrets', 'chrome-profile')
const MIN_HTML = 20000
const TIMEOUT = 60000
const DELAY = [6000, 14000]
const MAX_CAT_PAGES = 80

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const delay = () => DELAY[0] + Math.floor(Math.random() * (DELAY[1] - DELAY[0]))
const log = (...a) => console.log(`[${new Date().toLocaleTimeString()}]`, ...a)

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) =>
    rl.question(q, (a) => {
      rl.close()
      resolve(a)
    }),
  )
}

function isCategoryUrl(url) {
  const u = String(url || '')
  if (!/1688\.com/i.test(u) || /\/offer\/\d+/i.test(u)) return false
  return /\/page\/offerlist|offerlist_[\d_]+/i.test(u)
}

function extractOfferIds(html) {
  const ids = new Set()
  for (const re of [
    /\/offer\/(\d{8,})(?:\.html)?/gi,
    /["']offerId["']\s*[:=]\s*["']?(\d{8,})/gi,
    /offerId(?:=|%3D)(\d{8,})/gi,
  ]) {
    for (const m of String(html || '').matchAll(re)) ids.add(m[1])
  }
  return [...ids]
}

function toDetailUrls(ids) {
  const out = []
  const seen = new Set()
  for (const id of ids) {
    const n = String(id || '').replace(/\D/g, '')
    if (!n || seen.has(n)) continue
    seen.add(n)
    out.push(`https://detail.1688.com/offer/${n}.html`)
  }
  return out
}

function isCaptcha(url, html) {
  const h = String(html || '').slice(0, 4000)
  return (
    /sec\.1688\.com|login\.1688\.com|_____tmd_____|x5secdata/.test(url) ||
    /_____tmd_____|x5secdata|<title>[^<]*(验证|滑块|安全)/.test(h)
  )
}

async function apiGetPending() {
  const res = await fetch(`${SERVER}/ingest/pending`, {
    headers: { 'X-Ingest-Token': TOKEN },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.ok) throw new Error(`pending 失败 ${res.status}: ${body.error || ''}`)
  return body.offers || []
}

async function apiPostHtml(sourceUrl, html) {
  const res = await fetch(`${SERVER}/ingest/1688-html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Ingest-Token': TOKEN },
    body: JSON.stringify({ sourceUrl, html }),
  })
  const raw = await res.text()
  let body = {}
  try {
    body = JSON.parse(raw)
  } catch {
    body = { error: raw.slice(0, 200) }
  }
  if (!res.ok || !body.ok) throw new Error(`html 提交失败 ${res.status}: ${body.error || ''}`)
  return body
}

async function apiExpandCategory(itemId, offerUrls) {
  const res = await fetch(`${SERVER}/ingest/1688-expand-category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Ingest-Token': TOKEN },
    body: JSON.stringify({ itemId, offerUrls }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.ok) throw new Error(`expand 失败 ${res.status}: ${body.error || ''}`)
  return body
}

async function capture(page, sourceUrl) {
  for (let i = 1; i <= 3; i += 1) {
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await page.waitForTimeout(3000)
    await page.evaluate(() => window.scrollBy(0, 1200)).catch(() => {})
    await page.waitForTimeout(1500)
    const html = await page.content()
    const cur = page.url()
    if (isCaptcha(cur, html)) {
      log(`  风控（${i}/3）`)
      await ask('  浏览器过验证后按回车...')
      continue
    }
    if (html.length < MIN_HTML && !isCategoryUrl(sourceUrl)) {
      log(`  页太小 ${html.length}，重试`)
      await sleep(3000)
      continue
    }
    return html
  }
  return null
}

async function expandCategoryPages(page, categoryUrl) {
  const all = new Set()
  let n = 0
  let url = categoryUrl
  while (n < MAX_CAT_PAGES && url) {
    n += 1
    log(`  分类页 ${n}`)
    const html = await capture(page, url)
    if (!html) break
    const ids = extractOfferIds(html)
    const before = all.size
    ids.forEach((id) => all.add(id))
    log(`  本页 ${ids.length}，累计 ${all.size}`)

    const next = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('a,button,[role="button"],.pagination a,.next')]
      const el = nodes.find((node) => {
        const t = (node.textContent || '').replace(/\s+/g, '')
        const c = String(node.className || '')
        return /下一页|下页|›|»|Next/i.test(t) && !/disabled|禁止/i.test(c)
      })
      if (!el) return null
      if (el.tagName === 'A' && el.getAttribute('href')) return el.href
      el.click()
      return '__click__'
    })
    if (!next) break
    if (next === '__click__') {
      await page.waitForTimeout(2500)
      url = page.url()
      if (all.size === before) break
      continue
    }
    if (next === url) break
    url = next
    await sleep(1500 + Math.floor(Math.random() * 1500))
  }
  return toDetailUrls([...all])
}

async function collectDetail(page, sourceUrl) {
  const html = await capture(page, sourceUrl)
  if (!html) return { ok: false, reason: '风控拦截' }
  const r = await apiPostHtml(sourceUrl, html)
  return { ok: true, offerId: r.offerId, bytes: r.bytes }
}

async function main() {
  if (!TOKEN) {
    console.error('缺少 INGEST_TOKEN')
    process.exit(1)
  }
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('请先 pnpm add -D playwright')
    process.exit(1)
  }

  const cli = process.argv.slice(2).filter((a) => /^https?:\/\//.test(a))
  let targets = cli.length ? cli.map((sourceUrl) => ({ sourceUrl })) : await apiGetPending()
  if (!targets.length) {
    log('没有待采集链接')
    return
  }

  log(`服务器 ${SERVER}，待处理 ${targets.length}`)
  fs.mkdirSync(PROFILE, { recursive: true })
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    args: ['--disable-blink-features=AutomationControlled'],
  })
  const page = ctx.pages()[0] || (await ctx.newPage())
  await page.goto('https://www.1688.com', { waitUntil: 'domcontentloaded' }).catch(() => {})
  await ask('确认已登录 1688 后按回车...')

  let ok = 0
  const fails = []
  const queue = []

  for (let i = 0; i < targets.length; i += 1) {
    const { sourceUrl, itemId } = targets[i]
    log(`(${i + 1}/${targets.length}) ${sourceUrl}`)
    try {
      if (isCategoryUrl(sourceUrl)) {
        const offers = await expandCategoryPages(page, sourceUrl)
        if (!offers.length) {
          fails.push({ sourceUrl, reason: '分类无商品' })
        } else if (itemId) {
          const exp = await apiExpandCategory(itemId, offers)
          log(`  展开 ${offers.length}，新建 ${exp.createdCount}`)
          for (const u of exp.offerUrls || offers) queue.push(u)
          ok += 1
        } else {
          log(`  CLI 展开 ${offers.length}`)
          queue.push(...offers)
          ok += 1
        }
      } else {
        const r = await collectDetail(page, sourceUrl)
        if (!r.ok) fails.push({ sourceUrl, reason: r.reason })
        else {
          ok += 1
          log(`  offer=${r.offerId}`)
        }
      }
    } catch (e) {
      fails.push({ sourceUrl, reason: e.message })
      log(`  失败 ${e.message}`)
    }
    if (i < targets.length - 1 || queue.length) {
      const d = delay()
      log(`  等 ${(d / 1000).toFixed(0)}s`)
      await sleep(d)
    }
  }

  for (let i = 0; i < queue.length; i += 1) {
    const sourceUrl = queue[i]
    log(`(详情 ${i + 1}/${queue.length}) ${sourceUrl}`)
    try {
      const r = await collectDetail(page, sourceUrl)
      if (!r.ok) fails.push({ sourceUrl, reason: r.reason })
      else {
        ok += 1
        log(`  offer=${r.offerId}`)
      }
    } catch (e) {
      fails.push({ sourceUrl, reason: e.message })
    }
    if (i < queue.length - 1) {
      const d = delay()
      log(`  等 ${(d / 1000).toFixed(0)}s`)
      await sleep(d)
    }
  }

  log(`完成：成功 ${ok}，失败 ${fails.length}`)
  for (const f of fails) console.log(`  - ${f.sourceUrl}: ${f.reason}`)
  log('请回后台点「开始解析」')
  await ask('按回车关闭浏览器...')
  await ctx.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
