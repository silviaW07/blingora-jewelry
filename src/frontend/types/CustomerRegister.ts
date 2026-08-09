'use server'

// ===== Enums =====
/** 状态：激活(ACTIVE) | 停用(DISABLED) */
export type UserStatus = 'ACTIVE' | 'DISABLED'

// ===== Input / Output =====
export interface CheckEmailUniqueInput {
  sysuser_email: string
}

export interface CheckEmailUniqueOutput {
  is_unique: boolean // aggregated
}

export interface RegisterCustomerInput {
  sysuser_name: string
  sysuser_email: string
  sysuser_phone: string
  sysuser_password: string
}

export interface RegisterCustomerOutput {
  sysuser_id: string // data-from: sysuser-id
  token: string
  sysuser_account: string
  sysuser_name: string
  sysuser_email: string
  preferred_locale: string
  sysuser_role: string
}

// Keep in sync with src/frontend/actions/CustomerRegister.ts (RPC uses actions/)
export {
  checkEmailUnique,
  registerCustomer,
} from '@/frontend/actions/CustomerRegister'
