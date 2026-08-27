"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { CategoryBrandShelfTree_Output, ShelfL2Node_Output } from "@/backend/types/Dashboard";

interface Props {
  data: CategoryBrandShelfTree_Output | null;
  isLoading: boolean;
  gapsOnly: boolean;
  onGapsOnlyChange: (value: boolean) => void;
}

function countClass(count: number) {
  if (count <= 0) return "bg-[#D9001B]/10 text-[#D9001B]";
  if (count < 3) return "bg-amber-100 text-amber-800";
  return "bg-[#F1F5F9] text-[#334155]";
}

function BrandGrid({ node, gapsOnly }: { node: ShelfL2Node_Output; gapsOnly: boolean }) {
  const brands = gapsOnly ? node.brands.filter((item) => item.count === 0) : node.brands;
  if (brands.length === 0 && node.unmatchedBrandCount === 0) {
    return <p className="text-[11px] text-[#94A3B8] px-1">该二级类目下暂无品牌缺口</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
      {!gapsOnly && node.unmatchedBrandCount > 0 ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-[#CBD5E1] px-2 py-1.5">
          <span className="text-[11px] text-[#64748B] truncate">未绑定品牌</span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${countClass(node.unmatchedBrandCount)}`}>
            {node.unmatchedBrandCount}
          </span>
        </div>
      ) : null}
      {brands.map((brand) => (
        <div
          key={brand.id}
          className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 ${
            brand.count === 0 ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#E2E8F0] bg-white"
          }`}
        >
          <span className="text-[11px] font-medium text-[#1E293B] truncate" title={brand.name}>
            {brand.name}
          </span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${countClass(brand.count)}`}>
            {brand.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CategoryBrandShelfTree({ data, isLoading, gapsOnly, onGapsOnlyChange }: Props) {
  const [openL1, setOpenL1] = useState<Record<string, boolean>>({});
  const [openL2, setOpenL2] = useState<Record<string, boolean>>({});
  const [keyword, setKeyword] = useState("");

  const filteredTree = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const source = data?.tree || [];
    return source
      .map((l1) => {
        const children = l1.children
          .filter((l2) => !gapsOnly || l2.count === 0 || l2.emptyBrandCount > 0)
          .filter((l2) => {
            if (!q) return true;
            if (l1.name.toLowerCase().includes(q) || l2.name.toLowerCase().includes(q)) return true;
            return l2.brands.some((brand) => brand.name.toLowerCase().includes(q));
          })
          .map((l2) => {
            if (!q) return l2;
            const hitL2 = l1.name.toLowerCase().includes(q) || l2.name.toLowerCase().includes(q);
            if (hitL2) return l2;
            return { ...l2, brands: l2.brands.filter((brand) => brand.name.toLowerCase().includes(q)) };
          });
        const keepL1 = !q || l1.name.toLowerCase().includes(q) || children.length > 0;
        if (!keepL1) return null;
        if (gapsOnly && l1.emptyChildCount === 0 && children.every((l2) => l2.emptyBrandCount === 0) && children.length === 0) {
          return null;
        }
        return { ...l1, children };
      })
      .filter(Boolean) as typeof source;
  }, [data, gapsOnly, keyword]);

  const toggleL1 = (id: string) => setOpenL1((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleL2 = (id: string) => setOpenL2((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-[#1E293B]">前台类目 × 品牌上架树</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            一级 → 二级 → 品牌 · 仅统计已上架商品 · 红色为 0，便于补货
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-[#475569] cursor-pointer">
            <input
              type="checkbox"
              checked={gapsOnly}
              onChange={(event) => onGapsOnlyChange(event.target.checked)}
              className="rounded border-[#CBD5E1]"
            />
            只看缺口
          </label>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索 Jewelry / Earring / LV"
            className="h-8 w-44 rounded-md border border-[#E2E8F0] px-2 text-[11px] outline-none focus:border-[#0052D9]"
          />
        </div>
      </div>

      {data ? (
        <div className="flex flex-wrap gap-2 py-3 shrink-0">
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#F1F5F9] text-[#334155]">
            上架 {data.activeProductCount}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-amber-100 text-amber-800">
            空二级 {data.emptyL2Count}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#D9001B]/10 text-[#D9001B]">
            空品牌格 {data.emptyBrandSlotCount}
          </span>
          <span className="text-[10px] text-[#94A3B8] font-mono self-center">
            {new Date(data.generatedAt).toLocaleTimeString()}
          </span>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto max-h-[560px] pr-1 space-y-1.5">
        {isLoading && !data ? (
          <div className="text-xs text-[#64748B] py-10 text-center">加载货盘树...</div>
        ) : filteredTree.length === 0 ? (
          <div className="text-xs text-[#64748B] py-10 text-center">没有匹配的类目</div>
        ) : (
          filteredTree.map((l1) => {
            const expanded = openL1[l1.id] !== false;
            return (
              <div key={l1.id} className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <button
                  type="button"
                  onClick={() => toggleL1(l1.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                >
                  <ChevronRight className={`size-3.5 text-[#64748B] transition-transform ${expanded ? "rotate-90" : ""}`} />
                  <span className="text-xs font-bold text-[#1E293B] flex-1 truncate">{l1.name}</span>
                  {l1.emptyChildCount > 0 ? (
                    <span className="text-[10px] font-bold text-[#D9001B]">{l1.emptyChildCount} 个空二级</span>
                  ) : null}
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${countClass(l1.count)}`}>
                    {l1.count}
                  </span>
                </button>
                {expanded ? (
                  <div className="px-2 pb-2 space-y-1">
                    {l1.unmatchedL2Count > 0 ? (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-white border border-dashed border-[#CBD5E1] ml-4">
                        <span className="text-[11px] text-[#64748B]">未归入二级类目</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${countClass(l1.unmatchedL2Count)}`}>
                          {l1.unmatchedL2Count}
                        </span>
                      </div>
                    ) : null}
                    {l1.children.map((l2) => {
                      const open = Boolean(openL2[l2.id]);
                      return (
                        <div key={l2.id} className="ml-4 rounded-md border border-[#E2E8F0] bg-white">
                          <button
                            type="button"
                            onClick={() => toggleL2(l2.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left"
                          >
                            <ChevronRight className={`size-3 text-[#94A3B8] transition-transform ${open ? "rotate-90" : ""}`} />
                            <span className="text-[12px] font-semibold text-[#334155] flex-1 truncate">{l2.name}</span>
                            {l2.emptyBrandCount > 0 ? (
                              <span className="text-[10px] text-[#D9001B]">{l2.emptyBrandCount} 品牌为 0</span>
                            ) : null}
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${countClass(l2.count)}`}>
                              {l2.count}
                            </span>
                          </button>
                          {open ? (
                            <div className="px-3 pb-3">
                              <BrandGrid node={l2} gapsOnly={gapsOnly} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
