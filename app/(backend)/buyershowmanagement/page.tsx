// {"router": "/buyershowmanagement", "id": "b21", "en_name": "BuyerShowManagement"}
'use client'

import { useBuyerShowManagement } from '@/backend/hooks/useBuyerShowManagement'
import BuyerShowManagementView from '@/backend/components/BuyerShowManagementView'

export default function BuyerShowManagementPage() {
  const { state, handlers } = useBuyerShowManagement()
  return <BuyerShowManagementView state={state} handlers={handlers} />
}
