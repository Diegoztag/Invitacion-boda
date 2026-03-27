import { EVENTS } from '../../shared/constants/events.js';
import { RSVPService } from '../../core/services/rsvp-service.js';
import { RSVPUI } from '../ui/rsvp-ui.js';
import { FormValidatorComponent } from '../components/ui/form-validator.js';
import { sanitize } from '../../shared/helpers/sanitizer.js';

export class RSVPController {
    constructor(container, rsvpService, validationService, options = {}) {
        this.container = container;
        this.rsvpService = rsvpService;
        this.validationService = validationService; // Still needed for FormValidator
        this.options = {
            allowReconfirmation: false,
            ...options
        };

        this.ui = new RSVPUI(container, this.options);
        this.formValidator = null;
        this.currentInvitation = null;
        this.isSubmitting = false;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized || !this.ui.form) {
            return;
        }

        await this.setupFormValidation();
        this.setupEventListeners();
        await this.loadInitialData();

        this.isInitialized = true;
    }

    async setupFormValidation() {
        if (this.validationService) {
            this.formValidator = new FormValidatorComponent(this.ui.form, this.validationService);
            await this.formValidator.init();
        }
    }

    setupEventListeners() {
        this.ui.form.addEventListener('submit', this.handleFormSubmit.bind(this));

        const attendanceChecks = this.ui.form.querySelectorAll('.attendance-check');
        attendanceChecks.forEach(check => {
            check.addEventListener('change', e => this.handleAttendanceChange(e.target.value));
        });
    }

    async loadInitialData() {
        const invitationId = this.getInvitationId();
        if (invitationId) {
            try {
                this.currentInvitation = await this.rsvpService.loadInvitation(invitationId);
                this.ui.populateInvitationDetails(this.currentInvitation);
                this.handleInvitationStatus();
            } catch (error) {
                this.emit(EVENTS.RSVP.ERROR, { message: 'Error al cargar la invitación.' });
            }
        }
    }

    handleInvitationStatus() {
        const status = this.currentInvitation?.status?.toLowerCase() || '';
        if (!this.options.allowReconfirmation) {
            if (status === 'confirmed' || status === 'partial') {
                this.ui.showStatusMessage('confirmed');
                return;
            }
            if (status === 'cancelled' || status === 'declined') {
                this.ui.showStatusMessage('cancelled');
                return;
            }
        }
        this.ui.showForm();
    }

    handleAttendanceChange(value) {
        this.ui.updateAttendanceDetails(value, this.currentInvitation);
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) {
            return;
        }

        if (this.formValidator) {
            const isValid = await this.formValidator.validateForm();
            if (!isValid) {
                this.emit(EVENTS.RSVP.ERROR, { message: 'Por favor, corrige los errores.' });
                return;
            }
        }

        this.isSubmitting = true;
        this.ui.setSubmitButtonState(true);

        const invitationId = this.getInvitationId();
        const rawFormData = this.ui.getFormData(invitationId);

        // Sanitize form data before submitting
        const formData = Object.entries(rawFormData).reduce((acc, [key, value]) => {
            acc[key] = typeof value === 'string' ? sanitize(value) : value;
            return acc;
        }, {});

        try {
            const result = await this.rsvpService.submitConfirmation(invitationId, formData);
            this.emit(EVENTS.RSVP.SUBMITTED, { result });
            this.ui.showStatusMessage(formData.attending ? 'confirmed' : 'cancelled');
        } catch (error) {
            this.emit(EVENTS.RSVP.SUBMIT_ERROR, { error });
        } finally {
            this.isSubmitting = false;
            this.ui.setSubmitButtonState(false);
        }
    }

    getInvitationId() {
        const urlParams = new URLSearchParams(window.location.search);
        return (
            urlParams.get('id') ||
            this.container.dataset.invitationId ||
            this.ui.form?.querySelector('input[name="invitation_id"]')?.value
        );
    }

    on(event, callback) {
        this.container.addEventListener(event, e => callback(e.detail));
    }

    emit(event, data) {
        const customEvent = new CustomEvent(event, { detail: data });
        this.container.dispatchEvent(customEvent);
    }

    destroy() {
        // Remove event listeners and clean up
        this.isInitialized = false;
    }
}
