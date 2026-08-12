'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { MobileStorefrontHeader } from '@/frontend/components/MobileStorefrontHeader'
import { ProductListCard } from '@/frontend/components/ProductListCard'
import {
  getProductList,
  type ProductItem,
} from '@/frontend/actions/ProductCategory'
import { loadCategoryListCached } from '@/frontend/utils/categoryListCache'
import { loadSideNavZonesCached } from '@/frontend/utils/sideNavZonesCache'
import { pickBrandSideNavZone } from '@/frontend/utils/brandSideNav'
import { ProductCategory, ProductDetail } from '@/frontend/route-params'
import { normalizeLocale, readStoredLocale } from '@/frontend/i18n'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type BrandTab = {
  id: string
  name: string
  slug: string | null
}

/**
 * Mobile brand browse: horizontal brand chips + 3-col product grid.
 */
export default function MobileBrandView() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [brands, setBrands] = useState<BrandTab[]>([])
  const [activeId, setActiveId] = useState('')
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const lang = useMemo(
    () =>
      normalizeLocale(
        i18n.language || (typeof window !== 'undefined' ? readStoredLocale() : 'en'),
      ),
    [i18n.language],
  )

  useEffect(() => {
    let cancelled = false
    setLoadingBrands(true)

    Promise.all([
      loadCategoryListCached(lang).catch(() => []),
      loadSideNavZonesCached(lang).catch(() => []),
    ])
      .then(([categories, sideNav]) => {
        if (cancelled) return
        const fromTree = new Map<string, BrandTab>()
        for (const cat of categories) {
          for (const brand of cat.brand_options || []) {
            if (!fromTree.has(brand.category_id)) {
              fromTree.set(brand.category_id, {
                id: brand.category_id,
                name: brand.category_name,
                slug: brand.category_slug,
              })
            }
          }
        }

        const brandZone = pickBrandSideNavZone(sideNav || [], { requireSideNavType: true })
        for (const item of brandZone?.items || []) {
          if (!fromTree.has(item.category_id)) {
            fromTree.set(item.category_id, {
              id: item.category_id,
              name: item.category_name,
              slug: item.category_slug,
            })
          }
        }

        const list = Array.from(fromTree.values())
        setBrands(list)
        setActiveId((prev) => prev || list[0]?.id || '')
      })
      .finally(() => {
        if (!cancelled) setLoadingBrands(false)
      })

    return () => {
      cancelled = true
    }
  }, [lang])

  const loadProducts = useCallback(
    async (brandId: string) => {
      if (!brandId) {
        setProducts([])
        return
      }
      setLoadingProducts(true)
      try {
        const res = await getProductList({
          brand_category_id: brandId,
          page: 1,
          page_size: 24,
          lang,
          sort_by: 'NEWEST',
        })
        setProducts(res.list || [])
      } catch (e: any) {
        setProducts([])
        toast.error(e?.message || 'Failed to load brand products')
      } finally {
        setLoadingProducts(false)
      }
    },
    [lang],
  )

  useEffect(() => {
    if (activeId) void loadProducts(activeId)
  }, [activeId, loadProducts])

  const activeBrand = brands.find((b) => b.id === activeId) || null

  const openFullList = () => {
    if (!activeBrand) return
    ProductCategory.navigateToCategory(router, {
      categoryId: activeBrand.id,
      categorySlug: activeBrand.slug || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#4a4a4a]">
      <MobileStorefrontHeader />

      <div className="mobile-brand-page">
        <h1 className="mobile-brand-page__heading">
          {t('nav.brand', { defaultValue: 'Brand' })}
        </h1>

        <div className="mobile-brand-chips" role="tablist" aria-label={t('nav.brand')}>
          {loadingBrands && brands.length === 0 ? (
            <div className="px-2 py-3 text-xs text-[#8b8477]">{t('common.loading')}</div>
          ) : (
            brands.map((brand) => {
              const active = brand.id === activeId
              return (
                <button
                  key={brand.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={cn('mobile-brand-chips__item', active && 'is-active')}
                  onClick={() => setActiveId(brand.id)}
                >
                  {brand.name}
                </button>
              )
            })
          )}
        </div>

        <div className="mobile-brand-toolbar">
          <p className="text-sm text-[#6f6a62]">
            {activeBrand
              ? t('mobile.brandShowing', {
                  defaultValue: '{{name}}',
                  name: activeBrand.name,
                })
              : t('mobile.noBrands', { defaultValue: 'No brands yet' })}
          </p>
          {activeBrand ? (
            <button type="button" className="mobile-brand-view-more" onClick={openFullList}>
              {t('mobile.viewMore', { defaultValue: 'View More' })}
            </button>
          ) : null}
        </div>

        {loadingProducts ? (
          <div className="mobile-product-grid mobile-product-grid--brand">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="mobile-product-skeleton" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ddd6c8] bg-white px-4 py-12 text-center text-sm text-[#6f6a62]">
            {t('mobile.noBrandProducts', { defaultValue: 'No products for this brand' })}
          </div>
        ) : (
          <div className="mobile-product-grid mobile-product-grid--brand">
            {products.map((item, index) => (
              <ProductListCard
                key={item.product_id}
                item={item}
                imagePropKey={`brand-product-${item.product_id}`}
                className="mobile-product-card"
                onNavigate={(id) => ProductDetail.navigateToById(router, { productId: id })}
                onAddToCart={() => {
                  toast.message(t('product.addToCart', { defaultValue: 'Add to cart' }))
                  router.push('/cart/')
                }}
                priority={index < 6}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
