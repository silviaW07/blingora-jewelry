'use client'

import React, { useMemo, useState } from 'react'
import { Copy, ImagePlus, Minus, Plus, Trash2 } from 'lucide-react'
import EditableImg from '@/@base/EditableImg'
import { PreviewableThumb } from '@/backend/components/ImageLightbox'
import { Button, Checkbox, TableCell, TableRow } from '@/backend/components/ui'
import { PendingImportSkuEditableCell } from '@/backend/components/PendingImportEditableCells'
import type { ProductManagementState, ProductManagementHandlers } from '@/backend/hooks/useProductManagement'
import { DEFAULT_USD_EXCHANGE_RATE, toUsdFromCny } from '@/shared/exchangeRate'
import type { PendingImportSkuDraftItem } from '@/backend/actions/ProductManagement'
import { isPlaceholderPendingImportImage } from '@/backend/utils/pendingImportReadiness'
import { isColorNameSpecValue, isPlaceholderSpecValue } from '@/shared/skuDisplayGuards'
import { extractProductDimensionSpec } from '@/shared/tableImportSpec'
import { cn } from '@/lib/utils'

interface PendingImportSkuChildRowsProps {
  itemId: string
  skus: PendingImportSkuDraftItem[]
  expanded: boolean
  galleryDragActive?: boolean
  state: ProductManagementState
  handlers: ProductManagementHandlers
  /** 父级起订量（1688 beginAmount）；SKU 行双击编辑会写回父条目 */
  minOrderQty?: number | null
  /** 单色商品：跳过颜色层，直接展开规格行 */
  flatSpecMode?: boolean
  /** 标题/参数里拆出的包袋尺寸，SKU 无尺码维时回填规格 */
  fallbackSpec?: string | null
}

type ColorGroup = {
  color: string
  specs: string[]
  skus: PendingImportSkuDraftItem[]
  prices: number[]
  weights: number[]
  costPrices: number[]
  totalStock: number
  priceMin: number | null
  priceMax: number | null
  pricesUniform: boolean
}

const skuRowKey = (sku?: PendingImportSkuDraftItem | null) =>
  String(sku?.sku_key || (sku as { skuKey?: string } | null | undefined)?.skuKey || '').trim()

const pendingSkuSelectionKey = (itemId: string, skuKey: string) => `${itemId}::${skuKey}`

function PendingImportSkuSelectBox({
  itemId,
  skuKeys,
  state,
  handlers,
}: {
  itemId: string
  skuKeys: string[]
  state: ProductManagementState
  handlers: ProductManagementHandlers
}) {
  const selectedIds = skuKeys
    .map((key) => String(key || '').trim())
    .filter(Boolean)
    .map((key) => pendingSkuSelectionKey(itemId, key))
  const selectedCount = selectedIds.filter((key) => state.pendingImportSelectedSkuKeys.includes(key)).length
  const checked = selectedIds.length > 0 && selectedCount === selectedIds.length
  const indeterminate = selectedCount > 0 && selectedCount < selectedIds.length
  return (
    <Checkbox
      checked={indeterminate ? 'indeterminate' : checked}
      onCheckedChange={(value: boolean | 'indeterminate') => {
        handlers.handleSelectPendingImportSkuKeys(itemId, skuKeys, value === true)
      }}
      aria-label="选择 SKU"
    />
  )
}

const getAttributeValue = (sku: PendingImportSkuDraftItem, name: string) => {
  const attrs = Array.isArray(sku?.attributes) ? sku.attributes : []
  const aliases: Record<string, RegExp> = {
    颜色: /^(颜色|顏色|color|colour)$/i,
    规格: /^(规格|規格|尺码|尺碼|尺寸|size)$/i,
    尺码: /^(尺码|尺碼|尺寸|规格|規格|size)$/i,
    尺寸: /^(尺寸|尺码|尺碼|规格|規格|size)$/i,
  }
  const matcher = aliases[name]
  return attrs.find((attr) => (matcher ? matcher.test(String(attr.name || '').trim()) : attr.name === name))?.value?.trim() || ''
}
const getSpecLabel = (sku: PendingImportSkuDraftItem, fallbackSpec?: string | null) => {
  const spec =
    getAttributeValue(sku, '规格') ||
    getAttributeValue(sku, '尺码') ||
    getAttributeValue(sku, '尺寸')
  if (spec && !isPlaceholderSpecValue(spec)) return spec
  const specText = String(sku.spec_text || '').trim()
  if (specText.includes('/')) {
    const right = specText.split('/').slice(1).join('/').trim()
    if (right && !isPlaceholderSpecValue(right) && !isColorNameSpecValue(right)) return right
  }
  const fromTitle = String(fallbackSpec || '').trim()
  if (fromTitle && !isPlaceholderSpecValue(fromTitle)) return fromTitle
  return isPlaceholderSpecValue(spec) ? '' : spec
}

