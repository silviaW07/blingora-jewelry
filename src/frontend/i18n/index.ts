import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

export const APP_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const

export type AppLocaleCode = (typeof APP_LOCALES)[number]['code']

/** 全站默认 / 降级语言：英文 */
export const DEFAULT_LOCALE: AppLocaleCode = 'en'

export const LOCALE_STORAGE_KEY = 'app_preferred_locale'

/**
 * 统一语言码。店面仅 en / es；历史 zh 偏好映射为 en，避免中文 UI/商品名泄漏。
 */
export function normalizeLocale(raw?: string | null): AppLocaleCode {
  const value = String(raw || '').trim().toLowerCase()
  if (value.startsWith('es')) return 'es'
  if (value.startsWith('en')) return 'en'
  // zh / unknown → English (cross-border storefront)
  return DEFAULT_LOCALE
}

export function getLocaleLabel(code: string) {
  const normalized = normalizeLocale(code)
  return APP_LOCALES.find((item) => item.code === normalized)?.label || 'English'
}

function readLocaleCookie(): string | null {
  if (typeof document === 'undefined') return null
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${LOCALE_STORAGE_KEY}=([^;]*)`),
    )
    return match?.[1] ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

/**
 * 仅读取用户明确保存的语言偏好。
 * 不读取 navigator.language / Accept-Language，避免浏览器中文环境误回退。
 */
export function readStoredLocale(): AppLocaleCode {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (fromStorage) return normalizeLocale(fromStorage)
    const fromCookie = readLocaleCookie()
    if (fromCookie) return normalizeLocale(fromCookie)
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE
}

export function hasStoredLocale(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.localStorage.getItem(LOCALE_STORAGE_KEY)) return true
    return Boolean(readLocaleCookie())
  } catch {
    return false
  }
}

/**
 * 解析应用语言：
 * 1) 本地已保存的用户选择
 * 2) 已登录用户的账户偏好
 * 3) 默认英文
 */
export function resolveAppLocale(options?: {
  preferredLocale?: string | null
  isLoggedIn?: boolean
}): AppLocaleCode {
  if (typeof window !== 'undefined' && hasStoredLocale()) {
    return readStoredLocale()
  }
  if (options?.isLoggedIn && options.preferredLocale) {
    return normalizeLocale(options.preferredLocale)
  }
  return DEFAULT_LOCALE
}

export function persistLocale(code: AppLocaleCode) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code)
    document.cookie = `${LOCALE_STORAGE_KEY}=${encodeURIComponent(code)}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.setAttribute('lang', code)
    // Own i18n already localizes UI — keep Chrome Translate from rewriting React DOM.
    document.documentElement.setAttribute('translate', 'no')
    document.documentElement.classList.add('notranslate')
  } catch {
    // ignore
  }
}

/** 客户端请求商品 API 时读取当前语言参数 */
export function getClientPreferredLang(): AppLocaleCode {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  return resolveAppLocale()
}

const resources = {
  en: { translation: en },
  es: { translation: es },
}

let initialized = false

export function initAppI18n(initialLocale?: string) {
  const lng = normalizeLocale(
    initialLocale ||
      (typeof window !== 'undefined' ? resolveAppLocale() : DEFAULT_LOCALE),
  )
  if (initialized) {
    if (i18n.language !== lng) {
      void i18n.changeLanguage(lng)
    }
    return i18n
  }

  void i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ['en', 'es'],
    // 禁用浏览器语言探测，避免 Accept-Language / navigator 覆盖默认英文
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    returnNull: false,
  })
  initialized = true
  return i18n
}

export default i18n
