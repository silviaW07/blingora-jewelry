'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { acquireImageSlot } from '@/frontend/utils/imageLoadGate'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'

export { toProxiedImageUrl }

type Props = {
  src?: string | null
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  imageWidth?: number
  quality?: number
}

/**
 * Native <img>. Load near the viewport, at most 6 in flight, always a small thumb.
 * Do not dump the whole page after a timeout — that is what made lists crawl.
 */
export function OptimizedProductImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  priority = false,
  imageWidth = 400,
  quality = 85,
}: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const releaseRef = useRef<(() => void) | null>(null)
  const [near, setNear] = useState(priority)
  const [canFetch, setCanFetch] = useState(priority)
  const primary = toProxiedImageUrl(src, { width: imageWidth, quality })
  const raw = String(src || '').trim()
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setAttempt(0)
    setFailed(false)
    setCanFetch(priority)
    setNear(priority)
  }, [src, imageWidth, quality, priority])

  useEffect(() => {
    if (priority || near) return
    const node = boxRef.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '480px 0px', threshold: 0.01 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [priority, near])

  useEffect(() => {
    if (!near || canFetch) return
    let cancelled = false
    void acquireImageSlot(priority).then((release) => {
      if (cancelled) {
        release()
        return
      }
      releaseRef.current = release
      setCanFetch(true)
    })
    return () => {
      cancelled = true
    }
  }, [near, canFetch, priority])

  useEffect(() => {
    return () => {
      releaseRef.current?.()
      releaseRef.current = null
    }
  }, [])

  const releaseSlot = () => {
    releaseRef.current?.()
    releaseRef.current = null
  }

  const displaySrc =
    attempt === 0
      ? primary
      : toProxiedImageUrl(src, { width: imageWidth, quality: Math.min(80, quality + 10) }) || primary

  const shellClass = fill ? 'absolute inset-0 bg-[#f0ebe3]' : 'bg-[#f0ebe3]'

  if ((!primary && !raw) || failed || !displaySrc) {
    return <div className={cn(shellClass, className)} aria-hidden />
  }

  const imgClass = fill
    ? cn('absolute inset-0 h-full w-full max-w-full object-cover', className)
    : cn('max-w-full object-cover', className)

  return (
    <div ref={boxRef} className={fill ? 'absolute inset-0' : 'relative'}>
      <div className={cn(shellClass)} aria-hidden />
      {canFetch ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${attempt}-${displaySrc}`}
          src={displaySrc}
          alt={alt}
          width={fill ? imageWidth : width || imageWidth}
          height={fill ? imageWidth : height || imageWidth}
          className={imgClass}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          fetchPriority={priority ? 'high' : 'low'}
          referrerPolicy="no-referrer"
          onContextMenu={(event) => event.preventDefault()}
          onError={() => {
            releaseSlot()
            if (attempt < 1) setAttempt(1)
            else setFailed(true)
          }}
          onLoad={releaseSlot}
        />
      ) : null}
    </div>
  )
}
