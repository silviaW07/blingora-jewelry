require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
const { extractAlbumTitlePrice, titleHasStrongPriceHint } = require('../src/shared/albumTitlePrice.ts')
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

function rewriteSkuTable(table, oldCost, nextCost, sell) {
  if (!Array.isArray(table) || !table.length) return table
  return table.map((row) => {
    const cost = n(row.costPrice ?? row.cost_price)
    const should = cost == null || cost <= 0 || (oldCost != null && Math.abs(cost - oldCost) < 0.021)
    if (!should) return row
    return { ...row, costPrice: nextCost, cost_price: nextCost, price: sell }
  })
}

;(async () => {
  const rows = await p.importtaskitem.findMany({
    where: {
      isPublished: false,
      fetchStatus: 'COMPLETED',
      costPrice: { gt: 0 },
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
    orderBy: { id: 'desc' },
    take: 800,
  })

  const changed = []
  for (const row of rows) {
    const preview = row.previewDataJson && typeof row.previewDataJson === 'object' ? row.previewDataJson : {}
    const texts = [row.parsedName, preview.name, row.productDetail, preview.shortDescription]
    const inferred = extractAlbumTitlePrice(...texts)
    const oldCost = n(row.costPrice)
    if (!(inferred > 0) || oldCost == null) continue
    if (Math.abs(inferred - oldCost) < 0.021) continue
    if (!titleHasStrongPriceHint(...texts)) continue

    const coeff = n(row.coefficient) || 2.08
    const sell = roundMoney(inferred * coeff)
    const nextPreview = {
      ...preview,
      price: sell,
      skuTable: rewriteSkuTable(preview.skuTable, oldCost, inferred, sell),
    }
    let operatorSkuJson = row.operatorSkuJson
    if (operatorSkuJson) {
      try {
        const parsed = typeof operatorSkuJson === 'string' ? JSON.parse(operatorSkuJson) : operatorSkuJson
        operatorSkuJson = JSON.stringify(rewriteSkuTable(parsed, oldCost, inferred, sell))
      } catch {
        operatorSkuJson = row.operatorSkuJson
      }
    }
    await p.importtaskitem.update({
      where: { id: row.id },
      data: {
        costPrice: inferred,
        parsedPriceMin: inferred,
        parsedPriceMax: inferred,
        cnyPriceMin: sell,
        cnyPriceMax: sell,
        previewDataJson: nextPreview,
        ...(operatorSkuJson && operatorSkuJson !== row.operatorSkuJson ? { operatorSkuJson } : {}),
      },
    })
    changed.push({
      name: String(row.parsedName || preview.name || '').slice(0, 60),
      from: oldCost,
      to: inferred,
    })
  }

  console.log(JSON.stringify({ updated: changed.length, sample: changed.slice(0, 20) }, null, 2))
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
