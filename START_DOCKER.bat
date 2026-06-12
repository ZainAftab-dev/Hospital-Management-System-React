@echo off
title ZM HMS - Docker Launcher
cd /d "%~dp0"

echo ============================================================
echo   ZM Hospital Management System  -  Docker Launcher
echo ============================================================
echo.

:: ---- Check Docker is installed ----
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Docker is not installed or not running.
    echo  Please install Docker Desktop from:
    echo      https://www.docker.com/products/docker-desktop/
    echo  Start Docker Desktop, then run this file again.
    echo.
    pause
    exit /b 1
)

:: ---- Check Docker engine is running ----
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  Docker is installed but the engine is not running.
    echo  Please open Docker Desktop and wait until it says "Running",
    echo  then run this file again.
    echo.
    pause
    exit /b 1
)

echo  Building and starting all services (database, API, web)...
echo  The FIRST run downloads images and builds - it can take 5-10 minutes.
echo  Later runs start in seconds.
echo.

docker compose up --build -d
if %errorlevel% neq 0 (
    echo.
    echo  Something went wrong while starting the containers.
    echo  Run "docker compose logs" to see details.
    pause
    exit /b 1
)

echo.
echo  Containers are starting. The API seeds the database on first run,
echo  which takes about 60-90 seconds. Waiting before opening the browser...
timeout /t 75 /nobreak >nul

echo.
echo ============================================================
echo   System is starting up!
echo   Web App : http://localhost:3000
echo   API     : http://localhost:4000/api
echo.
echo   Login   : admin@zmhospital.com  /  Admin@12345
echo ============================================================
echo.
echo  Opening the app in your browser...
start http://localhost:3000

echo.
echo  Useful commands:
echo    View logs        : docker compose logs -f
echo    Stop everything  : STOP_DOCKER.bat   (or: docker compose down)
echo.
pause
