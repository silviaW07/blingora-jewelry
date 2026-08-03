'use client'

import React, { useEffect, useState } from 'react'
import { ArrowUpCircle, ImagePlus, Minus, Plus } from 'lucide-react'
import EditableImg from '@/@base/EditableImg'
import { Badge, Button, Checkbox, TableCell, TableRow } from '@/backend/components/ui'
import { PendingImportSkuChildRows } from '@/backend/components/PendingImportSkuChildRows'
import {
  PendingImportEditableCell,
  PENDING_GOODS_STATUS_CONFIG,
  PENDING_GOODS_STATUS_OPTIONS,
} from '@/backend/components/PendingImportEditableCells'
import type { ProductManagementHandlers, ProductManagementState } from '@/backend/hooks/useProductManagement'
import type { PendingImportQueueItem } from '@/backend/actions/ProductManagement'
import type { ProductSource } from '@/backend/types/ProductManagement'
import {
  canPublishPendingImportItem,
  getEffectivePendingImportFetchStatus,
  isPendingImportEffectivelyReady,
  snapshotFromPendingImportQueueItem,
} from '@/backend/utils/pendingImportReadiness'

type SourceConfig = Record<ProductSource, {
  label: string
  icon: React.ReactNode
}>

interface PendingImportTableRowsProps {
  item: PendingImportQueueItem
  state: ProductManagementState
  handlers: ProductManagementHandlers
  fetchStatusConfig: { label: string; className: string }
  publishStatusConfig: { label: string; className: string }
  sourceConfig: SourceConfig
}

function formatCnyRange(min: number | null | undefined, max: number | null | undefined) {
  if (min == null && max == null) return '--'
  const lo = min ?? max ?? 0
  const hi = max ?? min ?? 0
  return `￥${Number(lo).toLocaleString()} ~ ${Number(hi).toLocaleString()}`
}

function formatUsdRange(min: number | null | undefined, max: number | null | undefined) {
  if (min == null && max == null) return '--'
  const lo = min ?? max ?? 0
  const hi = max ?? min ?? 0
  return lo === hi ? `US$ ${Number(lo).toFixed(2)}` : `US$ ${Number(lo).toFixed(2)} - US$ ${Number(hi).toFixed(2)}`
}

function extractExternalProductCode(item: PendingImportQueueItem) {
  if (item.item_sourceUrl?.startsWith('table-import://')) {
    return item.item_sourceUrl.replace('table-import://', '').trim() || '--'
  }
  // 1688：展示 offerId，保证相似标题在待上传区仍可区分多行独立父商品
  const offerFromUrl = String(item.item_sourceUrl || '').match(/offer\/(\d+)/i)?.[1]
  if (offerFromUrl) return offerFromUrl
  const detail = item.item_productDetail || ''
  const matched = detail.match(/产品编号[：:]\s*([^\n]+)/)
  if (matched?.[1]) return matched[1].trim()
  return '--'
}

function extractBrand(item: PendingImportQueueItem) {
  const detail = item.item_productDetail || ''
  const matched = detail.match(/品牌[：:]\s*([^\n]+)/)
  return matched?.[1]?.trim() || ''
}

