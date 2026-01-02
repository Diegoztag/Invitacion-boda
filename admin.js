// Import constants
import { 
    UI_CONFIG, 
    DEFAULT_VALUES, 
    PASS_DISTRIBUTION,
    AVATAR_GRADIENTS,
    GRADIENT_STYLES,
    INVITATION_STATUS,
    STATUS_LABELS,
    BADGE_CLASSES,
    PERCENTAGE_THRESHOLDS,
    INVITATION_TYPES,
    PASS_TYPE_LABELS,
    TIME_CONFIG,
    TIME_LABELS,
    API_ENDPOINTS,
    NOTIFICATION_MESSAGES,
    MODAL_CONFIG,
    BREAKPOINTS,
    CSV_CONFIG,
    ICONS,
    DEMO_INVITATIONS
} from './admin/js/admin-constants.js';

// Import utilities
import {
    calculateCancelledPasses,
    getInitials,
    formatGuestNames,
    getRandomGradient,
    getTimeAgo,
    getPassTypeText,
    getTableNumber,
    formatDate,
    formatPhone,
    calculatePercentageStats,
    debounce,
    parseSimpleCSV,
    updateStatsUI,
    updateInvitationPercentageBadge,
    updateTargetElements,
    updateConfirmedChangeIndicator,
    generateDemoStats,
    getStatusBadge,
    renderStatBadge,
    getBadgeType,
    renderTableRow,
    updateTablePagination,
    calculatePaginationInfo
} from './admin/js/admin-utils.js';

// Import modal system
import { Modal, ModalFactory, showToast } from './admin/js/components/admin-modal.js';

// Import API system
import { createAdminAPI, APIHelpers } from './admin/js/admin-api.js';

// Import notification service
import { notificationService } from './admin/js/services/notification-service.js';

// Load configuration from config.js
const CONFIG = {
    backendUrl: WEDDING_CONFIG.api.backendUrl
};

// Initialize API
const adminAPI = createAdminAPI(CONFIG.backendUrl);

// Global variables
let allInvitations = [];
let confirmationChart = null;

// Modal instances
let invitationDetailModal = null;
let createInvitationModal = null;
let importCsvModal = null;

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals
    invitationDetailModal = ModalFactory.createInvitationDetailModal();
    createInvitationModal = ModalFactory.createInvitationFormModal();
    importCsvModal = ModalFactory.createImportCSVModal();
    
    // Set active modal reference for form buttons
    window.activeModal = null;
    
    // Notification sound removed - now handled by notification-service.js
    
    // Update wedding title
    document.getElementById('weddingTitle').textContent = `Boda ${WEDDING_CONFIG.couple.displayName}`;
    
    // Handle responsive label updates
    function updateResponsiveLabels() {
        const staffLabel = document.querySelector('.progress-item:nth-child(3) .progress-label');
        if (staffLabel) {
            if (window.innerWidth <= 768) {
                staffLabel.textContent = 'Staff';
            } else {
                staffLabel.textContent = 'Staff/Proveedores';
            }
        }
    }
    
    // Update labels on resize
    window.addEventListener('resize', updateResponsiveLabels);
    
    // Initial update
    updateResponsiveLabels();
    
    // Update mobile header couple name
    const mobileCoupleName = document.querySelector('.mobile-couple-name');
    if (mobileCoupleName) {
        mobileCoupleName.textContent = WEDDING_CONFIG.couple.displayName;
    }
    
    // Update welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        const names = WEDDING_CONFIG.couple.displayName.split(' & ');
        welcomeMessage.textContent = `Bienvenida, ${names[0]}`;
    }
    
    initNavigation();
    initMobileMenu();
    initCountdownTimer();
    loadDashboardData();
    loadInvitations();
    initCreateForm();
    initSearch();
    initCsvUpload();
    
    // Initialize period selector
    const periodSelector = document.getElementById('confirmationPeriod');
    if (periodSelector) {
        // Load saved preference
        const savedPeriod = localStorage.getItem('confirmationPeriod') || 'today';
        periodSelector.value = savedPeriod;
        
        // Add change event listener
        periodSelector.addEventListener('change', async (e) => {
            const selectedPeriod = e.target.value;
            
            // Save preference
            localStorage.setItem('confirmationPeriod', selectedPeriod);
            
            // Calculate confirmations for new period
            const periodConfirmations = await calculateConfirmationsByPeriod(selectedPeriod);
            
            // Update welcome text
            updateWelcomeText(selectedPeriod, periodConfirmations);
        });
    }
    
    // Handle "Ver todos los invitados" link - use event delegation
    document.addEventListener('click', (e) => {
        // Check if the clicked element is the "Ver todos los invitados" link
        if (e.target && e.target.matches('a[href="#invitations"]')) {
            e.preventDefault();
            // Navigate to "Invitados" section (create section)
            const invitadosNavItem = document.querySelector('.nav-item[href="#create"]');
            if (invitadosNavItem) {
                invitadosNavItem.click();
            }
        }
    });
});

// Initialize Mobile Menu
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // Toggle mobile menu
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
    });
    
    // Close menu when clicking overlay
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('body-no-scroll');
    });
    
    // Close menu when clicking a nav item on mobile
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.classList.remove('body-no-scroll');
            }
        });
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.classList.remove('body-no-scroll');
            }
        }, 250);
    });
}

