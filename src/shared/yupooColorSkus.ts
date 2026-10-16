export type YupooColorSkuGroup = {
  label: string
  imageUrl: string
  extraImageUrls: string[]
}

const COLOR_WORDS: Array<{ match: RegExp; label: string }> = [
  { match: /象牙白|米白|奶白|白色|白/i, label: '白色' },
  { match: /黑色|黑/i, label: '黑色' },
  { match: /玳瑁|琥珀|花纹/i, label: '玳瑁' },
  { match: /咖啡|棕色|褐色|棕/i, label: '棕色' },
  { match: /金色|金/i, label: '金色' },
  { match: /银色|银/i, label: '银色' },
  { match: /灰色|灰/i, label: '灰色' },
  { match: /橙色|橘色|橙|橘/i, label: '橙色' },
  { match: /红色|红/i, label: '红色' },
  { match: /粉色|粉/i, label: '粉色' },
  { match: /蓝色|蓝/i, label: '蓝色' },
  { match: /绿色|绿/i, label: '绿色' },
  { match: /米色|杏|卡其/i, label: '米色' },
]

const CN_COLOR_COUNT: Record<string, number> = {
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
}

/** 标题写「9色」时用该数；否则图多色少按约每两张一色（17 张 → 9）。 */
export function inferYupooColorSkuCount(title: string | null | undefined, imageCount: number): number {
  const n = Math.max(0, imageCount)
  if (n <= 1) return n
  const text = String(title || '')
  const digits = text.match(/(\d{1,2})\s*色/)
  if (digits) {
    const count = Number(digits[1])
    if (Number.isFinite(count) && count >= 2 && count <= n) return count
  }
  const word = text.match(/([二两三四五六七八九十])\s*色/)
  if (word) {
    const count = CN_COLOR_COUNT[word[1]]
    if (count && count >= 2 && count <= n) return count
  }
  if (n < 4) return 1
  return Math.min(n, Math.max(2, Math.round(n / 2)))
}

