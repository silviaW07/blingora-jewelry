'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock,
  ShieldCheck,
  Loader2,
  X,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DecorateText } from '@/frontend/decorate/DecorateText';
import type { CustomerRegisterState, CustomerRegisterHandlers } from '@/frontend/hooks/useCustomerRegister';

interface Props {
  state: CustomerRegisterState;
  handlers: CustomerRegisterHandlers;
}

export const CustomerRegisterView = ({ state, handlers }: Props) => {
  const { form, showPassword, globalError, isSubmitting, isSuccess } = state;
  const { handleFormFieldChange, handleTogglePassword, handleSubmit, handleGoLogin } = handlers;

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#FFF5F5]" data-controller-name="跨境采购账户注册">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 200 200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.65\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\'/%3E%3C/svg%3E')",
        }}
      />

      <div className="container relative z-10 mx-auto flex min-h-screen items-center px-6 py-10 md:px-8 md:py-16">
        <div className="mx-auto w-full max-w-[640px]">
          {isSuccess ? (
            <div className="rounded-[24px] border border-[#DBE4F0] bg-white px-6 py-10 text-center shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] md:px-8 md:py-12">
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#0055FF]/10">
                <CheckCircle2 className="size-10 text-[#0055FF]" />
              </div>
              <DecorateText
                propKey="register_success_title"
                as="h2"
                className="font-display text-3xl font-extrabold tracking-tighter text-[#0F172A] md:text-4xl"
              >
                账户创建成功
              </DecorateText>
              <DecorateText propKey="register_success_desc" as="p" className="mt-4 font-body text-base leading-relaxed text-[#64748B] md:px-6">
                现在登录即可进入采购站，继续管理购物车、补充收货信息并推进后续下单流程。
              </DecorateText>
              <Button
                onClick={handleGoLogin}
                className="mt-8 h-14 w-full rounded-full bg-[#0055FF] font-body text-lg font-bold text-[#F8FAFC] transition-all duration-200 hover:bg-[#0044CC] hover:shadow-glow active:scale-[0.98] outline-none"
              >
                <DecorateText propKey="register_success_btn" as="span" className="truncate">
                  立即前往登录
                </DecorateText>
                <ArrowRight className="ml-2 size-5 shrink-0" />
              </Button>
              <DecorateText propKey="register_success_footer" as="p" className="mt-5 font-body text-sm text-[#64748B]">
                登录后可继续此前采购路径，无需重新建立购物上下文。
              </DecorateText>
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#CBD5E1] bg-white px-8 py-10 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] md:px-12 md:py-14">
              <div className="mb-8 flex flex-col gap-4 border-b border-[#E2E8F0] pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <DecorateText propKey="register_form_eyebrow" as="p" className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]">
                    Create sourcing account
                  </DecorateText>
                  <DecorateText propKey="register_form_title" as="h2" className="font-display text-3xl font-extrabold tracking-tighter text-[#0F172A] md:text-4xl">
                    注册采购账户
                  </DecorateText>
                  <DecorateText propKey="register_form_intro" as="p" className="font-body text-sm leading-relaxed text-[#64748B] md:text-[15px]">
                    仅需填写邮箱、WhatsApp 与密码即可完成账户创建。
                  </DecorateText>
                </div>
                <div className="rounded-[16px] border border-[#DBE4F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569] shadow-card-sm">
                  <DecorateText propKey="register_has_account" as="span" className="font-body">
                    已有账户？
                  </DecorateText>
                  <button
                    onClick={handleGoLogin}
                    disabled={isSubmitting}
                    className="ml-2 font-semibold text-[#0055FF] hover:underline disabled:opacity-50"
                  >
                    <DecorateText propKey="register_go_login" as="span">
                      立即登录
                    </DecorateText>
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="flex flex-col"
              >
                <fieldset disabled={isSubmitting} className="flex flex-col gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="flex flex-col space-y-2 md:col-span-2">
                      <DecorateText propKey="register_name_label" as="label" className="font-body text-xs font-semibold uppercase tracking-[0.05em] text-[#0F172A]">
                        姓名
                      </DecorateText>
                      <Input
                        value={form.sysuser_name}
                        onChange={(e) => handleFormFieldChange('sysuser_name', e.target.value)}
                        className="h-12 flex-1 rounded-[10px] border-[#CBD5E1] bg-[#F8FAFC] px-4 font-body text-base text-[#0F172A] shadow-sm placeholder:text-[#64748B] transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#0055FF]"
                        placeholder="请输入您的姓名或常用称呼"
                      />
                      <DecorateText propKey="register_name_hint" as="p" className="font-body text-xs leading-relaxed text-[#64748B]">
                        该姓名将作为前台账户优先展示名称显示在头像下方。
                      </DecorateText>
                    </div>

                    <div className="flex flex-col space-y-2 md:col-span-2">
                      <DecorateText propKey="register_email_label" as="label" className="font-body text-xs font-semibold uppercase tracking-[0.05em] text-[#0F172A]">
                        业务联络邮箱
                      </DecorateText>
                      <Input
                        type="text"
                        value={form.sysuser_email}
                        onChange={(e) => handleFormFieldChange('sysuser_email', e.target.value)}
                        className="h-12 flex-1 rounded-[10px] border-[#CBD5E1] bg-[#F8FAFC] px-4 font-body text-base text-[#0F172A] shadow-sm placeholder:text-[#64748B] transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#0055FF]"
                        placeholder="请输入常用采购沟通邮箱"
                      />
                      <DecorateText propKey="register_email_hint" as="p" className="font-body text-xs leading-relaxed text-[#64748B]">
                        用于接收采购通知、订单动态与账户提醒。
                      </DecorateText>
                    </div>

                    <div className="flex flex-col space-y-2 md:col-span-2">
                      <DecorateText propKey="register_phone_label" as="label" className="font-body text-xs font-semibold uppercase tracking-[0.05em] text-[#0F172A]">
                        WhatsApp 号码
                      </DecorateText>
                      <Input
                        value={form.sysuser_phone}
                        onChange={(e) => handleFormFieldChange('sysuser_phone', e.target.value)}
                        className="h-12 flex-1 rounded-[10px] border-[#CBD5E1] bg-[#F8FAFC] px-4 font-body text-base text-[#0F172A] shadow-sm placeholder:text-[#64748B] transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#0055FF]"
                        placeholder="请输入常用 WhatsApp 联系方式"
                      />
                      <DecorateText propKey="register_phone_hint" as="p" className="font-body text-xs leading-relaxed text-[#64748B]">
                        用于后续订单沟通、发货确认与售后协作联系。
                      </DecorateText>
                    </div>

                    <div className="flex flex-col space-y-2 md:col-span-2">
                      <DecorateText propKey="register_password_label" as="label" className="font-body text-xs font-semibold uppercase tracking-[0.05em] text-[#0F172A]">
                        安全访问密码
                      </DecorateText>
                      <div className="flex items-center gap-3">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={form.sysuser_password}
                          onChange={(e) => handleFormFieldChange('sysuser_password', e.target.value)}
                          className="h-12 flex-1 rounded-[10px] border-[#CBD5E1] bg-[#F8FAFC] px-4 font-body text-base text-[#0F172A] shadow-sm placeholder:text-[#64748B] transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#0055FF]"
                          placeholder="设置采购账户登录密码"
                        />
                        <button
                          type="button"
                          onClick={handleTogglePassword}
                          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#CBD5E1] bg-[#F1F5F9] text-[#0F172A] transition-colors hover:bg-[#E2E8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055FF]"
                        >
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {globalError ? (
                    <Alert variant="destructive" className="flex items-center rounded-[12px] border-transparent bg-[#EF4444] text-[#F8FAFC] shadow-sm">
                      <X className="size-5 shrink-0" stroke="currentColor" />
                      <AlertDescription className="ml-2 w-full font-body text-sm font-medium leading-tight">
                        {globalError}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="rounded-[18px] border border-[#DBE4F0] bg-[#F8FAFC] p-4">
                    <DecorateText propKey="register_after_title" as="p" className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                      注册后承接说明
                    </DecorateText>
                    <DecorateText propKey="register_after_desc" as="p" className="mt-2 font-body text-sm leading-relaxed text-[#475569]">
                      注册完成后可直接登录，并继续后续商品浏览与购物流程。
                    </DecorateText>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-14 w-full rounded-full bg-[#0055FF] font-body text-lg font-bold text-[#F8FAFC] transition-all duration-200 hover:bg-[#0044CC] hover:shadow-glow active:scale-[0.98] outline-none"
                    >
                      {isSubmitting && <Loader2 className="mr-3 size-5 shrink-0 animate-spin" />}
                      <DecorateText propKey="register_submit_btn" as="span" className="truncate">
                        {isSubmitting ? '正在创建采购账户...' : '创建账户'}
                      </DecorateText>
                    </Button>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-body text-sm text-[#64748B]">
                        <DecorateText propKey="register_has_account_footer" as="span">
                          已有采购账户？
                        </DecorateText>
                        <button
                          onClick={handleGoLogin}
                          disabled={isSubmitting}
                          className="ml-2 font-semibold text-[#0055FF] hover:underline disabled:opacity-50"
                        >
                          <DecorateText propKey="register_go_login_footer" as="span">
                            前往登录
                          </DecorateText>
                        </button>
                      </p>
                      <div className="flex items-center gap-3 text-[#64748B]">
                        <div className="flex items-center gap-2">
                          <Lock className="size-[16px]" />
                          <DecorateText propKey="register_ssl" as="span" className="font-body text-xs font-semibold uppercase tracking-[0.05em]">
                            SSL 加密
                          </DecorateText>
                        </div>
                        <div className="h-[14px] w-px bg-[#CBD5E1]" />
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-[16px]" />
                          <DecorateText propKey="register_privacy" as="span" className="font-body text-xs font-semibold uppercase tracking-[0.05em]">
                            隐私合规
                          </DecorateText>
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomerRegisterView;
