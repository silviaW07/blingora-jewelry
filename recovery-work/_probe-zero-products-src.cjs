require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()
function n(v) {
  if (v == null) return null
  return typeof v.toNumber === 'function' ? v.toNumber() : Number(v)
}
;(async () => {
  const products = await p.product.findMany({
    where: { status: 'ACTIVE', OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
    select: {
      id: true,
      name: true,
      sourceUrl: true,
      parsedPriceMin: true,
      costPrice: true,
      createdAt: true,
    },
  })
  const names = products.map((r) => String(r.name).slice(0, 40))
  const pending = await p.importtaskitem.findMany({
    where: {
      OR: names.flatMap((name) => [
        { parsedName: { contains: name.slice(0, 12) } },
      ]).slice(0, 20),
    },
    select: {
      parsedName: true,
      costPrice: true,
      parsedPriceMin: true,
      cnyPriceMin: true,
      sourceUrl: true,
      isPublished: true,
    },
    take: 20,
  })
  const full = await p.product.findMany({
    where: { status: 'ACTIVE', OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
    select: {
      id: true,
      name: true,
      mainImageUrl: true,
      sourceUrl: true,
      costPrice: true,
      tradeInfoJson: true,
      translationsJson: true,
    },
  })
  console.log(
    JSON.stringify(
      {
        products: full.map((r) => ({
          id: r.id,
          name: String(r.name).slice(0, 80),
          source: r.sourceUrl,
          cost: n(r.costPrice),
        })),
        pending: pending.map((r) => ({
          name: String(r.parsedName || '').slice(0, 60),
          cost: n(r.costPrice),
          parsedMin: n(r.parsedPriceMin),
          cny: n(r.cnyPriceMin),
          pub: r.isPublished,
          url: String(r.sourceUrl || '').slice(0, 80),
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
