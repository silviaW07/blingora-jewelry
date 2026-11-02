/** Solid swatch fill when a color has no photo. Never substitutes the product main image. */

const NAMED: Array<[string, string]> = [
  ['酒红色', '#722f37'],
  ['酒红', '#722f37'],
  ['burgundy', '#722f37'],
  ['wine red', '#722f37'],
  ['winered', '#722f37'],
  ['枫叶棕', '#a0522d'],
  ['maple brown', '#a0522d'],
  ['麂皮棕', '#8d6e63'],
  ['suede brown', '#8d6e63'],
  ['suede', '#8d6e63'],
  ['卡其色', '#c3b091'],
  ['卡其', '#c3b091'],
  ['khaki', '#c3b091'],
  ['咖啡色', '#6f4e37'],
  ['咖啡', '#6f4e37'],
  ['coffee', '#6f4e37'],
  ['玫瑰金', '#b76e79'],
  ['rose gold', '#b76e79'],
  ['香槟金', '#d4b483'],
  ['香槟', '#d4b483'],
  ['champagne', '#d4b483'],
  ['藏青色', '#1b2a4a'],
  ['藏青', '#1b2a4a'],
  ['navy', '#1b2a4a'],
  ['军绿色', '#4b5320'],
  ['军绿', '#4b5320'],
  ['olive', '#4b5320'],
  ['墨绿色', '#1f4d3a'],
  ['墨绿', '#1f4d3a'],
  ['camel', '#c19a6b'],
  ['驼色', '#c19a6b'],
  ['驼', '#c19a6b'],
  ['杏色', '#fbceb1'],
  ['杏', '#e8b892'],
  ['apricot', '#fbceb1'],
  ['米色', '#e8dcc8'],
  ['米白', '#f3efe6'],
  ['米', '#e8dcc8'],
  ['beige', '#e8dcc8'],
  ['ivory', '#f4f0e6'],
  ['象牙白', '#f4f0e6'],
  ['奶油', '#f3e5c2'],
  ['cream', '#f3e5c2'],
  ['粉色', '#f4a7b9'],
  ['粉红', '#f4a7b9'],
  ['粉', '#f4a7b9'],
  ['pink', '#f4a7b9'],
  ['红色', '#c0392b'],
  ['大红', '#c0392b'],
  ['红', '#c0392b'],
  ['red', '#c0392b'],
  ['橙色', '#e07a2f'],
  ['橙', '#e07a2f'],
  ['orange', '#e07a2f'],
  ['黄色', '#e6c200'],
  ['黄', '#e6c200'],
  ['yellow', '#e6c200'],
  ['绿色', '#2e7d4f'],
  ['绿', '#2e7d4f'],
  ['green', '#2e7d4f'],
  ['蓝色', '#2f5d9f'],
  ['蓝', '#2f5d9f'],
  ['blue', '#2f5d9f'],
  ['紫色', '#6b3fa0'],
  ['紫', '#6b3fa0'],
  ['purple', '#6b3fa0'],
  ['灰色', '#9e9e9e'],
  ['灰', '#9e9e9e'],
  ['grey', '#9e9e9e'],
  ['gray', '#9e9e9e'],
  ['黑色', '#1a1a1a'],
  ['黑', '#1a1a1a'],
  ['black', '#1a1a1a'],
  ['白色', '#f7f7f7'],
  ['白', '#f7f7f7'],
  ['white', '#f7f7f7'],
  ['金色', '#d4af37'],
  ['金', '#d4af37'],
  ['gold', '#d4af37'],
  ['银色', '#c0c0c0'],
  ['银', '#c0c0c0'],
  ['silver', '#c0c0c0'],
  ['棕色', '#8b5a2b'],
  ['棕', '#8b5a2b'],
  ['brown', '#8b5a2b'],
  ['透明', '#e8eef2'],
  ['clear', '#e8eef2'],
]

const FALLBACKS = ['#8d6e63', '#6d7a86', '#7a6a58', '#5f6f64', '#8a6a74', '#6e6258', '#7d735f', '#5c6b7a']

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function colorChipBackground(...labels: Array<string | null | undefined>): string {
  const parts = labels.map((item) => normalize(String(item || ''))).filter(Boolean)
  const blob = parts.join(' ')
  const compact = blob.replace(/\s+/g, '')
  const ranked = [...NAMED].sort((a, b) => b[0].length - a[0].length)
  for (const [name, hex] of ranked) {
    const key = name.toLowerCase()
    if (blob.includes(key) || compact.includes(key.replace(/\s+/g, ''))) return hex
  }
  const seed = compact || 'color'
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return FALLBACKS[hash % FALLBACKS.length]
}
