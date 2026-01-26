/**
 * SseService
 * Servicio para manejar Server-Sent Events (SSE)
 */
class SseService {
    constructor(logger) {
        this.logger = logger;
        this.clients = new Set();
    }

    /**
     * Añadir un nuevo cliente a la lista de conexiones activas
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    addClient(req, res) {
        // Configurar headers para SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Para evitar buffering en Nginx si se usa
        });

        // Enviar comentario inicial para mantener conexión
        res.write(': connected\n\n');

        const clientId = Date.now();
        const newClient = {
            id: clientId,
            res
        };

        this.clients.add(newClient);

        this.logger.info(`SSE Client connected. Total clients: ${this.clients.size}`, { clientId });

        // Manejar cierre de conexión
        req.on('close', () => {
            this.clients.delete(newClient);
            this.logger.info(`SSE Client disconnected. Total clients: ${this.clients.size}`, { clientId });
        });
    }

    /**
     * Enviar notificación a todos los clientes conectados
     * @param {string} type - Tipo de evento
     * @param {Object} data - Datos a enviar
     */
    notify(type, data) {
        this.logger.info(`Broadcasting SSE event: ${type}`, { clientCount: this.clients.size });

        this.clients.forEach(client => {
            try {
                // Formato SSE:
                // event: nombre_evento
                // data: json_datos
                // \n\n
                client.res.write(`event: ${type}\n`);
                client.res.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (error) {
                this.logger.error('Error sending SSE to client', { 
                    clientId: client.id, 
                    error: error.message 
                });
                this.clients.delete(client);
            }
        });
    }
}

module.exports = SseService;
