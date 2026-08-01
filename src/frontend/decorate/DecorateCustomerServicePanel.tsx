'use client'

import React from 'react'
import { MessageCircle, ChevronDown, ChevronUp, Move, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDecorateMode } from './DecorateContext'
import { describeFloatCoordinates, normalizeWhatsappNumber } from './customerService'

export function DecorateCustomerServicePanel() {
  const {
    customerService,
    updateCustomerService,
    isFloatDragMode,
    setFloatDragMode,
  } = useDecorateMode()
  const [expanded, setExpanded] = React.useState(true)
  const coords = describeFloatCoordinates(customerService)

  return (
    <div
      className="fixed bottom-4 left-4 z-[105] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#93C5FD] bg-white/95 shadow-[0_18px_40px_-24px_rgba(37,99,235,0.55)] backdrop-blur"
      data-controller-name="可视化装修客服配置"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 bg-[#EFF6FF] px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[#1D4ED8]">
          <MessageCircle className="size-4" />
          客服配置
        </span>
        {expanded ? (
          <ChevronDown className="size-4 text-[#1D4ED8]" />
        ) : (
          <ChevronUp className="size-4 text-[#1D4ED8]" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="cs-whatsapp" className="text-xs font-semibold text-[#334155]">
              客服号码（纯数字，含国家码）
            </Label>
            <Input
              id="cs-whatsapp"
              value={customerService.whatsappNumber}
              placeholder="8613500529627"
              className="h-10"
              onChange={(e) =>
                updateCustomerService({ whatsappNumber: normalizeWhatsappNumber(e.target.value) })
              }
            />
            <p className="text-[11px] text-[#64748B]">
              示例：8613500529627 → https://wa.me/8613500529627
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e2e8f0] px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold text-[#334155]">全站悬浮开关</p>
              <p className="text-[11px] text-[#64748B]">启用后在全站显示 WhatsApp 悬浮按钮</p>
            </div>
            <Switch
              checked={customerService.floatEnabled}
              onCheckedChange={(checked) => updateCustomerService({ floatEnabled: Boolean(checked) })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cs-size" className="text-xs font-semibold text-[#334155]">
                悬浮图标尺寸
              </Label>
              <span className="text-xs font-semibold text-[#1D4ED8]">{customerService.floatSize}px</span>
            </div>
            <input
              id="cs-size"
              type="range"
              min={40}
              max={96}
              step={2}
              value={customerService.floatSize}
              className="w-full accent-[#2563EB]"
              onChange={(e) => updateCustomerService({ floatSize: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2 rounded-xl border border-[#BFDBFE] bg-[#F8FBFF] p-3">
            <div className="flex items-center gap-2">
              <Crosshair className="size-3.5 text-[#2563EB]" />
              <Label className="text-xs font-semibold text-[#334155]">悬浮图标位置（自由拖拽）</Label>
            </div>
            <Button
              type="button"
              className={`h-10 w-full text-sm font-semibold ${
                isFloatDragMode
                  ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                  : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
              }`}
              onClick={() => setFloatDragMode(!isFloatDragMode)}
            >
              <Move className="mr-2 size-4" />
              {isFloatDragMode ? '退出拖拽模式' : '进入拖拽模式'}
            </Button>
            <p className="text-[11px] leading-5 text-[#64748B]">
              {isFloatDragMode
                ? '请拖动悬浮图标；松开后坐标会立即写入数据库并同步到下方显示。'
                : '点击进入后，可把悬浮图标拖到屏幕任意位置（角落、四边或中央）。'}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  {coords.horizontalLabel}
                </p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-[#0F172A]">
                  {coords.horizontalValue}
                  <span className="ml-0.5 text-xs font-medium text-[#64748B]">px</span>
                </p>
              </div>
              <div className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                  {coords.verticalLabel}
                </p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-[#0F172A]">
                  {coords.verticalValue}
                  <span className="ml-0.5 text-xs font-medium text-[#64748B]">px</span>
                </p>
              </div>
            </div>
            <p className="text-[10px] text-[#94A3B8]">
              系统按更靠近的边自动选择 left/right 与 top/bottom；拖拽结束即持久化，刷新后仍保留。
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cs-guide" className="text-xs font-semibold text-[#334155]">
              下单成功弹窗引导语
            </Label>
            <Input
              id="cs-guide"
              value={customerService.successGuideText}
              className="h-10"
              onChange={(e) => updateCustomerService({ successGuideText: e.target.value })}
            />
          </div>

          <p className="text-[11px] leading-5 text-[#64748B]">
            悬浮位置在拖拽松开时已自动保存；号码/尺寸等其它项可点顶栏「发布并退出装修」一并同步。
          </p>
        </div>
      ) : null}
    </div>
  )
}
