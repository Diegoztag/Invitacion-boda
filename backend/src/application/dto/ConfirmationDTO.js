/**
 * @class CreateConfirmationDTO
 */
class CreateConfirmationDTO {
    /**
     * @param {object} data
     * @param {boolean} data.willAttend
     * @param {number} data.attendingGuests
     * @param {string} [data.specialAccommodations]
     * @param {string} [data.dietaryRestrictions]
     * @param {string} [data.message]
     */
    constructor({
        willAttend,
        attendingGuests,
        specialAccommodations,
        dietaryRestrictions,
        message
    }) {
        this.willAttend = willAttend;
        this.attendingGuests = attendingGuests;
        this.specialAccommodations = specialAccommodations;
        this.dietaryRestrictions = dietaryRestrictions;
        this.message = message;
    }
}

/**
 * @class UpdateConfirmationDTO
 */
class UpdateConfirmationDTO {
    /**
     * @param {object} data
     * @param {boolean} [data.willAttend]
     * @param {number} [data.attendingGuests]
     * @param {string} [data.specialAccommodations]
     * @param {string} [data.dietaryRestrictions]
     * @param {string} [data.message]
     */
    constructor({
        willAttend,
        attendingGuests,
        specialAccommodations,
        dietaryRestrictions,
        message
    }) {
        if (willAttend !== undefined) {
            this.willAttend = willAttend;
        }
        if (attendingGuests !== undefined) {
            this.attendingGuests = attendingGuests;
        }
        if (specialAccommodations) {
            this.specialAccommodations = specialAccommodations;
        }
        if (dietaryRestrictions) {
            this.dietaryRestrictions = dietaryRestrictions;
        }
        if (message) {
            this.message = message;
        }
    }
}

module.exports = {
    CreateConfirmationDTO,
    UpdateConfirmationDTO
};
