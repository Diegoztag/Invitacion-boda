// admin-modal.js - Sistema de modales reutilizable

/**
 * Clase Modal reutilizable para el panel de administración
 */
export class Modal {
    constructor(options = {}) {
        this.id = options.id || `modal-${Date.now()}`;
        this.title = options.title || '';
        this.content = options.content || '';
        this.size = options.size || 'medium'; // small, medium, large
        this.closeOnOverlay = options.closeOnOverlay !== false;
        this.closeOnEsc = options.closeOnEsc !== false;
        this.onClose = options.onClose || null;
        this.onOpen = options.onOpen || null;
        
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
     * Obtiene el template HTML del modal
     */
    getTemplate() {
        // Para el modal CSV específicamente
        if (this.id === 'importCsvModal') {
            return `
                <div class="modal-backdrop">
                    <div class="modal modal-${this.size}">
                        <div class="modal-header">
                            <div class="modal-header-content">
                                <div class="modal-icon-wrapper">
                                    <span class="material-symbols-outlined modal-icon">table_view</span>
                                </div>
                                <h3 class="modal-title">${this.title}</h3>
                            </div>
                            <p class="modal-subtitle">Carga masiva de invitados para tu boda de forma rápida.</p>
                        </div>
                        <div class="modal-body">
                            ${this.content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-cancel modal-btn-standard" onclick="window.activeModal?.close()">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-import modal-btn-standard" id="uploadCsvBtn" onclick="window.handleCsvUpload()" disabled>
                                <span class="material-symbols-outlined btn-icon">upload</span>
                                Importar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Template genérico para otros modales
        return `
            <div class="modal-content modal-${this.size}">
                <div class="modal-header">
                    <h3>${this.title}</h3>
                    <button class="modal-close" aria-label="Cerrar modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.content}
                </div>
            </div>
        `;
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Cerrar con botón X
        const closeBtn = this.modalElement.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Cerrar al hacer clic en el overlay
        if (this.closeOnOverlay) {
            const backdrop = this.modalElement.querySelector('.modal-backdrop');
            const target = backdrop || this.modalElement;
            
            target.addEventListener('click', (e) => {
                if (e.target === target) {
                    this.close();
                }
            });
        }
        
        // Cerrar con ESC
        if (this.closeOnEsc) {
            this.escHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            };
        }
    }
    
    /**
     * Abre el modal
     */
    open() {
        if (this.isOpen) return;
        
        // Guardar posición actual del scroll
        this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Guardar el ancho del body antes de aplicar fixed
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        this.modalElement.classList.remove('modal-hidden');
        this.modalElement.classList.add('modal-visible');
        this.modalElement.style.display = 'block';
        this.isOpen = true;
        
        // Agregar listener de ESC
        if (this.escHandler) {
            document.addEventListener('keydown', this.escHandler);
        }
        
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
    }
    
    /**
     * Cierra el modal
     */
    close() {
        if (!this.isOpen) return;
        
        this.modalElement.classList.remove('modal-visible');
        this.modalElement.classList.add('modal-hidden');
        this.modalElement.style.display = 'none';
        this.isOpen = false;
        
        // Remover listener de ESC
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
        }
        
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
     * Crea un modal de detalles de invitación
     */
    static createInvitationDetailModal() {
        return new Modal({
            id: 'invitationModal',
            title: 'Detalles de Invitación',
            size: 'medium',
            content: '<div id="invitationDetails"></div>'
        });
    }
    
    /**
     * Crea un modal para crear invitación
     */
    static createInvitationFormModal() {
        const content = `
            <div class="celebration-message">
                <p>💕 Hemos decidido que nuestra boda sea una <strong>celebración íntima</strong>. 
                Cada invitación es especial y queremos compartir este momento con ustedes de una manera más personal.</p>
            </div>
            
            <form id="createInvitationForm">
                <div class="form-row">
                    <div class="form-group" style="flex: 0 0 40%;">
                        <label for="numberOfPasses">🎟️ Número de pases</label>
                        <input type="number" id="numberOfPasses" name="numberOfPasses" 
                               min="1" max="10" value="1" required>
                    </div>
                    
                    <div class="form-group" style="flex: 0 0 40%;">
                        <label for="tableNumber">🪑 Mesa (opcional)</label>
                        <input type="number" id="tableNumber" name="tableNumber" 
                               min="1" placeholder="Número de mesa">
                    </div>
                </div>
                
                <div id="guestFieldsContainer" class="form-group">
                    <label>👥 Invitados</label>
                    <div id="guestFields">
                        <!-- Los campos de invitados se generarán dinámicamente aquí -->
                    </div>
                    <small class="form-hint">Completa el nombre y tipo de cada invitado</small>
                </div>
                
                <div class="form-group">
                    <label for="phone">📱 Teléfono (opcional)</label>
                    <input type="tel" id="phone" name="phone" 
                           placeholder="+52 1234567890">
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.activeModal?.close()">
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
                        <span class="material-symbols-outlined format-info-icon">info</span>
                        Formato del archivo CSV
                    </p>
                    <div class="format-info-content">
                        <div class="format-info-item">
                            <span class="format-label">Columnas requeridas</span>
                            <code class="format-code primary">Nombres,Pases,Teléfono</code>
                        </div>
                        <div class="format-info-item">
                            <span class="format-label">Ejemplo de fila</span>
                            <code class="format-code secondary">Juan y María,2,+521234567890</code>
                        </div>
                    </div>
                </div>
                
                <label class="file-upload-wrapper" for="csvFile">
                    <input type="file" id="csvFile" accept=".csv" class="file-input">
                    <div class="file-upload-content">
                        <div class="upload-icon-wrapper">
                            <span class="material-symbols-outlined upload-icon">cloud_upload</span>
                        </div>
                        <p class="upload-text">Seleccionar archivo CSV</p>
                        <p class="upload-subtext">o arrastra y suelta aquí</p>
                    </div>
                </label>
                
                <div id="fileSelectedInfo" class="file-selected">
                    <div class="file-selected-info">
                        <span class="material-symbols-outlined file-selected-icon">description</span>
                        <span id="fileName" class="file-selected-name"></span>
                    </div>
                    <span class="material-symbols-outlined file-selected-remove" onclick="window.clearFileSelection()">close</span>
                </div>
                
                <div id="csvResults" class="csv-results"></div>
            </div>
        `;
        
        return new Modal({
            id: 'importCsvModal',
            title: 'Importar desde CSV',
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
    }
    
    /**
     * Crea un modal de confirmación
     */
    static createConfirmModal(options) {
        const content = `
            <div class="confirm-modal-content">
                <p>${options.message || '¿Estás seguro?'}</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.activeModal?.close()">
                        ${options.cancelText || 'Cancelar'}
                    </button>
                    <button type="button" class="btn btn-${options.confirmClass || 'primary'}" 
                            onclick="window.activeModal?.confirmAction()">
                        ${options.confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
        `;
        
        const modal = new Modal({
            title: options.title || 'Confirmar acción',
            size: 'small',
            content: content
        });
        
        modal.confirmAction = () => {
            if (options.onConfirm) {
                options.onConfirm();
            }
            modal.close();
        };
        
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
