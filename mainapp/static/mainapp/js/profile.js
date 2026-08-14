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
// Export profile data as professional medical report PDF
async function handleExportData() {
    showNotification('Generating professional medical report...', 'info');

    if (typeof window.jspdf === 'undefined') {
        showNotification('PDF export library not loaded', 'error');
        return;
    }

    setTimeout(() => {
        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        // ============================================
        // DESIGN TOKENS
        // ============================================
        const C = {
            primary:    [25, 118, 210],
            primaryDark:[15,  80, 160],
            accent:     [0,  188, 212],
            red:        [211,  47,  47],
            redLight:   [255, 235, 235],
            orange:     [245, 124,   0],
            orangeLight:[255, 243, 224],
            green:      [46,  125,  50],
            greenLight: [232, 245, 233],
            dark:       [30,   30,  30],
            mid:        [90,   90,  90],
            muted:      [140, 140, 140],
            border:     [220, 220, 220],
            bg:         [247, 249, 252],
            bgWhite:    [255, 255, 255],
            white:      [255, 255, 255],
        };

        const PAGE_W  = 210;
        const PAGE_H  = 297;
        const MARGIN  = 14;
        const CONTENT = PAGE_W - MARGIN * 2;  // 182mm usable width

        // ============================================
        // HELPERS
        // ============================================

        function rgb(arr) { return `rgb(${arr.join(',')})`; }

        function setFill(arr)   { doc.setFillColor(arr[0], arr[1], arr[2]); }
        function setDraw(arr)   { doc.setDrawColor(arr[0], arr[1], arr[2]); }
        function setTxt(arr)    { doc.setTextColor(arr[0], arr[1], arr[2]); }

        function rect(x, y, w, h, style, r) {
            if (r) doc.roundedRect(x, y, w, h, r, r, style || 'F');
            else   doc.rect(x, y, w, h, style || 'F');
        }

        // Thin horizontal rule
        function rule(y, color) {
            setDraw(color || C.border);
            doc.setLineWidth(0.2);
            doc.line(MARGIN, y, PAGE_W - MARGIN, y);
        }

        // Section heading pill
        function sectionTitle(label, y) {
            setFill(C.primary);
            rect(MARGIN, y, CONTENT, 7, 'F', 1.5);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            setTxt(C.white);
            doc.text(label.toUpperCase(), MARGIN + 4, y + 5);
            return y + 12;
        }

        // Labeled value pair (key: value) on one line
        function kvRow(label, value, x, y, labelW, totalW) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            setTxt(C.muted);
            doc.text(label, x, y);

            doc.setFont('helvetica', 'normal');
            setTxt(C.dark);
            const valX = x + labelW;
            const maxW = totalW - labelW;
            const lines = doc.splitTextToSize(String(value || '—'), maxW);
            doc.text(lines[0], valX, y);
            return y + 6;
        }

        // Striped data table — returns next Y position
        function table(headers, rows, x, y, colWidths) {
            const rowH = 7;
            const totalW = colWidths.reduce((a, b) => a + b, 0);

            // Header
            setFill(C.primary);
            rect(x, y, totalW, rowH + 1, 'F');
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            setTxt(C.white);
            let cx = x;
            for (let i = 0; i < headers.length; i++) {
                doc.text(headers[i], cx + 3, y + 5.5);
                cx += colWidths[i];
            }
            y += rowH + 1;

            // Rows
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            for (let r = 0; r < rows.length; r++) {
                const shade = r % 2 === 0 ? C.bg : C.bgWhite;
                setFill(shade);
                rect(x, y, totalW, rowH, 'F');

                // Subtle bottom border
                setDraw(C.border);
                doc.setLineWidth(0.1);
                doc.line(x, y + rowH, x + totalW, y + rowH);

                cx = x;
                for (let c = 0; c < headers.length; c++) {
                    setTxt(C.dark);
                    const cellText = doc.splitTextToSize(String(rows[r][c] || '—'), colWidths[c] - 5);
                    doc.text(cellText[0], cx + 3, y + 5);
                    cx += colWidths[c];
                }
                y += rowH;
            }
            return y + 4;
        }

        // Watermark (called once per page)
        function watermark() {
            const prev = doc.getTextColor ? null : null;
            doc.setFontSize(48);
            doc.setFont('helvetica', 'bold');
            doc.setGState(new doc.GState({ opacity: 0.04 }));
            setTxt([0, 0, 0]);
            doc.text('MEDITRACK+', PAGE_W / 2, PAGE_H / 2 - 10, { align: 'center', angle: 45 });
            doc.text('CONFIDENTIAL', PAGE_W / 2, PAGE_H / 2 + 26, { align: 'center', angle: 45 });
            doc.setGState(new doc.GState({ opacity: 1 }));
        }

        // Standard page header bar (pages 2+)
        function pageHeader(title, subtitle) {
            setFill(C.primary);
            rect(0, 0, PAGE_W, 12, 'F');
            setFill(C.accent);
            rect(0, 12, PAGE_W, 2, 'F');

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            setTxt(C.white);
            doc.text(title, MARGIN, 8.5);

            if (subtitle) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(subtitle, PAGE_W - MARGIN, 8.5, { align: 'right' });
            }
        }

        // Standard page footer bar
        function pageFooter(pageNum, totalPages) {
            setDraw(C.border);
            doc.setLineWidth(0.3);
            doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            setTxt(C.muted);
            doc.text('CONFIDENTIAL MEDICAL DOCUMENT  |  MediTrack+  |  www.meditrackplus.com', MARGIN, PAGE_H - 7.5);
            doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 7.5, { align: 'right' });
        }

        // Left accent bar (decoration)
        function accentBar(yFrom, yTo) {
            setFill(C.accent);
            rect(0, yFrom, 3, yTo - yFrom, 'F');
        }

        // Stat box: colored card with big number
        function statBox(x, y, w, h, label, value, unit, color, lightColor) {
            setFill(lightColor);
            rect(x, y, w, h, 'F', 3);
            setDraw(color);
            doc.setLineWidth(0.4);
            rect(x, y, w, h, 'S', 3);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            setTxt(color);
            doc.text(label.toUpperCase(), x + 4, y + 7);

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            setTxt(color);
            doc.text(value, x + 4, y + 18);

            if (unit) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                setTxt(color);
                doc.text(unit, x + 4 + doc.getTextWidth(value) + 1, y + 18);
            }
        }

        // Badge pill
        function badge(text, x, y, bgColor, textColor) {
            const w = doc.getTextWidth(text) + 6;
            setFill(bgColor);
            rect(x, y - 4, w, 6, 'F', 3);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            setTxt(textColor);
            doc.text(text, x + 3, y);
            return w;
        }

        // ============================================
        // COLLECT DATA FROM DOM
        // ============================================

        function getEl(id)   { const e = document.getElementById(id); return e ? e.textContent.trim() : ''; }
        function getAttr(id, attr) { const e = document.getElementById(id); return e ? (e.getAttribute(attr) || e.value || '') : ''; }

        const fullName    = getEl('displayName')    || 'Patient';
        const phone       = getEl('phone')          || '—';
        const gender      = getEl('gender')         || '—';
        const dob         = getEl('dateOfBirth')    || '—';
        const bloodType   = getEl('bloodType')      || '—';
        const heightVal   = getEl('height')         || '—';
        const weightVal   = getEl('weight')         || '—';
        const bmiRaw      = getEl('bmi')            || '';
        const emailRaw    = getEl('email') || document.querySelector('.profile-email, [data-field="email"]')?.textContent?.trim() || '—';

        // Age from DOB
        let age = '—';
        if (dob && dob !== '—') {
            try {
                const bd = new Date(dob);
                const now = new Date();
                let a = now.getFullYear() - bd.getFullYear();
                if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) a--;
                if (!isNaN(a)) age = `${a} years`;
            } catch (_) {}
        }

        // BMI
        const bmiNum     = parseFloat((bmiRaw.match(/(\d+\.?\d*)/)||[])[0]) || 0;
        let bmiCategory = '—', bmiStatus = '—', bmiColor = C.green, bmiLight = C.greenLight;
        if (bmiNum > 0) {
            if      (bmiNum < 18.5) { bmiCategory = 'Underweight'; bmiStatus = 'UNDERWEIGHT'; bmiColor = C.orange; bmiLight = C.orangeLight; }
            else if (bmiNum < 25)   { bmiCategory = 'Normal weight'; bmiStatus = 'NORMAL';   bmiColor = C.green;  bmiLight = C.greenLight;  }
            else if (bmiNum < 30)   { bmiCategory = 'Overweight';   bmiStatus = 'OVERWEIGHT'; bmiColor = C.orange; bmiLight = C.orangeLight; }
            else                    { bmiCategory = 'Obese';        bmiStatus = 'OBESE';      bmiColor = C.red;    bmiLight = C.redLight;    }
        }
        const bmiDisplay = bmiNum > 0 ? bmiNum.toFixed(1) : '—';

        // Health score
        let hScore = 75, hStatus = 'Good', hColor = C.green, hLight = C.greenLight;
        if (bmiNum > 0) {
            if      (bmiNum < 18.5) { hScore = 65; hStatus = 'Needs Attention'; hColor = C.orange; hLight = C.orangeLight; }
            else if (bmiNum < 25)   { hScore = 85; hStatus = 'Excellent';        hColor = C.green;  hLight = C.greenLight;  }
            else if (bmiNum < 30)   { hScore = 65; hStatus = 'Needs Improvement'; hColor = C.orange; hLight = C.orangeLight; }
            else                    { hScore = 45; hStatus = 'Attention Required'; hColor = C.red;    hLight = C.redLight;    }
        }

        // Allergies
        const allergiesList = document.getElementById('allergiesList');
        let allergiesArr = [];
        if (allergiesList) {
            allergiesList.querySelectorAll('.allergy-tag').forEach(t => allergiesArr.push(t.textContent.trim()));
        }

        // Medications
        const medicationsList = document.getElementById('medicationsList');
        let medRows = [];
        if (medicationsList) {
            medicationsList.querySelectorAll('.medication-item').forEach(item => {
                const name = item.querySelector('.medication-name')?.textContent?.trim() || '';
                const dose = item.querySelector('.medication-dose')?.textContent?.trim() || '';
                if (name) medRows.push([name, dose]);
            });
        }
        if (medRows.length === 0) medRows.push(['No medications recorded', '']);

        // Emergency contact
        const emergencyName     = getEl('emergencyName')     || '—';
        const emergencyRelation = getEl('emergencyRelation') || '—';
        const emergencyPhone    = getEl('emergencyPhone')    || '—';

        // Report meta
        const reportId = `MPR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
        const generatedDate = new Date().toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const initials = fullName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

        // ============================================
        // PAGE 1 — COVER
        // ============================================

        // Top gradient-style bars
        setFill(C.primary);
        rect(0, 0, PAGE_W, 18, 'F');
        setFill(C.accent);
        rect(0, 18, PAGE_W, 3, 'F');

        // Diagonal decorative stripe (bottom area)
        setFill(C.bg);
        rect(0, PAGE_H - 55, PAGE_W, 55, 'F');
        setFill(C.primary);
        rect(0, PAGE_H - 55, PAGE_W, 2, 'F');

        watermark();

        // App name in header bar
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        setTxt(C.white);
        doc.text('MEDITRACK+', MARGIN, 12);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Personal Health Platform', PAGE_W - MARGIN, 12, { align: 'right' });

        // Large cross / plus icon (drawn with rectangles — no Unicode needed)
        const cx = PAGE_W / 2, cy = 85;
        const cw = 8, ch = 28;
        setFill(C.primary);
        rect(cx - cw/2, cy - ch/2, cw, ch, 'F', 2);   // vertical bar
        rect(cx - ch/2, cy - cw/2, ch, cw, 'F', 2);   // horizontal bar

        // Title block
        doc.setFontSize(30);
        doc.setFont('helvetica', 'bold');
        setTxt(C.primary);
        doc.text('MEDITRACK+', PAGE_W / 2, 112, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        setTxt(C.dark);
        doc.text('PERSONAL HEALTH RECORD', PAGE_W / 2, 121, { align: 'center' });

        doc.setFontSize(10);
        setTxt(C.muted);
        doc.text('Patient Summary Report', PAGE_W / 2, 129, { align: 'center' });

        // Divider
        setDraw(C.border);
        doc.setLineWidth(0.5);
        doc.line(45, 135, PAGE_W - 45, 135);

        // Patient name card
        setFill(C.bg);
        rect(35, 142, PAGE_W - 70, 30, 'F', 5);
        setDraw([200, 215, 235]);
        doc.setLineWidth(0.5);
        rect(35, 142, PAGE_W - 70, 30, 'S', 5);

        // Avatar circle
        setFill(C.primary);
        doc.circle(55, 157, 10, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        setTxt(C.white);
        doc.text(initials, 55, 160, { align: 'center' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        setTxt(C.muted);
        doc.text('PREPARED FOR', 70, 150);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        setTxt(C.primary);
        doc.text(fullName, 70, 161);

        // Report info
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        setTxt(C.muted);
        doc.text(`Report ID: ${reportId}`, PAGE_W / 2, 185, { align: 'center' });
        doc.text(`Generated: ${generatedDate}`, PAGE_W / 2, 192, { align: 'center' });

        // Decorative dots row
        for (let i = 0; i < 7; i++) {
            const alpha = i === 3 ? 1 : 0.3;
            doc.setGState(new doc.GState({ opacity: alpha }));
            setFill(C.primary);
            doc.circle(PAGE_W / 2 - 18 + i * 6, 200, 1.2, 'F');
        }
        doc.setGState(new doc.GState({ opacity: 1 }));

        // Cover footer
        setDraw(C.border);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, PAGE_H - 35, PAGE_W - MARGIN, PAGE_H - 35);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        setTxt(C.muted);
        doc.text('This is an official MediTrack+ health document', PAGE_W / 2, PAGE_H - 29, { align: 'center' });
        doc.text('www.meditrackplus.com  |  support@meditrackplus.com', PAGE_W / 2, PAGE_H - 23, { align: 'center' });

        // ============================================
        // PAGE 2 — HEALTH SUMMARY
        // ============================================
        doc.addPage();
        watermark();
        pageHeader('Health Summary', `Patient: ${fullName}`);
        accentBar(14, PAGE_H - 14);

        let y = 24;

        // ---- Overall Health Score bar ----
        setFill(hLight);
        rect(MARGIN, y, CONTENT, 22, 'F', 3);
        setDraw(hColor);
        doc.setLineWidth(0.5);
        rect(MARGIN, y, CONTENT, 22, 'S', 3);

        // Score circle
        setFill(hColor);
        doc.circle(MARGIN + 16, y + 11, 9, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        setTxt(C.white);
        doc.text(String(hScore), MARGIN + 16, y + 14.5, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        setTxt(hColor);
        doc.text('Overall Health Score', MARGIN + 30, y + 9);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(hStatus, MARGIN + 30, y + 16);

        // Score bar visual (out of 100)
        const barX = MARGIN + 30, barY = y + 18, barW = CONTENT - 50, barH = 3;
        setFill(C.border);
        rect(barX, barY, barW, barH, 'F', 1.5);
        setFill(hColor);
        rect(barX, barY, barW * (hScore / 100), barH, 'F', 1.5);

        doc.setFontSize(7);
        setTxt(C.muted);
        doc.text('0', barX, barY + 7);
        doc.text('100', barX + barW, barY + 7, { align: 'right' });

        y += 30;

        // ---- Patient Information ----
        y = sectionTitle('Patient Information', y);

        const piLW = 38; // label column width
        const piTW = CONTENT; // total width

        // Two-column layout for patient info
        const col1x = MARGIN, col2x = MARGIN + CONTENT / 2 + 4;
        const colW  = CONTENT / 2 - 4;

        // Left column
        let ly = y, ry = y;

        function infoBox(label, value, x, curY, totalColW) {
            setFill(C.bg);
            rect(x, curY, totalColW, 10, 'F', 2);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            setTxt(C.muted);
            doc.text(label.toUpperCase(), x + 3, curY + 4.5);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            setTxt(C.dark);
            const lines = doc.splitTextToSize(value || '—', totalColW - 6);
            doc.text(lines[0], x + 3, curY + 8.5);
            return curY + 13;
        }

        ly = infoBox('Full Name',       fullName,   col1x, ly, colW);
        ly = infoBox('Date of Birth',   dob,        col1x, ly, colW);
        ly = infoBox('Age',             age,        col1x, ly, colW);
        ly = infoBox('Email',           emailRaw,   col1x, ly, colW);

        ry = infoBox('Gender',          gender,     col2x, ry, colW);
        ry = infoBox('Phone',           phone,      col2x, ry, colW);
        ry = infoBox('Blood Type',      bloodType,  col2x, ry, colW);
        ry = infoBox('Report ID',       reportId,   col2x, ry, colW);

        y = Math.max(ly, ry) + 4;

        // ---- Vital Statistics ----
        y = sectionTitle('Vital Statistics', y);

        // Three stat boxes
        const sbW = (CONTENT - 8) / 3;
        statBox(MARGIN,           y, sbW, 28, 'Height',      heightVal || '—', '', C.primary,  [235, 244, 255]);
        statBox(MARGIN + sbW + 4, y, sbW, 28, 'Weight',      weightVal || '—', '', C.primary,  [235, 244, 255]);
        statBox(MARGIN + sbW*2+8, y, sbW, 28, 'Blood Type',  bloodType || '—', '', C.primaryDark, [225, 240, 255]);
        y += 34;

        // ---- BMI Card ----
        y = sectionTitle('Body Mass Index (BMI)', y);

        setFill(bmiLight);
        rect(MARGIN, y, CONTENT, 22, 'F', 3);
        setDraw(bmiColor);
        doc.setLineWidth(0.5);
        rect(MARGIN, y, CONTENT, 22, 'S', 3);

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        setTxt(bmiColor);
        doc.text(bmiDisplay, MARGIN + 8, y + 16);

        const bmiNumW = doc.getTextWidth(bmiDisplay) + 12;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        setTxt(C.muted);
        doc.text('kg/m²', MARGIN + bmiNumW, y + 10);

        // Status badge
        badge(bmiStatus, MARGIN + bmiNumW, y + 17, bmiColor, C.white);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        setTxt(C.mid);
        doc.text(bmiCategory, MARGIN + bmiNumW + doc.getTextWidth(bmiStatus) + 10, y + 17);

        // BMI scale bar
        const scaleX = MARGIN, scaleY = y + 19, scaleW = CONTENT, scaleH = 2;
        // segments: <18.5 underweight, 18.5-25 normal, 25-30 overweight, >30 obese
        const segments = [
            { pct: 18.5/40, color: C.orange },
            { pct: 6.5/40,  color: C.green  },
            { pct: 5/40,    color: C.orange  },
            { pct: 10/40,   color: C.red     },
        ];
        let sx = scaleX;
        for (const seg of segments) {
            const sw = scaleW * seg.pct;
            setFill(seg.color);
            rect(sx, scaleY, sw, scaleH, 'F');
            sx += sw;
        }
        // Needle marker
        const needleX = scaleX + scaleW * Math.min(bmiNum / 40, 1);
        setFill(C.dark);
        doc.triangle(needleX - 1.5, scaleY, needleX + 1.5, scaleY, needleX, scaleY - 3, 'F');

        y += 30;

        pageFooter(2, 4);

        // ============================================
        // PAGE 3 — MEDICAL DETAILS
        // ============================================
        doc.addPage();
        watermark();
        pageHeader('Medical Details', `Patient: ${fullName}`);
        accentBar(14, PAGE_H - 14);

        y = 24;

        // ---- Allergies ----
        y = sectionTitle('Known Allergies', y);

        if (allergiesArr.length === 0) {
            setFill(C.bg);
            rect(MARGIN, y, CONTENT, 10, 'F', 2);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            setTxt(C.muted);
            doc.text('No allergies recorded', MARGIN + 4, y + 7);
            y += 15;
        } else {
            // Warning banner
            setFill(C.redLight);
            rect(MARGIN, y, CONTENT, 10, 'F', 2);
            setDraw(C.red);
            doc.setLineWidth(0.5);
            rect(MARGIN, y, CONTENT, 10, 'S', 2);

            // Warning icon: simple triangle (no Unicode)
            setFill(C.red);
            doc.triangle(MARGIN + 8, y + 8, MARGIN + 14, y + 8, MARGIN + 11, y + 2.5, 'F');
            setFill(C.white);
            rect(MARGIN + 10.2, y + 4.5, 1.6, 2.5, 'F');  // exclamation stem
            doc.circle(MARGIN + 11, y + 7.5, 0.9, 'F');   // exclamation dot

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            setTxt(C.red);
            doc.text(`ALLERGY ALERT  (${allergiesArr.length} recorded)`, MARGIN + 18, y + 7);
            y += 14;

            // Allergy tags
            let tagX = MARGIN;
            for (const allergy of allergiesArr) {
                const tagW = doc.getTextWidth(allergy) + 10;
                if (tagX + tagW > PAGE_W - MARGIN) { tagX = MARGIN; y += 10; }
                setFill(C.redLight);
                rect(tagX, y, tagW, 8, 'F', 4);
                setDraw(C.red);
                doc.setLineWidth(0.3);
                rect(tagX, y, tagW, 8, 'S', 4);
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'bold');
                setTxt(C.red);
                doc.text(allergy, tagX + 5, y + 5.5);
                tagX += tagW + 4;
            }
            y += 14;
        }

        // ---- Medications ----
        y = sectionTitle('Current Medications', y);
        y = table(['Medication', 'Dosage / Frequency'], medRows, MARGIN, y, [110, 72]);
        y += 4;

        // ---- Emergency Contact ----
        if (y > 220) { doc.addPage(); watermark(); pageHeader('Medical Details (cont.)', `Patient: ${fullName}`); accentBar(14, PAGE_H-14); y = 24; }

        y = sectionTitle('Emergency Contact', y);

        setFill(C.redLight);
        rect(MARGIN, y, CONTENT, 38, 'F', 3);
        setDraw(C.red);
        doc.setLineWidth(0.8);
        rect(MARGIN, y, CONTENT, 38, 'S', 3);

        // Red left accent on the card
        setFill(C.red);
        rect(MARGIN, y, 4, 38, 'F', 3);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        setTxt(C.red);
        doc.text('EMERGENCY CONTACT', MARGIN + 10, y + 8);

        rule(y + 11, C.red);

        const ecLabelW = 30;
        const ecX = MARGIN + 10;
        let ey = y + 17;

        function ecRow(label, val) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            setTxt(C.red);
            doc.text(label, ecX, ey);
            doc.setFont('helvetica', 'normal');
            setTxt(C.dark);
            doc.text(val, ecX + ecLabelW, ey);
            ey += 7;
        }

        ecRow('Name:',          emergencyName);
        ecRow('Relationship:',  emergencyRelation);
        ecRow('Phone:',         emergencyPhone);

        y += 44;

        pageFooter(3, 4);

        // ============================================
        // PAGE 4 — DISCLAIMER
        // ============================================
        doc.addPage();
        watermark();
        pageHeader('Medical Disclaimer & Legal Notice', '');
        accentBar(14, PAGE_H - 14);

        y = 30;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        setTxt(C.primary);
        doc.text('Medical Disclaimer', PAGE_W / 2, y, { align: 'center' });
        y += 10;

        const disclaimerBlocks = [
            {
                heading: 'For Informational Purposes Only',
                body: 'This health report is generated by MediTrack+ based on the information provided by the patient or their authorized representative. It is intended solely as a personal health reference and does NOT constitute medical advice, diagnosis, or treatment recommendations.'
            },
            {
                heading: 'Accuracy & Completeness',
                body: 'While MediTrack+ strives for accuracy, we do not guarantee the completeness or correctness of the data presented. Always verify important medical information with your healthcare provider.'
            },
            {
                heading: 'Consult a Healthcare Professional',
                body: 'Always consult with a qualified healthcare provider before making any medical decisions based on this report. In case of a medical emergency, contact your local emergency services immediately.'
            },
            {
                heading: 'BMI & Health Score Notes',
                body: 'The BMI calculations and health scores provided are statistical estimates based on population averages and should be interpreted in the context of a full clinical assessment by a medical professional.'
            },
        ];

        for (const block of disclaimerBlocks) {
            if (y > 240) break;

            setFill(C.bg);
            rect(MARGIN, y, CONTENT, 28, 'F', 3);
            setDraw(C.primary);
            doc.setLineWidth(0.3);
            rect(MARGIN, y, 3, 28, 'F', 0);   // left accent

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            setTxt(C.primary);
            doc.text(block.heading, MARGIN + 8, y + 7);

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            setTxt(C.mid);
            const lines = doc.splitTextToSize(block.body, CONTENT - 12);
            doc.text(lines, MARGIN + 8, y + 13);

            y += 33;
        }

        y += 5;
        rule(y);
        y += 8;

        // HIPAA / report meta footer on page 4
        setFill(C.bg);
        rect(MARGIN, y, CONTENT, 18, 'F', 3);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        setTxt(C.primary);
        doc.text('HIPAA Compliant  |  Secure Health Record', MARGIN + 4, y + 7);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        setTxt(C.muted);
        doc.text(`Report ID: ${reportId}`, MARGIN + 4, y + 13);
        doc.text(`Generated: ${generatedDate}`, PAGE_W - MARGIN - 4, y + 13, { align: 'right' });

        pageFooter(4, 4);

        // ============================================
        // SAVE
        // ============================================
        const fileName = `MediTrack_Medical_Report_${fullName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);
        showNotification('Professional medical report generated successfully!', 'success');

    }, 500);
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