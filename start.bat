@echo off
chcp 65001 >nul
title Store Accounting - Local Server
color 0A

echo.
echo ========================================
echo   Store Accounting - Local Server
echo ========================================
echo.
echo Starting server...
echo.
echo Server address: http://localhost:8000
echo.
echo Opening browser...
echo.
echo To stop: Close this window
echo.

start http://localhost:8000
cd dist
powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"
