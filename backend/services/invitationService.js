const csvStorage = require('./csvStorage');

class InvitationService {
    // Crear una nueva invitación
    async createInvitation(guestData) {
        return await csvStorage.saveInvitation(guestData);
    }

    // Obtener invitación por código
    async getInvitationByCode(code) {
        if (!code) {
            throw new Error('Código de invitación requerido');
        }

        const invitation = await csvStorage.getInvitationByCode(code);
        
        if (!invitation) {
            throw new Error('Invitación no encontrada');
        }

        return invitation;
    }

    // Confirmar asistencia
    async confirmAttendance(code, confirmationData) {
        const invitation = await this.getInvitationByCode(code);
        
        if (invitation.confirmed) {
            throw new Error('Esta invitación ya ha sido confirmada');
        }

        // Validar número de pases confirmados
        if (confirmationData.attendingGuests > invitation.numberOfPasses) {
            throw new Error(`Solo tienes ${invitation.numberOfPasses} pases disponibles`);
        }

        return await csvStorage.updateInvitationConfirmation(code, confirmationData);
    }

    // Obtener estadísticas de confirmaciones
    async getConfirmationStats() {
        return await csvStorage.getStats();
    }

    // Obtener todas las invitaciones
    async getAllInvitations() {
        const invitations = await csvStorage.getAllInvitations();
        
        // Add confirmation details for confirmed invitations
        const confirmations = await csvStorage.getAllConfirmations();
        
        return invitations.map(inv => {
            if (inv.confirmed) {
                const confirmation = confirmations.find(c => c.code === inv.code);
                if (confirmation) {
                    inv.confirmationDetails = confirmation;
                }
            }
            return inv;
        });
    }

    // Generar URL de invitación
    generateInvitationUrl(code, baseUrl = '') {
        return `${baseUrl}/?invitation=${code}`;
    }

}

module.exports = new InvitationService();
