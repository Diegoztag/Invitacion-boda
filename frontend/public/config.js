// Configuración centralizada de la boda
const WEDDING_CONFIG = {
    // Información de los novios
    couple: {
        groom: {
            name: 'Diego',
            fullName: 'Diego Zazueta'
        },
        bride: {
            name: 'Fernanda',
            fullName: 'Fernanda López'
        },
        displayName: 'Fernanda & Diego', // Como aparece en la invitación
        hashtag: '#FerYDiegoSeCasan'
    },

    // Detalles del evento
    event: {
        date: new Date('2026-02-28T17:30:00'),
        dateDisplay: {
            day: '28',
            month: 'Febrero',
            year: '2026'
        },
        confirmationDeadline: '15 de Febrero',
        type: 'Nuestra Boda' // Puede ser "Nuestra Boda", "Nuestro Matrimonio", etc.
    },

    // Ubicación
    location: {
        venue: {
            name: 'Campestre los Reyes',
            address: 'Ejido el 30',
            city: 'Costa Rica',
            state: 'Sinaloa'
        },
        ceremony: {
            name: 'Ceremonia Civil',
            time: '5:00 PM',
            description: 'Firma de documentos'
        },
        reception: {
            name: 'Recepción',
            time: '7:00 PM',
            description: 'Celebración y fiesta'
        },
        coordinates: {
            lat: 124.6091666,
            lng: -107.3824951
        }
    },

    // Itinerario del día
    schedule: [
        {
            time: '5:00 p.m',
            title: 'Ceremonia Civil',
            description: ''
        },
        {
            time: '7:00 p.m',
            title: 'Recepción de Invitados',
            description: ''
        },
        {
            time: '7:00 p.m',
            title: 'Entrada de los novios',
            description: ''
        },
        {
            time: '7:30 p.m',
            title: 'Cena',
            description: ''
        },
        {
            time: '8:30 PM',
            title: 'Fiesta',
            description: ''
        }
    ],

    // Código de vestimenta
    dressCode: {
        title: 'Código de Vestimenta',
        description: 'Formal/Etiqueta',
        note: 'Evitar colores pasteles'
    },

    // Mensajes personalizables
    messages: {
        welcome: 'Nos casamos',
        rsvpTitle: 'Confirma tu Asistencia',
        rsvpSubtitle: 'Por favor, confírmanos tu asistencia antes del',
        photoSectionTitle: 'Comparte tus Fotos',
        photoSectionSubtitle: 'Ayúdanos a capturar todos los momentos especiales de nuestro día',
        confirmationReceived: '¡Confirmación Recibida!',
        confirmationThanks: 'Gracias por confirmar tu asistencia. Te esperamos con mucho cariño.',
        cannotAttend: 'Gracias por avisarnos. Te echaremos de menos en nuestro día especial.'
    },

    // Colores del tema (para fácil personalización)
    theme: {
        primaryColor: '#d4a574',
        secondaryColor: '#8b7355',
        accentColor: '#f8f4e6',
        textDark: '#333',
        textLight: '#666'
    },

    // URLs de imágenes
    images: {
        // Imagen de fondo del hero - puedes usar una URL o una ruta local
        heroBackground: 'https://i.ibb.co/8LppdWnK/IMG-6253-3.jpg',
        ceremonyIcon: 'fas fa-heart',
        receptionIcon: 'fas fa-champagne-glasses'
    },

    // Configuración del backend
    api: {
        // Detección automática del entorno
        backendUrl:
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? '' // Desarrollo local (ruta relativa para usar el mismo puerto, Vite proxy maneja /api)
                : 'https://web-gqbxdo8fjh1g.up-de-fra1-k8s-1.apps.run-on-seenode.com', // Producción (Seenode)
        googleMapsApiKey: 'YOUR_API_KEY',

        // Configuración de autenticación para el dashboard
        dashboard: {
            requireAuth: true, // true = requiere autenticación, false = sin autenticación (desarrollo)
            authType: 'basic', // 'basic' o 'jwt'
            credentials: {
                username: 'admin',
                password: 'password'
            }
        }
    },

    // Configuración de invitados
    guests: {
        targetTotal: 150, // Número total de invitados esperados (personas)
        maxGuestsPerInvitation: 5, // Límite máximo de invitados por invitación
        allowChildren: false, // true = se permiten niños, false = solo adultos
        showNoChildrenNote: true, //true = mostrar nota de "no niños", false = ocultar
        noChildrenMessage:
            'Esperamos contar con su comprensión para que este sea un evento solo para adultos'
    },

    // Configuración del mapa
    map: {
        // URL del iframe de Google Maps o cualquier otro servicio de mapas

        iframeSrc:
            'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1813.715114293496!2d-107.38345446114589!3d24.608852433113903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjTCsDM2JzMxLjkiTiAxMDfCsDIyJzU1LjgiVw!5e0!3m2!1ses-419!2smx!4v1766980966696!5m2!1ses-419!2smx',
        // URL para el botón "Cómo llegar" - puede ser Google Maps, Waze, etc.
        directionsUrl: 'https://maps.app.goo.gl/Ss1WbQUuMR9o7VF38'
    },

    // Configuración de WhatsApp
    whatsapp: {
        invitationMessage: (names, passes, url) =>
            `¡Nos casamos 💍✨!\n
Hay momentos en la vida que son especiales por sí solos, pero compartirlos con las personas que más queremos los hace inolvidables.❤️🙌\n
Después de tantos momentos compartidos, hemos  decidido dar el siguiente paso, y estamos muy felices de invitar con mucho cariño a ${names} a nuestra boda el próximo 28 de Febrero del 2026 🥂\n
Nota:📝 Nuestra ceremonia se llevará a cabo en un lugar al aire libre.🍂 Debido a la temprada, les sugerimos traer una prenda de abrigo para disfrutar comodamente de la velada.🎊\n
Los siguientes son ${passes} pases disponibles para ${names} favor de confirmar en el link.🔗\n
${url}\n
Favor de confirmar antes del ${WEDDING_CONFIG.event.confirmationDeadline}📅.\n
¡Los esperamos con mucho cariño!\n${WEDDING_CONFIG.couple.displayName} ✨`
    },

    // Configuración del formulario RSVP
    rsvpForm: {
        showDietaryRestrictions: false, // true = mostrar campo de restricciones alimentarias, false = ocultar
        showPhoneField: false, // true = mostrar campo de teléfono/WhatsApp, false = ocultar
        requirePhone: false, // true = campo obligatorio, false = opcional
        allowReconfirmation: false // true = permitir modificar confirmación, false = bloquear si ya confirmó
    },

    // Mesa de Regalos
    giftRegistry: {
        enabled: true,
        title: 'Mesa de Regalos',
        subtitle:
            'Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo, aquí están nuestras opciones',
        stores: [
            {
                name: 'Amazon',
                icon: 'fab fa-amazon',
                url: 'https://www.amazon.com.mx/wedding/share/Diegoyfer',
                description: 'Ver mesa de regalos en Amazon'
            },
            {
                name: 'Liverpool',
                icon: 'fas fa-gift',
                url: 'https://mesaderegalos.liverpool.com.mx/milistaderegalos/51861860',
                description: 'Ver mesa de regalos en Liverpool'
            },
            {
                name: 'Lluvia de sobres',
                icon: 'fas fa-envelope',
                url: '#',
                description: 'Efectivo en recepción'
            }
        ],
        bankAccount: {
            enabled: false,
            title: 'Transferencia Bancaria',
            icon: 'fas fa-university',
            description: 'Si prefieres hacer una transferencia',
            details: {
                bank: 'BBVA',
                accountHolder: 'Diego Zazueta / Fernanda López',
                accountNumber: '1234567890',
                clabe: '012345678901234567'
            }
        }
    },

    // Configuración del Logo de Navegación
    navLogo: {
        // Opciones para el logo:
        // 1. Si usas iniciales personalizadas, pon custom: true y define el texto
        // 2. Si quieres usar las iniciales automáticas de los novios, pon custom: false
        custom: true, // true = usar texto personalizado, false = usar iniciales automáticas
        text: 'F & D' // Texto personalizado para el logo (solo se usa si custom es true)
        // Si custom es false, se generarán automáticamente las iniciales de:
        // bride.name[0] & groom.name[0] = "F & D"
    },

    // Configuración de Meta Etiquetas (SEO y Redes Sociales)
    metaTags: {
        // URL base del sitio (actualizar con el dominio real)
        siteUrl:
            (typeof window !== 'undefined' && window.location.origin) ||
            'https://web-gqbxdo8fjh1g.up-de-fra1-k8s-1.apps.run-on-seenode.com/',

        // Título principal para compartir
        title: 'Boda Fernanda & Diego',

        // Descripción para compartir
        description: '28 de Febrero 2026',

        // Imagen principal para compartir (mínimo 1200x630px para mejor visualización)
        image: 'https://i.ibb.co/8LppdWnK/IMG-6253-3.jpg',

        // Nombre del sitio
        siteName: 'Boda Fernanda & Diego',

        // Configuración para invitaciones personalizadas
        personalized: {
            // Si es true, intentará personalizar las meta etiquetas con info de la invitación
            enabled: true,

            // Plantilla para el título personalizado
            titleTemplate: guestNames => `Invitación de Boda - ${guestNames}`,

            // Plantilla para la descripción personalizada
            descriptionTemplate: (guestNames, passes) =>
                `${guestNames}, están cordialmente invitados a la boda de Fernanda & Diego. ${passes} pases disponibles.`
        }
    },

    // Configuración del Carrusel (Nuestra Historia)
    carouselSection: {
        enabled: true, // true = mostrar carrusel, false = ocultar
        title: 'Galería',
        subtitle: '',
        carousel: {
            showNavigationButtons: false, // true = mostrar botones de navegación (flechas), false = ocultar
            showIndicators: false, // true = mostrar indicadores (puntos), false = ocultar
            autoPlayDelay: 5000, // Tiempo en milisegundos entre transiciones automáticas (5000 = 5 segundos)
            animationDuration: 600, // Duración de la animación de transición en milisegundos
            enableAutoPlay: true, // true = activar reproducción automática, false = desactivar
            enableSwipe: true, // true = permitir navegación táctil (swipe), false = desactivar
            enableKeyboard: false // true = permitir navegación con teclado, false = desactivar
        },
        // Fotos del carrusel - puedes agregar, quitar o modificar las fotos
        photos: [
            {
                url: 'https://i.ibb.co/hFZwc1WM/IMG-6263.jpg',
                caption: '',
                alt: ''
            },
            {
                url: 'https://i.ibb.co/5WVhkgSX/IMG-6262.jpg',
                caption: '',
                alt: ''
            },
            {
                url: 'https://i.ibb.co/8Dt4Ldq7/IMG-6264.jpg',
                caption: '',
                alt: ''
            },
            {
                url: 'https://i.ibb.co/MDPBccjG/IMG-6254.jpg',
                caption: '',
                alt: ''
            },
            {
                url: 'https://i.ibb.co/67V3SbQF/IMG-6251.jpg',
                caption: '',
                alt: ''
            }
            // Puedes agregar más fotos aquí siguiendo el mismo formato:
            // {
            //     url: "URL_DE_LA_IMAGEN",
            //     caption: "Descripción de la foto",
            //     alt: "Texto alternativo"
            // }
        ]
    },

    // Configuración de la sección de Instagram/Hashtag
    photoSection: {
        enabled: false, // true = mostrar sección de hashtag, false = ocultar
        title: 'Comparte tus Fotos',
        subtitle: 'Captura y comparte los momentos especiales de nuestro día',
        showHashtag: true, // true = mostrar hashtag de Instagram, false = ocultar
        hashtagDescription:
            '¡Usa este hashtag en Instagram para compartir tus fotos, videos y stories!'
    }
};

// Exportar para Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WEDDING_CONFIG;
}

// Exportar para el navegador (frontend)
if (typeof window !== 'undefined') {
    window.WEDDING_CONFIG = WEDDING_CONFIG;
}
