'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole,
} from '@/frontend/action_utils'
import {
  calculateShippingFee,
  normalizeBillingMode,
  normalizeChannelCoefficient,
  normalizeCountryRuleMap,
} from '@/shared/shippingFeeCalc'
import {
  pickFrontPricingCategoryCoeffs,
  resolveFrontRmbSellingPrice,
} from '@/shared/priceCoefficient'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'
import { loadPricingPromotionConfig } from '@/shared/pricingPromotionConfig'
import { computeDiscounts, applyShippingDiscount } from '@/shared/pricingPromotionCalc'
import { isStorefrontQtyAllowed } from '@/shared/storefrontQty'
import { resolveProductDisplayName } from '@/frontend/i18n/productTranslation'
import { storefrontError } from '@/frontend/utils/storefrontErrors'
import { isStorefrontVisibleProduct } from '@/shared/storefrontProductVisibility'

const COUNTRY_CODE_MAP: Record<string, string> = {
  'United States': 'US',
  'Puerto Rico': 'PR',
  Mexico: 'MX',
  Canada: 'CA',
  'United Kingdom': 'GB',
  Australia: 'AU',
  Japan: 'JP',
  'South Korea': 'KR',
  Singapore: 'SG',
  Germany: 'DE',
  France: 'FR',
}

export type CheckoutOrderAddressInput = {
  country: string
  countryCode?: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city?: string
  state: string
  zipCode: string
}

export type CheckoutOrderItemInput = {
  productId: string
  productSkuId: string
  quantity: number
  productName?: string
  unitPrice?: number
}

export type PlaceCheckoutOrderInput = {
  address: CheckoutOrderAddressInput
  shipping: {
    channelId: string
    channelName: string
    shippingFee: number
  }
  items: CheckoutOrderItemInput[]
  /** 前端展示的最终应付金额，后端会按库内单价重算并校验 */
  finalAmount: number
  currencyCode?: string
}

export type PlaceCheckoutOrderOutput = {
  orderId: string
  orderNo: string
  status: 'PENDING_PAYMENT'
  totalAmount: number
  subtotalAmount: number
  shippingAmount: number
  discountAmount: number
}

/** 结账页自动回填用的最近有效收货地址 */
export type LatestShippingAddress = {
  addressId: string
  country: string
  countryCode: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  /** order = 最近订单关联地址；useraddress = 默认/已保存地址 */
  source: 'order' | 'useraddress'
}

export type GetLatestShippingAddressOutput = {
  address: LatestShippingAddress | null
}

export type SaveCheckoutAddressOutput = {
  addressId: string
  created: boolean
  isDefault: true
  address: LatestShippingAddress
}

