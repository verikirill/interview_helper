const TelegramBot = require('node-telegram-bot-api');

const token = '7988197350:AAG0LYUiw3rhY2CivLgLkf3j7HwMuq5G9Kc';

console.log('--- Testing Telegram Bot (Direct Connection) ---');
console.log(`Token: ${token}`);
console.log('Connection: Direct (no proxy)');

const bot = new TelegramBot(token, { polling: false });

bot.getMe().then((me) => {
  console.log('✅ Connection successful!');
  console.log(`Bot Name: ${me.first_name}`);
  console.log(`Bot Username: @${me.username}`);
  process.exit(0);
}).catch((error) => {
  console.error('❌ Connection failed!');
  console.error('Error:', error.message);
  process.exit(1);
});
