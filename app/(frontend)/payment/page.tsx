// {"router": "/payment", "id": "f12", "en_name": "Payment"}
'use client'

import ServiceInfoPageView from '@/frontend/components/ServiceInfoPageView'
import { SERVICE_PAGE_CONFIG_MAP } from '@/frontend/content/servicePages'

export default function PaymentPage() {
  return <ServiceInfoPageView config={SERVICE_PAGE_CONFIG_MAP.payment} />
}
