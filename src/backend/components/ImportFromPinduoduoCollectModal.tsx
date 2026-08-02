'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useImportFromPinduoduo } from '@/backend/hooks/useImportFromPinduoduo'
import { ImportFromPinduoduoLinkImportPanel } from '@/backend/components/ImportFromPinduoduoLinkImportPanel'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: (taskId: string) => void
}

export function ImportFromPinduoduoCollectModal({ open, onOpenChange, onTaskCreated }: Props) {
  const { state, handlers } = useImportFromPinduoduo({
    onTaskCreated: (taskId) => {
      onOpenChange(false)
      onTaskCreated?.(taskId)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
        <div className="h-2 w-full bg-rose-500" />
        <div className="p-6 sm:p-8 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-header font-bold text-slate-900">
              拼多多多链接采集
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-1 leading-relaxed">
              填写拼多多商品链接、默认分类、加价百分比、默认库存与状态后开始解析；与 1688
              多链接采集相互独立。
            </DialogDescription>
          </DialogHeader>
          <ImportFromPinduoduoLinkImportPanel state={state} handlers={handlers} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImportFromPinduoduoCollectModal
