'use client'
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerRegister, CustomerLogin } from '@/frontend/route-params';
import { checkEmailUnique, registerCustomer } from '@/frontend/actions/CustomerRegister';
import { toast } from "sonner";

interface FormFields {
  sysuser_email: string;
  sysuser_phone: string;
  sysuser_password: string;
}

type ValidationStatus = 'idle' | 'loading' | 'valid' | 'invalid';

export interface CustomerRegisterState {
  /** 表单字段数据 */
  form: FormFields;
  /** 邮箱校验状态 */
  emailStatus: ValidationStatus;
  /** 是否显示密码 */
  showPassword: boolean;
  /** 全局错误信息 */
  globalError: string | null;
  /** 是否正在提交中 */
  isSubmitting: boolean;
  /** 是否注册成功 */
  isSuccess: boolean;
  /** 密码规则校验结果 */
  pwdRules: {
    length: boolean;
    upperLower: boolean;
    number: boolean;
    special: boolean;
  };
  /** 是否通过所有密码规则 */
  allRulesPassed: boolean;
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

  // ===== State =====
  const [form, setForm] = useState<FormFields>({
    sysuser_email: '',
    sysuser_phone: '',
    sysuser_password: '',
  });

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

      if (!form.sysuser_email || !form.sysuser_phone || !form.sysuser_password) {
        setGlobalError('请完整填写所有注册信息');
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
      CustomerLogin.navigateToWithReturn(router, { returnTo });
    } else {
      CustomerLogin.navigateToDefault(router);
    }
  };

  // ===== Effects =====
  useEffect(() => {
    const val = form.sysuser_email;
    if (!val) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('loading');
    const timer = setTimeout(() => {
      checkEmailUnique({ sysuser_email: val })
        .then(res => setEmailStatus(res.is_unique ? 'valid' : 'invalid'))
        .catch(() => setEmailStatus('idle'));
    }, 600);
    return () => clearTimeout(timer);
  }, [form.sysuser_email]);

  return {
    state: {
      form,
      emailStatus,
      showPassword,
      globalError,
      isSubmitting,
      isSuccess,
      pwdRules,
      allRulesPassed
    },
    handlers: {
      handleFormFieldChange,
      handleTogglePassword,
      handleSubmit,
      handleGoLogin
    }
  };
};
