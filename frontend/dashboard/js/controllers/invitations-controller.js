/**
 * Invitations Controller
 * Maneja toda la lógica relacionada con la gestión de invitaciones
 */

import { adminAPI, APIHelpers } from '../dashboard-api.js';
import { 
    calculatePaginationInfo,
    updateTablePagination,
    renderTableRow,
    getStatusBadge,
    getSafeValue,
    formatGuestNames
} from '../dashboard-utils.js';
import { ModalFactory, showToast } from '../components/dashboard-modal.js';

export class InvitationsController {
    constructor() {
        // Estado de paginación y filtros (Server-side pagination)
        this.state = {
            page: 1,
            limit: 10,
            search: '',
            filters: {
                status: '',
                passes: '',
                table: '',
                phone: ''
            },
            pagination: {
                total: 0,
                totalPages: 1,
                hasNext: false,
                hasPrev: false
            }
        };
        
        this.currentInvitations = []; // Invitaciones de la página actual

        this.CONFIG = {
            backendUrl: WEDDING_CONFIG.api.backendUrl
        };
        
        // Modal instances
        this.invitationDetailModal = null;
        this.createInvitationModal = null;
        this.editInvitationModal = null;
        this.importCsvModal = null;
        
        this.currentViewingCode = null; // Código de la invitación que se está viendo en detalles
    }

    /**
     * Inicializa el controlador de invitaciones
     */
    async init() {
        this.initModals();
        this.setupEventListeners();
        await this.loadInvitations();
        this.initSearch();
        this.initPagination();
        this.initCsvUpload();
    }

    /**
     * Inicializa los modales
     */
    initModals() {
        this.invitationDetailModal = ModalFactory.createInvitationDetailModal();
        this.createInvitationModal = ModalFactory.createInvitationFormModal();
        this.editInvitationModal = ModalFactory.createEditInvitationModal();
        this.importCsvModal = ModalFactory.createImportCSVModal();
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Handle "Ver todos los invitados" link
        document.addEventListener('click', (e) => {
            if (e.target && e.target.matches('a[href="#invitations"]')) {
                e.preventDefault();
                const invitacionesNavItem = document.querySelector('.nav-item[href="#invitations"]');
                if (invitacionesNavItem) {
                    invitacionesNavItem.click();
                }
            }
        });

        // Setup button event listeners
        this.setupButtonEventListeners();
    }

