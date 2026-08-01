'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Dashboard, AdminRegister } from '@/backend/route-params';
import type { AdminLoginInput } from '@/backend/actions/AdminLogin';
import { adminLogin } from '@/backend/actions/AdminLogin';
import { useAdminSession } from '@/tools/BackendSession';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
export default function AdminLoginPage() {
  const router = useRouter();
  const {
    set: setSession
  } = useAdminSession();

  // ===== State =====
  const [formData, setFormData] = useState<AdminLoginInput>({
    sysuser_account: '',
    sysuser_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== Handlers =====
  const handleFormFieldChange = <K extends keyof AdminLoginInput,>(field: K, value: AdminLoginInput[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sysuser_account.trim()) {
      toast.error('请输入账号');
      return;
    }
    if (!formData.sysuser_password.trim()) {
      toast.error('请输入密码');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await adminLogin(formData);

      // 保存会话状态
      setSession({
        token: data.token,
        user_id: data.sysuser_id,
        username: data.sysuser_username
      });
      toast.success('登录成功');
      Dashboard.navigateTo(router);
    } catch (error: any) {
      toast.error(error.message || '登录失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoToRegister = () => {
    AdminRegister.navigateTo(router);
  };

  // ===== Render =====
  return <main data-api-unique-id='adminloginview-skeleton-with-logic-rcdac9c1532dd2e9c-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
      <div data-api-unique-id='adminloginview-skeleton-with-logic-rd22692e0ba2dd813-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
        {/* 左侧：系统信息与声明栏 */}
        <section data-api-unique-id='adminloginview-skeleton-with-logic-rde6d8282c631f166-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
          <div data-api-unique-id='adminloginview-skeleton-with-logic-r6b195e86fb1dc0e2-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
            <h1 data-api-unique-id='adminloginview-skeleton-with-logic-r51882f58372c291b-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>外贸跨境电商独立站管理系统</h1>
          </div>
          <div data-api-unique-id='adminloginview-skeleton-with-logic-rd567d0a342387a70-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
            <p data-api-unique-id='adminloginview-skeleton-with-logic-r48ad1901b593f0a6-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>全球供应链与1688商品路由中枢</p>
          </div>
          <div data-api-unique-id='adminloginview-skeleton-with-logic-r6f5b311bc33532e6-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
            <p data-api-unique-id='adminloginview-skeleton-with-logic-r1ca9b5b344ff9516-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>受控环境：仅限后台管理员进入，验证通过后将跳转至管理概览调度台</p>
          </div>
          <div data-api-unique-id='adminloginview-skeleton-with-logic-rf51d29b6d54227ce-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
            {/* 视觉锚点：拓扑图占位 */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-api-unique-id='adminloginview-skeleton-with-logic-r527a989f72957ea0-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
              <polygon points="12 2 2 7 12 12 22 7 12 2" data-api-unique-id='adminloginview-skeleton-with-logic-r3effb529a47d4d3c-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic' />
              <polyline points="2 17 12 22 22 17" data-api-unique-id='adminloginview-skeleton-with-logic-r4ef72dfe080be2f5-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic' />
              <polyline points="2 12 12 17 22 12" data-api-unique-id='adminloginview-skeleton-with-logic-rdb1703a9ab612de9-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic' />
            </svg>
          </div>
        </section>

        {/* 右侧：身份验证执行栏 */}
        <section data-api-unique-id='adminloginview-skeleton-with-logic-r038f778d1cbc50d1-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
          <header data-api-unique-id='adminloginview-skeleton-with-logic-rcd9b7e31a5d629ff-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
            <h2 data-api-unique-id='adminloginview-skeleton-with-logic-re5e5de53937e936f-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>管理员登录</h2>
            <p data-api-unique-id='adminloginview-skeleton-with-logic-r5d9cbde4c678840d-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>系统控制台安全入口</p>
          </header>

          <form onSubmit={handleSubmit} data-api-unique-id='adminloginview-skeleton-with-logic-re33299e8290672c9-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
            <div data-api-unique-id='adminloginview-skeleton-with-logic-rfcff76951884b2a6-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
              <Label htmlFor="account" data-api-unique-id='adminloginview-skeleton-with-logic-r0f2b2cdd6e50baa2-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>账号</Label>
              <Input id="account" type="text" placeholder="请输入管理员账号" value={formData.sysuser_account} onChange={e => handleFormFieldChange('sysuser_account', e.target.value)} disabled={isSubmitting} data-api-unique-id='adminloginview-skeleton-with-logic-r3adfe28a59c71753-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic' />
            </div>

            <div data-api-unique-id='adminloginview-skeleton-with-logic-r0aa29f9f4337ce04-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
              <Label htmlFor="password" data-api-unique-id='adminloginview-skeleton-with-logic-r07649f691445d55f-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>密码</Label>
              <Input id="password" type="password" placeholder="请输入密码" value={formData.sysuser_password} onChange={e => handleFormFieldChange('sysuser_password', e.target.value)} disabled={isSubmitting} data-api-unique-id='adminloginview-skeleton-with-logic-r16fa6e6720365d98-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic' />
            </div>

            <div data-api-unique-id='adminloginview-skeleton-with-logic-rd29666ad04c7f3f8-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
              <Button type="submit" disabled={isSubmitting} data-api-unique-id='adminloginview-skeleton-with-logic-rd383d40e806886cb-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
                {isSubmitting ? '验证中...' : '登录系统'}
              </Button>
            </div>
          </form>

          <footer data-api-unique-id='adminloginview-skeleton-with-logic-r551ac551720306a1-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
            <span data-api-unique-id='adminloginview-skeleton-with-logic-rc6f9584971c39f47-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>内部管理账号获取？</span>
            <Button variant="link" onClick={handleGoToRegister} disabled={isSubmitting} data-api-unique-id='adminloginview-skeleton-with-logic-r757af5a7c2dd3041-s2439452908' data-api-unique-page-name='src/backend/components/AdminLoginView_skeleton_with_logic'>
              前往注册
            </Button>
          </footer>
        </section>
      </div>
    </main>;
}