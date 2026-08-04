'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { MobileStorefrontHeader } from '@/frontend/components/MobileStorefrontHeader'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { loadCategoryListCached } from '@/frontend/utils/categoryListCache'
import {
  getCategorySideNavZones,
  type CategoryItem,
  type SideNavZoneSection,
} from '@/frontend/actions/ProductCategory'
import {
  getDailyNewArrivalCalendar,
  type DailyNewArrivalMonthCard,
} from '@/frontend/actions/Home'
import { ProductCategory } from '@/frontend/route-params'
import { normalizeLocale, readStoredLocale } from '@/frontend/i18n'
import {
  buildLast6Months,
  formatMonthLabel,
  isDailyNewArrivalCategoryName,
} from '@/frontend/utils/dailyNewArrival'
import { pickBrandSideNavZone } from '@/frontend/utils/brandSideNav'
import { cn } from '@/lib/utils'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'

type CircleEntry = {
  key: string
  label: string
  imageUrl?: string | null
  /** Circle initials when no image (months / text) */
  initials?: string
  onClick: () => void
}

type BrandEntry = {
  id: string
  name: string
  slug: string | null
  imageUrl?: string | null
}

/**
 * Merge category-tree brand_options with SIDE_NAV brand zone.
 * Dedupes by category_id; prefers image_url from brand_options.
 * Same collection pattern as MobileBrandView, plus image preference.
 */
function collectMobileCategoryBrands(
  list: CategoryItem[],
  zones: SideNavZoneSection[],
): BrandEntry[] {
  const brandMap = new Map<string, BrandEntry>()

  for (const cat of list) {
    for (const brand of cat.brand_options || []) {
      const id = String(brand.category_id || '').trim()
      if (!id) continue
      const imageUrl = brand.image_url || null
      const existing = brandMap.get(id)
      if (!existing) {
        brandMap.set(id, {
          id,
          name: brand.category_name,
          slug: brand.category_slug,
          imageUrl,
        })
      } else if (!existing.imageUrl && imageUrl) {
        existing.imageUrl = imageUrl
        if (!existing.name) existing.name = brand.category_name
        if (!existing.slug) existing.slug = brand.category_slug
      }
    }
  }

  // getCategorySideNavZones already returns SIDE_NAV-only zones (often without zoneType)
  const brandZone =
    pickBrandSideNavZone(zones, { requireSideNavType: true }) ||
    pickBrandSideNavZone(zones)

  for (const item of brandZone?.items || []) {
    const id = String(item.category_id || '').trim()
    if (!id) continue
    if (brandMap.has(id)) continue
    brandMap.set(id, {
      id,
      name: item.category_name,
      slug: item.category_slug,
      // SIDE_NAV items usually have no image_url
      imageUrl: null,
    })
  }

  return Array.from(brandMap.values())
}

/**
 * Mobile categories: left L1 + right circle L2.
 * Bottom brand row uses normal document flow (not fixed/sticky).
 */
