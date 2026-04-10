const ExportConfirmationsUseCase = require('../../../application/usecases/ExportConfirmationsUseCase');

describe('ExportConfirmationsUseCase', () => {
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

        useCase = new ExportConfirmationsUseCase(mockRepository, mockLogger);
    });

    it('debe exportar confirmaciones en formato csv exitosamente', async () => {
        const mockResult = { data: 'csv_data', count: 5 };
        mockRepository.exportAll.mockResolvedValue(mockResult);

        const result = await useCase.execute('csv');

        expect(mockLogger.startOperation).toHaveBeenCalledWith('exportConfirmations', {
            format: 'csv'
        });
        expect(mockRepository.exportAll).toHaveBeenCalledWith('csv');
        expect(mockEndOperation).toHaveBeenCalledWith({
            success: true,
            format: 'csv',
            recordCount: 5
        });
        expect(result).toEqual({
            success: true,
            data: 'csv_data',
            count: 5,
            format: 'csv',
            message: '5 confirmaciones exportadas en formato csv'
        });
    });

    it('debe exportar confirmaciones en formato json exitosamente', async () => {
        const mockResult = { data: '[{}]', count: 2 };
        mockRepository.exportAll.mockResolvedValue(mockResult);

        const result = await useCase.execute('json');

        expect(mockRepository.exportAll).toHaveBeenCalledWith('json');
        expect(result.success).toBe(true);
        expect(result.format).toBe('json');
    });

    it('debe usar csv como formato por defecto', async () => {
        const mockResult = { data: 'csv_data', count: 1 };
        mockRepository.exportAll.mockResolvedValue(mockResult);

        const result = await useCase.execute();

        expect(mockRepository.exportAll).toHaveBeenCalledWith('csv');
        expect(result.success).toBe(true);
        expect(result.format).toBe('csv');
    });

    it('debe retornar error si el formato no es válido', async () => {
        const result = await useCase.execute('xml');

        expect(mockEndOperation).toHaveBeenCalledWith({ success: false, reason: 'invalid_format' });
        expect(mockRepository.exportAll).not.toHaveBeenCalled();
        expect(result).toEqual({
            success: false,
            error: 'Formato de exportación no válido'
        });
    });

    it('debe manejar errores del repositorio', async () => {
        const error = new Error('Database error');
        mockRepository.exportAll.mockRejectedValue(error);

        const result = await useCase.execute('csv');

        expect(mockEndOperation).toHaveBeenCalledWith({ error: 'Database error' }, 'error');
        expect(mockLogger.error).toHaveBeenCalledWith('Error exporting confirmations', {
            format: 'csv',
            error: 'Database error',
            stack: error.stack
        });
        expect(result).toEqual({
            success: false,
            error: 'Error exportando confirmaciones'
        });
    });
});
