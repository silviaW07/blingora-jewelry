const fs = require('fs')
const path = require('path')
const sharp = require('/home/admin/my-website/blingora-jewelry/node_modules/sharp')

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
  if ((h <= 14 || h >= 348) && s >= 0.28 && v >= 0.22 && v <= 0.78) return '红色'
  if ((h <= 26 || h >= 318) && s >= 0.12 && s < 0.38 && v >= 0.5) return '粉色'
  if (h >= 85 && h <= 165 && s > 0.25) return '绿色'
  if (h >= 12 && h <= 40 && s >= 0.3 && v >= 0.2 && v < 0.56) return '棕色'
  return `其他 h${Math.round(h)} s${s.toFixed(2)} v${v.toFixed(2)}`
}

function sampleStudio(data, width, height) {
  const w = width
  const h = height
  const x0 = Math.floor(w * 0.28)
  const x1 = Math.max(x0 + 1, Math.ceil(w * 0.72))
  const y0 = Math.floor(h * 0.3)
  const y1 = Math.max(y0 + 1, Math.ceil(h * 0.7))
  const box = Math.max(1, (x1 - x0) * (y1 - y0))
  let darkR = 0, darkG = 0, darkB = 0, darkN = 0
  let paleR = 0, paleG = 0, paleB = 0, paleN = 0
  let chromaR = 0, chromaG = 0, chromaB = 0, chromaN = 0
  let allR = 0, allG = 0, allB = 0, allN = 0
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * w + x) * 3
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
  let pick = null
  let via = ''
  if (darkN >= 12 && darkRatio >= 0.16 && darkRatio >= paleRatio * 0.55) {
    pick = { r: darkR / darkN, g: darkG / darkN, b: darkB / darkN }
    via = 'dark'
  } else if (chromaN >= 12 && chromaRatio >= 0.12 && chromaIsAccent && (paleRatio < 0.55 || chromaHsv.s >= 0.45 || chromaRatio >= paleRatio)) {
    pick = { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN }
    via = 'chroma'
  } else if (paleN >= 12 && paleRatio >= 0.22) {
    pick = { r: paleR / paleN, g: paleG / paleN, b: paleB / paleN }
    via = 'pale'
  } else if (chromaN >= 12) {
    pick = { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN }
    via = 'chroma2'
  } else if (allN >= 12) {
    pick = { r: allR / allN, g: allG / allN, b: allB / allN }
    via = 'all'
  }
  return {
    darkN, paleN, chromaN, allN,
    darkRatio: darkRatio.toFixed(3),
    paleRatio: paleRatio.toFixed(3),
    chromaRatio: chromaRatio.toFixed(3),
    chromaIsAccent,
    via,
    pick,
    label: pick ? nameProductColorFromRgb(pick.r, pick.g, pick.b) : null,
  }
}

function measureDetail(data, width, height) {
  const w = width
  const h = height
  const n = w * h
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
      const silver = hsv.s < 0.12 && hsv.v >= 0.45 && hsv.v <= 0.88
      if (gold || silver) metal += 1
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
    (metalRatio >= 0.22 && fillRatio >= 0.38) ||
    (fillRatio >= 0.82 && borderWhite < 0.12) ||
    (edgeTouches >= 3 && fillRatio >= 0.58 && borderWhite < 0.18) ||
    fillRatio >= 0.9
  return { fillRatio: fillRatio.toFixed(3), metalRatio: metalRatio.toFixed(3), borderWhite: borderWhite.toFixed(3), edgeTouches, detailShot }
}

const files = [
  '6e388791-8caa-4ae5-b89e-dc62fdcf9ce3.jpg',
  '4d598cf5-ccc0-4b59-bae6-594a76330884.jpg',
  '0732c89c-270a-4563-8b22-299515e702f2.jpg',
  '0e64c871-770c-475d-8847-0061f62d33af.jpg',
  '7cda9b8e-6fac-47c3-a96e-b675d15595f8.jpg',
  '1a50b756-244b-4dd4-9462-a60cb1452cf3.jpg',
  'dcc1e9e3-f9b1-4264-8fca-97ea59eeb6cb.jpg',
  'bb684d20-fcb9-4684-ab29-5b320788e538.jpg',
]

;(async () => {
  for (const name of files) {
    const abs = path.join('/home/admin/my-website/uploads/2026/09/13', name)
    if (!fs.existsSync(abs)) {
      console.log('missing', name)
      continue
    }
    const { data, info } = await sharp(fs.readFileSync(abs))
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize(120, 120, { fit: 'inside' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const sampled = sampleStudio(data, info.width, info.height)
    const detail = measureDetail(data, info.width, info.height)
    console.log(name.slice(0, 8), sampled.label, sampled.via, 'dark', sampled.darkRatio, 'pale', sampled.paleRatio, 'chroma', sampled.chromaRatio, 'detail', detail)
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
