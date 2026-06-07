@echo off
echo ========================================
echo Building Query Genie Frontend
echo ========================================

cd ..\Query-frontend

echo.
echo [1/3] Installing frontend dependencies...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Building production frontend...
call npm run build

if errorlevel 1 (
    echo.
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Copying frontend build to Electron...
if exist "..\query-genie-msi\frontend" rmdir /s /q "..\query-genie-msi\frontend"
xcopy /Y /E /I "dist" "..\query-genie-msi\frontend"

echo.
echo ========================================
echo Frontend build complete!
echo ========================================
echo Output: query-genie-msi\frontend\
echo ========================================

cd ..\query-genie-msi
