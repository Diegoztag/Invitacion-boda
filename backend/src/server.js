/**
 * Server Entry Point
 * Punto de entrada principal del servidor con Clean Architecture
 */

// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// Cargar configuración centralizada
const config = require('./config');

// Importar dependencias
const DIContainer = require('./shared/utils/DIContainer');
const Logger = require('./shared/utils/Logger');
const ValidationService = require('./shared/utils/ValidationService');

// Importar repositorios
const CsvInvitationRepository = require('./infrastructure/repositories/CsvInvitationRepository');
const CsvConfirmationRepository = require('./infrastructure/repositories/CsvConfirmationRepository');

// Importar casos de uso
const CreateInvitationUseCase = require('./application/usecases/CreateInvitationUseCase');
const GetInvitationUseCase = require('./application/usecases/GetInvitationUseCase');
const GetInvitationsUseCase = require('./application/usecases/GetInvitationsUseCase');
const SearchInvitationsByNameUseCase = require('./application/usecases/SearchInvitationsByNameUseCase');
const RestoreInvitationUseCase = require('./application/usecases/RestoreInvitationUseCase');
const DeleteInvitationUseCase = require('./application/usecases/DeleteInvitationUseCase'); // Añadido
const ConfirmAttendanceUseCase = require('./application/usecases/ConfirmAttendanceUseCase');
const UpdateConfirmationUseCase = require('./application/usecases/UpdateConfirmationUseCase');
const CancelConfirmationUseCase = require('./application/usecases/CancelConfirmationUseCase');
const GetConfirmationStatsUseCase = require('./application/usecases/GetConfirmationStatsUseCase');
const GetConfirmationUseCase = require('./application/usecases/GetConfirmationUseCase');
const GetConfirmationsUseCase = require('./application/usecases/GetConfirmationsUseCase');
const SearchConfirmationsByNameUseCase = require('./application/usecases/SearchConfirmationsByNameUseCase');

// Importar controladores
const InvitationController = require('./presentation/controllers/InvitationController');
const ConfirmationController = require('./presentation/controllers/ConfirmationController');

// Importar configuración de rutas y middleware
const configureRoutes = require('./presentation/routes');
const configureMiddleware = require('./presentation/middleware');
const errorHandler = require('./presentation/middleware/errorHandler');

// Importar servicios de infraestructura
const CsvStorage = require('./infrastructure/services/CsvStorage');
const SseService = require('./infrastructure/services/SseService');
const NotificationController = require('./presentation/controllers/NotificationController');

