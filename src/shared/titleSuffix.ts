/**
 * Append / remove title suffixes.
 * Used by product list + pending-import batch “批量加/移除后缀”.
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

/**
 * Strip selected suffixes from the title end (repeat until none match).
 * Longer suffixes win first so overlapping tags strip cleanly.
 * Returns null when unchanged / empty input.
 */
export function removeTitleSuffixesIfPresent(
  title: string | null | undefined,
  suffixes: string[],
): string | null {
  const targets = Array.from(
    new Set(
      (suffixes || [])
        .map((item) => normalizeTitleSuffix(item))
        .filter(Boolean),
    ),
  ).sort((a, b) => b.length - a.length)
  if (targets.length === 0) return null

  let current = String(title || '').trimEnd()
  if (!current) return null

  let changed = false
  let keepGoing = true
  while (keepGoing) {
    keepGoing = false
    for (const suffix of targets) {
      if (current.endsWith(suffix)) {
        current = current.slice(0, -suffix.length).trimEnd()
        changed = true
        keepGoing = true
        break
      }
    }
  }

  if (!changed) return null
  return current
}
