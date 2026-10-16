const { PrismaClient } = require('../prisma-generated/client')

async function main() {
  const prisma = new PrismaClient()
  const t0 = Date.now()
  const n = await prisma.product.count({ where: { status: { in: ['ACTIVE', 'DRAFT'] } } })
  console.log(JSON.stringify({ step: 'count', n, ms: Date.now() - t0 }))
  const t1 = Date.now()
  const rows = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    take: 30,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, productCode: true },
  })
  console.log(JSON.stringify({ step: 'list30', n: rows.length, ms: Date.now() - t1 }))
  const t2 = Date.now()
  const pending = await prisma.importtaskitem.count({ where: { isPublished: false } })
  console.log(JSON.stringify({ step: 'pending', n: pending, ms: Date.now() - t2 }))
  const t3 = Date.now()
  const running = await prisma.importtaskitem.count({ where: { fetchStatus: 'RUNNING' } })
  console.log(JSON.stringify({ step: 'runningParse', n: running, ms: Date.now() - t3 }))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
