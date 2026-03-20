/**
 * @typedef {object} Guest
 * @property {string} name
 * @property {string} type - 'adult', 'child', 'staff'
 */

/**
 * @class CreateInvitationDTO
 */
class CreateInvitationDTO {
    /**
     * @param {object} data
     * @param {string} data.guestName
     * @param {string} data.phone
     * @param {number} data.passes
     * @param {number} data.table
     * @param {Guest[]} data.guests
     */
    constructor({ guestName, phone, passes, table, guests }) {
        this.guestName = guestName;
        this.phone = phone;
        this.passes = passes;
        this.table = table;
        this.guests = guests;
    }
}

/**
 * @class UpdateInvitationDTO
 */
class UpdateInvitationDTO {
    /**
     * @param {object} data
     * @param {string} [data.guestName]
     * @param {string} [data.phone]
     * @param {number} [data.passes]
     * @param {number} [data.table]
     * @param {Guest[]} [data.guests]
     */
    constructor({ guestName, phone, passes, table, guests }) {
        if (guestName) {
            this.guestName = guestName;
        }
        if (phone) {
            this.phone = phone;
        }
        if (passes) {
            this.passes = passes;
        }
        if (table) {
            this.table = table;
        }
        if (guests) {
            this.guests = guests;
        }
    }
}

module.exports = {
    CreateInvitationDTO,
    UpdateInvitationDTO
};
