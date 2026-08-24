'use client'

import { useEffect } from 'react'
import { useUserSession } from '@/tools/FrontendSession'
import { create } from 'zustand'

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
 * 401 未登录处理（店面）
 * 只清本地坏 token，绝不自动跳登录/注册页。
 * 游客正常浏览不应被打断；需要登录时由「Login to view price / Cart / Account / Add to cart」等显式入口触发。
 */
export function handleUnauthorized(): void {
  clearAuth()
}

/**
 * 将 401 信号桥接到 CustomerAuthModal。
 * 不再展示底部「初始化登录账号」白底弹窗。
 * Prefer mounting inside CustomerAuthModalProvider; safe no-op if outside.
 */
export function AuthExpiredDialog() {
  const { isOpen, close } = useAuthDialog()

  useEffect(() => {
    // Storefront: never auto-open login/register modal on 401.
    // Explicit entry points (price / cart / account / add-to-cart) open auth themselves.
    if (!isOpen) return
    close()
  }, [isOpen, close])

  return null
}
