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
const SqliteConfirmationRepository = require('../../../../infrastructure/repositories/SqliteConfirmationRepository');
const Confirmation = require('../../../../core/entities/Confirmation');

describe('SqliteConfirmationRepository', () => {
    let repository;

    beforeEach(() => {
        jest.clearAllMocks();
        getDbConnection.mockResolvedValue(mockDb);
        repository = new SqliteConfirmationRepository();
    });

    describe('save', () => {
        it('should insert a new confirmation', async () => {
            const confirmation = new Confirmation({
                code: 'TEST12',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['John Doe', 'Jane Doe'],
                dietaryRestrictions: 'Vegan',
                message: 'Looking forward to it!'
            });

            mockDb.run.mockResolvedValue({ changes: 1 });

            await repository.save(confirmation);

            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO confirmations'),
                expect.any(Object)
            );
        });

        it('should throw an error if save fails', async () => {
            const confirmation = new Confirmation({
                code: 'FAIL12',
                willAttend: true,
                attendingGuests: 1
            });

            const dbError = new Error('Insert failed');
            mockDb.run.mockRejectedValue(dbError);

            await expect(repository.save(confirmation)).rejects.toThrow('Insert failed');
        });
    });

    describe('findByCode', () => {
        it('should return a Confirmation entity if found', async () => {
            const mockRow = {
                code: 'TEST12',
                willAttend: 1,
                attendingGuests: 2,
                attendingNames: '["John Doe", "Jane Doe"]',
                dietaryRestrictions: 'Vegan',
                message: 'Looking forward to it!',
                confirmedAt: '2024-01-01T00:00:00.000Z'
            };

            mockDb.get.mockResolvedValue(mockRow);

            const result = await repository.findByCode('TEST12');

            expect(result).toBeInstanceOf(Confirmation);
            expect(result.code).toBe('TEST12');
            expect(result.attendingGuests).toBe(2);
            expect(result.attendingNames).toEqual(['John Doe', 'Jane Doe']);
        });

        it('should return null if not found', async () => {
            mockDb.get.mockResolvedValue(undefined);

            const result = await repository.findByCode('NOTFOUND');

            expect(result).toBeNull();
        });

        it('should throw an error if database query fails', async () => {
            const dbError = new Error('DB Error');
            mockDb.get.mockRejectedValue(dbError);

            await expect(repository.findByCode('TEST12')).rejects.toThrow('DB Error');
        });
    });

    describe('findAll', () => {
        it('should return an array of Confirmation entities', async () => {
            const mockRows = [
                { code: 'INV1', willAttend: 1, attendingGuests: 1, attendingNames: '["Guest 1"]' },
                {
                    code: 'INV2',
                    willAttend: 1,
                    attendingGuests: 2,
                    attendingNames: '["Guest 2", "Guest 3"]'
                }
            ];

            mockDb.all.mockResolvedValue(mockRows);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(Confirmation);
            expect(result[0].code).toBe('INV1');
            expect(result[1].code).toBe('INV2');
        });

        it('should return an empty array if no confirmations found', async () => {
            mockDb.all.mockResolvedValue([]);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });

        it('should apply filters correctly', async () => {
            mockDb.all.mockResolvedValue([]);

            await repository.findAll({ willAttend: true });

            expect(mockDb.all).toHaveBeenCalledWith(
                expect.stringContaining('AND willAttend = ?'),
                [1]
            );
        });
    });

    describe('delete', () => {
        it('should return true if deletion was successful', async () => {
            mockDb.run.mockResolvedValue({ changes: 1 });

            const result = await repository.delete('TEST12');

            expect(result).toBe(true);
            expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM confirmations WHERE code = ?', [
                'TEST12'
            ]);
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
                .mockResolvedValueOnce({ count: 10 }) // total
                .mockResolvedValueOnce({ count: 8 }) // positive
                .mockResolvedValueOnce({ count: 2 }) // negative
                .mockResolvedValueOnce({ sum: 15 }) // totalGuests
                .mockResolvedValueOnce({ count: 3 }) // withDietary
                .mockResolvedValueOnce({ count: 5 }); // withMessages

            const stats = await repository.getStats();

            expect(stats).toEqual({
                totalConfirmations: 10,
                positiveConfirmations: 8,
                negativeConfirmations: 2,
                totalConfirmedGuests: 15,
                confirmationsWithDietaryRestrictions: 3,
                confirmationsWithMessages: 5
            });
        });
    });

    describe('findPaginated', () => {
        it('should return paginated data and metadata', async () => {
            const mockRows = [
                { code: 'INV1', willAttend: 1, attendingGuests: 1, attendingNames: '["Guest 1"]' }
            ];

            mockDb.all.mockResolvedValue(mockRows);
            mockDb.get.mockResolvedValue({ count: 1 });

            const result = await repository.findPaginated(
                1,
                10,
                {},
                { field: 'code', direction: 'asc' }
            );

            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toBeInstanceOf(Confirmation);
            expect(result.pagination).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            });
        });
    });
});
