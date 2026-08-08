/**
 * Static CN → locale keyword maps for product titles / specs.
 * Used server-side (no i18next) and as the source of truth for expanding
 * `productSpec.colorKeywords` in locale JSON files.
 *
 * Extend: append longer compounds before shorter tokens in KEYWORD_ORDER,
 * and add CN→EN / CN→ES entries in the maps below.
 */

export type KeywordLocale = 'en' | 'es' | 'zh'

/** Longer-first order for greedy left-to-right matching. */
export const PRODUCT_KEYWORD_ORDER: readonly string[] = [
  // materials (compound first)
  '不锈钢',
  '人造革',
  '合成革',
  '超纤皮',
  '头层牛皮',
  '真皮',
  '牛皮',
  '羊皮',
  '猪皮',
  '绒面',
  '磨砂',
  '帆布',
  '尼龙',
  '涤纶',
  '纯棉',
  '雪纺',
  '针织',
  '毛呢',
  '橡胶',
  '塑料',
  '金属',
  '合金',
  '木质',
  '竹制',
  '玻璃',
  '陶瓷',
  '水晶',
  '珍珠',
  '银饰',
  '黄金',
  'K金',
  '925银',
  '面料',
  '材质',
  '棉',
  '麻',
  '丝绸',
  '皮',
  // colors (compound first)
  '咖啡色',
  '土黄色',
  '卡其色',
  '经典黑',
  '复古棕',
  '深灰色',
  '浅灰色',
  '深蓝色',
  '浅蓝色',
  '天蓝色',
  '墨绿色',
  '藏青色',
  '酒红色',
  '玫瑰红',
  '米白色',
  '乳白色',
  '象牙白',
  '香槟金',
  '玫瑰金',
  '豆沙色',
  '豆沙',
  '裸色',
  '焦糖色',
  '焦糖',
  '黑白色',
  '黑白',
  '黑色',
  '白色',
  '红色',
  '粉色',
  '蓝色',
  '绿色',
  '黄色',
  '灰色',
  '金色',
  '银色',
  '米色',
  '紫色',
  '橙色',
  '棕色',
  '褐色',
  '青色',
  '杏色',
  '卡其',
  '咖啡',
  '酒红',
  '奶白',
  '米白',
  '土黄',
  '黑',
  '白',
  '红',
  '粉',
  '蓝',
  '绿',
  '黄',
  '灰',
  '金',
  '银',
  '紫',
  '橙',
  '棕',
  // footwear / apparel (compounds before shorter stems like 平底 / 帆布 / 皮)
  '运动鞋',
  '休闲鞋',
  '高跟鞋',
  '平底鞋',
  '帆布鞋',
  '豆豆鞋',
  '马丁靴',
  '洞洞鞋',
  '人字拖',
  '半拖',
  '凉鞋',
  '拖鞋',
  '短靴',
  '长靴',
  '靴子',
  '皮鞋',
  '单鞋',
  '板鞋',
  '跑鞋',
  '女鞋',
  '男鞋',
  '童鞋',
  '平底',
  '包包',
  '单肩包',
  '斜挎包',
  '手提包',
  '双肩包',
  '钱包',
  '首饰',
  '项链',
  '手链',
  '耳环',
  '戒指',
  '手镯',
  // style vibes
  '休闲风',
  '商务风',
  '简约风',
  '街头风',
  '甜美风',
  '运动风',
  '复古风',
  '时尚',
  '简约',
  '休闲',
  '正式',
  '商务',
  '复古',
  '甜美',
  '街头',
  '运动',
  '新款',
  '热销',
  '爆款',
  '批发',
  '厂家',
  '直销',
  '跨境',
  '外贸',
  '早春',
  '厚底凉',
  '厚底增',
  '厚底',
  '一字拖外穿',
  '一字拖',
  '绊带扣',
  '魔术贴',
  '牛仔布',
  '印花',
  '刺绣',
  '外穿',
  '增高',
  // packaging / spec add-ons (compound before shorter)
  '礼品盒',
  '飞机盒',
  '礼盒',
  '包装盒',
  '现货',
  '预售',
  '均码',
  '单码',
]

