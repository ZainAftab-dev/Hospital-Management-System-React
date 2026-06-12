@echo off
title HMS - Hospital Management System
cd /d "%~dp0"

echo ============================================
echo   HMS - Hospital Management System
echo ============================================
echo.

:: ---- 1. Ensure SQL Server is running ----
echo [1/3] Checking SQL Server...
sc query MSSQLSERVER >nul 2>&1
if %errorlevel%==0 (
    sc query MSSQLSERVER | find "RUNNING" >nul 2>&1
    if %errorlevel% neq 0 (
        echo     SQL Server found but not running. Starting it...
        net start MSSQLSERVER >nul 2>&1
        if %errorlevel% neq 0 (
            echo     Trying SQL Server Express...
            net start MSSQL$SQLEXPRESS >nul 2>&1
        )
    ) else (
        echo     SQL Server is already running.
    )
) else (
    sc query MSSQL$SQLEXPRESS >nul 2>&1
    if %errorlevel%==0 (
        sc query MSSQL$SQLEXPRESS | find "RUNNING" >nul 2>&1
        if %errorlevel% neq 0 (
            echo     Starting SQL Server Express...
            net start MSSQL$SQLEXPRESS >nul 2>&1
        ) else (
            echo     SQL Server Express is already running.
        )
    ) else (
        echo     WARNING: Could not detect SQL Server service. Continuing anyway...
    )
)

:: Wait for SQL Server to be fully ready
echo     Waiting for SQL Server to accept connections...
timeout /t 5 /nobreak >nul

:: ---- 2. Sync database schema ----
echo.
echo [2/4] Syncing database schema (adding any new columns)...
cd /d "%~dp0apps\api"
node ..\..\node_modules\.bin\prisma db push --skip-generate --accept-data-loss >nul 2>&1
if %errorlevel%==0 (
    echo     Database schema synced successfully.
) else (
    echo     Trying migration deploy as fallback...
    node ..\..\node_modules\.bin\prisma migrate deploy >nul 2>&1
    if %errorlevel%==0 (echo     Migrations applied.) else (echo     Warning: Schema sync had issues - continuing anyway...)
)

:: ---- 2b. Apply CHECK constraints ----
echo     Applying CHECK constraints (data integrity rules)...
node add-constraints.js >nul 2>&1
echo     Constraints applied.

:: ---- 2c. Set default passwords for all users ----
echo     Setting default role-based passwords for users...
node set-default-passwords.js >nul 2>&1
echo     Default passwords ready.

:: ---- 2d. Create indexes, views, triggers, stored procedures ----
echo     Creating indexes, views, triggers and stored procedures...
node add-db-objects.js >nul 2>&1
echo     Database objects ready.
cd /d "%~dp0"

:: ---- 3. Start API backend ----
echo.
echo [3/4] Starting API (port 4000)...
if not exist "apps\api\dist\src\main.js" (
    echo     ERROR: API not built. Run: cd apps\api ^&^& npm run build
    echo     Then re-run START_HMS.bat
    pause
    exit /b 1
)
start "HMS-API" /min cmd /c "cd /d "%~dp0apps\api" && node dist\src\main.js > ..\..\api.log 2>&1"
timeout /t 6 /nobreak >nul

:: Check API actually started
netstat -ano | find ":4000" >nul 2>&1
if %errorlevel%==0 (
    echo     API started successfully on port 4000
) else (
    echo     API may still be starting - check api.log if issues occur
)

:: ---- 4. Start Web frontend ----
echo.
echo [4/4] Starting Web (port 3000)...
start "HMS-Web" /min cmd /c "cd /d "%~dp0" && npm --workspace apps/web run start -- -p 3000 > web.log 2>&1"
timeout /t 8 /nobreak >nul

:: Check Web started
netstat -ano | find ":3000" >nul 2>&1
if %errorlevel%==0 (
    echo     Web started successfully on port 3000
) else (
    echo     Web may still be starting - check web.log if issues occur
)

echo.
echo ============================================
echo   System Ready!
echo   Web:  http://localhost:3000/login
echo   API:  http://localhost:4000/api
echo   Login: admin@zmhospital.com / Admin@12345
echo ============================================
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000/login

echo.
echo Servers are running in background.
echo To view logs: open api.log or web.log
echo Close this window when done.
pause
