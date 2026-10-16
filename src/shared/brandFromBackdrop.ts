export const BACKDROP_BRANDS = ['Tiffany', 'Cartier', 'Tom Ford', 'Hermes', 'Fendi', 'Gucci', 'Louis Vuitton'] as const
export type BackdropBrand = (typeof BACKDROP_BRANDS)[number]

export type BackdropBrandGuess = {
  brand: BackdropBrand
  confidence: number
  scores: Partial<Record<BackdropBrand, number>>
}

const BRAND_ALIASES: Record<BackdropBrand, string[]> = {
  Tiffany: ['Tiffany', 'Tiffany & Co.', 'Tiffany&Co', '蒂芙尼'],
  Cartier: ['Cartier', '卡地亚', '卡地亞'],
  'Tom Ford': ['Tom Ford', 'TOM FORD', '汤姆福特'],
  Hermes: ['Hermes', 'Hermès', '爱马仕', '愛馬仕'],
  Fendi: ['Fendi', '芬迪'],
  Gucci: ['Gucci', '古驰', '古馳'],
  'Louis Vuitton': ['Louis Vuitton', 'LV', '路易威登'],
}

const MIN_SHARE: Record<BackdropBrand, number> = {
  Tiffany: 0.006,
  Cartier: 0.03,
  'Tom Ford': 0.025,
  Hermes: 0.02,
  Fendi: 0.018,
  Gucci: 0.018,
  'Louis Vuitton': 0.035,
}

export function backdropBrandAliases(brand?: string | null): string[] {
  if (!brand) return []
  return BRAND_ALIASES[brand as BackdropBrand] || [brand]
}

export function backdropBrandMatchText(brand?: string | null): string {
  return backdropBrandAliases(brand).join(' ')
}

export function normalizeBrandKey(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, '')
}

export function titleHasBackdropBrand(title: string, brand?: string | null): boolean {
  if (!brand) return false
  const corpus = normalizeBrandKey(title)
  if (!corpus) return false
  return backdropBrandAliases(brand).some((alias) => {
    const token = normalizeBrandKey(alias)
    return Boolean(token) && corpus.includes(token)
  })
}

export function titleHasAnyBackdropBrand(title: string): boolean {
  return BACKDROP_BRANDS.some((brand) => titleHasBackdropBrand(title, brand))
}

export function stripLeadingBackdropBrand(title: string): string {
  let text = String(title || '').trim()
  if (!text) return text
  const aliases = BACKDROP_BRANDS.flatMap((brand) => backdropBrandAliases(brand)).sort(
    (a, b) => b.length - a.length,
  )
  for (const alias of aliases) {
    const token = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matched = text.match(new RegExp(`^${token}\\s+`, 'i'))
    if (matched) return text.slice(matched[0].length).trim()
  }
  return text
}

export function applyBackdropBrandToTitle(title: string, brand?: string | null): string {
  const text = String(title || '').trim()
  if (!text || !brand) return text
  if (titleHasBackdropBrand(text, brand)) return text
  const stripped = stripLeadingBackdropBrand(text)
  return `${brand} ${stripped}`.trim()
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rr) h = ((gg - bb) / delta) % 6
    else if (max === gg) h = (bb - rr) / delta + 2
    else h = (rr - gg) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max }
}

function scorePixel(r: number, g: number, b: number): Partial<Record<BackdropBrand, number>> {
  const { h, s, v } = rgbToHsv(r, g, b)
  const out: Partial<Record<BackdropBrand, number>> = {}
  if (s < 0.08 && v > 0.82) return out
  if (s < 0.07 && v > 0.22 && v < 0.82) return out

  if (h >= 155 && h <= 200 && s >= 0.22 && v >= 0.38 && v <= 0.96) {
    out.Tiffany = 1
  }
  if ((h <= 12 || h >= 348) && s >= 0.42 && v >= 0.28 && v <= 0.9) {
    out.Cartier = 1
  }
  if (h >= 16 && h <= 38 && s >= 0.55 && v >= 0.45 && v <= 0.95) {
    out.Hermes = 1
  }
  if (h >= 44 && h <= 56 && s >= 0.55 && v >= 0.55) {
    out.Fendi = 1
  }
  if (h >= 2 && h <= 32 && s >= 0.2 && s <= 0.68 && v >= 0.1 && v <= 0.42) {
    out['Tom Ford'] = 1
  }
  if (h >= 95 && h <= 155 && s >= 0.22 && v >= 0.14 && v <= 0.58) {
    out.Gucci = 1
  }
  // LV 老花/米色包装：比 Tom Ford 巧克力盒更浅
  if (h >= 26 && h <= 46 && s >= 0.16 && s <= 0.52 && v >= 0.42 && v <= 0.78) {
    out['Louis Vuitton'] = 1
  }
  return out
}

