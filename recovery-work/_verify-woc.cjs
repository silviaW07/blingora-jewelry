const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const products = await p.product.findMany({
    where: { productCode: { in: ['HAND2026090101', 'HAND2026090102'] } },
    include: { skus: true },
  })
  for (const product of products) {
    console.log('\n', product.productCode, product.slug, product.id)
    for (const sku of product.skus) {
      console.log(sku.skuCode, sku.sizeLabel, JSON.stringify(sku.attributeJson), sku.imageUrl)
    }
  }
  const pending = await p.importtaskitem.findMany({
    where: { id: { in: ['10a90757-72b4-46d2-8df3-2618bd731197', 'e50411b2-4964-4774-b740-92906e73098b'] } },
    select: { id: true, parsedName: true, skuSummaryText: true, previewDataJson: true },
  })
  for (const item of pending) {
    const preview = item.previewDataJson || {}
    console.log('\nPENDING', item.id, (item.parsedName || '').split('\n')[0])
    console.log(item.skuSummaryText)
    console.log((preview.colors || []).map((c) => c.label))
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
