'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { OrderManagement } from '@/backend/route-params'
import type { OrderStatus, OrderShipMethod, PaymentMethodType } from '@/backend/actions/OrderManagement'
import type { OrderManagementState, OrderManagementHandlers } from '@/backend/hooks/useOrderManagement'
import EditableImg from '@/@base/EditableImg'

// Lucide Icons
import { 
  Package, 
  Truck, 
  CreditCard, 
  Calendar, 
  Search, 
  Filter, 
  RefreshCcw, 
  ChevronRight, 
  User, 
  Globe,
  Plus,
  History,
  Info,
  ExternalLink,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ===== 枚举映射与样式助手 =====
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '已支付',
  PROCESSING: '待发货',
  SHIPPED: '运输中',
  DELIVERED: '已送达',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
}

const ORDER_STATUS_VARIANTS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-muted text-muted-foreground',
  PAID: 'bg-primary text-primary-foreground',
  PROCESSING: 'bg-accent text-accent-foreground',
  SHIPPED: 'bg-blue-600 text-white',
  DELIVERED: 'bg-green-600 text-white',
  CANCELLED: 'bg-destructive text-destructive-foreground',
  REFUNDED: 'bg-orange-500 text-white',
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  PAYPAL: 'PayPal',
  BANK_TRANSFER: '银行转账',
  STRIPE: 'Stripe',
  CREDIT_CARD: '信用卡',
}

interface Props {
  state: OrderManagementState
  handlers: OrderManagementHandlers
}

