const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const row = await p.product.findUnique({
    where: { productCode: 'HAND2026090105' },
    include: { skus: true },
  })
  console.log(row.productCode, row.status, row.goodsStatus, row.id)
  for (const sku of row.skus) {
    console.log(sku.skuCode, sku.sizeLabel, JSON.stringify(sku.attributeJson), sku.imageUrl)
  }
  console.log('parameterJson', JSON.stringify(row.parameterJson))
  await p.$disconnect()
})()
