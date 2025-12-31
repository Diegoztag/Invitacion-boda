// Load configuration from config.js
const CONFIG = {
    backendUrl: WEDDING_CONFIG.api.backendUrl
};

// Global variables
let allInvitations = [];
let confirmationChart = null;

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
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
    initModal();
    initSearch();
    initCsvUpload();
    
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
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu when clicking overlay
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Close menu when clicking a nav item on mobile
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
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
                document.body.style.overflow = '';
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
        const response = await fetch(`${CONFIG.backendUrl}/stats`);
        if (response.ok) {
            const data = await response.json();
            const stats = data.stats;
            
            // Update stats cards
            document.getElementById('totalInvitations').textContent = stats.totalInvitations;
            document.getElementById('confirmedPasses').textContent = stats.confirmedPasses;
            document.getElementById('pendingInvitations').textContent = stats.pendingInvitations;
            document.getElementById('cancelledPasses').textContent = stats.cancelledPasses || 0;
            
            // Calculate and update invitation percentage
            const targetInvitations = WEDDING_CONFIG.guests?.targetInvitations || 150;
            const invitationPercentage = Math.round((stats.totalInvitations / targetInvitations) * 100);
            const invitationBadge = document.querySelector('.stat-card:first-child .stat-badge');
            if (invitationBadge) {
                invitationBadge.textContent = `${invitationPercentage}%`;
                invitationBadge.title = `${stats.totalInvitations} de ${targetInvitations} invitaciones enviadas`;
                invitationBadge.classList.remove('primary', 'success', 'warning');
                if (invitationPercentage >= 100) {
                    invitationBadge.classList.add('success');
                } else if (invitationPercentage >= 75) {
                    invitationBadge.classList.add('primary');
                } else {
                    invitationBadge.classList.add('warning');
                }
            }
            
            // Update target invitations display
            const targetElement = document.getElementById('targetInvitations');
            if (targetElement) {
                targetElement.textContent = targetInvitations;
            }
            
            // Update target guests display
            const targetGuestsElement = document.getElementById('targetGuests');
            if (targetGuestsElement) {
                targetGuestsElement.textContent = WEDDING_CONFIG.guests?.targetTotal || 250;
            }
            
            // Update confirmed change indicator
            const confirmedChange = document.getElementById('confirmedChange');
            if (confirmedChange) {
                // Calculate recent confirmations (last 7 days)
                const recentConfirmations = await calculateRecentConfirmations();
                if (recentConfirmations > 0) {
                    confirmedChange.innerHTML = `<i class="fas fa-arrow-up trend-icon"></i> +${recentConfirmations}`;
                    confirmedChange.classList.remove('warning', 'danger');
                    confirmedChange.classList.add('success');
                } else {
                    confirmedChange.innerHTML = `<i class="fas fa-minus trend-icon"></i> 0`;
                    confirmedChange.classList.remove('success', 'danger');
                    confirmedChange.classList.add('warning');
                }
            }
            
            // Update welcome subtext
            const welcomeSubtext = document.getElementById('welcomeSubtext');
            if (welcomeSubtext) {
                const recentConfirmations = 12; // This would come from actual data
                welcomeSubtext.textContent = `Aquí tienes el resumen de tu boda. Hoy recibiste ${recentConfirmations} confirmaciones nuevas.`;
            }
            
            // Update pass distribution
            updatePassDistribution(stats);
            
            // Update chart
            updateConfirmationChart(stats);
            
            // Load recent confirmations
            loadRecentConfirmations();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show demo data
        const demoStats = {
            totalInvitations: 150,
            totalPasses: 220,
            confirmedPasses: 85,
            pendingInvitations: 45,
            cancelledPasses: 20,
            pendingPasses: 115
        };
        
        document.getElementById('totalInvitations').textContent = demoStats.totalInvitations;
        document.getElementById('confirmedPasses').textContent = demoStats.confirmedPasses;
        document.getElementById('pendingInvitations').textContent = demoStats.pendingInvitations;
        document.getElementById('cancelledPasses').textContent = demoStats.cancelledPasses;
        
        // Calculate and update invitation percentage for demo
        const targetInvitations = WEDDING_CONFIG.guests?.targetInvitations || 150;
        const invitationPercentage = Math.round((demoStats.totalInvitations / targetInvitations) * 100);
        const invitationBadge = document.querySelector('.stat-card:first-child .stat-badge');
        if (invitationBadge) {
            invitationBadge.textContent = `${invitationPercentage}%`;
            invitationBadge.title = `${demoStats.totalInvitations} de ${targetInvitations} invitaciones enviadas`;
            invitationBadge.classList.remove('primary', 'success', 'warning');
            if (invitationPercentage >= 100) {
                invitationBadge.classList.add('success');
            } else if (invitationPercentage >= 75) {
                invitationBadge.classList.add('primary');
            } else {
                invitationBadge.classList.add('warning');
            }
        }
        
        // Update target invitations display
        const targetElement = document.getElementById('targetInvitations');
        if (targetElement) {
            targetElement.textContent = targetInvitations;
        }
        
        // Update target guests display for demo
        const targetGuestsElement = document.getElementById('targetGuests');
        if (targetGuestsElement) {
            targetGuestsElement.textContent = WEDDING_CONFIG.guests?.targetTotal || 250;
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
    document.getElementById('adultProgress').style.width = `${adultPercent}%`;
    
    // Update child passes
    const childPassesElement = document.getElementById('childPasses');
    const childProgressElement = document.getElementById('childProgress');
    const childProgressItem = childPassesElement.closest('.progress-item');
    
    if (!allowChildren) {
        // Disable children section
        childPassesElement.textContent = 'No permitidos';
        childProgressElement.style.width = '0%';
        childProgressItem.style.opacity = '0.5';
        childProgressItem.style.filter = 'grayscale(100%)';
        childProgressItem.querySelector('.progress-label').textContent = 'Niños (No permitidos)';
    } else {
        // Enable children section
        childPassesElement.textContent = `${childPasses} (${childPercent}%)`;
        childProgressElement.style.width = `${childPercent}%`;
        childProgressItem.style.opacity = '1';
        childProgressItem.style.filter = 'none';
        childProgressItem.querySelector('.progress-label').textContent = 'Niños';
    }
    
    // Update staff passes
    document.getElementById('staffPasses').textContent = `${staffPasses} (${staffPercent}%)`;
    document.getElementById('staffProgress').style.width = `${staffPercent}%`;
    
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
        const response = await fetch(`${CONFIG.backendUrl}/invitations`);
        if (response.ok) {
            const data = await response.json();
            const invitations = data.invitations || [];
            
            // Filter confirmed invitations and sort by confirmation date
            const confirmedInvitations = invitations
                .filter(inv => inv.confirmed)
                .sort((a, b) => new Date(b.confirmationDate) - new Date(a.confirmationDate))
                .slice(0, 5); // Show only the 5 most recent
            
            displayRecentConfirmations(confirmedInvitations);
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
                guestNames: ['Carlos Méndez'],
                confirmationDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
                confirmedPasses: 2,
                confirmationDetails: {
                    willAttend: true,
                    message: '¡Felicidades! Ahí estaremos sin falta.'
                }
            },
            {
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
        const initials = invitation.guestNames[0].split(' ').map(n => n[0]).join('').toUpperCase();
        const timeAgo = getTimeAgo(new Date(invitation.confirmationDate));
        
        // Alternate between different gradient styles
        const gradientClasses = ['gradient-purple', 'gradient-blue', 'gradient-primary'];
        const gradientClass = gradientClasses[index % gradientClasses.length];
        
        // Format guest names - display each name on a separate line
        const guestNamesFormatted = invitation.guestNames
            .map(name => `<div>${name}</div>`)
            .map(name => name.trim())
            .filter(name => name)
            .map(name => `<div>${name}</div>`)
            .join('');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="guest-cell">
                    <div class="guest-avatar ${gradientClass}">${initials}</div>
                    <div class="guest-info">
                        <div class="guest-name" style="line-height: 1.4;">${guestNamesFormatted}</div>
                        <span class="guest-time">${timeAgo}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${invitation.confirmationDetails?.willAttend ? 'confirmed' : 'rejected'}">
                    ${invitation.confirmationDetails?.willAttend ? 'Confirmado' : 'Rechazado'}
                </span>
            </td>
            <td>
                <span class="passes-count">${invitation.confirmedPasses || 0}</span>
                <span class="passes-type">${invitation.confirmedPasses === 1 ? 'Adulto' : 'Adultos'}</span>
            </td>
            <td>
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; font-weight: 600; color: var(--primary);">${Math.floor(Math.random() * 10) + 1}</div>
                </div>
            </td>
            <td class="message-column" style="max-width: 200px;">
                <span style="font-style: italic; color: var(--text-muted); font-size: 0.875rem;">
                    ${invitation.confirmationDetails?.message ? `"${invitation.confirmationDetails.message}"` : '-'}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="btn-icon" onclick="viewInvitation('${invitation.code}')">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
        return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (hours < 24) {
        return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (days === 1) {
        return 'ayer';
    } else {
        return `hace ${days} días`;
    }
}

// Calculate recent confirmations (last 7 days)
async function calculateRecentConfirmations() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/invitations`);
        if (response.ok) {
            const data = await response.json();
            const invitations = data.invitations || [];
            
            // Get date 7 days ago
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            // Count confirmations in the last 7 days
            const recentConfirmations = invitations.filter(inv => {
                if (inv.confirmed && inv.confirmationDate) {
                    const confirmDate = new Date(inv.confirmationDate);
                    return confirmDate >= sevenDaysAgo;
                }
                return false;
            });
            
            // Sum up the confirmed passes from recent confirmations
            const totalRecentPasses = recentConfirmations.reduce((sum, inv) => {
                return sum + (inv.confirmedPasses || 0);
            }, 0);
            
            return totalRecentPasses;
        }
    } catch (error) {
        console.error('Error calculating recent confirmations:', error);
    }
    return 0;
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
        const response = await fetch(`${CONFIG.backendUrl}/invitations`);
        if (response.ok) {
            const data = await response.json();
            allInvitations = data.invitations || [];
            displayInvitations(allInvitations);
        }
    } catch (error) {
        console.error('Error loading invitations:', error);
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
        // Calculate cancelled passes for this invitation
        let cancelledPasses = 0;
        if (invitation.confirmed && invitation.confirmationDetails) {
            if (!invitation.confirmationDetails.willAttend) {
                // If they're not attending, all passes are cancelled
                cancelledPasses = invitation.numberOfPasses;
            } else if (invitation.confirmationDetails.willAttend && invitation.confirmedPasses < invitation.numberOfPasses) {
                // If they're attending but not using all passes, calculate the difference
                cancelledPasses = invitation.numberOfPasses - invitation.confirmedPasses;
            }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="code-cell">${invitation.code}</td>
            <td>${invitation.guestNames.join(' y ')}</td>
            <td>${invitation.numberOfPasses}</td>
            <td>
                <span class="status-badge ${invitation.confirmed ? 'confirmed' : 'pending'}">
                    ${invitation.confirmed ? 'Confirmado' : 'Pendiente'}
                </span>
            </td>
            <td>${invitation.confirmedPasses || 0}</td>
            <td>${cancelledPasses > 0 ? `<span style="color: #f44336; font-weight: 600;">${cancelledPasses}</span>` : '0'}</td>
            <td>
                <button class="btn-icon" onclick="viewInvitation('${invitation.code}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="copyInvitationLink('${invitation.code}')" title="Copiar enlace">
                    <i class="fas fa-link"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View Invitation Details
function viewInvitation(code) {
    const invitation = allInvitations.find(inv => inv.code === code);
    if (!invitation) return;
    
    const modal = document.getElementById('invitationModal');
    const details = document.getElementById('invitationDetails');
    
    const invitationUrl = `${window.location.origin}/invitacion?invitation=${code}`;
    
    // Determine invitation status
    let status = 'pending';
    let statusText = 'Pendiente';
    let statusColor = '#ff9800';
    let statusIcon = 'clock';
    
    if (invitation.confirmed && invitation.confirmationDetails) {
        if (!invitation.confirmationDetails.willAttend) {
            status = 'rejected';
            statusText = 'Rechazado';
            statusColor = '#f44336';
            statusIcon = 'times-circle';
        } else if (invitation.confirmedPasses < invitation.numberOfPasses) {
            status = 'partial';
            statusText = 'Parcial';
            statusColor = '#ff6b6b';
            statusIcon = 'exclamation-circle';
        } else {
            status = 'accepted';
            statusText = 'Aceptado';
            statusColor = '#4caf50';
            statusIcon = 'check-circle';
        }
    }
    
    // Calculate cancelled passes
    let cancelledPasses = 0;
    if (invitation.confirmed && invitation.confirmationDetails) {
        if (!invitation.confirmationDetails.willAttend) {
            cancelledPasses = invitation.numberOfPasses;
        } else if (invitation.confirmationDetails.willAttend && invitation.confirmedPasses < invitation.numberOfPasses) {
            cancelledPasses = invitation.numberOfPasses - invitation.confirmedPasses;
        }
    }
    
    details.innerHTML = `
        <div class="invitation-detail">
            <!-- Status Header -->
            <div class="status-header">
                <div class="status-badge-large" style="background: ${statusColor};">
                    <i class="fas fa-${statusIcon}"></i> ${statusText}
                </div>
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
                                <div class="stat-mini-value" style="color: var(--success);">${invitation.confirmedPasses}</div>
                                <div class="stat-mini-label">Confirmados</div>
                            </div>
                            ${cancelledPasses > 0 ? `
                                <div class="stat-mini">
                                    <div class="stat-mini-value" style="color: var(--danger);">${cancelledPasses}</div>
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
    
    modal.style.display = 'block';
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
        messageDiv.style.cssText = 'background: #f8f9fa; color: #495057; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 14px; border-left: 4px solid #e9ecef;';
        messageDiv.innerHTML = '<i class="fas fa-heart" style="color: #e619a1;"></i> <strong>Celebración íntima:</strong> Hemos decidido que nuestra boda sea una celebración entre adultos para poder compartir este momento especial de una manera más íntima con ustedes.';
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
                childPassesGroup.style.display = 'block';
                
                if (!allowChildren) {
                    // If children not allowed, disable the input
                    childPassesInput.value = '0';
                    childPassesInput.disabled = true;
                    childPassesInput.style.opacity = '0.5';
                    childPassesInput.style.cursor = 'not-allowed';
                    childPassesGroup.querySelector('label').innerHTML = 'Niños <small style="color: var(--text-muted);">(no permitidos)</small>';
                } else {
                    // Enable if children are allowed
                    childPassesInput.disabled = false;
                    childPassesInput.style.opacity = '1';
                    childPassesInput.style.cursor = 'auto';
                    childPassesGroup.querySelector('label').textContent = 'Niños';
                }
            } else {
                // Hide child passes input
                childPassesGroup.style.display = 'none';
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
            const response = await fetch(`${CONFIG.backendUrl}/invitation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invitationData)
            });
            
            if (response.ok) {
                const data = await response.json();
                showNotification('Invitación creada exitosamente');
                form.reset();
                // Reset to default values
                adultPassesInput.value = '2';
                childPassesInput.value = '0';
                childPassesGroup.style.display = 'none';
                updateTotalPasses();
                
                // Show invitation details
                const invitationUrl = data.invitationUrl;
                alert(`Invitación creada!\n\nCódigo: ${data.invitation.code}\nEnlace: ${invitationUrl}`);
                
                // Navigate to invitations list
                document.querySelector('a[href="#invitations"]').click();
            } else {
                throw new Error('Error al crear invitación');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al crear la invitación', 'error');
        }
    });
}


