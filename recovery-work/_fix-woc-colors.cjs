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

function nameColor(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b)
  if (v < 0.38 && s < 0.22) return '黑色'
  if (v >= 0.75 && s < 0.16) return '白色'
  if (v >= 0.68 && s < 0.22 && h >= 14 && h <= 70) return '米色'
  if (s < 0.1 && v >= 0.42 && v < 0.72) return v >= 0.62 ? '银色' : '灰色'
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
      }
    }
  }
  const darkRatio = darkN / box
  const paleRatio = paleN / box
  let pick = null
  if (darkN >= 12 && darkRatio >= 0.16 && darkRatio >= paleRatio * 0.55) {
    pick = { r: darkR / darkN, g: darkG / darkN, b: darkB / darkN }
  } else if (paleN >= 12 && paleRatio >= 0.18) {
    pick = { r: paleR / paleN, g: paleG / paleN, b: paleB / paleN }
  } else if (allN >= 12) {
    pick = { r: allR / allN, g: allG / allN, b: allB / allN }
  }
  return pick ? nameColor(pick.r, pick.g, pick.b) : null
}

function specOf(sku) {
  const attrs = Array.isArray(sku.attributeJson) ? sku.attributeJson : []
  const spec = attrs.find((attr) => ['规格', '尺码', '尺寸'].includes(attr.name))?.value || sku.sizeLabel || ''
  return String(spec).replace(/\s*副本\d*$/u, '').trim() || '19*4*12cm'
}

const p = new PrismaClient()

;(async () => {
  const products = await p.product.findMany({
    where: { productCode: { in: ['HAND2026090101', 'HAND2026090102'] } },
    include: { skus: { orderBy: { skuCode: 'asc' } } },
  })
  for (const product of products) {
    const gallery = Array.isArray(product.galleryJson)
      ? product.galleryJson.map((row) => String(row.url || '').trim()).filter(Boolean)
      : []
    const buckets = new Map()
    for (const url of gallery) {
      const label = await sampleLabel(url)
      console.log(product.productCode, path.basename(url), '=>', label)
      if (!label || label === '银色') continue
      if (!buckets.has(label)) buckets.set(label, url)
    }
    if (!buckets.has('白色')) {
      const whiteGuess = gallery.find((url) => /f5514b62/i.test(url))
      if (whiteGuess) buckets.set('白色', whiteGuess)
    }
    if (!buckets.has('黑色')) {
      const blackGuess = gallery.find((url) => /abfce234/i.test(url))
      if (blackGuess) buckets.set('黑色', blackGuess)
    }
    const colors = ['黑色', '白色'].filter((label) => buckets.has(label))
    if (colors.length < 2) {
      console.log('skip, colors', [...buckets.keys()], product.productCode)
      continue
    }
    const spec = specOf(product.skus[0] || {})
    if (spec.includes('*') && spec.includes('19') && !spec.includes('12')) {
      // keep longer size if the sibling has it
    }
    const resolvedSpec =
      product.skus.map(specOf).sort((a, b) => b.length - a.length)[0] || spec
    for (let i = 0; i < Math.min(product.skus.length, colors.length); i += 1) {
      const sku = product.skus[i]
      const color = colors[i]
      await p.productsku.update({
        where: { id: sku.id },
        data: {
          imageUrl: buckets.get(color),
          sizeLabel: resolvedSpec,
          attributeJson: [
            { name: '颜色', value: color },
            { name: '规格', value: resolvedSpec },
          ],
        },
      })
      console.log('updated sku', sku.skuCode, color, resolvedSpec)
    }
  }

  const pending = await p.importtaskitem.findMany({
    where: {
      isPublished: false,
      OR: [
        { parsedName: { contains: '发财包' } },
        { parsedName: { contains: '手柄woc' } },
      ],
    },
  })
  for (const item of pending) {
    const preview = item.previewDataJson || {}
    const images = [
      preview.mainImageUrl,
      ...((preview.detailImages || []).filter(Boolean)),
    ].filter(Boolean)
    const buckets = new Map()
    for (const url of images) {
      const label = await sampleLabel(url)
      if (!label || label === '银色') continue
      if (!buckets.has(label)) buckets.set(label, url)
    }
    if (!buckets.has('白色')) {
      const whiteGuess = images.find((url) => /f5514b62/i.test(url))
      if (whiteGuess) buckets.set('白色', whiteGuess)
    }
    if (!buckets.has('黑色')) {
      const blackGuess = images.find((url) => /abfce234/i.test(url))
      if (blackGuess) buckets.set('黑色', blackGuess)
    }
    const colors = ['黑色', '白色'].filter((label) => buckets.has(label))
    if (colors.length < 2) continue
    const spec =
      String((preview.skuTable || [])[0]?.attributes?.find((attr) => attr.name === '规格')?.value || '')
        .replace(/\s*副本\d*$/u, '')
        .trim() || '19*4*12cm'
    const cost = Number(item.costPrice) || 0
    const price = Number(item.cnyPriceMin) || cost
    const stock = Number(item.availableStock) || 0
    const weight = item.weightGrams == null ? null : Number(item.weightGrams)
    const skuTable = colors.map((label, index) => ({
      skuKey: `sku-${index + 1}`,
      spec: `${label} / ${spec}`,
      costPrice: cost,
      price,
      stock,
      weightGrams: weight,
      imageUrl: buckets.get(label),
      attributes: [
        { name: '颜色', value: label },
        { name: '规格', value: spec },
      ],
    }))
    await p.importtaskitem.update({
      where: { id: item.id },
      data: {
        skuSummaryText: colors.map((label) => `${label} / ${spec}`).join(' | '),
        specSummaryJson: [
          { name: '颜色', values: colors },
          { name: '规格', values: [spec] },
        ],
        previewDataJson: {
          ...preview,
          colors: colors.map((label) => ({ label, imageUrl: buckets.get(label) })),
          sizesByColor: { [colors[0]]: [spec], [colors[1]]: [spec] },
          skuTable,
        },
      },
    })
    console.log('pending', item.id, colors.join('/'))
  }
  await p.$disconnect()
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
