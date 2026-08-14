// edit_profile.js - Complete Fixed Version
// DOM Elements
const profileForm = document.getElementById('profileForm');
const backButton = document.getElementById('backButton');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const successModal = document.getElementById('successModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const cancelModal = document.getElementById('cancelModal');
const continueBtn = document.getElementById('continueBtn');
const discardBtn = document.getElementById('discardBtn');

// Form state management
let originalFormData = {};
let hasUnsavedChanges = false;
let formData = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    initializeEventListeners();
    loadProfileData();
});

// Load profile data
async function loadProfileData() {
    try {
        // Show loading state
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }
        
        // Try to load from API first
        const response = await fetch(GET_PROFILE_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const profileData = result.profile;
            
            // Store original data
            originalFormData = { ...profileData };
            formData = { ...profileData };
            
            // Populate form with data
            populateForm(profileData);
            
            // Load profile photo if exists
            if (profileData.hasPhoto && profileData.photoUrl) {
                updateProfilePhoto(profileData.photoUrl);
            }
            
            console.log('Profile loaded from API:', profileData);
        } else {
            throw new Error(result.message || 'Failed to load profile');
        }
        
    } catch (error) {
        console.error('Error loading profile from API:', error);
        
        // Fallback to template data
        console.log('Falling back to template data');
        originalFormData = { ...INITIAL_PROFILE_DATA };
        formData = { ...INITIAL_PROFILE_DATA };
        populateForm(INITIAL_PROFILE_DATA);
        
        if (typeof PROFILE_PHOTO_URL !== 'undefined' && PROFILE_PHOTO_URL) {
            updateProfilePhoto(PROFILE_PHOTO_URL);
        }
        
        showNotification('Using local profile data', 'info');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M12 18v-6"></path>
                    <path d="M9 15l3 3 3-3"></path>
                </svg>
                Save Profile
            `;
        }
        updateSaveButtonState();
    }
}

// Event Listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Navigation
    if (backButton) {
        backButton.addEventListener('click', handleBackNavigation);
    }
    
    // Profile photo
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', handlePhotoChange);
    }
    
    // Form events
    if (profileForm) {
        profileForm.addEventListener('submit', handleFormSubmit);
        profileForm.addEventListener('input', handleFormInput);
        profileForm.addEventListener('change', handleFormChange);
        
        // Additional safety: listen on each form field directly
        const allInputs = profileForm.querySelectorAll('input, select, textarea');
        console.log(`Found ${allInputs.length} form fields to attach listeners to`);
        allInputs.forEach(input => {
            input.addEventListener('input', handleFormInput);
            input.addEventListener('change', handleFormChange);
        });
    }
    
    // Cancel button - show modal
    if (cancelBtn) {
        cancelBtn.addEventListener('click', showCancelModal);
        cancelBtn.disabled = false;
        cancelBtn.style.opacity = '1';
    }
    
    // Modal buttons
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeSuccessModal);
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', closeCancelModal);
    }
    
    if (discardBtn) {
        discardBtn.addEventListener('click', handleDiscardChanges);
    }
    
    // Modal overlays
    if (successModal) {
        successModal.addEventListener('click', handleModalOverlayClick);
    }
    
    if (cancelModal) {
        cancelModal.addEventListener('click', handleModalOverlayClick);
    }
    
    // Keyboard
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Before unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Force initial button state after a short delay
    setTimeout(() => {
        updateSaveButtonState();
    }, 500);
}

// Populate form with data
function populateForm(data) {
    const fieldMap = {
        'firstName': 'firstName',
        'lastName': 'lastName',
        'phone': 'phone',
        'dateOfBirth': 'dateOfBirth',
        'gender': 'gender',
        'bloodType': 'bloodType',
        'height': 'height',
        'weight': 'weight',
        'allergies': 'allergies',
        'medications': 'medications',
        'emergencyName': 'emergencyName',
        'emergencyRelation': 'emergencyRelation',
        'emergencyPhone': 'emergencyPhone'
    };
    
    Object.keys(fieldMap).forEach(key => {
        const fieldId = fieldMap[key];
        const field = document.getElementById(fieldId);
        if (field) {
            const value = data[key] || '';
            if (field.tagName === 'SELECT') {
                let optionFound = false;
                for (let option of field.options) {
                    if (option.value === value) {
                        option.selected = true;
                        optionFound = true;
                        break;
                    }
                }
                if (!optionFound && field.options.length > 0) {
                    field.selectedIndex = 0;
                }
            } else {
                field.value = value;
            }
        }
    });

    // Reset the unsaved changes flag after loading
    hasUnsavedChanges = false;
    formData = { ...data };
    updateSaveButtonState();
}

// Navigation
function handleBackNavigation(e) {
    e.preventDefault();
    
    if (hasUnsavedChanges) {
        const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
        if (!confirmLeave) return;
    }
    
    window.location.href = DASHBOARD_URL || '/dashboard/';
}

function handleBeforeUnload(e) {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
}

// Profile photo
function handlePhotoChange() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            showNotification('File size must be less than 5MB', 'error');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            updateProfilePhoto(e.target.result);
            hasUnsavedChanges = true;
            formData.avatar = e.target.result;
            updateSaveButtonState();
            showNotification('Profile photo updated', 'success');
        };
        reader.readAsDataURL(file);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function updateProfilePhoto(imageSrc) {
    if (!profileAvatarLarge) return;
    
    profileAvatarLarge.innerHTML = '';
    
    if (imageSrc) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
        `;
        img.onerror = () => {
            showDefaultAvatar();
        };
        profileAvatarLarge.appendChild(img);
    } else {
        showDefaultAvatar();
    }
}