export function colorLabelFromPhotoTitle(title?: string | null): string | null {
  const text = String(title || '').trim()
  if (!text || /jpeg|png|jpg|webp|img_|image/i.test(text)) return null
  for (const row of COLOR_WORDS) {
    if (row.match.test(text)) return row.label
  }
  return null
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

function isGoldHardwarePixel(h: number, s: number, v: number): boolean {
  return h >= 32 && h <= 58 && s >= 0.28 && v >= 0.4 && v <= 0.88
}

export function nameProductColorFromRgb(r: number, g: number, b: number): string {
  const { h, s, v } = rgbToHsv(r, g, b)
  if (v < 0.38 && s < 0.22) return '黑色'
  if (v >= 0.84 && s < 0.08) return '白色'
  if (v >= 0.68 && s < 0.22 && h >= 14 && h <= 70) return '米色'
  if (v >= 0.58 && s < 0.20 && h >= 16 && h <= 58) return '米色'
  if (v >= 0.74 && s < 0.12) return '白色'
  if (s < 0.10 && v >= 0.42 && v < 0.72) return v >= 0.62 ? '银色' : '灰色'
  if (h >= 190 && h <= 250 && s >= 0.10 && s < 0.28 && v >= 0.32 && v <= 0.72) {
    return v < 0.48 && s >= 0.16 ? '蓝色' : '灰色'
  }
  // 明亮的橙色皮革不能归为红色；爱马仕橙常落在 h=14–30。
  if (h >= 14 && h <= 36 && s >= 0.38 && v > 0.58) return '橙色'
  if ((h <= 14 || h >= 348) && s >= 0.38 && v >= 0.22 && v <= 0.78) return '红色'
  if ((h <= 26 || h >= 318) && s >= 0.12 && s < 0.38 && v >= 0.50) return '粉色'
  if (h >= 300 && h <= 350 && s > 0.14 && v > 0.42) return '粉色'
  if ((h <= 28 || h >= 340) && s >= 0.28 && v >= 0.22 && v <= 0.82) return '红色'
  if (h >= 85 && h <= 165 && s > 0.25) return '绿色'
  if (h >= 185 && h <= 255 && s > 0.22) return '蓝色'
  if (h >= 42 && h <= 58 && s > 0.4 && v > 0.45) return '金色'
  if (h >= 12 && h <= 40 && s >= 0.30 && v >= 0.20 && v < 0.56) return '棕色'
  if (h >= 16 && h <= 38 && s >= 0.45 && v >= 0.22 && v <= 0.62) return '棕色'
  if (h >= 20 && h <= 50 && s > 0.30 && v >= 0.20 && v < 0.42) return '玳瑁'
  if (h >= 22 && h <= 55 && s <= 0.28 && v > 0.52) return '米色'
  return '其他'
}

/**
 * 棚拍色卡：取中下部产品区。黑像素够多就是黑色；
 * 否则用有饱和度的像素，避免米色地板把红/粉/白冲成同一个色。
 */
export function sampleStudioProductRgb(
  data: Uint8Array | Buffer,
  width: number,
  height: number,
): { r: number; g: number; b: number } | null {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const x0 = Math.floor(w * 0.28)
  const x1 = Math.max(x0 + 1, Math.ceil(w * 0.72))
  const y0 = Math.floor(h * 0.30)
  const y1 = Math.max(y0 + 1, Math.ceil(h * 0.70))
  const box = Math.max(1, (x1 - x0) * (y1 - y0))
  let darkR = 0
  let darkG = 0
  let darkB = 0
  let darkN = 0
  let paleR = 0
  let paleG = 0
  let paleB = 0
  let paleN = 0
  let chromaR = 0
  let chromaG = 0
  let chromaB = 0
  let chromaN = 0
  let allR = 0
  let allG = 0
  let allB = 0
  let allN = 0
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * w + x) * 3
      const r = data[i] || 0
      const g = data[i + 1] || 0
      const b = data[i + 2] || 0
      const { h, s, v } = rgbToHsv(r, g, b)
      if (v > 0.91 && s < 0.1) continue
      if (isGoldHardwarePixel(h, s, v)) continue
      allR += r
      allG += g
      allB += b
      allN += 1
      if (v < 0.34 && s < 0.28) {
        darkR += r
        darkG += g
        darkB += b
        darkN += 1
        continue
      }
      if (v >= 0.52 && s <= 0.22) {
        paleR += r
        paleG += g
        paleB += b
        paleN += 1
        continue
      }
      if (s >= 0.2 && v <= 0.85) {
        chromaR += r
        chromaG += g
        chromaB += b
        chromaN += 1
      }
    }
  }
  const darkRatio = darkN / box
  const paleRatio = paleN / box
  const chromaRatio = chromaN / box
  const chromaSat = chromaN ? rgbToHsv(chromaR / chromaN, chromaG / chromaN, chromaB / chromaN).s : 0
  const chromaHue = chromaN ? rgbToHsv(chromaR / chromaN, chromaG / chromaN, chromaB / chromaN).h : 0
  const chromaIsAccent =
    chromaSat >= 0.36 ||
    ((chromaHue <= 26 || chromaHue >= 318) && chromaSat >= 0.26 && chromaRatio >= 0.15)
  if (darkN >= 12 && darkRatio >= 0.16 && darkRatio >= paleRatio * 0.55) {
    return { r: darkR / darkN, g: darkG / darkN, b: darkB / darkN }
  }
  if (
    chromaN >= 12 &&
    chromaRatio >= 0.12 &&
    chromaIsAccent &&
    (paleRatio < 0.55 || chromaSat >= 0.45 || chromaRatio >= paleRatio)
  ) {
    return { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN }
  }
  if (paleN >= 12 && paleRatio >= 0.22) {
    return { r: paleR / paleN, g: paleG / paleN, b: paleB / paleN }
  }
  if (chromaN >= 12) return { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN }
  if (allN < 12) return null
  return { r: allR / allN, g: allG / allN, b: allB / allN }
}

