# Query Genie MSI Installer

This folder contains everything needed to build the Windows MSI installer for Query Genie.

## 📁 Folder Structure

```
query-genie-msi/
├── build/                      # Build resources (icons)
│   ├── icon.ico               # Application icon (REQUIRED)
│   ├── installerIcon.ico      # Installer icon (REQUIRED)
│   └── README.md              # Icon requirements guide
├── resources/                  # Runtime resources
│   └── backend/               # Python backend (generated)
│       ├── query-genie-backend.exe
│       ├── users.db
│       ├── .env
│       └── imported_sources/
├── frontend/                   # Built React app (generated)
│   └── (built files from Query-frontend/dist)
├── dist/                       # Output installers (generated)
│   ├── Query Genie Setup 1.0.0.msi
│   └── Query Genie Setup 1.0.0.exe
├── main.js                     # Electron main process
├── preload.js                  # Electron preload script
├── package.json                # Electron configuration
├── build-backend.bat           # Backend build script
├── build-frontend.bat          # Frontend build script
├── build-all.bat               # Master build script
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/

2. **Python** (3.10 or higher)
   - Download: https://www.python.org/

3. **PyInstaller**
   ```batch
   pip install pyinstaller
   ```

4. **Icons** (Required)
   - Add `icon.ico` and `installerIcon.ico` to the `build/` folder
   - See `build/README.md` for specifications

### Build Instructions

#### Option 1: Build Everything at Once (Recommended)

```batch
# From the query-genie-msi folder
build-all.bat
```

This will:
1. Install Electron dependencies
2. Build the Python backend
3. Build the React frontend
4. Create the MSI installer

#### Option 2: Build Step by Step

```batch
# Install dependencies
npm install

# Build backend
build-backend.bat

# Build frontend
build-frontend.bat

# Create MSI
npm run build:win
```

### Output

Your installer will be created in the `dist/` folder:
- `Query Genie Setup 1.0.0.msi` - MSI installer
- `Query Genie Setup 1.0.0.exe` - NSIS installer (alternative)

## 🧪 Testing

### Test Before Distribution

1. **Test installation on a clean Windows machine**
   - Fresh Windows 10/11 VM recommended
   - No development tools installed

2. **Test the installed application**
   - Launch from Desktop shortcut
   - Launch from Start Menu
   - Verify backend starts automatically
   - Test database connections
   - Test AI query generation

3. **Test uninstallation**
   - Uninstall from Start Menu
   - Verify all files are removed
   - Verify shortcuts are removed

### Development Testing

To test without building the MSI:

```batch
npm start
```

This runs the app in development mode.

## 🔧 Configuration

### Changing Version Number

Edit `package.json`:

```json
{
  "version": "1.0.1"
}
```

### Changing App Name or Publisher

Edit `package.json` → `build` section:

```json
{
  "build": {
    "appId": "com.yourcompany.querygenie",
    "productName": "Query Genie",
    "copyright": "Copyright © 2026 Your Company"
  }
}
```

### Auto-Update Configuration

Edit `package.json` → `build` → `publish`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "query-genie"
    }
  }
}
```

## 📦 Distribution

### Code Signing (Recommended)

For production, sign your installer:

```batch
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com "dist\Query Genie Setup 1.0.0.msi"
```

Benefits:
- No Windows SmartScreen warning
- Users trust signed software
- Appears as verified publisher

### Distribution Methods

1. **Direct Download**
   - Host on your website
   - Provide SHA256 checksum

2. **GitHub Releases**
   - Create a release on GitHub
   - Upload the MSI file
   - Auto-update works automatically

3. **Microsoft Store** (Advanced)
   - Convert MSI to MSIX
   - Submit to Partner Center

## 🛠️ Troubleshooting

### Backend build fails

**Solution:**
- Ensure Python 3.10+ is installed
- Run: `pip install -r ..\backend\requirements.txt`
- Check for missing dependencies

### Frontend build fails

**Solution:**
- Ensure Node.js v18+ is installed
- Delete `Query-frontend\node_modules` and run `npm install`
- Check for syntax errors in frontend code

### MSI build fails - "icon not found"

**Solution:**
- Add `icon.ico` and `installerIcon.ico` to `build/` folder
- Or continue without icons (not recommended)

### Installed app won't start

**Solution:**
- Check if port 8000 is available
- Check backend logs in Task Manager
- Verify `.env` file is included
- Test backend executable manually

### Backend can't find database drivers

**Solution:**
- Add missing drivers to PyInstaller hidden imports
- Edit `build-backend.bat` and add:
  ```batch
  --hidden-import "your_driver_name"
  ```

## 📝 Scripts Reference

### npm Scripts

```batch
npm start              # Run in development mode
npm run build:backend  # Build backend only
npm run build:frontend # Build frontend only
npm run build:win      # Create MSI installer
npm run build:all      # Build everything
npm run publish        # Build and publish to GitHub
```

### Build Scripts

```batch
build-all.bat          # Complete build process
build-backend.bat      # Build Python backend with PyInstaller
build-frontend.bat     # Build React frontend with Vite
```

## 🔄 Updates

### For Future Versions

1. Update version in `package.json`
2. Build new installer: `build-all.bat`
3. Publish to GitHub Releases
4. Users will get auto-update notification

### Manual Update

Users can also:
1. Download new MSI
2. Run installer (will upgrade existing installation)
3. All data preserved

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [PyInstaller Manual](https://pyinstaller.org/en/stable/)
- [Auto-Update Guide](https://www.electron.build/auto-update)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review build logs for errors
3. Test components individually
4. Check if all prerequisites are installed

## 📄 License

See LICENSE file in the root directory.

---

**Last Updated:** June 7, 2026
**Version:** 1.0.0
