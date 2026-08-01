'use client';

import React from 'react';
import type { ProductDetailState, ProductDetailHandlers } from '@/frontend/hooks/useProductDetail';
import type { UserSession } from '@/tools/FrontendSession';
import type { ProductStatus, StockStatus } from '@/frontend/actions/ProductDetail';
import EditableImg from "@/@base/EditableImg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AlertTriangle, Star, Minus, Plus, ShoppingCart, ShieldCheck, Globe2, CreditCard, Truck, Box, MapPin, Clock, ChevronRight, PackageSearch, LayoutList, MessageSquare, CheckCircle2, Sparkles, BadgeCheck, Package2, Warehouse, ClipboardList } from 'lucide-react';
import { formatUsd } from '@/shared/money';
const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: '草稿',
  ACTIVE: '上架',
  INACTIVE: '下架'
};
const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: '现货充足',
  LOW_STOCK: '库存紧张',
  OUT_OF_STOCK: '暂时缺货'
};
interface Props {
  state: ProductDetailState;
  handlers: ProductDetailHandlers;
}
export const ProductDetailView = ({
  state,
  handlers
}: Props) => {
  const {
    loading,
    error,
    product,
    relatedProducts,
    selectedAttributes,
    selectedSku,
    quantity,
    activeImage,
    submitting,
    availableAttributes,
    sortedGallery,
    isPurchasable,
    isSkuValid,
    isStockAvailable,
    session: _session
  } = state;
  const session = _session as UserSession;
  const {
    handleAttributeSelect,
    handleQuantityChange,
    handleAddToCart,
    handleRelatedClick,
    setActiveImage
  } = handlers;
  if (loading) {
    return <section className="w-full bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#64748B]">
          <div className="size-8 rounded-full border-2 border-[#0055FF] border-t-transparent animate-spin"></div>
          <p className="font-body text-sm font-medium tracking-wide uppercase">加载核心数据中...</p>
        </div>
      </section>;
  }
  if (error) {
    return <section className="w-full bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-8 py-20 max-w-none flex justify-center">
          <Alert variant="destructive" className="w-full lg:w-1/2 bg-[#FEF2F2] border-[#EF4444]">
            <AlertTriangle className="size-5" />
            <AlertTitle className="font-header font-bold text-[#EF4444]">系统异常</AlertTitle>
            <AlertDescription className="font-body text-[#7F1D1D]">{error}</AlertDescription>
          </Alert>
        </div>
      </section>;
  }
  if (!product) {
    return <section className="w-full bg-[#F8FAFC] min-h-[60vh] flex items-center justify-center">
         <div className="flex flex-col items-center gap-4 text-[#64748B]">
            <PackageSearch className="size-12 text-[#CBD5E1]" />
            <p className="font-body text-base font-medium">未找到指定商品信息</p>
         </div>
      </section>;
  }
  const sectionLinks = [{
    href: '#section-overview',
    label: '核心卖点',
    icon: <Sparkles className="size-4" />
  }, {
    href: '#section-specs',
    label: '规格参数',
    icon: <LayoutList className="size-4" />
  }, {
    href: '#section-trade',
    label: '交付与服务',
    icon: <Truck className="size-4" />
  }];
  const compactSellingPoints = (product.sellingPointsJson || []).filter(item => item?.title || item?.content).slice(0, 4);
  const compactFaq = (product.faqJson || []).filter(item => item?.question && item?.answer);
  const detailBlocks = (product.detailContentJson || []).filter(block => block?.content || block?.title);
  const specGroups = (product.parameterJson || []).filter(group => group?.items && group.items.length > 0);
  const supportRegions = product.tradeInfoJson?.supportedRegions?.filter(Boolean) || [];
  const currentDeliveryDays = selectedSku?.deliveryDays || product.tradeInfoJson?.deliveryDays || null;
  const currentMinOrderQty = product.tradeInfoJson?.minOrderQty || 1;
  const primaryPriceLabel = selectedSku ? formatUsd(selectedSku.price) : 'US$ --';
  const tradeFacts = [{
    icon: <Warehouse className="size-4" />,
    label: '发货地',
    value: product.tradeInfoJson?.shipFrom || '待业务确认'
  }, {
    icon: <Clock className="size-4" />,
    label: '预计交期',
    value: currentDeliveryDays ? `${currentDeliveryDays} 天` : '待确认'
  }, {
    icon: <Package2 className="size-4" />,
    label: '起订量',
    value: `${currentMinOrderQty} 件起订`
  }, {
    icon: <Globe2 className="size-4" />,
    label: '可售区域',
    value: supportRegions.length > 0 ? supportRegions.join(' / ') : '全球主要市场'
  }];
  const purchaseHighlights = [{
    icon: <BadgeCheck className="size-4" />,
    label: '采购状态',
    value: PRODUCT_STATUS_LABELS[product.status]
  }, {
    icon: <ClipboardList className="size-4" />,
    label: '货号',
    value: selectedSku?.skuCode || product.productCode
  }, {
    icon: <Truck className="size-4" />,
    label: '库存',
    value: selectedSku ? `${STOCK_STATUS_LABELS[selectedSku.stockStatus]} · ${selectedSku.stock} 件` : '请选择规格后确认'
  }];
  const assuranceItems = [{
    icon: <ShieldCheck className="size-4" />,
    text: product.tradeInfoJson?.tradeNotice || '支持标准贸易资料与基础售后协同'
  }, {
    icon: <Truck className="size-4" />,
    text: product.tradeInfoJson?.shippingNote || '默认采用国际标准物流方案，具体以实际交付安排为准'
  }, {
    icon: <CreditCard className="size-4" />,
    text: '支持安全下单与订单进度追踪'
  }];
  return <article className="w-full bg-[#F8FAFC] font-body relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{
      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
    }} />

      {!isPurchasable && <div className="w-full bg-[#E2E8F0]/90 backdrop-blur-md border-b border-[#CBD5E1] sticky top-0 z-50">
          <div className="container mx-auto px-8 py-3 flex items-center justify-center gap-2 text-center">
            <AlertTriangle className="size-5 text-[#EF4444]" />
            <span className="font-body text-sm font-semibold tracking-wide uppercase text-[#0F172A]">
              当前商品状态为 {PRODUCT_STATUS_LABELS[product.status]}，暂不支持采购下单与加购操作
            </span>
          </div>
        </div>}

      <section className="w-full bg-transparent relative z-10" data-controller-name="核心交易模块">
        <div className="container mx-auto px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-10 items-start">
            <div className="xl:col-span-7 space-y-6">
              <div className="rounded-[24px] border border-[#CBD5E1] bg-[#FFFFFF] shadow-[0_12px_36px_rgba(15,23,42,0.08)] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[96px_minmax(0,1fr)] gap-0">
                  <div className="order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-[#E2E8F0] bg-[#F8FAFC] p-4 lg:p-5">
                    <div className="grid grid-cols-5 lg:grid-cols-1 gap-3">
                      {sortedGallery.map((item, index) => {
                    const isSelected = activeImage === item.url;
                    return <button key={index} onClick={() => {
                      if (item.url) setActiveImage(item.url);
                    }} className={`group aspect-square rounded-[14px] overflow-hidden border bg-[#E2E8F0] transition-all duration-200 outline-none cursor-pointer ${isSelected ? 'border-[#0055FF] shadow-[0_0_0_2px_rgba(0,85,255,0.12)]' : 'border-[#CBD5E1] hover:border-[#94A3B8]'}`}>
                            {item.url && <EditableImg propKey={`thumb-${index}`} keywords={item.url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                          </button>;
                  })}
                    </div>
                  </div>

                  <div className="order-1 lg:order-2 p-5 lg:p-7 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-[#0F172A] text-[#F8FAFC] rounded-sm font-body text-[11px] font-semibold uppercase tracking-[0.12em] px-3 py-1 border-none">
                        {product.category?.name || '采购商品'}
                      </Badge>
                      <Badge className="bg-[#F8FAFC] text-[#64748B] rounded-full px-3 py-1 border border-[#CBD5E1] font-body text-[11px] font-semibold uppercase tracking-[0.08em]">
                        货号 {selectedSku?.skuCode || product.productCode}
                      </Badge>
                      <Badge className="bg-[#E8F1FF] text-[#0055FF] rounded-full px-3 py-1 border border-[#C7DBFF] font-body text-[11px] font-semibold uppercase tracking-[0.08em]">
                        {PRODUCT_STATUS_LABELS[product.status]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
                      <div className="space-y-4">
                        <div className="w-full aspect-[4/5] bg-[#E2E8F0] rounded-[22px] border border-[#CBD5E1] overflow-hidden relative">
                          <EditableImg propKey={`main-img-${product.id}`} keywords={activeImage || product.name} className="w-full h-full object-cover" />
                          {compactSellingPoints[0]?.title && <div className="absolute left-4 bottom-4 max-w-[78%] rounded-2xl bg-[#0F172A]/80 text-[#F8FAFC] px-4 py-3 backdrop-blur-sm">
                              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#CBD5E1]">采购亮点</p>
                              <p className="font-header text-sm font-semibold mt-1 line-clamp-2">{compactSellingPoints[0].title}</p>
                            </div>}
                        </div>
                        <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {purchaseHighlights.map((item, index) => <div key={index} className="rounded-[14px] bg-[#FFFFFF] border border-[#E2E8F0] px-4 py-3 space-y-2">
                              <div className="flex items-center gap-2 text-[#64748B]">
                                {item.icon}
                                <span className="font-body text-[11px] font-semibold uppercase tracking-[0.12em]">{item.label}</span>
                              </div>
                              <p className="font-header text-sm font-semibold text-[#0F172A] leading-snug">{item.value}</p>
                            </div>)}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-3">
                          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">采购摘要</p>
                          <h1 className="font-header text-3xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
                            {product.name}
                          </h1>
                          <p className="font-body text-sm text-[#475569] leading-relaxed">
                            {product.shortDescription || compactSellingPoints[0]?.content || '适用于跨境采购与批量成交场景，支持多规格选型、库存联动与标准化履约交付。'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#64748B] font-body text-xs font-semibold uppercase tracking-[0.08em]">
                            <span>商品编码 {product.productCode}</span>
                            <div className="flex items-center gap-1.5 normal-case tracking-normal text-sm font-medium">
                              <Star className="size-4 fill-current text-[#0F172A]" />
                              <span className="text-[#0F172A]">{product.ratingAverage.toFixed(1)}</span>
                              <span>/ 5</span>
                              <span>· {product.ratingCount} 条评价</span>
                            </div>
                          </div>
                        </div>

                        {compactSellingPoints.length > 0 && <div className="rounded-[18px] border border-[#CBD5E1] bg-[#FFFFFF] p-5 space-y-4 shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">采购卖点</p>
                                <h2 className="font-header text-lg font-bold text-[#0F172A] mt-1">核心优势</h2>
                              </div>
                              <Sparkles className="size-5 text-[#0055FF]" />
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {compactSellingPoints.map((point, index) => <div key={index} className="rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3">
                                  <div className="flex items-start gap-3">
                                    <CheckCircle2 className="size-4 mt-0.5 text-[#0055FF] shrink-0" />
                                    <div className="space-y-1 min-w-0">
                                      {point.title && <p className="font-body text-sm font-semibold text-[#0F172A] line-clamp-1">{point.title}</p>}
                                      {point.content && <p className="font-body text-sm text-[#64748B] leading-relaxed line-clamp-2">{point.content}</p>}
                                    </div>
                                  </div>
                                </div>)}
                            </div>
                          </div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-5">
              <div className="xl:sticky xl:top-24 space-y-5">
                <div className="rounded-[24px] border border-[#CBD5E1] bg-[#FFFFFF] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] space-y-6">
                  <div className="rounded-[20px] border border-[#D9E6FF] bg-[linear-gradient(180deg,#F7FAFF_0%,#EEF4FF_100%)] p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">采购报价</p>
                        <div className="flex items-end gap-3 flex-wrap mt-2">
                          <span className="font-header text-4xl font-extrabold text-[#0055FF] tracking-tight leading-none">
                            {primaryPriceLabel}
                          </span>
                          {selectedSku?.originalPrice && selectedSku.originalPrice > selectedSku.price && <div className="flex items-center gap-2 pb-1">
                              <s className="text-[#94A3B8] font-body text-base">{formatUsd(selectedSku.originalPrice)}</s>
                              <Badge className="bg-[#FF5A1F] text-[#F8FAFC] hover:bg-[#FF5A1F] rounded-sm font-body text-[11px] font-bold uppercase tracking-[0.12em] border-none px-2.5 py-1">
                                立省 {(selectedSku.originalPrice - selectedSku.price).toFixed(2)}
                              </Badge>
                            </div>}
                        </div>
                      </div>
                      <Badge className={`rounded-full px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.08em] border ${isStockAvailable ? 'bg-[#ECFDF3] text-[#166534] border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'}`}>
                        {selectedSku ? STOCK_STATUS_LABELS[selectedSku.stockStatus] : '待选规格'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[14px] bg-[#FFFFFF] border border-[#D9E6FF] px-4 py-3">
                        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">可售库存</p>
                        <p className="font-header text-lg font-bold text-[#0F172A] mt-1">{selectedSku ? `${selectedSku.stock} 件` : '待确认'}</p>
                      </div>
                      <div className="rounded-[14px] bg-[#FFFFFF] border border-[#D9E6FF] px-4 py-3">
                        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">预计交期</p>
                        <p className="font-header text-lg font-bold text-[#0F172A] mt-1">{currentDeliveryDays ? `${currentDeliveryDays} 天` : '待确认'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tradeFacts.map((item, index) => <div key={index} className="rounded-[14px] border border-[#D9E6FF] bg-[#FFFFFF] px-4 py-3 space-y-2">
                          <div className="flex items-center gap-2 text-[#64748B]">
                            {item.icon}
                            <span className="font-body text-[11px] font-semibold uppercase tracking-[0.12em]">{item.label}</span>
                          </div>
                          <p className="font-body text-sm font-semibold text-[#0F172A] leading-snug">{item.value}</p>
                        </div>)}
                    </div>
                  </div>

                  <Separator className="bg-[#E2E8F0]" />

                  <div className="space-y-5">
                    <div>
                      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">规格选择</p>
                      <h2 className="font-header text-lg font-bold text-[#0F172A] mt-1">选择采购规格</h2>
                    </div>
                    {availableAttributes.map(attrGroup => <div key={attrGroup.name} className="space-y-3 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-body text-xs font-bold uppercase tracking-[0.12em] text-[#0F172A]">{attrGroup.name}</span>
                          <span className="font-body text-[11px] text-[#64748B]">{selectedAttributes[attrGroup.name] || '未选择'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {attrGroup.values.map(val => {
                        const isSelected = selectedAttributes[attrGroup.name] === val;
                        return <Button key={val} disabled={!isPurchasable} onClick={() => handleAttributeSelect(attrGroup.name, val)} className={`inline-flex items-center justify-center font-body text-sm font-medium transition-all duration-200 active:scale-[0.98] outline-none cursor-pointer rounded-full px-4 py-2 min-w-[72px] border ${isSelected ? 'bg-[#0F172A] text-[#F8FAFC] border-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.14)] hover:bg-[#0F172A]' : 'bg-[#FFFFFF] text-[#475569] border-[#CBD5E1] hover:border-[#0F172A] hover:text-[#0F172A] hover:bg-[#FFFFFF]'}`}>
                                <span className="truncate">{val}</span>
                              </Button>;
                      })}
                        </div>
                      </div>)}
                  </div>

                  <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">采购数量</p>
                        <h3 className="font-header text-lg font-bold text-[#0F172A] mt-1">下单数量</h3>
                      </div>
                      <span className="font-body text-xs font-semibold text-[#64748B]">
                        {selectedSku ? `当前最多 ${selectedSku.stock} 件` : '选择规格后可购买'}
                      </span>
                    </div>
                    <div className="flex items-center h-14 bg-[#FFFFFF] border border-[#CBD5E1] rounded-[14px] overflow-hidden">
                      <button className="w-12 h-full flex items-center justify-center text-[#0F172A] hover:bg-[#E2E8F0] disabled:opacity-50 transition-colors" disabled={!isPurchasable || !isSkuValid || quantity <= 1} onClick={() => handleQuantityChange('dec')}>
                        <Minus className="size-4" />
                      </button>
                      <Input value={quantity} readOnly disabled={!isPurchasable || !isSkuValid} className="flex-1 h-full border-0 bg-transparent text-center font-header text-lg font-bold text-[#0F172A] rounded-none focus-visible:ring-0 p-0" />
                      <button className="w-12 h-full flex items-center justify-center text-[#0F172A] hover:bg-[#E2E8F0] disabled:opacity-50 transition-colors" disabled={!isPurchasable || !isSkuValid || selectedSku && quantity >= selectedSku.stock || false} onClick={() => handleQuantityChange('inc')}>
                        <Plus className="size-4" />
                      </button>
                    </div>

                    <Button className="w-full h-14 bg-[#0055FF] text-[#F8FAFC] rounded-full hover:bg-[#0044CC] hover:shadow-[0_0_18px_rgba(0,85,255,0.24)] transition-all duration-200 active:scale-[0.98] font-body text-base font-bold flex items-center gap-2 disabled:bg-[#CBD5E1] disabled:text-[#64748B] disabled:shadow-none" disabled={!isPurchasable || !isSkuValid || !isStockAvailable || submitting} onClick={handleAddToCart}>
                      <ShoppingCart className="size-5" />
                      {submitting ? '处理中...' : '立即加入采购清单'}
                    </Button>

                    {!session.token && <p className="font-body text-xs text-[#64748B] leading-relaxed text-center">
                        当前以访客身份浏览，提交采购前将引导登录并保留已选规格与数量。
                      </p>}
                  </div>

                  <div className="rounded-[16px] bg-[#0F172A] text-[#F8FAFC] p-4 space-y-3">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#CBD5E1]">服务与保障</p>
                    <div className="space-y-2.5">
                      {assuranceItems.map((item, index) => <div key={index} className="flex items-start gap-2.5 text-[#CBD5E1]">
                          <span className="mt-0.5 text-[#F8FAFC]">{item.icon}</span>
                          <span className="font-body text-sm leading-relaxed">{item.text}</span>
                        </div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#FFFFFF] border-t border-[#E2E8F0]" data-controller-name="商品深度详情">
        <div className="container mx-auto px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-10 items-start">
            <div className="xl:col-span-3 hidden xl:block">
              <div className="sticky top-24 rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-2">
                <p className="font-body text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B] mb-2">详情导航</p>
                {sectionLinks.map(item => <a key={item.href} href={item.href} className="group flex items-center justify-between gap-3 rounded-full px-4 py-3 font-body text-sm font-medium text-[#64748B] hover:text-[#0055FF] hover:bg-[#FFFFFF] transition-all duration-200">
                    <span className="flex items-center gap-3">
                      <span className="text-[#94A3B8] group-hover:text-[#0055FF] transition-colors">{item.icon}</span>
                      {item.label}
                    </span>
                    <ChevronRight className="size-4 text-[#CBD5E1] group-hover:text-[#0055FF] transition-colors" />
                  </a>)}
              </div>
            </div>

            <div className="xl:col-span-9 space-y-10">
              <div id="section-overview" className="scroll-mt-32 rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 lg:p-8 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                  <div>
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">图文介绍与采购说明</p>
                    <h2 className="font-header text-2xl lg:text-3xl font-bold tracking-tight text-[#0F172A] mt-2">商品详情说明</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {compactSellingPoints.slice(0, 3).map((point, index) => <Badge key={index} className="bg-[#F8FAFC] text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 py-1 font-body text-[11px] font-semibold">
                        {point.title || `采购卖点 ${index + 1}`}
                      </Badge>)}
                  </div>
                </div>

                {detailBlocks.length > 0 ? <div className="space-y-8">
                    {detailBlocks.map((block, index) => <div key={index} className="space-y-4 rounded-[18px] border border-[#F1F5F9] bg-[#FCFDFE] p-5 lg:p-6">
                        {block.title && <h3 className="font-header text-xl font-semibold text-[#0F172A]">{block.title}</h3>}
                        {block.type === 'image' && block.content ? <div className="w-full bg-[#E2E8F0] rounded-[16px] overflow-hidden border border-[#CBD5E1]">
                            <EditableImg propKey={`detail-${index}`} keywords={block.content} className="w-full h-auto object-cover" />
                          </div> : <p className="font-body text-[15px] text-[#334155] leading-7 whitespace-pre-wrap break-words">
                            {block.content}
                          </p>}
                      </div>)}
                  </div> : <div className="bg-[#F8FAFC] rounded-[16px] border border-dashed border-[#CBD5E1] p-10 text-center text-[#64748B] font-body">
                    暂无详细图文介绍
                  </div>}
              </div>

              <div id="section-specs" className="scroll-mt-32 rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 lg:p-8 space-y-8">
                <div>
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">规格、包装与参数信息</p>
                  <h2 className="font-header text-2xl lg:text-3xl font-bold tracking-tight text-[#0F172A] mt-2">规格参数</h2>
                </div>
                {specGroups.length > 0 ? <div className="space-y-6">
                    {specGroups.map((group, index) => <div key={index} className="border border-[#E2E8F0] rounded-[16px] overflow-hidden">
                        <div className="bg-[#F8FAFC] px-5 py-4 border-b border-[#E2E8F0]">
                          <h3 className="font-body text-sm font-bold uppercase tracking-[0.12em] text-[#0F172A]">
                            {group.group || '通用参数'}
                          </h3>
                        </div>
                        <Table>
                          <TableBody>
                            {group.items?.map((item, index1) => <TableRow key={index1} className="hover:bg-transparent border-b border-[#E2E8F0] last:border-0">
                                <TableCell className="w-[32%] bg-[#F8FAFC] font-body text-sm font-semibold text-[#64748B] py-4 px-5 border-r border-[#E2E8F0] align-top">
                                  {item.key}
                                </TableCell>
                                <TableCell className="font-body text-sm text-[#0F172A] py-4 px-5 break-words leading-6">
                                  {item.value}
                                </TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>)}
                  </div> : <div className="bg-[#F8FAFC] rounded-[16px] border border-dashed border-[#CBD5E1] p-10 text-center text-[#64748B] font-body">
                    暂无规格参数数据
                  </div>}
              </div>

              <div id="section-trade" className="scroll-mt-32 rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 lg:p-8 space-y-8">
                <div>
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">物流、交期与履约支持</p>
                  <h2 className="font-header text-2xl lg:text-3xl font-bold tracking-tight text-[#0F172A] mt-2">交付与服务</h2>
                </div>
                {product.tradeInfoJson ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-[#F8FAFC] border-[#E2E8F0] shadow-none rounded-[18px]">
                      <CardHeader className="pb-3 space-y-3">
                        <div className="size-10 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#0F172A]">
                          <MapPin className="size-5" />
                        </div>
                        <CardTitle className="font-header text-lg font-bold text-[#0F172A]">发货与区域</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="font-body text-sm text-[#0F172A] font-medium">
                          发货地：{product.tradeInfoJson.shipFrom || '以实际安排为准'}
                        </p>
                        <p className="font-body text-sm text-[#64748B] leading-relaxed">
                          {supportRegions.length > 0 ? supportRegions.join('、') : '支持全球主要跨境区域发货'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#F8FAFC] border-[#E2E8F0] shadow-none rounded-[18px]">
                      <CardHeader className="pb-3 space-y-3">
                        <div className="size-10 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#0F172A]">
                          <Clock className="size-5" />
                        </div>
                        <CardTitle className="font-header text-lg font-bold text-[#0F172A]">交期说明</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="font-body text-sm text-[#0F172A] font-medium">
                          预计交期：{currentDeliveryDays ? `${currentDeliveryDays} 天` : '待确认'}
                        </p>
                        <p className="font-body text-sm text-[#64748B] leading-relaxed">
                          {product.tradeInfoJson.shippingNote || '默认采用国际标准物流路径，交付时效以实际运输与清关进度为准。'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#F8FAFC] border-[#E2E8F0] shadow-none rounded-[18px]">
                      <CardHeader className="pb-3 space-y-3">
                        <div className="size-10 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#0F172A]">
                          <ShieldCheck className="size-5" />
                        </div>
                        <CardTitle className="font-header text-lg font-bold text-[#0F172A]">采购提示</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="font-body text-sm text-[#0F172A] font-medium">
                          MOQ：{currentMinOrderQty} 件起
                        </p>
                        <p className="font-body text-sm text-[#64748B] leading-relaxed">
                          {product.tradeInfoJson.tradeNotice || '大货采购前建议确认进口资质与贸易资料，平台支持标准订单流程跟踪。'}
                        </p>
                      </CardContent>
                    </Card>
                  </div> : <div className="bg-[#F8FAFC] rounded-[16px] border border-dashed border-[#CBD5E1] p-10 text-center text-[#64748B] font-body">
                    暂无物流与贸易数据
                  </div>}
              </div>

              <div id="section-faq" className="scroll-mt-32 rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 lg:p-8 space-y-8">
                <div>
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">售前问题与采购解答</p>
                  <h2 className="font-header text-2xl lg:text-3xl font-bold tracking-tight text-[#0F172A] mt-2">常见问题</h2>
                </div>
                {compactFaq.length > 0 ? <Accordion type="single" collapsible className="w-full">
                    {compactFaq.map((faq, index) => <AccordionItem value={`item-${index}`} key={index} className="border-[#E2E8F0]">
                        <AccordionTrigger className="font-header text-base font-semibold text-[#0F172A] hover:text-[#0055FF] transition-colors text-left hover:no-underline py-5">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="font-body text-[#64748B] text-base leading-relaxed pb-5 whitespace-pre-wrap">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>)}
                  </Accordion> : <div className="bg-[#F8FAFC] rounded-[16px] border border-dashed border-[#CBD5E1] p-10 text-center text-[#64748B] font-body">
                    暂无常见问题，欢迎联系客服咨询
                  </div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#F8FAFC] border-t border-[#E2E8F0]" data-controller-name="关联推荐商品">
        <div className="container mx-auto px-8 py-16 lg:py-20">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">同类搭配与继续选购</p>
              <h2 className="font-header text-2xl lg:text-3xl font-bold tracking-tight text-[#0F172A] mt-2">相关推荐</h2>
            </div>
            <Button variant="ghost" className="font-body text-[#0F172A] hover:bg-[#E2E8F0] rounded-full hidden sm:flex items-center gap-1">
              查看更多 <ChevronRight className="size-4" />
            </Button>
          </div>

          {relatedProducts.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map(item => <Card key={item.id} onClick={() => handleRelatedClick(item.id)} className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-[18px] shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] hover:shadow-[0_20px_25px_-5px_rgba(15,23,42,0.1),0_8px_10px_-6px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col p-4 gap-4 cursor-pointer group">
                  <div className="w-full aspect-[4/5] bg-[#E2E8F0] rounded-[12px] flex items-center justify-center overflow-hidden relative">
                    <EditableImg propKey={`related-${item.id}`} keywords={item.mainImageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col flex-1 gap-3">
                    <h3 className="font-header text-base font-bold text-[#0F172A] line-clamp-2 min-h-[3rem]">
                      {item.name}
                    </h3>
                    <div className="flex items-end justify-between gap-3 mt-auto">
                      <span className="font-header text-xl font-extrabold text-[#0055FF]">
                        {formatUsd(item.minPrice)} 起
                      </span>
                    </div>
                    <div className="w-full rounded-full py-3 text-sm font-bold bg-[#E2E8F0] text-[#0F172A] flex items-center justify-center gap-2 group-hover:bg-[#0055FF] group-hover:text-[#F8FAFC] transition-colors duration-300">
                      查看详情
                    </div>
                  </div>
                </Card>)}
            </div> : <div className="bg-[#FFFFFF] rounded-[18px] border border-dashed border-[#CBD5E1] p-14 flex flex-col items-center justify-center text-[#64748B] font-body gap-4">
              <Box className="size-10 text-[#CBD5E1]" />
              <p>暂无相关推荐商品</p>
            </div>}
        </div>
      </section>
    </article>;
};
export default ProductDetailView;