export const OrderManagementView = ({ state, handlers }: Props) => {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      
      {/* 1. 关键指标看板 Section */}
      <section data-controller-name="关键指标看板" className="w-full bg-slate-50 border-b">
        <div className="container mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-header font-bold tracking-tight">订单管理</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCcw className="mr-2 h-4 w-4" /> 刷新数据
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '待发货订单', value: state.stats?.pendingShipmentCount, icon: Package, color: 'text-accent' },
              { label: '今日新增订单', value: state.stats?.todayNewOrderCount, icon: ShoppingBag, color: 'text-primary' },
              { label: '退款处理中', value: state.stats?.refundingCount, icon: RefreshCcw, color: 'text-destructive' },
              { label: '全部订单', value: state.stats?.totalOrderCount, icon: History, color: 'text-slate-600' },
            ].map((item, idx) => (
              <Card key={idx} className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                      <h3 className="text-3xl font-header font-bold mt-1">
                        {state.statsLoading ? '...' : (item.value || 0).toLocaleString()}
                      </h3>
                    </div>
                    <div className={`p-3 rounded-lg bg-slate-100 ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 2. 订单筛选控制台 Section */}
      <section data-controller-name="订单筛选控制台" className="w-full">
        <div className="container mx-auto px-8 py-8">
          <Tabs value={state.filterForm.status || 'ALL'} onValueChange={handlers.handleTabChange} className="w-full mb-6">
            <TabsList className="h-10 p-1 bg-slate-100/50">
              <TabsTrigger value="ALL" className="px-6">全部订单</TabsTrigger>
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                <TabsTrigger key={k} value={k} className="px-6">
                  {v}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <form className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[240px]">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">全局搜索</Label>
                  <Input
                    className="h-10"
                    value={state.filterForm.keyword || ''}
                    onChange={(e) => handlers.handleFilterChange('keyword', e.target.value)}
                    placeholder="订单号 / 客户 / 邮箱"
                  />
                </div>
                <div className="w-[180px]">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">国家/地区</Label>
                  <Input
                    className="h-10"
                    value={state.filterForm.countryName || ''}
                    onChange={(e) => handlers.handleFilterChange('countryName', e.target.value)}
                    placeholder="例如: US"
                  />
                </div>
                <div className="w-[180px]">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">下单时间 (起)</Label>
                  <Input
                    type="date"
                    className="h-10"
                    value={state.filterForm.startDate || ''}
                    onChange={(e) => handlers.handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="w-[180px]">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">下单时间 (止)</Label>
                  <Input
                    type="date"
                    className="h-10"
                    value={state.filterForm.endDate || ''}
                    onChange={(e) => handlers.handleFilterChange('endDate', e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlers.handleSearchClick}>
                    <Search className="h-4 w-4 mr-2" /> 筛选
                  </Button>
                  <Button variant="outline" className="h-10 px-6" onClick={handlers.handleClearFilter}>
                    重置
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. 订单数据列表 Section */}
      <section data-controller-name="订单数据列表" className="w-full">
        <div className="container mx-auto px-8 pb-12">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="w-[160px] font-bold py-4 pl-6">订单号</TableHead>
                      <TableHead className="font-bold">客户信息</TableHead>
                      <TableHead className="font-bold">商品摘要</TableHead>
                      <TableHead className="font-bold">财务详情</TableHead>
                      <TableHead className="font-bold">状态/物流</TableHead>
                      <TableHead className="font-bold">下单时间</TableHead>
                      <TableHead className="text-right font-bold pr-6">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.listLoading ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">数据同步中...</TableCell></TableRow>
                    ) : state.list.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">无符合条件的订单记录</TableCell></TableRow>
                    ) : (
                      state.list.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-mono text-sm pl-6">{row.orderNo}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Button 
                                variant="link" 
                                className="h-auto p-0 justify-start text-primary font-bold hover:no-underline"
                                onClick={() => handlers.jumpToCustomer(row.customerEmail)}
                              >
                                {row.customerName}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </Button>
                              <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                                <Globe className="h-3 w-3 mr-1" /> {row.countryName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded border overflow-hidden flex-shrink-0 bg-slate-50">
                                {row.itemImageUrl && (
                                  <EditableImg 
                                    propKey={`order-thumb-${row.id}`}
                                    keywords={row.itemImageUrl}
                                    description={row.itemSummary}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <span className="text-sm line-clamp-2 max-w-[200px]">{row.itemSummary}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-bold">{row.currencyCode} {row.totalAmount.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <CreditCard className="h-3 w-3 mr-1" /> {PAYMENT_METHOD_LABELS[row.paymentMethod]}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1.5">
                              <Badge className={`w-fit rounded-sm font-medium ${ORDER_STATUS_VARIANTS[row.status]}`}>
                                {ORDER_STATUS_LABELS[row.status]}
                              </Badge>
                              {row.trackingCarrier && (
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                  {row.trackingCarrier}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(row.createdAt).toLocaleString('zh-CN', { hour12: false })}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              size="sm"
                              className="bg-slate-800 text-white hover:bg-slate-900"
                              onClick={() => OrderManagement.navigateToWithParams(router, { status: '', orderId: row.id })}
                            >
                              管理详情
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="px-6 py-4 border-t flex items-center justify-between bg-slate-50/50">
              <div className="text-sm text-muted-foreground font-medium">
                共计 <span className="text-foreground">{state.total}</span> 条订单
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.filterForm.page === 1}
                  onClick={() => handlers.handlePageChange((state.filterForm.page || 1) - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> 上一页
                </Button>
                <div className="text-sm font-bold">
                  第 {state.filterForm.page} 页
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(state.filterForm.page || 1) * (state.filterForm.pageSize || 20) >= state.total}
                  onClick={() => handlers.handlePageChange((state.filterForm.page || 1) + 1)}
                >
                  下一页 <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 4. 详情抽屉 (Sheet) */}
      <Sheet open={!!state.queryOrderId} onOpenChange={(open) => !open && handlers.handleCloseDetail()}>
        <SheetContent className="sm:max-w-[800px] p-0 border-l-0">
          {state.detailLoading ? (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2">
                <RefreshCcw className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm font-medium text-slate-500">正在加载订单深度数据...</span>
              </div>
            </div>
          ) : state.detailData ? (
            <div className="h-full flex flex-col bg-slate-50">
              <SheetHeader className="px-6 py-5 bg-white border-b shadow-sm sticky top-0 z-10 flex-row justify-between items-center space-y-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <SheetTitle className="text-xl font-bold font-header">订单 #{state.detailData.orderNo}</SheetTitle>
                    <Badge className={`${ORDER_STATUS_VARIANTS[state.detailData.status]}`}>
                      {ORDER_STATUS_LABELS[state.detailData.status]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    下单于: {new Date(state.detailData.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    打印清单
                  </Button>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* 双列布局：商品明细 & 客户发货 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左列: 业务与财务数据 */}
                    <div className="space-y-6">
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3 border-b">
                          <CardTitle className="text-sm font-bold flex items-center">
                            <Package className="h-4 w-4 mr-2 text-primary" /> SKU 商品明细
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y">
                            {state.detailData.items.map((sku) => {
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
                          <div className="p-4 bg-slate-50/50 space-y-2 border-t text-sm">
                            <div className="flex justify-between text-muted-foreground">
                              <span>件数合计</span>
                              <span className="font-medium text-foreground">
                                {state.detailData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} 件
                              </span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>商品小计</span>
                              <span>{state.detailData.subtotalAmount}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>物流运费</span>
                              <span>+ {state.detailData.shippingAmount}</span>
                            </div>
                            <div className="flex justify-between text-destructive">
                              <span>折扣优惠</span>
                              <span>- {state.detailData.discountAmount}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-base">
                              <span>最终实付</span>
                              <span className="text-primary">{state.detailData.currencyCode} {state.detailData.totalAmount}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 右列: 客户与发货处理 */}
                    <div className="space-y-6">
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3 border-b">
                          <CardTitle className="text-sm font-bold flex items-center">
                            <User className="h-4 w-4 mr-2 text-primary" /> 收货人与地址
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {state.detailData.address ? (
                            <div className="text-sm space-y-2">
                              <div className="font-bold flex items-center justify-between">
                                {state.detailData.address.recipientName}
                                <span className="text-muted-foreground font-normal">{state.detailData.address.phone}</span>
                              </div>
                              <div className="text-muted-foreground leading-relaxed">
                                {state.detailData.address.addressLine1} {state.detailData.address.addressLine2}<br />
                                {state.detailData.address.cityName}, {state.detailData.address.stateName}, {state.detailData.address.countryName}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">无详细收货地址</div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 shadow-sm border-l-4 border-l-primary">
                        <CardHeader className="pb-3 border-b">
                          <CardTitle className="text-sm font-bold flex items-center">
                            <Truck className="h-4 w-4 mr-2 text-primary" /> 履约工作台
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[10px] uppercase font-bold text-slate-400">物流渠道</Label>
                              <Input
                                className="h-9 text-sm mt-1"
                                value={state.shipForm.trackingCarrier}
                                onChange={(e) => handlers.handleShipFormChange('trackingCarrier', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase font-bold text-slate-400">物流单号</Label>
                              <Input
                                className="h-9 text-sm mt-1"
                                value={state.shipForm.trackingNumber}
                                onChange={(e) => handlers.handleShipFormChange('trackingNumber', e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-slate-400">发货/同步时间</Label>
                            <Input
                              type="datetime-local"
                              className="h-9 text-sm mt-1"
                              value={state.shipForm.shippedAt}
                              onChange={(e) => handlers.handleShipFormChange('shippedAt', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase font-bold text-slate-400">内部备注</Label>
                            <Textarea
                              className="mt-1 text-sm resize-none"
                              rows={2}
                              placeholder="仅供后台人员查看..."
                              value={state.shipForm.internalNote || ''}
                              onChange={(e) => handlers.handleShipFormChange('internalNote', e.target.value)}
                            />
                          </div>
                          <Button 
                            className="w-full bg-slate-900 text-white" 
                            onClick={handlers.submitShipOrder} 
                            disabled={state.detailData.status === 'CANCELLED' || state.detailData.status === 'REFUNDED'}
                          >
                            更新物流/标记发货
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* 底部通栏: 扩展追踪与操作日志 */}
                  <div className="space-y-6">
                    <Card className="border-slate-200">
                      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-primary" /> 全程物流追踪
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handlers.openLogisticsDialog(state.detailData!.id)}>
                          <Plus className="h-3 w-3 mr-1" /> 添加物流段
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        {state.detailData.logistics.length > 0 ? (
                          <div className="p-4 space-y-4">
                            {state.detailData.logistics.map((log, i) => (
                              <div key={log.id} className="flex gap-4 relative">
                                {i !== state.detailData!.logistics.length - 1 && (
                                  <div className="absolute left-[15px] top-8 bottom-[-16px] w-[1px] bg-slate-200" />
                                )}
                                <div className="z-10 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-slate-500">
                                  <Truck className="h-4 w-4" />
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">{log.segmentType}</span>
                                    <Badge variant="outline" className="text-[10px] uppercase">{log.statusLabel}</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {log.carrierName} - <span className="font-mono">{log.trackingNumber}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-1 uppercase">
                                    录入: {new Date(log.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-sm text-muted-foreground italic">
                            暂无分段物流流转记录
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200">
                      <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm font-bold flex items-center">
                          <History className="h-4 w-4 mr-2 text-primary" /> 操作日志与状态变更
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {state.detailData.logs.map((op) => (
                            <div key={op.id} className="flex gap-4 items-start border-l-2 border-slate-100 pl-4 relative">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">{op.operatorName}</span>
                                  <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{op.actionType}</span>
                                </div>
                                {op.actionNote && <div className="text-xs text-muted-foreground mt-1 italic">"{op.actionNote}"</div>}
                                <div className="text-[10px] text-slate-400 mt-1">{new Date(op.createdAt).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50 border-t p-4 flex justify-end">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="text-xs"
                          onClick={() => handlers.openStatusDialog(state.detailData!.id, state.detailData!.status)}
                        >
                          订单人工干预 (取消/退款)
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">订单详情不存在或已被移除</div>
          )}
        </SheetContent>
      </Sheet>

      {/* 5. 状态变更弹窗 */}
      <Dialog open={state.isStatusDialogOpen} onOpenChange={handlers.setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-destructive" /> 订单状态强制干预
            </DialogTitle>
            <DialogDescription>
              此操作将直接绕过系统流转修改订单状态，请务必详细说明理由。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">目标新状态</Label>
              <Select
                value={state.statusForm.newStatus}
                onValueChange={(val: OrderStatus) => handlers.setStatusForm((p) => ({ ...p, newStatus: val }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="选择新状态" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">操作说明 (必填)</Label>
              <Textarea
                placeholder="例如: 客户线下支付、由于缺货取消订单等..."
                className="resize-none"
                rows={4}
                value={state.statusForm.actionNote}
                onChange={(e) => handlers.setStatusForm((p) => ({ ...p, actionNote: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handlers.setIsStatusDialogOpen(false)}>取消</Button>
            <Button className="bg-destructive text-destructive-foreground" onClick={handlers.submitStatusChange}>确认执行修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. 添加多段物流弹窗 */}
      <Dialog open={state.isLogisticsDialogOpen} onOpenChange={handlers.setIsLogisticsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加物流段记录</DialogTitle>
            <DialogDescription>记录跨境物流中的各个关键节点（如：海关清关、港口到港等）。</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">物流段名称</Label>
              <Input
                placeholder="如: 国内段、清关段、最后一公里"
                value={state.logisticsForm.segmentType}
                onChange={(e) => handlers.setLogisticsForm((p) => ({ ...p, segmentType: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">承运商名称</Label>
              <Input
                value={state.logisticsForm.carrierName || ''}
                onChange={(e) => handlers.setLogisticsForm((p) => ({ ...p, carrierName: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">物流单号</Label>
              <Input
                value={state.logisticsForm.trackingNumber || ''}
                onChange={(e) => handlers.setLogisticsForm((p) => ({ ...p, trackingNumber: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">节点状态描述</Label>
              <Input
                placeholder="如: 已揽收、派送中"
                value={state.logisticsForm.statusLabel || ''}
                onChange={(e) => handlers.setLogisticsForm((p) => ({ ...p, statusLabel: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">预计送达</Label>
              <Input
                type="datetime-local"
                value={state.logisticsForm.estimatedArrivalAt || ''}
                onChange={(e) => handlers.setLogisticsForm((p) => ({ ...p, estimatedArrivalAt: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">补充备注</Label>
              <Input
                value={state.logisticsForm.remark || ''}
                onChange={(e) => handlers.setLogisticsForm((p) => ({ ...p, remark: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handlers.setIsLogisticsDialogOpen(false)}>取消</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handlers.submitLogisticsSegment}>提交节点记录</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrderManagementView;
