'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/backend/action_utils'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'

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
  customerWhatsapp: string | null // data-from: sysuser-phone
  countryName: string | null   // data-from: useraddress-countryName
  itemSummary: string          // aggregated (如：商品A等共X件)
  itemImageUrl: string | null  // aggregated (取第一个商品的图片)
  totalWeightGrams: number     // aggregated from product.weightGram * qty
  internalNote: string | null  // data-from: orderrecord-internalNote
}

export interface OrderExcelExportRow {
  productId: string
  sku: string
  spu: string
  imageUrl: string
  originalPriceUsd: number
  discountPriceUsd: number
  quantity: number
  totalPriceUsd: number
  costPrice: number | null
  supplierName: string
  supplierUrl: string
  productName: string
  orderNo: string
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
  actionNote?: string           // 列表快捷切换可省略，自动生成备注
}

export interface UpdateOrderRemarkInput {
  orderId: string
  internalNote: string
}

export interface ExportOrdersExcelInput {
  orderIds: string[]
}

export interface ExportOrdersExcelOutput {
  rows: OrderExcelExportRow[]
  fileName: string
}

export interface ExportOrdersExcelFileOutput {
  fileName: string
  /** base64-encoded .xlsx bytes */
  fileBase64: string
  /** whether thumbnails were embedded into cells */
  embeddedThumbnails: boolean
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
      page = 1, pageSize = 50
    } = input

    const safePageSize = Math.max(1, Math.min(200, Math.floor(Number(pageSize) || 50)))
    const skip = (Math.max(1, page) - 1) * safePageSize
    
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
        take: safePageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          address: true,
          items: {
            include: {
              product: { select: { mainImageUrl: true, weightGram: true } }
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

      const totalWeightGrams = record.items.reduce((sum, item) => {
        const unitGrams = item.product?.weightGram != null ? Number(item.product.weightGram) : 0
        return sum + (Number.isFinite(unitGrams) ? unitGrams : 0) * item.quantity
      }, 0)

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
        customerWhatsapp: record.user.phone || null,
        countryName: record.address?.countryName || null,
        itemSummary,
        itemImageUrl: record.items[0]?.product?.mainImageUrl || null,
        totalWeightGrams: Math.round(totalWeightGrams * 100) / 100,
        internalNote: record.internalNote || null,
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
            product: { select: { mainImageUrl: true, weightGram: true } }
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
      note: record.note,
      createdAt: record.createdAt.toISOString(),
      
      customerName: record.user.username,
      customerEmail: record.user.email,
      customerWhatsapp: record.user.phone || null,
      countryName: record.address?.countryName || null,
      itemSummary,
      itemImageUrl: record.items[0]?.product?.mainImageUrl || null,
      totalWeightGrams: Math.round(record.items.reduce((sum, item) => {
        const unitGrams = item.product?.weightGram != null ? Number(item.product.weightGram) : 0
        return sum + (Number.isFinite(unitGrams) ? unitGrams : 0) * item.quantity
      }, 0) * 100) / 100,
      internalNote: record.internalNote || null,

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
    const { orderId, newStatus } = input
    const actionNote = String(input.actionNote || '').trim() || `列表快捷切换状态为 ${newStatus}`

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
    })
  })
)

/**
 * 更新订单内部备注（列表行内编辑）
 */
export const updateOrderRemark = requireRole([UserRole.ADMIN])(
  withResult(async (input: UpdateOrderRemarkInput): Promise<void> => {
    const { username } = getAuthContext()
    const order = await prisma.orderrecord.findUnique({ where: { id: input.orderId } })
    if (!order) throw new Error('订单不存在')

    await prisma.$transaction(async (tx) => {
      await tx.orderrecord.update({
        where: { id: input.orderId },
        data: { internalNote: input.internalNote }
      })
      await tx.orderoperationlog.create({
        data: {
          orderId: input.orderId,
          actionType: '更新订单备注',
          actionNote: input.internalNote?.trim() ? `备注更新为：${input.internalNote}` : '清空订单备注',
          operatorName: username
        }
      })
    })
  })
)

