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

/** Fields required for login only — skip schema-lag columns like passwordPlain */
const loginUserSelect = {
  id: true,
  account: true,
  password: true,
  email: true,
  role: true,
  status: true,
  username: true,
  preferredLocale: true,
} as const

// ===== Actions =====
export const loginCustomer = withResult(
  async (input: LoginCustomerInput): Promise<LoginCustomerOutput> => {
    const accountOrEmail = String(input.sysuser_account || '').trim()

    // 1. 账号查找；注册时 account 一般为邮箱，并兼容纯邮箱字段登录
    let user = await prisma.sysuser.findUnique({
      where: { account: accountOrEmail },
      select: loginUserSelect,
    })
    if (!user && accountOrEmail.includes('@')) {
      user = await prisma.sysuser.findUnique({
        where: { email: accountOrEmail.toLowerCase() },
        select: loginUserSelect,
      })
    }

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
    // Must use select — Prisma re-SELECTs the full model after update by default,
    // which fails when schema has columns (e.g. passwordPlain) not yet in DB.
    try {
      await prisma.sysuser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        select: { id: true },
      })
    } catch {
      // Best-effort: do not block a valid login on lastLoginAt / schema lag
    }

    // 6. 签发 Token
    const token = await signToken(user.id, user.role)

    return {
      token,
      sysuser_id: user.id,
      sysuser_account: user.account,
      sysuser_name: user.username,
      sysuser_email: user.email,
      preferred_locale: user.preferredLocale || 'en',
      sysuser_role: user.role,
    }
  },
)
