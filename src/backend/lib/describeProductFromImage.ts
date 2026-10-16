import sharp from 'sharp'
import { resolveAiSecrets } from '@/thirdparty/secret-resolver'
import { readUploadImageBytes } from '@/backend/lib/detectBrandFromBackdropImage'

export type ImageProductGuess = {
  brand: string | null
  category: string | null
  titleZh: string | null
}

const ALLOWED_BRANDS = new Set([
  'Tiffany',
  'Cartier',
  'Tom Ford',
  'Hermes',
  'Fendi',
  'Gucci',
  'Louis Vuitton',
  'Chanel',
  'Dior',
  'Prada',
  'Celine',
  'YSL',
  'Loewe',
  'Coach',
])

const BRAND_NORMALIZE: Record<string, string> = {
  lv: 'Louis Vuitton',
  'louis vuitton': 'Louis Vuitton',
  路易威登: 'Louis Vuitton',
  tiffany: 'Tiffany',
  cartier: 'Cartier',
  'tom ford': 'Tom Ford',
  hermes: 'Hermes',
  hermès: 'Hermes',
  fendi: 'Fendi',
  gucci: 'Gucci',
  chanel: 'Chanel',
  dior: 'Dior',
  prada: 'Prada',
  celine: 'Celine',
  céline: 'Celine',
  ysl: 'YSL',
  'saint laurent': 'YSL',
  loewe: 'Loewe',
  coach: 'Coach',
}

const VISION_TIMEOUT_MS = 8000

function normalizeGuessBrand(raw?: string | null): string | null {
  const key = String(raw || '').trim().toLowerCase()
  if (!key || key === 'null' || key === 'unknown') return null
  const mapped = BRAND_NORMALIZE[key] || String(raw || '').trim()
  return ALLOWED_BRANDS.has(mapped) ? mapped : null
}

function parseGuessJson(text: string): ImageProductGuess | null {
  const matched = String(text || '').match(/\{[\s\S]*\}/)
  if (!matched) return null
  try {
    const row = JSON.parse(matched[0]) as Record<string, unknown>
    const brand = normalizeGuessBrand(typeof row.brand === 'string' ? row.brand : null)
    const category = String(row.category || '').trim() || null
    const titleZh = String(row.titleZh || row.title_zh || '').trim() || null
    if (!brand && !category && !titleZh) return null
    return { brand, category, titleZh }
  } catch {
    return null
  }
}

async function loadAiConfig(): Promise<{ apiKey: string; baseUrl: string; model: string } | null> {
  try {
    const secrets = resolveAiSecrets()
    const apiKey = String(secrets.apiKey || '').trim()
    if (!apiKey) return null
    return {
      apiKey,
      baseUrl: String(secrets.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, ''),
      model: String(secrets.defaultModel || 'gpt-4o-mini').trim() || 'gpt-4o-mini',
    }
  } catch {
    return null
  }
}

export async function describeProductFromImageBytes(bytes: Buffer): Promise<ImageProductGuess | null> {
  const config = await loadAiConfig()
  if (!config || !bytes?.length) return null

  let dataUrl = ''
  try {
    const jpeg = await sharp(bytes)
      .rotate()
      .resize(768, 768, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72 })
      .toBuffer()
    dataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    return null
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS)
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        max_tokens: 180,
        messages: [
          {
            role: 'system',
            content:
              'You identify replica-store product photos. Return JSON only: {"brand":"Louis Vuitton|Cartier|Tiffany|Tom Ford|Gucci|Chanel|Dior|Prada|Celine|YSL|Hermes|Fendi|Loewe|Coach|null","category":"Glasses|Sunglasses|Handbag|Wallet|Belt|Watch|null","titleZh":"中文短标题"}. Use the box logo, monogram, and item shape. If unsure, use null.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What brand and product type is this?' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    })
    if (!response.ok) return null
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return parseGuessJson(data.choices?.[0]?.message?.content || '')
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function describeProductFromBackdropUrls(
  urls: Array<string | null | undefined>,
): Promise<ImageProductGuess | null> {
  const unique = Array.from(new Set(urls.map((url) => String(url || '').trim()).filter(Boolean))).slice(0, 2)
  for (const url of unique) {
    const bytes = await readUploadImageBytes(url)
    if (!bytes) continue
    const guess = await describeProductFromImageBytes(bytes)
    if (guess?.brand || guess?.category || guess?.titleZh) return guess
  }
  return null
}
