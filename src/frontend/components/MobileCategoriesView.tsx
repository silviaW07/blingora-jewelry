'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { loadCategoryListCached } from '@/frontend/utils/categoryListCache'
import type { CategoryItem } from '@/frontend/actions/ProductCategory'
import { ProductCategory } from '@/frontend/route-params'
import { normalizeLocale, readStoredLocale } from '@/frontend/i18n'
import { cn } from '@/lib/utils'

/**
 * Mobile categories browse: left L1 rail + right L2 circular grid.
 */
export default function MobileCategoriesView() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [activeId, setActiveId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const lang = normalizeLocale(
      i18n.language || (typeof window !== 'undefined' ? readStoredLocale() : 'en'),
    )
    setLoading(true)
    loadCategoryListCached(lang)
      .then((list) => {
        if (cancelled) return
        setCategories(list)
        setActiveId((prev) => prev || list[0]?.category_id || '')
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [i18n.language])

  const active = useMemo(
    () => categories.find((c) => c.category_id === activeId) || categories[0] || null,
    [categories, activeId],
  )

  const children = active?.children || []

  const openCategory = (id: string, slug?: string | null) => {
    ProductCategory.navigateToCategory(router, {
      categoryId: id,
      categorySlug: slug || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#111111]">
      <StorefrontStickyHeader isHome={false} />

      <div className="mobile-categories-promo">
        <p className="mobile-categories-promo__eyebrow">
          {t('mobile.promoEyebrow', { defaultValue: 'New arrivals' })}
        </p>
        <p className="mobile-categories-promo__title">
          {t('mobile.categoriesPromo', {
            defaultValue: 'Shop by category — wholesale ready stock',
          })}
        </p>
      </div>

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
                  {cat.category_name}
                </button>
              )
            })
          )}
        </aside>

        <section className="mobile-categories-panel">
          <h1 className="mobile-categories-panel__title">
            {active?.category_name || t('common.categories')}
          </h1>

          {children.length === 0 ? (
            <button
              type="button"
              className="mt-4 rounded-2xl border border-dashed border-[#ddd6c8] bg-white px-4 py-8 text-sm text-[#6f6a62]"
              onClick={() => active && openCategory(active.category_id, active.category_slug)}
            >
              {t('mobile.viewAllInCategory', { defaultValue: 'View all products' })}
            </button>
          ) : (
            <div className="mobile-categories-grid">
              {children.map((child) => (
                <button
                  key={child.category_id}
                  type="button"
                  className="mobile-categories-grid__item"
                  onClick={() => openCategory(child.category_id, child.category_slug)}
                >
                  <span className="mobile-categories-grid__icon">
                    <OptimizedProductImage
                      src={child.image_url || null}
                      alt={child.category_name}
                      sizes="72px"
                      imageWidth={160}
                      className="rounded-full"
                    />
                  </span>
                  <span className="mobile-categories-grid__label">{child.category_name}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
