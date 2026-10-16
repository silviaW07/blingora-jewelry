const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const products = await p.product.findMany({
    where: {
      OR: [
        { productCode: 'HAND2026090105' },
        { name: { contains: '6671' } },
        { name: { contains: '带挂件' } },
      ],
    },
    include: { skus: { orderBy: { skuCode: 'asc' } } },
    take: 5,
  })
  for (const product of products) {
    console.log('\nPRODUCT', product.productCode, product.id, product.slug)
    console.log('name', product.name)
    console.log('status', product.status, product.goodsStatus, product.publishedAt)
    console.log('parameterJson', JSON.stringify(product.parameterJson)?.slice(0, 500))
    for (const sku of product.skus) {
      console.log('SKU', sku.skuCode, sku.sizeLabel, JSON.stringify(sku.attributeJson), sku.imageUrl)
    }
  }
  const pending = await p.importtaskitem.findMany({
    where: {
      OR: [
        { importedProductId: { in: products.map((row) => row.id) } },
        { parsedName: { contains: '6671' } },
        { parsedName: { contains: '带挂件p36' } },
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
    console.log(
      'skus',
      (preview.skuTable || []).map((s) => ({
        key: s.skuKey,
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
