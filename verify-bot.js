const TelegramBot = require('node-telegram-bot-api');

const token = '7988197350:AAG0LYUiw3rhY2CivLgLkf3j7HwMuq5G9Kc';
const chatId = '-3547994017';

console.log('--- Telegram Bot Connection Test ---');
console.log(`Token: ${token}`);
console.log(`Target Chat ID: ${chatId}`);

const bot = new TelegramBot(token, { polling: false });

bot.getMe().then((me) => {
    console.log('✅ Connection successful!');
    console.log(`Bot Name: ${me.first_name}`);
    console.log(`Bot Username: @${me.username}`);
    
    // Test receiving updates (check if chat ID is accessible)
    console.log('\nChecking for recent updates...');
    return bot.getUpdates();
}).then((updates) => {
    console.log(`Found ${updates.length} recent updates.`);
    
    const chatFound = updates.some(u => 
        (u.message && u.message.chat.id.toString() === chatId) ||
        (u.channel_post && u.channel_post.chat.id.toString() === chatId)
    );
    
    if (chatFound) {
        console.log(`✅ Success: Chat ID ${chatId} found in updates.`);
    } else {
        console.log(`⚠️ Warning: Chat ID ${chatId} not found in recent updates. Make sure the bot is added to the chat and has permission to read messages.`);
    }
    
    process.exit(0);
}).catch((error) => {
    console.error('❌ Connection failed!');
    console.error('Error details:', error.message);
    process.exit(1);
});
