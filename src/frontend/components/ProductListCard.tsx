'use client'

import React, { useEffect, useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductItem } from '@/frontend/actions/ProductCategory'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton'
import {
  GuestPlaceholder,
  useCanViewStorePrice,
} from '@/frontend/components/GuestPricePlaceholder'
import { prefetchProductDetail, writeProductDetailPreview } from '@/frontend/utils/productDetailCache'
import { hardNavProps, productHref, useChromeActivate } from '@/frontend/utils/hardNavigate'
import { useTranslation } from 'react-i18next'

export type ProductListCardItem = Pick<
  ProductItem,
  | 'product_id'
  | 'product_name'
  | 'main_image_url'
  | 'price'
  | 'price_max'
  | 'variant_thumbnails'
  | 'min_order_quantity'
> & {
  variant_thumbnails?: string[]
  price_max?: number | null
  min_order_quantity?: number | null
  /** ACTIVE=可售；DRAFT=快速发图展示（不显示价格/加购） */
  status?: string | null
}

type ProductListCardProps = {
  item: ProductListCardItem
  imagePropKey: string
  onNavigate: (productId: string) => void
  onAddToCart: (item: any) => void
  onAddToWishlist?: (item: any, favorited?: boolean) => void
  className?: string
  controllerName?: string
  /** 首屏（首排）卡片设为 true：主图 eager + 高 fetchPriority，改善移动端 LCP */
  priority?: boolean
}

const formatPricePart = (price: number) => {
  const fixed = price.toFixed(2).replace(/\.?0+$/, '')
  return fixed || '0'
}

const formatListPrice = (price?: number | null, priceMax?: number | null) => {
  if (typeof price !== 'number' || Number.isNaN(price)) return 'US$ --'
  if (typeof priceMax === 'number' && !Number.isNaN(priceMax) && priceMax > price) {
    return `US$ ${formatPricePart(price)}-${formatPricePart(priceMax)}`
  }
  return `US$ ${formatPricePart(price)}`
}

/** Prefer SKU/color images; fall back to main image only when no variants exist. Cap to limit request fan-out. */
const MAX_VARIANT_THUMBS = 6

const resolveThumbnails = (item: ProductListCardItem) => {
  const fromVariants = (item.variant_thumbnails || []).filter((url) => Boolean(url?.trim()))
  if (fromVariants.length > 0) {
    return fromVariants.slice(0, MAX_VARIANT_THUMBS)
  }

  return item.main_image_url?.trim() ? [item.main_image_url.trim()] : []
}

