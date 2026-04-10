const CancelConfirmationUseCase = require('../../../application/usecases/CancelConfirmationUseCase');

describe('CancelConfirmationUseCase', () => {
    let useCase;
    let mockInvitationRepository;
    let mockConfirmationRepository;
    let mockLogger;
    let mockEndOperation;

    beforeEach(() => {
        mockInvitationRepository = {
            findByCode: jest.fn(),
            update: jest.fn()
        };

        mockConfirmationRepository = {
            findByCode: jest.fn(),
            delete: jest.fn()
        };

        mockEndOperation = jest.fn();
        mockLogger = {
            startOperation: jest.fn().mockReturnValue(mockEndOperation),
            error: jest.fn()
        };

        useCase = new CancelConfirmationUseCase(
            mockInvitationRepository,
            mockConfirmationRepository,
            mockLogger
        );
    });

    it('debe cancelar una confirmación exitosamente', async () => {
        const mockInvitation = {
            unconfirm: jest.fn().mockReturnValue({
                toObject: jest.fn().mockReturnValue({ code: 'TEST12', status: 'pending' })
            })
        };
        mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);
        mockConfirmationRepository.findByCode.mockResolvedValue({ code: 'TEST12' });

        const result = await useCase.execute('TEST12', 'Razón de prueba');

        expect(mockLogger.startOperation).toHaveBeenCalledWith(
            'CancelConfirmationUseCase.execute',
            {
                invitationCode: 'TEST12',
                reason: 'Razón de prueba'
            }
        );
        expect(mockInvitationRepository.findByCode).toHaveBeenCalledWith('TEST12');
        expect(mockConfirmationRepository.findByCode).toHaveBeenCalledWith('TEST12');
        expect(mockConfirmationRepository.delete).toHaveBeenCalledWith('TEST12');
        expect(mockInvitation.unconfirm).toHaveBeenCalled();
        expect(mockInvitationRepository.update).toHaveBeenCalled();
        expect(mockEndOperation).toHaveBeenCalledWith({ cancelled: true });
        expect(result).toEqual({
            success: true,
            invitation: { code: 'TEST12', status: 'pending' },
            message: 'Confirmación cancelada exitosamente'
        });
    });

    it('debe fallar si la invitación no existe', async () => {
        mockInvitationRepository.findByCode.mockResolvedValue(null);

        const result = await useCase.execute('TEST12');

        expect(mockEndOperation).toHaveBeenCalledWith(
            { error: 'Invitación no encontrada' },
            'error'
        );
        expect(result).toEqual({
            success: false,
            error: 'Invitación no encontrada',
            message: 'Error al cancelar la confirmación'
        });
    });

    it('debe fallar si la confirmación no existe', async () => {
        mockInvitationRepository.findByCode.mockResolvedValue({});
        mockConfirmationRepository.findByCode.mockResolvedValue(null);

        const result = await useCase.execute('TEST12');

        expect(mockEndOperation).toHaveBeenCalledWith(
            { error: 'No existe una confirmación para esta invitación' },
            'error'
        );
        expect(result).toEqual({
            success: false,
            error: 'No existe una confirmación para esta invitación',
            message: 'Error al cancelar la confirmación'
        });
    });

    it('debe manejar errores del repositorio', async () => {
        const error = new Error('Database error');
        mockInvitationRepository.findByCode.mockRejectedValue(error);

        const result = await useCase.execute('TEST12');

        expect(mockEndOperation).toHaveBeenCalledWith({ error: 'Database error' }, 'error');
        expect(mockLogger.error).toHaveBeenCalledWith('Error en CancelConfirmationUseCase', {
            invitationCode: 'TEST12',
            error: 'Database error',
            reason: ''
        });
        expect(result).toEqual({
            success: false,
            error: 'Database error',
            message: 'Error al cancelar la confirmación'
        });
    });
});
