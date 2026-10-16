import sharp from 'sharp'
import { readUploadImageBytes } from '@/backend/lib/detectBrandFromBackdropImage'
import { isPlaceholderPendingImportImage } from '@/backend/utils/pendingImportReadiness'

async function readImageBytesForColorSample(url: string): Promise<Buffer | null> {
  const local = await readUploadImageBytes(url)
  if (local?.length) return local
  if (!/^https?:\/\//i.test(url)) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: /alicdn|1688|aliimg/i.test(url) ? 'https://detail.1688.com/' : url,
      },
    })
    clearTimeout(timer)
    if (!response.ok) return null
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length < 80 || bytes.length > 8_000_000) return null
    return bytes
  } catch {
    return null
  }
}
import {
  colorLabelFromPhotoTitle,
  groupImagesByAdjacentColor,
  groupImagesByBoxPackShots,
  groupImagesByColorClusters,
  groupImagesByNamedColor,
  groupImagesSequentially,
  assignCopyColorsToImages,
  groupSamplesByPreciseColor,
  mergeGroupsByBaseLabel,
  inferYupooColorSkuCount,
  maxPairwiseRgbDistance,
  isTinyPlaceholderImage,
  looksLikeIconSilhouette,
  looksLikePackagingRgb,
  sampleStudioProductRgb,
  measureBoxPackShare,
  measureDetailComposition,
  measureProductClusters,
  nameProductColorFromRgb,
  pickColorwayHero,
  attachUnusedImagesToGroups,
  dropGenericColorGroups,
  uniquifyColorLabels,
  type YupooColorSkuGroup,
  type YupooImageColorSample,
} from '@/shared/yupooColorSkus'
import { extractColorLabelsFromCopy } from '@/shared/importSpecFromCopy'

function averageDominantProductRgb(data: Buffer, width: number, height: number): { r: number; g: number; b: number } | null {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 3
      const pr = data[i] || 0
      const pg = data[i + 1] || 0
      const pb = data[i + 2] || 0
      const max = Math.max(pr, pg, pb)
      const min = Math.min(pr, pg, pb)
      const sat = max === 0 ? 0 : (max - min) / max
      const val = max / 255
      if (val > 0.9 && sat < 0.1) continue
      if (val < 0.05) continue
      mask[y * w + x] = 1
    }
  }
  const seen = new Uint8Array(w * h)
  const dirs = [1, -1, w, -w]
  let bestArea = 0
  let bestStart = -1
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
    if (area > bestArea) {
      bestArea = area
      bestStart = start
    }
  }
  if (bestStart < 0 || bestArea < 18) return null

  const flood = new Uint8Array(w * h)
  const stack = [bestStart]
  flood[bestStart] = 1
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  while (stack.length) {
    const cur = stack.pop() as number
    const cx = cur % w
    const i = cur * 3
    r += data[i] || 0
    g += data[i + 1] || 0
    b += data[i + 2] || 0
    n += 1
    for (const delta of dirs) {
      const next = cur + delta
      if (next < 0 || next >= mask.length || flood[next] || !mask[next]) continue
      if (delta === 1 && cx === w - 1) continue
      if (delta === -1 && cx === 0) continue
      flood[next] = 1
      stack.push(next)
    }
  }
  if (n < 18) return null
  return { r: r / n, g: g / n, b: b / n }
}

type HostedImageSample = Omit<YupooImageColorSample, 'url'> & {
  pixels?: Buffer
  pixelWidth?: number
  pixelHeight?: number
}

