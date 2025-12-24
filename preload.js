const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  setClickThrough: (value) => ipcRenderer.invoke('set-click-through', value),
  setOpacity: (value) => ipcRenderer.invoke('set-opacity', value),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  
  onVisibilityChanged: (callback) => ipcRenderer.on('visibility-changed', (_, value) => callback(value)),
  onClickThroughChanged: (callback) => ipcRenderer.on('click-through-changed', (_, value) => callback(value)),
  onOpacityChanged: (callback) => ipcRenderer.on('opacity-changed', (_, value) => callback(value)),
  onFontSizeChanged: (callback) => ipcRenderer.on('font-size-changed', (_, value) => callback(value)),
  onScrollUp: (callback) => ipcRenderer.on('scroll-up', () => callback()),
  onScrollDown: (callback) => ipcRenderer.on('scroll-down', () => callback()),
  onTakeScreenshot: (callback) => ipcRenderer.on('take-screenshot', () => callback()),
  onAskQuestion: (callback) => ipcRenderer.on('ask-question', () => callback())
});
