/**
 * Create Invitation Use Case
 * Caso de uso para crear una nueva invitación
 * Sigue principios Clean Architecture y SOLID
 */

const Invitation = require('../../core/entities/Invitation');

class CreateInvitationUseCase {
    constructor(invitationRepository, validationService, config, logger) {
        this.invitationRepository = invitationRepository;
        this.validationService = validationService;
        this.config = config;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso para crear una invitación
     * @param {Object} invitationData - Datos de la invitación
     * @returns {Promise<Object>} Resultado de la operación
     */
    async execute(invitationData) {
        const endOperation = this.logger.startOperation('createInvitation', {
            guestNames: invitationData?.guestNames,
            numberOfPasses: invitationData?.numberOfPasses
        });

        try {
            const invitation = await this._prepareAndValidateInvitation(invitationData);
            const savedInvitation = await this._saveInvitation(invitation);

            endOperation({ success: true, code: savedInvitation.code });
            return this._buildSuccessResponse(savedInvitation);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            return this._handleError(error, invitationData);
        }
    }

    /**
     * Prepara y valida los datos de la invitación.
     * @param {Object} invitationData - Datos de la invitación.
     * @returns {Promise<Invitation>}
     * @private
     */
    async _prepareAndValidateInvitation(invitationData) {
        this.validateInput(invitationData);
        const normalizedData = this.normalizeData(invitationData);
        normalizedData.code = await this.generateUniqueCode();
        await this.validateBusinessRules(normalizedData);
        return new Invitation(normalizedData);
    }

    /**
     * Guarda la invitación en el repositorio.
     * @param {Invitation} invitation - La entidad de invitación.
     * @returns {Promise<Invitation>}
     * @private
     */
    async _saveInvitation(invitation) {
        return this.invitationRepository.save(invitation);
    }

    /**
     * Construye una respuesta de éxito.
     * @param {Invitation} savedInvitation - La invitación guardada.
     * @returns {Object}
     * @private
     */
    _buildSuccessResponse(savedInvitation) {
        this.logger.info('Invitation created successfully', {
            code: savedInvitation.code,
            guestNames: savedInvitation.getGuestNamesString(),
            numberOfPasses: savedInvitation.numberOfPasses
        });
        return {
            success: true,
            invitation: savedInvitation,
            message: 'Invitación creada exitosamente'
        };
    }

    /**
     * Valida los datos de entrada
     * @param {Object} invitationData
     * @private
     */
    validateInput(invitationData) {
        if (!invitationData) {
            throw new Error('Datos de invitación son requeridos');
        }

        // Usar ValidationService para las reglas básicas
        const validation = this.validationService.validateInvitationData(invitationData);
        if (!validation.isValid) {
            const err = new Error('Datos de invitación inválidos');
            err.details = validation.errors;
            throw err;
        }

        // Fusionar valores sanitizados en el objeto original para que normalizar trabaje con ellos
        Object.assign(invitationData, validation.sanitized);

        // Reglas adicionales que no cubre el servicio
        const maxPasses = this.config.guests.maxGuestsPerInvitation;
        if (invitationData.numberOfPasses > maxPasses) {
            throw new Error(`El número máximo de pases por invitación es ${maxPasses}`);
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
        const sanitize =
            this.validationService && typeof this.validationService.sanitizeString === 'function'
                ? this.validationService.sanitizeString.bind(this.validationService)
                : str => str;

        const guestNames = Array.isArray(normalized.guestNames)
            ? normalized.guestNames
            : String(normalized.guestNames)
                  .split(/\s+y\s+/i)
                  .filter(name => name.trim().length > 0);

        normalized.guestNames = guestNames.map(name => sanitize(name.trim()));

        // Normalizar teléfono
        if (
            normalized.phone &&
            this.validationService &&
            typeof this.validationService.sanitizePhone === 'function'
        ) {
            normalized.phone = this.validationService.sanitizePhone(normalized.phone);
        }

        // Establecer valores por defecto para pases específicos
        if (!normalized.adultPasses && !normalized.childPasses && !normalized.staffPasses) {
            normalized.adultPasses = normalized.numberOfPasses;
            normalized.childPasses = 0;
            normalized.staffPasses = 0;
        }

        // Validar que la suma de pases específicos coincida con el total
        const totalSpecificPasses =
            (normalized.adultPasses || 0) +
            (normalized.childPasses || 0) +
            (normalized.staffPasses || 0);

        if (totalSpecificPasses !== normalized.numberOfPasses) {
            throw new Error(
                `La suma de pases específicos (${totalSpecificPasses}) debe coincidir con el total (${normalized.numberOfPasses})`
            );
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
        if (typeof this.invitationRepository.findByGuestName === 'function') {
            // Buscar por cada nombre para mejorar la detección de duplicados
            for (const name of normalizedData.guestNames) {
                const existingInvitations = await this.invitationRepository.findByGuestName(name);

                const duplicateInvitation = existingInvitations.find(invitation => {
                    const existingNames = invitation.guestNames.map(n => n.toLowerCase().trim());
                    const newNames = normalizedData.guestNames.map(n => n.toLowerCase().trim());

                    // Considerar duplicado si hay una coincidencia exacta de todos los nombres
                    // o si un nombre individual ya tiene una invitación activa
                    const exactMatch =
                        existingNames.length === newNames.length &&
                        existingNames.every(n => newNames.includes(n));

                    const partialMatch = existingNames.some(n => newNames.includes(n));

                    return exactMatch || partialMatch;
                });

                if (duplicateInvitation && duplicateInvitation.isActive()) {
                    throw new Error(`Ya existe una invitación activa que incluye a: ${name}`);
                }
            }
        }

        // Verificar si el teléfono ya está en uso (si se proporciona)
        if (normalizedData.phone && typeof this.invitationRepository.findByPhone === 'function') {
            const existingByPhone = await this.invitationRepository.findByPhone(
                normalizedData.phone
            );
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
        if (
            normalizedData.tableNumber &&
            typeof this.invitationRepository.findByTable === 'function'
        ) {
            const tableInvitations = await this.invitationRepository.findByTable(
                normalizedData.tableNumber
            );
            const activeTableInvitations = tableInvitations.filter(inv => inv.isActive());
            const totalPassesInTable = activeTableInvitations.reduce(
                (sum, inv) => sum + inv.numberOfPasses,
                0
            );

            const maxPassesPerTable = this.config.tables.maxPassesPerTable;
            if (totalPassesInTable + normalizedData.numberOfPasses > maxPassesPerTable) {
                this.logger.error('Table capacity exceeded', {
                    tableNumber: normalizedData.tableNumber,
                    currentPasses: totalPassesInTable,
                    newPasses: normalizedData.numberOfPasses,
                    maxPasses: maxPassesPerTable,
                    existingInvitations: activeTableInvitations.map(inv => ({
                        code: inv.code,
                        passes: inv.numberOfPasses
                    }))
                });
                throw new Error(
                    `La mesa ${normalizedData.tableNumber} no tiene suficiente espacio. Capacidad restante: ${maxPassesPerTable - totalPassesInTable} pases. Ocupado: ${totalPassesInTable}`
                );
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
            return {
                success: false,
                error: 'No hay invitaciones para procesar'
            };
        }

        // Si el repositorio provee importBatch usamos ese camino
        if (typeof this.invitationRepository.importBatch === 'function') {
            try {
                const batchResult = await this.invitationRepository.importBatch(invitationsData);
                const message = `${batchResult.success.length} exitosas, ${batchResult.errors.length} fallidas`;
                return {
                    success: true,
                    result: batchResult,
                    message
                };
            } catch (error) {
                this.logger.error('Batch import failed', { error: error.message });
                return {
                    success: false,
                    error: 'Error procesando lote de invitaciones'
                };
            }
        }

        // Fallback manual (solo por compatibilidad)
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
                const invitation = await this._prepareAndValidateInvitation(invitationsData[i]);
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
                    const savedInvitations =
                        await this.invitationRepository.saveBatch(preparedInvitations);

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
                    this.logger.warn(
                        'Repository does not support saveBatch, falling back to sequential save'
                    );
                    for (let i = 0; i < preparedInvitations.length; i++) {
                        try {
                            const savedInv = await this.invitationRepository.save(
                                preparedInvitations[i]
                            );
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

                preparedIndices.forEach(originalIndex => {
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

    /**
     * Genera un código único utilizando el servicio de validación.
     * Reintenta según la configuración antes de fallar.
     * @returns {Promise<string>}
     */
    async generateUniqueCode() {
        const maxAttempts = this.config.validation.app.generationMaxAttempts;
        let attempt = 0;
        while (attempt < maxAttempts) {
            try {
                const code = this.validationService.generateInvitationCode();
                const existing = await this.invitationRepository.findByCode(code);
                if (!existing) {
                    return code;
                }
                attempt++;
            } catch (err) {
                this.logger.error('Code generation error', { error: err.message });
                // mapear a mensaje en español para consumo de usecase
                throw new Error('Error generando código de invitación');
            }
        }
        throw new Error(`No se pudo generar un código único después de ${maxAttempts} intentos`);
    }

    /**
     * Maneja los errores durante la creación.
     * @param {Error} error - El error.
     * @param {Object} invitationData - Los datos originales.
     * @returns {Object}
     * @private
     */
    _handleError(error, invitationData) {
        this.logger.error('Error creating invitation', {
            error: error.message,
            stack: error.stack,
            invitationData
        });

        const result = {
            success: false,
            error: error.message || 'Error creando invitación',
            message: 'Error al crear la invitación'
        };

        if (error.details) {
            result.details = error.details;
        }

        return result;
    }
}

module.exports = CreateInvitationUseCase;
