/**
 * Constantes de selectores CSS utilizados en la aplicación
 */

export const SELECTORS = {
    // Navegación
    NAVIGATION: {
        NAVBAR: '#navbar',
        NAV_TOGGLE: '#navToggle',
        NAV_MENU: '#navMenu',
        NAV_LINKS: '.nav-link',
        NAV_LOGO: '.nav-logo'
    },
    
    // Secciones principales
    SECTIONS: {
        HERO: '.hero',
        INICIO: '#inicio',
        EVENTO: '#evento',
        ITINERARIO: '#itinerario',
        DRESS_CODE: '#dress-code',
        UBICACION: '#ubicacion',
        RSVP: '#rsvp',
        CAROUSEL: '#carousel',
        FOTOS: '#fotos',
        MESA_REGALOS: '#mesa-regalos'
    },
    
    // Hero section
    HERO: {
        SECTION: '.hero',
        TITLE: '#heroTitle',
        SUBTITLE: '#heroSubtitle',
        DATE_DAY: '#dateDay',
        DATE_MONTH: '#dateMonth',
        DATE_YEAR: '#dateYear'
    },
    
    // Evento section
    EVENTO: {
        CEREMONY_NAME: '#ceremonyName',
        CEREMONY_TIME: '#ceremonyTime',
        CEREMONY_VENUE: '#ceremonyVenue',
        CEREMONY_ADDRESS: '#ceremonyAddress',
        RECEPTION_NAME: '#receptionName',
        RECEPTION_TIME: '#receptionTime',
        RECEPTION_VENUE: '#receptionVenue',
        RECEPTION_ADDRESS: '#receptionAddress'
    },
    
    // Dress code section
    DRESS_CODE: {
        TITLE: '#dressCodeTitle',
        DESCRIPTION: '#dressCodeDescription',
        NOTE: '#dressCodeNote',
        NO_CHILDREN_NOTE: '#noChildrenNote',
        NO_CHILDREN_MESSAGE: '#noChildrenMessage'
    },
    
    // Itinerario section
    ITINERARIO: {
        TIMELINE: '#itineraryTimeline',
        ITEM: '.itinerary-item',
        DOT: '.itinerary-dot',
        CONTENT: '.itinerary-content',
        TIME: '.itinerary-time'
    },
    
    // Ubicación section
    UBICACION: {
        VENUE_NAME: '#locationVenueName',
        ADDRESS: '#locationAddress',
        MAP_IFRAME: '#mapIframe'
    },
    
    // RSVP section
    RSVP: {
        FORM: '#rsvpForm',
        GUEST_NAME: '#guestName',
        PHONE: '#phone',
        ATTENDANCE: 'input[name="attendance"]',
        GUEST_COUNT: '#guestCount',
        DIETARY_RESTRICTIONS: '#dietaryRestrictions',
        SUBMIT_BUTTON: '#submitRsvp',
        SUCCESS_MESSAGE: '#rsvpSuccessMessage',
        ERROR_MESSAGE: '#rsvpErrorMessage'
    },
    
    // Carousel section
    CAROUSEL: {
        CONTAINER: '#carousel',
        SECTION_TITLE: '#carouselSectionTitle',
        SECTION_SUBTITLE: '#carouselSectionSubtitle',
        SLIDES_CONTAINER: '#carouselTrack',
        SLIDE: '.carousel-slide',
        PREV_BUTTON: '#carouselPrev',
        NEXT_BUTTON: '#carouselNext',
        INDICATORS: '#carouselIndicators',
        INDICATOR: '.carousel-indicator'
    },
    
    // Fotos section
    FOTOS: {
        SECTION_TITLE: '#photoSectionTitle',
        SECTION_SUBTITLE: '#photoSectionSubtitle',
        INSTAGRAM_HASHTAG: '#instagramHashtag',
        HASHTAG_DESCRIPTION: '#hashtagDescription',
        HASHTAG_CONTAINER: '.hashtag-container'
    },
    
    // Mesa de regalos section
    MESA_REGALOS: {
        SECTION: '#mesa-regalos'
    },
    
    // Footer
    FOOTER: {
        NAMES: '#footerNames',
        DATE: '#footerDate',
        HASHTAG: '#footerHashtag'
    },
    
    // Countdown
    COUNTDOWN: {
        CONTAINER: '#countdown',
        DAYS: '#days',
        HOURS: '#hours',
        MINUTES: '#minutes',
        SECONDS: '#seconds',
        ENDED_MESSAGE: '.countdown-ended'
    },
    
    // Modal
    MODAL: {
        OVERLAY: '.modal-overlay',
        CONTAINER: '.modal-container',
        CONTENT: '.modal-content',
        CLOSE_BUTTON: '.modal-close',
        HEADER: '.modal-header',
        BODY: '.modal-body',
        FOOTER: '.modal-footer'
    },
    
    // Loader
    LOADER: {
        CONTAINER: '.loader',
        SPINNER: '.loader-spinner',
        TEXT: '.loader-text'
    },
    
    // Estados generales
    STATES: {
        ACTIVE: '.active',
        HIDDEN: '.hidden',
        VISIBLE: '.visible',
        LOADING: '.loading',
        ERROR: '.error',
        SUCCESS: '.success',
        DISABLED: '.disabled'
    }
};
