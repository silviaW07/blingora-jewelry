'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { OptimizedProductImage } from '@/frontend/components/OptimizedProductImage'

type GalleryItem = { url?: string | null }

type Props = {
  items: GalleryItem[]
  activeUrl?: string | null
  onActiveChange: (url: string) => void
  alt: string
}

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
  const startX = useRef<number | null>(null)
  const startY = useRef(0)

  const goTo = (next: number) => {
    if (slides.length === 0) return
    const clamped = Math.max(0, Math.min(slides.length - 1, next))
    setIndex(clamped)
    const url = slides[clamped]?.url
    if (url) onActiveChange(url)
  }

  useEffect(() => {
    if (!activeUrl || slides.length === 0) return
    const target = slides.findIndex((item) => item.url === activeUrl)
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

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe || event.button !== 0) return
    startX.current = event.clientX
    startY.current = event.clientY
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return
    const dx = event.clientX - startX.current
    const dy = event.clientY - startY.current
    startX.current = null
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    goTo(indexRef.current + (dx < 0 ? 1 : -1))
  }

  return (
    <div
      className="product-detail-carousel"
      aria-roledescription="carousel"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        startX.current = null
      }}
    >
      <OptimizedProductImage
        fill
        src={heroUrl}
        alt={alt}
        className="product-detail-carousel__img"
        imageWidth={960}
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