const toUsdAmount = (amount: number, currencyCode: string | null | undefined, usdExchangeRate: number) => {
  if (!Number.isFinite(amount)) return 0
  const code = String(currencyCode || 'USD').toUpperCase()
  if (code === 'USD') return Math.round(amount * 100) / 100
  if (code === 'CNY' || code === 'RMB') return toUsdFromCny(amount, usdExchangeRate)
  return Math.round(amount * 100) / 100
}

function inferExcelImageExtension(contentType: string | null, url: string): 'png' | 'jpeg' | 'gif' | null {
  const ct = String(contentType || '').toLowerCase()
  if (ct.includes('image/png')) return 'png'
  if (ct.includes('image/jpeg') || ct.includes('image/jpg')) return 'jpeg'
  if (ct.includes('image/gif')) return 'gif'
  const u = url.split('?')[0].toLowerCase()
  if (u.endsWith('.png')) return 'png'
  if (u.endsWith('.jpg') || u.endsWith('.jpeg')) return 'jpeg'
  if (u.endsWith('.gif')) return 'gif'
  // Many CDNs omit extension / serve webp; exceljs cannot embed webp — skip (URL kept in hidden col).
  return null
}

async function tryFetchImageBuffer(url: string): Promise<{ buffer: Buffer; extension: 'png' | 'jpeg' | 'gif' } | null> {
  const normalized = String(url || '').trim()
  if (!normalized) return null
  try {
    const requestUrl = normalized.startsWith('/')
      ? new URL(
          normalized,
          process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://sourcingjewelry.com',
        ).toString()
      : normalized
    const res = await fetch(requestUrl, { cache: 'no-store' })
    if (!res.ok) return null
    const ab = await res.arrayBuffer()
    const buffer = Buffer.from(ab)
    const extension = inferExcelImageExtension(res.headers.get('content-type'), requestUrl)
    if (!extension) return null
    return { buffer, extension }
  } catch {
    return null
  }
}

const cleanExcelText = (value: unknown) => String(value ?? '').trim()
const containsChinese = (value: string) => /[\u3400-\u9fff]/.test(value)

function readProductTranslationName(value: unknown, lang: string): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  const root = value as Record<string, unknown>
  const languageValue = root[lang]
  if (languageValue && typeof languageValue === 'object' && !Array.isArray(languageValue)) {
    return cleanExcelText((languageValue as Record<string, unknown>).name)
  }
  return ''
}

function readPreviewProductName(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  return cleanExcelText((value as Record<string, unknown>).name)
}

function resolveChineseExportProductName(params: {
  productNameSnapshot?: string | null
  product?: {
    name?: string | null
    translationsJson?: unknown
    importTaskItems?: Array<{ parsedName?: string | null; previewDataJson?: unknown }>
  } | null
}): string {
  const product = params.product
  const candidates = [
    readProductTranslationName(product?.translationsJson, 'zh'),
    ...(product?.importTaskItems || []).flatMap((row) => [
      cleanExcelText(row.parsedName),
      readPreviewProductName(row.previewDataJson),
    ]),
    cleanExcelText(params.productNameSnapshot),
    cleanExcelText(product?.name),
  ].filter(Boolean)

  return candidates.find(containsChinese) || candidates[0] || ''
}

