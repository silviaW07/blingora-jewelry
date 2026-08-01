'use client'

import React, { useEffect, useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import EditableImg from '@/@base/EditableImg'
import type { ProductItem } from '@/frontend/actions/ProductCategory'
import { WishlistHeartButton } from '@/frontend/components/WishlistHeartButton'
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

/** Prefer SKU/color images; fall back to main image only when no variants exist. */
const resolveThumbnails = (item: ProductListCardItem) => {
  const fromVariants = (item.variant_thumbnails || []).filter((url) => Boolean(url?.trim()))
  if (fromVariants.length > 0) {
    return fromVariants
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
}: ProductListCardProps) => {
  const { t } = useTranslation()
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

  const goToDetail = () => {
    onNavigate(item.product_id)
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
      role="link"
      tabIndex={0}
      aria-label={item.product_name}
      className={cn(
        'home-product-card group flex h-full cursor-pointer flex-col overflow-hidden transition duration-200',
        'hover:opacity-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20',
        className,
      )}
      data-controller-name={controllerName}
      onClick={goToDetail}
      onKeyDown={handleCardKeyDown}
    >
      <div className="home-product-card-media relative aspect-square w-full shrink-0 overflow-hidden">
        <EditableImg
          propKey={imagePropKey}
          keywords={previewImage || item.product_name}
          orientation="square"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          style={{ aspectRatio: '1 / 1' }}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 pb-2 pt-2 sm:px-2.5 sm:pb-2.5 sm:pt-2">
        <h3
          className="w-full truncate text-left text-sm font-medium leading-5 text-[#111111]"
          style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          title={item.product_name}
        >
          {item.product_name}
        </h3>

        <p className="truncate text-xs leading-4 text-[#8b8477]">
          {isDraft ? t('product.preview') : formatMinOrder(item.min_order_quantity)}
        </p>

        {isDraft ? (
          <div className="h-5" aria-hidden="true" />
        ) : (
          <p className="truncate text-base font-bold leading-5 text-[#111111]">
            {formatListPrice(item.price, item.price_max)}
          </p>
        )}

        {showColorThumbs ? (
          <div
            className="flex items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label={t('common.colorPreview')}
            onClick={(event) => event.stopPropagation()}
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
                    'size-6 shrink-0 overflow-hidden rounded-[4px] border bg-[#f7f4ee] transition',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20',
                    isActive
                      ? 'border-[#111111] ring-1 ring-[#111111]/30'
                      : 'border-[#ebe7de] hover:border-[#cfc8bb]',
                  )}
                  onClick={(event) => handleColorThumbClick(event, url)}
                >
                  <EditableImg
                    propKey={`${imagePropKey}-swatch-${index}`}
                    keywords={url}
                    orientation="square"
                    className="pointer-events-none size-full object-cover"
                    style={{ aspectRatio: '1 / 1' }}
                  />
                </button>
              )
            })}
          </div>
        ) : null}

        {!isDraft ? (
          <div className="mt-auto flex items-center justify-end gap-1.5 pt-1">
            {onAddToWishlist ? (
              <WishlistHeartButton
                productId={item.product_id}
                onToggle={(favorited) => onAddToWishlist(item, favorited)}
              />
            ) : null}
            <button
              type="button"
              aria-label={t('product.addToCart')}
              className="relative inline-flex size-8 items-center justify-center rounded-full border border-[#ebe7de] bg-white text-[#111111] transition hover:border-[#111111] hover:bg-[#111111] hover:text-white"
              onClick={(event) => stopAnd(event, () => onAddToCart(item))}
            >
              <span className="sr-only">{t('product.addToCart')}</span>
              <ShoppingCart className="size-3.5" />
              <Plus className="absolute size-2 translate-x-1.5 -translate-y-1.5" />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}
