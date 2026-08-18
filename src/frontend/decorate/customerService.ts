import type { CSSProperties } from 'react'
import { isNarrowViewport } from '@/frontend/utils/isNarrowViewport'

/** 全站客服（WhatsApp）配置 —— 接入页面可视化装修 */

/** @deprecated 保留兼容旧配置；新定位统一为 free + 锚点像素 */
export type FloatPositionPreset =
  | 'bottom-right'
  | 'bottom-left'
  | 'right-center'
  | 'custom'
  | 'free'

export type FloatAnchorX = 'left' | 'right'
export type FloatAnchorY = 'top' | 'bottom'

export type CustomerServiceConfig = {
  /** WhatsApp 号码：纯数字含国家码，如 8613500529627 */
  whatsappNumber: string
  /**
   * PayPal 收款入口：paypal.me/店铺名 或 PayPal 邮箱。
   * 前台支付时会自动带上该笔订单金额，无需每次改链接。
   */
  paypalLink: string
  /** 是否显示全站悬浮按钮 */
  floatEnabled: boolean
  /** 悬浮图标尺寸（px） */
  floatSize: number
  /**
   * 位置模式：free 为自由拖拽坐标；其余为历史预设（加载时会换算为锚点）
   */
  floatPosition: FloatPositionPreset
  /** 水平锚边 */
  floatAnchorX: FloatAnchorX
  /** 垂直锚边 */
  floatAnchorY: FloatAnchorY
  /** 距顶部 px（floatAnchorY === 'top' 时生效） */
  floatTop: number
  /** 距底部 px（floatAnchorY === 'bottom' 时生效） */
  floatBottom: number
  /** 距右侧 px（floatAnchorX === 'right' 时生效） */
  floatRight: number
  /** 距左侧 px（floatAnchorX === 'left' 时生效） */
  floatLeft: number
  /** 下单成功弹窗引导文案 */
  successGuideText: string
}

export const CUSTOMER_SERVICE_STORAGE_KEY = 'autocoder:customer-service:v1'
export const CUSTOMER_SERVICE_SETTING_TITLE = 'CUSTOMER_SERVICE_WHATSAPP'

export const DEFAULT_CUSTOMER_SERVICE_CONFIG: CustomerServiceConfig = {
  whatsappNumber: '8613500529627',
  paypalLink: '',
  floatEnabled: true,
  floatSize: 56,
  floatPosition: 'free',
  floatAnchorX: 'right',
  floatAnchorY: 'bottom',
  floatTop: 24,
  floatBottom: 24,
  floatRight: 24,
  floatLeft: 24,
  successGuideText: '如有付款问题，请点击联系客服',
}

export function normalizeWhatsappNumber(raw?: string | null): string {
  return String(raw || '').replace(/\D/g, '')
}

export function buildWhatsAppUrl(number?: string | null, text?: string | null): string | null {
  const digits = normalizeWhatsappNumber(number)
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  const msg = String(text || '').trim()
  if (!msg) return base
  return `${base}?text=${encodeURIComponent(msg)}`
}

export function clampFloatSize(size: number): number {
  if (!Number.isFinite(size)) return DEFAULT_CUSTOMER_SERVICE_CONFIG.floatSize
  return Math.min(96, Math.max(40, Math.round(size)))
}

function clampNonNeg(value: unknown, fallback = 0): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n) || n < 0) return fallback
  return n
}

/** 将历史预设换算为 free 锚点 */
export function migratePresetToFreeAnchors(
  position: FloatPositionPreset,
  raw: Partial<CustomerServiceConfig>,
): Pick<
  CustomerServiceConfig,
  'floatPosition' | 'floatAnchorX' | 'floatAnchorY' | 'floatTop' | 'floatBottom' | 'floatLeft' | 'floatRight'
