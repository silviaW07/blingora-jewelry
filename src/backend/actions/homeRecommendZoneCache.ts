'use server'

import prisma from '@/tools/prisma'

export const HOME_RECOMMEND_ZONE_CACHE_TAG = 'home-recommend-zones'

const productPricingInclude = {
  skus: {
    orderBy: { price: 'asc' as const },
    // Homepage cards only need a default price + a few option chips.
    take: 8,
  },
  category: {
    select: {
      name: true,
      level: true,
      priceCoefficient: true,
      isBrandCategory: true,
      parentId: true,
      parent: {
        select: {
          name: true,
          priceCoefficient: true,
          isBrandCategory: true,
        },
      },
    },
  },
  relationCategories: {
    select: {
      category: {
        select: {
          name: true,
          level: true,
          priceCoefficient: true,
          isBrandCategory: true,
          parent: {
            select: {
              name: true,
              priceCoefficient: true,
              isBrandCategory: true,
            },
          },
        },
      },
    },
  },
}

export type HomeRecommendZoneCachedRecord = Awaited<
  ReturnType<typeof prisma.homeRecommendZone.findMany<{
    where: { isActive: true }
    orderBy: [{ createdAt: 'asc' }]
    include: {
      items: {
        orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }]
        include: {
          product: {
            include: typeof productPricingInclude
          }
          category: {
            include: {
              parent: true,
              _count: {
                select: {
                  products: true
                }
              }
            }
          }
        }
      }
    }
  }>>
>

let cachedZones: HomeRecommendZoneCachedRecord | null = null

const ASSEMBLED_HOME_ZONES_TTL_MS = 90_000
const assembledHomeZonesByLang = new Map<string, { at: number; zones: unknown }>()

export function readAssembledHomeRecommendZones<T>(lang: string): T | null {
  const key = String(lang || 'en').trim() || 'en'
  const hit = assembledHomeZonesByLang.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > ASSEMBLED_HOME_ZONES_TTL_MS) {
    assembledHomeZonesByLang.delete(key)
    return null
  }
  return hit.zones as T
}

export function writeAssembledHomeRecommendZones(lang: string, zones: unknown) {
  const key = String(lang || 'en').trim() || 'en'
  assembledHomeZonesByLang.set(key, { at: Date.now(), zones })
}

export async function readHomeRecommendZonesWithCache(): Promise<HomeRecommendZoneCachedRecord> {
  if (cachedZones) {
    return cachedZones
  }

  const records = await prisma.homeRecommendZone.findMany({
    where: {
      isActive: true,
    },
    // 专区区块顺序：创建时间自然序（与专区列表一致）；明细项顺序用各自 sortWeight
    orderBy: [
      { createdAt: 'asc' },
    ],
    include: {
      items: {
        orderBy: [
          { sortWeight: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          product: {
            include: productPricingInclude,
          },
          category: {
            include: {
              parent: true,
              _count: {
                select: {
                  products: true,
                },
              },
            },
          },
        },
      },
    },
  })

  cachedZones = records
  return records
}

export function invalidateHomeRecommendZoneCache() {
  cachedZones = null
  assembledHomeZonesByLang.clear()
}
