require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient, Prisma } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()

function extractAlbumTitlePrice(...texts) {
  const YEAR_LIKE = /^(?:19|20)\d{2}$/
  const LEADING_JUNK = /[\uFFFC\uFEFF\u200B-\u200D\uFE0E\uFE0F]/g
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
  function stripDecor(text) {
    return String(text || '')
      .replace(LEADING_JUNK, ' ')
      .replace(/^[^0-9A-Za-z\u4e00-\u9fff]+/, '')
      .trim()
  }
  for (const raw of texts) {
    const full = String(raw || '').trim()
    if (!full) continue
    const labeled =
      full.match(/(?:P|¥|￥|价格|拿货价|成本|特价|批发价|特批)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)/i) ||
      full.match(/\b([0-9]+(?:\.[0-9]+)?)\s*元/) ||
      full.match(/💰\s*([0-9]+(?:\.[0-9]+)?)/)
    const labeledPrice = takePrice(labeled && labeled[1])
    if (labeledPrice != null) return labeledPrice
    const text = stripDecor(full)
    const hashed = text.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:💰|#|＃|号)/)
    const hashedPrice = takePrice(hashed && hashed[1])
    if (hashedPrice != null) return hashedPrice
    const pCode = text.match(/^P\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\b/i)
    const pPrice = takePrice(pCode && pCode[1])
    if (pPrice != null) return pPrice
    const leading = text.match(/^([0-9]+(?:\.[0-9]+)?)\s+(?=[\u4e00-\u9fffA-Za-z💰])/)
    const leadingPrice = takePrice(leading && leading[1])
    if (leadingPrice != null && !/^\d+\s*[-~～到至]\d+\s*(?:cm|mm|m|码)/i.test(text)) {
      return leadingPrice
    }
  }
  return null
}

function toNum(v) {
  if (v == null) return null
  const n = typeof v.toNumber === 'function' ? v.toNumber() : Number(v)
  return Number.isFinite(n) ? n : null
}

function roundMoney(n) {
  return Math.round(n * 100) / 100
}

function patchSkuRows(rows, cost, sell) {
  if (!Array.isArray(rows)) return rows
  return rows.map((row) => {
    const current = toNum(row.costPrice ?? row.cost_price)
    if (current != null && current > 0.021) return row
    return { ...row, costPrice: cost, cost_price: cost, price: sell }
  })
}

;(async () => {
  const usd = await p.currencysetting.findFirst({
    where: { isActive: true, currencyCode: 'USD' },
    select: { exchangeRate: true },
  })
  let rate = toNum(usd && usd.exchangeRate) || 6.5
  if (rate > 0 && rate < 1) rate = 1 / rate
  if (rate >= 1 && rate < 3) rate = 6.5

  const rows = await p.importtaskitem.findMany({
    where: {
      isPublished: false,
      OR: [{ costPrice: null }, { costPrice: { lte: 0 } }],
    },
    select: {
      id: true,
      parsedName: true,
      productDetail: true,
      costPrice: true,
      coefficient: true,
      previewDataJson: true,
      operatorSkuJson: true,
    },
  })

  let filled = 0
  let skipped = 0
  const samples = []
  for (const row of rows) {
    const preview = row.previewDataJson && typeof row.previewDataJson === 'object' ? row.previewDataJson : {}
    const inferred = extractAlbumTitlePrice(row.parsedName, preview.name, row.productDetail, preview.shortDescription)
    if (inferred == null) {
      skipped += 1
      if (samples.length < 8) samples.push({ id: row.id, inferred: null, name: String(row.parsedName || '').slice(0, 80) })
      continue
    }
    const coeff = toNum(row.coefficient) || 1
    const sell = roundMoney(inferred * (coeff > 0 ? coeff : 1))
    const usdPrice = roundMoney(sell / rate)
    const nextPreview = {
      ...preview,
      price: sell,
      skuTable: patchSkuRows(preview.skuTable, inferred, sell),
    }
    const data = {
      costPrice: inferred,
      parsedPriceMin: inferred,
      parsedPriceMax: inferred,
      cnyPriceMin: sell,
      cnyPriceMax: sell,
      usdPriceMin: usdPrice,
      usdPriceMax: usdPrice,
      previewDataJson: nextPreview,
    }
    if (row.operatorSkuJson) {
      try {
        const parsed = JSON.parse(row.operatorSkuJson)
        const patched = patchSkuRows(parsed, inferred, sell)
        data.operatorSkuJson = JSON.stringify(patched)
      } catch {
        /* keep */
      }
    }
    await p.importtaskitem.update({ where: { id: row.id }, data })
    filled += 1
    if (samples.length < 8) {
      samples.push({ id: row.id, inferred, coeff, sell, name: String(row.parsedName || '').slice(0, 60) })
    }
  }

  const remain = await p.importtaskitem.count({
    where: { isPublished: false, OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
  })
  console.log(JSON.stringify({ total: rows.length, filled, skipped, remain, rate, samples }, null, 2))
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
