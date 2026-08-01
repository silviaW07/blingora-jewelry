'use client'
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerRegister, CustomerLogin } from '@/frontend/route-params';
import { registerCustomer } from '@/frontend/actions/CustomerRegister';
import { loginCustomer } from '@/frontend/actions/CustomerLogin';
import { useUserSession } from '@/tools/FrontendSession';

interface FormFields {
  sysuser_name: string;
  sysuser_email: string;
  sysuser_phone: string;
  sysuser_password: string;
}

export interface CustomerRegisterState {
  /** 表单字段数据 */
  form: FormFields;
  /** 是否显示密码 */
  showPassword: boolean;
  /** 全局错误信息 */
  globalError: string | null;
  /** 是否正在提交中 */
  isSubmitting: boolean;
  /** 是否注册成功 */
  isSuccess: boolean;
}

export interface CustomerRegisterHandlers {
  /** 处理表单字段变更 */
  handleFormFieldChange: <K extends keyof FormFields>(field: K, value: FormFields[K]) => void;
  /** 切换密码显示状态 */
  handleTogglePassword: () => void;
  /** 提交注册表单 */
  handleSubmit: () => Promise<void>;
  /** 跳转至登录页 */
  handleGoLogin: () => void;
}

export const useCustomerRegister = (): { state: CustomerRegisterState, handlers: CustomerRegisterHandlers } => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { returnTo } = CustomerRegister.getParams(searchParams);
  const { set: setSession } = useUserSession();

  const [form, setForm] = useState<FormFields>({
    sysuser_name: '',
    sysuser_email: '',
    sysuser_phone: '',
    sysuser_password: '',
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleFormFieldChange = <K extends keyof FormFields>(field: K, value: FormFields[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setGlobalError(null);
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async () => {
    try {
      setGlobalError(null);
      setIsSubmitting(true);
      const registerResult = await registerCustomer(form);

      const sessionResult =
        registerResult?.token
          ? {
              token: registerResult.token,
              sysuser_id: registerResult.sysuser_id,
              sysuser_name: registerResult.sysuser_name,
              sysuser_account: registerResult.sysuser_account,
              sysuser_email: registerResult.sysuser_email,
              preferred_locale: registerResult.preferred_locale || 'en',
            }
          : await loginCustomer({
              sysuser_account:
                registerResult?.sysuser_account ||
                form.sysuser_email.trim().toLowerCase() ||
                form.sysuser_phone.trim(),
              sysuser_password: form.sysuser_password,
            });

      setSession({
        token: sessionResult.token,
        user_id: sessionResult.sysuser_id,
        username: sessionResult.sysuser_name || sessionResult.sysuser_account,
        email: sessionResult.sysuser_email,
        preferredLocale: sessionResult.preferred_locale || 'en',
        role: 'CUSTOMER',
      });

      setIsSuccess(true);
      if (returnTo) {
        router.replace(decodeURIComponent(returnTo));
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      setGlobalError(error.message || '注册请求失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoLogin = () => {
    if (returnTo) {
      CustomerLogin.navigateToWithReturn(router, { returnTo });
    } else {
      CustomerLogin.navigateToDefault(router);
    }
  };

  return {
    state: {
      form,
      showPassword,
      globalError,
      isSubmitting,
      isSuccess,
    },
    handlers: {
      handleFormFieldChange,
      handleTogglePassword,
      handleSubmit,
      handleGoLogin
    }
  };
};
