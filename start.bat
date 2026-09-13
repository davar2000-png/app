@echo off
chcp 65001 >nul
title TechnoKala Server
color 0A
cls

echo.
echo ========================================
echo   TechnoKala Accounting System
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [OK] Node.js found
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    echo.
)

REM Check if dist folder exists
if not exist "dist" (
    echo [INFO] Building project...
    echo.
    call npm run build
    echo.
    if not exist "dist" (
        echo [ERROR] Build failed!
        pause
        exit /b
    )
    echo [OK] Build completed successfully!
    echo.
)

echo [INFO] Starting server...
echo.
echo Server address: http://localhost:3000
echo.
echo Opening browser...
echo.
echo To stop server: Close this window or press Ctrl+C
echo.

node server.js
