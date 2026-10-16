const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')

function baseColorLabel(label) {
  return String(label || '').trim().replace(/-\d+$/, '')
}

function is1688(url) {
  return /1688\.com|detail\.1688/i.test(String(url || ''))
}

function colorOf(row) {
  return String((row.attributes || []).find((attr) => attr.name === '颜色')?.value || '').trim()
}

const p = new PrismaClient()

;(async () => {
  const items = await p.importtaskitem.findMany({
    where: { isPublished: false, importedProductId: null, fetchStatus: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      sourceUrl: true,
      parsedName: true,
      costPrice: true,
      cnyPriceMin: true,
      availableStock: true,
      weightGrams: true,
      skuSummaryText: true,
      previewDataJson: true,
    },
  })

  let updated = 0
  for (const item of items) {
    if (is1688(item.sourceUrl)) continue
    const preview = item.previewDataJson || {}
    const labels = Array.from(
      new Set(
        [
          ...(preview.colors || []).map((color) => String(color.label || '').trim()),
          ...(preview.skuTable || []).map((row) => colorOf(row)),
        ].filter(Boolean),
      ),
    )
    const noisy = labels.some((label) => /-\d+$/.test(label) || /^颜色/.test(label))
    const bases = labels
      .map((label) => baseColorLabel(label))
      .filter((label) => label && label !== '默认颜色' && !/^颜色/.test(label))
    const unique = Array.from(new Set(bases))
    const title = String(item.parsedName || '')
    const force =
      /Multipass|P1600|腋下托特|中古老花/i.test(title) && labels.length >= 2
    if (!force && !(noisy && unique.length === 1 && labels.length >= 2)) continue
    if (unique.length !== 1 && !force) continue
    const label = unique[0] || baseColorLabel(labels[0]) || '默认颜色'
    const hero =
      (preview.colors || []).find((color) => baseColorLabel(color.label) === label)?.imageUrl ||
      (preview.skuTable || []).find((row) => baseColorLabel(colorOf(row)) === label)?.imageUrl ||
      preview.mainImageUrl
    if (!hero) continue
    const specs = Array.from(
      new Set(
        (preview.skuTable || [])
          .flatMap((row) =>
            (row.attributes || [])
              .filter((attr) => ['规格', '尺码', '尺寸'].includes(attr.name))
              .map((attr) => String(attr.value || '').trim()),
          )
          .filter(Boolean),
      ),
    )
    const cost = Number(item.costPrice) || 0
    const price = Number(item.cnyPriceMin) || cost
    const stock = Number(item.availableStock) || 0
    const weight = item.weightGrams == null ? null : Number(item.weightGrams)
    const skuTable = []
    const sizesByColor = {}
    const variants = specs.length ? specs : [null]
    if (specs.length) sizesByColor[label] = [...specs]
    variants.forEach((spec, index) => {
      skuTable.push({
        skuKey: `sku-${index + 1}`,
        spec: spec ? `${label} / ${spec}` : label,
        costPrice: cost,
        price,
        stock,
        weightGrams: weight,
        imageUrl: hero,
        attributes: [{ name: '颜色', value: label }, ...(spec ? [{ name: '规格', value: spec }] : [])],
      })
    })
    await p.importtaskitem.update({
      where: { id: item.id },
      data: {
        skuSummaryText: [label, specs.join(' / ')].filter(Boolean).join(' · '),
        specSummaryJson: [
          { name: '颜色', values: [label] },
          ...(specs.length ? [{ name: '规格', values: specs }] : []),
        ],
        previewDataJson: {
          ...preview,
          colors: [{ label, imageUrl: hero }],
          sizesByColor,
          skuTable,
        },
      },
    })
    updated += 1
    console.log((item.parsedName || '').split('\n')[0], labels.join('/'), '=>', label, item.id)
  }
  console.log('updated', updated)
  await p.$disconnect()
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
