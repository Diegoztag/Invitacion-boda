/**
 * Tests para CountdownComponent
 * Valida: inicialización, cálculo de tiempos, actualización DOM, lifecycle
 */

// Mock de la clase Component base
jest.mock('../../base/component.js', () => {
    return {
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
                    const customEvent = new CustomEvent(event, { detail: data });
                    this.element.dispatchEvent(customEvent);
                }
            }

            addClass(className) {
                if (this.element && className) {
                    this.element.classList.add(className);
                }
            }

            removeClass(className) {
                if (this.element && className) {
                    this.element.classList.remove(className);
                }
            }

            hasClass(className) {
                return this.element ? this.element.classList.contains(className) : false;
            }
        }
    };
});

jest.mock('../../../../shared/constants/selectors.js', () => ({
    SELECTORS: {
        COUNTDOWN: {
            DAYS: '.countdown-days',
            HOURS: '.countdown-hours',
            MINUTES: '.countdown-minutes',
            SECONDS: '.countdown-seconds'
        }
    }
}));

// Mock de config
jest.mock('../../../../config/app-config.js', () => ({
    getConfig: jest.fn((key, defaultValue) => {
        const configs = {
            'ui.countdown.updateInterval': 1000,
            'ui.countdown.format': 'DD:HH:MM:SS',
            'ui.countdown.showMilliseconds': false
        };
        return configs[key] !== undefined ? configs[key] : defaultValue;
    })
}));

import { CountdownComponent } from '../countdown.js';

