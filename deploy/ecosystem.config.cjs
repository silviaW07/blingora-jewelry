/**
 * PM2 ecosystem — single source of truth for production process env.
 *
 * Frontend MUST go through deploy/standalone-entry.cjs (loads .env + checks
 * static assets) and MUST be built with `next build --webpack`.
 *
 *   cd /home/admin/my-website/blingora-jewelry
 *   bash deploy/build-frontend.sh
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const UPLOAD_DEFAULT = '/home/admin/my-website/uploads'

function readEnvKey(key) {
  if (process.env[key]) return process.env[key]
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name)
    if (!fs.existsSync(file)) continue
    const match = fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map(l => l.trim())
      .find(l => l.startsWith(`${key}=`))
    if (!match) continue
    let value = match.slice(key.length + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value
  }
  return ''
}

// 前端为无状态页面服务，可安全水平扩展。默认 1/fork（与原行为一致）；
// 需要更高并发时设 FRONTEND_INSTANCES=2（或 'max'）后 `pm2 reload frontend`。
// 注意：RPC 承载导入任务调度器/定时轮询，切勿开 cluster（多 worker 会重复处理 1688 任务）。
const FRONTEND_INSTANCES_RAW = (readEnvKey('FRONTEND_INSTANCES') || '1').trim()
const FRONTEND_INSTANCES = FRONTEND_INSTANCES_RAW === 'max' ? 'max' : Math.max(1, Number(FRONTEND_INSTANCES_RAW) || 1)
const FRONTEND_EXEC_MODE = FRONTEND_INSTANCES === 'max' || FRONTEND_INSTANCES > 1 ? 'cluster' : 'fork'

const UPLOAD_DIR = readEnvKey('UPLOAD_DIR') || UPLOAD_DEFAULT
const DATABASE_URL = readEnvKey('DATABASE_URL')

// 给 Prisma 连接串补上连接池上限，避免高并发下耗尽 MySQL 连接。
// 若 DATABASE_URL 里已显式写了 connection_limit / pool_timeout，则不覆盖。
// 可用 DB_CONNECTION_LIMIT / DB_POOL_TIMEOUT 覆盖默认值（10 / 20s）。
function withPoolParams(url) {
  if (!url) return url
  try {
    const hasLimit = /[?&]connection_limit=/.test(url)
    const hasTimeout = /[?&]pool_timeout=/.test(url)
    if (hasLimit && hasTimeout) return url
    const limit = (readEnvKey('DB_CONNECTION_LIMIT') || '10').trim()
    const timeout = (readEnvKey('DB_POOL_TIMEOUT') || '20').trim()
    const params = []
    if (!hasLimit) params.push(`connection_limit=${limit}`)
    if (!hasTimeout) params.push(`pool_timeout=${timeout}`)
    if (params.length === 0) return url
    return url + (url.includes('?') ? '&' : '?') + params.join('&')
  } catch {
    return url
  }
}
const DATABASE_URL_POOLED = withPoolParams(DATABASE_URL)
const COOKIE_1688 = readEnvKey('COOKIE_1688') || readEnvKey('ALIBABA_COOKIE') || ''
const COOKIE_PDD = readEnvKey('COOKIE_PDD') || readEnvKey('PDD_COOKIE') || ''
const ONEBOUND_1688_KEY = readEnvKey('ONEBOUND_1688_KEY') || readEnvKey('ONEBOUND_KEY') || ''
const ONEBOUND_1688_SECRET = readEnvKey('ONEBOUND_1688_SECRET') || readEnvKey('ONEBOUND_SECRET') || ''

module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: ROOT,
      script: path.join(ROOT, 'deploy', 'standalone-entry.cjs'),
      interpreter: 'node',
      instances: FRONTEND_INSTANCES,
      exec_mode: FRONTEND_EXEC_MODE,
      autorestart: true,
      max_restarts: 30,
      min_uptime: '15s',
      restart_delay: 4000,
      exp_backoff_restart_delay: 2000,
      max_memory_restart: '1024M',
      kill_timeout: 10000,
      listen_timeout: 15000,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
        UPLOAD_DIR,
      },
    },
    {
      name: 'rpc',
      cwd: ROOT,
      script: 'server/dev-host.ts',
      interpreter: 'node',
      interpreter_args:
        '-r ts-node/register/transpile-only -r tsconfig-paths/register',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 30,
      min_uptime: '15s',
      restart_delay: 4000,
      exp_backoff_restart_delay: 2000,
      // Pending import / OneBound parse can hold large preview JSON in-process;
      // 1GB caused minute-level OOM flaps and admin "Backend service error" toasts.
      max_memory_restart: '2048M',
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
        ...(DATABASE_URL_POOLED ? { DATABASE_URL: DATABASE_URL_POOLED } : {}),
        ...(COOKIE_1688 ? { COOKIE_1688 } : {}),
        ...(COOKIE_PDD ? { COOKIE_PDD } : {}),
        ...(ONEBOUND_1688_KEY ? { ONEBOUND_1688_KEY } : {}),
        ...(ONEBOUND_1688_SECRET ? { ONEBOUND_1688_SECRET } : {}),
        TS_NODE_PROJECT: path.join(ROOT, 'tsconfig.server.json'),
      },
    },
  ],
}
