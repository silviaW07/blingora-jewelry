/**
 * Fixture test: richest skuProps/skuMap/skuList, video skip, full color list (incl. hidden).
 * Run: node scripts/test-1688-multi-spec-parse.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturePath = path.join(__dirname, 'fixtures', '1688-offer-multi-spec.html')

const tryParseJsonSlice = (slice) => {
  try {
    return JSON.parse(slice)
  } catch {
    return null
  }
}

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : null

const normalizeText = (value) => String(value ?? '').trim()

const decodeJsonLikeString = (value) =>
  String(value || '')
    .replace(/\\u002F/gi, '/')
    .replace(/\\"/g, '"')
    .replace(/&gt;/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&amp;/gi, '&')

const isLikely1688VideoAsset = (raw) => {
  const value = String(raw || '').trim()
  if (!value) return false
  const lower = value.toLowerCase()
  if (/\.(?:mp4|webm|m3u8|mov|flv|m4v|avi)(?:$|[?#])/i.test(lower)) return true
  if (/alivideo|aliplayer|video\.taobao|cloud\.video|tbvideo|videoplay|video-?cdn|\/video\/|\/videos\//i.test(lower)) {
    return true
  }
  return false
}

const is1688ColorPropName = (name) => {
  const normalized = String(name || '').trim().toLowerCase()
  if (!normalized) return false
  if (normalized === '尺码' || normalized === '尺寸' || normalized === '鞋码' || normalized === '码数' || normalized === 'size') {
    return false
  }
  return (
    normalized === '颜色' ||
    normalized === '颜色分类' ||
    normalized === '色彩' ||
    normalized === '花色' ||
    normalized === '花色分类' ||
    normalized === '色号' ||
    normalized === '色系' ||
    normalized === 'color' ||
    normalized === 'colour' ||
    normalized.includes('颜色') ||
    normalized.includes('花色') ||
    normalized.includes('color') ||
    normalized.includes('colour')
  )
}

const extractAllBalancedJsonValues = (html, key) => {
  const results = []
  const keyRe = new RegExp(`"${key}"\\s*:\\s*([\\[\\{])`, 'gi')
  let matched
  while ((matched = keyRe.exec(html))) {
    const startIdx = matched.index + matched[0].length - 1
    let depth = 0
    let inString = false
    let escaped = false
    for (let i = startIdx; i < html.length; i += 1) {
      const ch = html[i]
      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{' || ch === '[') depth += 1
      else if (ch === '}' || ch === ']') {
        depth -= 1
        if (depth === 0) {
          const parsed = tryParseJsonSlice(html.slice(startIdx, i + 1))
          if (parsed != null) results.push(parsed)
          keyRe.lastIndex = i + 1
          break
        }
      }
    }
  }
  return results
}

const extractJsonStringArrayField = (html, key) => {
  const urls = []
  const keyRe = new RegExp(`"${key}"\\s*:\\s*\\[`, 'gi')
  let matched
  while ((matched = keyRe.exec(html))) {
    const startIdx = matched.index + matched[0].length - 1
    let depth = 0
    let inString = false
    let escaped = false
    let endIdx = -1
    for (let i = startIdx; i < html.length; i += 1) {
      const ch = html[i]
      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '[') depth += 1
      else if (ch === ']') {
        depth -= 1
        if (depth === 0) {
          endIdx = i
          keyRe.lastIndex = i + 1
          break
        }
      }
    }
    if (endIdx < 0) continue
    const slice = html.slice(startIdx, endIdx + 1)
    const re = /"((?:\\.|[^"\\])*)"/g
    let item
    while ((item = re.exec(slice))) {
      const decoded = decodeJsonLikeString(item[1])
      if (!decoded || isLikely1688VideoAsset(decoded)) continue
      urls.push(decoded)
    }
  }
  return urls
}

const scoreSkuPropsRaw = (raw) => {
  if (!Array.isArray(raw)) return 0
  let colorValues = 0
  let imagedValues = 0
  let totalValues = 0
  for (const item of raw) {
    const record = asRecord(item)
    if (!record) continue
    const propName = normalizeText(
      record.prop ?? record.name ?? record.attributeName ?? record.fname ?? record.label ?? record.title,
    )
    const valueList = Array.isArray(record.value)
      ? record.value
      : Array.isArray(record.values)
        ? record.values
        : Array.isArray(record.items)
          ? record.items
          : Array.isArray(record.valueList)
            ? record.valueList
            : []
    totalValues += Math.max(valueList.length, 1)
    const imageHits = valueList.reduce((sum, entry) => {
      const row = asRecord(entry)
      if (!row) return sum
      const hasImage = Boolean(
        row.imageUrl || row.imgUrl || (typeof row.image === 'string' && row.image) || row.skuImage || row.pictureUrl || row.picUrl,
      )
      return hasImage ? sum + 1 : sum
    }, 0)
    imagedValues += imageHits
    if (is1688ColorPropName(propName) || (imageHits >= 2 && imageHits >= Math.ceil(valueList.length * 0.4))) {
      colorValues += valueList.length
    }
  }
  return colorValues * 10_000 + imagedValues * 100 + totalValues
}

const scoreSkuMapRaw = (raw) => {
  const record = asRecord(raw)
  return record ? Object.keys(record).length : 0
}

const build1688SkuListMapKey = (row) => {
  const specAttrsRaw =
    (typeof row.specAttrs === 'string' && row.specAttrs) ||
    (typeof row.skuAttrs === 'string' && row.skuAttrs) ||
    ''
  if (specAttrsRaw) {
    const parts = decodeJsonLikeString(specAttrsRaw)
      .replace(/&gt;/gi, '>')
      .split(/[;｜|]+/)
      .map((part) => {
        const trimmed = part.trim()
        if (!trimmed) return ''
        const segs = trimmed.split(/[:>]/)
        if (segs.length >= 2) return segs.slice(1).join(':').trim()
        return trimmed
      })
      .filter(Boolean)
    if (parts.length) return parts.join('>')
  }
  return null
}

const convert1688SkuListToMap = (raw) => {
  if (!Array.isArray(raw)) return null
  const result = {}
  for (const item of raw) {
    const row = asRecord(item)
    if (!row) continue
    const key = build1688SkuListMapKey(row)
    if (!key) continue
    result[key] = row
  }
  return Object.keys(result).length ? result : null
}

const digSkuBlobsFromUnknown = (value, depth = 0, acc = { props: [], maps: [] }) => {
  if (value == null || depth > 8) return acc
  if (Array.isArray(value)) {
    for (const item of value) digSkuBlobsFromUnknown(item, depth + 1, acc)
    return acc
  }
  const record = asRecord(value)
  if (!record) return acc
  if (record.skuProps != null) acc.props.push(record.skuProps)
  if (record.skuMap != null) acc.maps.push(record.skuMap)
  if (record.skuInfoMap != null) acc.maps.push(record.skuInfoMap)
  if (record.skuList != null) {
    const converted = convert1688SkuListToMap(record.skuList)
    if (converted) acc.maps.push(converted)
  }
  for (const key of ['skuModel', 'offerDetail', 'data', 'globalData']) {
    if (record[key] && typeof record[key] === 'object') digSkuBlobsFromUnknown(record[key], depth + 1, acc)
  }
  return acc
}

const collectRichest = (html) => {
  const propsCandidates = [...extractAllBalancedJsonValues(html, 'skuProps')]
  const mapCandidates = [
    ...extractAllBalancedJsonValues(html, 'skuMap'),
    ...extractAllBalancedJsonValues(html, 'skuInfoMap'),
  ]
  for (const listRaw of extractAllBalancedJsonValues(html, 'skuList')) {
    const converted = convert1688SkuListToMap(listRaw)
    if (converted) mapCandidates.push(converted)
  }
  for (const parentKey of ['skuModel', 'offerDetail', '__INIT_DATA__']) {
    for (const parent of extractAllBalancedJsonValues(html, parentKey)) {
      const dug = digSkuBlobsFromUnknown(parent)
      propsCandidates.push(...dug.props)
      mapCandidates.push(...dug.maps)
    }
  }
  let bestProps = null
  let bestPropsScore = 0
  for (const c of propsCandidates) {
    const s = scoreSkuPropsRaw(c)
    if (s > bestPropsScore) {
      bestPropsScore = s
      bestProps = c
    }
  }
  let bestMap = null
  let bestMapScore = 0
  for (const c of mapCandidates) {
    const s = scoreSkuMapRaw(c)
    if (s > bestMapScore) {
      bestMapScore = s
      bestMap = c
    }
  }
  return { bestProps, bestMap, bestPropsScore, bestMapScore, propsCandidates }
}

const collectRichestColorValues = (html) => {
  const { propsCandidates } = collectRichest(html)
  const imageByName = new Map()
  let best = []
  for (const candidate of propsCandidates) {
    if (!Array.isArray(candidate)) continue
    for (const item of candidate) {
      const record = asRecord(item)
      if (!record) continue
      const propName = normalizeText(record.prop ?? record.name)
      const valueList = Array.isArray(record.value) ? record.value : []
      const imageHits = valueList.filter((v) => asRecord(v)?.imageUrl).length
      const isColor =
        is1688ColorPropName(propName) ||
        (/^(规格|款式)$/i.test(propName) && imageHits >= 2 && imageHits >= Math.ceil(valueList.length * 0.4))
      if (!isColor) continue
      const values = valueList
        .map((entry) => {
          const row = asRecord(entry)
          const name = normalizeText(row?.name ?? row?.value)
          if (!name) return null
          return { name, imageUrl: typeof row?.imageUrl === 'string' ? row.imageUrl : null }
        })
        .filter(Boolean)
      for (const value of values) {
        if (!imageByName.has(value.name)) imageByName.set(value.name, value.imageUrl)
        else if (!imageByName.get(value.name) && value.imageUrl) imageByName.set(value.name, value.imageUrl)
      }
      if (values.length > best.length) best = values
    }
  }
  const seen = new Set()
  const ordered = []
  for (const value of best) {
    if (seen.has(value.name)) continue
    seen.add(value.name)
    ordered.push({ name: value.name, imageUrl: imageByName.get(value.name) || value.imageUrl || null })
  }
  return ordered
}

/** Mirror extract1688ColorOptionsFromHtml: hidden prop-item + title/img pairs */
const extractDomColors = (html) => {
  const results = []
  const seen = new Set()
  const pushColor = (rawLabel, rawImage) => {
    const label = normalizeText(rawLabel)
    if (!label || label.length > 40) return
    if (/^(颜色|花色|尺码|尺寸|规格|鞋码|Size|Colour|Color)$/i.test(label)) return
    if (/^(?:[0-9]{1,3}(?:\.[0-5])?|[Xx]?[SsMlLl]{1,3}|均码)$/i.test(label)) return
    if (seen.has(label)) return
    seen.add(label)
    results.push({
      label,
      imageUrl: rawImage && !isLikely1688VideoAsset(rawImage) ? rawImage : null,
    })
  }
  const titleImgRe =
    /(?:title|alt|data-name|data-value)=["']([^"']{1,40})["'][^>]{0,480}(?:src|data-src)=["']((?:https?:)?\/\/[^"']+)["']/gi
  let matched
  while ((matched = titleImgRe.exec(html))) {
    pushColor(matched[1], matched[2])
  }
  const propItemRe =
    /<(?:div|li|a|span)[^>]*(?:prop-item|sku-prop|color-item)[^>]*>[\s\S]{0,600}?<\/(?:div|li|a|span)>/gi
  while ((matched = propItemRe.exec(html))) {
    const block = matched[0]
    const img = block.match(/(?:src|data-src)=["']((?:https?:)?\/\/[^"']+)["']/i)?.[1] || null
    if (!img) continue
    const label =
      block.match(/(?:title|alt|data-name|data-value)=["']([^"']{1,40})["']/i)?.[1] ||
      block.match(/<(?:span|em)[^>]*>\s*([^<]{1,40})\s*<\/(?:span|em)>/i)?.[1] ||
      null
    if (label) pushColor(label, img)
  }
  return results
}

