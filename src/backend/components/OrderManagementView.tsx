'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { OrderManagement } from '@/backend/route-params';
import type { OrderStatus, OrderShipMethod, PaymentMethodType } from '@/backend/actions/OrderManagement';
import type { OrderManagementState, OrderManagementHandlers } from '@/backend/hooks/useOrderManagement';
import { readInboundSelection, writeInboundSelection } from '@/backend/hooks/useOrderManagement';
import EditableImg from '@/@base/EditableImg';

// Lucide Icons
import { Package, Truck, CreditCard, Calendar, Search, Filter, RefreshCcw, ChevronRight, ChevronUp, ChevronDown, User, Globe, Plus, History, Info, ExternalLink, ChevronLeft, ShoppingBag, Download, FileSpreadsheet, X } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ===== 枚举映射与样式助手 =====
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '已支付',
  PROCESSING: '处理中',
  SHIPPED: '已发货',
  DELIVERED: '已完成',
  CANCELLED: '已取消',
  REFUNDED: '已退款'
};
/** 列表行内快捷状态（业务三态） */
const LIST_STATUS_OPTIONS: { value: OrderStatus; label: string; className: string }[] = [
  { value: 'PENDING_PAYMENT', label: '待付款', className: 'bg-amber-100 text-amber-900 border-amber-200' },
  { value: 'PROCESSING', label: '处理中', className: 'bg-sky-100 text-sky-800 border-sky-200' },
  { value: 'SHIPPED', label: '已发货', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'DELIVERED', label: '已完成', className: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'CANCELLED', label: '已取消', className: 'bg-slate-200 text-slate-700 border-slate-300' },
  { value: 'REFUNDED', label: '已退款', className: 'bg-orange-100 text-orange-800 border-orange-200' },
];
const LIST_STATUS_VALUES = new Set(LIST_STATUS_OPTIONS.map((o) => o.value));
const ORDER_STATUS_VARIANTS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-900 hover:bg-amber-100',
  PAID: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  PROCESSING: 'bg-sky-100 text-sky-800 hover:bg-sky-100',
  SHIPPED: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  DELIVERED: 'bg-green-600 text-white hover:bg-green-600',
  CANCELLED: 'bg-slate-200 text-slate-700 hover:bg-slate-200',
  REFUNDED: 'bg-orange-100 text-orange-800 hover:bg-orange-100'
};
const INBOUND_BADGE: Record<'NONE' | 'PARTIAL' | 'DONE', string> = {
  NONE: 'bg-slate-100 text-slate-700 border-slate-200',
  PARTIAL: 'bg-amber-100 text-amber-900 border-amber-200',
  DONE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};
const inboundBadgeLabel = (
  state: 'NONE' | 'PARTIAL' | 'DONE',
  received: number,
  ordered: number,
  lines?: { outOfStock?: boolean }[],
) => {
  if (ordered <= 0) return '无商品';
  if (lines && lines.length > 0 && lines.every((line) => line.outOfStock)) return '缺货';
  if (state === 'DONE') return '已入库';
  if (state === 'PARTIAL') return `部分 ${received}/${ordered}`;
  return '未入库';
};
const GOODS_STATUS_LABEL: Record<string, string> = {
  ACTIVE: '已上架',
  INACTIVE: '已下架',
  DRAFT: '待上传',
  DELETED: '已删除',
  OUT_OF_STOCK: '缺货',
  PREORDER: '预售',
};

const INBOUND_EXPORT_COLUMNS: Array<[string, string, string]> = [
  ['product', '商品', 'w-[20%]'],
  ['unitPrice', '售价', 'w-[7%]'],
  ['priceCoefficient', '系数', 'w-[5%]'],
  ['discountPrice', '折扣价', 'w-[7%]'],
  ['quantity', '数量', 'w-[5%]'],
  ['lineAmount', '总价', 'w-[7%]'],
  ['costPrice', '成本价', 'w-[7%]'],
  ['supplier', '供应商', 'w-[12%]'],
  ['note', '备注', 'w-[14%]'],
  ['stage', '商品状态', 'w-[9%]'],
  ['inboundQty', '到货数量', 'w-[7%]'],
];
const INBOUND_COLUMN_PERCENT: Record<string, number> = {
  product: 20,
  unitPrice: 7,
  priceCoefficient: 5,
  discountPrice: 7,
  quantity: 5,
  lineAmount: 7,
  costPrice: 7,
  supplier: 12,
  note: 14,
  stage: 9,
  inboundQty: 7,
};
const inboundSpuKey = (skuCode?: string | null) => {
  const sku = String(skuCode || '').trim()
  const cut = sku.indexOf('-')
  return (cut > 0 ? sku.slice(0, cut) : sku).toLowerCase()
}
const compareInboundRows = (a: { spu?: string | null; skuCode?: string | null }, b: { spu?: string | null; skuCode?: string | null }) => {
  const manual = (row: { skuCode?: string | null }) => String(row.skuCode || '').startsWith('ADD-') ? 1 : 0
  const rank = manual(a) - manual(b)
  if (rank) return rank
  const left = String(a.spu || inboundSpuKey(a.skuCode))
  const right = String(b.spu || inboundSpuKey(b.skuCode))
  const spu = left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' })
  if (spu) return spu
  return String(a.skuCode || '').localeCompare(String(b.skuCode || ''), 'en', { numeric: true, sensitivity: 'base' })
}
const INBOUND_STAGE_OPTIONS: Array<[string, string]> = [
  ['PENDING', '待采购'],
  ['RESTOCK', '补采'],
  ['SHORTAGE', '缺货'],
  ['PREPARING', '备货中'],
  ['TRANSIT', '工厂发货'],
  ['ARRIVED', '到达仓库'],
  ['PARCEL', '包裹发货'],
];
const INBOUND_STAGE_LABEL: Record<string, string> = {
  ...Object.fromEntries(INBOUND_STAGE_OPTIONS),
  STOCK: '备货',
  FACTORY: '工厂发货',
};
const INBOUND_STAGE_FILL: Record<string, { background: string; color: string }> = {
  PENDING: { background: '#facc15', color: '#422006' },
  RESTOCK: { background: '#f472b6', color: '#831843' },
  SHORTAGE: { background: '#f87171', color: '#450a0a' },
  STOCK: { background: '#60a5fa', color: '#172554' },
  PREPARING: { background: '#60a5fa', color: '#172554' },
  TRANSIT: { background: '#c084fc', color: '#3b0764' },
  FACTORY: { background: '#c084fc', color: '#3b0764' },
  ARRIVED: { background: '#4ade80', color: '#052e16' },
  PARCEL: { background: '#fb923c', color: '#431407' },
};

function scrollPane(from: HTMLElement, edge: 'top' | 'bottom') {
  let node: HTMLElement | null = from.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 4) {
      node.scrollTo({ top: edge === 'top' ? 0 : node.scrollHeight, behavior: 'smooth' });
      return;
    }
    node = node.parentElement;
  }
  const page = document.scrollingElement || document.documentElement;
  page.scrollTo({ top: edge === 'top' ? 0 : page.scrollHeight, behavior: 'smooth' });
}

const imeKey = (event: { nativeEvent: { isComposing?: boolean; keyCode?: number } }) =>
  Boolean(event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)

