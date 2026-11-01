
'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FollowTagInterval, RegisteredFollowCustomer } from '@/backend/actions/CustomerFollowUp'
import type { useCustomerFollowUp } from '@/backend/hooks/useCustomerFollowUp'

function formatWhen(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
}

function money(value: number) {
  return `$${value.toFixed(2)}`
}

function CustomerTable({
  rows,
  saving,
  onFollow,
  onLogs,
}: {
  rows: RegisteredFollowCustomer[]
  saving: boolean
  onFollow: (row: RegisteredFollowCustomer) => void
  onLogs: (row: RegisteredFollowCustomer) => void
}) {
  if (!rows.length) return <p className="px-4 py-8 text-sm text-muted-foreground">没有客户</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">姓名</th>
            <th className="px-3 py-2 font-medium">手机号</th>
            <th className="px-3 py-2 font-medium">邮箱</th>
            <th className="px-3 py-2 font-medium">标签</th>
            <th className="px-3 py-2 font-medium">注册时间</th>
            <th className="px-3 py-2 font-medium">最近登录</th>
            <th className="px-3 py-2 font-medium">购物车金额</th>
            <th className="px-3 py-2 font-medium">跟进频次</th>
            <th className="px-3 py-2 font-medium">下次跟进</th>
            <th className="px-3 py-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="px-3 py-2 font-medium">{row.name}</td>
              <td className="px-3 py-2">{row.phone || '—'}</td>
              <td className="px-3 py-2">{row.email}</td>
              <td className="px-3 py-2">{row.tagName || '未标记'}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatWhen(row.registeredAt)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatWhen(row.lastLoginAt)}</td>
              <td className="px-3 py-2">{money(row.cartUsdTotal)}</td>
              <td className="px-3 py-2">{row.intervalDays} 天</td>
              <td className="px-3 py-2 whitespace-nowrap">{row.lastFollowedAt ? formatWhen(row.nextFollowAt) : '待首次跟进'}</td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <Button type="button" size="sm" disabled={saving} onClick={() => onFollow(row)}>跟进</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onLogs(row)}>记录</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CustomerFollowUpView(props: ReturnType<typeof useCustomerFollowUp>) {
  const { tags, due, all, loading, saving, active, followedAt, logs, openCustomer, openNext, saveIntervals, showLogs } = props
  const [draft, setDraft] = useState<FollowTagInterval[] | null>(null)
  const [query, setQuery] = useState('')
  const [onlyDue, setOnlyDue] = useState(false)
  const intervals = draft || tags

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((row) => {
      if (onlyDue && !row.due) return false
      if (!q) return true
      return [row.name, row.phone, row.email, row.tagName].some((value) => String(value || '').toLowerCase().includes(q))
    })
  }, [all, onlyDue, query])

  return (
    <div className="grid gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">客户跟进</h1>
          <p className="mt-1 text-sm text-muted-foreground">已注册客户 {all.length} 人，今日待跟进 {due.length} 人。购物车金额为美金。</p>
        </div>
        <Button type="button" disabled={saving || !due.length} onClick={() => void openNext()}>下一位待跟进</Button>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-medium">按标签设置跟进频次</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {intervals.map((tag) => (
            <label key={tag.code} className="grid gap-1 text-sm">
              <span>{tag.name}</span>
              <Input
                type="number"
                min={1}
                max={365}
                value={tag.intervalDays}
                onChange={(event) => {
                  const next = intervals.map((item) => item.code === tag.code ? { ...item, intervalDays: Number(event.target.value) } : item)
                  setDraft(next)
                }}
              />
            </label>
          ))}
        </div>
        <Button className="mt-3" type="button" disabled={saving || !intervals.length} onClick={() => void saveIntervals(intervals).then(() => setDraft(null))}>
          保存频次
        </Button>
      </section>

      {active ? (
        <section className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">本次跟进时间</p>
          <p className="mt-1 text-2xl font-semibold">{formatWhen(followedAt)}</p>
          <p className="mt-2 text-sm">{active.name} · {active.phone || '无手机号'} · {active.email} · {active.tagName || '未标记'} · 每 {active.intervalDays} 天</p>
          <p className="mt-1 text-sm text-muted-foreground">下次跟进 {formatWhen(active.nextFollowAt)}</p>
          {logs.length ? (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {logs.map((log) => <li key={log.id}>{formatWhen(log.followedAt)}</li>)}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <Input className="max-w-xs" placeholder="搜索姓名、手机号、邮箱、标签" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button type="button" variant={onlyDue ? 'default' : 'outline'} onClick={() => setOnlyDue((value) => !value)}>
            {onlyDue ? '只看今日待跟进' : '显示全部客户'}
          </Button>
        </div>
        {loading ? <p className="px-4 py-8 text-sm text-muted-foreground">正在加载客户…</p> : (
          <CustomerTable rows={filtered} saving={saving} onFollow={(row) => void openCustomer(row)} onLogs={(row) => void showLogs(row)} />
        )}
      </section>
    </div>
  )
}
