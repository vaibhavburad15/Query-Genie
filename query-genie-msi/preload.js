const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Get backend URL
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  
  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Check for updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // Environment info
  platform: process.platform,
  isPackaged: process.env.NODE_ENV === 'production'
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
