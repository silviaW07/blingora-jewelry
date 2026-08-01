/**
 * Prisma Proxy - 前端代理模板
 *
 * 使用 Proxy 实现透明的 Prisma Client API 调用
 * 支持动态配置 ProjectID 和 API 路径
 * 使用 serializer 处理 Date/BigInt 等特殊类型
 */

import serializer from '../utils/serializer'

/**
 * Prisma 操作类型
 */
type PrismaAction =
  | 'findMany'
  | 'findUnique'
  | 'findFirst'
  | 'findFirstOrThrow'
  | 'findUniqueOrThrow'
  | 'create'
  | 'createMany'
  | 'update'
  | 'updateMany'
  | 'upsert'
  | 'delete'
  | 'deleteMany'
  | 'count'
  | 'aggregate'
  | 'groupBy'

/**
 * 代理请求结构
 */
interface ProxyRequest {
  projectId: string
  model: string
  action: PrismaAction | string
  args: Record<string, unknown>
}

/**
 * 代理响应结构 (serializer 格式)
 */
interface ProxyResponse {
  json: unknown
  meta?: {
    values?: Record<string, unknown>
  }
  error?: string
  traceId?: string
}

export class PrismaProxy {
  private projectId: string
  private runtimeApi: string

  constructor(projectId?: string, runtimeApi?: string) {
    this.projectId =
      projectId || process.env.NEXT_PUBLIC_PROJECT_ID || 'PROJ_fcb9e6ee_snap_20260726_092922_893'

    // 计算 Runtime API 地址
    if (runtimeApi) {
      this.runtimeApi = runtimeApi
    } else {
      const envApi = process.env.NEXT_PUBLIC_RUNTIME_API

      if (envApi) {
        this.runtimeApi = envApi
      } else {
        // 默认本地调试地址
        this.runtimeApi = 'http://localhost:3100/api/v1/proxy'
      }
    }
  }

  /**
   * 发送请求到 Runtime 服务
   */
  private async sendProxyRequest<T>(request: ProxyRequest): Promise<T> {
    // 使用 serializer 序列化请求参数
    const serialized = serializer.serialize(request.args)

    const res = await fetch(this.runtimeApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: request.projectId,
        model: request.model,
        action: request.action,
        args: serialized  // { json, meta }
      })
    })

    const response: ProxyResponse = await res.json()

    if (response.error) {
      throw new Error(response.error)
    }

    // 使用 serializer 反序列化响应数据
    return serializer.deserialize({
      json: response.json,
      meta: response.meta
    } as any) as T
  }

  /**
   * 创建 Model 代理
   */
  private createModelProxy(model: string): Record<string, (args?: unknown) => Promise<unknown>> {
    return new Proxy(
      {},
      {
        get: (_target, action: string) => {
          return async (args?: unknown) => {
            if (!this.projectId) {
              throw new Error('PrismaProxy: Project ID is not configured')
            }
            return this.sendProxyRequest({
              projectId: this.projectId,
              model,
              action,
              args: (args as Record<string, unknown>) || {}
            })
          }
        }
      }
    )
  }

  /**
   * 获取 Prisma Client 代理实例
   */
  public getClient(): any {
    return new Proxy({}, {
      get: (_target, model: string) => {
        // 跳过特殊属性
        if (model.startsWith('$') || model === 'then' || model === 'catch') {
          return undefined
        }
        return this.createModelProxy(model)
      }
    })
  }
}

/**
 * 默认实例（兼容旧用法）
 * 自动从环境变量读取配置
 */
export const prisma = new PrismaProxy().getClient()
export default prisma
