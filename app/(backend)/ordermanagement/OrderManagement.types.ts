'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/backend/action_utils'

// ===== Enums =====

/** 订单状态：待付款(PENDING_PAYMENT) | 已支付(PAID) | 处理中(PROCESSING) | 已发货(SHIPPED) | 已送达(DELIVERED) | 已取消(CANCELLED) | 已退款(REFUNDED) */
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

/** 发货方式：标准(STANDARD) | 加急(EXPRESS) */
export type OrderShipMethod = 'STANDARD' | 'EXPRESS'

/** 支付方式：PayPal(PAYPAL) | 银行转账(BANK_TRANSFER) | Stripe(STRIPE) | 信用卡(CREDIT_CARD) */
export type PaymentMethodType = 'PAYPAL' | 'BANK_TRANSFER' | 'STRIPE' | 'CREDIT_CARD'


// ===== Data Structures =====

export interface OrderItemDetail {
  id: string                   // data-from: orderitem-id
  productId: string            // data-from: orderitem-productId
  productSkuId: string         // data-from: orderitem-productSkuId
  productName: string          // data-from: orderitem-productName
  skuCode: string              // data-from: orderitem-skuCode
  materialLabel: string | null // data-from: orderitem-materialLabel
  sizeLabel: string | null     // data-from: orderitem-sizeLabel
  engravingText: string | null // data-from: orderitem-engravingText
  quantity: number             // data-from: orderitem-quantity
  unitPrice: number            // data-from: orderitem-unitPrice (Decimal -> number)
  lineAmount: number           // data-from: orderitem-lineAmount (Decimal -> number)
  mainImageUrl?: string        // data-from: product-mainImageUrl (关联查询补全)
}

export interface OrderLogisticsSegmentDetail {
  id: string                           // data-from: orderlogisticssegment-id
  segmentType: string                  // data-from: orderlogisticssegment-segmentType
  carrierName: string | null           // data-from: orderlogisticssegment-carrierName
  trackingNumber: string | null        // data-from: orderlogisticssegment-trackingNumber
  statusLabel: string | null           // data-from: orderlogisticssegment-statusLabel
  estimatedArrivalAt: string | null    // data-from: orderlogisticssegment-estimatedArrivalAt (ISO String)
  shippedAt: string | null             // data-from: orderlogisticssegment-shippedAt (ISO String)
  remark: string | null                // data-from: orderlogisticssegment-remark
  timelineJson: { time: string, label: string }[] | null // data-from: orderlogisticssegment-timelineJson
  createdAt: string                    // data-from: orderlogisticssegment-createdAt (ISO String)
}

export interface OrderOperationLogDetail {
  id: string                   // data-from: orderoperationlog-id
  actionType: string           // data-from: orderoperationlog-actionType
  actionNote: string | null    // data-from: orderoperationlog-actionNote
  operatorName: string | null  // data-from: orderoperationlog-operatorName
  createdAt: string            // data-from: orderoperationlog-createdAt (ISO String)
}

export interface OrderAddressInfo {
  recipientName: string        // data-from: useraddress-recipientName
  phone: string | null         // data-from: useraddress-phone
  countryCode: string          // data-from: useraddress-countryCode
  countryName: string          // data-from: useraddress-countryName
  stateName: string | null     // data-from: useraddress-stateName
  cityName: string | null      // data-from: useraddress-cityName
  addressLine1: string         // data-from: useraddress-addressLine1
  addressLine2: string | null  // data-from: useraddress-addressLine2
  postalCode: string | null    // data-from: useraddress-postalCode
}

export interface OrderListItem {
  id: string                   // data-from: orderrecord-id
  orderNo: string              // data-from: orderrecord-orderNo
  status: OrderStatus          // data-from: orderrecord-status
  totalAmount: number          // data-from: orderrecord-totalAmount (Decimal -> number)
  currencyCode: string         // data-from: orderrecord-currencyCode
  paymentMethod: PaymentMethodType // data-from: orderrecord-paymentMethod
  paymentStatus: string | null // data-from: orderrecord-paymentStatus
  trackingCarrier: string | null // data-from: orderrecord-trackingCarrier
  trackingNumber: string | null  // data-from: orderrecord-trackingNumber
  createdAt: string            // data-from: orderrecord-createdAt (ISO String)
  
  // 关联摘要数据
  customerName: string         // data-from: sysuser-username
  customerEmail: string        // data-from: sysuser-email
  countryName: string | null   // data-from: useraddress-countryName
  itemSummary: string          // aggregated (如：商品A等共X件)
  itemImageUrl: string | null  // aggregated (取第一个商品的图片)
}

