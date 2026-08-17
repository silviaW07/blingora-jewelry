'use client';

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductDetailState, ProductDetailHandlers } from '@/frontend/hooks/useProductDetail';
import type { ProductStatus, ProductSkuData } from '@/frontend/actions/ProductDetail';
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage';
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Minus,
  PackageSearch,
  Plus,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { StorefrontResponsiveHeader } from '@/frontend/components/MobileStorefrontHeader';
import {
  GuestPricePlaceholder,
  StorePrice,
  useCanViewStorePrice,
} from '@/frontend/components/GuestPricePlaceholder';
import { useChromeActivate } from '@/frontend/utils/hardNavigate';
import { isNarrowViewport } from '@/frontend/utils/isNarrowViewport';
import { useTranslation } from 'react-i18next';
import { translateColorName, translateAttributeValue } from '@/frontend/i18n/catalogLabels';
import {
  translateProductSpecLabel,
  translateProductSpecValue,
} from '@/frontend/i18n/productSpecTranslate';
import { filterDescriptionParamsByWhitelist } from '@/shared/productSpecWhitelist';
import { compareSizeLabels } from '@/utils/sortSizeLabels';

/** Local helper — production webpack left `cn` as a free global and crashed the PDP. */
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

const PRODUCT_STATUS_I18N: Record<ProductStatus, string> = {
  DRAFT: 'product.statusDraft',
  ACTIVE: 'product.statusActive',
  INACTIVE: 'product.statusInactive',
};

interface Props {
  state: ProductDetailState;
  handlers: ProductDetailHandlers;
}

function ColorSwatchButton({
  colorLabel,
  previewUrl,
  isSelected,
  isPurchasable,
  priority,
  onSelect,
  onPreheat,
}: {
  colorLabel: string
  previewUrl: string
  isSelected: boolean
  isPurchasable: boolean
  priority: boolean
  onSelect: () => void
  onPreheat: () => void
}) {
  const activate = useChromeActivate(onSelect)
  return (
    <button
      type="button"
      disabled={!isPurchasable}
      aria-pressed={isSelected}
      aria-label={colorLabel}
      data-selected={isSelected ? 'true' : 'false'}
      className={cn(
        'product-color-swatch group',
        isSelected && 'is-selected',
        !isPurchasable && 'is-disabled',
      )}
      onMouseEnter={onPreheat}
      onContextMenu={(event) => event.preventDefault()}
      {...activate}
    >
      <span className="product-color-swatch-label" aria-hidden={!isSelected}>
        {colorLabel}
      </span>
      <span className="product-color-swatch-frame">
        {previewUrl ? (
          <OptimizedProductImage
            fill={false}
            src={previewUrl}
            alt=""
            className="pointer-events-none aspect-square h-auto w-full object-cover"
            imageWidth={200}
            priority={priority}
          />
        ) : null}
      </span>
    </button>
  )
}

const withStorefrontHeader = (content: React.ReactNode) => (
  <div className="min-h-screen bg-[#FFF5F5]" data-controller-name="商品详情页布局">
    <StorefrontResponsiveHeader />
    {content}
  </div>
);

const formatUsd = (price?: number | null) => {
  if (typeof price !== 'number' || Number.isNaN(price)) return 'US$ --';
  const text = price.toFixed(2).replace(/\.?0+$/, '');
  return `US$ ${text || '0'}`;
};

const formatUsdParts = (price?: number | null) => {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return { prefix: 'US$', amount: '--' };
  }
  return { prefix: 'US$', amount: price.toFixed(2) };
};

const formatUsdRange = (min: number, max: number) => {
  if (!min && !max) return 'US$ --';
  if (!max || max <= min) return formatUsd(min);
  return `${formatUsd(min)} - ${formatUsd(max)}`;
};

const isColorAttributeName = (name?: string | null) => {
  const normalized = String(name || '').trim().toLowerCase()
  return normalized === '颜色' || normalized === 'color' || normalized === 'colour'
}

const isSizeAttributeName = (name?: string | null) => {
  const normalized = String(name || '').trim().toLowerCase()
  return (
    normalized === '尺码' ||
    normalized === '鞋码' ||
    normalized === '尺寸' ||
    normalized === '码数' ||
    normalized === '规格' ||
    normalized === 'size' ||
    normalized === 'spec' ||
    normalized === 'sizing'
  )
}