export const PRODUCT_KEYWORD_EN: Record<string, string> = {
  不锈钢: 'Stainless Steel',
  人造革: 'PU Leather',
  合成革: 'Synthetic Leather',
  超纤皮: 'Microfiber Leather',
  头层牛皮: 'Full-Grain Cowhide',
  真皮: 'Genuine Leather',
  牛皮: 'Cowhide',
  羊皮: 'Sheepskin',
  猪皮: 'Pigskin',
  绒面: 'Suede',
  磨砂: 'Suede',
  帆布: 'Canvas',
  尼龙: 'Nylon',
  涤纶: 'Polyester',
  纯棉: 'Pure Cotton',
  雪纺: 'Chiffon',
  针织: 'Knit',
  毛呢: 'Wool',
  橡胶: 'Rubber',
  塑料: 'Plastic',
  金属: 'Metal',
  合金: 'Alloy',
  木质: 'Wood',
  竹制: 'Bamboo',
  玻璃: 'Glass',
  陶瓷: 'Ceramic',
  水晶: 'Crystal',
  珍珠: 'Pearl',
  银饰: 'Silver Jewelry',
  黄金: 'Gold',
  K金: 'K Gold',
  '925银': '925 Silver',
  面料: 'Fabric',
  材质: 'Material',
  棉: 'Cotton',
  麻: 'Linen',
  丝绸: 'Silk',
  皮: 'Leather',
  咖啡色: 'Coffee',
  土黄色: 'Khaki',
  卡其色: 'Khaki',
  经典黑: 'Classic Black',
  复古棕: 'Vintage Brown',
  深灰色: 'Dark Gray',
  浅灰色: 'Light Gray',
  深蓝色: 'Dark Blue',
  浅蓝色: 'Light Blue',
  天蓝色: 'Sky Blue',
  墨绿色: 'Forest Green',
  藏青色: 'Navy',
  酒红色: 'Burgundy',
  玫瑰红: 'Rose Red',
  米白色: 'Off-White',
  乳白色: 'Ivory',
  象牙白: 'Ivory',
  香槟金: 'Champagne Gold',
  玫瑰金: 'Rose Gold',
  豆沙色: 'Bean Paste',
  豆沙: 'Bean Paste',
  裸色: 'Nude',
  焦糖色: 'Caramel',
  焦糖: 'Caramel',
  黑白色: 'Black & White',
  黑白: 'Black & White',
  黑色: 'Black',
  白色: 'White',
  红色: 'Red',
  粉色: 'Pink',
  蓝色: 'Blue',
  绿色: 'Green',
  黄色: 'Yellow',
  灰色: 'Gray',
  金色: 'Gold',
  银色: 'Silver',
  米色: 'Beige',
  紫色: 'Purple',
  橙色: 'Orange',
  棕色: 'Brown',
  褐色: 'Brown',
  青色: 'Cyan',
  杏色: 'Apricot',
  卡其: 'Khaki',
  咖啡: 'Coffee',
  酒红: 'Burgundy',
  奶白: 'Cream',
  米白: 'Off-White',
  土黄: 'Khaki',
  黑: 'Black',
  白: 'White',
  红: 'Red',
  粉: 'Pink',
  蓝: 'Blue',
  绿: 'Green',
  黄: 'Yellow',
  灰: 'Gray',
  金: 'Gold',
  银: 'Silver',
  紫: 'Purple',
  橙: 'Orange',
  棕: 'Brown',
  运动鞋: 'Sneakers',
  休闲鞋: 'Casual Shoes',
  高跟鞋: 'High Heels',
  平底鞋: 'Flats',
  帆布鞋: 'Canvas Shoes',
  豆豆鞋: 'Loafers',
  马丁靴: 'Martin Boots',
  洞洞鞋: 'Clogs',
  人字拖: 'Flip-Flops',
  半拖: 'Mules',
  凉鞋: 'Sandals',
  拖鞋: 'Slippers',
  短靴: 'Ankle Boots',
  长靴: 'Boots',
  靴子: 'Boots',
  皮鞋: 'Leather Shoes',
  单鞋: 'Flats',
  板鞋: 'Skate Shoes',
  跑鞋: 'Running Shoes',
  女鞋: "Women's Shoes",
  男鞋: "Men's Shoes",
  童鞋: "Kids' Shoes",
  平底: 'Flat',
  包包: 'Bag',
  单肩包: 'Shoulder Bag',
  斜挎包: 'Crossbody Bag',
  手提包: 'Handbag',
  双肩包: 'Backpack',
  钱包: 'Wallet',
  首饰: 'Jewelry',
  项链: 'Necklace',
  手链: 'Bracelet',
  耳环: 'Earrings',
  戒指: 'Ring',
  手镯: 'Bangle',
  休闲风: 'Casual',
  商务风: 'Business',
  简约风: 'Minimalist',
  街头风: 'Street',
  甜美风: 'Sweet',
  运动风: 'Sporty',
  复古风: 'Vintage',
  时尚: 'Fashion',
  简约: 'Minimalist',
  休闲: 'Casual',
  正式: 'Formal',
  商务: 'Business',
  复古: 'Vintage',
  甜美: 'Sweet',
  街头: 'Street',
  运动: 'Sport',
  新款: 'New',
  热销: 'Best Seller',
  爆款: 'Hot Seller',
  批发: 'Wholesale',
  厂家: 'Factory',
  直销: 'Direct',
  跨境: 'Cross-border',
  外贸: 'Foreign Trade',
  早春: 'Early Spring',
  厚底凉: 'Platform Slide',
  厚底增: 'Platform Boost',
  厚底: 'Platform',
  一字拖外穿: 'Outdoor Slide',
  一字拖: 'Slide Sandal',
  绊带扣: 'Buckle Strap',
  魔术贴: 'Hook-and-Loop',
  牛仔布: 'Denim',
  印花: 'Print',
  刺绣: 'Embroidery',
  外穿: 'Outdoor',
  增高: 'Height Boost',
  礼品盒: 'Gift Box',
  飞机盒: 'Box',
  礼盒: 'Gift Box',
  包装盒: 'Packaging Box',
  现货: 'In Stock',
  预售: 'Pre-Order',
  均码: 'One Size',
  单码: 'One Size',
}

