/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')
const repoRoot = path.resolve(__dirname, '..')
process.chdir(repoRoot)
try {
  require('dotenv').config({ path: path.join(repoRoot, '.env') })
} catch {}

function summarize(value, depth = 0) {
  if (value == null) return value
  if (typeof value === 'string') return value.slice(0, 120)
  if (typeof value !== 'object') return value
  if (depth > 3) return Array.isArray(value) ? `array(${value.length})` : `object(${Object.keys(value).length})`
  if (Array.isArray(value)) {
    return value.slice(0, 6).map((item) => summarize(item, depth + 1))
  }
  const out = {}
  for (const [key, item] of Object.entries(value).slice(0, 12)) {
    out[key] = summarize(item, depth + 1)
  }
  return out
}

async function main() {
  const key = process.env.ONEBOUND_1688_KEY || process.env.ONEBOUND_KEY
  const secret = process.env.ONEBOUND_1688_SECRET || process.env.ONEBOUND_SECRET
  const report = []
  for (const offerId of ['1053930216406', '1046933781059']) {
    const url = new URL('https://api-gw.onebound.cn/1688/item_get/')
    url.searchParams.set('key', key)
    url.searchParams.set('secret', secret)
    url.searchParams.set('num_iid', offerId)
    url.searchParams.set('lang', 'zh-CN')
    const payload = await (await fetch(url, { headers: { Accept: 'application/json' } })).json()
    const item = payload.item || {}
    report.push({
      offerId,
      props_img: summarize(item.props_img),
      prop_imgs: summarize(item.prop_imgs),
      props_list: summarize(item.props_list),
    })
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
