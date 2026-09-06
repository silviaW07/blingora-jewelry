export type CustomerSessionSnapshot = {
  token: string
  user_id: string
  username: string
  email: string
  preferredLocale: string
  role: 'CUSTOMER'
}

/** Must match storeFactory getTenantKey('UserSession') so Zustand can rehydrate after a hard jump. */
export const ZUSTAND_USER_SESSION_KEY = 'clash Ver_UserSession'
const LS_SESSION = 'sj_customer_session'
const LS_ACCOUNT = 'sj_last_login_account'
const COOKIE_SESSION = 'sj_cust'
const COOKIE_ACCOUNT = 'sj_last_acct'
const MAX_AGE_SEC = 30 * 24 * 60 * 60

function canUseLocalStorage() {
  if (typeof window === 'undefined') return false
  try {
    const key = '__sj_session_probe'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

function cookieSecureSuffix() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
}

function writeCookie(name: string, value: string, maxAge = MAX_AGE_SEC) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${cookieSecureSuffix()}`
}

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const parts = document.cookie ? document.cookie.split(';') : []
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(`${name}=`)) continue
    try {
      return decodeURIComponent(trimmed.slice(name.length + 1))
    } catch {
      return trimmed.slice(name.length + 1)
    }
  }
  return ''
}

function asSnapshot(raw: unknown): CustomerSessionSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const token = String(row.token || '').trim()
  const userId = String(row.user_id || '').trim()
  if (!token || !userId) return null
  return {
    token,
    user_id: userId,
    username: String(row.username || ''),
    email: String(row.email || ''),
    preferredLocale: String(row.preferredLocale || 'en') || 'en',
    role: 'CUSTOMER',
  }
}

function parseSnapshot(text: string): CustomerSessionSnapshot | null {
  const raw = String(text || '').trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { state?: unknown } | Record<string, unknown>
    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      return asSnapshot((parsed as { state?: unknown }).state)
    }
    return asSnapshot(parsed)
  } catch {
    return null
  }
}

/** Write session immediately — do not wait for Zustand persist (mobile navigations abort it). */
export function writeCustomerSession(session: CustomerSessionSnapshot) {
  if (typeof window === 'undefined') return
  const snapshot: CustomerSessionSnapshot = {
    token: String(session.token || '').trim(),
    user_id: String(session.user_id || '').trim(),
    username: String(session.username || ''),
    email: String(session.email || ''),
    preferredLocale: String(session.preferredLocale || 'en') || 'en',
    role: 'CUSTOMER',
  }
  if (!snapshot.token || !snapshot.user_id) return

  const zustandPayload = JSON.stringify({ state: snapshot, version: 0 })
  const slimPayload = JSON.stringify(snapshot)
  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(ZUSTAND_USER_SESSION_KEY, zustandPayload)
      window.localStorage.setItem(LS_SESSION, slimPayload)
    } catch {
      /* private mode / quota */
    }
  }
  try {
    writeCookie(COOKIE_SESSION, slimPayload)
  } catch {
    /* ignore */
  }
}

export function readCustomerSession(): CustomerSessionSnapshot | null {
  if (typeof window === 'undefined') return null
  if (canUseLocalStorage()) {
    try {
      const fromZustand = parseSnapshot(window.localStorage.getItem(ZUSTAND_USER_SESSION_KEY) || '')
      if (fromZustand) return fromZustand
      const fromAlias = parseSnapshot(window.localStorage.getItem(LS_SESSION) || '')
      if (fromAlias) return fromAlias
    } catch {
      /* ignore */
    }
  }
  return parseSnapshot(readCookie(COOKIE_SESSION))
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') return
  if (canUseLocalStorage()) {
    try {
      window.localStorage.removeItem(LS_SESSION)
    } catch {
      /* ignore */
    }
  }
  try {
    writeCookie(COOKIE_SESSION, '', 0)
  } catch {
    /* ignore */
  }
}

export function rememberLoginAccount(account: string) {
  const value = String(account || '').trim()
  if (!value || typeof window === 'undefined') return
  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(LS_ACCOUNT, value)
    } catch {
      /* ignore */
    }
  }
  try {
    writeCookie(COOKIE_ACCOUNT, value)
  } catch {
    /* ignore */
  }
}

export function readRememberedLoginAccount(): string {
  if (typeof window === 'undefined') return ''
  if (canUseLocalStorage()) {
    try {
      const fromLs = String(window.localStorage.getItem(LS_ACCOUNT) || '').trim()
      if (fromLs) return fromLs
    } catch {
      /* ignore */
    }
  }
  return String(readCookie(COOKIE_ACCOUNT) || '').trim()
}
