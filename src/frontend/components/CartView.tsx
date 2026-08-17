'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Trash2, AlertCircle, ShoppingBag, ArrowRight, Store, BadgeDollarSign, RefreshCw, CheckCircle2, MessageCircle, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import EditableImg from '@/@base/EditableImg';
import { DecorateText } from '@/frontend/decorate/DecorateText';
import { CheckoutTopBar } from '@/frontend/components/CheckoutTopBar';
import { CheckoutSmartPanel, type CheckoutAddressForm } from '@/frontend/components/CheckoutSmartPanel';
import { OrderAmountOverview } from '@/frontend/components/OrderAmountOverview';
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage';
import type { CartState, CartHandlers } from '@/frontend/hooks/useCart';
import { useQuantityControl } from '@/frontend/hooks/useCart';
import { placeCheckoutOrder } from '@/frontend/actions/CheckoutOrder';
import { AccountOrders, Checkout, ProductDetail } from '@/frontend/route-params';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { computeCheckoutTotals, formatUsd, sumCartWeightGram } from '@/shared/checkoutSummary';
import { getCustomerServiceConfig } from '@/frontend/actions/CustomerService';
import { GuestAuthScreen } from '@/frontend/components/GuestAuthScreen';
import { useIsStorefrontGuest } from '@/frontend/components/GuestPricePlaceholder';
import {
  buildWhatsAppUrl,
  readCustomerServiceLocal,
  writeCustomerServiceLocal,
  type CustomerServiceConfig,
  DEFAULT_CUSTOMER_SERVICE_CONFIG,
} from '@/frontend/decorate/customerService';
import {
  translateProductSpecLabel,
  translateProductSpecValue,
} from '@/frontend/i18n/productSpecTranslate';

interface Props {
  state: CartState;
  handlers: CartHandlers;
}

/**
 * 局部受控数量输入组件
 */