function showDefaultAvatar() {
    if (!profileAvatarLarge) return;
    profileAvatarLarge.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    `;
}

// Form submission - FIXED VERSION
function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('=== FORM SUBMIT TRIGGERED ===');
    console.log('hasUnsavedChanges:', hasUnsavedChanges);
    console.log('saveBtn disabled?', saveBtn.disabled);
    console.log('EDIT_PROFILE_URL:', typeof EDIT_PROFILE_URL !== 'undefined' ? EDIT_PROFILE_URL : 'NOT DEFINED');
    
    // Don't submit if no changes
    if (!hasUnsavedChanges) {
        showNotification('No changes to save', 'info');
        return;
    }
    
    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Collect form data
    const formDataToSend = new FormData(profileForm);
    const data = {};
    
    formDataToSend.forEach((value, key) => {
        data[key] = value;
    });
    
    // Add avatar if exists (as base64 string)
    if (formData.avatar) {
        data.avatar = formData.avatar;
    }
    
    console.log('Sending data:', data);
    
    // Send to server
    fetch(EDIT_PROFILE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Server response:', result);
        
        if (result.success) {
            // Update originalFormData with the fresh data from server
            if (result.updated_profile) {
                originalFormData = { ...result.updated_profile };
                formData = { ...result.updated_profile };
                // Repopulate form with the server data to ensure consistency
                populateForm(result.updated_profile);
            } else {
                // Fallback: use the data we sent
                originalFormData = { ...data };
                formData = { ...data };
            }
            
            hasUnsavedChanges = false;
            updateSaveButtonState();
            
            // Show success modal (which will redirect after)
            showSuccessModal();
        } else {
            throw new Error(result.message || 'Failed to update profile');
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification(error.message || 'Failed to update profile', 'error');
        
        // Re-enable save button
        saveBtn.disabled = false;
        saveBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M12 18v-6"></path>
                <path d="M9 15l3 3 3-3"></path>
            </svg>
            Save Profile
        `;
    });
}

function handleFormInput(e) {
    if (!hasUnsavedChanges) {
        hasUnsavedChanges = true;
        updateSaveButtonState();
    }
    // Update global formData for potential avatar usage
    if (e.target.name) {
        formData[e.target.name] = e.target.value;
    }
}

function handleFormChange(e) {
    if (!hasUnsavedChanges) {
        hasUnsavedChanges = true;
        updateSaveButtonState();
    }
    if (e.target.name) {
        formData[e.target.name] = e.target.value;
    }
}

