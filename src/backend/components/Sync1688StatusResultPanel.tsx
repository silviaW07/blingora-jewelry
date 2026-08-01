'use client'

import React from 'react'
import {
  ArrowDownCircle,
  ExternalLink,
  MessageSquarePlus,
  RefreshCw,
} from 'lucide-react'
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@/backend/components/ui'
import type { Sync1688StatusItem } from '@/backend/actions/ProductManagement'

export type Sync1688PanelBucket = 'delisted' | 'out_of_stock' | 'normal'

interface Sync1688StatusResultPanelProps {
  open: boolean
  syncing: boolean
  applying: boolean
  delisted: Sync1688StatusItem[]
  outOfStock: Sync1688StatusItem[]
  normal: Sync1688StatusItem[]
  unknownCount: number
  skippedCount: number
  selectedIds: string[]
  noteDialogOpen: boolean
  noteDraft: string
  onOpenChange: (open: boolean) => void
  onToggleItem: (productId: string, checked: boolean) => void
  onToggleSection: (bucket: Sync1688PanelBucket, checked: boolean) => void
  onBatchDeactivate: () => void
  onOpenNoteDialog: () => void
  onNoteDialogOpenChange: (open: boolean) => void
  onNoteDraftChange: (value: string) => void
  onSubmitNotes: () => void
  onDefer: () => void
}

function SectionHeader(props: {
  title: string
  count: number
  tone: 'amber' | 'rose' | 'emerald' | 'slate'
  selectable?: boolean
  allSelected?: boolean
  someSelected?: boolean
  onToggleAll?: (checked: boolean) => void
  actions?: React.ReactNode
}) {
  const toneClass =
    props.tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : props.tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-900'
        : props.tone === 'emerald'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-slate-200 bg-slate-50 text-slate-800'

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {props.selectable && (
            <Checkbox
              checked={props.allSelected ? true : props.someSelected ? 'indeterminate' : false}
              onCheckedChange={(checked: boolean) => props.onToggleAll?.(!!checked)}
            />
          )}
          <div>
            <div className="font-header font-bold text-sm">
              {props.title}
              <span className="ml-2 font-mono text-xs opacity-80">({props.count} 件)</span>
            </div>
          </div>
        </div>
        {props.actions}
      </div>
    </div>
  )
}

