const qrcode = require('qrcode-terminal');
const WEDDING_CONFIG = require('../../config');

class WhatsAppService {
    constructor() {
        this.isReady = false;
        this.messageQueue = [];
        this.isProcessingQueue = false;
        this.queueConfig = {
            messagesPerBatch: 5,
            delayBetweenMessages: 3000, // 3 seconds
            delayBetweenBatches: 30000  // 30 seconds
        };
        this.initialize();
    }

    async initialize() {
        console.log('\n📱 WhatsApp Service (Modo Simulación)');
        console.log('⚠️  NOTA: Este es un servicio simulado para desarrollo.');
        console.log('💡 Para producción, considera usar la API oficial de WhatsApp Business.\n');
        
        // Simular la generación de QR
        setTimeout(() => {
            console.log('📲 Simulando código QR para WhatsApp...\n');
            qrcode.generate('https://wa.me/qr/DEMO123456', { small: true });
            console.log('\n✅ WhatsApp simulado conectado exitosamente!');
            this.isReady = true;
        }, 2000);
    }

    async sendMessage(phone, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp no está listo. Por favor espera...');
        }

        // Simular envío de mensaje
        console.log(`📤 Simulando envío a ${phone}: ${message.substring(0, 50)}...`);
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`✅ Mensaje simulado enviado a ${phone}`);
        return { success: true, simulated: true };
    }

    async sendInvitation(phone, names, url) {
        const message = WEDDING_CONFIG.whatsapp.invitationMessage(names, 
            currentInvitation?.numberOfPasses || '2', url);
        return await this.sendMessage(phone, message);
    }

    async sendConfirmation(phone, name) {
        const message = `¡Hola ${name}! 🎉\n\nHemos recibido tu confirmación de asistencia.\n\n¡Te esperamos con mucho cariño!\n\n${WEDDING_CONFIG.couple.displayName}`;
        return await this.sendMessage(phone, message);
    }

    async sendReminder(phone, name, url) {
        const message = `¡Hola ${name}! 👋\n\nTe recordamos que aún no has confirmado tu asistencia a nuestra boda.\n\nPor favor, confírmanos lo antes posible en:\n${url}\n\nFecha límite: ${WEDDING_CONFIG.event.confirmationDeadline}\n\n¡Esperamos contar contigo! 💕\n${WEDDING_CONFIG.couple.displayName}`;
        return await this.sendMessage(phone, message);
    }

    // Batch sending methods
    async sendInvitationsBatch(invitations) {
        const queued = this.addToQueue(invitations.map(inv => ({
            type: 'invitation',
            phone: inv.phone,
            data: inv
        })));
        
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
        
        return { queued, total: this.messageQueue.length };
    }

    async sendRemindersBatch(reminders) {
        const queued = this.addToQueue(reminders.map(rem => ({
            type: 'reminder',
            phone: rem.phone,
            data: rem
        })));
        
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
        
        return { queued, total: this.messageQueue.length };
    }

    addToQueue(messages) {
        const added = messages.length;
        this.messageQueue.push(...messages);
        return added;
    }

    async processQueue() {
        if (this.isProcessingQueue || this.messageQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        console.log(`\n🔄 Procesando cola de mensajes (${this.messageQueue.length} mensajes)...`);
        
        while (this.messageQueue.length > 0) {
            const batch = this.messageQueue.splice(0, this.queueConfig.messagesPerBatch);
            console.log(`\n📦 Procesando lote de ${batch.length} mensajes...`);
            
            for (const msg of batch) {
                try {
                    if (msg.type === 'invitation') {
                        await this.sendInvitation(msg.data.phone, msg.data.name, msg.data.url);
                    } else if (msg.type === 'reminder') {
                        await this.sendReminder(msg.data.phone, msg.data.name, msg.data.url);
                    }
                    
                    // Delay between messages
                    if (batch.indexOf(msg) < batch.length - 1) {
                        console.log(`⏳ Esperando ${this.queueConfig.delayBetweenMessages/1000}s antes del siguiente mensaje...`);
                        await new Promise(resolve => setTimeout(resolve, this.queueConfig.delayBetweenMessages));
                    }
                } catch (error) {
                    console.error(`❌ Error enviando mensaje a ${msg.phone}:`, error.message);
                }
            }
            
            // Delay between batches
            if (this.messageQueue.length > 0) {
                console.log(`\n⏳ Esperando ${this.queueConfig.delayBetweenBatches/1000}s antes del siguiente lote...`);
                await new Promise(resolve => setTimeout(resolve, this.queueConfig.delayBetweenBatches));
            }
        }
        
        console.log('\n✅ Cola de mensajes procesada completamente');
        this.isProcessingQueue = false;
    }

    updateQueueConfig(config) {
        if (config.messagesPerBatch && config.messagesPerBatch >= 1 && config.messagesPerBatch <= 10) {
            this.queueConfig.messagesPerBatch = config.messagesPerBatch;
        }
        if (config.delayBetweenMessages && config.delayBetweenMessages >= 1000 && config.delayBetweenMessages <= 10000) {
            this.queueConfig.delayBetweenMessages = config.delayBetweenMessages;
        }
        if (config.delayBetweenBatches && config.delayBetweenBatches >= 10000 && config.delayBetweenBatches <= 60000) {
            this.queueConfig.delayBetweenBatches = config.delayBetweenBatches;
        }
        return this.queueConfig;
    }

    getQueueStatus() {
        return {
            pending: this.messageQueue.length,
            isProcessing: this.isProcessingQueue,
            config: this.queueConfig
        };
    }

    getStatus() {
        return {
            connected: this.isReady,
            mode: 'simulation',
            info: 'Servicio de WhatsApp en modo simulación'
        };
    }

    isConnected() {
        return this.isReady;
    }

    async disconnect() {
        console.log('👋 Desconectando servicio de WhatsApp simulado...');
        this.isReady = false;
    }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
