@echo off
title Store Accounting Server (Node.js)
color 0A
cls

echo.
echo ========================================
echo   Store Accounting Server (Node.js)
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
npx serve -l 8000
