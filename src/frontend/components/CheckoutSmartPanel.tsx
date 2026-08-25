'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, MapPin, Sparkles, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CHECKOUT_COUNTRIES } from '@/shared/shippingCountries'
import {
  getCheckoutShippingOptions,
  type CheckoutShippingOption,
} from '@/frontend/actions/CheckoutShipping'
import {
  getLatestShippingAddress,
  saveCheckoutAddress,
  type LatestShippingAddress,
} from '@/frontend/actions/CheckoutOrder'
import { useUserSession } from '@/tools/FrontendSession'
import { useTranslation } from 'react-i18next'
import { translateStorefrontError } from '@/frontend/utils/storefrontErrors'

export type CheckoutAddressForm = {
  country: string
  countryCode: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
}

const EMPTY_CHECKOUT_ADDRESS: CheckoutAddressForm = {
  country: 'United States',
  countryCode: 'US',
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
}

function isCheckoutAddressComplete(form: CheckoutAddressForm) {
  return Boolean(
    (cleanSpaces(form.firstName) || cleanSpaces(form.lastName)) &&
      cleanSpaces(form.phone) &&
      cleanSpaces(form.addressLine1) &&
      cleanSpaces(form.zipCode) &&
      (form.country !== 'United States' || cleanSpaces(form.state)),
  )
}

const COUNTRY_CODE_BY_NAME: Record<string, string> = {
  'United States': 'US',
  'Puerto Rico': 'PR',
  Mexico: 'MX',
  Canada: 'CA',
  'United Kingdom': 'GB',
  Australia: 'AU',
  Japan: 'JP',
  'South Korea': 'KR',
  Singapore: 'SG',
  Germany: 'DE',
  France: 'FR',
}

