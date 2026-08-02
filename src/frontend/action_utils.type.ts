/**
 * 鉴权类型定义文件
 * 平台: frontend
 */

// ===== 枚举定义 =====

/**
 * 用户角色枚举
 * 根据 platform_user_role 与 schema 定义生成
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER'
}

// ===== 类型定义 =====

/**
 * 鉴权上下文信息
 * 基于 sysuser 模型生成
 */
export interface AuthContext {
  /** 用户唯一标识 (UUID) */
  userId: string
  /** 账号 */
  account: string
  /** 邮箱 */
  email: string
  /** 用户角色 */
  role: UserRole
  /** 用户名 */
  username: string
  /** 头像地址 */
  avatarUrl: string | null
}

/**
 * 401 未授权错误
 * 用 getter，禁止 class field，避免编译期 _define_property(this) 触发 Must call super
 */
export class UnauthorizedError extends Error {
  get statusCode(): number {
    return 401
  }
  constructor(message = '请先登录') {
    super(message)
    this.name = 'UnauthorizedError'
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

/**
 * 403 禁止访问错误
 */
export class ForbiddenError extends Error {
  get statusCode(): number {
    return 403
  }
  constructor(message = '权限不足，无法执行此操作') {
    super(message)
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
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
 * @param roles 支持枚举值或字符串，如 UserRole.CUSTOMER 或 'CUSTOMER'
 */
export declare function requireRole(
  roles: UserRole | UserRole[] | string | string[]
): <TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
) => (...args: TArgs) => Promise<TReturn>;

/**
 * 获取当前请求的鉴权上下文
 * @throws {UnauthorizedError} 未登录时抛出
 */
export declare function getAuthContext(): AuthContext

/**
 * 获取当前登录用户 ID
 * @throws {UnauthorizedError} 未登录时抛出
 */
export declare function getUserId(): string

/**
 * 获取当前登录用户角色
 * @throws {UnauthorizedError} 未登录时抛出
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
 * // 示例 1: 仅限 CUSTOMER 角色添加商品到购物车
 * export const addToCart = requireRole(UserRole.CUSTOMER)(
 *   withResult(async (input: { productSkuId: string, quantity: number }) => {
 *     const userId = getUserId();
 *     // 查找或创建购物车
 *     let cart = await prisma.cart.findUnique({ where: { accountId: userId } });
 *     if (!cart) {
 *       cart = await prisma.cart.create({
 *         data: { account: { connect: { id: userId } } }
 *       });
 *     }
 *     return await prisma.cartitem.create({
 *       data: {
 *         cart: { connect: { id: cart.id } },
 *         product: { connect: { id: input.productId } },
 *         productSku: { connect: { id: input.productSkuId } },
 *         quantity: input.quantity
 *       }
 *     })
 *   })
 * )
 *
 * @example
 * // 示例 2: 修改购物车项数量
 * // 注意：create/update 的 data 中，若 Schema 该 FK 有 @relation 定义，
 * // 必须用关系语法 `xxx: { connect: { id } }` 而非直接赋标量 FK。
 * // where 中使用标量 FK 是正确的。
 * export const updateCartItemQuantity = withResult(async (id: string, quantity: number) => {
 *   return await prisma.cartitem.update({
 *     where: { id },
 *     data: { quantity }
 *   })
 * })
 */
export declare function withResult<TArgs extends any[], TData>(
  fn: (...args: TArgs) => Promise<TData>
): (
  ...args: TArgs
) => Promise<TData>