'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Database, Globe, RefreshCw, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
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
export const AdminRegisterView = ({
  state,
  handlers
}: Props) => {
  return <section data-controller-name="管理员账户注册" className="min-h-screen w-full bg-background flex items-center justify-center p-4 lg:p-0 overflow-hidden" data-api-unique-id="adminregisterview-ra6ac9ad4753e3de4-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
      <div className="w-full max-w-[1200px] h-full lg:h-[720px] grid grid-cols-1 lg:grid-cols-12 bg-card rounded-lg border border-border shadow-lg overflow-hidden" data-api-unique-id="adminregisterview-raa3cba14633d4e2f-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
        
        {/* 左侧：系统级重工业展板区 */}
        <aside className="hidden lg:flex lg:col-span-5 bg-secondary flex-col p-12 justify-between border-r border-border relative overflow-hidden" data-api-unique-id="adminregisterview-rca2926696564424f-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
          <div className="relative z-10 space-y-8" data-api-unique-id="adminregisterview-rf1fc596cd67c4a51-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
            <header className="space-y-4" data-api-unique-id="adminregisterview-r86c60ba50017539f-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
              <div className="w-12 h-12 flex items-center justify-center bg-primary rounded-md" data-api-unique-id="adminregisterview-r382d6532b78549f4-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                <EditableImg propKey="system-logo" keywords="/system-logo.png" className="w-8 h-8 invert brightness-0" data-api-unique-id="adminregisterview-rd98894dda11b1277-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
              </div>
              <h1 className="text-2xl font-bold font-header tracking-tight text-foreground leading-tight" data-api-unique-id="adminregisterview-rc385f4b899bfa8bf-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                外贸跨境电商<br data-api-unique-id="adminregisterview-r91ef763d65bb5b7f-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />独立站管理中枢
              </h1>
            </header>

            <div className="space-y-6" data-api-unique-id="adminregisterview-rdc36f651be7201c6-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2" data-api-unique-id="adminregisterview-rf2e842326d314e6d-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                <span className="w-4 h-px bg-muted-foreground/30" data-api-unique-id="adminregisterview-r7ab981c20ef2eb26-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView"></span>
                平台核心能力
              </h2>
              <ul className="space-y-4" data-api-unique-id="adminregisterview-rd810357871a2bcdd-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                {[{
                icon: Database,
                title: "1688 数据级联",
                desc: "毫秒级同步上游货源动态"
              }, {
                icon: Globe,
                title: "多语言 SKU 路由",
                desc: "智能匹配全球市场文案与规格"
              }, {
                icon: RefreshCw,
                title: "全球库存同步",
                desc: "跨平台实时路由调度系统"
              }].map((item, index) => <li key={index} className="flex gap-4 group" data-api-unique-id="adminregisterview-r16eafabbb2450978-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" data-api-in-loop="1">
                    <div className="mt-1 p-2 bg-white rounded border border-border group-hover:border-primary/30 transition-colors" data-api-unique-id="adminregisterview-rc41741500191cf8b-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" data-api-in-loop="1">
                      <item.icon className="w-4 h-4 text-primary" data-api-unique-id="adminregisterview-r1c912688628cb4b8-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" data-api-in-loop="1" data-api-bind-info={`list-${index}-icon`} data-api-map-var-name='item' />
                    </div>
                    <div data-api-unique-id="adminregisterview-r27062b95447af7a6-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" data-api-in-loop="1">
                      <p className="font-medium text-foreground text-sm leading-tight" data-api-unique-id="adminregisterview-r278a38608f1aa323-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" data-api-in-loop="1" data-api-bind-info={`list-${index}-title`} data-api-map-var-name='item'>{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1" data-api-unique-id="adminregisterview-rb7691304f96ff8d2-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" data-api-in-loop="1" data-api-bind-info={`list-${index}-desc`} data-api-map-var-name='item'>{item.desc}</p>
                    </div>
                  </li>)}
              </ul>
            </div>
          </div>

          <div className="relative z-10 opacity-80 mt-8" data-api-unique-id="adminregisterview-r748eb3083c89129c-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
            <div className="aspect-[4/3] w-full rounded-lg border border-border/50 bg-white/50 p-4 backdrop-blur-sm" data-api-unique-id="adminregisterview-r72e883ba6bde716e-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
              <EditableImg propKey="industrial-topology" keywords="/industrial-topology.svg" description="Supply chain topology visualization" className="w-full h-full object-contain" data-api-unique-id="adminregisterview-r9f726c966025ca31-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
            </div>
          </div>
          
          {/* 背景装饰纹理 */}
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" data-api-unique-id="adminregisterview-r8d657d4a737ad575-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
        </aside>

        {/* 右侧：高密度注册作业区 */}
        <main className="col-span-12 lg:col-span-7 flex flex-col justify-center items-center bg-card p-8 lg:p-16 overflow-y-auto" data-api-unique-id="adminregisterview-r63974214a0379df4-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
          <div className="w-full max-w-[420px]" data-api-unique-id="adminregisterview-rabfbddee5cc81255-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
            {state.isSuccess ?
          // 视图 B：注册成功引导态
          <Card className="border-none shadow-none text-center" data-api-unique-id="adminregisterview-r807e84de1d5fe19a-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                <CardHeader className="p-0 mb-6 flex flex-col items-center" data-api-unique-id="adminregisterview-r01e3cb2bd00ae3d9-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6" data-api-unique-id="adminregisterview-re0f5a9c4f0ff3792-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                    <CheckCircle2 className="w-10 h-10 text-accent" data-api-unique-id="adminregisterview-rda9e4732ee4d003d-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
                  </div>
                  <CardTitle className="text-2xl font-bold font-header" data-api-unique-id="adminregisterview-r1198220e83b4dc27-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">注册成功</CardTitle>
                  <CardDescription className="text-base text-muted-foreground mt-2" data-api-unique-id="adminregisterview-r827d34de3e29b311-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                    管理员账户已激活，具备全系统管控权限
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 mb-8" data-api-unique-id="adminregisterview-r49b0a3d4079c10c3-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                  <p className="text-sm text-muted-foreground leading-relaxed px-4" data-api-unique-id="adminregisterview-r52e3d662f6b657ae-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                    您的账户已通过安全验证并成功初始化。系统已为您分配基础管理权限，您可以立即登录控制台进行站点配置。
                  </p>
                </CardContent>
                <CardFooter className="p-0" data-api-unique-id="adminregisterview-r83e74b85edcda42a-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                  <Button className="w-full h-12 text-base font-medium transition-all hover:gap-2" onClick={handlers.navigateToLogin} data-api-unique-id="adminregisterview-re5507cfdb2b8e63e-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                    立即进入管理后台 <ArrowRight className="w-4 h-4 ml-1" data-api-unique-id="adminregisterview-r2d3ff53d20ff1f8a-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
                  </Button>
                </CardFooter>
              </Card> :
          // 视图 A：表单输入态
          <div className="space-y-8" data-api-unique-id="adminregisterview-r97fa807133368d52-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                <header className="space-y-2" data-api-unique-id="adminregisterview-ra3267c048e37fd61-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                  <h2 className="text-2xl font-bold font-header text-foreground" data-api-unique-id="adminregisterview-r9fa30f66d2341198-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">初始化管理员</h2>
                  <p className="text-sm text-muted-foreground" data-api-unique-id="adminregisterview-r57caf54519d83043-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                    系统部署首选：创建高权限全局管理账号
                  </p>
                </header>

                <form onSubmit={handlers.handleSubmit} className="space-y-6" data-api-unique-id="adminregisterview-rcd188a54e85ebded-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                  {state.errorMsg && <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 py-3" data-api-unique-id="adminregisterview-rcaed8447bda29cb4-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                      <AlertCircle className="w-4 h-4" data-api-unique-id="adminregisterview-r55b0b9edc3245ab6-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
                      <AlertTitle className="text-sm font-semibold" data-api-unique-id="adminregisterview-rfb8359f78e498276-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">注册中断</AlertTitle>
                      <AlertDescription className="text-xs opacity-90" data-api-unique-id="adminregisterview-r071ba060593c9955-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">{state.errorMsg}</AlertDescription>
                    </Alert>}

                  <fieldset disabled={state.isSubmitting} className="space-y-5" data-api-unique-id="adminregisterview-r903ef4d550769476-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                    {/* 账号输入组 */}
                    <div className="space-y-2" data-api-unique-id="adminregisterview-r5e56be4eab459bb3-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                      <Label htmlFor="account" className="text-sm font-medium text-foreground" data-api-unique-id="adminregisterview-r9cf48676d75598c9-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">管理员账号</Label>
                      <Input id="account" value={state.form.account} onChange={e => handlers.handleFormFieldChange('account', e.target.value)} placeholder="请输入唯一管理员账号" required className="h-10 border-border focus-visible:ring-primary px-3" data-api-unique-id="adminregisterview-r0bc162259c1ae986-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
                    </div>

                    {/* 邮箱输入组 */}
                    <div className="space-y-2" data-api-unique-id="adminregisterview-rd0fbdde5d1c55314-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground" data-api-unique-id="adminregisterview-r7225039134410e7b-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">系统预留邮箱</Label>
                      <Input id="email" type="email" value={state.form.email} onChange={e => handlers.handleFormFieldChange('email', e.target.value)} placeholder="admin@example.com" required className="h-10 border-border focus-visible:ring-primary px-3" data-api-unique-id="adminregisterview-r4789349c7c3ece75-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
                    </div>

                    {/* 密码输入组 */}
                    <div className="space-y-2 relative" data-api-unique-id="adminregisterview-r65e1693644cd6de7-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                      <div className="flex justify-between items-end" data-api-unique-id="adminregisterview-r87a28edb92c4505d-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground" data-api-unique-id="adminregisterview-r930f3369b8ed0aa5-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">访问密钥</Label>
                        <button type="button" onClick={handlers.toggleShowPassword} className="text-xs text-primary hover:underline flex items-center gap-1 focus:outline-none" data-api-unique-id="adminregisterview-r2a8e8d9b7b6006a1-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                          {state.showPassword ? <EyeOff size={14} data-api-unique-id="adminregisterview-r17ec3f05bcaae7c5-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" /> : <Eye size={14} data-api-unique-id="adminregisterview-r888a7207c36f2438-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />}
                          {state.showPassword ? "隐藏" : "查看"}
                        </button>
                      </div>
                      <Input id="password" type={state.showPassword ? "text" : "password"} value={state.form.password} onChange={e => handlers.handleFormFieldChange('password', e.target.value)} placeholder="8+ 字符，包含字母与数字" required className="h-10 border-border focus-visible:ring-primary px-3" data-api-unique-id="adminregisterview-r63c50aa6cf9ff0fe-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
                    </div>

                    {/* 确认密码输入组 */}
                    <div className="space-y-2 relative" data-api-unique-id="adminregisterview-rd91e912c4384db10-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                       <div className="flex justify-between items-end" data-api-unique-id="adminregisterview-r562dba7af97bad65-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground" data-api-unique-id="adminregisterview-re2199b8888f649cf-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">确认密钥</Label>
                        <button type="button" onClick={handlers.toggleShowConfirmPassword} className="text-xs text-primary hover:underline flex items-center gap-1 focus:outline-none" data-api-unique-id="adminregisterview-r8dea979b63647c6a-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                          {state.showConfirmPassword ? <EyeOff size={14} data-api-unique-id="adminregisterview-r5ad76bf34ad7a765-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" /> : <Eye size={14} data-api-unique-id="adminregisterview-r59936cd90b012678-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />}
                          {state.showConfirmPassword ? "隐藏" : "查看"}
                        </button>
                      </div>
                      <Input id="confirmPassword" type={state.showConfirmPassword ? "text" : "password"} value={state.form.confirmPassword} onChange={e => handlers.handleFormFieldChange('confirmPassword', e.target.value)} placeholder="请再次确认输入的密码" required className="h-10 border-border focus-visible:ring-primary px-3" data-api-unique-id="adminregisterview-r376f3db6d8de6cf6-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
                    </div>

                    {/* 规则面板 */}
                    <Alert className="bg-secondary/50 border-border py-3" data-api-unique-id="adminregisterview-rbe28edc8cac8b18d-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                      <ShieldCheck className="w-4 h-4 text-primary" data-api-unique-id="adminregisterview-r3dfe00935b5a6924-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" />
                      <AlertTitle className="text-xs font-bold text-foreground" data-api-unique-id="adminregisterview-ra29d811742dd0fc5-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">安全合规审计规范</AlertTitle>
                      <AlertDescription className="text-[11px] text-muted-foreground mt-1 leading-relaxed" data-api-unique-id="adminregisterview-re2ee03a4aac074e1-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                        <ul className="list-disc pl-4 space-y-0.5" data-api-unique-id="adminregisterview-r0c1b433a5b7f7dfb-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                          <li data-api-unique-id="adminregisterview-r50f87aa86e28e110-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">密钥强度：至少 8 位，须由英文字符及阿拉伯数字组成。</li>
                          <li data-api-unique-id="adminregisterview-r6c1de2ba58abc270-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">安全责任：本账户拥有最高权限，建议定期轮换凭证并启用双因素认证。</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <Button type="submit" className="w-full h-11 text-sm font-semibold transition-all active:scale-[0.98]" disabled={state.isSubmitting} data-api-unique-id="adminregisterview-rfc4292765557dfa5-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                      {state.isSubmitting ? <span className="flex items-center gap-2" data-api-unique-id="adminregisterview-r72db373d3a487849-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                          <RefreshCw className="w-4 h-4 animate-spin" data-api-unique-id="adminregisterview-rc8c126aef71b3dc3-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView" /> 初始化中...
                        </span> : "创建管理员账户"}
                    </Button>
                  </fieldset>
                </form>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground" data-api-unique-id="adminregisterview-rdd9537025203c648-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                  <span data-api-unique-id="adminregisterview-rf73a807d17ae7549-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">已有管理员权限？</span>
                  <Button variant="link" className="p-0 h-auto text-xs font-semibold text-primary" onClick={handlers.navigateToLogin} data-api-unique-id="adminregisterview-ra3a0b45a059f3093-s22886493" data-api-unique-page-name="src/backend/components/AdminRegisterView">
                    返回登录入口
                  </Button>
                </div>
              </div>}
          </div>
        </main>
      </div>
    </section>;
};
export default AdminRegisterView;