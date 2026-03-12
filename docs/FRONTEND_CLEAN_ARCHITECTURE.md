# Frontend Clean Architecture - Sistema de Invitaciones de Boda

## 📋 Análisis del Estado Actual

### **Problemas Identificados en app.js (1,200+ líneas)**

- **Archivo monolítico** con múltiples responsabilidades
- **Función gigante**: `updateDynamicContent()` con 200+ líneas
- **Acoplamiento alto** entre funcionalidades
- **Código duplicado** en validaciones y manipulación DOM
- **Sin separación de responsabilidades**

---

## 🏗️ CLEAN ARCHITECTURE PROPUESTA

### **Principios de Diseño**

1. **Separación de Responsabilidades** - Una clase/módulo, una responsabilidad
2. **Inversión de Dependencias** - Depender de abstracciones, no de implementaciones
3. **Principio Abierto/Cerrado** - Abierto para extensión, cerrado para modificación
4. **Reutilización** - Componentes reutilizables y modulares
5. **Testabilidad** - Código fácil de testear

---

## 📁 ESTRUCTURA DE CARPETAS PROPUESTA

```
frontend/
├── js/
│   ├── app.js                     → Coordinador principal (100 líneas max)
│   ├── config/
│   │   ├── app-config.js          → Configuración de la aplicación
│   │   └── constants.js           → Constantes globales
│   ├── core/                      → Capa de dominio/negocio
│   │   ├── models/
│   │   │   ├── invitation.js      → Modelo de invitación
│   │   │   └── guest.js           → Modelo de invitado
│   │   ├── services/
│   │   │   ├── invitation-service.js    → Lógica de negocio de invitaciones
│   │   │   ├── meta-service.js          → Manejo de meta tags
│   │   │   └── validation-service.js    → Validaciones de negocio
│   │   └── interfaces/
│   │       ├── api-interface.js         → Interface para API
│   │       └── storage-interface.js     → Interface para almacenamiento
│   ├── infrastructure/            → Capa de infraestructura
│   │   ├── api/
│   │   │   ├── api-client.js      → Cliente HTTP
│   │   │   └── endpoints.js       → Definición de endpoints
│   │   ├── storage/
│   │   │   └── local-storage.js   → Manejo de localStorage
│   │   └── external/
│   │       ├── google-maps.js     → Integración Google Maps
│   │       └── service-worker.js  → Service Worker
│   ├── presentation/              → Capa de presentación
│   │   ├── controllers/
│   │   │   ├── app-controller.js        → Controlador principal
│   │   │   ├── navigation-controller.js → Navegación y scroll
│   │   │   ├── rsvp-controller.js       → Formulario RSVP
│   │   │   ├── content-controller.js    → Contenido dinámico
│   │   │   └── carousel-controller.js   → Carousel de fotos
│   │   ├── components/
│   │   │   ├── base/
│   │   │   │   ├── component.js         → Clase base para componentes
│   │   │   │   └── observable.js        → Patrón Observer
│   │   │   ├── ui/
│   │   │   │   ├── modal.js             → Componente modal
│   │   │   │   ├── countdown.js         → Timer cuenta regresiva
│   │   │   │   ├── loader.js            → Componente loader
│   │   │   │   └── form-validator.js    → Validador de formularios
│   │   │   └── sections/
│   │   │       ├── hero-section.js     → Sección hero
│   │   │       ├── event-section.js    → Sección de evento
│   │   │       ├── rsvp-section.js     → Sección RSVP
│   │   │       └── gift-section.js     → Sección regalos
│   │   └── views/
│   │       ├── main-view.js       → Vista principal
│   │       └── invitation-view.js → Vista de invitación personalizada
│   └── shared/                    → Utilidades compartidas
│       ├── utils/
│       │   ├── dom-utils.js       → Utilidades DOM
│       │   ├── date-utils.js      → Utilidades de fecha
│       │   ├── string-utils.js    → Utilidades de string
│       │   └── animation-utils.js → Utilidades de animación
│       ├── helpers/
│       │   ├── event-emitter.js   → Sistema de eventos
│       │   ├── debounce.js        → Función debounce
│       │   └── clipboard.js       → Utilidades clipboard
│       └── constants/
│           ├── events.js          → Constantes de eventos
│           ├── selectors.js       → Selectores CSS
│           └── messages.js        → Mensajes de la aplicación
```

