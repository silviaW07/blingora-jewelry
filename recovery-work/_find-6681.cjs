const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const products = await p.product.findMany({
    where: { OR: [{ name: { contains: '6681' } }, { productCode: { startsWith: 'HAND20260901' } }] },
    select: { id: true, productCode: true, name: true, status: true, goodsStatus: true, deletedAt: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  })
  console.log('products')
  for (const row of products) {
    console.log(row.productCode, row.status, row.goodsStatus, row.deletedAt, (row.name || '').slice(0, 40))
  }
  const pending = await p.importtaskitem.findMany({
    where: { parsedName: { contains: '6681' } },
    select: { id: true, isPublished: true, importedProductId: true, parsedName: true, skuSummaryText: true, previewDataJson: true },
    take: 5,
  })
  for (const item of pending) {
    const preview = item.previewDataJson || {}
    console.log('\nPENDING', item.id, item.isPublished, item.importedProductId)
    console.log((item.parsedName || '').split('\n')[0])
    console.log('summary', item.skuSummaryText)
    console.log('colors', (preview.colors || []).map((c) => c.label))
    console.log(
      'skus',
      (preview.skuTable || []).map((s) => ({
        spec: s.spec,
        attrs: s.attributes,
        img: String(s.imageUrl || '').split('/').pop(),
      })),
    )
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
