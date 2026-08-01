/**
 * One-shot: backfill category.slug for rows where slug is null or ''.
 *
 * Run (from repo root):
 *   node scripts/backfill-category-slugs.mjs
 *
 * Optional:
 *   DATABASE_URL="mysql://..." node scripts/backfill-category-slugs.mjs
 *
 * Slug rules match src/shared/categorySlug.ts:
 *   lowercase, strip &, non-alnum → -, uniqueness via -2, -3, ...
 *
 * SQL alternative: see scripts/backfill-category-slugs.sql
 */

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../prisma-generated/client')

const CATEGORY_SLUG_MAX_LEN = 120

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893'

function slugifyCategoryName(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) {
    return `cat-${Date.now().toString(36).slice(-8)}`
  }

  const asciiSlug = trimmed
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, CATEGORY_SLUG_MAX_LEN)

  if (asciiSlug) return asciiSlug
  return `cat-${Date.now().toString(36).slice(-8)}`
}

async function ensureUniqueCategorySlug(prisma, baseSlug, { excludeId, reserved }) {
  const normalizedBase = (baseSlug.trim() || `cat-${Date.now().toString(36).slice(-8)}`)
    .toLowerCase()
    .slice(0, CATEGORY_SLUG_MAX_LEN)

  let candidate = normalizedBase
  let n = 2
  while (n < 10_000) {
    const takenInBatch = reserved.has(candidate)
    if (!takenInBatch) {
      const existing = await prisma.category.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      })
      if (!existing) {
        reserved.add(candidate)
        return candidate
      }
    }
    const suffix = `-${n}`
    candidate = `${normalizedBase.slice(0, CATEGORY_SLUG_MAX_LEN - suffix.length)}${suffix}`
    n += 1
  }

  const fallback = `cat-${Date.now().toString(36)}`.slice(0, CATEGORY_SLUG_MAX_LEN)
  reserved.add(fallback)
  return fallback
}

async function main() {
  const url = /[?&]charset=/i.test(DATABASE_URL)
    ? DATABASE_URL
    : DATABASE_URL.includes('?')
      ? `${DATABASE_URL}&charset=utf8mb4`
      : `${DATABASE_URL}?charset=utf8mb4`

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  })

  let updated = 0
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
      const before = c.slug
      const base = slugifyCategoryName(c.name)
      const slug = await ensureUniqueCategorySlug(prisma, base, {
        excludeId: c.id,
        reserved,
      })
      await prisma.category.update({
        where: { id: c.id },
        data: { slug },
      })
      updated += 1
      console.log(
        `updated id=${c.id} name=${JSON.stringify(c.name)} before=${JSON.stringify(before)} after=${slug}`,
      )
    }

    console.log(`updated_count=${updated}`)

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
