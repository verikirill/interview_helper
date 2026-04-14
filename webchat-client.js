const { io } = require('socket.io-client');
const Store = require('electron-store');

class WebChatService {
  constructor() {
    this.socket = null;
    this.store = new Store();
    this.messages = [];
    this.onMessageCallback = null;
  }

  start(serverUrl) {
    if (this.socket) {
      this.socket.disconnect();
    }

    if (!serverUrl || !serverUrl.startsWith('http')) {
      throw new Error('Invalid Web Chat Server URL. Must start with http:// or https://');
    }

    this.store.set('webchatServerUrl', serverUrl);

    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log(`✅ Web Chat connected to: ${serverUrl}`);
    });

    this.socket.on('connect_error', (err) => {
      console.error(`❌ Web Chat connection error:`, err.message);
    });

    // History is received on first connect
    this.socket.on('history', (history) => {
      console.log(`📥 Loaded ${history.length} past messages from Web Chat`);
      // Update our local array but don't fire UI callbacks yet 
      // (the renderer will fetch them via IPC if it wants)
      this.messages = history;
    });

    this.socket.on('newMessage', (msg) => {
      console.log(`📩 Incoming Web Chat message from ${msg.from}`);
      
      this.messages.push(msg);
      
      if (this.messages.length > 100) {
        this.messages.shift();
      }

      if (this.onMessageCallback) {
        this.onMessageCallback(msg);
      }
    });
  }

  stop() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Web Chat disconnected');
    }
  }

  getMessages() {
    return this.messages;
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  isRunning() {
    return this.socket !== null && this.socket.connected;
  }
}

module.exports = WebChatService;
