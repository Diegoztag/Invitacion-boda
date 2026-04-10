const UpdateConfirmationUseCase = require('../../../application/usecases/UpdateConfirmationUseCase');

describe('UpdateConfirmationUseCase', () => {
    let useCase;
    let mockInvitationRepository;
    let mockConfirmationRepository;
    let mockValidationService;
    let mockSseService;
    let mockLogger;
    let mockEndOperation;

    beforeEach(() => {
        mockInvitationRepository = {
            findByCode: jest.fn(),
            update: jest.fn()
        };

        mockConfirmationRepository = {
            findByCode: jest.fn(),
            update: jest.fn()
        };

        mockValidationService = {
            sanitizeString: jest.fn(str => str),
            sanitizePhone: jest.fn(phone => phone)
        };

        mockSseService = {
            broadcast: jest.fn()
        };

        mockEndOperation = jest.fn();
        mockLogger = {
            startOperation: jest.fn().mockReturnValue(mockEndOperation),
            error: jest.fn()
        };

        useCase = new UpdateConfirmationUseCase(
            mockInvitationRepository,
            mockConfirmationRepository,
            mockValidationService,
            mockSseService,
            mockLogger
        );
    });

    it('debe actualizar una confirmación exitosamente', async () => {
        const mockInvitation = {
            code: 'TEST12',
            numberOfPasses: 2,
            clone: jest.fn().mockReturnThis(),
            confirm: jest.fn()
        };

        const mockConfirmation = {
            clone: jest.fn().mockReturnThis(),
            updateAttendance: jest.fn(),
            updateAttendingGuests: jest.fn(),
            updateAttendingNames: jest.fn(),
            updatePhone: jest.fn(),
            updateDietaryRestrictions: jest.fn(),
            updateMessage: jest.fn(),
            toObject: jest.fn().mockReturnValue({ willAttend: true, attendingGuests: 2 })
        };

        mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);
        mockConfirmationRepository.findByCode.mockResolvedValue(mockConfirmation);
        mockConfirmationRepository.update.mockResolvedValue(mockConfirmation);

        const updateData = {
            willAttend: true,
            attendingGuests: 2,
            attendingNames: ['Juan', 'Maria'],
            phone: '1234567890',
            dietaryRestrictions: 'Ninguna',
            message: 'Felicidades'
        };

        const result = await useCase.execute('TEST12', updateData);

        expect(mockLogger.startOperation).toHaveBeenCalled();
        expect(mockInvitationRepository.findByCode).toHaveBeenCalledWith('TEST12');
        expect(mockConfirmationRepository.findByCode).toHaveBeenCalledWith('TEST12');

        expect(mockConfirmation.updateAttendance).toHaveBeenCalledWith(true);
        expect(mockConfirmation.updateAttendingGuests).toHaveBeenCalledWith(2, 2);
        expect(mockConfirmation.updateAttendingNames).toHaveBeenCalledWith(['Juan', 'Maria']);
        expect(mockConfirmation.updatePhone).toHaveBeenCalledWith('1234567890');
        expect(mockConfirmation.updateDietaryRestrictions).toHaveBeenCalledWith('Ninguna');
        expect(mockConfirmation.updateMessage).toHaveBeenCalledWith('Felicidades');

        expect(mockConfirmationRepository.update).toHaveBeenCalledWith('TEST12', mockConfirmation);
        expect(mockInvitation.confirm).toHaveBeenCalledWith({ attendingGuests: 2 });
        expect(mockInvitationRepository.update).toHaveBeenCalledWith('TEST12', mockInvitation);

        expect(mockEndOperation).toHaveBeenCalledWith({ updated: true });
        expect(result).toEqual({
            success: true,
            confirmation: { willAttend: true, attendingGuests: 2 },
            message: 'Confirmación actualizada exitosamente'
        });
    });

    it('debe fallar si el código de invitación no es válido', async () => {
        const result = await useCase.execute(null, {});
        expect(result.success).toBe(false);
        expect(result.error).toBe('El código de invitación es requerido');
    });

    it('debe fallar si los datos de actualización no son válidos', async () => {
        const result = await useCase.execute('TEST12', null);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Los datos de actualización son requeridos');
    });

    it('debe fallar si la invitación no existe', async () => {
        mockInvitationRepository.findByCode.mockResolvedValue(null);
        const result = await useCase.execute('TEST12', { willAttend: true });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invitación no encontrada');
    });

    it('debe fallar si la confirmación no existe', async () => {
        mockInvitationRepository.findByCode.mockResolvedValue({});
        mockConfirmationRepository.findByCode.mockResolvedValue(null);
        const result = await useCase.execute('TEST12', { willAttend: true });
        expect(result.success).toBe(false);
        expect(result.error).toBe('No existe una confirmación para esta invitación');
    });

    it('debe desconfirmar la invitación si willAttend es false', async () => {
        const mockInvitation = {
            code: 'TEST12',
            clone: jest.fn().mockReturnThis(),
            unconfirm: jest.fn()
        };

        const mockConfirmation = {
            clone: jest.fn().mockReturnThis(),
            updateAttendance: jest.fn(),
            toObject: jest.fn().mockReturnValue({ willAttend: false })
        };

        mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);
        mockConfirmationRepository.findByCode.mockResolvedValue(mockConfirmation);
        mockConfirmationRepository.update.mockResolvedValue(mockConfirmation);

        await useCase.execute('TEST12', { willAttend: false });

        expect(mockInvitation.unconfirm).toHaveBeenCalled();
        expect(mockInvitationRepository.update).toHaveBeenCalledWith('TEST12', mockInvitation);
    });

    it('debe manejar errores del repositorio', async () => {
        mockInvitationRepository.findByCode.mockRejectedValue(new Error('Database error'));
        const result = await useCase.execute('TEST12', { willAttend: true });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Database error');
        expect(mockLogger.error).toHaveBeenCalled();
    });
});
