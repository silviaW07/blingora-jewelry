'use client'

import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useImportFrom1688 } from '@/backend/hooks/useImportFrom1688'
import { ImportFrom1688LinkImportPanel } from '@/backend/components/ImportFrom1688LinkImportPanel'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 任务创建并开始解析后的回调（关闭弹窗、切到待上传区并刷新） */
  onTaskCreated?: (taskId: string) => void
}

/**
 * 商品管理区：将原 1688 链接导入核心面板放入模态框，不新写一套表单。
 */
export function ImportFrom1688CollectModal({ open, onOpenChange, onTaskCreated }: Props) {
  const { state, handlers } = useImportFrom1688({
    embedded: true,
    onTaskCreated: (taskId) => {
      onOpenChange(false)
      onTaskCreated?.(taskId)
    },
  })

  useEffect(() => {
    if (open) {
      handlers.setCreationMode('1688')
    }
    // 仅在弹窗打开时强制切到 1688 模式
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
        <div className="h-2 w-full bg-primary" />
        <div className="p-6 sm:p-8 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-header font-bold text-slate-900">
              1688 多链接采集
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-1 leading-relaxed">
              使用与「1688 商品导入工作台」相同的链接导入核心组件：填写链接、默认分类、成本减法、默认库存与状态后开始解析。
            </DialogDescription>
          </DialogHeader>
          <ImportFrom1688LinkImportPanel state={state} handlers={handlers} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImportFrom1688CollectModal
