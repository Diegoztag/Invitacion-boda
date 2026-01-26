/**
 * Render Service
 * Servicio para renderizar dinámicamente el contenido del dashboard
 */

import { DashboardTemplates, STAT_CARD_CONFIGS } from '../templates/dashboard-templates.js';
import { PASS_TYPE_LABELS } from '../dashboard-constants.js';

export class RenderService {
    constructor() {
        this.containers = {
            dashboardStats: '#dashboardStatsGrid',
            invitationsStats: '#invitationsStatsGrid',
            chartsContainer: '#chartsSection',
            recentConfirmations: '#dashboard',
            actionsBar: '#invitations',
            invitationsTable: '#invitations'
        };
    }

    /**
     * Renderiza las stats cards del dashboard
     */
    renderDashboardStats(data) {
        const container = document.querySelector(this.containers.dashboardStats);
        if (!container) return;

        const statsHtml = [
            DashboardTemplates.statCard({
                ...STAT_CARD_CONFIGS.totalPasses,
                value: data.totalPasses || 0,
                subtitle: `Capacidad: <span>${data.targetPasses || 250}</span>`
            }),
            DashboardTemplates.statCard({
                ...STAT_CARD_CONFIGS.confirmedPasses,
                value: data.confirmedPasses || 0,
                subtitle: `Faltan <span>${data.remainingPasses || 0}</span> lugares`,
                badge: data.confirmedPercentage !== undefined ? {
                    class: 'success',
                    text: `${data.confirmedPercentage}%`
                } : null
            }),
            DashboardTemplates.statCard({
                ...STAT_CARD_CONFIGS.pendingPasses,
                value: data.pendingPasses || 0,
                subtitle: `<span>Pendientes</span>`,
            }),
            DashboardTemplates.statCard({
                ...STAT_CARD_CONFIGS.cancelledPasses,
                value: data.cancelledPasses || 0,
                subtitle: `<span>Cancelaron</span>`,
            })
        ].join('');

        container.innerHTML = statsHtml;
    }

    /**
     * Renderiza las stats cards de la sección invitaciones
     */
    renderInvitationsStats(data) {
        const container = document.querySelector(this.containers.invitationsStats);
        if (!container) return;

        const statsHtml = [
            DashboardTemplates.statCard({
                ...STAT_CARD_CONFIGS.totalInvitations,
                value: data.totalInvitations || 0
            }),
            DashboardTemplates.statCard({
                ...STAT_CARD_CONFIGS.confirmedInvitations,
                value: data.confirmedInvitations || 0,
                badge: data.confirmedChangePercentage ? {
                    class: 'success',
                    text: `+${data.confirmedChangePercentage}%`
                } : null
            }),
            DashboardTemplates.statCard({
                ...STAT_CARD_CONFIGS.pendingInvitations,
                value: data.pendingInvitations || 0
            }),
            DashboardTemplates.statCard({
                ...STAT_CARD_CONFIGS.cancelledInvitations,
                value: data.cancelledInvitations || 0
            })
        ].join('');

        container.innerHTML = statsHtml;
    }

    /**
     * Renderiza los contenedores de gráficos
     */
    renderChartsContainers() {
        const container = document.querySelector(this.containers.chartsContainer);
        if (!container) return;

        const chartsHtml = [
            DashboardTemplates.chartContainer({
                id: 'confirmationChart',
                title: 'Resumen de Confirmaciones',
                subtitle: 'Distribución actual'
            }),
            DashboardTemplates.chartContainer({
                containerId: 'passDistributionContainer',
                title: 'Desglose de Pases Activos',
                subtitle: 'Distribución por tipo (no incluye cancelaciones)',
                value: '0',
                valueLabel: 'Pases',
                hasCanvas: false
            })
        ].join('');

        container.innerHTML = chartsHtml;
    }

    /**
     * Renderiza la distribución de pases en el segundo gráfico
     */
    renderPassDistribution(data) {
        const chartContainer = document.querySelector('#passDistributionContainer');
        if (!chartContainer) return;

        // Actualizar el valor total
        const totalSpan = chartContainer.querySelector('.chart-value span');
        if (totalSpan) {
            totalSpan.textContent = data.totalActivePasses || 0;
        }

        // Determinar el label para niños basado en la configuración
        const allowChildren = WEDDING_CONFIG.guests?.allowChildren !== false;
        const childLabel = allowChildren ? PASS_TYPE_LABELS.CHILD : PASS_TYPE_LABELS.CHILD_NOT_ALLOWED;

        // Crear el contenido de distribución
        const distributionHtml = [
            DashboardTemplates.progressItem({
                label: PASS_TYPE_LABELS.MULTIPLE_ADULTS,
                value: data.adultPasses || 0,
                percentage: data.adultPercentage || 0,
                colorClass: 'primary'
            }),
            DashboardTemplates.progressItem({
                label: childLabel,
                value: data.childPasses || 0,
                percentage: data.childPercentage || 0,
                colorClass: 'warning'
            }),
            DashboardTemplates.progressItem({
                label: PASS_TYPE_LABELS.STAFF,
                value: data.staffPasses || 0,
                percentage: data.staffPercentage || 0,
                colorClass: 'muted',
                isLast: true
            })
        ].join('');

        // Buscar o crear el contenedor de distribución
        let distributionContainer = chartContainer.querySelector('.progress-list');
        if (!distributionContainer) {
            distributionContainer = document.createElement('div');
            distributionContainer.className = 'progress-list';
            
            // Insertar después del header
            const header = chartContainer.querySelector('.chart-header');
            header.insertAdjacentElement('afterend', distributionContainer);
        }

        distributionContainer.innerHTML = distributionHtml;
    }

