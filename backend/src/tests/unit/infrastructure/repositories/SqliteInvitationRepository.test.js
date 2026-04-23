const mockDb = {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn()
};

jest.mock('../../../../infrastructure/database/sqlite-connection', () => {
    return {
        getDbConnection: jest.fn()
    };
});

const { getDbConnection } = require('../../../../infrastructure/database/sqlite-connection');
const SqliteInvitationRepository = require('../../../../infrastructure/repositories/SqliteInvitationRepository');
const Invitation = require('../../../../core/entities/Invitation');

describe('SqliteInvitationRepository', () => {
    let repository;

    beforeEach(() => {
        jest.clearAllMocks();
        getDbConnection.mockResolvedValue(mockDb);
        repository = new SqliteInvitationRepository();
    });

    describe('save', () => {
        it('should insert a new invitation', async () => {
            const invitation = new Invitation({
                code: 'INV123',
                guestNames: ['John Doe'],
                numberOfPasses: 2,
                phone: '1234567890',
                email: 'john@example.com',
                status: 'pending'
            });

            mockDb.run.mockResolvedValue({ changes: 1 });

            await repository.save(invitation);

            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO invitations'),
                expect.any(Object)
            );
        });

        it('should throw an error if save fails', async () => {
            const invitation = new Invitation({
                code: 'FAIL123',
                guestNames: ['Jane Doe'],
                numberOfPasses: 1
            });

            const dbError = new Error('Insert failed');
            mockDb.run.mockRejectedValue(dbError);

            await expect(repository.save(invitation)).rejects.toThrow('Insert failed');
        });
    });

    describe('findByCode', () => {
        it('should return an Invitation entity if found', async () => {
            const mockRow = {
                code: 'INV123',
                guestNames: '["John Doe"]',
                numberOfPasses: 2,
                phone: '1234567890',
                email: 'john@example.com',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00.000Z'
            };

            mockDb.get.mockResolvedValue(mockRow);

            const result = await repository.findByCode('INV123');

            expect(result).toBeInstanceOf(Invitation);
            expect(result.code).toBe('INV123');
            expect(result.guestNames).toEqual(['John Doe']);
            expect(result.numberOfPasses).toBe(2);
        });

        it('should return null if not found', async () => {
            mockDb.get.mockResolvedValue(undefined);

            const result = await repository.findByCode('NOTFOUND');

            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return an array of Invitation entities', async () => {
            const mockRows = [
                { code: 'INV1', guestNames: '["Guest 1"]', numberOfPasses: 1, status: 'pending' },
                { code: 'INV2', guestNames: '["Guest 2"]', numberOfPasses: 2, status: 'confirmed' }
            ];

            mockDb.all.mockResolvedValue(mockRows);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(Invitation);
            expect(result[0].code).toBe('INV1');
            expect(result[1].code).toBe('INV2');
        });

        it('should apply filters correctly', async () => {
            mockDb.all.mockResolvedValue([]);

            await repository.findAll({ status: 'pending' });

            expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('AND status = ?'), [
                'pending'
            ]);
        });
    });

    describe('delete', () => {
        it('should return true if deletion was successful', async () => {
            mockDb.run.mockResolvedValue({ changes: 1 });

            const result = await repository.delete('INV123');

            expect(result).toBe(true);
            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE invitations'),
                expect.arrayContaining(['INV123'])
            );
        });

        it('should return false if no rows were deleted', async () => {
            mockDb.run.mockResolvedValue({ changes: 0 });

            const result = await repository.delete('NOTFOUND');

            expect(result).toBe(false);
        });
    });

    describe('getStats', () => {
        it('should return correct statistics', async () => {
            mockDb.get
                .mockResolvedValueOnce({ count: 10 }) // totalInvitations
                .mockResolvedValueOnce({ count: 8 }) // activeInvitations
                .mockResolvedValueOnce({ count: 2 }) // inactiveInvitations
                .mockResolvedValueOnce({ sum: 20 }) // totalPasses
                .mockResolvedValueOnce({ sum: 15 }) // confirmedPasses
                .mockResolvedValueOnce({ count: 3 }) // confirmedInvitations
                .mockResolvedValueOnce({ count: 1 }) // partialInvitations
                .mockResolvedValueOnce({ count: 4 }) // pendingInvitations
                .mockResolvedValueOnce({ count: 2 }) // cancelledInvitations
                .mockResolvedValueOnce({ sum: 10 }) // activeAdultPasses
                .mockResolvedValueOnce({ sum: 5 }) // activeChildPasses
                .mockResolvedValueOnce({ sum: 2 }) // activeStaffPasses
                .mockResolvedValueOnce({ sum: 8 }) // confirmedAdultPasses
                .mockResolvedValueOnce({ sum: 4 }) // confirmedChildPasses
                .mockResolvedValueOnce({ sum: 1 }); // confirmedStaffPasses

            const stats = await repository.getStats();

            expect(stats).toEqual({
                total: 10,
                active: 8,
                inactive: 2,
                confirmed: 3,
                partial: 1,
                pending: 4,
                cancelled: 2,
                totalIssuedPasses: 20,
                occupiedPasses: 15,
                confirmedPasses: 15,
                activeAdultPasses: 10,
                activeChildPasses: 5,
                activeStaffPasses: 2,
                confirmedAdultPasses: 8,
                confirmedChildPasses: 4,
                confirmedStaffPasses: 1
            });
        });
    });
});