export const PRODUCT_KEYWORD_ES: Record<string, string> = {
  不锈钢: 'Acero inoxidable',
  人造革: 'Cuero PU',
  合成革: 'Cuero sintético',
  超纤皮: 'Microfibra',
  头层牛皮: 'Cuero de grano completo',
  真皮: 'Cuero genuino',
  牛皮: 'Cuero de vaca',
  羊皮: 'Piel de oveja',
  猪皮: 'Piel de cerdo',
  绒面: 'Ante',
  磨砂: 'Ante',
  帆布: 'Lona',
  尼龙: 'Nailon',
  涤纶: 'Poliéster',
  纯棉: 'Algodón puro',
  雪纺: 'Chifón',
  针织: 'Punto',
  毛呢: 'Lana',
  橡胶: 'Goma',
  塑料: 'Plástico',
  金属: 'Metal',
  合金: 'Aleación',
  木质: 'Madera',
  竹制: 'Bambú',
  玻璃: 'Vidrio',
  陶瓷: 'Cerámica',
  水晶: 'Cristal',
  珍珠: 'Perla',
  银饰: 'Joyería de plata',
  黄金: 'Oro',
  K金: 'Oro K',
  '925银': 'Plata 925',
  面料: 'Tejido',
  材质: 'Material',
  棉: 'Algodón',
  麻: 'Lino',
  丝绸: 'Seda',
  皮: 'Cuero',
  咖啡色: 'Café',
  土黄色: 'Caqui',
  卡其色: 'Caqui',
  经典黑: 'Negro clásico',
  复古棕: 'Marrón vintage',
  深灰色: 'Gris oscuro',
  浅灰色: 'Gris claro',
  深蓝色: 'Azul oscuro',
  浅蓝色: 'Azul claro',
  天蓝色: 'Azul cielo',
  墨绿色: 'Verde bosque',
  藏青色: 'Azul marino',
  酒红色: 'Burdeos',
  玫瑰红: 'Rojo rosa',
  米白色: 'Blanco roto',
  乳白色: 'Marfil',
  象牙白: 'Marfil',
  香槟金: 'Oro champán',
  玫瑰金: 'Oro rosa',
  豆沙色: 'Rojo Frijol',
  豆沙: 'Rojo Frijol',
  裸色: 'Nude',
  焦糖色: 'Caramelo',
  焦糖: 'Caramelo',
  黑白色: 'Blanco y negro',
  黑白: 'Blanco y negro',
  黑色: 'Negro',
  白色: 'Blanco',
  红色: 'Rojo',
  粉色: 'Rosa',
  蓝色: 'Azul',
  绿色: 'Verde',
  黄色: 'Amarillo',
  灰色: 'Gris',
  金色: 'Dorado',
  银色: 'Plateado',
  米色: 'Beige',
  紫色: 'Morado',
  橙色: 'Naranja',
  棕色: 'Marrón',
  褐色: 'Marrón',
  青色: 'Cian',
  杏色: 'Albaricoque',
  卡其: 'Caqui',
  咖啡: 'Café',
  酒红: 'Burdeos',
  奶白: 'Crema',
  米白: 'Blanco roto',
  土黄: 'Caqui',
  黑: 'Negro',
  白: 'Blanco',
  红: 'Rojo',
  粉: 'Rosa',
  蓝: 'Azul',
  绿: 'Verde',
  黄: 'Amarillo',
  灰: 'Gris',
  金: 'Dorado',
  银: 'Plateado',
  紫: 'Morado',
  橙: 'Naranja',
  棕: 'Marrón',
  运动鞋: 'Zapatillas',
  休闲鞋: 'Zapatos casuales',
  高跟鞋: 'Tacones',
  平底鞋: 'Pisos',
  帆布鞋: 'Zapatos de lona',
  豆豆鞋: 'Mocasines',
  马丁靴: 'Botas Martin',
  洞洞鞋: 'Zuecos',
  人字拖: 'Chanclas',
  半拖: 'Mules',
  凉鞋: 'Sandalias',
  拖鞋: 'Zapatillas de casa',
  短靴: 'Botines',
  长靴: 'Botas',
  靴子: 'Botas',
  皮鞋: 'Zapatos de cuero',
  单鞋: 'Pisos',
  板鞋: 'Zapatillas skate',
  跑鞋: 'Zapatillas running',
  女鞋: 'Zapatos de mujer',
  男鞋: 'Zapatos de hombre',
  童鞋: 'Zapatos infantiles',
  平底: 'Plano',
  包包: 'Bolso',
  单肩包: 'Bolso de hombro',
  斜挎包: 'Bolso cruzado',
  手提包: 'Bolso de mano',
  双肩包: 'Mochila',
  钱包: 'Cartera',
  首饰: 'Joyería',
  项链: 'Collar',
  手链: 'Pulsera',
  耳环: 'Pendientes',
  戒指: 'Anillo',
  手镯: 'Brazalete',
  休闲风: 'Casual',
  商务风: 'Business',
  简约风: 'Minimalista',
  街头风: 'Street',
  甜美风: 'Dulce',
  运动风: 'Sport',
  复古风: 'Vintage',
  时尚: 'Moda',
  简约: 'Minimalista',
  休闲: 'Casual',
  正式: 'Formal',
  商务: 'Business',
  复古: 'Vintage',
  甜美: 'Dulce',
  街头: 'Street',
  运动: 'Sport',
  新款: 'Nuevo',
  热销: 'Más vendido',
  爆款: 'Éxito de ventas',
  批发: 'Mayorista',
  厂家: 'Fábrica',
  直销: 'Directo',
  跨境: 'Transfronterizo',
  外贸: 'Comercio exterior',
  早春: 'Inicio de primavera',
  厚底凉: 'Sandalia plataforma',
  厚底增: 'Plataforma',
  厚底: 'Plataforma',
  一字拖外穿: 'Sandalia slide exterior',
  一字拖: 'Sandalia slide',
  绊带扣: 'Correa con hebilla',
  魔术贴: 'Velcro',
  牛仔布: 'Denim',
  印花: 'Estampado',
  刺绣: 'Bordado',
  外穿: 'Exterior',
  增高: 'Aumenta altura',
  礼品盒: 'Caja de regalo',
  飞机盒: 'Caja',
  礼盒: 'Caja de regalo',
  包装盒: 'Caja de embalaje',
  现货: 'En stock',
  预售: 'Preventa',
  均码: 'Talla única',
  单码: 'Talla única',
}

