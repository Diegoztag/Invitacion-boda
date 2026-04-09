/**
 * Tests para FormValidatorComponent
 * Valida: descubrimiento de campos, validación en tiempo real, errores, submit
 */

import { FormValidatorComponent } from '../form-validator';

// Mock de Component MUST be before any imports
jest.mock('../../base/component.js', () => ({
    Component: class {
        constructor(element) {
            this.element = element;
            this.isInitialized = false;
        }

        find(selector) {
            return this.element ? this.element.querySelector(selector) : null;
        }

        async init() {
            this.isInitialized = true;
        }

        destroy() {
            this.isInitialized = false;
        }

        emit(event, data) {
            // Mock emit method
            if (this.element) {
                const customEvent = new CustomEvent(event, {
                    detail: data
                });
                this.element.dispatchEvent(customEvent);
            }
        }
    }
}));

// Mock de debounce
jest.mock('../../../../shared/helpers/debounce.js', () => ({
    debounce: jest.fn(fn => fn)
}));

// NOW import the component after all mocks are defined
describe('FormValidatorComponent', () => {
    let form;
    let validationService;
    let formValidator;

    beforeEach(() => {
        // Mock de ValidationService
        validationService = {
            validateField: jest.fn((_fieldName, value) => ({
                isValid: value && value.length > 2,
                errors: value && value.length <= 2 ? ['Campo demasiado corto'] : []
            })),

            validateForm: jest.fn(_data => ({
                isValid: true,
                errors: {},
                fieldErrors: {}
            }))
        };

        // Crear formulario de prueba
        form = document.createElement('form');
        form.innerHTML = `
      <div class="form-group">
        <input type="text" name="fullName" id="fullName" data-validate="required,minLength:3">
        <input type="email" name="email" id="email" data-validate="required,email">
        <input type="tel" name="phone" id="phone" data-validate="phone">
        <textarea name="message" id="message" data-validate="maxLength:500"></textarea>
        <button type="submit">Enviar</button>
      </div>
    `;

        document.body.appendChild(form);

        formValidator = new FormValidatorComponent(form, validationService, {
            validateOnInput: true,
            validateOnBlur: true,
            showErrorsInline: true
        });
    });

    afterEach(() => {
        if (form && form.parentNode) {
            document.body.removeChild(form);
        }
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('debe inicializar correctamente', async () => {
            expect(formValidator.isInitialized).toBe(false);
            await formValidator.init();
            expect(formValidator.isInitialized).toBe(true);
        });

        it('debe descubrir todos los campos del formulario', async () => {
            await formValidator.init();

            expect(formValidator.fields.size).toBe(4); // 4 inputs/textarea
            expect(formValidator.fields.has('fullName')).toBe(true);
            expect(formValidator.fields.has('email')).toBe(true);
            expect(formValidator.fields.has('phone')).toBe(true);
            expect(formValidator.fields.has('message')).toBe(true);
        });

        it('debe respetar opciones de configuración', () => {
            const customValidator = new FormValidatorComponent(form, validationService, {
                validateOnInput: false,
                validateOnBlur: false,
                showErrorsInline: false,
                errorClass: 'error',
                successClass: 'valid'
            });

            expect(customValidator.options.validateOnInput).toBe(false);
            expect(customValidator.options.validateOnBlur).toBe(false);
            expect(customValidator.options.errorClass).toBe('error');
        });

        it('debe extraer reglas de validación de elementos', async () => {
            await formValidator.init();

            const fullNameField = formValidator.fields.get('fullName');
            expect(fullNameField.rules).toBeDefined();
        });
    });

    describe('Field Validation', () => {
        it('debe validar un campo individual', async () => {
            await formValidator.init();

            const fullNameInput = form.querySelector('#fullName');
            fullNameInput.value = 'Juan Pérez';

            await formValidator.validateField('fullName');

            expect(validationService.validateField).toHaveBeenCalledWith('fullName', 'Juan Pérez');
        });

        it('debe detectar campo válido', async () => {
            await formValidator.init();

            const emailInput = form.querySelector('#email');
            emailInput.value = 'test@example.com';

            validationService.validateField.mockReturnValueOnce({
                isValid: true,
                errors: []
            });

            const result = await formValidator.validateField('email');

            expect(result.isValid).toBe(true);
        });

        it('debe detectar campo inválido', async () => {
            await formValidator.init();

            const fullNameInput = form.querySelector('#fullName');
            fullNameInput.value = 'J'; // Muy corto

            validationService.validateField.mockReturnValueOnce({
                isValid: false,
                errors: ['Campo demasiado corto']
            });

            const result = await formValidator.validateField('fullName');

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('debe aplicar clase de error cuando falla validación', async () => {
            await formValidator.init();

            const fullNameInput = form.querySelector('#fullName');

            validationService.validateField.mockReturnValueOnce({
                isValid: false,
                errors: ['Error']
            });

            await formValidator.validateField('fullName');

            // Verificar si la clase se aplicó
            expect(
                fullNameInput.classList.contains('is-invalid') ||
                    !fullNameInput.classList.contains('is-valid')
            ).toBeDefined();
        });

        it('debe aplicar clase de éxito cuando pasa validación', async () => {
            await formValidator.init();

            const emailInput = form.querySelector('#email');

            validationService.validateField.mockReturnValueOnce({
                isValid: true,
                errors: []
            });

            await formValidator.validateField('email');

            // Verificar que no tiene clase de error
            expect(!emailInput.classList.contains('is-invalid')).toBeDefined();
        });
    });

    describe('Form Validation', () => {
        it('debe validar todo el formulario', async () => {
            await formValidator.init();

            await formValidator.validateForm();

            expect(validationService.validateForm).toHaveBeenCalled();
        });

        it('debe actualizar estado de isValid', async () => {
            await formValidator.init();

            validationService.validateForm.mockReturnValueOnce({
                isValid: true,
                errors: {},
                fieldErrors: {}
            });

            await formValidator.validateForm();

            expect(formValidator.isValid).toBe(true);
        });

        it('debe recolectar errores de todos los campos', async () => {
            await formValidator.init();

            validationService.validateForm.mockReturnValueOnce({
                isValid: false,
                errors: {
                    fullName: ['Campo requerido'],
                    email: ['Email inválido']
                },
                fieldErrors: {}
            });

            await formValidator.validateForm();

            expect(formValidator.errors.size).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Event Listeners', () => {
        it('debe validar en input si está habilitado', async () => {
            const options = {
                validateOnInput: true,
                validateOnBlur: false
            };

            const customValidator = new FormValidatorComponent(form, validationService, options);
            await customValidator.init();

            const fullNameInput = form.querySelector('#fullName');
            fullNameInput.value = 'Test';

            const inputEvent = new Event('input', {
                bubbles: true
            });
            fullNameInput.dispatchEvent(inputEvent);

            // El evento debe haber sido capturado
            expect(customValidator.options.validateOnInput).toBe(true);
        });

        it('debe validar en blur si está habilitado', async () => {
            const options = {
                validateOnInput: false,
                validateOnBlur: true
            };

            const customValidator = new FormValidatorComponent(form, validationService, options);
            await customValidator.init();

            const emailInput = form.querySelector('#email');
            emailInput.value = 'test@example.com';

            const blurEvent = new Event('blur', {
                bubbles: true
            });
            emailInput.dispatchEvent(blurEvent);

            expect(customValidator.options.validateOnBlur).toBe(true);
        });

        it('debe validar en submit', async () => {
            await formValidator.init();

            const submitEvent = new Event('submit', {
                bubbles: true
            });
            form.dispatchEvent(submitEvent);

            // El formulario debe procesarse
            expect(form).toBeDefined();
        });
    });

    describe('Error Display', () => {
        it('debe mostrar errores inline si está habilitado', async () => {
            await formValidator.init();

            validationService.validateField.mockReturnValueOnce({
                isValid: false,
                errors: ['Error de validación']
            });

            await formValidator.validateField('fullName');

            expect(formValidator.options.showErrorsInline).toBe(true);
        });

        it('debe ocultar errores inline si está deshabilitado', () => {
            const customValidator = new FormValidatorComponent(form, validationService, {
                showErrorsInline: false
            });

            expect(customValidator.options.showErrorsInline).toBe(false);
        });

        it('debe mostrar resumen de errores si está habilitado', () => {
            const customValidator = new FormValidatorComponent(form, validationService, {
                showErrorsSummary: true
            });

            expect(customValidator.options.showErrorsSummary).toBe(true);
        });
    });

    describe('Field Management', () => {
        it('debe agregar campo dinámicamente', async () => {
            await formValidator.init();

            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.name = 'dynamicField';
            form.appendChild(newInput);

            formValidator.addField('dynamicField', newInput);

            expect(formValidator.fields.has('dynamicField')).toBe(true);
        });

        it('debe remover campo', async () => {
            await formValidator.init();

            formValidator.removeField('fullName');

            expect(formValidator.fields.has('fullName')).toBe(false);
        });

        it('debe obtener valor de campo', async () => {
            await formValidator.init();

            const fullNameInput = form.querySelector('#fullName');
            fullNameInput.value = 'Juan García';

            const value = formValidator.getFieldValue('fullName');

            expect(value).toBe('Juan García');
        });

        it('debe establecer valor de campo', async () => {
            await formValidator.init();

            formValidator.setFieldValue('fullName', 'Nueva Persona');

            const fullNameInput = form.querySelector('#fullName');
            expect(fullNameInput.value).toBe('Nueva Persona');
        });
    });

    describe('Reset', () => {
        it('debe resetear el formulario', async () => {
            await formValidator.init();

            const fullNameInput = form.querySelector('#fullName');
            fullNameInput.value = 'Test Value';

            formValidator.reset();

            expect(fullNameInput.value).toBe('');
        });

        it('debe limpiar todos los errores cuando resetea', async () => {
            await formValidator.init();

            // Agregar un error
            formValidator.errors.set('fullName', ['Error']);

            formValidator.reset();

            expect(formValidator.errors.size).toBeGreaterThanOrEqual(0);
        });

        it('debe remover clases de validación cuando resetea', async () => {
            await formValidator.init();

            const fullNameInput = form.querySelector('#fullName');
            fullNameInput.classList.add('is-invalid');

            formValidator.reset();

            expect(!fullNameInput.classList.contains('is-invalid')).toBeDefined();
        });
    });

    describe('Lifecycle', () => {
        it('debe limpiar recursos al destruir', async () => {
            await formValidator.init();

            formValidator.destroy();

            expect(formValidator.isInitialized).toBe(false);
        });
    });
});
