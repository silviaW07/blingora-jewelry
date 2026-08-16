'use server'

import prisma from '@/tools/prisma'
import { requireRole, UserRole, withResult } from '@/backend/action_utils'
import { invalidateBrandAliasCache, DEFAULT_BRAND_ALIASES } from '@/backend/lib/brandAlias'

export interface BrandAliasItem {
  id: string
  alias: string
  standard_name: string
  sort_weight: number
}

export interface CreateBrandAliasInput {
  alias: string
  standard_name: string
}

export interface UpdateBrandAliasInput {
  id: string
  alias: string
  standard_name: string
}

export interface DeleteBrandAliasInput {
  id: string
}

export interface BrandAliasMutationOutput {
  success: boolean
}

/** 首次访问且表为空时预置默认映射，保证行为不回退。 */
const DEFAULT_BRAND_ALIAS_PRESETS: Array<{ alias: string; standard: string; weight: number }> =
  DEFAULT_BRAND_ALIASES.map(rule => ({
    alias: rule.alias,
    standard: rule.standard,
    weight: Math.max(10, String(rule.alias).length * 10),
  }))

const normalizeAliasText = (raw: unknown): string => String(raw ?? '').trim()

const toItem = (row: {
  id: string
  alias: string
  standardName: string
  sortWeight: number
}): BrandAliasItem => ({
  id: row.id,
  alias: row.alias,
  standard_name: row.standardName,
  sort_weight: row.sortWeight,
})

/** GET：获取所有品牌别名（按权重倒序、创建时间正序）。 */
export const listBrandAliases = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (): Promise<BrandAliasItem[]> => {
    const count = await prisma.brandalias.count()
    if (count === 0) {
      await prisma.brandalias.createMany({
        data: DEFAULT_BRAND_ALIAS_PRESETS.map(preset => ({
          alias: preset.alias,
          standardName: preset.standard,
          sortWeight: preset.weight,
        })),
        skipDuplicates: true,
      })
      invalidateBrandAliasCache()
    } else {
      const existing = await prisma.brandalias.findMany({ select: { alias: true } })
      const have = new Set(existing.map(row => String(row.alias || '').trim().toLowerCase()))
      const missing = DEFAULT_BRAND_ALIAS_PRESETS.filter(
        preset => !have.has(String(preset.alias).trim().toLowerCase()),
      )
      if (missing.length > 0) {
        await prisma.brandalias.createMany({
          data: missing.map(preset => ({
            alias: preset.alias,
            standardName: preset.standard,
            sortWeight: preset.weight,
          })),
          skipDuplicates: true,
        })
        invalidateBrandAliasCache()
      }
    }
    const rows = await prisma.brandalias.findMany({
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, alias: true, standardName: true, sortWeight: true },
    })
    return rows.map(toItem)
  })
)

/** POST：新增品牌别名。 */
export const createBrandAlias = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: CreateBrandAliasInput): Promise<BrandAliasItem> => {
    const alias = normalizeAliasText(input?.alias)
    const standardName = normalizeAliasText(input?.standard_name)
    if (!alias) throw new Error('原始别名不能为空')
    if (!standardName) throw new Error('目标品牌名不能为空')
    if (alias.length > 120 || standardName.length > 120) {
      throw new Error('别名/品牌名长度不能超过 120 个字符')
    }

    const exists = await prisma.brandalias.findUnique({ where: { alias } })
    if (exists) throw new Error('该别名已存在')

    const created = await prisma.brandalias.create({
      data: { alias, standardName },
      select: { id: true, alias: true, standardName: true, sortWeight: true },
    })
    invalidateBrandAliasCache()
    return toItem(created)
  })
)

/** PUT：修改品牌别名。 */
export const updateBrandAlias = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: UpdateBrandAliasInput): Promise<BrandAliasItem> => {
    const id = String(input?.id || '').trim()
    if (!id) throw new Error('缺少别名 ID')
    const alias = normalizeAliasText(input?.alias)
    const standardName = normalizeAliasText(input?.standard_name)
    if (!alias) throw new Error('原始别名不能为空')
    if (!standardName) throw new Error('目标品牌名不能为空')
    if (alias.length > 120 || standardName.length > 120) {
      throw new Error('别名/品牌名长度不能超过 120 个字符')
    }

    const current = await prisma.brandalias.findUnique({ where: { id } })
    if (!current) throw new Error('别名不存在或已被删除')

    const duplicate = await prisma.brandalias.findUnique({ where: { alias } })
    if (duplicate && duplicate.id !== id) throw new Error('该别名已存在')

    const updated = await prisma.brandalias.update({
      where: { id },
      data: { alias, standardName },
      select: { id: true, alias: true, standardName: true, sortWeight: true },
    })
    invalidateBrandAliasCache()
    return toItem(updated)
  })
)

/** DELETE：删除品牌别名。 */
export const deleteBrandAlias = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: DeleteBrandAliasInput): Promise<BrandAliasMutationOutput> => {
    const id = String(input?.id || '').trim()
    if (!id) throw new Error('缺少别名 ID')
    const current = await prisma.brandalias.findUnique({ where: { id } })
    if (!current) throw new Error('别名不存在或已被删除')
    await prisma.brandalias.delete({ where: { id } })
    invalidateBrandAliasCache()
    return { success: true }
  })
)
