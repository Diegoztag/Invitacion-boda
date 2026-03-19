/**
 * Tests para ValidationService
 * Valida: email, phone, required fields, min/max length, custom rules
 */

import { ValidationService } from '../validation-service.js';

// Mock del config
jest.mock('../../../config/app-config.js', () => ({
  getConfig: jest.fn((key, defaultValue) => {
    const configs = {
      'validation.rules': {
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        phone: { required: false, minLength: 10, maxLength: 15 },
        name: { required: true, minLength: 2, maxLength: 100 },
        message: { required: false, maxLength: 500 }
      },
      'validation.messages': {
        required: 'El campo {field} es obligatorio',
        email: 'Ingrese un email válido',
        phone: 'Ingrese un teléfono válido',
        minLength: 'El campo {field} debe tener al menos {min} caracteres',
        maxLength: 'El campo {field} no puede exceder {max} caracteres'
      }
    };
    return configs[key] || defaultValue;
  })
}));

describe('ValidationService', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateField - Email', () => {
    it('debe validar email válido', () => {
      const result = validationService.validateField('email', 'test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar email sin @', () => {
      const result = validationService.validateField('email', 'testexample.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('debe rechazar email vacío si es requerido', () => {
      const result = validationService.validateField('email', '');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('obligatorio');
    });

    it('debe validar email con caracteres especiales válidos', () => {
      const result = validationService.validateField('email', 'user.name+tag@example.co.uk');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateField - Phone', () => {
    it('debe validar teléfono dentro del rango', () => {
      const result = validationService.validateField('phone', '1234567890');
      expect(result.isValid).toBe(true);
    });

    it('debe rechazar teléfono muy corto', () => {
      const result = validationService.validateField('phone', '123');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('al menos');
    });

    it('debe rechazar teléfono muy largo', () => {
      const result = validationService.validateField('phone', '12345678901234567');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceder');
    });

    it('debe permitir campo phone vacío (no requerido)', () => {
      const result = validationService.validateField('phone', '');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateField - Name', () => {
    it('debe validar nombre válido', () => {
      const result = validationService.validateField('name', 'Juan Pérez');
      expect(result.isValid).toBe(true);
    });

    it('debe rechazar nombre muy corto', () => {
      const result = validationService.validateField('name', 'A');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('al menos 2');
    });

    it('debe rechazar nombre vacío', () => {
      const result = validationService.validateField('name', '');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('obligatorio');
    });
  });

  describe('validateField - Custom Rules', () => {
    it('debe aplicar reglas personalizadas', () => {
      const customRules = { minLength: 5 };
      const result = validationService.validateField('name', 'Juan', customRules);
      expect(result.isValid).toBe(false);
    });

    it('debe sobrescribir reglas por defecto con custom rules', () => {
      const customRules = { minLength: 20 };
      const result = validationService.validateField('email', 'test@example.com', customRules);
      // Custom rules apply
      expect(result.isValid).toBe(false);
    });
  });

  describe('Custom Validators', () => {
    it('debe permitir registrar validadores personalizados', () => {
      const validator = (value) => ({
        isValid: value.startsWith('DR'),
        errors: value.startsWith('DR') ? [] : ['Debe comenzar con DR']
      });

      validationService.registerCustomValidator('cedula', validator);
      const result = validationService.validateField('cedula', '12345678', { required: true });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Debe comenzar con DR');
    });

    it('debe validar exitosamente con validador personalizado', () => {
      const validator = (value) => ({
        isValid: value.startsWith('DR'),
        errors: []
      });

      validationService.registerCustomValidator('cedula', validator);
      const result = validationService.validateField('cedula', 'DR12345678', { required: true });

      expect(result.isValid).toBe(true);
    });
  });

  describe('Error Messages Interpolation', () => {
    it('debe interpolar variables en mensajes de error', () => {
      const result = validationService.validateField('name', 'A');
      expect(result.errors[0]).toContain('2 caracteres');
    });

    it('debe incluir nombre del campo en el error', () => {
      const result = validationService.validateField('email', '');
      expect(result.errors[0]).toContain('email');
    });
  });
});
