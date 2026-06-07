# Query Genie MSI Installer - Complete Guide

**Version:** 1.0  
**Last Updated:** June 7, 2026  
**Application:** Query Genie - AI-Powered Database Query Tool

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Approach 1: Electron-Based MSI](#approach-1-electron-based-msi)
5. [Approach 2: WiX Toolset MSI](#approach-2-wix-toolset-msi)
6. [Future Updates & Maintenance](#future-updates--maintenance)
7. [Building the Installer](#building-the-installer)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Distribution](#distribution)

---

## Overview

### What This Installer Does

The Query Genie MSI installer packages your application for easy distribution to end users. When installed, users get:

✅ **Desktop Application** - Native Windows app experience  
✅ **Auto-Starting Backend** - Python FastAPI server starts automatically  
✅ **Local Database Support** - Connect to MySQL, PostgreSQL, Oracle, SQL Server, MongoDB, etc.  
✅ **Desktop & Start Menu Shortcuts** - Easy access  
✅ **Auto-Updates** - Seamless update mechanism for future versions  
✅ **Clean Uninstall** - Complete removal when needed  

### Application Components

```
Query Genie Installation
├── Frontend (React + Vite)
│   └── Serves the UI at localhost:5173 (dev) or embedded
├── Backend (FastAPI + Python)
│   └── REST API at localhost:8000
├── AI/LLM Layer (Dual-Engine Architecture)
│   ├── Primary: Ollama (Self-Hosted deepseek-coder)
│   │   └── External server at http://3.108.188.120:11434
│   └── Fallback: Groq Cloud API (llama-3.3-70b-versatile)
│       └── API Key embedded in backend
└── User Database (SQLite)
    └── Stores user preferences, history, favorites
```

---

## Architecture

### Current Application Flow

```
User Opens App
    ↓
Electron Window Launches (Method 1) OR Native Browser Opens (Method 2)
    ↓
Backend Server Auto-Starts (Python FastAPI on port 8000)
    ↓
Frontend Loads (React App connects to backend)
    ↓
User Connects to Their Database (MySQL, PostgreSQL, etc.)
    ↓
AI-Powered Queries Execute
```

### File Structure After Installation

#### Method 1: Electron-Based

```
C:\Program Files\Query Genie\
├── Query Genie.exe                    # Main Electron executable
├── resources\
│   ├── app.asar                       # Bundled frontend
│   └── backend\
│       ├── query-genie-backend.exe    # Python backend (PyInstaller)
│       ├── users.db                   # SQLite database
│       └── imported_sources\          # User uploaded files
├── locales\                           # Internationalization
├── swiftshader\                       # Graphics rendering
└── uninstall.exe                      # Uninstaller

Desktop:
└── Query Genie.lnk                    # Desktop shortcut

Start Menu:
└── Programs\Query Genie\
    ├── Query Genie.lnk
    └── Uninstall Query Genie.lnk
```

#### Method 2: WiX-Based

```
C:\Program Files\Query Genie\
├── backend\
│   ├── backend.exe                    # Python backend
│   ├── users.db
│   └── imported_sources\
├── frontend\
│   └── dist\                          # React built files
│       ├── index.html
│       ├── assets\
│       └── ...
├── launcher.exe                       # Startup launcher
└── config.json                        # Configuration

Desktop:
└── Query Genie.lnk

Start Menu:
└── Programs\Query Genie\
    ├── Query Genie.lnk
    └── Uninstall Query Genie.lnk
```

---

## Prerequisites

### Development Environment Setup

#### 1. Install Node.js
```bash
# Download from https://nodejs.org/ (LTS version recommended)
# Verify installation:
node --version  # Should be v18+ or v20+
npm --version   # Should be v9+ or v10+
```

#### 2. Install Python
```bash
# Download from https://www.python.org/ (3.10+ recommended)
# Verify installation:
python --version  # Should be 3.10 or higher
pip --version
```

#### 3. Install Build Tools

**For Electron Approach:**
```bash
npm install -g electron
npm install -g electron-builder
```

**For WiX Approach:**
```bash
# Download WiX Toolset from https://wixtoolset.org/
# Install WiX v3.11.2 or v4.x
# Verify installation:
candle.exe -?
light.exe -?
```

#### 4. Install PyInstaller
```bash
pip install pyinstaller
```

#### 5. Install Windows SDK (Optional but Recommended)
- Download from: https://developer.microsoft.com/windows/downloads/windows-sdk/
- Needed for code signing and advanced features

---

## Approach 1: Electron-Based MSI

### Advantages

✅ **Easiest to Maintain** - Single package, simpler updates  
✅ **Auto-Update Built-In** - electron-updater handles everything  
✅ **Cross-Platform Ready** - Can build for Mac/Linux later  
✅ **Better UX** - Native window, system tray, notifications  
✅ **Automatic Backend Management** - Starts/stops with app  

### Disadvantages

❌ **Larger File Size** - ~150-200 MB (includes Chromium)  
❌ **More Memory Usage** - Electron overhead (~100-150 MB RAM)  

### Setup Steps

#### Step 1: Create Electron Project Structure

```bash
# From project root
mkdir desktop-app
cd desktop-app
npm init -y
```

#### Step 2: Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder
npm install --save electron-squirrel-startup electron-updater
```

#### Step 3: Project Structure

```
desktop-app/
├── package.json              # Electron configuration
├── main.js                   # Main process (backend management)
├── preload.js                # Security bridge
├── renderer.js               # Renderer process logic
├── index.html                # Loading screen (optional)
├── build/                    # Build resources
│   ├── icon.ico              # Windows icon (256x256)
│   ├── icon.png              # macOS icon (512x512)
│   └── installerIcon.ico     # Installer icon
├── resources/                # Runtime resources
│   └── backend/              # Python backend (after PyInstaller build)
└── frontend/                 # Built React app (copy from Query-frontend/dist)
```

#### Step 4: Bundle Python Backend

Create `build-backend.bat`:

```batch
@echo off
echo Building Query Genie Backend...

cd ..\backend

:: Install dependencies
pip install -r requirements.txt

:: Build with PyInstaller
pyinstaller --clean ^
    --onefile ^
    --name query-genie-backend ^
    --add-data "sql_system_prompt.py;." ^
    --add-data "extended_models.py;." ^
    --add-data ".env;." ^
    --hidden-import "fastapi" ^
    --hidden-import "uvicorn" ^
    --hidden-import "sqlalchemy" ^
    --hidden-import "langchain" ^
    --hidden-import "langchain_groq" ^
    --hidden-import "mysql.connector" ^
    --hidden-import "psycopg2" ^
    --hidden-import "oracledb" ^
    --hidden-import "pyodbc" ^
    --hidden-import "pymongo" ^
    --hidden-import "redis" ^
    --collect-all "langchain" ^
    --collect-all "langchain_community" ^
    --collect-all "langchain_groq" ^
    --icon="..\desktop-app\build\icon.ico" ^
    backend.py

:: Copy to Electron resources
xcopy /Y /E "dist\query-genie-backend.exe" "..\desktop-app\resources\backend\"
xcopy /Y /E "users.db" "..\desktop-app\resources\backend\"
xcopy /Y /I "imported_sources" "..\desktop-app\resources\backend\imported_sources\"

echo Backend build complete!
cd ..\desktop-app
```

#### Step 5: Build Frontend

Create `build-frontend.bat`:

```batch
@echo off
echo Building Query Genie Frontend...

cd ..\Query-frontend

:: Install dependencies
call npm install

:: Build production version
call npm run build

:: Copy to Electron resources
xcopy /Y /E /I "dist" "..\desktop-app\frontend"

echo Frontend build complete!
cd ..\desktop-app
```

#### Step 6: Main Process Configuration (`main.js`)

See the generated `main.js` file in the desktop-app folder (I'll create this next).

#### Step 7: Package Configuration (`package.json`)

See the generated `package.json` file (I'll create this next).

#### Step 8: Build MSI

```bash
# Build for Windows
npm run build:win

# Output will be in: desktop-app/dist/Query Genie Setup.msi
```

---

## Approach 2: WiX Toolset MSI

### Advantages

✅ **Smaller File Size** - ~50-80 MB  
✅ **Lower Memory Usage** - No Electron overhead  
✅ **Traditional Windows Installer** - Familiar to enterprises  
✅ **Full Control** - Complete customization of install process  

### Disadvantages

❌ **More Complex Setup** - Requires XML configuration  
❌ **Manual Update System** - Need to implement custom updater  
❌ **Windows Only** - Can't easily port to other platforms  

### Setup Steps

#### Step 1: Install WiX Toolset

```bash
# Download from https://wixtoolset.org/
# Install WiX v3.11.2 (stable) or v4.x (latest)

# Verify installation
candle.exe -?
light.exe -?
```

#### Step 2: Create Installer Project Structure

```
wix-installer/
├── Product.wxs               # Main WiX configuration
├── UI.wxs                    # Custom UI dialogs
├── Features.wxs              # Feature selection
├── build.bat                 # Build script
├── resources/
│   ├── banner.bmp            # Top banner (493×58)
│   ├── dialog.bmp            # Background (493×312)
│   ├── icon.ico              # Application icon
│   └── license.rtf           # License agreement
├── backend/                  # Prepared Python backend
│   └── backend.exe
└── frontend/                 # Prepared React frontend
    └── dist/
```

#### Step 3: Build Components

Create `build-components.bat`:

```batch
@echo off
echo Building Query Genie Components for WiX...

:: Build Backend
cd ..\backend
pip install -r requirements.txt
pyinstaller --clean --onefile --name backend backend.py
xcopy /Y /E "dist\backend.exe" "..\wix-installer\backend\"
xcopy /Y "users.db" "..\wix-installer\backend\"

:: Build Frontend
cd ..\Query-frontend
call npm install
call npm run build
xcopy /Y /E /I "dist" "..\wix-installer\frontend\dist"

echo Components ready for WiX build!
cd ..\wix-installer
```

#### Step 4: WiX Configuration (`Product.wxs`)

See the generated `Product.wxs` file (I'll create this next).

#### Step 5: Build MSI

Create `build.bat`:

```batch
@echo off
echo Building Query Genie MSI with WiX...

:: Generate component definitions
heat.exe dir "frontend\dist" -cg FrontendComponents -gg -sfrag -dr INSTALLFOLDER -var var.FrontendSource -out Frontend.wxs
heat.exe dir "backend" -cg BackendComponents -gg -sfrag -dr INSTALLFOLDER -var var.BackendSource -out Backend.wxs

:: Compile WiX source files
candle.exe Product.wxs Frontend.wxs Backend.wxs -ext WixUIExtension -dFrontendSource="frontend\dist" -dBackendSource="backend"

:: Link and create MSI
light.exe Product.wixobj Frontend.wixobj Backend.wixobj -ext WixUIExtension -ext WixUtilExtension -out "Query Genie Setup.msi"

echo MSI created: Query Genie Setup.msi
```

---

## Future Updates & Maintenance

### Version Management Strategy

#### Semantic Versioning
```
MAJOR.MINOR.PATCH
  1  .  0  .  0

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes
```

#### Version Update Locations

**Electron Approach:**
1. `desktop-app/package.json` → `"version": "1.0.1"`
2. `desktop-app/main.js` → Update `autoUpdater` configuration

**WiX Approach:**
1. `wix-installer/Product.wxs` → `<Product Version="1.0.1">`
2. `wix-installer/Product.wxs` → Generate new `ProductCode` (keep `UpgradeCode` same!)

### Auto-Update Implementation (Electron)

#### Step 1: Set Up Update Server

**Option A: GitHub Releases (Free)**
```javascript
// In main.js
const { autoUpdater } = require('electron-updater');

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username',
  repo: 'query-genie'
});

autoUpdater.checkForUpdatesAndNotify();
```

**Option B: Custom Server**
```javascript
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://yourdomain.com/updates'
});
```

#### Step 2: Publish Update

```bash
# Build and publish
npm run build:win
npm run publish

