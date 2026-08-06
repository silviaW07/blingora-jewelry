# Stable local Next.js on Windows (avoids Turbopack + path-with-spaces crashes).
# Usage (PowerShell):
#   powershell -ExecutionPolicy Bypass -File scripts/dev-stable.ps1
$ErrorActionPreference = "Stop"

$Repo = Split-Path -Parent $PSScriptRoot
$Junction = "D:\AutoCoder.cc"

# Prefer a space-free junction — Turbopack/postcss break on "D:\clash Ver\..."
if (-not (Test-Path $Junction)) {
  cmd /c mklink /J "$Junction" "$Repo" | Out-Host
}

Set-Location $Junction

# Free port 3000
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

if (Test-Path ".next\dev\lock") {
  Remove-Item -Force ".next\dev\lock"
}

$env:PROJECT_ID = if ($env:PROJECT_ID) { $env:PROJECT_ID } else { "PROJ_fcb9e6ee_snap_20260726_092922_893" }

Write-Host "Starting Next (webpack) from $Junction on :3000"
Write-Host "RPC should already be on :3100 (pnpm run dev:backend) if you need data."
pnpm exec next dev --webpack -p 3000