const normalizedInboundStage = (stage?: string | null) => {
  const value = String(stage || 'PENDING').toUpperCase();
  return value === 'FACTORY' ? 'TRANSIT' : value;
};
const inboundStageFill = (stage?: string | null) => INBOUND_STAGE_FILL[normalizedInboundStage(stage)] || INBOUND_STAGE_FILL.PENDING;
type InboundImportRow = {
  key: string;
  imageUrl: string;
  sku: string;
  unitPrice: string;
  quantity: string;
  lineAmount: string;
  costPrice: string;
  supplierUrl: string;
  supplierName: string;
  note: string;
  inboundQty: string;
  stage: string;
};
const emptyImportRow = (partial: Partial<InboundImportRow>): InboundImportRow => ({
  key: partial.key || `import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  imageUrl: partial.imageUrl || '',
  sku: partial.sku || '',
  unitPrice: partial.unitPrice || '',
  quantity: partial.quantity || '',
  lineAmount: partial.lineAmount || '',
  costPrice: partial.costPrice || '',
  supplierUrl: partial.supplierUrl || '',
  supplierName: partial.supplierName || '',
  note: partial.note || '',
  inboundQty: partial.inboundQty || '',
  stage: partial.stage || '',
});
const formatInboundMoney = (amount: number | null | undefined, currency?: string) => {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  const text = (Math.round(Number(amount) * 100) / 100).toFixed(2);
  const code = String(currency || '').toUpperCase();
  if (code === 'CNY' || code === 'RMB') return `¥${text}`;
  if (code === 'USD') return `$${text}`;
  return code ? `${code} ${text}` : text;
};
const inboundGoodsStatus = (line: { inboundQty: number; acknowledged?: boolean; outOfStock?: boolean; openedQty?: number; goodsStatus?: string; productStatus?: string }) => {
  const confirmedZero = Number(line.inboundQty) <= 0 && (
    Boolean(line.acknowledged) || (Boolean(line.outOfStock) && line.inboundQty === line.openedQty)
  );
  if (confirmedZero) return { label: '缺货', className: 'border-rose-200 bg-rose-50 text-rose-700' };
  const key = String(line.goodsStatus || line.productStatus || '').toUpperCase();
  return {
    label: GOODS_STATUS_LABEL[key] || '—',
    className: key === 'ACTIVE' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600',
  };
};
const getListStatusClassName = (status: OrderStatus) =>
  LIST_STATUS_OPTIONS.find((o) => o.value === status)?.className ||
  ORDER_STATUS_VARIANTS[status] ||
  'bg-slate-100 text-slate-700 border-slate-200';
const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  PAYPAL: 'PayPal',
  BANK_TRANSFER: '银行转账',
  STRIPE: 'Stripe',
  CREDIT_CARD: '信用卡'
};
interface Props {
  state: OrderManagementState;
  handlers: OrderManagementHandlers;
}
function InboundShipBar({
  shipments,
  saving,
  onSave,
  onUpdate,
  children,
}: {
  shipments: Array<{ id: string; shippedAt: string; trackingNumber: string; channel: string; note: string; images?: string[] }>
  saving: boolean
  onSave: (input: { blocks: Array<{ shippedAt: string; trackingNumber?: string; channel?: string; note?: string; images?: string[] }> }) => Promise<boolean>
  onUpdate: (input: { id: string; shippedAt: string; trackingNumber?: string; channel?: string; note?: string; images?: string[] }) => Promise<boolean>
  children: (button: React.ReactNode) => React.ReactNode
}) {
  const blankLeg = () => ({
    key: `leg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    trackingNumber: '',
    channel: '',
    note: '',
  })
  const blankBlock = () => ({
    key: `ship-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    images: [] as string[],
    shippedAt: '',
    legs: [blankLeg()],
  })
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState('')
  const [zoomUrl, setZoomUrl] = React.useState('')
  const [blocks, setBlocks] = React.useState<Array<{ key: string; images: string[]; shippedAt: string; legs: Array<{ key: string; trackingNumber: string; channel: string; note: string }> }>>([blankBlock()])
  const [uploadingKey, setUploadingKey] = React.useState('')
  const openForm = () => {
    setEditingId('')
    setBlocks([blankBlock()])
    setOpen(true)
  }
  const editRow = (row: { id: string; shippedAt: string; trackingNumber: string; channel: string; note: string; images?: string[] }) => {
    setEditingId(row.id)
    setBlocks([{
      key: row.id,
      images: [...(row.images || [])],
      shippedAt: shanghaiShipLabel(row.shippedAt),
      legs: [{ key: row.id, trackingNumber: row.trackingNumber || '', channel: row.channel || '', note: row.note || '' }],
    }])
    setOpen(true)
  }
  const uploadFiles = async (key: string, files: File[]) => {
    const images = files.filter((file) => file.type.startsWith('image/'))
    if (!images.length) {
      toast.error('请选择图片')
      return
    }
    setUploadingKey(key)
    try {
      const urls: string[] = []
      for (const file of images) {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/upload-image', { method: 'POST', body, credentials: 'same-origin' })
        const json = await res.json().catch(() => null)
        const url = json?.data?.image_url || json?.image_url || json?.data?.url || ''
        if (!res.ok || !url) throw new Error('图片上传失败')
        urls.push(String(url))
      }
      setBlocks((prev) => prev.map((block) => block.key === key ? { ...block, images: [...block.images, ...urls].slice(0, 12) } : block))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片上传失败')
    } finally {
      setUploadingKey('')
    }
  }
  const saveForm = async () => {
    const filled = blocks.filter((block) => block.shippedAt.trim() || block.images.length || block.legs.some((leg) => leg.trackingNumber.trim() || leg.channel.trim() || leg.note.trim()))
    if (!filled.length) {
      toast.error('请填写发货信息')
      return
    }
    if (filled.some((block) => !block.shippedAt.trim())) {
      toast.error('请填写发货日期')
      return
    }
    const packed = filled.flatMap((block) => {
      const legs = block.legs.filter((leg) => leg.trackingNumber.trim() || leg.channel.trim() || leg.note.trim())
      const rows = legs.length ? legs : block.legs.slice(0, 1)
      return rows.map((leg) => ({
        shippedAt: block.shippedAt,
        trackingNumber: leg.trackingNumber.trim(),
        channel: leg.channel.trim(),
        note: leg.note.trim(),
        images: block.images,
      }))
    })
    let saved = false
    if (editingId) {
      const [first, ...rest] = packed
      saved = await onUpdate({ id: editingId, ...first })
      if (saved && rest.length) saved = await onSave({ blocks: rest })
    } else {
      saved = await onSave({ blocks: packed })
    }
    if (saved) {
      setEditingId('')
      setOpen(false)
    }
  }
  const shanghaiShipLabel = (iso: string) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date)
    const part = (type: string) => parts.find((item) => item.type === type)?.value || ''
    const hour = part('hour') === '24' ? '00' : part('hour')
    return `${part('year')}-${part('month')}-${part('day')}`
  }
  return (
    <>
      {open ? (
        <div className="shrink-0 space-y-3 border-t bg-white px-4 py-3 sm:px-6">
          {blocks.map((block, index) => {
            const slots = Math.max(4, block.images.length)
            return (
              <div key={block.key} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                  <div
                    className="grid w-[17.5rem] shrink-0 grid-cols-4 gap-2"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      void uploadFiles(block.key, [...event.dataTransfer.files])
                    }}
                  >
                    {Array.from({ length: slots }, (_, slot) => {
                      const url = block.images[slot]
                      return (
                        <label key={`${block.key}-${slot}`} className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                          {url ? <button type="button" className="h-full w-full" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setZoomUrl(url) }}><img src={url} alt="" className="h-full w-full object-cover" /></button> : (uploadingKey === block.key ? '上传中' : '发货图片')}
                          {url ? null : <input type="file" accept="image/*" className="hidden" onChange={(event) => { const files = event.target.files; if (files?.length) void uploadFiles(block.key, [...files]); event.target.value = '' }} />}
                          {url ? (
                            <button type="button" className="absolute right-0.5 top-0.5 rounded bg-white/90 px-1 text-xs text-slate-700" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setBlocks((prev) => prev.map((item) => item.key === block.key ? { ...item, images: item.images.filter((_, imageIndex) => imageIndex !== slot) } : item)) }}>×</button>
                          ) : null}
                        </label>
                      )
                    })}
                    <button type="button" className="h-16 w-16 rounded-md border border-slate-200 text-xs text-slate-600" onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.multiple = true
                      input.onchange = () => { if (input.files?.length) void uploadFiles(block.key, [...input.files]) }
                      input.click()
                    }}>新增</button>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="grid w-56 max-w-full gap-1 text-sm font-medium text-slate-700">发货时间
                      <Input className="h-9 border-slate-600 bg-white" type="date" value={block.shippedAt.slice(0, 10)} onChange={(event) => setBlocks((prev) => prev.map((item) => item.key === block.key ? { ...item, shippedAt: event.target.value } : item))} />
                    </label>
                    <div className="space-y-2">
                      {block.legs.map((leg, legIndex) => (
                        <div key={leg.key} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[9.5rem_8rem_minmax(0,10rem)_auto]">
                          <label className="grid min-w-0 gap-1 text-sm text-slate-700">{legIndex === 0 ? '物流号' : '物流号'}
                            <Input className="h-9 border-slate-600 bg-white text-slate-900" value={leg.trackingNumber} onChange={(event) => setBlocks((prev) => prev.map((item) => item.key === block.key ? { ...item, legs: item.legs.map((row) => row.key === leg.key ? { ...row, trackingNumber: event.target.value } : row) } : item))} />
                          </label>
                          <label className="grid min-w-0 gap-1 text-sm text-slate-700">渠道
                            <Input className="h-9 border-slate-600 bg-white text-slate-900" value={leg.channel} onChange={(event) => setBlocks((prev) => prev.map((item) => item.key === block.key ? { ...item, legs: item.legs.map((row) => row.key === leg.key ? { ...row, channel: event.target.value } : row) } : item))} />
                          </label>
                          <label className="col-span-2 grid min-w-0 gap-1 text-sm text-slate-700 sm:col-span-1">备注
                            <Input className="h-9 border-slate-600 bg-white text-slate-900" value={leg.note} onChange={(event) => setBlocks((prev) => prev.map((item) => item.key === block.key ? { ...item, legs: item.legs.map((row) => row.key === leg.key ? { ...row, note: event.target.value } : row) } : item))} />
                          </label>
                          <div className="flex gap-1">
                            {legIndex === block.legs.length - 1 ? (
                              <Button type="button" className="h-9 bg-emerald-600 px-3 text-white hover:bg-emerald-700" onClick={() => setBlocks((prev) => prev.map((item) => item.key === block.key ? { ...item, legs: [...item.legs, blankLeg()] } : item))}>复制</Button>
                            ) : null}
                            {block.legs.length > 1 ? (
                              <Button type="button" variant="outline" className="h-9 border-slate-600 px-2" onClick={() => setBlocks((prev) => prev.map((item) => item.key === block.key ? { ...item, legs: item.legs.filter((row) => row.key !== leg.key) } : item))}>删除</Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button type="button" variant="outline" onClick={() => setBlocks((prev) => {
                      const next = [...prev]
                      next.splice(index + 1, 0, blankBlock())
                      return next
                    })}>复制区块</Button>
                    {blocks.length > 1 ? (
                      <Button type="button" variant="outline" onClick={() => setBlocks((prev) => prev.filter((item) => item.key !== block.key))}>删除</Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void saveForm()} disabled={saving}>{editingId ? '保存修改' : '保存发货'}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
          </div>
        </div>
      ) : null}
      {shipments.length ? (
        <div className="max-h-48 shrink-0 space-y-2 overflow-auto border-t bg-slate-50 px-4 py-3 sm:px-6">
          {shipments.map((row) => (
            <div key={row.id} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center">
              <div className="flex gap-1">
                {(row.images || []).slice(0, 4).map((url) => (
                  <button key={url} type="button" className="h-12 w-12 overflow-hidden rounded border" onClick={() => setZoomUrl(url)}>
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="grid flex-1 gap-1 text-sm text-slate-700 sm:grid-cols-4">
                <div>发货时间 {shanghaiShipLabel(row.shippedAt) || '—'}</div>
                <div className="break-all">物流号 {row.trackingNumber || '—'}</div>
                <div className="break-all">渠道 {row.channel || '—'}</div>
                <div className="break-all">备注 {row.note || '—'}</div>
              </div>
              <Button type="button" variant="outline" className="h-9 shrink-0 border-slate-600 px-3" onClick={() => editRow(row)}>编辑</Button>
            </div>
          ))}
        </div>
      ) : null}
      {zoomUrl ? (
        <div className="pointer-events-auto fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-label="发货图片" onClick={() => setZoomUrl('')}>
          <button type="button" className="absolute right-4 top-4 rounded-md bg-white px-3 py-1.5 text-sm text-slate-900" onClick={() => setZoomUrl('')}>关闭</button>
          <img src={zoomUrl} alt="" className="max-h-[92vh] max-w-[94vw] object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
      {children(
        <Button type="button" variant="outline" onClick={() => openForm()}>
          发货图片
        </Button>,
      )}
    </>
  )
}

export const OrderManagementView = ({
  state,
  handlers
}: Props) => {
  const router = useRouter();
  const [inboundZoom, setInboundZoom] = React.useState<{ src: string; name: string } | null>(null);

  const [inboundColumns, setInboundColumns] = React.useState<Record<string, boolean>>(() => Object.fromEntries(INBOUND_EXPORT_COLUMNS.map(([key]) => [key, false])));
  const [inboundSelected, setInboundSelected] = React.useState<string[]>([]);
  const [stageFilter, setStageFilter] = React.useState('ALL');
  const [batchNote, setBatchNote] = React.useState('');
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [stageOpen, setStageOpen] = React.useState(false);
  const [stagePick, setStagePick] = React.useState('');
  const stageMenuRef = React.useRef<HTMLDivElement>(null);
  const titleClickTimer = React.useRef(0);
  const inboundTitleRef = React.useRef<HTMLDivElement>(null);
  const [inboundTitleHeight, setInboundTitleHeight] = React.useState(0);
  React.useEffect(() => {
    const node = inboundTitleRef.current;
    if (!node) return;
    const measure = () => setInboundTitleHeight(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [state.inboundOrderId]);
  const [addonCards, setAddonCards] = React.useState<Array<{ key: string; imageUrl: string; productName: string; quantity: string; unitPrice: string; costPrice: string; supplierName: string; note: string; stage: string; inboundQty: string }>>([]);
  const [importOrderOpen, setImportOrderOpen] = React.useState(false);
  const [importOrderEmail, setImportOrderEmail] = React.useState('');
  const [importOrderFile, setImportOrderFile] = React.useState<File | null>(null);
  const [importOrderShip, setImportOrderShip] = React.useState('');
  const [importOrderWeight, setImportOrderWeight] = React.useState('');
  const [importOrderNote, setImportOrderNote] = React.useState('');
  const [importOrderStatus, setImportOrderStatus] = React.useState<OrderStatus>('PROCESSING');
  const [importOrderSaving, setImportOrderSaving] = React.useState(false);
  const [createOrderOpen, setCreateOrderOpen] = React.useState(false);
  const [createOrderName, setCreateOrderName] = React.useState('');
  const [createOrderSaving, setCreateOrderSaving] = React.useState(false);
  const [contactEdit, setContactEdit] = React.useState<{ id: string; field: 'name' | 'phone' | 'email' } | null>(null);
  const [contactDraft, setContactDraft] = React.useState('');

  const [manualDrafts, setManualDrafts] = React.useState<Record<string, { unitPrice: string; quantity: string; costPrice: string; supplierName: string }>>({});
  const [addonDrag, setAddonDrag] = React.useState<'product' | 'sheet' | null>(null);
  const [sheetProgress, setSheetProgress] = React.useState<number | null>(null);
  const sheetJobRef = React.useRef(0);
  const [discountEditing, setDiscountEditing] = React.useState(false);
  const [discountDraft, setDiscountDraft] = React.useState('');
  const [cellEdit, setCellEdit] = React.useState<{ id: string; field: 'unit' | 'discount' | 'title' | 'coeff' } | null>(null);
  const [cellDraft, setCellDraft] = React.useState('');
  const [hiddenColumns, setHiddenColumns] = React.useState<Record<string, boolean>>({});
  const [importOpen, setImportOpen] = React.useState(false);
  const [importRows, setImportRows] = React.useState<InboundImportRow[]>([]);
  const [inboundDragOver, setInboundDragOver] = React.useState(false);
  const importFileRef = React.useRef<HTMLInputElement>(null);
  const shipImageRef = React.useRef<HTMLInputElement>(null);
  const addonProductRef = React.useRef<HTMLInputElement>(null);
  const addonSheetRef = React.useRef<HTMLInputElement>(null);
  const shipTimeNote = (note: string) => {
    const stamp = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()).replace(/\//g, '-');
    const line = `发货时间 ${stamp}`;
    const prev = String(note || '').trim();
    if (!prev) return line;
    if (/发货时间/.test(prev)) return prev.replace(/发货时间\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/, line);
    return `${prev}\n${line}`;
  };
  React.useEffect(() => {
    if (!state.inboundOrderId) return;
    setInboundColumns(Object.fromEntries(INBOUND_EXPORT_COLUMNS.map(([key]) => [key, false])));
    setImportOpen(false);
    setImportRows([]);
    setStageFilter('ALL');
    setBatchNote('');
    setNoteOpen(false);
    setHiddenColumns({});
    setAddonCards([]);
    setDiscountEditing(false);
    setInboundSelected(readInboundSelection(state.inboundOrderId));
  }, [state.inboundOrderId]);
  const visibleInboundDrafts = (stageFilter === 'ALL'
    ? state.inboundDrafts
    : state.inboundDrafts.filter((line) => normalizedInboundStage(line.inboundStage) === stageFilter)
  ).slice().sort(compareInboundRows);
  const allInboundSelected = visibleInboundDrafts.length > 0 && visibleInboundDrafts.every((line) => inboundSelected.includes(line.id));
  const setInboundSelectedPersist = (next: string[]) => {
    setInboundSelected(next);
    if (state.inboundOrderId) writeInboundSelection(state.inboundOrderId, next);
  };
  const columnVisible = (key: string) => hiddenColumns[key] !== true;
  const visibleInboundColumns = INBOUND_EXPORT_COLUMNS.filter(([key]) => columnVisible(key));
  const visibleTablePercent = visibleInboundColumns.reduce((sum, [key]) => sum + (INBOUND_COLUMN_PERCENT[key] || 8), 0);
  const hideInboundColumn = (key: string) => {
    const remaining = INBOUND_EXPORT_COLUMNS.filter(([item]) => item !== key && columnVisible(item));
    if (!remaining.length) {
      toast.error('至少保留一列');
      return;
    }
    setHiddenColumns((prev) => ({ ...prev, [key]: true }));
  };
  const showInboundColumn = (key: string) => {
    setHiddenColumns((prev) => ({ ...prev, [key]: false }));
  };
  const openBatchNote = () => {
    if (!inboundSelected.length) {
      toast.error('请先勾选商品');
      return;
    }
    setNoteOpen(true);
  };
  const confirmBatchNote = () => {
    const text = batchNote.trim();
    if (!inboundSelected.length) {
      toast.error('请先勾选商品');
      return;
    }
    if (!text) {
      toast.error('请先输入备注');
      return;
    }
    for (const id of inboundSelected) handlers.setInboundDraft(id, { inboundNote: text });
    setNoteOpen(false);
    setBatchNote('');
    toast.success('备注已填入勾选商品');
  };
  const openBatchStage = () => {
    if (stageOpen) {
      setStageOpen(false);
      return;
    }
    if (!inboundSelected.length) {
      toast.error('请先勾选商品');
      return;
    }
    setStagePick('');
    setStageOpen(true);
  };
  React.useEffect(() => {
    if (!stageOpen) return;
    const close = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && stageMenuRef.current?.contains(target)) return;
      setStageOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [stageOpen]);
  const applyBatchStage = () => {
    if (!inboundSelected.length) {
      toast.error('请先勾选商品');
      return;
    }
    if (!stagePick) {
      toast.error('请先选择状态');
      return;
    }
    handlers.persistInboundStages(inboundSelected, stagePick);
    setStageOpen(false);
    setStagePick('');
  };
  const patchImportRow = (key: string, patch: Partial<InboundImportRow>) => {
    setImportRows((prev) => prev.map((row) => row.key === key ? { ...row, ...patch } : row));
  };
  const uploadInboundImage = async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/upload-image', { method: 'POST', body, credentials: 'same-origin' });
    const json = await res.json().catch(() => null);
    const url = json?.data?.image_url || json?.image_url || json?.data?.url || '';
    if (!res.ok || !url) throw new Error('图片上传失败');
    return String(url);
  };
  const receiveImportFiles = async (files: FileList | File[]) => {
    const list = [...files];
    if (!list.length) return;
    setImportOpen(true);
    const images = list.filter((file) => file.type.startsWith('image/'));
    const sheets = list.filter((file) => !file.type.startsWith('image/'));
    const nextRows: InboundImportRow[] = [];
    try {
      for (const file of images) {
        const imageUrl = await uploadInboundImage(file);
        nextRows.push(emptyImportRow({ imageUrl }));
      }
      for (const file of sheets) await importSheetNow(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败');
      return;
    }
    if (!nextRows.length) {
      if (sheets.length) return;
      toast.error('没有读到商品或图片');
      return;
    }
    setImportRows((prev) => [...prev, ...nextRows]);
    toast.success(`已导入 ${nextRows.length} 条，信息可以不填`);
  };
  const attachImageToLine = async (lineId: string, files: FileList | File[]) => {
    const image = [...files].find((file) => file.type.startsWith('image/'));
    if (!image) {
      void receiveImportFiles(files);
      return;
    }
    try {
      const imageUrl = await uploadInboundImage(image);
      const line = state.inboundDrafts.find((item) => item.id === lineId);
      handlers.setInboundDraft(lineId, { shipmentImageUrl: imageUrl });
      toast.success('发货图片已上传');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片上传失败');
    }
  };
  const uploadShippingImages = async (files: FileList | File[]) => {
    const images = [...files].filter((file) => file.type.startsWith('image/'));
    if (!images.length) {
      toast.error('请选择图片');
      return;
    }
    const selected = new Set(inboundSelected);
    const picked = state.inboundDrafts.filter((line) => selected.has(line.id));
    const targets = picked.length ? picked : state.inboundDrafts;
    try {
      const count = Math.min(images.length, targets.length);
      for (let index = 0; index < count; index += 1) {
        const imageUrl = await uploadInboundImage(images[index]);
        const line = targets[index];
        handlers.setInboundDraft(line.id, { shipmentImageUrl: imageUrl });
      }
      toast.success(count > 1 ? `已上传 ${count} 张发货图片` : '发货图片已上传');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片上传失败');
    }
  };
  const saveImportRows = async () => {
    const selected = new Set(inboundSelected);
    const targets = state.inboundDrafts.filter((line) => selected.has(line.id));
    const pool = targets.length ? targets : state.inboundDrafts;
    const used = new Set<string>();
    const patches: Array<{ id: string } & Record<string, unknown>> = [];
    const manualLines: Array<{ imageUrl?: string | null; unitPrice?: number | null; quantity?: number | null; costPrice?: number | null; lineAmount?: number | null }> = [];
    importRows.forEach((row) => {
      const sku = row.sku.trim();
      const hasValues = Boolean(row.unitPrice.trim() || row.quantity.trim() || row.lineAmount.trim() || row.costPrice.trim());
      if (!sku && hasValues) {
        manualLines.push({
          imageUrl: row.imageUrl || null,
          unitPrice: row.unitPrice.trim() ? Number(row.unitPrice) : null,
          quantity: row.quantity.trim() ? Number(row.quantity) : null,
          lineAmount: row.lineAmount.trim() ? Number(row.lineAmount) : null,
          costPrice: row.costPrice.trim() ? Number(row.costPrice) : null,
        });
        return;
      }
      const matched = sku ? pool.find((line) => line.skuCode.trim() === sku && !used.has(line.id)) : null;
      const line = matched || pool.find((item) => !used.has(item.id));
      if (!line) return;
      used.add(line.id);
      const patch: { id: string } & Record<string, unknown> = { id: line.id };
      if (row.imageUrl) patch.shipmentImageUrl = row.imageUrl;
      if (row.note.trim()) patch.inboundNote = row.note.trim();
      if (row.supplierName.trim()) patch.supplierName = row.supplierName.trim();
      if (row.supplierUrl.trim() && /^https?:\/\//i.test(row.supplierUrl.trim())) patch.supplierUrl = row.supplierUrl.trim();
      if (row.unitPrice.trim() && Number.isFinite(Number(row.unitPrice))) patch.unitPrice = Number(row.unitPrice);
      if (row.lineAmount.trim() && Number.isFinite(Number(row.lineAmount))) patch.lineAmount = Number(row.lineAmount);
      if (row.costPrice.trim() && Number.isFinite(Number(row.costPrice))) patch.costPrice = Number(row.costPrice);
      if (row.inboundQty.trim() && Number.isFinite(Number(row.inboundQty))) {
        patch.inboundQty = Number(row.inboundQty);
        patch.acknowledged = true;
      }
      if (row.stage) patch.inboundStage = row.stage;
      patches.push(patch as { id: string });
    });
    if (patches.length) await handlers.applyInboundImport(patches);
    if (manualLines.length) await handlers.appendManualOrderLine({ lines: manualLines });
    setImportOpen(false);
    setImportRows([]);
  };
  const downloadInbound = (mode: 'sheet' | 'images') => {
    const selected = new Set(inboundSelected);
    const rows = state.inboundDrafts.filter((line) => selected.has(line.id));
    const orderNo = state.list.find((row) => row.id === state.inboundOrderId)?.orderNo
      || (state.detailData?.id === state.inboundOrderId ? state.detailData.orderNo : '');
    void handlers.exportInboundSheet({
      orderNo: orderNo || '',
      mode,
      columns: INBOUND_EXPORT_COLUMNS.filter(([key]) => inboundColumns[key] !== false).map(([key]) => key),
      rows: rows.map((line) => ({
        productName: line.productName,
        skuCode: line.skuCode,
        imageUrl: line.shipmentImageUrl || line.mainImageUrl || '',
        unitPrice: line.unitPrice,
        discountUnitPrice: line.discountUnitPrice ?? line.unitPrice,
        currencyCode: line.currencyCode,
        quantity: line.quantity,
        lineAmount: line.lineAmount,
        costPrice: line.costPrice,
        supplierName: line.supplierName,
        supplierUrl: line.supplierUrl,
        inboundNote: line.inboundNote,
        inboundStage: line.inboundStage,
        inboundQty: line.inboundQty,
      })),
    });
  };


  const fileToBase64 = async (file: File, onProgress?: (ratio: number) => void) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    const size = 0x8000;
    for (let index = 0; index < bytes.length; index += size) {
      binary += String.fromCharCode(...bytes.subarray(index, index + size));
      if (onProgress && bytes.length) onProgress(Math.min(1, (index + size) / bytes.length));
    }
    return btoa(binary);
  };
  const importSheetNow = async (file: File) => {
    const job = sheetJobRef.current + 1;
    sheetJobRef.current = job;
    setSheetProgress(1);
    const fileBase64 = await fileToBase64(file, (ratio) => {
      if (sheetJobRef.current !== job) return;
      setSheetProgress(Math.max(1, Math.min(30, Math.round(ratio * 30))));
    });
    if (sheetJobRef.current !== job) return false;
    setSheetProgress(32);
    const timer = window.setInterval(() => {
      setSheetProgress((current) => {
        if (current == null || current >= 92) return current;
        return Math.min(92, current + Math.max(1, Math.round((92 - current) * 0.12)));
      });
    }, 500);
    try {
      const result = await handlers.importInboundSheet({ fileBase64, fileName: file.name });
      if (sheetJobRef.current === job) setSheetProgress(100);
      return result;
    } finally {
      window.clearInterval(timer);
      window.setTimeout(() => {
        if (sheetJobRef.current === job) setSheetProgress(null);
      }, 700);
    }
  };
  const receiveAddonProducts = async (files: FileList | File[]) => {
    const list = [...files];
    if (!list.length) return;
    const images = list.filter((file) => file.type.startsWith('image/'));
    const sheets = list.filter((file) => !file.type.startsWith('image/') && /\.(xlsx|xls|csv)$/i.test(file.name));
    try {
      const cards: Array<{ key: string; imageUrl: string; productName: string; quantity: string; unitPrice: string; costPrice: string; supplierName: string; note: string; stage: string; inboundQty: string }> = [];
      for (const file of images) {
        const imageUrl = await uploadInboundImage(file);
        cards.push({ key: `addon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, imageUrl, productName: '', quantity: '1', unitPrice: '', costPrice: '', supplierName: '', note: '', stage: 'PENDING', inboundQty: '0' });
      }
      if (cards.length) setAddonCards((prev) => [...prev, ...cards]);
      for (const file of sheets) await importSheetNow(file);
      if (!cards.length && !sheets.length) toast.error('请拖入商品图片或表格');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '传入商品失败');
    }
  };
  const receiveAddonSheet = async (files: FileList | File[]) => {
    const sheets = [...files].filter((file) => !file.type.startsWith('image/'));
    if (!sheets.length) {
      toast.error('请传入表格');
      return;
    }
    try {
      for (const file of sheets) await importSheetNow(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '传入表格失败');
    }
  };
  const patchAddonCard = (key: string, patch: Partial<{ productName: string; quantity: string; unitPrice: string; costPrice: string; supplierName: string; note: string; stage: string; inboundQty: string }>) => {
    setAddonCards((prev) => prev.map((item) => item.key === key ? { ...item, ...patch } : item));
  };
  const saveAddonRow = async (card: { key: string; imageUrl: string; productName: string; quantity: string; unitPrice: string; costPrice: string; supplierName: string; note: string; stage: string; inboundQty: string }) => {
    const unitRaw = card.unitPrice.trim();
    const costRaw = card.costPrice.trim();
    const unitPrice = unitRaw === '' ? 0 : Number(unitRaw);
    const costPrice = costRaw === '' ? null : Number(costRaw);
    const quantity = Math.max(1, Math.floor(Number(card.quantity) || 1));
    const inboundQty = Math.max(0, Math.min(quantity, Math.floor(Number(card.inboundQty) || 0)));
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || (costPrice != null && (!Number.isFinite(costPrice) || costPrice < 0))) {
      toast.error('请填写正确的售价和成本价');
      return;
    }
    const saved = await handlers.appendManualOrderLine({
      imageUrl: card.imageUrl,
      productName: card.productName.trim(),
      quantity,
      unitPrice,
      lineAmount: Math.round(unitPrice * quantity * 100) / 100,
      costPrice,
      supplierName: card.supplierName.trim(),
      inboundNote: card.note.trim(),
      inboundStage: card.stage || 'PENDING',
      inboundQty,
    });
    if (saved) setAddonCards((prev) => prev.filter((item) => item.key !== card.key));
  };

  const manualDraftOf = (line: { id: string; unitPrice: number | null; quantity: number; costPrice: number | null; supplierName?: string | null }) => (
    manualDrafts[line.id] || {
      unitPrice: line.unitPrice == null ? '' : String(line.unitPrice),
      quantity: line.quantity ? String(line.quantity) : '',
      costPrice: line.costPrice == null ? '' : String(line.costPrice),
      supplierName: line.supplierName || '',
    }
  );
  const patchManualDraft = (line: { id: string; unitPrice: number | null; quantity: number; costPrice: number | null; supplierName?: string | null }, patch: Partial<{ unitPrice: string; quantity: string; costPrice: string; supplierName: string }>) => {
    setManualDrafts((prev) => ({ ...prev, [line.id]: { ...manualDraftOf(line), ...prev[line.id], ...patch } }));
  };
  const saleFromCost = (costText: string, coefficient: number | null | undefined) => {
    const cost = Number(costText);
    const coeff = Number(coefficient);
    if (!(cost > 0) || !(coeff > 0) || !Number.isFinite(cost) || !Number.isFinite(coeff)) return null;
    return String(Math.round((cost / 6.5) * coeff * 100) / 100);
  };
  const saveManualDraft = async (line: { id: string; unitPrice: number | null; quantity: number; costPrice: number | null; supplierName?: string | null; priceCoefficient?: number | null }, override?: { unitPrice?: string; quantity?: string; costPrice?: string; supplierName?: string; priceCoefficient?: number | null }) => {
    const draft = {
      ...(manualDrafts[line.id] || {
        unitPrice: line.unitPrice == null ? '' : String(line.unitPrice),
        quantity: line.quantity ? String(line.quantity) : '',
        costPrice: line.costPrice == null ? '' : String(line.costPrice),
        supplierName: line.supplierName || '',
      }),
      ...override,
    };
    const numberOrNull = (value: string) => {
      const text = value.trim();
      if (!text) return null;
      const number = Number(text);
      return Number.isFinite(number) ? number : Number.NaN;
    };
    const unitPrice = numberOrNull(draft.unitPrice);
    const quantity = numberOrNull(draft.quantity);
    const costPrice = numberOrNull(draft.costPrice);
    if ([unitPrice, quantity, costPrice].some((value) => Number.isNaN(value)) || (unitPrice != null && unitPrice < 0) || (quantity != null && quantity <= 0) || (costPrice != null && costPrice < 0)) {
      toast.error('请填写正确的售价、数量或成本价');
      return;
    }
    const lineAmount = unitPrice == null || quantity == null ? null : Math.round(unitPrice * quantity * 100) / 100;
    const saved = await handlers.updateManualOrderLine({ orderItemId: line.id, unitPrice, quantity, lineAmount, costPrice, supplierName: draft.supplierName.trim(), ...(override && 'priceCoefficient' in override ? { priceCoefficient: override.priceCoefficient ?? null } : {}) });
    if (saved) setManualDrafts((prev) => {
      const next = { ...prev };
      delete next[line.id];
      return next;
    });
  };

  const submitImportOrder = async () => {
    const customerName = importOrderEmail.trim();
    if (!customerName) {
      toast.error('请填写客户姓名');
      return;
    }
    if (!importOrderFile) {
      toast.error('请上传表格');
      return;
    }
    const weightText = importOrderWeight.trim();
    const weightGrams = weightText ? Number(weightText) : null;
    if (weightGrams != null && (!Number.isFinite(weightGrams) || weightGrams < 0)) {
      toast.error('请填写正确的重量');
      return;
    }
    try {
      setImportOrderSaving(true);
      const fileBase64 = await fileToBase64(importOrderFile);
      const created = await handlers.importCustomerOrder({
        customerName,
        fileBase64,
        fileName: importOrderFile.name,
        shippingMethod: importOrderShip.trim(),
        weightGrams,
        orderNote: importOrderNote.trim(),
        status: importOrderStatus,
      });
      if (!created) return;
      setImportOrderOpen(false);
      setImportOrderEmail('');
      setImportOrderFile(null);
      setImportOrderShip('');
      setImportOrderWeight('');
      setImportOrderNote('');
      setImportOrderStatus('PROCESSING');
    } finally {
      setImportOrderSaving(false);
    }
  };

  const submitCreateOrder = async () => {
    const customerName = createOrderName.trim();
    if (!customerName) {
      toast.error('请填写客户姓名');
      return;
    }
    try {
      setCreateOrderSaving(true);
      const created = await handlers.createCustomerOrder({ customerName, status: 'PROCESSING' });
      if (!created) return;
      setCreateOrderOpen(false);
      setCreateOrderName('');
    } finally {
      setCreateOrderSaving(false);
    }
  };

  const visibleCustomerEmail = (email: string) => (email || '').trim().toLowerCase().endsWith('@guest.local') ? '' : (email || '');

  const saveCustomerContact = async (row: { id: string; customerEmail: string; customerName: string; customerWhatsapp: string | null }, field: 'name' | 'phone' | 'email') => {
    const value = contactDraft.trim();
    setContactEdit(null);
    if (field === 'name') {
      if (!value) {
        toast.error('请填写姓名');
        return;
      }
      if (value === (row.customerName || '')) return;
      await handlers.updateOrderCustomerProfile({ orderId: row.id, customerName: value });
      return;
    }
    if (field === 'email') {
      const current = visibleCustomerEmail(row.customerEmail);
      if (!value) {
        toast.error('请填写邮箱');
        return;
      }
      if (value.toLowerCase() === current.trim().toLowerCase()) return;
      await handlers.updateOrderCustomerProfile({ orderId: row.id, customerEmail: value });
      return;
    }
    if (value === (row.customerWhatsapp || '')) return;
    await handlers.updateOrderCustomerProfile({ orderId: row.id, phone: value });
  };

  const inboundCurrency = state.inboundDrafts.find((line) => line.currencyCode)?.currencyCode || 'USD';
  const originalTotal = state.inboundDrafts.reduce((sum, line) => sum + (line.lineAmount != null ? Number(line.lineAmount) : (Number(line.unitPrice) || 0) * line.quantity), 0);
  const discountTotal = state.inboundDrafts.reduce((sum, line) => sum + ((line.discountUnitPrice ?? line.unitPrice ?? 0) * line.quantity), 0);
  const orderedPieces = state.inboundDrafts.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const arrivedPieces = state.inboundDrafts.reduce((sum, line) => sum + (Number(line.inboundQty) || 0), 0);
  const inStockTotal = state.inboundDrafts.reduce((sum, line) => sum + ((Number(line.unitPrice) || 0) * (Number(line.inboundQty) || 0)), 0);
  const inStockDiscountTotal = state.inboundDrafts.reduce((sum, line) => sum + ((Number(line.discountUnitPrice ?? line.unitPrice) || 0) * (Number(line.inboundQty) || 0)), 0);
  const inboundOrder = state.detailData?.id === state.inboundOrderId
    ? state.detailData
    : state.list.find((row) => row.id === state.inboundOrderId);
  const orderSubtotal = inboundOrder && Number.isFinite(Number(inboundOrder.subtotalAmount)) ? Number(inboundOrder.subtotalAmount) : originalTotal;
  const orderDiscount = inboundOrder && Number.isFinite(Number(inboundOrder.discountAmount))
    ? Number(inboundOrder.discountAmount)
    : Math.max(0, originalTotal - discountTotal);
  const discountPercent = orderSubtotal > 0 ? Math.round((orderDiscount / orderSubtotal) * 10000) / 100 : 0;
  const discountPercentLabel = `${Number(discountPercent.toFixed(2))}%`;
  const orderKeepRate = Math.max(0, Math.min(1, 1 - discountPercent / 100));
  const discountFromSale = (unitText: string) => {
    if (!unitText.trim()) return null;
    const unit = Number(unitText);
    if (!Number.isFinite(unit)) return null;
    return Math.round(unit * orderKeepRate * 100) / 100;
  };
  const roundMoney = (amount: number) => Math.round(amount * 100) / 100;
  const costDiscountTotal = roundMoney(originalTotal * orderKeepRate);
  const costInStockDiscountTotal = roundMoney(inStockTotal * orderKeepRate);
  const saveDiscountPercent = async () => {
    const percent = Number(discountDraft.replace('%', '').trim());
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      toast.error('请输入 0 到 100 的折扣');
      return;
    }
    setDiscountEditing(false);
    await handlers.updateInboundDiscount(percent);
  };

  return <div className="min-h-screen bg-background font-body text-foreground" data-api-unique-id="ordermanagementview-r1f69bc6332e634b8-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
      
      {/* 1. 关键指标看板 Section */}
      <section data-controller-name="关键指标看板" className="w-full bg-slate-50 border-b" data-api-unique-id="ordermanagementview-rb60e64f62b7f9d04-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
        <div className="w-full max-w-none px-3 py-4 sm:px-4 sm:py-8 xl:px-6" data-api-unique-id="ordermanagementview-r8a74b3ed8054c34c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
          <div className="flex items-center justify-between mb-6" data-api-unique-id="ordermanagementview-ra591b6e3898dad1f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <h1 className="text-2xl font-header font-bold tracking-tight" data-api-unique-id="ordermanagementview-r76e3a528fc21a119-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">订单管理</h1>
            <div className="flex gap-2" data-api-unique-id="ordermanagementview-rfd62d20332c66dd9-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} data-api-unique-id="ordermanagementview-r62bb059b5ac10633-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <RefreshCcw className="mr-2 h-4 w-4" data-api-unique-id="ordermanagementview-r5b550d881054f36d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 刷新数据
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-api-unique-id="ordermanagementview-ra0131d6061ca85c3-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            {[{
            label: '待发货订单',
            value: state.stats?.pendingShipmentCount,
            icon: Package,
            color: 'text-accent'
          }, {
            label: '今日新增订单',
            value: state.stats?.todayNewOrderCount,
            icon: ShoppingBag,
            color: 'text-primary'
          }, {
            label: '退款处理中',
            value: state.stats?.refundingCount,
            icon: RefreshCcw,
            color: 'text-destructive'
          }, {
            label: '全部订单',
            value: state.stats?.totalOrderCount,
            icon: History,
            color: 'text-slate-600'
          }].map((item, index) => <Card key={index} className="border-none shadow-sm overflow-hidden" data-api-unique-id="ordermanagementview-r18b493a42a0b55cd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                <CardContent className="p-6" data-api-unique-id="ordermanagementview-r806e80758d6a3acb-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                  <div className="flex items-center justify-between" data-api-unique-id="ordermanagementview-r403357ccb4ca1010-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                    <div data-api-unique-id="ordermanagementview-r311d7364a795ea88-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                      <p className="text-sm font-medium text-muted-foreground" data-api-unique-id="ordermanagementview-r6797dea9c3827aa6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1" data-api-bind-info={`list-${index}-label`} data-api-map-var-name='item'>{item.label}</p>
                      <h3 className="text-3xl font-header font-bold mt-1" data-api-unique-id="ordermanagementview-rc77131d31164a5d0-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                        {state.statsLoading ? '...' : (item.value || 0).toLocaleString()}
                      </h3>
                    </div>
                    <div className={`p-3 rounded-lg bg-slate-100 ${item.color}`} data-api-unique-id="ordermanagementview-re7faf3ddd3f20d84-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                      <item.icon className="h-6 w-6" data-api-unique-id="ordermanagementview-rb0054bb529f6c3d5-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1" data-api-bind-info={`list-${index}-icon`} data-api-map-var-name='item' />
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* 2. 订单筛选控制台 Section */}
      <section data-controller-name="订单筛选控制台" className="w-full" data-api-unique-id="ordermanagementview-rd15ae399a3022c30-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
        <div className="w-full max-w-none px-3 py-4 sm:px-4 sm:py-8 xl:px-6" data-api-unique-id="ordermanagementview-r1d9fb3b1858894fa-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
          <div className="mb-6 flex flex-wrap items-center gap-3">
          <Tabs value={state.filterForm.status || 'ALL'} onValueChange={handlers.handleTabChange} className="w-full max-w-full overflow-x-auto sm:w-auto" data-api-unique-id="ordermanagementview-r69fb7214eefc2d40-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <TabsList className="h-10 w-max flex-nowrap bg-slate-100/50 p-1" data-api-unique-id="ordermanagementview-r86281deace4bb13e-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <TabsTrigger value="ALL" className="shrink-0 px-3 sm:px-6" data-api-unique-id="ordermanagementview-r0cb2cb2fc92a2309-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">全部订单</TabsTrigger>
              <TabsTrigger value="TODAY_PURCHASE" className="shrink-0 gap-1.5 px-3 sm:px-6">待采购{Number(state.stats?.todayPurchaseCount || 0) > 0 ? <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{Number(state.stats.todayPurchaseCount) > 99 ? '99+' : state.stats.todayPurchaseCount}</span> : null}</TabsTrigger>
              {LIST_STATUS_OPTIONS.map((opt) => <TabsTrigger key={opt.value} value={opt.value} className="shrink-0 px-3 sm:px-6">
                  {opt.label}
                </TabsTrigger>)}
            </TabsList>
          </Tabs>
          <Button type="button" variant="outline" className="h-10 shrink-0" onClick={() => setCreateOrderOpen(true)}>创建新单</Button>
          <Button type="button" className="h-10 shrink-0" onClick={() => setImportOrderOpen(true)}>导入订单</Button>
          <Dialog open={createOrderOpen} onOpenChange={setCreateOrderOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>创建新单</DialogTitle>
                <DialogDescription>填写客户姓名后确认，会按现有订单号规则生成一条新订单。邮箱可以在列表里双击添加，姓名和手机号也可以双击修改。</DialogDescription>
              </DialogHeader>
              <label className="grid gap-1 text-sm font-medium text-slate-700">客户姓名
                <Input value={createOrderName} onChange={(event) => setCreateOrderName(event.target.value)} placeholder="客户姓名" autoComplete="off" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void submitCreateOrder(); } }} />
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOrderOpen(false)} disabled={createOrderSaving}>取消</Button>
                <Button type="button" onClick={() => void submitCreateOrder()} disabled={createOrderSaving}>{createOrderSaving ? '正在创建…' : '确认'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
          <Dialog open={importOrderOpen} onOpenChange={setImportOrderOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>导入订单</DialogTitle>
                <DialogDescription>填写客户姓名并上传表格。表头对上售价、数量、总价就可以，SKU 可以不填。邮箱可以在订单列表里双击添加。</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <label className="grid gap-1 text-sm font-medium text-slate-700">客户姓名
                  <Input value={importOrderEmail} onChange={(event) => setImportOrderEmail(event.target.value)} placeholder="客户姓名" autoComplete="off" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">表格
                  <Input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setImportOrderFile(event.target.files?.[0] || null)} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">运输方式
                  <Input value={importOrderShip} onChange={(event) => setImportOrderShip(event.target.value)} placeholder="可不填，例如 ship by sea" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">重量（克）
                  <Input inputMode="decimal" value={importOrderWeight} onChange={(event) => setImportOrderWeight(event.target.value)} placeholder="可不填" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">订单备注
                  <Textarea rows={2} value={importOrderNote} onChange={(event) => setImportOrderNote(event.target.value)} placeholder="可不填" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">状态
                  <select className="h-10 rounded-md border border-slate-200 bg-white px-2 text-sm" value={importOrderStatus} onChange={(event) => setImportOrderStatus(event.target.value as OrderStatus)}>
                    {LIST_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setImportOrderOpen(false)} disabled={importOrderSaving}>取消</Button>
                <Button type="button" onClick={() => void submitImportOrder()} disabled={importOrderSaving}>{importOrderSaving ? '正在生成…' : '生成订单'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="shadow-sm border-slate-200" data-api-unique-id="ordermanagementview-r1f768dc5d710e915-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <CardContent className="p-6" data-api-unique-id="ordermanagementview-rfe1440c2f31f8753-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <form className="flex flex-wrap items-end gap-4" data-api-unique-id="ordermanagementview-r532206465c35d31c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <div className="w-full min-w-0 flex-1 sm:min-w-[240px]" data-api-unique-id="ordermanagementview-r1e6b9b8dbfaf7b5d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-r6e126d0f501a5a77-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">全局搜索</Label>
                  <Input className="h-10" value={state.filterForm.keyword || ''} onChange={e => handlers.handleFilterChange('keyword', e.target.value)} placeholder="订单号 / 客户 / 邮箱" data-api-unique-id="ordermanagementview-r3db9b9a68ccec56f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </div>
                <div className="w-full sm:w-[180px]" data-api-unique-id="ordermanagementview-rb7f771e4d093a20d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-rc55fd4a0365d0cb2-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">国家/地区</Label>
                  <Input className="h-10" value={state.filterForm.countryName || ''} onChange={e => handlers.handleFilterChange('countryName', e.target.value)} placeholder="例如: US" data-api-unique-id="ordermanagementview-rb3070d39d9bf3a2d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </div>
                <div className="w-full sm:w-[180px]" data-api-unique-id="ordermanagementview-r212180d99aa8d3a7-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-rc9fa4e3f8dcb0b0f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">下单时间 (起)</Label>
                  <Input type="date" className="h-10" value={state.filterForm.startDate || ''} onChange={e => handlers.handleFilterChange('startDate', e.target.value)} data-api-unique-id="ordermanagementview-r636320b2c3cf9ddd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </div>
                <div className="w-full sm:w-[180px]" data-api-unique-id="ordermanagementview-r77cefabd2cb519cd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-r925100bed0bec2d0-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">下单时间 (止)</Label>
                  <Input type="date" className="h-10" value={state.filterForm.endDate || ''} onChange={e => handlers.handleFilterChange('endDate', e.target.value)} data-api-unique-id="ordermanagementview-r5db82181cceaebcb-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </div>
                <div className="flex gap-2" data-api-unique-id="ordermanagementview-r1426fae47fc40ca9-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Button className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlers.handleSearchClick} data-api-unique-id="ordermanagementview-rb4a6f19b5852f37c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    <Search className="h-4 w-4 mr-2" data-api-unique-id="ordermanagementview-r41eb3b81c672a07c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 筛选
                  </Button>
                  <Button variant="outline" className="h-10 px-6" onClick={handlers.handleClearFilter} data-api-unique-id="ordermanagementview-r6c9728a2464ce5aa-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    重置
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. 订单数据列表 Section */}
      <section data-controller-name="订单数据列表" className="w-full" data-api-unique-id="ordermanagementview-r59fb865c02138ac6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
        <div className="w-full max-w-none px-4 xl:px-6 pb-12" data-api-unique-id="ordermanagementview-rf716b4765ff61c1f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
          <Card className="shadow-sm border-slate-200 overflow-hidden" data-api-unique-id="ordermanagementview-rb70c09c00d88ed41-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <div className="flex flex-col items-stretch justify-between gap-3 border-b bg-white px-4 py-4 sm:flex-row sm:items-center sm:px-6">
              <div className="text-sm font-medium text-muted-foreground">
                {state.filterForm.status === 'PAID'
                  ? '已支付包含处理中、已发货、已完成 · 按线下单时间排序'
                  : '按线下单时间排序 · 可用上方状态 Tab 快速筛选'}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={state.exportLoading || state.listLoading || state.list.length === 0}
                onClick={() => handlers.handleExportExcel()}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {state.exportLoading ? '导出中…' : '导出 Excel'}
              </Button>
            </div>
            <CardContent className="p-0" data-api-unique-id="ordermanagementview-r1da7689958c38b10-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <div className="overflow-x-auto" data-api-unique-id="ordermanagementview-r2d67d5ce48ac7d5a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <Table className="min-w-[960px]" data-api-unique-id="ordermanagementview-r90a9eeedb50f830d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <TableHeader className="bg-slate-50/80" data-api-unique-id="ordermanagementview-rb0510531d2e123f5-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    <TableRow data-api-unique-id="ordermanagementview-r2829fce95c941439-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                      <TableHead className="font-bold min-w-[140px] py-4 pl-6">下单时间</TableHead>
                      <TableHead className="w-[150px] font-bold">订单编号</TableHead>
                      <TableHead className="font-bold min-w-[160px]">客户Email</TableHead>
                      <TableHead className="font-bold min-w-[110px]">客户名称</TableHead>
                      <TableHead className="font-bold min-w-[120px]">订单状态</TableHead>
                      <TableHead className="font-bold min-w-[150px]">入库</TableHead>
                      <TableHead className="font-bold min-w-[120px]">WhatsApp</TableHead>
                      <TableHead className="font-bold min-w-[100px]">金额</TableHead>
                      <TableHead className="font-bold min-w-[90px]">总重量(g)</TableHead>
                      <TableHead className="font-bold min-w-[220px]">订单备注</TableHead>
                      <TableHead className="text-right font-bold pr-6 min-w-[140px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-api-unique-id="ordermanagementview-r64976b895e3cee0a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    {state.listLoading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">数据同步中...</TableCell>
                      </TableRow>
                    ) : state.list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">无符合条件的订单记录</TableCell>
                      </TableRow>
                    ) : (
                      state.list.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors align-top">
                          <TableCell className="pl-6 pt-4 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(row.createdAt).toLocaleString('zh-CN', { hour12: false })}
                          </TableCell>
                          <TableCell className="font-mono text-sm pt-4" scrollX scrollXClassName="max-w-[220px]">
                            {row.orderNo}
                          </TableCell>
                          <TableCell className="pt-4" scrollX scrollXClassName="max-w-[260px]">
                            {contactEdit?.id === row.id && contactEdit.field === 'email' ? (
                              <input
                                autoFocus
                                aria-label="客户邮箱"
                                className="h-9 w-full min-w-[160px] rounded-md border border-slate-200 px-2 text-sm"
                                value={contactDraft}
                                onChange={(event) => setContactDraft(event.target.value)}
                                onBlur={() => { void saveCustomerContact(row, 'email'); }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLInputElement).blur(); }
                                  if (event.key === 'Escape') setContactEdit(null);
                                }}
                              />
                            ) : (
                              <button
                                type="button"
                                className="text-left text-sm text-primary hover:underline break-all"
                                title="双击添加邮箱"
                                onClick={() => { if (visibleCustomerEmail(row.customerEmail)) handlers.jumpToCustomer(row.customerEmail); }}
                                onDoubleClick={() => { setContactDraft(visibleCustomerEmail(row.customerEmail)); setContactEdit({ id: row.id, field: 'email' }); }}
                              >
                                {visibleCustomerEmail(row.customerEmail) || '—'}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="pt-4 text-sm font-medium">
                            {contactEdit?.id === row.id && contactEdit.field === 'name' ? (
                              <input
                                autoFocus
                                aria-label="客户名称"
                                className="h-9 w-full min-w-[96px] rounded-md border border-slate-200 px-2 text-sm font-medium"
                                value={contactDraft}
                                onChange={(event) => setContactDraft(event.target.value)}
                                onBlur={() => { void saveCustomerContact(row, 'name'); }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLInputElement).blur(); }
                                  if (event.key === 'Escape') setContactEdit(null);
                                }}
                              />
                            ) : (
                              <button type="button" className="text-left text-sm font-medium" title="双击修改姓名" onDoubleClick={() => { setContactDraft(row.customerName || ''); setContactEdit({ id: row.id, field: 'name' }); }}>
                                {row.customerName || '—'}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="pt-4">
                            <Select
                              value={LIST_STATUS_VALUES.has(row.status) ? row.status : row.status}
                              onValueChange={(val) => handlers.handleQuickStatusChange(row.id, val as OrderStatus)}
                            >
                              <SelectTrigger className={cn('h-9 w-[118px] border text-sm font-semibold', getListStatusClassName(row.status))}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {!LIST_STATUS_VALUES.has(row.status) && (
                                  <SelectItem value={row.status}>{ORDER_STATUS_LABELS[row.status]}</SelectItem>
                                )}
                                {LIST_STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-xs font-semibold', opt.className)}>
                                      {opt.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="pt-4">
                            <div className="flex flex-col items-start gap-2">
                              <Badge className={cn('border font-semibold hover:bg-inherit', INBOUND_BADGE[row.inboundState] || INBOUND_BADGE.NONE)}>
                                {inboundBadgeLabel(row.inboundState, row.inboundReceivedQty, row.inboundOrderedQty, row.inboundLines)}
                              </Badge>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => handlers.openInboundDialog(row.id)}
                              >
                                登记入库
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="pt-4 text-sm text-muted-foreground">
                            {contactEdit?.id === row.id && contactEdit.field === 'phone' ? (
                              <input
                                autoFocus
                                aria-label="手机号"
                                className="h-9 w-full min-w-[108px] rounded-md border border-slate-200 px-2 text-sm"
                                value={contactDraft}
                                onChange={(event) => setContactDraft(event.target.value)}
                                onBlur={() => { void saveCustomerContact(row, 'phone'); }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLInputElement).blur(); }
                                  if (event.key === 'Escape') setContactEdit(null);
                                }}
                              />
                            ) : (
                              <button type="button" className="text-left text-sm text-muted-foreground" title="双击修改手机号" onDoubleClick={() => { setContactDraft(row.customerWhatsapp || ''); setContactEdit({ id: row.id, field: 'phone' }); }}>
                                {row.customerWhatsapp || '—'}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="pt-4">
                            <div className="text-sm font-bold whitespace-nowrap">
                              {row.currencyCode} {Number(row.totalAmount).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="pt-4 text-sm tabular-nums">
                            {Number(row.totalWeightGrams || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="pt-3 pb-3">
                            <div className="flex items-start gap-2 min-w-[200px]">
                              <Textarea
                                className="min-h-[64px] text-sm resize-none"
                                rows={2}
                                placeholder="内部备注…"
                                value={state.remarkDrafts[row.id] ?? row.internalNote ?? ''}
                                onChange={(e) => handlers.handleRemarkDraftChange(row.id, e.target.value)}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="shrink-0 h-9"
                                disabled={state.remarkSavingId === row.id}
                                onClick={() => handlers.submitOrderRemark(row.id)}
                              >
                                {state.remarkSavingId === row.id ? '…' : '更新备注'}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6 pt-4">
                            <div className="flex flex-col items-end gap-2">
                              <button
                                type="button"
                                className="text-sm text-primary font-medium hover:underline"
                                onClick={() => OrderManagement.navigateToWithParams(router, {
                                  status: '',
                                  orderId: row.id,
                                })}
                              >
                                详情
                              </button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8"
                                disabled={state.exportLoading}
                                onClick={() => handlers.handleExportExcel([row.id])}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                {state.exportLoading ? '导出中…' : '下载'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="px-6 py-4 border-t flex items-center justify-between bg-slate-50/50" data-api-unique-id="ordermanagementview-r36093976cfd17298-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <div className="text-sm text-muted-foreground font-medium" data-api-unique-id="ordermanagementview-r6a93186f997e4af6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                共计 <span className="text-foreground" data-api-unique-id="ordermanagementview-rac1153f34130027e-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">{state.total}</span> 条订单
              </div>
              <div className="flex items-center gap-4" data-api-unique-id="ordermanagementview-r69fa0482828ca390-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">每页</span>
                  <Select
                    value={String(state.filterForm.pageSize || 50)}
                    onValueChange={(val) => handlers.handlePageSizeChange(Number(val))}
                  >
                    <SelectTrigger className="h-9 w-[120px] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50条/页</SelectItem>
                      <SelectItem value="100">100条/页</SelectItem>
                      <SelectItem value="200">200条/页</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" disabled={state.filterForm.page === 1} onClick={() => handlers.handlePageChange((state.filterForm.page || 1) - 1)} data-api-unique-id="ordermanagementview-r061eaf706e60e4ec-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <ChevronLeft className="h-4 w-4 mr-1" data-api-unique-id="ordermanagementview-r5056661d6b689924-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 上一页
                </Button>
                <div className="text-sm font-bold" data-api-unique-id="ordermanagementview-r0d8fb8192cc5a593-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  第 {state.filterForm.page} 页
                </div>
                <Button variant="outline" size="sm" disabled={(state.filterForm.page || 1) * (state.filterForm.pageSize || 50) >= state.total} onClick={() => handlers.handlePageChange((state.filterForm.page || 1) + 1)} data-api-unique-id="ordermanagementview-r26cc06dee6711ac5-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  下一页 <ChevronRight className="h-4 w-4 ml-1" data-api-unique-id="ordermanagementview-r4131e6d08b56d213-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 4. 详情抽屉 (Sheet) */}
      <Sheet open={!!state.queryOrderId} onOpenChange={open => !open && handlers.handleCloseDetail()} data-api-unique-id="ordermanagementview-r7fc92f13cbd2a903-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
        <SheetContent className="sm:max-w-[800px] p-0 border-l-0" data-api-unique-id="ordermanagementview-r7b035a8f83dbb2dd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
          {state.detailLoading ? <div className="h-full flex items-center justify-center bg-slate-50" data-api-unique-id="ordermanagementview-r02bf55b3c17e722b-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <div className="flex flex-col items-center gap-2" data-api-unique-id="ordermanagementview-rdeba2f4deca554e7-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <RefreshCcw className="h-8 w-8 text-primary animate-spin" data-api-unique-id="ordermanagementview-rd0e13936f268db51-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                <span className="text-sm font-medium text-slate-500" data-api-unique-id="ordermanagementview-rea835441a31d11c4-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">正在加载订单深度数据...</span>
              </div>
            </div> : state.detailData ? <div className="h-full flex flex-col bg-slate-50" data-api-unique-id="ordermanagementview-r63d3cb5b12720db2-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <SheetHeader className="px-6 py-5 bg-white border-b shadow-sm sticky top-0 z-10 flex-row justify-between items-center space-y-0" data-api-unique-id="ordermanagementview-r9e4be1157eaf3481-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <div className="flex flex-col" data-api-unique-id="ordermanagementview-r4f03d6e45d2ccf3a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <div className="flex items-center gap-3" data-api-unique-id="ordermanagementview-rcd636344df87dfed-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    <SheetTitle className="text-xl font-bold font-header" data-api-unique-id="ordermanagementview-rf1f0d27d35d94db6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">订单 #{state.detailData.orderNo}</SheetTitle>
                    <Badge className={`${ORDER_STATUS_VARIANTS[state.detailData.status]}`} data-api-unique-id="ordermanagementview-rea253c8a8c1dbcbb-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                      {ORDER_STATUS_LABELS[state.detailData.status]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1" data-api-unique-id="ordermanagementview-r43e5d6ea68226b4a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    下单于: {new Date(state.detailData.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2" data-api-unique-id="ordermanagementview-r78ff72250a6be912-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Button variant="outline" size="sm" onClick={() => window.print()} data-api-unique-id="ordermanagementview-r53452388ad687365-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    打印清单
                  </Button>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1" data-api-unique-id="ordermanagementview-r1e45fb715eaeae75-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <div className="p-6 space-y-6" data-api-unique-id="ordermanagementview-rc8ee5dd45cf7e44b-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  {/* 双列布局：商品明细 & 客户发货 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-api-unique-id="ordermanagementview-rdf8821c75cacf3f6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    {/* 左列: 业务与财务数据 */}
                    <div className="space-y-6" data-api-unique-id="ordermanagementview-rfb6c357a7a1dae02-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                      <Card className="border-slate-200" data-api-unique-id="ordermanagementview-re86740ffa41e68b2-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                        <CardHeader className="pb-3 border-b" data-api-unique-id="ordermanagementview-r4b8fe7b02b669cc1-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <CardTitle className="text-sm font-bold flex items-center justify-between gap-3" data-api-unique-id="ordermanagementview-r186eb335dfc424cd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <span className="flex items-center">
                              <Package className="h-4 w-4 mr-2 text-primary" data-api-unique-id="ordermanagementview-rbb0a2b27610d3774-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> SKU 商品明细
                            </span>
                            <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => handlers.openInboundDialog(state.detailData.id)}>
                              登记入库
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0" data-api-unique-id="ordermanagementview-rfb0a6d9007c97a49-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <div className="divide-y">
                            {[...state.detailData.items].sort(compareInboundRows).map((sku) => {
                              const qty = Math.max(0, Number(sku.quantity) || 0)
                              return (
                                <div key={sku.id} className="flex items-start gap-3 px-4 py-4">
                                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded border bg-slate-50">
                                    {sku.mainImageUrl ? (
                                      <EditableImg
                                        propKey={`sku-${sku.id}`}
                                        keywords={sku.mainImageUrl}
                                        description={sku.productName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : null}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold leading-5 break-words whitespace-normal">
                                      {sku.productName}
                                    </div>
                                    <div className="mt-0.5 break-all font-mono text-[10px] text-muted-foreground">
                                      SKU: {sku.skuCode}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      {state.detailData.inboundLines.find((line) => line.id === sku.id)?.outOfStock
                                        ? '缺货'
                                        : `入库 ${Math.max(0, Number(sku.inboundQty) || 0)}/${qty}`}
                                      {sku.inboundNote ? ` · ${sku.inboundNote}` : ''}
                                    </div>
                                  </div>
                                  <div className="w-[7.5rem] shrink-0 text-right">
                                    <div className="text-sm font-bold tabular-nums">× {qty}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      单价 {state.detailData?.currencyCode} {sku.unitPrice}
                                    </div>
                                    <div className="text-sm font-bold">
                                      {state.detailData?.currencyCode} {sku.lineAmount}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div className="p-4 bg-slate-50/50 space-y-2 border-t text-sm" data-api-unique-id="ordermanagementview-rae190e488686cab2-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <div className="flex justify-between text-muted-foreground">
                              <span>件数合计</span>
                              <span className="font-medium text-foreground">
                                {state.detailData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} 件
                              </span>
                            </div>
                            <div className="flex justify-between text-muted-foreground" data-api-unique-id="ordermanagementview-r3d93493188a704cd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                              <span data-api-unique-id="ordermanagementview-r1f2d872bb16f0f83-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">商品小计</span>
                              <span data-api-unique-id="ordermanagementview-rb7aaa7a20d6669b0-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">{state.detailData.subtotalAmount}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground" data-api-unique-id="ordermanagementview-r191ccc338c1d90f3-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                              <span data-api-unique-id="ordermanagementview-r93d6f65342caa8da-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">物流运费</span>
                              <span data-api-unique-id="ordermanagementview-rec11b00944e40988-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">+ {state.detailData.shippingAmount}</span>
                            </div>
                            <div className="flex justify-between text-destructive" data-api-unique-id="ordermanagementview-r6b008c3ec2816fa8-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                              <span data-api-unique-id="ordermanagementview-r81b5f3eb9a7e303d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">折扣优惠</span>
                              <span data-api-unique-id="ordermanagementview-rb8c55ee3ced92837-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">- {state.detailData.discountAmount}</span>
                            </div>
                            <Separator className="my-2" data-api-unique-id="ordermanagementview-r5b0e019e06d04eac-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                            <div className="flex justify-between font-bold text-base" data-api-unique-id="ordermanagementview-re1913cd2553b066d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                              <span data-api-unique-id="ordermanagementview-rbf899267a5db7398-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">最终实付</span>
                              <span className="text-primary" data-api-unique-id="ordermanagementview-r1e20fdf46b6bdfa4-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">{state.detailData.currencyCode} {state.detailData.totalAmount}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 右列: 客户与发货处理 */}
                    <div className="space-y-6" data-api-unique-id="ordermanagementview-r5c523ab6b1113a52-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                      <Card className="border-slate-200" data-api-unique-id="ordermanagementview-r9d3a53f8db2d5334-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                        <CardHeader className="pb-3 border-b" data-api-unique-id="ordermanagementview-r379de2d241fbc8fa-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <CardTitle className="text-sm font-bold flex items-center" data-api-unique-id="ordermanagementview-rcdf2c7c6ec25b9f4-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <User className="h-4 w-4 mr-2 text-primary" data-api-unique-id="ordermanagementview-rc82d9234feb78f09-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 收货人与地址
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4" data-api-unique-id="ordermanagementview-rb72c72f67ba6e32b-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          {state.detailData.address ? <div className="text-sm space-y-2" data-api-unique-id="ordermanagementview-r9af395ac39ae620e-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                              <div className="font-bold flex items-center justify-between" data-api-unique-id="ordermanagementview-ra8d87e9b0d313e6e-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                                {state.detailData.address.recipientName}
                                <span className="text-muted-foreground font-normal" data-api-unique-id="ordermanagementview-r424084486a2db0b0-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">{state.detailData.address.phone}</span>
                              </div>
                              <div className="text-muted-foreground leading-relaxed" data-api-unique-id="ordermanagementview-r203881b409d59886-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                                {state.detailData.address.addressLine1} {state.detailData.address.addressLine2}<br data-api-unique-id="ordermanagementview-ra796fb0d9d9f3c90-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                                {state.detailData.address.cityName}, {state.detailData.address.stateName}, {state.detailData.address.countryName}
                              </div>
                            </div> : <div className="text-sm text-muted-foreground italic" data-api-unique-id="ordermanagementview-r2e56e6804fb6db95-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">无详细收货地址</div>}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 shadow-sm border-l-4 border-l-primary" data-api-unique-id="ordermanagementview-rcce1d52177f1d467-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                        <CardHeader className="pb-3 border-b" data-api-unique-id="ordermanagementview-r384668b41421e34a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <CardTitle className="text-sm font-bold flex items-center" data-api-unique-id="ordermanagementview-rf70fd1c6e5570b15-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <Truck className="h-4 w-4 mr-2 text-primary" data-api-unique-id="ordermanagementview-r5572ba2285328e3a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 履约工作台
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4" data-api-unique-id="ordermanagementview-r04a231b59c2ca315-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <div className="grid grid-cols-2 gap-3" data-api-unique-id="ordermanagementview-r2aa2702d922b55a6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <div data-api-unique-id="ordermanagementview-r7fb388a817e78e8a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                              <Label className="text-[10px] uppercase font-bold text-slate-400" data-api-unique-id="ordermanagementview-rd488ffcbfca2fc7c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">物流渠道</Label>
                              <Input className="h-9 text-sm mt-1" value={state.shipForm.trackingCarrier} onChange={e => handlers.handleShipFormChange('trackingCarrier', e.target.value)} data-api-unique-id="ordermanagementview-r393b4f1fe04cfdbe-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                            </div>
                            <div data-api-unique-id="ordermanagementview-r1f919b22c6ce16fc-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                              <Label className="text-[10px] uppercase font-bold text-slate-400" data-api-unique-id="ordermanagementview-r5675e87b763899bb-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">物流单号</Label>
                              <Input className="h-9 text-sm mt-1" value={state.shipForm.trackingNumber} onChange={e => handlers.handleShipFormChange('trackingNumber', e.target.value)} data-api-unique-id="ordermanagementview-r5a6367cd415a95a1-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                            </div>
                          </div>
                          <div data-api-unique-id="ordermanagementview-rd94542defd18f0d6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <Label className="text-[10px] uppercase font-bold text-slate-400" data-api-unique-id="ordermanagementview-r02dc140fd4139992-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">发货/同步时间</Label>
                            <Input type="datetime-local" className="h-9 text-sm mt-1" value={state.shipForm.shippedAt} onChange={e => handlers.handleShipFormChange('shippedAt', e.target.value)} data-api-unique-id="ordermanagementview-ra1e40d458b51373f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                          </div>
                          <div data-api-unique-id="ordermanagementview-r980ba608d0628fa0-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <Label className="text-[10px] uppercase font-bold text-slate-400" data-api-unique-id="ordermanagementview-rcab9b0a5699889bb-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">内部备注</Label>
                            <Textarea className="mt-1 text-sm resize-none" rows={2} placeholder="仅供后台人员查看..." value={state.shipForm.internalNote || ''} onChange={e => handlers.handleShipFormChange('internalNote', e.target.value)} data-api-unique-id="ordermanagementview-rc58f4d1f5151cac0-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                          </div>
                          <Button className="w-full bg-slate-900 text-white" onClick={handlers.submitShipOrder} disabled={state.detailData.status === 'CANCELLED' || state.detailData.status === 'REFUNDED'} data-api-unique-id="ordermanagementview-r34709b43445ceca5-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            更新物流/标记发货
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* 底部通栏: 扩展追踪与操作日志 */}
                  <div className="space-y-6" data-api-unique-id="ordermanagementview-r0701ba910fdf29d1-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    <Card className="border-slate-200" data-api-unique-id="ordermanagementview-r2674da41cd03a627-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between" data-api-unique-id="ordermanagementview-r83ee5fded3262485-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                        <CardTitle className="text-sm font-bold flex items-center" data-api-unique-id="ordermanagementview-rc370a7b0778f5093-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <Globe className="h-4 w-4 mr-2 text-primary" data-api-unique-id="ordermanagementview-r61521d24e6056de2-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 全程物流追踪
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handlers.openLogisticsDialog(state.detailData!.id)} data-api-unique-id="ordermanagementview-rffb322c5dc479f76-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <Plus className="h-3 w-3 mr-1" data-api-unique-id="ordermanagementview-ra7c36f78ed625185-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 添加物流段
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0" data-api-unique-id="ordermanagementview-r216f640bb568c0f5-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                        {state.detailData.logistics.length > 0 ? <div className="p-4 space-y-4" data-api-unique-id="ordermanagementview-r500c341543bda292-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            {state.detailData.logistics.map((log, index) => <div key={log.id} className="flex gap-4 relative" data-api-unique-id="ordermanagementview-r4e1022568ce430ad-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                {index !== state.detailData!.logistics.length - 1 && <div className="absolute left-[15px] top-8 bottom-[-16px] w-[1px] bg-slate-200" data-api-unique-id="ordermanagementview-r0d91fabdc5165098-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1" />}
                                <div className="z-10 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-slate-500" data-api-unique-id="ordermanagementview-rf1d30c25cbf10cfe-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                  <Truck className="h-4 w-4" data-api-unique-id="ordermanagementview-r2a5a2d3e77d93c22-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1" />
                                </div>
                                <div className="flex-1 pb-4" data-api-unique-id="ordermanagementview-rd4933a072654ebf5-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                  <div className="flex items-center gap-2" data-api-unique-id="ordermanagementview-ra042804c9f989717-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                    <span className="text-sm font-bold" data-api-unique-id="ordermanagementview-r4845ffd6772b4a97-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">{log.segmentType}</span>
                                    <Badge variant="outline" className="text-[10px] uppercase" data-api-unique-id="ordermanagementview-r8503948bfb44b9b9-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">{log.statusLabel}</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1" data-api-unique-id="ordermanagementview-r44f680e8475362e9-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                    {log.carrierName} - <span className="font-mono" data-api-unique-id="ordermanagementview-r347f017c53798da8-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">{log.trackingNumber}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-1 uppercase" data-api-unique-id="ordermanagementview-rda7c9d1c125cb4a9-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                    录入: {new Date(log.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>)}
                          </div> : <div className="p-8 text-center text-sm text-muted-foreground italic" data-api-unique-id="ordermanagementview-rf11be9363a9d3118-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            暂无分段物流流转记录
                          </div>}
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200" data-api-unique-id="ordermanagementview-r23c2aeefbffa6047-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                      <CardHeader className="pb-3 border-b" data-api-unique-id="ordermanagementview-r8c38d3a3f2d123d6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                        <CardTitle className="text-sm font-bold flex items-center" data-api-unique-id="ordermanagementview-r9aa544cdc5d9f1b4-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <History className="h-4 w-4 mr-2 text-primary" data-api-unique-id="ordermanagementview-r7bf1eb03d3757377-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 操作日志与状态变更
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4" data-api-unique-id="ordermanagementview-rfc24c0fe20e31b98-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                        <div className="space-y-4" data-api-unique-id="ordermanagementview-rb702e95ab97ac1ec-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          {state.detailData.logs.map((op, index) => <div key={op.id} className="flex gap-4 items-start border-l-2 border-slate-100 pl-4 relative" data-api-unique-id="ordermanagementview-rdb3e1709d636d4f6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                              <div className="flex-1" data-api-unique-id="ordermanagementview-r5a1a2b239795ee3c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                <div className="flex items-center gap-2" data-api-unique-id="ordermanagementview-r3a67e11876f71124-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                  <span className="text-sm font-bold" data-api-unique-id="ordermanagementview-r9553af7b7860cf59-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">{op.operatorName}</span>
                                  <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-600" data-api-unique-id="ordermanagementview-rb2edefffe17109e6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">{op.actionType}</span>
                                </div>
                                {op.actionNote && <div className="text-xs text-muted-foreground mt-1 italic" data-api-unique-id="ordermanagementview-rac29bd646837ee5a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">"{op.actionNote}"</div>}
                                <div className="text-[10px] text-slate-400 mt-1" data-api-unique-id="ordermanagementview-r27b31a936efd3236-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">{new Date(op.createdAt).toLocaleString()}</div>
                              </div>
                            </div>)}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50 border-t p-4 flex justify-end" data-api-unique-id="ordermanagementview-r09aacc2627edb4a4-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                        <Button variant="destructive" size="sm" className="text-xs" onClick={() => handlers.openStatusDialog(state.detailData!.id, state.detailData!.status)} data-api-unique-id="ordermanagementview-rae70eea080274f25-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          订单人工干预 (取消/退款)
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </div> : <div className="p-12 text-center text-muted-foreground" data-api-unique-id="ordermanagementview-rd6a45afa905c1229-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">订单详情不存在或已被移除</div>}
        </SheetContent>
      </Sheet>

      {/* 5. 状态变更弹窗 */}
      <Dialog open={state.isStatusDialogOpen} onOpenChange={handlers.setIsStatusDialogOpen} data-api-unique-id="ordermanagementview-r0c1e9a279ca76534-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
        <DialogContent className="sm:max-w-[400px]" data-api-unique-id="ordermanagementview-r91d8025af6152dd0-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
          <DialogHeader data-api-unique-id="ordermanagementview-r5b294170b3268d67-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <DialogTitle className="flex items-center" data-api-unique-id="ordermanagementview-ra646d14b37de2502-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Info className="h-5 w-5 mr-2 text-destructive" data-api-unique-id="ordermanagementview-rd908c2daaf52fed7-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> 订单状态强制干预
            </DialogTitle>
            <DialogDescription data-api-unique-id="ordermanagementview-rfc6d18e2c6bd3098-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              此操作将直接绕过系统流转修改订单状态，请务必详细说明理由。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2" data-api-unique-id="ordermanagementview-rb4777c591bb7bae9-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <div data-api-unique-id="ordermanagementview-rbc430563a3891141-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-rb4343598a421c326-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">目标新状态</Label>
              <Select value={state.statusForm.newStatus} onValueChange={(val: OrderStatus) => handlers.setStatusForm(p => ({
              ...p,
              newStatus: val
            }))} data-api-unique-id="ordermanagementview-r16dc11c30a29b988-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <SelectTrigger className="h-10" data-api-unique-id="ordermanagementview-r9886e1705af1c366-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <SelectValue placeholder="选择新状态" data-api-unique-id="ordermanagementview-r4bbac239bfc7aeea-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </SelectTrigger>
                <SelectContent data-api-unique-id="ordermanagementview-r8978814a12dc844e-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  {Object.entries(ORDER_STATUS_LABELS).map(([k, v], index) => <SelectItem key={k} value={k} data-api-unique-id="ordermanagementview-raa26302dfdd8b6c3-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                      {v}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div data-api-unique-id="ordermanagementview-r96c20c80fb1b4dea-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-r946866cf1e7e3a72-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">操作说明 (必填)</Label>
              <Textarea placeholder="例如: 客户线下支付、由于缺货取消订单等..." className="resize-none" rows={4} value={state.statusForm.actionNote} onChange={e => handlers.setStatusForm(p => ({
              ...p,
              actionNote: e.target.value
            }))} data-api-unique-id="ordermanagementview-r514245a838b7a012-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
            </div>
          </div>
          <DialogFooter data-api-unique-id="ordermanagementview-r1e4633855f1001f1-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <Button variant="outline" onClick={() => handlers.setIsStatusDialogOpen(false)} data-api-unique-id="ordermanagementview-ra952439850899b76-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">取消</Button>
            <Button className="bg-destructive text-destructive-foreground" onClick={handlers.submitStatusChange} data-api-unique-id="ordermanagementview-r37ebb90fc7f5814d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">确认执行修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. 添加多段物流弹窗 */}
      <Dialog open={state.isLogisticsDialogOpen} onOpenChange={handlers.setIsLogisticsDialogOpen} data-api-unique-id="ordermanagementview-r6c17dd51006dfbf1-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
        <DialogContent className="sm:max-w-[500px]" data-api-unique-id="ordermanagementview-r6f9ddf5e01f2205d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
          <DialogHeader data-api-unique-id="ordermanagementview-r294ce5d37bd9a1cd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <DialogTitle data-api-unique-id="ordermanagementview-re03f5a6e0732bdba-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">添加物流段记录</DialogTitle>
            <DialogDescription data-api-unique-id="ordermanagementview-r0597374cbf95b8f5-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">记录跨境物流中的各个关键节点（如：海关清关、港口到港等）。</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2" data-api-unique-id="ordermanagementview-rf14bd41a992c07fe-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <div className="col-span-2" data-api-unique-id="ordermanagementview-r2909d128ab6de6dc-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-rd4c77aaf5f1e3b13-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">物流段名称</Label>
              <Input placeholder="如: 国内段、清关段、最后一公里" value={state.logisticsForm.segmentType} onChange={e => handlers.setLogisticsForm(p => ({
              ...p,
              segmentType: e.target.value
            }))} data-api-unique-id="ordermanagementview-r6fc3426fa00410be-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
            </div>
            <div data-api-unique-id="ordermanagementview-r15fc0f8d0a8c1429-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-r98497906c222470d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">承运商名称</Label>
              <Input value={state.logisticsForm.carrierName || ''} onChange={e => handlers.setLogisticsForm(p => ({
              ...p,
              carrierName: e.target.value
            }))} data-api-unique-id="ordermanagementview-rc5fb42a2161de103-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
            </div>
            <div data-api-unique-id="ordermanagementview-r57be3702588593f0-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-re2343643e9770158-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">物流单号</Label>
              <Input value={state.logisticsForm.trackingNumber || ''} onChange={e => handlers.setLogisticsForm(p => ({
              ...p,
              trackingNumber: e.target.value
            }))} data-api-unique-id="ordermanagementview-r0c70eadfce68f0c9-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
            </div>
            <div data-api-unique-id="ordermanagementview-r80aa8cd6da6b89fd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-r7c285eae799a3649-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">节点状态描述</Label>
              <Input placeholder="如: 已揽收、派送中" value={state.logisticsForm.statusLabel || ''} onChange={e => handlers.setLogisticsForm(p => ({
              ...p,
              statusLabel: e.target.value
            }))} data-api-unique-id="ordermanagementview-rdc917fc8f7933dac-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
            </div>
            <div data-api-unique-id="ordermanagementview-rba54b5d0a35afe2e-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-r8905b62e3bfba224-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">预计送达</Label>
              <Input type="datetime-local" value={state.logisticsForm.estimatedArrivalAt || ''} onChange={e => handlers.setLogisticsForm(p => ({
              ...p,
              estimatedArrivalAt: e.target.value
            }))} data-api-unique-id="ordermanagementview-r67083d77640a3e85-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
            </div>
            <div className="col-span-2" data-api-unique-id="ordermanagementview-r0d334548aa06e0f6-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-r59882055bbc83d37-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">补充备注</Label>
              <Input value={state.logisticsForm.remark || ''} onChange={e => handlers.setLogisticsForm(p => ({
              ...p,
              remark: e.target.value
            }))} data-api-unique-id="ordermanagementview-r4b0d290d6c17ad38-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
            </div>
          </div>
          <DialogFooter data-api-unique-id="ordermanagementview-r65a77c7817043e92-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <Button variant="outline" onClick={() => handlers.setIsLogisticsDialogOpen(false)} data-api-unique-id="ordermanagementview-r32ea96d95e8b0f6b-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">取消</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handlers.submitLogisticsSegment} data-api-unique-id="ordermanagementview-r8fa12eed981af3b3-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">提交节点记录</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!state.inboundOrderId} onOpenChange={(open) => { if (!open) { setInboundZoom(null); setImportOpen(false); handlers.closeInboundDialog() } }}>
        <DialogContent
          className="inset-0 top-0 left-0 block h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-scroll overscroll-contain rounded-none border-0 p-0 shadow-none data-[state=open]:animate-none data-[state=closed]:animate-none"
          onDragOver={(event) => {
            if (![...event.dataTransfer.types].includes('Files')) return
            event.preventDefault()
            setInboundDragOver(true)
          }}
          onDragLeave={() => setInboundDragOver(false)}
          onDrop={(event) => {
            if (![...event.dataTransfer.types].includes('Files')) return
            event.preventDefault()
            setInboundDragOver(false)
            const dropped = [...event.dataTransfer.files];
            const images = dropped.filter((file) => file.type.startsWith('image/'));
            const sheets = dropped.filter((file) => !file.type.startsWith('image/'));
            if (images.length && !sheets.length) void uploadShippingImages(images);
            else void receiveImportFiles(dropped);
          }}
        >
          <DialogHeader ref={inboundTitleRef} className="sticky top-0 z-20 cursor-pointer border-b bg-white px-4 py-4 pr-16 text-left sm:px-6 sm:pr-16" title="点这里回到顶部" onClick={(event) => {
            const target = event.target as HTMLElement
            if (target.closest('button, input, a, select, textarea')) return
            scrollPane(event.currentTarget, 'top')
          }}>
            <button
              type="button"
              aria-label="关闭"
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
              onClick={() => { setInboundZoom(null); setImportOpen(false); handlers.closeInboundDialog(); }}
            >
              <X className="h-5 w-5" />
            </button>
            <DialogTitle className="text-2xl">登记入库</DialogTitle>
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
            <DialogDescription className="text-base">
              {(() => {
                const orderNo = state.list.find((row) => row.id === state.inboundOrderId)?.orderNo
                  || (state.detailData?.id === state.inboundOrderId ? state.detailData.orderNo : '')
                const received = state.inboundDrafts.reduce((sum, line) => sum + (Number(line.inboundQty) || 0), 0)
                const ordered = state.inboundDrafts.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
                return `${orderNo ? `订单 ${orderNo} · ` : ''}按商品填写到货数量。当前 ${received}/${ordered} 件。改完后点这一行的确认；数量 0 在确认前不会记为缺货。`
              })()}
            </DialogDescription>
            <div className="flex shrink-0 items-center justify-end gap-1 pt-0.5">
              <button type="button" aria-label="回到顶部" title="回到顶部" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-900" onClick={(event) => scrollPane(event.currentTarget, 'top')}>
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" aria-label="回到底部" title="回到底部" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-900" onClick={(event) => scrollPane(event.currentTarget, 'bottom')}>
                <ChevronDown className="h-4 w-4" />
              </button>
              {discountEditing ? (
                <input
                  autoFocus
                  inputMode="decimal"
                  aria-label="订单折扣"
                  className="h-9 w-24 rounded-md border border-slate-300 px-2 text-right text-base font-semibold"
                  value={discountDraft}
                  onChange={(event) => setDiscountDraft(event.target.value)}
                  onBlur={() => void saveDiscountPercent()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') { event.preventDefault(); void saveDiscountPercent(); }
                    if (event.key === 'Escape') setDiscountEditing(false);
                  }}
                />
              ) : (
                <span
                  className="inline-flex min-w-16 cursor-text items-center justify-center rounded-md px-2 py-1 text-base font-semibold text-slate-900 hover:bg-slate-100"
                  title="订单折扣，双击后改整单"
                  onDoubleClick={() => { setDiscountDraft(String(discountPercent)); setDiscountEditing(true); }}
                >
                  {discountPercentLabel}
                </span>
              )}
            </div>
            </div>
          </DialogHeader>
          <div className="px-4 py-4 sm:px-6">
            {importOpen ? (
              <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="text-lg font-semibold text-slate-900">导入商品 / 图片</div>
                <p className="mt-1 text-sm text-slate-600">把表格或图片拖到这里。图片可以拖动调整顺序，再按当前商品顺序对应。下面这些都可以不填，直接保存。</p>
                <div
                  className={`mt-3 rounded-md border border-dashed px-4 py-6 text-center text-base ${inboundDragOver ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-300 text-slate-600'}`}
                >
                  拖拽表格或图片到此处
                </div>
                <div className="mt-3 space-y-3">
                  {importRows.map((row, index) => (
                    <div
                      key={row.key}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/import-index', String(index))
                        event.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        if ([...event.dataTransfer.types].includes('Files')) return
                        event.preventDefault()
                        event.stopPropagation()
                        const from = Number(event.dataTransfer.getData('text/import-index'))
                        if (!Number.isInteger(from) || from === index) return
                        setImportRows((prev) => {
                          const next = [...prev]
                          const [moved] = next.splice(from, 1)
                          if (!moved) return prev
                          next.splice(index, 0, moved)
                          return next
                        })
                      }}
                      className="flex cursor-grab flex-wrap items-end gap-2 rounded-md border bg-white p-3"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded border bg-slate-100">
                        {row.imageUrl ? (
                          <img src={row.imageUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">无图</div>
                        )}
                      </div>
                      <label className="grid gap-1 text-sm font-medium text-slate-700">售价<input className="h-9 w-24 rounded-md border px-2 text-sm" value={row.unitPrice} onChange={(event) => patchImportRow(row.key, { unitPrice: event.target.value })} /></label>
                      <label className="grid gap-1 text-sm font-medium text-slate-700">数量<input className="h-9 w-20 rounded-md border px-2 text-sm" value={row.quantity} onChange={(event) => patchImportRow(row.key, { quantity: event.target.value })} /></label>
                      <label className="grid gap-1 text-sm font-medium text-slate-700">总价<input className="h-9 w-24 rounded-md border px-2 text-sm" value={row.lineAmount} onChange={(event) => patchImportRow(row.key, { lineAmount: event.target.value })} /></label>
                      <label className="grid gap-1 text-sm font-medium text-slate-700">成本价<input className="h-9 w-24 rounded-md border px-2 text-sm" value={row.costPrice} onChange={(event) => patchImportRow(row.key, { costPrice: event.target.value })} /></label>
                      <label className="grid min-w-[12rem] flex-1 gap-1 text-sm font-medium text-slate-700">供应商链接<input className="h-9 rounded-md border px-2 text-sm" value={row.supplierUrl} onChange={(event) => patchImportRow(row.key, { supplierUrl: event.target.value })} /></label>
                      <label className="grid min-w-[10rem] flex-1 gap-1 text-sm font-medium text-slate-700">供应商名称<input className="h-9 rounded-md border px-2 text-sm" value={row.supplierName} onChange={(event) => patchImportRow(row.key, { supplierName: event.target.value })} /></label>
                      <label className="grid min-w-[10rem] flex-1 gap-1 text-sm font-medium text-slate-700">备注<input className="h-9 rounded-md border px-2 text-sm" value={row.note} onChange={(event) => patchImportRow(row.key, { note: event.target.value })} /></label>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                  <Button type="button" variant="outline" onClick={() => { setImportOpen(false); setImportRows([]) }}>取消</Button>
                  <Button type="button" onClick={() => void saveImportRows()} disabled={state.inboundSaving}>保存入库</Button>
                </div>
              </div>
            ) : null}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                商品状态
                <select
                  className="h-9 rounded-md border border-transparent px-2 text-sm font-medium"
                  style={stageFilter === 'ALL' ? { background: '#ffffff', color: '#334155' } : inboundStageFill(stageFilter)}
                  aria-label="按商品状态筛选"
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value)}
                >
                  <option value="ALL" style={{ background: '#ffffff', color: '#334155' }}>全部</option>
                  {INBOUND_STAGE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value} style={INBOUND_STAGE_FILL[value]}>{label}</option>
                  ))}
                </select>
              </label>
              <Button type="button" size="sm" variant="outline" className="h-9" onClick={openBatchNote}>添加备注</Button>
              <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => setHiddenColumns({})}>取消隐藏</Button>
              <Button type="button" size="sm" variant="outline" className="h-9 text-red-600" disabled={state.inboundSaving} onClick={() => {
                if (!inboundSelected.length) { toast.error('请先勾选要删除的商品'); return }
                if (!window.confirm(`删除选中的 ${inboundSelected.length} 件商品？`)) return
                void handlers.deleteInboundLines(inboundSelected).then((ok) => { if (ok) setInboundSelectedPersist([]) })
              }}>删除</Button>
            </div>
            {INBOUND_EXPORT_COLUMNS.some(([key]) => hiddenColumns[key]) ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {INBOUND_EXPORT_COLUMNS.filter(([key]) => hiddenColumns[key]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                    onClick={() => showInboundColumn(key)}
                  >
                    {label} 展开
                  </button>
                ))}
              </div>
            ) : null}
            <table className="inbound-checkin w-full max-w-full table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                {visibleInboundColumns.map(([key]) => (
                  <col key={key} style={{ width: `${((INBOUND_COLUMN_PERCENT[key] || 8) / visibleTablePercent) * 100}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr className="text-sm font-semibold text-slate-800">
                  {visibleInboundColumns.map(([key, label]) => (
                    <th key={key} className={`sticky z-10 overflow-hidden border-b bg-slate-50 px-1 py-2 align-middle font-semibold shadow-[0_1px_0_#e2e8f0] ${key === 'product' ? 'text-left' : 'text-center'}`} style={{ top: inboundTitleHeight }}>
                      {key === 'product' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0"
                            aria-label="全选商品"
                            checked={allInboundSelected}
                            onChange={(event) => {
                              const visibleIds = visibleInboundDrafts.map((line) => line.id);
                              setInboundSelectedPersist(event.target.checked
                                ? [...new Set([...inboundSelected, ...visibleIds])]
                                : inboundSelected.filter((id) => !visibleIds.includes(id)));
                            }}
                          />
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              aria-label="导出商品"
                              checked={inboundColumns[key] === true}
                              onChange={(event) => setInboundColumns((prev) => ({ ...prev, [key]: event.target.checked }))}
                            />
                            <span>{label}</span>
                          </label>
                          <button type="button" className="text-[11px] font-normal text-slate-400" aria-label={"隐藏" + label} onClick={() => hideInboundColumn(key)}>隐藏</button>
                        </div>
                      ) : (
                        <div className="inline-flex max-w-full items-center justify-center gap-0.5">
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0"
                            aria-label={"导出" + label}
                            checked={inboundColumns[key] === true}
                            onChange={(event) => setInboundColumns((prev) => ({ ...prev, [key]: event.target.checked }))}
                          />
                          <span className="leading-5">{label}</span>
                          <button type="button" className="shrink-0 text-[11px] font-normal leading-none text-slate-400" aria-label={"隐藏" + label} onClick={() => hideInboundColumn(key)}>隐藏</button>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleInboundDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(visibleInboundColumns.length, 1)} className="px-3 py-10 text-center text-sm text-slate-500">没有这个状态的商品</td>
                  </tr>
                ) : null}
                {visibleInboundDrafts.map((line, lineIndex) => {
                  const imageUrl = line.mainImageUrl || line.shipmentImageUrl
                  return (
                    <tr
                      key={line.id}
                      className="border-b align-top"
                      onDragOver={(event) => {
                        if ([...event.dataTransfer.types].includes('Files')) event.preventDefault()
                      }}
                      onDrop={(event) => {
                        if (![...event.dataTransfer.types].includes('Files')) return
                        event.preventDefault()
                        event.stopPropagation()
                        setInboundDragOver(false)
                        void attachImageToLine(line.id, event.dataTransfer.files)
                      }}
                    >
                      {columnVisible('product') ? (<td className="overflow-hidden px-2 py-3 align-middle">
                        <div className="flex min-w-0 items-center gap-1">
                          <div className="flex w-6 shrink-0 flex-col items-center gap-1">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              aria-label={`选择 ${line.productName}`}
                              checked={inboundSelected.includes(line.id)}
                              onChange={(event) => setInboundSelectedPersist(event.target.checked ? [...inboundSelected, line.id] : inboundSelected.filter((id) => id !== line.id))}
                            />
                            <span className="text-[11px] tabular-nums leading-none text-slate-500">{lineIndex + 1}</span>
                          </div>
                          <button
                            type="button"
                            className="h-14 w-14 shrink-0 overflow-hidden rounded border bg-slate-50 disabled:cursor-default"
                            aria-label={imageUrl ? `查看 ${line.productName}` : undefined}
                            disabled={!imageUrl}
                            onClick={() => {
                              if (!imageUrl) return
                              setInboundZoom({ src: imageUrl, name: line.productName })
                            }}
                          >
                            {imageUrl ? (
                              <EditableImg
                                propKey={`inbound-${line.id}`}
                                keywords={imageUrl}
                                description={line.productName}
                                className="h-full w-full object-cover"
                                proxyWidth={480}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1 / 1' }}
                              />
                            ) : null}
                          </button>
                          <div className="min-w-0 flex-1">
                            {cellEdit?.id === line.id && cellEdit.field === 'title' ? (
                              <input
                                autoFocus
                                aria-label="商品标题"
                                className="h-9 w-full rounded-md border border-slate-600 bg-white px-2 text-sm text-slate-900"
                                defaultValue={line.productName}
                                onBlur={(event) => { const name = event.currentTarget.value.trim(); setCellEdit(null); if (name && name !== line.productName.trim()) void handlers.updateManualOrderLine({ orderItemId: line.id, productName: name }); }}
                                onKeyDown={(event) => { if (imeKey(event)) return; if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } if (event.key === 'Escape') setCellEdit(null); }}
                              />
                            ) : line.productName.trim() ? (
                              <button type="button" className="line-clamp-2 w-full break-words text-left text-sm font-semibold leading-5 text-slate-900 hover:underline" title={line.productName} onClick={() => { window.clearTimeout(titleClickTimer.current); titleClickTimer.current = window.setTimeout(() => { if (!line.productId) return; window.open(`/productdetail/?productId=${encodeURIComponent(line.productId)}`, '_blank', 'noopener'); }, 220); }} onDoubleClick={() => { window.clearTimeout(titleClickTimer.current); setCellDraft(line.productName); setCellEdit({ id: line.id, field: 'title' }); }}>{line.productName}</button>
                            ) : (
                              <button type="button" className="h-9 w-full rounded-md border border-slate-600 bg-white px-2 text-left text-sm text-slate-400" title="双击填写标题" onDoubleClick={() => { setCellDraft(''); setCellEdit({ id: line.id, field: 'title' }); }}>标题</button>
                            )}
                            <div className="mt-1">
                              <span className="inline-flex rounded px-1.5 py-0.5 text-xs font-medium" style={inboundStageFill(line.inboundStage)}>{INBOUND_STAGE_LABEL[normalizedInboundStage(line.inboundStage)] || '待采购'}</span>
                            </div>
                            {String(line.skuCode || '').startsWith('ADD-') ? null : <div className="mt-1 break-all font-mono text-xs text-muted-foreground">SKU: {line.skuCode}</div>}
                            {line.colorLabel ? <div className="mt-0.5 break-words text-xs font-medium text-slate-800">颜色: {line.colorLabel}</div> : null}
                          </div>
                        </div>
                      </td>) : null}
                      {columnVisible('unitPrice') ? (<td className="overflow-hidden px-1 py-3 text-center align-middle">{cellEdit?.id === line.id && cellEdit.field === 'unit' ? <input autoFocus aria-label="售价" inputMode="decimal" className="mx-auto h-9 w-full max-w-[6.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={manualDraftOf(line).unitPrice} onChange={(event) => patchManualDraft(line, { unitPrice: event.target.value })} onBlur={() => { setCellEdit(null); void saveManualDraft(line); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLInputElement).blur(); } if (event.key === 'Escape') setCellEdit(null); }} /> : <button type="button" className="inline-flex h-9 min-w-0 items-center justify-center rounded-md px-2 text-sm tabular-nums text-slate-900 hover:bg-slate-100" title="双击修改售价" onDoubleClick={() => setCellEdit({ id: line.id, field: 'unit' })}>{manualDraftOf(line).unitPrice}</button>}</td>) : null}
                      {columnVisible('priceCoefficient') ? (<td className="overflow-hidden px-1 py-3 text-center align-middle">{cellEdit?.id === line.id && cellEdit.field === 'coeff' ? <input autoFocus aria-label="系数" inputMode="decimal" className="coeff-box mx-auto h-9 w-full max-w-[5.5rem] rounded-md border-2 border-slate-700 bg-white px-2 text-center text-sm font-semibold tabular-nums text-slate-900" value={cellDraft} onChange={(event) => setCellDraft(event.target.value)} onBlur={() => { const text = cellDraft.trim(); const coeff = text === '' ? null : Number(text); setCellEdit(null); if (coeff != null && (!Number.isFinite(coeff) || coeff <= 0)) { toast.error('请填写大于 0 的系数'); return; } const linked = saleFromCost(manualDraftOf(line).costPrice, coeff); void saveManualDraft(line, { ...(linked ? { unitPrice: linked } : {}), priceCoefficient: coeff }); }} onKeyDown={(event) => { if (imeKey(event)) return; if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLInputElement).blur(); } if (event.key === 'Escape') setCellEdit(null); }} /> : <button type="button" className="coeff-box inline-flex h-9 w-full min-w-0 items-center justify-center rounded-md border-2 border-slate-700 bg-white px-2 text-sm font-semibold tabular-nums text-slate-900" title="双击修改系数" onDoubleClick={() => { setCellDraft(line.priceCoefficient == null ? '' : String(line.priceCoefficient)); setCellEdit({ id: line.id, field: 'coeff' }); }}>{line.priceCoefficient == null ? '' : line.priceCoefficient}</button>}</td>) : null}
                      {columnVisible('discountPrice') ? (<td className="overflow-hidden px-1 py-3 text-center align-middle tabular-nums whitespace-nowrap">{cellEdit?.id === line.id && cellEdit.field === 'discount' ? <input autoFocus aria-label="折扣价" inputMode="decimal" className="mx-auto h-9 w-full max-w-[6.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={cellDraft} onChange={(event) => { const text = event.target.value; setCellDraft(text); if (!text.trim()) { patchManualDraft(line, { unitPrice: '' }); return; } const entered = Number(text); if (Number.isFinite(entered) && orderKeepRate > 0) patchManualDraft(line, { unitPrice: String(Math.round((entered / orderKeepRate) * 100) / 100) }); }} onBlur={() => { setCellEdit(null); void saveManualDraft(line); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLInputElement).blur(); } if (event.key === 'Escape') setCellEdit(null); }} /> : <button type="button" className="inline-flex h-9 min-w-0 items-center justify-center rounded-md px-2 text-sm tabular-nums text-slate-900 hover:bg-slate-100" title="双击修改折扣价" onDoubleClick={() => { const current = discountFromSale(manualDraftOf(line).unitPrice); setCellDraft(current == null ? '' : String(current)); setCellEdit({ id: line.id, field: 'discount' }); }}>{(() => { const price = discountFromSale(manualDraftOf(line).unitPrice); return price == null ? '' : formatInboundMoney(price, line.currencyCode); })()}</button>}</td>) : null}
                      {columnVisible('quantity') ? (<td className="overflow-hidden px-1 py-3 text-center align-middle"><input aria-label="数量" inputMode="numeric" className="mx-auto h-9 w-full max-w-[4.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={manualDraftOf(line).quantity} onChange={(event) => patchManualDraft(line, { quantity: event.target.value })} onBlur={() => void saveManualDraft(line)} /></td>) : null}
                      {columnVisible('lineAmount') ? (<td className="overflow-hidden px-1 py-3 text-center align-middle tabular-nums whitespace-nowrap">{(() => { const unit = Number(manualDraftOf(line).unitPrice); const qty = Number(manualDraftOf(line).quantity); return manualDraftOf(line).unitPrice.trim() && manualDraftOf(line).quantity.trim() && Number.isFinite(unit) && Number.isFinite(qty) ? formatInboundMoney(Math.round(unit * qty * 100) / 100, line.currencyCode) : ''; })()}</td>) : null}
                      {columnVisible('costPrice') ? (<td className="overflow-hidden px-1 py-3 text-center align-middle"><input aria-label="成本价" inputMode="decimal" className="mx-auto h-9 w-full max-w-[6.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={manualDraftOf(line).costPrice} onChange={(event) => { const costPrice = event.target.value; const linked = saleFromCost(costPrice, line.priceCoefficient); patchManualDraft(line, linked ? { costPrice, unitPrice: linked } : { costPrice }); }} onBlur={(event) => { const costPrice = event.currentTarget.value; const linked = saleFromCost(costPrice, line.priceCoefficient); void saveManualDraft(line, linked ? { costPrice, unitPrice: linked } : { costPrice }); }} /></td>) : null}
                      {columnVisible('supplier') ? (<td className="overflow-hidden px-1 py-3 align-middle text-center">
                        <input aria-label="供应商" className="mx-auto h-9 w-full rounded-md border px-2 text-center text-sm" value={manualDraftOf(line).supplierName} onChange={(event) => patchManualDraft(line, { supplierName: event.target.value })} onBlur={() => void saveManualDraft(line)} />
                        {line.supplierUrl ? <a href={line.supplierUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-sky-700 underline-offset-2 hover:underline">打开链接</a> : null}
                      </td>) : null}
                      {columnVisible('note') ? (<td className="overflow-hidden px-2 py-3 align-middle">
                        <textarea
                          rows={2}
                          className="box-border h-full min-h-14 w-full resize-none whitespace-pre-wrap break-words rounded-md border border-slate-200 px-2 py-1 text-sm leading-5"
                          placeholder="货位或缺货说明，可不填"
                          aria-label={`${line.productName} 备注`}
                          value={String(line.inboundNote || '').replace(/(?:^|\n)\s*发货时间\s*\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{2}:\d{2})?\s*/g, '\n').replace(/^\n+|\n+$/g, '')}
                          onChange={(e) => handlers.setInboundDraft(line.id, { inboundNote: e.target.value })}
                        />
                      </td>) : null}
                      {columnVisible('stage') ? (<td className="overflow-hidden px-2 py-3 align-middle">
                        <select
                          className="h-10 w-full rounded-md border border-transparent px-2 text-sm font-medium"
                          style={inboundStageFill(line.inboundStage)}
                          aria-label={`${line.productName} 商品状态`}
                          value={normalizedInboundStage(line.inboundStage)}
                          onChange={(e) => handlers.persistInboundLine(line.id, { inboundStage: e.target.value })}
                        >
                          {normalizedInboundStage(line.inboundStage) === 'STOCK' ? <option value="STOCK" style={INBOUND_STAGE_FILL.STOCK}>备货</option> : null}
                          {INBOUND_STAGE_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value} style={INBOUND_STAGE_FILL[value]}>{label}</option>
                          ))}
                        </select>
                      </td>) : null}
                      {columnVisible('inboundQty') ? (<td className="overflow-hidden px-2 py-3 align-middle">
                        <div className="space-y-2">
                          <Input
                            type="number"
                            min={0}
                            max={line.quantity}
                            className="h-10 text-base"
                            aria-label={`${line.productName} 到货数量`}
                            value={String(line.inboundQty)}
                            onChange={(e) => handlers.setInboundDraft(line.id, { inboundQty: Number(e.target.value) })} onBlur={() => handlers.persistInboundLine(line.id, undefined, { quiet: true })}
                          />
                          <Button type="button" variant="outline" size="sm" className="h-8 w-full" onClick={() => handlers.acknowledgeInboundLine(line.id)}>
                            {line.acknowledged ? '已确认' : '确认'}
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="h-8 w-full" onClick={() => handlers.persistInboundLine(line.id, { inboundQty: line.quantity, acknowledged: true, inboundStage: line.quantity > 0 ? 'ARRIVED' : (line.inboundStage || 'PENDING') })}>
                            本行到齐
                          </Button>
                        </div>
                      </td>) : null}
                    </tr>
                  )
                })}

                {addonCards.map((card) => {
                  const addonUnit = Number(card.unitPrice);
                  const addonQty = Number(card.quantity);
                  const addonTotal = card.unitPrice.trim() && card.quantity.trim() && Number.isFinite(addonUnit) && Number.isFinite(addonQty)
                    ? Math.round(addonUnit * addonQty * 100) / 100
                    : null;
                  const addonDiscount = card.unitPrice.trim() && Number.isFinite(addonUnit) ? Math.round(addonUnit * orderKeepRate * 100) / 100 : null;
                  return (
                  <tr key={card.key} className="border-b bg-sky-50/40 align-middle">
                    {columnVisible('product') ? (
                      <td className="overflow-hidden px-2 py-3 align-middle">
                        <div className="flex min-w-0 items-center gap-1">
                          <div className="w-6 shrink-0" />
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded border bg-white">
                            {card.imageUrl ? <img src={card.imageUrl} alt="" className="h-full w-full object-contain" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <input
                              aria-label="商品标题"
                              placeholder="标题"
                              className="h-9 w-full rounded-md border border-slate-600 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400"
                              value={card.productName}
                              onChange={(event) => patchAddonCard(card.key, { productName: event.target.value })}
                            />
                            <div className="mt-1">
                              <span className="inline-flex rounded px-1.5 py-0.5 text-xs font-medium" style={inboundStageFill(card.stage)}>{INBOUND_STAGE_LABEL[normalizedInboundStage(card.stage)] || '待采购'}</span>
                            </div>
                            <div className="mt-1 flex gap-1">
                              <Button type="button" size="sm" className="h-8" disabled={state.inboundSaving} onClick={() => void saveAddonRow(card)}>保存</Button>
                              <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setAddonCards((prev) => prev.filter((item) => item.key !== card.key))}>删除</Button>
                            </div>
                          </div>
                        </div>
                      </td>
                    ) : null}
                    {columnVisible('unitPrice') ? (
                      <td className="overflow-hidden px-1 py-3 text-center align-middle">
                        {cellEdit?.id === card.key && cellEdit.field === 'unit' ? <input autoFocus aria-label="售价" inputMode="decimal" className="mx-auto h-9 w-full max-w-[6.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={card.unitPrice} onChange={(event) => patchAddonCard(card.key, { unitPrice: event.target.value })} onBlur={() => setCellEdit(null)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') setCellEdit(null); }} /> : <button type="button" className="inline-flex h-9 min-w-0 items-center justify-center rounded-md px-2 text-sm tabular-nums hover:bg-slate-100" title="双击修改售价" onDoubleClick={() => setCellEdit({ id: card.key, field: 'unit' })}>{card.unitPrice}</button>}
                      </td>
                    ) : null}
                    {columnVisible('priceCoefficient') ? <td className="overflow-hidden px-1 py-3 text-center align-middle text-sm text-slate-400">—</td> : null}
                    {columnVisible('discountPrice') ? <td className="overflow-hidden px-1 py-3 text-center align-middle tabular-nums">{cellEdit?.id === card.key && cellEdit.field === 'discount' ? <input autoFocus aria-label="折扣价" inputMode="decimal" className="mx-auto h-9 w-full max-w-[6.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={cellDraft} onChange={(event) => { const text = event.target.value; setCellDraft(text); if (!text.trim()) { patchAddonCard(card.key, { unitPrice: '' }); return; } const entered = Number(text); if (Number.isFinite(entered) && orderKeepRate > 0) patchAddonCard(card.key, { unitPrice: String(Math.round((entered / orderKeepRate) * 100) / 100) }); }} onBlur={() => setCellEdit(null)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') setCellEdit(null); }} /> : <button type="button" className="inline-flex h-9 min-w-0 items-center justify-center rounded-md px-2 text-sm tabular-nums hover:bg-slate-100" title="双击修改折扣价" onDoubleClick={() => { setCellDraft(addonDiscount == null ? '' : String(addonDiscount)); setCellEdit({ id: card.key, field: 'discount' }); }}>{addonDiscount == null ? '' : formatInboundMoney(addonDiscount, inboundCurrency)}</button>}</td> : null}
                    {columnVisible('quantity') ? (
                      <td className="overflow-hidden px-1 py-3 text-center align-middle">
                        <input aria-label="数量" inputMode="numeric" className="mx-auto h-9 w-full max-w-[4.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={card.quantity} onChange={(event) => patchAddonCard(card.key, { quantity: event.target.value })} />
                      </td>
                    ) : null}
                    {columnVisible('lineAmount') ? <td className="overflow-hidden px-1 py-3 text-center align-middle tabular-nums">{addonTotal == null ? '' : formatInboundMoney(addonTotal, inboundCurrency)}</td> : null}
                    {columnVisible('costPrice') ? (
                      <td className="overflow-hidden px-1 py-3 text-center align-middle">
                        <input aria-label="成本价" inputMode="decimal" className="mx-auto h-9 w-full max-w-[6.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={card.costPrice} onChange={(event) => patchAddonCard(card.key, { costPrice: event.target.value })} />
                      </td>
                    ) : null}
                    {columnVisible('supplier') ? (
                      <td className="overflow-hidden px-1 py-3 align-middle">
                        <input aria-label="供应商" className="h-9 w-full rounded-md border px-2 text-center text-sm" value={card.supplierName} onChange={(event) => patchAddonCard(card.key, { supplierName: event.target.value })} />
                      </td>
                    ) : null}
                    {columnVisible('note') ? (
                      <td className="overflow-hidden px-1 py-3 align-middle">
                        <textarea rows={2} aria-label="备注" className="w-full resize-none rounded-md border px-2 py-1 text-sm" value={card.note} onChange={(event) => patchAddonCard(card.key, { note: event.target.value })} />
                      </td>
                    ) : null}
                    {columnVisible('stage') ? (
                      <td className="overflow-hidden px-1 py-3 align-middle">
                        <select aria-label="商品状态" className="h-10 w-full rounded-md border border-transparent px-2 text-sm font-medium" style={inboundStageFill(card.stage)} value={card.stage} onChange={(event) => patchAddonCard(card.key, { stage: event.target.value })}>
                          {INBOUND_STAGE_OPTIONS.map(([value, label]) => <option key={value} value={value} style={INBOUND_STAGE_FILL[value]}>{label}</option>)}
                        </select>
                      </td>
                    ) : null}
                    {columnVisible('inboundQty') ? (
                      <td className="overflow-hidden px-1 py-3 align-middle">
                        <input aria-label="到货数量" inputMode="numeric" className="mx-auto h-9 w-full max-w-[4.5rem] rounded-md border px-2 text-center text-sm tabular-nums" value={card.inboundQty} onChange={(event) => patchAddonCard(card.key, { inboundQty: event.target.value })} />
                      </td>
                    ) : null}
                  </tr>
                  );
                })}

</tbody>
            </table>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
                <div>
                  <div className="text-xs font-medium text-slate-500">Original total</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{formatInboundMoney(originalTotal, inboundCurrency)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">In stock total</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{formatInboundMoney(inStockTotal, inboundCurrency)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
                <div>
                  <div className="text-xs font-medium text-slate-500">Discount total</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{formatInboundMoney(costDiscountTotal, inboundCurrency)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">In stock discount total</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{formatInboundMoney(costInStockDiscountTotal, inboundCurrency)}</div>
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                <div className="text-xs font-medium text-slate-500">Quantity</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{orderedPieces}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                <div className="text-xs font-medium text-slate-500">Arrived pieces</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{arrivedPieces}</div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div
                className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center ${addonDrag === 'product' ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-300 bg-white text-slate-700'}`}
                onClick={() => addonProductRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setAddonDrag('product'); }}
                onDragLeave={() => setAddonDrag((current) => current === 'product' ? null : current)}
                onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setAddonDrag(null); void receiveAddonProducts(event.dataTransfer.files); }}
              >
                <div className="text-base font-semibold">传入商品（允许拖拽）</div>
                <div className="mt-1 text-sm text-slate-500">拖入图片后加到最后一行，填写售价、数量、成本价</div>
              </div>
              <div
                className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center ${sheetProgress != null || addonDrag === 'sheet' ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-slate-300 bg-white text-slate-700'}`}
                onClick={() => { if (sheetProgress == null) addonSheetRef.current?.click(); }}
                onDragOver={(event) => { event.preventDefault(); setAddonDrag('sheet'); }}
                onDragLeave={() => setAddonDrag((current) => current === 'sheet' ? null : current)}
                onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setAddonDrag(null); void receiveAddonSheet(event.dataTransfer.files); }}
              >
                {sheetProgress != null ? (
                  <>
                    <div className="text-base font-semibold">正在传入 {sheetProgress}%</div>
                    <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-sky-600 transition-[width] duration-300" style={{ width: `${sheetProgress}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-base font-semibold">传入表格</div>
                    <div className="mt-1 text-sm text-slate-500">SKU 可以不填。表头对上售价、数量、总价就先存入</div>
                  </>
                )}
              </div>
            </div>
            <input ref={addonProductRef} type="file" className="hidden" multiple accept="image/*,.xlsx,.xls,.csv" onChange={(event) => { const files = event.target.files; if (files?.length) void receiveAddonProducts(files); event.target.value = ''; }} />
            <input ref={addonSheetRef} type="file" className="hidden" multiple accept=".xlsx,.xls,.csv" onChange={(event) => { const files = event.target.files; if (files?.length) void receiveAddonSheet(files); event.target.value = ''; }} />
          </div>
          <InboundShipBar
            shipments={state.inboundShipments || []}
            saving={state.inboundSaving}
            onSave={(input) => handlers.saveInboundShipment(input)}
            onUpdate={(input) => handlers.updateInboundShipment(input)}
          >
          {(shipButton) => (
          <DialogFooter className="sticky bottom-0 z-20 gap-2 border-t bg-white px-4 py-3 sm:justify-between sm:px-6">
            <Button type="button" variant="outline" onClick={handlers.markInboundAllFull} disabled={state.inboundSaving}>
              全部到齐
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="relative" ref={stageMenuRef}>
                <Button type="button" variant="outline" onClick={openBatchStage} disabled={state.inboundSaving}>
                  发货状态
                </Button>
                {stageOpen ? (
                  <div className="absolute bottom-full right-0 z-[90] mb-2 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl" role="dialog" aria-label="发货状态">
                    <div className="text-sm font-semibold text-slate-900">发货状态</div>
                    <p className="mt-1 text-xs text-slate-500">写入已勾选的 {inboundSelected.length} 个商品</p>
                    <div className="mt-2 grid gap-1.5">
                      {INBOUND_STAGE_OPTIONS.map(([value, label]) => (
                        <Button key={value} type="button" variant="outline" className={"h-9 border-2 font-medium " + (stagePick === value ? "border-slate-900 ring-2 ring-slate-900" : "border-transparent")} style={INBOUND_STAGE_FILL[value]} onClick={() => setStagePick(value)}>{label}</Button>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button type="button" variant="outline" className="h-8" onClick={() => { setStageOpen(false); setStagePick(''); }}>取消</Button>
                      <Button type="button" className="h-8" disabled={!stagePick} onClick={applyBatchStage}>确认</Button>
                    </div>
                  </div>
                ) : null}
              </div>
              <Button type="button" variant="outline" onClick={handlers.closeInboundDialog} disabled={state.inboundSaving}>
                取消
              </Button>
              <Button type="button" variant="outline" onClick={() => importFileRef.current?.click()} disabled={state.inboundSaving}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> 导入商品/表格
              </Button>
              <Button type="button" variant="outline" disabled={state.exportLoading} onClick={() => downloadInbound('sheet')}>
                <Download className="mr-2 h-4 w-4" /> 下载表格
              </Button>
              {shipButton}
              <Button type="button" aria-label="保存入库" onClick={() => {
                const cards = [...addonCards]
                const drafts = Object.keys(manualDrafts)
                void (async () => {
                  for (const card of cards) await saveAddonRow(card)
                  for (const id of drafts) {
                    const line = state.inboundDrafts.find((item) => item.id === id)
                    if (line) await saveManualDraft(line)
                  }
                  await handlers.submitInbound()
                })()
              }} disabled={state.inboundSaving}>
                {state.inboundSaving ? '保存中…' : '保存入库'}
              </Button>
              <input
                ref={shipImageRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={(event) => {
                  const files = event.target.files;
                  if (files?.length) void uploadShippingImages(files);
                  event.target.value = '';
                }}
              />
              <input
                ref={importFileRef}
                type="file"
                className="hidden"
                multiple
                accept=".xlsx,.xls,.csv,image/*"
                onChange={(event) => {
                  const files = event.target.files
                  if (files?.length) void receiveImportFiles(files)
                  event.target.value = ''
                }}
              />
            </div>
          </DialogFooter>
          )}
          </InboundShipBar>
      {state.inboundOrderId && noteOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-label="添加备注" onClick={() => setNoteOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg" onClick={(event) => event.stopPropagation()}>
            <div className="text-lg font-semibold text-slate-900">添加备注</div>
            <p className="mt-1 text-sm text-slate-500">确认后写入已勾选的 {inboundSelected.length} 个商品。</p>
            <textarea
              rows={4}
              autoFocus
              className="mt-3 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm leading-6"
              placeholder="输入备注"
              aria-label="备注内容"
              value={batchNote}
              onChange={(event) => setBatchNote(event.target.value)}
              onKeyDown={(event) => {
                if (imeKey(event)) return;
                if (event.key !== 'Enter' || event.shiftKey) return;
                event.preventDefault();
                confirmBatchNote();
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNoteOpen(false)}>取消</Button>
              <Button type="button" onClick={confirmBatchNote}>确认</Button>
            </div>
          </div>
        </div>
      ) : null}
        </DialogContent>
      </Dialog>
      {state.inboundOrderId && inboundZoom ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-16"
          role="dialog"
          aria-label="大图"
          onClick={() => setInboundZoom(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow"
            aria-label="关闭大图"
            onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); setInboundZoom(null) }}
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); setInboundZoom(null) }}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="z-0 flex max-h-[72vh] max-w-[880px] items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <EditableImg
              propKey={`inbound-zoom-${inboundZoom.src}`}
              keywords={inboundZoom.src}
              description={inboundZoom.name}
              needLargeImage
              proxyWidth={1200}
              proxyQuality={90}
              className="h-auto w-auto object-contain"
              style={{ width: 'auto', height: 'auto', maxHeight: '72vh', maxWidth: '880px', aspectRatio: 'auto', objectFit: 'contain' }}
            />
          </div>
        </div>
      ) : null}
    </div>;
};
export default OrderManagementView;