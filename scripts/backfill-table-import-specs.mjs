/**
 * Backfill TABLE_IMPORT product SKU color/size from import-ready table.
 * Does NOT re-import or delete products. Updates attributeJson + sizeLabel in place;
 * only creates extra SKUs when a product currently has a single placeholder SKU.
 *
 * Usage on server:
 *   node scripts/backfill-table-import-specs.mjs --dry-run
 *   node scripts/backfill-table-import-specs.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '../prisma-generated/client/index.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = path.join(root, 'import-ready', '旧站2026-批量导入.csv')
const jsonCandidates = [
  path.join(root, 'import-ready', 'spec-pairs.json'),
  path.join(root, 'scripts', 'data', 'table-import-spec-pairs.json'),
]
const jsonPath = jsonCandidates.find((p) => fs.existsSync(p)) || jsonCandidates[0]
const dryRun = process.argv.includes('--dry-run')
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.slice(8) || 0)

function loadDotEnv() {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

loadDotEnv()
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing')
  process.exit(1)
}

const prisma = new PrismaClient()

const DIMENSION_RE = /^\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){1,3}$/
const PACKED_RE = /^(.+?)\s*[-–—]\s*(\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){1,3})$/
const LOOSE_PACKED_RE =
  /^(.+?)\s*[-–—]\s*((?:大号|中号|小号|均码|plus)?\s*\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){0,3}\s*(?:cm|mm|m|oz|ml|l|g|kg)?)$/i
const LOOSE_SIZE_RE = /^(.+?)-((?:\d.*)|(?:.*(?:oz|ml|cm|mm)\b.*))$/i

const isPlaceholder = (value) =>
  /^(默认|默认规格|default|standard|n\/a|none|-|—|－)?$/i.test(String(value || '').trim())

const normalizeDim = (raw) => String(raw || '').replace(/\s+/g, '').replace(/[xX×]/g, '*')

function parsePacked(raw) {
  const text = String(raw || '').trim()
  if (!text) return null
  const packed = text.match(PACKED_RE) || text.match(LOOSE_PACKED_RE)
  if (packed) return { color: packed[1].trim(), size: normalizeDim(packed[2]) }
  if (DIMENSION_RE.test(text)) return { color: '', size: normalizeDim(text) }
  const loose = text.match(LOOSE_SIZE_RE)
  if (loose) return { color: loose[1].trim(), size: normalizeDim(loose[2]) }
  return null
}

function imageKey(url) {
  const s = String(url || '').trim().split('?')[0]
  if (!s) return ''
  const parts = s.split(/[/\\]/)
  return (parts[parts.length - 1] || '').toLowerCase()
}

function asPair(row) {
  if (Array.isArray(row)) {
    return {
      color: String(row[0] || '').trim(),
      spec: String(row[1] || '').trim(),
      image: String(row[2] || '').trim(),
      price: row[3] === '' || row[3] == null ? null : Number(row[3]),
      weight: row[4] === '' || row[4] == null ? null : Number(row[4]),
    }
  }
  return {
    color: String(row?.color || row?.[0] || '').trim(),
    spec: String(row?.spec || row?.[1] || '').trim(),
    image: String(row?.image || row?.[2] || '').trim(),
    price: null,
    weight: null,
  }
}

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i += 1
        } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

function unpackPair(colorRaw, specRaw) {
  const color = String(colorRaw || '').trim()
  const spec = String(specRaw || '').trim()
  const fromSpec = parsePacked(spec)
  if (fromSpec?.size) {
    return {
      color: fromSpec.color || color,
      spec: fromSpec.size,
    }
  }
  const fromColor = parsePacked(color)
  if (fromColor?.size) {
    return {
      color: fromColor.color || '',
      spec: spec || fromColor.size,
    }
  }
  return { color, spec }
}

function loadTableVariantsFromJson() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const map = new Map()
  const imageToCode = new Map()
  for (const [code, rows] of Object.entries(raw || {})) {
    const pairs = []
    for (const row of rows || []) {
      const base = asPair(row)
      const pair = { ...base, ...unpackPair(base.color, base.spec) }
      const key = `${pair.color}::${pair.spec}::${imageKey(pair.image)}`
      if (!pairs.some((p) => `${p.color}::${p.spec}::${imageKey(p.image)}` === key) && (pair.color || pair.spec)) {
        pairs.push(pair)
      }
    }
    map.set(code, { pairs, images: pairs.map((p) => p.image).filter(Boolean), names: [] })
  }
  return { map, imageToCode }
}

function loadTableVariants() {
  if (fs.existsSync(jsonPath)) {
    return loadTableVariantsFromJson()
  }
  if (!fs.existsSync(csvPath)) throw new Error(`Missing ${csvPath} or ${jsonPath}`)
  const text = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const header = parseCsvLine(lines[0]).map((c) => c.trim())
  const idx = (name) => header.indexOf(name)
  const codeI = idx('产品编号')
  const colorI = idx('颜色')
  const specI = idx('规格')
  const imgI = idx('图片')
  const nameI = idx('名称')
  if (codeI < 0) throw new Error('CSV missing 产品编号')

  /** @type {Map<string, { pairs: Array<{color:string, spec:string}>, images: string[], names: string[] }>} */
  const map = new Map()
  /** @type {Map<string, string>} */
  const imageToCode = new Map()

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line)
    const code = String(cols[codeI] || '').trim()
    if (!code) continue
    const img = String(imgI >= 0 ? cols[imgI] || '' : '').trim()
    const pair = {
      ...unpackPair(cols[colorI], cols[specI]),
      image: img,
      price: null,
      weight: null,
    }
    if (!map.has(code)) map.set(code, { pairs: [], images: [], names: [] })
    const rec = map.get(code)
    const key = `${pair.color}::${pair.spec}::${imageKey(pair.image)}`
    if (!rec.pairs.some((p) => `${p.color}::${p.spec}::${imageKey(p.image)}` === key) && (pair.color || pair.spec)) {
      rec.pairs.push(pair)
    }
    if (img && !rec.images.includes(img)) rec.images.push(img)
    if (img && !imageToCode.has(img)) imageToCode.set(img, code)
    const name = String(nameI >= 0 ? cols[nameI] || '' : '').trim()
    if (name && !rec.names.includes(name)) rec.names.push(name)
  }
  return { map, imageToCode }
}

