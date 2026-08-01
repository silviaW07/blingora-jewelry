'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CHECKOUT_COUNTRIES } from '@/shared/shippingCountries'
import {
  DEFAULT_CHANNEL_COEFFICIENT,
  DEFAULT_SEA_BASE_KG,
  emptyExpressRule,
  emptySeaRule,
  type CountryRuleMap,
  type ExpressCountryRule,
  type SeaCountryRule,
  type ShippingBillingMode,
} from '@/shared/shippingFeeCalc'
import type {
  SaveShippingChannelInput,
  ShippingChannelFilterStatus,
  ShippingChannelItem,
} from '@/backend/actions/ShippingChannelConfig'
import {
  deleteShippingChannel,
  getShippingChannelList,
  saveShippingChannel,
  updateShippingChannelStatus,
} from '@/backend/actions/ShippingChannelConfig'

type FormMode = 'CREATE' | 'EDIT' | null

function emptyFees(mode: ShippingBillingMode): CountryRuleMap {
  return Object.fromEntries(
    CHECKOUT_COUNTRIES.map((country) => [
      country,
      mode === 'SEA_PER_KG' ? emptySeaRule() : emptyExpressRule(),
    ]),
  )
}

function createEmptyForm(): SaveShippingChannelInput {
  return {
    channel_name: '',
    channel_estimatedTime: '',
    channel_billingMode: 'EXPRESS_TIER',
    channel_coefficient: DEFAULT_CHANNEL_COEFFICIENT,
    channel_countryFees: emptyFees('EXPRESS_TIER'),
    channel_isEnabled: true,
    channel_sortWeight: 0,
  }
}

export interface ShippingChannelConfigState {
  loading: boolean
  list: ShippingChannelItem[]
  total: number
  countries: string[]
  inputKeyword: string
  filterStatus: ShippingChannelFilterStatus
  formMode: FormMode
  formData: SaveShippingChannelInput | null
  submitting: boolean
  STATUS_LABELS: Record<ShippingChannelFilterStatus, string>
}

export interface ShippingChannelConfigHandlers {
  setInputKeyword: (val: string) => void
  setFilterStatus: (val: ShippingChannelFilterStatus) => void
  handleSearch: () => void
  handleReset: () => void
  openCreateModal: () => void
  openEditModal: (item: ShippingChannelItem) => void
  closeFormModal: () => void
  setFormField: <K extends keyof SaveShippingChannelInput>(
    key: K,
    value: SaveShippingChannelInput[K],
  ) => void
  setBillingMode: (mode: ShippingBillingMode) => void
  setCountryEnabled: (country: string, enabled: boolean) => void
  setExpressTier: (country: string, tiers: ExpressCountryRule['tiers']) => void
  addExpressTier: (country: string) => void
  removeExpressTier: (country: string, index: number) => void
  updateExpressTier: (
    country: string,
    index: number,
    field: 'maxKg' | 'fee',
    value: string,
  ) => void
  updateSeaField: (
    country: string,
    field: keyof SeaCountryRule,
    value: string,
  ) => void
  handleSubmit: () => Promise<void>
  handleDelete: (id: string) => Promise<void>
  handleQuickUpdateStatus: (id: string, enabled: boolean) => Promise<void>
}

