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
        INVITATION_LOADED: 'rsvp:invitation-loaded',
        FORM_SUBMITTED: 'rsvp:form-submitted',
        VALIDATION_ERROR: 'rsvp:validation-error',
        CONFIRMATION_SUCCESS: 'rsvp:confirmation-success',
        CONFIRMATION_ERROR: 'rsvp:confirmation-error',
        BEFORE_SUBMIT: 'rsvp:before-submit',
        SUBMITTED: 'rsvp:submitted',
        SUBMIT_ERROR: 'rsvp:submit-error',
        FIELD_CHANGED: 'rsvp:field-changed',
        ERROR: 'rsvp:error'
    },

    // Eventos de Formulario
    FORM: {
        FIELD_VALIDATED: 'form:field-validated',
        VALID_SUBMIT: 'form:valid-submit',
        INVALID_SUBMIT: 'form:invalid-submit',
        VALIDATED: 'form:validated'
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
        INVITATION_LOADED: 'app:invitation-loaded',
        ERROR: 'app:error',
        READY: 'app:ready'
    }
};
