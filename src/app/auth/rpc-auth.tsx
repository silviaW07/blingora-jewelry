'use client'

import { useRouter } from 'next/navigation'
import { useUserSession } from '@/tools/FrontendSession'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { create } from 'zustand'

// 登录路由
const LOGIN_ROUTE = '/applogin'

// 弹窗状态管理
interface AuthDialogState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useAuthDialog = create<AuthDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false })
}))

// 获取 Token
export function getToken(): string | null {
  const session = useUserSession.getState()
  return session.token || null
}

// 清除登录态
export function clearAuth(): void {
  useUserSession.getState().reset()
}

// 401 未登录处理
export function handleUnauthorized(): void {
  clearAuth()
  useAuthDialog.getState().open()
}

// 401 Dialog 组件（在前台 layout 挂载）
export function AuthExpiredDialog() {
  const router = useRouter()
  const { isOpen, close } = useAuthDialog()

  const handleLogin = () => {
    close()
    setTimeout(() => {
      router.push(LOGIN_ROUTE)
    }, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      {/* 底部弹窗(不允许修改弹窗位置，DialogOverlay, DialogPrimitive.Content必须为 absolute 布局，仅修改颜色、圆角) */}
      <DialogOverlay className="absolute bg-black/40" />
      <DialogPrimitive.Content
        className={cn(
          "absolute bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border z-50 p-6 shadow-lg duration-200",
          "bottom-4 left-1/2 -translate-x-1/2"
        )}
      >
        <DialogHeader>
          <DialogTitle>初始化登录账号</DialogTitle>
          <DialogDescription>
            您可以先登录测试账号进行功能体验。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            稍后再说
          </Button>
          <Button onClick={handleLogin}>去登录</Button>
        </DialogFooter>
      </DialogPrimitive.Content>
    </Dialog>
  )
}
