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
    }
};

module.exports = config;
