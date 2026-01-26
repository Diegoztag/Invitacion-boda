/**
 * Invitation Entity
 * Representa una invitación en el dominio de la aplicación
 * Sigue principios DDD (Domain Driven Design)
 */

const { v4: uuidv4 } = require('crypto');

class Invitation {
    constructor({
        code = null,
        guestNames = [],
        numberOfPasses = 0,
        phone = '',
        createdAt = null,
        confirmedPasses = 0,
        confirmationDate = null,
        adultPasses = 0,
        childPasses = 0,
        staffPasses = 0,
        tableNumber = null,
        status = 'pending',
        cancelledAt = null,
        cancelledBy = null,
        cancellationReason = null,
        attendingNames = [],
        dietaryRestrictionsNames = '',
        dietaryRestrictionsDetails = '',
        generalMessage = ''
    }) {
        this.validateConstructorParams({
            code,
            guestNames,
            numberOfPasses,
            phone,
            createdAt,
            confirmedPasses,
            confirmationDate,
            adultPasses,
            childPasses,
            staffPasses,
            tableNumber,
            status,
            cancelledAt,
            cancelledBy,
            cancellationReason
        });

        this._code = code || this.generateCode();
        this._guestNames = Array.isArray(guestNames) ? [...guestNames] : [guestNames].filter(Boolean);
        this._numberOfPasses = numberOfPasses;
        this._phone = phone;
        this._createdAt = createdAt || new Date().toISOString();
        this._confirmedPasses = confirmedPasses;
        this._confirmationDate = confirmationDate;
        // Corregido: Respetar exactamente los valores del CSV, incluso si son 0
        this._adultPasses = adultPasses !== undefined ? adultPasses : numberOfPasses;
        this._childPasses = childPasses || 0;
        this._staffPasses = staffPasses || 0;
        this._tableNumber = tableNumber;
        this._status = status;
        this._cancelledAt = cancelledAt;
        this._cancelledBy = cancelledBy;
        this._cancellationReason = cancellationReason;
        this._attendingNames = Array.isArray(attendingNames) ? [...attendingNames] : [attendingNames].filter(Boolean);
        this._dietaryRestrictionsNames = dietaryRestrictionsNames;
        this._dietaryRestrictionsDetails = dietaryRestrictionsDetails;
        this._generalMessage = generalMessage;

        // Validar consistencia de datos sin modificar automáticamente
        this.validatePassesConsistency();
    }

    // Getters (inmutables desde el exterior)
    get code() { return this._code; }
    get guestNames() { return [...this._guestNames]; }
    get numberOfPasses() { return this._numberOfPasses; }
    get phone() { return this._phone; }
    get createdAt() { return this._createdAt; }
    get confirmedPasses() { return this._confirmedPasses; }
    get confirmationDate() { return this._confirmationDate; }
    get adultPasses() { return this._adultPasses; }
    get childPasses() { return this._childPasses; }
    get staffPasses() { return this._staffPasses; }
    get tableNumber() { return this._tableNumber; }
    get status() { return this._status; }
    get cancelledAt() { return this._cancelledAt; }
    get cancelledBy() { return this._cancelledBy; }
    get cancellationReason() { return this._cancellationReason; }
    get attendingNames() { return [...this._attendingNames]; }
    get dietaryRestrictionsNames() { return this._dietaryRestrictionsNames; }
    get dietaryRestrictionsDetails() { return this._dietaryRestrictionsDetails; }
    get generalMessage() { return this._generalMessage; }

    // Métodos de dominio

