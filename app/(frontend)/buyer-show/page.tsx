// {"router": "/buyer-show", "id": "f13", "en_name": "BuyerShow"}
'use client'

import ServiceInfoPageView from '@/frontend/components/ServiceInfoPageView'
import { SERVICE_PAGE_CONFIG_MAP } from '@/frontend/content/servicePages'

export default function BuyerShowPage() {
  return <ServiceInfoPageView config={SERVICE_PAGE_CONFIG_MAP['buyer-show']} />
}
