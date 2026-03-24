jest.mock('../../services/csvStorage');

const csvStorage = require('../../services/csvStorage');
const invitationService = require('../../services/invitationService');

describe('InvitationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createInvitation', () => {
        it('should call csvStorage.saveInvitation and return created invitation', async () => {
            const guestData = { guestNames: ['John Doe'], numberOfPasses: 2 };
            const savedInvitation = { ...guestData, code: 'abcd1234' };

            csvStorage.saveInvitation.mockResolvedValue(savedInvitation);

            const result = await invitationService.createInvitation(guestData);

            expect(csvStorage.saveInvitation).toHaveBeenCalledWith(guestData);
            expect(result).toEqual(savedInvitation);
        });
    });

    describe('getInvitationByCode', () => {
        it('should throw if code is missing', async () => {
            await expect(invitationService.getInvitationByCode('')).rejects.toThrow(
                'Código de invitación requerido'
            );
        });

        it('should throw if invitation not found', async () => {
            csvStorage.getInvitationByCode.mockResolvedValue(null);
            await expect(invitationService.getInvitationByCode('nope')).rejects.toThrow(
                'Invitación no encontrada'
            );
        });

        it('should return invitation when found', async () => {
            const invitation = { code: 'abcd1234', guestNames: ['John'] };
            csvStorage.getInvitationByCode.mockResolvedValue(invitation);
            const result = await invitationService.getInvitationByCode('abcd1234');
            expect(result).toEqual(invitation);
        });
    });

    describe('updateInvitation', () => {
        it('should apply non-confirm update data and return updated invitation', async () => {
            const existingInvitation = {
                code: 'abcd1234',
                guestNames: ['John Doe'],
                numberOfPasses: 2,
                confirmed: false
            };

            jest.spyOn(invitationService, 'getInvitationByCode').mockResolvedValue(existingInvitation);
            csvStorage.updateInvitation.mockResolvedValue({ ...existingInvitation, phone: '123456' });

            const result = await invitationService.updateInvitation('abcd1234', { phone: '123456' });

            expect(invitationService.getInvitationByCode).toHaveBeenCalledWith('abcd1234');
            expect(csvStorage.updateInvitation).toHaveBeenCalledWith('abcd1234', expect.objectContaining({ phone: '123456' }));
            expect(result.phone).toBe('123456');
        });

        it('should apply confirmed update and set confirmationDetails when offered', async () => {
            const existingInvitation = {
                code: 'abcd1234',
                guestNames: ['John Doe'],
                numberOfPasses: 4,
                confirmed: false
            };

            jest.spyOn(invitationService, 'getInvitationByCode').mockResolvedValue(existingInvitation);
            const confirmationDetails = { willAttend: true, numberOfGuests: 3 };
            csvStorage.updateInvitation.mockResolvedValue({ ...existingInvitation, confirmed: true, confirmedPasses: 3, confirmationDetails });

            const result = await invitationService.updateInvitation('abcd1234', {
                confirmed: true,
                confirmationDetails
            });

            expect(result.confirmed).toBe(true);
            expect(result.confirmedPasses).toBe(3);
            expect(result.confirmationDetails).toEqual(confirmationDetails);
        });

        it('should unconfirm and clear confirmation fields', async () => {
            const existingInvitation = {
                code: 'abcd1234',
                guestNames: ['John Doe'],
                numberOfPasses: 2,
                confirmed: true,
                confirmedPasses: 2,
                confirmationDate: '2024-01-01T00:00:00.000Z',
                confirmationDetails: { willAttend: true, numberOfGuests: 2 }
            };

            jest.spyOn(invitationService, 'getInvitationByCode').mockResolvedValue(existingInvitation);
            const storedResponse = { ...existingInvitation, confirmed: false, confirmedPasses: 0 };
            delete storedResponse.confirmationDetails;
            delete storedResponse.confirmationDate;
            csvStorage.updateInvitation.mockResolvedValue(storedResponse);

            const result = await invitationService.updateInvitation('abcd1234', { confirmed: false });

            expect(result.confirmed).toBe(false);
            expect(result.confirmedPasses).toBe(0);
            expect(result.confirmationDetails).toBeUndefined();
            expect(result.confirmationDate).toBeUndefined();
        });
    });

    describe('confirmAttendance', () => {
        it('should throw if already confirmed', async () => {
            const invitation = {
                code: 'abcd1234',
                confirmed: true,
                numberOfPasses: 2
            };
            jest.spyOn(invitationService, 'getInvitationByCode').mockResolvedValue(invitation);

            await expect(
                invitationService.confirmAttendance('abcd1234', { attendingGuests: 1 })
            ).rejects.toThrow('Esta invitación ya ha sido confirmada');
        });

        it('should throw if attendingGuests exceeds numberOfPasses', async () => {
            const invitation = {
                code: 'abcd1234',
                confirmed: false,
                numberOfPasses: 2
            };
            jest.spyOn(invitationService, 'getInvitationByCode').mockResolvedValue(invitation);

            await expect(
                invitationService.confirmAttendance('abcd1234', { attendingGuests: 3 })
            ).rejects.toThrow('Solo tienes 2 pases disponibles');
        });

        it('should confirm attendance via csvStorage.updateInvitationConfirmation when valid', async () => {
            const invitation = {
                code: 'abcd1234',
                confirmed: false,
                numberOfPasses: 2
            };
            jest.spyOn(invitationService, 'getInvitationByCode').mockResolvedValue(invitation);
            csvStorage.updateInvitationConfirmation.mockResolvedValue({ ...invitation, confirmed: true, confirmedPasses: 2 });

            const result = await invitationService.confirmAttendance('abcd1234', { attendingGuests: 2 });

            expect(csvStorage.updateInvitationConfirmation).toHaveBeenCalledWith('abcd1234', { attendingGuests: 2 });
            expect(result.confirmed).toBe(true);
            expect(result.confirmedPasses).toBe(2);
        });
    });

    describe('getConfirmationStats', () => {
        it('should return stats from csvStorage', async () => {
            const stats = { totalInvitations: 1 };
            csvStorage.getStats.mockResolvedValue(stats);

            const result = await invitationService.getConfirmationStats();

            expect(csvStorage.getStats).toHaveBeenCalled();
            expect(result).toEqual(stats);
        });
    });

    describe('getAllInvitations', () => {
        it('should attach confirmation details when invitation is confirmed', async () => {
            const invitations = [{ code: 'abcd1234', confirmed: true }];
            const confirmations = [{ code: 'abcd1234', willAttend: true }];

            csvStorage.getAllInvitations.mockResolvedValue(invitations);
            csvStorage.getAllConfirmations.mockResolvedValue(confirmations);

            const result = await invitationService.getAllInvitations();

            expect(result[0].confirmationDetails).toEqual(confirmations[0]);
        });

        it('should not attach confirmation details when not confirmed', async () => {
            const invitations = [{ code: 'abcd1234', confirmed: false }];
            csvStorage.getAllInvitations.mockResolvedValue(invitations);
            csvStorage.getAllConfirmations.mockResolvedValue([]);

            const result = await invitationService.getAllInvitations();

            expect(result[0].confirmationDetails).toBeUndefined();
        });
    });

    describe('generateInvitationUrl', () => {
        it('should generate correct url with base path', () => {
            expect(invitationService.generateInvitationUrl('abcd1234', 'https://test.com')).toBe(
                'https://test.com/invitacion?invitation=abcd1234'
            );
        });

        it('should generate url without base path', () => {
            expect(invitationService.generateInvitationUrl('abcd1234')).toBe(
                '/invitacion?invitation=abcd1234'
            );
        });
    });
});
