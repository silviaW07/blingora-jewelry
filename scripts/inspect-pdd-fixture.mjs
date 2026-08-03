import fs from 'fs'

const html = fs.readFileSync('scripts/fixtures/pdd-sample-608827925342.html', 'utf8')
const idx = html.indexOf('rawData')
console.log('rawData idx', idx)
console.log(html.slice(Math.max(0, idx - 80), idx + 500))
console.log('--- pddpic samples ---')
const imgs = [...html.matchAll(/https?:\\?\/\\?\/[^\s"'\\]+pddpic[^\s"'\\]+/gi)]
  .slice(0, 15)
  .map((m) => m[0].replace(/\\u002F/gi, '/').replace(/\\\//g, '/'))
console.log(imgs)
console.log('--- keys ---')
for (const k of ['rawData', 'window.rawData', 'skuProps', 'goods', 'initDataObj', 'store']) {
  console.log(k, (html.match(new RegExp(k.replace('.', '\\.'), 'gi')) || []).length)
}

// Try extract balanced rawData
const keyRe = /(?:window\.)?rawData\s*=\s*([\[\{])|"rawData"\s*:\s*([\[\{])/gi
let matched
let n = 0
while ((matched = keyRe.exec(html)) && n < 2) {
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
        const slice = html.slice(startIdx, i + 1)
        console.log('parsed rawData length', slice.length)
        try {
          const json = JSON.parse(slice)
          console.log('keys', Object.keys(json).slice(0, 30))
          console.log('sample', JSON.stringify(json).slice(0, 800))
        } catch (e) {
          console.log('parse fail', e.message, slice.slice(0, 200))
        }
        keyRe.lastIndex = i + 1
        break
      }
    }
    if (i - startIdx > 2_500_000) break
  }
  n += 1
}
