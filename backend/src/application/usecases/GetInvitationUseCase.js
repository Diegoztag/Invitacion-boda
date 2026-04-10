const NotFoundException = require('../../shared/exceptions/NotFoundException');
const BusinessRuleException = require('../../shared/exceptions/BusinessRuleException');

/**
 * Get Invitation Use Case
 * Caso de uso para obtener invitaciones
 */

class GetInvitationUseCase {
    constructor(invitationRepository, cacheService, logger) {
        this.invitationRepository = invitationRepository;
        this.cacheService = cacheService;
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
            const cacheKey = `invitation_${code}`;
            const cachedInvitation = this.cacheService ? this.cacheService.get(cacheKey) : null;

            if (cachedInvitation) {
                this.logger.debug(`Retrieved invitation ${code} from cache`);
                endOperation({ success: true, cached: true });
                return { invitation: cachedInvitation };
            }

            const invitation = await this._findAndValidateInvitation(code);
            const invitationObj = invitation.toObject();

            if (this.cacheService) {
                this.cacheService.set(cacheKey, invitationObj, 300); // 5 minutos
            }

            endOperation({ success: true, cached: false });
            return { invitation: invitationObj };
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