function resolveSkuSpecification(params: {
  attributeJson?: unknown
  materialLabel?: string | null
  sizeLabel?: string | null
  itemMaterialLabel?: string | null
  itemSizeLabel?: string | null
}): string {
  const attributes = Array.isArray(params.attributeJson)
    ? params.attributeJson
        .map((entry) => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null
          const row = entry as Record<string, unknown>
          const name = cleanExcelText(row.name || row.label || row.key)
          const value = cleanExcelText(row.value || row.labelValue)
          return value ? { name, value } : null
        })
        .filter((entry): entry is { name: string; value: string } => Boolean(entry))
    : []

  const colorPattern = /颜色|顏色|color|colour|款式|style/i
  const sizePattern = /尺寸|尺码|規格|规格|size|length|长度|長度/i
  const color = attributes.find((entry) => colorPattern.test(entry.name))?.value
    || cleanExcelText(params.itemMaterialLabel)
    || cleanExcelText(params.materialLabel)
  const size = attributes.find((entry) => sizePattern.test(entry.name))?.value
    || cleanExcelText(params.itemSizeLabel)
    || cleanExcelText(params.sizeLabel)
  const otherValues = attributes
    .filter((entry) => !colorPattern.test(entry.name) && !sizePattern.test(entry.name))
    .map((entry) => entry.value)

  const values = [color, size, ...otherValues]
    .map(cleanExcelText)
    .filter((value, index, all) => Boolean(value) && all.indexOf(value) === index)
  return values.join('-') || '默认规格'
}

