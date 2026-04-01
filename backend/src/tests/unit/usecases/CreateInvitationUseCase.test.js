/**
 * CreateInvitationUseCase Tests
 * Tests unitarios para el caso de uso de crear invitaciones
 */

const CreateInvitationUseCase = require('../../../application/usecases/CreateInvitationUseCase');
const Invitation = require('../../../core/entities/Invitation');

// Mocks
const mockInvitationRepository = {
    save: jest.fn(),
    findByCode: jest.fn(),
    importBatch: jest.fn()
};

const mockValidationService = {
    validateInvitationData: jest.fn(),
    generateInvitationCode: jest.fn()
};

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

describe('CreateInvitationUseCase', () => {
    let useCase;

    beforeEach(() => {
        useCase = new CreateInvitationUseCase(
            mockInvitationRepository,
            mockValidationService,
            mockLogger
        );

        // Reset mocks
        jest.clearAllMocks();
        delete mockValidationService.sanitizeString;
        delete mockValidationService.sanitizePhone;
    });

    describe('execute', () => {
        test('should create invitation successfully', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                phone: '+1234567890'
            };

            const generatedCode = 'INV001';
            const savedInvitation = new Invitation({
                code: generatedCode,
                ...invitationData
            });

            // Setup mocks
            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode.mockReturnValue(generatedCode);
            mockInvitationRepository.findByCode.mockResolvedValue(null);
            mockInvitationRepository.save.mockResolvedValue(savedInvitation);

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(true);
            expect(result.invitation).toEqual(savedInvitation);
            expect(result.message).toBe('Invitación creada exitosamente');
            expect(mockInvitationRepository.save).toHaveBeenCalledWith(expect.any(Invitation));
        });

        test('should fail with invalid data', async () => {
            const invalidData = {
                guestNames: [],
                numberOfPasses: 0
            };

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: false,
                errors: ['Al menos un nombre de invitado es requerido']
            });

            const result = await useCase.execute(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Datos de invitación inválidos');
            expect(result.details).toEqual(['Al menos un nombre de invitado es requerido']);
            expect(mockInvitationRepository.save).not.toHaveBeenCalled();
        });

        test('should fail when code already exists', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1
            };

            const existingInvitation = new Invitation({
                code: 'INV001',
                guestNames: ['Otro Invitado'],
                numberOfPasses: 1
            });

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');
            mockInvitationRepository.findByCode.mockResolvedValue(existingInvitation);

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Ya existe una invitación con el código INV001');
            expect(mockInvitationRepository.save).not.toHaveBeenCalled();
        });

        test('should retry code generation when duplicate found', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1
            };

            const existingInvitation = new Invitation({
                code: 'INV001',
                guestNames: ['Otro Invitado'],
                numberOfPasses: 1
            });

            const savedInvitation = new Invitation({
                code: 'INV002',
                ...invitationData
            });

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode
                .mockReturnValueOnce('INV001')
                .mockReturnValueOnce('INV002');
            mockInvitationRepository.findByCode
                .mockResolvedValueOnce(existingInvitation)
                .mockResolvedValueOnce(null);
            mockInvitationRepository.save.mockResolvedValue(savedInvitation);

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(true);
            expect(result.invitation.code).toBe('INV002');
            expect(mockValidationService.generateInvitationCode).toHaveBeenCalledTimes(2);
        });

        test('should handle repository errors', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1
            };

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');
            mockInvitationRepository.findByCode.mockResolvedValue(null);
            mockInvitationRepository.save.mockRejectedValue(new Error('Database error'));

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error creando invitación');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('should fail when max passes exceeded', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 11 // Assuming max is 10
            };

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error creando invitación');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('should fail when specific passes do not match total', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2,
                adultPasses: 1,
                childPasses: 0,
                staffPasses: 0
            };

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error creando invitación');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('should use sanitizeString and sanitizePhone if available', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1,
                phone: '1234567890'
            };

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.sanitizeString = jest
                .fn()
                .mockReturnValue('Juan Perez Sanitized');
            mockValidationService.sanitizePhone = jest.fn().mockReturnValue('+521234567890');
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');
            mockInvitationRepository.findByCode.mockResolvedValue(null);
            mockInvitationRepository.save.mockResolvedValue(
                new Invitation({ code: 'INV001', ...invitationData })
            );

            await useCase.execute(invitationData);

            expect(mockValidationService.sanitizeString).toHaveBeenCalledWith('Juan Pérez');
            expect(mockValidationService.sanitizePhone).toHaveBeenCalledWith('1234567890');
        });

        test('should warn if phone is already in use', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1,
                phone: '+1234567890'
            };

            // Reset sanitizePhone to avoid interference from previous tests
            mockValidationService.sanitizePhone = undefined;

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');
            mockInvitationRepository.findByCode.mockResolvedValue(null);

            const mockInv = new Invitation({
                code: 'INV002',
                guestNames: ['Otro'],
                numberOfPasses: 1,
                phone: '+1234567890',
                status: 'pending'
            });
            mockInv.isActive = jest.fn().mockReturnValue(true);

            mockInvitationRepository.findByPhone = jest.fn().mockResolvedValue([mockInv]);
            mockInvitationRepository.save.mockResolvedValue(
                new Invitation({ code: 'INV001', ...invitationData })
            );

            await useCase.execute(invitationData);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Phone number already in use',
                expect.any(Object)
            );
        });

        test('should fail if table capacity is exceeded', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 5,
                tableNumber: 'Mesa 1'
            };

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');
            mockInvitationRepository.findByCode.mockResolvedValue(null);

            const mockInv = new Invitation({
                code: 'INV002',
                guestNames: ['Otro'],
                numberOfPasses: 8,
                tableNumber: 'Mesa 1',
                status: 'pending'
            });
            mockInv.isActive = jest.fn().mockReturnValue(true);

            mockInvitationRepository.findByTable = jest.fn().mockResolvedValue([mockInv]);

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error creando invitación');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Table capacity exceeded',
                expect.any(Object)
            );
        });

        test('should fail if duplicate guest name exists', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2
            };

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');
            mockInvitationRepository.findByCode.mockResolvedValue(null);

            const mockInv = new Invitation({
                code: 'INV002',
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                status: 'pending'
            });
            mockInv.isActive = jest.fn().mockReturnValue(true);

            mockInvitationRepository.findByGuestName = jest.fn().mockResolvedValue([mockInv]);

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error creando invitación');
        });
    });

    describe('executeBatch', () => {
        test('should process batch successfully', async () => {
            const invitationsData = [
                {
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1
                },
                {
                    guestNames: ['María García'],
                    numberOfPasses: 2
                }
            ];

            const batchResult = {
                success: [
                    { index: 0, code: 'INV001' },
                    { index: 1, code: 'INV002' }
                ],
                errors: [],
                total: 2
            };

            mockInvitationRepository.importBatch.mockResolvedValue(batchResult);

            const result = await useCase.executeBatch(invitationsData);

            expect(result.success).toBe(true);
            expect(result.result).toEqual(batchResult);
            expect(result.message).toContain('2 exitosas, 0 fallidas');
        });

        test('should handle batch with errors', async () => {
            const invitationsData = [
                {
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1
                },
                {
                    guestNames: [],
                    numberOfPasses: 0
                }
            ];

            const batchResult = {
                success: [{ index: 0, code: 'INV001' }],
                errors: [{ index: 1, error: 'Datos inválidos' }],
                total: 2
            };

            mockInvitationRepository.importBatch.mockResolvedValue(batchResult);

            const result = await useCase.executeBatch(invitationsData);

            expect(result.success).toBe(true);
            expect(result.result).toEqual(batchResult);
            expect(result.message).toContain('1 exitosas, 1 fallidas');
        });

        test('should fail with empty batch', async () => {
            const result = await useCase.executeBatch([]);

            expect(result.success).toBe(false);
            expect(result.error).toBe('No hay invitaciones para procesar');
        });

        test('should handle batch processing errors', async () => {
            const invitationsData = [
                {
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1
                }
            ];

            mockInvitationRepository.importBatch.mockRejectedValue(new Error('Batch error'));

            const result = await useCase.executeBatch(invitationsData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error procesando lote de invitaciones');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('should fallback to manual batch if importBatch is not available', async () => {
            const invitationsData = [
                {
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1
                }
            ];

            const useCaseWithoutImportBatch = new CreateInvitationUseCase(
                {
                    save: jest.fn().mockResolvedValue(
                        new Invitation({
                            code: 'INV001',
                            guestNames: ['Juan Pérez'],
                            numberOfPasses: 1
                        })
                    ),
                    findByCode: jest.fn().mockResolvedValue(null)
                },
                mockValidationService,
                mockLogger
            );

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationsData[0]
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');

            const result = await useCaseWithoutImportBatch.executeBatch(invitationsData);

            expect(result.success).toBeDefined();
            expect(result.total).toBe(1);
        });

        test('should use saveBatch if available when importBatch is not', async () => {
            const invitationsData = [
                {
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1
                }
            ];

            const useCaseWithSaveBatch = new CreateInvitationUseCase(
                {
                    saveBatch: jest.fn().mockResolvedValue([
                        new Invitation({
                            code: 'INV001',
                            guestNames: ['Juan Pérez'],
                            numberOfPasses: 1
                        })
                    ]),
                    findByCode: jest.fn().mockResolvedValue(null)
                },
                mockValidationService,
                mockLogger
            );

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationsData[0]
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');

            const result = await useCaseWithSaveBatch.executeBatch(invitationsData);

            expect(result.success).toBeDefined();
            expect(result.total).toBe(1);
        });

        test('should handle saveBatch failure', async () => {
            const invitationsData = [
                {
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1
                }
            ];

            const useCaseWithSaveBatch = new CreateInvitationUseCase(
                {
                    saveBatch: jest.fn().mockRejectedValue(new Error('saveBatch error')),
                    findByCode: jest.fn().mockResolvedValue(null)
                },
                mockValidationService,
                mockLogger
            );

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationsData[0]
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');

            const result = await useCaseWithSaveBatch.executeBatch(invitationsData);

            expect(result.success).toBeDefined();
            expect(result.errors[0].error).toBe('Error al guardar lote: saveBatch error');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Batch save failed',
                expect.objectContaining({ error: 'saveBatch error' })
            );
        });

        test('should handle sequential save failure when saveBatch is not available', async () => {
            const invitationsData = [
                {
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1
                }
            ];

            const useCaseWithoutSaveBatch = new CreateInvitationUseCase(
                {
                    save: jest.fn().mockRejectedValue(new Error('sequential save error')),
                    findByCode: jest.fn().mockResolvedValue(null)
                },
                mockValidationService,
                mockLogger
            );

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationsData[0]
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');

            const result = await useCaseWithoutSaveBatch.executeBatch(invitationsData);

            expect(result.success).toBeDefined();
            expect(result.errors[0].error).toBe('sequential save error');
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Repository does not support saveBatch, falling back to sequential save'
            );
        });

        test('should handle sequential save success when saveBatch is not available', async () => {
            const invitationsData = [
                {
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1
                }
            ];

            const savedInv = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1
            });

            const useCaseWithoutSaveBatch = new CreateInvitationUseCase(
                {
                    save: jest.fn().mockResolvedValue(savedInv),
                    findByCode: jest.fn().mockResolvedValue(null)
                },
                mockValidationService,
                mockLogger
            );

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationsData[0]
            });
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');

            const result = await useCaseWithoutSaveBatch.executeBatch(invitationsData);

            expect(result.success).toBeDefined();
            expect(result.success[0].invitation.code).toBe('INV001');
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Repository does not support saveBatch, falling back to sequential save'
            );
        });
    });

    describe('generateUniqueCode', () => {
        test('should generate unique code on first try', async () => {
            mockValidationService.generateInvitationCode.mockReturnValue('INV001');
            mockInvitationRepository.findByCode.mockResolvedValue(null);

            const code = await useCase.generateUniqueCode();

            expect(code).toBe('INV001');
            expect(mockValidationService.generateInvitationCode).toHaveBeenCalledTimes(1);
            expect(mockInvitationRepository.findByCode).toHaveBeenCalledTimes(1);
        });

        test('should retry until unique code is found', async () => {
            const existingInvitation = new Invitation({
                code: 'INV001',
                guestNames: ['Existing'],
                numberOfPasses: 1
            });

            mockValidationService.generateInvitationCode
                .mockReturnValueOnce('INV001')
                .mockReturnValueOnce('INV002')
                .mockReturnValueOnce('INV003');
            mockInvitationRepository.findByCode
                .mockResolvedValueOnce(existingInvitation)
                .mockResolvedValueOnce(existingInvitation)
                .mockResolvedValueOnce(null);

            const code = await useCase.generateUniqueCode();

            expect(code).toBe('INV003');
            expect(mockValidationService.generateInvitationCode).toHaveBeenCalledTimes(3);
            expect(mockInvitationRepository.findByCode).toHaveBeenCalledTimes(3);
        });

        test('should fail after max retries', async () => {
            const existingInvitation = new Invitation({
                code: 'INV001',
                guestNames: ['Existing'],
                numberOfPasses: 1
            });

            mockValidationService.generateInvitationCode.mockReturnValue('INV001');
            mockInvitationRepository.findByCode.mockResolvedValue(existingInvitation);

            await expect(useCase.generateUniqueCode()).rejects.toThrow(
                'No se pudo generar un código único después de 10 intentos'
            );
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined input', async () => {
            const result = await useCase.execute(null);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Datos de invitación son requeridos');
        });

        test('should handle validation service errors', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1
            };

            mockValidationService.validateInvitationData.mockImplementation(() => {
                throw new Error('Validation service error');
            });

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error validando datos de invitación');
            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('should handle code generation errors', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1
            };

            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode.mockImplementation(() => {
                throw new Error('Code generation error');
            });

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Error generando código de invitación');
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('execute', () => {
        test('should create invitation successfully', async () => {
            const invitationData = {
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                phone: '+1234567890'
            };

            const generatedCode = 'INV001';
            const savedInvitation = new Invitation({
                code: generatedCode,
                ...invitationData
            });

            // Setup mocks
            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: invitationData
            });
            mockValidationService.generateInvitationCode.mockReturnValue(generatedCode);
            mockInvitationRepository.findByCode.mockResolvedValue(null);
            mockInvitationRepository.save.mockResolvedValue(savedInvitation);

            const result = await useCase.execute(invitationData);

            expect(result.success).toBe(true);
            expect(result.invitation).toEqual(savedInvitation);
            expect(result.message).toBe('Invitación creada exitosamente');
            expect(mockInvitationRepository.save).toHaveBeenCalledWith(expect.any(Invitation));
        });
    });
});
