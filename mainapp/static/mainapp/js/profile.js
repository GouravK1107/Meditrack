// DOM Elements
const backButton = document.getElementById('backButton');
const editButton = document.getElementById('editButton');
const fabMain = document.getElementById('fabMain');
const fabMenu = document.getElementById('fabMenu');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');

// Function to check if element exists in DOM
function checkPrivacyElements() {
    const privacyItems = document.querySelectorAll('.privacy-item');
    return privacyItems.length > 0;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing profile...');
    initializeEventListeners();
    setupInteractions();
    console.log('✅ MediTrack+ User Profile Page Initialized');
});

// Event Listeners
function initializeEventListeners() {
    if (backButton) backButton.addEventListener('click', handleBackNavigation);
    if (editButton) editButton.addEventListener('click', handleEditProfile);
    if (fabMain) fabMain.addEventListener('click', toggleFabMenu);

    const fabItems = document.querySelectorAll('.fab-item');
    fabItems.forEach(item => {
        item.addEventListener('click', handleFabAction);
    });

    if (profileAvatarLarge) profileAvatarLarge.addEventListener('click', handleAvatarClick);

    document.addEventListener('keydown', handleKeyboardNavigation);
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('scroll', handleScroll);
}

// Navigation handling
function handleBackNavigation(e) {
    e.preventDefault();
    document.body.style.opacity = '0.8';
    setTimeout(() => {
        window.location.href = "{% url 'dashboard' %}";
    }, 300);
}

function handleEditProfile() {
    if (!editButton) return;

    editButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
        editButton.style.transform = 'scale(1)';
    }, 150);

    setTimeout(() => {
        window.location.href = "{% url 'edit_profile' %}";
    }, 300);
}

// Utility functions
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

function updateBMIColor() {
    const bmiElement = document.getElementById('bmi');
    if (!bmiElement) return;
    
    const bmiText = bmiElement.textContent;
    const bmiMatch = bmiText.match(/(\d+\.?\d*)/);
    
    if (bmiMatch) {
        const bmiValue = parseFloat(bmiMatch[0]);
        
        // Remove all BMI classes
        bmiElement.classList.remove('bmi-normal', 'bmi-underweight', 'bmi-overweight', 'bmi-danger');
        
        // Add appropriate class based on BMI value
        if (bmiValue < 18.5) {
            bmiElement.classList.add('bmi-underweight');
        } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
            bmiElement.classList.add('bmi-normal');
        } else if (bmiValue >= 25 && bmiValue <= 29.9) {
            bmiElement.classList.add('bmi-overweight');
        } else {
            bmiElement.classList.add('bmi-danger');
        }
    }
}

// Call it on page load
document.addEventListener('DOMContentLoaded', updateBMIColor);

function updatePrivacyDisplay() {
    const privacyItems = document.querySelectorAll('.privacy-item');

    if (privacyItems.length < 3) {
        console.warn('Missing .privacy-item elements in the DOM.');
        return;
    }

    // Default privacy settings
    const privacySettings = {
        dataSharing: false,
        medicationAlerts: true,
        healthTips: true
    };

    const settings = [
        { key: 'dataSharing', element: privacyItems[0] },
        { key: 'medicationAlerts', element: privacyItems[1] },
        { key: 'healthTips', element: privacyItems[2] }
    ];

    settings.forEach(setting => {
        const statusElement = setting.element.querySelector('.privacy-status');
        if (!statusElement) return;

        const isEnabled = privacySettings[setting.key];
        statusElement.textContent = isEnabled ? 'Enabled' : 'Disabled';
        statusElement.className = `privacy-status ${isEnabled ? 'enabled' : 'disabled'}`;
    });
}

// Floating Action Button handling
function toggleFabMenu() {
    const isActive = fabMenu.classList.contains('active');

    if (isActive) {
        closeFabMenu();
    } else {
        openFabMenu();
    }
}