    /**
     * Configura los event listeners de los botones
     */
    setupButtonEventListeners() {
        // Usar delegación de eventos para botones que se crean dinámicamente
        document.addEventListener('click', (e) => {
            // Export CSV button
            if (e.target && (e.target.id === 'exportCsvBtn' || e.target.closest('#exportCsvBtn'))) {
                e.preventDefault();
                this.exportAllInvitations();
                return;
            }

            // Import CSV button
            if (e.target && (e.target.id === 'importCsvBtn' || e.target.closest('#importCsvBtn'))) {
                e.preventDefault();
                this.showImportModal();
                return;
            }
            
            // Create invitation button
            if (e.target && (e.target.id === 'createInvitationBtn' || e.target.closest('#createInvitationBtn'))) {
                e.preventDefault();
                this.showCreateModal();
                return;
            }

            // Manejo de acciones mediante data-action
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const code = actionBtn.dataset.code;
                const url = actionBtn.dataset.url;

                switch (action) {
                    case 'copy-link':
                        if (url) this.copyToClipboard(url);
                        break;
                    case 'open-link':
                        if (url) window.open(url, '_blank');
                        break;
                    case 'activate-invitation':
                        if (code) this.activateInvitation(code);
                        break;
                    case 'edit-invitation':
                        if (code) this.editInvitation(code);
                        break;
                    case 'deactivate-invitation':
                        if (code) this.deactivateInvitation(code);
                        break;
                    case 'generate-whatsapp':
                        if (code) this.generateWhatsAppMessage(code);
                        break;
                    case 'apply-filters':
                        this.applyFilters();
                        this.closeFiltersPopover();
                        break;
                    case 'clear-filters':
                        this.clearFilters();
                        break;
                }
            }
        });
    }

    /**
     * Carga todas las invitaciones
     */
    async loadInvitations() {
        try {
            // Construir parámetros para el backend
            const params = {
                page: this.state.page,
                limit: this.state.limit,
                search: this.state.search,
                includeInactive: true,
                ...this.mapFiltersToBackendParams()
            };

            // Pedir invitaciones paginadas al backend
            const result = await adminAPI.fetchInvitations(params);
            
            if (APIHelpers.isSuccess(result)) {
                const invitations = result.invitations || [];
                this.currentInvitations = invitations; // Guardar referencia
                
                this.state.pagination = result.pagination || {
                    page: 1,
                    limit: this.state.limit,
                    total: 0,
                    totalPages: 1
                };

                this.displayInvitations(invitations);
            } else {
                throw new Error(APIHelpers.getErrorMessage(result));
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
            showToast('Error al cargar invitaciones', 'error');
            this.displayInvitations([]);
        }
    }

    /**
     * Mapea los filtros locales a parámetros del backend
     */
    mapFiltersToBackendParams() {
        const params = {};
        const { status, passes, table, phone } = this.state.filters;

        // Mapeo de todos los filtros
        if (status) params.status = status;
        if (passes) params.passes = passes;
        if (table) params.table = table;
        if (phone) params.phone = phone;
        
        return params;
    }

    /**
     * Carga datos específicos de la sección de invitaciones
     */
    async loadInvitationsSectionData() {
        try {
            // Usar endpoint de estadísticas en lugar de calcular manualmente
            const result = await adminAPI.fetchStats();
            if (APIHelpers.isSuccess(result)) {
                const stats = result.data;
                const invitations = stats.invitations || {};
                
                // Usar datos directos del backend (estructura anidada)
                const totalInvitations = invitations.total;
                const confirmedInvitations = invitations.confirmed;
                const pendingInvitations = invitations.pending;
                const rejectedInvitations = invitations.cancelled;
                
                // Update stats cards in invitations section
                const confirmationRate = stats.rates?.confirmationRate;
                this.updateInvitationStats(totalInvitations, confirmedInvitations, pendingInvitations, rejectedInvitations, confirmationRate);
            } else {
                throw new Error(APIHelpers.getErrorMessage(result));
            }
        } catch (error) {
            console.error('Error loading invitations section data:', error);
            // Show empty state
            this.updateInvitationStats(0, 0, 0, 0);
        }
        
        // Load invitations for the table
        await this.loadInvitations();
    }

    /**
     * Actualiza las estadísticas de invitaciones
     */
    updateInvitationStats(total, confirmed, pending, rejected, confirmationRate) {
        const safeTotal = getSafeValue(total, 0);
        const safeConfirmed = getSafeValue(confirmed, 0);
        const safePending = getSafeValue(pending, 0);
        const safeRejected = getSafeValue(rejected, 0);
        
        // Use backend provided rate if available, otherwise calculate
        let safePercentage = 0;
        if (confirmationRate !== undefined && confirmationRate !== null) {
            safePercentage = parseFloat(confirmationRate);
        } else {
            const confirmedPercentage = safeTotal > 0 ? Math.round((safeConfirmed / safeTotal) * 100) : 0;
            safePercentage = getSafeValue(confirmedPercentage, 0);
        }
        
        // Prepare data for render service
        const statsData = {
            totalInvitations: safeTotal,
            confirmedInvitations: safeConfirmed,
            pendingInvitations: safePending,
            cancelledInvitations: safeRejected,
            confirmedChangePercentage: safePercentage
        };
        
        // Use render service to update stats
        if (window.renderService) {
            window.renderService.renderInvitationsStats(statsData);
        }
    }

    /**
     * Muestra las invitaciones en la tabla
     */
    displayInvitations(invitations) {
        const tbody = document.getElementById('invitationsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const { page, limit, total, totalPages } = this.state.pagination;
        
        // Calcular índices para mostrar "Mostrando X-Y de Z"
        const start = total === 0 ? 0 : (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        
        // Update pagination info display
        const showingFromEl = document.getElementById('showingFrom');
        const showingToEl = document.getElementById('showingTo');
        const totalCountEl = document.getElementById('totalCount');

        if (showingFromEl) showingFromEl.textContent = start;
        if (showingToEl) showingToEl.textContent = end;
        if (totalCountEl) totalCountEl.textContent = total;
        
        // Render table rows
        if (invitations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-search empty-state-icon"></i>
                            <p>No se encontraron invitaciones</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            invitations.forEach((invitation, index) => {
                const row = document.createElement('tr');
                // El índice global es (page-1)*limit + index
                const globalIndex = (page - 1) * limit + index;
                row.innerHTML = renderTableRow(invitation, 'recent', globalIndex);
                tbody.appendChild(row);
            });
        }
        
        // Update pagination controls
        updateTablePagination({
            currentPage: page,
            totalPages: totalPages,
            prevBtnId: 'prevPage',
            nextBtnId: 'nextPage',
            numbersContainerId: 'paginationNumbers',
            onPageChange: (newPage) => this.changePage(newPage)
        });
    }

    /**
     * Cambia de página
     */
    async changePage(newPage) {
        if (newPage < 1 || newPage > this.state.pagination.totalPages) return;
        this.state.page = newPage;
        await this.loadInvitations();
    }

    /**
     * Inicializa la paginación
     */
    initPagination() {
        const itemsPerPageSelect = document.getElementById('itemsPerPage');
        if (itemsPerPageSelect) {
            const savedItemsPerPage = localStorage.getItem('invitationsPerPage') || '10';
            itemsPerPageSelect.value = savedItemsPerPage;
            this.state.limit = parseInt(savedItemsPerPage);
            
            itemsPerPageSelect.addEventListener('change', async (e) => {
                const newItemsPerPage = parseInt(e.target.value);
                localStorage.setItem('invitationsPerPage', newItemsPerPage);
                
                this.state.limit = newItemsPerPage;
                this.state.page = 1; // Reset a primera página al cambiar límite
                await this.loadInvitations();
            });
        }
    }

    /**
     * Inicializa la búsqueda
     */
    initSearch() {
        const searchInput = document.getElementById('searchInput');
        let debounceTimer;
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value;
                
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                    this.state.search = searchTerm;
                    this.state.page = 1; // Reset a primera página al buscar
                    await this.loadInvitations();
                }, 300); // Debounce de 300ms
            });
        }
    }

    /**
     * Filtra invitaciones por término de búsqueda
     */

    /**
     * Ve los detalles de una invitación
     */
    async viewInvitation(code) {
        let invitation = this.currentInvitations.find(inv => inv.code === code);
        
        // Si no está en la página actual, intentar buscarla en el backend
        if (!invitation) {
            try {
                const result = await adminAPI.fetchInvitation(code);
                if (result.success) {
                    invitation = result.invitation;
                }
            } catch (error) {
                console.error('Error fetching invitation details:', error);
            }
        }

        if (!invitation) return;
        
        this.currentViewingCode = code; // Guardar referencia
        
        const invitationUrl = `${window.location.origin}/invitation?invitation=${code}`;
        
        // Store current invitation for editing
        window.currentEditingInvitation = invitation;
        
        this.renderInvitationViewMode(invitation, invitationUrl);
        this.invitationDetailModal.open();
    }

    /**
     * Renderiza el modo de vista de la invitación
     */
    renderInvitationViewMode(invitation, invitationUrl) {
        const statusBadgeInfo = getStatusBadge(invitation, { showIcon: false });
        
        const detailsContent = `
            <div class="invitation-detail-container">
                <div class="invitation-header">
                    <div class="header-badge">${statusBadgeInfo.html}</div>
                    <h2 class="guest-names-title">${formatGuestNames(invitation.guestNames)}</h2>
                </div>
                
                <div class="invitation-grid">
                    <!-- Columna Izquierda: Detalles de Invitación -->
                    <div class="detail-card">
                        <div class="info-list">
                            <div class="info-row">
                                <div class="info-icon"><i class="fas fa-ticket-alt"></i></div>
                                <div class="info-content">
                                    <span class="info-value">${invitation.numberOfPasses} pases</span>
                                </div>
                            </div>
                            
                            <div class="info-row">
                                <div class="info-icon"><i class="fas fa-chair"></i></div>
                                <div class="info-content">
                                    <span class="info-value">${invitation.tableNumber ? `Mesa ${invitation.tableNumber}` : 'Mesa sin asignar'}</span>
                                </div>
                            </div>
                            
                            <div class="info-row">
                                <div class="info-icon"><i class="fas fa-phone-alt"></i></div>
                                <div class="info-content">
                                    <span class="info-value">${invitation.phone || 'Sin teléfono'}</span>
                                </div>
                            </div>

                            <div class="copy-link-row">
                                <button class="copy-btn-small" data-action="copy-link" data-url="${invitationUrl}">
                                    <i class="fas fa-link"></i> Copiar enlace de invitación
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Columna Derecha: Estado de Confirmación -->
                    ${this.renderConfirmationStatus(invitation)}
                </div>
                
                <div class="modal-footer-actions">
                    <button class="btn action-btn btn-secondary-soft" data-action="open-link" data-url="${invitationUrl}">
                        <i class="fas fa-external-link-alt"></i> Ver Invitación
                    </button>
                    ${this.renderActionButtons(invitation)}
                </div>
            </div>
        `;
        
        this.invitationDetailModal.setContent(detailsContent);
    }

    /**
     * Renderiza el estado de confirmación
     */
    renderConfirmationStatus(invitation) {
        const isConfirmed = invitation.status === 'confirmed' || invitation.status === 'partial';
        const isCancelled = invitation.status === 'cancelled';
        const isPending = !isConfirmed && !isCancelled;
        
        let cardClass = 'pending';
        let content = '';
        
        if (isPending) {
            content = `
                <div class="empty-state-text">
                    <i class="fas fa-hourglass-half status-icon-large status-icon-pending"></i>
                    Aún no han confirmado su asistencia
                </div>
            `;
        } else if (isCancelled) {
            cardClass = 'cancelled'; // Podríamos definir estilos para esto si se desea
            content = `
                <div class="empty-state-text">
                    <i class="fas fa-times-circle status-icon-large status-icon-cancelled"></i>
                    Han declinado la invitación
                </div>
                ${invitation.generalMessage ? `
                <div class="info-list mt-3" style="margin-top: 1rem; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 1rem;">
                    <div class="info-row">
                        <div class="info-icon"><i class="far fa-comment-alt"></i></div>
                        <div class="info-content">
                            <span class="info-value message-text-detail">"${invitation.generalMessage}"</span>
                        </div>
                    </div>
                </div>` : ''}
            `;
        } else {
            cardClass = 'confirmed';
            content = `
                <div class="info-list">
                    <div class="info-row">
                        <div class="info-icon status-icon-success"><i class="fas fa-check"></i></div>
                        <div class="info-content">
                            <span class="info-value">${invitation.confirmedPasses} de ${invitation.numberOfPasses} confirmados</span>
                        </div>
                    </div>

                    ${invitation.confirmationDate ? `
                    <div class="info-row">
                        <div class="info-icon"><i class="far fa-clock"></i></div>
                        <div class="info-content">
                            <span class="info-value">${new Date(invitation.confirmationDate).toLocaleDateString('es-MX', { 
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}</span>
                        </div>
                    </div>` : ''}

                    ${invitation.generalMessage ? `
                    <div class="info-row">
                        <div class="info-icon"><i class="far fa-comment-alt"></i></div>
                        <div class="info-content">
                            <span class="info-value message-text-detail">"${invitation.generalMessage}"</span>
                        </div>
                    </div>` : ''}
                    
                    ${invitation.dietaryRestrictionsNames ? `
                    <div class="info-row">
                        <div class="info-icon status-icon-warning"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="info-content">
                            <span class="info-value">${invitation.dietaryRestrictionsNames}</span>
                            ${invitation.dietaryRestrictionsDetails ? `<span class="info-value dietary-details">(${invitation.dietaryRestrictionsDetails})</span>` : ''}
                        </div>
                    </div>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="detail-card confirmation-card ${cardClass}">
                <div class="card-title">
                    Estado de Confirmación
                </div>
                ${content}
            </div>
        `;
    }

    /**
     * Renderiza los botones de acción
     */
    renderActionButtons(invitation) {
        if (invitation.status === 'inactive') {
            return `
                <button class="btn action-btn btn-primary-soft" data-action="activate-invitation" data-code="${invitation.code}">
                    <i class="fas fa-check-circle"></i> Activar Invitación
                </button>
            `;
        } else {
            return `
                <button class="btn action-btn btn-success" data-action="generate-whatsapp" data-code="${invitation.code}">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn action-btn btn-primary" data-action="edit-invitation" data-code="${invitation.code}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn action-btn btn-danger" data-action="deactivate-invitation" data-code="${invitation.code}">
                    <i class="fas fa-power-off"></i> Desactivar
                </button>
            `;
        }
    }

    /**
     * Desactiva una invitación
     */
    async deactivateInvitation(code) {
        let invitation = this.currentInvitations.find(inv => inv.code === code);
        
        if (!invitation) {
             try {
                const result = await adminAPI.fetchInvitation(code);
                if (result.success) {
                    invitation = result.invitation;
                }
            } catch (error) {
                console.error('Error fetching invitation details:', error);
                return;
            }
        }

        if (!invitation) return;
        
        if (invitation.confirmed) {
            const confirmModal = ModalFactory.createConfirmModal({
                title: 'Advertencia: Invitación Confirmada',
                message: `Esta invitación ya fue confirmada por ${formatGuestNames(invitation.guestNames)}. ¿Estás seguro de que deseas desactivarla?`,
                confirmText: 'Sí, desactivar',
                confirmClass: 'danger',
                onConfirm: () => {
                    this.proceedWithDeactivation(code, invitation);
                }
            });
            
            window.activeModal = confirmModal;
            confirmModal.open();
        } else {
            this.proceedWithDeactivation(code, invitation);
        }
    }

    /**
     * Procede con la desactivación
     */
    async proceedWithDeactivation(code, invitation) {
        const deactivateModal = ModalFactory.createDeactivateInvitationModal(invitation);
        window.activeDeactivateModal = deactivateModal;
        
        window.confirmDeactivateInvitation = async () => {
            const deactivationReason = document.getElementById('deactivationReason').value.trim();
            
            try {
                // Usar DELETE para desactivación (soft delete) a través de adminAPI para incluir autenticación
                const result = await adminAPI.fetchWithErrorHandling(`/invitations/${code}`, {
                    method: 'DELETE',
                    body: JSON.stringify({
                        reason: deactivationReason
                    })
                });
                
                if (result.success) {
                    showToast('Invitación desactivada exitosamente', 'success');
                    
                    // Update local data
                    invitation.status = 'inactive';
                    invitation.cancelledAt = new Date().toISOString();
                    invitation.cancelledBy = 'admin';
                    invitation.cancellationReason = deactivationReason;
                    
                    // Close modals
                    deactivateModal.close();
                    if (this.invitationDetailModal) {
                        this.invitationDetailModal.close();
                    }
                    
                    // Reload data
                    await this.loadInvitations();
                    
                    // Notify other controllers if needed
                    this.notifyDataChange();
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

    /**
     * Activa una invitación
     */
    async activateInvitation(code) {
        let invitation = this.currentInvitations.find(inv => inv.code === code);
        
        if (!invitation) {
             try {
                const result = await adminAPI.fetchInvitation(code);
                if (result.success) {
                    invitation = result.invitation;
                }
            } catch (error) {
                console.error('Error fetching invitation details:', error);
                return;
            }
        }

        if (!invitation) return;
        
        const confirmModal = ModalFactory.createConfirmModal({
            title: 'Activar Invitación',
            message: `¿Estás seguro de activar la invitación de ${formatGuestNames(invitation.guestNames)}?`,
            confirmText: 'Activar',
            confirmClass: 'primary',
            onConfirm: async () => {
                try {
                    // Usar adminAPI para incluir autenticación
                    const result = await adminAPI.fetchWithErrorHandling(`/invitations/${code}/activate`, {
                        method: 'PUT'
                    });
                    
                    if (result.success) {
                        showToast('Invitación activada exitosamente', 'success');
                        
                        // Update local data
                        invitation.status = '';
                        invitation.cancelledAt = null;
                        invitation.cancelledBy = null;
                        invitation.cancellationReason = null;
                        
                        // Close modal if open
                        if (this.invitationDetailModal) {
                            this.invitationDetailModal.close();
                        }
                        
                        // Reload data
                        await this.loadInvitations();
                        
                        // Notify other controllers
                        this.notifyDataChange();
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

    /**
     * Edita una invitación
     */
    async editInvitation(code) {
        let invitation = this.currentInvitations.find(inv => inv.code === code);
        
        if (!invitation) {
             try {
                const result = await adminAPI.fetchInvitation(code);
                if (result.success) {
                    invitation = result.invitation;
                }
            } catch (error) {
                console.error('Error fetching invitation details:', error);
                return;
            }
        }

        if (!invitation) return;
        
        // Fetch current stats to validate limits
        let baseTotalPasses = 0;
        try {
            const statsResult = await adminAPI.fetchStats();
            if (APIHelpers.isSuccess(statsResult)) {
                // Total passes currently allocated in the system
                const currentTotal = statsResult.data.invitations.occupiedPasses || 0;
                
                // Calculate what this invitation is currently contributing to the occupied count
                let currentInvitationOccupancy = 0;
                const status = (invitation.status || '').toLowerCase();

                // Debug log para diagnosticar problemas de cálculo
                console.log('Diagnóstico Edición:', {
                    code: invitation.code,
                    originalStatus: invitation.status,
                    normalizedStatus: status,
                    numberOfPasses: invitation.numberOfPasses,
                    confirmedPasses: invitation.confirmedPasses,
                    currentTotalOccupied: currentTotal
                });

                if (status === 'confirmed' || status === 'pending') {
                    currentInvitationOccupancy = invitation.numberOfPasses;
                } else if (status === 'partial') {
                    currentInvitationOccupancy = invitation.confirmedPasses || 0;
                } else if (status !== 'cancelled' && status !== 'inactive' && status !== 'rejected') {
                    // Fallback seguro: si no es cancelada, asumimos que ocupa espacio
                    // Preferimos confirmedPasses si existe, sino numberOfPasses
                    currentInvitationOccupancy = invitation.confirmedPasses || invitation.numberOfPasses || 0;
                }
                
                console.log('Ocupación calculada a restar:', currentInvitationOccupancy);

                // Subtract current invitation occupancy because we are editing it
                baseTotalPasses = Math.max(0, currentTotal - currentInvitationOccupancy);
                console.log('Base Total Passes calculada:', baseTotalPasses);
            }
        } catch (error) {
            console.error('Error fetching stats for validation:', error);
        }

        window.activeModal = this.editInvitationModal;
        this.editInvitationModal.open();
        
        setTimeout(() => {
            this.initEditFormInModal(invitation, baseTotalPasses);
        }, 100);
    }

    /**
     * Genera y muestra el mensaje de WhatsApp
     */
    generateWhatsAppMessage(code) {
        let invitation = this.currentInvitations.find(inv => inv.code === code);
        
        // Si no está en la lista actual (ej. búsqueda), intentar usar la que se está editando/viendo
        if (!invitation && this.currentViewingCode === code) {
            // Recuperar del modal si es posible, o usar window.currentEditingInvitation
            invitation = window.currentEditingInvitation;
        }

        if (!invitation) {
            console.error('Invitación no encontrada para generar mensaje');
            return;
        }

        const names = formatGuestNames(invitation.guestNames);
        const passes = invitation.numberOfPasses;
        const url = `${window.location.origin}/invitation?invitation=${code}`;
        
        // Usar la plantilla de configuración si existe
        let message = '';
        if (WEDDING_CONFIG.whatsapp && typeof WEDDING_CONFIG.whatsapp.invitationMessage === 'function') {
            message = WEDDING_CONFIG.whatsapp.invitationMessage(names, passes, url);
        } else {
            // Fallback
            message = `Hola ${names}, los invitamos a nuestra boda. Aquí está su invitación: ${url}`;
        }

        this.showWhatsAppModal(message);
    }

    /**
     * Muestra el modal con el mensaje de WhatsApp
     */
    showWhatsAppModal(message) {
        const modal = ModalFactory.createWhatsAppModal(message);
        window.activeModal = modal;
        modal.open();
    }

    /**
     * Copia texto al portapapeles
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Enlace copiado al portapapeles', 'success');
        } catch (err) {
            console.error('Error al copiar:', err);
            showToast('Error al copiar enlace', 'error');
        }
    }

    /**
     * Inicializa la carga de CSV
     */
    initCsvUpload() {
        // Esta función se llama desde init() pero los handlers se configuran cuando se abre el modal
        console.log('CSV upload system ready');
    }


    /**
     * Notifica cambios de datos a otros controladores
     */
    notifyDataChange() {
        // Dispatch custom event for other controllers to listen
        document.dispatchEvent(new CustomEvent('invitationDataChanged'));
    }

    /**
     * Exporta todas las invitaciones
     */
    async exportAllInvitations() {
        const result = await adminAPI.downloadInvitationsCSV();
        if (result.success) {
            showToast('Archivo CSV descargado exitosamente', 'success');
        } else {
            showToast('Error al descargar el archivo CSV', 'error');
        }
    }

    /**
     * Muestra el modal de creación
     */
    showCreateModal() {
        window.activeModal = this.createInvitationModal;
        this.createInvitationModal.open();
        
        setTimeout(() => {
            this.initCreateFormInModal();
        }, 100);
    }

    /**
     * Cierra el modal de creación
     */
    closeCreateModal() {
        this.createInvitationModal.close();
        const form = document.getElementById('createInvitationForm');
        if (form) {
            form.reset();
        }
    }

    /**
     * Muestra el modal de importación
     */
    showImportModal() {
        window.activeModal = this.importCsvModal;
        this.importCsvModal.open();
        
        setTimeout(() => {
            this.initCsvUploadHandlers();
        }, 100);
    }

    /**
     * Cierra el modal de importación
     */
    closeImportModal() {
        this.importCsvModal.close();
        
        // Usar la función de limpieza centralizada si existe
        if (typeof window.clearFileSelection === 'function') {
            window.clearFileSelection();
        } else {
            // Fallback de limpieza manual
            const csvFile = document.getElementById('csvFile');
            const fileName = document.getElementById('fileName');
            const fileSelectedInfo = document.getElementById('fileSelectedInfo');
            const uploadBtn = document.getElementById('uploadCsvBtn');
            const csvResults = document.getElementById('csvResults');
            const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
            
            if (csvFile) csvFile.value = '';
            if (fileName) fileName.textContent = '';
            
            if (fileUploadWrapper) {
                fileUploadWrapper.style.display = 'flex';
                fileUploadWrapper.classList.remove('drag-over');
            }

            if (fileSelectedInfo) {
                fileSelectedInfo.style.display = 'none';
                fileSelectedInfo.classList.remove('show');
            }
            
            if (uploadBtn) {
                uploadBtn.disabled = true;
                // Asegurar que el botón vuelva a su estado original si estaba cargando
                uploadBtn.innerHTML = '<span class="material-symbols-outlined btn-icon">upload</span>Importar';
            }
            
            if (csvResults) {
                csvResults.innerHTML = '';
                csvResults.classList.remove('show', 'success', 'error');
            }
            
            window.selectedCsvFile = null;
        }
    }

    /**
     * Inicializa el formulario de creación en el modal
     */
    initCreateFormInModal() {
        const form = document.getElementById('createInvitationForm');
        if (!form) return;
        
        // Setup guest fields logic
        this.setupGuestFieldsLogic('numberOfPasses', 'guestFields', 'guestFieldsContainer');
        
        // Handle form submit
        form.onsubmit = (e) => this.handleCreateSubmit(e);
        
        // Trigger initial guest fields generation
        const passesInput = document.getElementById('numberOfPasses');
        if (passesInput) {
            passesInput.dispatchEvent(new Event('input'));
        }
    }

    /**
     * Inicializa el formulario de edición en el modal
     */
    initEditFormInModal(invitation, baseTotalPasses = 0) {
        const form = document.getElementById('editInvitationForm');
        if (!form) return;
        
        // Guardar baseTotalPasses para validación en submit
        form.dataset.baseTotalPasses = baseTotalPasses;

        // Fill form data
        document.getElementById('editInvitationCode').value = invitation.code;
        document.getElementById('editNumberOfPasses').value = invitation.numberOfPasses;
        document.getElementById('editTableNumber').value = invitation.tableNumber || '';
        document.getElementById('editPhone').value = invitation.phone || '';
        
        // Inicializar selector de estado
        const statusSelect = document.getElementById('editStatus');
        if (statusSelect) {
            // Mapear estado actual a opciones disponibles
            let currentStatus = invitation.status;
            if (currentStatus === 'partial') currentStatus = 'confirmed'; // Simplificación para UI
            if (!['pending', 'confirmed', 'cancelled'].includes(currentStatus)) currentStatus = 'pending';
            
            statusSelect.value = currentStatus;
            
            // Listener para cambios en el estado
            statusSelect.addEventListener('change', (e) => {
                const newStatus = e.target.value;
                const checkboxes = document.querySelectorAll('.guest-attendance-check');
                
                if (newStatus === 'confirmed') {
                    checkboxes.forEach(cb => cb.checked = true);
                } else {
                    // Si es pending o cancelled, desmarcar todos
                    checkboxes.forEach(cb => cb.checked = false);
                }
            });
        }

        // Preparar datos iniciales de invitados
        const initialGuests = [];
        const guestNames = invitation.guestNames || [];
        const adultCount = invitation.adultPasses || 0;
        const childCount = invitation.childPasses || 0;
        const staffCount = invitation.staffPasses || 0;
        const confirmedPasses = invitation.confirmedPasses || 0;
        
        // Asignar tipos y asistencia de la mejor manera posible
        guestNames.forEach((name, index) => {
            // Lógica simple de asignación de tipos: primeros N son adultos, siguientes M son niños, siguientes S son staff
            // Si no hay desglose, asumir todos adultos
            let type = 'adult';
            if (adultCount > 0 || childCount > 0 || staffCount > 0) {
                if (index < adultCount) {
                    type = 'adult';
                } else if (index < (adultCount + childCount)) {
                    type = 'child';
                } else if (index < (adultCount + childCount + staffCount)) {
                    type = 'staff';
                }
            }
            
            // Lógica de asistencia: si la invitación está confirmada, asumir los primeros N como asistentes
            const isAttending = (invitation.status === 'confirmed' || invitation.status === 'partial') && index < confirmedPasses;
            
            initialGuests.push({
                name: name,
                type: type,
                attending: isAttending
            });
        });

        // Setup guest fields logic with initial guests
        this.setupGuestFieldsLogic('editNumberOfPasses', 'editGuestFields', 'editGuestFieldsContainer', initialGuests, baseTotalPasses);
        
        // Listener para cambios en checkboxes de asistencia (delegación)
        const guestFieldsContainer = document.getElementById('editGuestFields');
        if (guestFieldsContainer) {
            guestFieldsContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('guest-attendance-check')) {
                    const checkboxes = guestFieldsContainer.querySelectorAll('.guest-attendance-check');
                    const total = checkboxes.length;
                    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
                    const statusSelect = document.getElementById('editStatus');
                    
                    if (statusSelect) {
                        if (checked === 0) {
                            // Si desmarcan todos, sugerir Cancelada (Rechazada)
                            // El usuario puede cambiarlo manualmente a Pendiente si lo desea
                            statusSelect.value = 'cancelled';
                        } else {
                            // Si hay al menos uno, es Confirmada (o Parcial, pero en UI simple usamos Confirmada)
                            statusSelect.value = 'confirmed';
                        }
                    }
                }
            });
        }
        
        // Handle form submit
        form.onsubmit = (e) => this.handleEditSubmit(e);
        
        // Trigger initial guest fields generation
        const passesInput = document.getElementById('editNumberOfPasses');
        if (passesInput) {
            passesInput.dispatchEvent(new Event('input'));
        }
    }

    /**
     * Configura la lógica de los campos de invitados
     */
    setupGuestFieldsLogic(passesInputId, containerId, wrapperId, initialGuests = [], baseTotalPasses = 0) {
        const passesInput = document.getElementById(passesInputId);
        const container = document.getElementById(containerId);
        const legendContainer = document.getElementById('editPassesLegend');
        
        if (!passesInput || !container) return;
        
        // Constantes de configuración
        const MAX_GUESTS_PER_INVITATION = WEDDING_CONFIG.guests?.maxGuestsPerInvitation || 10;
        const GLOBAL_TARGET_TOTAL = WEDDING_CONFIG.guests?.targetTotal || 100;
        const ALLOW_CHILDREN = WEDDING_CONFIG.guests?.allowChildren !== false; // Default true

        // Remove existing listeners to avoid duplicates
        const newPassesInput = passesInput.cloneNode(true);
        // Preservar el valor actual ya que cloneNode no copia el valor dinámico
        newPassesInput.value = passesInput.value;
        passesInput.parentNode.replaceChild(newPassesInput, passesInput);
        
        // Mantener estado de invitados conocidos
        // Si initialGuests es array de strings (caso legacy/create), convertir a objetos
        let knownGuests = initialGuests.map(g => {
            if (typeof g === 'string') return { name: g, type: 'adult', attending: false };
            return g;
        });
        
        newPassesInput.addEventListener('input', (e) => {
            const requestedCount = parseInt(e.target.value) || 0;
            
            // 1. Actualizar estado con lo que hay actualmente en el DOM
            const currentNameInputs = container.querySelectorAll('.guest-name-input');
            const currentTypeSelects = container.querySelectorAll('.guest-type-select');
            const currentAttendChecks = container.querySelectorAll('.guest-attendance-check');
            
            currentNameInputs.forEach((input, index) => {
                if (!knownGuests[index]) knownGuests[index] = { name: '', type: 'adult', attending: false };
                knownGuests[index].name = input.value;
                if (currentTypeSelects[index]) knownGuests[index].type = currentTypeSelects[index].value;
                if (currentAttendChecks[index]) knownGuests[index].attending = currentAttendChecks[index].checked;
            });

            // Cálculos de límites
            const remainingGlobalSlots = Math.max(0, GLOBAL_TARGET_TOTAL - baseTotalPasses);
            const effectiveLimit = Math.min(MAX_GUESTS_PER_INVITATION, remainingGlobalSlots);
            
            // Validaciones
            const exceedsGlobal = (baseTotalPasses + requestedCount) > GLOBAL_TARGET_TOTAL;
            const exceedsPerInvitation = requestedCount > MAX_GUESTS_PER_INVITATION;
            const isExceeded = exceedsGlobal || exceedsPerInvitation;
            
            // Determinar cuántos inputs mostrar
            // Mostrar siempre lo que el usuario pide, aunque exceda el límite, para mejor UX
            const inputsToShow = requestedCount;

            // Actualizar leyenda y mensajes de error
            const warningId = `${wrapperId}-warning`;
            let warningEl = document.getElementById(warningId);

            if (legendContainer) {
                legendContainer.innerHTML = '<i class="fas fa-info-circle"></i> Cambiar el número de pases ajustará los campos de invitados';
                legendContainer.className = 'form-hint mt-1 text-info';
                legendContainer.style.color = '#17a2b8';
            }

            if (isExceeded) {
                let errorMessage = '';
                if (exceedsGlobal) {
                    errorMessage = `Solo quedan ${remainingGlobalSlots} lugares disponibles en el evento.`;
                } else if (exceedsPerInvitation) {
                    errorMessage = `El límite máximo es de ${MAX_GUESTS_PER_INVITATION} invitados por invitación.`;
                }

                if (!warningEl) {
                    warningEl = document.createElement('div');
                    warningEl.id = warningId;
                    warningEl.className = 'alert alert-danger mt-2';
                    warningEl.style.fontSize = '0.85rem';
                    warningEl.style.padding = '8px';
                    container.parentNode.appendChild(warningEl);
                }
                warningEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
                
                if (legendContainer) {
                    legendContainer.innerHTML = '<i class="fas fa-exclamation-circle"> </i> Oh no! has excedido el límite de la meta de invitados';
                    legendContainer.className = 'form-hint mt-1 text-danger font-weight-bold';
                    legendContainer.style.color = '#dc3545';
                }
            } else {
                if (warningEl) warningEl.remove();
            }

            // Controlar botón de submit
            const form = newPassesInput.closest('form');
            const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
            
            if (submitBtn) {
                // NO deshabilitar por límites (isExceeded), permitir que el usuario intente guardar y reciba feedback
                // Solo deshabilitar si hay inconsistencia técnica grave
                submitBtn.disabled = false; 
            }

            // Renderizar inputs
            container.innerHTML = '';
            
            for (let i = 0; i < inputsToShow; i++) {
                const guest = knownGuests[i] || { name: '', type: 'adult', attending: false };
                
                let typeFieldHtml = '';
                // Siempre mostrar selector de tipo si allowChildren es true, o si es staff
                // Si allowChildren es false, solo mostrar Adulto/Staff
                
                const showChildOption = ALLOW_CHILDREN;
                
                typeFieldHtml = `
                    <div class="col-3">
                        <select class="form-control guest-type-select" style="padding: 8px; height: 38px;">
                            <option value="adult" ${guest.type === 'adult' ? 'selected' : ''}>Adulto</option>
                            ${showChildOption ? `<option value="child" ${guest.type === 'child' ? 'selected' : ''}>Niño</option>` : ''}
                            <option value="staff" ${guest.type === 'staff' ? 'selected' : ''}>Staff</option>
                        </select>
                    </div>
                `;

                // Solo mostrar checkbox de asistencia en modo edición (cuando hay wrapperId específico de edición)
                const isEditMode = wrapperId === 'editGuestFieldsContainer';
                let attendanceHtml = '';
                
                if (isEditMode) {
                    attendanceHtml = `
                        <div class="col-auto d-flex align-items-center justify-content-center" style="width: 40px;">
                            <div class="checkbox-wrapper" title="Marcar si asistirá" style="margin: 0;">
                                <input type="checkbox" class="guest-attendance-check" ${guest.attending ? 'checked' : ''} style="width: 20px; height: 20px;">
                            </div>
                        </div>
                    `;
                }

                const fieldHtml = `
                    <div class="guest-field-row row g-2 align-items-center mb-2">
                        <div class="col">
                            <input type="text" class="form-control guest-name-input" 
                                   placeholder="Nombre del invitado ${i + 1}" 
                                   value="${guest.name}" required style="height: 38px;">
                        </div>
                        ${typeFieldHtml}
                        ${attendanceHtml}
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', fieldHtml);
            }
        });
    }

    /**
     * Maneja el envío del formulario de creación
     */
    async handleCreateSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
            
            // Gather data
            const numberOfPasses = parseInt(document.getElementById('numberOfPasses').value);
            const tableNumber = document.getElementById('tableNumber').value;
            const phone = document.getElementById('phone').value;
            
            // Get guest data
            const guestNameInputs = form.querySelectorAll('.guest-name-input');
            const guestTypeSelects = form.querySelectorAll('.guest-type-select');
            
            const guestNames = [];
            let adultPasses = 0;
            let childPasses = 0;
            let staffPasses = 0;
            
            guestNameInputs.forEach((input, index) => {
                const name = input.value.trim();
                if (name) {
                    guestNames.push(name);
                    const type = guestTypeSelects[index] ? guestTypeSelects[index].value : 'adult';
                    if (type === 'child') childPasses++;
                    else if (type === 'staff') staffPasses++;
                    else adultPasses++;
                }
            });
            
            if (guestNames.length === 0) {
                throw new Error('Debes ingresar al menos un nombre de invitado');
            }
            
            const invitationData = {
                guestNames,
                numberOfPasses,
                adultPasses,
                childPasses,
                staffPasses,
                tableNumber: tableNumber ? parseInt(tableNumber) : null,
                phone: phone || null
            };
            
            const result = await adminAPI.createInvitation(invitationData);
            
            if (result.success) {
                showToast('Invitación creada exitosamente', 'success');
                this.createInvitationModal.close();
                await this.loadInvitations();
                this.notifyDataChange();
            } else {
                throw new Error(result.error || 'Error al crear la invitación');
            }
            
        } catch (error) {
            console.error('Error creating invitation:', error);
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    /**
     * Maneja el envío del formulario de edición
     */
    async handleEditSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        try {
            // Gather data first to use in validation
            const numberOfPasses = parseInt(document.getElementById('editNumberOfPasses').value);
            const baseTotalPasses = parseInt(form.dataset.baseTotalPasses || 0);
            const GLOBAL_TARGET_TOTAL = WEDDING_CONFIG.guests?.targetTotal || 100;
            const MAX_GUESTS_PER_INVITATION = WEDDING_CONFIG.guests?.maxGuestsPerInvitation || 10;
            const status = document.getElementById('editStatus').value;

            // Get guest data
            const guestNameInputs = form.querySelectorAll('.guest-name-input');
            const guestTypeSelects = form.querySelectorAll('.guest-type-select');
            const guestAttendChecks = form.querySelectorAll('.guest-attendance-check');
            
            const guestNames = [];
            let adultPasses = 0;
            let childPasses = 0;
            let staffPasses = 0;
            let confirmedPasses = 0;
            
            guestNameInputs.forEach((input, index) => {
                const name = input.value.trim();
                if (name) {
                    guestNames.push(name);
                    
                    // Contar tipos
                    const type = guestTypeSelects[index] ? guestTypeSelects[index].value : 'adult';
                    if (type === 'child') childPasses++;
                    else if (type === 'staff') staffPasses++;
                    else adultPasses++;
                    
                    // Contar asistencia
                    if (guestAttendChecks[index] && guestAttendChecks[index].checked) {
                        confirmedPasses++;
                    }
                }
            });

            // Validaciones de negocio inteligentes
            let occupancyToValidate = numberOfPasses; // Default: worst case (pending)

            if (status === 'confirmed' || status === 'partial') {
                // Si ya está confirmada/parcial, validamos contra lo que REALMENTE ocupan (confirmados)
                occupancyToValidate = confirmedPasses;
            } else if (status === 'cancelled' || status === 'inactive' || status === 'rejected') {
                occupancyToValidate = 0;
            }
            // Si es 'pending', mantenemos numberOfPasses porque podrían confirmar todos

            if ((baseTotalPasses + occupancyToValidate) > GLOBAL_TARGET_TOTAL) {
                const remaining = Math.max(0, GLOBAL_TARGET_TOTAL - baseTotalPasses);
                showToast(`No se puede guardar: Excedes el límite del evento. Solo quedan ${remaining} lugares disponibles (intentas ocupar ${occupancyToValidate}).`, 'error');
                return;
            }

            if (numberOfPasses > MAX_GUESTS_PER_INVITATION) {
                showToast(`No se puede guardar: El límite es de ${MAX_GUESTS_PER_INVITATION} personas por invitación.`, 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            
            const code = document.getElementById('editInvitationCode').value;
            const tableNumber = document.getElementById('editTableNumber').value;
            const phone = document.getElementById('editPhone').value;
            // status ya lo tenemos
            
            if (guestNames.length === 0) {
                throw new Error('Debes ingresar al menos un nombre de invitado');
            }
            
            const updateData = {
                guestNames,
                numberOfPasses,
                adultPasses,
                childPasses,
                staffPasses,
                confirmedPasses,
                status: status, // Usar el estado seleccionado explícitamente
                tableNumber: tableNumber ? parseInt(tableNumber) : null,
                phone: phone || null
            };

            // Refinar estado si es 'confirmed' pero no todos asisten -> 'partial'
            if (status === 'confirmed' && confirmedPasses < numberOfPasses && confirmedPasses > 0) {
                updateData.status = 'partial';
            }
            
            const result = await adminAPI.updateInvitation(code, updateData);
            
            if (result.success) {
                showToast('Invitación actualizada exitosamente', 'success');
                this.editInvitationModal.close();
                await this.loadInvitations();
                this.notifyDataChange();
                
                // Si estamos viendo los detalles de esta invitación, actualizar la vista
                if (this.currentViewingCode === code) {
                    const updatedInvitation = this.currentInvitations.find(inv => inv.code === code);
                    if (updatedInvitation) {
                        const invitationUrl = `${window.location.origin}/invitation?invitation=${code}`;
                        this.renderInvitationViewMode(updatedInvitation, invitationUrl);
                        // No necesitamos llamar a open() si ya está abierto, renderInvitationViewMode actualiza el contenido
                    }
                }
            } else {
                throw new Error(result.error || 'Error al actualizar la invitación');
            }
            
        } catch (error) {
            console.error('Error updating invitation:', error);
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    /**
     * Inicializa los handlers de carga CSV
     */
    initCsvUploadHandlers() {
        const csvFile = document.getElementById('csvFile');
        const fileSelectedInfo = document.getElementById('fileSelectedInfo');
        const fileName = document.getElementById('fileName');
        const uploadBtn = document.getElementById('uploadCsvBtn');
        const csvResults = document.getElementById('csvResults');
        
        if (!csvFile) return;
        
        // File input change handler
        csvFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            this.handleFileSelection(file);
        });
        
        // Upload button click handler
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                if (window.selectedCsvFile) {
                    this.processCsvFile(window.selectedCsvFile);
                }
            });
        }
        
        // Drag and drop handlers
        const uploadWrapper = csvFile.closest('.file-upload-wrapper');
        if (uploadWrapper) {
            uploadWrapper.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadWrapper.classList.add('drag-over');
            });
            
            uploadWrapper.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadWrapper.classList.remove('drag-over');
            });
            
            uploadWrapper.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadWrapper.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        csvFile.files = files;
                        this.handleFileSelection(file);
                    } else {
                        showToast('Por favor selecciona un archivo CSV válido', 'error');
                    }
                }
            });
        }
        
        // Clear file selection function
        window.clearFileSelection = () => {
            csvFile.value = '';
            if (fileName) fileName.textContent = '';
            
            const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
            if (fileUploadWrapper) {
                fileUploadWrapper.style.display = 'flex';
            }

            if (fileSelectedInfo) {
                fileSelectedInfo.style.display = 'none';
                fileSelectedInfo.classList.remove('show');
            }
            if (uploadBtn) uploadBtn.disabled = true;
            if (csvResults) {
                csvResults.innerHTML = '';
                csvResults.classList.remove('show', 'success', 'error');
            }
            window.selectedCsvFile = null;
        };
        
        console.log('CSV upload handlers initialized');
    }

    /**
     * Maneja la selección de archivo
     */
    handleFileSelection(file) {
        if (!file) return;
        
        if (!file.name.endsWith('.csv')) {
            showToast('Por favor selecciona un archivo CSV válido', 'error');
            return;
        }
        
        const fileName = document.getElementById('fileName');
        const fileSelectedInfo = document.getElementById('fileSelectedInfo');
        const uploadBtn = document.getElementById('uploadCsvBtn');
        const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
        
        if (fileName) fileName.textContent = file.name;
        
        if (fileUploadWrapper) {
            fileUploadWrapper.style.display = 'none';
        }

        if (fileSelectedInfo) {
            fileSelectedInfo.style.display = 'flex';
            fileSelectedInfo.classList.add('show');
        }
        if (uploadBtn) uploadBtn.disabled = false;
        
        // Store file reference
        window.selectedCsvFile = file;
        
        console.log('File selected:', file.name);
    }

    /**
     * Procesa el archivo CSV usando el backend
     */
    async processCsvFile(file) {
        const csvResults = document.getElementById('csvResults');
        const uploadBtn = document.getElementById('uploadCsvBtn');
        
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="material-symbols-outlined btn-icon">hourglass_empty</span>Procesando...';
        }
        
        try {
            const csvContent = await file.text();
            
            if (!csvContent.trim()) {
                throw new Error('El archivo CSV está vacío');
            }
            
            // Use adminAPI to import CSV (sends to correct endpoint with proper format)
            const result = await adminAPI.importInvitations(csvContent);
            
            if (result.success) {
                // Cerrar modal y limpiar selección (esto también limpia los inputs)
                this.closeImportModal();
                
                // Reload invitations
                await this.loadInvitations();
                this.notifyDataChange();
                
                showToast(`${result.created} invitaciones importadas exitosamente`, 'success');
            } else {
                throw new Error(result.errors?.[0] || 'Error al procesar las invitaciones');
            }
            
        } catch (error) {
            console.error('Error processing CSV:', error);
            this.showCsvResults({ error: error.message }, 'error');
            showToast(error.message || 'Error al procesar el archivo CSV', 'error');
        } finally {
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<span class="material-symbols-outlined btn-icon">upload</span>Importar';
            }
        }
    }


    /**
     * Muestra los resultados del CSV
     */
    showCsvResults(result, type) {
        const csvResults = document.getElementById('csvResults');
        if (!csvResults) return;
        
        csvResults.classList.remove('show', 'success', 'error');
        
        if (type === 'success') {
            csvResults.innerHTML = `
                <div class="csv-success">
                    <i class="fas fa-check-circle"></i>
                    <h4>¡Importación exitosa!</h4>
                    <p>${result.created} invitaciones creadas correctamente</p>
                    ${result.duplicates > 0 ? `<p class="warning">⚠️ ${result.duplicates} invitaciones duplicadas omitidas</p>` : ''}
                </div>
            `;
            csvResults.classList.add('show', 'success');
        } else {
            csvResults.innerHTML = `
                <div class="csv-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error en la importación</h4>
                    <p>${result.error}</p>
                </div>
            `;
            csvResults.classList.add('show', 'error');
        }
    }

    /**
     * Alterna la visibilidad de los filtros (nuevo comportamiento de popover)
     */
    toggleFilters() {
        const filtersPanel = document.getElementById('filtersPanel');
        const toggleBtn = document.getElementById('filtersToggleBtn');
        const backdrop = document.getElementById('filtersBackdrop');
        
        if (!filtersPanel || !toggleBtn) return;
        
        const isVisible = filtersPanel.classList.contains('show');
        
        if (isVisible) {
            this.closeFiltersPopover();
        } else {
            this.openFiltersPopover();
        }
    }

    /**
     * Abre el popover de filtros
     */
    openFiltersPopover() {
        const filtersPanel = document.getElementById('filtersPanel');
        const toggleBtn = document.getElementById('filtersToggleBtn');
        const backdrop = document.getElementById('filtersBackdrop');
        
        if (!filtersPanel || !toggleBtn) return;
        
        // Block body scroll
        document.body.style.overflow = 'hidden';
        
        // Show backdrop
        if (backdrop) {
            backdrop.classList.add('show');
        }
        
        // Show panel with animation
        filtersPanel.classList.add('show');
        toggleBtn.classList.add('active');
        
        // Initialize filter event listeners if not already done
        this.initializeFilterListeners();
        
        // Setup close handlers
        this.setupFiltersCloseHandlers();
        
        // Focus first filter for accessibility
        setTimeout(() => {
            const firstFilter = filtersPanel.querySelector('.filter-select');
            if (firstFilter) {
                firstFilter.focus();
            }
        }, 200);
    }

    /**
     * Cierra el popover de filtros
     */
    closeFiltersPopover() {
        const filtersPanel = document.getElementById('filtersPanel');
        const toggleBtn = document.getElementById('filtersToggleBtn');
        const backdrop = document.getElementById('filtersBackdrop');
        
        if (!filtersPanel || !toggleBtn) return;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Hide panel with animation
        filtersPanel.classList.remove('show');
        toggleBtn.classList.remove('active');
        
        // Hide backdrop
        if (backdrop) {
            backdrop.classList.remove('show');
        }
        
        // Remove close handlers
        this.removeFiltersCloseHandlers();
    }

    /**
     * Configura los handlers para cerrar el popover
     */
    setupFiltersCloseHandlers() {
        // Avoid duplicate handlers
        if (this.filtersCloseHandlersSetup) return;
        this.filtersCloseHandlersSetup = true;
        
        const backdrop = document.getElementById('filtersBackdrop');
        const filtersPanel = document.getElementById('filtersPanel');
        
        // Close on backdrop click
        this.backdropClickHandler = (e) => {
            if (e.target === backdrop) {
                this.closeFiltersPopover();
            }
        };
        
        // Close on escape key
        this.escapeKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeFiltersPopover();
            }
        };
        
        // Close on close button click
        this.closeButtonHandler = (e) => {
            if (e.target.matches('[data-action="close-filters"]') || 
                e.target.closest('[data-action="close-filters"]')) {
                e.preventDefault();
                this.closeFiltersPopover();
            }
        };
        
        // Add event listeners
        if (backdrop) {
            backdrop.addEventListener('click', this.backdropClickHandler);
        }
        document.addEventListener('keydown', this.escapeKeyHandler);
        document.addEventListener('click', this.closeButtonHandler);
    }

    /**
     * Remueve los handlers de cierre del popover
     */
    removeFiltersCloseHandlers() {
        if (!this.filtersCloseHandlersSetup) return;
        
        const backdrop = document.getElementById('filtersBackdrop');
        
        // Remove event listeners
        if (backdrop && this.backdropClickHandler) {
            backdrop.removeEventListener('click', this.backdropClickHandler);
        }
        if (this.escapeKeyHandler) {
            document.removeEventListener('keydown', this.escapeKeyHandler);
        }
        if (this.closeButtonHandler) {
            document.removeEventListener('click', this.closeButtonHandler);
        }
        
        // Reset flag
        this.filtersCloseHandlersSetup = false;
    }

    /**
     * Inicializa los event listeners de los filtros
     */
    initializeFilterListeners() {
        // Avoid duplicate listeners
        if (this.filtersInitialized) return;
        this.filtersInitialized = true;
        
        // Ya no aplicamos filtros automáticamente al cambiar (change event)
        // Ahora se requiere confirmación explícita con el botón "Aplicar Filtros"
    }

    /**
     * Aplica los filtros seleccionados
     */
    async applyFilters() {
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const passesFilter = document.getElementById('passesFilter')?.value || '';
        const tableFilter = document.getElementById('tableFilter')?.value || '';
        const phoneFilter = document.getElementById('phoneFilter')?.value || '';
        
        // Actualizar estado de filtros
        this.state.filters = {
            status: statusFilter,
            passes: passesFilter,
            table: tableFilter,
            phone: phoneFilter
        };
        
        this.state.page = 1; // Reset a primera página al filtrar
        await this.loadInvitations();
        
        // Update filter button state
        this.updateFilterButtonState();
        
        // Show filter results info
        this.showFilterResultsInfo(this.state.pagination.total);
    }

    /**
     * Limpia todos los filtros
     */
    async clearFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const passesFilter = document.getElementById('passesFilter');
        const tableFilter = document.getElementById('tableFilter');
        const phoneFilter = document.getElementById('phoneFilter');
        
        // Reset all filter values
        if (statusFilter) statusFilter.value = '';
        if (passesFilter) passesFilter.value = '';
        if (tableFilter) tableFilter.value = '';
        if (phoneFilter) phoneFilter.value = '';
        
        // Apply filters (which will now show all invitations)
        await this.applyFilters();
        
        // Hide filter results info
        this.hideFilterResultsInfo();
        
        showToast('Filtros limpiados', 'success');
    }

    /**
     * Actualiza el estado visual del botón de filtros
     */
    updateFilterButtonState() {
        const toggleBtn = document.getElementById('filtersToggleBtn');
        if (!toggleBtn) return;
        
        const hasActiveFilters = this.hasActiveFilters();
        
        if (hasActiveFilters) {
            toggleBtn.classList.add('filters-active');
            
            // Add filter count badge if not exists
            let badge = toggleBtn.querySelector('.filter-count-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'filter-count-badge';
                toggleBtn.appendChild(badge);
            }
            badge.textContent = this.getActiveFilterCount();
        } else {
            toggleBtn.classList.remove('filters-active');
            
            // Remove badge
            const badge = toggleBtn.querySelector('.filter-count-badge');
            if (badge) {
                badge.remove();
            }
        }
    }

    /**
     * Verifica si hay filtros activos
     */
    hasActiveFilters() {
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const passesFilter = document.getElementById('passesFilter')?.value || '';
        const tableFilter = document.getElementById('tableFilter')?.value || '';
        const phoneFilter = document.getElementById('phoneFilter')?.value || '';
        
        return statusFilter || passesFilter || tableFilter || phoneFilter;
    }

    /**
     * Cuenta los filtros activos
     */
    getActiveFilterCount() {
        let count = 0;
        
        if (document.getElementById('statusFilter')?.value) count++;
        if (document.getElementById('passesFilter')?.value) count++;
        if (document.getElementById('tableFilter')?.value) count++;
        if (document.getElementById('phoneFilter')?.value) count++;
        
        return count;
    }

    /**
     * Muestra información de resultados de filtros
     */
    showFilterResultsInfo(resultCount) {
        // En paginación server-side, resultCount es el total de resultados filtrados
        // Y totalCount sería el total absoluto de invitaciones (que podríamos guardar en el estado si el backend lo enviara)
        // Por ahora, simplificamos mostrando solo si hay filtros activos
        
        if (!this.hasActiveFilters() && !this.state.search) {
            this.hideFilterResultsInfo();
            return;
        }
        
        // Create or update results info
        let resultsInfo = document.querySelector('.filters-results-info');
        if (!resultsInfo) {
            resultsInfo = document.createElement('div');
            resultsInfo.className = 'filters-results-info';
            
            // Insert after filters panel
            const filtersPanel = document.getElementById('filtersPanel');
            if (filtersPanel && filtersPanel.parentNode) {
                filtersPanel.parentNode.insertBefore(resultsInfo, filtersPanel.nextSibling);
            }
        }
        
        resultsInfo.innerHTML = `
            <i class="fas fa-filter"></i>
            Mostrando ${resultCount} de ${totalCount} invitaciones
            <span class="clear-filters-link" data-action="clear-filters">Limpiar filtros</span>
        `;
        
        resultsInfo.style.display = 'flex';
    }

    /**
     * Oculta información de resultados de filtros
     */
    hideFilterResultsInfo() {
        const resultsInfo = document.querySelector('.filters-results-info');
        if (resultsInfo) {
            resultsInfo.style.display = 'none';
        }
    }

    /**
     * Copia el enlace de invitación al portapapeles
     */
    async copyInvitationLink(code) {
        const invitationUrl = `${window.location.origin}/invitation?invitation=${code}`;
        try {
            await navigator.clipboard.writeText(invitationUrl);
            showToast('Enlace de invitación copiado al portapapeles', 'success');
        } catch (err) {
            console.error('Error al copiar enlace:', err);
            showToast('Error al copiar enlace', 'error');
        }
    }

    /**
     * Obtiene los datos de invitaciones para otros servicios
     */
    getInvitationsData() {
        return this.currentInvitations;
    }
}
