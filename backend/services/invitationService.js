const crypto = require('crypto');
const googleSheetsService = require('./googleSheets');

class InvitationService {
    constructor() {
        this.initialized = false;
    }

    // Generar código único para cada invitación
    generateInvitationCode() {
        return crypto.randomBytes(8).toString('hex');
    }

    // Crear una nueva invitación
    async createInvitation(guestData) {
        const invitationCode = this.generateInvitationCode();
        const invitation = {
            code: invitationCode,
            guestNames: guestData.guestNames, // Array de nombres
            numberOfPasses: guestData.numberOfPasses,
            email: guestData.email || '',
            phone: guestData.phone || '',
            createdAt: new Date().toISOString(),
            confirmed: false,
            confirmedPasses: 0,
            confirmationDetails: null
        };

        // Guardar en Google Sheets
        await googleSheetsService.saveInvitation(invitation);
        
        return invitation;
    }

    // Obtener invitación por código
    async getInvitationByCode(code) {
        if (!code) {
            throw new Error('Código de invitación requerido');
        }

        const invitations = await googleSheetsService.getAllInvitations();
        const invitation = invitations.find(inv => inv.code === code);
        
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

        const updatedInvitation = {
            ...invitation,
            confirmed: true,
            confirmedPasses: confirmationData.attendingGuests,
            confirmationDetails: {
                willAttend: confirmationData.willAttend,
                attendingGuests: confirmationData.attendingGuests,
                attendingNames: confirmationData.attendingNames || [],
                email: confirmationData.email || invitation.email,
                phone: confirmationData.phone || invitation.phone,
                dietaryRestrictions: confirmationData.dietaryRestrictions || '',
                message: confirmationData.message || '',
                confirmedAt: new Date().toISOString()
            }
        };

        // Actualizar en Google Sheets
        await googleSheetsService.updateInvitationConfirmation(code, updatedInvitation);
        
        return updatedInvitation;
    }

    // Obtener estadísticas de confirmaciones
    async getConfirmationStats() {
        const invitations = await googleSheetsService.getAllInvitations();
        
        const stats = {
            totalInvitations: invitations.length,
            totalPasses: invitations.reduce((sum, inv) => sum + inv.numberOfPasses, 0),
            confirmedInvitations: invitations.filter(inv => inv.confirmed).length,
            confirmedPasses: invitations.reduce((sum, inv) => sum + (inv.confirmedPasses || 0), 0),
            pendingInvitations: invitations.filter(inv => !inv.confirmed).length,
            pendingPasses: invitations.filter(inv => !inv.confirmed)
                .reduce((sum, inv) => sum + inv.numberOfPasses, 0)
        };

        return stats;
    }

    // Obtener todas las invitaciones
    async getAllInvitations() {
        return await googleSheetsService.getAllInvitations();
    }

    // Generar URL de invitación
    generateInvitationUrl(code, baseUrl = '') {
        return `${baseUrl}/?invitation=${code}`;
    }
}

module.exports = new InvitationService();
