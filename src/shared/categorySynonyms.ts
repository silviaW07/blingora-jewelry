/**
 * 二级类目中文同义关键词字典。
 *
 * 背景：二级类目名多为英文（Bracelet / Necklace / Ring…），而 1688 抓取的商品标题是中文
 * （手链 / 项链 / 戒指…），导致中文标题无法命中英文类目名。此字典按「类目名 → 中文同义词」
 * 在归类匹配时并入关键词（不写数据库），从而让带品类词的中文标题能自动命中真实二级类目。
 *
 * 说明：
 *  - key 会以「大写 + 去空格」归一化后索引，需与 normalizeCategoryMatchText 保持一致。
 *  - 同一品类同时挂英文名与中文名两种 key，兼容不同命名的类目。
 *  - 词条尽量高信号、避免过泛（如不放裸「套装」到服饰，以免与珠宝套装冲突）。
 */

const SYNONYM_GROUPS: Array<{ names: string[]; synonyms: string[] }> = [
  // —— 饰品 / Jewelry ——
  { names: ['Necklace', 'Necklaces', '项链'], synonyms: ['项链', '颈链', '项圈', '锁骨链', '毛衣链', '吊坠项链', 'choker'] },
  { names: ['Earring', 'Earrings', 'Earing', '耳环', '耳饰'], synonyms: ['耳环', '耳钉', '耳饰', '耳坠', '耳夹', '耳线', '耳扣', '耳圈'] },
  { names: ['Bracelet', 'Bracelets', '手链'], synonyms: ['手链', '手串', '手绳', '串珠手链'] },
  { names: ['Bangle', 'Bangles', '手镯'], synonyms: ['手镯', '手环', '开口镯'] },
  { names: ['Ring', 'Rings', '戒指'], synonyms: ['戒指', '指环', '尾戒', '对戒', '关节戒'] },
  { names: ['Anklet', 'Anklets', '脚链'], synonyms: ['脚链', '脚镯', '脚踝链'] },
  { names: ['Brooch', 'Brooches', '胸针'], synonyms: ['胸针', '胸花', '别针'] },
  { names: ['Pendant', 'Pendants', '吊坠'], synonyms: ['吊坠', '挂坠', '坠子'] },
  { names: ['Jewelry Set', 'Jewellery Set', 'jewelry set', '珠宝套装', '首饰套装'], synonyms: ['珠宝套装', '首饰套装', '套装', '三件套', '四件套', '二件套', '五件套', '套链', 'earrings set', 'earring set', 'necklace set', 'necklace earrings set'] },
  { names: ['Hair Clip', 'Hairpin', '发夹'], synonyms: ['发夹', '发卡', '发簪', '抓夹'] },
  { names: ['Hair Rope', 'Hair Tie', '发绳'], synonyms: ['发绳', '发圈', '皮筋', '头绳'] },
  { names: ['Hair Band', 'Headband', '发带'], synonyms: ['发带', '发箍', '头箍', '头带'] },

  // —— 包 / Bags ——
  // Handbag / Crossbody：只用高信号词；泛词「包包/箱包」只挂在一级 Bags，避免所有二级一起命中
  {
    names: ['Handbag', 'Handbags', 'Tote', '手提包'],
    synonyms: [
      '手提包',
      '手提斜挎包',
      '手袋',
      '托特包',
      '手拎包',
      '手拿包',
      '托特',
      'tote',
      'handbag',
      'handbags',
    ],
  },
  {
    names: ['Bags', 'Bag', '包'],
    synonyms: [
      '手提包',
      '手提斜挎包',
      '斜挎包',
      '挎包',
      '手袋',
      '包包',
      '箱包',
      '女包',
      '包袋',
      'bag',
      'bags',
    ],
  },
  { names: ['Backpack', 'Backpacks', '双肩包', '背包'], synonyms: ['双肩包', '背包', '书包', '旅行背包', 'backpack'] },
  { names: ['Wallet', 'Wallets', '钱包'], synonyms: ['钱包', '钱夹', '卡包', '卡夹', '零钱包', '长款钱包', 'wallet'] },
  {
    names: ['Cosmetic Bag', 'Makeup Bag', '化妆包', 'coesmetic bag', 'cosmetic bag'],
    synonyms: ['化妆包', '洗漱包', '收纳包', 'cosmetic bag', 'makeup bag'],
  },
  {
    names: ['Crossbody Bag', 'Shoulder Bag', '斜挎包', '单肩包'],
    synonyms: [
      '斜挎包',
      '手提斜挎包',
      '斜背包',
      '单肩包',
      '邮差包',
      '链条包',
      '腋下包',
      '挎包',
      'crossbody',
      'shoulder bag',
    ],
  },
  { names: ['Clutch', '手拿包'], synonyms: ['手拿包', '晚宴包', '手抓包', 'clutch'] },

  // —— 鞋 / Shoes ——
  { names: ['Flats', 'Flat Shoes', '平底鞋'], synonyms: ['平底鞋', '单鞋', '豆豆鞋', '芭蕾鞋'] },
  { names: ['Slippers', '拖鞋'], synonyms: ['拖鞋', '凉拖', '人字拖', '棉拖'] },
  { names: ['Sandals', '凉鞋'], synonyms: ['凉鞋', '沙滩鞋', '罗马鞋'] },
  { names: ['Sneakers', 'Sneaker', '运动鞋'], synonyms: ['运动鞋', '板鞋', '跑鞋', '老爹鞋', '小白鞋'] },
  { names: ['Boots', 'Boot', '靴子'], synonyms: ['靴子', '短靴', '长靴', '马丁靴', '雪地靴', '踝靴'] },

  // —— 配饰 / Accessories ——
  { names: ['Belt', 'Belts', '皮带'], synonyms: ['皮带', '腰带', '腰封'] },
  { names: ['Glasses', 'Sunglasses', '眼镜'], synonyms: ['眼镜', '墨镜', '太阳镜', '近视镜'] },
  { names: ['Watch', 'Watches', '手表'], synonyms: ['手表', '腕表', '石英表', '机械表'] },
  { names: ['Phone Case', '手机壳'], synonyms: ['手机壳', '手机套', '保护壳', '保护套'] },
  { names: ['Keychain', 'Key Chain', '钥匙扣'], synonyms: ['钥匙扣', '钥匙链', '包挂', '挂饰'] },
  { names: ['Watch Band', 'Watch Strap', '表带'], synonyms: ['表带', '手表带', '腕带'] },

  // —— 服饰 / Apparel ——
  { names: ['Hat', 'Hats', 'Cap', '帽子'], synonyms: ['帽子', '棒球帽', '渔夫帽', '针织帽', '鸭舌帽', '贝雷帽'] },
  { names: ['Scarf', 'Scarves', '围巾'], synonyms: ['围巾', '丝巾', '披肩', '方巾', '围脖'] },
  { names: ['Gloves', 'Glove', '手套'], synonyms: ['手套', '半指手套'] },
  { names: ['Top', 'Tops', '上衣'], synonyms: ['上衣', 'T恤', '卫衣', '衬衫', '针织衫', '打底衫'] },
  { names: ['Pants', 'Trousers', '裤子'], synonyms: ['裤子', '长裤', '短裤', '牛仔裤', '休闲裤'] },
  { names: ['Skirt', 'Dress', '裙子'], synonyms: ['裙子', '半身裙', '连衣裙', '短裙', '长裙'] },
  { names: ['Underwear', 'Lingerie', '内衣'], synonyms: ['内衣', '文胸', '内裤', '胸罩', '内衣裤'] },
  { names: ['Socks', 'Sock', '袜子'], synonyms: ['袜子', '船袜', '丝袜', '棉袜', '中筒袜'] },
  { names: ['Swimwear', 'Swimsuit', '泳衣'], synonyms: ['泳衣', '泳装', '比基尼', '泳裤', '连体泳衣'] },
  { names: ['Yoga', 'Yoga Wear', '瑜伽服'], synonyms: ['瑜伽服', '瑜伽裤', '健身服'] },

  // —— 美妆 / Beauty ——
  { names: ['Lipstick', '口红'], synonyms: ['口红', '唇膏', '唇釉', '唇彩'] },
  { names: ['Perfume', '香水'], synonyms: ['香水', '香氛', '淡香'] },
  { names: ['Perfume Set', '香水套装'], synonyms: ['香水套装', '香氛套装'] },
]

const normalizeName = (value?: string | null) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

const SYNONYM_INDEX: Map<string, string[]> = (() => {
  const index = new Map<string, string[]>()
  for (const group of SYNONYM_GROUPS) {
    const synonyms = Array.from(new Set(group.synonyms.map(s => s.trim()).filter(Boolean)))
    for (const name of group.names) {
      const key = normalizeName(name)
      if (!key) continue
      const existing = index.get(key) || []
      index.set(key, Array.from(new Set([...existing, ...synonyms])))
    }
  }
  return index
})()

/**
 * 按类目名取中文同义关键词（大小写/空格不敏感）。未收录时返回空数组。
 */
export function resolveCategorySynonyms(categoryName?: string | null): string[] {
  const key = normalizeName(categoryName)
  if (!key) return []
  return SYNONYM_INDEX.get(key) || []
}
