'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: slides.length > 1,
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: false,
    watchDrag: true,
  })
  const [index, setIndex] = useState(0)

  const syncFromApi = useCallback(() => {
    if (!emblaApi) return
    const next = emblaApi.selectedScrollSnap()
    setIndex(next)
    const url = slides[next]?.url
    if (url) onActiveChange(url)
  }, [emblaApi, onActiveChange, slides])

  useEffect(() => {
    if (!emblaApi) return
    syncFromApi()
    emblaApi.on('select', syncFromApi)
    emblaApi.on('reInit', syncFromApi)
    return () => {
      emblaApi.off('select', syncFromApi)
      emblaApi.off('reInit', syncFromApi)
    }
  }, [emblaApi, syncFromApi])

  /** Chrome often mounts while carousel was display:none — reInit once visible. */
  useEffect(() => {
    if (!emblaApi) return
    const reInit = () => emblaApi.reInit()
    reInit()
    const raf = requestAnimationFrame(reInit)
    const t1 = window.setTimeout(reInit, 120)
    const t2 = window.setTimeout(reInit, 400)
    window.addEventListener('resize', reInit)
    window.visualViewport?.addEventListener('resize', reInit)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', reInit)
      window.visualViewport?.removeEventListener('resize', reInit)
    }
  }, [emblaApi, slides.length])

  useEffect(() => {
    if (!emblaApi || !activeUrl || slides.length === 0) return
    const target = slides.findIndex((item) => item.url === activeUrl)
    if (target < 0) return
    if (emblaApi.selectedScrollSnap() !== target) {
      emblaApi.scrollTo(target)
      setIndex(target)
    }
  }, [activeUrl, emblaApi, slides])

  if (slides.length === 0) return null

  return (
    <div className="product-detail-carousel" aria-roledescription="carousel">
      <div className="product-detail-carousel__viewport" ref={emblaRef}>
        <div className="product-detail-carousel__container">
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
      </div>
      {slides.length > 1 ? (
        <div className="product-detail-carousel__fraction" aria-live="polite">
          {index + 1} / {slides.length}
        </div>
      ) : null}
    </div>
  )
}
