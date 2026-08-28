'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'
import { imageUrlsMatch } from '@/frontend/utils/toProxiedImageUrl'

type GalleryItem = { url?: string | null }

type Props = {
  items: GalleryItem[]
  activeUrl?: string | null
  onActiveChange: (url: string) => void
  alt: string
}

const SWIPE_MIN_PX = 36
const LOCK_PX = 8

/**
 * One square hero — same padding-box as list cards (Chrome cannot paint imgs in a
 * 340-slide flex scroller). Swipe / color thumbs change the single visible image.
 */
export function ProductDetailImageCarousel({
  items,
  activeUrl,
  onActiveChange,
  alt,
}: Props) {
  const slides = useMemo(
    () => items.filter((item): item is { url: string } => Boolean(item.url)),
    [items],
  )
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  indexRef.current = index
  const rootRef = useRef<HTMLDivElement | null>(null)
  const tracking = useRef<{
    x: number
    y: number
    active: boolean
    axis: 'x' | 'y' | null
  }>({
    x: 0,
    y: 0,
    active: false,
    axis: null,
  })
  const onActiveChangeRef = useRef(onActiveChange)
  onActiveChangeRef.current = onActiveChange
  const slidesRef = useRef(slides)
  slidesRef.current = slides

  const goTo = (next: number) => {
    const list = slidesRef.current
    if (list.length === 0) return
    const clamped = Math.max(0, Math.min(list.length - 1, next))
    setIndex(clamped)
    const url = list[clamped]?.url
    if (url) onActiveChangeRef.current(url)
  }

  useEffect(() => {
    if (!activeUrl || slides.length === 0) return
    const target = slides.findIndex((item) => imageUrlsMatch(item.url, activeUrl))
    if (target < 0 || target === indexRef.current) return
    setIndex(target)
  }, [activeUrl, slides])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const start = (clientX: number, clientY: number) => {
      tracking.current = { x: clientX, y: clientY, active: true, axis: null }
    }

    const move = (clientX: number, clientY: number, event: Event) => {
      if (!tracking.current.active) return
      const dx = clientX - tracking.current.x
      const dy = clientY - tracking.current.y
      if (!tracking.current.axis && (Math.abs(dx) > LOCK_PX || Math.abs(dy) > LOCK_PX)) {
        tracking.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      if (tracking.current.axis === 'x' && slidesRef.current.length > 1) {
        event.preventDefault()
      }
    }

    const end = (clientX: number, clientY: number) => {
      if (!tracking.current.active) return
      const dx = clientX - tracking.current.x
      const dy = clientY - tracking.current.y
      const axis = tracking.current.axis
      tracking.current.active = false
      tracking.current.axis = null
      if (slidesRef.current.length <= 1) return
      if (axis === 'y') return
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return
      goTo(indexRef.current + (dx < 0 ? 1 : -1))
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      start(event.touches[0].clientX, event.touches[0].clientY)
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      move(event.touches[0].clientX, event.touches[0].clientY, event)
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!touch) {
        tracking.current.active = false
        return
      }
      end(touch.clientX, touch.clientY)
    }
    const onTouchCancel = () => {
      tracking.current.active = false
      tracking.current.axis = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchCancel)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [])

  if (slides.length === 0 && !String(activeUrl || '').trim()) {
    return <div className="product-detail-carousel product-detail-carousel--empty" aria-hidden />
  }

  const current = slides[index] || slides[0]
  const heroUrl = String(activeUrl || '').trim() || current?.url || ''
  const canSwipe = slides.length > 1

  if (!heroUrl) {
    return <div className="product-detail-carousel product-detail-carousel--empty" aria-hidden />
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe || event.pointerType !== 'mouse' || event.button !== 0) return
    tracking.current = { x: event.clientX, y: event.clientY, active: true, axis: null }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    if (!canSwipe || !tracking.current.active) return
    const dx = event.clientX - tracking.current.x
    const dy = event.clientY - tracking.current.y
    tracking.current.active = false
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return
    goTo(indexRef.current + (dx < 0 ? 1 : -1))
  }

  return (
    <div
      ref={rootRef}
      className="product-detail-carousel"
      aria-roledescription="carousel"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={(event) => {
        if (event.pointerType !== 'mouse') return
        tracking.current.active = false
      }}
    >
      <OptimizedProductImage
        fill
        src={heroUrl}
        alt={alt}
        className="product-detail-carousel__img"
        imageWidth={720}
        priority
      />
      {canSwipe ? (
        <div className="product-detail-carousel__fraction" aria-live="polite">
          {index + 1} / {slides.length}
        </div>
      ) : null}
    </div>
  )
}
