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
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const activeUrlRef = useRef(activeUrl)
  activeUrlRef.current = activeUrl
  const onActiveChangeRef = useRef(onActiveChange)
  onActiveChangeRef.current = onActiveChange

  const syncFromScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const width = el.clientWidth || 1
    const next = Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / width)))
    setIndex(next)
    const url = slides[next]?.url
    if (url && url !== activeUrlRef.current) onActiveChangeRef.current(url)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !activeUrl || slides.length === 0) return
    const target = slides.findIndex((item) => item.url === activeUrl)
    if (target < 0) return
    const width = el.clientWidth || 1
    const left = target * width
    if (Math.abs(el.scrollLeft - left) > 8) {
      el.scrollTo({ left, behavior: 'auto' })
    }
    setIndex(target)
  }, [activeUrl, slides])

  if (slides.length === 0) {
    return (
      <div className="product-detail-carousel product-detail-carousel--empty" aria-hidden>
        <div className="product-detail-carousel__viewport" />
      </div>
    )
  }

  return (
    <div className="product-detail-carousel" aria-roledescription="carousel">
      <div
        className="product-detail-carousel__viewport"
        ref={scrollerRef}
        onScroll={syncFromScroll}
      >
        {slides.map((item, slideIndex) => (
          <div className="product-detail-carousel__slide" key={`${item.url}-${slideIndex}`}>
            <div className="product-detail-carousel__slide-inner">
              <OptimizedProductImage
                src={item.url}
                alt={alt}
                className="product-detail-carousel__img"
                imageWidth={1600}
                priority={slideIndex === 0}
              />
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <div className="product-detail-carousel__fraction" aria-live="polite">
          {index + 1} / {slides.length}
        </div>
      ) : null}
    </div>
  )
}
