class ResetPassword {
    constructor() {
        this.form = document.getElementById('reset-password-form');
        this.resetBtn = document.getElementById('reset-password-btn');
        this.newPasswordInput = document.getElementById('new-password');
        this.confirmPasswordInput = document.getElementById('confirm-password');
        this.notificationContainer = document.getElementById('notification-container');
        
        this.init();
    }
    
    init() {
        this.initEventListeners();
        this.initPasswordStrength();
    }
    
    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleResetPassword(e));
        
        // Password strength checker
        this.newPasswordInput.addEventListener('input', () => this.checkPasswordStrength());
        
        // Password match checker
        this.confirmPasswordInput.addEventListener('input', () => this.checkPasswordMatch());
        
        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.togglePassword(toggle));
        });
    }
    
    initPasswordStrength() {
        // Initialize strength display
        this.checkPasswordStrength();
        this.checkPasswordMatch();
    }
    
    checkPasswordStrength() {
        const password = this.newPasswordInput.value;
        let strength = 0;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
        
        // Update requirement indicators
        Object.keys(requirements).forEach(key => {
            const element = document.getElementById(`req-${key}`);
            if (element) {
                if (requirements[key]) {
                    element.classList.remove('invalid');
                    element.classList.add('valid');
                    strength++;
                } else {
                    element.classList.remove('valid');
                    element.classList.add('invalid');
                }
            }
        });
        
        // Calculate strength percentage
        const maxStrength = Object.keys(requirements).length;
        const strengthPercent = (strength / maxStrength) * 100;
        
        // Update strength bar
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');
        
        strengthBar.style.width = `${strengthPercent}%`;
        
        // Set color and text based on strength
        if (strengthPercent < 40) {
            strengthBar.className = 'strength-fill';
            strengthText.textContent = 'Password strength: Very weak';
            strengthText.style.color = 'var(--error)';
        } else if (strengthPercent < 70) {
            strengthBar.className = 'strength-fill good';
            strengthText.textContent = 'Password strength: Good';
            strengthText.style.color = '#ff9800';
        } else {
            strengthBar.className = 'strength-fill strong';
            strengthText.textContent = 'Password strength: Strong';
            strengthText.style.color = 'var(--success)';
        }
    }
    
    checkPasswordMatch() {
        const password = this.newPasswordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        const matchElement = document.getElementById('password-match');
        
        if (!confirmPassword) {
            matchElement.textContent = '';
            matchElement.style.color = '';
            return;
        }
        
        if (password === confirmPassword) {
            matchElement.textContent = '✓ Passwords match';
            matchElement.style.color = 'var(--success)';
        } else {
            matchElement.textContent = '✗ Passwords do not match';
            matchElement.style.color = 'var(--error)';
        }
    }
    
    togglePassword(toggleBtn) {
        const targetId = toggleBtn.dataset.target;
        const input = document.getElementById(targetId);
        const icon = toggleBtn.querySelector('svg');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            `;
        } else {
            input.type = 'password';
            icon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    }
    
    validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
        
        // Check all requirements
        return Object.values(requirements).every(req => req);
    }
    
    async handleResetPassword(e) {
        e.preventDefault();
        
        const token = document.getElementById('reset-token').value;
        const password = this.newPasswordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        // Validation
        if (!token) {
            this.showNotification('Invalid reset link. Please request a new one.', 'error');
            return;
        }
        
        if (!password || !confirmPassword) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showNotification('Password does not meet requirements', 'error');
            return;
        }
        
        // Show loading
        this.setLoading(this.resetBtn, true);
        
        try {
            const response = await fetch('/user/api/reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    token: token,
                    password: password,
                    confirm_password: confirmPassword
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                
                // Clear form
                this.form.reset();
                
                // Redirect to dashboard
                if (result.redirect) {
                    setTimeout(() => {
                        window.location.href = result.redirect;
                    }, 2000);
                }
            } else {
                this.showNotification(result.message, 'error');
                this.setLoading(this.resetBtn, false);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
            this.setLoading(this.resetBtn, false);
        }
    }
    
    setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            button.innerHTML = 'Processing...';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            button.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Reset Password
            `;
        }
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
    new ResetPassword();
});