const pickRichestSizeProp = (props) => {
  const sizeLike = props.filter((p) => /尺码|尺寸|鞋码|Size/i.test(String(p.prop || p.name || '')))
  if (!sizeLike.length) return null
  return [...sizeLike].sort((a, b) => (b.value?.length || 0) - (a.value?.length || 0))[0]
}

fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true })

const fixtureHtml = `<!doctype html><html><body>
<!-- gallery with leading video: must skip mp4/aliVideo and keep subsequent color images -->
<script>
var media = {
  "offerImgList": [
    "https://cloud.video.taobao.com/play/u/xxx/p/1/e/6/t/1/aliVideo_demo.mp4",
    "https://cbu01.alicdn.com/img/ibank/gallery_main_1.jpg",
    "https://cbu01.alicdn.com/img/ibank/gallery_main_2.jpg",
    "https://cbu01.alicdn.com/img/ibank/gallery_main_3.jpg"
  ]
};
</script>
<div class="detail-gallery">
  <video class="aliVideo" src="https://cloud.video.taobao.com/x.mp4"></video>
  <img class="video-cover" src="https://img.alicdn.com/video/cover_poster.jpg" alt="视频封面" />
  <img title="米白" src="https://cbu01.alicdn.com/img/1_50x50.jpg" />
  <img title="卡其" src="https://cbu01.alicdn.com/img/2_50x50.jpg" />
</div>
<!-- visible 3 colors + hidden/collapsed extras (display:none) must still be scraped -->
<div class="sku-prop-module">
  <div class="prop-item" title="米白"><img src="https://cbu01.alicdn.com/img/1_50x50.jpg" /><span>米白</span></div>
  <div class="prop-item" title="卡其"><img src="https://cbu01.alicdn.com/img/2_50x50.jpg" /><span>卡其</span></div>
  <div class="prop-item" title="咖啡"><img src="https://cbu01.alicdn.com/img/3_50x50.jpg" /><span>咖啡</span></div>
  <div class="expand-view" style="display:none">
    <div class="prop-item" title="黑色"><img src="https://cbu01.alicdn.com/img/4_50x50.jpg" /><span>黑色</span></div>
    <div class="prop-item" title="粉色"><img src="https://cbu01.alicdn.com/img/5_50x50.jpg" /><span>粉色</span></div>
    <div class="prop-item" title="银灰"><img src="https://cbu01.alicdn.com/img/6_50x50.jpg" /><span>银灰</span></div>
    <div class="prop-item" title="深蓝"><img src="https://cbu01.alicdn.com/img/7_50x50.jpg" /><span>深蓝</span></div>
    <div class="prop-item" title="无图色"><span>无图色</span></div>
  </div>
</div>
<script>
// decoy: few colors + inflated size stubs — must NOT beat full color table under color-weighted score
var decoy = {
  "skuProps": [
    {"prop":"颜色","value":[{"name":"红色","imageUrl":"https://cbu01.alicdn.com/img/red_50x50.jpg"},{"name":"蓝色","imageUrl":"https://cbu01.alicdn.com/img/blue_50x50.jpg"},{"name":"黑色","imageUrl":"https://cbu01.alicdn.com/img/black_50x50.jpg"}]},
    {"prop":"尺码","value":[
      {"name":"S"},{"name":"M"},{"name":"L"},{"name":"XL"},{"name":"XXL"},
      {"name":"3XL"},{"name":"4XL"},{"name":"5XL"},{"name":"6XL"},{"name":"7XL"},
      {"name":"8XL"},{"name":"9XL"},{"name":"10XL"},{"name":"11XL"},{"name":"12XL"},
      {"name":"13XL"},{"name":"14XL"},{"name":"15XL"},{"name":"16XL"},{"name":"17XL"}
    ]}
  ],
  "skuMap": {
    "红色>L": {"price":"10","canBookCount":1},
    "蓝色>L": {"price":"10","canBookCount":1},
    "黑色>L": {"price":"10","canBookCount":1}
  }
};
// full offer blob: 花色 + 鞋码; one color without imageUrl must still be kept
window.__INIT_DATA__ = {
  "offerDetail": {
    "skuModel": {
      "skuProps": [
        {"prop":"花色","value":[
          {"name":"米白","imageUrl":"https://cbu01.alicdn.com/img/1_50x50.jpg"},
          {"name":"卡其","imageUrl":"https://cbu01.alicdn.com/img/2_50x50.jpg"},
          {"name":"咖啡","imageUrl":"https://cbu01.alicdn.com/img/3_50x50.jpg"},
          {"name":"黑色","imageUrl":"https://cbu01.alicdn.com/img/4_50x50.jpg"},
          {"name":"粉色","imageUrl":"https://cbu01.alicdn.com/img/5_50x50.jpg"},
          {"name":"银灰","imageUrl":"https://cbu01.alicdn.com/img/6_50x50.jpg"},
          {"name":"深蓝","imageUrl":"https://cbu01.alicdn.com/img/7_50x50.jpg"},
          {"name":"裸粉"}
        ]},
        {"prop":"规格","value":[{"name":"L"}]},
        {"prop":"鞋码","value":[
          {"name":"35"},{"name":"36"},{"name":"37"},{"name":"38"},{"name":"39"},{"name":"40"},{"name":"41"}
        ]}
      ],
      "skuList": [
        {"specAttrs":"花色&gt;米白;鞋码&gt;35","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;米白;鞋码&gt;36","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;米白;鞋码&gt;37","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;卡其;鞋码&gt;35","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;卡其;鞋码&gt;36","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;咖啡;鞋码&gt;37","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;黑色;鞋码&gt;38","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;粉色;鞋码&gt;39","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;银灰;鞋码&gt;40","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;深蓝;鞋码&gt;41","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;深蓝;鞋码&gt;35","price":"29","canBookCount":9},
        {"specAttrs":"花色&gt;裸粉;鞋码&gt;36","price":"29","canBookCount":9}
      ]
    }
  }
};
</script></body></html>`

