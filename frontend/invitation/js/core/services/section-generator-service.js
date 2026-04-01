/**
 * Servicio Generador de Secciones
 * Genera dinámicamente las secciones según la configuración
 */

export class SectionGeneratorService {
    constructor() {
        this.config = null;
        this.isInitialized = false;
        this.generatedSections = new Set();
    }

    /**
     * Inicializa el servicio
     */
    init() {
        if (this.isInitialized) {
            return;
        }

        this.config = window.WEDDING_CONFIG;

        if (!this.config) {
            return;
        }

        this.isInitialized = true;
    }

    /**
     * Genera las secciones habilitadas
     */
    generateEnabledSections() {
        if (!this.config) {
            return;
        }

        const sectionsConfig = this.getSectionsConfiguration();

        // Generar secciones habilitadas
        Object.entries(sectionsConfig).forEach(([sectionId, config]) => {
            if (config.enabled) {
                this.generateSection(sectionId, config);
            }
        });

        // Generar navegación solo para secciones habilitadas
        this.generateNavigation(sectionsConfig);
    }

    /**
     * Obtiene la configuración de las secciones
     */
    getSectionsConfiguration() {
        return {
            fotos: {
                enabled: this.config.photoSection?.enabled === true,
                generator: () => this.generatePhotoSection()
            },
            carousel: {
                enabled: this.config.carouselSection?.enabled !== false,
                generator: () => this.generateCarouselSection()
            },
            'mesa-regalos': {
                enabled: this.config.giftRegistry?.enabled !== false,
                generator: () => this.generateGiftRegistrySection()
            }
        };
    }

    /**
     * Genera una sección específica
     */
    generateSection(sectionId, config) {
        if (this.generatedSections.has(sectionId)) {
            return;
        }

        try {
            config.generator();
            this.generatedSections.add(sectionId);
        } catch (error) {
            console.error(`❌ Error generating section ${sectionId}:`, error);
        }
    }

