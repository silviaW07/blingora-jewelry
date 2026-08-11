'use client'

import React from 'react'
import { ArrowDownCircle, ArrowUpCircle, Minus, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react'
import { Badge, Button, Checkbox, Input, TableCell, TableRow } from '@/backend/components/ui'
import EditableImg from '@/@base/EditableImg'
import { PreviewableThumb } from '@/backend/components/ImageLightbox'
import { SkuTreeEditableCell } from '@/backend/components/ProductSkuTreeCells'
import {
  ProductGoodsStatusBadge,
  ProductInlineEditableCell,
  PRODUCT_GOODS_STATUS_OPTIONS,
} from '@/backend/components/ProductInlineEditableCell'
import type { ProductManagementState, ProductManagementHandlers } from '@/backend/hooks/useProductManagement'
import type { ProductListItem, ProductBoundCategoryTag } from '@/backend/actions/ProductManagement'
import type { ProductStatus, ProductSource, GoodsStatus as ManagementGoodsStatus } from '@/backend/types/ProductManagement'

type StatusConfig = Record<ProductStatus, {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  color: string
}>

type GoodsStatusConfig = Record<ManagementGoodsStatus, {
  label: string
  className: string
}>

type SourceConfig = Record<ProductSource, {
  label: string
  icon: React.ReactNode
}>

interface ProductTreeRowsProps {
  item: ProductListItem
  state: ProductManagementState
  handlers: ProductManagementHandlers
  statusConfig: StatusConfig
  goodsStatusConfigMap: GoodsStatusConfig
  sourceConfig: SourceConfig
}

function ProductTreeRowsInner({
  item,
  state,
  handlers,
  statusConfig,
  goodsStatusConfigMap,
  sourceConfig,
}: ProductTreeRowsProps) {
  const expanded = state.expandedProductIds.includes(item.product_id)
  const skus = item.skus || []
  const minOrderQty = Math.max(1, Number((item as any).trade_info_json?.minOrderQty ?? item.min_order_qty ?? 1) || 1)
  const supplierName = item.supplier_name
  const goodsStatusConfig = item.goods_status
    ? goodsStatusConfigMap[item.goods_status as keyof typeof goodsStatusConfigMap]
    : undefined

  return (
    <>
      <TableRow className="group border-b border-slate-100 last:border-0">
        <TableCell className="pl-4">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-600"
              onClick={() => handlers.toggleProductExpand(item.product_id)}
              title={expanded ? '折叠 SKU' : '展开 SKU'}
            >
              {expanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
            <Checkbox
              checked={state.selectedIds.includes(item.product_id)}
              onCheckedChange={(checked: boolean) => handlers.handleSelectRow(item.product_id, checked)}
            />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded border border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50 cursor-zoom-in">
              {item.main_image_url ? (
                <PreviewableThumb
                  src={item.main_image_url}
                  alt={item.product_name}
                  className="h-full w-full"
                  title="点击查看大图"
                >
                  <EditableImg
                    propKey={`prod-${item.product_id}`}
                    src={item.main_image_url}
                    keywords={item.main_image_url}
                    description={item.product_name}
                    disableKeywordSearch
                  />
                </PreviewableThumb>
              ) : (
                <EditableImg
                  propKey={`prod-${item.product_id}`}
                  keywords={item.sku_code_base || 'industrial product'}
                  description={item.product_name}
                />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <ProductInlineEditableCell
                productId={item.product_id}
                field="product_name"
                value={item.product_name}
                state={state}
                handlers={handlers}
                className="font-semibold text-slate-900 truncate max-w-[220px] text-left"
                inputClassName="max-w-[220px]"
                placeholder="请输入商品名称"
              />
              <span className="text-xs text-muted-foreground font-mono">
                主编码: {item.sku_code_base || '--'} · {skus.length} 个 SKU
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-sm w-fit">
            {(sourceConfig[item.source] || sourceConfig.MANUAL).icon}
            {(sourceConfig[item.source] || sourceConfig.MANUAL).label}
          </div>
        </TableCell>
        <TableCell>
          <ProductInlineEditableCell
            productId={item.product_id}
            field="supplier_name"
            value={supplierName || ''}
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
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <div className="flex flex-wrap gap-1.5">
              {(
                item.bound_categories?.length
                  ? item.bound_categories
                  : ([
                      {
                        category_id: item.category_id,
                        category_name: item.category_name || '--',
                        is_primary: true,
                        is_brand: false,
                        is_pricing: true,
                      },
                    ] as ProductBoundCategoryTag[])
              ).map(cat => (
                <span
                  key={cat.category_id}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                >
                  <button
                    type="button"
                    className={`truncate font-medium ${cat.is_primary ? 'hover:text-primary' : 'cursor-default'}`}
                    title={cat.is_primary ? '点击更换主类目' : cat.category_name}
                    onClick={() => {
                      if (cat.is_primary) {
                        handlers.openProductCategoryPicker(item.product_id, item.category_id)
                      }
                    }}
                  >
                    {cat.category_name || '--'}
                  </button>
                  {(cat.is_pricing || (cat.is_pricing == null && cat.is_primary && !cat.is_brand)) &&
                    !cat.is_brand &&
                    (() => {
                      const badgeCoeff =
                        item.price_coefficient != null && Number(item.price_coefficient) > 0
                          ? Number(item.price_coefficient)
                          : item.effective_price_coefficient != null && Number(item.effective_price_coefficient) > 0
                            ? Number(item.effective_price_coefficient)
                            : null
                      return badgeCoeff != null ? (
                        <span className="shrink-0 rounded bg-slate-200/80 px-1 text-[10px] font-medium text-slate-600">
                          ×{badgeCoeff.toFixed(2)}
                        </span>
                      ) : null
                    })()}
                  <button
                    type="button"
                    className="ml-0.5 shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
                    title="解除该类目绑定"
                    disabled={state.inlineSaving}
                    onClick={e => {
                      e.stopPropagation()
                      void handlers.unbindProductCategory(item.product_id, cat.category_id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <ProductInlineEditableCell
            productId={item.product_id}
            field="goods_status"
            value={item.goods_status || 'ACTIVE'}
            state={state}
            handlers={handlers}
            selectOptions={PRODUCT_GOODS_STATUS_OPTIONS}
            renderDisplay={rawValue => <ProductGoodsStatusBadge value={String(rawValue || 'ACTIVE')} />}
          />
        </TableCell>
        <TableCell className="text-right font-header font-medium text-slate-900">
          <ProductInlineEditableCell
            productId={item.product_id}
            field="weight_gram"
            value={item.weight_gram}
            state={state}
            handlers={handlers}
            className="ml-auto inline-flex text-right"
            inputClassName="ml-auto w-28 text-right"
            placeholder="重量(g)"
            renderDisplay={rawValue => rawValue ? <span>{Number(rawValue).toLocaleString()}</span> : <span>--</span>}
          />
        </TableCell>
        <TableCell className="text-right font-header font-medium text-slate-900">
          <ProductInlineEditableCell
            productId={item.product_id}
            field="cost_price"
            value={item.cost_price}
            state={state}
            handlers={handlers}
            className="ml-auto inline-flex text-right"
            inputClassName="ml-auto w-28 text-right"
            placeholder="成本价"
            renderDisplay={rawValue => rawValue !== null && rawValue !== undefined ? <span>￥{Number(rawValue).toFixed(2)}</span> : <span>--</span>}
          />
        </TableCell>
        <TableCell className="text-right font-header font-medium text-slate-900">
          {(() => {
            const display =
              item.price_coefficient != null && Number(item.price_coefficient) > 0
                ? Number(item.price_coefficient)
                : item.effective_price_coefficient != null && Number(item.effective_price_coefficient) > 0
                  ? Number(item.effective_price_coefficient)
                  : null
            return display != null ? display.toFixed(2) : '--'
          })()}
        </TableCell>
        <TableCell className="text-right font-header font-medium text-slate-900">
          ￥{Number(item.price_min ?? 0).toLocaleString()} ~ {Number(item.price_max ?? 0).toLocaleString()}
        </TableCell>
        <TableCell className="text-right font-header font-medium text-slate-900">
          ${(item.usd_display_price_min?.toFixed(2) || '0.00')} ~ ${(item.usd_display_price_max?.toFixed(2) || '0.00')}
        </TableCell>
        <TableCell className="text-right font-header font-medium text-slate-900">
          <ProductInlineEditableCell
            productId={item.product_id}
            field="min_order_qty"
            value={minOrderQty}
            state={state}
            handlers={handlers}
            className="ml-auto block w-full text-right font-header font-medium text-slate-900"
            inputClassName="ml-auto w-24 text-right"
            placeholder="1"
            renderDisplay={rawValue => {
              const n = Math.max(1, Number(rawValue ?? 1) || 1)
              return <span>{n.toLocaleString()} 件</span>
            }}
          />
        </TableCell>
        <TableCell className="text-right font-header font-medium text-slate-900">
          {state.productStockEditingId === item.product_id ? (
            <Input
              type="number"
              min={0}
              className="ml-auto h-8 w-24 text-right"
              value={state.productStockEditingValue}
              autoFocus
              onChange={(e) => handlers.setProductStockEditingValue(e.target.value)}
              onBlur={() => void handlers.submitProductStockEdit()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handlers.submitProductStockEdit()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handlers.cancelProductStockEdit()
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="ml-auto block w-full text-right hover:text-primary hover:underline"
              title="点击编辑可用库存"
              onClick={() => handlers.startProductStockEdit(item.product_id, item.total_stock)}
            >
              {Number(item.total_stock ?? 0).toLocaleString()}
            </button>
          )}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={(statusConfig[item.status] || statusConfig.DRAFT).variant} className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {(statusConfig[item.status] || statusConfig.DRAFT).label}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(item.created_at).toLocaleDateString()}
          <br />
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </TableCell>
        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(item.created_at).toLocaleDateString()}
          <br />
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </TableCell>
        <TableCell className="text-right pr-6">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handlers.handleOpenEdit(item.product_id)}>
              <Settings2 className="w-4 h-4" />
            </Button>
            {item.status === 'ACTIVE' ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => handlers.openConfirmDialog('INACTIVE', [item.product_id])}>
                <ArrowDownCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handlers.openConfirmDialog('ACTIVE', [item.product_id])}>
                <ArrowUpCircle className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-800"
              title="退回待上传"
              onClick={() => handlers.openConfirmDialog('RETURN_TO_PENDING', [item.product_id])}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handlers.openConfirmDialog('DELETE', [item.product_id])}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {expanded && skus.map(sku => {
        const editing = state.productSkuEditingCell
        const isEditing = (field: string) =>
          editing?.productId === item.product_id && editing?.skuId === sku.sku_id && editing?.field === field

        const effectiveSkuMinOrderQty = sku.min_order_qty ?? minOrderQty ?? 1
        return (
          <TableRow key={sku.sku_id} className="bg-slate-50/90 border-b border-slate-100">
            <TableCell className="pl-10">
              <Checkbox
                checked={state.selectedIds.includes(`sku:${sku.sku_id}`)}
                onCheckedChange={(checked: boolean) => handlers.handleSelectRow(`sku:${sku.sku_id}`, checked)}
              />
            </TableCell>
            <TableCell>
              <div className="pl-6 space-y-1 border-l-2 border-primary/30">
                <div className="text-xs font-mono text-slate-500">SKU: {sku.sku_code}</div>
                <SkuTreeEditableCell
                  editing={isEditing('spec_text')}
                  value={state.productSkuEditingValue}
                  display={<span className="text-sm text-slate-800">{sku.spec_text || '默认规格'}</span>}
                  saving={state.productSkuSaving}
                  onStartEdit={() => handlers.startProductSkuInlineEdit(item.product_id, sku.sku_id, 'spec_text', sku.spec_text)}
                  onChange={handlers.changeProductSkuEditingValue}
                  onSubmit={handlers.submitProductSkuInlineEdit}
                  onCancel={handlers.cancelProductSkuInlineEdit}
                />
              </div>
            </TableCell>
            <TableCell colSpan={4} className="text-xs text-slate-400">子级 SKU（双击可编辑成本/售价/重量/起订量/库存/规格）</TableCell>
            <TableCell className="text-right">
              <SkuTreeEditableCell
                editing={isEditing('weight_gram')}
                value={state.productSkuEditingValue}
                display={<span className="font-medium text-slate-900">{sku.weight_gram != null ? sku.weight_gram.toLocaleString() : '--'}</span>}
                saving={state.productSkuSaving}
                inputType="number"
                className="h-8 w-24 ml-auto text-right"
                onStartEdit={() => handlers.startProductSkuInlineEdit(item.product_id, sku.sku_id, 'weight_gram', sku.weight_gram)}
                onChange={handlers.changeProductSkuEditingValue}
                onSubmit={handlers.submitProductSkuInlineEdit}
                onCancel={handlers.cancelProductSkuInlineEdit}
              />
            </TableCell>
            <TableCell className="text-right">
              <SkuTreeEditableCell
                editing={isEditing('cost_price')}
                value={state.productSkuEditingValue}
                display={<span className="font-medium text-slate-900">{sku.cost_price != null ? `￥${sku.cost_price.toFixed(2)}` : '--'}</span>}
                saving={state.productSkuSaving}
                inputType="number"
                className="h-8 w-24 ml-auto text-right"
                onStartEdit={() => handlers.startProductSkuInlineEdit(item.product_id, sku.sku_id, 'cost_price', sku.cost_price)}
                onChange={handlers.changeProductSkuEditingValue}
                onSubmit={handlers.submitProductSkuInlineEdit}
                onCancel={handlers.cancelProductSkuInlineEdit}
              />
            </TableCell>
            <TableCell className="text-right text-slate-500">--</TableCell>
            <TableCell className="text-right">
              <SkuTreeEditableCell
                editing={isEditing('price')}
                value={state.productSkuEditingValue}
                display={<span className="font-medium text-slate-900">￥{Number(sku.price || 0).toLocaleString()}</span>}
                saving={state.productSkuSaving}
                inputType="number"
                className="h-8 w-24 ml-auto text-right"
                onStartEdit={() => handlers.startProductSkuInlineEdit(item.product_id, sku.sku_id, 'price', sku.price)}
                onChange={handlers.changeProductSkuEditingValue}
                onSubmit={handlers.submitProductSkuInlineEdit}
                onCancel={handlers.cancelProductSkuInlineEdit}
              />
            </TableCell>
            <TableCell className="text-right text-slate-500">
              ${sku.usd_display_price != null ? sku.usd_display_price.toFixed(2) : '--'}
            </TableCell>
            <TableCell className="text-right">
              <SkuTreeEditableCell
                editing={isEditing('min_order_qty')}
                value={state.productSkuEditingValue}
                display={
                  <span className="font-medium text-slate-900">
                    {Number(effectiveSkuMinOrderQty).toLocaleString()} 件
                  </span>
                }
                saving={state.productSkuSaving}
                inputType="number"
                className="h-8 w-24 ml-auto text-right"
                onStartEdit={() =>
                  handlers.startProductSkuInlineEdit(
                    item.product_id,
                    sku.sku_id,
                    'min_order_qty',
                    effectiveSkuMinOrderQty,
                  )
                }
                onChange={handlers.changeProductSkuEditingValue}
                onSubmit={handlers.submitProductSkuInlineEdit}
                onCancel={handlers.cancelProductSkuInlineEdit}
              />
            </TableCell>
            <TableCell className="text-right">
              <SkuTreeEditableCell
                editing={isEditing('stock')}
                value={state.productSkuEditingValue}
                display={<span className="font-medium text-slate-900">{Number(sku.stock || 0).toLocaleString()}</span>}
                saving={state.productSkuSaving}
                inputType="number"
                className="h-8 w-24 ml-auto text-right"
                onStartEdit={() => handlers.startProductSkuInlineEdit(item.product_id, sku.sku_id, 'stock', sku.stock)}
                onChange={handlers.changeProductSkuEditingValue}
                onSubmit={handlers.submitProductSkuInlineEdit}
                onCancel={handlers.cancelProductSkuInlineEdit}
              />
            </TableCell>
            <TableCell colSpan={4} />
          </TableRow>
        )
      })}
    </>
  )
}

function productTreeRowPropsEqual(prev: ProductTreeRowsProps, next: ProductTreeRowsProps) {
  if (prev.item !== next.item) return false
  if (prev.statusConfig !== next.statusConfig) return false
  if (prev.goodsStatusConfigMap !== next.goodsStatusConfigMap) return false
  if (prev.sourceConfig !== next.sourceConfig) return false
  // handlers is a fresh object each render; identity must not force re-render.

  const id = next.item.product_id
  const ps = prev.state
  const ns = next.state
  if (ps.expandedProductIds.includes(id) !== ns.expandedProductIds.includes(id)) return false
  if (ps.selectedIds.includes(id) !== ns.selectedIds.includes(id)) return false
  if (ps.inlineSaving !== ns.inlineSaving) return false
  if (ps.productSkuSaving !== ns.productSkuSaving) return false

  const prevEdit = ps.inlineEditingCell
  const nextEdit = ns.inlineEditingCell
  const prevEditingThis = prevEdit?.productId === id
  const nextEditingThis = nextEdit?.productId === id
  if (prevEditingThis !== nextEditingThis) return false
  if (nextEditingThis && (prevEdit?.field !== nextEdit?.field || ps.inlineEditingValue !== ns.inlineEditingValue)) {
    return false
  }

  const prevSkuEdit = ps.productSkuEditingCell
  const nextSkuEdit = ns.productSkuEditingCell
  const prevSkuEditingThis = prevSkuEdit?.productId === id
  const nextSkuEditingThis = nextSkuEdit?.productId === id
  if (prevSkuEditingThis !== nextSkuEditingThis) return false
  if (
    nextSkuEditingThis &&
    (prevSkuEdit?.skuId !== nextSkuEdit?.skuId ||
      prevSkuEdit?.field !== nextSkuEdit?.field ||
      ps.productSkuEditingValue !== ns.productSkuEditingValue)
  ) {
    return false
  }

  if ((ps.productStockEditingId === id) !== (ns.productStockEditingId === id)) return false
  if (ns.productStockEditingId === id && ps.productStockEditingValue !== ns.productStockEditingValue) return false

  const prevCat = ps.productCategoryPicker
  const nextCat = ns.productCategoryPicker
  if ((prevCat?.productId === id) !== (nextCat?.productId === id)) return false
  if (nextCat?.productId === id && prevCat?.selectedId !== nextCat?.selectedId) return false

  return true
}

export const ProductTreeRows = React.memo(ProductTreeRowsInner, productTreeRowPropsEqual)
