# Reverse tunnel so the overseas server can scrape 1688 through the operator's
# home broadband IP. Server-side 127.0.0.1:RemotePort -> Clash Verge mixed port here.
$ProgressPreference = 'SilentlyContinue'
$RemotePort = 17891
$LocalProxyPort = 7897
$Server = 'admin@8.221.118.113'

Write-Host '============================================' -ForegroundColor Cyan
Write-Host ' 1688 tunnel' -ForegroundColor Cyan
Write-Host " server 127.0.0.1:$RemotePort  -->  local 127.0.0.1:$LocalProxyPort"
Write-Host ''
Write-Host ' Keep this window open. Ctrl+C to stop.' -ForegroundColor Yellow
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

# Sanity check: without a live Clash listener the tunnel connects but every
# forwarded request times out, which looks identical to a broken tunnel.
# Test-NetConnection also pings and reverse-resolves, so it stalls for ~15s here.
$probeOk = $false
$client = $null
try {
    $client = New-Object Net.Sockets.TcpClient
    $probeOk = $client.ConnectAsync('127.0.0.1', $LocalProxyPort).Wait(1500)
} catch {
    $probeOk = $false
} finally {
    if ($client) { $client.Dispose() }
}
if (-not $probeOk) {
    Write-Host "WARNING: nothing is listening on 127.0.0.1:$LocalProxyPort." -ForegroundColor Red
    Write-Host 'Start Clash, or update $LocalProxyPort to its actual mixed port.' -ForegroundColor Red
    Write-Host ''
}

while ($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] connecting..." -ForegroundColor Green
    ssh -N `
        -o StrictHostKeyChecking=accept-new `
        -o ServerAliveInterval=30 `
        -o ServerAliveCountMax=3 `
        -o ExitOnForwardFailure=yes `
        -R "${RemotePort}:127.0.0.1:${LocalProxyPort}" `
        $Server

    # Reconnect slowly: a tight loop trips sshd rate limiting.
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] tunnel dropped, retrying in 10s..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 10
}