async function sampleHostedImage(url: string): Promise<HostedImageSample | null> {
  const bytes = await readImageBytesForColorSample(url)
  if (!bytes) return null
  try {
    const meta = await sharp(bytes).metadata()
    if (isTinyPlaceholderImage(bytes.length, meta.width, meta.height)) {
      return {
        r: -1,
        g: -1,
        b: -1,
        packaging: false,
        packShot: false,
        packShare: 0,
        groupShot: false,
        iconLike: true,
        detailShot: false,
        fillRatio: 0,
        metalRatio: 0,
        borderWhite: 0,
        label: null,
      }
    }
    const { data, info } = await sharp(bytes)
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize(120, 120, { fit: 'inside' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    if (info.channels < 3) return null
    const pack = measureBoxPackShare(data, info.width, info.height)
    const clusters = measureProductClusters(data, info.width, info.height)
    const detail = measureDetailComposition(data, info.width, info.height)
    const iconLike = looksLikeIconSilhouette(data, info.width, info.height)
    const avg = iconLike
      ? null
      : sampleStudioProductRgb(data, info.width, info.height) ||
        averageDominantProductRgb(data, info.width, info.height)
    const label = avg ? nameProductColorFromRgb(avg.r, avg.g, avg.b) : null
    return {
      r: avg?.r ?? -1,
      g: avg?.g ?? -1,
      b: avg?.b ?? -1,
      packaging: Boolean(
        avg &&
          looksLikePackagingRgb(avg.r, avg.g, avg.b) &&
          pack.packShot &&
          detail.fillRatio < 0.82,
      ),
      packShot: pack.packShot && !clusters.groupShot && pack.lower >= 0.28,
      packShare: pack.lower,
      groupShot: clusters.groupShot,
      iconLike,
      detailShot: !iconLike && detail.detailShot,
      fillRatio: detail.fillRatio,
      metalRatio: detail.metalRatio,
      borderWhite: detail.borderWhite,
      label: !label || label === '其他' ? null : label,
      pixels: data,
      pixelWidth: info.width,
      pixelHeight: info.height,
    }
  } catch {
    return null
  }
}

function grayscaleDistance(a: HostedImageSample, b: HostedImageSample): number {
  if (!a.pixels || !b.pixels || a.pixelWidth !== b.pixelWidth || a.pixelHeight !== b.pixelHeight) {
    return Number.POSITIVE_INFINITY
  }
  let total = 0
  const count = Math.min(a.pixels.length, b.pixels.length) / 3
  for (let i = 0; i < count; i += 1) {
    const offset = i * 3
    const aGray = 0.299 * a.pixels[offset] + 0.587 * a.pixels[offset + 1] + 0.114 * a.pixels[offset + 2]
    const bGray = 0.299 * b.pixels[offset] + 0.587 * b.pixels[offset + 1] + 0.114 * b.pixels[offset + 2]
    total += Math.abs(aGray - bGray)
  }
  return count ? total / count : Number.POSITIVE_INFINITY
}

/**
 * 同机位礼盒图只替换商品颜色时，整张图取色会被固定的钱包/礼盒带偏。
 * 对最相似的一对图只采样变化区域，可稳定分出黑色与橙色等真实款色。
 */
function sampleChangedRegionColor(
  current: HostedImageSample,
  peer: HostedImageSample,
): { r: number; g: number; b: number } | null {
  if (
    !current.pixels ||
    !peer.pixels ||
    current.pixelWidth !== peer.pixelWidth ||
    current.pixelHeight !== peer.pixelHeight
  ) {
    return null
  }
  const width = current.pixelWidth || 0
  const height = current.pixelHeight || 0
  if (width < 20 || height < 20) return null
  const x0 = Math.floor(width * 0.15)
  const x1 = Math.ceil(width * 0.96)
  const y0 = Math.floor(height * 0.28)
  const y1 = Math.ceil(height * 0.82)
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  let darkR = 0
  let darkG = 0
  let darkB = 0
  let darkCount = 0
  let chromaR = 0
  let chromaG = 0
  let chromaB = 0
  let chromaCount = 0
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const offset = (y * width + x) * 3
      const delta =
        Math.abs(current.pixels[offset] - peer.pixels[offset]) +
        Math.abs(current.pixels[offset + 1] - peer.pixels[offset + 1]) +
        Math.abs(current.pixels[offset + 2] - peer.pixels[offset + 2])
      if (delta < 135) continue
      const pr = current.pixels[offset]
      const pg = current.pixels[offset + 1]
      const pb = current.pixels[offset + 2]
      const max = Math.max(pr, pg, pb)
      const min = Math.min(pr, pg, pb)
      const saturation = max > 0 ? (max - min) / max : 0
      const value = max / 255
      if (value > 0.92 && saturation < 0.1) continue
      r += pr
      g += pg
      b += pb
      count += 1
      if (value < 0.42 && saturation < 0.3) {
        darkR += pr
        darkG += pg
        darkB += pb
        darkCount += 1
      }
      if (saturation > 0.35 && value > 0.35) {
        chromaR += pr
        chromaG += pg
        chromaB += pb
        chromaCount += 1
      }
    }
  }
  if (count < Math.max(24, width * height * 0.025)) return null
  if (darkCount / count >= 0.2 && darkCount > chromaCount * 1.5) {
    return { r: darkR / darkCount, g: darkG / darkCount, b: darkB / darkCount }
  }
  if (chromaCount / count >= 0.2) {
    return { r: chromaR / chromaCount, g: chromaG / chromaCount, b: chromaB / chromaCount }
  }
  return { r: r / count, g: g / count, b: b / count }
}

