'use server'

// ===== Enums =====
/** 用户角色：普通客户(CUSTOMER) | 管理员(ADMIN) */
export type SysUserRole = 'CUSTOMER' | 'ADMIN'

/** 用户状态：激活(ACTIVE) | 停用(DISABLED) */
export type SysUserStatus = 'ACTIVE' | 'DISABLED'

// ===== Data Structures =====
export interface UserListItem {
  id: string              // data-from: sysuser-id
  account: string         // data-from: sysuser-account
  email: string           // data-from: sysuser-email
  role: SysUserRole       // data-from: sysuser-role
  createdAt: string       // data-from: sysuser-createdAt
  status: SysUserStatus   // data-from: sysuser-status
  cartItemCount: number   // aggregated
}

export interface UserDetail {
  id: string              // data-from: sysuser-id
  account: string         // data-from: sysuser-account
  email: string           // data-from: sysuser-email
  role: SysUserRole       // data-from: sysuser-role
  status: SysUserStatus   // data-from: sysuser-status
  createdAt: string       // data-from: sysuser-createdAt
  lastLoginAt: string | null // data-from: sysuser-lastLoginAt
  cartId: string | null   // data-from: cart-id
  cartItemCount: number   // aggregated
}

// ===== Input / Output =====
export interface GetUserListInput {
  account?: string
  email?: string
  role?: SysUserRole | ''
  status?: SysUserStatus | ''
  page?: number
  pageSize?: number
}

export interface GetUserListOutput {
  list: UserListItem[]
  total: number
}

export interface GetUserDetailInput {
  id: string
}

export interface UpdateUserStatusInput {
  id: string
  status: SysUserStatus
}

export interface DeleteUserInput {
  id: string
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/backend/action_utils'

// ===== Actions =====

/**
 * 获取用户列表（支持分页、搜索、筛选）
 */
export const getUserList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetUserListInput): Promise<GetUserListOutput> => {
    const page = input.page && input.page > 0 ? input.page : 1
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20
    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where: any = {}
    if (input.account?.trim()) {
      where.account = { contains: input.account.trim() }
    }
    if (input.email?.trim()) {
      where.email = { contains: input.email.trim() }
    }
    if (input.role) {
      where.role = input.role.toUpperCase()
    }
    if (input.status) {
      where.status = input.status.toUpperCase()
    }

    const [total, users] = await Promise.all([
      prisma.sysuser.count({ where }),
      prisma.sysuser.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          carts: {
            include: {
              _count: {
                select: { items: true }
              }
            }
          }
        }
      })
    ])

    const list: UserListItem[] = users.map(user => {
      // 业务约束：每个用户最多只有1个购物车
      const cart = user.carts[0]
      return {
        id: user.id,
        account: user.account,
        email: user.email,
        role: user.role as SysUserRole,
        createdAt: user.createdAt.toISOString(),
        status: user.status as SysUserStatus,
        cartItemCount: cart?._count?.items ?? 0
      }
    })

    return { list, total }
  })
)

/**
 * 获取用户详情摘要
 */
export const getUserDetail = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetUserDetailInput): Promise<UserDetail> => {
    const user = await prisma.sysuser.findUnique({
      where: { id: input.id },
      include: {
        carts: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        }
      }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    const cart = user.carts[0]

    return {
      id: user.id,
      account: user.account,
      email: user.email,
      role: user.role as SysUserRole,
      status: user.status as SysUserStatus,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      cartId: cart?.id ?? null,
      cartItemCount: cart?._count?.items ?? 0
    }
  })
)

/**
 * 更新用户状态 (启用/禁用)
 */
export const updateUserStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateUserStatusInput): Promise<void> => {
    const { id, status } = input
    const targetStatus = status.toUpperCase() as SysUserStatus

    const targetUser = await prisma.sysuser.findUnique({
      where: { id }
    })

    if (!targetUser) {
      throw new Error('操作的目标用户不存在')
    }

    // 领域不变量：如果禁用的是 ADMIN，检查是否是系统中最后一个激活状态的 ADMIN
    if (targetStatus === 'DISABLED' && targetUser.role === 'ADMIN' && targetUser.status === 'ACTIVE') {
      const activeAdminCount = await prisma.sysuser.count({
        where: {
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })

      if (activeAdminCount <= 1) {
        throw new Error('系统必须至少保留1个激活状态的管理员账号，无法禁用该账户')
      }
    }

    await prisma.sysuser.update({
      where: { id },
      data: { status: targetStatus }
    })
  })
)

/**
 * 删除用户
 */
export const deleteUser = requireRole([UserRole.ADMIN])(
  withResult(async (input: DeleteUserInput): Promise<void> => {
    const { userId: currentUserId } = getAuthContext()
    const targetId = input.id

    if (currentUserId === targetId) {
      throw new Error('当前登录管理员不可删除自己')
    }

    const targetUser = await prisma.sysuser.findUnique({
      where: { id: targetId },
      include: {
        carts: true,
        _count: {
          select: { importTasks: true }
        }
      }
    })

    if (!targetUser) {
      throw new Error('要删除的用户不存在')
    }

    // 领域不变量：管理员删除前置约束
    if (targetUser.role === 'ADMIN') {
      if (targetUser._count.importTasks > 0) {
        throw new Error('该管理员存在关联的商品导入任务，禁止删除')
      }

      if (targetUser.status === 'ACTIVE') {
        const activeAdminCount = await prisma.sysuser.count({
          where: { role: 'ADMIN', status: 'ACTIVE' }
        })
        if (activeAdminCount <= 1) {
          throw new Error('系统必须至少保留1个激活状态的管理员账号，无法删除该账户')
        }
      }
    }

    // 开启事务进行级联删除
    await prisma.$transaction(async (tx) => {
      // 如果是普通客户，需级联删除其购物车明细及购物车
      if (targetUser.role === 'CUSTOMER' && targetUser.carts.length > 0) {
        const cartIds = targetUser.carts.map(c => c.id)
        // 1. 删除关联的购物车条目
        await tx.cartitem.deleteMany({
          where: { cartId: { in: cartIds } }
        })
        // 2. 删除购物车本身
        await tx.cart.deleteMany({
          where: { id: { in: cartIds } }
        })
      }

      // 3. 删除用户主体
      await tx.sysuser.delete({
        where: { id: targetId }
      })
    })
  })
)