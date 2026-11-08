/**
 * 17TRACK API v2.4 helpers.
 * Token from TRACK17_TOKEN (or SEVENTEENTRACK_TOKEN / TRACK17_API_KEY).
 */

const TRACK17_BASE = 'https://api.17track.net/track/v2.4'

export type Track17StatusSnapshot = {
  number: string
  status: string
  statusLabel: string
  latestEvent: string
  latestTime: string
  carrier: number | null
  fetchedAt: string
  publicUrl: string
  error?: string
}

const STATUS_LABELS: Record<string, string> = {
  NotFound: '查询无结果',
  InfoReceived: '运输商已收信息',
  InTransit: '运输中',
  Expired: '运输过久未更新',
  AvailableForPickup: '到达待取',
  OutForDelivery: '派送中',
  DeliveryFailure: '投递失败',
  Delivered: '已签收',
  Exception: '可能异常',
}

export function track17PublicUrl(number: string): string {
  return `https://t.17track.net/zh-cn#nums=${encodeURIComponent(number)}`
}

export function track17StatusLabel(status: string): string {
  return STATUS_LABELS[status] || status || '未知'
}

export function readTrack17Token(): string {
  return String(
    process.env.TRACK17_TOKEN ||
      process.env.SEVENTEENTRACK_TOKEN ||
      process.env.TRACK17_API_KEY ||
      '',
  ).trim()
}

function normalizeTrackingNumber(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, '')
    .slice(0, 80)
}

async function track17Post(path: string, body: unknown, token: string): Promise<any> {
  const res = await fetch(`${TRACK17_BASE}${path}`, {
    method: 'POST',
    headers: {
      '17token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`17TRACK 返回异常 HTTP ${res.status}`)
  }
  if (!res.ok) {
    throw new Error(`17TRACK HTTP ${res.status}: ${String(json?.message || text).slice(0, 200)}`)
  }
  return json
}

function parseAcceptedRow(row: any, number: string): Track17StatusSnapshot {
  const track = row?.track_info || {}
  const latestStatus = String(track?.latest_status?.status || '').trim()
  const event = track?.latest_event || {}
  const description =
    String(event?.description_translation?.description || event?.description || '').trim() ||
    String(track?.latest_status?.sub_status_descr || '').trim()
  const latestTime = String(event?.time_iso || event?.time_utc || event?.time_raw?.date || '').trim()
  const carrierRaw = row?.carrier
  const carrier = Number.isFinite(Number(carrierRaw)) ? Number(carrierRaw) : null
  return {
    number,
    status: latestStatus || 'NotFound',
    statusLabel: track17StatusLabel(latestStatus || 'NotFound'),
    latestEvent: description.slice(0, 300),
    latestTime: latestTime.slice(0, 40),
    carrier,
    fetchedAt: new Date().toISOString(),
    publicUrl: track17PublicUrl(number),
  }
}

/** Register + fetch latest status for up to 40 numbers. */
export async function fetchTrack17Statuses(rawNumbers: string[]): Promise<{
  configured: boolean
  items: Track17StatusSnapshot[]
  message?: string
}> {
  const numbers = Array.from(
    new Set(rawNumbers.map(normalizeTrackingNumber).filter((n) => n.length >= 6)),
  ).slice(0, 40)
  if (!numbers.length) {
    return { configured: Boolean(readTrack17Token()), items: [] }
  }

  const token = readTrack17Token()
  if (!token) {
    return {
      configured: false,
      items: numbers.map((number) => ({
        number,
        status: '',
        statusLabel: '未配置密钥',
        latestEvent: '请在服务器 .env 配置 TRACK17_TOKEN',
        latestTime: '',
        carrier: null,
        fetchedAt: new Date().toISOString(),
        publicUrl: track17PublicUrl(number),
        error: 'missing_token',
      })),
      message: '未配置 TRACK17_TOKEN，已提供 17TRACK 公开查询链接',
    }
  }

  const payload = numbers.map((number) => ({ number, auto_detection: true }))
  try {
    await track17Post('/register', payload, token)
  } catch {
    // Already registered / partial accept is fine; gettrackinfo is the source of truth.
  }

  let info: any
  try {
    info = await track17Post('/gettrackinfo', numbers.map((number) => ({ number })), token)
  } catch (error: any) {
    return {
      configured: true,
      items: numbers.map((number) => ({
        number,
        status: '',
        statusLabel: '查询失败',
        latestEvent: String(error?.message || '17TRACK 查询失败').slice(0, 200),
        latestTime: '',
        carrier: null,
        fetchedAt: new Date().toISOString(),
        publicUrl: track17PublicUrl(number),
        error: 'request_failed',
      })),
      message: String(error?.message || '17TRACK 查询失败'),
    }
  }

  const byNumber = new Map<string, Track17StatusSnapshot>()
  for (const row of info?.data?.accepted || []) {
    const number = normalizeTrackingNumber(String(row?.number || ''))
    if (!number) continue
    byNumber.set(number.toUpperCase(), parseAcceptedRow(row, number))
  }
  for (const row of info?.data?.rejected || []) {
    const number = normalizeTrackingNumber(String(row?.number || ''))
    if (!number) continue
    byNumber.set(number.toUpperCase(), {
      number,
      status: '',
      statusLabel: '查询失败',
      latestEvent: String(row?.error?.message || row?.message || '被拒绝').slice(0, 200),
      latestTime: '',
      carrier: null,
      fetchedAt: new Date().toISOString(),
      publicUrl: track17PublicUrl(number),
      error: 'rejected',
    })
  }

  const items = numbers.map((number) => {
    const hit = byNumber.get(number.toUpperCase())
    if (hit) return hit
    return {
      number,
      status: 'NotFound',
      statusLabel: track17StatusLabel('NotFound'),
      latestEvent: '暂无轨迹',
      latestTime: '',
      carrier: null,
      fetchedAt: new Date().toISOString(),
      publicUrl: track17PublicUrl(number),
    }
  })

  return { configured: true, items }
}

export function readTrackCache(raw: unknown): Record<string, Track17StatusSnapshot> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const info = raw as Record<string, unknown>
  const cache = info.trackByNumber
  if (!cache || typeof cache !== 'object' || Array.isArray(cache)) return {}
  const out: Record<string, Track17StatusSnapshot> = {}
  for (const [key, value] of Object.entries(cache as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const row = value as Record<string, unknown>
    const number = normalizeTrackingNumber(String(row.number || key))
    if (!number) continue
    out[number.toUpperCase()] = {
      number,
      status: String(row.status || ''),
      statusLabel: String(row.statusLabel || track17StatusLabel(String(row.status || ''))),
      latestEvent: String(row.latestEvent || '').slice(0, 300),
      latestTime: String(row.latestTime || '').slice(0, 40),
      carrier: row.carrier == null || !Number.isFinite(Number(row.carrier)) ? null : Number(row.carrier),
      fetchedAt: String(row.fetchedAt || ''),
      publicUrl: String(row.publicUrl || track17PublicUrl(number)),
      error: row.error ? String(row.error) : undefined,
    }
  }
  return out
}

export function mergeTrackCache(
  existing: Record<string, Track17StatusSnapshot>,
  items: Track17StatusSnapshot[],
): Record<string, Track17StatusSnapshot> {
  const next = { ...existing }
  for (const item of items) {
    next[item.number.toUpperCase()] = item
  }
  return next
}
