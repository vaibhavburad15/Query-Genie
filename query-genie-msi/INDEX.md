# Query Genie MSI Installer - Documentation Index

Welcome to the Query Genie MSI installer project! This folder contains everything you need to create a professional Windows installer for Query Genie.

## 📚 Documentation

### Quick Start
- **[QUICK-START.md](QUICK-START.md)** - Get building in 5 minutes
  - Prerequisites installation
  - Simple build commands
  - Common issues and fixes

### Complete Guides
- **[README.md](README.md)** - Main project documentation
  - Folder structure
  - Build instructions
  - Testing guidelines
  - Distribution methods

- **[INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)** - Comprehensive installation guide
  - Step-by-step prerequisites
  - Icon preparation
  - Building process
  - Testing checklist
  - Troubleshooting

- **[CONFIGURATION-GUIDE.md](CONFIGURATION-GUIDE.md)** - Customization guide
  - package.json configuration
  - Build options
  - Auto-update setup
  - Advanced features

### Reference
- **[build/README.md](build/README.md)** - Icon requirements
- **[../docs/MSI-INSTALLER-GUIDE.md](../docs/MSI-INSTALLER-GUIDE.md)** - Original comprehensive guide

## 🚀 Quick Commands

### Development
```batch
npm start                 # Run app in development mode
test-backend.bat          # Test backend executable
```

### Building
```batch
build-all.bat            # Build everything (recommended)
build-backend.bat        # Build backend only
build-frontend.bat       # Build frontend only
npm run build:win        # Create MSI installer
```

### Testing
```batch
npm run build:dir        # Build without packaging (for testing)
```

## 📁 Project Structure

```
query-genie-msi/
├── 📄 main.js                      # Electron main process
├── 📄 preload.js                   # Electron preload script
├── 📄 package.json                 # Project configuration
│
├── 📁 build/                       # Build resources
│   ├── icon.ico                   # App icon (REQUIRED)
│   └── installerIcon.ico          # Installer icon (REQUIRED)
│
├── 📁 resources/                   # Runtime resources (generated)
│   └── backend/                   # Python backend bundle
│
├── 📁 frontend/                    # Built React app (generated)
│
├── 📁 dist/                        # Output installers (generated)
│   ├── Query Genie Setup.msi     # MSI installer
│   └── Query Genie Setup.exe     # NSIS installer
│
├── 🔨 build-all.bat               # Master build script
├── 🔨 build-backend.bat           # Backend build script
├── 🔨 build-frontend.bat          # Frontend build script
├── 🔨 test-backend.bat            # Backend test script
│
└── 📚 Documentation
    ├── INDEX.md                   # This file
    ├── README.md                  # Main documentation
    ├── QUICK-START.md             # Quick start guide
    ├── INSTALLATION-GUIDE.md      # Complete installation guide
    └── CONFIGURATION-GUIDE.md     # Configuration reference
```

## 🎯 Workflow

### First Time Setup

1. **Read the Quick Start**
   ```
   Open: QUICK-START.md
   Time: 5 minutes
   ```

2. **Install Prerequisites**
   - Node.js (v18+)
   - Python (3.10+)
   - PyInstaller

3. **Add Icons**
   - Place `icon.ico` in `build/` folder
   - Place `installerIcon.ico` in `build/` folder
   - See `build/README.md` for details

4. **Build**
   ```batch
   build-all.bat
   ```

5. **Test**
   - Install the generated MSI
   - Test all functionality
   - Test on clean Windows machine

### Regular Development

```batch
# Make changes to backend/frontend in main project folders

# Rebuild MSI
cd query-genie-msi
build-all.bat

# Test new version
```

### Releasing New Version

1. Update version in `package.json`
2. Build: `build-all.bat`
3. Test thoroughly
4. Sign MSI (optional but recommended)
5. Publish to GitHub Releases
6. Users get auto-update notification

## 🆘 Getting Help

### Common Issues

