'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { toProxiedImageUrl } from '@/frontend/utils/toProxiedImageUrl'

type ImageLightboxProps = {
  src: string
  alt?: string
  open: boolean
  onClose: () => void
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

  // 大图优先用原图（去掉 alicdn 裁剪后缀），避免 _1600x1600 这类超大裁剪被 CDN 拒绝
  const proxiedOriginal = toProxiedImageUrl(src, { width: 0 }) || src

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
        proxiedOriginal={proxiedOriginal}
        rawSrc={src}
        alt={alt || '预览大图'}
      />
    </div>,
    document.body,
  )
}

/**
 * 大图加载：代理原图失败 → 回退未代理原始 URL → 最终失败提示。
 * referrerPolicy=no-referrer 规避 1688/alicdn 防盗链。
 */
function LightboxImage({
  proxiedOriginal,
  rawSrc,
  alt,
}: {
  proxiedOriginal: string
  rawSrc: string
  alt: string
}) {
  // 尝试顺序：代理原图 → 未代理原始地址
  const candidates = React.useMemo(() => {
    const list = [proxiedOriginal, rawSrc].filter(Boolean)
    return Array.from(new Set(list))
  }, [proxiedOriginal, rawSrc])

  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setAttempt(0)
  }, [proxiedOriginal, rawSrc])

  if (attempt >= candidates.length) {
    return (
      <div
        className="flex max-h-[90vh] max-w-[min(96vw,1200px)] flex-col items-center justify-center gap-2 rounded-lg bg-black/40 px-8 py-12 text-sm text-white/80"
        onClick={event => event.stopPropagation()}
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={candidates[attempt]}
      src={candidates[attempt]}
      alt={alt}
      referrerPolicy="no-referrer"
      className="max-h-[90vh] max-w-[min(96vw,1200px)] object-contain shadow-2xl"
      onClick={event => event.stopPropagation()}
      onError={() => setAttempt(prev => prev + 1)}
      draggable={false}
    />
  )
}

type PreviewableThumbProps = {
  src: string
  alt?: string
  className?: string
  title?: string
  children: React.ReactNode
  /** Called after opening is prevented (e.g. stop row expand). */
  onPreviewOpen?: () => void
}

/** Wrap a thumbnail: click opens ImageLightbox. */
export function PreviewableThumb({
  src,
  alt = '',
  className,
  title = '点击查看大图',
  children,
  onPreviewOpen,
}: PreviewableThumbProps) {
  const [open, setOpen] = useState(false)
  const safeSrc = String(src || '').trim()

  if (!safeSrc) {
    return <div className={className}>{children}</div>
  }

  return (
    <>
      <div className={`relative ${className || 'block h-full w-full'}`}>
        <div className="pointer-events-none h-full w-full [&>*]:h-full [&>*]:w-full">
          {children}
        </div>
        <button
          type="button"
          className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent"
          title={title}
          aria-label={title}
          onClick={event => {
            event.stopPropagation()
            event.preventDefault()
            setOpen(true)
            onPreviewOpen?.()
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
