// script.js - VERSI LENGKAP dengan Upload & Model Switch

// State Management
let chats = {};
let currentChatId = null;
let currentModel = 'deepseek';
let isTyping = false;

// Initialize
function init() {
    createNewChat();
}

// Create New Chat
function createNewChat() {
    const chatId = Date.now();
    chats[chatId] = {
        id: chatId,
        title: 'Chat Baru',
        date: new Date().toISOString(),
        model: currentModel,
        messages: [
            {
                id: 1,
                type: 'bot',
                text: 'Halo! Saya asisten AI Anda. Ada yang bisa saya bantu hari ini?',
                timestamp: new Date().toISOString()
            }
        ]
    };
    currentChatId = chatId;
    renderChatList();
    renderMessages();
}

// Render Chat List
function renderChatList() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';
    
    Object.values(chats).forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.onclick = () => switchChat(chat.id);
        
        const date = new Date(chat.date);
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const modelIcons = {
            'deepseek': '🧠',
            'dolphin': '🐬',
            'gemini': '✨'
        };
        
        chatItem.innerHTML = `
            <div class="chat-title">${modelIcons[chat.model] || '🤖'} ${chat.title}</div>
            <div class="chat-date">${dateStr}</div>
        `;
        
        chatList.appendChild(chatItem);
    });
}

// Switch Chat
function switchChat(chatId) {
    currentChatId = chatId;
    currentModel = chats[chatId].model;
    updateModelDisplay();
    renderChatList();
    renderMessages();
}

