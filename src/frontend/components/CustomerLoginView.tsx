'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { DecorateText } from '@/frontend/decorate/DecorateText';
import type { CustomerLoginState, CustomerLoginHandlers } from '@/frontend/hooks/useCustomerLogin';

interface Props {
  state: CustomerLoginState;
  handlers: CustomerLoginHandlers;
}

export const CustomerLoginView = ({ state, handlers }: Props) => {
  const trustItems = [
    { icon: ShieldCheck, textKey: 'login_trust_0', defaultText: '账户加密登录' },
    { icon: CreditCard, textKey: 'login_trust_1', defaultText: '安全交易流程' },
    { icon: Globe, textKey: 'login_trust_2', defaultText: '跨境履约协同' },
  ];

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#FFF5F5]" data-controller-name="客户登录入口">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E')",
        }}
      />

      <div className="container relative z-10 mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[560px] flex-col justify-center">
          <div className="rounded-[22px] border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <DecorateText
                  propKey="login_form_eyebrow"
                  as="p"
                  className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-[#0055FF]"
                >
                  Account sign in
                </DecorateText>
                <div className="space-y-2">
                  <DecorateText
                    propKey="login_form_title"
                    as="h2"
                    className="font-header text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl"
                  >
                    欢迎回到 Blingorajewelry
                  </DecorateText>
                  {state.returnTo ? (
                    <DecorateText propKey="login_return_hint" as="p" className="font-body text-sm leading-6 text-[#64748B] sm:text-base">
                      登录后将自动返回之前的购物或询盘页面，当前进度不会丢失。
                    </DecorateText>
                  ) : null}
                </div>
              </div>

              {state.errorMessage ? (
                <Alert className="relative overflow-hidden rounded-[16px] border-none bg-[#EF4444] p-4 text-[#F8FAFC] shadow-sm">
                  <AlertTriangle className="absolute left-4 top-4 size-5 text-[#F8FAFC]" />
                  <div className="ml-8">
                    <AlertTitle className="font-header text-base font-bold text-[#F8FAFC]">
                      <DecorateText propKey="login_error_title" as="span">
                        登录未通过
                      </DecorateText>
                    </AlertTitle>
                    <AlertDescription className="mt-1 font-body text-sm leading-6 text-[#F8FAFC]/90">
                      {state.errorMessage}
                    </AlertDescription>
                  </div>
                </Alert>
              ) : null}

              <form onSubmit={handlers.handleLoginSubmit} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="sysuser_account" className="block font-body text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    <DecorateText propKey="auth_login_account_label" as="span">
                      Email
                    </DecorateText>
                  </Label>
                  <Input
                    id="sysuser_account"
                    data-auto="account"
                    type="text"
                    placeholder="请输入 Email"
                    autoComplete="username"
                    disabled={state.isSubmitting}
                    value={state.formData.sysuser_account}
                    onChange={(e) => handlers.handleFormFieldChange('sysuser_account', e.target.value)}
                    className="h-14 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC] px-4 font-body text-base text-[#0F172A] placeholder:text-[#64748B] shadow-sm transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#0055FF]"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="sysuser_password" className="block font-body text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                    <DecorateText propKey="auth_login_password_label" as="span">
                      登录密码
                    </DecorateText>
                  </Label>
                  <div className="relative">
                    <Input
                      id="sysuser_password"
                      data-auto="password"
                      type={state.showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                      disabled={state.isSubmitting}
                      value={state.formData.sysuser_password}
                      onChange={(e) => handlers.handleFormFieldChange('sysuser_password', e.target.value)}
                      className="h-14 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC] px-4 pr-14 font-body text-base text-[#0F172A] placeholder:text-[#64748B] shadow-sm transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#0055FF]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={state.isSubmitting}
                      onClick={handlers.togglePasswordVisibility}
                      title={state.showPassword ? '隐藏密码' : '显示密码'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[10px] text-[#64748B] transition-colors hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                    >
                      {state.showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember_me"
                      disabled={state.isSubmitting}
                      checked={state.rememberMe}
                      onCheckedChange={handlers.handleRememberMeChange}
                      className="rounded-[4px] border-[#CBD5E1] text-[#0055FF] data-[state=checked]:border-[#0055FF] data-[state=checked]:bg-[#0055FF]"
                    />
                    <Label htmlFor="remember_me" className="cursor-pointer font-body text-sm font-medium text-[#0F172A]">
                      <DecorateText propKey="auth_login_remember" as="span">
                        记住账号
                      </DecorateText>
                    </Label>
                  </div>

                  <Button
                    type="button"
                    variant="link"
                    disabled={state.isSubmitting}
                    className="h-auto justify-start p-0 font-body text-sm font-medium text-[#0055FF] hover:text-[#0044CC]"
                  >
                    <DecorateText propKey="auth_login_forgot" as="span">
                      忘记密码？
                    </DecorateText>
                  </Button>
                </div>

                <div className="rounded-[18px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4">
                  <DecorateText propKey="login_return_flow_title" as="p" className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                    Return flow
                  </DecorateText>
                  <DecorateText
                    propKey={state.returnTo ? 'login_return_flow_desc_with' : 'login_return_flow_desc_without'}
                    as="p"
                    className="mt-2 font-body text-sm leading-6 text-[#475569]"
                  >
                    {state.returnTo
                      ? '当前会话含返回路径，登录成功后将直接回到原浏览流程继续操作。'
                      : '当前未检测到返回路径，登录成功后将进入首页继续浏览商品。'}
                  </DecorateText>
                </div>

                <Button
                  type="submit"
                  data-auto="submit"
                  disabled={state.isSubmitting}
                  className="block h-auto w-full rounded-full bg-[#0055FF] px-6 py-4 font-body text-lg font-bold text-[#F8FAFC] transition-all duration-200 hover:bg-[#0044CC] hover:shadow-[0_0_15px_rgba(0,85,255,0.3)] focus-visible:ring-2 focus-visible:ring-[#0055FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98]"
                >
                  {state.isSubmitting ? (
                    <DecorateText propKey="auth_login_submitting" as="span">
                      正在验证采购账户...
                    </DecorateText>
                  ) : (
                    <DecorateText propKey="login_submit_btn" as="span">
                      登录并继续采购
                    </DecorateText>
                  )}
                </Button>
              </form>

              <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <DecorateText propKey="login_onboarding_title" as="p" className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-[#0055FF]">
                      New buyer onboarding
                    </DecorateText>
                    <DecorateText propKey="login_onboarding_desc" as="p" className="mt-2 font-body text-sm leading-6 text-[#475569]">
                      首次采购可先注册账户，保留当前回流路径并进入企业买家流程。
                    </DecorateText>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlers.handleGoToRegister}
                    disabled={state.isSubmitting}
                    className="rounded-full border-[#CBD5E1] bg-white px-5 py-2 font-body text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#0055FF] hover:text-[#0055FF]"
                  >
                    <DecorateText propKey="login_left_register_btn" as="span">
                      去注册
                    </DecorateText>
                    <ArrowRight className="ml-2 size-4 shrink-0" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-6">
            {trustItems.map((item) => (
              <div
                key={item.textKey}
                className="flex min-w-0 items-center gap-2 text-[#64748B] transition-colors duration-300 hover:text-[#0F172A]"
              >
                <item.icon className="size-5 shrink-0" />
                <DecorateText propKey={item.textKey} as="span" className="font-body text-xs font-semibold uppercase tracking-[0.05em]">
                  {item.defaultText}
                </DecorateText>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerLoginView;