export function maxPairwiseRgbDistance(samples: Array<{ r: number; g: number; b: number }>): number {
  let max = 0
  for (let i = 0; i < samples.length; i += 1) {
    for (let j = i + 1; j < samples.length; j += 1) {
      if (samples[i].r < 0 || samples[j].r < 0) continue
      max = Math.max(max, rgbDistance(samples[i], samples[j]))
    }
  }
  return max
}

export function rgbDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
}

/** 礼盒/背景色（蒂芙尼蓝、卡地亚红等），不算新的产品色。 */
export function looksLikePackagingRgb(r: number, g: number, b: number): boolean {
  const { h, s, v } = rgbToHsv(r, g, b)
  if (s < 0.28 || v < 0.28) return false
  if (h >= 155 && h <= 205) return true
  if (h <= 14 || h >= 348) return true
  if (h >= 18 && h <= 42 && s > 0.58 && v > 0.4) return true
  if (h >= 42 && h <= 62 && s > 0.5 && v > 0.45) return true
  return false
}

/** 工作室礼盒像素：蒂芙尼蓝 / 卡地亚红 / 爱马仕橙 / 汤姆福特棕 / 芬迪黄。不含 Gucci 绿、LV 米色，避免把商品本身判成礼盒。 */
export function isStudioBoxPixel(r: number, g: number, b: number): boolean {
  const { h, s, v } = rgbToHsv(r, g, b)
  if (v > 0.92 && s < 0.1) return false
  if (h >= 155 && h <= 205 && s >= 0.18 && v >= 0.35 && v <= 0.96) return true
  if ((h <= 14 || h >= 346) && s >= 0.38 && v >= 0.25 && v <= 0.92) return true
  if (h >= 16 && h <= 40 && s >= 0.5 && v >= 0.4 && v <= 0.95) return true
  if (h >= 8 && h <= 36 && s >= 0.22 && s <= 0.7 && v >= 0.08 && v <= 0.42) return true
  if (h >= 42 && h <= 58 && s >= 0.5 && v >= 0.5) return true
  return false
}

export function measureBoxPackShare(
  data: Uint8Array | Buffer,
  width: number,
  height: number,
): { lower: number; upper: number; packShot: boolean } {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const splitY = Math.floor(h * 0.38)
  let lowerBox = 0
  let lowerN = 0
  let upperBox = 0
  let upperN = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 3
      const box = isStudioBoxPixel(data[i] || 0, data[i + 1] || 0, data[i + 2] || 0)
      if (y >= splitY) {
        lowerN += 1
        if (box) lowerBox += 1
      } else {
        upperN += 1
        if (box) upperBox += 1
      }
    }
  }
  const lower = lowerN ? lowerBox / lowerN : 0
  const upper = upperN ? upperBox / upperN : 0
  const packShot = lower >= 0.18 && lower >= Math.max(upper * 2.4, 0.16)
  return { lower, upper, packShot }
}

/** 礼帽剪影、默认头像这类转存失败的小图，不能当商品图。 */
export function isTinyPlaceholderImage(
  byteLength: number,
  width?: number | null,
  height?: number | null,
): boolean {
  if (!Number.isFinite(byteLength) || byteLength <= 0) return false
  if (byteLength < 8000) return true
  const w = Number(width) || 0
  const h = Number(height) || 0
  return byteLength < 24000 && w > 0 && h > 0 && Math.max(w, h) <= 220
}

/**
 * 白底剪影 / 礼帽小胡子这类矢量占位图：大面积白底 + 少量黑墨 + 几乎没有照片中间调。
 * 不能当颜色代表图，否则会被认成「灰色」并开出假 SKU。
 */