export function useShippingChannelConfig() {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<ShippingChannelItem[]>([])
  const [total, setTotal] = useState(0)
  const [countries, setCountries] = useState<string[]>([...CHECKOUT_COUNTRIES])
  const [inputKeyword, setInputKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState<ShippingChannelFilterStatus>('ALL')
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [formData, setFormData] = useState<SaveShippingChannelInput | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getShippingChannelList({
        search_keyword: appliedKeyword,
        filter_status: filterStatus,
      })
      setList(result.list)
      setTotal(result.total)
      setCountries(result.countries?.length ? result.countries : [...CHECKOUT_COUNTRIES])
    } catch (error) {
      toast.error((error as Error).message || '加载物流渠道失败')
    } finally {
      setLoading(false)
    }
  }, [appliedKeyword, filterStatus])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const handlers: ShippingChannelConfigHandlers = {
    setInputKeyword,
    setFilterStatus,
    handleSearch: () => setAppliedKeyword(inputKeyword.trim()),
    handleReset: () => {
      setInputKeyword('')
      setAppliedKeyword('')
      setFilterStatus('ALL')
    },
    openCreateModal: () => {
      setFormMode('CREATE')
      setFormData(createEmptyForm())
    },
    openEditModal: (item) => {
      setFormMode('EDIT')
      const mode = item.channel_billingMode || 'EXPRESS_TIER'
      const merged: CountryRuleMap = { ...emptyFees(mode) }
      for (const country of CHECKOUT_COUNTRIES) {
        const existing = item.channel_countryFees?.[country]
        merged[country] = existing ?? null
      }
      // 保留非标准国家
      for (const [country, rule] of Object.entries(item.channel_countryFees || {})) {
        if (!(country in merged)) merged[country] = rule
      }
      setFormData({
        channel_id: item.channel_id,
        channel_name: item.channel_name,
        channel_estimatedTime: item.channel_estimatedTime,
        channel_billingMode: mode,
        channel_coefficient: item.channel_coefficient ?? DEFAULT_CHANNEL_COEFFICIENT,
        channel_countryFees: merged,
        channel_isEnabled: item.channel_isEnabled,
        channel_sortWeight: item.channel_sortWeight,
      })
    },
    closeFormModal: () => {
      setFormMode(null)
      setFormData(null)
    },
    setFormField: (key, value) => {
      setFormData((prev) => (prev ? { ...prev, [key]: value } : prev))
    },
    setBillingMode: (mode) => {
      setFormData((prev) => {
        if (!prev) return prev
        const nextFees: CountryRuleMap = {}
        for (const country of Object.keys(prev.channel_countryFees)) {
          const current = prev.channel_countryFees[country]
          if (current == null) {
            nextFees[country] = null
            continue
          }
          if (mode === 'SEA_PER_KG') {
            if ('baseFee' in current) {
              nextFees[country] = current
            } else if ('tiers' in current && current.tiers[0]) {
              nextFees[country] = {
                baseKg: DEFAULT_SEA_BASE_KG,
                baseFee: current.tiers[0].fee,
                perKgFee: 0,
              }
            } else {
              nextFees[country] = emptySeaRule()
            }
          } else if ('tiers' in current) {
            nextFees[country] = current
          } else if ('baseFee' in current) {
            nextFees[country] = {
              tiers: [{ maxKg: 12, fee: current.baseFee }],
            }
          } else {
            nextFees[country] = emptyExpressRule()
          }
        }
        return {
          ...prev,
          channel_billingMode: mode,
          channel_countryFees: nextFees,
        }
      })
    },
    setCountryEnabled: (country, enabled) => {
      setFormData((prev) => {
        if (!prev) return prev
        const mode = prev.channel_billingMode
        const nextFees = { ...prev.channel_countryFees }
        nextFees[country] = enabled
          ? mode === 'SEA_PER_KG'
            ? emptySeaRule()
            : emptyExpressRule()
          : null
        return { ...prev, channel_countryFees: nextFees }
      })
    },
    setExpressTier: (country, tiers) => {
      setFormData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          channel_countryFees: {
            ...prev.channel_countryFees,
            [country]: { tiers },
          },
        }
      })
    },
    addExpressTier: (country) => {
      setFormData((prev) => {
        if (!prev) return prev
        const rule = prev.channel_countryFees[country]
        const tiers =
          rule && 'tiers' in rule
            ? [...rule.tiers]
            : [{ maxKg: 0.5, fee: 0 }]
        const last = tiers[tiers.length - 1]
        tiers.push({
          maxKg: last ? Number((last.maxKg + 0.5).toFixed(3)) : 0.5,
          fee: last ? last.fee : 0,
        })
        return {
          ...prev,
          channel_countryFees: {
            ...prev.channel_countryFees,
            [country]: { tiers },
          },
        }
      })
    },
    removeExpressTier: (country, index) => {
      setFormData((prev) => {
        if (!prev) return prev
        const rule = prev.channel_countryFees[country]
        if (!rule || !('tiers' in rule)) return prev
        const tiers = rule.tiers.filter((_, i) => i !== index)
        return {
          ...prev,
          channel_countryFees: {
            ...prev.channel_countryFees,
            [country]: tiers.length ? { tiers } : emptyExpressRule(),
          },
        }
      })
    },
    updateExpressTier: (country, index, field, value) => {
      setFormData((prev) => {
        if (!prev) return prev
        const rule = prev.channel_countryFees[country]
        if (!rule || !('tiers' in rule)) return prev
        const tiers = rule.tiers.map((tier, i) => {
          if (i !== index) return tier
          const trimmed = value.trim()
          const num = trimmed === '' ? 0 : Number(trimmed)
          return {
            ...tier,
            [field]: Number.isFinite(num) ? num : 0,
          }
        })
        return {
          ...prev,
          channel_countryFees: {
            ...prev.channel_countryFees,
            [country]: { tiers },
          },
        }
      })
    },
    updateSeaField: (country, field, value) => {
      setFormData((prev) => {
        if (!prev) return prev
        const rule = prev.channel_countryFees[country]
        const base: SeaCountryRule =
          rule && 'baseFee' in rule ? { ...rule } : emptySeaRule()
        const trimmed = value.trim()
        const num = trimmed === '' ? 0 : Number(trimmed)
        return {
          ...prev,
          channel_countryFees: {
            ...prev.channel_countryFees,
            [country]: {
              ...base,
              [field]: Number.isFinite(num) ? num : 0,
            },
          },
        }
      })
    },
    handleSubmit: async () => {
      if (!formData) return
      setSubmitting(true)
      try {
        await saveShippingChannel(formData)
        toast.success(formMode === 'EDIT' ? '渠道已更新' : '渠道已新增')
        setFormMode(null)
        setFormData(null)
        await fetchList()
      } catch (error) {
        toast.error((error as Error).message || '保存失败')
      } finally {
        setSubmitting(false)
      }
    },
    handleDelete: async (id) => {
      if (!window.confirm('确认删除该物流渠道？')) return
      try {
        await deleteShippingChannel({ channel_id: id })
        toast.success('渠道已删除')
        await fetchList()
      } catch (error) {
        toast.error((error as Error).message || '删除失败')
      }
    },
    handleQuickUpdateStatus: async (id, enabled) => {
      try {
        await updateShippingChannelStatus({ channel_id: id, channel_isEnabled: enabled })
        toast.success(enabled ? '已启用' : '已停用')
        await fetchList()
      } catch (error) {
        toast.error((error as Error).message || '状态更新失败')
      }
    },
  }

  const state: ShippingChannelConfigState = useMemo(
    () => ({
      loading,
      list,
      total,
      countries,
      inputKeyword,
      filterStatus,
      formMode,
      formData,
      submitting,
      STATUS_LABELS: {
        ALL: '全部',
        ENABLED: '已启用',
        DISABLED: '已停用',
      },
    }),
    [loading, list, total, countries, inputKeyword, filterStatus, formMode, formData, submitting],
  )

  return { state, handlers }
}