function attrsOf(sku) {
  return Array.isArray(sku.attributeJson) ? sku.attributeJson : []
}

function skuColor(sku) {
  const hit = attrsOf(sku).find((a) => /颜色|colour|color/i.test(String(a?.name || '')))
  return String(hit?.value || '').trim()
}

function skuHasRealSpec(sku) {
  if (sku.sizeLabel && !isPlaceholder(sku.sizeLabel)) return true
  return attrsOf(sku).some(
    (a) =>
      /规格|尺码|尺寸|size|spec/i.test(String(a?.name || '')) &&
      a?.value &&
      !isPlaceholder(a.value),
  )
}

function skuHasRealOption(sku) {
  if (skuHasRealSpec(sku)) return true
  const color = skuColor(sku)
  if (!color || isPlaceholder(color)) return false
  if (parsePacked(color)?.size) return false
  return true
}

function buildAttrs(color, spec) {
  const attrs = []
  if (color) attrs.push({ name: '颜色', value: color })
  if (spec) attrs.push({ name: '规格', value: spec })
  if (attrs.length === 0) attrs.push({ name: '规格', value: '默认规格' })
  return attrs
}

function pairsFromPreview(preview) {
  const table = Array.isArray(preview?.skuTable) ? preview.skuTable : []
  const out = []
  const seen = new Set()
  for (const row of table) {
    const attrs = Array.isArray(row.attributes) ? row.attributes : []
    const color =
      attrs.find((a) => /颜色|colour|color/i.test(String(a?.name || '')))?.value || ''
    const spec =
      attrs.find((a) => /规格|尺码|尺寸|size|spec/i.test(String(a?.name || '')))?.value ||
      String(row.spec || '')
    const pair = unpackPair(color, spec)
    if (!pair.color && !pair.spec) continue
    if (isPlaceholder(pair.spec) && !pair.color) continue
    const key = `${pair.color}::${pair.spec}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(pair)
  }
  return out
}

function isRealSizeSpec(spec, color) {
  const value = String(spec || '').trim()
  if (!value || isPlaceholder(value)) return false
  if (color && value === color) return false
  return (
    DIMENSION_RE.test(value) ||
    /\d+\s*[xX×*]\s*\d+/.test(value) ||
    /\d+\s*(cm|mm|oz|ml|l)\b/i.test(value) ||
    /^\d+(?:\.\d+)?(?:cm|mm)?$/i.test(value)
  )
}

function pickPairs(excelRec, preview) {
  const allExcel = excelRec?.pairs || []
  const sized = allExcel.filter((p) => isRealSizeSpec(p.spec, p.color))
  if (sized.length > 0) return sized
  const colored = allExcel.filter((p) => p.color && !isPlaceholder(p.color))
  if (colored.length > 0) return colored
  const fromPreview = pairsFromPreview(preview)
  const previewSized = fromPreview.filter((p) => isRealSizeSpec(p.spec, p.color))
  if (previewSized.length > 0) return previewSized
  return fromPreview.filter((p) => p.color && !isPlaceholder(p.color))
}

function resolvePairImage(pair, template, galleryUrls) {
  const raw = String(pair?.image || '').trim()
  if (/^https?:\/\//i.test(raw)) return raw
  const key = imageKey(raw)
  if (key) {
    const fromGallery = galleryUrls.find((url) => imageKey(url) === key)
    if (fromGallery) return fromGallery
    const templateUrl = String(template?.imageUrl || '')
    if (templateUrl) {
      const replaced = templateUrl.replace(/[^/?#]+(?=[?#]|$)/, raw)
      if (replaced && replaced !== templateUrl) return replaced
    }
  }
  return template?.imageUrl || galleryUrls[0] || ''
}

async function main() {
  console.log(dryRun ? 'DRY-RUN' : 'APPLY', fs.existsSync(csvPath) ? csvPath : jsonPath)
  const { map: excelMap, imageToCode } = loadTableVariants()
  console.log('Excel products:', excelMap.size)

  const items = await prisma.importtaskitem.findMany({
    where: {
      sourceUrl: { startsWith: 'table-import://' },
      importedProductId: { not: null },
    },
    select: {
      sourceUrl: true,
      importedProductId: true,
      previewDataJson: true,
      skuSummaryText: true,
    },
  })
  console.log('Published table-import items:', items.length)

  /** @type {Map<string, { code: string, preview: any }>} */
  const productMatch = new Map()
  for (const item of items) {
    const code = String(item.sourceUrl || '').replace(/^table-import:\/\//i, '').trim()
    if (!code || !item.importedProductId) continue
    productMatch.set(item.importedProductId, {
      code,
      preview: item.previewDataJson || {},
    })
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { source: 'TABLE_IMPORT' },
        { id: { in: Array.from(productMatch.keys()) } },
      ],
    },
    select: {
      id: true,
      name: true,
      productCode: true,
      mainImageUrl: true,
      galleryJson: true,
      parameterJson: true,
      source: true,
      skus: {
        select: {
          id: true,
          skuCode: true,
          attributeJson: true,
          sizeLabel: true,
          price: true,
          originalPrice: true,
          stock: true,
          stockStatus: true,
          weightKg: true,
          imageUrl: true,
          minOrderQty: true,
        },
      },
    },
  })
  console.log('Candidate products:', products.length)

  let needFix = 0
  let updatedProducts = 0
  let updatedSkus = 0
  let createdSkus = 0
  let skippedNoPairs = 0
  let skippedAlreadyOk = 0
  let unmatched = 0

  const usedSkuCodes = new Set(
    products.flatMap((p) => p.skus.map((s) => s.skuCode)),
  )

  const targets = LIMIT > 0 ? products.slice(0, LIMIT) : products

  for (const product of targets) {
    const matched = productMatch.get(product.id)
    let code = matched?.code || ''
    if (!code && Array.isArray(product.parameterJson)) {
      for (const group of product.parameterJson) {
        const hit = (group?.items || []).find((it) => it?.key === '产品编号')
        if (hit?.value) {
          code = String(hit.value).trim()
          break
        }
      }
    }
    if (!code && product.productCode && excelMap.has(product.productCode)) {
      code = product.productCode
    }
    if (!code && product.mainImageUrl && imageToCode.has(product.mainImageUrl)) {
      code = imageToCode.get(product.mainImageUrl)
    }
    if (!code && product.mainImageUrl) {
      const mainKey = imageKey(product.mainImageUrl)
      for (const [nextCode, rec] of excelMap) {
        if ((rec.pairs || []).some((p) => imageKey(p.image) === mainKey)) {
          code = nextCode
          break
        }
      }
    }

    const excelRec = code ? excelMap.get(code) : null
    const pairs = pickPairs(excelRec, matched?.preview)
    const allHaveRealSpec = product.skus.length > 0 && product.skus.every(skuHasRealSpec)
    if (allHaveRealSpec && pairs.length <= product.skus.length) {
      skippedAlreadyOk += 1
      continue
    }
    if (pairs.length === 0 || pairs.every((p) => !p.color && (!p.spec || isPlaceholder(p.spec)))) {
      if (!skuHasRealOption(product.skus[0] || {})) unmatched += 1
      skippedNoPairs += 1
      continue
    }

    needFix += 1
    const template = product.skus[0]
    if (!template) {
      skippedNoPairs += 1
      continue
    }

    const galleryUrls = [
      product.mainImageUrl,
      ...(Array.isArray(product.galleryJson)
        ? product.galleryJson.map((item) => item?.url || item).filter(Boolean)
        : []),
      ...product.skus.map((sku) => sku.imageUrl).filter(Boolean),
    ].filter(Boolean)

    const remaining = [...product.skus]
    const plan = []
    for (const pair of pairs) {
      const imgK = imageKey(pair.image)
      let idx = imgK ? remaining.findIndex((s) => imageKey(s.imageUrl) === imgK) : -1
      if (idx < 0 && pair.color) idx = remaining.findIndex((s) => skuColor(s) === pair.color)
      if (idx < 0) idx = remaining.findIndex((s) => !skuHasRealOption(s))
      const existing = idx >= 0 ? remaining.splice(idx, 1)[0] : null
      plan.push({ pair, existing })
    }

    if (dryRun) {
      updatedProducts += 1
      updatedSkus += plan.filter((p) => p.existing).length
      createdSkus += plan.filter((p) => !p.existing).length
      if (needFix <= 8) {
        console.log(
          `- ${product.productCode}  ${product.name?.slice(0, 40)}  pairs=${pairs.length}  ` +
            `update=${plan.filter((p) => p.existing).length} create=${plan.filter((p) => !p.existing).length}  ` +
            `e.g. ${pairs[0].color || '-'} / ${pairs[0].spec || '-'}`,
        )
      }
      continue
    }

    for (let i = 0; i < plan.length; i += 1) {
      const { pair, existing } = plan[i]
      const attrs = buildAttrs(pair.color, pair.spec)
      const sizeLabel = pair.spec ? String(pair.spec).slice(0, 60) : null
      const imageUrl = resolvePairImage(pair, existing || template, galleryUrls)
      const nextPrice =
        Number.isFinite(pair.price) && pair.price > 0 ? pair.price : existing?.price || template.price
      const nextWeight =
        Number.isFinite(pair.weight) && pair.weight > 0
          ? Number((pair.weight / 1000).toFixed(3))
          : existing?.weightKg || template.weightKg
      if (existing) {
        await prisma.productsku.update({
          where: { id: existing.id },
          data: {
            attributeJson: attrs,
            sizeLabel,
            ...(existing.imageUrl ? {} : { imageUrl }),
          },
        })
        updatedSkus += 1
      } else {
        let skuCode = `${product.productCode}-${String(i + 1).padStart(2, '0')}`
        if (usedSkuCodes.has(skuCode)) {
          skuCode = `${skuCode}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        }
        usedSkuCodes.add(skuCode)
        await prisma.productsku.create({
          data: {
            productId: product.id,
            skuCode,
            imageUrl: imageUrl || template.imageUrl,
            minOrderQty: template.minOrderQty,
            price: nextPrice,
            originalPrice: existing?.originalPrice || template.originalPrice,
            stock: template.stock || 1000,
            stockStatus: 'IN_STOCK',
            attributeJson: attrs,
            sizeLabel,
            weightKg: nextWeight,
          },
        })
        createdSkus += 1
      }
    }
    const specValues = [
      ...new Set(
        pairs
          .map((p) => String(p.spec || '').trim())
          .filter((s) => s && !isPlaceholder(s)),
      ),
    ]
    if (specValues.length > 0) {
      const existingGroups = Array.isArray(product.parameterJson) ? product.parameterJson : []
      const hasSpecKey = existingGroups.some((g) =>
        (g?.items || []).some(
          (it) =>
            /规格|尺码|尺寸|size|spec/i.test(String(it?.key || '')) &&
            String(it?.value || '').trim(),
        ),
      )
      if (!hasSpecKey) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            parameterJson: [
              ...existingGroups.filter((g) => Array.isArray(g?.items) && g.items.length > 0),
              { group: '基本参数', items: [{ key: '规格', value: specValues.join(' / ') }] },
            ],
          },
        })
      }
    }
    updatedProducts += 1
    if (updatedProducts % 100 === 0) {
      console.log(`... ${updatedProducts} products patched`)
    }
  }

  // Second pass: split leftover SKUs like 颜色="蓝色-大号43*33*13cm"
  let unpacked = 0
  const leftoverProducts = await prisma.product.findMany({
    where: { source: 'TABLE_IMPORT' },
    select: {
      id: true,
      productCode: true,
      skus: { select: { id: true, attributeJson: true, sizeLabel: true } },
    },
  })
  for (const product of leftoverProducts) {
    for (const sku of product.skus) {
      if (skuHasRealSpec(sku)) continue
      const color = skuColor(sku)
      const packed = parsePacked(color)
      if (!packed?.size) continue
      const attrs = buildAttrs(packed.color, packed.size)
      if (dryRun) {
        unpacked += 1
        continue
      }
      await prisma.productsku.update({
        where: { id: sku.id },
        data: {
          attributeJson: attrs,
          sizeLabel: packed.size.slice(0, 60),
        },
      })
      unpacked += 1
    }
  }
  console.log('unpackedPackedColorSkus', unpacked)

  console.log(
    JSON.stringify(
      {
        dryRun,
        excelProducts: excelMap.size,
        candidates: products.length,
        alreadyOk: skippedAlreadyOk,
        needFix,
        updatedProducts,
        updatedSkus,
        createdSkus,
        skippedNoPairs,
        unmatched,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
