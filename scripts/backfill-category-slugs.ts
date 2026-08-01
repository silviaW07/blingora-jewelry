/**
 * One-shot: backfill category.slug for rows with null/empty slug.
 */
const { PrismaClient } = require('../prisma-generated/client')
const {
  ensureUniqueCategorySlug,
  slugifyCategoryName,
} = require('../src/shared/categorySlug.ts')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893'

async function main() {
  const url = /[?&]charset=/i.test(DATABASE_URL)
    ? DATABASE_URL
    : DATABASE_URL.includes('?')
      ? `${DATABASE_URL}&charset=utf8mb4`
      : `${DATABASE_URL}?charset=utf8mb4`

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  })

  try {
    await prisma.$executeRawUnsafe('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')

    const empty = await prisma.category.findMany({
      where: { OR: [{ slug: null }, { slug: '' }] },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    })

    console.log(`empty_count=${empty.length}`)

    const reserved = new Set()
    for (const c of empty) {
      const base = slugifyCategoryName(c.name)
      const slug = await ensureUniqueCategorySlug(prisma, base, {
        excludeId: c.id,
        reserved,
      })
      await prisma.category.update({
        where: { id: c.id },
        data: { slug },
      })
      console.log(`updated id=${c.id} name=${JSON.stringify(c.name)} slug=${slug}`)
    }

    const slippers = await prisma.category.findMany({
      where: { name: 'Slippers & Sandals' },
      select: { id: true, name: true, slug: true },
    })
    console.log('slippers=', JSON.stringify(slippers, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
