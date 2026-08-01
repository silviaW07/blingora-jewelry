/**
 * 把本地 Next dev (默认 3000) 暴露为临时 HTTPS 公网地址。
 * 默认 Cloudflare Quick Tunnel（免注册，https://xxx.trycloudflare.com）。
 * 已配置 ngrok authtoken 时可用 --provider=ngrok（https://xxx.ngrok-free.app）。
 *
 * 用法：
 *   1) 终端 A：pnpm run dev
 *   2) 终端 B：pnpm run tunnel
 *   可选：pnpm run tunnel:ngrok
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const getFlag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

const port = getFlag('port', process.env.PORT || '3000')
const provider = getFlag('provider', process.env.TUNNEL_PROVIDER || 'cloudflare')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const localBin = path.join(
  root,
  'tools',
  'bin',
  process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared',
)

function firstExisting(candidates) {
  for (const c of candidates) {
    if (c && existsSync(c)) return c
  }
  return null
}

function run(cmd, cmdArgs) {
  console.log(`\n[tunnel] ${cmd} ${cmdArgs.join(' ')}\n`)
  console.log(`[tunnel] 本地目标: http://127.0.0.1:${port}`)
  console.log('[tunnel] 终端里出现的 https://… 链接即可给其他电脑访问\n')
  // Windows 路径含空格时不能用 shell:true，否则会把 D:\clash Ver\... 截断
  const child = spawn(cmd, cmdArgs, {
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
    env: process.env,
  })
  child.on('exit', (code) => process.exit(code ?? 1))
  child.on('error', (err) => {
    console.error(`[tunnel] 启动失败: ${err.message}`)
    if (provider === 'cloudflare') {
      console.error('请任选其一：')
      console.error('  1) winget install --id Cloudflare.cloudflared -e')
      console.error('  2) 下载 cloudflared-windows-amd64.exe，重命名为 cloudflared.exe')
      console.error('     放到 tools/bin/ ：https://github.com/cloudflare/cloudflared/releases')
    } else {
      console.error('请安装并登录: winget install Ngrok.Ngrok')
      console.error('然后: ngrok config add-authtoken <你的 TOKEN>')
    }
    process.exit(1)
  })
}

if (provider === 'ngrok') {
  run('ngrok', ['http', String(port)])
} else {
  const localAppData = process.env.LOCALAPPDATA || ''
  const cmd =
    firstExisting([
      localBin,
      path.join(localAppData, 'cloudflared', 'cloudflared.exe'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'cloudflared', 'cloudflared.exe'),
    ]) || 'cloudflared'
  run(cmd, ['tunnel', '--url', `http://127.0.0.1:${port}`])
}
