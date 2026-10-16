const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')

function isColorNameSpecValue(value) {
  const text = String(value || '').trim().replace(/\s+/g, '').replace(/副本\d*$/u, '')
  if (!text) return false
  if (/格子|樱桃|棋盘|千鸟/.test(text)) return true
  return /色$/.test(text) && /白|黑|米|棕|红|粉|绿|蓝|银|金|灰|咖啡|卡其|杏|橘|橙|紫|黄|裸/.test(text)
}

const p = new PrismaClient()
;(async () => {
  const products = await p.product.findMany({
    where: { productCode: { in: ['HAND2026090105', 'HAND2026090104'] } },
    include: { skus: true },
  })
  for (const product of products) {
    for (const sku of product.skus) {
      const attrs = Array.isArray(sku.attributeJson) ? sku.attributeJson : []
      const nextAttrs = attrs.filter((attr) => {
        const name = String(attr.name || '').trim()
        if (!['规格', '尺码', '尺寸'].includes(name)) return true
        return !isColorNameSpecValue(attr.value)
      })
      const sizeLabel = isColorNameSpecValue(sku.sizeLabel) ? null : sku.sizeLabel
      await p.productsku.update({
        where: { id: sku.id },
        data: {
          attributeJson: nextAttrs,
          sizeLabel,
        },
      })
      console.log(product.productCode, sku.skuCode, JSON.stringify(nextAttrs), sizeLabel)
    }
    const params = Array.isArray(product.parameterJson) ? product.parameterJson : []
    const nextParams = params
      .map((group) => ({
        ...group,
        items: (group.items || []).filter(
          (item) => !(String(item.key || '').includes('尺寸') && isColorNameSpecValue(item.value)),
        ),
      }))
      .filter((group) => (group.items || []).length)
    await p.product.update({
      where: { id: product.id },
      data: {
        parameterJson: nextParams.length ? nextParams : [],
        ...(product.productCode === 'HAND2026090105'
          ? { status: 'ACTIVE', goodsStatus: 'ACTIVE' }
          : {}),
      },
    })
    console.log('product updated', product.productCode, product.status, 'params', JSON.stringify(nextParams))
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
