// dashboard-modal.js - Sistema de modales reutilizable

import { formatGuestNames } from '../dashboard-utils.js';

/**
 * Clase Modal reutilizable para el panel de administración
 * Implementa mejores prácticas de UX/UI y accesibilidad
 */
export class Modal {
    constructor(options = {}) {
        this.id = options.id || `modal-${Date.now()}`;
        this.title = options.title || '';
        this.content = options.content || '';
        this.size = options.size || 'medium'; // small, medium, large
        this.type = options.type || 'info'; // info, form, confirmation, critical
        this.closeOnOverlay = options.closeOnOverlay !== false;
        this.closeOnEsc = options.closeOnEsc !== false;
        this.onClose = options.onClose || null;
        this.onOpen = options.onOpen || null;
        this.focusableElements = [];
        this.currentFocusIndex = 0;
        this.previousActiveElement = null;
        
        this.modalElement = null;
        this.isOpen = false;
        this.scrollPosition = 0; // Guardar posición del scroll
        
        this.init();
    }
    
    /**
     * Inicializa el modal
     */
    init() {
        // Crear estructura del modal
        this.modalElement = document.createElement('div');
        this.modalElement.id = this.id;
        this.modalElement.className = 'modal';
        this.modalElement.innerHTML = this.getTemplate();
        
        // Agregar al DOM
        document.body.appendChild(this.modalElement);
        
        // Configurar event listeners
        this.setupEventListeners();
    }
    
