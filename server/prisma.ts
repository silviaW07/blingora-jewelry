/* 后端真实 Prisma Client */
import { PrismaClient } from '../prisma-generated/client'

function resolveDatabaseUrl() {
  const raw =
    process.env.DATABASE_URL ||
    'mysql://root:LocalDev123!@localhost:3306/PROJ_fcb9e6ee_snap_20260726_092922_893'
  if (/[?&]charset=/i.test(raw)) return raw
  return raw.includes('?') ? `${raw}&charset=utf8mb4` : `${raw}?charset=utf8mb4`
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolveDatabaseUrl(),
    },
  },
})

prisma
  .$connect()
  .then(() => prisma.$executeRawUnsafe('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci'))
  .catch(error => {
    console.error('[server/prisma] failed to initialize utf8mb4 session charset', error)
  })

export default prisma
export { prisma }
