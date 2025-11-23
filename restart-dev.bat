@echo off
REM Restart Development Environment Script (Windows)
REM This script cleanly kills all Node processes and restarts the dev servers

echo ==================================================
echo 🔄 Restarting Together Forward Development Servers
echo ==================================================
echo.

REM Step 1: Kill all Node.js processes
echo 🛑 Step 1: Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✅ All Node.js processes terminated
) else (
    echo    ℹ️  No Node.js processes were running
)

REM Wait for processes to fully terminate
timeout /t 2 /nobreak >nul

echo.

REM Step 2: Clear Node module cache
echo 📦 Step 2: Clearing Node module cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache >nul 2>&1
    echo    ✅ Cache cleared
) else (
    echo    ℹ️  No cache to clear
)

echo.

REM Step 3: Start backend server
echo 🚀 Step 3: Starting backend server (port 3001)...
start "Together Forward Backend" /min cmd /c "node server.js > backend.log 2>&1"
timeout /t 3 /nobreak >nul
echo    ✅ Backend server started
echo    📋 Backend logs: type backend.log

echo.

REM Step 4: Start frontend server
echo 🎨 Step 4: Starting frontend server (port 3000)...
start "Together Forward Frontend" /min cmd /c "npm start > frontend.log 2>&1"
timeout /t 5 /nobreak >nul
echo    ✅ Frontend server started
echo    📋 Frontend logs: type frontend.log

echo.
echo ==================================================
echo ✅ Development environment restarted successfully!
echo ==================================================
echo.
echo 📊 Server Status:
echo    Backend:  http://localhost:3001
echo    Frontend: http://localhost:3000
echo.
echo 📋 View logs:
echo    Backend:  type backend.log
echo    Frontend: type frontend.log
echo.
echo 🛑 To stop servers:
echo    Close the "Together Forward Backend" and "Together Forward Frontend" windows
echo    Or run: taskkill /F /IM node.exe
echo.
echo 🎯 Next steps:
echo    1. Open http://localhost:3000 in your browser
echo    2. Hard refresh (Ctrl+Shift+R) to clear browser cache
echo    3. Clear old test data from Supabase
echo    4. Start fresh Luna conversation
echo.

pause
