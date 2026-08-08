'use server'

// ===== Enums =====
export type AdminRole = 'ADMIN' | 'SUB_ADMIN'
export type AdminStatus = 'ACTIVE' | 'DISABLED'

// ===== Data Structures =====
export interface AdminAccountItem {
  id: string
  account: string
  username: string
  email: string
  role: AdminRole
  status: AdminStatus
  phone: string | null
  lastLoginAt: string | null
  createdAt: string
  /** 是否为当前登录管理员本人（前端据此禁用「禁用 / 删除」按钮，避免自锁） */
  isSelf: boolean
}

// ===== Input / Output =====
export interface CreateAdminInput {
  account: string
  username?: string
  email: string
  password: string
  role?: AdminRole
}

export interface UpdateAdminRoleInput {
  id: string
  role: AdminRole
}

export interface UpdateAdminStatusInput {
  id: string
  status: AdminStatus
}

export interface ResetAdminPasswordInput {
  id: string
  password: string
}

export interface DeleteAdminInput {
  id: string
}

export interface AdminMutationOutput {
  success: boolean
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  getAuthContext,
  requireRole,
  UserRole,
  withResult,
} from '@/backend/action_utils'
import { hashSecurePassword, validateAdminPassword } from '@/backend/password-security'

// ===== Helpers =====
const STAFF_ROLES: AdminRole[] = ['ADMIN', 'SUB_ADMIN']

const normalize = (raw: unknown): string => String(raw ?? '').trim()

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const toItem = (
  row: {
    id: string
    account: string
    username: string
    email: string
    role: string
    status: string
    phone: string | null
    lastLoginAt: Date | null
    createdAt: Date
  },
  currentUserId: string,
): AdminAccountItem => ({
  id: row.id,
  account: row.account,
  username: row.username,
  email: row.email,
  role: row.role as AdminRole,
  status: row.status as AdminStatus,
  phone: row.phone ?? null,
  lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
  isSelf: row.id === currentUserId,
})

const ADMIN_SELECT = {
  id: true,
  account: true,
  username: true,
  email: true,
  role: true,
  status: true,
  phone: true,
  lastLoginAt: true,
  createdAt: true,
} as const

/** 统计当前处于「激活状态的主管理员」数量，用于防止把系统唯一管理员禁用/降级/删除。 */
const countActivePrimaryAdmins = async (excludeId?: string): Promise<number> =>
  prisma.sysuser.count({
    where: {
      role: 'ADMIN',
      status: 'ACTIVE',
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

// ===== Actions（仅主管理员 ADMIN 可管理管理员账号）=====

/** GET：获取全部管理员 / 子管理员账号列表。 */
export const listAdminAccounts = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<AdminAccountItem[]> => {
    const currentUserId = getAuthContext().userId
    const rows = await prisma.sysuser.findMany({
      where: { role: { in: STAFF_ROLES } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: ADMIN_SELECT,
    })
    return rows.map(row => toItem(row, currentUserId))
  }),
)

/** POST：新增管理员 / 子管理员账号（默认子管理员）。 */
export const createAdminAccount = requireRole([UserRole.ADMIN])(
  withResult(async (input: CreateAdminInput): Promise<AdminAccountItem> => {
    const account = normalize(input?.account)
    const email = normalize(input?.email)
    const password = String(input?.password ?? '')
    const username = normalize(input?.username) || account
    const role: AdminRole = input?.role === 'ADMIN' ? 'ADMIN' : 'SUB_ADMIN'

    if (!account) throw new Error('账号不能为空')
    if (account.length > 50) throw new Error('账号长度不能超过 50 个字符')
    if (!email) throw new Error('邮箱不能为空')
    if (!isValidEmail(email)) throw new Error('邮箱格式不正确')
    validateAdminPassword(password)

    const existAccount = await prisma.sysuser.findUnique({
      where: { account },
      select: { id: true },
    })
    if (existAccount) throw new Error('该账号已存在，请更换账号')

    const existEmail = await prisma.sysuser.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existEmail) throw new Error('该邮箱已被使用，请更换邮箱')

    const created = await prisma.sysuser.create({
      data: {
        account,
        username,
        email,
        password: hashSecurePassword(password),
        role,
        status: 'ACTIVE',
      },
      select: ADMIN_SELECT,
    })
    return toItem(created, getAuthContext().userId)
  }),
)

/** PUT：修改账号角色（主管理员 / 子管理员之间切换，即权限分配）。 */
export const updateAdminRole = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateAdminRoleInput): Promise<AdminAccountItem> => {
    const id = normalize(input?.id)
    if (!id) throw new Error('缺少账号 ID')
    const nextRole: AdminRole = input?.role === 'ADMIN' ? 'ADMIN' : 'SUB_ADMIN'

    const target = await prisma.sysuser.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    })
    if (!target || !STAFF_ROLES.includes(target.role as AdminRole)) {
      throw new Error('账号不存在或不是管理员账号')
    }

    // 把最后一个激活主管理员降级为子管理员会导致无人可管理，需拦截。
    if (target.role === 'ADMIN' && nextRole !== 'ADMIN') {
      const remainingAdmins = await countActivePrimaryAdmins(id)
      if (remainingAdmins < 1) {
        throw new Error('系统必须至少保留 1 个主管理员，无法降级该账号')
      }
    }

    const updated = await prisma.sysuser.update({
      where: { id },
      data: { role: nextRole },
      select: ADMIN_SELECT,
    })
    return toItem(updated, getAuthContext().userId)
  }),
)

