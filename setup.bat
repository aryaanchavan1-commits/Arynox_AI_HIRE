@echo off
title ARYNOX AI HIRE - Setup
color 0B

echo.
echo ============================================
echo   ARYNOX AI HIRE - Project Setup
echo ============================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% found

:: Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% found

:: Create .env from template
if not exist ".env" (
    echo [SETUP] Creating .env from .env.example...
    copy .env.example .env >nul
    echo [OK] .env created. Please configure your API keys.
) else (
    echo [OK] .env already exists
)

:: Create frontend .env.local
if not exist "frontend\.env.local" (
    echo [SETUP] Creating frontend .env.local...
    (
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
        echo NEXT_PUBLIC_API_URL=http://localhost:8000
    ) > frontend\.env.local
    echo [OK] frontend\.env.local created
)

:: Install root dependencies
echo.
echo [SETUP] Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

:: Install frontend dependencies
echo.
echo [SETUP] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

:: Install server dependencies
echo.
echo [SETUP] Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install server dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

:: Install Python backend dependencies
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SETUP] Installing Python backend dependencies...
    cd server-python
    python -m pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo [WARN] Failed to install some Python dependencies. The backend may not start.
    )
    cd ..
)

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Next steps:
echo   1. Edit .env and add your API keys
echo   2. Run run.bat to start the application
echo.
echo Required keys (for full functionality):
echo   - GROQ_API_KEY (for AI interviews)
echo   - SUPABASE_URL + keys (for database)
echo   - GITHUB_CLIENT_ID + SECRET (for GitHub)
echo   - RAZORPAY keys (for billing)
echo.
echo Without API keys, the app runs in LOCAL MOCK MODE.
echo.
pause
