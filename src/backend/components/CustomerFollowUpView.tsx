
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { FollowStatus, FollowTagInterval, RegisteredFollowCustomer } from '@/backend/actions/CustomerFollowUp'
import type { useCustomerFollowUp } from '@/backend/hooks/useCustomerFollowUp'

function phoneDigits(value?: string | null) {
  return String(value || '').replace(/\D/g, '')
}

const STATUS_LABEL: Record<FollowStatus, string> = {
  FOLLOWED: '已跟进',
  DUE: '待跟进',
  SKIP: '不跟进',
}

const TYPE_LABEL: Record<string, string> = {
  NEW_REGISTERED: '新客户',
  NOT_CONVERTED: '未转化',
  FIRST_ORDER: '首单',
  MULTI_ORDER: '多单',
  HIGH_RISK: '高危',
  CHURNED: '流失',
}

function formatWhen(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
}

function money(value: number) {
  return `$${value.toFixed(2)}`
}

function whatsappHref(phone: string | null) {
  let digits = phoneDigits(phone)
  if (digits.length < 6) return ''
  if (!digits.startsWith('1')) digits = `1${digits}`
  return `https://wa.me/${digits}`
}

function PhoneCell({
  row,
  onSave,
  onStatus,
}: {
  row: RegisteredFollowCustomer
  onSave: (row: RegisteredFollowCustomer, phone: string) => void
  onStatus: (row: RegisteredFollowCustomer, status: FollowStatus) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(row.phone || '')
  const openTimer = useRef<number | null>(null)
  useEffect(() => setValue(row.phone || ''), [row.phone])
  if (editing) {
    return (
      <input
        autoFocus
        className="h-8 w-40 rounded border px-2"
        value={value}
        placeholder="手机号"
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          setEditing(false)
          const next = value.trim()
          if (next !== (row.phone || '')) onSave(row, next)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
          if (event.key === 'Escape') {
            setValue(row.phone || '')
            setEditing(false)
          }
        }}
      />
    )
  }
  const href = whatsappHref(row.phone)
  return (
    <span title="双击补充手机号" onDoubleClick={() => setEditing(true)}>
      {href ? (
        <a
          className="text-sky-700 underline"
          href={href}
          onClick={(event) => {
            event.preventDefault()
            if (openTimer.current) window.clearTimeout(openTimer.current)
            openTimer.current = window.setTimeout(() => {
              onStatus(row, 'FOLLOWED')
              window.open(href, '_blank', 'noopener')
            }, 250)
          }}
          onDoubleClick={(event) => {
            event.preventDefault()
            if (openTimer.current) window.clearTimeout(openTimer.current)
            setEditing(true)
          }}
        >
          {row.phone}
        </a>
      ) : (
        <button type="button" className="text-muted-foreground underline decoration-dotted" onDoubleClick={() => setEditing(true)}>
          {row.phone || '—'}
        </button>
      )}
    </span>
  )
}

