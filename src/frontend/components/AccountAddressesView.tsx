'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AccountShell } from '@/frontend/components/AccountShell'
import { useTranslation } from 'react-i18next'
import {
  deleteCustomerAddress,
  listCustomerAddresses,
  saveCustomerAddress,
  setDefaultCustomerAddress,
  type CustomerAddress,
  type SaveCustomerAddressInput,
} from '@/frontend/actions/AccountCenter'

const emptyForm = (): SaveCustomerAddressInput => ({
  recipientName: '',
  phone: '',
  countryCode: 'CN',
  countryName: '中国',
  stateName: '',
  cityName: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  isDefault: false,
})

export default function AccountAddressesView() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [list, setList] = useState<CustomerAddress[]>([])
  const [form, setForm] = useState<SaveCustomerAddressInput>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCustomerAddresses()
      setList(res.list || [])
    } catch (error) {
      toast.error((error as Error).message || '加载地址失败')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const startEdit = (row: CustomerAddress) => {
    setEditingId(row.addressId)
    setForm({
      addressId: row.addressId,
      recipientName: row.recipientName,
      phone: row.phone,
      countryCode: row.countryCode,
      countryName: row.countryName,
      stateName: row.stateName,
      cityName: row.cityName,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      postalCode: row.postalCode,
      isDefault: row.isDefault,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveCustomerAddress({
        ...form,
        addressId: editingId || undefined,
      })
      toast.success(editingId ? '地址已更新' : '地址已新增')
      startCreate()
      await load()
    } catch (error) {
      toast.error((error as Error).message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('确认删除该收货地址？')) return
    try {
      await deleteCustomerAddress({ addressId })
      toast.success('地址已删除')
      if (editingId === addressId) startCreate()
      await load()
    } catch (error) {
      toast.error((error as Error).message || '删除失败')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    setSettingDefaultId(addressId)
    const previous = list
    setList((rows) =>
      rows.map((row) => ({ ...row, isDefault: row.addressId === addressId })),
    )
    try {
      await setDefaultCustomerAddress({ addressId })
      toast.success(t('accountAddresses.defaultUpdated'))
    } catch (error) {
      setList(previous)
      toast.error((error as Error).message || t('accountAddresses.defaultUpdateFailed'))
    } finally {
      setSettingDefaultId(null)
    }
  }

  return (
    <AccountShell
      title={t('accountAddresses.title')}
      description={t('accountAddresses.description')}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1f1a14]">我的地址</h2>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={startCreate}>
              <Plus className="mr-1.5 size-3.5" />
              新建
            </Button>
          </div>

          {loading ? (
            <div className="flex min-h-[180px] items-center justify-center gap-2 text-sm text-[#7a756c]">
              <Loader2 className="size-4 animate-spin" />
              正在读取地址...
            </div>
          ) : list.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#e0d8cb] bg-[#fbfaf7] text-center">
              <MapPin className="size-8 text-[#d4cdc0]" />
              <p className="text-sm text-[#6f6558]">{t('accountAddresses.empty')}</p>
            </div>
          ) : (
            list.map((row) => (
              <article key={row.addressId} className="rounded-[22px] border border-[#ebe6dc] bg-[#fbfaf7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain">
                    <p className="whitespace-nowrap text-sm font-semibold text-[#1f1a14]">
                      {row.recipientName}
                      {row.phone ? <span className="ml-2 font-normal text-[#6f6558]">{row.phone}</span> : null}
                    </p>
                    <p className="mt-2 whitespace-nowrap text-sm leading-6 text-[#5c554c] md:whitespace-normal">
                      {row.countryName}
                      {row.stateName ? ` · ${row.stateName}` : ''}
                      {row.cityName ? ` · ${row.cityName}` : ''}
                      <br className="hidden md:block" />
                      <span className="md:inline"> </span>
                      {row.addressLine1}
                      {row.addressLine2 ? ` ${row.addressLine2}` : ''}
                      {row.postalCode ? ` (${row.postalCode})` : ''}
                    </p>
                    {row.isDefault ? (
                      <Badge variant="outline" className="mt-2 border-emerald-200 bg-emerald-50 text-emerald-700">
                        {t('accountAddresses.defaultBadge')}
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 rounded-full"
                        disabled={settingDefaultId === row.addressId}
                        onClick={() => void handleSetDefault(row.addressId)}
                      >
                        {settingDefaultId === row.addressId
                          ? t('accountAddresses.settingDefault')
                          : t('accountAddresses.setDefault')}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => startEdit(row)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(row.addressId)}>
                      <Trash2 className="size-4 text-[#c43d3d]" />
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="rounded-[22px] border border-[#ebe6dc] bg-[#fbfaf7] p-4 sm:p-5">
          <h2 className="text-base font-semibold text-[#1f1a14]">{editingId ? '编辑地址' : '新增地址'}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-medium text-[#8a8073]">收件人</label>
              <Input
                value={form.recipientName}
                onChange={(e) => setForm((prev) => ({ ...prev, recipientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8073]">手机号</label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8073]">国家代码</label>
              <Input
                value={form.countryCode}
                onChange={(e) => setForm((prev) => ({ ...prev, countryCode: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8073]">国家/地区</label>
              <Input
                value={form.countryName}
                onChange={(e) => setForm((prev) => ({ ...prev, countryName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8073]">省/州</label>
              <Input
                value={form.stateName || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, stateName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8073]">城市</label>
              <Input
                value={form.cityName || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, cityName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#8a8073]">详细地址</label>
              <Input
                value={form.addressLine1}
                onChange={(e) => setForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#8a8073]">地址补充</label>
              <Input
                value={form.addressLine2 || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8073]">邮编</label>
              <Input
                value={form.postalCode || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-[#4a433a]">
              <input
                type="checkbox"
                checked={Boolean(form.isDefault)}
                onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              />
              设为默认地址
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <Button type="button" className="rounded-full bg-[#111111] text-white hover:bg-[#222]" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : editingId ? '保存修改' : '新增地址'}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" className="rounded-full" onClick={startCreate}>
                取消编辑
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </AccountShell>
  )
}
