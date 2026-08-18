'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Heart } from 'lucide-react'
import { AccountShell } from '@/frontend/components/AccountShell'
import { ProductListCard } from '@/frontend/components/ProductListCard'
import { StorefrontStickyHeader } from '@/frontend/components/StorefrontStickyHeader'
import {
  addToCart,
  getWishlistProducts,
  type ProductItem,
} from '@/frontend/actions/ProductCategory'
import { useLocalWishlistIds } from '@/frontend/hooks/useLocalWishlist'
import { getClientPreferredLang } from '@/frontend/i18n'
import { ProductDetail } from '@/frontend/route-params'
import { useUserSession } from '@/tools/FrontendSession'
import { openStorefrontLogin } from '@/frontend/utils/hardNavigate'

/**
 * 心愿单 / Love：读取本地收藏 ID，展示可点击的商品卡片。
 */
export default function WishlistView() {
  const { t } = useTranslation()
  const router = useRouter()
  const session = useUserSession()
  const wishlistIds = useLocalWishlistIds()
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!wishlistIds.length) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    getWishlistProducts({
      product_ids: wishlistIds,
      lang: getClientPreferredLang(),
    })
      .then(res => {
        if (cancelled) return
        setProducts(Array.isArray(res.list) ? res.list : [])
      })
      .catch((err: any) => {
        if (cancelled) return
        setProducts([])
        toast.error(err?.message || t('wishlist.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [wishlistIds, t])

  const handleNavigate = useCallback(
    (productId: string) => {
      ProductDetail.navigateToById(router, { productId })
    },
    [router],
  )

  const handleAddToCart = useCallback(
    async (item: ProductItem) => {
      if (!session.token?.trim()) {
        openStorefrontLogin()
        return
      }
      if (item.sku_count > 1 || !item.first_sku_id) {
        handleNavigate(item.product_id)
        return
      }
      if (item.stock_status === 'OUT_OF_STOCK') {
        toast.error(t('wishlist.unavailable'))
        return
      }
      try {
        await addToCart({
          product_id: item.product_id,
          product_sku_id: item.first_sku_id,
          quantity: 1,
        })
        toast.success(t('product.addedToCart'))
      } catch (err: any) {
        toast.error(err?.message || t('wishlist.addToCartFailed'))
      }
    },
    [session.token, handleNavigate, t],
  )

  const handleWishlistToggle = useCallback(
    (item: ProductItem, favorited?: boolean) => {
      if (typeof favorited === 'boolean') {
        toast.success(
          favorited
            ? t('wishlist.addedItem', { name: item.product_name })
            : t('wishlist.removedItem', { name: item.product_name }),
        )
      }
    },
    [t],
  )

  const body = (
    <div className="space-y-4" data-controller-name="心愿单商品列表">
      {loading ? (
        <p className="py-16 text-center text-sm text-[#6f6558]">{t('wishlist.loading')}</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e7e1d5] bg-white/70 px-6 py-16 text-center">
          <Heart className="mx-auto mb-3 size-8 text-[#c9a0a0]" />
          <p className="text-sm font-medium text-[#1f1a14]">{t('wishlist.empty')}</p>
          <p className="mt-1 text-xs text-[#6f6558]">{t('wishlist.emptyHint')}</p>
          <button
            type="button"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-[#111111] px-5 text-sm font-semibold text-white"
            onClick={() => router.push('/')}
          >
            {t('wishlist.browse')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((item, index) => (
            <ProductListCard
              key={item.product_id}
              item={item}
              imagePropKey={`wishlist-${item.product_id}`}
              onNavigate={handleNavigate}
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleWishlistToggle}
              controllerName="心愿单商品卡片"
              priority={index < 8}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden lg:block" data-storefront-chrome="desktop">
        <StorefrontStickyHeader />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#1f1a14]">
                {t('nav.wishlist')}
              </h1>
              <p className="mt-1 text-sm text-[#6f6558]">{t('wishlist.description')}</p>
            </div>
            {!loading && products.length > 0 ? (
              <span className="text-xs font-medium text-[#6f6558]">
                {t('wishlist.count', { count: products.length })}
              </span>
            ) : null}
          </div>
          {body}
        </main>
      </div>

      <div className="lg:hidden" data-storefront-chrome="mobile">
        <AccountShell title={t('nav.wishlist')} description={t('wishlist.description')}>
          {body}
        </AccountShell>
      </div>
    </>
  )
}
