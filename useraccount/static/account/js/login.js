class MediTrackAuth {
  constructor() {
    this.initElements();
    this.initEventListeners();
    this.initTabIndicator();
    console.log("MediTrack+ Auth System Initialized");
  }

  initElements() {
    // Tabs
    this.tabs = document.querySelectorAll(".tab");
    this.tabIndicator = document.getElementById("tabIndicator");
    this.forms = document.querySelectorAll(".form");

    // Forms
    this.signinForm = document.getElementById("signin-form");
    this.signupForm = document.getElementById("signup-form");

    // Buttons
    this.signinBtn = document.getElementById("signin-btn");
    this.switchToSignin = document.getElementById("switch-to-signin");

    // Password toggles
    this.passwordToggles = document.querySelectorAll(".password-toggle");

    // Forgot password
    this.forgotPassword = document.querySelector(".forgot-password");

    // Notification container
    this.notificationContainer = document.getElementById(
      "notification-container"
    );
  }

  initEventListeners() {
    // Tab switching
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab));
    });

    // Switch to sign in
    this.switchToSignin?.addEventListener("click", () => {
      this.switchToTab("signin");
    });

    // Form submissions
    this.signinForm?.addEventListener("submit", (e) => this.handleSignIn(e));
    this.signupForm?.addEventListener("submit", (e) => this.handleSignUp(e));

    // Password toggles
    this.passwordToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => this.togglePassword(toggle));
    });
  }


  initTabIndicator() {
    // Set initial position
    this.updateTabIndicator();
  }

  updateTabIndicator() {
    const activeTab = document.querySelector(".tab.active");
    if (activeTab && this.tabIndicator) {
      const tabWidth = activeTab.offsetWidth;
      const tabLeft = activeTab.offsetLeft;

      this.tabIndicator.style.width = `${tabWidth}px`;
      this.tabIndicator.style.left = `${tabLeft}px`;
    }
  }

  switchTab(clickedTab) {
    // Update tabs
    this.tabs.forEach((tab) => tab.classList.remove("active"));
    clickedTab.classList.add("active");

    // Update indicator
    this.updateTabIndicator();

    // Show corresponding form
    const tabName = clickedTab.dataset.tab;
    this.forms.forEach((form) => form.classList.remove("active"));
    document.getElementById(`${tabName}-form`).classList.add("active");
  }

  switchToTab(tabName) {
    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    if (tab) {
      this.switchTab(tab);
    }
  }

  togglePassword(toggleBtn) {
    const targetId = toggleBtn.dataset.target;
    const input = document.getElementById(targetId);
    const icon = toggleBtn.querySelector("svg");

    if (input.type === "password") {
      input.type = "text";
      icon.innerHTML = `
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    `;
    } else {
      input.type = "password";
      icon.innerHTML = `
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    `;
    }
  }

  async handleSignIn(e) {
    e.preventDefault();

    const formData = new FormData(this.signinForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = document.getElementById("remember-me").checked;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Validation
    if (!email || !password) {
      this.showNotification("Please fill in all fields", "error");
      return;
    }

    if (!this.validateEmail(email)) {
      this.showNotification("Please enter a valid email address", "error");
      return;
    }

    // Show loading
    this.setLoading(this.signinBtn, true);

    // Prepare data for Django
    const data = {
      action: 'signin',
      email: email,
      password: password,
      remember_me: rememberMe
    };

    try {
      const response = await fetch(window.location.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification(result.message, "success");
        
        // Redirect if redirect URL is provided
        if (result.redirect) {
          setTimeout(() => {
            window.location.href = result.redirect;
          }, 1500);
        }
      } else {
        this.showNotification(result.message, "error");
        this.setLoading(this.signinBtn, false);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification("An error occurred. Please try again.", "error");
      this.setLoading(this.signinBtn, false);
    }
  }

  async handleSignUp(e) {
    e.preventDefault();

    const formData = new FormData(this.signupForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    const termsAgreed = document.getElementById("terms").checked;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      this.showNotification("Please fill in all fields", "error");
      return;
    }

    if (!this.validateEmail(email)) {
      this.showNotification("Please enter a valid email address", "error");
      return;
    }

    if (password !== confirmPassword) {
      this.showNotification("Passwords do not match", "error");
      return;
    }

    if (password.length < 8) {
      this.showNotification("Password must be at least 8 characters", "error");
      return;
    }

    if (!termsAgreed) {
      this.showNotification("Please agree to the Terms of Service", "error");
      return;
    }

    // Show loading
    const submitBtn = this.signupForm.querySelector('button[type="submit"]');
    this.setLoading(submitBtn, true);

    // Prepare data for Django
    const data = {
      action: 'signup',
      name: name,
      email: email,
      password: password,
      confirm_password: confirmPassword
    };

    try {
      const response = await fetch(window.location.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification(result.message, "success");
        
        // Clear form and switch to sign in
        setTimeout(() => {
          this.signupForm.reset();
          this.switchToTab("signin");
          document.getElementById("signin-email").value = email;
          
          // Redirect if redirect URL is provided
          if (result.redirect) {
            setTimeout(() => {
              window.location.href = result.redirect;
            }, 1500);
          }
        }, 1000);
      } else {
        this.showNotification(result.message, "error");
        this.setLoading(submitBtn, false);
      }
    } catch (error) {
      console.error('Signup error:', error);
      this.showNotification("An error occurred. Please try again.", "error");
      this.setLoading(submitBtn, false);
    }
  }

  handleForgotPassword() {
    const email = document.getElementById("signin-email").value.trim();

    if (!email || !this.validateEmail(email)) {
      this.showNotification("Please enter a valid email address", "error");
      return;
    }

    this.showNotification(`Password reset link sent to ${email}`, "success");
  }

  setLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
      button.classList.add("loading");
      button.disabled = true;
      button.innerHTML = 'Processing...';
    } else {
      button.classList.remove("loading");
      button.disabled = false;
      
      // Reset button text based on which button it is
      if (button.id === 'signin-btn') {
        button.innerHTML = 'Sign In';
      } else if (button.classList.contains('btn-success')) {
        button.innerHTML = `
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Create Account
        `;
      }
    }
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
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
    setTimeout(() => notification.classList.add("show"), 10);

    // Auto remove
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Click to dismiss
    notification.addEventListener("click", () => {
      notification.classList.remove("show");
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
                    `,
    };

    return icons[type] || icons.info;
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.auth = new MediTrackAuth();
});

document.addEventListener('DOMContentLoaded', function() {
        const forgotLink = document.getElementById('forgot-password-link');
        const emailInput = document.getElementById('signin-email');
        
        if (forgotLink && emailInput) {
            // Update link when email changes
            emailInput.addEventListener('input', function() {
                if (this.value.trim()) {
                    forgotLink.href = `/user/forgot-password/?email=${encodeURIComponent(this.value.trim())}`;
                } else {
                    forgotLink.href = "{% url 'forgot_password' %}";
                }
            });
            
            // Set initial value
            if (emailInput.value.trim()) {
                forgotLink.href = `/user/forgot-password/?email=${encodeURIComponent(emailInput.value.trim())}`;
            }
        }
});