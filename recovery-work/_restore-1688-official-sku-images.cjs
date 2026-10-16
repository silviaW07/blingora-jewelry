/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')
const repoRoot = path.resolve(__dirname, '..')
process.chdir(repoRoot)
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
})
require('tsconfig-paths/register')

const TARGETS = [
  { code: 'EARR2026090045', offerId: '1053930216406' },
  { code: 'JEWE2026090123', offerId: '1046933781059' },
]

function readCookie() {
  const files = [
    path.join(repoRoot, 'secrets', '1688-cookie.txt'),
    '/home/admin/my-website/blingora-jewelry/secrets/1688-cookie.txt',
  ]
  for (const file of files) {
    try {
      const text = fs.readFileSync(file, 'utf8').trim()
      if (text) return text
    } catch {
      // continue
    }
  }
  return process.env.COOKIE_1688 || process.env.ALIBABA_COOKIE || ''
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function pickLabel(raw) {
  const record = asRecord(raw)
  if (!record) return String(raw || '').trim()
  return String(
    record.name ||
      record.value ||
      record.text ||
      record.label ||
      record.attributeValue ||
      record.originalValueName ||
      '',
  ).trim()
}

function pickImage(raw) {
  const record = asRecord(raw)
  if (!record) return ''
  const nested = asRecord(record.image) || asRecord(record.img) || asRecord(record.picture)
  const candidates = [
    record.imageUrl,
    record.imgUrl,
    record.image,
    record.img,
    record.skuImage,
    record.pictureUrl,
    record.picUrl,
    nested?.url,
    nested?.imageUrl,
    nested?.src,
  ]
  for (const candidate of candidates) {
    const url = String(candidate || '').trim()
    if (!url || /video|mp4|m3u8/i.test(url)) continue
    if (!/^https?:\/\//i.test(url) && url.startsWith('//')) return `https:${url}`
    if (/^https?:\/\//i.test(url)) return url
  }
  return ''
}

function collectOfficialColorImages(node, acc = new Map(), seen = new Set()) {
  if (!node || typeof node !== 'object') return acc
  if (seen.has(node)) return acc
  seen.add(node)
  const record = asRecord(node)
  const props = Array.isArray(node)
    ? node
    : record?.skuProps || record?.sku_props || record?.skuPropList || null
  if (Array.isArray(props)) {
    for (const prop of props) {
      const propName = String(prop?.prop || prop?.name || prop?.attributeName || '').trim()
      const values = Array.isArray(prop?.values)
        ? prop.values
        : Array.isArray(prop?.value)
          ? prop.value
          : []
      const imageHits = values.filter((value) => pickImage(value)).length
      const looksColor =
        /颜色|色彩|色号|花色|color|colour|规格|款式/i.test(propName) || imageHits >= 2
      if (!looksColor) continue
      for (const value of values) {
        const label = pickLabel(value)
        const url = pickImage(value)
        if (label && url && !acc.has(label)) acc.set(label, url)
      }
    }
  }
  if (Array.isArray(node)) {
    for (const item of node) collectOfficialColorImages(item, acc, seen)
    return acc
  }
  for (const value of Object.values(node)) {
    collectOfficialColorImages(value, acc, seen)
  }
  return acc
}

function colorOf(attrs) {
  const hit = (Array.isArray(attrs) ? attrs : []).find((attr) =>
    /颜色|colour|color/i.test(String(attr?.name || '')),
  )
  return String(hit?.value || '').trim()
}

async function main() {
  const { fetch1688OfferViaMtop } = require(path.join(repoRoot, 'src/backend/parsers/1688MtopClient.ts'))
  const { PrismaClient } = require(path.join(repoRoot, 'prisma-generated/client'))
  const prisma = new PrismaClient()
  const cookie = readCookie()
  if (!cookie) throw new Error('missing 1688 cookie')

  const report = []
  for (const target of TARGETS) {
    const mtop = await fetch1688OfferViaMtop(target.offerId, cookie)
    const colors = mtop.ok ? collectOfficialColorImages(mtop.data) : new Map()
    const product = await prisma.product.findUnique({
      where: { productCode: target.code },
      select: {
        id: true,
        skus: { select: { id: true, imageUrl: true, attributeJson: true } },
      },
    })
    const updates = []
    for (const sku of product?.skus || []) {
      const color = colorOf(sku.attributeJson)
      const url = colors.get(color) || ''
      if (!url) continue
      if (sku.imageUrl === url) continue
      await prisma.productsku.update({
        where: { id: sku.id },
        data: { imageUrl: url },
      })
      updates.push({ color, url })
    }
    const pending = product
      ? await prisma.importtaskitem.findFirst({
          where: { importedProductId: product.id },
          select: { id: true, previewDataJson: true },
        })
      : null
    if (pending) {
      const preview = pending.previewDataJson || {}
      const nextColors = (preview.colors || []).map((row) => ({
        ...row,
        imageUrl: colors.get(String(row.label || '').trim()) || row.imageUrl || null,
      }))
      const nextSkuTable = (preview.skuTable || []).map((row) => {
        const color = colorOf(row.attributes)
        return {
          ...row,
          imageUrl: (color && colors.get(color)) || row.imageUrl || null,
        }
      })
      await prisma.importtaskitem.update({
        where: { id: pending.id },
        data: {
          previewDataJson: {
            ...preview,
            colors: nextColors,
            skuTable: nextSkuTable,
          },
        },
      })
    }
    report.push({
      code: target.code,
      mtopOk: mtop.ok,
      mtopReason: mtop.ok ? undefined : mtop.reason,
      officialColors: Object.fromEntries(colors),
      updates,
    })
  }
  console.log(JSON.stringify(report, null, 2))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
