'use client'

import React, { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import EditableImg from '@/@base/EditableImg'
import { Badge, Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/backend/components/ui'
import type { ProductManagementHandlers, ProductManagementState } from '@/backend/hooks/useProductManagement'

interface Props {
  state: ProductManagementState
  handlers: ProductManagementHandlers
}

export function BatchImportPreviewTable({ state, handlers }: Props) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  return (
    <CardLike>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-slate-700">导入结果预览</div>
        <Badge variant="outline">{state.batchImportRows.length} 行</Badge>
      </div>
      <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>产品编号</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>重量</TableHead>
              <TableHead>产品价格</TableHead>
              <TableHead>颜色</TableHead>
              <TableHead>规格</TableHead>
              <TableHead className="min-w-[220px]">图片</TableHead>
              <TableHead>品牌</TableHead>
              <TableHead>供应商</TableHead>
              <TableHead>类目</TableHead>
              <TableHead className="w-[50px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.batchImportRows.map((row, index) => {
              const images = row.gallery_urls?.length
                ? row.gallery_urls
                : (row.main_image_url ? [row.main_image_url] : [])
              const uploading = (state.batchImportImageUploadingKeys || []).some(k =>
                k === `row-${index}` || k.startsWith(`row-${index}-`),
              )
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Input className="h-8" value={row.product_code} onChange={e => handlers.updateBatchImportRow(index, 'product_code', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.sku_code} onChange={e => handlers.updateBatchImportRow(index, 'sku_code', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.name} onChange={e => handlers.updateBatchImportRow(index, 'name', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.weight_gram} onChange={e => handlers.updateBatchImportRow(index, 'weight_gram', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      value={row.product_price || row.cost_price}
                      onChange={e => {
                        handlers.updateBatchImportRow(index, 'product_price', e.target.value)
                        handlers.updateBatchImportRow(index, 'cost_price', e.target.value)
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.color} onChange={e => handlers.updateBatchImportRow(index, 'color', e.target.value)} placeholder="红,白,黑" />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.spec} onChange={e => handlers.updateBatchImportRow(index, 'spec', e.target.value)} placeholder="S,M,L" />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {images.map((url, imageIndex) => (
                        <div key={`${url}-${imageIndex}`} className="relative h-14 w-14 overflow-hidden rounded border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            className="h-full w-full"
                            title="点击替换图片"
                            onClick={() => fileInputRefs.current[`replace-${index}-${imageIndex}`]?.click()}
                          >
                            <EditableImg propKey={`batch-import-${index}-${imageIndex}`} src={url} keywords={url} description={row.name || '导入图'} />
                          </button>
                          <button
                            type="button"
                            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white"
                            title="删除图片"
                            onClick={() => handlers.removeBatchImportImage(index, imageIndex)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <input
                            ref={el => { fileInputRefs.current[`replace-${index}-${imageIndex}`] = el }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handlers.replaceBatchImportImage(index, imageIndex, e)}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        className="flex h-14 w-14 flex-col items-center justify-center rounded border border-dashed border-slate-300 text-[10px] text-slate-500 hover:border-primary hover:text-primary"
                        title="上传多张图片"
                        disabled={false}
                        onClick={() => fileInputRefs.current[`add-${index}`]?.click()}
                      >
                        <ImagePlus className="mb-0.5 h-4 w-4" />
                        {uploading ? '继续传' : '上传'}
                      </button>
                      <input
                        ref={el => { fileInputRefs.current[`add-${index}`] = el }}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => handlers.uploadBatchImportImages(index, e)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.brand_keyword} onChange={e => handlers.updateBatchImportRow(index, 'brand_keyword', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.supplier_name} onChange={e => handlers.updateBatchImportRow(index, 'supplier_name', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" value={row.category_name} onChange={e => handlers.updateBatchImportRow(index, 'category_name', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handlers.removeBatchImportRow(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3">
        <Button variant="outline" size="sm" onClick={handlers.addBatchImportRow}>新增一行</Button>
      </div>
    </CardLike>
  )
}

function CardLike({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5">{children}</div>
}
