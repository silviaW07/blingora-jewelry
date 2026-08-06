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

const UPLOAD_DIR = readEnvKey('UPLOAD_DIR') || UPLOAD_DEFAULT
const DATABASE_URL = readEnvKey('DATABASE_URL')

module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: ROOT,
      script: path.join(ROOT, 'deploy', 'standalone-entry.cjs'),
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
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
      max_memory_restart: '1024M',
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
        ...(DATABASE_URL ? { DATABASE_URL } : {}),
        TS_NODE_PROJECT: path.join(ROOT, 'tsconfig.server.json'),
      },
    },
  ],
}
