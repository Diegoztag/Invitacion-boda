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
            <form id="rsvpForm">
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
                <button type="submit" id="submitRsvp">Enviar</button>
            </form>
            <div class="loader" style="display: none;"></div>
            <div class="modal-container" style="display: none;"></div>
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
            expect(rsvpController.ui.form).toBeDefined();
            expect(rsvpController.ui.submitButton).toBeDefined();
            expect(rsvpController.ui.loader).toBeDefined();
            expect(rsvpController.ui.modal).toBeDefined();
        });

        it('loads initial data when invitation ID is present', async () => {
            const mockInvitation = {
                id: 'test-invitation',
                guestNames: ['John Doe'],
                numberOfPasses: 1,
                confirmed: false
            };
            rsvpController.rsvpFacade = {
                loadInvitation: jest.fn().mockResolvedValue(mockInvitation)
            };

            await rsvpController.init();

            expect(rsvpController.rsvpFacade.loadInvitation).toHaveBeenCalledWith(
                'test-invitation-id'
            );
            expect(rsvpController.currentInvitation).toEqual(mockInvitation);
        });

        it('handles initialization errors gracefully', async () => {
            rsvpController.rsvpFacade = {
                loadInvitation: jest.fn().mockRejectedValue(new Error('Load failed'))
            };

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
            rsvpController.rsvpFacade = {
                submitConfirmation: jest.fn().mockResolvedValue(mockResult)
            };

            // Mock getFormData
            rsvpController.ui.getFormData = jest.fn().mockReturnValue({ attending: true });
            rsvpController._getInvitationId = jest.fn().mockReturnValue('test-code');

            // Mock formValidator
            rsvpController.formValidator = { validateForm: jest.fn().mockResolvedValue(true) };

            const submitEvent = new Event('submit');
            submitEvent.preventDefault = jest.fn();
            await rsvpController._handleFormSubmit(submitEvent);

            expect(rsvpController.rsvpFacade.submitConfirmation).toHaveBeenCalledWith('test-code', {
                attending: true
            });
        });

        it('prevents double submission', async () => {
            rsvpController.isSubmitting = true;
            rsvpController.rsvpFacade = { submitConfirmation: jest.fn() };

            const submitEvent = new Event('submit');
            submitEvent.preventDefault = jest.fn();
            await rsvpController._handleFormSubmit(submitEvent);

            expect(rsvpController.rsvpFacade.submitConfirmation).not.toHaveBeenCalled();
        });

        it('handles submission errors', async () => {
            rsvpController.rsvpFacade = {
                submitConfirmation: jest.fn().mockRejectedValue(new Error('Submit failed'))
            };

            // Mock getFormData
            rsvpController.ui.getFormData = jest.fn().mockReturnValue({ attending: true });
            rsvpController._getInvitationId = jest.fn().mockReturnValue('test-code');

            // Mock formValidator
            rsvpController.formValidator = { validateForm: jest.fn().mockResolvedValue(true) };

            const emitSpy = jest.spyOn(rsvpController, 'emit');

            const submitEvent = new Event('submit');
            submitEvent.preventDefault = jest.fn();
            await rsvpController._handleFormSubmit(submitEvent);

            expect(rsvpController.rsvpFacade.submitConfirmation).toHaveBeenCalledWith('test-code', {
                attending: true
            });
            expect(emitSpy).toHaveBeenCalledWith(EVENTS.RSVP.SUBMIT_ERROR, {
                error: new Error('Submit failed')
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
            // Mock the event target
            const event = new Event('change', { bubbles: true });
            Object.defineProperty(event, 'target', { value: attendanceCheck, enumerable: true });

            rsvpController._handleFormChange(event);

            expect(attendanceDetails.style.display).toBe('block');
        });

        it('hides attendance details when not attending', () => {
            const attendanceCheck = container.querySelector('.attendance-check[value="no"]');
            const attendanceDetails = container.querySelector('#attendanceDetails');

            attendanceCheck.checked = true;
            // Mock the event target
            const event = new Event('change', { bubbles: true });
            Object.defineProperty(event, 'target', { value: attendanceCheck, enumerable: true });

            rsvpController._handleFormChange(event);

            // Initially hidden
            expect(attendanceDetails.classList.contains('visible')).toBe(false);
        });
    });

    describe('destruction', () => {
        it('cleans up event listeners and references', async () => {
            await rsvpController.init();

            rsvpController.destroy();

            expect(rsvpController.isInitialized).toBe(false);
        });
    });
});
