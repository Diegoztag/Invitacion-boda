 /**
 * Dashboard Controller
 * Maneja toda la lógica relacionada con el dashboard principal
 */

import { adminAPI, APIHelpers } from '../dashboard-api.js';
import { 
    updateStatsUI, 
    updateTargetElements, 
    updateConfirmedChangeIndicator,
    getSafeValue,
    renderTableRow
} from '../dashboard-utils.js';
import { showToast } from '../components/dashboard-modal.js';

export class DashboardController {
    constructor() {
        this.confirmationChart = null;
        this.CONFIG = {
            backendUrl: WEDDING_CONFIG.api.backendUrl
        };
    }

    /**
     * Data Mapper centralizado - convierte la respuesta del backend a las estructuras que necesita el frontend
     */
    mapStatsData(backendStats) {
        console.log('🔄 Mapeando datos del backend:', backendStats);
        
        // Extraer datos de la estructura optimizada del backend
        const invitations = backendStats.invitations || {};
        const confirmations = backendStats.confirmations || {};
        const passDistribution = backendStats.passDistribution || {};
        const rates = backendStats.rates || {};
        
        // Calcular porcentaje de confirmados
        const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
        const confirmedPasses = getSafeValue(confirmations.totalConfirmedGuests, 0);
        const confirmedPercentage = targetTotal > 0 ? Math.round((confirmedPasses / targetTotal) * 100) : 0;

        // Mapeo para RenderService (estructura que espera el template)
        const renderServiceData = {
            // Dashboard stats - usar datos reales del backend
            totalPasses: getSafeValue(invitations.totalPasses, 0),
            confirmedPasses: confirmedPasses,
            pendingPasses: getSafeValue(confirmations.pendingPasses, 0),
            cancelledPasses: getSafeValue(invitations.cancelledPasses, 0),
            
            // Invitations stats - usar valores individuales del backend
            totalInvitations: getSafeValue(invitations.total, 0),
            confirmedInvitations: getSafeValue(invitations.confirmed, 0),
            pendingInvitations: getSafeValue(invitations.pending, 0),
            cancelledInvitations: getSafeValue(invitations.cancelled, 0),
            
            // Additional data
            targetPasses: targetTotal,
            remainingPasses: Math.max(0, targetTotal - confirmedPasses),
            confirmedPercentage: confirmedPercentage
        };
        
        // Mapeo para updateStatsUI (estructura que espera dashboard-utils)
        const utilsData = {
            invitations: {
                total: getSafeValue(invitations.total, 0),
                totalPasses: getSafeValue(invitations.totalPasses, 0),
                confirmed: getSafeValue(invitations.confirmed, 0),
                pending: getSafeValue(invitations.pending, 0),
                cancelled: getSafeValue(invitations.cancelled, 0),
                inactive: getSafeValue(invitations.inactive, 0)
            },
            confirmations: {
                totalConfirmedGuests: getSafeValue(confirmations.totalConfirmedGuests, 0),
                pendingPasses: getSafeValue(confirmations.pendingPasses, 0),
                byType: confirmations.byType || {}
            },
            rates: {
                confirmationRate: getSafeValue(rates.confirmationRate, 0),
                attendanceRate: getSafeValue(rates.attendanceRate, 0)
            }
        };
        
        console.log('📊 Datos mapeados para RenderService:', renderServiceData);
        console.log('� Datos mapeados para Utils:', utilsData);
        
        return {
            renderService: renderServiceData,
            utils: utilsData,
            original: backendStats
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
            const eventDate = new Date(WEDDING_CONFIG.event.date);
            const distance = eventDate.getTime() - now;

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
            console.log('🔄 Cargando datos del dashboard...');
            const result = await adminAPI.fetchStats();
            console.log('📊 Resultado de fetchStats:', result);
            
            if (APIHelpers.isSuccess(result)) {
                const backendStats = result.data;
                console.log('📈 Stats recibidas del backend:', backendStats);
                
                // Usar el Data Mapper centralizado
                const mappedData = this.mapStatsData(backendStats);
                
                // Actualizar stats usando RenderService
                if (window.renderService) {
                    console.log('🎨 Actualizando dashboard stats con RenderService...');
                    window.renderService.renderDashboardStats(mappedData.renderService);
                    
                    console.log('🎨 Actualizando invitations stats con RenderService...');
                    window.renderService.renderInvitationsStats(mappedData.renderService);
                }
                
                // Actualizar stats usando dashboard-utils (para elementos que no usa RenderService)
                console.log('🔧 Actualizando stats con dashboard-utils...');
                updateStatsUI(mappedData.utils, ''); // Dashboard principal
                updateStatsUI(mappedData.utils, 'Stats'); // Sección de invitaciones
                
                // Update confirmed percentage badge
                this.updateConfirmedPercentageBadge(mappedData.renderService);
                
                // Update target elements
                const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
                updateTargetElements({
                    targetTotal: targetTotal
                });
                
                // Calculate and display remaining guests
                this.updateRemainingGuests(mappedData.renderService, targetTotal);
                
                // Get selected period and update welcome text
                await this.updateWelcomeTextForPeriod();
                
                // Update pass distribution and chart
                this.updatePassDistribution(mappedData.original);
                this.updateConfirmationChart(mappedData.original);
                
                // Load recent confirmations
                await this.loadRecentConfirmations();
                
                console.log('✅ Dashboard data loaded successfully');
            } else {
                throw new Error(APIHelpers.getErrorMessage(result));
            }
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            showToast(APIHelpers.getErrorMessage({ error: error.message }), 'error');
            
            // Show empty state instead of demo data
            this.showEmptyState();
        }
    }

