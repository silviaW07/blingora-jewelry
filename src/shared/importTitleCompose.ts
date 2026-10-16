import { applyBackdropBrandToTitle, titleHasBackdropBrand } from '@/shared/brandFromBackdrop'

export type InferredProductType = {
  labelZh: string
  labelEn: string
}

const TYPE_TOKENS: Array<{ match: RegExp; type: InferredProductType }> = [
  { match: /太阳镜|sunglasses?/i, type: { labelZh: '太阳镜', labelEn: 'Sunglasses' } },
  { match: /平光镜/i, type: { labelZh: '平光镜', labelEn: 'Glasses' } },
  { match: /墨镜/i, type: { labelZh: '墨镜', labelEn: 'Sunglasses' } },
  { match: /近视镜|optical\s*glasses?/i, type: { labelZh: '眼镜', labelEn: 'Glasses' } },
  { match: /眼镜|glasses?/i, type: { labelZh: '眼镜', labelEn: 'Glasses' } },
  { match: /手提包|handbag/i, type: { labelZh: '手提包', labelEn: 'Handbag' } },
  { match: /斜挎包|crossbody/i, type: { labelZh: '斜挎包', labelEn: 'Crossbody' } },
  { match: /钱包|wallet/i, type: { labelZh: '钱包', labelEn: 'Wallet' } },
  { match: /腰带|皮带|belt/i, type: { labelZh: '皮带', labelEn: 'Belt' } },
  { match: /手表|wristwatch|watch(?! band)/i, type: { labelZh: '手表', labelEn: 'Watch' } },
]

export function inferProductTypeLabel(...texts: Array<string | null | undefined>): InferredProductType | null {
  const corpus = texts.map((text) => String(text || '').trim()).filter(Boolean).join(' ')
  if (!corpus) return null
  for (const row of TYPE_TOKENS) {
    if (row.match.test(corpus)) return row.type
  }
  return null
}

export function isWeakProductTitle(title?: string | null): boolean {
  const text = String(title || '').trim()
  if (!text) return true
  if (/^(yupoo|相册|album|untitled|未命名|默认商品|默认规格|商品)(\s*[-_]?\s*\d+)?$/i.test(text)) return true
  if (/^[\d\s\-_|#./]+$/.test(text)) return true
  return false
}

export function extractStyleCode(title?: string | null): string | null {
  const text = String(title || '').trim()
  const matched = text.match(/\d{5,}/)
  return matched?.[0] || null
}

export function composeImportProductTitle(params: {
  rawTitle?: string | null
  brand?: string | null
  typeZh?: string | null
  visionTitle?: string | null
}): string {
  const raw = String(params.rawTitle || '').trim()
  const brand = String(params.brand || '').trim()
  const typeZh = String(params.typeZh || '').trim()
  const visionTitle = String(params.visionTitle || '').trim()
  const code = extractStyleCode(raw)

  if (!isWeakProductTitle(raw)) {
    if (brand) return applyBackdropBrandToTitle(raw, brand)
    return raw
  }

  if (visionTitle) {
    const withBrand =
      brand && !titleHasBackdropBrand(visionTitle, brand) ? `${brand} ${visionTitle}` : visionTitle
    if (code && !withBrand.includes(code)) return `${withBrand} ${code}`
    return withBrand
  }

  const parts = [brand, typeZh, code].filter(Boolean)
  return parts.join(' ').trim()
}
