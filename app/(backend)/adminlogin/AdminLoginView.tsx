'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, User, Globe, Network, ArrowRight } from 'lucide-react';
import type { AdminLoginState, AdminLoginHandlers } from '@/backend/hooks/useAdminLogin';
interface Props {
  state: AdminLoginState;
  handlers: AdminLoginHandlers;
}

/**
 * AdminLoginView - B01 后台登录页
 * 采用“双栏分体式中控台”结构，强调工业级可靠性与高密度清晰度。
 */
export const AdminLoginView = ({
  state,
  handlers
}: Props) => {
  return <main className="min-h-screen w-full bg-background font-body text-foreground selection:bg-primary selection:text-primary-foreground overflow-hidden">
      {/* 整个页面仅包含 1 个 Section，占满一屏 */}
      <section data-controller-name="后台管理员身份验证" className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="container mx-auto px-4 md:px-8 h-full flex items-center justify-center">
          {/* 核心主控容器 - 严格定界的独立画幅 */}
          <div className="w-full max-w-[1100px] h-[640px] grid grid-cols-1 lg:grid-cols-2 bg-card rounded-lg border border-border shadow-lg overflow-hidden ring-1 ring-border/50">
            
            {/* 2.1 左侧：系统信息与声明栏 (System Context Panel) */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#1E293B] text-white">
              {/* 背景装饰：拓扑纹理感 */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* 品牌识别区 */}
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-sm">
                    <Globe className="text-white w-6 h-6" />
                  </div>
                  <h1 className="font-header text-xl font-extrabold tracking-tight uppercase">
                    Cross-Border ERP
                  </h1>
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-header leading-tight">
                    外贸跨境电商<br />独立站管理系统
                  </h2>
                  <p className="text-slate-400 text-sm font-medium tracking-wide">
                    Global Supply Chain & 1688 Routing Hub
                  </p>
                </div>
              </div>

              {/* 系统定位与工业化视觉锚点 */}
              <div className="relative z-10 flex flex-col items-start gap-8">
                <div className="p-4 bg-white/5 border border-white/10 rounded-md backdrop-blur-sm">
                  <Network className="w-16 h-16 text-primary mb-4" />
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[280px]">
                    系统集成了全球供应链实时监控与1688商品路由调度中枢，确保跨境贸易数据链路的绝对确定性。
                  </p>
                </div>
                
                {/* 后台访问说明区 */}
                <div className="flex items-center gap-3 text-xs font-medium text-slate-400 border-t border-white/10 pt-6 w-full">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span>受控环境：仅限后台管理员进入</span>
                </div>
              </div>
            </div>

            {/* 2.2 右侧：身份验证执行栏 (Authentication Panel) */}
            <div className="flex flex-col justify-center p-8 md:p-16 bg-card relative">
              {/* 表单头部区 */}
              <div className="mb-10 space-y-2 text-center lg:text-left">
                <h2 className="text-3xl font-extrabold font-header text-slate-900 tracking-tight">
                  管理员登录
                </h2>
                <p className="text-muted-foreground text-sm font-medium">
                  系统控制台安全入口 · Control Console Entry
                </p>
              </div>

              {/* 数据录入区 */}
              <form onSubmit={handlers.handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="account" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Account 账号
                    </Label>
                  </div>
                  <Input data-auto="account" id="account" type="text" placeholder="请输入管理员账号" className="h-11 rounded-sm border-border bg-slate-50 focus-visible:ring-primary focus-visible:bg-white px-4" value={state.formData.sysuser_account} onChange={e => handlers.handleFormFieldChange('sysuser_account', e.target.value)} disabled={state.isSubmitting} required />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Password 密码
                    </Label>
                  </div>
                  <Input data-auto="password" id="password" type="password" placeholder="请输入登录密码" className="h-11 rounded-sm border-border bg-slate-50 focus-visible:ring-primary focus-visible:bg-white px-4" value={state.formData.sysuser_password} onChange={e => handlers.handleFormFieldChange('sysuser_password', e.target.value)} disabled={state.isSubmitting} required />
                </div>

                {/* 主控提交区 */}
                <div className="pt-4">
                  <Button data-auto="submit" type="submit" className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-[#003EB3] rounded-sm transition-all flex items-center justify-center gap-2" disabled={state.isSubmitting}>
                    {state.isSubmitting ? <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>正在验证身份...</span>
                      </> : <>
                        <span>确认登录系统</span>
                        <ArrowRight className="w-4 h-4" />
                      </>}
                  </Button>
                </div>
              </form>

              {/* 底部分支导航区 (注册引导) */}
              <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground font-medium">
                  内部管理账号获取？请联系运维中心
                </p>
                <Button variant="link" className="h-auto p-0 text-xs font-bold text-primary hover:text-primary/80 no-underline hover:underline" onClick={handlers.handleGoToRegister} disabled={state.isSubmitting}>
                  前往注册新账号
                </Button>
              </div>

              {/* 版本标识 */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-16 lg:translate-x-0">
                <span className="text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase">
                  V2.4.0 Production Build
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>;
};
export default AdminLoginView;