// Render Messages
function renderMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    const messages = chats[currentChatId].messages;
    
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.type}`;
        
        if (msg.type === 'bot') {
            // Process message untuk detect code blocks
            const processedText = processMessageWithCode(msg.text);
            
            messageDiv.innerHTML = `
                <div class="bot-avatar">✨</div>
                <div class="message-content">${processedText}</div>
            `;
        } else if (msg.type === 'system') {
            messageDiv.className = 'message system';
            messageDiv.innerHTML = `
                <div class="system-message">${msg.text}</div>
            `;
        } else if (msg.type === 'user') {
            let content = msg.text;
            
            // Jika ada file attachment
            if (msg.file) {
                content = `
                    <div class="file-attachment">
                        ${msg.file.type.startsWith('image/') ? 
                            `<img src="${msg.file.url}" alt="Uploaded image" style="max-width: 200px; border-radius: 8px; margin-bottom: 8px;">` :
                            `<div class="file-icon">📎 ${msg.file.name}</div>`
                        }
                    </div>
                    ${msg.text}
                `;
            }
            
            messageDiv.innerHTML = `
                <div class="message-content">${content}</div>
            `;
        }
        
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
}

// Process message untuk detect dan format code blocks
function processMessageWithCode(text) {
    // Escape HTML untuk keamanan
    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    // Detect code blocks dengan ```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    let processed = text;
    let match;
    let codeBlockIndex = 0;
    
    // Replace code blocks dengan formatted version
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const language = match[1] || 'text';
        const code = match[2].trim();
        const codeId = `code-${Date.now()}-${codeBlockIndex++}`;
        
        const codeBlock = `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-language">${language}</span>
                    <button class="copy-code-btn" onclick="copyCode('${codeId}')" title="Salin kode">
                        <span class="copy-icon">📋</span>
                        <span class="copy-text">Salin</span>
                    </button>
                </div>
                <pre class="code-content"><code id="${codeId}" class="language-${language}">${escapeHtml(code)}</code></pre>
            </div>
        `;
        
        processed = processed.replace(match[0], codeBlock);
    }
    
    // Detect inline code dengan `code`
    const inlineCodeRegex = /`([^`]+)`/g;
    processed = processed.replace(inlineCodeRegex, '<code class="inline-code">$1</code>');
    
    // Convert newlines ke <br> untuk teks biasa (kecuali di dalam code blocks)
    const parts = processed.split(/(<div class="code-block">[\s\S]*?<\/div>)/);
    processed = parts.map((part, index) => {
        if (index % 2 === 0) {
            // Bukan code block, convert newlines
            return part.replace(/\n/g, '<br>');
        }
        return part;
    }).join('');
    
    return processed;
}

// Copy code function
function copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    const code = codeElement.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        // Visual feedback
        const btn = event.target.closest('.copy-code-btn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Tersalin!</span>';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        alert('Gagal menyalin: ' + err);
    });
}

// Send Message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || isTyping) return;
    
    // Add user message
    const userMsg = {
        id: Date.now(),
        type: 'user',
        text: text,
        timestamp: new Date().toISOString()
    };
    
    chats[currentChatId].messages.push(userMsg);
    
    // Update title if first message
    if (chats[currentChatId].messages.length === 2) {
        chats[currentChatId].title = text.substring(0, 30);
    }
    
    input.value = '';
    input.style.height = 'auto';
    renderMessages();
    renderChatList();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await getAIResponse(text);
        
        const botMsg = {
            id: Date.now() + 1,
            type: 'bot',
            text: response,
            timestamp: new Date().toISOString()
        };
        
        chats[currentChatId].messages.push(botMsg);
        hideTypingIndicator();
        renderMessages();
    } catch (error) {
        hideTypingIndicator();
        const errorMsg = {
            id: Date.now() + 1,
            type: 'bot',
            text: `❌ Maaf, terjadi kesalahan: ${error.message}`,
            timestamp: new Date().toISOString()
        };
        chats[currentChatId].messages.push(errorMsg);
        renderMessages();
    }
}

// Get AI Response
async function getAIResponse(userMessage) {
    const messages = chats[currentChatId].messages;
    const history = messages.slice(-6).filter(m => m.type !== 'system').map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text
    }));

    const messagesToSend = [
        { 
            role: 'system', 
            content: 'Kamu adalah AI Assistant yang membantu. Jawab dalam bahasa Indonesia.' 
        },
        ...history,
        { 
            role: 'user', 
            content: userMessage 
        }
    ];

    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: messagesToSend,
            model: currentModel
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
    }

    const data = await response.json();
    return data.message;
}

// Show/Hide Typing
function showTypingIndicator() {
    isTyping = true;
    const container = document.getElementById('messagesContainer');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="bot-avatar">✨</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// Auto Resize Textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Handle Enter Key
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const mainChat = document.getElementById('mainChat');
    const swipeIndicator = document.getElementById('swipeIndicator');
    const isDesktop = window.innerWidth > 768;
    
    sidebar.classList.toggle('show');
    
    if (isDesktop) {
        mainChat.classList.toggle('sidebar-open');
    } else {
        overlay.classList.toggle('show');
    }
    
    if (sidebar.classList.contains('show')) {
        swipeIndicator.classList.add('hidden');
    } else {
        swipeIndicator.classList.remove('hidden');
    }
}

// Touch/Swipe handling
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const sidebar = document.getElementById('sidebar');
    const swipeThreshold = 50;
    
    if (touchStartX < 50 && touchEndX - touchStartX > swipeThreshold) {
        if (!sidebar.classList.contains('show')) {
            toggleSidebar();
        }
    }
    
    if (touchStartX - touchEndX > swipeThreshold) {
        if (sidebar.classList.contains('show')) {
            toggleSidebar();
        }
    }
}

// Model Selector Functions
function toggleModelDropdown() {
    document.getElementById('modelDropdown').classList.toggle('show');
}

function updateModelDisplay() {
    const modelInfo = {
        'deepseek': { icon: '🧠', name: 'DeepSeek Chat' },
        'dolphin': { icon: '🐬', name: 'Dolphin Mistral' },
        'gemini': { icon: '✨', name: 'Gemini Pro' }
    };
    
    const info = modelInfo[currentModel];
    document.getElementById('currentModelIcon').textContent = info.icon;
    document.getElementById('currentModelName').textContent = info.name;
}

async function selectModel(model, icon, name) {
    const oldModel = currentModel;
    currentModel = model;
    
    // Update chat model
    chats[currentChatId].model = model;
    
    // Update display
    updateModelDisplay();
    
    // Update active state
    document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    toggleModelDropdown();
    
    // Add system message tanpa hapus chat
    const systemMsg = {
        id: Date.now(),
        type: 'system',
        text: `✨ Model diubah ke ${name}`,
        timestamp: new Date().toISOString()
    };
    
    chats[currentChatId].messages.push(systemMsg);
    renderMessages();
    renderChatList();
}

// File Upload Functions
function triggerFileUpload() {
    document.getElementById('fileInput').click();
}

function triggerCamera() {
    document.getElementById('cameraInput').click();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validasi ukuran (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('❌ File terlalu besar! Maksimal 10MB');
        return;
    }
    
    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
        alert('❌ Tipe file tidak didukung!');
        return;
    }
    
    try {
        // Convert to base64
        const base64 = await fileToBase64(file);
        
        // Create message with file
        const fileMsg = {
            id: Date.now(),
            type: 'user',
            text: `Saya mengirim file: ${file.name}`,
            file: {
                name: file.name,
                type: file.type,
                size: file.size,
                url: base64
            },
            timestamp: new Date().toISOString()
        };
        
        chats[currentChatId].messages.push(fileMsg);
        
        // Update title if first message
        if (chats[currentChatId].messages.length === 2) {
            chats[currentChatId].title = `File: ${file.name.substring(0, 20)}`;
        }
        
        renderMessages();
        renderChatList();
        
        // Get AI response about the file
        showTypingIndicator();
        
        try {
            let prompt = '';
            if (file.type.startsWith('image/')) {
                prompt = `Saya baru saja mengunggah gambar bernama "${file.name}". Bisakah kamu membantu menganalisis atau memberikan informasi tentang gambar ini?`;
            } else if (file.type.startsWith('video/')) {
                prompt = `Saya baru saja mengunggah video bernama "${file.name}" dengan ukuran ${(file.size / 1024 / 1024).toFixed(2)} MB. Bisakah kamu memberikan informasi tentang video ini?`;
            } else {
                prompt = `Saya baru saja mengunggah file "${file.name}" (${file.type}). Bisakah kamu membantu?`;
            }
            
            const response = await getAIResponse(prompt);
            
            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: response,
                timestamp: new Date().toISOString()
            };
            
            chats[currentChatId].messages.push(botMsg);
            hideTypingIndicator();
            renderMessages();
        } catch (error) {
            hideTypingIndicator();
            const errorMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: `❌ Maaf, terjadi kesalahan: ${error.message}`,
                timestamp: new Date().toISOString()
            };
            chats[currentChatId].messages.push(errorMsg);
            renderMessages();
        }
        
    } catch (error) {
        alert('❌ Gagal memproses file: ' + error.message);
    }
    
    // Reset input
    event.target.value = '';
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('overlay').onclick = toggleSidebar;
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.model-selector')) {
            document.getElementById('modelDropdown').classList.remove('show');
        }
    });
    
    init();
});
