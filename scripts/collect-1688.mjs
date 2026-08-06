#!/usr/bin/env node
/**
 * 1688 商品页采集器（本机运行，不要放服务器上跑）
 *
 * 为什么要这么绕：1688 会校验 TLS 指纹和浏览器行为，Node 侧无论怎么伪造请求头都会
 * 落到验证码页；机房 IP 更是直接拉黑。所以这里用本机真实 Chrome + 住宅 IP 打开商品页，
 * 把渲染后的 HTML POST 给服务器的 /ingest/1688-html，服务器那边照常用已有的解析逻辑。
 *
 * 用法：
 *   node scripts/collect-1688.mjs                     # 自动拉取后台待解析的链接
 *   node scripts/collect-1688.mjs <url> [<url> ...]   # 只抓指定链接
 *
 * 首次运行会弹出 Chrome，请在里面手动登录 1688；登录状态保存在 secrets/chrome-profile，
 * 之后不用重复登录。
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Minimal .env reader: the collector runs standalone, no dotenv dependency. */
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (!match) continue
    const value = match[2].replace(/^['"]|['"]$/g, '')
    if (!process.env[match[1]]) process.env[match[1]] = value
  }
}

loadEnvFile(path.join(ROOT, '.env'))
loadEnvFile(path.join(ROOT, 'secrets', 'collector.env'))

const SERVER_BASE = (process.env.COLLECTOR_SERVER || 'https://sourcingjewelry.com').replace(/\/+$/, '')
const INGEST_TOKEN = (process.env.INGEST_TOKEN || '').trim()
const PROFILE_DIR = path.join(ROOT, 'secrets', 'chrome-profile')

const MIN_HTML_BYTES = 20_000
const PAGE_TIMEOUT_MS = 60_000
/** 1688 throttles bursts of detail views; keep the pace human-ish. */
const DELAY_RANGE_MS = [6_000, 14_000]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const randomDelay = () =>
  DELAY_RANGE_MS[0] + Math.floor(Math.random() * (DELAY_RANGE_MS[1] - DELAY_RANGE_MS[0]))

const log = (...args) => console.log(`[${new Date().toLocaleTimeString()}]`, ...args)

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close()
    resolve(answer)
  }))
}

function isCaptchaPage(url, html) {
  return (
    /sec\.1688\.com|login\.1688\.com|_____tmd_____|x5secdata/.test(url) ||
    /_____tmd_____|x5secdata|<title>[^<]*(验证|滑块|安全)/.test(html.slice(0, 4000))
  )
}

async function fetchPendingOffers() {
  const response = await fetch(`${SERVER_BASE}/ingest/pending`, {
    headers: { 'X-Ingest-Token': INGEST_TOKEN },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.ok) {
    throw new Error(`拉取待解析列表失败 (${response.status}): ${body.error || '未知错误'}`)
  }
  return body.offers || []
}

async function submitHtml(sourceUrl, html) {
  const response = await fetch(`${SERVER_BASE}/ingest/1688-html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Ingest-Token': INGEST_TOKEN },
    body: JSON.stringify({ sourceUrl, html }),
  })
  const raw = await response.text()
  let body = {}
  try {
    body = JSON.parse(raw)
  } catch {
    body = { error: raw.slice(0, 200) }
  }
  if (!response.ok || !body.ok) {
    throw new Error(
      `提交失败 (${response.status}, ${(html.length / 1024).toFixed(0)}KB HTML): ${body.error || '未知错误'}`,
    )
  }
  return body
}

/**
 * Returns the rendered HTML, pausing for manual captcha solving when 1688 gates
 * the page. Retrying without a human never clears the gate, so we ask instead.
 */
async function capture(page, sourceUrl) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS })
    // Detail data is injected after first paint; the offer id in the DOM is the signal.
    await page.waitForTimeout(3_000)
    await page.evaluate(() => window.scrollBy(0, 1200)).catch(() => {})
    await page.waitForTimeout(1_500)

    const html = await page.content()
    const currentUrl = page.url()

    if (isCaptchaPage(currentUrl, html)) {
      log(`  命中风控页（第 ${attempt} 次）`)
      await ask('  请在 Chrome 窗口里手动通过验证/登录，完成后按回车继续...')
      continue
    }
    if (html.length < MIN_HTML_BYTES) {
      log(`  页面过小（${html.length} 字节），重试...`)
      await sleep(3_000)
      continue
    }
    return html
  }
  return null
}

async function main() {
  if (!INGEST_TOKEN) {
    console.error('缺少 INGEST_TOKEN。请在 secrets/collector.env 里写 INGEST_TOKEN=<和服务器 .env 相同的值>')
    process.exit(1)
  }

  let chromium
  try {
    ({ chromium } = await import('playwright'))
  } catch {
    console.error('未安装 Playwright。请先执行：pnpm add -D playwright')
    process.exit(1)
  }

  const cliUrls = process.argv.slice(2).filter((arg) => /^https?:\/\//.test(arg))
  const targets = cliUrls.length
    ? cliUrls.map((sourceUrl) => ({ sourceUrl }))
    : await fetchPendingOffers()

  if (!targets.length) {
    log('没有待采集的链接。请先在后台创建 1688 导入任务，再运行本脚本。')
    return
  }

  log(`服务器: ${SERVER_BASE}`)
  log(`待采集: ${targets.length} 个商品`)

  fs.mkdirSync(PROFILE_DIR, { recursive: true })
  // channel:'chrome' uses the real installed Chrome — its TLS/JS fingerprint is what
  // gets past 1688, a bundled Chromium build is noticeably more likely to be gated.
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    args: ['--disable-blink-features=AutomationControlled'],
  })

  const page = context.pages()[0] || (await context.newPage())

  await page.goto('https://www.1688.com', { waitUntil: 'domcontentloaded' }).catch(() => {})
  await ask('请确认 Chrome 里已登录 1688（首次需手动登录），然后按回车开始采集...')

  let okCount = 0
  const failures = []

  for (let index = 0; index < targets.length; index += 1) {
    const { sourceUrl } = targets[index]
    log(`(${index + 1}/${targets.length}) ${sourceUrl}`)

    try {
      const html = await capture(page, sourceUrl)
      if (!html) {
        failures.push({ sourceUrl, reason: '多次尝试仍被风控拦截' })
        log('  跳过：反复命中风控')
      } else {
        const result = await submitHtml(sourceUrl, html)
        okCount += 1
        log(`  已提交 offer=${result.offerId} ${(result.bytes / 1024).toFixed(0)}KB`)
      }
    } catch (error) {
      failures.push({ sourceUrl, reason: error.message })
      log(`  失败: ${error.message}`)
    }

    if (index < targets.length - 1) {
      const delay = randomDelay()
      log(`  等待 ${(delay / 1000).toFixed(0)}s...`)
      await sleep(delay)
    }
  }

  console.log('')
  log(`采集完成：成功 ${okCount} / ${targets.length}`)
  if (failures.length) {
    console.log('失败明细：')
    for (const item of failures) console.log(`  - ${item.sourceUrl}\n    ${item.reason}`)
  }
  console.log('')
  log('现在回到后台点击「开始解析」，服务器会直接使用刚上传的页面，不再访问 1688。')

  await ask('按回车关闭浏览器...')
  await context.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
