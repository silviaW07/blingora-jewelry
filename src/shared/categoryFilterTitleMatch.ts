/**
 * 标题 → 品质/材质/价格带筛选类目（仅关联标签，不当主类目）。
 * 独立模块，供运维脚本直连 DB，不依赖 ImportFrom1688 / RPC。
 */
import { resolveCategorySynonyms } from '@/shared/categorySynonyms'
import { canonicalizeQualityMatchText, isAttributeOrFilterCategory } from '@/shared/categoryMatchGuards'
import {
  detectShelfFamily,
  shelfFamiliesCompatible,
  type ShelfFamily,
} from '@/shared/categoryShelfFamily'
import { PRICE_THRESHOLD_RULES } from '@/backend/lib/priceThresholdAutoClassify'

const compactCatKey = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/_-]+/g, '')

const isPriceThresholdTagCategoryName = (name?: string | null) => {
  const key = compactCatKey(name)
  if (!key) return false
  return PRICE_THRESHOLD_RULES.some((rule) =>
    rule.l2NameAliases.some((alias) => compactCatKey(alias) === key),
  )
}

const normalizeToken = (value?: string | null) => canonicalizeQualityMatchText(value)

const buildTitleCorpus = (...parts: Array<string | null | undefined>) =>
  normalizeToken(parts.map((p) => String(p || '').trim()).filter(Boolean).join(' '))

export type FilterCategoryRow = {
  id: string
  name: string
  level?: number | null
  parentId?: string | null
  parentName?: string | null
}

export async function loadFilterCategoriesFromDb(tx: {
  category: { findMany: (args: any) => Promise<any[]> }
}): Promise<FilterCategoryRow[]> {
  const rows = await tx.category.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      level: true,
      parentId: true,
      parent: { select: { name: true } },
    },
  })
  return rows
    .map((row) => ({
      id: row.id,
      name: String(row.name || '').trim(),
      level: row.level,
      parentId: row.parentId,
      parentName: row.parent?.name ? String(row.parent.name).trim() : null,
    }))
    .filter(
      (row) =>
        row.name &&
        (isAttributeOrFilterCategory({ name: row.name, parentName: row.parentName }) ||
          isPriceThresholdTagCategoryName(row.name)),
    )
}

/** 标题命中品质/材质/below* 等筛选类目；包/饰品货架互不串挂 */
export function matchFilterCategoriesByTitle(
  title: string,
  categories: FilterCategoryRow[],
  detailText?: string | null,
  scopeFamily?: ShelfFamily,
): FilterCategoryRow[] {
  const corpus = buildTitleCorpus(title, detailText)
  if (!corpus) return []

  const productFamily =
    scopeFamily && scopeFamily !== 'unknown'
      ? scopeFamily
      : detectShelfFamily(title, detailText)

  const matched: FilterCategoryRow[] = []
  for (const category of categories) {
    const tagFamily = detectShelfFamily(category.name, category.parentName)
    if (!shelfFamiliesCompatible(productFamily, tagFamily)) continue

    const tokens = Array.from(
      new Set([category.name, ...resolveCategorySynonyms(category.name)].map((t) => String(t || '').trim()).filter(Boolean)),
    )
    const hit = tokens.some((token) => {
      const key = normalizeToken(token)
      return key.length >= 3 && corpus.includes(key)
    })
    if (hit) matched.push(category)
  }
  return matched
}

export async function expandCategoryIdsWithParents(
  tx: { category: { findMany: (args: any) => Promise<any[]> } },
  categoryIds: string[],
): Promise<string[]> {
  const uniqueIds = Array.from(new Set(categoryIds.filter(Boolean)))
  if (!uniqueIds.length) return []

  const categories = await tx.category.findMany({
    where: { id: { in: uniqueIds }, status: 'ACTIVE' },
    select: { id: true, level: true, parentId: true },
  })

  const result = new Set<string>()
  for (const category of categories) {
    result.add(category.id)
    if (Number(category.level) === 2 && category.parentId) {
      result.add(category.parentId)
    }
  }
  return Array.from(result)
}
