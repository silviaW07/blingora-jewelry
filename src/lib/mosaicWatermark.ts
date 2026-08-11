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
