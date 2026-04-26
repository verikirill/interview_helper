// State
let settings = {};
let responses = [];
let currentResponseIndex = 0;
let telegramMessages = [];
let webchatMessages = [];
let currentTelegramIndex = 0;
let currentTab = 'solver';

// DOM Elements
const elements = {
  btnScreenshot: document.getElementById('btnScreenshot'),
  btnSettings: document.getElementById('btnSettings'),
  btnClickThrough: document.getElementById('btnClickThrough'),
  btnMinimize: document.getElementById('btnMinimize'),
  btnClose: document.getElementById('btnClose'),
  inputText: document.getElementById('inputText'),
  btnSubmit: document.getElementById('btnSubmit'),
  responseArea: document.getElementById('responseArea'),
  responseContent: document.getElementById('responseContent'),
  pageIndicator: document.getElementById('pageIndicator'),
  btnPrev: document.getElementById('btnPrev'),
  btnNext: document.getElementById('btnNext'),
  telegramArea: document.getElementById('telegramArea'),
  telegramContent: document.getElementById('telegramContent'),
  settingsPanel: document.getElementById('settingsPanel'),
  settingApiKey: document.getElementById('settingApiKey'),
  settingApiUrl: document.getElementById('settingApiUrl'),
  settingVisionModel: document.getElementById('settingVisionModel'),
  settingSolverModel: document.getElementById('settingSolverModel'),
  settingTelegramToken: document.getElementById('settingTelegramToken'),
  settingTelegramChatId: document.getElementById('settingTelegramChatId'),
  settingTelegramProxy: document.getElementById('settingTelegramProxy'),
  settingTelegramProxySecret: document.getElementById('settingTelegramProxySecret'),
  settingTelegramBaseUrl: document.getElementById('settingTelegramBaseUrl'),
  btnStartTelegram: document.getElementById('btnStartTelegram'),
  btnStopTelegram: document.getElementById('btnStopTelegram'),
  
  webchatArea: document.getElementById('webchatArea'),
  webchatContent: document.getElementById('webchatContent'),
  settingWebchatServerUrl: document.getElementById('settingWebchatServerUrl'),
  btnStartWebchat: document.getElementById('btnStartWebchat'),
  btnStopWebchat: document.getElementById('btnStopWebchat'),

  settingOpacity: document.getElementById('settingOpacity'),
  settingFontSize: document.getElementById('settingFontSize'),
  opacityValue: document.getElementById('opacityValue'),
  fontSizeValue: document.getElementById('fontSizeValue'),
  shortcutVisibility: document.getElementById('shortcutVisibility'),
  shortcutClickThrough: document.getElementById('shortcutClickThrough'),
  shortcutScreenshot: document.getElementById('shortcutScreenshot'),
  shortcutAsk: document.getElementById('shortcutAsk'),
  shortcutScrollUp: document.getElementById('shortcutScrollUp'),
  shortcutScrollDown: document.getElementById('shortcutScrollDown'),
  settingAlwaysOnTop: document.getElementById('settingAlwaysOnTop'),
  settingContentProtection: document.getElementById('settingContentProtection'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),
  btnCancelSettings: document.getElementById('btnCancelSettings'),
  btnResetSettings: document.getElementById('btnResetSettings')
};

// Initialize
async function init() {
  settings = await window.electronAPI.getSettings();
  updateSettingsUI();
  setupEventListeners();
  setupIPCListeners();
  switchTab('solver');
}