export function looksLikeIconSilhouette(
  data: Uint8Array | Buffer,
  width: number,
  height: number,
): boolean {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const n = w * h
  if (n < 16) return true
  let white = 0
  let ink = 0
  let photo = 0
  const buckets = new Uint8Array(512)
  let unique = 0
  for (let i = 0; i < n; i += 1) {
    const offset = i * 3
    const r = data[offset] || 0
    const g = data[offset + 1] || 0
    const b = data[offset + 2] || 0
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const sat = max === 0 ? 0 : (max - min) / max
    const val = max / 255
    if (val >= 0.88 && sat < 0.14) white += 1
    else if (val <= 0.32 && sat < 0.28) ink += 1
    else photo += 1
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
    if (!buckets[key]) {
      buckets[key] = 1
      unique += 1
    }
  }
  const whiteRatio = white / n
  const inkRatio = ink / n
  const photoRatio = photo / n
  if (whiteRatio >= 0.7 && inkRatio >= 0.03 && inkRatio <= 0.26 && photoRatio <= 0.16 && unique <= 24) {
    return true
  }
  if (photoRatio <= 0.08 && unique <= 10 && whiteRatio >= 0.55) return true
  return false
}

/** 一张图里有几件货：全家福/多件合照通常 ≥4 个色块，单款只有 1～2 块。 */
export function measureProductClusters(
  data: Uint8Array | Buffer,
  width: number,
  height: number,
): { objects: number; groupShot: boolean } {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 3
      const r = data[i] || 0
      const g = data[i + 1] || 0
      const b = data[i + 2] || 0
      const { s, v } = rgbToHsv(r, g, b)
      const white = v > 0.88 && s < 0.14
      if (white || v < 0.07 || isStudioBoxPixel(r, g, b)) continue
      mask[y * w + x] = 1
    }
  }
  const seen = new Uint8Array(w * h)
  const areas: number[] = []
  const dirs = [1, -1, w, -w]
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) continue
    let area = 0
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const cur = stack.pop() as number
      area += 1
      const cx = cur % w
      for (const delta of dirs) {
        const next = cur + delta
        if (next < 0 || next >= mask.length || seen[next] || !mask[next]) continue
        if (delta === 1 && cx === w - 1) continue
        if (delta === -1 && cx === 0) continue
        seen[next] = 1
        stack.push(next)
      }
    }
    if (area >= 10) areas.push(area)
  }
  const total = areas.reduce((sum, value) => sum + value, 0)
  const largest = areas.length ? Math.max(...areas) : 0
  const significant = areas.filter((area) => area >= Math.max(24, total * 0.14))
  const groupShot =
    significant.length >= 3 && total > 0 && largest / total < 0.5
  return { objects: significant.length, groupShot }
}

export type YupooImageColorSample = {
  url: string
  r: number
  g: number
  b: number
  packaging: boolean
  packShot?: boolean
  packShare?: number
  groupShot?: boolean
  iconLike?: boolean
  detailShot?: boolean
  fillRatio?: number
  metalRatio?: number
  borderWhite?: number
  label: string | null
}

/** 五金/内里/纹理特写：只进相册，不当新色卡。 */
export function measureDetailComposition(
  data: Uint8Array | Buffer,
  width: number,
  height: number,
): { fillRatio: number; metalRatio: number; borderWhite: number; edgeTouches: number; detailShot: boolean } {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const n = Math.max(1, w * h)
  const borderW = Math.max(2, Math.floor(Math.min(w, h) * 0.08))
  let product = 0
  let metal = 0
  let border = 0
  let borderWhiteN = 0
  const edgeHit = [false, false, false, false]
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 3
      const r = data[i] || 0
      const g = data[i + 1] || 0
      const b = data[i + 2] || 0
      const hsv = rgbToHsv(r, g, b)
      const white = hsv.v > 0.88 && hsv.s < 0.14
      const onBorder = x < borderW || x >= w - borderW || y < borderW || y >= h - borderW
      if (onBorder) {
        border += 1
        if (white) borderWhiteN += 1
      }
      if (white || hsv.v < 0.06) continue
      product += 1
      const gold = hsv.h >= 32 && hsv.h <= 58 && hsv.s >= 0.28 && hsv.v >= 0.35
      if (gold) metal += 1
      if (x <= 1) edgeHit[0] = true
      if (x >= w - 2) edgeHit[1] = true
      if (y <= 1) edgeHit[2] = true
      if (y >= h - 2) edgeHit[3] = true
    }
  }
  const fillRatio = product / n
  const metalRatio = product ? metal / product : 0
  const borderWhite = border ? borderWhiteN / border : 0
  const edgeTouches = edgeHit.filter(Boolean).length
  const detailShot =
    metalRatio >= 0.42 && fillRatio >= 0.62 && borderWhite < 0.06
  return { fillRatio, metalRatio, borderWhite, edgeTouches, detailShot }
}

