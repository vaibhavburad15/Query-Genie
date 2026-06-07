# Query Genie MSI - Configuration Guide

This guide explains how to customize the MSI installer configuration.

## 📝 package.json Configuration

### Basic Information

```json
{
  "name": "query-genie",           // Package name (lowercase, no spaces)
  "version": "1.0.0",              // Version number (semantic versioning)
  "description": "AI-Powered Database Query Tool",
  "main": "main.js",               // Entry point
  "author": "Query Genie Team",    // Your name or company
  "license": "MIT"                 // License type
}
```

### Build Configuration

#### App Metadata

```json
{
  "build": {
    "appId": "com.querygenie.app",        // Unique app identifier
    "productName": "Query Genie",          // Display name
    "copyright": "Copyright © 2026 Query Genie Team"
  }
}
```

**Customize for your brand:**
```json
{
  "appId": "com.yourcompany.yourapp",
  "productName": "Your Product Name",
  "copyright": "Copyright © 2026 Your Company Name"
}
```

#### Windows Target Configuration

```json
{
  "build": {
    "win": {
      "target": [
        {
          "target": "msi",           // MSI installer format
          "arch": ["x64"]            // 64-bit architecture
        },
        {
          "target": "nsis",          // Alternative: NSIS installer
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico",              // App icon
      "requestedExecutionLevel": "asInvoker", // Don't require admin
      "publisherName": "Query Genie"         // Publisher name
    }
  }
}
```

**Options:**
- `target`: `"msi"`, `"nsis"`, `"portable"`, `"appx"` (Microsoft Store)
- `arch`: `"x64"`, `"ia32"`, `"arm64"`
- `requestedExecutionLevel`: `"asInvoker"`, `"highestAvailable"`, `"requireAdministrator"`

#### MSI-Specific Settings

```json
{
  "build": {
    "msi": {
      "oneClick": false,                    // Show installation dialog
      "perMachine": true,                   // Install for all users
      "allowToChangeInstallationDirectory": true,  // Let user choose location
      "createDesktopShortcut": true,        // Create desktop shortcut
      "createStartMenuShortcut": true,      // Create Start Menu shortcut
      "shortcutName": "Query Genie",        // Shortcut name
      "installerIcon": "build/installerIcon.ico",   // Installer icon
      "uninstallerIcon": "build/installerIcon.ico"  // Uninstaller icon
    }
  }
}
```

**Common Customizations:**

| Option | Description | Default | Alternative |
|--------|-------------|---------|-------------|
| `oneClick` | Silent installation | `false` | `true` for no dialog |
| `perMachine` | Install for all users | `true` | `false` for current user only |
| `allowToChangeInstallationDirectory` | Let user choose folder | `true` | `false` to force location |
| `createDesktopShortcut` | Desktop icon | `true` | `false` to skip |
| `createStartMenuShortcut` | Start Menu entry | `true` | `false` to skip |

#### File Inclusion

```json
{
  "build": {
    "files": [
      "main.js",              // Main Electron process
      "preload.js",           // Preload script
      "package.json",         // Package metadata
      "frontend/**/*",        // All frontend files
      "resources/**/*"        // All resources
    ],
    "extraResources": [
      {
        "from": "resources",  // Source folder
        "to": "resources",    // Destination in installation
        "filter": ["**/*"]    // Include all files
      }
    ]
  }
}
```

**Add additional files:**
```json
{
  "files": [
    "main.js",
    "preload.js",
    "package.json",
    "frontend/**/*",
    "resources/**/*",
    "config/**/*",      // Add config folder
    "assets/**/*"       // Add assets folder
  ]
}
```

#### Auto-Update Configuration

```json
{
  "build": {
    "publish": {
      "provider": "github",           // Update provider
      "owner": "your-username",       // GitHub username
      "repo": "query-genie"           // Repository name
    }
  }
}
```

**Providers:**

1. **GitHub Releases** (Recommended - Free)
   ```json
   {
     "provider": "github",
     "owner": "your-username",
     "repo": "query-genie",
     "private": false              // true if private repo
   }
   ```

2. **Custom Server**
   ```json
   {
     "provider": "generic",
     "url": "https://yourserver.com/updates"
   }
   ```

3. **Amazon S3**
   ```json
   {
     "provider": "s3",
     "bucket": "your-bucket",
     "region": "us-east-1"
   }
   ```

4. **Disable Auto-Update**
   ```json
   // Remove the "publish" section entirely
   ```

### Scripts Configuration

```json
{
  "scripts": {
    "start": "electron .",                              // Run in dev mode
    "build:backend": "build-backend.bat",               // Build backend
    "build:frontend": "build-frontend.bat",             // Build frontend
    "build:win": "electron-builder --win --x64",        // Create installer
    "build:all": "npm run build:backend && npm run build:frontend && npm run build:win",
    "publish": "electron-builder --win --x64 --publish always"
  }
}
```

**Additional useful scripts:**
```json
{
  "scripts": {
    "start": "electron .",
    "dev": "electron . --debug",                        // Dev mode with debugging
    "build:win": "electron-builder --win --x64",
    "build:win:portable": "electron-builder --win portable",  // Portable version
    "build:mac": "electron-builder --mac",              // macOS build
    "build:linux": "electron-builder --linux",          // Linux build
    "test": "npm run build:all",                        // Test build
    "clean": "rmdir /s /q dist && rmdir /s /q resources\\backend && rmdir /s /q frontend"
  }
}
```

