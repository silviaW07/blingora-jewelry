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

function isHardware(h, s, v) {
  if (h >= 32 && h <= 58 && s >= 0.25 && v >= 0.38) return true
  if (s < 0.14 && v >= 0.58 && v <= 0.92) return true
  return false
}

function nameColor(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b)
  if (v < 0.38 && s < 0.22) return '黑色'
  if (v >= 0.78 && s < 0.16) return '白色'
  if (v >= 0.68 && s < 0.22 && h >= 14 && h <= 70) return '米色'
  if (v >= 0.58 && s < 0.20 && h >= 16 && h <= 58) return '米色'
  if (s < 0.10 && v >= 0.42 && v < 0.72) return v >= 0.62 ? '银色' : '灰色'
  if (h >= 42 && h <= 58 && s > 0.4 && v > 0.45) return '金色'
  if (h >= 12 && h <= 40 && s >= 0.30 && v >= 0.20 && v < 0.56) return '棕色'
  return `其他(${Math.round(r)},${Math.round(g)},${Math.round(b)} h${Math.round(h)} s${s.toFixed(2)} v${v.toFixed(2)})`
}

function sample(data, width, height) {
  const w = width
  const h = height
  const x0 = Math.floor(w * 0.28)
  const x1 = Math.max(x0 + 1, Math.ceil(w * 0.72))
  const y0 = Math.floor(h * 0.30)
  const y1 = Math.max(y0 + 1, Math.ceil(h * 0.70))
  const box = Math.max(1, (x1 - x0) * (y1 - y0))
  let darkR = 0, darkG = 0, darkB = 0, darkN = 0
  let paleR = 0, paleG = 0, paleB = 0, paleN = 0
  let chromaR = 0, chromaG = 0, chromaB = 0, chromaN = 0
  let allR = 0, allG = 0, allB = 0, allN = 0
  let hwN = 0
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * w + x) * 3
      const r = data[i] || 0
      const g = data[i + 1] || 0
      const b = data[i + 2] || 0
      const hsv = rgbToHsv(r, g, b)
      if (hsv.v > 0.91 && hsv.s < 0.1) continue
      if (isHardware(hsv.h, hsv.s, hsv.v)) {
        hwN += 1
        continue
      }
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
  let pick
  if (darkN >= 12 && darkRatio >= 0.16 && darkRatio >= paleRatio * 0.55) {
    pick = { r: darkR / darkN, g: darkG / darkN, b: darkB / darkN, via: 'dark' }
  } else if (paleN >= 12 && paleRatio >= 0.18) {
    pick = { r: paleR / paleN, g: paleG / paleN, b: paleB / paleN, via: 'pale' }
  } else if (chromaN >= 12) {
    pick = { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN, via: 'chroma' }
  } else if (allN >= 12) {
    pick = { r: allR / allN, g: allG / allN, b: allB / allN, via: 'all' }
  } else {
    pick = null
  }
  return {
    darkN, paleN, chromaN, allN, hwN, box,
    darkRatio: darkRatio.toFixed(3),
    paleRatio: paleRatio.toFixed(3),
    pick,
    label: pick ? nameColor(pick.r, pick.g, pick.b) + '/' + pick.via : null,
  }
}

const files = [
  'abfce234-33b8-4ce4-8082-2a59d9b03c9a.jpg',
  'f5514b62-0b42-4878-bf25-161928578c80.jpg',
  '1c7bada6-54aa-41aa-bd18-4f7610be3238.jpg',
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
    console.log(name, sample(data, info.width, info.height))
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
