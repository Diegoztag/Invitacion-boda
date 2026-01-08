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
    
    // Handle table scroll indicator
    function checkTableScroll() {
        const tableContainers = document.querySelectorAll('.table-container');
        tableContainers.forEach(container => {
            const table = container.querySelector('table');
            if (table && container.scrollWidth > container.clientWidth) {
                container.classList.add('scrollable');
            } else {
                container.classList.remove('scrollable');
            }
        });
    }
    
    // Check on load and resize
    window.addEventListener('resize', checkTableScroll);
    setTimeout(checkTableScroll, 100);
    
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
            // Navigate to "Invitaciones" section
            const invitacionesNavItem = document.querySelector('.nav-item[href="#invitations"]');
            if (invitacionesNavItem) {
                invitacionesNavItem.click();
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
                loadInvitationsSectionData();
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
            
            // Update confirmed percentage badge (based on confirmed passes vs target)
            const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
            const confirmedPercentage = Math.round((stats.confirmedPasses / targetTotal) * 100);
            const confirmedBadge = document.getElementById('confirmedChange');
            if (confirmedBadge) {
                confirmedBadge.textContent = `${confirmedPercentage}%`;
                confirmedBadge.title = 'Porcentaje de confirmados';
                // Ensure stat-badge class is present
                if (!confirmedBadge.classList.contains('stat-badge')) {
                    confirmedBadge.classList.add('stat-badge');
                }
                // Update badge color based on percentage
                confirmedBadge.classList.remove('success', 'warning', 'danger', 'primary');
                if (confirmedPercentage >= 70) {
                    confirmedBadge.classList.add('success');
                } else if (confirmedPercentage >= 40) {
                    confirmedBadge.classList.add('warning');
                } else {
                    confirmedBadge.classList.add('danger');
                }
            }
            
            // Update target elements
            updateTargetElements({
                targetInvitations: targetTotal,
                targetTotal: targetTotal
            });
            
            // Calculate and display remaining guests
            const remainingGuests = Math.max(0, targetTotal - stats.confirmedPasses);
            const remainingGuestsEl = document.getElementById('remainingGuests');
            if (remainingGuestsEl) {
                remainingGuestsEl.textContent = remainingGuests;
            }
            
            // Update confirmed change indicator - COMENTADO porque ahora mostramos porcentaje
            // const recentConfirmations = await calculateRecentConfirmations();
            // updateConfirmedChangeIndicator(recentConfirmations);
            
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
        
        // Update confirmed percentage badge for demo data
        const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
        const confirmedPercentage = Math.round((demoStats.confirmedPasses / targetTotal) * 100);
        const confirmedBadge = document.getElementById('confirmedChange');
        if (confirmedBadge) {
            confirmedBadge.textContent = `${confirmedPercentage}%`;
            confirmedBadge.title = 'Porcentaje de confirmados';
            // Ensure stat-badge class is present
            if (!confirmedBadge.classList.contains('stat-badge')) {
                confirmedBadge.classList.add('stat-badge');
            }
            // Update badge color based on percentage
            confirmedBadge.classList.remove('success', 'warning', 'danger', 'primary');
            if (confirmedPercentage >= 70) {
                confirmedBadge.classList.add('success');
            } else if (confirmedPercentage >= 40) {
                confirmedBadge.classList.add('warning');
            } else {
                confirmedBadge.classList.add('danger');
            }
        }
        
        // Update target elements
        const targetInvitations = WEDDING_CONFIG.guests?.targetInvitations || 150;
        updateTargetElements({
            targetInvitations: targetInvitations,
            targetTotal: targetTotal
        });
        
        // Calculate and display remaining guests for demo data
        const remainingGuests = Math.max(0, targetTotal - demoStats.confirmedPasses);
        const remainingGuestsEl = document.getElementById('remainingGuests');
        if (remainingGuestsEl) {
            remainingGuestsEl.textContent = remainingGuests;
        }
        
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
    // Calculate ACTIVE passes only (confirmed + pending, excluding cancelled)
    const confirmedPasses = stats.confirmedPasses || 0;
    const pendingPasses = stats.pendingPasses || 0;
    const activePasses = confirmedPasses + pendingPasses; // Exclude cancelled passes
    
    const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false; // Default to true if not specified
    
    // Use real data from stats if available, otherwise use estimated distribution
    let adultPasses, childPasses, staffPasses;
    let adultPercent, childPercent, staffPercent;
    
    // Check if we have detailed pass breakdown in stats
    if (stats.adultPasses !== undefined && stats.childPasses !== undefined && stats.staffPasses !== undefined) {
        // Calculate active passes for each category (proportionally)
        const totalOriginal = stats.totalPasses || 1; // Avoid division by zero
        const activeRatio = activePasses / totalOriginal;
        
        adultPasses = Math.round(stats.adultPasses * activeRatio);
        childPasses = allowChildren ? Math.round(stats.childPasses * activeRatio) : 0;
        staffPasses = Math.round(stats.staffPasses * activeRatio);
        
        // Adjust for rounding errors
        const calculatedTotal = adultPasses + childPasses + staffPasses;
        if (calculatedTotal !== activePasses && activePasses > 0) {
            adultPasses += (activePasses - calculatedTotal);
        }
    } else {
        // Fallback to estimated distribution if detailed data not available
        if (allowChildren) {
            // Normal distribution with children
            adultPasses = Math.floor(activePasses * 0.8); // 80% adults
            childPasses = Math.floor(activePasses * 0.15); // 15% children
            staffPasses = activePasses - adultPasses - childPasses; // 5% staff
        } else {
            // No children allowed - redistribute percentages
            adultPasses = Math.floor(activePasses * 0.95); // 95% adults
            childPasses = 0; // 0% children
            staffPasses = activePasses - adultPasses; // 5% staff
        }
    }
    
    // Calculate percentages (handle division by zero)
    if (activePasses > 0) {
        adultPercent = Math.round((adultPasses / activePasses) * 100);
        childPercent = allowChildren ? Math.round((childPasses / activePasses) * 100) : 0;
        staffPercent = Math.round((staffPasses / activePasses) * 100);
    } else {
        adultPercent = 0;
        childPercent = 0;
        staffPercent = 0;
    }
    
    // Update total passes (now showing active passes only)
    document.getElementById('totalPassesChart').textContent = activePasses;
    
    // Update adult passes
    document.getElementById('adultPasses').textContent = `${adultPasses} (${adultPercent}%)`;
    const adultProgressEl = document.getElementById('adultProgress');
    adultProgressEl.className = 'progress-fill primary';
    adultProgressEl.style.width = `${adultPercent}%`;
    
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
        childProgressElement.className = 'progress-fill warning';
        childProgressElement.style.width = `${childPercent}%`;
        childProgressItem.classList.remove('disabled-section');
        childProgressItem.querySelector('.progress-label').textContent = 'Niños';
    }
    
    // Update staff passes
    document.getElementById('staffPasses').textContent = `${staffPasses} (${staffPercent}%)`;
    const staffProgressEl = document.getElementById('staffProgress');
    staffProgressEl.className = 'progress-fill muted';
    staffProgressEl.style.width = `${staffPercent}%`;
    
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
    
    // Si no hay confirmaciones, la tabla quedará vacía
    if (confirmations.length === 0) {
        // No mostrar datos demo - dejar la tabla vacía
        return;
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

// Load Invitations Section Data
async function loadInvitationsSectionData() {
    try {
        const result = await adminAPI.fetchInvitations();
        if (APIHelpers.isSuccess(result)) {
            const invitations = result.invitations || [];
            
            // Calculate invitation counts (not passes)
            const totalInvitations = invitations.length;
            const confirmedInvitations = invitations.filter(inv => inv.confirmed && inv.confirmationDetails?.willAttend !== false).length;
            const pendingInvitations = invitations.filter(inv => !inv.confirmed).length;
            const rejectedInvitations = invitations.filter(inv => inv.confirmed && inv.confirmationDetails?.willAttend === false).length;
            
            // Update stats cards in invitations section with invitation counts
            document.getElementById('totalInvitationsStats').textContent = totalInvitations;
            document.getElementById('confirmedPassesStats').textContent = confirmedInvitations;
            document.getElementById('pendingInvitationsStats').textContent = pendingInvitations;
            document.getElementById('cancelledPassesStats').textContent = rejectedInvitations;
            
            // Remove percentage badge for invitations section - not needed here
            const percentageBadge = document.querySelector('#invitations .stat-badge.primary');
            if (percentageBadge) {
                percentageBadge.remove();
            }
            
            // Update confirmed change badge - show percentage of confirmed invitations
            const confirmedChangeBadge = document.getElementById('confirmedChangeStats');
            if (confirmedChangeBadge) {
                // Calculate percentage of confirmed invitations vs total invitations
                const confirmedPercentage = totalInvitations > 0 ? 
                    Math.round((confirmedInvitations / totalInvitations) * 100) : 0;
                
                confirmedChangeBadge.textContent = `${confirmedPercentage}%`;
                confirmedChangeBadge.title = 'Porcentaje de invitaciones confirmadas';
                
                // Ensure stat-badge class is present
                if (!confirmedChangeBadge.classList.contains('stat-badge')) {
                    confirmedChangeBadge.classList.add('stat-badge');
                }
                
                // Update badge color based on percentage
                confirmedChangeBadge.classList.remove('success', 'warning', 'danger', 'primary');
                if (confirmedPercentage >= 70) {
                    confirmedChangeBadge.classList.add('success');
                } else if (confirmedPercentage >= 40) {
                    confirmedChangeBadge.classList.add('warning');
                } else {
                    confirmedChangeBadge.classList.add('danger');
                }
            }
        } else {
            throw new Error(APIHelpers.getErrorMessage(result));
        }
    } catch (error) {
        console.error('Error loading invitations section data:', error);
        // Show demo data
        document.getElementById('totalInvitationsStats').textContent = 11;
        document.getElementById('confirmedPassesStats').textContent = 8;
        document.getElementById('pendingInvitationsStats').textContent = 2;
        document.getElementById('cancelledPassesStats').textContent = 1;
    }
    
    // Load invitations for the table
    loadInvitations();
    
    // Initialize pagination
    initInvitationsPagination();
}

// Display invitations in the table
function displayInvitations(invitations, page = 1, itemsPerPage = 20) {
    const tbody = document.getElementById('invitationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Calculate pagination info
    const paginationInfo = calculatePaginationInfo(invitations.length, page, itemsPerPage);
    const paginatedInvitations = invitations.slice(paginationInfo.startIndex, paginationInfo.endIndex);
    
    // Update pagination info display
    document.getElementById('showingFrom').textContent = paginationInfo.showingFrom;
    document.getElementById('showingTo').textContent = paginationInfo.showingTo;
    document.getElementById('totalCount').textContent = paginationInfo.totalCount;
    
    // Render table rows using the same format as recent confirmations
    paginatedInvitations.forEach((invitation, index) => {
        const row = document.createElement('tr');
        // Use 'recent' type to get the same format as recent confirmations table
        row.innerHTML = renderTableRow(invitation, 'recent', paginationInfo.startIndex + index);
        tbody.appendChild(row);
    });
    
    // Update pagination controls
    updateTablePagination({
        currentPage: page,
        totalPages: paginationInfo.totalPages,
        prevBtnId: 'prevPage',
        nextBtnId: 'nextPage',
        numbersContainerId: 'paginationNumbers',
        onPageChange: (newPage) => displayInvitations(invitations, newPage, itemsPerPage)
    });
}

// Initialize invitations pagination
function initInvitationsPagination() {
    // Store current filtered invitations for pagination
    window.currentFilteredInvitations = allInvitations;
    
    // Initialize items per page selector
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        // Load saved preference or use default
        const savedItemsPerPage = localStorage.getItem('invitationsPerPage') || '20';
        itemsPerPageSelect.value = savedItemsPerPage;
        
        // Add change event listener
        itemsPerPageSelect.addEventListener('change', (e) => {
            const newItemsPerPage = parseInt(e.target.value);
            
            // Save preference
            localStorage.setItem('invitationsPerPage', newItemsPerPage);
            
            // Get current filtered invitations
            const searchInput = document.getElementById('searchInput');
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            
            let invitationsToDisplay = allInvitations;
            
            // Apply search filter if there's a search term
            if (searchTerm) {
                invitationsToDisplay = allInvitations.filter(invitation => {
                    return invitation.code.toLowerCase().includes(searchTerm) ||
                           invitation.guestNames.some(name => name.toLowerCase().includes(searchTerm)) ||
                           (invitation.phone && invitation.phone.includes(searchTerm));
                });
            }
            
            // Re-display with new items per page, starting from page 1
            displayInvitations(invitationsToDisplay, 1, newItemsPerPage);
        });
    }
}

// View Invitation Details
function viewInvitation(code) {
    const invitation = allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    const invitationUrl = `${window.location.origin}/invitacion?invitation=${code}`;
    
    // Store current invitation for editing
    window.currentEditingInvitation = invitation;
    
    // Function to render view mode
    function renderViewMode() {
        // Get status badge with icon for modal - usar showIcon para badge grande
        const statusBadgeInfo = getStatusBadge(invitation, { showIcon: true });
        
        // Use utility function to calculate cancelled passes
        const cancelledPasses = calculateCancelledPasses(invitation);
        
        const detailsContent = `
            <div class="invitation-detail" data-mode="view">
                <!-- Status Header with Badge Style -->
                <div class="status-header-emoji">
                    ${statusBadgeInfo.html}
                </div>
                
                <!-- Guest Info Section -->
                <div class="guest-info-section">
                    <p class="info-item"><i class="fas fa-users"></i> <strong>Invitados:</strong> ${invitation.guestNames.join(' y ')}</p>
                    <p class="info-item"><i class="fas fa-ticket-alt"></i> <strong>Pases:</strong> ${invitation.numberOfPasses}</p>
                    ${invitation.tableNumber ? `<p class="info-item"><i class="fas fa-chair"></i> <strong>Mesa:</strong> ${invitation.tableNumber}</p>` : '<p class="info-item"><i class="fas fa-chair"></i> <strong>Mesa:</strong> Sin asignar</p>'}
                    ${invitation.phone || invitation.confirmationDetails?.phone ? `
                        <p class="info-item"><i class="fas fa-phone"></i> <strong>Teléfono:</strong> ${invitation.phone || invitation.confirmationDetails?.phone}</p>
                    ` : '<p class="info-item"><i class="fas fa-phone"></i> <strong>Teléfono:</strong> No proporcionado</p>'}
                </div>
                
                <!-- Confirmation Status Section -->
                <div class="confirmation-status-section">
                    <h5 class="section-divider">Estado de Confirmación</h5>
                    ${invitation.confirmed ? `
                        ${invitation.confirmationDetails?.willAttend ? `
                            <p class="info-item"><strong>Asistirá:</strong> Sí (${invitation.confirmedPasses} personas)</p>
                            <p class="info-item"><strong>Confirmado el:</strong> ${new Date(invitation.confirmationDate).toLocaleDateString('es-MX', { 
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                            ${invitation.confirmationDetails?.message ? `
                                <p class="info-item"><strong>Mensaje:</strong> "${invitation.confirmationDetails.message}"</p>
                            ` : ''}
                        ` : `
                            <p class="info-item"><strong>Asistirá:</strong> No</p>
                            <p class="info-item"><strong>Confirmado el:</strong> ${new Date(invitation.confirmationDate).toLocaleDateString('es-MX', { 
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        `}
                    ` : ''}
                </div>
                
                <!-- Action Buttons -->
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="copyToClipboard('${invitationUrl}')">
                        <i class="fas fa-link"></i> Copiar Link
                    </button>
                    <button class="btn btn-secondary" onclick="window.open('${invitationUrl}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> Ver Invitación
                    </button>
                    ${invitation.status === 'inactive' ? `
                        <button class="btn btn-primary" onclick="activateInvitation('${code}')">
                            <i class="fas fa-check-circle"></i> Activar
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="editInvitation('${code}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="deactivateInvitation('${code}')">
                            <i class="fas fa-power-off"></i> Desactivar
                        </button>
                    `}
                </div>
            </div>
        `;
        
        invitationDetailModal.setContent(detailsContent);
    }
    
    // Initial render in view mode
    renderViewMode();
    invitationDetailModal.open();
}

// Deactivate Invitation
function deactivateInvitation(code) {
    const invitation = allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    // Check if invitation is confirmed and show warning
    if (invitation.confirmed) {
        const confirmModal = ModalFactory.createConfirmModal({
            title: 'Advertencia: Invitación Confirmada',
            message: `Esta invitación ya fue confirmada por ${invitation.guestNames.join(' y ')}. ¿Estás seguro de que deseas desactivarla?`,
            confirmText: 'Sí, desactivar',
            confirmClass: 'danger',
            onConfirm: () => {
                proceedWithDeactivation(code, invitation);
            }
        });
        
        window.activeModal = confirmModal;
        confirmModal.open();
    } else {
        proceedWithDeactivation(code, invitation);
    }
}

// Proceed with deactivation
function proceedWithDeactivation(code, invitation) {
    // Create deactivation modal
    const deactivateModal = ModalFactory.createDeactivateInvitationModal(invitation);
    window.activeDeactivateModal = deactivateModal;
    
    // Define the confirm deactivate function
    window.confirmDeactivateInvitation = async function() {
        const deactivationReason = document.getElementById('deactivationReason').value.trim();
        
        try {
            const response = await fetch(`${CONFIG.backendUrl}/invitation/${code}/deactivate`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deactivatedBy: 'admin',
                    deactivationReason: deactivationReason
                })
            });
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
                } else {
                    // Si no es JSON, probablemente es HTML (error 404 o similar)
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            }
            
            const result = await response.json();
            
            if (result.success) {
                showToast('Invitación desactivada exitosamente', 'success');
                
                // Update local data
                invitation.status = 'inactive';
                invitation.cancelledAt = new Date().toISOString();
                invitation.cancelledBy = 'admin';
                invitation.cancellationReason = deactivationReason;
                
                // Close modals
                deactivateModal.close();
                if (invitationDetailModal) {
                    invitationDetailModal.close();
                }
                
                // Reload data
                loadInvitations();
                loadDashboardData();
                
                // Update invitations section if active
                const invitationsSection = document.getElementById('invitations');
                if (invitationsSection && invitationsSection.classList.contains('active')) {
                    loadInvitationsSectionData();
                }
            } else {
                throw new Error(result.error || 'Error al desactivar la invitación');
            }
        } catch (error) {
            console.error('Error deactivating invitation:', error);
            showToast(error.message || 'Error al desactivar la invitación', 'error');
        }
    };
    
    deactivateModal.open();
}

