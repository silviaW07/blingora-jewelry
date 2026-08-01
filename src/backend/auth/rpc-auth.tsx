'use client'

import { useRouter } from 'next/navigation'
import { useAdminSession } from '@/tools/BackendSession'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { create } from 'zustand'

/**
 * 登录路由配置
 */
const LOGIN_ROUTE = '/adminlogin'

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

/**
 * 获取 Token
 * 从 AdminSession Store 中获取当前 Token
 */
export function getToken(): string | null {
  const session = useAdminSession.getState()
  return session.token || null
}

/**
 * 清除登录态
 * 重置 AdminSession 状态
 */
export function clearAuth(): void {
  useAdminSession.getState().reset()
}

/**
 * 401 未登录处理
 * 逻辑：清除本地缓存并触发全局弹窗
 */
export function handleUnauthorized(): void {
  clearAuth()
  
  // 如果当前已在登录页，不触发弹窗
  if (typeof window !== 'undefined' && window.location.pathname.includes(LOGIN_ROUTE)) {
    return
  }
  
  useAuthDialog.getState().open()
}

/**
 * 401 Dialog 组件
 * 挂载于后台管理系统的 Root Layout 中
 * 适配 ui_style：使用项目定义的 CSS 变量和圆角规范
 */
export function AuthExpiredDialog() {
  const router = useRouter()
  const { isOpen, close } = useAuthDialog()

  const handleLogin = () => {
    close()
    router.push(LOGIN_ROUTE)
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      {/* 
        样式适配说明：
        - 保持右下角定位 (fixed bottom-4 right-4)
        - 背景色使用 var(--background)
        - 边框使用 var(--border)
        - 阴影使用 var(--shadow-lg)
        - 圆角使用 var(--radius-lg)
      */}
      <DialogContent 
        className="fixed bottom-4 right-4 left-auto top-auto translate-x-0 translate-y-0 w-[380px] max-w-[90vw] border-border bg-background shadow-lg rounded-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">
            初始化登录账号
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            您可以先登录测试账号进行功能体验。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={close}
            className="border-border text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
          >
            稍后再说
          </Button>
          <Button 
            onClick={handleLogin}
            className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            去登录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}