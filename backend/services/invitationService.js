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
            confirmationDetails: null,
            invitationSentAt: null, // Track when invitation was sent
            reminderSentAt: null    // Track when reminder was sent
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

    // Marcar invitación como enviada
    async markInvitationAsSent(code) {
        const invitation = await this.getInvitationByCode(code);
        invitation.invitationSentAt = new Date().toISOString();
        await googleSheetsService.updateInvitation(code, invitation);
        return invitation;
    }

    // Marcar recordatorio como enviado
    async markReminderAsSent(code) {
        const invitation = await this.getInvitationByCode(code);
        invitation.reminderSentAt = new Date().toISOString();
        await googleSheetsService.updateInvitation(code, invitation);
        return invitation;
    }

    // Obtener invitaciones pendientes de recordatorio
    async getInvitationsNeedingReminder() {
        const invitations = await this.getAllInvitations();
        const daysBeforeReminder = parseInt(process.env.DAYS_BEFORE_REMINDER || '7');
        const now = new Date();
        
        return invitations.filter(invitation => {
            // Skip if already confirmed or no phone number
            if (invitation.confirmed || !invitation.phone) return false;
            
            // Skip if reminder already sent
            if (invitation.reminderSentAt) return false;
            
            // Skip if invitation not sent yet
            if (!invitation.invitationSentAt) return false;
            
            // Check if enough days have passed since invitation was sent
            const invitationSentDate = new Date(invitation.invitationSentAt);
            const daysSinceSent = Math.floor((now - invitationSentDate) / (1000 * 60 * 60 * 24));
            
            return daysSinceSent >= daysBeforeReminder;
        });
    }
}

module.exports = new InvitationService();
