'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { loginCustomer } from '@/frontend/actions/CustomerLogin'
import { registerCustomer } from '@/frontend/actions/CustomerRegister'
import { useUserSession } from '@/tools/FrontendSession'
import { redirectAfterStorefrontAuth, useChromeActivate } from '@/frontend/utils/hardNavigate'
import { DecorateText } from '@/frontend/decorate/DecorateText'
import { DecorateInput } from '@/frontend/decorate/DecorateInput'

type Tab = 'login' | 'register'

interface RegisterForm {
  sysuser_name: string
  sysuser_email: string
  sysuser_phone: string
  sysuser_password: string
}

/**
 * In-page login/register for guests on Cart / Account.
 * Not a Dialog — Chrome Android often never shows the portaled modal.
 */
export function GuestAuthScreen({ initialTab = 'register' }: { initialTab?: Tab }) {
  const { t } = useTranslation()
  const { set: setSession, token, user_id } = useUserSession()
  const [tab, setTab] = useState<Tab>(initialTab)

  const [loginAccount, setLoginAccount] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginShowPassword, setLoginShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false)

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    sysuser_name: '',
    sysuser_email: '',
    sysuser_phone: '',
    sysuser_password: '',
  })
  const [registerShowPassword, setRegisterShowPassword] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (!String(token || '').trim() || !String(user_id || '').trim()) return
    if (typeof window === 'undefined') return
    if (!/customerlogin|customerregister/i.test(window.location.pathname || '')) return
    redirectAfterStorefrontAuth()
  }, [token, user_id])

  const handleLoginSubmit = async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()
    if (!loginAccount.trim() || !loginPassword) {
      setLoginError(t('auth.loginRequired'))
      return
    }
    setIsLoginSubmitting(true)
    setLoginError(null)
    try {
      const result = await loginCustomer({
        sysuser_account: loginAccount.trim(),
        sysuser_password: loginPassword,
      })
      setSession({
        token: result.token,
        user_id: result.sysuser_id,
        username: result.sysuser_name || result.sysuser_account,
        email: result.sysuser_email,
        preferredLocale: result.preferred_locale || 'en',
        role: 'CUSTOMER',
      })
      toast.success(t('auth.loginSuccess'))
      redirectAfterStorefrontAuth()
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : t('auth.loginFailed'))
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()
    if (!registerForm.sysuser_name.trim() || !registerForm.sysuser_email.trim() || !registerForm.sysuser_password) {
      setRegisterError(t('auth.registerRequired', { defaultValue: 'Please fill in name, email, and password' }))
      return
    }
    setIsRegisterSubmitting(true)
    setRegisterError(null)
    try {
      const registerResult = await registerCustomer(registerForm)
      const sessionResult = registerResult?.token
        ? {
            token: registerResult.token,
            sysuser_id: registerResult.sysuser_id,
            sysuser_name: registerResult.sysuser_name,
            sysuser_account: registerResult.sysuser_account,
            sysuser_email: registerResult.sysuser_email,
            preferred_locale: registerResult.preferred_locale || 'en',
          }
        : await loginCustomer({
            sysuser_account:
              registerResult?.sysuser_account ||
              registerForm.sysuser_email.trim().toLowerCase() ||
              registerForm.sysuser_phone.trim(),
            sysuser_password: registerForm.sysuser_password,
          })
      setSession({
        token: sessionResult.token,
        user_id: sessionResult.sysuser_id,
        username: sessionResult.sysuser_name || sessionResult.sysuser_account,
        email: sessionResult.sysuser_email,
        preferredLocale: sessionResult.preferred_locale || 'en',
        role: 'CUSTOMER',
      })
      toast.success(t('auth.registerSuccess', { defaultValue: 'Account created' }))
      redirectAfterStorefrontAuth()
    } catch (error: unknown) {
      setRegisterError(error instanceof Error ? error.message : t('auth.registerFailed'))
    } finally {
      setIsRegisterSubmitting(false)
    }
  }

  const loginActivate = useChromeActivate(() => {
    void handleLoginSubmit()
  })
  const registerActivate = useChromeActivate(() => {
    void handleRegisterSubmit()
  })
  const tabLogin = useChromeActivate(() => setTab('login'))
  const tabRegister = useChromeActivate(() => setTab('register'))

  return (
    <section
      className="guest-auth-screen min-h-[100dvh] bg-[#FFF5F5] px-4 py-6 pb-[calc(var(--mobile-nav-height,3.75rem)+1.5rem)]"
      data-controller-name="客户登录入口"
    >
      <div className="guest-auth-screen__card mx-auto w-full max-w-[560px] overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white">
        <div className="space-y-3 border-b border-[#E2E8F0] px-5 pb-5 pt-6 text-left sm:px-6">
          <h2 className="pr-4 text-2xl font-bold tracking-tight text-[#0F172A]">
            {tab === 'register' ? t('auth.createAccount') : t('auth.welcomeBack')}
          </h2>
          <p className="text-sm text-[#64748B]">
            {tab === 'register' ? t('auth.registerDesc') : t('auth.loginDesc')}
          </p>
          <div className="guest-auth-screen__tabs">
            {(['login', 'register'] as const).map((item) => (
              <button
                key={item}
                type="button"
                {...(item === 'login' ? tabLogin : tabRegister)}
                className={cn('guest-auth-screen__tab', tab === item && 'is-active')}
              >
                {item === 'login' ? t('auth.login') : t('auth.register')}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest-login-account" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                  {t('auth.emailOrPhone')}
                </Label>
                <DecorateInput
                  propKey="auth_login_account_placeholder"
                  id="guest-login-account"
                  type="text"
                  autoComplete="username"
                  placeholder={t('auth.emailOrPhonePlaceholder')}
                  disabled={isLoginSubmitting}
                  value={loginAccount}
                  onChange={(e) => {
                    setLoginAccount(e.target.value)
                    if (loginError) setLoginError(null)
                  }}
                  className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-login-password" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                  {t('auth.password')}
                </Label>
                <div className="guest-auth-screen__password">
                  <DecorateInput
                    propKey="auth_login_password_placeholder"
                    id="guest-login-password"
                    type={loginShowPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    disabled={isLoginSubmitting}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value)
                      if (loginError) setLoginError(null)
                    }}
                    className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC] pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPassword((prev) => !prev)}
                    className="guest-auth-screen__eye"
                    aria-label={loginShowPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {loginShowPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
              {loginError ? <p className="rounded-[12px] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">{loginError}</p> : null}
              <Button
                type="button"
                aria-busy={isLoginSubmitting}
                data-auto="submit"
                data-no-hard-nav=""
                className="h-12 w-full rounded-full bg-[#0055FF] text-base font-bold text-white hover:bg-[#0044CC]"
                {...loginActivate}
              >
                {isLoginSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {t('auth.login')}
              </Button>
              <p className="pt-1 text-center text-sm text-[#64748B]">
                {t('auth.noAccount')}{' '}
                <button type="button" {...tabRegister} className="guest-auth-screen__text-btn">
                  {t('auth.registerNow')}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <p className="text-sm leading-6 text-[#64748B]">{t('auth.registerIntro')}</p>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-register-name" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    {t('auth.name')}
                  </Label>
                  <DecorateInput
                    propKey="register_name_placeholder"
                    id="guest-register-name"
                    placeholder={t('auth.namePlaceholder')}
                    disabled={isRegisterSubmitting}
                    value={registerForm.sysuser_name}
                    onChange={(e) => {
                      setRegisterForm((prev) => ({ ...prev, sysuser_name: e.target.value }))
                      if (registerError) setRegisterError(null)
                    }}
                    className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-register-email" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    {t('auth.email')}
                  </Label>
                  <DecorateInput
                    propKey="register_email_placeholder"
                    id="guest-register-email"
                    type="text"
                    placeholder={t('auth.emailPlaceholder')}
                    disabled={isRegisterSubmitting}
                    value={registerForm.sysuser_email}
                    onChange={(e) => {
                      setRegisterForm((prev) => ({ ...prev, sysuser_email: e.target.value }))
                      if (registerError) setRegisterError(null)
                    }}
                    className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-register-phone" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    {t('auth.phoneOrWhatsapp')}
                  </Label>
                  <DecorateInput
                    propKey="register_phone_placeholder"
                    id="guest-register-phone"
                    placeholder={t('auth.phonePlaceholder')}
                    disabled={isRegisterSubmitting}
                    value={registerForm.sysuser_phone}
                    onChange={(e) => {
                      setRegisterForm((prev) => ({ ...prev, sysuser_phone: e.target.value }))
                      if (registerError) setRegisterError(null)
                    }}
                    className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-register-password" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    {t('auth.password')}
                  </Label>
                  <div className="guest-auth-screen__password">
                    <DecorateInput
                      propKey="register_password_placeholder"
                      id="guest-register-password"
                      type={registerShowPassword ? 'text' : 'password'}
                      placeholder={t('auth.setPassword')}
                      disabled={isRegisterSubmitting}
                      value={registerForm.sysuser_password}
                      onChange={(e) => {
                        setRegisterForm((prev) => ({ ...prev, sysuser_password: e.target.value }))
                        if (registerError) setRegisterError(null)
                      }}
                      className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC] pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setRegisterShowPassword((prev) => !prev)}
                      className="guest-auth-screen__eye"
                      aria-label={registerShowPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {registerShowPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
              </div>
              {registerError ? <p className="rounded-[12px] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">{registerError}</p> : null}
              <Button
                type="button"
                aria-busy={isRegisterSubmitting}
                data-auto="submit"
                data-no-hard-nav=""
                className="h-12 w-full rounded-full bg-[#0055FF] text-base font-bold text-white hover:bg-[#0044CC]"
                {...registerActivate}
              >
                {isRegisterSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {t('auth.register')}
              </Button>
              <p className="pt-1 text-center text-sm text-[#64748B]">
                {t('auth.hasAccount')}{' '}
                <button type="button" {...tabLogin} className="guest-auth-screen__text-btn">
                  {t('auth.loginNow')}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
