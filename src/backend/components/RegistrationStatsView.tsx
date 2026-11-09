"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import type { useRegistrationStats } from "@/backend/hooks/useRegistrationStats";

type HookReturn = ReturnType<typeof useRegistrationStats>;

export default function RegistrationStatsView({
  state,
  handlers,
}: {
  state: HookReturn["state"];
  handlers: HookReturn["handlers"];
}) {
  const fmt = (n: number) => n.toLocaleString();
  const months = state.detail?.months || [];

  return (
    <section className="w-full min-h-screen bg-[#F8FAFC] p-6">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div>
          <button
            type="button"
            onClick={handlers.handleBack}
            className="mb-3 inline-flex items-center gap-1 text-base font-semibold text-[#0052D9]"
          >
            <ArrowLeft className="size-4" /> 返回概览
          </button>
          <h1 className="text-3xl font-bold text-[#1E293B]">注册与转化详情</h1>
          <p className="mt-2 text-lg text-[#64748B]">
            总注册 {state.detail?.totalCustomerCount?.toLocaleString() ?? "—"} · 按注册月份统计
          </p>
          <p className="mt-1 text-base text-[#94A3B8]">
            转化率 = 该月注册客户中已下过单的比例。
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <table className="w-full text-left text-lg">
            <thead>
              <tr className="bg-[#F8FAFC] text-base text-[#64748B]">
                <th className="px-5 py-4 font-semibold">注册月份</th>
                <th className="px-5 py-4 text-right font-semibold">注册数量</th>
                <th className="px-5 py-4 text-right font-semibold">转化率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {state.loading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-lg text-[#94A3B8]">
                    加载中…
                  </td>
                </tr>
              ) : months.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-lg text-[#94A3B8]">
                    暂无数据
                  </td>
                </tr>
              ) : (
                months.map((row) => (
                  <tr key={row.month} className="hover:bg-[#F8FAFC]/50">
                    <td className="px-5 py-4 text-xl font-semibold text-[#1E293B]">{row.monthLabel}</td>
                    <td className="px-5 py-4 text-right font-mono text-xl font-bold tabular-nums text-[#1E293B]">
                      {fmt(row.registerCount)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-xl font-bold tabular-nums text-[#0052D9]">
                      {row.registerCount > 0 ? `${row.conversionRate}%` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
