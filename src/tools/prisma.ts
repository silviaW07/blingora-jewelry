/* 后端真实 Prisma Client */
/* 支持 Runtime 注入模式：优先使用 globalThis.__runtimePrisma */
import { PrismaClient } from '../../prisma-generated/client'

declare global {
  var __runtimePrisma: any
}

function resolveDatabaseUrl() {
  const raw =
    process.env.DATABASE_URL ||
    'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893'
  if (/[?&]charset=/i.test(raw)) return raw
  return raw.includes('?') ? `${raw}&charset=utf8mb4` : `${raw}?charset=utf8mb4`
}

function createPrismaClient() {
  const client = new PrismaClient({
    datasources: {
      db: {
        // 强制 utf8mb4，避免 Windows 本机 MySQL 默认 gbk 把中文写成 ?
        url: resolveDatabaseUrl(),
      },
    },
  })

  // 连接后立刻锁定会话字符集，防止 Windows 本机默认 gbk
  client
    .$connect()
    .then(() => client.$executeRawUnsafe('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci'))
    .catch(error => {
      console.error('[prisma] failed to initialize utf8mb4 session charset', error)
    })

  return client
}

// 使用 Proxy 延迟获取，每次访问时检查 globalThis
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // 运行时检查，而不是打包时
    const client =
      globalThis.__runtimePrisma || (globalThis.__runtimePrisma = createPrismaClient())
    return (client as any)[prop]
  },
})

export default prisma
export { prisma }