    /**
     * Genera la sección de fotos/Instagram
     */
    generatePhotoSection() {
        const existingSection = document.getElementById('fotos');
        if (existingSection) {
            return; // Ya existe
        }

        const section = document.createElement('section');
        section.id = 'fotos';
        section.className = 'instagram-section section';

        section.innerHTML = `
            <div class="container">
                <h2 class="section-title" id="photoSectionTitle">${this.config.messages.photoSectionTitle}</h2>
                <p class="section-subtitle" id="photoSectionSubtitle">${this.config.messages.photoSectionSubtitle}</p>
                
                <!-- Instagram Hashtag -->
                <div class="hashtag-container">
                    <div class="hashtag-icon">
                        <i class="fab fa-instagram"></i>
                    </div>
                    <h3 class="hashtag-text" id="instagramHashtag">${this.config.couple.hashtag}</h3>
                    <p class="hashtag-description" id="hashtagDescription">${this.config.photoSection.hashtagDescription || '¡Usa este hashtag en Instagram para compartir tus fotos, videos y stories!'}</p>
                </div>
            </div>
        `;

        // Insertar antes del footer
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.parentNode.insertBefore(section, footer);
        } else {
            document.body.appendChild(section);
        }
    }

    /**
     * Genera la sección del carrusel
     */
    generateCarouselSection() {
        const existingSection = document.getElementById('carousel');
        if (existingSection) {
            return; // Ya existe
        }

        const section = document.createElement('section');
        section.id = 'carousel';
        section.className = 'carousel-section section';

        section.innerHTML = `
            <div class="container">
                <h2 class="section-title" id="carouselSectionTitle">${this.config.carouselSection.title}</h2>
                <p class="section-subtitle" id="carouselSectionSubtitle">${this.config.carouselSection.subtitle}</p>
                
                <!-- Photo Carousel -->
                <div class="photo-carousel-container" data-carousel>
                    <div class="photo-carousel">
                        <div class="carousel-track" id="carouselTrack">
                            <!-- Photos will be dynamically loaded from config.js -->
                        </div>
                    </div>
                    
                    <!-- Carousel Controls -->
                    ${
                        this.config.carouselSection.carousel.showNavigationButtons
                            ? `
                    <button class="carousel-control carousel-prev" id="carouselPrev">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="carousel-control carousel-next" id="carouselNext">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    `
                            : ''
                    }
                    
                    <!-- Carousel Indicators -->
                    ${
                        this.config.carouselSection.carousel.showIndicators
                            ? `
                    <div class="carousel-indicators" id="carouselIndicators">
                        <!-- Indicators will be dynamically generated -->
                    </div>
                    `
                            : ''
                    }
                </div>
            </div>
        `;

        // Insertar antes del footer
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.parentNode.insertBefore(section, footer);
        } else {
            document.body.appendChild(section);
        }
    }

    /**
     * Genera la sección de mesa de regalos
     */
    generateGiftRegistrySection() {
        const existingSection = document.getElementById('mesa-regalos');
        if (existingSection) {
            return; // Ya existe
        }

        const section = document.createElement('section');
        section.id = 'mesa-regalos';
        section.className = 'gift-registry section';

        // Generar HTML de las tiendas
        const storesHTML = this.generateGiftStoresHTML();

        section.innerHTML = `
            <div class="container">
                <h2 class="section-title" id="giftRegistryTitle">${this.config.giftRegistry.title}</h2>
                <p class="section-subtitle" id="giftRegistrySubtitle">${this.config.giftRegistry.subtitle}</p>
                
                <div class="gift-options">
                    <!-- Enlaces a tiendas -->
                    <div class="gift-stores" id="giftStores">
                        ${storesHTML}
                    </div>
                    
                    <!-- Información bancaria -->
                    ${
                        this.config.giftRegistry.bankAccount?.enabled
                            ? `
                    <div class="bank-info" id="bankInfo">
                        <div class="bank-card">
                            <div class="bank-icon">
                                <i class="fas fa-university"></i>
                            </div>
                            <h3 id="bankTitle">${this.config.giftRegistry.bankAccount.title}</h3>
                            <p id="bankDescription">${this.config.giftRegistry.bankAccount.description}</p>
                            <div class="bank-details" id="bankDetails">
                                ${this.generateBankDetailsHTML()}
                            </div>
                        </div>
                    </div>
                    `
                            : ''
                    }
                </div>
            </div>
        `;

        // Insertar antes del footer
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.parentNode.insertBefore(section, footer);
        } else {
            document.body.appendChild(section);
        }
    }

    /**
     * Genera el HTML de las tiendas de regalos
     */
    generateGiftStoresHTML() {
        if (!this.config.giftRegistry.stores || this.config.giftRegistry.stores.length === 0) {
            return '<p>No hay tiendas configuradas</p>';
        }

        return this.config.giftRegistry.stores
            .map(store => {
                if (store.url && store.url !== '#') {
                    // Tarjeta clickeable para tiendas con URL - Sin botón visible
                    return `
                    <a href="${store.url}" target="_blank" rel="noopener noreferrer" class="gift-store gift-store-link">
                        <div class="store-icon">
                            <i class="${store.icon}"></i>
                        </div>
                        <div class="store-info">
                            <h3 class="store-name">${store.name}</h3>
                            <p class="store-description">${store.description}</p>
                        </div>
                    </a>
                `;
                } else {
                    // Tarjeta no clickeable para opciones sin URL
                    return `
                    <div class="gift-store">
                        <div class="store-icon">
                            <i class="${store.icon}"></i>
                        </div>
                        <div class="store-info">
                            <h3 class="store-name">${store.name}</h3>
                            <span class="store-note">${store.description}</span>
                        </div>
                    </div>
                `;
                }
            })
            .join('');
    }

    /**
     * Genera el HTML de los detalles bancarios
     */
    generateBankDetailsHTML() {
        if (!this.config.giftRegistry.bankAccount?.details) {
            return '';
        }

        const details = this.config.giftRegistry.bankAccount.details;
        return Object.entries(details)
            .map(
                ([key, value]) => `
            <div class="bank-detail">
                <span class="detail-label">${key}:</span>
                <span class="detail-value">${value}</span>
            </div>
        `
            )
            .join('');
    }

    /**
     * Genera la navegación solo para secciones habilitadas
     */
    generateNavigation(sectionsConfig) {
        const navMenu = document.getElementById('navMenu');
        if (!navMenu) {
            return;
        }

        // Obtener enlaces existentes
        const existingLinks = navMenu.querySelectorAll('.nav-link');

        // Filtrar enlaces según configuración
        existingLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const sectionId = href.substring(1);

                // Verificar si la sección debe estar oculta
                if (sectionsConfig[sectionId] && !sectionsConfig[sectionId].enabled) {
                    const listItem = link.closest('li');
                    if (listItem) {
                        listItem.remove();
                    }
                }
            }
        });
    }

    /**
     * Verifica si una sección está habilitada
     */
    isSectionEnabled(sectionId) {
        const sectionsConfig = this.getSectionsConfiguration();
        return sectionsConfig[sectionId]?.enabled || false;
    }

    /**
     * Obtiene todas las secciones habilitadas
     */
    getEnabledSections() {
        const sectionsConfig = this.getSectionsConfiguration();
        return Object.entries(sectionsConfig)
            .filter(([, config]) => config.enabled)
            .map(([sectionId]) => sectionId);
    }

    /**
     * Obtiene todas las secciones deshabilitadas
     */
    getDisabledSections() {
        const sectionsConfig = this.getSectionsConfiguration();
        return Object.entries(sectionsConfig)
            .filter(([, config]) => !config.enabled)
            .map(([sectionId]) => sectionId);
    }

    /**
     * Regenera todas las secciones
     */
    regenerateAllSections() {
        // Limpiar secciones generadas
        this.generatedSections.clear();

        // Remover secciones existentes generadas dinámicamente
        const sectionsToRemove = ['fotos', 'carousel', 'mesa-regalos'];
        sectionsToRemove.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.remove();
            }
        });

        // Regenerar secciones
        this.generateEnabledSections();
    }

    /**
     * Actualiza la configuración y regenera secciones
     */
    updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.regenerateAllSections();
    }

    /**
     * Destruye el servicio
     */
    destroy() {
        this.config = null;
        this.generatedSections.clear();
        this.isInitialized = false;
    }
}
