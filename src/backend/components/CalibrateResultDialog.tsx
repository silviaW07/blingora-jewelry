'use client'

import { Badge, Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/backend/components/ui'
import type { CalibrateResultItem, SelectOption } from '@/backend/actions/ProductManagement'
import { Tags, X } from 'lucide-react'

export type CalibrateDraftItem = {
  id: string
  name: string
  primaryCategoryId: string | null
  linkedCategoryIds: string[]
  brandNormalized: boolean
  weightGrams: number | null
  weightUpdated: boolean
  status: CalibrateResultItem['status']
  message?: string | null
}

type Props = {
  open: boolean
  saving: boolean
  scope: 'product' | 'pending'
  summary: { matched: number; skipped: number; failed: number; total: number } | null
  drafts: CalibrateDraftItem[]
  categoryOptions: SelectOption[]
  onOpenChange: (open: boolean) => void
  onToggleCategory: (itemId: string, categoryId: string, checked: boolean) => void
  onSetPrimary: (itemId: string, categoryId: string) => void
  onSave: () => void
}

function kindLabel(kind: string) {
  if (kind === 'primary') return '主'
  if (kind === 'brand') return '品牌'
  return '关联'
}

export default function CalibrateResultDialog({
  open,
  saving,
  scope,
  summary,
  drafts,
  categoryOptions,
  onOpenChange,
  onToggleCategory,
  onSetPrimary,
  onSave,
}: Props) {
  const labelOf = (id: string) =>
    categoryOptions.find(o => o.value === id)?.label?.replace(/^[　└\s]+/, '') || id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[920px] max-h-[85vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <div className="h-2 w-full bg-sky-500" />
        <div className="p-6 flex flex-col gap-4 min-h-0 flex-1">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-sky-50 text-sky-700">
              <Tags className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              一键校准结果 · {scope === 'pending' ? '待上传' : '商品列表'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-1 leading-relaxed">
              已完成品牌归一、保底重量与类目识别。保存后会写回列表供核对；待上传条目上架时只翻译标题，不再覆盖已校准类目。
            </DialogDescription>
          </DialogHeader>

          {summary ? (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200" variant="outline">
                命中 {summary.matched}
              </Badge>
              <Badge className="bg-slate-50 text-slate-700 border-slate-200" variant="outline">
                跳过 {summary.skipped}
              </Badge>
              <Badge className="bg-rose-50 text-rose-800 border-rose-200" variant="outline">
                失败 {summary.failed}
              </Badge>
              <Badge variant="outline">共 {summary.total}</Badge>
            </div>
          ) : null}

          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            {drafts.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">暂无校准结果</p>
            ) : (
              drafts.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 text-sm leading-snug break-words">
                        {item.name || '（无标题）'}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                        {item.brandNormalized ? (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-800">
                            品牌已归一
                          </Badge>
                        ) : null}
                        {item.weightUpdated ? (
                          <Badge variant="secondary" className="bg-violet-50 text-violet-800">
                            重量 → {item.weightGrams ?? '--'}g
                          </Badge>
                        ) : item.weightGrams != null ? (
                          <Badge variant="outline">重量 {item.weightGrams}g</Badge>
                        ) : null}
                        {item.status === 'skipped' ? (
                          <Badge variant="outline" className="text-slate-500">
                            跳过{item.message ? `：${item.message}` : ''}
                          </Badge>
                        ) : null}
                        {item.status === 'failed' ? (
                          <Badge variant="destructive">{item.message || '失败'}</Badge>
                        ) : null}
                      </div>
                    </div>
                    {item.primaryCategoryId ? (
                      <Badge className="bg-sky-600 text-white shrink-0">
                        主：{labelOf(item.primaryCategoryId)}
                      </Badge>
                    ) : null}
                  </div>

                  {/* 已选类目芯片：点击 × 移除；点击芯片设为主类目 */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.linkedCategoryIds.length === 0 ? (
                      <span className="text-xs text-slate-400">尚未绑定类目</span>
                    ) : (
                      item.linkedCategoryIds.map(cid => {
                        const isPrimary = cid === item.primaryCategoryId
                        return (
                          <button
                            key={cid}
                            type="button"
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                              isPrimary
                                ? 'border-sky-300 bg-sky-50 text-sky-800'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                            title={isPrimary ? '当前主类目' : '点击设为主类目'}
                            onClick={() => onSetPrimary(item.id, cid)}
                          >
                            {isPrimary ? <span className="font-bold">主</span> : null}
                            <span>{labelOf(cid)}</span>
                            <X
                              className="w-3 h-3 opacity-60 hover:opacity-100"
                              onClick={e => {
                                e.stopPropagation()
                                onToggleCategory(item.id, cid, false)
                              }}
                            />
                          </button>
                        )
                      })
                    )}
                  </div>

                  {/* 全量类目勾选：方便补 below3 usd / normal quality 等 */}
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3 max-h-40 overflow-y-auto space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      全部可选类目（勾选即加入）
                    </div>
                    {categoryOptions.length === 0 ? (
                      <span className="text-xs text-slate-400">类目列表加载中…</span>
                    ) : (
                      categoryOptions.map(opt => {
                        const checked = item.linkedCategoryIds.includes(opt.value)
                        return (
                          <label
                            key={opt.value}
                            className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-white/80 rounded px-1 py-0.5"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={v => onToggleCategory(item.id, opt.value, !!v)}
                            />
                            <span className="truncate">{opt.label}</span>
                            {checked && item.primaryCategoryId === opt.value ? (
                              <span className="text-[10px] text-sky-600 font-semibold">{kindLabel('primary')}</span>
                            ) : null}
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" className="flex-1 h-11" onClick={() => onOpenChange(false)} disabled={saving}>
              关闭
            </Button>
            <Button
              className="flex-1 h-11 bg-sky-600 hover:bg-sky-700 text-white"
              onClick={onSave}
              disabled={saving || drafts.length === 0}
            >
              {saving ? '保存中…' : '保存类目修改'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
