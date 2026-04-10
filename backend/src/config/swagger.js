const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Invitación de Boda',
            version: '1.0.0',
            description: 'Documentación de la API para el sistema de invitaciones de boda'
        },
        servers: [
            {
                url: '/api',
                description: 'Servidor Principal'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./src/presentation/routes/*.js'] // Rutas a los archivos con anotaciones
};

const specs = swaggerJsdoc(options);

module.exports = specs;
