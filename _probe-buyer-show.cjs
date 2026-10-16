const { PrismaClient } = require('./prisma-generated/client')
const p = new PrismaClient()

;(async () => {
  const tables = await p.$queryRawUnsafe(`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('buyer_show_media','buyershowmedia','lookbook','lookbookproduct')
  `)
  console.log('TABLES', JSON.stringify(tables))

  try {
    const cols = await p.$queryRawUnsafe(`SHOW COLUMNS FROM buyer_show_media`)
    console.log('COLS', cols.map((c) => c.Field).join(','))
  } catch (e) {
    console.log('COLS_ERR', e.message)
  }

  try {
    const counts = await p.$queryRawUnsafe(`
      SELECT COUNT(*) AS n,
             SUM(is_enabled=1) AS enabled,
             SUM(is_enabled=0) AS disabled
      FROM buyer_show_media
    `)
    console.log('COUNTS', JSON.stringify(counts, (_, v) => (typeof v === 'bigint' ? Number(v) : v)))
  } catch (e) {
    console.log('COUNT_ERR', e.message)
  }

  try {
    const sample = await p.$queryRawUnsafe(`
      SELECT id, media_type, LEFT(media_url, 80) AS url, is_enabled, sort_weight, title
      FROM buyer_show_media
      ORDER BY sort_weight DESC, createdAt DESC
      LIMIT 8
    `)
    console.log('SAMPLE', JSON.stringify(sample, null, 2))
  } catch (e) {
    console.log('SAMPLE_ERR', e.message)
    try {
      const sample2 = await p.$queryRawUnsafe(`
        SELECT id, media_type, LEFT(media_url, 80) AS url, is_enabled, sort_weight, title, createdAt
        FROM buyer_show_media
        ORDER BY createdAt DESC
        LIMIT 8
      `)
      console.log('SAMPLE2', JSON.stringify(sample2, null, 2))
    } catch (e2) {
      console.log('SAMPLE2_ERR', e2.message)
    }
  }

  const hasModel = typeof p.buyershowmedia?.findMany === 'function'
  console.log('PRISMA_MODEL', hasModel)
  if (hasModel) {
    try {
      const viaPrisma = await p.buyershowmedia.findMany({ take: 3, select: { id: true, mediaUrl: true, isEnabled: true } })
      console.log('PRISMA_ROWS', JSON.stringify(viaPrisma))
    } catch (e) {
      console.log('PRISMA_ERR', e.message)
    }
  }

  await p.$disconnect()
})().catch(async (e) => {
  console.error(e)
  await p.$disconnect()
  process.exit(1)
})
