const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const items = await p.importtaskitem.findMany({
    where: {
      isPublished: false,
      OR: [
        { parsedName: { contains: 'Multipass' } },
        { parsedName: { contains: 'P1600' } },
        { parsedName: { contains: '腋下托特' } },
      ],
    },
    take: 5,
    select: {
      id: true,
      sourceUrl: true,
      skuSummaryText: true,
      parsedName: true,
      previewDataJson: true,
    },
  })
  for (const item of items) {
    const preview = item.previewDataJson || {}
    console.log('\n', item.id)
    console.log((item.parsedName || '').split('\n')[0])
    console.log('source', item.sourceUrl)
    console.log('summary', item.skuSummaryText)
    console.log('colors', (preview.colors || []).map((c) => c.label))
    console.log('skus', (preview.skuTable || []).map((s) => s.spec))
    console.log('details', (preview.detailImages || []).length)
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
