'use client'

import { useMemo, useState, useEffect } from 'react'
import { Badge, Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/backend/components/ui'
import type { CalibrateResultItem, SelectOption } from '@/backend/actions/ProductManagement'
import { ChevronDown, ChevronRight, Tags, X } from 'lucide-react'

export type CalibrateDraftItem = {
  id: string
  name: string
  primaryCategoryId: string | null
  linkedCategoryIds: string[]
  /** id → 名称，用于 options 未加载时也能显示一级/二级中文名 */
  categoryNames?: Record<string, string>
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

type CategoryTreeNode = {
  option: SelectOption
  children: CategoryTreeNode[]
}

function plainLabel(label: string) {
  return String(label || '').replace(/^[　└\s]+/, '')
}

function buildCategoryTree(options: SelectOption[]): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>()
  const list = Array.isArray(options) ? options : []
  for (const option of list) {
    nodes.set(option.value, { option, children: [] })
  }

  const roots: CategoryTreeNode[] = []
  for (const option of list) {
    const node = nodes.get(option.value)!
    const parentId = option.parent_id || null
    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

function collectExpandDefaults(
  tree: CategoryTreeNode[],
  linkedIds: string[],
): Set<string> {
  const linked = new Set(linkedIds)
  const expanded = new Set<string>()
  for (const root of tree) {
    const childHit = root.children.some((c) => linked.has(c.option.value))
    if (childHit || linked.has(root.option.value) || root.children.length <= 6) {
      expanded.add(root.option.value)
    }
  }
  // Always expand at least first level-1 with children so UI isn't empty-looking
  if (expanded.size === 0) {
    const firstWithKids = tree.find((n) => n.children.length > 0)
    if (firstWithKids) expanded.add(firstWithKids.option.value)
  }
  return expanded
}

function kindLabel(kind: string) {
  if (kind === 'primary') return '主'
  if (kind === 'brand') return '品牌'
  return '关联'
}

function CategoryPickTree({
  itemId,
  linkedCategoryIds,
  primaryCategoryId,
  categoryOptions,
  onToggleCategory,
}: {
  itemId: string
  linkedCategoryIds: string[]
  primaryCategoryId: string | null
  categoryOptions: SelectOption[]
  onToggleCategory: (itemId: string, categoryId: string, checked: boolean) => void
}) {
  const tree = useMemo(() => buildCategoryTree(categoryOptions), [categoryOptions])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    collectExpandDefaults(tree, linkedCategoryIds),
  )

  useEffect(() => {
    setExpandedIds(collectExpandDefaults(tree, linkedCategoryIds))
    // Reset fold state when options or this draft's links change meaningfully
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seed when tree identity / draft id set changes
  }, [tree, itemId])

  const toggleExpand = (categoryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const expandAll = () => {
    setExpandedIds(new Set(tree.filter((n) => n.children.length > 0).map((n) => n.option.value)))
  }

  const collapseAll = () => setExpandedIds(new Set())

  if (categoryOptions.length === 0) {
    return <span className="text-xs text-slate-400">类目列表加载中…</span>
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          全部可选类目（一级可折叠；勾选即加入）
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            className="text-[10px] text-sky-700 hover:underline"
            onClick={expandAll}
          >
            全部展开
          </button>
          <span className="text-[10px] text-slate-300">|</span>
          <button
            type="button"
            className="text-[10px] text-sky-700 hover:underline"
            onClick={collapseAll}
          >
            全部折叠
          </button>
        </div>
      </div>
      {tree.map((node) => {
        const hasChildren = node.children.length > 0
        const expanded = expandedIds.has(node.option.value)
        const checked = linkedCategoryIds.includes(node.option.value)
        return (
          <div key={node.option.value} className="space-y-0.5">
            <div className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-white/80">
              {hasChildren ? (
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center rounded text-slate-500 hover:bg-slate-200/80"
                  title={expanded ? '折叠二级类目' : '展开二级类目'}
                  onClick={() => toggleExpand(node.option.value)}
                >
                  {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </button>
              ) : (
                <span className="inline-block size-5" />
              )}
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-xs text-slate-800">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => onToggleCategory(itemId, node.option.value, !!v)}
                />
                <span className="truncate font-medium">{plainLabel(node.option.label)}</span>
                {hasChildren ? (
                  <span className="shrink-0 text-[10px] text-slate-400">({node.children.length})</span>
                ) : null}
                {checked && primaryCategoryId === node.option.value ? (
                  <span className="text-[10px] font-semibold text-sky-600">{kindLabel('primary')}</span>
                ) : null}
              </label>
            </div>
            {hasChildren && expanded
              ? node.children.map((child) => {
                  const childChecked = linkedCategoryIds.includes(child.option.value)
                  return (
                    <label
                      key={child.option.value}
                      className="ml-6 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs text-slate-700 hover:bg-white/80"
                    >
                      <span className="w-3 text-slate-300">└</span>
                      <Checkbox
                        checked={childChecked}
                        onCheckedChange={(v) => onToggleCategory(itemId, child.option.value, !!v)}
                      />
                      <span className="truncate">{plainLabel(child.option.label)}</span>
                      {childChecked && primaryCategoryId === child.option.value ? (
                        <span className="text-[10px] font-semibold text-sky-600">{kindLabel('primary')}</span>
                      ) : null}
                    </label>
                  )
                })
              : null}
          </div>
        )
      })}
    </div>
  )
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
  const labelOf = (id: string, item?: CalibrateDraftItem) =>
    item?.categoryNames?.[id] ||
    categoryOptions.find((o) => o.value === id)?.label?.replace(/^[　└\s]+/, '') ||
    id

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
              drafts.map((item) => (
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
                        主：{labelOf(item.primaryCategoryId, item)}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {item.linkedCategoryIds.length === 0 ? (
                      <span className="text-xs text-slate-400">尚未绑定类目</span>
                    ) : (
                      item.linkedCategoryIds.map((cid) => {
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
                            <span>{labelOf(cid, item)}</span>
                            <X
                              className="w-3 h-3 opacity-60 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleCategory(item.id, cid, false)
                              }}
                            />
                          </button>
                        )
                      })
                    )}
                  </div>

                  <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3">
                    <CategoryPickTree
                      itemId={item.id}
                      linkedCategoryIds={item.linkedCategoryIds}
                      primaryCategoryId={item.primaryCategoryId}
                      categoryOptions={categoryOptions}
                      onToggleCategory={onToggleCategory}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row">
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
