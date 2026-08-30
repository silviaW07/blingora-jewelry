'use client'

import React from 'react'
import type {
  PricingPromotionManagementHandlers,
  PricingPromotionManagementState,
} from '@/backend/hooks/usePricingPromotionManagement'
import {
  getPromoScheduleStatus,
  isPromoRuleActive,
  PROMO_SCHEDULE_STATUS_LABEL,
  toDatetimeLocalValue,
  type PromoScheduleStatus,
} from '@/shared/pricingPromotionConfig'
import {
  resolveTopPromotionFontSizePx,
  toTopPromotionDatetimeLocalValue,
} from '@/shared/topPromotionBannerConfig'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, RotateCcw, Save, Trash2, ChevronRight } from 'lucide-react'

interface Props {
  state: PricingPromotionManagementState
  handlers: PricingPromotionManagementHandlers
}

function toNumber(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function scheduleStatusClass(status: PromoScheduleStatus): string {
  if (status === 'ACTIVE') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'NOT_STARTED') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function PromoStatusBadge({
  enabled,
  startAt,
  endAt,
}: {
  enabled: boolean
  startAt: string | null
  endAt: string | null
}) {
  if (!enabled) {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        已关闭
      </Badge>
    )
  }
  const status = getPromoScheduleStatus(startAt, endAt)
  return (
    <Badge variant="outline" className={scheduleStatusClass(status)}>
      {PROMO_SCHEDULE_STATUS_LABEL[status]}
    </Badge>
  )
}

