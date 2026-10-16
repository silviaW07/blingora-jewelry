const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')

const p = new PrismaClient()
;(async () => {
  const ids = [
    'c2eafddc-cf2a-46cb-9eb2-00ec61354ccc',
    '19db1059-ecda-4809-b08b-5251f224bcc0',
    '33bd59c5-2526-430b-906a-a37416efe471',
  ]
  const extra = await p.importtaskitem.findMany({
    where: {
      isPublished: false,
      OR: [
        { id: { in: ids } },
        { parsedName: { contains: 'Lococo' } },
        { parsedName: { contains: 'Loco' } },
        { parsedName: { contains: '华伦天奴' } },
      ],
    },
    take: 12,
    select: {
      id: true,
      parsedName: true,
      skuSummaryText: true,
      sourceUrl: true,
      previewDataJson: true,
    },
  })
  for (const item of extra) {
    const preview = item.previewDataJson || {}
    console.log('\nID', item.id)
    console.log((item.parsedName || '').split('\n')[0])
    console.log('summary', item.skuSummaryText)
    console.log('colors', (preview.colors || []).map((c) => c.label).join(' / ') || '-')
    console.log(
      'skus',
      (preview.skuTable || []).map((s) => ({
        spec: s.spec,
        color: (s.attributes || []).find((a) => a.name === '颜色')?.value,
        img: String(s.imageUrl || '').split('/').pop(),
      })),
    )
    console.log('gallery', (preview.detailImages || []).length, 'main', Boolean(preview.mainImageUrl))
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
