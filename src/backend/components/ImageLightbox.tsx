'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'

type ImageLightboxProps = {
  src: string
  alt?: string
  open: boolean
  onClose: () => void
}

function uniqueUrls(...urls: Array<string | null | undefined>) {
  const list = urls.map((url) => String(url || '').trim()).filter(Boolean)
  return Array.from(new Set(list))
}

/** Full-screen image preview: click backdrop or press Esc to close. */
export function ImageLightbox({ src, alt = '', open, onClose }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!mounted || !open || !src) return null

  const thumb = toProxiedImageUrl(src, { width: 240, quality: 75 }) || src
  const preview = toProxiedImageUrl(src, { width: 960, quality: 82 }) || src
  const compact = toProxiedImageUrl(src, { width: 720, quality: 80 }) || src

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || '图片预览'}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-[101] flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        title="关闭"
        aria-label="关闭"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <LightboxImage
        thumb={thumb}
        preview={preview}
        compact={compact}
        rawSrc={src}
        alt={alt || '预览大图'}
      />
    </div>,
    document.body,
  )
}

/**
 * Fast preview first (resized CDN/OSS thumb), then a screen-sized image.
 * Avoids pulling full 1688 originals through img-proxy (slow progressive strips).
 */
function LightboxImage({
  thumb,
  preview,
  compact,
  rawSrc,
  alt,
}: {
  thumb: string
  preview: string
  compact: string
  rawSrc: string
  alt: string
}) {
  const candidates = useMemo(
    () => uniqueUrls(preview, compact, rawSrc),
    [compact, preview, rawSrc],
  )
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAttempt(0)
    setReady(false)
  }, [preview, compact, rawSrc])

  if (attempt >= candidates.length) {
    return (
      <div
        className="flex max-h-[90vh] max-w-[min(96vw,1200px)] flex-col items-center justify-center gap-2 rounded-lg bg-black/40 px-8 py-12 text-sm text-white/80"
        onClick={(event) => event.stopPropagation()}
      >
        <span>图片加载失败</span>
        <a
          href={rawSrc}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-white/60 underline hover:text-white"
        >
          在新标签页打开原图
        </a>
      </div>
    )
  }

  const displaySrc = candidates[attempt]

  return (
    <div
      className="relative flex max-h-[90vh] max-w-[min(96vw,1200px)] items-center justify-center"
      onClick={(event) => event.stopPropagation()}
    >
      {!ready ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          aria-hidden
          referrerPolicy="no-referrer"
          className="max-h-[90vh] max-w-[min(96vw,1200px)] object-contain opacity-80 blur-[1px]"
          draggable={false}
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={displaySrc}
        src={displaySrc}
        alt={alt}
        referrerPolicy="no-referrer"
        decoding="async"
        fetchPriority="high"
        className={`max-h-[90vh] max-w-[min(96vw,1200px)] object-contain shadow-2xl ${ready ? '' : 'absolute inset-0 h-full w-full opacity-0'}`}
        onLoad={() => setReady(true)}
        onError={() => {
          setReady(false)
          setAttempt((prev) => prev + 1)
        }}
        draggable={false}
      />
    </div>
  )
}

type PreviewableThumbProps = {
  src: string
  alt?: string
  className?: string
  title?: string
  overlayClassName?: string
  children: React.ReactNode
  onPreviewOpen?: () => void
}

/** Wrap a thumbnail: click opens ImageLightbox. Overlay is a div so parent `draggable` can reorder. */
export function PreviewableThumb({
  src,
  alt = '',
  className,
  title = '点击查看大图',
  overlayClassName,
  children,
  onPreviewOpen,
}: PreviewableThumbProps) {
  const [open, setOpen] = useState(false)
  const dragMovedRef = React.useRef(false)
  const pointerRef = React.useRef<{ x: number; y: number } | null>(null)
  const safeSrc = String(src || '').trim()

  if (!safeSrc) {
    return <div className={className}>{children}</div>
  }

  return (
    <>
      <div className={`relative ${className || 'block h-full w-full'}`}>
        <div className="pointer-events-none h-full w-full [&>*]:h-full [&>*]:w-full [&>img]:[-webkit-user-drag:none]">
          {children}
        </div>
        <div
          role="button"
          tabIndex={0}
          className={`absolute inset-0 z-[1] bg-transparent ${overlayClassName || 'cursor-zoom-in'}`}
          title={title}
          aria-label={title}
          onPointerDown={(event) => {
            dragMovedRef.current = false
            pointerRef.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerMove={(event) => {
            const start = pointerRef.current
            if (!start) return
            if (Math.abs(event.clientX - start.x) > 6 || Math.abs(event.clientY - start.y) > 6) {
              dragMovedRef.current = true
            }
          }}
          onClick={(event) => {
            event.stopPropagation()
            if (dragMovedRef.current) return
            setOpen(true)
            onPreviewOpen?.()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setOpen(true)
              onPreviewOpen?.()
            }
          }}
        />
      </div>
      <ImageLightbox
        src={safeSrc}
        alt={alt}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
