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
  withResult, hashPassword
} from '@/backend/action_utils'

// ===== Actions =====
export const registerAdmin = withResult(
  async (input: RegisterAdminInput): Promise<RegisterAdminOutput> => {
    // 1. 基础校验：一致性
    if (input.password !== input.confirmPassword) {
      throw new Error('两次输入的密码不一致')
    }

    // 2. 基础校验：密码复杂度（至少8位，包含字母和数字）
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(input.password)) {
      throw new Error('密码至少8个字符，且必须包含字母和数字')
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
        password: hashPassword(input.password),
        passwordPlain: String(input.password || '').slice(0, 255) || null,
        role: 'ADMIN',
        status: 'ACTIVE',
        username: input.account, // 注册时未提供 username，默认使用 account 填充必填项
      }
    })

    return { success: true }
  }
)