// {"router": "/brand", "id": "f02d", "en_name": "MobileComing"}
import MobileComingView from '@/frontend/components/MobileComingView'
import { loadStorefrontBootstrap } from '@/frontend/lib/loadStorefrontBootstrap'

/** Coming (ex-Brand tab): static shell + ISR */
export const dynamic = 'force-static'
export const revalidate = 300

export default async function BrandPage() {
  const bootstrap = await loadStorefrontBootstrap()
  return <MobileComingView initialZones={bootstrap.recommendZones} />
}
