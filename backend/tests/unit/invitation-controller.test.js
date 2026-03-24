const InvitationController = require('../../src/presentation/controllers/InvitationController');

const createInvitationUseCase = { execute: jest.fn(), executeBatch: jest.fn() };
const invitationRepository = {
    findByCode: jest.fn(),
    findPaginated: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
    getStats: jest.fn(),
    exportAll: jest.fn(),
    findByGuestName: jest.fn()
};
const validationService = {
    validateInvitationCode: jest.fn(),
    validateInvitationData: jest.fn()
};
const logger = {
    startOperation: jest.fn(),
    error: jest.fn()
};

const makeRes = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
    };
    return res;
};

describe('InvitationController', () => {
    let controller;
    let endOperation;

    beforeEach(() => {
        jest.clearAllMocks();

        endOperation = jest.fn();
        logger.startOperation.mockReturnValue(endOperation);

        controller = new InvitationController(
            createInvitationUseCase,
            invitationRepository,
            validationService,
            logger
        );
    });

    describe('getInvitation', () => {
        it('should return 400 for invalid code', async () => {
            validationService.validateInvitationCode.mockReturnValue(false);

            const req = { params: { code: 'x' }, ip: '127.0.0.1' };
            const res = makeRes();

            await controller.getInvitation(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Código de invitación inválido' });
        });

        it('should return 404 when invitation not found', async () => {
            validationService.validateInvitationCode.mockReturnValue(true);
            invitationRepository.findByCode.mockResolvedValue(null);

            const req = { params: { code: 'INV001' }, ip: '127.0.0.1' };
            const res = makeRes();

            await controller.getInvitation(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invitación no encontrada' });
        });

        it('should return invitation when found', async () => {
            validationService.validateInvitationCode.mockReturnValue(true);
            const invitation = { toObject: () => ({ code: 'INV001', guestNames: ['Juan'] }) };
            invitationRepository.findByCode.mockResolvedValue(invitation);

            const req = { params: { code: 'INV001' }, ip: '127.0.0.1' };
            const res = makeRes();

            await controller.getInvitation(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, invitation: { code: 'INV001', guestNames: ['Juan'] } });
            expect(endOperation).toHaveBeenCalledWith({ found: true });
        });

        it('should return 500 when repository throws', async () => {
            validationService.validateInvitationCode.mockReturnValue(true);
            invitationRepository.findByCode.mockRejectedValue(new Error('DB fail'));

            const req = { params: { code: 'INV001' }, ip: '127.0.0.1' };
            const res = makeRes();

            await controller.getInvitation(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Error interno del servidor' });
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('createInvitation', () => {
        it('should return 400 for invalid input data', async () => {
            const req = { body: { guestNames: [] }, ip: '127.0.0.1', get: () => 'test' };
            const res = makeRes();

            validationService.validateInvitationData.mockReturnValue({ isValid: false, errors: ['msg'] });

            await controller.createInvitation(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Datos de invitación inválidos', details: ['msg'] });
        });

        it('should create and return 201 when successful', async () => {
            const req = { body: { guestNames: ['Juan'], numberOfPasses: 1 }, ip: '127.0.0.1', get: () => 'UA' };
            const res = makeRes();
            const invitationEntity = { code: 'INV001', toObject: () => ({ code: 'INV001'}) };

            validationService.validateInvitationData.mockReturnValue({ isValid: true, sanitized: req.body });
            createInvitationUseCase.execute.mockResolvedValue({ success: true, invitation: invitationEntity });

            await controller.createInvitation(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, invitation: { code: 'INV001' } });
            expect(endOperation).toHaveBeenCalledWith({ created: true, code: 'INV001' });
        });

        it('should return 400 when useCase fails', async () => {
            const req = { body: { guestNames: ['Juan'] }, ip: '127.0.0.1', get: () => 'UA' };
            const res = makeRes();

            validationService.validateInvitationData.mockReturnValue({ isValid: true, sanitized: req.body });
            createInvitationUseCase.execute.mockResolvedValue({ success: false, error: 'exist' });

            await controller.createInvitation(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'exist' });
        });
    });

    describe('searchByName', () => {
        it('should validate name length', async () => {
            const req = { params: { name: 'J' }, ip: '127.0.0.1' };
            const res = makeRes();

            await controller.searchByName(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'El nombre debe tener al menos 2 caracteres' });
        });

        it('should return found invitations', async () => {
            const invitation = { toObject: () => ({ code: 'INV001' }) };
            invitationRepository.findByGuestName.mockResolvedValue([invitation]);

            const req = { params: { name: 'Juan' }, ip: '127.0.0.1' };
            const res = makeRes();

            await controller.searchByName(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, invitations: [{ code: 'INV001' }], count: 1 });
            expect(endOperation).toHaveBeenCalledWith({ found: 1 });
        });
    });
});
