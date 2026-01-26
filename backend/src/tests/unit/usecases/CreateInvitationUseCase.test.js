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
            expect(mockInvitationRepository.save).toHaveBeenCalledWith(
                expect.any(Invitation)
            );
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
                success: [
                    { index: 0, code: 'INV001' }
                ],
                errors: [
                    { index: 1, error: 'Datos inválidos' }
                ],
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
});
