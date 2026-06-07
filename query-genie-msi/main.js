const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;
let tray;
let isQuitting = false;

// Backend server configuration
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 5173; // For development
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Get the correct path for resources based on environment
function getResourcePath(resourcePath) {
  if (app.isPackaged) {
    // Production: resources are in resources/app.asar.unpacked
    return path.join(process.resourcesPath, resourcePath);
  } else {
    // Development: resources are relative to project root
    return path.join(__dirname, resourcePath);
  }
}

// Start the Python backend server
function startBackend() {
  return new Promise((resolve, reject) => {
    try {
      const backendExePath = getResourcePath('resources/backend/query-genie-backend.exe');
      const backendDir = path.dirname(backendExePath);

      console.log('Starting backend from:', backendExePath);
      console.log('Backend directory:', backendDir);

      if (!fs.existsSync(backendExePath)) {
        console.error('Backend executable not found at:', backendExePath);
        reject(new Error('Backend executable not found'));
        return;
      }

      // Start the backend process
      backendProcess = spawn(backendExePath, [], {
        cwd: backendDir,
        stdio: 'pipe',
        windowsHide: true
      });

      backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
      });

      backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
      });

      backendProcess.on('error', (error) => {
        console.error('Failed to start backend:', error);
        reject(error);
      });

      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
        if (!isQuitting) {
          dialog.showErrorBox(
            'Backend Error',
            'The backend server has stopped unexpectedly. The application will close.'
          );
          app.quit();
        }
      });

      // Wait for backend to be ready
      setTimeout(() => {
        checkBackendHealth()
          .then(() => {
            console.log('Backend is ready');
            resolve();
          })
          .catch((error) => {
            console.error('Backend health check failed:', error);
            reject(error);
          });
      }, 3000); // Wait 3 seconds for backend to start

    } catch (error) {
      console.error('Error starting backend:', error);
      reject(error);
    }
  });
}

// Check if backend is responding
async function checkBackendHealth() {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.log(`Health check attempt ${i + 1}/${maxRetries} failed`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Backend failed to start');
}

// Stop the backend server
function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, 'build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false, // Don't show until ready
    backgroundColor: '#1a1a1a',
    title: 'Query Genie'
  });

  // Load the frontend
  const frontendPath = app.isPackaged
    ? path.join(__dirname, 'frontend/index.html')
    : `http://localhost:${FRONTEND_PORT}`;

  if (app.isPackaged) {
    mainWindow.loadFile(frontendPath);
  } else {
    mainWindow.loadURL(frontendPath);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// Create system tray icon
function createTray() {
  const trayIconPath = path.join(__dirname, 'build/icon.ico');
  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Query Genie',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Check for Updates',
      click: () => {
        autoUpdater.checkForUpdatesAndNotify();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Query Genie');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
    }
  });
}

// Auto-updater configuration
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available. Do you want to download it now?`,
      buttons: ['Download', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download speed: ${progressObj.bytesPerSecond}`);
    console.log(`Downloaded ${progressObj.percent}%`);
    
    if (mainWindow) {
      mainWindow.setProgressBar(progressObj.percent / 100);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    mainWindow.setProgressBar(-1); // Remove progress bar
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to install the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        isQuitting = true;
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
  });

  // Check for updates on startup (after 5 seconds)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 5000);
}

// App lifecycle handlers
app.whenReady().then(async () => {
  try {
    // Start backend first
    await startBackend();
    
    // Create window
    createWindow();
    
    // Create tray icon
    createTray();
    
    // Setup auto-updater
    setupAutoUpdater();
    
    console.log('Application started successfully');
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start Query Genie: ${error.message}\n\nThe application will now close.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running when all windows are closed
  if (process.platform !== 'darwin') {
    // Don't quit immediately, just hide
    // User can quit from tray
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  stopBackend();
});

// IPC handlers
ipcMain.handle('get-backend-url', () => {
  return BACKEND_URL;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});
