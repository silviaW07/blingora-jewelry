'use client'

import React, { useMemo } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/backend/components/ui'
import { filterDescriptionParamsByWhitelist } from '@/shared/productSpecWhitelist'

export type FeatureAttribute = { key: string; value: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName?: string | null
  sourceUrl?: string | null
  productDetail?: string | null
  featureAttributes?: FeatureAttribute[] | null
}

const MATERIAL_KEY_RE = /材质|材料|面料|成分|material|fabric|alloy|金属|电镀/i

function stripHtml(raw?: string | null) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function extractDetailPairs(detailText: string): FeatureAttribute[] {
  const rows: FeatureAttribute[] = []
  const seen = new Set<string>()
  const push = (key: string, value: string) => {
    const k = key.trim()
    const v = value.trim()
    if (!k || !v || k.length > 40 || v.length > 200) return
    const id = `${k.toLowerCase()}::${v.toLowerCase()}`
    if (seen.has(id)) return
    seen.add(id)
    rows.push({ key: k, value: v })
  }

  for (const line of detailText.split(/\n+/)) {
    const matched = line.match(/^(.{1,40}?)[：:]\s*(.+)$/)
    if (matched) push(matched[1], matched[2])
  }
  return rows.slice(0, 40)
}

export function resolveMaterialLabel(
  featureAttributes?: FeatureAttribute[] | null,
  productDetail?: string | null,
): string | null {
  const attrs = featureAttributes || []
  const fromAttr = attrs.find(attr => MATERIAL_KEY_RE.test(attr.key))
  if (fromAttr?.value) return fromAttr.value

  const plain = stripHtml(productDetail)
  const matched =
    plain.match(/(?:材质|材料|面料|成分|Material)\s*[：:]\s*([^\n，,;；|/]+)/i) ||
    plain.match(/(钛钢|不锈钢|铜|合金|银|黄金|K金|925|316L|锌合金)/i)
  return matched?.[1]?.trim() || null
}

export function PendingImport1688DetailDialog({
  open,
  onOpenChange,
  productName,
  sourceUrl,
  productDetail,
  featureAttributes,
}: Props) {
  const plainDetail = useMemo(() => stripHtml(productDetail), [productDetail])
  const attrs = useMemo(() => {
    const fromPreview = (featureAttributes || []).filter(attr => attr.key && attr.value)
    const source = fromPreview.length > 0 ? fromPreview : extractDetailPairs(plainDetail)
    // 与前台规格参数同一套白/黑名单：材质保留，颜色/上市年份等去掉
    return filterDescriptionParamsByWhitelist(source)
  }, [featureAttributes, plainDetail])

  const material = resolveMaterialLabel(attrs, plainDetail)
  const is1688 = /1688\.com/i.test(String(sourceUrl || ''))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-6 text-base leading-snug">
            {productName || '1688 商品详情'}
          </DialogTitle>
          <DialogDescription>
            查看采集到的属性与详情片段（含材质），便于校对后发布。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {material ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span className="font-medium">材质：</span>
              {material}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              未识别到明确材质字段，可在下方属性/详情中人工确认。
            </div>
          )}

          {attrs.length > 0 ? (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                商品属性
              </div>
              <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-2 text-sm">
                {attrs.map(attr => (
                  <React.Fragment key={`${attr.key}-${attr.value}`}>
                    <dt className="truncate text-slate-500" title={attr.key}>
                      {attr.key}
                    </dt>
                    <dd
                      className={`min-w-0 break-words text-slate-800 ${MATERIAL_KEY_RE.test(attr.key) ? 'font-medium text-amber-900' : ''}`}
                      title={attr.value}
                    >
                      {attr.value}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          ) : null}

          {plainDetail ? (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                详情文本
              </div>
              <pre className="whitespace-pre-wrap break-words rounded-md border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 max-h-56 overflow-y-auto">
                {plainDetail.slice(0, 4000)}
                {plainDetail.length > 4000 ? '\n…' : ''}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-slate-500">暂无详情文本（可能尚未完成采集）。</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          {is1688 && sourceUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                打开 1688 原页
              </a>
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PendingImport1688DetailTrigger({
  onClick,
  material,
  disabled,
}: {
  onClick: () => void
  material?: string | null
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={event => {
        event.stopPropagation()
        onClick()
      }}
      className="mt-1 inline-flex max-w-full items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-left text-[11px] text-slate-600 hover:border-primary/40 hover:text-primary disabled:opacity-50"
      title={material ? `材质：${material}（点击查看 1688 详情）` : '点击查看 1688 详情 / 材质'}
    >
      <FileText className="h-3 w-3 shrink-0" />
      <span className="truncate">
        {material ? `材质：${material}` : '1688 详情 / 材质'}
      </span>
    </button>
  )
}
