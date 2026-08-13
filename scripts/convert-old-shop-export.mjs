/**
 * Convert old happy_shop exports (产品名称.xlsx + sku.xls) into site batch-import Excel.
 *
 * Usage:
 *   node scripts/convert-old-shop-export.mjs
 *   node scripts/convert-old-shop-export.mjs --image-base=https://cdn.example.com/
 */
import XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const imageBaseArg = args.find((a) => a.startsWith('--image-base='))
const rawImageBase = (
  imageBaseArg
    ? imageBaseArg.slice('--image-base='.length)
    : process.env.OLD_SHOP_IMAGE_BASE || 'https://hspi.oss-us-west-1.aliyuncs.com/'
).trim()
const IMAGE_BASE = rawImageBase ? rawImageBase.replace(/\/?$/, '/') : ''

const HEADERS = ['产品编号', '产品价格', '名称', '品牌', '供应商', '类目', '颜色', '规格', '重量', '图片', '成本价']

function extractHsCode(name) {
  const m = String(name || '').match(/^([A-Za-z]{2,}\d+)/)
  return m ? m[1].toUpperCase() : ''
}

/** Strip leading old SPU code from title; keep brand + description only. */
function stripHsFromName(name) {
  return String(name || '')
    .replace(/^[A-Za-z]{2,}\d+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractBrand(name) {
  const rest = stripHsFromName(name)
  if (!rest) return ''
  // first token before 起批 / digits / Chinese punctuation
  const m = rest.match(/^([A-Za-z][A-Za-z0-9.&'\-]{0,40}|[\u4e00-\u9fff]{1,12})/)
  if (!m) return ''
  const brand = m[1].trim()
  if (/^\d+$/.test(brand)) return ''
  if (/起批|个起|件起/.test(brand)) return ''
  return brand
}

const LOOSE_PACKED_RE =
  /^(.+?)\s*[-–—]\s*((?:大号|中号|小号|均码|plus)?\s*\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){0,3}\s*(?:cm|mm|m|oz|ml|l|g|kg)?)$/i

function parseSupplySpec(raw) {
  const text = String(raw || '').trim()
  if (!text) return { color: '', spec: '' }
  // 颜色1-10*10*2 / 黑色-23*14*7 / 巴宝莉套盒-105cm / 扣-95 / 蓝色-大号43*33*13cm
  const packed = text.match(/^(.+?)\s*[-–—]\s*(\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){1,3})$/) || text.match(LOOSE_PACKED_RE)
  if (packed) {
    return {
      color: packed[1].trim(),
      spec: packed[2].replace(/\s+/g, '').replace(/[xX×]/g, '*'),
    }
  }
  if (/^\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){1,3}$/.test(text)) {
    return { color: '', spec: text.replace(/\s+/g, '').replace(/[xX×]/g, '*') }
  }
  // 颜色1 / 白色 — 只填颜色，规格留空
  return { color: text, spec: '' }
}

function imageBasename(rel) {
  const s = String(rel || '').trim().split('?')[0]
  if (!s) return ''
  const parts = s.split(/[/\\]/)
  return parts[parts.length - 1] || ''
}

function toImageUrl(rel) {
  const s = String(rel || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (!IMAGE_BASE) return '' // relative paths are not usable on new site
  return `${IMAGE_BASE}${s.replace(/^\//, '')}`
}

console.log('Reading 产品名称.xlsx ...')
const prodWb = XLSX.readFile(path.join(root, '产品名称.xlsx'), { cellDates: true })
const prodRows = XLSX.utils.sheet_to_json(prodWb.Sheets[prodWb.SheetNames[0]], { header: 1, defval: '' })
const zhByPid = new Map()
for (const r of prodRows.slice(1)) {
  if (String(r[2]) !== '1') continue
  const pid = String(r[1])
  const name = String(r[3] || '').trim()
  if (!pid || !name) continue
  const displayName = stripHsFromName(name) || name
  zhByPid.set(pid, {
    name: displayName,
    productCode: extractHsCode(name) || `P${pid}`,
    brand: extractBrand(name),
  })
}
console.log('Chinese products:', zhByPid.size)

console.log('Reading sku.xls (large, may take a minute) ...')
const skuWb = XLSX.readFile(path.join(root, 'sku.xls'), { cellDates: true })
const skuRows = XLSX.utils.sheet_to_json(skuWb.Sheets[skuWb.SheetNames[0]], { header: 1, defval: '' })

const out = [HEADERS]
const specPairs = {}
const colorSeqByPid = new Map()
let skippedNoProduct = 0
let skippedNoWeight = 0
let withImage = 0
let packedSplit = 0
let colorOnly = 0
let synthesizedColor = 0

for (const r of skuRows.slice(1)) {
  const pid = String(r[1] || '').trim()
  if (!pid) continue
  const product = zhByPid.get(pid)
  if (!product) {
    skippedNoProduct += 1
    continue
  }
  const weight = Number(r[7])
  if (!Number.isFinite(weight) || weight <= 0) {
    skippedNoWeight += 1
    continue
  }
  const price = Number(r[9])
  const cost = Number(r[12])
  let { color, spec } = parseSupplySpec(r[17])
  if (!color && !spec) {
    const n = (colorSeqByPid.get(pid) || 0) + 1
    colorSeqByPid.set(pid, n)
    color = `颜色${n}`
    synthesizedColor += 1
  } else if (spec) {
    packedSplit += 1
  } else {
    colorOnly += 1
  }
  const image = toImageUrl(r[8])
  if (image) withImage += 1

  out.push([
    product.productCode,
    Number.isFinite(price) ? price : '',
    product.name,
    product.brand,
    '', // 供应商 — 旧表导出未含
    '', // 类目 — 上传时在后台选默认主分类
    color,
    spec,
    weight,
    image,
    Number.isFinite(cost) ? cost : '',
  ])

  const code = product.productCode
  if (!specPairs[code]) specPairs[code] = []
  specPairs[code].push([
    color,
    spec,
    imageBasename(r[8]),
    Number.isFinite(price) ? price : '',
    Number.isFinite(weight) ? weight : '',
  ])
}

console.log('Output rows (excl header):', out.length - 1)
console.log('Skipped no product:', skippedNoProduct, 'no weight:', skippedNoWeight)
console.log('Packed split:', packedSplit, 'color-only:', colorOnly, 'synthesized 颜色N:', synthesizedColor)
console.log('Rows with image URL:', withImage, IMAGE_BASE ? `(base=${IMAGE_BASE})` : '(no --image-base; 图片列留空)')

const outDir = path.join(root, 'import-ready')
fs.mkdirSync(outDir, { recursive: true })

const xlsxPath = path.join(outDir, '旧站2026-批量导入.xlsx')
const csvPath = path.join(outDir, '旧站2026-批量导入.csv')

console.log('Writing xlsx ...')
const sheet = XLSX.utils.aoa_to_sheet(out)
const wbOut = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wbOut, sheet, 'import')
XLSX.writeFile(wbOut, xlsxPath)

console.log('Writing csv (utf-8 bom) ...')
const csv = out
  .map((row) =>
    row
      .map((cell) => {
        const s = cell == null ? '' : String(cell)
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
        return s
      })
      .join(',')
  )
  .join('\n')
try {
  fs.writeFileSync(csvPath, `\uFEFF${csv}`, 'utf8')
} catch (err) {
  if (err && err.code === 'EBUSY') {
    console.warn('CSV locked (close Excel if open), skipped:', csvPath)
  } else {
    throw err
  }
}

const jsonPath = path.join(root, 'scripts', 'data', 'table-import-spec-pairs.json')
fs.mkdirSync(path.dirname(jsonPath), { recursive: true })
fs.writeFileSync(jsonPath, JSON.stringify(specPairs))
console.log('Spec pairs:', Object.keys(specPairs).length, 'products →', jsonPath)

console.log('Done:')
console.log(' ', xlsxPath)
console.log(' ', csvPath)
console.log(' ', jsonPath)
