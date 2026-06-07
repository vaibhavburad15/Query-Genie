@echo off
echo ========================================
echo Testing Query Genie Backend
echo ========================================
echo.

echo Checking if backend executable exists...
if exist "resources\backend\query-genie-backend.exe" (
    echo ✓ Backend executable found
) else (
    echo ✗ Backend executable NOT found
    echo Run build-backend.bat first
    pause
    exit /b 1
)

echo.
echo Starting backend server for testing...
echo (This will open in a new window - close it after testing)
echo.
start "Query Genie Backend Test" cmd /k "cd resources\backend && query-genie-backend.exe"

echo.
echo Waiting for backend to start (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo Testing backend health endpoint...
curl -s http://localhost:8000/health

if errorlevel 1 (
    echo.
    echo ✗ Backend health check failed
    echo Make sure the backend window shows no errors
) else (
    echo.
    echo ✓ Backend is responding!
)

echo.
echo ========================================
echo Test complete. Close the backend window when done.
echo ========================================
pause
