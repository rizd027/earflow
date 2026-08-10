@echo off
title Earflow Manager
:menu
cls
echo ===========================================
echo       EARFLOW PROJECT COMMAND MENU
echo ===========================================
echo [1] npm run dev   (Menjalankan Server Dev)
echo [2] npm run build (Build Aplikasi Production)
echo [3] npm run preview (Preview Build Production)
echo [4] Keluar
echo ===========================================
set /p choice="Pilih menu (1-4): "

if "%choice%"=="1" (
    echo.
    echo Menjalankan npm run dev...
    npm run dev
    pause
    goto menu
)
if "%choice%"=="2" (
    echo.
    echo Menjalankan npm run build...
    npm run build
    echo.
    pause
    goto menu
)
if "%choice%"=="3" (
    echo.
    echo Menjalankan npm run preview...
    npm run preview
    pause
    goto menu
)
if "%choice%"=="4" (
    exit
)

echo Pilihan tidak valid!
timeout /t 2 >nul
goto menu
