'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { loginCustomer } from '@/frontend/actions/CustomerLogin';
import { registerCustomer } from '@/frontend/actions/CustomerRegister';
import { useUserSession } from '@/tools/FrontendSession';
import { useSearchParams } from 'next/navigation';
import { useCustomerAuthModal } from '@/frontend/auth/CustomerAuthModalContext';
import { DecorateText } from '@/frontend/decorate/DecorateText';
import { DecorateInput } from '@/frontend/decorate/DecorateInput';
import { useDecorateMode } from '@/frontend/decorate/DecorateContext';

interface RegisterForm {
  sysuser_name: string;
  sysuser_email: string;
  sysuser_phone: string;
  sysuser_password: string;
}

export function CustomerAuthModal() {
  const { t } = useTranslation();
  const { isOpen, activeTab, closeAuthModal, setActiveTab } = useCustomerAuthModal();
  const { set: setSession } = useUserSession();
  const { isDecorateMode } = useDecorateMode();
  const searchParams = useSearchParams();
  const authDecorate = searchParams.get('authDecorate');
  const isDecorateAuthOpen =
    isDecorateMode && (authDecorate === 'login' || authDecorate === 'register');
  const dialogOpen = isOpen || isDecorateAuthOpen;

  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginRememberMe, setLoginRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    sysuser_name: '',
    sysuser_email: '',
    sysuser_phone: '',
    sysuser_password: '',
  });
  const [registerShowPassword, setRegisterShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);

  const resetForms = () => {
    setLoginAccount('');
    setLoginPassword('');
    setLoginShowPassword(false);
    setLoginRememberMe(false);
    setLoginError(null);
    setRegisterForm({
      sysuser_name: '',
      sysuser_email: '',
      sysuser_phone: '',
      sysuser_password: '',
    });
    setRegisterShowPassword(false);
    setRegisterError(null);
  };

  useEffect(() => {
    if (!isOpen && !isDecorateMode) {
      resetForms();
    }
  }, [isOpen, isDecorateMode]);

  const handleDialogOpenChange = (open: boolean) => {
    if (open) return;
    if (isDecorateAuthOpen) return;
    closeAuthModal();
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isDecorateAuthOpen) return;
    if (!loginAccount.trim() || !loginPassword) {
      setLoginError(t('auth.loginRequired'));
      return;
    }

    setIsLoginSubmitting(true);
    setLoginError(null);

    try {
      const result = await loginCustomer({
        sysuser_account: loginAccount.trim(),
        sysuser_password: loginPassword,
      });

      setSession({
        token: result.token,
        user_id: result.sysuser_id,
        username: result.sysuser_name || result.sysuser_account,
        email: result.sysuser_email,
        preferredLocale: result.preferred_locale || 'en',
        role: 'CUSTOMER',
      });

      toast.success(t('auth.loginSuccess'));
      closeAuthModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('auth.loginFailed');
      setLoginError(message);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isDecorateAuthOpen) return;

    setIsRegisterSubmitting(true);
    setRegisterError(null);

    try {
      const registerResult = await registerCustomer(registerForm);

      // 注册成功后优先使用接口返回的 Token；若无 Token 则再调一次登录接口
      const sessionResult =
        registerResult?.token
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
            });

      setSession({
        token: sessionResult.token,
        user_id: sessionResult.sysuser_id,
        username: sessionResult.sysuser_name || sessionResult.sysuser_account,
        email: sessionResult.sysuser_email,
        preferredLocale: sessionResult.preferred_locale || 'en',
        role: 'CUSTOMER',
      });

      // 注册即登录：直接关弹窗，不切回登录页、不额外弹成功提示
      closeAuthModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('auth.registerFailed');
      setRegisterError(message);
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="max-h-[min(92vh,820px)] w-full max-w-[560px] gap-0 overflow-hidden rounded-[24px] border-[#E2E8F0] p-0"
        data-controller-name="登录注册弹窗"
        onInteractOutside={(event) => {
          if (isDecorateAuthOpen) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isDecorateAuthOpen) event.preventDefault();
        }}
      >
        {!isDecorateAuthOpen ? (
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#64748B] transition hover:border-[#CBD5E1] hover:text-[#0F172A]"
            aria-label={t('auth.close')}
          >
            <X className="size-4" />
          </button>
        ) : null}

        <DialogHeader className="space-y-3 border-b border-[#E2E8F0] px-6 pb-5 pt-6 text-left">
          <DialogTitle asChild>
            <DecorateText
              propKey={activeTab === 'login' ? 'auth_modal_title' : 'auth_modal_register_title'}
              as="h2"
              className="text-2xl font-bold tracking-tight text-[#0F172A]"
            >
              {activeTab === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
            </DecorateText>
          </DialogTitle>
          <DialogDescription asChild>
            <DecorateText
              propKey={activeTab === 'login' ? 'auth_modal_desc' : 'auth_modal_register_desc'}
              as="p"
              className="text-sm text-[#64748B]"
            >
              {activeTab === 'login' ? t('auth.loginDesc') : t('auth.registerDesc')}
            </DecorateText>
          </DialogDescription>

          <div className="flex rounded-full bg-[#F1F5F9] p-1">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition',
                  activeTab === tab
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]',
                )}
              >
                <DecorateText propKey={tab === 'login' ? 'auth_tab_login' : 'auth_tab_register'} as="span">
                  {tab === 'login' ? t('auth.login') : t('auth.register')}
                </DecorateText>
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5">
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-login-account" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                  <DecorateText propKey="auth_login_account_label" as="span">
                    {t('auth.emailOrPhone')}
                  </DecorateText>
                </Label>
                <DecorateInput
                  propKey="auth_login_account_placeholder"
                  id="auth-login-account"
                  type="text"
                  autoComplete="username"
                  placeholder={t('auth.emailOrPhonePlaceholder')}
                  disabled={isLoginSubmitting}
                  value={loginAccount}
                  onChange={(e) => {
                    setLoginAccount(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-login-password" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                  <DecorateText propKey="auth_login_password_label" as="span">
                    {t('auth.password')}
                  </DecorateText>
                </Label>
                <div className="relative">
                  <DecorateInput
                    propKey="auth_login_password_placeholder"
                    id="auth-login-password"
                    type={loginShowPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    disabled={isLoginSubmitting}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC] pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                    aria-label={loginShowPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {loginShowPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auth-remember-me"
                    checked={loginRememberMe}
                    onCheckedChange={(checked) => setLoginRememberMe(checked === true)}
                    disabled={isLoginSubmitting}
                  />
                  <Label htmlFor="auth-remember-me" className="cursor-pointer text-sm text-[#0F172A]">
                    <DecorateText propKey="auth_login_remember" as="span">
                      {t('auth.rememberAccount')}
                    </DecorateText>
                  </Label>
                </div>
                <button type="button" className="text-sm font-medium text-[#0055FF] hover:text-[#0044CC]">
                  <DecorateText propKey="auth_login_forgot" as="span">
                    {t('auth.forgotPassword')}
                  </DecorateText>
                </button>
              </div>

              {loginError ? <p className="rounded-[12px] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">{loginError}</p> : null}

              <Button
                type="submit"
                disabled={isLoginSubmitting}
                className="h-12 w-full rounded-full bg-[#0055FF] text-base font-bold text-white hover:bg-[#0044CC]"
              >
                {isLoginSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <DecorateText propKey="auth_login_submitting" as="span">
                      {t('auth.loggingIn')}
                    </DecorateText>
                  </>
                ) : (
                  <DecorateText propKey="login_submit_btn" as="span">
                    {t('auth.login')}
                  </DecorateText>
                )}
              </Button>

              <p className="pt-1 text-center text-sm text-[#64748B]">
                <DecorateText propKey="auth_login_footer_guide" as="span">
                  {t('auth.noAccount')}
                </DecorateText>{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-semibold text-[#0055FF] hover:text-[#0044CC]"
                >
                  <DecorateText propKey="auth_login_footer_action" as="span">
                    {t('auth.registerNow')}
                  </DecorateText>
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <DecorateText propKey="register_form_intro" as="p" className="text-sm leading-6 text-[#64748B]">
                {t('auth.registerIntro')}
              </DecorateText>

              <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 sm:items-start">
                <div className="space-y-2">
                  <Label htmlFor="auth-register-name" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    <DecorateText propKey="register_name_label" as="span">
                      {t('auth.name')}
                    </DecorateText>
                  </Label>
                  <DecorateInput
                    propKey="register_name_placeholder"
                    id="auth-register-name"
                    placeholder={t('auth.namePlaceholder')}
                    disabled={isRegisterSubmitting}
                    value={registerForm.sysuser_name}
                    onChange={(e) => {
                      setRegisterForm((prev) => ({ ...prev, sysuser_name: e.target.value }));
                      if (registerError) setRegisterError(null);
                    }}
                    className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-register-email" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    <DecorateText propKey="register_email_label" as="span">
                      {t('auth.email')}
                    </DecorateText>
                  </Label>
                  <DecorateInput
                    propKey="register_email_placeholder"
                    id="auth-register-email"
                    type="text"
                    placeholder={t('auth.emailPlaceholder')}
                    disabled={isRegisterSubmitting}
                    value={registerForm.sysuser_email}
                    onChange={(e) => {
                      setRegisterForm((prev) => ({ ...prev, sysuser_email: e.target.value }));
                      if (registerError) setRegisterError(null);
                    }}
                    className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-register-phone" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    <DecorateText propKey="register_phone_label" as="span">
                      {t('auth.phoneOrWhatsapp')}
                    </DecorateText>
                  </Label>
                  <DecorateInput
                    propKey="register_phone_placeholder"
                    id="auth-register-phone"
                    placeholder={t('auth.phonePlaceholder')}
                    disabled={isRegisterSubmitting}
                    value={registerForm.sysuser_phone}
                    onChange={(e) => {
                      setRegisterForm((prev) => ({ ...prev, sysuser_phone: e.target.value }));
                      if (registerError) setRegisterError(null);
                    }}
                    className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-register-password" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    <DecorateText propKey="register_password_label" as="span">
                      {t('auth.password')}
                    </DecorateText>
                  </Label>
                  <div className="relative">
                    <DecorateInput
                      propKey="register_password_placeholder"
                      id="auth-register-password"
                      type={registerShowPassword ? 'text' : 'password'}
                      placeholder={t('auth.setPassword')}
                      disabled={isRegisterSubmitting}
                      value={registerForm.sysuser_password}
                      onChange={(e) => {
                        setRegisterForm((prev) => ({ ...prev, sysuser_password: e.target.value }));
                        if (registerError) setRegisterError(null);
                      }}
                      className="h-12 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC] pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setRegisterShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                      aria-label={registerShowPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {registerShowPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {registerError ? <p className="rounded-[12px] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">{registerError}</p> : null}

              <Button
                type="submit"
                disabled={isRegisterSubmitting}
                className="h-12 w-full rounded-full bg-[#0055FF] text-base font-bold text-white hover:bg-[#0044CC]"
              >
                {isRegisterSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <DecorateText propKey="register_submitting" as="span">
                      {t('auth.registering')}
                    </DecorateText>
                  </>
                ) : (
                  <DecorateText propKey="register_submit_btn" as="span">
                    {t('auth.register')}
                  </DecorateText>
                )}
              </Button>

              <p className="pt-1 text-center text-sm text-[#64748B]">
                <DecorateText propKey="auth_register_footer_guide" as="span">
                  {t('auth.hasAccount')}
                </DecorateText>{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-semibold text-[#0055FF] hover:text-[#0044CC]"
                >
                  <DecorateText propKey="auth_register_footer_action" as="span">
                    {t('auth.loginNow')}
                  </DecorateText>
                </button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
