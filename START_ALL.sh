#!/bin/bash

# SonarGuard startup script for macOS/Linux

echo "==================================="
echo "SonarGuard - Startup Script"
echo "==================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python from https://www.python.org/"
    exit 1
fi

echo "[OK] Node.js and Python found"
echo ""

# Start backend in background
echo "[INFO] Starting FastAPI backend on http://localhost:8000..."
cd sonarguard-backend
python3 main.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend in new terminal (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "[INFO] Starting React frontend on http://localhost:3000..."
    cd ../sonarguard-frontend
    npm install
    open -a Terminal "$PWD"
    npm run dev
# Start frontend for Linux
else
    cd ../sonarguard-frontend
    npm install
    npm run dev &
fi

echo ""
echo "==================================="
echo "SonarGuard is starting..."
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "==================================="
echo ""

# Wait for both processes
wait
