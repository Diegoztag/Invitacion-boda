const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Mock fs, path, and crypto
jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn(),
        access: jest.fn(),
        writeFile: jest.fn(),
        appendFile: jest.fn(),
        readFile: jest.fn()
    }
}));

jest.mock('path', () => ({
    join: jest.fn()
}));

jest.mock('crypto', () => ({
    randomBytes: jest.fn()
}));

const { CSVStorageService } = require('../../services/csvStorage');

describe('CSVStorageService', () => {
    let csvStorage;
    let mockFs;
    let mockPath;
    let mockCrypto;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Get mock instances
        mockFs = fs;
        mockPath = path;
        mockCrypto = crypto;

        // Setup default mocks
        mockPath.join.mockImplementation((...args) => {
            const result = args.join('/');
            return result;
        });
        mockCrypto.randomBytes.mockReturnValue({
            toString: jest.fn().mockReturnValue('abcd1234')
        });

        // Create service instance with mocked __dirname
        global.__dirname = 'backend/services';
        csvStorage = new CSVStorageService();
    });

    describe('initialization', () => {
        it('should initialize storage correctly', async () => {
            // Clear previous calls from constructor
            mockFs.mkdir.mockClear();
            mockFs.writeFile.mockClear();
            mockFs.access.mockRejectedValue(new Error('File not found'));
            mockFs.mkdir.mockResolvedValue();
            mockFs.writeFile.mockResolvedValue();

            await csvStorage.initializeStorage();

            expect(mockFs.mkdir).toHaveBeenCalledWith(
                'C:\\Users\\diego.zazueta\\Desktop\\Invitacion-boda\\backend\\services/../data',
                { recursive: true }
            );
            expect(mockFs.writeFile).toHaveBeenCalledWith(
                'C:\\Users\\diego.zazueta\\Desktop\\Invitacion-boda\\backend\\services/../data/invitations.csv',
                expect.stringContaining('code,guestNames')
            );
        });

        it('should not create file if it already exists', async () => {
            mockFs.access.mockResolvedValue();
            mockFs.mkdir.mockResolvedValue();

            await csvStorage.initializeStorage();

            expect(mockFs.writeFile).not.toHaveBeenCalled();
        });
    });

    describe('CSV parsing and formatting', () => {
        it('should parse simple CSV line', () => {
            const line = 'field1,field2,field3';
            const result = csvStorage.parseCSVLine(line);
            expect(result).toEqual(['field1', 'field2', 'field3']);
        });

        it('should parse CSV line with quoted fields containing commas', () => {
            const line = 'field1,"field,with,commas",field3';
            const result = csvStorage.parseCSVLine(line);
            expect(result).toEqual(['field1', 'field,with,commas', 'field3']);
        });

        it('should format simple value', () => {
            expect(csvStorage.formatCSVValue('simple')).toBe('simple');
        });

        it('should format value with comma in quotes', () => {
            expect(csvStorage.formatCSVValue('value,with,comma')).toBe('"value,with,comma"');
        });

        it('should format value with quotes by escaping', () => {
            expect(csvStorage.formatCSVValue('value"with"quotes')).toBe('"value""with""quotes"');
        });

        it('should handle null and undefined values', () => {
            expect(csvStorage.formatCSVValue(null)).toBe('');
            expect(csvStorage.formatCSVValue(undefined)).toBe('');
        });
    });

    describe('invitation code generation', () => {
        it('should generate unique invitation code', () => {
            const code = csvStorage.generateInvitationCode();
            expect(code).toBe('abcd1234');
            expect(mockCrypto.randomBytes).toHaveBeenCalledWith(4);
        });
    });

    describe('saving invitations', () => {
        beforeEach(() => {
            mockFs.appendFile.mockResolvedValue();
        });

        it('should save invitation successfully', async () => {
            const invitation = {
                guestNames: ['John Doe', 'Jane Doe'],
                numberOfPasses: 2,
                phone: '123-456-7890',
                tableNumber: '5'
            };

            const result = await csvStorage.saveInvitation(invitation);

            expect(result.code).toBe('abcd1234');
            expect(result.guestNames).toEqual(['John Doe', 'Jane Doe']);
            expect(result.numberOfPasses).toBe(2);
            expect(result.phone).toBe('123-456-7890');
            expect(result.confirmed).toBe(false);
            expect(mockFs.appendFile).toHaveBeenCalled();
        });

        it('should handle single guest name', async () => {
            const invitation = {
                guestNames: 'John Doe',
                numberOfPasses: 1
            };

            await csvStorage.saveInvitation(invitation);

            expect(mockFs.appendFile).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('John Doe')
            );
        });

        it('should handle adult, child, and staff passes', async () => {
            const invitation = {
                guestNames: ['John Doe'],
                numberOfPasses: 3,
                adultPasses: 2,
                childPasses: 1,
                staffPasses: 0
            };

            const result = await csvStorage.saveInvitation(invitation);

            expect(result.adultPasses).toBe(2);
            expect(result.childPasses).toBe(1);
            expect(result.staffPasses).toBe(0);
        });
    });

    describe('retrieving invitations', () => {
        beforeEach(() => {
            mockFs.readFile
                .mockResolvedValue(`code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,staffPasses,tableNumber,status,cancelledAt,cancelledBy,cancellationReason
abcd1234,"John Doe",2,123-456-7890,2024-01-01T00:00:00.000Z,false,0,,2,0,0,5,,,`);
        });

        it('should get all invitations', async () => {
            const invitations = await csvStorage.getAllInvitations();

            expect(invitations).toHaveLength(1);
            expect(invitations[0].code).toBe('abcd1234');
            expect(invitations[0].guestNames).toEqual(['John Doe']);
            expect(invitations[0].numberOfPasses).toBe(2);
        });

        it('should get invitation by code', async () => {
            const invitation = await csvStorage.getInvitationByCode('abcd1234');

            expect(invitation.code).toBe('abcd1234');
            expect(invitation.guestNames).toEqual(['John Doe']);
        });

        it('should return null for non-existent code', async () => {
            const invitation = await csvStorage.getInvitationByCode('nonexistent');

            expect(invitation).toBeUndefined();
        });
    });

    describe('updating invitations', () => {
        beforeEach(() => {
            mockFs.readFile
                .mockResolvedValue(`code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,staffPasses,tableNumber,status,cancelledAt,cancelledBy,cancellationReason
abcd1234,"John Doe",2,123-456-7890,2024-01-01T00:00:00.000Z,false,0,,2,0,0,5,,,
efgh5678,"Jane Doe",1,,2024-01-02T00:00:00.000Z,false,0,,1,0,0,,,,`);
            mockFs.writeFile.mockResolvedValue();
        });

        it('should update invitation successfully', async () => {
            const updateData = {
                phone: '987-654-3210',
                tableNumber: '10'
            };

            const result = await csvStorage.updateInvitation('abcd1234', updateData);

            expect(result).toBeDefined();
            expect(result.phone).toBe('987-654-3210');
            expect(result.tableNumber).toBe('10');
            expect(mockFs.writeFile).toHaveBeenCalled();
        });

        it('should update invitation confirmation', async () => {
            const confirmationData = {
                attendingGuests: 2
            };

            const result = await csvStorage.updateInvitationConfirmation(
                'abcd1234',
                confirmationData
            );

            expect(result).toBeDefined();
            expect(result.confirmed).toBe(true);
            expect(result.confirmedPasses).toBe(2);
            expect(mockFs.writeFile).toHaveBeenCalled();
        });
    });

    describe('statistics', () => {
        beforeEach(() => {
            mockFs.readFile
                .mockResolvedValueOnce(`code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,staffPasses,tableNumber,status,cancelledAt,cancelledBy,cancellationReason
abcd1234,"John Doe",2,123-456-7890,2024-01-01T00:00:00.000Z,true,2,2024-01-03T00:00:00.000Z,2,0,0,5,,,
efgh5678,"Jane Doe",1,,2024-01-02T00:00:00.000Z,false,0,,1,0,0,,,,`)
                .mockResolvedValueOnce(`code,invitationCode,attending,guestNames,guestCount,phone,dietaryRestrictions,additionalNotes,confirmationDate
wxyz9999,abcd1234,true,"John Doe",1,123-456-7890,,notes,2024-01-03T00:00:00.000Z`);
        });

        it('should get statistics correctly', async () => {
            const stats = await csvStorage.getStats();

            expect(stats.totalInvitations).toBe(2);
            expect(stats.confirmedInvitations).toBe(1);
            expect(stats.pendingInvitations).toBe(1);
            expect(stats.totalPasses).toBe(3);
            expect(stats.confirmedPasses).toBe(2);
        });
    });

    describe('deactivation and activation', () => {
        beforeEach(() => {
            mockFs.readFile
                .mockResolvedValue(`code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,staffPasses,tableNumber,status,cancelledAt,cancelledBy,cancellationReason
abcd1234,"John Doe",2,123-456-7890,2024-01-01T00:00:00.000Z,false,0,,2,0,0,5,,,
efgh5678,"Jane Doe",1,,2024-01-02T00:00:00.000Z,false,0,,1,0,0,,,,`);
            mockFs.writeFile.mockResolvedValue();
        });

        it('should deactivate invitation', async () => {
            const result = await csvStorage.deactivateInvitation(
                'abcd1234',
                'admin',
                'Test deactivation'
            );

            expect(result).toBeDefined();
            expect(result.status).toBe('inactive');
            expect(result.cancelledBy).toBe('admin');
            expect(result.cancellationReason).toBe('Test deactivation');
            expect(mockFs.writeFile).toHaveBeenCalled();
        });

        it('should activate invitation', async () => {
            // First set as cancelled
            mockFs.readFile
                .mockResolvedValue(`code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,staffPasses,tableNumber,status,cancelledAt,cancelledBy,cancellationReason
abcd1234,"John Doe",2,123-456-7890,2024-01-01T00:00:00.000Z,false,0,,2,0,0,5,inactive,2024-01-03T00:00:00.000Z,admin,Test`);

            const result = await csvStorage.activateInvitation('abcd1234');

            expect(result).toBeDefined();
            expect(result.status).toBe('');
            expect(mockFs.writeFile).toHaveBeenCalled();
        });
    });

    describe('data export and import', () => {
        beforeEach(() => {
            mockFs.readFile
                .mockResolvedValue(`code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,staffPasses,tableNumber,status,cancelledAt,cancelledBy,cancellationReason
abcd1234,"John Doe",2,123-456-7890,2024-01-01T00:00:00.000Z,false,0,,2,0,0,5,,,
efgh5678,"Jane Doe",1,,2024-01-02T00:00:00.000Z,false,0,,1,0,0,,,,`);
        });

        it('should export all data', async () => {
            const data = await csvStorage.exportAllData();

            expect(data).toBeDefined();
            expect(data.invitations).toBeDefined();
            expect(data.confirmations).toBeDefined();
        });

        it('should import invitations from CSV', async () => {
            const csvContent = `code,guestNames,numberOfPasses,phone,createdAt,confirmed,confirmedPasses,confirmationDate,adultPasses,childPasses,staffPasses,tableNumber,status,cancelledAt,cancelledBy,cancellationReason
ijkl9012,"Imported Guest",1,,2024-01-04T00:00:00.000Z,false,0,,1,0,0,,,,`;

            mockFs.writeFile.mockResolvedValue();

            const result = await csvStorage.importInvitations(csvContent);

            expect(result).toBeDefined();
            expect(Array.isArray(result.imported)).toBe(true);
            expect(Array.isArray(result.errors)).toBe(true);
        });
    });
});
