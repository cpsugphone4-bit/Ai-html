// script.js - VERSI LENGKAP dengan Upload & Model Switch

// State Management
let chats = {};
let currentChatId = null;
let currentModel = 'deepseek';
let isTyping = false;
let customSystemPrompt = '';

// Default system prompts
const defaultSystemPrompt = 'Kamu adalah AI Assistant yang membantu. Jawab dalam bahasa Indonesia.';

// Preset prompts
const promptPresets = {
    'coding': `Kamu adalah Expert Programmer dengan kemampuan:
- Generate complete, production-ready code
- Explain complex concepts dengan simple
- Debug dan optimize code efficiently
- Follow best practices dan clean code principles
- Support semua bahasa pemrograman

Selalu berikan:
✅ Full working code (bukan snippet)
✅ Detailed comments dalam bahasa Indonesia
✅ Error handling yang proper
✅ Example usage

Jawab dalam bahasa Indonesia.`,
    
    'creative': `Kamu adalah Creative Writer yang berbakat:
- Menulis cerita, artikel, dan konten engaging
- Gaya bahasa yang menarik dan variatif
- Kreatif dan imajinatif
- Sesuaikan tone dengan request user
- Bisa formal atau casual

Selalu berikan:
✅ Konten original dan menarik
✅ Struktur yang rapi
✅ Grammar yang benar
✅ Emotional impact yang kuat

Jawab dalam bahasa Indonesia yang indah.`,
    
    'teacher': `Kamu adalah Patient Teacher yang sabar:
- Jelaskan konsep dari basic hingga advanced
- Gunakan analogi dan contoh real-world
- Step-by-step instructions yang jelas
- Encourage learning dengan positif
- Adaptif dengan level pemahaman user

Selalu berikan:
✅ Penjelasan yang mudah dipahami
✅ Contoh praktis dan relevan
✅ Visual description jika perlu
✅ Practice exercises

Jawab dengan sabar dalam bahasa Indonesia.`,
    
    'analyst': `Kamu adalah Data Analyst Expert:
- Analisis data dengan mendalam
- Statistical reasoning yang kuat
- Visualisasi data yang insightful
- Actionable recommendations
- Critical thinking

Selalu berikan:
✅ Data-driven insights
✅ Clear methodology
✅ Visualisasi suggestions
✅ Practical conclusions

Jawab dalam bahasa Indonesia dengan data-driven approach.`
};

