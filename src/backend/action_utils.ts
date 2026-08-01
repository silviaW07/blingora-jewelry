import prisma from '@/tools/prisma'
// 导入导出 Part 1: 
// ===== 【必须】从 BaseActionFun 导入并 re-export，照抄不要改 =====
import {
  UnauthorizedError,
  ForbiddenError,
  authStorage,
  parseTokenBase,
  runWithAuth,
  signToken,
  hashPassword,
  withResult,
} from '@/@base/BaseActionFun'

export {
  UnauthorizedError,
  ForbiddenError,
  runWithAuth,
  authStorage,
  signToken,
  hashPassword,
  withResult,
}
// ===== 【必须】导入导出结束 =====

// 导入导出 Part 2: 
// 从action_utils.type导入 AuthContext + **所有**定义的枚举类(Enums Definitions) 并re-export
import {
  UserRole,
  type AuthContext,
} from './action_utils.type'

export { UserRole } 
export type { AuthContext }
// 导入导出 Part 2 end

// ===== 内部方法 =====

/**
 * 解析 Token 并获取用户信息
 * COT 推理：
 * 1. UserRole 枚举包含 ADMIN。
 * 2. Prisma Schema 中 sysuser 表包含 role 字段，且其枚举 userrole 包含 ADMIN。
 * 3. 故 parseToken 查询 sysuser 表。
 */
export async function parseToken(token: string): Promise<AuthContext | null> {
  const payload = await parseTokenBase(token)
  if (!payload) return null
  
  const user = await prisma.sysuser.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      account: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      status: true
    },
  })

  // 用户不存在或已被禁用
  if (!user || user.status === 'DISABLED') return null

  return {
    userId: user.id,
    account: user.account,
    username: user.username,
    email: user.email,
    role: user.role as unknown as UserRole, // 强制转换为前端定义的角色枚举
    avatarUrl: user.avatarUrl,
  }
}

// ===== 公共 API =====

/**
 * 强制要求登录的包装器
 */
export function requireAuth() {
  return <TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>
  ) => {
    return async (...args: TArgs): Promise<TReturn> => {
      const ctx = authStorage.getStore() as AuthContext | undefined
      if (!ctx) throw new UnauthorizedError('请先登录')
      return fn(...args)
    }
  }
}

/**
 * 强制要求特定角色的包装器
 */
export function requireRole(
  roles: UserRole | UserRole[] | string | string[]
) {
  return <TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>
  ) => {
    return async (...args: TArgs): Promise<TReturn> => {
      const ctx = authStorage.getStore() as AuthContext | undefined
      if (!ctx) throw new UnauthorizedError('请先登录')

      const allowedRoles = Array.isArray(roles) ? roles : [roles]
      const userRole = String(ctx.role)
      
      const isAllowed = allowedRoles.some(role => String(role) === userRole)
      if (!isAllowed) {
        throw new ForbiddenError('权限不足，无法执行此操作')
      }

      return fn(...args)
    }
  }
}

/**
 * 获取当前请求的鉴权上下文
 */
export function getAuthContext(): AuthContext {
  const ctx = authStorage.getStore() as AuthContext | undefined
  if (!ctx) throw new UnauthorizedError('请先登录')
  return ctx
}

/**
 * 获取当前登录用户 ID
 */
export function getUserId(): string {
  return getAuthContext().userId
}

/**
 * 获取当前登录用户角色
 */
export function getRole(): UserRole {
  return getAuthContext().role
}

/**
 * 尝试获取当前登录用户上下文（不抛错）
 */
export function tryGetAuthContext(): AuthContext | null {
  return (authStorage.getStore() as AuthContext) ?? null
}