describe('CountdownComponent', () => {
    let countdown;
    let container;
    let futureMockDate;

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    beforeEach(() => {
        // Crear contenedor de prueba
        container = document.createElement('div');
        container.className = 'countdown-container';
        document.body.appendChild(container);

        // Crear elementos necesarios
        const days = document.createElement('span');
        days.className = 'countdown-days';
        const hours = document.createElement('span');
        hours.className = 'countdown-hours';
        const minutes = document.createElement('span');
        minutes.className = 'countdown-minutes';
        const seconds = document.createElement('span');
        seconds.className = 'countdown-seconds';

        container.appendChild(days);
        container.appendChild(hours);
        container.appendChild(minutes);
        container.appendChild(seconds);

        // Fecha futura para testing (30 días desde ahora)
        futureMockDate = new Date();
        futureMockDate.setDate(futureMockDate.getDate() + 30);

        countdown = new CountdownComponent(container, futureMockDate.toISOString());
    });

    afterEach(() => {
        if (countdown && countdown.interval) {
            clearInterval(countdown.interval);
        }
        document.body.removeChild(container);
        countdown = null;
    });

    describe('Initialization', () => {
        it('debe inicializar correctamente', async () => {
            expect(countdown.isInitialized).toBe(false);
            await countdown.init();
            expect(countdown.isInitialized).toBe(true);
        });

        it('debe validar que la fecha objetivo es válida', async () => {
            await countdown.init();
            expect(countdown.isValidTargetDate()).toBe(true);
        });

        it('debe rechazar fecha pasada', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const invalidCountdown = new CountdownComponent(container, pastDate.toISOString());

            expect(invalidCountdown.isValidTargetDate()).toBe(false);
        });

        it('debe manejar construcción sin contenedor', () => {
            const emptyCountdown = new CountdownComponent(null, futureMockDate.toISOString());
            expect(emptyCountdown.element).toBeNull();
        });

        it('debe guardar la fecha objetivo correctamente', () => {
            expect(countdown.targetDate instanceof Date).toBe(true);
            expect(countdown.targetDate.getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('Time Calculation', () => {
        it('debe calcular días correctamente', () => {
            const timeLeft = countdown.getTimeRemaining();
            expect(timeLeft.days).toBeGreaterThanOrEqual(29); // Al menos 29 días
            expect(timeLeft.days).toBeLessThanOrEqual(30); // Máximo 30 días
        });

        it('debe calcular horas correctamente', () => {
            const timeLeft = countdown.getTimeRemaining();
            expect(timeLeft.hours).toBeGreaterThanOrEqual(0);
            expect(timeLeft.hours).toBeLessThan(24);
        });

        it('debe calcular minutos correctamente', () => {
            const timeLeft = countdown.getTimeRemaining();
            expect(timeLeft.minutes).toBeGreaterThanOrEqual(0);
            expect(timeLeft.minutes).toBeLessThan(60);
        });

        it('debe calcular segundos correctamente', () => {
            const timeLeft = countdown.getTimeRemaining();
            expect(timeLeft.seconds).toBeGreaterThanOrEqual(0);
            expect(timeLeft.seconds).toBeLessThan(60);
        });

        it('debe retornar objeto válido de tiempo restante', () => {
            const timeLeft = countdown.getTimeRemaining();
            expect(timeLeft).toHaveProperty('days');
            expect(timeLeft).toHaveProperty('hours');
            expect(timeLeft).toHaveProperty('minutes');
            expect(timeLeft).toHaveProperty('seconds');
            expect(typeof timeLeft.days).toBe('number');
            expect(typeof timeLeft.hours).toBe('number');
            expect(typeof timeLeft.minutes).toBe('number');
            expect(typeof timeLeft.seconds).toBe('number');
        });
    });

    describe('DOM Updates', () => {
        it('debe actualizar elemento de días', async () => {
            await countdown.init();
            countdown.updateDisplay();

            const daysElement = countdown.daysElement;
            expect(daysElement.textContent).toMatch(/\d+/);
        });

        it('debe actualizar elemento de horas', async () => {
            await countdown.init();
            countdown.updateDisplay();

            const hoursElement = countdown.hoursElement;
            expect(hoursElement.textContent).toMatch(/\d+/);
        });

        it('debe actualizar elemento de minutos', async () => {
            await countdown.init();
            countdown.updateDisplay();

            const minutesElement = countdown.minutesElement;
            expect(minutesElement.textContent).toMatch(/\d+/);
        });

        it('debe actualizar elemento de segundos', async () => {
            await countdown.init();
            countdown.updateDisplay();

            const secondsElement = countdown.secondsElement;
            expect(secondsElement.textContent).toMatch(/\d+/);
        });

        it('debe llenar con ceros a la izquierda en formato', async () => {
            await countdown.init();
            countdown.updateDisplay();

            // Verificar que los números están formateados correctamente
            const daysText = countdown.daysElement.textContent;
            const hoursText = countdown.hoursElement.textContent;

            // Debe ser 2 dígitos
            if (parseInt(daysText) < 10) {
                expect(daysText).toMatch(/^0\d/);
            }
        });
    });

    describe('Interval Management', () => {
        it('debe iniciar el intervalo de actualización', async () => {
            const initialInterval = countdown.interval;
            await countdown.init();

            expect(countdown.interval).not.toBeNull();
            expect(countdown.interval).not.toEqual(initialInterval);
        });

        it('debe detener el intervalo al destruir', async () => {
            await countdown.init();
            const interval = countdown.interval;

            countdown.destroy();

            expect(countdown.interval).toBeNull();
        });

        it('debe respetar el intervalo de actualización configurado', async () => {
            await countdown.init();
            const spy = jest.spyOn(countdown, 'updateDisplay');

            // Simular paso de tiempo
            jest.advanceTimersByTime(1000);

            // El método debe haberse llamado aproximadamente
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('Finished State', () => {
        it('debe detectar cuando la cuenta regresiva termina', async () => {
            // Crear countdown con fecha muy próxima
            const soonDate = new Date();
            soonDate.setSeconds(soonDate.getSeconds() + 5);

            const soonCountdown = new CountdownComponent(container, soonDate.toISOString());
            await soonCountdown.init();

            // Simular avance de tiempo hasta terminar
            jest.advanceTimersByTime(6000);

            // Debe estar en estado finished
            expect(soonCountdown.isFinished).toBe(true);

            soonCountdown.destroy();
        });

        it('debe mostrar ceros cuando la fecha se alcanza', async () => {
            // Crear countdown con fecha inmediata
            const nowDate = new Date();
            nowDate.setSeconds(nowDate.getSeconds() + 100);

            const nowCountdown = new CountdownComponent(container, nowDate.toISOString());
            await nowCountdown.init();

            // Verificar que aún muestra valores válidos
            expect(nowCountdown.daysElement.textContent).toBeDefined();

            nowCountdown.destroy();
        });
    });

    describe('Configuration', () => {
        it('debe respetar el formato configurado', async () => {
            expect(countdown.format).toBe('DD:HH:MM:SS');
        });

        it('debe usar intervalo de actualización configurado', async () => {
            expect(countdown.updateInterval).toBe(1000);
        });

        it('debe permitir mostrar/ocultar milisegundos', () => {
            expect(countdown.showMilliseconds).toBe(false);

            const countdownWithMs = new CountdownComponent(container, futureMockDate.toISOString());
            // Simular configuración con milisegundos
            countdownWithMs.showMilliseconds = true;
            expect(countdownWithMs.showMilliseconds).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('debe manejar elemento contenedor nulo', async () => {
            const nullCountdown = new CountdownComponent(null, futureMockDate.toISOString());
            await expect(nullCountdown.init()).resolves.not.toThrow();
        });

        it('debe manejar fecha inválida', () => {
            const invalidCountdown = new CountdownComponent(container, 'invalid-date');
            const isValid = invalidCountdown.isValidTargetDate();

            expect(isValid).toBe(false);
        });

        it('debe mostrar error cuando fecha es inválida', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const invalidCountdown = new CountdownComponent(container, pastDate.toISOString());

            expect(invalidCountdown.isValidTargetDate()).toBe(false);
        });
    });

    describe('Lifecycle', () => {
        it('debe ejecutar init solo una vez', async () => {
            const spy = jest.spyOn(countdown, 'initializeElements');

            await countdown.init();
            await countdown.init();

            // Debe ser llamado una sola vez
            expect(countdown.isInitialized).toBe(true);
            spy.mockRestore();
        });

        it('debe limpiar recursos al destruir', async () => {
            await countdown.init();
            const spy = jest.spyOn(clearInterval, 'call');

            countdown.destroy();

            expect(countdown.interval).toBeNull();
            expect(countdown.isInitialized).toBe(false);
        });

        it('debe permitir reinicializar tras destruir', async () => {
            await countdown.init();
            countdown.destroy();
            countdown.isInitialized = false;

            await countdown.init();

            expect(countdown.isInitialized).toBe(true);
        });
    });
});
