@echo off
title Launching SNNOTES // SNAKE NATION...
cd /d "%~dp0"

echo ===================================================
echo   SNNOTES // SNAKE NATION NEURAL LOG ^& ALARMS
echo   Starting Windows Desktop Interface...
echo ===================================================

:: Try launching in Edge App Mode (Chromium standalone window)
start msedge --app="%~dp0index.html" --window-size=1280,840

if %ERRORLEVEL% NEQ 0 (
    :: Fallback to Chrome App Mode
    start chrome --app="%~dp0index.html" --window-size=1280,840
)

if %ERRORLEVEL% NEQ 0 (
    :: Fallback to default browser
    start "" "%~dp0index.html"
)

exit