# GitHub release created automatically with:
# - Query-Genie-Setup-1.0.1.msi
# - latest.yml (update metadata)
```

#### Step 3: Users Get Auto-Update

```
App Checks for Updates (on startup)
    ↓
Update Available? → Download in Background
    ↓
User Notified: "Update Ready - Restart to Install"
    ↓
App Restarts → Update Installs → Opens New Version
```

### Manual Update Process (WiX)

#### Step 1: Create Update Checker

Create `update-checker.js` in backend:

```javascript
const axios = require('axios');
const currentVersion = require('./package.json').version;

async function checkForUpdates() {
  const response = await axios.get('https://yourdomain.com/api/version');
  const latestVersion = response.data.version;
  
  if (latestVersion > currentVersion) {
    return {
      available: true,
      version: latestVersion,
      downloadUrl: response.data.downloadUrl
    };
  }
  return { available: false };
}
```

#### Step 2: Integrate in Backend

```python
# Add to backend.py
@app.get("/check-updates")
async def check_updates():
    # Call update checker
    # Return update info
    pass
```

#### Step 3: Frontend Notification

```typescript
// Add to frontend
useEffect(() => {
  checkForUpdates().then(update => {
    if (update.available) {
      showNotification({
        title: 'Update Available',
        message: `Version ${update.version} is ready`,
        action: 'Download'
      });
    }
  });
}, []);
```

### Maintaining Both Approaches

#### Directory Structure
```
Query-Genie-main/
├── backend/                   # Core backend code
├── Query-frontend/            # Core frontend code
├── desktop-app/              # Electron wrapper
│   ├── build-all.bat         # Master build script
│   └── package.json
├── wix-installer/            # WiX installer
│   └── build.bat
└── docs/
    └── MSI-INSTALLER-GUIDE.md
