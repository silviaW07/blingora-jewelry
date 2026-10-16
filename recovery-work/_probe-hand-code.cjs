require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()
function n(v) {
  if (v == null) return null
  return typeof v.toNumber === 'function' ? v.toNumber() : Number(v)
}
;(async () => {
  const products = await p.product.findMany({
    where: {
      OR: [
        { productCode: { contains: 'HAND2026090250' } },
        { productCode: { startsWith: 'HAND202609' } },
        { skus: { some: { skuCode: { contains: 'HAND2026090250' } } } },
      ],
    },
    select: {
      id: true,
      productCode: true,
      name: true,
      costPrice: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      category: { select: { name: true, priceCoefficient: true } },
      skus: {
        select: { skuCode: true, price: true, originalPrice: true, updatedAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
    take: 30,
  })
  const exact = await p.product.findFirst({
    where: { productCode: 'HAND2026090250' },
    select: { id: true, productCode: true, name: true, costPrice: true, status: true },
  })
  const skuExact = await p.productsku.findMany({
    where: { skuCode: { contains: 'HAND2026090250' } },
    select: { skuCode: true, price: true, productId: true },
    take: 10,
  })
  console.log(
    JSON.stringify(
      {
        exact,
        skuExact,
        n: products.length,
        rows: products.map((r) => ({
          code: r.productCode,
          status: r.status,
          cost: n(r.costPrice),
          coef: n(r.category && r.category.priceCoefficient),
          cat: r.category && r.category.name,
          name: String(r.name).slice(0, 70),
          updated: r.updatedAt,
          skus: r.skus.map((s) => ({
            code: s.skuCode,
            price: n(s.price),
            orig: n(s.originalPrice),
            upd: s.updatedAt,
          })),
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