function updateSettingsUI() {
  elements.settingApiKey.value = settings.apiKey || '';
  elements.settingApiUrl.value = settings.apiUrl || '';
  elements.settingVisionModel.value = settings.visionModel || 'meta/llama-4-maverick-17b-128e-instruct';
  elements.settingSolverModel.value = settings.solverModel || 'qwen/qwen3-coder-480b-a35b-instruct';
  elements.settingTelegramToken.value = settings.telegramToken || '';
  elements.settingTelegramChatId.value = settings.telegramChatId || '';
  elements.settingTelegramProxy.value = settings.telegramProxy || '';
  elements.settingTelegramProxySecret.value = settings.telegramProxySecret || '';
  elements.settingTelegramBaseUrl.value = settings.telegramBaseUrl || 'https://api.telegram.org';
  elements.settingWebchatServerUrl.value = settings.webchatServerUrl || 'http://localhost:3000';
  elements.settingOpacity.value = (settings.opacity || 0.9) * 100;
  elements.opacityValue.textContent = Math.round((settings.opacity || 0.9) * 100) + '%';
  elements.settingFontSize.value = settings.fontSize || 14;
  elements.fontSizeValue.textContent = (settings.fontSize || 14) + 'px';
  applyFontSize(settings.fontSize || 14);
  elements.shortcutVisibility.value = settings.shortcuts?.toggleVisibility || '';
  elements.shortcutClickThrough.value = settings.shortcuts?.toggleClickThrough || '';
  elements.shortcutScreenshot.value = settings.shortcuts?.takeScreenshot || '';
  elements.shortcutAsk.value = settings.shortcuts?.askQuestion || '';
  elements.shortcutScrollUp.value = settings.shortcuts?.scrollUp || '';
  elements.shortcutScrollDown.value = settings.shortcuts?.scrollDown || '';
  elements.settingAlwaysOnTop.checked = settings.alwaysOnTop !== false;
  elements.settingContentProtection.checked = settings.contentProtection !== false;
}

function applyFontSize(size) {
  elements.responseContent.style.fontSize = size + 'px';
  elements.telegramContent.style.fontSize = size + 'px';
  if (elements.webchatContent) {
    elements.webchatContent.style.fontSize = size + 'px';
  }
}

function setupEventListeners() {
  // Window controls
  elements.btnMinimize.addEventListener('click', () => window.electronAPI.minimizeWindow());
  elements.btnClose.addEventListener('click', () => window.electronAPI.closeWindow());
  
  // Actions
  elements.btnScreenshot.addEventListener('click', takeScreenshot);
  elements.btnSubmit.addEventListener('click', submitManualQuestion);
  
  // Settings
  elements.btnSettings.addEventListener('click', toggleSettings);
  elements.btnSaveSettings.addEventListener('click', saveSettings);
  elements.btnCancelSettings.addEventListener('click', () => elements.settingsPanel.classList.remove('active'));
  elements.btnResetSettings.addEventListener('click', async () => {
    if (confirm('Сбросить все настройки? Приложение перезапустится.')) {
      await window.electronAPI.resetSettings();
    }
  });
  elements.settingOpacity.addEventListener('input', async (e) => {
    const opacity = parseInt(e.target.value) / 100;
    elements.opacityValue.textContent = e.target.value + '%';
    await window.electronAPI.setOpacity(opacity);
  });
  elements.settingFontSize.addEventListener('input', (e) => {
    const size = parseInt(e.target.value);
    elements.fontSizeValue.textContent = size + 'px';
    applyFontSize(size);
  });
  
  // Navigation
  elements.btnPrev.addEventListener('click', () => navigateResponse(-1));
  elements.btnNext.addEventListener('click', () => navigateResponse(1));
  
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // Telegram & Web Chat
  elements.btnStartTelegram.addEventListener('click', startTelegramBot);
  elements.btnStopTelegram.addEventListener('click', stopTelegramBot);
  elements.btnStartWebchat.addEventListener('click', startWebchatClient);
  elements.btnStopWebchat.addEventListener('click', stopWebchatClient);
  
  // Click-through toggle
  elements.btnClickThrough.addEventListener('click', toggleClickThrough);
  
  // Input handling
  elements.inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitManualQuestion();
    }
  });
  
  // Auto-resize textarea
  elements.inputText.addEventListener('input', () => {
    elements.inputText.style.height = 'auto';
    elements.inputText.style.height = Math.min(elements.inputText.scrollHeight, 100) + 'px';
  });

  // Hotkey recording mechanism for shortcut inputs
  document.querySelectorAll('.shortcut-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const key = e.key;
      
      // Allow clearing the shortcut
      if (key === 'Backspace' || key === 'Delete') {
        input.value = '';
        return;
      }
      
      // Ignore if it's only a modifier key pressed
      if (['Control', 'Shift', 'Alt', 'Meta', 'OS'].includes(key)) {
        return;
      }
      
      const keys = [];
      // Build modifier string for Electron
      if (e.ctrlKey) keys.push('CommandOrControl');
      if (e.metaKey) keys.push('Super');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      
      let keyName = key;
      // Handle physical keys based on English layout to avoid issues with Russian layout
      if (e.code.startsWith('Key')) {
        keyName = e.code.replace('Key', '');
      } else if (e.code.startsWith('Digit')) {
        keyName = e.code.replace('Digit', '');
      } else if (keyName === 'PageUp') {
        keyName = 'PageUp';
      } else if (keyName === 'PageDown') {
        keyName = 'PageDown';
      } else if (keyName === 'ArrowUp') {
        keyName = 'Up';
      } else if (keyName === 'ArrowDown') {
        keyName = 'Down';
      } else if (keyName === 'ArrowLeft') {
        keyName = 'Left';
      } else if (keyName === 'ArrowRight') {
        keyName = 'Right';
      } else if (keyName === ' ') {
        keyName = 'Space';
      } else if (keyName === '=' || keyName === '+') {
        keyName = 'Plus';
      } else if (keyName === '-') {
        keyName = '-';
      } else {
        keyName = keyName.toUpperCase();
      }
      
      if (!keys.includes(keyName)) {
        keys.push(keyName);
      }
      
      input.value = keys.join('+');
    });
  });
}

