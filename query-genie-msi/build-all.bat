@echo off
echo ========================================
echo Query Genie MSI Builder
echo Complete Build Process
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if Python is installed
where python >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

:: Check if PyInstaller is installed
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo PyInstaller not found. Installing...
    pip install pyinstaller
)

echo ========================================
echo Step 1: Installing Electron Dependencies
echo ========================================
echo.
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install Electron dependencies!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Building Backend
echo ========================================
echo.
call build-backend.bat

if errorlevel 1 (
    echo.
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 3: Building Frontend
echo ========================================
echo.
call build-frontend.bat

if errorlevel 1 (
    echo.
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 4: Building Electron MSI
echo ========================================
echo.

:: Check if icons exist
if not exist "build\icon.ico" (
    echo.
    echo WARNING: build\icon.ico not found!
    echo Please add icon files to the build folder.
    echo See build\README.md for instructions.
    echo.
    echo Press any key to continue without icons, or Ctrl+C to cancel...
    pause >nul
)

call npm run build:win

if errorlevel 1 (
    echo.
    echo ERROR: Electron builder failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Your installers are ready in the 'dist' folder:
echo.
dir /b dist\*.msi 2>nul
dir /b dist\*.exe 2>nul
echo.
echo ========================================
echo.
echo Next Steps:
echo 1. Test the installer on a clean Windows machine
echo 2. Sign the MSI with a code signing certificate (optional)
echo 3. Distribute to users
echo.
echo ========================================
pause
