@echo off
title Shappa Games
echo ================================
echo    SHAPPA GAMES - Launcher
echo ================================
echo.
echo Avvio dell'applicazione desktop...
echo.

REM Avvia l'app Electron
npm start

echo.
echo L'applicazione e' stata chiusa.
echo.
timeout /t 2 >nul
exit
