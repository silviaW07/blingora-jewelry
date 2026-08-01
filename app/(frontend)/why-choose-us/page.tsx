// {"router": "/why-choose-us", "id": "f14", "en_name": "WhyChooseUs"}
'use client'

import ServiceInfoPageView from '@/frontend/components/ServiceInfoPageView'
import { SERVICE_PAGE_CONFIG_MAP } from '@/frontend/content/servicePages'

export default function WhyChooseUsPage() {
  return <ServiceInfoPageView config={SERVICE_PAGE_CONFIG_MAP['why-choose-us']} />
}
