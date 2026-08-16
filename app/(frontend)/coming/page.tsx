// {"router": "/coming", "id": "c0m1", "en_name": "MobileComing"}
import MobileComingView from '@/frontend/components/MobileComingView'
import { loadStorefrontBootstrap } from '@/frontend/lib/loadStorefrontBootstrap'

export const dynamic = 'force-static'
export const revalidate = 300

export default async function ComingPage() {
  const bootstrap = await loadStorefrontBootstrap()
  return <MobileComingView initialZones={bootstrap.recommendZones} />
}
