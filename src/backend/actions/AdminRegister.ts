'use server'

// ===== Enums =====
// 当前页面为纯注册页，无需业务枚举暴露给前端

// ===== Data Structures =====
// 当前页面无复杂列表展示，暂无复用数据结构

// ===== Input / Output =====
export interface RegisterAdminInput {
  account: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegisterAdminOutput {
  success: boolean
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  withResult
} from '@/backend/action_utils'
import { hashSecurePassword, validateAdminPassword } from '@/backend/password-security'

// ===== Actions =====
export const registerAdmin = withResult(
  async (input: RegisterAdminInput): Promise<RegisterAdminOutput> => {
    // 1. 基础校验：一致性
    if (input.password !== input.confirmPassword) {
      throw new Error('两次输入的密码不一致')
    }

    // 2. 基础校验：密码复杂度（至少8位，包含字母和数字）
    validateAdminPassword(input.password)

    // Public registration is bootstrap-only. Once a primary administrator
    // exists, additional staff must be created from authenticated admin management.
    const existingPrimaryAdmins = await prisma.sysuser.count({
      where: { role: 'ADMIN' },
    })
    if (existingPrimaryAdmins > 0) {
      throw new Error('系统已完成管理员初始化，请由主管理员在账号管理中新增子管理员')
    }

    // 3. 业务校验：账号唯一性
    const existAccount = await prisma.sysuser.findUnique({
      where: { account: input.account },
      select: { id: true }
    })
    if (existAccount) {
      throw new Error('该账号已被注册，请更换账号或直接登录')
    }

    // 4. 业务校验：邮箱唯一性
    const existEmail = await prisma.sysuser.findUnique({
      where: { email: input.email },
      select: { id: true }
    })
    if (existEmail) {
      throw new Error('该邮箱已被注册，请更换邮箱')
    }

    // 5. 数据落库：创建 ACTIVE 状态的 ADMIN 账号
    await prisma.sysuser.create({
      data: {
        account: input.account,
        email: input.email,
        password: hashSecurePassword(input.password),
        role: 'ADMIN',
        status: 'ACTIVE',
        username: input.account, // 注册时未提供 username，默认使用 account 填充必填项
      }
    })

    return { success: true }
  }
)