// CSRF token
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

// UI state - Fixed version
function updateSaveButtonState() {
    if (!saveBtn) return;
    
    if (hasUnsavedChanges) {
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'pointer';
        saveBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M12 18v-6"></path>
                <path d="M9 15l3 3 3-3"></path>
            </svg>
            Save Changes
        `;
        console.log('Save button enabled - changes present');
    } else {
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.7';
        saveBtn.style.cursor = 'not-allowed';
        saveBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M12 18v-6"></path>
                <path d="M9 15l3 3 3-3"></path>
            </svg>
            No Changes to Save
        `;
        console.log('Save button disabled - no changes');
    }
    
    // Cancel button should always be enabled
    if (cancelBtn) {
        cancelBtn.disabled = false;
        cancelBtn.style.opacity = '1';
        cancelBtn.style.cursor = 'pointer';
    }
}

// Cancel Modal Functions
function showCancelModal() {
    console.log('Showing cancel modal');
    if (cancelModal) {
        cancelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (continueBtn) continueBtn.focus();
        }, 300);
    }
}

function closeCancelModal() {
    if (cancelModal) {
        cancelModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Focus back on cancel button for accessibility
        setTimeout(() => {
            if (cancelBtn) cancelBtn.focus();
        }, 100);
    }
}

function handleDiscardChanges() {
    console.log('Discarding changes...');
    
    // Reset form to original data
    populateForm(originalFormData);
    
    // Reset profile photo to original
    if (originalFormData.avatar) {
        updateProfilePhoto(originalFormData.avatar);
    } else if (typeof PROFILE_PHOTO_URL !== 'undefined' && PROFILE_PHOTO_URL) {
        updateProfilePhoto(PROFILE_PHOTO_URL);
    } else {
        showDefaultAvatar();
    }
    
    // Reset form state
    hasUnsavedChanges = false;
    formData = { ...originalFormData };
    updateSaveButtonState();
    
    showNotification('All changes discarded', 'info');
    
    // Close the modal
    closeCancelModal();
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
        window.location.href = DASHBOARD_URL || '/dashboard/';
    }, 500);
}

// Success Modal Functions
function showSuccessModal() {
    if (successModal) {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (modalCloseBtn) modalCloseBtn.focus();
        }, 300);
    }
}

function closeSuccessModal() {
    if (successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            window.location.href = PROFILE_URL || '/profile/';
        }, 500);
    }
}

// Modal Overlay Click Handler
function handleModalOverlayClick(e) {
    if (e.target === successModal) {
        closeSuccessModal();
    }
    if (e.target === cancelModal) {
        closeCancelModal();
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = {
        success: '#43A047',
        error: '#F44336',
        info: '#1976D2'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        background-color: ${colors[type] || colors.info};
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 1001;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        font-family: 'Inter', sans-serif;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Keyboard Navigation
function handleKeyboardNavigation(e) {
    // Close success modal with Escape
    if (e.key === 'Escape' && successModal && successModal.classList.contains('active')) {
        closeSuccessModal();
    }
    
    // Show cancel modal with Escape when no modal is open
    if (e.key === 'Escape' && 
        successModal && !successModal.classList.contains('active') && 
        cancelModal && !cancelModal.classList.contains('active')) {
        e.preventDefault();
        if (hasUnsavedChanges) {
            showCancelModal();
        }
    }
    
    // Close cancel modal with Escape when it's open
    if (e.key === 'Escape' && cancelModal && cancelModal.classList.contains('active')) {
        e.preventDefault();
        closeCancelModal();
    }
    
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveBtn && !saveBtn.disabled && hasUnsavedChanges) {
            handleFormSubmit(e);
        }
    }
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .modal-overlay.active {
        display: flex !important;
        opacity: 1 !important;
        visibility: visible !important;
    }
    
    button:disabled {
        cursor: not-allowed !important;
    }
`;
document.head.appendChild(style);

console.log('edit_profile.js loaded successfully');