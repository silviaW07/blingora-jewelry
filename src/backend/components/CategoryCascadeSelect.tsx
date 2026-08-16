'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { isAggregatePricingCategoryName } from '@/shared/categoryPricing'

export interface CategoryCascadeOption {
  category_id: string
  category_name: string
  parent_id?: string | null
  level?: number | null
  parent_name?: string | null
}

export interface CategoryCascadeNode extends CategoryCascadeOption {
  children: CategoryCascadeNode[]
}

export type BuildCategoryCascadeTreeConfig = {
  /**
   * 1688 导入 / 待上传「大类归属」：
   * - 无父级（或父级不在 ACTIVE 列表里）一律作为一级展示，避免 Shoes 等因 level 脏数据消失
   * - 仅剔除每日上新等聚合货架
   * - 例外保留 In stock / 现货
   */
  forImportL1?: boolean
}

const isEmptyParentId = (parentId?: string | null) => {
  if (parentId == null) return true
  const text = String(parentId).trim()
  return text === '' || text === '0'
}

/** 现货状态一级类目：即使无二级子类也保留可选 */
export const isImportPreservedL1CategoryName = (name?: string | null) => {
  const normalized = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  if (!normalized) return false
  return (
    normalized === 'in stock' ||
    normalized === 'instock' ||
    normalized === '现货' ||
    normalized === 'in-stock'
  )
}

const isTrueLevel1 = (node: CategoryCascadeOption) => Number(node.level) === 1

const normalizeCategoryQuery = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const categoryNameMatchesQuery = (name: string, query: string) =>
  normalizeCategoryQuery(name).includes(query)

/** Build L1 roots with L2 children from flat ACTIVE category options. */
export function buildCategoryCascadeTree(
  options: CategoryCascadeOption[],
  config?: BuildCategoryCascadeTreeConfig,
): CategoryCascadeNode[] {
  const forImportL1 = config?.forImportL1 ?? true
  const map = new Map<string, CategoryCascadeNode>()
  const safeOptions = Array.isArray(options) ? options : []
  safeOptions.forEach(option => {
    map.set(option.category_id, { ...option, children: [] })
  })

  const roots: CategoryCascadeNode[] = []
  map.forEach(node => {
    // 有合法父级 → 挂到父节点下（二级展开用）
    if (!isEmptyParentId(node.parent_id) && node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
      return
    }

    if (forImportL1) {
      // 父级缺失或未激活时仍作为一级，避免整条类目从下拉里消失
      if (isAggregatePricingCategoryName(node.category_name)) return
      roots.push(node)
      return
    }

    // 非导入模式：保持宽松挂载（商品管理等）
    if (isTrueLevel1(node) || isEmptyParentId(node.parent_id)) {
      roots.push(node)
    }
  })

  const filteredRoots = forImportL1
    ? roots.filter(node => {
        if (isAggregatePricingCategoryName(node.category_name)) return false
        return true
      })
    : roots

  const sortNodes = (nodes: CategoryCascadeNode[]) => {
    nodes.sort((a, b) => a.category_name.localeCompare(b.category_name, 'zh-CN'))
    nodes.forEach(node => sortNodes(node.children))
  }
  sortNodes(filteredRoots)
  return filteredRoots
}

/** Resolve display name for a selected category id. */
export function getCategoryCascadeLabel(
  options: CategoryCascadeOption[],
  value?: string | null,
): string {
  if (!value) return ''
  const safeOptions = Array.isArray(options) ? options : []
  const selected = safeOptions.find(item => item.category_id === value)
  if (!selected) return ''
  return selected.category_name
}

/** If id is L2, return its parent L1 id; otherwise return id. */
export function resolveToL1CategoryId(
  options: CategoryCascadeOption[],
  categoryId: string,
): string {
  const safeOptions = Array.isArray(options) ? options : []
  const selected = safeOptions.find(item => item.category_id === categoryId)
  if (!selected) return categoryId
  const isL2 = selected.level === 2 || (!!selected.parent_id && selected.level !== 1)
  if (isL2 && selected.parent_id) return selected.parent_id
  return categoryId
}