export function pickColorwayHero(samples: YupooImageColorSample[]): YupooImageColorSample | null {
  const pool = samples.filter((sample) => String(sample.url || '').trim())
  if (!pool.length) return null
  let best = pool[0]
  let bestScore = Number.NEGATIVE_INFINITY
  pool.forEach((sample, index) => {
    const fill = sample.fillRatio ?? 0.45
    let score = 0
    if (sample.iconLike) score -= 120
    if (sample.detailShot) score -= 80
    if (sample.groupShot) score -= 50
    if (sample.packaging) score -= 16
    score -= Math.abs(fill - 0.4) * 36
    score += Math.min(0.45, sample.borderWhite ?? 0) * 18
    score -= index * 0.05
    if (score > bestScore) {
      bestScore = score
      best = sample
    }
  })
  return best
}

export function baseColorLabel(label?: string | null): string {
  return String(label || '').trim().replace(/-\d+$/, '')
}

export function isGenericColorLabel(label?: string | null): boolean {
  const text = String(label || '').trim()
  return !text || text === '默认颜色' || text === '其他' || /^颜色/.test(text)
}

/** 细节图开出的「金色/颜色3」在已有真色卡时并回主色，不另开 SKU。 */
export function dropGenericColorGroups(groups: YupooColorSkuGroup[]): YupooColorSkuGroup[] {
  const named = groups.filter((group) => group.imageUrl && !isGenericColorLabel(group.label))
  if (!named.length || named.length === groups.length) return groups.filter((group) => group.imageUrl)
  const extras = groups.filter((group) => isGenericColorLabel(group.label))
  named[0].extraImageUrls.push(
    ...extras.flatMap((group) => [group.imageUrl, ...(group.extraImageUrls || [])].filter(Boolean)),
  )
  return named
}

export function attachUnusedImagesToGroups(
  groups: YupooColorSkuGroup[],
  samples: YupooImageColorSample[],
): YupooColorSkuGroup[] {
  if (!groups.length) return groups
  const used = new Set(groups.flatMap((group) => [group.imageUrl, ...(group.extraImageUrls || [])]))
  for (const sample of samples) {
    const url = String(sample.url || '').trim()
    if (!url || used.has(url)) continue
    let target = groups[0]
    if (sample.r >= 0) {
      let best = Number.POSITIVE_INFINITY
      for (const group of groups) {
        const hero = samples.find((row) => row.url === group.imageUrl && row.r >= 0)
        if (!hero) continue
        const distance = rgbDistance(hero, sample)
        if (distance < best) {
          best = distance
          target = group
        }
      }
    }
    target.extraImageUrls.push(url)
    used.add(url)
  }
  return groups
}

/**
 * 一个真色一条 SKU：同名色卡合并，详情/补图挂到该色上，不开 米色-2。
 */