// Initialize Countdown Timer
function initCountdownTimer() {
    function updateTimer() {
        const now = new Date().getTime();
        const distance = WEDDING_CONFIG.event.date.getTime() - now;

        if (distance < 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            // Load data for specific sections
            if (targetId === 'dashboard') {
                loadDashboardData();
            } else if (targetId === 'invitations') {
                loadInvitations();
            } else if (targetId === 'create') {
                loadCreateSectionData();
            }
        });
    });
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const result = await adminAPI.fetchStats();
        if (APIHelpers.isSuccess(result)) {
            const stats = result.stats;
            
            // Update stats cards using utility function
            updateStatsUI(stats);
            
            // Update invitation percentage badge
            const targetInvitations = WEDDING_CONFIG.guests?.targetInvitations || 150;
            updateInvitationPercentageBadge(stats.totalInvitations, targetInvitations);
            
            // Update target elements
            updateTargetElements({
                targetInvitations: targetInvitations,
                targetTotal: WEDDING_CONFIG.guests?.targetTotal || 250
            });
            
            // Update confirmed change indicator
            const recentConfirmations = await calculateRecentConfirmations();
            updateConfirmedChangeIndicator(recentConfirmations);
            
            // Get selected period from dropdown
            const periodSelector = document.getElementById('confirmationPeriod');
            const selectedPeriod = periodSelector ? periodSelector.value : 'today';
            
            // Calculate confirmations for selected period
            const periodConfirmations = await calculateConfirmationsByPeriod(selectedPeriod);
            
            // Update welcome subtext based on period
            updateWelcomeText(selectedPeriod, periodConfirmations);
            
            // Update pass distribution
            updatePassDistribution(stats);
            
            // Update chart
            updateConfirmationChart(stats);
            
            // Load recent confirmations
            loadRecentConfirmations();
        } else {
            throw new Error(APIHelpers.getErrorMessage(result));
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast(APIHelpers.getErrorMessage({ error: error.message }), 'error');
        // Show demo data
        const demoStats = generateDemoStats();
        
        // Update stats using utility functions
        updateStatsUI(demoStats);
        
        // Update invitation percentage badge
        const targetInvitations = WEDDING_CONFIG.guests?.targetInvitations || 150;
        updateInvitationPercentageBadge(demoStats.totalInvitations, targetInvitations);
        
        // Update target elements
        updateTargetElements({
            targetInvitations: targetInvitations,
            targetTotal: WEDDING_CONFIG.guests?.targetTotal || 250
        });
        
        // Update pass distribution with demo data
        updatePassDistribution(demoStats);
        
        // Update chart with demo data
        updateConfirmationChart(demoStats);
        
        // Load recent confirmations
        loadRecentConfirmations();
    }
}

// Update Pass Distribution
function updatePassDistribution(stats) {
    const totalPasses = stats.totalPasses || 0;
    const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false; // Default to true if not specified
    
    // Use real data from stats if available, otherwise use estimated distribution
    let adultPasses, childPasses, staffPasses;
    let adultPercent, childPercent, staffPercent;
    
    // Check if we have detailed pass breakdown in stats
    if (stats.adultPasses !== undefined && stats.childPasses !== undefined && stats.staffPasses !== undefined) {
        // Use actual data from backend
        adultPasses = stats.adultPasses;
        childPasses = allowChildren ? stats.childPasses : 0;
        staffPasses = stats.staffPasses;
    } else {
        // Fallback to estimated distribution if detailed data not available
        if (allowChildren) {
            // Normal distribution with children
            adultPasses = Math.floor(totalPasses * 0.8); // 80% adults
            childPasses = Math.floor(totalPasses * 0.15); // 15% children
            staffPasses = totalPasses - adultPasses - childPasses; // 5% staff
        } else {
            // No children allowed - redistribute percentages
            adultPasses = Math.floor(totalPasses * 0.95); // 95% adults
            childPasses = 0; // 0% children
            staffPasses = totalPasses - adultPasses; // 5% staff
        }
    }
    
    // Calculate percentages (handle division by zero)
    if (totalPasses > 0) {
        adultPercent = Math.round((adultPasses / totalPasses) * 100);
        childPercent = allowChildren ? Math.round((childPasses / totalPasses) * 100) : 0;
        staffPercent = Math.round((staffPasses / totalPasses) * 100);
    } else {
        adultPercent = 0;
        childPercent = 0;
        staffPercent = 0;
    }
    
    // Update total passes
    document.getElementById('totalPassesChart').textContent = totalPasses;
    
    // Update adult passes
    document.getElementById('adultPasses').textContent = `${adultPasses} (${adultPercent}%)`;
    document.getElementById('adultProgress').className = `progress-fill primary progress-fill-${Math.round(adultPercent / 10) * 10}`;
    
    // Update child passes
    const childPassesElement = document.getElementById('childPasses');
    const childProgressElement = document.getElementById('childProgress');
    const childProgressItem = childPassesElement.closest('.progress-item');
    
    if (!allowChildren) {
        // Disable children section
        childPassesElement.textContent = 'No permitidos';
        childProgressElement.className = 'progress-fill warning progress-fill-0';
        childProgressItem.classList.add('disabled-section');
        childProgressItem.querySelector('.progress-label').textContent = 'Niños (No permitidos)';
    } else {
        // Enable children section
        childPassesElement.textContent = `${childPasses} (${childPercent}%)`;
        childProgressElement.className = `progress-fill warning progress-fill-${Math.round(childPercent / 10) * 10}`;
        childProgressItem.classList.remove('disabled-section');
        childProgressItem.querySelector('.progress-label').textContent = 'Niños';
    }
    
    // Update staff passes
    document.getElementById('staffPasses').textContent = `${staffPasses} (${staffPercent}%)`;
    document.getElementById('staffProgress').className = `progress-fill muted progress-fill-${Math.round(staffPercent / 10) * 10}`;
    
    // Update label text based on screen size
    const staffLabel = document.querySelector('.progress-item:nth-child(3) .progress-label');
    if (staffLabel) {
        if (window.innerWidth <= 768) {
            staffLabel.textContent = 'Staff';
        } else {
            staffLabel.textContent = 'Staff/Proveedores';
        }
    }
}