    /**
     * Obtiene el template HTML del modal optimizado según tipo
     */
    getTemplate() {
        const modalTypeClass = `modal-${this.type}`;
        const showCloseButton = this.type === 'info';
        
        // Para el modal CSV específicamente
        if (this.id === 'importCsvModal') {
            return `
                <div class="modal-content modal-${this.size} modal-form" role="dialog" aria-labelledby="modal-title-${this.id}" aria-describedby="modal-body-${this.id}">
                    <div class="modal-header">
                        <div class="modal-header-content">
                            <div class="modal-icon-wrapper">
                                <i class="fas fa-table modal-icon"></i>
                            </div>
                            <h3 id="modal-title-${this.id}" class="modal-title">${this.title}</h3>
                        </div>
                    </div>
                    <div id="modal-body-${this.id}" class="modal-body">
                        ${this.content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="cancel" tabindex="0">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary btn-csv" id="uploadCsvBtn" data-action="confirm" disabled tabindex="0">
                            <i class="fas fa-upload btn-icon"></i>
                            Importar
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Template genérico optimizado por tipo
        return `
            <div class="modal-content modal-${this.size} ${modalTypeClass}" role="dialog" aria-labelledby="modal-title-${this.id}" aria-describedby="modal-body-${this.id}">
                <div class="modal-header">
                    <div class="modal-header-content">
                        <div class="modal-icon-wrapper">
                            <i class="fas fa-${this.getIconByType()} modal-icon"></i>
                        </div>
                        <h3 id="modal-title-${this.id}" class="modal-title">${this.title}</h3>
                    </div>
                    ${showCloseButton ? `<button class="modal-close" aria-label="Cerrar modal" tabindex="0">
                        <i class="fas fa-times"></i>
                    </button>` : ''}
                </div>
                <div id="modal-body-${this.id}" class="modal-body">
                    ${this.content}
                </div>
            </div>
        `;
    }
    
    /**
     * Obtiene el icono apropiado según el tipo de modal
     */
    getIconByType() {
        const icons = {
            info: 'info-circle',
            form: 'edit',
            confirmation: 'question-circle',
            critical: 'exclamation-triangle'
        };
        return icons[this.type] || 'info-circle';
    }
    
    /**
     * Configura los event listeners con mejores prácticas de accesibilidad
     */
    setupEventListeners() {
        // Cerrar con botón X (solo en modales informativos)
        const closeBtn = this.modalElement.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.close();
                }
            });
        }
        
        // Botones de acción en footer
        const cancelBtn = this.modalElement.querySelector('[data-action="cancel"]');
        const confirmBtn = this.modalElement.querySelector('[data-action="confirm"]');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
            cancelBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.close();
                }
            });
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    confirmBtn.click();
                }
            });
        }
        
        // Cerrar al hacer clic en el overlay (solo si está permitido)
        if (this.closeOnOverlay && this.type !== 'critical') {
            this.modalElement.addEventListener('click', (e) => {
                if (e.target === this.modalElement) {
                    this.close();
                }
            });
        }
        
        // Navegación por teclado
        this.keydownHandler = (e) => {
            if (!this.isOpen) return;
            
            switch (e.key) {
                case 'Escape':
                    if (this.closeOnEsc && this.type !== 'critical') {
                        this.close();
                    }
                    break;
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
                case 'Enter':
                    if (e.target.classList.contains('btn-default')) {
                        e.preventDefault();
                        e.target.click();
                    }
                    break;
            }
        };
    }
    
    /**
     * Maneja la navegación por Tab para mantener el foco dentro del modal
     */
    handleTabNavigation(e) {
        this.updateFocusableElements();
        
        if (this.focusableElements.length === 0) return;
        
        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab (navegación hacia atrás)
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab (navegación hacia adelante)
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }
    
    /**
     * Actualiza la lista de elementos que pueden recibir foco
     */
    updateFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        this.focusableElements = Array.from(
            this.modalElement.querySelectorAll(focusableSelectors.join(', '))
        ).filter(el => {
            return el.offsetParent !== null && // elemento visible
                   !el.hasAttribute('hidden') &&
                   getComputedStyle(el).display !== 'none';
        });
    }
    
    /**
     * Abre el modal con mejoras de accesibilidad
     */
    open() {
        if (this.isOpen) return;
        
        // Set active modal global reference
        window.activeModal = this;
        
        // Guardar elemento activo actual
        this.previousActiveElement = document.activeElement;
        
        // Guardar posición actual del scroll
        this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Guardar el ancho del body antes de aplicar fixed
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        this.modalElement.classList.remove('modal-hidden');
        this.modalElement.classList.add('modal-visible');
        this.modalElement.style.display = 'block';
        this.isOpen = true;
        
        // Agregar listeners de teclado
        document.addEventListener('keydown', this.keydownHandler);
        
        // Callback onOpen
        if (this.onOpen) {
            this.onOpen(this);
        }
        
        // Prevenir scroll del body
        document.body.classList.add('modal-open');
        
        // Compensar por la barra de scroll que desaparece
        if (scrollBarWidth > 0) {
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        }
        
        // Mantener la posición visual del contenido
        document.body.style.top = `-${this.scrollPosition}px`;
        
        // Configurar foco inicial
        this.setInitialFocus();
        
        // Anunciar apertura del modal a lectores de pantalla
        this.announceToScreenReader('Modal abierto: ' + this.title);
    }
    
    /**
     * Configura el foco inicial del modal
     */
    setInitialFocus() {
        setTimeout(() => {
            this.updateFocusableElements();
            
            if (this.focusableElements.length > 0) {
                // Buscar el botón por defecto primero
                const defaultButton = this.modalElement.querySelector('.btn-default');
                if (defaultButton) {
                    defaultButton.focus();
                } else {
                    // Si no hay botón por defecto, enfocar el primer elemento
                    this.focusableElements[0].focus();
                }
            } else {
                // Si no hay elementos enfocables, enfocar el modal mismo
                const modalContent = this.modalElement.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.setAttribute('tabindex', '-1');
                    modalContent.focus();
                }
            }
        }, 100); // Pequeño delay para asegurar que el modal esté completamente renderizado
    }
    
    /**
     * Anuncia mensajes a lectores de pantalla
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    /**
     * Cierra el modal con restauración de foco
     */
    close() {
        if (!this.isOpen) return;
        
        // Clear active modal global reference if it's this modal
        if (window.activeModal === this) {
            window.activeModal = null;
        }
        
        this.modalElement.classList.remove('modal-visible');
        this.modalElement.classList.add('modal-hidden');
        this.modalElement.style.display = 'none';
        this.isOpen = false;
        
        // Remover listeners de teclado
        document.removeEventListener('keydown', this.keydownHandler);
        
        // Callback onClose
        if (this.onClose) {
            this.onClose(this);
        }
        
        // Restaurar scroll del body
        document.body.classList.remove('modal-open');
        
        // Remover el padding y top
        document.body.style.paddingRight = '';
        document.body.style.top = '';
        
        // Restaurar posición del scroll
        window.scrollTo(0, this.scrollPosition);
        
        // Restaurar foco al elemento anterior
        if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
            this.previousActiveElement.focus();
        }
        
        // Anunciar cierre del modal
        this.announceToScreenReader('Modal cerrado');
    }
    
    /**
     * Actualiza el título del modal
     */
    setTitle(title) {
        this.title = title;
        const titleElement = this.modalElement.querySelector('.modal-header h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    /**
     * Actualiza el contenido del modal
     */
    setContent(content) {
        this.content = content;
        const bodyElement = this.modalElement.querySelector('.modal-body');
        if (bodyElement) {
            bodyElement.innerHTML = content;
        }
    }
    
    /**
     * Destruye el modal y lo remueve del DOM
     */
    destroy() {
        this.close();
        if (this.modalElement && this.modalElement.parentNode) {
            this.modalElement.parentNode.removeChild(this.modalElement);
        }
        this.modalElement = null;
    }
}

/**
 * Factory para crear modales específicos
 */
export class ModalFactory {
    /**
     * Crea un modal de detalles de invitación (informativo - solo botón X)
     */
    static createInvitationDetailModal() {
        return new Modal({
            id: 'invitationModal',
            title: 'Detalles de Invitación',
            type: 'info',
            size: 'medium',
            content: '<div id="invitationDetails"></div>'
        });
    }
    
    /**
     * Crea un modal para crear invitación
     */
    static createInvitationFormModal() {
        const content = `
            <form id="createInvitationForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="numberOfPasses">Número de pases</label>
                        <input type="number" id="numberOfPasses" name="numberOfPasses" 
                               min="1" max="10" value="1" required>
                    </div>
                </div>
                
                <div id="guestFieldsContainer" class="form-group">
                    <label>Invitados</label>
                    <small class="form-hint">Completa el nombre y tipo de cada invitado</small>
                    <div id="guestFields">
                        <!-- Los campos de invitados se generarán dinámicamente aquí -->
                    </div>
                </div>

                <div class="form-group">
                    <label for="tableNumber">Mesa (opcional)</label>
                    <input type="number" id="tableNumber" name="tableNumber" 
                            min="1" placeholder="Número de mesa">
                </div>
                
                <div class="form-group">
                    <label for="phone">Teléfono (opcional)</label>
                    <input type="tel" id="phone" name="phone" 
                           placeholder="+52 1234567890">
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Crear Invitación
                    </button>
                </div>
            </form>
        `;
        
        return new Modal({
            id: 'createInvitationModal',
            title: 'Nueva Invitación',
            type: 'form',
            size: 'medium',
            content: content,
            onClose: () => {
                const form = document.getElementById('createInvitationForm');
                if (form) {
                    form.reset();
                    // Resetear campos dinámicos disparando el evento input
                    const passesInput = document.getElementById('numberOfPasses');
                    if (passesInput) {
                        passesInput.dispatchEvent(new Event('input'));
                    }
                }
            }
        });
    }

    /**
     * Crea un modal para editar invitación
     */
    static createEditInvitationModal() {
        const content = `
            <form id="editInvitationForm">
                <input type="hidden" id="editInvitationCode" name="code">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStatus">Estado</label>
                        <select id="editStatus" name="status" class="form-control">
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmada</option>
                            <option value="cancelled">Rechazada</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editNumberOfPasses">Número de pases</label>
                        <input type="number" id="editNumberOfPasses" name="numberOfPasses" 
                               min="1" max="10" required>
                        <div id="editPassesLegend" class="form-hint mt-1"></div>
                    </div>
                </div>
                
                <div id="editGuestFieldsContainer" class="form-group">
                    <label>Invitados</label>
                    <small class="form-hint">Completa el nombre, tipo de cada invitado y marca si asitirán</small>
                    <div id="editGuestFields">
                        <!-- Los campos de invitados se generarán dinámicamente aquí -->
                    </div>
                </div>

                <div class="form-group">
                    <label for="editTableNumber">Mesa (opcional)</label>
                    <input type="number" id="editTableNumber" name="tableNumber" 
                            min="1" placeholder="Número de mesa">
                </div>
                
                <div class="form-group">
                    <label for="editPhone">Teléfono (opcional)</label>
                    <input type="tel" id="editPhone" name="phone" 
                           placeholder="+52 1234567890">
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Guardar Cambios
                    </button>
                </div>
            </form>
        `;
        
        return new Modal({
            id: 'editInvitationModal',
            title: 'Editar Invitación',
            type: 'form',
            size: 'medium',
            content: content
        });
    }
    
    /**
     * Crea un modal para importar CSV
     */
    static createImportCSVModal() {
        const content = `
            <div class="csv-upload-section">
                <div class="format-info-wrapper">
                    <p class="format-info-header">
                        <i class="fas fa-info-circle format-info-icon"></i>
                        Formato del archivo CSV
                    </p>
                    <div class="format-info-content">
                        <div class="format-info-item">
                            <span class="format-label">Columnas requeridas</span>
                            <code class="format-code primary">Nombres,Pases</code>
                        </div>
                        <div class="format-info-item">
                            <span class="format-label">Columnas opcionales</span>
                            <code class="format-code">Mesa,Telefono,Adultos,Niños,Staff</code>
                        </div>
                        <div class="format-info-item">
                            <span class="format-label">Orden completo</span>
                            <code class="format-code">Nombres,Pases,Mesa,Telefono,Adultos,Niños,Staff</code>
                        </div>
                        <div class="format-info-item">
                            <span class="format-label">Ejemplo completo</span>
                            <code class="format-code secondary">Juan y María,2,5,+521234567890,2,0,0</code>
                        </div>
                        <div class="format-info-item">
                            <span class="format-label">Ejemplo mínimo</span>
                            <code class="format-code secondary">Pedro García,1</code>
                        </div>
                        <div class="format-info-item mt-3">
                            <span class="format-label">⚠️ Nota importante</span>
                            <span class="text-sm text-muted">Si incluyes Adultos, Niños y Staff, la suma debe ser igual al total de Pases</span>
                        </div>
                    </div>
                </div>
                
                <label class="file-upload-wrapper" for="csvFile">
                    <input type="file" id="csvFile" accept=".csv" class="file-input">
                    <div class="file-upload-content">
                        <div class="upload-icon-wrapper">
                            <i class="fas fa-cloud-upload-alt upload-icon"></i>
                        </div>
                        <p class="upload-text">Seleccionar archivo CSV</p>
                        <p class="upload-subtext">o arrastra y suelta aquí</p>
                    </div>
                </label>
                
                <div id="fileSelectedInfo" class="file-selected">
                    <div class="file-selected-info">
                        <i class="fas fa-file-alt file-selected-icon"></i>
                        <span id="fileName" class="file-selected-name"></span>
                    </div>
                    <i class="fas fa-times file-selected-remove" id="clearFileSelectionBtn"></i>
                </div>
                
                <div id="csvResults" class="csv-results"></div>
            </div>
        `;
        
        const modal = new Modal({
            id: 'importCsvModal',
            title: 'Importar desde CSV',
            type: 'form',
            size: 'medium',
            content: content,
            onClose: () => {
                // Reset form when closing
                const csvFile = document.getElementById('csvFile');
                const fileName = document.getElementById('fileName');
                const fileSelectedInfo = document.getElementById('fileSelectedInfo');
                const csvResults = document.getElementById('csvResults');
                const uploadBtn = document.getElementById('uploadCsvBtn');
                
                if (csvFile) csvFile.value = '';
                if (fileName) fileName.textContent = '';
                if (fileSelectedInfo) {
                    // Remove inline style to avoid specificity issues
                    fileSelectedInfo.style.display = '';
                    // The CSS will handle the initial hidden state
                }
                if (csvResults) {
                    csvResults.innerHTML = '';
                    csvResults.classList.remove('show', 'success', 'error');
                }
                // Ensure upload button is disabled when closing
                if (uploadBtn) uploadBtn.disabled = true;
                
                // Clear selected file reference
                window.selectedCsvFile = null;
            }
        });

        // Agregar listener para limpiar selección
        const clearBtn = modal.modalElement.querySelector('#clearFileSelectionBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (typeof window.clearFileSelection === 'function') {
                    window.clearFileSelection();
                }
            });
        }

        return modal;
    }
    
    /**
     * Crea un modal de confirmación
     */
    static createConfirmModal(options) {
        const content = `
            <div class="confirm-modal-content">
                <p>${options.message || '¿Estás seguro?'}</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        ${options.cancelText || 'Cancelar'}
                    </button>
                    <button type="button" class="btn btn-${options.confirmClass || 'primary'}" id="btnConfirmAction">
                        ${options.confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
        `;
        
        const modal = new Modal({
            title: options.title || 'Confirmar acción',
            type: 'confirmation',
            size: 'small',
            content: content
        });
        
        modal.confirmAction = () => {
            if (options.onConfirm) {
                options.onConfirm();
            }
            modal.close();
        };

        // Agregar listener al botón de confirmar
        const confirmBtn = modal.modalElement.querySelector('#btnConfirmAction');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                modal.confirmAction();
            });
        }
        
        return modal;
    }
    
    /**
     * Crea un modal para generar mensaje de WhatsApp
     */
    static createWhatsAppModal(message) {
        const content = `
            <div class="whatsapp-modal-content">
                <div class="form-group">
                    <label for="whatsappMessage">Mensaje generado:</label>
                    <textarea id="whatsappMessage" rows="8" class="form-control" readonly>${message}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        Cerrar
                    </button>
                    <button type="button" class="btn btn-success" id="btnCopyWhatsApp">
                        <i class="fab fa-whatsapp"></i> Copiar Mensaje
                    </button>
                </div>
            </div>
        `;
        
        const modal = new Modal({
            id: 'whatsappModal',
            title: 'Mensaje para WhatsApp',
            type: 'info',
            size: 'medium',
            content: content
        });

        // Agregar listener al botón de copiar
        const copyBtn = modal.modalElement.querySelector('#btnCopyWhatsApp');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const textarea = document.getElementById('whatsappMessage');
                if (textarea) {
                    textarea.select();
                    document.execCommand('copy');
                    
                    // Feedback visual
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        modal.close();
                    }, 1500);
                }
            });
        }
        
        return modal;
    }

    /**
     * Crea un modal para desactivar invitación
     */
    static createDeactivateInvitationModal(invitation) {
        const getStatusText = (status) => {
            const statusMap = {
                'pending': 'Pendiente',
                'confirmed': 'Confirmado',
                'partial': 'Confirmado Parcialmente',
                'cancelled': 'Rechazado',
                'inactive': 'Inactivo'
            };
            return statusMap[status] || 'Desconocido';
        };

        const content = `
            <div class="cancel-invitation-modal">         
                <div class="invitation-info">
                    <div class="info-item">
                        <strong>Invitados:</strong> ${formatGuestNames(invitation.guestNames)}
                    </div>
                    <div class="info-item">
                        <strong>Pases:</strong> ${invitation.numberOfPasses}
                    </div>
                    <div class="info-item">
                        <strong>Estado actual:</strong> ${getStatusText(invitation.status)}
                    </div>
                </div>
                
                <div class="warning-message">
                    <p><strong>⚠️ Esta acción:</strong></p>
                    <ul>
                        <li>Marcará la invitación como inactiva</li>
                        <li>El link dejará de funcionar temporalmente</li>
                        <li>NO se contará en las estadísticas</li>
                        <li>Podrás activarla nuevamente cuando desees</li>
                    </ul>
                </div>
                
                <div class="form-group">
                    <label for="deactivationReason">Motivo de desactivación (opcional):</label>
                    <textarea id="deactivationReason" rows="3" class="form-control" 
                              placeholder="Ej: Invitación duplicada, error en datos, etc."></textarea>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        Volver
                    </button>
                    <button type="button" class="btn btn-danger" id="btnConfirmDeactivate">
                        <i class="fas fa-power-off"></i> Confirmar Desactivación
                    </button>
                </div>
            </div>
        `;
        
        const modal = new Modal({
            id: 'deactivateInvitationModal',
            title: 'Confirmar Desactivación',
            type: 'critical',
            size: 'medium',
            content: content
        });
        
        // Guardar referencia a la invitación
        modal.invitation = invitation;

        // Agregar listener al botón de confirmar
        const confirmBtn = modal.modalElement.querySelector('#btnConfirmDeactivate');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (typeof window.confirmDeactivateInvitation === 'function') {
                    window.confirmDeactivateInvitation();
                }
            });
        }
        
        return modal;
    }
}

/**
 * Utilidad para mostrar notificaciones tipo toast
 */
export function showToast(message, type = 'success', duration = 10000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Asegurar que el toast tenga un z-index alto
    toast.style.zIndex = '9999';
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
