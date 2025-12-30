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
        displayName: "Fernanda & Diego", // Como aparece en la invitación
        hashtag: "#FerYDiegoSeCasan"
    },
    
    // Detalles del evento
    event: {
        date: new Date('2026-02-28T17:30:00'),
        dateDisplay: {
            day: "28",
            month: "Febrero",
            year: "2026"
        },
        confirmationDeadline: "15 de Enero",
        type: "Nuestra Boda" // Puede ser "Nuestra Boda", "Nuestro Matrimonio", etc.
    },
    
    // Ubicación
    location: {
        venue: {
            name: "Campestre los Reyes",
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
            lat: 124.6091666,
            lng: -107.3824951
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
        
        iframeSrc: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1813.715114293496!2d-107.38345446114589!3d24.608852433113903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjTCsDM2JzMxLjkiTiAxMDfCsDIyJzU1LjgiVw!5e0!3m2!1ses-419!2smx!4v1766980966696!5m2!1ses-419!2smx",
        // URL para el botón "Cómo llegar" - puede ser Google Maps, Waze, etc.
        directionsUrl: "https://maps.app.goo.gl/Ss1WbQUuMR9o7VF38"
    },
    
    // TODO: Futura mejora - Configuración de WhatsApp
    // whatsapp: {
    //     invitationMessage: (names, passes, url) => 
    //         `¡Hola ${names}! 🎉\n\nEstán cordialmente invitados a nuestra boda.\n\nPor favor confirmen su asistencia en el siguiente enlace:\n${url}\n\nTienen ${passes} pases disponibles.\n\n¡Los esperamos con mucho cariño!\n${WEDDING_CONFIG.couple.displayName}`
    // },
    
    // Configuración del formulario RSVP
    rsvpForm: {
        showDietaryRestrictions: true // true = mostrar campo de restricciones alimentarias, false = ocultar
    },
    
    // Mesa de Regalos
    giftRegistry: {
        enabled: true,
        title: "Mesa de Regalos",
        subtitle: "Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo, aquí están nuestras opciones",
        stores: [
            {
                name: "Amazon",
                icon: "fab fa-amazon",
                url: "https://www.amazon.com.mx/wedding/registry/tu-codigo-aqui",
                description: "Ver mesa de regalos en Amazon"
            },
            {
                name: "Liverpool",
                icon: "fas fa-gift",
                url: "https://mesaderegalos.liverpool.com.mx/tu-evento-aqui",
                description: "Ver mesa de regalos en Liverpool"
            }
        ],
        bankAccount: {
            enabled: true,
            title: "Transferencia Bancaria",
            icon: "fas fa-university",
            description: "Si prefieres hacer una transferencia",
            details: {
                bank: "BBVA",
                accountHolder: "Diego Zazueta / Fernanda López",
                accountNumber: "1234567890",
                clabe: "012345678901234567"
            }
        }
    },
    
    // Configuración del Logo de Navegación
    navLogo: {
        // Opciones para el logo:
        // 1. Si usas iniciales personalizadas, pon custom: true y define el texto
        // 2. Si quieres usar las iniciales automáticas de los novios, pon custom: false
        custom: true, // true = usar texto personalizado, false = usar iniciales automáticas
        text: "F & D", // Texto personalizado para el logo (solo se usa si custom es true)
        // Si custom es false, se generarán automáticamente las iniciales de:
        // bride.name[0] & groom.name[0] = "F & D"
    }
};

// Exportar para Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WEDDING_CONFIG;
}
