/**
 * One-off: TABLE_IMPORT products whose every SKU stock is exactly 1
 * (bug: table merge hardcoded stock:1 → list "可用库存" = SKU count).
 * Sets each such SKU to 1000 and IN_STOCK.
 *
 * Usage: node scripts/fix-table-import-stock-1.mjs [--dry-run]
 */
import { PrismaClient } from '../prisma-generated/client/index.js'

const DEFAULT_STOCK = 1000
const dryRun = process.argv.includes('--dry-run')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    where: { source: 'TABLE_IMPORT' },
    select: {
      id: true,
      productCode: true,
      name: true,
      skus: { select: { id: true, stock: true } },
    },
  })

  const targets = products.filter(
    (p) => p.skus.length > 0 && p.skus.every((s) => s.stock === 1),
  )

  console.log(
    `TABLE_IMPORT products: ${products.length}; all-SKU-stock=1: ${targets.length}` +
      (dryRun ? ' (dry-run)' : ''),
  )

  let skuUpdated = 0
  for (const p of targets) {
    console.log(`- ${p.productCode || p.id}  ${p.name?.slice(0, 60) || ''}  skus=${p.skus.length}`)
    if (dryRun) continue
    const result = await prisma.productsku.updateMany({
      where: { productId: p.id, stock: 1 },
      data: { stock: DEFAULT_STOCK, stockStatus: 'IN_STOCK' },
    })
    skuUpdated += result.count
  }

  if (!dryRun) console.log(`Updated SKU rows: ${skuUpdated}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
