import csrf from 'csurf';

const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

const csrfMiddleware = (req, res, next) => {
    const isApiRoute = req.originalUrl.startsWith('/api/');

    if (isApiRoute) {
        return next();
    }

    return csrfProtection(req, res, next);
};

export default csrfMiddleware;
