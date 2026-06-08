@echo off
echo ========================================
echo Building Query Genie Backend
echo ========================================

cd ..\backend

echo.
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/4] Building backend with PyInstaller...
pyinstaller --clean --noconfirm query-genie-backend.spec

if errorlevel 1 (
    echo.
    echo ERROR: PyInstaller build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Copying backend executable to Electron resources...
if not exist "..\query-genie-msi\resources\backend" mkdir "..\query-genie-msi\resources\backend"
copy /Y "dist\query-genie-backend.exe" "..\query-genie-msi\resources\backend\"

echo.
echo [4/4] Copying database and additional files...
copy /Y "users.db" "..\query-genie-msi\resources\backend\" 2>nul || echo users.db not found, will be created on first run
copy /Y ".env" "..\query-genie-msi\resources\backend\"

if not exist "..\query-genie-msi\resources\backend\imported_sources" mkdir "..\query-genie-msi\resources\backend\imported_sources"

echo.
echo ========================================
echo Backend build complete!
echo ========================================
echo Output: query-genie-msi\resources\backend\query-genie-backend.exe
echo ========================================

cd ..\query-genie-msi
