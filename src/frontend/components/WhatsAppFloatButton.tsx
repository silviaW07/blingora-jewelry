'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getCustomerServiceConfig } from '@/frontend/actions/CustomerService'
import {
  buildWhatsAppUrl,
  clampFloatPointInViewport,
  clampFloatSize,
  computeFloatAnchorsFromRect,
  readCustomerServiceLocal,
  resolveFloatStyle,
  writeCustomerServiceLocal,
  type CustomerServiceConfig,
  DEFAULT_CUSTOMER_SERVICE_CONFIG,
} from '@/frontend/decorate/customerService'
import { useDecorateMode } from '@/frontend/decorate/DecorateContext'

const WhatsAppGlyph = ({ size }: { size: number }) => (
  <svg
    width={Math.round(size * 0.5)}
    height={Math.round(size * 0.5)}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

type DragSession = {
  pointerId: number
  offsetX: number
  offsetY: number
  moved: boolean
}

export function WhatsAppFloatButton() {
  const pathname = usePathname()
  const {
    isDecorateMode,
    isFloatDragMode,
    customerService: draftConfig,
    persistCustomerService,
  } = useDecorateMode()
  const [config, setConfig] = useState<CustomerServiceConfig>(() => readCustomerServiceLocal())
  const [dragOffset, setDragOffset] = useState<{ left: number; top: number } | null>(null)
  /** When true, pin FAB bottom-right above mobile bottom nav (ignore saved mid-screen coords). */
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const rootRef = useRef<HTMLAnchorElement | null>(null)
  const dragRef = useRef<DragSession | null>(null)

  const reloadPersistedConfig = useCallback(() => {
    let cancelled = false
    // 先用本地缓存兜底，避免路由切换时图标闪回默认值
    setConfig(readCustomerServiceLocal())
    getCustomerServiceConfig()
      .then((res) => {
        if (cancelled) return
        if (res.persisted) {
          setConfig(res.config)
          writeCustomerServiceLocal(res.config)
        } else {
          setConfig(readCustomerServiceLocal())
        }
      })
      .catch(() => {
        if (!cancelled) setConfig(readCustomerServiceLocal())
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setDragOffset(null)
    dragRef.current = null
  }, [isFloatDragMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const syncViewport = () => setIsMobileViewport(mq.matches)
    syncViewport()
    mq.addEventListener('change', syncViewport)
    return () => mq.removeEventListener('change', syncViewport)
  }, [])

  // 页面加载 / 路由切换时，非装修态一律重新读取后台最新坐标
  useEffect(() => {
    if (isDecorateMode) return
    return reloadPersistedConfig()
  }, [isDecorateMode, pathname, reloadPersistedConfig])

  useEffect(() => {
    if (isDecorateMode) return
    const syncFromStorage = () => setConfig(readCustomerServiceLocal())
    window.addEventListener('focus', syncFromStorage)
    window.addEventListener('storage', syncFromStorage)
    return () => {
      window.removeEventListener('focus', syncFromStorage)
      window.removeEventListener('storage', syncFromStorage)
    }
  }, [isDecorateMode])

  const active = isDecorateMode ? draftConfig : config
  const href = useMemo(() => buildWhatsAppUrl(active.whatsappNumber), [active.whatsappNumber])
  // Decorate drag keeps free placement; visitors on mobile always get safe parking
  const forceMobileSafe = isMobileViewport && !isFloatDragMode
  const baseStyle = useMemo(
    () => resolveFloatStyle(active, { forceMobileSafe }),
    [active, forceMobileSafe],
  )
  const size = clampFloatSize(active.floatSize || DEFAULT_CUSTOMER_SERVICE_CONFIG.floatSize)

  const style = useMemo(() => {
    if (!dragOffset || forceMobileSafe) return baseStyle
    return {
      ...baseStyle,
      left: dragOffset.left,
      top: dragOffset.top,
      right: 'auto',
      bottom: 'auto',
      transform: 'none',
    }
  }, [baseStyle, dragOffset, forceMobileSafe])

  const commitDragPosition = useCallback(async () => {
    const el = rootRef.current
    if (!el) return
    const anchors = computeFloatAnchorsFromRect(el.getBoundingClientRect())
    // 先清临时位移，改用即将写入的锚点样式
    setDragOffset(null)
    const saved = await persistCustomerService(anchors)
    if (saved) {
      setConfig(saved)
    }
  }, [persistCustomerService])

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLAnchorElement>) => {
      if (!isFloatDragMode) return
      event.preventDefault()
      event.stopPropagation()
      const el = rootRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      // 拖拽过程改用 left/top，便于指针跟随
      setDragOffset({ left: Math.round(rect.left), top: Math.round(rect.top) })
      dragRef.current = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        moved: false,
      }
      el.setPointerCapture(event.pointerId)
    },
    [isFloatDragMode],
  )

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLAnchorElement>) => {
      const session = dragRef.current
      if (!isFloatDragMode || !session || session.pointerId !== event.pointerId) return
      event.preventDefault()
      session.moved = true
      const next = clampFloatPointInViewport(
        event.clientX - session.offsetX,
        event.clientY - session.offsetY,
        size,
      )
      setDragOffset(next)
    },
    [isFloatDragMode, size],
  )

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLAnchorElement>) => {
      const session = dragRef.current
      if (!isFloatDragMode || !session || session.pointerId !== event.pointerId) return
      event.preventDefault()
      event.stopPropagation()
      try {
        rootRef.current?.releasePointerCapture(event.pointerId)
      } catch {
        // ignore
      }
      dragRef.current = null
      commitDragPosition()
    },
    [commitDragPosition, isFloatDragMode],
  )

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isFloatDragMode) return
      // 拖拽模式下禁止跳转 WhatsApp
      event.preventDefault()
      event.stopPropagation()
    },
    [isFloatDragMode],
  )

  if (!active.floatEnabled || !href) return null
  // 移动端（≤767px）彻底隐藏右下角悬浮钮；桌面端保留。顶栏 WhatsApp 入口另有组件，不受影响。
  if (isMobileViewport && !isFloatDragMode) return null

  return (
    <a
      ref={rootRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      title={isFloatDragMode ? '拖拽以调整位置' : 'WhatsApp'}
      className={`whatsapp-float-btn whatsapp-float-root fixed flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_-10px_rgba(37,211,102,0.75)] transition select-none touch-none ${
        isFloatDragMode
          ? 'z-[120] cursor-grab ring-4 ring-[#2563EB]/70 ring-offset-2 active:cursor-grabbing hover:scale-100'
          : 'z-[60] hover:bg-[#1ebe5d] hover:scale-105 active:scale-95'
      }`}
      style={style}
      data-controller-name="全站WhatsApp悬浮客服"
      data-float-drag-mode={isFloatDragMode ? '1' : '0'}
      data-mobile-safe={forceMobileSafe ? '1' : '0'}
      data-hidden-on-mobile="1"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      draggable={false}
    >
      <WhatsAppGlyph size={size} />
      {isFloatDragMode ? (
        <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1D4ED8] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          拖动定位中
        </span>
      ) : null}
    </a>
  )
}