function nameColorwayGroups(groups: YupooColorSkuGroup[]): YupooColorSkuGroup[] {
  return uniquifyColorLabels(
    groups.map((group, index) => ({
      ...group,
      label: group.label && group.label !== '其他' ? group.label : `颜色${index + 1}`,
    })),
  )
}

export type YupooAlbumImageAnalysis = {
  groups: YupooColorSkuGroup[]
  mainImageUrl: string
  groupShotUrls: string[]
}

export async function analyzeYupooAlbumImages(
  urls: string[],
  options?: {
    albumTitle?: string | null
    photoTitles?: Array<string | null | undefined>
  },
): Promise<YupooAlbumImageAnalysis> {
  const images = Array.from(
    new Set(urls.map((url) => String(url || '').trim()).filter((url) => url && !isPlaceholderPendingImportImage(url))),
  )
  if (!images.length) {
    return { groups: [], mainImageUrl: '', groupShotUrls: [] }
  }
  if (images.length === 1) {
    return {
      groups: [{ label: '默认颜色', imageUrl: images[0], extraImageUrls: [] }],
      mainImageUrl: images[0],
      groupShotUrls: [],
    }
  }

  const samples: YupooImageColorSample[] = []
  const hostedSamples = new Map<string, HostedImageSample>()
  for (const [index, url] of images.entries()) {
    const fromTitle = colorLabelFromPhotoTitle(options?.photoTitles?.[index])
    const sampled = await sampleHostedImage(url)
    if (sampled) hostedSamples.set(url, sampled)
    samples.push({
      url,
      r: sampled?.r ?? -1,
      g: sampled?.g ?? -1,
      b: sampled?.b ?? -1,
      packaging: Boolean(sampled?.packaging),
      packShot: Boolean(sampled?.packShot),
      packShare: sampled?.packShare ?? 0,
      groupShot: Boolean(sampled?.groupShot),
      iconLike: Boolean(sampled?.iconLike),
      detailShot: Boolean(sampled?.detailShot),
      fillRatio: sampled?.fillRatio ?? 0,
      metalRatio: sampled?.metalRatio ?? 0,
      borderWhite: sampled?.borderWhite ?? 0,
      label: fromTitle || sampled?.label || null,
    })
  }

  const usable = samples.filter((sample) => !sample.iconLike)
  const groupShotUrls = usable.filter((sample) => sample.groupShot).map((sample) => sample.url)
  const detailSamples = usable.filter((sample) => sample.detailShot && !sample.groupShot)
  let skuSamples = usable.filter((sample) => !sample.groupShot && !sample.detailShot)

  let closestPair:
    | { first: YupooImageColorSample; second: YupooImageColorSample; distance: number }
    | null = null
  for (let i = 0; i < skuSamples.length; i += 1) {
    for (let j = i + 1; j < skuSamples.length; j += 1) {
      const firstHosted = hostedSamples.get(skuSamples[i].url)
      const secondHosted = hostedSamples.get(skuSamples[j].url)
      if (!firstHosted || !secondHosted) continue
      const distance = grayscaleDistance(firstHosted, secondHosted)
      if (!closestPair || distance < closestPair.distance) {
        closestPair = { first: skuSamples[i], second: skuSamples[j], distance }
      }
    }
  }
  if (closestPair && closestPair.distance <= 30) {
    const firstHosted = hostedSamples.get(closestPair.first.url)
    const secondHosted = hostedSamples.get(closestPair.second.url)
    const firstRgb = firstHosted && secondHosted ? sampleChangedRegionColor(firstHosted, secondHosted) : null
    const secondRgb = firstHosted && secondHosted ? sampleChangedRegionColor(secondHosted, firstHosted) : null
    const firstLabel = firstRgb ? nameProductColorFromRgb(firstRgb.r, firstRgb.g, firstRgb.b) : '其他'
    const secondLabel = secondRgb ? nameProductColorFromRgb(secondRgb.r, secondRgb.g, secondRgb.b) : '其他'
    if (firstLabel !== '其他' && secondLabel !== '其他' && firstLabel !== secondLabel) {
      closestPair.first.label = firstLabel
      closestPair.second.label = secondLabel
      // 同机位换色图是最可靠的 SKU 证据；其余近景只作为详情图，避免钱包、盒子各开假颜色。
      skuSamples = [closestPair.first, closestPair.second]
    }
  }
  if (skuSamples.length < 3) {
    const hasReliablePair =
      closestPair &&
      skuSamples.length === 2 &&
      skuSamples.includes(closestPair.first) &&
      skuSamples.includes(closestPair.second) &&
      closestPair.first.label !== closestPair.second.label
    if (!hasReliablePair) skuSamples = usable.filter((sample) => !sample.groupShot)
  }
  if (!skuSamples.length) {
    const fallback = pickColorwayHero(usable)
    if (fallback) skuSamples = [fallback]
  }
  let groups: YupooColorSkuGroup[] = []
  const explicitColorCount = /(?:\d{1,2}|[二两三四五六七八九十])\s*色/.test(String(options?.albumTitle || ''))
  const copyColors = extractColorLabelsFromCopy(options?.albumTitle)
  const fromCopy = assignCopyColorsToImages(copyColors, skuSamples)
  if (fromCopy.length >= 2) {
    groups = fromCopy
  }
  const precise = groupSamplesByPreciseColor(skuSamples)
  if (!groups.length && precise.length >= 2 && !explicitColorCount) {
    groups = precise
  }
  const measured = skuSamples.filter((sample) => sample.r >= 0).length
  if (!groups.length && measured >= Math.ceil(Math.max(1, skuSamples.length) * 0.4)) {
    const clustered = groupImagesByColorClusters(skuSamples)
    if (clustered.length >= 2) {
      groups = mergeGroupsByBaseLabel(nameColorwayGroups(clustered))
    }
    if (!groups.length) {
      const adjacent = groupImagesByAdjacentColor(skuSamples)
      const maxKeep = Math.max(2, Math.ceil(images.length * 0.9))
      if (adjacent.length >= 2 && adjacent.length <= maxKeep) {
        groups = mergeGroupsByBaseLabel(nameColorwayGroups(adjacent))
      }
    }
  }
  if (!groups.length) {
    const packGroups = groupImagesByBoxPackShots(skuSamples)
    if (packGroups.length >= 2) {
      groups = nameColorwayGroups(packGroups)
    }
  }
  if (!groups.length) {
    const namedGroups = groupImagesByNamedColor(skuSamples)
    if (namedGroups.length >= 2) {
      groups = mergeGroupsByBaseLabel(namedGroups)
    }
  }
  if (!groups.length) {
    const targetCount = inferYupooColorSkuCount(options?.albumTitle, skuSamples.length || images.length)
    if (explicitColorCount && targetCount > 1) {
      const sequential = groupImagesSequentially(skuSamples.map((sample) => sample.url), targetCount)
      groups = nameColorwayGroups(
        sequential.map((group, index) => {
          const sample = skuSamples.find((row) => row.url === group.imageUrl)
          return {
            ...group,
            label: sample?.label || `颜色${index + 1}`,
          }
        }),
      )
    }
  }
  if (!groups.length) {
    const named = skuSamples
      .map((sample) => sample.label)
      .filter((label): label is string => Boolean(label && label !== '其他'))
    const uniqueNamed = Array.from(new Set(named))
    const hero = pickColorwayHero(skuSamples) || skuSamples[0]
    const spread = maxPairwiseRgbDistance(skuSamples.filter((sample) => sample.r >= 0))
    if (uniqueNamed.length === 1 && hero && spread < 28) {
      groups = [{
        label: uniqueNamed[0],
        imageUrl: hero.url,
        extraImageUrls: skuSamples.map((sample) => sample.url).filter((url) => url !== hero.url),
      }]
    } else if (skuSamples.length >= 3 && spread >= 28) {
      const targetCount = Math.min(
        skuSamples.length,
        Math.max(copyColors.length, inferYupooColorSkuCount(options?.albumTitle, skuSamples.length)),
      )
      const sequential = groupImagesSequentially(skuSamples.map((sample) => sample.url), targetCount)
      groups = nameColorwayGroups(
        sequential.map((group, index) => {
          const sample = skuSamples.find((row) => row.url === group.imageUrl)
          return {
            ...group,
            label: copyColors[index] || sample?.label || `颜色${index + 1}`,
          }
        }),
      )
    } else {
      groups = [{ label: '默认颜色', imageUrl: images[0], extraImageUrls: images.slice(1) }]
    }
  }

  attachUnusedImagesToGroups(groups, [...detailSamples, ...usable])
  if (groups.some((group) => group.label && group.label !== '默认颜色')) {
    groups = dropGenericColorGroups(mergeGroupsByBaseLabel(groups))
  }
  if (!groups.length) {
    groups = [{ label: '默认颜色', imageUrl: images[0], extraImageUrls: images.slice(1) }]
  }

  return {
    groups,
    mainImageUrl: groupShotUrls[0] || groups[0]?.imageUrl || images[0],
    groupShotUrls,
  }
}

