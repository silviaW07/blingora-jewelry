// {"router": "/pricingpromotionmanagement", "id": "b17", "en_name": "PricingPromotionManagement"}
'use client'

import { usePricingPromotionManagement } from '@/backend/hooks/usePricingPromotionManagement'
import PricingPromotionManagementView from '@/backend/components/PricingPromotionManagementView'

export default function PricingPromotionManagementPage() {
  const { state, handlers } = usePricingPromotionManagement()
  return <PricingPromotionManagementView state={state} handlers={handlers} />
}