    /**
     * Actualiza los datos de la invitación
     * @param {Object} data - Datos a actualizar
     */
    update(data) {
        if (data.guestNames) {
            this._guestNames = Array.isArray(data.guestNames) ? [...data.guestNames] : [data.guestNames].filter(Boolean);
        }
        
        if (data.numberOfPasses !== undefined) {
            this._numberOfPasses = data.numberOfPasses;
        }
        
        if (data.phone !== undefined) {
            this._phone = data.phone;
        }
        
        if (data.tableNumber !== undefined) {
            this._tableNumber = data.tableNumber;
        }
        
        if (data.adultPasses !== undefined) this._adultPasses = data.adultPasses;
        if (data.childPasses !== undefined) this._childPasses = data.childPasses;
        if (data.staffPasses !== undefined) this._staffPasses = data.staffPasses;
        
        // Actualizar campos de confirmación y mensaje
        if (data.generalMessage !== undefined) {
            this._generalMessage = data.generalMessage;
        }

        if (data.dietaryRestrictionsNames !== undefined) {
            this._dietaryRestrictionsNames = data.dietaryRestrictionsNames;
        }

        if (data.dietaryRestrictionsDetails !== undefined) {
            this._dietaryRestrictionsDetails = data.dietaryRestrictionsDetails;
        }

        if (data.attendingNames !== undefined) {
             this._attendingNames = Array.isArray(data.attendingNames) ? [...data.attendingNames] : [data.attendingNames].filter(Boolean);
        }
        
        if (data.confirmedPasses !== undefined) {
            this._confirmedPasses = data.confirmedPasses;
            
            // Si no se especifica status explícitamente, recalcularlo basado en confirmedPasses
            if (data.status === undefined && this._status !== 'inactive') {
                if (this._confirmedPasses === 0) {
                    // Si se confirman 0 pases explícitamente, podría ser cancelled o pending dependiendo del flujo
                    // Pero mantenemos la lógica existente por ahora
                    this._status = 'cancelled';
                } else if (this._confirmedPasses < this._numberOfPasses) {
                    this._status = 'partial';
                } else {
                    this._status = 'confirmed';
                }
            }
        }

        if (data.status !== undefined) {
            this._status = data.status;
        }

        // Validar consistencia después de actualizar
        this.validatePassesConsistency();
        
        return this;
    }

    /**
     * Genera un código único para la invitación
     * @returns {string}
     */
    generateCode() {
        return require('crypto').randomBytes(4).toString('hex');
    }

    /**
     * Confirma la asistencia
     * @param {Object} confirmationData - Datos de confirmación
     */
    confirm(confirmationData) {
        if (this.isConfirmed()) {
            throw new Error('Esta invitación ya ha sido confirmada');
        }

        if (this._status === 'inactive') {
            throw new Error('No se puede confirmar una invitación inactiva');
        }

        if (confirmationData.attendingGuests > this._numberOfPasses) {
            throw new Error(`Solo tienes ${this._numberOfPasses} pases disponibles`);
        }

        this._confirmedPasses = confirmationData.attendingGuests;
        this._confirmationDate = new Date().toISOString();
        
        // Actualizar estado basado en pases confirmados
        if (confirmationData.attendingGuests === 0) {
            this._status = 'cancelled';
        } else if (confirmationData.attendingGuests < this._numberOfPasses) {
            this._status = 'partial';
        } else {
            this._status = 'confirmed';
        }

        return this;
    }

    /**
     * Cancela la confirmación (vuelve a pending)
     */
    unconfirm() {
        this._status = 'pending';
        this._confirmedPasses = 0;
        this._confirmationDate = null;

        return this;
    }

    /**
     * Desactiva la invitación
     * @param {string} cancelledBy - Quien cancela la invitación
     * @param {string} reason - Razón de la cancelación
     */
    deactivate(cancelledBy = 'admin', reason = '') {
        if (this._status === 'inactive') {
            throw new Error('La invitación ya está inactiva');
        }

        this._status = 'inactive';
        this._cancelledAt = new Date().toISOString();
        this._cancelledBy = cancelledBy;
        this._cancellationReason = reason;

        return this;
    }

