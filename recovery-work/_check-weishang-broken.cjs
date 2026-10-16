require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
require('tsconfig-paths/register')
const path = require('path')
const repoRoot = path.resolve(__dirname, '..')
process.chdir(repoRoot)
const { PrismaClient } = require(path.join(repoRoot, 'prisma-generated/client'))

async function main() {
  const prisma = new PrismaClient()
  const ids = [
    '0fe8aeb7-76f4-4537-998f-02b8c7c03924',
    '4988fce2-8714-457e-9a58-58ae7301badf',
    '9d776cb4-2d69-4b29-b59e-de8c43cc4d6a',
    'd97039a1-67f8-480d-8957-0acb682d2b57',
    'e04b9ce7-11d1-4ade-9a25-465c07290c5e',
  ]
  const saved = await prisma.importtaskitem.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      fetchStatus: true,
      parsedName: true,
      parsedMainImageUrl: true,
      skuSummaryText: true,
      failureReason: true,
    },
  })
  console.log('saved', JSON.stringify(saved.map((row) => ({
    status: row.fetchStatus,
    name: (row.parsedName || '').split('\n')[0],
    img: row.parsedMainImageUrl,
    sku: row.skuSummaryText,
  })), null, 2))

  const broken = await prisma.importtaskitem.findMany({
    where: {
      isPublished: false,
      importedProductId: null,
      OR: [
        { parsedName: { startsWith: '微商 _' } },
        { parsedName: { startsWith: '[微商]' } },
      ],
    },
    take: 20,
    orderBy: { updatedAt: 'desc' },
    select: { id: true, parsedName: true, fetchStatus: true, sourceUrl: true },
  })
  console.log('still-broken', broken.length, JSON.stringify(broken.map((row) => ({
    name: row.parsedName,
    status: row.fetchStatus,
    url: (row.sourceUrl || '').slice(0, 80),
  })), null, 2))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
