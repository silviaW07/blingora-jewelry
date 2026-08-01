"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Ticket, ShieldCheck, Globe2, Zap, Star, ShoppingCart, Percent, TrendingUp, Laptop, Shirt, Sparkles, Award, DollarSign, ChevronRight, CheckCircle2, Home as HomeIcon, Bike, Layers, PackageCheck, Clock3, BadgePercent, Warehouse, Boxes, PlaneTakeoff, Flame, Gem, Package } from "lucide-react";
import EditableImg from "@/@base/EditableImg";
import type { UseHomeState, UseHomeHandlers } from "@/frontend/hooks/useHome";
interface Props {
  state: UseHomeState;
  handlers: UseHomeHandlers;
}
export default function HomeView({
  state,
  handlers
}: Props) {
  const router = useRouter();
  const heroRootRef = useRef<HTMLElement | null>(null);
  const [motionOk, setMotionOk] = useState(true);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionOk(!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  useEffect(() => {
    const el = heroRootRef.current;
    const mqReduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || mqReduce || !motionOk) {
      setVisible(true);
      return;
    }
    const reveal = () => setVisible(true);
    const alreadyInView = () => {
      const r = el.getBoundingClientRect();
      const vh = globalThis.innerHeight ?? 0;
      return r.bottom > 0 && r.top < vh;
    };
    if (alreadyInView()) {
      reveal();
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        reveal();
        io.disconnect();
      }
    }, {
      threshold: 0
    });
    io.observe(el);
    let raf = 0;
    raf = requestAnimationFrame(() => {
      if (alreadyInView()) {
        reveal();
        io.disconnect();
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [motionOk]);
  const getMotionStyle = (delayMs: number) => {
    if (!motionOk) return {};
    return {
      transition: `all 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      opacity: visible ? 1 : 0
    };
  };
  const categoryIcons = [Laptop, HomeIcon, Shirt, Bike, Sparkles, Boxes];
  const floorIconMap = {
    Flame,
    Sparkles,
    Gem,
    Package,
    Clock3,
    Award,
    TrendingUp,
    Boxes,
    Warehouse,
    PlaneTakeoff,
    Laptop,
    Shirt,
    Home: HomeIcon,
    HomeIcon,
  } as const;
  const catalogCategories = (state.categories || []).map((category, index) => ({
    id: category.categoryId,
    name: category.categoryName,
    icon: categoryIcons[index % categoryIcons.length],
    description: category.categoryDescription || '聚合当前一级类目下的可售商品，支持继续进入完整分类页浏览。',
    image: category.imageUrl || category.bannerImageUrl || 'premium category shelf display',
    categoryId: category.categoryId
  }));
  const visibleBrandShelf = state.brandShelf.slice(0, state.visibleBrandRows * 4);
  const homepageKeywordFloors = (state.homepageKeywordFloors || []).filter(floor => floor.keywords.length > 0);
  return <main className="min-h-screen bg-background text-foreground">
      <section data-controller-name="首页主横幅" ref={heroRootRef} className="relative isolate w-full overflow-hidden bg-[#081225] text-white">
        <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeSlideIn {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />

        <div className="absolute inset-0 z-0">
          <EditableImg propKey="hero-background" keywords="https://productp.s3.us-west-2.amazonaws.com/background/zaki_test/generated/0909baaa7aa447e287682415912fadf8.png" className="h-full w-full object-cover brightness-[0.32] saturate-[0.9]" style={{
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }} description="Global cross-border logistics hub background with dramatic lighting and modern industrial elements" needLargeImage={true} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,18,37,0.88)_0%,rgba(8,18,37,0.78)_28%,rgba(8,18,37,0.54)_58%,rgba(8,18,37,0.92)_100%)]" />
          <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 pt-8 pb-14 md:px-8 md:pt-10 md:pb-16 lg:pt-12 lg:pb-20">
          <div className="rounded-[26px] border border-white/12 bg-white/6 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-md md:px-6" style={getMotionStyle(60)}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/78 md:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 font-semibold tracking-[0.08em] uppercase text-white/88">
                  <PackageCheck className="size-3.5 text-[#7DD3FC]" />
                  跨境现货采购站
                </span>
              </div>
              <div className="grid gap-2 text-xs text-white/80 sm:grid-cols-3 sm:gap-3 lg:min-w-[470px]">
                {[{
                icon: Globe2,
                label: "全球可发",
                value: "220+ 国家地区"
              }, {
                icon: Clock3,
                label: "快速履约",
                value: "48h 内处理"
              }, {
                icon: BadgePercent,
                label: "新客权益",
                value: "注册即领券"
              }].map((item, index) => {
                const ItemIcon = item.icon;
                return <div key={item.label} className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2.5 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-white/62">
                        <ItemIcon className="size-3.5 text-[#60A5FA]" />
                        {item.label}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                    </div>;
              })}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_420px] lg:items-stretch xl:gap-8">
            <div className="space-y-6" style={getMotionStyle(160)}>

              <div className="max-w-3xl space-y-4">
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[64px] xl:leading-[1.02]">
                  Blingorajewelry
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base md:text-lg">
                  全品类销售
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row" style={getMotionStyle(260)}>
                <button type="button" onClick={() => handlers.handleShopNowClick(router)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0052D9] px-7 py-4 text-sm font-bold text-white shadow-[0_14px_40px_rgba(0,82,217,0.34)] transition-all duration-200 hover:bg-[#0042B0] active:scale-[0.98] cursor-pointer" style={{
                border: `0px solid #cbd5e1`,
                textShadow: `none`,
                color: `#ffffff`,
                '--autpohover-border-radius': `9999px`,
                '--autpoactive-border-radius': `9999px`,
                '--autpohover-bg': `#EFBFF5`,
                '--autpohover-color': `#ffffff`,
                '--autpohover-border': `0px solid #cbd5e1`,
                '--autpohover-bg-img': `none`,
                '--autpohover-box-shadow': `none`,
                '--autpohover-text-shadow': `none`,
                '--autpohover-cursor': `pointer`,
                '--autpoactive-bg': `#874B8F`,
                '--autpoactive-color': `#ffffff`,
                '--autpoactive-border': `0px solid #cbd5e1`,
                '--autpoactive-bg-img': `none`,
                '--autpoactive-box-shadow': `none`,
                '--autpoactive-text-shadow': `none`,
                '--autpoactive-cursor': `pointer`,
                backgroundColor: `#b76fc1`,
                backgroundImage: `none`,
                boxShadow: `none`,
                borderRadius: `9999px`
              } as React.CSSProperties}>
                  进入采购分类
                  <ArrowRight className="size-4" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3" style={getMotionStyle(360)}>
                {[{
                icon: ShieldCheck,
                value: "批发价格",
                label: "中国工厂直接发货"
              }, {
                icon: Boxes,
                value: "无起订量",
                label: "起订量价格信息清晰呈现"
              }, {
                icon: Zap,
                value: "Door to Door",
                label: "使 fedex ups 海运 usps"
              }].map((item, index) => {
                const ItemIcon = item.icon;
                return <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/[0.08] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm">
                      <div className="flex size-11 items-center justify-center rounded-full bg-white/10 text-[#8CC7FF]">
                        <ItemIcon className="size-5" />
                      </div>
                      <p className="mt-4 text-base font-bold text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.label}</p>
                    </div>;
              })}
              </div>
            </div>

            <div className="grid gap-4" style={getMotionStyle(460)}>
              <div className="rounded-[28px] border border-white/10 bg-white p-6 text-[#1E293B] shadow-[0_24px_60px_rgba(5,16,36,0.28)]">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0052D9]">
                      Procurement Overview
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#0F172A]">
                      How to order
                    </h2>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {[{
                  title: "Register by this link",
                  desc: "see the prices and add to your cart",
                  icon: Layers
                }, {
                  title: "加入购物车 填写地址",
                  desc: "选择您想要的物流方式",
                  icon: TrendingUp
                }, {
                  title: "形成订单并通知客服",
                  desc: "通知客服备货",
                  icon: ShoppingCart
                }].map((item, index) => {
                  const ItemIcon = item.icon;
                  return <div key={item.title} className="flex items-start gap-4 rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#E8F1FF] text-[#0052D9]">
                          <ItemIcon className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#0052D9]">
                              0{index + 1}
                            </span>
                            <h3 className="text-sm font-bold text-[#0F172A]">
                              {item.title}
                            </h3>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-[#64748B]">
                            {item.desc}
                          </p>
                        </div>
                      </div>;
                })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[{
                title: "发货前展示发货照片",
                desc: "给客服发你想要的产品",
                icon: DollarSign
              }, {
                title: "可以帮找图",
                desc: "给客服发你想要的产品",
                icon: HomeIcon
              }].map((item, index) => {
                const ItemIcon = item.icon;
                return <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/10 p-5 text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm">
                      <div className="flex size-11 items-center justify-center rounded-full bg-white/10 text-[#8CC7FF]">
                        <ItemIcon className="size-5" />
                      </div>
                      <h3 className="mt-4 text-base font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.desc}</p>
                    </div>;
              })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-controller-name="一级类目导购" className="w-full border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="container mx-auto px-6 py-14 md:px-8 md:py-16">
          <div className="mb-8 rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F1FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#0052D9]">
                  <Layers className="size-3.5" />
                  Hot Categories
                </span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl">
                    热门分类与一级类目实时同步
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B] md:text-base">
                    首页热门分类直接读取当前可用一级类目，主视觉推荐与下方货架会跟随所选类目同步更新，保证分类浏览与商品口径一致。
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => handlers.handleShopNowClick(router)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-5 py-3 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:border-[#0052D9] hover:text-[#0052D9] active:scale-[0.98] cursor-pointer">
                查看当前类目商品
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {catalogCategories.map((category, index) => {
            const IconComponent = category.icon;
            const isActive = state.selectedCategoryId === category.categoryId;
            return <button key={category.id} type="button" onClick={() => handlers.handleCategoryTabChange(category.categoryId)} className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer ${isActive ? 'border-[#0052D9] bg-[#0052D9] text-white shadow-[0_10px_24px_rgba(0,82,217,0.2)]' : 'border-[#D7E3F8] bg-white text-[#334155] hover:border-[#0052D9] hover:text-[#0052D9]'}`}>
                  <IconComponent className="size-4" />
                  <span>{category.name}</span>
                </button>;
          })}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {catalogCategories.map((category, index) => {
            const IconComponent = category.icon;
            return <button key={category.id} type="button" onClick={() => handlers.handleCategoryClick(router, category.categoryId)} className={`group flex h-full flex-col overflow-hidden rounded-[24px] border text-left shadow-sm transition-all duration-300 cursor-pointer ${state.selectedCategoryId === category.categoryId ? 'border-[#0052D9] bg-white shadow-[0_24px_50px_rgba(0,82,217,0.12)]' : 'border-[#E2E8F0] bg-white hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)]'}`}>
                  <div className="relative h-52 overflow-hidden border-b border-[#E2E8F0] bg-[#E2E8F0]">
                    <EditableImg propKey={`catalog-${category.id}`} keywords={category.image} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }} description={`${category.name} ecommerce category hero image`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/24 to-transparent" />
                    <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-full bg-white/14 text-white backdrop-blur-md">
                        <IconComponent className="size-4" />
                      </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <h3 className="text-2xl font-bold text-white">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <p className="text-sm leading-6 text-[#475569]">
                      {category.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[#0052D9]">
                      <span>查看该类目商品</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>;
          })}
          </div>
        </div>
      </section>

      <section data-controller-name="后台关键词推荐楼层" className="w-full border-b border-[#E2E8F0] bg-white">
        <div className="container mx-auto px-6 py-14 md:px-8 md:py-16">
          <div className="mb-8 rounded-[28px] border border-[#E2E8F0] bg-[#F8FAFC] p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF7F1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2BA471]">
                  <Award className="size-3.5" />
                  Featured Keyword Floors
                </span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl">
                    后台关键词楼层推荐
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B] md:text-base">
                    推荐区按后台独立维护的首页楼层逐段展示，每个楼层可配置标题、图标、跳转入口与关键词胶囊，前台保持一次加载与纵向循环渲染。
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#475569]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5">
                  <CheckCircle2 className="size-3.5 text-[#2BA471]" />
                  多楼层配置
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5">
                  <CheckCircle2 className="size-3.5 text-[#2BA471]" />
                  胶囊标签跳转
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5">
                  <CheckCircle2 className="size-3.5 text-[#2BA471]" />
                  运营独立维护
                </span>
              </div>
            </div>
          </div>

          {state.isLoading ? <div className="flex items-center justify-center py-20 text-[#64748B]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0052D9] border-t-transparent" />
            </div> : state.errorMsg ? <div className="flex items-center justify-center py-20 font-medium text-[#D9001B]">
              {state.errorMsg}
            </div> : homepageKeywordFloors.length === 0 ? <div className="flex items-center justify-center py-20 text-[#64748B]">
              暂无推荐楼层
            </div> : <div className="space-y-6">
              {homepageKeywordFloors.map(floor => {
            const FloorIcon = floorIconMap[floor.floorIcon as keyof typeof floorIconMap] || Sparkles;
            return <article key={floor.groupId} className="rounded-[28px] border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#0052D9] shadow-sm">
                          <FloorIcon className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-[#0F172A] md:text-2xl">{floor.floorTitle}</h3>
                          <p className="mt-2 text-sm leading-6 text-[#64748B]">
                            由后台独立维护楼层顺序与关键词列表，点击胶囊标签可继续进入分类采购页。
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={() => handlers.handleKeywordClick(router, floor.keywords[0]?.keyword || '', floor.floorLink)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:border-[#0052D9] hover:text-[#0052D9] active:scale-[0.98] cursor-pointer">
                        查看该楼层
                        <ChevronRight className="size-4" />
                      </button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {floor.keywords.map(keywordItem => <button key={keywordItem.keywordItemId} type="button" onClick={() => handlers.handleKeywordClick(router, keywordItem.keyword, floor.floorLink)} className="inline-flex items-center gap-2 rounded-full border border-[#D7E3F8] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-200 hover:border-[#0052D9] hover:bg-[#EEF4FF] hover:text-[#0052D9] cursor-pointer">
                          <Sparkles className="size-3.5" />
                          <span>{keywordItem.keyword}</span>
                        </button>)}
                    </div>
                  </article>;
          })}
            </div>}
        </div>
      </section>

      <section data-controller-name="品牌分类货架" className="w-full border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="container mx-auto px-6 py-14 md:px-8 md:py-16">
          <div className="mb-8 flex flex-col gap-5 rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between md:p-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F4ECFF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">
                <TrendingUp className="size-3.5" />
                Brand Shelf
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl">
                品牌分类展示
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B] md:text-base">
                默认展示 3 行，每行 4 个品牌入口。点击 More 后进入完整品牌分类浏览页，继续沿用分类页承接逻辑。
              </p>
            </div>
            <button type="button" onClick={() => handlers.handleBrandMoreClick(router)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D9C8FF] bg-[#F8F5FF] px-5 py-3 text-sm font-semibold text-[#7C3AED] transition-all duration-200 hover:border-[#7C3AED] active:scale-[0.98] cursor-pointer">
              More
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleBrandShelf.map((brand, index) => <article key={`${brand.brandName}-${brand.items[0]?.productId || 'empty'}`} className="flex min-h-[280px] flex-col rounded-[24px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">{brand.brandName}</h3>
                    <p className="mt-1 text-xs text-[#64748B]">{brand.items.length > 0 ? `${brand.items.length} 款精选商品` : '即将补充更多货源'}</p>
                  </div>
                  <button type="button" onClick={() => handlers.handleBrandClick(router, brand.brandName)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] cursor-pointer">
                    查看
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {brand.items.length > 0 ? brand.items.slice(0, 2).map((item, index1) => <button key={item.productId} type="button" onClick={() => handlers.handleProductClick(router, item.productId)} className="flex w-full items-center gap-3 rounded-[18px] border border-[#EEF2F7] bg-[#F8FAFC] p-3 text-left transition-all duration-200 hover:border-[#7C3AED] cursor-pointer">
                      <div className="size-16 overflow-hidden rounded-[14px] bg-white">
                        <EditableImg propKey={`brand-${brand.brandName}-${item.productId}`} keywords={item.mainImageUrl || 'luxury fashion product on clean background'} className="h-full w-full object-cover" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }} description={`${brand.brandName} product image`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">{item.productName}</p>
                        <p className="mt-1 text-xs text-[#64748B]">{item.shortDescription || '支持继续进入详情页查看完整参数。'}</p>
                        <p className="mt-2 text-sm font-bold text-[#0052D9]">{`US$ ${item.price.toFixed(2)}`}</p>
                      </div>
                    </button>) : <button type="button" onClick={() => handlers.handleBrandClick(router, brand.brandName)} className="rounded-[18px] border border-dashed border-[#D8DEE8] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#94A3B8] cursor-pointer hover:border-[#7C3AED] hover:text-[#7C3AED]">
                      当前类目下暂无该品牌商品，点击进入完整品牌浏览
                    </button>}
                </div>
              </article>)}
          </div>
        </div>
      </section>

      <section data-controller-name="采购评价展示" className="w-full bg-[#F8FAFC]">
        <div className="container mx-auto px-6 py-14 md:px-8 md:py-16">
          <div className="rounded-[30px] border border-[#E2E8F0] bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#B7791F]">
                  <Star className="size-3.5" />
                  Review Highlights
                </span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl">
                  真实采购评价展示区
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#64748B] md:text-base">
                  优先复用现有评价摘要数据，支持图片缩略展示；若当前没有视频字段，则按兼容模式展示图片且不会报错。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-[#E8EDF3] bg-[#F8FAFC] px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">综合评分</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#0F172A]">{state.reviewSummary?.averageRating || '0.0'}</p>
                </div>
                <div className="rounded-[20px] border border-[#E8EDF3] bg-[#F8FAFC] px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">评价数量</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#0F172A]">{state.reviewSummary?.totalReviews || 0}</p>
                </div>
                <div className="rounded-[20px] border border-[#E8EDF3] bg-[#F8FAFC] px-4 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">展示能力</p>
                  <p className="mt-2 text-sm font-bold text-[#0F172A]">图像优先 · 视频兼容</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {(state.reviewSummary?.highlightTags || []).map((tag, index) => <span key={tag} className="rounded-full bg-[#F1F5F9] px-3 py-1.5 text-xs font-semibold text-[#475569]">{tag}</span>)}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {state.reviews.length > 0 ? state.reviews.map((review, index) => <article key={review.reviewId} className="rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">{review.customerName}</p>
                        <p className="mt-1 text-xs text-[#64748B]">{review.productName}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(5)].map((_, index1) => <Star key={index1} className={`size-3.5 fill-current ${index1 < Math.floor(review.rating) ? 'text-amber-500' : 'text-slate-200'}`} />)}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#475569]">{review.content}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {review.medias.length > 0 ? review.medias.map((media, index1) => <div key={`${review.reviewId}-${index1}`} className="overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white">
                            <EditableImg propKey={`review-${review.reviewId}-${index1}`} keywords={media.thumbnailUrl || media.url || 'product review media thumbnail'} className="h-28 w-full object-cover" style={{
                    width: '100%',
                    height: '112px',
                    objectFit: 'cover'
                  }} description={`review ${media.type} thumbnail`} />
                            <div className="px-3 py-2 text-[11px] font-semibold text-[#64748B]">{media.type === 'video' ? '视频缩略' : '图片展示'}</div>
                          </div>) : <div className="col-span-2 rounded-[18px] border border-dashed border-[#D8DEE8] bg-white px-4 py-8 text-center text-sm text-[#94A3B8]">
                          暂无晒单媒体，已兼容空态展示
                        </div>}
                    </div>
                  </article>) : <div className="rounded-[24px] border border-dashed border-[#D8DEE8] bg-[#F8FAFC] px-6 py-12 text-center text-sm text-[#94A3B8] lg:col-span-3">
                  当前暂无可展示评价摘要
                </div>}
            </div>
          </div>
        </div>
      </section>
    </main>;
}
