/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')
const repoRoot = path.resolve(__dirname, '..')
process.chdir(repoRoot)
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
require('tsconfig-paths/register')

try {
  require('dotenv').config({ path: path.join(repoRoot, '.env') })
} catch {
  // ignore
}

const TARGETS = [
  { code: 'EARR2026090045', url: 'https://detail.1688.com/offer/1053930216406.html' },
  { code: 'JEWE2026090123', url: 'https://detail.1688.com/offer/1046933781059.html' },
]

function colorOf(attrs) {
  const hit = (Array.isArray(attrs) ? attrs : []).find((attr) =>
    /颜色|colour|color/i.test(String(attr?.name || '')),
  )
  return String(hit?.value || '').trim()
}

async function main() {
  const { fetchOneBound1688Preview } = require(path.join(repoRoot, 'src/backend/onebound1688.ts'))
  const { PrismaClient } = require(path.join(repoRoot, 'prisma-generated/client'))
  const prisma = new PrismaClient()
  const report = []
  for (const target of TARGETS) {
    const result = await fetchOneBound1688Preview(target.url)
    const colors = new Map()
    if (result.kind === 'parsed') {
      for (const row of result.preview.colors || []) {
        if (row.label && row.imageUrl) colors.set(String(row.label).trim(), String(row.imageUrl).trim())
      }
      for (const row of result.preview.skuTable || []) {
        const color = colorOf(row.attributes)
        const url = String(row.imageUrl || '').trim()
        if (color && url && !colors.has(color)) colors.set(color, url)
      }
    }
    const product = await prisma.product.findUnique({
      where: { productCode: target.code },
      select: {
        id: true,
        skus: { select: { id: true, imageUrl: true, attributeJson: true } },
      },
    })
    const updates = []
    for (const sku of product?.skus || []) {
      const color = colorOf(sku.attributeJson)
      const url = colors.get(color) || ''
      if (!url || sku.imageUrl === url) continue
      await prisma.productsku.update({
        where: { id: sku.id },
        data: { imageUrl: url },
      })
      updates.push({ color, url })
    }
    report.push({
      code: target.code,
      kind: result.kind,
      reason: result.kind === 'parsed' ? undefined : result.reason,
      officialColors: Object.fromEntries(colors),
      updates,
    })
  }
  console.log(JSON.stringify(report, null, 2))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