const getSkuAttributeValue = (
  sku: {
    attributeJson?: Array<{ name?: string | null; value?: string | null }> | null
    variantLabel?: string | null
    sizeLabel?: string | null
  },
  attributeName?: string | null,
) => {
  if (!attributeName) return ''
  const attrValue = sku.attributeJson?.find((attr) => attr.name === attributeName)?.value || ''
  if (attrValue) return attrValue
  if (isSizeAttributeName(attributeName)) {
    const stored = String(sku.sizeLabel || '').trim()
    if (stored && !/^(默认|默认规格|default|standard|n\/a|none)$/i.test(stored)) return stored
  }
  return ''
}

const getSpecDisplayLabel = (
  sku: {
    attributeJson?: Array<{ name?: string | null; value?: string | null }> | null
    variantLabel?: string | null
    sizeLabel?: string | null
  },
  options?: {
    sizeAttributeName?: string | null
    colorAttributeName?: string | null
    currentColorValue?: string
    defaultLabel?: string
  },
) => {
  const sizeValue = getSkuAttributeValue(sku, options?.sizeAttributeName)
  if (sizeValue) return sizeValue
  const storedSize = String(sku.sizeLabel || '').trim()
  if (storedSize && !/^(默认|默认规格|default|standard|n\/a|none)$/i.test(storedSize)) {
    return storedSize
  }

  const nonColorAttr = sku.attributeJson?.find((attr) => {
    if (!attr?.value) return false
    if (isColorAttributeName(attr.name)) return false
    if (options?.colorAttributeName && attr.name === options.colorAttributeName) return false
    return isSizeAttributeName(attr.name)
  })
  if (nonColorAttr?.value) return nonColorAttr.value

  if (sku.variantLabel) {
    const parts = sku.variantLabel.split('|').map((part) => part.trim()).filter(Boolean)
    const specParts = parts.filter((part) => {
      if (options?.currentColorValue && part === options.currentColorValue) return false
      if (options?.colorAttributeName) {
        const colorOnSku = getSkuAttributeValue(sku, options.colorAttributeName)
        if (colorOnSku && part === colorOnSku) return false
      }
      return true
    })
    if (specParts.length > 0) return specParts.join(' / ')
  }

  return options?.defaultLabel || 'Default'
}

