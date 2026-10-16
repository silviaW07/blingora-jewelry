const path = require('path')
const repoRoot = path.resolve(__dirname, '..')
process.chdir(repoRoot)
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
require('tsconfig-paths/register')

async function main() {
  const { PrismaClient } = require(path.join(repoRoot, 'prisma-generated/client'))
  const prisma = new PrismaClient()
  const codes = ['EARR2026090045', 'JEWE2026090123']
  for (const productCode of codes) {
    const product = await prisma.product.findUnique({
      where: { productCode },
      select: {
        id: true,
        name: true,
        productCode: true,
        slug: true,
        source: true,
        tradeInfoJson: true,
        skus: {
          orderBy: { createdAt: 'asc' },
          select: { skuCode: true, imageUrl: true, sizeLabel: true, attributeJson: true },
        },
      },
    })
    const pending = product
      ? await prisma.importtaskitem.findFirst({
          where: { importedProductId: product.id },
          select: { sourceUrl: true, skuSummaryText: true, previewDataJson: true },
        })
      : null
    const preview = pending?.previewDataJson || {}
    console.log(JSON.stringify({
      productCode,
      slug: product?.slug,
      id: product?.id,
      sourceUrl: product?.tradeInfoJson?.importSourceUrl || pending?.sourceUrl || null,
      skus: product?.skus,
      pendingColors: preview.colors || null,
      pendingSkuImages: (preview.skuTable || []).map((row) => ({
        spec: row.spec,
        imageUrl: row.imageUrl,
        attributes: row.attributes,
      })),
    }, null, 2))
  }
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
