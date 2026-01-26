/**
 * Servicio de Configuración
 * Aplica la configuración de WEDDING_CONFIG al DOM y la aplicación
 */

export class ConfigurationService {
    constructor() {
        this.config = null;
        this.isInitialized = false;
        this.appliedElements = new Set();
    }
    
    /**
     * Inicializa el servicio
     */
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('⚙️ Initializing ConfigurationService...');
        
        // Cargar configuración
        this.loadConfiguration();
        
        // Aplicar configuración al DOM
        await this.applyConfigurationToDOM();
        
        this.isInitialized = true;
        console.log('✅ ConfigurationService initialized');
    }
    
    /**
     * Carga la configuración desde WEDDING_CONFIG
     */
    loadConfiguration() {
        this.config = window.WEDDING_CONFIG || {};
        
        if (!this.config || Object.keys(this.config).length === 0) {
            console.warn('⚠️ WEDDING_CONFIG not found or empty');
            this.config = this.getDefaultConfig();
        }
        
        console.log('📋 Configuration loaded:', this.config);
    }
    
    /**
     * Aplica la configuración al DOM
     */
    async applyConfigurationToDOM() {
        console.log('🎨 Applying configuration to DOM...');
        
        // Aplicar información de los novios
        this.applyCoupleInfo();
        
        // Aplicar información del evento
        this.applyEventInfo();
        
        // Aplicar información de ubicación
        this.applyLocationInfo();
        
        // Aplicar itinerario
        this.applySchedule();
        
        // Aplicar código de vestimenta
        this.applyDressCode();
        
        // Aplicar mensajes personalizables
        this.applyMessages();
        
        // Aplicar configuración de RSVP
        this.applyRSVPConfig();
        
        // Aplicar mesa de regalos
        this.applyGiftRegistry();
        
        // Aplicar configuración del carrusel
        this.applyCarouselConfig();
        
        // Aplicar configuración de fotos/hashtag
        this.applyPhotoSection();
        
        // Aplicar tema y colores
        this.applyTheme();
        
        // Aplicar imágenes
        this.applyImages();
        
        // Aplicar configuración del mapa
        this.applyMapConfig();
        
        console.log(`✅ Configuration applied to ${this.appliedElements.size} elements`);
    }
    
    /**
     * Aplica información de los novios
     */
    applyCoupleInfo() {
        const couple = this.config.couple || {};
        
        // Nombres de los novios
        this.updateElement('#heroTitle', couple.displayName || `${couple.groom?.name || 'Novio'} & ${couple.bride?.name || 'Novia'}`);
        this.updateElement('#footerNames', couple.displayName || `${couple.groom?.name || 'Novio'} & ${couple.bride?.name || 'Novia'}`);
        
        // Logo de navegación
        const navLogo = this.config.navLogo || {};
        let logoText;
        
        if (navLogo.custom && navLogo.text) {
            logoText = navLogo.text;
        } else {
            // Generar iniciales automáticamente
            const brideInitial = couple.bride?.name?.charAt(0) || 'N';
            const groomInitial = couple.groom?.name?.charAt(0) || 'N';
            logoText = `${brideInitial} & ${groomInitial}`;
        }
        
        this.updateElement('.nav-logo', logoText);
        
        // Hashtag
        if (couple.hashtag) {
            this.updateElement('#instagramHashtag', couple.hashtag);
            this.updateElement('#footerHashtag', couple.hashtag);
        }
    }
    
    /**
     * Aplica información del evento
     */
    applyEventInfo() {
        const event = this.config.event || {};
        
        // Fecha del evento
        if (event.dateDisplay) {
            this.updateElement('#dateDay', event.dateDisplay.day || '');
            this.updateElement('#dateMonth', event.dateDisplay.month || '');
            this.updateElement('#dateYear', event.dateDisplay.year || '');
            this.updateElement('#footerDate', `${event.dateDisplay.day || ''} de ${event.dateDisplay.month || ''} del ${event.dateDisplay.year || ''}`);
        }
        
        // Tipo de evento
        if (event.type) {
            this.updateElement('#heroSubtitle', this.config.messages?.welcome || event.type);
        }
        
        // Deadline de confirmación
        if (event.confirmationDeadline) {
            this.updateElement('#rsvpSubtitle', `Por favor, confírmanos tu asistencia antes del ${event.confirmationDeadline}`);
        }
    }
    
    /**
     * Aplica información de ubicación
     */
    applyLocationInfo() {
        const location = this.config.location || {};
        
        if (location.venue) {
            this.updateElement('#locationVenueName', location.venue.name || '');
            this.updateElement('#ceremonyVenue', location.venue.name || '');
            this.updateElement('#receptionVenue', location.venue.name || '');
            
            const fullAddress = `${location.venue.address || ''}, ${location.venue.city || ''}, ${location.venue.state || ''}`.replace(/^,\s*|,\s*$/g, '');
            this.updateElement('#locationAddress', fullAddress);
            this.updateElement('#ceremonyAddress', location.venue.address || '');
            this.updateElement('#receptionAddress', location.venue.address || '');
        }
        
        // Información de ceremonia y recepción
        if (location.ceremony) {
            this.updateElement('#ceremonyName', location.ceremony.name || 'Ceremonia');
            this.updateElement('#ceremonyTime', location.ceremony.time || '');
        }
        
        if (location.reception) {
            this.updateElement('#receptionName', location.reception.name || 'Recepción');
            this.updateElement('#receptionTime', location.reception.time || '');
        }
    }
    
    /**
     * Aplica el itinerario
     */
    applySchedule() {
        const schedule = this.config.schedule || [];
        const itineraryContainer = document.getElementById('itineraryTimeline');
        
        if (itineraryContainer && schedule.length > 0) {
            itineraryContainer.innerHTML = '';
            
            schedule.forEach(item => {
                const itineraryItem = document.createElement('div');
                itineraryItem.className = 'itinerary-item';
                itineraryItem.innerHTML = `
                    <div class="itinerary-time">${item.time || ''}</div>
                    <div class="itinerary-content">
                        <h4>${item.title || ''}</h4>
                        <p>${item.description || ''}</p>
                    </div>
                `;
                itineraryContainer.appendChild(itineraryItem);
            });
            
            this.appliedElements.add('itineraryTimeline');
        }
    }
    
    /**
     * Aplica código de vestimenta
     */
    applyDressCode() {
        const dressCode = this.config.dressCode || {};
        
        this.updateElement('#dressCodeTitle', dressCode.title || 'Código de Vestimenta');
        this.updateElement('#dressCodeDescription', dressCode.description || '');
        this.updateElement('#dressCodeNote', dressCode.note || '');
    }
    
    /**
     * Aplica mensajes personalizables
     */
    applyMessages() {
        const messages = this.config.messages || {};
        
        this.updateElement('#heroSubtitle', messages.welcome || 'Nos casamos');
        this.updateElement('#rsvpTitle', messages.rsvpTitle || 'Confirma tu Asistencia');
        this.updateElement('#photoSectionTitle', messages.photoSectionTitle || 'Comparte tus Fotos');
        this.updateElement('#photoSectionSubtitle', messages.photoSectionSubtitle || 'Captura y comparte los momentos especiales de nuestro día');
    }
    
    /**
     * Aplica configuración de RSVP
     */
    applyRSVPConfig() {
        const rsvpForm = this.config.rsvpForm || {};
        const guests = this.config.guests || {};
        
        // Mostrar/ocultar campos según configuración
        const phoneGroup = document.getElementById('phoneGroup');
        if (phoneGroup) {
            phoneGroup.style.display = rsvpForm.showPhoneField ? 'block' : 'none';
            
            const phoneRequired = document.getElementById('phoneRequired');
            if (phoneRequired) {
                phoneRequired.style.display = rsvpForm.requirePhone ? 'inline' : 'none';
            }
        }
        
        const dietaryGroup = document.getElementById('dietaryGroup');
        if (dietaryGroup) {
            dietaryGroup.style.display = rsvpForm.showDietaryRestrictions ? 'block' : 'none';
        }
        
        // Nota de no niños
        const noChildrenNote = document.getElementById('noChildrenNote');
        const noChildrenMessage = document.getElementById('noChildrenMessage');
        
        if (noChildrenNote && guests.showNoChildrenNote && !guests.allowChildren) {
            noChildrenNote.style.display = 'block';
            if (noChildrenMessage) {
                noChildrenMessage.textContent = guests.noChildrenMessage || '';
            }
        }
    }
    
    /**
     * Aplica mesa de regalos
     */
    applyGiftRegistry() {
        const giftRegistry = this.config.giftRegistry || {};
        
        if (!giftRegistry.enabled) {
            const giftSection = document.getElementById('mesa-regalos');
            if (giftSection) {
                giftSection.style.display = 'none';
            }
            return;
        }
        
        this.updateElement('#giftRegistryTitle', giftRegistry.title || 'Mesa de Regalos');
        this.updateElement('#giftRegistrySubtitle', giftRegistry.subtitle || '');
        
        // Tiendas de regalos
        const giftStores = document.getElementById('giftStores');
        if (giftStores && giftRegistry.stores) {
            giftStores.innerHTML = '';
            
            giftRegistry.stores.forEach(store => {
                const storeElement = document.createElement('div');
                storeElement.className = 'gift-store';
                storeElement.innerHTML = `
                    <div class="gift-store-card">
                        <div class="gift-store-icon">
                            <i class="${store.icon || 'fas fa-gift'}"></i>
                        </div>
                        <h3>${store.name || ''}</h3>
                        <p>${store.description || ''}</p>
                        <a href="${store.url || '#'}" target="_blank" class="btn btn-primary">
                            <i class="fas fa-external-link-alt"></i> Ver Mesa de Regalos
                        </a>
                    </div>
                `;
                giftStores.appendChild(storeElement);
            });
            
            this.appliedElements.add('giftStores');
        }
        
        // Información bancaria
        const bankInfo = document.getElementById('bankInfo');
        if (bankInfo && giftRegistry.bankAccount && giftRegistry.bankAccount.enabled) {
            bankInfo.style.display = 'block';
            
            this.updateElement('#bankTitle', giftRegistry.bankAccount.title || 'Transferencia Bancaria');
            this.updateElement('#bankDescription', giftRegistry.bankAccount.description || '');
            
            const bankDetails = document.getElementById('bankDetails');
            if (bankDetails && giftRegistry.bankAccount.details) {
                const details = giftRegistry.bankAccount.details;
                bankDetails.innerHTML = `
                    <p><strong>Banco:</strong> ${details.bank || ''}</p>
                    <p><strong>Titular:</strong> ${details.accountHolder || ''}</p>
                    <p><strong>Cuenta:</strong> ${details.accountNumber || ''}</p>
                    <p><strong>CLABE:</strong> ${details.clabe || ''}</p>
                `;
                this.appliedElements.add('bankDetails');
            }
        }
    }
    
    /**
     * Aplica configuración del carrusel
     */
    applyCarouselConfig() {
        const carouselSection = this.config.carouselSection || {};
        
        if (!carouselSection.enabled) {
            const carouselElement = document.getElementById('carousel');
            if (carouselElement) {
                carouselElement.style.display = 'none';
            }
            return;
        }
        
        this.updateElement('#carouselSectionTitle', carouselSection.title || 'Galería');
        this.updateElement('#carouselSectionSubtitle', carouselSection.subtitle || '');
        
        // Fotos del carrusel
        const carouselTrack = document.getElementById('carouselTrack');
        if (carouselTrack && carouselSection.photos && carouselSection.photos.length > 0) {
            carouselTrack.innerHTML = '';
            
            // Configurar slides del carrusel
            const photoCount = carouselSection.photos.length;
            
            carouselSection.photos.forEach((photo, index) => {
                const photoElement = document.createElement('div');
                photoElement.className = 'carousel-slide';
                photoElement.innerHTML = `
                    <img src="${photo.url || ''}" alt="${photo.alt || `Foto ${index + 1}`}" loading="lazy">
                    ${photo.caption ? `<div class="carousel-caption">${photo.caption}</div>` : ''}
                `;
                carouselTrack.appendChild(photoElement);
            });
            
            // Crear indicadores dinámicamente
            const indicators = document.getElementById('carouselIndicators');
            if (indicators) {
                indicators.innerHTML = '';
                for (let i = 0; i < photoCount; i++) {
                    const indicator = document.createElement('button');
                    indicator.className = 'carousel-indicator';
                    indicator.setAttribute('data-slide', i);
                    indicator.setAttribute('aria-label', `Ir al slide ${i + 1}`);
                    if (i === 0) {
                        indicator.classList.add('active');
                    }
                    indicators.appendChild(indicator);
                }
            }
            
            this.appliedElements.add('carouselTrack');
            console.log(`🎠 Carousel configured with ${photoCount} photos`);
        }
        
        // Controles del carrusel
        const carouselConfig = carouselSection.carousel || {};
        const prevButton = document.getElementById('carouselPrev');
        const nextButton = document.getElementById('carouselNext');
        const indicators = document.getElementById('carouselIndicators');
        
        if (prevButton && nextButton) {
            prevButton.style.display = carouselConfig.showNavigationButtons ? 'block' : 'none';
            nextButton.style.display = carouselConfig.showNavigationButtons ? 'block' : 'none';
        }
        
        if (indicators) {
            indicators.style.display = carouselConfig.showIndicators ? 'block' : 'none';
        }
    }
    
    /**
     * Aplica configuración de la sección de fotos
     */
    applyPhotoSection() {
        const photoSection = this.config.photoSection || {};
        
        if (!photoSection.enabled) {
            const photoElement = document.getElementById('fotos');
            if (photoElement) {
                photoElement.style.display = 'none';
            }
            return;
        }
        
        this.updateElement('#photoSectionTitle', photoSection.title || 'Comparte tus Fotos');
        this.updateElement('#photoSectionSubtitle', photoSection.subtitle || '');
        
        if (photoSection.showHashtag && this.config.couple?.hashtag) {
            this.updateElement('#hashtagDescription', photoSection.hashtagDescription || '');
        }
    }
    
    /**
     * Aplica tema y colores
     */
    applyTheme() {
        const theme = this.config.theme || {};
        
        if (theme.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
        }
        
        if (theme.secondaryColor) {
            document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
        }
        
        if (theme.accentColor) {
            document.documentElement.style.setProperty('--accent-color', theme.accentColor);
        }
        
        if (theme.textDark) {
            document.documentElement.style.setProperty('--text-dark', theme.textDark);
        }
        
        if (theme.textLight) {
            document.documentElement.style.setProperty('--text-light', theme.textLight);
        }
        
        console.log('🎨 Theme colors applied');
    }
    
    /**
     * Aplica imágenes desde la configuración
     */
    applyImages() {
        const images = this.config.images || {};
        
        // Imagen de fondo del hero
        if (images.heroBackground) {
            const heroSection = document.getElementById('inicio') || document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.style.backgroundImage = `url('${images.heroBackground}')`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
                heroSection.style.backgroundRepeat = 'no-repeat';
                this.appliedElements.add('hero-background');
                console.log(`🖼️ Hero background image applied: ${images.heroBackground}`);
            }
        }
        
        // Otras imágenes si es necesario
        if (images.ceremonyIcon) {
            const ceremonyIcons = document.querySelectorAll('.ceremony-icon');
            ceremonyIcons.forEach(icon => {
                icon.className = `ceremony-icon ${images.ceremonyIcon}`;
            });
        }
        
        if (images.receptionIcon) {
            const receptionIcons = document.querySelectorAll('.reception-icon');
            receptionIcons.forEach(icon => {
                icon.className = `reception-icon ${images.receptionIcon}`;
            });
        }
        
        console.log('🖼️ Images applied from configuration');
    }
    
    /**
     * Aplica configuración del mapa
     */
    applyMapConfig() {
        const map = this.config.map || {};
        
        // Iframe del mapa
        const mapIframe = document.getElementById('mapIframe');
        if (mapIframe && map.iframeSrc) {
            mapIframe.src = map.iframeSrc;
            this.appliedElements.add('mapIframe');
        }
        
        // Botón de direcciones
        const directionsButton = document.getElementById('directionsButton');
        if (directionsButton && map.directionsUrl) {
            directionsButton.onclick = () => window.open(map.directionsUrl, '_blank');
            this.appliedElements.add('directionsButton');
        }
    }
    
    /**
     * Actualiza un elemento del DOM
     * @param {string} selector - Selector del elemento
     * @param {string} content - Contenido a establecer
     */
    updateElement(selector, content) {
        const element = document.querySelector(selector);
        if (element && content !== null && content !== undefined) {
            element.textContent = content;
            this.appliedElements.add(selector);
            console.log(`📝 Updated ${selector}: ${content}`);
        }
    }
    
    /**
     * Obtiene configuración por defecto
     * @returns {Object}
     */
    getDefaultConfig() {
        return {
            couple: {
                displayName: 'Novio & Novia',
                groom: { name: 'Novio' },
                bride: { name: 'Novia' },
                hashtag: '#NuestraBoda'
            },
            event: {
                type: 'Nuestra Boda',
                dateDisplay: {
                    day: '01',
                    month: 'Enero',
                    year: '2026'
                }
            },
            messages: {
                welcome: 'Nos casamos'
            },
            theme: {
                primaryColor: '#d4a574',
                secondaryColor: '#8b7355',
                accentColor: '#f8f4e6'
            }
        };
    }
    
    /**
     * Obtiene la configuración actual
     * @returns {Object}
     */
    getConfig() {
        return this.config;
    }
    
    /**
     * Recarga la configuración y la aplica
     */
    async reloadConfiguration() {
        console.log('🔄 Reloading configuration...');
        
        this.loadConfiguration();
        await this.applyConfigurationToDOM();
        
        console.log('✅ Configuration reloaded');
    }
    
    /**
     * Destruye el servicio
     */
    destroy() {
        this.config = null;
        this.appliedElements.clear();
        this.isInitialized = false;
        
        console.log('🗑️ ConfigurationService destroyed');
    }
}
