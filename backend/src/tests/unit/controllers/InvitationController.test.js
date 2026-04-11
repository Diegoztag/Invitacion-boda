const InvitationController = require('../../../presentation/controllers/InvitationController');
const BusinessRuleException = require('../../../shared/exceptions/BusinessRuleException');

describe('InvitationController', () => {
    let controller;
    let mockCreateInvitationUseCase;
    let mockGetInvitationUseCase;
    let mockGetInvitationsUseCase;
    let mockSearchInvitationsByNameUseCase;
    let mockRestoreInvitationUseCase;
    let mockDeleteInvitationUseCase;
    let mockUpdateInvitationUseCase;
    let mockGetInvitationStatsUseCase;
    let mockExportInvitationsUseCase;
    let mockInvitationRepository;
    let mockValidationService;
    let mockConfig;
    let mockLogger;
    let req;
    let res;
    let next;

    beforeEach(() => {
        mockCreateInvitationUseCase = { execute: jest.fn(), executeBatch: jest.fn() };
        mockGetInvitationUseCase = { execute: jest.fn() };
        mockGetInvitationsUseCase = { execute: jest.fn() };
        mockSearchInvitationsByNameUseCase = { execute: jest.fn() };
        mockRestoreInvitationUseCase = { execute: jest.fn() };
        mockDeleteInvitationUseCase = { execute: jest.fn() };
        mockUpdateInvitationUseCase = { execute: jest.fn() };
        mockGetInvitationStatsUseCase = { execute: jest.fn() };
        mockExportInvitationsUseCase = { execute: jest.fn() };
        mockInvitationRepository = {};
        mockValidationService = { validateInvitationData: jest.fn() };
        mockConfig = { pagination: { defaultLimit: 10, maxLimit: 100 } };
        mockLogger = {
            startOperation: jest.fn().mockReturnValue(jest.fn()),
            info: jest.fn(),
            error: jest.fn()
        };

        controller = new InvitationController(
            mockCreateInvitationUseCase,
            mockGetInvitationUseCase,
            mockGetInvitationsUseCase,
            mockSearchInvitationsByNameUseCase,
            mockRestoreInvitationUseCase,
            mockDeleteInvitationUseCase,
            mockUpdateInvitationUseCase,
            mockGetInvitationStatsUseCase,
            mockExportInvitationsUseCase,
            mockInvitationRepository,
            mockValidationService,
            mockConfig,
            mockLogger
        );

        req = {
            params: {},
            query: {},
            body: {},
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-agent'),
            user: { id: 'admin' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn(),
            send: jest.fn()
        };

        next = jest.fn();
    });

    describe('getInvitation', () => {
        it('should call getInvitationUseCase and return success', async () => {
            req.params.code = 'INV123';
            const mockResult = { success: true, data: { code: 'INV123' } };
            mockGetInvitationUseCase.execute.mockResolvedValue(mockResult);

            await controller.getInvitation(req, res, next);

            expect(mockGetInvitationUseCase.execute).toHaveBeenCalledWith('INV123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('createInvitation', () => {
        it('should return error if validation fails', async () => {
            req.body = { name: 'Test' };
            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: false,
                errors: ['Invalid data']
            });

            await controller.createInvitation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BusinessRuleException));
        });

        it('should call createInvitationUseCase and return success', async () => {
            req.body = { name: 'Test' };
            mockValidationService.validateInvitationData.mockReturnValue({
                isValid: true,
                sanitized: { name: 'Test' }
            });
            const mockResult = {
                success: true,
                invitation: { code: 'INV123', toObject: () => ({ code: 'INV123' }) }
            };
            mockCreateInvitationUseCase.execute.mockResolvedValue(mockResult);

            await controller.createInvitation(req, res, next);

            expect(mockCreateInvitationUseCase.execute).toHaveBeenCalledWith({ name: 'Test' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getInvitations', () => {
        it('should call getInvitationsUseCase and return success', async () => {
            req.query = { page: 1, limit: 10 };
            const mockResult = { success: true, data: [], pagination: { total: 0 } };
            mockGetInvitationsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getInvitations(req, res, next);

            expect(mockGetInvitationsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('updateInvitation', () => {
        it('should call updateInvitationUseCase and return success', async () => {
            req.params.code = 'INV123';
            req.body = { name: 'Updated Name' };
            const mockResult = { success: true, data: { code: 'INV123', name: 'Updated Name' } };
            mockUpdateInvitationUseCase.execute.mockResolvedValue(mockResult);

            await controller.updateInvitation(req, res, next);

            expect(mockUpdateInvitationUseCase.execute).toHaveBeenCalledWith(
                'INV123',
                expect.any(Object)
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('deleteInvitation', () => {
        it('should call deleteInvitationUseCase and return success', async () => {
            req.params.code = 'INV123';
            req.body = { reason: 'Cancelled' };
            const mockResult = { success: true };
            mockDeleteInvitationUseCase.execute.mockResolvedValue(mockResult);

            await controller.deleteInvitation(req, res, next);

            expect(mockDeleteInvitationUseCase.execute).toHaveBeenCalledWith(
                'INV123',
                'admin',
                'Cancelled'
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('restoreInvitation', () => {
        it('should call restoreInvitationUseCase and return success', async () => {
            req.params.code = 'INV123';
            const mockResult = { success: true };
            mockRestoreInvitationUseCase.execute.mockResolvedValue(mockResult);

            await controller.restoreInvitation(req, res, next);

            expect(mockRestoreInvitationUseCase.execute).toHaveBeenCalledWith('INV123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('getStats', () => {
        it('should call getInvitationStatsUseCase and return success', async () => {
            const mockResult = { success: true, data: { total: 10 } };
            mockGetInvitationStatsUseCase.execute.mockResolvedValue(mockResult);

            await controller.getStats(req, res, next);

            expect(mockGetInvitationStatsUseCase.execute).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('importInvitations', () => {
        it('should return error if invitations array is missing or empty', async () => {
            req.body = { invitations: [] };

            await controller.importInvitations(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BusinessRuleException));
        });

        it('should call createInvitationUseCase.executeBatch and return success', async () => {
            req.body = { invitations: [{ name: 'Test 1' }, { name: 'Test 2' }] };
            const mockResult = { success: [{ code: 'INV1' }], errors: [] };
            mockCreateInvitationUseCase.executeBatch.mockResolvedValue(mockResult);

            await controller.importInvitations(req, res, next);

            expect(mockCreateInvitationUseCase.executeBatch).toHaveBeenCalledWith(
                req.body.invitations
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('searchByName', () => {
        it('should call searchInvitationsByNameUseCase and return success', async () => {
            req.params.name = 'Test';
            const mockResult = { success: true, data: [] };
            mockSearchInvitationsByNameUseCase.execute.mockResolvedValue(mockResult);

            await controller.searchByName(req, res, next);

            expect(mockSearchInvitationsByNameUseCase.execute).toHaveBeenCalledWith('Test');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('exportInvitations', () => {
        it('should export as json by default', async () => {
            req.query = {};
            const mockResult = { success: true, data: [{ code: 'INV123' }], count: 1 };
            mockExportInvitationsUseCase.execute.mockResolvedValue(mockResult);

            await controller.exportInvitations(req, res, next);

            expect(mockExportInvitationsUseCase.execute).toHaveBeenCalledWith('json');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should export as csv if requested', async () => {
            req.query = { format: 'csv' };
            const mockResult = { success: true, data: [{ code: 'INV123' }], count: 1 };
            mockExportInvitationsUseCase.execute.mockResolvedValue(mockResult);

            await controller.exportInvitations(req, res, next);

            expect(mockExportInvitationsUseCase.execute).toHaveBeenCalledWith('csv');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
            expect(res.send).toHaveBeenCalled();
        });
    });
});