function openFabMenu() {
    fabMenu.classList.add('active');
    fabMain.classList.add('active');

    const fabItems = document.querySelectorAll('.fab-item');
    fabItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.style.animation = 'slideInUp 0.3s ease-out forwards';
    });
}

function closeFabMenu() {
    fabMenu.classList.remove('active');
    fabMain.classList.remove('active');
}

function handleFabAction(e) {
    const target = e.currentTarget;
    if (!target) {
        console.error('FAB action target not found');
        return;
    }

    const action = target.getAttribute('data-action');
    if (!action) {
        console.error('FAB action attribute missing');
        return;
    }

    target.style.transform = 'scale(0.95)';
    setTimeout(() => {
        target.style.transform = 'scale(1)';
    }, 150);

    switch (action) {
        case 'edit':
            handleEditProfile(e);
            break;
        case 'export':
            handleExportData();
            break;
        case 'share':
            handleShareWithDoctor();
            break;
        default:
            console.warn(`Unknown FAB action: ${action}`);
    }

    closeFabMenu();
}

// Export profile data as PDF using jsPDF
async function handleExportData() {
    showNotification('Preparing your health report...', 'info');

    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        showNotification('PDF export library not loaded', 'error');
        return;
    }

    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Header ---
        doc.setFontSize(20);
        doc.setTextColor(33, 150, 243);
        doc.setFont('helvetica', 'bold');
        doc.text('MediTrack Health Report', 105, 20, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(90);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

        doc.setDrawColor(200);
        doc.line(20, 32, 190, 32);

        // --- Layout setup ---
        let y = 42;
        const maxY = 275;
        const boxMargin = 8;
        const lineHeight = 6;
        const boxPadding = 4;

        const drawBox = (title, content) => {
            const lines = doc.splitTextToSize(content, 150);
            const boxHeight = lines.length * lineHeight + boxPadding * 2;

            if (y + boxHeight + 10 > maxY) {
                doc.addPage();
                y = 20;
            }

            doc.setDrawColor(220);
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(20, y, 170, boxHeight + 8, 3, 3, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(33, 33, 33);
            doc.text(title, 25, y + 8);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(66, 66, 66);
            doc.text(lines, 25, y + 16);

            y += boxHeight + boxMargin + 8;
        };

        const format = (label, value) => `${label}: ${value ? value : 'Not provided'}`;

        // Get data from the page
        const displayName = document.getElementById('displayName');
        const phoneEl = document.getElementById('phone');
        const genderEl = document.getElementById('gender');
        const dobEl = document.getElementById('dateOfBirth');
        const bloodTypeEl = document.getElementById('bloodType');
        const heightEl = document.getElementById('height');
        const weightEl = document.getElementById('weight');
        const bmiEl = document.getElementById('bmi');
        
        // Collect data from page
        const pageData = {
            fullName: displayName ? displayName.textContent : '',
            phone: phoneEl ? phoneEl.textContent : '',
            gender: genderEl ? genderEl.textContent : '',
            dateOfBirth: dobEl ? dobEl.textContent : '',
            bloodType: bloodTypeEl ? bloodTypeEl.textContent : '',
            height: heightEl ? heightEl.textContent : '',
            weight: weightEl ? weightEl.textContent : '',
            bmi: bmiEl ? bmiEl.textContent : ''
        };

        // --- Data Fields to Include ---
        drawBox('Personal Information', [
            format('Full Name', pageData.fullName),
            format('Phone Number', pageData.phone),
            format('Date of Birth', pageData.dateOfBirth),
            format('Gender', pageData.gender)
        ].join('\n'));

        drawBox('Physical Details', [
            format('Blood Type', pageData.bloodType),
            format('Height', pageData.height),
            format('Weight', pageData.weight),
            format('BMI', pageData.bmi)
        ].join('\n'));

        // Get allergies and medications
        const allergiesList = document.getElementById('allergiesList');
        const medicationsList = document.getElementById('medicationsList');
        
        let allergiesText = 'None';
        if (allergiesList) {
            const allergyTags = allergiesList.querySelectorAll('.allergy-tag');
            if (allergyTags.length > 0) {
                allergiesText = Array.from(allergyTags).map(tag => tag.textContent).join(', ');
            }
        }
        
        let medicationsText = 'None';
        if (medicationsList) {
            const medicationItems = medicationsList.querySelectorAll('.medication-item');
            if (medicationItems.length > 0) {
                medicationsText = Array.from(medicationItems).map(item => {
                    const name = item.querySelector('.medication-name');
                    const dose = item.querySelector('.medication-dose');
                    return name ? `${name.textContent}${dose ? ` (${dose.textContent})` : ''}` : '';
                }).filter(text => text).join(', ');
            }
        }

        drawBox('Medical Information', [
            format('Allergies', allergiesText),
            format('Medications', medicationsText)
        ].join('\n'));

        // Get emergency contact
        const emergencyName = document.getElementById('emergencyName');
        const emergencyRelation = document.getElementById('emergencyRelation');
        const emergencyPhone = document.getElementById('emergencyPhone');

        drawBox('Emergency Contact', [
            format('Name', emergencyName ? emergencyName.textContent : ''),
            format('Relationship', emergencyRelation ? emergencyRelation.textContent : ''),
            format('Phone', emergencyPhone ? emergencyPhone.textContent : '')
        ].join('\n'));

        doc.save('meditrack-health-report.pdf');
        showNotification('PDF exported successfully!', 'success');
    }, 1000);
}

