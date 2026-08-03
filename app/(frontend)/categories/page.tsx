// {"router": "/categories", "id": "f02c", "en_name": "MobileCategories"}
import MobileCategoriesView from '@/frontend/components/MobileCategoriesView'

export const revalidate = 300

export default function CategoriesPage() {
  return <MobileCategoriesView />
}
