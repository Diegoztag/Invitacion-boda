/**
 * I18n Service
 * Maneja la internacionalización de la aplicación
 */
export class I18nService {
    constructor() {
        this.currentLocale = 'es';
        this.translations = {
            es: {
                nav: {
                    home: 'Inicio',
                    event: 'El Evento',
                    itinerary: 'Itinerario',
                    location: 'Ubicación',
                    rsvp: 'Confirmar Asistencia',
                    gifts: 'Mesa de Regalos',
                    gallery: 'Galería',
                    photos: 'Fotos'
                },
                hero: {
                    subtitle: 'Nos casamos',
                    days: 'Días',
                    hours: 'Horas',
                    minutes: 'Minutos',
                    seconds: 'Segundos'
                },
                event: {
                    title: 'Detalles del Evento',
                    ceremony: 'Ceremonia Civil',
                    reception: 'Recepción',
                    dressCode: 'Código de Vestimenta',
                    dressCodeDesc: 'Formal - Evitar colores pasteles',
                    dressCodeNote: 'Recuerden que será al aire libre, asistan bien abrigados'
                },
                itinerary: {
                    title: 'Itinerario del Día',
                    ceremony: 'Ceremonia Civil',
                    ceremonyDesc: 'Firma de documentos',
                    photos: 'Sesión de Fotos',
                    photosDesc: 'Fotos con familia y amigos',
                    arrival: 'Llegada de Invitados',
                    arrivalDesc: 'Recepción en la hacienda',
                    cocktail: 'Cocktail de Bienvenida',
                    cocktailDesc: 'Aperitivos y bebidas',
                    dinner: 'Cena',
                    dinnerDesc: 'Banquete de celebración',
                    firstDance: 'Primer Baile',
                    firstDanceDesc: 'Los novios abren la pista',
                    party: 'Fiesta',
                    partyDesc: '¡A bailar toda la noche!'
                },
                location: {
                    title: 'Ubicación',
                    directions: 'Cómo llegar'
                },
                rsvp: {
                    title: 'Confirma tu Asistencia',
                    subtitle: 'Por favor, confírmanos tu asistencia antes del 1 de Febrero',
                    attending: '¿Asistirás? *',
                    yes: 'Sí, con mucho gusto',
                    no: 'Lo siento, no podré asistir',
                    guestsCount: '¿Cuántos asistirán? *',
                    guestNames: 'Nombres de los asistentes *',
                    guestNamesHelp: 'Marca con un check los invitados que asistirán',
                    phone: 'Teléfono (WhatsApp)',
                    phoneHelp: 'Formato: +521234567890 o 1234567890',
                    dietary: 'Restricciones Alimentarias',
                    dietaryPlaceholder: 'Ej: Vegetariano, sin gluten, alergias...',
                    message: 'Mensaje para los Novios',
                    messagePlaceholder: 'Comparte tus buenos deseos...',
                    submit: 'Enviar Confirmación',
                    successTitle: '¡Tu confirmación ya fue recibida!',
                    successMsg:
                        'Gracias por confirmar tu asistencia. Te esperamos con mucho cariño.',
                    declinedTitle: 'Invitación Declinada',
                    declinedMsg: 'Lamentamos que no puedas acompañarnos. Gracias por avisarnos.',
                    invitationFor: 'Invitación para:',
                    passesAvailable: 'pases disponibles'
                },
                footer: {
                    created: 'Creado por'
                }
            },
            en: {
                nav: {
                    home: 'Home',
                    event: 'The Event',
                    itinerary: 'Itinerary',
                    location: 'Location',
                    rsvp: 'RSVP',
                    gifts: 'Gift Registry',
                    gallery: 'Gallery',
                    photos: 'Photos'
                },
                hero: {
                    subtitle: 'We are getting married',
                    days: 'Days',
                    hours: 'Hours',
                    minutes: 'Minutes',
                    seconds: 'Seconds'
                },
                event: {
                    title: 'Event Details',
                    ceremony: 'Civil Ceremony',
                    reception: 'Reception',
                    dressCode: 'Dress Code',
                    dressCodeDesc: 'Formal - Avoid pastel colors',
                    dressCodeNote: 'Remember it will be outdoors, dress warmly'
                },
                itinerary: {
                    title: 'Day Itinerary',
                    ceremony: 'Civil Ceremony',
                    ceremonyDesc: 'Signing of documents',
                    photos: 'Photo Session',
                    photosDesc: 'Photos with family and friends',
                    arrival: 'Guest Arrival',
                    arrivalDesc: 'Reception at the hacienda',
                    cocktail: 'Welcome Cocktail',
                    cocktailDesc: 'Appetizers and drinks',
                    dinner: 'Dinner',
                    dinnerDesc: 'Celebration banquet',
                    firstDance: 'First Dance',
                    firstDanceDesc: 'The couple opens the dance floor',
                    party: 'Party',
                    partyDesc: 'Dance all night long!'
                },
                location: {
                    title: 'Location',
                    directions: 'Get Directions'
                },
                rsvp: {
                    title: 'RSVP',
                    subtitle: 'Please confirm your attendance by February 1st',
                    attending: 'Will you attend? *',
                    yes: 'Yes, gladly',
                    no: 'Sorry, I cannot attend',
                    guestsCount: 'How many will attend? *',
                    guestNames: 'Names of attendees *',
                    guestNamesHelp: 'Check the guests who will attend',
                    phone: 'Phone (WhatsApp)',
                    phoneHelp: 'Format: +521234567890 or 1234567890',
                    dietary: 'Dietary Restrictions',
                    dietaryPlaceholder: 'Ex: Vegetarian, gluten-free, allergies...',
                    message: 'Message for the Couple',
                    messagePlaceholder: 'Share your good wishes...',
                    submit: 'Send Confirmation',
                    successTitle: 'Your confirmation has been received!',
                    successMsg:
                        'Thank you for confirming your attendance. We look forward to seeing you.',
                    declinedTitle: 'Invitation Declined',
                    declinedMsg: 'We are sorry you cannot join us. Thank you for letting us know.',
                    invitationFor: 'Invitation for:',
                    passesAvailable: 'passes available'
                },
                footer: {
                    created: 'Created by'
                }
            }
        };
        this.listeners = [];
    }

    /**
     * Inicializa el servicio, cargando el idioma guardado si existe
     */
    init() {
        const savedLocale = localStorage.getItem('wedding_locale');
        if (savedLocale && this.translations[savedLocale]) {
            this.currentLocale = savedLocale;
        } else {
            // Detectar idioma del navegador
            const browserLang = navigator.language.split('-')[0];
            if (this.translations[browserLang]) {
                this.currentLocale = browserLang;
            }
        }
        document.documentElement.lang = this.currentLocale;
    }

    /**
     * Cambia el idioma actual
     * @param {string} locale - 'es' o 'en'
     */
    setLocale(locale) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            localStorage.setItem('wedding_locale', locale);
            document.documentElement.lang = locale;
            this.notifyListeners();
        }
    }

    /**
     * Obtiene la traducción para una clave específica
     * @param {string} key - Clave de traducción (ej. 'nav.home')
     * @returns {string} Texto traducido
     */
    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLocale];

        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key; // Retorna la clave si no encuentra la traducción
            }
        }

        return value;
    }

    /**
     * Suscribe un callback para ser notificado cuando cambie el idioma
     * @param {Function} callback
     */
    subscribe(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notifica a todos los listeners sobre el cambio de idioma
     */
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentLocale));
    }
}