export function groupSamplesByPreciseColor(samples: YupooImageColorSample[]): YupooColorSkuGroup[] {
  const pool = samples.filter(
    (sample) =>
      sample.r >= 0 &&
      !sample.groupShot &&
      !sample.iconLike &&
      !sample.detailShot &&
      String(sample.url || '').trim(),
  )
  const buckets = new Map<string, YupooImageColorSample[]>()
  const order: string[] = []
  for (const sample of pool) {
    const key = baseColorLabel(sample.label)
    if (!key || key === '其他') continue
    if (!buckets.has(key)) {
      buckets.set(key, [])
      order.push(key)
    }
    buckets.get(key)!.push(sample)
  }
  for (const sample of pool) {
    const key = baseColorLabel(sample.label)
    if (key && key !== '其他') continue
    let best = ''
    let bestDistance = 18
    for (const label of order) {
      const hero = buckets.get(label)?.[0]
      if (!hero) continue
      const distance = rgbDistance(hero, sample)
      if (distance < bestDistance) {
        bestDistance = distance
        best = label
      }
    }
    if (best) buckets.get(best)!.push(sample)
  }
  if (!order.length) return []
  return order.map((label) => {
    const members = buckets.get(label) || []
    const hero = pickColorwayHero(members) || members[0]
    const heroUrl = hero?.url || ''
    return {
      label,
      imageUrl: heroUrl,
      extraImageUrls: members.map((row) => row.url).filter((url) => url && url !== heroUrl),
    }
  })
}

export function mergeGroupsByBaseLabel(groups: YupooColorSkuGroup[]): YupooColorSkuGroup[] {
  const map = new Map<string, YupooColorSkuGroup>()
  const order: string[] = []
  for (const group of groups) {
    const raw = String(group.label || '').trim()
    const key = /^颜色/.test(raw) ? raw : baseColorLabel(raw)
    if (!key || key === '默认颜色') continue
    const current = map.get(key)
    if (!current) {
      map.set(key, {
        label: key,
        imageUrl: group.imageUrl,
        extraImageUrls: [...(group.extraImageUrls || [])],
      })
      order.push(key)
    } else {
      current.extraImageUrls.push(group.imageUrl, ...(group.extraImageUrls || []))
    }
  }
  return order.map((key) => map.get(key)!).filter((group) => group.imageUrl)
}

/** 礼盒摆拍各开一条颜色 SKU；白底特写 / 手持 / 全家福不进 SKU。 */
export function groupImagesByBoxPackShots(samples: YupooImageColorSample[]): YupooColorSkuGroup[] {
  const pack = samples.filter(
    (sample) => sample.packShot && !sample.groupShot && String(sample.url || '').trim(),
  )
  if (pack.length < 2) return []
  if (pack.length > Math.max(2, Math.ceil(samples.length * 0.75))) return []
  return uniquifyColorLabels(
    pack.map((sample, index) => ({
      label: sample.label && sample.label !== '其他' ? sample.label : `颜色${index + 1}`,
      imageUrl: sample.url,
      extraImageUrls: [],
    })),
  )
}

const SAME_COLOR_RGB_MAX = 24
const CLUSTER_COLOR_RGB_MAX = 26

/**
 * 按实测颜色归堆（不要求相册顺序相邻）。粉/白/棕这类会各成一条 SKU。
 * 拆得太碎（几乎一张一色）则放弃，交给后续相邻/顺序逻辑。
 */
/** 已命名的产品色（粉/白/棕）各成一条，不靠相册顺序。 */
/** 文案已写明白色/红色/黑色时，按色名领图，不再全部收成同一个白色。 */
export function assignCopyColorsToImages(
  colorLabels: string[],
  samples: YupooImageColorSample[],
): YupooColorSkuGroup[] {
  const colors = Array.from(new Set(colorLabels.map((label) => String(label || '').trim()).filter(Boolean)))
  const unused = samples.filter(
    (sample) => sample.r >= 0 && !sample.groupShot && !sample.iconLike && String(sample.url || '').trim(),
  )
  if (colors.length < 2 || unused.length < 2) return []
  const used = new Set<string>()
  const groups: YupooColorSkuGroup[] = []
  const takeBest = (color: string) => {
    let best: YupooImageColorSample | null = null
    let bestScore = -1
    for (const sample of unused) {
      if (used.has(sample.url)) continue
      const named = baseColorLabel(sample.label)
      let score = 0
      if (named === color) score += 100
      const rgbName = nameProductColorFromRgb(sample.r, sample.g, sample.b)
      if (rgbName === color) score += 80
      if (sample.detailShot) score -= 20
      if (score > bestScore) {
        bestScore = score
        best = sample
      }
    }
    if (!best && unused.some((sample) => !used.has(sample.url))) {
      best = unused.find((sample) => !used.has(sample.url)) || null
      bestScore = 1
    }
    if (!best) return
    used.add(best.url)
    groups.push({ label: color, imageUrl: best.url, extraImageUrls: [] })
  }
  for (const color of colors) takeBest(color)
  for (const sample of unused) {
    if (used.has(sample.url) || sample.detailShot) continue
    const label = baseColorLabel(sample.label) || nameProductColorFromRgb(sample.r, sample.g, sample.b)
    if (!label || label === '其他' || groups.some((group) => group.label === label)) continue
    used.add(sample.url)
    groups.push({ label, imageUrl: sample.url, extraImageUrls: [] })
  }
  return groups.length >= 2 ? groups : []
}

