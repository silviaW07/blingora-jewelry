const goodsId = process.argv[2] || '608827925342'
const headers = {
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  accept: 'application/json,text/plain,*/*',
  'accept-language': 'zh-CN,zh;q=0.9',
  referer: `https://mobile.yangkeduo.com/goods.html?goods_id=${goodsId}`,
  origin: 'https://mobile.yangkeduo.com',
}
if (process.env.COOKIE_PDD) headers.cookie = process.env.COOKIE_PDD

const urls = [
  `https://mobile.yangkeduo.com/proxy/api/api/oak/integration/render?pdduid=0&goods_id=${goodsId}`,
  `https://mobile.yangkeduo.com/proxy/api/api/oak/integration/render?goods_id=${goodsId}`,
  `https://api.pinduoduo.com/api/oak/integration/render?goods_id=${goodsId}`,
  `https://mobile.yangkeduo.com/goods.html?goods_id=${goodsId}&page_from=101&is_back=1`,
  `https://yangkeduo.com/goods.html?goods_id=${goodsId}`,
]

for (const url of urls) {
  try {
    const resp = await fetch(url, { headers, redirect: 'follow' })
    const text = await resp.text()
    console.log('====', resp.status, url.slice(0, 90))
    console.log({
      len: text.length,
      needLogin: /needLogin":true|"need_login":\s*true/i.test(text),
      hasGoodsName: /goods_name|goodsName/i.test(text),
      hasSku: /skuProps|sku_props|"skus"/i.test(text),
      hasPddpicGoods: /mms-material|goods-image|t00img/i.test(text),
      head: text.slice(0, 180).replace(/\s+/g, ' '),
    })
  } catch (e) {
    console.log('FAIL', url, e.message)
  }
}
