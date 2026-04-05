@echo off
color 0B
title LIMS Journal - Server

echo ==============================================
echo            STARTING LIMS SERVER              
echo ==============================================
echo.

cd /d "%~dp0"

:: Отключаем назойливые сообщения о финансировании
call npm config set fund false

if not exist "package.json" (
    color 0C
    echo[ERROR] package.json not found!
    pause
    exit /b
)

if not exist "node_modules\" (
    echo [*] node_modules not found. Running npm install...
    call npm install
    echo.
)

:: Автоматическая генерация клиента Prisma для Cutting-edge режима
echo [*] Ensuring Prisma Client is up to date...
call npx prisma generate

echo.
echo [] Checking port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [*] Killing old process PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)

taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq LIMS Journal*" >nul 2>&1

echo [*] Starting dev server...
echo.

start http://localhost:3000

call npm run dev

pause
