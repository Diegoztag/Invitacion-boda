/**
 * Componente Modal reutilizable
 * Proporciona funcionalidad de modal con overlay, animaciones y accesibilidad
 */

import { Component } from '../base/component.js';
import { EVENTS } from '../../../shared/constants/events.js';
import { SELECTORS } from '../../../shared/constants/selectors.js';
import { getConfig } from '../../../config/app-config.js';

export class ModalComponent extends Component {
    constructor(options = {}) {
        // Crear elemento modal si no se proporciona
        const element = options.element || ModalComponent.createModalElement();
        super(element);

        this.options = {
            closeOnBackdrop: getConfig('ui.modal.closeOnBackdrop', true),
            closeOnEscape: getConfig('ui.modal.closeOnEscape', true),
            animationDuration: getConfig('ui.modal.animationDuration', 300),
            className: '',
            size: 'medium', // 'small', 'medium', 'large', 'fullscreen'
            ...options
        };

        this.isOpen = false;
        this.previousFocus = null;
        this.overlay = null;
        this.container = null;
        this.content = null;
        this.closeButton = null;
        this.header = null;
        this.body = null;
        this.footer = null;
    }

    /**
     * Crea el elemento modal base
     * @returns {HTMLElement}
     */
    static createModalElement() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-hidden', 'true');
        modal.style.display = 'none';

        // Agregar al body
        document.body.appendChild(modal);

