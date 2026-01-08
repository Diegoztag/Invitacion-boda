/**
 * Controlador RSVP
 * Maneja la lógica de confirmación de asistencia
 */

import { EVENTS } from '../../shared/constants/events.js';
import { SELECTORS } from '../../shared/constants/selectors.js';
import { DOMUtils } from '../../shared/utils/dom-utils.js';

export class RSVPController {
    constructor(container, invitationService, validationService, options = {}) {
        this.container = container;
        this.invitationService = invitationService;
        this.validationService = validationService;
        this.options = {
            autoSave: true,
            showConfirmation: true,
            enableValidation: true,
            submitDelay: 1000, // Delay antes de enviar para evitar doble submit
            ...options
        };
        
        this.form = null;
        this.formValidator = null;
        this.submitButton = null;
        this.loader = null;
        this.modal = null;
        
        this.currentInvitation = null;
        this.isSubmitting = false;
        this.eventListeners = new Map();
        this.isInitialized = false;
    }
    
    /**
     * Inicializa el controlador
     */
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('💌 Initializing RSVPController...');
        
        // Descubrir elementos del formulario
        this.discoverFormElements();
        
        // Configurar validación si está habilitada
        if (this.options.enableValidation) {
            await this.setupFormValidation();
        }
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar datos iniciales
        await this.loadInitialData();
        
