'use client';

import React from 'react';
import EditableText from '@/@base/EditableText';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Lock, ShieldCheck, Loader2, Check, X, Minus, Eye, EyeOff, ArrowRight, CheckCircle2, Globe2, PackageCheck, BadgeCheck, Mail } from 'lucide-react';
import type { CustomerRegisterState, CustomerRegisterHandlers } from '@/frontend/hooks/useCustomerRegister';
interface Props {
  state: CustomerRegisterState;
  handlers: CustomerRegisterHandlers;
}
export const CustomerRegisterView = ({
  state,
  handlers
}: Props) => {
  const {
    form,
    emailStatus,
    showPassword,
    globalError,
    isSubmitting,
    isSuccess,
    pwdRules
  } = state;
  const {
    handleFormFieldChange,
    handleTogglePassword,
    handleSubmit,
    handleGoLogin
  } = handlers;
  return <section className="w-full min-h-screen bg-[#F8FAFC] relative overflow-hidden" data-controller-name="跨境采购账户注册">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{
      backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 200 200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.65\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\'/%3E%3C/svg%3E')"
    }} />

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,85,255,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_28%)]" />

      <div className="container mx-auto px-6 py-10 md:px-8 md:py-16 relative z-10 min-h-screen flex items-center">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-[28px] border border-[#CBD5E1] bg-[#F1F5F9] shadow-[0_24px_60px_rgba(15,23,42,0.10)] lg:grid-cols-[1.05fr_0.95fr]">
          {isSuccess ? <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative overflow-hidden bg-[#0F172A] px-8 py-10 md:px-12 md:py-14 text-[#F8FAFC]">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,85,255,0.28),transparent_45%,rgba(255,255,255,0.06))]" />
                <div className="relative flex h-full flex-col justify-between gap-10">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                      <Building2 className="size-4" />
                      Blingorajewelry
                    </div>
                    <div className="space-y-4">
                      <p className="font-body text-sm font-semibold uppercase tracking-[0.22em] text-white/60">
                        Cross-border sourcing account
                      </p>
                      <h1 className="font-display text-4xl font-extrabold tracking-tighter text-white md:text-5xl">
                        采购账户已创建，可继续登录并开始加购。
                      </h1>
                      <p className="max-w-xl font-body text-base leading-relaxed text-white/72">
                        您的专属采购身份与购物车上下文已准备完成。登录后即可继续浏览现货、询盘补货并沉淀跨境采购记录。
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[18px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                      <PackageCheck className="mb-3 size-6 text-white" />
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-white/60">购物车承接</p>
                      <p className="mt-2 font-body text-sm leading-relaxed text-white/80">采购清单可在登录后直接继续整理与比价。</p>
                    </div>
                    <div className="rounded-[18px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                      <Globe2 className="mb-3 size-6 text-white" />
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-white/60">全球采购</p>
                      <p className="mt-2 font-body text-sm leading-relaxed text-white/80">统一承接跨境选品、询盘与订单沟通场景。</p>
                    </div>
                    <div className="rounded-[18px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                      <ShieldCheck className="mb-3 size-6 text-white" />
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-white/60">安全访问</p>
                      <p className="mt-2 font-body text-sm leading-relaxed text-white/80">账户凭证已按平台标准完成加密保护。</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center bg-[#FFFFFF] px-8 py-10 md:px-12 md:py-14">
                <div className="w-full max-w-none">
                  <div className="flex flex-col items-center justify-center rounded-[24px] border border-[#DBE4F0] bg-[#F8FAFC] px-6 py-10 text-center shadow-card-sm md:px-8 md:py-12 animate-in fade-in zoom-in duration-500">
                    <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-[#0055FF]/10">
                      <CheckCircle2 className="size-10 text-[#0055FF]" />
                    </div>
                    <h2 className="font-display text-3xl font-extrabold tracking-tighter text-[#0F172A] md:text-4xl">
                      账户创建成功
                    </h2>
                    <p className="mt-4 font-body text-base leading-relaxed text-[#64748B] md:px-6">
                      现在登录即可进入采购站，继续管理购物车、补充收货信息并推进后续下单流程。
                    </p>
                    <Button onClick={handleGoLogin} className="mt-8 h-14 w-full rounded-full bg-[#0055FF] text-[#F8FAFC] font-body text-lg font-bold hover:bg-[#0044CC] hover:shadow-glow transition-all duration-200 active:scale-[0.98] outline-none">
                      <span className="truncate">立即前往登录</span>
                      <ArrowRight className="ml-2 size-5 shrink-0" />
                    </Button>
                    <p className="mt-5 font-body text-sm text-[#64748B]">
                      登录后可继续此前采购路径，无需重新建立购物上下文。
                    </p>
                  </div>
                </div>
              </div>
            </div> : <>
              <div className="relative overflow-hidden bg-[#0F172A] px-8 py-10 md:px-12 md:py-14 text-[#F8FAFC]">
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(0,85,255,0.28),transparent_42%,rgba(255,255,255,0.06))]" />
                <div className="relative flex h-full flex-col justify-between gap-10">
                  <div className="space-y-7">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                      <Building2 className="size-4" />
                      <EditableText propKey="register_left_badge" className="inline-block">Blingorajewelry</EditableText>
                    </div>

                    <div className="space-y-4">
                      <p className="font-body text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                        <EditableText propKey="register_left_eyebrow" className="inline-block">Global sourcing membership</EditableText>
                      </p>
                      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tighter text-white md:text-5xl">
                        <EditableText propKey="register_left_title" className="inline-block">Register </EditableText>
                      </h1>
                      <p className="max-w-xl font-body text-base leading-relaxed text-white/72">
                        <EditableText propKey="register_left_desc" className="inline-block">面向持续采购用户，注册后即可沉淀账户身份、采购偏好与购物车上下文，更顺畅地推进多品类跨境下单。</EditableText>
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[18px] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                        <PackageCheck className="mb-3 size-6 text-white" />
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                          <EditableText propKey="register_left_card1_title" className="inline-block">注册后直接承接购物车</EditableText>
                        </p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-white/80">
                          <EditableText propKey="register_left_card1_desc" className="inline-block">新账户创建成功后自动初始化采购购物车，后续登录即可继续加购与整理需求。</EditableText>
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                        <BadgeCheck className="mb-3 size-6 text-white" />
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                          <EditableText propKey="register_left_card2_title" className="inline-block">供应链沟通更规范</EditableText>
                        </p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-white/80">
                          <EditableText propKey="register_left_card2_desc" className="inline-block">统一管理账户身份、业务邮箱与安全凭证，适配长期跨境采购协作场景。</EditableText>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[20px] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                        <EditableText propKey="register_left_benefits_title" className="inline-block">账户开通后可获得</EditableText>
                      </p>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-white/10 text-white">
                            <Globe2 className="size-4" />
                          </div>
                          <div>
                            <p className="font-body text-sm font-semibold text-white">
                              <EditableText propKey="register_left_benefit1_title" className="inline-block">跨境采购身份沉淀</EditableText>
                            </p>
                            <p className="mt-1 font-body text-sm leading-relaxed text-white/70">
                              <EditableText propKey="register_left_benefit1_desc" className="inline-block">统一承接全球采购浏览、询盘与复购入口。</EditableText>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-white/10 text-white">
                            <Mail className="size-4" />
                          </div>
                          <div>
                            <p className="font-body text-sm font-semibold text-white">
                              <EditableText propKey="register_left_benefit2_title" className="inline-block">业务通知触达</EditableText>
                            </p>
                            <p className="mt-1 font-body text-sm leading-relaxed text-white/70">
                              <EditableText propKey="register_left_benefit2_desc" className="inline-block">使用常用邮箱接收采购协作、订单进展与服务通知。</EditableText>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-white/10 text-white">
                            <Lock className="size-4" />
                          </div>
                          <div>
                            <p className="font-body text-sm font-semibold text-white">
                              <EditableText propKey="register_left_benefit3_title" className="inline-block">安全认证访问</EditableText>
                            </p>
                            <p className="mt-1 font-body text-sm leading-relaxed text-white/70">
                              <EditableText propKey="register_left_benefit3_desc" className="inline-block">设置登录密码后即可安全访问账户并继续采购流程。</EditableText>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-white/70">
                      <div className="flex items-center gap-2">
                        <Lock className="size-[18px]" />
                        <span className="font-body text-xs font-semibold uppercase tracking-[0.05em]">
                          <EditableText propKey="register_left_footer1" className="inline-block">256-bit SSL 加密</EditableText>
                        </span>
                      </div>
                      <div className="h-[14px] w-px bg-white/15" />
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-[18px]" />
                        <span className="font-body text-xs font-semibold uppercase tracking-[0.05em]">
                          <EditableText propKey="register_left_footer2" className="inline-block">采购数据合规保护</EditableText>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FFFFFF] px-8 py-10 md:px-12 md:py-14">
                <div className="mx-auto flex w-full max-w-none flex-col">
                  <div className="mb-8 flex flex-col gap-4 border-b border-[#E2E8F0] pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]">
                        Create sourcing account
                      </p>
                      <h2 className="font-display text-3xl font-extrabold tracking-tighter text-[#0F172A] md:text-4xl">
                        注册采购账户
                      </h2>
                      <p className="font-body text-sm leading-relaxed text-[#64748B] md:text-[15px]">
                        仅需填写邮箱、WhatsApp 与密码即可完成账户创建。
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[#DBE4F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569] shadow-card-sm">
                      <span className="font-body">已有账户？</span>
                      <button onClick={handleGoLogin} disabled={isSubmitting} className="ml-2 font-semibold text-[#0055FF] hover:underline disabled:opacity-50">
                        立即登录
                      </button>
                    </div>
                  </div>

                  <form onSubmit={e => {
                e.preventDefault();
                handleSubmit();
              }} className="flex flex-col">
                    <fieldset disabled={isSubmitting} className="flex flex-col gap-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="flex flex-col space-y-2 md:col-span-2">
                          <label className="font-body text-xs font-semibold uppercase tracking-[0.05em] text-[#0F172A]">
                            姓名
                          </label>
                          <Input value={form.sysuser_name} onChange={e => handleFormFieldChange('sysuser_name', e.target.value)} className="h-12 flex-1 bg-[#F8FAFC] border-[#CBD5E1] rounded-[10px] px-4 font-body text-base text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-2 focus-visible:ring-[#0055FF] focus-visible:border-transparent transition-all shadow-sm" placeholder="请输入您的姓名或常用称呼" />
                          <p className="font-body text-xs leading-relaxed text-[#64748B]">该姓名将作为前台账户优先展示名称显示在头像下方。</p>
                        </div>

                        <div className="flex flex-col space-y-2 md:col-span-2">
                          <label className="font-body text-xs font-semibold uppercase tracking-[0.05em] text-[#0F172A]">
                            业务联络邮箱
                          </label>
                          <div className="flex items-center gap-3">
                            <Input type="email" value={form.sysuser_email} onChange={e => handleFormFieldChange('sysuser_email', e.target.value)} className="h-12 flex-1 bg-[#F8FAFC] border-[#CBD5E1] rounded-[10px] px-4 font-body text-base text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-2 focus-visible:ring-[#0055FF] focus-visible:border-transparent transition-all shadow-sm" placeholder="请输入常用采购沟通邮箱" />
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-[#CBD5E1] bg-[#F1F5F9] text-[#64748B]">
                              {emailStatus === 'loading' && <Loader2 className="size-5 animate-spin text-[#0055FF]" />}
                              {emailStatus === 'valid' && <Check className="size-5 text-green-600" />}
                              {emailStatus === 'invalid' && <X className="size-5 text-[#EF4444]" />}
                              {emailStatus === 'idle' && <Minus className="size-5 opacity-50" />}
                            </div>
                          </div>
                          <p className="font-body text-xs leading-relaxed text-[#64748B]">用于接收采购通知、订单动态与账户提醒。</p>
                        </div>

                        <div className="flex flex-col space-y-2 md:col-span-2">
                          <label className="font-body text-xs font-semibold uppercase tracking-[0.05em] text-[#0F172A]">
                            WhatsApp 号码
                          </label>
                          <Input value={form.sysuser_phone} onChange={e => handleFormFieldChange('sysuser_phone', e.target.value)} className="h-12 flex-1 bg-[#F8FAFC] border-[#CBD5E1] rounded-[10px] px-4 font-body text-base text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-2 focus-visible:ring-[#0055FF] focus-visible:border-transparent transition-all shadow-sm" placeholder="请输入常用 WhatsApp 联系方式" />
                          <p className="font-body text-xs leading-relaxed text-[#64748B]">用于后续订单沟通、发货确认与售后协作联系。</p>
                        </div>

                        <div className="flex flex-col space-y-2 md:col-span-2">
                          <label className="font-body text-xs font-semibold uppercase tracking-[0.05em] text-[#0F172A]">
                            安全访问密码
                          </label>
                          <div className="flex items-center gap-3">
                            <Input type={showPassword ? 'text' : 'password'} value={form.sysuser_password} onChange={e => handleFormFieldChange('sysuser_password', e.target.value)} className="h-12 flex-1 bg-[#F8FAFC] border-[#CBD5E1] rounded-[10px] px-4 font-body text-base text-[#0F172A] placeholder:text-[#64748B] focus-visible:ring-2 focus-visible:ring-[#0055FF] focus-visible:border-transparent transition-all shadow-sm" placeholder="设置采购账户登录密码" />
                            <button type="button" onClick={handleTogglePassword} className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-[#CBD5E1] bg-[#F1F5F9] text-[#0F172A] transition-colors hover:bg-[#E2E8F0] focus-visible:ring-2 focus-visible:ring-[#0055FF] outline-none cursor-pointer">
                              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                          </div>
                        </div>
                      </div>


                      {globalError && <Alert variant="destructive" className="flex items-center rounded-[12px] border-transparent bg-[#EF4444] text-[#F8FAFC] shadow-sm">
                          <X className="size-5 shrink-0" stroke="currentColor" />
                          <AlertDescription className="ml-2 w-full font-body text-sm font-medium leading-tight">
                            {globalError}
                          </AlertDescription>
                        </Alert>}

                      <div className="rounded-[18px] border border-[#DBE4F0] bg-[#F8FAFC] p-4">
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">注册后承接说明</p>
                        <p className="mt-2 font-body text-sm leading-relaxed text-[#475569]">
                          注册完成后可直接登录，并继续后续商品浏览与购物流程。
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Button type="submit" disabled={isSubmitting} className="h-14 w-full rounded-full bg-[#0055FF] text-[#F8FAFC] font-body text-lg font-bold hover:bg-[#0044CC] hover:shadow-glow transition-all duration-200 active:scale-[0.98] outline-none">
                          {isSubmitting && <Loader2 className="mr-3 size-5 shrink-0 animate-spin" />}
                          <span className="truncate">{isSubmitting ? '正在创建采购账户...' : '创建账户'}</span>
                        </Button>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-body text-sm text-[#64748B]">
                            已有采购账户？
                            <button onClick={handleGoLogin} disabled={isSubmitting} className="ml-2 font-semibold text-[#0055FF] hover:underline disabled:opacity-50">
                              前往登录
                            </button>
                          </p>
                          <div className="flex items-center gap-3 text-[#64748B]">
                            <div className="flex items-center gap-2">
                              <Lock className="size-[16px]" />
                              <span className="font-body text-xs font-semibold uppercase tracking-[0.05em]">SSL 加密</span>
                            </div>
                            <div className="h-[14px] w-px bg-[#CBD5E1]" />
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="size-[16px]" />
                              <span className="font-body text-xs font-semibold uppercase tracking-[0.05em]">隐私合规</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  </form>
                </div>
              </div>
            </>}
        </div>
      </div>
    </section>;
};
export default CustomerRegisterView;
