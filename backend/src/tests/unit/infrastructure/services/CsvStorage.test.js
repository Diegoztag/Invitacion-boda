const fs = require('fs').promises;
const path = require('path');
const CsvStorage = require('../../../../infrastructure/services/CsvStorage');

jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn(),
        access: jest.fn(),
        writeFile: jest.fn(),
        readFile: jest.fn(),
        copyFile: jest.fn()
    }
}));

describe('CsvStorage', () => {
    let csvStorage;
    let mockLogger;
    let mockCacheService;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };

        mockCacheService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn()
        };

        // Set environment variables for testing
        process.env.CSV_INVITATIONS_PATH = '/mock/data/invitations.csv';
        process.env.CSV_CONFIRMATIONS_PATH = '/mock/data/confirmations.csv';
        process.env.NODE_ENV = 'test';

        csvStorage = new CsvStorage(mockLogger, mockCacheService);
    });

    afterEach(() => {
        delete process.env.CSV_INVITATIONS_PATH;
        delete process.env.CSV_CONFIRMATIONS_PATH;
        delete process.env.NODE_ENV;
    });

    describe('initialize', () => {
        it('should create directories and files if they do not exist', async () => {
            fs.mkdir.mockResolvedValue();
            fs.writeFile.mockResolvedValue();

            await csvStorage.initialize();

            const expectedInvitationsDir = path.dirname(
                path.resolve(process.env.CSV_INVITATIONS_PATH)
            );
            const expectedConfirmationsDir = path.dirname(
                path.resolve(process.env.CSV_CONFIRMATIONS_PATH)
            );

            expect(fs.mkdir).toHaveBeenCalledWith(expectedInvitationsDir, { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith(expectedConfirmationsDir, { recursive: true });
            expect(fs.writeFile).toHaveBeenCalledTimes(2);
            expect(mockLogger.info).toHaveBeenCalledWith('CSV Storage initialized successfully');
        });

        it('should handle errors during initialization', async () => {
            const error = new Error('Mkdir failed');
            fs.mkdir.mockRejectedValue(error);

            await expect(csvStorage.initialize()).rejects.toThrow('Mkdir failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Error initializing CSV storage', {
                error: 'Mkdir failed'
            });
        });
    });

    describe('ensureFileExists', () => {
        it('should reset file in test environment', async () => {
            process.env.NODE_ENV = 'test';
            fs.writeFile.mockResolvedValue();

            await csvStorage.ensureFileExists('/mock/file.csv', ['header1', 'header2']);

            expect(fs.writeFile).toHaveBeenCalledWith(
                '/mock/file.csv',
                'header1,header2\n',
                'utf8'
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Reset CSV file for test: /mock/file.csv'
            );
        });

        it('should create file if it does not exist in non-test environment', async () => {
            process.env.NODE_ENV = 'production';
            fs.access.mockRejectedValue(new Error('Not found'));
            fs.writeFile.mockResolvedValue();

            await csvStorage.ensureFileExists('/mock/file.csv', ['header1', 'header2']);

            expect(fs.writeFile).toHaveBeenCalledWith(
                '/mock/file.csv',
                'header1,header2\n',
                'utf8'
            );
            expect(mockLogger.info).toHaveBeenCalledWith('Created CSV file: /mock/file.csv');
        });

        it('should do nothing if file exists in non-test environment', async () => {
            process.env.NODE_ENV = 'production';
            fs.access.mockResolvedValue();

            await csvStorage.ensureFileExists('/mock/file.csv', ['header1', 'header2']);

            expect(fs.writeFile).not.toHaveBeenCalled();
        });
    });

    describe('readCsvFile', () => {
        it('should read and parse CSV file', async () => {
            const csvContent = 'code,guestNames\nINV001,John Doe\nINV002,Jane Doe';
            fs.readFile.mockResolvedValue(csvContent);

            const result = await csvStorage.readCsvFile('/mock/file.csv');

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ code: 'INV001', guestNames: 'John Doe' });
            expect(result[1]).toEqual({ code: 'INV002', guestNames: 'Jane Doe' });
        });

        it('should return empty array for empty file', async () => {
            fs.readFile.mockResolvedValue('   \n  ');

            const result = await csvStorage.readCsvFile('/mock/file.csv');

            expect(result).toEqual([]);
        });

        it('should handle read errors', async () => {
            const error = new Error('Read failed');
            fs.readFile.mockRejectedValue(error);

            await expect(csvStorage.readCsvFile('/mock/file.csv')).rejects.toThrow('Read failed');
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error reading CSV file: /mock/file.csv',
                { error: 'Read failed' }
            );
        });
    });

    describe('writeCsvFile', () => {
        it('should stringify and write data to CSV file', async () => {
            const data = [{ code: 'INV001', guestNames: 'John Doe' }];
            const headers = ['code', 'guestNames'];
            fs.writeFile.mockResolvedValue();

            await csvStorage.writeCsvFile('/mock/file.csv', data, headers);

            expect(fs.writeFile).toHaveBeenCalledWith(
                '/mock/file.csv',
                'code,guestNames\nINV001,John Doe\n',
                'utf8'
            );
            expect(mockLogger.debug).toHaveBeenCalledWith('CSV file written: /mock/file.csv', {
                recordCount: 1
            });
        });

        it('should handle write errors', async () => {
            const error = new Error('Write failed');
            fs.writeFile.mockRejectedValue(error);

            await expect(csvStorage.writeCsvFile('/mock/file.csv', [], [])).rejects.toThrow(
                'Write failed'
            );
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error writing CSV file: /mock/file.csv',
                { error: 'Write failed' }
            );
        });
    });

    describe('addInvitation', () => {
        it('should add invitation to CSV', async () => {
            const existingData = [{ code: 'INV001', guestNames: 'John Doe' }];
            const newInvitation = { code: 'INV002', guestNames: 'Jane Doe' };

            jest.spyOn(csvStorage, 'readInvitations').mockResolvedValue(existingData);
            jest.spyOn(csvStorage, 'writeInvitations').mockResolvedValue();

            const result = await csvStorage.addInvitation(newInvitation);

            expect(result).toEqual(newInvitation);
            expect(csvStorage.writeInvitations).toHaveBeenCalledWith([
                { code: 'INV001', guestNames: 'John Doe' },
                { code: 'INV002', guestNames: 'Jane Doe' }
            ]);
            expect(mockLogger.info).toHaveBeenCalledWith('Invitation added to CSV', {
                code: 'INV002'
            });
        });
    });

    describe('updateInvitation', () => {
        it('should update existing invitation', async () => {
            const existingData = [
                { code: 'INV001', guestNames: 'John Doe', status: 'pending' },
                { code: 'INV002', guestNames: 'Jane Doe', status: 'pending' }
            ];

            jest.spyOn(csvStorage, 'readInvitations').mockResolvedValue(existingData);
            jest.spyOn(csvStorage, 'writeInvitations').mockResolvedValue();

            const result = await csvStorage.updateInvitation('INV001', { status: 'confirmed' });

            expect(result).toEqual({ code: 'INV001', guestNames: 'John Doe', status: 'confirmed' });
            expect(csvStorage.writeInvitations).toHaveBeenCalledWith([
                { code: 'INV001', guestNames: 'John Doe', status: 'confirmed' },
                { code: 'INV002', guestNames: 'Jane Doe', status: 'pending' }
            ]);
            expect(mockLogger.info).toHaveBeenCalledWith('Invitation updated in CSV', {
                code: 'INV001'
            });
        });

        it('should throw error if invitation not found', async () => {
            jest.spyOn(csvStorage, 'readInvitations').mockResolvedValue([]);

            await expect(csvStorage.updateInvitation('INV001', {})).rejects.toThrow(
                'Invitation with code INV001 not found'
            );
        });
    });

    describe('findInvitations', () => {
        it('should filter invitations based on criteria', async () => {
            const data = [
                { code: 'INV001', status: 'confirmed' },
                { code: 'INV002', status: 'pending' },
                { code: 'INV003', status: 'confirmed' }
            ];
            jest.spyOn(csvStorage, 'readInvitations').mockResolvedValue(data);

            const result = await csvStorage.findInvitations({ status: 'confirmed' });

            expect(result).toHaveLength(2);
            expect(result[0].code).toBe('INV001');
            expect(result[1].code).toBe('INV003');
        });

        it('should return all if criteria is empty', async () => {
            const data = [{ code: 'INV001' }];
            jest.spyOn(csvStorage, 'readInvitations').mockResolvedValue(data);

            const result = await csvStorage.findInvitations();

            expect(result).toHaveLength(1);
        });
    });

    describe('getInvitationStats', () => {
        it('should calculate stats correctly', async () => {
            const invitations = [{ code: 'INV001' }, { code: 'INV002' }, { code: 'INV003' }];
            const confirmations = [
                { invitationCode: 'INV001', willAttend: 'true' },
                { invitationCode: 'INV002', willAttend: 'false' }
            ];

            jest.spyOn(csvStorage, 'readInvitations').mockResolvedValue(invitations);
            jest.spyOn(csvStorage, 'readConfirmations').mockResolvedValue(confirmations);

            const stats = await csvStorage.getInvitationStats();

            expect(stats).toEqual({
                total: 3,
                confirmed: 1,
                declined: 1,
                pending: 1,
                confirmationRate: '33.33'
            });
        });
    });

    describe('backup', () => {
        it('should create backup of invitations file', async () => {
            fs.mkdir.mockResolvedValue();
            fs.copyFile.mockResolvedValue();

            const result = await csvStorage.backup();

            const expectedBackupDir = path.join(
                path.dirname(path.resolve(process.env.CSV_INVITATIONS_PATH)),
                'backups'
            );
            const expectedInvitationsPath = path.resolve(process.env.CSV_INVITATIONS_PATH);

            expect(fs.mkdir).toHaveBeenCalledWith(expectedBackupDir, { recursive: true });
            expect(fs.copyFile).toHaveBeenCalledWith(
                expectedInvitationsPath,
                expect.stringContaining('invitations-')
            );
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('invitationsBackup');
            expect(mockLogger.info).toHaveBeenCalledWith(
                'CSV backup completed',
                expect.any(Object)
            );
        });
    });

    describe('deprecated methods', () => {
        it('readConfirmations should return empty array', async () => {
            const result = await csvStorage.readConfirmations();
            expect(result).toEqual([]);
        });

        it('writeConfirmations should log debug message', async () => {
            await csvStorage.writeConfirmations([]);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'writeConfirmations called but ignored (deprecated)'
            );
        });

        it('addConfirmation should return confirmation and log debug message', async () => {
            const conf = { invitationCode: 'INV001' };
            const result = await csvStorage.addConfirmation(conf);
            expect(result).toEqual(conf);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'addConfirmation called but ignored (deprecated)',
                { invitationCode: 'INV001' }
            );
        });

        it('findConfirmations should return empty array', async () => {
            const result = await csvStorage.findConfirmations();
            expect(result).toEqual([]);
        });
    });
});
