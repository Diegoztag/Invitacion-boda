/**
 * Confirmation Entity
 * Representa una confirmación de asistencia en el dominio de la aplicación
 * Sigue principios DDD (Domain Driven Design)
 */

class Confirmation {
    constructor({
        code,
        willAttend = false,
        attendingGuests = 0,
        attendingNames = [],
        phone = '',
        dietaryRestrictions = '',
        message = '',
        confirmedAt = null
    }) {
        this.validateConstructorParams({
            code,
            willAttend,
            attendingGuests,
            attendingNames,
            phone,
            dietaryRestrictions,
            message,
            confirmedAt
        });

        this._code = code;
        this._willAttend = willAttend;
        this._attendingGuests = attendingGuests;
        this._attendingNames = Array.isArray(attendingNames) ? [...attendingNames] : [];
        this._phone = phone;
        this._dietaryRestrictions = dietaryRestrictions;
        this._message = message;
        this._confirmedAt = confirmedAt || new Date().toISOString();
    }

    // Getters (inmutables desde el exterior)
    get code() { return this._code; }
    get willAttend() { return this._willAttend; }
    get attendingGuests() { return this._attendingGuests; }
    get attendingNames() { return [...this._attendingNames]; }
    get phone() { return this._phone; }
    get dietaryRestrictions() { return this._dietaryRestrictions; }
    get message() { return this._message; }
    get confirmedAt() { return this._confirmedAt; }

    // Métodos de dominio

    /**
     * Actualiza la confirmación de asistencia
     * @param {boolean} willAttend
     */
    updateAttendance(willAttend) {
        this._willAttend = willAttend;
        
        // Si no va a asistir, limpiar datos relacionados
        if (!willAttend) {
            this._attendingGuests = 0;
            this._attendingNames = [];
        }

        return this;
    }

    /**
     * Actualiza el número de invitados que asistirán
     * @param {number} attendingGuests
     */
    updateAttendingGuests(attendingGuests) {
        if (!Number.isInteger(attendingGuests) || attendingGuests < 0) {
            throw new Error('El número de invitados debe ser un entero no negativo');
        }

        if (!this._willAttend && attendingGuests > 0) {
            throw new Error('No se pueden tener invitados si no va a asistir');
        }

        this._attendingGuests = attendingGuests;

        // Ajustar nombres si es necesario
        if (this._attendingNames.length > attendingGuests) {
            this._attendingNames = this._attendingNames.slice(0, attendingGuests);
        }

        return this;
    }

    /**
     * Actualiza los nombres de los invitados que asistirán
     * @param {Array<string>} attendingNames
     */
    updateAttendingNames(attendingNames) {
        if (!Array.isArray(attendingNames)) {
            throw new Error('Los nombres de invitados deben ser un array');
        }

        const validNames = attendingNames.filter(name => 
            typeof name === 'string' && name.trim().length > 0
        );

        if (validNames.length > this._attendingGuests) {
            throw new Error(`No se pueden tener más nombres (${validNames.length}) que invitados confirmados (${this._attendingGuests})`);
        }

        this._attendingNames = validNames.map(name => name.trim());
        return this;
    }

    /**
     * Actualiza el teléfono de contacto
     * @param {string} phone
     */
    updatePhone(phone) {
        if (phone && typeof phone !== 'string') {
            throw new Error('El teléfono debe ser un string');
        }

        this._phone = phone || '';
        return this;
    }

    /**
     * Actualiza las restricciones dietarias
     * @param {string} dietaryRestrictions
     */
    updateDietaryRestrictions(dietaryRestrictions) {
        if (dietaryRestrictions && typeof dietaryRestrictions !== 'string') {
            throw new Error('Las restricciones dietarias deben ser un string');
        }

        this._dietaryRestrictions = dietaryRestrictions || '';
        return this;
    }

    /**
     * Actualiza el mensaje para los novios
     * @param {string} message
     */
    updateMessage(message) {
        if (message && typeof message !== 'string') {
            throw new Error('El mensaje debe ser un string');
        }

        this._message = message || '';
        return this;
    }

    /**
     * Verifica si la confirmación es positiva (va a asistir)
     * @returns {boolean}
     */
    isPositive() {
        return this._willAttend;
    }

    /**
     * Verifica si la confirmación es negativa (no va a asistir)
     * @returns {boolean}
     */
    isNegative() {
        return !this._willAttend;
    }

