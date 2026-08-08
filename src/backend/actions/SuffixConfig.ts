'use server'

import prisma from '@/tools/prisma'
import { requireRole, UserRole, withResult } from '@/backend/action_utils'

export interface SuffixConfigItem {
  id: string
  suffix_name: string
  sort_weight: number
}

export interface CreateSuffixConfigInput {
  suffix_name: string
}

export interface UpdateSuffixConfigInput {
  id: string
  suffix_name: string
}

export interface DeleteSuffixConfigInput {
  id: string
}

export interface SuffixConfigMutationOutput {
  success: boolean
}

/** 首次访问且表为空时，把原下拉框的固定后缀落库，保证行为不回退。 */
const DEFAULT_SUFFIX_PRESETS: Array<{ name: string; weight: number }> = [
  { name: '[13USD]', weight: 50 },
  { name: '[3USD]', weight: 40 },
  { name: '[清仓]', weight: 30 },
  { name: '[特价]', weight: 20 },
  { name: '[新品]', weight: 10 },
]

const normalizeSuffixName = (raw: unknown): string => String(raw ?? '').trim()

const toItem = (row: {
  id: string
  suffixName: string
  sortWeight: number
}): SuffixConfigItem => ({
  id: row.id,
  suffix_name: row.suffixName,
  sort_weight: row.sortWeight,
})

/** GET：获取所有后缀（按权重倒序、创建时间正序）。 */
export const listSuffixConfigs = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (): Promise<SuffixConfigItem[]> => {
    const count = await prisma.suffixconfig.count()
    if (count === 0) {
      await prisma.suffixconfig.createMany({
        data: DEFAULT_SUFFIX_PRESETS.map(preset => ({
          suffixName: preset.name,
          sortWeight: preset.weight,
        })),
        skipDuplicates: true,
      })
    }
    const rows = await prisma.suffixconfig.findMany({
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, suffixName: true, sortWeight: true },
    })
    return rows.map(toItem)
  })
)

/** POST：新增后缀。 */
export const createSuffixConfig = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: CreateSuffixConfigInput): Promise<SuffixConfigItem> => {
    const suffixName = normalizeSuffixName(input?.suffix_name)
    if (!suffixName) throw new Error('后缀内容不能为空')
    if (suffixName.length > 120) throw new Error('后缀内容长度不能超过 120 个字符')

    const exists = await prisma.suffixconfig.findUnique({ where: { suffixName } })
    if (exists) throw new Error('该后缀已存在')

    const created = await prisma.suffixconfig.create({
      data: { suffixName },
      select: { id: true, suffixName: true, sortWeight: true },
    })
    return toItem(created)
  })
)

/** PUT：修改后缀。 */
export const updateSuffixConfig = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: UpdateSuffixConfigInput): Promise<SuffixConfigItem> => {
    const id = String(input?.id || '').trim()
    if (!id) throw new Error('缺少后缀 ID')
    const suffixName = normalizeSuffixName(input?.suffix_name)
    if (!suffixName) throw new Error('后缀内容不能为空')
    if (suffixName.length > 120) throw new Error('后缀内容长度不能超过 120 个字符')

    const current = await prisma.suffixconfig.findUnique({ where: { id } })
    if (!current) throw new Error('后缀不存在或已被删除')

    const duplicate = await prisma.suffixconfig.findUnique({ where: { suffixName } })
    if (duplicate && duplicate.id !== id) throw new Error('该后缀已存在')

    const updated = await prisma.suffixconfig.update({
      where: { id },
      data: { suffixName },
      select: { id: true, suffixName: true, sortWeight: true },
    })
    return toItem(updated)
  })
)

/** DELETE：删除后缀。 */
export const deleteSuffixConfig = requireRole([UserRole.ADMIN, UserRole.SUB_ADMIN])(
  withResult(async (input: DeleteSuffixConfigInput): Promise<SuffixConfigMutationOutput> => {
    const id = String(input?.id || '').trim()
    if (!id) throw new Error('缺少后缀 ID')
    const current = await prisma.suffixconfig.findUnique({ where: { id } })
    if (!current) throw new Error('后缀不存在或已被删除')
    await prisma.suffixconfig.delete({ where: { id } })
    return { success: true }
  })
)
