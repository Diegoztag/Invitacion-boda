// Configuración centralizada de la boda
const WEDDING_CONFIG = {
    // Información de los novios
    couple: {
        groom: {
            name: "Diego",
            fullName: "Diego Zazueta"
        },
        bride: {
            name: "Fernanda",
            fullName: "Fernanda López"
        },
        displayName: "Diego & Fernanda", // Como aparece en la invitación
        hashtag: "#DiegoYFerSeCasan"
    },
    
    // Detalles del evento
    event: {
        date: new Date('2026-02-28T17:30:00'),
        dateDisplay: {
            day: "28",
            month: "Febrero",
            year: "2026"
        },
        confirmationDeadline: "1 de Febrero",
        type: "Nuestra Boda" // Puede ser "Nuestra Boda", "Nuestro Matrimonio", etc.
    },
    
    // Ubicación
    location: {
        venue: {
            name: "Hacienda los Reyes",
            address: "Ejido el 30",
            city: "Ciudad",
            state: "Estado"
        },
        ceremony: {
            name: "Ceremonia Civil",
            time: "5:30 PM",
            description: "Firma de documentos"
        },
        reception: {
            name: "Recepción",
            time: "7:00 PM",
            description: "Celebración y fiesta"
        },
        coordinates: {
            lat: 19.4326,
            lng: -99.1332
        }
    },
    
    // Itinerario del día
    schedule: [
        {
            time: "5:00 PM",
            title: "Ceremonia Civil",
            description: "Firma de documentos"
        },
        {
            time: "5:30 PM",
            title: "Sesión de Fotos",
            description: "Fotos con familia y amigos"
        },
        {
            time: "6:00 PM",
            title: "Llegada de Invitados",
            description: "Recepción en la hacienda"
        },
        {
            time: "6:30 PM",
            title: "Cocktail de Bienvenida",
            description: "Aperitivos y bebidas"
        },
        {
            time: "8:00 PM",
            title: "Cena",
            description: "Banquete de celebración"
        },
        {
            time: "8:30 PM",
            title: "Primer Baile",
            description: "Los novios abren la pista"
        },
        {
            time: "9:00 PM",
            title: "Fiesta",
            description: "¡A bailar toda la noche!"
        }
    ],
    
    // Código de vestimenta
    dressCode: {
        title: "Código de Vestimenta",
        description: "Formal - Evitar colores pasteles",
        note: "Recuerden que será al aire libre, asistan bien abrigados"
    },
    
    // Mensajes personalizables
    messages: {
        welcome: "Nos casamos",
        rsvpTitle: "Confirma tu Asistencia",
        rsvpSubtitle: "Por favor, confírmanos tu asistencia antes del",
        photoSectionTitle: "Comparte tus Fotos",
        photoSectionSubtitle: "Ayúdanos a capturar todos los momentos especiales de nuestro día",
        confirmationReceived: "¡Confirmación Recibida!",
        confirmationThanks: "Gracias por confirmar tu asistencia. Te esperamos con mucho cariño.",
        cannotAttend: "Gracias por avisarnos. Te echaremos de menos en nuestro día especial."
    },
    
    // Colores del tema (para fácil personalización)
    theme: {
        primaryColor: "#d4a574",
        secondaryColor: "#8b7355",
        accentColor: "#f8f4e6",
        textDark: "#333",
        textLight: "#666"
    },
    
    // URLs de imágenes
    images: {
        heroBackground: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3",
        ceremonyIcon: "fas fa-heart",
        receptionIcon: "fas fa-champagne-glasses"
    },
    
    // Configuración del backend
    api: {
        backendUrl: "http://localhost:3000/api",
        googleMapsApiKey: "YOUR_API_KEY"
    },
    
    // Configuración del mapa
    map: {
        // URL del iframe de Google Maps o cualquier otro servicio de mapas
        iframeSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.8114695040684!2d-99.13519668509372!3d19.432608086886584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1f92b75aa014d%3A0x17d810d20da6e8cf!2sPalacio%20de%20Bellas%20Artes!5e0!3m2!1ses!2smx!4v1640995200000!5m2!1ses!2smx",
        // URL para el botón "Cómo llegar" - puede ser Google Maps, Waze, etc.
        directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=19.4326,-99.1332"
    },
    
    // Configuración de WhatsApp
    whatsapp: {
        invitationMessage: (names, passes, url) => 
            `¡Hola ${names}! 🎉\n\nEstán cordialmente invitados a nuestra boda.\n\nPor favor confirmen su asistencia en el siguiente enlace:\n${url}\n\nTienen ${passes} pases disponibles.\n\n¡Los esperamos con mucho cariño!\n${WEDDING_CONFIG.couple.displayName}`
    }
};

// Exportar para Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WEDDING_CONFIG;
}
