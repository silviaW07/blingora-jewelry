'use server'

/** 用户角色：普通客户(CUSTOMER) | 管理员(ADMIN) */
export type SysUserRole = 'CUSTOMER' | 'ADMIN'

/** 用户状态：激活(ACTIVE) | 停用(DISABLED) */
export type SysUserStatus = 'ACTIVE' | 'DISABLED'

export type UserOrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'COMPLETED'
export type RawOrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type UserListSortField = 'createdAt' | 'lastLoginAt' | 'cartUsdTotal'
export type SortDirection = 'asc' | 'desc'

export type { CustomerTagCode } from '@/backend/lib/customerTags'
export { CUSTOMER_TAG_OPTIONS } from '@/backend/lib/customerTags'
import type { CustomerTagCode } from '@/backend/lib/customerTags'
import { CUSTOMER_TAG_OPTIONS } from '@/backend/lib/customerTags'
import { DEFAULT_CUSTOMER_TYPE, isValidCustomerType, normalizeCustomerType, CUSTOMER_TYPE_OPTIONS } from '@/shared/customerType'

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
  /** 明文密码（后台展示）；历史账号可能为空 */
  passwordPlain: string | null
  role: SysUserRole
  status: SysUserStatus
  createdAt: string
  lastLoginAt: string | null
  adminNote: string | null
  /** 客户类型枚举码：NEW/UNCONVERTED/FIRST_ORDER/MULTI_ORDER/HIGH_RISK/CHURNED */
  customerType: string
  customerTagCode: CustomerTagCode
  customerTagName: string | null
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
  passwordPlain: string | null
  role: SysUserRole
  status: SysUserStatus
  createdAt: string
  lastLoginAt: string | null
  adminNote: string | null
  customerTagCode: CustomerTagCode
  customerTagName: string | null
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
  /** 客户类型：NEW/UNCONVERTED/...；空=全部 */
  customerType?: string
  sortBy?: UserListSortField
  sortOrder?: SortDirection
  page?: number
  pageSize?: number
}

export interface GetUserListOutput {
  list: UserListItem[]
  total: number
  /** 在当前其他筛选条件下，各客户类型人数（不受 customerType 筛选影响，便于看分布） */
  type_counts: Record<string, number>
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

export interface UpdateUserCustomerTagInput {
  id: string
  /** 空字符串表示清除标签 */
  tagCode: CustomerTagCode
}

export interface UpdateUserCustomerTypeInput {
  id: string
  /** 客户类型枚举码，须为 CUSTOMER_TYPE_VALUES 之一 */
  customerType: string
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
import { loadCustomerPasswordPlains } from '@/shared/customerPasswordPlain'

const USD_EXCHANGE_RATE = 6.5

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

async function ensureCustomerTags() {
  for (const option of CUSTOMER_TAG_OPTIONS) {
    await prisma.customertag.upsert({
      where: { code: option.code },
      create: {
        name: option.name,
        code: option.code,
        description: option.name,
      },
      update: { name: option.name },
    })
  }
}

function pickPrimaryTag(links?: Array<{ tag?: { code?: string | null; name?: string | null } | null }> | null): {
  customerTagCode: CustomerTagCode
  customerTagName: string | null
} {
  const tag = links?.[0]?.tag
  const code = String(tag?.code || '') as CustomerTagCode
  if (!code || !CUSTOMER_TAG_OPTIONS.some(item => item.code === code)) {
    return { customerTagCode: '', customerTagName: null }
  }
  return {
    customerTagCode: code,
    customerTagName: tag?.name || CUSTOMER_TAG_OPTIONS.find(item => item.code === code)?.name || null,
  }
}

/**
 * 获取客户/用户列表（支持分页、搜索、筛选、排序、购物车美金合计）
 */
export const getUserList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetUserListInput): Promise<GetUserListOutput> => {
    await ensureCustomerTags()

    const page = input.page && input.page > 0 ? input.page : 1
    const rawPageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 50
    const pageSize = Math.max(1, Math.min(200, Math.floor(rawPageSize)))
    const skip = (page - 1) * pageSize
    const sortBy = input.sortBy || 'createdAt'
    const sortOrder = input.sortOrder === 'asc' ? 'asc' : 'desc'
    const customerTypeFilter = isValidCustomerType(input.customerType) ? String(input.customerType) : ''

    const baseWhere: any = {}
    const keyword = input.keyword?.trim()
    if (keyword) {
      baseWhere.OR = [
        { account: { contains: keyword } },
        { email: { contains: keyword } },
        { username: { contains: keyword } },
        { phone: { contains: keyword } }
      ]
    }
    if (input.account?.trim()) {
      baseWhere.account = { contains: input.account.trim() }
    }
    if (input.email?.trim()) {
      baseWhere.email = { contains: input.email.trim() }
    }
    if (input.role) {
      baseWhere.role = input.role.toUpperCase()
    }
    if (input.status) {
      baseWhere.status = input.status.toUpperCase()
    }

    const where: any = {
      ...baseWhere,
      ...(customerTypeFilter ? { customerType: customerTypeFilter } : {}),
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
      },
      customerTags: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        include: {
          tag: { select: { code: true, name: true } }
        }
      }
    } as const

    const needsInMemorySort = sortBy === 'cartUsdTotal'
    const [total, users, typeGroups] = await Promise.all([
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
      }),
      prisma.sysuser.groupBy({
        by: ['customerType'],
        where: baseWhere,
        _count: { _all: true },
      }),
    ])

    const type_counts: Record<string, number> = {}
    for (const opt of CUSTOMER_TYPE_OPTIONS) {
      type_counts[opt.value] = 0
    }
    for (const group of typeGroups) {
      const key = normalizeCustomerType(group.customerType)
      type_counts[key] = (type_counts[key] || 0) + Number(group._count?._all || 0)
    }

    const emails = Array.from(new Set(users.map(user => user.email.trim().toLowerCase()).filter(Boolean)))
    const [emailOrders, passwordPlains] = await Promise.all([
      emails.length
        ? prisma.orderrecord.findMany({
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
        : Promise.resolve([] as Array<{ userId: string; status: string; user: { email: string } }>),
      loadCustomerPasswordPlains(prisma, users.map(user => user.id)),
    ])

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
      const tag = pickPrimaryTag(user.customerTags)
      return {
        id: user.id,
        account: user.account,
        username: user.username,
        whatsapp: user.phone || null,
        email: user.email,
        passwordPlain: user.role === 'CUSTOMER'
          ? (passwordPlains.get(user.id) || (user as any).passwordPlain || null)
          : null,
        role: user.role as SysUserRole,
        status: user.status as SysUserStatus,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        adminNote: user.adminNote || null,
        customerType: (user as any).customerType || DEFAULT_CUSTOMER_TYPE,
        customerTagCode: tag.customerTagCode,
        customerTagName: tag.customerTagName,
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

    return { list, total, type_counts }
  })
)

