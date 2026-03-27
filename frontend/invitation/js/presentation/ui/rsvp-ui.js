import { SELECTORS } from '../../shared/constants/selectors.js';

/**
 * RSVP UI Manager
 * Handles all DOM manipulations for the RSVP form.
 */
export class RSVPUI {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showPhoneField: false,
            requirePhone: false,
            showDietaryRestrictions: false,
            ...options
        };

        this.form = null;
        this.submitButton = null;
        this.loader = null;
        this.modal = null;
        this.invitationInfo = null;
        this.guestNamesElement = null;
        this.numberOfPassesElement = null;
        this.alreadyConfirmedDiv = null;
        this.alreadyCancelledDiv = null;
        this.attendanceDetails = null;
        this.phoneGroup = null;
        this.phoneInput = null;
        this.dietaryGroup = null;
        this.attendingNamesList = null;
        this.attendingNamesGroup = null;

        this.discoverElements();
    }

    /**
     * Finds and assigns all necessary DOM elements.
     */
    discoverElements() {
        this.form = this.container.querySelector(SELECTORS.RSVP.FORM);
        if (!this.form) {
            return;
        }

        this.submitButton = this.form.querySelector(SELECTORS.RSVP.SUBMIT_BUTTON);
        this.loader = this.container.querySelector(SELECTORS.RSVP.LOADER);
        this.modal = this.container.querySelector(SELECTORS.RSVP.MODAL);

        this.invitationInfo = this.container.querySelector('#invitationInfo');
        this.guestNamesElement = this.container.querySelector('#guestNames');
        this.numberOfPassesElement = this.container.querySelector('#numberOfPasses');
        this.alreadyConfirmedDiv = this.container.querySelector('#alreadyConfirmed');
        this.alreadyCancelledDiv = this.container.querySelector('#alreadyCancelled');

        this.attendanceDetails = this.form.querySelector('#attendanceDetails');
        this.phoneGroup = this.form.querySelector('#phoneGroup');
        this.phoneInput = this.form.querySelector('#phone');
        this.dietaryGroup = this.form.querySelector('#dietaryGroup');
        this.attendingNamesList = this.form.querySelector('#attendingNamesList');
        this.attendingNamesGroup = this.form.querySelector('#attendingNamesGroup');
    }

    /**
     * Populates the form with invitation data.
     * @param {Object} invitation - The invitation data.
     */
    populateInvitationDetails(invitation) {
        if (this.guestNamesElement && invitation.guestNames) {
            const names = Array.isArray(invitation.guestNames)
                ? invitation.guestNames.join(' y ')
                : invitation.guestNames;
            this.guestNamesElement.textContent = names;
        }
        if (this.numberOfPassesElement && invitation.numberOfPasses) {
            this.numberOfPassesElement.textContent = invitation.numberOfPasses;
        }
        if (this.invitationInfo) {
            this.invitationInfo.style.display = 'block';
        }
    }

    /**
     * Shows a message and hides the form.
     * @param {'confirmed' | 'cancelled'} type - The type of message to show.
     */
    showStatusMessage(type) {
        if (this.form) {
            this.form.style.display = 'none';
        }
        if (this.alreadyConfirmedDiv) {
            this.alreadyConfirmedDiv.style.display = 'none';
        }
        if (this.alreadyCancelledDiv) {
            this.alreadyCancelledDiv.style.display = 'none';
        }

        if (type === 'confirmed' && this.alreadyConfirmedDiv) {
            this.alreadyConfirmedDiv.style.display = 'block';
        } else if (type === 'cancelled' && this.alreadyCancelledDiv) {
            this.alreadyCancelledDiv.style.display = 'block';
        }
    }

    /**
     * Shows the form.
     */
    showForm() {
        if (this.form) {
            this.form.style.display = 'block';
        }
        if (this.alreadyConfirmedDiv) {
            this.alreadyConfirmedDiv.style.display = 'none';
        }
        if (this.alreadyCancelledDiv) {
            this.alreadyCancelledDiv.style.display = 'none';
        }
    }

    /**
     * Handles the UI changes when attendance selection changes.
     * @param {string} value - The selected attendance value ('si' or 'no').
     * @param {Object} invitation - The current invitation data.
     */
    updateAttendanceDetails(value, invitation) {
        if (!this.attendanceDetails) {
            return;
        }

        if (value === 'si') {
            this.attendanceDetails.style.display = 'block';
            requestAnimationFrame(() => {
                this.attendanceDetails.classList.add('visible');
            });

            this.toggleField(this.phoneGroup, this.options.showPhoneField);
            if (this.phoneInput) {
                this.toggleRequired(this.phoneInput, this.options.requirePhone);
            }
            this.toggleField(this.dietaryGroup, this.options.showDietaryRestrictions);

            if (invitation) {
                this.generateGuestFields(invitation);
            }
        } else {
            this.attendanceDetails.classList.remove('visible');
            setTimeout(() => {
                if (!this.attendanceDetails.classList.contains('visible')) {
                    this.attendanceDetails.style.display = 'none';
                }
            }, 300);
        }
    }

    /**
     * Generates the input fields for guest names.
     * @param {Object} invitation - The invitation data.
     */
    generateGuestFields(invitation) {
        if (!this.attendingNamesList || !this.attendingNamesGroup) {
            return;
        }

        this.attendingNamesList.innerHTML = '';
        this.attendingNamesGroup.style.display = 'block';

        const guestNames = invitation.guestNames || [];
        const maxGuests = invitation.numberOfPasses || 1;
        const namesToRender = guestNames.length > 0 ? guestNames : Array(maxGuests).fill('');

        namesToRender.forEach((name, index) => {
            const div = document.createElement('div');
            div.className = 'guest-row';
            div.innerHTML = `
                <input type="text" 
                       name="guest_name_${index}" 
                       value="${name}" 
                       class="form-control" 
                       placeholder="Nombre del invitado ${index + 1}"
                       ${guestNames.length > 0 ? 'readonly' : ''}>
                <label class="checkbox-label">
                    <input type="checkbox" name="guest_attending_${index}" value="yes" checked>
                </label>
            `;
            this.attendingNamesList.appendChild(div);
        });
    }

    /**
     * Sets the loading state of the submit button.
     * @param {boolean} isLoading - Whether the form is submitting.
     */
    setSubmitButtonState(isLoading) {
        if (!this.submitButton) {
            return;
        }

        this.submitButton.disabled = isLoading;
        if (isLoading) {
            this.submitButton.classList.add('loading');
            this.submitButton.dataset.originalText = this.submitButton.textContent;
            this.submitButton.textContent = 'Enviando...';
        } else {
            this.submitButton.classList.remove('loading');
            this.submitButton.textContent = this.submitButton.dataset.originalText;
        }
    }

    /**
     * Shows or hides a field.
     * @param {HTMLElement} field - The field's container element.
     * @param {boolean} show - Whether to show the field.
     */
    toggleField(field, show) {
        if (field) {
            field.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Toggles the 'required' attribute on a field.
     * @param {HTMLElement} input - The input element.
     * @param {boolean} isRequired - Whether the field is required.
     */
    toggleRequired(input, isRequired) {
        if (input) {
            if (isRequired) {
                input.setAttribute('required', 'required');
            } else {
                input.removeAttribute('required');
            }
        }
    }

    /**
     * Gets the form data.
     * @returns {Object} The serialized form data.
     */
    getFormData(invitationId) {
        if (!this.form) {
            return {};
        }

        const formData = new FormData(this.form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            if (!key.startsWith('guest_') && key !== 'attendance_check') {
                data[key] = value;
            }
        }

        data.attending = this.form.querySelector('.attendance-check:checked')?.value === 'si';
        data.invitation_id = invitationId;

        if (data.attending) {
            const guestRows = this.form.querySelectorAll('.guest-row');
            data.guest_names = Array.from(guestRows)
                .map((row, index) => {
                    const nameInput = row.querySelector(`input[name="guest_name_${index}"]`);
                    const attendingCheckbox = row.querySelector(
                        `input[name="guest_attending_${index}"]`
                    );
                    return attendingCheckbox?.checked && nameInput?.value.trim()
                        ? nameInput.value.trim()
                        : null;
                })
                .filter(Boolean);
            data.guest_count = data.guest_names.length;
        } else {
            data.guest_names = [];
            data.guest_count = 0;
        }

        return data;
    }
}