// Load Recent Confirmations
async function loadRecentConfirmations() {
    try {
        const result = await adminAPI.fetchRecentConfirmations(7, 5);
        if (APIHelpers.isSuccess(result)) {
            displayRecentConfirmations(result.confirmations);
        } else {
            throw new Error(APIHelpers.getErrorMessage(result));
        }
    } catch (error) {
        console.error('Error loading recent confirmations:', error);
        // Show demo data
        displayRecentConfirmations([]);
    }
}

// Display Recent Confirmations
function displayRecentConfirmations(confirmations) {
    const tbody = document.getElementById('recentConfirmations');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (confirmations.length === 0) {
        // Show demo data if no confirmations
        const demoData = [
            {
                code: 'demo1',
                guestNames: ['Carlos Méndez'],
                confirmationDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
                confirmedPasses: 2,
                confirmationDetails: {
                    willAttend: true,
                    message: '¡Felicidades! Ahí estaremos sin falta.'
                }
            },
            {
                code: 'demo2',
                guestNames: ['Lucía Ramos'],
                confirmationDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
                confirmedPasses: 1,
                confirmationDetails: {
                    willAttend: true
                }
            }
        ];
        confirmations = demoData;
    }
    
    confirmations.forEach((invitation, index) => {
        const row = document.createElement('tr');
        row.innerHTML = renderTableRow(invitation, 'recent', index);
        tbody.appendChild(row);
    });
}

// Calculate recent confirmations (last 7 days)
async function calculateRecentConfirmations() {
    try {
        const result = await adminAPI.calculateRecentConfirmedPasses(7);
        if (APIHelpers.isSuccess(result)) {
            return result.totalPasses;
        }
    } catch (error) {
        console.error('Error calculating recent confirmations:', error);
    }
    return 0;
}

// Calculate confirmations for a specific period
async function calculateConfirmationsByPeriod(period = 'today') {
    try {
        // Fetch all invitations
        const result = await adminAPI.fetchInvitations();
        if (APIHelpers.isSuccess(result)) {
            const invitations = result.invitations || [];
            
            // Get the date range based on period
            const now = new Date();
            let startDate = new Date();
            
            switch(period) {
                case 'today':
                    // Today at midnight
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'last24hours':
                    // 24 hours ago from now
                    startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                    break;
                case 'lastWeek':
                    // 7 days ago at midnight
                    startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    startDate.setHours(0, 0, 0, 0);
                    break;
                default:
                    startDate.setHours(0, 0, 0, 0);
            }
            
            // Count confirmations in the period
            let count = 0;
            invitations.forEach(invitation => {
                if (invitation.confirmed && invitation.confirmationDate) {
                    const confirmDate = new Date(invitation.confirmationDate);
                    
                    if (confirmDate >= startDate && confirmDate <= now) {
                        count++;
                    }
                }
            });
            
            return count;
        }
    } catch (error) {
        console.error('Error calculating confirmations by period:', error);
    }
    return 0;
}

// Calculate today's confirmations (backward compatibility)
async function calculateTodayConfirmations() {
    return calculateConfirmationsByPeriod('today');
}

// Update welcome text based on period and confirmations
function updateWelcomeText(period, confirmations) {
    const welcomeSubtext = document.getElementById('welcomeSubtext');
    if (!welcomeSubtext) return;
    
    let periodText = '';
    switch(period) {
        case 'today':
            periodText = 'hoy';
            break;
        case 'last24hours':
            periodText = 'en las últimas 24 horas';
            break;
        case 'lastWeek':
            periodText = 'en la última semana';
            break;
        default:
            periodText = 'hoy';
    }
    
    if (confirmations > 0) {
        welcomeSubtext.textContent = `Aquí tienes el resumen de tu boda. Recibiste ${confirmations} confirmación${confirmations === 1 ? '' : 'es'} nueva${confirmations === 1 ? '' : 's'} ${periodText}.`;
    } else {
        welcomeSubtext.textContent = `Aquí tienes el resumen de tu boda. No has recibido confirmaciones nuevas ${periodText}.`;
    }
}

