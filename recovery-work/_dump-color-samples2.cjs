require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
const { PrismaClient } = require('/home/admin/my-website/blingora-jewelry/prisma-generated/client')
const { analyzeYupooAlbumImages } = require('/home/admin/my-website/blingora-jewelry/src/backend/lib/clusterYupooColorSkus.ts')
const { nameProductColorFromRgb } = require('/home/admin/my-website/blingora-jewelry/src/shared/yupooColorSkus.ts')
const sharp = require('sharp')
const { readUploadImageBytes } = require('/home/admin/my-website/blingora-jewelry/src/backend/lib/detectBrandFromBackdropImage.ts')
const { measureBoxPackShare, measureProductClusters } = require('/home/admin/my-website/blingora-jewelry/src/shared/yupooColorSkus.ts')

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
  if (!bytes) return { tail: url.slice(-36), err: 'no-bytes' }
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
  const pack = measureBoxPackShare(data, info.width, info.height)
  const clusters = measureProductClusters(data, info.width, info.height)
  if (n < 20) {
    return { tail: url.slice(-36), n, err: 'too-white', pack: pack.packShot, group: clusters.groupShot, objects: clusters.objects }
  }
  r /= n; g /= n; b /= n
  const hsv = rgbToHsv(r, g, b)
  return {
    tail: url.slice(-36),
    rgb: [Math.round(r), Math.round(g), Math.round(b)],
    hsv: [Math.round(hsv.h), Number(hsv.s.toFixed(2)), Number(hsv.v.toFixed(2))],
    label: nameProductColorFromRgb(r, g, b),
    pack: pack.packShot,
    group: clusters.groupShot,
    objects: clusters.objects,
  }
}

const prisma = new PrismaClient()
;(async () => {
  const rows = await prisma.importtaskitem.findMany({
    where: {
      isPublished: false,
      OR: [
        { sourceUrl: { contains: '_dsqkBzBvgk' } },
        { parsedName: { contains: 'N09811' } },
        { parsedName: { contains: '09811' } },
        { parsedName: { contains: 'Louis' } },
      ],
    },
    select: { parsedName: true, previewDataJson: true, sourceUrl: true },
    take: 8,
  })
  console.log('hit', rows.map((r) => (r.parsedName || r.sourceUrl || '').slice(0, 48)))
  for (const row of rows) {
    const preview = row.previewDataJson || {}
    const urls = [...new Set([preview.mainImageUrl, ...(preview.detailImages || [])].filter(Boolean))]
    console.log('\n===', String(row.parsedName || row.sourceUrl || '').slice(0, 50), 'n=', urls.length)
    for (const url of urls) console.log(JSON.stringify(await sample(url)))
    const analysis = await analyzeYupooAlbumImages(urls, { albumTitle: row.parsedName })
    console.log('GROUPS', analysis.groups.map((g) => `${g.label}/${g.extraImageUrls.length}`), 'groupShots', analysis.groupShotUrls.length)
  }
  await prisma.$disconnect()
})().catch((e) => { console.error(e); process.exit(1) })
