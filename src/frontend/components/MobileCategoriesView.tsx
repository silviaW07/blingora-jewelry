'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MobileStorefrontHeader } from '@/frontend/components/MobileStorefrontHeader'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { loadCategoryListCached, seedCategoryListCache } from '@/frontend/utils/categoryListCache'
import { categoryHref, hardNavigate, onHardNavClick, productHref } from '@/frontend/utils/hardNavigate'
import { loadSideNavZonesCached } from '@/frontend/utils/sideNavZonesCache'
import {
  getProductList,
  type CategoryItem,
  type ProductItem,
  type SideNavZoneSection,
} from '@/frontend/actions/ProductCategory'
import {
  getDailyNewArrivalCalendar,
  getDailyNewArrivalProducts,
  type DailyNewArrivalMonthCard,
} from '@/frontend/actions/Home'
import { ProductListCard } from '@/frontend/components/ProductListCard'
import { translateCatalogLabel } from '@/frontend/i18n/catalogLabels'
import { normalizeLocale, readStoredLocale } from '@/frontend/i18n'
import {
  buildLast6Months,
  formatMonthLabel,
  isDailyNewArrivalCategoryName,
} from '@/frontend/utils/dailyNewArrival'
import { pickBrandSideNavZone } from '@/frontend/utils/brandSideNav'
import { cn } from '@/lib/utils'

