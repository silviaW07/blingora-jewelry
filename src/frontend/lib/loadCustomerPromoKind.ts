import prisma from '@/tools/prisma'
import { tryGetAuthContext } from '@/frontend/action_utils'
import { resolveCustomerPromoEligibility } from '@/shared/customerType'
import { parseVipDiscount, type CustomerPromoKind } from '@/shared/customerPromoPolicy'

export type CustomerPromoSnapshot = {
  kind: CustomerPromoKind
  vipDiscount: number
}

async function readVipDiscount(userId: string): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<Array<{ vipDiscount: number | null }>>`
      SELECT vipDiscount FROM sysuser WHERE id = ${userId} LIMIT 1
    `
    return parseVipDiscount(rows?.[0]?.vipDiscount)
  } catch {
    return 0
  }
}

export async function loadCustomerPromo(userId?: string | null): Promise<CustomerPromoSnapshot> {
  const id = String(userId ?? tryGetAuthContext()?.userId ?? '').trim()
  if (!id) return { kind: 'NONE', vipDiscount: 0 }
  const [account, paidOrder, vipDiscount] = await Promise.all([
    prisma.sysuser.findUnique({
      where: { id },
      select: { customerType: true },
    }),
    prisma.orderrecord.findFirst({
      where: { userId: id, status: 'PAID' },
      select: { id: true },
    }),
    readVipDiscount(id),
  ])
  const { isFirstOrderEligible, isLoyalCustomer } = resolveCustomerPromoEligibility({
    customerType: account?.customerType,
    hasPaidOrder: Boolean(paidOrder),
  })
  const kind: CustomerPromoKind = isFirstOrderEligible ? 'FIRST_ORDER' : isLoyalCustomer ? 'LOYAL' : 'NONE'
  return { kind, vipDiscount }
}

export async function loadCustomerPromoKind(userId?: string | null): Promise<CustomerPromoKind> {
  const promo = await loadCustomerPromo(userId)
  return promo.kind
}
