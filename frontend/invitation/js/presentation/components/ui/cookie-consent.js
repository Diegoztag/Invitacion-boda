import { Component } from '../../../shared/base/component.js';
import { DOMUtils } from '../../../shared/utils/dom-utils.js';

export class CookieConsent extends Component {
    constructor() {
        super();
        this.consentKey = 'wedding_cookie_consent';
    }

    init() {
        if (!this.hasConsented()) {
            this.render();
            this.bindEvents();
        }
    }

    hasConsented() {
        return localStorage.getItem(this.consentKey) === 'true';
    }

    render() {
        const html = `
            <div id="cookie-consent-banner" class="cookie-consent-banner" role="dialog" aria-live="polite" aria-label="cookieconsent">
                <div class="cookie-consent-content">
                    <p data-i18n="cookies.message">Utilizamos cookies y almacenamiento local para mejorar tu experiencia, recordar tus preferencias (como el idioma y el tema) y gestionar tu confirmación de asistencia. Al continuar navegando, aceptas nuestro uso de cookies.</p>
                    <div class="cookie-consent-buttons">
                        <button id="btn-accept-cookies" class="btn btn-primary btn-sm" data-i18n="cookies.accept">Aceptar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.banner = document.getElementById('cookie-consent-banner');
    }

    bindEvents() {
        const acceptBtn = document.getElementById('btn-accept-cookies');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.acceptCookies());
        }
    }

    acceptCookies() {
        localStorage.setItem(this.consentKey, 'true');
        if (this.banner) {
            this.banner.classList.add('fade-out');
            setTimeout(() => {
                this.banner.remove();
            }, 500);
        }
    }
}
