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

echo [INFO] Installing dependencies safely...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
  echo [ERROR] Dependency installation failed.
  pause
  exit /b 1
)

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