export function groupImagesByNamedColor(samples: YupooImageColorSample[]): YupooColorSkuGroup[] {
  const useful = samples.filter(
    (sample) =>
      sample.label &&
      sample.label !== '其他' &&
      sample.r >= 0 &&
      !sample.groupShot &&
      !sample.detailShot &&
      String(sample.url || '').trim(),
  )
  const labels = Array.from(new Set(useful.map((sample) => sample.label as string)))
  if (labels.length < 2) return []
  return uniquifyColorLabels(
    groupImagesByColorLabel(useful.map((sample) => ({ url: sample.url, label: sample.label as string }))),
  )
}

export function groupImagesByColorClusters(samples: YupooImageColorSample[]): YupooColorSkuGroup[] {
  const measured = samples.filter(
    (sample) =>
      sample.r >= 0 &&
      !sample.packaging &&
      !sample.groupShot &&
      !sample.detailShot &&
      String(sample.url || '').trim(),
  )
  if (measured.length < 2) return []

  type Cluster = { r: number; g: number; b: number; members: YupooImageColorSample[] }
  const clusters: Cluster[] = []
  for (const sample of measured) {
    let best = -1
    let bestDistance = Number.POSITIVE_INFINITY
    for (let i = 0; i < clusters.length; i += 1) {
      const distance = rgbDistance(clusters[i], sample)
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    }
    if (best >= 0 && bestDistance <= CLUSTER_COLOR_RGB_MAX) {
      const cluster = clusters[best]
      cluster.members.push(sample)
      const n = cluster.members.length
      cluster.r = (cluster.r * (n - 1) + sample.r) / n
      cluster.g = (cluster.g * (n - 1) + sample.g) / n
      cluster.b = (cluster.b * (n - 1) + sample.b) / n
    } else {
      clusters.push({ r: sample.r, g: sample.g, b: sample.b, members: [sample] })
    }
  }

  const maxKeep = Math.min(
    clusters.length,
    samples.length <= 8 ? samples.length : Math.max(3, Math.ceil(samples.length * 0.75)),
  )
  if (clusters.length < 2) return []
  while (clusters.length > maxKeep) {
    let drop = 0
    let dropSize = Number.POSITIVE_INFINITY
    for (let i = 0; i < clusters.length; i += 1) {
      if (clusters[i].members.length < dropSize) {
        dropSize = clusters[i].members.length
        drop = i
      }
    }
    const orphan = clusters.splice(drop, 1)[0]
    let best = 0
    let bestDistance = Number.POSITIVE_INFINITY
    for (let i = 0; i < clusters.length; i += 1) {
      const distance = rgbDistance(clusters[i], orphan)
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    }
    const target = clusters[best]
    target.members.push(...orphan.members)
    const n = target.members.length
    target.r = target.members.reduce((sum, row) => sum + row.r, 0) / n
    target.g = target.members.reduce((sum, row) => sum + row.g, 0) / n
    target.b = target.members.reduce((sum, row) => sum + row.b, 0) / n
  }

  return uniquifyColorLabels(
    clusters.map((cluster, index) => {
      const hero = cluster.members[0]
      const named = nameProductColorFromRgb(cluster.r, cluster.g, cluster.b)
      const urls = cluster.members.map((row) => row.url)
      return {
        label: named && named !== '其他' ? named : `颜色${index + 1}`,
        imageUrl: hero.url,
        extraImageUrls: urls.filter((url) => url !== hero.url),
      }
    }),
  )
}

