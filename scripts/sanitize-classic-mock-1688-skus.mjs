/**
 * Clear classic mock 红/蓝/黑 pending SKU rows without network re-fetch.
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../prisma-generated/client')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893'

const url = /[?&]charset=/i.test(DATABASE_URL)
  ? DATABASE_URL
  : DATABASE_URL.includes('?')
    ? `${DATABASE_URL}&charset=utf8mb4`
    : `${DATABASE_URL}?charset=utf8mb4`

const prisma = new PrismaClient({ datasources: { db: { url } } })

const isClassicMockSummary = (text) => {
  const normalized = String(text || '').replace(/\s+/g, '')
  return (
    normalized.includes('红色/M') &&
    normalized.includes('蓝色/L') &&
    normalized.includes('黑色/XL')
  )
}

const isClassicMockTable = (table) => {
  if (!Array.isArray(table) || table.length !== 3) return false
  const joined = table.map((row) => String(row.spec || '').replace(/\s+/g, '')).join('|')
  if (isClassicMockSummary(joined)) return true
  const colors = table.map((row) => row.attributes?.find((a) => a.name === '颜色')?.value)
  const sizes = table.map((row) => row.attributes?.find((a) => a.name === '尺码')?.value)
  return (
    colors[0] === '红色' &&
    colors[1] === '蓝色' &&
    colors[2] === '黑色' &&
    sizes[0] === 'M' &&
    sizes[1] === 'L' &&
    sizes[2] === 'XL'
  )
}

const main = async () => {
  const items = await prisma.importtaskitem.findMany({
    where: { isPublished: false },
    take: 80,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      skuSummaryText: true,
      costPrice: true,
      cnyPriceMin: true,
      parsedPriceMin: true,
      availableStock: true,
      previewDataJson: true,
    },
  })

  let updated = 0
  for (const item of items) {
    const preview = item.previewDataJson || {}
    if (!isClassicMockSummary(item.skuSummaryText) && !isClassicMockTable(preview.skuTable)) continue
    const cost = Number(item.costPrice ?? item.cnyPriceMin ?? item.parsedPriceMin ?? 50) || 50
    const fallbackSku = {
      skuKey: 'sku-1',
      spec: '默认规格',
      costPrice: cost,
      price: cost,
      stock: item.availableStock ?? 100,
      weightGrams: 500,
      imageUrl: null,
      attributes: [{ name: '规格', value: '默认规格' }],
    }
    await prisma.importtaskitem.update({
      where: { id: item.id },
      data: {
        skuSummaryText: '默认规格',
        specSummaryJson: [{ name: '规格', values: ['默认规格'] }],
        previewDataJson: {
          ...preview,
          colors: [],
          sizesByColor: {},
          skuTable: [fallbackSku],
        },
      },
    })
    updated += 1
    console.log('cleared mock', item.id.slice(0, 8))
  }
  console.log('done, cleared', updated)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
