/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path')
const repoRoot = path.resolve(__dirname, '..')
process.chdir(repoRoot)
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
require('tsconfig-paths/register')

const JUNK_DIM = /纯度|成色|含量|商品类型|产品类型|品类|^类型$|^货号$|^品牌$/
const JUNK_VALUE =
  /^(耳饰|耳环|耳钉|饰品|首饰|珠宝|项链|手链|手镯|戒指|脚链|吊坠|胸针|发夹|发绳|手表|眼镜|包|包包|箱包|腰带|鞋子|衣服|jewelry|earrings?|necklace|bracelet|ring)$/i

function isSellableAttr(attr) {
  const name = String(attr?.name || '').trim()
  const value = String(attr?.value || '').trim()
  if (!name || !value) return false
  if (JUNK_DIM.test(name)) return false
  if (JUNK_VALUE.test(value)) return false
  return true
}

function sanitizeAttrs(attrs) {
  return (Array.isArray(attrs) ? attrs : []).filter(isSellableAttr)
}

function colorOf(attrs) {
  const hit = (Array.isArray(attrs) ? attrs : []).find((attr) =>
    /颜色|colour|color/i.test(String(attr?.name || '')),
  )
  return String(hit?.value || '').trim()
}

function officialColorImages(preview) {
  const map = new Map()
  for (const color of preview?.colors || []) {
    const label = String(color?.label || '').trim()
    const url = String(color?.imageUrl || '').trim()
    if (label && url) map.set(label, url)
  }
  for (const row of preview?.skuTable || []) {
    const label = colorOf(row.attributes)
    const url = String(row?.imageUrl || '').trim()
    if (label && url && !map.has(label)) map.set(label, url)
  }
  return map
}

function cleanSizesByColor(sizesByColor) {
  const next = {}
  for (const [color, sizes] of Object.entries(sizesByColor || {})) {
    const kept = (sizes || []).map((size) => String(size || '').trim()).filter((size) => size && !JUNK_VALUE.test(size))
    if (kept.length) next[color] = kept
  }
  return next
}

async function main() {
  const { PrismaClient } = require(path.join(repoRoot, 'prisma-generated/client'))
  const prisma = new PrismaClient()
  const summary = {
    products: 0,
    skus: 0,
    skuImagesRestored: 0,
    pending: 0,
  }

  const products = await prisma.product.findMany({
    where: { source: 'IMPORT_1688' },
    select: {
      id: true,
      productCode: true,
      parameterJson: true,
      skus: {
        select: { id: true, imageUrl: true, sizeLabel: true, attributeJson: true },
      },
    },
  })
  const pendingByProduct = await prisma.importtaskitem.findMany({
    where: { importedProductId: { in: products.map((row) => row.id) } },
    select: { importedProductId: true, previewDataJson: true, sourceUrl: true },
  })
  const previewByProduct = new Map(
    pendingByProduct.map((row) => [row.importedProductId, row.previewDataJson || {}]),
  )

  for (const product of products) {
    const official = officialColorImages(previewByProduct.get(product.id) || {})
    let productChanged = false
    for (const sku of product.skus) {
      const rawAttrs = Array.isArray(sku.attributeJson) ? sku.attributeJson : []
      const nextAttrs = sanitizeAttrs(rawAttrs)
      const attrsChanged = JSON.stringify(rawAttrs) !== JSON.stringify(nextAttrs)
      const nextSize = JUNK_VALUE.test(String(sku.sizeLabel || '').trim()) ? null : sku.sizeLabel
      const color = colorOf(nextAttrs)
      const officialUrl = color ? official.get(color) || null : null
      const nextImage =
        sku.imageUrl ||
        (officialUrl && /alicdn|aliimg|1688\.com\/img|\/api\/uploads\//i.test(officialUrl) ? officialUrl : sku.imageUrl)
      const imageChanged = Boolean(nextImage && nextImage !== sku.imageUrl)
      if (!attrsChanged && nextSize === sku.sizeLabel && !imageChanged) continue
      await prisma.productsku.update({
        where: { id: sku.id },
        data: {
          attributeJson: nextAttrs,
          sizeLabel: nextSize,
          ...(imageChanged ? { imageUrl: nextImage } : {}),
        },
      })
      summary.skus += 1
      if (imageChanged) summary.skuImagesRestored += 1
      productChanged = true
    }
    if (productChanged) summary.products += 1
  }

  const pendingItems = await prisma.importtaskitem.findMany({
    where: {
      isPublished: false,
      importedProductId: null,
      sourceUrl: { contains: '1688.com' },
    },
    select: {
      id: true,
      skuSummaryText: true,
      previewDataJson: true,
      specSummaryJson: true,
    },
  })

  for (const item of pendingItems) {
    const preview = item.previewDataJson || {}
    const skuTable = Array.isArray(preview.skuTable) ? preview.skuTable : []
    const nextSkuTable = skuTable.map((row) => {
      const attributes = sanitizeAttrs(row.attributes)
      return {
        ...row,
        attributes,
        spec:
          attributes.map((attr) => attr.value).filter(Boolean).join(' / ') ||
          String(row.spec || '')
            .split('/')
            .map((part) => part.trim())
            .filter((part) => part && !JUNK_VALUE.test(part))
            .join(' / ') ||
          row.spec,
      }
    })
    const nextColors = (preview.colors || []).map((color) => ({
      ...color,
      label: String(color.label || '').trim(),
    }))
    const nextSizes = cleanSizesByColor(preview.sizesByColor)
    const nextSpecSummary = (Array.isArray(item.specSummaryJson) ? item.specSummaryJson : [])
      .map((row) => ({
        name: String(row?.name || '').trim(),
        values: (row?.values || [])
          .map((value) => String(value || '').trim())
          .filter((value) => value && !JUNK_VALUE.test(value)),
      }))
      .filter((row) => row.name && !JUNK_DIM.test(row.name) && row.values.length > 0)
    const nextSummary =
      nextSkuTable.map((row) => row.spec).filter(Boolean).join(' | ') || item.skuSummaryText
    const changed =
      JSON.stringify(skuTable) !== JSON.stringify(nextSkuTable) ||
      JSON.stringify(preview.sizesByColor || {}) !== JSON.stringify(nextSizes) ||
      JSON.stringify(item.specSummaryJson || []) !== JSON.stringify(nextSpecSummary)
    if (!changed) continue
    await prisma.importtaskitem.update({
      where: { id: item.id },
      data: {
        skuSummaryText: nextSummary,
        specSummaryJson: nextSpecSummary,
        previewDataJson: {
          ...preview,
          skuTable: nextSkuTable,
          colors: nextColors,
          sizesByColor: nextSizes,
        },
      },
    })
    summary.pending += 1
  }

  console.log(JSON.stringify(summary, null, 2))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
