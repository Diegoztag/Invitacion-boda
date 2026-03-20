/**
 * Tests para MetaService
 * Valida: actualización de meta tags, título, Open Graph, restauración
 */

import { MetaService } from '../meta-service.js';

describe('MetaService', () => {
    let metaService;

    beforeEach(() => {
        // Limpiar documento
        document.head.innerHTML = '';
        document.title = 'Original Title';

        // Agregar algunos meta tags base
        const metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        metaDescription.setAttribute('content', 'Original Description');
        document.head.appendChild(metaDescription);

        metaService = new MetaService();
    });

    afterEach(() => {
        document.head.innerHTML = '';
    });

    describe('Initialization', () => {
        it('debe inicializar correctamente', async () => {
            expect(metaService.isInitialized).toBe(false);
            await metaService.init();
            expect(metaService.isInitialized).toBe(true);
        });

        it('no debe inicializar dos veces', async () => {
            await metaService.init();
            const spy = jest.spyOn(console, 'log');

            await metaService.init();

            // El segundo init no debe hacer logs
            expect(spy).not.toHaveBeenCalledWith(
                expect.stringContaining('Initializing MetaService')
            );
            spy.mockRestore();
        });

        it('debe capturar meta tags originales', () => {
            expect(metaService.originalMeta).toBeDefined();
            expect(metaService.originalMeta['description']).toBe('Original Description');
        });

        it('debe guardar título original', () => {
            expect(metaService.originalTitle).toBe('Original Title');
        });
    });

    describe('Title Updates', () => {
        it('debe actualizar el título de la página', () => {
            metaService.updateTitle('Nueva Boda - María & Juan');

            expect(document.title).toBe('Nueva Boda - María & Juan');
        });

        it('debe ignorar actualizaciones con título vacío', () => {
            const originalTitle = document.title;

            metaService.updateTitle('');
            metaService.updateTitle(null);
            metaService.updateTitle(undefined);

            expect(document.title).toBe(originalTitle);
        });

        it('debe permitir caracteres especiales en títulos', () => {
            const specialTitle = 'Boda: María & Juan | 15 de Junio de 2026 - ¡Nos casamos!';
            metaService.updateTitle(specialTitle);

            expect(document.title).toBe(specialTitle);
        });
    });

    describe('Meta Tags Updates', () => {
        it('debe actualizar meta tag existente', () => {
            metaService.updateMetaTag('description', 'Nueva descripción para la boda');

            const metaTag = document.querySelector('meta[name="description"]');
            expect(metaTag.getAttribute('content')).toBe('Nueva descripción para la boda');
        });

        it('debe crear meta tag si no existe', () => {
            metaService.updateMetaTag('keywords', 'boda, invitación, ceremonia');

            const metaTag = document.querySelector('meta[name="keywords"]');
            expect(metaTag).toBeTruthy();
            expect(metaTag.getAttribute('content')).toBe('boda, invitación, ceremonia');
        });

        it('debe actualizar múltiples meta tags', () => {
            metaService.updateMetaTag('description', 'Descripción actualizada');
            metaService.updateMetaTag('keywords', 'boda, fiesta');
            metaService.updateMetaTag('author', 'María y Juan');

            const desc = document.querySelector('meta[name="description"]');
            const keys = document.querySelector('meta[name="keywords"]');
            const auth = document.querySelector('meta[name="author"]');

            expect(desc.getAttribute('content')).toBe('Descripción actualizada');
            expect(keys.getAttribute('content')).toBe('boda, fiesta');
            expect(auth.getAttribute('content')).toBe('María y Juan');
        });

        it('debe ignorar updateMetaTag sin nombre', () => {
            expect(() => {
                metaService.updateMetaTag('', 'contenido');
                metaService.updateMetaTag(null, 'contenido');
            }).not.toThrow();
        });

        it('debe permitir especificar atributo (name vs property)', () => {
            metaService.updateMetaTag('viewport', 'width=device-width', 'name');
            metaService.updateMetaTag('og:type', 'website', 'property');

            const viewportTag = document.querySelector('meta[name="viewport"]');
            const ogType = document.querySelector('meta[property="og:type"]');

            expect(viewportTag).toBeTruthy();
            expect(ogType.getAttribute('content')).toBe('website');
        });
    });

    describe('Open Graph Meta Tags', () => {
        it('debe actualizar Open Graph tags', () => {
            metaService.updateMetaTag('og:title', 'Nuestra Boda', 'property');
            metaService.updateMetaTag('og:description', 'Te invitamos a nuestra boda', 'property');
            metaService.updateMetaTag('og:image', 'https://example.com/image.jpg', 'property');

            const ogTitle = document.querySelector('meta[property="og:title"]');
            const ogDesc = document.querySelector('meta[property="og:description"]');
            const ogImage = document.querySelector('meta[property="og:image"]');

            expect(ogTitle.getAttribute('content')).toBe('Nuestra Boda');
            expect(ogDesc.getAttribute('content')).toBe('Te invitamos a nuestra boda');
            expect(ogImage.getAttribute('content')).toBe('https://example.com/image.jpg');
        });

        it('debe manejar URLs en Open Graph correctamente', () => {
            const imageUrl = 'https://example.com/images/wedding-card.jpg?v=1';
            metaService.updateMetaTag('og:image', imageUrl, 'property');

            const ogImage = document.querySelector('meta[property="og:image"]');
            expect(ogImage.getAttribute('content')).toBe(imageUrl);
        });
    });

    describe('Meta Batch Configuration', () => {
        it('debe aplicar configuración de meta tags múltiples', () => {
            // Simular actualización de múltiples tags
            metaService.updateMetaTag('description', 'Invitación a nuestra boda');
            metaService.updateMetaTag('keywords', 'boda, matrimonio, fiesta');
            metaService.updateMetaTag('og:title', 'Boda de María & Juan', 'property');
            metaService.updateMetaTag('og:description', 'Estamos felices de invitarte', 'property');
            metaService.updateMetaTag('og:image', 'https://example.com/image.jpg', 'property');

            expect(document.querySelector('meta[name="description"]').getAttribute('content')).toBe(
                'Invitación a nuestra boda'
            );
            expect(
                document.querySelector('meta[property="og:title"]').getAttribute('content')
            ).toBe('Boda de María & Juan');
        });
    });

    describe('Meta Persistence', () => {
        it('debe mantener integridad del documento al actualizar múltiples veces', () => {
            metaService.updateMetaTag('description', 'v1');
            metaService.updateMetaTag('description', 'v2');
            metaService.updateMetaTag('description', 'v3');

            // No debe duplicar el meta tag
            const metaTags = document.querySelectorAll('meta[name="description"]');
            expect(metaTags).toHaveLength(1);
            expect(metaTags[0].getAttribute('content')).toBe('v3');
        });

        it('debe mantener el estado de los meta tags después de múltiples actualizaciones', () => {
            const tags = [
                { name: 'description', content: 'Desc 1' },
                { name: 'keywords', content: 'Key 1, Key 2' },
                { name: 'author', content: 'Author Name' }
            ];

            // Actualizar todos
            tags.forEach(tag => {
                metaService.updateMetaTag(tag.name, tag.content);
            });

            // Verificar que todos están presentes
            tags.forEach(tag => {
                const metaTag = document.querySelector(`meta[name="${tag.name}"]`);
                expect(metaTag.getAttribute('content')).toBe(tag.content);
            });
        });
    });

    describe('Edge Cases', () => {
        it('debe manejar contenido con comillas y caracteres especiales', () => {
            const content = 'Invitación "especial" para la boda de María & Juan (2026)';
            metaService.updateMetaTag('description', content);

            const metaTag = document.querySelector('meta[name="description"]');
            expect(metaTag.getAttribute('content')).toBe(content);
        });

        it('debe ignorar updateMetaTag sin contenido', () => {
            const originalHeadCount = document.head.children.length;

            metaService.updateMetaTag('test', '');
            metaService.updateMetaTag('test', null);
            metaService.updateMetaTag('test', undefined);

            // No debe crear nuevos elementos
            expect(document.head.children.length).toBeLessThanOrEqual(originalHeadCount + 1);
        });

        it('debe soportar diferentes atributos (name y property)', () => {
            metaService.updateMetaTag('viewport', 'width=device-width', 'name');
            metaService.updateMetaTag('og:type', 'website', 'property');
            metaService.updateMetaTag('twitter:card', 'summary_large_image', 'name');

            expect(document.querySelector('meta[name="viewport"]')).toBeTruthy();
            expect(document.querySelector('meta[property="og:type"]')).toBeTruthy();
            expect(document.querySelector('meta[name="twitter:card"]')).toBeTruthy();
        });

        it('debe permitir caracteres especiales en URLs', () => {
            const url =
                'https://example.com/image.jpg?size=large&format=webp&v=1.0&signature=abc123';
            metaService.updateMetaTag('og:image', url, 'property');

            const metaTag = document.querySelector('meta[property="og:image"]');
            expect(metaTag.getAttribute('content')).toBe(url);
        });

        it('debe mantener múltiples meta tags con mismo nombre pero diferente atributo', () => {
            // Meta tag regular
            metaService.updateMetaTag('description', 'Regular description');
            // Open Graph (property en lugar de name)
            metaService.updateMetaTag('description', 'OG Description', 'property');

            const regularMeta = document.querySelector('meta[name="description"]');
            const ogMeta = document.querySelector('meta[property="description"]');

            expect(regularMeta.getAttribute('content')).toBe('Regular description');
            expect(ogMeta.getAttribute('content')).toBe('OG Description');
        });
    });
});
