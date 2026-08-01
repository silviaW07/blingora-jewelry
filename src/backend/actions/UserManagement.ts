'use server'

/** 用户角色：普通客户(CUSTOMER) | 管理员(ADMIN) */
export type SysUserRole = 'CUSTOMER' | 'ADMIN'

/** 用户状态：激活(ACTIVE) | 停用(DISABLED) */
export type SysUserStatus = 'ACTIVE' | 'DISABLED'

export type UserOrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'COMPLETED'
export type RawOrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type UserListSortField = 'createdAt' | 'lastLoginAt' | 'cartUsdTotal'
export type SortDirection = 'asc' | 'desc'

export interface UserOrderSummary {
  total: number
  pendingPayment: number
  paid: number
  shipped: number
  completed: number
}

export interface UserOrderItem {
  id: string
  orderNo: string
  email: string
  rawStatus: RawOrderStatus
  mappedStatus: UserOrderStatus
  totalAmount: number
  totalAmountUsd: number
  currencyCode: string
  paymentStatusLabel: string
  createdAt: string
  matchedBy: 'USER_ID' | 'EMAIL'
  productSnapshot: string
  items: UnpaidOrderLineItem[]
}

export interface UnpaidOrderLineItem {
  id: string
  productName: string
  skuCode: string
  quantity: number
  unitPrice: number
  unitPriceUsd: number
  lineAmount: number
  lineAmountUsd: number
  imageUrl: string | null
}

export interface UserListItem {
  id: string
  account: string
  username: string
  whatsapp: string | null
  email: string
  passwordMasked: string
  role: SysUserRole
  status: SysUserStatus
  createdAt: string
  lastLoginAt: string | null
  adminNote: string | null
  cartItemCount: number
  cartUsdTotal: number
  orderCount: number
  orderSummary: UserOrderSummary
}

export interface UserDetail {
  id: string
  account: string
  username: string
  whatsapp: string | null
  email: string
  passwordMasked: string
  role: SysUserRole
  status: SysUserStatus
  createdAt: string
  lastLoginAt: string | null
  adminNote: string | null
  cartId: string | null
  cartItemCount: number
  cartUsdTotal: number
  orderCount: number
  orderSummary: UserOrderSummary
  orderRecords: UserOrderItem[]
  unpaidOrders: UserOrderItem[]
}

export interface GetUserListInput {
  account?: string
  email?: string
  keyword?: string
  role?: SysUserRole | ''
  status?: SysUserStatus | ''
  sortBy?: UserListSortField
  sortOrder?: SortDirection
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

export interface GetUserDetailOutput extends UserDetail {}

export interface UpdateUserStatusInput {
  id: string
  status: SysUserStatus
}

export interface DeleteUserInput {
  id: string
}

export interface UpdateUserAdminNoteInput {
  id: string
  adminNote: string
}

export interface ImpersonateCustomerInput {
  userId: string
}

export interface ImpersonateCustomerOutput {
  token: string
  user_id: string
  username: string
  email: string
  preferred_locale: string
  redirect_path: string
}

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole,
  signToken
} from '@/backend/action_utils'

const USD_EXCHANGE_RATE = 6.5
const PASSWORD_MASK = '已加密存储'

const ORDER_STATUS_PRIORITY: Record<RawOrderStatus, number> = {
  PENDING_PAYMENT: 1,
  PAID: 2,
  PROCESSING: 3,
  SHIPPED: 4,
  DELIVERED: 5,
  CANCELLED: 6,
  REFUNDED: 7
}

function toUsd(amount: number, currencyCode?: string | null) {
  if (!Number.isFinite(amount)) return 0
  if ((currencyCode || '').toUpperCase() === 'USD') return Number(amount.toFixed(2))
  return Number((amount / USD_EXCHANGE_RATE).toFixed(2))
}

function mapOrderStatus(status: RawOrderStatus): UserOrderStatus {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'PENDING_PAYMENT'
    case 'PAID':
    case 'PROCESSING':
      return 'PAID'
    case 'SHIPPED':
      return 'SHIPPED'
    case 'DELIVERED':
      return 'COMPLETED'
    default:
      return 'COMPLETED'
  }
}

