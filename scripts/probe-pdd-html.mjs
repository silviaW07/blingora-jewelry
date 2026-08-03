import fs from 'fs'
import path from 'path'

const goodsId = process.argv[2] || '608827925342'
const url = `https://mobile.yangkeduo.com/goods.html?goods_id=${goodsId}`
const headers = {
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'accept-language': 'zh-CN,zh;q=0.9',
  referer: 'https://mobile.yangkeduo.com/',
}
if (process.env.COOKIE_PDD) headers.cookie = process.env.COOKIE_PDD

const resp = await fetch(url, { redirect: 'follow', headers })
const html = await resp.text()
const out = path.join('scripts', 'fixtures', `pdd-sample-${goodsId}.html`)
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, html, 'utf8')

console.log(
  JSON.stringify(
    {
      status: resp.status,
      finalUrl: resp.url,
      length: html.length,
      title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '',
      hasRawData: /rawData/i.test(html),
      hasSkuProps: /skuProps|sku_props/i.test(html),
      hasGoodsName: /goods_name|goodsName/i.test(html),
      hasPddpic: /pddpic\.com/i.test(html),
      risk: /验证|captcha|安全校验|login/i.test(html),
      snippet: html.slice(0, 800).replace(/\s+/g, ' '),
    },
    null,
    2,
  ),
)
console.log('saved', out)
