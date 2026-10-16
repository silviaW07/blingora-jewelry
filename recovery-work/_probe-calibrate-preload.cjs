/* eslint-disable @typescript-eslint/no-require-imports */
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
} catch {}

async function time(label, fn) {
  const started = Date.now()
  try {
    const value = await fn()
    const count = Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : 1
    console.log(JSON.stringify({ ok: true, label, ms: Date.now() - started, count }))
    return value
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      label,
      ms: Date.now() - started,
      name: error?.name,
      message: error?.message,
      code: error?.code,
    }))
    return null
  }
}

async function main() {
  const { PrismaClient } = require(path.join(repoRoot, 'prisma-generated/client'))
  const prisma = new PrismaClient()
  const { loadFilterCategoriesFromDb } = require(path.join(repoRoot, 'src/shared/categoryFilterTitleMatch.ts'))
  const { loadBrandAliasRules } = require(path.join(repoRoot, 'src/backend/lib/brandAlias.ts'))
  const { preloadPriceThresholdSyncContext } = require(path.join(repoRoot, 'src/backend/lib/priceThresholdAutoClassify.ts'))

  await time('secondary', () => prisma.category.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { level: 2 },
        { level: 1, isBrandCategory: false },
      ],
    },
    select: {
      id: true,
      name: true,
      level: true,
      brandKeywordsJson: true,
      isBrandCategory: true,
      parent: { select: { name: true, isBrandCategory: true } },
    },
    orderBy: [{ sortWeight: 'desc' }, { name: 'asc' }],
  }))
  await time('filter', () => loadFilterCategoriesFromDb(prisma))
  await time('brand', () => loadBrandAliasRules())
  await time('threshold', () => preloadPriceThresholdSyncContext(prisma))
  await time('all', () => Promise.all([
    prisma.category.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { level: 2 },
          { level: 1, isBrandCategory: false },
        ],
      },
      select: {
        id: true,
        name: true,
        level: true,
        brandKeywordsJson: true,
        isBrandCategory: true,
        parent: { select: { name: true, isBrandCategory: true } },
      },
    }),
    loadFilterCategoriesFromDb(prisma),
    loadBrandAliasRules(),
    preloadPriceThresholdSyncContext(prisma),
  ]))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
