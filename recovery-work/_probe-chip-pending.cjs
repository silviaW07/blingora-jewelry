require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()
function n(v) {
  if (v == null) return null
  return typeof v.toNumber === 'function' ? v.toNumber() : Number(v)
}
;(async () => {
  const pending = await p.importtaskitem.findMany({
    where: {
      OR: [
        { parsedName: { contains: '芯片版' } },
        { parsedName: { contains: '配盒' } },
        { parsedName: { contains: '吸扣' } },
        { parsedName: { contains: '发财包' } },
      ],
    },
    select: {
      parsedName: true,
      costPrice: true,
      parsedPriceMin: true,
      cnyPriceMin: true,
      isPublished: true,
      sourceUrl: true,
    },
    take: 20,
    orderBy: { updatedAt: 'desc' },
  })
  console.log(
    JSON.stringify(
      pending.map((r) => ({
        name: String(r.parsedName || '').slice(0, 50),
        cost: n(r.costPrice),
        min: n(r.parsedPriceMin),
        cny: n(r.cnyPriceMin),
        pub: r.isPublished,
      })),
      null,
      2,
    ),
  )
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