function paymentStatusLabel(status: RawOrderStatus) {
  return status === 'PENDING_PAYMENT' ? '待支付' : mapOrderStatus(status) === 'PAID' ? '已付款' : '其他'
}

function createEmptyOrderSummary(): UserOrderSummary {
  return {
    total: 0,
    pendingPayment: 0,
    paid: 0,
    shipped: 0,
    completed: 0
  }
}

function buildOrderSummary(statuses: RawOrderStatus[]): UserOrderSummary {
  return statuses.reduce((summary, status) => {
    const mappedStatus = mapOrderStatus(status)
    summary.total += 1
    if (mappedStatus === 'PENDING_PAYMENT') summary.pendingPayment += 1
    if (mappedStatus === 'PAID') summary.paid += 1
    if (mappedStatus === 'SHIPPED') summary.shipped += 1
    if (mappedStatus === 'COMPLETED') summary.completed += 1
    return summary
  }, createEmptyOrderSummary())
}

function calcCartUsdTotal(cart?: {
  items?: Array<{
    quantity: number
    status?: string | null
    giftWrapFee?: any
    productSku?: { price?: any } | null
  }>
} | null) {
  if (!cart?.items?.length) return 0
  const rmb = cart.items.reduce((sum, item) => {
    if (item.status && item.status !== 'VALID') return sum
    const unit = Number(item.productSku?.price || 0)
    const gift = Number(item.giftWrapFee || 0)
    return sum + unit * (item.quantity || 0) + gift
  }, 0)
  return toUsd(rmb, 'CNY')
}

function buildProductSnapshot(items: UnpaidOrderLineItem[]) {
  if (!items.length) return '无商品'
  return items
    .map(item => `${item.productName}${item.skuCode ? `(${item.skuCode})` : ''} ×${item.quantity}`)
    .join('；')
}

function mapOrderLines(items: Array<{
  id: string
  productName: string
  skuCode: string
  quantity: number
  unitPrice: any
  lineAmount: any
  product?: { mainImageUrl?: string | null } | null
}>, currencyCode: string): UnpaidOrderLineItem[] {
  return items.map(item => {
    const unitPrice = Number(item.unitPrice)
    const lineAmount = Number(item.lineAmount)
    return {
      id: item.id,
      productName: item.productName,
      skuCode: item.skuCode,
      quantity: item.quantity,
      unitPrice,
      unitPriceUsd: toUsd(unitPrice, currencyCode),
      lineAmount,
      lineAmountUsd: toUsd(lineAmount, currencyCode),
      imageUrl: item.product?.mainImageUrl || null
    }
  })
}

/**
 * 获取客户/用户列表（支持分页、搜索、筛选、排序、购物车美金合计）
 */
