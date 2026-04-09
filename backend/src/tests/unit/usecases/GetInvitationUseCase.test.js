/**
 * GetInvitationUseCase - Pruebas Unitarias
 * Cubre todos los métodos del caso de uso GetInvitationUseCase
 */

import GetInvitationUseCase from '../../../application/usecases/GetInvitationUseCase';

describe('GetInvitationUseCase', () => {
    let mockInvitationRepository;
    let mockLogger;
    let useCase;

    beforeEach(() => {
        // Mock del repositorio
        mockInvitationRepository = {
            findByCode: jest.fn(),
            findPaginated: jest.fn(),
            searchByName: jest.fn(),
            getStats: jest.fn(),
            exportAll: jest.fn()
        };

        // Mock del logger (startOperation devuelve una función endOperation)
        mockLogger = {
            startOperation: jest.fn(() => jest.fn()),
            error: jest.fn()
        };

        useCase = new GetInvitationUseCase(mockInvitationRepository, mockLogger);
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

            expect(result.success).toBe(true);
            expect(result.invitation).toEqual({
                code: 'ABC123',
                guestNames: ['Juan']
            });
            expect(result.message).toBe('Invitación encontrada');
            expect(mockInvitationRepository.findByCode).toHaveBeenCalledWith('ABC123');
            expect(mockInvitation.isActive).toHaveBeenCalled();
            expect(mockInvitation.toObject).toHaveBeenCalled();
        });

        test('debe fallar con código inválido', async () => {
            const result = await useCase.execute(null);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Código de invitación es requerido');
            expect(mockInvitationRepository.findByCode).not.toHaveBeenCalled();
        });

        test('debe fallar con código no string', async () => {
            const result = await useCase.execute(123);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Código de invitación es requerido');
        });

        test('debe fallar cuando invitación no existe', async () => {
            mockInvitationRepository.findByCode.mockResolvedValue(null);

            const result = await useCase.execute('NONEXISTENT');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invitación no encontrada');
        });

        test('debe fallar cuando invitación no está activa', async () => {
            const mockInvitation = {
                isActive: jest.fn().mockReturnValue(false)
            };

            mockInvitationRepository.findByCode.mockResolvedValue(mockInvitation);

            const result = await useCase.execute('INACTIVE');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invitación no está activa');
            expect(mockInvitation.isActive).toHaveBeenCalled();
        });

        test('debe manejar errores del repositorio', async () => {
            mockInvitationRepository.findByCode.mockRejectedValue(new Error('Database error'));

            const result = await useCase.execute('ABC123');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo invitación');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error getting invitation',
                expect.any(Object)
            );
        });
    });

    describe('executeGetAll (obtener todas con paginación)', () => {
        test('debe obtener invitaciones con paginación por defecto', async () => {
            const mockResult = {
                data: [
                    {
                        toObject: jest.fn().mockReturnValue({
                            code: 'INV001'
                        })
                    },
                    {
                        toObject: jest.fn().mockReturnValue({
                            code: 'INV002'
                        })
                    }
                ],
                total: 25,
                page: 1,
                limit: 10,
                totalPages: 3,
                hasNext: true,
                hasPrev: false
            };

            mockInvitationRepository.findPaginated.mockResolvedValue(mockResult);

            const result = await useCase.executeGetAll();

            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(2);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 25,
                totalPages: 3,
                hasNext: true,
                hasPrev: false
            });
            expect(result.message).toBe('25 invitaciones encontradas');
        });

        test('debe aplicar filtros correctamente', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            };

            mockInvitationRepository.findPaginated.mockResolvedValue(mockResult);

            const options = {
                page: 2,
                limit: 5,
                status: 'active',
                confirmed: true,
                search: 'Juan'
            };

            await useCase.executeGetAll(options);

            expect(mockInvitationRepository.findPaginated).toHaveBeenCalledWith(
                {
                    status: 'active',
                    confirmed: true,
                    search: 'Juan'
                },
                {
                    page: 2,
                    limit: 5,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                }
            );
        });

        test('debe validar parámetros de paginación', async () => {
            const result = await useCase.executeGetAll({
                page: 0,
                limit: 150
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Parámetros de paginación inválidos');
        });

        test('debe manejar errores del repositorio', async () => {
            mockInvitationRepository.findPaginated.mockRejectedValue(new Error('Database error'));

            const result = await useCase.executeGetAll();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo invitaciones');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error getting all invitations',
                expect.any(Object)
            );
        });
    });

    describe('executeSearch (buscar por nombre)', () => {
        test('debe buscar invitaciones exitosamente', async () => {
            const mockInvitations = [
                {
                    toObject: jest.fn().mockReturnValue({
                        code: 'INV001',
                        guestNames: ['Juan Pérez']
                    })
                },
                {
                    toObject: jest.fn().mockReturnValue({
                        code: 'INV002',
                        guestNames: ['Juan García']
                    })
                }
            ];

            mockInvitationRepository.searchByName.mockResolvedValue(mockInvitations);

            const result = await useCase.executeSearch('Juan');

            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(2);
            expect(result.message).toBe('2 invitaciones encontradas');
            expect(mockInvitationRepository.searchByName).toHaveBeenCalledWith('Juan');
        });

        test('debe validar término de búsqueda', async () => {
            const result = await useCase.executeSearch('a');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Término de búsqueda debe tener al menos 2 caracteres');
        });

        test('debe validar término de búsqueda no string', async () => {
            const result = await useCase.executeSearch(123);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Término de búsqueda debe tener al menos 2 caracteres');
        });

        test('debe manejar errores del repositorio', async () => {
            mockInvitationRepository.searchByName.mockRejectedValue(new Error('Search error'));

            const result = await useCase.executeSearch('Juan');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error buscando invitaciones');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error searching invitations',
                expect.any(Object)
            );
        });
    });

    describe('executeGetStats (obtener estadísticas)', () => {
        test('debe obtener estadísticas exitosamente', async () => {
            const mockStats = {
                total: 100,
                active: 80,
                confirmed: 60,
                cancelled: 20
            };

            mockInvitationRepository.getStats.mockResolvedValue(mockStats);

            const result = await useCase.executeGetStats();

            expect(result.success).toBe(true);
            expect(result.stats).toEqual(mockStats);
            expect(result.message).toBe('Estadísticas obtenidas exitosamente');
            expect(mockInvitationRepository.getStats).toHaveBeenCalled();
        });

        test('debe manejar errores del repositorio', async () => {
            mockInvitationRepository.getStats.mockRejectedValue(new Error('Stats error'));

            const result = await useCase.executeGetStats();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo estadísticas');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error getting invitation stats',
                expect.any(Object)
            );
        });
    });

    describe('executeExport (exportar invitaciones)', () => {
        test('debe exportar en formato CSV por defecto', async () => {
            const mockResult = {
                data: 'code,name\nINV001,Juan',
                count: 1
            };

            mockInvitationRepository.exportAll.mockResolvedValue(mockResult);

            const result = await useCase.executeExport();

            expect(result.success).toBe(true);
            expect(result.data).toBe('code,name\nINV001,Juan');
            expect(result.count).toBe(1);
            expect(result.format).toBe('csv');
            expect(result.message).toBe('1 invitaciones exportadas en formato csv');
            expect(mockInvitationRepository.exportAll).toHaveBeenCalledWith('csv');
        });

        test('debe exportar en formato JSON', async () => {
            const mockResult = {
                data: '[{"code":"INV001","name":"Juan"}]',
                count: 1
            };

            mockInvitationRepository.exportAll.mockResolvedValue(mockResult);

            const result = await useCase.executeExport('json');

            expect(result.success).toBe(true);
            expect(result.format).toBe('json');
            expect(result.message).toBe('1 invitaciones exportadas en formato json');
            expect(mockInvitationRepository.exportAll).toHaveBeenCalledWith('json');
        });

        test('debe validar formato inválido', async () => {
            const result = await useCase.executeExport('xml');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Formato de exportación no válido');
            expect(mockInvitationRepository.exportAll).not.toHaveBeenCalled();
        });

        test('debe manejar errores del repositorio', async () => {
            mockInvitationRepository.exportAll.mockRejectedValue(new Error('Export error'));

            const result = await useCase.executeExport('csv');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error exportando invitaciones');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error exporting invitations',
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

            await useCase.execute('ABC123');

            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