const QuantityControl = ({
  initialValue,
  max,
  disabled,
  onUpdate
}: {
  initialValue: number;
  max: number;
  disabled: boolean;
  onUpdate: (val: number) => void;
}) => {
  const {
    val,
    handleMinus,
    handlePlus,
    handleChange,
    handleBlur,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd
  } = useQuantityControl(initialValue, max, onUpdate);
  return <fieldset disabled={disabled} className="mobile-cart-qty inline-flex h-8 items-center overflow-hidden bg-[#F1F5F9] focus-within:ring-2 focus-within:ring-[#f254a6]/35 transition-all duration-200" data-api-unique-id='cartview-r3e00996ab3a0c5ab-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
      <button type="button" onClick={handleMinus} disabled={disabled || Number(val) <= 1} className="flex h-full w-8 items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-50 transition-colors" aria-label="Decrease quantity" data-api-unique-id='cartview-rb009f8f48daf54de-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
        <Minus className="size-3.5" data-api-unique-id='cartview-r2cdb4196d925e59d-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
      </button>
      <Input type="text" value={val} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} className="h-full w-9 border-0 bg-transparent p-0 text-center font-body text-sm text-[#0F172A] focus-visible:outline-none focus-visible:ring-0 rounded-none" aria-label="Quantity" data-api-unique-id='cartview-r3985fe31fc48ad8b-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
      <button type="button" onClick={handlePlus} disabled={disabled || Number(val) >= max} className="flex h-full w-8 items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-50 transition-colors" aria-label="Increase quantity" data-api-unique-id='cartview-r97ac9a4c6c9b44cc-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
        <Plus className="size-3.5" data-api-unique-id='cartview-rf62224822c3caf62-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
      </button>
    </fieldset>;
};
export const CartView = ({
  state,
  handlers
}: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const guest = useIsStorefrontGuest();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [checkoutAddress, setCheckoutAddress] = useState<CheckoutAddressForm | null>(null);
  const [selectedShippingFee, setSelectedShippingFee] = useState<number | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [placedOrderNo, setPlacedOrderNo] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [customerService, setCustomerService] = useState<CustomerServiceConfig>(() =>
    readCustomerServiceLocal(),
  );

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, []);

  useEffect(() => {
    let cancelled = false
    getCustomerServiceConfig()
      .then((res) => {
        if (cancelled) return
        if (res.persisted) {
          setCustomerService(res.config)
          writeCustomerServiceLocal(res.config)
        } else {
          setCustomerService(readCustomerServiceLocal())
        }
      })
      .catch(() => {
        if (!cancelled) setCustomerService(readCustomerServiceLocal())
      })
    return () => {
      cancelled = true
    }
  }, []);

  const whatsappOrderUrl = useMemo(
    () =>
      buildWhatsAppUrl(
        customerService.whatsappNumber || DEFAULT_CUSTOMER_SERVICE_CONFIG.whatsappNumber,
        placedOrderNo ? `Order #: ${placedOrderNo}` : undefined,
      ) || `https://wa.me/${DEFAULT_CUSTOMER_SERVICE_CONFIG.whatsappNumber}`,
    [customerService.whatsappNumber, placedOrderNo],
  );

  const totalPieces = useMemo(
    () => state.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [state.items],
  );

  const checkoutTotals = useMemo(() => {
    if (!state.summary) {
      return computeCheckoutTotals({
        originalPriceUsd: 0,
        discountUsd: 0,
        shippingFeeUsd: null,
      })
    }
    return computeCheckoutTotals({
      originalPriceUsd: Number(state.summary.totalPrice) || 0,
      discountUsd: Number(state.summary.discount) || 0,
      shippingFeeUsd: selectedShippingFee,
    })
  }, [selectedShippingFee, state.summary]);

  const payableAmountValue = checkoutTotals.totalUsd;

  const totalWeightGram = useMemo(
    () => sumCartWeightGram(state.items, state.summary?.totalWeightGram),
    [state.items, state.summary?.totalWeightGram],
  );

  const cartTotalWeightKg = useMemo(() => {
    if (!Number.isFinite(totalWeightGram) || totalWeightGram <= 0) return 0;
    return totalWeightGram / 1000;
  }, [totalWeightGram]);

  const itemIds = useMemo(() => state.items.map((item) => item.cartItemId), [state.items]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => itemIds.includes(id)));
  }, [itemIds]);

  const allSelected = itemIds.length > 0 && itemIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? itemIds : []);
  };

  const toggleSelectItem = (cartItemId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(cartItemId) ? prev : [...prev, cartItemId];
      }
      return prev.filter((id) => id !== cartItemId);
    });
  };

  const pinkCheckboxClass =
    'size-5 rounded-[6px] border-2 border-[#ffc0cb] bg-white shadow-none data-[state=checked]:border-[#f254a6] data-[state=checked]:bg-[#f254a6] data-[state=checked]:text-white focus-visible:ring-[#f254a6]/30';

  if (guest) {
    return <GuestAuthScreen initialTab="register" />;
  }

  return <>
    <CheckoutTopBar />
    <main className="mobile-cart-page relative w-full min-h-screen bg-[#FFF5F5] selection:bg-[#0055FF] selection:text-white" data-api-unique-id='cartview-re268a5b801353ed5-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
      <section className="w-full bg-[#FFF5F5]" data-controller-name="购物车核心区域" data-api-unique-id='cartview-raff0b9bb077008c4-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
        <div className="storefront-container py-4 md:py-5" data-api-unique-id='cartview-rff8b61084508686f-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
          {state.loading ? <div className="flex flex-col items-center justify-center py-16 space-y-4" data-api-unique-id='cartview-rd3cf8db919d29906-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
              <div className="size-10 border-4 border-[#E2E8F0] border-t-[#0055FF] rounded-full animate-spin" data-api-unique-id='cartview-r34b9746ed8020b93-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'></div>
              <p className="font-body text-[#64748B] text-sm animate-pulse" data-api-unique-id='cartview-rec6f0276db62fcd2-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                <DecorateText propKey="cart_loading_text" as="span">Loading your latest sourcing cart...</DecorateText>
              </p>
            </div> : state.isEmpty ? <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#f0dede] bg-white py-14 text-center" data-api-unique-id='cartview-r036c03a333318b2e-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
              <div className="size-14 bg-[#E2E8F0] rounded-full flex items-center justify-center mb-4" data-api-unique-id='cartview-rb802da84aae770aa-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                <ShoppingBag className="size-7 text-[#64748B]" data-api-unique-id='cartview-reb9f92d7066c2067-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
              </div>
              <h2 className="font-header text-xl font-bold text-[#0F172A] mb-2" data-api-unique-id='cartview-r8c7570453fbcc4af-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                <DecorateText propKey="cart_empty_title" as="span">Your sourcing cart is empty</DecorateText>
              </h2>
              <p className="font-body text-[#64748B] max-w-md mb-5 text-sm" data-api-unique-id='cartview-rd75380e2bdc0bd18-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                <DecorateText propKey="cart_empty_desc" as="span">Add products from category listings and return here to prepare your next wholesale order.</DecorateText>
              </p>
              <Button onClick={handlers.handleNavigateToDefault} className="rounded-full bg-white px-6 py-5 text-sm font-bold text-[#f254a6] shadow-sm ring-1 ring-[#ffc0cb] transition-all duration-300 hover:bg-[#fff5f8] active:scale-[0.98]" data-api-unique-id='cartview-r94981eb42507029c-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                <DecorateText propKey="cart_empty_continue_btn" as="span">{t('common.continueShopping')}</DecorateText>
              </Button>
            </div> : <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12 xl:gap-5" data-api-unique-id='cartview-r58a70c7c14e014c6-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
              <div className="mobile-cart-list-shell flex max-h-none flex-col overflow-hidden rounded-[12px] border border-[#f0dede] bg-white p-3 sm:p-4 md:max-h-[80vh] xl:col-span-8 xl:h-[80vh]" data-api-unique-id='cartview-r3f22438c72796820-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 py-1" data-api-unique-id='cartview-r5e264d24a5bba2be-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                  <div className="flex items-center gap-2 min-w-0" data-api-unique-id='cartview-r80afdd634904788b-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                    <h2 className="font-header text-lg font-bold text-[#0F172A] tracking-tight" data-api-unique-id='cartview-r480ac6e497713a5c-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                      <DecorateText propKey="cart_product_list_title" as="span">{t('checkout.productList')}</DecorateText>
                    </h2>
                    <span className="inline-flex items-center bg-[#fff0f5] px-2 py-0.5 text-xs font-semibold text-[#f254a6]" data-api-unique-id='cartview-rf0d94b2603cf5a85-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                      {totalPieces} pieces
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5" data-api-unique-id='cartview-r1b58c3614bcea55c-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                    <Button variant="ghost" onClick={handlers.handleNavigateToDefault} className="h-8 rounded-none px-2.5 text-sm font-bold text-[#f254a6] hover:bg-[#fff0f5] hover:text-[#f254a6]" data-api-unique-id='cartview-re17cf5eda658ba93-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                      <Store className="size-3.5 mr-1.5 text-[#f254a6]" data-api-unique-id='cartview-rcf5830ae778f1148-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
                      <DecorateText propKey="cart_continue_sourcing_btn" as="span">{t('common.continueShopping')}</DecorateText>
                    </Button>
                    {state.hasInvalidItems && <Button variant="ghost" size="sm" onClick={handlers.handleRemoveInvalid} disabled={state.actionLoading} className="h-8 rounded-none px-2.5 text-sm font-medium text-[#0F172A] hover:bg-[#E2E8F0]" data-api-unique-id='cartview-rcb9c953ac31165fd-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                        <RefreshCw className="size-3.5 mr-1.5" data-api-unique-id='cartview-r2895e68fc56dbd46-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
                        <DecorateText propKey="cart_clear_unavailable_btn" as="span">Clear unavailable lines</DecorateText>
                      </Button>}
                    <Button variant="ghost" size="sm" onClick={() => handlers.setIsClearConfirmOpen(true)} disabled={state.actionLoading} className="h-8 rounded-none px-2.5 text-sm font-medium text-[#EF4444] hover:bg-[#EF4444]/10" data-api-unique-id='cartview-rb1ebe20d8049f152-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                      <Trash2 className="size-3.5 mr-1.5" data-api-unique-id='cartview-r4b96dd4066ce7ba8-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
                      <DecorateText propKey="cart_clear_all_btn" as="span">Clear all</DecorateText>
                    </Button>
                  </div>
                </header>

                {state.hasInvalidItems && <div className="flex shrink-0 items-start gap-2 bg-[#FEF2F2] px-3 py-2.5 text-sm" data-controller-name="购物车失效商品提示" data-api-unique-id='cartview-r6dc07af29d22b732-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                    <AlertCircle className="size-4 mt-0.5 shrink-0 text-[#DC2626]" data-api-unique-id='cartview-r7da23fa36ea93485-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
                    <div className="font-body text-[#991B1B] leading-relaxed text-sm" data-api-unique-id='cartview-re4d37a13e0c25ed7-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                      <span className="font-semibold" data-api-unique-id='cartview-r1ee3bed521588563-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                        <DecorateText propKey="cart_invalid_alert_title" as="span">Unavailable lines detected.</DecorateText>
                      </span>
                      <span className="ml-1" data-api-unique-id='cartview-rfc2417b7126e0b02-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                        <DecorateText propKey="cart_invalid_alert_desc" as="span">Remove them individually or use the batch clear action before proceeding to checkout.</DecorateText>
                      </span>
                    </div>
                  </div>}

                <div className="flex shrink-0 items-center gap-3 border-b border-[#e5e5e5] bg-transparent px-1 pb-2.5" data-controller-name="购物车全选栏">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                    aria-label={t('common.selectAll')}
                    className={pinkCheckboxClass}
                  />
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#0F172A] hover:text-[#f254a6]"
                    onClick={() => toggleSelectAll(!allSelected)}
                  >
                    {t('common.selectAll')}
                  </button>
                  <span className="text-xs text-[#64748B]">
                    {t('common.selectedCount', { selected: selectedIds.length, total: state.items.length })}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-api-unique-id='cartview-r1bdc0189f1b818e2-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                  {state.items.map((item) => <div key={item.cartItemId} className="mobile-cart-line border-b border-[#f0f0f0] bg-transparent py-3 shadow-none md:py-5" data-api-unique-id='cartview-r935a74be75be37e7-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                      <div className="mobile-cart-line__row grid grid-cols-[auto_5.25rem_minmax(0,1fr)] items-start gap-2.5 md:grid-cols-[28px_96px_minmax(0,1fr)] md:gap-3" data-api-unique-id='cartview-re17e46bc7c2fa346-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                          <div className="flex items-start justify-center pt-1">
                            <Checkbox
                              checked={selectedIds.includes(item.cartItemId)}
                              onCheckedChange={(checked) => toggleSelectItem(item.cartItemId, checked === true)}
                              aria-label={t('checkout.selectItem', { name: item.productName })}
                              className={pinkCheckboxClass}
                            />
                          </div>
                          <div className="relative flex items-start justify-center" data-api-unique-id='cartview-rf7a98182755d9be5-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                            <button
                              type="button"
                              onClick={() => ProductDetail.navigateToById(router, { productId: item.productId })}
                              className="mobile-cart-line__thumb relative aspect-square w-full max-w-[5.25rem] shrink-0 overflow-hidden bg-[#F1F5F9] cursor-pointer transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f254a6]/40 md:max-w-[96px]"
                              aria-label={item.productName}
                              data-api-unique-id='cartview-r5f1186b734437a3a-s3843595280'
                              data-api-unique-page-name='src/frontend/components/CartView'
                              data-api-in-loop='1'
                            >
                              <EditableImg
                                propKey={`cart-img-${item.cartItemId}`}
                                src={item.imageUrl || item.mainImageUrl || undefined}
                                keywords={item.imageUrl || item.mainImageUrl || item.productName}
                                fallbackSrc={item.mainImageUrl || undefined}
                                disableKeywordSearch
                                className="pointer-events-none h-full w-full object-cover md:object-contain"
                                data-api-unique-id='cartview-rf0f39ebfda21d17d-s3843595280'
                                data-api-unique-page-name='src/frontend/components/CartView'
                                data-api-in-loop='1'
                              />
                              {item.status === 'INVALID' && <div className="absolute left-1 top-1" data-api-unique-id='cartview-r30c4e56a56d03072-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                                  <Badge variant="destructive" className="rounded-none bg-[#EF4444] text-[9px] font-semibold text-white" data-api-unique-id='cartview-rb20ffdfd1b905bdf-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                                    Unavailable
                                  </Badge>
                                </div>}
                            </button>
                          </div>

                          <div className="mobile-cart-line__body flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2.5" data-api-unique-id='cartview-r7131081c3fa818d1-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                            <div className="min-w-0 space-y-1" data-api-unique-id='cartview-r406cb74892b2643a-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                                <h3 className="mobile-cart-line__title font-header text-sm font-semibold leading-snug text-[#0F172A] md:text-base" data-api-unique-id='cartview-r64316e0eade6ddaa-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                                  <button
                                    type="button"
                                    onClick={() => ProductDetail.navigateToById(router, { productId: item.productId })}
                                    className="line-clamp-2 text-left transition-colors hover:text-[#f254a6] hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f254a6]/40"
                                  >
                                    {item.productName}
                                  </button>
                                </h3>
                                {item.skuAttributes && item.skuAttributes.length > 0 && <div className="flex flex-wrap gap-1" data-api-unique-id='cartview-r4f75d13364ec3762-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                                    {item.skuAttributes.map((attr, index1) => <div key={index1} className="inline-flex max-w-full items-center bg-[#F1F5F9] px-1.5 py-0.5 font-body text-[11px] font-medium text-[#64748B] md:text-[10px] md:font-semibold md:uppercase md:tracking-[0.04em]" data-api-unique-id='cartview-r443a41401fde3abe-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                                        <span className="mr-1 opacity-70" data-api-unique-id='cartview-r3ba08fd515f27b2a-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1' data-api-bind-info={`item.skuAttributes-${index1}-name`} data-api-map-var-name='attr'>{translateProductSpecLabel(attr.name, t)}:</span>
                                        <span className="max-w-[120px] truncate text-[#0F172A] normal-case" data-api-unique-id='cartview-r34b8564756da5cab-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1' data-api-bind-info={`item.skuAttributes-${index1}-value`} data-api-map-var-name='attr'>{translateProductSpecValue(attr.name, attr.value, t)}</span>
                                      </div>)}
                                  </div>}
                                <p className="mobile-cart-line__price font-header text-sm font-bold text-[#0F172A]">
                                  {formatUsd(Number(item.price) || 0)}
                                  {Number(item.originalPrice) > Number(item.price) + 0.009 ? (
                                    <del className="ml-1.5 font-body text-xs font-semibold text-[#64748B]">{formatUsd(Number(item.originalPrice) || 0)}</del>
                                  ) : null}
                                </p>
                            </div>

                            {item.status === 'INVALID' && <div className="inline-flex max-w-full items-center gap-1.5 bg-[#FEF2F2] px-2 py-1 font-body text-[11px] text-[#B91C1C]" data-api-unique-id='cartview-r4525f2a09c7b91a0-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                                <AlertCircle className="size-3.5 shrink-0" data-api-unique-id='cartview-r6a6466944366cb17-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1' />
                                <span className="truncate" data-api-unique-id='cartview-rb071d92aebcdcf4a-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>{state.CART_ITEM_STATUS_LABELS[item.status]} · {item.invalidReason}</span>
                              </div>}

                            <div className="mobile-cart-line__actions flex items-center justify-between gap-2 pt-0.5" data-api-unique-id='cartview-r9e65d6e4ae1298b7-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                              <QuantityControl initialValue={item.quantity} max={item.stock} disabled={state.actionLoading || item.status === 'INVALID'} onUpdate={val => handlers.handleUpdateQuantity(item.cartItemId, val)} data-api-unique-id='cartview-r12e15f99691ee10a-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1' />
                              <Button variant="ghost" size="icon" onClick={() => handlers.handleRemoveItem(item.cartItemId)} disabled={state.actionLoading} className="size-8 shrink-0 rounded-none text-[#64748B] hover:bg-[#EF4444]/10 hover:text-[#EF4444]" aria-label={t('common.cancel')} data-api-unique-id='cartview-r8e026a7a0a7e016e-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1'>
                                  <Trash2 className="size-4" data-api-unique-id='cartview-r54c7ac71d33e46d6-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' data-api-in-loop='1' />
                                </Button>
                            </div>
                          </div>
                        </div>
                    </div>)}
                  <div className="flex items-center justify-between gap-3 border-t border-[#f0f0f0] px-1 py-4" data-controller-name="商品列表总额">
                    <span className="font-body text-sm font-semibold text-[#0F172A]">
                      <DecorateText propKey="cart_list_subtotal_label" as="span">
                        {t('checkout.subtotal', { defaultValue: 'Subtotal' })}
                      </DecorateText>
                    </span>
                    <span className="break-all text-right font-header text-base font-bold text-[#0F172A]">
                      {formatUsd(checkoutTotals.originalPriceUsd)}
                    </span>
                  </div>

                  {/* Mobile: go to address + shipping page (not inline expand) */}
                  <div className="mobile-cart-checkout-cta px-1 pb-3 xl:hidden" data-controller-name="移动端去结算">
                    <Button
                      type="button"
                      disabled={
                        state.actionLoading ||
                        state.isEmpty ||
                        state.items.every((item) => item.status === 'INVALID')
                      }
                      onClick={() => Checkout.navigateTo(router)}
                      className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#f254a6] py-5 text-base font-bold text-white hover:bg-[#e44798] disabled:opacity-50"
                    >
                      <DecorateText propKey="cart_go_checkout_btn" as="span">
                        {t('checkout.goCheckout', { defaultValue: 'Checkout' })}
                      </DecorateText>
                      <ArrowRight className="size-4 shrink-0" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="hidden xl:col-span-4 xl:sticky xl:top-[76px] xl:block" data-api-unique-id='cartview-r39276e9511f27071-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                {state.summary && <div className="flex max-h-[80vh] flex-col overflow-y-auto overscroll-contain rounded-[12px] border border-[#f0dede] bg-white xl:h-[80vh]" data-api-unique-id='cartview-rfe0b33b0e27d27a4-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                    <div className="space-y-3 px-4 py-3" data-api-unique-id='cartview-r51067957ab55614c-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                      <div className="flex items-start justify-between gap-2" data-api-unique-id='cartview-r93ff93501e254643-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                        <div data-api-unique-id='cartview-r156273ebcc80342e-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748B]" data-api-unique-id='cartview-rc103386b9062aaa0-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                            <DecorateText propKey="cart_summary_eyebrow" as="span">{t('checkout.smartCheckout')}</DecorateText>
                          </p>
                          <h3 className="mt-1 text-left font-header text-lg font-bold text-[#0F172A] bg-transparent" data-api-unique-id='cartview-r9233adefa9d771a0-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                            <DecorateText propKey="cart_summary_title" as="span" className="bg-transparent text-left">
                              {t('checkout.smartCheckout')}
                            </DecorateText>
                          </h3>
                        </div>
                        <div className="size-9 rounded-full bg-[#fff0f5] flex items-center justify-center text-[#f254a6]" data-api-unique-id='cartview-ref5e854919b64f93-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                          <BadgeDollarSign className="size-4" data-api-unique-id='cartview-r4412fc3e30841eda-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
                        </div>
                      </div>
                      {!addressConfirmed ? <div className="relative py-1" data-api-unique-id='cartview-r09e4fa516b1c369d-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#f3dfe6]" data-api-unique-id='cartview-r9bf0863ee7d52f6d-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
                          <DecorateText propKey="checkout_confirm_price_guide" as="div" className="relative mx-auto w-fit rounded-full border border-[#f3dfe6] bg-[#fff5f8] px-4 py-2 text-center font-body text-[15px] font-bold text-[#0F172A]">
                            Confirm quantity and price
                          </DecorateText>
                        </div> : null}
                    </div>

                    <div className="space-y-3 px-4 pb-3" data-api-unique-id='cartview-rfb87408212300a22-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                      <OrderAmountOverview
                        originalPriceUsd={checkoutTotals.originalPriceUsd}
                        discountUsd={checkoutTotals.discountUsd}
                        shippingFeeUsd={selectedShippingFee}
                        totalWeightGram={totalWeightGram}
                      />

                      <CheckoutSmartPanel
                        disabled={state.actionLoading || state.isEmpty || isPlacingOrder}
                        totalWeightKg={cartTotalWeightKg}
                        onConfirmedChange={setAddressConfirmed}
                        onConfirmAddress={({ address }) => {
                          setCheckoutAddress(address)
                        }}
                        onShippingChange={({ channelId, channelName, shippingFee }) => {
                          setSelectedChannelId(channelId)
                          setSelectedChannelName(channelName)
                          setSelectedShippingFee(shippingFee)
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-2.5 px-4 pb-4" data-api-unique-id='cartview-r372e9d2ca7c3b9a6-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                      <Button
                        type="button"
                        disabled={
                          state.actionLoading ||
                          isPlacingOrder ||
                          state.isEmpty ||
                          state.hasInvalidItems ||
                          !addressConfirmed ||
                          !checkoutAddress ||
                          !selectedChannelId ||
                          selectedShippingFee == null
                        }
                        onClick={async () => {
                          if (!checkoutAddress) {
                            toast.error(t('checkout.saveAddressFirst'))
                            return
                          }
                          if (!selectedChannelId || selectedShippingFee == null) {
                            toast.error(t('checkout.selectShipping'))
                            return
                          }
                          const validItems = state.items.filter((item) => item.status !== 'INVALID')
                          if (validItems.length === 0) {
                            toast.error(t('checkout.noOrderableItems'))
                            return
                          }

                          setIsPlacingOrder(true)
                          try {
                            const result = await placeCheckoutOrder({
                              address: checkoutAddress,
                              shipping: {
                                channelId: selectedChannelId,
                                channelName: selectedChannelName || 'Shipping',
                                shippingFee: selectedShippingFee,
                              },
                              items: validItems.map((item) => ({
                                productId: item.productId,
                                productSkuId: item.productSkuId,
                                quantity: item.quantity,
                                productName: item.productName,
                                unitPrice: item.price,
                              })),
                              finalAmount: payableAmountValue,
                              currencyCode: 'USD',
                            })

                            setPlacedOrderNo(result.orderNo)
                            setIsSuccessOpen(true)

                            // 后端已清空购物车，同步前端状态
                            await handlers.handleClearCartAfterOrder().catch(async () => {
                              // placeCheckoutOrder 已清库；再拉一次列表即可
                            })
                            setAddressConfirmed(false)
                            setCheckoutAddress(null)
                            setSelectedShippingFee(null)
                            setSelectedChannelId(null)
                            setSelectedChannelName(null)
                            setSelectedIds([])
                          } catch (error) {
                            toast.error((error as Error).message || t('checkout.placeOrderFailed'))
                          } finally {
                            setIsPlacingOrder(false)
                          }
                        }}
                        className="w-full bg-[#f254a6] text-white rounded-[10px] py-5 text-base font-bold hover:bg-[#e44798] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-center"
                        data-api-unique-id='cartview-rada22dc9a5aad413-s3843595280'
                        data-api-unique-page-name='src/frontend/components/CartView'
                      >
                        <DecorateText propKey="cart_place_order_btn" as="span">
                          {isPlacingOrder ? t('common.submitting') : t('common.placeOrder')}
                        </DecorateText>
                        <ArrowRight className="size-4 shrink-0" data-api-unique-id='cartview-r283073f0ccb3ff25-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
                      </Button>

                      <Button variant="ghost" onClick={handlers.handleNavigateToDefault} className="h-10 w-full rounded-none font-bold text-[#f254a6] hover:bg-[#fff0f5] hover:text-[#f254a6]" data-api-unique-id='cartview-r943deb4880aff48c-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
                        <DecorateText propKey="cart_summary_continue_btn" as="span">{t('common.continueShopping')}</DecorateText>
                      </Button>
                    </div>
                  </div>}
              </div>
            </div>}
        </div>
      </section>

      {!state.loading && state.recommended && state.recommended.length > 0 && (
        <section
          className="mobile-cart-recommend w-full border-t border-[#f0dede] bg-[#FFF5F5]"
          data-controller-name="结账页为您推荐"
          data-api-unique-id="cartview-r581a4d48dec3e4ec-s3843595280"
          data-api-unique-page-name="src/frontend/components/CartView"
        >
          <div
            className="storefront-container py-6 md:py-12"
            data-api-unique-id="cartview-rf06d969e16ae6d71-s3843595280"
            data-api-unique-page-name="src/frontend/components/CartView"
          >
            <header
              className="mb-3 md:mb-5"
              data-api-unique-id="cartview-ra7595b0b0ccd686f-s3843595280"
              data-api-unique-page-name="src/frontend/components/CartView"
            >
              <div
                data-api-unique-id="cartview-r68dabd1d5659b43d-s3843595280"
                data-api-unique-page-name="src/frontend/components/CartView"
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8073]">
                  Recommendation
                </p>
                <h2
                  className="font-header text-base font-bold tracking-tight text-[#0F172A] md:text-2xl"
                  data-api-unique-id="cartview-r34b74889e237a9ea-s3843595280"
                  data-api-unique-page-name="src/frontend/components/CartView"
                >
                  <DecorateText propKey="cart_recommend_title" as="span">
                    Source more best-sellers
                  </DecorateText>
                </h2>
                <p
                  className="mt-1 hidden font-body text-sm text-[#64748B] md:block"
                  data-api-unique-id="cartview-r8f63598308bd3558-s3843595280"
                  data-api-unique-page-name="src/frontend/components/CartView"
                >
                  <DecorateText propKey="cart_recommend_desc" as="span">
                    Continue browsing products often purchased together before checkout.
                  </DecorateText>
                </p>
              </div>
            </header>

            <div
              className="mobile-cart-recommend__grid grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-4 md:gap-3"
              data-api-unique-id="cartview-r0f2c1b4a9098bd6e-s3843595280"
              data-api-unique-page-name="src/frontend/components/CartView"
            >
              {state.recommended.map((prod) => (
                <button
                  key={prod.productId}
                  type="button"
                  onClick={() =>
                    ProductDetail.navigateToById(router, { productId: prod.productId })
                  }
                  className="mobile-cart-recommend__card group flex cursor-pointer flex-col overflow-hidden rounded-[8px] border border-[#eaeaea] bg-white text-left transition hover:border-[#f0dede]"
                  data-api-unique-id="cartview-rc51a6facd67736f2-s3843595280"
                  data-api-unique-page-name="src/frontend/components/CartView"
                  data-api-in-loop="1"
                >
                  <div
                    className="mobile-cart-recommend__media relative aspect-square w-full overflow-hidden bg-[#e8e4dc]"
                    data-api-unique-id="cartview-r19cf7a89b03fe4a2-s3843595280"
                    data-api-unique-page-name="src/frontend/components/CartView"
                    data-api-in-loop="1"
                  >
                    <OptimizedProductImage
                      src={prod.mainImageUrl}
                      alt={prod.name}
                      sizes="(max-width: 768px) 45vw, 20vw"
                      imageWidth={320}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div
                    className="flex flex-1 flex-col gap-1 p-2 md:p-3"
                    data-api-unique-id="cartview-r825df5e35dd12575-s3843595280"
                    data-api-unique-page-name="src/frontend/components/CartView"
                    data-api-in-loop="1"
                  >
                    <h3
                      className="mobile-cart-recommend__title font-header text-[0.8125rem] font-semibold leading-snug text-[#0F172A] line-clamp-2 md:text-sm"
                      data-api-unique-id="cartview-r662c8ab85e63e654-s3843595280"
                      data-api-unique-page-name="src/frontend/components/CartView"
                      data-api-in-loop="1"
                    >
                      {prod.name}
                    </h3>
                    <div
                      className="mt-auto"
                      data-api-unique-id="cartview-rd07fd5071a51e782-s3843595280"
                      data-api-unique-page-name="src/frontend/components/CartView"
                      data-api-in-loop="1"
                    >
                      <span
                        className="mobile-cart-recommend__price font-display text-sm font-bold text-[#0F172A] md:text-base"
                        data-api-unique-id="cartview-rbf2c99820992fe8f-s3843595280"
                        data-api-unique-page-name="src/frontend/components/CartView"
                        data-api-in-loop="1"
                      >
                        {typeof prod.priceMin === 'number'
                          ? formatUsd(Number(prod.priceMin) || 0)
                          : prod.priceMin}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <Dialog open={state.isClearConfirmOpen} onOpenChange={handlers.setIsClearConfirmOpen} data-api-unique-id='cartview-r9ac9b7ee0589ca7e-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
        <DialogContent className="bg-[#F8FAFC] border-0 rounded-none p-5 shadow-none max-w-md" data-api-unique-id='cartview-rd620c8ffed8994e1-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
          <DialogHeader className="space-y-2" data-api-unique-id='cartview-r3b0a8afe6ddc8785-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
            <div className="size-10 bg-[#EF4444]/10 rounded-full flex items-center justify-center mb-1 mx-auto" data-api-unique-id='cartview-rbca9f9ca63b28ab8-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
              <Trash2 className="size-5 text-[#EF4444]" data-api-unique-id='cartview-r6b0c45679b7aa642-s3843595280' data-api-unique-page-name='src/frontend/components/CartView' />
            </div>
            <DialogTitle className="font-header text-lg font-bold text-center text-[#0F172A]" data-api-unique-id='cartview-r82bd0524cf7cf2f9-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
              <DecorateText propKey="cart_clear_dialog_title" as="span">Clear entire sourcing cart?</DecorateText>
            </DialogTitle>
            <DialogDescription className="font-body text-[#64748B] text-center text-sm" data-api-unique-id='cartview-r9115dc33e76a0941-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
              <DecorateText propKey="cart_clear_dialog_desc" as="span">All selected product lines will be removed from this cart. This action cannot be undone.</DecorateText>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-5" data-api-unique-id='cartview-r4886c2249bfdfe48-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
            <Button variant="ghost" onClick={() => handlers.setIsClearConfirmOpen(false)} disabled={state.actionLoading} className="flex-1 rounded-none font-body font-medium text-[#0F172A] hover:bg-[#E2E8F0]" data-api-unique-id='cartview-r356ee1f7dace815a-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
              <DecorateText propKey="cart_clear_dialog_cancel_btn" as="span">Keep cart</DecorateText>
            </Button>
            <Button variant="destructive" onClick={handlers.handleClearCart} disabled={state.actionLoading} className="flex-1 rounded-none font-body font-medium bg-[#EF4444] text-[#F8FAFC] hover:bg-[#DC2626]" data-api-unique-id='cartview-r550e0744f7722859-s3843595280' data-api-unique-page-name='src/frontend/components/CartView'>
              <DecorateText propKey="cart_clear_dialog_confirm_btn" as="span">Confirm clear</DecorateText>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="w-[min(500px,calc(100%-2rem))] max-w-[500px] rounded-[20px] border border-[#f0dede] bg-white p-10 shadow-xl sm:max-w-[500px]">
          <DialogHeader className="space-y-4 text-center sm:text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#ecfdf5] text-[#16a34a]">
              <CheckCircle2 className="size-9" strokeWidth={2.25} />
            </div>
            <DialogTitle className="font-header text-3xl font-bold text-[#0F172A]">
              <DecorateText propKey="checkout_success_title" as="span">Checkout Success!</DecorateText>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Order placed successfully. Please contact WhatsApp to complete payment.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            <div className="flex flex-col items-center gap-3">
              <p className="font-body text-base font-semibold text-[#0F172A]">
                Order #: {placedOrderNo || '—'}
              </p>

              <div className="w-full rounded-[14px] border border-[#e8e8e8] bg-[#fafafa] px-5 py-4 text-center">
                <p className="font-body text-sm leading-7 text-[#475569]">
                  <DecorateText propKey="checkout_success_whatsapp_guide" as="span">
                    {customerService.successGuideText ||
                      DEFAULT_CUSTOMER_SERVICE_CONFIG.successGuideText}
                  </DecorateText>
                </p>
                <a
                  href={whatsappOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_-12px_rgba(37,211,102,0.8)] transition hover:bg-[#1ebe5d] hover:scale-105"
                  aria-label="Contact us on WhatsApp"
                  title="WhatsApp"
                >
                  <MessageCircle className="size-7" strokeWidth={2.25} />
                </a>
                <p className="mt-2 text-xs font-medium text-[#64748B]">WhatsApp</p>
              </div>

              <Button
                type="button"
                className="h-10 rounded-[10px] bg-[#25D366] px-5 text-sm font-bold text-white hover:bg-[#1ebe5d]"
                onClick={() => {
                  window.open(whatsappOrderUrl, '_blank', 'noopener,noreferrer')
                }}
              >
                Pay Now
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full rounded-[10px] font-bold text-[#f254a6] hover:bg-[#fff0f5] hover:text-[#f254a6]"
              onClick={() => {
                setIsSuccessOpen(false)
                AccountOrders.navigateTo(router)
              }}
            >
              <DecorateText propKey="checkout_success_view_orders_btn" as="span">{t('common.viewOrders')}</DecorateText>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showScrollTop ? (
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 flex size-11 items-center justify-center rounded-full border border-[#f0dede] bg-white text-[#f254a6] shadow-md transition hover:bg-[#fff0f5] active:scale-95"
        >
          <ChevronUp className="size-5" strokeWidth={2.5} />
        </button>
      ) : null}
    </main>
  </>;
};
export default CartView;