const LATIN_EDGE = /[A-Za-z0-9]/
const CJK_EDGE = /[\u4e00-\u9fff]/

export function containsChinese(text: string | null | undefined): boolean {
  return /[\u4e00-\u9fff]/.test(String(text || ''))
}

/** Drop CJK runs so storefront EN/ES titles never show Chinese leftovers. */
export function stripChineseFromTitle(text: string | null | undefined): string {
  return collapseRepeatedTitleWords(
    String(text || '')
      .replace(/[\u4e00-\u9fff]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

/**
 * Collapse runs of the same whitespace-separated token:
 * "Flat Flat Flat Shoes" → "Flat Shoes".
 * Heals already-stored bad EN titles without re-scrape.
 */
export function collapseRepeatedTitleWords(text: string | null | undefined): string {
  const raw = String(text || '').replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  // Case-insensitive consecutive duplicates (Flat / flat / FLAT)
  return raw.replace(/\b([^\s]+)(?:\s+\1\b)+/gi, '$1')
}

function mapForLocale(locale: KeywordLocale): Record<string, string> | null {
  if (locale === 'en') return PRODUCT_KEYWORD_EN
  if (locale === 'es') return PRODUCT_KEYWORD_ES
  return null
}

function joinTranslatedPieces(pieces: string[]): string {
  let out = ''
  for (const piece of pieces) {
    if (!piece) continue
    // Skip pushing the same token twice in a row (defends hitLen=0 / bad dict rows)
    if (out) {
      const prev = out.split(/\s+/).pop() || ''
      if (prev && prev.toLowerCase() === piece.toLowerCase()) continue
    }
    if (!out) {
      out = piece
      continue
    }
    const leftLatin = LATIN_EDGE.test(out[out.length - 1] || '')
    const rightLatin = LATIN_EDGE.test(piece[0] || '')
    const leftCjk = CJK_EDGE.test(out[out.length - 1] || '')
    const rightCjk = CJK_EDGE.test(piece[0] || '')
    if (leftLatin && rightLatin) {
      out += ` ${piece}`
    } else if ((leftLatin && rightCjk) || (leftCjk && rightLatin)) {
      out += ` ${piece}`
    } else {
      out += piece
    }
  }
  return collapseRepeatedTitleWords(out)
}

/** Longest non-empty keyword that matches at `index` (never first-in-list). */
function longestKeywordAt(raw: string, index: number): string | null {
  let best: string | null = null
  for (const keyword of PRODUCT_KEYWORD_ORDER) {
    if (!keyword || keyword.length === 0) continue
    if (!raw.startsWith(keyword, index)) continue
    if (!best || keyword.length > best.length) best = keyword
  }
  return best
}

function startsKeywordAt(raw: string, index: number): boolean {
  return longestKeywordAt(raw, index) != null
}

/**
 * Replace known Chinese keywords in a title / compound string.
 * Single left-to-right pass, longest-match only — never re-scans replaced text,
 * never advances by 0 (empty keyword rows cannot loop into Flat Flat Flat…).
 * Unmatched pure-CJK segments are dropped for en/es (no mixed titles).
 */
export function translateTitleKeywords(
  text: string | null | undefined,
  locale: KeywordLocale = 'en',
): string {
  const raw = String(text || '').trim()
  if (!raw) return ''
  if (locale === 'zh') return collapseRepeatedTitleWords(raw)

  const map = mapForLocale(locale)
  if (!map) return collapseRepeatedTitleWords(raw)

  const pieces: string[] = []
  let i = 0
  while (i < raw.length) {
    const keyword = longestKeywordAt(raw, i)
    if (keyword) {
      const hit = map[keyword] || keyword
      const hitLen = keyword.length
      // Hard guard: never stall the cursor (empty / corrupt keyword rows)
      if (hitLen <= 0) {
        pieces.push(raw[i] || '')
        i += 1
        continue
      }
      pieces.push(hit)
      i += hitLen
      continue
    }
    let j = i + 1
    while (j < raw.length && !startsKeywordAt(raw, j)) j += 1
    const segment = raw.slice(i, j)
    // Latin locales: drop unmatched pure-CJK chunks to avoid "中文 + Español" titles
    if (/^[\u4e00-\u9fff\s]+$/.test(segment)) {
      i = j
      continue
    }
    pieces.push(segment)
    i = j
  }

  return joinTranslatedPieces(pieces)
}