function isOfficial1688OrHostedProductImage(url: string): boolean {
  const text = String(url || '').trim()
  if (!text) return false
  if (/\/api\/uploads\//i.test(text)) return true
  // 阿里 TFS 头像 / UI 仍走占位判断；其余 1688 CDN 色图不能当剪影丢掉
  if (/img\.alicdn\.com\/tfs\//i.test(text)) return false
  return /(alicdn\.com|aliimg\.com|cbu01\.alicdn|1688\.com\/img)/i.test(text)
}

export async function nameColorFromHostedImage(url?: string | null): Promise<string | null> {
  const text = String(url || '').trim()
  if (!text || isPlaceholderPendingImportImage(text)) return null
  const sampled = await sampleHostedImage(text)
  const label = String(sampled?.label || '').trim()
  if (!label || label === '其他') return null
  return label
}

export async function isIconLikeProductImage(url?: string | null): Promise<boolean> {
  const text = String(url || '').trim()
  if (!text || isPlaceholderPendingImportImage(text)) return true
  if (isOfficial1688OrHostedProductImage(text)) return false
  const sampled = await sampleHostedImage(text)
  return Boolean(sampled?.iconLike)
}

export async function dropIconLikeProductImages(urls: string[]): Promise<string[]> {
  const kept: string[] = []
  for (const url of urls) {
    const text = String(url || '').trim()
    if (!text || isPlaceholderPendingImportImage(text)) continue
    if (await isIconLikeProductImage(text)) continue
    kept.push(text)
  }
  return kept
}

export async function clusterYupooImagesIntoColorSkus(
  urls: string[],
  options?: {
    albumTitle?: string | null
    photoTitles?: Array<string | null | undefined>
  },
): Promise<YupooColorSkuGroup[]> {
  const analysis = await analyzeYupooAlbumImages(urls, options)
  return analysis.groups
}
