'use client'

import React from 'react'
import { ArrowLeft, FileSpreadsheet, ImagePlus, Trash2 } from 'lucide-react'
import type { useSalesStats } from '@/backend/hooks/useSalesStats'
import type { SalesColumnKey, SalesLedgerOrder } from '@/backend/salesStatsShared'
import { DEFAULT_SALES_META } from '@/backend/salesStatsShared'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type HookReturn = ReturnType<typeof useSalesStats>

const moneyText = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function EditableText({
  value,
  display,
  className,
  multiline,
  placeholder,
  onCommit,
}: {
  value: string
  display?: React.ReactNode
  className?: string
  multiline?: boolean
  placeholder?: string
  onCommit: (next: string) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const ref = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  React.useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  React.useEffect(() => {
    if (editing) {
      ref.current?.focus()
      ref.current?.select?.()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft !== value) onCommit(draft)
  }

  if (editing) {
    const shared = {
      ref: ref as any,
      value: draft,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.target.value),
      onBlur: commit,
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !multiline) {
          event.preventDefault()
          commit()
        }
        if (event.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      },
      className: cn(
        'w-full rounded border border-[#0052D9] bg-white px-2 py-1 text-center text-base outline-none',
        className,
      ),
    }
    return multiline ? <textarea {...shared} rows={3} /> : <input {...shared} />
  }

  return (
    <div
      role="button"
      tabIndex={0}
      title="双击修改"
      onDoubleClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') setEditing(true)
      }}
      className={cn('cursor-text rounded px-1 py-0.5 hover:bg-[#EFF6FF]', className)}
    >
      {display ?? (value || placeholder || '—')}
    </div>
  )
}

