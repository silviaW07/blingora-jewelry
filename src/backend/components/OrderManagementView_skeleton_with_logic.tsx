'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { OrderManagement, UserManagement } from '@/backend/route-params';

// Types & Enums
import type { OrderStatus, OrderShipMethod, PaymentMethodType, GetDashboardStatsOutput, GetOrderListInput, OrderListItem, OrderDetail, ShipOrderInput, AddLogisticsSegmentInput, UpdateOrderStatusInput } from '@/backend/actions/OrderManagement';

// Actions
import { getOrderDashboardStats, getOrderList, getOrderDetail, shipOrder, addLogisticsSegment, updateOrderStatus } from '@/backend/actions/OrderManagement';

// UI Components (假设基础组件均按照 shadcn 规范从对应目录导出，不需要 className)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// ===== 枚举映射 =====
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '已支付',
  PROCESSING: '处理中/待发货',
  SHIPPED: '运输中',
  DELIVERED: '已送达',
  CANCELLED: '已取消',
  REFUNDED: '已退款'
};
const SHIP_METHOD_LABELS: Record<OrderShipMethod, string> = {
  STANDARD: '标准物流',
  EXPRESS: '加急快递'
};
const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  PAYPAL: 'PayPal',
  BANK_TRANSFER: '银行转账',
  STRIPE: 'Stripe',
  CREDIT_CARD: '信用卡'
};

