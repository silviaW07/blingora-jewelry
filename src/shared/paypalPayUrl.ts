/** Build a PayPal checkout URL with a dynamic order amount. */

export function normalizePaypalBaseLink(raw?: string | null): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value
  if (/^https?:\/\//i.test(value)) return value
  if (/^(www\.)?paypal\.(me|com)\//i.test(value)) return `https://${value}`
  return value
}

function money(amount: number): string {
  return (Math.round((Number(amount) || 0) * 100) / 100).toFixed(2)
}

/**
 * Turn a merchant PayPal link / email into a pay URL for this order.
 *
 * Supported bases:
 * - `https://paypal.me/YourName` → `https://paypal.me/YourName/88.50USD`
 * - PayPal business email → official `_xclick` checkout with amount
 * - `paypal.com` `_xclick` URLs → `amount` / `currency_code` rewritten
 */
export function buildPaypalPayUrl(input: {
  baseLink?: string | null
  amount: number
  currency?: string | null
  itemName?: string | null
}): string | null {
  const amount = Math.round((Number(input.amount) || 0) * 100) / 100
  if (!(amount > 0)) return null
  const currency = String(input.currency || 'USD').trim().toUpperCase() || 'USD'
  const itemName = String(input.itemName || 'Order').trim() || 'Order'
  const raw = normalizePaypalBaseLink(input.baseLink)
  if (!raw) return null

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) && !raw.includes('://')) {
    const params = new URLSearchParams({
      cmd: '_xclick',
      business: raw,
      item_name: itemName,
      amount: money(amount),
      currency_code: currency,
    })
    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`
  }

  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase()
  const pathParts = url.pathname.split('/').filter(Boolean)
  const paypalMeIndex = pathParts.findIndex((part) => part.toLowerCase() === 'paypalme')
  const isPaypalMe = host === 'paypal.me' || paypalMeIndex >= 0

  if (isPaypalMe) {
    const username = isPaypalMe && host === 'paypal.me' ? pathParts[0] : pathParts[paypalMeIndex + 1]
    if (!username) return null
    const amountToken = `${money(amount)}${currency}`
    url.hash = ''
    url.search = ''
    url.pathname =
      host === 'paypal.me' ? `/${username}/${amountToken}` : `/paypalme/${username}/${amountToken}`
    return url.toString()
  }

  if (host.endsWith('paypal.com')) {
    if (!url.searchParams.get('cmd')) url.searchParams.set('cmd', '_xclick')
    url.searchParams.set('amount', money(amount))
    url.searchParams.set('currency_code', currency)
    if (itemName && !url.searchParams.get('item_name')) {
      url.searchParams.set('item_name', itemName)
    }
    return url.toString()
  }

  return null
}
