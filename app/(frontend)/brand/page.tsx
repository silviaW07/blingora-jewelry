// {"router": "/brand", "id": "f02d", "en_name": "MobileBrand"}
import MobileBrandView from '@/frontend/components/MobileBrandView'

export const revalidate = 300

export default function BrandPage() {
  return <MobileBrandView />
}