// Update Confirmation Chart
function updateConfirmationChart(stats) {
    const ctx = document.getElementById('confirmationChart').getContext('2d');
    
    if (confirmationChart) {
        confirmationChart.destroy();
    }
    
    confirmationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Confirmados', 'Pendientes', 'Cancelados'],
            datasets: [{
                data: [stats.confirmedPasses, stats.pendingPasses, stats.cancelledPasses || 0],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                borderColor: '#2d1b27',
                hoverBorderColor: '#e619a1',
                hoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 15,
                        font: {
                            size: 12,
                            weight: 500
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#2d1b27',
                    titleColor: '#ffffff',
                    bodyColor: '#94a3b8',
                    borderColor: '#e619a1',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Load Invitations
async function loadInvitations() {
    try {
        const result = await adminAPI.fetchInvitations();
        if (APIHelpers.isSuccess(result)) {
            allInvitations = result.invitations || [];
            displayInvitations(allInvitations);
        } else {
            throw new Error(APIHelpers.getErrorMessage(result));
        }
    } catch (error) {
        console.error('Error loading invitations:', error);
        showToast('Error al cargar invitaciones', 'error');
        // For demo purposes, show sample data
        allInvitations = [
            {
                code: 'abc123',
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                confirmed: false,
                confirmedPasses: 0
            }
        ];
        displayInvitations(allInvitations);
    }
}

// Display Invitations
function displayInvitations(invitations) {
    const tbody = document.getElementById('invitationsTableBody');
    tbody.innerHTML = '';
    
    invitations.forEach(invitation => {
        const row = document.createElement('tr');
        row.innerHTML = renderTableRow(invitation, 'invitations');
        tbody.appendChild(row);
    });
}

// View Invitation Details
function viewInvitation(code) {
    const invitation = allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    const invitationUrl = `${window.location.origin}/invitacion?invitation=${code}`;
    
    // Get status badge with icon for modal
    const statusBadgeInfo = getStatusBadge(invitation, { showIcon: true });
    
    // Use utility function to calculate cancelled passes
    const cancelledPasses = calculateCancelledPasses(invitation);
    
    const detailsContent = `
        <div class="invitation-detail">
            <!-- Status Header -->
            <div class="status-header">
                ${statusBadgeInfo.html}
            </div>
            
            <!-- Guest Info Section -->
            <div class="guest-section">
                <h4>${invitation.guestNames.join(' y ')}</h4>
                <div class="info-row">
                    <span><strong>Código:</strong> ${invitation.code}</span>
                    <span><strong>Pases:</strong> ${invitation.numberOfPasses}</span>
                    ${invitation.phone || invitation.confirmationDetails?.phone ? `
                        <span><strong>Tel:</strong> ${invitation.phone || invitation.confirmationDetails?.phone}</span>
                    ` : ''}
                </div>
            </div>
            
            ${invitation.confirmed ? `
                <!-- Confirmation Details -->
                <div>
                    ${invitation.confirmationDetails?.willAttend ? `
                        <div class="stats-grid-mini">
                            <div class="stat-mini">
                                <div class="stat-mini-value stat-value-success">${invitation.confirmedPasses}</div>
                                <div class="stat-mini-label">Confirmados</div>
                            </div>
                            ${cancelledPasses > 0 ? `
                                <div class="stat-mini">
                                    <div class="stat-mini-value stat-value-danger">${cancelledPasses}</div>
                                    <div class="stat-mini-label">Cancelados</div>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${invitation.confirmationDetails?.attendingNames?.length > 0 ? `
                            <div class="attendees-list">
                                <strong>Asistentes:</strong> ${invitation.confirmationDetails.attendingNames.join(', ')}
                            </div>
                        ` : ''}
                        
                        ${invitation.confirmationDetails?.dietaryRestrictions ? `
                            <div class="dietary-note">
                                <i class="fas fa-utensils"></i>
                                ${invitation.confirmationDetails.dietaryRestrictions}
                            </div>
                        ` : ''}
                    ` : `
                        <div class="declined-message">
                            <p>Invitación declinada</p>
                        </div>
                    `}
                    
                    ${invitation.confirmationDetails?.message ? `
                        <div class="message-box">
                            <p>"${invitation.confirmationDetails.message}"</p>
                        </div>
                    ` : ''}
                    
                    <p class="timestamp">
                        ${new Date(invitation.confirmationDate).toLocaleDateString('es-MX', { 
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            ` : ''}
            
            <!-- Link Section -->
            <div class="link-section">
                <div class="link-input-group">
                    <input type="text" value="${invitationUrl}" readonly>
                    <button class="btn btn-primary" onclick="copyToClipboard('${invitationUrl}')">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    invitationDetailModal.setContent(detailsContent);
    invitationDetailModal.open();
}

// Copy Invitation Link
function copyInvitationLink(code) {
    const invitationUrl = `${window.location.origin}/invitacion?invitation=${code}`;
    copyToClipboard(invitationUrl);
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Enlace copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

// Initialize Create Form
function initCreateForm() {
    const form = document.getElementById('createInvitationForm');
    
    // Handle invitation type changes
    const invitationTypeRadios = document.querySelectorAll('input[name="invitationType"]');
    const adultPassesInput = document.getElementById('adultPassesInput');
    const childPassesInput = document.getElementById('childPassesInput');
    const childPassesGroup = document.getElementById('childPassesGroup');
    const totalPassesValue = document.getElementById('totalPassesValue');
    
    // Check if children are allowed
    const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false;
    
    // If children are not allowed, show informative message
    if (!allowChildren) {
        // Add informative message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'children-not-allowed-message';
        messageDiv.innerHTML = '<i class="fas fa-heart icon-primary"></i> <strong>Celebración íntima:</strong> Hemos decidido que nuestra boda sea una celebración entre adultos para poder compartir este momento especial de una manera más íntima con ustedes.';
        form.insertBefore(messageDiv, form.querySelector('.form-group'));
    }
    
    // Update total passes display
    function updateTotalPasses() {
        const adultPasses = parseInt(adultPassesInput.value) || 0;
        const childPasses = parseInt(childPassesInput.value) || 0;
        const total = adultPasses + childPasses;
        totalPassesValue.textContent = total;
    }
    
    // Handle invitation type changes
    invitationTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const type = e.target.value;
            
            if (type === 'family') {
                // Show child passes input
                childPassesGroup.classList.remove('hidden');
                
                if (!allowChildren) {
                    // If children not allowed, disable the input
                    childPassesInput.value = '0';
                    childPassesInput.disabled = true;
                    childPassesInput.classList.add('disabled-input');
                    childPassesGroup.querySelector('label').innerHTML = 'Niños <small class="children-not-allowed-label">(no permitidos)</small>';
                } else {
                    // Enable if children are allowed
                    childPassesInput.disabled = false;
                    childPassesInput.classList.remove('disabled-input');
                    childPassesGroup.querySelector('label').textContent = 'Niños';
                }
            } else {
                // Hide child passes input
                childPassesGroup.classList.add('hidden');
                childPassesInput.value = '0';
            }
            
            // Set default values based on type
            if (type === 'adults') {
                adultPassesInput.value = '2';
            } else if (type === 'family') {
                adultPassesInput.value = '2';
                childPassesInput.value = '0';
            } else if (type === 'staff') {
                adultPassesInput.value = '1';
            }
            
            updateTotalPasses();
        });
    });
    
    // Update total when inputs change
    adultPassesInput.addEventListener('input', updateTotalPasses);
    childPassesInput.addEventListener('input', updateTotalPasses);
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const guestNamesInput = formData.get('guestNames');
        const invitationType = formData.get('invitationType');
        
        // Parse guest names
        const guestNames = guestNamesInput
            .split(/[,y]/)
            .map(name => name.trim())
            .filter(name => name);
        
        // Get pass counts
        const adultPasses = parseInt(formData.get('adultPasses')) || 0;
        const childPasses = parseInt(formData.get('childPasses')) || 0;
        const totalPasses = adultPasses + childPasses;
        
        const invitationData = {
            guestNames: guestNames,
            numberOfPasses: totalPasses,
            phone: formData.get('phone'),
            // Add new fields for pass breakdown
            adultPasses: adultPasses,
            childPasses: childPasses,
            invitationType: invitationType
        };
        
        try {
            const result = await adminAPI.createInvitation(invitationData);
            
            if (APIHelpers.isSuccess(result)) {
                showToast('Invitación creada exitosamente', 'success');
                form.reset();
                // Reset to default values
                adultPassesInput.value = '2';
                childPassesInput.value = '0';
                childPassesGroup.classList.add('hidden');
                updateTotalPasses();
                
                // Show invitation details
                const invitationUrl = result.invitationUrl;
                showToast(`Código: ${result.invitation.code}`, 'success');
                
                // Close modal and reload invitations
                closeCreateModal();
                loadInvitations();
                loadDashboardData();
            } else {
                throw new Error(APIHelpers.getErrorMessage(result));
            }
        } catch (error) {
            console.error('Error:', error);
            showToast(error.message || 'Error al crear la invitación', 'error');
        }
    });
}


