"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { TrendingUp, AlertTriangle, Plus, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import EditableImg from "@/@base/EditableImg";
import type { UseDashboardState, UseDashboardHandlers } from "@/backend/hooks/useDashboard";
import { ImportTaskStatus, ProductStatus } from "@/backend/types/Dashboard";
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
  const productStatusMap: Record<ProductStatus, string> = {
    DRAFT: "草稿",
    ACTIVE: "已上架",
    INACTIVE: "已下架"
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
              <p className="text-xs text-[#64748B] mt-1" data-api-unique-id="dashboardview-r4eecd345a71dd6e8-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">实时监控 1688 铺货任务、供应链安全水位及新注册买家动态</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-controller-name="KPI统计卡片" data-api-unique-id="dashboardview-rd07c25429ee0d6b5-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow" data-api-unique-id="dashboardview-r4e22bc736a1b1a43-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052D9]" data-api-unique-id="dashboardview-re19ea4021f8bb22b-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
              <div className="flex justify-between items-start" data-api-unique-id="dashboardview-rac4c27193ebb5435-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <span className="text-xs font-medium text-[#64748B]" data-api-unique-id="dashboardview-r88398f83b3536ff1-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">总商品数</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-[#2BA471]/10 text-[#2BA471]" data-api-unique-id="dashboardview-r7031f9e84e29b163-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  ↑ 12%
                </span>
              </div>
              <div className="space-y-1" data-api-unique-id="dashboardview-r139d04c62c107aa0-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight" data-api-unique-id="dashboardview-rb3f500ccdab2f227-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">{state.kpiStats?.totalProductCount ?? "12,840"}</p>
                <p className="text-[11px] text-[#94A3B8]" data-api-unique-id="dashboardview-rc1189c06834a6f52-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">相比上月新增 1,420 件</p>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow" data-api-unique-id="dashboardview-r9334838a3836130c-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052D9]" data-api-unique-id="dashboardview-rd60c322a8656bb20-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
              <div className="flex justify-between items-start" data-api-unique-id="dashboardview-rc810b550311ed73a-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <span className="text-xs font-medium text-[#64748B]" data-api-unique-id="dashboardview-rac8e0130e002c4e7-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">今日 1688 采集数</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-[#0052D9]/10 text-[#0052D9]" data-api-unique-id="dashboardview-r0afc6a34a5882838-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  占今日上新 80%
                </span>
              </div>
              <div className="space-y-1" data-api-unique-id="dashboardview-r1574acdbdbccb674-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight" data-api-unique-id="dashboardview-r501c050020059dd5-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">{state.kpiStats?.todayImportCount ?? "456"}</p>
                <p className="text-[11px] text-[#94A3B8]" data-api-unique-id="dashboardview-r5a5c0ea4fb1a0455-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">自动同步成功率 98.4%</p>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow" data-api-unique-id="dashboardview-r583ecfc559866fca-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052D9]" data-api-unique-id="dashboardview-rcaf7adf3575dd7b9-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
              <div className="flex justify-between items-start" data-api-unique-id="dashboardview-ra8e5e7abbe4bcf46-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <span className="text-xs font-medium text-[#64748B]" data-api-unique-id="dashboardview-r80cdd30ef59cb6f3-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">待处理库存预警</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-[#D9001B]/10 text-[#D9001B]" data-api-unique-id="dashboardview-ra78192cd210b13dc-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  需立即处理
                </span>
              </div>
              <div className="space-y-1" data-api-unique-id="dashboardview-ra4cecfad0d30cc72-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight" data-api-unique-id="dashboardview-r6e93f4e33f0f2a33-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">{state.kpiStats?.lowStockAlertCount ?? "23"}</p>
                <p className="text-[11px] text-[#94A3B8]" data-api-unique-id="dashboardview-r87b222ee0d3a0855-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">涉及 3 个核心供应商</p>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow" data-api-unique-id="dashboardview-rf214561db766a1e7-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052D9]" data-api-unique-id="dashboardview-r6e276cd07a4e3640-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
              <div className="flex justify-between items-start" data-api-unique-id="dashboardview-r0e057c769a60e5d1-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <span className="text-xs font-medium text-[#64748B]" data-api-unique-id="dashboardview-rbd5207ee9d06c2f7-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">新注册用户</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-[#2BA471]/10 text-[#2BA471]" data-api-unique-id="dashboardview-r91fd2fe274086e15-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  本周新增
                </span>
              </div>
              <div className="space-y-1" data-api-unique-id="dashboardview-rb632db05c8bb7898-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <p className="text-2xl font-bold font-mono text-[#1E293B] tracking-tight" data-api-unique-id="dashboardview-rc7077d7a72117be2-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">{state.kpiStats?.newRegisteredUserCount ?? "1,204"}</p>
                <p className="text-[11px] text-[#94A3B8]" data-api-unique-id="dashboardview-r5ee17e229f157d96-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">环比增长 8.5%</p>
              </div>
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

            <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 space-y-4 flex flex-col" data-controller-name="最近上架商品" data-api-unique-id="dashboardview-r3347167fbb6f58ff-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
              <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-3 shrink-0" data-api-unique-id="dashboardview-re1d6ba98bc8a48ec-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <h2 className="text-sm font-bold text-[#1E293B]" data-api-unique-id="dashboardview-rf47f33e8eb2e42b2-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">最近上架商品明细</h2>
                <button onClick={e => {
                e.preventDefault();
                handlers.handleNavigateToAllProducts();
              }} className="text-xs text-[#0052D9] font-semibold hover:underline flex items-center gap-1" data-api-unique-id="dashboardview-re86d731f00a2baca-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  查看全部商品 <ExternalLink className="size-3" data-api-unique-id="dashboardview-r3416ec8385140205-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" />
                </button>
              </div>

              <div className="flex-1 overflow-x-auto" data-api-unique-id="dashboardview-r63aa169bc5b7c8f2-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                <table className="w-full text-left text-xs border-collapse" data-api-unique-id="dashboardview-r1929518f0f4e0b44-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                  <thead data-api-unique-id="dashboardview-r9ee535696edab9c8-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                    <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold bg-[#F8FAFC]" data-api-unique-id="dashboardview-r57219425cba973de-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                      <th className="py-2.5 px-3" data-api-unique-id="dashboardview-re1ef083ade33e556-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">商品</th>
                      <th className="py-2.5 px-3" data-api-unique-id="dashboardview-r9c27c7f820f4171c-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">SKU</th>
                      <th className="py-2.5 px-3" data-api-unique-id="dashboardview-r0b21d1069d4c8339-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">品类</th>
                      <th className="py-2.5 px-3 text-right" data-api-unique-id="dashboardview-re674186ee1c0c9e7-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">价格</th>
                      <th className="py-2.5 px-3 text-center" data-api-unique-id="dashboardview-r1b4088d8f5b2f9c5-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">状态</th>
                      <th className="py-2.5 px-3 text-right" data-api-unique-id="dashboardview-r04bd33f3a7be0aa9-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]" data-api-unique-id="dashboardview-r032113ac6369533e-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                    {state.isInitializing ? <tr data-api-unique-id="dashboardview-r29da54881f504c42-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                        <td colSpan={6} className="text-center py-10 text-[#64748B]" data-api-unique-id="dashboardview-r497c52795558a9f5-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">加载中...</td>
                      </tr> : state.recentProducts.length === 0 ? <tr data-api-unique-id="dashboardview-r59f3cf01ce11a2f7-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">
                        <td colSpan={6} className="text-center py-10 text-[#64748B]" data-api-unique-id="dashboardview-raee74f98d9464aff-s704011111" data-api-unique-page-name="src/backend/components/DashboardView">暂无近期商品</td>
                      </tr> : state.recentProducts.map((product, index) => <tr key={product.id} className="hover:bg-[#F8FAFC] transition-colors group" data-api-unique-id="dashboardview-rdb3b91c071fe8f85-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                          <td className="py-2.5 px-3 flex items-center gap-2.5" data-api-unique-id="dashboardview-r346b07567b9aa43b-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                            <EditableImg propKey={`recent-product-${product.id}`} keywords={product.mainImageUrl} className="size-8 rounded border border-[#E2E8F0] object-cover shrink-0" style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.25rem'
                      }} description="Product main image showing the item against a clean background, well lit and professionally framed" data-api-unique-id="dashboardview-re97346218cf312e2-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1" />
                            <div className="min-w-0" data-api-unique-id="dashboardview-r6ee02512b3b47f47-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                              <p className="font-semibold text-[#1E293B] truncate max-w-[180px]" data-api-unique-id="dashboardview-r112a4d4683d32653-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{product.name ?? "未知商品"}</p>
                              <p className="text-[10px] text-[#94A3B8] font-mono" data-api-unique-id="dashboardview-r369e03974616a0fd-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{product.id}</p>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#475569]" data-api-unique-id="dashboardview-r397dfa8c078260cf-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{product.productCode ?? "-"}</td>
                          <td className="py-2.5 px-3 text-[#64748B]" data-api-unique-id="dashboardview-r3f32531771943438-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">{product.categoryName ?? "-"}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1E293B]" data-api-unique-id="dashboardview-r7907b70fb6735ac6-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">${product.price ?? "0.00"}</td>
                          <td className="py-2.5 px-3 text-center" data-api-unique-id="dashboardview-rbc943c82d1f4b500-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${product.status === "ACTIVE" ? "bg-[#2BA471]/10 text-[#2BA471]" : "bg-amber-100 text-amber-800"}`} data-api-unique-id="dashboardview-r260ed46e53113143-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                              {productStatusMap[product.status] ?? "未知"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right" data-api-unique-id="dashboardview-rb8645680ea54722b-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                            <button onClick={() => handlers.handleNavigateToProductEdit(product.name)} className="text-[#0052D9] hover:underline font-semibold text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" data-api-unique-id="dashboardview-r94ebed8f0454e5db-s704011111" data-api-unique-page-name="src/backend/components/DashboardView" data-api-in-loop="1">
                              编辑
                            </button>
                          </td>
                        </tr>)}
                  </tbody>
                </table>
              </div>
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