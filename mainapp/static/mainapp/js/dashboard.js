// dashboard.js - Fixed AI Response Formatting and Sidebar Toggle with ChatGPT-style Image Upload
// DOM Elements
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");
const profileIcon = document.getElementById("profileIcon");
const profileMenu = document.getElementById("profileMenu");
const quickActionButtons = document.querySelectorAll(".quick-action-btn");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// Image Upload Elements
const imageUploadBtn = document.getElementById('imageUploadBtn');
const imageInput = document.getElementById('imageInput');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const chatImagePreview = document.getElementById('chatImagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');

// Image upload variables
let currentImageFile = null;
let currentImageBase64 = null;

// Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyCjXbGtcZ_uKzZN90-Tufqe4Tq1NuNSfaE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

let isTyping = false;
let messageHistory = [];
let currentSessionId = null;
let currentBackendChatId = null;
let typewriterTimeout = null;

// CSRF Token function
function getCSRFToken() {
    return document.querySelector('input[name="csrfmiddlewaretoken"]')?.value ||
           document.querySelector('meta[name="csrf-token"]')?.content;
}

// Get User Profile Data
function getUserProfileData() {
    const profileElement = document.getElementById('userProfileData');
    
    if (!profileElement) {
        return {
            firstName: 'User',
            lastName: '',
            email: '',
            phone: '',
            gender: 'Not specified',
            bloodType: 'Not specified',
            height: 'Not specified',
            weight: 'Not specified',
            allergies: 'None',
            medications: 'None',
            dateOfBirth: 'Not specified',
            emergencyName: 'Not specified',
            emergencyRelation: 'Not specified',
            emergencyPhone: 'Not specified',
            age: 'Not specified',
            bmi: 'Not calculated'
        };
    }
    
    // Calculate age
    let age = 'Not specified';
    if (profileElement.dataset.dateOfBirth && profileElement.dataset.dateOfBirth !== 'Not specified' && profileElement.dataset.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(profileElement.dataset.dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
    }
    
    // Calculate BMI
    let bmi = 'Not calculated';
    if (profileElement.dataset.height && profileElement.dataset.weight && 
        profileElement.dataset.height !== 'Not specified' && profileElement.dataset.weight !== 'Not specified') {
        const heightM = parseInt(profileElement.dataset.height) / 100;
        const weightKg = parseInt(profileElement.dataset.weight);
        const bmiValue = weightKg / (heightM * heightM);
        bmi = bmiValue.toFixed(1);
    }
    
    return {
        firstName: profileElement.dataset.firstName || 'User',
        lastName: profileElement.dataset.lastName || '',
        email: profileElement.dataset.email || '',
        phone: profileElement.dataset.phone || 'Not specified',
        gender: profileElement.dataset.gender || 'Not specified',
        bloodType: profileElement.dataset.bloodType || 'Not specified',
        height: profileElement.dataset.height || 'Not specified',
        weight: profileElement.dataset.weight || 'Not specified',
        allergies: profileElement.dataset.allergies || 'None',
        medications: profileElement.dataset.medications || 'None',
        dateOfBirth: profileElement.dataset.dateOfBirth || 'Not specified',
        emergencyName: profileElement.dataset.emergencyName || 'Not specified',
        emergencyRelation: profileElement.dataset.emergencyRelation || 'Not specified',
        emergencyPhone: profileElement.dataset.emergencyPhone || 'Not specified',
        age: age,
        bmi: bmi
    };
}

// Generate System Prompt
function getSystemPrompt() {
    const profile = getUserProfileData();
    
    // Calculate age from date of birth
    let age = 'Not specified';
    if (profile.dateOfBirth !== 'Not specified') {
        const today = new Date();
        const birthDate = new Date(profile.dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
    }
    
    // Calculate BMI if height and weight are available
    let bmi = 'Not specified';
    let bmiCategory = '';
    if (profile.height !== 'Not specified' && profile.weight !== 'Not specified') {
        const heightM = parseInt(profile.height) / 100;
        const weightKg = parseInt(profile.weight);
        const bmiValue = weightKg / (heightM * heightM);
        bmi = bmiValue.toFixed(1);
        
        if (bmiValue < 18.5) {
            bmiCategory = 'Underweight';
        } else if (bmiValue < 25) {
            bmiCategory = 'Normal';
        } else if (bmiValue < 30) {
            bmiCategory = 'Overweight';
        } else {
            bmiCategory = 'Obese';
        }
    }
    
    return `You are MediTrack+, an AI Healthcare Assistant integrated with the user's COMPLETE health profile.

COMPLETE USER HEALTH PROFILE:
- Full Name: ${profile.firstName} ${profile.lastName}
- Email: ${profile.email}
- Phone: ${profile.phone}
- Gender: ${profile.gender}
- Date of Birth: ${profile.dateOfBirth} (Age: ${age})
- Blood Type: ${profile.bloodType}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- BMI: ${bmi} ${bmiCategory ? '(' + bmiCategory + ')' : ''}
- Allergies: ${profile.allergies}
- Current Medications: ${profile.medications}
- Emergency Contact: ${profile.emergencyName} (${profile.emergencyRelation}) - ${profile.emergencyPhone}

IMPORTANT INSTRUCTIONS:
1. You MUST reference the user's COMPLETE health profile when relevant to their questions
2. Consider ALL aspects: age, gender, BMI, blood type, medications, allergies, etc.
3. When analyzing images that the user sends, consider their health profile for personalized insights
4. When asked about specific health concerns, factor in their age, gender, BMI, and existing conditions
5. If their profile says "Not specified" or "None", ask them to update their profile for better assistance
6. You are NOT a real doctor. Always advise consulting healthcare professionals for serious concerns
7. Format your responses with proper markdown (use **bold**, *italic*, ### Headers, - lists, etc.)
8. Ask them to scale the health issue from 1-10 scale for understanding and responding better.
9. Consider age-appropriate recommendations (pediatric, adult, geriatric)
10. Consider gender-specific health concerns when relevant
11. Don't greet for every response
12. Don't say the information over multiple times.

CAPABILITIES:
1. Text-based health advice and symptom checking
2. **Image analysis** - Users can upload images (prescriptions, skin conditions, medical reports) and ask questions about them
3. Medication reminders and interactions
4. Age-specific health guidance
5. Gender-specific health concerns
6. BMI-based weight management advice
7. Wellness tips

IMPORTANT: When a user uploads an image with a question, analyze the image AND answer their specific question while considering their health profile.

Remember to personalize responses based on ALL available information in their profile.

How can I assist you with your health needs today?`;
}

// Chat History Manager
class ChatHistoryManager {
    constructor() {
        this.currentChatId = null;
        this.currentSessionId = Date.now().toString();
        this.chats = (JSON.parse(localStorage.getItem('meditrack_chats')) || []).filter(chat => 
            chat && chat.id && chat.title && chat.title !== 'undefined' && chat.title !== 'null'
        );
        this.init();
    }

    init() {
        this.loadChatHistory();
        this.setupEventListeners();
        
        if (this.chats.length === 0) {
            this.createNewChat();
        } else {
            const mostRecentChat = this.chats[0];
            this.currentChatId = mostRecentChat.id;
            this.loadChat(mostRecentChat.id);
        }
    }

    createNewChat(firstMessage = null) {
        this.currentSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        window.currentSessionId = this.currentSessionId;
        
        const emptyChat = this.chats.find(chat => 
            chat.messages && chat.messages.length === 0
        );
        
        if (emptyChat && !firstMessage) {
            this.currentChatId = emptyChat.id;
            this.loadChat(emptyChat.id);
            return emptyChat.id;
        }
        
        const chatId = Date.now().toString();
        const title = firstMessage ? 
            this.generateChatTitle(firstMessage) : 
            'New Conversation';
        
        const newChat = {
            id: chatId,
            sessionId: this.currentSessionId,
            title: title,
            preview: firstMessage || 'Start a conversation...',
            timestamp: new Date().toISOString(),
            messages: []
        };

        this.chats.unshift(newChat);
        this.currentChatId = chatId;
        this.saveChats();
        this.addChatToSidebar(newChat);
        
        if (!firstMessage) {
            this.clearChatDisplay();
        }
        
        return chatId;
    }

    generateChatTitle(message) {
        const cleanMessage = message.trim();
        const words = cleanMessage.split(' ').slice(0, 4).join(' ');
        return words.length < cleanMessage.length ? words + '...' : words;
    }

    addMessage(role, content, imageBase64 = null) {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat) {
            const messageObj = { role, content, timestamp: new Date().toISOString() };
            if (imageBase64) {
                messageObj.image = imageBase64;
            }
            chat.messages.push(messageObj);
            
            if (role === 'user') {
                chat.preview = content.length > 40 ? content.substring(0, 40) + '...' : content;
                
                if (chat.messages.filter(m => m.role === 'user').length === 1) {
                    chat.title = this.generateChatTitle(content);
                }
            }
            
            chat.timestamp = new Date().toISOString();
            this.saveChats();
            this.updateChatInSidebar(chat);
        }
    }

    loadChatHistory() {
        const chatList = document.getElementById('chatHistoryList');
        if (!chatList) return;
        
        chatList.innerHTML = '';
        
        this.chats.slice(0, 10).forEach(chat => {
            if (chat && chat.title && chat.title !== 'undefined' && chat.title !== 'null') {
                this.addChatToSidebar(chat);
            }
        });
    }

    addChatToSidebar(chat) {
        const chatList = document.getElementById('chatHistoryList');
        if (!chatList || !chat || !chat.id || !chat.title) return;
        
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-history-item';
        if (chat.id === this.currentChatId) {
            chatItem.classList.add('active');
        }
        chatItem.dataset.chatId = chat.id;
        
        chatItem.innerHTML = `
            <div class="chat-item-content">
                <h4 class="chat-title">${chat.title}</h4>
                <p class="chat-preview">${chat.preview || 'No messages yet'}</p>
            </div>
            <button class="delete-chat-btn" data-chat-id="${chat.id}">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        
        const deleteBtn = chatItem.querySelector('.delete-chat-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteChat(chat.id, deleteBtn);
        });
        
        chatItem.addEventListener('click', () => {
            this.loadChat(chat.id);
            hideSidebar();
        });
        
        chatList.appendChild(chatItem);
    }

    updateChatInSidebar(chat) {
        const chatItem = document.querySelector(`[data-chat-id="${chat.id}"]`);
        if (chatItem) {
            const titleElement = chatItem.querySelector('.chat-title');
            const previewElement = chatItem.querySelector('.chat-preview');
            
            if (titleElement) titleElement.textContent = chat.title;
            if (previewElement) previewElement.textContent = chat.preview || 'No messages yet';
        }
    }

    loadChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;

        this.currentChatId = chatId;
        this.currentSessionId = chat.sessionId;
        window.currentSessionId = this.currentSessionId;
        
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (activeItem) activeItem.classList.add('active');

        this.displayChatMessages(chat.messages);
    }

    displayChatMessages(messages) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }
        
        messages.forEach(msg => {
            if (msg.role === 'user') {
                if (msg.image) {
                    this.displayMessageWithImage('user', msg.content, msg.image);
                } else {
                    this.displayMessage('user', msg.content);
                }
            } else {
                this.displayBotMessageStatic(msg.content);
            }
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    displayMessage(role, content) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = role === 'user' ? 
            `<div class="message-avatar user">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9" stroke-width="1.5"/>
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M6 20c1.5-3 4.5-3 6 0 1.5-3 4.5-3 6 0"/>
                </svg>
            </div>` :
            `<div class="message-avatar bot">
              <svg class="logo-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v6c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-6z"/>
              </svg>
            </div>`;
        
        messageDiv.innerHTML = avatar + `<div class="message-bubble ${role}"></div>`;
        messagesContainer.appendChild(messageDiv);
        
        const bubble = messageDiv.querySelector('.message-bubble');
        
        if (role === 'user') {
            bubble.innerHTML = this.formatUserMessageContent(content);
        } else {
            this.typewriterEffect(bubble, content);
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    displayMessageWithImage(role, content, imageBase64) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = role === 'user' ? 
            `<div class="message-avatar user">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9" stroke-width="1.5"/>
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M6 20c1.5-3 4.5-3 6 0 1.5-3 4.5-3 6 0"/>
                </svg>
            </div>` :
            `<div class="message-avatar bot">
              <svg class="logo-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v6c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-6z"/>
              </svg>
            </div>`;
        
        messageDiv.innerHTML = avatar + `<div class="message-bubble ${role}"></div>`;
        messagesContainer.appendChild(messageDiv);
        
        const bubble = messageDiv.querySelector('.message-bubble');
        
        // Add image to bubble
        const imageHtml = `<img src="${imageBase64}" class="message-image" onclick="openFullscreenImage('${imageBase64}')" alt="Uploaded image">`;
        const textHtml = content ? `<p style="margin: 8px 0 0 0; color: #ffffff;">${this.escapeHtml(content)}</p>` : '';
        
        bubble.innerHTML = imageHtml + textHtml;
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    displayBotMessageStatic(content) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        const avatar = `<div class="message-avatar bot">
            <svg class="logo-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v6c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-6z"/>
            </svg>
        </div>`;
        
        const formattedContent = this.formatMessageContent(content);
        messageDiv.innerHTML = avatar + `<div class="message-bubble bot">${formattedContent}</div>`;
        messagesContainer.appendChild(messageDiv);
    }

    formatUserMessageContent(content) {
        let formatted = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        return `<p style="margin: 0; line-height: 1.5; color: #ffffff;">${formatted.replace(/\n/g, '<br>')}</p>`;
    }

    typewriterEffect(element, text, speed = 15) {
        // Clear any existing timeout
        if (typewriterTimeout) {
            clearTimeout(typewriterTimeout);
            typewriterTimeout = null;
        }
        
        // Clear the element first
        element.innerHTML = '';
        
        // Store the complete text for final formatting
        const completeText = text;
        
        let i = 0;
        let currentHtml = '';
        
        // Simple character-by-character typing
        const type = () => {
            if (i < completeText.length) {
                // Get the next character
                const char = completeText.charAt(i);
                
                // Append the character to current HTML
                currentHtml += char;
                element.innerHTML = currentHtml;
                i++;
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Schedule next character
                typewriterTimeout = setTimeout(type, speed);
            } else {
                // Typing complete - format the entire message with proper markdown
                // But wait a tiny moment to ensure all characters are rendered
                setTimeout(() => {
                    const finalFormatted = chatManager.formatMessageContent(completeText);
                    element.innerHTML = finalFormatted;
                    typewriterTimeout = null;
                    
                    // Scroll to bottom again after formatting
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 50);
            }
        };
        
        // Start typing
        type();
    }

    formatMessageContent(content) {
        let formatted = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        formatted = formatted
            .replace(/^#####\s+(.+)$/gm, '<h5 style="margin: 12px 0 6px 0; color: #1976d2; font-weight: 600;">$1</h5>')
            .replace(/^####\s+(.+)$/gm, '<h4 style="margin: 12px 0 6px 0; color: #1976d2; font-weight: 600;">$1</h4>')
            .replace(/^###\s+(.+)$/gm, '<h3 style="margin: 14px 0 8px 0; color: #0d47a1; font-weight: 600; border-bottom: 1px solid rgba(25,118,210,0.2); padding-bottom: 4px;">$1</h3>')
            .replace(/^##\s+(.+)$/gm, '<h2 style="margin: 16px 0 10px 0; color: #0d47a1; font-weight: 700; font-size: 1.3rem;">$1</h2>')
            .replace(/^#\s+(.+)$/gm, '<h1 style="margin: 18px 0 12px 0; color: #0d47a1; font-weight: 700; font-size: 1.5rem;">$1</h1>')
            
            .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #1976d2; font-weight: 600;">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em style="font-style: italic; color: #455a64;">$1</em>')
            
            .replace(/^\s*[-*]\s+(.+)$/gm, '<li style="margin: 4px 0 4px 0; display: flex; align-items: flex-start;"><span style="color: #1976d2; margin-right: 8px;">•</span><span>$1</span></li>')
            .replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li style="margin: 4px 0 4px 0; display: flex; align-items: flex-start;"><span style="color: #1976d2; font-weight: 500; margin-right: 8px; min-width: 20px;">$1.</span><span>$2</span></li>')
            
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\n/g, '<br style="line-height: 1.3;">');
        
        formatted = formatted.replace(/(<li.*?>.*?<\/li>(<br.*?>)?)+/g, function(match) {
            return '<ul style="margin: 6px 0 8px 0; padding-left: 0; list-style: none;">' + 
                   match.replace(/<br.*?><\/li>/g, '</li>').replace(/<br.*?>$/, '') + 
                   '</ul>';
        });
        
        formatted = formatted.replace(/```([\s\S]*?)```/g, 
            '<pre style="margin: 10px 0; padding: 12px; background: rgba(25,118,210,0.05); border-radius: 8px; border-left: 3px solid #1976d2; font-family: monospace; font-size: 13px; overflow-x: auto;"><code>$1</code></pre>');
        
        formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(25,118,210,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #1976d2;">$1</code>');
        
        formatted = formatted.replace(/^>\s+(.+)$/gm, '<blockquote style="margin: 8px 0; padding: 8px 12px; background: rgba(25,118,210,0.05); border-left: 3px solid #1976d2; font-style: italic; color: #455a64;">$1</blockquote>');
        
        const lines = formatted.split('<br style="line-height: 1.3;">');
        const hasBlockElements = formatted.includes('<h') || formatted.includes('<li') || 
                                 formatted.includes('<pre') || formatted.includes('<ul') ||
                                 formatted.includes('<blockquote');
        
        if (!hasBlockElements && lines.length > 1) {
            formatted = lines.map(line => {
                line = line.trim();
                if (line) {
                    return `<p style="margin: 6px 0; line-height: 1.5; color: #2c3e50;">${line}</p>`;
                }
                return '';
            }).join('');
        } else if (!hasBlockElements) {
            formatted = `<p style="margin: 6px 0; line-height: 1.5; color: #2c3e50;">${formatted}</p>`;
        }
        
        formatted = formatted.replace(/(Disclaimer:|Note:|Important:)/gi, 
            '<span style="font-weight: 600; color: #d32f2f;">$1</span>');
        
        return formatted;
    }

    clearChatDisplay() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }
    }

    deleteChat(chatId, button) {
        if (confirm('Are you sure you want to delete this chat?')) {
            this.chats = this.chats.filter(chat => chat.id !== chatId);
            this.saveChats();
            
            if (button) {
                button.closest('.chat-history-item').remove();
            }
            
            if (this.currentChatId === chatId) {
                if (this.chats.length > 0) {
                    this.loadChat(this.chats[0].id);
                } else {
                    this.createNewChat();
                }
            }
        }
    }

    searchChats(searchTerm) {
        const chatItems = document.querySelectorAll('.chat-history-item');
        
        chatItems.forEach(item => {
            const title = item.querySelector('.chat-title')?.textContent?.toLowerCase() || '';
            const preview = item.querySelector('.chat-preview')?.textContent?.toLowerCase() || '';
            const searchLower = searchTerm.toLowerCase();
            
            if (title.includes(searchLower) || preview.includes(searchLower)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    saveChats() {
        const validChats = this.chats.filter(chat => 
            chat && chat.id && chat.title && chat.title !== 'undefined' && chat.title !== 'null'
        );
        localStorage.setItem('meditrack_chats', JSON.stringify(validChats.slice(0, 20)));
    }

    setupEventListeners() {
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.createNewChat();
                hideSidebar();
            });
        }

        const chatSearch = document.getElementById('chatSearch');
        if (chatSearch) {
            chatSearch.addEventListener('input', (e) => {
                this.searchChats(e.target.value);
            });
        }
    }
}

// Initialize chat manager
const chatManager = new ChatHistoryManager();

// Sidebar toggle functionality
function showSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    sidebarToggle.classList.add('hidden');
    document.body.style.overflow = 'hidden';
}

function hideSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    sidebarToggle.classList.remove('hidden');
    document.body.style.overflow = '';
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', hideSidebar);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        hideSidebar();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initializeEventListeners();
    loadLocalChatHistory();
    updateWelcomeMessage();
});

function initializeEventListeners() {
    sendButton.addEventListener("click", handleSendMessage);
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    messageInput.addEventListener("input", updateSendButtonState);
    
    if (profileIcon && profileMenu) {
        profileIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle("active");
        });
        
        document.addEventListener("click", (e) => {
            if (!profileIcon.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.classList.remove("active");
            }
        });
    }

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', handleMenuItemClick);
    });

    quickActionButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            handleQuickAction(e);
        });
    });

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', showSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', hideSidebar);
    }

    // Image upload listeners
    if (imageUploadBtn) {
        imageUploadBtn.addEventListener('click', () => {
            imageInput.click();
        });
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelect);
    }
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', clearSelectedImage);
    }
}

// Handle image selection
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
    }
    
    currentImageFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageBase64 = e.target.result;
        chatImagePreview.src = e.target.result;
        imagePreviewContainer.style.display = 'flex';
        
        // Update placeholder text
        messageInput.placeholder = "Ask a question about the image...";
    };
    reader.readAsDataURL(file);
    
    imageInput.value = '';
}

// Clear selected image
function clearSelectedImage() {
    currentImageFile = null;
    currentImageBase64 = null;
    imagePreviewContainer.style.display = 'none';
    chatImagePreview.src = '';
    messageInput.placeholder = "Type your message here... (or ask about the image)";
}

// Handle sending message (with or without image)
// In handleSendMessage function, update the image response section:
async function handleSendMessage() {
    const message = messageInput.value.trim();
    
    // If no message and no image, do nothing
    if (!message && !currentImageBase64) return;
    
    // If typing indicator is active, don't send
    if (isTyping) return;

    let userMessage = message;
    let imageToSend = currentImageBase64;

    // Clear input and image preview immediately
    messageInput.value = "";
    if (imageToSend) {
        clearSelectedImage();
    }
    updateSendButtonState();

    // Add user message to chat (with image if exists)
    chatManager.addMessage('user', userMessage, imageToSend);
    
    if (imageToSend) {
        chatManager.displayMessageWithImage('user', userMessage, imageToSend);
    } else {
        chatManager.displayMessage('user', userMessage);
    }
    
    // Save to backend
    await saveMessageToBackend('user', userMessage + (imageToSend ? ' [with image]' : ''));
    
    showTypingIndicator();

    try {
        let aiResponse;
        
        if (imageToSend) {
            // Send with image
            aiResponse = await generateGeminiResponseWithImage(imageToSend, userMessage);
        } else {
            // Text only
            const messageWithContext = `${userMessage}\n\n[User Profile: Blood Type: ${getUserProfileData().bloodType}, Allergies: ${getUserProfileData().allergies}, Medications: ${getUserProfileData().medications}]`;
            aiResponse = await generateGeminiResponse(messageWithContext, messageHistory);
        }
        
        hideTypingIndicator();
        
        // Ensure we have a complete response before adding to chat
        if (aiResponse && aiResponse.length > 0) {
            chatManager.addMessage('bot', aiResponse);
            chatManager.displayMessage('bot', aiResponse);
            await saveMessageToBackend('assistant', aiResponse);

            messageHistory.push({ role: "user", content: userMessage });
            messageHistory.push({ role: "model", content: aiResponse });
            
            if (messageHistory.length > 20) {
                messageHistory = messageHistory.slice(-20);
            }
        } else {
            throw new Error("Empty response received");
        }
    } catch (error) {
        console.error("Chat Error:", error);
        hideTypingIndicator();
        const fallbackResponse = "I'm here to help! I can assist with health questions, medication tracking, and wellness advice. What would you like to know?";
        chatManager.addMessage('bot', fallbackResponse);
        chatManager.displayMessage('bot', fallbackResponse);
        await saveMessageToBackend('assistant', fallbackResponse);
    }
}

// Generate Gemini response with image
async function generateGeminiResponseWithImage(imageBase64, userQuestion) {
    const profile = getUserProfileData();
    
    // Create system prompt for image analysis
    const systemPrompt = `You are MediTrack+, an AI Healthcare Assistant. The user has uploaded an image and asked: "${userQuestion || 'Please analyze this image'}"

USER HEALTH PROFILE:
- Name: ${profile.firstName} ${profile.lastName}
- Age: ${profile.age}
- Gender: ${profile.gender}
- Blood Type: ${profile.bloodType}
- Allergies: ${profile.allergies}
- Current Medications: ${profile.medications}
- BMI: ${profile.bmi}

Please analyze the image AND answer the user's question. Consider their health profile when relevant.

If this is a prescription:
- List all medications
- Explain their purpose
- Check against their current medications and allergies
- Provide dosage instructions

If this is a skin condition or injury:
- Describe what you observe
- Consider their age/gender
- Suggest when to see a doctor

Always include proper disclaimers.

IMPORTANT: Provide a COMPLETE, well-formatted response. Do not cut off mid-sentence.`;
    
    // Check if imageBase64 exists and is valid
    if (!imageBase64 || !imageBase64.includes(',')) {
        throw new Error("Invalid image data");
    }
    
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1];
    
    const messages = [
        {
            role: "user",
            parts: [
                { text: systemPrompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                }
            ]
        }
    ];
    
    const requestBody = {
        contents: messages,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048, // Increased from 1024 to allow longer responses
        }
    };
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", errorText);
        throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response from Gemini API");
    }
    
    // Get the full response text
    let fullResponse = data.candidates[0].content.parts[0].text;
    
    // Ensure the response is complete (check if it ends properly)
    if (!fullResponse.trim().endsWith('.') && !fullResponse.trim().endsWith('!') && !fullResponse.trim().endsWith('?')) {
        console.warn("Response might be incomplete");
    }
    
    return fullResponse;
}
// Text-only Gemini response
async function generateGeminiResponse(userMessage, history) {
    const systemPrompt = getSystemPrompt();
    
    const messages = [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...history.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
        })),
        { role: "user", parts: [{ text: userMessage }] }
    ];

    const filteredMessages = messages.filter(msg => 
        msg.parts[0].text && msg.parts[0].text.trim().length > 0
    ).slice(-10);

    const requestBody = {
        contents: filteredMessages,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error("Invalid response from Gemini API");
        }
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw error;
    }
}

// Open image in fullscreen
function openFullscreenImage(imageSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'image-fullscreen-overlay active';
    
    const content = document.createElement('div');
    content.className = 'image-fullscreen-content';
    
    const img = document.createElement('img');
    img.src = imageSrc;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'image-fullscreen-close';
    closeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.onclick = () => document.body.removeChild(overlay);
    
    content.appendChild(img);
    content.appendChild(closeBtn);
    overlay.appendChild(content);
    
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    };
    
    document.body.appendChild(overlay);
}

// Make function globally available
window.openFullscreenImage = openFullscreenImage;

// Save message to backend
async function saveMessageToBackend(role, content) {
    try {
        const sessionId = chatManager.currentSessionId;
        
        const response = await fetch("/api/chat/save/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                role: role,
                content: content,
                session_id: sessionId
            })
        });

        if (!response.ok) {
            console.error('Failed to save message to backend');
            return false;
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error saving message to backend:', error);
        return false;
    }
}

// Local storage functions
function saveMessageToLocalStorage(userMessage, botResponse) {
    try {
        const chatData = {
            user: userMessage,
            bot: botResponse,
            timestamp: new Date().toISOString(),
            sessionId: chatManager.currentSessionId
        };
        
        const existingChats = JSON.parse(localStorage.getItem('meditrack_chats') || '[]');
        existingChats.push(chatData);
        
        if (existingChats.length > 50) {
            existingChats.splice(0, existingChats.length - 50);
        }
        
        localStorage.setItem('meditrack_chats', JSON.stringify(existingChats));
    } catch (error) {
        console.warn("Could not save to local storage:", error);
    }
}

function loadLocalChatHistory() {
    try {
        const savedChats = JSON.parse(localStorage.getItem('meditrack_chats') || '[]');
        
        const sessionChats = savedChats.filter(chat => chat.sessionId === chatManager.currentSessionId);
        
        sessionChats.slice(-5).forEach(chat => {
            if (chat.user && chat.bot) {
                chatManager.addMessage('user', chat.user);
                chatManager.displayMessage('user', chat.user);
                chatManager.addMessage('bot', chat.bot);
                chatManager.displayBotMessageStatic(chat.bot);
                
                messageHistory.push({ role: "user", content: chat.user });
                messageHistory.push({ role: "model", content: chat.bot });
            }
        });
    } catch (error) {
        console.log("No local chat history found or error loading:", error);
    }
}

function updateWelcomeMessage() {
    const welcomeMessage = document.querySelector('.welcome-message .message-content p');
    if (welcomeMessage) {
        const profile = getUserProfileData();
        welcomeMessage.innerHTML = `
            I'm your AI healthcare assistant. I can see your health profile includes:
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li><strong>Blood Type:</strong> ${profile.bloodType}</li>
                <li><strong>Allergies:</strong> ${profile.allergies}</li>
                <li><strong>Medications:</strong> ${profile.medications}</li>
            </ul>
            You can <strong>upload images</strong> (prescriptions, skin conditions, etc.) and ask questions about them!
            I'll analyze the image and consider your health profile. How can I help?
        `;
    }
}

function handleQuickAction(e) {
    const btn = e.currentTarget;
    if (!btn) return;

    const message = btn.getAttribute("data-message");
    messageInput.value = message;
    messageInput.focus();
    updateSendButtonState();

    btn.style.transform = "scale(0.95)";
    setTimeout(() => {
        if (btn) btn.style.transform = "scale(1)";
    }, 150);
}

function handleMenuItemClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const menuItem = e.currentTarget;
    const menuText = menuItem.textContent.trim();
    
    menuItem.style.background = "rgba(25, 118, 210, 0.1)";
    setTimeout(() => {
        menuItem.style.background = "";
    }, 200);

    switch (menuText) {
        case "My Profile":
            window.location.href = typeof PROFILE_URL !== 'undefined' ? PROFILE_URL : '/profile/';
            break;
        case "Edit Profile":
            window.location.href = typeof EDIT_PROFILE_URL !== 'undefined' ? EDIT_PROFILE_URL : '/profile/edit/';
            break;
        case "Settings":
            window.location.href = typeof SETTINGS_URL !== 'undefined' ? SETTINGS_URL : '/settings/';
            break;
        case "Sign Out":
            window.location.href = typeof LOGOUT_URL !== 'undefined' ? LOGOUT_URL : '/accounts/logout/';
            break;
    }

    if (profileMenu) {
        profileMenu.classList.remove("active");
    }
}

function showTypingIndicator() {
    isTyping = true;
    const div = document.createElement("div");
    div.id = "typing-indicator";
    div.className = "message bot";
    div.innerHTML = `
        <div class="message-avatar bot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            </svg>
        </div>
        <div class="message-bubble bot">
            <div class="typing-indicator">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    isTyping = false;
    const el = document.getElementById("typing-indicator");
    if (el) el.remove();
}

function updateSendButtonState() {
    sendButton.disabled = !messageInput.value.trim() && !currentImageBase64 || isTyping;
}

// Reminder Modal Functionality
const reminderBtn = document.getElementById('reminderBtn');
const reminderModal = document.getElementById('reminderModal');
const modalOverlay = document.getElementById('reminderModalOverlay');
const closeReminderModal = document.getElementById('closeReminderModal');
const cancelReminder = document.getElementById('cancelReminder');

if (reminderBtn) {
    reminderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        const timeInput = document.getElementById('reminderTime');
        if (timeInput) {
            timeInput.value = defaultTime;
        }
        
        reminderModal.classList.add('active');
        modalOverlay.classList.add('active');
    });
}