    /**
     * Reactiva la invitación
     */
    activate() {
        if (this._status !== 'inactive' && this._status !== 'cancelled') {
            // Si no está inactiva ni cancelada, ya se considera activa
            // No lanzamos error, solo retornamos
            return this;
        }

        this._cancelledAt = null;
        this._cancelledBy = null;
        this._cancellationReason = null;

        // Recalcular estado basado en confirmaciones existentes
        if (this._confirmedPasses > 0) {
            if (this._confirmedPasses < this._numberOfPasses) {
                this._status = 'partial';
            } else {
                this._status = 'confirmed';
            }
        } else {
            this._status = 'pending';
        }

        return this;
    }

    /**
     * Actualiza el número de mesa
     * @param {number} tableNumber
     */
    assignTable(tableNumber) {
        if (tableNumber !== null && (!Number.isInteger(tableNumber) || tableNumber <= 0)) {
            throw new Error('El número de mesa debe ser un entero positivo');
        }

        this._tableNumber = tableNumber;
        return this;
    }

    /**
     * Actualiza la información de pases
     * @param {Object} passesData
     */
    updatePasses({ adultPasses, childPasses, staffPasses }) {
        const totalPasses = (adultPasses || 0) + (childPasses || 0) + (staffPasses || 0);
        
        if (totalPasses !== this._numberOfPasses) {
            throw new Error(`La suma de pases (${totalPasses}) debe coincidir con el total (${this._numberOfPasses})`);
        }

        this._adultPasses = adultPasses || 0;
        this._childPasses = childPasses || 0;
        this._staffPasses = staffPasses || 0;

        return this;
    }

    /**
     * Verifica si la invitación está activa
     * @returns {boolean}
     */
    isActive() {
        // Una invitación está activa si no está inactiva ni cancelada
        // Esto permite confirmar invitaciones en estado 'pending', 'partial', 'confirmed' o vacío
        return this._status !== 'inactive' && this._status !== 'cancelled';
    }

    /**
     * Verifica si la invitación está confirmada
     * @returns {boolean}
     */
    isConfirmed() {
        return this._status === 'confirmed' || this._status === 'partial';
    }

    /**
     * Obtiene los pases pendientes de confirmar
     * @returns {number}
     */
    getPendingPasses() {
        return this._numberOfPasses - this._confirmedPasses;
    }

    /**
     * Verifica si todos los pases están confirmados
     * @returns {boolean}
     */
    isFullyConfirmed() {
        return this._status === 'confirmed' && this._confirmedPasses === this._numberOfPasses;
    }

    /**
     * Obtiene el nombre principal del invitado
     * @returns {string}
     */
    getPrimaryGuestName() {
        return this._guestNames[0] || 'Sin nombre';
    }

    /**
     * Obtiene todos los nombres como string
     * @returns {string}
     */
    getGuestNamesString() {
        return this._guestNames.join(' y ');
    }

    /**
     * Actualiza información de confirmación
     * @param {Object} confirmationData - Datos de confirmación
     */
    updateConfirmation(confirmationData) {
        const { attendingNames, dietaryRestrictionsNames, dietaryRestrictionsDetails, generalMessage } = confirmationData;
        
        if (attendingNames) {
            this._attendingNames = Array.isArray(attendingNames) ? [...attendingNames] : [attendingNames].filter(Boolean);
        }
        
        if (dietaryRestrictionsNames !== undefined) {
            this._dietaryRestrictionsNames = dietaryRestrictionsNames;
        }
        
        if (dietaryRestrictionsDetails !== undefined) {
            this._dietaryRestrictionsDetails = dietaryRestrictionsDetails;
        }
        
        if (generalMessage !== undefined) {
            this._generalMessage = generalMessage;
        }
        
        return this;
    }

    /**
     * Verifica si tiene restricciones alimentarias
     * @returns {boolean}
     */
    hasDietaryRestrictions() {
        return !!(this._dietaryRestrictionsNames || this._dietaryRestrictionsDetails);
    }