export interface OrderDetail extends OrderListItem {
  subtotalAmount: number       // data-from: orderrecord-subtotalAmount (Decimal -> number)
  discountAmount: number       // data-from: orderrecord-discountAmount (Decimal -> number)
  shippingAmount: number       // data-from: orderrecord-shippingAmount (Decimal -> number)
  giftWrapAmount: number       // data-from: orderrecord-giftWrapAmount (Decimal -> number)
  shipMethod: OrderShipMethod  // data-from: orderrecord-shipMethod
  estimatedArrivalAt: string | null // data-from: orderrecord-estimatedArrivalAt (ISO String)
  shippedAt: string | null     // data-from: orderrecord-shippedAt (ISO String)
  internalNote: string | null  // data-from: orderrecord-internalNote
  note: string | null          // data-from: orderrecord-note (买家备注)
  
  address: OrderAddressInfo | null
  items: OrderItemDetail[]
  logistics: OrderLogisticsSegmentDetail[]
  logs: OrderOperationLogDetail[]
}

// ===== Input / Output =====

export interface GetDashboardStatsOutput {
  pendingShipmentCount: number // 待发货
  todayNewOrderCount: number   // 今日新增
  refundingCount: number       // 退款处理中
  totalOrderCount: number      // 全部订单数
}

export interface GetOrderListInput {
  keyword?: string             // 订单号 / 客户名 / 邮箱
  status?: OrderStatus
  paymentStatus?: string       // 对应订单的 paymentStatus
  startDate?: string           // ISO String
  endDate?: string             // ISO String
  countryName?: string
  page?: number                // 默认 1
  pageSize?: number            // 默认 20
}

export interface GetOrderListOutput {
  list: OrderListItem[]
  total: number
}

export interface ShipOrderInput {
  orderId: string
  trackingCarrier: string
  trackingNumber: string
  shippedAt: string            // 实际发货时间 (ISO String)
  internalNote?: string
}

export interface AddLogisticsSegmentInput {
  orderId: string
  segmentType: string          // 如: "国内段" / "国际段"
  carrierName?: string
  trackingNumber?: string
  statusLabel?: string
  estimatedArrivalAt?: string  // ISO String
  remark?: string
}

export interface UpdateOrderStatusInput {
  orderId: string
  newStatus: OrderStatus
  actionNote: string           // 必填备注，保障闭环追溯
}

// ===== Actions =====

/**
 * 获取订单管理顶部关键指标
 */
export const getOrderDashboardStats = requireRole([UserRole.ADMIN])(
  withResult(async (): Promise<GetDashboardStatsOutput> => {
    // 待发货 (PROCESSING 或 PENDING_PAYMENT等视具体业务而定，按需求一般把 PAID/PROCESSING 当作待发货)
    const pendingShipmentCount = await prisma.orderrecord.count({
      where: { status: 'PROCESSING' }
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayNewOrderCount = await prisma.orderrecord.count({
      where: { createdAt: { gte: todayStart } }
    })

    const refundingCount = await prisma.orderrecord.count({
      where: { status: 'REFUNDED' } // 根据需求可以独立扩展 REFUNDING 等，按Schema用已退款或找退款申请，此处用已有REFUNDED近似替代
    })

    const totalOrderCount = await prisma.orderrecord.count()

    return {
      pendingShipmentCount,
      todayNewOrderCount,
      refundingCount,
      totalOrderCount
    }
  })
)

/**
 * 获取订单列表（支持复合检索）
 */
export const getOrderList = requireRole([UserRole.ADMIN])(
  withResult(async (input: GetOrderListInput): Promise<GetOrderListOutput> => {
    const {
      keyword, status, paymentStatus, startDate, endDate, countryName,
      page = 1, pageSize = 20
    } = input

    const skip = (Math.max(1, page) - 1) * pageSize
    
    // 构建过滤条件
    const whereCondition: any = {}

    if (status) {
      whereCondition.status = status
    }

    if (paymentStatus) {
      whereCondition.paymentStatus = paymentStatus
    }

    if (startDate || endDate) {
      whereCondition.createdAt = {}
      if (startDate) whereCondition.createdAt.gte = new Date(startDate)
      if (endDate) whereCondition.createdAt.lte = new Date(endDate)
    }

    if (countryName) {
      whereCondition.address = { countryName: { contains: countryName } }
    }

    if (keyword) {
      whereCondition.OR = [
        { orderNo: { contains: keyword } },
        { user: { username: { contains: keyword } } },
        { user: { email: { contains: keyword } } }
      ]
    }

    const [total, records] = await Promise.all([
      prisma.orderrecord.count({ where: whereCondition }),
      prisma.orderrecord.findMany({
        where: whereCondition,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          address: true,
          items: {
            include: {
              product: { select: { mainImageUrl: true } }
            }
          }
        }
      })
    ])

    const list: OrderListItem[] = records.map(record => {
      // 聚合商品摘要
      let itemSummary = ''
      if (record.items.length > 0) {
        const firstItem = record.items[0]
        const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0)
        itemSummary = `${firstItem.productName} 等共 ${totalQty} 件`
      }

      return {
        id: record.id,
        orderNo: record.orderNo,
        status: record.status as OrderStatus,
        totalAmount: record.totalAmount.toNumber(),
        currencyCode: record.currencyCode,
        paymentMethod: record.paymentMethod as PaymentMethodType,
        paymentStatus: record.paymentStatus,
        trackingCarrier: record.trackingCarrier,
        trackingNumber: record.trackingNumber,
        createdAt: record.createdAt.toISOString(),
        customerName: record.user.username,
        customerEmail: record.user.email,
        countryName: record.address?.countryName || null,
        itemSummary,
        itemImageUrl: record.items[0]?.product?.mainImageUrl || null
      }
    })

    return { list, total }
  })
)

