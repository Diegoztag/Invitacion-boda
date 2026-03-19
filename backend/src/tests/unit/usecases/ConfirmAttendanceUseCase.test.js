const ConfirmAttendanceUseCase = require('../../../application/usecases/ConfirmAttendanceUseCase');
const Invitation = require('../../../core/entities/Invitation');
const Confirmation = require('../../../core/entities/Confirmation');

const mockInvitationRepository = {
    findByCode: jest.fn(),
    update: jest.fn()
};

const mockConfirmationRepository = {
    findByCode: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
};

const mockValidationService = {
    validatePhone: jest.fn(),
    sanitizeString: jest.fn()
};

const mockSseService = {
    notify: jest.fn()
};

const mockLogger = {
    info: jest.fn(),
    error: jest.fn()
};

describe('ConfirmAttendanceUseCase', () => {
    let useCase;

    beforeEach(() => {
        jest.clearAllMocks();

        useCase = new ConfirmAttendanceUseCase(
            mockInvitationRepository,
            mockConfirmationRepository,
            mockValidationService,
            mockSseService,
            mockLogger
        );

        mockValidationService.validatePhone.mockReturnValue(true);
        mockValidationService.sanitizeString.mockImplementation(str => str.trim());
    });

    test('should confirm attendance successfully for positive attending', async () => {
        const invitation = new Invitation({
            code: 'INV001',
            guestNames: ['Juan Pérez'],
            numberOfPasses: 2
        });

        const savedConfirmation = new Confirmation({
            code: 'INV001',
            willAttend: true,
            attendingGuests: 2,
            attendingNames: ['Juan Pérez', 'María García'],
            message: 'Nos vemos'
        });

        mockInvitationRepository.findByCode.mockResolvedValue(invitation);
        mockConfirmationRepository.findByCode.mockResolvedValue(null);
        mockConfirmationRepository.save.mockResolvedValue(savedConfirmation);
        mockInvitationRepository.update.mockResolvedValue(invitation);

        const result = await useCase.execute('INV001', {
            willAttend: true,
            attendingGuests: 2,
            attendingNames: ['Juan Pérez', 'María García'],
            message: 'Nos vemos'
        });

        expect(result.success).toBe(true);
        expect(result.invitation.status).toBe('confirmed');
        expect(result.confirmation).toEqual(savedConfirmation.toObject());
        expect(mockConfirmationRepository.save).toHaveBeenCalled();
        expect(mockInvitationRepository.update).toHaveBeenCalledWith(
            'INV001',
            expect.any(Invitation)
        );
        expect(mockSseService.notify).toHaveBeenCalled();
    });

    test('should fail when invitation does not exist', async () => {
        mockInvitationRepository.findByCode.mockResolvedValue(null);
        const result = await useCase.execute('INV_UNKNOWN', {
            willAttend: true,
            attendingGuests: 1
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invitación no encontrada');
    });

    test('should fail when invitation already confirmed', async () => {
        const invitation = new Invitation({
            code: 'INV001',
            guestNames: ['Juan Pérez'],
            numberOfPasses: 2,
            status: 'confirmed',
            confirmedPasses: 2
        });

        mockInvitationRepository.findByCode.mockResolvedValue(invitation);
        mockConfirmationRepository.findByCode.mockResolvedValue(null);

        const result = await useCase.execute('INV001', {
            willAttend: true,
            attendingGuests: 2
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Esta invitación ya ha sido confirmada');
    });

    test('should enforce validation for required attending guests when willAttend true', async () => {
        const invitation = new Invitation({
            code: 'INV001',
            guestNames: ['Juan Pérez'],
            numberOfPasses: 2
        });

        mockInvitationRepository.findByCode.mockResolvedValue(invitation);
        mockConfirmationRepository.findByCode.mockResolvedValue(null);

        const result = await useCase.execute('INV001', {
            willAttend: true
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Debe especificar el número de invitados que asistirán');
    });

    test('should fail with invalid invitation code', async () => {
        const result = await useCase.execute('', {
            willAttend: false,
            attendingGuests: 0
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('El código de invitación es requerido');
    });

    test('should update existing confirmation successfully', async () => {
        const invitation = new Invitation({
            code: 'INV001',
            guestNames: ['Juan Pérez'],
            numberOfPasses: 2
        });

        const existingConfirmation = new Confirmation({
            code: 'INV001',
            willAttend: true,
            attendingGuests: 1,
            attendingNames: ['Juan Pérez']
        });

        mockInvitationRepository.findByCode.mockResolvedValue(invitation);
        mockConfirmationRepository.findByCode.mockResolvedValue(existingConfirmation);
        mockConfirmationRepository.update.mockResolvedValue(existingConfirmation);

        const result = await useCase.updateConfirmation('INV001', {
            willAttend: true,
            attendingGuests: 1,
            attendingNames: ['Juan Pérez']
        });

        expect(result.success).toBe(true);
        expect(result.confirmation).toEqual(existingConfirmation.toObject());
        expect(mockConfirmationRepository.update).toHaveBeenCalledWith(
            'INV001',
            expect.any(Confirmation)
        );
    });

    test('should cancel confirmation successfully', async () => {
        const invitation = new Invitation({
            code: 'INV001',
            guestNames: ['Juan Pérez'],
            numberOfPasses: 2,
            status: 'confirmed',
            confirmedPasses: 2
        });

        const existingConfirmation = new Confirmation({
            code: 'INV001',
            willAttend: true,
            attendingGuests: 2,
            attendingNames: ['Juan Pérez']
        });

        mockInvitationRepository.findByCode.mockResolvedValue(invitation);
        mockConfirmationRepository.findByCode.mockResolvedValue(existingConfirmation);
        mockConfirmationRepository.delete.mockResolvedValue(true);
        mockInvitationRepository.update.mockResolvedValue(invitation.unconfirm());

        const result = await useCase.cancelConfirmation('INV001', 'Cambio de planes');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Confirmación cancelada exitosamente');
        expect(mockConfirmationRepository.delete).toHaveBeenCalledWith('INV001');
        expect(mockInvitationRepository.update).toHaveBeenCalledWith(
            'INV001',
            expect.any(Invitation)
        );
    });
});
