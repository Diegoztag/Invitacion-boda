/**
 * CSV Storage Service
 * Servicio de almacenamiento CSV para Clean Architecture
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

class CsvStorage {
    constructor(logger) {
        this.logger = logger;

        // Permitir sobreescritura de rutas de archivos mediante variables de entorno (útil para tests)
        const defaultDataPath = path.join(__dirname, '../../../data');
        const invitationsPath = process.env.CSV_INVITATIONS_PATH
            ? path.resolve(process.env.CSV_INVITATIONS_PATH)
            : path.join(defaultDataPath, 'invitations.csv');
        const confirmationsPath = process.env.CSV_CONFIRMATIONS_PATH
            ? path.resolve(process.env.CSV_CONFIRMATIONS_PATH)
            : path.join(defaultDataPath, 'confirmations.csv');

        this.invitationsFile = invitationsPath;
        this.confirmationsFile = confirmationsPath;

        // Usar la carpeta del archivo de invitaciones como base para el storage.
        // Si se usan rutas personalizadas, puede ser diferente a `../data`.
        this.dataPath = path.dirname(this.invitationsFile);
    }

    /**
     * Inicializa el almacenamiento CSV
     */
    async initialize() {
        try {
            // Crear directorios si no existen
            await fs.mkdir(path.dirname(this.invitationsFile), { recursive: true });
            await fs.mkdir(path.dirname(this.confirmationsFile), { recursive: true });

            // Verificar y crear archivos CSV si no existen (o reiniciar en modo test)
            await this.ensureFileExists(this.invitationsFile, this.getInvitationsHeaders());
            await this.ensureFileExists(this.confirmationsFile, ['invitationCode', 'willAttend']);

            this.logger.info('CSV Storage initialized successfully');
        } catch (error) {
            this.logger.error('Error initializing CSV storage', { error: error.message });
            throw error;
        }
    }

    /**
     * Asegura que un archivo CSV existe con los headers correctos
     */
    async ensureFileExists(filePath, headers) {
        try {
            if (process.env.NODE_ENV === 'test') {
                // En tests, siempre reiniciar a un archivo limpio para evitar contaminación entre pruebas
                const csvContent = stringify([headers]);
                await fs.writeFile(filePath, csvContent, 'utf8');
                this.logger.debug(`Reset CSV file for test: ${filePath}`);
                return;
            }

            await fs.access(filePath);
        } catch (_error) {
            // El archivo no existe, crearlo con headers
            const csvContent = stringify([headers]);
            await fs.writeFile(filePath, csvContent, 'utf8');
            this.logger.info(`Created CSV file: ${filePath}`);
        }
    }

    /**
     * Obtiene los headers para el archivo de invitaciones
     */
    getInvitationsHeaders() {
        return [
            'code',
            'guestNames',
            'numberOfPasses',
            'phone',
            'createdAt',
            'confirmedPasses',
            'confirmationDate',
            'adultPasses',
            'childPasses',
            'staffPasses',
            'tableNumber',
            'status',
            'cancelledAt',
            'cancelledBy',
            'cancellationReason',
            'attendingNames',
            'dietaryRestrictionsNames',
            'dietaryRestrictionsDetails',
            'generalMessage'
        ];
    }

    /**
     * Lee datos de un archivo CSV
     */
    async readCsvFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            if (!content.trim()) {
                return [];
            }

            const records = parse(content, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true
            });

            return records;
        } catch (error) {
            this.logger.error(`Error reading CSV file: ${filePath}`, { error: error.message });
            throw error;
        }
    }

    /**
     * Escribe datos a un archivo CSV
     */
    async writeCsvFile(filePath, data, headers) {
        try {
            const csvContent = stringify(data, {
                header: true,
                columns: headers
            });

            await fs.writeFile(filePath, csvContent, 'utf8');
            this.logger.debug(`CSV file written: ${filePath}`, { recordCount: data.length });
        } catch (error) {
            this.logger.error(`Error writing CSV file: ${filePath}`, { error: error.message });
            throw error;
        }
    }

    /**
     * Lee todas las invitaciones
     */
    async readInvitations() {
        return await this.readCsvFile(this.invitationsFile);
    }

    /**
     * Escribe todas las invitaciones
     */
    async writeInvitations(invitations) {
        await this.writeCsvFile(this.invitationsFile, invitations, this.getInvitationsHeaders());
    }

    /**
     * Lee todas las confirmaciones
     * @deprecated Retorna array vacío ya que confirmations.csv no se usa
     */
    async readConfirmations() {
        return [];
    }

    /**
     * Escribe todas las confirmaciones
     * @deprecated No hace nada ya que confirmations.csv no se usa
     */
    async writeConfirmations(_confirmations) {
        this.logger.debug('writeConfirmations called but ignored (deprecated)');
    }

    /**
     * Agrega una nueva invitación
     */
    async addInvitation(invitation) {
        try {
            const invitations = await this.readInvitations();
            invitations.push(invitation);
            await this.writeInvitations(invitations);

            this.logger.info('Invitation added to CSV', { code: invitation.code });
            return invitation;
        } catch (error) {
            this.logger.error('Error adding invitation to CSV', {
                code: invitation.code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Actualiza una invitación existente
     */
    async updateInvitation(code, updates) {
        try {
            const invitations = await this.readInvitations();
            const index = invitations.findIndex(inv => inv.code === code);

            if (index === -1) {
                throw new Error(`Invitation with code ${code} not found`);
            }

            invitations[index] = { ...invitations[index], ...updates };
            await this.writeInvitations(invitations);

            this.logger.info('Invitation updated in CSV', { code });
            return invitations[index];
        } catch (error) {
            this.logger.error('Error updating invitation in CSV', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Agrega una nueva confirmación
     * @deprecated
     */
    async addConfirmation(confirmation) {
        this.logger.debug('addConfirmation called but ignored (deprecated)', {
            invitationCode: confirmation.invitationCode
        });
        return confirmation;
    }

    /**
     * Busca invitaciones por criterios
     */
    async findInvitations(criteria = {}) {
        try {
            const invitations = await this.readInvitations();

            return invitations.filter(invitation => {
                return Object.keys(criteria).every(key => {
                    if (criteria[key] === null || criteria[key] === undefined) {
                        return true;
                    }
                    return invitation[key] === criteria[key];
                });
            });
        } catch (error) {
            this.logger.error('Error finding invitations in CSV', {
                criteria,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca confirmaciones por criterios
     * @deprecated
     */
    async findConfirmations(_criteria = {}) {
        return [];
    }

    /**
     * Obtiene estadísticas de invitaciones
     */
    async getInvitationStats() {
        try {
            const invitations = await this.readInvitations();
            const confirmations = await this.readConfirmations();

            const total = invitations.length;
            const confirmed = confirmations.filter(c => c.willAttend === 'true').length;
            const declined = confirmations.filter(c => c.willAttend === 'false').length;
            const pending = total - confirmations.length;

            return {
                total,
                confirmed,
                declined,
                pending,
                confirmationRate: total > 0 ? ((confirmed / total) * 100).toFixed(2) : 0
            };
        } catch (error) {
            this.logger.error('Error getting invitation stats from CSV', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Realiza backup de los archivos CSV
     */
    async backup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(this.dataPath, 'backups');

            await fs.mkdir(backupDir, { recursive: true });

            // Backup invitations
            const invitationsBackup = path.join(backupDir, `invitations-${timestamp}.csv`);
            await fs.copyFile(this.invitationsFile, invitationsBackup);

            this.logger.info('CSV backup completed', { timestamp });
            return { timestamp, invitationsBackup };
        } catch (error) {
            this.logger.error('Error creating CSV backup', { error: error.message });
            throw error;
        }
    }
}

module.exports = CsvStorage;
