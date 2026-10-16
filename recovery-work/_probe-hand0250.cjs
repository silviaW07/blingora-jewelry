require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()
function n(v) {
  if (v == null) return null
  return typeof v.toNumber === 'function' ? v.toNumber() : Number(v)
}
;(async () => {
  const prod = await p.product.findUnique({
    where: { productCode: 'HAND2026090250' },
    select: {
      id: true,
      name: true,
      costPrice: true,
      createdAt: true,
      updatedAt: true,
      shortDescription: true,
      skus: { select: { skuCode: true, price: true, updatedAt: true, createdAt: true } },
    },
  })
  const items = await p.importtaskitem.findMany({
    where: { OR: [{ productId: prod.id }, { parsedName: { contains: '大小同价' } }] },
    select: {
      id: true,
      productId: true,
      parsedName: true,
      productDetail: true,
      costPrice: true,
      parsedPriceMin: true,
      cnyPriceMin: true,
      isPublished: true,
      updatedAt: true,
      createdAt: true,
      sourceUrl: true,
    },
    take: 10,
  })
  console.log(
    JSON.stringify(
      {
        prod: {
          ...prod,
          cost: n(prod.costPrice),
          skus: prod.skus.map((s) => ({
            code: s.skuCode,
            price: n(s.price),
            created: s.createdAt,
            updated: s.updatedAt,
          })),
        },
        items: items.map((r) => ({
          id: r.id,
          productId: r.productId,
          name: String(r.parsedName || '').slice(0, 80),
          detail: String(r.productDetail || '').slice(0, 120),
          cost: n(r.costPrice),
          min: n(r.parsedPriceMin),
          cny: n(r.cnyPriceMin),
          pub: r.isPublished,
          url: String(r.sourceUrl || '').slice(0, 90),
          created: r.createdAt,
          updated: r.updatedAt,
        })),
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
