@echo off
title Push Thanox to GitHub
color 0A
echo ============================================================
echo   DAY DU AN THANOX VIP LEN GITHUB
echo ============================================================
echo.
echo Hay tao 1 repository moi tren GitHub (https://github.com/new).
echo Sau do dan dia chi Repository vao ben duoi:
echo (Vi du: https://github.com/YOUR_USERNAME/thanox-vip.git)
echo.
set /p REPO_URL="Nhap Link GitHub Repository cua ban: "

if "%REPO_URL%"=="" (
    echo Ban chua nhap link! Thoat.
    pause
    exit /b
)

echo.
echo Dang ket noi va day code len GitHub...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo [THANH CONG] Code da duoc day len GitHub thanh cong!
) else (
    echo [CHU Y] Neu hoi dang nhap, hay nhap Personal Access Token hoac dang nhap GitHub!
)
pause