// Export all invitations to CSV
function exportAllInvitations() {
    // Create CSV with all invitation data including confirmations
    const headers = ['Código', 'Invitados', 'Pases', 'Estado', 'Confirmados', 'Cancelados', 'Asistirá', 'Teléfono', 'Restricciones', 'Mensaje', 'Fecha Confirmación'];
    const rows = [];
    
    allInvitations.forEach(invitation => {
        const details = invitation.confirmationDetails || {};
        let cancelledPasses = 0;
        
        if (invitation.confirmed && details) {
            if (!details.willAttend) {
                cancelledPasses = invitation.numberOfPasses;
            } else if (details.willAttend && invitation.confirmedPasses < invitation.numberOfPasses) {
                cancelledPasses = invitation.numberOfPasses - invitation.confirmedPasses;
            }
        }
        
        const row = [
            invitation.code,
            invitation.guestNames.join(' y '),
            invitation.numberOfPasses,
            invitation.confirmed ? 'Confirmado' : 'Pendiente',
            invitation.confirmedPasses || 0,
            cancelledPasses,
            details.willAttend !== undefined ? (details.willAttend ? 'Sí' : 'No') : '-',
            details.phone || invitation.phone || '-',
            details.dietaryRestrictions || '-',
            details.message || '-',
            invitation.confirmationDate ? new Date(invitation.confirmationDate).toLocaleDateString('es-MX') : '-'
        ];
        
        rows.push(row);
    });
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invitaciones_completas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Archivo CSV exportado exitosamente');
}

