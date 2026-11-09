'use client'

import React from 'react'
import { ArrowLeft, FileSpreadsheet, ImagePlus, Trash2 } from 'lucide-react'
import type { useSalesStats } from '@/backend/hooks/useSalesStats'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type HookReturn = ReturnType<typeof useSalesStats>

const moneyText = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function SalesStatsView({
  state,
  handlers,
}: {
  state: HookReturn['state']
  handlers: HookReturn['handlers']
}) {
  const sheetRef = React.useRef<HTMLInputElement>(null)
  const imageRef = React.useRef<HTMLInputElement>(null)
  const summary = state.detail?.summary
  const orders = state.detail?.orders || []

  return (
    <section className="min-h-screen w-full bg-[#F8FAFC] p-6">
      <div className="container mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={handlers.handleBack}
              className="mb-3 inline-flex items-center gap-1 text-base font-semibold text-[#0052D9]"
            >
              <ArrowLeft className="size-4" /> 返回概览
            </button>
            <h1 className="text-3xl font-bold text-[#1E293B]">销售额统计</h1>
            <p className="mt-2 text-base text-[#64748B]">
              格式对齐业务表：日期 / 姓名@电话 / 地址 / 订单金额 / 商品金额 / USD运费 / 运费成本 / 计费重量 / 物流号
            </p>
            <p className="mt-1 text-sm text-[#94A3B8]">
              支持表格导入或图片识别。同一客户多条物流号会合并显示金额。
              {state.detail?.updatedAt ? ` · 更新于 ${new Date(state.detail.updatedAt).toLocaleString('zh-CN', { hour12: false })}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={state.importing} onClick={() => sheetRef.current?.click()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {state.importing ? '导入中…' : '导入表格'}
            </Button>
            <Button type="button" variant="outline" disabled={state.importing} onClick={() => imageRef.current?.click()}>
              <ImagePlus className="mr-2 h-4 w-4" />
              图片识别
            </Button>
            <Button type="button" variant="outline" disabled={state.importing || !orders.length} onClick={() => void handlers.clearLedger()}>
              <Trash2 className="mr-2 h-4 w-4" />
              清空
            </Button>
            <input
              ref={sheetRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handlers.importSheet(file)
                event.target.value = ''
              }}
            />
            <input
              ref={imageRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handlers.importImage(file)
                event.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: '订单数', value: summary?.orderCount },
            { label: '包裹数', value: summary?.shipmentCount },
            { label: '订单金额合计', value: summary?.orderAmountTotal, money: true },
            { label: '商品金额合计', value: summary?.goodsAmountTotal, money: true },
            { label: 'USD运费合计', value: summary?.usdShippingTotal, money: true },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="text-sm text-[#64748B]">{card.label}</div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-[#1E293B]">
                {state.loading ? '—' : card.money ? moneyText(card.value ?? null) : Number(card.value || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <table className="min-w-[1100px] w-full border-collapse text-base">
            <thead>
              <tr className="text-center text-[#1E293B]">
                <th className="border border-[#CBD5E1] bg-[#DCEBFF] px-3 py-3 font-semibold">日期</th>
                <th className="border border-[#CBD5E1] bg-[#DCEBFF] px-3 py-3 font-semibold">姓名@电话</th>
                <th className="border border-[#CBD5E1] bg-[#DCEBFF] px-3 py-3 font-semibold">地址</th>
                <th className="border border-[#CBD5E1] bg-[#C6F6D5] px-3 py-3 font-semibold">订单金额</th>
                <th className="border border-[#CBD5E1] bg-[#C6F6D5] px-3 py-3 font-semibold">商品金额</th>
                <th className="border border-[#CBD5E1] bg-[#C6F6D5] px-3 py-3 font-semibold">USD运费</th>
                <th className="border border-[#CBD5E1] bg-[#BFDBFE] px-3 py-3 font-semibold">运费成本</th>
                <th className="border border-[#CBD5E1] bg-[#BFDBFE] px-3 py-3 font-semibold">计费重量</th>
                <th className="border border-[#CBD5E1] bg-[#BFDBFE] px-3 py-3 font-semibold">订单备注</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-lg text-[#94A3B8]">加载中…</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-lg text-[#94A3B8]">
                    还没有数据。请导入表格，或上传业务表截图识别。
                  </td>
                </tr>
              ) : (
                orders.flatMap((order) => {
                  const span = Math.max(1, order.lines.length)
                  return order.lines.map((line, index) => (
                    <tr key={`${order.id}-${index}`} className={cn(index === 0 ? 'border-t-2 border-t-[#94A3B8]' : '')}>
                      {index === 0 ? (
                        <>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-3 py-3 text-center align-middle whitespace-nowrap">{order.dateText || '—'}</td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-3 py-3 text-center align-middle">
                            <div className="font-semibold text-[#1E293B]">{order.customerName || '—'}</div>
                            <div className="text-sm text-[#64748B]">{order.phone || ''}</div>
                          </td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-3 py-3 text-left align-middle max-w-[260px] break-words">{order.address || '—'}</td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-3 py-3 text-center align-middle font-bold tabular-nums">{moneyText(order.orderAmount)}</td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-3 py-3 text-center align-middle font-bold tabular-nums">{moneyText(order.goodsAmount)}</td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-3 py-3 text-center align-middle font-bold tabular-nums">{moneyText(order.usdShipping)}</td>
                        </>
                      ) : null}
                      <td className="border border-[#E2E8F0] px-3 py-3 text-center tabular-nums">{line.freightCost || '—'}</td>
                      <td className="border border-[#E2E8F0] px-3 py-3 text-center tabular-nums">{line.chargeWeight || '—'}</td>
                      <td className="border border-[#E2E8F0] px-3 py-3 text-center break-all">{line.remark || '—'}</td>
                    </tr>
                  ))
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
