// {"router": "/shippingchannelconfig", "id": "b16", "en_name": "ShippingChannelConfig"}
'use client'

import { useShippingChannelConfig } from '@/backend/hooks/useShippingChannelConfig'
import ShippingChannelConfigView from '@/backend/components/ShippingChannelConfigView'

export default function ShippingChannelConfigPage() {
  const { state, handlers } = useShippingChannelConfig()
  return <ShippingChannelConfigView state={state} handlers={handlers} />
}
