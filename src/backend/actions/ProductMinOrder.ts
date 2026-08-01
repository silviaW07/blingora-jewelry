'use server'

import prisma from '@/tools/prisma'
import { requireRole, UserRole, withResult } from '@/backend/action_utils'

export interface BatchUpdateMinOrderQtyInput {
  product_ids?: string[]
  sku_ids?: string[]
  min_order_qty: number
}

export interface BatchOperateOutput {
  success_count: number
  fail_count: number
}

const normalizeProductMinOrderQty = (tradeInfoJson: unknown, nextValue?: number) => {
  const current = (tradeInfoJson as Record<string, unknown> | null) || {}
  return {
    ...current,
    minOrderQty: Math.max(1, Number(nextValue ?? current.minOrderQty ?? 1) || 1),
  }
}

const resolveEffectiveSkuMinOrderQty = (productMinOrderQty: number, skuMinOrderQty: unknown) => {
  const raw = Number(skuMinOrderQty ?? 0)
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : productMinOrderQty
}

async function syncCartItemsValidState(tx: any, productId: string) {
  const items = await tx.cartitem.findMany({
    where: { productId },
    include: {
      product: { select: { status: true, tradeInfoJson: true, category: { select: { status: true } } } },
      productSku: { select: { stock: true, minOrderQty: true } }
    }
  })

  const totalQty = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
  const productMinOrderQty = Math.max(1, Number((items[0]?.product?.tradeInfoJson as any)?.minOrderQty ?? 0) || 1)

  for (const item of items) {
    const effectiveSkuMinOrderQty = resolveEffectiveSkuMinOrderQty(productMinOrderQty, item.productSku.minOrderQty)
    const isValid =
      item.product.status === 'ACTIVE' &&
      item.product.category.status === 'ACTIVE' &&
      item.productSku.stock >= item.quantity &&
      item.quantity >= effectiveSkuMinOrderQty &&
      totalQty >= productMinOrderQty
    const targetStatus = isValid ? 'VALID' : 'INVALID'
    if (item.status !== targetStatus) {
      await tx.cartitem.update({ where: { id: item.id }, data: { status: targetStatus } })
    }
  }
}

export const batchUpdateMinOrderQty = requireRole([UserRole.ADMIN])(
  withResult(async (input: BatchUpdateMinOrderQtyInput): Promise<BatchOperateOutput> => {
    const productIds = Array.from(new Set((input.product_ids || []).filter(Boolean)))
    const skuIds = Array.from(new Set((input.sku_ids || []).filter(Boolean)))
    if (!productIds.length && !skuIds.length) throw new Error('请先选择商品或 SKU')
    const nextValue = Math.max(1, Math.round(Number(input.min_order_qty)))
    if (!Number.isFinite(nextValue) || nextValue <= 0) throw new Error('起订量必须大于 0')

    let success = 0
    let fail = 0

    for (const productId of productIds) {
      try {
        await prisma.$transaction(async (tx) => {
          const product = await tx.product.findUnique({ where: { id: productId }, select: { tradeInfoJson: true } })
          if (!product) throw new Error('商品不存在')
          await tx.product.update({
            where: { id: productId },
            data: { tradeInfoJson: normalizeProductMinOrderQty(product.tradeInfoJson, nextValue) as any },
          })
          await syncCartItemsValidState(tx, productId)
        })
        success += 1
      } catch {
        fail += 1
      }
    }

    for (const skuId of skuIds) {
      try {
        await prisma.$transaction(async (tx) => {
          const sku = await tx.productsku.findUnique({ where: { id: skuId }, select: { productId: true } })
          if (!sku) throw new Error('SKU 不存在')
          await tx.productsku.update({ where: { id: skuId }, data: { minOrderQty: nextValue } })
          await syncCartItemsValidState(tx, sku.productId)
        })
        success += 1
      } catch {
        fail += 1
      }
    }

    return { success_count: success, fail_count: fail }
  })
)
