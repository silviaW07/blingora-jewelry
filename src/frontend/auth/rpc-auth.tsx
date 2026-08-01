'use client'

import { useRouter } from 'next/navigation'
import { useUserSession } from '@/tools/FrontendSession'
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

// 登录路由：适配参数 login_route
const LOGIN_ROUTE = '/customerlogin'

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
 * 适配 session_file 定义的 useUserSession
 */
export function getToken(): string | null {
  const session = useUserSession.getState()
  return session.token || null
}

/**
 * 清除登录态
 * 调用 session_file 中定义的 reset 方法
 */
export function clearAuth(): void {
  useUserSession.getState().reset()
}

/**
 * 401 未登录处理
 * 逻辑：清除本地缓存并触发全局弹窗
 * 注意：如果当前已在登录页，则不弹窗
 */
export function handleUnauthorized(): void {
  clearAuth()
  
  // 已经在登录页，不弹窗（用 includes 兼容 basePath 和尾部斜杠）
  if (typeof window !== 'undefined' && window.location.pathname.includes(LOGIN_ROUTE)) {
    return
  }
  
  useAuthDialog.getState().open()
}

/**
 * 401 Dialog 组件
 * 适配 ui_style：使用 primary (#0052D9), radius (8px), shadow-card-lg
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
      {/* 适配 ui_style: 右下角浮动窗，包含玻璃拟态与工业级边框 */}
      <DialogContent 
        className="fixed bottom-4 right-4 left-auto top-auto translate-x-0 translate-y-0 w-[90vw] max-w-[360px] border-border bg-card shadow-card-lg animate-slide-in-bottom rounded-base"
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-foreground font-header text-lg font-bold tracking-tight">
            初始化登录账号
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-body text-sm leading-relaxed">
            您可以先登录测试账号进行功能体验。
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-row gap-3 sm:justify-end mt-4">
          <Button 
            variant="outline" 
            onClick={close}
            className="flex-1 sm:flex-none border-border text-secondary-foreground hover:bg-secondary hover:text-foreground transition-base rounded-base"
          >
            稍后再说
          </Button>
          <Button 
            onClick={handleLogin}
            className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-glow font-semibold rounded-base"
          >
            去登录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}