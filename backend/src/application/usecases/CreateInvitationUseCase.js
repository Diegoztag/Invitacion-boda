/**
 * Create Invitation Use Case
 * Caso de uso para crear una nueva invitación
 * Sigue principios Clean Architecture y SOLID
 */

const Invitation = require('../../core/entities/Invitation');

class CreateInvitationUseCase {
    constructor(invitationRepository, validationService, logger) {
        this.invitationRepository = invitationRepository;
        this.validationService = validationService;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso para crear una invitación
     * @param {Object} invitationData - Datos de la invitación
     * @returns {Promise<Object>} Resultado de la operación
     */
    async execute(invitationData) {
        try {
            // Preparar invitación (validar y crear entidad)
            const invitation = await this.prepareInvitation(invitationData);

            // Guardar en el repositorio
            const savedInvitation = await this.invitationRepository.save(invitation);

            // Log de éxito
            this.logger.info('Invitation created successfully', {
                code: savedInvitation.code,
                guestNames: savedInvitation.getGuestNamesString(),
                numberOfPasses: savedInvitation.numberOfPasses
            });

            return {
                success: true,
                invitation: savedInvitation.toObject(),
                message: 'Invitación creada exitosamente'
            };

        } catch (error) {
            // Log de error
            this.logger.error('Error creating invitation', {
                error: error.message,
                invitationData
            });

            return {
                success: false,
                error: error.message,
                message: 'Error al crear la invitación'
            };
        }
    }

    /**
     * Prepara una invitación para ser guardada (valida y crea entidad)
     * @param {Object} invitationData
     * @returns {Promise<Invitation>} Entidad de invitación lista para guardar
     * @private
     */
    async prepareInvitation(invitationData) {
        // Validar datos de entrada
        this.validateInput(invitationData);

        // Normalizar datos
        const normalizedData = this.normalizeData(invitationData);

        // Validar reglas de negocio
        await this.validateBusinessRules(normalizedData);

        // Crear entidad de invitación
        return new Invitation(normalizedData);
    }

    /**
     * Valida los datos de entrada
     * @param {Object} invitationData
     * @private
     */
    validateInput(invitationData) {
        if (!invitationData) {
            throw new Error('Los datos de la invitación son requeridos');
        }

        const { guestNames, numberOfPasses } = invitationData;

        // Validar nombres de invitados
        if (!guestNames || (Array.isArray(guestNames) && guestNames.length === 0)) {
            throw new Error('Los nombres de los invitados son requeridos');
        }

        if (Array.isArray(guestNames)) {
            const invalidNames = guestNames.filter(name => 
                !name || typeof name !== 'string' || name.trim().length === 0
            );
            if (invalidNames.length > 0) {
                throw new Error('Todos los nombres de invitados deben ser strings válidos');
            }
        } else if (typeof guestNames !== 'string' || guestNames.trim().length === 0) {
            throw new Error('Los nombres de invitados deben ser un string válido');
        }

        // Validar número de pases
        if (!numberOfPasses || !Number.isInteger(numberOfPasses) || numberOfPasses <= 0) {
            throw new Error('El número de pases debe ser un entero positivo');
        }

        if (numberOfPasses > 20) {
            throw new Error('El número máximo de pases por invitación es 20');
        }

        // Validar teléfono si se proporciona
        if (invitationData.phone && !this.validationService.validatePhone(invitationData.phone)) {
            throw new Error('El formato del teléfono no es válido');
        }

        // Validar número de mesa si se proporciona
        if (invitationData.tableNumber !== undefined && invitationData.tableNumber !== null) {
            if (!Number.isInteger(invitationData.tableNumber) || invitationData.tableNumber <= 0) {
                throw new Error('El número de mesa debe ser un entero positivo');
            }
        }
    }

    /**
     * Normaliza los datos de entrada
     * @param {Object} invitationData
     * @returns {Object}
     * @private
     */
    normalizeData(invitationData) {
        const normalized = { ...invitationData };

        // Normalizar nombres de invitados
        if (Array.isArray(normalized.guestNames)) {
            normalized.guestNames = normalized.guestNames.map(name => 
                this.validationService.sanitizeString(name.trim())
            );
        } else {
            // Si es un string, dividir por "y" y limpiar
            normalized.guestNames = normalized.guestNames
                .split(/\s+y\s+/i)
                .map(name => this.validationService.sanitizeString(name.trim()))
                .filter(name => name.length > 0);
        }

        // Normalizar teléfono
        if (normalized.phone) {
            normalized.phone = this.validationService.sanitizePhone(normalized.phone);
        }

        // Establecer valores por defecto para pases específicos
        if (!normalized.adultPasses && !normalized.childPasses && !normalized.staffPasses) {
            normalized.adultPasses = normalized.numberOfPasses;
            normalized.childPasses = 0;
            normalized.staffPasses = 0;
        }

        // Validar que la suma de pases específicos coincida con el total
        const totalSpecificPasses = (normalized.adultPasses || 0) + 
                                   (normalized.childPasses || 0) + 
                                   (normalized.staffPasses || 0);
        
        if (totalSpecificPasses !== normalized.numberOfPasses) {
            throw new Error(`La suma de pases específicos (${totalSpecificPasses}) debe coincidir con el total (${normalized.numberOfPasses})`);
        }

        return normalized;
    }

    /**
     * Valida las reglas de negocio
     * @param {Object} normalizedData
     * @private
     */
    async validateBusinessRules(normalizedData) {
        // Verificar si ya existe una invitación con los mismos nombres
        const existingInvitations = await this.invitationRepository.findByGuestName(
            normalizedData.guestNames[0]
        );

        const duplicateInvitation = existingInvitations.find(invitation => {
            const existingNames = invitation.guestNames.map(name => name.toLowerCase());
            const newNames = normalizedData.guestNames.map(name => name.toLowerCase());
            
            return existingNames.length === newNames.length &&
                   existingNames.every(name => newNames.includes(name));
        });

        if (duplicateInvitation && duplicateInvitation.isActive()) {
            throw new Error(`Ya existe una invitación activa para: ${normalizedData.guestNames.join(' y ')}`);
        }

        // Verificar si el teléfono ya está en uso (si se proporciona)
        if (normalizedData.phone) {
            const existingByPhone = await this.invitationRepository.findByPhone(normalizedData.phone);
            const activeByPhone = existingByPhone.filter(inv => inv.isActive());
            
            if (activeByPhone.length > 0) {
                this.logger.warn('Phone number already in use', {
                    phone: normalizedData.phone,
                    existingInvitations: activeByPhone.map(inv => inv.code)
                });
                // No lanzar error, solo advertir
            }
        }

        // Verificar límites de mesa si se especifica
        if (normalizedData.tableNumber) {
            const tableInvitations = await this.invitationRepository.findByTable(normalizedData.tableNumber);
            const activeTableInvitations = tableInvitations.filter(inv => inv.isActive());
            const totalPassesInTable = activeTableInvitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0);
            
            const maxPassesPerTable = 10; // Configurable
            if (totalPassesInTable + normalizedData.numberOfPasses > maxPassesPerTable) {
                throw new Error(`La mesa ${normalizedData.tableNumber} no tiene suficiente espacio. Capacidad restante: ${maxPassesPerTable - totalPassesInTable} pases`);
            }
        }
    }