    /**
     * Obtiene información completa de restricciones alimentarias
     * @returns {Object}
     */
    getDietaryRestrictionsInfo() {
        return {
            hasRestrictions: this.hasDietaryRestrictions(),
            names: this._dietaryRestrictionsNames,
            details: this._dietaryRestrictionsDetails,
            summary: this.hasDietaryRestrictions() 
                ? `${this._dietaryRestrictionsNames}: ${this._dietaryRestrictionsDetails}`.trim()
                : 'Sin restricciones'
        };
    }

    /**
     * Obtiene los nombres de quienes asistirán como string
     * @returns {string}
     */
    getAttendingNamesString() {
        return this._attendingNames.length > 0 
            ? this._attendingNames.join(' y ') 
            : this.getGuestNamesString();
    }

    /**
     * Convierte la entidad a objeto plano
     * @returns {Object}
     */
    toObject() {
        return {
            code: this.code,
            guestNames: this.guestNames,
            numberOfPasses: this.numberOfPasses,
            phone: this.phone,
            createdAt: this.createdAt,
            confirmedPasses: this.confirmedPasses,
            confirmationDate: this.confirmationDate,
            adultPasses: this.adultPasses,
            childPasses: this.childPasses,
            staffPasses: this.staffPasses,
            tableNumber: this.tableNumber,
            status: this.status,
            cancelledAt: this.cancelledAt,
            cancelledBy: this.cancelledBy,
            cancellationReason: this.cancellationReason,
            attendingNames: this.attendingNames,
            dietaryRestrictionsNames: this.dietaryRestrictionsNames,
            dietaryRestrictionsDetails: this.dietaryRestrictionsDetails,
            generalMessage: this.generalMessage
        };
    }

    /**
     * Crea una instancia desde un objeto plano
     * @param {Object} data
     * @returns {Invitation}
     */
    static fromObject(data) {
        return new Invitation(data);
    }

    /**
     * Valida los parámetros del constructor
     * @private
     */
    validateConstructorParams(params) {
        const { guestNames, numberOfPasses, phone } = params;

        if (!Array.isArray(guestNames) && typeof guestNames !== 'string') {
            throw new Error('guestNames debe ser un array o string');
        }

        if (!Number.isInteger(numberOfPasses) || numberOfPasses <= 0) {
            throw new Error('numberOfPasses debe ser un entero positivo');
        }

        if (phone && typeof phone !== 'string') {
            throw new Error('phone debe ser un string');
        }
    }

    /**
     * Valida la consistencia de los pases
     * @private
     */
    validatePassesConsistency() {
        // CORREGIDO: Solo validar, NO modificar automáticamente los datos del CSV
        const totalCalculated = this._adultPasses + this._childPasses + this._staffPasses;
        
        // Solo validar que los pases confirmados no excedan el total
        if (this._confirmedPasses > this._numberOfPasses) {
            throw new Error('Los pases confirmados no pueden exceder el total de pases');
        }

        // Opcional: Log de advertencia si no coinciden, pero NO modificar
        if (totalCalculated !== this._numberOfPasses) {
            console.warn(`Advertencia: La suma de pases por tipo (${totalCalculated}) no coincide con el total (${this._numberOfPasses}) para invitación ${this._code}`);
        }
    }

    /**
     * Clona la invitación
     * @returns {Invitation}
     */
    clone() {
        return new Invitation(this.toObject());
    }

    /**
     * Compara dos invitaciones
     * @param {Invitation} other
     * @returns {boolean}
     */
    equals(other) {
        return other instanceof Invitation && this._code === other._code;
    }

    /**
     * Representación string de la invitación
     * @returns {string}
     */
    toString() {
        return `Invitation(${this._code}, ${this.getGuestNamesString()}, ${this._numberOfPasses} pases)`;
    }
}

module.exports = Invitation;
