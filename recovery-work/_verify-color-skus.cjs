const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const ids = [
    '19db1059-ecda-4809-b08b-5251f224bcc0',
    '33bd59c5-2526-430b-906a-a37416efe471',
  ]
  const extra = await p.importtaskitem.findMany({
    where: {
      isPublished: false,
      OR: [
        { id: { in: ids } },
        { parsedName: { contains: 'Marmont' } },
        { parsedName: { contains: 'Laurel' } },
      ],
    },
    take: 8,
    select: { id: true, parsedName: true, skuSummaryText: true, previewDataJson: true },
  })
  for (const item of extra) {
    const preview = item.previewDataJson || {}
    console.log('\n', item.id)
    console.log((item.parsedName || '').split('\n')[0])
    console.log('summary', item.skuSummaryText)
    console.log('colors', (preview.colors || []).map((c) => c.label))
    console.log('skus', (preview.skuTable || []).length, 'details', (preview.detailImages || []).length)
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
