/**
 * Simple in-memory login throttle for admin RPC.
 * Per-account lockout after N failures within a window.
 */

type AttemptState = {
  failures: number
  windowStartedAt: number
  lockedUntil: number
}

const attempts = new Map<string, AttemptState>()

const MAX_FAILURES = Number(process.env.ADMIN_LOGIN_MAX_FAILURES || 5)
const WINDOW_MS = Number(process.env.ADMIN_LOGIN_WINDOW_MS || 15 * 60 * 1000)
const LOCK_MS = Number(process.env.ADMIN_LOGIN_LOCK_MS || 15 * 60 * 1000)

function keyFor(account: string): string {
  return String(account || '').trim().toLowerCase()
}

export function assertAdminLoginAllowed(account: string): void {
  const key = keyFor(account)
  if (!key) return
  const now = Date.now()
  const state = attempts.get(key)
  if (!state) return
  if (state.lockedUntil > now) {
    const mins = Math.max(1, Math.ceil((state.lockedUntil - now) / 60000))
    throw new Error(`Too many failed login attempts. Try again in about ${mins} minute(s).`)
  }
  if (now - state.windowStartedAt > WINDOW_MS) {
    attempts.delete(key)
  }
}

export function recordAdminLoginFailure(account: string): void {
  const key = keyFor(account)
  if (!key) return
  const now = Date.now()
  const prev = attempts.get(key)
  if (!prev || now - prev.windowStartedAt > WINDOW_MS) {
    attempts.set(key, { failures: 1, windowStartedAt: now, lockedUntil: 0 })
    return
  }
  const failures = prev.failures + 1
  const lockedUntil = failures >= MAX_FAILURES ? now + LOCK_MS : 0
  attempts.set(key, {
    failures,
    windowStartedAt: prev.windowStartedAt,
    lockedUntil,
  })
}

export function clearAdminLoginFailures(account: string): void {
  attempts.delete(keyFor(account))
}
