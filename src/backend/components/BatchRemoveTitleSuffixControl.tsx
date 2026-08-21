'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Check, ChevronsUpDown, Settings2, TextCursorInput, X } from 'lucide-react'
import { toast } from 'sonner'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/backend/components/ui'
import { cn } from '@/lib/utils'
import {
  listSuffixConfigs,
  type SuffixConfigItem,
} from '@/backend/actions/SuffixConfig'

export interface BatchRemoveTitleSuffixControlProps {
  disabled?: boolean
  loading?: boolean
  selectedCount: number
  /** Confirm with selected suffix list; parent runs remove API */
  onConfirm: (suffixes: string[]) => Promise<void> | void
  /** Open shared “管理后缀” from append control’s manage entry if needed — optional callback */
  onManageSuffixes?: () => void
}

/**
 * Shared “批量移除后缀” button + modal for 商品列表 / 待上传区.
 * Same selectable suffix list as “批量加后缀”; removes each chosen tag from title ends.
 */
export function BatchRemoveTitleSuffixControl({
  disabled = false,
  loading = false,
  selectedCount,
  onConfirm,
}: BatchRemoveTitleSuffixControlProps) {
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedSuffixes, setSelectedSuffixes] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [options, setOptions] = useState<SuffixConfigItem[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true)
    try {
      const data = await listSuffixConfigs()
      setOptions(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast.error(err?.message || '获取后缀列表失败')
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void loadOptions()
  }, [open, loadOptions])

  const close = () => {
    if (submitting) return
    setOpen(false)
    setPickerOpen(false)
    setSelectedSuffixes([])
  }

  const toggleSuffix = (value: string) => {
    setSelectedSuffixes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    )
  }

  const removeSuffix = (value: string) => {
    setSelectedSuffixes((prev) => prev.filter((item) => item !== value))
  }

  const handleConfirm = async () => {
    if (selectedSuffixes.length === 0) return
    setSubmitting(true)
    try {
      await onConfirm(selectedSuffixes)
      setOpen(false)
      setPickerOpen(false)
      setSelectedSuffixes([])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-slate-200 shrink-0 min-w-[8.5rem]"
        disabled={disabled || loading || selectedCount <= 0}
        onClick={() => setOpen(true)}
      >
        <TextCursorInput className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
        批量移除后缀
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-[460px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 w-full bg-rose-500" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold text-slate-900">批量移除后缀</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                将从已勾选的 {selectedCount} 项标题末尾移除所选后缀（可多选，与批量移除类目相同：只去掉勾选的项）。标题末尾不含该后缀则跳过。
              </DialogDescription>
            </DialogHeader>
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-bold text-slate-700 block">要移除的后缀</label>
                <Badge variant="outline">已选 {selectedSuffixes.length}</Badge>
              </div>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickerOpen}
                    disabled={submitting}
                    className={cn(
                      'h-auto min-h-11 w-full justify-between px-3 py-2 font-normal',
                      selectedSuffixes.length === 0 && 'text-muted-foreground',
                    )}
                  >
                    <div className="flex flex-1 flex-wrap items-center gap-1.5 text-left">
                      {selectedSuffixes.length === 0 ? (
                        <span>请选择一个或多个后缀</span>
                      ) : (
                        selectedSuffixes.map((value) => (
                          <Badge
                            key={value}
                            variant="secondary"
                            className="gap-1 rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              if (!submitting) removeSuffix(value)
                            }}
                          >
                            {value}
                            <X className="h-3 w-3 opacity-60" />
                          </Badge>
                        ))
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                  <ul className="max-h-56 overflow-y-auto">
                    {optionsLoading ? (
                      <li className="px-2 py-3 text-center text-sm text-slate-400">加载中…</li>
                    ) : options.length === 0 ? (
                      <li className="px-2 py-3 text-center text-sm text-slate-400">
                        暂无后缀，请先在「批量加后缀 → 管理后缀」中新增
                      </li>
                    ) : (
                      options.map((option) => {
                        const checked = selectedSuffixes.includes(option.suffix_name)
                        return (
                          <li key={option.id}>
                            <button
                              type="button"
                              disabled={submitting}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-100',
                                checked && 'bg-rose-50/60',
                              )}
                              onClick={() => toggleSuffix(option.suffix_name)}
                            >
                              <Checkbox
                                checked={checked}
                                className="pointer-events-none"
                                tabIndex={-1}
                                aria-hidden
                              />
                              <span className="flex-1 text-left font-medium text-slate-800">
                                {option.suffix_name}
                              </span>
                              {checked ? <Check className="h-4 w-4 text-rose-600" /> : null}
                            </button>
                          </li>
                        )
                      })
                    )}
                  </ul>
                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <p className="flex items-center gap-2 px-2 py-2 text-xs text-slate-400">
                      <Settings2 className="h-3.5 w-3.5" />
                      后缀选项与「批量加后缀」共用，请在加后缀弹窗内管理
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-slate-400">不会改动类目；仅从标题末尾去掉所选后缀文本。</p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                className="flex-1 h-11 font-medium hover:bg-slate-100"
                onClick={close}
                disabled={submitting}
              >
                取消
              </Button>
              <Button
                className="flex-1 h-11 font-bold bg-rose-600 text-white hover:bg-rose-700"
                onClick={() => void handleConfirm()}
                disabled={submitting || selectedSuffixes.length === 0}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  '确认移除'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
