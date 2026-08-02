'use client'

import React, { useMemo, useState } from 'react'
import { Check, ChevronRight, FolderTree } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/backend/components/ui'
import {
  buildCategoryCascadeTree,
  type CategoryCascadeOption,
} from '@/backend/components/CategoryCascadeSelect'

export interface PendingCategoryOption {
  category_id: string
  category_name: string
  parent_id?: string | null
  level?: number | null
}

interface PendingCategoryTreeDialogProps {
  open: boolean
  title?: string
  options: PendingCategoryOption[]
  selectedId?: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (categoryId: string) => void
  /**
   * Pending / import flows: use cascading L1→L2 panel (选中二级则保存二级).
   * Product Management keep false for full tree picker.
   */
  selectL1Only?: boolean
}

interface TreeNode extends PendingCategoryOption {
  children: TreeNode[]
}

function buildCategoryTree(options: PendingCategoryOption[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const safeOptions = Array.isArray(options) ? options : []
  safeOptions.forEach(option => {
    map.set(option.category_id, { ...option, children: [] })
  })

  const roots: TreeNode[] = []
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const levelDiff = (a.level || 0) - (b.level || 0)
      if (levelDiff !== 0) return levelDiff
      return a.category_name.localeCompare(b.category_name, 'zh-CN')
    })
    nodes.forEach(node => sortNodes(node.children))
  }
  sortNodes(roots)
  return roots
}

function CategoryTreeNodeRow({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  node: TreeNode
  depth: number
  selectedId?: string | null
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const hasChildren = node.children.length > 0
  const expanded = expandedIds.has(node.category_id)
  const selected = selectedId === node.category_id

  return (
    <div>
      <button
        type="button"
        className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
          selected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-slate-50 text-slate-700'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(node.category_id)}
      >
        {hasChildren ? (
          <span
            className="inline-flex h-5 w-5 items-center justify-center text-slate-400"
            onClick={e => {
              e.stopPropagation()
              onToggle(node.category_id)
            }}
          >
            {expanded ? (
              <ChevronRight className="w-4 h-4 rotate-90" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        ) : (
          <span className="inline-flex h-5 w-5" />
        )}
        <FolderTree className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
        <span className="truncate">{node.category_name}</span>
        {typeof node.level === 'number' ? (
          <span className="ml-auto text-[10px] text-slate-400">{node.level}级</span>
        ) : null}
      </button>
      {hasChildren && expanded
        ? node.children.map(child => (
            <CategoryTreeNodeRow
              key={child.category_id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  )
}

/** Cascading L1→L2 panel：选中二级则保存二级，展示二级名；发布时自动挂一级 */
function CascadeL1Panel({
  options,
  draftSelectedId,
  onSelect,
}: {
  options: PendingCategoryOption[]
  draftSelectedId: string
  onSelect: (id: string) => void
}) {
  const tree = useMemo(
    () => buildCategoryCascadeTree(options as CategoryCascadeOption[], { forImportL1: true }),
    [options],
  )
  const [hoveredL1Id, setHoveredL1Id] = useState<string | null>(null)

  const activeL1 = useMemo(() => {
    if (hoveredL1Id) return tree.find(node => node.category_id === hoveredL1Id) || null
    if (draftSelectedId) {
      const selected = options.find(item => item.category_id === draftSelectedId)
      if (selected?.parent_id) {
        return tree.find(node => node.category_id === selected.parent_id) || null
      }
      return tree.find(node => node.category_id === draftSelectedId) || null
    }
    return tree[0] || null
  }, [hoveredL1Id, tree, draftSelectedId, options])

  const handlePick = (categoryId: string) => {
    onSelect(categoryId)
  }

  if (tree.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-400">暂无可用分类</div>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex min-h-[280px] max-h-[420px]">
        <div className="w-[200px] overflow-y-auto border-r py-1">
          {tree.map(node => {
            const isActive = activeL1?.category_id === node.category_id
            const isSelected = draftSelectedId === node.category_id
            return (
              <button
                key={node.category_id}
                type="button"
                className={`flex w-full items-center gap-1 px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                } ${isSelected ? 'font-semibold text-primary' : 'text-slate-700'}`}
                onMouseEnter={() => setHoveredL1Id(node.category_id)}
                onFocus={() => setHoveredL1Id(node.category_id)}
                onClick={() => handlePick(node.category_id)}
              >
                <span className="flex-1 truncate">{node.category_name}</span>
                {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                {node.children.length > 0 ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : null}
              </button>
            )
          })}
        </div>
        <div className="min-w-[220px] flex-1 overflow-y-auto bg-slate-50/60 py-1">
          {activeL1 && activeL1.children.length > 0 ? (
            <>
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {activeL1.category_name} · 细分品类
              </div>
              {activeL1.children.map(child => {
                const isSelected = draftSelectedId === child.category_id
                return (
                  <button
                    key={child.category_id}
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white hover:text-slate-700 ${
                      isSelected ? 'font-semibold text-primary' : 'text-slate-500'
                    }`}
                    onMouseEnter={() => setHoveredL1Id(activeL1.category_id)}
                    onClick={() => handlePick(child.category_id)}
                    title={`选择「${child.category_name}」`}
                  >
                    <span className="flex-1 truncate">{child.category_name}</span>
                    {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                  </button>
                )
              })}
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-xs text-slate-400">
              悬停左侧大类可查看细分品类
            </div>
          )}
        </div>
      </div>
      <div className="border-t bg-slate-50 px-3 py-2 text-[11px] leading-4 text-slate-500">
        选择细分品类，系统将自动归属到对应一级大类。
      </div>
    </div>
  )
}

/** 待上传目标分类：双击后弹出的分类树 / 级联选择弹窗 */
export function PendingCategoryTreeDialog({
  open,
  title = '选择目标分类',
  options,
  selectedId,
  onOpenChange,
  onConfirm,
  selectL1Only = false,
}: PendingCategoryTreeDialogProps) {
  const tree = useMemo(() => buildCategoryTree(options), [options])
  const [draftSelectedId, setDraftSelectedId] = useState<string>(selectedId || '')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    tree.forEach(node => {
      if (node.children.length > 0) initial.add(node.category_id)
    })
    return initial
  })

  React.useEffect(() => {
    if (open) {
      const initialId = selectedId || ''
      setDraftSelectedId(initialId)
      const next = new Set<string>()
      tree.forEach(node => {
        if (node.children.length > 0) next.add(node.category_id)
      })
      if (selectedId) {
        let current = options.find(item => item.category_id === selectedId)
        while (current?.parent_id) {
          next.add(current.parent_id)
          current = options.find(item => item.category_id === current?.parent_id)
        }
      }
      setExpandedIds(next)
    }
  }, [open, selectedId, options, tree, selectL1Only])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelect = (categoryId: string) => {
    setDraftSelectedId(categoryId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={selectL1Only ? 'sm:max-w-[560px]' : 'sm:max-w-[520px]'}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {selectL1Only ? (
          <CascadeL1Panel
            options={options}
            draftSelectedId={draftSelectedId}
            onSelect={setDraftSelectedId}
          />
        ) : (
          <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-white p-2">
            {tree.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">暂无可用分类</div>
            ) : (
              tree.map(node => (
                <CategoryTreeNodeRow
                  key={node.category_id}
                  node={node}
                  depth={0}
                  selectedId={draftSelectedId}
                  expandedIds={expandedIds}
                  onToggle={toggleExpand}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={!draftSelectedId}
            onClick={() => {
              if (!draftSelectedId) return
              onConfirm(draftSelectedId)
            }}
          >
            确认选择
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
