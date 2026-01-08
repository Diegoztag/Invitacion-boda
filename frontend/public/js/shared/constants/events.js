/**
 * Constantes de eventos personalizados de la aplicación
 */

export const EVENTS = {
    // Eventos de navegación
    NAVIGATION: {
        SECTION_CHANGED: 'navigation:section-changed',
        MENU_TOGGLED: 'navigation:menu-toggled',
        SCROLL_UPDATED: 'navigation:scroll-updated'
    },
    
    // Eventos de RSVP
    RSVP: {
        FORM_SUBMITTED: 'rsvp:form-submitted',
        VALIDATION_ERROR: 'rsvp:validation-error',
        CONFIRMATION_SUCCESS: 'rsvp:confirmation-success',
        CONFIRMATION_ERROR: 'rsvp:confirmation-error'
    },
    
    // Eventos de contenido
    CONTENT: {
        LOADED: 'content:loaded',
        UPDATED: 'content:updated',
        ERROR: 'content:error'
    },
    
    // Eventos de carousel
    CAROUSEL: {
        SLIDE_CHANGED: 'carousel:slide-changed',
        AUTOPLAY_STARTED: 'carousel:autoplay-started',
        AUTOPLAY_STOPPED: 'carousel:autoplay-stopped'
    },
    
    // Eventos de modal
    MODAL: {
        OPENED: 'modal:opened',
        CLOSED: 'modal:closed',
        BACKDROP_CLICKED: 'modal:backdrop-clicked'
    },
    
    // Eventos de countdown
    COUNTDOWN: {
        UPDATED: 'countdown:updated',
        FINISHED: 'countdown:finished'
    },
    
    // Eventos de aplicación
    APP: {
        INITIALIZED: 'app:initialized',
        ERROR: 'app:error',
        READY: 'app:ready'
    }
};