fs.writeFileSync(fixturePath, fixtureHtml, 'utf8')

const html = fs.readFileSync(fixturePath, 'utf8')
const { bestProps, bestMap, bestPropsScore, bestMapScore } = collectRichest(html)

assert.ok(bestPropsScore >= 80_000, `expected color-weighted props score >=80000, got ${bestPropsScore}`)
assert.ok(bestMapScore >= 11, `expected rich map/skuList keys >=11, got ${bestMapScore}`)

const colorProp = bestProps.find((p) => is1688ColorPropName(p.prop) || p.prop === '花色')
const sizeProp = pickRichestSizeProp(bestProps)
assert.ok(colorProp, 'should detect 花色/颜色 prop')
assert.equal(colorProp.value.length, 8, 'should keep all 8 colors incl. no-image 裸粉, not decoy 3')
assert.equal(sizeProp.value.length, 7, 'should pick 鞋码 35-41 over decoy inflated size stubs')
assert.ok(!colorProp.value.some((v) => v.name === '红色'), 'decoy 红色 must not win')
assert.ok(colorProp.value.some((v) => v.name === '裸粉' && !v.imageUrl), 'no-image color must be kept')
assert.ok(
  colorProp.value.filter((v) => v.imageUrl).length >= 7,
  'colors with thumbs keep independent imageUrl',
)
assert.ok(Object.keys(bestMap).includes('深蓝>41') || Object.keys(bestMap).includes('深蓝>35'), 'skuList-derived map key present')
assert.ok(!Object.keys(bestMap).includes('红色>L'), 'decoy skuMap must not win')