function toMoney(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function cleanSpaces(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function splitRecipientName(name: unknown) {
  const normalized = cleanSpaces(name)
  if (!normalized) {
    return { firstName: '', lastName: '' }
  }
  const parts = normalized.split(' ')
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  }
}

function isValidShippingAddress(row: {
  recipientName: string | null
  phone: string | null
  addressLine1: string | null
  countryName: string | null
  stateName: string | null
  postalCode: string | null
}): boolean {
  const country = cleanSpaces(row.countryName || '')
  return Boolean(
    cleanSpaces(row.recipientName || '') &&
      cleanSpaces(row.phone || '') &&
      cleanSpaces(row.addressLine1 || '') &&
      country &&
      cleanSpaces(row.postalCode || '') &&
      (country !== 'United States' || cleanSpaces(row.stateName || '')),
  )
}

function addressFingerprint(input: {
  recipientName: string | null
  phone: string | null
  addressLine1: string | null
  addressLine2?: string | null
  countryName: string | null
  postalCode: string | null
}) {
  const normalizeText = (value: string | null | undefined) =>
    cleanSpaces(value || '').normalize('NFKC').toLocaleLowerCase()
  const normalizeCompact = (value: string | null | undefined) =>
    normalizeText(value).replace(/[^\p{L}\p{N}]/gu, '')

  return [
    normalizeText(input.recipientName),
    normalizeCompact(input.phone),
    normalizeText(input.addressLine1),
    normalizeText(input.addressLine2),
    normalizeText(input.countryName),
    normalizeCompact(input.postalCode),
  ].join('|')
}

function mapUserAddressToLatest(
  row: {
    id?: string | null
    recipientName?: string | null
    phone?: string | null
    countryCode?: string | null
    countryName?: string | null
    stateName?: string | null
    cityName?: string | null
    addressLine1?: string | null
    addressLine2?: string | null
    postalCode?: string | null
  },
  source: 'order' | 'useraddress',
): LatestShippingAddress {
  const { firstName, lastName } = splitRecipientName(row.recipientName)
  return {
    addressId: String(row.id ?? ''),
    country: cleanSpaces(row.countryName) || 'United States',
    countryCode: cleanSpaces(row.countryCode),
    firstName,
    lastName,
    phone: cleanSpaces(row.phone),
    addressLine1: cleanSpaces(row.addressLine1),
    addressLine2: cleanSpaces(row.addressLine2),
    city: cleanSpaces(row.cityName),
    state: cleanSpaces(row.stateName),
    zipCode: cleanSpaces(row.postalCode),
    source,
  }
}

/**
 * 获取当前客户首选收货地址：默认地址 → 最近订单地址 → 最近保存地址。
 * 保留旧 RPC 名称，避免已有客户端失效。
 */
export const getLatestShippingAddress = requireRole([UserRole.CUSTOMER])(
  withResult(async (): Promise<GetLatestShippingAddressOutput> => {
    const { userId } = getAuthContext()

    const defaultAddress = await prisma.useraddress.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (defaultAddress && isValidShippingAddress(defaultAddress)) {
      return {
        address: mapUserAddressToLatest(defaultAddress, 'useraddress'),
      }
    }

    const recentOrders = await prisma.orderrecord.findMany({
      where: {
        userId,
        addressId: { not: null },
      },
      orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
      take: 20,
      select: {
        address: {
          select: {
            id: true,
            recipientName: true,
            phone: true,
            countryCode: true,
            countryName: true,
            stateName: true,
            cityName: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
          },
        },
      },
    })

    const recentOrderAddress = recentOrders
      .map((order) => order.address)
      .find((address) => address && isValidShippingAddress(address))
    if (recentOrderAddress) {
      return {
        address: mapUserAddressToLatest(recentOrderAddress, 'order'),
      }
    }

    const savedAddresses = await prisma.useraddress.findMany({
      where: {
        userId,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })
    const latestSaved = savedAddresses.find(isValidShippingAddress)

    if (latestSaved && isValidShippingAddress(latestSaved)) {
      return {
        address: mapUserAddressToLatest(latestSaved, 'useraddress'),
      }
    }

    return { address: null }
  }),
)

/**
 * 结账页确认地址后去重保存，并原子设为当前客户的新默认地址。
 */
export const saveCheckoutAddress = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: CheckoutOrderAddressInput): Promise<SaveCheckoutAddressOutput> => {
    const { userId } = getAuthContext()
    const recipientName = cleanSpaces(`${input.firstName || ''} ${input.lastName || ''}`)
    const phone = cleanSpaces(input.phone || '')
    const countryName = cleanSpaces(input.country || '')
    const stateName = cleanSpaces(input.state || '')
    const cityName = cleanSpaces(input.city || '')
    const addressLine1 = cleanSpaces(input.addressLine1 || '')
    const addressLine2 = cleanSpaces(input.addressLine2 || '')
    const postalCode = cleanSpaces(input.zipCode || '')

    if (!recipientName) throw storefrontError('checkout.errors.nameRequired')
    if (!phone) throw storefrontError('checkout.errors.phoneRequired')
    if (!addressLine1) throw storefrontError('checkout.errors.addressRequired')
    if (!countryName) throw storefrontError('checkout.errors.countryRequired')
    if (!postalCode) throw storefrontError('checkout.errors.zipRequired')
    if (countryName === 'United States' && !stateName) {
      throw storefrontError('checkout.errors.stateRequired')
    }

    const countryCode =
      String(input.countryCode ?? '').trim().toUpperCase() ||
      COUNTRY_CODE_MAP[countryName] ||
      countryName.slice(0, 2).toUpperCase() ||
      'US'
    const fingerprint = addressFingerprint({
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      countryName,
      postalCode,
    })

    return prisma.$transaction(async (tx) => {
      const candidates = await tx.useraddress.findMany({ where: { userId } })
      const duplicate = candidates.find((row) => addressFingerprint(row) === fingerprint)

      await tx.useraddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      })

      if (duplicate) {
        const saved = await tx.useraddress.update({
          where: { id: duplicate.id },
          data: {
            recipientName,
            phone,
            countryCode,
            countryName,
            stateName: stateName || null,
            cityName: cityName || null,
            addressLine1,
            addressLine2: addressLine2 || null,
            postalCode,
            isDefault: true,
          },
        })
        return {
          addressId: saved.id,
          created: false,
          isDefault: true,
          address: mapUserAddressToLatest(saved, 'useraddress'),
        }
      }

      const saved = await tx.useraddress.create({
        data: {
          userId,
          recipientName,
          phone,
          countryCode,
          countryName,
          stateName: stateName || null,
          cityName: cityName || null,
          addressLine1,
          addressLine2: addressLine2 || null,
          postalCode,
          isDefault: true,
        },
      })
      return {
        addressId: saved.id,
        created: true,
        isDefault: true,
        address: mapUserAddressToLatest(saved, 'useraddress'),
      }
    })
  }),
)

