// dashboard.js - Fixed AI Response Formatting and Sidebar Toggle
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

// Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyDKEbAryvP-92Yva6M6qkaI4wW4My_KQB0";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

let isTyping = false;
let messageHistory = [];
let currentSessionId = null;
let currentBackendChatId = null; // Store backend chat ID

// CSRF Token function
function getCSRFToken() {
    return document.querySelector('input[name="csrfmiddlewaretoken"]')?.value ||
           document.querySelector('meta[name="csrf-token"]')?.content;
}

// Get User Profile Data from Django Template
// Get User Profile Data from Django Template - UPDATED VERSION
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
            emergencyPhone: 'Not specified'
        };
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
        emergencyPhone: profileElement.dataset.emergencyPhone || 'Not specified'
    };
}

// Generate System Prompt with User Profile
// Generate System Prompt with User Profile - UPDATED VERSION
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
3. When asked about specific health concerns, factor in their age, gender, BMI, and existing conditions
4. If their profile says "Not specified" or "None", ask them to update their profile for better assistance
5. You are NOT a real doctor. Always advise consulting healthcare professionals for serious concerns
6. Provide personalized advice based on their COMPLETE health profile when appropriate
7. Format your responses with proper markdown (use **bold**, *italic*, ### Headers, - lists, etc.)
8. Ask them to scale the health issue from 1-10 scale for understanding and responding better.
9. Consider age-appropriate recommendations (pediatric, adult, geriatric)
10. Consider gender-specific health concerns when relevant

CAPABILITIES:
1. Health advice and symptom checking (reference their COMPLETE profile)
2. Medication reminders and interactions (check against ALL their current medications)
3. Age-specific health guidance
4. Gender-specific health concerns
5. BMI-based weight management advice
6. Wellness tips (consider their allergies, medications, age, and conditions)
7. Give home remedies, exercises, and commonly used medicines WITH DISCLAIMERS

IMPORTANT: Always acknowledge if you're using information from their health profile. For example:
- "Based on your profile showing you are ${age} years old with ${profile.bloodType} blood type, I recommend..."
- "I notice in your health profile that you have allergies to ${profile.allergies}, so you should avoid..."
- "Since your profile lists medications: ${profile.medications}, you should be aware of interactions with..."
- "Considering your BMI of ${bmi} (${bmiCategory}), I suggest..."
- "As a ${profile.gender} of ${age} years, you should be aware that..."

Remember to personalize responses based on ALL available information in their profile.

How can I assist you with your health needs today?`;
}

// Chat History Manager
class ChatHistoryManager {
    constructor() {
        this.currentChatId = null;
        this.currentSessionId = Date.now().toString();  // Store session ID here
        this.chats = (JSON.parse(localStorage.getItem('meditrack_chats')) || []).filter(chat => 
            chat && chat.id && chat.title && chat.title !== 'undefined' && chat.title !== 'null'
        );
        this.init();
    }

    init() {
        this.loadChatHistory();
        this.setupEventListeners();
        
        // Only create a new chat if there are no existing chats
        if (this.chats.length === 0) {
            this.createNewChat();
        } else {
            // Load the most recent chat automatically
            const mostRecentChat = this.chats[0];
            this.currentChatId = mostRecentChat.id;
            this.loadChat(mostRecentChat.id);
        }
    }

    // Create a new chat - generate NEW session ID
    createNewChat(firstMessage = null) {
        // Generate NEW session ID for each new chat
        this.currentSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        
        // Update global variable
        window.currentSessionId = this.currentSessionId;
        
        // Check if we already have an empty chat (no messages)
        const emptyChat = this.chats.find(chat => 
            chat.messages && chat.messages.length === 0
        );
        
        if (emptyChat && !firstMessage) {
            // Use the existing empty chat instead of creating a new one
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
            sessionId: this.currentSessionId,  // Store session ID
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

    // Add a message to current chat
    addMessage(role, content) {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat) {
            chat.messages.push({ role, content, timestamp: new Date().toISOString() });
            
            if (role === 'user') {
                // Update preview with user message
                chat.preview = content.length > 40 ? content.substring(0, 40) + '...' : content;
                
                // Only update title if it's the first user message in the chat
                if (chat.messages.filter(m => m.role === 'user').length === 1) {
                    chat.title = this.generateChatTitle(content);
                }
            }
            
            chat.timestamp = new Date().toISOString(); // Update timestamp
            this.saveChats();
            this.updateChatInSidebar(chat);
        }
    }

    // Load chat history into sidebar
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

    // Load a specific chat
    loadChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;

        // Update current chat ID
        this.currentChatId = chatId;
        
        // Update current session ID
        this.currentSessionId = chat.sessionId;
        window.currentSessionId = this.currentSessionId;
        
        // Update active state in sidebar
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (activeItem) activeItem.classList.add('active');

        // Display chat messages
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
            this.displayMessage(msg.role, msg.content);
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
        
        // FORMAT THE CONTENT PROPERLY - THIS IS THE KEY FIX
        const formattedContent = role === 'bot' ? 
            this.formatMessageContent(content) : 
            content.replace(/\n/g, '<br>');
        
        const messageBubble = `<div class="message-bubble ${role}">${formattedContent}</div>`;
        
        messageDiv.innerHTML = avatar + messageBubble;
        messagesContainer.appendChild(messageDiv);
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Format message content with proper styling - FIXED VERSION
    formatMessageContent(content) {
        // First, escape HTML to prevent XSS
        let formatted = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Convert markdown to HTML
        formatted = formatted
            // Headers (must be at the start of line)
            .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
            .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
            .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
            .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
            .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
            
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            
            // Lists (bullet points)
            .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
            
            // Lists (numbered)
            .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
            
            // Line breaks (convert newlines to <br>)
            .replace(/\n/g, '<br>');
        
        // Wrap consecutive list items in ul
        formatted = formatted.replace(/(<li>.*?<\/li>(<br>)?)+/g, function(match) {
            return '<ul>' + match.replace(/<br><\/li>/g, '</li>').replace(/<br>$/, '') + '</ul>';
        });
        
        // Convert code blocks
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Convert inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Wrap text in paragraphs if no other block elements
        const lines = formatted.split('<br>');
        const hasBlockElements = formatted.includes('<h') || formatted.includes('<li') || 
                                 formatted.includes('<pre') || formatted.includes('<ul');
        
        if (!hasBlockElements && lines.length > 1) {
            formatted = lines.map(line => line.trim() ? `<p>${line}</p>` : '').join('');
        }
        
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

    // Delete a chat
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

    // Search chats
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

    // Save chats to localStorage
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

// Close sidebar when clicking on overlay
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', hideSidebar);
}

// Close sidebar with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        hideSidebar();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initializeEventListeners();
    loadLocalChatHistory();
    
    // Update welcome message with profile info
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
    
    // Profile menu toggle - FIXED
    if (profileIcon && profileMenu) {
        profileIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle("active");
        });
        
        // Close profile menu when clicking outside
        document.addEventListener("click", (e) => {
            if (!profileIcon.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.classList.remove("active");
            }
        });
    }

    // Profile menu item click handlers
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

    // Sidebar toggle buttons
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', showSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', hideSidebar);
    }
}

// Handle profile menu item clicks - FIXED
function handleMenuItemClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const menuItem = e.currentTarget;
    const menuText = menuItem.textContent.trim();
    
    // Add visual feedback
    menuItem.style.background = "rgba(25, 118, 210, 0.1)";
    setTimeout(() => {
        menuItem.style.background = "";
    }, 200);

    // Handle menu actions
    switch (menuText) {
        case "My Profile":
            if (typeof PROFILE_URL !== 'undefined') {
                window.location.href = PROFILE_URL;
            } else {
                console.error('PROFILE_URL is not defined');
                window.location.href = '/profile/';
            }
            break;

        case "Edit Profile":
            if (typeof EDIT_PROFILE_URL !== 'undefined') {
                window.location.href = EDIT_PROFILE_URL;
            } else {
                console.error('EDIT_PROFILE_URL is not defined');
                window.location.href = '/profile/edit/';
            }
            break;
            
        case "Settings":
            if (typeof SETTINGS_URL !== 'undefined') {
                window.location.href = SETTINGS_URL;
            } else {
                console.error('SETTINGS_URL is not defined');
                window.location.href = '/settings/';
            }
            break;
            
        case "Sign Out":
            if (typeof LOGOUT_URL !== 'undefined') {
                window.location.href = LOGOUT_URL;
            } else {
                // Default Django logout URL
                window.location.href = '/accounts/logout/';
            }
            break;
    }

    if (profileMenu) {
        profileMenu.classList.remove("active");
    }
}

// ==================== BACKEND SAVING FUNCTIONS ====================

// Save message to backend
async function saveMessageToBackend(role, content) {
    try {
        // Use the current session ID from chatManager
        const sessionId = chatManager.currentSessionId;
        
        const response = await fetch("/api/chat/save/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                role: role,  // 'user' or 'assistant'
                content: content,
                session_id: sessionId  // Use the session ID
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

async function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;

    // Add to chat history (frontend)
    chatManager.addMessage('user', message);
    
    // Display user message
    chatManager.displayMessage('user', message);
    messageInput.value = "";
    updateSendButtonState();
    
    // SAVE USER MESSAGE TO BACKEND
    await saveMessageToBackend('user', message);
    
    showTypingIndicator();

    try {
        const userProfile = getUserProfileData();
        
        // Format message with profile context
        const messageWithContext = `${message}\n\n[User Profile: Blood Group: ${userProfile.bloodGroup}, Allergies: ${userProfile.allergies}, Medications: ${userProfile.medications}]`;
        
        const aiResponse = await generateGeminiResponse(messageWithContext, messageHistory);
        hideTypingIndicator();
        
        // Add AI response to chat history (frontend)
        chatManager.addMessage('bot', aiResponse);
        
        // Display AI response
        chatManager.displayMessage('bot', aiResponse);

        // SAVE AI RESPONSE TO BACKEND
        await saveMessageToBackend('assistant', aiResponse);

        // Update message history
        messageHistory.push({ role: "user", content: message });
        messageHistory.push({ role: "model", content: aiResponse });
        
        // Keep history manageable
        if (messageHistory.length > 20) {
            messageHistory = messageHistory.slice(-20);
        }
    } catch (error) {
        console.error("Chat Error:", error);
        hideTypingIndicator();
        const fallbackResponse = "I'm here to help! I can assist with health questions, medication tracking, and wellness advice. What would you like to know?";
        chatManager.addMessage('bot', fallbackResponse);
        chatManager.displayMessage('bot', fallbackResponse);
        
        // Try to save fallback to backend
        await saveMessageToBackend('assistant', fallbackResponse);
    }
}

// Load chat messages from backend
async function loadChatFromBackend() {
    try {
        const sessionId = chatManager.currentSessionId;
        const response = await fetch(`/api/chat/get-messages/?session_id=${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.messages && data.messages.length > 0) {
                // Clear local chat first
                chatManager.clearChatDisplay();
                
                // Load messages from backend
                data.messages.forEach(msg => {
                    if (msg.role === 'user') {
                        chatManager.addMessage('user', msg.content);
                        chatManager.displayMessage('user', msg.content);
                        messageHistory.push({ role: "user", content: msg.content });
                    } else if (msg.role === 'assistant') {
                        chatManager.addMessage('bot', msg.content);
                        chatManager.displayMessage('bot', msg.content);
                        messageHistory.push({ role: "model", content: msg.content });
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading chat from backend:', error);
    }
}

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
            maxOutputTokens: 1024,
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
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
            console.error("Gemini API Error:", errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error("Unexpected API response:", data);
            throw new Error("Invalid response from Gemini API");
        }
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw error;
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
                chatManager.displayMessage('bot', chat.bot);
                
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
                <li><strong>Blood Group:</strong> ${profile.bloodGroup}</li>
                <li><strong>Allergies:</strong> ${profile.allergies}</li>
                <li><strong>Medications:</strong> ${profile.medications}</li>
            </ul>
            I'll consider your health profile when providing advice. How can I assist you today?
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
    sendButton.disabled = !messageInput.value.trim() || isTyping;
}