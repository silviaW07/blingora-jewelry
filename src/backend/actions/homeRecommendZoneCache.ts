'use server'

import prisma from '@/tools/prisma'

export const HOME_RECOMMEND_ZONE_CACHE_TAG = 'home-recommend-zones'

const productPricingInclude = {
  skus: {
    orderBy: { price: 'asc' as const },
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
        orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }]
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
          { createdAt: 'asc' },
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
}
