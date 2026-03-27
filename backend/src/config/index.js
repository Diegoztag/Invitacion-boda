/**
 * Configuration loader
 * Centraliza la lectura de variables de entorno con valores por defecto.
 */

require('dotenv').config();

const parseList = (value, defaultVal = []) => {
    if (!value) {
        return defaultVal;
    }
    return value
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length);
};

const config = {
    port: process.env.PORT || 3000,
    cors: {
        allowedOrigins: parseList(process.env.CORS_ALLOWED_ORIGINS, '') // coma separados
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000
    },
    auth: {
        requireAuth: process.env.DASHBOARD_REQUIRE_AUTH === 'true',
        type: process.env.DASHBOARD_AUTH_TYPE || 'basic',
        username: process.env.DASHBOARD_USERNAME || 'admin',
        password: process.env.DASHBOARD_PASSWORD || 'password'
    },
    guests: {
        targetTotal: parseInt(process.env.GUESTS_TARGET_TOTAL, 10) || 150,
        maxGuestsPerInvitation: parseInt(process.env.MAX_GUESTS_PER_INVITATION, 10) || 5
    },
    tables: {
        maxPassesPerTable: parseInt(process.env.MAX_PASSES_PER_TABLE, 10) || 10
    },
    validation: {
        pagination: {
            defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT, 10) || 10,
            maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT, 10) || 1000
        },
        invitation: {
            maxGuestNames: parseInt(process.env.INVITATION_MAX_GUEST_NAMES, 10) || 10,
            minPasses: 1,
            maxPasses: parseInt(process.env.INVITATION_MAX_PASSES, 10) || 20,
            maxChildren: parseInt(process.env.INVITATION_MAX_CHILDREN, 10) || 20,
            maxAdults: parseInt(process.env.INVITATION_MAX_ADULTS, 10) || 20,
            maxStaff: parseInt(process.env.INVITATION_MAX_STAFF, 10) || 20,
            maxTableNumber: parseInt(process.env.INVITATION_MAX_TABLE_NUMBER, 10) || 100,
            maxAssociatedPersons: parseInt(process.env.INVITATION_MAX_ASSOCIATED_PERSONS, 10) || 20,
            maxNotesLength: parseInt(process.env.INVITATION_MAX_NOTES_LENGTH, 10) || 500
        },
        confirmation: {
            maxAttendingNames: parseInt(process.env.CONFIRMATION_MAX_ATTENDING_NAMES, 10) || 20,
            maxSpecialAccommodationsLength:
                parseInt(process.env.CONFIRMATION_MAX_ACCOMMODATIONS_LENGTH, 10) || 200
        },
        security: {
            csrfMaxAge: parseInt(process.env.CSRF_MAX_AGE_MS, 10) || 3600000 // 1 hora
        },
        app: {
            generationMaxAttempts: parseInt(process.env.GENERATION_MAX_ATTEMPTS, 10) || 10
        }
    }
};

module.exports = config;
