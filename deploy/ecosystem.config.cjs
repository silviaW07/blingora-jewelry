/**
 * PM2 ecosystem for sourcingjewelry.com
 *
 * Always start frontend from the webpack standalone output with an absolute
 * UPLOAD_DIR. Do NOT use `next start` or Turbopack production builds — both
 * have been crashing this deploy (missing turbopack_runtime / wrong cwd).
 *
 * Usage (from repo root after a successful deploy/build-frontend.sh):
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save
 */
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const STANDALONE = path.join(ROOT, '.next', 'standalone')
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/home/admin/my-website/uploads'

module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: STANDALONE,
      script: 'server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      // Avoid restart storms when the box is under memory pressure
      max_restarts: 20,
      min_uptime: '10s',
      restart_delay: 3000,
      exp_backoff_restart_delay: 1000,
      max_memory_restart: '900M',
      kill_timeout: 8000,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
        UPLOAD_DIR,
      },
    },
    // RPC is usually already running; keep this commented unless you want PM2
    // to own it as well:
    // {
    //   name: 'rpc',
    //   cwd: ROOT,
    //   script: 'server/dev-host.ts',
    //   interpreter: 'node',
    //   interpreter_args: '-r ts-node/register/transpile-only -r tsconfig-paths/register',
    //   env: { NODE_ENV: 'production', PORT: '3100' },
    // },
  ],
}
