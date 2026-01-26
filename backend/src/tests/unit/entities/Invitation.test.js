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

            expect(() => new Invitation(data)).toThrow('Al menos un nombre de invitado es requerido');
        });

        test('should throw error with invalid number of passes', () => {
            const data = {
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 0
            };

            expect(() => new Invitation(data)).toThrow('Número de pases debe ser mayor a 0');
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
                confirmationDate: new Date().toISOString()
            };

            invitation.confirm(confirmationData);

            expect(invitation.confirmed).toBe(true);
            expect(invitation.confirmedPasses).toBe(2);
            expect(invitation.adultPasses).toBe(2);
            expect(invitation.childPasses).toBe(0);
            expect(invitation.confirmationDate).toBeDefined();
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

        test('activate should set status to active', () => {
            invitation.status = 'inactive';
            
            const activated = invitation.activate();

            expect(activated.status).toBe('active');
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
            
            invitation.confirmed = true;
            expect(invitation.isConfirmed()).toBe(true);
        });

        test('getPendingPasses should calculate correctly', () => {
            expect(invitation.getPendingPasses()).toBe(2);
            
            invitation.confirmedPasses = 1;
            expect(invitation.getPendingPasses()).toBe(1);
        });

        test('getGuestNamesString should join names', () => {
            expect(invitation.getGuestNamesString()).toBe('Juan Pérez, María García');
        });

        test('hasPhone should check phone presence', () => {
            expect(invitation.hasPhone()).toBe(true);
            
            invitation.phone = '';
            expect(invitation.hasPhone()).toBe(false);
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

            expect(obj).toEqual({
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
                cancellationReason: null
            });
        });
    });

    describe('Validation', () => {
        test('should validate guest names format', () => {
            const data = {
                code: 'INV001',
                guestNames: ['', 'Valid Name'],
                numberOfPasses: 2
            };

            expect(() => new Invitation(data)).toThrow('Nombres de invitados no pueden estar vacíos');
        });

        test('should validate phone format if provided', () => {
            const data = {
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 1,
                phone: 'invalid-phone'
            };

            expect(() => new Invitation(data)).toThrow('Formato de teléfono inválido');
        });

        test('should accept valid phone formats', () => {
            const validPhones = ['+1234567890', '1234567890', '+52-123-456-7890'];

            validPhones.forEach(phone => {
                const data = {
                    code: 'INV001',
                    guestNames: ['Juan Pérez'],
                    numberOfPasses: 1,
                    phone
                };

                expect(() => new Invitation(data)).not.toThrow();
            });
        });

        test('should validate confirmation data', () => {
            const invitation = new Invitation({
                code: 'INV001',
                guestNames: ['Juan Pérez'],
                numberOfPasses: 2
            });

            expect(() => invitation.confirm({ confirmedPasses: 3 }))
                .toThrow('Pases confirmados no pueden exceder el número total de pases');
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
