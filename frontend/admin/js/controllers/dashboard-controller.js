/**
 * Dashboard Controller
 * Maneja toda la lógica relacionada con el dashboard principal
 */

import { adminAPI, APIHelpers } from '../admin-api.js';
import { 
    updateStatsUI, 
    updateTargetElements, 
    generateDemoStats,
    updateConfirmedChangeIndicator 
} from '../admin-utils.js';
import { showToast } from '../components/admin-modal.js';

export class DashboardController {
    constructor() {
        this.confirmationChart = null;
        this.CONFIG = {
            backendUrl: WEDDING_CONFIG.api.backendUrl
        };
    }

    /**
     * Inicializa el dashboard
     */
    async init() {
        this.initCountdownTimer();
        this.updateResponsiveLabels();
        this.setupEventListeners();
        await this.loadDashboardData();
    }

    /**
     * Inicializa el contador regresivo
     */
    initCountdownTimer() {
        const updateTimer = () => {
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
        };

        updateTimer();
        setInterval(updateTimer, 1000);
    }

    /**
     * Actualiza las etiquetas responsivas
     */
    updateResponsiveLabels() {
        const staffLabel = document.querySelector('.progress-item:nth-child(3) .progress-label');
        if (staffLabel) {
            if (window.innerWidth <= 768) {
                staffLabel.textContent = 'Staff';
            } else {
                staffLabel.textContent = 'Staff/Proveedores';
            }
        }
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Update labels on resize
        window.addEventListener('resize', () => this.updateResponsiveLabels());

        // Handle period selector
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
                const periodConfirmations = await this.calculateConfirmationsByPeriod(selectedPeriod);
                
                // Update welcome text
                this.updateWelcomeText(selectedPeriod, periodConfirmations);
            });
        }
    }

    /**
     * Carga los datos del dashboard
     */
    async loadDashboardData() {
        try {
            const result = await adminAPI.fetchStats();
            if (APIHelpers.isSuccess(result)) {
                const stats = result.stats;
                
                // Update stats cards using utility function
                updateStatsUI(stats);
                
                // Update confirmed percentage badge
                this.updateConfirmedPercentageBadge(stats);
                
                // Update target elements
                const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
                updateTargetElements({
                    targetInvitations: targetTotal,
                    targetTotal: targetTotal
                });
                
                // Calculate and display remaining guests
                this.updateRemainingGuests(stats, targetTotal);
                
                // Get selected period and update welcome text
                await this.updateWelcomeTextForPeriod();
                
                // Update pass distribution and chart
                this.updatePassDistribution(stats);
                this.updateConfirmationChart(stats);
                
                // Load recent confirmations
                await this.loadRecentConfirmations();
            } else {
                throw new Error(APIHelpers.getErrorMessage(result));
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast(APIHelpers.getErrorMessage({ error: error.message }), 'error');
            await this.showDemoData();
        }
    }

    /**
     * Actualiza el badge de porcentaje confirmado
     */
    updateConfirmedPercentageBadge(stats) {
        const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
        const confirmedPercentage = Math.round((stats.confirmedPasses / targetTotal) * 100);
        const confirmedBadge = document.getElementById('confirmedChange');
        
        if (confirmedBadge) {
            confirmedBadge.textContent = `${confirmedPercentage}%`;
            confirmedBadge.title = 'Porcentaje de confirmados';
            
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
    }

    /**
     * Actualiza los invitados restantes
     */
    updateRemainingGuests(stats, targetTotal) {
        const remainingGuests = Math.max(0, targetTotal - stats.confirmedPasses);
        const remainingGuestsEl = document.getElementById('remainingGuests');
        if (remainingGuestsEl) {
            remainingGuestsEl.textContent = remainingGuests;
        }
    }

    /**
     * Actualiza el texto de bienvenida para el período seleccionado
     */
    async updateWelcomeTextForPeriod() {
        const periodSelector = document.getElementById('confirmationPeriod');
        const selectedPeriod = periodSelector ? periodSelector.value : 'today';
        
        const periodConfirmations = await this.calculateConfirmationsByPeriod(selectedPeriod);
        this.updateWelcomeText(selectedPeriod, periodConfirmations);
    }

    /**
     * Muestra datos demo en caso de error
     */
    async showDemoData() {
        const demoStats = generateDemoStats();
        
        updateStatsUI(demoStats);
        this.updateConfirmedPercentageBadge(demoStats);
        
        const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
        const targetInvitations = WEDDING_CONFIG.guests?.targetInvitations || 150;
        updateTargetElements({
            targetInvitations: targetInvitations,
            targetTotal: targetTotal
        });
        
        this.updateRemainingGuests(demoStats, targetTotal);
        this.updatePassDistribution(demoStats);
        this.updateConfirmationChart(demoStats);
        await this.loadRecentConfirmations();
    }

    /**
     * Actualiza la distribución de pases
     */
    updatePassDistribution(stats) {
        const confirmedPasses = stats.confirmedPasses || 0;
        const pendingPasses = stats.pendingPasses || 0;
        const activePasses = confirmedPasses + pendingPasses;
        
        const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false;
        
        let adultPasses, childPasses, staffPasses;
        let adultPercent, childPercent, staffPercent;
        
        // Calculate pass distribution
        if (stats.adultPasses !== undefined && stats.childPasses !== undefined && stats.staffPasses !== undefined) {
            const totalOriginal = stats.totalPasses || 1;
            const activeRatio = activePasses / totalOriginal;
            
            adultPasses = Math.round(stats.adultPasses * activeRatio);
            childPasses = allowChildren ? Math.round(stats.childPasses * activeRatio) : 0;
            staffPasses = Math.round(stats.staffPasses * activeRatio);
            
            const calculatedTotal = adultPasses + childPasses + staffPasses;
            if (calculatedTotal !== activePasses && activePasses > 0) {
                adultPasses += (activePasses - calculatedTotal);
            }
        } else {
            if (allowChildren) {
                adultPasses = Math.floor(activePasses * 0.8);
                childPasses = Math.floor(activePasses * 0.15);
                staffPasses = activePasses - adultPasses - childPasses;
            } else {
                adultPasses = Math.floor(activePasses * 0.95);
                childPasses = 0;
                staffPasses = activePasses - adultPasses;
            }
        }
        
        // Calculate percentages
        if (activePasses > 0) {
            adultPercent = Math.round((adultPasses / activePasses) * 100);
            childPercent = allowChildren ? Math.round((childPasses / activePasses) * 100) : 0;
            staffPercent = Math.round((staffPasses / activePasses) * 100);
        } else {
            adultPercent = 0;
            childPercent = 0;
            staffPercent = 0;
        }
        
        // Update UI elements
        this.updatePassDistributionUI(activePasses, adultPasses, adultPercent, childPasses, childPercent, staffPasses, staffPercent, allowChildren);
    }

    /**
     * Actualiza la UI de distribución de pases
     */
    updatePassDistributionUI(activePasses, adultPasses, adultPercent, childPasses, childPercent, staffPasses, staffPercent, allowChildren) {
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
            childPassesElement.textContent = 'No permitidos';
            childProgressElement.className = 'progress-fill warning progress-fill-0';
            childProgressItem.classList.add('disabled-section');
            childProgressItem.querySelector('.progress-label').textContent = 'Niños (No permitidos)';
        } else {
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
        
        this.updateResponsiveLabels();
    }

    /**
     * Carga las confirmaciones recientes
     */
    async loadRecentConfirmations() {
        try {
            const result = await adminAPI.fetchRecentConfirmations(7, 5);
            if (APIHelpers.isSuccess(result)) {
                this.displayRecentConfirmations(result.confirmations);
            } else {
                throw new Error(APIHelpers.getErrorMessage(result));
            }
        } catch (error) {
            console.error('Error loading recent confirmations:', error);
            this.displayRecentConfirmations([]);
        }
    }

    /**
     * Muestra las confirmaciones recientes
     */
    displayRecentConfirmations(confirmations) {
        const tbody = document.getElementById('recentConfirmations');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (confirmations.length === 0) {
            return;
        }
        
        confirmations.forEach((invitation, index) => {
            const row = document.createElement('tr');
            // Import renderTableRow from utils when needed
            row.innerHTML = this.renderTableRow(invitation, 'recent', index);
            tbody.appendChild(row);
        });
    }

    /**
     * Calcula confirmaciones por período
     */
    async calculateConfirmationsByPeriod(period = 'today') {
        try {
            const result = await adminAPI.fetchInvitations();
            if (APIHelpers.isSuccess(result)) {
                const invitations = result.invitations || [];
                
                const now = new Date();
                let startDate = new Date();
                
                switch(period) {
                    case 'today':
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'last24hours':
                        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                        break;
                    case 'lastWeek':
                        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    default:
                        startDate.setHours(0, 0, 0, 0);
                }
                
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

    /**
     * Actualiza el texto de bienvenida
     */
    updateWelcomeText(period, confirmations) {
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

    /**
     * Actualiza el gráfico de confirmaciones
     */
    updateConfirmationChart(stats) {
        const ctx = document.getElementById('confirmationChart').getContext('2d');
        
        if (this.confirmationChart) {
            this.confirmationChart.destroy();
        }
        
        this.confirmationChart = new Chart(ctx, {
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

    /**
     * Renderiza una fila de tabla (método temporal hasta refactorizar utils)
     */
    renderTableRow(invitation, type, index) {
        // Importar desde utils cuando esté disponible
        // Por ahora, implementación básica
        return `
            <td>${invitation.guestNames.join(' y ')}</td>
            <td>${invitation.confirmed ? 'Confirmado' : 'Pendiente'}</td>
            <td>${invitation.numberOfPasses}</td>
            <td>${invitation.tableNumber || 'Sin asignar'}</td>
            <td>${invitation.confirmationDetails?.message || '-'}</td>
            <td><button onclick="viewInvitation('${invitation.code}')" class="btn btn-sm btn-primary">Ver</button></td>
        `;
    }
}
