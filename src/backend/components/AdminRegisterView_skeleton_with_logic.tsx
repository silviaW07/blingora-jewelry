'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLogin, AdminRegister } from '@/backend/route-params';
import type { RegisterAdminInput } from '@/backend/actions/AdminRegister';
import { registerAdmin } from '@/backend/actions/AdminRegister';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
export default function AdminRegisterPage() {
  // ===== 页面入参 =====
  const router = useRouter();
  const searchParams = useSearchParams();
  const _params = AdminRegister.getParams(searchParams);

  // ===== State =====
  const [form, setForm] = useState<RegisterAdminInput>({
    account: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ===== Handlers =====
  const handleFormFieldChange = useCallback(<K extends keyof RegisterAdminInput,>(field: K, value: RegisterAdminInput[K]) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    if (errorMsg) {
      setErrorMsg('');
    }
  }, [errorMsg]);
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await registerAdmin(form);
      setIsSuccess(true);
      toast.success('管理员账户创建成功');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('注册失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [form]);

  // ===== Render =====
  return <main data-api-unique-id='adminregisterview-skeleton-with-logic-rd8135566025161e6-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
      <article data-api-unique-id='adminregisterview-skeleton-with-logic-r91ad0129784db858-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
        {/* 左侧：系统级重工业展板区 */}
        <aside data-api-unique-id='adminregisterview-skeleton-with-logic-r5627fad0433ed68b-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
          <header data-api-unique-id='adminregisterview-skeleton-with-logic-r46fd99ef6e0ab6db-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
            <img src="/system-logo.png" alt="系统 Logo" data-api-unique-id='adminregisterview-skeleton-with-logic-rd7e84e005b75503b-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic' />
            <h1 data-api-unique-id='adminregisterview-skeleton-with-logic-rd8f28dd56c83bcc5-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>外贸跨境电商独立站管理中枢</h1>
          </header>
          <section data-api-unique-id='adminregisterview-skeleton-with-logic-rd380b850dfe3e563-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
            <h2 data-api-unique-id='adminregisterview-skeleton-with-logic-r842b5a4aba1cc160-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>平台核心能力</h2>
            <ul data-api-unique-id='adminregisterview-skeleton-with-logic-r25d15e8e327d1bdd-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
              <li data-api-unique-id='adminregisterview-skeleton-with-logic-rfd1d3ef8eab4c63f-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>1688 数据级联</li>
              <li data-api-unique-id='adminregisterview-skeleton-with-logic-r366b1cb5f7d213dc-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>多语言 SKU 路由</li>
              <li data-api-unique-id='adminregisterview-skeleton-with-logic-rddc35a9a64e94ad0-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>全球库存同步</li>
            </ul>
          </section>
          <figure data-api-unique-id='adminregisterview-skeleton-with-logic-red74377504496be3-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
            <img src="/industrial-topology.svg" alt="数据拓扑与供应链运转" data-api-unique-id='adminregisterview-skeleton-with-logic-r07c06e8090972059-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic' />
          </figure>
        </aside>

        {/* 右侧：高密度注册作业区 */}
        <section data-api-unique-id='adminregisterview-skeleton-with-logic-r4858c2d790043b8c-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
          {isSuccess ?
        // 视图 B：注册成功引导态
        <Card data-api-unique-id='adminregisterview-skeleton-with-logic-r8f111fdbb0463896-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
              <CardHeader data-api-unique-id='adminregisterview-skeleton-with-logic-rfbe0312767a12f13-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                <CardTitle data-api-unique-id='adminregisterview-skeleton-with-logic-r98850db888c910b4-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>注册成功</CardTitle>
                <CardDescription data-api-unique-id='adminregisterview-skeleton-with-logic-raad6b3d17e1908a7-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>管理员账户已激活</CardDescription>
              </CardHeader>
              <CardContent data-api-unique-id='adminregisterview-skeleton-with-logic-r29bb87caf7578d01-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                <p data-api-unique-id='adminregisterview-skeleton-with-logic-re6a3e5a12d786306-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>您的账户已成功创建，并且处于激活状态，可以开始使用后台管理功能。</p>
              </CardContent>
              <CardFooter data-api-unique-id='adminregisterview-skeleton-with-logic-r8f2f7c587a54f4a0-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                <Button onClick={() => AdminLogin.navigateTo(router)} data-api-unique-id='adminregisterview-skeleton-with-logic-rb6642275e21788e6-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                  立即登录后台
                </Button>
              </CardFooter>
            </Card> :
        // 视图 A：表单输入态
        <Card data-api-unique-id='adminregisterview-skeleton-with-logic-r4e3b08a6cad2635e-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
              <CardHeader data-api-unique-id='adminregisterview-skeleton-with-logic-rf3f0b015bfd4453e-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                <CardTitle data-api-unique-id='adminregisterview-skeleton-with-logic-re4ad6fb743e9a357-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>初始化管理员</CardTitle>
                <CardDescription data-api-unique-id='adminregisterview-skeleton-with-logic-r1080042f512d8a23-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>创建高权限后台管理账号</CardDescription>
              </CardHeader>
              
              <CardContent data-api-unique-id='adminregisterview-skeleton-with-logic-rc62488100c66d928-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                <form onSubmit={handleSubmit} data-api-unique-id='adminregisterview-skeleton-with-logic-r10cacd6a27b4cbf5-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                  {errorMsg && <Alert variant="destructive" data-api-unique-id='adminregisterview-skeleton-with-logic-r444eccb043f60205-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                      <AlertTitle data-api-unique-id='adminregisterview-skeleton-with-logic-r3dd6e62ac021485f-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>注册中断</AlertTitle>
                      <AlertDescription data-api-unique-id='adminregisterview-skeleton-with-logic-r4faf8fad3a3d57f0-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>{errorMsg}</AlertDescription>
                    </Alert>}
                  
                  <fieldset disabled={isSubmitting} data-api-unique-id='adminregisterview-skeleton-with-logic-r807d0cae1a7c3759-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                    <div data-api-unique-id='adminregisterview-skeleton-with-logic-r8d322e9213e32fe4-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                      <Label htmlFor="account" data-api-unique-id='adminregisterview-skeleton-with-logic-rd3dda6ff2614a798-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>账号</Label>
                      <Input id="account" value={form.account} onChange={e => handleFormFieldChange('account', e.target.value)} placeholder="请输入唯一管理员账号" required data-api-unique-id='adminregisterview-skeleton-with-logic-r0c966aad10807f78-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic' />
                    </div>
                    
                    <div data-api-unique-id='adminregisterview-skeleton-with-logic-rcc66defb4ab658cb-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                      <Label htmlFor="email" data-api-unique-id='adminregisterview-skeleton-with-logic-r28a1e40333023465-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>邮箱</Label>
                      <Input id="email" type="email" value={form.email} onChange={e => handleFormFieldChange('email', e.target.value)} placeholder="请输入唯一管理员邮箱" required data-api-unique-id='adminregisterview-skeleton-with-logic-rca5281add48e06eb-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic' />
                    </div>
                    
                    <div data-api-unique-id='adminregisterview-skeleton-with-logic-r1efa03671562c64d-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                      <Label htmlFor="password" data-api-unique-id='adminregisterview-skeleton-with-logic-rc0376abcac3440d8-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>密码</Label>
                      <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => handleFormFieldChange('password', e.target.value)} placeholder="至少8个字符，包含字母和数字" required data-api-unique-id='adminregisterview-skeleton-with-logic-r4492a4760a69a45f-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic' />
                      <Button type="button" variant="ghost" onClick={() => setShowPassword(!showPassword)} data-api-unique-id='adminregisterview-skeleton-with-logic-r492755a5188de36a-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                        {showPassword ? "隐藏" : "显示"}
                      </Button>
                    </div>
                    
                    <div data-api-unique-id='adminregisterview-skeleton-with-logic-rd0491b9f4d9f204b-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                      <Label htmlFor="confirmPassword" data-api-unique-id='adminregisterview-skeleton-with-logic-re7c8ae351097cbe2-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>确认密码</Label>
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => handleFormFieldChange('confirmPassword', e.target.value)} placeholder="请再次输入密码以确认" required data-api-unique-id='adminregisterview-skeleton-with-logic-rb08555f1ae63c776-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic' />
                      <Button type="button" variant="ghost" onClick={() => setShowConfirmPassword(!showConfirmPassword)} data-api-unique-id='adminregisterview-skeleton-with-logic-re8fdbbc564a8d9f2-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                        {showConfirmPassword ? "隐藏" : "显示"}
                      </Button>
                    </div>

                    <Alert data-api-unique-id='adminregisterview-skeleton-with-logic-rbf6cf23532ede29e-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                      <AlertTitle data-api-unique-id='adminregisterview-skeleton-with-logic-r85562892171d9462-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>密码规则与规范</AlertTitle>
                      <AlertDescription data-api-unique-id='adminregisterview-skeleton-with-logic-r93a20a254c7522cf-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                        <ul data-api-unique-id='adminregisterview-skeleton-with-logic-r715f72cb5122f63b-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                          <li data-api-unique-id='adminregisterview-skeleton-with-logic-rdb1f9d6bef174cba-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>密码至少 8 个字符，必须包含字母和数字组合。</li>
                          <li data-api-unique-id='adminregisterview-skeleton-with-logic-r7340bed019db4a1d-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>后台账号具有系统最高权限，请妥善保管并定期更换密码。</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <Button type="submit" data-api-unique-id='adminregisterview-skeleton-with-logic-ra3c4bf36dfb0a67b-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                      {isSubmitting ? "创建中" : "创建账户"}
                    </Button>
                  </fieldset>
                </form>
              </CardContent>
              
              <CardFooter data-api-unique-id='adminregisterview-skeleton-with-logic-r1a522928cb9f3c9f-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                <span data-api-unique-id='adminregisterview-skeleton-with-logic-rc75318ab64dc94f6-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>已有管理员账号？</span>
                <Button variant="link" onClick={() => AdminLogin.navigateTo(router)} data-api-unique-id='adminregisterview-skeleton-with-logic-ra765e7fff63086bc-s2282254780' data-api-unique-page-name='src/backend/components/AdminRegisterView_skeleton_with_logic'>
                  去登录
                </Button>
              </CardFooter>
            </Card>}
        </section>
      </article>
    </main>;
}