function setupIPCListeners() {
  window.electronAPI.onVisibilityChanged((visible) => {
    console.log('Visibility:', visible);
  });
  
  window.electronAPI.onClickThroughChanged((enabled) => {
    elements.btnClickThrough.classList.toggle('active', enabled);
  });
  
  window.electronAPI.onOpacityChanged((opacity) => {
    elements.settingOpacity.value = opacity * 100;
    elements.opacityValue.textContent = Math.round(opacity * 100) + '%';
  });
  
  window.electronAPI.onFontSizeChanged((size) => {
    settings.fontSize = size;
    elements.settingFontSize.value = size;
    elements.fontSizeValue.textContent = size + 'px';
    applyFontSize(size);
  });
  
  window.electronAPI.onScrollUp(() => {
    if (currentTab === 'solver') {
      elements.responseArea.scrollBy({ top: -150, behavior: 'smooth' });
    } else if (currentTab === 'telegram') {
      elements.telegramArea.scrollBy({ top: -150, behavior: 'smooth' });
    } else if (currentTab === 'webchat') {
      elements.webchatArea.scrollBy({ top: -150, behavior: 'smooth' });
    }
  });
  
  window.electronAPI.onScrollDown(() => {
    if (currentTab === 'solver') {
      elements.responseArea.scrollBy({ top: 150, behavior: 'smooth' });
    } else if (currentTab === 'telegram') {
      elements.telegramArea.scrollBy({ top: 150, behavior: 'smooth' });
    } else if (currentTab === 'webchat') {
      elements.webchatArea.scrollBy({ top: 150, behavior: 'smooth' });
    }
  });
  
  window.electronAPI.onTakeScreenshot(() => takeScreenshot());
  window.electronAPI.onAskQuestion(() => askQuestion());
  
  window.electronAPI.onTelegramMessage((message) => {
    telegramMessages.push(message);
    if (currentTab === 'telegram') {
      displayTelegramMessages();
    }
  });

  window.electronAPI.onWebchatMessage((message) => {
    webchatMessages.push(message);
    if (currentTab === 'webchat') {
      displayWebchatMessages();
    }
  });
}

// Screenshot
async function takeScreenshot() {
  try {
    const imageData = await window.electronAPI.captureScreen();
    
    if (imageData) {
      // Ask AI about the screenshot
      await askWithImage(imageData);
    } else {
      showError('Не удалось сделать скриншот');
    }
  } catch (err) {
    console.error('Screenshot error:', err);
    showError('Не удалось сделать скриншот: ' + err.message);
  }
}

