'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Dashboard, AdminRegister } from '@/backend/route-params';
import type { AdminLoginInput } from '@/backend/actions/AdminLogin';
import { adminLogin } from '@/backend/actions/AdminLogin';
import { useAdminSession } from '@/tools/BackendSession';

export interface AdminLoginState {
  /** 表单数据，包含账号和密码 */
  formData: AdminLoginInput;
  /** 提交状态，用于禁用按钮和显示加载态 */
  isSubmitting: boolean;
}

export interface AdminLoginHandlers {
  /** 处理输入框内容变更 */
  handleFormFieldChange: <K extends keyof AdminLoginInput>(field: K, value: AdminLoginInput[K]) => void;
  /** 处理登录表单提交逻辑 */
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  /** 跳转至注册页面 */
  handleGoToRegister: () => void;
}

export const useAdminLogin = (): { state: AdminLoginState, handlers: AdminLoginHandlers } => {
  const router = useRouter();
  const { set: setSession } = useAdminSession();

  // ===== State =====
  const [formData, setFormData] = useState<AdminLoginInput>({
    sysuser_account: '',
    sysuser_password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== Handlers =====
  const handleFormFieldChange = <K extends keyof AdminLoginInput>(
    field: K,
    value: AdminLoginInput[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
        username: data.sysuser_username,
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

  return {
    state: {
      formData,
      isSubmitting,
    },
    handlers: {
      handleFormFieldChange,
      handleSubmit,
      handleGoToRegister,
    },
  };
};
