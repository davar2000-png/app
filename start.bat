@echo off
chcp 65001 >nul
title TechnoKala Accounting
color 0A
cls

cd /d "%~dp0"
echo.
echo ========================================
echo   TechnoKala Accounting System
echo ========================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js not found!
  echo Install Node.js LTS from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
echo [OK] Node.js found
echo.

npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-timeout 300000

echo [INFO] Installing dependencies safely...
set INSTALL_ATTEMPT=1
:install_retry
call npm install --legacy-peer-deps --no-audit --no-fund
if %errorlevel% equ 0 goto build
if %INSTALL_ATTEMPT% geq 3 (
  echo [ERROR] Internet connection kept resetting during download.
  echo Check your internet or VPN, then run start.bat again. Existing downloads are cached.
  pause
  exit /b 1
)
set /a INSTALL_ATTEMPT+=1
echo [WARN] Download interrupted. Retrying in 5 seconds...
timeout /t 5 /nobreak >nul
goto install_retry

:build
echo.
echo [INFO] Building Next.js application...
set DATABASE_URL=file:./prisma/dev.db
call npm run build
if %errorlevel% neq 0 (
  echo [ERROR] Build failed.
  pause
  exit /b 1
)

echo [OK] Build completed successfully!
echo.
echo [INFO] Starting application at http://localhost:3000
echo Close this window to stop the application.
echo.
start "TechnoKala Accounting" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
call npm start
pause