function countryCodeFor(country: unknown) {
  const name = String(country ?? '').trim()
  if (!name) return 'US'
  return COUNTRY_CODE_BY_NAME[name] || name.slice(0, 2).toUpperCase() || 'US'
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const

const inputClassName =
  'h-10 rounded-[10px] border border-[#e8e8e8] bg-white px-3 text-sm text-[#0F172A] shadow-none placeholder:text-[#94A3B8] focus-visible:border-[#f254a6] focus-visible:ring-2 focus-visible:ring-[#f254a6]/20'

function SectionGuideTitle({
  propKey,
  children,
}: {
  propKey: string
  children: React.ReactNode
}) {
  return (
    <div className="relative py-1">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#f3dfe6]" />
      <DecorateText
        propKey={propKey}
        as="div"
        className="relative mx-auto w-fit rounded-full border border-[#f3dfe6] bg-[#fff5f8] px-4 py-2 text-center font-body text-[15px] font-bold text-[#0F172A]"
      >
        {children}
      </DecorateText>
    </div>
  )
}

function cleanSpaces(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function splitRecipientName(name: unknown) {
  const normalized = cleanSpaces(name)
  if (!normalized) {
    return { firstName: '', lastName: '' }
  }

  const parts = normalized.split(' ')
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  }
}

function normalizeUsState(raw: unknown): string {
  const value = cleanSpaces(raw)
  if (!value) return ''
  const upper = value.toUpperCase()
  if ((US_STATES as readonly string[]).includes(upper)) return upper
  const byName: Record<string, string> = {
    ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA',
    COLORADO: 'CO', CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA',
    HAWAII: 'HI', IDAHO: 'ID', ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA',
    KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
    MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS',
    MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV', 'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND', OHIO: 'OH', OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA',
    'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN',
    TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT', VIRGINIA: 'VA', WASHINGTON: 'WA',
    'WEST VIRGINIA': 'WV', WISCONSIN: 'WI', WYOMING: 'WY',
  }
  return byName[upper] || value
}

/** 将 API / 保存结果归一化到表单受控字段（唯一 canonical 源） */
function normalizeLoadedAddress(raw: unknown): CheckoutAddressForm {
  const address = (raw || {}) as Partial<LatestShippingAddress> & Record<string, unknown>
  const text = (...keys: string[]) => {
    for (const key of keys) {
      const value = address[key]
      if (typeof value === 'string' && value.trim()) return cleanSpaces(value)
    }
    return ''
  }
  const splitName = splitRecipientName(text('recipientName', 'name', 'fullName'))
  const countryCode = text('countryCode')
  const apiCountry = text('country', 'countryName')
  const countryFromCode = Object.entries(COUNTRY_CODE_BY_NAME).find(
    ([, code]) => code.toLowerCase() === countryCode.toLowerCase(),
  )?.[0]
  const country =
    CHECKOUT_COUNTRIES.find(
      (item) => item.toLowerCase() === (apiCountry || countryFromCode || '').toLowerCase(),
    ) ||
    apiCountry ||
    countryFromCode ||
    'United States'

  const firstName = text('firstName', 'first_name') || splitName.firstName
  const lastName = text('lastName', 'last_name') || splitName.lastName

  const stateRaw = text('state', 'stateName', 'province', 'state_name')
  const state = country === 'United States' ? normalizeUsState(stateRaw) : stateRaw

  return {
    country,
    countryCode: countryCode || countryCodeFor(country),
    firstName,
    lastName,
    phone: text('phone', 'phoneNumber', 'mobile'),
    addressLine1: text('addressLine1', 'address_line_1', 'detailAddress', 'address'),
    addressLine2: text('addressLine2', 'address_line_2'),
    city: text('city', 'cityName', 'city_name'),
    state,
    zipCode: text('zipCode', 'postalCode', 'zip', 'postal_code'),
  }
}

/** 智能识别粘贴文本中的姓名 / 电话 / 地址 */
export function parseSmartAddressText(raw: string): CheckoutAddressForm {
  const source = (raw || '').trim()
  if (!source) {
    return { ...EMPTY_CHECKOUT_ADDRESS }
  }

  const labeledName =
    source.match(/(?:收货人|联系人|姓名|Recipient|Name)\s*[:：]\s*([^\n,，;；]+)/i)?.[1] || ''
  const labeledPhone =
    source.match(/(?:手机|电话|联系电话|Tel|Phone|Mobile)\s*[:：]\s*([+\d\s\-()（）]{6,})/i)?.[1] || ''
  const labeledAddress =
    source.match(/(?:详细地址|收货地址|地址|Address)\s*[:：]\s*([^\n]+)/i)?.[1] || ''

  const phoneMatch =
    source.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}/)?.[0] ||
    source.match(/\b1[3-9]\d{9}\b/)?.[0] ||
    ''

  let working = source
  const phone = cleanSpaces(labeledPhone || phoneMatch)
  if (phone) {
    working = working.replace(phone, ' ')
  }
  working = working
    .replace(/(?:收货人|联系人|姓名|Recipient|Name)\s*[:：]/gi, ' ')
    .replace(/(?:手机|电话|联系电话|Tel|Phone|Mobile)\s*[:：]/gi, ' ')
    .replace(/(?:详细地址|收货地址|地址|Address)\s*[:：]/gi, ' ')
    .replace(/[，,;；|｜]/g, ' ')

  const lines = source
    .split(/\n+/)
    .map((line) => cleanSpaces(line))
    .filter(Boolean)

  let recipientName = cleanSpaces(labeledName)
  if (!recipientName) {
    const candidate = lines.find((line) => {
      if (phone && line.includes(phone.replace(/\s/g, ''))) return false
      if (/地址|Address|手机|电话/i.test(line)) return false
      return line.length >= 2 && line.length <= 20 && !/\d{5,}/.test(line)
    })
    recipientName = candidate || ''
  }

  let detailAddress = cleanSpaces(labeledAddress)
  if (!detailAddress) {
    let rest = cleanSpaces(working)
    if (recipientName) {
      rest = cleanSpaces(rest.replace(recipientName, ' '))
    }
    detailAddress = rest
  }

  const { firstName, lastName } = splitRecipientName(recipientName)
  const zipCode = source.match(/\b\d{5}(?:-\d{4})?\b/)?.[0] || ''
  const state = US_STATES.find((item) => new RegExp(`\\b${item}\\b`, 'i').test(source)) || ''
  const addressParts = detailAddress
    .split(/(?:,|\n)/)
    .map((item) => cleanSpaces(item))
    .filter(Boolean)

  const matchedCountry =
    CHECKOUT_COUNTRIES.find((country) => new RegExp(country, 'i').test(source)) || 'United States'

  return {
    country: matchedCountry,
    countryCode: countryCodeFor(matchedCountry),
    firstName,
    lastName,
    phone,
    addressLine1: addressParts.join(', ') || detailAddress,
    addressLine2: '',
    city: '',
    state,
    zipCode,
  }
}