```

#### Master Build Script

Create `build-all-installers.bat` in project root:

```batch
@echo off
echo ====================================
echo Building Query Genie Installers
echo ====================================

set VERSION=1.0.0

:: Build Electron MSI
echo.
echo [1/2] Building Electron-based MSI...
cd desktop-app
call build-backend.bat
call build-frontend.bat
call npm run build:win
cd ..

:: Build WiX MSI
echo.
echo [2/2] Building WiX-based MSI...
cd wix-installer
call build-components.bat
call build.bat
cd ..

echo.
echo ====================================
echo Build Complete!
echo ====================================
echo Electron MSI: desktop-app\dist\Query Genie Setup %VERSION%.msi
echo WiX MSI: wix-installer\Query Genie Setup.msi
echo ====================================
```

---

## Building the Installer

### Quick Start Commands

#### Electron Approach
```bash
cd desktop-app
npm install                    # Install dependencies
npm run build:backend         # Bundle Python backend
npm run build:frontend        # Build React frontend
npm run build:win             # Create MSI installer
```

#### WiX Approach
```bash
cd wix-installer
build-components.bat          # Build backend + frontend
build.bat                     # Create MSI with WiX
```

#### Both at Once
```bash
# From project root
build-all-installers.bat
```

### Build Outputs

**Electron:**
- `desktop-app/dist/Query Genie Setup 1.0.0.msi` (MSI installer)
- `desktop-app/dist/Query Genie Setup 1.0.0.exe` (NSIS installer - optional)
- `desktop-app/dist/win-unpacked/` (Unpacked files for testing)

**WiX:**
- `wix-installer/Query Genie Setup.msi` (MSI installer)

---

## Testing Checklist

### Pre-Installation Testing

- [ ] MSI file is created without errors
- [ ] MSI file size is reasonable (150-200 MB for Electron, 50-80 MB for WiX)
- [ ] Code signing certificate applied (optional but recommended)

### Installation Testing

- [ ] MSI installs without errors
- [ ] Installation completes in reasonable time (2-5 minutes)
- [ ] Desktop shortcut created
- [ ] Start menu entries created
- [ ] Installation directory is correct
- [ ] All files are present in installation directory

### Application Testing

- [ ] Application launches from desktop shortcut
- [ ] Backend server starts automatically
- [ ] Frontend loads correctly
- [ ] Can connect to backend at http://localhost:8000
- [ ] Can connect to local MySQL database
- [ ] Can connect to local PostgreSQL database
- [ ] Can connect to SQL Server database
- [ ] AI query generation works
- [ ] User preferences are saved
- [ ] Query history is saved
- [ ] Favorites are saved

### Update Testing

- [ ] Update check works
- [ ] Update downloads correctly
- [ ] Update installs without data loss
- [ ] User preferences preserved after update
- [ ] Database connections preserved after update

### Uninstallation Testing

- [ ] Uninstaller runs from Start Menu
- [ ] All files removed from Program Files
- [ ] Shortcuts removed from Desktop and Start Menu
- [ ] Registry entries cleaned up
- [ ] User data preserved (or removed based on user choice)

---

## Troubleshooting

### Common Issues

#### Issue: "Python backend fails to start"

**Solution:**
- Check if port 8000 is available
- Verify `.env` file is included in the bundle
- Check PyInstaller hidden imports are complete
- Test backend.exe manually from command line

#### Issue: "Frontend can't connect to backend"

**Solution:**
- Verify backend is running (check Task Manager)
- Check firewall settings
- Ensure CORS is configured correctly in backend
- Check frontend API URL configuration

#### Issue: "MSI fails to install"

**Solution:**
- Run as Administrator
- Check Windows Installer service is running
- Verify no other version is already installed
- Check disk space (need 500 MB free)

#### Issue: "Auto-update not working"

**Solution:**
- Verify update server is accessible
- Check `latest.yml` file is published
- Ensure version number is incremented
- Check app has internet connection

#### Issue: "Database connection fails"

**Solution:**
- Verify database drivers are bundled in PyInstaller
- Check database service is running
- Verify connection string format
- Test connection outside the app

---

## Distribution

### Code Signing (Recommended)

#### Why Sign?
- Windows SmartScreen won't block your installer
- Users trust signed software more
- Appears as verified publisher

#### How to Sign

```bash
# Get code signing certificate from:
# - DigiCert
# - Sectigo
# - GoDaddy

