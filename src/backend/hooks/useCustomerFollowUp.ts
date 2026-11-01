
'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  addFollowPhones,
  getCustomerFollowLogs,
  getFollowUpBoard,
  setFollowStatus,
  updateTagFollowIntervals,
  type FollowLog,
  type FollowStatus,
  type FollowTagInterval,
  type RegisteredFollowCustomer,
} from '@/backend/actions/CustomerFollowUp'

export function useCustomerFollowUp() {
  const [tags, setTags] = useState<FollowTagInterval[]>([])
  const [due, setDue] = useState<RegisteredFollowCustomer[]>([])
  const [all, setAll] = useState<RegisteredFollowCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [active, setActive] = useState<RegisteredFollowCustomer | null>(null)
  const [followedAt, setFollowedAt] = useState<string | null>(null)
  const [logs, setLogs] = useState<FollowLog[]>([])

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFollowUpBoard()
      if (!res) return
      setTags(res.tags)
      setDue(res.due)
      setAll(res.all)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '客户列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const changeStatus = useCallback(async (customer: RegisteredFollowCustomer, status: FollowStatus) => {
    const res = await setFollowStatus({ id: customer.id, kind: customer.kind, status })
    if (!res) return
    const nextRow: RegisteredFollowCustomer = {
      ...customer,
      followStatus: res.followStatus,
      lastFollowedAt: status === 'FOLLOWED' ? res.followedAt : customer.lastFollowedAt,
      nextFollowAt: res.nextFollowAt,
    }
    const same = (row: RegisteredFollowCustomer) => row.id === customer.id && row.kind === customer.kind
    setAll((rows) => rows.map((row) => (same(row) ? nextRow : row)))
    setDue((rows) => {
      const rest = rows.filter((row) => !same(row))
      return status === 'DUE' ? [nextRow, ...rest] : rest
    })
    if (status === 'FOLLOWED') {
      setFollowedAt(res.followedAt)
      setActive(nextRow)
    }
  }, [])

  const openNext = useCallback(async () => {
    const next = due[0]
    if (!next) {
      toast.message('今天没有待跟进客户')
      return
    }
    await changeStatus(next, 'FOLLOWED')
  }, [due, changeStatus])

  const saveIntervals = useCallback(async (input: FollowTagInterval[]) => {
    setSaving(true)
    const res = await updateTagFollowIntervals(input.map((item) => ({ code: item.code, intervalDays: item.intervalDays })))
    setSaving(false)
    if (!res) return
    setTags(res)
    toast.success('已按客户类型保存跟进频次')
    await reload()
  }, [reload])

  const showLogs = useCallback(async (customer: RegisteredFollowCustomer) => {
    setActive(customer)
    setFollowedAt(customer.lastFollowedAt)
    const res = await getCustomerFollowLogs({ id: customer.id, kind: customer.kind })
    setLogs(res || [])
  }, [])

  const addPhones = useCallback(async (raw: string) => {
    setSaving(true)
    try {
      const res = await addFollowPhones(raw)
      if (!res) return
      toast.success(`已添加 ${res.added} 个，跳过 ${res.skipped} 个重复号码`)
      await reload()
    } finally {
      setSaving(false)
    }
  }, [reload])

  return { tags, due, all, loading, saving, active, followedAt, logs, reload, changeStatus, openNext, saveIntervals, showLogs, addPhones }
}