// API Calls
async function askQuestion() {
  const text = elements.inputText.value.trim();
  if (!text) return;
  
  await sendToAPI(text);
}

async function submitManualQuestion() {
  const text = elements.inputText.value.trim();
  if (!text) return;
  
  await sendToAPI(text);
  elements.inputText.value = '';
  elements.inputText.style.height = 'auto';
}

async function askWithImage(imageData) {
  showLoading('Читаю задачу...');
  
  try {
    // Step 1: OCR - extract task from image using vision model
    const ocrPrompt = 'Найди условие задачи на изображении и перепиши его ДОСЛОВНО. Только текст задачи, без примеров входа/выхода.';
    
    const ocrResponse = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: settings.visionModel,
        messages: [
          { role: 'user', content: `${ocrPrompt} <img src="${imageData}" />` }
        ],
        temperature: 0.1,
        max_tokens: 1024,
        stream: true
      })
    });
    
    if (!ocrResponse.ok) throw new Error(`OCR Error: ${ocrResponse.status}`);
    
    // Read OCR result
    let taskText = await readStream(ocrResponse);
    taskText = taskText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    if (!taskText) {
      showError('Не удалось прочитать задачу');
      return;
    }
    
    // Show extracted task
    elements.responseContent.innerHTML = formatResponse(`**Задача:**\n${taskText}\n\n---\n\n`);
    
    // Step 2: Solve the task using solver model
    showLoading('Решаю задачу...');
    
    const solvePrompt = `Реши алгоритмическую задачу на Python. ВАЖНО: НЕ ОСТАВЛЯЙ ПУСТЫХ СТРОК между секциями!
**Условие:** [кратко что дано и что найти]
**Ввод:** [формат входных данных]
**Идея:** [ПОДРОБНО объясни алгоритм пошагово, каждый термин объясняй в скобках, почему выбран именно этот подход]
**Крайние случаи:** [перечисли граничные случаи которые нужно учесть: пустой ввод, один элемент, отрицательные числа и т.д.]
**Сложность:** O(?) время, O(?) память - объясни почему
**Код:**
\`\`\`python
# Комментарий к каждой строке или блоку справа или сверху
\`\`\`
Задача:
${taskText}`;
    
    await sendToAPI(solvePrompt, null, settings.solverModel);
    
  } catch (err) {
    console.error('Error:', err);
    showError('Ошибка: ' + err.message);
  }
}

async function readStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) content += delta;
        } catch (e) {}
      }
    }
  }
  return content;
}

async function sendToAPI(text, imageData = null, model = null) {
  showLoading();
  
  const useModel = model || settings.solverModel;
  
  try {
    const messages = [];
    
    if (imageData) {
      // Vision model with image
      messages.push({
        role: 'user',
        content: `${text} <img src="${imageData}" />`
      });
    } else {
      messages.push({ role: 'user', content: text });
    }
    
    const response = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: useModel,
        messages: messages,
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 4096,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    elements.responseContent.innerHTML = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              elements.responseContent.innerHTML = formatResponse(fullContent);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
    
    // Save response
    responses.push({ question: text, answer: fullContent, timestamp: Date.now() });
    currentResponseIndex = responses.length - 1;
    updatePageIndicator();
    
  } catch (err) {
    console.error('API error:', err);
    showError('Ошибка API: ' + err.message);
  }
}

function formatResponse(text) {
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, function(m, lang, code) {
    var esc = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
    return '<pre><code class="lang-' + (lang || 'python') + '">' + esc + '</code></pre>';
  });
  
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/^- (.*$)/gm, '<li>$1</li>');
  text = text.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  text = text.replace(/^---$/gm, '<hr>');
  text = text.replace(/\n\n+/g, '</p><p>');
  text = text.replace(/\n/g, '<br>');
  
  return '<div class="md"><p>' + text + '</p></div>';
}

function showLoading(text = 'Думаю...') {
  elements.responseContent.innerHTML = `<div class="loading">${text}</div>`;
}

function showError(message) {
  elements.responseContent.innerHTML = `<p style="color: var(--danger)">${message}</p>`;
}