// Initialize
function init() {
    createNewChat();
    loadSystemPrompt();
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
            'deepcoder': '💻',
            'mai-ds': '🔬',
            'hermes': '⚡',
            'gemini-flash': '⚡',
            'gemini-flash-exp': '🧪',
            'gemini-pro': '💎'
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
    
    // Show/hide prompt suggestions
    const promptSuggestions = document.getElementById('promptSuggestions');
    if (messages.length <= 1) {
        promptSuggestions.classList.remove('hidden');
    } else {
        promptSuggestions.classList.add('hidden');
    }
    
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
                const filePreview = msg.file.type.startsWith('image/') ? 
                    `<img src="${msg.file.url}" alt="${msg.file.name}" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 8px; display: block;">` :
                    msg.file.type.startsWith('video/') ?
                    `<video src="${msg.file.url}" controls style="max-width: 250px; max-height: 200px; border-radius: 8px; margin-bottom: 8px; display: block;"></video>` :
                    `<div class="file-icon">${msg.file.icon || '📄'} ${msg.file.name} (${(msg.file.size / 1024).toFixed(2)} KB)</div>`;
                
                content = `
                    <div class="file-attachment">
                        ${filePreview}
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

// Use prompt suggestion
function usePrompt(promptTemplate) {
    const input = document.getElementById('messageInput');
    input.value = promptTemplate;
    input.focus();
    
    // Auto resize textarea
    autoResize(input);
    
    // Highlight the placeholder text for easy editing
    setTimeout(() => {
        const bracketStart = promptTemplate.indexOf('[');
        const bracketEnd = promptTemplate.indexOf(']') + 1;
        if (bracketStart !== -1 && bracketEnd > bracketStart) {
            input.setSelectionRange(bracketStart, bracketEnd);
        }
    }, 0);
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

// Simple syntax highlighting
function highlightCode(code, language) {
    if (!language || language === 'text') {
        return code;
    }
    
    let highlighted = code;
    
    // JavaScript/TypeScript
    if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
        highlighted = highlighted
            .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|import|export|from|default|async|await|try|catch|throw|new)\b/g, '<span style="color: #569cd6">$1</span>')
            .replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span style="color: #569cd6">$1</span>')
            .replace(/(".*?"|'.*?'|`.*?`)/g, '<span style="color: #ce9178">$1</span>')
            .replace(/\/\/.*/g, '<span style="color: #6a9955">$&</span>')
            .replace(/\b(\d+)\b/g, '<span style="color: #b5cea8">$1</span>');
    }
    
    // Python
    if (language === 'python' || language === 'py') {
        highlighted = highlighted
            .replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|pass|break|continue|raise|assert|and|or|not|in|is|None|True|False)\b/g, '<span style="color: #569cd6">$1</span>')
            .replace(/(".*?"|'.*?'|"""[\s\S]*?""")/g, '<span style="color: #ce9178">$1</span>')
            .replace(/#.*/g, '<span style="color: #6a9955">$&</span>')
            .replace(/\b(\d+)\b/g, '<span style="color: #b5cea8">$1</span>');
    }
    
    // HTML
    if (language === 'html' || language === 'xml') {
        highlighted = highlighted
            .replace(/&lt;(\/?[\w-]+)/g, '<span style="color: #569cd6">&lt;$1</span>')
            .replace(/([\w-]+)=/g, '<span style="color: #9cdcfe">$1</span>=')
            .replace(/=(".*?"|'.*?')/g, '=<span style="color: #ce9178">$1</span>')
            .replace(/&gt;/g, '<span style="color: #569cd6">&gt;</span>');
    }
    
    // CSS
    if (language === 'css' || language === 'scss') {
        highlighted = highlighted
            .replace(/([.#]?[\w-]+)\s*{/g, '<span style="color: #d7ba7d">$1</span> {')
            .replace(/([\w-]+):/g, '<span style="color: #9cdcfe">$1</span>:')
            .replace(/:\s*([^;]+);/g, ': <span style="color: #ce9178">$1</span>;')
            .replace(/\/\*[\s\S]*?\*\//g, '<span style="color: #6a9955">$&</span>');
    }
    
    // JSON
    if (language === 'json') {
        highlighted = highlighted
            .replace(/"(.*?)":/g, '<span style="color: #9cdcfe">"$1"</span>:')
            .replace(/:\s*"(.*?)"/g, ': <span style="color: #ce9178">"$1"</span>')
            .replace(/:\s*(\d+)/g, ': <span style="color: #b5cea8">$1</span>')
            .replace(/:\s*(true|false|null)/g, ': <span style="color: #569cd6">$1</span>');
    }
    
    return highlighted;
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
    const matches = [];
    while ((match = codeBlockRegex.exec(text)) !== null) {
        matches.push({
            fullMatch: match[0],
            language: match[1] || 'text',
            code: match[2].trim(),
            index: match.index
        });
    }
    
    // Process dari belakang agar index tetap valid
    matches.reverse().forEach(match => {
        const codeId = `code-${Date.now()}-${codeBlockIndex++}`;
        const escapedCode = escapeHtml(match.code);
        const highlightedCode = highlightCode(escapedCode, match.language);
        
        const codeBlock = `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-language">${match.language}</span>
                    <button class="copy-code-btn" onclick="copyCode('${codeId}')" title="Salin kode">
                        <span class="copy-icon">📋</span>
                        <span class="copy-text">Salin</span>
                    </button>
                </div>
                <pre class="code-content"><code id="${codeId}" class="language-${match.language}">${highlightedCode}</code></pre>
            </div>
        `;
        
        processed = processed.substring(0, match.index) + codeBlock + processed.substring(match.index + match.fullMatch.length);
    });
    
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

    // Use custom system prompt or default
    const systemPromptToUse = customSystemPrompt || defaultSystemPrompt;

    const messagesToSend = [
        { 
            role: 'system', 
            content: systemPromptToUse
        },
        ...history,
        { 
            role: 'user', 
            content: userMessage 
        }
    ];

    try {
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
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.message) {
            throw new Error('Invalid response format from API');
        }
        
        return data.message;
    } catch (error) {
        console.error('API Error:', error);
        
        // User-friendly error messages
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        } else if (error.message.includes('not configured')) {
            throw new Error('API key belum dikonfigurasi. Hubungi administrator.');
        } else if (error.message.includes('rate limit')) {
            throw new Error('Terlalu banyak request. Coba lagi dalam beberapa saat.');
        } else if (error.message.includes('Unknown model')) {
            throw new Error(`Model "${currentModel}" tidak dikenali. Coba model lain.`);
        }
        
        throw error;
    }
}

// System Prompt Functions
function togglePromptEditor() {
    const editor = document.getElementById('promptEditor');
    editor.classList.toggle('show');
}

function loadSystemPrompt() {
    const saved = localStorage.getItem('customSystemPrompt');
    if (saved) {
        customSystemPrompt = saved;
        document.getElementById('systemPromptInput').value = saved;
    }
}

function saveSystemPrompt() {
    const input = document.getElementById('systemPromptInput');
    customSystemPrompt = input.value.trim();
    
    if (customSystemPrompt) {
        localStorage.setItem('customSystemPrompt', customSystemPrompt);
        alert('✅ System prompt berhasil disimpan!');
    } else {
        customSystemPrompt = '';
        localStorage.removeItem('customSystemPrompt');
        alert('✅ System prompt direset ke default!');
    }
    
    togglePromptEditor();
}

function resetSystemPrompt() {
    if (confirm('Reset system prompt ke default?')) {
        customSystemPrompt = '';
        localStorage.removeItem('customSystemPrompt');
        document.getElementById('systemPromptInput').value = '';
        alert('✅ System prompt direset ke default!');
    }
}

function usePreset(presetName) {
    const preset = promptPresets[presetName];
    if (preset) {
        document.getElementById('systemPromptInput').value = preset;
        customSystemPrompt = preset;
        localStorage.setItem('customSystemPrompt', preset);
        alert(`✅ Preset "${presetName}" berhasil diterapkan!`);
    }
}

// Custom Prompt Panel Functions
function toggleCustomPromptPanel() {
    const panel = document.getElementById('customPromptPanel');
    panel.classList.toggle('show');
    
    // Load current prompt
    const textarea = document.getElementById('customPromptTextarea');
    textarea.value = customSystemPrompt || '';
    
    updatePromptDisplay();
}

function applyCustomPrompt() {
    const textarea = document.getElementById('customPromptTextarea');
    const newPrompt = textarea.value.trim();
    
    if (newPrompt) {
        customSystemPrompt = newPrompt;
        localStorage.setItem('customSystemPrompt', newPrompt);
        alert('✅ Custom prompt berhasil diterapkan!');
    } else {
        customSystemPrompt = '';
        localStorage.removeItem('customSystemPrompt');
        alert('✅ Kembali ke default prompt!');
    }
    
    updatePromptDisplay();
    toggleCustomPromptPanel();
}

function clearCustomPrompt() {
    if (confirm('Hapus custom prompt dan kembali ke default?')) {
        customSystemPrompt = '';
        localStorage.removeItem('customSystemPrompt');
        document.getElementById('customPromptTextarea').value = '';
        alert('✅ Custom prompt dihapus!');
        updatePromptDisplay();
    }
}

function applyMiniPreset(presetName) {
    const preset = promptPresets[presetName];
    if (preset) {
        document.getElementById('customPromptTextarea').value = preset;
    }
}

function updatePromptDisplay() {
    const display = document.getElementById('currentPromptDisplay');
    if (customSystemPrompt) {
        const preview = customSystemPrompt.substring(0, 100) + (customSystemPrompt.length > 100 ? '...' : '');
        display.innerHTML = `<small><strong>Current:</strong> ${preview}</small>`;
    } else {
        display.innerHTML = '<small>Current: Default AI Assistant</small>';
    }
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
        'deepcoder': { icon: '💻', name: 'DeepCoder 14B' },
        'mai-ds': { icon: '🔬', name: 'MAI DS R1' },
        'hermes': { icon: '⚡', name: 'Hermes 3 405B' },
        'gemini-flash': { icon: '⚡', name: 'Gemini Flash' },
        'gemini-flash-exp': { icon: '🧪', name: 'Gemini Flash Exp' },
        'gemini-pro': { icon: '💎', name: 'Gemini Pro' }
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
function toggleAttachmentMenu() {
    const menu = document.getElementById('attachmentMenu');
    menu.classList.toggle('show');
}

function triggerFileUpload() {
    // Support semua tipe file
    document.getElementById('fileInput').click();
    toggleAttachmentMenu();
}

function triggerCamera() {
    // Langsung buka kamera untuk foto
    document.getElementById('cameraInput').click();
    toggleAttachmentMenu();
}

function triggerGallery() {
    // Buka galeri untuk pilih foto/video
    document.getElementById('galleryInput').click();
    toggleAttachmentMenu();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validasi ukuran (max 50MB untuk support video)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        alert('❌ File terlalu besar! Maksimal 50MB');
        return;
    }
    
    try {
        // Convert to base64
        const base64 = await fileToBase64(file);
        
        // Determine file type description
        let fileType = 'file';
        let fileIcon = '📄';
        if (file.type.startsWith('image/')) {
            fileType = 'gambar';
            fileIcon = '🖼️';
        } else if (file.type.startsWith('video/')) {
            fileType = 'video';
            fileIcon = '🎬';
        } else if (file.type.startsWith('audio/')) {
            fileType = 'audio';
            fileIcon = '🎵';
        } else if (file.type.includes('pdf')) {
            fileType = 'PDF';
            fileIcon = '📕';
        } else if (file.type.includes('document') || file.type.includes('word')) {
            fileType = 'dokumen';
            fileIcon = '📝';
        } else if (file.type.includes('sheet') || file.type.includes('excel')) {
            fileType = 'spreadsheet';
            fileIcon = '📊';
        } else if (file.type.includes('zip') || file.type.includes('rar')) {
            fileType = 'arsip';
            fileIcon = '🗜️';
        }
        
        // Create message with file
        const fileMsg = {
            id: Date.now(),
            type: 'user',
            text: `Saya mengirim ${fileType}: ${file.name}`,
            file: {
                name: file.name,
                type: file.type,
                size: file.size,
                url: base64,
                icon: fileIcon
            },
            timestamp: new Date().toISOString()
        };
        
        chats[currentChatId].messages.push(fileMsg);
        
        // Update title if first message
        if (chats[currentChatId].messages.length === 2) {
            chats[currentChatId].title = `${fileIcon} ${file.name.substring(0, 20)}`;
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
            } else if (file.type.includes('pdf')) {
                prompt = `Saya baru saja mengunggah dokumen PDF "${file.name}". Bisakah kamu membantu dengan dokumen ini?`;
            } else {
                prompt = `Saya baru saja mengunggah file "${file.name}" (${fileType}, ${(file.size / 1024).toFixed(2)} KB). Bisakah kamu membantu?`;
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
        // Close model dropdown
        if (!e.target.closest('.model-selector')) {
            document.getElementById('modelDropdown').classList.remove('show');
        }
        
        // Close attachment menu
        if (!e.target.closest('.input-wrapper') && !e.target.closest('.plus-btn')) {
            const menu = document.getElementById('attachmentMenu');
            if (menu) menu.classList.remove('show');
        }
    });
    
    init();
    
    // Auto refresh untuk fix layout prompt suggestions
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
});