// Initialize Modal
function initModal() {
    const modal = document.getElementById('invitationModal');
    const closeBtn = modal.querySelector('.modal-close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
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
    const modal = document.getElementById('createInvitationModal');
    modal.style.display = 'block';
}

function closeCreateModal() {
    const modal = document.getElementById('createInvitationModal');
    modal.style.display = 'none';
    // Reset form
    document.getElementById('createInvitationForm').reset();
    document.getElementById('adultPassesInput').value = '2';
    document.getElementById('childPassesInput').value = '0';
    document.getElementById('childPassesGroup').style.display = 'none';
    document.getElementById('totalPassesValue').textContent = '2';
}

function showImportModal() {
    const modal = document.getElementById('importCsvModal');
    modal.style.display = 'block';
}

function closeImportModal() {
    const modal = document.getElementById('importCsvModal');
    modal.style.display = 'none';
    // Reset file input
    document.getElementById('csvFile').value = '';
    document.getElementById('fileName').textContent = '';
    document.getElementById('uploadCsvBtn').style.display = 'none';
    document.getElementById('csvResults').innerHTML = '';
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
    
    let selectedFile = null;
    
    csvFile.addEventListener('change', (e) => {
        selectedFile = e.target.files[0];
        if (selectedFile) {
            fileName.textContent = selectedFile.name;
            uploadBtn.style.display = 'inline-block';
        } else {
            fileName.textContent = '';
            uploadBtn.style.display = 'none';
        }
    });
    
    uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        csvResults.innerHTML = '<p>Procesando archivo...</p>';
        
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
            
            for (const invitation of invitations) {
                try {
                    const response = await fetch(`${CONFIG.backendUrl}/invitation`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(invitation)
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        created++;
                        createdInvitations.push({
                            ...data.invitation,
                            url: data.invitationUrl
                        });
                    } else {
                        const error = await response.json();
                        errors.push(`${invitation.guestNames.join(' y ')}: ${error.error}`);
                    }
                } catch (error) {
                    errors.push(`${invitation.guestNames.join(' y ')}: Error de conexión`);
                }
            }
            
            // Show results
            let resultsHTML = `<h4>Resultados de la carga:</h4>`;
            resultsHTML += `<p class="success">✅ ${created} invitaciones creadas exitosamente</p>`;
            
            if (errors.length > 0) {
                resultsHTML += `<p class="error">❌ ${errors.length} errores:</p>`;
                resultsHTML += '<ul>';
                errors.forEach(error => {
                    resultsHTML += `<li>${error}</li>`;
                });
                resultsHTML += '</ul>';
            }
            
            if (createdInvitations.length > 0) {
                resultsHTML += '<h4>Enlaces generados:</h4>';
                resultsHTML += '<div class="csv-links">';
                createdInvitations.forEach(inv => {
                    resultsHTML += `
                        <div class="csv-link-item">
                            <strong>${inv.guestNames.join(' y ')}</strong><br>
                            <input type="text" value="${inv.url}" readonly style="width: 100%; margin: 5px 0;">
                            <button class="btn btn-sm" onclick="copyToClipboard('${inv.url}')">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    `;
                });
                resultsHTML += '</div>';
                
                // Add export button
                resultsHTML += `
                    <button class="btn btn-secondary" onclick="exportInvitationLinks()" style="margin-top: 20px;">
                        <i class="fas fa-download"></i> Descargar todos los enlaces
                    </button>
                `;
                
                // Store for export
                window.createdInvitations = createdInvitations;
            }
            
            csvResults.innerHTML = resultsHTML;
            
            // Reset form
            csvFile.value = '';
            fileName.textContent = '';
            uploadBtn.style.display = 'none';
            selectedFile = null;
            
            // Reload invitations list
            loadInvitations();
            loadDashboardData();
            
        } catch (error) {
            csvResults.innerHTML = `<p class="error">Error al procesar el archivo: ${error.message}</p>`;
        }
    });
}

