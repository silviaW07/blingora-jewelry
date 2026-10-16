/** Split pasted import URLs, joining hard-wrapped continuations of a single link. */
export function splitPastedImportUrls(raw: string): string[] {
  const lines = String(raw || '')
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const urls: string[] = []
  for (const line of lines) {
    if (/^https?:\/\//i.test(line)) {
      urls.push(line)
      continue
    }
    const prev = urls[urls.length - 1]
    if (prev && /^https?:\/\//i.test(prev) && !/\s/.test(line)) {
      urls[urls.length - 1] = `${prev}${line}`
      continue
    }
    urls.push(line)
  }
  return urls
}