const getColorLabel = (sku: PendingImportSkuDraftItem) => {
  const color = getAttributeValue(sku, '颜色')
  const spec =
    getAttributeValue(sku, '规格') ||
    getAttributeValue(sku, '尺码') ||
    getAttributeValue(sku, '尺寸')
  if (color && color !== '默认颜色' && color !== '其他') return color
  if (isColorNameSpecValue(spec)) return spec
  const specText = String(sku.spec_text || '').trim()
  if (specText.includes('/')) {
    const left = specText.split('/')[0]?.trim()
    if (left && left !== '默认颜色') return left
  }
  if (specText && !getSpecLabel(sku)) return specText
  return color
}

const formatCnyRange = (min: number | null, max: number | null) => {
  if (min == null && max == null) return '--'
  const lo = min ?? max ?? 0
  const hi = max ?? min ?? 0
  return lo === hi ? `￥${lo.toFixed(2)}` : `￥${lo.toFixed(2)} ~ ￥${hi.toFixed(2)}`
}

const formatUsdRange = (min: number | null, max: number | null, usdRate: number) => {
  if (min == null && max == null) return '--'
  const lo = toUsdFromCny(min ?? max ?? 0, usdRate)
  const hi = toUsdFromCny(max ?? min ?? 0, usdRate)
  return lo === hi ? `US$ ${lo.toFixed(2)}` : `US$ ${lo.toFixed(2)} - US$ ${hi.toFixed(2)}`
}

const resolveUsdRate = (state: ProductManagementState) =>
  Number(state.usdExchangeRate) > 0 ? Number(state.usdExchangeRate) : DEFAULT_USD_EXCHANGE_RATE

const buildColorGroups = (skus: PendingImportSkuDraftItem[], fallbackSpec?: string | null): ColorGroup[] => {
  const map = new Map<string, ColorGroup>()
  for (const sku of skus || []) {
    const color = getColorLabel(sku) || '默认颜色'
    const spec = getSpecLabel(sku, fallbackSpec)
    const current = map.get(color) || {
      color,
      specs: [] as string[],
      skus: [] as PendingImportSkuDraftItem[],
      prices: [] as number[],
      weights: [] as number[],
      costPrices: [] as number[],
      totalStock: 0,
      priceMin: null as number | null,
      priceMax: null as number | null,
      pricesUniform: true,
    }
    current.specs.push(spec)
    current.skus.push(sku)
    if (sku.price != null) current.prices.push(Number(sku.price))
    if (sku.weight_grams != null) current.weights.push(Number(sku.weight_grams))
    if (sku.cost_price != null) current.costPrices.push(Number(sku.cost_price))
    current.totalStock += Number(sku.stock || 0)
    map.set(color, current)
  }

  return Array.from(map.values()).map(group => {
    const priceMin = group.prices.length ? Math.min(...group.prices) : null
    const priceMax = group.prices.length ? Math.max(...group.prices) : null
    const pricesUniform =
      group.prices.length === 0 ||
      group.prices.every(price => Math.abs(price - (group.prices[0] || 0)) < 0.0001)
    return {
      ...group,
      priceMin,
      priceMax,
      pricesUniform,
    }
  })
}

function PendingImportSkuRowActions({
  disabled,
  canDelete,
  onCopy,
  onDelete,
  copyTitle,
  deleteTitle,
  selectCell,
}: {
  disabled?: boolean
  canDelete: boolean
  onCopy: () => void
  onDelete: () => void
  copyTitle: string
  deleteTitle: string
  selectCell?: React.ReactNode
}) {
  return (
    <TableCell className="relative z-20 pr-6 text-right">
      <div className="flex items-center justify-end gap-1">
        {selectCell}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-600 hover:text-primary"
          disabled={disabled}
          title={copyTitle}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onCopy()
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
          disabled={disabled || !canDelete}
          title={canDelete ? deleteTitle : '至少保留一行'}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  )
}

