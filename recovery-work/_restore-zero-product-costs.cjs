require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()

function n(v) {
  if (v == null) return null
  const x = typeof v.toNumber === 'function' ? v.toNumber() : Number(v)
  return Number.isFinite(x) ? x : null
}

function roundMoney(x) {
  return Math.round(Number(x) * 100) / 100
}

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
    const x = Number(raw)
    return isPlausible(x) ? Math.round(x * 100) / 100 : null
  }
  function stripDecor(text) {
    return String(text || '')
      .replace(LEADING_JUNK, ' ')
      .replace(/^[^0-9A-Za-z\u4e00-\u9fff]+/, '')
      .trim()
  }
  function looksLikeDateOrSpuCode(code) {
    return /^20[2-3]\d(?:0[1-9]|1[0-2])/.test(code)
  }
  function twoDigitCostFromTitle(title) {
    const text = String(title || '').trim()
    const prefixed = text.match(/^(\d{2})(?:[\s\-_/．.]+(?=\d{5,}))?(\d{5,})/)
    if (prefixed) {
      const compact = `${prefixed[1]}${prefixed[2]}`
      if (!looksLikeDateOrSpuCode(compact)) {
        const price = takePrice(prefixed[1])
        if (price != null) return price
      }
    }
    const codes = text.match(/\d{5,}/g) || []
    for (const code of codes) {
      if (looksLikeDateOrSpuCode(code)) continue
      const price = takePrice(code.slice(0, 2))
      if (price != null) return price
    }
    return null
  }
  for (const raw of texts) {
    const full = String(raw || '').trim()
    if (!full) continue
    const labeled =
      full.match(/(?:¥|￥|价格|拿货价|成本|特价|批发价|特批)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)/i) ||
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
    const fromCode = twoDigitCostFromTitle(full) || twoDigitCostFromTitle(text)
    if (fromCode != null) return fromCode
    const leading = text.match(/^([0-9]+(?:\.[0-9]+)?)\s+(?=[\u4e00-\u9fffA-Za-z💰])/)
    const leadingPrice = takePrice(leading && leading[1])
    if (
      leadingPrice != null &&
      !/^\d+\s*[-~～到至*x×]\d+\s*(?:cm|mm|m|码)/i.test(text) &&
      !/^size\s*[:：]/i.test(text)
    ) {
      return leadingPrice
    }
  }
  return null
}

function previewName(json) {
  if (!json || typeof json !== 'object') return ''
  return String(json.name || json.nameZh || '')
}

function inferFromTexts(...texts) {
  return extractAlbumTitlePrice(...texts)
}

function coefOf(prod) {
  const own = n(prod.category && prod.category.priceCoefficient)
  const parent = n(prod.category && prod.category.parent && prod.category.parent.priceCoefficient)
  if (own > 0) return own
  if (parent > 0) return parent
  return 2
}

;(async () => {
  const summary = {
    pendingFilled: 0,
    pendingSkipped: 0,
    productsFilled: 0,
    skuOnlyFilled: 0,
    skipped: [],
    filled: [],
  }

  const pending = await p.importtaskitem.findMany({
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

  for (const row of pending) {
    const preview = row.previewDataJson && typeof row.previewDataJson === 'object' ? row.previewDataJson : {}
    const inferred = inferFromTexts(row.parsedName, previewName(preview), row.productDetail, preview.shortDescription)
    if (!(inferred > 0)) {
      summary.pendingSkipped += 1
      continue
    }
    const coeff = n(row.coefficient) || 2
    const sell = roundMoney(inferred * (coeff > 0 ? coeff : 2))
    const data = {
      costPrice: inferred,
      parsedPriceMin: inferred,
      parsedPriceMax: inferred,
      cnyPriceMin: sell,
      cnyPriceMax: sell,
    }
    await p.importtaskitem.update({ where: { id: row.id }, data })
    summary.pendingFilled += 1
  }

  const broken = await p.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { costPrice: null },
        { costPrice: { lte: 0 } },
        { skus: { every: { price: { lte: 0 } } } },
      ],
    },
    select: {
      id: true,
      productCode: true,
      name: true,
      costPrice: true,
      shortDescription: true,
      translationsJson: true,
      category: {
        select: { priceCoefficient: true, parent: { select: { priceCoefficient: true } } },
      },
      skus: { select: { id: true, price: true } },
      importTaskItems: {
        select: {
          parsedName: true,
          productDetail: true,
          costPrice: true,
          parsedPriceMin: true,
          previewDataJson: true,
        },
      },
    },
  })

  for (const prod of broken) {
    const cost = n(prod.costPrice) || 0
    const skuPrices = (prod.skus || []).map((s) => n(s.price) || 0)
    const allSkuZero = skuPrices.length === 0 || skuPrices.every((x) => x <= 0)
    const item = (prod.importTaskItems && prod.importTaskItems[0]) || null
    const zh =
      prod.translationsJson && prod.translationsJson.zh && prod.translationsJson.zh.name
        ? prod.translationsJson.zh.name
        : ''
    const inferred =
      (item && n(item.costPrice) > 0 ? n(item.costPrice) : null) ||
      (item && n(item.parsedPriceMin) > 0 ? n(item.parsedPriceMin) : null) ||
      inferFromTexts(
        item && item.parsedName,
        previewName(item && item.previewDataJson),
        item && item.productDetail,
        prod.name,
        zh,
        prod.shortDescription,
      )

    const coef = coefOf(prod)

    if (cost > 0 && allSkuZero && prod.skus.length) {
      const sell = roundMoney(cost * coef)
      await p.productsku.updateMany({ where: { productId: prod.id }, data: { price: sell } })
      summary.skuOnlyFilled += 1
      summary.filled.push({ code: prod.productCode, kind: 'sku-from-cost', cost, sell })
      continue
    }

    if (!(inferred > 0)) {
      if (summary.skipped.length < 40) {
        summary.skipped.push({
          code: prod.productCode,
          name: String(prod.name || '').slice(0, 50),
          cost,
        })
      }
      continue
    }

    const sell = roundMoney(inferred * coef)
    await p.product.update({ where: { id: prod.id }, data: { costPrice: inferred } })
    if (prod.skus.length) {
      await p.productsku.updateMany({ where: { productId: prod.id }, data: { price: sell } })
    }
    summary.productsFilled += 1
    summary.filled.push({
      code: prod.productCode,
      kind: 'from-title',
      inferred,
      coef,
      sell,
      name: String(prod.name || '').slice(0, 36),
    })
  }

  const remainProduct = await p.product.count({
    where: { status: 'ACTIVE', OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
  })
  const remainPending = await p.importtaskitem.count({
    where: { isPublished: false, OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
  })

  console.log(
    JSON.stringify(
      {
        pendingFilled: summary.pendingFilled,
        pendingSkipped: summary.pendingSkipped,
        productsFilled: summary.productsFilled,
        skuOnlyFilled: summary.skuOnlyFilled,
        remainProduct,
        remainPending,
        filled: summary.filled,
        skipped: summary.skipped,
      },
      null,
      2,
    ),
  )
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
