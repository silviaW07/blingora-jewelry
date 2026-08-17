'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MobileStorefrontHeader } from '@/frontend/components/MobileStorefrontHeader'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { loadCategoryListCached, seedCategoryListCache } from '@/frontend/utils/categoryListCache'
import { categoryHref, hardNavigate, onHardNavClick, productHref } from '@/frontend/utils/hardNavigate'
import { loadSideNavZonesCached } from '@/frontend/utils/sideNavZonesCache'
import { fetchCategoryShelfProducts } from '@/frontend/utils/storefrontProductsClient'
import {
  buildCategoryPreviewProducts,
  type ShelfProductCard,
} from '@/frontend/utils/categoryPreviewProducts'
import type { CategoryItem, SideNavZoneSection } from '@/frontend/actions/ProductCategory'
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
  initials?: string
  href: string
}

type BrandEntry = {
  id: string
  name: string
  slug: string | null
  imageUrl?: string | null
}

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
      imageUrl: null,
    })
  }

  return Array.from(brandMap.values())
}

function paneCss(count: number) {
  const n = Math.max(1, count)
  const chunks: string[] = []
  for (let i = 0; i < n; i += 1) {
    chunks.push(
      `#mc-i${i}:checked~.mobile-categories-rail label[for="mc-i${i}"]{background:#fff;border-left-color:#333;color:#333}`,
      `#mc-i${i}:checked~.mobile-categories-panels .mobile-categories-pane[data-i="${i}"]{display:block!important}`,
    )
  }
  return chunks.join('')
}

