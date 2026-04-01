// Preload script – runs in a privileged context before the renderer page loads.
// Expose only a minimal, safe API surface to the renderer via contextBridge.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  version: process.versions.electron
});
