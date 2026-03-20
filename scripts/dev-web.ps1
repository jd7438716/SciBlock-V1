#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$ApiUrl = "http://114.132.84.75:8080"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$rootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $rootDir '.env'

# 加载根目录 .env 文件（如果存在）
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $pair = $line -split '=', 2
    if ($pair.Count -eq 2) {
      $name = $pair[0].Trim()
      $value = $pair[1].Trim()
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

# 设置环境变量（优先级：.env 文件 < 参数 < 已存在的环境变量）
$env:PORT = if ($env:WEB_PORT) { $env:WEB_PORT } else { '22333' }
$env:BASE_PATH = if ($env:BASE_PATH) { $env:BASE_PATH } else { '/' }

# API_URL: 如果 .env 中有 API_URL 则使用，否则使用参数默认值
if (-not $env:API_URL) {
  $env:API_URL = $ApiUrl
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SciBlock Web Dev Server (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PORT:      $($env:PORT)" -ForegroundColor Green
Write-Host "API_URL:   $($env:API_URL)" -ForegroundColor Green
Write-Host "BASE_PATH: $($env:BASE_PATH)" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Cyan

Set-Location (Join-Path $rootDir 'artifacts/web')
try {
  pnpm run dev
}
finally {
  Set-Location $rootDir
}
