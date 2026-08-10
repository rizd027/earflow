@echo off
title Earflow - Run Build
echo ===================================
echo   Menjalankan Build Production...
echo ===================================
echo.
npm run build
echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================
    echo   BUILD SUKSES!
    echo ===================================
) else (
    echo ===================================
    echo   BUILD GAGAL! Periksa error di atas.
    echo ===================================
)
echo.
pause
