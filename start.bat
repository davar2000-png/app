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
    echo Server address: http://localhost:8000
    echo.
    echo Opening browser...
    echo.
    echo To stop server: Close this window or press Ctrl+C
    echo.
    
    start http://localhost:8000
    cd dist
    npx serve -l 8000 -s
    goto :eof
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python found
    echo.
    echo Starting server...
    echo.
    echo Server address: http://localhost:8000
    echo.
    echo Opening browser...
    echo.
    echo To stop server: Close this window or press Ctrl+C
    echo.
    
    start http://localhost:8000
    cd dist
    python -m http.server 8000
    goto :eof
)

echo [ERROR] Neither Node.js nor Python found!
echo.
echo Please install one of the following:
echo.
echo 1. Node.js: https://nodejs.org/
echo.
echo 2. Python: https://www.python.org/downloads/
echo.
pause