export const ProductListCard = ({
  item,
  imagePropKey,
  onNavigate,
  onAddToCart,
  onAddToWishlist,
  className,
  controllerName = '商品列表卡片',
  priority = false,
}: ProductListCardProps) => {
  const { t } = useTranslation()
  const canViewPrice = useCanViewStorePrice()
  const thumbnails = resolveThumbnails(item)
  /** Multi-color row: show all when available; hide when only a single main fallback. */
  const showColorThumbs = thumbnails.length >= 2
  const isDraft = item.status === 'DRAFT'
  const [previewImage, setPreviewImage] = useState(
    () => item.main_image_url?.trim() || thumbnails[0] || '',
  )

  useEffect(() => {
    setPreviewImage(item.main_image_url?.trim() || thumbnails[0] || '')
  }, [item.product_id, item.main_image_url])

  const detailHref = productHref(item.product_id)
  const goToDetail = () => {
    writeProductDetailPreview({
      id: item.product_id,
      name: item.product_name,
      image: previewImage || item.main_image_url || '',
    })
    onNavigate(item.product_id)
  }
  const addToCart = (event?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    onAddToCart(item)
  }
  const addToCartEvents = useChromeActivate(() => addToCart())

  const prefetchDetail = () => {
    prefetchProductDetail(item.product_id)
  }

  const stopAnd = (event: React.MouseEvent, action?: () => void) => {
    event.preventDefault()
    event.stopPropagation()
    action?.()
  }

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      goToDetail()
    }
  }

  const handleColorThumbClick = (event: React.MouseEvent, url: string) => {
    stopAnd(event, () => setPreviewImage(url))
  }

  const formatMinOrder = (minOrderQuantity?: number | null) => {
    if (typeof minOrderQuantity === 'number' && minOrderQuantity > 0) {
      const unit = minOrderQuantity === 1 ? t('common.piece') : t('common.pieces')
      return `${t('common.minOrder')}: ${minOrderQuantity} ${unit}`
    }
    return `${t('common.minOrder')}: --`
  }

  return (
    <article
      className={cn(
        'home-product-card group flex h-full flex-col overflow-visible transition duration-200',
        'hover:opacity-95',
        className,
      )}
      data-controller-name={controllerName}
      onPointerEnter={prefetchDetail}
    >
      <a
        {...hardNavProps(detailHref)}
        aria-label={item.product_name}
        className="home-product-card-link block text-[#111111] no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
        onPointerDown={() => {
          writeProductDetailPreview({
            id: item.product_id,
            name: item.product_name,
            image: previewImage || item.main_image_url || '',
          })
        }}
        onFocus={prefetchDetail}
        onKeyDown={handleCardKeyDown}
      >
        <div className="home-product-card-media relative w-full shrink-0 overflow-hidden">
          <OptimizedProductImage
            src={previewImage || item.main_image_url}
            alt={item.product_name}
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
            imageWidth={640}
            priority={priority}
          />
        </div>
        <h3
          className="w-full truncate px-2 pt-2 text-left text-sm font-medium leading-5 text-[#111111] no-underline sm:px-2.5"
          style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#111111', textDecoration: 'none' }}
          title={item.product_name}
        >
          {item.product_name}
        </h3>
      </a>

      <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 pb-2 sm:px-2.5 sm:pb-2.5">

        {isDraft ? (
          <p className="truncate text-xs leading-4 text-[#8b8477]">{t('product.preview')}</p>
        ) : null}

        {isDraft ? (
          <div className="h-5" aria-hidden="true" />
        ) : canViewPrice ? (
          <div className="min-h-5 space-y-1">
            <p className="truncate text-base font-bold leading-5 text-[#111111]">
              {formatListPrice(item.price, item.price_max)}
            </p>
            {typeof item.min_order_quantity === 'number' && item.min_order_quantity > 0 ? (
              <p className="truncate text-xs font-semibold leading-4 text-[#ff0000]">
                {formatMinOrder(item.min_order_quantity)}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="min-h-5 space-y-1">
            <GuestPlaceholder compact className="truncate" />
            {typeof item.min_order_quantity === 'number' && item.min_order_quantity > 0 ? (
              <p className="truncate text-xs font-semibold leading-4 text-[#ff0000]">
                {formatMinOrder(item.min_order_quantity)}
              </p>
            ) : null}
          </div>
        )}

        {showColorThumbs ? (
          <div
            className="flex items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label={t('common.colorPreview')}
            onClick={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
          >
            {thumbnails.map((url, index) => {
              const isActive = previewImage === url
              return (
                <button
                  key={`${item.product_id}-swatch-${index}`}
                  type="button"
                  role="listitem"
                  aria-label={t('product.colorIndex', { index: index + 1 })}
                  aria-pressed={isActive}
                  className={cn(
                    'relative size-6 shrink-0 overflow-hidden rounded-[4px] border bg-[#f7f4ee] transition',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20',
                    isActive
                      ? 'border-[#111111] ring-1 ring-[#111111]/30'
                      : 'border-[#ebe7de] hover:border-[#cfc8bb]',
                  )}
                  onClick={(event) => handleColorThumbClick(event, url)}
                >
                  <OptimizedProductImage
                    src={url}
                    alt=""
                    fill={false}
                    width={24}
                    height={24}
                    className="pointer-events-none h-full w-full"
                    sizes="48px"
                    imageWidth={240}
                  />
                </button>
              )
            })}
          </div>
        ) : null}

        {!isDraft ? (
          <div
            className="home-product-card-actions mt-1 flex shrink-0 items-center justify-end gap-2 pt-1"
            data-no-hard-nav
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            {onAddToWishlist ? (
              <WishlistHeartButton
                productId={item.product_id}
                onToggle={(favorited) => onAddToWishlist(item, favorited)}
                className="size-9 shrink-0"
              />
            ) : null}
            <button
              type="button"
              aria-label={t('product.addToCart')}
              className="home-product-card-cart-btn relative z-[5] inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#ebe7de] bg-white text-[#111111] transition hover:border-[#111111] hover:bg-[#111111] hover:text-white"
              {...addToCartEvents}
            >
              <ShoppingCart className="size-3.5 pointer-events-none" aria-hidden />
              <Plus className="pointer-events-none absolute size-2 translate-x-1.5 -translate-y-1.5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
