import type { StorefrontBootstrap } from '@/frontend/types/storefrontBootstrap'

let inflight: Promise<StorefrontBootstrap | null> | null = null
let inflightLang = ''

export async function fetchStorefrontBootstrap(lang: string): Promise<StorefrontBootstrap | null> {
  if (typeof window === 'undefined') return null
  const normalized = String(lang || 'en').trim() || 'en'
  if (inflight && inflightLang === normalized) return inflight

  inflightLang = normalized
  inflight = fetch(`/api/storefront/bootstrap?lang=${encodeURIComponent(normalized)}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) return null
      const data = (await res.json()) as StorefrontBootstrap
      if (!data || typeof data !== 'object') return null
      return {
        categories: Array.isArray(data.categories) ? data.categories : [],
        posters: Array.isArray(data.posters) ? data.posters : [],
        recommendZones: Array.isArray(data.recommendZones) ? data.recommendZones : [],
      }
    })
    .catch(() => null)
    .finally(() => {
      inflight = null
      inflightLang = ''
    })

  return inflight
}
