# Query Genie - Complete Installation & Build Guide

## 📋 Table of Contents

1. [Prerequisites Installation](#prerequisites-installation)
2. [Preparing Icons](#preparing-icons)
3. [Building the MSI](#building-the-msi)
4. [Testing the Installer](#testing-the-installer)
5. [Troubleshooting](#troubleshooting)
6. [Distribution](#distribution)

---

## 1. Prerequisites Installation

### Step 1: Install Node.js

1. Download Node.js LTS from: https://nodejs.org/
2. Run the installer
3. Verify installation:
   ```batch
   node --version
   npm --version
   ```
   Should show v18.x or higher

### Step 2: Install Python

1. Download Python 3.10+ from: https://www.python.org/
2. **Important:** Check "Add Python to PATH" during installation
3. Verify installation:
   ```batch
   python --version
   pip --version
   ```

### Step 3: Install PyInstaller

```batch
pip install pyinstaller
```

### Step 4: Install Build Tools (Optional but Recommended)

```batch
npm install -g windows-build-tools
```

---

## 2. Preparing Icons

### Quick Method: Using Query Genie Logo

1. Navigate to the logo:
   ```batch
   cd ..\Query-frontend\src\assets
   ```

2. Copy the logo to build folder:
   ```batch
   copy query-genie-logo.png ..\..\..\..\query-genie-msi\build\logo.png
   ```

3. Convert PNG to ICO:
   - Visit: https://convertio.co/png-ico/
   - Upload `logo.png`
   - Download as `icon.ico`
   - Make a copy and rename to `installerIcon.ico`

4. Place both files in the `build/` folder:
   ```
   query-genie-msi/build/
   ├── icon.ico
   └── installerIcon.ico
   ```

### Professional Method: Create Custom Icons

Use tools like:
- **Adobe Photoshop** (File → Export → ICO)
- **GIMP** (Export as .ico)
- **IcoFX** (Windows icon editor)

Requirements:
- Size: 256x256 pixels
- Format: .ico with multiple resolutions (16, 32, 48, 256)
- Transparency: Supported

---

## 3. Building the MSI

### Method 1: One-Click Build (Recommended)

```batch
# Navigate to the query-genie-msi folder
cd query-genie-msi

# Run the master build script
build-all.bat
```

This script will:
1. ✅ Install Electron dependencies
2. ✅ Build Python backend with PyInstaller
3. ✅ Build React frontend with Vite
4. ✅ Create MSI installer with electron-builder

**Time:** 10-15 minutes (depending on system)

### Method 2: Step-by-Step Build

If you want more control or if the automatic build fails:

```batch
# 1. Install Electron dependencies
npm install

# 2. Build backend
build-backend.bat

# 3. Build frontend
build-frontend.bat

# 4. Create MSI
npm run build:win
```

### Build Output

After successful build, you'll find:

```
query-genie-msi/dist/
├── Query Genie Setup 1.0.0.msi     # MSI Installer (150-200 MB)
├── Query Genie Setup 1.0.0.exe     # NSIS Installer (alternative)
└── win-unpacked/                    # Unpacked files (for testing)
```

---

## 4. Testing the Installer

### Pre-Distribution Testing Checklist

#### Test 1: Installation

1. **Locate the installer:**
   ```
   query-genie-msi\dist\Query Genie Setup 1.0.0.msi
   ```

2. **Run the installer:**
   - Double-click the MSI file
   - Choose installation location (default: `C:\Program Files\Query Genie`)
   - Complete installation

3. **Verify shortcuts created:**
   - Desktop: `Query Genie.lnk`
   - Start Menu: `Programs\Query Genie\Query Genie.lnk`

#### Test 2: Application Launch

1. **Launch from Desktop shortcut**
2. **Wait for backend to start** (3-5 seconds)
3. **Frontend should load** showing the Query Genie interface

#### Test 3: Functionality

- [ ] Backend server is running (check Task Manager)
- [ ] Can access UI
- [ ] Can connect to MySQL database
- [ ] Can connect to PostgreSQL database
- [ ] Can connect to SQL Server database
- [ ] AI query generation works
- [ ] Can save queries to favorites
- [ ] Query history is saved
- [ ] User preferences persist after restart

#### Test 4: System Tray

- [ ] Tray icon appears in system tray
- [ ] Right-click shows menu
- [ ] "Open Query Genie" works
- [ ] "Check for Updates" works
- [ ] "Quit" closes app completely

#### Test 5: Uninstallation

1. **Uninstall from Start Menu:**
   - Start → Query Genie → Uninstall Query Genie

2. **Or from Control Panel:**
   - Control Panel → Programs → Uninstall a program
   - Find "Query Genie" → Uninstall

3. **Verify cleanup:**
   - [ ] Files removed from `C:\Program Files\Query Genie`
   - [ ] Desktop shortcut removed
   - [ ] Start Menu entries removed
   - [ ] User data location (optional preservation)

### Testing on Clean Machine

**Highly Recommended:** Test on a fresh Windows installation

1. **Create a Windows VM:**
   - Use VirtualBox, VMware, or Hyper-V
   - Install Windows 10/11 (clean installation)
   - No development tools installed

2. **Copy the MSI to the VM**

3. **Install and test:**
   - Install Query Genie
   - Test all functionality
   - Check for missing dependencies
   - Verify no errors occur

---

## 5. Troubleshooting

### Issue: "Python not found" during build

**Cause:** Python not in PATH

**Solution:**
```batch
# Add Python to PATH manually
setx PATH "%PATH%;C:\Python310;C:\Python310\Scripts"
```
Then restart command prompt.

### Issue: "PyInstaller not found"

**Solution:**
```batch
pip install --upgrade pyinstaller
```

### Issue: "npm install fails"

**Solution:**
```batch
# Clear npm cache
npm cache clean --force

# Delete node_modules
rmdir /s /q node_modules

# Reinstall
npm install
```

### Issue: "Backend fails to start after installation"

**Cause:** Missing dependencies or port conflict

**Solution:**
1. Check if port 8000 is available
2. Verify .env file exists in installation
3. Check backend logs:
   ```batch
   # Navigate to installation directory
   cd "C:\Program Files\Query Genie\resources\backend"
   
   # Run backend manually to see errors
   query-genie-backend.exe
   ```

### Issue: "Frontend can't connect to backend"

**Cause:** Backend not started or CORS issue

**Solution:**
1. Verify backend is running:
   ```batch
   curl http://localhost:8000/health
   ```
2. Check Windows Firewall settings
3. Check backend.py CORS configuration

### Issue: "MSI build fails - icon not found"

**Cause:** Missing icon files

**Solution:**
1. Verify `build/icon.ico` exists
2. Verify `build/installerIcon.ico` exists
3. Or comment out icon references in package.json temporarily

### Issue: "Installed app shows 'Windows protected your PC'"

**Cause:** Unsigned installer

**Solution:**
- Click "More info" → "Run anyway"
- Or sign the MSI with a code signing certificate

### Issue: "Auto-update not working"

**Cause:** GitHub configuration missing

**Solution:**
1. Update `package.json` publish settings:
   ```json
   "publish": {
     "provider": "github",
     "owner": "your-github-username",
     "repo": "query-genie"
   }
   ```
2. Create GitHub personal access token
3. Set environment variable:
   ```batch
   setx GH_TOKEN "your-github-token"
   ```

---

## 6. Distribution

### Option 1: Direct Download

1. **Host on your website:**
   ```
   https://yoursite.com/downloads/query-genie-setup.msi
   ```

2. **Provide checksum:**
   ```batch
   certutil -hashfile "Query Genie Setup 1.0.0.msi" SHA256
   ```

3. **Create download page:** (see example below)

### Option 2: GitHub Releases

1. **Create a new release on GitHub:**
   - Go to your repository
   - Releases → Draft a new release
   - Tag: `v1.0.0`
   - Title: `Query Genie v1.0.0`

2. **Upload the MSI file**

3. **Add release notes:**
   ```markdown
   ## What's New
   - Initial release
   - AI-powered query generation
   - Support for MySQL, PostgreSQL, SQL Server
   - Auto-update support
   
   ## Installation
   Download and run the MSI installer below.
   
   ## System Requirements
   - Windows 10 or later (64-bit)
   - 4 GB RAM (8 GB recommended)
   - 500 MB free disk space
   ```

### Option 3: Code Signing (Recommended for Production)

**Why sign?**
- No SmartScreen warnings
- Users trust signed software
- Appears as verified publisher

**How to sign:**

1. **Get a code signing certificate:**
   - DigiCert: ~$200/year
   - Sectigo: ~$150/year
   - GoDaddy: ~$100/year

2. **Sign the MSI:**
   ```batch
   signtool sign ^
     /f "certificate.pfx" ^
     /p "password" ^
     /t http://timestamp.digicert.com ^
     /d "Query Genie" ^
     /du "https://yourwebsite.com" ^
     "dist\Query Genie Setup 1.0.0.msi"
   ```

3. **Verify signature:**
   ```batch
   signtool verify /pa "dist\Query Genie Setup 1.0.0.msi"
   ```

### Download Page Template

Create `download.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download Query Genie</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
        }
        .download-btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            margin: 20px 0;
        }
        .download-btn:hover {
            background: #5568d3;
        }
        .requirements {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>🧞 Download Query Genie</h1>
    <p>AI-Powered Database Query Tool for Windows</p>

    <a href="Query-Genie-Setup-1.0.0.msi" class="download-btn">
        ⬇ Download for Windows (150 MB)
    </a>

    <div class="requirements">
        <h3>System Requirements</h3>
        <ul>
            <li>Windows 10 or later (64-bit)</li>
            <li>4 GB RAM minimum, 8 GB recommended</li>
            <li>500 MB free disk space</li>
            <li>Internet connection for AI features</li>
        </ul>
    </div>

    <h3>Installation Instructions</h3>
    <ol>
        <li>Download the MSI installer</li>
        <li>Run the installer (Administrator rights may be required)</li>
        <li>Follow the installation wizard</li>
        <li>Launch Query Genie from Desktop or Start Menu</li>
    </ol>

    <h3>What's Included</h3>
    <ul>
        <li>✅ Desktop application with native Windows experience</li>
        <li>✅ Auto-starting backend server</li>
        <li>✅ Support for MySQL, PostgreSQL, SQL Server, MongoDB, Oracle</li>
        <li>✅ AI-powered query generation</li>
        <li>✅ Automatic updates</li>
    </ul>

    <h3>Checksum (SHA256)</h3>
    <code style="background: #f0f0f0; padding: 10px; display: block;">
        <!-- Add your SHA256 checksum here -->
        abc123def456... (run certutil to get this)
    </code>
</body>
</html>
```

---

## 7. Maintenance & Updates

### Releasing a New Version

1. **Update version number:**
   ```json
   // package.json
   {
     "version": "1.0.1"
   }
   ```

2. **Build new installer:**
   ```batch
   build-all.bat
   ```

3. **Publish to GitHub:**
   ```batch
   npm run publish
   ```

4. **Users get notified automatically:**
   - App checks for updates on startup
   - Downloads update in background
   - Prompts user to restart and install

### Version Numbering

Follow semantic versioning:
```
MAJOR.MINOR.PATCH
  1  .  0  .  1

MAJOR: Breaking changes (e.g., 2.0.0)
MINOR: New features (e.g., 1.1.0)
PATCH: Bug fixes (e.g., 1.0.1)
```

---

## 🎉 Success!

You now have a complete Windows MSI installer for Query Genie!

**Next Steps:**
1. Test thoroughly on multiple machines
2. Consider code signing for production
3. Set up auto-update infrastructure
4. Distribute to users
5. Collect feedback and iterate

---

## 📞 Support

For issues or questions:
- Check the main README.md
- Review troubleshooting section
- Test on clean Windows installation
- Verify all prerequisites are installed

---

**Document Version:** 1.0  
**Last Updated:** June 7, 2026  
**Maintained By:** Query Genie Team
