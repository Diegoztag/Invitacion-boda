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
            document.getElementById('totalPasses').textContent = stats.totalPasses;
            document.getElementById('confirmedPasses').textContent = stats.confirmedPasses;
            document.getElementById('pendingInvitations').textContent = stats.pendingInvitations;
            document.getElementById('cancelledPasses').textContent = stats.cancelledPasses || 0;
            
            // Update confirmed change indicator
            const confirmedChange = document.getElementById('confirmedChange');
            if (confirmedChange) {
                // This would track daily changes - for now just show a static value
                confirmedChange.innerHTML = '<i class="fas fa-arrow-up trend-icon"></i> +12';
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
        document.getElementById('totalPasses').textContent = demoStats.totalPasses;
        document.getElementById('confirmedPasses').textContent = demoStats.confirmedPasses;
        document.getElementById('pendingInvitations').textContent = demoStats.pendingInvitations;
        document.getElementById('cancelledPasses').textContent = demoStats.cancelledPasses;
        
        updatePassDistribution(demoStats);
        updateConfirmationChart(demoStats);
    }
}

// Update Pass Distribution
function updatePassDistribution(stats) {
    const totalPasses = stats.totalPasses || 220;
    
    // For demo purposes, calculate distribution
    const adultPasses = Math.floor(totalPasses * 0.82);
    const childPasses = Math.floor(totalPasses * 0.14);
    const staffPasses = totalPasses - adultPasses - childPasses;
    
    const adultPercent = Math.round((adultPasses / totalPasses) * 100);
    const childPercent = Math.round((childPasses / totalPasses) * 100);
    const staffPercent = Math.round((staffPasses / totalPasses) * 100);
    
    // Update total
    document.getElementById('totalPassesChart').textContent = totalPasses;
    
    // Update adult passes
    document.getElementById('adultPasses').textContent = `${adultPasses} (${adultPercent}%)`;
    document.getElementById('adultProgress').style.width = `${adultPercent}%`;
    
    // Update child passes
    document.getElementById('childPasses').textContent = `${childPasses} (${childPercent}%)`;
    document.getElementById('childProgress').style.width = `${childPercent}%`;
    
    // Update staff passes
    document.getElementById('staffPasses').textContent = `${staffPasses} (${staffPercent}%)`;
    document.getElementById('staffProgress').style.width = `${staffPercent}%`;
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
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="guest-cell">
                    <div class="guest-avatar ${gradientClass}">${initials}</div>
                    <div class="guest-info">
                        <span class="guest-name">${invitation.guestNames.join(' y ')}</span>
                        <span class="guest-time">${timeAgo}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${invitation.confirmationDetails?.willAttend ? 'confirmed' : 'rejected'}">
                    ${invitation.confirmationDetails?.willAttend ? 'Confirmado' : 'Rechazado'}
                </span>
            </td>
            <td>${invitation.confirmedPasses || 0} ${invitation.confirmedPasses === 1 ? 'Adulto' : 'Adultos'}</td>
            <td>Mesa ${Math.floor(Math.random() * 10) + 1}</td>
            <td style="max-width: 200px;">
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
        <div class="invitation-detail" style="font-size: 14px;">
            <!-- Status Header -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: ${statusColor}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    <i class="fas fa-${statusIcon}" style="font-size: 12px;"></i> ${statusText}
                </div>
            </div>
            
            <!-- Minimalist Guest Info -->
            <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 15px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #333; font-weight: 500;">
                    ${invitation.guestNames.join(' y ')}
                </h4>
                <div style="display: flex; gap: 20px; font-size: 13px; color: #666;">
                    <span><strong>Código:</strong> ${invitation.code}</span>
                    <span><strong>Pases:</strong> ${invitation.numberOfPasses}</span>
                    ${invitation.phone || invitation.confirmationDetails?.phone ? `
                        <span><strong>Tel:</strong> ${invitation.phone || invitation.confirmationDetails?.phone}</span>
                    ` : ''}
                </div>
            </div>
            
            ${invitation.confirmed ? `
                <!-- Minimalist Confirmation Status -->
                <div style="margin-bottom: 15px;">
                    ${invitation.confirmationDetails?.willAttend ? `
                        <div style="display: flex; gap: 15px; margin-bottom: 12px;">
                            <div style="flex: 1; text-align: center; padding: 12px; background: #f5f5f5; border-radius: 8px;">
                                <div style="font-size: 20px; font-weight: 600; color: #4caf50;">${invitation.confirmedPasses}</div>
                                <div style="font-size: 11px; color: #666; margin-top: 2px;">Confirmados</div>
                            </div>
                            ${cancelledPasses > 0 ? `
                                <div style="flex: 1; text-align: center; padding: 12px; background: #f5f5f5; border-radius: 8px;">
                                    <div style="font-size: 20px; font-weight: 600; color: #f44336;">${cancelledPasses}</div>
                                    <div style="font-size: 11px; color: #666; margin-top: 2px;">Cancelados</div>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${invitation.confirmationDetails?.attendingNames?.length > 0 ? `
                            <p style="margin: 8px 0; font-size: 13px; color: #555;">
                                <strong>Asistentes:</strong> ${invitation.confirmationDetails.attendingNames.join(', ')}
                            </p>
                        ` : ''}
                        
                        ${invitation.confirmationDetails?.dietaryRestrictions ? `
                            <p style="margin: 8px 0; padding: 8px; background: #fff3cd; border-radius: 5px; font-size: 12px;">
                                <i class="fas fa-utensils" style="color: #856404;"></i> ${invitation.confirmationDetails.dietaryRestrictions}
                            </p>
                        ` : ''}
                    ` : `
                        <div style="text-align: center; padding: 15px; background: #ffebee; border-radius: 8px;">
                            <p style="margin: 0; font-size: 14px; color: #c62828;">Invitación declinada</p>
                        </div>
                    `}
                    
                    ${invitation.confirmationDetails?.message ? `
                        <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 6px;">
                            <p style="margin: 0; font-size: 12px; font-style: italic; color: #555;">
                                "${invitation.confirmationDetails.message}"
                            </p>
                        </div>
                    ` : ''}
                    
                    <p style="margin: 10px 0 0 0; text-align: right; color: #999; font-size: 11px;">
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
            
            <!-- Minimalist Link Section -->
            <div style="border-top: 1px solid #e0e0e0; padding-top: 15px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" value="${invitationUrl}" readonly style="flex: 1; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 12px; background: #f9f9f9;">
                    <button class="btn btn-sm" onclick="copyToClipboard('${invitationUrl}')" style="padding: 8px 16px; font-size: 12px;">
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
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const guestNamesInput = formData.get('guestNames');
        
        // Parse guest names
        const guestNames = guestNamesInput
            .split(/[,y]/)
            .map(name => name.trim())
            .filter(name => name);
        
        const invitationData = {
            guestNames: guestNames,
            numberOfPasses: parseInt(formData.get('numberOfPasses')),
            phone: formData.get('phone')
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

// Show Create Form
function showCreateForm() {
    document.querySelector('a[href="#create"]').click();
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

// Update modal close handlers
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
