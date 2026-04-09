/**
 * Get Invitation Stats Use Case
 * Caso de uso para obtener estadísticas de invitaciones
 */

class GetInvitationStatsUseCase {
    constructor(invitationRepository, logger) {
        this.invitationRepository = invitationRepository;
        this.logger = logger;
    }

    async execute() {
        const endOperation = this.logger.startOperation('getInvitationStats');

        try {
            // Obtener estadísticas unificadas desde invitaciones
            const invitationStats = await this.invitationRepository.getStats();

            // Calcular tasas de confirmación y asistencia
            const confirmationRate =
                invitationStats.active > 0
                    ? ((invitationStats.confirmed / invitationStats.active) * 100).toFixed(2)
                    : '0.00';

            const attendanceRate =
                invitationStats.totalIssuedPasses > 0
                    ? (
                          (invitationStats.confirmedPasses / invitationStats.totalIssuedPasses) *
                          100
                      ).toFixed(2)
                    : '0.00';

            const stats = {
                invitations: {
                    total: invitationStats.total,
                    confirmed: invitationStats.confirmed,
                    pending: invitationStats.pending,
                    cancelled: invitationStats.cancelled,
                    partial: invitationStats.partial,
                    active: invitationStats.active,
                    inactive: invitationStats.inactive,
                    totalPasses: invitationStats.totalIssuedPasses,
                    occupiedPasses: invitationStats.occupiedPasses,
                    cancelledPasses: invitationStats.totalLiberatedPasses
                },
                confirmations: {
                    total: invitationStats.confirmed,
                    positive: invitationStats.confirmed,
                    negative: invitationStats.cancelled,
                    totalConfirmedGuests: invitationStats.confirmedPasses,
                    pendingPasses: invitationStats.pendingPasses,
                    averageGuestsPerConfirmation:
                        invitationStats.confirmed > 0
                            ? (invitationStats.confirmedPasses / invitationStats.confirmed).toFixed(
                                  2
                              )
                            : '0.00'
                },
                passDistribution: {
                    // Desglose de pases activos
                    activeAdultPasses: invitationStats.activeAdultPasses || 0,
                    activeChildPasses: invitationStats.activeChildPasses || 0,
                    activeStaffPasses: invitationStats.activeStaffPasses || 0,
                    totalActivePasses: invitationStats.totalActivePasses || 0,

                    // Porcentajes de distribución
                    distributionPercentages: invitationStats.distributionPercentages || {
                        adults: 0,
                        children: 0,
                        staff: 0
                    },

                    // Desglose de pases confirmados
                    confirmedAdultPasses: invitationStats.confirmedAdultPasses || 0,
                    confirmedChildPasses: invitationStats.confirmedChildPasses || 0,
                    confirmedStaffPasses: invitationStats.confirmedStaffPasses || 0,
                    totalConfirmedPasses: invitationStats.totalConfirmedPasses || 0
                },
                rates: {
                    confirmationRate,
                    attendanceRate
                }
            };

            endOperation({ success: true });

            return {
                success: true,
                stats,
                message: 'Estadísticas obtenidas exitosamente'
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error getting invitation stats', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo estadísticas'
            };
        }
    }
}

module.exports = GetInvitationStatsUseCase;