export function scoreBrandFromRgb(
  data: Uint8Array | Buffer,
  width: number,
  height: number,
): BackdropBrandGuess | null {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const scores: Record<BackdropBrand, number> = {
    Tiffany: 0,
    Cartier: 0,
    'Tom Ford': 0,
    Hermes: 0,
    Fendi: 0,
    Gucci: 0,
    'Louis Vuitton': 0,
  }
  let totalWeight = 0
  let colorWeight = 0
  const cx = (w - 1) / 2
  const cy = (h - 1) / 2

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 3
      const r = data[i] || 0
      const g = data[i + 1] || 0
      const b = data[i + 2] || 0
      const nx = cx > 0 ? Math.abs(x - cx) / cx : 1
      const ny = cy > 0 ? Math.abs(y - cy) / cy : 1
      const weight = 0.35 + Math.max(nx, ny) * 1.45
      totalWeight += weight
      const pixel = scorePixel(r, g, b)
      const keys = Object.keys(pixel) as BackdropBrand[]
      if (keys.length) colorWeight += weight
      for (const brand of keys) {
        scores[brand] += weight * (pixel[brand] || 0)
      }
    }
  }

  if (totalWeight <= 0) return null

  if (scores.Gucci > 0 && scores.Cartier > 0 && scores.Gucci >= totalWeight * 0.012 && scores.Cartier >= totalWeight * 0.012) {
    scores.Gucci += scores.Cartier * 0.35
    scores.Cartier *= 0.55
  }
  if (scores['Louis Vuitton'] > 0 && scores['Tom Ford'] > 0) {
    if (scores['Louis Vuitton'] >= scores['Tom Ford']) scores['Tom Ford'] *= 0.45
    else scores['Louis Vuitton'] *= 0.45
  }

  const ranked = (Object.entries(scores) as Array<[BackdropBrand, number]>)
    .map(([brand, value]) => ({ brand, value, share: value / totalWeight }))
    .sort((a, b) => b.value - a.value)
  const top = ranked[0]
  const second = ranked[1]
  if (!top || top.value <= 0) return null
  if (top.share < MIN_SHARE[top.brand]) return null
  if (second && second.value > 0 && top.value < second.value * 1.45) return null
  if (colorWeight > 0 && top.value / colorWeight < 0.12 && top.brand !== 'Tiffany') return null

  return {
    brand: top.brand,
    confidence: Math.min(1, top.share * 8),
    scores: Object.fromEntries(ranked.filter((row) => row.value > 0).map((row) => [row.brand, Number(row.share.toFixed(4))])),
  }
}

const BOX_BRAND_WEIGHT: Record<BackdropBrand, number> = {
  Tiffany: 3,
  Cartier: 3,
  Hermes: 2.6,
  'Tom Ford': 2.3,
  Fendi: 1.1,
  Gucci: 0.7,
  'Louis Vuitton': 0.7,
}

export function pickVotedBackdropBrand(guesses: BackdropBrandGuess[]): BackdropBrand | null {
  if (!guesses.length) return null
  const earlyBox = guesses.slice(0, 2).filter((guess) => BOX_BRAND_WEIGHT[guess.brand] >= 2.3 && guess.confidence >= 0.75)
  if (earlyBox.length >= 1 && earlyBox.every((guess) => guess.brand === earlyBox[0].brand)) {
    return earlyBox[0].brand
  }
  const votes = new Map<BackdropBrand, number>()
  const bestConfidence = new Map<BackdropBrand, number>()
  for (const guess of guesses) {
    const weight = BOX_BRAND_WEIGHT[guess.brand] || 1
    votes.set(guess.brand, (votes.get(guess.brand) || 0) + Math.max(0.15, guess.confidence) * weight)
    bestConfidence.set(guess.brand, Math.max(bestConfidence.get(guess.brand) || 0, guess.confidence))
  }
  const ranked = Array.from(votes.entries()).sort((a, b) => b[1] - a[1])
  const top = ranked[0]
  if (!top) return null
  if (ranked[1] && top[1] < ranked[1][1] * 1.2) {
    const topConf = bestConfidence.get(top[0]) || 0
    if (topConf >= 0.35 && top[1] >= ranked[1][1]) return top[0]
    const strongest = [...guesses].sort((a, b) => b.confidence - a.confidence)[0]
    if (strongest && strongest.confidence >= 0.45 && BOX_BRAND_WEIGHT[strongest.brand] >= 2.3) {
      return strongest.brand
    }
    return null
  }
  return top[0]
}
