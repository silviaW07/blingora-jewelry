'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type {
  ShippingChannelConfigHandlers,
  ShippingChannelConfigState,
} from '@/backend/hooks/useShippingChannelConfig'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, RotateCcw, Trash2, Edit2, ChevronRight, GripVertical } from 'lucide-react'
import {
  SHIPPING_BILLING_MODE_LABELS,
  summarizeCountryRule,
  isExpressRule,
  isParcelBandRule,
  isSeaRule,
  isSeaTierRule,
  calculateShippingFee,
  formatShippingFeeCny,
  normalizeChannelCoefficient,
  type ShippingBillingMode,
} from '@/shared/shippingFeeCalc'
import { DEFAULT_USD_EXCHANGE_RATE, toUsdFromCny } from '@/shared/exchangeRate'
import type { ShippingChannelItem } from '@/backend/actions/ShippingChannelConfig'

interface Props {
  state: ShippingChannelConfigState
  handlers: ShippingChannelConfigHandlers
}

export function ShippingChannelConfigView({ state, handlers }: Props) {
  const billingMode = state.formData?.channel_billingMode || 'EXPRESS_TIER'
  const dragIdRef = useRef<string | null>(null)

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <section className="border-b border-border bg-white">
        <div className="container mx-auto px-8 py-4">
          <nav className="mb-2 flex items-center text-sm font-medium text-muted-foreground">
            <span>首页</span>
            <ChevronRight className="mx-1 h-4 w-4" />
            <span>站点设置</span>
            <ChevronRight className="mx-1 h-4 w-4" />
            <span className="text-foreground">物流渠道配置</span>
          </nav>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-header text-2xl font-bold tracking-tight">物流渠道配置</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                配置快递阶梯价、海运阶梯价或海运按公斤（人民币 ¥），支持渠道系数。前台结账按购物车重量自动计费。拖拽渠道名称左侧手柄可调整前台展示顺序。
              </p>
            </div>
            <Button size="sm" onClick={handlers.openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              新增物流渠道
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container mx-auto px-8 py-6">
          <Card className="border-border shadow-xs">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <Input
                className="h-9 w-64"
                placeholder="搜索渠道名称"
                value={state.inputKeyword}
                onChange={(e) => handlers.setInputKeyword(e.target.value)}
              />
              <Select
                value={state.filterStatus}
                onValueChange={(val) => handlers.setFilterStatus(val as typeof state.filterStatus)}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(state.STATUS_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handlers.handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                查询
              </Button>
              <Button size="sm" variant="outline" onClick={handlers.handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                重置
              </Button>
              <span className="ml-auto text-sm text-muted-foreground">共 {state.total} 条</span>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-background pb-12">
        <div className="container mx-auto px-8">
          <Card className="overflow-hidden border-border shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow>
                    <TableHead className="min-w-[220px] whitespace-normal">渠道名称</TableHead>
                    <TableHead className="min-w-[160px] whitespace-normal">备注</TableHead>
                    <TableHead className="min-w-[120px]">计费模式</TableHead>
                    <TableHead className="min-w-[140px] whitespace-normal">预计时间</TableHead>
                    <TableHead className="w-[90px]">系数</TableHead>
                    <TableHead className="min-w-[220px]">国家运费（¥）</TableHead>
                    <TableHead className="w-[100px]">排序</TableHead>
                    <TableHead className="w-[120px]">启用</TableHead>
                    <TableHead className="w-[160px]">更新时间</TableHead>
                    <TableHead className="sticky right-0 z-10 w-[160px] bg-secondary/50 text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-48 text-center text-muted-foreground">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : state.list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-48 text-center text-muted-foreground">
                        暂无物流渠道，请先新增
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.list.map((item) => {
                      const feeEntries = Object.entries(item.channel_countryFees)
                        .map(([country, rule]) => ({
                          country,
                          enabled: Boolean(summarizeCountryRule(item.channel_billingMode, rule)),
                        }))
                        .filter((row) => row.enabled)
                      return (
                        <TableRow
                          key={item.channel_id}
                          onDragOver={(event) => {
                            if (!state.canReorder) return
                            event.preventDefault()
                            event.dataTransfer.dropEffect = 'move'
                          }}
                          onDrop={(event) => {
                            event.preventDefault()
                            const fromId = dragIdRef.current || event.dataTransfer.getData('text/plain')
                            dragIdRef.current = null
                            void handlers.handleReorder(fromId, item.channel_id)
                          }}
                        >
                          <TableCell className="max-w-[280px] whitespace-normal align-top font-medium">
                            <div className="flex items-start gap-2">
                              <span
                                draggable={state.canReorder}
                                onDragStart={(event) => {
                                  dragIdRef.current = item.channel_id
                                  event.dataTransfer.effectAllowed = 'move'
                                  event.dataTransfer.setData('text/plain', item.channel_id)
                                }}
                                onDragEnd={() => {
                                  dragIdRef.current = null
                                }}
                                className={state.canReorder ? 'mt-0.5 cursor-grab touch-none active:cursor-grabbing' : 'mt-0.5 cursor-default'}
                                title={state.canReorder ? '拖拽调整顺序' : '请先重置搜索和筛选再排序'}
                                aria-label="拖拽调整顺序"
                              >
                                <GripVertical
                                  className={`h-4 w-4 shrink-0 ${state.canReorder ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}
                                  aria-hidden
                                />
                              </span>
                              <span className="min-w-0 break-words whitespace-normal leading-5">
                                {item.channel_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[240px] whitespace-normal align-top text-sm text-muted-foreground">
                            {state.editingNoteId === item.channel_id ? (
                              <Textarea
                                autoFocus
                                rows={2}
                                maxLength={500}
                                value={state.noteDraft}
                                placeholder="双击填写备注"
                                className="min-h-[64px] resize-none text-sm text-foreground"
                                onChange={(event) => handlers.changeInlineNoteDraft(event.target.value)}
                                onBlur={() => {
                                  void handlers.commitInlineNoteEdit(item.channel_id)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Escape') {
                                    event.preventDefault()
                                    handlers.cancelInlineNoteEdit()
                                  }
                                  if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault()
                                    ;(event.currentTarget as HTMLTextAreaElement).blur()
                                  }
                                }}
                              />
                            ) : (
                              <button
                                type="button"
                                className="block min-h-[40px] w-full rounded-md px-1 py-1 text-left hover:bg-muted/60"
                                title="双击编辑备注"
                                onDoubleClick={() => handlers.startInlineNoteEdit(item)}
                              >
                                {item.channel_adminNote ? (
                                  <span className="break-words whitespace-normal leading-5 text-foreground">
                                    {item.channel_adminNote}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50">双击填写</span>
                                )}
                              </button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {SHIPPING_BILLING_MODE_LABELS[item.channel_billingMode] || item.channel_billingMode}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[160px] whitespace-normal break-words">
                            {item.channel_estimatedTime}
                          </TableCell>
                          <TableCell>{item.channel_coefficient.toFixed(2)}</TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="flex max-w-[280px] flex-col items-start gap-1 text-left"
                              onClick={() => handlers.openEditModal(item)}
                            >
                              {feeEntries.length === 0 ? (
                                <span className="text-sm text-muted-foreground">未配置运费</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {feeEntries.slice(0, 3).map(({ country }) => (
                                    <Badge key={country} variant="secondary" className="font-normal">
                                      {country}
                                    </Badge>
                                  ))}
                                  {feeEntries.length > 3 ? (
                                    <Badge variant="outline">+{feeEntries.length - 3}</Badge>
                                  ) : null}
                                </div>
                              )}
                              <span className="text-xs text-primary">点击编辑运费</span>
                            </button>
                          </TableCell>
                          <TableCell>{item.channel_sortWeight}</TableCell>
                          <TableCell>
                            <Switch
                              checked={item.channel_isEnabled}
                              onCheckedChange={(checked) =>
                                handlers.handleQuickUpdateStatus(item.channel_id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.channel_updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="sticky right-0 z-10 bg-background text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlers.openEditModal(item)}
                              >
                                <Edit2 className="mr-1 h-4 w-4" />
                                编辑
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handlers.handleDelete(item.channel_id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <ShippingFeeTester list={state.list} usdExchangeRate={state.usdExchangeRate} />
        </div>
      </section>

      <Dialog open={!!state.formMode} onOpenChange={(open) => !open && handlers.closeFormModal()}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{state.formMode === 'EDIT' ? '编辑物流渠道' : '新增物流渠道'}</DialogTitle>
          </DialogHeader>

          {state.formData ? (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">渠道名称</label>
                  <Input
                    value={state.formData.channel_name}
                    placeholder="如 USPS / UPS / 海运专线"
                    onChange={(e) => handlers.setFormField('channel_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">预计时间</label>
                  <Input
                    value={state.formData.channel_estimatedTime}
                    placeholder="如 3-5 business days"
                    onChange={(e) => handlers.setFormField('channel_estimatedTime', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">西语名称</label>
                  <Input
                    value={state.formData.channel_nameEs || ''}
                    placeholder="客户选西语时展示；留空则按英文名自动翻译"
                    onChange={(e) => handlers.setFormField('channel_nameEs', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">西语预计时间</label>
                  <Input
                    value={state.formData.channel_estimatedTimeEs || ''}
                    placeholder="如 3-5 días hábiles；留空则自动翻译"
                    onChange={(e) => handlers.setFormField('channel_estimatedTimeEs', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium">备注（仅后台可见）</label>
                  <Textarea
                    className="min-h-[72px]"
                    value={state.formData.channel_adminNote || ''}
                    placeholder="给运营看的内部备注，不会出现在客户结账页"
                    maxLength={500}
                    onChange={(e) => handlers.setFormField('channel_adminNote', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">计费模式</label>
                  <Select
                    value={billingMode}
                    onValueChange={(val) => handlers.setBillingMode(val as ShippingBillingMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPRESS_TIER">快递阶梯价</SelectItem>
                      <SelectItem value="PARCEL_BAND">小包区间价（USPS / 爱派）</SelectItem>
                      <SelectItem value="SEA_TIER">海运阶梯价</SelectItem>
                      <SelectItem value="SEA_PER_KG">海运按公斤</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">渠道系数</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={state.formData.channel_coefficient}
                    onChange={(e) =>
                      handlers.setFormField('channel_coefficient', Number(e.target.value) || 1)
                    }
                  />
                  <p className="text-xs text-muted-foreground">最终运费 = 基础运费 × 渠道系数（默认 1.00）</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">排序权重</label>
                  <Input
                    type="number"
                    value={state.formData.channel_sortWeight}
                    onChange={(e) =>
                      handlers.setFormField('channel_sortWeight', Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={state.formData.channel_isEnabled}
                    onCheckedChange={(checked) =>
                      handlers.setFormField('channel_isEnabled', !!checked)
                    }
                  />
                  <span className="text-sm font-medium">启用该渠道</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">按国家设置运费（单位：人民币 ¥）</label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {billingMode === 'EXPRESS_TIER'
                      ? '快递阶梯价：按重量匹配下一档（≤maxKg），取对应固定运费。关闭开关表示该国家不可用。'
                      : billingMode === 'PARCEL_BAND'
                        ? '小包区间价（爱派 USPS）：运费 = 实际重量 × 该档 ¥/kg + 处理费。超过最大重量不可选。可一键填入爱派默认档。'
                      : billingMode === 'SEA_TIER'
                        ? '海运阶梯价：未到体积档按「首重 + 续重」计费；达到体积档后整票重量 × 该档 ¥/kg（不是快递那种固定档价）。例如首重 2kg=100，续重 1kg=28，11kg 起按 27/kg。美西/美中/美东请分国家或分渠道填不同单价。关闭开关表示该国家不可用。'
                        : '海运按公斤：重量 ≤ 起重重量取起重运费；超出部分按续重单价加收。关闭开关表示该国家不可用。'}
                  </p>
                </div>

                <div className="space-y-3">
                  {state.countries.map((country) => {
                    const rule = state.formData?.channel_countryFees?.[country] ?? null
                    const enabled = rule != null
                    return (
                      <div
                        key={country}
                        className="rounded-lg border border-border bg-secondary/20 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{country}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {enabled ? '已启用' : '不可用'}
                            </span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(checked) =>
                                handlers.setCountryEnabled(country, !!checked)
                              }
                            />
                          </div>
                        </div>

                        {!enabled ? (
                          <p className="text-xs text-muted-foreground">该国家暂不提供此渠道</p>
                        ) : billingMode === 'PARCEL_BAND' && isParcelBandRule(rule) ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">最小重量 (kg)</label>
                                <Input
                                  className="h-8"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={String(rule.minKg)}
                                  onChange={(e) =>
                                    handlers.updateParcelBandMeta(country, 'minKg', e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">最大重量 (kg)</label>
                                <Input
                                  className="h-8"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={String(rule.capKg)}
                                  onChange={(e) =>
                                    handlers.updateParcelBandMeta(country, 'capKg', e.target.value)
                                  }
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlers.fillAipaiUspsTiers(country)}
                                >
                                  填入爱派 USPS 默认档
                                </Button>
                              </div>
                            </div>
                            {rule.tiers.map((tier, index) => (
                              <div
                                key={`${country}-parcel-${index}`}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <span className="text-xs text-muted-foreground">≤</span>
                                <Input
                                  className="h-8 w-24"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={String(tier.maxKg)}
                                  onChange={(e) =>
                                    handlers.updateParcelBandTier(
                                      country,
                                      index,
                                      'maxKg',
                                      e.target.value,
                                    )
                                  }
                                />
                                <span className="text-xs text-muted-foreground">kg</span>
                                <Input
                                  className="h-8 w-24"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={String(tier.perKgFee)}
                                  onChange={(e) =>
                                    handlers.updateParcelBandTier(
                                      country,
                                      index,
                                      'perKgFee',
                                      e.target.value,
                                    )
                                  }
                                />
                                <span className="text-xs text-muted-foreground">¥/kg +</span>
                                <Input
                                  className="h-8 w-24"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={String(tier.handlingFee)}
                                  onChange={(e) =>
                                    handlers.updateParcelBandTier(
                                      country,
                                      index,
                                      'handlingFee',
                                      e.target.value,
                                    )
                                  }
                                />
                                <span className="text-xs text-muted-foreground">处理费</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={rule.tiers.length <= 1}
                                  onClick={() => handlers.removeParcelBandTier(country, index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handlers.addParcelBandTier(country)}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              添加区间
                            </Button>
                          </div>
                        ) : billingMode === 'EXPRESS_TIER' && isExpressRule(rule) ? (
                          <div className="space-y-2">
                            {rule.tiers.map((tier, index) => (
                              <div
                                key={`${country}-tier-${index}`}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <span className="text-xs text-muted-foreground">≤</span>
                                <Input
                                  className="h-8 w-24"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={String(tier.maxKg)}
                                  onChange={(e) =>
                                    handlers.updateExpressTier(
                                      country,
                                      index,
                                      'maxKg',
                                      e.target.value,
                                    )
                                  }
                                />
                                <span className="text-xs text-muted-foreground">kg</span>
                                <Input
                                  className="h-8 w-28"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={String(tier.fee)}
                                  onChange={(e) =>
                                    handlers.updateExpressTier(country, index, 'fee', e.target.value)
                                  }
                                />
                                <span className="text-xs text-muted-foreground">¥ 固定</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={rule.tiers.length <= 1}
                                  onClick={() => handlers.removeExpressTier(country, index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handlers.addExpressTier(country)}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              添加阶梯
                            </Button>
                          </div>
                        ) : billingMode === 'SEA_TIER' && isSeaTierRule(rule) ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">首重重量 (kg)</label>
                                <Input
                                  className="h-8"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={String(rule.baseKg)}
                                  onChange={(e) =>
                                    handlers.updateSeaTierMeta(country, 'baseKg', e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">首重运费 (¥)</label>
                                <Input
                                  className="h-8"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={String(rule.baseFee)}
                                  onChange={(e) =>
                                    handlers.updateSeaTierMeta(country, 'baseFee', e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">续重单位 (kg)</label>
                                <Input
                                  className="h-8"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={String(rule.extraUnitKg)}
                                  onChange={(e) =>
                                    handlers.updateSeaTierMeta(country, 'extraUnitKg', e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">续重单价 (¥)</label>
                                <Input
                                  className="h-8"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={String(rule.extraFee)}
                                  onChange={(e) =>
                                    handlers.updateSeaTierMeta(country, 'extraFee', e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">体积档起始重量 (kg)</label>
                              <Input
                                className="h-8 w-32"
                                type="number"
                                step="0.001"
                                min="0"
                                value={String(rule.bulkFromKg)}
                                onChange={(e) =>
                                  handlers.updateSeaTierMeta(country, 'bulkFromKg', e.target.value)
                                }
                              />
                              <p className="text-xs text-muted-foreground">
                                小于此重量：首重 + ceil(超出/续重单位)×续重。达到此重量：整票 kg × 下方档位单价。
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">体积档（¥/kg）</p>
                              {rule.tiers.map((tier, index) => (
                                <div
                                  key={`${country}-sea-bulk-${index}`}
                                  className="flex flex-wrap items-center gap-2"
                                >
                                  <span className="text-xs text-muted-foreground">≤</span>
                                  <Input
                                    className="h-8 w-24"
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={String(tier.maxKg)}
                                    onChange={(e) =>
                                      handlers.updateSeaBulkTier(
                                        country,
                                        index,
                                        'maxKg',
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">kg</span>
                                  <Input
                                    className="h-8 w-28"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={String(tier.perKgFee)}
                                    onChange={(e) =>
                                      handlers.updateSeaBulkTier(
                                        country,
                                        index,
                                        'perKgFee',
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">¥/kg</span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handlers.removeSeaBulkTier(country, index)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handlers.addSeaBulkTier(country)}
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                添加体积档
                              </Button>
                            </div>
                          </div>
                        ) : billingMode === 'SEA_PER_KG' && isSeaRule(rule) ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">起重重量 (kg)</label>
                              <Input
                                className="h-8"
                                type="number"
                                step="0.001"
                                min="0"
                                value={String(rule.baseKg)}
                                onChange={(e) =>
                                  handlers.updateSeaField(country, 'baseKg', e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">起重运费 (¥)</label>
                              <Input
                                className="h-8"
                                type="number"
                                step="0.01"
                                min="0"
                                value={String(rule.baseFee)}
                                onChange={(e) =>
                                  handlers.updateSeaField(country, 'baseFee', e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">续重单价 (¥/kg)</label>
                              <Input
                                className="h-8"
                                type="number"
                                step="0.01"
                                min="0"
                                value={String(rule.perKgFee)}
                                onChange={(e) =>
                                  handlers.updateSeaField(country, 'perKgFee', e.target.value)
                                }
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={handlers.closeFormModal} disabled={state.submitting}>
              取消
            </Button>
            <Button onClick={handlers.handleSubmit} disabled={state.submitting}>
              {state.submitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShippingFeeTester({
  list,
  usdExchangeRate,
}: {
  list: ShippingChannelItem[]
  usdExchangeRate: number
}) {
  const [weightText, setWeightText] = useState('0.5')
  const [channelId, setChannelId] = useState('')
  const [country, setCountry] = useState('')
  const [useDefaultCoef, setUseDefaultCoef] = useState(true)
  const [coefText, setCoefText] = useState('')

  const channel = list.find((item) => item.channel_id === channelId) || list[0] || null

  const countryOptions = useMemo(() => {
    if (!channel) return []
    return Object.entries(channel.channel_countryFees)
      .map(([code, rule]) => ({
        code,
        summary: summarizeCountryRule(channel.channel_billingMode, rule),
      }))
      .filter((row) => Boolean(row.summary))
  }, [channel])

  useEffect(() => {
    if (!channel) {
      setChannelId('')
      setCountry('')
      return
    }
    if (!list.some((item) => item.channel_id === channelId)) {
      setChannelId(channel.channel_id)
    }
    if (!countryOptions.some((row) => row.code === country)) {
      setCountry(countryOptions[0]?.code || '')
    }
  }, [channel, channelId, country, countryOptions, list])

  useEffect(() => {
    if (!channel || !useDefaultCoef) return
    setCoefText(String(channel.channel_coefficient ?? 1))
  }, [channel, useDefaultCoef])

  const weightKg = Number(weightText)
  const coefficient = useDefaultCoef
    ? normalizeChannelCoefficient(channel?.channel_coefficient)
    : normalizeChannelCoefficient(coefText)
  const rate = usdExchangeRate > 0 ? usdExchangeRate : DEFAULT_USD_EXCHANGE_RATE
  const countryRule = channel && country ? channel.channel_countryFees[country] : null
  const cny =
    channel && Number.isFinite(weightKg) && weightKg > 0
      ? calculateShippingFee({
          billingMode: channel.channel_billingMode,
          channelCoefficient: coefficient,
          countryRule,
          weightKg,
        })
      : null
  const usd = cny != null ? toUsdFromCny(cny, rate) : null

  return (
    <Card className="mt-6 border-border shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold">运费测试</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            按已录入渠道的计费规则试算。金额按系统汇率折算美金；系数默认用渠道配置，也可手动覆盖。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">重量（kg）</label>
            <Input
              type="number"
              min="0.001"
              step="0.001"
              value={weightText}
              placeholder="例如 0.5"
              onChange={(e) => setWeightText(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">物流渠道</label>
            <Select
              value={channel?.channel_id || ''}
              onValueChange={(val) => {
                setChannelId(val)
                setUseDefaultCoef(true)
              }}
              disabled={list.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={list.length === 0 ? '请先录入渠道' : '选择渠道'} />
              </SelectTrigger>
              <SelectContent>
                {list.map((item) => (
                  <SelectItem key={item.channel_id} value={item.channel_id}>
                    {item.channel_name}
                    {item.channel_isEnabled ? '' : '（停用）'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">国家</label>
            <Select value={country} onValueChange={setCountry} disabled={!channel || countryOptions.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={countryOptions.length === 0 ? '该渠道未配置国家运费' : '选择国家'} />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((row) => (
                  <SelectItem key={row.code} value={row.code}>
                    {row.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium">系数</label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={useDefaultCoef}
                  onChange={(e) => setUseDefaultCoef(e.target.checked)}
                />
                使用渠道默认
              </label>
            </div>
            <Input
              type="number"
              min="0.0001"
              step="0.01"
              value={coefText}
              disabled={useDefaultCoef || !channel}
              onChange={(e) => {
                setUseDefaultCoef(false)
                setCoefText(e.target.value)
              }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-md border bg-secondary/30 px-4 py-3">
          <div className="space-y-1 text-sm text-muted-foreground">
            {channel ? (
              <>
                <p>
                  计费模式：{SHIPPING_BILLING_MODE_LABELS[channel.channel_billingMode] || channel.channel_billingMode}
                  {country ? ` · ${country}` : ''}
                </p>
                <p>
                  系数 {coefficient.toFixed(2)}
                  {useDefaultCoef ? '（渠道默认）' : '（手动）'}
                  {' · '}
                  汇率 1 USD = {rate.toFixed(2)} CNY
                </p>
              </>
            ) : (
              <p>请先新增并配置物流渠道</p>
            )}
          </div>
          <div className="text-right">
            {cny == null ? (
              <p className="text-sm text-muted-foreground">
                {!channel
                  ? '无法计算'
                  : !Number.isFinite(weightKg) || weightKg <= 0
                    ? '请输入大于 0 的重量'
                    : !country
                      ? '请选择已配置运费的国家'
                      : '该重量超出此渠道可运范围，或该国家未配置有效运费'}
              </p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatShippingFeeCny(cny)}
                  <span className="ml-2 text-base font-medium text-muted-foreground">人民币</span>
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  US$ {usd?.toFixed(2)}
                  <span className="ml-2 text-base font-medium text-muted-foreground">美金</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShippingChannelConfigView
