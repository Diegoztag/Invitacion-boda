/**
 * CSV Confirmation Repository
 * Implementación del repositorio de confirmaciones usando archivos CSV
 * Sigue principios SOLID: Dependency Inversion y Single Responsibility
 */

const IConfirmationRepository = require('../../core/repositories/IConfirmationRepository');
const Confirmation = require('../../core/entities/Confirmation');
const fs = require('fs').promises;
const path = require('path');

class CsvConfirmationRepository extends IConfirmationRepository {
    constructor(csvStorage, logger) {
        super();
        this.csvStorage = csvStorage;
        this.logger = logger;
        this.headers = [
            'id',
            'invitationCode',
            'guestName',
            'willAttend',
            'guestCount',
            'dietaryRestrictions',
            'message',
            'confirmedAt'
        ];
    }

    /**
     * Guarda una nueva confirmación
     * @param {Confirmation} confirmation - Entidad de confirmación
     * @returns {Promise<Confirmation>} Confirmación guardada
     */
    async save(confirmation) {
        try {
            // Verificar que no existe ya una confirmación con el mismo código
            const existing = await this.findByCode(confirmation.code);
            if (existing) {
                throw new Error(`Ya existe una confirmación con el código ${confirmation.code}`);
            }

            // Leer confirmaciones existentes
            const confirmations = await this.readAllConfirmations();
            
            // Agregar nueva confirmación
            confirmations.push(confirmation);
            
            // Escribir al archivo
            await this.writeAllConfirmations(confirmations);
            
            this.logger.info('Confirmation saved successfully', {
                code: confirmation.code,
                willAttend: confirmation.willAttend,
                attendingGuests: confirmation.attendingGuests
            });

            return confirmation;
        } catch (error) {
            this.logger.error('Error saving confirmation', {
                code: confirmation.code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca una confirmación por código de invitación
     * @param {string} code - Código de la invitación
     * @returns {Promise<Confirmation|null>} Confirmación encontrada o null
     */
    async findByCode(code) {
        try {
            const confirmations = await this.readAllConfirmations();
            return confirmations.find(conf => conf.code === code) || null;
        } catch (error) {
            this.logger.error('Error finding confirmation by code', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene todas las confirmaciones
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones
     */
    async findAll(filters = {}) {
        try {
            let confirmations = await this.readAllConfirmations();

            // Aplicar filtros
            if (filters.willAttend !== undefined) {
                confirmations = confirmations.filter(conf => conf.willAttend === filters.willAttend);
            }

            if (filters.confirmedAfter) {
                const afterDate = new Date(filters.confirmedAfter);
                confirmations = confirmations.filter(conf => 
                    new Date(conf.confirmedAt) > afterDate
                );
            }

            if (filters.confirmedBefore) {
                const beforeDate = new Date(filters.confirmedBefore);
                confirmations = confirmations.filter(conf => 
                    new Date(conf.confirmedAt) < beforeDate
                );
            }

            return confirmations;
        } catch (error) {
            this.logger.error('Error finding all confirmations', {
                filters,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Actualiza una confirmación existente
     * @param {string} code - Código de la invitación
     * @param {Confirmation} confirmation - Datos actualizados de la confirmación
     * @returns {Promise<Confirmation>} Confirmación actualizada
     */
    async update(code, confirmation) {
        try {
            const confirmations = await this.readAllConfirmations();
            const index = confirmations.findIndex(conf => conf.code === code);
            
            if (index === -1) {
                throw new Error(`Confirmación con código ${code} no encontrada`);
            }

            // Actualizar la confirmación
            confirmations[index] = confirmation;
            
            // Escribir al archivo
            await this.writeAllConfirmations(confirmations);
            
            this.logger.info('Confirmation updated successfully', {
                code,
                willAttend: confirmation.willAttend,
                attendingGuests: confirmation.attendingGuests
            });

            return confirmation;
        } catch (error) {
            this.logger.error('Error updating confirmation', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Elimina una confirmación
     * @param {string} code - Código de la invitación
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    async delete(code) {
        try {
            const confirmations = await this.readAllConfirmations();
            const index = confirmations.findIndex(conf => conf.code === code);
            
            if (index === -1) {
                throw new Error(`Confirmación con código ${code} no encontrada`);
            }

            // Eliminar la confirmación
            confirmations.splice(index, 1);
            
            // Escribir al archivo
            await this.writeAllConfirmations(confirmations);
            
            this.logger.info('Confirmation deleted successfully', { code });

            return true;
        } catch (error) {
            this.logger.error('Error deleting confirmation', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca confirmaciones por número de teléfono
     * @param {string} phone - Número de teléfono
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones que coinciden
     */
    async findByPhone(phone) {
        try {
            const confirmations = await this.readAllConfirmations();
            return confirmations.filter(conf => conf.phone === phone);
        } catch (error) {
            this.logger.error('Error finding confirmations by phone', {
                phone,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca confirmaciones que contengan un nombre específico
     * @param {string} guestName - Nombre del invitado
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones que coinciden
     */
    async findByGuestName(guestName) {
        try {
            const confirmations = await this.readAllConfirmations();
            const searchName = guestName.toLowerCase();
            
            return confirmations.filter(confirmation => 
                confirmation.attendingNames.some(name => 
                    name.toLowerCase().includes(searchName)
                )
            );
        } catch (error) {
            this.logger.error('Error finding confirmations by guest name', {
                guestName,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene confirmaciones positivas (que van a asistir)
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones positivas
     */
    async findPositiveConfirmations() {
        try {
            return await this.findAll({ willAttend: true });
        } catch (error) {
            this.logger.error('Error finding positive confirmations', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene confirmaciones negativas (que no van a asistir)
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones negativas
     */
    async findNegativeConfirmations() {
        try {
            return await this.findAll({ willAttend: false });
        } catch (error) {
            this.logger.error('Error finding negative confirmations', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene confirmaciones con restricciones dietarias
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones con restricciones
     */
    async findWithDietaryRestrictions() {
        try {
            const confirmations = await this.readAllConfirmations();
            return confirmations.filter(conf => conf.hasDietaryRestrictions());
        } catch (error) {
            this.logger.error('Error finding confirmations with dietary restrictions', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene confirmaciones con mensajes para los novios
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones con mensajes
     */
    async findWithMessages() {
        try {
            const confirmations = await this.readAllConfirmations();
            return confirmations.filter(conf => conf.hasMessage());
        } catch (error) {
            this.logger.error('Error finding confirmations with messages', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de confirmaciones
     * @returns {Promise<Object>} Estadísticas de confirmaciones
     */
    async getStats() {
        try {
            const confirmations = await this.readAllConfirmations();
            
            const positive = confirmations.filter(conf => conf.isPositive());
            const negative = confirmations.filter(conf => conf.isNegative());
            
            const stats = {
                total: confirmations.length,
                positive: positive.length,
                negative: negative.length,
                totalConfirmedGuests: positive.reduce((sum, conf) => sum + conf.attendingGuests, 0),
                withDietaryRestrictions: confirmations.filter(conf => conf.hasDietaryRestrictions()).length,
                withMessages: confirmations.filter(conf => conf.hasMessage()).length,
                withPhone: confirmations.filter(conf => conf.hasPhone()).length,
                averageGuestsPerConfirmation: positive.length > 0 ? 
                    positive.reduce((sum, conf) => sum + conf.attendingGuests, 0) / positive.length : 0
            };

            return stats;
        } catch (error) {
            this.logger.error('Error getting confirmation stats', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Verifica si existe una confirmación para el código dado
     * @param {string} code - Código de la invitación
     * @returns {Promise<boolean>} True si existe
     */
    async exists(code) {
        try {
            const confirmation = await this.findByCode(code);
            return confirmation !== null;
        } catch (error) {
            this.logger.error('Error checking confirmation existence', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Cuenta el total de confirmaciones
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>} Número total de confirmaciones
     */
    async count(filters = {}) {
        try {
            const confirmations = await this.findAll(filters);
            return confirmations.length;
        } catch (error) {
            this.logger.error('Error counting confirmations', {
                filters,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene confirmaciones paginadas
     * @param {number} page - Número de página (1-based)
     * @param {number} limit - Límite de resultados por página
     * @param {Object} filters - Filtros opcionales
     * @param {Object} sort - Opciones de ordenamiento
     * @returns {Promise<Object>} Resultado paginado
     */
    async findPaginated(page = 1, limit = 10, filters = {}, sort = {}) {
        try {
            let confirmations = await this.findAll(filters);
            
            // Aplicar ordenamiento
            if (sort.field) {
                const direction = sort.direction === 'desc' ? -1 : 1;
                confirmations.sort((a, b) => {
                    const aVal = a[sort.field];
                    const bVal = b[sort.field];
                    
                    if (aVal < bVal) return -1 * direction;
                    if (aVal > bVal) return 1 * direction;
                    return 0;
                });
            }

            // Calcular paginación
            const total = confirmations.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedConfirmations = confirmations.slice(offset, offset + limit);

            return {
                data: paginatedConfirmations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            this.logger.error('Error finding paginated confirmations', {
                page,
                limit,
                filters,
                sort,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Exporta todas las confirmaciones
     * @param {Object} options - Opciones de exportación
     * @returns {Promise<Object>} Datos exportados
     */
    async exportAll(options = {}) {
        try {
            const confirmations = await this.readAllConfirmations();
            
            const exportData = confirmations.map(confirmation => confirmation.toObject());
            
            return {
                data: exportData,
                count: exportData.length,
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('Error exporting confirmations', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene el total de invitados confirmados
     * @returns {Promise<number>} Número total de invitados confirmados
     */
    async getTotalConfirmedGuests() {
        try {
            const positiveConfirmations = await this.findPositiveConfirmations();
            return positiveConfirmations.reduce((sum, conf) => sum + conf.attendingGuests, 0);
        } catch (error) {
            this.logger.error('Error getting total confirmed guests', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene confirmaciones recientes
     * @param {number} hours - Horas hacia atrás para considerar "reciente"
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones recientes
     */
    async findRecent(hours = 24) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - hours);
            
            return await this.findAll({ confirmedAfter: cutoffDate.toISOString() });
        } catch (error) {
            this.logger.error('Error finding recent confirmations', {
                hours,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca confirmaciones por rango de fechas
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha de fin
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones en el rango
     */
    async findByDateRange(startDate, endDate) {
        try {
            return await this.findAll({
                confirmedAfter: startDate.toISOString(),
                confirmedBefore: endDate.toISOString()
            });
        } catch (error) {
            this.logger.error('Error finding confirmations by date range', {
                startDate,
                endDate,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Lee todas las confirmaciones del archivo CSV
     * @returns {Promise<Array<Confirmation>>}
     * @private
     */
    async readAllConfirmations() {
        try {
            const rawConfirmations = await this.csvStorage.readConfirmations();
            const confirmations = [];
            
            for (const rawConfirmation of rawConfirmations) {
                try {
                    const confirmationData = this.csvRowToConfirmationData(rawConfirmation);
                    const confirmation = new Confirmation(confirmationData);
                    confirmations.push(confirmation);
                } catch (error) {
                    this.logger.warn('Error parsing confirmation from CSV', {
                        rawConfirmation,
                        error: error.message
                    });
                }
            }

            return confirmations;
        } catch (error) {
            this.logger.error('Error reading confirmations from CSV', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Escribe todas las confirmaciones al archivo CSV
     * @param {Array<Confirmation>} confirmations
     * @private
     */
    async writeAllConfirmations(confirmations) {
        try {
            const csvData = confirmations.map(confirmation => this.confirmationToCsvData(confirmation));
            await this.csvStorage.writeConfirmations(csvData);
        } catch (error) {
            this.logger.error('Error writing confirmations to CSV', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Convierte una fila CSV a datos de confirmación
     * @param {Object} rawData - Datos raw del CSV
     * @returns {Object}
     * @private
     */
    csvRowToConfirmationData(rawData) {
        const data = {};
        
        for (const header of this.headers) {
            const value = rawData[header] || '';
            
            switch (header) {
                case 'guestCount':
                    data[header] = value ? parseInt(value, 10) : 0;
                    break;
                case 'willAttend':
                    data[header] = value === 'true';
                    break;
                case 'confirmedAt':
                    data[header] = value || null;
                    break;
                default:
                    data[header] = value;
            }
        }

        return data;
    }

    /**
     * Convierte una confirmación a datos CSV
     * @param {Confirmation} confirmation
     * @returns {Object}
     * @private
     */
    confirmationToCsvData(confirmation) {
        const data = {};
        
        for (const header of this.headers) {
            let value = confirmation[header];
            
            switch (header) {
                case 'willAttend':
                    data[header] = confirmation.willAttend ? 'true' : 'false';
                    break;
                case 'guestCount':
                    data[header] = value || 0;
                    break;
                default:
                    data[header] = value || '';
            }
        }

        return data;
    }

    /**
     * Convierte una confirmación a fila CSV
     * @param {Confirmation} confirmation
     * @returns {string}
     * @private
     */
    confirmationToCsvRow(confirmation) {
        const values = [];
        
        for (const header of this.headers) {
            let value = confirmation[header];
            
            switch (header) {
                case 'attendingNames':
                    value = confirmation.attendingNames.join('|');
                    break;
                case 'willAttend':
                    value = confirmation.willAttend ? 'true' : 'false';
                    break;
                case 'attendingGuests':
                    value = value || 0;
                    break;
                default:
                    value = value || '';
            }
            
            // Escapar comillas y comas
            const escapedValue = this.escapeCsvValue(String(value));
            values.push(escapedValue);
        }

        return values.join(',');
    }

    /**
     * Parsea una línea CSV considerando comillas y comas
     * @param {string} line
     * @returns {Array<string>}
     * @private
     */
    parseCsvLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Comilla escapada
                    current += '"';
                    i++; // Saltar la siguiente comilla
                } else {
                    // Cambiar estado de comillas
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Separador de campo
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Agregar el último valor
        values.push(current);
        
        return values;
    }

    /**
     * Escapa un valor para CSV
     * @param {string} value
     * @returns {string}
     * @private
     */
    escapeCsvValue(value) {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            // Escapar comillas duplicándolas y envolver en comillas
            const escapedValue = value.replace(/"/g, '""');
            return `"${escapedValue}"`;
        }
        return value;
    }
}

module.exports = CsvConfirmationRepository;
