/**
 * Append a title suffix only when the title does not already end with it.
 * Used by product list + pending-import batch “批量加后缀”.
 */
export function normalizeTitleSuffix(raw: string | null | undefined): string {
  return String(raw || '').trim()
}

export function titleAlreadyHasSuffix(title: string | null | undefined, suffix: string): boolean {
  const normalizedSuffix = normalizeTitleSuffix(suffix)
  if (!normalizedSuffix) return true
  const current = String(title || '').trimEnd()
  return current.endsWith(normalizedSuffix)
}

/**
 * Returns the next title, or null when unchanged (already has suffix / empty base / empty suffix).
 */
export function appendTitleSuffixIfMissing(
  title: string | null | undefined,
  suffix: string,
): string | null {
  const normalizedSuffix = normalizeTitleSuffix(suffix)
  if (!normalizedSuffix) return null
  const current = String(title || '').trim()
  if (!current) return null
  if (current.endsWith(normalizedSuffix)) return null
  return `${current}${normalizedSuffix}`
}
