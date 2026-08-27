"use client";

import React, { useEffect } from "react";
import { TrendingUp, AlertTriangle, Plus, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import EditableImg from "@/@base/EditableImg";
import type { UseDashboardState, UseDashboardHandlers } from "@/backend/hooks/useDashboard";
import { ImportTaskStatus } from "@/backend/types/Dashboard";
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
  const importTaskStatusMap: Record<ImportTaskStatus, string> = {
    PENDING: "等待中",
    RUNNING: "正在采集导入",
    COMPLETED: "已同步完成",
    FAILED: "任务中断"
  };
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
              <button onClick={e => {
              e.preventDefault();
              handlers.handleNavigateToCreateImportTask();
            }} className="inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] text-xs bg-[#2BA471] text-white hover:bg-[#248A5F] shadow-sm px-4 py-2 rounded-md gap-1.5" data-api-unique-id="dashboardview-r4a787ebb2176b321-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <Plus className="size-3.5" data-api-unique-id="dashboardview-r3c5a424aa11ad338-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
                新建 1688 采集任务
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-controller-name="KPI统计卡片">
            {(() => {
              const kpi = state.kpiStats;
              const listed = kpi?.listedProductCount ?? kpi?.totalProductCount ?? 0;
              const mom = kpi?.monthOverMonthPercent ?? 0;
              const wow = kpi?.weekOverWeekPercent ?? 0;
              const trendCls = (n: number) => n >= 0 ? "bg-[#2BA471]/10 text-[#2BA471]" : "bg-[#D9001B]/10 text-[#D9001B]";
              const trendText = (n: number) => `${n >= 0 ? "↑" : "↓"} ${Math.abs(n)}%`;
              const fmt = (n: number) => n.toLocaleString();
              const source1688 = kpi?.sources?.find((row) => row.source === "IMPORT_1688");
              return <>
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052D9]" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-[#64748B]">总上架数</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${trendCls(mom)}`}>
                  {trendText(mom)}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight">{state.isInitializing ? "—" : fmt(listed)}</p>
                <p className="text-[11px] text-[#94A3B8]">相比上月新增 {fmt(kpi?.monthListedDelta ?? 0)} 件</p>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052D9]" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-[#64748B]">本周上架</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${trendCls(wow)}`}>
                  {trendText(wow)}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight">{state.isInitializing ? "—" : fmt(kpi?.weekListedCount ?? 0)}</p>
                <p className="text-[11px] text-[#94A3B8]">上周 {fmt(kpi?.prevWeekListedCount ?? 0)} 件</p>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6A00]" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-[#64748B]">本月上架</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-[#FF6A00]/10 text-[#C2410C]">
                  1688 {source1688?.monthCount ?? 0}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight">{state.isInitializing ? "—" : fmt(kpi?.monthListedCount ?? 0)}</p>
                <p className="text-[11px] text-[#94A3B8]">上月 {fmt(kpi?.prevMonthListedCount ?? 0)} 件</p>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D9001B]" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-[#64748B]">待处理库存预警</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-[#D9001B]/10 text-[#D9001B]">
                  需立即处理
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight">{state.kpiStats?.lowStockAlertCount ?? "—"}</p>
                <p className="text-[11px] text-[#94A3B8]">本周新买家 {state.kpiStats?.newRegisteredUserCount ?? 0}</p>
              </div>
            </div>
              </>;
            })()}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-[#1E293B]">上传途径统计</h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">按来源拆分当前上架库存 · 周 / 月新增</p>
              </div>
              <button
                type="button"
                onClick={() => handlers.handleNavigateToListingStats()}
                className="text-xs text-[#0052D9] font-semibold hover:underline flex items-center gap-1"
              >
                数据详情统计 <ExternalLink className="size-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#64748B] bg-[#F8FAFC]">
                    <th className="py-2 px-3 font-semibold">途径</th>
                    <th className="py-2 px-3 font-semibold text-right">上架数</th>
                    <th className="py-2 px-3 font-semibold text-right">本周</th>
                    <th className="py-2 px-3 font-semibold text-right">本月</th>
                    <th className="py-2 px-3 font-semibold text-right">占比</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {(state.kpiStats?.sources || []).map((row) => {
                    const is1688 = row.source === "IMPORT_1688";
                    return (
                      <tr key={row.source} className={is1688 ? "bg-[#FFF7ED]" : ""}>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1.5 font-bold ${is1688 ? "text-[#C2410C]" : "text-[#1E293B]"}`}>
                            {is1688 ? <span className="inline-block size-2 rounded-sm bg-[#FF6A00]" /> : null}
                            {row.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">{row.listedCount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{row.weekCount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{row.monthCount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-mono font-bold ${is1688 ? "text-[#C2410C]" : "text-[#334155]"}`}>{row.sharePercent}%</span>
                        </td>
                      </tr>
                    );
                  })}
                  {!state.isInitializing && (state.kpiStats?.sources || []).length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-[#94A3B8]">暂无上架数据</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-api-unique-id="dashboardview-r3025e95e4d2766ab-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">

            <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 space-y-4 flex flex-col" data-controller-name="采集任务监控" data-api-unique-id="dashboardview-r480502d06bb71e5f-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-3 shrink-0" data-api-unique-id="dashboardview-rc70f31e2d7038ebd-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <div className="flex items-center gap-2" data-api-unique-id="dashboardview-rf01de158f62e496e-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  <div className="size-2 rounded-full bg-[#2BA471] animate-pulse" data-api-unique-id="dashboardview-re39b004168891384-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
                  <h2 className="text-sm font-bold text-[#1E293B]" data-api-unique-id="dashboardview-r813e60ef1bf481ae-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">1688 采集任务监控</h2>
                </div>
                <span className="text-xs text-[#64748B] font-medium" data-api-unique-id="dashboardview-r72a63fdfff9e224d-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">实时同步中</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] pr-1" data-api-unique-id="dashboardview-r233d000ab2ba6e39-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                {state.isInitializing ? <div className="flex items-center justify-center h-full text-xs text-[#64748B] py-10" data-api-unique-id="dashboardview-r81751c9ef556356c-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">加载中...</div> : state.importTasks.length === 0 ? <div className="flex items-center justify-center h-full text-xs text-[#64748B] py-10" data-api-unique-id="dashboardview-r4caf459297cc64a1-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">暂无任务记录</div> : state.importTasks.map((task, index) => <div key={task.id} className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] transition-colors space-y-3" data-api-unique-id="dashboardview-r869527b3b85bb1a4-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2" data-api-unique-id="dashboardview-r197e76dbbbc979d9-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                        <div className="flex items-center gap-2 min-w-0" data-api-unique-id="dashboardview-r11fdcc2d8500f37e-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          <span className="text-[10px] font-mono bg-[#0052D9]/10 text-[#0052D9] px-2 py-0.5 rounded font-bold shrink-0" data-api-unique-id="dashboardview-r4942c5f981cdd59e-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                            1688 货源
                          </span>
                          <span className="text-xs font-bold text-[#1E293B] truncate" data-api-unique-id="dashboardview-r0ecc3ed69362cee3-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{task.taskName ?? "任务名称"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] shrink-0" data-api-unique-id="dashboardview-ra04b09c7bfc441e7-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          <span className="font-mono text-[#64748B]" data-api-unique-id="dashboardview-read0493c63c9d27d-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{task.id}</span>
                          <span className="text-[#E2E8F0]" data-api-unique-id="dashboardview-r07ecfb27feacdd74-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">|</span>
                          <span className="text-[#64748B]" data-api-unique-id="dashboardview-r0a397108a13fc600-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{task.status === 'COMPLETED' ? "已完成" : "进行中"}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5" data-api-unique-id="dashboardview-r74c9fbc18ada3b73-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                        <div className="flex justify-between text-[11px] font-semibold" data-api-unique-id="dashboardview-r25f088b453ba14f5-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          <span className="flex items-center gap-1" data-api-unique-id="dashboardview-rfdc82d8fc51dba31-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                            {task.status === "COMPLETED" && <CheckCircle2 className="size-3.5 text-[#2BA471]" data-api-unique-id="dashboardview-r29612cf519f47a87-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1" />}
                            {task.status === "FAILED" && <XCircle className="size-3.5 text-[#D9001B]" data-api-unique-id="dashboardview-r1641d2a38e905af8-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1" />}
                            {(task.status === "RUNNING" || task.status === "PENDING") && <Clock className="size-3.5 text-[#0052D9] animate-spin" data-api-unique-id="dashboardview-racb9624bb1c367f5-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1" />}
                            <span className={task.status === "COMPLETED" ? "text-[#2BA471]" : task.status === "FAILED" ? "text-[#D9001B]" : "text-[#0052D9]"} data-api-unique-id="dashboardview-r46edaf9c2a13576e-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                              {importTaskStatusMap[task.status] ?? "处理中"}
                            </span>
                          </span>
                          <span className="font-mono text-[#1E293B]" data-api-unique-id="dashboardview-rdc54c734ad5470ee-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{task.progressPercent ?? 0}%</span>
                        </div>

                        <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden" data-api-unique-id="dashboardview-refb164610c67f71f-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          <div className={`h-full rounded-full transition-all duration-1000 ${task.status === "COMPLETED" ? "bg-[#2BA471]" : task.status === "FAILED" ? "bg-[#D9001B]" : "bg-[#0052D9]"}`} style={{
                      width: `${task.progressPercent ?? 0}%`
                    }} data-api-unique-id="dashboardview-rf717ac04625af05e-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-[#94A3B8] pt-1" data-api-unique-id="dashboardview-r2b4245f3fbcea098-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                        <span data-api-unique-id="dashboardview-r2ec344f7407d972c-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          预计剩余时间: <strong className="text-[#475569]" data-api-unique-id="dashboardview-rc9be4f7da8e5d9ae-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{task.status === "COMPLETED" ? "已完成" : "计算中..."}</strong>
                        </span>
                        {task.status === "FAILED" && <button onClick={() => handlers.handleRetryTask(task.id)} disabled={state.isRetryingTaskId === task.id} className="text-[#0052D9] hover:underline font-semibold disabled:opacity-50" data-api-unique-id="dashboardview-r0717713231c7e9a7-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                            {state.isRetryingTaskId === task.id ? "重试中..." : "重新尝试"}
                          </button>}
                      </div>
                    </div>)}
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 space-y-4 flex flex-col" data-controller-name="供应链库存预警" data-api-unique-id="dashboardview-r99806aa53e728250-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-3 shrink-0" data-api-unique-id="dashboardview-rc39af6e6e01ba718-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <div className="flex items-center gap-2" data-api-unique-id="dashboardview-r911f6520817c602f-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  <AlertTriangle className="size-4 text-[#D9001B]" data-api-unique-id="dashboardview-r0e22e0f30fdda1d0-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
                  <h2 className="text-sm font-bold text-[#1E293B]" data-api-unique-id="dashboardview-rbd46de31f0e228ee-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">供应链库存预警</h2>
                </div>
                <span className="text-[10px] bg-[#D9001B]/10 text-[#D9001B] px-2 py-0.5 rounded font-bold font-mono" data-api-unique-id="dashboardview-rd8789d65481d4edc-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  {state.stockAlerts.length} 条告急
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px] pr-1" data-api-unique-id="dashboardview-r5edb643e6e657429-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                {state.isInitializing ? <div className="flex items-center justify-center h-full text-xs text-[#64748B] py-10" data-api-unique-id="dashboardview-r81dbb4b8155ad9ed-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">加载中...</div> : state.stockAlerts.length === 0 ? <div className="flex items-center justify-center h-full text-xs text-[#64748B] py-10" data-api-unique-id="dashboardview-r5a692b308f8c4e42-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">当前无告急库存</div> : state.stockAlerts.map((alert, index) => <div key={alert.id} className="p-3 rounded-lg border border-[#F1F5F9] bg-white hover:border-[#CBD5E1] transition-colors space-y-2" data-api-unique-id="dashboardview-rc689e5aa880d6100-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                      <div className="flex justify-between items-start gap-2" data-api-unique-id="dashboardview-rd2c207addd9be5ff-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                        <span className="text-xs font-bold text-[#1E293B] line-clamp-1 flex-1" data-api-unique-id="dashboardview-r995ca0245fffbdd9-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{alert.productName ?? "未知商品"}</span>
                        <span className="text-[10px] font-mono text-[#D9001B] font-bold bg-[#D9001B]/10 px-1.5 py-0.5 rounded shrink-0" data-api-unique-id="dashboardview-rafb05fe79ea09304-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          存 {alert.stock ?? 0} 件
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#64748B]" data-api-unique-id="dashboardview-r7e297cdad44495ef-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                        <span className="font-mono bg-[#F1F5F9] px-1.5 py-0.5 rounded" data-api-unique-id="dashboardview-rdd7d05208a69a5a5-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{alert.skuCode ?? "未知 SKU"}</span>
                        <span data-api-unique-id="dashboardview-r55f9d7ff12b4be09-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">预警线: 20 件</span>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] border-t border-[#F1F5F9] pt-1.5 flex justify-between items-center" data-api-unique-id="dashboardview-r094d112ae531daf4-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                        <span className="truncate" data-api-unique-id="dashboardview-r126a13e3fe85e2b8-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">供应商: 默认核心供应商</span>
                        <button onClick={() => handlers.handleReplenishStock(alert.skuCode)} className="text-[#0052D9] font-semibold hover:underline shrink-0" data-api-unique-id="dashboardview-r526fae142c743a83-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          一键补货
                        </button>
                      </div>
                    </div>)}
              </div>
            </div>
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