function SpecDetailRows({
  itemId,
  skus,
  colorHint,
  state,
  handlers,
  minOrderQty,
  indentClassName = 'pl-10',
  canDeleteSku = true,
  showSkuImage = false,
  galleryDragActive = false,
  fallbackSpec = null,
}: {
  itemId: string
  skus: PendingImportSkuDraftItem[]
  colorHint?: string
  state: ProductManagementState
  handlers: ProductManagementHandlers
  minOrderQty?: number | null
  indentClassName?: string
  canDeleteSku?: boolean
  showSkuImage?: boolean
  galleryDragActive?: boolean
  fallbackSpec?: string | null
}) {
  const displayMoq = Math.max(1, Number(minOrderQty ?? 1) || 1)
  return (
    <>
      {skus.map(sku => {
        const specLabel = getSpecLabel(sku, fallbackSpec)
        const colorLabel = getColorLabel(sku) || colorHint || ''
        return (
          <TableRow key={`${itemId}-spec-${skuRowKey(sku) || specLabel || colorLabel}`} className="bg-white border-b border-slate-100">
            <TableCell className={showSkuImage ? 'pl-6 align-middle' : 'pl-16'}>
              {showSkuImage ? (
                <ColorImageUploader
                  itemId={itemId}
                  skuKey={skuRowKey(sku)}
                  imageUrl={sku.image_url}
                  colorLabel={colorLabel || specLabel}
                  galleryDragActive={galleryDragActive}
                  state={state}
                  handlers={handlers}
                  compact
                />
              ) : null}
            </TableCell>
            <TableCell className="py-2.5">
              <div className={`${indentClassName} space-y-0.5`}>
                <div className="flex items-baseline gap-1 text-sm font-medium text-slate-800">
                  <span className="shrink-0 text-slate-500">颜色：</span>
                  <PendingImportSkuEditableCell
                    itemId={itemId}
                    skuKey={skuRowKey(sku)}
                    field="color"
                    value={colorLabel}
                    state={state}
                    handlers={handlers}
                    className="text-left font-medium text-slate-800"
                    inputClassName="h-7 w-28 text-sm"
                    placeholder="颜色"
                  />
                </div>
                <div className="flex items-baseline gap-1 text-[11px] text-slate-400">
                  <span className="shrink-0">规格</span>
                  <PendingImportSkuEditableCell
                    itemId={itemId}
                    skuKey={skuRowKey(sku)}
                    field="spec"
                    value={specLabel}
                    state={state}
                    handlers={handlers}
                    className="text-left text-[11px] text-slate-500"
                    inputClassName="h-6 w-24 text-xs"
                    placeholder="无规格"
                  />
                </div>
              </div>
            </TableCell>
            <TableCell />
            <TableCell colSpan={4} className="text-xs text-slate-300">规格明细</TableCell>
            <TableCell className="py-2.5 text-right">
              <PendingImportSkuEditableCell
                itemId={itemId}
                skuKey={skuRowKey(sku)}
                field="weight_grams"
                value={sku.weight_grams}
                state={state}
                handlers={handlers}
                className="ml-auto inline-flex text-right font-medium text-slate-900"
                inputClassName="ml-auto w-24 text-right"
                placeholder="重量"
                renderDisplay={raw =>
                  raw != null && raw !== ''
                    ? <span>{Number(raw).toLocaleString()}</span>
                    : <span>--</span>}
              />
            </TableCell>
            <TableCell className="py-2.5 text-right">
              <PendingImportSkuEditableCell
                itemId={itemId}
                skuKey={skuRowKey(sku)}
                field="cost_price"
                value={sku.cost_price}
                state={state}
                handlers={handlers}
                className="ml-auto inline-flex text-right font-medium text-slate-900"
                inputClassName="ml-auto w-24 text-right"
                placeholder="成本价"
                renderDisplay={raw =>
                  raw != null && raw !== ''
                    ? <span>￥{Number(raw).toFixed(2)}</span>
                    : <span>--</span>}
              />
            </TableCell>
            <TableCell className="py-2.5 text-right text-slate-400">--</TableCell>
            <TableCell className="py-2.5 text-right">
              <PendingImportSkuEditableCell
                itemId={itemId}
                skuKey={skuRowKey(sku)}
                field="price"
                value={sku.price}
                state={state}
                handlers={handlers}
                className="ml-auto inline-flex text-right font-medium text-slate-900"
                inputClassName="ml-auto w-28 text-right"
                placeholder="售价"
                renderDisplay={raw =>
                  raw != null && raw !== ''
                    ? <span>￥{Number(raw).toFixed(2)}</span>
                    : <span>--</span>}
              />
            </TableCell>
            <TableCell className="py-2.5 text-right font-medium text-slate-900">
              {sku.price != null ? `US$ ${toUsdFromCny(Number(sku.price), resolveUsdRate(state)).toFixed(2)}` : '--'}
            </TableCell>
            <TableCell className="py-2.5 text-right">
              <PendingImportSkuEditableCell
                itemId={itemId}
                skuKey={skuRowKey(sku)}
                field="minimum_order_quantity"
                value={displayMoq}
                state={state}
                handlers={handlers}
                className="ml-auto inline-flex text-right font-medium text-slate-900"
                inputClassName="ml-auto w-24 text-right"
                placeholder="起订量"
                renderDisplay={raw =>
                  raw != null && raw !== ''
                    ? <span>{Number(raw).toLocaleString()} 件</span>
                    : <span>--</span>}
              />
            </TableCell>
            <TableCell className="py-2.5 text-right">
              <PendingImportSkuEditableCell
                itemId={itemId}
                skuKey={skuRowKey(sku)}
                field="stock"
                value={sku.stock}
                state={state}
                handlers={handlers}
                className="ml-auto inline-flex text-right font-medium text-slate-900"
                inputClassName="ml-auto w-24 text-right"
                placeholder="库存"
                renderDisplay={raw =>
                  raw != null && raw !== ''
                    ? <span>{Number(raw).toLocaleString()}</span>
                    : <span>--</span>}
              />
            </TableCell>
            <TableCell />
            <TableCell />
            <PendingImportSkuRowActions
              disabled={false}
              canDelete={canDeleteSku}
              copyTitle="复制规格行"
              deleteTitle="删除规格行"
              selectCell={
                <PendingImportSkuSelectBox
                  itemId={itemId}
                  skuKeys={[skuRowKey(sku)]}
                  state={state}
                  handlers={handlers}
                />
              }
              onCopy={() => void handlers.duplicatePendingImportSkuRow(itemId, skuRowKey(sku))}
              onDelete={() => void handlers.deletePendingImportSkuRow(itemId, skuRowKey(sku))}
            />
          </TableRow>
        )
      })}
    </>
  )
}