> {
  const bottom = clampNonNeg(raw.floatBottom, 24)
  const right = clampNonNeg(raw.floatRight, 24)
  const left = clampNonNeg(raw.floatLeft, 24)
  const top = clampNonNeg(raw.floatTop, 24)

  if (position === 'free' || (raw.floatAnchorX && raw.floatAnchorY && position === 'custom')) {
    const anchorX: FloatAnchorX = raw.floatAnchorX === 'left' ? 'left' : 'right'
    const anchorY: FloatAnchorY = raw.floatAnchorY === 'top' ? 'top' : 'bottom'
    return {
      floatPosition: 'free',
      floatAnchorX: anchorX,
      floatAnchorY: anchorY,
      floatTop: top,
      floatBottom: bottom,
      floatLeft: left,
      floatRight: right,
    }
  }

  switch (position) {
    case 'bottom-left':
      return {
        floatPosition: 'free',
        floatAnchorX: 'left',
        floatAnchorY: 'bottom',
        floatTop: top,
        floatBottom: bottom,
        floatLeft: left,
        floatRight: right,
      }
    case 'right-center':
      return {
        floatPosition: 'free',
        floatAnchorX: 'right',
        floatAnchorY: 'top',
        floatTop:
          typeof window !== 'undefined'
            ? Math.max(0, Math.round(window.innerHeight / 2 - clampFloatSize(Number(raw.floatSize) || 56) / 2))
            : 200,
        floatBottom: bottom,
        floatLeft: left,
        floatRight: right,
      }
    case 'custom':
      // 旧 custom 以 bottom/right 为主
      return {
        floatPosition: 'free',
        floatAnchorX: left > 0 && right <= 0 ? 'left' : 'right',
        floatAnchorY: 'bottom',
        floatTop: top,
        floatBottom: bottom,
        floatLeft: left,
        floatRight: right > 0 ? right : 24,
      }
    case 'bottom-right':
    default:
      return {
        floatPosition: 'free',
        floatAnchorX: 'right',
        floatAnchorY: 'bottom',
        floatTop: top,
        floatBottom: bottom,
        floatLeft: left,
        floatRight: right,
      }
  }
}

export function normalizeCustomerServiceConfig(
  raw?: Partial<CustomerServiceConfig> | null,
): CustomerServiceConfig {
  const merged = { ...DEFAULT_CUSTOMER_SERVICE_CONFIG, ...(raw || {}) }
  const position = (
    ['bottom-right', 'bottom-left', 'right-center', 'custom', 'free'] as const
  ).includes(merged.floatPosition as FloatPositionPreset)
    ? (merged.floatPosition as FloatPositionPreset)
    : 'free'

  const anchors = migratePresetToFreeAnchors(position, merged)

  return {
    whatsappNumber:
      normalizeWhatsappNumber(merged.whatsappNumber) || DEFAULT_CUSTOMER_SERVICE_CONFIG.whatsappNumber,
    paypalLink: String(merged.paypalLink || '').trim(),
    floatEnabled: Boolean(merged.floatEnabled),
    floatSize: clampFloatSize(Number(merged.floatSize)),
    ...anchors,
    successGuideText:
      String(merged.successGuideText || '').trim() || DEFAULT_CUSTOMER_SERVICE_CONFIG.successGuideText,
  }
}

export function readCustomerServiceLocal(): CustomerServiceConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_CUSTOMER_SERVICE_CONFIG }
  try {
    const raw = window.localStorage.getItem(CUSTOMER_SERVICE_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CUSTOMER_SERVICE_CONFIG }
    return normalizeCustomerServiceConfig(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_CUSTOMER_SERVICE_CONFIG }
  }
}

export function writeCustomerServiceLocal(config: CustomerServiceConfig) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    CUSTOMER_SERVICE_STORAGE_KEY,
    JSON.stringify(normalizeCustomerServiceConfig(config)),
  )
}

/**
 * 根据拖拽结束后的视口矩形，计算更靠近的左右 / 上下锚边及像素值。
 */