---

## 🎨 Customization Examples

### Example 1: Simple Desktop App

```json
{
  "name": "myapp",
  "version": "1.0.0",
  "build": {
    "appId": "com.mycompany.myapp",
    "productName": "My App",
    "win": {
      "target": ["nsis"],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": true,                     // One-click install
      "createDesktopShortcut": true
    }
  }
}
```

### Example 2: Enterprise Application

```json
{
  "name": "enterprise-app",
  "version": "2.1.5",
  "build": {
    "appId": "com.enterprise.app",
    "productName": "Enterprise Application",
    "win": {
      "target": ["msi"],
      "icon": "build/icon.ico",
      "requestedExecutionLevel": "requireAdministrator",  // Require admin
      "publisherName": "Enterprise Corp"
    },
    "msi": {
      "oneClick": false,
      "perMachine": true,                   // System-wide install
      "allowToChangeInstallationDirectory": false,  // Fixed location
      "createDesktopShortcut": false        // No desktop shortcut
    }
  }
}
```

### Example 3: Portable Application

```json
{
  "scripts": {
    "build:portable": "electron-builder --win portable"
  },
  "build": {
    "win": {
      "target": ["portable"]
    },
    "portable": {
      "artifactName": "${productName}-${version}-portable.exe"
    }
  }
}
```

---

## 🔧 Advanced Configuration

### Code Signing

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "your-password",  // Better: use env variable
      "signingHashAlgorithms": ["sha256"],
      "rfc3161TimeStampServer": "http://timestamp.digicert.com"
    }
  }
}
```

**Better: Use environment variables**
```batch
set CSC_LINK=path\to\certificate.pfx
set CSC_KEY_PASSWORD=your-password
npm run build:win
```

### Custom Installer UI

```json
{
  "build": {
    "nsis": {
      "installerIcon": "build/installerIcon.ico",
      "installerHeader": "build/installerHeader.bmp",     // 150x57
      "installerSidebar": "build/installerSidebar.bmp",   // 164x314
      "uninstallerIcon": "build/uninstallerIcon.ico",
      "license": "LICENSE.txt",
      "warningsAsErrors": true
    }
  }
}
```

### Multiple Targets

Build MSI, NSIS, and Portable versions:

```json
{
  "build": {
    "win": {
      "target": [
        {
          "target": "msi",
          "arch": ["x64"]
        },
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ]
    }
  }
}
```

### Compression

```json
{
  "build": {
    "compression": "maximum",        // "store", "normal", "maximum"
    "asar": true,                    // Package app into asar archive
    "asarUnpack": [
      "resources/backend/**/*"       // Don't pack backend (needs direct access)
    ]
  }
}
```

---

## 📂 Directory Configuration

```json
{
  "build": {
    "directories": {
      "output": "dist",              // Output folder
      "buildResources": "build",     // Build resources (icons, etc.)
      "app": "."                     // App source directory
    }
  }
}
```

**Custom output structure:**
```json
{
  "directories": {
    "output": "releases/${version}",         // Version-specific output
    "buildResources": "assets/build"
  }
}
```

---

## 🌍 Multi-Language Support

```json
{
  "build": {
    "nsis": {
      "language": "1033",            // English (default)
      "installerLanguages": [
        "1033",  // English
        "1031",  // German
        "1036",  // French
        "1034"   // Spanish
      ]
    }
  }
}
```

Common language codes:
- `1033` - English
- `1031` - German
- `1036` - French
- `1034` - Spanish
- `1040` - Italian
- `1041` - Japanese
- `2052` - Chinese (Simplified)

---

## 🔍 Debugging

### Enable verbose logging

```json
{
  "scripts": {
    "build:debug": "electron-builder --win --x64 --debug"
  }
}
```

### Test without packaging

```json
{
  "scripts": {
    "build:dir": "electron-builder --win --dir"  // Build without installer
  }
}
```

This creates `win-unpacked/` folder you can test directly.

---

## ✅ Configuration Checklist

Before building for production:

- [ ] Update `version` number
- [ ] Set correct `appId` (unique identifier)
- [ ] Set `productName` (display name)
- [ ] Update `author` and `copyright`
- [ ] Configure `publish` settings (for auto-update)
- [ ] Add proper icons (`icon.ico`, `installerIcon.ico`)
- [ ] Set `requestedExecutionLevel` appropriately
- [ ] Configure shortcuts (desktop, Start Menu)
- [ ] Review file inclusions (`files`, `extraResources`)
- [ ] Test on clean Windows machine

---

## 📚 Additional Resources

- **electron-builder docs**: https://www.electron.build/
- **MSI options**: https://www.electron.build/configuration/msi
- **NSIS options**: https://www.electron.build/configuration/nsis
- **Auto-update**: https://www.electron.build/auto-update
- **Code signing**: https://www.electron.build/code-signing

---

**Configuration Guide Version:** 1.0  
**Last Updated:** June 7, 2026