const mergedColors = collectRichestColorValues(html)
assert.equal(mergedColors.length, 8, 'merged color harvest must be 8')
assert.ok(mergedColors.every((c) => c.name), 'every merged color has name')
assert.ok(mergedColors.some((c) => c.name === '裸粉' && !c.imageUrl), 'merged keeps empty-thumb color')

const domColors = extractDomColors(html)
assert.ok(domColors.length >= 7, `DOM (incl. display:none) should yield >=7 color thumbs, got ${domColors.length}`)
assert.ok(domColors.some((c) => c.label === '银灰'), 'hidden 银灰 under display:none must be captured')
assert.ok(domColors.some((c) => c.label === '深蓝'), 'hidden 深蓝 under display:none must be captured')

const gallery = extractJsonStringArrayField(html, 'offerImgList')
assert.equal(gallery.length, 3, 'gallery should skip video and keep 3 images')
assert.ok(!gallery.some((u) => isLikely1688VideoAsset(u)), 'gallery must not contain video urls')
assert.ok(gallery[0].includes('gallery_main_1'), 'first gallery url should be first image after video')

console.log('PASS: full color list + hidden DOM + 花色 + no-image color + video skip')
console.log(
  JSON.stringify(
    {
      colors: mergedColors.map((v) => ({ name: v.name, hasImage: Boolean(v.imageUrl) })),
      domColorCount: domColors.length,
      sizes: sizeProp.value.map((v) => v.name),
      mapKeys: Object.keys(bestMap).length,
      galleryAfterVideoSkip: gallery,
      propsScore: bestPropsScore,
      mapScore: bestMapScore,
    },
    null,
    2,
  ),
)
