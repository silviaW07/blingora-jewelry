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
  const { isIconLikeProductImage } = require(path.join(repoRoot, 'src/backend/lib/clusterYupooColorSkus.ts'))
  const prisma = new PrismaClient()
  const marks = {}

  const t0 = Date.now()
  const count = await prisma.importtaskitem.count({
    where: { isPublished: false, importedProductId: null },
  })
  marks.countMs = Date.now() - t0

  const t1 = Date.now()
  const page = await prisma.importtaskitem.findMany({
    where: { isPublished: false, importedProductId: null },
    orderBy: { updatedAt: 'desc' },
    take: 80,
    select: {
      id: true,
      parsedName: true,
      mainImageUrl: true,
      parsedMainImageUrl: true,
      skuSummaryText: true,
      previewDataJson: true,
      fetchStatus: true,
      updatedAt: true,
    },
  })
  marks.page80Ms = Date.now() - t1
  marks.page80Rows = page.length

  const t2 = Date.now()
  const candidates = await prisma.importtaskitem.findMany({
    where: { isPublished: false, importedProductId: null },
    orderBy: { updatedAt: 'desc' },
    take: 120,
    select: { id: true, mainImageUrl: true, parsedMainImageUrl: true, previewDataJson: true },
  })
  marks.sanitizeScanMs = Date.now() - t2

  const urls = []
  for (const item of candidates) {
    const preview = item.previewDataJson || {}
    for (const url of [
      item.mainImageUrl,
      item.parsedMainImageUrl,
      ...(Array.isArray(preview.detailImages) ? preview.detailImages.slice(0, 2) : []),
    ]) {
      if (url && urls.length < 12) urls.push(String(url))
    }
  }
  const t3 = Date.now()
  let iconHits = 0
  for (const url of urls) {
    if (await isIconLikeProductImage(url)) iconHits += 1
  }
  marks.iconSampleMs = Date.now() - t3
  marks.iconSampleCount = urls.length
  marks.iconHits = iconHits

  await prisma.$disconnect()
  console.log(JSON.stringify({ pendingUnpublished: count, ...marks }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
