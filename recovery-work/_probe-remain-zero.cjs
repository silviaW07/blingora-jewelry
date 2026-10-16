require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require(require('path').join(__dirname, '..', 'prisma-generated/client'))
const p = new PrismaClient()
;(async () => {
  const rows = await p.importtaskitem.findMany({
    where: { isPublished: false, OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
    select: { parsedName: true, productDetail: true, previewDataJson: true, sourceUrl: true },
    take: 40,
  })
  const names = rows.map((r) => {
    const preview = r.previewDataJson || {}
    return {
      parsed: String(r.parsedName || '').slice(0, 70),
      preview: String(preview.name || '').slice(0, 50),
      url: String(r.sourceUrl || '').slice(0, 60),
    }
  })
  console.log(JSON.stringify({ remain: rows.length, names }, null, 2))
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