// ===== 主页面组件 =====
export default function OrderManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 解析路由参数 (使用 function_note 的封装保证缓存稳定)
  const paramsObj = useMemo(() => OrderManagement.getParams(searchParams), [searchParams]);
  const queryStatus = paramsObj.status;
  const queryOrderId = paramsObj.orderId;

  // ===== 状态管理 =====

  // 1. 看板数据
  const [stats, setStats] = useState<GetDashboardStatsOutput | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // 2. 列表数据
  const [list, setList] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);

  // 3. 筛选条件
  const [filterForm, setFilterForm] = useState<GetOrderListInput>({
    page: 1,
    pageSize: 20,
    status: queryStatus as OrderStatus || undefined
  });

  // 4. 详情抽屉
  const [detailData, setDetailData] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 5. 弹窗控制
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusForm, setStatusForm] = useState<UpdateOrderStatusInput>({
    orderId: '',
    newStatus: 'CANCELLED',
    actionNote: ''
  });

  // 发货表单 (履约工作台)
  const [shipForm, setShipForm] = useState<ShipOrderInput>({
    orderId: '',
    trackingCarrier: '',
    trackingNumber: '',
    shippedAt: '',
    internalNote: ''
  });

  // 追加物流表单
  const [isLogisticsDialogOpen, setIsLogisticsDialogOpen] = useState(false);
  const [logisticsForm, setLogisticsForm] = useState<AddLogisticsSegmentInput>({
    orderId: '',
    segmentType: '',
    carrierName: '',
    trackingNumber: '',
    statusLabel: '',
    estimatedArrivalAt: '',
    remark: ''
  });

  // ===== 副作用与数据拉取 =====

  // 拉取看板
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await getOrderDashboardStats();
      setStats(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  // 拉取列表
  const fetchList = async (currentForm: GetOrderListInput) => {
    try {
      setListLoading(true);
      // 处理时间：补充时分秒确保一天的完整跨度
      const payload = {
        ...currentForm
      };
      if (payload.startDate) {
        payload.startDate = new Date(`${payload.startDate}T00:00:00.000Z`).toISOString();
      }
      if (payload.endDate) {
        payload.endDate = new Date(`${payload.endDate}T23:59:59.999Z`).toISOString();
      }
      const res = await getOrderList(payload);
      setList(res.list);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setListLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchStats();
  }, []);

  // 监听分页和路由初始状态触发搜索
  useEffect(() => {
    fetchList(filterForm);
    // 依赖于基础类型，避免对象循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterForm.page, filterForm.pageSize, filterForm.status]);

  // 监听 URL orderId 变化加载详情
  useEffect(() => {
    if (queryOrderId) {
      handleOpenDetail(queryOrderId);
    } else {
      setDetailData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryOrderId]);

  // ===== 交互处理 =====

  const handleFilterChange = <K extends keyof GetOrderListInput,>(field: K, value: GetOrderListInput[K]) => {
    setFilterForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSearchClick = () => {
    handleFilterChange('page', 1);
    fetchList({
      ...filterForm,
      page: 1
    });
  };
  const handleClearFilter = () => {
    const defaultForm: GetOrderListInput = {
      page: 1,
      pageSize: 20
    };
    setFilterForm(defaultForm);
    OrderManagement.navigateToStandard(router);
    fetchList(defaultForm);
  };

  // 状态快筛 Tab
  const handleTabChange = (value: string) => {
    const status = value === 'ALL' ? undefined : value as OrderStatus;
    handleFilterChange('status', status);
    handleFilterChange('page', 1);
  };

  // 分页
  const handlePageChange = (newPage: number) => {
    handleFilterChange('page', newPage);
  };

  // 详情抽屉
  const handleOpenDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const data = await getOrderDetail(id);
      setDetailData(data);
      // 初始化发货表单
      setShipForm({
        orderId: data.id,
        trackingCarrier: data.trackingCarrier || '',
        trackingNumber: data.trackingNumber || '',
        shippedAt: data.shippedAt ? new Date(data.shippedAt).toISOString().slice(0, 16) : '',
        // 适配 datetime-local
        internalNote: data.internalNote || ''
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };
  const handleCloseDetail = () => {
    OrderManagement.navigateToStandard(router);
  };

  // 发货操作
  const handleShipFormChange = <K extends keyof ShipOrderInput,>(field: K, value: ShipOrderInput[K]) => {
    setShipForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const submitShipOrder = async () => {
    if (!shipForm.trackingCarrier || !shipForm.trackingNumber || !shipForm.shippedAt) {
      toast.error('请填写完整发货信息（承运商、单号、发货时间）');
      return;
    }
    try {
      await shipOrder({
        ...shipForm,
        shippedAt: new Date(shipForm.shippedAt).toISOString()
      });
      toast.success('发货处理成功');
      handleOpenDetail(shipForm.orderId);
      fetchList(filterForm);
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 状态变更
  const openStatusDialog = (id: string, currentStatus: OrderStatus) => {
    setStatusForm({
      orderId: id,
      newStatus: currentStatus,
      actionNote: ''
    });
    setIsStatusDialogOpen(true);
  };
  const submitStatusChange = async () => {
    if (!statusForm.actionNote) {
      toast.error('必须填写操作备注');
      return;
    }
    try {
      await updateOrderStatus(statusForm);
      toast.success('状态变更成功');
      setIsStatusDialogOpen(false);
      if (detailData && detailData.id === statusForm.orderId) {
        handleOpenDetail(statusForm.orderId);
      }
      fetchList(filterForm);
      fetchStats();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 追加物流
  const openLogisticsDialog = (id: string) => {
    setLogisticsForm({
      orderId: id,
      segmentType: '',
      carrierName: '',
      trackingNumber: '',
      statusLabel: '',
      estimatedArrivalAt: '',
      remark: ''
    });
    setIsLogisticsDialogOpen(true);
  };
  const submitLogisticsSegment = async () => {
    if (!logisticsForm.segmentType) {
      toast.error('请填写物流段落名称（如：国际段）');
      return;
    }
    try {
      const payload = {
        ...logisticsForm
      };
      if (payload.estimatedArrivalAt) {
        payload.estimatedArrivalAt = new Date(payload.estimatedArrivalAt).toISOString();
      } else {
        delete payload.estimatedArrivalAt;
      }
      await addLogisticsSegment(payload);
      toast.success('物流记录添加成功');
      setIsLogisticsDialogOpen(false);
      handleOpenDetail(logisticsForm.orderId);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 跳转客户
  const jumpToCustomer = (email: string) => {
    UserManagement.navigateToWithFilters(router, {
      account: '',
      email,
      role: 'CUSTOMER',
      status: ''
    });
  };

  // ===== 渲染层 =====
  return <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r72bac9eecb4201e3-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
      {/* 1. 顶部看板 */}
      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r1e290afe48f0f2e5-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
        <Card data-api-unique-id='ordermanagementview-skeleton-with-logic-rb3ec019fb58dfc32-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
          <CardHeader data-api-unique-id='ordermanagementview-skeleton-with-logic-r2664da316c524a60-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <CardTitle data-api-unique-id='ordermanagementview-skeleton-with-logic-rd5efcf4a559c4b2a-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>订单概览</CardTitle>
          </CardHeader>
          <CardContent data-api-unique-id='ordermanagementview-skeleton-with-logic-rd22a5fbb2e0f8681-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            {statsLoading ? <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r563ecddcb1eb0674-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>加载指标中...</div> : stats ? <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rd4a16ad783a4fe87-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r9af208fcab72fe1c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r3aa157cdc392b9bc-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>待发货订单：</Label>
                  <span data-api-unique-id='ordermanagementview-skeleton-with-logic-r863854ba20866d47-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>{stats.pendingShipmentCount}</span>
                </div>
                <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r64341f2767e8fc2d-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rf679c1b6d0e78eeb-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>今日新增订单：</Label>
                  <span data-api-unique-id='ordermanagementview-skeleton-with-logic-r7e40268454fda7b2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>{stats.todayNewOrderCount}</span>
                </div>
                <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rd61a8e1372e79586-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r87da6361760e324d-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>退款处理中：</Label>
                  <span data-api-unique-id='ordermanagementview-skeleton-with-logic-re9bf23fae4bb1307-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>{stats.refundingCount}</span>
                </div>
                <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r709b43ed4337fbe6-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r3df1d7b9e08ff903-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>全部订单：</Label>
                  <span data-api-unique-id='ordermanagementview-skeleton-with-logic-r3a4c5c4965dbf3c5-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>{stats.totalOrderCount}</span>
                </div>
              </div> : <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r426940189d097ad1-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>暂无数据</div>}
          </CardContent>
        </Card>
      </div>

      {/* 2. 筛选区 */}
      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r08342774ee2e05a1-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
        <Tabs value={filterForm.status || 'ALL'} onValueChange={handleTabChange} data-api-unique-id='ordermanagementview-skeleton-with-logic-re1d9b4eefd898268-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
          <TabsList data-api-unique-id='ordermanagementview-skeleton-with-logic-rf17bdb4d5363bf1b-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <TabsTrigger value="ALL" data-api-unique-id='ordermanagementview-skeleton-with-logic-r19cdc76516bf6422-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>全部订单</TabsTrigger>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v], index) => <TabsTrigger key={k} value={k} data-api-unique-id='ordermanagementview-skeleton-with-logic-r89c0cba4dce327d6-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                {v}
              </TabsTrigger>)}
          </TabsList>
        </Tabs>

        <Card data-api-unique-id='ordermanagementview-skeleton-with-logic-rb40f52f07140d136-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
          <CardContent data-api-unique-id='ordermanagementview-skeleton-with-logic-rc470ae899057abac-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r93bcd5ac8b07e2e0-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r5c924d93fd005a3f-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>全局搜索 (单号/客户/邮箱)</Label>
              <Input value={filterForm.keyword || ''} onChange={e => handleFilterChange('keyword', e.target.value)} placeholder="请输入关键词" data-api-unique-id='ordermanagementview-skeleton-with-logic-r79a0ea06f748dc38-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
            </div>
            <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r13612a817985f922-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-re9ed1bfb41677657-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>国家/地区</Label>
              <Input value={filterForm.countryName || ''} onChange={e => handleFilterChange('countryName', e.target.value)} placeholder="例如: US" data-api-unique-id='ordermanagementview-skeleton-with-logic-red90a27ef37ca48b-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
            </div>
            <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r3bf306b4c1d467de-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r82f8f7413010c646-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>下单时间 (起)</Label>
              <Input type="date" value={filterForm.startDate || ''} onChange={e => handleFilterChange('startDate', e.target.value)} data-api-unique-id='ordermanagementview-skeleton-with-logic-rbac4435c84423553-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
            </div>
            <div data-api-unique-id='ordermanagementview-skeleton-with-logic-ra1dd0a298e07787a-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r0792567ed1040115-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>下单时间 (止)</Label>
              <Input type="date" value={filterForm.endDate || ''} onChange={e => handleFilterChange('endDate', e.target.value)} data-api-unique-id='ordermanagementview-skeleton-with-logic-r0f5667d5ac7c1fa9-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
            </div>
          </CardContent>
          <CardFooter data-api-unique-id='ordermanagementview-skeleton-with-logic-ra9a0aa15e2a86239-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Button onClick={handleSearchClick} data-api-unique-id='ordermanagementview-skeleton-with-logic-r8cb2fa42e1f094f0-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>搜索</Button>
            <Button variant="secondary" onClick={handleClearFilter} data-api-unique-id='ordermanagementview-skeleton-with-logic-rafe89dec43b13dc4-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              重置
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 3. 数据表格区 */}
      <Card data-api-unique-id='ordermanagementview-skeleton-with-logic-r79037051bc6263ef-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
        <CardContent data-api-unique-id='ordermanagementview-skeleton-with-logic-r4754132151bd6705-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
          {listLoading ? <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rec4fcc82a6b1458b-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>加载列表中...</div> : list.length === 0 ? <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rff042c4aa894b858-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>暂无符合条件的订单</div> : <Table data-api-unique-id='ordermanagementview-skeleton-with-logic-rd5ce4de2a5e11c6b-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              <TableHeader data-api-unique-id='ordermanagementview-skeleton-with-logic-r5a5f6a77bfdce5a8-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                <TableRow data-api-unique-id='ordermanagementview-skeleton-with-logic-r253e37ed81df5570-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  <TableHead data-api-unique-id='ordermanagementview-skeleton-with-logic-rf60a6bf9a2ad85f9-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>订单号</TableHead>
                  <TableHead data-api-unique-id='ordermanagementview-skeleton-with-logic-r68b5d364b9f8e416-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>客户信息</TableHead>
                  <TableHead data-api-unique-id='ordermanagementview-skeleton-with-logic-rad408f0536c5c3b4-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>商品摘要</TableHead>
                  <TableHead data-api-unique-id='ordermanagementview-skeleton-with-logic-r99030155329eba9e-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>财务</TableHead>
                  <TableHead data-api-unique-id='ordermanagementview-skeleton-with-logic-r2733b71c57cc4fc7-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>状态/物流</TableHead>
                  <TableHead data-api-unique-id='ordermanagementview-skeleton-with-logic-r75de7e90b56f279e-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>下单时间</TableHead>
                  <TableHead data-api-unique-id='ordermanagementview-skeleton-with-logic-r3446c8940cd0f8ac-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-api-unique-id='ordermanagementview-skeleton-with-logic-reaf2222ff17df5a9-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                {list.map((row, index) => <TableRow key={row.id} data-api-unique-id='ordermanagementview-skeleton-with-logic-r5ac4bdca52d34664-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-ra51b37e58a207117-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-orderNo`} data-api-map-var-name='row'>{row.orderNo}</TableCell>
                    <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r44919aab23d902fa-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-raa73e42d9f1a97f2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                        <Button variant="link" onClick={() => jumpToCustomer(row.customerEmail)} data-api-unique-id='ordermanagementview-skeleton-with-logic-r67ac8e2c85d23ac7-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-customerName`} data-api-map-var-name='row'>
                          {row.customerName}
                        </Button>
                        <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r2c7bf2e6f37edcda-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-countryName`} data-api-map-var-name='row'>{row.countryName}</div>
                      </div>
                    </TableCell>
                    <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r2211cac8b06f363a-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      {row.itemImageUrl ? <img src={row.itemImageUrl} alt="商品" data-api-unique-id='ordermanagementview-skeleton-with-logic-rceeb0890201bee3f-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' /> : null}
                      <span data-api-unique-id='ordermanagementview-skeleton-with-logic-rc4945a7dff709d75-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-itemSummary`} data-api-map-var-name='row'>{row.itemSummary}</span>
                    </TableCell>
                    <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r7c0454a88b142a1e-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r14d79f97e8094644-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-currencyCode`} data-api-map-var-name='row'>{row.currencyCode} {row.totalAmount}</div>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r8571acebfff9269c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>{PAYMENT_METHOD_LABELS[row.paymentMethod]}</div>
                    </TableCell>
                    <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r924e535e7e1f6b3b-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r52f0c219828810f4-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>{ORDER_STATUS_LABELS[row.status]}</div>
                      {row.trackingCarrier && <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rc78990c5becd8bae-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`list-${index}-trackingCarrier`} data-api-map-var-name='row'>{row.trackingCarrier}</div>}
                    </TableCell>
                    <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r0d90dc2592e8317a-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r866ffecd94db308c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                      <Button onClick={() => OrderManagement.navigateToWithParams(router, {
                  status: '',
                  orderId: row.id
                })} data-api-unique-id='ordermanagementview-skeleton-with-logic-r2c07080b2f39a723-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                        详情处理
                      </Button>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}

          {/* 分页器模拟 */}
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-ra228cd96d551cecd-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <span data-api-unique-id='ordermanagementview-skeleton-with-logic-rdb68a68145c7eac2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>共 {total} 条</span>
            <Button disabled={filterForm.page === 1} onClick={() => handlePageChange((filterForm.page || 1) - 1)} data-api-unique-id='ordermanagementview-skeleton-with-logic-r18c1701e0a7f3d9f-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              上一页
            </Button>
            <span data-api-unique-id='ordermanagementview-skeleton-with-logic-r2ae115734c4fde04-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>当前页: {filterForm.page}</span>
            <Button disabled={(filterForm.page || 1) * (filterForm.pageSize || 20) >= total} onClick={() => handlePageChange((filterForm.page || 1) + 1)} data-api-unique-id='ordermanagementview-skeleton-with-logic-r8f72b1f7af176beb-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              下一页
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. 详情抽屉 (Sheet) */}
      <Sheet open={!!queryOrderId} onOpenChange={open => !open && handleCloseDetail()} data-api-unique-id='ordermanagementview-skeleton-with-logic-rc34411edea46dad2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
        <SheetContent data-api-unique-id='ordermanagementview-skeleton-with-logic-r6a56de75101fec9e-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
          {detailLoading ? <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rb0abb71acb3bd7d6-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>加载订单详情中...</div> : detailData ? <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rca6996ba92ea584c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              <SheetHeader data-api-unique-id='ordermanagementview-skeleton-with-logic-r4d5cbd2fd35e6346-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                <SheetTitle data-api-unique-id='ordermanagementview-skeleton-with-logic-r418b04f54b4642bb-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>订单号：{detailData.orderNo}</SheetTitle>
                <SheetDescription data-api-unique-id='ordermanagementview-skeleton-with-logic-r971cc3382eb1e802-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  状态：{ORDER_STATUS_LABELS[detailData.status]}
                </SheetDescription>
              </SheetHeader>

              {/* 主体区：分块排列 */}
              <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rf211bec8c22a747c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                <Card data-api-unique-id='ordermanagementview-skeleton-with-logic-rfc05a247e71e404d-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  <CardHeader data-api-unique-id='ordermanagementview-skeleton-with-logic-r560dfd19a3c20716-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                    <CardTitle data-api-unique-id='ordermanagementview-skeleton-with-logic-re54f942140d618c5-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>业务与财务数据</CardTitle>
                  </CardHeader>
                  <CardContent data-api-unique-id='ordermanagementview-skeleton-with-logic-r36ea37d761aac0f7-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                    <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r9f294653f68f098c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                      <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rdf881a73257bda33-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>商品明细</Label>
                      <Table data-api-unique-id='ordermanagementview-skeleton-with-logic-r020da13df7c4fe9e-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                        <TableBody data-api-unique-id='ordermanagementview-skeleton-with-logic-rec7586c2f379ffdc-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                          {detailData.items.map((sku, index) => <TableRow key={sku.id} data-api-unique-id='ordermanagementview-skeleton-with-logic-rb9c4752b9800f982-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                              <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r04bb7a4fff4c63e6-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>{sku.mainImageUrl && <img src={sku.mainImageUrl} alt="" data-api-unique-id='ordermanagementview-skeleton-with-logic-r9ff149d3b52a1c45-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' />}</TableCell>
                              <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-rfa31b1dfc3e5d181-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`detailData.items-${index}-productName`} data-api-map-var-name='sku'>{sku.productName} ({sku.skuCode})</TableCell>
                              <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r9af1b59a51088948-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`detailData.items-${index}-quantity`} data-api-map-var-name='sku'>数量: {sku.quantity}</TableCell>
                              <TableCell data-api-unique-id='ordermanagementview-skeleton-with-logic-r0f45715fe22bd395-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`detailData.items-${index}-lineAmount`} data-api-map-var-name='sku'>小计: {sku.lineAmount}</TableCell>
                            </TableRow>)}
                        </TableBody>
                      </Table>
                    </div>
                    <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r9af313429a854993-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                      <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r4be474c3c2690168-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>支付清单</Label>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r991ba7d0460a630f-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>商品总计：{detailData.subtotalAmount}</div>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r4425faa5bc4d0767-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>运费：{detailData.shippingAmount}</div>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r03ef8bf8c82a57fd-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>折扣抵扣：{detailData.discountAmount}</div>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r5ede50d10b81f77f-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>实付金额：{detailData.currencyCode} {detailData.totalAmount}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-api-unique-id='ordermanagementview-skeleton-with-logic-rab74d4805067a1c1-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  <CardHeader data-api-unique-id='ordermanagementview-skeleton-with-logic-rf9ac990ea1b245d5-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                    <CardTitle data-api-unique-id='ordermanagementview-skeleton-with-logic-r86b580b0160495be-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>客户与发货处理</CardTitle>
                  </CardHeader>
                  <CardContent data-api-unique-id='ordermanagementview-skeleton-with-logic-rad069d33db7e5bdb-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                    <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r7456d54bbe0f2faa-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                      <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r8559ddc9e8d0cb05-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>收货地址</Label>
                      {detailData.address ? <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r7bebbbc9c8780c4f-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r56186b81494a9bfd-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>收件人：{detailData.address.recipientName} {detailData.address.phone}</div>
                          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r285f864c0f81067c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>地址：{detailData.address.addressLine1} {detailData.address.addressLine2}</div>
                          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-ra7c9bea3c7672845-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>{detailData.address.cityName}, {detailData.address.stateName}, {detailData.address.countryName}</div>
                        </div> : <div data-api-unique-id='ordermanagementview-skeleton-with-logic-re73d1d5d273cd309-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>无地址信息</div>}
                    </div>
                    
                    {/* 履约工作台 */}
                    <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r0ca0b5754ffce841-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                      <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rbc437b9a2db40d77-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>履约处理区 (可多次更新发货信息)</Label>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r65ee10b78a4b3a8f-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                        <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r2efe5affb3bf7a39-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>物流渠道</Label>
                        <Input value={shipForm.trackingCarrier} onChange={e => handleShipFormChange('trackingCarrier', e.target.value)} data-api-unique-id='ordermanagementview-skeleton-with-logic-rfda0bd767ff77cf5-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
                      </div>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-ra1639997785a319d-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                        <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rcdab8abd9228eeef-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>物流单号</Label>
                        <Input value={shipForm.trackingNumber} onChange={e => handleShipFormChange('trackingNumber', e.target.value)} data-api-unique-id='ordermanagementview-skeleton-with-logic-r9049b7826702c039-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
                      </div>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r32a7d0ca45a3b823-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                        <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r01e880eff0222329-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>发货时间</Label>
                        <Input type="datetime-local" value={shipForm.shippedAt} onChange={e => handleShipFormChange('shippedAt', e.target.value)} data-api-unique-id='ordermanagementview-skeleton-with-logic-rce358060e5d89e0c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
                      </div>
                      <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r303b0d450291703a-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                        <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r872cfb31230e9695-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>内部备注</Label>
                        <Textarea value={shipForm.internalNote || ''} onChange={e => handleShipFormChange('internalNote', e.target.value)} data-api-unique-id='ordermanagementview-skeleton-with-logic-rf2df35448df4bca2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
                      </div>
                      <Button onClick={submitShipOrder} disabled={detailData.status === 'CANCELLED' || detailData.status === 'REFUNDED'} data-api-unique-id='ordermanagementview-skeleton-with-logic-r428a12f90a92ae8b-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                        提交发货/更新信息
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card data-api-unique-id='ordermanagementview-skeleton-with-logic-r7609eb31d6f4f5b2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                  <CardHeader data-api-unique-id='ordermanagementview-skeleton-with-logic-r8c02a523e04ebe38-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                    <CardTitle data-api-unique-id='ordermanagementview-skeleton-with-logic-reaa146668340c444-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>扩展追踪</CardTitle>
                  </CardHeader>
                  <CardContent data-api-unique-id='ordermanagementview-skeleton-with-logic-r708fbd3fc98c3c04-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                    <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r3b4b3758b9360d57-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                      <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r1632bea90ebe0579-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>多段物流记录</Label>
                      <Button onClick={() => openLogisticsDialog(detailData.id)} data-api-unique-id='ordermanagementview-skeleton-with-logic-r15a82e617f2a2b6c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>新增物流段</Button>
                      <ul data-api-unique-id='ordermanagementview-skeleton-with-logic-rd4f35514d73df67c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                        {detailData.logistics.map((log, index) => <li key={log.id} data-api-unique-id='ordermanagementview-skeleton-with-logic-rb48924ce1b598dfb-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`detailData.logistics-${index}-segmentType`} data-api-map-var-name='log'>
                            [{log.segmentType}] {log.carrierName} - {log.trackingNumber} ({log.statusLabel})
                            <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r7c2df3a32bfbc161-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>添加时间：{new Date(log.createdAt).toLocaleString()}</div>
                          </li>)}
                      </ul>
                    </div>

                    <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r16aa4933a0e10163-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                      <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rdc23ae8cf8aad3b4-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>操作日志</Label>
                      <ul data-api-unique-id='ordermanagementview-skeleton-with-logic-r967f73441d7c12a2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                        {detailData.logs.map((op, index) => <li key={op.id} data-api-unique-id='ordermanagementview-skeleton-with-logic-ra9e742b309fc38fc-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`detailData.logs-${index}-operatorName`} data-api-map-var-name='op'>
                            [{new Date(op.createdAt).toLocaleString()}] {op.operatorName}: {op.actionType}
                            <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r3037a8b1fdfa33e5-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`detailData.logs-${index}-actionNote`} data-api-map-var-name='op'>备注：{op.actionNote}</div>
                          </li>)}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter data-api-unique-id='ordermanagementview-skeleton-with-logic-r4dd53ba3ba6887e4-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                    <Button variant="secondary" onClick={() => openStatusDialog(detailData.id, detailData.status)} data-api-unique-id='ordermanagementview-skeleton-with-logic-r35149d325af5138e-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                      干预订单状态 (退款/取消等)
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div> : <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r27b2052d7d546286-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>订单不存在或加载失败</div>}
        </SheetContent>
      </Sheet>

      {/* 5. 状态变更弹窗 */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen} data-api-unique-id='ordermanagementview-skeleton-with-logic-r46f78557b3bf1c21-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
        <DialogContent data-api-unique-id='ordermanagementview-skeleton-with-logic-r429d4e35b6325201-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
          <DialogHeader data-api-unique-id='ordermanagementview-skeleton-with-logic-rd8ceb15423fc38ac-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <DialogTitle data-api-unique-id='ordermanagementview-skeleton-with-logic-re1c1ad81900c61db-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>干预订单状态</DialogTitle>
            <DialogDescription data-api-unique-id='ordermanagementview-skeleton-with-logic-rfd5d827f72ae0d9a-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>强行修改订单状态需要记录备注说明。</DialogDescription>
          </DialogHeader>
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r5a3b6f5ff11f0e5c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rf63cc50ee5bc9b4f-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>新状态</Label>
            <Select value={statusForm.newStatus} onValueChange={(val: OrderStatus) => setStatusForm(p => ({
            ...p,
            newStatus: val
          }))} data-api-unique-id='ordermanagementview-skeleton-with-logic-r6bf9b51ea5172912-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
              <SelectTrigger data-api-unique-id='ordermanagementview-skeleton-with-logic-rff521ae9497312b2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                <SelectValue data-api-unique-id='ordermanagementview-skeleton-with-logic-r95a6bc4d2883729c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
              </SelectTrigger>
              <SelectContent data-api-unique-id='ordermanagementview-skeleton-with-logic-rc2673154dacfa169-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
                {Object.entries(ORDER_STATUS_LABELS).map(([k, v], index) => <SelectItem key={k} value={k} data-api-unique-id='ordermanagementview-skeleton-with-logic-r28eb32f24fa39626-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' data-api-in-loop='1'>
                    {v}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r29f6268511c9120b-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r73a9e7ae9b7644cb-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>操作备注 (必填)</Label>
            <Textarea value={statusForm.actionNote} onChange={e => setStatusForm(p => ({
            ...p,
            actionNote: e.target.value
          }))} data-api-unique-id='ordermanagementview-skeleton-with-logic-ref66d3146f0f847a-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
          </div>
          <DialogFooter data-api-unique-id='ordermanagementview-skeleton-with-logic-rba77b42f6612ba36-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Button onClick={submitStatusChange} data-api-unique-id='ordermanagementview-skeleton-with-logic-re6f6da9a794eac39-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>确认修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. 添加多段物流弹窗 */}
      <Dialog open={isLogisticsDialogOpen} onOpenChange={setIsLogisticsDialogOpen} data-api-unique-id='ordermanagementview-skeleton-with-logic-r60ad28d1a0c9f6f1-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
        <DialogContent data-api-unique-id='ordermanagementview-skeleton-with-logic-r9959526937d45b22-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
          <DialogHeader data-api-unique-id='ordermanagementview-skeleton-with-logic-rb91ef5fcfa9c2d02-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <DialogTitle data-api-unique-id='ordermanagementview-skeleton-with-logic-r66103ee5f632c696-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>添加物流段记录</DialogTitle>
          </DialogHeader>
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rd9725eb39e101ced-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r6f8308039368e0b1-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>物流段名称 (如: 国内段、清关段)</Label>
            <Input value={logisticsForm.segmentType} onChange={e => setLogisticsForm(p => ({
            ...p,
            segmentType: e.target.value
          }))} data-api-unique-id='ordermanagementview-skeleton-with-logic-rb83bf50d44c4b7a4-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
          </div>
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-rce81f11c72d4b142-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rcb518ff46224abca-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>承运商名称</Label>
            <Input value={logisticsForm.carrierName || ''} onChange={e => setLogisticsForm(p => ({
            ...p,
            carrierName: e.target.value
          }))} data-api-unique-id='ordermanagementview-skeleton-with-logic-rab2d2309ec37f897-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
          </div>
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r986b602a37c3fe71-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r8f8ac21bf4872eb7-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>物流单号</Label>
            <Input value={logisticsForm.trackingNumber || ''} onChange={e => setLogisticsForm(p => ({
            ...p,
            trackingNumber: e.target.value
          }))} data-api-unique-id='ordermanagementview-skeleton-with-logic-rb05cd5df5745d3c2-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
          </div>
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-ree7f7e4a9f26ca10-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rff430d22393e4d3b-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>状态标签</Label>
            <Input value={logisticsForm.statusLabel || ''} onChange={e => setLogisticsForm(p => ({
            ...p,
            statusLabel: e.target.value
          }))} data-api-unique-id='ordermanagementview-skeleton-with-logic-r55a3276c3947b983-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
          </div>
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r2db12d31ce09a678-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-r9543a1e6540b5a96-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>预计送达时间 (选填)</Label>
            <Input type="datetime-local" value={logisticsForm.estimatedArrivalAt || ''} onChange={e => setLogisticsForm(p => ({
            ...p,
            estimatedArrivalAt: e.target.value
          }))} data-api-unique-id='ordermanagementview-skeleton-with-logic-r6545e3fc0a309ce5-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
          </div>
          <div data-api-unique-id='ordermanagementview-skeleton-with-logic-r3eb75c7251c226df-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Label data-api-unique-id='ordermanagementview-skeleton-with-logic-rd94d92d987220389-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>备注</Label>
            <Input value={logisticsForm.remark || ''} onChange={e => setLogisticsForm(p => ({
            ...p,
            remark: e.target.value
          }))} data-api-unique-id='ordermanagementview-skeleton-with-logic-r1c6f5f31d107a57c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic' />
          </div>
          <DialogFooter data-api-unique-id='ordermanagementview-skeleton-with-logic-rced70d00004cfe1c-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>
            <Button onClick={submitLogisticsSegment} data-api-unique-id='ordermanagementview-skeleton-with-logic-r428ad34171adcba6-s508407716' data-api-unique-page-name='src/backend/components/OrderManagementView_skeleton_with_logic'>提交记录</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}