---

## 🎯 RESPONSABILIDADES POR CAPA

### **1. CORE (Dominio/Negocio)**

**Responsabilidad**: Lógica de negocio pura, independiente de UI y frameworks

#### **Models**

```javascript
// core/models/invitation.js
export class Invitation {
    constructor(data) {
        this.code = data.code;
        this.guestNames = data.guestNames || [];
        this.numberOfPasses = data.numberOfPasses || 0;
        this.confirmed = data.confirmed || false;
        this.phone = data.phone || '';
    }

    isValid() {
        return this.code && this.guestNames.length > 0 && this.numberOfPasses > 0;
    }

    getDisplayName() {
        return this.guestNames.join(' y ');
    }
}
```

#### **Services**

```javascript
// core/services/invitation-service.js
export class InvitationService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async loadInvitation(code) {
        const data = await this.apiClient.getInvitation(code);
        return new Invitation(data);
    }

    async confirmAttendance(invitation, confirmationData) {
        return await this.apiClient.confirmInvitation(invitation.code, confirmationData);
    }
}
```

### **2. INFRASTRUCTURE (Infraestructura)**

**Responsabilidad**: Implementaciones concretas, APIs externas, almacenamiento

#### **API Client**

```javascript
// infrastructure/api/api-client.js
export class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async getInvitation(code) {
        const response = await fetch(`${this.baseUrl}/invitation/${code}`);
        if (!response.ok) throw new Error('Invitation not found');
        return response.json();
    }

    async confirmInvitation(code, data) {
        const response = await fetch(`${this.baseUrl}/invitation/${code}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }
}
```

### **3. PRESENTATION (Presentación)**

**Responsabilidad**: UI, interacciones del usuario, coordinación de vistas

#### **Controllers**

```javascript
// presentation/controllers/rsvp-controller.js
export class RSVPController {
    constructor(invitationService, formValidator) {
        this.invitationService = invitationService;
        this.formValidator = formValidator;
        this.form = null;
    }

    init() {
        this.form = document.getElementById('rsvpForm');
        this.setupEventListeners();
        this.configureFormFields();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        // ... otros event listeners
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.formValidator.validate(this.form)) {
            return;
        }

        const formData = this.extractFormData();
        await this.invitationService.confirmAttendance(this.invitation, formData);
    }
}
```

#### **Components**

```javascript
// presentation/components/base/component.js
export class Component {
    constructor(element) {
        this.element = element;
        this.events = new Map();
    }

    render() {
        throw new Error('render() must be implemented');
    }

    destroy() {
        this.events.clear();
        this.element = null;
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(handler);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(handler => handler(data));
        }
    }
}
```

```javascript
// presentation/components/ui/countdown.js
import { Component } from '../base/component.js';

export class CountdownComponent extends Component {
    constructor(element, targetDate) {
        super(element);
        this.targetDate = targetDate;
        this.interval = null;
    }

    render() {
        this.updateCountdown();
        this.interval = setInterval(() => this.updateCountdown(), 1000);
    }

    updateCountdown() {
        const now = new Date().getTime();
        const distance = this.targetDate.getTime() - now;

        if (distance < 0) {
            this.element.innerHTML = '<p class="countdown-ended">¡El gran día ha llegado!</p>';
            this.destroy();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        this.element.querySelector('#days').textContent = String(days).padStart(2, '0');
        this.element.querySelector('#hours').textContent = String(hours).padStart(2, '0');
        this.element.querySelector('#minutes').textContent = String(minutes).padStart(2, '0');
        this.element.querySelector('#seconds').textContent = String(seconds).padStart(2, '0');
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        super.destroy();
    }
}
```

### **4. SHARED (Compartido)**

**Responsabilidad**: Utilidades, helpers, constantes reutilizables

#### **Utils**

```javascript
// shared/utils/dom-utils.js
export class DOMUtils {
    static getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    }

    static setTextContent(elementId, text) {
        const element = this.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    static addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    }

