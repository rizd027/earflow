@echo off
title Push Update EarFlow to GitHub
cls
echo =======================================================
echo           PUSH UPDATE EARFLOW TO GITHUB
echo =======================================================
echo Repository: https://github.com/rizd027/earflow
echo.

:: Switch branch to main
git branch -M main 2>nul

:: Stage all files
echo [1/3] Menambahkan berkas ke Git (git add .)...
git add .

:: Input custom commit message or fallback to default
set /p COMMIT_MSG="[2/3] Masukkan pesan commit (Tekan Enter untuk default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update EarFlow %date% %time:~0,5%

echo Memproses commit dengan pesan: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

:: Push to remote
echo.
echo [3/3] Mengirimkan update ke GitHub (git push origin main)...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo =======================================================
    echo   BERHASIL! Update telah ter-upload ke GitHub.
    echo =======================================================
) else (
    echo =======================================================
    echo   PERINGATAN: Push gagal! Periksa koneksi atau izin Git.
    echo =======================================================
)

echo.
pause
