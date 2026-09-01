/**
 * Mosaic likely 1688 watermark corners (pixels are baked in; this only covers regions).
 * Server-only — uses sharp.
 */

import sharp from 'sharp'

export type MosaicRegion = {
  left: number
  top: number
  width: number
  height: number
}

/** Common 1688 shop watermark: bottom-right, sometimes a thin bottom strip. */
export function defaultWatermarkRegions(width: number, height: number): MosaicRegion[] {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  return [
    {
      left: Math.floor(w * 0.58),
      top: Math.floor(h * 0.76),
      width: Math.max(1, Math.floor(w * 0.42)),
      height: Math.max(1, Math.floor(h * 0.24)),
    },
    {
      left: Math.floor(w * 0.5),
      top: Math.floor(h * 0.9),
      width: Math.max(1, Math.floor(w * 0.5)),
      height: Math.max(1, Math.floor(h * 0.1)),
    },
  ]
}

function clampRegion(region: MosaicRegion, width: number, height: number): MosaicRegion | null {
  const left = Math.max(0, Math.min(region.left, width - 1))
  const top = Math.max(0, Math.min(region.top, height - 1))
  const maxW = width - left
  const maxH = height - top
  const rw = Math.min(region.width, maxW)
  const rh = Math.min(region.height, maxH)
  if (rw < 4 || rh < 4) return null
  return { left, top, width: rw, height: rh }
}

async function mosaicPatch(
  source: Buffer,
  region: MosaicRegion,
): Promise<{ input: Buffer; left: number; top: number }> {
  const block = Math.max(6, Math.floor(Math.min(region.width, region.height) / 14))
  const smallW = Math.max(1, Math.floor(region.width / block))
  const smallH = Math.max(1, Math.floor(region.height / block))
  const input = await sharp(source)
    .extract(region)
    .resize(smallW, smallH, { kernel: sharp.kernel.nearest })
    .resize(region.width, region.height, { kernel: sharp.kernel.nearest })
    .toBuffer()
  return { input, left: region.left, top: region.top }
}

/** Returns JPEG bytes with watermark regions pixelated. */
export async function mosaicWatermarkCorners(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata()
  const width = meta.width
  const height = meta.height
  if (!width || !height) {
    throw new Error('无法读取图片尺寸')
  }

  const regions = defaultWatermarkRegions(width, height)
    .map((r) => clampRegion(r, width, height))
    .filter((r): r is MosaicRegion => Boolean(r))

  if (!regions.length) {
    return sharp(input).jpeg({ quality: 88 }).toBuffer()
  }

  const composites = await Promise.all(regions.map((r) => mosaicPatch(input, r)))
  return sharp(input).composite(composites).jpeg({ quality: 88 }).toBuffer()
}

function meanSatAndEdges(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): { sat: number; edge: number; luma: number } {
  let satSum = 0
  let lumaSum = 0
  let edgeSum = 0
  let n = 0
  const step = Math.max(1, Math.floor(Math.min(width, height) / 80))
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * channels
      const r = data[i]
      const g = data[i + Math.min(1, channels - 1)]
      const b = data[i + Math.min(2, channels - 1)]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      satSum += max === 0 ? 0 : (max - min) / max
      lumaSum += 0.299 * r + 0.587 * g + 0.114 * b
      if (x + step < width) {
        const j = (y * width + x + step) * channels
        const r2 = data[j]
        const g2 = data[j + Math.min(1, channels - 1)]
        const b2 = data[j + Math.min(2, channels - 1)]
        const l1 = 0.299 * r + 0.587 * g + 0.114 * b
        const l2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2
        edgeSum += Math.abs(l1 - l2)
      }
      n += 1
    }
  }
  return {
    sat: n ? satSum / n : 0,
    edge: n ? edgeSum / n : 0,
    luma: n ? lumaSum / n : 0,
  }
}

/**
 * Heuristic 1688-style corner watermark:
 * faint gray/white URL text in the bottom-right (desaturated overlay + extra horizontal edges).
 * Not OCR — no guarantee on every shop mark, but skips clean studio shots.
 */
export async function detectCornerWatermark(input: Buffer): Promise<boolean> {
  const meta = await sharp(input).metadata()
  const width = meta.width
  const height = meta.height
  if (!width || !height || width < 40 || height < 40) return false

  const br = clampRegion(
    {
      left: Math.floor(width * 0.55),
      top: Math.floor(height * 0.72),
      width: Math.max(8, Math.floor(width * 0.45)),
      height: Math.max(8, Math.floor(height * 0.28)),
    },
    width,
    height,
  )
  const bl = clampRegion(
    {
      left: Math.floor(width * 0.02),
      top: Math.floor(height * 0.72),
      width: Math.max(8, Math.floor(width * 0.28)),
      height: Math.max(8, Math.floor(height * 0.28)),
    },
    width,
    height,
  )
  if (!br || !bl) return false

  const [brRaw, blRaw] = await Promise.all([
    sharp(input).extract(br).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(input).extract(bl).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
  ])
  const a = meanSatAndEdges(brRaw.data, brRaw.info.width, brRaw.info.height, brRaw.info.channels)
  const b = meanSatAndEdges(blRaw.data, blRaw.info.width, blRaw.info.height, blRaw.info.channels)

  const satDrop = b.sat - a.sat
  const lumaLift = a.luma - b.luma
  const edgeBoost = b.edge > 1 ? a.edge / b.edge : a.edge > 6 ? 1.2 : 0

  // Desaturated + slightly brighter overlay, or extra fine edges typical of URL text
  return satDrop >= 0.035 || (lumaLift >= 8 && satDrop >= 0.015) || (edgeBoost >= 1.18 && satDrop >= 0.02)
}
