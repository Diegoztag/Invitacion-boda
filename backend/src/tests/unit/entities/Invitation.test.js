/**
 * Invitation Entity Tests
 * Tests unitarios para la entidad Invitation
 */

const Invitation = require('../../../core/entities/Invitation');

describe('Invitation Entity', () => {
    describe('Constructor', () => {
        test('should create invitation with valid data', () => {
            const data = {
                code: 'INV001',
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                phone: '+1234567890'
            };

            const invitation = new Invitation(data);

            expect(invitation.code).toBe('INV001');
            expect(invitation.guestNames).toEqual(['Juan Pérez', 'María García']);
            expect(invitation.numberOfPasses).toBe(2);
            expect(invitation.phone).toBe('+1234567890');
            expect(invitation.confirmed).toBe(false);
            expect(invitation.status).toBe('active');
            expect(invitation.createdAt).toBeDefined();
        });

        test('should throw error with invalid code', () => {
            const data = {
                code: '',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1
            };

            expect(() => new Invitation(data)).toThrow('Código de invitación es requerido');
        });

        test('should throw error with empty guest names', () => {
            const data = {
                code: 'INV001',
                guestNames: [],
                numberOfPasses: 1
            };

            expect(() => new Invitation(data)).toThrow(
                'Al menos un nombre de invitado es requerido'
            );
        });

        test('should throw error with invalid number of passes', () => {
            const data = {
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 0
            };

            expect(() => new Invitation(data)).toThrow('Número de pases debe ser mayor a 0');
        });

        test('should throw error with invalid guestNames type', () => {
            const data = {
                code: 'INV001',
                guestNames: 123,
                numberOfPasses: 1
            };

            expect(() => new Invitation(data)).toThrow('guestNames debe ser un array o string');
        });

        test('should create invitation from string guestNames', () => {
            const data = {
                code: 'INV001',
                guestNames: 'Juan Pérez',
                numberOfPasses: 1
            };

            const invitation = new Invitation(data);
            expect(invitation.guestNames).toEqual(['Juan Pérez']);
        });
    });

    describe('Methods', () => {
        let invitation;

        beforeEach(() => {
            invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                phone: '+1234567890'
            });
        });

        test('confirm should set confirmation data', () => {
            const confirmationData = {
                confirmedPasses: 2,
                adultPasses: 2,
                childPasses: 0,
                staffPasses: 0,
                confirmationDate: new Date().toISOString()
            };

            invitation.confirm(confirmationData);

            expect(invitation.confirmed).toBe(true);
            expect(invitation.confirmedPasses).toBe(2);
            expect(invitation.adultPasses).toBe(2);
            expect(invitation.childPasses).toBe(0);
            expect(invitation.staffPasses).toBe(0);
            expect(invitation.confirmationDate).toBeDefined();
            expect(invitation.status).toBe('confirmed');
        });

        test('confirm should throw error if already confirmed', () => {
            invitation.confirm({ confirmedPasses: 2 });
            expect(() => invitation.confirm({ confirmedPasses: 1 })).toThrow(
                'Esta invitación ya ha sido confirmada'
            );
        });

        test('confirm should set status to cancelled if confirmedPasses is 0', () => {
            invitation.confirm({ confirmedPasses: 0 });
            expect(invitation.status).toBe('cancelled');
        });

        test('confirm should throw error if inactive', () => {
            invitation.deactivate();
            expect(() => invitation.confirm({ confirmedPasses: 1 })).toThrow(
                'No se puede confirmar una invitación inactiva'
            );
        });

        test('cancel should set cancellation data', () => {
            const reason = 'No puede asistir';
            const cancelledBy = 'admin';

            invitation.cancel(reason, cancelledBy);

            expect(invitation.confirmed).toBe(false);
            expect(invitation.confirmedPasses).toBe(0);
            expect(invitation.cancelledAt).toBeDefined();
            expect(invitation.cancelledBy).toBe(cancelledBy);
            expect(invitation.cancellationReason).toBe(reason);
        });

        test('deactivate should set status to inactive', () => {
            const reason = 'Duplicado';
            const deletedBy = 'admin';

            const deactivated = invitation.deactivate(deletedBy, reason);

            expect(deactivated.status).toBe('inactive');
            expect(deactivated.cancelledAt).toBeDefined();
            expect(deactivated.cancelledBy).toBe(deletedBy);
            expect(deactivated.cancellationReason).toBe(reason);
        });

        test('activate should set status to pending when not confirmed', () => {
            invitation.status = 'inactive';

            const activated = invitation.activate();

            // La entidad recalcula el estado según los pases confirmados (0) -> pending
            expect(activated.status).toBe('pending');
            expect(activated.cancelledAt).toBeNull();
            expect(activated.cancelledBy).toBeNull();
            expect(activated.cancellationReason).toBeNull();
        });

        test('isActive should return correct status', () => {
            expect(invitation.isActive()).toBe(true);

            invitation.status = 'inactive';
            expect(invitation.isActive()).toBe(false);
        });

        test('isConfirmed should return confirmation status', () => {
            expect(invitation.isConfirmed()).toBe(false);

            invitation.confirm({
                confirmedPasses: 1,
                adultPasses: 1,
                childPasses: 0,
                confirmationDate: new Date().toISOString()
            });

            expect(invitation.isConfirmed()).toBe(true);
        });

        test('getPendingPasses should calculate correctly', () => {
            expect(invitation.getPendingPasses()).toBe(2);

            invitation.confirm({
                confirmedPasses: 1,
                adultPasses: 1,
                childPasses: 0,
                confirmationDate: new Date().toISOString()
            });

            expect(invitation.getPendingPasses()).toBe(1);
        });

        test('getGuestNamesString should join names', () => {
            expect(invitation.getGuestNamesString()).toBe('Juan Pérez y María García');
        });

        test('phone property should reflect the value provided at construction', () => {
            expect(invitation.phone).toBe('+1234567890');

            const invitationWithoutPhone = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                phone: ''
            });

            expect(invitationWithoutPhone.phone).toBe('');
        });

        test('clone should create deep copy', () => {
            const cloned = invitation.clone();

            expect(cloned).not.toBe(invitation);
            expect(cloned.code).toBe(invitation.code);
            expect(cloned.guestNames).toEqual(invitation.guestNames);
            expect(cloned.guestNames).not.toBe(invitation.guestNames);
        });

        test('toObject should return plain object', () => {
            const obj = invitation.toObject();

            expect(obj).toMatchObject({
                code: 'INV001',
                guestNames: ['Juan Pérez', 'María García'],
                numberOfPasses: 2,
                phone: '+1234567890',
                createdAt: invitation.createdAt,
                confirmed: false,
                confirmedPasses: 0,
                confirmationDate: null,
                adultPasses: 0,
                childPasses: 0,
                staffPasses: 0,
                tableNumber: null,
                status: 'active',
                cancelledAt: null,
                cancelledBy: null,
                cancellationReason: null,
                attendingNames: [],
                dietaryRestrictionsNames: '',
                dietaryRestrictionsDetails: '',
                generalMessage: ''
            });
        });

        test('update should change invitation fields and preserve consistency', () => {
            invitation.update({
                guestNames: 'Nuevo Nombre',
                numberOfPasses: 3,
                phone: '+5555555',
                tableNumber: 5,
                adultPasses: 2,
                childPasses: 1,
                staffPasses: 0,
                generalMessage: 'Nuevo mensaje',
                dietaryRestrictionsNames: 'Ninguna',
                dietaryRestrictionsDetails: 'Ninguna',
                attendingNames: 'Nuevo Nombre',
                confirmedPasses: 0
            });

            expect(invitation.status).toBe('cancelled');
            expect(invitation.guestNames).toEqual(['Nuevo Nombre']);
            expect(invitation.attendingNames).toEqual(['Nuevo Nombre']);
            expect(invitation.dietaryRestrictionsNames).toBe('Ninguna');
            expect(invitation.dietaryRestrictionsDetails).toBe('Ninguna');

            invitation.update({
                guestNames: ['Nuevo Nombre'],
                numberOfPasses: 3,
                phone: '+5555555',
                tableNumber: 5,
                adultPasses: 2,
                childPasses: 1,
                staffPasses: 0,
                generalMessage: 'Nuevo mensaje',
                status: 'confirmed'
            });

            expect(invitation.guestNames).toEqual(['Nuevo Nombre']);
            expect(invitation.numberOfPasses).toBe(3);
            expect(invitation.phone).toBe('+5555555');
            expect(invitation.tableNumber).toBe(5);
            expect(invitation.adultPasses).toBe(2);
            expect(invitation.childPasses).toBe(1);
            expect(invitation.staffPasses).toBe(0);
            expect(invitation.generalMessage).toBe('Nuevo mensaje');
        });

        test('assignTable should update table number and reject invalid values', () => {
            invitation.assignTable(10);
            expect(invitation.tableNumber).toBe(10);

            expect(() => invitation.assignTable(-1)).toThrow(
                'El número de mesa debe ser un entero positivo'
            );
        });

        test('updatePasses should enforce consistency', () => {
            expect(() =>
                invitation.updatePasses({ adultPasses: 1, childPasses: 1, staffPasses: 1 })
            ).toThrow('La suma de pases (3) debe coincidir con el total (2)');

            invitation.updatePasses({ adultPasses: 2, childPasses: 0, staffPasses: 0 });
            expect(invitation.adultPasses).toBe(2);
        });

        test('updateConfirmation should update confirmation-related fields', () => {
            invitation.updateConfirmation({
                attendingNames: 'Juan Pérez',
                dietaryRestrictionsNames: 'Sin gluten',
                dietaryRestrictionsDetails: 'Sin gluten',
                generalMessage: '¡Nos vemos!'
            });

            expect(invitation.attendingNames).toEqual(['Juan Pérez']);
            expect(invitation.dietaryRestrictionsNames).toBe('Sin gluten');
            expect(invitation.dietaryRestrictionsDetails).toBe('Sin gluten');
            expect(invitation.generalMessage).toBe('¡Nos vemos!');
        });

        test('getDietaryRestrictionsInfo should return correct summary', () => {
            invitation.updateConfirmation({
                dietaryRestrictionsNames: 'Sin gluten',
                dietaryRestrictionsDetails: 'No flour'
            });

            const info = invitation.getDietaryRestrictionsInfo();
            expect(info.hasRestrictions).toBe(true);
            expect(info.summary).toContain('Sin gluten');
        });

        test('equals and toString should work correctly', () => {
            const other = new Invitation({
                code: 'INV002',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1
            });

            expect(invitation.equals(invitation)).toBe(true);
            expect(invitation.equals(other)).toBe(false);
            expect(invitation.toString()).toContain('Invitation(');
        });

        test('isFullyConfirmed should reflect status after confirm', () => {
            expect(invitation.isFullyConfirmed()).toBe(false);

            invitation.confirm({
                confirmedPasses: 2,
                adultPasses: 2,
                childPasses: 0,
                confirmationDate: new Date().toISOString()
            });

            expect(invitation.isFullyConfirmed()).toBe(true);
            expect(invitation.status).toBe('confirmed');
        });

        test('unconfirm should reset confirmation state', () => {
            invitation.confirm({
                confirmedPasses: 1,
                adultPasses: 1,
                childPasses: 0,
                confirmationDate: new Date().toISOString()
            });

            expect(invitation.isConfirmed()).toBe(true);
            invitation.unconfirm();
            expect(invitation.isConfirmed()).toBe(false);
            expect(invitation.status).toBe('pending');
        });

        test('fromObject should create instance', () => {
            const obj = invitation.toObject();
            const newInv = Invitation.fromObject(obj);
            expect(newInv).toBeInstanceOf(Invitation);
            expect(newInv.code).toBe(invitation.code);
        });

        test('confirmSimple should update fields', () => {
            invitation.confirmSimple({
                confirmedPasses: 1,
                adultPasses: 1,
                childPasses: 0,
                staffPasses: 0
            });
            expect(invitation.confirmedPasses).toBe(1);
            expect(invitation.status).toBe('partial');

            invitation.confirmSimple({
                confirmedPasses: 2
            });
            expect(invitation.status).toBe('confirmed');

            invitation.confirmSimple({
                confirmedPasses: 0
            });
            expect(invitation.status).toBe('cancelled');
        });

        test('cancel should update fields', () => {
            invitation.cancel('Razón', 'admin');
            expect(invitation.status).toBe('cancelled');
            expect(invitation.cancellationReason).toBe('Razón');
            expect(invitation.cancelledBy).toBe('admin');
        });
    });

    describe('Validation', () => {
        test('should validate guest names format', () => {
            const data = {
                code: 'INV001',
                guestNames: ['', 'Valid Name'],
                numberOfPasses: 2
            };

            expect(() => new Invitation(data)).toThrow(
                'Nombres de invitados no pueden estar vacíos'
            );
        });

        test('should validate phone type if provided', () => {
            const data = {
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1,
                phone: 1234567890
            };

            expect(() => new Invitation(data)).toThrow('phone debe ser un string');
        });

        test('should validate confirmation data', () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });

            expect(() => invitation.confirm({ confirmedPasses: 3 })).toThrow(
                'Solo tienes 2 pases disponibles'
            );
        });

        test('should throw error if confirmed passes exceed total in constructor', () => {
            const data = {
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2,
                confirmedPasses: 3
            };

            expect(() => new Invitation(data)).toThrow(
                'Los pases confirmados no pueden exceder el total de pases'
            );
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined values gracefully', () => {
            const data = {
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1,
                phone: null,
                tableNumber: undefined
            };

            const invitation = new Invitation(data);

            expect(invitation.phone).toBe('');
            expect(invitation.tableNumber).toBeNull();
        });

        test('should trim whitespace from guest names', () => {
            const data = {
                code: 'INV001',
                guestNames: ['  Juan Pérez  ', '  María García  '],
                numberOfPasses: 2
            };

            const invitation = new Invitation(data);

            expect(invitation.guestNames).toEqual(['Juan Pérez', 'María García']);
        });

        test('should handle large number of guests', () => {
            const guestNames = Array.from({ length: 10 }, (_, i) => `Guest ${i + 1}`);
            const data = {
                code: 'INV001',
                guestNames,
                numberOfPasses: 10
            };

            const invitation = new Invitation(data);

            expect(invitation.guestNames).toHaveLength(10);
            expect(invitation.numberOfPasses).toBe(10);
        });
    });
});
