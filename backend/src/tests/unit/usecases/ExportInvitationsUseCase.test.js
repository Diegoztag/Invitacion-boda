const ExportInvitationsUseCase = require('../../../application/usecases/ExportInvitationsUseCase');

describe('ExportInvitationsUseCase', () => {
    let useCase;
    let mockRepository;
    let mockLogger;
    let mockEndOperation;

    beforeEach(() => {
        mockRepository = {
            exportAll: jest.fn()
        };

        mockEndOperation = jest.fn();
        mockLogger = {
            startOperation: jest.fn().mockReturnValue(mockEndOperation),
            error: jest.fn()
        };

        useCase = new ExportInvitationsUseCase(mockRepository, mockLogger);
    });

    it('debe exportar invitaciones exitosamente', async () => {
        const mockResult = { data: '[{}]', count: 5 };
        mockRepository.exportAll.mockResolvedValue(mockResult);

        const result = await useCase.execute('json');

        expect(mockLogger.startOperation).toHaveBeenCalledWith('exportInvitations', {
            format: 'json'
        });
        expect(mockRepository.exportAll).toHaveBeenCalled();
        expect(mockEndOperation).toHaveBeenCalledWith({ exported: 5, format: 'json' });
        expect(result).toEqual({
            success: true,
            data: '[{}]',
            count: 5,
            format: 'json',
            message: '5 invitaciones exportadas'
        });
    });

    it('debe usar json como formato por defecto', async () => {
        const mockResult = { data: '[{}]', count: 1 };
        mockRepository.exportAll.mockResolvedValue(mockResult);

        const result = await useCase.execute();

        expect(mockRepository.exportAll).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.format).toBe('json');
    });

    it('debe manejar errores del repositorio', async () => {
        const error = new Error('Database error');
        mockRepository.exportAll.mockRejectedValue(error);

        const result = await useCase.execute('json');

        expect(mockEndOperation).toHaveBeenCalledWith({ error: 'Database error' }, 'error');
        expect(mockLogger.error).toHaveBeenCalledWith('Error exporting invitations', {
            format: 'json',
            error: 'Database error',
            stack: error.stack
        });
        expect(result).toEqual({
            success: false,
            error: 'Error exportando invitaciones'
        });
    });
});
