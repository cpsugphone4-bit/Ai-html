// script.js - VERSI AMAN
// File ini TETAP ADA, tapi TIDAK ADA API KEYS lagi!

// State Management
let chats = {};
let currentChatId = null;
let currentModel = 'deepseek';
let isTyping = false;

// ============================================
// ❌ HAPUS INI (API KEYS TIDAK BOLEH DI SINI!)
// ============================================
// const OPENROUTER_API_KEY = 'sk-or-v1-xxx'; ❌ HAPUS!
// const GEMINI_API_KEY = 'AIzaSyxxx'; ❌ HAPUS!

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
        
        chatItem.innerHTML = `
            <div class="chat-title">✨ ${chat.title}</div>
            <div class="chat-date">${dateStr}</div>
        `;
        
        chatList.appendChild(chatItem);
    });
}

// Switch Chat
function switchChat(chatId) {
    currentChatId = chatId;
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
            messageDiv.innerHTML = `
                <div class="bot-avatar">✨</div>
                <div class="message-content">${msg.text}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">${msg.text}</div>
            `;
        }
        
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
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

// ============================================
// ✅ FUNGSI INI YANG DIUBAH!
// Sekarang panggil /api/chat (serverless function)
// BUKAN langsung ke OpenRouter/Gemini
// ============================================
async function getAIResponse(userMessage) {
    const messages = chats[currentChatId].messages;
    const history = messages.slice(-6).filter(m => m.type !== 'system').map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text
    }));

    // Siapkan messages untuk dikirim
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

    // ✅ PANGGIL SERVERLESS FUNCTION, BUKAN LANGSUNG KE API!
    // Ini akan ke /api/chat.js yang ada di server Vercel
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: messagesToSend,
            model: currentModel  // 'deepseek', 'dolphin', atau 'gemini'
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
    }

    const data = await response.json();
    return data.message;  // Return response dari server
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

// Close sidebar when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('overlay').onclick = toggleSidebar;
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.model-selector')) {
            document.getElementById('modelDropdown').classList.remove('show');
        }
    });
    
    init();
});

// Model Selector
function toggleModelDropdown() {
    document.getElementById('modelDropdown').classList.toggle('show');
}

function selectModel(model, icon, name, desc) {
    currentModel = model;
    document.getElementById('currentModelIcon').textContent = icon;
    document.getElementById('currentModelName').textContent = name;
    
    document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    toggleModelDropdown();
}

/*
PENJELASAN PERUBAHAN:

SEBELUM (Tidak Aman):
- Ada API keys di file ini
- Langsung fetch ke OpenRouter/Gemini
- User bisa lihat API keys di browser

SESUDAH (Aman):
- TIDAK ADA API keys di file ini
- Fetch ke /api/chat (serverless function)
- API keys tersimpan di server Vercel
- User TIDAK BISA lihat API keys
*/