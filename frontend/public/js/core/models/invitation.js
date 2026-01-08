/**
 * Modelo de dominio para Invitación
 * Representa una invitación de boda con toda su información y comportamientos
 */

export class Invitation {
    constructor(data = {}) {
        this.code = data.code || '';
        this.guestNames = Array.isArray(data.guestNames) ? data.guestNames : [];
        this.numberOfPasses = data.numberOfPasses || 0;
        this.confirmed = data.confirmed || false;
        this.phone = data.phone || '';
        this.email = data.email || '';
        this.dietaryRestrictions = data.dietaryRestrictions || '';
        this.attendance = data.attendance || null; // 'yes', 'no', null
        this.guestCount = data.guestCount || 0;
        this.confirmedAt = data.confirmedAt ? new Date(data.confirmedAt) : null;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;
        this.notes = data.notes || '';
        this.isActive = data.isActive !== undefined ? data.isActive : true;
    }
    
    /**
     * Verifica si la invitación es válida
     * @returns {boolean}
     */
    isValid() {
        return !!(
            this.code && 
            this.guestNames.length > 0 && 
            this.numberOfPasses > 0 &&
            this.isActive
        );
    }
    
    /**
     * Obtiene el nombre para mostrar de los invitados
     * @returns {string}
     */
    getDisplayName() {
        if (this.guestNames.length === 0) {
            return 'Invitado';
        }
        
        if (this.guestNames.length === 1) {
            return this.guestNames[0];
        }
        
        if (this.guestNames.length === 2) {
            return this.guestNames.join(' y ');
        }
        
        // Para más de 2 nombres, mostrar el primero + "y acompañantes"
        return `${this.guestNames[0]} y acompañantes`;
    }
    
    /**
     * Obtiene el nombre completo de todos los invitados
     * @returns {string}
     */
    getFullGuestNames() {
        return this.guestNames.join(', ');
    }
    
    /**
     * Verifica si la invitación está confirmada
     * @returns {boolean}
     */
    isConfirmed() {
        return this.confirmed && this.attendance === 'yes';
    }
    
    /**
     * Verifica si la invitación fue rechazada
     * @returns {boolean}
     */
    isDeclined() {
        return this.confirmed && this.attendance === 'no';
    }
    
    /**
     * Verifica si la invitación está pendiente de respuesta
     * @returns {boolean}
     */
    isPending() {
        return !this.confirmed;
    }
    
    /**
     * Obtiene el estado de la invitación
     * @returns {string} 'confirmed', 'declined', 'pending'
     */
    getStatus() {
        if (this.isConfirmed()) return 'confirmed';
        if (this.isDeclined()) return 'declined';
        return 'pending';
    }
    
    /**
     * Obtiene el texto del estado para mostrar
     * @returns {string}
     */
    getStatusText() {
        switch (this.getStatus()) {
            case 'confirmed':
                return 'Confirmada';
            case 'declined':
                return 'No asistirá';
            case 'pending':
                return 'Pendiente';
            default:
                return 'Desconocido';
        }
    }
    
    /**
     * Verifica si puede confirmar asistencia
     * @returns {boolean}
     */
    canConfirm() {
        return this.isValid() && this.isActive && !this.confirmed;
    }
    
    /**
     * Verifica si puede modificar la confirmación
     * @returns {boolean}
     */
    canModify() {
        return this.isValid() && this.isActive;
    }
    
    /**
     * Obtiene el número de pases disponibles
     * @returns {number}
     */
    getAvailablePasses() {
        return Math.max(0, this.numberOfPasses);
    }
    
    /**
     * Verifica si el número de invitados es válido
     * @param {number} guestCount - Número de invitados
     * @returns {boolean}
     */
    isValidGuestCount(guestCount) {
        return guestCount > 0 && guestCount <= this.numberOfPasses;
    }
    
    /**
     * Obtiene información de confirmación
     * @returns {Object|null}
     */
    getConfirmationInfo() {
        if (!this.confirmed) {
            return null;
        }
        
        return {
            attendance: this.attendance,
            guestCount: this.guestCount,
            phone: this.phone,
            email: this.email,
            dietaryRestrictions: this.dietaryRestrictions,
            confirmedAt: this.confirmedAt,
            notes: this.notes
        };
    }
    
    /**
     * Actualiza los datos de la invitación
     * @param {Object} data - Nuevos datos
     */
    update(data) {
        Object.keys(data).forEach(key => {
            if (this.hasOwnProperty(key)) {
                if (key === 'confirmedAt' || key === 'createdAt' || key === 'updatedAt') {
                    this[key] = data[key] ? new Date(data[key]) : null;
                } else {
                    this[key] = data[key];
                }
            }
        });
        
        this.updatedAt = new Date();
    }
    
    /**
     * Confirma la asistencia
     * @param {Object} confirmationData - Datos de confirmación
     */
    confirm(confirmationData) {
        this.attendance = confirmationData.attendance;
        this.guestCount = confirmationData.guestCount || 0;
        this.phone = confirmationData.phone || this.phone;
        this.email = confirmationData.email || this.email;
        this.dietaryRestrictions = confirmationData.dietaryRestrictions || '';
        this.notes = confirmationData.notes || '';
        this.confirmed = true;
        this.confirmedAt = new Date();
        this.updatedAt = new Date();
    }
    
    /**
     * Convierte la invitación a objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            code: this.code,
            guestNames: [...this.guestNames],
            numberOfPasses: this.numberOfPasses,
            confirmed: this.confirmed,
            phone: this.phone,
            email: this.email,
            dietaryRestrictions: this.dietaryRestrictions,
            attendance: this.attendance,
            guestCount: this.guestCount,
            confirmedAt: this.confirmedAt?.toISOString() || null,
            createdAt: this.createdAt?.toISOString() || null,
            updatedAt: this.updatedAt?.toISOString() || null,
            notes: this.notes,
            isActive: this.isActive
        };
    }
    
    /**
     * Crea una copia de la invitación
     * @returns {Invitation}
     */
    clone() {
        return new Invitation(this.toJSON());
    }
    
    /**
     * Compara con otra invitación
     * @param {Invitation} other - Otra invitación
     * @returns {boolean}
     */
    equals(other) {
        if (!(other instanceof Invitation)) {
            return false;
        }
        
        return this.code === other.code &&
               this.confirmed === other.confirmed &&
               this.attendance === other.attendance &&
               this.guestCount === other.guestCount;
    }
    
    /**
     * Valida los datos de confirmación
     * @param {Object} confirmationData - Datos a validar
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    validateConfirmationData(confirmationData) {
        const errors = [];
        
        if (!confirmationData.attendance) {
            errors.push('Debe seleccionar si asistirá o no');
        }
        
        if (confirmationData.attendance === 'yes') {
            if (!confirmationData.guestCount || confirmationData.guestCount < 1) {
                errors.push('Debe indicar el número de invitados');
            }
            
            if (confirmationData.guestCount > this.numberOfPasses) {
                errors.push(`El número de invitados no puede ser mayor a ${this.numberOfPasses}`);
            }
        }
        
        if (confirmationData.phone && !/^[\d\s\-\+\(\)]+$/.test(confirmationData.phone)) {
            errors.push('El formato del teléfono no es válido');
        }
        
        if (confirmationData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(confirmationData.email)) {
            errors.push('El formato del email no es válido');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
