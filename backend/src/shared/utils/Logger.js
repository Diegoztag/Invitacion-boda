/**
 * Logger Service
 * Servicio de logging con diferentes niveles y formatos
 * Sigue principios SOLID: Single Responsibility
 */

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile || false;
        this.filePath = options.filePath || './logs/app.log';
        this.format = options.format || 'json';
        this.serviceName = options.serviceName || 'wedding-app';
        
        // Niveles de logging
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };

        // Colores para consola
        this.colors = {
            error: '\x1b[31m', // Rojo
            warn: '\x1b[33m',  // Amarillo
            info: '\x1b[36m',  // Cian
            debug: '\x1b[35m', // Magenta
            trace: '\x1b[37m', // Blanco
            reset: '\x1b[0m'
        };

        this.currentLevel = this.levels[this.level] || this.levels.info;
    }

    /**
     * Registra un mensaje de error
     * @param {string} message - Mensaje de error
     * @param {Object} meta - Metadatos adicionales
     */
    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    /**
     * Registra un mensaje de advertencia
     * @param {string} message - Mensaje de advertencia
     * @param {Object} meta - Metadatos adicionales
     */
    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    /**
     * Registra un mensaje informativo
     * @param {string} message - Mensaje informativo
     * @param {Object} meta - Metadatos adicionales
     */
    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    /**
     * Registra un mensaje de debug
     * @param {string} message - Mensaje de debug
     * @param {Object} meta - Metadatos adicionales
     */
    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    /**
     * Registra un mensaje de trace
     * @param {string} message - Mensaje de trace
     * @param {Object} meta - Metadatos adicionales
     */
    trace(message, meta = {}) {
        this.log('trace', message, meta);
    }

    /**
     * Método principal de logging
     * @param {string} level - Nivel del log
     * @param {string} message - Mensaje
     * @param {Object} meta - Metadatos
     * @private
     */
    log(level, message, meta = {}) {
        // Verificar si el nivel está habilitado
        if (this.levels[level] > this.currentLevel) {
            return;
        }

        const logEntry = this.createLogEntry(level, message, meta);

        if (this.enableConsole) {
            this.logToConsole(logEntry);
        }

        if (this.enableFile) {
            this.logToFile(logEntry);
        }
    }

    /**
     * Crea una entrada de log estructurada
     * @param {string} level - Nivel del log
     * @param {string} message - Mensaje
     * @param {Object} meta - Metadatos
     * @returns {Object}
     * @private
     */
    createLogEntry(level, message, meta) {
        const timestamp = new Date().toISOString();
        
        return {
            timestamp,
            level: level.toUpperCase(),
            service: this.serviceName,
            message,
            ...meta,
            // Agregar información del stack si es un error
            ...(level === 'error' && meta.error instanceof Error && {
                stack: meta.error.stack,
                errorName: meta.error.name,
                errorMessage: meta.error.message
            })
        };
    }

    /**
     * Registra en consola
     * @param {Object} logEntry - Entrada de log
     * @private
     */
    logToConsole(logEntry) {
        const { level, timestamp, message, service, ...meta } = logEntry;
        const color = this.colors[level.toLowerCase()] || this.colors.info;
        const reset = this.colors.reset;

        if (this.format === 'json') {
            console.log(JSON.stringify(logEntry, null, 2));
        } else {
            // Formato legible para humanos
            const metaStr = Object.keys(meta).length > 0 ? 
                `\n${JSON.stringify(meta, null, 2)}` : '';
            
            console.log(
                `${color}[${timestamp}] ${level} [${service}]: ${message}${reset}${metaStr}`
            );
        }
    }

    /**
     * Registra en archivo
     * @param {Object} logEntry - Entrada de log
     * @private
     */
    async logToFile(logEntry) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Crear directorio si no existe
            const logDir = path.dirname(this.filePath);
            await fs.mkdir(logDir, { recursive: true });
            
            // Escribir al archivo
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(this.filePath, logLine);
        } catch (error) {
            // Si falla el logging a archivo, al menos mostrar en consola
            console.error('Error writing to log file:', error);
            console.log('Original log entry:', logEntry);
        }
    }

    /**
     * Registra el inicio de una operación
     * @param {string} operation - Nombre de la operación
     * @param {Object} context - Contexto de la operación
     * @returns {Function} Función para registrar el fin de la operación
     */
    startOperation(operation, context = {}) {
        const startTime = Date.now();
        const operationId = this.generateOperationId();
        
        this.info(`Starting operation: ${operation}`, {
            operationId,
            operation,
            ...context
        });

        return (result = {}, level = 'info') => {
            const duration = Date.now() - startTime;
            
            this.log(level, `Completed operation: ${operation}`, {
                operationId,
                operation,
                duration: `${duration}ms`,
                ...result
            });
        };
    }

    /**
     * Registra una petición HTTP
     * @param {Object} req - Objeto request de Express
     * @param {Object} res - Objeto response de Express
     * @param {number} duration - Duración en ms
     */
    logHttpRequest(req, res, duration) {
        const { method, url, ip, headers } = req;
        const { statusCode } = res;
        
        const level = statusCode >= 400 ? 'warn' : 'info';
        
        this.log(level, `HTTP ${method} ${url}`, {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            ip,
            userAgent: headers['user-agent'],
            contentLength: res.get('content-length') || 0
        });
    }

    /**
     * Registra errores de base de datos
     * @param {string} operation - Operación que falló
     * @param {Error} error - Error ocurrido
     * @param {Object} context - Contexto adicional
     */
    logDatabaseError(operation, error, context = {}) {
        this.error(`Database operation failed: ${operation}`, {
            operation,
            error,
            ...context
        });
    }

    /**
     * Registra errores de validación
     * @param {string} field - Campo que falló la validación
     * @param {string} reason - Razón del fallo
     * @param {*} value - Valor que falló
     * @param {Object} context - Contexto adicional
     */
    logValidationError(field, reason, value, context = {}) {
        this.warn(`Validation failed for field: ${field}`, {
            field,
            reason,
            value: typeof value === 'object' ? JSON.stringify(value) : value,
            ...context
        });
    }

    /**
     * Registra eventos de seguridad
     * @param {string} event - Tipo de evento de seguridad
     * @param {Object} details - Detalles del evento
     */
    logSecurityEvent(event, details = {}) {
        this.warn(`Security event: ${event}`, {
            securityEvent: event,
            ...details
        });
    }

    /**
     * Registra métricas de rendimiento
     * @param {string} metric - Nombre de la métrica
     * @param {number} value - Valor de la métrica
     * @param {string} unit - Unidad de medida
     * @param {Object} context - Contexto adicional
     */
    logMetric(metric, value, unit = '', context = {}) {
        this.info(`Metric: ${metric}`, {
            metric,
            value,
            unit,
            ...context
        });
    }

    /**
     * Crea un logger hijo con contexto adicional
     * @param {Object} context - Contexto que se agregará a todos los logs
     * @returns {Logger}
     */
    child(context = {}) {
        const childLogger = new Logger({
            level: this.level,
            enableConsole: this.enableConsole,
            enableFile: this.enableFile,
            filePath: this.filePath,
            format: this.format,
            serviceName: this.serviceName
        });

        // Sobrescribir el método createLogEntry para incluir el contexto
        const originalCreateLogEntry = childLogger.createLogEntry.bind(childLogger);
        childLogger.createLogEntry = (level, message, meta) => {
            return originalCreateLogEntry(level, message, { ...context, ...meta });
        };

        return childLogger;
    }

    /**
     * Genera un ID único para operaciones
     * @returns {string}
     * @private
     */
    generateOperationId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Configura el nivel de logging
     * @param {string} level - Nuevo nivel
     */
    setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.level = level;
            this.currentLevel = this.levels[level];
        }
    }

    /**
     * Verifica si un nivel está habilitado
     * @param {string} level - Nivel a verificar
     * @returns {boolean}
     */
    isLevelEnabled(level) {
        return this.levels[level] <= this.currentLevel;
    }

    /**
     * Limpia los logs antiguos
     * @param {number} days - Días de antigüedad para limpiar
     */
    async cleanOldLogs(days = 30) {
        if (!this.enableFile) {
            return;
        }

        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const logDir = path.dirname(this.filePath);
            const files = await fs.readdir(logDir);
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            for (const file of files) {
                const filePath = path.join(logDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    this.info(`Deleted old log file: ${file}`);
                }
            }
        } catch (error) {
            this.error('Error cleaning old logs', { error });
        }
    }
}

module.exports = Logger;
