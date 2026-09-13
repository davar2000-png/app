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
if %errorlevel% equ 0 (
    echo [OK] Node.js found
    echo.
    echo Starting server...
    echo.
    node server.js
    goto :eof
)

echo [ERROR] Node.js not found!
echo.
echo Please install Node.js from:
echo https://nodejs.org/
echo.
pause
