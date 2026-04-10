/**
 * GetConfirmationStatsUseCase - Pruebas Unitarias
 * Cubre el caso de uso para obtener estadísticas de confirmaciones
 */

const GetConfirmationStatsUseCase = require('../../../application/usecases/GetConfirmationStatsUseCase');

describe('GetConfirmationStatsUseCase', () => {
    let mockConfirmationRepository;
    let mockInvitationRepository;
    let mockLogger;
    let useCase;

    beforeEach(() => {
        // Mock del repositorio de confirmaciones
        mockConfirmationRepository = {
            findAll: jest.fn()
        };

        // Mock del repositorio de invitaciones
        mockInvitationRepository = {
            findAll: jest.fn(),
            getStats: jest.fn()
        };

        // Mock del logger (startOperation devuelve una función endOperation)
        mockLogger = {
            startOperation: jest.fn(() => jest.fn()),
            error: jest.fn()
        };

        useCase = new GetConfirmationStatsUseCase(
            mockConfirmationRepository,
            mockInvitationRepository,
            mockLogger
        );
    });

    describe('execute', () => {
        test('debe obtener estadísticas exitosamente con datos completos', async () => {
            // Mock de estadísticas de invitaciones
            const mockInvitationStats = {
                total: 10,
                totalIssuedPasses: 25,
                confirmed: 6,
                partial: 2,
                pending: 1,
                cancelled: 1,
                inactive: 0,
                confirmedPasses: 18,
                pendingPasses: 3,
                confirmedAdultPasses: 12,
                confirmedChildPasses: 4,
                confirmedStaffPasses: 2,
                activeAdultPasses: 15,
                activeChildPasses: 5,
                activeStaffPasses: 2,
                totalActivePasses: 22,
                distributionPercentages: {
                    adults: 68,
                    children: 23,
                    staff: 9
                }
            };

            // Mock de confirmaciones
            const mockConfirmations = [
                {
                    isPositive: () => true,
                    hasDietaryRestrictions: () => true,
                    hasMessage: () => true,
                    hasPhone: () => true
                },
                {
                    isPositive: () => true,
                    hasDietaryRestrictions: () => false,
                    hasMessage: () => true,
                    hasPhone: () => false
                },
                {
                    isPositive: () => false,
                    hasDietaryRestrictions: () => false,
                    hasMessage: () => false,
                    hasPhone: () => true
                }
            ];

            // Mock de invitaciones inactivas
            const mockInactiveInvitations = [
                {
                    code: 'INACTIVE001'
                }
            ];

            mockInvitationRepository.getStats.mockResolvedValue(mockInvitationStats);
            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue(mockInactiveInvitations);

            const result = await useCase.execute();

            expect(result.success).toBe(true);
            expect(result.stats).toBeDefined();

            // Verificar estructura de invitaciones
            expect(result.stats.invitations).toEqual({
                total: 10,
                totalPasses: 25,
                confirmed: 8, // confirmed + partial
                pending: 1,
                cancelled: 1,
                inactive: 0
            });

            // Verificar estructura de confirmaciones
            expect(result.stats.confirmations).toEqual({
                totalConfirmedGuests: 18,
                pendingPasses: 3,
                byType: {
                    adults: 12,
                    children: 4,
                    staff: 2
                },
                withDietaryRestrictions: 1,
                withMessages: 2,
                withPhone: 2
            });

            // Verificar distribución de pases
            expect(result.stats.passDistribution).toEqual({
                activeAdultPasses: 15,
                activeChildPasses: 5,
                activeStaffPasses: 2,
                totalActivePasses: 22,
                distributionPercentages: {
                    adults: 68,
                    children: 23,
                    staff: 9
                }
            });

            // Verificar tasas
            expect(result.stats.rates).toEqual({
                confirmationRate: 80, // (6+2)/10 * 100
                attendanceRate: 82 // 18/22 * 100
            });
        });

        test('debe filtrar confirmaciones de invitaciones inactivas', async () => {
            const mockInvitationStats = {
                total: 5,
                totalIssuedPasses: 10,
                confirmed: 3,
                partial: 0,
                pending: 1,
                cancelled: 1,
                inactive: 0,
                confirmedPasses: 6,
                pendingPasses: 2,
                confirmedAdultPasses: 6,
                confirmedChildPasses: 0,
                confirmedStaffPasses: 0,
                activeAdultPasses: 8,
                activeChildPasses: 0,
                activeStaffPasses: 0,
                totalActivePasses: 8,
                distributionPercentages: {
                    adults: 100,
                    children: 0,
                    staff: 0
                }
            };

            const mockConfirmations = [
                {
                    code: 'ACTIVE001',
                    isPositive: () => true,
                    hasDietaryRestrictions: () => false,
                    hasMessage: () => false,
                    hasPhone: () => false
                },
                {
                    code: 'INACTIVE001',
                    isPositive: () => true,
                    hasDietaryRestrictions: () => true,
                    hasMessage: () => true,
                    hasPhone: () => true
                }
            ];

            const mockInactiveInvitations = [
                {
                    code: 'INACTIVE001'
                }
            ];

            mockInvitationRepository.getStats.mockResolvedValue(mockInvitationStats);
            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue(mockInactiveInvitations);

            const result = await useCase.execute();

            // Solo debe contar la confirmación activa
            expect(result.stats.confirmations.withDietaryRestrictions).toBe(0);
            expect(result.stats.confirmations.withMessages).toBe(0);
            expect(result.stats.confirmations.withPhone).toBe(0);
        });

        test('debe manejar caso sin confirmaciones', async () => {
            const mockInvitationStats = {
                total: 5,
                totalIssuedPasses: 10,
                confirmed: 0,
                partial: 0,
                pending: 3,
                cancelled: 2,
                inactive: 0,
                confirmedPasses: 0,
                pendingPasses: 6,
                confirmedAdultPasses: 0,
                confirmedChildPasses: 0,
                confirmedStaffPasses: 0,
                activeAdultPasses: 8,
                activeChildPasses: 0,
                activeStaffPasses: 0,
                totalActivePasses: 8,
                distributionPercentages: {
                    adults: 100,
                    children: 0,
                    staff: 0
                }
            };

            mockInvitationRepository.getStats.mockResolvedValue(mockInvitationStats);
            mockConfirmationRepository.findAll.mockResolvedValue([]);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            const result = await useCase.execute();

            expect(result.success).toBe(true);
            expect(result.stats.confirmations.withDietaryRestrictions).toBe(0);
            expect(result.stats.confirmations.withMessages).toBe(0);
            expect(result.stats.confirmations.withPhone).toBe(0);
            expect(result.stats.rates.confirmationRate).toBe(0);
            expect(result.stats.rates.attendanceRate).toBe(0);
        });

        test('debe manejar caso sin invitaciones', async () => {
            const mockInvitationStats = {
                total: 0,
                totalIssuedPasses: 0,
                confirmed: 0,
                partial: 0,
                pending: 0,
                cancelled: 0,
                inactive: 0,
                confirmedPasses: 0,
                pendingPasses: 0,
                confirmedAdultPasses: 0,
                confirmedChildPasses: 0,
                confirmedStaffPasses: 0,
                activeAdultPasses: 0,
                activeChildPasses: 0,
                activeStaffPasses: 0,
                totalActivePasses: 0,
                distributionPercentages: {
                    adults: 0,
                    children: 0,
                    staff: 0
                }
            };

            mockInvitationRepository.getStats.mockResolvedValue(mockInvitationStats);
            mockConfirmationRepository.findAll.mockResolvedValue([]);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            const result = await useCase.execute();

            expect(result.success).toBe(true);
            expect(result.stats.rates.confirmationRate).toBe(0);
            expect(result.stats.rates.attendanceRate).toBe(0);
        });

        test('debe manejar errores del repositorio de invitaciones', async () => {
            mockInvitationRepository.getStats.mockRejectedValue(new Error('Database error'));

            const result = await useCase.execute();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo estadísticas');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error getting confirmation stats',
                expect.any(Object)
            );
        });

        test('debe manejar errores del repositorio de confirmaciones', async () => {
            mockInvitationRepository.getStats.mockResolvedValue({
                total: 1
            });
            mockConfirmationRepository.findAll.mockRejectedValue(
                new Error('Confirmation DB error')
            );

            const result = await useCase.execute();

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo estadísticas');
        });

        test('debe obtener confirmaciones positivas', async () => {
            const mockConfirmations = [
                {
                    code: 'INV01',
                    isPositive: () => true,
                    toObject: () => ({
                        code: 'INV01'
                    })
                },
                {
                    code: 'INV02',
                    isPositive: () => false,
                    toObject: () => ({
                        code: 'INV02'
                    })
                }
            ];

            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            const result = await useCase.getPositiveConfirmations();

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);
            expect(result.confirmations).toEqual([
                {
                    code: 'INV01'
                }
            ]);
        });

        test('debe obtener confirmaciones negativas', async () => {
            const mockConfirmations = [
                {
                    code: 'INV01',
                    isNegative: () => true,
                    toObject: () => ({
                        code: 'INV01'
                    })
                },
                {
                    code: 'INV02',
                    isNegative: () => false,
                    toObject: () => ({
                        code: 'INV02'
                    })
                }
            ];

            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            const result = await useCase.getNegativeConfirmations();

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);
            expect(result.confirmations).toEqual([
                {
                    code: 'INV01'
                }
            ]);
        });

        test('debe obtener confirmaciones con restricciones dietarias', async () => {
            const mockConfirmations = [
                {
                    code: 'INV01',
                    hasDietaryRestrictions: () => true,
                    toObject: () => ({
                        code: 'INV01'
                    })
                },
                {
                    code: 'INV02',
                    hasDietaryRestrictions: () => false,
                    toObject: () => ({
                        code: 'INV02'
                    })
                }
            ];

            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            const result = await useCase.getConfirmationsWithDietaryRestrictions();

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);
            expect(result.confirmations).toEqual([
                {
                    code: 'INV01'
                }
            ]);
        });

        test('debe obtener confirmaciones con mensajes', async () => {
            const mockConfirmations = [
                {
                    code: 'INV01',
                    hasMessage: () => true,
                    toObject: () => ({
                        code: 'INV01'
                    })
                },
                {
                    code: 'INV02',
                    hasMessage: () => false,
                    toObject: () => ({
                        code: 'INV02'
                    })
                }
            ];

            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            const result = await useCase.getConfirmationsWithMessages();

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);
            expect(result.confirmations).toEqual([
                {
                    code: 'INV01'
                }
            ]);
        });

        test('debe obtener confirmaciones recientes', async () => {
            const currentDate = new Date();
            const recent = new Date(currentDate);
            recent.setDate(recent.getDate() - 3);

            const mockConfirmations = [
                {
                    code: 'INV01',
                    confirmedAt: recent.toISOString(),
                    toObject: () => ({
                        code: 'INV01'
                    })
                }
            ];

            mockConfirmationRepository.findRecent = jest.fn().mockResolvedValue(mockConfirmations);

            const result = await useCase.getRecentConfirmations(7);

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);
            expect(result.hours).toBe(7);
        });

        test('debe obtener confirmaciones recientes con valor por defecto', async () => {
            mockConfirmationRepository.findRecent = jest.fn().mockResolvedValue([]);

            const result = await useCase.getRecentConfirmations();

            expect(result.success).toBe(true);
            expect(result.hours).toBe(24);
        });

        test('debe validar rango de días inválido en confirmaciones recientes', async () => {
            const result = await useCase.getRecentConfirmations(0);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Número de horas debe estar entre 1 y 168');
        });

        test('debe obtener total de invitados confirmados', async () => {
            const mockConfirmations = [
                {
                    code: 'INV01',
                    isPositive: () => true,
                    attendingGuests: 2
                },
                {
                    code: 'INV02',
                    isPositive: () => false,
                    attendingGuests: 3
                }
            ];

            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            const result = await useCase.getTotalConfirmedGuests();

            expect(result.success).toBe(true);
            expect(result.total).toBe(2);
        });

        test('debe obtener estadísticas exitosamente con datos completos', async () => {
            const mockInvitationStats = {
                total: 10,
                totalIssuedPasses: 25,
                confirmed: 6,
                partial: 2,
                pending: 1,
                cancelled: 1,
                inactive: 0,
                confirmedPasses: 18,
                pendingPasses: 3,
                confirmedAdultPasses: 12,
                confirmedChildPasses: 4,
                confirmedStaffPasses: 2,
                activeAdultPasses: 15,
                activeChildPasses: 5,
                activeStaffPasses: 2,
                totalActivePasses: 22,
                distributionPercentages: {
                    adults: 68,
                    children: 23,
                    staff: 9
                }
            };

            const mockConfirmations = [
                {
                    isPositive: () => true,
                    hasDietaryRestrictions: () => true,
                    hasMessage: () => true,
                    hasPhone: () => true
                },
                {
                    isPositive: () => true,
                    hasDietaryRestrictions: () => false,
                    hasMessage: () => true,
                    hasPhone: () => false
                },
                {
                    isPositive: () => false,
                    hasDietaryRestrictions: () => false,
                    hasMessage: () => false,
                    hasPhone: () => true
                }
            ];

            const mockInactiveInvitations = [
                {
                    code: 'INACTIVE001'
                }
            ];

            mockInvitationRepository.getStats.mockResolvedValue(mockInvitationStats);
            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue(mockInactiveInvitations);

            const result = await useCase.execute();

            expect(result.success).toBe(true);
            expect(result.stats).toBeDefined();
        });
    });

    describe('_getActiveConfirmations (método privado)', () => {
        test('debe filtrar confirmaciones de invitaciones inactivas', async () => {
            const mockConfirmations = [
                {
                    code: 'ACTIVE001'
                },
                {
                    code: 'ACTIVE002'
                },
                {
                    code: 'INACTIVE001'
                }
            ];

            const mockInactiveInvitations = [
                {
                    code: 'INACTIVE001'
                },
                {
                    code: 'INACTIVE002'
                }
            ];

            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue(mockInactiveInvitations);

            const activeConfirmations = await useCase._getActiveConfirmations();

            expect(activeConfirmations).toHaveLength(2);
            expect(activeConfirmations.map(c => c.code)).toEqual(['ACTIVE001', 'ACTIVE002']);
        });

        test('debe devolver todas las confirmaciones si no hay invitaciones inactivas', async () => {
            const mockConfirmations = [
                {
                    code: 'CODE001'
                },
                {
                    code: 'CODE002'
                }
            ];

            mockConfirmationRepository.findAll.mockResolvedValue(mockConfirmations);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            const activeConfirmations = await useCase._getActiveConfirmations();

            expect(activeConfirmations).toHaveLength(2);
        });
    });

    describe('Logging', () => {
        test('debe registrar operación exitosa', async () => {
            const mockInvitationStats = {
                total: 1,
                totalIssuedPasses: 1,
                confirmed: 1,
                partial: 0,
                pending: 0,
                cancelled: 0,
                inactive: 0,
                confirmedPasses: 1,
                pendingPasses: 0,
                confirmedAdultPasses: 1,
                confirmedChildPasses: 0,
                confirmedStaffPasses: 0,
                activeAdultPasses: 1,
                activeChildPasses: 0,
                activeStaffPasses: 0,
                totalActivePasses: 1,
                distributionPercentages: {
                    adults: 100,
                    children: 0,
                    staff: 0
                }
            };

            mockInvitationRepository.getStats.mockResolvedValue(mockInvitationStats);
            mockConfirmationRepository.findAll.mockResolvedValue([]);
            mockInvitationRepository.findAll.mockResolvedValue([]);

            await useCase.execute();

            expect(mockLogger.startOperation).toHaveBeenCalledWith('getConfirmationStats');
        });

        test('debe registrar errores', async () => {
            mockInvitationRepository.getStats.mockRejectedValue(new Error('Test error'));

            await useCase.execute();

            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('Manejo de errores en métodos específicos', () => {
        test('getPositiveConfirmations debe manejar errores', async () => {
            mockConfirmationRepository.findAll.mockRejectedValue(new Error('DB Error'));
            const result = await useCase.getPositiveConfirmations();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo confirmaciones positivas');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('getNegativeConfirmations debe manejar errores', async () => {
            mockConfirmationRepository.findAll.mockRejectedValue(new Error('DB Error'));
            const result = await useCase.getNegativeConfirmations();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo confirmaciones negativas');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('getConfirmationsWithDietaryRestrictions debe manejar errores', async () => {
            mockConfirmationRepository.findAll.mockRejectedValue(new Error('DB Error'));
            const result = await useCase.getConfirmationsWithDietaryRestrictions();
            expect(result.success).toBe(false);
            expect(result.error).toBe(
                'Error obteniendo confirmaciones con restricciones dietarias'
            );
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('getConfirmationsWithMessages debe manejar errores', async () => {
            mockConfirmationRepository.findAll.mockRejectedValue(new Error('DB Error'));
            const result = await useCase.getConfirmationsWithMessages();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo confirmaciones con mensajes');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('getRecentConfirmations debe manejar errores', async () => {
            mockConfirmationRepository.findRecent = jest
                .fn()
                .mockRejectedValue(new Error('DB Error'));
            const result = await useCase.getRecentConfirmations(7);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo confirmaciones recientes');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('getTotalConfirmedGuests debe manejar errores', async () => {
            mockConfirmationRepository.findAll.mockRejectedValue(new Error('DB Error'));
            const result = await useCase.getTotalConfirmedGuests();
            expect(result.success).toBe(false);
            expect(result.error).toBe('Error obteniendo total de invitados confirmados');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
