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

const SWIPE_MIN_PX = 40

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
  const tracking = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  })

  const goTo = (next: number) => {
    if (slides.length === 0) return
    const clamped = Math.max(0, Math.min(slides.length - 1, next))
    setIndex(clamped)
    const url = slides[clamped]?.url
    if (url) onActiveChange(url)
  }

  useEffect(() => {
    if (!activeUrl || slides.length === 0) return
    const target = slides.findIndex((item) => imageUrlsMatch(item.url, activeUrl))
    if (target < 0 || target === indexRef.current) return
    setIndex(target)
  }, [activeUrl, slides])

  if (slides.length === 0 && !String(activeUrl || '').trim()) {
    return <div className="product-detail-carousel product-detail-carousel--empty" aria-hidden />
  }

  const current = slides[index] || slides[0]
  const heroUrl = String(activeUrl || '').trim() || current?.url || ''
  const canSwipe = slides.length > 1

  if (!heroUrl) {
    return <div className="product-detail-carousel product-detail-carousel--empty" aria-hidden />
  }

  const finishSwipe = (clientX: number, clientY: number) => {
    if (!canSwipe || !tracking.current.active) return
    tracking.current.active = false
    const dx = clientX - tracking.current.x
    const dy = clientY - tracking.current.y
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return
    goTo(indexRef.current + (dx < 0 ? 1 : -1))
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe || event.button !== 0) return
    tracking.current = { x: event.clientX, y: event.clientY, active: true }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    finishSwipe(event.clientX, event.clientY)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canSwipe || event.touches.length !== 1) return
    tracking.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      active: true,
    }
  }

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0]
    if (!touch) return
    finishSwipe(touch.clientX, touch.clientY)
  }

  return (
    <div
      className="product-detail-carousel"
      aria-roledescription="carousel"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        tracking.current.active = false
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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
