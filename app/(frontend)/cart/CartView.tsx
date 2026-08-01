'use client';

import React from 'react';
import { Minus, Plus, Trash2, AlertCircle, ShieldCheck, Truck, Lock, ShoppingBag, ArrowRight, Store, PackageCheck, BadgeDollarSign, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import EditableImg from '@/@base/EditableImg';
import type { CartState, CartHandlers } from '@/frontend/hooks/useCart';
import { useQuantityControl } from '@/frontend/hooks/useCart';
import { formatUsd } from '@/shared/money';
interface Props {
  state: CartState;
  handlers: CartHandlers;
}

/**
 * 局部受控数量输入组件 - 严格遵循工业级外观设计
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
  return <fieldset disabled={disabled} className="inline-flex items-center h-10 bg-[#F1F5F9] border border-[#CBD5E1] rounded-[8px] overflow-hidden focus-within:ring-2 focus-within:ring-[#0055FF] focus-within:border-transparent transition-all duration-200">
      <button type="button" onClick={handleMinus} disabled={disabled || Number(val) <= 1} className="w-10 h-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <Input type="text" value={val} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} className="w-12 h-full border-0 bg-transparent text-center font-body text-base text-[#0F172A] p-0 focus-visible:ring-0 focus-visible:outline-none rounded-none" aria-label="Quantity" />
      <button type="button" onClick={handlePlus} disabled={disabled || Number(val) >= max} className="w-10 h-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </fieldset>;
};
export const CartView = ({
  state,
  handlers
}: Props) => {
  const validCount = state.items.filter(item => item.status !== 'INVALID').length;
  const invalidCount = state.items.length - validCount;
  /* Extracted array: _items */
  const _items = ['Review quantity and SKU details', 'Remove unavailable items and keep valid goods', 'Confirm the payable amount in the summary card'];
  return <main className="w-full min-h-screen bg-[#F8FAFC] relative selection:bg-[#0055FF] selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[99]" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
    }} />

      <section className="w-full bg-[#F8FAFC]" data-controller-name="结账页全局头部">
        <div className="container mx-auto px-8 py-14 md:py-16 border-b border-[#CBD5E1]/50">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F1F5F9] px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                <ShoppingBag className="size-4" />
                Wholesale cart
              </div>
              <div className="space-y-3">
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              </div>
            </div>

            {!state.loading && !state.isEmpty && <div className="rounded-[20px] border border-[#CBD5E1] bg-gradient-to-br from-[#0F172A] via-[#102B66] to-[#0055FF] p-6 text-white shadow-card-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Checkout guide</p>
                    <h2 className="mt-2 font-header text-2xl font-bold">Complete order in 3 steps</h2>
                  </div>
                  <div className="size-11 rounded-full bg-white/10 flex items-center justify-center">
                    <PackageCheck className="size-5" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {_items.map((tip, index) => <div key={index} className="flex items-start gap-3 rounded-[14px] border border-white/10 bg-white/8 px-4 py-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#0F172A] font-body text-xs font-bold">
                        {`0${index + 1}`}
                      </div>
                      <p className="font-body text-sm leading-relaxed text-white/90">{tip}</p>
                    </div>)}
                </div>
              </div>}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#F8FAFC]" data-controller-name="购物车核心区域">
        <div className="container mx-auto px-8 py-12 md:py-16">
          {state.loading ? <div className="flex flex-col items-center justify-center py-24 space-y-5">
              <div className="size-12 border-4 border-[#E2E8F0] border-t-[#0055FF] rounded-full animate-spin"></div>
              <p className="font-body text-[#64748B] text-base animate-pulse">Loading your latest sourcing cart...</p>
            </div> : state.isEmpty ? <div className="flex flex-col items-center justify-center py-20 bg-[#F1F5F9] border border-[#CBD5E1] rounded-[16px] shadow-sm text-center">
              <div className="size-18 bg-[#E2E8F0] rounded-full flex items-center justify-center mb-5">
                <ShoppingBag className="size-9 text-[#64748B]" />
              </div>
              <h2 className="font-header text-2xl font-bold text-[#0F172A] mb-2">Your sourcing cart is empty</h2>
              <p className="font-body text-[#64748B] max-w-md mb-7">
                Add products from category listings and return here to prepare your next wholesale order.
              </p>
              <Button onClick={handlers.handleNavigateToDefault} className="bg-[#0055FF] text-[#F8FAFC] hover:bg-[#0044CC] rounded-full px-8 py-6 text-base font-medium shadow-sm hover:shadow-[0_0_15px_rgba(0,85,255,0.3)] transition-all duration-300 active:scale-[0.98]">
                Continue Sourcing
              </Button>
            </div> : <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:gap-10 items-start">
              <div className="xl:col-span-8 flex flex-col gap-5">
                <header className="rounded-[20px] border border-[#CBD5E1] bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-header text-2xl font-bold text-[#0F172A] tracking-tight">Product list</h2>
                        <span className="inline-flex items-center rounded-full bg-[#E2E8F0] px-2.5 py-1 text-xs font-semibold text-[#0F172A]">
                          {state.items.length} lines
                        </span>
                      </div>
                      <p className="font-body text-sm text-[#64748B]">
                        Keep only order-ready products in this list. Quantity updates and line removal will refresh your payable amount immediately.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="outline" onClick={handlers.handleNavigateToDefault} className="rounded-full border-[#CBD5E1] bg-transparent text-[#0F172A] hover:bg-[#E2E8F0] font-medium px-5">
                        <Store className="size-4 mr-2" />
                        Continue Sourcing
                      </Button>
                      {state.hasInvalidItems && <Button variant="secondary" size="sm" onClick={handlers.handleRemoveInvalid} disabled={state.actionLoading} className="bg-[#E2E8F0] text-[#0F172A] hover:bg-[#CBD5E1] border border-[#CBD5E1] rounded-full font-body font-medium h-10 px-4">
                          <RefreshCw className="size-4 mr-2" />
                          Clear unavailable lines
                        </Button>}
                      <Button variant="ghost" size="sm" onClick={() => handlers.setIsClearConfirmOpen(true)} disabled={state.actionLoading} className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-full font-body font-medium h-10 px-4">
                        <Trash2 className="size-4 mr-2" />
                        Clear all
                      </Button>
                    </div>
                  </div>
                </header>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-[16px] border border-[#CBD5E1] bg-[#F1F5F9] p-4 shadow-sm">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Purchasing tips</p>
                    <p className="mt-2 font-body text-sm leading-relaxed text-[#0F172A]">Adjust quantity per SKU and verify stock before checkout.</p>
                  </div>
                  <div className="rounded-[16px] border border-[#CBD5E1] bg-[#F1F5F9] p-4 shadow-sm">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Settlement rule</p>
                    <p className="mt-2 font-body text-sm leading-relaxed text-[#0F172A]">Only valid items are counted in subtotal, shipping, and total amount.</p>
                  </div>
                  <div className="rounded-[16px] border border-[#CBD5E1] bg-[#F1F5F9] p-4 shadow-sm">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Action support</p>
                    <p className="mt-2 font-body text-sm leading-relaxed text-[#0F172A]">Unavailable goods can be removed one by one or cleared in batch.</p>
                  </div>
                </div>

                {state.hasInvalidItems && <div className="flex items-start gap-3 rounded-[16px] border border-[#EF4444]/25 bg-[#FEF2F2] px-4 py-4 text-sm" data-controller-name="购物车失效商品提示">
                    <AlertCircle className="size-4 mt-0.5 shrink-0 text-[#DC2626]" />
                    <div className="font-body text-[#991B1B] leading-relaxed">
                      <span className="font-semibold">Unavailable lines detected.</span>
                      <span className="ml-1">Remove them individually or use the batch clear action before proceeding to checkout.</span>
                    </div>
                  </div>}

                <div className="flex flex-col gap-4">
                  {state.items.map((item, index) => <Card key={item.cartItemId} className={`overflow-hidden rounded-[18px] border bg-white shadow-sm transition-all duration-300 hover:shadow-card-lg hover:-translate-y-0.5 ${item.status === 'INVALID' ? 'border-[#EF4444]/40' : 'border-[#CBD5E1]'}`}>
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[160px_minmax(0,1fr)]">
                          <div className="relative flex items-center justify-center border-b border-[#E2E8F0] bg-[#F1F5F9] p-5 lg:border-b-0 lg:border-r">
                            <div className="relative w-full max-w-[120px] shrink-0 overflow-hidden rounded-[12px] bg-[#E2E8F0] aspect-[4/5]">
                              <EditableImg propKey={`cart-img-${item.cartItemId}`} keywords={item.mainImageUrl} className="w-full h-full object-contain" />
                              {item.status === 'INVALID' && <div className="absolute left-2.5 top-2.5">
                                  <Badge variant="destructive" className="rounded-full bg-[#EF4444] text-white text-[11px] font-semibold">
                                    Unavailable
                                  </Badge>
                                </div>}
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 md:p-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                              <div className="min-w-0 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center rounded-full bg-[#E2E8F0] px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                                    Procurement item
                                  </span>
                                  {item.status !== 'INVALID' && <span className="inline-flex items-center rounded-full bg-[#ECFDF5] px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#15803D]">
                                      Ready
                                    </span>}
                                </div>
                                <h3 className="font-header text-lg font-semibold leading-tight text-[#0F172A] md:text-xl">
                                  {item.productName}
                                </h3>
                                {item.skuAttributes && item.skuAttributes.length > 0 && <div className="flex flex-wrap gap-2">
                                    {item.skuAttributes.map((attr, index1) => <div key={index1} className="inline-flex items-center rounded-[6px] bg-[#F1F5F9] px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B] max-w-full">
                                        <span className="mr-1 opacity-70">{attr.name}:</span>
                                        <span className="truncate text-[#0F172A] max-w-[140px]">{attr.value}</span>
                                      </div>)}
                                  </div>}
                              </div>

                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[320px]">
                                <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Unit price</p>
                                  <p className="mt-2 font-header text-base font-bold text-[#0F172A] break-all">{formatUsd(Number(item.price) || 0)}</p>
                                </div>
                                <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Line total</p>
                                  <p className="mt-2 font-header text-base font-bold text-[#0F172A] break-all">{formatUsd(Number(item.subtotal) || 0)}</p>
                                </div>
                                <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-3 col-span-2 sm:col-span-1">
                                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Stock</p>
                                  <p className="mt-2 font-header text-base font-bold text-[#0F172A]">{item.status === 'INVALID' ? '--' : item.stock}</p>
                                </div>
                              </div>
                            </div>

                            {item.status === 'INVALID' && <div className="inline-flex max-w-full items-center gap-2 rounded-[10px] border border-[#EF4444]/20 bg-[#FEF2F2] px-3 py-2 font-body text-sm text-[#B91C1C]">
                                <AlertCircle className="size-4 shrink-0" />
                                <span className="truncate">{state.CART_ITEM_STATUS_LABELS[item.status]} · {item.invalidReason}</span>
                              </div>}

                            <div className="flex flex-col gap-4 border-t border-[#E2E8F0] pt-4 md:flex-row md:items-center md:justify-between">
                              <div className="space-y-2">
                                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Quantity</p>
                                <QuantityControl initialValue={item.quantity} max={item.stock} disabled={state.actionLoading || item.status === 'INVALID'} onUpdate={val => handlers.handleUpdateQuantity(item.cartItemId, val)} />
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <div className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Order note</p>
                                  <p className="mt-1 font-body text-sm text-[#0F172A]">
                                    {item.status === 'INVALID' ? 'This line is excluded until availability is restored.' : 'Quantity changes refresh your sourcing subtotal instantly.'}
                                  </p>
                                </div>
                                <Button variant="ghost" onClick={() => handlers.handleRemoveItem(item.cartItemId)} disabled={state.actionLoading} className="text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-full h-10 px-4 shrink-0" aria-label="Remove item">
                                  <Trash2 className="size-4 mr-2" />
                                  Remove line
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>
              </div>

              <div className="xl:col-span-4 xl:sticky xl:top-8 space-y-4">
                {state.summary && <Card className="bg-white border border-[#CBD5E1] rounded-[20px] shadow-sm flex flex-col overflow-hidden">
                    <CardHeader className="p-6 space-y-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Settlement summary</p>
                          <CardTitle className="mt-2 font-header text-[#0F172A] text-2xl font-bold">
                            Order amount overview
                          </CardTitle>
                        </div>
                        <div className="size-11 rounded-full bg-[#E8F0FF] flex items-center justify-center text-[#0055FF]">
                          <BadgeDollarSign className="size-5" />
                        </div>
                      </div>
                      <p className="font-body text-sm text-[#64748B]">
                        Review final payable amount for valid sourcing lines before moving to checkout.
                      </p>
                    </CardHeader>

                    <CardContent className="p-6 space-y-5">
                      <div className="rounded-[16px] border border-[#CBD5E1] bg-[#F8FAFC] p-4 space-y-3">
                        <div className="flex items-center justify-between font-body text-sm text-[#64748B]">
                          <span>Product subtotal</span>
                          <span className="font-medium text-[#0F172A]">{formatUsd(Number(state.summary.totalPrice) || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between font-body text-sm text-[#64748B]">
                          <span>Estimated shipping</span>
                          <span className="font-medium text-[#0F172A]">{formatUsd(Number(state.summary.shippingFee) || 0)}</span>
                        </div>
                        {state.summary.discount ? <div className="flex items-center justify-between font-body text-sm text-[#16A34A]">
                            <span>Discount</span>
                            <span className="font-medium">-{formatUsd(Number(state.summary.discount) || 0)}</span>
                          </div> : null}
                        <div className="border-t border-[#E2E8F0] pt-3 flex items-end justify-between gap-4">
                          <div>
                            <p className="font-body text-xs uppercase tracking-[0.08em] text-[#64748B]">Payable today</p>
                            <p className="font-body text-sm text-[#64748B] mt-1">Calculated from valid items only</p>
                          </div>
                          <span className="font-display text-[#0F172A] font-extrabold text-3xl tracking-tight text-right break-all max-w-[220px]">
                            {formatUsd(Number(state.summary.finalAmount) || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-[16px] border border-[#CBD5E1] bg-[#F1F5F9] p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="size-9 rounded-full bg-white flex items-center justify-center text-[#0055FF] shrink-0">
                            <ChevronRight className="size-4" />
                          </div>
                          <div>
                            <p className="font-body text-sm font-semibold text-[#0F172A]">Before checkout</p>
                            <p className="mt-1 font-body text-sm text-[#64748B]">Prepare time 3-5days</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-6 flex flex-col gap-4">
                      <Button disabled={state.actionLoading || state.isEmpty || state.hasInvalidItems} className="w-full bg-[#0055FF] text-[#F8FAFC] rounded-full py-6 text-lg font-bold hover:bg-[#0044CC] hover:shadow-[0_0_15px_rgba(0,85,255,0.3)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                        Proceed to Checkout
                        <ArrowRight className="size-5" />
                      </Button>

                      <Button variant="outline" onClick={handlers.handleNavigateToDefault} className="w-full rounded-full border-[#CBD5E1] bg-transparent text-[#0F172A] hover:bg-[#E2E8F0] font-medium h-11">
                        Continue Sourcing
                      </Button>

                      <div className="grid grid-cols-1 gap-2 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                        <div className="flex items-center justify-between gap-3 font-body text-sm text-[#0F172A]">
                          <div className="flex items-center gap-2">
                            <Lock className="size-4 text-[#64748B]" />
                            Secure checkout
                          </div>
                          <span className="text-[#64748B]">Protected</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 font-body text-sm text-[#0F172A]">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-[#64748B]" />
                            Order assurance
                          </div>
                          <span className="text-[#64748B]">Verified</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 font-body text-sm text-[#0F172A]">
                          <div className="flex items-center gap-2">
                            <Truck className="size-4 text-[#64748B]" />
                            Delivery update
                          </div>
                          <span className="text-[#64748B]">Tracked</span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>}
              </div>
            </div>}
        </div>
      </section>

      {!state.loading && state.recommended && state.recommended.length > 0 && <section className="w-full bg-[#F8FAFC] border-t border-[#CBD5E1]/40" data-controller-name="结账页为您推荐">
          <div className="container mx-auto px-8 py-14 md:py-16">
            <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-header text-[#0F172A] text-2xl md:text-3xl font-bold tracking-tight">Source more best-sellers</h2>
                <p className="mt-2 font-body text-sm text-[#64748B]">Continue browsing products often purchased together before checkout.</p>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {state.recommended.map((prod, index) => <Card key={prod.productId} className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-[16px] shadow-sm hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer">
                  <CardHeader className="p-0 m-0">
                    <div className="w-full aspect-[4/5] bg-[#E2E8F0] flex items-center justify-center overflow-hidden relative">
                      <EditableImg propKey={`rec-img-${prod.productId}`} keywords={prod.mainImageUrl} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex flex-col flex-1">
                    <CardTitle className="font-header text-[#0F172A] text-base font-semibold leading-tight line-clamp-1 mb-2">
                      {prod.name}
                    </CardTitle>
                    <div className="mt-auto space-y-1">
                      <p className="font-body text-[#64748B] text-sm">Starting from</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-display text-[#0F172A] font-bold text-lg truncate">
                          {prod.priceMin}
                        </span>
                        <div className="flex items-center gap-1 text-[#0F172A] bg-[#E2E8F0] px-2 py-0.5 rounded-full font-body text-xs font-semibold shrink-0">
                          ⭐ {prod.ratingAverage}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>}

      <Dialog open={state.isClearConfirmOpen} onOpenChange={handlers.setIsClearConfirmOpen}>
        <DialogContent className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[16px] p-6 shadow-card-lg max-w-md">
          <DialogHeader className="space-y-3">
            <div className="size-12 bg-[#EF4444]/10 rounded-full flex items-center justify-center mb-2 mx-auto">
              <Trash2 className="size-6 text-[#EF4444]" />
            </div>
            <DialogTitle className="font-header text-xl font-bold text-center text-[#0F172A]">
              Clear entire sourcing cart?
            </DialogTitle>
            <DialogDescription className="font-body text-[#64748B] text-center">
              All selected product lines will be removed from this cart. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button variant="outline" onClick={() => handlers.setIsClearConfirmOpen(false)} disabled={state.actionLoading} className="flex-1 rounded-full font-body font-medium border-[#CBD5E1] text-[#0F172A] hover:bg-[#E2E8F0]">
              Keep cart
            </Button>
            <Button variant="destructive" onClick={handlers.handleClearCart} disabled={state.actionLoading} className="flex-1 rounded-full font-body font-medium bg-[#EF4444] text-[#F8FAFC] hover:bg-[#DC2626]">
              Confirm clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>;
};
export default CartView;
