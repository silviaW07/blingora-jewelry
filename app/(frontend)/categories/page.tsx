// {"router": "/categories", "id": "f02c", "en_name": "MobileCategories"}
import MobileCategoriesView from '@/frontend/components/MobileCategoriesView'
import { loadStorefrontBootstrap } from '@/frontend/lib/loadStorefrontBootstrap'

/**
 * Mobile categories browse — fixed path (no [slug]).
 * ISR HTML includes the category tree so Chrome does not wait on RPC.
 */
export const dynamic = 'force-static'
export const revalidate = 300

export default async function CategoriesPage() {
  const bootstrap = await loadStorefrontBootstrap()
  return (
    <MobileCategoriesView
      initialCategories={bootstrap.categories}
      initialRecommendZones={bootstrap.recommendZones}
    />
  )
}
