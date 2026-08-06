'use client'

import React, { useState } from 'react'
import { TextCursorInput } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/backend/components/ui'

export interface BatchAppendTitleSuffixControlProps {
  /** Disable when nothing selected / parent busy */
  disabled?: boolean
  loading?: boolean
  selectedCount: number
  /** Confirm with trimmed suffix; parent runs API */
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
  const [suffix, setSuffix] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const close = () => {
    if (submitting) return
    setOpen(false)
    setSuffix('')
  }

  const handleConfirm = async () => {
    const next = suffix.trim()
    if (!next) return
    setSubmitting(true)
    try {
      await onConfirm(next)
      setOpen(false)
      setSuffix('')
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
                将为已勾选的 {selectedCount} 项标题末尾追加后缀。若标题末尾已包含相同后缀则跳过。
              </DialogDescription>
            </DialogHeader>
            <div className="mb-6 space-y-2">
              <label className="text-sm font-bold text-slate-700 block">后缀内容</label>
              <Input
                className="h-11"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="例如 [13USD] 或 [清仓]"
                disabled={submitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleConfirm()
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-slate-400">不会改动类目；仅修改标题文本。</p>
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
                disabled={submitting || !suffix.trim()}
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
