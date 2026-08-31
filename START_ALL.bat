@echo off
REM SonarGuard startup script for Windows

echo ===================================
echo SonarGuard - Startup Script
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    exit /b 1
)

echo [OK] Node.js and Python found
echo.

REM Create a new terminal for the backend
echo [INFO] Starting FastAPI backend on http://localhost:8000...
start cmd /k "cd sonarguard-backend && python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Create a new terminal for the frontend
echo [INFO] Starting React frontend on http://localhost:3000...
start cmd /k "cd sonarguard-frontend && npm install && npm run dev"

echo.
echo ===================================
echo SonarGuard is starting...
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ===================================
echo.
