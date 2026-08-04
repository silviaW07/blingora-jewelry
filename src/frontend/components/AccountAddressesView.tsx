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

export default function AccountAddressesView() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [list, setList] = useState<CustomerAddress[]>([])
  const [form, setForm] = useState<SaveCustomerAddressInput>(() => ({
    recipientName: '',
    phone: '',
    countryCode: 'CN',
    countryName: 'China',
    stateName: '',
    cityName: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    isDefault: false,
  }))
  const [editingId, setEditingId] = useState<string | null>(null)

  const emptyForm = useCallback(
    (): SaveCustomerAddressInput => ({
      recipientName: '',
      phone: '',
      countryCode: 'CN',
      countryName: t('accountAddresses.defaultCountryName'),
      stateName: '',
      cityName: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      isDefault: false,
    }),
    [t],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCustomerAddresses()
      setList(res.list || [])
    } catch (error) {
      toast.error((error as Error).message || t('accountAddresses.loadFailed'))
      setList([])
    } finally {
      setLoading(false)
    }
  }, [t])

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
      phone: row.phone || '',
      countryCode: row.countryCode,
      countryName: row.countryName,
      stateName: row.stateName || '',
      cityName: row.cityName || '',
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2 || '',
      postalCode: row.postalCode || '',
      isDefault: row.isDefault,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveCustomerAddress(form)
      toast.success(editingId ? t('accountAddresses.updated') : t('accountAddresses.saved'))
      startCreate()
      await load()
    } catch (error) {
      toast.error((error as Error).message || t('accountAddresses.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!window.confirm(t('accountAddresses.confirmDelete'))) return
    try {
      await deleteCustomerAddress({ addressId })
      toast.success(t('accountAddresses.deleted'))
      if (editingId === addressId) startCreate()
      await load()
    } catch (error) {
      toast.error((error as Error).message || t('accountAddresses.deleteFailed'))
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

  const fieldClass = 'h-9 w-full text-[0.8125rem] md:h-10 md:text-sm'

  return (
    <AccountShell
      title={t('accountAddresses.title')}
      description={t('accountAddresses.description')}
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:gap-6">
        <div className="space-y-2.5 md:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#1f1a14] md:text-base">
              {t('accountAddresses.listTitle')}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-2.5 text-xs md:h-9 md:px-3"
              onClick={startCreate}
            >
              <Plus className="mr-1 size-3.5" />
              {t('accountAddresses.new')}
            </Button>
          </div>

          {loading ? (
            <div className="flex min-h-[120px] items-center justify-center gap-2 text-sm text-[#7a756c] md:min-h-[180px]">
              <Loader2 className="size-4 animate-spin" />
              {t('accountAddresses.loading')}
            </div>
          ) : list.length === 0 ? (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#e0d8cb] bg-[#fbfaf7] p-4 text-center md:min-h-[180px] md:rounded-[22px]">
              <MapPin className="size-7 text-[#d4cdc0] md:size-8" />
              <p className="text-sm text-[#6f6558]">{t('accountAddresses.empty')}</p>
            </div>
          ) : (
            list.map((row) => (
              <article
                key={row.addressId}
                className="rounded-[14px] border border-[#ebe6dc] bg-[#fbfaf7] p-3 md:rounded-[22px] md:p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1f1a14]">
                      {row.recipientName}
                      {row.phone ? (
                        <span className="ml-2 font-normal text-[#6f6558]">{row.phone}</span>
                      ) : null}
                    </p>
                    <p className="mt-1.5 text-[0.8125rem] leading-5 text-[#5c554c] md:mt-2 md:text-sm md:leading-6">
                      {row.countryName}
                      {row.stateName ? ` · ${row.stateName}` : ''}
                      {row.cityName ? ` · ${row.cityName}` : ''}
                      <br />
                      {row.addressLine1}
                      {row.addressLine2 ? ` ${row.addressLine2}` : ''}
                      {row.postalCode ? ` (${row.postalCode})` : ''}
                    </p>
                    {row.isDefault ? (
                      <Badge
                        variant="outline"
                        className="mt-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 md:mt-2"
                      >
                        {t('accountAddresses.defaultBadge')}
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 h-8 rounded-full text-xs md:mt-3"
                        disabled={settingDefaultId === row.addressId}
                        onClick={() => void handleSetDefault(row.addressId)}
                      >
                        {settingDefaultId === row.addressId
                          ? t('accountAddresses.settingDefault')
                          : t('accountAddresses.setDefault')}
                      </Button>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button type="button" variant="ghost" size="icon" onClick={() => startEdit(row)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(row.addressId)}
                    >
                      <Trash2 className="size-4 text-[#c43d3d]" />
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="rounded-[14px] border border-[#ebe6dc] bg-[#fbfaf7] p-3 md:rounded-[22px] md:p-5">
          <h2 className="text-sm font-semibold text-[#1f1a14] md:text-base">
            {editingId ? t('accountAddresses.editTitle') : t('accountAddresses.createTitle')}
          </h2>
          <div className="mobile-account-form-list mt-2 grid gap-0 sm:mt-3 sm:grid-cols-2 sm:gap-x-3">
            <div className="mobile-account-field sm:col-span-1">
              <label className="mobile-account-field__label">{t('accountAddresses.recipient')}</label>
              <Input
                className={fieldClass}
                value={form.recipientName}
                onChange={(e) => setForm((prev) => ({ ...prev, recipientName: e.target.value }))}
              />
            </div>
            <div className="mobile-account-field">
              <label className="mobile-account-field__label">{t('accountAddresses.phone')}</label>
              <Input
                className={fieldClass}
                value={form.phone || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="mobile-account-field">
              <label className="mobile-account-field__label">{t('accountAddresses.countryCode')}</label>
              <Input
                className={fieldClass}
                value={form.countryCode}
                onChange={(e) => setForm((prev) => ({ ...prev, countryCode: e.target.value }))}
              />
            </div>
            <div className="mobile-account-field">
              <label className="mobile-account-field__label">{t('accountAddresses.countryRegion')}</label>
              <Input
                className={fieldClass}
                value={form.countryName}
                onChange={(e) => setForm((prev) => ({ ...prev, countryName: e.target.value }))}
              />
            </div>
            <div className="mobile-account-field">
              <label className="mobile-account-field__label">{t('accountAddresses.state')}</label>
              <Input
                className={fieldClass}
                value={form.stateName || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, stateName: e.target.value }))}
              />
            </div>
            <div className="mobile-account-field">
              <label className="mobile-account-field__label">{t('accountAddresses.city')}</label>
              <Input
                className={fieldClass}
                value={form.cityName || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, cityName: e.target.value }))}
              />
            </div>
            <div className="mobile-account-field sm:col-span-2">
              <label className="mobile-account-field__label">{t('accountAddresses.addressLine')}</label>
              <Input
                className={fieldClass}
                value={form.addressLine1}
                onChange={(e) => setForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
              />
            </div>
            <div className="mobile-account-field sm:col-span-2">
              <label className="mobile-account-field__label">{t('accountAddresses.addressLine2')}</label>
              <Input
                className={fieldClass}
                value={form.addressLine2 || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
              />
            </div>
            <div className="mobile-account-field">
              <label className="mobile-account-field__label">{t('accountAddresses.postalCode')}</label>
              <Input
                className={fieldClass}
                value={form.postalCode || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
            <label className="mobile-account-field flex flex-row items-center gap-2 py-2 text-[0.8125rem] text-[#4a433a] sm:col-span-2 md:text-sm">
              <input
                type="checkbox"
                className="size-3.5 shrink-0"
                checked={Boolean(form.isDefault)}
                onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              />
              {t('accountAddresses.setAsDefault')}
            </label>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row">
            <Button
              type="button"
              className="h-9 w-full rounded-full bg-[#111111] text-[0.8125rem] text-white hover:bg-[#222] sm:w-auto md:h-10 md:text-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? t('accountAddresses.saving')
                : editingId
                  ? t('accountAddresses.saveChanges')
                  : t('accountAddresses.addAddress')}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full rounded-full text-[0.8125rem] sm:w-auto md:h-10 md:text-sm"
                onClick={startCreate}
              >
                {t('accountAddresses.cancelEdit')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </AccountShell>
  )
}
