'use client'

import React from 'react'
import type { ImportFrom1688State, ImportFrom1688Handlers } from '@/backend/hooks/useImportFrom1688'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Info, Link2, RefreshCw } from 'lucide-react'
import type { ProductStatusType } from '@/backend/actions/ImportFrom1688'
import { CategoryCascadeSelect } from '@/backend/components/CategoryCascadeSelect'

const PRODUCT_STATUS_LABELS: Record<ProductStatusType, string> = {
  DRAFT: '待上传',
  ACTIVE: '上架',
  INACTIVE: '下架',
}

const PARSE_READY_STATUSES = new Set(['PENDING', 'RETRY_PENDING', 'RATE_LIMITED'])

interface Props {
  state: ImportFrom1688State
  handlers: ImportFrom1688Handlers
}

/**
 * 1688 链接导入核心表单（从 ImportFrom1688 工作台原样抽出，供独立页与商品管理弹窗复用）
 */
export function ImportFrom1688LinkImportPanel({ state, handlers }: Props) {
  const parseTargetId =
    state.pendingParseTaskId ||
    (state.currentTask && PARSE_READY_STATUSES.has(state.currentTask.task_status)
      ? state.currentTask.task_id
      : null)
  const canStartParse = Boolean(parseTargetId) && !state.isSubmitting && !state.isParsingTask

  return (
    <Card className="shadow-sm border-border overflow-hidden" data-controller-name="1688链接导入任务表单">
      <CardHeader className="bg-secondary/50 border-b py-4">
        <CardTitle className="text-base font-header flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          1688 链接导入任务
        </CardTitle>
        <CardDescription>
          分两步：先提交链接，本机采集器抓页后再点解析（服务器无法直接打开 1688）。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1">
            1688 商品源链接
            <Info className="w-3 h-3 text-muted-foreground" />
          </label>
          <Textarea
            value={state.createForm.urls}
            onChange={(e) => handlers.handleCreateFormChange('urls', e.target.value)}
            placeholder="请输入 URL，支持多行批量粘贴"
            className="min-h-[120px] resize-none focus-visible:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">默认分类</label>
            <CategoryCascadeSelect
              options={state.categoryOptions}
              value={state.createForm.defaultCategoryId}
              onValueChange={(val) => handlers.handleCreateFormChange('defaultCategoryId', val)}
              placeholder="选择导入分类"
            />
            <p className="text-xs text-muted-foreground">
              建议必选。选择细分品类，系统将自动归属到对应一级大类。未设置时链接仍可提交，但发布会因缺少目标分类失败。
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">成本减法 (USD)</label>
            <Input
              type="number"
              value={state.createForm.costDeductionUsd}
              onChange={(e) =>
                handlers.handleCreateFormChange('costDeductionUsd', e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="0"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              导入时会先从抓取原价中扣减这里的金额，再按目标分类系数自动生成售价。
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">默认导入状态</label>
            <Select
              value={state.createForm.defaultStatus}
              onValueChange={(val) => handlers.handleCreateFormChange('defaultStatus', val as ProductStatusType)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="rounded-none">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">默认库存数量</label>
            <Input
              type="number"
              value={state.createForm.stockStrategyStock}
              onChange={(e) =>
                handlers.handleCreateFormChange(
                  'stockStrategyStock',
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              placeholder="留空即不限库存"
              className="h-10"
            />
          </div>
        </div>

        {state.createFormCategoryWarning ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>请先补充默认分类</AlertTitle>
            <AlertDescription>{state.createFormCategoryWarning}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>推荐流程：提交 → 本机采集 → 解析</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>
                1）点「提交链接」只创建任务，不会立刻抓 1688。2）本机双击
                deploy/collect-1688.bat（或 pnpm run collect:1688）用已登录 Chrome 抓页并上传。3）回到这里点「开始解析」。
              </p>
              <p className="text-muted-foreground">
                采集与解析之间不要重启 rpc（收件箱在内存里）。解析失败可再采集后点「重新解析」。
              </p>
            </AlertDescription>
          </Alert>
        )}

        {state.isSubmitting ? (
          <Alert>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertTitle>正在提交链接</AlertTitle>
            <AlertDescription>正在创建导入任务，请稍候…</AlertDescription>
          </Alert>
        ) : null}

        {state.isParsingTask ? (
          <Alert>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertTitle>正在解析</AlertTitle>
            <AlertDescription>
              系统正在用已采集的页面解析商品。完成后会出现在【待上传区】。
            </AlertDescription>
          </Alert>
        ) : null}

        {state.pendingParseTaskId && !state.isParsingTask ? (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>链接已提交，等待采集后解析</AlertTitle>
            <AlertDescription>
              任务 {state.pendingParseTaskId.slice(0, 8)}… 已创建。请先完成本机采集，再点「开始解析」。
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="h-11 bg-primary hover:bg-primary text-primary-foreground font-semibold"
            onClick={handlers.handleCreateTask}
            disabled={state.isSubmitting || state.isParsingTask || !state.createForm.urls.trim()}
          >
            {state.isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            {state.isSubmitting ? '提交中…' : '提交链接'}
          </Button>
          <Button
            variant="outline"
            className="h-11 font-semibold"
            onClick={() => handlers.handleStartParseTask(parseTargetId || undefined)}
            disabled={!canStartParse}
          >
            {state.isParsingTask ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            {state.isParsingTask ? '解析中…' : '开始解析'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ImportFrom1688LinkImportPanel
