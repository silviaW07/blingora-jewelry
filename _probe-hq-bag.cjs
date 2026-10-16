const { PrismaClient } = require('./prisma-generated/client')
const p = new PrismaClient()

;(async () => {
  const cats = await p.$queryRawUnsafe(`
    SELECT c.id, c.name, c.level, c.status, p.name AS parentName
    FROM category c
    LEFT JOIN category p ON p.id = c.parentId
    WHERE LOWER(c.name) LIKE '%quality%'
       OR LOWER(c.name) LIKE '%品质%'
       OR LOWER(c.name) LIKE '%bag%'
    ORDER BY c.name
  `)
  console.log('CATS', JSON.stringify(cats, null, 2))

  const prods = await p.$queryRawUnsafe(`
    SELECT id, productCode, name, categoryId
    FROM product
    WHERE name LIKE '%high quality bag%'
       OR productCode IN ('HAND2026090127', 'HAND2026090126')
    LIMIT 20
  `)
  console.log('PRODS', JSON.stringify(prods, null, 2))

  if (prods.length) {
    const ids = prods.map((x) => `'${x.id}'`).join(',')
    const rels = await p.$queryRawUnsafe(`
      SELECT pc.productId, c.name, c.id
      FROM productcategory pc
      JOIN category c ON c.id = pc.categoryId
      WHERE pc.productId IN (${ids})
    `)
    console.log('RELS', JSON.stringify(rels, null, 2))
  }
  const one = prods[0]
  if (one) {
    const anyRel = await p.$queryRawUnsafe(
      `SELECT * FROM productcategory WHERE productId = '${one.id}' LIMIT 5`,
    )
    console.log('ANYREL', JSON.stringify(anyRel))
  }
  const hand = await p.$queryRawUnsafe(`
    SELECT id, productCode, name, categoryId
    FROM product
    WHERE productCode IN ('HAND2026090127','HAND2026090126')
       OR name LIKE '%Multipass%'
       OR name LIKE '%Tabby%'
    LIMIT 10
  `)
  console.log('HAND', JSON.stringify(hand, null, 2))
  const hqCount = await p.$queryRawUnsafe(`
    SELECT COUNT(*) AS n FROM productcategory
    WHERE categoryId = '3261a156-273d-4861-ab3b-57ffc4c3aed1'
  `)
  console.log('HQ_LINKS', JSON.stringify(hqCount))
  const titled = await p.$queryRawUnsafe(`
    SELECT COUNT(*) AS n FROM product WHERE name LIKE '%high quality bag%'
  `)
  console.log('TITLED', JSON.stringify(titled))

  await p.$disconnect()
})().catch(async (e) => {
  console.error(e)
  await p.$disconnect()
  process.exit(1)
})