/**
 * 获取订单详情（抽屉用全量数据）
 */
export const getOrderDetail = requireRole([UserRole.ADMIN])(
  withResult(async (orderId: string): Promise<OrderDetail> => {
    const record = await prisma.orderrecord.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: { select: { mainImageUrl: true } }
          }
        },
        logistics: {
          orderBy: { createdAt: 'desc' }
        },
        logs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!record) {
      throw new Error('订单不存在')
    }

    let itemSummary = ''
    if (record.items.length > 0) {
      const firstItem = record.items[0]
      const totalQty = record.items.reduce((sum, item) => sum + item.quantity, 0)
      itemSummary = `${firstItem.productName} 等共 ${totalQty} 件`
    }

    return {
      id: record.id,
      orderNo: record.orderNo,
      status: record.status as OrderStatus,
      totalAmount: record.totalAmount.toNumber(),
      subtotalAmount: record.subtotalAmount.toNumber(),
      discountAmount: record.discountAmount.toNumber(),
      shippingAmount: record.shippingAmount.toNumber(),
      giftWrapAmount: record.giftWrapAmount.toNumber(),
      currencyCode: record.currencyCode,
      paymentMethod: record.paymentMethod as PaymentMethodType,
      paymentStatus: record.paymentStatus,
      shipMethod: record.shipMethod as OrderShipMethod,
      trackingCarrier: record.trackingCarrier,
      trackingNumber: record.trackingNumber,
      estimatedArrivalAt: record.estimatedArrivalAt?.toISOString() || null,
      shippedAt: record.shippedAt?.toISOString() || null,
      internalNote: record.internalNote,
      note: record.note,
      createdAt: record.createdAt.toISOString(),
      
      customerName: record.user.username,
      customerEmail: record.user.email,
      countryName: record.address?.countryName || null,
      itemSummary,
      itemImageUrl: record.items[0]?.product?.mainImageUrl || null,

      address: record.address ? {
        recipientName: record.address.recipientName,
        phone: record.address.phone,
        countryCode: record.address.countryCode,
        countryName: record.address.countryName,
        stateName: record.address.stateName,
        cityName: record.address.cityName,
        addressLine1: record.address.addressLine1,
        addressLine2: record.address.addressLine2,
        postalCode: record.address.postalCode,
      } : null,

      items: record.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productSkuId: item.productSkuId,
        productName: item.productName,
        skuCode: item.skuCode,
        materialLabel: item.materialLabel,
        sizeLabel: item.sizeLabel,
        engravingText: item.engravingText,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        lineAmount: item.lineAmount.toNumber(),
        mainImageUrl: item.product?.mainImageUrl
      })),

      logistics: record.logistics.map(log => ({
        id: log.id,
        segmentType: log.segmentType,
        carrierName: log.carrierName,
        trackingNumber: log.trackingNumber,
        statusLabel: log.statusLabel,
        estimatedArrivalAt: log.estimatedArrivalAt?.toISOString() || null,
        shippedAt: log.shippedAt?.toISOString() || null,
        remark: log.remark,
        timelineJson: log.timelineJson as { time: string, label: string }[] | null,
        createdAt: log.createdAt.toISOString(),
      })),

      logs: record.logs.map(log => ({
        id: log.id,
        actionType: log.actionType,
        actionNote: log.actionNote,
        operatorName: log.operatorName,
        createdAt: log.createdAt.toISOString(),
      }))
    }
  })
)

