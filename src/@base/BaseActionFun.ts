/**
 * 鉴权基础设施 - 绝对不变的方法
 * 此文件由工程维护，禁止 AI 修改
 */
import { AsyncLocalStorage } from 'async_hooks'
import { jwtVerify, SignJWT } from 'jose'
import { createHash } from 'crypto'

// ===== 基础错误类 =====

export class UnauthorizedError extends Error {
  get statusCode(): number {
    return 401
  }
  constructor(message = 'Please login first') {
    super(message)
    this.name = 'UnauthorizedError'
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export class ForbiddenError extends Error {
  get statusCode(): number {
    return 403
  }
  constructor(message = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

// ===== 上下文存储 =====

export const authStorage = new AsyncLocalStorage<any>()

// ===== JWT 配置 =====

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-64-chars-recommended'
)

// ===== 死方法：绝对不变 =====

export async function parseTokenBase(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

export async function runWithAuth<T>(
  ctx: any,
  fn: () => Promise<T>
): Promise<T> {
  return authStorage.run(ctx, fn)
}

export async function signToken(
  userId: number | string,
  role: string,
  expiresIn: string = '7d'
): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}


export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}


/**
 * 标准响应包装器
 * 运行时：捕获异常，返回 { success, data, error } 格式
 * 类型声明：直接返回 TData（因为 rpc-client 会解包）
 */
export function withResult<TArgs extends any[], TData>(
  fn: (...args: TArgs) => Promise<TData>
): (...args: TArgs) => Promise<TData> {
  return (async (...args) => {
    try {
      const data = await fn(...args)
      return data
    } catch (error: any) {
      // 认证/权限错误需要重新抛出，让 bundled-entry.ts 返回正确的 HTTP 状态码
      const isAuthError = error instanceof UnauthorizedError || error instanceof ForbiddenError
      if (isAuthError) {
        throw error
      }

      console.error('[Action Unexpected Error]:', error)
      throw error
    }
  }) as (...args: TArgs) => Promise<TData>
}