"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import CategoryBrandShelfTree from "@/backend/components/CategoryBrandShelfTree";
import type { useListingStats } from "@/backend/hooks/useListingStats";

type HookReturn = ReturnType<typeof useListingStats>;

export default function ListingStatsView({
  state,
  handlers,
}: {
  state: HookReturn["state"];
  handlers: HookReturn["handlers"];
}) {
  const maxWeek = Math.max(1, ...(state.detail?.weeks.map((item) => item.count) || [1]));
  const maxMonth = Math.max(1, ...(state.detail?.months.map((item) => item.count) || [1]));

  return (
    <section className="w-full bg-[#F8FAFC] min-h-screen p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={handlers.handleBack}
              className="inline-flex items-center gap-1 text-xs text-[#0052D9] font-semibold mb-2"
            >
              <ArrowLeft className="size-3.5" /> 返回概览
            </button>
            <h1 className="text-xl font-bold text-[#1E293B]">上架数据详情统计</h1>
            <p className="text-xs text-[#64748B] mt-1">
              总上架 {state.detail?.listedProductCount?.toLocaleString() ?? "—"} · 近 12 周 / 12 月 · 上传途径
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#1E293B] mb-4">近 12 周上架</h2>
            {state.loading ? (
              <p className="text-xs text-[#94A3B8]">加载中...</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {(state.detail?.weeks || []).map((item) => (
                  <div key={item.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full rounded-t bg-[#0052D9]/80 min-h-[4px]"
                      style={{ height: `${Math.round((item.count / maxWeek) * 100)}%` }}
                      title={`${item.label}: ${item.count}`}
                    />
                    <span className="text-[9px] text-[#94A3B8] font-mono truncate w-full text-center">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#1E293B] mb-4">近 12 月上架</h2>
            {state.loading ? (
              <p className="text-xs text-[#94A3B8]">加载中...</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {(state.detail?.months || []).map((item) => (
                  <div key={item.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full rounded-t bg-[#FF6A00]/80 min-h-[4px]"
                      style={{ height: `${Math.round((item.count / maxMonth) * 100)}%` }}
                      title={`${item.label}: ${item.count}`}
                    />
                    <span className="text-[9px] text-[#94A3B8] font-mono truncate w-full text-center">
                      {item.label.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-bold text-[#1E293B] mb-3">上传途径</h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#64748B] bg-[#F8FAFC]">
                <th className="py-2 px-3">途径</th>
                <th className="py-2 px-3 text-right">上架数</th>
                <th className="py-2 px-3 text-right">本周</th>
                <th className="py-2 px-3 text-right">本月</th>
                <th className="py-2 px-3 text-right">占比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {(state.detail?.sources || []).map((row) => {
                const is1688 = row.source === "IMPORT_1688";
                return (
                  <tr key={row.source} className={is1688 ? "bg-[#FFF7ED]" : ""}>
                    <td className={`py-2.5 px-3 font-bold ${is1688 ? "text-[#C2410C]" : "text-[#1E293B]"}`}>
                      {is1688 ? "1688 采集" : row.label}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{row.listedCount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{row.weekCount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{row.monthCount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{row.sharePercent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
          <CategoryBrandShelfTree
            data={state.shelfTree}
            isLoading={state.loading}
            gapsOnly={state.gapsOnly}
            onGapsOnlyChange={handlers.handleToggleGapsOnly}
          />
        </div>
      </div>
    </section>
  );
}
