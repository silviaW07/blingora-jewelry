'use client'
import { useState, useCallback, useEffect } from 'react';
import type { LoginCustomerInput } from '@/frontend/actions/CustomerLogin';
import { loginCustomer } from '@/frontend/actions/CustomerLogin';
import { useUserSession } from '@/tools/FrontendSession';
import { hardNavigate } from '@/frontend/utils/hardNavigate';
import { toast } from "sonner";

// Export States
export interface CustomerLoginState {
  /** 登录表单数据 */
  formData: LoginCustomerInput;
  /** 是否正在提交中 */
  isSubmitting: boolean;
  /** 错误消息提示 */
  errorMessage: string | null;
  /** 是否显示明文密码 */
  showPassword: boolean;
  /** 是否记住账号 */
  rememberMe: boolean;
  /** 登录后需要返回的路径 */
  returnTo: string | undefined;
}

// Export Handlers
export interface CustomerLoginHandlers {
  /** 处理表单字段变更 */
  handleFormFieldChange: <K extends keyof LoginCustomerInput>(field: K, value: LoginCustomerInput[K]) => void;
  /** 处理登录表单提交 */
  handleLoginSubmit: (e: React.FormEvent) => Promise<void>;
  /** 跳转至注册页面 */
  handleGoToRegister: () => void;
  /** 切换密码可见性状态 */
  togglePasswordVisibility: () => void;
  /** 处理记住账号状态变更 */
  handleRememberMeChange: (checked: boolean | "indeterminate") => void;
}

export const useCustomerLogin = (): {
  state: CustomerLoginState;
  handlers: CustomerLoginHandlers;
} => {
  const { set: setSession } = useUserSession();
  const [returnTo, setReturnTo] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const next = (sp.get('returnTo') || sp.get('redirect') || '').trim()
    setReturnTo(next || undefined)
  }, [])

  const [formData, setFormData] = useState<LoginCustomerInput>({
    sysuser_account: '',
    sysuser_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleFormFieldChange = <K extends keyof LoginCustomerInput>(
    field: K,
    value: LoginCustomerInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sysuser_account || !formData.sysuser_password) {
      setErrorMessage('Please enter your email and password');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await loginCustomer(formData);
      
      setSession({
        token: result.token,
        user_id: result.sysuser_id,
        username: result.sysuser_name || result.sysuser_account,
        email: result.sysuser_email,
        preferredLocale: result.preferred_locale || 'en',
        role: 'CUSTOMER'
      });

      toast.success('Signed in successfully');

      const target = returnTo ? decodeURIComponent(returnTo) : '/'
      hardNavigate(target.startsWith('/') ? target : '/')
    } catch (error: any) {
      const raw = String(error?.message || '');
      // Prisma / engine dumps → friendly copy; business errors pass through
      if (
        /Invalid `.*` invocation/i.test(raw) ||
        /does not exist in the current database/i.test(raw) ||
        /passwordPlain/i.test(raw) ||
        /prisma/i.test(raw) ||
        /Server is taking a break/i.test(raw)
      ) {
        setErrorMessage('Sign-in is temporarily unavailable. Please try again.');
      } else {
        setErrorMessage(raw || 'Sign-in failed. Please check your details');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToRegister = useCallback(() => {
    if (returnTo) {
      hardNavigate(`/customerregister/?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }
    hardNavigate('/customerregister/')
  }, [returnTo]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleRememberMeChange = (checked: boolean | "indeterminate") => {
    setRememberMe(checked === true);
  };

  const state: CustomerLoginState = {
    formData,
    isSubmitting,
    errorMessage,
    showPassword,
    rememberMe,
    returnTo
  };

  const handlers: CustomerLoginHandlers = {
    handleFormFieldChange,
    handleLoginSubmit,
    handleGoToRegister,
    togglePasswordVisibility,
    handleRememberMeChange
  };

  return { state, handlers };
};