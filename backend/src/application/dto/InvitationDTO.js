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
     * @param {string[]} data.guestNames
     * @param {string} data.phone
     * @param {number} data.numberOfPasses
     * @param {number} data.adultPasses
     * @param {number} data.childPasses
     * @param {number} data.staffPasses
     * @param {number} data.tableNumber
     */
    constructor({
        guestNames,
        phone,
        numberOfPasses,
        adultPasses,
        childPasses,
        staffPasses,
        tableNumber
    }) {
        this.guestNames = guestNames;
        this.phone = phone;
        this.numberOfPasses = numberOfPasses;
        this.adultPasses = adultPasses;
        this.childPasses = childPasses;
        this.staffPasses = staffPasses;
        this.tableNumber = tableNumber;
    }
}

/**
 * @class UpdateInvitationDTO
 */
class UpdateInvitationDTO {
    /**
     * @param {object} data
     * @param {string[]} [data.guestNames]
     * @param {string} [data.phone]
     * @param {number} [data.numberOfPasses]
     * @param {number} [data.adultPasses]
     * @param {number} [data.childPasses]
     * @param {number} [data.staffPasses]
     * @param {number} [data.tableNumber]
     */
    constructor({
        guestNames,
        phone,
        numberOfPasses,
        adultPasses,
        childPasses,
        staffPasses,
        tableNumber
    }) {
        if (guestNames) {
            this.guestNames = guestNames;
        }
        if (phone) {
            this.phone = phone;
        }
        if (numberOfPasses) {
            this.numberOfPasses = numberOfPasses;
        }
        if (adultPasses) {
            this.adultPasses = adultPasses;
        }
        if (childPasses) {
            this.childPasses = childPasses;
        }
        if (staffPasses) {
            this.staffPasses = staffPasses;
        }
        if (tableNumber) {
            this.tableNumber = tableNumber;
        }
    }
}

module.exports = {
    CreateInvitationDTO,
    UpdateInvitationDTO
};
