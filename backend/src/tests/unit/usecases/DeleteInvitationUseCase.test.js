const DeleteInvitationUseCase = require('../../../application/usecases/DeleteInvitationUseCase');
const NotFoundException = require('../../../shared/exceptions/NotFoundException');

describe('DeleteInvitationUseCase', () => {
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

        useCase = new DeleteInvitationUseCase(mockInvitationRepository, mockLogger);
    });

    it('debe eliminar (desactivar) una invitación exitosamente', async () => {
        const mockInvitation = {
            cancel: jest.fn(),
            toObject: jest.fn().mockReturnValue({ code: 'TEST12', status: 'inactive' })
        };
        mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);
        mockInvitationRepository.update.mockResolvedValue(mockInvitation);

        const result = await useCase.execute('TEST12', 'admin', 'Razón de prueba');

        expect(mockLogger.startOperation).toHaveBeenCalledWith('DeleteInvitationUseCase.execute', {
            code: 'TEST12',
            cancelledBy: 'admin',
            reason: 'Razón de prueba'
        });
        expect(mockInvitationRepository.findByCode).toHaveBeenCalledWith('TEST12');
        expect(mockInvitation.cancel).toHaveBeenCalledWith('admin', 'Razón de prueba');
        expect(mockInvitationRepository.update).toHaveBeenCalledWith('TEST12', mockInvitation);
        expect(mockEndOperation).toHaveBeenCalledWith({ deleted: true });
        expect(result).toEqual({ code: 'TEST12', status: 'inactive' });
    });

    it('debe fallar si la invitación no existe', async () => {
        mockInvitationRepository.findByCode.mockResolvedValue(null);

        await expect(useCase.execute('TEST12')).rejects.toThrow(NotFoundException);

        expect(mockEndOperation).toHaveBeenCalledWith(
            { error: "Invitación con identificador 'TEST12' no encontrado." },
            'error'
        );
    });

    it('debe manejar errores del repositorio', async () => {
        const error = new Error('Database error');
        mockInvitationRepository.findByCode.mockRejectedValue(error);

        await expect(useCase.execute('TEST12')).rejects.toThrow('Database error');

        expect(mockEndOperation).toHaveBeenCalledWith({ error: 'Database error' }, 'error');
        expect(mockLogger.error).toHaveBeenCalledWith('Error en DeleteInvitationUseCase', {
            code: 'TEST12',
            error: 'Database error',
            stack: error.stack
        });
    });
});