class Server {
    constructor() {
        this.app = express();
        this.port = config.port; // definido en config/index.js
        this.container = new DIContainer();

        this.setupDependencies();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Configurar todas las dependencias en el contenedor DI
     */
    setupDependencies() {
        // 1. Instanciar dependencias base
        const logger = new Logger();
        const validationService = new ValidationService(config, logger);
        const csvStorage = new CsvStorage(logger);
        const sseService = new SseService(logger);

        // 2. Instanciar repositorios
        const invitationRepository = new CsvInvitationRepository(csvStorage, logger);
        const confirmationRepository = new CsvConfirmationRepository(csvStorage, logger);

        // 3. Instanciar casos de uso
        const createInvitationUseCase = new CreateInvitationUseCase(
            invitationRepository,
            validationService,
            config,
            logger
        );
        const confirmAttendanceUseCase = new ConfirmAttendanceUseCase(
            invitationRepository,
            confirmationRepository,
            validationService,
            sseService,
            logger
        );
        const updateConfirmationUseCase = new UpdateConfirmationUseCase(
            invitationRepository,
            confirmationRepository,
            validationService,
            sseService,
            logger
        );
        const cancelConfirmationUseCase = new CancelConfirmationUseCase(
            invitationRepository,
            confirmationRepository,
            logger
        );
        const getConfirmationStatsUseCase = new GetConfirmationStatsUseCase(
            confirmationRepository,
            invitationRepository,
            logger
        );
        const getConfirmationUseCase = new GetConfirmationUseCase(
            confirmationRepository,
            validationService,
            logger
        );
        const getConfirmationsUseCase = new GetConfirmationsUseCase(
            confirmationRepository,
            config,
            logger
        );
        const searchConfirmationsByNameUseCase = new SearchConfirmationsByNameUseCase(
            confirmationRepository,
            logger
        );
        const getInvitationUseCase = new GetInvitationUseCase(
            invitationRepository,
            validationService,
            logger
        );
        const getInvitationsUseCase = new GetInvitationsUseCase(
            invitationRepository,
            config,
            logger
        );
        const searchInvitationsByNameUseCase = new SearchInvitationsByNameUseCase(
            invitationRepository,
            logger
        );
        const restoreInvitationUseCase = new RestoreInvitationUseCase(
            invitationRepository,
            validationService,
            logger
        );
        const deleteInvitationUseCase = new DeleteInvitationUseCase(invitationRepository, logger); // Añadido

        // 4. Instanciar controladores
        const invitationController = new InvitationController(
            createInvitationUseCase,
            getInvitationUseCase,
            getInvitationsUseCase,
            searchInvitationsByNameUseCase,
            restoreInvitationUseCase,
            deleteInvitationUseCase, // Añadido
            invitationRepository,
            validationService,
            config,
            logger
        );
        const confirmationController = new ConfirmationController(
            confirmAttendanceUseCase,
            updateConfirmationUseCase,
            cancelConfirmationUseCase,
            getConfirmationStatsUseCase,
            getConfirmationUseCase,
            getConfirmationsUseCase,
            searchConfirmationsByNameUseCase,
            validationService,
            config,
            logger
        );
        const notificationController = new NotificationController(sseService, logger);

        // 5. Registrar en el contenedor (para compatibilidad con tests y otras partes)
        this.container.register('logger', () => logger, { singleton: true });
        this.container.register('validationService', () => validationService, { singleton: true });
        this.container.register('csvStorage', () => csvStorage, { singleton: true });
        this.container.register('sseService', () => sseService, { singleton: true });
        this.container.register('invitationRepository', () => invitationRepository, {
            singleton: true
        });
        this.container.register('confirmationRepository', () => confirmationRepository, {
            singleton: true
        });
        this.container.register('createInvitationUseCase', () => createInvitationUseCase, {
            singleton: true
        });
        this.container.register('confirmAttendanceUseCase', () => confirmAttendanceUseCase, {
            singleton: true
        });
        this.container.register('updateConfirmationUseCase', () => updateConfirmationUseCase, {
            singleton: true
        });
        this.container.register('cancelConfirmationUseCase', () => cancelConfirmationUseCase, {
            singleton: true
        });
        this.container.register('getConfirmationStatsUseCase', () => getConfirmationStatsUseCase, {
            singleton: true
        });
        this.container.register('getConfirmationUseCase', () => getConfirmationUseCase, {
            singleton: true
        });
        this.container.register('getConfirmationsUseCase', () => getConfirmationsUseCase, {
            singleton: true
        });
        this.container.register(
            'searchConfirmationsByNameUseCase',
            () => searchConfirmationsByNameUseCase,
            {
                singleton: true
            }
        );
        this.container.register('getInvitationUseCase', () => getInvitationUseCase, {
            singleton: true
        });
        this.container.register('getInvitationsUseCase', () => getInvitationsUseCase, {
            singleton: true
        });
        this.container.register(
            'searchInvitationsByNameUseCase',
            () => searchInvitationsByNameUseCase,
            {
                singleton: true
            }
        );
        this.container.register('restoreInvitationUseCase', () => restoreInvitationUseCase, {
            singleton: true
        });
        this.container.register('deleteInvitationUseCase', () => deleteInvitationUseCase, {
            // Añadido
            singleton: true
        });
        this.container.register('invitationController', () => invitationController, {
            singleton: true
        });
        this.container.register('confirmationController', () => confirmationController, {
            singleton: true
        });
        this.container.register('notificationController', () => notificationController, {
            singleton: true
        });
    }

    /**
     * Configurar middleware de Express
     */
    setupMiddleware() {
        const logger = this.container.resolve('logger');
        const validationService = this.container.resolve('validationService');

        // Middleware básico de Express
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());

        // Configurar middleware personalizado
        const middleware = configureMiddleware({ validationService, logger, config });

        // Registrar middleware en el contenedor para acceso en tests
        this.container.register('authMiddleware', () => middleware.authMiddleware, {
            singleton: true
        });

        // Aplicar middleware global
        this.app.use(middleware.helmet);
        this.app.use(middleware.compression);
        this.app.use(middleware.cors);
        this.app.use(middleware.requestId);
        this.app.use(middleware.requestLogger);

        // Hacer logger disponible globalmente en la app
        this.app.locals.logger = logger;

        // Servir archivos estáticos del frontend con estructura modular
        this.app.use(
            '/dashboard',
            express.static(path.join(__dirname, '../../frontend/dashboard'))
        );
        this.app.use(
            '/invitation',
            express.static(path.join(__dirname, '../../frontend/invitation'))
        );
        this.app.use('/landing', express.static(path.join(__dirname, '../../frontend/landing')));

        // Servir archivos públicos compartidos (como config.js) desde la raíz
        this.app.use(
            express.static(path.join(__dirname, '../../frontend/public'), {
                setHeaders: (res, filePath) => {
                    // Configurar MIME type correcto para archivos JavaScript
                    if (filePath.endsWith('.js')) {
                        res.setHeader('Content-Type', 'text/javascript');
                    }
                }
            })
        );
    }

