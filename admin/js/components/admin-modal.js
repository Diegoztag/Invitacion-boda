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
        closeBtn.addEventListener('click', () => this.close());
        
        // Cerrar al hacer clic en el overlay
        if (this.closeOnOverlay) {
            this.modalElement.addEventListener('click', (e) => {
                if (e.target === this.modalElement) {
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
            <form id="createInvitationForm">
                <div class="form-group">
                    <label for="guestNames">Nombres de invitados</label>
                    <input type="text" id="guestNames" name="guestNames" required 
                           placeholder="Ej: Juan Pérez y María García">
                    <small>Separa los nombres con "y" o comas</small>
                </div>
                
                <div class="form-group">
                    <label>Tipo de invitación</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="invitationType" value="adults" checked>
                            <span>Adultos/Pareja</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="invitationType" value="family">
                            <span>Familia</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="invitationType" value="staff">
                            <span>Staff/Proveedor</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="adultPassesInput">Adultos</label>
                        <input type="number" id="adultPassesInput" name="adultPasses" 
                               min="1" max="10" value="2" required>
                    </div>
                    
                    <div class="form-group hidden" id="childPassesGroup">
                        <label for="childPassesInput">Niños</label>
                        <input type="number" id="childPassesInput" name="childPasses" 
                               min="0" max="10" value="0">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="phone">Teléfono (opcional)</label>
                    <input type="tel" id="phone" name="phone" 
                           placeholder="+52 1234567890">
                </div>
                
                <div class="total-passes">
                    <span>Total de pases:</span>
                    <strong id="totalPassesValue">2</strong>
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
                <div class="csv-instructions">
                    <h4>Formato del archivo CSV:</h4>
                    <p>El archivo debe tener las siguientes columnas:</p>
                    <code>Nombres,Pases,Teléfono</code>
                    <p class="text-muted">Ejemplo: Juan y María,2,+521234567890</p>
                </div>
                
                <div class="file-upload-area">
                    <input type="file" id="csvFile" accept=".csv" class="file-input-hidden">
                    <label for="csvFile" class="file-upload-label">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Seleccionar archivo CSV</span>
                    </label>
                    <div id="fileName" class="file-name"></div>
                </div>
                
                <button id="uploadCsvBtn" class="btn btn-primary upload-button-hidden">
                    <i class="fas fa-upload"></i> Cargar Invitaciones
                </button>
                
                <div id="csvResults" class="csv-results"></div>
            </div>
        `;
        
        return new Modal({
            id: 'importCsvModal',
            title: 'Importar desde CSV',
            size: 'large',
            content: content,
            onClose: () => {
                // Reset form when closing
                document.getElementById('csvFile').value = '';
                document.getElementById('fileName').textContent = '';
                const uploadBtn = document.getElementById('uploadCsvBtn');
                if (uploadBtn) {
                    uploadBtn.classList.add('upload-button-hidden');
                    uploadBtn.classList.remove('upload-button-visible');
                }
                document.getElementById('csvResults').innerHTML = '';
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
export function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
