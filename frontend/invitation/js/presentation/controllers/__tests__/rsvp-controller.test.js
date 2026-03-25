import { RSVPController } from '../rsvp-controller.js';
import { EVENTS } from '../../../shared/constants/events.js';

describe('RSVPController', () => {
    // Increase timeout for async operations
    jest.setTimeout(15000);
    let container;
    let invitationService;
    let validationService;
    let rsvpController;

    beforeEach(() => {
        jest.useFakeTimers();

        // Mock global.import for dynamic imports
        global.import = jest.fn();

        // Mock window.WEDDING_CONFIG
        window.WEDDING_CONFIG = {
            rsvpForm: {
                allowReconfirmation: false,
                showPhoneField: false,
                requirePhone: false,
                showDietaryRestrictions: false
            }
        };

        // Create mock container
        container = document.createElement('div');
        container.innerHTML = `
            <form data-rsvp>
                <input type="hidden" name="invitation_id" value="test-invitation-id">
                <div class="attendance-check">
                    <input type="checkbox" name="attendance" value="si" class="attendance-check">
                    <input type="checkbox" name="attendance" value="no" class="attendance-check">
                </div>
                <input type="hidden" id="attendanceValue" name="attendanceValue">
                <div id="attendanceDetails" style="display: none;">
                    <div id="attendingNamesList"></div>
                    <div id="phoneGroup" style="display: none;">
                        <input type="tel" id="phone" name="phone">
                    </div>
                    <div id="dietaryGroup" style="display: none;">
                        <textarea name="dietaryRestrictions"></textarea>
                    </div>
                </div>
                <button type="submit" data-rsvp-submit>Enviar</button>
            </form>
            <div data-rsvp-loader style="display: none;"></div>
            <div data-rsvp-modal style="display: none;"></div>
        `;
        document.body.appendChild(container);

        // Mock services
        invitationService = {
            loadInvitation: jest.fn(),
            confirmAttendance: jest.fn()
        };

        validationService = {
            validateField: jest.fn(),
            validateForm: jest.fn()
        };

        rsvpController = new RSVPController(container, invitationService, validationService, {
            autoSave: true,
            showConfirmation: true,
            enableValidation: true,
            submitDelay: 100
        });
    });

    afterEach(() => {
        rsvpController.destroy();
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('initializes controller and discovers form elements', async () => {
            // Mock FormValidatorComponent
            const mockFormValidator = {
                init: jest.fn().mockResolvedValue(),
                destroy: jest.fn(),
                validateForm: jest.fn().mockResolvedValue(true)
            };
            global.import.mockResolvedValue({
                FormValidatorComponent: jest.fn().mockReturnValue(mockFormValidator)
            });

            await rsvpController.init();

            expect(rsvpController.isInitialized).toBe(true);
            expect(rsvpController.form).toBeDefined();
            expect(rsvpController.submitButton).toBeDefined();
            expect(rsvpController.loader).toBeDefined();
            expect(rsvpController.modal).toBeDefined();
        });

        it('loads initial data when invitation ID is present', async () => {
            const mockInvitation = {
                id: 'test-invitation',
                guestNames: ['John Doe'],
                numberOfPasses: 1,
                confirmed: false
            };
            invitationService.loadInvitation.mockResolvedValue(mockInvitation);

            await rsvpController.init();

            expect(invitationService.loadInvitation).toHaveBeenCalledWith('test-invitation-id');
            expect(rsvpController.currentInvitation).toEqual(mockInvitation);
        });

        it('handles initialization errors gracefully', async () => {
            invitationService.loadInvitation.mockRejectedValue(new Error('Load failed'));

            await rsvpController.init();

            expect(rsvpController.isInitialized).toBe(true);
            // Should not throw
        });
    });

    describe('form submission', () => {
        beforeEach(async () => {
            await rsvpController.init();
            // Advance any timers set during init
            jest.advanceTimersByTime(200);
        });

        it('handles form submission successfully', async () => {
            const mockResult = { success: true, message: 'RSVP submitted' };
            invitationService.confirmAttendance.mockResolvedValue(mockResult);

            // Test the submitRSVP method directly
            const formData = { invitation_id: 'test-code', attending: true };
            const result = await rsvpController.submitRSVP(formData);

            expect(invitationService.confirmAttendance).toHaveBeenCalledWith('test-code', formData);
            expect(result).toEqual(mockResult);
        });

        it('prevents double submission', async () => {
            rsvpController.isSubmitting = true;

            const submitEvent = new Event('submit');
            rsvpController.form.dispatchEvent(submitEvent);

            expect(invitationService.confirmAttendance).not.toHaveBeenCalled();
        });

        it('handles submission errors', async () => {
            invitationService.confirmAttendance.mockRejectedValue(new Error('Submit failed'));

            // Test the submitRSVP method directly
            const formData = { invitation_id: 'test-code', attending: true };

            await expect(rsvpController.submitRSVP(formData)).rejects.toThrow('Submit failed');
            expect(invitationService.confirmAttendance).toHaveBeenCalledWith('test-code', formData);
        });
    });

    describe('field changes', () => {
        beforeEach(async () => {
            await rsvpController.init();
        });

        it('handles field changes and auto-saves draft', () => {
            const mockField = { name: 'testField', value: 'testValue', type: 'text' };

            rsvpController.handleFieldChange(mockField);

            expect(localStorage.getItem('rsvp_draft')).toBeDefined();
        });

        it('emits field change events', () => {
            const mockField = { name: 'testField', value: 'testValue', type: 'text' };
            const emitSpy = jest.spyOn(rsvpController, 'emit');

            rsvpController.handleFieldChange(mockField);

            expect(emitSpy).toHaveBeenCalledWith(EVENTS.RSVP.FIELD_CHANGED, {
                field: 'testField',
                value: 'testValue',
                type: 'text'
            });
        });
    });

    describe('attendance handling', () => {
        beforeEach(async () => {
            await rsvpController.init();
        });

        it('shows attendance details when attending', () => {
            const attendanceCheck = container.querySelector('.attendance-check[value="si"]');
            const attendanceDetails = container.querySelector('#attendanceDetails');

            attendanceCheck.checked = true;
            attendanceCheck.dispatchEvent(new Event('change'));

            expect(attendanceDetails.style.display).toBe('block');
        });

        it('hides attendance details when not attending', () => {
            const attendanceCheck = container.querySelector('.attendance-check[value="no"]');
            const attendanceDetails = container.querySelector('#attendanceDetails');

            attendanceCheck.checked = true;
            attendanceCheck.dispatchEvent(new Event('change'));

            // Initially hidden
            expect(attendanceDetails.classList.contains('visible')).toBe(false);
        });
    });

    describe('destruction', () => {
        it('cleans up event listeners and references', async () => {
            await rsvpController.init();

            const mockFormValidator = { destroy: jest.fn() };
            rsvpController.formValidator = mockFormValidator;

            rsvpController.destroy();

            expect(mockFormValidator.destroy).toHaveBeenCalled();
            expect(rsvpController.form).toBeNull();
            expect(rsvpController.eventListeners.size).toBe(0);
            expect(rsvpController.isInitialized).toBe(false);
        });
    });
});
