'use client'

import { useEffect } from 'react'
import { useUserSession } from '@/tools/FrontendSession'
import { create } from 'zustand'
import { useOptionalCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext'

// 登录路由：适配参数 login_route
const LOGIN_ROUTE = '/customerlogin'

// 401 触发信号（由 bridge 转发到 CustomerAuthModal）
interface AuthDialogState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useAuthDialog = create<AuthDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
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
 * 逻辑：清除本地缓存并打开统一登录/注册弹窗（CustomerAuthModal）
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
 * 将 401 信号桥接到 CustomerAuthModal。
 * 不再展示底部「初始化登录账号」白底弹窗。
 * Prefer mounting inside CustomerAuthModalProvider; safe no-op if outside.
 */
export function AuthExpiredDialog() {
  const { isOpen, close } = useAuthDialog()
  const authModal = useOptionalCustomerAuthModal()

  useEffect(() => {
    if (!isOpen || !authModal) return
    close()
    authModal.openAuthModal('login')
  }, [isOpen, close, authModal])

  return null
}
