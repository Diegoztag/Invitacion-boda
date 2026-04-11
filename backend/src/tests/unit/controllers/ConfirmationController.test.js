const ConfirmationController = require('../../../presentation/controllers/ConfirmationController');
const BusinessRuleException = require('../../../shared/exceptions/BusinessRuleException');

describe('ConfirmationController', () => {
    let controller;
    let mockCreateConfirmationUseCase;
    let mockUpdateConfirmationUseCase;
    let mockCancelConfirmationUseCase;
    let mockGetConfirmationStatsUseCase;
    let mockExportConfirmationsUseCase;
    let mockGetConfirmationUseCase;
    let mockGetConfirmationsUseCase;
    let mockSearchConfirmationsByNameUseCase;
    let mockValidationService;
    let mockConfig;
    let mockLogger;
    let req;
    let res;
    let next;

    beforeEach(() => {
        mockCreateConfirmationUseCase = { execute: jest.fn() };
        mockUpdateConfirmationUseCase = { execute: jest.fn() };
        mockCancelConfirmationUseCase = { execute: jest.fn() };
        mockGetConfirmationStatsUseCase = { execute: jest.fn() };
        mockExportConfirmationsUseCase = { execute: jest.fn() };
        mockGetConfirmationUseCase = { execute: jest.fn() };
        mockGetConfirmationsUseCase = { execute: jest.fn() };
        mockSearchConfirmationsByNameUseCase = { execute: jest.fn() };
        mockValidationService = {
            validateInvitationCode: jest.fn(),
            validateConfirmationData: jest.fn()
        };
        mockConfig = { pagination: { defaultLimit: 10, maxLimit: 100 } };
        mockLogger = {
            startOperation: jest.fn().mockReturnValue(jest.fn()),
            info: jest.fn(),
            error: jest.fn()
        };

        controller = new ConfirmationController(
            mockCreateConfirmationUseCase,
            mockUpdateConfirmationUseCase,
            mockCancelConfirmationUseCase,
            mockGetConfirmationStatsUseCase,
            mockExportConfirmationsUseCase,
            mockGetConfirmationUseCase,
            mockGetConfirmationsUseCase,
            mockSearchConfirmationsByNameUseCase,
            mockValidationService,
            mockConfig,
            mockLogger
        );

        req = {
            params: {},
            query: {},
            body: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-agent')
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn(),
            send: jest.fn()
        };

        next = jest.fn();
    });

    describe('confirmAttendance', () => {
        it('should return error if code is invalid', async () => {
            req.params.code = 'INVALID';
            mockValidationService.validateInvitationCode.mockReturnValue(false);

            await controller.confirmAttendance(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BusinessRuleException));
        });

        it('should return error if validation fails', async () => {
            req.params.code = 'INV123';
            req.body = { willAttend: true };
            mockValidationService.validateInvitationCode.mockReturnValue(true);
            mockValidationService.validateConfirmationData.mockReturnValue({
                isValid: false,
                errors: ['Invalid data']
            });

            await controller.confirmAttendance(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BusinessRuleException));
        });

        it('should call createConfirmationUseCase and return success', async () => {
            req.params.code = 'INV123';
            req.body = { willAttend: true, attendingGuests: 2 };
            mockValidationService.validateInvitationCode.mockReturnValue(true);
            mockValidationService.validateConfirmationData.mockReturnValue({
                isValid: true,
                sanitized: { willAttend: true, attendingGuests: 2 }
            });
            const mockResult = { success: true, confirmation: { id: 1 } };
            mockCreateConfirmationUseCase.execute.mockResolvedValue(mockResult);

            await controller.confirmAttendance(req, res, next);

            expect(mockCreateConfirmationUseCase.execute).toHaveBeenCalledWith(
                'INV123',
                expect.any(Object)
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getConfirmation', () => {
        it('should call getConfirmationUseCase and return success', async () => {
            req.params.code = 'INV123';
            const mockResult = { success: true, data: { code: 'INV123' } };
            mockGetConfirmationUseCase.execute.mockResolvedValue(mockResult);

            await controller.getConfirmation(req, res, next);

            expect(mockGetConfirmationUseCase.execute).toHaveBeenCalledWith('INV123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('updateConfirmation', () => {
        it('should return error if code is invalid', async () => {
            req.params.code = 'INVALID';
            mockValidationService.validateInvitationCode.mockReturnValue(false);

            await controller.updateConfirmation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BusinessRuleException));
        });

        it('should return error if validation fails', async () => {
            req.params.code = 'INV123';
            req.body = { willAttend: true };
            mockValidationService.validateInvitationCode.mockReturnValue(true);
            mockValidationService.validateConfirmationData.mockReturnValue({
                isValid: false,
                errors: ['Invalid data']
            });

            await controller.updateConfirmation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BusinessRuleException));
        });

        it('should call updateConfirmationUseCase and return success', async () => {
            req.params.code = 'INV123';
            req.body = { willAttend: true, attendingGuests: 2 };
            mockValidationService.validateInvitationCode.mockReturnValue(true);
            mockValidationService.validateConfirmationData.mockReturnValue({
                isValid: true,
                sanitized: { willAttend: true, attendingGuests: 2 }
            });
            const mockResult = { success: true, confirmation: { id: 1 } };
            mockUpdateConfirmationUseCase.execute.mockResolvedValue(mockResult);

            await controller.updateConfirmation(req, res, next);

            expect(mockUpdateConfirmationUseCase.execute).toHaveBeenCalledWith(
                'INV123',
                expect.any(Object)
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('cancelConfirmation', () => {
        it('should call cancelConfirmationUseCase and return success', async () => {
            req.params.code = 'INV123';
            req.body = { reason: 'Cannot attend' };
            const mockResult = { success: true };
            mockCancelConfirmationUseCase.execute.mockResolvedValue(mockResult);

            await controller.cancelConfirmation(req, res, next);

            expect(mockCancelConfirmationUseCase.execute).toHaveBeenCalledWith(
                'INV123',
                'Cannot attend'
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getConfirmations', () => {
        it('should call getConfirmationsUseCase and return success', async () => {
            req.query = { page: 1, limit: 10 };
            const mockResult = { success: true, data: [], pagination: { total: 0 } };
            mockGetConfirmationsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getConfirmations(req, res, next);

            expect(mockGetConfirmationsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getStats', () => {
        it('should call getConfirmationStatsUseCase and return success', async () => {
            const mockResult = { success: true, data: { total: 10 } };
            mockGetConfirmationStatsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getStats(req, res, next);

            expect(mockGetConfirmationStatsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getPositiveConfirmations', () => {
        it('should call getConfirmationStatsUseCase and return success', async () => {
            const mockResult = { success: true, data: [] };
            mockGetConfirmationStatsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getPositiveConfirmations(req, res, next);

            expect(mockGetConfirmationStatsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getNegativeConfirmations', () => {
        it('should call getConfirmationStatsUseCase and return success', async () => {
            const mockResult = { success: true, data: [] };
            mockGetConfirmationStatsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getNegativeConfirmations(req, res, next);

            expect(mockGetConfirmationStatsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getConfirmationsWithDietaryRestrictions', () => {
        it('should call getConfirmationStatsUseCase and return success', async () => {
            const mockResult = { success: true, data: [] };
            mockGetConfirmationStatsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getConfirmationsWithDietaryRestrictions(req, res, next);

            expect(mockGetConfirmationStatsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getConfirmationsWithMessages', () => {
        it('should call getConfirmationStatsUseCase and return success', async () => {
            const mockResult = { success: true, data: [] };
            mockGetConfirmationStatsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getConfirmationsWithMessages(req, res, next);

            expect(mockGetConfirmationStatsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getRecentConfirmations', () => {
        it('should call getConfirmationStatsUseCase with hours and return success', async () => {
            req.query.hours = '48';
            const mockResult = { success: true, data: [] };
            mockGetConfirmationStatsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getRecentConfirmations(req, res, next);

            expect(mockGetConfirmationStatsUseCase.execute).toHaveBeenCalledWith(48);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('searchByName', () => {
        it('should call searchConfirmationsByNameUseCase and return success', async () => {
            req.params.name = 'Test';
            const mockResult = { success: true, data: [] };
            mockSearchConfirmationsByNameUseCase.execute.mockResolvedValue(mockResult);

            await controller.searchByName(req, res, next);

            expect(mockSearchConfirmationsByNameUseCase.execute).toHaveBeenCalledWith('Test');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getTotalConfirmedGuests', () => {
        it('should call getConfirmationStatsUseCase and return success', async () => {
            const mockResult = { success: true, data: { total: 50 } };
            mockGetConfirmationStatsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getTotalConfirmedGuests(req, res, next);

            expect(mockGetConfirmationStatsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('exportConfirmations', () => {
        it('should export as csv by default', async () => {
            req.query = {};
            const mockResult = { success: true, data: [{ code: 'INV123' }], count: 1 };
            mockExportConfirmationsUseCase.execute.mockResolvedValue(mockResult);

            await controller.exportConfirmations(req, res, next);

            expect(mockExportConfirmationsUseCase.execute).toHaveBeenCalledWith('csv');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
            expect(res.send).toHaveBeenCalled();
        });

        it('should export as json if requested', async () => {
            req.query = { format: 'json' };
            const mockResult = { success: true, data: [{ code: 'INV123' }], count: 1 };
            mockExportConfirmationsUseCase.execute.mockResolvedValue(mockResult);

            await controller.exportConfirmations(req, res, next);

            expect(mockExportConfirmationsUseCase.execute).toHaveBeenCalledWith('json');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
