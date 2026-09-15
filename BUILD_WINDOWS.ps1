$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Validating project..." -ForegroundColor Cyan
$env:DATABASE_URL = "file:./prisma/dev.db"
npm run typecheck

Write-Host "Building Windows installer..." -ForegroundColor Cyan
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npm run desktop:dist

Write-Host "Installer created in the release folder." -ForegroundColor Green
Invoke-Item (Join-Path $PSScriptRoot "release")
