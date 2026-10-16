const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const products = await p.product.findMany({
    where: {
      OR: [
        { productCode: { contains: 'HAND2026090102' } },
        { name: { contains: '发财包' } },
        { name: { contains: 'WOC' } },
      ],
    },
    take: 5,
    include: { skus: true },
  })
  for (const product of products) {
    console.log('\nPRODUCT', product.id, product.productCode)
    console.log(product.name)
    console.log('main', product.mainImageUrl)
    console.log('gallery', JSON.stringify(product.galleryJson)?.slice(0, 400))
    for (const sku of product.skus) {
      console.log('SKU', sku.skuCode, sku.imageUrl)
      console.log(' attrs', JSON.stringify(sku.attributeJson))
    }
  }
  const pending = await p.importtaskitem.findMany({
    where: {
      OR: [
        { parsedName: { contains: '发财包' } },
        { parsedName: { contains: 'WOC' } },
        { importedProductId: { in: products.map((row) => row.id) } },
      ],
    },
    take: 5,
    select: {
      id: true,
      isPublished: true,
      importedProductId: true,
      parsedName: true,
      skuSummaryText: true,
      previewDataJson: true,
    },
  })
  for (const item of pending) {
    const preview = item.previewDataJson || {}
    console.log('\nPENDING', item.id, item.isPublished, item.importedProductId)
    console.log((item.parsedName || '').split('\n')[0])
    console.log('summary', item.skuSummaryText)
    console.log('colors', (preview.colors || []).map((c) => c.label))
    console.log('skus', (preview.skuTable || []).map((s) => ({ spec: s.spec, attrs: s.attributes, img: s.imageUrl })))
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
