const { app, BrowserWindow, ipcMain, globalShortcut, screen, desktopCapturer, systemPreferences, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const TelegramBotService = require('./telegram-bot');
const WebChatService = require('./webchat-client');

const store = new Store({
  defaults: {
    apiKey: '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',
    apiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    visionModel: 'meta/llama-4-maverick-17b-128e-instruct',
    solverModel: 'qwen/qwen3-coder-480b-a35b-instruct',
    telegramToken: '',
    telegramChatId: '',
    telegramProxy: '',
    telegramBaseUrl: 'https://api.telegram.org',
    webchatServerUrl: 'http://localhost:3000',
    shortcuts: {
      toggleVisibility: 'CommandOrControl+Shift+H',
      toggleClickThrough: 'CommandOrControl+Shift+T',
      takeScreenshot: 'CommandOrControl+Shift+S',
      askQuestion: 'CommandOrControl+Enter',
      increaseOpacity: 'CommandOrControl+Shift+Up',
      decreaseOpacity: 'CommandOrControl+Shift+Down',
      increaseFontSize: 'CommandOrControl+Plus',
      decreaseFontSize: 'CommandOrControl+-',
      scrollUp: 'CommandOrControl+Shift+PageUp',
      scrollDown: 'CommandOrControl+Shift+PageDown'
    },
    opacity: 0.9,
    fontSize: 14,
    alwaysOnTop: true,
    contentProtection: true,
    windowBounds: { width: 800, height: 600 }
  }
});

let mainWindow;
let tray = null;
let isClickThrough = false;
let isVisible = true;
let telegramBot = new TelegramBotService();
let webChatClient = new WebChatService();

function createWindow() {
  const { width, height } = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: store.get('alwaysOnTop'),
    skipTaskbar: true, // Hides from taskbar
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setOpacity(store.get('opacity'));
  mainWindow.setContentProtection(store.get('contentProtection'));
  mainWindow.loadFile('index.html');

  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', { width: bounds.width, height: bounds.height });
  });

  createTray();
  registerShortcuts();
}

