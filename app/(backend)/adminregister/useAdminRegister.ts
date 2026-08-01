'use client'
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLogin, AdminRegister } from '@/backend/route-params';
import type { RegisterAdminInput } from '@/backend/actions/AdminRegister';
import { registerAdmin } from '@/backend/actions/AdminRegister';
import { toast } from "sonner";

// Export States
export interface AdminRegisterState {
  /** 表单数据 */
  form: RegisterAdminInput;
  /** 是否正在提交 */
  isSubmitting: boolean;
  /** 是否注册成功 */
  isSuccess: boolean;
  /** 错误信息 */
  errorMsg: string;
  /** 是否显示密码 */
  showPassword: boolean;
  /** 是否显示确认密码 */
  showConfirmPassword: boolean;
}

// Export Handlers
export interface AdminRegisterHandlers {
  /** 处理表单字段变更 */
  handleFormFieldChange: <K extends keyof RegisterAdminInput>(field: K, value: RegisterAdminInput[K]) => void;
  /** 处理表单提交 */
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  /** 切换密码显示状态 */
  toggleShowPassword: () => void;
  /** 切换确认密码显示状态 */
  toggleShowConfirmPassword: () => void;
  /** 跳转至登录页 */
  navigateToLogin: () => void;
}

export function useAdminRegister(): {
  state: AdminRegisterState;
  handlers: AdminRegisterHandlers;
} {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 保持原始逻辑中对参数的获取
  const _params = AdminRegister.getParams(searchParams);

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

  const handleFormFieldChange = useCallback(<K extends keyof RegisterAdminInput>(field: K, value: RegisterAdminInput[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const navigateToLogin = useCallback(() => {
    AdminLogin.navigateTo(router);
  }, [router]);

  return {
    state: {
      form,
      isSubmitting,
      isSuccess,
      errorMsg,
      showPassword,
      showConfirmPassword
    },
    handlers: {
      handleFormFieldChange,
      handleSubmit,
      toggleShowPassword,
      toggleShowConfirmPassword,
      navigateToLogin
    }
  };
}
