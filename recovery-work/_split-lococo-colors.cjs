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
  if ((h <= 28 || h >= 340) && s >= 0.28 && v >= 0.22 && v <= 0.82) return '红色'
  if ((h <= 26 || h >= 318) && s >= 0.12 && s < 0.38 && v >= 0.5) return '粉色'
  if (h >= 85 && h <= 165 && s > 0.25) return '绿色'
  if (h >= 12 && h <= 40 && s >= 0.3 && v >= 0.2 && v < 0.56) return '棕色'
  return null
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

async function sampleLabel(url) {
  const abs = uploadPath(url)
  if (!abs || !fs.existsSync(abs)) return null
  const { data, info } = await sharp(fs.readFileSync(abs))
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize(120, 120, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
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
  if (darkN >= 12 && darkRatio >= 0.16 && darkRatio >= paleRatio * 0.55) {
    pick = { r: darkR / darkN, g: darkG / darkN, b: darkB / darkN }
  } else if (chromaN >= 12 && chromaRatio >= 0.12 && chromaIsAccent && (paleRatio < 0.55 || chromaHsv.s >= 0.45 || chromaRatio >= paleRatio)) {
    pick = { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN }
  } else if (paleN >= 12 && paleRatio >= 0.22) {
    pick = { r: paleR / paleN, g: paleG / paleN, b: paleB / paleN }
  } else if (chromaN >= 12) {
    pick = { r: chromaR / chromaN, g: chromaG / chromaN, b: chromaB / chromaN }
  } else if (allN >= 12) {
    pick = { r: allR / allN, g: allG / allN, b: allB / allN }
  }
  return pick ? nameProductColorFromRgb(pick.r, pick.g, pick.b) : null
}

function is1688(url) {
  return /1688\.com|detail\.1688/i.test(String(url || ''))
}

const p = new PrismaClient()
;(async () => {
  const items = await p.importtaskitem.findMany({
    where: { isPublished: false, importedProductId: null, fetchStatus: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    take: 80,
    select: {
      id: true,
      sourceUrl: true,
      parsedName: true,
      costPrice: true,
      cnyPriceMin: true,
      availableStock: true,
      weightGrams: true,
      skuSummaryText: true,
      previewDataJson: true,
    },
  })
  let updated = 0
  for (const item of items) {
    if (is1688(item.sourceUrl)) continue
    const preview = item.previewDataJson || {}
    const images = Array.from(
      new Set([...(preview.detailImages || []), preview.mainImageUrl].filter(Boolean)),
    )
    const currentColors = Array.from(
      new Set((preview.colors || []).map((color) => String(color.label || '').trim()).filter(Boolean)),
    )
    const force = item.id === 'c2eafddc-cf2a-46cb-9eb2-00ec61354ccc'
    if (!force && (images.length < 4 || currentColors.length >= 2)) continue
    const buckets = new Map()
    const order = []
    for (const url of images) {
      const label = await sampleLabel(url)
      if (force) console.log(path.basename(String(url)), '=>', label)
      if (!label) continue
      if (!buckets.has(label)) {
        buckets.set(label, url)
        order.push(label)
      }
    }
    if (order.length < 2) continue
    if (!force && currentColors.length === order.length && currentColors.every((label, index) => label === order[index])) {
      continue
    }
    const cost = Number(item.costPrice) || 0
    const price = Number(item.cnyPriceMin) || cost
    const stock = Number(item.availableStock) || 0
    const weight = item.weightGrams == null ? null : Number(item.weightGrams)
    const skuTable = order.map((label, index) => ({
      skuKey: `sku-${index + 1}`,
      spec: label,
      costPrice: cost,
      price,
      stock,
      weightGrams: weight,
      imageUrl: buckets.get(label),
      attributes: [{ name: '颜色', value: label }],
    }))
    await p.importtaskitem.update({
      where: { id: item.id },
      data: {
        skuSummaryText: order.join(' / '),
        specSummaryJson: [{ name: '颜色', values: order }],
        previewDataJson: {
          ...preview,
          colors: order.map((label) => ({ label, imageUrl: buckets.get(label) })),
          sizesByColor: {},
          skuTable,
        },
      },
    })
    updated += 1
    console.log((item.parsedName || '').split('\n')[0], currentColors.join('/') || '-', '=>', order.join('/'))
  }
  console.log('updated', updated)
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
