# Query Genie MSI - Quick Start Guide

## 🚀 Build Your MSI in 5 Steps

### Step 1: Install Prerequisites (5 minutes)

```batch
# Download and install:
# - Node.js from https://nodejs.org/
# - Python from https://www.python.org/

# Then install PyInstaller:
pip install pyinstaller
```

### Step 2: Add Icons (2 minutes)

Place these files in the `build/` folder:
- `icon.ico` (application icon)
- `installerIcon.ico` (installer icon)

**Don't have icons?** Convert the Query Genie logo:
1. Go to https://convertio.co/png-ico/
2. Upload: `..\Query-frontend\src\assets\query-genie-logo.png`
3. Download and rename to `icon.ico` and `installerIcon.ico`

### Step 3: Build Everything (10-15 minutes)

```batch
# Navigate to this folder
cd query-genie-msi

# Run the master build script
build-all.bat
```

The script will:
- ✅ Install dependencies
- ✅ Build Python backend
- ✅ Build React frontend
- ✅ Create MSI installer

### Step 4: Find Your Installer

```batch
# Your MSI is ready at:
query-genie-msi\dist\Query Genie Setup 1.0.0.msi
```

File size: ~150-200 MB

### Step 5: Test It

1. Double-click the MSI file
2. Install Query Genie
3. Launch from Desktop shortcut
4. Test database connections

---

## ✅ That's It!

You now have a Windows installer ready to distribute.

---

## 🐛 Common Issues

### "Python not found"
```batch
# Add Python to PATH
setx PATH "%PATH%;C:\Python310;C:\Python310\Scripts"
```

### "Icons not found"
```batch
# Just continue - icons are optional
# Or add icon.ico and installerIcon.ico to build/ folder
```

### "Port 8000 in use"
```batch
# Stop any services using port 8000
netstat -ano | findstr :8000
taskkill /PID <process_id> /F
```

---

## 📚 Need More Help?

- **Full Guide:** See `INSTALLATION-GUIDE.md`
- **Detailed Docs:** See `README.md`
- **Original Guide:** See `..\docs\MSI-INSTALLER-GUIDE.md`

---

## 🎯 Next Steps

After building:
1. **Test** on a clean Windows machine
2. **Sign** the MSI (optional but recommended)
3. **Distribute** to users
4. **Set up** auto-updates via GitHub Releases

---

**Quick Start Version:** 1.0  
**Last Updated:** June 7, 2026