/**
 * 按相册顺序拆色：不同产品色各开一条 SKU，礼盒/同色补图挂到当前色。
 * 绝不按「白色」这种通名把不相邻的色合并。
 */
export function groupImagesByAdjacentColor(samples: YupooImageColorSample[]): YupooColorSkuGroup[] {
  type Acc = { label: string; urls: string[]; hero: YupooImageColorSample | null }
  const acc: Acc[] = []

  for (const sample of samples) {
    const url = String(sample.url || '').trim()
    if (!url) continue
    const last = acc[acc.length - 1]
    const measured = sample.r >= 0 && sample.g >= 0 && sample.b >= 0
    const attachToLast =
      Boolean(last) &&
      !sample.packShot &&
      (sample.packaging ||
        (measured && last.hero && rgbDistance(last.hero, sample) <= SAME_COLOR_RGB_MAX) ||
        (!measured && last.urls.length === 1))

    if (!last || !attachToLast) {
      acc.push({
        label: sample.label || `颜色${acc.length + 1}`,
        urls: [url],
        hero: sample.packaging || !measured ? null : sample,
      })
      continue
    }

    last.urls.push(url)
    if (!last.hero && measured && !sample.packaging) last.hero = sample
    if (sample.label && (!last.label || /^颜色\d+$/.test(last.label))) last.label = sample.label
  }

  return acc.map((group, index) => ({
    label: group.hero?.label || group.label || `颜色${index + 1}`,
    imageUrl: group.hero?.url || group.urls[0],
    extraImageUrls: group.urls.filter((url) => url !== (group.hero?.url || group.urls[0])),
  }))
}

export function groupImagesByColorLabel(
  items: Array<{ url: string; label: string }>,
): YupooColorSkuGroup[] {
  const groups = new Map<string, YupooColorSkuGroup>()
  const order: string[] = []
  for (const item of items) {
    const label = String(item.label || '').trim() || '其他'
    const url = String(item.url || '').trim()
    if (!url) continue
    const current = groups.get(label)
    if (!current) {
      groups.set(label, { label, imageUrl: url, extraImageUrls: [] })
      order.push(label)
    } else {
      current.extraImageUrls.push(url)
    }
  }
  return order.map((label) => groups.get(label)!).filter(Boolean)
}

/** 图多色少：按相册顺序大约每两张一色（17 张 → 9 个 SKU）。 */
export function groupImagesSequentially(
  urls: string[],
  targetCount?: number,
): YupooColorSkuGroup[] {
  const images = urls.map((url) => String(url || '').trim()).filter(Boolean)
  if (!images.length) return []
  const count = Math.min(images.length, Math.max(1, targetCount || Math.round(images.length / 2)))
  const groups: YupooColorSkuGroup[] = []
  let cursor = 0
  for (let i = 0; i < count; i += 1) {
    const left = count - i
    const remain = images.length - cursor
    const take = Math.max(1, Math.ceil(remain / left))
    const slice = images.slice(cursor, cursor + take)
    cursor += take
    if (!slice.length) break
    groups.push({
      label: `颜色${i + 1}`,
      imageUrl: slice[0],
      extraImageUrls: slice.slice(1),
    })
  }
  if (cursor < images.length && groups.length) {
    groups[groups.length - 1].extraImageUrls.push(...images.slice(cursor))
  }
  return groups
}

/** 同名色合并进一条 SKU，不再生成 棕色-2。 */
export function uniquifyColorLabels(groups: YupooColorSkuGroup[]): YupooColorSkuGroup[] {
  const merged = mergeGroupsByBaseLabel(groups)
  return merged.length ? merged : groups.filter((group) => group.imageUrl)
}
