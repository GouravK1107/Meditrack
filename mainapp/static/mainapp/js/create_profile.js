// Enhanced user_create.js with premium features
document.addEventListener('DOMContentLoaded', () => {
    // Initialize everything
    initForm();
    initAnimations();
    initInteractions();
});

// MOVE updateAvatar function to global scope
function updateAvatar(imageSrc) {
    const avatar = document.getElementById('profileAvatarLarge');
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    `;
    
    avatar.innerHTML = '';
    avatar.appendChild(img);
}

function initForm() {
    const form = document.getElementById('profileForm');
    const avatar = document.getElementById('profileAvatarLarge');
    // FIXED: Changed 'AddPhotoBtn' to 'addPhotoBtn' (lowercase)
    const addPhotoBtn = document.getElementById('addPhotoBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modal = document.getElementById('successModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    let hasChanges = false;
    let formData = {};

    // Load saved draft
    const draft = localStorage.getItem('meditrack_draft');
    if (draft) {
        formData = JSON.parse(draft);
        populateForm(formData);
        hasChanges = true;
        showToast('Draft loaded from previous session', 'info');
    }

    // Form input handler
    form.addEventListener('input', (e) => {
        hasChanges = true;
        formData[e.target.name] = e.target.value;
        saveDraft();
        validateField(e.target);
        updateSaveButton();
    });

    // Photo upload - ONLY through button
    const handlePhotoUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be less than 5MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                updateAvatar(event.target.result);
                hasChanges = true;
                formData.avatar = event.target.result;
                saveDraft();
                updateSaveButton();
                showToast('Profile photo updated via button', 'success');
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    };

    // Only button should trigger upload
    if (addPhotoBtn) {
        addPhotoBtn.addEventListener('click', handlePhotoUpload);
    } else {
        console.error('Add Photo button not found! Check ID:', 'addPhotoBtn');
    }

    // Form submission - UPDATED FOR BACKEND INTEGRATION
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast('Please fix form errors before submitting', 'error');
            return;
        }
        
        saveBtn.classList.add('loading');
        saveBtn.disabled = true;
        
        try {
            // Prepare data for backend
            const dataToSend = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                bloodType: formData.bloodType,
                height: formData.height,
                weight: formData.weight,
                allergies: formData.allergies,
                medications: formData.medications,
                emergencyName: formData.emergencyName,
                emergencyRelation: formData.emergencyRelation,
                emergencyPhone: formData.emergencyPhone,
                avatar: formData.avatar
            };
            
            // Send data to backend
            const response = await fetch('/profile/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify(dataToSend)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear draft after successful save
                localStorage.removeItem('meditrack_draft');
                localStorage.setItem('meditrack_profile', JSON.stringify(formData));
                
                showSuccessModal();
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = result.redirect_url || '/dashboard';
                }, 2000);
                
            } else {
                throw new Error(result.message || 'Failed to save profile');
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            showToast(error.message || 'Failed to save profile. Please try again.', 'error');
        } finally {
            saveBtn.classList.remove('loading');
            saveBtn.disabled = false;
        }
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        if (!hasChanges) return;
        
        showConfirmation({
            title: 'Discard Changes?',
            message: 'All unsaved changes will be lost.',
            confirmText: 'Discard',
            cancelText: 'Keep Editing',
            onConfirm: () => {
                form.reset();
                hasChanges = false;
                formData = {};
                localStorage.removeItem('meditrack_draft');
                updateSaveButton();
                showToast('Changes discarded', 'info');
            }
        });
    });

    // Modal close
    modalCloseBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Auto-save draft every 30 seconds
    setInterval(() => {
        if (hasChanges) {
            saveDraft();
            console.log('Auto-saved draft');
        }
    }, 30000);

    // Save draft function
    function saveDraft() {
        localStorage.setItem('meditrack_draft', JSON.stringify(formData));
    }

    // Update save button state
    function updateSaveButton() {
        saveBtn.disabled = !hasChanges;
        saveBtn.style.opacity = hasChanges ? '1' : '0.7';
        saveBtn.style.cursor = hasChanges ? 'pointer' : 'not-allowed';
        
        cancelBtn.style.opacity = hasChanges ? '1' : '0.7';
        cancelBtn.disabled = !hasChanges;
    }

    // Initial update
    updateSaveButton();
}

// Helper function to get CSRF token
function getCSRFToken() {
    const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfTokenElement) {
        return csrfTokenElement.value;
    }
    
    // Try to get from cookies as fallback
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function initAnimations() {
    // Add subtle animations to form elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe form sections
    document.querySelectorAll('.form-section').forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(section);
    });
}

function initInteractions() {
    // Enhanced focus effects
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('focus', () => {
            field.parentElement.classList.add('focused');
        });
        
        field.addEventListener('blur', () => {
            field.parentElement.classList.remove('focused');
        });
    });

    // Hover effects for privacy options
    document.querySelectorAll('.privacy-option').forEach(option => {
        option.addEventListener('mouseenter', () => {
            option.style.transform = 'translateY(-4px)';
        });
        
        option.addEventListener('mouseleave', () => {
            option.style.transform = 'translateY(0)';
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.getElementById('saveBtn');
            if (!saveBtn.disabled) {
                document.getElementById('profileForm').dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape to close modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('successModal');
            if (modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        }
    });
}

function validateForm() {
    let isValid = true;
    
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender'];
    
    requiredFields.forEach(fieldName => {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field && !validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const parent = field.closest('.form-group');
    
    // Clear previous states
    parent.classList.remove('error', 'success');
    
    if (field.hasAttribute('required') && !value) {
        parent.classList.add('error');
        return false;
    }
    
    // Email validation (if email field exists)
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            parent.classList.add('error');
            return false;
        }
    }
    
    // Date validation (not in future)
    if (field.type === 'date' && value) {
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate > today) {
            parent.classList.add('error');
            return false;
        }
    }
    
    // Number validation for height and weight
    if (field.type === 'number' && value) {
        const numValue = parseFloat(value);
        if (field.id === 'height' && (numValue < 50 || numValue > 300)) {
            parent.classList.add('error');
            return false;
        }
        if (field.id === 'weight' && (numValue < 20 || numValue > 500)) {
            parent.classList.add('error');
            return false;
        }
    }
    
    parent.classList.add('success');
    return true;
}

function populateForm(data) {
    Object.keys(data).forEach(key => {
        const field = document.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = data[key];
            } else {
                field.value = data[key];
            }
        }
    });
    
    if (data.avatar) {
        updateAvatar(data.avatar);
    }
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${getToastIcon(type)}
            </svg>
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
}

function getToastIcon(type) {
    switch(type) {
        case 'success':
            return '<polyline points="20,6 9,17 4,12"/>';
        case 'error':
            return '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
        case 'warning':
            return '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
        default:
            return '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
    }
}

function showConfirmation({ title, message, confirmText, cancelText, onConfirm }) {
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal active';
    modal.innerHTML = `
        <div class="confirmation-content">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirmation-actions">
                <button class="btn-secondary cancel-btn">${cancelText}</button>
                <button class="btn-primary confirm-btn">${confirmText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .confirmation-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .confirmation-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .confirmation-content {
            background: white;
            border-radius: 1.5rem;
            padding: 2.5rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        
        .confirmation-modal.active .confirmation-content {
            transform: scale(1);
        }
        
        .confirmation-content h3 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #1A202C;
        }
        
        .confirmation-content p {
            color: #64748B;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .confirmation-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);
    
    // Add event listeners
    modal.querySelector('.confirm-btn').addEventListener('click', () => {
        modal.remove();
        style.remove();
        onConfirm();
    });
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
        style.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            style.remove();
        }
    });
}

// Add toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: white;
        border-radius: 1rem;
        padding: 1.25rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 9998;
        transform: translateX(150%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
    }
    
    .toast.show {
        transform: translateX(0);
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .toast-content svg {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
    }
    
    .toast-success .toast-content svg {
        color: #10B981;
    }
    
    .toast-error .toast-content svg {
        color: #EF4444;
    }
    
    .toast-warning .toast-content svg {
        color: #F59E0B;
    }
    
    .toast-info .toast-content svg {
        color: #3B82F6;
    }
    
    .toast-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #94A3B8;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        transition: color 0.2s ease;
    }
    
    .toast-close:hover {
        color: #64748B;
    }
`;
document.head.appendChild(toastStyles);

// Prevent navigation with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (localStorage.getItem('meditrack_draft')) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

/* Add ripple effect via JavaScript */
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn-primary');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Remove existing ripples
            const existingRipples = this.querySelectorAll('.ripple');
            existingRipples.forEach(ripple => ripple.remove());
            
            // Create new ripple
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            // Get click position
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            // Style ripple
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                top: ${y}px;
                left: ${x}px;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});