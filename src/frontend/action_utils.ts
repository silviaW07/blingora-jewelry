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
// 从action_utils.type导入 AuthContext + 所有定义的枚举类 并re-export
import {
  UserRole,
  type AuthContext,
} from './action_utils.type'

export { UserRole }
export type { AuthContext }
// 导入导出 Part 2 end

// ===== 内部方法 =====

/**
 * 解析 Token 并获取用户上下文
 * 推理过程：
 * 1. UserRole 枚举包含 CUSTOMER。
 * 2. Prisma Schema 中 sysuser 模型的 role 字段包含 CUSTOMER 角色。
 * 3. 因此，鉴权查询目标表为 sysuser。
 */
export async function parseToken(token: string): Promise<AuthContext | null> {
  const payload = await parseTokenBase(token)
  if (!payload) return null
  
  const user = await prisma.sysuser.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      account: true,
      email: true,
      role: true,
      username: true,
      avatarUrl: true,
      status: true,
    },
  })

  // 用户不存在或已禁用（可选校验）
  if (!user || user.status === 'DISABLED') return null

  return {
    userId: user.id,
    account: user.account,
    email: user.email,
    role: user.role as unknown as UserRole,
    username: user.username,
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
      
      if (!allowedRoles.map(String).includes(userRole)) {
        throw new ForbiddenError('权限不足，无法执行此操作')
      }

      return fn(...args)
    }
  }
}

/**
 * 获取当前请求的鉴权上下文
 * @throws {UnauthorizedError} 未登录时抛出
 */
export function getAuthContext(): AuthContext {
  const ctx = authStorage.getStore() as AuthContext | undefined
  if (!ctx) throw new UnauthorizedError('请先登录')
  return ctx
}

/**
 * 获取当前登录用户 ID
 * @throws {UnauthorizedError} 未登录时抛出
 */
export function getUserId(): string {
  return getAuthContext().userId
}

/**
 * 获取当前登录用户角色
 * @throws {UnauthorizedError} 未登录时抛出
 */
export function getRole(): UserRole {
  return getAuthContext().role
}

/**
 * 尝试获取当前登录用户上下文（不抛错）
 * @returns 已登录返回 AuthContext，未登录返回 null
 */
export function tryGetAuthContext(): AuthContext | null {
  return (authStorage.getStore() as AuthContext) ?? null
}