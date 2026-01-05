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
        confirmationDeadline: "20 de Enero",
        type: "Nuestra Boda" // Puede ser "Nuestra Boda", "Nuestro Matrimonio", etc.
    },
    
    // Ubicación
    location: {
        venue: {
            name: "Campestre los Reyes",
            address: "Ejido el 30",
            city: "Costa Rica",
            state: "Sinaloa"
        },
        ceremony: {
            name: "Ceremonia Civil",
            time: "5:00 PM",
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
            time: "5:00 p.m",
            title: "Ceremonia Civil",
            description: ""
        },
        {
            time: "7:00 p.m",
            title: "Recepción de Invitados",
            description: ""
        },
        {
            time: "7:00 p.m",
            title: "Entrada de los novios",
            description: ""
        },
        {
            time: "7:30 p.m",
            title: "Cena",
            description: ""
        },
        {
            time: "8:30 PM",
            title: "Fiesta",
            description: ""
        }
    ],
    
    // Código de vestimenta
    dressCode: {
        title: "Código de Vestimenta",
        description: "Formal - Evitar colores pasteles",
        note: ""
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
    
    // Configuración de invitados
    guests: {
        targetTotal: 130, // Número total de invitados esperados (personas)
        targetInvitations: 150, // Número estimado de invitaciones a enviar
        allowChildren: false, // true = se permiten niños, false = solo adultos
        showNoChildrenNote: false, // true = mostrar nota de "no niños", false = ocultar
        noChildrenMessage: "Esperamos contar con su comprensión para que este sea un evento solo para adultos"
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
        showDietaryRestrictions: false, // true = mostrar campo de restricciones alimentarias, false = ocultar
        showPhoneField: false, // true = mostrar campo de teléfono/WhatsApp, false = ocultar
        requirePhone: false // true = campo obligatorio, false = opcional
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
                url: "https://www.amazon.com.mx/wedding/share/Diegoyfer",
                description: "Ver mesa de regalos en Amazon"
            },
            {
                name: "Liverpool",
                icon: "fas fa-gift",
                url: "https://mesaderegalos.liverpool.com.mx/milistaderegalos/51861860",
                description: "Ver mesa de regalos en Liverpool"
            }
        ],
        bankAccount: {
            enabled: false,
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
    },
    
    // Configuración de la sección de fotos/Instagram
    photoSection: {
        enabled: false, // true = mostrar sección de fotos, false = ocultar
        title: "Comparte tus Fotos",
        subtitle: "Ayúdanos a capturar todos los momentos especiales de nuestro día",
        showHashtag: true, // true = mostrar hashtag de Instagram, false = ocultar
        hashtagDescription: "¡Usa este hashtag en Instagram para compartir tus fotos, videos y stories!"
    }
};

// Exportar para Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WEDDING_CONFIG;
}
