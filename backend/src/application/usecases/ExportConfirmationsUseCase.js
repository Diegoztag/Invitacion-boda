/**
 * Export Confirmations Use Case
 * Caso de uso para exportar confirmaciones
 */

class ExportConfirmationsUseCase {
    constructor(confirmationRepository, logger) {
        this.confirmationRepository = confirmationRepository;
        this.logger = logger;
    }

    async execute(format = 'csv') {
        const endOperation = this.logger.startOperation('exportConfirmations', { format });

        try {
            if (!['csv', 'json'].includes(format)) {
                endOperation({ success: false, reason: 'invalid_format' });
                return {
                    success: false,
                    error: 'Formato de exportación no válido'
                };
            }

            const result = await this.confirmationRepository.exportAll(format);

            endOperation({ success: true, format, recordCount: result.count });

            return {
                success: true,
                data: result.data,
                count: result.count,
                format,
                message: `${result.count} confirmaciones exportadas en formato ${format}`
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error exporting confirmations', {
                format,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error exportando confirmaciones'
            };
        }
    }
}

module.exports = ExportConfirmationsUseCase;
