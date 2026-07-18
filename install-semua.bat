@echo off
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Meminta Hak Akses Administrator...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params = %*
    echo UAC.ShellExecute "cmd.exe", "/c ""%~s0"" %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /b

:gotAdmin
    cd /d "%~dp0"

echo ===================================================
echo      MEMULAI INSTALASI OTOMATIS SIPEDAS
echo      Dinas Pendidikan Kabupaten Bojonegoro
echo ===================================================

:: 0. Validasi Instalasi Node.js
echo [0/7] Memeriksa instalasi Node.js pada sistem...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstal di perangkat ini!
    echo Silakan unduh dan instal Node.js v20 atau v22 LTS terlebih dahulu di https://nodejs.org
    echo Proses instalasi dibatalkan.
    pause
    exit /b
)
echo [OK] Node.js terdeteksi.

:: 1. Menambahkan domain lokal sipedas.local
echo [1/7] Mengatur domain lokal ke sipedas.local...
findstr /I "sipedas.local" %windir%\system32\drivers\etc\hosts >nul
if %errorlevel% neq 0 (
    echo. >> %windir%\system32\drivers\etc\hosts
    echo 127.0.0.1    sipedas.local >> %windir%\system32\drivers\etc\hosts
    echo [OK] Domain sipedas.local berhasil ditambahkan.
) else (
    echo [OK] Domain sipedas.local sudah terdaftar sebelumnya.
)

:: 2. Menginstal PM2 global
echo [2/7] Menginstal PM2 Process Manager global...
call npm install pm2 -g

:: 3. Mengatasi Potensi Error EPERM PM2 / Pipe Socket Locked
echo [3/7] Membersihkan sisa proses Node/PM2 yang menggantung...
taskkill /f /im node.exe >nul 2>&1

:: 4. Sinkronisasi Database Prisma (Membangun dev.db Baru Secara Bersih)
echo [4/7] Sinkronisasi skema database lokal...
call npx prisma db push
timeout /t 2 /nobreak >nul

:: 5. Validasi Kesiapan Artefak Produksi (Memastikan Folder .next Tersedia)
echo [5/7] Memeriksa kesiapan folder produksi sistem...
if not exist .next (
    echo [PENTING] Folder .next produksi tidak ditemukan!
    echo Menjalankan kompilasi darurat...
    call npm run build
) else (
    echo [OK] Folder produksi siap digunakan.
)

:: 6. Menyalakan sistem SIPEDAS di latar belakang via PM2
echo [6/7] Menyalakan sistem SIPEDAS di latar belakang...
call pm2 delete all >nul 2>&1
call pm2 delete sipedas >nul 2>&1

:: Cek jika menggunakan file ecosystem atau langsung start via npm
if exist ecosystem.config.js (
    call pm2 start ecosystem.config.js
) else (
    call pm2 start npm --name "sipedas" -- run start
)
call pm2 save

:: 7. Konfigurasi Auto-Start (Startup Windows)
echo [7/7] Mengatur agar sistem otomatis menyala saat laptop restart...
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_SCRIPT=%STARTUP_FOLDER%\start_sipedas_auto.bat"

echo @echo off > "%STARTUP_SCRIPT%"
echo timeout /t 10 /nobreak ^>nul >> "%STARTUP_SCRIPT%"
echo pm2 resurrect >> "%STARTUP_SCRIPT%"
echo [OK] Konfigurasi Startup berhasil dipasang.

echo ===================================================
echo    INSTALASI SELESAI SUKSES!
echo    Aplikasi SIPEDAS sudah berjalan di latar belakang.
echo    Sistem akan otomatis aktif kembali jika laptop dimulai ulang.
echo    Silakan buka domain: http://sipedas.local:3000
echo ===================================================
pause