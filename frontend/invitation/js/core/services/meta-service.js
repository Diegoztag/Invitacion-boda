/**
 * Servicio para manejo de meta tags dinámicos
 * Actualiza meta tags, título y Open Graph tags basado en la invitación
 */

export class MetaService {
    constructor() {
        this.originalTitle = document.title;
        this.originalMeta = this.captureOriginalMeta();
        this.isInitialized = false;
    }

    /**
     * Inicializa el servicio
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        this.isInitialized = true;
    }

    /**
     * Captura los meta tags originales
     * @returns {Object}
     */
    captureOriginalMeta() {
        const meta = {};

        // Capturar meta tags básicos
        const metaTags = document.querySelectorAll('meta[name], meta[property]');
        metaTags.forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');
            if (name && content) {
                meta[name] = content;
            }
        });

        return meta;
    }

    /**
     * Actualiza el título de la página
     * @param {string} title - Nuevo título
     */
    updateTitle(title) {
        if (!title) {
            return;
        }

        document.title = title;
    }

    /**
     * Actualiza un meta tag
     * @param {string} name - Nombre del meta tag
     * @param {string} content - Contenido del meta tag
     * @param {string} attribute - Atributo a usar ('name' o 'property')
     */
    updateMetaTag(name, content, attribute = 'name') {
        if (!name || !content) {
            return;
        }

        let metaTag = document.querySelector(`meta[${attribute}="${name}"]`);

        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute(attribute, name);
            document.head.appendChild(metaTag);
        }

        metaTag.setAttribute('content', content);
    }

    /**
     * Actualiza meta tags para una invitación específica
     * @param {Object} invitation - Datos de la invitación
     */
    updateInvitationMeta(invitation) {
        if (!invitation) {
            return;
        }

        const weddingConfig = window.WEDDING_CONFIG || {};
        const couple = weddingConfig.couple || {};
        const event = weddingConfig.event || {};

        // Actualizar título personalizado
        const personalizedTitle = `Invitación de boda - ${invitation.getDisplayName()} | ${couple.displayName || 'Nuestra Boda'}`;
        this.updateTitle(personalizedTitle);

        // Actualizar descripción personalizada
        const description = `${invitation.getDisplayName()}, estás cordialmente invitado(a) a la boda de ${couple.displayName || 'los novios'}. ${event.dateDisplay?.day || ''} de ${event.dateDisplay?.month || ''} del ${event.dateDisplay?.year || ''}`;
        this.updateMetaTag('description', description);

        // Actualizar Open Graph tags
        this.updateOpenGraphTags(invitation, {
            title: personalizedTitle,
            description: description,
            couple: couple,
            event: event
        });

        // Actualizar Twitter Card tags
        this.updateTwitterCardTags(invitation, {
            title: personalizedTitle,
            description: description
        });
    }

    /**
     * Actualiza Open Graph tags
     * @param {Object} invitation - Datos de la invitación
     * @param {Object} data - Datos adicionales
     */
    updateOpenGraphTags(invitation, data) {
        const { title, description, couple, event } = data;

        // Open Graph básico
        this.updateMetaTag('og:title', title, 'property');
        this.updateMetaTag('og:description', description, 'property');
        this.updateMetaTag('og:type', 'website', 'property');
        this.updateMetaTag('og:url', window.location.href, 'property');

        // Imagen de Open Graph
        const ogImage =
            window.WEDDING_CONFIG?.images?.ogImage || window.WEDDING_CONFIG?.images?.heroBackground;
        if (ogImage) {
            const imageUrl = ogImage.startsWith('http')
                ? ogImage
                : `${window.location.origin}${ogImage}`;
            this.updateMetaTag('og:image', imageUrl, 'property');
            this.updateMetaTag(
                'og:image:alt',
                `Invitación de boda de ${couple.displayName || 'los novios'}`,
                'property'
            );
        }

        // Información específica de la boda
        if (couple.displayName) {
            this.updateMetaTag('og:site_name', `Boda de ${couple.displayName}`, 'property');
        }

        // Fecha del evento
        if (event.date) {
            this.updateMetaTag('event:start_time', event.date, 'property');
        }
    }

    /**
     * Actualiza Twitter Card tags
     * @param {Object} invitation - Datos de la invitación
     * @param {Object} data - Datos adicionales
     */
    updateTwitterCardTags(invitation, data) {
        const { title, description } = data;

        this.updateMetaTag('twitter:card', 'summary_large_image', 'name');
        this.updateMetaTag('twitter:title', title, 'name');
        this.updateMetaTag('twitter:description', description, 'name');

        // Imagen de Twitter
        const twitterImage =
            window.WEDDING_CONFIG?.images?.twitterImage ||
            window.WEDDING_CONFIG?.images?.ogImage ||
            window.WEDDING_CONFIG?.images?.heroBackground;
        if (twitterImage) {
            const imageUrl = twitterImage.startsWith('http')
                ? twitterImage
                : `${window.location.origin}${twitterImage}`;
            this.updateMetaTag('twitter:image', imageUrl, 'name');
        }
    }

    /**
     * Actualiza meta tags generales de la boda
     */
    updateWeddingMeta() {
        const weddingConfig = window.WEDDING_CONFIG || {};
        const couple = weddingConfig.couple || {};
        const event = weddingConfig.event || {};
        const messages = weddingConfig.messages || {};
        const metaTags = weddingConfig.metaTags || {};

        // Usar título de metaTags si está disponible, sino generar uno
        const generalTitle =
            metaTags.title || `${couple.displayName || 'Nuestra Boda'} - Invitación de Boda`;
        this.updateTitle(generalTitle);

        // Usar descripción de metaTags si está disponible, sino generar una
        const generalDescription =
            metaTags.description ||
            messages.welcome ||
            `Te invitamos a celebrar la boda de ${couple.displayName || 'los novios'}. ${event.dateDisplay?.day || ''} de ${event.dateDisplay?.month || ''} del ${event.dateDisplay?.year || ''}`;
        this.updateMetaTag('description', generalDescription);

        // Keywords
        const keywords = [
            'boda',
            'invitación',
            'matrimonio',
            'celebración',
            couple.bride?.name,
            couple.groom?.name,
            event.dateDisplay?.month,
            event.dateDisplay?.year
        ]
            .filter(Boolean)
            .join(', ');

        this.updateMetaTag('keywords', keywords);

        // Author
        this.updateMetaTag('author', couple.displayName || 'Los Novios');

        // Robots
        this.updateMetaTag('robots', 'noindex, nofollow'); // Privacidad para invitaciones

        // Open Graph desde configuración
        if (metaTags.image) {
            this.updateMetaTag('og:image', metaTags.image, 'property');
            this.updateMetaTag(
                'og:image:alt',
                `Invitación de boda de ${couple.displayName || 'los novios'}`,
                'property'
            );
        }

        if (metaTags.siteUrl) {
            this.updateMetaTag('og:url', metaTags.siteUrl, 'property');
        }

        if (metaTags.siteName) {
            this.updateMetaTag('og:site_name', metaTags.siteName, 'property');
        }
    }

    /**
     * Actualiza meta tags para confirmación exitosa
     * @param {Object} invitation - Datos de la invitación
     */
    updateConfirmationMeta(invitation) {
        if (!invitation) {
            return;
        }

        const couple = window.WEDDING_CONFIG?.couple || {};
        const status = invitation.isConfirmed() ? 'confirmada' : 'actualizada';

        const title = `Asistencia ${status} - ${invitation.getDisplayName()} | ${couple.displayName || 'Nuestra Boda'}`;
        const description = `${invitation.getDisplayName()}, tu asistencia ha sido ${status} exitosamente para la boda de ${couple.displayName || 'los novios'}.`;

        this.updateTitle(title);
        this.updateMetaTag('description', description);
    }

    /**
     * Restaura los meta tags originales
     */
    restoreOriginalMeta() {
        // Restaurar título
        document.title = this.originalTitle;

        // Restaurar meta tags
        Object.entries(this.originalMeta).forEach(([name, content]) => {
            this.updateMetaTag(name, content);
        });
    }

    /**
     * Obtiene información actual de meta tags
     * @returns {Object}
     */
    getCurrentMeta() {
        return {
            title: document.title,
            meta: this.captureOriginalMeta()
        };
    }

    /**
     * Actualiza meta tags basado en datos proporcionados
     * @param {Object} data - Datos para actualizar meta tags
     */
    async updateFromData(data = {}) {
        const updateActions = [
            {
                condition: data.invitation,
                action: () => this.updateInvitationMeta(data.invitation)
            },
            { condition: data.meta, action: () => this.updateSpecificMeta(data.meta) },
            { condition: data.section, action: () => this.updateSectionMeta(data.section) }
        ];

        try {
            const actionToExecute = updateActions.find(item => item.condition);

            if (actionToExecute) {
                actionToExecute.action();
            } else {
                this.updateWeddingMeta();
            }
        } catch (_err) {
            this.updateWeddingMeta();
        }
    }

    /**
     * Actualiza meta tags específicos
     * @param {Object} metaData - Datos específicos de meta tags
     */
    updateSpecificMeta(metaData) {
        if (metaData.title) {
            this.updateTitle(metaData.title);
        }

        if (metaData.description) {
            this.updateMetaTag('description', metaData.description);
        }

        if (metaData.keywords) {
            this.updateMetaTag('keywords', metaData.keywords);
        }

        // Actualizar Open Graph si está presente
        if (metaData.og) {
            Object.entries(metaData.og).forEach(([key, value]) => {
                this.updateMetaTag(`og:${key}`, value, 'property');
            });
        }

        // Actualizar Twitter Card si está presente
        if (metaData.twitter) {
            Object.entries(metaData.twitter).forEach(([key, value]) => {
                this.updateMetaTag(`twitter:${key}`, value, 'name');
            });
        }
    }

    /**
     * Actualiza meta tags para una sección específica
     * @param {string} sectionId - ID de la sección
     */
    updateSectionMeta(sectionId) {
        const weddingConfig = window.WEDDING_CONFIG || {};
        const couple = weddingConfig.couple || {};

        // Títulos específicos por sección
        const sectionTitles = {
            inicio: `${couple.displayName || 'Nuestra Boda'} - Invitación de Boda`,
            evento: `Detalles del Evento - ${couple.displayName || 'Nuestra Boda'}`,
            ubicacion: `Ubicación y Lugar - ${couple.displayName || 'Nuestra Boda'}`,
            galeria: `Galería de Fotos - ${couple.displayName || 'Nuestra Boda'}`,
            rsvp: `Confirmar Asistencia - ${couple.displayName || 'Nuestra Boda'}`,
            regalo: `Lista de Regalos - ${couple.displayName || 'Nuestra Boda'}`,
            contacto: `Contacto - ${couple.displayName || 'Nuestra Boda'}`,
            gracias: `¡Gracias! - ${couple.displayName || 'Nuestra Boda'}`
        };

        // Descripciones específicas por sección
        const sectionDescriptions = {
            inicio: `Te invitamos a celebrar nuestra boda. ${couple.displayName || 'Los novios'} se casan.`,
            evento: `Conoce todos los detalles sobre la ceremonia y recepción de la boda de ${couple.displayName || 'los novios'}.`,
            ubicacion: `Encuentra la ubicación exacta donde se celebrará la boda de ${couple.displayName || 'los novios'}.`,
            galeria: `Mira las fotos y momentos especiales de ${couple.displayName || 'los novios'}.`,
            rsvp: `Confirma tu asistencia a la boda de ${couple.displayName || 'los novios'}.`,
            regalo: `Encuentra ideas de regalos para ${couple.displayName || 'los novios'}.`,
            contacto: `Ponte en contacto con ${couple.displayName || 'los novios'} para cualquier consulta.`,
            gracias: `Gracias por acompañar a ${couple.displayName || 'los novios'} en este día especial.`
        };

        const title = sectionTitles[sectionId] || sectionTitles.inicio;
        const description = sectionDescriptions[sectionId] || sectionDescriptions.inicio;

        this.updateTitle(title);
        this.updateMetaTag('description', description);

        // Actualizar Open Graph
        this.updateMetaTag('og:title', title, 'property');
        this.updateMetaTag('og:description', description, 'property');
        this.updateMetaTag(
            'og:url',
            `${window.location.origin}${window.location.pathname}#${sectionId}`,
            'property'
        );
    }

    /**
     * Alias para updateSectionMeta - para compatibilidad
     * @param {string} sectionId - ID de la sección
     */
    updateForSection(sectionId) {
        return this.updateSectionMeta(sectionId);
    }

    /**
     * Carga meta tags por defecto
     * Método llamado durante la inicialización de la aplicación
     */
    async loadDefaultMeta() {
        try {
            // Configurar SEO básico
            this.setupBasicSEO();

            // Actualizar meta tags basado en la URL
            this.updateMetaFromUrl();
        } catch (_error) {
            // Fallback: al menos cargar meta tags básicos de la boda
            this.updateWeddingMeta();
        }
    }

    /**
     * Actualiza meta tags basado en la URL actual
     */
    updateMetaFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const invitationCode = urlParams.get('invitation') || urlParams.get('code');

        if (invitationCode) {
            // Si hay código en la URL, esperar a que se cargue la invitación
        } else {
            // Actualizar con meta tags generales
            this.updateWeddingMeta();
        }
    }

    /**
     * Configura meta tags para SEO básico
     */
    setupBasicSEO() {
        // Viewport
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            document.head.appendChild(viewport);
        }

        // Charset
        let charset = document.querySelector('meta[charset]');
        if (!charset) {
            charset = document.createElement('meta');
            charset.setAttribute('charset', 'UTF-8');
            document.head.insertBefore(charset, document.head.firstChild);
        }

        // Theme color desde configuración de la boda
        const themeColor = window.WEDDING_CONFIG?.theme?.primaryColor || '#d4a574';
        this.updateMetaTag('theme-color', themeColor);
    }

    /**
     * Destruye el servicio
     */
    destroy() {
        this.restoreOriginalMeta();
        this.isInitialized = false;
    }
}
