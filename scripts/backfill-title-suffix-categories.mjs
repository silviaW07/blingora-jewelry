/**
 * 全库按标题后缀补挂 high quality / stainless steel / below13usd 等关联类目。
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/backfill-title-suffix-categories.mjs
 *   npx tsx scripts/backfill-title-suffix-categories.mjs --dry-run
 */
import { PrismaClient } from '../prisma-generated/client/index.js'
import { runBulkTitleFilterCategoryBackfill } from '../src/backend/lib/bulkTitleCategoryBackfill.ts'

const url =
  process.env.DATABASE_URL ||
  'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893?charset=utf8mb4'

const client = new PrismaClient({
  datasources: { db: { url } },
})

// bulkTitleCategoryBackfill 使用 @/tools/prisma 代理，脚本里注入直连客户端
globalThis.__runtimePrisma = client

const dryRun = process.argv.includes('--dry-run')

try {
  const summary = await runBulkTitleFilterCategoryBackfill({ dryRun })
  console.log(JSON.stringify({ dryRun, ...summary }, null, 2))
} finally {
  await client.$disconnect()
}
