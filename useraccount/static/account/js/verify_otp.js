class OTPVerification {
    constructor() {
        this.email = document.getElementById('email-display').textContent.trim();
        this.otpInputs = document.querySelectorAll('.otp-input');
        this.verifyForm = document.getElementById('verify-otp-form');
        this.verifyBtn = document.getElementById('verify-btn');
        this.resendLink = document.getElementById('resend-link');
        this.backToLogin = document.getElementById('back-to-login');
        this.timerElement = document.getElementById('time-left');
        this.notificationContainer = document.getElementById('notification-container');
        
        this.timeLeft = 600; // 10 minutes in seconds
        this.timerInterval = null;
        this.canResend = false;
        
        this.init();
    }
    
    init() {
        this.initOTPInputs();
        this.initEventListeners();
        this.startTimer();
    }
    
    initOTPInputs() {
        this.otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // Auto-focus next input
                if (value && index < this.otpInputs.length - 1) {
                    this.otpInputs[index + 1].focus();
                }
                
                // Combine OTP
                this.updateOTPValue();
            });
            
            input.addEventListener('keydown', (e) => {
                // Handle backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    this.otpInputs[index - 1].focus();
                }
                
                // Handle arrow keys
                if (e.key === 'ArrowLeft' && index > 0) {
                    e.preventDefault();
                    this.otpInputs[index - 1].focus();
                }
                
                if (e.key === 'ArrowRight' && index < this.otpInputs.length - 1) {
                    e.preventDefault();
                    this.otpInputs[index + 1].focus();
                }
            });
            
            // Paste OTP
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                const numbers = pastedData.replace(/\D/g, '');
                
                if (numbers.length === 6) {
                    for (let i = 0; i < 6; i++) {
                        if (this.otpInputs[i]) {
                            this.otpInputs[i].value = numbers[i] || '';
                        }
                    }
                    this.updateOTPValue();
                    this.otpInputs[5].focus();
                }
            });
        });
    }
    
    updateOTPValue() {
        const otp = Array.from(this.otpInputs)
            .map(input => input.value)
            .join('');
        document.getElementById('otp-value').value = otp;
    }
    
    initEventListeners() {
        this.verifyForm.addEventListener('submit', (e) => this.handleVerifyOTP(e));
        this.resendLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleResendOTP();
        });
        this.backToLogin.addEventListener('click', () => {
            window.location.href = '/login/';
        });
    }
    
    startTimer() {
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.canResend = true;
                this.resendLink.classList.remove('disabled');
                this.timerElement.parentElement.classList.add('expired');
                this.timerElement.textContent = 'OTP expired';
                this.showNotification('OTP has expired. Please request a new one.', 'error');
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    async handleVerifyOTP(e) {
        e.preventDefault();
        
        const otp = document.getElementById('otp-value').value;
        
        if (otp.length !== 6) {
            this.showNotification('Please enter a 6-digit OTP', 'error');
            return;
        }
        
        // Show loading
        this.setLoading(this.verifyBtn, true);
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        try {
            const response = await fetch('/user/api/verify-otp/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    otp: otp,
                    email: this.email
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1500);
            } else {
                this.showNotification(result.message, 'error');
                this.setLoading(this.verifyBtn, false);
                
                // Clear OTP inputs on error
                if (result.message.includes('Invalid OTP')) {
                    this.otpInputs.forEach(input => input.value = '');
                    this.otpInputs[0].focus();
                    this.updateOTPValue();
                }
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
            this.setLoading(this.verifyBtn, false);
        }
    }
    
    async handleResendOTP() {
        if (!this.canResend && this.timeLeft > 0) {
            this.showNotification(`Please wait ${Math.ceil(this.timeLeft/60)} minutes before resending`, 'error');
            return;
        }
        
        this.setLoading(this.resendLink, true);
        this.resendLink.textContent = 'Sending...';
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        try {
            const response = await fetch('/user/api/resend-otp/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    email: this.email
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                
                // Reset timer
                this.timeLeft = 600;
                this.canResend = false;
                this.resendLink.classList.add('disabled');
                this.timerElement.parentElement.classList.remove('expired');
                this.startTimer();
                
                // Clear OTP inputs
                this.otpInputs.forEach(input => input.value = '');
                this.otpInputs[0].focus();
                this.updateOTPValue();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        } finally {
            this.setLoading(this.resendLink, false);
            this.resendLink.textContent = 'Didn\'t receive code? Resend OTP';
        }
    }
    
    setLoading(element, isLoading) {
        if (isLoading) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            element.classList.remove('loading');
            element.disabled = false;
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
    new OTPVerification();
});