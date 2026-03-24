import { DOMUtils } from '../dom-utils.js';

describe('DOMUtils', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = `
            <div id="test-element" class="foo"></div>
            <div class="list-item"></div>
        `;
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    });

    it('should find an element by ID', () => {
        const element = DOMUtils.getElementById('test-element');

        expect(element).not.toBeNull();
        expect(element.id).toBe('test-element');
    });

    it('should safely query selectors', () => {
        const element = DOMUtils.querySelector('.list-item', container);
        expect(element).not.toBeNull();

        const missing = DOMUtils.querySelector('.unknown', container);
        expect(missing).toBeNull();
    });

    it('should set text and innerHTML', () => {
        const element = DOMUtils.getElementById('test-element');
        DOMUtils.setTextContent(element, 'Hello');
        expect(element.textContent).toBe('Hello');

        DOMUtils.setInnerHTML(element, '<span>World</span>');
        expect(element.innerHTML).toBe('<span>World</span>');
    });

    it('should add/remove/toggle/has class', () => {
        const element = DOMUtils.getElementById('test-element');

        DOMUtils.addClass(element, 'bar');
        expect(element.classList.contains('bar')).toBe(true);

        DOMUtils.removeClass(element, 'bar');
        expect(element.classList.contains('bar')).toBe(false);

        const toggled = DOMUtils.toggleClass(element, 'baz');
        expect(toggled).toBe(true);
        expect(DOMUtils.hasClass(element, 'baz')).toBe(true);

        const toggledAgain = DOMUtils.toggleClass(element, 'baz');
        expect(toggledAgain).toBe(false);
        expect(DOMUtils.hasClass(element, 'baz')).toBe(false);
    });

    it('should show/hide/toggle element', () => {
        const element = DOMUtils.getElementById('test-element');

        DOMUtils.hide(element);
        expect(element.style.display).toBe('none');

        DOMUtils.show(element, 'inline');
        expect(element.style.display).toBe('inline');

        DOMUtils.toggle(element, 'block');
        expect(element.style.display).toBe('none');

        DOMUtils.toggle(element, 'block');
        expect(element.style.display).toBe('block');
    });

    it('should set/get/remove attributes', () => {
        const element = DOMUtils.getElementById('test-element');

        DOMUtils.setAttribute(element, 'data-test', '123');
        expect(DOMUtils.getAttribute(element, 'data-test')).toBe('123');

        DOMUtils.removeAttribute(element, 'data-test');
        expect(DOMUtils.getAttribute(element, 'data-test')).toBeNull();
    });
});
