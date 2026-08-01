'use server'

// ===== Enums =====
// 本页面主要依赖系统基础鉴权和状态，无需额外定义展示枚举

// ===== Data Structures =====
// 本页面为登录操作，无复杂复用数据结构

// ===== Input / Output =====
export interface LoginCustomerInput {
  sysuser_account: string
  sysuser_password: string
}

export interface LoginCustomerOutput {
  token: string             // aggregated
  sysuser_id: string        // data-from: sysuser-id
  sysuser_account: string   // data-from: sysuser-account
  sysuser_name: string      // data-from: sysuser-username
  sysuser_email: string     // data-from: sysuser-email
  preferred_locale: string  // data-from: sysuser-preferredLocale
  sysuser_role: string      // data-from: sysuser-role
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
export const loginCustomer = withResult(
  async (input: LoginCustomerInput): Promise<LoginCustomerOutput> => {
    // 1. 根据账号查找用户
    const user = await prisma.sysuser.findUnique({
      where: {
        account: input.sysuser_account
      }
    })

    if (!user) {
      throw new Error('账号或密码错误')
    }

    // 2. 校验密码
    const hashedInputPassword = hashPassword(input.sysuser_password)
    if (user.password !== hashedInputPassword) {
      throw new Error('账号或密码错误')
    }

    // 3. 校验账号角色：前台登录页仅允许 CUSTOMER 登录
    if (user.role !== UserRole.CUSTOMER) {
      throw new Error('该账号非前台客户账号，禁止登录')
    }

    // 4. 校验账号状态：被禁用的账号禁止登录
    if (user.status === 'DISABLED') {
      throw new Error('账户状态受限 (DISABLED)，请联系站点管理员')
    }

    // 5. 业务闭环：登录成功瞬间更新最后登录时间
    await prisma.sysuser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 6. 签发 Token
    const token = await signToken(user.id, user.role)

    return {
      token,
      sysuser_id: user.id,
      sysuser_account: user.account,
      sysuser_name: user.username,
      sysuser_email: user.email,
      preferred_locale: user.preferredLocale || 'en',
      sysuser_role: user.role
    }
  }
)