async function buildOrderExcelRows(orderIdsInput: string[]): Promise<ExportOrdersExcelOutput> {
  const orderIds = Array.from(new Set((orderIdsInput || []).filter(Boolean)))
  if (!orderIds.length) throw new Error('请至少选择一笔订单')

  const [usdExchangeRate, orders] = await Promise.all([
    getUsdExchangeRate(prisma),
    prisma.orderrecord.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                mainImageUrl: true,
                costPrice: true,
                supplierName: true,
                source: true,
                name: true,
                translationsJson: true,
                // product 表无 sourceUrl；1688 链接在 importtaskitem.sourceUrl
                importTaskItems: {
                  select: {
                    sourceUrl: true,
                    parsedName: true,
                    previewDataJson: true,
                  },
                  orderBy: { publishedAt: 'desc' },
                  take: 5,
                },
              },
            },
            productSku: {
              select: {
                skuCode: true,
                imageUrl: true,
                attributeJson: true,
                materialLabel: true,
                sizeLabel: true,
                price: true,
                originalPrice: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!orders.length) {
    throw new Error('未找到所选订单，请刷新列表后重试')
  }

  const rows: OrderExcelExportRow[] = []
  for (const order of orders) {
    for (const item of order.items) {
      const unitPrice = item.unitPrice.toNumber()
      const lineAmount = item.lineAmount.toNumber()
      const skuOriginal = item.productSku?.originalPrice != null ? Number(item.productSku.originalPrice) : null
      // SKU price fields are always CNY; order item snapshots use the order currency.
      const originalPriceUsd = skuOriginal != null
        ? toUsdFromCny(skuOriginal, usdExchangeRate)
        : toUsdAmount(unitPrice, order.currencyCode, usdExchangeRate)
      // 无独立折扣价时回退到原价
      const discountPriceUsd =
        skuOriginal != null ? toUsdAmount(unitPrice, order.currencyCode, usdExchangeRate) : originalPriceUsd
      const totalPriceUsd = toUsdAmount(lineAmount, order.currencyCode, usdExchangeRate)
      const importSourceUrl =
        item.product?.importTaskItems?.find((row) => /1688\.com/i.test(String(row.sourceUrl || '')))?.sourceUrl ||
        item.product?.importTaskItems?.[0]?.sourceUrl ||
        ''
      const supplierUrl =
        item.product?.source === 'IMPORT_1688' || /1688\.com/i.test(importSourceUrl) ? importSourceUrl : ''

      rows.push({
        productId: item.productId,
        sku: resolveSkuSpecification({
          attributeJson: item.productSku?.attributeJson,
          materialLabel: item.productSku?.materialLabel,
          sizeLabel: item.productSku?.sizeLabel,
          itemMaterialLabel: item.materialLabel,
          itemSizeLabel: item.sizeLabel,
        }),
        spu: item.product?.productCode || String(item.skuCode || '').split('-')[0] || '',
        imageUrl: item.productSku?.imageUrl || item.product?.mainImageUrl || '',
        originalPriceUsd,
        discountPriceUsd,
        quantity: item.quantity,
        totalPriceUsd,
        costPrice: item.product?.costPrice != null ? Number(item.product.costPrice) : null,
        supplierName: item.product?.supplierName || '',
        supplierUrl,
        productName: resolveChineseExportProductName({
          productNameSnapshot: item.productName,
          product: item.product,
        }),
        orderNo: order.orderNo,
      })
    }
  }

  if (!rows.length) {
    // 常见：勾选了订单但明细为空 / 关联商品缺失导致 include 失败前被吞掉
    // 再兜底用 orderitem 快照直查，避免导出只有表头的空表
    const fallbackItems = await prisma.orderitem.findMany({
      where: { orderId: { in: orderIds } },
      include: {
        order: { select: { orderNo: true, currencyCode: true } },
        product: {
          select: {
            productCode: true,
            mainImageUrl: true,
            costPrice: true,
            supplierName: true,
            name: true,
            translationsJson: true,
          },
        },
        productSku: {
          select: {
            skuCode: true,
            imageUrl: true,
            attributeJson: true,
            materialLabel: true,
            sizeLabel: true,
            price: true,
            originalPrice: true,
          },
        },
      },
    })
    for (const item of fallbackItems) {
      const unitPrice = item.unitPrice.toNumber()
      const lineAmount = item.lineAmount.toNumber()
      const currency = item.order?.currencyCode || 'USD'
      const skuOriginal = item.productSku?.originalPrice != null ? Number(item.productSku.originalPrice) : null
      const originalPriceUsd = skuOriginal != null
        ? toUsdFromCny(skuOriginal, usdExchangeRate)
        : toUsdAmount(unitPrice, currency, usdExchangeRate)
      const discountPriceUsd =
        skuOriginal != null ? toUsdAmount(unitPrice, currency, usdExchangeRate) : originalPriceUsd
      rows.push({
        productId: item.productId,
        sku: resolveSkuSpecification({
          attributeJson: item.productSku?.attributeJson,
          materialLabel: item.productSku?.materialLabel,
          sizeLabel: item.productSku?.sizeLabel,
          itemMaterialLabel: item.materialLabel,
          itemSizeLabel: item.sizeLabel,
        }),
        spu: item.product?.productCode || String(item.skuCode || '').split('-')[0] || '',
        imageUrl: item.productSku?.imageUrl || item.product?.mainImageUrl || '',
        originalPriceUsd,
        discountPriceUsd,
        quantity: item.quantity,
        totalPriceUsd: toUsdAmount(lineAmount, currency, usdExchangeRate),
        costPrice: item.product?.costPrice != null ? Number(item.product.costPrice) : null,
        supplierName: item.product?.supplierName || '',
        supplierUrl: '',
        productName: resolveChineseExportProductName({
          productNameSnapshot: item.productName,
          product: item.product,
        }),
        orderNo: item.order?.orderNo || '',
      })
    }
  }

  if (!rows.length) {
    throw new Error('所选订单没有可导出的商品明细（可能明细为空）。请换一笔有商品的订单再试。')
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return {
    rows,
    fileName:
      orderIds.length === 1
        ? `order-export-${orders[0]?.orderNo || stamp}.xlsx`
        : `orders-export-${stamp}.xlsx`,
  }
}

async function buildOrderExcelFile(orderIds: string[]): Promise<ExportOrdersExcelFileOutput> {
  const { rows, fileName } = await buildOrderExcelRows(orderIds)

  let ExcelJS: any
  try {
    ExcelJS = (await import('exceljs')).default
  } catch {
    const XLSX = await import('xlsx')
    const sheetRows = rows.map((row) => ({
      '商品 ID': row.productId,
      SKU: row.sku,
      SPU: row.spu,
      图片: row.imageUrl,
      '原价(美金)': row.originalPriceUsd,
      '折扣价(美金)': row.discountPriceUsd ?? row.originalPriceUsd,
      数量: row.quantity,
      '总价(美金)': row.totalPriceUsd,
      采购价: row.costPrice ?? '',
      供应商名称: row.supplierName,
      供应商链接: row.supplierUrl,
      商品名称: row.productName,
    }))
    const worksheet = XLSX.utils.json_to_sheet(sheetRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '订单明细')
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    return {
      fileName,
      fileBase64: Buffer.from(buf).toString('base64'),
      embeddedThumbnails: false,
    }
  }

  const workbook = new ExcelJS.Workbook()
  workbook.created = new Date()
  const worksheet = workbook.addWorksheet('订单明细', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  worksheet.columns = [
    { header: '商品 ID', key: 'productId', width: 18 },
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'SPU', key: 'spu', width: 18 },
    { header: '图片', key: 'image', width: 27 },
    { header: '__图片链接URL', key: 'imageUrlRaw', width: 40, hidden: true },
    { header: '原价(美金)', key: 'originalPriceUsd', width: 14 },
    { header: '折扣价(美金)', key: 'discountPriceUsd', width: 14 },
    { header: '数量', key: 'quantity', width: 10 },
    { header: '总价(美金)', key: 'totalPriceUsd', width: 14 },
    { header: '采购价', key: 'costPrice', width: 12 },
    { header: '供应商名称', key: 'supplierName', width: 18 },
    { header: '供应商链接', key: 'supplierUrl', width: 40 },
    { header: '商品名称（中文）', key: 'productName', width: 55 },
  ]

  const headerRow = worksheet.getRow(1)
  headerRow.height = 28
  headerRow.font = { bold: true, size: 12 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  for (const row of rows) {
    worksheet.addRow({
      productId: row.productId,
      sku: row.sku,
      spu: row.spu,
      image: '',
      imageUrlRaw: row.imageUrl,
      originalPriceUsd: row.originalPriceUsd,
      discountPriceUsd: row.discountPriceUsd ?? row.originalPriceUsd,
      quantity: row.quantity,
      totalPriceUsd: row.totalPriceUsd,
      costPrice: row.costPrice ?? '',
      supplierName: row.supplierName,
      supplierUrl: row.supplierUrl,
      productName: row.productName,
    })
  }

  const imageColIndex = worksheet.getColumn('image').number
  const imageUrlRawColIndex = worksheet.getColumn('imageUrlRaw').number
  worksheet.getColumn(imageColIndex).alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getColumn(imageUrlRawColIndex).hidden = true

  // Embed procurement-sized SKU images into the "图片" column.
  const imageIdByUrl = new Map<string, number>()
  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2 // 1-based row index; row 1 is header
    const excelRow = worksheet.getRow(rowNumber)
    excelRow.height = 132
    excelRow.alignment = { vertical: 'middle', wrapText: true }

    const imageUrl = rows[i]?.imageUrl || ''
    let imageId = imageIdByUrl.get(imageUrl)
    if (imageId == null) {
      const img = await tryFetchImageBuffer(imageUrl)
      if (!img) continue
      imageId = workbook.addImage({
        buffer: img.buffer,
        extension: img.extension,
      })
      imageIdByUrl.set(imageUrl, imageId)
    }
    worksheet.addImage(imageId, {
      tl: { col: imageColIndex - 1 + 0.08, row: rowNumber - 1 + 0.08 },
      ext: { width: 168, height: 168 },
      editAs: 'oneCell',
    })
  }

  const out = await workbook.xlsx.writeBuffer()
  const fileBase64 = Buffer.from(out as any).toString('base64')
  return { fileName, fileBase64, embeddedThumbnails: true }
}

/**
 * 导出订单明细 Excel（服务端生成；“图片”列优先内嵌 SKU 大图）
 */
export const exportOrdersExcel = requireRole([UserRole.ADMIN])(
  withResult(async (input: ExportOrdersExcelInput): Promise<ExportOrdersExcelFileOutput> => {
    return buildOrderExcelFile(input.orderIds || [])
  }),
)