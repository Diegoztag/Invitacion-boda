const UpdateInvitationUseCase = require('../../../application/usecases/UpdateInvitationUseCase');
const NotFoundException = require('../../../shared/exceptions/NotFoundException');

describe('UpdateInvitationUseCase', () => {
    let useCase;
    let mockInvitationRepository;
    let mockLogger;
    let mockEndOperation;

    beforeEach(() => {
        mockInvitationRepository = {
            findByCode: jest.fn(),
            update: jest.fn()
        };

        mockEndOperation = jest.fn();
        mockLogger = {
            startOperation: jest.fn().mockReturnValue(mockEndOperation),
            error: jest.fn()
        };

        useCase = new UpdateInvitationUseCase(mockInvitationRepository, mockLogger);
    });

    it('debe actualizar una invitación exitosamente', async () => {
        const mockInvitation = {
            validate: jest.fn(),
            toObject: jest.fn().mockReturnValue({ code: 'TEST12', guestNames: 'Nuevo Nombre' })
        };
        mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);
        mockInvitationRepository.update.mockResolvedValue(mockInvitation);

        const result = await useCase.execute('TEST12', { guestNames: 'Nuevo Nombre' });

        expect(mockLogger.startOperation).toHaveBeenCalledWith('updateInvitation', {
            code: 'TEST12'
        });
        expect(mockInvitationRepository.findByCode).toHaveBeenCalledWith('TEST12');
        expect(mockInvitation.guestNames).toBe('Nuevo Nombre');
        expect(mockInvitation.validate).toHaveBeenCalled();
        expect(mockInvitationRepository.update).toHaveBeenCalledWith('TEST12', mockInvitation);
        expect(mockEndOperation).toHaveBeenCalledWith({ success: true });
        expect(result).toEqual({
            success: true,
            invitation: { code: 'TEST12', guestNames: 'Nuevo Nombre' },
            message: 'Invitación actualizada exitosamente'
        });
    });

    it('debe fallar si la invitación no existe', async () => {
        mockInvitationRepository.findByCode.mockResolvedValue(null);

        const result = await useCase.execute('TEST12', { guestNames: 'Nuevo Nombre' });

        expect(mockEndOperation).toHaveBeenCalledWith(
            { error: "Invitación con identificador 'TEST12' no encontrado." },
            'error'
        );
        expect(result).toEqual({
            success: false,
            error: 'Error actualizando invitación'
        });
    });

    it('debe ignorar campos no permitidos', async () => {
        const mockInvitation = {
            validate: jest.fn(),
            toObject: jest.fn().mockReturnValue({ code: 'TEST12' })
        };
        mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);
        mockInvitationRepository.update.mockResolvedValue(mockInvitation);

        await useCase.execute('TEST12', { notAllowedField: 'value' });

        expect(mockInvitation.notAllowedField).toBeUndefined();
        expect(mockInvitation.validate).toHaveBeenCalled();
    });

    it('debe manejar errores del repositorio', async () => {
        const error = new Error('Database error');
        mockInvitationRepository.findByCode.mockRejectedValue(error);

        const result = await useCase.execute('TEST12', { guestNames: 'Nuevo Nombre' });

        expect(mockEndOperation).toHaveBeenCalledWith({ error: 'Database error' }, 'error');
        expect(mockLogger.error).toHaveBeenCalledWith('Error updating invitation', {
            code: 'TEST12',
            error: 'Database error',
            stack: error.stack
        });
        expect(result).toEqual({
            success: false,
            error: 'Error actualizando invitación'
        });
    });
});
