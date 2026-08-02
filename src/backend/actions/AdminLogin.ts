'use server'

// ===== Enums =====
/** 用户状态：激活(ACTIVE) | 禁用(DISABLED) */
export type UserStatus = 'ACTIVE' | 'DISABLED'

// ===== Data Structures =====

// ===== Input / Output =====
export interface AdminLoginInput {
  sysuser_account: string
  sysuser_password: string
}

export interface AdminLoginOutput {
  token: string
  sysuser_id: string          // data-from: sysuser-id
  sysuser_account: string     // data-from: sysuser-account
  sysuser_username: string    // data-from: sysuser-username
  sysuser_role: string        // data-from: sysuser-role
  sysuser_status: UserStatus  // data-from: sysuser-status
  sysuser_avatarUrl: string   // data-from: sysuser-avatarUrl
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  withResult, hashPassword, signToken
} from '@/backend/action_utils'

// ===== Actions =====

/**
 * 后台管理员登录
 * 验证管理员账号密码，若验证通过且符合状态与角色要求，则返回登录 token 及账号信息。
 */
export const adminLogin = withResult(
  async (input: AdminLoginInput): Promise<AdminLoginOutput> => {
    const { sysuser_account, sysuser_password } = input

    // 1. 查询用户
    const user = await prisma.sysuser.findUnique({
      where: {
        account: sysuser_account
      }
    })

    if (!user) {
      throw new Error('账号或密码错误')
    }

    // 2. 验证密码
    const hashedPassword = hashPassword(sysuser_password)
    if (hashedPassword !== user.password) {
      throw new Error('账号或密码错误')
    }

    // 3. 验证角色
    if (user.role !== 'ADMIN') {
      throw new Error('此账号无后台访问权限')
    }

    // 4. 验证状态
    if (user.status === 'DISABLED') {
      throw new Error('账号已被禁用')
    }

    // 5. 更新最后登录时间
    await prisma.sysuser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date()
      }
    })

    // 6. 签发 Token
    const token = await signToken(user.id, user.role)

    return {
      token,
      sysuser_id: user.id,
      sysuser_account: user.account,
      sysuser_username: user.username,
      sysuser_role: user.role,
      sysuser_status: user.status as UserStatus,
      sysuser_avatarUrl: user.avatarUrl || '',
    }
  }
)