type CircleEntry = {
  key: string
  label: string
  imageUrl?: string | null
  /** Circle initials when no image (months / text) */
  initials?: string
  href?: string
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
export default function MobileCategoriesView({
  initialCategories,
}: {
  initialCategories?: CategoryItem[]
}) {
  const { t, i18n } = useTranslation()
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    if (initialCategories?.length) {
      seedCategoryListCache(initialCategories, 'en')
      return initialCategories
    }
    return []
  })
  const [activeId, setActiveId] = useState(() => initialCategories?.[0]?.category_id || '')
  const [loading, setLoading] = useState(() => !(initialCategories?.length))
  const [months, setMonths] = useState<DailyNewArrivalMonthCard[]>([])
  const [loadingMonths, setLoadingMonths] = useState(false)
  const [brands, setBrands] = useState<BrandEntry[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const lang = normalizeLocale(
    i18n.language || (typeof window !== 'undefined' ? readStoredLocale() : 'en'),
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      loadCategoryListCached(lang).catch(() => [] as CategoryItem[]),
      loadSideNavZonesCached(lang).catch(() => [] as SideNavZoneSection[]),
    ])
      .then(([list, sideNav]) => {
        if (cancelled) return
        setCategories(list)
        setActiveId((prev) => {
          if (prev && list.some((c) => c.category_id === prev)) return prev
          return list[0]?.category_id || ''
        })
        setBrands(collectMobileCategoryBrands(list, sideNav || []))
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

  useEffect(() => {
    if (!active) {
      setProducts([])
      setLoadingProducts(false)
      return
    }
    let cancelled = false
    let settled = false
    setLoadingProducts(true)
    const safety =
      typeof window !== 'undefined'
        ? window.setTimeout(() => {
            if (cancelled || settled) return
            settled = true
            setLoadingProducts(false)
          }, 8000)
        : undefined
    const request = isDailyNewArrivalCategoryName(active.category_name)
      ? getDailyNewArrivalProducts({ page: 1, page_size: 24, lang })
      : getProductList({
          category_id: active.category_id,
          page: 1,
          page_size: 24,
          sort_by: 'NEWEST',
          lang,
        })
    request
      .then((res) => {
        if (cancelled || settled) return
        setProducts(Array.isArray(res.list) ? res.list : [])
      })
      .catch(() => {
        if (cancelled || settled) return
        setProducts([])
      })
      .finally(() => {
        if (cancelled || settled) return
        settled = true
        if (safety) window.clearTimeout(safety)
        setLoadingProducts(false)
      })
    return () => {
      cancelled = true
      if (safety) window.clearTimeout(safety)
    }
  }, [active, lang])

  const fallbackMonths = useMemo(
    () =>
      buildLast6Months().map((m) => ({
        year: m.year,
        month: m.month,
        monthKey: m.monthKey,
        label: formatMonthLabel(m.year, m.month),
        productCount: 0,
      })),
    [],
  )

  const circlesForCategory = (cat: CategoryItem): CircleEntry[] => {
    if (isDailyNewArrivalCategoryName(cat.category_name)) {
      const list = months.length > 0 ? months : fallbackMonths
      return list.map((m) => {
        const short = m.label || formatMonthLabel(m.year, m.month)
        const monthAbbr = short.split(/\s+/)[0] || short.slice(0, 3)
        const params = new URLSearchParams()
        params.set('dailyMonth', m.monthKey)
        const slug = String(cat.category_slug || '').trim()
        const href = slug
          ? `/category/${encodeURIComponent(slug)}/?${params.toString()}`
          : `/?${params.toString()}&categoryId=${encodeURIComponent(cat.category_id)}`
        return {
          key: m.monthKey,
          label: short,
          initials: monthAbbr.slice(0, 3),
          href,
          onClick: () => hardNavigate(href),
        }
      })
    }

    const children = cat.children || []
    if (children.length > 0) {
      return children.map((child) => ({
        key: child.category_id,
        label: translateCatalogLabel(t, child.category_name),
        imageUrl: child.image_url,
        initials: child.category_name.slice(0, 1).toUpperCase(),
        href: categoryHref(child.category_slug, child.category_id),
        onClick: () => hardNavigate(categoryHref(child.category_slug, child.category_id)),
      }))
    }

    const brandOpts = cat.brand_options || []
    if (brandOpts.length > 0) {
      return brandOpts.map((brand) => ({
        key: brand.category_id,
        label: translateCatalogLabel(t, brand.category_name),
        imageUrl: brand.image_url,
        initials: brand.category_name.slice(0, 1).toUpperCase(),
        href: categoryHref(brand.category_slug, brand.category_id),
        onClick: () => hardNavigate(categoryHref(brand.category_slug, brand.category_id)),
      }))
    }

    const href = categoryHref(cat.category_slug, cat.category_id)
    return [
      {
        key: cat.category_id,
        label: translateCatalogLabel(t, cat.category_name),
        imageUrl: cat.image_url,
        initials: cat.category_name.slice(0, 1).toUpperCase(),
        href,
        onClick: () => hardNavigate(href),
      },
    ]
  }

  const circleEntries = active ? circlesForCategory(active) : []
  const viewMoreHref = active ? categoryHref(active.category_slug, active.category_id) : '/'

  const showBrandZone = !loading && brands.length > 0

  return (
    <div
      className="mobile-categories-page min-h-screen bg-[#f7f4ee] text-[#4a4a4a]"
      data-controller-name="移动端分类页-自然滚动+底部品牌区"
    >
      <MobileStorefrontHeader />

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
            {active ? translateCatalogLabel(t, active.category_name) : t('common.categories')}
          </h1>

          {circleEntries.length > 0 ? (
            <div
              className="mobile-categories-grid"
              data-controller-name="移动端分类圆形入口网格"
            >
              {circleEntries.map((entry) => (
                <a
                  key={entry.key}
                  href={entry.href || viewMoreHref}
                  className="mobile-categories-grid__item"
                  onClick={onHardNavClick(entry.href || viewMoreHref)}
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
                </a>
              ))}
            </div>
          ) : null}

          {loadingProducts ? (
            <div className="mobile-product-grid mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mobile-product-skeleton" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="mobile-product-grid mt-4">
              {products.map((item, index) => (
                <ProductListCard
                  key={item.product_id}
                  item={item}
                  imagePropKey={`cat-product-${item.product_id}`}
                  className="mobile-product-card"
                  onNavigate={(id) => hardNavigate(productHref(id))}
                  onAddToCart={(product) => hardNavigate(productHref(product.product_id || item.product_id))}
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-[#8a8073]">
              {t('mobile.noBrandProducts', { defaultValue: 'No products in this category yet' })}
            </p>
          )}

          {active && products.length > 0 ? (
            <a
              href={viewMoreHref}
              onClick={onHardNavClick(viewMoreHref)}
              className="mt-4 block text-center text-sm font-semibold text-[#333]"
            >
              {t('mobile.viewMore', { defaultValue: 'View more' })}
            </a>
          ) : null}
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
                <a
                  key={brand.id}
                  href={categoryHref(brand.slug, brand.id)}
                  onClick={onHardNavClick(categoryHref(brand.slug, brand.id))}
                  className="mobile-categories-brands__item"
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
                </a>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
