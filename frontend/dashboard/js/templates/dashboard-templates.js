/**
 * Dashboard Templates
 * Sistema de templates para generar contenido dinámico del dashboard
 */

export class DashboardTemplates {
    
    /**
     * Template para stat card
     */
    static statCard(config) {
        const { icon, iconClass = 'primary', title, value, subtitle, badge } = config;
        
        return `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon ${iconClass}">
                        <i class="${icon}"></i>
                    </div>
                    ${badge ? `<span class="stat-badge ${badge.class}">${badge.text}</span>` : ''}
                </div>
                <div class="stat-content">
                    <p>${title}</p>
                    <h3>${value}</h3>
                    ${subtitle ? `<p class="stat-subtitle">${subtitle}</p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Template para progress item (distribución de pases)
     */
    static progressItem(config) {
        const { label, value, percentage, colorClass = 'primary', isLast = false } = config;
        
        return `
            <div class="progress-item ${isLast ? 'mb-0' : ''}">
                <div class="progress-header">
                    <span class="progress-label">${label}</span>
                    <span class="progress-value text-${colorClass}">${value} (${percentage}%)</span>
                </div>
                <div class="progress-track">
                    <div class="progress-bar bg-${colorClass}" style="width: ${percentage}%;"></div>
                </div>
            </div>
        `;
    }

    /**
     * Template para chart container
     */
    static chartContainer(config) {
        const { id, containerId, title, subtitle, value, valueLabel, hasCanvas = true } = config;
        
        return `
            <div class="chart-container" ${containerId ? `id="${containerId}"` : ''}>
                <div class="chart-header">
                    <div>
                        <h3>${title}</h3>
                        <p>${subtitle}</p>
                    </div>
                    ${value ? `<span class="chart-value"><span>${value}</span> <small>${valueLabel}</small></span>` : ''}
                </div>
                ${hasCanvas ? `<canvas id="${id}" class="chart-canvas"></canvas>` : ''}
            </div>
        `;
    }

    /**
     * Template para tabla de confirmaciones recientes
     */
    static recentConfirmationsTable() {
        return `
            <div class="table-container" id="recentConfirmationsTable">
                <div class="table-header">
                    <h3>Últimas Confirmaciones</h3>
                </div>
                <div class="table-responsive">
                    <table class="recent-confirmations-table">
                        <thead>
                            <tr>
                                <th>Invitado</th>
                                <th>Estado</th>
                                <th>Pases</th>
                                <th>Mesa</th>
                                <th>Mensaje</th>
                                <th class="table-header-detail">Detalle</th>
                            </tr>
                        </thead>
                        <tbody id="recentConfirmations">
                            <!-- Recent confirmations will be loaded here -->
                        </tbody>
                    </table>
                </div>
                <div class="table-footer-link">
                    <a href="#invitations">Gestionar invitaciones</a>
                </div>
            </div>
        `;
    }

    /**
     * Template para actions bar
     */
    static actionsBar() {
        return `
            <div class="actions-bar">
                <div class="search-wrapper">
                    <input type="text" id="searchInput" placeholder="Buscar invitado..." class="search-input">
                    <button class="btn-icon" title="Filtros" data-action="toggle-filters" id="filtersToggleBtn">
                        <i class="fas fa-filter"></i>
                    </button>
                    
                    <!-- Filters Popover -->
                    <div class="filters-panel" id="filtersPanel">
                        <div class="filters-content">
                            <div class="filters-header">
                                <h4>Filtrar Invitaciones</h4>
                                <button class="btn-icon" data-action="close-filters" title="Cerrar">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <div class="filters-grid">
                                <div class="filter-group">
                                    <select id="statusFilter" class="filter-select">
                                        <option value="">Estado: Todos</option>
                                        <option value="confirmed">Confirmados</option>
                                        <option value="pending">Pendientes</option>
                                        <option value="cancelled">Cancelados</option>
                                        <option value="partial">Parciales</option>
                                        <option value="inactive">Inactivos</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <select id="passesFilter" class="filter-select">
                                        <option value="">Pases: Todos</option>
                                        <option value="1">1 pase</option>
                                        <option value="2">2 pases</option>
                                        <option value="3">3 pases</option>
                                        <option value="4+">4+ pases</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <select id="tableFilter" class="filter-select">
                                        <option value="">Mesa: Todas</option>
                                        <option value="assigned">Con mesa asignada</option>
                                        <option value="unassigned">Sin mesa asignada</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="filters-actions">
                                <button class="btn btn-secondary" data-action="clear-filters">
                                    <i class="fas fa-eraser"></i> Limpiar
                                </button>
                                <button class="btn btn-primary" data-action="apply-filters">
                                    <i class="fas fa-check"></i> Aplicar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="actions-group">
                    <button class="btn btn-secondary" id="exportCsvBtn">
                        <i class="fas fa-file-download"></i> Exportar CSV
                    </button>
                    <button class="btn btn-secondary" id="importCsvBtn">
                        <i class="fas fa-file-upload"></i> Importar CSV
                    </button>
                    <button class="btn btn-primary" id="createInvitationBtn">
                        <i class="fas fa-plus"></i> Añadir Invitado
                    </button>
                </div>
            </div>
            
            <!-- Backdrop for closing filters on outside click -->
            <div class="filters-backdrop" id="filtersBackdrop"></div>
        `;
    }

    /**
     * Template para tabla de invitaciones
     */
    static invitationsTable() {
        return `
            <div class="table-container">
                <div class="table-responsive">
                    <table class="recent-confirmations-table">
                        <thead>
                            <tr>
                                <th>Invitado</th>
                                <th>Estado</th>
                                <th>Pases</th>
                                <th>Mesa</th>
                                <th>Mensaje</th>
                                <th class="table-header-detail">Detalle</th>
                            </tr>
                        </thead>
                        <tbody id="invitationsTableBody">
                            <!-- Las invitaciones se cargarán aquí -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="table-pagination">
                    <div class="pagination-left">
                        <p class="pagination-info">Mostrando <span id="showingFrom">1</span>-<span id="showingTo">20</span> de <span id="totalCount">0</span> invitados</p>
                        <div class="items-per-page">
                            <label for="itemsPerPage">Mostrar:</label>
                            <select id="itemsPerPage" class="items-per-page-select">
                                <option value="10">10</option>
                                <option value="20" selected>20</option>
                                <option value="30">30</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="prevPage" disabled>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="pagination-numbers" id="paginationNumbers">
                            <button class="pagination-number active">1</button>
                        </div>
                        <button class="pagination-btn" id="nextPage">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Template para loading skeleton de stat card
     */
    static statCardSkeleton() {
        return `
            <div class="stat-card skeleton">
                <div class="stat-header">
                    <div class="stat-icon skeleton-icon"></div>
                </div>
                <div class="stat-content">
                    <div class="skeleton-text skeleton-text-sm"></div>
                    <div class="skeleton-text skeleton-text-lg"></div>
                    <div class="skeleton-text skeleton-text-xs"></div>
                </div>
            </div>
        `;
    }

    /**
     * Template para loading skeleton de tabla
     */
    static tableSkeleton(rows = 5) {
        const skeletonRows = Array(rows).fill(0).map(() => `
            <tr class="skeleton-row">
                <td><div class="skeleton-text"></div></td>
                <td><div class="skeleton-text skeleton-text-sm"></div></td>
                <td><div class="skeleton-text skeleton-text-xs"></div></td>
                <td><div class="skeleton-text skeleton-text-sm"></div></td>
                <td><div class="skeleton-text"></div></td>
                <td><div class="skeleton-text skeleton-text-xs"></div></td>
            </tr>
        `).join('');

        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Cargando...</h3>
                </div>
                <div class="table-responsive">
                    <table class="recent-confirmations-table">
                        <thead>
                            <tr>
                                <th>Invitado</th>
                                <th>Estado</th>
                                <th>Pases</th>
                                <th>Mesa</th>
                                <th>Mensaje</th>
                                <th class="table-header-detail">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${skeletonRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Template para estado vacío
     */
    static emptyState(config) {
        const { icon = 'fas fa-inbox', title, message, actionText, actionHandler } = config;
        
        return `
            <div class="state-container empty-state">
                <div class="state-icon">
                    <i class="${icon}"></i>
                </div>
                <h3 class="state-title">${title}</h3>
                <p class="state-message">${message}</p>
                ${actionText ? `<button class="btn btn-primary" onclick="${actionHandler}">${actionText}</button>` : ''}
            </div>
        `;
    }

    /**
     * Template para error state
     */
    static errorState(config) {
        const { title = 'Error al cargar datos', message, retryHandler } = config;
        
        return `
            <div class="state-container error-state">
                <div class="state-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="state-title">${title}</h3>
                <p class="state-message">${message}</p>
                ${retryHandler ? `<button class="btn btn-secondary" onclick="${retryHandler}">Reintentar</button>` : ''}
            </div>
        `;
    }
}

/**
 * Configuraciones predefinidas para stats cards
 */
export const STAT_CARD_CONFIGS = {
    totalPasses: {
        icon: 'fas fa-user-check',
        iconClass: 'primary',
        title: 'Invitados'
    },
    confirmedPasses: {
        icon: 'fas fa-check-circle',
        iconClass: 'success',
        title: 'Confirmados'
    },
    pendingPasses: {
        icon: 'fas fa-hourglass-half',
        iconClass: 'warning',
        title: 'Por Confirmar'
    },
    cancelledPasses: {
        icon: 'fas fa-times-circle',
        iconClass: 'danger',
        title: 'No asistirán'
    },
    totalInvitations: {
        icon: 'fas fa-envelope',
        iconClass: 'primary',
        title: 'Total Invitaciones'
    },
    confirmedInvitations: {
        icon: 'fas fa-check-circle',
        iconClass: 'success',
        title: 'Invitaciones Confirmadas'
    },
    pendingInvitations: {
        icon: 'fas fa-hourglass-half',
        iconClass: 'warning',
        title: 'Invitaciones Pendientes'
    },
    cancelledInvitations: {
        icon: 'fas fa-times-circle',
        iconClass: 'danger',
        title: 'Invitaciones Canceladas'
    }
};
