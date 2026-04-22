/**
 * Logger Service
 * Servicio de logging con diferentes niveles y formatos
 * Sigue principios SOLID: Single Responsibility
 * Implementado con Winston
 */

const winston = require('winston');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile || false;
        this.filePath = options.filePath || './logs/app.log';
        this.format = options.format || 'json';
        this.serviceName = options.serviceName || 'wedding-app';

        // Configurar Winston
        const transports = [];

        if (this.enableConsole) {
            transports.push(
                new winston.transports.Console({
                    format:
                        this.format === 'json'
                            ? winston.format.combine(
                                  winston.format.timestamp(),
                                  winston.format.json()
                              )
                            : winston.format.combine(
                                  winston.format.colorize(),
                                  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                                  winston.format.printf(
                                      ({ level, message, timestamp, service, ...meta }) => {
                                          const metaStr = Object.keys(meta).length
                                              ? `\n${JSON.stringify(meta, null, 2)}`
                                              : '';
                                          return `[${timestamp}] ${level} [${service || this.serviceName}]: ${message}${metaStr}`;
                                      }
                                  )
                              )
                })
            );
        }

        if (this.enableFile) {
            transports.push(
                new winston.transports.File({
                    filename: this.filePath,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            );
        }

        this.winstonLogger = winston.createLogger({
            level: this.level,
            defaultMeta: { service: this.serviceName },
            transports: transports
        });
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
        this.log('silly', message, meta); // Winston usa 'silly' en lugar de 'trace'
    }

    /**
     * Método principal de logging
     * @param {string} level - Nivel del log
     * @param {string} message - Mensaje
     * @param {Object} meta - Metadatos
     * @private
     */
    log(level, message, meta = {}) {
        const logMeta = { ...meta };

        if (level === 'error' && meta.error instanceof Error) {
            logMeta.stack = meta.error.stack;
            logMeta.errorName = meta.error.name;
            logMeta.errorMessage = meta.error.message;
        }

        this.winstonLogger.log(level, message, logMeta);
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

        return (_result = {}, level = 'info') => {
            const duration = Date.now() - startTime;

            this.log(level, `Completed operation: ${operation}`, {
                operationId,
                operation,
                duration: `${duration}ms`,
                ..._result
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

        childLogger.winstonLogger = this.winstonLogger.child(context);

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
        this.level = level;
        this.winstonLogger.level = level;
    }

    /**
     * Verifica si un nivel está habilitado
     * @param {string} level - Nivel a verificar
     * @returns {boolean}
     */
    isLevelEnabled(level) {
        return this.winstonLogger.isLevelEnabled(level);
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
            this.error('Error cleaning old logs', {
                error
            });
        }
    }
}

module.exports = Logger;
