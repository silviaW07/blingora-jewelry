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
import { createHash, randomUUID } from 'crypto'
import prisma from '@/tools/prisma'
import {
  withResult,
  hashPassword,
  signToken,
  UserRole
} from '@/frontend/action_utils'

const EMAIL_TAKEN_MSG = '该邮箱已被注册，请更换邮箱或直接登录'
const SCHEMA_LAG_MSG =
  '数据库结构未同步（缺少客户字段）。请在服务器执行：pnpm exec prisma migrate deploy && bash deploy/deploy-all.sh'

/** account 列 VarChar(50)；邮箱可更长，超长时用稳定短账号，email 仍存完整值 */
function buildAccountFromEmail(email: string): string {
  if (email.length <= 50) return email
  const digest = createHash('sha256').update(email).digest('hex').slice(0, 48)
  return `e_${digest}`
}

function mapRegisterError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err || '')
  if (/P2002|Unique constraint|unique constraint/i.test(raw)) {
    return new Error(EMAIL_TAKEN_MSG)
  }
  if (
    /customerType/i.test(raw) ||
    /does not exist in the current database/i.test(raw) ||
    /passwordPlain/i.test(raw)
  ) {
    return new Error(SCHEMA_LAG_MSG)
  }
  if (err instanceof Error && raw && !/Invalid `[\s\S]*` invocation/i.test(raw) && !/\bprisma\b/i.test(raw)) {
    return err
  }
  if (raw && !/Invalid `[\s\S]*` invocation/i.test(raw) && !/\bprisma\b/i.test(raw)) {
    return new Error(raw)
  }
  return new Error('注册失败，请稍后重试。若反复出现请查看 pm2 logs rpc --lines 80')
}

// ===== Actions =====

/**
 * 实时校验邮箱唯一性
 */
export const checkEmailUnique = withResult(
  async (input: CheckEmailUniqueInput): Promise<CheckEmailUniqueOutput> => {
    const email = String(input.sysuser_email || '').trim().toLowerCase()
    if (!email) return { is_unique: true }
    const count = await prisma.sysuser.count({
      where: { email },
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
      input.sysuser_email.trim().toLowerCase() || `${randomUUID()}@guest.local`

    const username = normalizedName
      ? normalizedName.slice(0, 100)
      : (normalizedEmail.split('@')[0] || normalizedEmail).slice(0, 100)

    const generatedAccount = buildAccountFromEmail(normalizedEmail)

    // 先查重：避免 Unique 变成 Prisma dump → 前端「后台服务异常」
    const existing = await prisma.sysuser.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { account: generatedAccount }],
      },
      select: { id: true },
    })
    if (existing) {
      throw new Error(EMAIL_TAKEN_MSG)
    }

    let result
    try {
      result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.sysuser.create({
          data: {
            account: generatedAccount,
            email: normalizedEmail,
            password: hashPassword(input.sysuser_password),
            // 勿写 passwordPlain：库无该列时会导致注册整体失败
            role: UserRole.CUSTOMER,
            status: 'ACTIVE' as UserStatus,
            username,
            phone: normalizedPhone || null,
            customerType: 'NEW',
            lastLoginAt: new Date(),
          },
          select: {
            id: true,
            account: true,
            email: true,
            username: true,
            preferredLocale: true,
            role: true,
          },
        })

        await tx.cart.create({
          data: {
            account: {
              connect: { id: newUser.id },
            },
          },
        })

        return newUser
      })
    } catch (err) {
      throw mapRegisterError(err)
    }

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
