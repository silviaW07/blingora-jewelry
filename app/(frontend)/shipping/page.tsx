// {"router": "/shipping", "id": "f11", "en_name": "Shipping"}
'use client'

import ServiceInfoPageView from '@/frontend/components/ServiceInfoPageView'
import { SERVICE_PAGE_CONFIG_MAP } from '@/frontend/content/servicePages'

export default function ShippingPage() {
  return <ServiceInfoPageView config={SERVICE_PAGE_CONFIG_MAP.shipping} />
}
