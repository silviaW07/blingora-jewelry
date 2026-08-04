'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'

export type TableImportPreviewRow = {
  rowId: string
  productCode: string
  skuCode: string
  productPrice: number | null
  productPriceText?: string
  productName: string
  brand: string
  supplierName: string
  categoryName: string
  color: string
  spec: string
  weight: string
}

interface Props {
  rows: TableImportPreviewRow[]
  onChange: (rowId: string, field: keyof TableImportPreviewRow, value: string | number | null) => void
  onDelete: (rowId: string) => void
}

export function TableImportPreviewTable({ rows, onChange, onDelete }: Props) {
  return (
    <div className="min-w-[1400px]">
      <Table>
        <TableHeader className="bg-secondary/20">
          <TableRow>
            <TableHead className="w-[120px]">产品编号</TableHead>
            <TableHead className="w-[160px]">SKU（自动）</TableHead>
            <TableHead className="w-[110px]">产品价格</TableHead>
            <TableHead className="w-[180px]">名称</TableHead>
            <TableHead className="w-[120px]">品牌</TableHead>
            <TableHead className="w-[120px]">供应商</TableHead>
            <TableHead className="w-[120px]">类目</TableHead>
            <TableHead className="w-[140px]">颜色</TableHead>
            <TableHead className="w-[140px]">规格</TableHead>
            <TableHead className="w-[100px]">重量</TableHead>
            <TableHead className="w-[70px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                暂无待导入商品。请上传含表头的 Excel/CSV，或粘贴 9 列数据后解析（产品编号、产品价格、名称…，无 SKU 列）。
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => (
              <TableRow key={row.rowId}>
                <TableCell>
                  <Input value={row.productCode} onChange={e => onChange(row.rowId, 'productCode', e.target.value)} />
                </TableCell>
                <TableCell>
                  <Input
                    value=""
                    readOnly
                    disabled
                    title="不从表格读取 SKU，确认导入后按产品编号自动生成"
                    placeholder={row.productCode ? `按 ${row.productCode} 自动生成` : '按产品编号自动生成'}
                    className="bg-muted/40 text-muted-foreground"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.productPriceText ?? ''}
                    onChange={e => onChange(row.rowId, 'productPriceText', e.target.value)}
                    placeholder="105 或 105,110,115"
                  />
                </TableCell>
                <TableCell>
                  <Input value={row.productName} onChange={e => onChange(row.rowId, 'productName', e.target.value)} />
                </TableCell>
                <TableCell>
                  <Input value={row.brand} onChange={e => onChange(row.rowId, 'brand', e.target.value)} />
                </TableCell>
                <TableCell>
                  <Input value={row.supplierName} onChange={e => onChange(row.rowId, 'supplierName', e.target.value)} />
                </TableCell>
                <TableCell>
                  <Input value={row.categoryName} onChange={e => onChange(row.rowId, 'categoryName', e.target.value)} placeholder="类目名称" />
                </TableCell>
                <TableCell>
                  <Input value={row.color} onChange={e => onChange(row.rowId, 'color', e.target.value)} placeholder="红,白,黑" />
                </TableCell>
                <TableCell>
                  <Input value={row.spec} onChange={e => onChange(row.rowId, 'spec', e.target.value)} placeholder="S,M,L" />
                </TableCell>
                <TableCell>
                  <Input value={row.weight} onChange={e => onChange(row.rowId, 'weight', e.target.value)} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onDelete(row.rowId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
