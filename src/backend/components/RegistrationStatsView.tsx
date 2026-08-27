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
  const week = state.detail?.week;
  const month = state.detail?.month;
  const year = state.detail?.year;

  const rows = [
    { label: "注册数", week: week?.registerCount ?? 0, month: month?.registerCount ?? 0, year: year?.registerCount ?? 0 },
    { label: "首单数", week: week?.firstOrderCount ?? 0, month: month?.firstOrderCount ?? 0, year: year?.firstOrderCount ?? 0 },
    { label: "复购数", week: week?.repeatOrderCount ?? 0, month: month?.repeatOrderCount ?? 0, year: year?.repeatOrderCount ?? 0 },
  ];

  return (
    <section className="w-full bg-[#F8FAFC] min-h-screen p-6">
      <div className="container mx-auto space-y-6">
        <div>
          <button
            type="button"
            onClick={handlers.handleBack}
            className="inline-flex items-center gap-1 text-xs text-[#0052D9] font-semibold mb-2"
          >
            <ArrowLeft className="size-3.5" /> 返回概览
          </button>
          <h1 className="text-xl font-bold text-[#1E293B]">注册与转化详情</h1>
          <p className="text-xs text-[#64748B] mt-1">
            总注册 {state.detail?.totalCustomerCount?.toLocaleString() ?? "—"} · 本周 / 本月 / 本年
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            注册按客户注册时间统计；首单按后台标记「首单」、复购按后台标记「多单」的标记时间统计。
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#64748B] bg-[#F8FAFC] text-xs">
                <th className="py-3 px-4 font-medium">指标</th>
                <th className="py-3 px-4 font-medium text-right">本周</th>
                <th className="py-3 px-4 font-medium text-right">本月</th>
                <th className="py-3 px-4 font-medium text-right">本年</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="py-3.5 px-4 font-semibold text-[#1E293B]">{row.label}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1E293B]">
                    {state.loading ? "—" : fmt(row.week)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1E293B]">
                    {state.loading ? "—" : fmt(row.month)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1E293B]">
                    {state.loading ? "—" : fmt(row.year)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
