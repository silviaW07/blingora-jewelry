/**
 * Stable entrypoint for Next.js standalone under PM2.
 *
 * Why this exists:
 * - `node server.js` does NOT load the repo `.env`, so UPLOAD_DIR / secrets vanish
 *   after `pm2 restart` unless they were baked into the PM2 process env.
 * - cwd must be `.next/standalone` or Next cannot find its server chunks.
 *
 * Usage: set as PM2 `script` with `cwd` = repo root (this file resolves paths itself).
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const STANDALONE = path.join(ROOT, '.next', 'standalone')
const SERVER_JS = path.join(STANDALONE, 'server.js')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const text = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    // Do not clobber explicit process env (PM2 / shell wins)
    if (process.env[key] != null && process.env[key] !== '') continue
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

loadEnvFile(path.join(ROOT, '.env.local'))
loadEnvFile(path.join(ROOT, '.env'))

process.env.NODE_ENV = process.env.NODE_ENV || 'production'
process.env.PORT = process.env.PORT || '3000'
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0'
process.env.UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(path.dirname(ROOT), 'uploads')

if (!fs.existsSync(SERVER_JS)) {
  console.error(
    `[standalone-entry] Missing ${SERVER_JS}. Run: pnpm exec next build --webpack && bash deploy/build-frontend.sh`,
  )
  process.exit(1)
}

const staticDir = path.join(STANDALONE, '.next', 'static')
if (!fs.existsSync(staticDir)) {
  console.error(
    `[standalone-entry] Missing ${staticDir}. Copy .next/static into standalone before start.`,
  )
  process.exit(1)
}

process.chdir(STANDALONE)
console.log(
  `[standalone-entry] cwd=${process.cwd()} PORT=${process.env.PORT} UPLOAD_DIR=${process.env.UPLOAD_DIR}`,
)
require(SERVER_JS)
