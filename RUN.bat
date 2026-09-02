@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    SonarGuard - Start Application
echo ========================================
echo.

REM Check if both directories exist
if not exist "sonarguard-backend" (
    echo ERROR: sonarguard-backend directory not found!
    pause
    exit /b 1
)

if not exist "sonarguard-frontend" (
    echo ERROR: sonarguard-frontend directory not found!
    pause
    exit /b 1
)

echo Starting backend server on port 8000...
start "SonarGuard Backend" cmd /k "cd sonarguard-backend && python -m uvicorn main:app --reload --port 8000"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak

echo Starting frontend dev server on port 5173...
start "SonarGuard Frontend" cmd /k "cd sonarguard-frontend && npm run dev"

echo.
echo ========================================
echo    Application Starting
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak

REM Open browser
start http://localhost:5173

echo.
echo Both servers are running!
echo Keep these windows open to use the application.
echo.
pause
