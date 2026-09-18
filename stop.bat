@echo off
title ARYNOX AI HIRE - Stop
color 0C

echo.
echo ============================================
echo   ARYNOX AI HIRE - Stopping Application
echo ============================================
echo.

:: Kill processes by window title
echo [STOP] Stopping backend server...
taskkill /FI "WINDOWTITLE eq ARYNOX Backend*" /F >nul 2>nul

echo [STOP] Stopping frontend...
taskkill /FI "WINDOWTITLE eq ARYNOX Frontend*" /F >nul 2>nul

:: Kill any remaining node processes on our ports
echo [STOP] Checking ports 3000 and 8000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo [STOP] Killing process on port 3000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING 2^>nul') do (
    echo [STOP] Killing process on port 8000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>nul
)

echo.
echo ============================================
echo   ARYNOX AI HIRE stopped successfully
echo ============================================
echo.
pause
