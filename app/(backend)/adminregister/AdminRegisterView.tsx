'use client'
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Database, 
  Globe, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import EditableImg from '@/@base/EditableImg';
import type { AdminRegisterState, AdminRegisterHandlers } from '@/backend/hooks/useAdminRegister';

interface Props {
  state: AdminRegisterState;
  handlers: AdminRegisterHandlers;
}

/**
 * AdminRegisterView - 后台管理员注册视图
 * 遵循工业级 B2B 跨界控制台设计规范，采用全屏双栏布局
 */
export const AdminRegisterView = ({ state, handlers }: Props) => {
  return (
    <section 
      data-controller-name="管理员账户注册"
      className="min-h-screen w-full bg-background flex items-center justify-center p-4 lg:p-0 overflow-hidden"
    >
      <div className="w-full max-w-[1200px] h-full lg:h-[720px] grid grid-cols-1 lg:grid-cols-12 bg-card rounded-lg border border-border shadow-lg overflow-hidden">
        
        {/* 左侧：系统级重工业展板区 */}
        <aside className="hidden lg:flex lg:col-span-5 bg-secondary flex-col p-12 justify-between border-r border-border relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <header className="space-y-4">
              <div className="w-12 h-12 flex items-center justify-center bg-primary rounded-md">
                <EditableImg 
                  propKey="system-logo" 
                  keywords="/system-logo.png" 
                  className="w-8 h-8 invert brightness-0"
                />
              </div>
              <h1 className="text-2xl font-bold font-header tracking-tight text-foreground leading-tight">
                外贸跨境电商<br />独立站管理中枢
              </h1>
            </header>

            <div className="space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-4 h-px bg-muted-foreground/30"></span>
                平台核心能力
              </h2>
              <ul className="space-y-4">
                {[
                  { icon: Database, title: "1688 数据级联", desc: "毫秒级同步上游货源动态" },
                  { icon: Globe, title: "多语言 SKU 路由", desc: "智能匹配全球市场文案与规格" },
                  { icon: RefreshCw, title: "全球库存同步", desc: "跨平台实时路由调度系统" }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4 group">
                    <div className="mt-1 p-2 bg-white rounded border border-border group-hover:border-primary/30 transition-colors">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm leading-tight">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative z-10 opacity-80 mt-8">
            <div className="aspect-[4/3] w-full rounded-lg border border-border/50 bg-white/50 p-4 backdrop-blur-sm">
              <EditableImg 
                propKey="industrial-topology" 
                keywords="/industrial-topology.svg" 
                description="Supply chain topology visualization"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* 背景装饰纹理 */}
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        </aside>

        {/* 右侧：高密度注册作业区 */}
        <main className="col-span-12 lg:col-span-7 flex flex-col justify-center items-center bg-card p-8 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-[420px]">
            {state.isSuccess ? (
              // 视图 B：注册成功引导态
              <Card className="border-none shadow-none text-center">
                <CardHeader className="p-0 mb-6 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-accent" />
                  </div>
                  <CardTitle className="text-2xl font-bold font-header">注册成功</CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2">
                    管理员账户已激活，具备全系统管控权限
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 mb-8">
                  <p className="text-sm text-muted-foreground leading-relaxed px-4">
                    您的账户已通过安全验证并成功初始化。系统已为您分配基础管理权限，您可以立即登录控制台进行站点配置。
                  </p>
                </CardContent>
                <CardFooter className="p-0">
                  <Button 
                    className="w-full h-12 text-base font-medium transition-all hover:gap-2" 
                    onClick={handlers.navigateToLogin}
                  >
                    立即进入管理后台 <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              // 视图 A：表单输入态
              <div className="space-y-8">
                <header className="space-y-2">
                  <h2 className="text-2xl font-bold font-header text-foreground">初始化管理员</h2>
                  <p className="text-sm text-muted-foreground">
                    系统部署首选：创建高权限全局管理账号
                  </p>
                </header>

                <form onSubmit={handlers.handleSubmit} className="space-y-6">
                  {state.errorMsg && (
                    <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 py-3">
                      <AlertCircle className="w-4 h-4" />
                      <AlertTitle className="text-sm font-semibold">注册中断</AlertTitle>
                      <AlertDescription className="text-xs opacity-90">{state.errorMsg}</AlertDescription>
                    </Alert>
                  )}

                  <fieldset disabled={state.isSubmitting} className="space-y-5">
                    {/* 账号输入组 */}
                    <div className="space-y-2">
                      <Label htmlFor="account" className="text-sm font-medium text-foreground">管理员账号</Label>
                      <Input
                        id="account"
                        value={state.form.account}
                        onChange={(e) => handlers.handleFormFieldChange('account', e.target.value)}
                        placeholder="请输入唯一管理员账号"
                        required
                        className="h-10 border-border focus-visible:ring-primary px-3"
                      />
                    </div>

                    {/* 邮箱输入组 */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">系统预留邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={state.form.email}
                        onChange={(e) => handlers.handleFormFieldChange('email', e.target.value)}
                        placeholder="admin@example.com"
                        required
                        className="h-10 border-border focus-visible:ring-primary px-3"
                      />
                    </div>

                    {/* 密码输入组 */}
                    <div className="space-y-2 relative">
                      <div className="flex justify-between items-end">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">访问密钥</Label>
                        <button 
                          type="button"
                          onClick={handlers.toggleShowPassword}
                          className="text-xs text-primary hover:underline flex items-center gap-1 focus:outline-none"
                        >
                          {state.showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          {state.showPassword ? "隐藏" : "查看"}
                        </button>
                      </div>
                      <Input
                        id="password"
                        type={state.showPassword ? "text" : "password"}
                        value={state.form.password}
                        onChange={(e) => handlers.handleFormFieldChange('password', e.target.value)}
                        placeholder="8+ 字符，包含字母与数字"
                        required
                        className="h-10 border-border focus-visible:ring-primary px-3"
                      />
                    </div>

                    {/* 确认密码输入组 */}
                    <div className="space-y-2 relative">
                       <div className="flex justify-between items-end">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">确认密钥</Label>
                        <button 
                          type="button"
                          onClick={handlers.toggleShowConfirmPassword}
                          className="text-xs text-primary hover:underline flex items-center gap-1 focus:outline-none"
                        >
                          {state.showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          {state.showConfirmPassword ? "隐藏" : "查看"}
                        </button>
                      </div>
                      <Input
                        id="confirmPassword"
                        type={state.showConfirmPassword ? "text" : "password"}
                        value={state.form.confirmPassword}
                        onChange={(e) => handlers.handleFormFieldChange('confirmPassword', e.target.value)}
                        placeholder="请再次确认输入的密码"
                        required
                        className="h-10 border-border focus-visible:ring-primary px-3"
                      />
                    </div>

                    {/* 规则面板 */}
                    <Alert className="bg-secondary/50 border-border py-3">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <AlertTitle className="text-xs font-bold text-foreground">安全合规审计规范</AlertTitle>
                      <AlertDescription className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>密钥强度：至少 8 位，须由英文字符及阿拉伯数字组成。</li>
                          <li>安全责任：本账户拥有最高权限，建议定期轮换凭证并启用双因素认证。</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <Button 
                      type="submit" 
                      className="w-full h-11 text-sm font-semibold transition-all active:scale-[0.98]"
                      disabled={state.isSubmitting}
                    >
                      {state.isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" /> 初始化中...
                        </span>
                      ) : "创建管理员账户"}
                    </Button>
                  </fieldset>
                </form>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>已有管理员权限？</span>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs font-semibold text-primary" 
                    onClick={handlers.navigateToLogin}
                  >
                    返回登录入口
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};
