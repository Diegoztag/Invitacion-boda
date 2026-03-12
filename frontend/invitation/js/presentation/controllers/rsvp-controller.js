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
            allowReconfirmation: window.WEDDING_CONFIG?.rsvpForm?.allowReconfirmation ?? false,
            showPhoneField: window.WEDDING_CONFIG?.rsvpForm?.showPhoneField ?? false,
            requirePhone: window.WEDDING_CONFIG?.rsvpForm?.requirePhone ?? false,
            showDietaryRestrictions:
                window.WEDDING_CONFIG?.rsvpForm?.showDietaryRestrictions ?? false,
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

        // Asegurar que no haya selección por defecto si no hay datos confirmados
        if (!this.currentInvitation?.confirmed && !localStorage.getItem('rsvp_draft')) {
            const clearCheckboxes = () => {
                const attendanceChecks = this.form.querySelectorAll('.attendance-check');
                attendanceChecks.forEach(check => {
                    check.checked = false;
                });
                const attendanceValue = this.form.querySelector('#attendanceValue');
                if (attendanceValue) {
                    attendanceValue.value = '';
                }

                // Ocultar detalles de asistencia
                const attendanceDetails = this.form.querySelector('#attendanceDetails');
                if (attendanceDetails) {
                    attendanceDetails.style.display = 'none';
                    attendanceDetails.classList.remove('visible');
                }
            };

            // Ejecutar inmediatamente
            clearCheckboxes();

            // Y otra vez después de un breve delay para combatir el autofill del navegador
            setTimeout(clearCheckboxes, 100);
        }

        this.isInitialized = true;
        console.log('✅ RSVPController initialized');
    }

    /**
     * Descubre elementos del formulario RSVP
     */
    discoverFormElements() {
        // Formulario principal
        this.form =
            this.container.querySelector(SELECTORS.RSVP.FORM) ||
            this.container.querySelector('form[data-rsvp]') ||
            this.container.querySelector('#rsvp-form');

        if (!this.form) {
            console.warn('RSVP form not found');
            return;
        }

        // Botón de envío
        this.submitButton =
            this.form.querySelector(SELECTORS.RSVP.SUBMIT_BUTTON) ||
            this.form.querySelector('button[type="submit"]') ||
            this.form.querySelector('[data-rsvp-submit]');

        // Elementos de UI
        this.loader =
            this.container.querySelector(SELECTORS.RSVP.LOADER) ||
            this.container.querySelector('[data-rsvp-loader]');

        this.modal =
            this.container.querySelector(SELECTORS.RSVP.MODAL) ||
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
        if (!this.form) {
            return;
        }

        // Submit del formulario
        const submitHandler = e => {
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
        const changeHandler = e => {
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
        const inputHandler = e => {
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

        // Manejadores de asistencia (Radio buttons)
        this.setupAttendanceHandlers();
    }

    /**
     * Configura los manejadores para los checkboxes de asistencia
     */
    setupAttendanceHandlers() {
        if (!this.form) {
            return;
        }

        const attendanceChecks = this.form.querySelectorAll('.attendance-check');
        const attendanceValue = this.form.querySelector('#attendanceValue');

        const handler = e => {
            const clickedCheck = e.target;

            // Comportamiento de exclusión mutua (como radio buttons)
            if (clickedCheck.checked) {
                attendanceChecks.forEach(check => {
                    if (check !== clickedCheck) {
                        check.checked = false;
                    }
                });

                // Actualizar valor oculto
                if (attendanceValue) {
                    attendanceValue.value = clickedCheck.value;
                }

                this.handleAttendanceChange(clickedCheck.value);
            } else {
                // Si se desmarca, limpiar valor
                if (attendanceValue) {
                    attendanceValue.value = '';
                }
                this.handleAttendanceChange('');
            }
        };

        attendanceChecks.forEach(check => {
            check.addEventListener('change', handler);
        });

        this.eventListeners.set('attendance-change', {
            elements: attendanceChecks,
            event: 'change',
            handler: handler
        });
    }

    /**
     * Maneja el cambio en la selección de asistencia
     * @param {string} value - Valor seleccionado ('si' o 'no')
     */
    handleAttendanceChange(value) {
        const attendanceDetails = this.form.querySelector('#attendanceDetails');
        const attendingGuestsSelect = this.form.querySelector('#attendingGuests');
        const phoneGroup = this.form.querySelector('#phoneGroup');
        const phoneInput = this.form.querySelector('#phone');
        const dietaryGroup = this.form.querySelector('#dietaryGroup');

        if (!attendanceDetails) {
            return;
        }

        if (value === 'si') {
            attendanceDetails.style.display = 'block';
            // Pequeño delay para permitir que el display: block se aplique antes de la opacidad
            requestAnimationFrame(() => {
                attendanceDetails.classList.add('visible');
            });

            // Mostrar campo de teléfono según configuración
            if (phoneGroup) {
                if (this.options.showPhoneField) {
                    phoneGroup.style.display = 'block';
                    if (phoneInput) {
                        if (this.options.requirePhone) {
                            phoneInput.setAttribute('required', 'required');
                        } else {
                            phoneInput.removeAttribute('required');
                        }
                    }
                } else {
                    phoneGroup.style.display = 'none';
                    if (phoneInput) {
                        phoneInput.removeAttribute('required');
                    }
                }
            }

            // Mostrar campo de restricciones alimentarias según configuración
            if (dietaryGroup) {
                dietaryGroup.style.display = this.options.showDietaryRestrictions
                    ? 'block'
                    : 'none';
            }

            // Ocultar el select de cantidad de invitados ya que usaremos la lista detallada
            if (attendingGuestsSelect) {
                const selectGroup = attendingGuestsSelect.closest('.form-group');
                if (selectGroup) {
                    selectGroup.style.display = 'none';
                }
            }

            // Si tenemos la invitación cargada, generar los campos de invitados
            if (this.currentInvitation) {
                this.generateGuestFields(this.currentInvitation);
            }
        } else {
            attendanceDetails.classList.remove('visible');

            // Ocultar campos adicionales
            if (phoneGroup) {
                phoneGroup.style.display = 'none';
                if (phoneInput) {
                    phoneInput.removeAttribute('required');
                }
            }

            if (dietaryGroup) {
                dietaryGroup.style.display = 'none';
            }

            setTimeout(() => {
                if (
                    attendanceDetails.style.display !== 'none' &&
                    !attendanceDetails.classList.contains('visible')
                ) {
                    attendanceDetails.style.display = 'none';
                }
            }, 300); // Coincidir con duración de transición CSS
        }
    }

    /**
     * Genera los campos de selección de invitados
     * @param {Object} invitation - Datos de la invitación
     */
    generateGuestFields(invitation) {
        const attendingNamesList = this.form.querySelector('#attendingNamesList');
        const attendingNamesGroup = this.form.querySelector('#attendingNamesGroup');

        if (!attendingNamesList || !attendingNamesGroup) {
            return;
        }

        // Limpiar lista actual
        attendingNamesList.innerHTML = '';

        // Asegurar que el grupo de nombres sea visible
        attendingNamesGroup.style.display = 'block';

        // Si hay nombres de invitados, generar inputs y checkboxes
        if (invitation.guestNames && invitation.guestNames.length > 0) {
            invitation.guestNames.forEach((name, index) => {
                const div = document.createElement('div');
                div.className = 'guest-row';
                div.style.cssText =
                    'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';

                div.innerHTML = `
                    <input type="text" 
                           name="guest_name_${index}" 
                           value="${name}" 
                           class="form-control" 
                           style="flex: 1;"
                           placeholder="Nombre del invitado"
                           readonly>
                    <label class="checkbox-label" style="margin: 0; white-space: nowrap;">
                        <input type="checkbox" 
                               name="guest_attending_${index}" 
                               value="yes" 
                               checked>
                    </label>
                `;
                attendingNamesList.appendChild(div);
            });
        } else {
            // Si no hay nombres, generar campos vacíos según el número de pases
            const maxGuests = invitation.numberOfPasses || 1;
            for (let i = 0; i < maxGuests; i++) {
                const div = document.createElement('div');
                div.className = 'guest-row';
                div.style.cssText =
                    'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';

                div.innerHTML = `
                    <input type="text" 
                           name="guest_name_${i}" 
                           class="form-control" 
                           style="flex: 1;"
                           placeholder="Nombre del invitado ${i + 1}">
                    <label class="checkbox-label" style="margin: 0; white-space: nowrap;">
                        <input type="checkbox" 
                               name="guest_attending_${i}" 
                               value="yes" 
                               checked>
                    </label>
                `;
                attendingNamesList.appendChild(div);
            }
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
            const hiddenInput = this.form.querySelector(
                'input[name="invitation_id"], input[name="id"]'
            );
            if (hiddenInput) {
                invitationId = hiddenInput.value;
            }
        }

        // Buscar en data attributes
        if (!invitationId) {
            invitationId =
                this.container.getAttribute('data-invitation-id') ||
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

            // Usar loadInvitation en lugar de getInvitation
            this.currentInvitation = await this.invitationService.loadInvitation(invitationId);

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
        if (!this.form || !invitation) {
            console.error('❌ populateFormWithInvitation called with null form or invitation');
            return;
        }

        console.log('📝 Populating form with invitation:', invitation);
        console.log('📝 Guest names type:', typeof invitation.guestNames);
        console.log('📝 Guest names value:', invitation.guestNames);

        // Normalizar status para comparaciones robustas
        // Usar getStatus() si está disponible (instancia de clase), o la propiedad status (objeto plano)
        const rawStatus =
            typeof invitation.getStatus === 'function'
                ? invitation.getStatus()
                : invitation.status || '';
        const status = rawStatus.toLowerCase().trim();
        console.log('📝 Normalized status:', status);
        console.log('⚙️ allowReconfirmation option:', this.options.allowReconfirmation);

        // Mostrar información de la invitación
        const guestNamesElement = this.container.querySelector('#guestNames');
        const numberOfPassesElement = this.container.querySelector('#numberOfPasses');
        const invitationInfo = this.container.querySelector('#invitationInfo');

        if (guestNamesElement) {
            if (invitation.guestNames && invitation.guestNames.length > 0) {
                const names = Array.isArray(invitation.guestNames)
                    ? invitation.guestNames.join(' y ')
                    : invitation.guestNames;
                console.log('📝 Setting guest names text:', names);
                guestNamesElement.textContent = names;
            } else {
                console.warn('⚠️ No guest names in invitation data');
                guestNamesElement.textContent = 'Invitado';
            }
        } else {
            console.warn('⚠️ #guestNames element not found in container');
        }

        if (numberOfPassesElement) {
            if (invitation.numberOfPasses) {
                numberOfPassesElement.textContent = invitation.numberOfPasses;
            }
        } else {
            console.warn('⚠️ #numberOfPasses element not found in container');
        }

        if (invitationInfo) {
            invitationInfo.style.display = 'block';
        } else {
            console.warn('⚠️ #invitationInfo element not found in container');
        }

        // Verificar estado de confirmación para mostrar mensajes
        // Buscamos primero en el contenedor, y si no, en todo el documento para mayor robustez
        let alreadyConfirmedDiv = this.container.querySelector('#alreadyConfirmed');
        if (!alreadyConfirmedDiv) {
            alreadyConfirmedDiv = document.getElementById('alreadyConfirmed');
        }

        let alreadyCancelledDiv = this.container.querySelector('#alreadyCancelled');
        if (!alreadyCancelledDiv) {
            alreadyCancelledDiv = document.getElementById('alreadyCancelled');
        }

        console.log('🔍 Elements check:', {
            alreadyConfirmedDiv: !!alreadyConfirmedDiv,
            alreadyCancelledDiv: !!alreadyCancelledDiv,
            form: !!this.form
        });

        // Resetear visibilidad por defecto
        if (alreadyConfirmedDiv) {
            alreadyConfirmedDiv.style.display = 'none';
        }
        if (alreadyCancelledDiv) {
            alreadyCancelledDiv.style.display = 'none';
        }
        this.form.style.display = 'block';

        // Verificar status y configuración
        // Forzamos la verificación incluso si allowReconfirmation es true para depuración,
        // pero respetamos la lógica original: si no se permite reconfirmar, mostramos el mensaje y ocultamos el form.

        const shouldBlockReconfirmation = !this.options.allowReconfirmation;
        console.log('🔒 Should block reconfirmation:', shouldBlockReconfirmation);

        if (shouldBlockReconfirmation) {
            if (status === 'confirmed' || status === 'partial') {
                console.log('✅ Status is confirmed/partial. Showing confirmation message.');
                // Mostrar mensaje de confirmación y ocultar form
                if (alreadyConfirmedDiv) {
                    alreadyConfirmedDiv.style.display = 'block';
                    this.form.style.display = 'none';
                    // Forzar ocultamiento con setProperty para mayor prioridad
                    this.form.style.setProperty('display', 'none', 'important');
                    console.log('✅ Invitation already confirmed, hiding form (forced)');
                    return; // DETENER EJECUCIÓN AQUÍ
                } else {
                    console.warn('⚠️ #alreadyConfirmed element not found, cannot hide form');
                }
            } else if (status === 'cancelled' || status === 'declined') {
                console.log('❌ Status is cancelled/declined. Showing cancellation message.');
                // Mostrar mensaje de cancelación y ocultar form
                if (alreadyCancelledDiv) {
                    alreadyCancelledDiv.style.display = 'block';
                    this.form.style.display = 'none';
                    // Forzar ocultamiento con setProperty para mayor prioridad
                    this.form.style.setProperty('display', 'none', 'important');
                    console.log('❌ Invitation cancelled, hiding form (forced)');
                    return; // DETENER EJECUCIÓN AQUÍ
                } else {
                    console.warn('⚠️ #alreadyCancelled element not found, cannot hide form');
                }
            } else {
                console.log('ℹ️ Status is not confirmed or cancelled:', status);
            }
        } else {
            console.log('🔓 Reconfirmation allowed, showing form regardless of status');
        }

        // Llenar campos básicos
        const emailField = this.form.querySelector('[name="email"]');
        if (emailField && invitation.email) {
            emailField.value = invitation.email;
        }

        const phoneField = this.form.querySelector('[name="phone"]');
        if (phoneField && invitation.phone) {
            phoneField.value = invitation.phone;
        }

        // Resetear checkboxes explícitamente
        const attendanceChecks = this.form.querySelectorAll('.attendance-check');
        attendanceChecks.forEach(check => {
            check.checked = false;
        });
        const attendanceValue = this.form.querySelector('#attendanceValue');
        if (attendanceValue) {
            attendanceValue.value = '';
        }

        // Si ya está confirmada, llenar estado
        if (status === 'confirmed' || status === 'partial') {
            const attendingValueStr = 'si';
            const check = this.form.querySelector(
                `.attendance-check[value="${attendingValueStr}"]`
            );
            if (check) {
                check.checked = true;
                if (attendanceValue) {
                    attendanceValue.value = attendingValueStr;
                }
                this.handleAttendanceChange(attendingValueStr);
            }
        } else if (status === 'cancelled' || status === 'declined') {
            const attendingValueStr = 'no';
            const check = this.form.querySelector(
                `.attendance-check[value="${attendingValueStr}"]`
            );
            if (check) {
                check.checked = true;
                if (attendanceValue) {
                    attendanceValue.value = attendingValueStr;
                }
                this.handleAttendanceChange(attendingValueStr);
            }
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
        if (!this.form || !data) {
            return;
        }

        Object.keys(data).forEach(key => {
            // Manejo especial para asistencia (checkboxes exclusivos)
            if (key === 'attendance') {
                const check = this.form.querySelector(`.attendance-check[value="${data[key]}"]`);
                if (check) {
                    check.checked = true;
                    // Actualizar valor oculto
                    const attendanceValue = this.form.querySelector('#attendanceValue');
                    if (attendanceValue) {
                        attendanceValue.value = data[key];
                    }

                    this.handleAttendanceChange(data[key]);
                }
                return;
            }

            // Manejo especial para radio buttons
            const radios = this.form.querySelectorAll(`input[name="${key}"][type="radio"]`);
            if (radios.length > 0) {
                const matchingRadio = Array.from(radios).find(radio => radio.value === data[key]);
                if (matchingRadio) {
                    matchingRadio.checked = true;
                }
                return;
            }

            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
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
        if (!this.form) {
            return {};
        }

        const formData = new FormData(this.form);
        const data = {};

        // Recolectar datos básicos
        for (const [key, value] of formData.entries()) {
            // Ignorar campos de invitados y el checkbox auxiliar de asistencia
            if (!key.startsWith('guest_') && key !== 'attendance_check') {
                data[key] = value;
            }
        }

        // Procesar asistencia
        data.attending = this.getAttendingValue();
        data.invitation_id = this.getInvitationId();

        // Procesar invitados si asiste
        if (data.attending) {
            const guestRows = this.form.querySelectorAll('.guest-row');
            const attendingGuests = [];

            guestRows.forEach((row, index) => {
                const nameInput = row.querySelector(`input[name="guest_name_${index}"]`);
                const attendingCheckbox = row.querySelector(
                    `input[name="guest_attending_${index}"]`
                );

                if (
                    attendingCheckbox &&
                    attendingCheckbox.checked &&
                    nameInput &&
                    nameInput.value.trim()
                ) {
                    attendingGuests.push(nameInput.value.trim());
                }
            });

            data.guest_names = attendingGuests;
            data.guest_count = attendingGuests.length;
        } else {
            data.guest_count = 0;
            data.guest_names = [];
        }

        return data;
    }

    /**
     * Obtiene el valor de asistencia
     * @returns {boolean}
     */
    getAttendingValue() {
        // Buscar checkbox seleccionado
        const selectedCheck = this.form?.querySelector('.attendance-check:checked');
        if (selectedCheck) {
            return selectedCheck.value === 'si';
        }

        // Fallback para valor oculto
        const attendanceValue = this.form?.querySelector('#attendanceValue');
        if (attendanceValue && attendanceValue.value) {
            return attendanceValue.value === 'si';
        }

        return false;
    }

    /**
     * Envía el RSVP
     * @param {Object} data - Datos del RSVP
     * @returns {Promise<Object>}
     */
    async submitRSVP(data) {
        // Extraer el código de invitación de los datos
        const code =
            data.invitation_id || (this.currentInvitation ? this.currentInvitation.code : null);

        if (!code) {
            throw new Error('No se pudo determinar el código de invitación para enviar el RSVP');
        }

        return await this.invitationService.confirmAttendance(code, data);
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
        if (!this.submitButton) {
            return;
        }

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
        // Determinar mensaje basado en la asistencia
        const isAttending = this.getAttendingValue();

        // Ocultar formulario
        if (this.form) {
            this.form.style.display = 'none';
            this.form.style.setProperty('display', 'none', 'important');
        }

        // Mostrar el div correspondiente
        if (isAttending) {
            const alreadyConfirmedDiv =
                this.container.querySelector('#alreadyConfirmed') ||
                document.getElementById('alreadyConfirmed');
            if (alreadyConfirmedDiv) {
                alreadyConfirmedDiv.style.display = 'block';
                // Scroll hacia el mensaje para asegurar que el usuario lo vea
                alreadyConfirmedDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            const alreadyCancelledDiv =
                this.container.querySelector('#alreadyCancelled') ||
                document.getElementById('alreadyCancelled');
            if (alreadyCancelledDiv) {
                alreadyCancelledDiv.style.display = 'block';
                // Scroll hacia el mensaje para asegurar que el usuario lo vea
                alreadyCancelledDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    /**
     * Muestra un mensaje en modal
     * @param {string} message - Mensaje
     * @param {string} type - Tipo ('success', 'error', 'info')
     * @param {string} customTitle - Título personalizado
     * @returns {Promise}
     */
    showModalMessage(message, type = 'info', customTitle = null) {
        return new Promise(resolve => {
            if (!this.modal) {
                resolve();
                return;
            }

            const defaultTitle = type === 'error' ? 'Error' : 'Confirmación';
            const title = customTitle || defaultTitle;

            // Si es un componente ModalComponent
            if (this.modal.alert) {
                this.modal
                    .alert({
                        title: title,
                        message: message
                    })
                    .then(resolve);
            } else {
                // Si es un elemento HTML simple
                const titleElement = this.modal.querySelector('.modal-title');
                const bodyElement =
                    this.modal.querySelector('#modalMessage') ||
                    this.modal.querySelector('.modal-body p') ||
                    this.modal.querySelector('.modal-body');

                if (titleElement) {
                    titleElement.textContent = title;
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

                this.modal.addEventListener(
                    'click',
                    e => {
                        if (e.target === this.modal) {
                            closeModal();
                        }
                    },
                    { once: true }
                );
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
