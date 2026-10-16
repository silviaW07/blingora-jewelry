require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()

function n(v) {
  if (v == null) return null
  return typeof v.toNumber === 'function' ? v.toNumber() : Number(v)
}

;(async () => {
  const rows = await p.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { name: { contains: 'Chip version' } },
        { name: { contains: 'Boxes (same price' } },
        { name: { contains: 'Cowhide upgrades' } },
        { name: { contains: 'Coach buckle' } },
        { name: { contains: 'Packaging' } },
      ],
    },
    select: {
      id: true,
      name: true,
      costPrice: true,
      status: true,
      category: { select: { name: true, priceCoefficient: true } },
      skus: { select: { skuCode: true, price: true, originalPrice: true }, take: 8 },
    },
    take: 12,
    orderBy: { updatedAt: 'desc' },
  })

  const zeroSku = await p.productsku.count({
    where: { product: { status: 'ACTIVE' }, price: { lte: 0 } },
  })
  const zeroCost = await p.product.count({
    where: { status: 'ACTIVE', OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
  })
  const active = await p.product.count({ where: { status: 'ACTIVE' } })

  const sample = rows.map((r) => ({
    name: String(r.name).slice(0, 70),
    cost: n(r.costPrice),
    cat: r.category && r.category.name,
    coef: n(r.category && r.category.priceCoefficient),
    skus: r.skus.map((s) => ({ code: s.skuCode, price: n(s.price) })),
  }))

  const recentZero = await p.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ costPrice: null }, { costPrice: { lte: 0 } }],
    },
    select: {
      name: true,
      costPrice: true,
      createdAt: true,
      skus: { select: { price: true }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  console.log(
    JSON.stringify(
      {
        active,
        zeroCost,
        zeroSku,
        matched: sample,
        recentZeroCost: recentZero.map((r) => ({
          name: String(r.name).slice(0, 60),
          cost: n(r.costPrice),
          skuPrices: r.skus.map((s) => n(s.price)),
          created: r.createdAt,
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
