const fs = require('fs')
const path = require('path')
const sharp = require('/home/admin/my-website/blingora-jewelry/node_modules/sharp')
const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')

function rgbToHsv(r, g, b) {
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

function nameProductColorFromRgb(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b)
  if (v < 0.38 && s < 0.22) return '黑色'
  if (v >= 0.7 && s < 0.15) return '白色'
  if (v >= 0.68 && s < 0.22 && h >= 14 && h <= 70) return '米色'
  if (v >= 0.58 && s < 0.2 && h >= 16 && h <= 58) return '米色'
  if (s < 0.1 && v >= 0.42 && v < 0.72) return v >= 0.62 ? '银色' : '灰色'
  if ((h <= 14 || h >= 348) && s >= 0.38 && v >= 0.22 && v <= 0.78) return '红色'
  if ((h <= 26 || h >= 318) && s >= 0.12 && s < 0.38 && v >= 0.5) return '粉色'
  if (h >= 300 && h <= 350 && s > 0.14 && v > 0.42) return '粉色'
  if ((h <= 28 || h >= 340) && s >= 0.28 && v >= 0.22 && v <= 0.82) return '红色'
  if (h >= 85 && h <= 165 && s > 0.25) return '绿色'
  if (h >= 185 && h <= 255 && s > 0.22) return '蓝色'
  if (h >= 12 && h <= 40 && s >= 0.3 && v >= 0.2 && v < 0.56) return '棕色'
  return `其他(h${Math.round(h)} s${s.toFixed(2)} v${v.toFixed(2)})`
}

function isStudioBoxPixel(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b)
  if (v > 0.92 && s < 0.1) return false
  if (h >= 155 && h <= 205 && s >= 0.18 && v >= 0.35 && v <= 0.96) return true
  if ((h <= 14 || h >= 346) && s >= 0.38 && v >= 0.25 && v <= 0.92) return true
  if (h >= 16 && h <= 40 && s >= 0.5 && v >= 0.4 && v <= 0.95) return true
  return false
}

function measurePack(data, width, height) {
  const splitY = Math.floor(height * 0.38)
  let lowerBox = 0
  let lowerN = 0
  let upperBox = 0
  let upperN = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 3
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
  return { lower, packShot: lower >= 0.18 && lower >= Math.max(upper * 2.4, 0.16) && lower >= 0.28 }
}

function measureDetail(data, width, height) {
  const n = width * height
  const borderW = Math.max(2, Math.floor(Math.min(width, height) * 0.08))
  let product = 0
  let metal = 0
  let border = 0
  let borderWhiteN = 0
  const edgeHit = [false, false, false, false]
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 3
      const r = data[i] || 0
      const g = data[i + 1] || 0
      const b = data[i + 2] || 0
      const hsv = rgbToHsv(r, g, b)
      const white = hsv.v > 0.88 && hsv.s < 0.14
      const onBorder = x < borderW || x >= width - borderW || y < borderW || y >= height - borderW
      if (onBorder) {
        border += 1
        if (white) borderWhiteN += 1
      }
      if (white || hsv.v < 0.06) continue
      product += 1
      if (hsv.h >= 32 && hsv.h <= 58 && hsv.s >= 0.28 && hsv.v >= 0.35) metal += 1
      if (x <= 1) edgeHit[0] = true
      if (x >= width - 2) edgeHit[1] = true
      if (y <= 1) edgeHit[2] = true
      if (y >= height - 2) edgeHit[3] = true
    }
  }
  const fillRatio = product / n
  const metalRatio = product ? metal / product : 0
  const borderWhite = border ? borderWhiteN / border : 0
  const edgeTouches = edgeHit.filter(Boolean).length
  const detailShot =
    (metalRatio >= 0.35 && fillRatio >= 0.55 && borderWhite < 0.08) ||
    (fillRatio >= 0.94 && borderWhite < 0.04 && edgeTouches >= 4)
  return { fillRatio, metalRatio, borderWhite, edgeTouches, detailShot }
}

