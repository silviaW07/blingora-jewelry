'use client'

import React from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDecorateMode } from './DecorateContext'

export function DecorateTopBar() {
  const { publishAndExit, exitWithoutPublish } = useDecorateMode()

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-3 border-b border-[#93C5FD] bg-[#EFF6FF]/95 px-4 py-3 shadow-[0_8px_30px_rgba(37,99,235,0.18)] backdrop-blur"
      data-controller-name="可视化装修顶栏"
    >
      <p className="mr-2 hidden text-sm font-medium text-[#1E3A8A] sm:block">
        页面可视化装修中 · 点击浅蓝虚线区域编辑，可在配置条中删除或恢复
      </p>
      <Button
        type="button"
        className="h-10 rounded-full bg-[#2563EB] px-5 text-white hover:bg-[#1D4ED8]"
        onClick={publishAndExit}
      >
        <Check className="mr-2 size-4" />
        发布并退出装修
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-full border-[#93C5FD] bg-white px-4 text-[#1E40AF] hover:bg-[#DBEAFE]"
        onClick={exitWithoutPublish}
      >
        <X className="mr-2 size-4" />
        取消
      </Button>
    </div>
  )
}
