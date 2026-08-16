'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AccountShell } from '@/frontend/components/AccountShell'
import { useUserSession } from '@/tools/FrontendSession'
import { upload_project_file } from '@/tools/tools'
import {
  getCustomerProfile,
  updateCustomerProfile,
  type CustomerProfile,
} from '@/frontend/actions/AccountCenter'
import { cn } from '@/lib/utils'

/** Long readonly / input values scroll horizontally instead of overflowing the viewport */
function ScrollField({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mobile-account-scroll-field w-full min-w-0 overflow-x-auto', className)}>
      {children}
    </div>
  )
}

function FieldRow({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mobile-account-field min-w-0', className)}>
      <label className="mobile-account-field__label">{label}</label>
      {children}
    </div>
  )
}

export default function AccountProfileView() {
  const { t } = useTranslation()
  const session = useUserSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [preferredLocale, setPreferredLocale] = useState('en')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCustomerProfile()
      setProfile(res)
      setUsername(res.username)
      setPhone(res.phone)
      setAvatarUrl(res.avatarUrl)
      setPreferredLocale(res.preferredLocale || 'en')
    } catch (error) {
      toast.error((error as Error).message || t('accountProfile.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!session._hasHydrated) return
    if (!String(session.token || '').trim()) {
      setLoading(false)
      setProfile(null)
      return
    }
    void load()
  }, [load, session._hasHydrated, session.token])

  const handleUploadAvatar = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await upload_project_file(file)
      const nextUrl = typeof url === 'string' ? url : (url as { file_url?: string })?.file_url || ''
      if (!nextUrl) throw new Error(t('accountProfile.uploadNoUrl'))
      setAvatarUrl(nextUrl)
      toast.success(t('accountProfile.uploadSuccess'))
    } catch (error) {
      toast.error((error as Error).message || t('accountProfile.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateCustomerProfile({
        username,
        phone,
        avatarUrl,
        preferredLocale,
      })
      setProfile(res)
      session.set({
        username: res.username,
        preferredLocale: res.preferredLocale,
      })
      toast.success(t('accountProfile.saveSuccess'))
    } catch (error) {
      toast.error((error as Error).message || t('accountProfile.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const fieldInputClass =
    'mobile-account-field__input h-9 min-w-0 w-full max-w-none border-[#e8e2d8] bg-white text-[0.8125rem] whitespace-nowrap shadow-none focus-visible:ring-[#d8d0c4] md:h-10 md:text-[0.875rem]'

  return (
    <AccountShell title={t('accountProfile.title')} description={t('accountProfile.description')}>
      {!String(session.token || '').trim() && session._hasHydrated ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-[#7a756c]">
          <p>{t('accountProfile.loginHint', { defaultValue: 'Sign in to view your account.' })}</p>
          <Button
            type="button"
            className="rounded-full bg-[#111] px-5 text-white"
            onClick={() => {
              window.location.href = `/customerlogin/?redirect=${encodeURIComponent('/account/profile/')}`
            }}
          >
            {t('auth.login', { defaultValue: 'Log in' })}
          </Button>
        </div>
      ) : loading || !profile ? (
        <div className="flex min-h-[120px] items-center justify-center gap-2 text-sm text-[#7a756c] md:min-h-[240px]">
          <Loader2 className="size-4 animate-spin" />
          {t('accountProfile.loading')}
        </div>
      ) : (
        <div className="mobile-account-profile mx-auto w-full max-w-2xl">
          <div className="mobile-account-avatar-row flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e8e2d8] bg-[#f6f2ea] text-lg font-semibold text-[#1f1a14] md:size-20 md:text-2xl">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                username.slice(0, 1).toUpperCase() || 'U'
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[0.8125rem] font-medium text-[#1f1a14] md:text-sm">
                {t('accountProfile.avatar')}
              </p>
              <label className="inline-flex cursor-pointer items-center rounded-full border border-[#d8d4ca] bg-white px-2.5 py-1 text-[0.6875rem] font-semibold text-[#1f1a14] hover:bg-[#f7f4ee] md:px-4 md:py-2 md:text-xs">
                {uploading ? t('accountProfile.uploading') : t('accountProfile.uploadAvatar')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => void handleUploadAvatar(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="mobile-account-form-list">
            <FieldRow label={t('accountProfile.loginAccount')}>
              <ScrollField>
                <Input value={profile.account} disabled className={fieldInputClass} />
              </ScrollField>
            </FieldRow>
            <FieldRow label={t('accountProfile.email')}>
              <ScrollField>
                <Input value={profile.email} disabled className={fieldInputClass} />
              </ScrollField>
            </FieldRow>
            <FieldRow label={t('accountProfile.name')} className="sm:col-span-1">
              <ScrollField>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={fieldInputClass}
                />
              </ScrollField>
            </FieldRow>
            <FieldRow label={t('accountProfile.phone')} className="sm:col-span-1">
              <ScrollField>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('accountProfile.phoneOptional')}
                  className={fieldInputClass}
                />
              </ScrollField>
            </FieldRow>
            <FieldRow label={t('accountProfile.avatarUrl')}>
              <ScrollField>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder={t('accountProfile.avatarUrlPlaceholder')}
                  className={fieldInputClass}
                />
              </ScrollField>
            </FieldRow>
            <FieldRow label={t('accountProfile.preferredLocale')}>
              <ScrollField>
                <Input
                  value={preferredLocale}
                  onChange={(e) => setPreferredLocale(e.target.value)}
                  className={fieldInputClass}
                />
              </ScrollField>
            </FieldRow>
          </div>

          <Button
            type="button"
            className="mobile-account-save-btn mt-3 h-9 w-full rounded-full bg-[#111111] px-6 text-[0.8125rem] text-white hover:bg-[#222] md:mt-5 md:h-10 md:w-auto md:text-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('accountProfile.saving') : t('accountProfile.save')}
          </Button>
        </div>
      )}
    </AccountShell>
  )
}