function ActivityTimeFields({
  startAt,
  endAt,
  onStartChange,
  onEndChange,
}: {
  startAt: string | null
  endAt: string | null
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>开始时间</Label>
        <Input
          type="datetime-local"
          value={toDatetimeLocalValue(startAt)}
          onChange={(e) => onStartChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">留空则立即生效；到达开始时间后自动生效，无需再手动开启。</p>
      </div>
      <div className="space-y-2">
        <Label>结束时间</Label>
        <Input
          type="datetime-local"
          value={toDatetimeLocalValue(endAt)}
          onChange={(e) => onEndChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">留空则永久有效；到达结束时间后自动失效，无需再手动关闭。</p>
      </div>
    </div>
  )
}

export function PricingPromotionManagementView({ state, handlers }: Props) {
  const config = state.config
  const topBanner = state.topBanner
  const tiers = config.fullReduction.tiers || []
  const fontSizePx = resolveTopPromotionFontSizePx(topBanner.font_size)
  const fontSizeMode =
    topBanner.font_size === 'sm' || topBanner.font_size === 'md' || topBanner.font_size === 'lg'
      ? topBanner.font_size
      : 'custom'

  const statusRows = [
    {
      key: 'siteWide',
      name: '全场折扣',
      enabled: config.siteWide.enabled,
      startAt: config.siteWide.startAt,
      endAt: config.siteWide.endAt,
      activeNow: isPromoRuleActive(config.siteWide),
    },
    {
      key: 'firstOrder',
      name: '首单折扣',
      enabled: config.firstOrder.enabled,
      startAt: config.firstOrder.startAt,
      endAt: config.firstOrder.endAt,
      activeNow: isPromoRuleActive(config.firstOrder),
    },
    {
      key: 'loyal',
      name: '老客折扣',
      enabled: config.loyal.enabled,
      startAt: config.loyal.startAt,
      endAt: config.loyal.endAt,
      activeNow: isPromoRuleActive(config.loyal),
    },
    {
      key: 'fullReduction',
      name: '阶梯满减',
      enabled: config.fullReduction.enabled,
      startAt: config.fullReduction.startAt,
      endAt: config.fullReduction.endAt,
      activeNow: isPromoRuleActive(config.fullReduction),
    },
    {
      key: 'shipping',
      name: '运费折扣',
      enabled: config.shipping.enabled,
      startAt: config.shipping.startAt,
      endAt: config.shipping.endAt,
      activeNow: isPromoRuleActive(config.shipping),
    },
  ]

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <section className="border-b border-border bg-white">
        <div className="container mx-auto px-8 py-4">
          <nav className="mb-2 flex items-center text-sm font-medium text-muted-foreground">
            <span>首页</span>
            <ChevronRight className="mx-1 h-4 w-4" />
            <span>站点设置</span>
            <ChevronRight className="mx-1 h-4 w-4" />
            <span className="text-foreground">促销活动管理</span>
          </nav>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-header text-2xl font-bold tracking-tight">促销活动管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                统一管理顶部促销通栏、全局汇率、全场/批发/首单/老客折扣、运费折扣与阶梯满减。顶部横幅为全站唯一促销展示位。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlers.reload} disabled={state.loading || state.submitting}>
                <RotateCcw className="mr-2 h-4 w-4" />
                刷新
              </Button>
              <Button size="sm" onClick={() => void handlers.save()} disabled={state.loading || state.submitting}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container mx-auto space-y-6 px-8 py-6">
          <Card className="border-border shadow-xs">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">全局汇率设置</h2>
                  <p className="mt-1 text-sm text-muted-foreground">美元兑人民币（CNY per 1 USD），用于全站价格换算展示。</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>USD → CNY 汇率</Label>
                  <Input
                    value={String(state.exchangeRate)}
                    onChange={(e) => handlers.setExchangeRate(toNumber(e.target.value))}
                    placeholder="例如 7.20"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">顶部促销通栏</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    全站唯一促销展示位。与主内容同宽；配置结束时间后右侧显示黑底白字倒计时块（D / H / M / S）。
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Label className="text-sm">启用</Label>
                  <Switch checked={topBanner.enabled} onCheckedChange={handlers.setTopBannerEnabled} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>活动文案</Label>
                  <Input
                    value={topBanner.message}
                    onChange={(e) => handlers.setTopBannerMessage(e.target.value)}
                    placeholder="例如：暑期大促倒计时，精选分类限时包邮"
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束时间</Label>
                  <Input
                    type="datetime-local"
                    value={toTopPromotionDatetimeLocalValue(topBanner.end_time)}
                    onChange={(e) => handlers.setTopBannerEndTime(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">留空则不显示倒计时；到期后前台自动隐藏通栏。</p>
                </div>
                <div className="space-y-2">
                  <Label>背景色</Label>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
                    <Input
                      type="color"
                      value={topBanner.background_color || '#000000'}
                      onChange={(e) => handlers.setTopBannerBackgroundColor(e.target.value)}
                      className="h-10 w-16 border-0 bg-transparent p-0"
                    />
                    <Input
                      value={topBanner.background_color}
                      onChange={(e) => handlers.setTopBannerBackgroundColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>文字色</Label>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
                    <Input
                      type="color"
                      value={topBanner.text_color || '#ffffff'}
                      onChange={(e) => handlers.setTopBannerTextColor(e.target.value)}
                      className="h-10 w-16 border-0 bg-transparent p-0"
                    />
                    <Input
                      value={topBanner.text_color}
                      onChange={(e) => handlers.setTopBannerTextColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>字号大小</Label>
                  <Select
                    value={fontSizeMode}
                    onValueChange={(val) =>
                      handlers.setTopBannerFontSizePreset(val as 'sm' | 'md' | 'lg' | 'custom')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择字号" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">小（13px）</SelectItem>
                      <SelectItem value="md">中（15px）</SelectItem>
                      <SelectItem value="lg">大（18px）</SelectItem>
                      <SelectItem value="custom">自定义像素</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fontSizeMode === 'custom' ? (
                  <div className="space-y-2">
                    <Label>自定义字号（px）</Label>
                    <Input
                      type="number"
                      min={12}
                      max={48}
                      value={String(fontSizePx)}
                      onChange={(e) => handlers.setTopBannerFontSizePx(toNumber(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">横幅高度随字号自适应，文字垂直居中。</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">效果预览</p>
                <div
                  className="flex w-full items-center gap-3 px-4 py-2.5"
                  style={{
                    backgroundColor: topBanner.background_color || '#000000',
                    color: topBanner.text_color || '#ffffff',
                    fontSize: `${fontSizePx}px`,
                  }}
                >
                  <span className="min-w-0 flex-1 text-center font-bold leading-snug" style={{ fontWeight: 700 }}>
                    {topBanner.message || '请填写活动文案后查看前台展示效果'}
                  </span>
                  {topBanner.end_time ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {['01 D', '10 H', '43 M', '03 S'].map((chunk, index) => {
                        const [value, unit] = chunk.split(' ')
                        return (
                          <React.Fragment key={unit}>
                            {index > 0 ? <span className="px-0.5 text-sm font-bold opacity-80">:</span> : null}
                            <span className="inline-flex min-w-[2.75rem] flex-col items-center justify-center rounded-sm bg-black px-2 py-1 text-white">
                              <span className="font-mono text-[13px] font-bold leading-none">{value}</span>
                              <span className="mt-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-white/80">
                                {unit}
                              </span>
                            </span>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">批发折扣控制</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    开启后前台展示阶梯价表格，并按系数计算批发价（批发价 = 基础价 × 系数）。
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">启用</Label>
                  <Switch checked={config.wholesale.enabled} onCheckedChange={handlers.setWholesaleEnabled} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>批发折扣系数</Label>
                  <Input
                    value={String(config.wholesale.coefficient)}
                    onChange={(e) => handlers.setWholesaleCoefficient(toNumber(e.target.value))}
                    placeholder="例如 0.90"
                    inputMode="decimal"
                    disabled={!config.wholesale.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-base font-bold">折扣活动状态</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  根据当前系统时间自动判定：未开始 / 进行中 / 已结束。开关关闭时显示为已关闭。
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <div className="min-w-[720px]">
                <div className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr_0.8fr] gap-2 border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  <span>折扣项</span>
                  <span>状态</span>
                  <span>开始时间</span>
                  <span>结束时间</span>
                  <span>当前是否生效</span>
                </div>
                {statusRows.map((row) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr_0.8fr] gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="font-medium text-foreground">{row.name}</span>
                    <span>
                      <PromoStatusBadge enabled={row.enabled} startAt={row.startAt} endAt={row.endAt} />
                    </span>
                    <span className="text-muted-foreground">
                      {row.startAt ? new Date(row.startAt).toLocaleString() : '立即生效'}
                    </span>
                    <span className="text-muted-foreground">
                      {row.endAt ? new Date(row.endAt).toLocaleString() : '永久有效'}
                    </span>
                    <span className={row.activeNow ? 'font-medium text-emerald-700' : 'text-muted-foreground'}>
                      {row.activeNow ? '是' : '否'}
                    </span>
                  </div>
                ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">全场折扣</h2>
                  <PromoStatusBadge
                    enabled={config.siteWide.enabled}
                    startAt={config.siteWide.startAt}
                    endAt={config.siteWide.endAt}
                  />
                  <p className="mt-1 w-full text-sm text-muted-foreground">
                    所有客户在活动期内自动享受。先于首单/老客折扣应用在商品小计上。到达开始时间后自动生效。
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Label className="text-sm">启用</Label>
                  <Switch checked={config.siteWide.enabled} onCheckedChange={handlers.setSiteWideEnabled} />
                </div>
              </div>

              <ActivityTimeFields
                startAt={config.siteWide.startAt}
                endAt={config.siteWide.endAt}
                onStartChange={handlers.setSiteWideStartAt}
                onEndChange={handlers.setSiteWideEndAt}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>折扣类型</Label>
                  <Select
                    value={config.siteWide.mode}
                    onValueChange={(val) => handlers.setSiteWideMode(val as 'PERCENT' | 'AMOUNT')}
                    disabled={!config.siteWide.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">按系数（例如 0.90 = 9折）</SelectItem>
                      <SelectItem value="AMOUNT">减免金额（美元）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{config.siteWide.mode === 'AMOUNT' ? '减免金额（USD）' : '折扣系数'}</Label>
                  <Input
                    value={String(config.siteWide.value)}
                    onChange={(e) => handlers.setSiteWideValue(toNumber(e.target.value))}
                    placeholder={config.siteWide.mode === 'AMOUNT' ? '例如 5' : '例如 0.90'}
                    inputMode="decimal"
                    disabled={!config.siteWide.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">首单折扣（新客优惠）</h2>
                  <PromoStatusBadge
                    enabled={config.firstOrder.enabled}
                    startAt={config.firstOrder.startAt}
                    endAt={config.firstOrder.endAt}
                  />
                  <p className="mt-1 w-full text-sm text-muted-foreground">
                    若客户名下已有已付款订单则不可用；第一次结账时自动应用。到达开始时间后自动生效。
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Label className="text-sm">启用</Label>
                  <Switch checked={config.firstOrder.enabled} onCheckedChange={handlers.setFirstOrderEnabled} />
                </div>
              </div>

              <ActivityTimeFields
                startAt={config.firstOrder.startAt}
                endAt={config.firstOrder.endAt}
                onStartChange={handlers.setFirstOrderStartAt}
                onEndChange={handlers.setFirstOrderEndAt}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>折扣类型</Label>
                  <Select
                    value={config.firstOrder.mode}
                    onValueChange={(val) => handlers.setFirstOrderMode(val as 'PERCENT' | 'AMOUNT')}
                    disabled={!config.firstOrder.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">按系数（例如 0.90 = 9折）</SelectItem>
                      <SelectItem value="AMOUNT">减免金额（美元）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{config.firstOrder.mode === 'AMOUNT' ? '减免金额（USD）' : '折扣系数'}</Label>
                  <Input
                    value={String(config.firstOrder.value)}
                    onChange={(e) => handlers.setFirstOrderValue(toNumber(e.target.value))}
                    placeholder={config.firstOrder.mode === 'AMOUNT' ? '例如 5' : '例如 0.90'}
                    inputMode="decimal"
                    disabled={!config.firstOrder.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">老客折扣</h2>
                  <PromoStatusBadge
                    enabled={config.loyal.enabled}
                    startAt={config.loyal.startAt}
                    endAt={config.loyal.endAt}
                  />
                  <p className="mt-1 w-full text-sm text-muted-foreground">
                    非首单客户在结算时默认享受该折扣系数。到达开始时间后自动生效。
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Label className="text-sm">启用</Label>
                  <Switch checked={config.loyal.enabled} onCheckedChange={handlers.setLoyalEnabled} />
                </div>
              </div>
              <ActivityTimeFields
                startAt={config.loyal.startAt}
                endAt={config.loyal.endAt}
                onStartChange={handlers.setLoyalStartAt}
                onEndChange={handlers.setLoyalEndAt}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>老客折扣系数</Label>
                  <Input
                    value={String(config.loyal.coefficient)}
                    onChange={(e) => handlers.setLoyalCoefficient(toNumber(e.target.value))}
                    placeholder="例如 0.95"
                    inputMode="decimal"
                    disabled={!config.loyal.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">阶梯满减（自动优惠券）</h2>
                  <PromoStatusBadge
                    enabled={config.fullReduction.enabled}
                    startAt={config.fullReduction.startAt}
                    endAt={config.fullReduction.endAt}
                  />
                  <p className="mt-1 w-full text-sm text-muted-foreground">
                    结算时按订单商品小计自动匹配最高可用档位。到达开始时间后自动生效。
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Label className="text-sm">启用</Label>
                  <Switch checked={config.fullReduction.enabled} onCheckedChange={handlers.setFullReductionEnabled} />
                </div>
              </div>

              <ActivityTimeFields
                startAt={config.fullReduction.startAt}
                endAt={config.fullReduction.endAt}
                onStartChange={handlers.setFullReductionStartAt}
                onEndChange={handlers.setFullReductionEndAt}
              />

              <div className="space-y-3">
                {tiers.length > 0 ? (
                  <div className="space-y-2">
                    {tiers.map((tier, idx) => (
                      <div key={idx} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
                        <div className="space-y-2">
                          <Label>满（USD）</Label>
                          <Input
                            className="w-40"
                            value={String(tier.thresholdUsd)}
                            onChange={(e) => handlers.updateFullReductionTier(idx, { thresholdUsd: toNumber(e.target.value) })}
                            inputMode="decimal"
                            disabled={!config.fullReduction.enabled}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>减（USD）</Label>
                          <Input
                            className="w-40"
                            value={String(tier.offUsd)}
                            onChange={(e) => handlers.updateFullReductionTier(idx, { offUsd: toNumber(e.target.value) })}
                            inputMode="decimal"
                            disabled={!config.fullReduction.enabled}
                          />
                        </div>
                        <div className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlers.removeFullReductionTier(idx)}
                          disabled={!config.fullReduction.enabled}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无档位配置</p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlers.addFullReductionTier}
                  disabled={!config.fullReduction.enabled}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增档位
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">运费折扣</h2>
                  <PromoStatusBadge
                    enabled={config.shipping.enabled}
                    startAt={config.shipping.startAt}
                    endAt={config.shipping.endAt}
                  />
                  <p className="mt-1 w-full text-sm text-muted-foreground">
                    活动期内对运费打折或减免。系数 0 或减免大于运费时即为免运费。可设商品小计门槛。
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Label className="text-sm">启用</Label>
                  <Switch checked={config.shipping.enabled} onCheckedChange={handlers.setShippingPromoEnabled} />
                </div>
              </div>

              <ActivityTimeFields
                startAt={config.shipping.startAt}
                endAt={config.shipping.endAt}
                onStartChange={handlers.setShippingPromoStartAt}
                onEndChange={handlers.setShippingPromoEndAt}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>折扣类型</Label>
                  <Select
                    value={config.shipping.mode}
                    onValueChange={(val) => handlers.setShippingPromoMode(val as 'PERCENT' | 'AMOUNT')}
                    disabled={!config.shipping.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">按系数（例如 0.90 = 运费9折，0 = 免运费）</SelectItem>
                      <SelectItem value="AMOUNT">减免金额（美元）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{config.shipping.mode === 'AMOUNT' ? '减免金额（USD）' : '折扣系数'}</Label>
                  <Input
                    value={String(config.shipping.value)}
                    onChange={(e) => handlers.setShippingPromoValue(toNumber(e.target.value))}
                    placeholder={config.shipping.mode === 'AMOUNT' ? '例如 8' : '例如 0.90'}
                    inputMode="decimal"
                    disabled={!config.shipping.enabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>满额门槛（USD，0=不限）</Label>
                  <Input
                    value={String(config.shipping.minSubtotalUsd)}
                    onChange={(e) => handlers.setShippingPromoMinSubtotal(toNumber(e.target.value))}
                    placeholder="例如 50"
                    inputMode="decimal"
                    disabled={!config.shipping.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">保存即生效</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    保存后同步写入顶部促销通栏与折扣规则。通栏为全站唯一促销展示位；折扣在启用且活动时间窗内自动生效。
                  </p>
                </div>
                <Button onClick={() => void handlers.save()} disabled={state.loading || state.submitting}>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default PricingPromotionManagementView
