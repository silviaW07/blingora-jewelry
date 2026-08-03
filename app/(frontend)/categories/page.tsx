// {"router": "/categories", "id": "f02c", "en_name": "MobileCategories"}
import MobileCategoriesView from '@/frontend/components/MobileCategoriesView'

/**
 * Mobile categories browse — fixed path (no [slug]).
 * `generateStaticParams` is not used; force static shell + ISR instead.
 */
export const dynamic = 'force-static'
export const revalidate = 300

export default function CategoriesPage() {
  return <MobileCategoriesView />
}