# Sign MSI
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com "Query Genie Setup.msi"
```

### Distribution Channels

#### 1. Direct Download
```
Host on your website:
https://yoursite.com/downloads/query-genie-setup.msi

Provide SHA256 checksum for verification
```

#### 2. GitHub Releases
```
1. Create release on GitHub
2. Upload MSI file
3. Users download from Releases page
4. Auto-update works automatically
```

#### 3. Microsoft Store (Advanced)
```
1. Convert MSI to MSIX
2. Submit to Microsoft Partner Center
3. Pass certification
4. Available in Microsoft Store
```

#### 4. Chocolatey Package Manager
```
1. Create Chocolatey package
2. Submit to community repository
3. Users install via: choco install query-genie
```

### Download Page Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>Download Query Genie</title>
</head>
<body>
  <h1>Download Query Genie</h1>
  
  <h2>Windows Installer</h2>
  <a href="Query-Genie-Setup-1.0.0.msi">
    Download Query Genie 1.0.0 (MSI - 150 MB)
  </a>
  
  <h3>System Requirements</h3>
  <ul>
    <li>Windows 10 or later (64-bit)</li>
    <li>4 GB RAM minimum, 8 GB recommended</li>
    <li>500 MB free disk space</li>
    <li>Internet connection for AI features</li>
  </ul>
  
  <h3>Installation Instructions</h3>
  <ol>
    <li>Download the MSI file</li>
    <li>Run the installer (may need Administrator rights)</li>
    <li>Follow the installation wizard</li>
    <li>Launch Query Genie from Desktop or Start Menu</li>
  </ol>
</body>
</html>
```