const COLUMN_ORDER: Array<{ key: SalesColumnKey; tone: string }> = [
  { key: 'date', tone: 'bg-[#DCEBFF]' },
  { key: 'namePhone', tone: 'bg-[#DCEBFF]' },
  { key: 'address', tone: 'bg-[#DCEBFF]' },
  { key: 'orderAmount', tone: 'bg-[#C6F6D5]' },
  { key: 'goodsAmount', tone: 'bg-[#C6F6D5]' },
  { key: 'usdShipping', tone: 'bg-[#C6F6D5]' },
  { key: 'deposit', tone: 'bg-[#C6F6D5]' },
  { key: 'freightCost', tone: 'bg-[#BFDBFE]' },
  { key: 'chargeWeight', tone: 'bg-[#BFDBFE]' },
  { key: 'remark', tone: 'bg-[#BFDBFE]' },
]

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
  const meta = state.detail?.meta || DEFAULT_SALES_META

  const updateOrder = (orderId: string, patch: Partial<SalesLedgerOrder>) => {
    void handlers.updateOrder(orderId, patch)
  }

  const updateLine = (orderId: string, lineIndex: number, patch: Partial<SalesLedgerOrder['lines'][number]>) => {
    void handlers.updateLine(orderId, lineIndex, patch)
  }

  return (
    <section className="min-h-screen w-full bg-[#F8FAFC] p-4 md:p-6">
      <div className="mx-auto w-full max-w-none space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={handlers.handleBack}
              className="mb-3 inline-flex items-center gap-1 text-base font-semibold text-[#0052D9]"
            >
              <ArrowLeft className="size-4" /> 返回概览
            </button>
            <EditableText
              value={meta.pageTitle}
              className="text-left text-3xl font-bold text-[#1E293B]"
              onCommit={(next) => void handlers.updateMeta({ pageTitle: next || DEFAULT_SALES_META.pageTitle })}
            />
            <EditableText
              value={meta.pageHint}
              className="mt-2 text-left text-base text-[#64748B]"
              onCommit={(next) => void handlers.updateMeta({ pageHint: next || DEFAULT_SALES_META.pageHint })}
            />
            <p className="mt-1 text-sm text-[#94A3B8]">
              双击标题或单元格可直接修改。订单金额 = 商品金额 + USD运费。
              {state.detail?.updatedAt
                ? ` · 更新于 ${new Date(state.detail.updatedAt).toLocaleString('zh-CN', { hour12: false })}`
                : ''}
              {state.saving ? ' · 保存中…' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={state.importing || state.saving} onClick={() => sheetRef.current?.click()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {state.importing ? '导入中…' : '导入表格'}
            </Button>
            <Button type="button" variant="outline" disabled={state.importing || state.saving} onClick={() => imageRef.current?.click()}>
              <ImagePlus className="mr-2 h-4 w-4" />
              图片识别
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={state.importing || state.saving || !orders.length}
              onClick={() => void handlers.clearLedger()}
            >
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: '订单数', value: summary?.orderCount },
            { label: '包裹数', value: summary?.shipmentCount },
            { label: '订单金额合计', value: summary?.orderAmountTotal, money: true },
            { label: '商品金额合计', value: summary?.goodsAmountTotal, money: true },
            { label: 'USD运费合计', value: summary?.usdShippingTotal, money: true },
            { label: '定金合计', value: summary?.depositTotal, money: true },
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
          <table className="min-w-[1280px] w-full border-collapse text-base">
            <thead>
              <tr className="text-center text-[#1E293B]">
                {COLUMN_ORDER.map((column) => (
                  <th key={column.key} className={cn('border border-[#CBD5E1] px-2 py-3 font-semibold', column.tone)}>
                    <EditableText
                      value={meta.columns[column.key]}
                      className="font-semibold"
                      onCommit={(next) =>
                        void handlers.updateMeta({
                          columns: {
                            ...meta.columns,
                            [column.key]: next || DEFAULT_SALES_META.columns[column.key],
                          },
                        })
                      }
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-lg text-[#94A3B8]">
                    加载中…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-lg text-[#94A3B8]">
                    还没有数据。请导入表格，或上传业务表截图识别。双击标题也可自定义列名。
                  </td>
                </tr>
              ) : (
                orders.flatMap((order) => {
                  const span = Math.max(1, order.lines.length)
                  return order.lines.map((line, index) => (
                    <tr key={`${order.id}-${index}`} className={cn(index === 0 ? 'border-t-2 border-t-[#94A3B8]' : '')}>
                      {index === 0 ? (
                        <>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-2 py-2 text-center align-middle whitespace-nowrap">
                            <EditableText value={order.dateText} onCommit={(next) => updateOrder(order.id, { dateText: next })} />
                          </td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-2 py-2 text-center align-middle">
                            <EditableText
                              value={order.customerName}
                              className="font-semibold text-[#1E293B]"
                              onCommit={(next) => updateOrder(order.id, { customerName: next })}
                            />
                            <EditableText
                              value={order.phone}
                              className="text-sm text-[#64748B]"
                              placeholder="电话"
                              onCommit={(next) => updateOrder(order.id, { phone: next })}
                            />
                          </td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-2 py-2 text-left align-middle max-w-[280px]">
                            <EditableText
                              value={order.address}
                              multiline
                              className="break-words text-left"
                              onCommit={(next) => updateOrder(order.id, { address: next })}
                            />
                          </td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-2 py-2 text-center align-middle font-bold tabular-nums">
                            <span title="订单金额 = 商品金额 + USD运费">{moneyText(order.orderAmount)}</span>
                          </td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-2 py-2 text-center align-middle font-bold tabular-nums">
                            <EditableText
                              value={order.goodsAmount == null ? '' : String(order.goodsAmount)}
                              display={moneyText(order.goodsAmount)}
                              onCommit={(next) => updateOrder(order.id, { goodsAmount: next.trim() === '' ? null : Number(next) })}
                            />
                          </td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-2 py-2 text-center align-middle font-bold tabular-nums">
                            <EditableText
                              value={order.usdShipping == null ? '' : String(order.usdShipping)}
                              display={moneyText(order.usdShipping)}
                              onCommit={(next) => updateOrder(order.id, { usdShipping: next.trim() === '' ? null : Number(next) })}
                            />
                          </td>
                          <td rowSpan={span} className="border border-[#E2E8F0] px-2 py-2 text-center align-middle font-bold tabular-nums">
                            <EditableText
                              value={order.deposit == null ? '' : String(order.deposit)}
                              display={moneyText(order.deposit)}
                              onCommit={(next) => updateOrder(order.id, { deposit: next.trim() === '' ? null : Number(next) })}
                            />
                          </td>
                        </>
                      ) : null}
                      <td className="border border-[#E2E8F0] px-2 py-2 text-center tabular-nums">
                        <EditableText
                          value={line.freightCost}
                          display={line.freightCost || '—'}
                          onCommit={(next) => updateLine(order.id, index, { freightCost: next })}
                        />
                      </td>
                      <td className="border border-[#E2E8F0] px-2 py-2 text-center tabular-nums">
                        <EditableText
                          value={line.chargeWeight}
                          display={line.chargeWeight || '—'}
                          onCommit={(next) => updateLine(order.id, index, { chargeWeight: next })}
                        />
                      </td>
                      <td className="border border-[#E2E8F0] px-2 py-2 text-center break-all">
                        <EditableText
                          value={line.remark}
                          display={line.remark || '—'}
                          onCommit={(next) => updateLine(order.id, index, { remark: next })}
                        />
                      </td>
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
