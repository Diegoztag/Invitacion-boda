const CreateConfirmationUseCase = require('../../../application/usecases/CreateConfirmationUseCase');
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

describe('CreateConfirmationUseCase', () => {
    let useCase;

    beforeEach(() => {
        jest.clearAllMocks();

        useCase = new CreateConfirmationUseCase(
            mockInvitationRepository,
            mockConfirmationRepository,
            mockValidationService,
            mockSseService,
            mockLogger
        );

        mockValidationService.validatePhone.mockReturnValue(true);
        mockValidationService.sanitizeString.mockImplementation(str => str.trim());
        mockValidationService.sanitizePhone = jest.fn().mockImplementation(phone => phone);
    });

    test('should confirm attendance successfully for positive attending without SSE', async () => {
        const useCaseWithoutSse = new CreateConfirmationUseCase(
            mockInvitationRepository,
            mockConfirmationRepository,
            mockValidationService,
            null,
            mockLogger
        );

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

        const result = await useCaseWithoutSse.execute('INV001', {
            willAttend: true,
            attendingGuests: 2,
            attendingNames: ['Juan Pérez', 'María García'],
            message: 'Nos vemos'
        });

        expect(result.success).toBe(true);
        expect(mockSseService.notify).not.toHaveBeenCalled();
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

    test('should fail when confirmation already exists in repository', async () => {
        const invitation = new Invitation({
            code: 'INV001',
            guestNames: ['Juan Pérez'],
            numberOfPasses: 2,
            status: 'pending'
        });

        const existingConfirmation = new Confirmation({
            code: 'INV001',
            willAttend: true,
            attendingGuests: 2,
            attendingNames: ['Juan Pérez']
        });

        mockInvitationRepository.findByCode.mockResolvedValue(invitation);
        mockConfirmationRepository.findByCode.mockResolvedValue(existingConfirmation);

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

    describe('Validation and Business Rules', () => {
        test('should fail if invitationCode is not provided', async () => {
            const result = await useCase.execute(null, {
                willAttend: true
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('El código de invitación es requerido');
        });

        test('should fail if confirmationData is not an object', async () => {
            const result = await useCase.execute('VALID_CODE', null);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Los datos de confirmación son requeridos');
        });

        test('should fail if confirmationData is not an object (string)', async () => {
            const result = await useCase.execute('VALID_CODE', 'not an object');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Los datos de confirmación son requeridos');
        });

        test('should fail if invitationCode is not a string', async () => {
            const result = await useCase.execute(123, {
                willAttend: true
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('El código de invitación es requerido');
        });

        test('should fail if willAttend is not a boolean', async () => {
            const result = await useCase.execute('INV001', {
                willAttend: 'yes'
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('willAttend debe ser un boolean');
        });

        test('should fail if willAttend is not a boolean (number)', async () => {
            const result = await useCase.execute('INV001', {
                willAttend: 1
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('willAttend debe ser un boolean');
        });

        test('should fail if attendingGuests is not a non-negative integer', async () => {
            const result = await useCase.execute('INV001', {
                attendingGuests: -1
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('El número de invitados debe ser un entero no negativo');

            const result2 = await useCase.execute('INV001', {
                attendingGuests: 1.5
            });
            expect(result2.success).toBe(false);
            expect(result2.error).toBe('El número de invitados debe ser un entero no negativo');

            const result3 = await useCase.execute('INV001', {
                attendingGuests: '2'
            });
            expect(result3.success).toBe(false);
            expect(result3.error).toBe('El número de invitados debe ser un entero no negativo');
        });

        test('should fail if attendingNames is not an array', async () => {
            const result = await useCase.execute('INV001', {
                attendingNames: 'Juan'
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Los nombres de invitados deben ser un array');
        });

        test('should fail if attendingNames is not an array (object)', async () => {
            const result = await useCase.execute('INV001', {
                attendingNames: {
                    name: 'Juan'
                }
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Los nombres de invitados deben ser un array');
        });

        test('should fail if phone format is invalid', async () => {
            mockValidationService.validatePhone.mockReturnValueOnce(false);
            const result = await useCase.execute('INV001', {
                phone: 'invalid'
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('El formato del teléfono no es válido');
        });

        test('should pass if phone is not provided', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);
            mockConfirmationRepository.findByCode.mockResolvedValue(null);
            mockConfirmationRepository.save.mockResolvedValue(
                new Confirmation({
                    code: 'INV001'
                })
            );
            mockInvitationRepository.update.mockResolvedValue(invitation);

            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1
            });
            expect(result.success).toBe(true);
        });

        test('should fail if invitation is inactive', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2,
                status: 'cancelled'
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);

            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('No se puede confirmar una invitación inactiva');
        });

        test('should fail if attendingGuests > 0 when willAttend is false', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);

            const result = await useCase.execute('INV001', {
                willAttend: false,
                attendingGuests: 1
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('No se pueden tener invitados si no va a asistir');
        });

        test('should fail if attendingGuests exceeds numberOfPasses', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);

            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 3
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe(
                'El número de asistentes (3) no puede exceder el total de pases disponibles (2)'
            );
        });

        test('should fail if attendingNames length exceeds attendingGuests', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);

            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1,
                attendingNames: ['Juan', 'Maria']
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('No se pueden tener más nombres que invitados confirmados');
        });

        test('should fail if message exceeds 500 characters', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);

            const longMessage = 'a'.repeat(501);
            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1,
                message: longMessage
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('El mensaje no puede exceder 500 caracteres');
        });

        test('should fail if dietaryRestrictions exceeds 200 characters', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);

            const longRestrictions = 'a'.repeat(201);
            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1,
                dietaryRestrictions: longRestrictions
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe(
                'Las restricciones dietarias no pueden exceder 200 caracteres'
            );
        });

        test('should normalize phone and dietaryRestrictions', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);
            mockConfirmationRepository.findByCode.mockResolvedValue(null);
            mockConfirmationRepository.save.mockResolvedValue(
                new Confirmation({
                    code: 'INV001'
                })
            );
            mockInvitationRepository.update.mockResolvedValue(invitation);

            mockValidationService.sanitizePhone = jest.fn().mockReturnValue('1234567890');
            mockValidationService.sanitizeString = jest.fn().mockImplementation(str => str.trim());

            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1,
                phone: ' 123-456-7890 ',
                dietaryRestrictions: ' Ninguna '
            });

            expect(result.success).toBe(true);
            expect(mockValidationService.sanitizePhone).toHaveBeenCalledWith(' 123-456-7890 ');
            expect(mockValidationService.sanitizeString).toHaveBeenCalledWith(' Ninguna ');
        });

        test('should normalize empty attendingNames', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);
            mockConfirmationRepository.findByCode.mockResolvedValue(null);
            mockConfirmationRepository.save.mockResolvedValue(
                new Confirmation({
                    code: 'INV001'
                })
            );
            mockInvitationRepository.update.mockResolvedValue(invitation);

            mockValidationService.sanitizeString = jest.fn().mockImplementation(str => str.trim());

            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1,
                attendingNames: [' Juan ', ' ', '']
            });

            expect(result.success).toBe(true);
            expect(mockValidationService.sanitizeString).toHaveBeenCalledWith('Juan');
            expect(mockValidationService.sanitizeString).toHaveBeenCalledWith('');
        });

        test('should normalize message', async () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });
            mockInvitationRepository.findByCode.mockResolvedValue(invitation);
            mockConfirmationRepository.findByCode.mockResolvedValue(null);
            mockConfirmationRepository.save.mockResolvedValue(
                new Confirmation({
                    code: 'INV001'
                })
            );
            mockInvitationRepository.update.mockResolvedValue(invitation);

            mockValidationService.sanitizeString = jest.fn().mockImplementation(str => str.trim());

            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1,
                message: ' Hello '
            });

            expect(result.success).toBe(true);
            expect(mockValidationService.sanitizeString).toHaveBeenCalledWith(' Hello ');
        });
    });

    describe('Error Handling', () => {
        test('should handle errors during execute', async () => {
            mockInvitationRepository.findByCode.mockRejectedValue(new Error('Database error'));

            const result = await useCase.execute('INV001', {
                willAttend: true,
                attendingGuests: 1
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Database error');
            expect(result.message).toBe('Error al confirmar asistencia');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