| Issue | Solution | Documentation |
|-------|----------|---------------|
| Python not found | Add to PATH | [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md#issue-python-not-found-during-build) |
| Icons not found | Add to build/ folder | [build/README.md](build/README.md) |
| Backend won't start | Port conflict | [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md#issue-backend-fails-to-start-after-installation) |
| Build fails | Check prerequisites | [QUICK-START.md](QUICK-START.md#-common-issues) |
| MSI won't install | Run as Admin | [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md#test-1-installation) |

### Documentation Paths

**I want to...**

- **Build quickly** → Read [QUICK-START.md](QUICK-START.md)
- **Understand everything** → Read [README.md](README.md)
- **Install step-by-step** → Read [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)
- **Customize the build** → Read [CONFIGURATION-GUIDE.md](CONFIGURATION-GUIDE.md)
- **Learn about icons** → Read [build/README.md](build/README.md)
- **See the theory** → Read [../docs/MSI-INSTALLER-GUIDE.md](../docs/MSI-INSTALLER-GUIDE.md)

## 🔗 Related Files

### In Main Project

```
Query-Genie-main/
├── backend/                        # Source backend code
│   ├── backend.py                 # Main backend file
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Environment variables
│
├── Query-frontend/                # Source frontend code
│   ├── src/                       # React source
│   ├── package.json               # Frontend dependencies
│   └── vite.config.ts             # Build configuration
│
├── query-genie-msi/               # THIS FOLDER (installer project)
│
└── docs/
    └── MSI-INSTALLER-GUIDE.md     # Original comprehensive guide
```

## 📊 Build Time Estimates

| Task | Time | Notes |
|------|------|-------|
| Prerequisites installation | 10-15 min | One-time setup |
| Icon preparation | 2-5 min | One-time or per rebrand |
| Backend build | 2-3 min | PyInstaller compilation |
| Frontend build | 1-2 min | Vite production build |
| MSI creation | 3-5 min | electron-builder packaging |
| **Total (first time)** | **20-30 min** | Including prerequisites |
| **Total (subsequent)** | **6-10 min** | Just building |

## ✅ Pre-Build Checklist

Before running `build-all.bat`:

- [ ] Node.js installed (v18+)
- [ ] Python installed (3.10+)
- [ ] PyInstaller installed (`pip install pyinstaller`)
- [ ] Icons placed in `build/` folder
- [ ] Backend code is working
- [ ] Frontend code is working
- [ ] Version number updated in `package.json`
- [ ] All dependencies installed in main project

## 📦 Output Checklist

After successful build:

- [ ] MSI file created in `dist/` folder
- [ ] File size is reasonable (150-200 MB)
- [ ] MSI installs without errors
- [ ] App launches after installation
- [ ] Backend starts automatically
- [ ] Frontend connects to backend
- [ ] All features work correctly
- [ ] Uninstaller works properly

## 🎓 Learning Path

### Beginner
1. Read [QUICK-START.md](QUICK-START.md)
2. Follow the 5-step guide
3. Build your first MSI
4. Test on your machine

### Intermediate
1. Read [README.md](README.md)
2. Read [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)
3. Understand each build step
4. Test on clean machine
5. Learn troubleshooting

### Advanced
1. Read [CONFIGURATION-GUIDE.md](CONFIGURATION-GUIDE.md)
2. Read [../docs/MSI-INSTALLER-GUIDE.md](../docs/MSI-INSTALLER-GUIDE.md)
3. Customize configuration
4. Set up code signing
5. Configure auto-updates
6. Set up CI/CD pipeline

## 🚀 Next Steps

After building your MSI:

1. **Test Thoroughly**
   - Install on clean Windows VM
   - Test all features
   - Test uninstallation

2. **Consider Code Signing**
   - Purchase certificate
   - Sign your MSI
   - Eliminate SmartScreen warnings

3. **Set Up Auto-Updates**
   - Configure GitHub integration
   - Test update process
   - Document update procedure

4. **Distribute**
   - Create download page
   - Publish to GitHub Releases
   - Announce to users

5. **Monitor**
   - Collect user feedback
   - Track installation issues
   - Plan next version

## 📞 Support

- **Build Issues**: See [INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md#troubleshooting)
- **Configuration**: See [CONFIGURATION-GUIDE.md](CONFIGURATION-GUIDE.md)
- **Quick Fixes**: See [QUICK-START.md](QUICK-START.md#-common-issues)

## 📅 Version History

### 1.0.0 (June 7, 2026)
- Initial MSI installer project
- Electron-based wrapper
- Auto-starting backend
- Auto-update support
- Complete documentation

---

## 🎉 Ready to Build?

```batch
cd query-genie-msi
build-all.bat
```

Good luck! 🚀

---

**Index Version:** 1.0  
**Last Updated:** June 7, 2026  
**Project:** Query Genie MSI Installer