// Activate Invitation
async function activateInvitation(code) {
    const invitation = allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    // Confirm activation
    const confirmModal = ModalFactory.createConfirmModal({
        title: 'Activar Invitación',
        message: `¿Estás seguro de activar la invitación de ${invitation.guestNames.join(' y ')}?`,
        confirmText: 'Activar',
        confirmClass: 'primary',
        onConfirm: async () => {
            try {
                const response = await fetch(`${CONFIG.backendUrl}/invitation/${code}/activate`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Verificar si la respuesta es exitosa
                if (!response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
                    } else {
                        // Si no es JSON, probablemente es HTML (error 404 o similar)
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                }
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('Invitación activada exitosamente', 'success');
                    
                    // Update local data
                    invitation.status = '';  // empty = active
                    invitation.cancelledAt = null;
                    invitation.cancelledBy = null;
                    invitation.cancellationReason = null;
                    
                    // Close modal if open
                    if (invitationDetailModal) {
                        invitationDetailModal.close();
                    }
                    
                    // Reload data
                    loadInvitations();
                    loadDashboardData();
                    
                    // Update invitations section if active
                    const invitationsSection = document.getElementById('invitations');
                    if (invitationsSection && invitationsSection.classList.contains('active')) {
                        loadInvitationsSectionData();
                    }
                } else {
                    throw new Error(result.error || 'Error al activar la invitación');
                }
            } catch (error) {
                console.error('Error activating invitation:', error);
                showToast(error.message || 'Error al activar la invitación', 'error');
            }
        }
    });
    
    window.activeModal = confirmModal;
    confirmModal.open();
}

