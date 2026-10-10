@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   CampusCue AI - Startup Launcher
echo ===================================================
echo.

REM 1. Verify Node.js installation
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH.
    echo Please install Node.js version 20 or higher from https://nodejs.org/
    pause
    exit /b 1
)

REM 2. Verify npm installation
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not found in PATH.
    pause
    exit /b 1
)

REM 3. Verify .env file configuration
if not exist ".env" (
    if exist ".env.example" (
        echo [WARN] .env not found. Creating template from .env.example...
        copy ".env.example" ".env" >nul
        echo [INFO] .env template created. Please configure your GEMINI_API_KEY_1..4 for live AI sessions.
    ) else (
        echo [ERROR] Neither .env nor .env.example was found.
        pause
        exit /b 1
    )
)

REM 4. Install all dependencies across workspaces
echo [INFO] Verifying and installing dependencies across workspaces...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install encountered an error.
    pause
    exit /b 1
)

REM 5. Run build verification across backend and frontend
echo.
echo [INFO] Running workspace build verification...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build verification failed. Please inspect build output above.
    pause
    exit /b 1
)

REM 6. Launch Backend and Frontend services
echo.
echo ===================================================
echo   Launching CampusCue AI Services:
echo   - Backend Server: http://localhost:3001
echo   - Frontend UI:     http://localhost:3000
echo ===================================================
echo.

start "CampusCue AI - Backend (Port 3001)" cmd /k "npm run dev:backend"
timeout /t 3 /nobreak >nul

start "CampusCue AI - Frontend (Port 3000)" cmd /k "npm run dev:frontend"
timeout /t 2 /nobreak >nul

echo [INFO] Opening application in default browser...
start http://localhost:3000

echo.
echo CampusCue AI is running!
echo Keep the backend and frontend terminal windows open while practicing.
echo.
pause
