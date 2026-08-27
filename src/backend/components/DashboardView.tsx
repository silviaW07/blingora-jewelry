"use client";

import React, { useEffect } from "react";
import { TrendingUp } from "lucide-react";
import EditableImg from "@/@base/EditableImg";
import type { UseDashboardState, UseDashboardHandlers } from "@/backend/hooks/useDashboard";
import CategoryBrandShelfTree from "@/backend/components/CategoryBrandShelfTree";
interface Props {
  state: UseDashboardState;
  handlers: UseDashboardHandlers;
}
export default function DashboardView({
  state,
  handlers
}: Props) {
  useEffect(() => {
    const cleanup = handlers.handleInit();
    return cleanup;
  }, []);
  return <section className="w-full bg-[#F8FAFC] relative overflow-hidden" data-controller-name="管理概览" data-api-unique-id="dashboardview-r0904c4ce69995de7-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" data-api-unique-id="dashboardview-r3eef73e538d0c005-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />

      <div className="relative z-10 p-6 space-y-6" data-api-unique-id="dashboardview-r3aa73665cbd1c772-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
        <div className="container mx-auto space-y-6" data-api-unique-id="dashboardview-r67ef0a4644a553ed-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2" data-controller-name="页面标题及全局操作" data-api-unique-id="dashboardview-r7b9f42921d0d9cba-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
            <div data-api-unique-id="dashboardview-rcf944ae5b831f5be-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <h1 className="text-xl font-bold text-[#1E293B] flex items-center gap-2" data-api-unique-id="dashboardview-rec451ebf3161c04c-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <span className="inline-block w-1.5 h-5 bg-[#0052D9] rounded-sm" data-api-unique-id="dashboardview-r739cf73933a43ace-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
                跨境独立站运营概览
              </h1>
              <p className="text-xs text-[#64748B] mt-1">实时监控上架规模、周月新增、1688 等上传途径</p>
            </div>

            <div className="flex flex-wrap gap-2" data-api-unique-id="dashboardview-r38f3199624e6ee46-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <button onClick={e => {
              e.preventDefault();
              handlers.handleExportReport();
            }} className="inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] text-xs bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569] hover:bg-[#E2E8F0] px-4 py-2 rounded-md gap-1.5" data-api-unique-id="dashboardview-rd95bff58f56f492d-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <TrendingUp className="size-3.5" data-api-unique-id="dashboardview-r357cb7af343f051f-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
                导出运营报表
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-controller-name="KPI统计卡片">
            {(() => {
              const kpi = state.kpiStats;
              const listed = kpi?.listedProductCount ?? kpi?.totalProductCount ?? 0;
              const fmt = (n: number) => n.toLocaleString();
              const cardCls =
                "bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow text-left w-full";
              return <>
            <button
              type="button"
              onClick={() => handlers.handleNavigateToListingStats()}
              className={`${cardCls} cursor-pointer`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052D9]" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-[#64748B]">总上架数</span>
                <span className="text-[10px] font-semibold text-[#0052D9]">详情 →</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight">{state.isInitializing ? "—" : fmt(listed)}</p>
                <p className="text-[11px] text-[#94A3B8]">点击查看途径与周月明细</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlers.handleNavigateToRegistrationStats()}
              className={`${cardCls} cursor-pointer`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052D9]" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-[#64748B]">总注册数</span>
                <span className="text-[10px] font-semibold text-[#0052D9]">详情 →</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight">{state.isInitializing ? "—" : fmt(kpi?.totalCustomerCount ?? 0)}</p>
                <p className="text-[11px] text-[#94A3B8]">本周新注册 {fmt(kpi?.newRegisteredUserCount ?? 0)} · 点击查看周月年明细</p>
              </div>
            </button>

            <div className={cardCls}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6A00]" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-[#64748B]">总订单数</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight">{state.isInitializing ? "—" : fmt(kpi?.totalOrderCount ?? 0)}</p>
                <p className="text-[11px] text-[#94A3B8]">全部订单记录</p>
              </div>
            </div>
              </>;
            })()}
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-api-unique-id="dashboardview-r174a5e7b6dcb3d87-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">

            <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 flex flex-col" data-controller-name="前台类目品牌货盘" data-api-unique-id="dashboardview-r3347167fbb6f58ff-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <CategoryBrandShelfTree
                data={state.shelfTree}
                isLoading={state.isInitializing}
                gapsOnly={state.shelfGapsOnly}
                onGapsOnlyChange={handlers.handleToggleShelfGapsOnly}
              />
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 space-y-4 flex flex-col" data-controller-name="最新注册买家" data-api-unique-id="dashboardview-r60e7f6a0e7a733bc-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-3 shrink-0" data-api-unique-id="dashboardview-r9559e3ce03f81b93-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <h2 className="text-sm font-bold text-[#1E293B]" data-api-unique-id="dashboardview-rc28756dc0381fc9a-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">最新注册买家</h2>
                <span className="text-xs text-[#64748B]" data-api-unique-id="dashboardview-r7e4fc25696e05f93-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">实时买家流</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1" data-api-unique-id="dashboardview-r851c72f24a4d1b09-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                {state.isInitializing ? <div className="flex items-center justify-center h-full text-xs text-[#64748B] py-10" data-api-unique-id="dashboardview-r15263bb0b2d1b332-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">加载中...</div> : state.recentUsers.length === 0 ? <div className="flex items-center justify-center h-full text-xs text-[#64748B] py-10" data-api-unique-id="dashboardview-r0eb558946558fe8b-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">暂无新用户</div> : state.recentUsers.map((user, index) => <div key={user.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all" data-api-unique-id="dashboardview-r08593b9e3fcf9da2-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                      <div className="flex items-center gap-2.5 min-w-0" data-api-unique-id="dashboardview-r411534ac75df5866-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                        <EditableImg propKey={`recent-user-${user.id}`} keywords={user.avatarUrl ?? "professional modern user avatar"} className="size-9 rounded-full object-cover border border-[#E2E8F0]" style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '9999px',
                    aspectRatio: '1/1'
                  }} description="A professional user portrait with a neutral background, soft lighting, and a clean modern appearance" data-api-unique-id="dashboardview-r81b68f19fd51a3a4-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1" />
                        <div className="min-w-0" data-api-unique-id="dashboardview-ree97a1134c7cdce3-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          <div className="flex items-center gap-1.5" data-api-unique-id="dashboardview-re4f72d96567f6322-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                            <span className="text-xs font-bold text-[#1E293B] truncate" data-api-unique-id="dashboardview-r8dfe91d7831232ab-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{user.username ?? "未命名买家"}</span>
                            <span className="text-[9px] bg-[#0052D9]/10 text-[#0052D9] px-1 rounded font-bold" data-api-unique-id="dashboardview-rc8ccc8d3d254ee8d-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                              注册会员
                            </span>
                          </div>
                          <p className="text-[10px] text-[#64748B] truncate font-mono" data-api-unique-id="dashboardview-r89903f5da98dcdbe-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{user.email ?? "-"}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0" data-api-unique-id="dashboardview-r35c9ba92f2cceddd-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                        <span className="text-[10px] font-bold text-[#2BA471] bg-[#2BA471]/10 px-1.5 py-0.5 rounded block mb-1" data-api-unique-id="dashboardview-rf41df14f0e0fd0a3-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          海外
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-mono block" data-api-unique-id="dashboardview-rc8b9aeaf6595eeb5-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">近期注册</span>
                      </div>
                    </div>)}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>;
}