export const getUserList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetUserListInput): Promise<GetUserListOutput> => {
    const page = input.page && input.page > 0 ? input.page : 1
    const rawPageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 50
    const pageSize = Math.max(1, Math.min(200, Math.floor(rawPageSize)))
    const skip = (page - 1) * pageSize
    const sortBy = input.sortBy || 'createdAt'
    const sortOrder = input.sortOrder === 'asc' ? 'asc' : 'desc'

    const where: any = {}
    const keyword = input.keyword?.trim()
    if (keyword) {
      where.OR = [
        { account: { contains: keyword } },
        { email: { contains: keyword } },
        { username: { contains: keyword } },
        { phone: { contains: keyword } }
      ]
    }
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

    const include = {
      carts: {
        include: {
          items: {
            include: {
              productSku: {
                select: { price: true }
              }
            }
          },
          _count: {
            select: { items: true }
          }
        }
      },
      orders: {
        select: { status: true }
      }
    } as const

    const needsInMemorySort = sortBy === 'cartUsdTotal'
    const [total, users] = await Promise.all([
      prisma.sysuser.count({ where }),
      prisma.sysuser.findMany({
        where,
        ...(needsInMemorySort
          ? {}
          : {
              skip,
              take: pageSize,
              orderBy: sortBy === 'lastLoginAt'
                ? { lastLoginAt: sortOrder }
                : { createdAt: sortOrder }
            }),
        include
      })
    ])

    const emails = Array.from(new Set(users.map(user => user.email.trim().toLowerCase()).filter(Boolean)))
    const emailOrders = emails.length
      ? await prisma.orderrecord.findMany({
          where: {
            user: {
              email: { in: emails }
            }
          },
          select: {
            userId: true,
            status: true,
            user: { select: { email: true } }
          }
        })
      : []

    const emailStatusMap = new Map<string, RawOrderStatus[]>()
    for (const order of emailOrders) {
      const emailKey = order.user.email.trim().toLowerCase()
      const bucket = emailStatusMap.get(emailKey) ?? []
      bucket.push(order.status as RawOrderStatus)
      emailStatusMap.set(emailKey, bucket)
    }

    let list: UserListItem[] = users.map(user => {
      const cart = user.carts[0]
      const directStatuses = user.orders.map(order => order.status as RawOrderStatus)
      const emailStatuses = user.email ? emailStatusMap.get(user.email.trim().toLowerCase()) ?? [] : []
      const mergedStatuses = [...directStatuses, ...emailStatuses]
      return {
        id: user.id,
        account: user.account,
        username: user.username,
        whatsapp: user.phone || null,
        email: user.email,
        passwordMasked: PASSWORD_MASK,
        role: user.role as SysUserRole,
        status: user.status as SysUserStatus,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        adminNote: user.adminNote || null,
        cartItemCount: cart?._count?.items ?? 0,
        cartUsdTotal: calcCartUsdTotal(cart),
        orderCount: mergedStatuses.length,
        orderSummary: buildOrderSummary(mergedStatuses)
      }
    })

    if (needsInMemorySort) {
      list.sort((a, b) => {
        const diff = a.cartUsdTotal - b.cartUsdTotal
        return sortOrder === 'asc' ? diff : -diff
      })
      list = list.slice(skip, skip + pageSize)
    }

    return { list, total }
  })
)

/**
 * 获取客户详情（含未付款订单与商品快照）
 */