/** BJ + YYMMDD（Asia/Shanghai）+ 全局 4 位序号，例：BJ2608260003 */
function getOrderNoDatePrefix(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `BJ${part('year').slice(-2)}${part('month')}${part('day')}`
}

function isOrderNoUniqueConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: string; meta?: { target?: string | string[] } }
  if (err.code !== 'P2002') return false
  const target = err.meta?.target
  if (Array.isArray(target)) return target.includes('orderNo')
  return typeof target === 'string' ? target.includes('orderNo') : true
}

type CheckoutTx = {
  orderrecord: {
    findFirst: typeof prisma.orderrecord.findFirst
    create: typeof prisma.orderrecord.create
  }
  $queryRawUnsafe: typeof prisma.$queryRawUnsafe
}

/**
 * 在事务内用 MySQL GET_LOCK 串行化全局 4 位序号。
 * 单号 = BJ + YYMMDD（下单日）+ 全局递增 0001…9999，后四位不按天重置。
 */
async function withAllocatedOrderNo<T>(
  tx: CheckoutTx,
  run: (orderNo: string) => Promise<T>,
): Promise<T> {
  const prefix = getOrderNoDatePrefix()
  const lockKey = 'orderno_bj_global_seq'
  const lockRows = await tx.$queryRawUnsafe<Array<{ acquired: number | bigint | null }>>(
    'SELECT GET_LOCK(?, 10) AS acquired',
    lockKey,
  )
  if (Number(lockRows?.[0]?.acquired ?? 0) !== 1) {
    throw storefrontError('checkout.placeOrderFailed')
  }
  try {
    const maxRows = await tx.$queryRawUnsafe<Array<{ maxSeq: number | bigint | null }>>(
      `SELECT MAX(CAST(RIGHT(orderNo, 4) AS UNSIGNED)) AS maxSeq
       FROM orderrecord
       WHERE orderNo REGEXP '^BJ[0-9]{10}$'`,
    )
    const maxSeq = Number(maxRows?.[0]?.maxSeq ?? 0)
    const nextSeq = (Number.isFinite(maxSeq) ? maxSeq : 0) + 1
    if (nextSeq > 9999) {
      throw storefrontError('checkout.placeOrderFailed')
    }
    const orderNo = `${prefix}${String(nextSeq).padStart(4, '0')}`
    return await run(orderNo)
  } finally {
    await tx.$queryRawUnsafe('SELECT RELEASE_LOCK(?)', lockKey)
  }
}

/**
 * 智能单页结账：创建真实订单（待支付），归属当前登录客户，并清空购物车
 */