// Parse CSV content
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const invitations = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles basic cases)
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length >= 2) {
            const names = parts[0].split(/\s+y\s+/i).map(n => n.trim());
            const passes = parseInt(parts[1]);
            
            if (names.length > 0 && !isNaN(passes) && passes > 0) {
                invitations.push({
                    guestNames: names,
                    numberOfPasses: passes,
                    phone: parts[2] || ''
                });
            }
        }
    }
    
    return invitations;
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
        const response = await fetch(`${CONFIG.backendUrl}/stats`);
        if (response.ok) {
            const data = await response.json();
            const stats = data.stats;
            
            // Update stats cards in create section
            document.getElementById('totalInvitationsCreate').textContent = stats.totalInvitations;
            document.getElementById('confirmedPassesCreate').textContent = stats.confirmedPasses;
            document.getElementById('pendingInvitationsCreate').textContent = stats.pendingInvitations;
            document.getElementById('cancelledPassesCreate').textContent = stats.cancelledPasses || 0;
        }
    } catch (error) {
        console.error('Error loading create section data:', error);
        // Show demo data
        document.getElementById('totalInvitationsCreate').textContent = '150';
        document.getElementById('confirmedPassesCreate').textContent = '85';
        document.getElementById('pendingInvitationsCreate').textContent = '45';
        document.getElementById('cancelledPassesCreate').textContent = '20';
    }
    
    // Load invitations for the modern table
    loadCreateSectionInvitations();
    
    // Initialize search for create section
    initCreateSectionSearch();
}