export const ProductDetailView = ({ state, handlers }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const canViewPrice = useCanViewStorePrice()
  const {
    loading,
    error,
    product,
    relatedProducts,
    selectedSku,
    activeImage,
    submitting,
    sortedGallery,
    isPurchasable,
    totalSelectedQty,
    colorAttribute,
    sizeAttribute,
    manualColorValue,
    canAddToCart,
    selectionHighlight,
    productMinOrderQty,
    supportsMixedBatch,
    detailPreview,
  } = state;
  const isColorSelected =
    !colorAttribute || Boolean(String(manualColorValue || '').trim())
  const {
    handleSkuQuantityChange,
    handleColorSelect,
    handleAddToCart,
    handleRelatedClick,
    setActiveImage,
    getSkuLineQuantity,
    resolveLineMinOrderQty,
  } = handlers;
  const addToCartEvents = useChromeActivate(() => {
    void handleAddToCart()
  })

  const gallery = useMemo(() => {
    const list = (sortedGallery || []).filter((item) => item.url);
    return list.length > 0 ? list : product?.mainImageUrl ? [{ url: product.mainImageUrl }] : [];
  }, [sortedGallery, product?.mainImageUrl]);

  const activeIndex = Math.max(
    0,
    gallery.findIndex((item) => item.url === activeImage),
  );

  const colorAttributeGroup = colorAttribute
  const sizeAttributeGroup = sizeAttribute

  const useTwoLevelLayout = Boolean(colorAttributeGroup)

  const colorSwatches = useMemo(() => {
    if (!product || !colorAttributeGroup) return []

    return colorAttributeGroup.values
      .map((value) => {
        const skusForColor = product.skus.filter(
          (sku) => getSkuAttributeValue(sku, colorAttributeGroup.name) === value,
        )
        // 优先取该颜色下带独立缩略图的 SKU，避免回落到无图 SKU 再误用主图
        const representativeSku =
          skusForColor.find((sku) => Boolean(sku.imageUrl)) || skusForColor[0] || null

        return representativeSku
          ? {
              value,
              sku: representativeSku,
              imageUrl: representativeSku.imageUrl || '',
            }
          : null
      })
      .filter((item): item is { value: string; sku: typeof product.skus[number]; imageUrl: string } => Boolean(item))
  }, [product, colorAttributeGroup])

  // 预热主图尺寸(960)，让点击颜色后左侧大图秒出（缩略图只有 200 宽、URL 不同不会命中）
  const preheatMainImage = useCallback((url?: string | null) => {
    if (typeof window === 'undefined' || !url) return;
    const proxied = toProxiedImageUrl(url, { width: 960 });
    if (!proxied) return;
    const img = new window.Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.src = proxied;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || colorSwatches.length === 0) return
    const isNarrow = isNarrowViewport()
    const urls = colorSwatches.slice(0, isNarrow ? 2 : 6).map((s) => s.imageUrl).filter(Boolean)
    if (urls.length === 0) return
    const run = () => urls.forEach((u) => preheatMainImage(u))
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    const cancel = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback
    const id = ric ? ric(run) : (setTimeout(run, 800) as unknown as number)
    return () => {
      if (ric && cancel) cancel(id)
      else clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
    }
  }, [colorSwatches, preheatMainImage])

  const specListTitle = sizeAttributeGroup
    ? t('product.sizeOptions')
    : t('product.specOptions')
  const productMoq = productMinOrderQty || product?.minOrderQty || 1
  const displayedMinOrderQty = productMoq

  const renderMoqLabel = (qty: number, className?: string) => {
    const unit = qty > 1 ? t('common.pieces') : t('common.piece')
    return (
      <p
        className={cn(
          'mt-1 text-sm font-semibold text-[#ff0000]',
          className,
        )}
      >
        {t('common.minOrder')}: {qty} {unit}
      </p>
    )
  }

  /** One row per size/spec. Color is chosen in the swatch grid, not duplicated here. */
  const specListRows = useMemo(() => {
    if (!product) return [] as Array<{ key: string; label: string; sku: ProductSkuData }>

    const sizeName = sizeAttributeGroup?.name
    const colorName = colorAttributeGroup?.name
    const defaultLabel = t('product.defaultSpec')
    const isPlaceholderSpec = (value?: string | null) =>
      /^(默认|默认规格|default|standard|n\/a|none|-|—|－)?$/i.test(String(value || '').trim())

    // Color-only: wait for a swatch, then a single row for that color.
    if (colorName && !sizeName) {
      if (!manualColorValue) return []
      const matched =
        product.skus.find((sku) => getSkuAttributeValue(sku, colorName) === manualColorValue) || null
      if (!matched) return []
      return [
        {
          key: matched.id,
          label: manualColorValue,
          sku: matched,
          orderLabel: manualColorValue,
        },
      ]
    }

    const computeLabelForSku = (sku: ProductSkuData): string => {
      const fromSize = sizeName ? getSkuAttributeValue(sku, sizeName) : ''
      if (fromSize && !isPlaceholderSpec(fromSize)) return fromSize
      const label = getSpecDisplayLabel(sku, {
        sizeAttributeName: sizeName,
        colorAttributeName: colorName,
        currentColorValue: manualColorValue || undefined,
        defaultLabel,
      })
      return isPlaceholderSpec(label) ? defaultLabel : label
    }

    const byKey = new Map<
      string,
      {
        orderLabel: string
        displayLabel: string
        sku: ProductSkuData
      }
    >()

    for (const sku of product.skus) {
      if (manualColorValue && colorName) {
        if (getSkuAttributeValue(sku, colorName) !== manualColorValue) continue
      }

      const orderLabel =
        sizeName && (!manualColorValue || colorName)
          ? getSkuAttributeValue(sku, sizeName) || computeLabelForSku(sku)
          : computeLabelForSku(sku)

      if (!orderLabel || isPlaceholderSpec(orderLabel)) continue

      const key = orderLabel.trim()
      if (!byKey.has(key)) {
        byKey.set(key, { orderLabel: key, displayLabel: key, sku })
      }
    }

    return Array.from(byKey.entries())
      .map(([key, v]) => ({
        key,
        label: v.displayLabel,
        sku: v.sku,
        orderLabel: v.orderLabel,
      }))
      .sort((a, b) => compareSizeLabels(a.orderLabel, b.orderLabel))
  }, [product, colorAttributeGroup, sizeAttributeGroup, manualColorValue, t])

  const renderSpecRow = (row: { key: string; label: string; sku: ProductSkuData }) => {
    const { sku, label: specLabel } = row
    const qty = getSkuLineQuantity(sku.id)
    const lineMoq = resolveLineMinOrderQty(sku)
    const priceParts = formatUsdParts(sku.price)
    const rawModelLabel = specLabel || sku.variantLabel || sku.skuCode
    const modelLabel = translateAttributeValue(t, rawModelLabel) || rawModelLabel
    const canUseStepper = Boolean(isPurchasable) && isColorSelected
    // 单规格：数量锁在起订量，减号在下限时禁用；混批：可减到 0 取消该行
    const canDecrease = supportsMixedBatch ? qty > 0 : qty > lineMoq

    return (
      <div key={row.key} className="product-sku-row">
        <div className="product-sku-main">
          <span className="product-sku-name" title={modelLabel}>
            {modelLabel}
          </span>
          <span className="product-sku-price">
            {canViewPrice ? (
              <>
                <span className="product-sku-price-prefix">{priceParts.prefix}</span>
                <span className="product-sku-price-num">{priceParts.amount}</span>
              </>
            ) : (
              <GuestPricePlaceholder compact className="product-sku-price-num" />
            )}
          </span>
        </div>

        <div className="product-sku-stepper">
          <button
            type="button"
            className="product-sku-stepper-btn"
            disabled={!canUseStepper || !canDecrease}
            aria-label={t('product.decreaseQty')}
            title={
              !isColorSelected
                ? t('product.selectColorFirst', { defaultValue: 'Please select a color first' })
                : !supportsMixedBatch && qty > 0 && qty <= lineMoq
                  ? t('product.moqFloorHint', {
                      defaultValue: 'Quantity cannot be lower than MOQ',
                      qty: lineMoq,
                    })
                  : undefined
            }
            onClick={() => void handleSkuQuantityChange(sku.id, 'dec')}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="product-sku-stepper-qty">{qty}</span>
          <button
            type="button"
            className="product-sku-stepper-btn"
            disabled={!canUseStepper || qty >= 9999 || sku.stockStatus === 'OUT_OF_STOCK'}
            aria-label={t('product.increaseQty')}
            title={!isColorSelected ? t('product.selectColorFirst', { defaultValue: 'Please select a color first' }) : undefined}
            onClick={() => void handleSkuQuantityChange(sku.id, 'inc')}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return withStorefrontHeader(
      <section className="flex min-h-[50vh] w-full items-center justify-center bg-[#FFF5F5]">
        {detailPreview?.image ? (
          <div className="storefront-container w-full py-5">
            <div className="mx-auto max-w-xl">
              <div className="relative aspect-square overflow-hidden rounded-[4px] bg-[#f3f3f3]">
                <OptimizedProductImage
                  src={detailPreview.image}
                  alt={detailPreview.name || ''}
                  className="size-full"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  imageWidth={1600}
                  priority
                />
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/25 to-transparent pb-6">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#64748B]">
                    <div className="size-4 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
                    Loading product...
                  </div>
                </div>
              </div>
              {detailPreview.name ? (
                <p className="mt-3 truncate text-center text-sm font-medium text-[#111]">{detailPreview.name}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-[#64748B]">
            <div className="size-8 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
            <p className="text-sm font-medium uppercase tracking-wide">Loading product...</p>
          </div>
        )}
      </section>,
    );
  }

  if (error) {
    return withStorefrontHeader(
      <section className="flex min-h-[50vh] w-full items-center justify-center bg-[#FFF5F5] px-6">
        <Alert variant="destructive" className="w-full max-w-xl border-[#EF4444] bg-[#FEF2F2]">
          <AlertTriangle className="size-5" />
          <AlertTitle className="font-bold text-[#EF4444]">{t('product.openFailed')}</AlertTitle>
          <AlertDescription className="space-y-3 text-[#7F1D1D]">
            <p>{error}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-1 border-[#FECACA] bg-white text-[#991B1B] hover:bg-[#FEF2F2]"
              onClick={() => {
                router.push('/')
              }}
            >
              {t('product.backHome')}
            </Button>
          </AlertDescription>
        </Alert>
      </section>,
    );
  }

  if (!product) {
    return withStorefrontHeader(
      <section className="flex min-h-[60vh] w-full items-center justify-center bg-[#FFF5F5]">
        <div className="flex flex-col items-center gap-4 text-[#64748B]">
          <PackageSearch className="size-12 text-[#CBD5E1]" />
          <p className="text-base font-medium">{t('product.notFound')}</p>
        </div>
      </section>,
    );
  }

  // Display filter only: keep customer-useful whitelist fields (see productSpecWhitelist)
  const descriptionRows = filterDescriptionParamsByWhitelist(product.descriptionParams);

  const shiftGallery = (delta: number) => {
    if (gallery.length === 0) return;
    const next = (activeIndex + delta + gallery.length) % gallery.length;
    if (gallery[next]?.url) setActiveImage(gallery[next].url!);
  };

  return withStorefrontHeader(
      <div className="product-detail-page bg-[#FFF5F5] text-[#111111]" data-controller-name="B2B商品详情布局">
      {!isPurchasable ? (
        <div className="border-b border-[#e5e5e5] bg-[#fff7ed] px-4 py-3 text-center text-sm font-medium text-[#9a3412]">
          {t('product.unavailable', { status: t(PRODUCT_STATUS_I18N[product.status]) })}
        </div>
      ) : null}

      <div className="storefront-container py-5">
        <div className="product-detail-layout">
          {/* ===== 主图区 ===== */}
          <section className="product-detail-gallery" data-controller-name="详情主图区">
            <div className="rounded-[4px] bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:p-4">
              <div className="product-detail-gallery-stage">
                <div className="product-detail-thumbs-desktop">
                  {gallery.slice(0, 6).map((item, index) => (
                    <button
                      key={`${item.url}-${index}`}
                      type="button"
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-[2px] border bg-[#f3f3f3]',
                        activeImage === item.url ? 'border-[#111111]' : 'border-transparent hover:border-[#ccc]',
                      )}
                      onClick={() => item.url && setActiveImage(item.url)}
                    >
                      <OptimizedProductImage
                        src={item.url}
                        alt={product.name}
                        className="size-full"
                        sizes="72px"
                        imageWidth={160}
                      />
                    </button>
                  ))}
                </div>

                <div className="product-detail-main-image">
                  <div className="product-detail-main-stage">
                    <OptimizedProductImage
                      fill={false}
                      src={activeImage || product.mainImageUrl}
                      alt={product.name}
                      className="product-detail-main-stage-img"
                      imageWidth={1600}
                      priority
                    />
                    <button
                      type="button"
                      className="absolute left-2 top-1/2 z-[1] flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111] shadow"
                      onClick={() => shiftGallery(-1)}
                      aria-label={t('product.prevImage')}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 z-[1] flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111] shadow"
                      onClick={() => shiftGallery(1)}
                      aria-label={t('product.nextImage')}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>

                  <div className="product-detail-thumbs-mobile">
                    {gallery.slice(0, 8).map((item, index) => (
                      <button
                        key={`m-${item.url}-${index}`}
                        type="button"
                        className={cn(
                          'relative aspect-square w-full overflow-hidden rounded-[2px] border bg-[#f3f3f3]',
                          activeImage === item.url ? 'border-[#111111]' : 'border-transparent',
                        )}
                        onClick={() => item.url && setActiveImage(item.url)}
                      >
                        <OptimizedProductImage
                          src={item.url}
                          alt=""
                          className="size-full"
                          sizes="56px"
                          imageWidth={160}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 购买区（小屏在图下，大屏右侧） ===== */}
          <section className="product-detail-buy space-y-3" data-controller-name="详情右侧购买区">
            <div className="rounded-[4px] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:p-5">
              <h1 className="product-detail-title text-[1.25rem] font-semibold leading-snug text-[#111111] sm:text-[1.375rem]">
                {product.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#666]">
                <span className="inline-flex items-center gap-1 rounded bg-[#fff7ed] px-2 py-1 font-semibold text-[#c2410c]">
                  #{Math.max(1, Math.min(99, Math.round((5 - product.ratingAverage) * 10) || 2))}{' '}
                  {t('common.bestSeller')}
                </span>
                <span>
                  {t('common.itemNo')} {product.productCode}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                  {product.ratingAverage?.toFixed(1) || '0.0'}
                </span>
                <span>
                  {product.ratingCount || 0} {t('common.reviews')}
                </span>
              </div>

              <div className="mt-3 text-xs font-medium uppercase tracking-wide text-[#999]">
                {t('common.wholesale')}
              </div>

              <div className="mt-2 space-y-3">
                  <div>
                    <StorePrice className="text-[22px] font-bold leading-none sm:text-[26px]">
                      <p className="text-[22px] font-bold leading-none text-[#111] sm:text-[26px]">
                        {selectedSku
                          ? formatUsd(selectedSku.price)
                          : formatUsdRange(product.priceMin, product.priceMax)}
                      </p>
                    </StorePrice>
                    <div className="mt-1">{renderMoqLabel(displayedMinOrderQty)}</div>
                  </div>

                  {useTwoLevelLayout ? (
                    <div className="space-y-3">
                      <div
                        className={cn(
                          'rounded-[8px] p-1 transition',
                          selectionHighlight.color && 'animate-shake-x border-2 border-red-500 ring-2 ring-red-200',
                        )}
                      >
                        <div className="mb-2 text-sm font-semibold text-[#111]">
                          {manualColorValue
                            ? `${t('common.color')}: ${translateColorName(t, manualColorValue)}`
                            : t('common.color')}
                        </div>
                        <div className="product-color-swatch-list">
                          {colorSwatches.map((swatch, swatchIndex) => (
                            <ColorSwatchButton
                              key={swatch.value}
                              colorLabel={translateColorName(t, swatch.value)}
                              previewUrl={swatch.imageUrl || product.mainImageUrl || ''}
                              isSelected={manualColorValue === swatch.value}
                              isPurchasable={isPurchasable}
                              priority={swatchIndex < 4}
                              onSelect={() => handleColorSelect(swatch.value, swatch.imageUrl)}
                              onPreheat={() => preheatMainImage(swatch.imageUrl || product.mainImageUrl)}
                            />
                          ))}
                        </div>
                      </div>

                      <div
                        className={cn(
                          'rounded-[8px] transition',
                          selectionHighlight.size && 'animate-shake-x border-2 border-red-500 ring-2 ring-red-200 p-1',
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-[#111]">{specListTitle}</span>
                          <span className="text-[#888]">{specListRows.length} {t('common.options')}</span>
                        </div>
                        {!isColorSelected ? (
                          <p className="mb-2 text-xs text-rose-600">
                            {t('product.selectColorFirst', { defaultValue: 'Please select a color first' })}
                          </p>
                        ) : null}
                        <div className="product-sku-list max-h-[420px] overflow-y-auto">
                          {specListRows.length > 0 ? (
                            specListRows.map((row) => renderSpecRow(row))
                          ) : (
                            <div className="px-2 py-8 text-center text-sm text-[#888]">
                              {t('product.noOptions')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[8px]">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#111]">{specListTitle}</span>
                        <span className="text-[#888]">{specListRows.length} {t('common.options')}</span>
                      </div>
                      <div className="product-sku-list max-h-[420px] overflow-y-auto">
                        {specListRows.map((row) => renderSpecRow(row))}
                      </div>
                    </div>
                  )}

                  {product.priceTiers.length > 0 ? (
                    <div className="overflow-hidden rounded-[2px] border border-[#ececec]">
                      <div
                        className="grid bg-[#fafafa] text-center text-xs font-medium text-[#666]"
                        style={{ gridTemplateColumns: `repeat(${product.priceTiers.length}, minmax(0, 1fr))` }}
                      >
                        {product.priceTiers.map((tier) => (
                          <div key={`q-${tier.label}`} className="border-r border-[#ececec] px-2 py-2 last:border-r-0">
                            {tier.label}
                          </div>
                        ))}
                      </div>
                      <div
                        className="grid text-center text-sm font-semibold text-[#111]"
                        style={{ gridTemplateColumns: `repeat(${product.priceTiers.length}, minmax(0, 1fr))` }}
                      >
                        {canViewPrice ? (
                          product.priceTiers.map((tier) => (
                            <div key={`p-${tier.label}`} className="border-r border-[#ececec] px-2 py-2.5 last:border-r-0">
                              {formatUsd(tier.price)}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full px-2 py-2.5">
                            <GuestPricePlaceholder compact className="mx-auto block text-center" />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[2px] border border-[#ececec] bg-[#fafafa] px-3 py-3">
                    <div className="flex items-start gap-2 text-sm text-[#333]">
                      <Truck className="mt-0.5 size-4 shrink-0 text-[#666]" />
                      <div>
                        <p className="font-semibold text-[#111]">Delivery</p>
                        <p className="mt-1 text-[#555]">Prepare time: 3-5 days</p>
                      </div>
                    </div>
                  </div>

                  {product.coupons.length > 0 ? (
                    <div className="space-y-2" data-controller-name="详情优惠券模块">
                      {product.coupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="flex items-center justify-between gap-3 rounded-[2px] border border-[#f5d0a9] bg-[linear-gradient(90deg,#fff7ed,#ffedd5)] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#9a3412]">{coupon.amountLabel}</p>
                            <p className="truncate text-xs text-[#a16207]">{coupon.title}</p>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 text-xs font-semibold text-[#c2410c] hover:underline"
                          >
                            {coupon.ctaLabel}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="product-detail-buy-actions space-y-2">
                    {productMoq > 1 ? (
                      <div
                        className={cn(
                          'flex items-center justify-between rounded-[2px] border px-3 py-2 text-sm',
                          totalSelectedQty >= productMoq
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-red-200 bg-red-50 text-[#ff0000]',
                        )}
                      >
                        <span className="font-semibold">
                          {t('product.moqProgress', {
                            selected: totalSelectedQty,
                            moq: productMoq,
                            defaultValue: `Selected: ${totalSelectedQty} / ${productMoq} pcs`,
                          })}
                        </span>
                        {totalSelectedQty > 0 && totalSelectedQty < productMoq ? (
                          <span className="text-xs font-medium">
                            {t('product.moqNeedMore', {
                              count: productMoq - totalSelectedQty,
                              defaultValue: `Need ${productMoq - totalSelectedQty} more`,
                            })}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <Button
                      type="button"
                      className={cn(
                        'h-12 w-full rounded-[2px] text-base font-bold text-white transition',
                        canAddToCart && !submitting
                          ? 'bg-[#f254a6] hover:bg-[#e44798]'
                          : 'cursor-not-allowed bg-[#c8c8c8] hover:bg-[#c8c8c8]',
                      )}
                      disabled={!canAddToCart || submitting}
                      {...addToCartEvents}
                    >
                      <ShoppingCart className="mr-2 size-4" />
                      {submitting
                        ? t('product.adding')
                        : totalSelectedQty > 0
                          ? t('product.addToCartQty', { qty: totalSelectedQty })
                          : t('product.addToCart')}
                    </Button>
                  </div>
                </div>
            </div>
          </section>

          {/* ===== 参数表（小屏在购买区下方） ===== */}
          <section className="product-detail-desc" data-controller-name="详情参数描述区">
            <div className="rounded-[4px] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:p-5">
              <h2 className="text-base font-semibold text-[#111111]">{t('product.description')}</h2>
              <div className="mt-4 border-t border-[#ececec]">
                {descriptionRows.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {descriptionRows.map((row, index) => (
                      <div
                        key={`${row.key}-${index}`}
                        className="grid grid-cols-[minmax(5.5rem,7rem)_minmax(0,1fr)] border-b border-[#f0f0f0] text-sm"
                      >
                        <div className="bg-[#fafafa] px-3 py-2.5 font-medium text-[#666]">
                          {translateProductSpecLabel(row.key, t)}
                        </div>
                        <div className="break-words px-3 py-2.5 text-[#222]">
                          {translateProductSpecValue(row.key, row.value, t)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#8a8a8a]">
                    {product.source === 'IMPORT_1688'
                      ? t('product.noDescriptionParams')
                      : t('product.noManualDescriptionParams')}
                  </p>
                )}
              </div>
            </div>
          </section>

          {relatedProducts.length > 0 ? (
            <section className="product-detail-related mt-2 rounded-[4px] bg-white p-4 sm:p-5">
              <h2 className="text-base font-semibold text-[#111]">{t('common.relatedProducts')}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {relatedProducts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="overflow-hidden rounded-[2px] border border-[#ececec] text-left transition hover:border-[#111]"
                    onClick={() => handleRelatedClick(item.id)}
                  >
                    <div className="relative aspect-square bg-[#f3f3f3]">
                      <OptimizedProductImage
                        src={item.mainImageUrl}
                        alt={item.name}
                        className="size-full"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        imageWidth={800}
                      />
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="line-clamp-2 min-h-[2.5rem] text-sm text-[#222]">{item.name}</p>
                      <StorePrice compact className="text-sm font-bold">
                        <p className="text-sm font-bold text-[#111]">{formatUsd(item.minPrice)}</p>
                      </StorePrice>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>,
  );
};

export default ProductDetailView;