function ColorImageUploader({
  itemId,
  skuKey,
  imageUrl,
  colorLabel,
  galleryDragActive,
  state,
  handlers,
  compact = false,
}: {
  itemId: string
  skuKey: string
  imageUrl: string | null
  colorLabel: string
  galleryDragActive?: boolean
  state: ProductManagementState
  handlers: ProductManagementHandlers
  compact?: boolean
}) {
  const uploadKey = `${itemId}:${skuKey}`
  const isUploading = state.pendingImportSkuImageUploadingKeys.includes(uploadKey)
  const safeImageUrl = imageUrl && !isPlaceholderPendingImportImage(imageUrl) ? imageUrl : null
  const openPicker = () => {
    const input = document.getElementById(`pending-sku-add-${uploadKey}`) as HTMLInputElement | null
    input?.click()
  }

  return (
    <div className={cn('flex flex-shrink-0 flex-col', compact ? 'gap-0' : 'gap-1.5')}>
      <div
        data-pending-sku-drop={skuKey}
        data-pending-sku-item={itemId}
        className={cn(
          'relative h-16 w-16 rounded border overflow-hidden bg-white',
          galleryDragActive ? 'border-rose-400 ring-2 ring-rose-300' : 'border-slate-200',
        )}
        title="把主图拖到这里，设为前台该 SKU 图"
        onClick={!safeImageUrl ? openPicker : undefined}
      >
        {safeImageUrl ? (
          <>
            <PreviewableThumb
              src={safeImageUrl}
              alt={`${colorLabel} SKU 图`}
              className="h-full w-full"
              title="点击查看大图"
            >
              <EditableImg
                propKey={`pending-sku-${uploadKey}`}
                src={safeImageUrl}
                keywords={safeImageUrl}
                description={`${colorLabel} 代表图`}
                proxyWidth={256}
                disableKeywordSearch
              />
            </PreviewableThumb>
            <button
              type="button"
              className={cn(
                'absolute right-0 top-0 z-[1] flex h-4 w-4 items-center justify-center rounded-bl bg-black/70 text-[10px] text-white',
                galleryDragActive ? 'pointer-events-none opacity-0' : '',
              )}
              title="删除该 SKU 图"
              onClick={() => void handlers.removePendingImportSkuImage(itemId, skuKey)}
            >
              ×
            </button>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] leading-3 text-rose-500">
            {isUploading ? '…' : '拖入'}
          </div>
        )}
      </div>
      {compact ? null : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/5"
          onClick={openPicker}
        >
          <ImagePlus className="mr-1 h-3 w-3" />
          {isUploading ? '后台上传中…' : safeImageUrl ? '替换 SKU 图' : '上传 SKU 图'}
        </Button>
      )}
      <input
        id={`pending-sku-add-${uploadKey}`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handlers.uploadPendingImportSkuImage(itemId, skuKey, e)}
      />
    </div>
  )
}

