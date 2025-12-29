const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const messageQueue = require('./messageQueue');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.initialize();
    }

    async initialize() {
        try {
            // Create WhatsApp client with persistent session
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: path.join(__dirname, '../.wwebjs_auth')
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });

            // QR Code generation for first time authentication
            this.client.on('qr', (qr) => {
                console.log('\n📱 Escanea este código QR con WhatsApp:');
                qrcode.generate(qr, { small: true });
            });

            // Client ready
            this.client.on('ready', () => {
                console.log('✅ WhatsApp Web está listo!');
                this.isReady = true;
            });

            // Authentication successful
            this.client.on('authenticated', () => {
                console.log('✅ WhatsApp autenticado correctamente');
            });

            // Authentication failure
            this.client.on('auth_failure', (msg) => {
                console.error('❌ Error de autenticación:', msg);
            });

            // Disconnection
            this.client.on('disconnected', (reason) => {
                console.log('📵 WhatsApp desconectado:', reason);
                this.isReady = false;
                // Try to reconnect
                setTimeout(() => {
                    this.initialize();
                }, 5000);
            });

            // Initialize the client
            await this.client.initialize();
        } catch (error) {
            console.error('Error initializing WhatsApp:', error);
            this.isReady = false;
        }
    }

    // Format phone number for WhatsApp
    formatPhoneNumber(phone) {
        // Remove all non-numeric characters
        let cleaned = phone.replace(/\D/g, '');
        
        // If it starts with 52 (Mexico), ensure it's properly formatted
        if (cleaned.startsWith('52')) {
            return cleaned + '@c.us';
        }
        
        // If it's a 10-digit Mexican number, add country code
        if (cleaned.length === 10) {
            return '52' + cleaned + '@c.us';
        }
        
        // Otherwise, assume it's already properly formatted
        return cleaned + '@c.us';
    }

    // Send a message directly (internal use)
    async sendMessageDirect(phone, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp no está listo. Por favor espera a que se conecte.');
        }

        try {
            const chatId = this.formatPhoneNumber(phone);
            await this.client.sendMessage(chatId, message);
            return true;
        } catch (error) {
            console.error(`Error enviando mensaje a ${phone}:`, error);
            throw error;
        }
    }

    // Send a message (adds to queue)
    async sendMessage(phone, message, priority = false) {
        return new Promise((resolve, reject) => {
            const messageData = {
                phone,
                message,
                type: 'generic',
                sendFunction: async () => {
                    await this.sendMessageDirect(phone, message);
                }
            };

            // Listen for this specific message completion
            const handleSent = (sentMessage) => {
                if (sentMessage.phone === phone && sentMessage.message === message) {
                    messageQueue.removeListener('messageSent', handleSent);
                    messageQueue.removeListener('messageFailed', handleFailed);
                    resolve(true);
                }
            };

            const handleFailed = (failedMessage, error) => {
                if (failedMessage.phone === phone && failedMessage.message === message) {
                    messageQueue.removeListener('messageSent', handleSent);
                    messageQueue.removeListener('messageFailed', handleFailed);
                    reject(error);
                }
            };

            messageQueue.on('messageSent', handleSent);
            messageQueue.on('messageFailed', handleFailed);

            // Add to queue
            messageQueue.addToQueue(messageData);
        });
    }

    // Send confirmation message
    async sendConfirmation(phone, name) {
        const message = `¡Hola ${name}! 🎉

Hemos recibido tu confirmación de asistencia a nuestra boda. ¡Estamos muy felices de que nos acompañes en este día tan especial!

Si necesitas hacer algún cambio en tu confirmación, puedes hacerlo desde el mismo enlace de tu invitación.

¡Nos vemos pronto!
Con cariño,
${process.env.COUPLE_NAMES || 'Los novios'} 💑`;

        return this.sendMessage(phone, message);
    }

    // Send reminder message
    async sendReminder(phone, name, invitationUrl) {
        const message = `Hola ${name} 👋

Te recordamos que aún no hemos recibido tu confirmación de asistencia a nuestra boda.

Por favor, confirma tu asistencia lo antes posible usando el siguiente enlace:
${invitationUrl}

La fecha límite es el ${process.env.CONFIRMATION_DEADLINE || '1 de Febrero'}.

¡Esperamos contar con tu presencia!
${process.env.COUPLE_NAMES || 'Los novios'} 💕`;

        return this.sendMessage(phone, message);
    }

    // Send invitation with personalized link
    async sendInvitation(phone, name, invitationUrl) {
        const message = `¡Hola ${name}! 💌

Con mucha alegría queremos invitarte a nuestra boda. 

Hemos preparado una invitación digital especial para ti. Puedes verla y confirmar tu asistencia en el siguiente enlace:

${invitationUrl}

¡Esperamos celebrar este día tan especial contigo!

Con cariño,
${process.env.COUPLE_NAMES || 'Los novios'} 💑`;

        return this.sendMessage(phone, message);
    }

    // Send custom message
    async sendCustomMessage(phone, customMessage) {
        return this.sendMessage(phone, customMessage);
    }

    // Send multiple invitations (batch)
    async sendInvitationsBatch(invitations) {
        const messages = invitations.map(inv => ({
            phone: inv.phone,
            message: `¡Hola ${inv.name}! 💌

Con mucha alegría queremos invitarte a nuestra boda. 

Hemos preparado una invitación digital especial para ti. Puedes verla y confirmar tu asistencia en el siguiente enlace:

${inv.url}

¡Esperamos celebrar este día tan especial contigo!

Con cariño,
${process.env.COUPLE_NAMES || 'Los novios'} 💑`,
            type: 'invitation',
            name: inv.name,
            sendFunction: async () => {
                await this.sendMessageDirect(inv.phone, this.message);
            }
        }));

        messageQueue.addBatchToQueue(messages);
        
        return {
            queued: messages.length,
            status: messageQueue.getStatus()
        };
    }

    // Get queue status
    getQueueStatus() {
        return messageQueue.getStatus();
    }

    // Update queue configuration
    updateQueueConfig(config) {
        messageQueue.updateConfig(config);
        return messageQueue.getConfig();
    }

    // Send multiple reminders (batch)
    async sendRemindersBatch(reminders) {
        const messages = reminders.map(rem => ({
            phone: rem.phone,
            message: `Hola ${rem.name} 👋

Te recordamos que aún no hemos recibido tu confirmación de asistencia a nuestra boda.

Por favor, confirma tu asistencia lo antes posible usando el siguiente enlace:
${rem.url}

La fecha límite es el ${process.env.CONFIRMATION_DEADLINE || '1 de Febrero'}.

¡Esperamos contar con tu presencia!
${process.env.COUPLE_NAMES || 'Los novios'} 💕`,
            type: 'reminder',
            name: rem.name,
            code: rem.code,
            sendFunction: async function() {
                await this.sendMessageDirect(this.phone, this.message);
            }.bind(this)
        }));

        messageQueue.addBatchToQueue(messages);
        
        return {
            queued: messages.length,
            status: messageQueue.getStatus()
        };
    }

    // Check if service is connected
    isConnected() {
        return this.isReady;
    }

    // Get connection status
    getStatus() {
        return {
            connected: this.isReady,
            service: 'WhatsApp Web'
        };
    }

    // Disconnect client (for cleanup)
    async disconnect() {
        if (this.client) {
            await this.client.destroy();
            this.isReady = false;
            console.log('WhatsApp client disconnected');
        }
    }
}

// Export singleton instance
module.exports = new WhatsAppService();