export default function MobileCategoriesView({
  initialCategories,
  initialRecommendZones,
}: {
  initialCategories?: CategoryItem[]
  initialRecommendZones?: unknown[]
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
  const [brands, setBrands] = useState<BrandEntry[]>([])
  const [productsById, setProductsById] = useState<Record<string, ShelfProductCard[]>>(() =>
    buildCategoryPreviewProducts(initialCategories || [], initialRecommendZones || []),
  )
  const [loadingById, setLoadingById] = useState<Record<string, boolean>>({})
  const [readyById, setReadyById] = useState<Record<string, boolean>>({})
  const fetchedRef = useRef<Set<string>>(new Set())
  const layoutRef = useRef<HTMLDivElement | null>(null)

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
        setProductsById((prev) => {
          const seeded = buildCategoryPreviewProducts(list, initialRecommendZones || [])
          return { ...seeded, ...prev }
        })
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
  }, [lang, initialRecommendZones])

  const fallbackMonths = useMemo(
    () =>
      buildLast6Months().map((m) => ({
        year: m.year,
        month: m.month,
        monthKey: m.monthKey,
        label: formatMonthLabel(m.year, m.month),
      })),
    [],
  )

  const loadProducts = useCallback(
    (cat: CategoryItem) => {
      const id = cat.category_id
      if (!id) return
      const key = `${lang}:${id}`
      if (fetchedRef.current.has(key)) return
      fetchedRef.current.add(key)
      setLoadingById((prev) => ({ ...prev, [id]: true }))
      const daily = isDailyNewArrivalCategoryName(cat.category_name)
      fetchCategoryShelfProducts({
        categoryId: daily ? undefined : id,
        daily,
        lang,
      })
        .then((list) => {
          if (list.length === 0) {
            fetchedRef.current.delete(key)
            return
          }
          setProductsById((prev) => ({ ...prev, [id]: list }))
        })
        .catch(() => {
          fetchedRef.current.delete(key)
        })
        .finally(() => {
          setLoadingById((prev) => ({ ...prev, [id]: false }))
          setReadyById((prev) => ({ ...prev, [id]: true }))
        })
    },
    [lang],
  )

  useEffect(() => {
    let index = 0
    let timer: number | undefined
    const tick = () => {
      if (index >= categories.length) return
      loadProducts(categories[index])
      index += 1
      timer = window.setTimeout(tick, 50)
    }
    tick()
    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [categories, loadProducts])

  useEffect(() => {
    const root = layoutRef.current
    if (!root) return
    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement | null
      if (!target || target.name !== 'mobile-cat-rail') return
      activateCategory(target.value)
    }
    root.addEventListener('change', onChange, true)
    return () => root.removeEventListener('change', onChange, true)
  })

  const activateCategory = (categoryId: string) => {
    if (!categoryId) return
    setActiveId(categoryId)
    const cat = categories.find((c) => c.category_id === categoryId)
    if (cat) loadProducts(cat)
  }

  const circlesForCategory = (cat: CategoryItem): CircleEntry[] => {
    if (isDailyNewArrivalCategoryName(cat.category_name)) {
      return fallbackMonths.map((m) => {
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
      }))
    }

    return [
      {
        key: cat.category_id,
        label: translateCatalogLabel(t, cat.category_name),
        imageUrl: cat.image_url,
        initials: cat.category_name.slice(0, 1).toUpperCase(),
        href: categoryHref(cat.category_slug, cat.category_id),
      },
    ]
  }

  const showBrandZone = !loading && brands.length > 0

  return (
    <div
      className="mobile-categories-page min-h-screen bg-[#f7f4ee] text-[#4a4a4a]"
      data-controller-name="移动端分类页-一级即出二级与商品"
    >
      <MobileStorefrontHeader />

      <style dangerouslySetInnerHTML={{ __html: paneCss(Math.max(categories.length, 1)) }} />

      <div className="mobile-categories-layout" ref={layoutRef}>
        {categories.map((cat, index) => (
          <input
            key={`radio-${cat.category_id}`}
            id={`mc-i${index}`}
            className="mobile-categories-radio"
            type="radio"
            name="mobile-cat-rail"
            value={cat.category_id}
            defaultChecked={index === 0}
            onChange={() => activateCategory(cat.category_id)}
          />
        ))}

        <aside className="mobile-categories-rail" aria-label={t('common.categories')}>
          {loading && categories.length === 0 ? (
            <div className="px-3 py-6 text-xs text-[#8b8477]">{t('common.loading')}</div>
          ) : (
            categories.map((cat, index) => (
              <label
                key={cat.category_id}
                htmlFor={`mc-i${index}`}
                className={cn(
                  'mobile-categories-rail__item',
                  cat.category_id === activeId && 'is-active',
                )}
                onPointerDown={() => activateCategory(cat.category_id)}
                onPointerUp={() => activateCategory(cat.category_id)}
                onClick={() => activateCategory(cat.category_id)}
              >
                {translateCatalogLabel(t, cat.category_name)}
              </label>
            ))
          )}
        </aside>

        <div className="mobile-categories-panels">
          {categories.map((cat, index) => {
            const circles = circlesForCategory(cat)
            const products = productsById[cat.category_id] || []
            const loadingProducts = products.length === 0 && !readyById[cat.category_id]
            const viewMoreHref = categoryHref(cat.category_slug, cat.category_id)
            return (
              <section
                key={cat.category_id}
                className="mobile-categories-pane"
                data-i={String(index)}
                data-category-id={cat.category_id}
              >
                <h1 className="mobile-categories-panel__title">
                  {translateCatalogLabel(t, cat.category_name)}
                </h1>

                {circles.length > 0 ? (
                  <div
                    className="mobile-categories-grid"
                    data-controller-name="移动端分类圆形入口网格"
                  >
                    {circles.map((entry) => (
                      <a
                        key={entry.key}
                        href={entry.href}
                        className="mobile-categories-grid__item"
                        onClick={onHardNavClick(entry.href)}
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
                    {products.map((item, productIndex) => (
                      <ProductListCard
                        key={item.product_id}
                        item={item}
                        imagePropKey={`cat-product-${item.product_id}`}
                        className="mobile-product-card"
                        onNavigate={(id) => hardNavigate(productHref(id))}
                        onAddToCart={(product) =>
                          hardNavigate(productHref(product.product_id || item.product_id))
                        }
                        priority={productIndex < 4}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-center text-sm text-[#8a8073]">
                    {t('product.emptyCategory', { defaultValue: 'No products in this category' })}
                  </p>
                )}

                {products.length > 0 ? (
                  <a
                    href={viewMoreHref}
                    onClick={onHardNavClick(viewMoreHref)}
                    className="mt-4 block text-center text-sm font-semibold text-[#333]"
                  >
                    {t('mobile.viewMore', { defaultValue: 'View more' })}
                  </a>
                ) : null}
              </section>
            )
          })}
        </div>
      </div>

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
