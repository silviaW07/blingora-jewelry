
'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getCustomerFollowLogs,
  getFollowUpBoard,
  markCustomerFollowed,
  updateTagFollowIntervals,
  type FollowLog,
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
      toast.error(error instanceof Error ? error.message : "客户列表加载失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const openCustomer = useCallback(async (customer: RegisteredFollowCustomer) => {
    setSaving(true)
    const res = await markCustomerFollowed({ id: customer.id })
    setSaving(false)
    if (!res) return
    setFollowedAt(res.followedAt)
    setLogs(res.logs)
    setActive({ ...customer, lastFollowedAt: res.followedAt, nextFollowAt: res.nextFollowAt, due: false })
    toast.success('已记录本次跟进时间')
    await reload()
  }, [reload])

  const openNext = useCallback(async () => {
    const next = due[0]
    if (!next) {
      toast.message('今天没有待跟进客户')
      return
    }
    await openCustomer(next)
  }, [due, openCustomer])

  const saveIntervals = useCallback(async (input: FollowTagInterval[]) => {
    setSaving(true)
    const res = await updateTagFollowIntervals(input.map((item) => ({ code: item.code, intervalDays: item.intervalDays })))
    setSaving(false)
    if (!res) return
    setTags(res)
    toast.success('已按标签保存跟进频次')
    await reload()
  }, [reload])

  const showLogs = useCallback(async (customer: RegisteredFollowCustomer) => {
    setActive(customer)
    setFollowedAt(customer.lastFollowedAt)
    const res = await getCustomerFollowLogs(customer.id)
    setLogs(res || [])
  }, [])

  return { tags, due, all, loading, saving, active, followedAt, logs, reload, openCustomer, openNext, saveIntervals, showLogs }
}