    /**
     * Renderiza la tabla de confirmaciones recientes
     */
    renderRecentConfirmationsTable() {
        const dashboardSection = document.querySelector('#dashboard');
        if (!dashboardSection) return;

        // Buscar si ya existe la tabla
        let existingTable = dashboardSection.querySelector('#recentConfirmationsTable');
        if (existingTable) {
            existingTable.remove();
        }

        // Insertar la nueva tabla al final del dashboard
        const tableHtml = DashboardTemplates.recentConfirmationsTable();
        dashboardSection.insertAdjacentHTML('beforeend', tableHtml);
    }

    /**
     * Renderiza la barra de acciones de invitaciones
     */
    renderActionsBar() {
        const invitationsSection = document.querySelector('#invitations');
        if (!invitationsSection) return;

        // Buscar el lugar correcto para insertar (después de las stats)
        const statsGrid = invitationsSection.querySelector('.stats-grid');
        if (!statsGrid) return;

        // Verificar si ya existe
        let existingActions = invitationsSection.querySelector('.actions-bar');
        if (existingActions) {
            existingActions.remove();
        }

        // Insertar después de las stats
        const actionsHtml = DashboardTemplates.actionsBar();
        statsGrid.insertAdjacentHTML('afterend', actionsHtml);
    }

    /**
     * Renderiza la tabla de invitaciones
     */
    renderInvitationsTable() {
        const invitationsSection = document.querySelector('#invitations');
        if (!invitationsSection) return;

        // Buscar si ya existe
        let existingTable = invitationsSection.querySelector('.table-container');
        if (existingTable) {
            existingTable.remove();
        }

        // Buscar la barra de acciones para insertar después
        const actionsBar = invitationsSection.querySelector('.actions-bar');
        if (!actionsBar) return;

        // Insertar después de la barra de acciones
        const tableHtml = DashboardTemplates.invitationsTable();
        actionsBar.insertAdjacentHTML('afterend', tableHtml);
    }

    /**
     * Renderiza skeletons de loading para stats
     */
    renderStatsSkeletons(container) {
        const targetContainer = document.querySelector(container);
        if (!targetContainer) return;

        const skeletonsHtml = Array(4).fill(0)
            .map(() => DashboardTemplates.statCardSkeleton())
            .join('');

        targetContainer.innerHTML = skeletonsHtml;
    }

    /**
     * Renderiza skeleton de loading para tabla
     */
    renderTableSkeleton(containerId, rows = 5) {
        const container = document.querySelector(`#${containerId}`);
        if (!container) return;

        const skeletonHtml = DashboardTemplates.tableSkeleton(rows);
        container.innerHTML = skeletonHtml;
    }

    /**
     * Renderiza estado vacío
     */
    renderEmptyState(container, config) {
        const targetContainer = document.querySelector(container);
        if (!targetContainer) return;

        const emptyHtml = DashboardTemplates.emptyState(config);
        targetContainer.innerHTML = emptyHtml;
    }

    /**
     * Renderiza estado de error
     */
    renderErrorState(container, config) {
        const targetContainer = document.querySelector(container);
        if (!targetContainer) return;

        const errorHtml = DashboardTemplates.errorState(config);
        targetContainer.innerHTML = errorHtml;
    }

    /**
     * Inicializa todos los contenedores dinámicos
     */
    initializeDynamicContainers() {
        // Renderizar skeletons iniciales
        this.renderStatsSkeletons(this.containers.dashboardStats);
        this.renderStatsSkeletons(this.containers.invitationsStats);
        
        // Renderizar contenedores de gráficos
        this.renderChartsContainers();
        
        // Renderizar tabla de confirmaciones recientes
        this.renderRecentConfirmationsTable();
        
        // Renderizar barra de acciones
        this.renderActionsBar();
        
        // Renderizar tabla de invitaciones
        this.renderInvitationsTable();
    }

    /**
     * Actualiza el contador del timer
     */
    updateTimer(timeLeft) {
        const elements = {
            days: document.getElementById('days'),
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds')
        };

        if (elements.days) elements.days.textContent = String(timeLeft.days).padStart(2, '0');
        if (elements.hours) elements.hours.textContent = String(timeLeft.hours).padStart(2, '0');
        if (elements.minutes) elements.minutes.textContent = String(timeLeft.minutes).padStart(2, '0');
        if (elements.seconds) elements.seconds.textContent = String(timeLeft.seconds).padStart(2, '0');
    }

    /**
     * Actualiza información de bienvenida
     */
    updateWelcomeInfo(data) {
        const welcomeMessage = document.getElementById('welcomeMessage');
        const welcomeSubtext = document.getElementById('welcomeSubtext');
        const weddingTitle = document.getElementById('weddingTitle');

        if (welcomeMessage && data.welcomeMessage) {
            welcomeMessage.textContent = data.welcomeMessage;
        }
        if (welcomeSubtext && data.welcomeSubtext) {
            welcomeSubtext.textContent = data.welcomeSubtext;
        }
        if (weddingTitle && data.weddingTitle) {
            weddingTitle.textContent = data.weddingTitle;
        }
    }
}
