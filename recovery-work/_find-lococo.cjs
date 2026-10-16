const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const items = await p.importtaskitem.findMany({
    where: {
      isPublished: false,
      OR: [
        { parsedName: { contains: 'Lococo' } },
        { parsedName: { contains: 'lococo' } },
        { parsedName: { contains: 'P1500' } },
        { parsedName: { contains: 'P1455' } },
        { parsedName: { contains: '华伦' } },
      ],
    },
    take: 8,
    select: {
      id: true,
      sourceUrl: true,
      parsedName: true,
      skuSummaryText: true,
      previewDataJson: true,
    },
  })
  for (const item of items) {
    const preview = item.previewDataJson || {}
    console.log('\n', item.id)
    console.log((item.parsedName || '').slice(0, 80))
    console.log('summary', item.skuSummaryText)
    console.log('colors', (preview.colors || []).map((c) => c.label))
    console.log('skus', (preview.skuTable || []).map((s) => s.spec))
    console.log('details', (preview.detailImages || []).length)
    console.log((preview.detailImages || []).concat(preview.mainImageUrl || []).slice(0, 10))
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