function CustomerTable({
  rows,
  saving,
  onStatus,
  onLogs,
  onSavePhone,
}: {
  rows: RegisteredFollowCustomer[]
  saving: boolean
  onStatus: (row: RegisteredFollowCustomer, status: FollowStatus) => void
  onLogs: (row: RegisteredFollowCustomer) => void
  onSavePhone: (row: RegisteredFollowCustomer, phone: string) => void
}) {
  if (!rows.length) return <p className="px-4 py-8 text-sm text-muted-foreground">没有客户</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">姓名</th>
            <th className="px-3 py-2 font-medium">手机号</th>
            <th className="px-3 py-2 font-medium">下次跟进</th>
            <th className="px-3 py-2 font-medium">邮箱</th>
            <th className="px-3 py-2 font-medium">客户类型</th>
            <th className="px-3 py-2 font-medium">注册时间</th>
            <th className="px-3 py-2 font-medium">最近登录</th>
            <th className="px-3 py-2 font-medium">购物车金额</th>
            <th className="px-3 py-2 font-medium">跟进频次</th>
            <th className="px-3 py-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            return (
              <tr key={`${row.kind}-${row.id}`} className="border-t">
                <td className="px-3 py-2 font-medium">{row.name}</td>
                <td className="px-3 py-2">
                  <PhoneCell row={row} onSave={onSavePhone} onStatus={onStatus} />
                </td>
                <td className="px-3 py-2">
                  <select
                    className={`h-8 rounded-md border px-2 text-sm font-medium ${row.followStatus === "SKIP" ? "border-red-300 bg-red-100 text-red-800" : row.followStatus === "DUE" ? "border-green-300 bg-green-100 text-green-800" : "border-pink-300 bg-pink-100 text-pink-800"}`}
                    value={row.followStatus}
                    disabled={saving}
                    onChange={(event) => onStatus(row, event.target.value as FollowStatus)}
                  >
                    <option value="FOLLOWED" className="bg-pink-100 text-pink-800">已跟进</option>
                    <option value="DUE" className="bg-green-100 text-green-800">待跟进</option>
                    <option value="SKIP" className="bg-red-100 text-red-800">不跟进</option>
                  </select>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {row.followStatus === 'SKIP' ? '不进入下一轮' : row.followStatus === 'FOLLOWED' ? `下轮 ${formatWhen(row.nextFollowAt)}` : '本轮待跟进'}
                  </div>
                </td>
                <td className="px-3 py-2">{row.email || '—'}</td>
                <td className="px-3 py-2">{row.customerTypeLabel}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatWhen(row.registeredAt)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatWhen(row.lastLoginAt)}</td>
                <td className="px-3 py-2">{money(row.cartUsdTotal)}</td>
                <td className="px-3 py-2">{row.intervalDays} 天</td>
                <td className="px-3 py-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => onLogs(row)}>记录</Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function CustomerFollowUpView(props: ReturnType<typeof useCustomerFollowUp>) {
  const { tags, due, all, loading, saving, active, followedAt, logs, changeStatus, openNext, saveIntervals, showLogs, addPhones, savePhone } = props
  const [draft, setDraft] = useState<FollowTagInterval[] | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | FollowStatus>('')
  const [adding, setAdding] = useState(false)
  const [phones, setPhones] = useState('')
  const intervals = draft || tags

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((row) => {
      if (statusFilter && row.followStatus !== statusFilter) return false
      if (!q) return true
      return [row.name, row.phone, row.email, row.customerTypeLabel].some((value) => String(value || '').toLowerCase().includes(q))
    })
  }, [all, query, statusFilter])

  return (
    <div className="grid gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">客户跟进</h1>
          <p className="mt-1 text-sm text-muted-foreground">已注册及手动添加 {all.length} 人，待跟进 {due.length} 人。购物车金额为美金。到下一次跟进时间后自动回到待跟进。</p>
        </div>
        <Button type="button" disabled={saving || !due.length} onClick={() => void openNext()}>下一位待跟进</Button>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-medium">按客户类型设置跟进频次</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {intervals.map((tag) => (
            <label key={tag.code} className="grid gap-1 text-sm">
              <span>{TYPE_LABEL[tag.code] || tag.name}</span>
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
          <p className="text-sm text-muted-foreground">最近跟进</p>
          <p className="mt-1 text-2xl font-semibold">{formatWhen(followedAt)} · {STATUS_LABEL[active.followStatus]}</p>
          <p className="mt-2 text-sm">{active.name} · {active.phone || '无手机号'} · {active.customerTypeLabel} · 每 {active.intervalDays} 天</p>
          {logs.length ? (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {logs.map((log) => <li key={log.id}>{formatWhen(log.followedAt)}</li>)}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <Input className="max-w-xs" placeholder="搜索姓名、手机号、邮箱、客户类型" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as '' | FollowStatus)}
          >
            <option value="">全部跟进状态</option>
            <option value="FOLLOWED">已跟进</option>
            <option value="DUE">待跟进</option>
            <option value="SKIP">不跟进</option>
          </select>
          <Button type="button" variant={adding ? 'default' : 'outline'} onClick={() => setAdding((value) => !value)}>添加客户</Button>
        </div>
        {adding ? (
          <form
            className="grid gap-2 border-b p-3"
            onSubmit={(event) => {
              event.preventDefault()
              void addPhones(phones).then(() => {
                setPhones('')
                setAdding(false)
              })
            }}
          >
            <Textarea
              rows={5}
              placeholder="批量粘贴手机号，一行一个，也可以用逗号或空格分开"
              value={phones}
              onChange={(event) => setPhones(event.target.value)}
            />
            <div>
              <Button type="submit" disabled={saving || !phones.trim()}>加入跟进表</Button>
            </div>
          </form>
        ) : null}
        {loading ? <p className="px-4 py-8 text-sm text-muted-foreground">正在加载客户…</p> : (
          <CustomerTable rows={filtered} saving={saving} onStatus={(row, status) => void changeStatus(row, status)} onLogs={(row) => void showLogs(row)} onSavePhone={(row, phone) => void savePhone(row, phone)} />
        )}
      </section>
    </div>
  )
}