export default function MobileCategoriesView() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [activeId, setActiveId] = useState('')
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState<DailyNewArrivalMonthCard[]>([])
  const [loadingMonths, setLoadingMonths] = useState(false)
  const [brands, setBrands] = useState<BrandEntry[]>([])

  const lang = normalizeLocale(
    i18n.language || (typeof window !== 'undefined' ? readStoredLocale() : 'en'),
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      loadCategoryListCached(lang).catch(() => [] as CategoryItem[]),
      getCategorySideNavZones({ lang }).catch(() => ({
        zones: [] as SideNavZoneSection[],
      })),
    ])
      .then(([list, sideNav]) => {
        if (cancelled) return
        setCategories(list)
        setActiveId((prev) => {
          if (prev && list.some((c) => c.category_id === prev)) return prev
          return list[0]?.category_id || ''
        })
        setBrands(collectMobileCategoryBrands(list, sideNav.zones || []))
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([])
          setBrands([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lang])

  const active = useMemo(
    () => categories.find((c) => c.category_id === activeId) || categories[0] || null,
    [categories, activeId],
  )

  const isNewTab = Boolean(active && isDailyNewArrivalCategoryName(active.category_name))

  useEffect(() => {
    if (!isNewTab) {
      setMonths([])
      return
    }
    let cancelled = false
    setLoadingMonths(true)
    getDailyNewArrivalCalendar()
      .then((res) => {
        if (cancelled) return
        const list =
          Array.isArray(res.months) && res.months.length > 0
            ? res.months
            : buildLast6Months().map((m) => ({
                year: m.year,
                month: m.month,
                monthKey: m.monthKey,
                label: formatMonthLabel(m.year, m.month),
                productCount: 0,
              }))
        setMonths(list)
      })
      .catch(() => {
        if (cancelled) return
        setMonths(
          buildLast6Months().map((m) => ({
            year: m.year,
            month: m.month,
            monthKey: m.monthKey,
            label: formatMonthLabel(m.year, m.month),
            productCount: 0,
          })),
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingMonths(false)
      })
    return () => {
      cancelled = true
    }
  }, [isNewTab, lang])

  const openCategory = (id: string, slug?: string | null) => {
    ProductCategory.navigateToCategory(router, {
      categoryId: id,
      categorySlug: slug || undefined,
    })
  }

  /** Same URL shape as web month picker → product listing */
  const openDailyMonth = (monthKey: string) => {
    if (!active) return
    const params = new URLSearchParams()
    params.set('dailyMonth', monthKey)
    const slug = String(active.category_slug || '').trim()
    if (slug) {
      router.push(`/category/${encodeURIComponent(slug)}?${params.toString()}`)
      return
    }
    params.set('categoryId', active.category_id)
    router.push(`${ProductCategory.path}?${params.toString()}`)
  }

  const circleEntries: CircleEntry[] = useMemo(() => {
    if (!active) return []

    if (isNewTab) {
      return months.map((m) => {
        const short = m.label || formatMonthLabel(m.year, m.month)
        const monthAbbr = short.split(/\s+/)[0] || short.slice(0, 3)
        return {
          key: m.monthKey,
          label: short,
          initials: monthAbbr.slice(0, 3),
          onClick: () => openDailyMonth(m.monthKey),
        }
      })
    }

    const children = active.children || []
    if (children.length > 0) {
      return children.map((child) => ({
        key: child.category_id,
        label: translateCatalogLabel(t, child.category_name),
        imageUrl: child.image_url,
        initials: child.category_name.slice(0, 1).toUpperCase(),
        onClick: () => openCategory(child.category_id, child.category_slug),
      }))
    }

    const brandOpts = active.brand_options || []
    if (brandOpts.length > 0) {
      return brandOpts.map((brand) => ({
        key: brand.category_id,
        label: translateCatalogLabel(t, brand.category_name),
        imageUrl: brand.image_url,
        initials: brand.category_name.slice(0, 1).toUpperCase(),
        onClick: () => openCategory(brand.category_id, brand.category_slug),
      }))
    }

    return [
      {
        key: active.category_id,
        label: translateCatalogLabel(t, active.category_name),
        imageUrl: active.image_url,
        initials: active.category_name.slice(0, 1).toUpperCase(),
        onClick: () => openCategory(active.category_id, active.category_slug),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over latest active
  }, [active, isNewTab, months, t])

  const showBrandZone = !loading && brands.length > 0

  return (
    <div
      className="mobile-categories-page min-h-screen bg-[#f7f4ee] text-[#4a4a4a]"
      data-controller-name="移动端分类页-自然滚动+底部品牌区"
    >
      <MobileStorefrontHeader />

      {/* L1 + L2: normal document flow — no min-height trap / independent scroll */}
      <div className="mobile-categories-layout">
        <aside className="mobile-categories-rail" aria-label={t('common.categories')}>
          {loading && categories.length === 0 ? (
            <div className="px-3 py-6 text-xs text-[#8b8477]">{t('common.loading')}</div>
          ) : (
            categories.map((cat) => {
              const selected = cat.category_id === active?.category_id
              return (
                <button
                  key={cat.category_id}
                  type="button"
                  className={cn('mobile-categories-rail__item', selected && 'is-active')}
                  onClick={() => setActiveId(cat.category_id)}
                >
                  {translateCatalogLabel(t, cat.category_name)}
                </button>
              )
            })
          )}
        </aside>

        <section className="mobile-categories-panel">
          <h1 className="mobile-categories-panel__title">
            {active
              ? translateCatalogLabel(t, active.category_name)
              : t('common.categories')}
          </h1>

          {isNewTab && loadingMonths ? (
            <div className="mt-8 flex justify-center text-[#8b8477]">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : circleEntries.length === 0 ? (
            <p className="mt-6 text-center text-sm text-[#8a8073]">
              {t('mobile.noRecommendedCategories', { defaultValue: 'No categories yet' })}
            </p>
          ) : (
            <div
              className="mobile-categories-grid"
              data-controller-name="移动端分类圆形入口网格"
            >
              {circleEntries.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className="mobile-categories-grid__item"
                  onClick={entry.onClick}
                >
                  <span className="mobile-categories-grid__icon">
                    {entry.imageUrl ? (
                      <OptimizedProductImage
                        src={entry.imageUrl}
                        alt={entry.label}
                        sizes="72px"
                        imageWidth={160}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="mobile-categories-grid__initials" aria-hidden>
                        {entry.initials || entry.label.slice(0, 1)}
                      </span>
                    )}
                  </span>
                  <span className="mobile-categories-grid__label">{entry.label}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Brands: document flow only — never fixed/sticky; sits below dual column */}
      {showBrandZone ? (
        <section
          className="mobile-categories-brands"
          aria-label={t('nav.brand', { defaultValue: 'Brand' })}
          data-controller-name="分类页底部品牌展示区"
        >
          <h2 className="mobile-categories-brands__title">
            {t('nav.brand', { defaultValue: 'Brand' })}
          </h2>
          <div className="mobile-categories-brands__grid">
            {brands.map((brand) => {
              const label = translateCatalogLabel(t, brand.name)
              return (
                <button
                  key={brand.id}
                  type="button"
                  className="mobile-categories-brands__item"
                  onClick={() => openCategory(brand.id, brand.slug)}
                >
                  <span className="mobile-categories-brands__icon">
                    {brand.imageUrl ? (
                      <OptimizedProductImage
                        src={brand.imageUrl}
                        alt={label}
                        sizes="56px"
                        imageWidth={120}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="mobile-categories-brands__initials" aria-hidden>
                        {brand.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="mobile-categories-brands__label">{label}</span>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