// Export all invitations to CSV
function exportAllInvitations() {
    adminAPI.exportToCSV(allInvitations, 'invitaciones_completas');
    showToast('Archivo CSV exportado exitosamente', 'success');
}


// Initialize Search
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            const filteredInvitations = allInvitations.filter(invitation => {
                return invitation.code.toLowerCase().includes(searchTerm) ||
                       invitation.guestNames.some(name => name.toLowerCase().includes(searchTerm)) ||
                       (invitation.phone && invitation.phone.includes(searchTerm));
            });
            
            displayInvitations(filteredInvitations);
        });
    }
}

// Show Create Form
function showCreateForm() {
    document.querySelector('a[href="#create"]').click();
}

// Modal Functions
function showCreateModal() {
    window.activeModal = createInvitationModal;
    createInvitationModal.open();
}

function closeCreateModal() {
    createInvitationModal.close();
    // Reset form
    document.getElementById('createInvitationForm').reset();
    document.getElementById('adultPassesInput').value = '2';
    document.getElementById('childPassesInput').value = '0';
    document.getElementById('childPassesGroup').classList.add('hidden');
    document.getElementById('totalPassesValue').textContent = '2';
}

function showImportModal() {
    window.activeModal = importCsvModal;
    importCsvModal.open();
}

function closeImportModal() {
    importCsvModal.close();
}