/** 待上传主行展开后：多色 → 颜色行+规格；单色 → 直接规格行 */
export function PendingImportSkuChildRows({
  itemId,
  skus,
  expanded,
  galleryDragActive = false,
  state,
  handlers,
  minOrderQty,
  flatSpecMode = false,
  fallbackSpec = null,
}: PendingImportSkuChildRowsProps) {
  const [expandedColors, setExpandedColors] = useState<string[]>([])
  const displayMoq = Math.max(1, Number(minOrderQty ?? 1) || 1)

  const colorGroups = useMemo(() => buildColorGroups(skus, fallbackSpec), [skus, fallbackSpec])

  if (!expanded || !skus?.length) return null

  if (flatSpecMode) {
    const onlyColor = colorGroups[0]?.color
    return (
      <SpecDetailRows
        itemId={itemId}
        skus={skus}
        colorHint={onlyColor && onlyColor !== '默认颜色' ? onlyColor : undefined}
        state={state}
        handlers={handlers}
        minOrderQty={displayMoq}
        indentClassName="pl-8"
        canDeleteSku={skus.length > 1}
        showSkuImage
        galleryDragActive={galleryDragActive}
        fallbackSpec={fallbackSpec}
      />
    )
  }

  const toggleColor = (color: string) => {
    setExpandedColors(prev =>
      prev.includes(color) ? prev.filter(item => item !== color) : [...prev, color],
    )
  }

  return (
    <>
      {colorGroups.map(group => {
        const leader = group.skus[0]
        const colorExpanded = expandedColors.includes(group.color)
        const canExpand = !group.pricesUniform && group.skus.length > 1
        const stocks = group.skus.map(sku => Number(sku.stock || 0))
        const stockUniform = stocks.length > 0 && stocks.every(stock => stock === stocks[0])
        const stockDisplay = stockUniform ? stocks[0] : null
        const weightDisplay = group.weights.length
          ? (Math.min(...group.weights) === Math.max(...group.weights)
            ? Math.min(...group.weights)
            : null)
          : null
        const costDisplay = group.costPrices.length
          ? (Math.min(...group.costPrices) === Math.max(...group.costPrices)
            ? Math.min(...group.costPrices)
            : null)
          : null

        return (
          <React.Fragment key={`${itemId}-color-${group.color}`}>
            <TableRow className="bg-slate-50/90 border-b border-slate-100">
              <TableCell className="pl-10">
                {canExpand ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-600"
                    onClick={() => toggleColor(group.color)}
                    title={colorExpanded ? '折叠规格' : '展开规格'}
                  >
                    {colorExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                ) : (
                  <span className="inline-block w-7" />
                )}
              </TableCell>

              <TableCell className="whitespace-normal py-3">
                <div className="flex items-start gap-3 pl-4 border-l-2 border-primary/30">
                  <ColorImageUploader
                    itemId={itemId}
                    skuKey={leader.sku_key}
                    imageUrl={leader.image_url}
                    colorLabel={group.color}
                    galleryDragActive={galleryDragActive}
                    state={state}
                    handlers={handlers}
                  />

                  <div className="min-w-0 max-w-[420px] space-y-1">
                    <div className="flex items-baseline gap-1 text-sm font-semibold text-slate-800">
                      <span className="shrink-0 text-slate-500 font-medium">颜色：</span>
                      <PendingImportSkuEditableCell
                        itemId={itemId}
                        skuKey={leader.sku_key}
                        field="color"
                        value={group.color}
                        state={state}
                        handlers={handlers}
                        syncColorGroup
                        colorValue={group.color}
                        className="text-left font-semibold text-slate-800"
                        inputClassName="h-7 w-28 text-sm"
                        placeholder="颜色"
                      />
                    </div>
                    {(() => {
                      const uniqueSpecs = Array.from(new Set(group.specs.filter((spec) => spec && !isPlaceholderSpecValue(spec))))
                      if (uniqueSpecs.length === 0) {
                        return (
                          <div className="flex items-baseline gap-1 text-xs leading-4 text-slate-400">
                            <span className="shrink-0">规格：</span>
                            <PendingImportSkuEditableCell
                              itemId={itemId}
                              skuKey={leader.sku_key}
                              field="spec"
                              value=""
                              state={state}
                              handlers={handlers}
                              syncColorGroup
                              colorValue={group.color}
                              className="text-left text-xs text-slate-500"
                              inputClassName="h-6 w-28 text-xs"
                              placeholder="无规格"
                            />
                          </div>
                        )
                      }
                      if (group.pricesUniform && uniqueSpecs.length === 1) {
                        return (
                          <div className="flex items-baseline gap-1 text-xs leading-4 text-slate-500">
                            <span className="shrink-0">规格：</span>
                            <PendingImportSkuEditableCell
                              itemId={itemId}
                              skuKey={leader.sku_key}
                              field="spec"
                              value={uniqueSpecs[0]}
                              state={state}
                              handlers={handlers}
                              syncColorGroup
                              colorValue={group.color}
                              className="text-left text-xs text-slate-500"
                              inputClassName="h-6 w-28 text-xs"
                              placeholder="无规格"
                            />
                          </div>
                        )
                      }
                      return (
                        <div className="whitespace-normal break-words text-xs leading-4 text-slate-500">
                          {group.pricesUniform
                            ? `包含规格：${uniqueSpecs.join(', ')}`
                            : `${group.skus.length} 个规格，价格有差异`}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </TableCell>

              <TableCell />

              <TableCell colSpan={4} className="text-xs text-slate-400 py-3">
                {group.pricesUniform
                  ? '同色同价，已折叠规格明细'
                  : '点击左侧 + 展开查看各规格价格'}
              </TableCell>

              <TableCell className="py-3 text-right">
                {group.pricesUniform ? (
                  <PendingImportSkuEditableCell
                    itemId={itemId}
                    skuKey={leader.sku_key}
                    field="weight_grams"
                    value={weightDisplay}
                    state={state}
                    handlers={handlers}
                    syncColorGroup
                    colorValue={group.color}
                    className="ml-auto inline-flex text-right font-medium text-slate-900"
                    inputClassName="ml-auto w-24 text-right"
                    placeholder="重量"
                    renderDisplay={raw => (raw != null && raw !== '' ? <span>{Number(raw).toLocaleString()}</span> : <span>--</span>)}
                  />
                ) : (
                  <span className="text-slate-400">
                    {group.weights.length
                      ? `${Math.min(...group.weights)} ~ ${Math.max(...group.weights)}`
                      : '--'}
                  </span>
                )}
              </TableCell>

              <TableCell className="py-3 text-right">
                {group.pricesUniform ? (
                  <PendingImportSkuEditableCell
                    itemId={itemId}
                    skuKey={leader.sku_key}
                    field="cost_price"
                    value={costDisplay}
                    state={state}
                    handlers={handlers}
                    syncColorGroup
                    colorValue={group.color}
                    className="ml-auto inline-flex text-right font-medium text-slate-900"
                    inputClassName="ml-auto w-24 text-right"
                    placeholder="成本价"
                    renderDisplay={raw =>
                      raw != null && raw !== ''
                        ? <span>￥{Number(raw).toFixed(2)}</span>
                        : <span>--</span>}
                  />
                ) : (
                  <span className="text-slate-400">--</span>
                )}
              </TableCell>

              <TableCell className="py-3 text-right text-slate-400">--</TableCell>

              <TableCell className="py-3 text-right">
                {group.pricesUniform ? (
                  <PendingImportSkuEditableCell
                    itemId={itemId}
                    skuKey={leader.sku_key}
                    field="price"
                    value={group.priceMin}
                    state={state}
                    handlers={handlers}
                    syncColorGroup
                    colorValue={group.color}
                    className="ml-auto inline-flex text-right font-medium text-slate-900"
                    inputClassName="ml-auto w-28 text-right"
                    placeholder="售价"
                    renderDisplay={() => <span>{formatCnyRange(group.priceMin, group.priceMax)}</span>}
                  />
                ) : (
                  <span className="font-medium text-slate-900">{formatCnyRange(group.priceMin, group.priceMax)}</span>
                )}
              </TableCell>

              <TableCell className="py-3 text-right font-medium text-slate-900">
                {formatUsdRange(group.priceMin, group.priceMax, resolveUsdRate(state))}
              </TableCell>

              <TableCell className="py-3 text-right">
                <PendingImportSkuEditableCell
                  itemId={itemId}
                  skuKey={leader.sku_key}
                  field="minimum_order_quantity"
                  value={displayMoq}
                  state={state}
                  handlers={handlers}
                  className="ml-auto inline-flex text-right font-medium text-slate-900"
                  inputClassName="ml-auto w-24 text-right"
                  placeholder="起订量"
                  renderDisplay={raw =>
                    raw != null && raw !== ''
                      ? <span>{Number(raw).toLocaleString()} 件</span>
                      : <span>--</span>}
                />
              </TableCell>

              <TableCell className="py-3 text-right">
                {group.pricesUniform && stockUniform ? (
                  <PendingImportSkuEditableCell
                    itemId={itemId}
                    skuKey={leader.sku_key}
                    field="stock"
                    value={stockDisplay}
                    state={state}
                    handlers={handlers}
                    syncColorGroup
                    colorValue={group.color}
                    className="ml-auto inline-flex text-right font-medium text-slate-900"
                    inputClassName="ml-auto w-24 text-right"
                    placeholder="库存"
                    renderDisplay={raw =>
                      raw != null && raw !== ''
                        ? <span>{Number(raw).toLocaleString()}</span>
                        : <span>--</span>}
                  />
                ) : (
                  <span className="font-medium text-slate-900">{group.totalStock.toLocaleString()}</span>
                )}
              </TableCell>

              <TableCell />
              <TableCell />
              <PendingImportSkuRowActions
                disabled={false}
                canDelete={colorGroups.length > 1}
                copyTitle="复制颜色行"
                deleteTitle="删除颜色行"
                selectCell={
                  <PendingImportSkuSelectBox
                    itemId={itemId}
                    skuKeys={group.skus.map((sku) => skuRowKey(sku)).filter(Boolean)}
                    state={state}
                    handlers={handlers}
                  />
                }
                onCopy={() => void handlers.duplicatePendingImportSkuColorRow(itemId, group.color)}
                onDelete={() => void handlers.deletePendingImportSkuColorRow(itemId, group.color)}
              />
            </TableRow>

            {canExpand && colorExpanded ? (
              <SpecDetailRows
                itemId={itemId}
                skus={group.skus}
                colorHint={group.color}
                state={state}
                handlers={handlers}
                minOrderQty={displayMoq}
                canDeleteSku={skus.length > 1}
              />
            ) : null}
          </React.Fragment>
        )
      })}
    </>
  )
}

interface PendingImportExpandToggleProps {
  itemId: string
  expanded: boolean
  skuCount: number
  onToggle: (itemId: string) => void
}

export function PendingImportExpandToggle({
  itemId,
  expanded,
  skuCount,
  onToggle,
}: PendingImportExpandToggleProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-slate-600"
        onClick={() => onToggle(itemId)}
        title={expanded ? '折叠 SKU' : '展开 SKU'}
      >
        {expanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </Button>
      <span className="text-[10px] text-slate-400">{skuCount || 1}</span>
    </div>
  )
}
