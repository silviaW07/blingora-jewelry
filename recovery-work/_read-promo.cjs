require('dotenv').config()
const { PrismaClient } = require('../prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const rows = await p.sitesetting.findMany({
    where: { title: 'PRICE_PROMO_CONFIG' },
    select: { isActive: true, contentJson: true, updatedAt: true },
  })
  console.log(JSON.stringify(rows, null, 2))
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
