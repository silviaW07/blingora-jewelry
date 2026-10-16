const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const row = await p.product.findUnique({
    where: { productCode: 'HAND2026090102' },
    select: {
      id: true,
      slug: true,
      status: true,
      goodsStatus: true,
      publishedAt: true,
      deletedAt: true,
    },
  })
  console.log(row)
  await p.$disconnect()
})()