export const getUserDetail = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetUserDetailInput): Promise<GetUserDetailOutput> => {
    const user = await prisma.sysuser.findUnique({
      where: { id: input.id },
      include: {
        carts: {
          include: {
            items: {
              include: {
                productSku: { select: { price: true } }
              }
            },
            _count: { select: { items: true } }
          }
        },
        orders: {
          select: {
            id: true,
            orderNo: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            currencyCode: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                productName: true,
                skuCode: true,
                quantity: true,
                unitPrice: true,
                lineAmount: true,
                product: { select: { mainImageUrl: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      throw new Error('客户不存在')
    }

    const emailMatchedOrders = user.email
      ? await prisma.orderrecord.findMany({
          where: {
            user: { email: user.email.trim() },
            NOT: { userId: user.id }
          },
          select: {
            id: true,
            orderNo: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            currencyCode: true,
            createdAt: true,
            userId: true,
            user: { select: { email: true } },
            items: {
              select: {
                id: true,
                productName: true,
                skuCode: true,
                quantity: true,
                unitPrice: true,
                lineAmount: true,
                product: { select: { mainImageUrl: true } }
              }
            }
          }
        })
      : []

    const orderMap = new Map<string, UserOrderItem>()

    const pushOrder = (
      order: {
        id: string
        orderNo: string
        status: string
        totalAmount: any
        currencyCode: string
        createdAt: Date
        items: any[]
      },
      email: string,
      matchedBy: 'USER_ID' | 'EMAIL'
    ) => {
      const rawStatus = order.status as RawOrderStatus
      const lines = mapOrderLines(order.items || [], order.currencyCode)
      const totalAmount = Number(order.totalAmount)
      orderMap.set(order.id, {
        id: order.id,
        orderNo: order.orderNo,
        email,
        rawStatus,
        mappedStatus: mapOrderStatus(rawStatus),
        totalAmount,
        totalAmountUsd: toUsd(totalAmount, order.currencyCode),
        currencyCode: order.currencyCode,
        paymentStatusLabel: paymentStatusLabel(rawStatus),
        createdAt: order.createdAt.toISOString(),
        matchedBy,
        productSnapshot: buildProductSnapshot(lines),
        items: lines
      })
    }

    for (const order of user.orders) {
      pushOrder(order, user.email, 'USER_ID')
    }
    for (const order of emailMatchedOrders) {
      if (orderMap.has(order.id)) continue
      pushOrder(order, order.user.email, 'EMAIL')
    }

    const orderRecords = Array.from(orderMap.values())
      .filter(order => ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.rawStatus))
      .sort((a, b) => {
        const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (timeDiff !== 0) return timeDiff
        return ORDER_STATUS_PRIORITY[a.rawStatus] - ORDER_STATUS_PRIORITY[b.rawStatus]
      })

    const unpaidOrders = orderRecords.filter(order => order.rawStatus === 'PENDING_PAYMENT')
    const cart = user.carts[0]

    return {
      id: user.id,
      account: user.account,
      username: user.username,
      whatsapp: user.phone || null,
      email: user.email,
      passwordMasked: PASSWORD_MASK,
      role: user.role as SysUserRole,
      status: user.status as SysUserStatus,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      adminNote: user.adminNote || null,
      cartId: cart?.id ?? null,
      cartItemCount: cart?._count?.items ?? 0,
      cartUsdTotal: calcCartUsdTotal(cart),
      orderCount: orderRecords.length,
      orderSummary: buildOrderSummary(orderRecords.map(order => order.rawStatus)),
      orderRecords,
      unpaidOrders
    }
  })
)

export const updateUserAdminNote = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateUserAdminNoteInput): Promise<{ success: boolean }> => {
    const user = await prisma.sysuser.findUnique({ where: { id: input.id }, select: { id: true } })
    if (!user) throw new Error('客户不存在')
    await prisma.sysuser.update({
      where: { id: input.id },
      data: { adminNote: input.adminNote.trim() || null }
    })
    return { success: true }
  })
)

export const impersonateCustomer = requireRole([UserRole.ADMIN])(
  withResult(async (input: ImpersonateCustomerInput): Promise<ImpersonateCustomerOutput> => {
    const user = await prisma.sysuser.findUnique({ where: { id: input.userId } })
    if (!user) throw new Error('客户不存在')
    if (user.role !== 'CUSTOMER') throw new Error('仅支持以客户身份登入')
    if (user.status !== 'ACTIVE') throw new Error('该客户账号已禁用，无法登入')

    const token = await signToken(user.id, user.role)
    return {
      token,
      user_id: user.id,
      username: user.username,
      email: user.email,
      preferred_locale: user.preferredLocale || 'en',
      redirect_path: '/cart'
    }
  })
)

export const updateUserStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateUserStatusInput): Promise<void> => {
    const { id, status } = input
    const targetStatus = status.toUpperCase() as SysUserStatus

    const targetUser = await prisma.sysuser.findUnique({ where: { id } })
    if (!targetUser) throw new Error('操作的目标用户不存在')

    if (targetStatus === 'DISABLED' && targetUser.role === 'ADMIN' && targetUser.status === 'ACTIVE') {
      const activeAdminCount = await prisma.sysuser.count({
        where: { role: 'ADMIN', status: 'ACTIVE' }
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
        _count: { select: { importTasks: true } }
      }
    })

    if (!targetUser) throw new Error('要删除的用户不存在')

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

    await prisma.$transaction(async (tx) => {
      if (targetUser.role === 'CUSTOMER' && targetUser.carts.length > 0) {
        const cartIds = targetUser.carts.map(c => c.id)
        await tx.cartitem.deleteMany({ where: { cartId: { in: cartIds } } })
        await tx.cart.deleteMany({ where: { id: { in: cartIds } } })
      }
      await tx.sysuser.delete({ where: { id: targetId } })
    })
  })
)
