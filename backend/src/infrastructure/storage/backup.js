/**
 * SQLite Backup Service
 * Servicio para realizar copias de seguridad automáticas de la base de datos SQLite
 */

const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class BackupService {
    constructor(logger, config = {}) {
        this.logger = logger;
        this.dbPath = config.dbPath || path.join(__dirname, '../../../../data/database.sqlite');
        this.backupDir = config.backupDir || path.join(__dirname, '../../../../data/backups');
        this.cronSchedule = config.cronSchedule || '0 2 * * *'; // Por defecto a las 2:00 AM todos los días
        this.maxBackups = config.maxBackups || 7; // Mantener los últimos 7 backups
    }

    /**
     * Inicializa el servicio de backup programado
     */
    init() {
        this.logger.info(`Initializing SQLite backup service. Schedule: ${this.cronSchedule}`);

        // Asegurar que el directorio de backups exista
        this.ensureBackupDir()
            .then(() => {
                // Programar la tarea
                cron.schedule(this.cronSchedule, () => {
                    this.performBackup();
                });
            })
            .catch(error => {
                this.logger.error('Failed to initialize backup directory', {
                    error: error.message
                });
            });
    }

    /**
     * Asegura que el directorio de backups exista
     */
    async ensureBackupDir() {
        try {
            await fs.access(this.backupDir);
        } catch {
            await fs.mkdir(this.backupDir, { recursive: true });
            this.logger.info(`Created backup directory at ${this.backupDir}`);
        }
    }

    /**
     * Realiza la copia de seguridad
     */
    async performBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `database_backup_${timestamp}.sqlite`;
        const backupPath = path.join(this.backupDir, backupFileName);

        const endOp = this.logger.startOperation('sqlite_backup');

        try {
            // Verificar si la base de datos existe
            await fs.access(this.dbPath);

            // Copiar el archivo
            await fs.copyFile(this.dbPath, backupPath);

            this.logger.info(`Backup created successfully: ${backupFileName}`);

            // Limpiar backups antiguos
            await this.cleanOldBackups();

            endOp({ success: true, backupPath });
            return true;
        } catch (error) {
            this.logger.error('Failed to perform database backup', {
                error: error.message,
                dbPath: this.dbPath
            });
            endOp({ success: false, error: error.message }, 'error');
            return false;
        }
    }

    /**
     * Limpia los backups antiguos manteniendo solo los más recientes
     */
    async cleanOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);

            // Filtrar solo archivos de backup
            const backupFiles = files.filter(
                f => f.startsWith('database_backup_') && f.endsWith('.sqlite')
            );

            if (backupFiles.length <= this.maxBackups) {
                return; // No hay suficientes backups para limpiar
            }

            // Ordenar por fecha de modificación (más antiguos primero)
            const filesWithStats = await Promise.all(
                backupFiles.map(async file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    return { file, filePath, mtime: stats.mtime };
                })
            );

            filesWithStats.sort((a, b) => a.mtime - b.mtime);

            // Eliminar los más antiguos
            const filesToDelete = filesWithStats.slice(0, filesWithStats.length - this.maxBackups);

            for (const { file, filePath } of filesToDelete) {
                await fs.unlink(filePath);
                this.logger.info(`Deleted old backup: ${file}`);
            }
        } catch (error) {
            this.logger.error('Failed to clean old backups', { error: error.message });
        }
    }
}

module.exports = BackupService;
