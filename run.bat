@echo off
title ARYNOX AI HIRE - Starting...
color 0A

echo.
echo ============================================
echo   ARYNOX AI HIRE - Starting Application
echo ============================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    pause
    exit /b 1
)

:: Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed.
    pause
    exit /b 1
)

:: Check frontend dependencies
if not exist "frontend\node_modules" (
    echo [WARN] Frontend dependencies not found. Installing...
    cd frontend && npm install && cd ..
)

echo [START] Starting ARYNOX AI HIRE...
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo.

:: Start Python backend (config.py loads APP_MODE from .env; only PORT is defaulted here)
echo [START] Starting Python backend on port 8000...
start "ARYNOX Backend" cmd /k "cd /d server-python && set PORT=8000 && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait for backend to initialize
echo [WAIT] Waiting for backend...
timeout /t 5 /nobreak >nul

:: Start frontend
echo [START] Starting Next.js frontend on port 3000...
start "ARYNOX Frontend" cmd /k "cd /d frontend && npm run dev"

echo.
echo ============================================
echo   ARYNOX AI HIRE is running!
echo ============================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   Health:   http://localhost:8000/health
echo.
echo   Open http://localhost:3000 in your browser.
echo   Close this window or run stop.bat to stop.
echo.
pause
