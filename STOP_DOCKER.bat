@echo off
title ZM HMS - Stop Docker
cd /d "%~dp0"

echo ============================================================
echo   Stopping ZM Hospital Management System containers...
echo ============================================================
echo.

docker compose down

echo.
echo  All containers stopped.
echo  (Your data is preserved in the 'mssql-data' volume and will
echo   still be there next time you run START_DOCKER.bat.)
echo.
echo  To also DELETE all stored data, run:
echo      docker compose down -v
echo.
pause