function sampleStudio(data, width, height) {
  const x0 = Math.floor(width * 0.28)
  const x1 = Math.max(x0 + 1, Math.ceil(width * 0.72))
  const y0 = Math.floor(height * 0.3)
  const y1 = Math.max(y0 + 1, Math.ceil(height * 0.7))
  const box = Math.max(1, (x1 - x0) * (y1 - y0))
  let darkR = 0, darkG = 0, darkB = 0, darkN = 0
  let paleR = 0, paleG = 0, paleB = 0, paleN = 0
  let chromaR = 0, chromaG = 0, chromaB = 0, chromaN = 0
  let allR = 0, allG = 0, allB = 0, allN = 0
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * width + x) * 3
      const r = data[i] || 0
      const g = data[i + 1] || 0
      const b = data[i + 2] || 0
      const hsv = rgbToHsv(r, g, b)
      if (hsv.v > 0.91 && hsv.s < 0.1) continue
      if (hsv.h >= 32 && hsv.h <= 58 && hsv.s >= 0.28 && hsv.v >= 0.4 && hsv.v <= 0.88) continue
      allR += r; allG += g; allB += b; allN += 1
      if (hsv.v < 0.34 && hsv.s < 0.28) {
        darkR += r; darkG += g; darkB += b; darkN += 1
        continue
      }
      if (hsv.v >= 0.52 && hsv.s <= 0.22) {
        paleR += r; paleG += g; paleB += b; paleN += 1
        continue
      }
      if (hsv.s >= 0.2 && hsv.v <= 0.85) {
        chromaR += r; chromaG += g; chromaB += b; chromaN += 1
      }
    }
  }
  const darkRatio = darkN / box
  const paleRatio = paleN / box
  const chromaRatio = chromaN / box
  const chromaHsv = chromaN ? rgbToHsv(chromaR / chromaN, chromaG / chromaN, chromaB / chromaN) : { s: 0, h: 0 }
  const chromaIsAccent =
    chromaHsv.s >= 0.36 ||
    ((chromaHsv.h <= 26 || chromaHsv.h >= 318) && chromaHsv.s >= 0.26 && chromaRatio >= 0.15)
  if (darkN >= 12 && darkRatio >= 0.16 && darkRatio >= paleRatio * 0.55) {
    return { r: darkR / darkN, g: darkG / darkN, b: darkB / darkN, via: 'dark' }
  }
  if (chromaN >= 12 && chromaRatio >= 0.12 && chromaIsAccent && (paleRatio < 0.55 || chromaHsv.s >= 0.45 || chromaRatio >= paleRatio)) {
    return { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN, via: 'chroma' }
  }
  if (paleN >= 12 && paleRatio >= 0.22) return { r: paleR / paleN, g: paleG / paleN, b: paleB / paleN, via: 'pale' }
  if (chromaN >= 12) return { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN, via: 'chroma2' }
  if (allN < 12) return null
  return { r: allR / allN, g: allG / allN, b: allB / allN, via: 'all' }
}

function uploadPath(url) {
  const text = String(url || '')
  const idx = text.indexOf('/api/uploads/')
  if (idx < 0) return null
  return path.join(
    '/home/admin/my-website/uploads',
    ...text.slice(idx + '/api/uploads/'.length).split('?')[0].split('/').filter(Boolean),
  )
}

async function analyzeUrl(url) {
  const abs = uploadPath(url)
  if (!abs || !fs.existsSync(abs)) return { url, missing: true }
  const { data, info } = await sharp(fs.readFileSync(abs))
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize(120, 120, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pack = measurePack(data, info.width, info.height)
  const detail = measureDetail(data, info.width, info.height)
  const avg = sampleStudio(data, info.width, info.height)
  const label = avg ? nameProductColorFromRgb(avg.r, avg.g, avg.b) : null
  return {
    file: path.basename(url.split('?')[0]),
    label,
    via: avg?.via,
    rgb: avg ? [Math.round(avg.r), Math.round(avg.g), Math.round(avg.b)] : null,
    packShot: pack.packShot,
    packLower: Number(pack.lower.toFixed(3)),
    detailShot: detail.detailShot,
    fill: Number(detail.fillRatio.toFixed(3)),
    metal: Number(detail.metalRatio.toFixed(3)),
    borderW: Number(detail.borderWhite.toFixed(3)),
  }
}

const p = new PrismaClient()
;(async () => {
  const ids = [
    'c2eafddc-cf2a-46cb-9eb2-00ec61354ccc',
    '19db1059-ecda-4809-b08b-5251f224bcc0',
    '33bd59c5-2526-430b-906a-a37416efe471',
  ]
  for (const id of ids) {
    const item = await p.importtaskitem.findUnique({
      where: { id },
      select: { parsedName: true, previewDataJson: true },
    })
    const preview = item.previewDataJson || {}
    const images = Array.from(new Set([preview.mainImageUrl, ...(preview.detailImages || [])].filter(Boolean)))
    console.log('\n====', id, (item.parsedName || '').split('\n')[0])
    console.log('current', (preview.colors || []).map((c) => c.label).join('/'))
    for (const url of images) {
      console.log(await analyzeUrl(url))
    }
  }
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
