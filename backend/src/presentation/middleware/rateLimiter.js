const rateLimit = require('express-rate-limit');
const config = require('../../config');

const authLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

module.exports = {
    authLimiter
};