function closeReminderModalFunc() {
    reminderModal.classList.remove('active');
    modalOverlay.classList.remove('active');
    
    document.getElementById('medicationName').value = '';
    document.getElementById('dosage').value = '';
    document.getElementById('reminderTime').value = '';
    document.getElementById('repeatReminder').checked = false;
}

if (closeReminderModal) {
    closeReminderModal.addEventListener('click', closeReminderModalFunc);
}

if (cancelReminder) {
    cancelReminder.addEventListener('click', closeReminderModalFunc);
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', closeReminderModalFunc);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reminderModal.classList.contains('active')) {
        closeReminderModalFunc();
    }
});

function createReminder() {
    const medication = document.getElementById("medicationName").value.trim();
    const dosage = document.getElementById("dosage").value.trim();
    const time = document.getElementById("reminderTime").value;
    const repeat = document.getElementById("repeatReminder").checked;

    if (!medication) {
        alert("Please enter medication name");
        document.getElementById("medicationName").focus();
        return;
    }

    if (!dosage) {
        alert("Please enter dosage");
        document.getElementById("dosage").focus();
        return;
    }

    if (!time) {
        alert("Please select date and time");
        document.getElementById("reminderTime").focus();
        return;
    }

    const selectedTime = new Date(time);
    const now = new Date();
    if (selectedTime < now) {
        alert("Please select a future date and time");
        document.getElementById("reminderTime").focus();
        return;
    }

    const createBtn = document.querySelector('.reminder-btn-primary');
    const originalText = createBtn.innerHTML;
    createBtn.innerHTML = 'Creating...';
    createBtn.disabled = true;

    fetch("/api/reminder/create/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify({
            medication: medication,
            dosage: dosage,
            time: time,
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const reminderDate = new Date(time);
            const formattedTime = reminderDate.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            alert(`Reminder created successfully!\n\nMedication: ${medication}\nDosage: ${dosage}\nTime: ${formattedTime}${repeat ? '\nRepeat: Daily' : ''}`);
            closeReminderModalFunc();
        } else {
            alert("Failed to create reminder. Please try again.");
        }
    })
    .catch(error => {
        console.error("Error creating reminder:", error);
        alert("An error occurred while creating the reminder. Please try again.");
    })
    .finally(() => {
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
    });
}