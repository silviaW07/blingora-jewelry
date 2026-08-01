'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, CreditCard, Globe, AlertTriangle, BadgeCheck, PackageCheck, Truck, Headphones } from "lucide-react";
import EditableImg from "@/@base/EditableImg";
import type { CustomerLoginState, CustomerLoginHandlers } from '@/frontend/hooks/useCustomerLogin';
interface Props {
  state: CustomerLoginState;
  handlers: CustomerLoginHandlers;
}
export const CustomerLoginView = ({
  state,
  handlers
}: Props) => {
  const valuePoints = [{
    text: '工厂直连批量采购',
    en: 'Factory-direct sourcing for bulk orders'
  }, {
    text: '跨境履约全链路可视化',
    en: 'Track fulfillment from supplier to destination'
  }, {
    text: '企业账号专属报价与复购协同',
    en: 'Account-based pricing and reorder support'
  }];
  const servicePoints = [{
    icon: PackageCheck,
    title: '采购账户权益',
    desc: '登录后可查看专属报价、起订量规则与历史采购记录。'
  }, {
    icon: Truck,
    title: '继续购物流程',
    desc: state.returnTo ? '当前登录后将自动返回原页面，继续完成选品或下单。' : '登录后可继续浏览现货、补货与跨境采购专区。'
  }, {
    icon: Headphones,
    title: '采购支持服务',
    desc: '支持样品沟通、订单跟进与国际物流协同。'
  }];
  const trustItems = [{
    icon: ShieldCheck,
    text: '账户加密登录'
  }, {
    icon: CreditCard,
    text: '安全交易流程'
  }, {
    icon: Globe,
    text: '跨境履约协同'
  }];
  return <section className="w-full min-h-screen bg-[#F8FAFC] relative overflow-hidden" data-controller-name="客户登录入口">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{
      backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E')"
    }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 overflow-hidden rounded-[24px] border border-[#CBD5E1] bg-[#F1F5F9] shadow-[0_20px_25px_-5px_rgba(15,23,42,0.1),0_8px_10px_-6px_rgba(15,23,42,0.1)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#0F172A] p-8 sm:p-10 lg:p-12">
            <div className="absolute inset-0 z-0">
              <EditableImg propKey="login_hero_bg" needLargeImage={true} description="Matte studio photography of premium global sourcing workflow, cargo containers, organized warehouse aisles, cool grey and deep blue tones, cinematic lighting, premium e-commerce account page hero" keywords="global sourcing warehouse premium supply chain cinematic blue" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.82)_0%,rgba(15,23,42,0.62)_45%,rgba(15,23,42,0.94)_100%)]" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3 text-[#F8FAFC]">
                <div className="flex size-11 items-center justify-center rounded-full border border-[#F8FAFC]/20 bg-[#F8FAFC]/8 backdrop-blur-sm">
                  <BadgeCheck className="size-5 text-[#60A5FA]" />
                </div>
                <div>
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.24em] text-[#CBD5E1]">
                    Global B2B Buyer Portal
                  </p>
                  <span className="font-display text-2xl font-bold tracking-tighter">
                    Blingora<span className="text-[#60A5FA]">jewelry</span>
                  </span>
                </div>
              </div>

              <div className="max-w-xl space-y-5">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">
                  Cross-border sourcing account
                </p>
                <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tighter text-[#F8FAFC] lg:text-5xl">
                  登录采购账户，继续管理选品、询价与下单流程。
                </h1>
                <p className="max-w-lg font-body text-sm leading-7 text-[#E2E8F0] sm:text-base">
                  面向跨境采购商、分销商与企业买家，统一承接工厂询盘、阶梯报价、国际物流跟踪与复购协同。
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-[18px] border border-[#F8FAFC]/10 bg-[#0F172A]/50 p-4 backdrop-blur-sm">
                  <p className="font-header text-2xl font-bold text-[#F8FAFC]">220+</p>
                  <p className="mt-1 font-body text-xs uppercase tracking-[0.08em] text-[#CBD5E1]">合作供应链节点</p>
                </div>
                <div className="rounded-[18px] border border-[#F8FAFC]/10 bg-[#0F172A]/50 p-4 backdrop-blur-sm">
                  <p className="font-header text-2xl font-bold text-[#F8FAFC]">48h</p>
                  <p className="mt-1 font-body text-xs uppercase tracking-[0.08em] text-[#CBD5E1]">采购需求快速响应</p>
                </div>
                <div className="rounded-[18px] border border-[#F8FAFC]/10 bg-[#0F172A]/50 p-4 backdrop-blur-sm">
                  <p className="font-header text-2xl font-bold text-[#F8FAFC]">100%</p>
                  <p className="mt-1 font-body text-xs uppercase tracking-[0.08em] text-[#CBD5E1]">客户账户独立认证</p>
                </div>
              </div>

              <div className="space-y-4 rounded-[20px] border border-[#F8FAFC]/10 bg-[#F8FAFC]/6 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-[#93C5FD]">
                      Buyer benefits
                    </p>
                    <h2 className="mt-2 font-header text-2xl font-bold tracking-tight text-[#F8FAFC]">
                      新用户完成注册即可开启采购协同
                    </h2>
                  </div>
                  <div className="hidden rounded-full border border-[#F8FAFC]/15 bg-[#F8FAFC]/8 px-4 py-2 text-right sm:block">
                    <p className="font-body text-[11px] uppercase tracking-[0.15em] text-[#CBD5E1]">For buyers</p>
                    <p className="font-header text-sm font-semibold text-[#F8FAFC]">RFQ / Reorder / Tracking</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {valuePoints.map((item, index) => <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#60A5FA]" />
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold text-[#F8FAFC] sm:text-base">{item.text}</p>
                        <p className="mt-1 font-body text-xs text-[#CBD5E1] sm:text-sm">{item.en}</p>
                      </div>
                    </li>)}
                </ul>

                <div className="rounded-[18px] border border-[#F8FAFC]/10 bg-[#0B1220]/50 p-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-[#93C5FD]">
                    Create account
                  </p>
                  <p className="mt-2 font-body text-sm leading-6 text-[#E2E8F0]">
                    尚未建立采购账户？注册后可保留当前访问路径，继续完成购物车、询盘或结算流程。
                  </p>
                  <Button variant="outline" onClick={handlers.handleGoToRegister} disabled={state.isSubmitting} className="mt-4 h-auto w-full rounded-full border-2 border-[#CBD5E1]/30 bg-transparent px-6 py-4 font-body text-base font-semibold text-[#F8FAFC] transition-all duration-300 hover:border-[#F8FAFC] hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-[0.98]">
                    立即注册采购账户
                    <ArrowRight className="ml-2 size-5 shrink-0" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-[#F8FAFC] p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center">
              <div className="rounded-[22px] border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] sm:p-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-[#0055FF]">
                      Account sign in
                    </p>
                    <div className="space-y-2">
                      <h2 className="font-header text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
                        欢迎回到 Blingorajewelry
                      </h2>
                      <p className="font-body text-sm leading-6 text-[#64748B] sm:text-base">
                        {state.returnTo ? '登录后将自动返回之前的购物或询盘页面，当前进度不会丢失。' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-3">
                    {servicePoints.map((item, index) => <div key={index} className="rounded-[14px] border border-[#E2E8F0] bg-white p-4">
                        <item.icon className="size-5 text-[#0055FF]" />
                        <p className="mt-3 font-body text-sm font-semibold text-[#0F172A]">{item.title}</p>
                        <p className="mt-2 font-body text-xs leading-5 text-[#64748B]">{item.desc}</p>
                      </div>)}
                  </div>

                  {state.errorMessage && <Alert className="relative overflow-hidden rounded-[16px] border-none bg-[#EF4444] p-4 text-[#F8FAFC] shadow-sm">
                      <AlertTriangle className="absolute left-4 top-4 size-5 text-[#F8FAFC]" />
                      <div className="ml-8">
                        <AlertTitle className="font-header text-base font-bold text-[#F8FAFC]">
                          登录未通过
                        </AlertTitle>
                        <AlertDescription className="mt-1 font-body text-sm leading-6 text-[#F8FAFC]/90">
                          {state.errorMessage}
                        </AlertDescription>
                      </div>
                    </Alert>}

                  <form onSubmit={handlers.handleLoginSubmit} className="space-y-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="sysuser_account" className="block font-body text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                        Email
                      </Label>
                      <Input id="sysuser_account" data-auto="account" type="text" placeholder="请输入 Email" autoComplete="username" disabled={state.isSubmitting} value={state.formData.sysuser_account} onChange={e => handlers.handleFormFieldChange('sysuser_account', e.target.value)} className="h-14 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC] px-4 font-body text-base text-[#0F172A] placeholder:text-[#64748B] shadow-sm transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#0055FF]" />
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="sysuser_password" className="block font-body text-xs font-semibold uppercase tracking-[0.08em] text-[#0F172A]">
                        登录密码
                      </Label>
                      <div className="relative">
                        <Input id="sysuser_password" data-auto="password" type={state.showPassword ? 'text' : 'password'} placeholder="请输入密码" autoComplete="current-password" disabled={state.isSubmitting} value={state.formData.sysuser_password} onChange={e => handlers.handleFormFieldChange('sysuser_password', e.target.value)} className="h-14 rounded-[12px] border-[#CBD5E1] bg-[#F8FAFC] px-4 pr-14 font-body text-base text-[#0F172A] placeholder:text-[#64748B] shadow-sm transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#0055FF]" />
                        <Button type="button" variant="ghost" size="icon" disabled={state.isSubmitting} onClick={handlers.togglePasswordVisibility} title={state.showPassword ? '隐藏密码' : '显示密码'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[10px] text-[#64748B] transition-colors hover:bg-[#E2E8F0] hover:text-[#0F172A]">
                          {state.showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox id="remember_me" disabled={state.isSubmitting} checked={state.rememberMe} onCheckedChange={handlers.handleRememberMeChange} className="rounded-[4px] border-[#CBD5E1] text-[#0055FF] data-[state=checked]:border-[#0055FF] data-[state=checked]:bg-[#0055FF]" />
                        <Label htmlFor="remember_me" className="cursor-pointer font-body text-sm font-medium text-[#0F172A]">
                          记住账号
                        </Label>
                      </div>

                      <Button type="button" variant="link" disabled={state.isSubmitting} className="h-auto justify-start p-0 font-body text-sm font-medium text-[#0055FF] hover:text-[#0044CC]">
                        忘记密码？
                      </Button>
                    </div>

                    <div className="rounded-[18px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4">
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                        Return flow
                      </p>
                      <p className="mt-2 font-body text-sm leading-6 text-[#475569]">
                        {state.returnTo ? '当前会话含返回路径，登录成功后将直接回到原浏览流程继续操作。' : '当前未检测到返回路径，登录成功后将进入首页继续浏览商品。'}
                      </p>
                    </div>

                    <Button type="submit" data-auto="submit" disabled={state.isSubmitting} className="block h-auto w-full rounded-full bg-[#0055FF] px-6 py-4 font-body text-lg font-bold text-[#F8FAFC] transition-all duration-200 hover:bg-[#0044CC] hover:shadow-[0_0_15px_rgba(0,85,255,0.3)] focus-visible:ring-2 focus-visible:ring-[#0055FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98]">
                      {state.isSubmitting ? '正在验证采购账户...' : '登录并继续采购'}
                    </Button>
                  </form>

                  <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-[#0055FF]">
                          New buyer onboarding
                        </p>
                        <p className="mt-2 font-body text-sm leading-6 text-[#475569]">
                          首次采购可先注册账户，保留当前回流路径并进入企业买家流程。
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={handlers.handleGoToRegister} disabled={state.isSubmitting} className="rounded-full border-[#CBD5E1] bg-white px-5 py-2 font-body text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#0055FF] hover:text-[#0055FF]">
                        去注册
                        <ArrowRight className="ml-2 size-4 shrink-0" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-6 flex w-full max-w-[560px] flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-6">
              {trustItems.map((item, index) => <div key={index} className="flex min-w-0 items-center gap-2 text-[#64748B] transition-colors duration-300 hover:text-[#0F172A]">
                  <item.icon className="size-5 shrink-0" />
                  <span className="font-body text-xs font-semibold uppercase tracking-[0.05em]">{item.text}</span>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default CustomerLoginView;
