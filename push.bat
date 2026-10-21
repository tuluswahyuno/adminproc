@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo           AUTO-PUSH KE GITHUB (ADMINPROC)
echo ===================================================
echo.

git status --short
echo.

set "pesan="
set /p "pesan=Masukkan pesan commit (tekan ENTER untuk pesan otomatis): "

if "!pesan!"=="" (
    set "pesan=Update otomatis: %date% %time%"
)

echo.
echo [1/3] Menambahkan file yang berubah...
git add .

echo [2/3] Membuat commit: "!pesan!"...
git commit -m "!pesan!"

echo [3/3] Mengunggah (push) ke GitHub...
git push

echo.
echo ===================================================
echo   SELESAI! Codingan Anda telah tersimpan di GitHub.
echo ===================================================
echo.
pause
