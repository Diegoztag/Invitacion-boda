/**
 * Server Entry Point
 * Punto de entrada principal del servidor con Clean Architecture
 */

// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');

// Importar configuraciones y dependencias
const DIContainer = require('./shared/utils/DIContainer');
const Logger = require('./shared/utils/Logger');
const ValidationService = require('./shared/utils/ValidationService');

// Importar repositorios
const CsvInvitationRepository = require('./infrastructure/repositories/CsvInvitationRepository');
const CsvConfirmationRepository = require('./infrastructure/repositories/CsvConfirmationRepository');

// Importar casos de uso
const CreateInvitationUseCase = require('./application/usecases/CreateInvitationUseCase');
const GetInvitationUseCase = require('./application/usecases/GetInvitationUseCase');
const ConfirmAttendanceUseCase = require('./application/usecases/ConfirmAttendanceUseCase');
const GetConfirmationStatsUseCase = require('./application/usecases/GetConfirmationStatsUseCase');

// Importar controladores
const InvitationController = require('./presentation/controllers/InvitationController');
const ConfirmationController = require('./presentation/controllers/ConfirmationController');

// Importar configuración de rutas y middleware
const configureRoutes = require('./presentation/routes');
const configureMiddleware = require('./presentation/middleware');

// Importar servicios de infraestructura
const CsvStorage = require('./infrastructure/services/CsvStorage');
const SseService = require('./infrastructure/services/SseService');
const NotificationController = require('./presentation/controllers/NotificationController');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
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
        const logger = new Logger();
        
        // Registrar servicios básicos
        this.container.register('logger', () => logger, { singleton: true });
        this.container.register('validationService', () => new ValidationService(logger), { singleton: true });
        
        // Registrar servicios de infraestructura
        this.container.register('csvStorage', () => new CsvStorage(logger), { singleton: true });
        this.container.register('sseService', () => new SseService(logger), { singleton: true });
        
        // Registrar repositorios
        this.container.register('invitationRepository', () => {
            const csvStorage = this.container.resolve('csvStorage');
            const logger = this.container.resolve('logger');
            return new CsvInvitationRepository(csvStorage, logger);
        }, { singleton: true });
        
        this.container.register('confirmationRepository', () => {
            const csvStorage = this.container.resolve('csvStorage');
            const logger = this.container.resolve('logger');
            return new CsvConfirmationRepository(csvStorage, logger);
        }, { singleton: true });
        
        // Registrar casos de uso
        this.container.register('createInvitationUseCase', () => {
            const invitationRepository = this.container.resolve('invitationRepository');
            const validationService = this.container.resolve('validationService');
            const logger = this.container.resolve('logger');
            return new CreateInvitationUseCase(invitationRepository, validationService, logger);
        });
        
        this.container.register('getInvitationUseCase', () => {
            const invitationRepository = this.container.resolve('invitationRepository');
            const logger = this.container.resolve('logger');
            return new GetInvitationUseCase(invitationRepository, logger);
        });
        
        this.container.register('confirmAttendanceUseCase', () => {
            const invitationRepository = this.container.resolve('invitationRepository');
            const confirmationRepository = this.container.resolve('confirmationRepository');
            const validationService = this.container.resolve('validationService');
            const sseService = this.container.resolve('sseService');
            const logger = this.container.resolve('logger');
            return new ConfirmAttendanceUseCase(
                invitationRepository, 
                confirmationRepository, 
                validationService, 
                sseService,
                logger
            );
        });
        
        this.container.register('getConfirmationStatsUseCase', () => {
            const confirmationRepository = this.container.resolve('confirmationRepository');
            const invitationRepository = this.container.resolve('invitationRepository');
            const logger = this.container.resolve('logger');
            return new GetConfirmationStatsUseCase(confirmationRepository, invitationRepository, logger);
        });
        
        // Registrar controladores
        this.container.register('invitationController', () => {
            const createInvitationUseCase = this.container.resolve('createInvitationUseCase');
            const invitationRepository = this.container.resolve('invitationRepository');
            const validationService = this.container.resolve('validationService');
            const logger = this.container.resolve('logger');
            return new InvitationController(createInvitationUseCase, invitationRepository, validationService, logger);
        });
        
        this.container.register('confirmationController', () => {
            const confirmAttendanceUseCase = this.container.resolve('confirmAttendanceUseCase');
            const getConfirmationStatsUseCase = this.container.resolve('getConfirmationStatsUseCase');
            const confirmationRepository = this.container.resolve('confirmationRepository');
            const validationService = this.container.resolve('validationService');
            const logger = this.container.resolve('logger');
            return new ConfirmationController(
                confirmAttendanceUseCase, 
                getConfirmationStatsUseCase, 
                confirmationRepository, 
                validationService, 
                logger
            );
        });

        this.container.register('notificationController', () => {
            const sseService = this.container.resolve('sseService');
            const logger = this.container.resolve('logger');
            return new NotificationController(sseService, logger);
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
        
        // Configurar middleware personalizado
        const middleware = configureMiddleware({ validationService, logger });
        
        // Aplicar middleware global
        this.app.use(middleware.helmet);
        this.app.use(middleware.compression);
        this.app.use(middleware.cors);
        this.app.use(middleware.requestId);
        this.app.use(middleware.requestLogger);
        
        // Hacer logger disponible globalmente en la app
        this.app.locals.logger = logger;
        
        // Servir archivos estáticos del frontend con estructura modular
        this.app.use('/dashboard', express.static(path.join(__dirname, '../../frontend/dashboard')));
        this.app.use('/invitation', express.static(path.join(__dirname, '../../frontend/invitation')));
        this.app.use('/landing', express.static(path.join(__dirname, '../../frontend/landing')));
        
        // Servir archivos públicos compartidos (como config.js) desde la raíz
        this.app.use(express.static(path.join(__dirname, '../../frontend/public'), {
            setHeaders: (res, path) => {
                // Configurar MIME type correcto para archivos JavaScript
                if (path.endsWith('.js')) {
                    res.setHeader('Content-Type', 'text/javascript');
                }
            }
        }));
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
        const middleware = configureMiddleware({ validationService, logger });
        
        // Redirección de la raíz a landing (debe ir ANTES de las rutas principales)
        this.app.get('/', (req, res) => {
            res.redirect('/landing');
        });
        
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
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', {
                error: error.message,
                stack: error.stack
            });
            process.exit(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection', {
                reason: reason,
                promise: promise
            });
        });
        
        // Middleware de manejo de errores de Express
        this.app.use((error, req, res, next) => {
            logger.error('Express Error Handler', {
                requestId: req.id,
                error: error.message,
                stack: error.stack,
                path: req.path,
                method: req.method
            });
            
            if (res.headersSent) {
                return next(error);
            }
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                requestId: req.id
            });
        });
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
                
                console.log(`🚀 Servidor iniciado en puerto ${this.port} - Stats verificados`);
                console.log(`🏠 Inicio: http://localhost:${this.port} → /landing`);
                console.log(`🎯 Landing: http://localhost:${this.port}/landing`);
                console.log(`💌 Invitación: http://localhost:${this.port}/invitation`);
                console.log(`📊 Dashboard: http://localhost:${this.port}/dashboard`);
                console.log(`🔧 API: http://localhost:${this.port}/api`);
                console.log(`❤️  Health: http://localhost:${this.port}/health`);
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
        } catch (error) {
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
        
        return new Promise((resolve) => {
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
    server.start().catch(console.error);
    
    // Manejo graceful de shutdown
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully');
        await server.stop();
        process.exit(0);
    });
    
    process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down gracefully');
        await server.stop();
        process.exit(0);
    });
}

module.exports = Server;
// Force restart 5
