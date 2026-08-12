/**
 * 全库批量：按标题后缀补挂品质/材质/below13/below3 等关联类目（不改主类目）。
 */
import prisma from '@/tools/prisma'
import { DEFAULT_BRAND_ALIASES, type BrandAliasRule } from '@/backend/lib/brandAlias'
import { syncProductPriceThresholdRelations } from '@/backend/lib/priceThresholdAutoClassify'
import { applyBrandAliases } from '@/shared/brandTitleNormalize'
import { isAttributeOrFilterCategory } from '@/shared/categoryMatchGuards'
import { expandCategoryIdsWithParents, loadFilterCategoriesFromDb, matchFilterCategoriesByTitle } from '@/shared/categoryFilterTitleMatch'
import {
  buildCategoryMatchCorpus,
  loadAutoMatchSecondaryCategories,
  matchSecondaryCategoriesByTitle,
} from '@/backend/actions/ImportFrom1688'

type PendingPreviewJson = {
  name?: string
  categoryId?: string
  shortDescription?: string
  matchedCategoryIds?: string[]
  matchedCategoryNames?: string[]
  categoryCalibrated?: boolean
}

export type BulkTitleFilterBackfillSummary = {
  products_scanned: number
  products_updated: number
  relations_added: number
  pending_scanned: number
  pending_updated: number
}

function pickTitleFilterHits(
  title: string,
  detailText: string | null | undefined,
  secondaryCategories: Awaited<ReturnType<typeof loadAutoMatchSecondaryCategories>>,
  filterCategories: Awaited<ReturnType<typeof loadFilterCategoriesFromDb>>,
) {
  const corpus = buildCategoryMatchCorpus(title, detailText)
  const fromMatcher = matchSecondaryCategoriesByTitle(title, secondaryCategories, detailText)
    .filter((hit) => isAttributeOrFilterCategory({ name: hit.name, parentName: hit.parentName }))
  const fromFilter = matchFilterCategoriesByTitle(title, filterCategories, detailText)
  const byId = new Map<string, { id: string; name: string }>()
  for (const hit of fromMatcher) {
    byId.set(hit.id, { id: hit.id, name: hit.name })
  }
  for (const hit of fromFilter) {
    byId.set(hit.id, { id: hit.id, name: hit.name })
  }
  if (!byId.size && corpus) {
    // 标题 glued 后缀兜底：BOXhigh quality → HIGHQUALITY
    for (const hit of fromFilter) {
      byId.set(hit.id, { id: hit.id, name: hit.name })
    }
  }
  return Array.from(byId.values())
}

async function loadBrandRules(): Promise<BrandAliasRule[]> {
  try {
    const rows = await prisma.brandalias.findMany({
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
      select: { alias: true, standardName: true },
    })
    return rows.length
      ? rows.map((row) => ({ alias: row.alias, standard: row.standardName }))
      : DEFAULT_BRAND_ALIASES
  } catch {
    return DEFAULT_BRAND_ALIASES
  }
}