    /**
     * Verifica si tiene nombres de todos los invitados
     * @returns {boolean}
     */
    hasAllGuestNames() {
        return this._attendingNames.length === this._attendingGuests;
    }

    /**
     * Verifica si tiene restricciones dietarias
     * @returns {boolean}
     */
    hasDietaryRestrictions() {
        return this._dietaryRestrictions.trim().length > 0;
    }

    /**
     * Verifica si tiene mensaje para los novios
     * @returns {boolean}
     */
    hasMessage() {
        return this._message.trim().length > 0;
    }

    /**
     * Verifica si tiene teléfono de contacto
     * @returns {boolean}
     */
    hasPhone() {
        return this._phone.trim().length > 0;
    }

    /**
     * Obtiene los nombres faltantes
     * @returns {number}
     */
    getMissingNamesCount() {
        return Math.max(0, this._attendingGuests - this._attendingNames.length);
    }

    /**
     * Obtiene un resumen de la confirmación
     * @returns {string}
     */
    getSummary() {
        if (!this._willAttend) {
            return 'No asistirá';
        }

        const guestsText = this._attendingGuests === 1 ? 'invitado' : 'invitados';
        return `Asistirá con ${this._attendingGuests} ${guestsText}`;
    }

    /**
     * Convierte la entidad a objeto plano
     * @returns {Object}
     */
    toObject() {
        return {
            code: this._code,
            willAttend: this._willAttend,
            attendingGuests: this._attendingGuests,
            attendingNames: this.attendingNames,
            phone: this._phone,
            dietaryRestrictions: this._dietaryRestrictions,
            message: this._message,
            confirmedAt: this._confirmedAt
        };
    }

    /**
     * Crea una instancia desde un objeto plano
     * @param {Object} data
     * @returns {Confirmation}
     */
    static fromObject(data) {
        return new Confirmation(data);
    }

    /**
     * Crea una confirmación negativa
     * @param {string} code
     * @param {string} message
     * @returns {Confirmation}
     */
    static createNegative(code, message = '') {
        return new Confirmation({
            code,
            willAttend: false,
            attendingGuests: 0,
            attendingNames: [],
            message
        });
    }

    /**
     * Crea una confirmación positiva
     * @param {string} code
     * @param {number} attendingGuests
     * @param {Array<string>} attendingNames
     * @param {Object} additionalData
     * @returns {Confirmation}
     */
    static createPositive(code, attendingGuests, attendingNames = [], additionalData = {}) {
        return new Confirmation({
            code,
            willAttend: true,
            attendingGuests,
            attendingNames,
            ...additionalData
        });
    }

    /**
     * Valida los parámetros del constructor
     * @private
     */
    validateConstructorParams(params) {
        const { code, willAttend, attendingGuests, attendingNames, phone, dietaryRestrictions, message } = params;

        if (!code || typeof code !== 'string') {
            throw new Error('El código de invitación es requerido y debe ser un string');
        }

        if (typeof willAttend !== 'boolean') {
            throw new Error('willAttend debe ser un boolean');
        }

        if (!Number.isInteger(attendingGuests) || attendingGuests < 0) {
            throw new Error('attendingGuests debe ser un entero no negativo');
        }

        if (attendingNames && !Array.isArray(attendingNames)) {
            throw new Error('attendingNames debe ser un array');
        }

        if (phone && typeof phone !== 'string') {
            throw new Error('phone debe ser un string');
        }

        if (dietaryRestrictions && typeof dietaryRestrictions !== 'string') {
            throw new Error('dietaryRestrictions debe ser un string');
        }

        if (message && typeof message !== 'string') {
            throw new Error('message debe ser un string');
        }

        // Validaciones de lógica de negocio
        if (!willAttend && attendingGuests > 0) {
            throw new Error('No se pueden tener invitados confirmados si no va a asistir');
        }

        if (attendingNames && attendingNames.length > attendingGuests) {
            throw new Error('No se pueden tener más nombres que invitados confirmados');
        }
    }

    /**
     * Clona la confirmación
     * @returns {Confirmation}
     */
    clone() {
        return new Confirmation(this.toObject());
    }

    /**
     * Compara dos confirmaciones
     * @param {Confirmation} other
     * @returns {boolean}
     */
    equals(other) {
        return other instanceof Confirmation && this._code === other._code;
    }

    /**
     * Representación string de la confirmación
     * @returns {string}
     */
    toString() {
        return `Confirmation(${this._code}, ${this.getSummary()})`;
    }
}

module.exports = Confirmation;
