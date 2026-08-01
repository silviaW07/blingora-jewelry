'use client'

import React, { useEffect, useMemo } from 'react'
import { I18nextProvider } from 'react-i18next'
import { useUserSession } from '@/tools/FrontendSession'
import {
  DEFAULT_LOCALE,
  initAppI18n,
  normalizeLocale,
  persistLocale,
  resolveAppLocale,
  type AppLocaleCode,
} from '@/frontend/i18n'

type Props = {
  children: React.ReactNode
}

export function I18nProvider({ children }: Props) {
  const { preferredLocale, token } = useUserSession()
  const isLoggedIn = Boolean(token?.trim())

  const initial = useMemo(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_LOCALE
    }
    return resolveAppLocale({ preferredLocale, isLoggedIn })
  }, [preferredLocale, isLoggedIn])

  const i18n = useMemo(() => initAppI18n(initial), [initial])

  useEffect(() => {
    const next = resolveAppLocale({ preferredLocale, isLoggedIn })
    // 首次访问写入英文默认，固定缓存，避免后续被浏览器语言干扰
    persistLocale(next)
    if (i18n.language !== next) {
      void i18n.changeLanguage(next)
    }
  }, [i18n, preferredLocale, isLoggedIn])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export function useSwitchAppLocale() {
  const { set: setSession } = useUserSession()
  const i18n = initAppI18n()

  return async (code: string) => {
    const next = normalizeLocale(code) as AppLocaleCode
    persistLocale(next)
    setSession({ preferredLocale: next })
    await i18n.changeLanguage(next)
    if (typeof window !== 'undefined') {
      // 仅派发应用内事件；勿调用旧版 window.__switchLocale（会 location.reload）
      window.dispatchEvent(new CustomEvent('app-locale-changed', { detail: { locale: next } }))
    }
  }
}
