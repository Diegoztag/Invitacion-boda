/**
 * Frontend Jest Setup
 * Global configuration for frontend tests
 */

import '@testing-library/jest-dom';

/**
 * Mock events.js globally for all tests
 */
jest.mock('./invitation/js/shared/constants/events.js', () => ({
    EVENTS: {
        NAVIGATION: {
            SECTION_CHANGED: 'navigation:section-changed',
            MENU_TOGGLED: 'navigation:menu-toggled',
            SCROLL_UPDATED: 'navigation:scroll-updated'
        },
        RSVP: {
            INVITATION_LOADED: 'rsvp:invitation-loaded',
            FORM_SUBMITTED: 'rsvp:form-submitted',
            VALIDATION_ERROR: 'rsvp:validation-error',
            CONFIRMATION_SUCCESS: 'rsvp:confirmation-success',
            CONFIRMATION_ERROR: 'rsvp:confirmation-error',
            BEFORE_SUBMIT: 'rsvp:before-submit',
            SUBMITTED: 'rsvp:submitted',
            SUBMIT_ERROR: 'rsvp:submit-error',
            FIELD_CHANGED: 'rsvp:field-changed',
            ERROR: 'rsvp:error'
        },
        FORM: {
            FIELD_VALIDATED: 'form:field-validated',
            VALID_SUBMIT: 'form:valid-submit',
            INVALID_SUBMIT: 'form:invalid-submit',
            VALIDATED: 'form:validated'
        },
        CONTENT: {
            LOADED: 'content:loaded',
            UPDATED: 'content:updated',
            ERROR: 'content:error'
        },
        CAROUSEL: {
            SLIDE_CHANGED: 'carousel:slide-changed',
            AUTOPLAY_STARTED: 'carousel:autoplay-started',
            AUTOPLAY_STOPPED: 'carousel:autoplay-stopped'
        },
        MODAL: {
            OPENED: 'modal:opened',
            CLOSED: 'modal:closed',
            BACKDROP_CLICKED: 'modal:backdrop-clicked'
        },
        COUNTDOWN: {
            UPDATED: 'countdown:updated',
            FINISHED: 'countdown:finished'
        },
        APP: {
            INITIALIZED: 'app:initialized',
            INVITATION_LOADED: 'app:invitation-loaded',
            ERROR: 'app:error',
            READY: 'app:ready'
        }
    }
}));

/**
 * Mock localStorage
 */
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

global.localStorage = localStorageMock;

/**
 * Mock fetch globally
 */
global.fetch = jest.fn();

/**
 * Mock window.matchMedia
 */
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }))
});

/**
 * Suppress console errors and warnings in tests (optional)
 */
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
                args[0].includes('Warning: ReactDOM.render'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});

/**
 * Reset all mocks before each test
 */
beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});
