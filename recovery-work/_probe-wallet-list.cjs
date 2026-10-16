const https = require('https')
const http = require('http')
const { spawnSync } = require('child_process')

const PROJECT = 'PROJ_fcb9e6ee_snap_20260726_092922_893'
const WALLET = 'a27293fa-68c5-4557-a5d2-8a5da86747be'

function post(body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3100,
        path: `/rpc/${PROJECT}/`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
          } catch (e) {
            reject(e)
          }
        })
      },
    )
    req.on('error', reject)
    req.write(JSON.stringify(body))
    req.end()
  })
}

function getHtml() {
  return new Promise((resolve, reject) => {
    https
      .get('https://sourcingjewelry.com/category/wallet/', (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      })
      .on('error', reject)
  })
}

;(async () => {
  const raw = await post({
    actionName: 'src.frontend.actions.ProductCategory.getProductList',
    args: [
      {
        category_id: WALLET,
        page: 1,
        page_size: 20,
        sort_by: 'NEWEST',
        lang: 'en',
      },
    ],
  })
  const data = raw.json || raw
  const list = data.list || []
  const html = await getHtml()
  const needles = ['Diane', 'Swinger', 'Ball Grain', 'Double Box Packaging', 'Hot Seller', 'Louis Vuitton Diane']
  console.log(
    JSON.stringify(
      {
        rpcTotal: data.total,
        rpcNames: list.map((p) => String(p.product_name || '').slice(0, 70)),
        htmlLen: html.length,
        htmlHits: Object.fromEntries(needles.map((n) => [n, html.includes(n)])),
      },
      null,
      2,
    ),
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
