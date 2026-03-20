/**
 * Controlador de Tema
 * Maneja la funcionalidad de cambio de tema (claro/oscuro)
 */

import { EVENTS } from '../../shared/constants/events.js';
import { SELECTORS } from '../../shared/constants/selectors.js';

export class ThemeController {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            storageKey: 'theme',
            defaultTheme: 'light',
            toggleClass: 'dark-mode',
            ...options
        };

        this.themeToggleButton = null;
        this.currentTheme = this.options.defaultTheme;
        this.isInitialized = false;
    }

    /**
     * Inicializa el controlador
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        console.log('🎨 Initializing ThemeController...');

        // Descubrir elementos
        this.discoverElements();

        // Configurar event listeners
        this.setupEventListeners();

        // Cargar tema inicial
        this.loadInitialTheme();

        this.isInitialized = true;
        console.log('✅ ThemeController initialized');
    }

    /**
     * Descubre los elementos del DOM
     */
    discoverElements() {
        this.themeToggleButton = this.container.querySelector(SELECTORS.THEME.TOGGLE_BUTTON);

        if (!this.themeToggleButton) {
            console.warn('Theme toggle button not found');
        }
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        if (this.themeToggleButton) {
            this.themeToggleButton.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * Carga el tema inicial desde el almacenamiento local o las preferencias del sistema
     */
    loadInitialTheme() {
        const savedTheme = localStorage.getItem(this.options.storageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const initialTheme = savedTheme || (prefersDark ? 'dark' : this.options.defaultTheme);
        this.setTheme(initialTheme);
    }

    /**
     * Cambia el tema actual
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Establece un tema específico
     * @param {string} theme - 'light' o 'dark'
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            return;
        }

        this.currentTheme = theme;
        document.body.classList.toggle(this.options.toggleClass, theme === 'dark');
        localStorage.setItem(this.options.storageKey, theme);

        // Actualizar estado del botón
        if (this.themeToggleButton) {
            this.themeToggleButton.setAttribute('aria-pressed', theme === 'dark');
        }

        // Emitir evento de cambio de tema
        this.emit(EVENTS.THEME.CHANGED, { theme: this.currentTheme });
    }

    /**
     * Obtiene el tema actual
     * @returns {string}
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Registra un listener para eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        if (!this.eventListeners.has(`custom-${event}`)) {
            this.eventListeners.set(`custom-${event}`, []);
        }
        this.eventListeners.get(`custom-${event}`).push(callback);
    }

    /**
     * Emite un evento
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(`custom-${event}`)) {
            this.eventListeners.get(`custom-${event}`).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Destruye el controlador
     */
    destroy() {
        if (this.themeToggleButton) {
            this.themeToggleButton.removeEventListener('click', () => this.toggleTheme());
        }
        this.isInitialized = false;
        console.log('🗑️ ThemeController destroyed');
    }
}
