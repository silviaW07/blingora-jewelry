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
  sysuser_email: string
  sysuser_phone: string
  sysuser_password: string
}

export interface RegisterCustomerOutput {
  sysuser_id: string // data-from: sysuser-id
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  withResult,
  hashPassword,
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
 * 1. 邮箱唯一
 * 2. WhatsApp 号码必填
 * 3. 密码符合复杂度校验
 * 4. 创建 role=CUSTOMER, status=ACTIVE 的 sysuser
 * 5. 为新用户初始化对应的空购物车
 */
export const registerCustomer = withResult(
  async (input: RegisterCustomerInput): Promise<RegisterCustomerOutput> => {
    // 1. 基础校验
    if (!input.sysuser_phone.trim()) {
      throw new Error('请填写 WhatsApp 号码')
    }

    // 密码复杂度校验：至少8位，包含大小写字母、数字及特殊符号
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if (!pwdRegex.test(input.sysuser_password)) {
      throw new Error('密码不符合复杂度要求（需至少8位，包含大小写字母、数字及特殊符号）')
    }

    // 2. 唯一性业务校验 (防并发直接冲突)
    const existingEmail = await prisma.sysuser.findUnique({
      where: { email: input.sysuser_email }
    })
    if (existingEmail) {
      throw new Error('该邮箱已被注册，请更换邮箱或直接登录')
    }

    // 3. 开启事务落库并执行领域闭环（用户 + 购物车）
    const result = await prisma.$transaction(async (tx) => {
      // 创建前台用户 (GUEST -> CUSTOMER)
      const normalizedEmail = input.sysuser_email.trim().toLowerCase()
      const generatedAccount = normalizedEmail
      const newUser = await tx.sysuser.create({
        data: {
          account: generatedAccount,
          email: normalizedEmail,
          password: hashPassword(input.sysuser_password),
          role: UserRole.CUSTOMER,
          status: 'ACTIVE' as UserStatus,
          username: normalizedEmail,
          phone: input.sysuser_phone.trim(),
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

    // 4. 返回成功标识
    return {
      sysuser_id: result.id
    }
  }
)
