class ForgotPassword {
    constructor() {
        this.form = document.getElementById('forgot-password-form');
        this.resetBtn = document.getElementById('reset-btn');
        this.notificationContainer = document.getElementById('notification-container');
        
        this.init();
    }
    
    init() {
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleForgotPassword(e));
    }
    
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('reset-email').value.trim();
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // Validation
        if (!email) {
            this.showNotification('Please enter your email address', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Show loading
        this.setLoading(this.resetBtn, true);
        
        try {
            const response = await fetch(window.location.href, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ email: email })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                
                // Clear form
                this.form.reset();
                
                // Optional: Show instructions
                setTimeout(() => {
                    this.showNotification('Check your email inbox (and spam folder) for the reset link.', 'info');
                }, 2000);
                
                // Optional: Auto redirect after success
                setTimeout(() => {
                    window.location.href = '/user/login/';
                }, 5000);
                
            } else {
                this.showNotification(result.message, 'error');
                this.setLoading(this.resetBtn, false);
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
            this.setLoading(this.resetBtn, false);
        }
    }
    
    setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            button.innerHTML = 'Sending...';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            button.innerHTML = 'Send Reset Link';
        }
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = this.getNotificationIcon(type);
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        
        notification.innerHTML = `
            ${icon}
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // Show
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: `
                <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 12.5L10.5 15L16 9"/>
                </svg>
            `,
            error: `
                <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            `,
            info: `
                <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12" y2="8"/>
                </svg>
            `
        };
        
        return icons[type] || icons.info;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ForgotPassword();
});