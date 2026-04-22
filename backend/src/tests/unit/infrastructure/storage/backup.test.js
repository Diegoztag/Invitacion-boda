const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const BackupService = require('../../../../infrastructure/storage/backup');

jest.mock('fs', () => ({
    promises: {
        access: jest.fn(),
        mkdir: jest.fn(),
        copyFile: jest.fn(),
        readdir: jest.fn(),
        stat: jest.fn(),
        unlink: jest.fn()
    }
}));

jest.mock('node-cron', () => ({
    schedule: jest.fn()
}));

describe('BackupService', () => {
    let backupService;
    let mockLogger;
    let mockEndOp;

    beforeEach(() => {
        jest.clearAllMocks();

        mockEndOp = jest.fn();
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            startOperation: jest.fn().mockReturnValue(mockEndOp)
        };

        backupService = new BackupService(mockLogger, {
            dbPath: '/mock/db/path.sqlite',
            backupDir: '/mock/backup/dir',
            cronSchedule: '0 0 * * *',
            maxBackups: 3
        });
    });

    describe('init', () => {
        it('should initialize backup directory and schedule cron job', async () => {
            fs.access.mockResolvedValue(); // Directory exists

            backupService.init();

            // Wait for promise to resolve
            await new Promise(process.nextTick);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Initializing SQLite backup service')
            );
            expect(cron.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
        });

        it('should handle errors during initialization', async () => {
            fs.access.mockRejectedValue(new Error('Access denied'));
            fs.mkdir.mockRejectedValue(new Error('Mkdir failed'));

            backupService.init();

            await new Promise(process.nextTick);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to initialize backup directory',
                expect.objectContaining({ error: 'Mkdir failed' })
            );
        });
    });

    describe('ensureBackupDir', () => {
        it('should do nothing if directory exists', async () => {
            fs.access.mockResolvedValue();

            await backupService.ensureBackupDir();

            expect(fs.mkdir).not.toHaveBeenCalled();
        });

        it('should create directory if it does not exist', async () => {
            fs.access.mockRejectedValue(new Error('Not found'));
            fs.mkdir.mockResolvedValue();

            await backupService.ensureBackupDir();

            expect(fs.mkdir).toHaveBeenCalledWith('/mock/backup/dir', { recursive: true });
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Created backup directory')
            );
        });
    });

    describe('performBackup', () => {
        it('should create a backup successfully', async () => {
            fs.access.mockResolvedValue();
            fs.copyFile.mockResolvedValue();

            // Mock cleanOldBackups
            jest.spyOn(backupService, 'cleanOldBackups').mockResolvedValue();

            const result = await backupService.performBackup();

            expect(result).toBe(true);
            expect(fs.copyFile).toHaveBeenCalledWith(
                '/mock/db/path.sqlite',
                expect.stringContaining('database_backup_')
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Backup created successfully')
            );
            expect(mockEndOp).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should handle errors during backup', async () => {
            fs.access.mockRejectedValue(new Error('DB not found'));

            const result = await backupService.performBackup();

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to perform database backup',
                expect.any(Object)
            );
            expect(mockEndOp).toHaveBeenCalledWith(
                expect.objectContaining({ success: false }),
                'error'
            );
        });
    });

    describe('cleanOldBackups', () => {
        it('should not delete anything if under maxBackups', async () => {
            fs.readdir.mockResolvedValue(['database_backup_1.sqlite', 'database_backup_2.sqlite']);

            await backupService.cleanOldBackups();

            expect(fs.unlink).not.toHaveBeenCalled();
        });

        it('should delete oldest backups if over maxBackups', async () => {
            fs.readdir.mockResolvedValue([
                'database_backup_1.sqlite',
                'database_backup_2.sqlite',
                'database_backup_3.sqlite',
                'database_backup_4.sqlite',
                'other_file.txt'
            ]);

            // Mock stat to return different mtimes
            fs.stat.mockImplementation(filePath => {
                const num = parseInt(filePath.match(/\d/)[0]);
                return Promise.resolve({ mtime: new Date(2024, 0, num) });
            });

            await backupService.cleanOldBackups();

            // Should delete the oldest one (database_backup_1.sqlite)
            expect(fs.unlink).toHaveBeenCalledTimes(1);
            expect(fs.unlink).toHaveBeenCalledWith(
                path.join('/mock/backup/dir', 'database_backup_1.sqlite')
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Deleted old backup')
            );
        });

        it('should handle errors during cleanup', async () => {
            fs.readdir.mockRejectedValue(new Error('Read error'));

            await backupService.cleanOldBackups();

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to clean old backups',
                expect.any(Object)
            );
        });
    });
});
