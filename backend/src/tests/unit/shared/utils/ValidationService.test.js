const ValidationService = require('../../../../shared/utils/ValidationService');

describe('ValidationService', () => {
    let validationService;
    let mockConfig;
    let mockLogger;

    beforeEach(() => {
        mockConfig = {
            validation: {
                invitation: {
                    maxGuestNames: 10,
                    minPasses: 1,
                    maxPasses: 10,
                    maxAdults: 10,
                    maxChildren: 10,
                    maxStaff: 5,
                    maxTableNumber: 100,
                    maxNotesLength: 500
                },
                confirmation: {
                    maxAttendingNames: 10,
                    maxSpecialAccommodationsLength: 200
                },
                app: {
                    codeLength: 6
                }
            }
        };

        mockLogger = {
            warn: jest.fn(),
            error: jest.fn()
        };

        validationService = new ValidationService(mockConfig, mockLogger);
    });

    describe('validateEmail', () => {
        it('should return true for valid emails', () => {
            expect(validationService.validateEmail('test@example.com')).toBe(true);
            expect(validationService.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
        });

        it('should return false for invalid emails', () => {
            expect(validationService.validateEmail('invalid-email')).toBe(false);
            expect(validationService.validateEmail('test@')).toBe(false);
            expect(validationService.validateEmail('@example.com')).toBe(false);
            expect(validationService.validateEmail(null)).toBe(false);
            expect(validationService.validateEmail(undefined)).toBe(false);
            expect(validationService.validateEmail(123)).toBe(false);
        });
    });

    describe('validatePhone', () => {
        it('should return true for valid strict phones', () => {
            expect(validationService.validatePhone('+1234567890')).toBe(true);
            expect(validationService.validatePhone('1234567890')).toBe(true);
            expect(validationService.validatePhone('+1 (234) 567-8900')).toBe(true);
        });

        it('should return false for invalid strict phones', () => {
            expect(validationService.validatePhone('invalid')).toBe(false);
            expect(validationService.validatePhone(null)).toBe(false);
        });
    });

    describe('validatePhoneLoose', () => {
        it('should return true for valid loose phones', () => {
            expect(validationService.validatePhoneLoose('+1 234 567 8900')).toBe(true);
            expect(validationService.validatePhoneLoose('123-456-7890')).toBe(true);
        });

        it('should return false for invalid loose phones', () => {
            expect(validationService.validatePhoneLoose('abc')).toBe(false);
            expect(validationService.validatePhoneLoose('123')).toBe(false); // Too short
        });
    });

    describe('validateName', () => {
        it('should return true for valid names', () => {
            expect(validationService.validateName('John Doe')).toBe(true);
            expect(validationService.validateName('María José')).toBe(true);
            expect(validationService.validateName("O'Connor")).toBe(true);
            expect(validationService.validateName('Jean-Luc')).toBe(true);
        });

        it('should return false for invalid names', () => {
            expect(validationService.validateName('A')).toBe(false); // Too short
            expect(validationService.validateName('John123')).toBe(false); // Numbers not allowed
            expect(validationService.validateName(null)).toBe(false);
        });
    });

    describe('validateInvitationCode', () => {
        it('should return true for valid codes', () => {
            expect(validationService.validateInvitationCode('ABCDEF')).toBe(true);
            expect(validationService.validateInvitationCode('123456')).toBe(true);
        });

        it('should return false for invalid codes', () => {
            expect(validationService.validateInvitationCode('ABC')).toBe(false); // Too short
            expect(validationService.validateInvitationCode('ABC-DEF')).toBe(false); // Special chars
            expect(validationService.validateInvitationCode(null)).toBe(false);
        });
    });

    describe('validateNumberRange', () => {
        it('should return true if number is in range', () => {
            expect(validationService.validateNumberRange(5, 1, 10)).toBe(true);
            expect(validationService.validateNumberRange(1, 1, 10)).toBe(true);
            expect(validationService.validateNumberRange(10, 1, 10)).toBe(true);
        });

        it('should return false if number is out of range or invalid', () => {
            expect(validationService.validateNumberRange(0, 1, 10)).toBe(false);
            expect(validationService.validateNumberRange(11, 1, 10)).toBe(false);
            expect(validationService.validateNumberRange('5', 1, 10)).toBe(false);
            expect(validationService.validateNumberRange(NaN, 1, 10)).toBe(false);
        });
    });

    describe('validateStringLength', () => {
        it('should return true if string length is in range', () => {
            expect(validationService.validateStringLength('test', 1, 10)).toBe(true);
            expect(validationService.validateStringLength('a', 1, 10)).toBe(true);
        });

        it('should return false if string length is out of range or invalid', () => {
            expect(validationService.validateStringLength('', 1, 10)).toBe(false);
            expect(validationService.validateStringLength('this is too long', 1, 10)).toBe(false);
            expect(validationService.validateStringLength(123, 1, 10)).toBe(false);
        });
    });

    describe('sanitizeString', () => {
        it('should remove dangerous characters', () => {
            expect(validationService.sanitizeString('<script>alert(1)</script>')).toBe('alert(1)');
            expect(validationService.sanitizeString('javascript:alert(1)')).toBe('alert(1)');
            expect(validationService.sanitizeString('Normal text')).toBe('Normal text');
        });

        it('should handle invalid inputs', () => {
            expect(validationService.sanitizeString(null)).toBe('');
            expect(validationService.sanitizeString(123)).toBe('');
        });
    });

    describe('sanitizePhone', () => {
        it('should keep only valid phone characters', () => {
            expect(validationService.sanitizePhone('+1 (234) 567-8900 ext')).toBe(
                '+1 (234) 567-8900 '
            );
        });

        it('should handle invalid inputs', () => {
            expect(validationService.sanitizePhone(null)).toBe('');
        });
    });

    describe('sanitizeEmail', () => {
        it('should keep only valid email characters and lowercase', () => {
            expect(validationService.sanitizeEmail(' Test@Example.com ')).toBe('test@example.com');
            expect(validationService.sanitizeEmail('test<script>@example.com')).toBe(
                'testscript@example.com'
            );
        });

        it('should handle invalid inputs', () => {
            expect(validationService.sanitizeEmail(null)).toBe('');
        });
    });

    describe('validateObject', () => {
        it('should validate and sanitize a valid object', () => {
            const rules = {
                name: { type: 'string', required: true, minLength: 2 },
                age: { type: 'number', required: false, min: 0, max: 120 },
                email: { type: 'email', required: true },
                tags: { type: 'array', required: false, itemType: 'string' },
                isActive: { type: 'boolean', required: true }
            };

            const data = {
                name: ' John Doe <script>',
                age: '30',
                email: ' JOHN@EXAMPLE.COM ',
                tags: ['tag1', 'tag2<br>'],
                isActive: true
            };

            const result = validationService.validateObject(data, rules);

            expect(result.isValid).toBe(true);
            expect(Object.keys(result.errors).length).toBe(0);
            expect(result.sanitized.name).toBe('John Doe ');
            expect(result.sanitized.age).toBe(30);
            expect(result.sanitized.email).toBe('john@example.com');
            expect(result.sanitized.tags).toEqual(['tag1', 'tag2br']);
            expect(result.sanitized.isActive).toBe(true);
        });

        it('should return errors for invalid object', () => {
            const rules = {
                name: { type: 'string', required: true },
                age: { type: 'number', required: true, min: 18 },
                email: { type: 'email', required: true }
            };

            const data = {
                name: '', // Required
                age: 15, // Below min
                email: 'invalid' // Invalid email
            };

            const result = validationService.validateObject(data, rules);

            expect(result.isValid).toBe(false);
            expect(result.errors.name).toBeDefined();
            expect(result.errors.age).toBeDefined();
            expect(result.errors.email).toBeDefined();
        });

        it('should handle default values', () => {
            const rules = {
                status: { type: 'string', required: false, default: 'pending' }
            };

            const result = validationService.validateObject({}, rules);

            expect(result.isValid).toBe(true);
            expect(result.sanitized.status).toBe('pending');
        });
    });

    describe('validateInvitationData', () => {
        it('should validate valid invitation data', () => {
            const data = {
                guestNames: ['John Doe', 'Jane Doe'],
                numberOfPasses: 2,
                phone: '1234567890',
                status: 'pending'
            };

            const result = validationService.validateInvitationData(data);
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid invitation data', () => {
            const data = {
                guestNames: [], // Empty array
                numberOfPasses: 0, // Below min
                status: 'invalid_status'
            };

            const result = validationService.validateInvitationData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.guestNames).toBeDefined();
            expect(result.errors.numberOfPasses).toBeDefined();
            expect(result.errors.status).toBeDefined();
        });
    });

    describe('validateConfirmationData', () => {
        it('should validate valid confirmation data', () => {
            const data = {
                willAttend: true,
                attendingGuests: 2,
                attendingNames: ['John Doe', 'Jane Doe'],
                dietaryRestrictions: 'None'
            };

            const result = validationService.validateConfirmationData(data);
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid confirmation data', () => {
            const data = {
                willAttend: 'yes', // Should be boolean
                attendingGuests: 20 // Above max
            };

            const result = validationService.validateConfirmationData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.willAttend).toBeDefined();
            expect(result.errors.attendingGuests).toBeDefined();
        });
    });

    describe('generateInvitationCode', () => {
        it('should generate a code of correct length', () => {
            const code = validationService.generateInvitationCode();
            expect(code.length).toBe(6);
            expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
        });
    });
});
