/**
 * Fix Brand SIDE_NAV orphan L2s (e.g. Miumiu):
 * - Activate L1 "Brand"
 * - Hide Brand from top CATEGORIES (navConfig.isVisible=false); Brand list is SIDE_NAV
 * - Reparent all SIDE_NAV Brand-zone L2 orphans under Brand L1
 * - Invalidate home recommend zone cache after (caller should restart RPC if needed)
 *
 * Run: node scripts/fix-brand-side-nav-parents.mjs
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../prisma-generated/client')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893?charset=utf8mb4'

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } })

const BRAND_L1_ID = '83255c2e-b010-4af7-bb6e-53062422b873'
const BRAND_ZONE_ID = '4d446d2e-4ac0-4791-b23b-3f85be4134cb'
const MIUMIU_ID = '9afdf283-34c0-4bd8-800a-33576eacd8cb'

async function main() {
  const brandL1 = await prisma.category.findUnique({
    where: { id: BRAND_L1_ID },
    select: { id: true, name: true, status: true, level: true, isBrandCategory: true },
  })
  if (!brandL1 || brandL1.level !== 1 || brandL1.name !== 'Brand') {
    throw new Error(`Expected Brand L1 at ${BRAND_L1_ID}, got ${JSON.stringify(brandL1)}`)
  }

  const zoneItems = await prisma.homeRecommendZoneItem.findMany({
    where: { zoneId: BRAND_ZONE_ID, entityType: 'SIDE_NAV' },
    select: {
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
          level: true,
          parentId: true,
          status: true,
        },
      },
    },
  })

  const orphanIds = zoneItems
    .map((item) => item.category)
    .filter((cat) => Boolean(cat) && cat.level === 2 && cat.parentId == null && cat.status === 'ACTIVE')
    .map((cat) => cat.id)

  console.log('Brand L1 before:', brandL1)
  console.log('Orphan SIDE_NAV L2 count:', orphanIds.length)
  console.log(
    'Includes Miumiu:',
    orphanIds.includes(MIUMIU_ID),
    zoneItems.find((i) => i.categoryId === MIUMIU_ID)?.category,
  )

  await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: { id: BRAND_L1_ID },
      data: {
        status: 'ACTIVE',
        isBrandCategory: false,
      },
    })

    await tx.categorynavconfig.upsert({
      where: { categoryId: BRAND_L1_ID },
      create: {
        categoryId: BRAND_L1_ID,
        navTitle: 'Brand',
        isVisible: false,
        sortWeight: 10,
      },
      update: {
        isVisible: false,
        navTitle: 'Brand',
      },
    })

    if (orphanIds.length > 0) {
      await tx.category.updateMany({
        where: { id: { in: orphanIds }, level: 2, parentId: null },
        data: { parentId: BRAND_L1_ID },
      })
    }

    // Keep Miumiu near the top of Brand SIDE_NAV (was sortWeight 10 = last row / easy to miss)
    await tx.homeRecommendZoneItem.updateMany({
      where: { zoneId: BRAND_ZONE_ID, categoryId: MIUMIU_ID },
      data: { sortWeight: 175 },
    })
  })

  const miumiu = await prisma.category.findUnique({
    where: { id: MIUMIU_ID },
    select: {
      id: true,
      name: true,
      status: true,
      level: true,
      parentId: true,
      parent: { select: { id: true, name: true, status: true } },
    },
  })
  const slippers = await prisma.category.findUnique({
    where: { id: '9ff24e7e-2024-44f0-a55c-3df733733a11' },
    select: {
      id: true,
      name: true,
      status: true,
      level: true,
      parentId: true,
      parent: { select: { id: true, name: true, status: true } },
    },
  })
  const brandAfter = await prisma.category.findUnique({
    where: { id: BRAND_L1_ID },
    select: {
      id: true,
      name: true,
      status: true,
      navConfig: { select: { isVisible: true } },
      _count: { select: { children: true } },
    },
  })

  console.log('Brand L1 after:', JSON.stringify(brandAfter, null, 2))
  console.log('Miumiu after:', JSON.stringify(miumiu, null, 2))
  console.log('Slippers (control):', JSON.stringify(slippers, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
