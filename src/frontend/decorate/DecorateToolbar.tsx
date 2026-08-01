'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, Minus, Plus, Trash2, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { upload_image_file } from '@/tools/tools'
import { useDecorateMode } from './DecorateContext'
import {
  getServiceBenefitDecorateKeys,
  parseServiceBenefitCardIndex,
} from './serviceBenefitKeys'
import type { DecorateKind } from './types'

export function DecorateToolbar() {
  const { selectedKey, draft, updatePatch, deletePatch, select } = useDecorateMode()
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const [uploading, setUploading] = useState(false)

  const patch = selectedKey ? draft[selectedKey] : undefined
  const serviceCardIndex = parseServiceBenefitCardIndex(selectedKey)
  const serviceKeys =
    serviceCardIndex == null ? null : getServiceBenefitDecorateKeys(serviceCardIndex)

  useEffect(() => {
    if (!selectedKey) {
      setAnchor(null)
      return
    }
    const el = document.querySelector(
      `[data-decorate-key="${CSS.escape(selectedKey)}"]`,
    ) as HTMLElement | null
    if (!el) {
      setAnchor({ top: 96, left: 24 })
      return
    }
    const rect = el.getBoundingClientRect()
    const top = Math.min(window.innerHeight - 280, rect.bottom + 10)
    const left = Math.min(window.innerWidth - 320, Math.max(12, rect.left))
    setAnchor({ top, left })

    if (draft[selectedKey]?.text === undefined) {
      const kindAttr = el.getAttribute('data-decorate-kind')
      if (kindAttr !== 'image' && kindAttr !== 'block') {
        const raw = (el.textContent || '').replace(/\s+/g, ' ').trim()
        if (raw) updatePatch(selectedKey, { text: raw })
      }
    }

    const cardIndex = parseServiceBenefitCardIndex(selectedKey)
    if (cardIndex != null) {
      const keys = getServiceBenefitDecorateKeys(cardIndex)
      ;([keys.title, keys.desc] as const).forEach((fieldKey) => {
        if (draft[fieldKey]?.text !== undefined) return
        const fieldEl = document.querySelector(
          `[data-decorate-key="${CSS.escape(fieldKey)}"]`,
        ) as HTMLElement | null
        const raw = (fieldEl?.textContent || '').replace(/\s+/g, ' ').trim()
        if (raw) updatePatch(fieldKey, { text: raw })
      })
    }
  }, [selectedKey])

  const kind = useMemo((): DecorateKind => {
    if (!selectedKey) return 'text'
    const el = document.querySelector(`[data-decorate-key="${CSS.escape(selectedKey)}"]`)
    return (el?.getAttribute('data-decorate-kind') as DecorateKind) || 'text'
  }, [selectedKey])

  const handleUploadImage = async (file: File | null | undefined, targetKey: string) => {
    if (!file || !targetKey) return
    setUploading(true)
    try {
      const url = await upload_image_file(file)
      if (!url) throw new Error('上传失败，未返回图片地址')
      updatePatch(targetKey, { imageUrl: url })
      toast.success('图标已上传')
    } catch (err: any) {
      toast.error(err?.message || '图标上传失败')
    } finally {
      setUploading(false)
    }
  }

  if (!selectedKey || !anchor) return null

  const fontSize = patch?.fontSize ?? 16
  const padding = patch?.padding ?? 0
  const marginTop = patch?.marginTop ?? 0
  const marginBottom = patch?.marginBottom ?? 0
  const marginLeft = patch?.marginLeft ?? 0
  const marginRight = patch?.marginRight ?? 0
  const isBlock = kind === 'block'
  const showTextFields = kind === 'text' || kind === 'button'
  const showLinkField = kind === 'text' || kind === 'button' || isBlock
  const bgLabel = isBlock ? '区块背景颜色' : '背景颜色'
  const titlePatch = serviceKeys ? draft[serviceKeys.title] : undefined
  const descPatch = serviceKeys ? draft[serviceKeys.desc] : undefined
  const iconPatch = serviceKeys ? draft[serviceKeys.icon] : undefined

  const updateSpacing = (
    field: 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight',
    value: string,
  ) => {
    const trimmed = value.trim()
    updatePatch(selectedKey, {
      [field]: trimmed === '' ? 0 : Number(trimmed),
    })
  }

  return (
    <div
      className="fixed z-[110] w-[300px] rounded-2xl border border-[#93C5FD] bg-white p-3 shadow-[0_20px_50px_-24px_rgba(37,99,235,0.55)]"
      style={{ top: anchor.top, left: anchor.left }}
      data-controller-name="可视化装修迷你配置条"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
          {serviceKeys ? '服务权益卡片' : isBlock ? '区块配置' : '迷你配置'}
        </p>
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-slate-800"
          onClick={() => select(null)}
        >
          关闭
        </button>
      </div>

      {serviceKeys ? (
        <div className="mb-3 space-y-3 border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">标题</label>
            <Input
              value={titlePatch?.text ?? ''}
              placeholder="Shipping / Payment / 买家秀 ..."
              className="h-9"
              onChange={(e) => updatePatch(serviceKeys.title, { text: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">描述</label>
            <textarea
              value={descPatch?.text ?? ''}
              placeholder="卡片说明文案"
              className="min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring"
              onChange={(e) => updatePatch(serviceKeys.desc, { text: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">图标</label>
            <Input
              value={iconPatch?.imageUrl ?? ''}
              placeholder="图标 URL 或上传替换"
              className="h-9"
              onChange={(e) => updatePatch(serviceKeys.icon, { imageUrl: e.target.value })}
            />
            <label className="mt-1 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#93C5FD] bg-[#EFF6FF] px-3 text-xs font-medium text-[#1D4ED8] hover:bg-[#DBEAFE]">
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {uploading ? '上传中...' : '上传/替换图标'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  void handleUploadImage(file, serviceKeys.icon)
                }}
              />
            </label>
          </div>
        </div>
      ) : null}

      {showTextFields && !serviceKeys ? (
        <div className="mb-3 space-y-1">
          <label className="text-[11px] font-medium text-slate-500">文本修改</label>
          <Input
            value={patch?.text ?? ''}
            placeholder="输入展示文案"
            className="h-9"
            onChange={(e) => updatePatch(selectedKey, { text: e.target.value })}
          />
        </div>
      ) : null}

      {kind === 'image' && !serviceKeys ? (
        <div className="mb-3 space-y-1">
          <label className="text-[11px] font-medium text-slate-500">图片地址</label>
          <Input
            value={patch?.imageUrl ?? ''}
            placeholder="https://..."
            className="h-9"
            onChange={(e) => updatePatch(selectedKey, { imageUrl: e.target.value })}
          />
          <label className="mt-1 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#93C5FD] bg-[#EFF6FF] px-3 text-xs font-medium text-[#1D4ED8] hover:bg-[#DBEAFE]">
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {uploading ? '上传中...' : '本地上传替换'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                void handleUploadImage(file, selectedKey)
              }}
            />
          </label>
        </div>
      ) : null}

      {showLinkField ? (
        <div className="mb-3 space-y-1">
          <label className="text-[11px] font-medium text-slate-500">
            {serviceKeys ? '跳转链接' : '超链接'}
          </label>
          <Input
            value={patch?.href ?? ''}
            placeholder="https://... 或 /shipping"
            className="h-9"
            onChange={(e) => updatePatch(selectedKey, { href: e.target.value })}
          />
          <p className="text-[10px] leading-4 text-slate-400">
            {serviceKeys
              ? '点击整张服务卡片后跳转到此链接；留空则使用默认服务页'
              : '文字、按钮、邮箱、服务卡片均可配置跳转链接'}
          </p>
        </div>
      ) : null}

      <div className="mb-3 space-y-2">
        <label className="text-[11px] font-medium text-slate-500">区块间距</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Margin Top</label>
            <Input
              type="number"
              value={marginTop}
              className="h-9"
              onChange={(e) => updateSpacing('marginTop', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Margin Bottom</label>
            <Input
              type="number"
              value={marginBottom}
              className="h-9"
              onChange={(e) => updateSpacing('marginBottom', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Margin Left</label>
            <Input
              type="number"
              value={marginLeft}
              className="h-9"
              onChange={(e) => updateSpacing('marginLeft', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Margin Right</label>
            <Input
              type="number"
              value={marginRight}
              className="h-9"
              onChange={(e) => updateSpacing('marginRight', e.target.value)}
            />
          </div>
        </div>
        <p className="text-[10px] leading-4 text-slate-400">
          修改后会实时预览；点击顶部“发布并退出装修”后持久保存。
        </p>
      </div>

      {showTextFields && !serviceKeys ? (
        <div className="mb-3 space-y-1">
          <label className="text-[11px] font-medium text-slate-500">字体大小</label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updatePatch(selectedKey, { fontSize: Math.max(10, fontSize - 1) })}
            >
              <Minus className="size-3.5" />
            </Button>
            <input
              type="range"
              min={10}
              max={64}
              value={fontSize}
              className="flex-1"
              onChange={(e) => updatePatch(selectedKey, { fontSize: Number(e.target.value) })}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updatePatch(selectedKey, { fontSize: Math.min(64, fontSize + 1) })}
            >
              <Plus className="size-3.5" />
            </Button>
            <span className="w-10 text-right text-xs text-slate-600">{fontSize}px</span>
          </div>
        </div>
      ) : null}

      <div className={isBlock ? 'mb-3 space-y-1' : 'mb-3 grid grid-cols-2 gap-2'}>
        {!isBlock ? (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-500">字体颜色</label>
            <Input
              type="color"
              value={patch?.color || '#111111'}
              className="h-9 cursor-pointer p-1"
              onChange={(e) => updatePatch(selectedKey, { color: e.target.value })}
            />
          </div>
        ) : null}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500">{bgLabel}</label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={patch?.backgroundColor || (isBlock ? '#f5f5f5' : '#ffffff')}
              className="h-9 flex-1 cursor-pointer p-1"
              onChange={(e) => updatePatch(selectedKey, { backgroundColor: e.target.value })}
            />
            <Input
              value={patch?.backgroundColor || ''}
              placeholder="#FFFFFF"
              className="h-9 w-[96px] font-mono text-xs"
              onChange={(e) => updatePatch(selectedKey, { backgroundColor: e.target.value })}
            />
          </div>
          {isBlock ? (
            <p className="text-[10px] leading-4 text-slate-400">颜色作用于整块区域外层容器</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-500">内外边距</label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updatePatch(selectedKey, { padding: Math.max(0, padding - 2) })}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="flex-1 text-center text-sm text-slate-700">{padding}px</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updatePatch(selectedKey, { padding: Math.min(48, padding + 2) })}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2]"
          onClick={() => deletePatch(selectedKey)}
        >
          <Trash2 className="mr-2 size-3.5" />
          删除区块
        </Button>
        <p className="mt-2 text-[10px] leading-4 text-slate-400">
          删除后区块会立即从预览中消失；点击顶部「发布并退出装修」后永久生效。
        </p>
      </div>
    </div>
  )
}
