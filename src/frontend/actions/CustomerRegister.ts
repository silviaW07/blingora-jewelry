'use server'

// ===== Enums =====
/** 状态：激活(ACTIVE) | 停用(DISABLED) */
export type UserStatus = 'ACTIVE' | 'DISABLED'

// ===== Data Structures =====
// 当前页面不涉及复杂的列表或详情结构复用

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

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  withResult,
  hashPassword,
  signToken,
  UserRole
} from '@/frontend/action_utils'

// ===== Actions =====

/**
 * 实时校验邮箱唯一性
 */
export const checkEmailUnique = withResult(
  async (input: CheckEmailUniqueInput): Promise<CheckEmailUniqueOutput> => {
    const count = await prisma.sysuser.count({
      where: { email: input.sysuser_email }
    })
    return { is_unique: count === 0 }
  }
)

/**
 * 提交注册创建前台用户账户
 * 业务规则：
 * 1. 姓名、手机号、邮箱、密码均无格式或复杂度限制
 * 2. 创建 role=CUSTOMER, status=ACTIVE 的 sysuser
 * 3. 为新用户初始化对应的空购物车
 * 4. 注册成功后直接签发 Token，便于前台「注册即登录」
 */
export const registerCustomer = withResult(
  async (input: RegisterCustomerInput): Promise<RegisterCustomerOutput> => {
    const normalizedName = input.sysuser_name.trim()
    const normalizedPhone = input.sysuser_phone.trim()
    const normalizedEmail =
      input.sysuser_email.trim().toLowerCase() || `${crypto.randomUUID()}@guest.local`

    const username = normalizedName
      ? normalizedName.slice(0, 100)
      : (normalizedEmail.split('@')[0] || normalizedEmail).slice(0, 100)

    const result = await prisma.$transaction(async (tx) => {
      const generatedAccount = normalizedEmail
      const newUser = await tx.sysuser.create({
        data: {
          account: generatedAccount,
          email: normalizedEmail,
          password: hashPassword(input.sysuser_password),
          role: UserRole.CUSTOMER,
          status: 'ACTIVE' as UserStatus,
          username,
          phone: normalizedPhone || null,
          lastLoginAt: new Date(),
        }
      })

      // 初始化空购物车
      await tx.cart.create({
        data: {
          account: {
            connect: { id: newUser.id }
          }
        }
      })

      return newUser
    })

    const token = await signToken(result.id, result.role)

    return {
      sysuser_id: result.id,
      token,
      sysuser_account: result.account,
      sysuser_name: result.username,
      sysuser_email: result.email,
      preferred_locale: result.preferredLocale || 'en',
      sysuser_role: result.role,
    }
  }
)