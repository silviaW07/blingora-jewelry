import { PrismaClient } from '../prisma-generated/client/index.js'

const prisma = new PrismaClient()
const codes = process.argv.slice(2)
if (codes.length === 0) {
  console.error('usage: node scripts/tmp-inspect-sku.mjs CODE...')
  process.exit(1)
}

const products = await prisma.product.findMany({
  where: { productCode: { in: codes } },
  select: {
    productCode: true,
    name: true,
    skus: { select: { skuCode: true, sizeLabel: true, attributeJson: true } },
  },
})
console.log(JSON.stringify(products, null, 2))
await prisma.$disconnect()
