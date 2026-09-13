@echo off
chcp 65001 >nul
title Store Accounting Server
color 0A
cls

echo.
echo ========================================
echo   Store Accounting Server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python found
    echo.
    echo Starting server on http://localhost:8000
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

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js found
    echo.
    echo Starting server on http://localhost:8000
    echo.
    echo Opening browser...
    echo.
    echo To stop server: Close this window or press Ctrl+C
    echo.
    
    start http://localhost:8000
    cd dist
    npx serve -l 8000
    goto :eof
)

echo [ERROR] Neither Python nor Node.js found!
echo.
echo Please install one of the following:
echo.
echo 1. Python: https://www.python.org/downloads/
echo    (Make sure to check "Add Python to PATH")
echo.
echo 2. Node.js: https://nodejs.org/
echo.
pause