// Edit Invitation
function editInvitation(code) {
    const invitation = window.currentEditingInvitation || allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    // Get guest details from the invitation
    const guests = [];
    if (invitation.guests && invitation.guests.length > 0) {
        // Use existing guest details if available
        guests.push(...invitation.guests);
    } else {
        // Create guest list from names and pass counts
        const guestNames = invitation.guestNames || [];
        const adultPasses = invitation.adultPasses || invitation.numberOfPasses;
        const childPasses = invitation.childPasses || 0;
        const staffPasses = invitation.staffPasses || 0;
        
        let adultCount = 0;
        let childCount = 0;
        let staffCount = 0;
        
        // Distribute names among types based on pass counts
        guestNames.forEach((name, index) => {
            if (staffCount < staffPasses) {
                guests.push({ name, type: 'staff' });
                staffCount++;
            } else if (childCount < childPasses) {
                guests.push({ name, type: 'child' });
                childCount++;
            } else {
                guests.push({ name, type: 'adult' });
                adultCount++;
            }
        });
    }
    
    // Check if children are allowed
    const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false;
    
    // Function to generate guest fields
    function generateEditGuestFields(numberOfPasses, preservedGuests = []) {
        let fieldsHTML = '';
        for (let i = 0; i < numberOfPasses; i++) {
            const guest = preservedGuests[i] || { name: '', type: 'adult' };
            fieldsHTML += `
                <div class="guest-field-row">
                    <div class="guest-name-field">
                        <input type="text" 
                               name="guestName_${i}" 
                               class="guest-name-input" 
                               placeholder="Nombre del invitado" 
                               value="${guest.name}"
                               required>
                    </div>
                    <div class="guest-type-field">
                        <select name="guestType_${i}" class="guest-type-select" required>
                            <option value="adult" ${guest.type === 'adult' ? 'selected' : ''}>Adulto</option>
                            ${allowChildren ? `<option value="child" ${guest.type === 'child' ? 'selected' : ''}>Niño</option>` : ''}
                            <option value="staff" ${guest.type === 'staff' ? 'selected' : ''}>Staff/Proveedor</option>
                        </select>
                    </div>
                </div>
            `;
        }
        return fieldsHTML;
    }
    
    const editContent = `
        <div class="invitation-detail" data-mode="edit">
            <div class="edit-header">
                <h3><i class="fas fa-edit"></i> Editando Invitación</h3>
            </div>
            
            <form id="editInvitationForm">
                <!-- Basic Info -->
                <div class="form-group">
                    <label>Número de Pases</label>
                    <input type="number" 
                           id="editNumberOfPasses" 
                           name="numberOfPasses" 
                           min="1" 
                           max="10" 
                           value="${invitation.numberOfPasses}" 
                           required>
                    <small class="form-text text-muted">Cambiar el número de pases ajustará los campos de invitados</small>
                </div>
                
                <div class="form-group">
                    <label>Mesa</label>
                    <input type="number" 
                           name="tableNumber" 
                           min="1" 
                           value="${invitation.tableNumber || ''}" 
                           placeholder="Número de mesa (opcional)">
                </div>
                
                <!-- Guest Fields -->
                <div class="form-group">
                    <label>Invitados</label>
                    <div id="editGuestFields">
                        ${generateEditGuestFields(invitation.numberOfPasses, guests)}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" 
                           name="phone" 
                           value="${invitation.phone || invitation.confirmationDetails?.phone || ''}" 
                           placeholder="+52 123 456 7890">
                </div>
                
                <!-- Confirmation Status -->
                <div class="form-group">
                    <label>Estado de Confirmación</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" 
                                   name="confirmationStatus" 
                                   value="confirmed" 
                                   ${invitation.confirmed && invitation.confirmationDetails?.willAttend !== false ? 'checked' : ''}>
                            <span>Sí asistirán</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" 
                                   name="confirmationStatus" 
                                   value="declined" 
                                   ${invitation.confirmed && invitation.confirmationDetails?.willAttend === false ? 'checked' : ''}>
                            <span>No podrán asistir</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" 
                                   name="confirmationStatus" 
                                   value="pending" 
                                   ${!invitation.confirmed ? 'checked' : ''}>
                            <span>Sin confirmar</span>
                        </label>
                    </div>
                </div>
                
                <!-- Confirmed Passes (only show if confirmed) -->
                <div class="form-group" id="confirmedPassesGroup" style="${invitation.confirmed && invitation.confirmationDetails?.willAttend !== false ? '' : 'display: none;'}">
                    <label>Número de Asistentes Confirmados</label>
                    <input type="number" 
                           name="confirmedPasses" 
                           min="0" 
                           max="${invitation.numberOfPasses}" 
                           value="${invitation.confirmedPasses || 0}">
                    <small class="form-text text-muted">Cuántas personas asistirán de las ${invitation.numberOfPasses} invitadas</small>
                </div>
                
                <!-- Action Buttons -->
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="cancelEditInvitation('${code}')">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    `;
    
    invitationDetailModal.setContent(editContent);
    
    // Initialize edit form handlers
    setTimeout(() => {
        const editForm = document.getElementById('editInvitationForm');
        const editNumberOfPassesInput = document.getElementById('editNumberOfPasses');
        const editGuestFields = document.getElementById('editGuestFields');
        
        // Store current guest data for preservation
        let currentEditGuestData = guests.slice();
        
        // Function to save current guest data
        function saveCurrentEditGuestData() {
            currentEditGuestData = [];
            const guestNameInputs = editGuestFields.querySelectorAll('.guest-name-input');
            const guestTypeSelects = editGuestFields.querySelectorAll('.guest-type-select');
            
            guestNameInputs.forEach((input, index) => {
                currentEditGuestData.push({
                    name: input.value,
                    type: guestTypeSelects[index]?.value || 'adult'
                });
            });
        }
        
        // Update fields when number of passes changes
        editNumberOfPassesInput.addEventListener('input', () => {
            const newNumberOfPasses = parseInt(editNumberOfPassesInput.value) || 1;
            
            // Save current data before regenerating
            saveCurrentEditGuestData();
            
            // Regenerate fields with preserved data
            editGuestFields.innerHTML = generateEditGuestFields(newNumberOfPasses, currentEditGuestData);
        });
        
        // Handle confirmation status changes
        const confirmationRadios = editForm.querySelectorAll('input[name="confirmationStatus"]');
        const confirmedPassesGroup = document.getElementById('confirmedPassesGroup');
        const confirmedPassesInput = editForm.querySelector('input[name="confirmedPasses"]');
        
        confirmationRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'confirmed' && radio.checked) {
                    confirmedPassesGroup.style.display = '';
                    // Update max value based on current number of passes
                    const currentPasses = parseInt(editNumberOfPassesInput.value) || 1;
                    confirmedPassesInput.max = currentPasses;
                    confirmedPassesInput.value = Math.min(confirmedPassesInput.value, currentPasses);
                } else {
                    confirmedPassesGroup.style.display = 'none';
                }
            });
        });
        
        // Form submission
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(editForm);
            const numberOfPasses = parseInt(formData.get('numberOfPasses')) || 1;
            const originalPasses = invitation.numberOfPasses;
            
            // Check capacity if increasing passes
            if (numberOfPasses > originalPasses) {
                try {
                    const statsResult = await adminAPI.fetchStats();
                    if (APIHelpers.isSuccess(statsResult)) {
                        const stats = statsResult.stats;
                        const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 130;
                        const totalAssignedPasses = stats.totalPasses || 0;
                        const availablePasses = targetTotal - totalAssignedPasses;
                        const additionalPassesNeeded = numberOfPasses - originalPasses;
                        
                        if (additionalPassesNeeded > availablePasses) {
                            if (availablePasses <= 0) {
                                showToast('No hay pases disponibles. Se ha alcanzado el límite de invitados.', 'error');
                            } else {
                                showToast(`Solo quedan ${availablePasses} pases disponibles. No se pueden agregar ${additionalPassesNeeded} pases más.`, 'error');
                            }
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error checking capacity:', error);
                }
            }
            
            // Collect guest data
            const guests = [];
            let adultPasses = 0;
            let childPasses = 0;
            let staffPasses = 0;
            
            for (let i = 0; i < numberOfPasses; i++) {
                const name = formData.get(`guestName_${i}`);
                const type = formData.get(`guestType_${i}`);
                
                if (name && type) {
                    guests.push({
                        name: name.trim(),
                        type: type
                    });
                    
                    if (type === 'adult') {
                        adultPasses++;
                    } else if (type === 'child') {
                        childPasses++;
                    } else if (type === 'staff') {
                        staffPasses++;
                    }
                }
            }
            
            // Extract guest names
            const guestNames = guests.map(g => g.name);
            
            // Prepare update data
            const updateData = {
                guestNames: guestNames,
                numberOfPasses: numberOfPasses,
                phone: formData.get('phone') || null,
                tableNumber: formData.get('tableNumber') ? parseInt(formData.get('tableNumber')) : null,
                adultPasses: adultPasses,
                childPasses: childPasses,
                staffPasses: staffPasses,
                guests: guests
            };
            
            // Handle confirmation status
            const confirmationStatus = formData.get('confirmationStatus');
            if (confirmationStatus === 'confirmed') {
                updateData.confirmed = true;
                updateData.confirmationDetails = {
                    willAttend: true,
                    numberOfGuests: parseInt(formData.get('confirmedPasses')) || numberOfPasses,
                    attendingNames: guestNames.slice(0, parseInt(formData.get('confirmedPasses')) || numberOfPasses)
                };
                updateData.confirmedPasses = updateData.confirmationDetails.numberOfGuests;
            } else if (confirmationStatus === 'declined') {
                updateData.confirmed = true;
                updateData.confirmationDetails = {
                    willAttend: false
                };
                updateData.confirmedPasses = 0;
            } else {
                updateData.confirmed = false;
                updateData.confirmationDetails = null;
                updateData.confirmedPasses = 0;
            }
            
            try {
                // Call API to update invitation
                const result = await adminAPI.updateInvitation(code, updateData);
                
                if (APIHelpers.isSuccess(result)) {
                    showToast('Invitación actualizada exitosamente', 'success');
                    
                    // Update local data
                    Object.assign(invitation, updateData);
                    if (result.invitation) {
                        Object.assign(invitation, result.invitation);
                    }
                    
                    // Close modal and refresh data
                    invitationDetailModal.close();
                    loadInvitations();
                    loadDashboardData();
                    
                    // Update invitations section if active
                    const invitationsSection = document.getElementById('invitations');
                    if (invitationsSection && invitationsSection.classList.contains('active')) {
                        loadInvitationsSectionData();
                    }
                } else {
                    throw new Error(APIHelpers.getErrorMessage(result));
                }
            } catch (error) {
                console.error('Error updating invitation:', error);
                showToast(error.message || 'Error al actualizar la invitación', 'error');
            }
        });
    }, 100);
}