// Navigation
function navigateResponse(direction) {
  const newIndex = currentResponseIndex + direction;
  if (newIndex >= 0 && newIndex < responses.length) {
    currentResponseIndex = newIndex;
    elements.responseContent.innerHTML = formatResponse(responses[currentResponseIndex].answer);
    updatePageIndicator();
  }
}

function updatePageIndicator() {
  const total = Math.max(1, responses.length);
  const current = responses.length > 0 ? currentResponseIndex + 1 : 1;
  elements.pageIndicator.textContent = `${current}/${total}`;
}

// Settings
function toggleSettings() {
  elements.settingsPanel.classList.toggle('active');
}

async function saveSettings() {
  const newSettings = {
    apiKey: elements.settingApiKey.value,
    apiUrl: elements.settingApiUrl.value,
    visionModel: elements.settingVisionModel.value,
    solverModel: elements.settingSolverModel.value,
    telegramToken: elements.settingTelegramToken.value,
    telegramChatId: elements.settingTelegramChatId.value,
    telegramProxy: elements.settingTelegramProxy.value,
    telegramProxySecret: elements.settingTelegramProxySecret.value,
    telegramBaseUrl: elements.settingTelegramBaseUrl.value,
    webchatServerUrl: elements.settingWebchatServerUrl.value,
    opacity: parseInt(elements.settingOpacity.value) / 100,
    fontSize: parseInt(elements.settingFontSize.value),
    alwaysOnTop: elements.settingAlwaysOnTop.checked,
    contentProtection: elements.settingContentProtection.checked,
    shortcuts: {
      toggleVisibility: elements.shortcutVisibility.value,
      toggleClickThrough: elements.shortcutClickThrough.value,
      takeScreenshot: elements.shortcutScreenshot.value,
      askQuestion: elements.shortcutAsk.value,
      scrollUp: elements.shortcutScrollUp.value,
      scrollDown: elements.shortcutScrollDown.value,
      increaseOpacity: settings.shortcuts?.increaseOpacity || 'CommandOrControl+Shift+Up',
      decreaseOpacity: settings.shortcuts?.decreaseOpacity || 'CommandOrControl+Shift+Down'
    }
  };
  
  await window.electronAPI.saveSettings(newSettings);
  settings = { ...settings, ...newSettings };
  elements.settingsPanel.classList.remove('active');
}

// Click-through
let isClickThrough = false;

function toggleClickThrough() {
  isClickThrough = !isClickThrough;
  window.electronAPI.setClickThrough(isClickThrough);
  elements.btnClickThrough.classList.toggle('active', isClickThrough);
}

// Tab switching
function switchTab(tabName) {
  currentTab = tabName;
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.dataset.content === tabName);
  });
  
  if (tabName === 'telegram') {
    displayTelegramMessages();
  } else if (tabName === 'webchat') {
    displayWebchatMessages();
  }
}

// Telegram functions
async function startTelegramBot() {
  const token = elements.settingTelegramToken.value.trim();
  const chatId = elements.settingTelegramChatId.value.trim();
  
  if (!token || !chatId) {
    alert('Введите Bot Token и Chat ID');
    return;
  }
  
  try {
    await window.electronAPI.startTelegram(token, chatId);
    alert('Telegram бот запущен');
    
    const messages = await window.electronAPI.getTelegramMessages();
    telegramMessages = messages || [];
    displayTelegramMessages();
  } catch (err) {
    alert('Ошибка запуска бота: ' + err.message);
  }
}

async function stopTelegramBot() {
  try {
    await window.electronAPI.stopTelegram();
    alert('Telegram бот остановлен');
  } catch (err) {
    alert('Ошибка остановки бота: ' + err.message);
  }
}

// Web Chat functions
async function startWebchatClient() {
  const url = elements.settingWebchatServerUrl.value.trim();
  
  if (!url) {
    alert('Введите Server URL для Web Chat');
    return;
  }
  
  try {
    await window.electronAPI.startWebchat(url);
    alert('Web Chat подключен');
    
    const messages = await window.electronAPI.getWebchatMessages();
    webchatMessages = messages || [];
    displayWebchatMessages();
  } catch (err) {
    alert('Ошибка подключения к Web Chat: ' + err.message);
  }
}