    static removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    }

    static toggleClass(element, className) {
        if (element && className) {
            element.classList.toggle(className);
        }
    }
}
```

---

## 🔄 FLUJO DE DATOS Y DEPENDENCIAS

### **Dependency Injection Container**

```javascript
// config/di-container.js
export class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }

    register(name, factory, singleton = false) {
        this.services.set(name, { factory, singleton });
    }

    resolve(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service '${name}' not found`);
        }

        if (service.singleton) {
            if (!this.singletons.has(name)) {
                this.singletons.set(name, service.factory(this));
            }
            return this.singletons.get(name);
        }

        return service.factory(this);
    }
}
```

### **App Principal Refactorizado**

```javascript
// app.js (nuevo - 100 líneas max)
import { DIContainer } from './config/di-container.js';
import { AppController } from './presentation/controllers/app-controller.js';
import { setupDependencies } from './config/dependencies.js';

class WeddingApp {
    constructor() {
        this.container = new DIContainer();
        this.appController = null;
    }

    async init() {
        try {
            // Setup dependency injection
            setupDependencies(this.container);

            // Initialize main controller
            this.appController = this.container.resolve('appController');
            await this.appController.init();

            console.log('✅ Wedding App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Wedding App:', error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeddingApp();
    app.init();
});
```

---

## 📋 PLAN DE MIGRACIÓN PASO A PASO

### **FASE 1: Preparación (1 día)**

1. **Crear estructura de carpetas**
2. **Configurar dependency injection**
3. **Crear clases base y utilidades**
4. **Setup de constantes y configuración**

### **FASE 2: Extracción de Servicios (1 día)**

1. **Extraer InvitationService**
2. **Extraer MetaService**
3. **Extraer ValidationService**
4. **Crear ApiClient**

### **FASE 3: Componentes UI (1 día)**

1. **Crear CountdownComponent**
2. **Crear ModalComponent**
3. **Crear LoaderComponent**
4. **Crear FormValidator**

### **FASE 4: Controladores (1 día)**

1. **Crear NavigationController**
2. **Crear RSVPController**
3. **Crear ContentController**
4. **Crear CarouselController**

### **FASE 5: Integración y Testing (0.5 días)**

1. **Integrar todos los módulos**
2. **Testing funcional completo**
3. **Optimización de performance**
4. **Cleanup del código legacy**

---

## 🔧 CONFIGURACIÓN DE DEPENDENCIAS

### **Dependency Setup**

```javascript
// config/dependencies.js
import { ApiClient } from '../infrastructure/api/api-client.js';
import { InvitationService } from '../core/services/invitation-service.js';
import { MetaService } from '../core/services/meta-service.js';
import { ValidationService } from '../core/services/validation-service.js';
import { AppController } from '../presentation/controllers/app-controller.js';
import { NavigationController } from '../presentation/controllers/navigation-controller.js';
import { RSVPController } from '../presentation/controllers/rsvp-controller.js';
import { ContentController } from '../presentation/controllers/content-controller.js';
import { CarouselController } from '../presentation/controllers/carousel-controller.js';

export function setupDependencies(container) {
    // Infrastructure
    container.register('apiClient', c => new ApiClient(WEDDING_CONFIG.api.backendUrl), true);

    // Core Services
    container.register(
        'invitationService',
        c => new InvitationService(c.resolve('apiClient')),
        true
    );

    container.register('metaService', c => new MetaService(), true);

    container.register('validationService', c => new ValidationService(), true);

    // Controllers
    container.register('navigationController', c => new NavigationController());

    container.register(
        'rsvpController',
        c => new RSVPController(c.resolve('invitationService'), c.resolve('validationService'))
    );

    container.register('contentController', c => new ContentController(c.resolve('metaService')));

    container.register('carouselController', c => new CarouselController());

    // Main App Controller
    container.register(
        'appController',
        c =>
            new AppController(
                c.resolve('navigationController'),
                c.resolve('rsvpController'),
                c.resolve('contentController'),
                c.resolve('carouselController'),
                c.resolve('invitationService'),
                c.resolve('metaService')
            ),
        true
    );
}
```

---

## 📱 EJEMPLO DE IMPLEMENTACIÓN PRÁCTICA

### **1. Content Controller (Reemplaza updateDynamicContent)**

```javascript
// presentation/controllers/content-controller.js
import { DOMUtils } from '../../shared/utils/dom-utils.js';
import { Component } from '../components/base/component.js';

export class ContentController extends Component {
    constructor(metaService) {
        super(document.body);
        this.metaService = metaService;
        this.sections = new Map();
    }

    async init() {
        await this.initializeMetaTags();
        this.updateAllSections();
        this.initializeConditionalSections();
    }

    async initializeMetaTags() {
        await this.metaService.initializeMetaTags();
    }

    updateAllSections() {
        this.updateHeroSection();
        this.updateEventSection();
        this.updateDressCodeSection();
        this.updateItinerarySection();
        this.updateLocationSection();
        this.updateFooterSection();
    }

    updateHeroSection() {
        const config = WEDDING_CONFIG;

        // Apply hero background
        const heroSection = document.querySelector('.hero');
        if (heroSection && config.images?.heroBackground) {
            heroSection.style.backgroundImage = `url('${config.images.heroBackground}')`;
        }

        // Update nav logo
        this.updateNavLogo();

        // Update hero content
        DOMUtils.setTextContent('heroTitle', config.couple.displayName);
        DOMUtils.setTextContent('heroSubtitle', config.messages.welcome);
        DOMUtils.setTextContent('dateDay', config.event.dateDisplay.day);
        DOMUtils.setTextContent('dateMonth', config.event.dateDisplay.month);
        DOMUtils.setTextContent('dateYear', config.event.dateDisplay.year);
    }

    updateNavLogo() {
        const navLogo = document.querySelector('.nav-logo');
        if (!navLogo) return;

        if (WEDDING_CONFIG.navLogo?.custom) {
            navLogo.textContent = WEDDING_CONFIG.navLogo.text;
        } else {
            const bride = WEDDING_CONFIG.couple.bride.name.charAt(0);
            const groom = WEDDING_CONFIG.couple.groom.name.charAt(0);
            navLogo.textContent = `${bride} & ${groom}`;
        }
    }

    updateEventSection() {
        const config = WEDDING_CONFIG.location;

        DOMUtils.setTextContent('ceremonyName', config.ceremony.name);
        DOMUtils.setTextContent('ceremonyTime', config.ceremony.time);
        DOMUtils.setTextContent('ceremonyVenue', config.venue.name);
        DOMUtils.setTextContent('ceremonyAddress', config.venue.address);

        DOMUtils.setTextContent('receptionName', config.reception.name);
        DOMUtils.setTextContent('receptionTime', config.reception.time);
        DOMUtils.setTextContent('receptionVenue', config.venue.name);
        DOMUtils.setTextContent('receptionAddress', config.venue.address);
    }

    updateDressCodeSection() {
        const config = WEDDING_CONFIG.dressCode;

        DOMUtils.setTextContent('dressCodeTitle', config.title);
        DOMUtils.setTextContent('dressCodeDescription', config.description);

        // Handle optional dress code note
        const noteElement = DOMUtils.getElementById('dressCodeNote');
        if (noteElement) {
            if (config.note?.trim()) {
                noteElement.textContent = config.note;
                noteElement.style.display = 'block';
            } else {
                noteElement.style.display = 'none';
            }
        }

        // Handle no children note
        this.updateNoChildrenNote();
    }

    updateNoChildrenNote() {
        const noChildrenNote = DOMUtils.getElementById('noChildrenNote');
        const noChildrenMessage = DOMUtils.getElementById('noChildrenMessage');

        if (!noChildrenNote || !noChildrenMessage) return;

        const guestConfig = WEDDING_CONFIG.guests;
        const shouldShow =
            guestConfig?.allowChildren === false && guestConfig?.showNoChildrenNote === true;

        if (shouldShow) {
            const message =
                guestConfig.noChildrenMessage ||
                'Esperamos contar con su comprensión para que este sea un evento solo para adultos';
            noChildrenMessage.textContent = message;
            noChildrenNote.style.display = 'flex';
        } else {
            noChildrenNote.style.display = 'none';
        }
    }

    updateItinerarySection() {
        const timeline = DOMUtils.getElementById('itineraryTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';
        WEDDING_CONFIG.schedule.forEach(item => {
            const div = document.createElement('div');
            div.className = 'itinerary-item';
            div.innerHTML = `
                <div class="itinerary-dot"></div>
                <div class="itinerary-content">
                    <div class="itinerary-time">${item.time}</div>
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                </div>
            `;
            timeline.appendChild(div);
        });
    }

    updateLocationSection() {
        const config = WEDDING_CONFIG.location;

        DOMUtils.setTextContent('locationVenueName', config.venue.name);
        DOMUtils.setTextContent('locationAddress', config.venue.address);

        // Update map iframe
        const mapIframe = DOMUtils.getElementById('mapIframe');
        if (mapIframe) {
            mapIframe.src = WEDDING_CONFIG.map.iframeSrc;
        }
    }

    updateFooterSection() {
        const config = WEDDING_CONFIG;

        DOMUtils.setTextContent('footerNames', config.couple.displayName);
        DOMUtils.setTextContent(
            'footerDate',
            `${config.event.dateDisplay.day} de ${config.event.dateDisplay.month} del ${config.event.dateDisplay.year}`
        );
        DOMUtils.setTextContent('footerHashtag', config.couple.hashtag);
    }

    initializeConditionalSections() {
        this.handleCarouselSection();
        this.handlePhotoSection();
        this.handleGiftRegistrySection();
    }

    handleCarouselSection() {
        const carouselSection = DOMUtils.getElementById('carousel');
        const config = WEDDING_CONFIG.carouselSection;

        if (config?.enabled) {
            DOMUtils.setTextContent('carouselSectionTitle', config.title);
            DOMUtils.setTextContent('carouselSectionSubtitle', config.subtitle);
        } else {
            this.removeSectionAndNavLink(carouselSection, 'a[href="#carousel"]');
        }
    }

    handlePhotoSection() {
        const photoSection = DOMUtils.getElementById('fotos');
        const config = WEDDING_CONFIG.photoSection;

        if (config?.enabled) {
            DOMUtils.setTextContent('photoSectionTitle', config.title);
            DOMUtils.setTextContent('photoSectionSubtitle', config.subtitle);

            if (config.showHashtag) {
                DOMUtils.setTextContent('instagramHashtag', WEDDING_CONFIG.couple.hashtag);
                if (config.hashtagDescription) {
                    DOMUtils.setTextContent('hashtagDescription', config.hashtagDescription);
                }
            } else {
                const hashtagContainer = document.querySelector('.hashtag-container');
                hashtagContainer?.remove();
            }
        } else {
            this.removeSectionAndNavLink(photoSection, 'a[href="#fotos"]');
        }
    }

    handleGiftRegistrySection() {
        const giftSection = DOMUtils.getElementById('mesa-regalos');
        const config = WEDDING_CONFIG.giftRegistry;

        if (config?.enabled) {
            this.initializeGiftRegistry();
        } else {
            this.removeSectionAndNavLink(giftSection, 'a[href="#mesa-regalos"]');
        }
    }

    removeSectionAndNavLink(section, navSelector) {
        section?.remove();
        const navLink = document.querySelector(navSelector);
        navLink?.parentElement?.remove();
    }

    initializeGiftRegistry() {
        // Implementation moved to separate method for clarity
        // ... (existing gift registry logic)
    }
}
```

### **2. Navigation Controller (Reemplaza initNavigation)**

```javascript
// presentation/controllers/navigation-controller.js
import { Component } from '../components/base/component.js';
import { DOMUtils } from '../../shared/utils/dom-utils.js';
import { debounce } from '../../shared/helpers/debounce.js';

export class NavigationController extends Component {
    constructor() {
        super(document.getElementById('navbar'));
        this.navToggle = null;
        this.navMenu = null;
        this.navLinks = [];
        this.sections = [];
        this.isMenuOpen = false;
        this.lastScroll = 0;
    }

    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSmoothScroll();
        this.highlightNavigation(); // Initial call
    }

    initializeElements() {
        this.navToggle = DOMUtils.getElementById('navToggle');
        this.navMenu = DOMUtils.getElementById('navMenu');
        this.navLinks = Array.from(document.querySelectorAll('.nav-link'));
        this.sections = Array.from(document.querySelectorAll('section[id]'));
    }

    setupEventListeners() {
        // Mobile menu toggle
        this.navToggle?.addEventListener('click', this.toggleMobileMenu.bind(this));

        // Close menu on link click
        this.navLinks.forEach(link => {
            link.addEventListener('click', this.closeMobileMenu.bind(this));
        });

        // Close menu on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Scroll effects
        const debouncedScroll = debounce(this.handleScroll.bind(this), 10);
        window.addEventListener('scroll', debouncedScroll);

        // Highlight navigation
        const debouncedHighlight = debounce(this.highlightNavigation.bind(this), 50);
        window.addEventListener('scroll', debouncedHighlight);
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;

        DOMUtils.toggleClass(this.navToggle, 'active');
        DOMUtils.toggleClass(this.navMenu, 'active');
        DOMUtils.toggleClass(document.body, 'menu-open');

        document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    }

    closeMobileMenu() {
        if (!this.isMenuOpen) return;

        this.isMenuOpen = false;
        DOMUtils.removeClass(this.navToggle, 'active');
        DOMUtils.removeClass(this.navMenu, 'active');
        DOMUtils.removeClass(document.body, 'menu-open');
        document.body.style.overflow = '';
    }

    handleOutsideClick(event) {
        if (!this.isMenuOpen) return;

        const isClickInsideMenu = this.navMenu?.contains(event.target);
        const isClickOnToggle = this.navToggle?.contains(event.target);

        if (!isClickInsideMenu && !isClickOnToggle) {
            this.closeMobileMenu();
        }
    }

    handleScroll() {
        const currentScroll = window.pageYOffset;

        // Navbar shadow effect
        if (currentScroll > 100) {
            this.element.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            this.element.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        }

        // Add scrolled class
        if (currentScroll > 50) {
            DOMUtils.addClass(this.element, 'scrolled');
        } else {
            DOMUtils.removeClass(this.element, 'scrolled');
        }

        this.lastScroll = currentScroll;
    }

    highlightNavigation() {
        const scrollY = window.pageYOffset;
        const navbarHeight = this.element?.offsetHeight || 80;
        const buffer = 20;

        this.sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - navbarHeight - buffer;
            const sectionBottom = sectionTop + sectionHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionBottom) {
                this.navLinks.forEach(item => {
                    DOMUtils.removeClass(item, 'active');
                    if (item.getAttribute('href') === `#${sectionId}`) {
                        DOMUtils.addClass(item, 'active');
                    }
                });
            }
        });

        // Special case for last section
        const lastSection = this.sections[this.sections.length - 1];
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollY + windowHeight >= documentHeight - 10) {
            this.navLinks.forEach(item => {
                DOMUtils.removeClass(item, 'active');
                if (item.getAttribute('href') === `#${lastSection.getAttribute('id')}`) {
                    DOMUtils.addClass(item, 'active');
                }
            });
        }
    }

    initializeSmoothScroll() {
        this.navLinks.forEach(anchor => {
            anchor.addEventListener('click', this.handleSmoothScroll.bind(this));
        });
    }

    handleSmoothScroll(event) {
        event.preventDefault();
        const target = document.querySelector(event.target.getAttribute('href'));

        if (!target) return;

        // Immediately activate clicked nav link
        this.navLinks.forEach(link => DOMUtils.removeClass(link, 'active'));
        DOMUtils.addClass(event.target, 'active');

        // Calculate scroll position
        const navbarHeight = this.element?.offsetHeight || 80;
        const targetId = target.getAttribute('id');

        let offsetTop = targetId === 'inicio' ? 0 : target.offsetTop - navbarHeight;

        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });

        // Close mobile menu if open
        this.closeMobileMenu();
    }
}
```

---

## 🚀 BENEFICIOS DE LA ARQUITECTURA PROPUESTA

### **Antes vs Después**

| **Aspecto**                      | **Antes (app.js monolítico)** | **Después (Clean Architecture)** |
| -------------------------------- | ----------------------------- | -------------------------------- |
| **Líneas de código por archivo** | 1,200+ líneas                 | 50-150 líneas por módulo         |
| **Responsabilidades**            | Múltiples en un archivo       | Una por clase/módulo             |
| **Testabilidad**                 | Difícil de testear            | Fácil testing unitario           |
| **Mantenibilidad**               | Complejo modificar            | Cambios aislados                 |
| **Reutilización**                | Código duplicado              | Componentes reutilizables        |
| **Escalabilidad**                | Difícil agregar features      | Fácil extensión                  |
| **Debugging**                    | Difícil localizar errores     | Errores aislados por módulo      |

### **Métricas de Calidad**

- ✅ **Cohesión Alta**: Cada módulo tiene una responsabilidad clara
- ✅ **Acoplamiento Bajo**: Dependencias bien definidas
- ✅ **Principio DRY**: Sin código duplicado
- ✅ **Principio SOLID**: Aplicado en toda la arquitectura
- ✅ **Separación de Concerns**: UI, lógica y datos separados

---

## 📊 COMPARACIÓN DE COMPLEJIDAD

### **Función updateDynamicContent() Original**

```javascript
// ANTES: 200+ líneas monolíticas
function updateDynamicContent() {
    // Hero section (30 líneas)
    const heroSection = document.querySelector('.hero');
    if (heroSection && WEDDING_CONFIG.images && WEDDING_CONFIG.images.heroBackground) {
        heroSection.style.backgroundImage = `url('${WEDDING_CONFIG.images.heroBackground}')`;
    }
    // ... 170+ líneas más mezclando responsabilidades
}
```

### **Arquitectura Modular Nueva**

```javascript
// DESPUÉS: Responsabilidades separadas
class ContentController {
    updateAllSections() {
        this.updateHeroSection(); // 15 líneas
        this.updateEventSection(); // 10 líneas
        this.updateDressCodeSection(); // 12 líneas
        // ... métodos especializados
    }
}
```

---

## 🎯 ROADMAP DE IMPLEMENTACIÓN

### **Cronograma Detallado**

#### **Semana 1: Fundación**

- **Día 1**: Crear estructura de carpetas y DI container
- **Día 2**: Implementar clases base y utilidades
- **Día 3**: Extraer servicios core (Invitation, Meta, Validation)
- **Día 4**: Crear API client y infrastructure
- **Día 5**: Testing de servicios

#### **Semana 2: Componentes y Controllers**

- **Día 1**: Implementar componentes UI (Modal, Countdown, Loader)
- **Día 2**: Crear NavigationController
- **Día 3**: Crear ContentController
- **Día 4**: Crear RSVPController y CarouselController
- **Día 5**: Integración y testing

#### **Semana 3: Migración y Optimización**

- **Día 1**: Migrar app.js a nueva arquitectura
- **Día 2**: Testing funcional completo
- **Día 3**: Optimización de performance
- **Día 4**: Cleanup de código legacy
- **Día 5**: Documentación y deployment

---

## 🔍 CRITERIOS DE ÉXITO

### **Métricas Técnicas**

- [ ] **Reducción de complejidad**: De 1 archivo de 1,200 líneas a 15+ módulos de <150 líneas
- [ ] **Cobertura de tests**: Mínimo 80% de cobertura
- [ ] **Performance**: Tiempo de carga ≤ 2 segundos
- [ ] **Mantenibilidad**: Índice de mantenibilidad > 85

### **Métricas de Calidad**

- [ ] **Cohesión**: Cada módulo tiene una responsabilidad clara
- [ ] **Acoplamiento**: Dependencias explícitas y mínimas
- [ ] **Reutilización**: 0% código duplicado
- [ ] **Extensibilidad**: Nuevas features sin modificar código existente

---

## 📝 CONCLUSIONES

### **Impacto Esperado**

1. **Desarrollo más rápido**: Nuevas features en 50% menos tiempo
2. **Menos bugs**: Errores aislados por módulo
3. **Mejor colaboración**: Múltiples desarrolladores pueden trabajar en paralelo
4. **Código más limpio**: Fácil de leer y entender
5. **Escalabilidad**: Preparado para crecimiento futuro

### **Inversión vs Retorno**

- **Inversión**: 3 semanas de desarrollo
- **Retorno**: Reducción del 70% en tiempo de mantenimiento
- **ROI**: Positivo a partir del mes 2

### **Siguiente Paso Recomendado**

**Comenzar con FASE 1** del plan de migración, creando la estructura base y el sistema de dependency injection. Esto permitirá una transición gradual sin afectar la funcionalidad actual.

---

## 🔗 RECURSOS ADICIONALES

### **Patrones de Diseño Utilizados**

- **Dependency Injection**: Para gestión de dependencias
- **Observer Pattern**: Para comunicación entre componentes
- **Command Pattern**: Para acciones del usuario
- **Factory Pattern**: Para creación de componentes
- **Singleton Pattern**: Para servicios compartidos

### **Herramientas Recomendadas**

- **ESLint**: Para calidad de código
- **Jest**: Para testing unitario
- **Webpack**: Para bundling (opcional)
- **JSDoc**: Para documentación
- **Lighthouse**: Para auditoría de performance

---

_Este documento define la arquitectura completa para la refactorización del frontend principal, siguiendo los mismos principios exitosos aplicados en el admin panel._
