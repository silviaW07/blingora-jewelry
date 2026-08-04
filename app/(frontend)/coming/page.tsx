// {"router": "/coming", "id": "c0m1", "en_name": "MobileComing"}
import MobileComingView from '@/frontend/components/MobileComingView'

export const dynamic = 'force-static'
export const revalidate = 300

export default function ComingPage() {
  return <MobileComingView />
}