// Load invitations for create section
async function loadCreateSectionInvitations() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/invitations`);
        if (response.ok) {
            const data = await response.json();
            allInvitations = data.invitations || [];
            displayCreateSectionInvitations(allInvitations);
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
    
    // Calculate pagination
    const totalItems = invitations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedInvitations = invitations.slice(startIndex, endIndex);
    
    // Update pagination info
    document.getElementById('showingFromCreate').textContent = totalItems > 0 ? startIndex + 1 : 0;
    document.getElementById('showingToCreate').textContent = endIndex;
    document.getElementById('totalCountCreate').textContent = totalItems;
    
    // Generate avatar gradients
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    
    paginatedInvitations.forEach((invitation, index) => {
        const initials = invitation.guestNames[0].split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const gradient = gradients[index % gradients.length];
        
        // Determine status
        let statusBadge = '';
        if (invitation.confirmed) {
            if (invitation.confirmationDetails?.willAttend === false) {
                statusBadge = '<span class="status-badge rejected"><span style="display: inline-block; width: 6px; height: 6px; background: currentColor; border-radius: 50%; margin-right: 6px;"></span>Rechazado</span>';
            } else {
                statusBadge = '<span class="status-badge confirmed"><span style="display: inline-block; width: 6px; height: 6px; background: currentColor; border-radius: 50%; margin-right: 6px;"></span>Confirmado</span>';
            }
        } else {
            statusBadge = '<span class="status-badge pending"><span style="display: inline-block; width: 6px; height: 6px; background: currentColor; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite;"></span>Pendiente</span>';
        }
        
        // Determine pass type text
        let passTypeText = 'adultos';
        if (invitation.invitationType === 'family') {
            passTypeText = 'familia';
        } else if (invitation.invitationType === 'staff') {
            passTypeText = 'staff';
        } else if (invitation.numberOfPasses === 1) {
            passTypeText = 'adulto';
        }
        
        // Assign table number (could be stored in invitation data or calculated)
        const tableNumber = invitation.tableNumber || Math.floor(Math.random() * 10) + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="guest-cell">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${gradient}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px;">
                        ${initials}
                    </div>
                    <div class="guest-info">
                        <span class="guest-name">${invitation.guestNames.join(' y ')}</span>
                        <span class="guest-time" style="color: var(--text-muted); font-size: 0.75rem;">
                            ${invitation.confirmed && invitation.confirmationDate ? getTimeAgo(new Date(invitation.confirmationDate)) : 'Sin confirmar'}
                        </span>
                    </div>
                </div>
            </td>
            <td>
                ${statusBadge}
            </td>
            <td class="text-center">
                <span style="font-weight: 700;">${invitation.numberOfPasses}</span>
                <span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 4px;">${passTypeText}</span>
            </td>
            <td>
                <span style="font-weight: 600; color: var(--text-primary);">Mesa ${tableNumber}</span>
            </td>
            <td class="text-right">
                <div style="display: flex; justify-content: flex-end; gap: 4px;">
                    <button class="btn-icon" onclick="viewInvitation('${invitation.code}')" title="Ver detalles">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update pagination controls
    updateCreateSectionPagination(page, totalPages);
}

// Update pagination controls for create section
function updateCreateSectionPagination(currentPage, totalPages) {
    const prevBtn = document.getElementById('prevPageCreate');
    const nextBtn = document.getElementById('nextPageCreate');
    const numbersContainer = document.getElementById('paginationNumbersCreate');
    
    // Update prev/next buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Update page numbers
    numbersContainer.innerHTML = '';
    
    // Show max 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'pagination-number';
        btn.textContent = i;
        if (i === currentPage) {
            btn.classList.add('active');
        }
        btn.onclick = () => {
            displayCreateSectionInvitations(allInvitations, i);
        };
        numbersContainer.appendChild(btn);
    }
    
    // Add ellipsis if needed
    if (endPage < totalPages) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.padding = '8px';
        ellipsis.style.color = 'var(--text-muted)';
        numbersContainer.appendChild(ellipsis);
    }
    
    // Set up prev/next button handlers
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            displayCreateSectionInvitations(allInvitations, currentPage - 1);
        }
    };
    
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            displayCreateSectionInvitations(allInvitations, currentPage + 1);
        }
    };
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

// Edit invitation (placeholder)
function editInvitation(code) {
    // TODO: Implement edit functionality
    showNotification('Función de edición en desarrollo');
}

// Delete invitation (placeholder)
function deleteInvitation(code) {
    if (confirm('¿Estás seguro de que deseas eliminar esta invitación?')) {
        // TODO: Implement delete functionality
        showNotification('Función de eliminación en desarrollo');
    }
}

// Update modal close handlers
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

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
                <hr style="margin: 12px 0; border-color: var(--border-color);">
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
                <div style="margin-top: 16px; display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-secondary" onclick="resetFilters()">Restablecer</button>
                    <button class="btn btn-sm btn-primary" onclick="applyFilters()">Aplicar</button>
                </div>
            </div>
        `;
        
        // Position it relative to the filter button
        const filterBtn = document.querySelector('.btn-icon[title="Filtros"]');
        const actionsBar = filterBtn.closest('.actions-bar');
        actionsBar.style.position = 'relative';
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
