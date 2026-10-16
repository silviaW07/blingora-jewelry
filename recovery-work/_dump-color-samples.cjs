require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const { analyzeYupooAlbumImages } = require('/home/admin/my-website/blingora-jewelry/src/backend/lib/clusterYupooColorSkus.ts')
const { nameProductColorFromRgb } = require('/home/admin/my-website/blingora-jewelry/src/shared/yupooColorSkus.ts')
const sharp = require('sharp')
const { readUploadImageBytes } = require('/home/admin/my-website/blingora-jewelry/src/backend/lib/detectBrandFromBackdropImage.ts')

function rgbToHsv(r, g, b) {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb), d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

async function sample(url) {
  const bytes = await readUploadImageBytes(url)
  if (!bytes) return { url, err: 'no-bytes' }
  const { data, info } = await sharp(bytes).rotate().resize(96, 96, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let r = 0, g = 0, b = 0, n = 0
  const x0 = Math.floor(info.width * 0.22), x1 = Math.ceil(info.width * 0.78)
  const y0 = Math.floor(info.height * 0.22), y1 = Math.ceil(info.height * 0.72)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * info.width + x) * 3
      const pr = data[i], pg = data[i + 1], pb = data[i + 2]
      const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb)
      const sat = max === 0 ? 0 : (max - min) / max
      const val = max / 255
      if (val > 0.9 && sat < 0.08) continue
      if (val < 0.06) continue
      r += pr; g += pg; b += pb; n++
    }
  }
  if (n < 20) return { url: url.slice(-40), n, err: 'too-white' }
  r /= n; g /= n; b /= n
  const hsv = rgbToHsv(r, g, b)
  return {
    tail: url.slice(-48),
    n,
    r: Math.round(r), g: Math.round(g), b: Math.round(b),
    h: Math.round(hsv.h), s: Number(hsv.s.toFixed(2)), v: Number(hsv.v.toFixed(2)),
    label: nameProductColorFromRgb(r, g, b),
  }
}

const prisma = new PrismaClient()
;(async () => {
  const rows = await prisma.importtaskitem.findMany({
    where: {
      isPublished: false,
      OR: [
        { sourceUrl: { contains: '_dsqkBzBvgk-TSsW3fSBO7ixBd5DiR4eY5xJgy2g' } },
        { parsedName: { contains: 'N09811' } },
        { parsedName: { contains: 'p205' } },
      ],
    },
    select: { parsedName: true, previewDataJson: true, sourceUrl: true },
    take: 6,
  })
  for (const row of rows) {
    const preview = row.previewDataJson || {}
    const urls = [preview.mainImageUrl, ...(preview.detailImages || [])].filter(Boolean)
    const unique = [...new Set(urls)]
    console.log('\n===', String(row.parsedName || '').slice(0, 40), 'n=', unique.length)
    for (const url of unique) {
      const s = await sample(url)
      console.log(JSON.stringify(s))
    }
    const analysis = await analyzeYupooAlbumImages(unique, { albumTitle: row.parsedName })
    console.log('GROUPS', analysis.groups.map((g) => `${g.label} extras=${g.extraImageUrls.length}`))
    console.log('groupShots', analysis.groupShotUrls.length)
  }
  await prisma.$disconnect()
})().catch((e) => { console.error(e); process.exit(1) })
