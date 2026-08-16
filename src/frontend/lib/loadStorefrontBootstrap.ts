import { getCategoryList, getCategoryPosterList } from '@/frontend/actions/ProductCategory'
import { getHomeRecommendZones } from '@/frontend/actions/Home'
import type { StorefrontBootstrap } from '@/frontend/types/storefrontBootstrap'

export async function loadStorefrontBootstrap(lang = 'en'): Promise<StorefrontBootstrap> {
  const normalized = String(lang || 'en').trim() || 'en'
  const [categories, posters, recommendZones] = await Promise.all([
    getCategoryList({ lang: normalized })
      .then((res) => (Array.isArray(res.list) ? res.list : []))
      .catch(() => []),
    getCategoryPosterList({})
      .then((res) => (Array.isArray(res.list) ? res.list : []))
      .catch(() => []),
    getHomeRecommendZones({ lang: normalized })
      .then((res) => (Array.isArray(res.zones) ? res.zones : []))
      .catch(() => []),
  ])
  return { categories, posters, recommendZones }
}