        return modal;
    }

    /**
     * Inicializa el componente
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('🪟 Initializing ModalComponent...');

        // Crear estructura del modal
        this.createModalStructure();

        // Configurar event listeners
        this.setupEventListeners();

        // Aplicar configuraciones
        this.applyConfiguration();

        await super.init();
        console.log('✅ ModalComponent initialized');
    }

    /**
     * Crea la estructura HTML del modal
     */
    createModalStructure() {
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal-container ${this.options.size}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 class="modal-title"></h2>
                            <button type="button" class="modal-close" aria-label="Cerrar modal">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <!-- Contenido del modal -->
                        </div>
                        <div class="modal-footer">
                            <!-- Botones del modal -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.element.innerHTML = modalHTML;

        // Obtener referencias a elementos
        this.overlay = this.find(SELECTORS.MODAL.OVERLAY);
        this.container = this.find(SELECTORS.MODAL.CONTAINER);
        this.content = this.find(SELECTORS.MODAL.CONTENT);
        this.closeButton = this.find(SELECTORS.MODAL.CLOSE_BUTTON);
        this.header = this.find(SELECTORS.MODAL.HEADER);
        this.body = this.find(SELECTORS.MODAL.BODY);
        this.footer = this.find(SELECTORS.MODAL.FOOTER);
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Click en overlay para cerrar
        if (this.overlay && this.options.closeOnBackdrop) {
            this.overlay.addEventListener('click', e => {
                if (e.target === this.overlay) {
                    this.close();
                    this.emit(EVENTS.MODAL.BACKDROP_CLICKED);
                }
            });
        }

        // Botón de cerrar
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => {
                this.close();
            });
        }

        // Tecla Escape para cerrar
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        // Trap focus dentro del modal
        this.element.addEventListener('keydown', e => {
            if (e.key === 'Tab' && this.isOpen) {
                this.trapFocus(e);
            }
        });
    }

    /**
     * Aplica la configuración inicial
     */
    applyConfiguration() {
        // Configurar atributos ARIA
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('aria-hidden', 'true');

        // Aplicar clase personalizada
        if (this.options.className) {
            this.addClass(this.options.className);
        }

        // Configurar tamaño
        if (this.container) {
            this.container.classList.add(`modal-${this.options.size}`);
        }
    }

    /**
     * Abre el modal
     * @param {Object} options - Opciones para abrir el modal
     */
    open(options = {}) {
        if (this.isOpen) {
            return;
        }

        // Guardar el elemento que tenía focus
        this.previousFocus = document.activeElement;

        // Configurar contenido si se proporciona
        if (options.title) {
            this.setTitle(options.title);
        }

        if (options.content) {
            this.setContent(options.content);
        }

        if (options.footer) {
            this.setFooter(options.footer);
        }

        // Mostrar modal
        this.element.style.display = 'block';
        this.element.setAttribute('aria-hidden', 'false');
        this.element.setAttribute('aria-modal', 'true');

        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';

        // Animación de entrada
        requestAnimationFrame(() => {
            this.addClass('modal-open');
            if (this.overlay) {
                this.overlay.classList.add('modal-overlay-open');
            }
            if (this.container) {
                this.container.classList.add('modal-container-open');
            }
        });

        // Enfocar el modal
        setTimeout(() => {
            this.focusModal();
        }, this.options.animationDuration);

        this.isOpen = true;

        // Emitir evento
        this.emit(EVENTS.MODAL.OPENED, { options });

        console.log('🪟 Modal opened');
    }

    /**
     * Cierra el modal
     */
    close() {
        if (!this.isOpen) {
            return;
        }

        // Animación de salida
        this.removeClass('modal-open');
        if (this.overlay) {
            this.overlay.classList.remove('modal-overlay-open');
        }
        if (this.container) {
            this.container.classList.remove('modal-container-open');
        }

        // Ocultar después de la animación
        setTimeout(() => {
            this.element.style.display = 'none';
            this.element.setAttribute('aria-hidden', 'true');
            this.element.removeAttribute('aria-modal');

            // Restaurar scroll del body
            document.body.style.overflow = '';

            // Restaurar focus
            if (this.previousFocus) {
                this.previousFocus.focus();
                this.previousFocus = null;
            }
        }, this.options.animationDuration);

        this.isOpen = false;

        // Emitir evento
        this.emit(EVENTS.MODAL.CLOSED);

        console.log('🪟 Modal closed');
    }

    /**
     * Alterna el estado del modal
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Establece el título del modal
     * @param {string} title - Título del modal
     */
    setTitle(title) {
        const titleElement = this.find('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }

        // Actualizar aria-label
        this.element.setAttribute('aria-labelledby', 'modal-title');
    }

    /**
     * Establece el contenido del modal
     * @param {string|HTMLElement} content - Contenido del modal
     */
    setContent(content) {
        if (!this.body) {
            return;
        }

        if (typeof content === 'string') {
            this.body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.body.innerHTML = '';
            this.body.appendChild(content);
        }
    }

    /**
     * Obtiene el contenido actual del modal
     * @returns {string} Contenido HTML del modal
     */
    getContent() {
        return this.body ? this.body.innerHTML : '';
    }

    /**
     * Limpia el contenido del modal
     */
    clearContent() {
        if (this.body) {
            this.body.innerHTML = '';
        }
    }

    /**
     * Establece el footer del modal
     * @param {string|HTMLElement} footer - Footer del modal
     */
    setFooter(footer) {
        if (!this.footer) {
            return;
        }

        if (typeof footer === 'string') {
            this.footer.innerHTML = footer;
        } else if (footer instanceof HTMLElement) {
            this.footer.innerHTML = '';
            this.footer.appendChild(footer);
        }

        // Mostrar/ocultar footer según contenido
        this.footer.style.display = footer ? 'block' : 'none';
    }

    /**
     * Agrega un botón al footer
     * @param {Object} buttonConfig - Configuración del botón
     */
    addButton(buttonConfig) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = buttonConfig.className || 'btn btn-primary';
        button.textContent = buttonConfig.text || 'OK';

        if (buttonConfig.onClick) {
            button.addEventListener('click', buttonConfig.onClick);
        }

        if (buttonConfig.id) {
            button.id = buttonConfig.id;
        }

        if (!this.footer) {
            return;
        }
        this.footer.appendChild(button);

        return button;
    }

    /**
     * Limpia el contenido del modal
     */
    clear() {
        if (this.body) {
            this.body.innerHTML = '';
        }
        if (this.footer) {
            this.footer.innerHTML = '';
        }
        this.setTitle('');
    }

    /**
     * Enfoca el modal para accesibilidad
     */
    focusModal() {
        // Buscar el primer elemento enfocable
        const focusableElements = this.getFocusableElements();

        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            // Si no hay elementos enfocables, enfocar el modal mismo
            this.element.focus();
        }
    }

    /**
     * Obtiene elementos enfocables dentro del modal
     * @returns {NodeList}
     */
    getFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');

        return this.element.querySelectorAll(focusableSelectors);
    }

    /**
     * Maneja el trap de focus dentro del modal
     * @param {KeyboardEvent} e - Evento de teclado
     */
    trapFocus(e) {
        const focusableElements = this.getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Verifica si el modal está abierto
     * @returns {boolean}
     */
    isModalOpen() {
        return this.isOpen;
    }

    /**
     * Actualiza el tamaño del modal
     * @param {string} size - Nuevo tamaño ('small', 'medium', 'large', 'fullscreen')
     */
    setSize(size) {
        if (!this.container) {
            return;
        }

        // Remover clases de tamaño anteriores
        this.container.classList.remove(
            'modal-small',
            'modal-medium',
            'modal-large',
            'modal-fullscreen'
        );

        // Agregar nueva clase de tamaño
        this.container.classList.add(`modal-${size}`);
        this.options.size = size;
    }

    /**
     * Muestra un modal de confirmación
     * @param {Object} config - Configuración del modal de confirmación
     * @returns {Promise<boolean>}
     */
    confirm(config) {
        return new Promise(resolve => {
            this.clear();
            this.setTitle(config.title || '¿Confirmar acción?');
            this.setContent(config.message || '¿Estás seguro de que deseas continuar?');

            // Botón de cancelar
            const cancelButton = this.addButton({
                text: config.cancelText || 'Cancelar',
                className: 'btn btn-secondary',
                onClick: () => {
                    this.close();
                    resolve(false);
                }
            });

            // Botón de confirmar
            const confirmButton = this.addButton({
                text: config.confirmText || 'Confirmar',
                className: 'btn btn-primary',
                onClick: () => {
                    this.close();
                    resolve(true);
                }
            });

            this.open();
        });
    }

    /**
     * Muestra un modal de alerta
     * @param {Object} config - Configuración del modal de alerta
     * @returns {Promise<void>}
     */
    alert(config) {
        return new Promise(resolve => {
            this.clear();
            this.setTitle(config.title || 'Información');
            this.setContent(config.message || '');

            // Botón de OK
            this.addButton({
                text: config.okText || 'OK',
                className: 'btn btn-primary',
                onClick: () => {
                    this.close();
                    resolve();
                }
            });

            this.open();
        });
    }

    /**
     * Destruye el componente
     */
    destroy() {
        // Cerrar modal si está abierto
        if (this.isOpen) {
            this.close();
        }

        // Limpiar referencias
        this.overlay = null;
        this.container = null;
        this.content = null;
        this.closeButton = null;
        this.header = null;
        this.body = null;
        this.footer = null;
        this.previousFocus = null;

        // Restaurar scroll del body si estaba bloqueado
        document.body.style.overflow = '';

        // Remover elemento del DOM si fue creado dinámicamente
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        super.destroy();
        console.log('🗑️ ModalComponent destroyed');
    }
}
