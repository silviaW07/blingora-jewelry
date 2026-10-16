'use client'

import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useImportFrom1688 } from '@/backend/hooks/useImportFrom1688'
import { ImportFrom1688LinkImportPanel } from '@/backend/components/ImportFrom1688LinkImportPanel'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 开始解析后的回调（关闭弹窗、切到待上传区并刷新）。提交链接不会立刻解析。 */
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
      handlers.resetCreateUiFlags()
    }
    // 仅在弹窗打开时强制切到 1688 模式，并清掉上次解析卡住的禁用态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <div className="h-2 w-full bg-primary" />
          <div className="p-6 sm:p-8 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-header font-bold text-slate-900">
                1688 多链接采集
              </DialogTitle>
              <DialogDescription className="text-slate-500 pt-1 leading-relaxed">
                粘贴 1688 / 拼多多 / Yupoo / 微购相册链接后先提交，确认无误后再点开始解析。
              </DialogDescription>
            </DialogHeader>
            <ImportFrom1688LinkImportPanel state={state} handlers={handlers} />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={state.feedbackDialog.open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handlers.dismissFeedbackDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle
              className={
                state.feedbackDialog.variant === 'error'
                  ? 'text-destructive'
                  : state.feedbackDialog.variant === 'success'
                    ? 'text-accent-foreground'
                    : ''
              }
            >
              {state.feedbackDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{state.feedbackDialog.description}</p>
                {state.feedbackDialog.details.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-left">
                    {state.feedbackDialog.details.map((detail, index) => (
                      <li key={`${detail}-${index}`}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handlers.dismissFeedbackDialog}>我知道了</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ImportFrom1688CollectModal
