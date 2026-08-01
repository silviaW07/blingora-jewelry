/**
 * Clear legacy L2 category priceCoefficient=1 → null so child-first pricing
 * can inherit the L1 parent coefficient.
 *
 * Background: older data seeded every category with 1. After L1 coeffs were
 * customized (e.g. Shoes=2), L2 rows still at 1 blocked inheritance because
 * resolveCategoryPriceCoefficient treats any own > 0 as set.
 *
 * New L2 creates already leave priceCoefficient null (inherit). This backfill
 * only touches level=2 rows whose stored coefficient is exactly 1.
 *
 * Run:
 *   node scripts/clear-l2-default-price-coefficients.mjs
 *   DATABASE_URL="mysql://..." node scripts/clear-l2-default-price-coefficients.mjs
 */

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../prisma-generated/client')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893'

const url = /[?&]charset=/i.test(DATABASE_URL)
  ? DATABASE_URL
  : DATABASE_URL.includes('?')
    ? `${DATABASE_URL}&charset=utf8mb4`
    : `${DATABASE_URL}?charset=utf8mb4`

const prisma = new PrismaClient({ datasources: { db: { url } } })

async function main() {
  const targets = await prisma.category.findMany({
    where: {
      level: 2,
      priceCoefficient: 1,
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      priceCoefficient: true,
      parent: { select: { name: true, priceCoefficient: true } },
    },
  })

  console.log(`Found ${targets.length} L2 categories with priceCoefficient=1`)
  for (const row of targets.slice(0, 15)) {
    const parentCoeff =
      row.parent?.priceCoefficient == null ? null : Number(row.parent.priceCoefficient)
    console.log(
      `  - ${row.name} (own=1) → null; parent=${row.parent?.name || '?'} coeff=${parentCoeff}`,
    )
  }
  if (targets.length > 15) console.log(`  ... and ${targets.length - 15} more`)

  if (targets.length === 0) {
    console.log('Nothing to update.')
    return
  }

  const result = await prisma.category.updateMany({
    where: {
      level: 2,
      priceCoefficient: 1,
    },
    data: {
      priceCoefficient: null,
    },
  })

  console.log(`Updated ${result.count} rows (priceCoefficient 1 → null)`)

  const slippers = await prisma.category.findFirst({
    where: { name: 'Slippers & Sandals' },
    select: {
      id: true,
      name: true,
      level: true,
      priceCoefficient: true,
      parent: { select: { name: true, priceCoefficient: true } },
    },
  })
  console.log(
    'Verify Slippers & Sandals:',
    JSON.stringify(
      slippers,
      (_, v) => (typeof v === 'object' && v !== null && typeof v.toNumber === 'function' ? v.toNumber() : v),
      2,
    ),
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
