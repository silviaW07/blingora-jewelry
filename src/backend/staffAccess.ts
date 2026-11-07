import prisma from '@/tools/prisma'
import { authStorage, ForbiddenError, UnauthorizedError } from '@/backend/action_utils'

export const STAFF_PERMISSION_OPTIONS = [
  { key: 'dashboard', label: '管理概览' },
  { key: 'products', label: '商品管理' },
  { key: 'cost', label: '成本价和供应商' },
  { key: 'categories', label: '分类管理' },
  { key: 'customers', label: '客户管理' },
  { key: 'followup', label: '客户跟进' },
  { key: 'orders', label: '订单管理' },
  { key: 'banners', label: 'Banner轮播图管理' },
  { key: 'buyershow', label: '买家秀管理' },
  { key: 'recommend', label: '首页推荐专区管理' },
  { key: 'shipping', label: '物流渠道配置' },
  { key: 'pricing', label: '促销活动管理' },
  { key: 'brandalias', label: '品牌别名管理' },
] as const

export type StaffPermission = (typeof STAFF_PERMISSION_OPTIONS)[number]['key']

const PERMISSION_KEYS = new Set<string>(STAFF_PERMISSION_OPTIONS.map((item) => item.key))

/** 未单独保存权限的子账号只能看订单和商品，看不到成本和客户资料。 */
export const DEFAULT_SUB_PERMISSIONS: StaffPermission[] = ['orders', 'products']

export function normalizeStaffPermissions(raw: unknown): StaffPermission[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SUB_PERMISSIONS]
  const next = raw.map((item) => String(item || '').trim()).filter((item): item is StaffPermission => PERMISSION_KEYS.has(item))
  return [...new Set(next)]
}

export function permissionsFromPreferences(raw: unknown): StaffPermission[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [...DEFAULT_SUB_PERMISSIONS]
  const stored = (raw as { staffPermissions?: unknown }).staffPermissions
  if (!Array.isArray(stored)) return [...DEFAULT_SUB_PERMISSIONS]
  return normalizeStaffPermissions(stored)
}

export async function readStaffPermissions(userId: string): Promise<StaffPermission[]> {
  const row = await prisma.sysuser.findUnique({
    where: { id: userId },
    select: { role: true, savedPreferencesJson: true },
  })
  if (!row || row.role !== 'SUB_ADMIN') return STAFF_PERMISSION_OPTIONS.map((item) => item.key)
  return permissionsFromPreferences(row.savedPreferencesJson)
}

export async function writeStaffPermissions(userId: string, permissions: StaffPermission[]) {
  const row = await prisma.sysuser.findUnique({
    where: { id: userId },
    select: { savedPreferencesJson: true },
  })
  const base = row?.savedPreferencesJson && typeof row.savedPreferencesJson === 'object' && !Array.isArray(row.savedPreferencesJson)
    ? row.savedPreferencesJson as Record<string, unknown>
    : {}
  await prisma.sysuser.update({
    where: { id: userId },
    data: { savedPreferencesJson: { ...base, staffPermissions: permissions } },
  })
}

/** 主管理员始终放行。子账号必须勾选了对应权限。 */
export function requireStaff(permission: StaffPermission) {
  return <TArgs extends any[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>) => {
    return async (...args: TArgs): Promise<TReturn> => {
      const ctx = authStorage.getStore() as { userId?: string; role?: string } | undefined
      if (!ctx?.userId) throw new UnauthorizedError('请先登录')
      if (ctx.role === 'ADMIN') return fn(...args)
      if (ctx.role !== 'SUB_ADMIN') throw new ForbiddenError('权限不足，无法执行此操作')
      const permissions = await readStaffPermissions(ctx.userId)
      if (!permissions.includes(permission)) throw new ForbiddenError('没有权限查看这部分数据')
      return fn(...args)
    }
  }
}

export async function staffMustHide(permission: StaffPermission): Promise<boolean> {
  const ctx = authStorage.getStore() as { userId?: string; role?: string } | undefined
  if (!ctx?.userId || ctx.role !== 'SUB_ADMIN') return false
  const permissions = await readStaffPermissions(ctx.userId)
  return !permissions.includes(permission)
}