export function PendingImportTableRows({
  item,
  state,
  handlers,
  fetchStatusConfig,
  publishStatusConfig,
  sourceConfig,
}: PendingImportTableRowsProps) {
  const expanded = state.expandedPendingImportIds.includes(item.item_id)
  const pendingSkus = item.item_skus || []
  const targetCategoryOption = state.categoryOptions.find(option => option.category_id === item.item_targetCategoryId)
  const targetCategoryName = targetCategoryOption?.category_name
  const isReparsing = !!state.reparsingItemIds[item.item_id]
  // Re-evaluate stuck→ready heuristic while the page stays open.
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    if (item.item_fetchStatus === 'COMPLETED' || item.item_isPublished) return
    setNowMs(Date.now())
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [item.item_fetchStatus, item.item_isPublished, item.item_updatedAt, item.item_createdAt])
  const readinessSnapshot = snapshotFromPendingImportQueueItem(item)
  const effectivelyReady = isPendingImportEffectivelyReady(readinessSnapshot, nowMs)
  const effectiveFetchStatus = getEffectivePendingImportFetchStatus(readinessSnapshot, nowMs)
  const canPublish = canPublishPendingImportItem(readinessSnapshot, nowMs) && !isReparsing
  const isTableImport = item.item_sourceUrl?.startsWith('table-import://')
  const isPinduoduoImport = /(?:yangkeduo|pinduoduo)\.com/i.test(String(item.item_sourceUrl || ''))
  const source = isTableImport
    ? sourceConfig.TABLE_IMPORT
    : sourceConfig.IMPORT_1688
  const sourceBadgeLabel = isTableImport ? source.label : isPinduoduoImport ? '拼多多导入' : source.label
  const sourceLabel = isTableImport ? '表格导入' : isPinduoduoImport ? '拼多多' : '1688'
  const skuCount = pendingSkus.length || 1
  const colorValues = Array.from(new Set(
    pendingSkus.map(sku => sku.attributes?.find(attr => attr.name === '颜色')?.value?.trim() || '默认颜色'),
  ))
  const colorCount = colorValues.length
  const isSingleColor = colorCount <= 1
  const specLabels = pendingSkus.map(sku =>
    sku.attributes?.find(attr => attr.name === '规格' || attr.name === '尺码' || attr.name === '尺寸')?.value?.trim()
    || sku.spec_text
    || '默认规格',
  )
  const skuPricesList = pendingSkus
    .map(sku => sku.price)
    .filter((value): value is number => value !== null && value !== undefined)
  const pricesUniform =
    skuPricesList.length === 0 ||
    skuPricesList.every(price => Math.abs(price - (skuPricesList[0] || 0)) < 0.0001)
  /** 单色同价：不展开；单色异价 / 多色：可展开 */
  const canExpandChildren = isSingleColor ? !pricesUniform && pendingSkus.length > 1 : pendingSkus.length > 0
  const externalCode = extractExternalProductCode(item)
  const brand = extractBrand(item)

  const skuPrices = skuPricesList
  const cnyMin = skuPrices.length ? Math.min(...skuPrices) : item.item_cnyPriceMin
  const cnyMax = skuPrices.length ? Math.max(...skuPrices) : item.item_cnyPriceMax
  const usdMin = skuPrices.length
    ? Number((Math.min(...skuPrices) / 6.5).toFixed(2))
    : item.item_usdPriceMin
  const usdMax = skuPrices.length
    ? Number((Math.max(...skuPrices) / 6.5).toFixed(2))
    : item.item_usdPriceMax
  const totalStock = pendingSkus.length
    ? pendingSkus.reduce((sum, sku) => sum + Number(sku.stock || 0), 0)
    : item.item_availableStock

  return (
    <>
      <TableRow className="group border-b border-slate-100 last:border-0">
        <TableCell className="pl-4">
          <div className="flex items-center gap-1">
            {canExpandChildren ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600"
                onClick={() => handlers.togglePendingImportExpand(item.item_id)}
                title={expanded ? '折叠 SKU' : '展开 SKU'}
              >
                {expanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
            ) : (
              <span className="inline-block w-7" />
            )}
            <Checkbox
              checked={state.pendingImportSelectedIds.includes(item.item_id)}
              onCheckedChange={checked => handlers.handleSelectPendingImportRow(item.item_id, !!checked)}
            />
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 max-w-[260px]">
                {(item.item_galleryUrls?.length
                  ? item.item_galleryUrls
                  : (item.item_mainImageUrl || item.item_parsedMainImageUrl
                    ? [item.item_mainImageUrl || item.item_parsedMainImageUrl!]
                    : [])).map((url, imageIndex) => (
                  <div key={`${item.item_id}-${imageIndex}-${url}`} className="relative w-12 h-12 rounded border border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50">
                    <button
                      type="button"
                      className="w-full h-full"
                      title="点击替换图片"
                      onClick={() => {
                        const input = document.getElementById(`pending-replace-${item.item_id}-${imageIndex}`) as HTMLInputElement | null
                        input?.click()
                      }}
                    >
                      <EditableImg
                        propKey={`pending-${item.item_id}-${imageIndex}`}
                        src={url}
                        keywords={url || item.item_productName || 'product'}
                        description={item.item_productName || item.item_parsedName || '待上传商品'}
                      />
                    </button>
                    <button
                      type="button"
                      className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl bg-black/70 text-[10px] text-white"
                      title="删除图片"
                      onClick={() => handlers.removePendingImportImage(item.item_id, imageIndex)}
                    >
                      ×
                    </button>
                    <input
                      id={`pending-replace-${item.item_id}-${imageIndex}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handlers.replacePendingImportImage(item.item_id, imageIndex, e)}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-dashed"
                  disabled={state.pendingImportImageUploadingId === item.item_id}
                  onClick={() => {
                    const input = document.getElementById(`pending-add-${item.item_id}`) as HTMLInputElement | null
                    input?.click()
                  }}
                >
                  <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                  {state.pendingImportImageUploadingId === item.item_id ? '上传中...' : '上传/编辑图片'}
                </Button>
                <input
                  id={`pending-add-${item.item_id}`}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handlers.uploadPendingImportImages(item.item_id, e)}
                />
                <div className="mt-1 text-[11px] text-slate-400">
                  主图轮播 · {(item.item_galleryUrls?.length || (item.item_mainImageUrl ? 1 : 0))} 张 · 可多选
                </div>
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <PendingImportEditableCell
                itemId={item.item_id}
                field="product_name"
                value={item.item_productName || item.item_parsedName || ''}
                state={state}
                handlers={handlers}
                className="font-semibold text-slate-900 truncate max-w-[220px] text-left"
                inputClassName="max-w-[220px]"
                placeholder="请输入商品名称"
              />
              <PendingImportEditableCell
                itemId={item.item_id}
                field="sku_summary_text"
                value={item.item_skuSummaryText || ''}
                state={state}
                handlers={handlers}
                multiline
                className="text-xs text-slate-500 line-clamp-2 text-left mt-0.5 max-w-[220px]"
                inputClassName="max-w-[220px] text-xs"
                placeholder="SKU摘要，例如：红色/M | 蓝色/L"
                renderDisplay={rawValue =>
                  rawValue
                    ? <span className="text-xs text-slate-500 line-clamp-2">{String(rawValue)}</span>
                    : <span className="text-xs text-slate-400">双击编辑 SKU摘要</span>}
              />
              <span className="text-xs text-muted-foreground font-mono">
                {brand ? `${brand} · ` : ''}
                {sourceLabel}
                {isSingleColor
                  ? ` · ${skuCount} 规格`
                  : ` · ${colorCount} 色 · ${skuCount} SKU`}
              </span>
              {isSingleColor ? (
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {pricesUniform
                    ? `包含规格：${Array.from(new Set(specLabels)).join(', ')}`
                    : `单色商品 · 价格有差异，点击左侧展开查看规格`}
                </span>
              ) : null}
            </div>
          </div>
        </TableCell>

        <TableCell>
          <span className="font-mono text-sm text-slate-800" title="外部货号 / 用户原编号">
            {externalCode}
          </span>
        </TableCell>

        <TableCell>
          <div className={`flex items-center text-xs px-2 py-1 rounded-sm w-fit ${isPinduoduoImport ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-50'}`}>
            {source.icon}
            {sourceBadgeLabel}
          </div>
        </TableCell>

        <TableCell>
          <PendingImportEditableCell
            itemId={item.item_id}
            field="supplier_name"
            value={item.item_supplierName || ''}
            state={state}
            handlers={handlers}
            className="text-left text-sm font-medium text-slate-800 max-w-[140px] truncate"
            placeholder="供应商名称"
            renderDisplay={rawValue => rawValue
              ? <span className="text-sm font-medium text-slate-800 truncate max-w-[140px]">{String(rawValue)}</span>
              : <span className="text-xs text-slate-400">未录入</span>}
          />
        </TableCell>

        <TableCell>
          <div className="flex flex-col gap-1">
            <PendingImportEditableCell
              itemId={item.item_id}
              field="target_category_id"
              value={item.item_targetCategoryId || ''}
              state={state}
              handlers={handlers}
              useCategoryTree
              className="flex items-center gap-1 text-sm font-medium text-slate-800 text-left"
              renderDisplay={() => <span>{targetCategoryName || '--'}</span>}
            />
            <div className="text-[11px] text-slate-500">
              <PendingImportEditableCell
                itemId={item.item_id}
                field="coefficient"
                value={item.item_coefficient}
                state={state}
                handlers={handlers}
                className="text-[11px] text-slate-500"
                inputClassName="w-24"
                placeholder="系数"
                renderDisplay={rawValue => <>类目系数 {rawValue !== null && rawValue !== undefined ? Number(rawValue).toFixed(2) : '--'}</>}
              />
            </div>
          </div>
        </TableCell>

        <TableCell>
          <PendingImportEditableCell
            itemId={item.item_id}
            field="goods_status"
            value={item.item_goodsStatus || 'DRAFT'}
            state={state}
            handlers={handlers}
            selectOptions={PENDING_GOODS_STATUS_OPTIONS}
            renderDisplay={rawValue => {
              const cfg = PENDING_GOODS_STATUS_CONFIG[String(rawValue || 'DRAFT')] || PENDING_GOODS_STATUS_CONFIG.DRAFT
              return <Badge variant="outline" className={`${cfg.className} border-0`}>{cfg.label}</Badge>
            }}
          />
        </TableCell>

        <TableCell className="text-right font-header font-medium text-slate-900">
          <PendingImportEditableCell
            itemId={item.item_id}
            field="weight_grams"
            value={item.item_weightGrams}
            state={state}
            handlers={handlers}
            className="ml-auto inline-flex text-right"
            inputClassName="ml-auto w-28 text-right"
            placeholder="重量(g)"
            renderDisplay={rawValue => rawValue ? <span>{Number(rawValue).toLocaleString()}</span> : <span>--</span>}
          />
        </TableCell>

        <TableCell className="text-right font-header font-medium text-slate-900">
          <PendingImportEditableCell
            itemId={item.item_id}
            field="cost_price"
            value={item.item_costPrice}
            state={state}
            handlers={handlers}
            className="ml-auto inline-flex text-right"
            inputClassName="ml-auto w-28 text-right"
            placeholder="成本价"
            renderDisplay={rawValue => rawValue !== null && rawValue !== undefined ? <span>￥{Number(rawValue).toFixed(2)}</span> : <span>--</span>}
          />
        </TableCell>

        <TableCell className="text-right font-header font-medium text-slate-900">
          {item.item_coefficient ? item.item_coefficient.toFixed(2) : '--'}
        </TableCell>

        <TableCell className="text-right font-header font-medium text-slate-900">
          <PendingImportEditableCell
            itemId={item.item_id}
            field="cny_price_min"
            value={item.item_cnyPriceMin}
            state={state}
            handlers={handlers}
            className="ml-auto inline-flex text-right"
            inputClassName="ml-auto w-32 text-right"
            placeholder="人民币最低价"
            renderDisplay={() => formatCnyRange(cnyMin, cnyMax)}
          />
        </TableCell>

        <TableCell className="text-right font-header font-medium text-slate-900">
          <PendingImportEditableCell
            itemId={item.item_id}
            field="usd_price_min"
            value={item.item_usdPriceMin}
            state={state}
            handlers={handlers}
            className="ml-auto inline-flex text-right"
            inputClassName="ml-auto w-32 text-right"
            placeholder="美元最低价"
            renderDisplay={() => formatUsdRange(usdMin, usdMax)}
          />
        </TableCell>

        <TableCell className="text-right font-header font-medium text-slate-900">
          <PendingImportEditableCell
            itemId={item.item_id}
            field="minimum_order_quantity"
            value={item.item_minimumOrderQuantity}
            state={state}
            handlers={handlers}
            className="ml-auto inline-flex text-right"
            inputClassName="ml-auto w-24 text-right"
            placeholder="起订量"
            renderDisplay={rawValue => rawValue ? <span>{Number(rawValue).toLocaleString()} 件</span> : <span>--</span>}
          />
        </TableCell>

        <TableCell className="text-right font-header font-medium text-slate-900">
          <PendingImportEditableCell
            itemId={item.item_id}
            field="available_stock"
            value={item.item_availableStock}
            state={state}
            handlers={handlers}
            className="ml-auto inline-flex text-right"
            inputClassName="ml-auto w-24 text-right"
            placeholder="库存"
            renderDisplay={() =>
              totalStock !== null && totalStock !== undefined
                ? <span>{Number(totalStock).toLocaleString()}</span>
                : <span>--</span>}
          />
        </TableCell>

        <TableCell className="text-center">
          {isReparsing ? (
            <div className="flex flex-col items-center gap-1">
              <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wider border-0 bg-sky-50 text-sky-700 animate-pulse">
                解析中...
              </Badge>
            </div>
          ) : (
            <>
              <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider border-0 ${publishStatusConfig.className}`}>
                {publishStatusConfig.label}
              </Badge>
              {effectivelyReady ? (
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-0 bg-emerald-50 text-emerald-700"
                    title="标题/主图/价格已齐且采集进度超时未更新，前端判定为采集完成"
                  >
                    采集完成
                  </Badge>
                </div>
              ) : effectiveFetchStatus !== 'COMPLETED' ? (
                <div className="mt-1">
                  <Badge variant="outline" className={`text-[10px] border-0 ${fetchStatusConfig.className}`}>{fetchStatusConfig.label}</Badge>
                </div>
              ) : null}
              {item.item_failureReason && !effectivelyReady ? (
                <p className="text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={item.item_failureReason}>
                  解析失败：{item.item_failureReason}
                </p>
              ) : null}
            </>
          )}
        </TableCell>

        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(item.item_createdAt).toLocaleDateString()}
          <br />
          {new Date(item.item_createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </TableCell>

        <TableCell className="text-right pr-6">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600"
              disabled={!canPublish || state.pendingImportPublishing || isReparsing}
              title={
                isReparsing
                  ? '正在重新解析，请稍候'
                  : canPublish
                    ? (effectivelyReady
                      ? '采集进度已超时但核心字段齐全，可发布并上架到商品管理'
                      : '发布并上架到商品管理')
                    : '当前条目暂不可发布'
              }
              onClick={() => void handlers.publishPendingImportItem(item.item_id)}
            >
              <ArrowUpCircle className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <PendingImportSkuChildRows
        itemId={item.item_id}
        skus={pendingSkus}
        expanded={expanded && canExpandChildren}
        state={state}
        handlers={handlers}
        flatSpecMode={isSingleColor}
      />
    </>
  )
}