type Props = {
  disabled?: boolean
  /** 购物车总重量（kg），用于运费阶梯/海运计算 */
  totalWeightKg?: number
  onConfirmedChange?: (confirmed: boolean) => void
  onConfirmAddress?: (payload: {
    channelId: string | null
    address: CheckoutAddressForm
    shippingFee: number | null
  }) => void
  onShippingChange?: (payload: {
    channelId: string | null
    channelName: string | null
    shippingFee: number | null
    shippingFeeLabel: string | null
  }) => void
}

export function CheckoutSmartPanel({
  disabled = false,
  totalWeightKg = 0,
  onConfirmedChange,
  onConfirmAddress,
  onShippingChange,
}: Props) {
  const { t } = useTranslation()
  const { token, user_id: userId } = useUserSession()
  const [smartText, setSmartText] = useState('')
  const [form, setForm] = useState<CheckoutAddressForm>({ ...EMPTY_CHECKOUT_ADDRESS })
  const [confirmed, setConfirmed] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [shippingOptions, setShippingOptions] = useState<CheckoutShippingOption[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const autofillIdentityRef = useRef('')
  const hydratedAddressRef = useRef('')
  const userEditedRef = useRef(false)
  const shippingRequestRef = useRef(0)

  // Recipient 与输入共用 form；有内容时始终展示摘要条
  const showAddressSummary = Boolean(
    cleanSpaces(form.firstName) ||
      cleanSpaces(form.lastName) ||
      cleanSpaces(form.phone) ||
      cleanSpaces(form.addressLine1),
  )
  const addressComplete = useMemo(() => isCheckoutAddressComplete(form), [form])
  const addressReady = addressComplete

  const applyCanonicalAddress = (
    nextForm: CheckoutAddressForm,
    options?: { confirm?: boolean; addressId?: string },
  ) => {
    setForm(nextForm)
    if (options?.addressId) {
      hydratedAddressRef.current = options.addressId
    }
    if (options?.confirm && (isCheckoutAddressComplete(nextForm) || Boolean(options.addressId))) {
      setConfirmed(true)
      setIsEditingAddress(false)
      notifyParentReady(true)
      onConfirmAddress?.({
        channelId: null,
        address: nextForm,
        shippingFee: null,
      })
    }
  }

  const clearShippingSelection = () => {
    shippingRequestRef.current += 1
    setLoadingChannels(false)
    setSelectedChannelId(null)
    setShippingOptions([])
    onShippingChange?.({
      channelId: null,
      channelName: null,
      shippingFee: null,
      shippingFeeLabel: null,
    })
  }

  const notifyParentReady = (ready: boolean) => {
    onConfirmedChange?.(ready)
  }

  const resetAddressFlow = () => {
    setConfirmed(false)
    setIsEditingAddress(true)
    clearShippingSelection()
    notifyParentReady(false)
  }

  const updateForm = (patch: Partial<CheckoutAddressForm>) => {
    userEditedRef.current = true
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const loadShippingOptions = async (country: string, weightKg: number) => {
    const requestId = ++shippingRequestRef.current
    setLoadingChannels(true)
    try {
      const result = await getCheckoutShippingOptions({ country, weightKg })
      if (requestId !== shippingRequestRef.current) return
      setShippingOptions(result.list)
      const first = result.list[0] || null
      setSelectedChannelId(first?.channelId || null)
      onShippingChange?.({
        channelId: first?.channelId || null,
        channelName: first?.name || null,
        shippingFee: first?.shippingFee ?? null,
        shippingFeeLabel: first?.shippingFeeLabel || null,
      })
    } catch (error) {
      if (requestId !== shippingRequestRef.current) return
      setShippingOptions([])
      setSelectedChannelId(null)
      onShippingChange?.({
        channelId: null,
        channelName: null,
        shippingFee: null,
        shippingFeeLabel: null,
      })
      toast.error(translateStorefrontError(t, error, 'checkout.errors.shippingLoadFailed'))
    } finally {
      if (requestId === shippingRequestRef.current) setLoadingChannels(false)
    }
  }

  useEffect(() => {
    const identity = `${userId}:${token}`
    if (!userId || !token || autofillIdentityRef.current === identity) return

    let cancelled = false
    void (async () => {
      try {
        const result = await getLatestShippingAddress()
        if (cancelled) return
        // React Strict Mode 会先 cleanup；请求完成后再标记，避免跳过第二次 hydration
        autofillIdentityRef.current = identity
        if (!result?.address) {
          setIsEditingAddress(true)
          return
        }
        if (userEditedRef.current) return

        const latest = result.address
        const nextForm = normalizeLoadedAddress(latest)
        const addressIdentity =
          latest.addressId ||
          [
            nextForm.firstName,
            nextForm.lastName,
            nextForm.phone,
            nextForm.addressLine1,
            nextForm.zipCode,
          ].join('|')
        if (hydratedAddressRef.current === addressIdentity) return

        // 注入 canonical form（摘要与输入同源），完整则确认并解锁物流
        applyCanonicalAddress(nextForm, {
          confirm: true,
          addressId: addressIdentity,
        })
      } catch {
        // 无历史地址或暂时加载失败时保持空白表单
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, userId])

  useEffect(() => {
    const country = form.country || 'United States'
    void loadShippingOptions(country, Math.max(0, Number(totalWeightKg) || 0))
  }, [form.country, totalWeightKg])

  useEffect(() => {
    if (!addressComplete) return
    setConfirmed(true)
    notifyParentReady(true)
    onConfirmAddress?.({
      channelId: selectedChannelId,
      address: form,
      shippingFee: null,
    })
  }, [addressComplete, form, selectedChannelId])

  const applySmartParse = (value: string, options?: { notify?: boolean }) => {
    userEditedRef.current = true
    setSmartText(value)
    if (!value.trim()) {
      return
    }
    const parsed = parseSmartAddressText(value)
    setForm(parsed)
    if (
      options?.notify &&
      (
        parsed.firstName ||
        parsed.lastName ||
        parsed.phone ||
        parsed.addressLine1 ||
        parsed.state ||
        parsed.zipCode
      )
    ) {
      toast.success('已智能识别并填入地址字段，可继续手动修正')
    }
  }

  const handleSaveAddress = async () => {
    if (!cleanSpaces(form.firstName) && !cleanSpaces(form.lastName)) {
      toast.error(t('checkout.errors.nameRequired'))
      return
    }
    if (!cleanSpaces(form.phone)) {
      toast.error(t('checkout.errors.phoneRequired'))
      return
    }
    if (!cleanSpaces(form.addressLine1)) {
      toast.error(t('checkout.errors.addressRequired'))
      return
    }
    if (form.country === 'United States' && !cleanSpaces(form.state)) {
      toast.error(t('checkout.errors.stateRequired'))
      return
    }
    if (!cleanSpaces(form.zipCode)) {
      toast.error(t('checkout.errors.zipRequired'))
      return
    }
    setSavingAddress(true)
    try {
      const result = await saveCheckoutAddress(form)
      // 保存结果回写 form；若服务端未带 address，保留当前表单，避免清空
      const savedForm = result?.address
        ? normalizeLoadedAddress(result.address)
        : { ...form, countryCode: form.countryCode || countryCodeFor(form.country) }
      applyCanonicalAddress(savedForm, {
        confirm: true,
        addressId: result?.addressId || hydratedAddressRef.current,
      })
      toast.success(t('checkout.addressConfirmed'))
      toast.success(t('checkout.addressSavedDefault'))
    } catch (error) {
      toast.error(translateStorefrontError(t, error, 'checkout.addressSaveFailed'))
    } finally {
      setSavingAddress(false)
    }
  }

  const handleEditAddress = () => {
    if (disabled) return
    setIsEditingAddress(true)
  }

  const handleSelectChannel = (option: CheckoutShippingOption) => {
    setSelectedChannelId(option.channelId)
    onShippingChange?.({
      channelId: option.channelId,
      channelName: option.name,
      shippingFee: option.shippingFee,
      shippingFeeLabel: option.shippingFeeLabel,
    })
  }

  const recipientName = [form.firstName, form.lastName].filter(Boolean).join(' ').trim() || '—'
  const addressSummaryLine = [
    form.addressLine1,
    form.city,
    form.state,
    form.zipCode,
    form.country,
  ]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ')
  const formCollapsed = !isEditingAddress && showAddressSummary

  return (
    <div className="space-y-3" data-controller-name="智能单页结账面板">
      {showAddressSummary ? (
        <button
          type="button"
          disabled={disabled}
          onClick={handleEditAddress}
          className={cn(
            'w-full rounded-[10px] border border-[#f0dede] bg-[#fff5f8] px-3 py-3 text-left transition',
            'hover:border-[#f254a6]/40 hover:bg-[#fff0f5]',
            disabled && 'cursor-not-allowed opacity-60',
          )}
          aria-label={t('checkout.clickEditAddress')}
        >
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#f254a6]" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold text-[#0F172A]">
                {t('checkout.recipient', { name: recipientName })}
                {form.phone ? ` / ${form.phone}` : ''}
              </p>
              <p className="text-xs leading-5 text-[#64748B]">
                {addressSummaryLine || '—'}
              </p>
              <p className="pt-0.5 text-[11px] font-medium text-[#f254a6]">{t('checkout.clickEditAddress')}</p>
            </div>
          </div>
        </button>
      ) : null}

      {/* 表单始终挂载（折叠时 hidden），保证受控 value 与 Recipient 同源且切换编辑时不丢值 */}
      <div className={cn('space-y-2', formCollapsed && 'hidden')} aria-hidden={formCollapsed}>
        <div className="space-y-2">
          <div className="flex justify-center">
            <MapPin className="size-3.5 text-[#f254a6]" />
          </div>
          <SectionGuideTitle propKey="checkout_address_section_title">
            {confirmed ? t('checkout.editAddress') : t('checkout.fillAddress')}
          </SectionGuideTitle>
        </div>

        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748B]">Country</label>
            <select
              value={form.country}
              disabled={disabled || formCollapsed}
              className={cn(inputClassName, 'w-full')}
              onChange={(event) =>
                updateForm({
                  country: event.target.value,
                  countryCode: countryCodeFor(event.target.value),
                  state: '',
                })
              }
            >
              {CHECKOUT_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-[#64748B]">
              <Sparkles className="size-3.5 text-[#f254a6]" />
              智能识别（粘贴整段地址文本）
            </label>
            <textarea
              value={smartText}
              disabled={disabled || formCollapsed}
              rows={3}
              placeholder="例如：John Smith 13800138000 123 Main St, CA 90001"
              className={cn(
                inputClassName,
                'h-auto min-h-[76px] w-full resize-y py-2.5 leading-5',
              )}
              onChange={(event) => applySmartParse(event.target.value)}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData('text')
                if (!pasted) return
                window.setTimeout(() => applySmartParse(pasted, { notify: true }), 0)
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#64748B]">First Name</label>
              <Input
                value={form.firstName}
                disabled={disabled || formCollapsed}
                placeholder="First Name"
                className={inputClassName}
                onChange={(event) =>
                  updateForm({ firstName: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#64748B]">Last Name</label>
              <Input
                value={form.lastName}
                disabled={disabled || formCollapsed}
                placeholder="Last Name"
                className={inputClassName}
                onChange={(event) =>
                  updateForm({ lastName: event.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748B]">电话</label>
            <Input
              value={form.phone}
              disabled={disabled || formCollapsed}
              placeholder="手机号 / 联系电话"
              className={inputClassName}
              onChange={(event) => updateForm({ phone: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748B]">Address Line 1</label>
            <Input
              value={form.addressLine1}
              disabled={disabled || formCollapsed}
              placeholder="Street address and house number"
              className={inputClassName}
              onChange={(event) =>
                updateForm({ addressLine1: event.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748B]">Address Line 2</label>
            <Input
              value={form.addressLine2}
              disabled={disabled || formCollapsed}
              placeholder="Apartment, suite, unit (optional)"
              className={inputClassName}
              onChange={(event) => updateForm({ addressLine2: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748B]">City</label>
            <Input
              value={form.city}
              disabled={disabled || formCollapsed}
              placeholder="City"
              className={inputClassName}
              onChange={(event) => updateForm({ city: event.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#64748B]">State/Province</label>
              {form.country === 'United States' ? (
                <select
                  value={form.state}
                  disabled={disabled || formCollapsed}
                  className={cn(inputClassName, 'w-full')}
                  onChange={(event) => updateForm({ state: event.target.value })}
                >
                  <option value="">Select state</option>
                  {US_STATES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={form.state}
                  disabled={disabled || formCollapsed}
                  placeholder="State / Province"
                  className={inputClassName}
                  onChange={(event) => updateForm({ state: event.target.value })}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#64748B]">Zip Code</label>
              <Input
                value={form.zipCode}
                disabled={disabled || formCollapsed}
                placeholder="Zip Code"
                className={inputClassName}
                onChange={(event) =>
                  updateForm({ zipCode: event.target.value })
                }
              />
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  disabled={disabled || savingAddress || formCollapsed}
                  onClick={handleSaveAddress}
                  className="h-8 rounded-[8px] bg-[#f254a6] px-3 text-xs font-semibold text-white hover:bg-[#e44798]"
                >
                  {savingAddress ? t('common.submitting') : t('common.saveAddress')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn('space-y-2', !formCollapsed && 'border-t border-[#f0dede] pt-3')}>
        <div className="space-y-2">
          <div className="flex justify-center">
            <Truck className="size-3.5 text-[#f254a6]" />
          </div>
          <SectionGuideTitle propKey="checkout_channel_section_title">
            {t('checkout.shippingMethods', { defaultValue: 'Shipping methods' })}
          </SectionGuideTitle>
        </div>

        {loadingChannels ? (
          <div className="rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-3 text-sm text-[#94A3B8]">
            {t('checkout.loadingChannels', {
              defaultValue: 'Loading shipping options for {{country}}…',
              country: form.country,
            })}
          </div>
        ) : shippingOptions.length === 0 ? (
          <div className="rounded-[10px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-3 text-sm text-[#94A3B8]">
            {t('checkout.noChannels')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {shippingOptions.map((item) => {
              const active = selectedChannelId === item.channelId
              return (
                <button
                  key={item.channelId}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectChannel(item)}
                  className={cn(
                    'flex items-center justify-between rounded-[10px] border px-3 py-2.5 text-left transition',
                    active
                      ? 'border-[#f254a6] bg-[#fff5f8]'
                      : 'border-[#e8e8e8] bg-white hover:border-[#f0dede]',
                    (disabled) && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{item.name}</p>
                    <p className="mt-0.5 text-xs text-[#64748B]">{item.estimatedTime}</p>
                    <p className="mt-1 text-sm font-bold text-[#f254a6]">{item.shippingFeeLabel}</p>
                  </div>
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border',
                      active ? 'border-[#f254a6] bg-[#f254a6] text-white' : 'border-[#e8e8e8] bg-white',
                    )}
                  >
                    {active ? <Check className="size-3" /> : null}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