// Show Notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize CSV Upload
function initCsvUpload() {
    const csvFile = document.getElementById('csvFile');
    const fileName = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadCsvBtn');
    const csvResults = document.getElementById('csvResults');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    let selectedFile = null;
    
    // Handle file selection
    function handleFileSelect(file) {
        if (file && file.type === 'text/csv') {
            selectedFile = file;
            fileName.textContent = file.name;
            fileUploadArea.classList.add('has-file');
            uploadBtn.classList.add('show');
            csvResults.innerHTML = '';
            csvResults.classList.remove('show', 'success', 'error');
        } else if (file) {
            showToast('Por favor selecciona un archivo CSV válido', 'error');
        }
    }
    
    // File input change event
    csvFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    });
    
    // Drag and drop functionality
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('drag-over');
    });
    
    fileUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    });
    
    // Click on upload area to select file
    fileUploadArea.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
            csvFile.click();
        }
    });
    
    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
            csvResults.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Procesando archivo...</p>';
            csvResults.classList.add('show');
        
        try {
            const text = await selectedFile.text();
            const invitations = parseCSV(text);
            
            if (invitations.length === 0) {
                csvResults.innerHTML = '<p class="error">No se encontraron invitaciones válidas en el archivo</p>';
                return;
            }
            
            csvResults.innerHTML = `<p>Creando ${invitations.length} invitaciones...</p>`;
            
            let created = 0;
            let errors = [];
            const createdInvitations = [];
            
            // Use API to import invitations
            const importResult = await adminAPI.importInvitations(invitations);
            
            created = importResult.created;
            errors = importResult.errors.map(err => `${err.guestNames}: ${err.error}`);
            createdInvitations = importResult.createdInvitations;
            
            // Show results
            let resultsHTML = '';
            
            if (created > 0) {
                csvResults.classList.add('success');
                csvResults.classList.remove('error');
                resultsHTML += `<h5><i class="fas fa-check-circle result-icon"></i> Carga completada</h5>`;
                resultsHTML += `<div class="result-details">`;
                resultsHTML += `<p>${created} invitaciones creadas exitosamente</p>`;
            } else {
                csvResults.classList.add('error');
                csvResults.classList.remove('success');
                resultsHTML += `<h5><i class="fas fa-exclamation-circle result-icon"></i> Error en la carga</h5>`;
                resultsHTML += `<div class="result-details">`;
            }
            
            if (errors.length > 0) {
                resultsHTML += `<p>${errors.length} errores encontrados:</p>`;
                resultsHTML += '<ul class="result-list">';
                errors.forEach(error => {
                    resultsHTML += `<li>${error}</li>`;
                });
                resultsHTML += '</ul>';
            }
            
            resultsHTML += '</div>';
            
            if (createdInvitations.length > 0) {
                resultsHTML += '<h4>Enlaces generados:</h4>';
                resultsHTML += '<div class="csv-links">';
                createdInvitations.forEach(inv => {
                    resultsHTML += `
                        <div class="csv-link-item">
                            <strong>${inv.guestNames.join(' y ')}</strong><br>
                            <input type="text" value="${inv.url}" readonly class="csv-link-input">
                            <button class="btn btn-sm" onclick="copyToClipboard('${inv.url}')">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    `;
                });
                resultsHTML += '</div>';
                
                // Add export button
                resultsHTML += `
                    <button class="btn btn-secondary csv-export-button" onclick="exportInvitationLinks()">
                        <i class="fas fa-download"></i> Descargar todos los enlaces
                    </button>
                `;
                
                // Store for export
                window.createdInvitations = createdInvitations;
            }
            
            csvResults.innerHTML = resultsHTML;
            
            // Reset form after delay
            setTimeout(() => {
                csvFile.value = '';
                fileName.textContent = '';
                fileUploadArea.classList.remove('has-file');
                uploadBtn.classList.remove('show');
                selectedFile = null;
            }, 1000);
            
            // Reload invitations list
            loadInvitations();
            loadDashboardData();
            
        } catch (error) {
            csvResults.classList.add('show', 'error');
            csvResults.innerHTML = `
                <h5><i class="fas fa-exclamation-triangle result-icon"></i> Error al procesar</h5>
                <div class="result-details">
                    <p>${error.message}</p>
                </div>
            `;
        }
    });
}

// Parse CSV content
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const invitations = [];
    
    // Get headers to identify column positions
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const columnIndex = {
        nombres: headers.indexOf('nombres'),
        pases: headers.indexOf('pases'),
        mesa: headers.indexOf('mesa'),
        telefono: headers.indexOf('telefono'),
        email: headers.indexOf('email'),
        tipo: headers.indexOf('tipo')
    };
    
    // Validate required columns
    if (columnIndex.nombres === -1 || columnIndex.pases === -1) {
        throw new Error('El archivo CSV debe contener las columnas "Nombres" y "Pases"');
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handles quoted values)
        const parts = parseCSVLine(line);
        
        if (parts.length > columnIndex.nombres && parts.length > columnIndex.pases) {
            const names = parts[columnIndex.nombres].split(/\s+y\s+/i).map(n => n.trim()).filter(n => n);
            const passes = parseInt(parts[columnIndex.pases]);
            
            if (names.length > 0 && !isNaN(passes) && passes > 0) {
                const invitation = {
                    guestNames: names,
                    numberOfPasses: passes
                };
                
                // Add optional fields if present
                if (columnIndex.mesa !== -1 && parts[columnIndex.mesa]) {
                    const mesa = parseInt(parts[columnIndex.mesa]);
                    if (!isNaN(mesa)) {
                        invitation.tableNumber = mesa;
                    }
                }
                
                if (columnIndex.telefono !== -1 && parts[columnIndex.telefono]) {
                    invitation.phone = parts[columnIndex.telefono];
                }
                
                if (columnIndex.email !== -1 && parts[columnIndex.email]) {
                    invitation.email = parts[columnIndex.email];
                }
                
                if (columnIndex.tipo !== -1 && parts[columnIndex.tipo]) {
                    const tipo = parts[columnIndex.tipo].toLowerCase();
                    if (['adults', 'family', 'staff'].includes(tipo)) {
                        invitation.invitationType = tipo;
                        
                        // Set default pass distribution based on type
                        if (tipo === 'family') {
                            // For families, assume 2 adults and rest are children
                            invitation.adultPasses = Math.min(2, passes);
                            invitation.childPasses = Math.max(0, passes - 2);
                        } else {
                            // For adults and staff, all passes are adult passes
                            invitation.adultPasses = passes;
                            invitation.childPasses = 0;
                        }
                    }
                }
                
                // If no type specified, default to adults
                if (!invitation.invitationType) {
                    invitation.invitationType = 'adults';
                    invitation.adultPasses = passes;
                    invitation.childPasses = 0;
                }
                
                invitations.push(invitation);
            }
        }
    }
    
    return invitations;
}

// Helper function to parse CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Don't forget the last value
    result.push(current.trim());
    
    return result;
}

