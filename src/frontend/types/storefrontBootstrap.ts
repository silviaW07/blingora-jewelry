import type { CategoryItem, CategoryPosterItem } from '@/frontend/actions/ProductCategory'
import type { HomeRecommendZoneSection } from '@/frontend/actions/Home'

/** Serializable home/categories payload for SSR + GET /api/storefront/bootstrap */
export type StorefrontBootstrap = {
  categories: CategoryItem[]
  posters: CategoryPosterItem[]
  recommendZones: HomeRecommendZoneSection[]
}