/**
 * 处理发货（履约工作台）
 * 更新订单的主物流信息、状态，并同步写入操作日志和主段物流记录
 */
export const shipOrder = requireRole([UserRole.ADMIN])(
  withResult(async (input: ShipOrderInput): Promise<void> => {
    const { userId, username } = getAuthContext()
    
    await prisma.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: input.orderId } })
      if (!order) throw new Error('订单不存在')
      if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
        throw new Error('已取消或已退款的订单无法发货')
      }

      const shipDate = new Date(input.shippedAt)
      
      // 1. 更新主订单记录
      await tx.orderrecord.update({
        where: { id: input.orderId },
        data: {
          status: 'SHIPPED',
          trackingCarrier: input.trackingCarrier,
          trackingNumber: input.trackingNumber,
          shippedAt: shipDate,
          ...(input.internalNote ? { internalNote: input.internalNote } : {})
        }
      })

      // 2. 自动生成一个"出库/主干"的物流段记录
      await tx.orderlogisticssegment.create({
        data: {
          orderId: input.orderId,
          segmentType: '国际段/主干', // 默认作为主干录入
          carrierName: input.trackingCarrier,
          trackingNumber: input.trackingNumber,
          statusLabel: '已发货',
          shippedAt: shipDate,
          remark: '管理员操作主干发货',
          timelineJson: [
            { time: shipDate.toISOString(), label: '包裹已出库发货' }
          ]
        }
      })

      // 3. 记录履约操作日志
      await tx.orderoperationlog.create({
        data: {
          orderId: input.orderId,
          actionType: '发货处理',
          actionNote: `通过承运商 ${input.trackingCarrier} 发货，单号：${input.trackingNumber}。备注：${input.internalNote || '无'}`,
          operatorName: username
        }
      })
    })
  })
)

/**
 * 录入/追加多段国际物流追踪信息
 */
export const addLogisticsSegment = requireRole([UserRole.ADMIN])(
  withResult(async (input: AddLogisticsSegmentInput): Promise<void> => {
    const { username } = getAuthContext()

    await prisma.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: input.orderId } })
      if (!order) throw new Error('订单不存在')

      // 1. 创建新增的物流段
      await tx.orderlogisticssegment.create({
        data: {
          orderId: input.orderId,
          segmentType: input.segmentType,
          carrierName: input.carrierName,
          trackingNumber: input.trackingNumber,
          statusLabel: input.statusLabel,
          estimatedArrivalAt: input.estimatedArrivalAt ? new Date(input.estimatedArrivalAt) : null,
          remark: input.remark
        }
      })

      // 2. 如果包含预计送达时间，同步更新主订单看板的ETA
      if (input.estimatedArrivalAt) {
        await tx.orderrecord.update({
          where: { id: input.orderId },
          data: { estimatedArrivalAt: new Date(input.estimatedArrivalAt) }
        })
      }

      // 3. 操作记录
      await tx.orderoperationlog.create({
        data: {
          orderId: input.orderId,
          actionType: '物流节点更新',
          actionNote: `更新了 [${input.segmentType}] 物流记录：${input.carrierName || ''} - ${input.statusLabel || ''}`,
          operatorName: username
        }
      })
    })
  })
)

/**
 * 更新订单状态（退款处理、取消等强干预流转）
 */
export const updateOrderStatus = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateOrderStatusInput): Promise<void> => {
    const { username } = getAuthContext()
    const { orderId, newStatus, actionNote } = input

    if (!actionNote.trim()) {
      throw new Error('状态变更必须填写处理备注')
    }

    await prisma.$transaction(async (tx) => {
      const order = await tx.orderrecord.findUnique({ where: { id: orderId } })
      if (!order) throw new Error('订单不存在')

      if (order.status === newStatus) {
        return // 状态无变化，不做处理
      }

      // 1. 更新状态
      await tx.orderrecord.update({
        where: { id: orderId },
        data: { status: newStatus }
      })

      // 2. 写入操作记录，保障记录不可篡改
      await tx.orderoperationlog.create({
        data: {
          orderId,
          actionType: `状态变更 (${order.status} -> ${newStatus})`,
          actionNote,
          operatorName: username
        }
      })
      
      // 若是退款或取消，此处可扩展关联库存回滚等领域逻辑。
      // 当前域约束：购物车/加购的逻辑是创建订单前扣减还是后扣减？若为后，需根据业务补库存。
      // 由于未提供库存回滚确切需求，默认仅改变状态和打日志。
    })
  })
)
