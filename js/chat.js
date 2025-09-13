class ChatInterface {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.characterCount = document.querySelector('.character-count');
        
        this.chatHistory = this.loadChatHistory();
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.displayWelcomeTime();
        this.restoreChatHistory();
        this.focusInput();
    }
    
    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // Enter key to send (Shift+Enter for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        
        // Auto-resize textarea and update character count
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateCharacterCount();
            this.updateSendButton();
        });
        
        // Update send button state on focus/blur
        this.messageInput.addEventListener('focus', () => this.updateSendButton());
        this.messageInput.addEventListener('blur', () => this.updateSendButton());
    }
    
    displayWelcomeTime() {
        const welcomeTimeElement = document.getElementById('welcomeTime');
        if (welcomeTimeElement) {
            welcomeTimeElement.textContent = this.formatTime(new Date());
        }
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    updateCharacterCount() {
        const count = this.messageInput.value.length;
        this.characterCount.textContent = `${count}/1000`;
        
        if (count > 900) {
            this.characterCount.style.color = '#e74c3c';
        } else if (count > 800) {
            this.characterCount.style.color = '#f39c12';
        } else {
            this.characterCount.style.color = '#666';
        }
    }
    
    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isLoading;
    }
    
    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input and update UI
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateCharacterCount();
        this.updateSendButton();
        
        // Show loading indicator
        this.showLoading();
        
        try {
            // Send message to API
            const response = await this.sendToAPI(message);
            
            // Add AI response to chat
            this.addMessage(response, 'ai');
            
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Show specific error message based on error type
            let errorMessage = 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
            
            if (error.message.includes('usage limits')) {
                errorMessage = 'I\'m currently at capacity due to high usage. Please try again in a few minutes.';
            } else if (error.message.includes('timed out')) {
                errorMessage = 'Your request timed out. Please try again with a shorter message.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'You\'re sending messages too quickly. Please wait a moment before trying again.';
            } else if (error.message.includes('Invalid request')) {
                errorMessage = 'There was an issue with your message. Please try rephrasing it.';
            } else if (!navigator.onLine) {
                errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
            }
            
            this.addMessage(errorMessage, 'ai', true);
        } finally {
            this.hideLoading();
            this.focusInput();
        }
    }
    
    async sendToAPI(message) {
        const maxRetries = 3;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                    signal: AbortSignal.timeout(30000) // 30 second timeout
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    
                    // Handle specific error types
                    if (response.status === 503 && errorData.code === 'SERVICE_UNAVAILABLE') {
                        throw new Error('AI service is temporarily unavailable due to usage limits. Please try again later.');
                    } else if (response.status === 429) {
                        throw new Error('Too many requests. Please wait a moment before trying again.');
                    } else if (response.status >= 500) {
                        throw new Error('Server error occurred. Please try again.');
                    } else if (response.status === 400) {
                        throw new Error(errorData.message || 'Invalid request. Please check your message.');
                    } else {
                        throw new Error(errorData.message || `Request failed with status ${response.status}`);
                    }
                }
                
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.message || 'An error occurred while processing your request.');
                }
                
                return data.response;
                
            } catch (error) {
                lastError = error;
                
                // Don't retry on certain errors
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again with a shorter message.');
                }
                
                if (error.message.includes('usage limits') || 
                    error.message.includes('Invalid request') ||
                    error.message.includes('timed out')) {
                    throw error;
                }
                
                // Retry on network errors or server errors
                if (attempt < maxRetries) {
                    console.log(`Attempt ${attempt} failed, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                    continue;
                }
            }
        }
        
        throw lastError || new Error('Failed to send message after multiple attempts.');
    }
    
    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        if (isError) {
            messageContent.style.color = '#e74c3c';
            messageContent.style.fontStyle = 'italic';
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date());
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Save to chat history
        this.chatHistory.push({
            content,
            sender,
            timestamp: new Date().toISOString(),
            isError
        });
        this.saveChatHistory();
    }
    
    showLoading() {
        this.isLoading = true;
        this.loadingIndicator.classList.add('show');
        this.updateSendButton();
        this.scrollToBottom();
    }
    
    hideLoading() {
        this.isLoading = false;
        this.loadingIndicator.classList.remove('show');
        this.updateSendButton();
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    focusInput() {
        setTimeout(() => {
            this.messageInput.focus();
        }, 100);
    }
    
    formatTime(date) {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    // Chat history management
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('chatHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading chat history:', error);
            return [];
        }
    }
    
    saveChatHistory() {
        try {
            // Keep only last 100 messages to prevent localStorage bloat
            const historyToSave = this.chatHistory.slice(-100);
            localStorage.setItem('chatHistory', JSON.stringify(historyToSave));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }
    
    restoreChatHistory() {
        // Only restore if there are messages and it's been less than 24 hours
        if (this.chatHistory.length === 0) return;
        
        const lastMessage = this.chatHistory[this.chatHistory.length - 1];
        const lastMessageTime = new Date(lastMessage.timestamp);
        const now = new Date();
        const hoursDiff = (now - lastMessageTime) / (1000 * 60 * 60);
        
        // Don't restore if last message was more than 24 hours ago
        if (hoursDiff > 24) {
            this.clearChatHistory();
            return;
        }
        
        // Remove the welcome message before restoring
        const welcomeMessage = this.chatMessages.querySelector('.ai-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        // Restore messages
        this.chatHistory.forEach(msg => {
            this.addMessageToDOM(msg.content, msg.sender, msg.timestamp, msg.isError);
        });
        
        this.scrollToBottom();
    }
    
    addMessageToDOM(content, sender, timestamp, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        if (isError) {
            messageContent.style.color = '#e74c3c';
            messageContent.style.fontStyle = 'italic';
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date(timestamp));
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.chatMessages.appendChild(messageDiv);
    }
    
    clearChatHistory() {
        this.chatHistory = [];
        localStorage.removeItem('chatHistory');
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
});

// Handle page visibility changes to manage chat state
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Re-focus input when page becomes visible
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            setTimeout(() => messageInput.focus(), 100);
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored');
    
    // Show connection restored message
    const chatInterface = document.querySelector('.chat-interface');
    if (chatInterface) {
        const statusBar = document.createElement('div');
        statusBar.className = 'connection-status online';
        statusBar.textContent = 'Connection restored';
        chatInterface.appendChild(statusBar);
        
        setTimeout(() => {
            statusBar.remove();
        }, 3000);
    }
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    
    // Show offline message
    const chatInterface = document.querySelector('.chat-interface');
    if (chatInterface) {
        const statusBar = document.createElement('div');
        statusBar.className = 'connection-status offline';
        statusBar.textContent = 'Connection lost - You are currently offline';
        chatInterface.appendChild(statusBar);
        
        // Remove when back online
        const removeOfflineStatus = () => {
            statusBar.remove();
            window.removeEventListener('online', removeOfflineStatus);
        };
        window.addEventListener('online', removeOfflineStatus);
    }
});