/** 已上架/草稿/下架商品：仅追加标题命中的筛选标签 */
export async function backfillTitleFilterCategoriesForAllProducts(options?: {
  dryRun?: boolean
  batchSize?: number
}): Promise<Pick<BulkTitleFilterBackfillSummary, 'products_scanned' | 'products_updated' | 'relations_added'>> {
  const dryRun = Boolean(options?.dryRun)
  const batchSize = Math.max(20, Math.min(500, options?.batchSize ?? 100))

  const [filterCategories, secondaryCategories, brandRules] = await Promise.all([
    loadFilterCategoriesFromDb(prisma),
    loadAutoMatchSecondaryCategories(prisma),
    loadBrandRules(),
  ])

  let productsScanned = 0
  let productsUpdated = 0
  let relationsAdded = 0
  let cursor: string | undefined

  for (;;) {
    const rows = await prisma.product.findMany({
      where: { status: { in: ['ACTIVE', 'DRAFT', 'INACTIVE'] } },
      select: {
        id: true,
        name: true,
        detailText: true,
        shortDescription: true,
        categoryId: true,
        relationCategories: { select: { categoryId: true } },
      },
      orderBy: { id: 'asc' },
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (!rows.length) break
    cursor = rows[rows.length - 1]?.id

    for (const product of rows) {
      productsScanned += 1
      const nameBefore = String(product.name || '').trim()
      if (!nameBefore) continue

      const effectiveName = applyBrandAliases(nameBefore, brandRules) || nameBefore
      const detailText = [product.detailText, product.shortDescription].filter(Boolean).join('\n') || null
      const hits = pickTitleFilterHits(effectiveName, detailText, secondaryCategories, filterCategories)
      if (!hits.length) {
        if (!dryRun) {
          await syncProductPriceThresholdRelations(prisma, product.id).catch(() => undefined)
        }
        continue
      }

      const expanded = await expandCategoryIdsWithParents(
        prisma,
        hits.map((h) => h.id),
      )
      const existing = new Set(
        [product.categoryId, ...product.relationCategories.map((r) => r.categoryId)].filter(Boolean),
      )
      const toAdd = expanded.filter((id) => id && !existing.has(id))
      if (!toAdd.length) {
        if (!dryRun) {
          await syncProductPriceThresholdRelations(prisma, product.id).catch(() => undefined)
        }
        continue
      }

      if (!dryRun) {
        await prisma.product_category_relations.createMany({
          data: toAdd.map((categoryId) => ({ productId: product.id, categoryId })),
          skipDuplicates: true,
        })
        await syncProductPriceThresholdRelations(prisma, product.id).catch(() => undefined)
      }

      productsUpdated += 1
      relationsAdded += toAdd.length
    }

    if (rows.length < batchSize) break
  }

  return {
    products_scanned: productsScanned,
    products_updated: productsUpdated,
    relations_added: relationsAdded,
  }
}

/** 待上传区：把标题命中的筛选标签并入 preview.matchedCategoryIds */
export async function backfillTitleFilterCategoriesForPendingImports(options?: {
  dryRun?: boolean
  batchSize?: number
}): Promise<Pick<BulkTitleFilterBackfillSummary, 'pending_scanned' | 'pending_updated'>> {
  const dryRun = Boolean(options?.dryRun)
  const batchSize = Math.max(20, Math.min(500, options?.batchSize ?? 100))

  const [filterCategories, secondaryCategories, brandRules] = await Promise.all([
    loadFilterCategoriesFromDb(prisma),
    loadAutoMatchSecondaryCategories(prisma),
    loadBrandRules(),
  ])

  let pendingScanned = 0
  let pendingUpdated = 0
  let cursor: string | undefined

  for (;;) {
    const rows = await prisma.importtaskitem.findMany({
      where: { isPublished: false, fetchStatus: 'COMPLETED' as any },
      select: {
        id: true,
        parsedName: true,
        productDetail: true,
        targetCategoryId: true,
        previewDataJson: true,
      },
      orderBy: { id: 'asc' },
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    if (!rows.length) break
    cursor = rows[rows.length - 1]?.id

    for (const row of rows) {
      pendingScanned += 1
      const preview = ((row.previewDataJson || {}) as PendingPreviewJson) || {}
      const nameBefore = String(row.parsedName || preview.name || '').trim()
      if (!nameBefore) continue

      const effectiveName = applyBrandAliases(nameBefore, brandRules) || nameBefore
      const detailText = [row.productDetail, preview.shortDescription].filter(Boolean).join('\n') || null
      const hits = pickTitleFilterHits(effectiveName, detailText, secondaryCategories, filterCategories)
      if (!hits.length) continue

      const mergedRaw = Array.from(
        new Set(
          [
            row.targetCategoryId,
            preview.categoryId,
            ...(preview.matchedCategoryIds || []),
            ...hits.map((h) => h.id),
          ]
            .map((id) => String(id || '').trim())
            .filter(Boolean),
        ),
      )
      const mergedIds = await expandCategoryIdsWithParents(prisma, mergedRaw)
      const mergedNames = Array.from(
        new Set([...(preview.matchedCategoryNames || []), ...hits.map((h) => h.name)].filter(Boolean)),
      )

      const prevIds = (preview.matchedCategoryIds || []).slice().sort().join(',')
      const nextIds = mergedIds.slice().sort().join(',')
      if (prevIds === nextIds) continue

      if (!dryRun) {
        await prisma.importtaskitem.update({
          where: { id: row.id },
          data: {
            previewDataJson: {
              ...preview,
              name: effectiveName,
              matchedCategoryIds: mergedIds,
              matchedCategoryNames: mergedNames,
              categoryCalibrated: true,
            } as any,
          },
        })
      }
      pendingUpdated += 1
    }

    if (rows.length < batchSize) break
  }

  return {
    pending_scanned: pendingScanned,
    pending_updated: pendingUpdated,
  }
}

export async function runBulkTitleFilterCategoryBackfill(options?: {
  dryRun?: boolean
}): Promise<BulkTitleFilterBackfillSummary> {
  const productStats = await backfillTitleFilterCategoriesForAllProducts(options)
  const pendingStats = await backfillTitleFilterCategoriesForPendingImports(options)
  return {
    ...productStats,
    ...pendingStats,
  }
}