// Export invitation links
function exportInvitationLinks() {
    if (!window.createdInvitations || window.createdInvitations.length === 0) return;
    
    let content = 'Nombres,Código,Enlace\n';
    window.createdInvitations.forEach(inv => {
        content += `"${inv.guestNames.join(' y ')}",${inv.code},${inv.url}\n`;
    });
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invitaciones_enlaces_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Load Create Section Data
async function loadCreateSectionData() {
    try {
        const result = await adminAPI.fetchStats();
        if (APIHelpers.isSuccess(result)) {
            const stats = result.stats;
            
            // Update stats cards in create section using utility function
            updateStatsUI(stats, 'Create');
        } else {
            throw new Error(APIHelpers.getErrorMessage(result));
        }
    } catch (error) {
        console.error('Error loading create section data:', error);
        // Show demo data
        const demoStats = generateDemoStats();
        updateStatsUI(demoStats, 'Create');
    }
    
    // Load invitations for the modern table
    loadCreateSectionInvitations();
    
    // Initialize search for create section
    initCreateSectionSearch();
}

// Load invitations for create section
async function loadCreateSectionInvitations() {
    try {
        const result = await adminAPI.fetchInvitations();
        if (APIHelpers.isSuccess(result)) {
            allInvitations = result.invitations || [];
            displayCreateSectionInvitations(allInvitations);
        } else {
            throw new Error(APIHelpers.getErrorMessage(result));
        }
    } catch (error) {
        console.error('Error loading invitations:', error);
        // Show demo data
        const demoInvitations = [
            {
                code: 'abc123',
                guestNames: ['Familia Pérez'],
                email: 'familia.perez@email.com',
                numberOfPasses: 4,
                confirmed: true,
                confirmedPasses: 4,
                invitationType: 'family'
            },
            {
                code: 'def456',
                guestNames: ['Juan García'],
                email: 'juan.g@email.com',
                numberOfPasses: 1,
                confirmed: false,
                confirmedPasses: 0,
                invitationType: 'adults'
            },
            {
                code: 'ghi789',
                guestNames: ['María Rodriguez'],
                email: 'mrodriguez@email.com',
                numberOfPasses: 2,
                confirmed: true,
                confirmedPasses: 2,
                invitationType: 'adults'
            },
            {
                code: 'jkl012',
                guestNames: ['Tíos López'],
                email: 'lopez.fam@email.com',
                numberOfPasses: 0,
                confirmed: true,
                confirmedPasses: 0,
                confirmationDetails: { willAttend: false }
            },
            {
                code: 'mno345',
                guestNames: ['Carlos Mendez'],
                email: 'cmendez@work.com',
                numberOfPasses: 1,
                confirmed: false,
                confirmedPasses: 0,
                invitationType: 'staff'
            }
        ];
        allInvitations = demoInvitations;
        displayCreateSectionInvitations(demoInvitations);
    }
}

// Display invitations in create section modern table
function displayCreateSectionInvitations(invitations, page = 1, itemsPerPage = 5) {
    const tbody = document.getElementById('invitationsTableBodyCreate');
    tbody.innerHTML = '';
    
    // Calculate pagination info
    const paginationInfo = calculatePaginationInfo(invitations.length, page, itemsPerPage);
    const paginatedInvitations = invitations.slice(paginationInfo.startIndex, paginationInfo.endIndex);
    
    // Update pagination info display
    document.getElementById('showingFromCreate').textContent = paginationInfo.showingFrom;
    document.getElementById('showingToCreate').textContent = paginationInfo.showingTo;
    document.getElementById('totalCountCreate').textContent = paginationInfo.totalCount;
    
    // Render table rows
    paginatedInvitations.forEach((invitation, index) => {
        const row = document.createElement('tr');
        row.innerHTML = renderTableRow(invitation, 'create', paginationInfo.startIndex + index);
        tbody.appendChild(row);
    });
    
    // Update pagination controls
    updateTablePagination({
        currentPage: page,
        totalPages: paginationInfo.totalPages,
        prevBtnId: 'prevPageCreate',
        nextBtnId: 'nextPageCreate',
        numbersContainerId: 'paginationNumbersCreate',
        onPageChange: (newPage) => displayCreateSectionInvitations(invitations, newPage, itemsPerPage)
    });
}


// Initialize search for create section
function initCreateSectionSearch() {
    const searchInput = document.getElementById('searchInputCreate');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            const filteredInvitations = allInvitations.filter(invitation => {
                return invitation.code.toLowerCase().includes(searchTerm) ||
                       invitation.guestNames.some(name => name.toLowerCase().includes(searchTerm)) ||
                       (invitation.email && invitation.email.toLowerCase().includes(searchTerm)) ||
                       (invitation.phone && invitation.phone.includes(searchTerm));
            });
            
            displayCreateSectionInvitations(filteredInvitations);
        });
    }
}


