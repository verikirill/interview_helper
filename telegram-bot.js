const TelegramBot = require('node-telegram-bot-api');
const Store = require('electron-store');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.store = new Store();
    this.messages = [];
    this.onMessageCallback = null;
  }

  start(token, chatId, options = {}) {
    if (this.bot) {
      this.bot.stopPolling();
    }

    const botOptions = { 
      polling: true,
      request: {}
    };

    if (options.proxy) {
      botOptions.request.proxy = options.proxy;
    }

    if (options.baseUrl) {
      botOptions.baseApiUrl = options.baseUrl;
    }

    this.bot = new TelegramBot(token, botOptions);
    this.store.set('telegramToken', token);
    this.store.set('telegramChatId', chatId);

    // Проверяем подключение
    this.bot.getMe().then((me) => {
      console.log(`✅ Telegram bot connected: @${me.username} (${me.first_name})`);
    }).catch((err) => {
      console.error('❌ Telegram connection error:', err.message);
    });


    this.bot.on('message', async (msg) => {
      console.log(`📩 Incoming message from chat ${msg.chat.id}: "${msg.text || '[no text]'}"`);

      // Фильтруем только сообщения из нужного чата
      if (chatId && msg.chat.id.toString() !== chatId.toString()) {
        console.log(`⚠️ Message filtered out (Target Chat ID: ${chatId})`);
        return;
      }


      const message = {
        id: msg.message_id,
        text: msg.text || msg.caption || '',
        from: msg.from.first_name || 'Unknown',
        date: new Date(msg.date * 1000),
        timestamp: msg.date * 1000,
        photo: null
      };

      // Если есть фото, получаем его
      if (msg.photo && msg.photo.length > 0) {
        try {
          const photo = msg.photo[msg.photo.length - 1]; // Берем самое большое фото
          const fileLink = await this.bot.getFileLink(photo.file_id);
          message.photo = fileLink;
        } catch (err) {
          console.error('Error getting photo:', err);
        }
      }

      this.messages.push(message);
      
      // Ограничиваем количество сообщений
      if (this.messages.length > 100) {
        this.messages.shift();
      }

      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    });

    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });
  }

  stop() {
    if (this.bot) {
      this.bot.stopPolling();
      this.bot = null;
    }
  }

  getMessages() {
    return this.messages;
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  isRunning() {
    return this.bot !== null;
  }
}

module.exports = TelegramBotService;
