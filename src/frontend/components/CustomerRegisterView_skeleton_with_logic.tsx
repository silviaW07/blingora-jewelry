'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerRegister, CustomerLogin } from '@/frontend/route-params';
import { checkAccountUnique, checkEmailUnique, registerCustomer } from '@/frontend/actions/CustomerRegister';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ===== 类型与接口 =====
interface FormFields {
  sysuser_account: string;
  sysuser_email: string;
  sysuser_password: string;
  sysuser_confirmPassword: string;
}
type ValidationStatus = 'idle' | 'loading' | 'valid' | 'invalid';
export default function CustomerRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    returnTo
  } = CustomerRegister.getParams(searchParams);

  // ===== State =====
  const [form, setForm] = useState<FormFields>({
    sysuser_account: '',
    sysuser_email: '',
    sysuser_password: '',
    sysuser_confirmPassword: ''
  });
  const [accountStatus, setAccountStatus] = useState<ValidationStatus>('idle');
  const [emailStatus, setEmailStatus] = useState<ValidationStatus>('idle');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // ===== 计算属性 =====
  const pwdRules = useMemo(() => {
    const p = form.sysuser_password;
    return {
      length: p.length >= 8,
      upperLower: /(?=.*[a-z])(?=.*[A-Z])/.test(p),
      number: /(?=.*\d)/.test(p),
      special: /(?=.*[\W_])/.test(p)
    };
  }, [form.sysuser_password]);
  const allRulesPassed = useMemo(() => {
    return pwdRules.length && pwdRules.upperLower && pwdRules.number && pwdRules.special;
  }, [pwdRules]);

  // ===== Handlers =====
  const handleFormFieldChange = <K extends keyof FormFields,>(field: K, value: FormFields[K]) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    setGlobalError(null);
  };
  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };
  const handleSubmit = async () => {
    try {
      setGlobalError(null);
      if (!form.sysuser_account || !form.sysuser_email || !form.sysuser_password || !form.sysuser_confirmPassword) {
        setGlobalError('请完整填写所有注册信息');
        return;
      }
      if (accountStatus === 'invalid') {
        setGlobalError('当前账号已被使用');
        return;
      }
      if (emailStatus === 'invalid') {
        setGlobalError('当前邮箱已被使用');
        return;
      }
      if (!allRulesPassed) {
        setGlobalError('密码不满足复杂度规则要求');
        return;
      }
      if (form.sysuser_password !== form.sysuser_confirmPassword) {
        setGlobalError('两次确认密码不一致');
        return;
      }
      setIsSubmitting(true);
      await registerCustomer(form);
      setIsSuccess(true);
    } catch (error: any) {
      setGlobalError(error.message || '注册请求失败，请稍后重试');
      toast.error(error.message || '注册失败');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoLogin = () => {
    if (returnTo) {
      CustomerLogin.navigateToWithReturn(router, {
        returnTo
      });
    } else {
      CustomerLogin.navigateToDefault(router);
    }
  };

  // ===== Effects =====
  // 账号唯一性防抖校验
  useEffect(() => {
    const val = form.sysuser_account;
    if (!val) {
      setAccountStatus('idle');
      return;
    }
    setAccountStatus('loading');
    const timer = setTimeout(() => {
      checkAccountUnique({
        sysuser_account: val
      }).then(res => setAccountStatus(res.is_unique ? 'valid' : 'invalid')).catch(() => setAccountStatus('idle'));
    }, 600);
    return () => clearTimeout(timer);
  }, [form.sysuser_account]);

  // 邮箱唯一性防抖校验
  useEffect(() => {
    const val = form.sysuser_email;
    if (!val) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('loading');
    const timer = setTimeout(() => {
      checkEmailUnique({
        sysuser_email: val
      }).then(res => setEmailStatus(res.is_unique ? 'valid' : 'invalid')).catch(() => setEmailStatus('idle'));
    }, 600);
    return () => clearTimeout(timer);
  }, [form.sysuser_email]);

  // ===== Render =====
  if (isSuccess) {
    return <main data-api-unique-id='customerregisterview-skeleton-with-logic-rba9b52e78b7de987-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
        <section data-api-unique-id='customerregisterview-skeleton-with-logic-r4875b73473ff4f75-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
          <div data-api-unique-id='customerregisterview-skeleton-with-logic-reaf1d3ee4ea13891-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
            {/* 视觉核心成功 Icon (纯文本模拟) */}
            <span data-api-unique-id='customerregisterview-skeleton-with-logic-rf7cb9e02a7b2490b-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>[成功 Icon]</span>
          </div>
          <h1 data-api-unique-id='customerregisterview-skeleton-with-logic-r82df975cb92218bd-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>账户创建成功</h1>
          <p data-api-unique-id='customerregisterview-skeleton-with-logic-r07b30e67acd21b1c-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>您的专属购物车已初始化完毕，系统将引导您进入采购大厅。</p>
          <Button onClick={handleGoLogin} disabled={false} variant="default" size="lg" data-api-unique-id='customerregisterview-skeleton-with-logic-rf8edb1f99532cfce-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
            立即前往登录
          </Button>
        </section>
      </main>;
  }
  return <main data-api-unique-id='customerregisterview-skeleton-with-logic-r33112ab837817aba-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
      <section data-api-unique-id='customerregisterview-skeleton-with-logic-ra86433d414d87f1a-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
        <header data-api-unique-id='customerregisterview-skeleton-with-logic-r17cfea39ac2c452b-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
          <div data-api-unique-id='customerregisterview-skeleton-with-logic-r66cff3b9ce844fa6-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>[品牌 Logo]</div>
          <h1 data-api-unique-id='customerregisterview-skeleton-with-logic-r4bc3b55080a30856-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>建立全球采购账户</h1>
          <p data-api-unique-id='customerregisterview-skeleton-with-logic-r5a34d9e422627bb8-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>接入标准化供应链体系，开启无摩擦跨境采购体验。</p>
        </header>

        <form onSubmit={e => {
        e.preventDefault();
        handleSubmit();
      }} data-api-unique-id='customerregisterview-skeleton-with-logic-rfa15099e03b9d8b5-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
          <fieldset disabled={isSubmitting} data-api-unique-id='customerregisterview-skeleton-with-logic-r087e5cd4a30c48b6-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
            
            {/* 账号输入组 */}
            <div data-api-unique-id='customerregisterview-skeleton-with-logic-r27e1b41bbd5b9735-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
              <Input placeholder="设定唯一登录账号" value={form.sysuser_account} onChange={e => handleFormFieldChange('sysuser_account', e.target.value)} data-api-unique-id='customerregisterview-skeleton-with-logic-r61eefa7856dfdb2b-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic' />
              <div data-api-unique-id='customerregisterview-skeleton-with-logic-r2f5a7ca128930d1d-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                {accountStatus === 'loading' && <span data-api-unique-id='customerregisterview-skeleton-with-logic-r1818ee8808666597-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>校验中...</span>}
                {accountStatus === 'valid' && <span data-api-unique-id='customerregisterview-skeleton-with-logic-r53fdbd6c18fc9f4e-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>可用</span>}
                {accountStatus === 'invalid' && <span data-api-unique-id='customerregisterview-skeleton-with-logic-rf4bb3108e3ee4d94-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>已存在</span>}
              </div>
            </div>

            {/* 邮箱输入组 */}
            <div data-api-unique-id='customerregisterview-skeleton-with-logic-rd6d469079fc483bf-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
              <Input type="email" placeholder="输入工作或个人邮箱" value={form.sysuser_email} onChange={e => handleFormFieldChange('sysuser_email', e.target.value)} data-api-unique-id='customerregisterview-skeleton-with-logic-readdea0060f3ac99-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic' />
              <div data-api-unique-id='customerregisterview-skeleton-with-logic-r853cdb8fcbb72d4b-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                {emailStatus === 'loading' && <span data-api-unique-id='customerregisterview-skeleton-with-logic-ra3ad404117585774-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>校验中...</span>}
                {emailStatus === 'valid' && <span data-api-unique-id='customerregisterview-skeleton-with-logic-rdb98257730569944-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>可用</span>}
                {emailStatus === 'invalid' && <span data-api-unique-id='customerregisterview-skeleton-with-logic-r81b769fa338c2ea9-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>已存在</span>}
              </div>
            </div>

            {/* 密码输入组 */}
            <div data-api-unique-id='customerregisterview-skeleton-with-logic-rbd1bc126798445ec-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
              <Input type={showPassword ? 'text' : 'password'} placeholder="设定安全密码" value={form.sysuser_password} onChange={e => handleFormFieldChange('sysuser_password', e.target.value)} data-api-unique-id='customerregisterview-skeleton-with-logic-r68d53b33e859867b-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic' />
              <Button type="button" variant="ghost" onClick={handleTogglePassword} data-api-unique-id='customerregisterview-skeleton-with-logic-r3506c1de053ca5f3-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                {showPassword ? '隐藏' : '显示'}
              </Button>
            </div>

            {/* SaaS 级密码规则面板 (2x2 网格) */}
            <div data-api-unique-id='customerregisterview-skeleton-with-logic-rb5865b0ef884c450-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
              <div data-api-unique-id='customerregisterview-skeleton-with-logic-r2be3e4a6792c9258-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                <Checkbox checked={pwdRules.length} disabled data-api-unique-id='customerregisterview-skeleton-with-logic-r0b6c1d2d43caf527-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic' />
                <label data-api-unique-id='customerregisterview-skeleton-with-logic-r40cfe9f77c8d3cd0-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>至少 8 个字符</label>
              </div>
              <div data-api-unique-id='customerregisterview-skeleton-with-logic-r23dda2253ac2ba44-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                <Checkbox checked={pwdRules.upperLower} disabled data-api-unique-id='customerregisterview-skeleton-with-logic-rc92f980f7d114630-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic' />
                <label data-api-unique-id='customerregisterview-skeleton-with-logic-reaadb8e2e2a9bfb5-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>包含大小写字母</label>
              </div>
              <div data-api-unique-id='customerregisterview-skeleton-with-logic-re7e32ad65d88eeee-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                <Checkbox checked={pwdRules.number} disabled data-api-unique-id='customerregisterview-skeleton-with-logic-rbfb2230563cffb66-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic' />
                <label data-api-unique-id='customerregisterview-skeleton-with-logic-rbe0ba3f1c918f44d-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>包含数字</label>
              </div>
              <div data-api-unique-id='customerregisterview-skeleton-with-logic-re57a069e7a612fce-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                <Checkbox checked={pwdRules.special} disabled data-api-unique-id='customerregisterview-skeleton-with-logic-r0d6b51ea48581a1b-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic' />
                <label data-api-unique-id='customerregisterview-skeleton-with-logic-r017deee338f00a5e-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>包含特殊符号</label>
              </div>
            </div>

            {/* 确认密码组 */}
            <div data-api-unique-id='customerregisterview-skeleton-with-logic-ra02da565002ef11c-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
              <Input type={showPassword ? 'text' : 'password'} placeholder="再次确认密码" value={form.sysuser_confirmPassword} onChange={e => handleFormFieldChange('sysuser_confirmPassword', e.target.value)} data-api-unique-id='customerregisterview-skeleton-with-logic-r11108821da2e81cc-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic' />
              <div data-api-unique-id='customerregisterview-skeleton-with-logic-r9cb70118a06f8d0a-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                {form.sysuser_confirmPassword && form.sysuser_password === form.sysuser_confirmPassword && <span data-api-unique-id='customerregisterview-skeleton-with-logic-r847650df90136ce4-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>一致</span>}
                {form.sysuser_confirmPassword && form.sysuser_password !== form.sysuser_confirmPassword && <span data-api-unique-id='customerregisterview-skeleton-with-logic-r83cd30e5c2a4c591-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>不一致</span>}
              </div>
            </div>

            {/* 全局错误反馈区 */}
            {globalError && <Alert variant="destructive" data-api-unique-id='customerregisterview-skeleton-with-logic-r2c5f50f368fb7d5b-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                <AlertDescription data-api-unique-id='customerregisterview-skeleton-with-logic-r720b3bf97bf72230-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>{globalError}</AlertDescription>
              </Alert>}

            {/* 行动转化区 */}
            <div data-api-unique-id='customerregisterview-skeleton-with-logic-re490aca79e0414fe-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
              <Button type="submit" variant="default" size="lg" disabled={isSubmitting} data-api-unique-id='customerregisterview-skeleton-with-logic-r074a10077e963e41-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
                {isSubmitting ? '处理中...' : '创建采购账户'}
              </Button>
            </div>
            
          </fieldset>
        </form>

        <footer data-api-unique-id='customerregisterview-skeleton-with-logic-r80ac79274854734a-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
          <div data-api-unique-id='customerregisterview-skeleton-with-logic-ra5bdfa6775266e92-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
            <span data-api-unique-id='customerregisterview-skeleton-with-logic-ra767e7d1cd0fa84e-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>已拥有采购账户？</span>
            <Button variant="link" onClick={handleGoLogin} disabled={isSubmitting} data-api-unique-id='customerregisterview-skeleton-with-logic-r09aaae57ef61bfab-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
              立即登录
            </Button>
          </div>
          <div data-api-unique-id='customerregisterview-skeleton-with-logic-rf7e1eeff5a3815e2-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>
            <span data-api-unique-id='customerregisterview-skeleton-with-logic-re174cb14ae04d960-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>[安全锁 Icon] 256-bit SSL 级加密</span>
            <span data-api-unique-id='customerregisterview-skeleton-with-logic-r1528568c21763a1e-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>|</span>
            <span data-api-unique-id='customerregisterview-skeleton-with-logic-reae0340834cb061a-s61923607' data-api-unique-page-name='src/frontend/components/CustomerRegisterView_skeleton_with_logic'>[护盾 Icon] 遵循全球隐私合规</span>
          </div>
        </footer>
      </section>
    </main>;
}