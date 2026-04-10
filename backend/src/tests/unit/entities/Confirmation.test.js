/**
 * Confirmation Entity - Pruebas Unitarias
 * Cubre la funcionalidad completa de la entidad Confirmation
 */

const Confirmation = require('../../../core/entities/Confirmation');

describe('Confirmation Entity', () => {
    describe('Constructor', () => {
        test('debe crear una confirmación válida con parámetros mínimos', () => {
            const confirmation = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2
            });

            expect(confirmation.code).toBe('ABC123');
            expect(confirmation.willAttend).toBe(true);
            expect(confirmation.attendingGuests).toBe(2);
            expect(confirmation.attendingNames).toEqual([]);
            expect(confirmation.phone).toBe('');
            expect(confirmation.dietaryRestrictions).toBe('');
            expect(confirmation.message).toBe('');
            expect(confirmation.confirmedAt).toBeDefined();
        });

        test('debe crear una confirmación con todos los parámetros', () => {
            const confirmedAt = '2024-01-01T10:00:00.000Z';
            const confirmation = new Confirmation({
                code: 'XYZ789',
                willAttend: false,
                attendingGuests: 0,
                attendingNames: [],
                phone: '+1234567890',
                dietaryRestrictions: 'Vegetariano',
                message: 'Felicidades!',
                confirmedAt
            });

            expect(confirmation.code).toBe('XYZ789');
            expect(confirmation.willAttend).toBe(false);
            expect(confirmation.attendingGuests).toBe(0);
            expect(confirmation.attendingNames).toEqual([]);
            expect(confirmation.phone).toBe('+1234567890');
            expect(confirmation.dietaryRestrictions).toBe('Vegetariano');
            expect(confirmation.message).toBe('Felicidades!');
            expect(confirmation.confirmedAt).toBe(confirmedAt);
        });

        test('debe validar código requerido', () => {
            expect(() => new Confirmation({})).toThrow('Error de validación');
            expect(
                () =>
                    new Confirmation({
                        code: null
                    })
            ).toThrow('Error de validación');
            expect(
                () =>
                    new Confirmation({
                        code: 123
                    })
            ).toThrow('Error de validación');
        });

        test('debe validar willAttend como boolean', () => {
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: 'true'
                    })
            ).toThrow('Error de validación');
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: null
                    })
            ).toThrow('Error de validación');
        });

        test('debe validar attendingGuests como entero no negativo', () => {
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: true,
                        attendingGuests: '2'
                    })
            ).toThrow('Error de validación');
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: true,
                        attendingGuests: -1
                    })
            ).toThrow('Error de validación');
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: true,
                        attendingGuests: 2.5
                    })
            ).toThrow('Error de validación');
        });

        test('debe validar attendingNames como array', () => {
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: true,
                        attendingGuests: 2,
                        attendingNames: 'Juan, Maria'
                    })
            ).toThrow('Error de validación');
        });

        test('debe validar tipos de datos opcionales', () => {
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: true,
                        attendingGuests: 2,
                        phone: 1234567890
                    })
            ).toThrow('Error de validación');

            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: true,
                        attendingGuests: 2,
                        dietaryRestrictions: []
                    })
            ).toThrow('Error de validación');

            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: true,
                        attendingGuests: 2,
                        message: {}
                    })
            ).toThrow('Error de validación');
        });

        test('debe validar lógica de negocio: no invitados si no asiste', () => {
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: false,
                        attendingGuests: 2
                    })
            ).toThrow('No se pueden tener invitados confirmados si no va a asistir');
        });

        test('debe validar lógica de negocio: nombres no pueden exceder invitados', () => {
            expect(
                () =>
                    new Confirmation({
                        code: 'ABC123',
                        willAttend: true,
                        attendingGuests: 1,
                        attendingNames: ['Juan', 'Maria']
                    })
            ).toThrow('No se pueden tener más nombres que invitados confirmados');
        });
    });

    describe('Métodos de actualización', () => {
        let confirmation;

        beforeEach(() => {
            confirmation = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan', 'Maria']
            });
        });

        test('updateAttendance debe cambiar asistencia y limpiar datos si no asiste', () => {
            confirmation.updateAttendance(false);

            expect(confirmation.willAttend).toBe(false);
            expect(confirmation.attendingGuests).toBe(0);
            expect(confirmation.attendingNames).toEqual([]);
        });

        test('updateAttendingGuests debe validar y actualizar invitados', () => {
            confirmation.updateAttendingGuests(3);
            expect(confirmation.attendingGuests).toBe(3);

            expect(() => confirmation.updateAttendingGuests(-1)).toThrow('Error de validación');
            expect(() => confirmation.updateAttendingGuests('3')).toThrow('Error de validación');
        });

        test('debe validar lógica de negocio', () => {
            confirmation.updateAttendance(false);
            expect(() => confirmation.updateAttendingGuests(1)).toThrow(
                'No se pueden tener invitados si no va a asistir'
            );
        });

        test('debe ajustar nombres si es necesario', () => {
            confirmation.updateAttendingGuests(1);
            expect(confirmation.attendingNames).toEqual(['Juan']);
        });

        test('debe validar y actualizar nombres', () => {
            confirmation.updateAttendingNames(['Pedro', 'Ana']);
            expect(confirmation.attendingNames).toEqual(['Pedro', 'Ana']);

            expect(() => confirmation.updateAttendingNames('Pedro')).toThrow('Error de validación');
        });

        test('debe filtrar nombres válidos', () => {
            confirmation.updateAttendingGuests(3);
            confirmation.updateAttendingNames(['Pedro', '', '  ', 'Ana']);
            expect(confirmation.attendingNames).toEqual(['Pedro', 'Ana']);
        });

        test('debe validar cantidad máxima', () => {
            expect(() => confirmation.updateAttendingNames(['Pedro', 'Ana', 'Luis'])).toThrow(
                'No se pueden tener más nombres'
            );
        });

        test('debe validar y actualizar teléfono', () => {
            confirmation.updatePhone('+1234567890');
            expect(confirmation.phone).toBe('+1234567890');

            confirmation.updatePhone('');
            expect(confirmation.phone).toBe('');

            expect(() => confirmation.updatePhone(1234567890)).toThrow('Error de validación');
        });

        test('debe validar y actualizar restricciones', () => {
            confirmation.updateDietaryRestrictions('Vegetariano');
            expect(confirmation.dietaryRestrictions).toBe('Vegetariano');

            confirmation.updateDietaryRestrictions('');
            expect(confirmation.dietaryRestrictions).toBe('');

            expect(() => confirmation.updateDietaryRestrictions([])).toThrow('Error de validación');
        });

        test('debe validar y actualizar mensaje', () => {
            confirmation.updateMessage('Felicidades!');
            expect(confirmation.message).toBe('Felicidades!');

            confirmation.updateMessage('');
            expect(confirmation.message).toBe('');

            expect(() => confirmation.updateMessage({})).toThrow('Error de validación');
        });
    });

    describe('Métodos de consulta', () => {
        test('isPositive e isNegative deben funcionar correctamente', () => {
            const positive = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 1
            });
            const negative = new Confirmation({
                code: 'XYZ789',
                willAttend: false,
                attendingGuests: 0
            });

            expect(positive.isPositive()).toBe(true);
            expect(positive.isNegative()).toBe(false);
            expect(negative.isPositive()).toBe(false);
            expect(negative.isNegative()).toBe(true);
        });

        test('hasAllGuestNames debe verificar si tiene todos los nombres', () => {
            const complete = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan', 'Maria']
            });
            const incomplete = new Confirmation({
                code: 'XYZ789',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan']
            });

            expect(complete.hasAllGuestNames()).toBe(true);
            expect(incomplete.hasAllGuestNames()).toBe(false);
        });

        test('hasDietaryRestrictions debe verificar restricciones dietarias', () => {
            const withRestrictions = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 1,
                dietaryRestrictions: 'Vegetariano'
            });
            const withoutRestrictions = new Confirmation({
                code: 'XYZ789',
                willAttend: true,
                attendingGuests: 1,
                dietaryRestrictions: ''
            });

            expect(withRestrictions.hasDietaryRestrictions()).toBe(true);
            expect(withoutRestrictions.hasDietaryRestrictions()).toBe(false);
        });

        test('hasMessage debe verificar mensaje', () => {
            const withMessage = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 1,
                message: 'Felicidades!'
            });
            const withoutMessage = new Confirmation({
                code: 'XYZ789',
                willAttend: true,
                attendingGuests: 1,
                message: ''
            });

            expect(withMessage.hasMessage()).toBe(true);
            expect(withoutMessage.hasMessage()).toBe(false);
        });

        test('hasPhone debe verificar teléfono', () => {
            const withPhone = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 1,
                phone: '+1234567890'
            });
            const withoutPhone = new Confirmation({
                code: 'XYZ789',
                willAttend: true,
                attendingGuests: 1,
                phone: ''
            });

            expect(withPhone.hasPhone()).toBe(true);
            expect(withoutPhone.hasPhone()).toBe(false);
        });

        test('getMissingNamesCount debe calcular nombres faltantes', () => {
            const complete = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan', 'Maria']
            });
            const missingOne = new Confirmation({
                code: 'XYZ789',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan']
            });
            const missingAll = new Confirmation({
                code: 'DEF456',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: []
            });

            expect(complete.getMissingNamesCount()).toBe(0);
            expect(missingOne.getMissingNamesCount()).toBe(1);
            expect(missingAll.getMissingNamesCount()).toBe(2);
        });

        test('getSummary debe generar resumen correcto', () => {
            const positive = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 1
            });
            const positivePlural = new Confirmation({
                code: 'XYZ789',
                willAttend: true,
                attendingGuests: 2
            });
            const negative = new Confirmation({
                code: 'DEF456',
                willAttend: false,
                attendingGuests: 0
            });

            expect(positive.getSummary()).toBe('Asistirá con 1 invitado');
            expect(positivePlural.getSummary()).toBe('Asistirá con 2 invitados');
            expect(negative.getSummary()).toBe('No asistirá');
        });
    });

    describe('Métodos de conversión y comparación', () => {
        test('toObject debe convertir a objeto plano', () => {
            const confirmation = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan', 'Maria'],
                phone: '+1234567890',
                dietaryRestrictions: 'Vegetariano',
                message: 'Felicidades!'
            });

            const obj = confirmation.toObject();

            expect(obj).toEqual({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan', 'Maria'],
                phone: '+1234567890',
                dietaryRestrictions: 'Vegetariano',
                message: 'Felicidades!',
                confirmedAt: confirmation.confirmedAt
            });
        });

        test('fromObject debe crear instancia desde objeto', () => {
            const data = {
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan', 'Maria']
            };

            const confirmation = Confirmation.fromObject(data);

            expect(confirmation).toBeInstanceOf(Confirmation);
            expect(confirmation.code).toBe('ABC123');
            expect(confirmation.willAttend).toBe(true);
            expect(confirmation.attendingGuests).toBe(2);
            expect(confirmation.attendingNames).toEqual(['Juan', 'Maria']);
        });

        test('clone debe crear copia independiente', () => {
            const original = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2
            });

            const clone = original.clone();

            expect(clone).toBeInstanceOf(Confirmation);
            expect(clone.code).toBe(original.code);
            expect(clone.willAttend).toBe(original.willAttend);
            expect(clone).not.toBe(original); // Diferente instancia
        });

        test('equals debe comparar confirmaciones correctamente', () => {
            const conf1 = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 1
            });
            const conf2 = new Confirmation({
                code: 'ABC123',
                willAttend: false,
                attendingGuests: 0
            });
            const conf3 = new Confirmation({
                code: 'XYZ789',
                willAttend: true,
                attendingGuests: 1
            });

            expect(conf1.equals(conf2)).toBe(true); // Mismo código
            expect(conf1.equals(conf3)).toBe(false); // Diferente código
            expect(conf1.equals({})).toBe(false); // No es instancia
        });

        test('toString debe generar representación correcta', () => {
            const positive = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 1
            });
            const negative = new Confirmation({
                code: 'XYZ789',
                willAttend: false,
                attendingGuests: 0
            });

            expect(positive.toString()).toBe('Confirmation(ABC123, Asistirá con 1 invitado)');
            expect(negative.toString()).toBe('Confirmation(XYZ789, No asistirá)');
        });
    });

    describe('Métodos estáticos', () => {
        test('createNegative debe crear confirmación negativa', () => {
            const confirmation = Confirmation.createNegative('ABC123', 'No puedo asistir');

            expect(confirmation.code).toBe('ABC123');
            expect(confirmation.willAttend).toBe(false);
            expect(confirmation.attendingGuests).toBe(0);
            expect(confirmation.attendingNames).toEqual([]);
            expect(confirmation.message).toBe('No puedo asistir');
        });

        test('createPositive debe crear confirmación positiva', () => {
            const confirmation = Confirmation.createPositive('ABC123', 2, ['Juan', 'Maria'], {
                phone: '+1234567890',
                dietaryRestrictions: 'Vegetariano'
            });

            expect(confirmation.code).toBe('ABC123');
            expect(confirmation.willAttend).toBe(true);
            expect(confirmation.attendingGuests).toBe(2);
            expect(confirmation.attendingNames).toEqual(['Juan', 'Maria']);
            expect(confirmation.phone).toBe('+1234567890');
            expect(confirmation.dietaryRestrictions).toBe('Vegetariano');
        });
    });

    describe('Getters deben ser inmutables', () => {
        test('attendingNames debe devolver copia', () => {
            const confirmation = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan', 'Maria']
            });

            const names = confirmation.attendingNames;
            names.push('Pedro');

            expect(confirmation.attendingNames).toEqual(['Juan', 'Maria']);
        });
    });

    describe('validate', () => {
        test('debe validar una confirmación correcta', () => {
            const confirmation = new Confirmation({
                code: 'ABC123',
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['Juan', 'Maria']
            });
            expect(() => confirmation.validateConstructorParams(confirmation)).not.toThrow();
        });
    });
});
