/**
 * Componente de cuenta regresiva para la boda
 * Muestra el tiempo restante hasta el evento con actualización en tiempo real
 */

import { Component } from '../base/component.js';
import { EVENTS } from '../../../shared/constants/events.js';
import { SELECTORS } from '../../../shared/constants/selectors.js';
import { getConfig } from '../../../config/app-config.js';

export class CountdownComponent extends Component {
    constructor(element, targetDate) {
        super(element);
        this.targetDate = new Date(targetDate);
        this.interval = null;
        this.isFinished = false;
        this.updateInterval = getConfig('ui.countdown.updateInterval', 1000);
        this.format = getConfig('ui.countdown.format', 'DD:HH:MM:SS');
        this.showMilliseconds = getConfig('ui.countdown.showMilliseconds', false);

        // Elementos del DOM
        this.daysElement = null;
        this.hoursElement = null;
        this.minutesElement = null;
        this.secondsElement = null;
        this.millisecondsElement = null;
    }

    /**
     * Inicializa el componente
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('⏰ Initializing CountdownComponent...');

        // Validar fecha objetivo
        if (!this.isValidTargetDate()) {
            console.error('❌ Invalid target date for countdown');
            this.showError('Fecha de evento inválida');
            return;
        }

        // Inicializar elementos del DOM
        this.initializeElements();

        // Configurar estructura HTML si es necesaria
        this.setupHTML();

        // Iniciar la cuenta regresiva
        this.start();

        await super.init();
        console.log(
            `✅ CountdownComponent initialized - Target: ${this.targetDate.toLocaleDateString()}`
        );
    }

    /**
     * Inicializa los elementos del DOM
     */
    initializeElements() {
        if (!this.element) {
            console.error('❌ Countdown container element not found');
            return;
        }

        // Buscar elementos existentes
        this.daysElement = this.find(SELECTORS.COUNTDOWN.DAYS);
        this.hoursElement = this.find(SELECTORS.COUNTDOWN.HOURS);
        this.minutesElement = this.find(SELECTORS.COUNTDOWN.MINUTES);
        this.secondsElement = this.find(SELECTORS.COUNTDOWN.SECONDS);

        if (this.showMilliseconds) {
            this.millisecondsElement = this.find('.milliseconds');
        }
    }

    /**
     * Configura la estructura HTML si no existe
     */
    setupHTML() {
        // Si no existen los elementos, crear la estructura
        if (
            !this.daysElement ||
            !this.hoursElement ||
            !this.minutesElement ||
            !this.secondsElement
        ) {
            this.createCountdownStructure();
        }
    }

    /**
     * Crea la estructura HTML del countdown
     */
    createCountdownStructure() {
        const countdownHTML = `
            <div class="countdown-container">
                <div class="countdown-item">
                    <span id="days" class="countdown-number">00</span>
                    <span class="countdown-label">Días</span>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-item">
                    <span id="hours" class="countdown-number">00</span>
                    <span class="countdown-label">Horas</span>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-item">
                    <span id="minutes" class="countdown-number">00</span>
                    <span class="countdown-label">Minutos</span>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-item">
                    <span id="seconds" class="countdown-number">00</span>
                    <span class="countdown-label">Segundos</span>
                </div>
                ${
                    this.showMilliseconds
                        ? `
                <div class="countdown-separator">.</div>
                <div class="countdown-item">
                    <span class="milliseconds countdown-number">000</span>
                    <span class="countdown-label">ms</span>
                </div>
                `
                        : ''
                }
            </div>
        `;

        this.element.innerHTML = countdownHTML;

        // Re-inicializar elementos
        this.initializeElements();
    }

    /**
     * Inicia la cuenta regresiva
     */
    start() {
        if (this.interval) {
            this.stop();
        }

        // Actualizar inmediatamente
        this.updateCountdown();

        // Configurar intervalo
        const intervalTime = this.showMilliseconds ? 100 : this.updateInterval;
        this.interval = setInterval(() => {
            this.updateCountdown();
        }, intervalTime);

        console.log('▶️ Countdown started');
    }

    /**
     * Detiene la cuenta regresiva
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('⏸️ Countdown stopped');
        }
    }

    /**
     * Pausa la cuenta regresiva
     */
    pause() {
        this.stop();
        console.log('⏸️ Countdown paused');
    }

    /**
     * Reanuda la cuenta regresiva
     */
    resume() {
        if (!this.interval && !this.isFinished) {
            this.start();
            console.log('▶️ Countdown resumed');
        }
    }

    /**
     * Actualiza la cuenta regresiva
     */
    updateCountdown() {
        const now = new Date().getTime();
        const distance = this.targetDate.getTime() - now;

        // Verificar si el evento ya pasó
        if (distance < 0) {
            this.handleCountdownFinished();
            return;
        }

        // Calcular tiempo restante
        const timeLeft = this.calculateTimeLeft(distance);

        // Actualizar elementos del DOM
        this.updateDisplay(timeLeft);

        // Emitir evento de actualización
        this.emit(EVENTS.COUNTDOWN.UPDATED, {
            timeLeft,
            distance,
            isFinished: false
        });
    }

