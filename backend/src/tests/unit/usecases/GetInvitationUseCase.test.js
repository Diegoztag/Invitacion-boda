/**
 * GetInvitationUseCase - Pruebas Unitarias
 * Cubre todos los métodos del caso de uso GetInvitationUseCase
 */

const GetInvitationUseCase = require('../../../application/usecases/GetInvitationUseCase');
const NotFoundException = require('../../../shared/exceptions/NotFoundException');
const BusinessRuleException = require('../../../shared/exceptions/BusinessRuleException');

describe('GetInvitationUseCase', () => {
    let mockInvitationRepository;
    let mockCacheService;
    let mockLogger;
    let useCase;

    beforeEach(() => {
        // Mock del repositorio
        mockInvitationRepository = {
            findByCode: jest.fn()
        };

        // Mock del cache service
        mockCacheService = {
            get: jest.fn(),
            set: jest.fn()
        };

        // Mock del logger (startOperation devuelve una función endOperation)
        mockLogger = {
            startOperation: jest.fn(() => jest.fn()),
            error: jest.fn(),
            debug: jest.fn()
        };

        useCase = new GetInvitationUseCase(mockInvitationRepository, mockCacheService, mockLogger);
    });

    describe('execute (obtener por código)', () => {
        test('debe obtener invitación exitosamente', async () => {
            const mockInvitation = {
                isActive: jest.fn().mockReturnValue(true),
                toObject: jest.fn().mockReturnValue({
                    code: 'ABC123',
                    guestNames: ['Juan']
                })
            };

            mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);

            const result = await useCase.execute('ABC123');

            expect(result).toEqual({
                invitation: {
                    code: 'ABC123',
                    guestNames: ['Juan']
                }
            });
            expect(mockInvitationRepository.findByCode).toHaveBeenCalledWith('ABC123');
            expect(mockInvitation.isActive).toHaveBeenCalled();
            expect(mockInvitation.toObject).toHaveBeenCalled();
        });

        test('debe fallar con código inválido', async () => {
            await expect(useCase.execute(null)).rejects.toThrow(BusinessRuleException);
            expect(mockInvitationRepository.findByCode).not.toHaveBeenCalled();
        });

        test('debe fallar con código no string', async () => {
            await expect(useCase.execute(123)).rejects.toThrow(BusinessRuleException);
        });

        test('debe fallar cuando invitación no existe', async () => {
            mockInvitationRepository.findByCode.mockResolvedValue(null);

            await expect(useCase.execute('NONEXISTENT')).rejects.toThrow(NotFoundException);
        });

        test('debe fallar cuando invitación no está activa', async () => {
            const mockInvitation = {
                isActive: jest.fn().mockReturnValue(false)
            };

            mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);

            await expect(useCase.execute('INACTIVE')).rejects.toThrow(BusinessRuleException);
            expect(mockInvitation.isActive).toHaveBeenCalled();
        });

        test('debe manejar errores del repositorio', async () => {
            mockInvitationRepository.findByCode.mockRejectedValue(new Error('Database error'));

            await expect(useCase.execute('ABC123')).rejects.toThrow('Database error');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error en GetInvitationUseCase',
                expect.any(Object)
            );
        });
    });

    describe('Logging', () => {
        test('debe registrar operaciones exitosas', async () => {
            const mockInvitation = {
                isActive: jest.fn().mockReturnValue(true),
                toObject: jest.fn().mockReturnValue({
                    code: 'ABC123'
                })
            };

            mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);

            await useCase.execute('ABC123');

            expect(mockLogger.startOperation).toHaveBeenCalledWith('getInvitation', {
                code: 'ABC123'
            });
        });

        test('debe registrar errores', async () => {
            mockInvitationRepository.findByCode.mockRejectedValue(new Error('Database error'));

            try {
                await useCase.execute('ABC123');
            } catch (_e) {}

            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
