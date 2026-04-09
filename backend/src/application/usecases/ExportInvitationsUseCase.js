/**
 * Export Invitations Use Case
 * Caso de uso para exportar invitaciones
 */

class ExportInvitationsUseCase {
    constructor(invitationRepository, logger) {
        this.invitationRepository = invitationRepository;
        this.logger = logger;
    }

    async execute(format = 'json') {
        const endOperation = this.logger.startOperation('exportInvitations', { format });

        try {
            const result = await this.invitationRepository.exportAll();

            endOperation({
                exported: result.count,
                format
            });

            return {
                success: true,
                data: result.data,
                count: result.count,
                format,
                message: `${result.count} invitaciones exportadas`
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error exporting invitations', {
                format,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error exportando invitaciones'
            };
        }
    }
}

module.exports = ExportInvitationsUseCase;