// Cancel edit invitation
function cancelEditInvitation(code) {
    // Re-render view mode
    viewInvitation(code);
}

// Show all invitations table (for mobile view)
function showAllInvitationsTable() {
    // Create modal content with table similar to recent confirmations
    const tableContent = `
        <div class="all-invitations-modal">
            <div class="modal-header-mobile">
                <h3>Todas las Invitaciones</h3>
                <button class="btn-icon" onclick="closeAllInvitationsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="table-container" style="max-height: 80vh; overflow-y: auto;">
                <div class="table-responsive">
                    <table class="recent-confirmations-table">
                        <thead>
                            <tr>
                                <th>Invitado</th>
                                <th>Estado</th>
                                <th>Pases</th>
                                <th>Mesa</th>
                                <th class="message-column">Mensaje</th>
                                <th style="text-align: right;">Detalle</th>
                            </tr>
                        </thead>
                        <tbody id="allInvitationsTableBody">
                            <!-- Invitations will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Create a custom modal for all invitations
    const modal = document.createElement('div');
    modal.id = 'allInvitationsModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 95%; width: 95%; margin: 2.5% auto;">
            ${tableContent}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Populate the table with all invitations
    const tbody = document.getElementById('allInvitationsTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        
        allInvitations.forEach((invitation, index) => {
            const row = document.createElement('tr');
            row.innerHTML = renderTableRow(invitation, 'recent', index);
            tbody.appendChild(row);
        });
    }
    
    // Add click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAllInvitationsModal();
        }
    });
}

// Close all invitations modal
function closeAllInvitationsModal() {
    const modal = document.getElementById('allInvitationsModal');
    if (modal) {
        modal.remove();
    }
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
    // This function is now empty as the form initialization
    // is handled by initCreateFormInModal when the modal opens
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
            
            // Get current items per page value
            const itemsPerPageSelect = document.getElementById('itemsPerPage');
            const itemsPerPage = itemsPerPageSelect ? parseInt(itemsPerPageSelect.value) : 20;
            
            // Display with current items per page setting
            displayInvitations(filteredInvitations, 1, itemsPerPage);
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
    
    // Initialize form after modal is opened
    setTimeout(() => {
        initCreateFormInModal();
    }, 100);
}

function closeCreateModal() {
    createInvitationModal.close();
    // Reset form
    const form = document.getElementById('createInvitationForm');
    if (form) {
        form.reset();
        // Reset number of passes to 1
        const numberOfPassesInput = document.getElementById('numberOfPasses');
        if (numberOfPassesInput) {
            numberOfPassesInput.value = '1';
            // Trigger change event to regenerate fields
            numberOfPassesInput.dispatchEvent(new Event('input'));
        }
    }
}

function showImportModal() {
    window.activeModal = importCsvModal;
    importCsvModal.open();
    // Re-initialize CSV upload after modal opens
    setTimeout(() => {
        initCsvUploadHandlers();
    }, 100);
}

function closeImportModal() {
    importCsvModal.close();
    // Reset file input and upload area
    const csvFile = document.getElementById('csvFile');
    const fileName = document.getElementById('fileName');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const uploadBtn = document.getElementById('uploadCsvBtn');
    const csvResults = document.getElementById('csvResults');
    
    if (csvFile) csvFile.value = '';
    if (fileName) fileName.textContent = '';
    if (fileUploadArea) {
        fileUploadArea.classList.remove('has-file');
        fileUploadArea.classList.remove('drag-over');
    }
    if (uploadBtn) {
        uploadBtn.classList.remove('show');
    }
    if (csvResults) {
        csvResults.innerHTML = '';
        csvResults.classList.remove('show', 'success', 'error');
    }
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

// Initialize CSV Upload Handlers (separate function for re-initialization)
function initCsvUploadHandlers() {
    const csvFile = document.getElementById('csvFile');
    const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
    
    if (!csvFile || !fileUploadWrapper) {
        console.error('CSV upload elements not found');
        return;
    }
    
    // Handle file selection
    function handleFileSelect(file) {
        console.log('handleFileSelect called with file:', file);
        console.log('File type:', file?.type);
        console.log('File name:', file?.name);
        console.log('File size:', file?.size);
        
        // Check if file is CSV by extension if MIME type is not set
        const isCSV = file && (
            file.type === 'text/csv' || 
            file.type === 'application/vnd.ms-excel' ||
            file.type === 'application/csv' ||
            file.type === '' && file.name.toLowerCase().endsWith('.csv')
        );
        
        console.log('Is CSV file?', isCSV);
        
        if (isCSV) {
            // Set flag to indicate we have a selected file
            window.hasSelectedFile = true;
            
            // Get elements
            const fileNameEl = document.getElementById('fileName');
            const fileSelectedInfoEl = document.getElementById('fileSelectedInfo');
            const csvResultsEl = document.getElementById('csvResults');
            
            console.log('File is valid CSV, processing...');
            
            if (fileNameEl) {
                fileNameEl.textContent = file.name;
                console.log('File name set:', file.name);
            }
            if (fileSelectedInfoEl) {
                // Use setProperty with important flag to override CSS !important
                fileSelectedInfoEl.style.setProperty('display', 'flex', 'important');
                console.log('File info shown');
            }
            if (csvResultsEl) {
                csvResultsEl.innerHTML = '';
                csvResultsEl.classList.remove('show', 'success', 'error');
            }
            
            // Store file for upload
            window.selectedCsvFile = file;
            console.log('File stored in window.selectedCsvFile:', window.selectedCsvFile);
            
            // Enable upload button - more robust approach
            const enableButton = () => {
                const uploadBtn = document.getElementById('uploadCsvBtn');
                console.log('Looking for upload button...');
                
                if (uploadBtn) {
                    console.log('Button found, current disabled state:', uploadBtn.disabled);
                    console.log('Button HTML:', uploadBtn.outerHTML);
                    
                    // Multiple approaches to ensure button is enabled
                    uploadBtn.disabled = false;
                    uploadBtn.removeAttribute('disabled');
                    
                    // Force style update with !important to override CSS
                    uploadBtn.style.setProperty('opacity', '1', 'important');
                    uploadBtn.style.setProperty('cursor', 'pointer', 'important');
                    uploadBtn.style.setProperty('background-color', '#e619a1', 'important');
                    uploadBtn.style.setProperty('pointer-events', 'auto', 'important');
                    
                    // Remove any disabled classes
                    uploadBtn.classList.remove('disabled');
                    
                    // Force a reflow to ensure styles are applied
                    uploadBtn.offsetHeight;
                    
                    // Ensure onclick handler is set
                    uploadBtn.onclick = window.handleCsvUpload;
                    console.log('Button onclick handler set:', uploadBtn.onclick);
                    
                    // Event listener removed - using only onclick to avoid duplicate calls
                    
                    // Check if it worked
                    setTimeout(() => {
                        console.log('Button disabled state after update:', uploadBtn.disabled);
                        console.log('Button computed styles:', window.getComputedStyle(uploadBtn).opacity);
                        console.log('Button onclick handler:', uploadBtn.onclick);
                        
                        // If still disabled, try a more aggressive approach
                        if (uploadBtn.disabled) {
                            console.log('Button still disabled, trying aggressive approach...');
                            // Clone and replace the button to remove all event listeners and states
                            const newBtn = uploadBtn.cloneNode(true);
                            newBtn.disabled = false;
                            newBtn.removeAttribute('disabled');
                            newBtn.style.setProperty('opacity', '1', 'important');
                            newBtn.style.setProperty('cursor', 'pointer', 'important');
                            newBtn.style.setProperty('background-color', '#e619a1', 'important');
                            newBtn.onclick = window.handleCsvUpload;
                            uploadBtn.parentNode.replaceChild(newBtn, uploadBtn);
                        }
                    }, 50);
                } else {
                    console.error('Upload button not found in DOM');
                    // Try again after a longer delay
                    setTimeout(enableButton, 200);
                }
            };
            
            // Try to enable button with multiple attempts
            setTimeout(enableButton, 100);
            
        } else if (file) {
            showToast('Por favor selecciona un archivo CSV válido', 'error');
        }
    }
    
    // Clear file selection
    window.clearFileSelection = function() {
        window.selectedCsvFile = null;
        window.hasSelectedFile = false; // Clear the flag
        
        // Get elements
        const csvFileEl = document.getElementById('csvFile');
        const fileNameEl = document.getElementById('fileName');
        const fileSelectedInfoEl = document.getElementById('fileSelectedInfo');
        const csvResultsEl = document.getElementById('csvResults');
        const uploadBtnEl = document.getElementById('uploadCsvBtn');
        
        if (csvFileEl) csvFileEl.value = '';
        if (fileNameEl) fileNameEl.textContent = '';
        if (fileSelectedInfoEl) {
            // Remove inline style to avoid specificity issues
            fileSelectedInfoEl.style.display = '';
        }
        if (csvResultsEl) {
            csvResultsEl.innerHTML = '';
            csvResultsEl.classList.remove('show', 'success', 'error');
        }
        
        // Disable upload button only if no file is selected
        if (uploadBtnEl && !window.hasSelectedFile) {
            uploadBtnEl.disabled = true;
            uploadBtnEl.setAttribute('disabled', 'disabled');
        }
    };
    
    // File input change event
    csvFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });
    
    // Drag and drop functionality
    fileUploadWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadWrapper.classList.add('drag-over');
        console.log('Drag over detected');
    });
    
    fileUploadWrapper.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadWrapper.classList.remove('drag-over');
        console.log('Drag leave detected');
    });
    
    fileUploadWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadWrapper.classList.remove('drag-over');
        
        console.log('Drop event detected');
        console.log('Files in dataTransfer:', e.dataTransfer.files.length);
        
        const file = e.dataTransfer.files[0];
        console.log('First file from drop:', file);
        
        if (file) {
            console.log('Processing dropped file...');
            handleFileSelect(file);
            
            // Update file input
            try {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                csvFile.files = dataTransfer.files;
                console.log('File input updated successfully');
            } catch (error) {
                console.error('Error updating file input:', error);
                // Fallback for browsers that don't support DataTransfer
                console.log('Using fallback method for file input');
            }
        } else {
            console.error('No file found in drop event');
        }
    });
}

// Initialize CSV Upload
function initCsvUpload() {
    // Initial setup - will be called again when modal opens
    setTimeout(() => {
        initCsvUploadHandlers();
    }, 100);
    
    // Handle CSV upload
    window.handleCsvUpload = async function() {
        const file = window.selectedCsvFile;
        if (!file) {
            showToast('Por favor selecciona un archivo CSV', 'error');
            return;
        }
        
        const csvResultsEl = document.getElementById('csvResults');
        if (csvResultsEl) {
            csvResultsEl.innerHTML = '<p><span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span> Procesando archivo...</p>';
            csvResultsEl.classList.remove('error', 'success'); // Limpiar clases de estado anterior
            csvResultsEl.classList.add('show');
        }
        
        try {
            const text = await file.text();
            
            // Validar que el archivo no esté vacío
            if (!text.trim()) {
                if (csvResultsEl) {
                    csvResultsEl.innerHTML = '<p class="error">El archivo está vacío</p>';
                    csvResultsEl.classList.add('show', 'error');
                }
                return;
            }
            
            if (csvResultsEl) {
                csvResultsEl.innerHTML = '<p>Procesando archivo CSV...</p>';
            }
            
            let created = 0;
            let errors = [];
            let createdInvitations = [];
            
            // First, check if we have capacity for the invitations
            try {
                // Parse CSV to check total passes needed
                const parsedInvitations = parseCSV(text);
                const totalPassesNeeded = parsedInvitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0);
                
                // Get current stats to check available capacity
                const statsResult = await adminAPI.fetchStats();
                if (APIHelpers.isSuccess(statsResult)) {
                    const stats = statsResult.stats;
                    const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 130;
                    
                    // Calculate total passes already assigned (including pending)
                    const totalAssignedPasses = stats.totalPasses || 0;
                    const availablePasses = targetTotal - totalAssignedPasses;
                    
                    // Check if the import would exceed the limit
                    if (totalPassesNeeded > availablePasses) {
                        if (csvResultsEl) {
                            csvResultsEl.classList.add('show', 'error');
                            if (availablePasses <= 0) {
                                csvResultsEl.innerHTML = `
                                    <h5 class="result-header"><span class="material-symbols-outlined result-icon">error</span> Sin capacidad disponible</h5>
                                    <div class="result-details">
                                        <p>No hay pases disponibles. Se ha alcanzado el límite de ${targetTotal} invitados.</p>
                                    </div>
                                `;
                            } else {
                                csvResultsEl.innerHTML = `
                                    <h5 class="result-header"><span class="material-symbols-outlined result-icon">error</span> Capacidad insuficiente</h5>
                                    <div class="result-details">
                                        <p>El archivo requiere ${totalPassesNeeded} pases pero solo quedan ${availablePasses} disponibles.</p>
                                        <p>Límite total de la fiesta: ${targetTotal} invitados</p>
                                    </div>
                                `;
                            }
                        }
                        return; // Stop import
                    }
                }
            } catch (error) {
                console.error('Error checking capacity:', error);
                // Continue with import if we can't check capacity
            }
            
            // Check if children are allowed before importing
            const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false;
            
            // If children are not allowed, validate CSV doesn't contain children
            if (!allowChildren) {
                const parsedInvitations = parseCSV(text);
                const hasChildren = parsedInvitations.some(inv => inv.childPasses && inv.childPasses > 0);
                
                if (hasChildren) {
                    if (csvResultsEl) {
                        csvResultsEl.classList.add('show', 'error');
                        csvResultsEl.innerHTML = `
                            <h5 class="result-header"><span class="material-symbols-outlined result-icon">error</span> Niños no permitidos</h5>
                            <div class="result-details">
                                <p>El archivo contiene invitaciones con niños, pero los niños no están permitidos en esta boda.</p>
                                <p>Por favor, modifica el archivo para incluir solo adultos y staff.</p>
                            </div>
                        `;
                    }
                    return; // Stop import
                }
            }
            
            // Use API to import invitations - pass the raw CSV content
            const importResult = await adminAPI.importInvitations(text);
            
            created = importResult.created;
            // Manejar errores - pueden venir como strings o como objetos
            errors = importResult.errors.map(err => {
                if (typeof err === 'string') {
                    return err;
                } else if (err && err.guestNames && err.error) {
                    return `${err.guestNames}: ${err.error}`;
                } else if (err && err.error) {
                    return err.error;
                } else {
                    return 'Error desconocido';
                }
            });
            createdInvitations = importResult.createdInvitations;
            
            // Si la importación fue exitosa y no hay errores, cerrar modal y mostrar toast
            if (created > 0 && errors.length === 0) {
                // Cerrar el modal primero
                closeImportModal();
                
                // Mostrar toast de éxito después de cerrar el modal
                setTimeout(() => {
                    showToast(`${created} invitaciones creadas exitosamente`, 'success');
                }, 300); // Pequeño delay para que se vea después de cerrar el modal
                
                // Recargar los datos
                loadInvitations();
                loadDashboardData();
                
                // Actualizar estadísticas de la sección de invitaciones si está activa
                const invitationsSection = document.getElementById('invitations');
                if (invitationsSection && invitationsSection.classList.contains('active')) {
                    loadInvitationsSectionData();
                }
                
                // Store created invitations for potential export later
                window.createdInvitations = createdInvitations;
            } else {
                // Si hay errores o no se creó nada, mostrar los resultados en el modal
                let resultsHTML = '';
                
                if (created > 0) {
                    // Importación parcial - algunas invitaciones creadas pero con errores
                    // NO mostrar toast aquí, dejar que el usuario vea los detalles en el modal
                    
                    if (csvResultsEl) {
                        csvResultsEl.classList.add('success');
                        csvResultsEl.classList.remove('error');
                    }
                    resultsHTML += `<h5 class="result-header"><span class="material-symbols-outlined result-icon">check_circle</span> Carga completada</h5>`;
                    resultsHTML += `<div class="result-details">`;
                    resultsHTML += `<p>${created} invitaciones creadas exitosamente</p>`;
                } else {
                    // No se creó ninguna invitación
                    // NO mostrar toast aquí, dejar que el usuario vea los errores en el modal
                    
                    if (csvResultsEl) {
                        csvResultsEl.classList.add('error');
                        csvResultsEl.classList.remove('success');
                    }
                    resultsHTML += `<h5 class="result-header"><span class="material-symbols-outlined result-icon">error</span> Error en la carga</h5>`;
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
                
                if (csvResultsEl) {
                    csvResultsEl.innerHTML = resultsHTML;
                }
                
                // Si hubo algunos éxitos, también recargar los datos
                if (created > 0) {
                    loadInvitations();
                    loadDashboardData();
                    
                    // Actualizar estadísticas de la sección de invitaciones si está activa
                    const invitationsSection = document.getElementById('invitations');
                    if (invitationsSection && invitationsSection.classList.contains('active')) {
                        loadInvitationsSectionData();
                    }
                }
            }
            
        } catch (error) {
            const csvResultsEl = document.getElementById('csvResults');
            if (csvResultsEl) {
                csvResultsEl.classList.add('show', 'error');
                csvResultsEl.innerHTML = `
                    <h5 class="result-header"><span class="material-symbols-outlined result-icon">warning</span> Error al procesar</h5>
                    <div class="result-details">
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    };
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
                
                // Remove invitationType handling - now handled by individual guest types
                
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
                adultPasses: 2,
                childPasses: 2
            },
            {
                code: 'def456',
                guestNames: ['Juan García'],
                email: 'juan.g@email.com',
                numberOfPasses: 1,
                confirmed: false,
                confirmedPasses: 0,
                adultPasses: 1,
                childPasses: 0
            },
            {
                code: 'ghi789',
                guestNames: ['María Rodriguez'],
                email: 'mrodriguez@email.com',
                numberOfPasses: 2,
                confirmed: true,
                confirmedPasses: 2,
                adultPasses: 2,
                childPasses: 0
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
                adultPasses: 1,
                childPasses: 0
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
                <h4><i class="fas fa-filter"></i> Filtrar por estado</h4>
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
                    <span>Cancelados</span>
                </label>
                <label class="filter-option">
                    <input type="checkbox" id="filterInactive"> 
                    <span>Inactivos</span>
                </label>
                <div class="filter-actions">
                    <button class="btn btn-sm btn-secondary" onclick="resetFilters()">Restablecer</button>
                    <button class="btn btn-sm btn-primary" onclick="applyFilters()">Aplicar</button>
                </div>
            </div>
        `;
        
        // Position it relative to the search wrapper
        const searchWrapper = document.querySelector('.search-wrapper');
        if (searchWrapper) {
            searchWrapper.appendChild(filterDropdown);
        }
    }
    
    // Toggle dropdown visibility with animation
    const isShowing = filterDropdown.classList.contains('show');
    
    if (!isShowing) {
        // Show dropdown
        filterDropdown.classList.add('show');
        
        // Animate filter options
        const filterOptions = filterDropdown.querySelectorAll('.filter-option');
        filterOptions.forEach((option, index) => {
            option.style.animation = 'none';
            setTimeout(() => {
                option.style.animation = '';
            }, 10);
        });
    } else {
        // Hide dropdown
        filterDropdown.classList.remove('show');
    }
    
    // Close dropdown when clicking outside
    if (!isShowing) {
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!e.target.closest('.filter-dropdown') && !e.target.closest('.btn-icon[title="Filtros"]')) {
                    filterDropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 100);
    }
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
    const filterInactive = document.getElementById('filterInactive').checked;
    
    // Filter invitations based on selected filters
    const filteredInvitations = allInvitations.filter(invitation => {
        // Check if invitation is inactive first
        if (invitation.status === 'inactive') {
            return filterInactive;
        }
        
        // Check status filters for active invitations
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
        
        return statusMatch;
    });
    
    // Apply search term if any
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const finalFiltered = searchTerm ? filteredInvitations.filter(invitation => {
        return invitation.code.toLowerCase().includes(searchTerm) ||
               invitation.guestNames.some(name => name.toLowerCase().includes(searchTerm)) ||
               (invitation.phone && invitation.phone.includes(searchTerm));
    }) : filteredInvitations;
    
    // Get current items per page value
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    const itemsPerPage = itemsPerPageSelect ? parseInt(itemsPerPageSelect.value) : 20;
    
    // Display filtered results with current items per page
    displayInvitations(finalFiltered, 1, itemsPerPage);
    
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

// Initialize Create Form in Modal (for dynamic initialization)
function initCreateFormInModal() {
    const form = document.getElementById('createInvitationForm');
    if (!form) {
        console.error('Create invitation form not found');
        return;
    }
    
    // Get form elements
    const numberOfPassesInput = document.getElementById('numberOfPasses');
    const guestFields = document.getElementById('guestFields');
    
    // Store current guest data for preservation
    let currentGuestData = [];
    
    // Function to save current guest data
    function saveCurrentGuestData() {
        currentGuestData = [];
        const guestNameInputs = guestFields.querySelectorAll('.guest-name-input');
        const guestTypeSelects = guestFields.querySelectorAll('.guest-type-select');
        
        guestNameInputs.forEach((input, index) => {
            currentGuestData.push({
                name: input.value,
                type: guestTypeSelects[index]?.value || 'adult'
            });
        });
    }
    
    // Function to generate guest fields based on number of passes
    function generateGuestFields(preserveData = true) {
        const numberOfPasses = parseInt(numberOfPassesInput.value) || 1;
        
        // Save current data before clearing if preserveData is true
        if (preserveData && guestFields.children.length > 0) {
            saveCurrentGuestData();
        }
        
        // Clear existing fields
        guestFields.innerHTML = '';
        
        // Generate fields for each pass
        for (let i = 0; i < numberOfPasses; i++) {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'guest-field-row';
            
            // Get preserved data if available
            const preservedName = preserveData && currentGuestData[i] ? currentGuestData[i].name : '';
            const preservedType = preserveData && currentGuestData[i] ? currentGuestData[i].type : 'adult';
            
            // Check if children are allowed
            const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false;
            
            fieldDiv.innerHTML = `
                <div class="guest-name-field">
                    <input type="text" 
                           name="guestName_${i}" 
                           class="guest-name-input" 
                           placeholder="Nombre del invitado" 
                           value="${preservedName}"
                           required>
                </div>
                <div class="guest-type-field">
                    <select name="guestType_${i}" class="guest-type-select" required>
                        <option value="adult" ${preservedType === 'adult' ? 'selected' : ''}>Adulto</option>
                        ${allowChildren ? `<option value="child" ${preservedType === 'child' ? 'selected' : ''}>Niño</option>` : ''}
                        <option value="staff" ${preservedType === 'staff' ? 'selected' : ''}>Staff/Proveedor</option>
                    </select>
                </div>
            `;
            guestFields.appendChild(fieldDiv);
        }
    }
    
    // Update fields when number of passes changes
    numberOfPassesInput.addEventListener('input', () => generateGuestFields(true));
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const numberOfPasses = parseInt(formData.get('numberOfPasses')) || 1;
        
        // First, check if we have capacity for this invitation
        try {
            // Get current stats to check available capacity
            const statsResult = await adminAPI.fetchStats();
            if (APIHelpers.isSuccess(statsResult)) {
                const stats = statsResult.stats;
                const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 130;
                
                // Calculate total passes already assigned (including pending)
                const totalAssignedPasses = stats.totalPasses || 0;
                const availablePasses = targetTotal - totalAssignedPasses;
                
                // Check if the new invitation would exceed the limit
                if (numberOfPasses > availablePasses) {
                    if (availablePasses <= 0) {
                        showToast('No hay pases disponibles. Se ha alcanzado el límite de invitados.', 'error');
                    } else {
                        showToast(`Solo quedan ${availablePasses} pases disponibles. No se pueden asignar ${numberOfPasses} pases.`, 'error');
                    }
                    return; // Stop form submission
                }
            }
        } catch (error) {
            console.error('Error checking capacity:', error);
            // Continue with creation if we can't check capacity
        }
        
        // Collect guest data
        const guests = [];
        let adultPasses = 0;
        let childPasses = 0;
        let staffPasses = 0;
        
        for (let i = 0; i < numberOfPasses; i++) {
            const name = formData.get(`guestName_${i}`);
            const type = formData.get(`guestType_${i}`);
            
            if (name && type) {
                guests.push({
                    name: name.trim(),
                    type: type
                });
                
                // Count passes by type
                if (type === 'adult') {
                    adultPasses++;
                } else if (type === 'child') {
                    childPasses++;
                } else if (type === 'staff') {
                    staffPasses++;
                }
            }
        }
        
        // Extract guest names for the invitation
        const guestNames = guests.map(g => g.name);
        
        const invitationData = {
            guestNames: guestNames,
            numberOfPasses: numberOfPasses,
            phone: formData.get('phone'),
            adultPasses: adultPasses,
            childPasses: childPasses,
            staffPasses: staffPasses,
            tableNumber: formData.get('tableNumber') ? parseInt(formData.get('tableNumber')) : null,
            // Include detailed guest information
            guests: guests
        };
        
        try {
            console.log('Enviando invitación:', invitationData);
            const result = await adminAPI.createInvitation(invitationData);
            console.log('Respuesta del servidor:', result);
            
            if (APIHelpers.isSuccess(result)) {
                showToast('Invitación creada exitosamente', 'success');
                form.reset();
                // Reset to default values
                numberOfPassesInput.value = '1';
                currentGuestData = []; // Clear preserved data
                generateGuestFields(false); // Don't preserve data on reset
                
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
    
    // Initialize with one guest field
    generateGuestFields(false); // Don't preserve data on initial load
}

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
window.editInvitation = editInvitation;
window.cancelEditInvitation = cancelEditInvitation;
window.deactivateInvitation = deactivateInvitation;
window.activateInvitation = activateInvitation;
window.toggleFilters = toggleFilters;
window.resetFilters = resetFilters;
window.applyFilters = applyFilters;
window.exportInvitationLinks = exportInvitationLinks;
window.closeAllInvitationsModal = closeAllInvitationsModal;