/**
 * 获取客户详情（含未付款订单与商品快照）
 */
export const getUserDetail = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetUserDetailInput): Promise<GetUserDetailOutput> => {
    await ensureCustomerTags()

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
        customerTags: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            tag: { select: { code: true, name: true } }
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
    const tag = pickPrimaryTag(user.customerTags)
    const passwordPlains = await loadCustomerPasswordPlains(prisma, [user.id])

    return {
      id: user.id,
      account: user.account,
      username: user.username,
      whatsapp: user.phone || null,
      email: user.email,
      passwordPlain: user.role === 'CUSTOMER'
        ? (passwordPlains.get(user.id) || (user as any).passwordPlain || null)
        : null,
      role: user.role as SysUserRole,
      status: user.status as SysUserStatus,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      adminNote: user.adminNote || null,
      customerTagCode: tag.customerTagCode,
      customerTagName: tag.customerTagName,
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

export const updateUserCustomerType = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateUserCustomerTypeInput): Promise<{ success: boolean; customerType: string }> => {
    const value = (input.customerType || '').trim()
    if (!isValidCustomerType(value)) throw new Error('无效的客户类型')
    const user = await prisma.sysuser.findUnique({ where: { id: input.id }, select: { id: true } })
    if (!user) throw new Error('客户不存在')
    await prisma.sysuser.update({
      where: { id: input.id },
      data: { customerType: value, customerTypeUpdatedAt: new Date() } as any,
    })
    return { success: true, customerType: value }
  })
)

export const updateUserCustomerTag = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateUserCustomerTagInput): Promise<{ success: boolean; tagCode: CustomerTagCode; tagName: string | null }> => {
    await ensureCustomerTags()

    const user = await prisma.sysuser.findUnique({ where: { id: input.id }, select: { id: true } })
    if (!user) throw new Error('客户不存在')

    const tagCode = (input.tagCode || '') as CustomerTagCode
    if (tagCode && !CUSTOMER_TAG_OPTIONS.some(item => item.code === tagCode)) {
      throw new Error('无效的客户标签')
    }

    await prisma.$transaction(async (tx) => {
      await tx.customertaglink.deleteMany({ where: { userId: input.id } })
      if (!tagCode) return

      const tag = await tx.customertag.findUnique({ where: { code: tagCode } })
      if (!tag) throw new Error('客户标签不存在')
      await tx.customertaglink.create({
        data: {
          userId: input.id,
          tagId: tag.id,
        }
      })
    })

    return {
      success: true,
      tagCode,
      tagName: tagCode
        ? CUSTOMER_TAG_OPTIONS.find(item => item.code === tagCode)?.name || null
        : null,
    }
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
        orders: { select: { id: true } },
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
      const orderIds = targetUser.orders.map(order => order.id)

      if (orderIds.length > 0) {
        await tx.orderoperationlog.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.orderlogisticssegment.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.productreview.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.orderitem.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.orderrecord.deleteMany({ where: { id: { in: orderIds } } })
      }

      await tx.productreview.deleteMany({ where: { userId: targetId } })
      await tx.customorder.deleteMany({ where: { userId: targetId } })
      await tx.customertaglink.deleteMany({ where: { userId: targetId } })
      await tx.customercommunication.deleteMany({ where: { userId: targetId } })
      await tx.wishlistitem.deleteMany({ where: { userId: targetId } })
      await tx.customerticket.updateMany({ where: { userId: targetId }, data: { userId: null } })
      await tx.useraddress.deleteMany({ where: { userId: targetId } })

      if (targetUser.carts.length > 0) {
        const cartIds = targetUser.carts.map(c => c.id)
        await tx.cartitem.deleteMany({ where: { cartId: { in: cartIds } } })
        await tx.cart.deleteMany({ where: { id: { in: cartIds } } })
      }

      await tx.sysuser.delete({ where: { id: targetId } })
    })
  })
)