    /**
     * Configurar rutas de la aplicación
     */
    setupRoutes() {
        const logger = this.container.resolve('logger');
        const validationService = this.container.resolve('validationService');

        // Obtener controladores
        const controllers = {
            invitationController: this.container.resolve('invitationController'),
            confirmationController: this.container.resolve('confirmationController'),
            notificationController: this.container.resolve('notificationController')
        };

        // Configurar middleware
        const middleware = configureMiddleware({ validationService, logger, config });

        // Redirección de la raíz a landing (debe ir ANTES de las rutas principales)
        this.app.get('/', (req, res) => {
            res.redirect('/landing');
        });

        // Ruta para obtener el token CSRF
        this.app.get('/api/csrf-token', middleware.csrfProtection, middleware.sendCsrfToken);

        // Configurar rutas principales
        const routes = configureRoutes(controllers, middleware);
        this.app.use('/', routes);

        // Rutas específicas para SPA
        this.app.get('/dashboard/*', (req, res) => {
            res.sendFile(path.join(__dirname, '../../frontend/dashboard/index.html'));
        });

        this.app.get('/invitation/*', (req, res) => {
            res.sendFile(path.join(__dirname, '../../frontend/invitation/index.html'));
        });

        this.app.get('/landing/*', (req, res) => {
            res.sendFile(path.join(__dirname, '../../frontend/landing/index.html'));
        });

        // Ruta de fallback para otras rutas
        this.app.get('*', (req, res) => {
            // Si es una ruta de API, devolver 404
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({
                    success: false,
                    error: 'Endpoint no encontrado'
                });
            }

            // Para rutas no reconocidas, redirigir a landing
            res.redirect('/landing');
        });
    }

    /**
     * Configurar manejo global de errores
     */
    setupErrorHandling() {
        const logger = this.container.resolve('logger');

        // Manejo de errores no capturados
        process.on('uncaughtException', error => {
            logger.error('Uncaught Exception', {
                error: error.message,
                stack: error.stack
            });
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, _promise) => {
            logger.error('Unhandled Rejection', {
                reason: reason
            });
        });

        // Middleware de manejo de errores de Express
        this.app.use(errorHandler);
    }

    /**
     * Iniciar el servidor
     */
    async start() {
        try {
            const logger = this.container.resolve('logger');

            // Verificar que los directorios de datos existan
            await this.ensureDataDirectories();

            // Inicializar repositorios
            await this.initializeRepositories();

            // Iniciar servidor HTTP
            this.server = this.app.listen(this.port, () => {
                logger.info('Server started successfully', {
                    port: this.port,
                    environment: process.env.NODE_ENV || 'development',
                    timestamp: new Date().toISOString()
                });
            });
        } catch (error) {
            const logger = this.container.resolve('logger');
            logger.error('Failed to start server', {
                error: error.message,
                stack: error.stack
            });
            process.exit(1);
        }
    }

    /**
     * Asegurar que los directorios de datos existan
     */
    async ensureDataDirectories() {
        const fs = require('fs').promises;
        const path = require('path');

        const dataDir = path.join(__dirname, '../../data');

        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
        }
    }

    /**
     * Inicializar repositorios
     */
    async initializeRepositories() {
        const logger = this.container.resolve('logger');

        try {
            // Inicializar el servicio de almacenamiento CSV
            const csvStorage = this.container.resolve('csvStorage');
            await csvStorage.initialize();

            const invitationRepository = this.container.resolve('invitationRepository');
            const confirmationRepository = this.container.resolve('confirmationRepository');

            // Verificar que los repositorios estén funcionando
            await invitationRepository.count();
            await confirmationRepository.count();

            logger.info('Repositories initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize repositories', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Detener el servidor gracefully
     */
    async stop() {
        const logger = this.container.resolve('logger');

        return new Promise(resolve => {
            if (this.server) {
                this.server.close(() => {
                    logger.info('Server stopped gracefully');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// Crear e iniciar servidor si este archivo es ejecutado directamente
if (require.main === module) {
    const server = new Server();
    server.start().catch();

    // Manejo graceful de shutdown
    process.on('SIGTERM', async () => {
        await server.stop();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        await server.stop();
        process.exit(0);
    });
}

module.exports = Server;
// Force restart 5
