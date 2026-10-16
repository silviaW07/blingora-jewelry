const { PrismaClient } = require('./prisma-generated/client')

const HQ_BAG_ID = '3261a156-273d-4861-ab3b-57ffc4c3aed1'
const p = new PrismaClient()

;(async () => {
  const titled = await p.$queryRawUnsafe(`
    SELECT p.id
    FROM product p
    WHERE p.name LIKE '%high quality bag%'
      AND NOT EXISTS (
        SELECT 1 FROM product_category_relations r
        WHERE r.productId = p.id AND r.categoryId = '${HQ_BAG_ID}'
      )
  `)

  console.log('missing', titled.length)
  const chunk = 200
  let added = 0
  for (let i = 0; i < titled.length; i += chunk) {
    const slice = titled.slice(i, i + chunk)
    await p.product_category_relations.createMany({
      data: slice.map((row) => ({
        productId: row.id,
        categoryId: HQ_BAG_ID,
      })),
      skipDuplicates: true,
    })
    added += slice.length
    console.log('added', added)
  }

  const after = await p.$queryRawUnsafe(
    `SELECT COUNT(*) AS n FROM product_category_relations WHERE categoryId = '${HQ_BAG_ID}'`,
  )
  console.log('hq_links', Number(after[0].n))
  const hand = await p.$queryRawUnsafe(
    `SELECT COUNT(*) AS n FROM product_category_relations r
     JOIN product p ON p.id = r.productId
     WHERE r.categoryId = '${HQ_BAG_ID}' AND p.productCode IN ('HAND2026090127','HAND2026090126')`,
  )
  console.log('hand_linked', Number(hand[0].n))
  await p.$disconnect()
})().catch(async (e) => {
  console.error(e)
  await p.$disconnect()
  process.exit(1)
})