    /**
     * Actualiza el badge de porcentaje confirmado
     */
    updateConfirmedPercentageBadge(stats) {
        const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
        const confirmedPasses = getSafeValue(stats.confirmedPasses, 0);
        const confirmedPercentage = targetTotal > 0 ? Math.round((confirmedPasses / targetTotal) * 100) : 0;
        const safePercentage = getSafeValue(confirmedPercentage, 0);
        const confirmedBadge = document.getElementById('confirmedChange');
        
        if (confirmedBadge) {
            confirmedBadge.textContent = `${safePercentage}%`;
            confirmedBadge.title = 'Porcentaje de confirmados';
            
            if (!confirmedBadge.classList.contains('stat-badge')) {
                confirmedBadge.classList.add('stat-badge');
            }
            
            // Update badge color based on percentage
            confirmedBadge.classList.remove('success', 'warning', 'danger', 'primary');
            if (safePercentage >= 70) {
                confirmedBadge.classList.add('success');
            } else if (safePercentage >= 40) {
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
        const confirmedPasses = getSafeValue(stats.confirmedPasses, 0);
        const safeTargetTotal = getSafeValue(targetTotal, 130);
        const remainingGuests = Math.max(0, safeTargetTotal - confirmedPasses);
        const remainingGuestsEl = document.getElementById('remainingGuests');
        if (remainingGuestsEl) {
            remainingGuestsEl.textContent = getSafeValue(remainingGuests, safeTargetTotal);
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
     * Muestra estado vacío en caso de error
     */
    showEmptyState() {
        const emptyStats = {
            totalInvitations: 0,
            totalPasses: 0,
            confirmedPasses: 0,
            pendingInvitations: 0,
            cancelledPasses: 0,
            pendingPasses: 0,
            adultPasses: 0,
            childPasses: 0,
            staffPasses: 0
        };
        
        updateStatsUI(emptyStats);
        this.updateConfirmedPercentageBadge(emptyStats);
        
        const targetTotal = WEDDING_CONFIG.guests?.targetTotal || 250;
        updateTargetElements({
            targetTotal: targetTotal
        });
        
        this.updateRemainingGuests(emptyStats, targetTotal);
        this.updatePassDistribution(emptyStats);
        this.updateConfirmationChart(emptyStats);
        
        // Show empty confirmations table
        this.displayRecentConfirmations([]);
    }

    /**
     * Actualiza la distribución de pases usando datos del backend (sin cálculos en frontend)
     */
    updatePassDistribution(stats) {
        console.log('🎯 Actualizando distribución de pases con datos del backend:', stats);
        
        const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false;
        const passDistribution = stats.passDistribution || {};
        const distributionPercentages = passDistribution.distributionPercentages || {};
        
        // Usar datos ya procesados del backend - SIN cálculos en frontend
        const adultPasses = passDistribution.activeAdultPasses || 0;
        const childPasses = allowChildren ? (passDistribution.activeChildPasses || 0) : 0;
        const staffPasses = passDistribution.activeStaffPasses || 0;
        const totalActivePasses = passDistribution.totalActivePasses || (adultPasses + childPasses + staffPasses);
        
        // Recalcular porcentajes en frontend para asegurar consistencia visual
        // Esto corrige casos donde el backend pueda enviar 0 o undefined en los porcentajes
        let adultPercent = 0;
        let childPercent = 0;
        let staffPercent = 0;

        if (totalActivePasses > 0) {
            adultPercent = Math.round((adultPasses / totalActivePasses) * 100);
            childPercent = allowChildren ? Math.round((childPasses / totalActivePasses) * 100) : 0;
            staffPercent = Math.round((staffPasses / totalActivePasses) * 100);
            
            // Asegurar mínimo visual de 1% si hay pases pero el porcentaje redondeado es 0
            // Esto garantiza que la barra de progreso sea visible aunque el porcentaje sea muy bajo (ej. 0.4%)
            if (adultPasses > 0 && adultPercent === 0) adultPercent = 1;
            if (childPasses > 0 && childPercent === 0) childPercent = 1;
            if (staffPasses > 0 && staffPercent === 0) staffPercent = 1;
        }
        
        console.log('📊 Distribución de pases (recalculado):', {
            totalActivePasses,
            adultos: `${adultPasses} (${adultPercent}%)`,
            niños: `${childPasses} (${childPercent}%)`,
            staff: `${staffPasses} (${staffPercent}%)`
        });
        
        // Usar render service para actualizar la UI
        if (window.renderService) {
            window.renderService.renderPassDistribution({
                totalActivePasses,
                adultPasses,
                adultPercentage: adultPercent,
                childPasses: allowChildren ? childPasses : 0,
                childPercentage: allowChildren ? childPercent : 0,
                staffPasses,
                staffPercentage: staffPercent
            });
        }
    }

    /**
     * Carga las confirmaciones recientes
     */
    async loadRecentConfirmations() {
        try {
            // Usar 0 días para obtener las últimas confirmaciones absolutas, sin importar la fecha
            const result = await adminAPI.fetchRecentConfirmations(0, 5);
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
            // Use imported renderTableRow
            row.innerHTML = renderTableRow(invitation, 'recent', index);
            tbody.appendChild(row);
        });
    }

    /**
     * Obtiene confirmaciones por período desde el backend
     */
    async calculateConfirmationsByPeriod(period = 'today') {
        try {
            // Usar fetchRecentConfirmations con filtro de días para obtener el conteo del período
            const result = await adminAPI.fetchRecentConfirmations(
                period === 'lastWeek' ? 7 : 1, 
                100 // Límite alto para obtener todas las confirmaciones del período
            );
            
            if (APIHelpers.isSuccess(result)) {
                return result.confirmations ? result.confirmations.length : 0;
            }
        } catch (error) {
            console.error('Error getting confirmations by period:', error);
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
     * Actualiza el gráfico de confirmaciones usando la nueva estructura optimizada
     */
    updateConfirmationChart(stats) {
        const ctx = document.getElementById('confirmationChart').getContext('2d');
        
        if (this.confirmationChart) {
            this.confirmationChart.destroy();
        }
        
        // Extraer datos de la nueva estructura
        const confirmations = stats.confirmations || {};
        const invitations = stats.invitations || {};
        
        const confirmedPasses = confirmations.totalConfirmedGuests || 0;
        const pendingPasses = confirmations.pendingPasses || 0;
        const cancelledPasses = invitations.cancelledPasses || 0;

        // Determine font size based on screen width
        const isMobile = window.innerWidth < 768;
        const fontSize = isMobile ? 10 : 12;
        
        this.confirmationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Confirmados', 'Pendientes', 'Cancelados'],
                datasets: [{
                    data: [confirmedPasses, pendingPasses, cancelledPasses],
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
                            padding: isMobile ? 10 : 15,
                            font: {
                                size: fontSize,
                                weight: 500
                            },
                            boxWidth: isMobile ? 10 : 40
                        }
                    },
                    tooltip: {
                        backgroundColor: '#2d1b27',
                        titleColor: '#ffffff',
                        bodyColor: '#94a3b8',
                        borderColor: '#e619a1',
                        borderWidth: 1,
                        padding: isMobile ? 8 : 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        },
                        titleFont: {
                            size: isMobile ? 11 : 12
                        },
                        bodyFont: {
                            size: isMobile ? 11 : 12
                        }
                    }
                }
            }
        });
    }

}
