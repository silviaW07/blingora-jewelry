/**
 * Server-side brand alias loader with in-memory cache.
 * Reads the `brand_alias` table (falls back to defaults if the table is missing
 * or empty) and exposes helpers to normalize product titles during import/publish.
 */
import prisma from '@/tools/prisma'
import { applyBrandAliases, type BrandAliasRule } from '@/shared/brandTitleNormalize'

/** 迁移未执行 / 表为空时的兜底映射（与迁移 seed 保持一致） */
export const DEFAULT_BRAND_ALIASES: BrandAliasRule[] = [
  { alias: '路易威登', standard: 'Louis Vuitton' },
  { alias: '蔻C', standard: 'Coach' },
  { alias: '蔻家', standard: 'Coach' },
  { alias: '古驰', standard: 'Gucci' },
  { alias: 'LV', standard: 'Louis Vuitton' },
]

const CACHE_TTL_MS = 60_000

let cache: { rules: BrandAliasRule[]; expiresAt: number } | null = null

/** 清空缓存（增删改后调用，让下次读取立即拿到最新映射） */
export function invalidateBrandAliasCache(): void {
  cache = null
}

/**
 * 异步读取品牌映射（带缓存）。表不存在或为空时回落到默认映射。
 * 在事务/循环外先调用一次即可预热缓存，之后可用 getBrandAliasRulesSync 同步取用。
 */
export async function loadBrandAliasRules(): Promise<BrandAliasRule[]> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.rules
  try {
    const rows = await prisma.brandalias.findMany({
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
      select: { alias: true, standardName: true },
    })
    const rules: BrandAliasRule[] = rows.length
      ? rows.map(row => ({ alias: row.alias, standard: row.standardName }))
      : DEFAULT_BRAND_ALIASES
    cache = { rules, expiresAt: now + CACHE_TTL_MS }
    return rules
  } catch {
    // 迁移尚未执行等情况：用默认映射，绝不阻断采集/上架
    return DEFAULT_BRAND_ALIASES
  }
}

/** 同步取用最近一次加载的映射（未加载过则返回默认），供同步映射器使用 */
export function getBrandAliasRulesSync(): BrandAliasRule[] {
  return cache?.rules ?? DEFAULT_BRAND_ALIASES
}

/** 异步归一化：先确保映射已加载，再应用替换 */
export async function normalizeBrandTitle(raw: string | null | undefined): Promise<string> {
  const text = String(raw ?? '')
  if (!text.trim()) return text
  const rules = await loadBrandAliasRules()
  return applyBrandAliases(text, rules)
}

/** 同步归一化：用当前缓存映射（配合已预热的缓存或默认映射） */
export function normalizeBrandTitleSync(raw: string | null | undefined): string {
  const text = String(raw ?? '')
  if (!text.trim()) return text
  return applyBrandAliases(text, getBrandAliasRulesSync())
}
