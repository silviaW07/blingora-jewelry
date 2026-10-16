require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()
;(async () => {
  const start = new Date(2026, 8, 1)
  const end = new Date(2026, 9, 1)
  const t0 = Date.now()
  const rows = await p.product.findMany({
    where: { createdAt: { gte: start, lt: end }, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      mainImageUrl: true,
      createdAt: true,
      skus: { select: { imageUrl: true }, take: 8 },
    },
    orderBy: { createdAt: 'desc' },
    take: 24,
  })
  const qms = Date.now() - t0
  const hosts = {}
  for (const r of rows) {
    const urls = [r.mainImageUrl, ...r.skus.map((s) => s.imageUrl)].filter(Boolean)
    for (const u of urls) {
      try {
        const h = new URL(u).hostname
        hosts[h] = (hosts[h] || 0) + 1
      } catch {
        hosts['(relative)'] = (hosts['(relative)'] || 0) + 1
      }
    }
  }
  console.log(
    JSON.stringify(
      {
        qms,
        n: rows.length,
        hosts,
        sample: rows.slice(0, 6).map((r) => ({
          name: String(r.name).slice(0, 50),
          img: String(r.mainImageUrl || '').slice(0, 140),
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