function createTray() {
  if (tray) return;

  // Create a minimal programmatic icon (a simple blue square) if no actual icon exists wrapper
  const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZKAQMFKon2HUAAaD0dDQ0MAwQGhoqP///3+GUQMYDDAajIhgNGBQMDAAF40BAThFp6MAAAAASUVORK5CYII=';
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${iconBase64}`);
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Interview Helper', enabled: false },
    { type: 'separator' },
    { label: 'Показать / Скрыть', click: () => {
        isVisible = !isVisible;
        if (isVisible) {
          mainWindow.show();
        } else {
          mainWindow.hide();
        }
        mainWindow.webContents.send('visibility-changed', isVisible);
    }},
    { label: 'Настройки', click: () => {
        if (!isVisible) {
          isVisible = true;
          mainWindow.show();
          mainWindow.webContents.send('visibility-changed', isVisible);
        }
        // focus the window
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }},
    { type: 'separator' },
    { label: 'Выход', click: () => {
        app.isQuitting = true;
        app.quit();
    }}
  ]);

  tray.setToolTip('Interview Helper');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    isVisible = !isVisible;
    if (isVisible) {
      mainWindow.show();
    } else {
      mainWindow.hide();
    }
    mainWindow.webContents.send('visibility-changed', isVisible);
  });
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  const shortcuts = store.get('shortcuts');

  // Toggle visibility
  globalShortcut.register(shortcuts.toggleVisibility, () => {
    isVisible = !isVisible;
    if (isVisible) {
      mainWindow.show();
    } else {
      mainWindow.hide();
    }
    mainWindow.webContents.send('visibility-changed', isVisible);
  });

  // Toggle click-through
  globalShortcut.register(shortcuts.toggleClickThrough, () => {
    isClickThrough = !isClickThrough;
    mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });
    mainWindow.webContents.send('click-through-changed', isClickThrough);
  });

  // Screenshot
  globalShortcut.register(shortcuts.takeScreenshot, async () => {
    mainWindow.webContents.send('take-screenshot');
  });

  // Ask question
  globalShortcut.register(shortcuts.askQuestion, () => {
    mainWindow.webContents.send('ask-question');
  });

  // Opacity controls
  globalShortcut.register(shortcuts.increaseOpacity, () => {
    let opacity = Math.min(1, store.get('opacity') + 0.1);
    store.set('opacity', opacity);
    mainWindow.setOpacity(opacity);
    mainWindow.webContents.send('opacity-changed', opacity);
  });

  globalShortcut.register(shortcuts.decreaseOpacity, () => {
    let opacity = Math.max(0.1, store.get('opacity') - 0.1);
    store.set('opacity', opacity);
    mainWindow.setOpacity(opacity);
    mainWindow.webContents.send('opacity-changed', opacity);
  });

  // Font size controls
  globalShortcut.register(shortcuts.increaseFontSize, () => {
    let fontSize = Math.min(24, (store.get('fontSize') || 14) + 2);
    store.set('fontSize', fontSize);
    mainWindow.webContents.send('font-size-changed', fontSize);
  });

  globalShortcut.register(shortcuts.decreaseFontSize, () => {
    let fontSize = Math.max(6, (store.get('fontSize') || 14) - 2);
    store.set('fontSize', fontSize);
    mainWindow.webContents.send('font-size-changed', fontSize);
  });

  // Scroll controls
  globalShortcut.register(shortcuts.scrollUp, () => {
    mainWindow.webContents.send('scroll-up');
  });

  globalShortcut.register(shortcuts.scrollDown, () => {
    mainWindow.webContents.send('scroll-down');
  });
}

app.whenReady().then(createWindow);

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-settings', () => store.store);

ipcMain.handle('save-settings', (event, settings) => {
  Object.keys(settings).forEach(key => store.set(key, settings[key]));
  if (settings.shortcuts) registerShortcuts();
  if (settings.opacity) mainWindow.setOpacity(settings.opacity);
  if (settings.alwaysOnTop !== undefined) mainWindow.setAlwaysOnTop(settings.alwaysOnTop);
  if (settings.contentProtection !== undefined) mainWindow.setContentProtection(settings.contentProtection);
  return true;
});

ipcMain.handle('minimize-window', () => mainWindow.minimize());
ipcMain.handle('close-window', () => mainWindow.close());

ipcMain.handle('set-click-through', (event, value) => {
  isClickThrough = value;
  mainWindow.setIgnoreMouseEvents(value, { forward: true });
});

ipcMain.handle('set-opacity', (event, value) => {
  mainWindow.setOpacity(value);
  store.set('opacity', value);
});

ipcMain.handle('reset-settings', () => {
  store.clear();
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('capture-screen', async () => {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const scaleFactor = primaryDisplay.scaleFactor || 1;
  
  const realWidth = Math.floor(width * scaleFactor);
  const realHeight = Math.floor(height * scaleFactor);
  
  const wasVisible = mainWindow.isVisible();
  if (wasVisible) mainWindow.hide();
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: realWidth, height: realHeight }
    });
    
    if (sources.length > 0) {
      const screenshot = sources[0].thumbnail.toDataURL('image/png');
      if (wasVisible) mainWindow.show();
      return screenshot;
    }
  } catch (err) {
    console.error('Screenshot error:', err);
  }
  
  if (wasVisible) mainWindow.show();
  return null;
});

// Telegram IPC handlers
ipcMain.handle('start-telegram', async (event, token, chatId) => {
  try {
    const proxy = store.get('telegramProxy');
    const baseUrl = store.get('telegramBaseUrl');
    telegramBot.start(token, chatId, { proxy, baseUrl });
    
    telegramBot.onMessage((message) => {
      mainWindow.webContents.send('telegram-message', message);
    });
    
    return { success: true };
  } catch (err) {
    console.error('Telegram start error:', err);
    throw err;
  }
});

ipcMain.handle('stop-telegram', () => {
  telegramBot.stop();
  return { success: true };
});

ipcMain.handle('get-telegram-messages', () => {
  return telegramBot.getMessages();
});

// Web Chat IPC handlers
ipcMain.handle('start-webchat', async (event, url) => {
  try {
    webChatClient.start(url);
    
    webChatClient.onMessage((message) => {
      mainWindow.webContents.send('webchat-message', message);
    });
    
    return { success: true };
  } catch (err) {
    console.error('Web Chat start error:', err);
    throw err;
  }
});

ipcMain.handle('stop-webchat', () => {
  webChatClient.stop();
  return { success: true };
});

ipcMain.handle('get-webchat-messages', () => {
  return webChatClient.getMessages();
});
