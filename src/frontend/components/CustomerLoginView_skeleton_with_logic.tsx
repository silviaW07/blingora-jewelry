'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerLogin, Home, CustomerRegister } from '@/frontend/route-params';
import type { LoginCustomerInput } from '@/frontend/actions/CustomerLogin';
import { loginCustomer } from '@/frontend/actions/CustomerLogin';
import { useUserSession } from '@/tools/FrontendSession';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export default function CustomerLoginPage() {
  // ===== 路由参数与全局状态 =====
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    returnTo
  } = CustomerLogin.getParams(searchParams);
  const {
    set: setSession
  } = useUserSession();

  // ===== 本地状态 =====
  const [formData, setFormData] = useState<LoginCustomerInput>({
    sysuser_account: '',
    sysuser_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ===== 交互 Handlers =====
  const handleFormFieldChange = <K extends keyof LoginCustomerInput,>(field: K, value: LoginCustomerInput[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sysuser_account || !formData.sysuser_password) {
      setErrorMessage('请输入完整的账号和密码');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await loginCustomer(formData);

      // 更新前台全局 Session
      setSession({
        token: result.token,
        user_id: result.sysuser_id,
        username: result.sysuser_account,
        role: 'CUSTOMER'
      });
      toast.success('登录成功');

      // 业务跳转逻辑：存在 returnTo 则回跳，否则去首页
      if (returnTo) {
        // 直接 push 是因为 returnTo 是任意原系统路径，而 function_note 未提供通用路径直达包装
        router.push(decodeURIComponent(returnTo));
      } else {
        Home.navigateTo(router);
      }
    } catch (error: any) {
      setErrorMessage(error.message || '登录失败，请检查您的输入');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoToRegister = useCallback(() => {
    if (returnTo) {
      CustomerRegister.navigateToWithReturn(router, {
        returnTo
      });
    } else {
      CustomerRegister.navigateToDefault(router);
    }
  }, [router, returnTo]);
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // ===== 页面渲染 =====
  return <main data-api-unique-id='customerloginview-skeleton-with-logic-r06821812c2552a42-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
      {/* ==================== 左侧：品牌与注册引导区 ==================== */}
      <section data-api-unique-id='customerloginview-skeleton-with-logic-r7011842d76998371-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
        <header data-api-unique-id='customerloginview-skeleton-with-logic-r09325e142948d085-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
          <div data-api-unique-id='customerloginview-skeleton-with-logic-r7594415f23589916-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>Brand Logo</div>
        </header>

        <article data-api-unique-id='customerloginview-skeleton-with-logic-r3908dd3469532c2f-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
          <h1 data-api-unique-id='customerloginview-skeleton-with-logic-rbde76c8c5ca526b2-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>Access Global Supply. Seamlessly.</h1>
          <ul data-api-unique-id='customerloginview-skeleton-with-logic-rf1b911fbf3b17562-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
            <li data-api-unique-id='customerloginview-skeleton-with-logic-r92e63dbfa420b702-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>✓ 专属阶梯式批发报价 (Tiered Wholesale Pricing)</li>
            <li data-api-unique-id='customerloginview-skeleton-with-logic-ree2276f748521ee1-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>✓ 确定性跨境物流追踪 (Deterministic Global Tracking)</li>
            <li data-api-unique-id='customerloginview-skeleton-with-logic-r44728561b52c1ce3-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>✓ 1688数据一键直连 (1688 Data Integration)</li>
          </ul>
        </article>

        <div data-api-unique-id='customerloginview-skeleton-with-logic-r1affbeabeb01b30a-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
          <p data-api-unique-id='customerloginview-skeleton-with-logic-r8775aa3f91d1f002-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>New to our platform?</p>
          <Button variant="outline" onClick={handleGoToRegister} disabled={isSubmitting} data-api-unique-id='customerloginview-skeleton-with-logic-rcf5a100d462f012c-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
            前往注册
          </Button>
        </div>
      </section>

      {/* ==================== 右侧：登录操作控制台 ==================== */}
      <section data-api-unique-id='customerloginview-skeleton-with-logic-r2b36775015957a72-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
        <header data-api-unique-id='customerloginview-skeleton-with-logic-rab9e240a847a02d8-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
          <h2 data-api-unique-id='customerloginview-skeleton-with-logic-r2a34313b912b564d-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>安全登录 (Sign In to Your Account)</h2>
          {returnTo ? <p data-api-unique-id='customerloginview-skeleton-with-logic-r94e34efdd766efe3-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>登录后将返回原访问页面继续操作</p> : <p data-api-unique-id='customerloginview-skeleton-with-logic-r00bc14d9219b1dd2-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>欢迎回来，请登录您的账户</p>}
        </header>

        {errorMessage && <Alert variant="destructive" data-api-unique-id='customerloginview-skeleton-with-logic-r9f6c61908141b5e7-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
            <AlertTitle data-api-unique-id='customerloginview-skeleton-with-logic-rc99287b1c43a455c-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>账户异常</AlertTitle>
            <AlertDescription data-api-unique-id='customerloginview-skeleton-with-logic-rab3d5fb0ef3a38f7-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>{errorMessage}</AlertDescription>
          </Alert>}

        <form onSubmit={handleLoginSubmit} data-api-unique-id='customerloginview-skeleton-with-logic-radfcdacf93f2a1ea-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
          <div data-api-unique-id='customerloginview-skeleton-with-logic-r080c53cbe99a585a-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
            <Label htmlFor="sysuser_account" data-api-unique-id='customerloginview-skeleton-with-logic-r29f2224629ff3c39-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>账号 (Account)</Label>
            <Input id="sysuser_account" type="text" placeholder="请输入账号" autoComplete="username" disabled={isSubmitting} value={formData.sysuser_account} onChange={e => handleFormFieldChange('sysuser_account', e.target.value)} data-api-unique-id='customerloginview-skeleton-with-logic-r51a333ddb8515c3e-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic' />
          </div>

          <div data-api-unique-id='customerloginview-skeleton-with-logic-r851675c6b228cb70-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
            <Label htmlFor="sysuser_password" data-api-unique-id='customerloginview-skeleton-with-logic-r45185572489b6c04-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>密码 (Password)</Label>
            <div data-api-unique-id='customerloginview-skeleton-with-logic-r4adf93f60d6904dc-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
              <Input id="sysuser_password" type={showPassword ? "text" : "password"} placeholder="请输入密码" autoComplete="current-password" disabled={isSubmitting} value={formData.sysuser_password} onChange={e => handleFormFieldChange('sysuser_password', e.target.value)} data-api-unique-id='customerloginview-skeleton-with-logic-ra954a8523c2e7317-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic' />
              <Button type="button" variant="ghost" size="icon" disabled={isSubmitting} onClick={togglePasswordVisibility} title={showPassword ? "隐藏密码" : "显示密码"} data-api-unique-id='customerloginview-skeleton-with-logic-r34deb5e089ac64b3-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
                {showPassword ? "隐藏" : "显示"}
              </Button>
            </div>
          </div>

          <div data-api-unique-id='customerloginview-skeleton-with-logic-r35cac0b19d709530-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
            <div data-api-unique-id='customerloginview-skeleton-with-logic-r13e776c35b62f534-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
              <Checkbox id="remember_me" disabled={isSubmitting} checked={rememberMe} onCheckedChange={checked => setRememberMe(checked === true)} data-api-unique-id='customerloginview-skeleton-with-logic-r443162e9b335e533-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic' />
              <Label htmlFor="remember_me" data-api-unique-id='customerloginview-skeleton-with-logic-r0615740ad891adee-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>记住账号 (Remember me)</Label>
            </div>
            
            <div data-api-unique-id='customerloginview-skeleton-with-logic-rbd5fe30abad88c7b-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
              <Button type="button" variant="link" disabled={isSubmitting} data-api-unique-id='customerloginview-skeleton-with-logic-r2a2ad7061641df4d-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
                忘记密码？ (Forgot Password?)
              </Button>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} data-api-unique-id='customerloginview-skeleton-with-logic-r78b6a2d4e46da38b-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
            {isSubmitting ? "正在验证..." : "登录"}
          </Button>
        </form>

        <footer data-api-unique-id='customerloginview-skeleton-with-logic-r46d6f50e3e69c2fb-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
          <ul data-api-unique-id='customerloginview-skeleton-with-logic-r97a5604270f13493-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>
            <li data-api-unique-id='customerloginview-skeleton-with-logic-rc0435e45d1f19682-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>SSL加密认证</li>
            <li data-api-unique-id='customerloginview-skeleton-with-logic-r9b7a936eba2303d9-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>安全支付保障</li>
            <li data-api-unique-id='customerloginview-skeleton-with-logic-r78c2f8defd9f376c-s426009869' data-api-unique-page-name='src/frontend/components/CustomerLoginView_skeleton_with_logic'>全球物流合作伙伴</li>
          </ul>
        </footer>
      </section>
    </main>;
}