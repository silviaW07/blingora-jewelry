/**
 * 鉴权类型定义文件
 * 平台: backend
 */

// ===== 枚举定义 =====
export enum UserRole {
  ADMIN = 'ADMIN',
}

// ===== 类型定义 =====
export interface AuthContext {
  userId: string
  account: string
  username: string
  email: string
  role: UserRole
  avatarUrl?: string | null
}

/**
 * 401 未授权错误
 * constructor 必须先 super()；禁止 class field，避免 Must call super constructor
 */
export class UnauthorizedError extends Error {
  constructor(message = '请先登录') {
    super(message)
    this.name = 'UnauthorizedError'
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
  get statusCode(): number {
    return 401
  }
}

/**
 * 403 禁止访问错误
 */
export class ForbiddenError extends Error {
  constructor(message = '权限不足，无法执行此操作') {
    super(message)
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
  get statusCode(): number {
    return 403
  }
}

// ===== 鉴权方法签名 =====

/**
 * 强制要求登录的包装器
 */
export declare function requireAuth(): <TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
) => (...args: TArgs) => Promise<TReturn>;

/**
 * 强制要求特定角色的包装器
 * @param roles 支持枚举值或字符串，如 UserRole.ADMIN 或 'ADMIN'
 */
export declare function requireRole(
  roles: UserRole | UserRole[] | string | string[]
): <TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
) => (...args: TArgs) => Promise<TReturn>;

/**
 * 获取当前请求的鉴权上下文
 */
export declare function getAuthContext(): AuthContext

/**
 * 获取当前登录用户 ID
 */
export declare function getUserId(): string

/**
 * 获取当前登录用户角色
 */
export declare function getRole(): UserRole

/**
 * 签发 JWT Token
 * @param userId 用户 ID
 * @param role 用户角色
 * @param expiresIn 过期时间，默认 7 天
 */
export declare function signToken(
  userId: string,
  role: string,
  expiresIn?: string
): Promise<string>

/**
 * 密码哈希
 * @param password 明文密码
 * @returns SHA256 哈希后的密码
 */
export declare function hashPassword(password: string): string

/**
 * 尝试获取当前登录用户上下文（不抛错）
 * @returns 已登录返回 AuthContext，未登录返回 null
 */
export declare function tryGetAuthContext(): AuthContext | null

/**
 * 标准响应包装器
 * 自动处理 try-catch
 * 
 * @example
 * export const updateProductStatus = requireRole(UserRole.ADMIN)(
 *   withResult(async (id: string, status: productstatus) => {
 *     return await prisma.product.update({
 *       where: { id },
 *       data: { status }
 *     })
 *   })
 * )
 *
 * @example
 * // 注意：create/update 的 data 中，若 Schema 该 FK 有 @relation 定义，
 * // 必须用关系语法 `xxx: { connect: { id } }` 而非直接赋标量 FK。
 * export const createProduct = requireRole(UserRole.ADMIN)(
 *   withResult(async (input: { name: string, categoryId: string, skuCode: string, price: number }) => {
 *     const product = await prisma.product.create({
 *       data: {
 *         name: input.name,
 *         productCode: 'P' + Date.now(),
 *         source: 'MANUAL',
 *         mainImageUrl: '',
 *         galleryJson: [],
 *         category: { connect: { id: input.categoryId } },
 *         skus: {
 *           create: [{
 *             skuCode: input.skuCode,
 *             price: input.price,
 *             attributeJson: []
 *           }]
 *         }
 *       }
 *     })
 *     return product
 *   })
 * )
 */
export declare function withResult<TArgs extends any[], TData>(
  fn: (...args: TArgs) => Promise<TData>
): (
  ...args: TArgs
) => Promise<TData>