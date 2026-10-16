import { containsChinese, translateTitleKeywords } from '@/shared/productKeywordDictionary'

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/,/g, ' ')
    .trim()
}

/** Exact English → Spanish for known live channel names / ETAs. */
const EXACT_ES: Record<string, string> = {
  usps: 'USPS',
  fedex: 'FedEx',
  ups: 'UPS',
  dhl: 'DHL',
  'ship by sea': 'Envío marítimo',
  'ship by sea new (over 2kg)': 'Envío marítimo nuevo (más de 2 kg)',
  'ship by sea for order over 11kg': 'Envío marítimo para pedidos de más de 11 kg',
  'ups korea no battery': 'UPS Corea sin batería',
  'write to advisor pay products first before sending pay shipping depends on the real weight':
    'Escriba al asesor; pague los productos primero. El flete se cobra según el peso real antes de enviar',
  'contact advisor': 'Contactar al asesor',
  'contact avisor': 'Contactar al asesor',
}

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/write to advisor/gi, 'escribir al asesor'],
  [/pay products first/gi, 'pague los productos primero'],
  [/before sending/gi, 'antes de enviar'],
  [/pay shipping depends on the real weight/gi, 'el flete se cobra según el peso real'],
  [/depends on the real weight/gi, 'según el peso real'],
  [/ship by sea/gi, 'envío marítimo'],
  [/for order over/gi, 'para pedidos de más de'],
  [/\bno battery\b/gi, 'sin batería'],
  [/\bkorea\b/gi, 'Corea'],
  [/contact\s+advi[s]?or/gi, 'contactar al asesor'],
  [/business\s*days?/gi, 'días hábiles'],
  [/(\d+)\s*-\s*(\d+)\s*days?/gi, '$1-$2 días'],
  [/\bover\b/gi, 'más de'],
  [/envío marítimo new/gi, 'envío marítimo nuevo'],
]

export function translateShippingTextToEs(raw: string): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  const exact = EXACT_ES[normalizeKey(value)]
  if (exact) return exact

  let out = value
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    out = out.replace(pattern, replacement)
  }
  out = out.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim()
  if (containsChinese(out)) {
    const fromDictionary = translateTitleKeywords(out, 'es').trim()
    if (fromDictionary) out = fromDictionary
  }
  return out || value
}

export function localizeShippingText(
  raw: string,
  lang: 'en' | 'es',
  override?: string | null,
): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (lang !== 'es') return value
  const custom = String(override || '').trim()
  if (custom) return custom
  return translateShippingTextToEs(value)
}
