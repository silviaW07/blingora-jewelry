'use server'

import { withResult } from '@/frontend/action_utils'
import { loadCustomerPromo } from '@/frontend/lib/loadCustomerPromoKind'
import { resolveGoodsCoef } from '@/shared/customerPromoPolicy'

export const getMyGoodsCoef = withResult(async (): Promise<{ coef: number | null }> => {
  const promo = await loadCustomerPromo()
  return { coef: resolveGoodsCoef(promo.kind, promo.vipDiscount) }
})