interface CategoryCascadeSelectProps {
  options: CategoryCascadeOption[]
  value?: string | null
  onValueChange: (categoryId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  /**
   * @deprecated 导入流程已改为直接选二级；保留兼容旧调用。
   * true = 只存一级；false = 选中二级则存二级 id（展示二级名，发布时自动挂一级）。
   */
  selectL1Only?: boolean
}

/**
 * Cascading category picker: L1 list first; hover/click expands L2 to the right.
 * Used by 1688 import modal and pending-upload category fields.
 */
export function CategoryCascadeSelect({
  options,
  value,
  onValueChange,
  placeholder = '选择分类',
  disabled = false,
  className,
  triggerClassName,
  selectL1Only = false,
}: CategoryCascadeSelectProps) {
  const [open, setOpen] = useState(false)
  const [hoveredL1Id, setHoveredL1Id] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [l1CanScroll, setL1CanScroll] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const l1ListRef = useRef<HTMLDivElement>(null)
  const safeOptions = Array.isArray(options) ? options : []

  const tree = useMemo(
    () => buildCategoryCascadeTree(safeOptions, { forImportL1: true }),
    [safeOptions],
  )
  const visibleTree = useMemo(() => {
    const query = normalizeCategoryQuery(searchQuery)
    if (!query) return tree
    return tree.flatMap(node => {
      const l1Hit = categoryNameMatchesQuery(node.category_name, query)
      const matchedChildren = node.children.filter(child =>
        categoryNameMatchesQuery(child.category_name, query),
      )
      if (l1Hit) return [node]
      if (matchedChildren.length > 0) return [{ ...node, children: matchedChildren }]
      return []
    })
  }, [tree, searchQuery])
  const selectedLabel = useMemo(() => getCategoryCascadeLabel(safeOptions, value), [safeOptions, value])

  useEffect(() => {
    if (!open) setSearchQuery('')
  }, [open])

  useEffect(() => {
    if (!open) {
      setL1CanScroll(false)
      return
    }
    const el = l1ListRef.current
    if (!el) return
    const check = () => setL1CanScroll(el.scrollHeight > el.clientHeight + 4)
    check()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [open, visibleTree])

  const activeL1 = useMemo(() => {
    if (hoveredL1Id) return visibleTree.find(node => node.category_id === hoveredL1Id) || null
    if (value) {
      const selected = safeOptions.find(item => item.category_id === value)
      if (selected?.parent_id) {
        return visibleTree.find(node => node.category_id === selected.parent_id) || null
      }
      return visibleTree.find(node => node.category_id === value) || null
    }
    return visibleTree[0] || null
  }, [hoveredL1Id, visibleTree, value, safeOptions])

  const handleSelect = (categoryId: string) => {
    const nextId = selectL1Only ? resolveToL1CategoryId(safeOptions, categoryId) : categoryId
    onValueChange(nextId)
    setOpen(false)
    setHoveredL1Id(null)
  }

  return (
    <Popover
      modal
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) {
          setHoveredL1Id(null)
          setSearchQuery('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between font-normal',
            !selectedLabel && 'text-muted-foreground',
            triggerClassName,
          )}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        collisionPadding={16}
        className={cn('z-[70] w-auto p-0 overflow-hidden', className)}
        onOpenAutoFocus={e => {
          e.preventDefault()
          searchInputRef.current?.focus()
        }}
        onWheel={e => e.stopPropagation()}
      >
        {tree.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">暂无可用分类</div>
        ) : (
          <div className="flex max-h-[min(70vh,560px)] min-h-[280px] flex-col">
            <div className="border-b p-2">
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setHoveredL1Id(null)
                }}
                placeholder="搜索 Shoes / jewelry / 二级类目"
                className="h-8"
              />
              <div className="mt-1.5 px-0.5 text-[11px] text-muted-foreground">
                一级类目 {visibleTree.length}/{tree.length} 个
                {l1CanScroll ? ' · 左侧列表可向下滚动' : ''}
              </div>
            </div>
            <div className="flex min-h-0 flex-1">
            <div
              ref={l1ListRef}
              className="w-[200px] overflow-y-auto border-r bg-background py-1 [scrollbar-gutter:stable]"
              onWheel={e => e.stopPropagation()}
            >
              {visibleTree.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">无匹配分类</div>
              ) : visibleTree.map(node => {
                const isActive = activeL1?.category_id === node.category_id
                const isSelected = value === node.category_id
                const hasChildren = node.children.length > 0
                return (
                  <button
                    key={node.category_id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-1 px-3 py-2 text-left text-sm transition-colors',
                      isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60',
                      isSelected && 'font-semibold text-primary',
                    )}
                    onMouseEnter={() => setHoveredL1Id(node.category_id)}
                    onFocus={() => setHoveredL1Id(node.category_id)}
                    onClick={() => handleSelect(node.category_id)}
                  >
                    <span className="flex-1 truncate">{node.category_name}</span>
                    {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                    {hasChildren ? <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" /> : null}
                  </button>
                )
              })}
            </div>
            {activeL1 && activeL1.children.length > 0 ? (
              <div
                className="w-[220px] overflow-y-auto bg-muted/20 py-1"
                onWheel={e => e.stopPropagation()}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {activeL1.category_name} · 细分品类 {activeL1.children.length}
                </div>
                {activeL1.children.map(child => {
                  const isSelected = value === child.category_id
                  return (
                    <button
                      key={child.category_id}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-1 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/70',
                        isSelected && 'font-semibold text-primary',
                      )}
                      onMouseEnter={() => setHoveredL1Id(activeL1.category_id)}
                      onClick={() => handleSelect(child.category_id)}
                      title={`选择「${child.category_name}」`}
                    >
                      <span className="flex-1 truncate">{child.category_name}</span>
                      {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex w-[160px] items-center justify-center px-3 text-xs text-muted-foreground">
                暂无下级分类
              </div>
            )}
            </div>
          </div>
        )}
        <div className="border-t bg-muted/30 px-3 py-2 text-[11px] leading-4 text-muted-foreground">
          {l1CanScroll ? '左侧可滚动查看全部一级类目。' : ''}
          也可直接搜索。选择细分品类后，系统将自动归属到对应一级大类。
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default CategoryCascadeSelect