function ProductRows(props: {
  items: Sync1688StatusItem[]
  selectedIds: string[]
  selectable: boolean
  emptyText: string
  onToggleItem: (productId: string, checked: boolean) => void
}) {
  if (props.items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
        {props.emptyText}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            {props.selectable && <TableHead className="w-12" />}
            <TableHead>商品</TableHead>
            <TableHead className="w-[140px]">编码</TableHead>
            <TableHead className="w-[160px]">供应商</TableHead>
            <TableHead className="w-[100px]">源站</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.items.map((item) => {
            const checked = props.selectedIds.includes(item.product_id)
            return (
              <TableRow key={item.product_id} className="border-slate-100">
                {props.selectable && (
                  <TableCell>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next: boolean) => props.onToggleItem(item.product_id, !!next)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate max-w-[320px]" title={item.product_name}>
                      {item.product_name}
                    </div>
                    {item.reason && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[320px]" title={item.reason}>
                        {item.reason}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">{item.product_code || '--'}</TableCell>
                <TableCell className="text-sm text-slate-600 truncate max-w-[160px]">
                  {item.supplier_name || '--'}
                </TableCell>
                <TableCell>
                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      打开 <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">--</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function Sync1688StatusResultPanel(props: Sync1688StatusResultPanelProps) {
  const actionableSelectedCount = props.selectedIds.filter((id) =>
    [...props.delisted, ...props.outOfStock].some((item) => item.product_id === id)
  ).length

  const delistedAllSelected =
    props.delisted.length > 0 && props.delisted.every((item) => props.selectedIds.includes(item.product_id))
  const delistedSomeSelected =
    !delistedAllSelected && props.delisted.some((item) => props.selectedIds.includes(item.product_id))
  const oosAllSelected =
    props.outOfStock.length > 0 && props.outOfStock.every((item) => props.selectedIds.includes(item.product_id))
  const oosSomeSelected =
    !oosAllSelected && props.outOfStock.some((item) => props.selectedIds.includes(item.product_id))

  const batchActions = (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
        disabled={actionableSelectedCount === 0 || props.applying || props.syncing}
        onClick={props.onBatchDeactivate}
      >
        <ArrowDownCircle className="w-3.5 h-3.5 mr-1.5" />
        批量下架
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 border-slate-300 bg-white hover:bg-slate-100"
        disabled={actionableSelectedCount === 0 || props.applying || props.syncing}
        onClick={props.onOpenNoteDialog}
      >
        <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />
        添加备注
      </Button>
    </div>
  )

  return (
    <>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-none shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-header font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className={`w-5 h-5 text-primary ${props.syncing ? 'animate-spin' : ''}`} />
                1688 状态同步结果
              </DialogTitle>
              <DialogDescription className="text-slate-500 pt-1">
                已下架 {props.delisted.length} 件 · 缺货 {props.outOfStock.length} 件 · 正常 {props.normal.length} 件
                {(props.unknownCount > 0 || props.skippedCount > 0) && (
                  <span className="ml-2 text-slate-400">
                    （未识别 {props.unknownCount} · 跳过 {props.skippedCount}）
                  </span>
                )}
                {actionableSelectedCount > 0 && (
                  <Badge variant="outline" className="ml-2 align-middle">
                    已选 {actionableSelectedCount} 件待处理
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-4 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
            <section className="space-y-2">
              <SectionHeader
                title="已下架商品列表"
                count={props.delisted.length}
                tone="amber"
                selectable={props.delisted.length > 0}
                allSelected={delistedAllSelected}
                someSelected={delistedSomeSelected}
                onToggleAll={(checked) => props.onToggleSection('delisted', checked)}
                actions={props.delisted.length > 0 ? batchActions : undefined}
              />
              <ProductRows
                items={props.delisted}
                selectedIds={props.selectedIds}
                selectable
                emptyText="本次同步未发现 1688 已下架商品"
                onToggleItem={props.onToggleItem}
              />
            </section>

            <section className="space-y-2">
              <SectionHeader
                title="缺货商品列表"
                count={props.outOfStock.length}
                tone="rose"
                selectable={props.outOfStock.length > 0}
                allSelected={oosAllSelected}
                someSelected={oosSomeSelected}
                onToggleAll={(checked) => props.onToggleSection('out_of_stock', checked)}
                actions={props.outOfStock.length > 0 ? batchActions : undefined}
              />
              <ProductRows
                items={props.outOfStock}
                selectedIds={props.selectedIds}
                selectable
                emptyText="本次同步未发现 1688 缺货商品"
                onToggleItem={props.onToggleItem}
              />
            </section>

            <section className="space-y-2">
              <SectionHeader title="正常商品列表" count={props.normal.length} tone="emerald" />
              <ProductRows
                items={props.normal}
                selectedIds={props.selectedIds}
                selectable={false}
                emptyText="本次同步没有判定为正常的商品"
                onToggleItem={props.onToggleItem}
              />
            </section>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 sm:justify-between gap-2">
            <p className="text-xs text-slate-500 self-center">
              稍后处理不会改动商品状态；批量下架会将选中商品设为已下架。
            </p>
            <Button type="button" variant="outline" className="h-10 px-6" onClick={props.onDefer} disabled={props.applying}>
              稍后处理
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={props.noteDialogOpen} onOpenChange={props.onNoteDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-header font-bold">批量添加备注</DialogTitle>
            <DialogDescription>
              将为已选的 {actionableSelectedCount} 件商品追加运营备注（写入 tradeInfo.adminRemark）。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">备注内容</label>
            <Textarea
              className="min-h-[110px] resize-none"
              value={props.noteDraft}
              onChange={(e) => props.onNoteDraftChange(e.target.value)}
              placeholder="例如：2026.07.30 1688 供应商缺货"
            />
            <Input
              readOnly
              className="h-9 text-xs text-slate-500 bg-slate-50"
              value={`将追加到 ${actionableSelectedCount} 件商品`}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => props.onNoteDialogOpenChange(false)} disabled={props.applying}>
              取消
            </Button>
            <Button type="button" onClick={props.onSubmitNotes} disabled={props.applying || !props.noteDraft.trim()}>
              {props.applying ? '提交中...' : '确认添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Sync1688StatusResultPanel
