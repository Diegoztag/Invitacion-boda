/**
 * Invitations Controller
 * Maneja toda la lógica relacionada con la gestión de invitaciones
 */

import { adminAPI, APIHelpers } from '../admin-api.js';
import { 
    calculatePaginationInfo,
    updateTablePagination,
    renderTableRow,
    getStatusBadge,
    calculateCancelledPasses
} from '../admin-utils.js';
import { Modal, ModalFactory, showToast } from '../components/admin-modal.js';

export class InvitationsController {
    constructor() {
        this.allInvitations = [];
        this.currentFilteredInvitations = [];
        this.CONFIG = {
            backendUrl: WEDDING_CONFIG.api.backendUrl
        };
        
        // Modal instances
        this.invitationDetailModal = null;
        this.createInvitationModal = null;
        this.importCsvModal = null;
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
    }

    /**
     * Carga todas las invitaciones
     */
    async loadInvitations() {
        try {
            const result = await adminAPI.fetchInvitations();
            if (APIHelpers.isSuccess(result)) {
                this.allInvitations = result.invitations || [];
                this.currentFilteredInvitations = this.allInvitations;
                this.displayInvitations(this.allInvitations);
            } else {
                throw new Error(APIHelpers.getErrorMessage(result));
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
            showToast('Error al cargar invitaciones', 'error');
            // Show demo data
            this.allInvitations = this.getDemoInvitations();
            this.currentFilteredInvitations = this.allInvitations;
            this.displayInvitations(this.allInvitations);
        }
    }

    /**
     * Carga datos específicos de la sección de invitaciones
     */
    async loadInvitationsSectionData() {
        try {
            const result = await adminAPI.fetchInvitations();
            if (APIHelpers.isSuccess(result)) {
                const invitations = result.invitations || [];
                
                // Calculate invitation counts (not passes)
                const totalInvitations = invitations.length;
                const confirmedInvitations = invitations.filter(inv => inv.confirmed && inv.confirmationDetails?.willAttend !== false).length;
                const pendingInvitations = invitations.filter(inv => !inv.confirmed).length;
                const rejectedInvitations = invitations.filter(inv => inv.confirmed && inv.confirmationDetails?.willAttend === false).length;
                
                // Update stats cards in invitations section
                this.updateInvitationStats(totalInvitations, confirmedInvitations, pendingInvitations, rejectedInvitations);
            } else {
                throw new Error(APIHelpers.getErrorMessage(result));
            }
        } catch (error) {
            console.error('Error loading invitations section data:', error);
            // Show demo data
            this.updateInvitationStats(11, 8, 2, 1);
        }
        
        // Load invitations for the table
        await this.loadInvitations();
    }

    /**
     * Actualiza las estadísticas de invitaciones
     */
    updateInvitationStats(total, confirmed, pending, rejected) {
        document.getElementById('totalInvitationsStats').textContent = total;
        document.getElementById('confirmedPassesStats').textContent = confirmed;
        document.getElementById('pendingInvitationsStats').textContent = pending;
        document.getElementById('cancelledPassesStats').textContent = rejected;
        
        // Update confirmed change badge
        const confirmedChangeBadge = document.getElementById('confirmedChangeStats');
        if (confirmedChangeBadge) {
            const confirmedPercentage = total > 0 ? Math.round((confirmed / total) * 100) : 0;
            
            confirmedChangeBadge.textContent = `${confirmedPercentage}%`;
            confirmedChangeBadge.title = 'Porcentaje de invitaciones confirmadas';
            
            if (!confirmedChangeBadge.classList.contains('stat-badge')) {
                confirmedChangeBadge.classList.add('stat-badge');
            }
            
            // Update badge color
            confirmedChangeBadge.classList.remove('success', 'warning', 'danger', 'primary');
            if (confirmedPercentage >= 70) {
                confirmedChangeBadge.classList.add('success');
            } else if (confirmedPercentage >= 40) {
                confirmedChangeBadge.classList.add('warning');
            } else {
                confirmedChangeBadge.classList.add('danger');
            }
        }
    }

    /**
     * Muestra las invitaciones en la tabla
     */
    displayInvitations(invitations, page = 1, itemsPerPage = 20) {
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
        
        // Render table rows
        paginatedInvitations.forEach((invitation, index) => {
            const row = document.createElement('tr');
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
            onPageChange: (newPage) => this.displayInvitations(invitations, newPage, itemsPerPage)
        });
    }

    /**
     * Inicializa la paginación
     */
    initPagination() {
        this.currentFilteredInvitations = this.allInvitations;
        
        const itemsPerPageSelect = document.getElementById('itemsPerPage');
        if (itemsPerPageSelect) {
            const savedItemsPerPage = localStorage.getItem('invitationsPerPage') || '20';
            itemsPerPageSelect.value = savedItemsPerPage;
            
            itemsPerPageSelect.addEventListener('change', (e) => {
                const newItemsPerPage = parseInt(e.target.value);
                localStorage.setItem('invitationsPerPage', newItemsPerPage);
                
                const searchInput = document.getElementById('searchInput');
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                
                let invitationsToDisplay = this.allInvitations;
                
                if (searchTerm) {
                    invitationsToDisplay = this.filterInvitations(this.allInvitations, searchTerm);
                }
                
                this.displayInvitations(invitationsToDisplay, 1, newItemsPerPage);
            });
        }
    }

    /**
     * Inicializa la búsqueda
     */
    initSearch() {
        const searchInput = document.getElementById('searchInput');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                
                const filteredInvitations = this.filterInvitations(this.allInvitations, searchTerm);
                
                const itemsPerPageSelect = document.getElementById('itemsPerPage');
                const itemsPerPage = itemsPerPageSelect ? parseInt(itemsPerPageSelect.value) : 20;
                
                this.displayInvitations(filteredInvitations, 1, itemsPerPage);
            });
        }
    }

    /**
     * Filtra invitaciones por término de búsqueda
     */
    filterInvitations(invitations, searchTerm) {
        return invitations.filter(invitation => {
            return invitation.code.toLowerCase().includes(searchTerm) ||
                   invitation.guestNames.some(name => name.toLowerCase().includes(searchTerm)) ||
                   (invitation.phone && invitation.phone.includes(searchTerm));
        });
    }

    /**
     * Ve los detalles de una invitación
     */
    viewInvitation(code) {
        const invitation = this.allInvitations.find(inv => inv.code === code);
        if (!invitation) return;
        
        const invitationUrl = `${window.location.origin}/invitacion?invitation=${code}`;
        
        // Store current invitation for editing
        window.currentEditingInvitation = invitation;
        
        this.renderInvitationViewMode(invitation, invitationUrl);
        this.invitationDetailModal.open();
    }

    /**
     * Renderiza el modo de vista de la invitación
     */
    renderInvitationViewMode(invitation, invitationUrl) {
        const statusBadgeInfo = getStatusBadge(invitation, { showIcon: true });
        const cancelledPasses = calculateCancelledPasses(invitation);
        
        const detailsContent = `
            <div class="invitation-detail" data-mode="view">
                <div class="status-header-emoji">
                    ${statusBadgeInfo.html}
                </div>
                
                <div class="guest-info-section">
                    <p class="info-item"><i class="fas fa-users"></i> <strong>Invitados:</strong> ${invitation.guestNames.join(' y ')}</p>
                    <p class="info-item"><i class="fas fa-ticket-alt"></i> <strong>Pases:</strong> ${invitation.numberOfPasses}</p>
                    ${invitation.tableNumber ? `<p class="info-item"><i class="fas fa-chair"></i> <strong>Mesa:</strong> ${invitation.tableNumber}</p>` : '<p class="info-item"><i class="fas fa-chair"></i> <strong>Mesa:</strong> Sin asignar</p>'}
                    ${invitation.phone || invitation.confirmationDetails?.phone ? `
                        <p class="info-item"><i class="fas fa-phone"></i> <strong>Teléfono:</strong> ${invitation.phone || invitation.confirmationDetails?.phone}</p>
                    ` : '<p class="info-item"><i class="fas fa-phone"></i> <strong>Teléfono:</strong> No proporcionado</p>'}
                </div>
                
                <div class="confirmation-status-section">
                    <h5 class="section-divider">Estado de Confirmación</h5>
                    ${this.renderConfirmationStatus(invitation)}
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="invitationsController.copyToClipboard('${invitationUrl}')">
                        <i class="fas fa-link"></i> Copiar Link
                    </button>
                    <button class="btn btn-secondary" onclick="window.open('${invitationUrl}', '_blank')">
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
        if (!invitation.confirmed) {
            return '<p class="info-item"><strong>Estado:</strong> Sin confirmar</p>';
        }
        
        if (invitation.confirmationDetails?.willAttend) {
            return `
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
            `;
        } else {
            return `
                <p class="info-item"><strong>Asistirá:</strong> No</p>
                <p class="info-item"><strong>Confirmado el:</strong> ${new Date(invitation.confirmationDate).toLocaleDateString('es-MX', { 
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            `;
        }
    }

    /**
     * Renderiza los botones de acción
     */
    renderActionButtons(invitation) {
        if (invitation.status === 'inactive') {
            return `
                <button class="btn btn-primary" onclick="invitationsController.activateInvitation('${invitation.code}')">
                    <i class="fas fa-check-circle"></i> Activar
                </button>
            `;
        } else {
            return `
                <button class="btn btn-primary" onclick="invitationsController.editInvitation('${invitation.code}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger" onclick="invitationsController.deactivateInvitation('${invitation.code}')">
                    <i class="fas fa-power-off"></i> Desactivar
                </button>
            `;
        }
    }

    /**
     * Desactiva una invitación
     */
    async deactivateInvitation(code) {
        const invitation = this.allInvitations.find(inv => inv.code === code);
        if (!invitation) return;
        
        if (invitation.confirmed) {
            const confirmModal = ModalFactory.createConfirmModal({
                title: 'Advertencia: Invitación Confirmada',
                message: `Esta invitación ya fue confirmada por ${invitation.guestNames.join(' y ')}. ¿Estás seguro de que deseas desactivarla?`,
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
                const response = await fetch(`${this.CONFIG.backendUrl}/invitation/${code}/deactivate`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        deactivatedBy: 'admin',
                        deactivationReason: deactivationReason
                    })
                });
                
                if (!response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
                    } else {
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
        const invitation = this.allInvitations.find(inv => inv.code === code);
        if (!invitation) return;
        
        const confirmModal = ModalFactory.createConfirmModal({
            title: 'Activar Invitación',
            message: `¿Estás seguro de activar la invitación de ${invitation.guestNames.join(' y ')}?`,
            confirmText: 'Activar',
            confirmClass: 'primary',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${this.CONFIG.backendUrl}/invitation/${code}/activate`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
                        } else {
                            throw new Error(`Error ${response.status}: ${response.statusText}`);
                        }
                    }
                    
                    const result = await response.json();
                    
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
    editInvitation(code) {
        // Implementation for editing invitation
        // This would be similar to the original editInvitation function
        console.log('Edit invitation:', code);
        // TODO: Implement edit functionality
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
        // Implementation for CSV upload initialization
        // This would be similar to the original initCsvUpload function
        console.log('CSV upload initialized');
        // TODO: Implement CSV upload functionality
    }

    /**
     * Obtiene invitaciones demo
     */
    getDemoInvitations() {
        return [
            {
                code: 'abc123',
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                confirmed: false,
                confirmedPasses: 0
            }
        ];
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
    exportAllInvitations() {
        adminAPI.exportToCSV(this.allInvitations, 'invitaciones_completas');
        showToast('Archivo CSV exportado exitosamente', 'success');
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
        // Reset file input and upload area
        const csvFile = document.getElementById('csvFile');
        const fileName = document.getElementById('fileName');
        const fileUploadArea = document.getElementById('fileUploadArea');
        const uploadBtn = document.getElementById('uploadCsvBtn');
        const csvResults = document.getElementById('csvResults');
        
        if (csvFile) csvFile.value = '';
        if (fileName) fileName.textContent = '';
        if (fileUploadArea) {
            fileUploadArea.classList.remove('has-file', 'drag-over');
        }
        if (uploadBtn) {
            uploadBtn.classList.remove('show');
        }
        if (csvResults) {
            csvResults.innerHTML = '';
            csvResults.classList.remove('show', 'success', 'error');
        }
    }

    /**
     * Inicializa el formulario de creación en el modal
     */
    initCreateFormInModal() {
        // Implementation for create form initialization
        // This would be similar to the original initCreateFormInModal function
        console.log('Create form initialized');
        // TODO: Implement create form functionality
    }

    /**
     * Inicializa los handlers de carga CSV
     */
    initCsvUploadHandlers() {
        // Implementation for CSV upload handlers
        // This would be similar to the original initCsvUploadHandlers function
        console.log('CSV upload handlers initialized');
        // TODO: Implement CSV upload handlers
    }

    /**
     * Obtiene los datos de invitaciones para otros servicios
     */
    getInvitationsData() {
        return this.allInvitations;
    }
}