async function stopWebchatClient() {
  try {
    await window.electronAPI.stopWebchat();
    alert('Web Chat отключен');
  } catch (err) {
    alert('Ошибка отключения Web Chat: ' + err.message);
  }
}

function renderMessageList(messages, contentElement, emptyMessage) {
  if (messages.length === 0) {
    contentElement.innerHTML = `<p class="placeholder">${emptyMessage}</p>`;
    return;
  }
  
  let html = '';
  messages.forEach(msg => {
    const date = new Date(msg.timestamp);
    const timeStr = date.toLocaleTimeString('ru-RU');
    html += `<div class="telegram-message">`;
    html += `<div class="telegram-header">${msg.from} | ${timeStr}</div>`;
    
    if (msg.photo) {
      html += `<div class="telegram-photo"><img src="${msg.photo}" alt="Photo" /></div>`;
    }
    
    if (msg.text) {
      html += `<div class="telegram-text">${formatTelegramText(msg.text, msg.entities)}</div>`;
    }
    
    html += `</div>`;
  });
  
  contentElement.innerHTML = html;
  contentElement.parentElement.scrollTop = contentElement.parentElement.scrollHeight;
}

function displayTelegramMessages() {
  renderMessageList(telegramMessages, elements.telegramContent, 'Сообщения из Telegram появятся здесь...');
}

function displayWebchatMessages() {
  renderMessageList(webchatMessages, elements.webchatContent, 'Сообщения из Web Chat появятся здесь...');
}

function formatTelegramText(text, entities = []) {
  if (!entities || entities.length === 0) {
    // Если нет entities, используем простое форматирование
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    text = text.replace(/\n/g, '<br>');
    return '<div class="md"><p>' + text + '</p></div>';
  }
  
  // Сортируем entities по offset
  const sortedEntities = [...entities].sort((a, b) => a.offset - b.offset);
  
  let result = '';
  let lastOffset = 0;
  
  sortedEntities.forEach(entity => {
    // Добавляем текст до entity
    if (entity.offset > lastOffset) {
      const beforeText = text.substring(lastOffset, entity.offset);
      result += escapeHtml(beforeText);
    }
    
    // Получаем текст entity
    const entityText = text.substring(entity.offset, entity.offset + entity.length);
    
    // Форматируем в зависимости от типа
    switch (entity.type) {
      case 'pre':
      case 'code':
        // Для блоков кода сохраняем все пробелы и переносы
        const escapedCode = escapeHtml(entityText);
        if (entity.type === 'pre') {
          const lang = entity.language || 'text';
          result += '<pre><code class="lang-' + lang + '">' + escapedCode + '</code></pre>';
        } else {
          result += '<code>' + escapedCode + '</code>';
        }
        break;
      case 'bold':
        result += '<strong>' + escapeHtml(entityText) + '</strong>';
        break;
      case 'italic':
        result += '<em>' + escapeHtml(entityText) + '</em>';
        break;
      case 'underline':
        result += '<u>' + escapeHtml(entityText) + '</u>';
        break;
      case 'strikethrough':
        result += '<s>' + escapeHtml(entityText) + '</s>';
        break;
      case 'url':
      case 'text_link':
        const url = entity.url || entityText;
        result += '<a href="' + escapeHtml(url) + '" target="_blank">' + escapeHtml(entityText) + '</a>';
        break;
      default:
        result += escapeHtml(entityText);
    }
    
    lastOffset = entity.offset + entity.length;
  });
  
  // Добавляем оставшийся текст
  if (lastOffset < text.length) {
    result += escapeHtml(text.substring(lastOffset));
  }
  
  // Заменяем переносы строк на <br> (кроме тех, что внутри <pre>)
  result = result.replace(/\n(?![^<]*<\/pre>)/g, '<br>');
  
  return '<div class="md">' + result + '</div>';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function navigateTelegram(direction) {
  // Не используется больше, но оставляем для совместимости
}

function updateTelegramIndicator() {
  // Не используется больше, но оставляем для совместимости
}

// Initialize app
init();

