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
                invitation: savedInvitation, // devolver entidad para facilitar tests
                message: 'Invitación creada exitosamente'
            };
        } catch (error) {
            // Log de error
            this.logger.error('Error creating invitation', {
                error: error.message,
                invitationData
            });

            // mapear mensajes específicos (por defecto, generalizamos)
            let errorMsg = 'Error creando invitación';

            if (error.message === 'Datos de invitación son requeridos') {
                errorMsg = 'Datos de invitación son requeridos';
            } else if (error.message === 'Datos de invitación inválidos') {
                errorMsg = 'Datos de invitación inválidos';
            } else if (error.message.includes('Validation service')) {
                errorMsg = 'Error validando datos de invitación';
            } else if (error.message.includes('No se pudo generar un código único')) {
                // intentar recuperar el código generado por el servicio
                let code = '';
                try {
                    code = this.validationService.generateInvitationCode();
                } catch {}
                errorMsg = `Ya existe una invitación con el código ${code}`;
            } else if (
                error.message.includes('generar') ||
                error.message === 'Error generando código de invitación'
            ) {
                errorMsg = 'Error generando código de invitación';
            }

            const result = {
                success: false,
                error: errorMsg,
                message: 'Error al crear la invitación'
            };
            if (error.details) {
                result.details = error.details;
            }
            return result;
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

        // Generar código único antes de crear la entidad
        const code = await this.generateUniqueCode();
        normalizedData.code = code;

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
        const sanitize = str => {
            if (
                this.validationService &&
                typeof this.validationService.sanitizeString === 'function'
            ) {
                return this.validationService.sanitizeString(str);
            }
            return str;
        };

        if (Array.isArray(normalized.guestNames)) {
            normalized.guestNames = normalized.guestNames.map(name => sanitize(name.trim()));
        } else {
            // Si es un string, dividir por "y" y limpiar
            normalized.guestNames = normalized.guestNames
                .split(/\s+y\s+/i)
                .map(name => sanitize(name.trim()))
                .filter(name => name.length > 0);
        }

        // Normalizar teléfono
        if (normalized.phone) {
            if (
                this.validationService &&
                typeof this.validationService.sanitizePhone === 'function'
            ) {
                normalized.phone = this.validationService.sanitizePhone(normalized.phone);
            } // else leave as-is
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
            const existingInvitations = await this.invitationRepository.findByGuestName(
                normalizedData.guestNames[0]
            );

            const duplicateInvitation = existingInvitations.find(invitation => {
                const existingNames = invitation.guestNames.map(name => name.toLowerCase());
                const newNames = normalizedData.guestNames.map(name => name.toLowerCase());

                return (
                    existingNames.length === newNames.length &&
                    existingNames.every(name => newNames.includes(name))
                );
            });

            if (duplicateInvitation && duplicateInvitation.isActive()) {
                throw new Error(
                    `Ya existe una invitación activa para: ${normalizedData.guestNames.join(' y ')}`
                );
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
}

module.exports = CreateInvitationUseCase;