// Toggle filters function
function toggleFilters() {
    // Create filter dropdown if it doesn't exist
    let filterDropdown = document.getElementById('filterDropdown');
    
    if (!filterDropdown) {
        // Create filter dropdown
        filterDropdown = document.createElement('div');
        filterDropdown.id = 'filterDropdown';
        filterDropdown.className = 'filter-dropdown';
        filterDropdown.innerHTML = `
            <div class="filter-dropdown-content">
                <h4>Filtrar por estado</h4>
                <label class="filter-option">
                    <input type="checkbox" id="filterConfirmed" checked> 
                    <span>Confirmados</span>
                </label>
                <label class="filter-option">
                    <input type="checkbox" id="filterPending" checked> 
                    <span>Pendientes</span>
                </label>
                <label class="filter-option">
                    <input type="checkbox" id="filterRejected" checked> 
                    <span>Rechazados</span>
                </label>
                <hr class="filter-divider">
                <h4>Filtrar por tipo</h4>
                <label class="filter-option">
                    <input type="checkbox" id="filterAdults" checked> 
                    <span>Adultos/Parejas</span>
                </label>
                <label class="filter-option">
                    <input type="checkbox" id="filterFamily" checked> 
                    <span>Familias</span>
                </label>
                <label class="filter-option">
                    <input type="checkbox" id="filterStaff" checked> 
                    <span>Staff/Proveedores</span>
                </label>
                <div class="filter-actions">
                    <button class="btn btn-sm btn-secondary" onclick="resetFilters()">Restablecer</button>
                    <button class="btn btn-sm btn-primary" onclick="applyFilters()">Aplicar</button>
                </div>
            </div>
        `;
        
        // Position it relative to the filter button
        const filterBtn = document.querySelector('.btn-icon[title="Filtros"]');
        const actionsBar = filterBtn.closest('.actions-bar');
        actionsBar.classList.add('position-relative');
        actionsBar.appendChild(filterDropdown);
        
        // Add styles for the dropdown
        const dropdownStyles = `
            .filter-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 8px;
                background: var(--surface-dark);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 16px;
                box-shadow: var(--shadow-lg);
                z-index: 100;
                min-width: 250px;
                display: none;
            }
            
            .filter-dropdown.show {
                display: block;
            }
            
            .filter-dropdown-content h4 {
                font-size: 0.875rem;
                font-weight: 600;
                margin-bottom: 12px;
                color: var(--text-primary);
            }
            
            .filter-option {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .filter-option:hover {
                color: var(--text-primary);
            }
            
            .filter-option input[type="checkbox"] {
                cursor: pointer;
            }
            
            .btn-sm {
                padding: 6px 12px;
                font-size: 0.75rem;
            }
        `;
        
        // Add styles if not already added
        if (!document.getElementById('filterStyles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'filterStyles';
            styleElement.textContent = dropdownStyles;
            document.head.appendChild(styleElement);
        }
    }
    
    // Toggle dropdown visibility
    filterDropdown.classList.toggle('show');
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!e.target.closest('.filter-dropdown') && !e.target.closest('.btn-icon[title="Filtros"]')) {
            filterDropdown.classList.remove('show');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

// Reset filters
function resetFilters() {
    document.querySelectorAll('.filter-dropdown input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
    applyFilters();
}

// Apply filters
function applyFilters() {
    const filterConfirmed = document.getElementById('filterConfirmed').checked;
    const filterPending = document.getElementById('filterPending').checked;
    const filterRejected = document.getElementById('filterRejected').checked;
    const filterAdults = document.getElementById('filterAdults').checked;
    const filterFamily = document.getElementById('filterFamily').checked;
    const filterStaff = document.getElementById('filterStaff').checked;
    
    // Filter invitations based on selected filters
    const filteredInvitations = allInvitations.filter(invitation => {
        // Check status filters
        let statusMatch = false;
        if (invitation.confirmed) {
            if (invitation.confirmationDetails?.willAttend === false) {
                statusMatch = filterRejected;
            } else {
                statusMatch = filterConfirmed;
            }
        } else {
            statusMatch = filterPending;
        }
        
        // Check type filters
        let typeMatch = true;
        if (invitation.invitationType) {
            if (invitation.invitationType === 'adults') {
                typeMatch = filterAdults;
            } else if (invitation.invitationType === 'family') {
                typeMatch = filterFamily;
            } else if (invitation.invitationType === 'staff') {
                typeMatch = filterStaff;
            }
        }
        
        return statusMatch && typeMatch;
    });
    
    // Apply search term if any
    const searchInput = document.getElementById('searchInputCreate');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const finalFiltered = searchTerm ? filteredInvitations.filter(invitation => {
        return invitation.code.toLowerCase().includes(searchTerm) ||
               invitation.guestNames.some(name => name.toLowerCase().includes(searchTerm)) ||
               (invitation.email && invitation.email.toLowerCase().includes(searchTerm)) ||
               (invitation.phone && invitation.phone.includes(searchTerm));
    }) : filteredInvitations;
    
    // Display filtered results
    displayCreateSectionInvitations(finalFiltered);
    
    // Close dropdown
    document.getElementById('filterDropdown').classList.remove('show');
}

// Add pulse animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
        100% {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Notification System Functions - REMOVED (now handled by notification-service.js)

// Check for new confirmations - REMOVED (now handled by notification-service.js)

// Show notification for new confirmation - REMOVED (now handled by notification-service.js)

// Update notification badge - REMOVED (notifications now handled by notification-service.js in header only)
function updateNotificationBadge(count) {
    // This function is deprecated - notifications are now handled by the notification service
    // which updates the badge in the header notification button only
    return;
}

// Clear notification badge when viewing dashboard - REMOVED
function clearNotificationBadge() {
    // This function is deprecated - notifications are now handled by the notification service
    return;
}

// Initialize notifications on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the notification service
    notificationService.loadInitialNotifications();
    notificationService.startMonitoring();
});

// Export functions to window for onclick handlers
window.showCreateForm = showCreateForm;
window.showCreateModal = showCreateModal;
window.closeCreateModal = closeCreateModal;
window.showImportModal = showImportModal;
window.closeImportModal = closeImportModal;
window.exportAllInvitations = exportAllInvitations;
window.copyInvitationLink = copyInvitationLink;
window.copyToClipboard = copyToClipboard;
window.viewInvitation = viewInvitation;
window.toggleFilters = toggleFilters;
window.resetFilters = resetFilters;
window.applyFilters = applyFilters;
window.exportInvitationLinks = exportInvitationLinks;