// Generate share code (6 characters)
function generateShareCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Handle sharing: generate URL and show modal with link
function handleShareWithDoctor() {
    showNotification('Generating secure share link...', 'info');

    setTimeout(() => {
        const shareCode = generateShareCode();
        const shareUrl = `${window.location.origin}/templates/user_profile.html?code=${shareCode}`;
        showShareModal(shareUrl);
    }, 1500);
}

// Show modal with the share link
function showShareModal(shareUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-icon success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
            </div>
            <h3>Share with Healthcare Provider</h3>
            <p>Your secure share link is:</p>
            <div class="share-code"><a href="${shareUrl}" target="_blank" rel="noopener noreferrer">${shareUrl}</a></div>
            <p class="share-note">This link expires in 24 hours and provides read-only access to your profile.</p>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="copyShareLink('${shareUrl}')">Copy Link</button>
                <button class="btn-primary" onclick="closeModal()">Done</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 100);

    const modalStyles = `
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(5px);
        }

        .modal-overlay.active {
            opacity: 1;
        }

        .modal {
            background: #fff;
            border-radius: 1.25rem;
            padding: 1.8rem 2rem 2.5rem;
            max-width: 320px; /* reduced size */
            width: 85%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(25, 118, 210, 0.22);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            position: relative;
            animation: modalFadeIn 0.35s ease forwards;
        }

        @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .modal-icon.success {
            width: 40px;  /* smaller icon */
            height: 40px;
            margin: 0 auto 0.8rem auto;
            stroke-width: 1.5;
            color: #1976D2;
        }

        .share-code {
            font-size: 1.1rem; /* smaller font */
            font-weight: 700;
            color: #1565C0;
            background: #E3F2FD;
            padding: 0.8rem 1rem;
            border-radius: 1rem;
            margin: 1rem 0 1.5rem;
            letter-spacing: 0.12em;
            word-break: break-word;
            box-shadow: 0 3px 10px rgba(21, 101, 192, 0.15);
            user-select: text; /* allow copying */
            cursor: text; /* show text cursor */
        }

        .share-code a {
            pointer-events: none; /* disable link clicking */
            text-decoration: none;
            color: inherit;
        }

        .share-note {
            font-size: 0.8rem;
            color: #7a7a7a;
            margin-bottom: 1.8rem;
            font-style: italic;
        }

        .modal-actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
        }

        .btn-primary, .btn-secondary {
            padding: 0.65rem 1.4rem;
            border-radius: 0.85rem;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.3s ease, box-shadow 0.25s ease;
            border: none;
            min-width: 90px;
            user-select: none;
            box-shadow: 0 3px 6px rgba(0,0,0,0.08);
        }

        .btn-primary {
            background: linear-gradient(135deg, #1976D2, #1565C0);
            color: #fff;
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, #1565C0, #0d3a75);
            box-shadow: 0 5px 14px rgba(21, 101, 192, 0.45);
        }

        .btn-secondary {
            background: #fff;
            color: #616161;
            border: 1.5px solid #c0c0c0;
        }

        .btn-secondary:hover {
            background: #f5f5f5;
            border-color: #999;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);

    window.copyShareLink = function(url) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Share link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    };

    window.closeModal = function() {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) document.body.removeChild(modal);
            if (styleSheet.parentNode) document.head.removeChild(styleSheet);
            delete window.copyShareLink;
            delete window.closeModal;
        }, 300);
    };
}

// Avatar handling
function handleAvatarClick() {
    if (!profileAvatarLarge) return;

    profileAvatarLarge.style.transform = 'scale(0.95)';
    setTimeout(() => {
        profileAvatarLarge.style.transform = 'scale(1)';
    }, 150);

    showNotification('Click "Edit Profile" to change your photo', 'info');
}

// Interaction enhancements
function setupInteractions() {
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });

    const healthStats = document.querySelectorAll('.health-stat');
    healthStats.forEach(stat => {
        stat.addEventListener('mouseenter', () => {
            stat.style.transform = 'translateY(-3px)';
        });
        stat.addEventListener('mouseleave', () => {
            stat.style.transform = 'translateY(0)';
        });
    });

    const badges = document.querySelectorAll('.badge');
    badges.forEach(badge => {
        badge.addEventListener('click', () => {
            badge.style.transform = 'scale(0.95)';
            setTimeout(() => {
                badge.style.transform = 'scale(1)';
            }, 150);

            if (badge.classList.contains('verified')) {
                showNotification('Your account is verified and secure', 'success');
            } else if (badge.classList.contains('premium')) {
                showNotification('You have premium access to all features', 'info');
            }
        });
    });

    // Check and update privacy display
    if (checkPrivacyElements()) {
        updatePrivacyDisplay();
    }
}

// Event handling
function handleOutsideClick(e) {
    if (!fabMain || !fabMenu) return;

    if (!fabMain.contains(e.target) && !fabMenu.contains(e.target)) {
        closeFabMenu();
    }
}

function handleScroll() {
    if (!fabMain) return;

    const scrollY = window.scrollY;

    if (scrollY > 100) {
        fabMain.style.transform = 'scale(0.9)';
    } else {
        fabMain.style.transform = 'scale(1)';
    }
}

function handleKeyboardNavigation(e) {
    if (e.key === 'Escape') {
        closeFabMenu();
    }

    if (e.key.toLowerCase() === 'e') {
        if (!e.ctrlKey && !e.metaKey) {
            handleEditProfile(e);
        }
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleEditProfile(e);
    }

    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        toggleFabMenu();
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Add this function to update BMI colors based on value
function updateBMIColor() {
    const bmiElement = document.getElementById('bmi');
    if (!bmiElement) return;
    
    const bmiText = bmiElement.textContent;
    const bmiMatch = bmiText.match(/(\d+\.?\d*)/);
    
    if (bmiMatch) {
        const bmiValue = parseFloat(bmiMatch[0]);
        
        // Remove all BMI classes
        bmiElement.classList.remove('bmi-normal', 'bmi-underweight', 'bmi-overweight', 'bmi-danger');
        
        // Add appropriate class based on BMI value
        if (bmiValue < 18.5) {
            bmiElement.classList.add('bmi-underweight');
        } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
            bmiElement.classList.add('bmi-normal');
        } else if (bmiValue >= 25 && bmiValue <= 29.9) {
            bmiElement.classList.add('bmi-overweight');
        } else {
            bmiElement.classList.add('bmi-danger');
        }
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile page initialized');
    initializeEventListeners();
    setupInteractions();
    updateBMIColor(); // Call the BMI color update function
});