    /**
     * Calcula el tiempo restante
     * @param {number} distance - Distancia en milisegundos
     * @returns {Object}
     */
    calculateTimeLeft(distance) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const milliseconds = Math.floor(distance % 1000);

        return {
            days,
            hours,
            minutes,
            seconds,
            milliseconds,
            total: distance
        };
    }

    /**
     * Actualiza la visualización del countdown
     * @param {Object} timeLeft - Tiempo restante calculado
     */
    updateDisplay(timeLeft) {
        if (this.daysElement) {
            this.daysElement.textContent = this.formatNumber(timeLeft.days, 2);
        }

        if (this.hoursElement) {
            this.hoursElement.textContent = this.formatNumber(timeLeft.hours, 2);
        }

        if (this.minutesElement) {
            this.minutesElement.textContent = this.formatNumber(timeLeft.minutes, 2);
        }

        if (this.secondsElement) {
            this.secondsElement.textContent = this.formatNumber(timeLeft.seconds, 2);
        }

        if (this.millisecondsElement && this.showMilliseconds) {
            this.millisecondsElement.textContent = this.formatNumber(timeLeft.milliseconds, 3);
        }

        // Agregar clases CSS para animaciones
        this.addUpdateAnimation();
    }

    /**
     * Formatea un número con ceros a la izquierda
     * @param {number} num - Número a formatear
     * @param {number} digits - Número de dígitos
     * @returns {string}
     */
    formatNumber(num, digits = 2) {
        return String(num).padStart(digits, '0');
    }

    /**
     * Agrega animación de actualización
     */
    addUpdateAnimation() {
        if (this.secondsElement) {
            this.secondsElement.classList.add('countdown-update');
            setTimeout(() => {
                this.secondsElement.classList.remove('countdown-update');
            }, 200);
        }
    }

    /**
     * Maneja cuando la cuenta regresiva termina
     */
    handleCountdownFinished() {
        if (this.isFinished) {
            return;
        }

        this.isFinished = true;
        this.stop();

        // Mostrar mensaje de finalización
        this.showFinishedMessage();

        // Emitir evento de finalización
        this.emit(EVENTS.COUNTDOWN.FINISHED, {
            targetDate: this.targetDate,
            finishedAt: new Date()
        });

        console.log('🎉 Countdown finished - Event day has arrived!');
    }

    /**
     * Muestra el mensaje de finalización
     */
    showFinishedMessage() {
        const finishedHTML = `
            <div class="countdown-finished">
                <div class="countdown-finished-icon">🎉</div>
                <h3 class="countdown-finished-title">¡El gran día ha llegado!</h3>
                <p class="countdown-finished-message">Es hora de celebrar nuestra boda</p>
            </div>
        `;

        this.element.innerHTML = finishedHTML;
        this.addClass('countdown-ended');
    }

    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        const errorHTML = `
            <div class="countdown-error">
                <div class="countdown-error-icon">⚠️</div>
                <p class="countdown-error-message">${message}</p>
            </div>
        `;

        this.element.innerHTML = errorHTML;
        this.addClass('countdown-error');
    }

    /**
     * Valida la fecha objetivo
     * @returns {boolean}
     */
    isValidTargetDate() {
        return (
            this.targetDate instanceof Date &&
            !isNaN(this.targetDate.getTime()) &&
            this.targetDate > new Date('1900-01-01')
        );
    }

    /**
     * Actualiza la fecha objetivo
     * @param {Date|string} newTargetDate - Nueva fecha objetivo
     */
    updateTargetDate(newTargetDate) {
        const newDate = new Date(newTargetDate);

        if (!this.isValidTargetDate.call({ targetDate: newDate })) {
            console.error('❌ Invalid new target date');
            return;
        }

        this.targetDate = newDate;
        this.isFinished = false;

        // Reiniciar si estaba corriendo
        if (this.interval) {
            this.start();
        }

        console.log(`📅 Target date updated: ${this.targetDate.toLocaleDateString()}`);
    }

    /**
     * Obtiene el tiempo restante actual
     * @returns {Object|null}
     */
    getCurrentTimeLeft() {
        if (this.isFinished) {
            return null;
        }

        const now = new Date().getTime();
        const distance = this.targetDate.getTime() - now;

        if (distance < 0) {
            return null;
        }

        return this.calculateTimeLeft(distance);
    }

    /**
     * Verifica si la cuenta regresiva está activa
     * @returns {boolean}
     */
    isActive() {
        return this.interval !== null;
    }

    /**
     * Verifica si la cuenta regresiva ha terminado
     * @returns {boolean}
     */
    hasFinished() {
        return this.isFinished;
    }

    /**
     * Obtiene información del estado actual
     * @returns {Object}
     */
    getStatus() {
        return {
            isActive: this.isActive(),
            isFinished: this.hasFinished(),
            targetDate: this.targetDate,
            timeLeft: this.getCurrentTimeLeft()
        };
    }

    /**
     * Destruye el componente
     */
    destroy() {
        this.stop();
        this.targetDate = null;
        this.isFinished = false;

        // Limpiar elementos
        this.daysElement = null;
        this.hoursElement = null;
        this.minutesElement = null;
        this.secondsElement = null;
        this.millisecondsElement = null;

        super.destroy();
        console.log('🗑️ CountdownComponent destroyed');
    }
}
