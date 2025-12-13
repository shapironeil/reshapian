@echo off
setlocal
cd /d "%~dp0"
set ELECTRON_DEV=true
echo 📦 Avvio Shappa Games in dev + hot reload...
call npm run dev:watch
endlocal
