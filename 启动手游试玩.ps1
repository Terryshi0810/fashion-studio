$ErrorActionPreference = 'Stop'
$server = Join-Path $PSScriptRoot 'mobile-loop\server.js'
if (-not (Test-Path -LiteralPath $server)) { throw '找不到手游试玩文件，请完整解压分享包。' }
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$node = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $node)) { throw '当前电脑没有可用的Node运行环境。可直接打开离线HTML在电脑试玩，手机入口需要运行环境。' }
$running = $false
try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8131/trial.html' -TimeoutSec 2; $running = $response.Content -match '手游试玩 V0.30' } catch {}
if (-not $running) {
    $env:HOST = '0.0.0.0'
    $process = Start-Process -FilePath $node -ArgumentList ('"' + $server + '"') -WorkingDirectory (Split-Path -Parent $server) -WindowStyle Hidden -PassThru
    Start-Sleep -Seconds 2
    try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8131/trial.html' -TimeoutSec 3; if ($response.Content -notmatch '手游试玩 V0.30') { throw 'port' } } catch { throw '试玩服务未启动，请检查8131端口是否被占用。没有自动修改防火墙。' }
    Write-Host ('本次后台预览进程：' + $process.Id)
}
Write-Host '手游试玩已准备好。手机与这台电脑连接同一Wi-Fi，在手机浏览器输入：' -ForegroundColor Green
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | ForEach-Object { Write-Host ('http://' + $_.IPAddress + ':8131/trial.html') }
Write-Host '本机入口：http://127.0.0.1:8131/trial.html'
Write-Host '这是局域网地址，不是公网链接。请保持电脑运行；电脑IP变化时以上地址也会改变。'
Read-Host '按回车关闭此说明窗口（不会关闭后台试玩服务）'









