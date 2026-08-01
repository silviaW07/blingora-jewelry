'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { OrderManagement } from '@/backend/route-params';
import type { OrderStatus, OrderShipMethod, PaymentMethodType } from '@/backend/actions/OrderManagement';
import type { OrderManagementState, OrderManagementHandlers } from '@/backend/hooks/useOrderManagement';
import EditableImg from '@/@base/EditableImg';

// Lucide Icons
import { Package, Truck, CreditCard, Calendar, Search, Filter, RefreshCcw, ChevronRight, User, Globe, Plus, History, Info, ExternalLink, ChevronLeft, ShoppingBag, Download, FileSpreadsheet } from 'lucide-react';

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

// ===== 枚举映射与样式助手 =====
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '已支付',
  PROCESSING: '待发货',
  SHIPPED: '运输中',
  DELIVERED: '已送达',
  CANCELLED: '已取消',
  REFUNDED: '已退款'
};
/** 列表行内快捷状态（业务三态） */
const LIST_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'PENDING_PAYMENT', label: '待付款' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'SHIPPED', label: '已发货' },
];
const LIST_STATUS_VALUES = new Set(LIST_STATUS_OPTIONS.map((o) => o.value));
const ORDER_STATUS_VARIANTS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-muted text-muted-foreground',
  PAID: 'bg-primary text-primary-foreground',
  PROCESSING: 'bg-accent text-accent-foreground',
  SHIPPED: 'bg-blue-600 text-white',
  DELIVERED: 'bg-green-600 text-white',
  CANCELLED: 'bg-destructive text-destructive-foreground',
  REFUNDED: 'bg-orange-500 text-white'
};
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
export const OrderManagementView = ({
  state,
  handlers
}: Props) => {
  const router = useRouter();
  return <div className="min-h-screen bg-background font-body text-foreground" data-api-unique-id="ordermanagementview-r1f69bc6332e634b8-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
      
      {/* 1. 关键指标看板 Section */}
      <section data-controller-name="关键指标看板" className="w-full bg-slate-50 border-b" data-api-unique-id="ordermanagementview-rb60e64f62b7f9d04-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
        <div className="container mx-auto px-8 py-8" data-api-unique-id="ordermanagementview-r8a74b3ed8054c34c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
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
        <div className="container mx-auto px-8 py-8" data-api-unique-id="ordermanagementview-r1d9fb3b1858894fa-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
          <Tabs value={state.filterForm.status || 'ALL'} onValueChange={handlers.handleTabChange} className="w-full mb-6" data-api-unique-id="ordermanagementview-r69fb7214eefc2d40-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <TabsList className="h-10 p-1 bg-slate-100/50" data-api-unique-id="ordermanagementview-r86281deace4bb13e-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <TabsTrigger value="ALL" className="px-6" data-api-unique-id="ordermanagementview-r0cb2cb2fc92a2309-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">全部订单</TabsTrigger>
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v], index) => <TabsTrigger key={k} value={k} className="px-6" data-api-unique-id="ordermanagementview-r180c0dacb82b1231-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                  {v}
                </TabsTrigger>)}
            </TabsList>
          </Tabs>

          <Card className="shadow-sm border-slate-200" data-api-unique-id="ordermanagementview-r1f768dc5d710e915-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <CardContent className="p-6" data-api-unique-id="ordermanagementview-rfe1440c2f31f8753-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
              <form className="flex flex-wrap items-end gap-4" data-api-unique-id="ordermanagementview-r532206465c35d31c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                <div className="flex-1 min-w-[240px]" data-api-unique-id="ordermanagementview-r1e6b9b8dbfaf7b5d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-r6e126d0f501a5a77-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">全局搜索</Label>
                  <Input className="h-10" value={state.filterForm.keyword || ''} onChange={e => handlers.handleFilterChange('keyword', e.target.value)} placeholder="订单号 / 客户 / 邮箱" data-api-unique-id="ordermanagementview-r3db9b9a68ccec56f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </div>
                <div className="w-[180px]" data-api-unique-id="ordermanagementview-rb7f771e4d093a20d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-rc55fd4a0365d0cb2-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">国家/地区</Label>
                  <Input className="h-10" value={state.filterForm.countryName || ''} onChange={e => handlers.handleFilterChange('countryName', e.target.value)} placeholder="例如: US" data-api-unique-id="ordermanagementview-rb3070d39d9bf3a2d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </div>
                <div className="w-[180px]" data-api-unique-id="ordermanagementview-r212180d99aa8d3a7-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block" data-api-unique-id="ordermanagementview-rc9fa4e3f8dcb0b0f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">下单时间 (起)</Label>
                  <Input type="date" className="h-10" value={state.filterForm.startDate || ''} onChange={e => handlers.handleFilterChange('startDate', e.target.value)} data-api-unique-id="ordermanagementview-r636320b2c3cf9ddd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" />
                </div>
                <div className="w-[180px]" data-api-unique-id="ordermanagementview-r77cefabd2cb519cd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
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
        <div className="container mx-auto px-8 pb-12" data-api-unique-id="ordermanagementview-rf716b4765ff61c1f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
          <Card className="shadow-sm border-slate-200 overflow-hidden" data-api-unique-id="ordermanagementview-rb70c09c00d88ed41-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-white">
              <div className="text-sm font-medium text-muted-foreground">
                按线下单时间排序 · 可用上方状态 Tab 快速筛选
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
                <Table data-api-unique-id="ordermanagementview-r90a9eeedb50f830d-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                  <TableHeader className="bg-slate-50/80" data-api-unique-id="ordermanagementview-rb0510531d2e123f5-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    <TableRow data-api-unique-id="ordermanagementview-r2829fce95c941439-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                      <TableHead className="w-[150px] font-bold py-4 pl-6">订单编号</TableHead>
                      <TableHead className="font-bold min-w-[160px]">客户Email</TableHead>
                      <TableHead className="font-bold min-w-[110px]">客户名称</TableHead>
                      <TableHead className="font-bold min-w-[120px]">订单状态</TableHead>
                      <TableHead className="font-bold min-w-[120px]">WhatsApp</TableHead>
                      <TableHead className="font-bold min-w-[100px]">金额</TableHead>
                      <TableHead className="font-bold min-w-[90px]">总重量(g)</TableHead>
                      <TableHead className="font-bold min-w-[140px]">下单时间</TableHead>
                      <TableHead className="font-bold min-w-[220px]">订单备注</TableHead>
                      <TableHead className="text-right font-bold pr-6 min-w-[140px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-api-unique-id="ordermanagementview-r64976b895e3cee0a-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                    {state.listLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">数据同步中...</TableCell>
                      </TableRow>
                    ) : state.list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">无符合条件的订单记录</TableCell>
                      </TableRow>
                    ) : (
                      state.list.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors align-top">
                          <TableCell className="font-mono text-sm pl-6 pt-4" scrollX scrollXClassName="max-w-[220px]">
                            {row.orderNo}
                          </TableCell>
                          <TableCell className="pt-4" scrollX scrollXClassName="max-w-[260px]">
                            <button
                              type="button"
                              className="text-sm text-primary hover:underline text-left break-all"
                              onClick={() => handlers.jumpToCustomer(row.customerEmail)}
                            >
                              {row.customerEmail}
                            </button>
                          </TableCell>
                          <TableCell className="pt-4 text-sm font-medium">{row.customerName}</TableCell>
                          <TableCell className="pt-4">
                            <Select
                              value={LIST_STATUS_VALUES.has(row.status) ? row.status : row.status}
                              onValueChange={(val) => handlers.handleQuickStatusChange(row.id, val as OrderStatus)}
                            >
                              <SelectTrigger className="h-9 w-[118px] text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {!LIST_STATUS_VALUES.has(row.status) && (
                                  <SelectItem value={row.status}>{ORDER_STATUS_LABELS[row.status]}</SelectItem>
                                )}
                                {LIST_STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="pt-4 text-sm text-muted-foreground">
                            {row.customerWhatsapp || '—'}
                          </TableCell>
                          <TableCell className="pt-4">
                            <div className="text-sm font-bold whitespace-nowrap">
                              {row.currencyCode} {Number(row.totalAmount).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="pt-4 text-sm tabular-nums">
                            {Number(row.totalWeightGrams || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="pt-4 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(row.createdAt).toLocaleString('zh-CN', { hour12: false })}
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
                                下载
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
                          <CardTitle className="text-sm font-bold flex items-center" data-api-unique-id="ordermanagementview-r186eb335dfc424cd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <Package className="h-4 w-4 mr-2 text-primary" data-api-unique-id="ordermanagementview-rbb0a2b27610d3774-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" /> SKU 商品明细
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0" data-api-unique-id="ordermanagementview-rfb0a6d9007c97a49-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                          <Table data-api-unique-id="ordermanagementview-rf7731c296354418e-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                            <TableBody data-api-unique-id="ordermanagementview-raaeee018bdf17cac-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
                              {state.detailData.items.map((sku, index) => <TableRow key={sku.id} className="hover:bg-transparent" data-api-unique-id="ordermanagementview-r44560f09ec28ab2f-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                  <TableCell className="w-14 pl-4 py-4" data-api-unique-id="ordermanagementview-r1b50d5b047936c99-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                    <div className="w-12 h-12 rounded border bg-slate-50 overflow-hidden" data-api-unique-id="ordermanagementview-r8c0207cf481510f2-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                      {sku.mainImageUrl && <EditableImg propKey={`sku-${sku.id}`} keywords={sku.mainImageUrl} description={sku.productName} className="w-full h-full object-cover" data-api-unique-id="ordermanagementview-re2dca2ff88078099-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1" />}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4" scrollX scrollXClassName="max-w-[320px]" data-api-unique-id="ordermanagementview-re99ef7ad8810a245-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                    <div className="text-sm font-bold" data-api-unique-id="ordermanagementview-rca7c3834c34f43be-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">{sku.productName}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5" data-api-unique-id="ordermanagementview-r76fdb7081c5dee6b-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">SKU: {sku.skuCode}</div>
                                  </TableCell>
                                  <TableCell className="text-right pr-4 py-4 whitespace-nowrap" data-api-unique-id="ordermanagementview-r3c9cf3d7cd1d192c-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">
                                    <div className="text-xs" data-api-unique-id="ordermanagementview-rafe4ea9780451e65-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">x {sku.quantity}</div>
                                    <div className="text-sm font-bold" data-api-unique-id="ordermanagementview-r52ee6af3f05ebebd-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView" data-api-in-loop="1">{state.detailData?.currencyCode} {sku.lineAmount}</div>
                                  </TableCell>
                                </TableRow>)}
                            </TableBody>
                          </Table>
                          <div className="p-4 bg-slate-50/50 space-y-2 border-t text-sm" data-api-unique-id="ordermanagementview-rae190e488686cab2-s993201067" data-api-unique-page-name="src/backend/components/OrderManagementView">
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
    </div>;
};
export default OrderManagementView;