        this.isInitialized = true;
        console.log('✅ RSVPController initialized');
    }
    
    /**
     * Descubre elementos del formulario RSVP
     */
    discoverFormElements() {
        // Formulario principal
        this.form = this.container.querySelector(SELECTORS.RSVP.FORM) || 
                   this.container.querySelector('form[data-rsvp]') ||
                   this.container.querySelector('#rsvp-form');
        
        if (!this.form) {
            console.warn('RSVP form not found');
            return;
        }
        
        // Botón de envío
        this.submitButton = this.form.querySelector(SELECTORS.RSVP.SUBMIT_BUTTON) ||
                           this.form.querySelector('button[type="submit"]') ||
                           this.form.querySelector('[data-rsvp-submit]');
        
        // Elementos de UI
        this.loader = this.container.querySelector(SELECTORS.RSVP.LOADER) ||
                     this.container.querySelector('[data-rsvp-loader]');
        
        this.modal = this.container.querySelector(SELECTORS.RSVP.MODAL) ||
                    this.container.querySelector('[data-rsvp-modal]');
        
        console.log('📋 RSVP form elements discovered');
    }
    
    /**
     * Configura la validación del formulario
     */
    async setupFormValidation() {
        if (!this.form || !this.validationService) {
            return;
        }
        
        // Importar FormValidatorComponent dinámicamente
        try {
            const { FormValidatorComponent } = await import('../components/ui/form-validator.js');
            this.formValidator = new FormValidatorComponent(this.form, this.validationService, {
                validateOnInput: true,
                validateOnBlur: true,
                validateOnSubmit: false, // Manejamos submit manualmente
                showErrorsInline: true
            });
            
            await this.formValidator.init();
            console.log('✅ RSVP form validation setup complete');
        } catch (error) {
            console.warn('Could not setup form validation:', error);
        }
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        if (!this.form) return;
        
        // Submit del formulario
        const submitHandler = (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        };
        
        this.form.addEventListener('submit', submitHandler);
        this.eventListeners.set('form-submit', {
            element: this.form,
            event: 'submit',
            handler: submitHandler
        });
        
        // Cambios en campos del formulario
        const changeHandler = (e) => {
            if (this.options.autoSave) {
                this.handleFieldChange(e.target);
            }
        };
        
        this.form.addEventListener('change', changeHandler);
        this.eventListeners.set('form-change', {
            element: this.form,
            event: 'change',
            handler: changeHandler
        });
        
        // Input en campos de texto
        const inputHandler = (e) => {
            this.handleFieldInput(e.target);
        };
        
        this.form.addEventListener('input', inputHandler);
        this.eventListeners.set('form-input', {
            element: this.form,
            event: 'input',
            handler: inputHandler
        });
        
        // Click en botón de submit (para feedback visual)
        if (this.submitButton) {
            const buttonClickHandler = () => {
                this.handleSubmitButtonClick();
            };
            
            this.submitButton.addEventListener('click', buttonClickHandler);
            this.eventListeners.set('submit-click', {
                element: this.submitButton,
                event: 'click',
                handler: buttonClickHandler
            });
        }
    }
    
    /**
     * Carga datos iniciales
     */
    async loadInitialData() {
        try {
            // Obtener ID de invitación de la URL o formulario
            const invitationId = this.getInvitationId();
            
            if (invitationId) {
                await this.loadInvitation(invitationId);
            }
            
            // Prellenar formulario si hay datos guardados
            this.prefillForm();
            
        } catch (error) {
            console.error('Error loading initial RSVP data:', error);
        }
    }
    
    /**
     * Obtiene el ID de invitación
     * @returns {string|null}
     */
    getInvitationId() {
        // Buscar en URL params
        const urlParams = new URLSearchParams(window.location.search);
        let invitationId = urlParams.get('id') || urlParams.get('invitation');
        
        // Buscar en formulario
        if (!invitationId && this.form) {
            const hiddenInput = this.form.querySelector('input[name="invitation_id"], input[name="id"]');
            if (hiddenInput) {
                invitationId = hiddenInput.value;
            }
        }
        
        // Buscar en data attributes
        if (!invitationId) {
            invitationId = this.container.getAttribute('data-invitation-id') ||
                          this.form?.getAttribute('data-invitation-id');
        }
        
        return invitationId;
    }
    
    /**
     * Carga una invitación específica
     * @param {string} invitationId - ID de la invitación
     */
    async loadInvitation(invitationId) {
        try {
            this.showLoader('Cargando invitación...');
            
            this.currentInvitation = await this.invitationService.getInvitation(invitationId);
            
            if (this.currentInvitation) {
                this.populateFormWithInvitation(this.currentInvitation);
                this.emit(EVENTS.RSVP.INVITATION_LOADED, {
                    invitation: this.currentInvitation
                });
            }
            
        } catch (error) {
            console.error('Error loading invitation:', error);
            this.showError('Error al cargar la invitación');
        } finally {
            this.hideLoader();
        }
    }
    
    /**
     * Puebla el formulario con datos de la invitación
     * @param {Object} invitation - Datos de la invitación
     */
    populateFormWithInvitation(invitation) {
        if (!this.form || !invitation) return;
        
        // Llenar campos básicos
        const nameField = this.form.querySelector('[name="guest_name"], [name="name"]');
        if (nameField && invitation.guestName) {
            nameField.value = invitation.guestName;
        }
        
        const emailField = this.form.querySelector('[name="email"]');
        if (emailField && invitation.email) {
            emailField.value = invitation.email;
        }
        
        const phoneField = this.form.querySelector('[name="phone"]');
        if (phoneField && invitation.phone) {
            phoneField.value = invitation.phone;
        }
        
        // Llenar estado de confirmación si existe
        const attendingField = this.form.querySelector('[name="attending"]');
        if (attendingField && invitation.attending !== undefined) {
            if (attendingField.type === 'checkbox') {
                attendingField.checked = invitation.attending;
            } else {
                attendingField.value = invitation.attending ? 'yes' : 'no';
            }
        }
        
        // Llenar número de acompañantes
        const guestsField = this.form.querySelector('[name="guests"], [name="guest_count"]');
        if (guestsField && invitation.guestCount !== undefined) {
            guestsField.value = invitation.guestCount;
        }
        
        console.log('📝 Form populated with invitation data');
    }
    
    /**
     * Prellena el formulario con datos guardados localmente
     */
    prefillForm() {
        try {
            const savedData = localStorage.getItem('rsvp_draft');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.populateFormWithData(data);
            }
        } catch (error) {
            console.warn('Could not load saved RSVP data:', error);
        }
    }
    
    /**
     * Puebla el formulario con datos específicos
     * @param {Object} data - Datos para llenar
     */
    populateFormWithData(data) {
        if (!this.form || !data) return;
        
        Object.keys(data).forEach(key => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = Boolean(data[key]);
                } else {
                    field.value = data[key];
                }
            }
        });
    }
    
    /**
     * Maneja el envío del formulario
     */
    async handleFormSubmit() {
        if (this.isSubmitting) {
            return;
        }
        
        console.log('📤 Processing RSVP form submission...');
        
        // Validar formulario si está configurado
        if (this.formValidator) {
            const isValid = await this.formValidator.validateForm();
            if (!isValid) {
                this.showError('Por favor, corrige los errores en el formulario');
                return;
            }
        }
        
        // Obtener datos del formulario
        const formData = this.getFormData();
        
        // Emitir evento antes de enviar
        this.emit(EVENTS.RSVP.BEFORE_SUBMIT, { data: formData });
        
        try {
            this.isSubmitting = true;
            this.setSubmitButtonState(true);
            this.showLoader('Enviando confirmación...');
            
            // Delay para evitar doble submit
            await new Promise(resolve => setTimeout(resolve, this.options.submitDelay));
            
            // Enviar RSVP
            const result = await this.submitRSVP(formData);
            
            // Limpiar datos guardados localmente
            localStorage.removeItem('rsvp_draft');
            
            // Mostrar confirmación
            if (this.options.showConfirmation) {
                await this.showConfirmation(result);
            }
            
            // Emitir evento de éxito
            this.emit(EVENTS.RSVP.SUBMITTED, { 
                data: formData, 
                result: result 
            });
            
        } catch (error) {
            console.error('Error submitting RSVP:', error);
            this.showError('Error al enviar la confirmación. Por favor, inténtalo de nuevo.');
            
            // Emitir evento de error
            this.emit(EVENTS.RSVP.SUBMIT_ERROR, { 
                error: error, 
                data: formData 
            });
            
        } finally {
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
            this.hideLoader();
        }
    }
    
    /**
     * Obtiene los datos del formulario
     * @returns {Object}
     */
    getFormData() {
        if (!this.form) return {};
        
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Procesar campos especiales
        data.attending = this.getAttendingValue();
        data.guest_count = parseInt(data.guests || data.guest_count || 0);
        data.invitation_id = this.getInvitationId();
        
        return data;
    }
    
    /**
     * Obtiene el valor de asistencia
     * @returns {boolean}
     */
    getAttendingValue() {
        const attendingField = this.form?.querySelector('[name="attending"]');
        if (!attendingField) return false;
        
        if (attendingField.type === 'checkbox') {
            return attendingField.checked;
        } else {
            return attendingField.value === 'yes' || attendingField.value === 'true';
        }
    }
    
    /**
     * Envía el RSVP
     * @param {Object} data - Datos del RSVP
     * @returns {Promise<Object>}
     */
    async submitRSVP(data) {
        return await this.invitationService.confirmAttendance(data);
    }
    
    /**
     * Maneja cambios en campos del formulario
     * @param {HTMLElement} field - Campo que cambió
     */
    handleFieldChange(field) {
        // Guardar borrador automáticamente
        if (this.options.autoSave) {
            this.saveDraft();
        }
        
        // Emitir evento de cambio
        this.emit(EVENTS.RSVP.FIELD_CHANGED, {
            field: field.name,
            value: field.value,
            type: field.type
        });
    }
    
    /**
     * Maneja input en campos de texto
     * @param {HTMLElement} field - Campo con input
     */
    handleFieldInput(field) {
        // Validación en tiempo real si está habilitada
        if (this.formValidator && field.name) {
            this.formValidator.validateField(field.name, field.value);
        }
    }
    
    /**
     * Maneja click en botón de submit
     */
    handleSubmitButtonClick() {
        // Feedback visual inmediato
        if (this.submitButton) {
            this.submitButton.classList.add('clicked');
            setTimeout(() => {
                this.submitButton.classList.remove('clicked');
            }, 200);
        }
    }
    
    /**
     * Guarda un borrador del formulario
     */
    saveDraft() {
        try {
            const formData = this.getFormData();
            localStorage.setItem('rsvp_draft', JSON.stringify(formData));
            console.log('💾 RSVP draft saved');
        } catch (error) {
            console.warn('Could not save RSVP draft:', error);
        }
    }
    
    /**
     * Establece el estado del botón de envío
     * @param {boolean} isLoading - Si está cargando
     */
    setSubmitButtonState(isLoading) {
        if (!this.submitButton) return;
        
        if (isLoading) {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('loading');
            
            // Guardar texto original
            if (!this.submitButton.dataset.originalText) {
                this.submitButton.dataset.originalText = this.submitButton.textContent;
            }
            
            this.submitButton.textContent = 'Enviando...';
        } else {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('loading');
            
            // Restaurar texto original
            if (this.submitButton.dataset.originalText) {
                this.submitButton.textContent = this.submitButton.dataset.originalText;
            }
        }
    }
    
    /**
     * Muestra el loader
     * @param {string} message - Mensaje a mostrar
     */
    showLoader(message = 'Cargando...') {
        if (this.loader) {
            // Si es un componente LoaderComponent
            if (this.loader.show) {
                this.loader.show(message);
            } else {
                // Si es un elemento HTML simple
                this.loader.style.display = 'block';
                const textElement = this.loader.querySelector('.loader-text');
                if (textElement) {
                    textElement.textContent = message;
                }
            }
        }
    }
    
    /**
     * Oculta el loader
     */
    hideLoader() {
        if (this.loader) {
            // Si es un componente LoaderComponent
            if (this.loader.hide) {
                this.loader.hide();
            } else {
                // Si es un elemento HTML simple
                this.loader.style.display = 'none';
            }
        }
    }
    
    /**
     * Muestra un error
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        // Emitir evento de error
        this.emit(EVENTS.RSVP.ERROR, { message });
        
        // Mostrar en modal si existe
        if (this.modal) {
            this.showModalMessage(message, 'error');
        } else {
            // Fallback a alert
            alert(message);
        }
    }
    
    /**
     * Muestra confirmación de envío exitoso
     * @param {Object} result - Resultado del envío
     */
    async showConfirmation(result) {
        const message = result.message || '¡Confirmación enviada exitosamente!';
        
        // Mostrar en modal si existe
        if (this.modal) {
            await this.showModalMessage(message, 'success');
        } else {
            // Fallback a alert
            alert(message);
        }
    }
    
    /**
     * Muestra un mensaje en modal
     * @param {string} message - Mensaje
     * @param {string} type - Tipo ('success', 'error', 'info')
     * @returns {Promise}
     */
    showModalMessage(message, type = 'info') {
        return new Promise((resolve) => {
            if (!this.modal) {
                resolve();
                return;
            }
            
            // Si es un componente ModalComponent
            if (this.modal.alert) {
                this.modal.alert({
                    title: type === 'error' ? 'Error' : 'Confirmación',
                    message: message
                }).then(resolve);
            } else {
                // Si es un elemento HTML simple
                const titleElement = this.modal.querySelector('.modal-title');
                const bodyElement = this.modal.querySelector('.modal-body');
                
                if (titleElement) {
                    titleElement.textContent = type === 'error' ? 'Error' : 'Confirmación';
                }
                
                if (bodyElement) {
                    bodyElement.textContent = message;
                }
                
                // Mostrar modal
                this.modal.style.display = 'block';
                this.modal.classList.add('show');
                
                // Configurar cierre
                const closeModal = () => {
                    this.modal.style.display = 'none';
                    this.modal.classList.remove('show');
                    resolve();
                };
                
                // Cerrar con botón o backdrop
                const closeButton = this.modal.querySelector('.modal-close, .btn-close');
                if (closeButton) {
                    closeButton.addEventListener('click', closeModal, { once: true });
                }
                
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) {
                        closeModal();
                    }
                }, { once: true });
            }
        });
    }
    
    /**
     * Obtiene el estado actual del RSVP
     * @returns {Object}
     */
    getCurrentState() {
        return {
            invitation: this.currentInvitation,
            formData: this.getFormData(),
            isSubmitting: this.isSubmitting,
            isValid: this.formValidator ? this.formValidator.isFormValid() : true
        };
    }
    
    /**
     * Resetea el formulario
     */
    resetForm() {
        if (this.form) {
            this.form.reset();
        }
        
        if (this.formValidator) {
            this.formValidator.reset();
        }
        
        // Limpiar borrador guardado
        localStorage.removeItem('rsvp_draft');
        
        this.currentInvitation = null;
        
        console.log('🔄 RSVP form reset');
    }
    
    /**
     * Registra un listener para eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    on(event, callback) {
        if (!this.eventListeners.has(`custom-${event}`)) {
            this.eventListeners.set(`custom-${event}`, []);
        }
        this.eventListeners.get(`custom-${event}`).push(callback);
    }
    
    /**
     * Remueve un listener de eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(`custom-${event}`);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emite un evento
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(`custom-${event}`);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        
        // También emitir en el contenedor como evento DOM
        if (this.container) {
            const customEvent = new CustomEvent(event, { detail: data });
            this.container.dispatchEvent(customEvent);
        }
    }
    
    /**
     * Actualiza las opciones del controlador
     * @param {Object} newOptions - Nuevas opciones
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        console.log('⚙️ RSVP controller options updated');
    }
    
    /**
     * Destruye el controlador y limpia recursos
     */
    destroy() {
        // Remover event listeners
        this.eventListeners.forEach((listener, key) => {
            if (listener.element && listener.handler) {
                listener.element.removeEventListener(listener.event, listener.handler);
            }
        });
        
        // Destruir validador si existe
        if (this.formValidator) {
            this.formValidator.destroy();
        }
        
        // Limpiar referencias
        this.eventListeners.clear();
        this.form = null;
        this.formValidator = null;
        this.submitButton = null;
        this.loader = null;
        this.modal = null;
        this.container = null;
        this.invitationService = null;
        this.validationService = null;
        this.currentInvitation = null;
        
        this.isInitialized = false;
        console.log('🗑️ RSVPController destroyed');
    }
}