---

## Security Considerations

### Backend Security

- [ ] API keys stored securely (not in code)
- [ ] Database connections use encrypted connections
- [ ] User passwords hashed with bcrypt
- [ ] Rate limiting enabled
- [ ] SQL injection protection enabled

### Installation Security

- [ ] MSI signed with valid certificate
- [ ] Checksum provided for download verification
- [ ] HTTPS used for distribution
- [ ] Auto-update uses HTTPS
- [ ] No hardcoded secrets in the installer

---

## Appendix

### Useful Commands

```bash
# Check MSI contents
msiexec /a "Query Genie Setup.msi" /qb TARGETDIR="C:\temp\extracted"

# Install MSI silently
msiexec /i "Query Genie Setup.msi" /quiet /norestart

# Uninstall MSI silently
msiexec /x "Query Genie Setup.msi" /quiet /norestart

# Check installed programs
wmic product where "name like '%Query Genie%'" get name,version

# Test PyInstaller bundle
cd backend\dist
backend.exe

# Test Electron app without building
cd desktop-app
npm start
```

### Resources

- **Electron Documentation**: https://www.electronjs.org/docs
- **electron-builder**: https://www.electron.build/
- **WiX Toolset**: https://wixtoolset.org/documentation/
- **PyInstaller**: https://pyinstaller.org/en/stable/
- **Code Signing**: https://docs.microsoft.com/en-us/windows/win32/seccrypto/signtool

---

## Change Log

### Version 1.0.0 (Initial Release)
- Electron-based MSI installer
- WiX-based MSI installer
- Auto-update support (Electron)
- Desktop and Start Menu shortcuts
- Auto-starting backend server
- Support for all major databases

---

**Document Version:** 1.0  
**Last Updated:** June 7, 2026  
**Maintained By:** Query Genie Development Team
