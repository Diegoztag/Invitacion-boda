/**
 * CSV Invitation Repository
 * Implementación del repositorio de invitaciones usando archivos CSV
 * Sigue principios SOLID: Dependency Inversion y Single Responsibility
 */

const IInvitationRepository = require('../../core/repositories/IInvitationRepository');
const Invitation = require('../../core/entities/Invitation');
const fs = require('fs').promises;
const path = require('path');

class CsvInvitationRepository extends IInvitationRepository {
    constructor(csvStorage, logger) {
        super();
        this.csvStorage = csvStorage;
        this.logger = logger;
        this.headers = [
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
     * Guarda múltiples invitaciones en una sola operación
     * @param {Array<Invitation>} newInvitations - Lista de nuevas invitaciones
     * @returns {Promise<Array<Invitation>>} Invitaciones guardadas
     */
    async saveBatch(newInvitations) {
        try {
            if (!newInvitations || newInvitations.length === 0) {
                return [];
            }

            // Leer invitaciones existentes
            const invitations = await this.readAllInvitations();
            
            // Verificar duplicados de código
            const existingCodes = new Set(invitations.map(inv => inv.code));
            
            for (const newInv of newInvitations) {
                if (existingCodes.has(newInv.code)) {
                    throw new Error(`Ya existe una invitación con el código ${newInv.code}`);
                }
                existingCodes.add(newInv.code); // Agregar al set para verificar duplicados dentro del mismo lote
            }
            
            // Agregar nuevas invitaciones
            invitations.push(...newInvitations);
            
            // Escribir al archivo
            await this.writeAllInvitations(invitations);
            
            this.logger.info('Batch invitations saved successfully', {
                count: newInvitations.length
            });

            return newInvitations;
        } catch (error) {
            this.logger.error('Error saving batch invitations', {
                count: newInvitations ? newInvitations.length : 0,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Guarda una nueva invitación
     * @param {Invitation} invitation - Entidad de invitación
     * @returns {Promise<Invitation>} Invitación guardada
     */
    async save(invitation) {
        try {
            // Verificar que no existe ya una invitación con el mismo código
            const existing = await this.findByCode(invitation.code);
            if (existing) {
                throw new Error(`Ya existe una invitación con el código ${invitation.code}`);
            }

            // Leer invitaciones existentes
            const invitations = await this.readAllInvitations();
            
            // Agregar nueva invitación
            invitations.push(invitation);
            
            // Escribir al archivo
            await this.writeAllInvitations(invitations);
            
            this.logger.info('Invitation saved successfully', {
                code: invitation.code,
                guestNames: invitation.getGuestNamesString()
            });

            return invitation;
        } catch (error) {
            this.logger.error('Error saving invitation', {
                code: invitation.code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca una invitación por código
     * @param {string} code - Código de la invitación
     * @returns {Promise<Invitation|null>} Invitación encontrada o null
     */
    async findByCode(code) {
        try {
            const invitations = await this.readAllInvitations();
            const found = invitations.find(inv => inv.code.toLowerCase() === code.toLowerCase()) || null;
            
            if (!found) {
                this.logger.warn(`Invitation not found for code: ${code}`, {
                    totalInvitations: invitations.length,
                    availableCodes: invitations.map(i => i.code).slice(0, 10) // Log first 10 codes
                });
            } else {
                this.logger.info(`Invitation found for code: ${code}`, {
                    status: found.status,
                    isActive: found.isActive()
                });
            }

            return found;
        } catch (error) {
            this.logger.error('Error finding invitation by code', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene todas las invitaciones
     * @param {Object} filters - Filtros opcionales
     * @param {boolean} includeInactive - Si incluir invitaciones inactivas (por defecto false)
     * @returns {Promise<Array<Invitation>>} Lista de invitaciones
     */
    async findAll(filters = {}, includeInactive = false) {
        try {
            let invitations = await this.readAllInvitations();

            // FILTRO PRINCIPAL: Excluir invitaciones inactivas por defecto
            if (!includeInactive) {
                invitations = invitations.filter(inv => inv.status !== 'inactive');
            }

            // Aplicar filtros adicionales
            if (filters.status) {
                invitations = invitations.filter(inv => inv.status === filters.status);
            }

            if (filters.confirmed !== undefined) {
                // Mantener compatibilidad con filtro confirmed
                if (filters.confirmed) {
                    invitations = invitations.filter(inv => inv.isConfirmed());
                } else {
                    invitations = invitations.filter(inv => !inv.isConfirmed());
                }
            }

            // Filtro por número de pases
            if (filters.passes) {
                if (filters.passes === '4+') {
                    invitations = invitations.filter(inv => inv.numberOfPasses >= 4);
                } else {
                    const passes = parseInt(filters.passes);
                    if (!isNaN(passes)) {
                        invitations = invitations.filter(inv => inv.numberOfPasses === passes);
                    }
                }
            }

            // Filtro por mesa
            if (filters.table) {
                if (filters.table === 'assigned') {
                    invitations = invitations.filter(inv => inv.tableNumber && inv.tableNumber > 0);
                } else if (filters.table === 'unassigned') {
                    invitations = invitations.filter(inv => !inv.tableNumber);
                }
            }

            // Filtro por teléfono
            if (filters.phone) {
                if (filters.phone === 'with_phone') {
                    invitations = invitations.filter(inv => inv.phone && inv.phone.trim().length > 0);
                } else if (filters.phone === 'without_phone') {
                    invitations = invitations.filter(inv => !inv.phone || inv.phone.trim().length === 0);
                }
            }

            // Filtro de búsqueda por nombre
            if (filters.search) {
                const searchName = filters.search.toLowerCase();
                invitations = invitations.filter(invitation => 
                    invitation.guestNames.some(name => 
                        name.toLowerCase().includes(searchName)
                    )
                );
            }

            return invitations;
        } catch (error) {
            this.logger.error('Error finding all invitations', {
                filters,
                includeInactive,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Actualiza una invitación existente
     * @param {string} code - Código de la invitación
     * @param {Invitation} invitation - Datos actualizados de la invitación
     * @returns {Promise<Invitation>} Invitación actualizada
     */
    async update(code, invitation) {
        try {
            const invitations = await this.readAllInvitations();
            const index = invitations.findIndex(inv => inv.code.toLowerCase() === code.toLowerCase());
            
            if (index === -1) {
                throw new Error(`Invitación con código ${code} no encontrada`);
            }

            // Actualizar la invitación
            invitations[index] = invitation;
            
            // Escribir al archivo
            await this.writeAllInvitations(invitations);
            
            this.logger.info('Invitation updated successfully', {
                code,
                guestNames: invitation.getGuestNamesString()
            });

            return invitation;
        } catch (error) {
            this.logger.error('Error updating invitation', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Elimina una invitación (soft delete)
     * @param {string} code - Código de la invitación
     * @param {string} deletedBy - Quien elimina la invitación
     * @param {string} reason - Razón de la eliminación
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    async delete(code, deletedBy = 'admin', reason = '') {
        try {
            const invitation = await this.findByCode(code);
            if (!invitation) {
                throw new Error(`Invitación con código ${code} no encontrada`);
            }

            // Desactivar la invitación
            const deactivatedInvitation = invitation.deactivate(deletedBy, reason);
            
            // Actualizar en el archivo
            await this.update(code, deactivatedInvitation);
            
            this.logger.info('Invitation deleted successfully', {
                code,
                deletedBy,
                reason
            });

            return true;
        } catch (error) {
            this.logger.error('Error deleting invitation', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Reactiva una invitación eliminada
     * @param {string} code - Código de la invitación
     * @returns {Promise<Invitation>} Invitación reactivada
     */
    async restore(code) {
        try {
            const invitation = await this.findByCode(code);
            if (!invitation) {
                throw new Error(`Invitación con código ${code} no encontrada`);
            }

            // Reactivar la invitación
            const reactivatedInvitation = invitation.activate();
            
            // Actualizar en el archivo
            await this.update(code, reactivatedInvitation);
            
            this.logger.info('Invitation restored successfully', { code });

            return reactivatedInvitation;
        } catch (error) {
            this.logger.error('Error restoring invitation', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca invitaciones por nombre de invitado
     * @param {string} guestName - Nombre del invitado
     * @param {boolean} includeInactive - Si incluir invitaciones inactivas
     * @returns {Promise<Array<Invitation>>} Lista de invitaciones que coinciden
     */
    async findByGuestName(guestName, includeInactive = false) {
        try {
            const invitations = await this.findAll({}, includeInactive);
            const searchName = guestName.toLowerCase();
            
            return invitations.filter(invitation => 
                invitation.guestNames.some(name => 
                    name.toLowerCase().includes(searchName)
                )
            );
        } catch (error) {
            this.logger.error('Error finding invitations by guest name', {
                guestName,
                includeInactive,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca invitaciones por número de teléfono
     * @param {string} phone - Número de teléfono
     * @param {boolean} includeInactive - Si incluir invitaciones inactivas
     * @returns {Promise<Array<Invitation>>} Lista de invitaciones que coinciden
     */
    async findByPhone(phone, includeInactive = false) {
        try {
            const invitations = await this.findAll({}, includeInactive);
            return invitations.filter(invitation => invitation.phone === phone);
        } catch (error) {
            this.logger.error('Error finding invitations by phone', {
                phone,
                includeInactive,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Busca invitaciones por número de mesa
     * @param {number} tableNumber - Número de mesa
     * @param {boolean} includeInactive - Si incluir invitaciones inactivas
     * @returns {Promise<Array<Invitation>>} Lista de invitaciones de la mesa
     */
    async findByTable(tableNumber, includeInactive = false) {
        try {
            const invitations = await this.findAll({}, includeInactive);
            return invitations.filter(invitation => invitation.tableNumber === tableNumber);
        } catch (error) {
            this.logger.error('Error finding invitations by table', {
                tableNumber,
                includeInactive,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de invitaciones
     * @returns {Promise<Object>} Estadísticas de invitaciones
     */
    async getStats() {
        try {
            const invitations = await this.readAllInvitations();
            
            // Filtrar invitaciones activas (excluir inactive Y cancelled)
            const activeInvitations = invitations.filter(inv => 
                inv.status !== 'inactive' && inv.status !== 'cancelled'
            );
            const confirmedInvitations = activeInvitations.filter(inv => inv.status === 'confirmed');
            const partialInvitations = activeInvitations.filter(inv => inv.status === 'partial');
            const pendingInvitations = activeInvitations.filter(inv => inv.status === 'pending');
            
            // Separar las excluidas para tracking
            const cancelledInvitations = invitations.filter(inv => inv.status === 'cancelled');
            const inactiveInvitations = invitations.filter(inv => inv.status === 'inactive');
            
            // Calcular pases ocupados
            const occupiedPasses = 
                // confirmed: todos los confirmedPasses
                confirmedInvitations.reduce((sum, inv) => sum + inv.confirmedPasses, 0) +
                // partial: solo los confirmedPasses
                partialInvitations.reduce((sum, inv) => sum + inv.confirmedPasses, 0) +
                // pending: asumimos que todos van (numberOfPasses)
                pendingInvitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0);
            
            // Calcular pases liberados
            const liberatedByCancel = cancelledInvitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0);
            const liberatedByInactive = inactiveInvitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0);
            const liberatedByPartial = partialInvitations.reduce((sum, inv) => sum + (inv.numberOfPasses - inv.confirmedPasses), 0);
            
            // Total de pases emitidos (Activos + Cancelados)
            // Excluye inactivos para mantener consistencia con la regla de negocio "no contar inactivos"
            const totalIssuedPasses = activeInvitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0) + liberatedByCancel;

            // Total de pases liberados (Cancelados + Parciales)
            // Excluye inactivos porque no son parte del "Total Emitido" visible
            const totalLiberatedPasses = liberatedByCancel + liberatedByPartial;

            // Calcular totales para porcentajes
            const totalActivePassesCalc = activeInvitations.reduce((sum, inv) => {
                if (inv.status === 'pending') return sum + inv.numberOfPasses;
                return sum + inv.confirmedPasses;
            }, 0);

            // Calcular desglose por tipos - ACTIVOS
            const activeAdultPasses = this.calculateAdjustedPassesByType(activeInvitations, 'adultPasses');
            const activeChildPasses = this.calculateAdjustedPassesByType(activeInvitations, 'childPasses');
            const activeStaffPasses = this.calculateAdjustedPassesByType(activeInvitations, 'staffPasses');

            const stats = {
                // Conteos básicos de invitaciones
                // Total visible incluye activas y canceladas (excluye inactivas)
                total: activeInvitations.length + cancelledInvitations.length,
                active: activeInvitations.length,
                inactive: inactiveInvitations.length,
                confirmed: confirmedInvitations.length,
                partial: partialInvitations.length,
                cancelled: cancelledInvitations.length,
                pending: pendingInvitations.length,
                
                // Total Emitido para UI
                totalIssuedPasses: totalIssuedPasses,
                
                // Pases confirmados reales
                confirmedPasses: activeInvitations.reduce((sum, inv) => sum + inv.confirmedPasses, 0),
                
                // Pases pendientes (estimados)
                pendingPasses: pendingInvitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0),
                
                // Desglose por tipos - ACTIVOS (Ajustado: Pending completos + Confirmed/Partial proporcionales)
                // Esto asegura que el desglose sume correctamente al total de pases activos reales
                activeAdultPasses: activeAdultPasses,
                activeChildPasses: activeChildPasses,
                activeStaffPasses: activeStaffPasses,
                
                // Total de pases activos (Pending completos + Confirmed/Partial reales)
                // Excluye la parte liberada de las invitaciones parciales
                totalActivePasses: totalActivePassesCalc,

                // Porcentajes de distribución (calculados en backend)
                distributionPercentages: {
                    adults: totalActivePassesCalc > 0 ? Math.round((activeAdultPasses / totalActivePassesCalc) * 100) : 0,
                    children: totalActivePassesCalc > 0 ? Math.round((activeChildPasses / totalActivePassesCalc) * 100) : 0,
                    staff: totalActivePassesCalc > 0 ? Math.round((activeStaffPasses / totalActivePassesCalc) * 100) : 0
                },
                
                // Desglose por tipos - CONFIRMADOS (basado en proporción real)
                confirmedAdultPasses: this.calculateConfirmedPassesByType(activeInvitations, 'adultPasses'),
                confirmedChildPasses: this.calculateConfirmedPassesByType(activeInvitations, 'childPasses'),
                confirmedStaffPasses: this.calculateConfirmedPassesByType(activeInvitations, 'staffPasses'),
                
                // Total de pases confirmados
                totalConfirmedPasses: activeInvitations.reduce((sum, inv) => sum + inv.confirmedPasses, 0),
                
                // Métricas de capacidad
                occupiedPasses: occupiedPasses,
                totalLiberatedPasses: totalLiberatedPasses,
                liberatedByCancel: liberatedByCancel,
                liberatedByInactive: liberatedByInactive,
                liberatedByPartial: liberatedByPartial
            };

            return stats;
        } catch (error) {
            this.logger.error('Error getting invitation stats', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Calcula pases activos ajustados por tipo
     * Para pending: cuenta todos
     * Para partial/confirmed: cuenta proporcional a lo confirmado
     * @param {Array<Invitation>} invitations 
     * @param {string} passType 
     * @returns {number}
     * @private
     */
    calculateAdjustedPassesByType(invitations, passType) {
        return invitations.reduce((sum, inv) => {
            if (inv.status === 'pending') {
                return sum + (inv[passType] || 0);
            } else if (inv.confirmedPasses > 0) {
                // Para confirmed y partial, usamos la proporción de lo confirmado
                // Si es confirmed, ratio será 1 (o cercano si hay error de datos)
                // Si es partial, ratio será < 1
                const ratio = inv.confirmedPasses / inv.numberOfPasses;
                return sum + Math.round((inv[passType] || 0) * ratio);
            }
            return sum;
        }, 0);
    }

    /**
     * Calcula pases confirmados por tipo basado en proporción real
     * @param {Array<Invitation>} invitations - Lista de invitaciones activas
     * @param {string} passType - Tipo de pase ('adultPasses', 'childPasses', 'staffPasses')
     * @returns {number} Número de pases confirmados de ese tipo
     * @private
     */
    calculateConfirmedPassesByType(invitations, passType) {
        return invitations.reduce((sum, inv) => {
            if (inv.status === 'confirmed') {
                // Para confirmed, todos los pases de ese tipo están confirmados
                return sum + (inv[passType] || 0);
            } else if (inv.status === 'partial' && inv.confirmedPasses > 0) {
                // Para partial, calcular proporción
                const ratio = inv.confirmedPasses / inv.numberOfPasses;
                return sum + Math.round((inv[passType] || 0) * ratio);
            }
            // pending y cancelled no contribuyen a confirmados
            return sum;
        }, 0);
    }

    /**
     * Importa múltiples invitaciones
     * @param {Array<Object>} invitationsData - Datos de las invitaciones
     * @returns {Promise<Object>} Resultado de la importación
     */
    async importBatch(invitationsData) {
        try {
            const results = {
                success: [],
                errors: [],
                total: invitationsData.length
            };

            for (let i = 0; i < invitationsData.length; i++) {
                try {
                    const invitation = new Invitation(invitationsData[i]);
                    await this.save(invitation);
                    results.success.push({
                        index: i,
                        code: invitation.code
                    });
                } catch (error) {
                    results.errors.push({
                        index: i,
                        error: error.message,
                        data: invitationsData[i]
                    });
                }
            }

            this.logger.info('Batch import completed', {
                total: results.total,
                successful: results.success.length,
                failed: results.errors.length
            });

            return results;
        } catch (error) {
            this.logger.error('Error in batch import', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Exporta todas las invitaciones
     * @param {Object} options - Opciones de exportación
     * @returns {Promise<Object>} Datos exportados
     */
    async exportAll(options = {}) {
        try {
            const invitations = await this.readAllInvitations();
            
            const exportData = invitations.map(invitation => invitation.toObject());
            
            return {
                data: exportData,
                count: exportData.length,
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('Error exporting invitations', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Verifica si existe una invitación con el código dado
     * @param {string} code - Código de la invitación
     * @returns {Promise<boolean>} True si existe
     */
    async exists(code) {
        try {
            const invitation = await this.findByCode(code);
            return invitation !== null;
        } catch (error) {
            this.logger.error('Error checking invitation existence', {
                code,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Cuenta el total de invitaciones
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>} Número total de invitaciones
     */
    async count(filters = {}) {
        try {
            const invitations = await this.findAll(filters);
            return invitations.length;
        } catch (error) {
            this.logger.error('Error counting invitations', {
                filters,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtiene invitaciones paginadas
     * @param {number} page - Número de página (1-based)
     * @param {number} limit - Límite de resultados por página
     * @param {Object} filters - Filtros opcionales
     * @param {Object} sort - Opciones de ordenamiento
     * @returns {Promise<Object>} Resultado paginado
     */
    async findPaginated(page = 1, limit = 10, filters = {}, sort = {}, includeInactive = false) {
        try {
            let invitations = await this.findAll(filters, includeInactive);
            
            // Aplicar ordenamiento
            if (sort.field) {
                const direction = sort.direction === 'desc' ? -1 : 1;
                invitations.sort((a, b) => {
                    const aVal = a[sort.field];
                    const bVal = b[sort.field];
                    
                    if (aVal < bVal) return -1 * direction;
                    if (aVal > bVal) return 1 * direction;
                    return 0;
                });
            }

            // Calcular paginación
            const total = invitations.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedInvitations = invitations.slice(offset, offset + limit);

            return {
                data: paginatedInvitations,
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
            this.logger.error('Error finding paginated invitations', {
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
     * Lee todas las invitaciones del archivo CSV
     * @returns {Promise<Array<Invitation>>}
     * @private
     */
    async readAllInvitations() {
        try {
            const rawInvitations = await this.csvStorage.readInvitations();
            const invitations = [];
            
            for (const rawInvitation of rawInvitations) {
                try {
                    const invitationData = this.csvRowToInvitationData(rawInvitation);
                    const invitation = new Invitation(invitationData);
                    invitations.push(invitation);
                } catch (error) {
                    this.logger.warn('Error parsing invitation from CSV', {
                        rawInvitation,
                        error: error.message
                    });
                }
            }

            return invitations;
        } catch (error) {
            this.logger.error('Error reading invitations from CSV', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Escribe todas las invitaciones al archivo CSV
     * @param {Array<Invitation>} invitations
     * @private
     */
    async writeAllInvitations(invitations) {
        try {
            const csvData = invitations.map(invitation => this.invitationToCsvData(invitation));
            await this.csvStorage.writeInvitations(csvData);
        } catch (error) {
            this.logger.error('Error writing invitations to CSV', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Convierte una fila CSV a datos de invitación
     * @param {Object} rawData - Datos raw del CSV
     * @returns {Object}
     * @private
     */
    csvRowToInvitationData(rawData) {
        const data = {};
        
        for (const header of this.headers) {
            const value = rawData[header];
            
            switch (header) {
                case 'guestNames':
                case 'attendingNames':
                    data[header] = value ? value.split('|') : [];
                    break;
                case 'numberOfPasses':
                case 'confirmedPasses':
                case 'adultPasses':
                case 'childPasses':
                case 'staffPasses':
                case 'tableNumber':
                    // CORREGIDO: Manejar correctamente valores 0 del CSV
                    if (value === '' || value === null || value === undefined) {
                        data[header] = (header === 'numberOfPasses' ? 1 : 0);
                    } else {
                        const numValue = parseInt(value, 10);
                        data[header] = isNaN(numValue) ? 0 : numValue;
                    }
                    break;
                case 'createdAt':
                case 'confirmationDate':
                case 'cancelledAt':
                    data[header] = value || null;
                    break;
                case 'dietaryRestrictionsNames':
                case 'dietaryRestrictionsDetails':
                case 'generalMessage':
                    data[header] = value || '';
                    break;
                case 'status':
                    // Normalizar status: minúsculas y sin espacios
                    data[header] = value ? value.toLowerCase().trim() : 'pending';
                    break;
                default:
                    data[header] = value || '';
            }
        }

        return data;
    }

    /**
     * Convierte una invitación a datos CSV
     * @param {Invitation} invitation
     * @returns {Object}
     * @private
     */
    invitationToCsvData(invitation) {
        const data = {};
        
        for (const header of this.headers) {
            let value;
            
            // Usar getters públicos en lugar de acceso directo a propiedades
            switch (header) {
                case 'code':
                    value = invitation.code;
                    break;
                case 'guestNames':
                    data[header] = invitation.guestNames.join('|');
                    continue;
                case 'numberOfPasses':
                    value = invitation.numberOfPasses;
                    break;
                case 'phone':
                    value = invitation.phone;
                    break;
                case 'createdAt':
                    value = invitation.createdAt;
                    break;
                case 'confirmedPasses':
                    value = invitation.confirmedPasses;
                    break;
                case 'confirmationDate':
                    value = invitation.confirmationDate;
                    break;
                case 'adultPasses':
                    value = invitation.adultPasses;
                    break;
                case 'childPasses':
                    value = invitation.childPasses;
                    break;
                case 'staffPasses':
                    value = invitation.staffPasses;
                    break;
                case 'tableNumber':
                    value = invitation.tableNumber;
                    break;
                case 'status':
                    value = invitation.status;
                    break;
                case 'cancelledAt':
                    value = invitation.cancelledAt;
                    break;
                case 'cancelledBy':
                    value = invitation.cancelledBy;
                    break;
                case 'cancellationReason':
                    value = invitation.cancellationReason;
                    break;
                case 'attendingNames':
                    data[header] = invitation.attendingNames.join('|');
                    continue;
                case 'dietaryRestrictionsNames':
                    value = invitation.dietaryRestrictionsNames;
                    break;
                case 'dietaryRestrictionsDetails':
                    value = invitation.dietaryRestrictionsDetails;
                    break;
                case 'generalMessage':
                    value = invitation.generalMessage;
                    break;
                default:
                    value = '';
            }
            
            // Manejar valores numéricos
            if (['numberOfPasses', 'confirmedPasses', 'adultPasses', 'childPasses', 'staffPasses', 'tableNumber'].includes(header)) {
                data[header] = value || 0;
            } else {
                data[header] = value || '';
            }
        }

        return data;
    }

    /**
     * Convierte una invitación a fila CSV
     * @param {Invitation} invitation
     * @returns {string}
     * @private
     */
    invitationToCsvRow(invitation) {
        const values = [];
        
        for (const header of this.headers) {
            let value = invitation[header];
            
            switch (header) {
                case 'guestNames':
                    value = invitation.guestNames.join('|');
                    break;
                case 'confirmed':
                    value = invitation.confirmed ? 'true' : 'false';
                    break;
                case 'numberOfPasses':
                case 'confirmedPasses':
                case 'adultPasses':
                case 'childPasses':
                case 'staffPasses':
                case 'tableNumber':
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

module.exports = CsvInvitationRepository;
