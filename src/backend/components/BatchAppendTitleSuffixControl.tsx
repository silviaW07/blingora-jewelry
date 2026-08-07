'use client'

import React, { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, TextCursorInput, X } from 'lucide-react'
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

/** Preset title suffixes for batch append (order here is display order). */
export const SUFFIX_OPTIONS = ['[13USD]', '[3USD]', '[清仓]', '[特价]', '[新品]'] as const

export interface BatchAppendTitleSuffixControlProps {
  /** Disable when nothing selected / parent busy */
  disabled?: boolean
  loading?: boolean
  selectedCount: number
  /** Confirm with concatenated suffix; parent runs API (server skips if title already ends with it) */
  onConfirm: (suffix: string) => Promise<void> | void
}

/**
 * Shared “批量加后缀” button + modal for 商品列表 / 待上传区.
 */
export function BatchAppendTitleSuffixControl({
  disabled = false,
  loading = false,
  selectedCount,
  onConfirm,
}: BatchAppendTitleSuffixControlProps) {
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  /** Selected suffixes in click order — concatenation follows this order. */
  const [selectedSuffixes, setSelectedSuffixes] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const concatenatedSuffix = useMemo(
    () => selectedSuffixes.join(''),
    [selectedSuffixes],
  )

  const close = () => {
    if (submitting) return
    setOpen(false)
    setPickerOpen(false)
    setSelectedSuffixes([])
  }

  const toggleSuffix = (value: string) => {
    setSelectedSuffixes((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value)
      return [...prev, value]
    })
  }

  const removeSuffix = (value: string) => {
    setSelectedSuffixes((prev) => prev.filter((item) => item !== value))
  }

  const handleConfirm = async () => {
    const next = concatenatedSuffix.trim()
    if (!next) return
    setSubmitting(true)
    try {
      // Parent/API uses appendTitleSuffixIfMissing: skip when title already ends with this full string.
      await onConfirm(next)
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
        className="h-9 border-slate-200"
        disabled={disabled || loading || selectedCount <= 0}
        onClick={() => setOpen(true)}
      >
        <TextCursorInput className="w-4 h-4 mr-2 text-slate-600" />
        批量加后缀
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close()
          else setOpen(true)
        }}
      >
        <DialogContent className="max-w-[460px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold text-slate-900">批量加后缀</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                将为已勾选的 {selectedCount} 项标题末尾追加所选后缀（按选择顺序拼接）。若标题末尾已包含整段拼接结果则跳过。
              </DialogDescription>
            </DialogHeader>
            <div className="mb-6 space-y-2">
              <label className="text-sm font-bold text-slate-700 block">后缀内容</label>
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
                            className="gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
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
                    {SUFFIX_OPTIONS.map((option) => {
                      const checked = selectedSuffixes.includes(option)
                      return (
                        <li key={option}>
                          <button
                            type="button"
                            disabled={submitting}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-100',
                              checked && 'bg-slate-50',
                            )}
                            onClick={() => toggleSuffix(option)}
                          >
                            <Checkbox
                              checked={checked}
                              className="pointer-events-none"
                              tabIndex={-1}
                              aria-hidden
                            />
                            <span className="flex-1 text-left font-medium text-slate-800">{option}</span>
                            {checked ? <Check className="h-4 w-4 text-primary" /> : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </PopoverContent>
              </Popover>
              {concatenatedSuffix ? (
                <p className="text-xs text-slate-500">
                  将追加：<span className="font-semibold text-slate-700">{concatenatedSuffix}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400">不会改动类目；仅修改标题文本。</p>
              )}
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
                className="flex-1 h-11 font-bold bg-primary text-primary-foreground"
                onClick={() => void handleConfirm()}
                disabled={submitting || selectedSuffixes.length === 0}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  '确认追加'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
