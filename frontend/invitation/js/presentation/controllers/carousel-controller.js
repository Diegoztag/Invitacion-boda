/**
 * Controlador de Carrusel
 * Maneja la funcionalidad de carrusel de imágenes y contenido
 */

import { EVENTS } from '../../shared/constants/events.js';
import { SELECTORS } from '../../shared/constants/selectors.js';
import { DOMUtils } from '../../shared/utils/dom-utils.js';
import { debounce } from '../../shared/helpers/debounce.js';

export class CarouselController {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            autoPlay: true,
            autoPlayInterval: 5000,
            loop: true,
            showDots: true,
            showArrows: true,
            swipeEnabled: true,
            keyboardEnabled: true,
            pauseOnHover: true,
            animationDuration: 600, // Sincronizado con CSS (0.6s)
            animationType: 'slide', // 'slide', 'fade', 'scale'
            ...options
        };
        
        this.slides = [];
        this.currentSlide = 0;
        this.totalSlides = 0; // Total de slides reales
        this.isPlaying = false;
        this.isTransitioning = false;
        this.autoPlayTimer = null;
        
        // Elementos del DOM
        this.slidesContainer = null;
        this.slideElements = []; // Todos los slides (incluyendo clones)
        this.realSlideElements = []; // Solo slides originales
        this.dotsContainer = null;
        this.dotElements = [];
        this.prevButton = null;
        this.nextButton = null;
        
        // Touch/Swipe
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        
        this.eventListeners = new Map();
        this.isInitialized = false;
        
        // Debounced resize handler
        this.debouncedResize = debounce(this.handleResize.bind(this), 250);
    }
    
    /**
     * Inicializa el controlador
     */
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        // Descubrir elementos del carrusel
        this.discoverCarouselElements();
        
        // Configurar estructura si es necesario
        this.setupCarouselStructure();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Inicializar estado
        this.initializeCarousel();
        
        // Iniciar autoplay si está habilitado
        if (this.options.autoPlay) {
            this.startAutoPlay();
        }
        
        this.isInitialized = true;
    }
    
    /**
     * Descubre elementos del carrusel
     */
    discoverCarouselElements() {
        // Container de slides
        this.slidesContainer = this.container.querySelector(SELECTORS.CAROUSEL.SLIDES_CONTAINER) ||
                              this.container.querySelector('.carousel-slides') ||
                              this.container.querySelector('[data-carousel-slides]');
        
        if (!this.slidesContainer) {
            console.warn('Carousel slides container not found');
            return;
        }
        
        // Slides individuales iniciales (antes de clonar)
        this.slideElements = Array.from(
            this.slidesContainer.querySelectorAll(SELECTORS.CAROUSEL.SLIDE) ||
            this.slidesContainer.querySelectorAll('.carousel-slide') ||
            this.slidesContainer.querySelectorAll('[data-carousel-slide]') ||
            this.slidesContainer.children
        );
        
        // Botones de navegación
        this.prevButton = this.container.querySelector(SELECTORS.CAROUSEL.PREV_BUTTON) ||
                         this.container.querySelector('.carousel-prev') ||
                         this.container.querySelector('[data-carousel-prev]');
        
        this.nextButton = this.container.querySelector(SELECTORS.CAROUSEL.NEXT_BUTTON) ||
                         this.container.querySelector('.carousel-next') ||
                         this.container.querySelector('[data-carousel-next]');
        
        // Container de dots
        this.dotsContainer = this.container.querySelector(SELECTORS.CAROUSEL.DOTS_CONTAINER) ||
                            this.container.querySelector('.carousel-dots') ||
                            this.container.querySelector('[data-carousel-dots]');
        
        this.totalSlides = this.slideElements.length;
        this.realSlideElements = [...this.slideElements];
    }
    
    /**
     * Configura la estructura del carrusel
     */
    setupCarouselStructure() {
        if (!this.slidesContainer || this.totalSlides === 0) {
            return;
        }

        // Clonar primer y último slide para efecto infinito
        if (this.totalSlides > 1) {
            const firstClone = this.realSlideElements[0].cloneNode(true);
            const lastClone = this.realSlideElements[this.totalSlides - 1].cloneNode(true);

            firstClone.classList.add('carousel-clone');
            lastClone.classList.add('carousel-clone');
            firstClone.setAttribute('aria-hidden', 'true');
            lastClone.setAttribute('aria-hidden', 'true');

            // Añadir clones al DOM
            this.slidesContainer.appendChild(firstClone);
            this.slidesContainer.insertBefore(lastClone, this.realSlideElements[0]);

            // Actualizar lista de elementos incluyendo clones
            this.slideElements = Array.from(this.slidesContainer.children);
        }
        
        // Configurar slides reales
        this.realSlideElements.forEach((slide, index) => {
            slide.classList.add('carousel-slide');
            slide.setAttribute('data-slide-index', index);
            
            if (index === 0) {
                slide.classList.add('active');
            }
            
            // Configurar lazy loading si hay imágenes
            this.setupLazyLoading(slide);
        });

        // Configurar lazy loading para clones también
        if (this.totalSlides > 1) {
            this.setupLazyLoading(this.slideElements[0]); // Last clone
            this.setupLazyLoading(this.slideElements[this.slideElements.length - 1]); // First clone
        }
        
        // Crear botones si no existen y están habilitados
        if (this.options.showArrows && (!this.prevButton || !this.nextButton)) {
            this.createNavigationButtons();
        }
        
        // Crear dots si no existen y están habilitados
        if (this.options.showDots && !this.dotsContainer) {
            this.createDots();
        }
        
        // Configurar clases CSS
        this.container.classList.add('carousel-container');
        this.slidesContainer.classList.add('carousel-slides-container');
        
        // Configurar tipo de animación
        this.container.classList.add(`carousel-${this.options.animationType}`);

        // Posicionar inicialmente en el primer slide real (índice 1)
        if (this.totalSlides > 1) {
            this.slidesContainer.style.transform = `translateX(-100%)`;
        }
    }
    
    /**
     * Configura lazy loading para imágenes
     * @param {HTMLElement} slide - Elemento del slide
     */
    setupLazyLoading(slide) {
        const images = slide.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.classList.add('lazy-load');
        });
    }
    
    /**
     * Crea botones de navegación
     */
    createNavigationButtons() {
        if (!this.prevButton) {
            this.prevButton = document.createElement('button');
            this.prevButton.className = 'carousel-btn carousel-prev';
            this.prevButton.innerHTML = '<span aria-hidden="true">‹</span>';
            this.prevButton.setAttribute('aria-label', 'Slide anterior');
            this.container.appendChild(this.prevButton);
        }
        
        if (!this.nextButton) {
            this.nextButton = document.createElement('button');
            this.nextButton.className = 'carousel-btn carousel-next';
            this.nextButton.innerHTML = '<span aria-hidden="true">›</span>';
            this.nextButton.setAttribute('aria-label', 'Siguiente slide');
            this.container.appendChild(this.nextButton);
        }
    }
    
    /**
     * Crea indicadores de dots
     */
    createDots() {
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'carousel-dots';
        
        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            dot.setAttribute('data-slide', i);
            dot.setAttribute('aria-label', `Ir al slide ${i + 1}`);
            
            if (i === 0) {
                dot.classList.add('active');
            }
            
            this.dotsContainer.appendChild(dot);
            this.dotElements.push(dot);
        }
        
        this.container.appendChild(this.dotsContainer);
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botones de navegación
        if (this.prevButton) {
            const prevHandler = () => this.prevSlide();
            this.prevButton.addEventListener('click', prevHandler);
            this.eventListeners.set('prev-click', {
                element: this.prevButton,
                event: 'click',
                handler: prevHandler
            });
        }
        
        if (this.nextButton) {
            const nextHandler = () => this.nextSlide();
            this.nextButton.addEventListener('click', nextHandler);
            this.eventListeners.set('next-click', {
                element: this.nextButton,
                event: 'click',
                handler: nextHandler
            });
        }
        
        // Dots
        if (this.dotsContainer) {
            const dotsHandler = (e) => {
                if (e.target.classList.contains('carousel-dot')) {
                    const slideIndex = parseInt(e.target.getAttribute('data-slide'));
                    this.goToSlide(slideIndex);
                }
            };
            
            this.dotsContainer.addEventListener('click', dotsHandler);
            this.eventListeners.set('dots-click', {
                element: this.dotsContainer,
                event: 'click',
                handler: dotsHandler
            });
        }
        
        // Touch/Swipe events
        if (this.options.swipeEnabled && this.slidesContainer) {
            this.setupTouchEvents();
        }
        
        // Keyboard navigation
        if (this.options.keyboardEnabled) {
            this.setupKeyboardEvents();
        }
        
        // Pause on hover
        if (this.options.pauseOnHover) {
            this.setupHoverEvents();
        }
        
        // Resize handler
        const resizeHandler = () => this.debouncedResize();
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.set('resize', {
            element: window,
            event: 'resize',
            handler: resizeHandler
        });
        
        // Visibility change (pause when tab is hidden)
        const visibilityHandler = () => {
            if (document.hidden) {
                this.pauseAutoPlay();
            } else if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        };
        
        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.set('visibility', {
            element: document,
            event: 'visibilitychange',
            handler: visibilityHandler
        });
    }
    
    /**
     * Configura eventos touch/swipe
     */
    setupTouchEvents() {
        const touchStartHandler = (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.pauseAutoPlay();
        };
        
        const touchMoveHandler = (e) => {
            // Prevenir scroll si es swipe horizontal
            const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
            const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);
            
            if (deltaX > deltaY) {
                e.preventDefault();
            }
        };
        
        const touchEndHandler = (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe();
            
            if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        };
        
        this.slidesContainer.addEventListener('touchstart', touchStartHandler, { passive: false });
        this.slidesContainer.addEventListener('touchmove', touchMoveHandler, { passive: false });
        this.slidesContainer.addEventListener('touchend', touchEndHandler);
        
        this.eventListeners.set('touch-start', {
            element: this.slidesContainer,
            event: 'touchstart',
            handler: touchStartHandler
        });
        
        this.eventListeners.set('touch-move', {
            element: this.slidesContainer,
            event: 'touchmove',
            handler: touchMoveHandler
        });
        
        this.eventListeners.set('touch-end', {
            element: this.slidesContainer,
            event: 'touchend',
            handler: touchEndHandler
        });
    }
    
    /**
     * Configura eventos de teclado
     */
    setupKeyboardEvents() {
        const keyHandler = (e) => {
            if (!this.container.contains(document.activeElement)) {
                return;
            }
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.totalSlides - 1);
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleAutoPlay();
                    break;
            }
        };
        
        document.addEventListener('keydown', keyHandler);
        this.eventListeners.set('keyboard', {
            element: document,
            event: 'keydown',
            handler: keyHandler
        });
    }
    
    /**
     * Configura eventos hover
     */
    setupHoverEvents() {
        const mouseEnterHandler = () => this.pauseAutoPlay();
        const mouseLeaveHandler = () => {
            if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        };
        
        this.container.addEventListener('mouseenter', mouseEnterHandler);
        this.container.addEventListener('mouseleave', mouseLeaveHandler);
        
        this.eventListeners.set('mouse-enter', {
            element: this.container,
            event: 'mouseenter',
            handler: mouseEnterHandler
        });
        
        this.eventListeners.set('mouse-leave', {
            element: this.container,
            event: 'mouseleave',
            handler: mouseLeaveHandler
        });
    }
    
    /**
     * Inicializa el carrusel
     */
    initializeCarousel() {
        if (this.totalSlides === 0) {
            return;
        }
        
        // Configurar slide inicial
        this.updateSlideVisibility();
        this.updateDots();
        this.updateButtons();
        
        // Cargar imágenes del primer slide (índice lógico 0)
        this.loadSlideImages(0);
        
        // Precargar siguiente slide si existe
        if (this.totalSlides > 1) {
            this.loadSlideImages(1);
            // También cargar imágenes de los clones por si acaso
            this.loadSlideImages(-1); // Clone last
            this.loadSlideImages(this.totalSlides); // Clone first
        }
    }
    
    /**
     * Va al slide anterior
     */
    prevSlide() {
        if (this.isTransitioning) {
            return;
        }
        
        let prevIndex = this.currentSlide - 1;
        
        if (prevIndex < 0) {
            if (this.options.loop) {
                prevIndex = this.totalSlides - 1;
            } else {
                return;
            }
        }
        
        this.goToSlide(prevIndex);
    }
    
    /**
     * Va al siguiente slide
     */
    nextSlide() {
        if (this.isTransitioning) {
            return;
        }
        
        let nextIndex = this.currentSlide + 1;
        
        if (nextIndex >= this.totalSlides) {
            if (this.options.loop) {
                nextIndex = 0;
            } else {
                return;
            }
        }
        
        this.goToSlide(nextIndex);
    }
    
    /**
     * Va a un slide específico
     * @param {number} slideIndex - Índice del slide
     */
    async goToSlide(slideIndex) {
        if (this.isTransitioning) {
            return;
        }
        
        // Validar índice
        if (slideIndex < 0) slideIndex = this.totalSlides - 1;
        if (slideIndex >= this.totalSlides) slideIndex = 0;
        
        if (slideIndex === this.currentSlide) return;
        
        this.isTransitioning = true;
        const previousSlide = this.currentSlide;
        
        // Determinar target físico
        // Los slides reales están en índices 1 a N
        let physicalTargetIndex = slideIndex + 1;
        
        // Manejo especial para loop infinito
        if (this.totalSlides > 1) {
            if (previousSlide === this.totalSlides - 1 && slideIndex === 0) {
                // Ir del último al primero (hacia adelante) -> ir al clon del primero (índice N+1)
                physicalTargetIndex = this.totalSlides + 1;
            } else if (previousSlide === 0 && slideIndex === this.totalSlides - 1) {
                // Ir del primero al último (hacia atrás) -> ir al clon del último (índice 0)
                physicalTargetIndex = 0;
            }
        }

        this.currentSlide = slideIndex;
        
        // Emitir evento antes del cambio
        this.emit(EVENTS.CAROUSEL.BEFORE_SLIDE_CHANGE, {
            from: previousSlide,
            to: slideIndex
        });
        
        // Cargar imágenes
        this.loadSlideImages(slideIndex);
        
        // Realizar transición
        await this.performTransition(physicalTargetIndex);
        
        // Si estamos en un clon, saltar silenciosamente al real
        if (this.totalSlides > 1) {
            if (physicalTargetIndex === 0) {
                // Estábamos en clon del último, saltar al último real (índice N)
                this.jumpToSlideWithoutAnimation(this.totalSlides);
            } else if (physicalTargetIndex === this.totalSlides + 1) {
                // Estábamos en clon del primero, saltar al primero real (índice 1)
                this.jumpToSlideWithoutAnimation(1);
            }
        }
        
        // Actualizar UI
        this.updateSlideVisibility();
        this.updateDots();
        this.updateButtons();
        
        this.isTransitioning = false;
        
        // Emitir evento después del cambio
        this.emit(EVENTS.CAROUSEL.SLIDE_CHANGED, {
            from: previousSlide,
            to: slideIndex,
            slide: this.realSlideElements[slideIndex]
        });
    }
    
    /**
     * Realiza la transición visual
     * @param {number} physicalIndex - Índice físico en el DOM
     * @returns {Promise}
     */
    performTransition(physicalIndex) {
        return new Promise((resolve) => {
            if (this.slidesContainer) {
                // Asegurar que la transición esté activa con la duración configurada
                this.slidesContainer.style.transition = `transform ${this.options.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`; 
                this.slidesContainer.style.transform = `translateX(-${physicalIndex * 100}%)`;
            }
            
            // Esperar a que termine la transición + pequeño buffer de seguridad
            setTimeout(() => {
                resolve();
            }, this.options.animationDuration + 50);
        });
    }

    /**
     * Salta a un slide sin animación (para el loop infinito)
     * @param {number} physicalIndex - Índice físico destino
     */
    jumpToSlideWithoutAnimation(physicalIndex) {
        if (this.slidesContainer) {
            // Desactivar transición
            this.slidesContainer.style.transition = 'none';
            // Mover instantáneamente
            this.slidesContainer.style.transform = `translateX(-${physicalIndex * 100}%)`;
            // Forzar reflow para que el navegador aplique el cambio inmediatamente
            this.slidesContainer.offsetHeight;
            // Restaurar transición (quitando el estilo inline para que use el CSS)
            this.slidesContainer.style.transition = '';
        }
    }
    
    /**
     * Actualiza la visibilidad de los slides
     */
    updateSlideVisibility() {
        // Actualizar solo slides reales para accesibilidad
        this.realSlideElements.forEach((slide, index) => {
            if (index === this.currentSlide) {
                slide.classList.add('active');
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.classList.remove('active');
                slide.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    /**
     * Actualiza los dots indicadores
     */
    updateDots() {
        if (!this.dotsContainer) return;
        
        this.dotElements.forEach((dot, index) => {
            if (index === this.currentSlide) {
                dot.classList.add('active');
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.classList.remove('active');
                dot.removeAttribute('aria-current');
            }
        });
    }
    
    /**
     * Actualiza el estado de los botones
     */
    updateButtons() {
        if (!this.options.loop) {
            if (this.prevButton) {
                this.prevButton.disabled = this.currentSlide === 0;
            }
            
            if (this.nextButton) {
                this.nextButton.disabled = this.currentSlide === this.totalSlides - 1;
            }
        }
    }
    
    /**
     * Carga imágenes de un slide específico
     * @param {number} slideIndex - Índice lógico del slide (-1 y totalSlides para clones)
     */
    loadSlideImages(slideIndex) {
        let targetSlide;
        
        if (slideIndex === -1) {
            // Clone last (primer elemento físico)
            targetSlide = this.slideElements[0];
        } else if (slideIndex === this.totalSlides) {
            // Clone first (último elemento físico)
            targetSlide = this.slideElements[this.slideElements.length - 1];
        } else if (slideIndex >= 0 && slideIndex < this.totalSlides) {
            // Slide real (índice físico + 1)
            targetSlide = this.realSlideElements[slideIndex];
        } else {
            return;
        }
        
        if (!targetSlide) return;

        const lazyImages = targetSlide.querySelectorAll('img[data-src]');
        
        lazyImages.forEach(img => {
            if (!img.src) {
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                img.classList.remove('lazy-load');
                
                img.onload = () => {
                    img.classList.add('loaded');
                };
                
                img.onerror = () => {
                    img.classList.add('error');
                };
            }
        });
    }
    
    /**
     * Maneja el swipe touch
     */
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = Math.abs(this.touchEndY - this.touchStartY);
        
        // Solo procesar si es un swipe horizontal
        if (Math.abs(deltaX) < this.minSwipeDistance || deltaY > Math.abs(deltaX)) {
            return;
        }
        
        if (deltaX > 0) {
            // Swipe derecha - slide anterior
            this.prevSlide();
        } else {
            // Swipe izquierda - slide siguiente
            this.nextSlide();
        }
    }
    
    /**
     * Maneja el resize de la ventana
     */
    handleResize() {
        // Recalcular posiciones si es necesario
        this.updateSlideVisibility();
        
        // Emitir evento de resize
        this.emit(EVENTS.CAROUSEL.RESIZED, {
            currentSlide: this.currentSlide
        });
    }
    
    /**
     * Inicia el autoplay
     */
    startAutoPlay() {
        if (this.isPlaying || this.totalSlides <= 1) {
            return;
        }
        
        this.isPlaying = true;
        this.autoPlayTimer = setInterval(() => {
            this.nextSlide();
        }, this.options.autoPlayInterval);
    }
    
    /**
     * Pausa el autoplay
     */
    pauseAutoPlay() {
        if (!this.isPlaying) {
            return;
        }
        
        this.isPlaying = false;
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    
    /**
     * Alterna el autoplay
     */
    toggleAutoPlay() {
        if (this.isPlaying) {
            this.pauseAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }
    
    /**
     * Obtiene el slide actual
     * @returns {number}
     */
    getCurrentSlide() {
        return this.currentSlide;
    }
    
    /**
     * Obtiene el total de slides
     * @returns {number}
     */
    getTotalSlides() {
        return this.totalSlides;
    }
    
    /**
     * Verifica si está en autoplay
     * @returns {boolean}
     */
    isAutoPlaying() {
        return this.isPlaying;
    }
    
    /**
     * Verifica si está en transición
     * @returns {boolean}
     */
    isInTransition() {
        return this.isTransitioning;
    }
    
    /**
     * Registra un listener para eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    on(event, callback) {
        if (!this.eventListeners.has(`custom-${event}`)) {
            this.eventListeners.set(`custom-${event}`, []);
        }
        this.eventListeners.get(`custom-${event}`).push(callback);
    }
    
    /**
     * Remueve un listener de eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(`custom-${event}`);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emite un evento
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(`custom-${event}`);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        
        // También emitir en el contenedor como evento DOM
        if (this.container) {
            const customEvent = new CustomEvent(event, { detail: data });
            this.container.dispatchEvent(customEvent);
        }
    }
    
    /**
     * Actualiza las opciones del controlador
     * @param {Object} newOptions - Nuevas opciones
     */
    updateOptions(newOptions) {
        const oldOptions = { ...this.options };
        this.options = { ...this.options, ...newOptions };
        
        // Reconfigurar autoplay si cambió
        if (oldOptions.autoPlay !== this.options.autoPlay) {
            if (this.options.autoPlay) {
                this.startAutoPlay();
            } else {
                this.pauseAutoPlay();
            }
        }
        
        // Reconfigurar intervalo si cambió
        if (oldOptions.autoPlayInterval !== this.options.autoPlayInterval && this.isPlaying) {
            this.pauseAutoPlay();
            this.startAutoPlay();
        }
    }
    
    /**
     * Destruye el controlador y limpia recursos
     */
    destroy() {
        // Parar autoplay
        this.pauseAutoPlay();
        
        // Remover event listeners
        this.eventListeners.forEach((listener, key) => {
            if (listener.element && listener.handler) {
                listener.element.removeEventListener(listener.event, listener.handler);
            }
        });
        
        // Limpiar referencias
        this.eventListeners.clear();
        this.slideElements = [];
        this.realSlideElements = [];
        this.dotElements = [];
        this.slidesContainer = null;
        this.dotsContainer = null;
        this.prevButton = null;
        this.nextButton = null;
        this.container = null;
        this.autoPlayTimer = null;
        this.debouncedResize = null;
        
        this.isInitialized = false;
    }
}