    /**
     * Crea múltiples invitaciones en lote
     * @param {Array<Object>} invitationsData - Array de datos de invitaciones
     * @returns {Promise<Object>} Resultado de la operación en lote
     */
    async executeBatch(invitationsData) {
        if (!Array.isArray(invitationsData) || invitationsData.length === 0) {
            throw new Error('Se requiere un array no vacío de datos de invitaciones');
        }

        const results = {
            success: [],
            errors: [],
            total: invitationsData.length
        };

        const preparedInvitations = [];
        const preparedIndices = []; // Para mapear de vuelta al índice original

        // Fase 1: Preparación y Validación Individual
        for (let i = 0; i < invitationsData.length; i++) {
            try {
                const invitation = await this.prepareInvitation(invitationsData[i]);
                preparedInvitations.push(invitation);
                preparedIndices.push(i);
            } catch (error) {
                results.errors.push({
                    index: i,
                    error: error.message,
                    data: invitationsData[i]
                });
            }
        }

        // Fase 2: Persistencia en Lote (Atómica)
        if (preparedInvitations.length > 0) {
            try {
                // Usar saveBatch si existe en el repositorio, sino fallback a iteración (para compatibilidad)
                if (typeof this.invitationRepository.saveBatch === 'function') {
                    const savedInvitations = await this.invitationRepository.saveBatch(preparedInvitations);
                    
                    // Mapear resultados exitosos
                    savedInvitations.forEach((inv, idx) => {
                        const originalIndex = preparedIndices[idx];
                        results.success.push({
                            index: originalIndex,
                            invitation: inv.toObject()
                        });
                    });
                } else {
                    // Fallback legacy (no debería ocurrir con el nuevo repo)
                    this.logger.warn('Repository does not support saveBatch, falling back to sequential save');
                    for (let i = 0; i < preparedInvitations.length; i++) {
                        try {
                            const savedInv = await this.invitationRepository.save(preparedInvitations[i]);
                            results.success.push({
                                index: preparedIndices[i],
                                invitation: savedInv.toObject()
                            });
                        } catch (err) {
                            results.errors.push({
                                index: preparedIndices[i],
                                error: err.message,
                                data: invitationsData[preparedIndices[i]]
                            });
                        }
                    }
                }
            } catch (error) {
                // Si falla el batch save completo
                this.logger.error('Batch save failed', { error: error.message });
                
                preparedIndices.forEach((originalIndex) => {
                    results.errors.push({
                        index: originalIndex,
                        error: `Error al guardar lote: ${error.message}`,
                        data: invitationsData[originalIndex]
                    });
                });
            }
        }

        this.logger.info('Batch invitation creation completed', {
            total: results.total,
            successful: results.success.length,
            failed: results.errors.length
        });

        return results;
    }
}

module.exports = CreateInvitationUseCase;
