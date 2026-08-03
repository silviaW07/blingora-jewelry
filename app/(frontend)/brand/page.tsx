// {"router": "/brand", "id": "f02d", "en_name": "MobileBrand"}
import MobileBrandView from '@/frontend/components/MobileBrandView'

/** Mobile brand browse — fixed path; static shell + ISR. */
export const dynamic = 'force-static'
export const revalidate = 300

export default function BrandPage() {
  return <MobileBrandView />
}