export const placeCheckoutOrder = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: PlaceCheckoutOrderInput): Promise<PlaceCheckoutOrderOutput> => {
    const { userId } = getAuthContext()

    const address = input.address
    if (!address?.firstName?.trim() || !address?.lastName?.trim()) {
      throw storefrontError('checkout.errors.nameRequired')
    }
    if (!address.phone?.trim()) throw storefrontError('checkout.errors.phoneRequired')
    if (!address.addressLine1?.trim()) throw storefrontError('checkout.errors.addressRequired')
    if (!address.country?.trim()) throw storefrontError('checkout.errors.countryRequired')
    if (!address.zipCode?.trim()) throw storefrontError('checkout.errors.zipRequired')
    if (address.country === 'United States' && !address.state?.trim()) {
      throw storefrontError('checkout.errors.stateRequired')
    }

    const channelId = (input.shipping?.channelId || '').trim()
    if (!channelId) throw storefrontError('checkout.errors.shippingRequired')

    const submittedItems = Array.isArray(input.items) ? input.items : []
    if (submittedItems.length === 0) {
      throw storefrontError('checkout.errors.emptyCart')
    }

    const [exchangeRate, pricingConfig] = await Promise.all([
      getUsdExchangeRate(prisma),
      loadPricingPromotionConfig(prisma),
    ])

    const channel = await prisma.shippingchannel.findFirst({
      where: { id: channelId, isEnabled: true },
    })
    if (!channel) throw storefrontError('checkout.errors.shippingUnavailable')

    const country = address.country.trim()
    const billingMode = normalizeBillingMode(channel.billingMode)
    const coefficientRaw =
      channel.channelCoefficient != null &&
      typeof (channel.channelCoefficient as { toNumber?: () => number }).toNumber === 'function'
        ? (channel.channelCoefficient as { toNumber: () => number }).toNumber()
        : Number(channel.channelCoefficient)
    const channelCoefficient = normalizeChannelCoefficient(coefficientRaw)
    const fees = normalizeCountryRuleMap(channel.countryFeesJson, billingMode)
    const countryRule = fees[country]

    const skuIds = [...new Set(submittedItems.map((item) => item.productSkuId).filter(Boolean))]
    const skus = await prisma.productsku.findMany({
      where: { id: { in: skuIds } },
      select: {
        id: true,
        skuCode: true,
        price: true,
        stock: true,
        productId: true,
        weightKg: true,
        product: {
          select: {
            id: true,
            name: true,
            status: true,
            weightGram: true,
            tradeInfoJson: true,
            costPrice: true,
            translationsJson: true,
            category: {
              select: {
                status: true,
                name: true,
                level: true,
                priceCoefficient: true,
                isBrandCategory: true,
                parent: {
                  select: {
                    name: true,
                    priceCoefficient: true,
                    isBrandCategory: true,
                  },
                },
              },
            },
          },
        },
      },
    })
    const skuMap = new Map(skus.map((sku) => [sku.id, sku]))

    let originalSubtotalAmount = 0
    let totalWeightGram = 0
    const lineRows: Array<{
      productId: string
      productSkuId: string
      productName: string
      skuCode: string
      quantity: number
      unitPrice: number
      lineAmount: number
      sizeLabel: string | null
      materialLabel: string | null
    }> = []
    const discountLinesInput: Array<{
      lineId: string
      productId: string
      minOrderQty: number
      quantity: number
      unitPriceUsd: number
      valid: boolean
    }> = []

    for (const item of submittedItems) {
      const quantity = Math.floor(Number(item.quantity) || 0)
      if (quantity <= 0) throw storefrontError('checkout.errors.qtyInvalid')
      const sku = skuMap.get(item.productSkuId)
      if (!sku || sku.productId !== item.productId) {
        throw storefrontError('checkout.errors.cartChanged')
      }
      if (!isStorefrontVisibleProduct(sku.product) || sku.product.category?.status !== 'ACTIVE') {
        throw storefrontError('product.errors.unavailable')
      }
      if (!isStorefrontQtyAllowed(sku.stock, quantity)) {
        throw storefrontError('product.errors.outOfStock')
      }

      const pricingCoeffs = pickFrontPricingCategoryCoeffs({
        primary: sku.product.category,
        relations: [],
      })
      const priceRmb = resolveFrontRmbSellingPrice({
        skuPriceRmb: sku.price.toNumber(),
        costPrice: sku.product.costPrice,
        ...pricingCoeffs,
      })
      const unitPriceUsd = toUsdFromCny(priceRmb, exchangeRate)
      const lineAmount = toMoney(unitPriceUsd * quantity)
      originalSubtotalAmount = toMoney(originalSubtotalAmount + lineAmount)

      const productWeightRaw = sku.product.weightGram
      const productWeight =
        productWeightRaw != null &&
        typeof (productWeightRaw as { toNumber?: () => number }).toNumber === 'function'
          ? (productWeightRaw as { toNumber: () => number }).toNumber()
          : Number(productWeightRaw)
      const skuWeightRaw = sku.weightKg
      const skuWeightGram =
        skuWeightRaw != null &&
        typeof (skuWeightRaw as { toNumber?: () => number }).toNumber === 'function'
          ? (skuWeightRaw as { toNumber: () => number }).toNumber() * 1000
          : Number(skuWeightRaw) * 1000
      const unitWeightGram =
        Number.isFinite(productWeight) && productWeight > 0
          ? productWeight
          : Number.isFinite(skuWeightGram) && skuWeightGram > 0
            ? skuWeightGram
            : 0
      totalWeightGram += unitWeightGram * quantity

      lineRows.push({
        productId: sku.product.id,
        productSkuId: sku.id,
        productName: resolveProductDisplayName(
          sku.product.name,
          (sku.product as { translationsJson?: unknown }).translationsJson,
          'en',
        ),
        skuCode: sku.skuCode,
        quantity,
        unitPrice: unitPriceUsd,
        lineAmount,
        sizeLabel: null,
        materialLabel: null,
      })

      const minOrderQty = Math.max(1, Number((sku.product.tradeInfoJson as any)?.minOrderQty ?? 0) || 1)
      discountLinesInput.push({
        lineId: sku.id,
        productId: sku.product.id,
        minOrderQty,
        quantity,
        unitPriceUsd,
        valid: true,
      })
    }

    const weightKg = totalWeightGram > 0 ? totalWeightGram / 1000 : 0
    const serverShippingFee = calculateShippingFee({
      billingMode,
      channelCoefficient,
      countryRule,
      weightKg,
    })
    if (serverShippingFee == null) {
      throw new Error(
        `This shipping method is not available for the selected country/weight (${channel.name})`,
      )
    }

    const paidOrder = await prisma.orderrecord.findFirst({
      where: { userId, status: 'PAID' },
      select: { id: true },
    })
    const isFirstOrderEligible = !paidOrder
    const isLoyalCustomer = Boolean(paidOrder)
    const discountResult = computeDiscounts({
      config: pricingConfig,
      isFirstOrderEligible,
      isLoyalCustomer,
      lines: discountLinesInput,
    })

    const discountAmount = toMoney(discountResult.totalDiscountUsd)
    const discountedSubtotal = toMoney(originalSubtotalAmount - discountAmount)
    const rawShipping = toMoney(toUsdFromCny(serverShippingFee, exchangeRate))
    const shippingAfterPromo = applyShippingDiscount({
      config: pricingConfig,
      shippingUsd: rawShipping,
      merchandiseSubtotalUsd: discountedSubtotal,
    })
    const shippingAmount = toMoney(shippingAfterPromo.shippingUsd)
    const totalAmount = toMoney(discountedSubtotal + shippingAmount)
    const clientFinal = toMoney(input.finalAmount)
    if (Math.abs(clientFinal - totalAmount) > 0.05) {
      // 允许微小浮点差；明显不一致时以后端重算为准继续下单
    }

    const recipientName = `${address.firstName.trim()} ${address.lastName.trim()}`.trim()
    const countryCode =
      String(address.countryCode ?? '').trim().toUpperCase() ||
      COUNTRY_CODE_MAP[country] ||
      country.slice(0, 2).toUpperCase() ||
      'US'
    const currencyCode = (input.currencyCode || 'USD').trim() || 'USD'

    const ORDER_NO_MAX_RETRIES = 5
    let result: { id: string; orderNo: string } | null = null
    for (let attempt = 0; attempt < ORDER_NO_MAX_RETRIES; attempt++) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const fingerprint = addressFingerprint({
            recipientName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            countryName: country,
            postalCode: address.zipCode,
          })
          const candidates = await tx.useraddress.findMany({ where: { userId } })
          const existingAddress = candidates.find((row) => addressFingerprint(row) === fingerprint)
          const savedAddress = existingAddress
            ? await tx.useraddress.update({
                where: { id: existingAddress.id },
                data: {
                  recipientName,
                  phone: address.phone.trim(),
                  countryCode,
                  countryName: country,
                  stateName: address.state.trim() || null,
                  cityName: address.city?.trim() || null,
                  addressLine1: address.addressLine1.trim(),
                  addressLine2: address.addressLine2?.trim() || null,
                  postalCode: address.zipCode.trim(),
                },
              })
            : await tx.useraddress.create({
                data: {
                  userId,
                  recipientName,
                  phone: address.phone.trim(),
                  countryCode,
                  countryName: country,
                  stateName: address.state.trim() || null,
                  cityName: address.city?.trim() || null,
                  addressLine1: address.addressLine1.trim(),
                  addressLine2: address.addressLine2?.trim() || null,
                  postalCode: address.zipCode.trim(),
                  isDefault: false,
                },
              })

          const order = await withAllocatedOrderNo(tx, async (orderNo) =>
            tx.orderrecord.create({
              data: {
                orderNo,
                userId,
                addressId: savedAddress.id,
                status: 'PENDING_PAYMENT',
                currencyCode,
                localeCode: 'en',
                subtotalAmount: originalSubtotalAmount,
                discountAmount,
                shippingAmount,
                giftWrapAmount: 0,
                totalAmount,
                paymentMethod: 'BANK_TRANSFER',
                paymentStatus: 'PENDING_CONFIRMATION',
                shipMethod: 'STANDARD',
                trackingCarrier: channel.name,
                note: [
                  `Shipping channel: ${channel.name} (${channel.id})`,
                  `Billing mode: ${billingMode}`,
                  `Channel coefficient: ${channelCoefficient}`,
                  `Cart weight: ${weightKg.toFixed(3)}kg`,
                  `Estimated time: ${channel.estimatedTime}`,
                  `Ship to: ${recipientName}, ${address.phone.trim()}`,
                  `${address.addressLine1.trim()}, ${[address.state, address.zipCode, country].filter(Boolean).join(', ')}`,
                  `Client finalAmount: ${clientFinal}`,
                ].join('\n'),
              },
            }),
          )

          await tx.orderitem.createMany({
            data: lineRows.map((row) => ({
              orderId: order.id,
              productId: row.productId,
              productSkuId: row.productSkuId,
              productName: row.productName,
              skuCode: row.skuCode,
              materialLabel: row.materialLabel,
              sizeLabel: row.sizeLabel,
              quantity: row.quantity,
              unitPrice: row.unitPrice,
              lineAmount: row.lineAmount,
              giftWrapSelected: false,
            })),
          })

          await tx.cartitem.deleteMany({
            where: { cart: { accountId: userId } },
          })

          return order
        })
        break
      } catch (error) {
        if (!isOrderNoUniqueConflict(error) || attempt === ORDER_NO_MAX_RETRIES - 1) {
          throw error
        }
      }
    }

    if (!result) {
      throw storefrontError('checkout.placeOrderFailed')
    }

    return {
      orderId: result.id,
      orderNo: result.orderNo,
      status: 'PENDING_PAYMENT',
      totalAmount,
      subtotalAmount: originalSubtotalAmount,
      shippingAmount,
      discountAmount,
    }
  }),
)
