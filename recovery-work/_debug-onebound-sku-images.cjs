/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')
const repoRoot = path.resolve(__dirname, '..')
process.chdir(repoRoot)
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
require('tsconfig-paths/register')
try {
  require('dotenv').config({ path: path.join(repoRoot, '.env') })
} catch {}

async function fetchRaw(offerId) {
  const key = process.env.ONEBOUND_1688_KEY || process.env.ONEBOUND_KEY
  const secret = process.env.ONEBOUND_1688_SECRET || process.env.ONEBOUND_SECRET
  const url = new URL('https://api-gw.onebound.cn/1688/item_get/')
  url.searchParams.set('key', key)
  url.searchParams.set('secret', secret)
  url.searchParams.set('num_iid', offerId)
  url.searchParams.set('lang', 'zh-CN')
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const payload = await response.json()
  const item = payload.item || {}
  const skus = ((((item.skus || {}).sku) || [])).slice(0, 6).map((sku) => ({
    properties: sku.properties,
    properties_name: sku.properties_name,
    hasImage: Boolean(sku.image || sku.imageUrl || sku.pic_url || sku.sku_image),
    imageKeys: Object.keys(sku).filter((key) => /img|image|pic/i.test(key)),
  }))
  const propsImg = item.props_img || item.prop_imgs || item.prop_img || null
  return {
    offerId,
    title: item.title,
    hasPropsImg: Boolean(propsImg && Object.keys(propsImg).length),
    propsImgKeys: propsImg && typeof propsImg === 'object' ? Object.keys(propsImg).slice(0, 8) : [],
    propsImgSample: propsImg && typeof propsImg === 'object'
      ? Object.fromEntries(
          Object.entries(propsImg).slice(0, 4).map(([key, value]) => [
            key,
            String(value || '').slice(0, 80),
          ]),
        )
      : null,
    skuCount: Array.isArray(((item.skus || {}).sku)) ? item.skus.sku.length : 0,
    skus,
    itemImageKeys: Object.keys(item).filter((key) => /img|image|pic|prop/i.test(key)),
  }
}

async function main() {
  const report = []
  for (const offerId of ['1053930216406', '1046933781059']) {
    report.push(await fetchRaw(offerId))
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
