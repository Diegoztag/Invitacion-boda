const NotFoundException = require('../../shared/exceptions/NotFoundException');
const BusinessRuleException = require('../../shared/exceptions/BusinessRuleException');

/**
 * Get Invitation Use Case
 * Caso de uso para obtener invitaciones
 */

class GetInvitationUseCase {
    constructor(invitationRepository, logger) {
        this.invitationRepository = invitationRepository;
        this.logger = logger;
    }

    /**
     * Obtiene una invitación por código
     * @param {string} code - Código de la invitación
     * @returns {Object} Resultado de la operación
     */
    async execute(code) {
        const endOperation = this.logger.startOperation('getInvitation', { code });

        try {
            const invitation = await this._findAndValidateInvitation(code);
            endOperation({ success: true });
            return { invitation: invitation.toObject() };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this._handleError(error, { code });
            throw error; // Re-lanzar para que la capa superior maneje
        }
    }

    /**
     * Busca y valida la invitación por código.
     * @param {string} code - Código de la invitación.
     * @returns {Promise<Invitation>}
     * @private
     */
    async _findAndValidateInvitation(code) {
        if (!code || typeof code !== 'string') {
            throw new BusinessRuleException('Código de invitación es requerido');
        }

        const invitation = await this.invitationRepository.findByCode(code);

        if (!invitation) {
            throw new NotFoundException('Invitación', code);
        }

        if (!invitation.isActive()) {
            throw new BusinessRuleException('La invitación no está activa o ha sido cancelada.');
        }

        return invitation;
    }

    /**
     * Maneja los errores de forma centralizada.
     * @param {Error} error - El error.
     * @param {Object} context - Contexto adicional del error.
     * @private
     */
    _handleError(error, context) {
        this.logger.error('Error en GetInvitationUseCase', {
            ...context,
            error: error.message,
            stack: error.stack
        });
    }
}

module.exports = GetInvitationUseCase;
