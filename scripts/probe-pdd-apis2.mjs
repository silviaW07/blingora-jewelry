const goodsId = process.argv[2] || '608827925342'
const headers = {
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  accept: 'application/json,text/plain,*/*',
  'accept-language': 'zh-CN,zh;q=0.9',
  referer: `https://mobile.yangkeduo.com/goods.html?goods_id=${goodsId}`,
  'content-type': 'application/json;charset=UTF-8',
}
if (process.env.COOKIE_PDD) headers.cookie = process.env.COOKIE_PDD

const urls = [
  `https://mobile.yangkeduo.com/proxy/api/api/aristotle/share_goods_info?goods_id=${goodsId}&pdduid=0`,
  `https://mobile.yangkeduo.com/proxy/api/api/turing/mall/query_mall_info?mall_id=1`,
  `https://mobile.yangkeduo.com/proxy/api/api/carmen/goods/detail?goods_id=${goodsId}`,
  `https://mobile.yangkeduo.com/proxy/api/api/oak/v1/goods/detail?goods_id=${goodsId}`,
]

for (const url of urls) {
  try {
    const resp = await fetch(url, { headers, redirect: 'follow' })
    const text = await resp.text()
    console.log('====', resp.status, url)
    console.log(text.slice(0, 300).replace(/\s+/g, ' '))
  } catch (e) {
    console.log('FAIL', url, e.message)
  }
}