export function computeFloatAnchorsFromRect(rect: DOMRect): Pick<
  CustomerServiceConfig,
  'floatPosition' | 'floatAnchorX' | 'floatAnchorY' | 'floatTop' | 'floatBottom' | 'floatLeft' | 'floatRight'
> {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const left = Math.max(0, Math.round(rect.left))
  const top = Math.max(0, Math.round(rect.top))
  const right = Math.max(0, Math.round(vw - rect.right))
  const bottom = Math.max(0, Math.round(vh - rect.bottom))

  const floatAnchorX: FloatAnchorX = centerX <= vw / 2 ? 'left' : 'right'
  const floatAnchorY: FloatAnchorY = centerY <= vh / 2 ? 'top' : 'bottom'

  return {
    floatPosition: 'free',
    floatAnchorX,
    floatAnchorY,
    floatLeft: left,
    floatTop: top,
    floatRight: right,
    floatBottom: bottom,
  }
}

/** 将图标限制在视口内，返回 left/top（用于拖拽过程中的临时定位） */
export function clampFloatPointInViewport(
  left: number,
  top: number,
  size: number,
): { left: number; top: number } {
  const maxLeft = Math.max(0, window.innerWidth - size)
  const maxTop = Math.max(0, window.innerHeight - size)
  return {
    left: Math.min(maxLeft, Math.max(0, Math.round(left))),
    top: Math.min(maxTop, Math.max(0, Math.round(top))),
  }
}

/** Mobile viewport: keep FAB bottom-right above bottom nav (ignore mid-screen drag coords). */
export function isMobileStorefrontViewport(): boolean {
  if (typeof window === 'undefined') return false
  return isNarrowViewport()
}

/**
 * On phones, pin to bottom-right above `.mobile-bottom-nav`.
 * Saved free anchors often place the icon mid-viewport and cover CATEGORIES / filters.
 */
export function resolveFloatStyle(
  config: CustomerServiceConfig,
  options?: { forceMobileSafe?: boolean },
): CSSProperties {
  const size = clampFloatSize(config.floatSize)
  const normalized = normalizeCustomerServiceConfig(config)
  const forceMobileSafe =
    options?.forceMobileSafe ??
    (typeof window !== 'undefined' && isMobileStorefrontViewport())

  const style: CSSProperties = {
    width: size,
    height: size,
    zIndex: forceMobileSafe ? 90 : 60,
    left: 'auto',
    right: 'auto',
    top: 'auto',
    bottom: 'auto',
    transform: 'none',
  }

  if (forceMobileSafe) {
    // Matches CSS: var(--mobile-nav-height) + 16px safe gap
    style.right = 16
    style.bottom =
      'calc(var(--mobile-nav-height, 3.75rem) + env(safe-area-inset-bottom, 0px) + 16px)'
    style.left = 'auto'
    style.top = 'auto'
    return style
  }

  if (normalized.floatAnchorX === 'left') {
    style.left = normalized.floatLeft
  } else {
    style.right = normalized.floatRight
  }

  if (normalized.floatAnchorY === 'top') {
    style.top = normalized.floatTop
  } else {
    style.bottom = normalized.floatBottom
  }

  return style
}

/** 面板展示用：当前生效的水平/垂直坐标文案 */
export function describeFloatCoordinates(config: CustomerServiceConfig): {
  horizontalLabel: string
  horizontalValue: number
  verticalLabel: string
  verticalValue: number
} {
  const normalized = normalizeCustomerServiceConfig(config)
  return {
    horizontalLabel: normalized.floatAnchorX,
    horizontalValue:
      normalized.floatAnchorX === 'left' ? normalized.floatLeft : normalized.floatRight,
    verticalLabel: normalized.floatAnchorY,
    verticalValue: normalized.floatAnchorY === 'top' ? normalized.floatTop : normalized.floatBottom,
  }
}
