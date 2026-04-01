/**
 * @file RSVPFacade.js
 *
 * @description This file contains the RSVPFacade class, which simplifies interactions
 * with the RSVP-related services (e.g., loading invitations, submitting confirmations).
 * It provides a unified and simplified interface for the presentation layer (controllers).
 */

/**
 * @class RSVPFacade
 * @description Facade for handling RSVP-related operations.
 */
export class RSVPFacade {
    /**
     * Creates an instance of RSVPFacade.
     * @param {RSVPService} rsvpService - The service for handling RSVP operations.
     */
    constructor(rsvpService) {
        this.rsvpService = rsvpService;
    }

    /**
     * Loads an invitation by its ID.
     * @param {string} invitationId - The ID of the invitation to load.
     * @returns {Promise<object>} The invitation data.
     */
    loadInvitation(invitationId) {
        return this.rsvpService.loadInvitation(invitationId);
    }

    /**
     * Submits a confirmation for an invitation.
     * @param {string} invitationId - The ID of the invitation.
     * @param {object} formData - The confirmation data.
     * @returns {Promise<object>} The result of the submission.
     */
    submitConfirmation(invitationId, formData) {
        return this.rsvpService.submitConfirmation(invitationId, formData);
    }
}