/** PUT：启用 / 禁用账号。 */
export const updateAdminStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateAdminStatusInput): Promise<AdminAccountItem> => {
    const id = normalize(input?.id)
    if (!id) throw new Error('缺少账号 ID')
    const nextStatus: AdminStatus = input?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'
    const currentUserId = getAuthContext().userId

    if (id === currentUserId && nextStatus === 'DISABLED') {
      throw new Error('不能禁用当前登录的自己')
    }

    const target = await prisma.sysuser.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    })
    if (!target || !STAFF_ROLES.includes(target.role as AdminRole)) {
      throw new Error('账号不存在或不是管理员账号')
    }

    if (target.role === 'ADMIN' && nextStatus === 'DISABLED') {
      const remainingAdmins = await countActivePrimaryAdmins(id)
      if (remainingAdmins < 1) {
        throw new Error('系统必须至少保留 1 个激活的主管理员，无法禁用该账号')
      }
    }

    const updated = await prisma.sysuser.update({
      where: { id },
      data: { status: nextStatus },
      select: ADMIN_SELECT,
    })
    return toItem(updated, currentUserId)
  }),
)

/** PUT：重置账号密码。 */
export const resetAdminPassword = requireRole([UserRole.ADMIN])(
  withResult(async (input: ResetAdminPasswordInput): Promise<AdminMutationOutput> => {
    const id = normalize(input?.id)
    if (!id) throw new Error('缺少账号 ID')
    const password = String(input?.password ?? '')
    validateAdminPassword(password)

    const target = await prisma.sysuser.findUnique({
      where: { id },
      select: { id: true, role: true },
    })
    if (!target || !STAFF_ROLES.includes(target.role as AdminRole)) {
      throw new Error('账号不存在或不是管理员账号')
    }

    await prisma.sysuser.update({
      where: { id },
      data: { password: hashSecurePassword(password) },
    })
    return { success: true }
  }),
)

/** DELETE：删除管理员 / 子管理员账号。 */
export const deleteAdminAccount = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteAdminInput): Promise<AdminMutationOutput> => {
    const id = normalize(input?.id)
    if (!id) throw new Error('缺少账号 ID')
    const currentUserId = getAuthContext().userId

    if (id === currentUserId) {
      throw new Error('不能删除当前登录的自己')
    }

    const target = await prisma.sysuser.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
        _count: { select: { importTasks: true, importTaskItems: true } },
      },
    })
    if (!target || !STAFF_ROLES.includes(target.role as AdminRole)) {
      throw new Error('账号不存在或不是管理员账号')
    }

    if (target.role === 'ADMIN') {
      const remainingAdmins = await countActivePrimaryAdmins(id)
      if (remainingAdmins < 1) {
        throw new Error('系统必须至少保留 1 个主管理员，无法删除该账号')
      }
    }

    // 该账号发起过 1688/表格导入时，硬删会触发外键约束报错；引导改用「禁用」。
    if (target._count.importTasks > 0 || target._count.importTaskItems > 0) {
      throw new Error('该账号存在关联的商品导入任务/待上传记录，禁止删除；如需停用请改用「禁用」')
    }

    await prisma.sysuser.delete({ where: { id } })
    return { success: true }
  }),
)
