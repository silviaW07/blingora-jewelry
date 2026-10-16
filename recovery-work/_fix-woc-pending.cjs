const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const p = new PrismaClient()
;(async () => {
  const item = await p.importtaskitem.findUnique({
    where: { id: '10a90757-72b4-46d2-8df3-2618bd731197' },
  })
  if (!item || item.isPublished) {
    console.log('skip pending')
    await p.$disconnect()
    return
  }
  const preview = item.previewDataJson || {}
  const black = '/api/uploads/2026/09/13/abfce234-33b8-4ce4-8082-2a59d9b03c9a.jpg'
  const white = '/api/uploads/2026/09/13/f5514b62-0b42-4878-bf25-161928578c80.jpg'
  const spec = '19*4*12cm'
  const cost = Number(item.costPrice) || 0
  const price = Number(item.cnyPriceMin) || cost
  const colors = [
    { label: '黑色', imageUrl: black },
    { label: '白色', imageUrl: white },
  ]
  const skuTable = colors.map((color, index) => ({
    skuKey: `sku-${index + 1}`,
    spec: `${color.label} / ${spec}`,
    costPrice: cost,
    price,
    stock: Number(item.availableStock) || 0,
    weightGrams: item.weightGrams,
    imageUrl: color.imageUrl,
    attributes: [
      { name: '颜色', value: color.label },
      { name: '规格', value: spec },
    ],
  }))
  await p.importtaskitem.update({
    where: { id: item.id },
    data: {
      skuSummaryText: skuTable.map((row) => row.spec).join(' | '),
      specSummaryJson: [
        { name: '颜色', values: ['黑色', '白色'] },
        { name: '规格', values: [spec] },
      ],
      previewDataJson: {
        ...preview,
        colors,
        sizesByColor: { 黑色: [spec], 白色: [spec] },
        skuTable,
      },
    },
  })
  console.log('pending restored 黑色/白色')
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
