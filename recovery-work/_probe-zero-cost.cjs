require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()

function extractAlbumTitlePrice(...texts) {
  const YEAR_LIKE = /^(?:19|20)\d{2}$/
  const LEADING_DECOR = /^[^0-9A-Za-z\u4e00-\u9fff]+/
  function isPlausible(value) {
    if (!Number.isFinite(value) || value < 5 || value > 800) return false
    const whole = Math.round(value)
    if (Math.abs(value - whole) < 0.001 && YEAR_LIKE.test(String(whole))) return false
    return true
  }
  function takePrice(raw) {
    const n = Number(raw)
    return isPlausible(n) ? Math.round(n * 100) / 100 : null
  }
  for (const raw of texts) {
    const full = String(raw || '').trim()
    if (!full) continue
    const labeled =
      full.match(/(?:P|¥|￥|价格|拿货价|成本|特价|批发价)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)/i) ||
      full.match(/\b([0-9]+(?:\.[0-9]+)?)\s*元/)
    const labeledPrice = takePrice(labeled && labeled[1])
    if (labeledPrice != null) return labeledPrice
    const text = full.replace(LEADING_DECOR, '').trim()
    const hashed = text.match(/^([0-9]+(?:\.[0-9]+)?)\s*[#＃号]/)
    const hashedPrice = takePrice(hashed && hashed[1])
    if (hashedPrice != null) return hashedPrice
    const pCode = text.match(/^P\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\b/i)
    const pPrice = takePrice(pCode && pCode[1])
    if (pPrice != null) return pPrice
    const leading = text.match(/^([0-9]+(?:\.[0-9]+)?)\s+(?=[\u4e00-\u9fffA-Za-z])/)
    const leadingPrice = takePrice(leading && leading[1])
    if (leadingPrice != null && !/^\d+\s*[-~～到至]\d+\s*(?:cm|mm|m|码)/i.test(text)) {
      return leadingPrice
    }
  }
  return null
}

;(async () => {
  const zero = await p.importtaskitem.count({
    where: { isPublished: false, OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
  })
  const done = await p.importtaskitem.count({
    where: { isPublished: false, fetchStatus: 'COMPLETED' },
  })
  const rows = await p.importtaskitem.findMany({
    where: { isPublished: false, OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
    select: {
      id: true,
      parsedName: true,
      fetchStatus: true,
      costPrice: true,
      sourceUrl: true,
      productDetail: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 12,
  })
  const sample = rows.map((r) => {
    const name = r.parsedName || ''
    return {
      st: r.fetchStatus,
      cost: String(r.costPrice),
      inferred: extractAlbumTitlePrice(r.parsedName, r.productDetail),
      name: name.slice(0, 90),
    }
  })
  console.log(JSON.stringify({ zero, done, sample }, null, 2))
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
